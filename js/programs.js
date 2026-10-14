// Program templates. Sets are the Intermediate baseline; experience multiplies them
// (0.7 / 1.0 / 1.25) and isolation work for priority muscles gets +30%.
import { getEx } from './exercises.js';
import { EXP, resolveEx } from './logic.js';
import { store } from './store.js';

// [exerciseId, sets, repLo, repHi, RIR, rest seconds, superset group]
const it = (exId, sets, lo, hi, rir, rest, ss) => ({ exId, sets, reps: [lo, hi], rir, rest, ss: ss || null });

const PPL_DAYS = [
  {
    key: 'PA', name: 'Push A', focus: 'Flat press · Upper chest · Delts · Triceps', items: [
      it('bb_bench', 3, 6, 10, 2, 180), it('incline_db_press', 3, 8, 12, 2, 120), it('db_ohp', 2, 8, 12, 2, 120),
      it('db_lat', 3, 12, 20, 1, 60), it('incline_db_fly', 2, 10, 15, 1, 60), it('oh_db_ext', 3, 10, 15, 1, 75), it('pushdown', 2, 10, 15, 1, 60)
    ]
  },
  {
    key: 'LA', name: 'Pull A', focus: 'Vertical pull · Row · Rear delts · Biceps', items: [
      it('pullup', 3, 6, 10, 2, 150), it('bb_row', 3, 6, 10, 2, 150), it('pulldown_close', 2, 10, 12, 2, 90),
      it('rear_fly', 3, 12, 20, 1, 60), it('face_pull', 2, 15, 20, 1, 60), it('incline_curl', 3, 10, 15, 1, 60), it('hammer_curl', 2, 10, 15, 1, 60)
    ]
  },
  {
    key: 'GA', name: 'Legs A', focus: 'Squat · RDL · Calves · Abs', items: [
      it('back_squat', 3, 6, 10, 2, 180), it('rdl', 3, 8, 10, 2, 150), it('lunge', 2, 10, 12, 2, 90),
      it('slide_curl', 2, 8, 12, 1, 75), it('calf_stand', 3, 10, 15, 1, 60), it('rollout', 3, 8, 12, 2, 60)
    ]
  },
  {
    key: 'PB', name: 'Push B', focus: 'Upper chest · Side delts · Triceps', items: [
      it('low_incline_bb', 3, 6, 10, 2, 180), it('db_bench', 3, 8, 12, 2, 120), it('cable_fly_lh', 2, 10, 15, 1, 60),
      it('cable_lat', 3, 12, 20, 1, 60), it('leanaway_lat', 2, 12, 20, 1, 60), it('oh_cable_ext', 3, 10, 15, 1, 60), it('db_skull', 2, 10, 15, 1, 60)
    ]
  },
  {
    key: 'LB', name: 'Pull B', focus: 'Lat width · Upper back · Biceps', items: [
      it('pulldown_wide', 3, 8, 12, 2, 120), it('cs_row', 3, 8, 12, 2, 120), it('kneel_pd', 2, 10, 15, 1, 60),
      it('straight_arm_pd', 2, 12, 15, 1, 60), it('rear_fly', 3, 12, 20, 1, 60), it('cable_curl', 3, 10, 15, 1, 60), it('preacher_db', 2, 10, 15, 1, 60)
    ]
  },
  {
    key: 'GB', name: 'Legs B', focus: 'Deadlift · Single-leg · Glutes · Core', items: [
      it('deadlift', 3, 5, 8, 2, 180), it('bss', 3, 8, 12, 2, 120), it('hip_thrust', 3, 8, 12, 2, 120),
      it('heel_squat', 2, 10, 15, 2, 90), it('calf_seated', 3, 12, 20, 1, 60), it('knee_raise', 3, 10, 15, 1, 60), it('pallof', 2, 10, 12, 2, 45)
    ]
  }
];

