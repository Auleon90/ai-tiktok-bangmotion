// Custom scenes for "Ada yang Menunggumu Pulang" (paper-lantern). One module, one "act" per scene:
//   window · frames · grow · bakso · home · cta     (fields: headline, eyebrow, items, arabic, translation, ref)
// Faceless silhouettes only. Every beat is timed to the spoken word (K.WORDS) where it matters.
const GLOW = '#ffcd82', CORE = '#fff4dc', SIL = '#120e16', PAPER = '#e6d3ad', RED = '#e2553f';

function beat(c, key, dflt) {
  const t0 = c.t - c.lt, k = key.toLowerCase();
  const w = c.K.WORDS.find(w => w.t0 >= t0 - .05 && w.t0 < t0 + c.d && w.text.toLowerCase().replace(/[^a-z-]/g, '').startsWith(k));
  return w ? w.t0 - t0 : dflt;
}
function strip(g, x, y, w, h, col = PAPER) { g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 22; g.shadowOffsetY = 10; g.fillStyle = col; g.fillRect(x, y, w, h); g.restore(); }
function tag(g, K, id, str, x, y, o) {
  const a = o.alpha ?? 1; if (a <= .02 || !str) return; const sz = o.size || 30; g.save(); g.font = `${o.weight || 500} ${sz}px ${o.family || 'serif'}`;
  const w = g.measureText(String(str).toUpperCase()).width * (1 + (o.ls || 0)) + 36, al = o.align || 'left', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w + 18 : x - 18;
  g.globalAlpha = a * .88; g.fillStyle = o.bg || '#0d0b12'; g.fillRect(x0, y - sz * 1.05, w, sz * 1.5); g.restore();
  g.save(); g.globalAlpha = a; K.text(g, id, str, x, y, { ...o, size: sz }); g.restore();
}
function glow(g, x, y, r, a = 1, col = '255,205,140') {
  if (a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},.9)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}
