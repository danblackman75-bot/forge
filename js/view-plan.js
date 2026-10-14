// Plan tab: current program, weekly volume vs target, day breakdown, plan picker.
import { store } from './store.js';
import { getEx, muscleName, MUSCLES } from './exercises.js';
import { PROGRAMS, buildPlan, currentPlan, bestFitProgram, planSets } from './programs.js';
import { EXP, planVolume, targetBand, estimateMinutes, buildSession, todayReadiness, deloadStatus, repUnit } from './logic.js';
import { bandBars } from './charts.js';
import { figureSVG } from './anim.js';
import { ui, icon, toast, confirmSheet } from './ui.js';
import { esc, isoDate, fmtClock } from './util.js';
import { openGenerator } from './view-today.js';
import { openExerciseSheet } from './view-library.js';
import { stopRest } from './timer.js';

const P = { open: null };

function badges(id) {
  const fit = bestFitProgram(store.d.profile.daysPerWeek);
  const b = [];
  if (id === store.d.planId) b.push('<i class="badge cur">Current</i>');
  if (id === 'ul4') b.push('<i class="badge rec">Recommended</i>');
  if (id === 'hy5') b.push('<i class="badge big">Go big</i>');
  if (id === fit && id !== 'ul4' && id !== 'hy5') b.push('<i class="badge fit">Fits your week</i>');
  return b.join('');
}

function volumeCard(plan) {
  const v = planVolume(plan);
  const pr = store.d.profile.priority;
  const rows = Object.keys(MUSCLES).map(m => {
    const [lo, hi] = targetBand(m);
    return { label: muscleName(m), value: v[m] || 0, lo, hi, prio: pr.includes(m) };
  });
  const inBand = rows.filter(r => r.value >= r.lo && r.value <= r.hi).length;
  return `<div class="card"><div class="card-head"><h3>Weekly volume</h3><small class="muted">${inBand}/${rows.length} muscles in band · ★ priority +30%</small></div>
    ${bandBars(rows)}
    <p class="tiny muted">Fractional counting: primary muscle = 1 set, secondary = ½ (Pelland 2024). Bands: ${EXP[store.d.profile.exp].vol.join('–')} sets for your level, scaled for small muscles.</p></div>`;
}

function dayCard(plan, d, i) {
  const open = P.open === d.key;
  return `<div class="card day ${open ? 'open' : ''}">
    <button class="day-head" data-open="${d.key}"><span class="day-no">${i + 1}</span><div><b>${esc(d.name)}</b><small>${esc(d.focus || '')} · ~${estimateMinutes(d.items)}′ · ${d.items.reduce((n, x) => n + x.sets, 0)} sets</small></div>${icon('chev', open ? 'rot' : '')}</button>
    ${open ? `<ul class="day-list">${d.items.map(it => {
      const ex = getEx(it.exId);
      return `<li data-info="${ex.id}"><span class="mini-fig">${figureSVG(ex.pattern, { size: 36 })}</span><div><b>${esc(ex.name)}</b>${it.orig !== it.exId ? `<small class="sub-note">sub for ${esc(getEx(it.orig).name)}</small>` : ''}
        <small>${it.sets} × ${it.reps[0]}–${it.reps[1]}${repUnit(ex)}${ex.kind === 'recovery' ? '' : ` · RIR ${it.rir}`}${it.rest ? ` · rest ${fmtClock(it.rest)}` : ''}${it.ss ? ` · <b class="ss">SS ${it.ss}</b>` : ''}</small></div></li>`;
    }).join('')}</ul>
    <button class="btn ghost block" data-start="${d.key}">${icon('play')} Start ${esc(d.name)} now</button>` : ''}
  </div>`;
}

function pickerCard(p) {
  const built = buildPlan(p.id);
  const cur = p.id === store.d.planId;
  return `<div class="card prog ${cur ? 'current' : ''}">
    <div class="prog-top"><div><h3>${esc(p.name)}</h3><small class="muted">${esc(p.short)}</small></div><div class="prog-badges">${badges(p.id)}</div></div>
    <p class="muted tiny">${esc(p.blurb)}</p>
    <div class="facts"><div><small>Days</small><b>${p.daysPerWeek}/wk</b></div><div><small>Session</small><b>~${p.minutes}′</b></div><div><small>Weekly sets</small><b>${planSets(built)}</b></div></div>
    ${cur ? '' : `<button class="btn ${p.id === 'ul4' ? 'primary' : 'ghost'} block" data-use="${p.id}">Use this plan</button>`}
  </div>`;
}

export function renderPlan(root) {
  const plan = currentPlan();
  const exp = store.d.profile.exp;
  root.innerHTML = `
    ${plan ? `<div class="card plan-hero"><small>Current plan</small><h2>${esc(plan.name)}</h2><p class="muted">${esc(plan.blurb)}</p>
      <div class="seg" role="group" aria-label="Experience">${Object.entries(EXP).map(([k, v]) => `<button class="${exp === k ? 'on' : ''}" data-exp="${k}">${v.label}<small>×${v.mult}</small></button>`).join('')}</div>
      <p class="tiny muted">Started ${esc(store.d.planStart)} · next: Day ${(store.d.dayIdx % plan.days.length) + 1}</p></div>
    ${plan.days.map((d, i) => dayCard(plan, d, i)).join('')}
    ${volumeCard(plan)}` : ''}
    <button class="card gen-cta" data-act="gen">${icon('spark')}<div><b>Build me a workout now</b><small>Off-plan day? Generate one in seconds</small></div>${icon('chev')}</button>
    <div class="section-title"><h3>Choose a program</h3></div>
    <div class="card verdict">${icon('bolt')}<p><b>Our call:</b> the <b>4-Day Upper/Lower</b> if the schedule is tight with two kids — every muscle twice a week in about an hour. Want to <b>go big</b>? Run the <b>5-Day Hybrid</b> for maximum V-taper volume.</p></div>
    ${PROGRAMS.map(pickerCard).join('')}`;
  root.onclick = async e => {
    const t = e.target;
    const ex = t.closest('[data-exp]');
    if (ex) { store.d.profile.exp = ex.dataset.exp; store.save(); toast(`${EXP[ex.dataset.exp].label}: sets ×${EXP[ex.dataset.exp].mult}`); return ui.render(); }
    const o = t.closest('[data-open]');
    if (o) { P.open = P.open === o.dataset.open ? null : o.dataset.open; return ui.render(); }
    const inf = t.closest('[data-info]');
    if (inf) return openExerciseSheet(inf.dataset.info);
    const st = t.closest('[data-start]');
    if (st) {
      if (store.d.active && !await confirmSheet('A workout is already in progress. Replace it?', { ok: 'Replace', danger: true })) return;
      const day = plan.days.find(d => d.key === st.dataset.start);
      stopRest();
      store.d.active = buildSession(day, { readiness: todayReadiness(), deload: deloadStatus().active });
      store.save();
      return ui.go('today');
    }
    const u = t.closest('[data-use]');
    if (u) {
      if (store.d.planId && !await confirmSheet('Switch programs? History is kept; the new plan starts at Day 1.', { ok: 'Switch' })) return;
      store.d.planId = u.dataset.use; store.d.dayIdx = 0; store.d.planStart = isoDate();
      store.save();
      toast(`Plan set: ${PROGRAMS.find(p => p.id === u.dataset.use).name}`, { kind: 'ok' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return ui.render();
    }
    if (t.closest('[data-act="gen"]')) openGenerator();
  };
}
