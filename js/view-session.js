// Active workout logger (Hevy/Strong-style set rows, rest timer, PRs, swaps).
import { store } from './store.js';
import { getEx, muscleName, EQUIP_LABEL } from './exercises.js';
import {
  usesLoad, wLabel, unitW, toDispW, fromDispW, stepWeight, snapWeight, repUnit, warmupHint, detectPR,
  alternatives, makeEntry, defaultItem, workSets, totalLoad, countSets, sessionVolume
} from './logic.js';
import { currentPlan } from './programs.js';
import { ui, icon, toast, confetti, openSheet, confirmSheet } from './ui.js';
import { startRest, stopRest, unlockAudio } from './timer.js';
import { figureSVG } from './anim.js';
import { openExerciseSheet, exercisePicker } from './view-library.js';
import { openFormCheck } from './formcheck.js';
import { esc, fmtClock, fmtDur, fmtNum, clamp, round } from './util.js';

let clockIv = null;
const S = { edit: null, notes: new Set() };

function tickClock() {
  const el = document.getElementById('elapsed');
  const s = store.d.active;
  if (!el || !s) { clearInterval(clockIv); clockIv = null; return; }
  el.textContent = fmtClock((Date.now() - s.start) / 1000);
}

function stepper(kind, val, unit, label) {
  return `<div class="stepper" aria-label="${label}">
    <button data-act="${kind}-" aria-label="Decrease ${label}">${icon('minus')}</button>
    <label><input data-act="${kind}" inputmode="decimal" enterkeyhint="done" value="${val}" aria-label="${label}"><small>${unit}</small></label>
    <button data-act="${kind}+" aria-label="Increase ${label}">${icon('plus')}</button></div>`;
}

function prBadges(st) {
  return st.pr && st.pr.length ? `<span class="pr-badge">${icon('trophy')}${st.pr.join(' · ')}</span>` : '';
}

function setHTML(ex, ei, st, j, current) {
  const load = usesLoad(ex);
  const u = repUnit(ex);
  const prev = st.prev ? `${wLabel(ex, st.prev.w)} × ${st.prev.r}${u}` : '—';
  if (st.done && S.edit !== `${ei}-${j}`) {
    return `<div class="set done" data-s="${j}">
      <span class="set-no">${j + 1}</span>
      <button class="set-sum" data-act="edit"><b>${load ? wLabel(ex, st.w) + ' × ' : ''}${st.r}${u || ' reps'}</b><small>RIR ${st.rir === 4 ? '4+' : st.rir}</small>${prBadges(st)}</button>
      <button class="check on" data-act="done" aria-label="Undo set">${icon('check')}</button></div>`;
  }
  const wUnit = ex.eq === 'bw' ? `+${unitW()}` : unitW();
  return `<div class="set open ${current ? 'current' : ''} ${st.done ? 'done editing' : ''}" data-s="${j}">
    <div class="set-top"><span class="set-no">${j + 1}</span><span class="set-prev">Prev <b>${prev}</b></span>
      <button class="check ${st.done ? 'on' : ''}" data-act="done" aria-label="Complete set ${j + 1}">${icon('check')}</button></div>
    <div class="set-main">
      ${load ? stepper('w', toDispW(st.w), wUnit, 'weight') : ''}
      ${stepper('r', st.r, u || 'reps', u === 's' ? 'seconds' : u === 'min' ? 'minutes' : 'reps')}
    </div>
    ${ex.kind === 'recovery' ? '' : `<div class="rir-row"><span>RIR</span>${[0, 1, 2, 3, 4].map(v => `<button class="rir ${st.rir === v ? 'on' : ''}" data-act="rir" data-v="${v}">${v === 4 ? '4+' : v}</button>`).join('')}</div>`}
  </div>`;
}

