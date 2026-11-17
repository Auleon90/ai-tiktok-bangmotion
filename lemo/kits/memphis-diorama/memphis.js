// Memphis Diorama — portrait kit, 2D isometric. Concept from the Lemo-Opuscar style (the demo is a three.js model; here the same
// diorama is drawn axonometrically): warm white paper, the picture in an organic frame whose edge dissolves into grain; Memphis flat
// colour with exactly three tones per surface (top bright, sun side base, shade side darker), hard cool-violet shadows with a halftone
// of lighter dots, a deep-indigo #25214A outline, small patterns on surfaces (planks, stripes, dots, terrazzo); a model-maker's high
// three-quarter view of a PLACE, alive with small motions (walkers, boats, birds, cloud shadows, lights coming on) and never a close-up
// of a person; three lines of type under three Memphis marks; explainer callouts as rounded pills with a leader and a dot.
// Scene fields: "place": village | market | harbor | farm | mosque (default cycles), "time": day | dusk | night, "walkers": number.
import { W, H, SAFE, TAU, clamp, lerp, seg, eo, ss, back, at, SC, block, text, capAt, fit, font, boot, reg, KIT, countUp, mulberry, hash, mix } from './kit.js';

const INK = '#25214A', PAPER = '#FFFCF6', LIGHT = '#FFD36E';
const C = { yellow: '#FFD234', pink: '#FF7EB3', sky: '#5CC8FF', mint: '#5EDFB0', lilac: '#B9A0FF', peach: '#FF9C6B', cobalt: '#2F5BFF', coral: '#FF5A5F', green: '#2FCB7A',
  grass: '#9BE07A', grassD: '#7fcf66', field: '#FFC94A', plaza: '#FFD6B0', water: '#5CC8FF', path: '#F3E3C8', wood: '#C98B5A', white: '#FFFFFF' };
