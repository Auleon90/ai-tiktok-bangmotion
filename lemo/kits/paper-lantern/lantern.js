// Paper-cut Lightbox (paper-lantern) — portrait driver, 2D. Concept from the Lemo-Opuscar style: one physical object, a shallow box
// of 6 parallel cut-paper sheets lit from behind. Back sheets bright and translucent, the front almost black (that value ladder IS the
// depth); a warm light glows through the paper pulp near the light point; windows and the moon are holes that burn and bloom; every
// sheet casts a soft shadow on the sheets behind; a warm rim on each sheet's top edge, a dark band on its bottom edge; shallow DOF.
// Text in the picture is paper: cut strips that grow from an anchor edge, or (for an ayat) letters cut out of a dark sheet so the light
// burns through them; subtitles are a quiet warm serif on the darkest band. The demo renders the stack in three.js; here it is
// composited in 2D (the motif and paper-finish code below is the demo's own Canvas2D code — MIT, Lemomo (LemoLab)).
import { W, H, SAFE, TAU, clamp, lerp, seg, eo, ss, at, SC, IMG, block, text, capAt, stdBody, boot, reg, fit, font, cover, duotone, KIT, countUp } from './kit.js';
import { clashModel, drawFigure, drawFx, clashText } from './clash.js';

// ---------------------------------------------------------------- demo code (paper.js / world.js / lib.js), Canvas2D parts
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function makeGrain(n, seed) {
  const c = cv(n, n), x = c.getContext('2d'), R = mulberry(seed), img = x.createImageData(n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { const v = R(); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v < .5 ? 0 : 255; d[i * 4 + 3] = Math.abs(v - .5) * 30; }
  x.putImageData(img, 0, 0); x.lineCap = 'round';
  for (let i = 0; i < n * 1.4; i++) { const px = R() * n, py = R() * n, a = R() * TAU, l = 5 + R() * 22;
    x.strokeStyle = R() < .5 ? 'rgba(40,30,20,.10)' : 'rgba(255,255,255,.16)'; x.lineWidth = .5 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .5) * l * .5, py + Math.sin(a + .5) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  return c;
}
function makeCloud(n, seed) {   // tileable pulp mottle: the flocculent paper seen when backlit
  const R = mulberry(seed), c = cv(n, n), x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, n, n);
  for (const [cnt, rmin, rmax, a] of [[60, 40, 120, .22], [260, 10, 40, .16], [900, 3, 10, .12]]) for (let i = 0; i < cnt; i++) {
    const px = R() * n, py = R() * n, r = rmin + R() * (rmax - rmin), v = R() < .5 ? 0 : 255;
    for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r); g.addColorStop(0, `rgba(${v},${v},${v},${a})`); g.addColorStop(1, `rgba(${v},${v},${v},0)`); x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2); } }
  x.lineCap = 'round'; for (let i = 0; i < n * 2; i++) { const px = R() * n, py = R() * n, a = R() * TAU, l = 6 + R() * 30; x.strokeStyle = `rgba(255,255,255,${.05 + R() * .12})`; x.lineWidth = .6 + R();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .6) * l * .5, py + Math.sin(a + .6) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  return c;
}
const GRAIN = makeGrain(512, 7), PULP = makeCloud(512, 3);
const PPM = 2000;   // px per metre for the metric motif code
function paint(w, h, draw) { const c = cv(w, h), x = c.getContext('2d'); x.setTransform(PPM, 0, 0, -PPM, c.width / 2, c.height / 2); draw(x, PPM); x.setTransform(1, 0, 0, 1, 0, 0); return c; }
const cutOut = (x, fn) => { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; fn(); x.restore(); };
function finish(c, o = {}) {   // paper texture, lit top edge, dark bottom edge
  const x = c.getContext('2d'), Wc = c.width, Hc = c.height;
  x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = .9; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, Wc, Hc); x.restore();
  const band = (dy, col, blur) => { const t = cv(Wc, Hc), y = t.getContext('2d'); y.drawImage(c, 0, 0); y.globalCompositeOperation = 'destination-out'; y.drawImage(c, 0, dy);
    y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, Wc, Hc); x.save(); x.globalCompositeOperation = 'source-atop'; if (blur) x.filter = `blur(${blur}px)`; x.drawImage(t, 0, 0); x.restore(); };
  band(o.rimPx ?? 4, `rgba(255,236,200,${o.rim ?? .4})`, .6); band(-(o.underPx ?? 4), `rgba(0,0,0,${o.under ?? .3})`, .8);
  return c;
}
function peaks(x, o) {   // snowy peaks with carved contour slits that let the layer behind show through
  const { x0, x1, base, list, seed = 1 } = o, R = mulberry(seed);
  const h = u => { let y = 0; for (const [cx, hh, w] of list) { const d = Math.abs(u - cx) / w; y = Math.max(y, hh * Math.max(0, 1 - Math.pow(d, 1.25))); } return y; };
  x.beginPath(); x.moveTo(x0, base - 1.2); for (let u = x0; u <= x1 + .001; u += .0015) x.lineTo(u, base + h(u) + .0008 * Math.sin(u * 400 + seed)); x.lineTo(x1, base - 1.2); x.closePath(); x.fill();
  cutOut(x, () => { x.lineWidth = o.lw ?? .0012; x.lineCap = 'round';
    for (const [cx, hh, w] of list) { for (const f of [.72, .5]) { if (hh * f < .01) continue; x.beginPath(); let st = false;
        for (let u = cx - w; u <= cx + w; u += .0015) { const d = Math.abs(u - cx) / w, top = hh * Math.max(0, 1 - Math.pow(d, 1.25)), y = base + top * f + .004 * Math.sin(u * 160 + cx * 30);
          if (top * f > .004 && y < base + top - .003) { st ? x.lineTo(u, y) : x.moveTo(u, y); st = true; } else st = false; } x.stroke(); }
      x.beginPath(); x.moveTo(cx, base + hh - .004); x.lineTo(cx + w * .18 * (R() - .3), base + hh * .55); x.stroke(); } });
}
function firs(x, o) {   // a row of conifers on a ridge line
  const { x0, x1, base, h, gap, seed = 3, ground = 1.2 } = o, R = mulberry(seed);
  x.beginPath(); x.moveTo(x0, base - ground); x.lineTo(x0, base); for (let u = x0; u < x1; u += .002) x.lineTo(u, base + (o.roll ?? .004) * Math.sin(u * 23 + seed)); x.lineTo(x1, base); x.lineTo(x1, base - ground); x.closePath(); x.fill();
  for (let u = x0 + R() * gap; u < x1; u += gap * (.6 + R() * .8)) { const hh = h * (.6 + R() * .6), w = hh * .32, by = base + (o.roll ?? .004) * Math.sin(u * 23 + seed) - .001;
    x.beginPath(); x.moveTo(u, by + hh);
    for (let k = 0; k < 4; k++) { const t1 = (k + 1) / 4; x.lineTo(u + w * (.35 + .65 * t1), by + hh * (1 - t1)); x.lineTo(u + w * .3 * (1 - t1) + w * .12, by + hh * (1 - t1) + hh * .04); }
    x.lineTo(u + .0012, by - .002); x.lineTo(u - .0012, by - .002);
    for (let k = 3; k >= 0; k--) { const t1 = (k + 1) / 4; x.lineTo(u - w * .3 * (1 - t1) - w * .12, by + hh * (1 - t1) + hh * .04); x.lineTo(u - w * (.35 + .65 * t1), by + hh * (1 - t1)); }
    x.closePath(); x.fill(); }
}

