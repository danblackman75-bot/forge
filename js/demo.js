// "Load sample data": ~6 weeks of realistic 4-day U/L history using the real progression engine.
import { store } from './store.js';
import { getEx } from './exercises.js';
import { buildPlan } from './programs.js';
import { buildSession, readinessScore, detectPR, workSets, setLoad, usesLoad } from './logic.js';
import { isoDate, addDays, parseISO, mulberry32, round, clamp } from './util.js';

export function loadDemo() {
  const d = store.d;
  const rnd = mulberry32(1975);
  const today = isoDate();
  const start = addDays(today, -42);
  d.profile = { ...d.profile, name: d.profile.name || 'Dan', bw: 186, height: 70, exp: 'intermediate', daysPerWeek: 4, sessionMin: 60 };
  d.onboarded = true;
  d.planId = 'ul4';
  d.planStart = start;
  d.sessions = []; d.body = []; d.readiness = []; d.formchecks = []; d.active = null;
  d.deload = { active: false, start: null, end: null, lastEnd: null };
  const plan = buildPlan('ul4');
  let idx = 0;
  const strength = {}, reps0 = {};

  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    if (date >= today) break;
    const wd = (parseISO(date).getDay() + 6) % 7; // Mon=0
    if (![0, 1, 3, 4].includes(wd)) continue;
    if (rnd() < 0.07) continue; // life happens
    const day = plan.days[idx % plan.days.length];
    idx++;
    const r = { date, sleep: clamp(Math.round(3 + rnd() * 2.2 - (rnd() < 0.15 ? 2 : 0)), 1, 5), energy: clamp(Math.round(3 + rnd() * 2), 1, 5), soreness: clamp(Math.round(1 + rnd() * 2.5), 1, 5) };
    r.score = readinessScore(r);
    d.readiness.push(r);
    const s = buildSession(day, { readiness: r, planId: 'ul4' });
    const t0 = parseISO(date);
    t0.setHours(wd < 2 ? 5 : 20, wd < 2 ? 45 : 15, 0, 0);
    s.date = date;
    s.start = t0.getTime();
    for (const e of s.exercises) {
      const ex = getEx(e.exId);
      const [lo, hi] = e.target.reps;
      const earlier = [];
      const load = w => setLoad(ex, w);
      // Hidden strength (e1RM) per lift, rising ~0.8–1.8% per exposure.
      if (usesLoad(ex)) {
        if (!strength[ex.id]) strength[ex.id] = load(e.sets[0].w) * (1 + (lo + 2 + e.target.rir) / 30);
        else strength[ex.id] *= 1.008 + rnd() * 0.01;
      } else reps0[ex.id] = (reps0[ex.id] || lo) + (rnd() < 0.6 ? 1 : 0);
      e.sets.forEach((set, j) => {
        const rir = clamp(e.target.rir + (rnd() < 0.2 ? -1 : 0) + (rnd() < 0.15 ? 1 : 0), 0, 4);
        let reps;
        if (usesLoad(ex)) {
          const cap = 30 * (strength[ex.id] / Math.max(1, load(set.w)) - 1) - rir - j * 0.4 + (rnd() - 0.5) * 1.2;
          reps = Math.min(Math.floor(cap), hi + (rnd() < 0.15 ? 1 : 0));
        } else {
          reps = ex.unit === 'sec' ? Math.min(hi + 15, lo + idx * 2) : Math.min(reps0[ex.id] - (j > 1 ? 1 : 0), hi + 2);
        }
        set.r = clamp(reps, Math.max(1, lo - 2), hi + (ex.unit === 'sec' ? 20 : 2));
        set.rir = rir;
        set.done = true;
        set.t = s.start + (j + 1) * 150000;
        const pr = detectPR(ex, set, s.start, earlier);
        if (pr.length) set.pr = pr;
        earlier.push(set);
      });
      if (rnd() < 0.06) e.notes = ['Felt strong today', 'Left shoulder a bit tight — warmed up longer', 'Great pump', 'Grip gave out on last set'][Math.floor(rnd() * 4)];
    }
    s.end = s.start + (48 + Math.round(rnd() * 17)) * 60000;
    s.done = true;
    s.prs = s.exercises.reduce((n, e) => n + workSets(e).filter(x => x.pr).length, 0);
    d.sessions.push(s);
  }
  d.dayIdx = idx % plan.days.length;

  // Body: slow recomp — weight down a touch, waist down, shoulders up.
  for (let i = 0; i <= 42; i += 3 + Math.floor(rnd() * 2)) {
    const k = i / 42;
    const date = addDays(start, i);
    if (date > today) break;
    const e = { date, weight: round(186.4 - 3.4 * k + (rnd() - 0.5) * 1.6, 1) };
    if (i % 7 < 4) {
      Object.assign(e, {
        waist: round(34.6 - 0.9 * k + (rnd() - 0.5) * 0.2, 1),
        chest: round(41.4 + 0.5 * k + (rnd() - 0.5) * 0.2, 1),
        shoulders: round(48.0 + 0.8 * k + (rnd() - 0.5) * 0.2, 1),
        arms: round(14.8 + 0.35 * k + (rnd() - 0.5) * 0.1, 1),
        thighs: round(23.4 + 0.25 * k + (rnd() - 0.5) * 0.15, 1)
      });
    }
    d.body.push(e);
  }
  d.profile.bw = d.body[d.body.length - 1].weight;
  d.formchecks.push({ id: Date.now(), date: addDays(today, -9), exId: 'back_squat', mode: 'camera', reps: 8, deep: 7, maxLean: 41 });
  store.save();
}
