// "Build me a workout now": time budget -> sets -> compound per focus group -> V-taper isolations.
import { EXERCISES, GROUPS, getEx } from './exercises.js';
import { available, recentMuscles, estimateMinutes } from './logic.js';
import { store } from './store.js';

export const VTAPER = ['side_delts', 'rear_delts', 'lats', 'upper_chest', 'biceps', 'triceps'];
export const EXCLUDABLE = { barbell: 'Barbell', cable: 'Cable', pullup: 'Pull-up bar', incline: 'Incline bench', kb: 'Kettlebell', medball: 'Med ball', abroller: 'Ab roller', floor: 'Floor work' };

const ANTAGONIST = {
  biceps: ['triceps'], triceps: ['biceps'], chest: ['lats', 'upper_back'], upper_chest: ['lats', 'upper_back'],
  lats: ['chest', 'upper_chest'], upper_back: ['chest', 'upper_chest'], side_delts: ['rear_delts', 'biceps', 'triceps'],
  rear_delts: ['side_delts'], quads: ['hamstrings'], hamstrings: ['quads'], front_delts: ['rear_delts'], abs: ['glutes'], glutes: ['abs']
};

export function generateWorkout({ minutes = 45, focus = [], energy = 'normal', exclude = [] } = {}) {
  let budget = Math.floor(minutes / 3);
  if (energy === 'low') budget = Math.round(budget * 0.75);
  if (energy === 'high') budget = Math.round(budget * 1.1);
  budget = Math.max(4, budget);
  const rirAdd = energy === 'low' ? 1 : 0;
  const short = minutes <= 30;

  const equip = { ...store.d.settings.equip };
  for (const k of exclude) equip[k] = false;
  const pool = EXERCISES.filter(ex => {
    if (ex.kind === 'recovery' || !available(ex, equip)) return false;
    if (exclude.includes('barbell') && ex.eq === 'bb') return false;
    if (exclude.includes('cable') && ex.eq === 'cable') return false;
    if (exclude.includes('floor') && (['pushup', 'plank', 'rollout', 'hipthrust'].includes(ex.pattern) || ['kneel_pd', 'cable_crunch', 'russian_twist'].includes(ex.id))) return false;
    return true;
  });

  const recent = recentMuscles(2);
  const groups = focus.length ? focus : ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms'];
  const maxCompounds = Math.max(1, Math.round(minutes / 15));
  const focusMuscles = groups.flatMap(g => GROUPS[g] || []);
  const used = new Set();
  const scores = new Map(pool.map(ex => [ex.id, (ex.stretch ? 2 : 0) - (ex.pri.some(m => (recent[m] || 0) >= 3) ? 3 : 0) + Math.random() * 1.5]));
  const best = list => list.filter(e => !used.has(e.id)).sort((a, b) => scores.get(b.id) - scores.get(a.id))[0];

  const items = [];
  let total = 0;
  const push = (ex, sets, kind) => {
    used.add(ex.id);
    const compound = kind === 'compound';
    items.push({ exId: ex.id, sets, reps: ex.reps, rir: (compound ? 2 : 1) + rirAdd, rest: compound ? (short ? 90 : 150) : 60, ss: null });
    total += sets;
  };

  // 1) one compound per focus group (core uses a core movement)
  let nCompounds = 0;
  for (const g of groups) {
    if (total >= budget || nCompounds >= maxCompounds) break;
    const ms = GROUPS[g] || [];
    const kind = g === 'Core' ? 'core' : 'compound';
    const c = best(pool.filter(e => e.kind === kind && e.pri.some(m => ms.includes(m))));
    if (c) { push(c, Math.min(short ? 2 : 3, budget - total), kind); nCompounds++; }
  }

  // 2) isolations for V-taper muscles (focus-relevant first), round-robin
  let vt = VTAPER.filter(m => focusMuscles.includes(m));
  if (!vt.length) vt = focusMuscles.length ? focusMuscles : VTAPER;
  let guard = 0, i = 0;
  while (total < budget && guard++ < 40) {
    const m = vt[i++ % vt.length];
    const c = best(pool.filter(e => ['iso', 'core'].includes(e.kind) && e.pri.includes(m)));
    if (!c) { if (guard > vt.length * 2) break; continue; }
    push(c, Math.min(energy === 'high' ? 3 : 2, budget - total), 'iso');
  }

  // 3) supersets antagonists when short on time
  if (short) {
    let letter = 0;
    const free = items.filter(x => getEx(x.exId).kind !== 'compound' || items.length <= 3);
    for (let a = 0; a < free.length; a++) {
      if (free[a].ss) continue;
      const ma = getEx(free[a].exId).pri[0];
      for (let b = a + 1; b < free.length; b++) {
        if (free[b].ss) continue;
        const mb = getEx(free[b].exId).pri[0];
        if ((ANTAGONIST[ma] || []).includes(mb)) {
          const L = String.fromCharCode(65 + letter++);
          free[a].ss = L; free[b].ss = L; free[a].rest = 45; free[b].rest = 60;
          break;
        }
      }
    }
    // keep superset partners adjacent
    const ordered = [];
    for (const x of items) {
      if (ordered.includes(x)) continue;
      ordered.push(x);
      if (x.ss) { const p = items.find(y => y !== x && y.ss === x.ss); if (p && !ordered.includes(p)) ordered.push(p); }
    }
    items.splice(0, items.length, ...ordered);
  }

  // 4) fit the clock: supersets free up time, so top up sets (max 4/exercise) or trim if over.
  let g2 = 0;
  while (items.length && total < budget && estimateMinutes(items) < minutes * 0.85 && g2++ < 40) {
    const cand = items.filter(x => x.sets < 4).sort((a, b) => a.sets - b.sets)[0];
    if (!cand) break;
    cand.sets++; total++;
    const p = cand.ss && items.find(y => y !== cand && y.ss === cand.ss);
    if (p && p.sets < cand.sets && total < budget) { p.sets++; total++; }
  }
  while (items.length && estimateMinutes(items) > minutes && g2++ < 80) {
    const big = [...items].sort((a, b) => b.sets - a.sets)[0];
    if (big.sets > 1) { big.sets--; total--; } else { total -= items.pop().sets; }
  }
  for (const item of items) if (item.ss && items.filter(x => x.ss === item.ss).length < 2) item.ss = null;

  const label = focus.length ? focus.join(' + ') : 'Full Body';
  return {
    key: 'gen', name: `Quick ${minutes}′ ${label}`,
    focus: `${total} sets · ${energy} energy${short ? ' · supersets' : ''}`,
    items
  };
}
