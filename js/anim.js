// Animated inline-SVG stick figures. Each movement pattern = two keyframe poses (A <-> B)
// interpolated with SMIL so it loops smoothly with zero JS cost.

const LEGS2 = [['neck', 'hip'], ['hip', 'kneeF'], ['kneeF', 'ankleF'], ['hip', 'kneeB'], ['kneeB', 'ankleB'], ['neck', 'elbow'], ['elbow', 'hand']];
const ONE_LEG = [['neck', 'hip'], ['hip', 'knee'], ['knee', 'ankle'], ['neck', 'elbow'], ['elbow', 'hand']];
const STAND = { head: [50, 16], neck: [50, 25], hip: [50, 54], kneeF: [54, 74], ankleF: [56, 94], kneeB: [47, 74], ankleB: [44, 94] };
const SEAT = { head: [46, 27], neck: [45, 36], hip: [44, 64], kneeF: [64, 64], ankleF: [64, 92], kneeB: [63, 65], ankleB: [62, 92] };
const FLOOR = '<line class="fg-floor" x1="4" y1="95" x2="96" y2="95"/>';
const BENCH_FLAT = '<rect class="fg-prop" x="16" y="60" width="54" height="5" rx="2"/><line class="fg-prop-l" x1="22" y1="65" x2="22" y2="95"/><line class="fg-prop-l" x1="64" y1="65" x2="64" y2="95"/>';
const SEAT_PROP = '<rect class="fg-prop" x="32" y="66" width="26" height="4" rx="2"/><line class="fg-prop-l" x1="45" y1="70" x2="45" y2="95"/>';
const shift = (pose, dx, dy, keep = []) => Object.fromEntries(Object.entries(pose).map(([k, [x, y]]) => [k, keep.includes(k) ? [x, y] : [x + dx, y + dy]]));