// faceless silhouette standing on (x, y), height S. arm: 'down' | 'up' (waving / hand on glass) | 'hug' | 'out'
function person(g, x, y, S, o = {}) {
  const col = o.col || SIL, b = o.bob || 0; g.save(); g.translate(x, y - b); g.scale(o.dir || 1, 1); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
  const lw = S * .085; g.lineWidth = lw;
  g.beginPath(); g.moveTo(-S * .05, -S * .45); g.lineTo(-S * .08, 0); g.moveTo(S * .05, -S * .45); g.lineTo(S * .08, 0); g.stroke();   // legs
  g.beginPath(); if (o.dress) { g.moveTo(-S * .07, -S * .78); g.lineTo(S * .07, -S * .78); g.lineTo(S * .26, 0); g.lineTo(-S * .26, 0); }
  else { g.moveTo(-S * .1, -S * .8); g.lineTo(S * .1, -S * .8); g.lineTo(S * .12, -S * .42); g.lineTo(-S * .12, -S * .42); } g.closePath(); g.fill();   // body
  g.beginPath(); g.arc(0, -S * .9, S * .1, 0, Math.PI * 2); g.fill();   // head, no face
  g.lineWidth = lw * .8; g.beginPath(); const a = o.arm || 'down';
  if (a === 'up') { g.moveTo(S * .08, -S * .76); g.lineTo(S * .2, -S * .98); g.moveTo(-S * .08, -S * .76); g.lineTo(-S * .14, -S * .5); }
  else if (a === 'hug') { g.moveTo(S * .08, -S * .76); g.lineTo(S * .26, -S * .66); g.lineTo(S * .3, -S * .56); g.moveTo(-S * .08, -S * .76); g.lineTo(S * .1, -S * .6); }
  else if (a === 'out') { g.moveTo(S * .08, -S * .76); g.lineTo(S * .3, -S * .66); g.moveTo(-S * .08, -S * .76); g.lineTo(-S * .3, -S * .66); }
  else { g.moveTo(S * .1, -S * .76); g.lineTo(S * .14, -S * .46); g.moveTo(-S * .1, -S * .76); g.lineTo(-S * .14, -S * .46); }
  g.stroke();
  if (o.veil) { g.globalAlpha = .55; g.fillStyle = '#f3ead8'; g.beginPath(); g.moveTo(0, -S); g.quadraticCurveTo(-S * .35, -S * .5, -S * .3, -S * .1); g.lineTo(-S * .05, -S * .8); g.fill(); }
  g.restore();
}
// dashed outline of a missing adult
function ghost(g, x, y, S, a, t) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.setLineDash([10, 9]); g.lineDashOffset = -t * 20; g.strokeStyle = '#ffe3b0'; g.lineWidth = 3;
  g.beginPath(); g.arc(x, y - S * .9, S * .1, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(x - S * .1, y - S * .8); g.lineTo(x + S * .1, y - S * .8); g.lineTo(x + S * .13, y); g.lineTo(x - S * .13, y); g.closePath(); g.stroke(); g.restore();
}
function house(g, x, y, w, h, lit, K, t, door = 0) {   // dark paper house with a warm window; returns the window rect
  g.save(); g.fillStyle = '#17121c'; g.beginPath(); g.moveTo(x - 30, y + h * .32); g.lineTo(x + w / 2, y - h * .05); g.lineTo(x + w + 30, y + h * .32); g.closePath(); g.fill();
  g.fillRect(x, y + h * .3, w, h * .7);
  const win = { x: x + w * .14, y: y + h * .42, w: w * .44, h: h * .36 };
  const flick = .92 + .08 * Math.sin(t * 7) * Math.sin(t * 2.3);
  g.fillStyle = K.mix('#3a2a24', '#ffc77a', lit * flick); g.fillRect(win.x, win.y, win.w, win.h);
  glow(g, win.x + win.w / 2, win.y + win.h / 2, win.w * .9, lit * .55);
  const dw = w * .2, dx = x + w * .7, dy = y + h * .52; g.fillStyle = '#0c0910'; g.fillRect(dx, dy, dw, y + h - dy);
  if (door > 0) { g.fillStyle = K.mix('#0c0910', '#ffc77a', door); g.fillRect(dx, dy, dw * door, y + h - dy); glow(g, dx + dw / 2, y + h - 30, 160, door * .5); }
  g.restore(); return win;
}
function moon(g, x, y, r) { glow(g, x, y, r * 3, .35); g.save(); g.fillStyle = '#fbeccb'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore(); }


// an ayat without a box: a feathered shade (no edges), Amiri letters in warm gold with a glow, thin gold rules with a lozenge
function verse(g, c, id, text, b, a, size = 80) {
  const { K } = c; if (a <= 0 || !text) return null; const mx = b.x + b.w / 2, my = b.y + b.h / 2;
  g.save(); g.globalAlpha = a; g.translate(mx, my); g.scale(1, (b.h * .75) / (b.w * .6));
  const sh = g.createRadialGradient(0, 0, 0, 0, 0, b.w * .62); sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(.6, 'rgba(0,0,0,.3)'); sh.addColorStop(.85, 'rgba(0,0,0,.13)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, b.w * .62, 0, Math.PI * 2); g.fill(); g.restore();
  const r = K.block(g, id, text, b, { family: 'Amiri', weight: 700, size, min: 40, lh: 1.5, align: 'center', valign: 'middle', alpha: a,
    paint: (g, ln, x, base) => {
      g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.85)'; g.shadowBlur = 16; g.shadowOffsetY = 3; g.fillStyle = '#ffdc96'; g.fillText(ln, x, base);
      g.shadowOffsetY = 0; g.shadowColor = GLOW; g.shadowBlur = 30; g.globalAlpha = a * .7; g.fillStyle = '#fff0cc'; g.fillText(ln, x, base);
    } });
  const half = Math.min(b.w * .42, (r.x1 - r.x0) / 2 + 40) * K.eo(K.clamp(a * 1.2));
  g.save(); g.globalAlpha = a * .9; g.strokeStyle = '#e9c27a'; g.fillStyle = '#e9c27a'; g.lineWidth = 2; g.shadowColor = GLOW; g.shadowBlur = 8;
  for (const y of [r.y0 - 16, r.y1 + 18]) { g.beginPath(); g.moveTo(mx - half, y); g.lineTo(mx - 14, y); g.moveTo(mx + 14, y); g.lineTo(mx + half, y); g.stroke();
    g.beginPath(); g.moveTo(mx, y - 7); g.lineTo(mx + 7, y); g.lineTo(mx, y + 7); g.lineTo(mx - 7, y); g.closePath(); g.fill(); }
  g.restore(); return r;
}

