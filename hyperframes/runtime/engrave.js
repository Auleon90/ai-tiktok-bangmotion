/* engrave.js — runtime for the Bang Motion style "ukiran-tembaga" (copperplate natural-history plate, our own engine).
   One Canvas 2D, no 3D, no images: every line is a burin stroke that swells and tapers, tone is made of hatching
   families (never grey fills), colour is a transparent watercolour wash laid AFTER the ink, details open in roundels.
   HyperFrames contract: one paused GSAP timeline at window.__timelines["root"]; a single driver tween redraws the canvas
   as a pure function of timeline time (seek-exact, seeded randomness, no Date/Math.random).

   Scene fields (on top of id/type/vo):
     plate    {title, latin, ref}            engraved header (title in caps; latin = italic name; ref = "An-Nahl · 68")
              (missing → headline/title is used as the title)
     subject  {preset, ...opts} | {parts:[...]}   the engraved figure, drawn in a 1080 × 1000 box centred at (540, 980)
              presets: bee, honeycomb, flower, globe, cosmos (opts.split 0..1 = heaven & earth parting), embryo (opts.stage 1..4,
              abstract only, never a face), drop, mountain, sun, tree, moon, seed
     figs     [{x, y, label, note, detail}]   up to 2 roundels with leaders; x,y = point on the figure (box coords, centre 0,0);
              detail: hex | cells | rings | grain | stars | layers | fibers | veins
     wash     false to keep the plate monochrome (default: colour arrives near the end of the scene)
   Generic parts: {k:'ell', x,y,rx,ry,rot, tone:'sphere'|'flat'|'band', v, bands, wash, w}
                  {k:'poly', pts:[[x,y]..], v (0..1 darkness), ang, wash, w}   {k:'line', pts, w}   {k:'dots', x,y,r,n}
   Wash names: amber gold rose leaf sky sea earth night clay ivory */