export const PATTERNS = {
  squat: {
    label: 'Squat', seg: LEGS2, props: FLOOR, dots: [['hand', 5]],
    A: { ...STAND, elbow: [41, 32], hand: [46, 24] },
    B: { head: [60, 45], neck: [56, 52], hip: [36, 72], kneeF: [60, 70], ankleF: [52, 94], kneeB: [58, 71], ankleB: [50, 94], elbow: [48, 58], hand: [53, 50] }
  },
  hinge: {
    label: 'Hinge', seg: LEGS2, props: FLOOR, dots: [['hand', 5]],
    A: { ...STAND, elbow: [51, 40], hand: [52, 54] },
    B: { head: [76, 38], neck: [68, 42], hip: [42, 54], kneeF: [47, 74], ankleF: [50, 94], kneeB: [46, 74], ankleB: [48, 94], elbow: [68, 56], hand: [68, 70] }
  },
  lunge: {
    label: 'Lunge', seg: LEGS2, props: FLOOR, dots: [['hand', 3.5]],
    A: { head: [50, 16], neck: [50, 25], hip: [50, 54], kneeF: [60, 73], ankleF: [63, 94], kneeB: [42, 73], ankleB: [36, 94], elbow: [50, 40], hand: [50, 54] },
    B: { head: [50, 30], neck: [50, 39], hip: [50, 66], kneeF: [68, 68], ankleF: [66, 94], kneeB: [46, 88], ankleB: [30, 92], elbow: [50, 53], hand: [50, 67] }
  },
  bench: {
    label: 'Horizontal press', seg: LEGS2, props: BENCH_FLAT + FLOOR, dots: [['hand', 5]],
    A: { head: [17, 53], neck: [25, 56], hip: [54, 57], kneeF: [70, 60], ankleF: [74, 94], kneeB: [69, 61], ankleB: [72, 94], elbow: [29, 41], hand: [30, 27] },
    B: { elbow: [38, 63], hand: [32, 49] }
  },
  ohp: {
    label: 'Overhead press', seg: LEGS2, props: SEAT_PROP + FLOOR, dots: [['hand', 4]],
    A: { ...SEAT, elbow: [56, 44], hand: [55, 30] },
    B: { elbow: [51, 24], hand: [51, 9] }
  },
  triceps: {
    label: 'Overhead extension', seg: LEGS2, props: SEAT_PROP + FLOOR, dots: [['hand', 4]],
    A: { ...SEAT, elbow: [52, 20], hand: [42, 29] },
    B: { elbow: [51, 20], hand: [52, 6] }
  },
  row: {
    label: 'Row', seg: LEGS2, props: FLOOR, dots: [['hand', 4]],
    A: { head: [76, 38], neck: [68, 42], hip: [42, 54], kneeF: [47, 74], ankleF: [50, 94], kneeB: [46, 74], ankleB: [48, 94], elbow: [68, 56], hand: [68, 70] },
    B: { elbow: [56, 33], hand: [62, 47] }
  },
  pulldown: {
    label: 'Vertical pull', seg: LEGS2, props: SEAT_PROP + FLOOR, cable: [[58, 0], 'hand'], dots: [['hand', 2.5]],
    A: { ...SEAT, elbow: [54, 18], hand: [58, 4] },
    B: { elbow: [42, 50], hand: [53, 33] }
  },
  pullup: {
    label: 'Pull-up', seg: LEGS2, props: '<line class="fg-prop-l" x1="26" y1="5" x2="74" y2="5"/>',
    A: { head: [54, 24], neck: [50, 30], hip: [50, 58], kneeF: [48, 76], ankleF: [42, 90], kneeB: [47, 77], ankleB: [41, 91], elbow: [50, 17], hand: [50, 5] },
    B: { head: [54, 8], neck: [50, 14], hip: [50, 42], kneeF: [48, 60], ankleF: [42, 74], kneeB: [47, 61], ankleB: [41, 75], elbow: [42, 20], hand: [50, 5] }
  },
  hang: {
    label: 'Hanging raise', seg: LEGS2, props: '<line class="fg-prop-l" x1="26" y1="5" x2="74" y2="5"/>',
    A: { head: [54, 24], neck: [50, 30], hip: [50, 58], kneeF: [50, 76], ankleF: [49, 93], kneeB: [49, 76], ankleB: [48, 93], elbow: [50, 17], hand: [50, 5] },
    B: { hip: [49, 59], kneeF: [67, 50], ankleF: [70, 68], kneeB: [66, 51], ankleB: [69, 69] }
  },
  curl: {
    label: 'Curl', seg: LEGS2, props: FLOOR, dots: [['hand', 3.5]],
    A: { ...STAND, elbow: [52, 41], hand: [56, 54] },
    B: { elbow: [52, 41], hand: [61, 29] }
  },
  pushdown: {
    label: 'Cable push/pull-down', seg: LEGS2, props: FLOOR, cable: [[72, 0], 'hand'], dots: [['hand', 2.5]],
    A: { ...STAND, elbow: [51, 41], hand: [61, 33] },
    B: { elbow: [51, 41], hand: [54, 56] }
  },
  raise: {
    label: 'Raise', props: FLOOR, dots: [['handL', 3.5], ['handR', 3.5]],
    seg: [['neck', 'hip'], ['hip', 'kneeL'], ['kneeL', 'ankleL'], ['hip', 'kneeR'], ['kneeR', 'ankleR'], ['neck', 'elbowL'], ['elbowL', 'handL'], ['neck', 'elbowR'], ['elbowR', 'handR']],
    A: { head: [50, 16], neck: [50, 26], hip: [50, 54], kneeL: [45, 74], ankleL: [44, 94], kneeR: [55, 74], ankleR: [56, 94], elbowL: [44, 40], handL: [42, 53], elbowR: [56, 40], handR: [58, 53] },
    B: { elbowL: [37, 29], handL: [24, 29], elbowR: [63, 29], handR: [76, 29] }
  },
  calf: {
    label: 'Calf raise', props: '<rect class="fg-prop" x="44" y="93" width="22" height="3" rx="1"/>' + FLOOR, dots: [['hand', 3.5]],
    seg: [...LEGS2, ['ankleF', 'toeF'], ['ankleB', 'toeB']],
    A: { ...STAND, ankleF: [50, 92], ankleB: [48, 92], elbow: [50, 40], hand: [50, 54], toeF: [58, 93], toeB: [56, 93] },
    B: shift({ ...STAND, ankleF: [50, 92], ankleB: [48, 92], elbow: [50, 40], hand: [50, 54], toeF: [58, 93], toeB: [56, 93] }, 0, -6, ['toeF', 'toeB'])
  },
  hipthrust: {
    label: 'Hip thrust', seg: LEGS2, props: '<rect class="fg-prop" x="4" y="58" width="24" height="6" rx="2"/>' + FLOOR, dots: [['hand', 5]],
    A: { head: [20, 50], neck: [27, 56], hip: [46, 78], kneeF: [64, 62], ankleF: [68, 94], kneeB: [63, 63], ankleB: [66, 94], elbow: [38, 68], hand: [46, 74] },
    B: { hip: [52, 56], kneeF: [67, 64], kneeB: [66, 65], elbow: [42, 58], hand: [51, 53] }
  },
  rollout: {
    label: 'Rollout', seg: ONE_LEG, props: FLOOR, dots: [['hand', 6]],
    A: { head: [62, 40], neck: [56, 47], hip: [42, 68], knee: [40, 92], ankle: [22, 93], elbow: [60, 68], hand: [62, 88] },
    B: { head: [80, 68], neck: [72, 72], hip: [54, 82], elbow: [83, 80], hand: [92, 88] }
  },
  plank: {
    label: 'Brace', seg: ONE_LEG, props: FLOOR,
    A: { head: [84, 62], neck: [76, 67], hip: [50, 74], knee: [34, 80], ankle: [16, 91], elbow: [76, 91], hand: [88, 91] },
    B: { hip: [50, 71], head: [84, 61] }
  },
  pushup: {
    label: 'Push-up', seg: ONE_LEG, props: FLOOR,
    A: { head: [82, 56], neck: [74, 61], hip: [48, 72], knee: [32, 80], ankle: [16, 91], elbow: [74, 76], hand: [74, 91] },
    B: { head: [82, 72], neck: [74, 77], hip: [48, 82], knee: [32, 86], elbow: [63, 80] }
  },
  swing: {
    label: 'Swing / slam', seg: LEGS2, props: FLOOR, dots: [['hand', 5]],
    A: { head: [72, 40], neck: [64, 44], hip: [40, 54], kneeF: [48, 72], ankleF: [50, 94], kneeB: [47, 72], ankleB: [48, 94], elbow: [54, 58], hand: [46, 68] },
    B: { ...STAND, elbow: [64, 30], hand: [78, 30] }
  },
  crunch: {
    label: 'Crunch', seg: ONE_LEG, props: FLOOR, cable: [[60, 0], 'hand'],
    A: { head: [53, 30], neck: [52, 38], hip: [50, 66], knee: [48, 92], ankle: [28, 93], elbow: [60, 34], hand: [56, 28] },
    B: { head: [74, 59], neck: [70, 52], hip: [48, 68], elbow: [72, 62], hand: [70, 54] }
  },
  walk: {
    label: 'Walk', seg: LEGS2, props: FLOOR,
    A: { ...STAND, kneeF: [57, 73], ankleF: [62, 94], kneeB: [45, 73], ankleB: [40, 94], elbow: [46, 40], hand: [44, 53] },
    B: { kneeF: [45, 73], ankleF: [40, 94], kneeB: [57, 73], ankleB: [62, 94], elbow: [54, 40], hand: [57, 53] }
  },
  press: {
    label: 'Press out', seg: LEGS2, props: FLOOR, cable: [[98, 34], 'hand'], dots: [['hand', 2.5]],
    A: { ...STAND, elbow: [56, 40], hand: [60, 34] },
    B: { elbow: [64, 33], hand: [77, 33] }
  }
};