// ---------------------------------------------------------------- stacks (value ladders: back light/translucent → front dark/opaque)
const LADDERS = {
  night: { sky: ['#0a1330', '#24356e'], L: ['#6a86c2', '#4f6aa6', '#3f5a92', '#26386a', '#0e1532'], light: '#ffb862', accent: '#c8321f', moon: true },
  desert: { sky: ['#f0c890', '#f6dcb0'], L: ['#d89a68', '#c07850', '#8a4a30', '#5a2818', '#1e0e08'], light: '#ffd080', accent: '#2a8a8a' },
  winter: { sky: ['#dfe6ee', '#f2f5f8'], L: ['#c2cfdc', '#9aaec4', '#6f86a0', '#4a6078', '#101820'], light: '#ffcf90', accent: '#c8321f' },
  dusk: { sky: ['#d9b8d8', '#f0d4c8'], L: ['#b48cc0', '#8a68a6', '#664a86', '#3e2a5c', '#140c24'], light: '#ffc890', accent: '#e0a030' },
  green: { sky: ['#cfe3c8', '#eef4e2'], L: ['#a3c79a', '#78a874', '#4f8058', '#2f5a3c', '#0c1a10'], light: '#ffe0a0', accent: '#c8321f' },
};
const ORDER = ['night', 'dusk', 'winter', 'desert', 'green'];
const ladderOf = s => LADDERS[s.ladder] ? s.ladder : s.type === 'ayat' ? 'night' : ORDER[s.i % ORDER.length];
const LW = W + 240, TRANS = [.9, .65, .4, .2, .05];   // layer width (room for parallax), translucency per layer back→front
let STACK = {};
function stack(name) {   // build the 5 sheets + their glow (windows) + shadows once per ladder
  if (STACK[name]) return STACK[name]; const Ld = LADDERS[name], R = mulberry(name.length * 17), out = [];
  const m = v => v / PPM, X0 = -LW / 2 / PPM, X1 = LW / 2 / PPM, yb = py => (H / 2 - py) / PPM;   // pixel y → metric (y up, origin centre)
  const defs = [
    x => peaks(x, { x0: X0, x1: X1, base: yb(1050), seed: 1, list: [[-.18, .19, .17], [.05, .25, .2], [.25, .16, .14]] }),
    x => peaks(x, { x0: X0, x1: X1, base: yb(1150), seed: 2, list: [[-.27, .12, .16], [-.02, .15, .15], [.2, .2, .18]] }),
    x => { firs(x, { x0: X0, x1: X1, base: yb(1225), h: .07, gap: .03, seed: 3 }); },
    x => { firs(x, { x0: X0, x1: X1, base: yb(1305), h: .09, gap: .045, seed: 4, roll: .01 }); },
    x => { x.beginPath(); x.moveTo(X0, yb(H + 50)); x.lineTo(X0, yb(1395)); for (let u = X0; u <= X1; u += .004) x.lineTo(u, yb(1395) + .012 * Math.sin(u * 9) + .006 * Math.sin(u * 31)); x.lineTo(X1, yb(H + 50)); x.closePath(); x.fill(); },
  ];
  defs.forEach((fn, k) => {
    const c = paint(LW, H, x => { x.fillStyle = Ld.L[k]; fn(x); });
    const glow = cv(LW, H), gx = glow.getContext('2d');
    if (k === 2) {   // a hamlet on the mid ridge: houses with window holes that burn
      const cx = c.getContext('2d');
      for (let i = 0; i < 6; i++) { const hx = 120 + i * 190 + R() * 60, hy = 1218, hw = 54 + R() * 30, hh = 44 + R() * 20;
        cx.fillStyle = Ld.L[k]; cx.fillRect(hx - hw / 2, hy - hh, hw, hh + 10); cx.beginPath(); cx.moveTo(hx - hw / 2 - 8, hy - hh); cx.lineTo(hx, hy - hh - 30); cx.lineTo(hx + hw / 2 + 8, hy - hh); cx.fill();
        const wx = hx - 8, wy = hy - hh + 12; cx.clearRect(wx, wy, 16, 18); gx.fillStyle = Ld.light; gx.fillRect(wx - 2, wy - 2, 20, 22); gx.fillStyle = '#fff4d8'; gx.fillRect(wx + 3, wy + 3, 10, 12); }
    }
    finish(c, { rim: k < 3 ? .45 : .3, under: .32 });
    // backlight through the pulp: warm, strongest near the light point, scaled by this sheet's translucency
    const lit = cv(LW, H), lx = lit.getContext('2d'); lx.drawImage(c, 0, 0);
    lx.globalCompositeOperation = 'source-atop'; lx.globalAlpha = TRANS[k] * .25; lx.fillStyle = lx.createPattern(PULP, 'repeat'); lx.globalCompositeOperation = 'overlay'; lx.fillRect(0, 0, LW, H);
    lx.globalCompositeOperation = 'source-atop'; lx.globalAlpha = TRANS[k];
    const gr = lx.createRadialGradient(LW / 2 + 160, 900, 50, LW / 2 + 160, 900, 1100); gr.addColorStop(0, hexA(Ld.light, .55)); gr.addColorStop(1, hexA(Ld.light, 0)); lx.fillStyle = gr; lx.fillRect(0, 0, LW, H);
    const shadow = cv(LW / 2, H / 2), sx = shadow.getContext('2d'); sx.filter = 'blur(10px)'; sx.drawImage(c, 0, 0, LW / 2, H / 2); sx.filter = 'none'; sx.globalCompositeOperation = 'source-in'; sx.fillStyle = 'rgba(0,0,0,.45)'; sx.fillRect(0, 0, LW / 2, H / 2);
    const bl = k === 4 ? (() => { const b = cv(LW, H), bx = b.getContext('2d'); bx.filter = 'blur(3px)'; bx.drawImage(lit, 0, 0); return b; })() : lit;   // the front sheet sits nearer than the focus plane
    out.push({ lit: bl, glow, shadow, k });
  });
  const sky = cv(W + 120, H), x = sky.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, Ld.sky[0]); g.addColorStop(1, Ld.sky[1]); x.fillStyle = g; x.fillRect(0, 0, W + 120, H);
  x.globalAlpha = .1; x.globalCompositeOperation = 'overlay'; x.fillStyle = x.createPattern(PULP, 'repeat'); x.fillRect(0, 0, W + 120, H); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  if (Ld.moon) { const r = mulberry(9); x.fillStyle = 'rgba(255,240,200,.85)'; for (let i = 0; i < 90; i++) { x.beginPath(); x.arc(r() * (W + 120), r() * 1000, .8 + r() * 1.8, 0, TAU); x.fill(); } }
  return STACK[name] = { layers: out, sky, Ld };
}
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