const HOUSE = [[C.yellow, C.coral], [C.pink, C.cobalt], [C.mint, C.coral], [C.lilac, C.yellow], [C.peach, C.mint], [C.sky, C.pink]];
const tone = (c, k) => mix(c, k > 1 ? '#ffffff' : '#000000', k > 1 ? k - 1 : 1 - k);
const shadeCol = c => { const n = parseInt(c.slice(1), 16); return `rgb(${(n >> 16 & 255) * .7 | 0},${(n >> 8 & 255) * .58 | 0},${(n & 255) * .9 | 0})`; };   // cool purple shade
// ---------------------------------------------------------------- isometric projection (world units: tiles; z in tiles)
const TW = 120, TH = 60, ZH = 60, BZ = 1.42; let OX = 540, OY = 330;
const iso = (x, y, z = 0) => [OX + (x - y) * TW / 2, OY + (x + y) * TH / 2 - z * ZH];
function poly(g, pts, fill, lw = 2.2) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); } }
let HALF;   // halftone dot pattern for shadows
function shadow(g, pts) { g.save(); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = 'rgba(92,70,170,.30)'; g.fill(); g.clip(); g.fillStyle = HALF; g.fillRect(0, 0, W, H); g.restore(); }
const SUN = [.55, .3];   // shadow offset per unit height, in world x/y (the sun never moves)
// a box with three tones, an outline, and an optional plank pattern on the walls
function box(g, x, y, w, d, h, col, o = {}) {
  if (o.shadow !== false) shadow(g, [iso(x + w, y), iso(x + w + h * SUN[0], y + h * SUN[1]), iso(x + w + h * SUN[0], y + d + h * SUN[1]), iso(x + h * SUN[0], y + d + h * SUN[1]), iso(x, y + d)]);
  const L = [iso(x, y + d, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x, y + d, h)], R = [iso(x + w, y, 0), iso(x + w, y + d, 0), iso(x + w, y + d, h), iso(x + w, y, h)];
  poly(g, L, col); poly(g, R, tone(col, .78)); poly(g, [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)], tone(col, 1.18));
  if (o.planks) { g.strokeStyle = tone(col, .86); g.lineWidth = 1.4; for (let k = 1; k < 6; k++) { const z = h * k / 6; for (const F of [[[x, y + d], [x + w, y + d]], [[x + w, y], [x + w, y + d]]]) { const a = iso(F[0][0], F[0][1], z), b = iso(F[1][0], F[1][1], z); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } } }
}
function house(g, x, y, w, d, h, wall, roof, t, lit, seed) {
  box(g, x, y, w, d, h, wall, { planks: true });
  // white corner trims
  g.strokeStyle = '#ffffff'; g.lineWidth = 3.4; for (const [cx, cy] of [[x, y + d], [x + w, y + d], [x + w, y]]) { const a = iso(cx, cy, 0), b = iso(cx, cy, h); g.beginPath(); g.moveTo(a[0], a[1] - 2); g.lineTo(b[0], b[1] + 2); g.stroke(); }
  // windows with shutters + flower boxes on both faces, a door with a step on the front
  const win = (fx, fy, dx, dy, z) => { const p = [iso(fx, fy, z), iso(fx + dx, fy + dy, z), iso(fx + dx, fy + dy, z + .32), iso(fx, fy, z + .32)]; poly(g, p, lit ? LIGHT : '#BFE4FF', 1.6);
    const sh = [iso(fx - dx * .45, fy - dy * .45, z), iso(fx, fy, z), iso(fx, fy, z + .32), iso(fx - dx * .45, fy - dy * .45, z + .32)]; poly(g, sh, roof, 1.2); const fb = [iso(fx, fy, z - .05), iso(fx + dx, fy + dy, z - .05), iso(fx + dx, fy + dy, z - .12), iso(fx, fy, z - .12)]; poly(g, fb, C.coral, 1); };
  for (let k = 0; k < Math.max(1, Math.round(w / .7)); k++) win(x + .25 + k * .7, y + d, .3, 0, h * .55);
  for (let k = 0; k < Math.max(1, Math.round(d / .8)); k++) win(x + w, y + .3 + k * .8, 0, .28, h * .55);
  poly(g, [iso(x + w * .55, y + d, 0), iso(x + w * .55 + .28, y + d, 0), iso(x + w * .55 + .28, y + d, .5), iso(x + w * .55, y + d, .5)], tone(roof, .7), 1.6);
  // gable roof along x: two striped slabs and a ridge; a round window in the gable
  const rz = h + .7, s1 = [iso(x - .08, y - .08, h), iso(x + w + .08, y - .08, h), iso(x + w + .08, y + d / 2, rz), iso(x - .08, y + d / 2, rz)], s2 = [iso(x - .08, y + d / 2, rz), iso(x + w + .08, y + d / 2, rz), iso(x + w + .08, y + d + .08, h), iso(x - .08, y + d + .08, h)];
  poly(g, s1, tone(roof, 1.15)); poly(g, s2, roof); g.save(); g.beginPath(); s2.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); g.strokeStyle = tone(roof, .82); g.lineWidth = 6;
  for (let k = 0; k < 10; k++) { const a = iso(x + k * w / 9, y + d / 2, rz), b = iso(x + k * w / 9, y + d + .1, h); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } g.restore();
  const gb = [iso(x + w, y, h), iso(x + w, y + d / 2, rz), iso(x + w, y + d, h)]; poly(g, gb, tone(wall, .78)); const gc = iso(x + w, y + d / 2, h + .3); g.fillStyle = lit ? LIGHT : '#BFE4FF'; g.beginPath(); g.arc(gc[0], gc[1], 7, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke();
  // chimney smoke at night, a little lamp by the door
  if (lit) { const lp = iso(x + w * .55 + .14, y + d + .25, 0); const gr = g.createRadialGradient(lp[0], lp[1], 0, lp[0], lp[1], 50); g.fillStyle = 'rgba(255,211,110,.45)'; g.beginPath(); g.ellipse(lp[0], lp[1] + 6, 46, 20, 0, 0, TAU); g.fill(); }
}
function tree(g, x, y, sz, col, t, seed) {   // trunk with a branch, a cluster of lobes in three tones, white dots; sways
  shadow(g, [iso(x - .3 + 1.1 * SUN[0], y - .3 + 1.1 * SUN[1]), iso(x + .4 + 1.3 * SUN[0], y + 1.3 * SUN[1]), iso(x + .1 + .8 * SUN[0], y + .5 + .8 * SUN[1]), iso(x, y + .2)]);
  const b = iso(x, y, 0), top = iso(x, y, .55 * sz), sw = Math.sin(t * 1.3 + seed) * 3;
  g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(...b); g.lineTo(top[0] + sw * .3, top[1]); g.stroke(); g.strokeStyle = C.wood; g.lineWidth = 5; g.stroke();
  const R = mulberry(seed), lobes = [[0, 0, 1], [-.55, .2, .78], [.55, .25, .8], [0, -.5, .8]];
  for (const [dx, dy, k] of lobes) { const cx = top[0] + dx * 30 * sz + sw, cy = top[1] - 26 * sz + dy * 30 * sz, r = 30 * sz * k;
    g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); g.save(); g.clip(); g.fillStyle = tone(col, .8); g.beginPath(); g.arc(cx + r * .45, cy + r * .45, r, 0, TAU); g.fill(); g.fillStyle = tone(col, 1.2); g.beginPath(); g.arc(cx - r * .45, cy - r * .5, r * .55, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + (R() - .5) * r * 1.2, cy + (R() - .5) * r * 1.2, 2.6, 0, TAU); g.fill(); } g.restore();
    g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
}
function tile(g, x, y, col, pat, t) {   // a ground tile with its world-anchored pattern
  const p = [iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)]; poly(g, p, col, 0);
  g.save(); g.beginPath(); p.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.clip();
  if (pat === 'dots') { g.fillStyle = 'rgba(255,255,255,.45)'; for (const [a, b] of [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]]) { const q = iso(x + a, y + b); g.beginPath(); g.ellipse(q[0], q[1], 4, 2.4, 0, 0, TAU); g.fill(); } }
  if (pat === 'stripes') { g.strokeStyle = tone(col, .88); g.lineWidth = 3; for (let k = 1; k < 5; k++) { const a = iso(x + k / 5, y), b = iso(x + k / 5, y + 1); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } }
  if (pat === 'terrazzo') { const R = mulberry(x * 31 + y * 7); for (let k = 0; k < 6; k++) { const q = iso(x + R(), y + R()); g.fillStyle = [C.pink, C.sky, C.yellow, C.mint][k % 4]; g.beginPath(); g.ellipse(q[0], q[1], 3.2, 2, R() * 3, 0, TAU); g.fill(); } }
  if (pat === 'water') { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.4; g.lineCap = 'round'; for (let k = 0; k < 2; k++) { const q = iso(x + .3 + k * .35, y + .3 + ((t * .15 + k * .5 + x * .3) % 1) * .5); g.beginPath(); g.moveTo(q[0] - 9, q[1]); g.quadraticCurveTo(q[0] - 4, q[1] - 5, q[0], q[1]); g.quadraticCurveTo(q[0] + 4, q[1] + 5, q[0] + 9, q[1]); g.stroke(); } }
  g.restore();
}
// ---------------------------------------------------------------- places (a 9×9 board), built from the scene's place type
const PLACES = ['village', 'market', 'farm', 'harbor', 'mosque'];
function layout(place, seed) {
  const R = mulberry(seed), G = [...Array(9)].map(() => Array(9).fill('grass')), items = [], walk = [];
  const set = (x, y, k) => { if (x >= 0 && y >= 0 && x < 9 && y < 9) G[y][x] = k; };
  if (place === 'village' || place === 'farm') { for (let y = 0; y < 9; y++) { set(1, y, 'water'); set(2, y, y === 4 ? 'path' : 'grass'); } for (let x = 2; x < 9; x++) set(x, 4, 'path'); walk.push([[2, 4.5], [8.5, 4.5]]); }
  if (place === 'farm') for (let y = 0; y < 4; y++) for (let x = 4; x < 9; x++) set(x, y, 'field');
  if (place === 'market' || place === 'mosque') { for (let y = 3; y < 7; y++) for (let x = 2; x < 7; x++) set(x, y, 'plaza'); for (let x = 0; x < 9; x++) set(x, 7, 'path'); walk.push([[2, 3.3], [6.7, 3.3]], [[2.2, 6.6], [6.7, 6.6]], [[0, 7.5], [8.5, 7.5]]); }
  if (place === 'harbor') { for (let y = 0; y < 9; y++) for (let x = 0; x < 4; x++) set(x, y, 'water'); for (let y = 0; y < 9; y++) set(4, y, 'path'); walk.push([[4.5, 0], [4.5, 8.5]]); }
  // buildings, trees, stalls, haystacks, boats
  if (place === 'village') { [[3, 1], [5, 1], [7, 1], [3, 6], [6, 6]].forEach(([x, y], k) => items.push({ k: 'house', x, y, w: 1.4, d: 1.1, h: 1 + R() * .5, c: HOUSE[k % HOUSE.length] })); }
  if (place === 'farm') { items.push({ k: 'house', x: 5, y: 6, w: 1.8, d: 1.2, h: 1.3, c: [C.coral, C.yellow] }); for (let i = 0; i < 6; i++) items.push({ k: 'hay', x: 4.4 + (i % 3) * 1.5, y: .6 + Math.floor(i / 3) * 1.6 }); }
  if (place === 'market') { [[0, 1], [7, 1], [7, 4], [0, 4]].forEach(([x, y], k) => items.push({ k: 'house', x, y, w: 1.3, d: 1.2, h: 1.4, c: HOUSE[(k + 2) % HOUSE.length] })); for (let i = 0; i < 6; i++) items.push({ k: 'stall', x: 2.4 + (i % 3) * 1.5, y: 3.7 + Math.floor(i / 3) * 1.6, c: [C.pink, C.sky, C.yellow, C.mint, C.coral, C.lilac][i] }); }
  if (place === 'mosque') { items.push({ k: 'mosque', x: 3.2, y: 3.6, w: 2.4, d: 2.2 }); [[0, 1], [7, 1], [7, 4.5], [0, 4.5]].forEach(([x, y], k) => items.push({ k: 'house', x, y, w: 1.3, d: 1.2, h: 1.2, c: HOUSE[(k + 1) % HOUSE.length] })); }
  if (place === 'harbor') { [[5.4, 1], [5.4, 3.4], [5.4, 5.8]].forEach(([x, y], k) => items.push({ k: 'house', x, y, w: 1.5, d: 1.4, h: 1.5, c: HOUSE[(k + 3) % HOUSE.length] })); items.push({ k: 'pier', x: 2.6, y: 4 }); }
  for (let i = 0; i < 9; i++) { const x = R() * 8.5, y = R() * 8.5; if (G[Math.floor(y)][Math.floor(x)] === 'grass' && !items.some(o => Math.abs(o.x - x) < 1.6 && Math.abs(o.y - y) < 1.6)) items.push({ k: 'tree', x, y, c: [C.green, C.mint, C.coral, C.yellow, C.peach][i % 5], s: .8 + R() * .5 }); }
  items.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  return { G, items, walk };
}
let BOARD = {};
function stall(g, x, y, col) { box(g, x, y, .8, .6, .45, '#fff1d6'); const z = .85, aw = [iso(x - .1, y - .1, z), iso(x + .9, y - .1, z), iso(x + .9, y + .7, z - .25), iso(x - .1, y + .7, z - .25)]; poly(g, aw, col); g.save(); g.beginPath(); aw.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip(); g.strokeStyle = '#ffffff'; g.lineWidth = 9; for (let k = 0; k < 6; k++) { const a = iso(x + k * .18, y - .1, z), b = iso(x + k * .18, y + .7, z - .25); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } g.restore();
  for (const px of [x, x + .8]) { const a = iso(px, y + .6, .45), b = iso(px, y + .6, z - .25); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); } }
