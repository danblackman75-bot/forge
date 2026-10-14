// Rest timer: floating pill with progress ring, expandable, vibrate + WebAudio beep at zero.
import { store } from './store.js';
import { fmtClock, esc } from './util.js';
import { icon, vibrate } from './ui.js';

let actx = null;
const T = { end: 0, total: 0, label: '', iv: null, el: null, big: false, doneAt: 0 };

export function unlockAudio() {
  try {
    if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); }
    if (actx && actx.state === 'suspended') actx.resume();
  } catch (e) { /* no audio */ }
}

export function beep() {
  if (!store.d.settings.sound || !actx) return;
  const t0 = actx.currentTime + 0.01;
  [0, 0.22, 0.44].forEach((dt, i) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine';
    o.frequency.value = i === 2 ? 1320 : 880;
    g.gain.setValueAtTime(0.0001, t0 + dt);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + (i === 2 ? 0.35 : 0.16));
    o.connect(g); g.connect(actx.destination);
    o.start(t0 + dt); o.stop(t0 + dt + 0.4);
  });
}

function ensureEl() {
  if (T.el && T.el.isConnected) return;
  T.el = document.createElement('div');
  T.el.className = 'rest';
  T.el.hidden = true;
  document.body.appendChild(T.el);
  T.el.addEventListener('click', e => {
    const b = e.target.closest('[data-rt]');
    if (!b) { if (e.target.closest('.rest-pill')) { T.big = true; paint(); } return; }
    e.stopPropagation();
    const a = b.dataset.rt;
    if (a === 'add') addRest(15);
    if (a === 'sub') addRest(-15);
    if (a === 'skip') stopRest();
    if (a === 'min') { T.big = false; paint(); }
  });
}

export function isResting() { return !!T.iv; }

export function startRest(sec, label = 'Rest') {
  if (!sec || sec <= 0) return;
  unlockAudio();
  ensureEl();
  T.total = sec * 1000;
  T.end = Date.now() + T.total;
  T.label = label;
  T.doneAt = 0;
  clearInterval(T.iv);
  T.iv = setInterval(tick, 250);
  tick();
}

export function addRest(s) {
  if (!T.iv) return;
  T.end += s * 1000;
  if (T.end > Date.now()) T.doneAt = 0;
  T.total = Math.max(T.total + s * 1000, 1000);
  tick();
}

export function stopRest() {
  clearInterval(T.iv);
  T.iv = null;
  T.big = false;
  if (T.el) { T.el.classList.remove('show', 'big', 'over'); T.el.hidden = true; }
}

function tick() {
  const left = (T.end - Date.now()) / 1000;
  if (left <= 0 && !T.doneAt) {
    T.doneAt = Date.now();
    if (store.d.settings.vibrate) vibrate([280, 120, 280, 120, 480]);
    beep();
  }
  if (T.doneAt && Date.now() - T.doneAt > 4000) { stopRest(); return; }
  paint();
}

function paint() {
  if (!T.el) return;
  const left = Math.max(0, (T.end - Date.now()) / 1000);
  const p = T.total ? left / (T.total / 1000) : 0;
  const over = !!T.doneAt;
  const ringSvg = (size, stroke) => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="rtg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#262b33" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#rtg${size})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
  };
  const time = over ? 'GO!' : fmtClock(left);
  T.el.hidden = false;
  T.el.classList.add('show');
  T.el.classList.toggle('big', T.big);
  T.el.classList.toggle('over', over);
  T.el.innerHTML = T.big
    ? `<div class="rest-big"><button class="icon-btn rest-min" data-rt="min" aria-label="Minimize">${icon('x')}</button>
        <div class="rest-label">${esc(T.label)}</div>
        <div class="rest-ring">${ringSvg(240, 14)}<div class="rest-time">${time}</div></div>
        <div class="btn-row"><button class="btn ghost" data-rt="sub">−15s</button><button class="btn ghost" data-rt="add">+15s</button><button class="btn primary" data-rt="skip">Skip</button></div></div>`
    : `<div class="rest-pill" role="timer" aria-live="off">
        <div class="rest-mini">${ringSvg(40, 5)}${icon('timer')}</div>
        <div class="rest-txt"><b>${time}</b><small>${esc(T.label)}</small></div>
        <button class="pill-btn" data-rt="add">+15</button><button class="pill-btn" data-rt="skip">Skip</button></div>`;
}

document.addEventListener('visibilitychange', () => { if (!document.hidden && T.iv) tick(); });
