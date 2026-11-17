// "action" scene for landscape kits: the story acted out on a field instead of a pasted photo.
// A side view of a terrain + features, and groups of faceless figures (or coordinate dots with trails) doing something there.
//
// Storyboard:
//   { "type": "action", "headline": "...", "sub": "...",
//     "terrain": { "kind": "hill" | "dunes" | "plain", "hill": "left" | "right", "label": "Jabal Rumat",
//                  "features": [ { "type": "well" | "cave" | "city" | "trench" | "river" | "sea", "at": "<place>" | 0..1,
//                                  "name": "<place name>", "label": "<on-screen label>", "side": "left"|"right" (sea),
//                                  "split": [0.3, 0.6] (sea: parts between these scene fractions) } ] },
//     "groups": [ { "label": "...", "count": 10, "color": "#2f6b3a", "mode": "figures" | "dots",
//                   "act": "move" | "gather" | "scatter" | "surround" | "rows" | "wait" | "follow",
//                   "from": "<place>", "to": "<place>", "via": ["<place>", ...], "at": "<place>",
//                   "start": .15, "end": .85, "run": false, "banner": false, "route": true, "leader": 0 } ],
//     "hero": { "group": 0, "prophet": true } }
// Places: hilltop, hillside, hillfoot, plain, plainL, plainR, center, offL, offR, every feature's name (or its type),
// or a number 0..1 across the frame. Acts:
//   move — walk from → (via …) → to, pausing at each waypoint;  gather — converge into a tight group at `to`;
//   scatter — break apart from `from`;  surround — close in around `to` from both sides;  rows — stand in rows at `at` (e.g. prayer lines);
//   wait — stand at `at`;  follow — trail group `leader` a little behind.
import { clamp, lerp, seg, eo, eio, ss, hash, TAU, block } from './kit.js';
import { drawFigure } from './clash.js';

