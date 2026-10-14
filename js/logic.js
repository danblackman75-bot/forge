// Training logic: load snapping, double progression, PRs, volume, readiness, deloads.
import { store } from './store.js';
import { getEx, EXERCISES, MUSCLES } from './exercises.js';
import { isoDate, daysBetween, weekStart, addDays, round, uid, clamp } from './util.js';

export const EXP = {
  beginner: { label: 'Beginner', mult: 0.7, vol: [8, 12], deloadWeeks: 8, start: 0.65 },
  intermediate: { label: 'Intermediate', mult: 1.0, vol: [12, 18], deloadWeeks: 6, start: 1 },
  advanced: { label: 'Advanced', mult: 1.25, vol: [16, 22], deloadWeeks: 5, start: 1.25 }
};

// Small / indirectly-trained muscles need fewer direct sets.
const TARGET_SCALE = { upper_chest: 0.6, front_delts: 0.5, forearms: 0.4, obliques: 0.5, abs: 0.7, calves: 0.8, upper_back: 0.9 };

/* ---------- load steps ---------- */
export const DB_WEIGHTS = [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5];
export const KB_WEIGHTS = [12, 15, 20, 25, 30, 35, 40];
const MB_WEIGHTS = [6, 8, 10, 12, 14, 16, 20];
const steps = (a, b, s) => { const r = []; for (let v = a; v <= b + 1e-9; v += s) r.push(round(v, 1)); return r; };
const BB_WEIGHTS = steps(45, 495, 5);
const CABLE_WEIGHTS = steps(5, 250, 5);
const BW_ADDED = steps(0, 100, 5);

export function weightSteps(ex) {
  switch (ex.eq) {
    case 'db': return DB_WEIGHTS;
    case 'kb': return KB_WEIGHTS;
    case 'mb': return MB_WEIGHTS;
    case 'bb': return BB_WEIGHTS;
    case 'cable': return CABLE_WEIGHTS;
    case 'bw': return BW_ADDED;
    default: return [0];
  }
}

export function usesLoad(ex) { return !!ex && !['none', 'roller'].includes(ex.eq) && ex.unit === 'reps'; }

export function snapWeight(ex, w) {
  const s = weightSteps(ex);
  let best = s[0];
  for (const v of s) if (Math.abs(v - w) < Math.abs(best - w)) best = v;
  return best;
}

export function stepWeight(ex, w, dir) {
  const s = weightSteps(ex);
  if (dir > 0) { const n = s.find(v => v > w + 1e-9); return n === undefined ? s[s.length - 1] : n; }
  for (let i = s.length - 1; i >= 0; i--) if (s[i] < w - 1e-9) return s[i];
  return s[0];
}

/* ---------- units ---------- */
const KG = 0.45359237;
export function isKg() { return store.d.settings.units === 'kg'; }
export function unitW() { return isKg() ? 'kg' : 'lb'; }
export function unitL() { return isKg() ? 'cm' : 'in'; }
export function toDispW(lb) { return isKg() ? round(lb * KG, 1) : round(lb, 1); }
export function fromDispW(v) { return isKg() ? round(v / KG, 2) : Number(v); }
export function toDispL(inch) { return isKg() ? round(inch * 2.54, 1) : round(inch, 2); }
export function fromDispL(v) { return isKg() ? round(v / 2.54, 2) : Number(v); }
export function fmtW(lb) { return `${toDispW(lb)} ${unitW()}`; }
export function wLabel(ex, lb) {
  if (!ex || !usesLoad(ex)) return ex && ex.unit === 'sec' ? 'hold' : 'BW';
  if (ex.eq === 'bw') return lb > 0 ? `BW+${toDispW(lb)}` : 'BW';
  return fmtW(lb);
}
export function repUnit(ex) { return ex.unit === 'sec' ? 's' : ex.unit === 'min' ? 'min' : ''; }

/* ---------- equipment ---------- */
export function available(ex, equip = store.d.settings.equip) {
  return !!ex && ex.req.every(r => equip[r] !== false);
}

