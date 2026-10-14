// Exercise library — equipment-valid for Dan's home gym (SelectTech 552, adjustable bench,
// rack + cable stack, barbell, adjustable KB, med ball, ab roller, pull-up bar).

export const MUSCLES = {
  chest: 'Chest', upper_chest: 'Upper chest', lats: 'Lats', upper_back: 'Upper back',
  front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', quads: 'Quads',
  hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs', obliques: 'Obliques'
};

export const GROUPS = {
  Chest: ['chest', 'upper_chest'],
  Back: ['lats', 'upper_back'],
  Shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  Arms: ['biceps', 'triceps', 'forearms'],
  Legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  Core: ['abs', 'obliques']
};

export const EQUIP_LABEL = {
  bb: 'Barbell', db: 'Dumbbells', cable: 'Cable', bw: 'Bodyweight', kb: 'Kettlebell',
  mb: 'Med ball', roller: 'Ab roller', none: 'No equipment'
};

// Equipment requirement keys -> settings.equip toggles.
export const REQ_LABEL = {
  barbell: 'Barbell', pullup: 'Pull-up bar', incline: 'Incline bench', rope: 'Rope attachment',
  cable: 'Cable stack', kb: 'Kettlebell', medball: 'Med ball', abroller: 'Ab roller'
};

const LIST = [];
function ex(o) {
  LIST.push(Object.assign({ req: [], sec: [], stretch: false, bw: false, unit: 'reps', subs: [], start: 0, note: '' }, o));
}

/* ---------------- CHEST ---------------- */
ex({
  id: 'bb_bench', name: 'Barbell Bench Press', eq: 'bb', req: ['barbell'], pattern: 'bench',
  pri: ['chest'], sec: ['front_delts', 'triceps'], reps: [6, 10], kind: 'compound', start: 155,
  cues: ['Eyes under the bar, feet planted, slight arch', 'Pin shoulder blades down and back', 'Lower to lower chest, forearms vertical', 'Drive up and slightly back toward the rack'],
  mistakes: ['Elbows flared to 90° (cranky shoulders)', 'Bouncing the bar off the chest', 'Hips lifting off the bench'],
  check: ['Shoulder blades stayed pinned all set?', 'Bar touched chest under control each rep?', 'Forearms roughly vertical at the bottom?', 'Feet and glutes stayed planted?', 'Safeties set just below chest height?'],
  subs: ['db_bench', 'low_incline_bb', 'pushup']
});
ex({
  id: 'db_bench', name: 'Dumbbell Bench Press', eq: 'db', pattern: 'bench',
  pri: ['chest'], sec: ['front_delts', 'triceps'], reps: [8, 12], kind: 'compound', start: 50, stretch: true,
  cues: ['Kick DBs up off the knees, then set the shoulders', 'Lower until a deep stretch at chest level', 'Elbows ~45° from torso', 'Press up and slightly in — don\'t clank'],
  mistakes: ['Cutting range short at the bottom', 'Wrists bent back under load', 'Losing shoulder position on the way down'],
  check: ['Got a full stretch at the bottom?', 'Wrists stacked over elbows?', 'Elbows ~45°, not flared?', 'Controlled 2-sec lowering?'],
  subs: ['bb_bench', 'pushup', 'incline_db_press']
});
ex({
  id: 'incline_db_press', name: 'Incline DB Press (30°)', eq: 'db', req: ['incline'], pattern: 'bench',
  pri: ['upper_chest'], sec: ['front_delts', 'triceps', 'chest'], reps: [8, 12], kind: 'compound', start: 45, stretch: true,
  cues: ['Bench at 30° — not steeper', 'Shoulder blades back, chest proud', 'Lower to upper chest for a deep stretch', 'Press in a slight arc over the collarbones'],
  mistakes: ['Bench too steep (turns into a shoulder press)', 'Half reps at the bottom', 'Losing arch and shrugging up'],
  check: ['Bench set to ~30°?', 'DBs reached upper-chest level?', 'Shoulders stayed down (no shrug)?', 'Even tempo both arms?'],
  subs: ['low_incline_bb', 'cable_fly_lh', 'db_bench']
});
ex({
  id: 'low_incline_bb', name: 'Low-Incline Barbell Press', eq: 'bb', req: ['barbell', 'incline'], pattern: 'bench',
  pri: ['upper_chest'], sec: ['chest', 'front_delts', 'triceps'], reps: [6, 10], kind: 'compound', start: 135,
  cues: ['Bench at 15–30° inside the rack', 'Grip just outside shoulder width', 'Touch high on the chest, below collarbones', 'Drive straight up, lock out softly'],
  mistakes: ['Pins set too low to bail safely', 'Bar drifting toward the neck', 'Flaring elbows wide'],
  check: ['Safeties set for a bail-out?', 'Bar touched upper chest every rep?', 'Shoulder blades stayed retracted?', 'Elbows tucked ~45–60°?'],
  subs: ['incline_db_press', 'bb_bench', 'cable_fly_lh']
});
ex({
  id: 'db_fly', name: 'DB Fly (deep stretch)', eq: 'db', pattern: 'bench',
  pri: ['chest'], sec: ['front_delts'], reps: [10, 15], kind: 'iso', start: 25, stretch: true,
  cues: ['Soft, fixed elbow bend the whole set', 'Open wide until a big pec stretch', 'Hug a tree on the way up', 'Stop before DBs touch to keep tension'],
  mistakes: ['Turning it into a press (elbows bending)', 'Going too heavy and losing the stretch', 'Dropping the shoulders forward at the top'],
  check: ['Elbow angle stayed constant?', 'Felt a strong pec stretch at the bottom?', 'Shoulders stayed back on the bench?', 'Controlled the stretch (no bounce)?'],
  subs: ['cable_fly_lh', 'incline_db_fly', 'pushup']
});
ex({
  id: 'incline_db_fly', name: 'Incline DB Fly', eq: 'db', req: ['incline'], pattern: 'bench',
  pri: ['upper_chest'], sec: ['front_delts'], reps: [10, 15], kind: 'iso', start: 20, stretch: true,
  cues: ['Bench at 30°', 'Arc wide and low to a deep stretch', 'Squeeze up over the upper chest', 'Keep elbows soft and fixed'],
  mistakes: ['Pressing instead of flying', 'Short range at the bottom', 'Bench too steep'],
  check: ['Bench at ~30°?', 'Full stretch each rep?', 'Elbows locked at a soft bend?', 'No shoulder pain at the bottom?'],
  subs: ['cable_fly_lh', 'db_fly', 'incline_db_press']
});
ex({
  id: 'cable_fly_lh', name: 'Low-to-High Cable Fly', eq: 'cable', req: ['cable'], pattern: 'press',
  pri: ['upper_chest'], sec: ['front_delts'], reps: [10, 15], kind: 'iso', start: 20, stretch: true,
  cues: ['Low pulley, one arm at a time if single station', 'Start with the arm low and behind you', 'Sweep up and across to chin height', 'Pause and squeeze the upper chest'],
  mistakes: ['Using momentum from the hips', 'Bending the elbow into a curl', 'Not starting from the stretched position'],
  check: ['Started each rep from a stretch?', 'Hand finished near chin height midline?', 'Torso stayed still?', 'Felt upper chest more than shoulder?'],
  subs: ['incline_db_fly', 'incline_db_press', 'db_fly']
});
ex({
  id: 'pushup', name: 'Deficit Push-up (on DBs)', eq: 'bw', pattern: 'pushup', bw: true,
  pri: ['chest'], sec: ['triceps', 'front_delts', 'abs'], reps: [10, 20], kind: 'compound', stretch: true,
  cues: ['Hands on DB handles for extra depth', 'Body one straight plank line', 'Chest sinks below the handles', 'Push the floor away, elbows ~45°'],
  mistakes: ['Hips sagging', 'Head poking forward', 'Shallow reps'],
  check: ['Body stayed in a straight line?', 'Chest went below hand level?', 'Elbows ~45°, not flared?', 'Full lockout each rep?'],
  subs: ['db_bench', 'bb_bench', 'bench_dip']
});

