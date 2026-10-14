// History tab: sessions, per-lift charts, weekly volume vs target, PRs.
import { store } from './store.js';
import { getEx, muscleName, MUSCLES } from './exercises.js';
import {
  doneSessions, workSets, bestE1, topSet, usesLoad, wLabel, toDispW, unitW, weekVolume, targetBand,
  sessionsInWeek, allPRs, totalLoad, countSets, repUnit
} from './logic.js';
import { lineChart, bandBars, columnChart } from './charts.js';
import { ui, icon, openSheet, confirmSheet, toast } from './ui.js';
import { esc, fmtDate, fmtDur, fmtNum, isoDate, weekStart, addDays, round, parseISO } from './util.js';

const H = { tab: 'sessions', lift: null, metric: 'e1', week: 0 };

function tabs() {
  return `<div class="seg tabs">${[['sessions', 'Sessions'], ['lifts', 'Lifts'], ['volume', 'Volume'], ['prs', 'PRs']].map(([k, v]) =>
    `<button class="${H.tab === k ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('')}</div>`;
}

function sessionsView() {
  const list = doneSessions().reverse();
  if (!list.length) return '<div class="empty card">No workouts yet. Finish your first session — or load sample data in Settings.</div>';
  let out = '', wk = null;
  for (const s of list) {
    const w = weekStart(s.date);
    if (w !== wk) {
      wk = w;
      const n = sessionsInWeek(w).length;
      out += `<div class="week-label">Week of ${fmtDate(w, { month: 'short', day: 'numeric' })} <span>${n} session${n === 1 ? '' : 's'}</span></div>`;
    }
    out += `<button class="card sess" data-sess="${s.id}">
      <div class="sess-date"><b>${parseISO(s.date).getDate()}</b><small>${fmtDate(s.date, { weekday: 'short' })}</small></div>
      <div class="sess-main"><b>${esc(s.dayName)}${s.deload ? ' <i class="tag">deload</i>' : ''}</b>
        <small>${s.exercises.map(e => getEx(e.exId)?.name).filter(Boolean).slice(0, 3).map(esc).join(', ')}${s.exercises.length > 3 ? ` +${s.exercises.length - 3}` : ''}</small>
        <small class="muted">${fmtDur((s.end || s.start) - s.start)} · ${countSets(s)} sets · ${fmtNum(toDispW(totalLoad(s)))} ${unitW()}</small></div>
      ${s.prs ? `<span class="pr-badge">${icon('trophy')}${s.prs}</span>` : ''}
    </button>`;
  }
  return out;
}

function sessionSheet(id) {
  const s = store.d.sessions.find(x => x.id === id);
  if (!s) return;
  const sh = openSheet(`
    <p class="muted">${fmtDate(s.date, { weekday: 'long', month: 'long', day: 'numeric' })} · ${fmtDur(s.end - s.start)}${s.readiness ? ` · readiness ${s.readiness.score}` : ''}</p>
    <div class="facts"><div><small>Sets</small><b>${countSets(s)}</b></div><div><small>Volume</small><b>${fmtNum(toDispW(totalLoad(s)))} ${unitW()}</b></div><div><small>PRs</small><b>${s.prs || 0}</b></div></div>
    ${s.exercises.map(e => {
      const ex = getEx(e.exId);
      if (!ex) return '';
      return `<div class="hist-ex"><b>${esc(ex.name)}</b><ol>${workSets(e).map(st => `<li>${usesLoad(ex) ? wLabel(ex, st.w) + ' × ' : ''}${st.r}${repUnit(ex)} <small>RIR ${st.rir}</small>${st.pr ? ` <span class="pr-badge">${st.pr.join(' · ')}</span>` : ''}</li>`).join('')}</ol>${e.notes ? `<p class="tiny muted">“${esc(e.notes)}”</p>` : ''}</div>`;
    }).join('')}
    ${s.notes ? `<p class="muted">${esc(s.notes)}</p>` : ''}
    <button class="btn danger-ghost block" data-del>${icon('trash')} Delete session</button>`, { title: s.dayName, cls: 'tall' });
  sh.body.addEventListener('click', async e => {
    if (!e.target.closest('[data-del]')) return;
    if (!await confirmSheet('Delete this session permanently?', { ok: 'Delete', danger: true })) return;
    store.d.sessions = store.d.sessions.filter(x => x.id !== id);
    store.save(); sh.close(); toast('Session deleted'); ui.render();
  });
}