export function resolveEx(id, equip = store.d.settings.equip) {
  const ex = getEx(id);
  if (!ex) return id;
  if (available(ex, equip)) return id;
  for (const s of ex.subs) if (available(getEx(s), equip)) return s;
  for (const s of ex.subs) for (const s2 of getEx(s).subs) if (available(getEx(s2), equip)) return s2;
  const alt = EXERCISES.find(e => e.pri[0] === ex.pri[0] && e.kind === ex.kind && available(e, equip));
  return alt ? alt.id : id;
}

export function alternatives(exId) {
  const ex = getEx(exId);
  const subs = ex.subs.map(getEx).filter(e => available(e));
  const same = EXERCISES.filter(e => e.id !== exId && !ex.subs.includes(e.id) && e.pri.some(m => ex.pri.includes(m)) && available(e));
  return [...subs, ...same];
}

/* ---------- history ---------- */
export function doneSessions() {
  return store.d.sessions.filter(s => s.done).sort((a, b) => a.start - b.start);
}

export function workSets(entry) { return (entry.sets || []).filter(s => s.done && !s.warm && s.r > 0); }

export function exHistory(exId, before = Infinity) {
  const out = [];
  for (const s of doneSessions()) {
    if (s.start >= before) continue;
    for (const e of s.exercises) if (e.exId === exId && workSets(e).length) out.push({ s, e });
  }
  return out;
}

export function e1rm(w, r) { return r <= 1 ? w : w * (1 + r / 30); }

export function setLoad(ex, w, bw = store.d.profile.bw) { return ex.bw ? (bw || 185) + (w || 0) : (w || 0); }

export function bestE1(ex, sets) {
  let b = 0;
  for (const s of sets) b = Math.max(b, e1rm(setLoad(ex, s.w, s.bw), s.r));
  return b;
}

export function topSet(sets) {
  let t = null;
  for (const s of sets) if (!t || s.w > t.w || (s.w === t.w && s.r > t.r)) t = s;
  return t;
}

export function startWeight(ex) {
  const k = (EXP[store.d.profile.exp] || EXP.intermediate).start;
  return snapWeight(ex, (ex.start || 0) * k);
}

function repsStr(sets) {
  const r = sets.map(s => s.r);
  return r.every(x => x === r[0]) ? `${r[0]}` : r.join('/');
}

// A session "progressed" vs the previous one if load went up, or at the same load the
// average reps per set or the best e1RM went up. (A load jump with reps reset counts as progress.)
function progressed(ex, prev, cur) {
  const pw = Math.max(...prev.map(s => s.w || 0)), cw = Math.max(...cur.map(s => s.w || 0));
  if (cw !== pw) return cw > pw;
  const avg = sets => { const t = sets.filter(s => (s.w || 0) === cw); return t.reduce((a, s) => a + s.r, 0) / (t.length || 1); };
  return avg(cur) > avg(prev) + 0.01 || bestE1(ex, cur) > bestE1(ex, prev) + 0.05;
}

export function isStalled(exId, before = Infinity) {
  const ex = getEx(exId);
  const h = exHistory(exId, before).filter(x => !x.s.deload).slice(-3).map(x => workSets(x.e));
  if (h.length < 3) return false;
  return !progressed(ex, h[0], h[1]) && !progressed(ex, h[1], h[2]);
}