function entryHTML(e, i) {
  const ex = getEx(e.exId);
  const done = e.sets.filter(x => x.done).length;
  const firstOpen = e.sets.findIndex(x => !x.done);
  const u = repUnit(ex);
  const warm = done === 0 && e.sets[0] ? warmupHint(ex, e.sets[0].w) : '';
  const t = e.target;
  return `<article class="card ex-card ${done && done === e.sets.length ? 'complete' : ''}" data-e="${i}">
    ${e.ss ? `<div class="ss-tag">${icon('bolt')} Superset ${esc(e.ss)}</div>` : ''}
    <header class="ex-head">
      <button class="ex-fig" data-act="info" aria-label="Exercise info">${figureSVG(ex.pattern, { size: 52 })}</button>
      <button class="ex-title" data-act="info"><h3>${esc(ex.name)}</h3><span class="muscles">${ex.pri.map(muscleName).join(' · ') || 'Recovery'} · ${EQUIP_LABEL[ex.eq]}</span></button>
      <button class="icon-btn" data-act="swap" aria-label="Swap exercise">${icon('swap')}</button>
      <button class="icon-btn" data-act="menu" aria-label="More">⋯</button>
    </header>
    <div class="sugg">${e.sugg.prevText ? `<span>Last <b>${esc(e.sugg.prevText)}</b></span><span class="arrow">→</span>` : ''}<span class="next">${esc(e.sugg.text)}</span></div>
    ${e.sugg.note ? `<div class="sugg-note ${e.sugg.stalled ? 'warn' : ''}">${esc(e.sugg.note)}</div>` : ''}
    <div class="target-row"><span>${t.sets} × ${t.reps[0]}–${t.reps[1]}${u}</span>${ex.kind === 'recovery' ? '' : `<span>RIR ${t.rir}</span>`}${t.rest ? `<span>${icon('timer')} ${fmtClock(t.rest)}</span>` : ''}</div>
    ${warm ? `<div class="warm">${icon('flame')} ${esc(warm)}</div>` : ''}
    <div class="sets">${e.sets.map((st, j) => setHTML(ex, i, st, j, j === firstOpen)).join('')}</div>
    <div class="ex-foot">
      <button class="btn-text" data-act="addset">${icon('plus')} Set</button>
      <button class="btn-text" data-act="delset" ${e.sets.length <= 1 ? 'disabled' : ''}>${icon('minus')} Set</button>
      <button class="btn-text" data-act="note">${icon('note')} Note</button>
      <button class="btn-text" data-act="form">${icon('camera')} Form</button>
    </div>
    <textarea class="ex-note" data-act="notes" aria-label="Exercise notes" placeholder="Notes for next time…" ${e.notes || S.notes.has(i) ? '' : 'hidden'}>${esc(e.notes)}</textarea>
  </article>`;
}

export function renderSession(root) {
  const s = store.d.active;
  const total = s.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = s.exercises.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);
  root.innerHTML = `
    <div class="session-head">
      <div><small>${s.deload ? 'Deload · ' : ''}${s.generated ? 'Generated' : 'In progress'}</small><h2>${esc(s.dayName)}</h2></div>
      <div class="sh-clock"><span id="elapsed">${fmtClock((Date.now() - s.start) / 1000)}</span><small>${done}/${total} sets</small></div>
      <button class="btn primary sm" data-act="finish">Finish</button>
    </div>
    <div class="progress"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
    ${s.readiness ? `<div class="banner ${s.readiness.score < 2.6 ? 'warn' : s.readiness.score >= 3.6 ? 'ok' : ''}">Readiness ${s.readiness.score}/5 — ${s.readiness.score < 2.6 ? 'volume trimmed, +1 RIR' : s.readiness.score >= 3.6 ? 'primed: last isolation sets may go to failure' : 'train as planned'}</div>` : ''}
    ${s.deload ? '<div class="banner">Deload session: half the sets, same weights, stop at RIR 4.</div>' : ''}
    ${s.exercises.map(entryHTML).join('')}
    <button class="btn ghost block" data-act="add">${icon('plus')} Add exercise</button>
    <textarea class="session-note" data-act="snotes" aria-label="Session notes" placeholder="Session notes…">${esc(s.notes || '')}</textarea>
    <div class="btn-row"><button class="btn danger-ghost" data-act="discard">Discard</button><button class="btn primary" data-act="finish">Finish workout</button></div>`;
  if (!clockIv) clockIv = setInterval(tickClock, 1000);
  root.onclick = onClick;
  root.oninput = onInput;
  root.onchange = onChange;
}