function mosque(g, x, y, w, d, lit) {
  box(g, x, y, w, d, 1.1, '#FFF1D6', { planks: false }); const c = iso(x + w / 2, y + d / 2, 1.1);
  g.fillStyle = C.mint; g.beginPath(); g.ellipse(c[0], c[1] - 20, 74, 70, 0, Math.PI, TAU); g.fill(); g.save(); g.clip(); g.fillStyle = tone(C.mint, .8); g.beginPath(); g.arc(c[0] + 40, c[1] - 10, 70, 0, TAU); g.fill(); g.restore(); g.strokeStyle = INK; g.lineWidth = 2.2; g.beginPath(); g.ellipse(c[0], c[1] - 20, 74, 70, 0, Math.PI, TAU); g.closePath(); g.stroke();
  g.strokeStyle = C.yellow; g.lineWidth = 4; g.beginPath(); g.moveTo(c[0], c[1] - 90); g.lineTo(c[0], c[1] - 110); g.stroke();
  box(g, x + w + .1, y - .1, .35, .35, 2.6, '#FFF1D6'); const mt = iso(x + w + .27, y + .07, 2.6); g.fillStyle = C.mint; g.beginPath(); g.moveTo(mt[0] - 14, mt[1]); g.lineTo(mt[0], mt[1] - 40); g.lineTo(mt[0] + 14, mt[1]); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke();
  for (let k = 0; k < 4; k++) { const p = [iso(x + .3 + k * .5, y + d, .25), iso(x + .55 + k * .5, y + d, .25), iso(x + .55 + k * .5, y + d, .75), iso(x + .3 + k * .5, y + d, .75)]; poly(g, p, lit ? LIGHT : '#BFE4FF', 1.4); }
}
function board(s) {   // static diorama per scene (ground, buildings, trees, shadows), drawn once
  const key = s.i; if (BOARD[key]) return BOARD[key];
  const place = PLACES.includes(s.place) ? s.place : PLACES[s.i % PLACES.length], night = s.time === 'night' || s.time === 'dusk', L = layout(place, 11 + s.i);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); OX = 540; OY = 300;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) { const k = L.G[y][x]; tile(g, x, y, { grass: (x + y) % 2 ? C.grass : C.grassD, water: C.water, path: C.path, field: C.field, plaza: C.plaza }[k], { grass: 'dots', field: 'stripes', plaza: 'terrazzo', water: 'water', path: null }[k], 0); }
  poly(g, [iso(0, 9), iso(9, 9), iso(9, 9, -.35), iso(0, 9, -.35)], '#c9a27a'); poly(g, [iso(9, 0), iso(9, 9), iso(9, 9, -.35), iso(9, 0, -.35)], '#a8815c');   // the model's base
  const lit = night;
  for (const o of L.items) {
    if (o.k === 'house') house(g, o.x, o.y, o.w, o.d, o.h, o.c[0], o.c[1], 0, lit, o.x * 7 + o.y);
    if (o.k === 'tree') tree(g, o.x, o.y, o.s, o.c, 0, o.x * 13 + o.y);
    if (o.k === 'hay') { const b = iso(o.x, o.y); shadow(g, [[b[0], b[1]], [b[0] + 40, b[1] + 14], [b[0] + 60, b[1]], [b[0] + 20, b[1] - 10]]); g.fillStyle = C.yellow; g.beginPath(); g.ellipse(b[0], b[1] - 16, 26, 22, 0, Math.PI, TAU); g.lineTo(b[0] + 26, b[1]); g.lineTo(b[0] - 26, b[1]); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); }
    if (o.k === 'stall') stall(g, o.x, o.y, o.c);
    if (o.k === 'mosque') mosque(g, o.x, o.y, o.w, o.d, lit);
    if (o.k === 'pier') box(g, o.x, o.y, 1.4, .5, .12, C.wood);
  }
  return BOARD[key] = { c, L, place, night };
}
// ---------------------------------------------------------------- small motions: walkers, boats, birds, cloud shadows
function walker(g, x, y, t, col, ph) {   // a tiny capsule person (no face, no acting), walking a cycle
  const p = iso(x, y), b = Math.abs(Math.sin(t * 6 + ph)) * 3; g.fillStyle = 'rgba(92,70,170,.3)'; g.beginPath(); g.ellipse(p[0] + 6, p[1] + 2, 8, 3, 0, 0, TAU); g.fill();
  g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); g.roundRect(p[0] - 6, p[1] - 30 - b, 12, 24, 6); g.fill(); g.stroke(); g.fillStyle = '#FFE0C2'; g.beginPath(); g.arc(p[0], p[1] - 36 - b, 6, 0, TAU); g.fill(); g.stroke();
}
function life(g, t, s, B, nWalk) {
  const R = mulberry(s.i + 3);
  B.L.walk.forEach((ln, li) => { for (let k = 0; k < Math.ceil(nWalk / B.L.walk.length); k++) { const sp = .04 + R() * .05, u = ((t * sp + R()) % 1), dir = k % 2, a = ln[dir], b = ln[1 - dir];
    walker(g, lerp(a[0], b[0], u) + (R() - .5) * .25, lerp(a[1], b[1], u) + (R() - .5) * .25, t, [C.coral, C.cobalt, C.pink, C.yellow, C.mint, C.lilac][(k + li) % 6], k * 1.7); } });
  // stall crowds in a market
  if (B.place === 'market') for (let k = 0; k < 8; k++) { const st = B.L.items.filter(o => o.k === 'stall')[k % 6]; if (st) walker(g, st.x + .4 + Math.sin(t * .6 + k) * .25, st.y + 1, t * .3, [C.cobalt, C.coral, C.lilac][k % 3], k); }
  // boats on the water
  if (B.place === 'harbor' || B.place === 'village' || B.place === 'farm') for (let k = 0; k < 2; k++) { const y = ((t * .12 + k * .5) % 1) * 9, x = B.place === 'harbor' ? 1 + k * 1.3 : 1.5; const p = iso(x, y);
    g.fillStyle = [C.coral, C.yellow][k]; g.beginPath(); g.moveTo(p[0] - 22, p[1] - 6); g.lineTo(p[0] + 22, p[1] - 6); g.lineTo(p[0] + 14, p[1] + 6); g.lineTo(p[0] - 14, p[1] + 6); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); }
  // birds and a cloud shadow drifting over the board
  g.strokeStyle = INK; g.lineWidth = 2.4; g.lineCap = 'round'; for (let k = 0; k < 4; k++) { const x = ((t * 40 + k * 140) % 1300) - 100, y = 260 + k * 30 + Math.sin(t * 2 + k) * 10, f = Math.sin(t * 9 + k) * 5; g.beginPath(); g.moveTo(x - 12, y - f); g.lineTo(x, y); g.lineTo(x + 12, y - f); g.stroke(); }
  const cx = ((t * 18) % 1400) - 200; g.fillStyle = 'rgba(92,70,170,.12)'; g.beginPath(); g.ellipse(cx, 640, 220, 70, -.2, 0, TAU); g.fill();
}
// ---------------------------------------------------------------- frame, type, callouts
let GRAIN, PIC;
function prep() {
  HALF = (() => { const c = document.createElement('canvas'); c.width = 14; c.height = 14; const x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(3.5, 3.5, 2, 0, TAU); x.arc(10.5, 10.5, 2, 0, TAU); x.fill(); return document.createElement('canvas').getContext('2d').createPattern(c, 'repeat'); })();
  GRAIN = [0, 1, 2].map(k => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), d = x.createImageData(W, H), R = mulberry(5 + k);
    // the organic frame: a blob whose edge dissolves into grain (alpha noise near the rim); three drawings that boil on twos
    const cx = W / 2, cy = 650, rx = 500, ry = 470;
    for (let y = 0; y < H; y++) for (let x2 = 0; x2 < W; x2++) { const a = Math.atan2(y - cy, x2 - cx), rr = 1 + .05 * Math.sin(a * 3 + 1) + .03 * Math.sin(a * 7), dx = (x2 - cx) / (rx * rr), dy = (y - cy) / (ry * rr), e = Math.sqrt(dx * dx + dy * dy);
      const inside = e < .93 ? 1 : e > 1.04 ? 0 : (R() < (1.04 - e) / .11 ? 1 : 0); d.data[(y * W + x2) * 4 + 3] = inside ? 255 : 0; }
    x.putImageData(d, 0, 0); return c; });
}
function marks(g, cx, y) { g.fillStyle = '#FFC93C'; g.beginPath(); g.arc(cx - 26, y, 7, 0, TAU); g.fill(); g.fillStyle = '#FF7FAA'; g.beginPath(); g.moveTo(cx - 7, y + 6); g.lineTo(cx, y - 7); g.lineTo(cx + 7, y + 6); g.closePath(); g.fill();
  g.strokeStyle = '#2E5BE6'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 18, y); g.lineTo(cx + 23, y - 5); g.lineTo(cx + 29, y + 5); g.lineTo(cx + 35, y); g.stroke(); }
