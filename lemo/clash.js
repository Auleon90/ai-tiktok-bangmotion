// Battle / clash scene for Lemo-native kits: two sides advance, arrows fly, they charge, meet, some fall, the loser may rout.
// Shared choreography (clashModel) + a faceless warrior silhouette (drawFigure) that each kit paints in its own look.
//
// Storyboard scene:
//   { "type": "clash", "headline": "Perang Badar", "sub": "17 Ramadan 2 H",
//     "left":  { "label": "Muslimin", "count": 313, "color": "#2f6b3a", "cavalry": 2 },
//     "right": { "label": "Quraisy",  "count": 1000, "color": "#8a2a1e", "cavalry": 6 },
//     "winner": "left",                                   // optional: the other side routs near the end
//     "hero": { "side": "left", "prophet": true } }       // optional: one figure set apart (prophet: a glowing light over the head)
// Figures are always faceless silhouettes. A prophet figure is never shown fighting: it stands behind the front line, one arm raised,
// marked by a light above the head so viewers can tell it from the other figures.
import { W, clamp, lerp, seg, eo, eio, ss, hash, mulberry, TAU, block } from './kit.js';

// ---------------------------------------------------------------- choreography
// zone: { x0, x1, ground (front-row feet y), S (front-row figure height) }
export function clashModel(s, t, zone) {
  const lt = t - s.t0, d = Math.max(3, s.d), u = lt / d, L = s.left || {}, R = s.right || {};
  const cL = +String(L.count ?? 10).replace(/\D/g, '') || 10, cR = +String(R.count ?? 10).replace(/\D/g, '') || 10;
  const total = 20, nL = clamp(Math.round(total * cL / (cL + cR)), 6, 14), nR = clamp(Math.round(total * cR / (cL + cR)), 6, 14);
  const cx = (zone.x0 + zone.x1) / 2, S = zone.S, rows = [{ k: 1, dy: 0 }, { k: .78, dy: -S * .26 }, { k: .62, dy: -S * .46 }];
  // front-line position of each side over time: march in, hold, charge, melee
  const march = eo(seg(u, 0, .3)), charge = eio(seg(u, .32, .46));
  const frontL = lerp(lerp(zone.x0 - 420, cx - 190, march), cx - 40, charge), frontR = lerp(lerp(zone.x1 + 420, cx + 190, march), cx + 40, charge);
  const melee = seg(u, .44, .5), loser = s.winner === 'left' ? -1 : s.winner === 'right' ? 1 : 0, rout = eio(seg(u, .82, 1));
  const figs = [], fx = { dust: [], sparks: [], arrows: [] };
  const side = (n, dir, conf, front) => {
    const r = mulberry(dir > 0 ? 11 : 23), cav = clamp(+conf.cavalry || 0, 0, 6);
    for (let i = 0; i < n; i++) {
      const row = i % 3, k = rows[row].k, col = Math.floor(i / 3), jx = (r() - .5) * 26, ph = r() * TAU;
      let x = front - dir * (col * 104 * k + row * 34 + 10) + jx, y = zone.ground + rows[row].dy;
      const running = charge > 0 && charge < 1, rider = row === 0 && col >= 1 && col <= Math.min(cav, 2);
      // melee: the front columns sway into each other and strike; deeper columns press forward
      let pose = march < 1 ? 'walk' : running ? 'run' : melee > 0 ? 'strike' : 'hold';
      if (melee > 0) x += Math.sin(t * 3.1 + ph) * 10 * k + dir * melee * Math.min(col, 2) * 22;
      // the losing side turns and runs at the end
      const flee = loser === dir ? rout : 0; if (flee > 0) { x -= dir * flee * 520; pose = 'run'; }
      // some fall: more on the loser's side, front columns first; deterministic
      const fallP = (loser === dir ? .42 : loser ? .16 : .26) * (col < 2 ? 1.3 : .6), falls = hash(i * 7.3, dir) < fallP && !rider;
      const tFall = .52 + hash(i * 3.1, dir + 5) * .3, fall = falls ? ss(seg(u, tFall, tFall + .05)) : 0;
      figs.push({ x, y, S: S * k * (rider ? 1.05 : 1), dir: flee > .02 ? -dir : dir, pose, ph, fall, row, rider, side: dir, depth: row,
        color: conf.color, flag: i === 4 && !conf.noBanner ? (conf.color || null) : null, run: running || flee > 0 });
      if (running && i % 2 === 0) fx.dust.push({ x: x - dir * 30, y, r: 22 * k, a: .35 });
    }
  };
  side(nL, 1, L, frontL); side(nR, -1, R, frontR);
  if (s.hero) {
    const dir = s.hero.side === 'right' ? -1 : 1, front = dir > 0 ? frontL : frontR;
    figs.push({ x: front - dir * 150, y: zone.ground + rows[1].dy + 6, S: S * .98, dir, pose: s.hero.prophet ? 'command' : 'strike', ph: 1.3, fall: 0, row: 1, depth: 1.5,
      rider: !!s.hero.rider, side: dir, color: (dir > 0 ? L : R).color, hero: true, prophet: !!s.hero.prophet });
  }
  // arrow volleys while the armies close in
  for (const [dir, front, foe] of [[1, frontL, frontR], [-1, frontR, frontL]]) for (let v = 0; v < 2; v++) {
    const t0 = .12 + v * .1 + (dir > 0 ? 0 : .05), a = seg(u, t0, t0 + .12); if (a <= 0 || a >= 1) continue;
    for (let k = 0; k < 9; k++) { const x0 = front - dir * (160 + k * 20), x1 = foe + dir * (40 + hash(k, v) * 160), p = clamp(a * 1.1 - k * .012);
      fx.arrows.push({ x0, x1, y0: zone.ground - S * .9, y1: zone.ground - S * .3, h: S * (1.4 + hash(k + 3, v) * .5), p }); }
  }
  // sparks where the lines meet
  if (melee > 0 && rout < .5) for (let k = 0; k < 6; k++) { const ph = Math.floor(t * 6 + k * .37), on = hash(ph, k) > .45; if (on) fx.sparks.push({ x: cx + (hash(ph, k + 9) - .5) * 160, y: zone.ground - S * (.45 + hash(ph, k + 4) * .35), r: 10 + hash(ph, k + 1) * 16 }); }
  if (charge > .8 && melee < 1) for (let k = 0; k < 5; k++) fx.dust.push({ x: cx + (k - 2) * 60, y: zone.ground, r: 70 * melee + 20, a: .4 * (1 - melee * .5) });
  figs.sort((a, b) => b.depth - a.depth);
  return { figs, fx, u, melee, cx };
}

