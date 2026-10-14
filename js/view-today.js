// Today tab: next workout, readiness check, deload alerts, rings, tips, generator.
import { store } from './store.js';
import { getEx, muscleName, GROUPS } from './exercises.js';
import { currentPlan, nextDay } from './programs.js';
import {
  suggest, readinessScore, readinessAdvice, todayReadiness, deloadStatus, startDeload, endDeload,
  buildSession, sessionsInWeek, weekStreak, estimateMinutes, doneSessions, countSets, repUnit
} from './logic.js';
import { generateWorkout, EXCLUDABLE } from './generator.js';
import { renderSession } from './view-session.js';
import { ring } from './charts.js';
import { tipOfDay } from './tips.js';
import { figureSVG } from './anim.js';
import { ui, icon, openSheet, toast, confirmSheet } from './ui.js';
import { stopRest } from './timer.js';
import { esc, isoDate, weekStart, fmtDate, fmtDur, sum } from './util.js';
import { openExerciseSheet } from './view-library.js';

const T = { r: { sleep: 3, energy: 3, soreness: 2 }, dayOverride: null, tipOff: 0 };

function greet() {
  const h = new Date().getHours();
  return h < 5 ? 'Late one' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function scale(name, key, lo, hi) {
  return `<div class="rd-row"><span>${name}<small>${lo} → ${hi}</small></span><div class="seg5">${[1, 2, 3, 4, 5].map(v =>
    `<button class="${T.r[key] === v ? 'on' : ''}" aria-label="${name}: ${v} of 5" aria-pressed="${T.r[key] === v}" data-rd="${key}" data-v="${v}">${v}</button>`).join('')}</div></div>`;
}

function readinessCard() {
  const done = todayReadiness();
  if (done) {
    const a = readinessAdvice(done.score);
    return `<div class="card readiness done ${a.level}"><div class="rd-head"><div><small>Readiness today</small><h3>${done.score}/5 · ${a.label}</h3></div>
      <button class="btn-text" data-act="redo-rd">Redo</button></div><p class="muted tiny">${esc(a.msg)}</p></div>`;
  }
  const sc = readinessScore(T.r);
  const a = readinessAdvice(sc);
  return `<div class="card readiness"><div class="rd-head"><div><small>Readiness check</small><h3>How are you today?</h3></div><span class="rd-score ${a.level}">${sc}</span></div>
    ${scale('Sleep', 'sleep', 'awful', 'great')}${scale('Energy', 'energy', 'drained', 'wired')}${scale('Soreness', 'soreness', 'none', 'wrecked')}
    <p class="muted tiny">${esc(a.label)}: ${esc(a.msg)}</p></div>`;
}

function deloadBanner() {
  const d = deloadStatus();
  if (d.active) {
    return `<div class="banner deload">${icon('heart')}<div><b>Deload week active</b><small>Through ${fmtDate(d.end)} — half sets, RIR 4. Come back stronger.</small></div><button class="btn-text" data-act="end-deload">End</button></div>`;
  }
  if (!d.due) return '';
  return `<div class="banner deload due">${icon('bolt')}<div><b>Deload recommended</b><small>${d.reasons.map(esc).join(' · ')}</small></div><button class="btn sm primary" data-act="start-deload">Start</button></div>`;
}

function statsRow() {
  const ws = weekStart(isoDate());
  const n = sessionsInWeek(ws).length;
  const target = store.d.profile.daysPerWeek || 4;
  const hard = sum(sessionsInWeek(ws).map(countSets));
  const streak = weekStreak();
  return `<div class="card stats">
    <div class="stat">${ring(n / target, { size: 70, label: `${n}/${target}`, sub: 'sessions' })}<span>This week</span></div>
    <div class="stat">${ring(Math.min(1, hard / Math.max(1, (target * 20))), { size: 70, label: `${hard}`, sub: 'sets' })}<span>Hard sets</span></div>
    <div class="stat">${ring(Math.min(1, streak / 8), { size: 70, label: `${streak}`, sub: 'weeks' })}<span>${icon('flame')} Streak</span></div>
  </div>`;
}

function workoutCard(plan, day) {
  if (!plan) {
    return `<div class="card hero"><h3>Pick your plan</h3><p class="muted">Forge recommends a program from your schedule, then auto-progresses every lift.</p>
      <button class="btn primary block" data-act="go-plan">Choose a plan</button></div>`;
  }
  const items = day.items;
  const deload = deloadStatus().active;
  const mins = estimateMinutes(items);
  return `<div class="card hero">
    <div class="hero-top"><div><small>${esc(plan.name)} · Day ${plan.days.indexOf(day) + 1}/${plan.days.length}</small><h2>${esc(day.name)}</h2><p class="muted">${esc(day.focus || '')}</p></div>
      <div class="hero-meta"><b>~${mins}′</b><small>${sum(items.map(i => i.sets))} sets</small></div></div>
    <div class="day-chips scroll-x">${plan.days.map(d => `<button class="chip ${d === day ? 'on' : ''}" data-day="${d.key}">${esc(d.name)}</button>`).join('')}</div>
    <ul class="ex-preview">${items.map(i => {
      const ex = getEx(i.exId);
      const sg = suggest(ex, i);
      return `<li data-info="${ex.id}"><span class="mini-fig">${figureSVG(ex.pattern, { size: 36 })}</span><div><b>${esc(ex.name)}</b>
        <small>${deload ? Math.ceil(i.sets / 2) : i.sets}×${i.reps[0]}–${i.reps[1]}${repUnit(ex)}${ex.kind === 'recovery' ? '' : ` · RIR ${deload ? 4 : i.rir}`}${i.ss ? ` · SS ${i.ss}` : ''}</small>
        <small class="sg">${sg.prevText ? `${esc(sg.prevText)} → ` : ''}<em>${esc(sg.text)}</em></small></div></li>`;
    }).join('')}</ul>
    <button class="btn primary block xl" data-act="start">${icon('play')} Start ${esc(day.name)}</button>
  </div>`;
}

function lastSessionCard() {
  const last = doneSessions().pop();
  if (!last) return '';
  return `<div class="card last" data-act="go-history"><small>Last workout · ${fmtDate(last.date)}</small>
    <div class="last-row"><b>${esc(last.dayName)}</b><span>${fmtDur(last.end - last.start)} · ${countSets(last)} sets${last.prs ? ` · <span class="pr-badge">${icon('trophy')}${last.prs} PR</span>` : ''}</span></div></div>`;
}

export function renderToday(root) {
  if (store.d.active) return renderSession(root);
  const plan = currentPlan();
  let day = plan ? nextDay(plan) : null;
  if (plan && T.dayOverride) day = plan.days.find(d => d.key === T.dayOverride) || day;
  const tip = tipOfDay(T.tipOff);
  const name = store.d.profile.name;
  root.innerHTML = `
    <div class="greet"><small>${fmtDate(isoDate(), { weekday: 'long', month: 'long', day: 'numeric' })}</small><h2>${greet()}${name ? `, ${esc(name)}` : ''}</h2></div>
    ${deloadBanner()}
    ${statsRow()}
    ${plan ? readinessCard() : ''}
    ${workoutCard(plan, day)}
    <button class="card gen-cta" data-act="gen">${icon('spark')}<div><b>Build me a workout now</b><small>Pick minutes, focus & energy — Forge does the rest</small></div>${icon('chev')}</button>
    <div class="card tip" data-act="tip"><small>${icon('bolt')} Evidence tip</small><p>${esc(tip.t)}</p><small class="muted">${esc(tip.src)} · tap for another</small></div>
    ${lastSessionCard()}`;
  root.onclick = e => onClick(e, plan, day);
}

function onClick(e, plan, day) {
  const rd = e.target.closest('[data-rd]');
  if (rd) { T.r[rd.dataset.rd] = +rd.dataset.v; return ui.render(); }
  const dk = e.target.closest('[data-day]');
  if (dk) { T.dayOverride = dk.dataset.day; return ui.render(); }
  const inf = e.target.closest('[data-info]');
  if (inf) return openExerciseSheet(inf.dataset.info);
  const b = e.target.closest('[data-act]');
  if (!b) return;
  switch (b.dataset.act) {
    case 'start': return startPlanned(plan, day);
    case 'gen': return openGenerator();
    case 'tip': T.tipOff++; return ui.render();
    case 'go-plan': return ui.go('plan');
    case 'go-history': return ui.go('history');
    case 'redo-rd': store.d.readiness = store.d.readiness.filter(r => r.date !== isoDate()); store.save(); return ui.render();
    case 'start-deload': startDeload(); toast('Deload week started — half sets, RIR 4'); return ui.render();
    case 'end-deload': endDeload(); return ui.render();
  }
}

function captureReadiness() {
  let r = todayReadiness();
  if (!r) {
    r = { date: isoDate(), ...T.r };
    r.score = readinessScore(r);
    store.d.readiness.push(r);
  }
  return r;
}

function startPlanned(plan, day) {
  const r = captureReadiness();
  store.d.active = buildSession(day, { readiness: r, deload: deloadStatus().active });
  T.dayOverride = null;
  store.save();
  window.scrollTo(0, 0);
  ui.render();
}

export async function startGenerated(day) {
  if (store.d.active && !await confirmSheet('A workout is already in progress. Replace it?', { ok: 'Replace', danger: true })) return;
  const r = captureReadiness();
  stopRest();
  store.d.active = buildSession(day, { readiness: r, deload: deloadStatus().active, planId: null });
  store.save();
  ui.go('today');
}

const G = { minutes: 45, focus: [], energy: 'normal', exclude: [] };

export function openGenerator() {
  let draft = null;
  const sh = openSheet('', { title: 'Build me a workout', cls: 'tall' });
  const paint = () => {
    sh.setBody(`
      <h4>Minutes</h4><div class="seg">${[15, 20, 30, 45, 60, 75].map(m => `<button class="${G.minutes === m ? 'on' : ''}" data-g="minutes" data-v="${m}">${m}</button>`).join('')}</div>
      <h4>Focus <small class="muted">(none = full body)</small></h4><div class="chips wrap">${Object.keys(GROUPS).map(g => `<button class="chip ${G.focus.includes(g) ? 'on' : ''}" data-g="focus" data-v="${g}">${g}</button>`).join('')}</div>
      <h4>Energy</h4><div class="seg">${['low', 'normal', 'high'].map(v => `<button class="${G.energy === v ? 'on' : ''}" data-g="energy" data-v="${v}">${v[0].toUpperCase() + v.slice(1)}</button>`).join('')}</div>
      <h4>Exclude equipment</h4><div class="chips wrap">${Object.entries(EXCLUDABLE).map(([k, v]) => `<button class="chip ${G.exclude.includes(k) ? 'on neg' : ''}" data-g="exclude" data-v="${k}">${v}</button>`).join('')}</div>
      <button class="btn primary block" data-g="build">${icon('spark')} ${draft ? 'Regenerate' : 'Generate'}</button>
      ${draft ? draftHTML(draft) : ''}`);
  };
  const draftHTML = d => `<div class="draft"><div class="draft-head"><div><h3>${esc(d.name)}</h3><small class="muted">${esc(d.focus)} · ~${estimateMinutes(d.items)}′</small></div></div>
      ${d.items.map((it, i) => {
        const ex = getEx(it.exId);
        return `<div class="draft-row"><span class="mini-fig">${figureSVG(ex.pattern, { size: 36 })}</span><div class="dr-txt"><b>${esc(ex.name)}</b><small>${ex.pri.map(muscleName).join(', ')} · ${it.reps[0]}–${it.reps[1]} · RIR ${it.rir}${it.ss ? ` · SS ${it.ss}` : ''}</small></div>
          <div class="mini-step"><button data-d="minus" data-i="${i}" aria-label="Remove a set">${icon('minus')}</button><b>${it.sets}</b><button data-d="plus" data-i="${i}" aria-label="Add a set">${icon('plus')}</button></div>
          <button class="icon-btn" data-d="rm" data-i="${i}" aria-label="Remove">${icon('x')}</button></div>`;
      }).join('')}
      <button class="btn primary block xl" data-g="start">${icon('play')} Start this workout</button></div>`;
  paint();
  sh.body.addEventListener('click', e => {
    const g = e.target.closest('[data-g]');
    const d = e.target.closest('[data-d]');
    if (d && draft) {
      const i = +d.dataset.i;
      if (d.dataset.d === 'minus') draft.items[i].sets = Math.max(1, draft.items[i].sets - 1);
      if (d.dataset.d === 'plus') draft.items[i].sets = Math.min(6, draft.items[i].sets + 1);
      if (d.dataset.d === 'rm') draft.items.splice(i, 1);
      return paint();
    }
    if (!g) return;
    const k = g.dataset.g, v = g.dataset.v;
    if (k === 'minutes') G.minutes = +v;
    if (k === 'energy') G.energy = v;
    if (k === 'focus' || k === 'exclude') { const a = G[k]; a.includes(v) ? a.splice(a.indexOf(v), 1) : a.push(v); }
    if (k === 'build') draft = generateWorkout(G);
    if (k === 'start') {
      if (!draft || !draft.items.length) return toast('Add at least one exercise');
      sh.close(); return startGenerated(draft);
    }
    paint();
    if (k === 'build') setTimeout(() => { const el = sh.body.querySelector('.draft'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  });
}