// ---------------------------------------------------------------- paper text: strips that grow from an anchor edge
function strip(g, x, y, w, h, u, fill = '#efe0bf') {
  if (u <= 0) return; const ww = w * eo(u);
  g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 8; g.fillStyle = fill; g.fillRect(x, y, ww, h); g.restore();
  g.save(); g.beginPath(); g.rect(x, y, ww, h); g.clip(); g.globalAlpha = .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x, y, ww, h); g.restore();
  g.fillStyle = 'rgba(255,236,200,.5)'; g.fillRect(x, y, ww, 3); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + h - 4, ww, 4);
  return { x, y, w, h, clip: (fn) => { g.save(); g.beginPath(); g.rect(x, y, ww, h); g.clip(); fn(); g.restore(); } };
}
const GATE = {}; let FRONT = null;
function gateSheet(Ld, cx, cy, r, seed) {   // a full-width cut sheet: a soft ridge on top, a round hole, paper finish, a lit cut edge
  const c = cv(W, H), x = c.getContext('2d'), R = mulberry(seed + 5), top = cy - r - 70;
  x.fillStyle = Ld.L[2]; x.beginPath(); x.moveTo(0, H); x.lineTo(0, top + 60);
  for (let px = 0; px <= W; px += 12) { const d = Math.min(1, Math.abs(px - cx) / (r + 280)); x.lineTo(px, top + (1 - Math.cos(d * Math.PI)) * .5 * (2 * r + 60) + 10 * Math.sin(px * .03 + seed)); }   // a mound rising to the hole
  x.lineTo(W, H); x.closePath(); x.fill();
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over';
  finish(c, { rim: .5, under: .3 });
  x.save(); x.strokeStyle = Ld.light; x.lineWidth = 5; x.shadowColor = Ld.light; x.shadowBlur = 26; x.globalAlpha = .9; x.beginPath(); x.arc(cx, cy, r + 1, 0, TAU); x.stroke(); x.restore();
  return c;
}
function seal(g, x, y, s, col) { g.fillStyle = col; g.fillRect(x, y, s, s); g.strokeStyle = 'rgba(255,230,210,.8)'; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, s - 12, s - 12); }
const TH = {
  align: 'center', rise: 0, accent: '#c8321f',
  title: { family: 'Corm', weight: 500, size: 100, min: 44, lh: 1.04, color: '#2a1a10' },
  quote: { family: 'Corm', weight: 500, italic: true, size: 68, min: 34, lh: 1.16, color: '#2a1a10' },
  num: { family: 'Corm', weight: 500, size: 170, min: 60, lh: 1, color: '#8a2a1a' },
  body: { family: 'Corm', weight: 500, italic: true, size: 50, min: 28, lh: 1.2, color: '#3a2a1c' },
  label: { family: 'Corm', weight: 500, size: 34, min: 22, ls: .2, upper: true, color: '#7a4a24' },
  side: { family: 'Corm', weight: 500, italic: true, size: 44, min: 26, fixed: true, color: '#2a1a10' },
  arabic: { family: 'Amiri', weight: 700, color: '#2a1a10' },
};
KIT.look = { fill: '#0a0a14', stroke: 'rgba(255,190,104,.85)', lw: 2.4, shield: '#121a3e', weapon: '#0a0a14', glow: '#ffcd82', glowMode: 'lighter' };

