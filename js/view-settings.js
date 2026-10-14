// Settings sheet: profile, units, equipment, priorities, timer, backup/restore, reset.
import { store, exportData, importData, resetData } from './store.js';
import { MUSCLES, REQ_LABEL } from './exercises.js';
import { EXP, toDispW, fromDispW, unitW } from './logic.js';
import { loadDemo } from './demo.js';
import { ui, icon, openSheet, toast, confirmSheet } from './ui.js';
import { esc, isoDate, round } from './util.js';

export const EQUIP_TOGGLES = [
  ['barbell', 'Barbell + plates', 'Off = removes barbell moves'],
  ['pullup', 'Pull-up bar on rack', ''],
  ['incline', 'Adjustable bench (incline)', 'Off = "flat only": incline variants auto-swap'],
  ['cable', 'Cable stack (pulldown / low row)', ''],
  ['rope', 'Rope attachment', 'Bar/handle used otherwise'],
  ['kb', 'Adjustable kettlebell (12–40 lb)', ''],
  ['medball', 'Medicine ball', ''],
  ['abroller', 'Ab roller', '']
];

const toggle = (key, on, label, sub = '') => `<label class="toggle"><span><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span><input type="checkbox" data-t="${key}" ${on ? 'checked' : ''}><i></i></label>`;

let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });

export function openSettings() {
  const sh = openSheet('', { title: 'Settings', cls: 'tall' });
  const paint = () => {
    const p = store.d.profile, s = store.d.settings;
    sh.setBody(`
      ${installEvt ? `<button class="btn primary block" data-s="install">${icon('download')} Install Forge app</button>` : ''}
      <h4>Profile</h4>
      <div class="form-grid">
        <label><span>Name</span><input data-p="name" value="${esc(p.name)}" autocomplete="given-name"></label>
        <label><span>Bodyweight (${unitW()})</span><input data-p="bw" inputmode="decimal" value="${toDispW(p.bw)}"></label>
        <label><span>Days / week</span><select data-p="daysPerWeek">${[3, 4, 5, 6, 7].map(d => `<option ${p.daysPerWeek === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        <label><span>Session length</span><select data-p="sessionMin">${[30, 45, 60, 75, 90].map(d => `<option value="${d}" ${p.sessionMin === d ? 'selected' : ''}>${d} min</option>`).join('')}</select></label>
      </div>
      <h4>Experience</h4>
      <div class="seg">${Object.entries(EXP).map(([k, v]) => `<button class="${p.exp === k ? 'on' : ''}" data-exp="${k}">${v.label}</button>`).join('')}</div>
      <h4>Units</h4>
      <div class="seg">${['lb', 'kg'].map(u => `<button class="${s.units === u ? 'on' : ''}" data-unit="${u}">${u === 'lb' ? 'lb / in' : 'kg / cm'}</button>`).join('')}</div>
      <p class="tiny muted">Dumbbell steps always snap to SelectTech 552 plates (5–52.5 lb).</p>
      <h4>Priority muscles <small class="muted">(+30% volume)</small></h4>
      <div class="chips wrap">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${p.priority.includes(k) ? 'on' : ''}" data-prio="${k}">${v}</button>`).join('')}</div>
      <h4>Equipment</h4>
      <div class="toggles">${EQUIP_TOGGLES.map(([k, l, sub]) => toggle('equip.' + k, s.equip[k] !== false, l, sub)).join('')}</div>
      <h4>Rest timer</h4>
      <div class="toggles">${toggle('autoRest', s.autoRest, 'Auto-start after each set')}${toggle('sound', s.sound, 'Beep at zero')}${toggle('vibrate', s.vibrate, 'Vibrate at zero')}</div>
      <h4>Data</h4>
      <p class="tiny muted">Everything lives on this device. ${store.d.sessions.length} sessions · ${store.d.body.length} body entries.</p>
      <div class="btn-col">
        <button class="btn ghost block" data-s="export">${icon('download')} Export backup (JSON)</button>
        <label class="btn ghost block file-btn">${icon('upload')} Import backup<input type="file" accept="application/json,.json" class="sr-only" data-s="import"></label>
        <button class="btn ghost block" data-s="demo">${icon('spark')} Load sample data (6 weeks)</button>
        <button class="btn ghost block" data-s="onboard">Re-run onboarding</button>
        <button class="btn danger-ghost block" data-s="reset">${icon('trash')} Reset everything</button>
      </div>
      <p class="tiny muted center">Forge v1 · offline-first PWA · no account, no tracking</p>`);
  };
  paint();
  sh.body.addEventListener('change', e => {
    const t = e.target;
    const p = store.d.profile, s = store.d.settings;
    if (t.dataset.p) {
      const k = t.dataset.p;
      if (k === 'name') p.name = t.value.trim();
      if (k === 'bw') { const v = parseFloat(t.value); if (v > 0) p.bw = round(fromDispW(v), 1); }
      if (k === 'daysPerWeek' || k === 'sessionMin') p[k] = +t.value;
    }
    if (t.dataset.t) {
      const k = t.dataset.t;
      if (k.startsWith('equip.')) s.equip[k.slice(6)] = t.checked; else s[k] = t.checked;
    }
    if (t.dataset.s === 'import' && t.files[0]) {
      const r = new FileReader();
      r.onload = () => {
        try { importData(r.result); toast('Backup restored', { kind: 'ok' }); sh.close(); ui.render(); }
        catch (err) { toast(`Import failed: ${err.message}`, { kind: 'err' }); }
      };
      r.readAsText(t.files[0]);
      return;
    }
    store.save();
    ui.render();
  });
  sh.body.addEventListener('click', async e => {
    const t = e.target;
    const p = store.d.profile;
    const ex = t.closest('[data-exp]');
    if (ex) { p.exp = ex.dataset.exp; store.save(); paint(); return ui.render(); }
    const u = t.closest('[data-unit]');
    if (u) { store.d.settings.units = u.dataset.unit; store.save(); paint(); return ui.render(); }
    const pr = t.closest('[data-prio]');
    if (pr) {
      const k = pr.dataset.prio;
      p.priority = p.priority.includes(k) ? p.priority.filter(x => x !== k) : [...p.priority, k];
      store.save(); paint(); return ui.render();
    }
    const b = t.closest('[data-s]');
    if (!b || b.tagName === 'INPUT') return;
    const a = b.dataset.s;
    if (a === 'install' && installEvt) { installEvt.prompt(); installEvt = null; paint(); }
    if (a === 'export') {
      const blob = new Blob([exportData()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `forge-backup-${isoDate()}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast('Backup downloaded', { kind: 'ok' });
    }
    if (a === 'demo') {
      if (store.d.sessions.length && !await confirmSheet('Replace your current history with 6 weeks of sample data?', { ok: 'Load sample', danger: true })) return;
      loadDemo(); toast('Sample data loaded', { kind: 'ok' }); sh.close(); ui.go('today');
    }
    if (a === 'onboard') { store.d.onboarded = false; store.save(); sh.close(); ui.render(); }
    if (a === 'reset') {
      if (!await confirmSheet('Erase ALL data on this device? Export a backup first if you want to keep it.', { ok: 'Erase everything', danger: true })) return;
      resetData(); sh.close(); ui.render();
    }
  });
}