/* ---------------- BACK ---------------- */
ex({
  id: 'pulldown_wide', name: 'Lat Pulldown (wide)', eq: 'cable', req: ['cable'], pattern: 'pulldown',
  pri: ['lats'], sec: ['upper_back', 'biceps', 'rear_delts'], reps: [8, 12], kind: 'compound', start: 120, stretch: true,
  cues: ['Grip ~1.5× shoulder width', 'Let the shoulders rise for a full lat stretch at top', 'Drive elbows down to your back pockets', 'Bar to upper chest, slight lean back'],
  mistakes: ['Yanking with body English', 'Stopping short of the stretch at the top', 'Pulling behind the neck'],
  check: ['Full stretch at the top each rep?', 'Elbows drove down, not back?', 'Torso lean stayed ≤ 20°?', 'Controlled the return?'],
  subs: ['pullup', 'pulldown_close', 'kneel_pd']
});
ex({
  id: 'pulldown_close', name: 'Lat Pulldown (close/neutral)', eq: 'cable', req: ['cable'], pattern: 'pulldown',
  pri: ['lats'], sec: ['biceps', 'upper_back'], reps: [10, 12], kind: 'compound', start: 110, stretch: true,
  cues: ['Neutral or close grip handle', 'Reach tall at the top — let the lats lengthen', 'Pull elbows to the ribs', 'Chest up to meet the handle'],
  mistakes: ['Turning it into a biceps curl', 'Rounding forward at the bottom', 'Short range'],
  check: ['Felt lats more than arms?', 'Reached a full stretch?', 'Handle touched upper chest?', 'No swinging?'],
  subs: ['pulldown_wide', 'pullup', 'kneel_pd']
});
ex({
  id: 'pullup', name: 'Pull-up / Chin-up', eq: 'bw', req: ['pullup'], pattern: 'pullup', bw: true,
  pri: ['lats'], sec: ['biceps', 'upper_back', 'forearms'], reps: [6, 10], kind: 'compound', stretch: true,
  cues: ['Dead hang start — shoulders fully up', 'Pull elbows down and in', 'Chest toward the bar', 'Lower all the way under control'],
  mistakes: ['Kipping / swinging', 'Half reps from a bent arm', 'Craning the chin over the bar'],
  check: ['Started from a dead hang?', 'Chin cleared the bar?', '2-sec lowering?', 'Legs quiet (no kip)?'],
  subs: ['pulldown_wide', 'pulldown_close', 'kneel_pd'], note: 'Add load with a DB between the feet once you exceed 12 reps.'
});
ex({
  id: 'straight_arm_pd', name: 'Straight-arm Cable Pulldown', eq: 'cable', req: ['cable'], pattern: 'pushdown',
  pri: ['lats'], sec: ['triceps', 'rear_delts'], reps: [12, 15], kind: 'iso', start: 40, stretch: true,
  cues: ['Hinge slightly, arms nearly straight', 'Start overhead in a full lat stretch', 'Sweep the bar to your thighs', 'Squeeze lats, pause, return slow'],
  mistakes: ['Bending elbows into a pushdown', 'Shrugging the shoulders up', 'Rushing the stretch'],
  check: ['Elbows stayed nearly straight?', 'Felt it in the lats?', 'Full overhead stretch?', 'Torso angle stayed fixed?'],
  subs: ['pullover', 'kneel_pd', 'pulldown_wide'], note: 'Rope works great here if you have one.'
});
ex({
  id: 'cable_row', name: 'Seated Cable Row', eq: 'cable', req: ['cable'], pattern: 'row',
  pri: ['upper_back'], sec: ['lats', 'rear_delts', 'biceps'], reps: [10, 12], kind: 'compound', start: 110, stretch: true,
  cues: ['Tall chest, slight knee bend', 'Let shoulder blades protract at the front', 'Row to the lower ribs', 'Squeeze blades together 1 sec'],
  mistakes: ['Rocking the torso for momentum', 'Shrugging at the finish', 'No stretch at the front'],
  check: ['Torso stayed nearly still?', 'Full reach forward each rep?', 'Shoulders stayed down?', 'Paused at the squeeze?'],
  subs: ['cs_row', 'db_row', 'bb_row']
});
ex({
  id: 'db_row', name: 'Single-arm DB Row', eq: 'db', pattern: 'row',
  pri: ['lats'], sec: ['upper_back', 'rear_delts', 'biceps'], reps: [10, 12], kind: 'compound', start: 50, stretch: true,
  cues: ['Hand and knee on the bench, flat back', 'Let the DB hang for a stretch', 'Pull elbow toward the hip', 'Lower with control'],
  mistakes: ['Twisting the torso to lift', 'Pulling to the chest (all biceps)', 'Short range at the bottom'],
  check: ['Back stayed flat?', 'Elbow traveled toward the hip?', 'Full hang at the bottom?', 'No torso rotation?'],
  subs: ['cs_row', 'cable_row', 'bb_row'], note: 'SelectTech tops out at 52.5 lb — add pauses or reps when maxed.'
});
ex({
  id: 'cs_row', name: 'Chest-supported Incline DB Row', eq: 'db', req: ['incline'], pattern: 'row',
  pri: ['upper_back'], sec: ['lats', 'rear_delts', 'biceps'], reps: [8, 12], kind: 'compound', start: 40, stretch: true,
  cues: ['Chest on a 30–45° incline, feet driving', 'Arms hang straight down for the stretch', 'Row elbows back ~45°', 'Squeeze 1 sec at the top'],
  mistakes: ['Lifting the chest off the pad', 'Shrugging the DBs up', 'Bouncing the bottom'],
  check: ['Chest stayed glued to the pad?', 'Full stretch at the bottom?', 'Shoulders stayed down?', 'Paused at the top?'],
  subs: ['db_row', 'cable_row', 'bb_row']
});
ex({
  id: 'bb_row', name: 'Barbell Row', eq: 'bb', req: ['barbell'], pattern: 'row',
  pri: ['upper_back'], sec: ['lats', 'rear_delts', 'biceps', 'hamstrings'], reps: [6, 10], kind: 'compound', start: 135,
  cues: ['Hinge to ~45°, neutral spine', 'Brace hard before each rep', 'Row to the lower chest / upper belly', 'Lower to full arm extension'],
  mistakes: ['Standing up as the set goes on', 'Rounded lower back', 'Jerking the bar with the hips'],
  check: ['Torso angle held ~45°?', 'Spine stayed neutral?', 'Bar touched the torso?', 'No hip thrust to start reps?'],
  subs: ['cs_row', 'cable_row', 'db_row']
});
ex({
  id: 'kneel_pd', name: 'Kneeling Single-arm Cable Pulldown', eq: 'cable', req: ['cable'], pattern: 'pulldown',
  pri: ['lats'], sec: ['upper_back', 'biceps'], reps: [10, 15], kind: 'iso', start: 40, stretch: true,
  cues: ['Kneel facing the stack, reach high', 'Let the lat stretch fully at the top', 'Pull elbow down to the hip', 'Slight lean toward the working side'],
  mistakes: ['Rotating the torso to cheat', 'Short stretch', 'Pulling with the biceps'],
  check: ['Big stretch at the top?', 'Elbow finished by the hip?', 'Torso stayed square?', 'Equal reps both sides?'],
  subs: ['pulldown_close', 'straight_arm_pd', 'pulldown_wide']
});
ex({
  id: 'pullover', name: 'DB / KB Pullover', eq: 'db', loadCount: 1, pattern: 'bench',
  pri: ['lats'], sec: ['chest', 'triceps'], reps: [10, 15], kind: 'iso', start: 35, stretch: true,
  cues: ['Lie across or along the bench, hold one DB', 'Lower behind the head with soft elbows', 'Stretch the lats and ribs', 'Pull back to above the chest'],
  mistakes: ['Bending elbows into a triceps extension', 'Arching the low back excessively', 'Going too heavy'],
  check: ['Elbow angle stayed fixed?', 'Felt a lat stretch overhead?', 'Ribs stayed down?', 'Smooth tempo?'],
  subs: ['straight_arm_pd', 'kneel_pd', 'pulldown_wide']
});

