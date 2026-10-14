// Evidence-based one-liners for the Today feed.
import { isoDate } from './util.js';

export const TIPS = [
  { t: '10–20 hard sets per muscle per week is the sweet spot; returns diminish past ~20.', src: 'Schoenfeld 2017; Pelland 2024' },
  { t: 'Train each muscle at least twice a week — same weekly sets, better growth than once.', src: 'Schoenfeld 2016/2019' },
  { t: 'Anything from 6 to 30 reps builds muscle if you finish within 0–3 reps of failure.', src: 'Schoenfeld 2017; Lopez 2021' },
  { t: 'Stopping 1–3 reps shy of failure on compounds gets nearly all the gains with less fatigue.', src: 'Refalo 2023/2024' },
  { t: 'Isolations are safe to push to 0–1 RIR — low systemic fatigue, high reward.', src: 'Robinson 2024' },
  { t: 'Adding reps is as good as adding load. Double progression lets you do both.', src: 'Plotkin 2022' },
  { t: 'Muscles grow more when loaded long: incline curls, overhead extensions, RDLs, deep squats.', src: 'Maeo 2021/2023; Pedrosa 2022' },
  { t: 'Lengthened partials on the final set are a legit way to squeeze out extra stimulus.', src: 'Wolf 2023; Kassiano 2023' },
  { t: 'Rest 2–3 min on compounds. Short rest hurts the reps you can do — and reps drive growth.', src: 'Schoenfeld 2016; Singer 2024' },
  { t: 'Deload every 5–8 weeks: half the sets, RIR 4. You come back stronger, not smaller.', src: 'Bell 2023' },
  { t: 'V-taper = wide delts + wide lats + a tight waist. Side delts respond to lots of sets — do them often.', src: 'practical' },
  { t: 'Overhead triceps work grew the long head ~40% more than pushdowns in one study.', src: 'Maeo 2023' },
  { t: 'Eat ~0.7–1 g protein per lb of bodyweight daily. Spread over 3–5 meals.', src: 'Morton 2018' },
  { t: 'Sleep is a performance drug: <6 h nights blunt strength and recovery. Guard it.', src: 'Knowles 2018' },
  { t: 'A slow 2–3 s lowering keeps tension where you want it and protects joints.', src: 'practical' },
  { t: 'Waist matters for the V-taper: core strength work, no heavy weighted oblique bulking.', src: 'practical' },
  { t: 'Stalled 2 sessions? Check sleep and food first, then swap the variation after a deload.', src: 'practical' },
  { t: 'Short on time? Antagonist supersets save ~30% of session time with no loss in volume.', src: 'Robbins 2010' },
  { t: 'Rep quality > rep count. A clean rep at RIR 1 beats a sloppy rep at "failure".', src: 'practical' },
  { t: 'Zone-2 walks aid recovery and heart health without eating into lifting gains.', src: 'Schumann 2022' },
  { t: 'Missed a session? Just do the next one. Consistency over weeks beats any single workout.', src: 'practical' },
  { t: 'Track body weight as a 7-day average — daily swings of 2–4 lb are water, not fat.', src: 'practical' },
  { t: 'Progress shows on a shoulder-to-waist ratio before the mirror: aim for ~1.6.', src: 'practical' },
  { t: 'Pull-ups and pulldowns: a full stretch at the top is where the lat-width magic happens.', src: 'practical; Maeo 2021' }
];

export function tipOfDay(offset = 0) {
  const d = isoDate().split('-').map(Number);
  const n = (d[0] * 372 + d[1] * 31 + d[2] + offset) % TIPS.length;
  return TIPS[n];
}