// Double progression: all working sets at top of range (at/under target effort) -> next load step, reps reset.
export function suggest(ex, item, before = Infinity) {
  const [lo, hi] = item.reps;
  const n = item.sets;
  const u = repUnit(ex);
  const hist = exHistory(ex.id, before).filter(x => !x.s.deload);
  const last = hist[hist.length - 1];
  if (!last) {
    const w = usesLoad(ex) ? startWeight(ex) : 0;
    return {
      weight: w, reps: lo, first: true, last: [], prevText: '', stalled: false,
      text: usesLoad(ex) ? `Start ${n}×${lo}${u} @ ${wLabel(ex, w)} — adjust to hit RIR ${item.rir}` : `${n}×${lo}–${hi}${u}`,
      note: ''
    };
  }
  const ws = workSets(last.e);
  const top = Math.max(...ws.map(s => s.w || 0));
  const atTop = ws.filter(s => (s.w || 0) === top);
  const prevText = `${ws.length}×${repsStr(ws)}${u} @ ${wLabel(ex, top)}`;
  const required = Math.max(n, last.e.target?.sets || n);
  const hitTop = atTop.length >= required && ws.every(s => s.w === top && s.r >= hi && s.rir != null && s.rir >= item.rir);
  let w = top, r, note = '';
  if (hitTop) {
    const up = usesLoad(ex) ? stepWeight(ex, top, +1) : top;
    if (up > top) { w = up; r = lo; note = 'Top of range hit → load up'; }
    else { r = Math.max(hi, Math.min(...atTop.map(s => s.r))) + 1; note = usesLoad(ex) && ex.eq === 'db' ? 'SelectTech maxed — add reps, pauses or slow eccentrics' : 'Top of range — add a rep or slow the eccentric'; }
  } else if (Math.max(...ws.map(s => s.r)) < lo && usesLoad(ex)) {
    w = stepWeight(ex, top, -1); r = lo; note = 'Below range last time → drop one step';
  } else {
    r = clamp(Math.min(...atTop.map(s => s.r)) + 1, lo, hi);
  }
  const stalled = isStalled(ex.id, before);
  if (stalled && !note) note = 'Stalled 2 sessions — own every rep, consider a swap after deload';
  return { weight: w, reps: r, first: false, last: ws, prevText, text: `try ${n}×${r}${u} @ ${wLabel(ex, w)}`, note, stalled };
}

export function warmupHint(ex, w) {
  if (!ex || ex.kind !== 'compound' || !usesLoad(ex) || ex.eq === 'bw') return '';
  if (ex.eq === 'bb') {
    if (w < 95) return '';
    return `Warm-up: bar×10 · ${fmtW(snapWeight(ex, w * 0.5))}×6 · ${fmtW(snapWeight(ex, w * 0.75))}×3`;
  }
  if (w < 20) return '';
  return `Warm-up: ${wLabel(ex, snapWeight(ex, w * 0.5))}×10 · ${wLabel(ex, snapWeight(ex, w * 0.75))}×4`;
}

/* ---------- PRs ---------- */
function bestsFrom(ex, sets) {
  const b = { e1: 0, w: -1, reps: [] }; // reps: [{w, r}]
  for (const s of sets) {
    b.e1 = Math.max(b.e1, e1rm(setLoad(ex, s.w, s.bw), s.r));
    b.w = Math.max(b.w, s.w || 0);
    b.reps.push({ w: s.w || 0, r: s.r });
  }
  return b;
}

// Returns list of PR types this set achieves vs everything before it.
export function detectPR(ex, set, before, earlierSets = []) {
  const prior = [];
  for (const h of exHistory(ex.id, before)) prior.push(...workSets(h.e));
  prior.push(...earlierSets);
  if (!prior.length || !set.r) return [];
  const b = bestsFrom(ex, prior);
  const types = [];
  const w = set.w || 0;
  if (usesLoad(ex)) {
    if (e1rm(setLoad(ex, w, set.bw), set.r) > b.e1 + 0.05) types.push('e1RM');
    if (w > b.w) types.push('Weight');
  }
  const bestRepsAt = Math.max(0, ...b.reps.filter(x => x.w >= w).map(x => x.r));
  if (set.r > bestRepsAt && (!usesLoad(ex) || b.reps.some(x => x.w >= w))) types.push('Reps');
  return types;
}

export function allPRs() {
  const map = {};
  for (const s of doneSessions()) for (const e of s.exercises) {
    const ex = getEx(e.exId);
    if (!ex || ex.kind === 'recovery') continue;
    const completed = workSets(e);
    if (!completed.length) continue;
    for (const st of completed) {
      const m = map[ex.id] || (map[ex.id] = { exId: ex.id, e1: 0, e1Date: null, e1Set: null, w: -1, wReps: 0, wDate: null, reps: 0, repsDate: null, count: 0 });
      const v = e1rm(setLoad(ex, st.w, st.bw), st.r);
      if (v > m.e1) { m.e1 = v; m.e1Date = s.date; m.e1Set = st; }
      if ((st.w || 0) > m.w || ((st.w || 0) === m.w && st.r > m.wReps)) { m.w = st.w || 0; m.wReps = st.r; m.wDate = s.date; }
      if (st.r > m.reps) { m.reps = st.r; m.repsDate = s.date; }
    }
    map[ex.id].count++;
  }
  return Object.values(map);
}