// zone: { x0, x1, ground (plain y), top (highest point a hill may reach), S (figure height) }
export function terrain(s, zone, u = 1) {
  const TR = s.terrain || {}, kind = TR.kind || (TR.hill === 'none' ? 'plain' : 'hill'), side = TR.hill === 'right' ? 'right' : 'left', Wd = zone.x1 - zone.x0;
  const hx = side === 'right' ? zone.x1 - Wd * .2 : zone.x0 + Wd * .2, hw = Wd * .42, hh = zone.ground - zone.top;
  const P = { plain: zone.x0 + Wd * (side === 'right' ? .3 : .7), plainL: zone.x0 + Wd * .22, plainR: zone.x1 - Wd * .22, center: zone.x0 + Wd / 2, offL: zone.x0 - 170, offR: zone.x1 + 170 };
  if (kind === 'hill') Object.assign(P, { hilltop: hx, hillside: hx + (side === 'right' ? -1 : 1) * hw * .45, hillfoot: hx + (side === 'right' ? -1 : 1) * hw * .95 });
  else Object.assign(P, { hilltop: P.center, hillside: P.center, hillfoot: P.center });
  const at = a => typeof a === 'number' ? zone.x0 + Wd * a : (P[a] ?? P.center);
  const F = (TR.features || []).map(f => ({ ...f, x: at(f.at ?? f.type) }));
  F.forEach(f => { P[f.name || f.type] = f.x; });
  let base = x => {
    if (kind === 'hill') { const d = Math.abs(x - hx) / hw; return zone.ground - (d < 1 ? hh * (.5 + .5 * Math.cos(d * Math.PI)) : 0); }
    if (kind === 'dunes') return zone.ground - hh * .28 * (.5 + .5 * Math.sin((x - zone.x0) / Wd * Math.PI * 3.2 + 1)) * (.6 + .4 * Math.sin(x * .004));
    return zone.ground;
  };
  // trenches and riverbeds cut into the ground
  const cuts = F.filter(f => f.type === 'trench' || f.type === 'river');
  const y = x => { let v = base(x); for (const f of cuts) { const w = f.type === 'trench' ? 70 : 110, d = Math.abs(x - f.x) / w; if (d < 1) v += (f.type === 'trench' ? 90 : 40) * Math.pow(1 - d * d, .6); } return v; };
  const strip = (x0, x1, fy, depth = 900) => { const p = new Path2D(); p.moveTo(x0, depth + zone.ground); for (let x = x0; x <= x1; x += 8) p.lineTo(x, fy(x)); p.lineTo(x1, depth + zone.ground); p.closePath(); return p; };
  const layers = [{ kind: 'ground', path: strip(zone.x0 - 220, zone.x1 + 220, y) }];
  for (const f of F) {
    if (f.type === 'trench') { const p = new Path2D(); p.moveTo(f.x - 70, base(f.x - 70)); for (let x = f.x - 70; x <= f.x + 70; x += 6) p.lineTo(x, y(x)); p.closePath(); layers.push({ kind: 'dark', path: p }); }
    if (f.type === 'river') { const p = new Path2D(); p.moveTo(f.x - 110, base(f.x - 110) + 4); for (let x = f.x - 110; x <= f.x + 110; x += 6) p.lineTo(x, Math.min(y(x), base(x) + 14)); for (let x = f.x + 110; x >= f.x - 110; x -= 6) p.lineTo(x, y(x) + 2); p.closePath(); layers.push({ kind: 'water', path: p }); }
    if (f.type === 'sea') {   // water from the frame edge to f.x, parting into two walls between split[0..1]
      const L = f.side === 'left', e0 = L ? zone.x0 - 220 : f.x, e1 = L ? f.x : zone.x1 + 220, sp = f.split ? eio(seg(u, f.split[0], f.split[1] ?? f.split[0] + .3)) : 0, mid = (e0 + e1) / 2, gap = sp * Math.min(140, (e1 - e0) * .3);
      const top = zone.ground - 30, wave = x => top + 8 * Math.sin(x * .03 + u * 20);
      const water = (a, b, rise) => { const p = new Path2D(), bot = zone.ground + 80; p.moveTo(a, bot); for (let x = a; x <= b; x += 8) { const edge = Math.min(Math.abs(x - (mid - gap)), Math.abs(x - (mid + gap))); p.lineTo(x, wave(x) - rise * Math.exp(-edge / 90)); } p.lineTo(b, bot); p.closePath(); return p; };   // a sheet of water down to just below the ground line; it parts into two walls
      if (sp < .02) layers.push({ kind: 'water', path: water(e0, e1, 0) });
      else { layers.push({ kind: 'water', path: water(e0, mid - gap, 260 * sp) }, { kind: 'water', path: water(mid + gap, e1, 260 * sp) }); P[(f.name || 'sea') + 'Path'] = mid; }
      P[f.name || 'sea'] = mid;
    }
    if (f.type === 'well') { const gy = y(f.x), p = new Path2D(); p.rect(f.x - 34, gy - 46, 68, 46); p.moveTo(f.x - 44, gy - 46); p.lineTo(f.x + 44, gy - 46); p.lineTo(f.x + 44, gy - 54); p.lineTo(f.x - 44, gy - 54); p.closePath(); p.rect(f.x - 30, gy - 120, 6, 70); p.rect(f.x + 24, gy - 120, 6, 70); p.rect(f.x - 36, gy - 126, 72, 8); layers.push({ kind: 'structure', path: p }); }
    if (f.type === 'cave') { const gy = y(f.x), p = new Path2D(); p.moveTo(f.x - 60, gy); p.quadraticCurveTo(f.x - 60, gy - 120, f.x, gy - 120); p.quadraticCurveTo(f.x + 60, gy - 120, f.x + 60, gy); p.closePath(); layers.push({ kind: 'dark', path: p }); }
    if (f.type === 'city') { const p = new Path2D(), n = f.size || 5; for (let k = 0; k < n; k++) { const bx = f.x + (k - (n - 1) / 2) * 62, h = 70 + hash(k, 3) * 90, gy = y(bx); p.rect(bx - 28, gy - h, 56, h); if (k % 2) { p.moveTo(bx - 32, gy - h); p.lineTo(bx, gy - h - 34); p.lineTo(bx + 32, gy - h); p.closePath(); } }
      const wl = new Path2D(); wl.rect(f.x - n * 31 - 20, y(f.x) - 40, n * 62 + 40, 40); layers.push({ kind: 'structure', path: p }, { kind: 'structure', path: wl }); }
  }
  return { y, P, at, layers, path: layers[0].path, F, hx, hy: y(hx), side, kind };
}

