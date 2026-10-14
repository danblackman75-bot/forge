// Library tab + exercise detail sheet + reusable exercise picker.
import { EXERCISES, MUSCLES, EQUIP_LABEL, REQ_LABEL, getEx, muscleName } from './exercises.js';
import { available, repUnit, allPRs, wLabel, usesLoad } from './logic.js';
import { figureSVG, PATTERNS } from './anim.js';
import { icon, openSheet } from './ui.js';
import { esc, round } from './util.js';
import { openFormCheck } from './formcheck.js';

const lib = { q: '', m: 'all' };

function matches(ex, q, m) {
  if (ex.kind === 'recovery' && m !== 'all') return false;
  if (m !== 'all' && !ex.pri.includes(m) && !ex.sec.includes(m)) return false;
  if (!q) return true;
  const s = `${ex.name} ${ex.pri.map(muscleName).join(' ')} ${EQUIP_LABEL[ex.eq]}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every(w => s.includes(w));
}

function rowHTML(ex, act = 'open') {
  const ok = available(ex);
  return `<button class="lib-row ${ok ? '' : 'dim'}" data-${act}="${ex.id}">
    <span class="lib-fig">${figureSVG(ex.pattern, { size: 48 })}</span>
    <span class="lib-txt"><b>${esc(ex.name)}</b><small>${ex.pri.map(muscleName).join(', ') || 'Recovery'} · ${EQUIP_LABEL[ex.eq]}</small></span>
    <span class="lib-tags">${ex.stretch ? '<i class="tag stretch">stretch</i>' : ''}${ok ? '' : '<i class="tag">n/a</i>'}</span>
  </button>`;
}

function listHTML() {
  const list = EXERCISES.filter(e => matches(e, lib.q, lib.m));
  if (!list.length) return '<div class="empty">No exercises match. Try another muscle or search.</div>';
  return list.map(e => rowHTML(e)).join('');
}

export function renderLibrary(root) {
  root.innerHTML = `
    <div class="search">${icon('search')}<input id="lib-q" type="search" aria-label="Search exercises" placeholder="Search ${EXERCISES.length} exercises" value="${esc(lib.q)}" autocomplete="off"></div>
    <div class="chips scroll-x" id="lib-m">
      <button class="chip ${lib.m === 'all' ? 'on' : ''}" data-m="all">All</button>
      ${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${lib.m === k ? 'on' : ''}" data-m="${k}">${v}</button>`).join('')}
    </div>
    <p class="tiny muted lib-count" id="lib-count"></p>
    <div class="lib-list" id="lib-list">${listHTML()}</div>`;
  const count = () => { root.querySelector('#lib-count').textContent = `${EXERCISES.filter(e => matches(e, lib.q, lib.m)).length} exercises · ${Object.keys(PATTERNS).length} animated movement patterns`; };
  count();
  root.querySelector('#lib-q').addEventListener('input', e => {
    lib.q = e.target.value;
    root.querySelector('#lib-list').innerHTML = listHTML();
    count();
  });
  root.onclick = e => {
    const m = e.target.closest('[data-m]');
    if (m) {
      lib.m = m.dataset.m;
      root.querySelectorAll('#lib-m .chip').forEach(c => c.classList.toggle('on', c === m));
      root.querySelector('#lib-list').innerHTML = listHTML();
      count();
      return;
    }
    const o = e.target.closest('[data-open]');
    if (o) openExerciseSheet(o.dataset.open);
  };
}

export function openExerciseSheet(id) {
  const ex = getEx(id);
  if (!ex) return;
  const ok = available(ex);
  const missing = ex.req.filter(r => !available({ req: [r] }));
  const pr = allPRs().find(p => p.exId === id);
  const u = repUnit(ex) || ' reps';
  const html = `
    <div class="ex-hero">${figureSVG(ex.pattern, { size: 168, dur: 2.6 })}</div>
    <div class="chips wrap">
      ${ex.pri.map(m => `<span class="chip on static">${muscleName(m)}</span>`).join('')}
      ${ex.sec.map(m => `<span class="chip static">${muscleName(m)} · ½</span>`).join('')}
    </div>
    <div class="facts">
      <div><small>Equipment</small><b>${EQUIP_LABEL[ex.eq]}</b></div>
      <div><small>Rep range</small><b>${ex.reps[0]}–${ex.reps[1]}${u}</b></div>
      <div><small>Type</small><b>${ex.kind === 'iso' ? 'Isolation' : ex.kind[0].toUpperCase() + ex.kind.slice(1)}</b></div>
    </div>
    ${ex.stretch ? '<div class="banner ok">Stretch-biased: loads the muscle at long lengths — great for growth (Maeo 2021/2023, Pedrosa 2022). Try lengthened partials on the last set.</div>' : ''}
    ${!ok ? `<div class="banner warn">Needs: ${missing.map(r => REQ_LABEL[r]).join(', ')} — toggled off in Settings. Forge auto-substitutes it in plans.</div>` : ''}
    ${ex.note ? `<p class="tiny muted">${esc(ex.note)}</p>` : ''}
    ${pr && usesLoad(ex) ? `<div class="pr-strip">${icon('trophy')} Best e1RM <b>${wLabel({ ...ex, eq: ex.eq === 'bw' ? 'db' : ex.eq }, round(pr.e1))}</b> · Heaviest <b>${wLabel(ex, pr.w)}×${pr.wReps}</b></div>` : ''}
    <h3>Cues</h3><ul class="cue-list">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    <h3>Common mistakes</h3><ul class="cue-list bad">${ex.mistakes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    <h3>Form checklist</h3>
    <div class="checklist">${ex.check.map(c => `<label class="chk"><input type="checkbox"><span>${esc(c)}</span></label>`).join('')}</div>
    <button class="btn ghost block" data-fc>${icon('camera')} ${['back_squat', 'front_squat', 'goblet_squat', 'heel_squat'].includes(ex.id) ? 'Camera form check (AI depth)' : 'Form check'}</button>
    ${ex.subs.length ? `<h3>Substitutions</h3><div class="lib-list">${ex.subs.map(s => rowHTML(getEx(s), 'sub')).join('')}</div>` : ''}`;
  const sh = openSheet(html, { title: ex.name, cls: 'tall' });
  sh.body.addEventListener('click', e => {
    const s = e.target.closest('[data-sub]');
    if (s) { sh.close(); setTimeout(() => openExerciseSheet(s.dataset.sub), 150); }
    if (e.target.closest('[data-fc]')) { sh.close(); openFormCheck(ex.id); }
  });
}

// Searchable picker used by the session logger ("add exercise").
export function exercisePicker(onPick, { title = 'Add exercise', filter = null } = {}) {
  let q = '';
  const base = EXERCISES.filter(e => available(e) && (!filter || filter(e)));
  const list = () => base.filter(e => matches(e, q, 'all')).map(e => rowHTML(e, 'pick')).join('') || '<div class="empty">Nothing found</div>';
  const sh = openSheet(`<div class="search">${icon('search')}<input type="search" aria-label="Search exercises" placeholder="Search" data-q autocomplete="off"></div><div class="lib-list" data-list>${list()}</div>`, { title, cls: 'tall' });
  sh.body.querySelector('[data-q]').addEventListener('input', e => { q = e.target.value; sh.body.querySelector('[data-list]').innerHTML = list(); });
  sh.body.addEventListener('click', e => {
    const p = e.target.closest('[data-pick]');
    if (p) { sh.close(); onPick(p.dataset.pick); }
  });
  return sh;
}