// ---------------------------------------------------------------- the faceless warrior
// look: { fill(f) -> colour, stroke, lw, weapon, shield, glow, rim, horse }
export function drawFigure(g, f, t, look) {
  const S = f.S, dir = f.dir, col = typeof look.fill === 'function' ? look.fill(f) : look.fill;
  g.save(); g.translate(f.x, f.y);
  if (f.fall > 0) { g.translate(-dir * S * .3 * f.fall, 0); g.rotate(-dir * f.fall * Math.PI / 2 * .95); g.globalAlpha *= 1 - f.fall * .35; }
  g.scale(dir, 1);
  const lw = look.lw ?? Math.max(2, S * .022), stroke = look.stroke, sp = f.run ? 9 : 4.5;
  const st = f.pose === 'hold' || f.pose === 'command' ? 0 : Math.sin(t * sp + f.ph), bob = f.run ? Math.abs(st) * S * .03 : 0;
  const fillP = p => { g.fillStyle = col; g.fill(p); if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(p); } };
  const line = (pts, w, c = col) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineCap = 'round'; g.lineJoin = 'round';
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = w + lw * 2; g.stroke(); } g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
  let hipY = -S * .44 - bob;
  if (f.rider) {   // horse: body, neck, head, four legs in a gallop
    const H = S * .62, gal = Math.sin(t * 10 + f.ph);
    const leg = (x, a) => line([[x, -H * .55], [x + Math.sin(a) * H * .22, -H * .26], [x + Math.sin(a) * H * .3, 0]], S * .05);
    leg(-H * .38, gal); leg(H * .38, -gal);
    const body = new Path2D(); body.ellipse(0, -H * .68, H * .55, H * .2, 0, 0, TAU);
    body.moveTo(H * .4, -H * .8); body.lineTo(H * .78, -H * 1.18); body.lineTo(H * .98, -H * 1.1); body.lineTo(H * .62, -H * .62); body.closePath();
    fillP(body); line([[-H * .55, -H * .74], [-H * .82, -H * .5 + gal * H * .05]], S * .04);
    leg(-H * .3, -gal * .8); leg(H * .3, gal * .8);
    g.translate(0, -H * .78); hipY = -S * .3;
  }
  // legs
  if (!f.rider) { const a = st * .55; line([[0, hipY], [Math.sin(a) * S * .14, -S * .2], [Math.sin(a) * S * .2, 0]], S * .065); line([[0, hipY], [-Math.sin(a) * S * .14, -S * .2], [-Math.sin(a) * S * .2, 0]], S * .065); }
  // body: tunic flaring at the hips
  const sh = hipY - S * .32, body = new Path2D();
  body.moveTo(-S * .07, sh); body.lineTo(S * .08, sh); body.lineTo(S * .12, hipY + S * .1); body.lineTo(-S * .13, hipY + S * .1); body.closePath(); fillP(body);
  // head (no face): a rounded cap or a pointed helmet
  const hy = sh - S * .12, head = new Path2D(); head.arc(S * .01, hy, S * .085, 0, TAU);
  if (f.side < 0 && !f.prophet) { head.moveTo(-S * .07, hy - S * .03); head.lineTo(S * .01, hy - S * .2); head.lineTo(S * .09, hy - S * .03); }
  fillP(head);
  // arms: back arm holds a shield, front arm the weapon (strike swings it), command raises an open hand
  const sw = f.pose === 'strike' ? Math.sin(t * 7 + f.ph) : f.run ? .2 : -.2;
  if (f.pose !== 'command') { const sx = -S * .02, sy = sh + S * .05; g.save(); g.translate(sx + S * .1, sy + S * .12); const shd = new Path2D(); shd.ellipse(0, 0, S * .05, S * .13, 0, 0, TAU); g.fillStyle = look.shield || col; g.fill(shd); if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(shd); } g.restore(); }
  if (f.pose === 'command') { line([[S * .02, sh + S * .03], [S * .12, sh - S * .1], [S * .14, sh - S * .26]], S * .05); line([[-S * .02, sh + S * .03], [-S * .06, sh + S * .2]], S * .05); }
  else {
    const a = -.4 + sw * 1.1, ex = S * .05 + Math.cos(a) * S * .14, ey = sh + S * .06 + Math.sin(a) * S * .14;
    line([[S * .03, sh + S * .04], [ex, ey]], S * .05);
    const spear = f.side < 0, len = spear ? S * .62 : S * .38, wa = a - (spear ? .2 : .9);
    line([[ex - Math.cos(wa) * (spear ? len * .4 : S * .03), ey - Math.sin(wa) * (spear ? len * .4 : S * .03)], [ex + Math.cos(wa) * len * (spear ? .6 : 1), ey + Math.sin(wa) * len * (spear ? .6 : 1)]], S * (spear ? .022 : .03), look.weapon || col);
  }
  // banner
  if (f.flag && f.fall < .5) { const px = -S * .1, top = sh - S * .55; line([[px, -S * .02 + (f.rider ? 0 : 0)], [px, top]], S * .02, look.weapon || col);
    const wv = Math.sin(t * 4 + f.ph) * S * .03, fl = new Path2D(); fl.moveTo(px, top); fl.quadraticCurveTo(px - S * .18, top + wv, px - S * .34, top + S * .02); fl.lineTo(px - S * .34, top + S * .2); fl.quadraticCurveTo(px - S * .18, top + S * .18 - wv, px, top + S * .2); fl.closePath();
    g.fillStyle = look.flag ? look.flag(f) : f.flag; g.fill(fl); if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(fl); } }
  const m = g.getTransform(); g.restore();
  // the prophet's light: a soft glow and a bright ring of light over the head (drawn unflipped, after the body)
  if (f.prophet) {
    const p = new DOMPoint(S * .01, hy).matrixTransform(m), gc = look.glow || '#ffd77a', pulse = .85 + .15 * Math.sin(t * 2);
    g.save(); g.globalCompositeOperation = look.glowMode || 'lighter';
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, S * .5); gr.addColorStop(0, hexA(gc, .9 * pulse)); gr.addColorStop(.35, hexA(gc, .45 * pulse)); gr.addColorStop(1, hexA(gc, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, S * .5, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = gc; g.lineWidth = Math.max(3, S * .022); g.beginPath(); g.ellipse(p.x, p.y - S * .14, S * .11, S * .035, 0, 0, TAU); g.stroke();
    for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + (k - 3.5) * .28, r0 = S * .2, r1 = S * (.3 + .05 * Math.sin(t * 3 + k)); g.beginPath(); g.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0); g.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1); g.stroke(); }
    g.restore();
  }
}
export function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a)})`; }

// default effects: dust puffs, arrow arcs, impact sparks (kits may pass colours)
export function drawFx(g, fx, c = {}) {
  for (const d of fx.dust) { g.fillStyle = hexA(c.dust || '#c8b48a', d.a * .5); g.beginPath(); g.arc(d.x, d.y - d.r * .4, d.r, 0, TAU); g.fill(); }
  g.lineCap = 'round';
  for (const a of fx.arrows) { const pt = p => [lerp(a.x0, a.x1, p), lerp(a.y0, a.y1, p) - Math.sin(p * Math.PI) * a.h], [x, y] = pt(a.p), [px, py] = pt(Math.max(0, a.p - .05));
    g.strokeStyle = c.arrow || '#2a1a10'; g.lineWidth = 3; g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); }
  for (const s of fx.sparks) { g.strokeStyle = c.spark || '#fff2c2'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.beginPath(); g.moveTo(s.x + Math.cos(a) * s.r * .3, s.y + Math.sin(a) * s.r * .3); g.lineTo(s.x + Math.cos(a) * s.r, s.y + Math.sin(a) * s.r); g.stroke(); } }
}

// side labels over each army and the headline above the field (registered texts)
export function clashText(g, t, s, box, th, fieldTop) {
  const lt = t - s.t0, rv = d => () => { const u = eo(seg(lt, d, d + .45)); return { a: u, dy: (1 - u) * 20 }; };
  const hb = s.sub ? box.h * .66 : box.h;
  block(g, 'main', s.headline || '', { x: box.x, y: box.y, w: box.w, h: hb }, { ...th.title, align: th.align || 'center', valign: 'bottom', reveal: rv(.15) });
  if (s.sub) block(g, 'sub', s.sub, { x: box.x, y: box.y + hb + 16, w: box.w, h: box.h - hb - 16 }, { ...th.label, align: th.align || 'center', reveal: rv(.5) });
  const L = s.left || {}, R = s.right || {}, half = box.w / 2 - 20;
  const lab = (c, x, id) => (c.label ? block(g, id, `${c.label}${c.count ? ' · ' + c.count : ''}`, { x, y: fieldTop, w: half, h: 64 }, { ...th.side, color: th.side.fixed ? th.side.color : (c.color || th.side.color), align: id === 'lL' ? 'left' : 'right', reveal: rv(.8) }) : null);
  lab(L, box.x, 'lL'); lab(R, box.x + box.w - half, 'lR');
}
