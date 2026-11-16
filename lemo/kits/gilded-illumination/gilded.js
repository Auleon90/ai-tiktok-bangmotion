// Gilded Illumination — portrait driver. The painted world, gold leaf, glint/glow passes and border are the Lemo-Opuscar demo's own
// code (demo/lib.js, demo/world.js, demo/film.js — MIT); this file only frames that world in 9:16 per storyboard scene, lays our text
// on vellum plaques (as the demo's end plaque), writes captions on the demo's banderole and puts photos in a gold roundel
// (as the demo's gold glories). No demo figures are drawn; people appear only through the clash/custom scenes.
import { SAFE, at, SC, IMG, block, capAt, stdBody, boot, reg, font, fit, KIT, graded } from './kit.js';
import { clashModel, drawFigure, drawFx, clashText } from './clash.js';

// The demo's classic scripts declare their state as global let/const (W, H, FR, MK, GP, SUN…): a module reaches them by bare name.

const C = { VELL: '#efe2c4', INK: '#2a1a10', GALL: '#3b2416', VERM: '#c8321f', VERM_D: '#8e1e12', ULTRA: '#22379a', OCHRE_D: '#9a6424', VERD: '#2f6b3a' };
const TH = {
  align: 'center', rise: 14, accent: C.VERM,
  title: { family: 'Fell', weight: 400, size: 104, min: 44, lh: 1.08, color: C.INK },
  quote: { family: 'FellI', weight: 400, italic: true, size: 68, min: 34, lh: 1.2, color: C.INK },
  num: { family: 'Fell', weight: 400, size: 180, min: 60, lh: 1, color: C.VERM },
  body: { family: 'FellI', weight: 400, italic: true, size: 50, min: 28, lh: 1.25, color: C.GALL },
  label: { family: 'Fell', weight: 400, size: 34, min: 22, ls: .16, upper: true, color: C.VERM_D },
  side: { family: 'Fell', weight: 400, size: 44, min: 26, color: C.INK },
  arabic: { family: 'Amiri', weight: 700, color: C.INK },
  rule: (g, x, y, w, a) => { const cx = x + w / 2; g.globalAlpha = a; g.fillStyle = C.VERM; g.fillRect(cx - 140 * a, y - 1, 280 * a, 3); g.globalAlpha = 1; },
  bullet: (g, k, x, y, s, a) => { if (a <= .05) return; const p = P2(q => star8(q, x + s / 2, y + s / 2, s * .4 * a, .45)); leaf(g, p, [x, y, s, s], { lw: 1.6, nomask: true }); },
};
KIT.look = { fill: f => f.color || (f.side > 0 ? C.VERD : C.VERM), stroke: C.INK, lw: 2.2, shield: '#d39a45', weapon: C.GALL, glow: '#ffd77a', glowMode: 'lighter' };

// ---------------------------------------------------------------- camera: a 9:16 window on the 4800×2700 painted world
const VIEWS = [{ x: 3480, y: 1250, z: .8 }, { x: 1250, y: 1480, z: .9 }, { x: 2350, y: 1430, z: .86 }, { x: 4050, y: 1500, z: .9 }, { x: 760, y: 1450, z: .92 }, { x: 2900, y: 1350, z: .84 }];
function camFor(s, lt) {
  let v = VIEWS[s.i % VIEWS.length];
  if (s.type === 'ayat') v = { x: SUN.x - 640, y: 1260, z: .95 };
  if (s.type === 'clash') v = { x: 1900, y: 1700, z: 1.1 };   // framed so the meadow edge (world y ≈ 1950) sits at the battle line, y ≈ 1228
  if (s.i === 0) v = VIEWS[0];
  const z = v.z * lerp(1.04, 1, eo(seg(lt, 0, 1.6))), hw = W / 2 / z, hh = H / 2 / z;
  const x = clamp(v.x + (lt - s.d / 2) * 14, BRD + hw, WW - BRD - hw), y = clamp(v.y + (1 - eo(seg(lt, 0, 1.2))) * 60, BRD + hh, WH - BRD - hh);
  return { x, y, z, r: 0 };
}

// the demo's border, redrawn in screen space (same code, its world size swapped for the frame at half scale)
let drawBorderS = null;
function makeBorder() {
  const src = drawBorder.toString().replace(/^function drawBorder/, 'function drawBorderS').replace(/\bWW\b/g, 'BW_').replace(/\bWH\b/g, 'BH_');
  drawBorderS = (0, eval)(`(function(){ const BW_ = ${W * 2}, BH_ = ${H * 2}; return ${src}; })()`);
}
// a vellum plaque (the demo's closing cartouche, in screen space): speckled vellum, rim shade, ink, a gold fillet inset
function plaque(g, x, y, w, h, u) {
  if (u <= 0) return; g.save(); g.globalAlpha = clamp(u * 1.4); g.translate(x + w / 2, y + h / 2); g.scale(1, lerp(.85, 1, eo(u))); g.translate(-x - w / 2, -y - h / 2);
  const n = 26, p = P2(q => { q.moveTo(x + n, y); q.lineTo(x + w - n, y); q.lineTo(x + w, y + n); q.lineTo(x + w, y + h - n); q.lineTo(x + w - n, y + h); q.lineTo(x + n, y + h); q.lineTo(x, y + h - n); q.lineTo(x, y + n); q.closePath(); });
  g.fillStyle = C.VELL; g.fill(p); g.save(); g.clip(p); g.globalAlpha *= .5; g.fillStyle = g.createPattern(SPKC, 'repeat'); g.fillRect(x, y, w, h); g.restore();
  rimShade(g, p, '#c9b386', 12); setZoom(1); ink(g, p, 2.4);
  const f = P2(q => q.rect(x + 16, y + 16, w - 32, h - 32)); leafCord(g, f, 5, { ink: 1.5, nomask: true });
  g.restore();
}
function roundel(g, img, cx, cy, R, u, lt) {   // a photo inside a gold glory with a ring of vermilion dots
  if (u <= 0) return; const r = R * popS(u, 1.2);
  const ring = P2(q => { q.arc(cx, cy, r + 26, 0, TAU); q.arc(cx, cy, r, 0, TAU, true); });
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  const s = Math.max(2 * r / img.width, 2 * r / img.height) * (1.04 + lt * .01); g.drawImage(img, cx - img.width * s / 2, cy - img.height * s / 2, img.width * s, img.height * s); g.restore();
  setZoom(1); leaf(g, ring, [cx - r - 30, cy - r - 30, 2 * r + 60, 2 * r + 60], { lw: 2.4 });
  g.fillStyle = C.VERM; for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * (r + 13), cy + Math.sin(a) * (r + 13), 4.5, 0, TAU); g.fill(); }
}
// the demo's banderole for captions: vellum ribbon with forked tails, ink, the spoken word in vermilion
function banderole(g, t) {
  const c = capAt(t); if (!c) return;
  const open = eo(clamp(c.lt / .35)), cy = 1440, h = 112, o = { family: 'FellI', italic: true, weight: 400 };
  const f = fit(g, c.words.join(' '), 760, h - 26, { ...o, size: 64, min: 34, maxLines: 1 }); font(g, f.size, o);
  const hw = (Math.max(260, f.widths[0]) / 2 + 60) * open, cx = W / 2;
  for (const sd of [-1, 1]) { const ex = cx + sd * hw, tail = P2(q => { q.moveTo(ex - sd * 6, cy - h / 2 + 22); q.lineTo(ex + sd * 62, cy - h / 2 + 34); q.lineTo(ex + sd * 38, cy + 4); q.lineTo(ex + sd * 70, cy + h / 2 + 22); q.lineTo(ex - sd * 6, cy + h / 2 - 6); q.closePath(); });
    g.fillStyle = '#d8c69c'; g.fill(tail); rimShade(g, tail, '#a8926a', 8); g.strokeStyle = C.INK; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(tail); }
  const band = P2(q => { q.moveTo(cx - hw, cy - h / 2); q.bezierCurveTo(cx - hw * .4, cy - h / 2 - 10, cx + hw * .4, cy - h / 2 + 9, cx + hw, cy - h / 2); q.lineTo(cx + hw, cy + h / 2);
    q.bezierCurveTo(cx + hw * .4, cy + h / 2 + 9, cx - hw * .4, cy + h / 2 - 10, cx - hw, cy + h / 2); q.closePath(); });
  g.fillStyle = C.VELL; g.fill(band); g.save(); g.clip(band); g.globalAlpha = .5; g.fillStyle = g.createPattern(SPKC, 'repeat'); g.fillRect(cx - hw, cy - h, hw * 2, h * 2); g.restore();
  rimShade(g, band, '#c9b386', 9); g.strokeStyle = C.INK; g.lineWidth = 3; g.stroke(band);
  g.save(); g.clip(band); font(g, f.size, o); g.textBaseline = 'alphabetic'; const sp = g.measureText(' ').width; let x = cx - f.widths[0] / 2;
  c.words.forEach((w, k) => { const ww = g.measureText(w).width; if (k <= c.active) { g.fillStyle = k === c.active ? C.VERM : '#4a2c16'; g.fillText(w, x, cy + f.size * .32); } x += ww + sp; }); g.restore();
  reg('caption', c.words.join(' '), { x0: cx - f.widths[0] / 2, y0: cy - f.size * .6, x1: cx + f.widths[0] / 2, y1: cy + f.size * .45 }, { cap: true, layer: 9 });
}