/* ---------------- SHOULDERS ---------------- */
ex({
  id: 'db_ohp', name: 'Seated DB Overhead Press', eq: 'db', pattern: 'ohp',
  pri: ['front_delts'], sec: ['side_delts', 'triceps', 'upper_chest'], reps: [8, 12], kind: 'compound', start: 40,
  cues: ['Bench upright (80–90°)', 'DBs start at ear level, wrists stacked', 'Press up and slightly in', 'Don\'t lean back — ribs down'],
  mistakes: ['Excessive back arch', 'Half reps at the bottom', 'Clanking DBs at the top'],
  check: ['DBs lowered to ear level?', 'Ribs stayed down?', 'Forearms vertical?', 'Smooth lockout?'],
  subs: ['bb_ohp', 'incline_db_press', 'db_lat']
});
ex({
  id: 'bb_ohp', name: 'Standing Barbell OHP', eq: 'bb', req: ['barbell'], pattern: 'ohp',
  pri: ['front_delts'], sec: ['side_delts', 'triceps', 'abs'], reps: [6, 10], kind: 'compound', start: 95,
  cues: ['Squeeze glutes and brace', 'Bar starts on the front delts', 'Move the head back, press straight up', 'Head through at lockout'],
  mistakes: ['Leaning back into a standing incline', 'Pressing forward around the face', 'Soft core / knees bending'],
  check: ['Glutes + abs braced?', 'Bar path vertical?', 'Head came through at the top?', 'No layback?'],
  subs: ['db_ohp', 'incline_db_press', 'db_lat']
});
ex({
  id: 'db_lat', name: 'DB Lateral Raise', eq: 'db', pattern: 'raise',
  pri: ['side_delts'], sec: [], reps: [12, 20], kind: 'iso', start: 17.5,
  cues: ['Slight forward lean, soft elbows', 'Raise out to the sides, lead with elbows', 'Stop at shoulder height', 'Lower slow — 2 seconds'],
  mistakes: ['Swinging with the hips', 'Shrugging traps up', 'Going way too heavy'],
  check: ['Elbows led the movement?', 'Stopped near shoulder height?', 'No body swing?', 'Traps stayed quiet?'],
  subs: ['cable_lat', 'leanaway_lat', 'y_raise']
});
ex({
  id: 'cable_lat', name: 'Cable Lateral Raise (behind body)', eq: 'cable', req: ['cable'], pattern: 'raise',
  pri: ['side_delts'], sec: [], reps: [12, 20], kind: 'iso', start: 10, stretch: true,
  cues: ['Low pulley, cable runs behind your body', 'Start with the hand across the hip — stretched', 'Raise out to shoulder height', 'Control all the way back'],
  mistakes: ['Cable in front of the body (loses the stretch)', 'Leaning to cheat', 'Shrugging'],
  check: ['Cable passed behind the body?', 'Started from the stretched position?', 'Torso stayed tall?', 'Smooth tempo?'],
  subs: ['leanaway_lat', 'db_lat', 'y_raise']
});
ex({
  id: 'leanaway_lat', name: 'Lean-away DB Lateral Raise', eq: 'db', pattern: 'raise',
  pri: ['side_delts'], sec: [], reps: [12, 20], kind: 'iso', start: 15, stretch: true,
  cues: ['Hold the rack, lean away ~20°', 'Raise the DB from in front of the hip', 'Lead with the elbow to shoulder height', 'Slow lowering for stretch tension'],
  mistakes: ['Pulling with the support arm', 'Rotating the torso', 'Too heavy'],
  check: ['Kept the lean fixed?', 'Rep began from the stretch?', 'Elbow led?', 'Equal reps both arms?'],
  subs: ['cable_lat', 'db_lat', 'y_raise']
});
ex({
  id: 'y_raise', name: 'Incline Y-Raise', eq: 'db', req: ['incline'], pattern: 'raise',
  pri: ['side_delts'], sec: ['upper_back', 'rear_delts'], reps: [12, 20], kind: 'iso', start: 10,
  cues: ['Chest down on a 30–45° incline', 'Thumbs up, arms in a Y', 'Raise to ear level', 'Light weight, crisp reps'],
  mistakes: ['Shrugging traps', 'Too heavy — arms bend', 'Lifting the chest off the pad'],
  check: ['Arms traced a Y shape?', 'Chest stayed on the pad?', 'Traps quiet?', 'Full control?'],
  subs: ['db_lat', 'face_pull', 'rear_fly']
});
ex({
  id: 'rear_fly', name: 'Chest-supported Rear-delt Fly', eq: 'db', req: ['incline'], pattern: 'raise',
  pri: ['rear_delts'], sec: ['upper_back'], reps: [12, 20], kind: 'iso', start: 15,
  cues: ['Chest on incline, arms hanging', 'Pinkies lead, sweep out wide', 'Think "push the DBs away"', 'Pause at shoulder level'],
  mistakes: ['Squeezing blades (turns into upper-back row)', 'Bending elbows a lot', 'Swinging'],
  check: ['Arms swept wide, not back?', 'Felt rear delts?', 'Elbows soft but fixed?', 'Chest stayed on the pad?'],
  subs: ['face_pull', 'y_raise', 'cs_row']
});
ex({
  id: 'face_pull', name: 'Cable Face Pull (high pulley)', eq: 'cable', req: ['cable'], pattern: 'row',
  pri: ['rear_delts'], sec: ['upper_back', 'side_delts'], reps: [15, 20], kind: 'iso', start: 40,
  cues: ['Pulley at face height or above', 'Pull toward the eyes, elbows high', 'Rotate hands back at the end', 'Hold 1 sec'],
  mistakes: ['Elbows dropping into a row', 'Leaning back', 'Too heavy to rotate'],
  check: ['Elbows stayed high?', 'Hands finished beside the ears?', 'Torso stayed upright?', 'Paused at the finish?'],
  subs: ['rear_fly', 'y_raise', 'cable_row'], note: 'Best with a rope; a bar/handle works if you don\'t have one.'
});