const SPLINE = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"';

function anim(attr, a, b, dur) {
  if (a === b) return '';
  return `<animate attributeName="${attr}" values="${a};${b};${a}" dur="${dur}s" ${SPLINE}/>`;
}

export function figureSVG(patternKey, { size = 64, cls = '', dur = 2.4 } = {}) {
  const p = PATTERNS[patternKey] || PATTERNS.curl;
  const A = p.A;
  const B = { ...A, ...p.B };
  let body = '';
  for (const [j1, j2] of p.seg) {
    const a1 = A[j1], a2 = A[j2], b1 = B[j1], b2 = B[j2];
    if (!a1 || !a2) continue;
    body += `<line x1="${a1[0]}" y1="${a1[1]}" x2="${a2[0]}" y2="${a2[1]}">` +
      anim('x1', a1[0], b1[0], dur) + anim('y1', a1[1], b1[1], dur) +
      anim('x2', a2[0], b2[0], dur) + anim('y2', a2[1], b2[1], dur) + '</line>';
  }
  if (p.cable) {
    const [[ax, ay], j] = p.cable;
    body = `<line class="fg-cable" x1="${ax}" y1="${ay}" x2="${A[j][0]}" y2="${A[j][1]}">${anim('x2', A[j][0], B[j][0], dur)}${anim('y2', A[j][1], B[j][1], dur)}</line>` + body;
  }
  const h = A.head, hb = B.head;
  body += `<circle class="fg-head" cx="${h[0]}" cy="${h[1]}" r="6">${anim('cx', h[0], hb[0], dur)}${anim('cy', h[1], hb[1], dur)}</circle>`;
  for (const [j, r] of p.dots || []) {
    const a = A[j], b = B[j];
    body += `<circle class="fg-load" cx="${a[0]}" cy="${a[1]}" r="${r}">${anim('cx', a[0], b[0], dur)}${anim('cy', a[1], b[1], dur)}</circle>`;
  }
  return `<svg class="fig ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${p.label} animation">${p.props || ''}<g class="fg-body">${body}</g></svg>`;
}