/* ---------- volume ---------- */
export function sessionVolume(sessions) {
  const v = {};
  const add = (m, n) => { v[m] = (v[m] || 0) + n; };
  for (const s of sessions) for (const e of s.exercises) {
    const ex = getEx(e.exId);
    if (!ex || ex.kind === 'recovery') continue;
    const n = workSets(e).length;
    ex.pri.forEach(m => add(m, n));
    ex.sec.forEach(m => add(m, n * 0.5));
  }
  return v;
}

export function planVolume(plan) {
  const v = {};
  const add = (m, n) => { v[m] = (v[m] || 0) + n; };
  for (const d of plan.days) for (const i of d.items) {
    const ex = getEx(i.exId);
    if (ex.kind === 'recovery') continue;
    ex.pri.forEach(m => add(m, i.sets));
    ex.sec.forEach(m => add(m, i.sets * 0.5));
  }
  return v;
}

export function targetBand(m) {
  const { exp, priority } = store.d.profile;
  const [lo, hi] = (EXP[exp] || EXP.intermediate).vol;
  const k = (TARGET_SCALE[m] || 1) * (priority.includes(m) ? 1.3 : 1);
  return [Math.round(lo * k), Math.round(hi * k)];
}

export function sessionsInWeek(ws) {
  const we = addDays(ws, 6);
  return doneSessions().filter(s => s.date >= ws && s.date <= we);
}

export function weekVolume(ws) { return sessionVolume(sessionsInWeek(ws)); }

export function totalLoad(session) {
  let t = 0;
  for (const e of session.exercises) {
    const ex = getEx(e.exId);
    if (!ex || !usesLoad(ex)) continue;
    for (const s of workSets(e)) t += (ex.loadCount || (ex.eq === 'db' ? 2 : 1)) * (s.w || 0) * s.r;
  }
  return t;
}

export function countSets(session) {
  let n = 0;
  for (const e of session.exercises) n += workSets(e).length;
  return n;
}

// Muscles hit in the last `days` days -> set counts.
export function recentMuscles(days = 2) {
  const since = addDays(isoDate(), -days);
  return sessionVolume(doneSessions().filter(s => s.date >= since));
}

export function weekStreak() {
  let ws = weekStart(isoDate());
  let streak = 0;
  if (sessionsInWeek(ws).length < 2) ws = addDays(ws, -7); // week in progress doesn't break it
  while (sessionsInWeek(ws).length >= 2 && streak < 520) { streak++; ws = addDays(ws, -7); }
  return streak;
}

/* ---------- readiness ---------- */
export function readinessScore(r) { return round((r.sleep + r.energy + (6 - r.soreness)) / 3, 1); }

export function readinessAdvice(score) {
  if (score < 2.6) return { level: 'low', label: 'Low', setsMult: 0.7, rirAdd: 1, msg: 'Sets trimmed ~30% and +1 RIR. Quality reps, no grinding — this still counts.' };
  if (score < 3.6) return { level: 'ok', label: 'Moderate', setsMult: 1, rirAdd: 0, msg: 'Train as planned. Keep the last sets honest.' };
  return { level: 'high', label: 'Primed', setsMult: 1, rirAdd: 0, msg: 'Green light — last set of each isolation can go to failure (lengthened partials ok).' };
}

export function todayReadiness() {
  const t = isoDate();
  return store.d.readiness.filter(r => r.date === t).pop() || null;
}

/* ---------- deload ---------- */
export function refreshDeload() {
  const d = store.d.deload;
  if (d.active && d.end && isoDate() > d.end) {
    d.active = false; d.lastEnd = d.end; store.save();
  }
}

