// Colored-Pencil Science Illustration — portrait driver, 2D. Concept from the Lemo-Opuscar style (the demo renders a 3D world through
// a pencil shader; here the same plate is drawn in 2D): the whole frame is ONE pencil drawing on toothed paper; the cutaway is the
// composition (landscape above the ground line, the cut face of the soil below, where hidden things live); four pencil layers per
// surface (L0 side-of-lead fill limited by the tooth, L1 local-colour hatch patches re-angled, L2 cool cross-hatch in shadow,
// L3 sepia accents); a graphite contour that "boils" (3 drawings cycled on twos); drawing is an event (a ragged front colours a
// horizon left→right the first time the camera sees it); the camera sinks (vertical crane) with multiplane parallax; the magnifier
// (a pencilled circle) is the transition; one cream label tag per shot; titles pencilled on the sky; subtitles on a cream slip.
import { W, H, SAFE, TAU, clamp, lerp, seg, eo, ss, at, SC, IMG, block, text, capAt, stdBody, boot, reg, fit, font, cover, KIT, countUp, mulberry, vnoise } from './kit.js';
import { clashModel, drawFigure, drawFx, clashText } from './clash.js';
import { actionModel, drawActors, actionText } from './action.js';

const C = { paper: '#F8F4EA', grass: '#8DAA45', grassD: '#5E8A3A', sky: '#B3D4E6', litter: '#4D3018', top: '#66402A', sub: '#BD763B', weath: '#B38C5C', rock: '#7d8a99',
  struct: '#DCB990', white: '#FCFAF0', sepia: '#33241C', amber: '#d9a441', cobalt: '#3f6fb5', red: '#c8553d' };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const WH = 3000, GROUND = 1250;   // world height; the ground line