function callout(g, id, txt, ax, ay, side, u, big, slotY) {   // a rounded pill with a leader line and a dot, popping out with a back-ease
  if (u <= 0) return; const k = back(clamp(u), 1.7), o = big ? { family: 'IT', weight: 600, size: 74, min: 36 } : { family: 'IT', weight: 600, size: 40, min: 24 };
  const f = fit(g, txt, big ? 560 : 520, big ? 90 : 100, { ...o, maxLines: 2 }); font(g, f.size, o); const w = Math.max(...f.widths) + 56, h = f.h + 30;
  const px = side < 0 ? SAFE.x0 : side > 0 ? SAFE.x1 - w : (W - w) / 2, py = slotY ?? clamp(ay - 150 - h, SAFE.y0 + 10, 1060 - h);
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, ay); g.lineTo(px + (side < 0 ? w - 30 : 30), py + h); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(ax, ay, 7, 0, TAU); g.fill();
  g.save(); g.translate(px + w / 2, py + h / 2); g.scale(k, k); g.translate(-px - w / 2, -py - h / 2); g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(px, py, w, h, h / 2 > 40 ? 40 : h / 2); g.fill(); g.lineWidth = 3; g.stroke(); g.restore();
  block(g, id, txt, { x: px + 28, y: py + 15, w: w - 56, h: f.h }, { ...o, size: f.size, min: f.size, color: INK, align: 'center', layer: 3, alpha: k });
}
KIT.look = { fill: f => f.color || C.coral, stroke: INK, lw: 1.8, shield: C.yellow, weapon: INK, glow: LIGHT, glowMode: 'source-over' };
function draw(g, t) {
  if (!GRAIN) prep();
  const { s } = at(t), lt = t - s.t0, B = board(s), open = s.i === 0 ? eo(seg(lt, 0, 1.2)) : 1, close = s.i === SC.length - 1 ? 1 - eo(seg(t, SC[SC.length - 1].t1 - 1, SC[SC.length - 1].t1)) : 1;
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  // the diorama, drifting slowly (a high slow drift), inside the grainy frame that grows open from the centre
  if (!PIC) { PIC = document.createElement('canvas'); PIC.width = W; PIC.height = H; } const pic = PIC, p = pic.getContext('2d'); p.setTransform(1, 0, 0, 1, 0, 0); p.globalCompositeOperation = 'source-over';
  p.fillStyle = '#E8F6FF'; p.fillRect(0, 0, W, H); const dz = BZ * (1.0 + .05 * ss(seg(lt, 0, s.d))), dx = Math.sin(t * .08) * 26;
  p.save(); p.translate(W / 2 + dx, 660); p.scale(dz, dz); p.translate(-540, -570); p.drawImage(B.c, 0, 0); OX = 540; OY = 300; life(p, t, s, B, s.walkers ?? 10); p.restore();
  const scr = ([x, y]) => [(x - 540) * dz + W / 2 + dx, (y - 570) * dz + 660];
  if (B.night) { p.globalCompositeOperation = 'multiply'; p.globalAlpha = .55; p.fillStyle = s.time === 'dusk' ? '#FF9E7A' : '#7E6FD0'; p.fillRect(0, 0, W, H); p.globalAlpha = 1; p.globalCompositeOperation = 'source-over'; }
  p.globalCompositeOperation = 'destination-in'; const sc = Math.max(.001, open * close); p.save(); p.translate(W / 2, 650); p.scale(sc, sc); p.translate(-W / 2, -650); p.drawImage(GRAIN[Math.floor(t * 12) % 3], 0, 0); p.restore();
  g.drawImage(pic, 0, 0);
  // explainer callouts from the model
  OX = 540; OY = 300; const T = s.type, u = seg(lt, .4, .9), anchors = [iso(4.5, 4.5, .6), iso(2.5, 2.5, .6), iso(6.5, 6.5, .6)].map(scr);
  if (T === 'counter') (s.items || []).slice(0, 3).forEach((x, k) => { const a = anchors[k]; callout(g, 'num' + k, `${x.prefix || ''}${countUp(x.value, seg(lt, .5 + k * .4, 1.5 + k * .4))}${x.suffix || ''}${x.label ? ' · ' + x.label : ''}`, a[0], a[1], k % 2 ? 1 : -1, seg(lt, .4 + k * .4, .9 + k * .4), true, SAFE.y0 + 20 + k * 170); });
  if (T === 'list') (s.items || []).slice(0, 3).forEach((x, k) => { const a = anchors[k]; callout(g, 'it' + k, x, a[0], a[1], k % 2 ? 1 : -1, seg(lt, .6 + k * .6, 1.1 + k * .6), false, SAFE.y0 + 20 + k * 120); });
  if (T === 'quote' && s.text) callout(g, 'quote', `“${s.text}”`, anchors[0][0], anchors[0][1], 0, u, false, SAFE.y0 + 20);
  // three lines of type under the frame, under the three marks
  const l1 = s.title || s.headline || s.name || (T === 'ayat' ? s.ref : '') || (window.PROPS.title || ''), l2 = s.subtitle || s.sub || s.note || (T === 'ayat' ? s.translation : '') || (T === 'quote' ? s.source || '' : ''), l3 = s.eyebrow || '';
  const a = eo(seg(lt, .1, .5)); marks(g, W / 2, 1128);
  block(g, 'l1', T === 'ayat' ? s.arabic : l1, { x: SAFE.x0, y: 1142, w: SAFE.x1 - SAFE.x0, h: 44 }, { family: T === 'ayat' ? 'Amiri' : 'IT', weight: T === 'ayat' ? 700 : 600, size: 46, min: 24, color: '#2B2840', align: 'center', alpha: a });
  if (l2) block(g, 'l2', l2, { x: SAFE.x0, y: 1188, w: SAFE.x1 - SAFE.x0, h: 32 }, { family: 'IT', weight: 400, size: 28, min: 18, color: '#8D8AA0', align: 'center', alpha: a });
  if (l3) block(g, 'l3', l3.toUpperCase(), { x: SAFE.x0, y: 1222, w: SAFE.x1 - SAFE.x0, h: 26 }, { family: 'PM', weight: 400, size: 20, min: 14, ls: .08, color: '#B7B4C6', align: 'center', alpha: a });
  // plain bottom subtitles (no styled box), as the style asks when there is a voice
  const c = capAt(t); if (c) { const o = { family: 'IT', weight: 600 }, f = fit(g, c.words.join(' '), 880, 150, { ...o, size: 54, min: 32, maxLines: 2 });
    block(g, 'caption', c.words.slice(0, c.active + 1).join(' '), { x: 100, y: 1360, w: 880, h: 150 }, { ...o, size: f.size, min: f.size, color: '#2B2840', align: 'center', cap: true, layer: 9 }); }
}
await boot({ fonts: [['IT', 'fonts/lemo/intertight-600.woff2', '600'], ['IT', 'fonts/lemo/intertight-400.woff2', '400'], ['PM', 'fonts/lemo/plexmono-400.woff2'], ['Amiri', 'fonts/amiri-arabic-700-normal.woff2', '700']], draw });