/* ---------------- ARMS ---------------- */
ex({
  id: 'incline_curl', name: 'Incline DB Curl', eq: 'db', req: ['incline'], pattern: 'curl',
  pri: ['biceps'], sec: ['forearms'], reps: [10, 15], kind: 'iso', start: 20, stretch: true,
  cues: ['Bench at 45–60°, arms hang behind the torso', 'Curl without moving the upper arm forward', 'Squeeze at the top', 'Lower all the way to the stretch'],
  mistakes: ['Elbows swinging forward', 'Cutting the bottom short', 'Bench too upright'],
  check: ['Upper arm stayed back?', 'Full stretch at the bottom?', 'No shoulder swing?', '2-sec lowering?'],
  subs: ['cable_curl', 'bb_curl', 'hammer_curl']
});
ex({
  id: 'bb_curl', name: 'Barbell Curl', eq: 'bb', req: ['barbell'], pattern: 'curl',
  pri: ['biceps'], sec: ['forearms'], reps: [8, 12], kind: 'iso', start: 65,
  cues: ['Shoulder-width grip, elbows by sides', 'Curl without leaning back', 'Squeeze hard at the top', 'Control down to full extension'],
  mistakes: ['Hip swing', 'Elbows drifting forward', 'Half reps'],
  check: ['No body English?', 'Full extension each rep?', 'Elbows stayed pinned?', 'Wrists neutral?'],
  subs: ['cable_curl', 'incline_curl', 'hammer_curl']
});
ex({
  id: 'hammer_curl', name: 'Hammer Curl', eq: 'db', pattern: 'curl',
  pri: ['biceps'], sec: ['forearms'], reps: [10, 15], kind: 'iso', start: 30,
  cues: ['Neutral grip, thumbs up', 'Elbows by your sides', 'Curl across or straight up', 'Slow negative'],
  mistakes: ['Swinging the DBs', 'Shoulders rolling forward', 'Rushing reps'],
  check: ['Neutral grip held?', 'Elbows stayed still?', 'Full range?', 'No swing?'],
  subs: ['cable_curl', 'bb_curl', 'incline_curl']
});
ex({
  id: 'cable_curl', name: 'Cable Curl', eq: 'cable', req: ['cable'], pattern: 'curl',
  pri: ['biceps'], sec: ['forearms'], reps: [10, 15], kind: 'iso', start: 50,
  cues: ['Low pulley, step back a half step', 'Elbows slightly in front of the torso', 'Curl and squeeze', 'Constant tension — no rest at the bottom'],
  mistakes: ['Leaning back', 'Elbows flaring', 'Letting the stack touch down'],
  check: ['Constant tension?', 'Elbows stayed fixed?', 'Squeezed at the top?', 'Torso still?'],
  subs: ['incline_curl', 'bb_curl', 'hammer_curl']
});
ex({
  id: 'preacher_db', name: 'Preacher-style DB Curl (incline back)', eq: 'db', req: ['incline'], pattern: 'curl',
  pri: ['biceps'], sec: [], reps: [10, 15], kind: 'iso', start: 20, stretch: true,
  cues: ['Stand behind an incline bench, armpit over the top pad', 'Upper arm flat on the back pad', 'Lower to almost straight', 'Curl up, don\'t let the elbow lift'],
  mistakes: ['Dropping fast into the stretch', 'Elbow lifting off the pad', 'Too heavy'],
  check: ['Upper arm stayed on the pad?', 'Controlled the bottom?', 'Full squeeze at top?', 'No shoulder involvement?'],
  subs: ['incline_curl', 'cable_curl', 'hammer_curl']
});
ex({
  id: 'oh_db_ext', name: 'Overhead DB Triceps Extension', eq: 'db', loadCount: 1, pattern: 'triceps',
  pri: ['triceps'], sec: [], reps: [10, 15], kind: 'iso', start: 40, stretch: true,
  cues: ['Seated, one DB in both hands overhead', 'Lower behind the head for a deep stretch', 'Elbows point forward, not out', 'Extend fully at the top'],
  mistakes: ['Elbows flaring wide', 'Arching the low back', 'Short range'],
  check: ['Deep stretch behind the head?', 'Elbows stayed narrow?', 'Ribs down?', 'Full lockout?'],
  subs: ['oh_cable_ext', 'db_skull', 'pushdown']
});
ex({
  id: 'oh_cable_ext', name: 'Overhead Cable Extension', eq: 'cable', req: ['cable'], pattern: 'triceps',
  pri: ['triceps'], sec: [], reps: [10, 15], kind: 'iso', start: 40, stretch: true,
  cues: ['Face away from the low/mid pulley', 'Staggered stance, slight lean', 'Let hands go deep behind the head', 'Extend forward and up'],
  mistakes: ['Elbows drifting down', 'Moving the shoulders', 'Partial reps'],
  check: ['Got the stretch?', 'Upper arms stayed fixed?', 'Full extension?', 'Stable stance?'],
  subs: ['oh_db_ext', 'db_skull', 'pushdown'], note: 'Rope is ideal; a straight bar works too.'
});
ex({
  id: 'pushdown', name: 'Cable Pushdown', eq: 'cable', req: ['cable'], pattern: 'pushdown',
  pri: ['triceps'], sec: [], reps: [10, 15], kind: 'iso', start: 50,
  cues: ['High pulley, elbows pinned to ribs', 'Push down to full lockout', 'Squeeze 1 sec', 'Return to ~90° only'],
  mistakes: ['Elbows flaring and moving', 'Leaning over the bar', 'Using bodyweight'],
  check: ['Elbows stayed pinned?', 'Locked out each rep?', 'Torso still?', 'Controlled return?'],
  subs: ['oh_cable_ext', 'db_skull', 'bench_dip'], note: 'Rope or bar both fine.'
});
ex({
  id: 'db_skull', name: 'DB Skull Crusher', eq: 'db', pattern: 'bench',
  pri: ['triceps'], sec: [], reps: [10, 15], kind: 'iso', start: 25, stretch: true,
  cues: ['Lie flat, DBs over the shoulders', 'Lower beside the head, elbows slightly back', 'Stretch, then extend', 'Keep upper arms still'],
  mistakes: ['Turning it into a press', 'Elbows flaring', 'Dropping fast near the face'],
  check: ['Elbows stayed narrow?', 'Lowered past the forehead?', 'Upper arms stayed still?', 'Controlled tempo?'],
  subs: ['oh_db_ext', 'pushdown', 'cg_bench']
});
ex({
  id: 'cg_bench', name: 'Close-grip Bench Press', eq: 'bb', req: ['barbell'], pattern: 'bench',
  pri: ['triceps'], sec: ['chest', 'front_delts'], reps: [6, 10], kind: 'compound', start: 135,
  cues: ['Grip ~shoulder width', 'Tuck elbows close to the torso', 'Touch lower chest', 'Press hard to lockout'],
  mistakes: ['Grip too narrow (wrist pain)', 'Elbows flaring', 'Bouncing'],
  check: ['Grip about shoulder width?', 'Elbows tucked?', 'Controlled touch?', 'Full lockout?'],
  subs: ['db_skull', 'bench_dip', 'pushup']
});
ex({
  id: 'bench_dip', name: 'Bench Dip', eq: 'bw', pattern: 'pushup', bw: true,
  pri: ['triceps'], sec: ['chest', 'front_delts'], reps: [10, 20], kind: 'iso',
  cues: ['Hands on the bench edge, fingers forward', 'Hips close to the bench', 'Lower to ~90° elbow bend', 'Press up to lockout'],
  mistakes: ['Going too deep (shoulder strain)', 'Hips drifting forward', 'Shrugging'],
  check: ['Elbows ~90° at bottom?', 'Hips close to bench?', 'Shoulders stayed down?', 'No shoulder pain?'],
  subs: ['pushdown', 'db_skull', 'pushup']
});

