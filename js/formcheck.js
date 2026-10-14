// Camera form check. MediaPipe Tasks Vision PoseLandmarker is lazy-loaded from jsDelivr only
// when the user opens it. Falls back to a guided self-check (record + checklist) when offline
// or unsupported.
import { getEx } from './exercises.js';
import { store } from './store.js';
import { esc, isoDate, round } from './util.js';
import { icon, toast } from './ui.js';
import { figureSVG } from './anim.js';

const MP_VER = '0.10.14';
const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const SQUAT_IDS = ['back_squat', 'front_squat', 'goblet_squat', 'heel_squat'];
const LINKS = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30]];

let lmPromise = null;

function loadLandmarker() {
  if (!lmPromise) {
    lmPromise = (async () => {
      const vision = await import(`${MP_BASE}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${MP_BASE}/wasm`);
      const opts = d => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1 });
      try { return await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); }
      catch (e) { return await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
    })();
    lmPromise.catch(() => { lmPromise = null; });
  }
  return lmPromise;
}

function cameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext !== false;
}

function angle(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
  const d = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180 / Math.PI;
}

export function openFormCheck(exId = 'back_squat') {
  const ex = getEx(exId) || getEx('back_squat');
  const isSquat = SQUAT_IDS.includes(ex.id);
  const root = document.createElement('div');
  root.className = 'fc';
  document.body.appendChild(root);
  document.body.classList.add('no-scroll');
  let stream = null, raf = 0, landmarker = null, facing = 'environment', closed = false;
  let cameraRun = 0, reviewURL = null;
  const stopCamera = () => {
    cameraRun++;
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
  };
  const stats = { reps: 0, deep: 0, phase: 'up', minKnee: 180, maxLean: 0, repBelow: false, last: null, lastMsg: '' };

  const close = () => {
    closed = true;
    stopCamera();
    if (reviewURL) URL.revokeObjectURL(reviewURL);
    root.remove();
    if (!document.querySelector('.sheet-wrap')) document.body.classList.remove('no-scroll');
  };

  const frame = inner => {
    root.innerHTML = `<header class="fc-head"><button class="icon-btn" data-fc="close" aria-label="Close">${icon('back')}</button>
      <div><small>Form check</small><h2>${esc(ex.name)}</h2></div></header><div class="fc-body">${inner}</div>`;
  };

  function intro(msg = '') {
    const online = navigator.onLine;
    const can = cameraSupported();
    const reason = !can ? 'Camera not available in this browser/context.' : '';
    frame(`<div class="card fc-intro">
        <div class="fc-fig">${figureSVG(ex.pattern, { size: 120 })}</div>
        ${msg ? `<div class="banner warn">${esc(msg)}</div>` : ''}
        <h3>${isSquat ? 'AI squat analysis' : 'Live pose overlay'}</h3>
        <p class="muted">Phone side-on at hip height, 2–3 m away, whole body in frame. ${isSquat ? 'Forge checks hip-below-knee depth, knee angle and torso lean every rep.' : 'Forge overlays your skeleton so you can see joint positions; detailed scoring is squat-only for now.'}</p>
        <p class="tiny muted">Runs 100% on-device. The pose engine + model (~15 MB, one time) load from jsDelivr/Google only when you tap start, then work offline. No video leaves your phone.</p>
        <button class="btn primary block" data-fc="cam" ${reason ? 'disabled' : ''}>${icon('camera')} Start camera analysis</button>
        ${reason ? `<p class="tiny warn-t">${esc(reason)}</p>` : ''}
        ${!online ? '<p class="tiny muted">Offline: camera analysis needs a previously cached pose model. The checklist is always available.</p>' : ''}
        <button class="btn ghost block" data-fc="self">${icon('check')} Guided self-check instead</button>
      </div>`);
  }

  async function startCamera() {
    stopCamera();
    const run = cameraRun;
    frame(`<div class="fc-stage"><video playsinline muted autoplay></video><canvas></canvas>
        <div class="fc-loading"><div class="spinner"></div><p>Loading pose model…</p></div></div>
        <div class="fc-stats" id="fc-stats"></div>
        <div class="btn-row"><button class="btn ghost" data-fc="flip">Flip camera</button><button class="btn ghost" data-fc="self">Checklist</button><button class="btn primary" data-fc="save">Save result</button></div>`);
    const video = root.querySelector('video');
    const canvas = root.querySelector('canvas');
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (closed || run !== cameraRun) { st.getTracks().forEach(t => t.stop()); return; }
      stream = st;
      const lm = await loadLandmarker();
      if (closed || run !== cameraRun) return;
      landmarker = lm;
      video.srcObject = st;
      await video.play();
      if (closed || run !== cameraRun) return;
      root.querySelector('.fc-loading').remove();
      root.querySelector('.fc-stage').classList.toggle('mirror', facing === 'user');
      loop(video, canvas);
    } catch (e) {
      if (closed || run !== cameraRun) return;
      console.warn('Form check fallback:', e);
      if (stream) stream.getTracks().forEach(t => t.stop());
      selfCheck(`Camera analysis unavailable (${e && e.name === 'NotAllowedError' ? 'camera permission denied' : 'could not load pose model'}). Use the guided self-check.`);
    }
  }

  function loop(video, canvas) {
    const g = canvas.getContext('2d');
    let lastT = -1;
    const step = () => {
      if (closed) return;
      raf = requestAnimationFrame(step);
      if (video.readyState < 2 || video.currentTime === lastT) return;
      lastT = video.currentTime;
      const W = video.videoWidth, H = video.videoHeight;
      if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
      let res;
      try { res = landmarker.detectForVideo(video, performance.now()); } catch (e) { return; }
      g.clearRect(0, 0, W, H);
      const lms = res && res.landmarks && res.landmarks[0];
      if (!lms) { paintStats(null); return; }
      const P = lms.map(p => ({ x: p.x * W, y: p.y * H, v: p.visibility ?? 1 }));
      const m = analyze(P);
      draw(g, P, m);
      paintStats(m);
    };
    step();
  }

  function analyze(P) {
    const left = (P[23].v + P[25].v + P[27].v) >= (P[24].v + P[26].v + P[28].v);
    const [s, h, k, a] = left ? [11, 23, 25, 27] : [12, 24, 26, 28];
    const sh = P[s], hip = P[h], knee = P[k], ank = P[a];
    const kneeAng = angle(hip, knee, ank);
    const below = hip.y >= knee.y - 2;
    const lean = Math.atan2(Math.abs(sh.x - hip.x), Math.max(1, hip.y - sh.y)) * 180 / Math.PI;
    if (isSquat) {
      if (stats.phase === 'up' && kneeAng < 120) { stats.phase = 'down'; stats.minKnee = kneeAng; stats.repBelow = below; stats.maxLean = lean; }
      if (stats.phase === 'down') {
        stats.minKnee = Math.min(stats.minKnee, kneeAng);
        stats.repBelow = stats.repBelow || below;
        stats.maxLean = Math.max(stats.maxLean, lean);
        if (kneeAng > 155) {
          stats.phase = 'up'; stats.reps++;
          if (stats.repBelow) stats.deep++;
          stats.last = { below: stats.repBelow, knee: Math.round(stats.minKnee), lean: Math.round(stats.maxLean) };
          if (store.d.settings.vibrate && navigator.vibrate) navigator.vibrate(stats.repBelow ? 40 : [60, 60, 60]);
        }
      }
    }
    return { idx: [s, h, k, a], kneeAng, below, lean };
  }

  function draw(g, P, m) {
    const good = m.below ? '#3ddc97' : '#ffb321';
    g.lineWidth = 5; g.lineCap = 'round';
    for (const [i, j] of LINKS) {
      if (P[i].v < 0.3 || P[j].v < 0.3) continue;
      const hot = m.idx.includes(i) && m.idx.includes(j);
      g.strokeStyle = hot ? good : 'rgba(255,255,255,.75)';
      g.beginPath(); g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); g.stroke();
    }
    for (const i of [11, 12, 23, 24, 25, 26, 27, 28]) {
      if (P[i].v < 0.3) continue;
      g.fillStyle = m.idx.includes(i) ? good : '#fff';
      g.beginPath(); g.arc(P[i].x, P[i].y, 6, 0, Math.PI * 2); g.fill();
    }
    const k = P[m.idx[2]];
    g.font = 'bold 22px Inter, system-ui, sans-serif';
    g.fillStyle = '#0b0d10cc'; g.fillRect(k.x + 12, k.y - 18, 64, 28);
    g.fillStyle = good; g.fillText(`${Math.round(m.kneeAng)}°`, k.x + 18, k.y + 4);
  }

  function paintStats(m) {
    const el = root.querySelector('#fc-stats');
    if (!el) return;
    if (!m) { el.innerHTML = '<div class="fc-msg">Step into frame — full body, side-on.</div>'; return; }
    const leanWarn = m.lean > (ex.id === 'back_squat' ? 50 : 40);
    const msg = !isSquat ? 'Skeleton tracking live. Use the checklist for scoring.'
      : stats.last ? (stats.last.below ? `Rep ${stats.reps}: depth ✓ (knee ${stats.last.knee}°)` : `Rep ${stats.reps}: above parallel — sit 2–3 cm deeper`) : 'Squat when ready — reps count automatically.';
    el.innerHTML = `<div class="fc-grid">
        ${isSquat ? `<div><small>Reps</small><b>${stats.reps}</b></div><div><small>To depth</small><b class="${stats.reps && stats.deep < stats.reps ? 'warn-t' : 'ok-t'}">${stats.deep}/${stats.reps}</b></div>` : ''}
        <div><small>Knee</small><b>${Math.round(m.kneeAng)}°</b></div>
        <div><small>Torso lean</small><b class="${leanWarn ? 'warn-t' : ''}">${Math.round(m.lean)}°</b></div>
        <div><small>Hip vs knee</small><b class="${m.below ? 'ok-t' : ''}">${m.below ? 'Below' : 'Above'}</b></div>
      </div><div class="fc-msg">${esc(msg)}${leanWarn ? ' · Chest up — torso leaning a lot.' : ''}</div>`;
  }

  function selfCheck(msg = '') {
    stopCamera();
    frame(`${msg ? `<div class="banner warn">${esc(msg)}</div>` : ''}
      <div class="card">
        <h3>Guided self-check</h3>
        <ol class="steps"><li>Prop your phone side-on at hip height, 2–3 m away.</li><li>Record one working set at your normal tempo.</li><li>Watch it back (slow-mo helps) and tick each item honestly.</li></ol>
        <label class="btn ghost block file-btn">${icon('camera')} Record / pick a video<input type="file" accept="video/*" capture="environment" class="sr-only" data-fc="file"></label>
        <video class="fc-review" playsinline controls hidden></video>
      </div>
      <div class="card"><h3>Checklist</h3><div class="checklist">
        ${ex.check.map((c, i) => `<div class="chk-row" data-i="${i}"><span>${esc(c)}</span><div class="yn"><button class="chip" data-yn="1">Yes</button><button class="chip" data-yn="0">No</button></div></div>`).join('')}
      </div><div class="fc-score" id="fc-score"></div>
      <button class="btn primary block" data-fc="saveself">Save self-check</button></div>
      <div class="card"><h3>Key cues</h3><ul class="cue-list">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`);
  }

  function save(mode) {
    const rec = { id: Date.now(), date: isoDate(), exId: ex.id, mode };
    if (mode === 'camera') {
      Object.assign(rec, { reps: stats.reps, deep: stats.deep, maxLean: round(stats.maxLean) });
    } else {
      const ans = [...root.querySelectorAll('.chk-row')].map(r => { const on = r.querySelector('.chip.on'); return on ? on.dataset.yn === '1' : null; });
      rec.yes = ans.filter(a => a === true).length; rec.total = ex.check.length;
    }
    store.d.formchecks.push(rec);
    store.save();
    toast(mode === 'camera' ? `Saved: ${rec.deep}/${rec.reps} reps to depth` : `Saved self-check: ${rec.yes}/${rec.total} ✓`, { kind: 'ok' });
    close();
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-fc]');
    const yn = e.target.closest('[data-yn]');
    if (yn) {
      yn.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
      yn.classList.add('on');
      const ans = [...root.querySelectorAll('.chk-row .chip.on')];
      const yes = ans.filter(c => c.dataset.yn === '1').length;
      const sc = root.querySelector('#fc-score');
      if (sc) sc.innerHTML = `<b>${yes}/${ex.check.length}</b> passed${ans.length === ex.check.length ? (yes === ex.check.length ? ' — textbook. Load it up.' : ' — fix the "No" items before adding weight.') : ''}`;
      return;
    }
    if (!b) return;
    const a = b.dataset.fc;
    if (a === 'close') close();
    if (a === 'cam') startCamera();
    if (a === 'self') selfCheck();
    if (a === 'flip') { facing = facing === 'user' ? 'environment' : 'user'; if (stream) stream.getTracks().forEach(t => t.stop()); cancelAnimationFrame(raf); startCamera(); }
    if (a === 'save') save('camera');
    if (a === 'saveself') save('self');
  });
  root.addEventListener('change', e => {
    if (e.target.matches('[data-fc="file"]') && e.target.files[0]) {
      const v = root.querySelector('.fc-review');
      if (reviewURL) URL.revokeObjectURL(reviewURL);
      reviewURL = URL.createObjectURL(e.target.files[0]);
      v.src = reviewURL;
      v.hidden = false;
    }
  });

  intro();
}