// position along from → via… → to with a pause at each waypoint
function along(xs, k, pause = .25) {
  const n = xs.length - 1; if (n <= 0) return xs[0]; const per = 1 / n, i = Math.min(n - 1, Math.floor(k / per)), f = (k - i * per) / per;
  return lerp(xs[i], xs[i + 1], ss(clamp(f / (1 - pause * (i < n - 1 ? 1 : 0)))));
}
export function actionModel(s, t, zone) {
  const lt = t - s.t0, d = Math.max(3, s.d), u = lt / d, T = terrain(s, zone, u), figs = [], dots = [], trails = [], routes = [];
  const G = s.groups || [];
  G.forEach((gr, gi) => {
    const act = gr.act || 'move', n = clamp(+gr.count || 8, 1, 24), k = eio(seg(u, gr.start ?? .15, gr.end ?? .85));
    let xs = [gr.from ?? gr.at ?? 'plain', ...(gr.via || []), gr.to ?? gr.from ?? gr.at ?? 'plain'].map(T.at);
    if (act === 'follow' && G[gr.leader || 0]) { const L = G[gr.leader || 0]; xs = [L.from ?? 'plain', ...(L.via || []), L.to ?? L.from ?? 'plain'].map(T.at); }
    if (gr.route && xs.length > 1) routes.push({ xs, col: gr.color || '#c8321f', y: T.y });
    const lagAll = act === 'follow' ? .12 : 0;
    for (let i = 0; i < n; i++) {
      const hj = hash(i * 3.7, gi + 1) - .5, lag = hash(i * 1.9, gi + 4) * .18, kk = clamp((k - lag - lagAll) / (1 - lag - lagAll));
      let x, moving = false, pose = 'hold', dir = 1;
      if (act === 'rows' || act === 'wait') {
        const cx = T.at(gr.at ?? gr.to ?? 'plain'), per = act === 'rows' ? Math.ceil(n / 2) : n, col = i % per, row = Math.floor(i / per);
        x = cx + (col - (per - 1) / 2) * (act === 'rows' ? 52 : 70) + (act === 'wait' ? hj * 30 : 0) + row * 18; dir = gr.face === 'left' ? -1 : 1;
        const yy = T.y(x) - row * 26; figs.push({ x, y: yy, S: zone.S * (row ? .88 : 1), dir, pose: gr.pose || 'hold', ph: i, fall: 0, side: 1, color: gr.color, depth: -row, run: false });
        continue;
      }
      if (act === 'gather' || act === 'scatter' || act === 'surround') {
        const cx = T.at(act === 'scatter' ? (gr.from ?? gr.at ?? 'center') : (gr.to ?? gr.at ?? 'center')), wide = 360 + Math.abs(hj) * 200, tight = 26 + Math.abs(hj) * 70;
        const sgn = act === 'surround' ? (i % 2 ? 1 : -1) : Math.sign(hj || .1), r = act === 'scatter' ? lerp(tight, wide, kk) : lerp(wide, act === 'surround' ? 120 + Math.abs(hj) * 60 : tight, kk);
        x = cx + sgn * r; moving = kk > 0 && kk < 1; dir = act === 'scatter' ? sgn : -sgn;
      } else {   // move / follow along the route
        x = along(xs, kk) + hj * 150 * (1 - .4 * kk); moving = kk > 0 && kk < 1 && Math.abs(along(xs, Math.min(1, kk + .01)) - along(xs, kk)) > .5; dir = xs[xs.length - 1] >= xs[0] ? 1 : -1;
      }
      const y = T.y(x) + (hash(i, gi + 9) - .5) * 12;
      if (gr.mode === 'dots') { dots.push({ x, y: y - 14, col: gr.color || '#c8321f', r: 15 }); if (moving && act !== 'scatter') trails.push({ xa: xs[0] + hj * 150, ya: T.y(xs[0] + hj * 150) - 14, x, y: y - 14, col: gr.color || '#c8321f' }); }
      else figs.push({ x, y, S: zone.S * (.85 + hash(i, gi) * .25), dir: moving ? dir : (i % 2 ? 1 : -1), pose: moving ? (gr.run ? 'run' : 'walk') : (gr.pose || 'hold'), ph: i * 1.3, fall: 0, run: !!gr.run && moving, side: gi % 2 ? -1 : 1, color: gr.color, flag: i === 0 && gr.banner ? gr.color : null, depth: hash(i, gi) });
    }
    gr._x = act === 'rows' || act === 'wait' ? T.at(gr.at ?? gr.to ?? 'plain') : act === 'gather' || act === 'surround' ? T.at(gr.to ?? gr.at ?? 'center') : act === 'scatter' ? T.at(gr.from ?? 'center') : along(xs, k); gr._y = T.y(gr._x);
  });
  if (s.hero) { const gr = G[s.hero.group || 0]; if (gr) figs.push({ x: gr._x - 90, y: T.y(gr._x - 90), S: zone.S * 1.05, dir: 1, pose: 'command', ph: 0, fall: 0, side: 1, color: gr.color, prophet: !!s.hero.prophet, hero: true, depth: 2 }); }
  figs.sort((a, b) => a.depth - b.depth);
  return { T, figs, dots, trails, routes, u };
}
// draw the terrain layers through the kit's own fill (fill(g, path, kind) with kind ground | water | dark | structure)
export function drawTerrain(g, m, fill) { for (const L of m.T.layers) fill(g, L.path, L.kind); }
// default drawing of the actors (figures in the kit's look; dots with dashed trails; dashed routes with stop rings)
export function drawActors(g, t, m, look, o = {}) {
  for (const r of m.routes) { g.save(); g.strokeStyle = r.col; g.globalAlpha = .5; g.lineWidth = 4; g.setLineDash([4, 12]); g.lineCap = 'round'; g.beginPath(); for (let k = 0; k < r.xs.length - 1; k++) { const a = r.xs[k], b = r.xs[k + 1]; for (let q = 0; q <= 20; q++) { const x = lerp(a, b, q / 20); (k || q) ? g.lineTo(x, r.y(x) - 40) : g.moveTo(x, r.y(x) - 40); } } g.stroke(); g.setLineDash([]); g.globalAlpha = .9; g.lineWidth = 4; for (const x of r.xs) { g.beginPath(); g.arc(x, r.y(x) - 40, 12, 0, TAU); g.stroke(); } g.restore(); }
  for (const tr of m.trails) { g.save(); g.strokeStyle = tr.col; g.globalAlpha = .6; g.lineWidth = 4; g.setLineDash([10, 12]); g.beginPath(); g.moveTo(tr.xa, tr.ya); g.lineTo(tr.x, tr.y); g.stroke(); g.restore(); }
  for (const d of m.dots) { g.fillStyle = o.dotRing || '#fffaf0'; g.beginPath(); g.arc(d.x, d.y, d.r + 4, 0, TAU); g.fill(); g.fillStyle = d.col; g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill(); }
  for (const f of m.figs) drawFigure(g, f, t, look);
}
// headline at the top; labels on the hill, the features and each group (registered texts)
export function actionText(g, t, s, box, th, m) {
  const lt = t - s.t0, rv = d => () => { const u = eo(seg(lt, d, d + .45)); return { a: u, dy: (1 - u) * 18 }; }, al = th.align || 'center', lab = th.side || th.label;
  const hb = s.sub ? box.h * .64 : box.h;
  block(g, 'main', s.headline || '', { x: box.x, y: box.y, w: box.w, h: hb }, { ...th.title, align: al, valign: 'bottom', reveal: rv(.15) });
  if (s.sub) block(g, 'sub', s.sub, { x: box.x, y: box.y + hb + 12, w: box.w, h: box.h - hb - 12 }, { ...th.label, align: al, reveal: rv(.45) });
  const X0 = box.x, X1 = box.x + box.w, used = [];
  const put = (id, text, x, y, col, layer) => { let yy = Math.max(box.y + box.h + 20, Math.min(y, 1196)); for (const u0 of used) if (Math.abs(u0.y - yy) < 52 && Math.abs(u0.x - x) < 340) yy = u0.y - 56; used.push({ x, y: yy });
    block(g, id, text, { x: clamp(x - 170, X0, X1 - 340), y: yy, w: 340, h: 48 }, { ...lab, color: col || lab.color, align: 'center', layer, reveal: rv(.6) }); };
  const tl = (s.terrain || {}).label; if (tl && m.T.kind === 'hill') put('hill', tl, m.T.hx, m.T.hy - 100, null, 4);
  m.T.F.forEach((f, k) => { if (f.label) put('f' + k, f.label, f.x, m.T.y(f.x) - (f.type === 'city' ? 230 : 160), null, 4); });
  (s.groups || []).forEach((gr, gi) => { if (gr.label && gr._x != null) put('g' + gi, gr.label, clamp(gr._x, X0 + 170, X1 - 170), gr._y + 24, gr.color, 5 + gi); });
}