/* ---------------- LEGS ---------------- */
ex({
  id: 'back_squat', name: 'Back Squat (high bar)', eq: 'bb', req: ['barbell'], pattern: 'squat',
  pri: ['quads'], sec: ['glutes', 'hamstrings', 'abs'], reps: [6, 10], kind: 'compound', start: 185, stretch: true,
  cues: ['Bar on the traps, grip tight', 'Big breath, brace 360°', 'Sit down between the heels, knees track toes', 'Hips below knees, drive up through mid-foot'],
  mistakes: ['Cutting depth above parallel', 'Knees caving in', 'Hips shooting up first'],
  check: ['Hip crease went below knee?', 'Knees tracked over toes?', 'Heels stayed down?', 'Chest and hips rose together?', 'Safety pins set?'],
  subs: ['goblet_squat', 'heel_squat', 'bss']
});
ex({
  id: 'front_squat', name: 'Front Squat', eq: 'bb', req: ['barbell'], pattern: 'squat',
  pri: ['quads'], sec: ['glutes', 'abs', 'upper_back'], reps: [6, 10], kind: 'compound', start: 135, stretch: true,
  cues: ['Bar on the front delts, elbows high', 'Upright torso, brace', 'Sit straight down, deep', 'Drive elbows up out of the hole'],
  mistakes: ['Elbows dropping', 'Rounding upper back', 'Shallow depth'],
  check: ['Elbows stayed high?', 'Below parallel?', 'Torso stayed upright?', 'Heels down?'],
  subs: ['goblet_squat', 'back_squat', 'heel_squat']
});
ex({
  id: 'goblet_squat', name: 'Goblet Squat (KB/DB)', eq: 'db', loadCount: 1, pattern: 'squat',
  pri: ['quads'], sec: ['glutes', 'abs'], reps: [10, 15], kind: 'compound', start: 50, stretch: true,
  cues: ['Hold DB/KB at the chest', 'Elbows inside the knees at the bottom', 'Sit deep, chest tall', 'Drive up through the whole foot'],
  mistakes: ['Weight drifting forward', 'Heels lifting', 'Short depth'],
  check: ['Below parallel?', 'Heels down?', 'Chest up?', 'Knees out over toes?'],
  subs: ['heel_squat', 'back_squat', 'bss']
});
ex({
  id: 'heel_squat', name: 'Heel-elevated DB Squat', eq: 'db', pattern: 'squat',
  pri: ['quads'], sec: ['glutes'], reps: [10, 15], kind: 'compound', start: 45, stretch: true,
  cues: ['Heels on a 2.5–10 lb plate', 'DBs at sides or goblet', 'Knees travel far forward', 'Deep, upright, controlled'],
  mistakes: ['Bouncing out of the bottom', 'Knees caving', 'Rushing'],
  check: ['Full depth?', 'Knees well forward over toes?', 'Torso upright?', 'Controlled 2-sec descent?'],
  subs: ['goblet_squat', 'bss', 'back_squat']
});
ex({
  id: 'bss', name: 'Bulgarian Split Squat (DB)', eq: 'db', pattern: 'lunge',
  pri: ['quads'], sec: ['glutes'], reps: [8, 12], kind: 'compound', start: 35, stretch: true,
  cues: ['Rear foot laces-down on the bench', 'Front foot far enough that heel stays down', 'Drop straight down, slight forward lean', 'Drive through the front heel'],
  mistakes: ['Front foot too close (heel lifts)', 'Pushing off the back leg', 'Wobbly knee'],
  check: ['Back knee almost touched the floor?', 'Front heel stayed down?', 'Knee tracked over toes?', 'Same reps each leg?'],
  subs: ['lunge', 'goblet_squat', 'heel_squat']
});
ex({
  id: 'lunge', name: 'DB Walking / Reverse Lunge', eq: 'db', pattern: 'lunge',
  pri: ['glutes'], sec: ['quads', 'hamstrings'], reps: [10, 12], kind: 'compound', start: 40, stretch: true,
  cues: ['Long stride, tall torso', 'Back knee kisses the floor', 'Drive through the front foot', 'Reverse lunge if space is tight'],
  mistakes: ['Short choppy steps', 'Knee caving', 'Leaning way forward'],
  check: ['Back knee near the floor?', 'Front knee tracked over toes?', 'Balanced and controlled?', 'Reps counted per leg?'],
  subs: ['bss', 'goblet_squat', 'heel_squat']
});
ex({
  id: 'rdl', name: 'Romanian Deadlift (BB/DB)', eq: 'bb', req: ['barbell'], pattern: 'hinge',
  pri: ['hamstrings'], sec: ['glutes', 'upper_back', 'forearms'], reps: [6, 10], kind: 'compound', start: 165, stretch: true,
  cues: ['Soft knees, push hips straight back', 'Bar slides down the thighs', 'Stop at a deep hamstring stretch (mid-shin)', 'Squeeze glutes to stand'],
  mistakes: ['Rounding the lower back', 'Squatting it down (knees bend too much)', 'Bar drifting away from legs'],
  check: ['Back stayed neutral?', 'Felt a big hamstring stretch?', 'Bar stayed close?', 'Hips moved back, not down?'],
  subs: ['sl_rdl', 'pull_through', 'deadlift'], note: 'No barbell? Use two SelectTechs (same cues).'
});
ex({
  id: 'deadlift', name: 'Conventional Deadlift', eq: 'bb', req: ['barbell'], pattern: 'hinge',
  pri: ['glutes'], sec: ['hamstrings', 'quads', 'upper_back', 'forearms'], reps: [5, 8], kind: 'compound', start: 225,
  cues: ['Mid-foot under the bar, shins touch', 'Pull the slack out, chest up', 'Push the floor away', 'Lock out with glutes, no lean back'],
  mistakes: ['Jerking the bar off the floor', 'Rounded back', 'Hips rising first'],
  check: ['Bar stayed over mid-foot?', 'Neutral spine?', 'Hips and shoulders rose together?', 'Clean lockout?'],
  subs: ['rdl', 'hip_thrust', 'kb_swing']
});
ex({
  id: 'hip_thrust', name: 'Barbell Hip Thrust', eq: 'bb', req: ['barbell'], pattern: 'hipthrust',
  pri: ['glutes'], sec: ['hamstrings'], reps: [8, 12], kind: 'compound', start: 185,
  cues: ['Upper back on the bench edge, pad on the bar', 'Feet flat, shins vertical at the top', 'Tuck chin, ribs down', 'Drive hips up, squeeze 1 sec'],
  mistakes: ['Overarching the low back at the top', 'Feet too far / too close', 'Not reaching full hip extension'],
  check: ['Shins vertical at lockout?', 'Ribs down / no arch?', 'Paused at the top?', 'Felt glutes, not low back?'],
  subs: ['pull_through', 'kb_swing', 'sl_rdl']
});
ex({
  id: 'kb_swing', name: 'Kettlebell Swing', eq: 'kb', req: ['kb'], pattern: 'swing',
  pri: ['glutes'], sec: ['hamstrings', 'abs', 'upper_back'], reps: [12, 20], kind: 'compound', start: 35,
  cues: ['Hike the bell back between the legs', 'Snap the hips — arms are ropes', 'Bell floats to chest height', 'Plank at the top'],
  mistakes: ['Squatting the swing', 'Lifting with the arms', 'Leaning back at the top'],
  check: ['Hinged, not squatted?', 'Hip snap drove the bell?', 'Plank position at top?', 'Neutral back?'],
  subs: ['pull_through', 'hip_thrust', 'rdl']
});
ex({
  id: 'sl_rdl', name: 'Single-leg DB RDL', eq: 'db', pattern: 'hinge',
  pri: ['hamstrings'], sec: ['glutes'], reps: [8, 12], kind: 'compound', start: 35, stretch: true,
  cues: ['DB in the opposite hand', 'Hinge on one leg, back leg reaches long', 'Square hips to the floor', 'Stand tall, squeeze glute'],
  mistakes: ['Hips opening up', 'Rounding the back', 'Rushing balance'],
  check: ['Hips stayed square?', 'Stretched the standing hamstring?', 'Neutral spine?', 'Controlled balance?'],
  subs: ['rdl', 'pull_through', 'slide_curl']
});
ex({
  id: 'pull_through', name: 'Cable Pull-through', eq: 'cable', req: ['cable'], pattern: 'hinge',
  pri: ['glutes'], sec: ['hamstrings'], reps: [12, 15], kind: 'compound', start: 60, stretch: true,
  cues: ['Face away from the low pulley, rope/handle between legs', 'Push hips back to a hamstring stretch', 'Snap hips forward', 'Squeeze glutes at the top'],
  mistakes: ['Pulling with the arms', 'Squatting down', 'Hyperextending at the top'],
  check: ['Hips moved back, not down?', 'Arms stayed long?', 'Full hip lockout?', 'No low-back lean?'],
  subs: ['kb_swing', 'rdl', 'hip_thrust']
});
ex({
  id: 'slide_curl', name: 'Sliding Leg Curl (towel)', eq: 'none', pattern: 'hipthrust', bw: true,
  pri: ['hamstrings'], sec: ['glutes', 'calves'], reps: [8, 12], kind: 'iso',
  cues: ['Lie on your back, heels on a towel (smooth floor)', 'Bridge hips up and hold', 'Slide heels out slowly, then curl back', 'Keep hips high throughout'],
  mistakes: ['Hips dropping', 'Rushing the eccentric', 'Arching the back'],
  check: ['Hips stayed up?', '3-sec slide out?', 'Full curl back in?', 'Felt hamstrings?'],
  subs: ['sl_rdl', 'rdl', 'pull_through'], note: 'Closest sub for the leg-curl machine you don\'t have.'
});
ex({
  id: 'calf_stand', name: 'Standing DB Calf Raise', eq: 'db', pattern: 'calf',
  pri: ['calves'], sec: [], reps: [10, 15], kind: 'iso', start: 50, stretch: true,
  cues: ['Balls of the feet on a plate or step', 'Drop into a deep stretch, pause 2 sec', 'Rise all the way up', 'Pause at the top'],
  mistakes: ['Bouncing', 'Partial range', 'Knees bending'],
  check: ['2-sec stretch pause?', 'Full rise each rep?', 'No bouncing?', 'Knees stayed straight?'],
  subs: ['calf_seated'], note: 'One DB, single-leg, when 52.5 lb gets easy.'
});
ex({
  id: 'calf_seated', name: 'Seated DB Calf Raise', eq: 'db', pattern: 'calf',
  pri: ['calves'], sec: [], reps: [12, 20], kind: 'iso', start: 50,
  cues: ['Sit on the bench, balls of feet on a plate', 'DBs on the knees', 'Deep stretch, then rise high', 'Slow tempo'],
  mistakes: ['Bouncing', 'Short range', 'Too fast'],
  check: ['Full stretch?', 'Full rise?', 'Controlled tempo?', 'Felt the soleus burn?'],
  subs: ['calf_stand']
});

