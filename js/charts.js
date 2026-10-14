// Hand-rolled SVG charts (no libraries).
import { esc } from './util.js';

let gid = 0;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = ms => { const d = new Date(ms); return `${MON[d.getMonth()]} ${d.getDate()}`; };

function niceTicks(min, max, n = 3) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= step0) || step0;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const t = [];
  for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(4));
  return t;
}

// points: [{x: ms, y: number}]
export function lineChart(points, { w = 340, h = 170, fmt = v => v, target = null, color = 'url(#gA)', empty = 'Log a few sessions to see the trend' } = {}) {
  if (!points || points.length < 2) return `<div class="chart-empty">${esc(empty)}</div>`;
  const id = 'lc' + (++gid);
  const pad = { l: 40, r: 12, t: 12, b: 24 };
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  if (target !== null) ys.push(target);
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = x => pad.l + (x1 === x0 ? 0.5 : (x - x0) / (x1 - x0)) * (w - pad.l - pad.r);
  const Y = y => pad.t + (1 - (y - y0) / (y1 - y0 || 1)) * (h - pad.t - pad.b);
  const pts = points.map(p => [X(p.x), Y(p.y)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h - pad.b} L${pts[0][0].toFixed(1)} ${h - pad.b} Z`;
  const grid = ticks.map(t => `<line class="ch-grid" x1="${pad.l}" x2="${w - pad.r}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ch-lbl" x="${pad.l - 6}" y="${Y(t) + 3}" text-anchor="end">${esc(fmt(t))}</text>`).join('');
  const tgt = target !== null ? `<line class="ch-target" x1="${pad.l}" x2="${w - pad.r}" y1="${Y(target)}" y2="${Y(target)}"/><text class="ch-tlbl" x="${w - pad.r}" y="${Y(target) - 4}" text-anchor="end">target ${esc(fmt(target))}</text>` : '';
  const last = pts[pts.length - 1];
  const dots = pts.length <= 40 ? pts.map(p => `<circle class="ch-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.2"/>`).join('') : '';
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(`Trend: ${points.map(p => `${shortDate(p.x)}: ${fmt(p.y)}`).join('; ')}`)}">
    <defs><linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a18" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a18" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs>
    ${grid}${tgt}
    <path d="${area}" fill="url(#${id}f)"/>
    <path d="${line}" fill="none" stroke="url(#${id}s)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4.5" fill="#ffb321" stroke="#0b0d10" stroke-width="2"/>
    <text class="ch-lbl" x="${pad.l}" y="${h - 6}">${shortDate(x0)}</text>
    <text class="ch-lbl" x="${w - pad.r}" y="${h - 6}" text-anchor="end">${shortDate(x1)}</text>
  </svg>`;
}

// rows: [{label, value, lo, hi, prio}]
export function bandBars(rows, { w = 340 } = {}) {
  if (!rows.length) return '<div class="chart-empty">No sets logged this week yet</div>';
  const id = 'bb' + (++gid);
  const rh = 26, labelW = 92, valW = 34;
  const h = rows.length * rh + 18;
  const max = Math.max(...rows.map(r => Math.max(r.value, r.hi * 1.15)), 1);
  const X = v => labelW + (v / max) * (w - labelW - valW);
  let body = '';
  rows.forEach((r, i) => {
    const y = i * rh + 4;
    const status = r.value < r.lo ? 'under' : r.value > r.hi ? 'over' : 'in';
    body += `<text class="ch-row" x="0" y="${y + 15}">${esc(r.label)}${r.prio ? ' ★' : ''}</text>
      <rect class="ch-track" x="${labelW}" y="${y + 4}" width="${w - labelW - valW}" height="14" rx="7"/>
      <rect class="ch-band" x="${X(r.lo)}" y="${y + 2}" width="${Math.max(2, X(r.hi) - X(r.lo))}" height="18" rx="4"/>
      <rect class="ch-bar ${status}" x="${labelW}" y="${y + 6}" width="${Math.max(0, X(r.value) - labelW)}" height="10" rx="5" fill="${status === 'in' ? `url(#${id})` : ''}"/>
      <text class="ch-val ${status}" x="${w}" y="${y + 15}" text-anchor="end">${+r.value.toFixed(1)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(rows.map(r => `${r.label}: ${r.value} sets, target ${r.lo} to ${r.hi}`).join('; '))}"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs>${body}
    <text class="ch-lbl" x="${labelW}" y="${h - 2}">sets/week · shaded = target band</text></svg>`;
}

// Simple vertical bars: [{label, value}]
export function columnChart(rows, { w = 340, h = 130, fmt = v => v } = {}) {
  if (!rows.length) return '';
  const id = 'cc' + (++gid);
  const max = Math.max(...rows.map(r => r.value), 1);
  const bw = (w - 10) / rows.length;
  let body = '';
  rows.forEach((r, i) => {
    const bh = (r.value / max) * (h - 36);
    const x = 5 + i * bw + bw * 0.18;
    body += `<rect x="${x.toFixed(1)}" y="${(h - 18 - bh).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="url(#${id})" opacity="${i === rows.length - 1 ? 1 : 0.65}"/>
      <text class="ch-lbl" x="${(x + bw * 0.32).toFixed(1)}" y="${(h - 22 - bh).toFixed(1)}" text-anchor="middle">${esc(fmt(r.value))}</text>
      <text class="ch-lbl" x="${(x + bw * 0.32).toFixed(1)}" y="${h - 4}" text-anchor="middle">${esc(r.label)}</text>`;
  });
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(rows.map(r => `${r.label}: ${fmt(r.value)}`).join('; '))}"><defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs>${body}</svg>`;
}

export function ring(pct, { size = 64, stroke = 7, label = '', sub = '' } = {}) {
  const id = 'rg' + (++gid);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#232831" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - p)).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>
    <div class="ring-txt"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
  </div>`;
}

// V-taper gauge: shoulder/waist ratio on a 1.2–1.8 arc, target 1.6.
export function taperGauge(ratio, target = 1.6) {
  const min = 1.2, max = 1.8, w = 220, h = 132, cx = 110, cy = 108, R = 90;
  const ang = v => Math.PI * (1 - (Math.max(min, Math.min(max, v)) - min) / (max - min));
  const pt = (v, rr = R) => [cx + rr * Math.cos(ang(v)), cy - rr * Math.sin(ang(v))];
  const [sx, sy] = pt(min), [ex, ey] = pt(max);
  const [vx, vy] = pt(ratio || min);
  const [tx, ty] = pt(target, R + 10), [tx2, ty2] = pt(target, R - 10);
  const id = 'tg' + (++gid);
  return `<svg class="gauge" viewBox="0 0 ${w} ${h}" role="img" aria-label="V-taper ratio ${ratio ? ratio.toFixed(2) : 'not recorded'}, target ${target}">
    <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#3a3f48"/><stop offset=".55" stop-color="#ff5f1f"/><stop offset="1" stop-color="#ffb321"/></linearGradient></defs>
    <path d="M${sx} ${sy} A${R} ${R} 0 0 1 ${ex} ${ey}" fill="none" stroke="#232831" stroke-width="14" stroke-linecap="round"/>
    ${ratio ? `<path d="M${sx} ${sy} A${R} ${R} 0 0 1 ${vx.toFixed(1)} ${vy.toFixed(1)}" fill="none" stroke="url(#${id})" stroke-width="14" stroke-linecap="round"/>` : ''}
    <line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <text class="ch-lbl" x="${sx}" y="${cy + 22}" text-anchor="middle">${min}</text>
    <text class="ch-lbl" x="${ex}" y="${cy + 22}" text-anchor="middle">${max}</text>
    <text class="g-val" x="${cx}" y="${cy - 18}" text-anchor="middle">${ratio ? ratio.toFixed(2) : '—'}</text>
    <text class="ch-lbl" x="${cx}" y="${cy}" text-anchor="middle">target ${target} "Adonis"</text>
  </svg>`;
}