function ctx(target) {
  const card = target.closest('[data-e]');
  const row = target.closest('[data-s]');
  const s = store.d.active;
  const ei = card ? +card.dataset.e : -1;
  const e = ei >= 0 ? s.exercises[ei] : null;
  const j = row ? +row.dataset.s : -1;
  return { s, ei, e, j, ex: e ? getEx(e.exId) : null, st: e && j >= 0 ? e.sets[j] : null };
}

function rerender() { store.save(); ui.render(); }

function repStep(ex) { return ex.unit === 'sec' ? 5 : 1; }

function setWeight(e, ex, j, w) {
  const old = e.sets[j].w;
  e.sets[j].w = w;
  for (let k = j + 1; k < e.sets.length; k++) if (!e.sets[k].done && e.sets[k].w === old) e.sets[k].w = w;
}

function earlierSets(s, exId, except) {
  const out = [];
  for (const e of s.exercises) if (e.exId === exId) for (const st of e.sets) if (st.done && st !== except) out.push(st);
  return out;
}

function onClick(ev) {
  const b = ev.target.closest('[data-act]');
  if (!b || b.tagName === 'TEXTAREA' || b.tagName === 'INPUT') return;
  unlockAudio();
  const a = b.dataset.act;
  const c = ctx(b);
  const { s, e, ex, st, j, ei } = c;
  switch (a) {
    case 'w-': case 'w+': setWeight(e, ex, j, stepWeight(ex, st.w, a === 'w+' ? 1 : -1)); return rerender();
    case 'r-': st.r = Math.max(0, st.r - repStep(ex)); return rerender();
    case 'r+': st.r = st.r + repStep(ex); return rerender();
    case 'rir': st.rir = +b.dataset.v; return rerender();
    case 'edit': S.edit = `${ei}-${j}`; return ui.render();
    case 'done': return toggleDone(c);
    case 'addset': {
      const last = e.sets[e.sets.length - 1];
      e.sets.push({ w: last ? last.w : 0, r: last ? last.r : e.target.reps[0], rir: last ? last.rir : e.target.rir, done: false, prev: null, ...(ex.bw ? { bw: last?.bw || store.d.profile.bw } : {}) });
      return rerender();
    }
    case 'delset': {
      const k = e.sets.map(x => x.done).lastIndexOf(false);
      e.sets.splice(k >= 0 ? k : e.sets.length - 1, 1);
      return rerender();
    }
    case 'note': S.notes.add(ei); ui.render(); { const t = document.querySelector(`[data-e="${ei}"] .ex-note`); if (t) t.focus(); } return;
    case 'info': return openExerciseSheet(e.exId);
    case 'form': return openFormCheck(e.exId);
    case 'swap': return swapSheet(ei);
    case 'menu': return menuSheet(ei);
    case 'add': return exercisePicker(id => { s.exercises.push(makeEntry(defaultItem(getEx(id)))); rerender(); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50); });
    case 'finish': return finishSession();
    case 'discard': return confirmSheet('Discard this workout? Logged sets will be lost.', { ok: 'Discard', danger: true }).then(ok => {
      if (!ok) return;
      store.d.active = null; stopRest(); store.save(); ui.render();
    });
  }
}

