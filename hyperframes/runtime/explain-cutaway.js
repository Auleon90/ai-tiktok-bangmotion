/* explain-cutaway.js — preset "street" for the kartun-cutaway page (EXPLAIN runtime, full-frame 1080×1920).
   A flat cartoon street with a scooter and a faceless helmeted rider; the camera moves over the world (keys), and an X-ray
   "torn hole" opens into the fuel tank to show what happens inside. All motion = f(scene time) (HyperFrames-safe).
   Scene field "diagram": {preset:"street",
     cam:[[f,x,y,z],...]   camera keys (f = 0..1 of the scene; x,y = world point shown at screen (540,860); z = zoom). Wide = [0,540,1000,1]
     ride:true             road, buildings and wheels move;  sputter:true  scooter shakes + smoke puffs
     icon:"gauge-low"|"gauge-full"|"warn"|"check"   overlay top-right
     xray:{at:0..1 (0 = already open), fuel:[from,to] (0..1), heat:bool, sediment:n, suck:bool, labels:true}}
   World: road top y 1080, scooter wheels at y 1180, fuel tank inside the rear body at (465,1045). Original design (not a copy of any channel). */
(function () {
  const E = window.EXPLAIN, el = E.el, U = E.util, { clamp, lerp } = U;
  const K = { sky1: '#9fd6ee', sky2: '#e3f3f8', road: '#4a4f58', side: '#a3a9b1', curb: '#d9dce0', dash: '#f5f5f5', ink: '#1c232e',
    body: '#e8553d', body2: '#bf3f2b', seat: '#2a2f3a', floor: '#3a404c', metal: '#c9d0d8', tire: '#1f232b', hub: '#b3bcc6',
    helmet: '#f2c14e', visor: '#1c232e', shirt: '#2f6db5', pants: '#263451',
    wall: '#1d3a42', wall2: '#244a54', fuel: '#f2b02a', fuelTop: '#ffd45e', pump: '#a9b2bc', band: '#f2b02a', sed: '#8a5a2b', heat: '#ff4d2e', rim: '#0f171e' };
  const BLD = ['#f28b66', '#7cc4a4', '#f6d36b', '#8fb7e8', '#e9a0c0', '#a6d38c', '#f0a35e'];
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const R = (tag, a, p) => el(tag, a, p);
  const line = (p, pts, stroke, w, extra = {}) => R('path', { d: 'M' + pts.map(q => q.join(' ')).join(' L'), fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }, p);

  function scooter(g) {
    const s = R('g', {}, g), wheels = [];
    R('rect', { x: 236, y: 1166, width: 150, height: 26, rx: 13, fill: K.metal }, s);                       // exhaust
    [[380, 1180], [770, 1180]].forEach(([x, y]) => { R('circle', { cx: x, cy: y, r: 74, fill: K.tire }, s); R('circle', { cx: x, cy: y, r: 34, fill: K.hub }, s);
      const sp = R('g', {}, s); [0, 60, 120].forEach(a => line(sp, [[x - 30 * Math.cos(a * Math.PI / 180), y - 30 * Math.sin(a * Math.PI / 180)], [x + 30 * Math.cos(a * Math.PI / 180), y + 30 * Math.sin(a * Math.PI / 180)]], K.tire, 7));
      wheels.push({ g: sp, x, y }); });
    R('path', { d: 'M690 1150 Q770 1050 852 1150 Z', fill: K.body2 }, s);                                    // front fender
    R('path', { d: 'M292 1150 C280 1040 300 962 382 942 L592 936 C642 962 654 1060 642 1150 Z', fill: K.body }, s); // rear body
    R('path', { d: 'M300 1118 L640 1118 L642 1150 L292 1150 Z', fill: K.body2 }, s);
    R('rect', { x: 280, y: 995, width: 20, height: 44, rx: 6, fill: '#ff3b3b' }, s);                        // tail light
    R('rect', { x: 596, y: 1108, width: 150, height: 36, rx: 10, fill: K.floor }, s);                       // floorboard
    R('path', { d: 'M702 1146 L690 864 Q700 792 762 782 L794 792 L806 1146 Z', fill: K.body }, s);          // leg shield
    line(s, [[768, 786], [776, 700]], K.metal, 16); line(s, [[716, 702], [826, 690]], K.ink, 16);            // stem + bar
    R('circle', { cx: 806, cy: 744, r: 24, fill: '#fff3b0', stroke: K.metal, 'stroke-width': 6 }, s);       // headlight
    R('rect', { x: 340, y: 904, width: 264, height: 48, rx: 24, fill: K.seat }, s);                         // seat
    // rider: faceless, helmet with a dark visor
    line(s, [[470, 902], [622, 916]], K.pants, 54); line(s, [[622, 916], [654, 1092]], K.pants, 46);
    R('ellipse', { cx: 672, cy: 1104, rx: 44, ry: 18, fill: K.ink }, s);
    line(s, [[452, 892], [478, 724]], K.shirt, 112);
    line(s, [[496, 742], [612, 792], [716, 706]], K.shirt, 36); R('circle', { cx: 720, cy: 703, r: 21, fill: K.ink }, s);
    R('circle', { cx: 492, cy: 640, r: 64, fill: K.helmet }, s);
    R('path', { d: 'M500 612 Q560 610 556 650 Q552 684 500 680 Z', fill: K.visor }, s);
    R('path', { d: 'M440 600 Q492 560 548 598', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .5 }, s);
    return { s, wheels };
  }

  function world(B, g) {
    R('rect', { x: -1400, y: -1400, width: 3900, height: 2480, fill: 'url(#sky' + B.i + ')' }, g);
    const bld = R('g', {}, g), rr = E.rng(3);
    for (let k = 0; k < 14; k++) { const x = -900 + k * 250, h = 380 + rr() * 170, c = BLD[k % BLD.length], top = 1062 - h;
      R('rect', { x, y: top, width: 236, height: h, fill: c }, bld); R('rect', { x, y: top, width: 236, height: 26, fill: 'rgba(0,0,0,.12)' }, bld);
      for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) R('rect', { x: x + 34 + q * 96, y: top + 70 + r * 130, width: 70, height: 84, rx: 6, fill: '#f7fbff', opacity: .85 }, bld);
      R('path', { d: `M${x + 12} ${1000 - 40} h212 l-14 34 h-184 Z`, fill: k % 2 ? '#e9e2d4' : '#d9534f', opacity: .9 }, bld); }
    for (let k = 0; k < 6; k++) { const x = -700 + k * 520; line(bld, [[x, 1062], [x, 520]], '#6b717b', 10); line(bld, [[x - 40, 560], [x + 40, 560]], '#6b717b', 8); }
    R('rect', { x: -1400, y: 1060, width: 3900, height: 30, fill: K.curb }, g);
    R('rect', { x: -1400, y: 1086, width: 3900, height: 1400, fill: K.road }, g);
    const dashes = R('g', {}, g); for (let k = 0; k < 40; k++) R('rect', { x: -1400 + k * 160, y: 1330, width: 90, height: 16, rx: 8, fill: K.dash }, dashes);
    return { bld, dashes };
  }

  function jagged(cx, cy, hw, hh, seed) {
    const r = E.rng(seed), pts = [], step = 34;
    const edge = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / step));
      for (let k = 0; k < n; k++) { const f = k / n, j = (r() - .5) * 26, nx = -(y1 - y0) / L, ny = (x1 - x0) / L; pts.push([x0 + (x1 - x0) * f + nx * j, y0 + (y1 - y0) * f + ny * j]); } };
    const x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh;
    edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
    return pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  }

  function pill(p, text, x, y, bg = K.ink, fg = '#fff') { const g = R('g', { opacity: 0 }, p), w = text.length * 19 + 36;
    R('rect', { x: x - w / 2, y: y - 26, width: w, height: 52, rx: 12, fill: bg }, g);
    const t = R('text', { x, y: y + 11, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 30, fill: fg, 'letter-spacing': 2 }, g); t.textContent = text; return g; }

  function gauge(p, kind) { const g = R("g", { opacity: 0 }, p), cx = 880, cy = 520;
    if (kind === 'warn') { R('path', { d: `M${cx} ${cy - 80} L${cx + 88} ${cy + 70} L${cx - 88} ${cy + 70} Z`, fill: '#ffcc33', stroke: K.ink, 'stroke-width': 10, 'stroke-linejoin': 'round' }, g);
      R('rect', { x: cx - 8, y: cy - 34, width: 16, height: 60, rx: 8, fill: K.ink }, g); R('circle', { cx, cy: cy + 46, r: 10, fill: K.ink }, g); return { g }; }
    if (kind === 'check') { R('circle', { cx, cy, r: 84, fill: '#2fb36b', stroke: '#fff', 'stroke-width': 10 }, g); line(g, [[cx - 40, cy + 2], [cx - 10, cy + 32], [cx + 44, cy - 30]], '#fff', 20); return { g }; }
    R('circle', { cx, cy, r: 96, fill: '#fff', stroke: K.ink, 'stroke-width': 10 }, g);
    R('path', { d: `M${cx - 66} ${cy + 20} A70 70 0 0 1 ${cx + 66} ${cy + 20}`, fill: 'none', stroke: '#d8dde3', 'stroke-width': 16, 'stroke-linecap': 'round' }, g);
    R('path', { d: `M${cx - 66} ${cy + 20} A70 70 0 0 1 ${cx - 50} ${cy - 30}`, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 16, 'stroke-linecap': 'round' }, g);
    [['E', cx - 70, cy + 64], ['F', cx + 70, cy + 64]].forEach(([s, x, y]) => { const t = R('text', { x, y, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 34, fill: K.ink }, g); t.textContent = s; });
    const nd = R('g', {}, g); line(nd, [[cx, cy + 20], [cx, cy - 58]], K.ink, 9); R('circle', { cx, cy: cy + 20, r: 13, fill: K.ink }, g);
    const ring = R('circle', { cx, cy, r: 110, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 10, opacity: 0 }, g);
    return { g, nd, ring, cx, cy };
  }

  E.presets.street = function (B, sp) {
    const svg = B.svg, defs = R('defs', {}, svg), i = B.i;
    const grad = R('linearGradient', { id: 'sky' + i, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    R('stop', { offset: '0', 'stop-color': K.sky1 }, grad); R('stop', { offset: '.75', 'stop-color': K.sky2 }, grad);
    const cam = R('g', {}, B.layer), W = world(B, cam), sc = scooter(cam);
    const smoke = [0, 1, 2, 3, 4].map(() => R('circle', { r: 26, fill: '#c8ccd2', opacity: 0 }, cam));
    const keys = sp.cam || [[0, 540, 1000, 1]];
    const camAt = f => { if (f <= keys[0][0]) return keys[0]; for (let k = 1; k < keys.length; k++) if (f <= keys[k][0]) { const a = keys[k - 1], b = keys[k], u = ease((f - a[0]) / (b[0] - a[0] || 1)); return [f, lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return keys[keys.length - 1]; };

    // ---- X-ray window (screen space)
    let X = null;
    if (sp.xray) {
      const xr = sp.xray, cx = 540, cy = 780, hw = 380, hh = 330, pts = jagged(cx, cy, hw, hh, 17 + i);
      const win = R('g', {}, B.layer), cp = R('clipPath', { id: 'xc' + i }, defs); R('polygon', { points: pts }, cp);
      R('polygon', { points: pts, fill: 'rgba(0,0,0,.35)', transform: 'translate(10 16)' }, win);
      const ins = R('g', { 'clip-path': `url(#xc${i})` }, win);
      R('rect', { x: 100, y: 400, width: 880, height: 780, fill: K.wall }, ins);
      for (let k = 0; k < 6; k++) R('rect', { x: 100 + k * 150, y: 400, width: 70, height: 780, fill: K.wall2, opacity: .5 }, ins);
      const yb = 1080, yt = 490, X0 = 140, X1 = 940;
      const fuel = R('path', { fill: K.fuel }, ins), fTop = R('path', { fill: 'none', stroke: K.fuelTop, 'stroke-width': 10 }, ins);
      const bub = []; const rb = E.rng(40 + i); for (let k = 0; k < 12; k++) bub.push({ c: R('circle', { r: 6 + rb() * 6, fill: 'none', stroke: '#fff7d6', 'stroke-width': 3, opacity: .7 }, ins), x: 200 + rb() * 480, ph: rb() });
      const heat = R('circle', { cx: 770, cy: 760, r: 170, fill: K.heat, opacity: 0 }, ins);
      const heatLines = [0, 1, 2].map(k => R('path', { d: '', fill: 'none', stroke: K.heat, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, ins));
      line(ins, [[770, 400], [770, 528]], '#7d8691', 18);
      const pump = R('rect', { x: 736, y: 520, width: 68, height: 520, rx: 16, fill: K.pump, stroke: K.rim, 'stroke-width': 6 }, ins);
      R('rect', { x: 736, y: 700, width: 68, height: 34, fill: K.band }, ins);
      R('rect', { x: 724, y: 1036, width: 92, height: 40, rx: 8, fill: '#d6dbe0', stroke: K.rim, 'stroke-width': 5 }, ins);
      for (let k = 0; k < 5; k++) line(ins, [[736 + k * 17, 1040], [736 + k * 17, 1072]], '#8b949e', 3);
      const sed = []; const rs = E.rng(80 + i); for (let k = 0; k < (xr.sediment || 0); k++) sed.push({ c: R('circle', { r: 6 + rs() * 6, fill: K.sed, stroke: K.rim, 'stroke-width': 2 }, ins), x: 190 + rs() * 500, y: 1062 + rs() * 16, ph: rs() });
      const inArrows = xr.suck ? [0, 1].map(k => R('path', { d: '', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, ins)) : [];
      // rim: torn edge of the body panel
      R('polygon', { points: pts, fill: 'none', stroke: K.rim, 'stroke-width': 22, 'stroke-linejoin': 'round' }, win);
      R('polygon', { points: pts, fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: .35, transform: `translate(${cx} ${cy}) scale(.975) translate(${-cx} ${-cy})` }, win);
      // labels (callout lines + pills)
      const lab = []; const addLab = (text, lx, ly, tx, ty, bg) => { const ln = R('path', { d: '', fill: 'none', stroke: '#fff', 'stroke-width': 4 }, B.layer); const pl = pill(B.layer, text, lx, ly, bg); lab.push({ ln, pl, lx, ly, tx, ty }); return lab[lab.length - 1]; };
      let lFuel = null;
      if (xr.labels !== false) {
        lFuel = addLab('BENSIN', 270, 400, 330, 0);
        addLab('POMPA BENSIN', 820, 1180, 790, 960);
        if (xr.sediment) addLab('ENDAPAN', 260, 1180, 300, 1068, '#7a4b1f');
        if (xr.heat) addLab('PANAS!', 900, 430, 790, 560, '#d62f1d');
      }
      X = { xr, win, cx, cy, fuel, fTop, bub, heat, heatLines, pump, sed, inArrows, lab, lFuel, yb, yt, X0, X1 };
    }
    const G = sp.icon ? gauge(B.layer, sp.icon) : null;

    B.update(lt => {
      const d = B.d, f = clamp(lt / d), [, cx, cy, z] = camAt(f);
      const shake = sp.sputter && lt > .5 ? Math.sin(lt * 47) * 7 : 0;
      cam.setAttribute('transform', `translate(${(540 - cx * z).toFixed(2)} ${(860 - cy * z).toFixed(2)}) scale(${z.toFixed(4)})`);
      const v = sp.ride ? 1 : 0;
      W.dashes.setAttribute('transform', `translate(${-((lt * 620 * v) % 160)} 0)`);
      W.bld.setAttribute('transform', `translate(${-lt * 50 * v} 0)`);
      sc.s.setAttribute('transform', `translate(${shake} ${v ? Math.sin(lt * 11) * 2.5 : 0})`);
      sc.wheels.forEach(w => w.g.setAttribute('transform', `rotate(${lt * 420 * v} ${w.x} ${w.y})`));
      smoke.forEach((s, k) => { const ph = (lt * .9 + k / 5) % 1; s.setAttribute('cx', 230 - ph * 260); s.setAttribute('cy', 1176 - ph * 90); s.setAttribute('r', 18 + ph * 40); s.setAttribute('opacity', sp.sputter && lt > .5 ? (1 - ph) * .8 : 0); });
      if (X) {
        const xr = X.xr, ta = (xr.at || 0) * d, open = xr.at ? clamp((lt - ta) / .55) : 1, sc2 = open < 1 ? (1 - Math.pow(1 - open, 3)) * 1.04 - (open > .8 ? (open - .8) * .2 : 0) : 1;
        X.win.setAttribute('transform', `translate(${X.cx} ${X.cy}) scale(${Math.max(.001, sc2)}) translate(${-X.cx} ${-X.cy})`); X.win.setAttribute('opacity', open > 0 ? 1 : 0);
        const fl = xr.fuel || [.75, .75], lv = lerp(fl[0], fl[1], ease(clamp((lt - ta - .6) / Math.max(1, d * .55)))), top = X.yb - lv * (X.yb - X.yt - 30);
        let dpath = `M${X.X0} 1200 L${X.X0} ${top}`, tpath = `M${X.X0} ${top}`;
        for (let x = X.X0; x <= X.X1; x += 40) { const y = top + Math.sin(x / 55 + lt * 3) * 7; dpath += ` L${x} ${y.toFixed(1)}`; tpath += ` L${x} ${y.toFixed(1)}`; }
        X.fuel.setAttribute('d', dpath + ` L${X.X1} 1200 Z`); X.fTop.setAttribute('d', tpath);
        X.bub.forEach(b => { const span = Math.max(10, X.yb - top - 20), y = X.yb - ((lt * 70 + b.ph * 600) % span); b.c.setAttribute('cx', b.x + Math.sin(lt * 2 + b.ph * 6) * 8); b.c.setAttribute('cy', y); b.c.setAttribute('opacity', lv > .08 ? .7 : 0); });
        const hot = xr.heat ? clamp((lt - ta - 1.5) / 1.2) : 0;
        X.heat.setAttribute('opacity', hot * (.22 + .12 * Math.sin(lt * 6)));
        X.pump.setAttribute('fill', hot > 0 ? `rgb(${Math.round(lerp(169, 235, hot))},${Math.round(lerp(178, 110, hot))},${Math.round(lerp(188, 90, hot))})` : K.pump);
        X.heatLines.forEach((p, k) => { const ph = (lt * .8 + k / 3) % 1, x = 735 + k * 35, y = 600 - ph * 120; p.setAttribute('d', `M${x} ${y} q 12 -18 0 -36 q -12 -18 0 -36`); p.setAttribute('opacity', hot * (1 - ph)); });
        X.sed.forEach((s, k) => { let x = s.x, y = s.y; if (xr.suck) { const p = ease(clamp((lt - ta - 1 - (k % 10) * .25) / 1.4)); x = lerp(s.x, 742 + (k * 13) % 60, p); y = lerp(s.y, 1054 + (k * 7) % 22, p); }
          s.c.setAttribute('cx', (x + Math.sin(lt * 2 + s.ph * 6) * 3).toFixed(1)); s.c.setAttribute('cy', y.toFixed(1)); });
        X.inArrows.forEach((p, k) => { const ph = (lt * 1.2 + k * .5) % 1, x = 640 - k * 90 + ph * 60; p.setAttribute('d', `M${x} ${1040 - 14} L${x + 26} 1040 L${x} ${1040 + 14}`); p.setAttribute('opacity', lt > ta + 1 ? (1 - ph) : 0); });
        X.lab.forEach((L, k) => { const a = clamp((lt - ta - .7 - k * .35) / .3); const ty = L === X.lFuel ? top + 50 : L.ty;
          L.ln.setAttribute('d', `M${L.lx} ${L.ly + (L.ly < 800 ? 26 : -26)} L${L.tx} ${ty}`); L.ln.setAttribute('opacity', a * open); L.pl.setAttribute('opacity', a * open); });
      }
      if (G) { const a = clamp((lt - .6) / .3); G.g.setAttribute('opacity', a);
        if (G.nd) { const low = sp.icon === 'gauge-low', ang = low ? -64 + Math.sin(lt * 9) * 2 : lerp(-64, 62, ease(clamp((lt - 1) / 1.2)));
          G.nd.setAttribute('transform', `rotate(${ang} ${G.cx} ${G.cy + 20})`); G.ring.setAttribute('opacity', low ? (Math.floor(lt * 3) % 2 ? .9 : 0) : 0); } }
    });
  };
})();