function liftOptions() {
  const count = {};
  for (const s of doneSessions()) for (const e of s.exercises) {
    const ex = getEx(e.exId);
    if (ex && ex.kind !== 'recovery') count[e.exId] = (count[e.exId] || 0) + 1;
  }
  return Object.entries(count).sort((a, b) => {
    const ka = getEx(a[0]).kind === 'compound' ? 1 : 0, kb = getEx(b[0]).kind === 'compound' ? 1 : 0;
    return kb - ka || b[1] - a[1];
  }).map(([id]) => id);
}

function liftsView() {
  const ids = liftOptions();
  if (!ids.length) return '<div class="empty card">Log some lifts to see progress charts.</div>';
  if (!H.lift || !ids.includes(H.lift)) H.lift = ids[0];
  const ex = getEx(H.lift);
  const load = usesLoad(ex);
  const pts = [];
  const rows = [];
  for (const s of doneSessions()) for (const e of s.exercises) {
    if (e.exId !== H.lift) continue;
    const ws = workSets(e);
    if (!ws.length) continue;
    const t = topSet(ws);
    const e1 = bestE1(ex, ws);
    const y = !load ? Math.max(...ws.map(x => x.r)) : H.metric === 'e1' ? toDispW(e1) : toDispW(t.w);
    pts.push({ x: s.start, y });
    rows.push({ s, ws, t, e1 });
  }
  const best = rows.reduce((m, r) => Math.max(m, r.e1), 0);
  const first = rows[0], last = rows[rows.length - 1];
  const delta = first && last && load ? round(toDispW(last.e1 - first.e1), 1) : 0;
  return `<div class="card">
    <label class="select"><span>Exercise</span><select id="lift-sel">${ids.map(id => `<option value="${id}" ${id === H.lift ? 'selected' : ''}>${esc(getEx(id).name)}</option>`).join('')}</select></label>
    ${load ? `<div class="seg sm">${[['e1', 'Est. 1RM'], ['top', 'Top set']].map(([k, v]) => `<button class="${H.metric === k ? 'on' : ''}" data-metric="${k}">${v}</button>`).join('')}</div>` : ''}
    ${lineChart(pts, { fmt: v => load ? `${round(v)}` : v })}
    <div class="facts">
      ${load ? `<div><small>Best e1RM</small><b>${round(toDispW(best))} ${unitW()}</b></div><div><small>Change</small><b class="${delta >= 0 ? 'ok-t' : 'warn-t'}">${delta >= 0 ? '+' : ''}${delta} ${unitW()}</b></div>` : `<div><small>Best reps</small><b>${Math.max(...rows.map(r => Math.max(...r.ws.map(x => x.r))))}</b></div>`}
      <div><small>Sessions</small><b>${rows.length}</b></div></div>
    <p class="tiny muted">e1RM = weight × (1 + reps/30) (Epley)${ex.bw ? ', includes bodyweight' : ''}.</p>
  </div>
  <div class="card"><h3>Recent</h3><ul class="hist-rows">${rows.slice(-8).reverse().map(r => `<li><span>${fmtDate(r.s.date, { month: 'short', day: 'numeric' })}</span><b>${r.ws.map(x => `${load ? toDispW(x.w) + '×' : ''}${x.r}`).join(', ')}</b>${load ? `<small>${round(toDispW(r.e1))}</small>` : ''}</li>`).join('')}</ul></div>`;
}