// ---------------------------------------------------------------- frame
function draw(g, t) {
  const { s } = at(t), lt = t - s.t0, name = ladderOf(s), { layers, sky, Ld } = stack(name), img = IMG[s.i];
  // camera: a slow dolly in, nearly frontal, with hand-held micro-drift; travel on alternate scenes (parallax by depth)
  const dz = 1 + .05 * ss(seg(lt, 0, s.d)), drift = Math.sin(t * .9) * 2, travel = (s.i % 2 ? 1 : -1) * (lt / s.d - .5) * 60;
  const flick = 1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t), on = ss(seg(lt, .1, .8));   // the light comes on at each scene, then flickers
  g.save(); g.translate(W / 2, 960); g.scale(dz, dz); g.translate(-W / 2, -960);
  g.drawImage(sky, -60 + travel * .1, 0);
  // the moon / light source burning through the sky sheet
  const mx = 760, my = 520; const halo = g.createRadialGradient(mx, my, 40, mx, my, 520); halo.addColorStop(0, hexA(Ld.light, .55 * on * flick)); halo.addColorStop(1, hexA(Ld.light, 0)); g.fillStyle = halo; g.fillRect(0, 0, W, H);
  if (Ld.moon) { g.save(); g.shadowColor = Ld.light; g.shadowBlur = 60 * on; g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(mx, my, 92, 0, TAU); g.fill(); g.fillStyle = Ld.sky[0]; g.beginPath(); g.arc(mx + 38, my - 18, 82, 0, TAU); g.fill(); g.restore(); }   // a crescent cut
  // sheets back → front: each casts a soft shadow onto what is behind it, then is drawn lit; windows burn on its glow pass
  layers.forEach(L => {
    const par = (L.k + 1) / layers.length, ox = -120 + travel * par + drift * par, oy = 0; if (L.k === 4) FRONT = { c: L.lit, ox, dz };
    g.drawImage(L.shadow, ox + 10, oy + 26, LW, H);
    g.drawImage(L.lit, ox, oy);
    if (L.k === 2) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = on * flick; g.shadowColor = Ld.light; g.shadowBlur = 24; g.filter = 'none';
      const tint = cv(1, 1); g.drawImage(L.glow, ox, oy); g.globalCompositeOperation = 'source-over'; g.restore();
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = on; g.fillStyle = Ld.light; g.restore(); }
    // the battle stands on the near ridge (jointed black silhouettes, rim-lit)
    if (L.k === 3 && s.type === 'clash') { const m = clashModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: 1310, S: 220 }); for (const f of m.figs) drawFigure(g, f, t, KIT.look); drawFx(g, m.fx, { dust: '#3a4a88', arrow: '#0a0a14', spark: Ld.light }); }
  });
  g.restore();
  content(g, t, s, lt, img, Ld);
  // near-plane occluder wipe between scenes: a dark front sheet slides across
  const nx = SC[s.i + 1]; const wipe = nx && t > nx.t0 - .4 ? seg(t, nx.t0 - .4, nx.t0) : s.i > 0 && lt < .4 ? 1 + seg(lt, 0, .4) : 0;
  if (wipe > 0 && wipe < 2) { const x = wipe <= 1 ? lerp(W, 0, eo(wipe)) : lerp(0, -W - 200, eo(wipe - 1)); g.fillStyle = '#05060c'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + W + 200, 0); g.lineTo(x + W + 200, H); g.lineTo(x - 120, H); g.closePath(); g.fill(); }
  // vignette
  const v = g.createRadialGradient(W / 2, 880, 500, W / 2, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  subs(g, t);
}