export function deloadStatus() {
  refreshDeload();
  const D = store.d;
  if (D.deload.active) return { active: true, due: false, reasons: [], end: D.deload.end };
  const anchor = D.deload.lastEnd || D.planStart || isoDate();
  const weeks = Math.floor(Math.max(0, daysBetween(anchor, isoDate())) / 7);
  const every = (EXP[D.profile.exp] || EXP.intermediate).deloadWeeks;
  const reasons = [];
  if (D.sessions.length && weeks >= every) reasons.push(`${weeks} weeks since your last deload (yours: every ${every})`);
  const since = addDays(isoDate(), -21);
  const recentIds = [...new Set(doneSessions().filter(s => s.date >= since).flatMap(s => s.exercises.map(e => e.exId)))];
  const stalled = recentIds.filter(id => getEx(id) && getEx(id).kind === 'compound' && isStalled(id));
  if (stalled.length >= 2) reasons.push(`${stalled.length} lifts stalled 2 sessions: ${stalled.slice(0, 3).map(id => getEx(id).name).join(', ')}`);
  const lastR = doneSessions().filter(s => !s.deload && (!D.deload.lastEnd || s.date > D.deload.lastEnd)).slice(-3).map(s => s.readiness);
  if (lastR.length === 3 && lastR.every(r => r && r.score < 2.6)) reasons.push('Readiness low 3 sessions running');
  return { active: false, due: reasons.length > 0, reasons, weeks, every, stalled };
}

export function startDeload() {
  const t = isoDate();
  store.d.deload = { ...store.d.deload, active: true, start: t, end: addDays(t, 6) };
  store.save();
}

export function endDeload() {
  store.d.deload = { ...store.d.deload, active: false, lastEnd: isoDate() };
  store.save();
}

/* ---------- session building ---------- */
export function makeEntry(item, { adv = null, deload = false } = {}) {
  const ex = getEx(item.exId);
  let sets = item.sets, rir = item.rir;
  if (adv && ex.kind !== 'recovery') { sets = Math.max(1, Math.round(sets * adv.setsMult)); rir += adv.rirAdd; }
  if (deload && ex.kind !== 'recovery') { sets = Math.max(1, Math.ceil(item.sets / 2)); rir = 4; }
  const sg = suggest(ex, { ...item, sets, rir });
  if (deload) {
    const last = exHistory(ex.id).filter(x => !x.s.deload).pop();
    if (last) sg.weight = Math.max(...workSets(last.e).map(s => s.w || 0));
    sg.text = `${sets} sets @ ${wLabel(ex, sg.weight)} · RIR 4`;
  }
  const reps = deload ? item.reps[0] : sg.reps;
  return {
    exId: ex.id, ss: item.ss || null,
    target: { sets, reps: item.reps, rir, rest: item.rest },
    sugg: { text: sg.text, prevText: sg.prevText, note: deload ? 'Deload: same load, half the sets, stop at RIR 4' : sg.note, stalled: sg.stalled },
    notes: '',
    sets: Array.from({ length: sets }, (_, i) => ({
      w: sg.weight, r: reps, rir: clamp(rir, 0, 4), done: false,
      ...(ex.bw ? { bw: store.d.profile.bw } : {}),
      prev: sg.last[i] ? { w: sg.last[i].w, r: sg.last[i].r } : (sg.last.length ? { w: sg.last[sg.last.length - 1].w, r: sg.last[sg.last.length - 1].r } : null)
    }))
  };
}

export function defaultItem(ex) {
  const iso = ex.kind !== 'compound';
  return { exId: ex.id, sets: iso ? 2 : 3, reps: ex.reps, rir: iso ? 1 : 2, rest: iso ? 60 : 150, ss: null };
}

export function buildSession(day, { readiness = null, deload = false, planId = store.d.planId } = {}) {
  const adv = readiness ? readinessAdvice(readiness.score) : null;
  return {
    id: uid(), date: isoDate(), start: Date.now(), end: null, done: false,
    planId: planId || null, dayKey: day.key, dayName: day.name, generated: day.key === 'gen',
    readiness, deload: !!deload,
    exercises: day.items.map(it => makeEntry(it, { adv, deload })),
    notes: ''
  };
}

export function estimateMinutes(items) {
  let sec = 0;
  for (const i of items) {
    const ex = getEx(i.exId);
    if (ex.unit === 'min') { sec += i.reps[0] * 60; continue; }
    sec += i.sets * (40 + (i.ss ? i.rest / 2 : i.rest)) + 60; // + setup/transition
    if (ex.kind === 'compound') sec += 150; // warm-up sets
  }
  return Math.round(sec / 60);
}

export function muscleList() { return Object.keys(MUSCLES); }
