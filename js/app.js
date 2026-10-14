// Forge — app shell & router.
import { store } from './store.js';
import { refreshDeload } from './logic.js';
import { ui, icon, closeAllSheets } from './ui.js';
import { unlockAudio } from './timer.js';
import { renderToday } from './view-today.js';
import { renderPlan } from './view-plan.js';
import { renderHistory } from './view-history.js';
import { renderLibrary } from './view-library.js';
import { renderBody } from './view-body.js';
import { openSettings } from './view-settings.js';
import { renderOnboarding } from './view-onboarding.js';

const VIEWS = { today: renderToday, plan: renderPlan, history: renderHistory, library: renderLibrary, body: renderBody };
const TITLES = { today: 'Today', plan: 'Plan', history: 'History', library: 'Library', body: 'Body' };
const TABS = [['today', 'Today', 'today'], ['plan', 'Plan', 'plan'], ['history', 'History', 'history'], ['library', 'Library', 'library'], ['body', 'Body', 'body']];

const $ = s => document.querySelector(s);

function shell() {
  $('#tabbar').innerHTML = TABS.map(([k, label, ic]) =>
    `<button class="tab" data-tab="${k}" aria-label="${label}">${icon(ic)}<span>${label}</span><i class="dot"></i></button>`).join('');
  $('#btn-settings').innerHTML = icon('gear');
}

function render() {
  const app = $('#app'), ob = $('#onboard');
  if (!store.d.onboarded) {
    app.hidden = true; ob.hidden = false;
    renderOnboarding(ob);
    return;
  }
  ob.hidden = true; app.hidden = false;
  if (!VIEWS[ui.tab]) ui.tab = 'today';
  $('#title').textContent = store.d.active && ui.tab === 'today' ? 'Workout' : TITLES[ui.tab];
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('on', t.dataset.tab === ui.tab);
    t.classList.toggle('live', t.dataset.tab === 'today' && !!store.d.active);
  });
  const root = $('#view');
  root.onclick = null; root.oninput = null; root.onchange = null;
  VIEWS[ui.tab](root);
}

function go(tab) {
  closeAllSheets();
  if (tab !== ui.tab) {
    ui.tab = tab;
    if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
    window.scrollTo(0, 0);
    const v = $('#view');
    v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
  }
  render();
}

ui.render = render;
ui.go = go;

function init() {
  shell();
  const h = location.hash.slice(1);
  if (VIEWS[h]) ui.tab = h;
  $('#tabbar').addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) go(t.dataset.tab); });
  $('#btn-settings').addEventListener('click', openSettings);
  window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (VIEWS[k] && k !== ui.tab) go(k); });
  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('storage', e => { if (e.key === 'forge.v1') location.reload(); });
  refreshDeload();
  render();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !window.__FORGE_STANDALONE__) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW registration failed', err));
  }
}

init();
