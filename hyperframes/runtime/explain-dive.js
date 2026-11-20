/* explain-dive.js — preset "dive" for the kartun-cutaway page: an outside → inside explainer for ANY subject
   (body → heart → vessels, mountain → soil layers → groundwater, building → floors → rooms, leaf → cell → chloroplast…).
   Each scene is one LEVEL: its picture is the scene's AI image (FLUX, flat cartoon cutaway, no text) shown full-bleed; the camera
   pushes toward a point; a torn X-ray hole opens there showing the NEXT scene's picture and grows until it fills the screen, so
   the next scene starts exactly where the hole ended. Code draws everything that must be exact on top: callout labels, flows
   (blood cells, water drops), pulses, rain, a text card (ayat/fact). All motion = f(scene time).
   Scene "diagram": {preset:"dive",
     cam:[[f,x,y,z],...]     camera keys in screen-at-zoom-1 coords (default slow push to 1.08 at the centre)
     xray:{at:.55, x, y, size:520, grow:.8, shape:'lens'|'torn'}  magnifying glass (default) or torn hole into the next level (x,y = where on screen; grow = when it starts to fill)
     labels:[{text, x, y, lx, ly, at, color}]  point (x,y) on the picture, pill at (lx,ly) on screen
     flows:[{path:[[x,y],..], color, n, r, speed, at}]   particles moving along a path (picture coords)
     pulses:[{x, y, r, color, rate, at}]       rings that keep calling attention
     rain:{n, color, from, to}                 falling drops over the top part
     card:{title, text, arabic, ref, at, y}    a text card on screen (for an ayat or a key fact)}
   Picture coords = the 1080×1920 frame at zoom 1 (the square FLUX image covers it; keep subjects centred). */
