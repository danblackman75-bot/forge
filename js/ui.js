// UI primitives: icons, toasts, sheets, confetti, shared app hooks.
import { esc } from './util.js';

// Views call ui.render()/ui.go() — app.js wires these up (avoids import cycles).
export const ui = {
  tab: 'today',
  render() {},
  go() {},
  state: {}
};

const ICONS = {
  today: '<path d="M12 3l1.9 5.6H20l-4.9 3.6 1.9 5.8L12 14.4 7 18l1.9-5.8L4 8.6h6.1z"/>',
  plan: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  history: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"/><path d="M12 8v4l3 2"/>',
  library: '<path d="M5 4h4v16H5zM10 4h4v16h-4zM15.5 5l3.6-.9 3 15.6-3.6.9z"/>',
  body: '<circle cx="12" cy="5" r="2.5"/><path d="M6 9l6 1 6-1M12 10v5M9 21l3-6 3 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  play: '<path d="M7 4.5v15l13-7.5z"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  note: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.6 1.6 2 2.5 2C11 7.5 11.5 5 12 3z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  dumbbell: '<path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

export function toast(msg, { kind = '', ms = 2600, html = false } = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = html ? msg : esc(msg);
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, ms);
}

export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const cols = ['#ff5f1f', '#ff8a1f', '#ffb321', '#ffd166', '#ffffff', '#3ddc97'];
  const P = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 13 - 4,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, c: cols[(Math.random() * cols.length) | 0]
  }));
  const t0 = performance.now();
  (function frame(t) {
    const dt = t - t0;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      g.globalAlpha = Math.max(0, 1 - dt / 1900);
      g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
    }
    if (dt < 1900) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

let sheetStack = [];

export function openSheet(html, { title = '', onClose = null, cls = '' } = {}) {
  const opener = document.activeElement;
  const previous = sheetStack[sheetStack.length - 1];
  const root = document.getElementById('sheet-root');
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-backdrop"></div>
    <section class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}" tabindex="-1">
      <div class="sheet-handle"></div>
      ${title ? `<header class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>` : ''}
      <div class="sheet-body">${html}</div>
    </section>`;
  root.appendChild(wrap);
  document.body.classList.add('no-scroll');
  if (previous) previous.el.inert = true;
  for (const id of ['app', 'onboard']) { const el = document.getElementById(id); if (el) el.inert = true; }
  requestAnimationFrame(() => wrap.classList.add('open'));
  const api = {
    el: wrap.querySelector('.sheet'),
    body: wrap.querySelector('.sheet-body'),
    setBody(h) { api.body.innerHTML = h; },
    close() {
      if (!wrap.isConnected || !sheetStack.includes(api)) return;
      wrap.classList.remove('open');
      sheetStack = sheetStack.filter(s => s !== api);
      if (!sheetStack.length) document.body.classList.remove('no-scroll');
      const top = sheetStack[sheetStack.length - 1];
      if (top) top.el.inert = false;
      else for (const id of ['app', 'onboard']) { const el = document.getElementById(id); if (el) el.inert = false; }
      if (opener?.isConnected && !opener.closest('[inert]')) opener.focus();
      setTimeout(() => wrap.remove(), 280);
      if (onClose) onClose();
    }
  };
  wrap.querySelector('.sheet-backdrop').addEventListener('click', api.close);
  wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) api.close(); });
  sheetStack.push(api);
  api.el.focus();
  return api;
}

export function closeAllSheets() { [...sheetStack].forEach(s => s.close()); }

document.addEventListener('keydown', e => {
  if (document.querySelector('.fc')) return;
  if (e.key === 'Escape' && sheetStack.length) sheetStack[sheetStack.length - 1].close();
  if (e.key === 'Tab' && sheetStack.length) {
    const el = sheetStack[sheetStack.length - 1].el;
    const focusable = [...el.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(x => !x.disabled && !x.hidden && x.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) { e.preventDefault(); el.focus(); }
    else if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || document.activeElement === el)) { e.preventDefault(); first.focus(); }
  }
});

export function confirmSheet(msg, { ok = 'Confirm', danger = false, title = 'Are you sure?' } = {}) {
  return new Promise(resolve => {
    let done = false;
    const s = openSheet(`<p class="muted">${esc(msg)}</p>
      <div class="btn-row"><button class="btn ghost" data-v="0">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-v="1">${esc(ok)}</button></div>`,
    { title, onClose: () => { if (!done) resolve(false); } });
    s.body.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      done = true; resolve(b.dataset.v === '1'); s.close();
    });
  });
}

export function chip(label, { on = false, attrs = '' } = {}) {
  return `<button class="chip ${on ? 'on' : ''}" ${attrs}>${esc(label)}</button>`;
}

export function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } }
