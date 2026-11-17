// Paper Pop-up Book — portrait driver (2D). Concept from the Lemo-Opuscar style: a pop-up book on a real desk is the stage;
// every scene is a SPREAD (one hue family), set pieces are flat cut-paper cards (the demo's own art.js / paper.js, MIT) that
// stand up from the page back→front with an overshoot and fold down before the page turns; text lives in the paper world:
// a cardboard sign dropping on strings (titles), paper speech bubbles that type on (quotes), pull-tab slats that flip to a number
// (counters), hanging tags (lists), a paper scroll (ayat), a photo card that pops up (images). Narration = cream subtitles with a
// dark-brown outline. The 3D book, lamp and macro lens of the demo are drawn in 2D: perspective page, cut-out shadows, lens blur.
import { W, H, SAFE, TAU, clamp, lerp, seg, eo, ss, at, SC, IMG, block, text, capAt, stdBody, boot, reg, fit, font, cover, KIT, countUp } from './kit.js';
import { clashModel, drawFigure, drawFx, clashText } from './clash.js';
import { actionModel, drawActors, actionText } from './action.js';
import * as A from './demo/art.js';
import { paperFill, cv, INK, GRAIN } from './demo/paper.js';
import { back, spring, mulberry } from './demo/lib.js';

const BROWN = '#3a2a24', CREAM = '#fff7ea';
// ---------------------------------------------------------------- spreads (one dominant hue family each)
const SPREADS = {
  meadow: { sky: '#bfe6f7', ground: '#9fd57a', hill: ['#b5e39a', '#93cc78'], hill2: ['#8fd16a', '#6cb04f'], tree: ['#62c24c', '#3e9a34'], flower: ['#ff7a7a', '#ffd23f', '#c86ad8'], sun: true },
  market: { sky: '#f9dbe8', ground: '#d9c6ef', hill: ['#e3c9f0', '#c6a6e2'], hill2: ['#cdb0ea', '#a98ed6'], tree: ['#7fd8b8', '#4fb894'], flower: ['#ff8fb1', '#7fd8b8', '#ffd23f'], sun: true },
  desert: { sky: '#ffe7b0', ground: '#ecc277', hill: ['#f5cf8a', '#ddb062'], hill2: ['#e9b765', '#c99545'], tree: ['#3fbfb0', '#2a948a'], flower: ['#2aa7c9', '#ff7a5a', '#ffd23f'], sun: true },
  sea: { sky: '#cdeaf5', ground: '#f3dfb0', hill: ['#a8dcef', '#7fc3e0'], hill2: ['#8fd16a', '#6cb04f'], tree: ['#62c24c', '#3e9a34'], flower: ['#ff7a7a', '#ffffff', '#ffd23f'], sea: true, sun: true },
  night: { sky: '#2e3f86', ground: '#3f5f8f', hill: ['#4a6aa8', '#36528a'], hill2: ['#3a5f8a', '#2a4670'], tree: ['#2f8a6a', '#226650'], flower: ['#ffe35a', '#ffffff', '#9fd0ff'], moon: true },
  sketch: { sky: '#f4ecd8', ground: '#e8dcc0', hill: ['#efe6d2', '#d9cdb2'], hill2: ['#e6dcc4', '#cfc2a4'], tree: ['#d9cfb8', '#bcae90'], flower: ['#cfc2a4', '#bcae90', '#e6dcc4'], sketch: true },
};
const ORDER = ['meadow', 'market', 'desert', 'sea', 'night'];
const spreadOf = s => SPREADS[s.spread] ? s.spread : s.type === 'ayat' ? 'night' : ORDER[s.i % ORDER.length];

// ---------------------------------------------------------------- the book in 9:16: backdrop board up, ground page in perspective
const BK = { x0: 34, x1: 1046, top: 140, gut: 1190, front: 1640, fx0: -40, fx1: 1120 };
const F = 3100 / A.PPM;   // screen px per art px at the front edge (props are drawn at PPM px/m)
const depthK = y => lerp(.62, 1, (y - BK.gut) / (BK.front - BK.gut));     // perspective scale on the ground page
let ROOM, PAGES = {}, PROPS = {}, SHADOW = new Map(), PHOTO = {};
function shadowOf(c) { if (SHADOW.has(c)) return SHADOW.get(c); const s = cv(c.width / 2, c.height / 2), x = s.getContext('2d'); x.filter = 'blur(6px)'; x.drawImage(c, 0, 0, s.width, s.height); x.filter = 'none'; x.globalCompositeOperation = 'source-in'; x.fillStyle = 'rgba(40,24,10,.38)'; x.fillRect(0, 0, s.width, s.height); SHADOW.set(c, s); return s; }
function pages(name) {
  if (PAGES[name]) return PAGES[name]; const P = SPREADS[name];
  const sky = cv(BK.x1 - BK.x0, BK.gut - BK.top); paperFill(sky.getContext('2d'), sky.width, sky.height, P.sky, 3, P.moon ? .1 : .06);
  if (P.moon) { const x = sky.getContext('2d'), r = mulberry(4); x.fillStyle = 'rgba(255,240,180,.8)'; for (let i = 0; i < 70; i++) { x.beginPath(); x.arc(r() * sky.width, r() * sky.height * .7, 1.5 + r() * 2.5, 0, TAU); x.fill(); } }
  const gr = cv(BK.fx1 - BK.fx0, BK.front - BK.gut); paperFill(gr.getContext('2d'), gr.width, gr.height, P.ground, 5);
  return PAGES[name] = { sky, gr };
}
function props(name) {   // the cards on this spread: [layer row y, x, item, delay order]
  if (PROPS[name]) return PROPS[name]; const P = SPREADS[name], R = mulberry(name.length * 31), L = [];
  L.push([BK.gut + 6, 230, A.hill(.26, .11, P.hill[0], P.hill[1], 11, { bumps: 3 })], [BK.gut + 6, 840, A.hill(.26, .12, P.hill[0], P.hill[1], 12, { bumps: 2 })]);
  if (P.sea) { L.push([BK.gut + 90, 540, A.waveStrip(.5, .045, '#7fc3e0', '#4a9fc6', 3)], [BK.gut + 70, 760, A.boat(.09)], [BK.gut + 60, 260, A.island(.12)]); }
  else { L.push([BK.gut + 90, 150, A.lolliTree(.13, P.tree[0], P.tree[1], 5)], [BK.gut + 110, 930, A.pine(.14, P.tree[0], P.tree[1], 7)], [BK.gut + 170, 540, A.hill(.24, .065, P.hill2[0], P.hill2[1], 21, { bumps: 3, dots: P.flower })]); }
  L.push([BK.gut + 330, 90, A.bush(.06, .04, P.tree[0], P.tree[1], 8, P.flower[0])], [BK.gut + 350, 990, A.bush(.065, .042, P.tree[0], P.tree[1], 9, P.flower[1])]);
  for (let k = 0; k < 3; k++) L.push([BK.gut + 400 + (k % 2) * 25, 300 + k * 240 + R() * 40, A.flower(.04 + R() * .015, P.flower[k % 3], 30 + k)]);
  return PROPS[name] = L.map(([y, x, it], k) => ({ y, x, it, k }));
}
// draw one card standing on the ground page at (x, y): scale by depth, pop-up u (0 flat → 1 standing), sway, cut-out shadow
function card(g, it, x, y, u, sc = 1, sway = 0) {
  if (u <= .01) return; const k = depthK(y) * F * sc, w = it.c.width * k, h = it.c.height * k, ax = it.ax * w, ay = it.ay * h;
  g.save(); g.translate(x, y); g.rotate(sway);
  const sh = shadowOf(it.c); g.save(); g.transform(1, 0, -.35, 1, 0, 0); g.scale(1, .32 * u); g.drawImage(sh, -ax + 14, -ay, w, h); g.restore();   // shadow on the page
  g.scale(1, u); g.drawImage(it.c, -ax, -ay, w, h); g.restore();
}
// a card hanging on two threads from the top of the frame (drops in on a spring, swings to rest)
function hang(g, t0, lt, x, y, w, h, draw, o = {}) {
  const d = spring(lt - t0, 6, .45), yy = lerp(-h - 200, y, d), ang = Math.sin((lt - t0) * 3) * .05 * Math.exp(-(lt - t0) * 1.2) * (o.dir || 1);
  if (lt < t0) return null;
  g.save(); g.strokeStyle = 'rgba(58,42,36,.75)'; g.lineWidth = 2.5;
  for (const sx of [x - w * .32, x + w * .32]) { g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx + ang * 200, yy); g.stroke(); }
  g.translate(x, yy); g.rotate(ang); draw(g, w, h); g.restore();
  return { x0: x - w / 2, y0: y, x1: x + w / 2, y1: y + h };
}
function board(g, w, h, fill = CREAM, edge = '#d9c3a0') {   // cardboard: white margin, grey edge, crescent shade, ink line, grain
  const p = new Path2D(); p.roundRect(-w / 2, 0, w, h, 22);
  g.save(); g.shadowColor = 'rgba(40,24,10,.3)'; g.shadowBlur = 18; g.shadowOffsetY = 10; g.fillStyle = '#b9ad9c'; g.fill(p); g.restore();
  g.save(); g.lineJoin = 'round'; g.strokeStyle = '#fffdf7'; g.lineWidth = 26; g.stroke(p); g.fillStyle = fill; g.fill(p);
  g.clip(p); g.fillStyle = edge; g.globalAlpha = .55; g.fillRect(-w / 2, h - 28, w, 28); g.globalAlpha = .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-w / 2, 0, w, h); g.restore();
  g.strokeStyle = BROWN; g.lineWidth = 5; g.stroke(p);
}
function bubble(g, x, y, w, h, tail) {   // a paper speech bubble with a tail toward (tail.x, tail.y)
  const p = new Path2D(); p.roundRect(x, y, w, h, 46); p.moveTo(x + w * .3, y + h - 4); p.lineTo(tail.x, tail.y); p.lineTo(x + w * .44, y + h - 4);
  g.save(); g.lineJoin = 'round'; g.shadowColor = 'rgba(40,24,10,.25)'; g.shadowBlur = 14; g.shadowOffsetY = 8; g.strokeStyle = '#fffdf7'; g.lineWidth = 22; g.stroke(p); g.restore();
  g.fillStyle = '#ffffff'; g.fill(p); g.strokeStyle = BROWN; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke(p);
}

const TH = {
  align: 'center', rise: 0, accent: '#e8413a',
  title: { family: 'Lilita', weight: 400, size: 110, min: 44, lh: 1.02, color: '#5a3417' },
  quote: { family: 'Fredoka', weight: 500, size: 62, min: 32, lh: 1.2, color: BROWN },
  num: { family: 'Lilita', weight: 400, size: 150, min: 60, lh: 1, color: '#e8413a' },
  body: { family: 'Fredoka', weight: 500, size: 46, min: 28, lh: 1.2, color: '#5a4a3e' },
  label: { family: 'Fredoka', weight: 700, size: 34, min: 22, ls: .06, upper: true, color: '#8a5a31' },
  side: { family: 'Lilita', weight: 400, size: 44, min: 26, fixed: true, color: '#5a3417' },
  arabic: { family: 'Amiri', weight: 700, color: '#4a2c16' },
};
KIT.look = { fill: f => f.color || (f.side > 0 ? '#3fa1de' : '#e8413a'), stroke: '#fffdf7', lw: 7, shield: '#ffd23f', weapon: BROWN, flag: f => f.color, glow: '#ffe066', glowMode: 'source-over' };

function room(g, t) {   // the real room: a warm lamp-lit desk, out of focus
  if (!ROOM) { ROOM = cv(W, H); const x = ROOM.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a2a20'); gr.addColorStop(.6, '#6b4a33'); gr.addColorStop(1, '#8a6040'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    const r = mulberry(2); for (let i = 0; i < 18; i++) { const px = r() * W, py = r() * 700, rr = 40 + r() * 90, b = x.createRadialGradient(px, py, 0, px, py, rr); b.addColorStop(0, `rgba(255,214,150,${.18 + r() * .2})`); b.addColorStop(1, 'rgba(255,214,150,0)'); x.fillStyle = b; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    const desk = x.createLinearGradient(0, 1600, 0, H); desk.addColorStop(0, '#9a6a42'); desk.addColorStop(1, '#6e4528'); x.fillStyle = desk; x.fillRect(0, 1600, W, H - 1600);
    x.globalAlpha = .25; for (let i = 0; i < 40; i++) { x.strokeStyle = r() < .5 ? '#5a3a20' : '#b88a5c'; x.lineWidth = 2 + r() * 4; x.beginPath(); const yy = 1620 + r() * 300; x.moveTo(0, yy); x.bezierCurveTo(300, yy + r() * 20, 700, yy - r() * 20, W, yy + r() * 10); x.stroke(); } }
  g.drawImage(ROOM, 0, 0);
}
function book(g, name, open) {   // cover edge, page block, ground page in perspective, the standing backdrop
  const { sky, gr } = pages(name);
  g.fillStyle = '#7a2e2a'; g.beginPath(); g.moveTo(BK.fx0 - 30, BK.front + 50); g.lineTo(BK.fx1 + 30, BK.front + 50); g.lineTo(BK.fx1 + 20, BK.front + 70); g.lineTo(BK.fx0 - 20, BK.front + 70); g.fill();   // cloth cover edge
  g.fillStyle = '#f2ead8'; g.beginPath(); g.moveTo(BK.fx0, BK.front); g.lineTo(BK.fx1, BK.front); g.lineTo(BK.fx1 + 10, BK.front + 50); g.lineTo(BK.fx0 - 10, BK.front + 50); g.fill();
  g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 1.5; for (let k = 1; k < 9; k++) { const y = BK.front + k * 5.5; g.beginPath(); g.moveTo(BK.fx0 - k, y); g.lineTo(BK.fx1 + k, y); g.stroke(); }
  // ground page (trapezoid: narrow at the gutter, wide at the front)
  g.save(); g.beginPath(); g.moveTo(BK.x0, BK.gut); g.lineTo(BK.x1, BK.gut); g.lineTo(BK.fx1, BK.front); g.lineTo(BK.fx0, BK.front); g.closePath(); g.clip();
  g.drawImage(gr, BK.fx0, BK.gut); const sh = g.createLinearGradient(0, BK.gut, 0, BK.gut + 80); sh.addColorStop(0, 'rgba(40,24,10,.35)'); sh.addColorStop(1, 'rgba(40,24,10,0)'); g.fillStyle = sh; g.fillRect(0, BK.gut, W, 80); g.restore();
  // backdrop board (rises as the book opens)
  const hb = (BK.gut - BK.top) * open; g.save(); g.beginPath(); g.rect(BK.x0, BK.gut - hb, BK.x1 - BK.x0, hb); g.clip(); g.drawImage(sky, BK.x0, BK.gut - hb, BK.x1 - BK.x0, BK.gut - BK.top);
  g.strokeStyle = 'rgba(58,42,36,.35)'; g.lineWidth = 3; g.strokeRect(BK.x0, BK.gut - hb, BK.x1 - BK.x0, hb); g.restore();
}
// lamp light and lens: warm pool, darker corners, soft blur of the far room
function lens(g) {
  const v = g.createRadialGradient(W * .4, H * .38, 300, W / 2, H / 2, 1250); v.addColorStop(0, 'rgba(255,220,160,.06)'); v.addColorStop(1, 'rgba(30,16,6,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- the frame
function draw(g, t) {
  const { s, i } = at(t), lt = t - s.t0, name = spreadOf(s), P = SPREADS[name], img = IMG[s.i];
  const fold = s.i < SC.length - 1 ? seg(t, s.t1 - .55, s.t1 - .15) : 0;   // pieces fold down before the page turns
  const pop = k => clamp(back(seg(lt, .15 + k * .07, .65 + k * .07), 1.9)) * (1 - ss(fold));
  room(g, t); book(g, name, s.i === 0 ? ss(seg(lt, 0, .9)) : 1);
  // hanging sky pieces: clouds (day) or moon + stars (night), sun on a stick rising from behind the hills (a pull-tab)
  const skyTop = BK.top;
  if (P.moon) { hang(g, .2, lt, 860, skyTop + 120, 160, 160, (g, w) => { const m = A.moon(.03); g.drawImage(m.c, -w / 2, 0, w, w); }); }
  else { hang(g, .25, lt, 170, skyTop + 70, 200, 110, (g, w, h) => { const c = cloudArt(); g.drawImage(c.c, -w / 2, 0, w, h); }); hang(g, .4, lt, 930, skyTop + 150, 170, 94, (g, w, h) => { const c = cloudArt(); g.drawImage(c.c, -w / 2, 0, w, h); }, { dir: -1 }); }
  if (P.sun) { const u = eo(seg(lt, .5, 1.4)) * (1 - ss(fold)), sun = sunArt(); const k = F * .7; g.drawImage(sun.c, 860 - sun.c.width * k / 2, BK.gut + 20 - sun.c.height * k * u * .85, sun.c.width * k, sun.c.height * k); }
  // cards on the ground page, back to front
  const L = props(name).slice().sort((a, b) => a.y - b.y);
  L.forEach((p, k) => card(g, p.it, p.x, p.y, pop(k), 1, Math.sin(t * 1.3 + k) * .012));
  // the content of this spread
  content(g, t, s, lt, img, fold);
  // page turn: a leaf sweeps right → left across the spread
  if (fold > 0 || (s.i > 0 && lt < .35)) {
    const u = fold > 0 ? ss(seg(t, s.t1 - .3, s.t1)) * .5 : .5 + ss(seg(lt, 0, .35)) * .5, x = lerp(BK.x1 + 40, BK.x0 - 400, u), wv = 260 * Math.sin(u * Math.PI);
    if (u > 0) { g.save(); const gr = g.createLinearGradient(x - wv, 0, x + 120, 0); gr.addColorStop(0, 'rgba(255,250,236,.95)'); gr.addColorStop(.7, '#efe4cc'); gr.addColorStop(1, 'rgba(120,90,60,.4)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, BK.top - 20); g.quadraticCurveTo(x - wv, (BK.top + BK.front) / 2, x, BK.front); g.lineTo(x + 140, BK.front); g.lineTo(x + 140, BK.top - 20); g.closePath(); g.fill(); g.restore(); }
  }
  lens(g);
  // narration subtitles: cream with a thick dark-brown outline and a soft shadow (no plate)
  const c = capAt(t); if (c) { g.save(); g.shadowColor = 'rgba(30,16,6,.5)'; g.shadowBlur = 12; g.shadowOffsetY = 4; g.restore(); }
}
let CLOUD, SUN; const cloudArt = () => CLOUD || (CLOUD = A.cloud(.07, 3)), sunArt = () => SUN || (SUN = A.sunOnStick(.022, .05));

function content(g, t, s, lt, img, fold) {
  const vis = 1 - ss(fold), cx = W / 2;
  if (vis <= 0) return;
  g.save(); g.globalAlpha = vis;
  const eyebrow = (y) => { if (!s.eyebrow) return; const r = hang(g, .3, lt, cx, y, 420, 70, (g, w, h) => { const p = new Path2D(); p.moveTo(-w / 2, 0); p.lineTo(w / 2, 0); p.lineTo(w / 2 - 26, h / 2); p.lineTo(w / 2, h); p.lineTo(-w / 2, h); p.lineTo(-w / 2 + 26, h / 2); p.closePath(); g.fillStyle = '#e8413a'; g.fill(p); g.strokeStyle = BROWN; g.lineWidth = 4; g.stroke(p); });
    if (r) block(g, 'eyebrow', s.eyebrow, { x: cx - 170, y: y + 12, w: 340, h: 46 }, { ...TH.label, color: '#fffdf7', align: 'center' }); };
  const T = s.type;
  if (T === 'custom') { stdBody(g, t, s, { x: SAFE.x0, y: SAFE.y0, w: SAFE.x1 - SAFE.x0, h: 1180 - SAFE.y0 }, TH); }
  else if (T === 'title' || T === 'tribute' || T === 'headline' || T === 'image') {
    // the title sign drops on strings; with a photo, the photo card pops up below it
    const sh = img ? 260 : T === 'headline' ? 300 : 330, y = SAFE.y0 + 80;
    eyebrow(SAFE.y0);
    const r = hang(g, .2, lt, cx, y, 860, sh, (g, w, h) => board(g, w, h));
    if (r) { const main = s.title || s.name || s.headline || '', sub = s.subtitle || s.note || s.sub;
      const rb = block(g, 'title', main, { x: cx - 380, y: y + 30, w: 760, h: sub ? sh - 140 : sh - 70 }, { ...TH.title, size: img ? 76 : 96, align: 'center', valign: sub ? 'bottom' : 'middle' });
      if (sub) block(g, 'sub', sub, { x: cx - 380, y: y + sh - 104, w: 760, h: 72 }, { ...TH.body, size: 42, align: 'center', valign: 'middle' }); }
    if (img) { const u = clamp(back(seg(lt, .5, 1), 1.8)), R = { x: 190, y: 640, w: 700, h: 420 }; g.save(); g.translate(0, R.y + R.h); g.scale(1, u); g.translate(0, -R.y - R.h);
      const p = new Path2D(); p.rect(R.x, R.y, R.w, R.h); g.save(); g.lineJoin = 'round'; g.shadowColor = 'rgba(40,24,10,.35)'; g.shadowBlur = 20; g.shadowOffsetY = 12; g.strokeStyle = '#fffdf7'; g.lineWidth = 34; g.stroke(p); g.restore();
      g.save(); g.clip(p); cover(g, img, R.x, R.y, R.w, R.h, 1.03 + lt * .008); g.globalAlpha = .35; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(R.x, R.y, R.w, R.h); g.restore(); g.strokeStyle = BROWN; g.lineWidth = 4; g.strokeRect(R.x - 17, R.y - 17, R.w + 34, R.h + 34);
      g.fillStyle = 'rgba(255,240,200,.75)'; for (const [tx, ty] of [[R.x - 10, R.y - 20], [R.x + R.w - 80, R.y - 20]]) g.fillRect(tx, ty, 90, 34); g.restore();
      reg('photo', '[photo]', { x0: R.x - 20, y0: R.y - 20, x1: R.x + R.w + 20, y1: R.y + R.h + 20 }); }
  } else if (T === 'counter') {
    // pull-tab slats: each number is printed on paper slats that flip over (like a flip board) when the tab is pulled
    eyebrow(SAFE.y0); const it = s.items || [], n = Math.max(1, it.length), rowH = Math.min(420, (1160 - SAFE.y0 - 90) / n);
    if (s.headline) block(g, 'hd', s.headline, { x: SAFE.x0, y: SAFE.y0 + 80, w: SAFE.x1 - SAFE.x0, h: 90 }, { ...TH.title, size: 70, color: '#fffdf7', stroke: BROWN, strokeW: 10, align: 'center' });
    it.forEach((x, k) => {
      const y = SAFE.y0 + (s.headline ? 190 : 100) + k * rowH, t0 = .35 + k * .5, flip = seg(lt, t0 + .2, t0 + .9), u = clamp(back(seg(lt, t0, t0 + .45), 1.8));
      if (u <= 0) return; g.save(); g.translate(cx, y); g.scale(1, u);
      board(g, 840, rowH - 40, '#fff1d6'); g.restore();
      // the slat: its scale flips once per digit change
      const num = `${x.prefix || ''}${countUp(x.value, flip)}${x.suffix || ''}`, ph = (flip * 6) % 1, sq = flip < 1 ? Math.abs(Math.cos(ph * Math.PI)) : 1;
      g.save(); g.translate(cx, y + (rowH - 40) * .42); g.scale(1, Math.max(.15, sq)); g.translate(-cx, -(y + (rowH - 40) * .42));
      block(g, 'num' + k, num, { x: cx - 380, y: y + 20, w: 760, h: (rowH - 40) * .62 }, { ...TH.num, color: k % 2 ? '#3fa1de' : '#e8413a', align: 'center', valign: 'middle' }); g.restore();
      if (x.label) block(g, 'lab' + k, x.label, { x: cx - 380, y: y + (rowH - 40) * .7, w: 760, h: (rowH - 40) * .24 }, { ...TH.label, align: 'center' });
      // the pull-tab sticking out at the right
      g.fillStyle = '#ffd23f'; g.strokeStyle = BROWN; g.lineWidth = 4; const tx = cx + 430 + (1 - flip) * 30; g.beginPath(); g.roundRect(tx, y + rowH * .3, 70, 60, 14); g.fill(); g.stroke();
    });
  } else if (T === 'quote') {
    // a speech bubble that types itself on, from a little paper megaphone-sign on the ground
    eyebrow(SAFE.y0); const tail = { x: 300, y: 1250 }, B = { x: 90, y: SAFE.y0 + 90, w: 900, h: 760 }, u = clamp(back(seg(lt, .3, .7), 2));
    if (u > 0) { g.save(); g.translate(B.x + B.w * .3, B.y + B.h); g.scale(u, u); g.translate(-B.x - B.w * .3, -B.y - B.h); bubble(g, B.x, B.y, B.w, B.h, tail);
      const full = `“${s.text}”`, n = Math.floor(full.length * clamp((lt - .6) / Math.max(1, full.length / 28))), shown = full.slice(0, Math.max(1, n));
      const f = fit(g, full, B.w - 140, B.h - (s.source ? 220 : 150), { ...TH.quote });   // fit the whole quote so lines don't jump while typing
      block(g, 'quote', shown, { x: B.x + 70, y: B.y + 60, w: B.w - 140, h: B.h - (s.source ? 220 : 150) }, { ...TH.quote, size: f.size, min: f.size, align: 'center', valign: 'middle' });
      reg('quote-full', full, { x0: B.x + 70, y0: B.y + 60, x1: B.x + B.w - 70, y1: B.y + B.h - 150 }, { layer: 3, over: !!f.over });
      if (s.source) block(g, 'src', '— ' + s.source, { x: B.x + 70, y: B.y + B.h - 140, w: B.w - 140, h: 70 }, { ...TH.label, align: 'center' }); g.restore(); }
  } else if (T === 'list') {
    // a headline sign, then one hanging tag per point, dropping in turn
    eyebrow(SAFE.y0); const y0 = SAFE.y0 + 80;
    const r = hang(g, .2, lt, cx, y0, 860, 190, (g, w, h) => board(g, w, h)); if (r) block(g, 'hd', s.headline || '', { x: cx - 380, y: y0 + 30, w: 760, h: 130 }, { ...TH.title, size: 80, align: 'center', valign: 'middle' });
    const it = s.items || [], rowH = Math.min(260, (1180 - y0 - 230) / Math.max(1, it.length));
    it.forEach((x, k) => { const y = y0 + 230 + k * rowH, rr = hang(g, .7 + k * .45, lt, cx + (k % 2 ? 40 : -40), y, 780, rowH - 30, (g, w, h) => board(g, w, h, k % 2 ? '#e8f6ff' : '#fff1d6'), { dir: k % 2 ? -1 : 1 });
      if (rr) { g.fillStyle = ['#e8413a', '#3fa1de', '#4fae4c', '#ffb52e'][k % 4]; g.beginPath(); g.arc(rr.x0 + 70, y + (rowH - 30) / 2, 30, 0, TAU); g.fill(); g.strokeStyle = BROWN; g.lineWidth = 4; g.stroke();
        text(g, 'n' + k, String(k + 1), rr.x0 + 70, y + (rowH - 30) / 2 + 14, { family: 'Lilita', size: 40, color: '#fffdf7', align: 'center', layer: 2 });
        block(g, 'it' + k, x, { x: rr.x0 + 120, y: y + 14, w: rr.x1 - rr.x0 - 150, h: rowH - 58 }, { ...TH.body, align: 'left', valign: 'middle' }); } });
  } else if (T === 'ayat') {
    // a paper scroll unrolls (rolled ends) with the verse; the meaning on a tag below
    const y = SAFE.y0 + 60, u = ss(seg(lt, .2, 1.1)), w = 900 * u + 60, h = 440;
    g.save(); g.translate(cx, y); board(g, w, h, '#fbf3df'); for (const sx of [-1, 1]) { g.fillStyle = '#e9d9b4'; g.strokeStyle = BROWN; g.lineWidth = 4; g.beginPath(); g.roundRect(sx * w / 2 - 28, -16, 56, h + 32, 26); g.fill(); g.stroke(); } g.restore();
    if (u > .9) block(g, 'ar', s.arabic, { x: cx - 400, y: y + 40, w: 800, h: h - 80 }, { family: 'Amiri', weight: 700, size: 100, min: 44, lh: 1.6, color: '#4a2c16', align: 'center', valign: 'middle' });
    const r = hang(g, 1.2, lt, cx, y + h + 60, 860, 400, (g, w, h) => board(g, w, h, '#ffffff'));
    if (r) stdBody(g, t, { ...s, type: 'quote', text: s.translation, source: s.ref }, { x: cx - 380, y: y + h + 100, w: 760, h: 320 }, TH);
  } else if (T === 'action') {
    eyebrow(SAFE.y0); const y = SAFE.y0 + 80, P = SPREADS[spreadOf(s)];
    const r = hang(g, .2, lt, cx, y, 860, 300, (g, w, h) => board(g, w, h));
    const m = actionModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: 1185, top: 760, S: 150 }), u = clamp(back(seg(lt, .2, .7), 1.8));
    g.save(); g.translate(0, 1185); g.scale(1, u); g.translate(0, -1185); g.save(); g.lineJoin = 'round'; g.shadowColor = 'rgba(40,24,10,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 8; g.strokeStyle = '#fffdf7'; g.lineWidth = 18; g.stroke(m.T.path); g.restore();
    for (const L of m.T.layers) { const col = { ground: P.hill2[0], water: '#7fc3e0', dark: '#3a2a24', structure: '#fff1d6' }[L.kind]; if (L.kind !== 'ground') { g.save(); g.lineJoin = 'round'; g.strokeStyle = '#fffdf7'; g.lineWidth = 12; g.stroke(L.path); g.restore(); } g.fillStyle = col; g.fill(L.path); g.strokeStyle = BROWN; g.lineWidth = 4; g.stroke(L.path); }
    g.restore();
    for (const f of m.figs) { g.save(); g.shadowColor = 'rgba(40,24,10,.3)'; g.shadowBlur = 8; g.shadowOffsetY = 5; drawFigure(g, f, t, KIT.look); g.restore(); }
    drawActors(g, t, { ...m, figs: [] }, KIT.look, { dotRing: '#fffdf7' });
    if (r) actionText(g, t, s, { x: cx - 380, y: y + 30, w: 760, h: 230 }, TH, m);
  } else if (T === 'clash') {
    // two rows of cut-paper figures on the page; the headline sign hangs above
    eyebrow(SAFE.y0); const y = SAFE.y0 + 80;
    const r = hang(g, .2, lt, cx, y, 860, 380, (g, w, h) => board(g, w, h));
    if (r) clashText(g, t, s, { x: cx - 380, y: y + 30, w: 760, h: 230 }, TH, y + 290);
    const m = clashModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: 1235, S: 230 });
    for (const f of m.figs) { g.save(); g.shadowColor = 'rgba(40,24,10,.3)'; g.shadowBlur = 8; g.shadowOffsetY = 6; drawFigure(g, f, t, KIT.look); g.restore(); }
    drawFx(g, m.fx, { dust: '#f3e6c8', arrow: BROWN, spark: '#ffd23f' });
  }
  g.restore();
}
function subs(g, t) {   // narration subtitles in the demo's look
  const c = capAt(t); if (!c) return;
  const o = { family: 'Fredoka', weight: 700 }, words = c.words.slice(0, c.active + 1).join(' '), full = c.words.join(' ');
  const f = fit(g, full, 900, 200, { ...o, size: 66, min: 38, maxLines: 2, lh: 1.15 });
  g.save(); g.shadowColor = 'rgba(30,16,6,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 5;
  block(g, 'caption', words, { x: 90, y: 1350, w: 900, h: 200 }, { ...o, size: f.size, min: f.size, lh: 1.15, align: 'center', valign: 'top', color: '#fff3dc', stroke: BROWN, strokeW: f.size * .22, cap: true, layer: 9 });
  g.restore();
}
await boot({ fonts: [['Lilita', 'fonts/lemo/lilita-400.woff2'], ['Lilita One', 'fonts/lemo/lilita-400.woff2'], ['Fredoka', 'fonts/lemo/fredoka-500.woff2', '500'], ['Fredoka', 'fonts/lemo/fredoka-700.woff2', '700'],
  ['Amiri', 'fonts/amiri-arabic-700-normal.woff2', '700']], draw: (g, t) => { draw(g, t); subs(g, t); } });