export default function (g, c) {
  const { K, theme: th, box, lt, d, s, t } = c, X = box.x + 20, Wd = box.w - 40, top = box.y + 30, cx = c.W / 2, ground = 1150;
  const head = (h = 200, size = 80) => { strip(g, X, top, Wd, h); K.block(g, 'main', s.headline, { x: X + 40, y: top + 20, w: Wd - 80, h: h - 40 }, { ...th.title, size, min: 40, align: 'center', valign: 'middle' }); };
  const brow = (y = top) => { if (!s.eyebrow) return; strip(g, cx - 230, y - 10, 460, 56); K.block(g, 'eyebrow', s.eyebrow, { x: cx - 215, y: y - 2, w: 430, h: 40 }, { ...th.label, align: 'center', valign: 'middle' }); };


  // ------------------------------------------------ 5/6 · an ayat with no box: gold letters on the night, translation on a paper strip
  if (s.act === 'ayat') {
    brow(top);
    const ua = K.seg(lt, .05, .6), us = K.seg(lt, .5, 1);
    glow(g, cx, top + 300, 420, .35 * ua);
    verse(g, c, 'ar', s.arabic, { x: X + 10, y: top + 90, w: Wd - 20, h: 380 }, ua, 92);
    const ys = top + 530;
    if (us > 0) { strip(g, X + (Wd - Wd * K.eo(us)) / 2, ys, Wd * K.eo(us), 230);
      K.block(g, 'tr', `“${s.translation}”`, { x: X + 40, y: ys + 18, w: Wd - 80, h: 150 }, { ...th.quote, size: 52, min: 30, align: 'center', valign: 'middle', alpha: K.seg(lt, .8, 1.1) });
      K.block(g, 'ref', `— ${s.ref}`, { x: X + 40, y: ys + 178, w: Wd - 80, h: 36 }, { ...th.label, size: 26, min: 18, align: 'center', alpha: K.seg(lt, .9, 1.2) }); }
    return;
  }

  // ------------------------------------------------ 1 · a child waits at the lit window; the car's lights drive away
  if (s.act === 'window' || s.act === 'cta') {
    const cta = s.act === 'cta';
    head(cta ? 200 : 210, cta ? 74 : 86);
    const hx = cx - 300, hy = 560, hw = 600, hh = 560, win = house(g, hx, hy, hw, hh, 1, K, t, cta ? K.eo(K.seg(lt, .2, 1.4)) : 0);
    g.save(); g.beginPath(); g.rect(win.x, win.y, win.w, win.h); g.clip();
    const fy = win.y + win.h + 8;
    if (!cta) person(g, win.x + win.w * .5, fy, 175, { arm: 'up', bob: Math.sin(t * 1.3) * 2 });
    else { const u = K.eo(K.seg(lt, .4, 1.6)); person(g, win.x + win.w * (.75 - .2 * u), fy + 40, 260, { dir: -1, arm: u > .9 ? 'hug' : 'down' }); person(g, win.x + win.w * .32, fy, 160, { arm: 'up', bob: Math.abs(Math.sin(t * 3)) * 4 * u }); }
    g.restore();
    g.fillStyle = '#0d0a10'; g.fillRect(0, ground, c.W, 140);   // road
    // tail lights: drive away (hook) / headlights arrive home (cta)
    const u = cta ? 1 - K.eo(K.seg(lt, 0, 1.6)) : K.clamp(.25 + lt / d), sc = 1 - .8 * u, lx = cta ? hx + hw + 120 + u * 300 : hx + hw + 60 + u * 340;
    for (const o of [-1, 1]) glow(g, lx + o * 38 * sc, ground + 40 - u * 30, 40 * sc, .9, cta ? '255,230,170' : '255,70,50');
    const hh2 = 21 + Math.floor((cta ? 3 : 0) + lt * 1.4), mm = String((47 + Math.floor(lt * 9)) % 60).padStart(2, '0');
    tag(g, K, 'clock', `${cta ? 23 : 21}:${mm}`, hx + 40, hy + 60, { ...th.label, size: 34, color: '#ffe2a8' });
    if (!cta) tag(g, K, 'wait', 'MENUNGGU', win.x + win.w / 2, win.y - 26, { ...th.label, size: 28, color: '#ffe2a8', align: 'center', alpha: K.seg(lt, d * .5, d * .7) });
    else tag(g, K, 'home', 'SUDAH PULANG', win.x + win.w / 2, win.y - 26, { ...th.label, size: 32, color: '#2a1a10', bg: '#e9c27a', align: 'center', alpha: K.seg(lt, 1.6, 2.1) });
    return;
  }

  // ------------------------------------------------ 2 · three photos of firsts; the father is a dashed empty outline in each
  if (s.act === 'frames') {
    brow(top);
    const keys = ['sepeda', 'renang', 'tiup'], tK = beat(c, 'kecuali', d * .82), miss = K.seg(lt, tK - .1, tK + .4);
    const fw = Wd - 40, fh = 270, gap = 26, y0 = top + 70;
    keys.forEach((k, i) => {
      const tb = beat(c, k, d * (.08 + i * .2)), a = K.eo(K.seg(lt, tb - .15, tb + .25)); if (a <= 0) return;
      const x = X + 20, y = y0 + i * (fh + gap), tilt = (i % 2 ? 1 : -1) * .018 * a;
      g.save(); g.translate(x + fw / 2, y + fh / 2); g.rotate(tilt); g.scale(.9 + .1 * a, .9 + .1 * a); g.translate(-fw / 2, -fh / 2); g.globalAlpha = a;
      g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 24; g.shadowOffsetY = 10; g.fillStyle = '#f4ead6'; g.fillRect(0, 0, fw, fh); g.shadowColor = 'transparent';
      const ix = 18, iy = 18, iw = fw - 36, ih = fh - 36, gr = g.createLinearGradient(0, iy, 0, iy + ih); gr.addColorStop(0, ['#f6c27c', '#8fc4d8', '#3b2a3a'][i]); gr.addColorStop(1, ['#e98f55', '#3f7fa6', '#6a3c3a'][i]);
      g.fillStyle = gr; g.fillRect(ix, iy, iw, ih);
      const gy = iy + ih - 20, kx = ix + iw * .58, ph = t * 2 + i;
      if (i === 0) { g.strokeStyle = SIL; g.lineWidth = 6; const bx = kx + Math.sin(lt * 1.5) * 20; for (const o of [-40, 40]) { g.beginPath(); g.arc(bx + o, gy - 24, 24, 0, Math.PI * 2); g.stroke(); }
        g.beginPath(); g.moveTo(bx - 40, gy - 24); g.lineTo(bx, gy - 60); g.lineTo(bx + 40, gy - 24); g.stroke(); person(g, bx, gy - 40, 120, { arm: 'out' }); }
      if (i === 1) { person(g, kx, gy + 30, 150, { arm: 'up', bob: Math.sin(ph) * 6 }); g.fillStyle = 'rgba(40,110,160,.85)'; g.beginPath(); g.moveTo(ix, gy - 50);
        for (let q = 0; q <= 40; q++) g.lineTo(ix + iw * q / 40, gy - 50 + Math.sin(q * .9 + t * 3) * 7); g.lineTo(ix + iw, iy + ih); g.lineTo(ix, iy + ih); g.fill(); }
      if (i === 2) { g.fillStyle = '#f3e3c3'; g.fillRect(kx - 120, gy - 60, 120, 50); g.fillStyle = RED; g.fillRect(kx - 64, gy - 92, 8, 32); glow(g, kx - 60, gy - 100, 50, .9);
        g.fillStyle = '#ffe9a8'; g.beginPath(); g.ellipse(kx - 60, gy - 102, 6, 11 + Math.sin(t * 13) * 2, 0, 0, Math.PI * 2); g.fill(); person(g, kx + 50, gy, 150, { arm: 'out' }); }
      ghost(g, ix + iw * .2, gy, 210, .75 + .25 * miss, t);
      g.restore();
      tag(g, K, 'cap' + i, s.items?.[i] || '', x + 40, y + 62, { ...th.label, size: 30, color: '#ffe2a8', alpha: a });
      if (miss > 0) tag(g, K, 'miss' + i, 'AYAH?', x + 18 + (fw - 36) * .2, y + fh - 40, { ...th.label, size: 26, color: '#fff', bg: RED, align: 'center', alpha: miss });
    });
    return;
  }

  // ------------------------------------------------ 3 · the revenue line climbs while the child grows up and is gone
  if (s.act === 'grow') {
    brow(top);
    const tN = beat(c, 'menikah', d * .85), wed = K.seg(lt, tN - .2, tN + .4), up = K.eo(K.seg(lt, 0, tN));
    const cx0 = X + 20, cw = Wd - 40, cy0 = top + 110, ch = 400;
    g.save(); g.strokeStyle = 'rgba(230,211,173,.35)'; g.lineWidth = 2; for (let q = 0; q <= 4; q++) { g.beginPath(); g.moveTo(cx0, cy0 + ch * q / 4); g.lineTo(cx0 + cw, cy0 + ch * q / 4); g.stroke(); } g.restore();
    const pts = []; for (let q = 0; q <= 60; q++) { const u = q / 60; pts.push([cx0 + cw * u, cy0 + ch - ch * (.05 + .9 * Math.pow(u, 1.6)) + Math.sin(q * 1.7) * 8]); }
    const n = Math.max(1, Math.round(60 * up));
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = GLOW; g.shadowBlur = 24; g.strokeStyle = GLOW; g.lineWidth = 8; g.lineJoin = 'round';
    g.beginPath(); pts.slice(0, n + 1).forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore();
    const [hx, hy] = pts[n]; glow(g, hx, hy, 50, 1);
    const val = (2 * Math.pow(up, 2)).toFixed(up > .98 ? 0 : 1).replace('.', ',');
    tag(g, K, 'omzet', `OMZET Rp${val} T`, Math.min(hx, cx0 + cw - 200), hy - 40, { ...th.label, size: 32, color: '#ffe2a8', align: 'center' });
    // the child's years along the ground: 3 · 7 · 12 · 17 · bride
    g.fillStyle = '#0d0a10'; g.fillRect(0, ground, c.W, 140);
    const ages = [[3, 90], [7, 130], [12, 175], [17, 215]], xs = ages.map((_, k) => X + 70 + k * (Wd - 140) / 4);
    ages.forEach(([age, S], k) => { const a = K.seg(up, k * .22, k * .22 + .12) * (1 - .55 * K.seg(up, k * .22 + .25, k * .22 + .4)) * (1 - wed); if (a <= 0) return;
      g.save(); g.globalAlpha = a; person(g, xs[k], ground, S, { arm: k ? 'down' : 'up' }); g.restore();
      tag(g, K, 'age' + k, `${age} th`, xs[k], ground + 62, { ...th.label, size: 26, color: '#ffe2a8', align: 'center', alpha: a }); });
    if (wed > 0) { const bx = X + Wd - 60; glow(g, bx, ground - 140, 200, wed * .6); g.save(); g.globalAlpha = wed; person(g, bx, ground, 250, { dress: true, veil: true }); g.restore();
      tag(g, K, 'bride', 'SUDAH MENIKAH', bx - 20, ground + 62, { ...th.label, size: 28, color: '#2a1a10', bg: '#e9c27a', align: 'right', alpha: wed }); }
    // the clock of years
    const yr = 2008 + Math.round(18 * up); tag(g, K, 'year', String(yr), X + 30, cy0 + 40, { ...th.label, size: 40, color: '#ffe2a8' });
    return;
  }

  // ------------------------------------------------ 4 · the bakso cart comes home at dusk; the window fills with laughter
  if (s.act === 'bakso') {
    head(200, 74);
    const tT = beat(c, 'tawa', d * .8), arrive = K.eo(K.seg(lt, 0, tT - .3)), laugh = K.seg(lt, tT - .4, tT + .2);
    const hx = X + Wd - 420, hy = 640, hw = 420, hh = 510, win = house(g, hx, hy, hw, hh, .6 + .4 * laugh, K, t, laugh);
    g.save(); g.beginPath(); g.rect(win.x, win.y, win.w, win.h); g.clip(); const fy = win.y + win.h + 6, bob = Math.abs(Math.sin(t * 6)) * 8 * laugh;
    person(g, win.x + win.w * .3, fy, 170, { dress: true, arm: 'out', bob }); person(g, win.x + win.w * .72, fy, 110, { arm: 'up', bob: bob * 1.3 }); g.restore();
    g.fillStyle = '#0d0a10'; g.fillRect(0, ground, c.W, 140);
    // cart + father pushing it
    const kx = X + 40 + arrive * (hx - X - 260), ky = ground - 20;
    g.save(); g.fillStyle = '#1b141c'; g.fillRect(kx, ky - 150, 190, 120); g.fillStyle = '#e9c27a'; g.fillRect(kx + 12, ky - 140, 166, 36);
    K.text(g, 'cart', 'BAKSO', kx + 95, ky - 112, { ...th.label, size: 26, color: '#2a1a10', align: 'center' });
    g.strokeStyle = '#1b141c'; g.lineWidth = 8; g.beginPath(); g.moveTo(kx + 20, ky - 150); g.lineTo(kx + 20, ky - 230); g.lineTo(kx + 170, ky - 230); g.lineTo(kx + 170, ky - 150); g.stroke();
    for (const o of [40, 150]) { g.beginPath(); g.arc(kx + o, ky, 22, 0, Math.PI * 2); g.stroke(); }
    g.restore(); glow(g, kx + 95, ky - 236, 60, .9); g.fillStyle = '#fff1c8'; g.beginPath(); g.arc(kx + 95, ky - 236, 10, 0, Math.PI * 2); g.fill();
    for (let q = 0; q < 6; q++) { const u = (t * .6 + q / 6) % 1; g.save(); g.globalAlpha = (1 - u) * .5; g.fillStyle = '#f3ead8'; g.beginPath(); g.arc(kx + 60 + Math.sin(u * 6 + q) * 14, ky - 160 - u * 120, 10 + u * 16, 0, Math.PI * 2); g.fill(); g.restore(); }
    person(g, kx - 50, ground, 220, { arm: 'out', bob: Math.abs(Math.sin(t * 5)) * 4 * (1 - laugh) });
    tag(g, K, 'coin', 'UANG PAS-PASAN', kx + 95, ky - 290, { ...th.label, size: 26, color: '#ffe2a8', align: 'center', alpha: K.seg(lt, .8, 1.4) * (1 - laugh) });
    for (let q = 0; q < 5; q++) { const u = ((t * .5 + q / 5) % 1), a = laugh * (1 - u); if (a <= .02) continue;
      tag(g, K, 'ha' + q, q % 2 ? 'ha ha' : 'hihi', win.x + win.w * (.2 + .15 * q), win.y - 20 - u * 160, { ...th.label, size: 26, color: '#2a1a10', bg: '#e9c27a', align: 'center', alpha: a }); }
    return;
  }

  // ------------------------------------------------ 7 · tonight: the laptop closes, a hug, then the doa
  if (s.act === 'home') {
    brow(top);
    const tL = beat(c, 'tutup', d * .15), tP = beat(c, 'peluk', d * .4), tD = beat(c, 'berdoa', d * .6);
    const shut = K.eo(K.seg(lt, tL, tL + .6)), hug = K.eo(K.seg(lt, tP - .3, tP + .9)), doa = K.seg(lt, tD - .2, tD + .5);
    // room: lamp glow, table with the laptop
    glow(g, cx, 760, 520, .35 + .35 * hug);
    g.fillStyle = '#0d0a10'; g.fillRect(0, ground, c.W, 140);
    const tx = X + 30, ty = ground - 150; g.fillStyle = '#1b141c'; g.fillRect(tx, ty, 260, 18); g.fillRect(tx + 20, ty, 14, 150); g.fillRect(tx + 226, ty, 14, 150);
    const lw = 170, lhgt = 110 * (1 - shut); g.fillStyle = '#2a2230'; g.fillRect(tx + 45, ty - 10, lw, 10);
    if (lhgt > 2) { g.fillStyle = '#9fc4ff'; g.fillRect(tx + 50, ty - 10 - lhgt, lw - 10, lhgt); glow(g, tx + 130, ty - 60, 140, .5 * (1 - shut), '150,190,255'); }
    // the father leaves the table and kneels to the child
    const fx = tx + 330 + hug * 140, kx = X + Wd - 120;
    person(g, fx, ground, 290, { arm: hug > .85 ? 'hug' : 'down', dir: 1 });
    person(g, kx - hug * 40, ground, 150, { arm: hug > .85 ? 'up' : 'down', dir: -1, bob: 0 });
    if (hug > .85) glow(g, (fx + kx) / 2, ground - 160, 220, .5 * K.seg(hug, .85, 1));
    // the doa, cut into light at the top
    if (doa > 0) {
      verse(g, c, 'ar', s.arabic, { x: X + 10, y: top + 70, w: Wd - 20, h: 170 }, doa, 66);
      strip(g, X + 20, top + 262, Wd - 40, 130);
      K.block(g, 'tr', `“${s.translation}”`, { x: X + 50, y: top + 270, w: Wd - 100, h: 80 }, { ...th.quote, size: 46, min: 28, align: 'center', valign: 'middle', alpha: doa });
      K.block(g, 'ref', `— ${s.ref}`, { x: X + 50, y: top + 352, w: Wd - 100, h: 32 }, { ...th.label, size: 24, min: 18, align: 'center', alpha: doa });
    }
    tag(g, K, 'lap', 'TUTUP LAPTOP', tx + 130, ty - 150, { ...th.label, size: 26, color: '#ffe2a8', align: 'center', alpha: K.seg(lt, tL - .2, tL + .2) * (1 - doa) });
    tag(g, K, 'peluk', 'PELUK MEREKA', (fx + kx) / 2, ground - 330, { ...th.label, size: 28, color: '#2a1a10', bg: '#e9c27a', align: 'center', alpha: K.seg(hug, .8, 1) * (1 - doa) });
    return;
  }
}