// ---------------------------------------------------------------- one frame of the world (the demo's render(), driven by our camera)
function world(t, s, lt) {
  const c = camFor(s, lt);
  resetCtx(FRg); MCg.setTransform(1, 0, 0, 1, 0, 0); MCg.clearRect(0, 0, W, H);
  MK = { g: MCg, pre: new DOMMatrix(), col: '#fff' };
  const M = camMatrix(c); setZoom(c.z); FRg.setTransform(M);
  drawWorld(FRg, { dim: 0, sun: { dim: 0, glory: 0 }, t, girls: [] });
  OCCd = null;
  FRg.setTransform(1, 0, 0, 1, 0, 0); FRg.save(); FRg.globalCompositeOperation = 'multiply'; FRg.globalAlpha = .14; FRg.fillStyle = FRg.createPattern(GRAINC, 'repeat'); FRg.fillRect(0, 0, W, H); FRg.restore();
  // the border band, in screen space (leaf marked as screen leaf for the glint pass)
  const nGP = GP.length; MK.col = '#f00'; FRg.save(); FRg.setTransform(.5, 0, 0, .5, 0, 0); setZoom(.5); drawBorderS(FRg, 1); FRg.restore(); GP.length = nGP; MK.col = '#fff'; setZoom(c.z);
  MK = null;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(FR, 0, 0);
  // light: a raking band sweeps across at each scene start, plus the sun's own warmth (gold catches, squares flash)
  const sw = seg(lt, .2, 2.2), bx = lerp(c.x - 900, c.x + 900, ss(sw));
  const lights = [{ type: 'b', x: bx, y: c.y, nx: .7, ny: -.7, w: 160, a: .9 * Math.sin(Math.PI * sw) }, { type: 'r', x: SUN.x, y: SUN.y, r: 700, a: .55 + .1 * Math.sin(t * 1.3) }];
  glintPass(M, lights, .3); glowPass(.6); flashes(M, lights);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const v = ctx.createRadialGradient(W * .5, H * .45, H * .42, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,20,5,.24)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  return { c, M };
}