export const PROGRAMS = [
  {
    id: 'fb3', name: '3-Day Full Body', short: 'Full Body A/B/C', daysPerWeek: 3, minutes: 60,
    blurb: 'Squat or hinge, press, pull, row, laterals and an arm superset every session. Minimal days, solid 2–3× frequency.',
    days: [
      {
        key: 'A', name: 'Full Body A', focus: 'Squat · Flat press · Pulldown', items: [
          it('back_squat', 3, 6, 10, 2, 180), it('db_bench', 3, 8, 12, 2, 150), it('pulldown_wide', 3, 8, 12, 2, 120),
          it('cs_row', 2, 10, 15, 2, 90), it('db_lat', 3, 12, 20, 1, 60), it('incline_curl', 2, 10, 15, 1, 60, 'A'), it('oh_db_ext', 2, 10, 15, 1, 60, 'A')
        ]
      },
      {
        key: 'B', name: 'Full Body B', focus: 'Hinge · Incline · Pull-up', items: [
          it('rdl', 3, 6, 10, 2, 180), it('incline_db_press', 3, 8, 12, 2, 150), it('pullup', 3, 6, 10, 2, 150),
          it('cable_row', 2, 10, 12, 2, 90), it('cable_lat', 3, 12, 20, 1, 60), it('hammer_curl', 2, 10, 15, 1, 60, 'A'), it('pushdown', 2, 10, 15, 1, 60, 'A'),
          it('calf_stand', 2, 10, 15, 1, 60)
        ]
      },
      {
        key: 'C', name: 'Full Body C', focus: 'Split squat · Low incline · Row', items: [
          it('bss', 3, 8, 12, 2, 120), it('low_incline_bb', 3, 6, 10, 2, 180), it('pulldown_close', 3, 10, 12, 2, 120),
          it('db_row', 2, 10, 12, 2, 90), it('rear_fly', 3, 12, 20, 1, 60), it('cable_curl', 2, 10, 15, 1, 60, 'A'), it('db_skull', 2, 10, 15, 1, 60, 'A'),
          it('rollout', 2, 8, 12, 2, 60)
        ]
      }
    ]
  },
  {
    id: 'ul4', name: '4-Day Upper/Lower', short: 'U1 · L1 · U2 · L2', daysPerWeek: 4, minutes: 60,
    blurb: 'Every muscle 2× per week in 55–65 min sessions. Best results per hour for a busy dad.',
    days: [
      {
        key: 'U1', name: 'Upper 1', focus: 'Flat press · Lat width · Arms', items: [
          it('bb_bench', 3, 6, 10, 2, 180), it('cs_row', 3, 8, 12, 2, 120), it('incline_db_press', 2, 8, 12, 2, 120),
          it('pulldown_wide', 3, 8, 12, 2, 120), it('db_lat', 3, 12, 20, 1, 60), it('incline_curl', 2, 10, 15, 1, 60, 'A'), it('oh_cable_ext', 2, 10, 15, 1, 60, 'A')
        ]
      },
      {
        key: 'L1', name: 'Lower 1', focus: 'Squat · RDL · Calves · Abs', items: [
          it('back_squat', 3, 6, 10, 2, 180), it('rdl', 3, 8, 10, 2, 150), it('bss', 2, 8, 12, 2, 120),
          it('slide_curl', 2, 8, 12, 1, 90), it('calf_stand', 3, 10, 15, 1, 60), it('rollout', 3, 8, 12, 2, 60)
        ]
      },
      {
        key: 'U2', name: 'Upper 2', focus: 'Overhead · Pull-up · V-taper', items: [
          it('db_ohp', 3, 8, 12, 2, 150), it('pullup', 3, 6, 10, 2, 150), it('incline_db_press', 3, 8, 12, 2, 120),
          it('cable_row', 3, 10, 12, 2, 120), it('cable_lat', 3, 12, 20, 1, 60), it('rear_fly', 2, 12, 20, 1, 60),
          it('hammer_curl', 2, 10, 15, 1, 60, 'A'), it('pushdown', 2, 10, 15, 1, 60, 'A')
        ]
      },
      {
        key: 'L2', name: 'Lower 2', focus: 'Deadlift · Glutes · Core', items: [
          it('deadlift', 3, 5, 8, 2, 180), it('heel_squat', 3, 10, 15, 2, 120), it('hip_thrust', 3, 8, 12, 2, 120),
          it('lunge', 2, 10, 12, 2, 90), it('calf_seated', 3, 12, 20, 1, 60), it('cable_crunch', 3, 10, 15, 1, 60), it('pallof', 2, 10, 12, 2, 45)
        ]
      }
    ]
  },
  {
    id: 'hy5', name: '5-Day Hybrid', short: 'Upper · Lower · Push · Pull · Legs+Arms', daysPerWeek: 5, minutes: 60,
    blurb: 'Upper/Lower strength days plus a PPL-style V-taper block. The "go big" pick — the most delt, lat and arm volume.',
    days: [
      {
        key: 'UP', name: 'Upper', focus: 'Heavy press · Lat width · Arms', items: [
          it('bb_bench', 3, 6, 10, 2, 180), it('pulldown_wide', 3, 8, 12, 2, 120), it('incline_db_press', 2, 8, 12, 2, 120),
          it('cs_row', 3, 8, 12, 2, 120), it('db_lat', 3, 12, 20, 1, 60), it('incline_curl', 2, 10, 15, 1, 60, 'A'), it('oh_cable_ext', 2, 10, 15, 1, 60, 'A')
        ]
      },
      {
        key: 'LO', name: 'Lower', focus: 'Squat · RDL · Abs', items: [
          it('back_squat', 3, 6, 10, 2, 180), it('rdl', 3, 8, 10, 2, 150), it('bss', 2, 8, 12, 2, 120),
          it('slide_curl', 2, 8, 12, 1, 90), it('calf_stand', 3, 10, 15, 1, 60), it('rollout', 3, 8, 12, 2, 60)
        ]
      },
      {
        key: 'PU', name: 'Push', focus: 'Upper chest · Delts · Triceps', items: [
          it('low_incline_bb', 3, 6, 10, 2, 180), it('db_ohp', 3, 8, 12, 2, 120), it('cable_fly_lh', 3, 10, 15, 1, 60),
          it('cable_lat', 3, 12, 20, 1, 60), it('y_raise', 2, 12, 20, 1, 60), it('oh_db_ext', 3, 10, 15, 1, 60), it('pushdown', 2, 10, 15, 1, 60)
        ]
      },
      {
        key: 'PL', name: 'Pull', focus: 'Pull-up · Lats · Rear delts · Biceps', items: [
          it('pullup', 3, 6, 10, 2, 150), it('cable_row', 3, 10, 12, 2, 120), it('kneel_pd', 3, 10, 15, 1, 60),
          it('straight_arm_pd', 2, 12, 15, 1, 60), it('face_pull', 3, 15, 20, 1, 60), it('bb_curl', 3, 8, 12, 1, 75), it('hammer_curl', 2, 10, 15, 1, 60)
        ]
      },
      {
        key: 'LA', name: 'Legs + Arms', focus: 'Glutes · Quads · Arms · Delts', items: [
          it('hip_thrust', 3, 8, 12, 2, 120), it('heel_squat', 3, 10, 15, 2, 120), it('sl_rdl', 2, 8, 12, 2, 90),
          it('calf_seated', 3, 12, 20, 1, 60), it('leanaway_lat', 3, 12, 20, 1, 60), it('preacher_db', 2, 10, 15, 1, 60, 'A'), it('db_skull', 2, 10, 15, 1, 60, 'A'),
          it('cable_crunch', 3, 10, 15, 1, 60)
        ]
      }
    ]
  },
  {
    id: 'ppl6', name: '6-Day PPL ×2', short: 'Push · Pull · Legs × 2', daysPerWeek: 6, minutes: 55,
    blurb: 'Advanced: two full Push/Pull/Legs rotations, 50–60 min each. Needs sleep and food to match.',
    days: PPL_DAYS
  },
  {
    id: 'ppl7', name: '7-Day PPL + Recovery', short: 'PPL × 2 + Active Recovery', daysPerWeek: 7, minutes: 55,
    blurb: '6-day PPL plus a low-fatigue Day 7: zone-2 walk / KB flow, mobility, ab roller and Pallof.',
    days: [
      ...PPL_DAYS,
      {
        key: 'AR', name: 'Active Recovery', focus: 'Zone-2 · Mobility · Core', recovery: true, items: [
          it('zone2_walk', 1, 20, 30, 4, 0), it('mobility_flow', 1, 8, 12, 4, 0), it('kb_swing', 3, 15, 15, 4, 60),
          it('rollout', 2, 6, 10, 3, 60), it('pallof', 2, 10, 12, 3, 45), it('dead_bug', 2, 8, 10, 3, 45)
        ]
      }
    ]
  }
];