(function () {
  const P = window.PROPS, NS = { W: 1080, H: 1920 };
  const tl = gsap.timeline({ paused: true });
  const INK = '#1d1610', PAPER = '#efe4cb';
  const WASH = { amber: '#e0a23a', gold: '#d9b24a', rose: '#d98c8c', leaf: '#8fae6a', sky: '#9fb9c8', sea: '#6f9fb3',
    earth: '#a57a4e', night: '#4a5878', clay: '#b9734a', ivory: '#e8dcc0', brown: '#7a5232' };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const prog = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mkr = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const CX = 540, CY = 930, BASE = .8;

  const E = window.ENGRAVE = { tl, presets: {} };

  // ------------------------------------------------------------------ geometry helpers
  const ellPts = (cx, cy, rx, ry, rot = 0, a0 = -Math.PI / 2, a1 = Math.PI * 1.5, n = 120) => {
    const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return p; };
  const inPoly = (x, y, pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const bbox = pts => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; pts.forEach(([x, y]) => { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }); return [a, b, c, d]; };
  const smooth = (pts, n = 24) => { // Catmull-Rom through control points
    if (pts.length < 3) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n; o.push([pts[0][0] + (pts[1][0] - pts[0][0]) * u, pts[0][1] + (pts[1][1] - pts[0][1]) * u]); } return o; }
    const o = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
        o.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } }
    o.push(pts[pts.length - 1]); return o; };

  // tone fields (0 = paper, 1 = darkest); light from upper left
  const sphereTone = (cx, cy, rx, ry, rot, extra) => (x, y) => {
    const dx = x - cx, dy = y - cy, c = Math.cos(-rot), s = Math.sin(-rot);
    const nx = (dx * c - dy * s) / rx, ny = (dx * s + dy * c) / ry, r2 = nx * nx + ny * ny; if (r2 > 1) return -1;
    const nz = Math.sqrt(1 - r2), lit = clamp(-nx * .5 - ny * .6 + nz * .55); let t = clamp(1 - lit * 1.25 + .05);
    return extra ? clamp(t + extra(nx, ny)) : t; };
  const polyTone = (pts, v, grad = .25) => { const [a, b, c, d] = bbox(pts);
    return (x, y) => inPoly(x, y, pts) ? clamp(v + grad * (((x - a) / (c - a || 1)) * .5 + ((y - b) / (d - b || 1)) * .5 - .5)) : -1; };

  // hatching: up to three families switch on by tone thresholds; spacing relative to the figure
  function hatch(box, tone, sp, fams, rnd) {
    const out = []; const [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
    fams.forEach(([ang, th, wm], fi) => { const ca = Math.cos(ang), sa = Math.sin(ang), s = sp * (1 + fi * .15);
      for (let o = -R; o <= R; o += s) { let seg = [];
        const flush = () => { if (seg.length > 3) out.push({ p: seg, w: wm, f: fi }); seg = []; };
        for (let q = -R; q <= R; q += 3) { const x = cx + ca * q - sa * o, y = cy + sa * q + ca * o, v = tone(x, y);
          if (v > th) seg.push([x, y, v]); else flush(); } flush(); } });
    out.forEach(h => h.o = rnd() * .3 + h.f * .28 + ((h.p[0][1] - y0) / (y1 - y0 || 1)) * .3);
    return out; }

  // ------------------------------------------------------------------ drawing
  let X;
  function burin(pts, w, k = 1) { const n = pts.length; if (n < 2 || k <= 0) return; const m = Math.max(2, Math.floor(n * clamp(k)));
    const L = [], R = []; for (let i = 0; i < m; i++) { const u = i / (n - 1), a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, sw = w * (.15 + .85 * Math.pow(Math.sin(Math.PI * u), .7)) / 2;
      L.push([pts[i][0] - dy / d * sw, pts[i][1] + dx / d * sw]); R.push([pts[i][0] + dy / d * sw, pts[i][1] - dx / d * sw]); }
    X.fillStyle = INK; X.beginPath(); X.moveTo(L[0][0], L[0][1]); L.forEach(p => X.lineTo(p[0], p[1])); R.reverse().forEach(p => X.lineTo(p[0], p[1])); X.closePath(); X.fill(); }
  function drawHatch(hs, k) { X.strokeStyle = INK; X.lineCap = 'round';
    hs.forEach(h => { const kk = clamp((k - h.o) / .3); if (kk <= 0) return; const n = h.p.length, m = Math.max(2, Math.floor(n * kk));
      for (let i = 1; i < m; i++) { const u = i / n; X.lineWidth = h.w * (.3 + 2.1 * h.p[i][2]) * (.25 + .75 * Math.pow(Math.sin(Math.PI * u), .6));
        X.beginPath(); X.moveTo(h.p[i - 1][0], h.p[i - 1][1]); X.lineTo(h.p[i][0], h.p[i][1]); X.stroke(); } }); }
  function wash(pts, col, k) { if (k <= 0 || !col) return; X.save(); X.globalCompositeOperation = 'multiply';
    X.globalAlpha = .5 * k; X.fillStyle = WASH[col] || col; X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0] + 4, p[1] + 3) : X.moveTo(p[0] + 4, p[1] + 3)); X.closePath(); X.fill();
    X.globalAlpha = .22 * k; X.lineWidth = 6; X.strokeStyle = WASH[col] || col; X.stroke(); X.restore(); }
  function text(s, x, y, size, font, al = 'center', k = 1, ls = 0, col = INK) { if (k <= 0 || !s) return; X.globalAlpha = clamp(k); X.fillStyle = col;
    X.font = `${size}px ${font}`; X.textAlign = al; X.letterSpacing = ls + 'px'; X.fillText(s, x, y); X.globalAlpha = 1; X.letterSpacing = '0px'; }
  function fitText(s, max, size, font, ls) { X.font = `${size}px ${font}`; X.letterSpacing = ls + 'px'; while (size > 30 && X.measureText(s).width > max) { size -= 4; X.font = `${size}px ${font}`; } X.letterSpacing = '0px'; return size; }

  // roundel details (drawn in a unit circle of radius r around 0,0)
  const DETAIL = {
    hex(r, k, rnd) { const er = r * .66; let n = 0; for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const hx = (i + (j & 1) / 2) * er * .24, hy = j * er * .21, d = Math.hypot(hx, hy) / er; if (d > .97 || ++n / 150 > k * 1.3) continue;
      const rr = er * .12; X.beginPath(); for (let a = 0; a < 6; a++) { const q = a * Math.PI / 3 + Math.PI / 6; X.lineTo(hx + Math.cos(q) * rr * (1 - d * .3), hy + Math.sin(q) * rr); }
      X.closePath(); X.lineWidth = 1 + d * 2.2; X.stroke(); if (d > .45) { X.lineWidth = .8 + d; X.beginPath(); X.moveTo(hx - rr * .6, hy + rr * .2); X.lineTo(hx + rr * .5, hy - rr * .5); X.stroke(); } } },
    cells(r, k, rnd) { for (let i = 0; i < 26 * k; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r * .78, x = Math.cos(a) * d, y = Math.sin(a) * d, cr = r * (.08 + rnd() * .07);
      X.lineWidth = 2; X.beginPath(); X.arc(x, y, cr, 0, 7); X.stroke(); X.beginPath(); X.arc(x + cr * .2, y + cr * .1, cr * .28, 0, 7); X.fillStyle = INK; X.fill(); } },
    rings(r, k) { for (let i = 1; i <= 9; i++) { if (i / 9 > k * 1.2) break; X.lineWidth = 1 + (i % 3 === 0 ? 2 : 0); X.beginPath(); X.ellipse(0, 0, r * .09 * i, r * .085 * i, .1, 0, 7); X.stroke(); } },
    grain(r, k, rnd) { X.fillStyle = INK; for (let i = 0; i < 900 * k; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r * .85, x = Math.cos(a) * d, y = Math.sin(a) * d;
      if (rnd() < .5 + .5 * (x + y) / r) { X.beginPath(); X.arc(x, y, rnd() * 2.2 + .6, 0, 7); X.fill(); } } },
    stars(r, k, rnd) { X.fillStyle = INK; for (let i = 0; i < 160 * k; i++) { const x = (rnd() - .5) * r * 1.7, y = (rnd() - .5) * r * 1.7, s = rnd() < .08 ? 4 : rnd() * 1.8 + .5;
      X.beginPath(); X.arc(x, y, s, 0, 7); X.fill(); if (s > 3) { X.lineWidth = 1.2; X.beginPath(); X.moveTo(x - 12, y); X.lineTo(x + 12, y); X.moveTo(x, y - 12); X.lineTo(x, y + 12); X.stroke(); } } },
    layers(r, k) { for (let i = -6; i <= 6; i++) { if ((i + 6) / 12 > k * 1.2) break; const y = i * r * .13; X.lineWidth = 1.5 + Math.abs(i) * .35;
      X.beginPath(); for (let x = -r; x <= r; x += 8) X.lineTo(x, y + Math.sin(x / 30 + i) * 6); X.stroke(); } },
    fibers(r, k, rnd) { for (let i = 0; i < 40 * k; i++) { const y0 = (rnd() - .5) * r * 1.6; X.lineWidth = 1 + rnd() * 1.5; X.beginPath();
      for (let x = -r; x <= r; x += 10) X.lineTo(x, y0 + Math.sin(x / 40 + i) * 14); X.stroke(); } },
    veins(r, k, rnd) { const br = (x, y, a, l, d) => { if (d > 5 || l < 8) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; X.lineWidth = 5 - d * .8; X.beginPath(); X.moveTo(x, y); X.lineTo(x2, y2); X.stroke();
      br(x2, y2, a - .45 - rnd() * .2, l * .72, d + 1); br(x2, y2, a + .45 + rnd() * .2, l * .72, d + 1); }; if (k > 0) br(0, r * .8, -Math.PI / 2, r * .42 * clamp(k * 1.4), 0); },
  };
  function roundel(cx, cy, r, detail, k, rnd) {
    X.save(); X.translate(cx, cy); X.beginPath(); X.arc(0, 0, r, 0, 7); X.fillStyle = PAPER; X.fill(); X.clip();
    X.strokeStyle = 'rgba(29,22,16,.5)'; X.lineWidth = 1.1; for (let y = -r; y < r; y += 7) { X.beginPath(); X.moveTo(-r, y); X.lineTo(-r + 2 * r * k, y); X.stroke(); }
    X.beginPath(); X.arc(4, 0, r * .8, 0, 7); X.fillStyle = PAPER; X.fill(); X.strokeStyle = INK;
    (DETAIL[detail] || DETAIL.grain)(r, k, rnd); X.restore();
    X.strokeStyle = INK; X.lineWidth = 3.5; X.beginPath(); X.arc(cx, cy, r, 0, 7); X.stroke(); X.lineWidth = 1.2; X.beginPath(); X.arc(cx, cy, r + 9, 0, 7); X.stroke(); }

  // ------------------------------------------------------------------ presets → parts (box coords, centre 0,0, ±540 × ±500)
  const PR = E.presets;
  PR.bee = () => { const p = [];
    [[-1, 1], [1, 1], [-1, 0], [1, 0]].forEach(([s, big]) => { const L = big ? 330 : 230, Hh = big ? 95 : 65, pts = [];
      for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2; pts.push([s * (60 + (1 - Math.cos(a)) / 2 * L), -(big ? 70 : -10) - Math.sin(a) * Hh * (.6 + .4 * Math.sin(a / 2)) - (1 - Math.cos(a)) / 2 * (big ? 150 : 40)]); }
      p.push({ k: 'poly', pts, v: .15, wash: 'sky', w: 4, ang: .3 }); });
    [-1, 1].forEach(s => [[-60, 150, -20, 230, 60], [-10, 175, 90, 250, 200], [40, 160, 200, 215, 330]].forEach(([y0, kx, ky, fx, fy]) =>
      p.push({ k: 'line', pts: smooth([[s * 95, y0], [s * kx, ky], [s * fx, fy]], 10), w: 11 })));
    [-1, 1].forEach(s => p.push({ k: 'line', pts: smooth([[s * 25, -240], [s * 70, -330], [s * 140, -420]], 10), w: 7 }));
    p.push({ k: 'ell', x: 0, y: 210, rx: 150, ry: 215, tone: 'band', bands: 3.2, wash: 'amber', w: 9 });
    p.push({ k: 'ell', x: 0, y: -40, rx: 118, ry: 108, v: .12, wash: 'brown', w: 8, fur: 260 });
    p.push({ k: 'ell', x: 0, y: -185, rx: 92, ry: 70, v: .2, wash: 'brown', w: 7 });
    [-1, 1].forEach(s => p.push({ k: 'ell', x: s * 62, y: -190, rx: 30, ry: 52, rot: s * .2, v: .45, w: 6 }));
    return p; };
  PR.honeycomb = (o = {}) => { const p = [], r = 70, dx = r * Math.sqrt(3), rnd = mkr(77);
    for (let j = -5; j <= 5; j++) for (let i = -3; i <= 3; i++) { const x = i * dx + (j & 1) * dx / 2, y = j * r * 1.5; if (Math.hypot(x, y * 1.05) > 430) continue;
      const pts = []; for (let a = 0; a <= 6; a++) { const q = a * Math.PI / 3 + Math.PI / 6; pts.push([x + Math.cos(q) * r * .92, y + Math.sin(q) * r * .92]); }
      const full = rnd() < (o.fill ?? .6); p.push({ k: 'poly', pts, v: full ? .55 + rnd() * .3 : .05, ang: -.6, wash: full ? 'amber' : 'ivory', w: 5 }); }
    p.push({ k: 'line', pts: smooth([[-40, 380], [-35, 430], [-40, 470]], 8), w: 14 }); p.push({ k: 'ell', x: -40, y: 478, rx: 18, ry: 24, v: .5, wash: 'amber', w: 4 });
    return p; };
  PR.flower = () => { const p = [];
    p.push({ k: 'line', pts: smooth([[0, 60], [-20, 250], [10, 480]], 12), w: 14 });
    p.push({ k: 'poly', pts: smooth([[-10, 300], [-160, 240], [-260, 300], [-140, 340], [-10, 300]], 8), v: .45, wash: 'leaf', w: 5, ang: .8 });
    p.push({ k: 'poly', pts: smooth([[5, 380], [150, 320], [250, 360], [140, 410], [5, 380]], 8), v: .45, wash: 'leaf', w: 5, ang: -.8 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; p.push({ k: 'ell', x: Math.cos(a) * 120, y: -60 + Math.sin(a) * 120, rx: 120, ry: 52, rot: a, v: .12, wash: 'rose', w: 5 }); }
    p.push({ k: 'ell', x: 0, y: -60, rx: 72, ry: 72, tone: 'sphere', v: .25, wash: 'gold', w: 7, stipple: 260 });
    return p; };
  PR.globe = (o = {}) => { const p = [{ k: 'ell', x: 0, y: 0, rx: 330, ry: 330, tone: 'sphere', v: .05, wash: 'sea', w: 9, meridians: 1 }];
    const land = [[[-200, -120], [-90, -190], [10, -120], [-40, -30], [-150, 20], [-230, -40]], [[60, 30], [190, -40], [250, 60], [170, 190], [70, 160]], [[-120, 120], [-40, 150], [-60, 250], [-150, 220]]];
    land.forEach(l => p.push({ k: 'poly', pts: smooth([...l, l[0]], 6), v: .4, wash: 'leaf', w: 4, ang: .7 }));
    if (o.moon) p.push({ k: 'ell', x: 380, y: -330, rx: 70, ry: 70, tone: 'sphere', v: .1, wash: 'ivory', w: 5 });
    return p; };
  PR.cosmos = (o = {}) => { const sp = clamp(o.split ?? 0), p = [];
    p.push({ k: 'dots', x: 0, y: 0, r: 470, n: 700 });
    p.push({ k: 'spiral', x: 0, y: 0, r: 300 * (1 - sp * .5), arms: 3, w: 3 });
    if (sp > 0) { p.push({ k: 'ell', x: 0, y: -260 * sp, rx: 260, ry: 90, tone: 'flat', v: .55, wash: 'night', w: 6 });
      p.push({ k: 'ell', x: 0, y: 260 * sp, rx: 200, ry: 200, tone: 'sphere', v: .15, wash: 'earth', w: 8 }); }
    else p.push({ k: 'ell', x: 0, y: 0, rx: 120, ry: 120, tone: 'sphere', v: .1, wash: 'gold', w: 6, stipple: 600 });
    return p; };
  // embryo stages — abstract forms only (drop, clinging form, chewed lump, bones clothed): never a face
  PR.embryo = (o = {}) => { const st = o.stage || 1, p = [];
    p.push({ k: 'ell', x: 0, y: 0, rx: 360, ry: 380, tone: 'flat', v: .08, wash: 'rose', w: 4 }); // the "resting place"
    if (st === 1) p.push({ k: 'ell', x: 0, y: 0, rx: 70, ry: 90, tone: 'sphere', v: .1, wash: 'ivory', w: 6 });
    if (st === 2) p.push({ k: 'poly', pts: smooth([[-40, -180], [40, -120], [70, 0], [30, 140], [-20, 190], [-30, 60], [-60, -60], [-40, -180]], 8), v: .5, wash: 'clay', w: 7, ang: .9 });
    if (st === 3) { p.push({ k: 'ell', x: 0, y: 0, rx: 140, ry: 190, tone: 'sphere', v: .2, wash: 'clay', w: 8 });
      for (let i = -4; i <= 4; i++) p.push({ k: 'ell', x: -95 + Math.abs(i) * 8, y: i * 38, rx: 22, ry: 15, tone: 'sphere', v: .3, w: 3 }); }
    if (st >= 4) { p.push({ k: 'poly', pts: smooth([[30, -230], [150, -150], [170, 40], [80, 200], [-60, 220], [-140, 90], [-120, -60], [-40, -180], [30, -230]], 8), v: .2, wash: 'rose', w: 8, ang: .6 });
      p.push({ k: 'line', pts: smooth([[0, -170], [-90, -40], [-80, 110], [10, 190]], 14), w: 10 });
      for (let i = 0; i < 9; i++) { const u = i / 8, a = -2.2 + u * 2.6; p.push({ k: 'line', pts: smooth([[Math.cos(a) * 110 - 20, Math.sin(a) * 160], [Math.cos(a) * 140 - 10, Math.sin(a) * 175]], 4), w: 5 }); } }
    return p; };
  PR.drop = () => [{ k: 'poly', pts: smooth([[0, -330], [110, -80], [170, 90], [100, 230], [0, 260], [-100, 230], [-170, 90], [-110, -80], [0, -330]], 10), v: .42, wash: 'amber', w: 8, ang: .5 },
    { k: 'ell', x: -60, y: 80, rx: 30, ry: 60, rot: .3, tone: 'flat', v: 0, w: 3 }];
  PR.mountain = () => { const p = [];
    p.push({ k: 'poly', pts: [[-540, 300], [-300, -180], [-180, -60], [20, -330], [230, -40], [360, -170], [540, 300]], v: .35, wash: 'earth', w: 8, ang: -.9 });
    p.push({ k: 'poly', pts: [[-540, 480], [-380, 200], [-150, 330], [100, 150], [330, 320], [540, 230], [540, 480]], v: .55, wash: 'leaf', w: 7, ang: .9 });
    p.push({ k: 'line', pts: smooth([[-60, -230], [20, -330], [100, -230]], 6), w: 5 });
    return p; };
  PR.sun = () => { const p = [{ k: 'ell', x: 0, y: 0, rx: 180, ry: 180, tone: 'sphere', v: .05, wash: 'gold', w: 9, stipple: 300 }];
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, l = i % 2 ? 330 : 400; p.push({ k: 'line', pts: smooth([[Math.cos(a) * 220, Math.sin(a) * 220], [Math.cos(a + .05) * l, Math.sin(a + .05) * l]], 6), w: i % 2 ? 5 : 8 }); }
    return p; };
  PR.moon = () => [{ k: 'ell', x: 0, y: 0, rx: 300, ry: 300, tone: 'sphere', v: .15, wash: 'ivory', w: 8, craters: 14 }];
  PR.tree = () => { const p = [{ k: 'poly', pts: [[-50, 470], [-35, 40], [35, 40], [60, 470]], v: .45, wash: 'earth', w: 8, ang: 1.4 }];
    [[-170, -120, 200], [150, -90, 190], [0, -280, 210], [-60, 0, 170], [110, 30, 150]].forEach(([x, y, r]) => p.push({ k: 'ell', x, y, rx: r, ry: r * .82, tone: 'sphere', v: .2, wash: 'leaf', w: 6 }));
    return p; };
  PR.seed = () => [{ k: 'ell', x: 0, y: 40, rx: 150, ry: 210, rot: .2, tone: 'sphere', v: .15, wash: 'earth', w: 9 },
    { k: 'line', pts: smooth([[20, -160], [60, -300], [10, -420]], 10), w: 10 }, { k: 'poly', pts: smooth([[10, -420], [-130, -470], [-200, -400], [-80, -380], [10, -420]], 6), v: .4, wash: 'leaf', w: 5 }];

  // ------------------------------------------------------------------ compile a scene into drawable plates
  function compile(parts, rnd) {
    return parts.map((q, idx) => {
      const o = { q, idx };
      if (q.k === 'ell') { const rot = q.rot || 0; o.outline = ellPts(q.x, q.y, q.rx, q.ry, rot);
        let tone; if (q.tone === 'flat') tone = polyTone(o.outline, q.v ?? .2, .3);
        else if (q.tone === 'band') tone = sphereTone(q.x, q.y, q.rx, q.ry, rot, (nx, ny) => Math.sin((ny + 1) * Math.PI * (q.bands || 3)) > .3 ? .5 : -.1);
        else tone = sphereTone(q.x, q.y, q.rx, q.ry, rot, () => q.v ?? .1);
        const sp = clamp(Math.max(q.rx, q.ry) / 18, 7, 14);
        o.hs = hatch([q.x - q.rx * 1.05, q.y - q.ry * 1.05, q.x + q.rx * 1.05, q.y + q.ry * 1.05], tone, sp, [[-.35 + idx * .3, .32, 1], [.9 + idx * .2, .62, .8], [1.9, .86, .6]], rnd);
        if (q.fur) { o.fur = []; for (let i = 0; i < q.fur; i++) { const a = rnd() * 6.28, r0 = .92 + rnd() * .12, x = q.x + Math.cos(a) * q.rx * r0, y = q.y + Math.sin(a) * q.ry * r0, l = 10 + rnd() * 16, b = a + (rnd() - .5) * .6; o.fur.push([x, y, x + Math.cos(b) * l, y + Math.sin(b) * l]); } }
        if (q.stipple) { o.dots = []; for (let i = 0; i < q.stipple; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()), x = q.x + Math.cos(a) * d * q.rx * .95, y = q.y + Math.sin(a) * d * q.ry * .95; if (tone(x, y) > .25 + rnd() * .5) o.dots.push([x, y, rnd() * 2 + .8]); } }
        if (q.craters) { o.craters = []; for (let i = 0; i < q.craters; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * .8; o.craters.push([q.x + Math.cos(a) * d * q.rx, q.y + Math.sin(a) * d * q.ry, 12 + rnd() * 34]); } }
        if (q.meridians) { o.mer = []; for (let i = 1; i < 6; i++) { const f = Math.cos(i / 6 * Math.PI); o.mer.push(ellPts(q.x, q.y, q.rx * Math.abs(f) + .1, q.ry, 0, -Math.PI / 2, Math.PI / 2, 40).map(([x, y]) => [f < 0 ? 2 * q.x - x : x, y])); o.mer.push(ellPts(q.x, q.y + q.ry * Math.cos(i / 6 * Math.PI), q.rx * Math.sin(i / 6 * Math.PI), q.ry * .12 * Math.sin(i / 6 * Math.PI), 0, 0, Math.PI, 40)); } }
      } else if (q.k === 'poly') { o.outline = q.pts.concat([q.pts[0]]); const [a, b, c, d] = bbox(q.pts), ang = q.ang ?? .7;
        const sp = clamp(Math.max(c - a, d - b) / 40, 6, 12);
        o.hs = (q.v ?? .2) > .05 ? hatch([a, b, c, d], polyTone(q.pts, q.v ?? .2), sp, [[ang, .3, .9], [ang + 1.2, .55, .75], [ang + 2.2, .8, .55]], rnd) : [];
      } else if (q.k === 'line') { o.line = q.pts;
      } else if (q.k === 'dots') { o.dots = []; for (let i = 0; i < q.n; i++) { const a = rnd() * 6.28, d = Math.pow(rnd(), .7) * q.r; o.dots.push([q.x + Math.cos(a) * d, q.y + Math.sin(a) * d * .9, rnd() < .04 ? 4 : rnd() * 1.8 + .4]); }
      } else if (q.k === 'spiral') { o.arms = []; for (let a = 0; a < q.arms; a++) { const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80, th = a / q.arms * Math.PI * 2 + u * 4.2, r = u * q.r; pts.push([q.x + Math.cos(th) * r, q.y + Math.sin(th) * r * .6]); } o.arms.push(pts); } }
      return o; }); }

  // ------------------------------------------------------------------ paper (pre-rendered once)
  function paper() { const c = document.createElement('canvas'); c.width = NS.W; c.height = NS.H; const x = c.getContext('2d'), r = mkr(3);
    x.fillStyle = PAPER; x.fillRect(0, 0, NS.W, NS.H);
    for (let i = 0; i < 26000; i++) { x.fillStyle = `rgba(90,60,20,${r() * .05})`; x.fillRect(r() * NS.W, r() * NS.H, r() * 6 + 1, 1); }
    for (let y = 0; y < NS.H; y += 7) { x.fillStyle = 'rgba(120,90,40,.025)'; x.fillRect(0, y, NS.W, 1); }
    for (let i = 0; i < 18; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(150,100,40,.12)'); g.addColorStop(1, 'rgba(150,100,40,0)'); x.save(); x.translate(r() * NS.W, r() * NS.H); x.fillStyle = g; x.fillRect(-30, -30, 60, 60); x.restore(); }
    const v = x.createRadialGradient(540, 960, 600, 540, 960, 1450); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,35,10,.3)'); x.fillStyle = v; x.fillRect(0, 0, NS.W, NS.H);
    // plate mark + ruled border (constant across the whole film)
    x.strokeStyle = 'rgba(29,22,16,.35)'; x.lineWidth = 2; x.strokeRect(46, 56, NS.W - 92, NS.H - 112);
    x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(80, 95, NS.W - 160, NS.H - 190); x.lineWidth = 1.3; x.strokeRect(92, 107, NS.W - 184, NS.H - 214);
    return c; }

  // ------------------------------------------------------------------ run
  E.run = function (K = {}) {
    const cv = document.getElementById('plate'); X = cv.getContext('2d'); const bg = paper();
    const T = P.totalMs / 1000;
    const plates = P.scenes.map((s, i) => { const rnd = mkr(101 + i * 7919); const sub = s.subject || {};
      const parts = sub.parts || (PR[sub.preset] ? PR[sub.preset](sub) : PR.drop());
      const title = (s.plate && s.plate.title) || String(s.headline || s.title || '').replace(/\*/g, '');
      return { s, i, t0: s.startMs / 1000, d: s.durationMs / 1000, P: compile(parts, rnd), rnd: mkr(555 + i), title, figs: (s.figs || []).slice(0, 2),
        sc: (sub.scale || 1) * BASE, roman: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'][i] || String(i + 1) }; });

    function drawPlate(pl, t, alpha) {
      const d = pl.d, u = (t - pl.t0) / d; if (alpha <= 0) return; X.save(); X.globalAlpha = alpha;
            const f = (a, b) => prog(u, a, b);
      // header
      const ttl = String(pl.title).toUpperCase() + '.'; const ts = fitText(ttl, 860, 84, '"Cormorant", Georgia, serif', 5);
      text(K.gallery || 'MUSEUM ALAM · PLAT KAJIAN', 116, 160, 22, '"Cormorant", Georgia, serif', 'left', f(0, .12) * alpha, 4);
      text('PL. ' + pl.roman + '.', NS.W - 116, 160, 26, '"Cormorant", Georgia, serif', 'right', f(0, .12) * alpha, 3);
      X.globalAlpha = alpha; text(ttl, 540, 290, ts, '"Cormorant", Georgia, serif', 'center', f(.02, .16), 5);
      const pp = pl.s.plate || {};
      if (pp.latin) { X.globalAlpha = f(.06, .2) * alpha; X.fillStyle = INK; X.font = 'italic 42px "Cormorant", Georgia, serif'; X.textAlign = 'center'; X.fillText(pp.latin, 540, 352); X.globalAlpha = alpha; }
      if (pp.ref) text('— ' + pp.ref + ' —', 540, 402, 26, '"Cormorant", Georgia, serif', 'center', f(.08, .22) * alpha, 2);
      // figure: slow push, 1 → 1.05
      const z = (1 + .05 * u) * pl.sc; X.save(); X.translate(CX, CY); X.scale(z, z);
      const kC = f(.04, .32), kH = f(.18, .62), kW = pl.s.wash === false ? 0 : f(.62, .8);
      pl.P.forEach(o => { if (o.outline && o.q.wash) wash(o.outline, o.q.wash, kW); });
      pl.P.forEach((o, n) => { const q = o.q, lag = n / Math.max(pl.P.length, 1);
        const kc = clamp((kC - lag * .5) / .5);
        if (o.dots && q.k === 'dots') { X.fillStyle = INK; const m = o.dots.length * kc; for (let i = 0; i < m; i++) { const [x, y, r] = o.dots[i]; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); } }
        if (o.arms) o.arms.forEach(a => burin(a, q.w || 3, kc));
        if (o.hs) drawHatch(o.hs, kH * 1.65 - lag * .2);
        if (o.mer) { X.strokeStyle = INK; X.lineWidth = 1.4; o.mer.forEach(m => { const k = clamp(kH * 1.3); X.beginPath(); m.slice(0, Math.floor(m.length * k)).forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.stroke(); }); }
        if (o.craters) o.craters.forEach(([x, y, r], i) => { if (i / o.craters.length > kH * 1.4) return; burin(ellPts(x, y, r, r * .8, 0, Math.PI * .1, Math.PI * 1.3, 30), 4, 1); });
        if (o.dots && q.k !== 'dots') { X.fillStyle = INK; const m = o.dots.length * clamp(kH * 1.4); for (let i = 0; i < m; i++) { const [x, y, r] = o.dots[i]; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); } }
        if (o.fur) { X.strokeStyle = INK; X.lineWidth = 1.6; const m = o.fur.length * f(.4, .58); for (let i = 0; i < m; i++) { const r = o.fur[i]; X.beginPath(); X.moveTo(r[0], r[1]); X.lineTo(r[2], r[3]); X.stroke(); } }
        if (o.outline) burin(o.outline, q.w || 7, kc);
        if (o.line) burin(o.line, q.w || 8, kc); });
      X.restore();
      // roundels
      pl.figs.forEach((g, gi) => { const a0 = .5 + gi * .14, lk = f(a0, a0 + .08), rk = f(a0 + .05, a0 + .2); if (lk <= 0) return;
        const side = (g.side || (g.x > 0 ? 'right' : 'left')) === 'right' ? 1 : -1;
        const rx = 540 + side * 290, ry = gi ? 1180 : 590, R = 135, px = CX + g.x * z, py = CY + g.y * z;
        const ex = rx - side * R * .72, ey = ry + (py > ry ? R * .72 : -R * .2);
        X.strokeStyle = INK; X.lineWidth = 1.4; X.beginPath(); X.moveTo(px, py); X.lineTo(px + (ex - px) * lk, py + (ey - py) * lk); X.stroke();
        X.fillStyle = INK; X.beginPath(); X.arc(px, py, 5, 0, 7); X.fill(); 
        X.font = 'italic 26px "Cormorant", Georgia, serif'; X.textAlign = 'left'; X.globalAlpha = lk * alpha; X.fillText(String(gi + 1), px + 12, py - 10); X.globalAlpha = alpha;
        if (rk > 0) { X.save(); X.translate(rx, ry); X.scale(.4 + .6 * rk, .4 + .6 * rk); X.globalAlpha = clamp(rk * 2) * alpha; roundel(0, 0, R, g.detail, rk, mkr(900 + pl.i * 13 + gi)); X.restore(); X.globalAlpha = alpha;
          const lx = clamp(rx, 300, 780), ly = ry + R + 50, lab = ('FIG. ' + (gi + 1) + ' · ' + (g.label || '')).toUpperCase(), ls = fitText(lab, 330, 24, '"Cormorant", Georgia, serif', 3);
          const ka = f(a0 + .1, a0 + .2) * alpha; if (ka > 0) { X.globalAlpha = ka * .82; X.fillStyle = PAPER; X.fillRect(lx - 180, ly - 30, 360, g.note ? 90 : 44); X.globalAlpha = alpha; }
          text(lab, lx, ly, ls, '"Cormorant", Georgia, serif', 'center', f(a0 + .12, a0 + .22) * alpha, 3);
          if (g.note) { X.globalAlpha = f(a0 + .15, a0 + .26) * alpha; X.fillStyle = INK; X.font = 'italic 34px "Cormorant", Georgia, serif'; X.textAlign = 'center'; X.fillText(g.note, lx, ly + 42); X.globalAlpha = alpha; } } });
      X.restore(); }

    // driver: a function property, so GSAP calls the setter on every render, even on seeks that suppress events
    const drv = { t: 0, at(v) { if (v === undefined) return this.t; this.t = v; draw(); } };
    const draw = () => { const t = drv.t; X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.drawImage(bg, 0, 0);
      plates.forEach(pl => { const a = pl.t0 === 0 ? 1 : clamp((t - pl.t0) / .35), b = clamp((pl.t0 + pl.d + .25 - t) / .35); const al = Math.min(a, b);
        if (t >= pl.t0 - .01 && t <= pl.t0 + pl.d + .3) drawPlate(pl, t, al); });
      X.globalAlpha = .7; X.fillStyle = INK; X.font = 'italic 22px "Cormorant", Georgia, serif'; X.textAlign = 'left'; X.fillText(K.del || 'Bang del.', 116, NS.H - 128);
      X.textAlign = 'right'; X.fillText(K.sculp || 'sculp.', NS.W - 116, NS.H - 128); X.globalAlpha = 1; };
    tl.fromTo(drv, { at: 0 }, { at: T, duration: T, ease: 'none' }, 0);
    draw();
    if (P.words && window.BM) BM.captions(tl, document.getElementById('caps'), P.words, { accent: K.capAccent || '#9a5a12', text: INK, maxWords: 3 });
    return tl; };
})();