function content(g, t, s, lt, img, Ld) {
  const T = s.type, X = SAFE.x0 + 20, Wd = SAFE.x1 - SAFE.x0 - 40, top = SAFE.y0 + 30;
  const eyebrow = () => { if (!s.eyebrow) return; const st = strip(g, W / 2 - 200, top, 400, 58, seg(lt, .2, .7), '#e6d3ad'); if (st) block(g, 'eyebrow', s.eyebrow, { x: W / 2 - 180, y: top + 8, w: 360, h: 42 }, { ...TH.label, align: 'center', alpha: seg(lt, .5, .8) }); };
  if (T === 'custom') return stdBody(g, t, s, { x: SAFE.x0, y: SAFE.y0, w: SAFE.x1 - SAFE.x0, h: SAFE.y1 - SAFE.y0 }, TH);
  eyebrow();
  if (T === 'ayat') {   // the verse cut out of a dark sheet: the light burns through the letters
    const y = top + 90, h = 430, u = seg(lt, .2, 1), ww = Wd * eo(u);
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.shadowOffsetY = 10; g.fillStyle = '#120c08'; g.fillRect(X, y, ww, h); g.restore();
    if (u > .8) { g.save(); g.shadowColor = Ld.light; g.shadowBlur = 30; block(g, 'ar', s.arabic, { x: X + 40, y: y + 30, w: Wd - 80, h: h - 60 }, { family: 'Amiri', weight: 700, size: 104, min: 44, lh: 1.6, color: '#ffd89a', align: 'center', valign: 'middle' }); g.restore(); }
    const st = strip(g, X, y + h + 40, Wd, 330, seg(lt, 1, 1.6)); if (st) stdBody(g, t, { ...s, type: 'quote', text: s.translation, source: s.ref }, { x: X + 40, y: y + h + 70, w: Wd - 80, h: 270 }, TH);
    return;
  }
  if (T === 'clash') { const st = strip(g, X, top + 90, Wd, 330, seg(lt, .2, .8)); if (st) clashText(g, t, s, { x: X + 40, y: top + 110, w: Wd - 80, h: 200 }, TH, top + 330); return; }
  if (img) {   // the photo as a lit window cut in a sheet (a round moon gate), duotoned to the ladder
    // no rectangle: a new paper sheet rises into the stack with a round hole cut in it; the photo is the lit scene behind the hole,
    // toned to this stack's ladder (dark front tone -> light), the hole's cut edge catches the warm backlight
    const cx = W / 2, cy = 945, r = 250, u = eo(seg(lt, .2, 1)), lift = (1 - u) * 260;
    if (!GATE[s.i]) GATE[s.i] = { photo: duotone(img, Ld.L[4], Ld.light, 600, 600, 1.15), sheet: gateSheet(Ld, cx, cy, r, s.i) };
    const G = GATE[s.i];
    g.save(); g.beginPath(); g.arc(cx, cy + lift, r, 0, TAU); g.clip(); g.drawImage(G.photo, cx - r - 20, cy - r - 20 + lift - lt * 6, 2 * r + 40, 2 * r + 40);
    const ring = g.createRadialGradient(cx, cy + lift, r * .72, cx, cy + lift, r); ring.addColorStop(0, 'rgba(0,0,0,0)'); ring.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = ring; g.fillRect(cx - r, cy - r + lift, 2 * r, 2 * r); g.restore();
    g.drawImage(G.sheet, 0, lift);
    if (FRONT) { g.save(); g.translate(W / 2, 960); g.scale(FRONT.dz, FRONT.dz); g.translate(-W / 2, -960); g.drawImage(FRONT.c, FRONT.ox, 0); g.restore(); }   // the front sheet stays in front
    reg('photo', '[photo]', { x0: cx - r - 12, y0: cy - r - 12, x1: cx + r + 12, y1: cy + r + 12 });
    const st = strip(g, X, top + 80, Wd, 300, seg(lt, .2, .8)); const s2 = T === 'image' ? { ...s, type: 'headline' } : s;
    if (st) stdBody(g, t, s2, { x: X + 40, y: top + 100, w: Wd - 80, h: 260 }, { ...TH, title: { ...TH.title, size: 58, min: 36 }, body: { ...TH.body, size: 40 } });
    return;
  }
  // text strips: height by content type; a red seal marks the title
  const h = { title: 420, tribute: 420, headline: 440, quote: 520, counter: 700, list: 700 }[T] || 420;
  const st = strip(g, X, top + 80, Wd, h, seg(lt, .2, .8));
  if (st) { if (T === 'title') seal(g, X + Wd - 80, top + 80 + h - 80, 56, Ld.accent); stdBody(g, t, s, { x: X + 50, y: top + 120, w: Wd - 100, h: h - 90 }, TH); }
}
function subs(g, t) {   // quiet warm off-white serif with a soft shadow on the darkest band (the front sheet)
  const c = capAt(t); if (!c) return; const o = { family: 'Corm', weight: 500 }, words = c.words.slice(0, c.active + 1).join(' '), full = c.words.join(' ');
  const f = fit(g, full, 880, 170, { ...o, size: 66, min: 38, maxLines: 2 });
  g.save(); g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 12;
  block(g, 'caption', words, { x: 100, y: 1380, w: 880, h: 170 }, { ...o, size: f.size, min: f.size, align: 'center', color: '#f6ead2', cap: true, layer: 9 }); g.restore();
}
await boot({ fonts: [['Corm', 'fonts/lemo/cormorant-500.woff2', '500'], ['Corm', 'fonts/lemo/cormorant-500i.woff2', '500', 'italic'], ['Amiri', 'fonts/amiri-arabic-700-normal.woff2', '700']], draw });