/* ---------------- CORE ---------------- */
ex({
  id: 'rollout', name: 'Ab Roller Rollout', eq: 'roller', req: ['abroller'], pattern: 'rollout',
  pri: ['abs'], sec: ['lats'], reps: [8, 12], kind: 'core',
  cues: ['Kneel, ribs tucked, glutes squeezed', 'Roll out as far as you can hold a flat back', 'Pull back with the abs, not hips', 'Exhale on the return'],
  mistakes: ['Low back sagging', 'Hips leading back first', 'Going beyond control'],
  check: ['Low back stayed neutral?', 'Ribs stayed down?', 'Controlled return?', 'No back pain?'],
  subs: ['dead_bug', 'plank', 'cable_crunch']
});
ex({
  id: 'knee_raise', name: 'Hanging Knee Raise', eq: 'bw', req: ['pullup'], pattern: 'hang',
  pri: ['abs'], sec: ['forearms', 'obliques'], reps: [10, 15], kind: 'core',
  cues: ['Dead hang, shoulders active', 'Curl the pelvis up — knees to chest', 'No swinging', 'Lower slowly'],
  mistakes: ['Swinging for momentum', 'Just lifting thighs (hip flexors only)', 'Dropping fast'],
  check: ['Pelvis curled up?', 'No swing?', 'Slow lowering?', 'Grip held out?'],
  subs: ['cable_crunch', 'dead_bug', 'rollout']
});
ex({
  id: 'cable_crunch', name: 'Cable Crunch', eq: 'cable', req: ['cable'], pattern: 'crunch',
  pri: ['abs'], sec: ['obliques'], reps: [10, 15], kind: 'core', start: 60,
  cues: ['Kneel facing the high pulley, hands by the head', 'Hips stay fixed', 'Crunch ribs toward pelvis', 'Stretch tall at the top'],
  mistakes: ['Sitting back with the hips', 'Pulling with arms', 'Short range'],
  check: ['Hips stayed still?', 'Spine flexed fully?', 'Stretched at top?', 'Felt abs?'],
  subs: ['rollout', 'knee_raise', 'dead_bug'], note: 'Rope ideal; towel through a handle works.'
});
ex({
  id: 'mb_slam', name: 'Med-ball Slam', eq: 'mb', req: ['medball'], pattern: 'swing',
  pri: ['abs'], sec: ['lats', 'glutes'], reps: [8, 12], kind: 'core', start: 12,
  cues: ['Reach tall overhead', 'Slam down with abs and lats', 'Hinge to catch on the bounce', 'Fast and explosive'],
  mistakes: ['Using only arms', 'Rounded back on the pick-up', 'Low intent'],
  check: ['Full overhead reach?', 'Explosive slam?', 'Safe pick-up hinge?', 'Steady rhythm?'],
  subs: ['kb_swing', 'cable_crunch', 'rollout']
});
ex({
  id: 'russian_twist', name: 'Med-ball Russian Twist', eq: 'mb', req: ['medball'], pattern: 'crunch',
  pri: ['obliques'], sec: ['abs'], reps: [10, 16], kind: 'core', start: 8,
  cues: ['Sit tall, lean back ~45°', 'Rotate from the ribs, not just arms', 'Tap the ball beside each hip', 'Light ball — core strength, no bulk'],
  mistakes: ['Rounding the back', 'Only moving the arms', 'Going heavy'],
  check: ['Chest stayed tall?', 'Ribcage rotated?', 'Controlled tempo?', 'Felt obliques?'],
  subs: ['pallof', 'dead_bug', 'plank']
});
ex({
  id: 'dead_bug', name: 'Dead Bug', eq: 'none', pattern: 'plank',
  pri: ['abs'], sec: ['obliques'], reps: [8, 12], kind: 'core',
  cues: ['Low back pressed into the floor', 'Opposite arm and leg extend', 'Exhale fully as you reach', 'Slow and controlled'],
  mistakes: ['Back arching off the floor', 'Moving too fast', 'Holding breath'],
  check: ['Low back stayed flat?', 'Opposite limbs moved together?', 'Full exhale each rep?', 'Slow tempo?'],
  subs: ['plank', 'rollout', 'pallof']
});
ex({
  id: 'plank', name: 'Plank / Side Plank', eq: 'none', pattern: 'plank', unit: 'sec',
  pri: ['abs'], sec: ['obliques'], reps: [30, 60], kind: 'core',
  cues: ['Elbows under shoulders', 'Squeeze glutes, tuck ribs', 'Straight line head to heel', 'Breathe behind the brace'],
  mistakes: ['Hips sagging', 'Hips piked up', 'Holding breath'],
  check: ['Straight body line?', 'Glutes squeezed?', 'Breathing steady?', 'No low-back ache?'],
  subs: ['dead_bug', 'rollout', 'pallof']
});
ex({
  id: 'pallof', name: 'Pallof Press (cable)', eq: 'cable', req: ['cable'], pattern: 'press',
  pri: ['obliques'], sec: ['abs'], reps: [10, 12], kind: 'core', start: 20,
  cues: ['Stand side-on to a chest-height pulley', 'Hands at the sternum', 'Press straight out, resist rotation', 'Hold 2 sec, return'],
  mistakes: ['Rotating toward the stack', 'Standing too close (no tension)', 'Shrugging'],
  check: ['Torso stayed square?', 'Arms pressed straight out?', '2-sec hold?', 'Both sides done?'],
  subs: ['dead_bug', 'plank', 'russian_twist']
});