let TOOTH, WC, WL, FAR, CONTOURS = [], HATCH = {};
// ---------------------------------------------------------------- pencil primitives
function tooth() {   // paper tooth: where pencil lands (alpha), fixed to the paper
  const c = mk(512, 512), x = c.getContext('2d'), d = x.createImageData(512, 512), r = mulberry(11);
  for (let i = 0; i < 512 * 512; i++) { const v = r(), y = (i / 512) | 0, col = i % 512, laid = .5 + .5 * Math.sin(y * .9 + vnoise(col * .05, 3) * 3); d.data[i * 4 + 3] = (v * .7 + laid * .3) > .42 ? 255 : 60; }
  x.putImageData(d, 0, 0); return c;
}
function strokes(x, col, ang, gap, len, alpha, w, seed, box) {   // patches of short parallel strokes, each patch re-angled
  const r = mulberry(seed), [bx, by, bw, bh] = box, P = 70;
  x.strokeStyle = col; x.lineCap = 'round';
  for (let py = by - P; py < by + bh + P; py += P) for (let px = bx - P; px < bx + bw + P; px += P) {
    const a = ang + (r() - .5) * .35, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = -P / 2; k < P / 2; k += gap * (.8 + r() * .5)) {
      const cx = px + P / 2 - sa * k + (r() - .5) * 6, cy = py + P / 2 + ca * k + (r() - .5) * 6, l = len * (.6 + r() * .5);
      x.globalAlpha = alpha * (.55 + r() * .45); x.lineWidth = w * (.7 + r() * .6); x.beginPath(); x.moveTo(cx - ca * l / 2, cy - sa * l / 2); x.lineTo(cx + ca * l / 2, cy + sa * l / 2); x.stroke(); }
  }
  x.globalAlpha = 1;
}
// draw one surface with the four layers; path = Path2D in world coords; shade = fraction of the shape (from the bottom) in shadow
function pencilSurface(x, path, box, col, o = {}) {
  const [bx, by, bw, bh] = box, t = mk(bw + 40, bh + 40), y = t.getContext('2d'); y.translate(-bx + 20, -by + 20); y.save(); y.clip(path);
  y.globalAlpha = .55; y.fillStyle = col; y.fillRect(bx - 20, by - 20, bw + 40, bh + 40); y.globalAlpha = 1;                                // L0
  strokes(y, col, o.ang ?? -.8, 5, 34, .85, 2.2, o.seed || 1, box);                                                                     // L1
  const dark = shadeOf(col, .72), cool = mixCool(dark);
  y.save(); y.beginPath(); y.rect(bx, by + bh * (1 - (o.shade ?? .45)), bw, bh); y.clip(); strokes(y, cool, (o.ang ?? -.8) + 1.1, 6, 30, .6, 1.8, (o.seed || 1) + 7, box); y.restore();   // L2
  strokes(y, C.sepia, (o.ang ?? -.8) - .9, 14, 22, o.acc ?? .18, 1.6, (o.seed || 1) + 13, box);                                        // L3
  y.restore();
  y.globalCompositeOperation = 'destination-in'; y.setTransform(1, 0, 0, 1, 0, 0); y.fillStyle = y.createPattern(TOOTH, 'repeat'); y.fillRect(0, 0, t.width, t.height);   // tooth-limited
  x.drawImage(t, bx - 20, by - 20);
}
const shadeOf = (h, k) => { const n = parseInt(h.slice(1), 16); return `rgb(${(n >> 16 & 255) * k | 0},${(n >> 8 & 255) * k | 0},${(n & 255) * k | 0})`; };
const mixCool = c => c.replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, r, g, b) => `rgb(${r * .85 | 0},${g * .9 | 0},${Math.min(255, b * 1.1 + 18) | 0})`);
function hatchPattern(col) { if (HATCH[col]) return HATCH[col]; const c = mk(64, 64), x = c.getContext('2d'); x.fillStyle = col; x.globalAlpha = .3; x.fillRect(0, 0, 64, 64); x.globalAlpha = 1; strokes(x, col, -.8, 5, 30, .9, 1.8, col.length, [0, 0, 64, 64]); return HATCH[col] = x.createPattern(c, 'repeat'); }
function contourAll(x, paths, seed) {   // graphite contour with wobble (one of three drawings)
  const r = mulberry(seed); x.strokeStyle = C.sepia; x.lineJoin = 'round';
  for (const p of paths) { x.save(); x.translate((r() - .5) * 1.4, (r() - .5) * 1.4); x.globalAlpha = p.a ?? .85; x.lineWidth = p.w ?? 2.2; x.stroke(p.path); x.restore(); }
}
// ---------------------------------------------------------------- the cutaway world (built once)
function blobPath(cx, cy, rx, ry, seed, n = 24) { const p = new Path2D(); for (let i = 0; i <= n; i++) { const th = i / n * TAU, k = 1 + (vnoise(i * .8, seed) - .5) * .32, x = cx + Math.cos(th) * rx * k, y = cy + Math.sin(th) * ry * k; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); return p; }
function band(y0, y1, seed, amp = 14) { const p = new Path2D(), top = x => y0 + Math.sin(x * .008 + seed) * amp + Math.sin(x * .021 + seed * 2) * amp * .4; p.moveTo(-20, top(-20)); for (let x = -20; x <= W + 20; x += 20) p.lineTo(x, top(x)); p.lineTo(W + 20, y1); p.lineTo(-20, y1); p.closePath(); return { p, top }; }
function build() {
  TOOTH = tooth(); WC = mk(W, WH); WL = mk(W, WH); const g = WC.getContext('2d'), lines = [], r = mulberry(5);
  g.fillStyle = C.paper; g.fillRect(0, 0, W, WH);
  // sky: a loose blue wash, clouds left as paper
  const skyP = new Path2D(); skyP.rect(0, 0, W, GROUND); pencilSurface(g, skyP, [0, 0, W, GROUND], C.sky, { ang: -.35, shade: 0, acc: 0, seed: 2 });
  g.fillStyle = C.paper; for (const [cx, cy, s] of [[230, 380, 1], [800, 560, .8], [520, 220, .6]]) { g.fill(blobPath(cx, cy, 150 * s, 50 * s, cx)); }
  // soil horizons
  const H_ = [[GROUND, 1330, C.litter, 1, -.6], [1325, 1650, C.top, 2, -.8], [1645, 2100, C.sub, 3, -.9], [2095, 2500, C.weath, 4, -.7], [2495, WH, C.rock, 5, -1]];
  for (const [y0, y1, col, s, a] of H_) { const b = band(y0, y1, s, s === 1 ? 6 : 14); pencilSurface(g, b.p, [0, y0 - 30, W, y1 - y0 + 30], col, { ang: a, seed: s * 9, shade: .5 }); lines.push({ path: b.p, w: 2 }); }
  // stones (round), a buried structure (a light pipe), roots grown from the trees down
  for (let i = 0; i < 26; i++) { const y = 1700 + r() * 1250, x = r() * W, rr = 20 + r() * 50, p = blobPath(x, y, rr, rr * (.6 + r() * .3), 50 + i); g.fillStyle = C.paper; g.fill(p); pencilSurface(g, p, [x - rr * 1.4, y - rr * 1.4, rr * 2.8, rr * 2.8], y > 2500 ? '#9aa6b2' : '#a8988a', { ang: r() * 3, seed: 60 + i }); lines.push({ path: p, w: 1.8 }); }
  const pipe = new Path2D(); pipe.rect(-20, 1880, W + 40, 64); pencilSurface(g, pipe, [-20, 1880, W + 40, 64], C.struct, { ang: 0, seed: 77, shade: .4 }); lines.push({ path: pipe, w: 2.4 });
  g.strokeStyle = C.white; g.lineWidth = 2; g.globalAlpha = .7; for (let i = 0; i < 40; i++) { let x = r() * W, y = 1400 + r() * 1000; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - .5) * 60; y += 10 + r() * 30; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1;   // white over dark: fine lines
  // landscape: grass line and trees standing on the ground
  const grassP = band(GROUND - 26, GROUND + 6, 9, 8); pencilSurface(g, grassP.p, [0, GROUND - 60, W, 70], C.grass, { ang: -1.5, seed: 31 });
  for (let i = 0; i < 4; i++) { const tx = 120 + i * 290 + r() * 50, th = 300 + r() * 200, trunk = new Path2D(); trunk.rect(tx - 14, GROUND - th * .55, 28, th * .55 + 6);
    pencilSurface(g, trunk, [tx - 20, GROUND - th * .6, 40, th * .6], '#8a6440', { ang: -1.57, seed: 90 + i }); lines.push({ path: trunk });
    for (let k = 0; k < 3; k++) { const cp = blobPath(tx + (k - 1) * 70, GROUND - th * .62 - (k % 2) * 60, 110, 90, 100 + i * 5 + k); pencilSurface(g, cp, [tx - 220, GROUND - th - 120, 440, th], k % 2 ? C.grassD : C.grass, { ang: -.5 + k, seed: 120 + i * 3 + k }); lines.push({ path: cp, w: 2 }); }
    g.strokeStyle = '#7a5838'; g.lineCap = 'round'; for (let k = 0; k < 7; k++) { let x = tx, y = GROUND + 4, w = 7; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 9; s++) { x += (r() - .5) * 70 + (k - 3) * 6; y += 30 + r() * 40; g.lineWidth = w; g.lineTo(x, y); w *= .82; } g.stroke(); } }
  // line-only state (blank paper + contours) for areas not yet drawn in
  const l = WL.getContext('2d'); l.fillStyle = C.paper; l.fillRect(0, 0, W, WH); l.globalAlpha = .45; contourAll(l, lines, 1); l.globalAlpha = 1;
  for (let k = 0; k < 3; k++) { const c = mk(W, WH); contourAll(c.getContext('2d'), lines, 10 + k); CONTOURS.push(c); }
  // far landscape (moves slower: multiplane parallax)
  FAR = mk(W, 900); const f = FAR.getContext('2d'); for (let i = 0; i < 3; i++) { const p = band(560 + i * 90, 900, 40 + i, 60 - i * 15); pencilSurface(f, p.p, [0, 400, W, 500], ['#a9c4a0', '#8fb07f', '#7a9a68'][i], { ang: -.6, seed: 140 + i, acc: .08, shade: .3 }); }
}
// ---------------------------------------------------------------- camera and reveal
const camTop = s => { const T = s.type; if (T === 'title' || T === 'headline' || T === 'tribute' || T === 'action' || s.i === 0) return 0; if (T === 'clash' || T === 'image') return 280; return [520, 820, 1080, 760][s.i % 4]; };   // sink by scene
function camAt(t) { const { s } = at(t), lt = t - s.t0, prev = SC[s.i - 1]; const y1 = camTop(s), y0 = prev ? camTop(prev) : y1; return lerp(y0, y1, ss(seg(lt, 0, 1.4))); }
const seenTo = i => Math.max(0, ...SC.slice(0, i).map(s => camTop(s) + H));   // how deep earlier scenes have already drawn the world
function draw(g, t) {
  const { s } = at(t), lt = t - s.t0, cy = camAt(t), img = IMG[s.i];
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
  // the world: drawn-in areas from earlier scenes, a ragged colouring front for new depth
  g.save(); g.translate(0, -cy);
  g.drawImage(FAR, 0, (GROUND - 900) + cy * .35, W, 900);   // far hills peek above the ground line, slower
  const done = seenTo(s.i), front = lerp(-80, W + 80, eo(seg(lt, .1, 1.6)));
  g.drawImage(WL, 0, 0);
  g.save(); const p = new Path2D(); p.rect(0, 0, W, done); p.moveTo(-50, done); for (let y = done; y < cy + H + 40; y += 30) p.lineTo(front + Math.sin(y * .05) * 40 + (vnoise(y * .02, 7) - .5) * 90, y); p.lineTo(-50, cy + H + 40); p.closePath(); g.clip(p);
  g.drawImage(WC, 0, 0); g.restore();
  g.drawImage(CONTOURS[Math.floor(t * 12) % 3], 0, 0);   // only the contour boils (3 drawings, on twos)
  if (s.type === 'action') { const m = actionModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: GROUND - 90, top: 760, S: 150 }); for (const L of m.T.layers) { g.fillStyle = hatchPattern({ ground: C.grass, water: C.cobalt, dark: C.sepia, structure: C.struct }[L.kind]); g.fill(L.path); g.strokeStyle = C.sepia; g.lineWidth = 2.4; g.stroke(L.path); } drawActors(g, t, m, KIT.look); window.__AM = m; }
  if (s.type === 'clash') { const m = clashModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: GROUND - 10, S: 200 }); for (const f of m.figs) drawFigure(g, f, t, KIT.look); drawFx(g, m.fx, { dust: '#cfb894', arrow: C.sepia, spark: C.amber }); }
  g.restore();
  content(g, t, s, lt, img, cy);
  // the magnifier transition: a pencilled circle grows from a detail and fills the frame with blank paper, then opens on the next scene
  const nx = SC[s.i + 1]; const u = nx && t > nx.t0 - .5 ? seg(t, nx.t0 - .5, nx.t0) : 0, v = s.i > 0 && lt < .4 ? 1 - seg(lt, 0, .4) : 0, k = Math.max(u, v);
  if (k > 0) { const R = 1150 * eo(k); g.save(); g.beginPath(); g.arc(W / 2, 980, R, 0, TAU); g.fillStyle = C.paper; g.globalAlpha = Math.min(1, k * 1.2); g.fill(); g.globalAlpha = 1; g.strokeStyle = C.sepia; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, 980, R, 0, TAU * Math.min(1, k * 2)); g.stroke(); g.restore(); }
  subs(g, t);
}
// ---------------------------------------------------------------- text: pencil on the sky, cream tags, hatched numerals
function tag(g, x, y, w, h, u) { if (u <= 0) return; const ww = w * eo(u); g.save(); g.fillStyle = '#fbf3df'; g.beginPath(); g.moveTo(x + 22, y); g.lineTo(x + ww, y); g.lineTo(x + ww, y + h); g.lineTo(x + 22, y + h); g.lineTo(x, y + h / 2); g.closePath(); g.fill();
  g.strokeStyle = C.sepia; g.globalAlpha = .75; g.lineWidth = 2; g.stroke(); g.beginPath(); g.arc(x + 30, y + h / 2, 7, 0, TAU); g.stroke(); g.restore(); }
