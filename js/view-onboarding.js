// First-run wizard: profile -> schedule -> priorities -> equipment -> plan recommendation.
import { store, DEFAULT_PRIORITY } from './store.js';
import { MUSCLES } from './exercises.js';
import { EXP, toDispW, fromDispW, unitW } from './logic.js';
import { PROGRAMS, buildPlan, bestFitProgram, planSets } from './programs.js';
import { loadDemo } from './demo.js';
import { EQUIP_TOGGLES } from './view-settings.js';
import { figureSVG } from './anim.js';
import { ui, icon, toast } from './ui.js';
import { esc, isoDate, round } from './util.js';

const O = { step: 0, pick: null };
const STEPS = 6;

function dots() {
  return `<div class="ob-dots">${Array.from({ length: STEPS }, (_, i) => `<i class="${i <= O.step ? 'on' : ''}"></i>`).join('')}</div>`;
}

function stepHTML() {
  const p = store.d.profile, s = store.d.settings;
  switch (O.step) {
    case 0: return `<div class="ob-hero">
        <div class="ob-logo"><svg viewBox="0 0 64 64" width="84" height="84"><defs><linearGradient id="obg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#obg)"/><path d="M14 26v12M19 21v22M45 21v22M50 26v12M19 32h26" stroke="#0b0d10" stroke-width="5" stroke-linecap="round"/></svg></div>
        <h1>Forge</h1><p class="lead">Your home-gym hypertrophy coach. Tells you exactly what to do today, logs it in seconds, auto-progresses you toward a V-taper.</p>
        <div class="ob-figs">${['squat', 'bench', 'pulldown', 'raise'].map(k => figureSVG(k, { size: 64 })).join('')}</div>
        <ul class="ob-points"><li>${icon('check')} Evidence-based volume, effort & progression</li><li>${icon('check')} Built for SelectTech 552 + rack + cable</li><li>${icon('check')} Works offline · data stays on your phone</li></ul>
      </div>
      <button class="btn primary block xl" data-ob="next">Get started</button>
      <button class="btn ghost block" data-ob="demo">${icon('spark')} Load sample data</button>
      <p class="tiny muted center">Sample data creates ~6 weeks of realistic history so every chart is populated.</p>`;
    case 1: return `<h2>About you</h2><p class="muted">Used for load estimates and bodyweight-exercise e1RMs.</p>
      <div class="form-grid one">
        <label><span>Name</span><input data-f="name" value="${esc(p.name)}" placeholder="Dan" autocomplete="given-name"></label>
        <label><span>Bodyweight (${unitW()})</span><input data-f="bw" inputmode="decimal" value="${toDispW(p.bw)}"></label>
        <label><span>Height (in, optional)</span><input data-f="height" inputmode="decimal" value="${p.height || ''}" placeholder="70"></label>
      </div>
      <h4>Experience</h4>
      <div class="ob-cards">${Object.entries(EXP).map(([k, v]) => `<button class="ob-card ${p.exp === k ? 'on' : ''}" data-exp="${k}"><b>${v.label}</b><small>${k === 'beginner' ? '< 1 year consistent' : k === 'intermediate' ? '1–4 years, knows the lifts' : '4+ years, slow gains'} · ${v.vol.join('–')} sets/muscle/wk</small></button>`).join('')}</div>`;
    case 2: return `<h2>Your week</h2><p class="muted">Be honest — the best plan is the one you'll actually run with two kids at home.</p>
      <h4>Training days per week</h4>
      <div class="seg big">${[3, 4, 5, 6, 7].map(d => `<button class="${p.daysPerWeek === d ? 'on' : ''}" data-days="${d}">${d}</button>`).join('')}</div>
      <h4>Session length</h4>
      <div class="seg">${[30, 45, 60, 75, 90].map(m => `<button class="${p.sessionMin === m ? 'on' : ''}" data-min="${m}">${m}′</button>`).join('')}</div>`;
    case 3: return `<h2>Priority muscles</h2><p class="muted">These get +30% weekly volume. V-taper defaults are pre-selected.</p>
      <div class="chips wrap">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${p.priority.includes(k) ? 'on' : ''}" data-prio="${k}">${v}</button>`).join('')}</div>
      <button class="btn-text" data-ob="vt">Reset to V-taper defaults</button>`;
    case 4: return `<h2>Equipment</h2><p class="muted">Assumed: SelectTech 552 dumbbells (5–52.5 lb). Toggle off what you don't have — exercises auto-swap.</p>
      <div class="toggles">${EQUIP_TOGGLES.map(([k, l, sub]) => `<label class="toggle"><span><b>${esc(l)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><input type="checkbox" data-eq="${k}" ${s.equip[k] !== false ? 'checked' : ''}><i></i></label>`).join('')}</div>`;
    default: {
      const fit = bestFitProgram(p.daysPerWeek);
      if (!O.pick) O.pick = fit === 'fb3' ? 'fb3' : p.daysPerWeek >= 5 ? fit : 'ul4';
      return `<h2>Your plan</h2>
        <div class="card verdict">${icon('bolt')}<p>${p.daysPerWeek <= 3 ? 'With 3 days, <b>Full Body A/B/C</b> hits everything 2–3× a week.' : p.daysPerWeek === 4 ? '<b>4-Day Upper/Lower</b> — every muscle twice a week in ~60 min. Best results per hour for a busy dad.' : `You can train ${p.daysPerWeek} days — <b>${esc(PROGRAMS.find(x => x.id === fit).name)}</b> fits. If life gets busy, drop to the 4-Day Upper/Lower.`} Want to go big? The <b>5-Day Hybrid</b> packs the most V-taper volume.</p></div>
        <div class="ob-cards">${PROGRAMS.map(pr => `<button class="ob-card ${O.pick === pr.id ? 'on' : ''}" data-pick="${pr.id}">
          <b>${esc(pr.name)} ${pr.id === 'ul4' ? '<i class="badge rec">Recommended</i>' : ''}${pr.id === 'hy5' ? '<i class="badge big">Go big</i>' : ''}${pr.id === fit && pr.id !== 'ul4' && pr.id !== 'hy5' ? '<i class="badge fit">Fits your week</i>' : ''}</b>
          <small>${pr.daysPerWeek} days · ~${pr.minutes}′ · ${planSets(buildPlan(pr.id))} sets/wk</small></button>`).join('')}</div>`;
    }
  }
}

export function renderOnboarding(root) {
  root.innerHTML = `<div class="ob">
    ${O.step > 0 ? `<header class="ob-head"><button class="icon-btn" data-ob="back" aria-label="Back">${icon('back')}</button>${dots()}<span></span></header>` : ''}
    <div class="ob-body">${stepHTML()}</div>
    ${O.step > 0 ? `<footer class="ob-foot"><button class="btn primary block xl" data-ob="${O.step === STEPS - 1 ? 'finish' : 'next'}">${O.step === STEPS - 1 ? `${icon('play')} Start training` : 'Continue'}</button></footer>` : ''}
  </div>`;
  root.onclick = e => {
    const t = e.target;
    const p = store.d.profile;
    const ob = t.closest('[data-ob]');
    const set = (fn) => { fn(); store.save(); renderOnboarding(root); };
    if (t.closest('[data-exp]')) return set(() => { p.exp = t.closest('[data-exp]').dataset.exp; });
    if (t.closest('[data-days]')) return set(() => { p.daysPerWeek = +t.closest('[data-days]').dataset.days; O.pick = null; });
    if (t.closest('[data-min]')) return set(() => { p.sessionMin = +t.closest('[data-min]').dataset.min; });
    if (t.closest('[data-prio]')) return set(() => { const k = t.closest('[data-prio]').dataset.prio; p.priority = p.priority.includes(k) ? p.priority.filter(x => x !== k) : [...p.priority, k]; });
    if (t.closest('[data-pick]')) return set(() => { O.pick = t.closest('[data-pick]').dataset.pick; });
    if (!ob) return;
    const a = ob.dataset.ob;
    if (a === 'next') { O.step = Math.min(STEPS - 1, O.step + 1); renderOnboarding(root); window.scrollTo(0, 0); }
    if (a === 'back') { O.step = Math.max(0, O.step - 1); renderOnboarding(root); }
    if (a === 'vt') set(() => { p.priority = [...DEFAULT_PRIORITY]; });
    if (a === 'demo') { loadDemo(); O.step = 0; toast('Sample data loaded — 6 weeks of history', { kind: 'ok' }); ui.go('today'); }
    if (a === 'finish') {
      store.d.planId = O.pick || 'ul4';
      store.d.planStart = isoDate();
      store.d.dayIdx = 0;
      store.d.onboarded = true;
      store.save();
      O.step = 0;
      toast(`Let's go${p.name ? `, ${p.name}` : ''}!`, { kind: 'ok' });
      ui.go('today');
    }
  };
  root.onchange = e => {
    const t = e.target;
    const p = store.d.profile;
    if (t.dataset.f === 'name') p.name = t.value.trim();
    if (t.dataset.f === 'bw') { const v = parseFloat(t.value); if (v > 0) p.bw = round(fromDispW(v), 1); }
    if (t.dataset.f === 'height') { const v = parseFloat(t.value); p.height = v > 0 ? v : null; }
    if (t.dataset.eq) store.d.settings.equip[t.dataset.eq] = t.checked;
    store.save();
  };
}