/* ---------------- RECOVERY ---------------- */
ex({
  id: 'zone2_walk', name: 'Zone-2 Walk / KB Flow', eq: 'none', pattern: 'walk', unit: 'min',
  pri: [], sec: [], reps: [20, 30], kind: 'recovery',
  cues: ['Conversational pace — you can talk in full sentences', 'Nasal breathing if possible', 'Push the stroller, walk the kids — it counts', 'Light KB carries are fine'],
  mistakes: ['Turning it into a hard workout', 'Skipping it entirely', 'Ignoring hydration'],
  check: ['Could hold a conversation?', 'Stayed 20+ minutes?', 'Felt better after, not worse?', 'Heart rate easy (~60–70% max)?'],
  subs: ['mobility_flow']
});
ex({
  id: 'mobility_flow', name: 'Mobility Flow', eq: 'none', pattern: 'lunge', unit: 'min',
  pri: [], sec: [], reps: [8, 12], kind: 'recovery',
  cues: ['World\'s greatest stretch × 5/side', 'Deep goblet hold 60 sec', 'Thoracic openers × 10', 'Dead hang 30 sec'],
  mistakes: ['Rushing through', 'Forcing painful ranges', 'Holding breath'],
  check: ['Moved through hips, T-spine, shoulders?', 'Breathed slowly?', 'No pain?', 'Felt looser after?'],
  subs: ['zone2_walk']
});

export const EXERCISES = LIST;
const BY_ID = Object.fromEntries(LIST.map(e => [e.id, e]));
export function getEx(id) { return Object.hasOwn(BY_ID, id) ? BY_ID[id] : null; }
export function muscleName(m) { return MUSCLES[m] || m; }
export function groupOf(muscle) {
  for (const [g, list] of Object.entries(GROUPS)) if (list.includes(muscle)) return g;
  return 'Other';
}
