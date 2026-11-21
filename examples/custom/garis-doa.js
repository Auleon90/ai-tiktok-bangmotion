// Custom scene "garis doa": a glowing life line that FALLS into the lowest point, PRAYS there (a beam of light comes down)
// and is LIFTED. Every beat is synced to the spoken word that names it (K.WORDS), and a three-step bar
// (JATUH · BERDOA · DIANGKAT) lights the current step, so the viewer learns the pattern scene after scene.
// Storyboard fields:
//   "curve": "fall" (hook) | "story" (one prophet) | "pattern" (the lesson: one big V, then one small V per prophet)
//   "headline" (fall), "eyebrow", "name" (label riding the light), "arabic", "translation", "ref"
//   "beats": { "fall": word, "bottom": word, "doa": word, "rise": word, "multi": word }   (first word starting with it; optional)
//   "context": label at the lowest point, "fx": "dark" | "dim" | "sea" | "fire"  (what the lowest point looks like)
const GLOW = '#ffcd82', CORE = '#fff6e2', DIM = 'rgba(160,175,215,.55)';

function vPath(x0, x1, yTop, yLow, n = 90) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const u = k / n, d = Math.abs(u - .5) * 2; pts.push([x0 + (x1 - x0) * u, yLow - (yLow - yTop) * Math.pow(d, 1.6)]); }
  return pts;
}
const at = (pts, p) => pts[Math.max(0, Math.min(pts.length - 1, Math.round((pts.length - 1) * p)))];
function stroke(g, pts, p0, p1, w, col, blur) {
  const a = Math.round((pts.length - 1) * p0), b = Math.round((pts.length - 1) * p1); if (b <= a) return;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = blur;
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[a][0], pts[a][1]); for (let k = a + 1; k <= b; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); g.restore();
}
// the line: the fallen part is a cooler, dimmer trail; the lifted part burns gold
function line(g, pts, p, s = 1) {
  if (p <= 0) return;
  const pf = Math.min(p, .5);
  stroke(g, pts, 0, pf, 14 * s, 'rgba(150,170,230,.28)', 30 * s); stroke(g, pts, 0, pf, 4.5 * s, 'rgba(225,232,255,.9)', 10 * s);
  if (p > .5) { stroke(g, pts, .5, p, 22 * s, 'rgba(255,190,110,.45)', 50 * s); stroke(g, pts, .5, p, 6 * s, CORE, 16 * s); }
}
function orb(g, x, y, r, a = 1) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, 'rgba(255,252,240,1)'); gr.addColorStop(.22, 'rgba(255,215,150,.8)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}
function rings(g, x, y, t, a, s = 1, col = GLOW) {
  if (a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const u = (t * .7 + k / 3) % 1; g.globalAlpha = a * (1 - u) * .85; g.strokeStyle = col; g.lineWidth = 3 * s;
    g.beginPath(); g.ellipse(x, y, (26 + u * 120) * s, (10 + u * 40) * s, 0, 0, Math.PI * 2); g.stroke(); }
  g.restore();
}
// the answer: a beam of light comes DOWN from above onto the point
function beam(g, x, yFrom, y, grow, a) {
  if (a <= 0 || grow <= 0) return; const yEnd = yFrom + (y - yFrom) * grow;
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(0, yFrom, 0, yEnd); gr.addColorStop(0, 'rgba(255,225,170,0)'); gr.addColorStop(1, `rgba(255,232,185,${.85 * a})`);
  g.fillStyle = gr; g.fillRect(x - 5, yFrom, 10, yEnd - yFrom);
  g.fillStyle = `rgba(255,225,170,${.13 * a})`; g.beginPath(); g.moveTo(x - 16, yFrom); g.lineTo(x + 16, yFrom); g.lineTo(x + 70, yEnd); g.lineTo(x - 70, yEnd); g.fill();
  g.restore(); if (grow > .98) orb(g, x, y, 70, a);
}
function tag(g, K, id, str, x, y, o) {   // a label on a small dark paper tag so it reads over the light sheets
  const a = o.alpha ?? 1; if (a <= .02 || !str) return; const sz = o.size || 30; g.save(); g.font = `${o.weight || 500} ${sz}px ${o.family || 'serif'}`;
  const w = g.measureText(String(str).toUpperCase()).width * (1 + (o.ls || 0)) + 36, al = o.align || 'left', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w + 18 : x - 18;
  g.globalAlpha = a * .85; g.fillStyle = o.bg || '#0d0b12'; g.fillRect(x0, y - sz * 1.05, w, sz * 1.5); g.restore();
  g.save(); g.globalAlpha = a; K.text(g, id, str, x, y, { ...o, size: sz }); g.restore();
}
function strip(g, x, y, w, h, col = '#e6d3ad') { g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 22; g.shadowOffsetY = 10; g.fillStyle = col; g.fillRect(x, y, w, h); g.restore(); }

// time (scene-local s) of the first spoken word in this scene that starts with `key`
function beat(c, key, dflt) {
  if (!key) return dflt; const t0 = c.t - c.lt, k = key.toLowerCase();
  const w = c.K.WORDS.find(w => w.t0 >= t0 - .05 && w.t0 < t0 + c.d && w.text.toLowerCase().replace(/[^a-zÀ-ɏ-]/g, '').startsWith(k));
  return w ? w.t0 - t0 : dflt;
}
// three-step bar: JATUH · BERDOA · DIANGKAT, the current one lit
function steps(g, c, y, active, a = 1, big = false) {
  const { K, theme: th, box } = c, names = ['JATUH', 'BERDOA', 'DIANGKAT'], gap = big ? 18 : 16, w = Math.min(big ? 300 : 240, (box.w - 40 - 2 * gap) / 3), h = big ? 96 : 62, x0 = box.x + (box.w - (3 * w + 2 * gap)) / 2;
  names.forEach((n, k) => {
    const on = active[k] || 0, x = x0 + k * (w + gap);
    g.save(); g.globalAlpha = a * (.55 + .45 * on); g.fillStyle = on > .5 ? '#e9c27a' : '#14121c'; if (on > .5) { g.shadowColor = GLOW; g.shadowBlur = 30 * on; }
    g.fillRect(x, y, w, h); g.restore();
    g.save(); g.globalAlpha = a; K.block(g, 'step' + k, n, { x: x + 8, y: y + 6, w: w - 16, h: h - 12 },
      { ...th.label, size: big ? 46 : 32, min: 18, ls: big ? .08 : .12, align: 'center', valign: 'middle', color: on > .5 ? '#2a1a10' : '#cdbf9f', alpha: a }); g.restore();
  });
}
// what the lowest point looks like for each story
function lowFx(g, c, fx, x, y, a, saved) {
  const { K, t } = c; if (a <= 0) return;
  g.save();
  if (fx === 'dark') {   // three layers of darkness closing round the point (night, sea, the fish)
    for (let k = 0; k < 3; k++) { g.globalAlpha = a * (.5 - k * .1) * (1 - saved); g.strokeStyle = '#8da0d8'; g.lineWidth = 3; g.setLineDash([14, 10]); g.lineDashOffset = t * (20 + k * 12) * (k % 2 ? -1 : 1);
      g.beginPath(); g.ellipse(x, y, 90 + k * 55, 40 + k * 26, 0, 0, Math.PI * 2); g.stroke(); }
  } else if (fx === 'sea') {   // two walls of water at the sides; they part when the line is lifted
    const open = saved * 120;
    for (const sd of [-1, 1]) { const cx = x + sd * (150 + open);
      g.globalAlpha = a * .75; const gr = g.createLinearGradient(0, y - 230, 0, y + 30); gr.addColorStop(0, 'rgba(120,170,230,.0)'); gr.addColorStop(1, 'rgba(120,170,230,.7)'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(cx - sd * 40, y + 30); for (let k = 0; k <= 20; k++) { const v = k / 20; g.lineTo(cx + sd * (Math.sin(v * 9 + t * 3) * 14 + v * 60), y + 30 - v * 260); } g.lineTo(cx + sd * 140, y - 230); g.lineTo(cx + sd * 140, y + 30); g.fill(); }
  } else if (fx === 'fire') {   // sparks rising; they turn cool when the fire is made cool
    for (let k = 0; k < 46; k++) { const u = (t * (.5 + K.hash(k, 1) * .5) + K.hash(k, 2)) % 1, xx = x + (K.hash(k, 3) - .5) * 220 + Math.sin(u * 6 + k) * 18, yy = y + 20 - u * 300;
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * (1 - u) * .9; g.fillStyle = saved > .5 ? '#9fe3e0' : (k % 3 ? '#ffb24a' : '#ff6a2a'); g.beginPath(); g.arc(xx, yy, 3 + K.hash(k, 4) * 5, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = a * .5 * (1 - saved * .6); const gr = g.createRadialGradient(x, y, 0, x, y, 200); gr.addColorStop(0, saved > .5 ? 'rgba(140,225,220,.7)' : 'rgba(255,120,40,.7)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(x - 200, y - 200, 400, 400);
  } else {   // dim: a slow grey weight pressing on the point
    for (let k = 0; k < 2; k++) { const u = (t * .25 + k / 2) % 1; g.globalAlpha = a * (1 - u) * .5; g.strokeStyle = '#a7a3b8'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 50 + u * 160, 18 + u * 50, 0, 0, Math.PI * 2); g.stroke(); }
  }
  g.restore();
}
// the arc of one story on a V: fall (0 → .5) until `tb`, hold + pray, rise (.5 → 1) from `tr`
function arc(c, tf, tb, tr) {
  const { K, lt, d } = c, fall = .5 * K.eo(K.clamp((lt - tf) / Math.max(.4, tb - tf))), te = Math.min(tr + 1.8, d - .35), rise = .5 * K.eio(K.clamp((lt - tr) / Math.max(.4, te - tr)));
  return { p: fall + rise, fall, rise: rise * 2 };
}

// an ayat without a box: a feathered shade (no edges) so it reads on light skies, thin gold rules with a lozenge above and
// below, and the Amiri letters in warm gold: a dark soft shadow for contrast, then a glow
function verse(g, c, id, text, b, a, glow = .5, size = 80) {
  const { K } = c; if (a <= 0) return null; const mx = b.x + b.w / 2, my = b.y + b.h / 2;
  g.save(); g.globalAlpha = a; g.translate(mx, my); g.scale(1, (b.h * .9) / (b.w * .62));
  const sh = g.createRadialGradient(0, 0, 0, 0, 0, b.w * .62); sh.addColorStop(0, 'rgba(10,8,18,.62)'); sh.addColorStop(.55, 'rgba(10,8,18,.38)'); sh.addColorStop(1, 'rgba(10,8,18,0)');
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, b.w * .62, 0, Math.PI * 2); g.fill(); g.restore();
  const r = K.block(g, id, text, b, { family: 'Amiri', weight: 700, size, min: 40, lh: 1.5, align: 'center', valign: 'middle', alpha: a,
    paint: (g, ln, x, base) => {
      g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 16; g.shadowOffsetY = 3; g.fillStyle = '#ffdc96'; g.fillText(ln, x, base);
      g.shadowOffsetY = 0; g.shadowColor = GLOW; g.shadowBlur = 12 + 30 * glow; g.globalAlpha = a * (.35 + .5 * glow); g.fillStyle = '#fff0cc'; g.fillText(ln, x, base);
    } });
  const u = K.eo(K.clamp(a * 1.2)), half = Math.min(b.w * .42, (r.x1 - r.x0) / 2 + 40) * u;
  g.save(); g.globalAlpha = a * .9; g.strokeStyle = '#e9c27a'; g.fillStyle = '#e9c27a'; g.lineWidth = 2; g.shadowColor = GLOW; g.shadowBlur = 8;
  for (const y of [r.y0 - 16, r.y1 + 18]) { g.beginPath(); g.moveTo(mx - half, y); g.lineTo(mx - 14, y); g.moveTo(mx + 14, y); g.lineTo(mx + half, y); g.stroke();
    g.beginPath(); g.moveTo(mx, y - 7); g.lineTo(mx + 7, y); g.lineTo(mx, y + 7); g.lineTo(mx - 7, y); g.closePath(); g.fill(); }
  g.restore(); return r;
}

export default function (g, c) {
  const { K, theme: th, box, lt, d, s, t } = c, X = box.x + 20, Wd = box.w - 40, top = box.y + 30, cx = c.W / 2;
  const B = s.beats || {};

  // ---------------------------------------------------------------- the hook: you are falling
  if (s.curve === 'fall' || s.curve === 'reply') {
    if (s.curve === 'reply') {   // a reply to a viewer's comment: the comment sticker is fully readable on frame 0
      const bh = 168; g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 26; g.shadowOffsetY = 10; g.fillStyle = '#fbf6ec';
      g.beginPath(); g.roundRect(X, top, Wd, bh, 28); g.fill(); g.restore();
      g.fillStyle = '#c9b48f'; g.beginPath(); g.arc(X + 60, top + 58, 30, 0, Math.PI * 2); g.fill();
      K.block(g, 'who', s.who || 'Membalas komentar penonton', { x: X + 108, y: top + 30, w: Wd - 140, h: 40 }, { ...th.label, size: 28, min: 18, color: '#8a6a44' });
      K.block(g, 'comment', s.comment, { x: X + 108, y: top + 72, w: Wd - 140, h: 76 }, { ...th.title, size: 56, min: 32, color: '#20140c', valign: 'middle' });
      strip(g, X + 60, top + bh + 26, Wd - 120, 110);
      K.block(g, 'main', s.headline, { x: X + 90, y: top + bh + 38, w: Wd - 180, h: 86 }, { ...th.title, size: 62, min: 36, align: 'center', valign: 'middle' });
    } else {
      strip(g, X, top, Wd, 230);
      K.block(g, 'main', s.headline, { x: X + 40, y: top + 24, w: Wd - 80, h: 182 }, { ...th.title, size: 84, min: 44, align: 'center', valign: 'middle' });
    }
    const yTop = 600, yLow = 1060, pts = vPath(X - 30, X + Wd + 30, yTop, yLow, 120);
    const tb = beat(c, B.bottom || 'terendah', d * .55), p = .5 * K.eo(K.clamp(.25 + .75 * lt / tb));   // already falling on frame 0
    const head = at(pts, p), low = K.seg(lt, tb - .2, tb + .3);
    lowFx(g, c, 'dim', cx, yLow, low, 0); line(g, pts, p); orb(g, head[0], head[1], 50);
    tag(g, K, 'you', 'KAMU', head[0] + 34, head[1] - 26, { ...th.label, size: 30, color: '#f2dcae' });
    tag(g, K, 'low', 'TITIK TERENDAH', cx, yLow + 70, { ...th.label, size: 32, color: '#ffe2a8', align: 'center', alpha: low });
    // a faint dotted promise of the way up: the story is not over
    const hint = K.seg(lt, d * .7, d * .95);
    if (hint > 0) { g.save(); g.setLineDash([4, 16]); g.globalAlpha = hint * .8; g.strokeStyle = GLOW; g.lineWidth = 4; g.beginPath(); pts.slice(60).forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore();
      tag(g, K, 'q', '?', X + Wd - 40, yTop + 40, { ...th.label, size: 44, color: '#ffe2a8', align: 'center', alpha: hint }); }
    steps(g, c, 1180, [1, 0, 0], 1);
    return;
  }

  // ---------------------------------------------------------------- the lesson: one big V on the words, then one small V per prophet
  if (s.curve === 'pattern') {
    const tF = beat(c, B.fall || 'jatuh', d * .12), tD = beat(c, B.doa || 'berdoa', d * .2), tR = beat(c, B.rise || 'mengangkat', d * .32), tM = beat(c, B.multi || 'begitulah', d * .55);
    const on = [K.seg(lt, tF - .1, tF + .15), K.seg(lt, tD - .1, tD + .15), K.seg(lt, tR - .1, tR + .15)];
    const multi = K.seg(lt, tM - .3, tM + .5);
    // top: the three steps, big, lit as they are spoken; then the verse that makes it a promise
    steps(g, c, top, on, 1, true);
    const ya = top + 130;
    if (multi > 0) { verse(g, c, 'ar', s.arabic, { x: X + 40, y: ya + 24, w: Wd - 80, h: 130 }, multi, .6, 80);
      K.block(g, 'ref', s.ref, { x: X + 40, y: ya + 182, w: Wd - 80, h: 40 }, { ...th.label, color: '#f0d7a4', align: 'center', alpha: multi }); }
    // one big V acting the three words
    const big = 1 - multi;
    if (big > 0) {
      g.save(); g.globalAlpha = big;
      const yTop = 560, yLow = 1080, pts = vPath(X, X + Wd, yTop, yLow, 120), A = arc(c, tF, tD, tR), head = at(pts, A.p);
      lowFx(g, c, 'dim', cx, yLow, on[0] * (1 - A.rise), 0);
      beam(g, cx, 380, yLow, K.eo(K.seg(lt, tD, tD + .5)), on[1] * (1 - A.rise * .7));
      rings(g, cx, yLow, t, on[1] * (1 - A.rise));
      line(g, pts, Math.max(A.p, .02)); orb(g, head[0], head[1], 50 + 40 * A.rise);
      if (A.rise > .95) rings(g, head[0], head[1], t, 1);
      g.restore();
    }
    // then the same shape four times: it is a pattern
    if (multi > 0) {
      const names = s.labels || ['YUNUS', 'AYYUB', 'MUSA', 'IBRAHIM'], n = names.length, cw = Wd / n, yTop = 700, yLow = 1030;
      names.forEach((nm, k) => {
        const a0 = tM + .2 + k * .55, p = K.eo(K.seg(lt, a0, a0 + 1.1)), x = X + cw * (k + .5); if (p <= 0) return;
        const pts = vPath(x - cw * .42, x + cw * .42, yTop, yLow, 60);
        beam(g, x, yTop - 40, yLow, K.eo(K.seg(lt, a0 + .35, a0 + .6)), (1 - K.seg(lt, a0 + 1, a0 + 1.6) * .6));
        line(g, pts, p, .7); rings(g, x, yLow, t + k, K.seg(lt, a0 + .3, a0 + .5), .5);
        if (p > .99) orb(g, pts[pts.length - 1][0], pts[pts.length - 1][1], 36);
        tag(g, K, 'n' + k, nm, x, yLow + 70, { ...th.label, size: 28, color: '#f2dcae', align: 'center', alpha: K.seg(lt, a0, a0 + .3) });
      });
    }
    steps(g, c, 1180, on, 1, false);
    return;
  }

  // ---------------------------------------------------------------- the end: the promise, and the line already lifted
  if (s.curve === 'end') {
    if (s.eyebrow) { strip(g, cx - 210, top - 10, 420, 56); K.block(g, 'eyebrow', s.eyebrow, { x: cx - 195, y: top - 2, w: 390, h: 40 }, { ...th.label, align: 'center', valign: 'middle', alpha: K.seg(lt, 0, .3) }); }
    const ya = top + 66; verse(g, c, 'ar', s.arabic, { x: X + 30, y: ya + 30, w: Wd - 60, h: 170 }, K.seg(lt, .1, .6), .8, 96);
    const ys = ya + 268, us = K.seg(lt, .4, .9);
    if (us > 0) { strip(g, X, ys, Wd * K.eo(us), 160);
      K.block(g, 'tr', `“${s.translation}”`, { x: X + 30, y: ys + 10, w: Wd - 60, h: 112 }, { ...th.quote, size: 48, min: 30, align: 'center', valign: 'middle', alpha: K.seg(lt, .7, 1) });
      K.block(g, 'ref', `— ${s.ref}`, { x: X + 36, y: ys + 124, w: Wd - 72, h: 30 }, { ...th.label, size: 24, min: 18, align: 'center', alpha: K.seg(lt, .8, 1.1) }); }
    const yTop = 820, yLow = 1070, pts = vPath(X - 10, X + Wd + 10, yTop, yLow, 120), p = .5 + .5 * K.eio(K.seg(lt, .2, 2.2)), head = at(pts, p);
    beam(g, cx, ys + 175, yLow, K.eo(K.seg(lt, 0, .4)), .5); line(g, pts, p); orb(g, head[0], head[1], 70); if (p > .99) rings(g, head[0], head[1], t, 1, .8);
    steps(g, c, 1180, [1, 1, 1], 1);
    return;
  }

  // ---------------------------------------------------------------- one prophet's story on the line
  // top: who + the doa (arabic + translation); middle: the line acting the story; bottom: the three steps
  if (s.eyebrow) { strip(g, cx - 210, top - 10, 420, 56); K.block(g, 'eyebrow', s.eyebrow, { x: cx - 195, y: top - 2, w: 390, h: 40 }, { ...th.label, align: 'center', valign: 'middle', alpha: K.seg(lt, 0, .3) }); }
  const tb = beat(c, B.bottom, d * .3), td = beat(c, B.doa, d * .45), tr = B.rise ? beat(c, B.rise, d * .78) : Math.max(td + 2.2, d * .74);
  const A = arc(c, .1, tb, tr), low = K.seg(lt, tb - .3, tb + .2), doa = K.seg(lt, td - .1, td + .3);
  // the doa card: appears when the doa is spoken (before that, only the dark slot waits)
  const ya = top + 66, ah = s.arabic ? 250 : 0, ua = K.eo(K.seg(lt, .05, .5));
  if (s.arabic) verse(g, c, 'ar', s.arabic, { x: X + 30, y: ya + 22, w: Wd - 60, h: ah - 44 }, K.seg(lt, .2, .7), doa, 76);
  const ys = ya + ah + 18, sh = s.arabic ? 160 : 230, us = K.seg(lt, .4, .9);
  if (us > 0) { strip(g, X, ys, Wd * K.eo(us), sh);
    K.block(g, 'tr', `“${s.translation}”`, { x: X + 30, y: ys + 10, w: Wd - 60, h: sh - 48 }, { ...th.quote, size: s.arabic ? 48 : 54, min: 30, align: 'center', valign: 'middle', alpha: K.seg(lt, .7, 1) });
    K.block(g, 'ref', `— ${s.ref}`, { x: X + 36, y: ys + sh - 36, w: Wd - 72, h: 30 }, { ...th.label, size: 24, min: 18, align: 'center', alpha: K.seg(lt, .8, 1.1) }); }
  // the line
  const yTop = 820, yLow = 1070, pts = vPath(X - 10, X + Wd + 10, yTop, yLow, 120), head = at(pts, A.p);
  lowFx(g, c, s.fx, cx, yLow, low, A.rise);
  beam(g, cx, ys + sh + 10, yLow, K.eo(K.seg(lt, td, td + .5)), doa * (1 - A.rise * .8));
  rings(g, cx, yLow, t, Math.max(low * .5, doa) * (1 - A.rise));
  line(g, pts, Math.max(A.p, .02)); orb(g, head[0], head[1], 46 + 34 * A.rise);
  if (A.rise > .95) rings(g, head[0], head[1], t, 1, .8);
  // labels: the name rides the light; the lowest point is named; DOA when prayed; the end of the rise is named
  const name = A.rise > 0 ? 0 : 1;
  tag(g, K, 'name', s.name, head[0] + (head[0] < cx - 40 ? 34 : -34), head[1] - 30, { ...th.label, size: 28, color: '#f2dcae', align: head[0] < cx - 40 ? 'left' : 'right', alpha: name * K.seg(lt, .1, .4) });
  tag(g, K, 'ctx', s.context, cx, yLow + 70, { ...th.label, size: 30, color: '#f2dcae', align: 'center', alpha: low * (1 - doa) });
  tag(g, K, 'doa', 'DOA', cx, yLow + 70, { ...th.label, size: 34, color: '#2a1a10', bg: '#e9c27a', align: 'center', alpha: doa * (1 - A.rise) });
  tag(g, K, 'up', s.saved || 'DISELAMATKAN', X + Wd - 10, yTop + 60, { ...th.label, size: 30, color: '#2a1a10', bg: '#e9c27a', align: 'right', alpha: K.seg(A.rise, .8, 1) });
  steps(g, c, 1180, [low * (1 - doa), doa * (1 - A.rise), A.rise > .1 ? 1 : 0], 1);
}