function toggleDone({ s, e, ex, st, ei, j }) {
  S.edit = null;
  if (st.done) { st.done = false; delete st.pr; return rerender(); }
  if (!(st.r > 0)) return toast('Enter at least one rep or a positive duration');
  st.done = true;
  st.t = Date.now();
  const pr = ex.kind === 'recovery' ? [] : detectPR(ex, st, s.start, earlierSets(s, e.exId, st));
  if (pr.length) {
    st.pr = pr;
    confetti();
    toast(`${icon('trophy')} <b>New ${pr.join(' + ')} PR</b><br>${esc(ex.name)} · ${usesLoad(ex) ? wLabel(ex, st.w) + ' × ' : ''}${st.r}`, { kind: 'pr', html: true, ms: 3200 });
  } else delete st.pr;
  if (store.d.settings.autoRest && e.target.rest) {
    const doneHere = e.sets.filter(y => y.done).length;
    const partner = e.ss ? s.exercises.find((x, k) => k !== ei && x.ss === e.ss && x.sets.some(y => !y.done) && x.sets.filter(y => y.done).length < doneHere) : null;
    if (partner) {
      toast(`Superset → ${getEx(partner.exId).name}`, { ms: 1800 });
    } else {
      const nextEntry = e.sets.some(y => !y.done) ? e : s.exercises.find(x => x.sets.some(y => !y.done));
      startRest(e.target.rest, `Rest · next: ${nextEntry ? getEx(nextEntry.exId).name : 'finish up!'}`);
    }
  }
  rerender();
}

function onInput(ev) {
  const t = ev.target;
  if (t.dataset.act === 'notes') { const { e } = ctx(t); e.notes = t.value; store.save(); }
  if (t.dataset.act === 'snotes') { store.d.active.notes = t.value; store.save(); }
}

function onChange(ev) {
  const t = ev.target;
  const a = t.dataset.act;
  if (a !== 'w' && a !== 'r') return;
  const c = ctx(t);
  const v = parseFloat(String(t.value).replace(',', '.'));
  if (!isFinite(v) || v < 0) { ui.render(); return; }
  if (a === 'w') setWeight(c.e, c.ex, c.j, snapWeight(c.ex, fromDispW(v)));
  else c.st.r = Math.round(v);
  rerender();
}

function swapSheet(ei) {
  const s = store.d.active;
  const e = s.exercises[ei];
  const alts = alternatives(e.exId);
  const sh = openSheet(`<p class="muted tiny">Equipment-valid alternatives hitting the same muscles. Subs listed first.</p>
    <div class="lib-list">${alts.map(x => `<button class="lib-row" data-pick="${x.id}"><span class="lib-fig">${figureSVG(x.pattern, { size: 44 })}</span>
      <span class="lib-txt"><b>${esc(x.name)}</b><small>${x.pri.map(muscleName).join(', ')} · ${EQUIP_LABEL[x.eq]}</small></span>${x.stretch ? '<i class="tag stretch">stretch</i>' : ''}</button>`).join('')}</div>`,
  { title: `Swap ${getEx(e.exId).name}`, cls: 'tall' });
  sh.body.addEventListener('click', ev => {
    const p = ev.target.closest('[data-pick]');
    if (!p) return;
    const nx = getEx(p.dataset.pick);
    const fresh = makeEntry({ exId: nx.id, sets: e.target.sets, reps: nx.reps, rir: e.target.rir, rest: e.target.rest, ss: e.ss });
    const done = e.sets.filter(x => x.done);
    if (done.length) {
      e.sets = done;
      fresh.sets = fresh.sets.slice(0, Math.max(1, e.target.sets - done.length));
      s.exercises.splice(ei + 1, 0, fresh);
    } else s.exercises[ei] = fresh;
    sh.close();
    toast(`Swapped to ${nx.name}`);
    rerender();
  });
}