function draw(g, t) {
  const { s } = at(t), lt = t - s.t0, img = IMG[s.i], u = seg(lt, .15, .6);
  const { M } = world(t, s, lt);
  g.setTransform(1, 0, 0, 1, 0, 0); setZoom(1);
  const X = SAFE.x0 + 6, Wd = SAFE.x1 - SAFE.x0 - 12;
  if (s.eyebrow && s.type !== 'custom') { plaque(g, W / 2 - 230, SAFE.y0 - 4, 460, 64, u); block(g, 'eyebrow', s.eyebrow, { x: W / 2 - 200, y: SAFE.y0 + 8, w: 400, h: 40 }, { ...TH.label, align: 'center', alpha: u }); }
  const top = SAFE.y0 + 84;
  if (s.type === 'custom') stdBody(g, t, s, { x: SAFE.x0, y: SAFE.y0, w: SAFE.x1 - SAFE.x0, h: SAFE.y1 - SAFE.y0 }, TH);
  else if (s.type === 'ayat') {   // the verse written in gold on the lapis sky; the meaning on a plaque
    block(g, 'ar', s.arabic, { x: X, y: top + 10, w: Wd, h: 440 }, { family: 'Amiri', weight: 700, size: 110, min: 46, lh: 1.6, align: 'center', valign: 'middle', stroke: C.INK, strokeW: 6,
      paint: (g, ln, x, y, sz) => { g.save(); g.fillStyle = g.createPattern(GOLDC, 'repeat'); g.fillText(ln, x, y); g.globalAlpha = .55; g.fillStyle = '#ffe9a8'; g.fillText(ln, x, y); g.restore(); },
      reveal: () => ({ a: eo(seg(lt, .2, 1)) }) });
    plaque(g, X, top + 480, Wd, 520, seg(lt, .6, 1));
    stdBody(g, t, { ...s, type: 'quote', text: s.translation, source: s.ref }, { x: X + 50, y: top + 530, w: Wd - 100, h: 420 }, TH);
  } else if (s.type === 'clash') {
    const gy = new DOMPoint(W / 2, 0).matrixTransform(M.inverse()), meadow = new DOMPoint(gy.x, topAt(gy.x)).matrixTransform(M).y;
    const m = clashModel(s, t, { x0: SAFE.x0, x1: SAFE.x1, ground: 1228, S: 210 });
    for (const f of m.figs) drawFigure(g, f, t, KIT.look); drawFx(g, m.fx, { dust: '#d8c69c', arrow: C.INK, spark: '#e8bd72' });
    plaque(g, X, top, Wd, 400, u);
    clashText(g, t, s, { x: X + 46, y: top + 40, w: Wd - 92, h: 250 }, { ...TH, title: { ...TH.title, size: 90 }, side: { ...TH.side, fixed: true } }, top + 306);
  } else if (img) {
    roundel(g, img, W / 2, 958, 254, u, lt); reg('photo', '[photo]', { x0: W / 2 - 284, y0: 674, x1: W / 2 + 284, y1: 1242 });
    plaque(g, X, top, Wd, 360, u);
    const s2 = s.type === 'image' ? { ...s, type: 'headline' } : s;
    stdBody(g, t, s2, { x: X + 46, y: top + 30, w: Wd - 92, h: 300 }, { ...TH, title: { ...TH.title, size: 74 }, num: { ...TH.num, size: 110 } });
  } else {
    // text plaque sized to the content type; the painting stays visible below it
    const h = { title: 440, tribute: 440, headline: 520, quote: 620, counter: 820, list: 820 }[s.type] || 560;
    plaque(g, X, top, Wd, h, u);
    stdBody(g, t, s, { x: X + 50, y: top + 50, w: Wd - 100, h: h - 100 }, TH);
  }
  // scene change: the demo's cloud wipe passes down the frame
  const nx = SC[s.i + 1]; if (nx && t > nx.t0 - .45) { g.save(); setZoom(1); drawCloudWipe(g, seg(t, nx.t0 - .45, nx.t0 + .35) * .55); g.restore(); }
  const pv = SC[s.i - 1]; if (pv && lt < .35) { g.save(); setZoom(1); drawCloudWipe(g, .55 * (.45 / .8) + seg(lt, 0, .35) * .45); g.restore(); }
  banderole(g, t);
}

// ---------------------------------------------------------------- init (the demo's init, minus its own film)
function initDemo() {
  GOLDC = makeGold(); GOLDF = makeGoldFine(512, 3, 1); GOLDFF = makeGoldFine(1024, 9, 1.6); SPKC = makeSpk(); GRAINC = makeGrain(); PAINTC = makePaint();
  buildWorld(); buildWalk(); buildOverlays();
  FR = cnv(W, H); FRg = FR.getContext('2d'); OCC = cnv(W, H); OCCg = OCC.getContext('2d', { willReadFrequently: true }); MC = cnv(W, H); MCg = MC.getContext('2d', { willReadFrequently: true });
}
await boot({ fonts: [['Fell', 'fonts/lemo/imfell-400.woff2'], ['FellI', 'fonts/lemo/imfell-400i.woff2', '400', 'italic'], ['Amiri', 'fonts/amiri-arabic-700-normal.woff2', '700']],
  draw: (g, t) => { if (!drawBorderS) { initDemo(); makeBorder(); } draw(g, t); } });