const TH = {
  align: 'left', rise: 0, accent: C.red,
  title: { family: 'WK', weight: 400, size: 110, min: 44, lh: 1.08, color: C.sepia },
  quote: { family: 'WK', weight: 400, size: 64, min: 34, lh: 1.25, color: C.sepia },
  num: { family: 'WK', weight: 400, size: 190, min: 64, lh: 1, color: C.sepia, paint: (g, ln, x, y) => { g.fillStyle = hatchPattern(C.red); g.fillText(ln, x, y); g.strokeStyle = C.sepia; g.lineWidth = 2; g.strokeText(ln, x, y); } },
  body: { family: 'WK', weight: 400, size: 48, min: 28, lh: 1.25, color: '#5a4b3e' },
  label: { family: 'WK', weight: 400, size: 34, min: 22, ls: .12, upper: true, color: C.sepia },
  side: { family: 'WK', weight: 400, size: 42, min: 26, fixed: true, color: C.sepia },
  arabic: { family: 'Amiri', weight: 700, color: C.sepia },
  rule: (g, x, y, w, a) => { g.strokeStyle = C.sepia; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); for (let k = 0; k <= 20; k++) g.lineTo(x + w * .5 * a * k / 20, y + Math.sin(k * 1.3) * 2); g.stroke(); },
  bullet: (g, k, x, y, s, a) => { const p = blobPath(x + s / 2, y + s / 2, s * .32 * a + 1, s * .28 * a + 1, 70 + k); g.fillStyle = hatchPattern([C.grass, C.red, C.amber, C.cobalt][k % 4]); g.fill(p); g.strokeStyle = C.sepia; g.lineWidth = 2; g.stroke(p); },
};
KIT.look = { fill: f => hatchPattern(f.color || (f.side > 0 ? C.grassD : C.red)), stroke: C.sepia, lw: 2, shield: hatchPattern(C.amber), weapon: C.sepia, glow: '#ffcf5a', glowMode: 'source-over' };
function content(g, t, s, lt, img, cy) {
  const T = s.type, X = SAFE.x0, Wd = SAFE.x1 - SAFE.x0, top = SAFE.y0 + 20;
  const write = (lt0) => ({ a: 1, dx: 0 });   // pencil writing is shown by the wipe below
  const wipeText = (y0, h, t0, dur) => { const u = seg(lt, t0, t0 + dur); g.save(); g.beginPath(); g.rect(0, y0 - 20, W * u, h + 40); g.clip(); return () => g.restore(); };
  if (s.eyebrow) { tag(g, X, top, 380, 56, seg(lt, .2, .6)); block(g, 'eyebrow', s.eyebrow, { x: X + 50, y: top + 8, w: 320, h: 40 }, { ...TH.label, alpha: seg(lt, .4, .6) }); }
  const by = top + 90;
  if (T === 'custom') return stdBody(g, t, s, { x: SAFE.x0, y: by, w: Wd, h: SAFE.y1 - by }, TH);
  if (img) {   // the photo redrawn as a pencil plate: toned, hatched, in a pencilled frame, inside the magnifier circle
    const cx = W / 2, cy2 = 940, r = 270, u = seg(lt, .2, 1.1);
    g.save(); g.beginPath(); g.arc(cx, cy2, r * eo(u), 0, TAU); g.clip(); g.fillStyle = C.paper; g.fillRect(cx - r, cy2 - r, 2 * r, 2 * r);
    g.filter = 'grayscale(.6) sepia(.35) contrast(1.15) brightness(1.05)'; g.globalAlpha = .85; cover(g, img, cx - r, cy2 - r, 2 * r, 2 * r, 1.03 + lt * .008); g.filter = 'none'; g.globalAlpha = 1;
    g.globalCompositeOperation = 'multiply'; g.fillStyle = hatchPattern('#cdbb9c'); g.fillRect(cx - r, cy2 - r, 2 * r, 2 * r); g.restore();
    g.strokeStyle = C.sepia; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy2, r * eo(u), 0, TAU * eo(u)); g.stroke();
    reg('photo', '[photo]', { x0: cx - r - 6, y0: cy2 - r - 6, x1: cx + r + 6, y1: cy2 + r + 6 });
    const s2 = T === 'image' ? { ...s, type: 'headline' } : s; tag(g, X - 10, by - 10, Wd + 20, 540 - by + 140, seg(lt, .1, .5));
    stdBody(g, t, s2, { x: X + 40, y: by + 10, w: Wd - 60, h: cy2 - r - 40 - by - 10 }, { ...TH, title: { ...TH.title, size: 70 } }); return;
  }
  if (T === 'title' || T === 'tribute' || T === 'headline') {   // titles are written in pencil on the sky, with a hand-drawn underline
    const end = wipeText(by, 520, .3, 1.2); stdBody(g, t, s, { x: X, y: by, w: Wd, h: 520 }, TH); end(); return;
  }
  if (T === 'action') { const end = wipeText(by, 330, .3, 1); actionText(g, t, s, { x: X, y: by, w: Wd, h: 280 }, TH, window.__AM); end(); return; }
  if (T === 'clash') { const end = wipeText(by, 330, .3, 1); clashText(g, t, s, { x: X, y: by, w: Wd, h: 230 }, TH, by + 260); end(); return; }
  if (T === 'ayat') { const end = wipeText(by, 760, .2, 1.4); tag(g, X - 10, by - 10, Wd + 20, 780, seg(lt, .1, .5)); stdBody(g, t, s, { x: X + 50, y: by + 20, w: Wd - 80, h: 720 }, TH); end(); return; }
  // other text: a cream paper slip pinned in the frame (one per shot), pencil on it
  const h = { quote: 600, counter: 820, list: 820 }[T] || 560; tag(g, X - 10, by - 10, Wd + 20, h + 20, seg(lt, .1, .5));
  stdBody(g, t, s, { x: X + 50, y: by + 20, w: Wd - 80, h: h - 30 }, TH);
}
function subs(g, t) {   // a cream paper slip, bottom left, wiped on quickly
  const c = capAt(t); if (!c) return; const o = { family: 'WK', weight: 400 }, words = c.words.slice(0, c.active + 1).join(' '), full = c.words.join(' ');
  const f = fit(g, full, 820, 150, { ...o, size: 62, min: 36, maxLines: 2 }); font(g, f.size, o); const w = Math.max(...f.widths) + 70, h = f.h + 40, u = eo(clamp(c.lt / .15));
  g.save(); g.fillStyle = '#fbf3df'; g.globalAlpha = .96; g.fillRect(SAFE.x0, 1350, w * u, h); g.strokeStyle = C.sepia; g.globalAlpha = .6; g.lineWidth = 2; g.strokeRect(SAFE.x0, 1350, w * u, h); g.restore();
  block(g, 'caption', words, { x: SAFE.x0 + 35, y: 1370, w: 820, h: 150 }, { ...o, size: f.size, min: f.size, color: C.sepia, cap: true, layer: 9 });
}
await boot({ fonts: [['WK', 'fonts/lemo/wenkai-400.woff2'], ['Amiri', 'fonts/amiri-arabic-700-normal.woff2', '700']], draw: (g, t) => { if (!WC) build(); draw(g, t); } });