function menuSheet(ei) {
  const s = store.d.active;
  const e = s.exercises[ei];
  const sh = openSheet(`<div class="menu">
      <button data-m="info">${icon('info')} Exercise info & cues</button>
      <button data-m="form">${icon('camera')} Form check</button>
      <button data-m="up" ${ei === 0 ? 'disabled' : ''}>↑ Move up</button>
      <button data-m="down" ${ei === s.exercises.length - 1 ? 'disabled' : ''}>↓ Move down</button>
      <button data-m="rm" class="danger-t">${icon('trash')} Remove exercise</button></div>`, { title: getEx(e.exId).name });
  sh.body.addEventListener('click', ev => {
    const m = ev.target.closest('[data-m]');
    if (!m) return;
    sh.close();
    const k = m.dataset.m;
    if (k === 'info') return openExerciseSheet(e.exId);
    if (k === 'form') return openFormCheck(e.exId);
    if (k === 'up' || k === 'down') {
      const to = ei + (k === 'up' ? -1 : 1);
      [s.exercises[ei], s.exercises[to]] = [s.exercises[to], s.exercises[ei]];
    }
    if (k === 'rm') s.exercises.splice(ei, 1);
    S.notes.clear();
    rerender();
  });
}

async function finishSession() {
  const s = store.d.active;
  const done = s.exercises.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);
  const undone = s.exercises.reduce((n, e) => n + e.sets.filter(x => !x.done).length, 0);
  if (!done) {
    if (await confirmSheet('No sets logged yet. Discard this workout?', { ok: 'Discard', danger: true })) { store.d.active = null; stopRest(); store.save(); ui.render(); }
    return;
  }
  if (undone && !await confirmSheet(`${undone} set${undone > 1 ? 's' : ''} not ticked — they'll be dropped.`, { ok: 'Finish anyway', title: 'Finish workout?' })) return;
  s.exercises = s.exercises.map(e => ({ ...e, sets: e.sets.filter(x => x.done) })).filter(e => e.sets.length);
  // Recompute PR flags in order (values may have been edited after ticking).
  const seen = {};
  const prs = [];
  for (const e of s.exercises) {
    const ex = getEx(e.exId);
    seen[e.exId] = seen[e.exId] || [];
    for (const st of e.sets) {
      const p = ex.kind === 'recovery' ? [] : detectPR(ex, st, s.start, seen[e.exId]);
      if (p.length) { st.pr = p; prs.push({ ex, st, p }); } else delete st.pr;
      seen[e.exId].push(st);
    }
  }
  s.end = Date.now();
  s.done = true;
  s.prs = prs.length;
  store.d.sessions.push(s);
  store.d.active = null;
  if (s.planId && s.planId === store.d.planId && !s.generated) {
    const plan = currentPlan();
    const k = plan ? plan.days.findIndex(d => d.key === s.dayKey) : -1;
    if (k >= 0) store.d.dayIdx = (k + 1) % plan.days.length;
  }
  store.save();
  stopRest();
  S.notes.clear(); S.edit = null;
  ui.render();
  if (prs.length) confetti();
  const vol = sessionVolume([s]);
  const top = Object.entries(vol).sort((a, b) => b[1] - a[1]).slice(0, 6);
  openSheet(`<div class="summary">
      <div class="sum-hero">${icon('flame')}<h3>Workout complete</h3><p class="muted">${esc(s.dayName)}</p></div>
      <div class="facts"><div><small>Duration</small><b>${fmtDur(s.end - s.start)}</b></div><div><small>Sets</small><b>${countSets(s)}</b></div><div><small>Volume</small><b>${fmtNum(toDispW(totalLoad(s)))} ${unitW()}</b></div></div>
      ${prs.length ? `<h3>${icon('trophy')} ${prs.length} PR${prs.length > 1 ? 's' : ''}</h3><ul class="pr-list">${prs.map(x => `<li><b>${esc(x.ex.name)}</b> ${usesLoad(x.ex) ? wLabel(x.ex, x.st.w) + ' × ' : ''}${x.st.r} <span class="pr-badge">${x.p.join(' · ')}</span></li>`).join('')}</ul>` : '<p class="muted">No PRs this time — reps in the bank. Consistency wins.</p>'}
      <h3>Muscles hit (fractional sets)</h3>
      <div class="chips wrap">${top.map(([m, v]) => `<span class="chip static">${muscleName(m)} ${+v.toFixed(1)}</span>`).join('')}</div>
      <button class="btn primary block" data-close>Nice</button></div>`, { title: 'Summary' });
}

export function hasActive() { return !!store.d.active; }