function volumeView() {
  const ws = addDays(weekStart(isoDate()), -7 * H.week);
  const v = weekVolume(ws);
  const pr = store.d.profile.priority;
  const rows = Object.keys(MUSCLES).map(m => { const [lo, hi] = targetBand(m); return { label: muscleName(m), value: v[m] || 0, lo, hi, prio: pr.includes(m) }; });
  const weeks = [];
  for (let i = 5; i >= 0; i--) {
    const w = addDays(weekStart(isoDate()), -7 * i);
    weeks.push({ label: fmtDate(w, { month: 'numeric', day: 'numeric' }), value: sessionsInWeek(w).reduce((n, s) => n + countSets(s), 0) });
  }
  const under = rows.filter(r => r.value < r.lo).map(r => r.label);
  return `<div class="card">
    <div class="week-nav"><button class="icon-btn" data-week="1" aria-label="Previous week">${icon('back')}</button>
      <div><b>${H.week === 0 ? 'This week' : H.week === 1 ? 'Last week' : `${H.week} weeks ago`}</b><small>${fmtDate(ws, { month: 'short', day: 'numeric' })} – ${fmtDate(addDays(ws, 6), { month: 'short', day: 'numeric' })}</small></div>
      <button class="icon-btn" data-week="-1" ${H.week === 0 ? 'disabled' : ''} aria-label="Next week">${icon('chev')}</button></div>
    ${bandBars(rows)}
    ${H.week > 0 && under.length ? `<p class="tiny warn-t">Under target: ${under.slice(0, 6).map(esc).join(', ')}</p>` : ''}
  </div>
  <div class="card"><h3>Hard sets per week</h3>${columnChart(weeks)}</div>`;
}

function prsView() {
  const list = allPRs().sort((a, b) => (b.e1Date || '').localeCompare(a.e1Date || ''));
  if (!list.length) return '<div class="empty card">PRs show up here as you log. Every e1RM, weight and rep record counts.</div>';
  return `<div class="card"><ul class="pr-table">${list.map(p => {
    const ex = getEx(p.exId);
    const load = usesLoad(ex);
    return `<li data-lift="${p.exId}"><div><b>${esc(ex.name)}</b><small>${p.count} sessions · last record ${fmtDate(p.e1Date || p.repsDate, { month: 'short', day: 'numeric' })}</small></div>
      <div class="pr-vals">${load ? `<span><small>e1RM</small><b>${round(toDispW(p.e1))}</b></span><span><small>Heaviest</small><b>${toDispW(p.w)}×${p.wReps}</b></span>` : `<span><small>Best</small><b>${p.reps}${repUnit(ex)}</b></span>`}</div></li>`;
  }).join('')}</ul></div>`;
}

export function renderHistory(root) {
  const body = { sessions: sessionsView, lifts: liftsView, volume: volumeView, prs: prsView }[H.tab]();
  root.innerHTML = tabs() + `<div class="hist-body">${body}</div>`;
  const sel = root.querySelector('#lift-sel');
  if (sel) sel.onchange = () => { H.lift = sel.value; ui.render(); };
  root.onclick = e => {
    const t = e.target;
    const tb = t.closest('[data-tab]');
    if (tb) { H.tab = tb.dataset.tab; return ui.render(); }
    const s = t.closest('[data-sess]');
    if (s) return sessionSheet(s.dataset.sess);
    const m = t.closest('[data-metric]');
    if (m) { H.metric = m.dataset.metric; return ui.render(); }
    const w = t.closest('[data-week]');
    if (w && !w.disabled) { H.week = Math.max(0, H.week + +w.dataset.week); return ui.render(); }
    const l = t.closest('[data-lift]');
    if (l) { H.lift = l.dataset.lift; H.tab = 'lifts'; return ui.render(); }
  };
}
