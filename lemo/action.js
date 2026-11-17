// "action" scene for landscape kits: the story acted out on a field instead of a pasted photo.
// A terrain (an optional hill on one side, a plain) and groups of faceless figures — or coordinate dots with trails — that move
// between named places along the ground (e.g. the archers coming down the hill at Uhud).
//
// Storyboard:
//   { "type": "action", "headline": "Pemanah turun dari bukit", "sub": "Tergoda harta rampasan",
//     "terrain": { "hill": "left", "label": "Jabal Rumat" },            // hill: left | right | none
//     "groups": [ { "label": "Pemanah", "count": 10, "color": "#2f6b3a", "from": "hilltop", "to": "plain",
//                   "start": .2, "end": .75, "mode": "figures" },       // mode: figures | dots
//                 { "label": "Pasukan Quraisy", "count": 14, "color": "#8a2a1e", "from": "offR", "to": "hillfoot", "start": .55, "end": 1, "mode": "dots" } ],
//     "hero": { "group": 0, "prophet": true } }                          // optional, the same rules as clash
// Places: hilltop, hillside, hillfoot, plain, plainL, plainR, center, offL, offR (off-screen edges).
import { clamp, lerp, seg, eo, eio, ss, hash, TAU, block } from './kit.js';
import { drawFigure } from './clash.js';

// zone: { x0, x1, ground (plain y), top (highest point the hill may reach) }
export function terrain(s, zone) {
  const side = (s.terrain || {}).hill ?? 'left', W = zone.x1 - zone.x0, has = side !== 'none';
  const hx = side === 'right' ? zone.x1 - W * .2 : zone.x0 + W * .2, hw = W * .42, hh = zone.ground - zone.top;
  const y = x => { if (!has) return zone.ground; const d = Math.abs(x - hx) / hw; return zone.ground - (d < 1 ? hh * (.5 + .5 * Math.cos(d * Math.PI)) : 0); };
  const P = { hilltop: hx, hillside: hx + (side === 'right' ? -1 : 1) * hw * .45, hillfoot: hx + (side === 'right' ? -1 : 1) * hw * .95,
    plain: zone.x0 + W * (side === 'right' ? .3 : .7), plainL: zone.x0 + W * .22, plainR: zone.x1 - W * .22, center: zone.x0 + W / 2, offL: zone.x0 - 160, offR: zone.x1 + 160 };
  if (!has) { P.hilltop = P.center; P.hillside = P.center; P.hillfoot = P.center; }
  // the terrain outline as a path (the kit fills it in its own technique)
  const path = new Path2D(); path.moveTo(zone.x0 - 200, zone.ground + 600); for (let x = zone.x0 - 200; x <= zone.x1 + 200; x += 10) path.lineTo(x, y(x)); path.lineTo(zone.x1 + 200, zone.ground + 600); path.closePath();
  return { y, P, path, hx, hy: y(hx), side };
}
export function actionModel(s, t, zone) {
  const lt = t - s.t0, d = Math.max(3, s.d), u = lt / d, T = terrain(s, zone), figs = [], dots = [], trails = [];
  (s.groups || []).forEach((gr, gi) => {
    const n = clamp(+gr.count || 8, 1, 24), xa = T.P[gr.from] ?? T.P.plain, xb = T.P[gr.to] ?? xa, k = eio(seg(u, gr.start ?? .15, gr.end ?? .85)), dir = xb >= xa ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const jx = (hash(i * 3.7, gi + 1) - .5) * 150, lag = hash(i * 1.9, gi + 4) * .18, kk = clamp((k - lag) / (1 - lag));
      const x = lerp(xa, xb, kk) + jx * (1 - .5 * kk), y = T.y(x) + (hash(i, gi + 9) - .5) * 14, moving = kk > 0 && kk < 1;
      if (gr.mode === 'dots') { dots.push({ x, y: y - 14, col: gr.color || '#c8321f', r: 15 }); if (moving) trails.push({ xa: xa + jx, ya: T.y(xa + jx) - 14, x, y: y - 14, col: gr.color || '#c8321f' }); }
      else figs.push({ x, y, S: zone.S * (.85 + hash(i, gi) * .25), dir: moving ? dir : (i % 2 ? 1 : -1), pose: moving ? (gr.run ? 'run' : 'walk') : 'hold', ph: i * 1.3, fall: 0, run: !!gr.run && moving, side: gi % 2 ? -1 : 1, color: gr.color, flag: i === 0 && gr.banner ? gr.color : null, depth: hash(i, gi) });
    }
    gr._x = lerp(xa, xb, k); gr._y = T.y(gr._x);
  });
  if (s.hero) { const gr = (s.groups || [])[s.hero.group || 0]; if (gr) figs.push({ x: gr._x - 90, y: T.y(gr._x - 90), S: zone.S * 1.05, dir: 1, pose: 'command', ph: 0, fall: 0, side: 1, color: gr.color, prophet: !!s.hero.prophet, hero: true, depth: 2 }); }
  figs.sort((a, b) => a.depth - b.depth);
  return { T, figs, dots, trails, u };
}
// default drawing of the actors (figures in the kit's look; dots with dashed trails and an arrow head)
export function drawActors(g, t, m, look, o = {}) {
  for (const tr of m.trails) { g.save(); g.strokeStyle = tr.col; g.globalAlpha = .6; g.lineWidth = 4; g.setLineDash([10, 12]); g.beginPath(); g.moveTo(tr.xa, tr.ya); g.lineTo(tr.x, tr.y); g.stroke(); g.restore(); }
  for (const d of m.dots) { g.fillStyle = o.dotRing || '#fffaf0'; g.beginPath(); g.arc(d.x, d.y, d.r + 4, 0, TAU); g.fill(); g.fillStyle = d.col; g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill(); }
  for (const f of m.figs) drawFigure(g, f, t, look);
}
// headline at the top, a label on the hill and one per group (registered texts)
export function actionText(g, t, s, box, th, m) {
  const lt = t - s.t0, rv = d => () => { const u = eo(seg(lt, d, d + .45)); return { a: u, dy: (1 - u) * 18 }; }, al = th.align || 'center';
  const hb = s.sub ? box.h * .64 : box.h;
  block(g, 'main', s.headline || '', { x: box.x, y: box.y, w: box.w, h: hb }, { ...th.title, align: al, valign: 'bottom', reveal: rv(.15) });
  if (s.sub) block(g, 'sub', s.sub, { x: box.x, y: box.y + hb + 12, w: box.w, h: box.h - hb - 12 }, { ...th.label, align: al, reveal: rv(.45) });
  const tl = (s.terrain || {}).label; if (tl && m.T.side !== 'none') block(g, 'hill', tl, { x: m.T.hx - 200, y: m.T.hy - 110, w: 400, h: 56 }, { ...(th.side || th.label), align: 'center', layer: 4, reveal: rv(.6) });
  (s.groups || []).forEach((gr, gi) => { if (!gr.label || gr._x == null) return; block(g, 'g' + gi, gr.label, { x: clamp(gr._x - 180, box.x, box.x + box.w - 360), y: Math.min(gr._y + 24, 1196), w: 360, h: 50 }, { ...(th.side || th.label), color: gr.color || (th.side || th.label).color, align: 'center', layer: 5 + gi, reveal: rv(.8 + gi * .3) }); });
}
