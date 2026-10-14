// Persistence: one JSON document in localStorage. Weights stored in lb, lengths in inches.
import { isoDate, parseISO } from './util.js';
import { getEx, MUSCLES } from './exercises.js';

const KEY = 'forge.v1';

export const DEFAULT_PRIORITY = ['side_delts', 'rear_delts', 'lats', 'upper_chest', 'biceps', 'triceps'];

export function defaults() {
  return {
    version: 1,
    onboarded: false,
    profile: { name: '', bw: 185, height: null, exp: 'intermediate', daysPerWeek: 4, sessionMin: 60, priority: [...DEFAULT_PRIORITY] },
    settings: {
      units: 'lb', sound: true, vibrate: true, autoRest: true,
      equip: { barbell: true, pullup: true, incline: true, rope: true, cable: true, kb: true, medball: true, abroller: true }
    },
    planId: null,
    planStart: isoDate(),
    dayIdx: 0,
    sessions: [],
    body: [],
    readiness: [],
    formchecks: [],
    active: null,
    deload: { active: false, start: null, end: null, lastEnd: null }
  };
}

function merge(def, obj) {
  const out = { ...def, ...obj };
  out.profile = { ...def.profile, ...(obj.profile || {}) };
  out.settings = { ...def.settings, ...(obj.settings || {}) };
  out.settings.equip = { ...def.settings.equip, ...((obj.settings || {}).equip || {}) };
  out.deload = { ...def.deload, ...(obj.deload || {}) };
  for (const k of ['sessions', 'body', 'readiness', 'formchecks']) if (!Array.isArray(out[k])) out[k] = [];
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return validateData(JSON.parse(raw));
  } catch (e) { console.warn('Forge: could not load data', e); }
  return defaults();
}

export const store = {
  d: load(),
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.d)); }
    catch (e) { console.warn('Forge: save failed', e); }
  }
};

export function exportData() {
  return JSON.stringify({ app: 'forge', version: 1, exported: new Date().toISOString(), data: store.d }, null, 2);
}

export function importData(text) {
  const o = JSON.parse(text);
  if (o?.app && o.app !== 'forge') throw new Error('Not a Forge backup file');
  if (o?.version != null && o.version !== 1) throw new Error('Unsupported backup version');
  const data = o && o.data ? o.data : o;
  const next = validateData(data);
  // Commit only after both validation and persistence succeed.
  localStorage.setItem(KEY, JSON.stringify(next));
  store.d = next;
}

function validateData(data) {
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const need = (ok, field) => { if (!ok) throw new Error(`Invalid backup: ${field}`); };
  const number = (x, min = 0) => typeof x === 'number' && Number.isFinite(x) && x >= min;
  const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && isoDate(parseISO(x)) === x;
  need(object(data) && Array.isArray(data.sessions), 'sessions');
  need(data.version == null || data.version === 1, 'version');
  for (const k of ['profile', 'settings', 'deload']) need(data[k] == null || object(data[k]), k);
  need(data.settings?.equip == null || object(data.settings.equip), 'equipment');
  for (const k of ['body', 'readiness', 'formchecks']) need(data[k] === undefined || Array.isArray(data[k]), k);
  const d = merge(defaults(), data), p = d.profile;
  need(typeof d.onboarded === 'boolean' && typeof p.name === 'string', 'profile');
  need(number(p.bw, 1) && (p.height === null || number(p.height, 1)), 'bodyweight/height');
  need(['beginner', 'intermediate', 'advanced'].includes(p.exp), 'experience');
  need([3, 4, 5, 6, 7].includes(p.daysPerWeek) && number(p.sessionMin, 1), 'schedule');
  need(Array.isArray(p.priority) && p.priority.every(m => Object.hasOwn(MUSCLES, m)), 'priorities');
  need(['lb', 'kg'].includes(d.settings.units), 'units');
  for (const k of ['sound', 'vibrate', 'autoRest']) need(typeof d.settings[k] === 'boolean', k);
  need(Object.values(d.settings.equip).every(v => typeof v === 'boolean'), 'equipment');
  need(d.planId === null || ['fb3', 'ul4', 'hy5', 'ppl6', 'ppl7'].includes(d.planId), 'plan');
  need(Number.isInteger(d.dayIdx) && d.dayIdx >= 0 && date(d.planStart), 'plan position');
  const readiness = r => {
    need(object(r) && date(r.date) && number(r.score, 1) && r.score <= 5, 'readiness');
    for (const k of ['sleep', 'energy', 'soreness']) need(number(r[k], 1) && r[k] <= 5, `readiness ${k}`);
  };
  const session = (s, active = false) => {
    need(object(s) && typeof s.id === 'string' && date(s.date) && number(s.start), 'session');
    need(typeof s.dayName === 'string' && typeof s.dayKey === 'string' && typeof s.done === 'boolean', 'session details');
    need(s.end == null || number(s.end, s.start), 'session end');
    need(Array.isArray(s.exercises) && (!active || !s.done), 'session exercises');
    if (s.readiness) readiness(s.readiness);
    for (const e of s.exercises) {
      need(object(e) && !!getEx(e.exId) && Array.isArray(e.sets), 'exercise');
      need(object(e.target) && Number.isInteger(e.target.sets) && e.target.sets > 0, 'set target');
      need(Array.isArray(e.target.reps) && e.target.reps.length === 2 && e.target.reps.every(v => number(v, 1)) && e.target.reps[1] >= e.target.reps[0], 'rep target');
      need(number(e.target.rir) && e.target.rir <= 5 && number(e.target.rest), 'effort/rest');
      if (active) need(object(e.sugg) && typeof e.sugg.text === 'string', 'active suggestion');
      need(e.notes == null || typeof e.notes === 'string', 'exercise notes');
      for (const st of e.sets) {
        need(object(st) && number(st.w) && number(st.r) && number(st.rir) && st.rir <= 5 && typeof st.done === 'boolean', 'set');
        need(st.bw == null || number(st.bw, 1), 'set bodyweight');
        // Migrate older backups once, using the latest available measurement at that date.
        if (getEx(e.exId).bw && st.bw == null) {
          const measured = d.body.filter(b => b && date(b.date) && b.date <= s.date && number(b.weight, 1)).sort((a,b) => a.date.localeCompare(b.date)).pop();
          st.bw = measured?.weight || p.bw;
        }
        need(st.pr == null || (Array.isArray(st.pr) && st.pr.every(x => ['e1RM', 'Weight', 'Reps'].includes(x))), 'PR flags');
        need(st.prev == null || (object(st.prev) && number(st.prev.w) && number(st.prev.r)), 'previous set');
      }
    }
  };
  d.sessions.forEach(s => session(s));
  if (d.active !== null) session(d.active, true);
  d.readiness.forEach(readiness);
  for (const b of d.body) {
    need(object(b) && date(b.date), 'body entry');
    for (const k of ['weight', 'waist', 'shoulders', 'chest', 'arms', 'thighs']) need(b[k] == null || number(b[k], 0.01), `body ${k}`);
  }
  need(typeof d.deload.active === 'boolean', 'deload');
  for (const k of ['start', 'end', 'lastEnd']) need(d.deload[k] === null || date(d.deload[k]), `deload ${k}`);
  need(!d.deload.active || (d.deload.start && d.deload.end && d.deload.end >= d.deload.start), 'deload dates');
  for (const f of d.formchecks) need(object(f) && date(f.date) && !!getEx(f.exId) && ['camera', 'self'].includes(f.mode), 'form check');
  return d;
}

export function resetData() {
  store.d = defaults();
  store.save();
}