export function getProgram(id) { return PROGRAMS.find(p => p.id === id) || null; }

export function bestFitProgram(daysPerWeek) {
  const d = Number(daysPerWeek) || 4;
  if (d <= 3) return 'fb3';
  if (d === 4) return 'ul4';
  if (d === 5) return 'hy5';
  if (d === 6) return 'ppl6';
  return 'ppl7';
}

// Resolve a template into concrete sets for this lifter + equipment.
export function buildPlan(id = store.d.planId) {
  const prog = getProgram(id);
  if (!prog) return null;
  const { exp, priority } = store.d.profile;
  const mult = (EXP[exp] || EXP.intermediate).mult;
  const equip = store.d.settings.equip;
  const days = prog.days.map(day => ({
    ...day,
    items: day.items.map(item => {
      const exId = resolveEx(item.exId, equip);
      const ex = getEx(exId);
      let sets = item.sets;
      if (ex.kind !== 'recovery' && !day.recovery) {
        const prio = (ex.kind === 'iso') && ex.pri.some(m => priority.includes(m));
        sets = Math.max(1, Math.round(item.sets * mult * (prio ? 1.3 : 1)));
      }
      return { ...item, exId, orig: item.exId, sets, reps: exId === item.exId ? item.reps : ex.reps };
    })
  }));
  return { ...prog, days };
}

export function currentPlan() { return store.d.planId ? buildPlan(store.d.planId) : null; }

export function nextDay(plan = currentPlan()) {
  if (!plan) return null;
  return plan.days[(store.d.dayIdx || 0) % plan.days.length];
}

export function planSets(plan) {
  let n = 0;
  for (const d of plan.days) for (const i of d.items) if (getEx(i.exId).kind !== 'recovery') n += i.sets;
  return n;
}