(function () {
  const E = window.EXPLAIN, el = E.el, { clamp, lerp } = E.util, NS = 'http://www.w3.org/2000/svg';
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const INK = '#1c232e';
  function jagged(cx, cy, hw, hh, seed) { const r = E.rng(seed), pts = [], step = 30;
    const edge = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / step));
      for (let k = 0; k < n; k++) { const f = k / n, j = (r() - .5) * 30, nx = -(y1 - y0) / L, ny = (x1 - x0) / L; pts.push([x0 + (x1 - x0) * f + nx * j, y0 + (y1 - y0) * f + ny * j]); } };
    edge(cx - hw, cy - hh, cx + hw, cy - hh); edge(cx + hw, cy - hh, cx + hw, cy + hh); edge(cx + hw, cy + hh, cx - hw, cy + hh); edge(cx - hw, cy + hh, cx - hw, cy - hh);
    return pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '); }
  const picture = (p, src, fallback) => src ? el('image', { href: 'assets/' + src, x: -420, y: 0, width: 1920, height: 1920, preserveAspectRatio: 'xMidYMid slice' }, p)
    : el('rect', { x: -420, y: 0, width: 1920, height: 1920, fill: fallback || '#2a3b4f' }, p);
  function pill(p, text, bg) { const g = el('g', { opacity: 0 }, p), w = text.length * 21 + 44;
    el('rect', { x: -w / 2, y: -30, width: w, height: 60, rx: 14, fill: bg || INK, stroke: '#fff', 'stroke-width': 4 }, g);
    const t = el('text', { x: 0, y: 12, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 34, fill: '#fff', 'letter-spacing': 2 }, g); t.textContent = text.toUpperCase(); return g; }
  function wrap(text, n) { const out = []; let cur = ''; String(text).split(/\s+/).forEach(w => { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; }); if (cur.trim()) out.push(cur.trim()); return out; }

  E.presets.dive = function (B, sp, s) {
    const P = window.PROPS, i = B.i, next = P.scenes[i + 1] || {}, svg = B.svg, defs = el('defs', {}, svg);
    const cam = el('g', {}, B.layer); picture(cam, s.imageSrc, sp.bg);
    const keys = sp.cam || [[0, 540, 960, 1], [1, 540, 960, 1.08]];
    const camAt = f => { if (f <= keys[0][0]) return keys[0]; for (let k = 1; k < keys.length; k++) if (f <= keys[k][0]) { const a = keys[k - 1], b = keys[k], u = ease((f - a[0]) / (b[0] - a[0] || 1)); return [f, lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return keys[keys.length - 1]; };
    const toScreen = (x, y, c) => [540 + (x - c[1]) * c[3], 960 + (y - c[2]) * c[3]];
    // flows, rain, pulses: in picture coords (inside the camera)
    const R = E.rng(i * 7 + 3), flows = [];
    (sp.flows || []).forEach(fl => { for (let k = 0; k < (fl.n || 12); k++) flows.push({ fl, c: el('circle', { r: fl.r || 10, fill: fl.color || '#e23b3b', stroke: INK, 'stroke-width': 2.5, opacity: 0 }, cam), ph: k / (fl.n || 12) + R() * .03 }); });
    const rain = sp.rain ? Array.from({ length: sp.rain.n || 40 }, () => ({ c: el('path', { d: '', stroke: sp.rain.color || '#cfe9ff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, cam), x: -100 + R() * 1280, ph: R() })) : [];
    const pulses = (sp.pulses || []).map(p => ({ p, c: el('circle', { cx: p.x, cy: p.y, r: p.r || 60, fill: 'none', stroke: p.color || '#ffd23f', 'stroke-width': 9, opacity: 0 }, cam) }));
    // labels: anchored on the picture, drawn in screen space
    const labs = (sp.labels || []).map(L => ({ L, ln: el('path', { d: '', fill: 'none', stroke: '#fff', 'stroke-width': 5, opacity: 0 }, B.layer), dot: el('circle', { r: 11, fill: '#fff', stroke: INK, 'stroke-width': 4, opacity: 0 }, B.layer), pl: pill(B.layer, L.text, L.color) }));
    // text card
    let card = null;
    if (sp.card) { const c = sp.card, g = el('g', { opacity: 0 }, B.layer), y0 = c.y || 300, lines = wrap(c.text || '', 26), ar = c.arabic ? 1 : 0;
      const h = 70 + (c.title ? 70 : 0) + ar * 120 + lines.length * 62 + (c.ref ? 60 : 0);
      el('rect', { x: 70, y: y0, width: 940, height: h, rx: 34, fill: 'rgba(18,26,38,.88)', stroke: '#ffd23f', 'stroke-width': 5 }, g);
      let y = y0 + 80;
      if (c.title) { const t = el('text', { x: 540, y, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 40, fill: '#ffd23f', 'letter-spacing': 3 }, g); t.textContent = c.title.toUpperCase(); y += 70; }
      if (ar) { const t = el('text', { x: 540, y: y + 40, 'text-anchor': 'middle', 'font-family': 'Amiri', 'font-weight': 700, 'font-size': Math.min(62, 1500 / Math.max(1, c.arabic.length) * 1.9), fill: '#fff', direction: 'rtl' }, g); t.textContent = c.arabic; y += 120; }
      lines.forEach(l => { const t = el('text', { x: 540, y, 'text-anchor': 'middle', 'font-family': 'Jakarta', 'font-weight': 800, 'font-size': 48, fill: '#fff' }, g); t.textContent = l; y += 62; });
      if (c.ref) { const t = el('text', { x: 540, y: y + 6, 'text-anchor': 'middle', 'font-family': 'Fredoka', 'font-weight': 500, 'font-size': 34, fill: '#c9d6e8' }, g); t.textContent = c.ref; }
      card = { g, at: c.at ?? .2 }; }
    // X-ray hole into the next level (screen space)
    let X = null;
    if (sp.xray && (sp.xray.shape || 'lens') === 'lens') {
      // magnifying glass: flies in from the viewer's side, magnifies the next level, then comes toward the viewer until it fills the screen
      const xr = sp.xray, R0 = (xr.size || 520) / 2, cx = xr.x ?? 540, cy = xr.y ?? 900;
      const cp = el('clipPath', { id: 'dv' + i }, defs), clipC = el('circle', { cx, cy, r: R0 }, cp);
      const hole = el('g', { opacity: 0 }, B.layer);
      const shadow = el('circle', { cx: cx + 18, cy: cy + 30, r: R0 + 16, fill: 'rgba(0,0,0,.35)' }, hole);
      const ins = el('g', { 'clip-path': `url(#dv${i})` }, hole), mag = el('g', {}, ins); picture(mag, next.imageSrc, xr.bg);
      el('circle', { cx, cy, r: R0, fill: 'none', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 40 }, ins);              // inner vignette
      const deco = el('g', {}, hole), a = Math.PI / 4, hx = cx + Math.cos(a) * (R0 + 6), hy = cy + Math.sin(a) * (R0 + 6);
      const handle = el('g', { transform: `rotate(45 ${hx} ${hy})` }, deco);
      el('rect', { x: hx - 6, y: hy - 30, width: 70, height: 60, rx: 10, fill: '#aeb6c0', stroke: INK, 'stroke-width': 6 }, handle);
      el('rect', { x: hx + 60, y: hy - 27, width: 260, height: 54, rx: 27, fill: '#7a4a2a', stroke: INK, 'stroke-width': 6 }, handle);
      el('rect', { x: hx + 80, y: hy - 18, width: 200, height: 10, rx: 5, fill: '#a86a3e' }, handle);
      el('circle', { cx, cy, r: R0 + 14, fill: 'none', stroke: INK, 'stroke-width': 36 }, deco);
      el('circle', { cx, cy, r: R0 + 14, fill: 'none', stroke: '#c9d0d8', 'stroke-width': 18 }, deco);
      el('circle', { cx, cy, r: R0 + 4, fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: .7 }, deco);
      el('path', { d: `M${cx - R0 * .72} ${cy - R0 * .2} A${R0 * .75} ${R0 * .75} 0 0 1 ${cx - R0 * .2} ${cy - R0 * .72}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 18, 'stroke-linecap': 'round', opacity: .55 }, deco);
      const far = Math.max(...[[0, 0], [1080, 0], [0, 1920], [1080, 1920]].map(([u, v]) => Math.hypot(u - cx, v - cy)));
      X = { lens: true, xr, hole, clipC, shadow, deco, mag, cx, cy, maxS: far / R0 * 1.15 };
    } else if (sp.xray) { const xr = sp.xray, size = xr.size || 520, pts = jagged(xr.x ?? 540, xr.y ?? 900, size / 2, size / 2, 31 + i);
      const cp = el('clipPath', { id: 'dv' + i }, defs), poly = el('polygon', { points: pts }, cp);
      const hole = el('g', { opacity: 0 }, B.layer), shadow = el('polygon', { points: pts, fill: 'rgba(0,0,0,.4)' }, hole);
      const ins = el('g', { 'clip-path': `url(#dv${i})` }, hole); picture(ins, next.imageSrc, xr.bg);
      const rim = el('polygon', { points: pts, fill: 'none', stroke: INK, 'stroke-width': 20, 'stroke-linejoin': 'round' }, hole);
      const glow = el('polygon', { points: pts, fill: 'none', stroke: '#9fe7ff', 'stroke-width': 6, opacity: .7 }, hole);
      const cx = xr.x ?? 540, cy = xr.y ?? 900, far = Math.max(...[[0, 0], [1080, 0], [0, 1920], [1080, 1920]].map(([a, b]) => Math.hypot(a - cx, b - cy)));
      X = { xr, hole, shapes: [poly, shadow, rim, glow], cx, cy, maxS: far / (size / 2) * 1.25 }; }

    B.update(lt => {
      const d = B.d, f = clamp(lt / d), c = camAt(f);
      cam.setAttribute('transform', `translate(${(540 - c[1] * c[3]).toFixed(2)} ${(960 - c[2] * c[3]).toFixed(2)}) scale(${c[3].toFixed(4)})`);
      flows.forEach(p => { const a = clamp((lt - (p.fl.at || 0) * d) / .4), u = (lt * (p.fl.speed || .25) + p.ph) % 1, [x, y] = E.util.alongPath(p.fl.path, u);
        p.c.setAttribute('cx', x.toFixed(1)); p.c.setAttribute('cy', y.toFixed(1)); p.c.setAttribute('opacity', a * (u < .06 ? u / .06 : u > .94 ? (1 - u) / .06 : 1)); });
      rain.forEach(r => { const span = (sp.rain.to || 900) - (sp.rain.from || 0), y = (sp.rain.from || 0) + ((lt * 900 + r.ph * span) % span);
        r.c.setAttribute('d', `M${r.x - 8} ${y - 40} L${r.x} ${y}`); r.c.setAttribute('opacity', .8); });
      pulses.forEach(({ p, c: ring }) => { const a = lt - (p.at || 0) * d; if (a < 0) { ring.setAttribute('opacity', 0); return; } const ph = (a * (p.rate || 1)) % 1;
        ring.setAttribute('r', (p.r || 60) * (1 + ph * .8)); ring.setAttribute('opacity', 1 - ph); });
      labs.forEach(({ L, ln, dot, pl }, k) => { const a = clamp((lt - (L.at ?? (.15 + k * .08)) * d) / .3), [sx, sy] = toScreen(L.x, L.y, c), lx = L.lx ?? sx, ly = L.ly ?? sy - 160;
        ln.setAttribute('d', `M${sx} ${sy} L${lx} ${ly}`); dot.setAttribute('cx', sx); dot.setAttribute('cy', sy); pl.setAttribute('transform', `translate(${lx} ${ly}) scale(${.8 + a * .2})`);
        const hide = X && lt > (X.xr.grow ?? .8) * d ? 1 - clamp((lt - (X.xr.grow ?? .8) * d) / .3) : 1; [ln, dot, pl].forEach(e => e.setAttribute('opacity', a * hide)); });
      if (card) { const a = clamp((lt - card.at * d) / .4); card.g.setAttribute('opacity', a); card.g.setAttribute('transform', `translate(0 ${(1 - a) * 40})`); }
      if (X && X.lens) { const ta = (X.xr.at ?? .55) * d, tg = (X.xr.grow ?? .8) * d, o = clamp((lt - ta) / .8), g = ease(clamp((lt - tg) / Math.max(.5, d - tg - .05)));
        const back = p => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);             // ease-out-back
        const e = lt < ta ? 0 : back(o), sIn = lerp(2.2, 1, e), px = lerp(X.cx + 760, X.cx, e), py = lerp(X.cy + 1100, X.cy, e);
        const sc = sIn * (1 + g * (X.maxS - 1)), tr = `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${sc.toFixed(4)}) translate(${-X.cx} ${-X.cy})`;
        X.hole.setAttribute('opacity', lt >= ta ? 1 : 0);
        [X.clipC, X.shadow, X.deco].forEach(n => n.setAttribute('transform', tr));
        X.deco.setAttribute('opacity', 1 - clamp((g - .55) / .35)); X.shadow.setAttribute('opacity', 1 - g);
        const m = lerp(1.7, 1, g), mx = lerp(px, X.cx, 0);                                          // magnification inside the glass → 1 at the end
        X.mag.setAttribute('transform', `translate(${X.cx} ${X.cy}) scale(${m.toFixed(4)}) translate(${-X.cx} ${-X.cy})`); }
      else if (X) { const ta = (X.xr.at ?? .55) * d, tg = (X.xr.grow ?? .8) * d, o = clamp((lt - ta) / .5), g = clamp((lt - tg) / Math.max(.4, d - tg - .05));
        const sc = lt < ta ? 0 : (1 - Math.pow(1 - o, 3)) * (1 + Math.sin(o * Math.PI) * .06) + ease(g) * (X.maxS - 1);
        X.hole.setAttribute('opacity', lt >= ta ? 1 : 0);
        const tr = `translate(${X.cx} ${X.cy}) scale(${Math.max(.001, sc).toFixed(4)}) translate(${-X.cx} ${-X.cy})`;
        X.shapes.forEach(e => e.setAttribute('transform', tr)); X.shapes[1].setAttribute('transform', tr + ' translate(8 14)');
        X.shapes[2].setAttribute('stroke-width', 20 / Math.max(1, sc)); X.shapes[3].setAttribute('stroke-width', 6 / Math.max(1, sc)); }
    });
  };
})();
