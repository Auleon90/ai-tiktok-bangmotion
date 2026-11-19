// Lemo-native kit runtime: shared by every portrait style kit in lemo/kits/<slug>/.
// Page contract (same as Lemo-Opuscar core/render, MIT): window.DUR, window.render(t), window.READY, window.TEXTS(t).
// Kits draw every frame on one 1080x1920 canvas as a pure function of t (deterministic: no clocks, seeded random only).
//
// Layout guarantees for 9:16 (so a style never spills or collides when it is adapted from 16:9):
//   SAFE  content box, clear of the TikTok top bar, right action rail and bottom UI
//   CAP   caption band below the content box
// Every text goes through block()/text(), which fit the text into its box (wrap, then shrink) and register its box;
// lemo/render.mjs --layout reads window.TEXTS(t) and fails the pre-render QA on overflow, out-of-safe-area or overlaps.

import * as FIG from './clash.js';

export const W = 1080, H = 1920;
export const SAFE = { x0: 84, x1: 960, y0: 210, y1: 1250 };
export const CAP = { x0: 84, x1: 960, y0: 1330, y1: 1560 };
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- maths (same shapes as Lemo core/lib.js)
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const eo = x => { x = clamp(x); return 1 - Math.pow(1 - x, 3); };
export const ei = x => { x = clamp(x); return x * x * x; };
export const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const back = (x, s = 1.7) => { x = clamp(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
export function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const hash = (n, s = 0) => { const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
export function vnoise(x, s = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, s), hash(i + 1, s), u); }
export const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function mix(a, b, u) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- props, scenes, words
export const P = window.PROPS || { totalMs: 10000, scenes: [], words: [] };
export const DUR = P.totalMs / 1000;
export const SC = P.scenes.map((s, i) => ({ ...s, i, t0: s.startMs / 1000, t1: (s.startMs + s.durationMs) / 1000, d: s.durationMs / 1000, vo: (s.vo_ms || s.durationMs) / 1000 }));
export const WORDS = P.words.map(w => ({ text: w.text, t0: w.startMs / 1000, t1: w.endMs / 1000 }));

// the scene at t, its local time lt, progress p, and the previous scene (for transitions)
export function at(t) {
  let i = SC.findIndex(s => t < s.t1); if (i < 0) i = SC.length - 1;
  const s = SC[i]; return { i, s, lt: t - s.t0, p: clamp((t - s.t0) / s.d), prev: SC[i - 1], next: SC[i + 1] };
}

// caption groups: up to 3 words, break on punctuation (same grouping as produce.py ass_captions)
const GROUPS = (() => {
  const out = []; let cur = [];
  WORDS.forEach((w, i) => { cur.push(w); if (cur.length >= 3 || /[.,!?;:]$/.test(w.text) || i === WORDS.length - 1) { out.push(cur); cur = []; } });
  return out.map((g, k) => ({ words: g, t0: g[0].t0, t1: Math.min(g[g.length - 1].t1 + .6, out[k + 1] ? out[k + 1][0].t0 : 1e9) }));
})();
export function capAt(t) {
  const g = GROUPS.find(x => t >= x.t0 && t < x.t1); if (!g) return null;
  let a = -1; g.words.forEach((w, k) => { if (t >= w.t0) a = k; });
  return { words: g.words.map(w => w.text), ws: g.words, active: a, t0: g.t0, t1: g.t1, lt: t - g.t0 };
}

// ---------------------------------------------------------------- images (FLUX, per scene imageSrc)
export const IMG = {};
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => { console.warn('optional missing ' + src); r(null); }; i.src = src; });
export function cover(g, im, x, y, w, h, zoom = 1, fx = .5, fy = .5) {
  if (!im) return false;
  const s = Math.max(w / im.width, h / im.height) * zoom, dw = im.width * s, dh = im.height * s;
  const ox = clamp(x + w / 2 - fx * dw, x + w - dw, x), oy = clamp(y + h / 2 - fy * dh, y + h - dh, y);
  g.drawImage(im, ox, oy, dw, dh); return true;
}
// a filtered copy of an image (grayscale, sepia, contrast…) drawn once, so frames stay cheap and deterministic
export function graded(im, filter, w = 1080, h = 1080) {
  if (!im) return null; const c = mk(w, h), g = c.getContext('2d'); g.filter = filter; cover(g, im, 0, 0, w, h); return c;
}
// duotone: map luminance to a dark -> light ink ramp
export function duotone(im, dark, light, w = 1080, h = 1080, contrast = 1.1) {
  if (!im) return null; const c = mk(w, h), g = c.getContext('2d'); g.filter = `grayscale(1) contrast(${contrast})`; cover(g, im, 0, 0, w, h); g.filter = 'none';
  const d = g.getImageData(0, 0, w, h), D = d.data, p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)), A = p(dark), B = p(light);
  for (let i = 0; i < D.length; i += 4) { const u = D[i] / 255; D[i] = lerp(A[0], B[0], u); D[i + 1] = lerp(A[1], B[1], u); D[i + 2] = lerp(A[2], B[2], u); }
  g.putImageData(d, 0, 0); return c;
}

