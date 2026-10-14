// Body tab: weight + measurements, trends, V-taper (shoulder:waist) index.
import { store } from './store.js';
import { toDispW, fromDispW, toDispL, fromDispL, unitW, unitL } from './logic.js';
import { lineChart, taperGauge } from './charts.js';
import { ui, icon, toast, confirmSheet } from './ui.js';
import { esc, isoDate, fmtDate, parseISO, round } from './util.js';

const FIELDS = [['waist', 'Waist'], ['shoulders', 'Shoulders'], ['chest', 'Chest'], ['arms', 'Arms'], ['thighs', 'Thighs']];
const B = { metric: 'weight' };

function latest(key) {
  const e = [...store.d.body].sort((a, b) => a.date.localeCompare(b.date)).reverse().find(x => x[key]);
  return e ? e[key] : null;
}

function series(key) {
  const list = [...store.d.body].sort((a, b) => a.date.localeCompare(b.date));
  if (key === 'ratio') return list.filter(e => e.shoulders && e.waist).map(e => ({ x: parseISO(e.date).getTime(), y: round(e.shoulders / e.waist, 3) }));
  return list.filter(e => e[key]).map(e => ({ x: parseISO(e.date).getTime(), y: key === 'weight' ? toDispW(e[key]) : toDispL(e[key]) }));
}

function avg7() {
  const list = [...store.d.body].filter(e => e.weight).sort((a, b) => a.date.localeCompare(b.date));
  if (!list.length) return null;
  const lastDate = parseISO(list[list.length - 1].date).getTime();
  const wk = list.filter(e => lastDate - parseISO(e.date).getTime() < 7 * 864e5);
  return wk.reduce((s, e) => s + e.weight, 0) / wk.length;
}

export function renderBody(root) {
  const sh = latest('shoulders'), wa = latest('waist');
  const ratio = sh && wa ? sh / wa : null;
  const target = 1.6;
  let advice = 'Log shoulders and waist to compute your V-taper index.';
  if (ratio) {
    advice = ratio >= target ? 'Adonis zone — keep the waist tight and keep building delts and lats.'
      : `To hit ${target}: +${toDispL(target * wa - sh)} ${unitL()} shoulders or −${toDispL(wa - sh / target)} ${unitL()} waist.`;
  }
  const a7 = avg7();
  const metrics = [['weight', 'Weight'], ['ratio', 'V-taper'], ...FIELDS];
  const s = series(B.metric);
  const unit = B.metric === 'weight' ? unitW() : B.metric === 'ratio' ? '' : unitL();
  const entries = [...store.d.body].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 12);
  root.innerHTML = `
    <div class="card taper"><div class="card-head"><h3>V-taper index</h3><small class="muted">shoulders ÷ waist</small></div>
      ${taperGauge(ratio, target)}<p class="muted tiny center">${esc(advice)}</p></div>
    <div class="card"><div class="facts">
      <div><small>Weight (7-day avg)</small><b>${a7 ? `${toDispW(a7)} ${unitW()}` : '—'}</b></div>
      <div><small>Shoulders</small><b>${sh ? `${toDispL(sh)} ${unitL()}` : '—'}</b></div>
      <div><small>Waist</small><b>${wa ? `${toDispL(wa)} ${unitL()}` : '—'}</b></div></div></div>
    <div class="card"><div class="chips scroll-x">${metrics.map(([k, v]) => `<button class="chip ${B.metric === k ? 'on' : ''}" data-metric="${k}">${v}</button>`).join('')}</div>
      ${lineChart(s, { fmt: v => B.metric === 'ratio' ? (+v).toFixed(2) : `${round(v, 1)}`, target: B.metric === 'ratio' ? target : null, empty: 'Add two or more entries to see the trend' })}
      ${s.length >= 2 ? `<p class="tiny muted center">${s[0].y} → ${s[s.length - 1].y} ${unit} (${round(s[s.length - 1].y - s[0].y, 2) >= 0 ? '+' : ''}${round(s[s.length - 1].y - s[0].y, 2)})</p>` : ''}</div>
    <form class="card body-form" id="body-form"><h3>Log today</h3>
      <div class="form-grid">
        <label><span>Date</span><input type="date" name="date" value="${isoDate()}" max="${isoDate()}"></label>
        <label><span>Weight (${unitW()})</span><input name="weight" inputmode="decimal" placeholder="${latest('weight') ? toDispW(latest('weight')) : ''}"></label>
        ${FIELDS.map(([k, v]) => `<label><span>${v} (${unitL()})</span><input name="${k}" inputmode="decimal" placeholder="${latest(k) ? toDispL(latest(k)) : ''}"></label>`).join('')}
      </div>
      <p class="tiny muted">Measure relaxed, same time of day. Shoulders: widest point around the delts. Waist: at the navel.</p>
      <button class="btn primary block" type="submit">${icon('plus')} Save entry</button></form>
    <div class="card"><h3>Entries</h3>${entries.length ? `<ul class="body-list">${entries.map(e => `<li><span>${fmtDate(e.date, { month: 'short', day: 'numeric' })}</span>
      <span class="bl-vals">${e.weight ? `<b>${toDispW(e.weight)} ${unitW()}</b>` : ''}${FIELDS.filter(([k]) => e[k]).map(([k, v]) => `<small>${v[0]}${v[1]} ${toDispL(e[k])}</small>`).join('')}</span>
      <button class="icon-btn sm" data-del="${e.date}" aria-label="Delete">${icon('trash')}</button></li>`).join('')}</ul>` : '<p class="muted">No entries yet.</p>'}</div>`;

  root.querySelector('#body-form').onsubmit = ev => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const date = f.get('date') || isoDate();
    const e = { date };
    const num = k => { const v = parseFloat(String(f.get(k) || '').replace(',', '.')); return isFinite(v) && v > 0 ? v : null; };
    const w = num('weight');
    if (w) e.weight = round(fromDispW(w), 1);
    for (const [k] of FIELDS) { const v = num(k); if (v) e[k] = round(fromDispL(v), 2); }
    if (Object.keys(e).length < 2) return toast('Enter at least one value');
    const existing = store.d.body.find(x => x.date === date);
    if (existing) Object.assign(existing, e); else store.d.body.push(e);
    if (e.weight && date >= (store.d.body.filter(x => x.weight).map(x => x.date).sort().pop() || '')) store.d.profile.bw = e.weight;
    store.save();
    toast('Saved', { kind: 'ok' });
    ui.render();
  };
  root.onclick = async e => {
    const m = e.target.closest('[data-metric]');
    if (m) { B.metric = m.dataset.metric; return ui.render(); }
    const d = e.target.closest('[data-del]');
    if (d && await confirmSheet(`Delete the entry for ${fmtDate(d.dataset.del)}?`, { ok: 'Delete', danger: true })) {
      store.d.body = store.d.body.filter(x => x.date !== d.dataset.del);
      store.save(); ui.render();
    }
  };
}
