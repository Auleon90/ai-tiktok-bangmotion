// Example custom scene: a city street in the rain — buildings, pedestrians with umbrellas, passing cars, puddle ripples.
// Storyboard: { "type": "custom", "code": "custom/kota-hujan.js", "headline": "Jakarta, pukul 7 pagi", "sub": "...", "time": "pagi|malam" }
// Copy to output/custom/ for a video. Colours come from the kit's theme, so it takes on each kit's look.
let BLD;
export function prep(c) {
  const { K } = c, r = K.mulberry(12); BLD = [];
  for (let x = -40; x < c.W + 60;) { const w = 110 + r() * 120; BLD.push({ x, w, h: 260 + r() * 420, win: r() }); x += w + 6; }
}
export default function (g, c) {
  const { K, theme: th, box, lt, s, t } = c, ground = box.y + box.h - 40, night = s.time === 'malam';
  const ink = th.title?.color || '#222', acc = th.accent || '#d33';
  // headline + sub at the top of the box
  const hb = K.block(g, 'main', s.headline || '', { x: box.x, y: box.y, w: box.w, h: 190 }, { ...th.title, size: Math.min(110, th.title?.size || 110), align: th.align || 'left', valign: 'top',
    reveal: () => { const u = K.eo(K.seg(lt, .15, .6)); return { a: u, dy: (1 - u) * 20 }; } });
  if (s.sub) K.block(g, 'sub', s.sub, { x: box.x, y: hb.y1 + 14, w: box.w, h: 110 }, { ...th.body, align: th.align || 'left', reveal: () => ({ a: K.eo(K.seg(lt, .5, .9)) }) });
  // buildings rise in, windows lit at night
  const top0 = box.y + 330;
  for (const b of BLD) {
    const u = K.eo(K.seg(lt, .05 + b.x / 4000, .7 + b.x / 4000)), h = Math.min(b.h, ground - top0) * u;
    g.globalAlpha = .9; g.fillStyle = K.mix(ink.length === 7 ? ink : '#333333', '#ffffff', .55 + b.win * .25); g.fillRect(b.x, ground - h, b.w, h);
    g.fillStyle = night ? '#ffd98a' : 'rgba(255,255,255,.55)';
    for (let y = ground - h + 20; y < ground - 40; y += 46) for (let x = b.x + 14; x < b.x + b.w - 20; x += 34) if (K.hash(x * .3, y) < (night ? .55 : .8)) g.fillRect(x, y, 16, 24);
    g.globalAlpha = 1;
  }
  g.fillStyle = K.mix(ink.length === 7 ? ink : '#333333', '#ffffff', .35); g.fillRect(0, ground, c.W, 60);
  // cars crossing, both ways
  for (let k = 0; k < 4; k++) { const dir = k % 2 ? -1 : 1, x = ((lt * (220 + k * 60) + k * 400) % 1500) - 200, xx = dir > 0 ? x : c.W - x, y = ground + 18 + (k % 2) * 16;
    g.fillStyle = [acc, '#3f7fbf', '#e8c24a', '#4fae7a'][k]; g.beginPath(); g.roundRect(xx - 60, y - 34, 120, 30, 10); g.fill(); g.fillRect(xx - 36, y - 52, 70, 22);
    g.fillStyle = '#ffeec2'; g.fillRect(xx + dir * 54 - 4, y - 28, 8, 8); }
  // pedestrians with umbrellas (faceless figures in the kit's look)
  for (let k = 0; k < 7; k++) {
    const dir = k % 2 ? -1 : 1, sp = 50 + K.hash(k, 3) * 40, x0 = K.hash(k, 5) * c.W, x = ((x0 + dir * lt * sp) % (c.W + 200) + c.W + 200) % (c.W + 200) - 100, S = 150 + K.hash(k, 7) * 40;
    const f = { x, y: ground, S, dir, pose: 'walk', ph: k * 1.7, fall: 0, run: false, side: dir, color: null };
    c.FIG.drawFigure(g, f, t, { ...c.look, shield: 'rgba(0,0,0,0)', weapon: 'rgba(0,0,0,0)' });
    const ux = x + dir * S * .05, uy = ground - S * 1.18; g.fillStyle = [acc, '#3f7fbf', '#e8c24a', ink][k % 4];
    g.beginPath(); g.arc(ux, uy, S * .32, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(ux, uy); g.lineTo(ux, uy + S * .32); g.stroke();
  }
  // rain + puddle ripples
  g.strokeStyle = night ? 'rgba(200,215,255,.45)' : 'rgba(90,110,140,.45)'; g.lineWidth = 2;
  for (let k = 0; k < 140; k++) { const x = (K.hash(k, 1) * c.W + t * 60) % c.W, y = ((K.hash(k, 2) * 1400 + t * 1500) % 1400) + box.y + 200; if (y > ground) continue; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 34); g.stroke(); }
  for (let k = 0; k < 8; k++) { const u = (t * .9 + K.hash(k, 9)) % 1, x = K.hash(k, 4) * c.W; g.globalAlpha = 1 - u; g.beginPath(); g.ellipse(x, ground + 30, 10 + u * 40, 3 + u * 8, 0, 0, K.TAU); g.stroke(); g.globalAlpha = 1; }
}