// ---------------------------------------------------------------- text: fit into a box, draw, register
let TX = [];
export function font(g, size, o) { g.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.family}`; g.letterSpacing = (o.ls ? o.ls * size : 0) + 'px'; }
function wrap(g, text, w) {
  const out = []; for (const para of String(text).split('\n')) {
    let line = ''; for (const word of para.split(/\s+/).filter(Boolean)) {
      const tryL = line ? line + ' ' + word : word;
      if (g.measureText(tryL).width <= w || !line) line = tryL; else { out.push(line); line = word; }
    } out.push(line);
  } return out;
}
// returns {size, lines, lh, widths, h}: the largest size (max..min) whose wrapped lines fit w x h
export function fit(g, text, w, h, o) {
  const max = o.size || 96, min = o.min || Math.min(26, max), lhk = o.lh || 1.15;
  if (o.upper) text = String(text).toUpperCase();
  for (let size = max; size >= min; size -= 2) {
    font(g, size, o); const lines = wrap(g, text, w), widths = lines.map(l => g.measureText(l).width);
    if ((o.maxLines == null || lines.length <= o.maxLines) && lines.length * size * lhk <= h && widths.every(x => x <= w + .5))
      return { size, lines, lh: size * lhk, widths, h: lines.length * size * lhk };
  }
  font(g, min, o); const lines = wrap(g, text, w); return { size: min, lines, lh: min * lhk, widths: lines.map(l => g.measureText(l).width), h: lines.length * min * lhk, over: true };
}
// draw a text block in box {x,y,w,h}; align left|center|right, valign top|middle|bottom. o.reveal(k, line) -> {a, dx, dy} per line
export function block(g, id, text, box, o = {}) {
  if (text == null || text === '') return { x0: box.x, y0: box.y, x1: box.x, y1: box.y };
  const f = fit(g, text, box.w, box.h, o), al = o.align || 'left', va = o.valign || 'top';
  let y = box.y + (va === 'middle' ? (box.h - f.h) / 2 : va === 'bottom' ? box.h - f.h : 0);
  const top = y; let x0 = 1e9, x1 = -1e9;
  font(g, f.size, o); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  f.lines.forEach((ln, k) => {
    const wl = f.widths[k], x = al === 'center' ? box.x + (box.w - wl) / 2 : al === 'right' ? box.x + box.w - wl : box.x;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x + wl);
    const r = o.reveal ? o.reveal(k, ln) : { a: 1 }; if (r.a <= 0) return;
    g.save(); g.globalAlpha *= r.a; g.translate(r.dx || 0, r.dy || 0);
    const base = y + f.size * (o.base ?? .86) + (f.lh - f.size) / 2;
    if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = o.strokeW || f.size * .12; g.strokeText(ln, x, base); }
    if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.shadowBlur ?? f.size * .3; }
    if (o.paint) o.paint(g, ln, x, base, f.size, k); else { g.fillStyle = o.color || '#000'; g.fillText(ln, x, base); }
    g.restore(); y += f.lh;
  });
  const r = { id, text: String(text), x0, y0: top, x1, y1: top + f.h, size: f.size, cap: !!o.cap, layer: o.layer || 0, over: !!f.over };
  if ((o.alpha ?? 1) > .05) TX.push(r); return r;
}
// one line at a point (labels, small caps). Registered like block().
export function text(g, id, s, x, y, o = {}) {
  font(g, o.size || 32, o); const w = g.measureText(s).width, al = o.align || 'left', xx = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = o.color || '#000';
  if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.strokeW || 6; g.lineJoin = 'round'; g.strokeText(s, xx, y); }
  g.fillText(s, xx, y); const sz = o.size || 32;
  if ((o.alpha ?? 1) > .05) TX.push({ id, text: s, x0: xx, y0: y - sz * .8, x1: xx + w, y1: y + sz * .22, size: sz, cap: !!o.cap, layer: o.layer || 0 });
  return w;
}
// register a box drawn by hand (rotated text, multi-piece numbers) so the layout check sees it
export function reg(id, s, b, o = {}) { TX.push({ id, text: String(s), x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, cap: !!o.cap, layer: o.layer || 0, over: !!o.over }); }
export function textWidth(g, s, size, o) { font(g, size, o); return g.measureText(s).width; }

// ---------------------------------------------------------------- captions: fitted into CAP, styled by the kit
// o: {family, weight, color, accent, size, upper, plate(g, x0,y0,x1,y1, a), pop}
export function captions(g, t, o) {
  const c = capAt(t); if (!c) return;
  const words = c.words.slice(0, c.active + 1); if (!words.length) return;
  const full = o.upper ? c.words.join(' ').toUpperCase() : c.words.join(' ');
  const f = fit(g, full, CAP.x1 - CAP.x0 - 40, CAP.y1 - CAP.y0 - 30, { ...o, size: o.size || 76, min: 40, maxLines: 2 });
  font(g, f.size, o);
  // lay out the whole group (so words don't jump), draw only the spoken ones
  const all = (o.upper ? c.words.map(w => w.toUpperCase()) : c.words), sp = g.measureText(' ').width;
  const rows = []; let row = [], rw = 0;
  all.forEach((w, k) => { const ww = g.measureText(w).width; if (row.length && rw + sp + ww > CAP.x1 - CAP.x0 - 40) { rows.push({ row, rw }); row = []; rw = 0; } row.push({ w, ww, k }); rw += (row.length > 1 ? sp : 0) + ww; });
  rows.push({ row, rw });
  const lh = f.size * 1.18, top = CAP.y0 + 12, x0 = Math.min(...rows.map(r => (W - r.rw) / 2)), x1 = Math.max(...rows.map(r => (W + r.rw) / 2));
  if (o.plate) o.plate(g, x0 - 28, top - 14, x1 + 28, top + rows.length * lh + 10, clamp(c.lt / .12));
  rows.forEach((r, ri) => {
    let x = (W - r.rw) / 2; const y = top + ri * lh + f.size * .9;
    r.row.forEach(({ w, ww, k }) => {
      if (k <= c.active) {
        const isA = k === c.active, wt = c.ws[k];
        const pop = o.pop && isA && wt ? 1 + .08 * (1 - eo(seg(t, wt.t0, wt.t0 + .18))) : 1;
        g.save(); g.translate(x + ww / 2, y - f.size * .35); g.scale(pop, pop); g.translate(-(x + ww / 2), -(y - f.size * .35));
        if (o.stroke) { g.lineJoin = 'round'; g.strokeStyle = o.stroke; g.lineWidth = o.strokeW || f.size * .14; g.strokeText(w, x, y); }
        g.fillStyle = isA ? (o.accent || o.color) : o.color; g.fillText(w, x, y); g.restore();
      }
      x += ww + sp;
    });
  });
  TX.push({ id: 'caption', text: full, x0, y0: top, x1, y1: top + rows.length * lh, size: f.size, cap: true, layer: 9 });
}

// ---------------------------------------------------------------- numbers
export function parseNum(v) { const m = String(v).replace(/\./g, '').replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; }
export function countUp(v, u) { // "1.500" -> animated, keeps id-ID thousands dots and suffix text
  const s = String(v), n = parseNum(s); if (n == null || Math.abs(n) < 2) return s;
  const cur = Math.round(n * eo(u)); const str = cur.toLocaleString('id-ID');
  return s.replace(/-?[\d.,]+/, str);
}

// ---------------------------------------------------------------- boot
export async function boot({ fonts = [], draw, images = true }) {
  const faces = fonts.map(([fam, url, weight = '400', style = 'normal']) => new FontFace(fam, `url(${url})`, { weight, style }));
  for (const f of faces) { try { await f.load(); document.fonts.add(f); } catch (e) { console.warn('font missing ' + f.family); } }
  if (images) await Promise.all(SC.map(async s => { if (s.imageSrc) IMG[s.i] = await loadImg(s.imageSrc); }));
  for (const s of SC) if (s.type === 'custom') {
    if (!s.code) throw new Error(`scene ${s.id}: type "custom" needs "code": "custom/<file>.js"`);
    CUSTOM[s.i] = await import('./' + s.code);
  }
  const cv = document.getElementById('c'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  window.DUR = DUR;
  window.render = t => { TX = []; g.reset ? g.reset() : g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); draw(g, clamp(t, 0, DUR - 1e-3)); };
  window.TEXTS = t => { window.render(t); return TX.map(x => ({ ...x })); };
  window.SCENES = SC.map(s => ({ id: s.id, type: s.type, t0: s.t0, t1: s.t1 }));
  window.render(0); window.READY = true;
}

// ---------------------------------------------------------------- standard scene bodies, themed per kit
// th: { title:{family,weight,italic,upper,ls,color,size}, body:{...}, label:{...}, accent, ink, num:{...}, arabic:{family,color},
//       align:'center'|'left', rise: px, rule(g,x,y,w,a) optional ornament, bullet(g,k,x,y,size,a) optional }
// Each element fades/rises in on its own beat; every text is fitted into its share of the box.
export function stdBody(g, t, s, b, th) {
  if (s.type === 'custom') return custom(g, t, s, b, th);
  const lt = t - s.t0, al = th.align || 'center', R = th.rise ?? 40;
  const rv = d => () => { const u = eo(seg(lt, d, d + .45)); return { a: u, dy: (1 - u) * R }; };
  const T = (o, extra) => ({ ...o, ...extra });
  const type = s.type, rule = (y, d) => th.rule && th.rule(g, b.x, y, b.w, eo(seg(lt, d, d + .5)));
  if (type === 'title' || type === 'tribute') {
    let y = b.y; const main = s.title || s.name || '';
    if (s.arabic) { block(g, 'ar', s.arabic, { x: b.x, y, w: b.w, h: b.h * .22 }, T(th.arabic, { size: 90, min: 40, lh: 1.5, align: al === 'center' ? 'center' : 'right', valign: 'middle', reveal: rv(.1) })); y += b.h * .25; }
    const sub = s.subtitle || s.note, gap = Math.min(60, b.h * .1);
    const r = block(g, 'title', main, { x: b.x, y, w: b.w, h: (b.y + b.h - y) * (sub ? .62 : .8) }, T(th.title, { align: al, valign: 'bottom', reveal: rv(.25) }));
    rule(r.y1 + gap * .45, .6);
    if (sub) block(g, 'sub', sub, { x: b.x, y: r.y1 + gap, w: b.w, h: b.y + b.h - r.y1 - gap }, T(th.body, { size: (th.body.size || 52), align: al, reveal: rv(.7) }));
  } else if (type === 'counter') {
    const it = s.items || [], n = Math.max(1, it.length), hd = s.headline ? b.h * .18 : 0, rowH = (b.h - hd) / n;
    if (s.headline) block(g, 'hd', s.headline, { x: b.x, y: b.y, w: b.w, h: hd - 20 }, T(th.label, { align: al, valign: 'bottom', reveal: rv(.1) }));
    it.forEach((x, k) => {
      const d = .25 + k * .5, u = seg(lt, d, d + 1), y = b.y + hd + k * rowH, col = x.color || (k % 2 ? th.accent : (th.num.color || th.accent));
      block(g, 'num' + k, `${x.prefix || ''}${countUp(x.value, u)}${x.suffix || ''}`, { x: b.x, y, w: b.w, h: rowH * .66 }, T(th.num, { color: col, align: al, valign: 'bottom', reveal: rv(d) }));
      if (x.label) block(g, 'lab' + k, x.label, { x: b.x, y: y + rowH * .69, w: b.w, h: rowH * .26 }, T(th.label, { align: al, reveal: rv(d + .3) }));
      if (it.length === 2 && s.versus && k === 0) text(g, 'vs', 'vs', b.x + b.w / 2, y + rowH * .99, { ...th.label, size: 34, align: 'center', color: th.accent });
    });
  } else if (type === 'quote') {
    const r = block(g, 'quote', `“${s.text}”`, { x: b.x, y: b.y, w: b.w, h: b.h * .78 }, T(th.quote || th.title, { align: al, valign: 'middle', reveal: rv(.2) }));
    rule(r.y1 + 30, .8);
    if (s.source) block(g, 'src', '— ' + s.source, { x: b.x, y: r.y1 + 56, w: b.w, h: Math.min(120, b.y + b.h - r.y1 - 56) }, T(th.label, { align: al, reveal: rv(1) }));
  } else if (type === 'ayat') {
    const r = block(g, 'ar', s.arabic, { x: b.x, y: b.y, w: b.w, h: b.h * .42 }, T(th.arabic, { size: 96, min: 44, lh: 1.65, align: 'center', valign: 'middle', reveal: rv(.15) }));
    rule(r.y1 + 24, .7);
    const r2 = block(g, 'tr', `“${s.translation}”`, { x: b.x, y: r.y1 + 60, w: b.w, h: b.h * .34 }, T(th.quote || th.body, { size: 60, align: 'center', valign: 'top', reveal: rv(.9) }));
    if (s.ref) block(g, 'ref', s.ref, { x: b.x, y: r2.y1 + 26, w: b.w, h: Math.max(40, Math.min(90, b.y + b.h - r2.y1 - 26)) }, T(th.label, { align: 'center', reveal: rv(1.3) }));
  } else if (type === 'list') {
    const it = s.items || [], hd = b.h * .26, rowH = (b.h - hd) / Math.max(1, it.length);
    const r = block(g, 'hd', s.headline || '', { x: b.x, y: b.y, w: b.w, h: hd - 30 }, T(th.title, { size: (th.title.size || 120) * .7, align: al, valign: 'bottom', reveal: rv(.15) }));
    it.forEach((x, k) => {
      const d = .6 + k * .45, y = b.y + hd + k * rowH, bs = Math.min(84, rowH * .6), a = eo(seg(lt, d, d + .4));
      if (th.bullet) th.bullet(g, k, b.x, y + (rowH - 16 - bs) / 2, bs, a); else { g.globalAlpha = a; g.fillStyle = th.accent; g.beginPath(); g.arc(b.x + bs / 2, y + (rowH - 16) / 2, bs * .32, 0, TAU); g.fill(); g.globalAlpha = 1; }
      block(g, 'it' + k, x, { x: b.x + bs + 28, y, w: b.w - bs - 28, h: rowH - 16 }, T(th.body, { align: 'left', valign: 'middle', reveal: rv(d) }));
    });
  } else {
    const main = s.headline || s.title || s.text || '';
    const hasSub = !!s.sub, gap = Math.min(60, b.h * .1), r = block(g, 'main', main, { x: b.x, y: b.y, w: b.w, h: hasSub ? b.h * .64 : b.h }, T(th.title, { align: al, valign: hasSub ? 'bottom' : 'middle', reveal: rv(.2) }));
    if (hasSub && r) { rule(r.y1 + gap * .45, .6); block(g, 'sub', s.sub, { x: b.x, y: r.y1 + gap, w: b.w, h: b.y + b.h - r.y1 - gap }, T(th.body, { align: al, reveal: rv(.7) })); }
  }
}

// ---------------------------------------------------------------- custom scenes (per-video code, drawn inside the kit's look)
// Storyboard: { "type": "custom", "code": "custom/<name>.js", ...any fields the code reads }. The file lives in output/custom/.
// The module exports `default (g, c)` (called every frame) and optionally `prep(c)` (once, for offscreen textures).
// The kit has already drawn its background, eyebrow and frame; it draws the captions after. c = {
//   t, lt (scene time), p (0..1), d, s (the scene with its fields), box (the content area the kit gives: draw text inside it),
//   full {x,y,w,h} (whole frame, for decor), W, H, SAFE, CAP, img (FLUX image or null), theme (the kit's fonts/colours: title, body,
//   label, num, quote, accent…), look (the kit's figure look), K (all kit.js helpers: block, text, reg, fit, cover, eo, seg, lerp,
//   mulberry, vnoise, mix…; K.WORDS = spoken words [{text, t0, t1}] in seconds, to sync a scene to the voice-over), FIG (clash.js: drawFigure, clashModel, drawFx, hexA) }
// Every text MUST go through K.block / K.text (so the 9:16 layout check sees it); register big pictures with K.reg.
export const CUSTOM = {};
export const KIT = { look: null };
const PREPPED = new Set();
export function custom(g, t, s, box, th = {}) {
  const m = CUSTOM[s.i]; if (!m) throw new Error(`custom scene ${s.id}: module not loaded`);
  const look = KIT.look || { fill: f => f.color || (f.side > 0 ? (th.accent || '#333') : '#555'), stroke: null, glow: '#ffd77a' };
  const c = { t, lt: t - s.t0, p: clamp((t - s.t0) / s.d), d: s.d, s, box, full: { x: 0, y: 0, w: W, h: H }, W, H, SAFE, CAP,
    img: IMG[s.i] || null, theme: th, look, K: API, FIG };
  if (m.prep && !PREPPED.has(s.i)) { PREPPED.add(s.i); m.prep(c); }
  g.save(); m.default(g, c); g.restore();
}
export const API = { W, H, SAFE, CAP, TAU, clamp, lerp, seg, ss, eo, ei, eio, back, mulberry, hash, vnoise, mk, mix, cover, graded, duotone,
  font, fit, block, text, reg, textWidth, countUp, parseNum, stdBody, WORDS };

// bottom-left subtitles with no box (stick-explainer, flat-space, urban-sketch, colored-pencil style): an optional accent bar at the
// margin, an optional halo (shadow in the page colour) so they read over the drawing; words appear as they are spoken
export function capLeft(g, t, o) {
  const c = capAt(t); if (!c) return;
  const full = c.words.join(' '), shown = c.words.slice(0, c.active + 1).join(' '), x = o.x ?? SAFE.x0 + (o.bar ? 22 : 0), w = o.w ?? 800;
  const f = fit(g, full, w, o.h ?? 160, { ...o, size: o.size || 60, min: o.min || 34, maxLines: 2 });
  const u = eo(clamp((t - c.t0) / (o.rise ?? .16)));
  if (o.bar) { g.fillStyle = o.bar; g.fillRect(SAFE.x0, (o.y ?? 1350) + 4, o.barW ?? 5, f.h - 4); }
  g.save(); if (o.halo) { g.shadowColor = o.halo; g.shadowBlur = o.haloBlur ?? 10; }
  block(g, 'caption', shown, { x, y: (o.y ?? 1350) + (1 - u) * 14, w, h: o.h ?? 160 }, { ...o, size: f.size, min: f.size, cap: true, layer: 9, alpha: u });
  if (o.halo) { g.shadowBlur = 0; block(g, 'caption', shown, { x, y: (o.y ?? 1350) + (1 - u) * 14, w, h: o.h ?? 160 }, { ...o, size: f.size, min: f.size, cap: true, layer: 9 }); TX.pop(); }
  g.restore();
}
