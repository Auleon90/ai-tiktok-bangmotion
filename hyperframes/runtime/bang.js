/* bang.js — data-driven 9:16 runtime for the Bang Motion styles (adapted from github.com/bangtutorial/bang-motion, MIT,
   see hyperframes/bang/LICENSE). Served as assets/bm/bang.js next to bm.js. Three rigs, all on ONE paused GSAP timeline
   registered as window.__timelines["root"] (HyperFrames contract: absolute times, no repeat:-1, no network, no Date/random):
     BANG.collage(S) — still WORLD bigger than the frame, the CAMERA choreographs (into → settle → home → breath), push-through
                       between scene areas; used by vintage sketch, kartun kolase, jurnalisme visual, katalog putih.
     BANG.stage(S)   — kartun panggung: one bright flat stage per scene, camera 1.08–1.4 (never wide), faceless silhouettes on
                       joint rigs, diegetic boards; cut with a 96 px slide + blur between stages.
     BANG.flow(S)    — explainer (mode aliran): a world that keeps flowing past (parallax strips), one hero that never leaves
                       the frame, signposts that roll in with each scene.
   Scene types: title/headline/tribute, counter, list, quote, ayat. Text "*kata*" = highlighted phrase. Timings: window.PROPS. */
(function () {
  const P = window.PROPS, T = P.totalMs / 1000, $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const tl = gsap.timeline({ paused: true });
  const h = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const roman = n => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n] || String(n + 1);
  const rng = seed => { let x = seed * 9301 + 49297; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); };
  const yearOf = s => (String(s.eyebrow || '').match(/\b\d{3,4}\b/) || [''])[0];
  let hlCycle = [''];
  const sayable = (el, text) => { const parts = String(text).split(/(\*[^*]+\*)/); el.textContent = ''; let k = 0; parts.forEach(p => { if (!p) return;
    if (/^\*.*\*$/.test(p)) { const s = document.createElement('span'); s.className = 'w'; s.innerHTML = `<span class="hl ${hlCycle[k++ % hlCycle.length]}"><i></i>${esc(p.slice(1, -1))}</span>`; el.appendChild(s); }
    else p.split(/\s+/).filter(Boolean).forEach(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.appendChild(s); }); }); };
  let sayMode = 'rise';
  const say = (el, at, { dur = .55, st = .08 } = {}) => { const ws = $$('.w', el); tl.set(el, { opacity: 1 }, at);
    if (sayMode === 'scale') tl.fromTo(ws, { opacity: 0, scale: .7, rotate: -3, filter: 'blur(8px)' }, { opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)', duration: dur, ease: 'back.out(1.6)', stagger: st, immediateRender: false }, at);
    else tl.fromTo(ws, { opacity: 0, yPercent: 60, scaleY: 1.25, filter: 'blur(10px)' }, { opacity: 1, yPercent: 0, scaleY: 1, filter: 'blur(0px)', duration: dur, ease: 'power4.out', stagger: st, immediateRender: false }, at);
    $$('.hl i', el).forEach((hi, k) => tl.fromTo(hi, { scaleX: 0 }, { scaleX: 1, duration: .4, ease: 'power3.out', immediateRender: false }, at + st * ws.length + .2 + k * .2)); };
  const label = (el, at) => tl.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4, ease: 'power3.out', immediateRender: false }, at);
  const pop = (el, at, r = 0) => tl.fromTo(el, { opacity: 0, scale: .4, rotate: r - 20 }, { opacity: 1, scale: 1, rotate: r, duration: .5, ease: 'back.out(2)', immediateRender: false }, at);
  const floatN = (el, from, end, { y = -18, rot = 1.2, per = 1.6, scale = 1.02 } = {}) => { const n = Math.floor((end - from) / per); if (n > 0) tl.to(el, { y, rotate: `+=${rot}`, scale, duration: per, ease: 'sine.inOut', yoyo: true, repeat: n - 1 + (n % 2 ? 0 : 1) }, from); };
  const fly = (el, at, from, end, { rot = 0 } = {}) => { tl.fromTo(el, { opacity: 0, filter: 'blur(14px)', ...from }, { opacity: 1, x: 0, y: 0, rotate: rot, scale: 1, filter: 'blur(0px)', duration: .9, ease: 'power4.out', immediateRender: false }, at); floatN(el, at + .9, end - .1); };
  const draw = (el, at, dur = .8) => { const o = { v: 0 }; tl.set(el, { opacity: 1 }, at); el.style.clipPath = 'inset(-300px 100% -300px -300px)'; tl.to(o, { v: 1, duration: dur, ease: 'power2.inOut', onUpdate() { el.style.clipPath = `inset(-300px ${(1 - o.v) * 100}% -300px -300px)`; } }, at); };
  const slam = (el, at) => tl.fromTo(el, { opacity: 0, scale: 2.2 }, { opacity: .92, scale: 1, duration: .26, ease: 'power4.in', immediateRender: false }, at);
  const block = (el, at) => { tl.set(el, { opacity: 1 }, at); tl.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .5, ease: 'power3.out', immediateRender: false }, at); };
  const counterTo = (el, x, at, dur = 1.1) => { const target = parseFloat(String(x.value).replace(/\./g, '').replace(',', '.')); const num = !isNaN(target);
    const fmt = v => (x.prefix || '') + (num ? (Number.isInteger(target) ? Math.round(v).toLocaleString('id-ID') : v.toFixed(1).replace('.', ',')) : x.value) + (x.suffix || '');
    const o = { v: 0 }; el.textContent = fmt(num ? 0 : 0); tl.set(el, { opacity: 1 }, at); if (num) tl.to(o, { v: target, duration: dur, ease: 'power2.out', onUpdate() { el.textContent = fmt(o.v); } }, at); else el.textContent = fmt(0); return { target, pct: /%/.test(x.suffix || '') ? target : null }; };
  const finish = (S) => { tl.to({}, { duration: .01 }, T); if (S.captions !== false && window.BM && $('#caps')) BM.captions(tl, $('#caps'), P.words, { accent: S.capAccent || '#E1251B', text: S.capText || '#141414' });
    window.__timelines = window.__timelines || {}; window.__timelines["root"] = tl; };
  const sceneText = s => s.title || s.headline || s.name || '';
  const BANG = window.BANG = { tl, P, h, esc, sayable, say, label, pop, fly, draw, slam, block, floatN, counterTo, rng, roman, yearOf };

  /* ============================== COLLAGE RIG ============================== */
  BANG.collage = function (S) {
    hlCycle = S.hl || ['']; sayMode = S.say || 'rise';
    const world = $('#world'), SW = 1500, area = i => ({ x: i * SW, y: (i % 2) * 700 });
    $$('.paper,.grain,.stain', world).forEach(e => { e.style.left = '-1500px'; e.style.top = '-1500px'; e.style.width = (P.scenes.length * SW + 3000) + 'px'; e.style.height = '5200px'; });
    const C = { x: 540, y: 960, z: 1 }, applyCam = () => { world.style.transform = `translate(${540 - C.x * C.z}px,${960 - C.y * C.z}px) scale(${C.z})`; };
    const cam = (at, x, y, z, dur, ease = 'sine.inOut') => tl.to(C, { x, y, z, duration: dur, ease, onUpdate: applyCam }, at);
    const ring = S.ring || 'M70 380 C50 200 210 70 450 66 C690 62 850 200 830 380 C810 560 650 660 440 664 C230 668 90 560 70 380 Z M120 420 C130 600 300 690 470 690';
    P.scenes.forEach((s, i) => {
      const a = area(i), t0 = s.startMs / 1000, d = s.durationMs / 1000, t1 = t0 + d, cx = a.x + 540, cy = a.y + 960;
      const put = (html, x, y, extra = '') => { const e = h(html); e.style.left = (a.x + x) + 'px'; e.style.top = (a.y + y) + 'px'; if (extra) e.style.cssText += extra; world.appendChild(e); return e; };
      const hasImg = !!s.imageSrc && S.images !== false, T_ = s.type, textAt = t0 + 1.5, yr = yearOf(s);
      const annot = (x, y, w, hh, at, d2 = ring) => { const e = put(`<svg class="anno" viewBox="0 0 900 720" preserveAspectRatio="none" style="width:${w}px;height:${hh}px"><path d="${d2}"/></svg>`, x, y); draw(e, at, .9); return e; };
      const ctx = { s, i, a, t0, t1, d, textAt, put, hasImg, yr, annot, n: P.scenes.length };
      if (yr && S.ghost !== false) { const g = put(`<div class="ghost">${esc(yr)}</div>`, S.ghostX ?? 60, S.ghostY ?? 820); tl.fromTo(g, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, t0 + .15); }
      if (hasImg) { const im = S.image ? S.image(ctx) : { x: 140, y: 290, w: 800, h: 620, cls: '' };
        const cut = put(`<div class="cut ${im.cls || ''}"><img src="assets/${esc(s.imageSrc)}"></div>`, im.x, im.y, `width:${im.w}px;height:${im.h}px`);
        fly(cut, t0 + .25, { y: 140, rotate: i % 2 ? 5 : -5, scale: .92 }, t1, { rot: im.rot || 0 }); if (S.imageRing !== false) annot(im.x - 50, im.y - 40, im.w + 100, im.h + 100, t0 + 1.2); }
      if (s.eyebrow) label(put(`<div class="name">${esc(S.upper === false ? s.eyebrow : String(s.eyebrow).toUpperCase())}</div>`, 80, 200), t0 + .5);
      // camera: open close, glide home, breathe; push through to the next area
      if (i === 0) tl.set(C, { x: cx - 40, y: cy - 330, z: 1.7, onUpdate: applyCam }, 0);
      cam((i ? t0 : 0) + .05, cx, cy, 1, 1.3, 'power2.inOut'); cam((i ? t0 : 0) + 1.4, cx, cy, 1.035, Math.max(.5, d - 2.3));
      if (P.scenes[i + 1]) { const b = area(i + 1); cam(t1 - .9, (cx + b.x + 540) / 2, (cy + b.y + 960) / 2, 1.5, .9, 'power2.in'); }
      const sh = hasImg ? 560 : 0;   // text drops below the image when there is one
      if (T_ === 'map') { BANG.map(ctx, S, { cam, C, applyCam }); S.mapScene && S.mapScene(ctx); S.decor && S.decor(ctx); return; }
      if (T_ === 'counter') {
        if (s.headline) { const ln = put(`<div class="line it"></div>`, 80, 320 + (hasImg ? 600 : 0)); sayable(ln, s.headline); say(ln, t0 + .6); }
        const items = (s.items || []).slice(0, 2), ny = hasImg ? 1010 : (items.length > 1 ? 560 : 860);
        ctx.counters = items.map((x, k) => { const nEl = put(`<div class="num"></div>`, 80, ny + k * 300); const r = counterTo(nEl, x, textAt + k * .5);
          const lab = x.label ? put(`<div class="hand">${esc(x.label)}</div>`, 80, ny + 225 + k * 300, 'width:920px;text-align:center') : null; if (lab) label(lab, textAt + k * .5 + .5); return { ...r, el: nEl, lab, y: ny + k * 300, x }; });
        S.counter ? S.counter(ctx) : (items.length === 1 && !hasImg && annot(190, ny - 115, 700, 440, textAt + .9));
      } else if (T_ === 'list') {
        const items = (s.items || []).slice(0, 5), gap = items.length > 3 ? 112 : 130, y0 = hasImg ? 1010 : 560;
        const ln = put(`<div class="line"></div>`, 80, y0 - 180); sayable(ln, s.headline || ''); say(ln, t0 + .6);
        ctx.items = items.map((x, k) => { const it = put(`<div class="line it li"></div>`, S.listIndent || 80, y0 + k * gap); sayable(it, S.marker ? `${S.marker(k)} ${x}` : `${roman(k)}. ${x}`); say(it, textAt + k * .6, { st: .05 }); return { el: it, y: y0 + k * gap, at: textAt + k * .6 }; });
        S.list && S.list(ctx);
      } else if (T_ === 'ayat') {
        const ar = put(`<div class="line ar"></div>`, 80, 360); ar.textContent = s.arabic || ''; tl.fromTo(ar, { opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out', immediateRender: false }, t0 + .6);
        const tr = put(`<div class="line it"></div>`, 80, 760); sayable(tr, `“${s.translation || ''}”`); say(tr, textAt, { st: .05 });
        if (s.ref) label(put(`<div class="name">${esc(s.ref)}</div>`, 80, 1160), textAt + 1);
        S.ayat && S.ayat(ctx);
      } else if (T_ === 'quote') {
        const q = put(`<div class="line it q"></div>`, 80, hasImg ? 950 : 440); sayable(q, `“${s.text || ''}”`); say(q, textAt, { st: .05 }); ctx.q = q;
        if (s.source) label(put(`<div class="hand">— ${esc(s.source)}</div>`, 120, 1180), textAt + 1);
        S.quote && S.quote(ctx);
      } else {
        const ln = put(`<div class="line"></div>`, 80, hasImg ? 960 : 430); sayable(ln, sceneText(s)); say(ln, textAt); ctx.main = ln;
        const sub = s.subtitle || s.sub || s.note; if (sub) { ctx.subEl = put(`<div class="hand">${esc(sub)}</div>`, 100, hasImg ? 1190 : 790); label(ctx.subEl, textAt + 1); }
        S.title && S.title(ctx);
      }
      S.decor && S.decor(ctx);
    });
    finish(S); applyCam();
  };

  /* ============================== MAP (collage rig) ==============================
     Same fields as the Remotion map: coords 0–1000 (y down). hills[{label, at, r, color?}], units[{label?, color, dots, from, to?,
     moveAt:[f0,f1] (fractions of the scene), spread?}], arrows[{path:[[x,y]..], color?, at?}], pulse{at, label?, atFrac?},
     focus{at, zoom}, headline?. Drawn in the page's style (S.map: ink, hill, hillLine, label font, dot radius). */
  BANG.map = function (c, S, cam) {
    const s = c.s, M = Object.assign({ ink: '#2E2115', hill: 'rgba(154,59,34,.10)', line: '#5B4634', font: 'serif', label: '#2E2115', r: 9, labelSize: 30, arrow: '#9A3B22', water: null }, S.map || {});
    const X0 = 110, Y0 = s.headline ? 370 : 300, SC = .86, R = rng(c.i * 13 + 5), at0 = c.t0 + .35, d = c.d;
    const svg = c.put(`<svg class="bmap" viewBox="0 0 1000 1000" style="position:absolute;width:860px;height:860px;overflow:visible"></svg>`, X0, Y0);
    const el = (tag, attrs, parent = svg) => svgEl(tag, attrs, parent);
    const T = f => c.t0 + f * d;
    if (s.headline) { const ln = c.put(`<div class="line it"></div>`, 80, 280); sayable(ln, s.headline); say(ln, c.t0 + .5); }
    // frame: a drawn border + compass tick, so the map reads as a sheet laid on the page
    const fr = el('rect', { x: 0, y: 0, width: 1000, height: 1000, fill: 'none', stroke: M.line, 'stroke-width': 3, 'stroke-dasharray': '4000', 'stroke-dashoffset': '4000', opacity: .55 });
    tl.to(fr, { attr: { 'stroke-dashoffset': 0 }, duration: 1.2, ease: 'power2.inOut' }, at0);
    // hills: three wobbly contour rings each, drawn with the pen, then a label
    (s.hills || []).forEach((hl, k) => { const [hx, hy] = hl.at, r = hl.r || 120, g = el('g', {});
      [1, .66, .33].forEach((f, j) => { const pts = []; for (let a = 0; a <= 24; a++) { const ang = a / 24 * Math.PI * 2, rr = r * f * (1 + .09 * Math.sin(ang * 3 + k * 2 + j) + .05 * Math.sin(ang * 5 + k)); pts.push([hx + Math.cos(ang) * rr, hy + Math.sin(ang) * rr * .82]); }
        const dd = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + 'Z', len = 2 * Math.PI * r * f * 1.1;
        const p = el('path', { d: dd, fill: j === 0 ? (hl.color ? hl.color + '33' : M.hill) : 'none', stroke: hl.color || M.line, 'stroke-width': j === 0 ? 3.5 : 2.2, 'stroke-dasharray': len, 'stroke-dashoffset': len, 'stroke-linejoin': 'round' }, g);
        tl.to(p, { attr: { 'stroke-dashoffset': 0 }, duration: .9, ease: 'power2.inOut' }, at0 + .2 + k * .3 + j * .15); });
      if (hl.label) { const tx = el('text', { x: hx, y: hy + r * .82 + 40, 'text-anchor': 'middle', fill: M.label, 'font-family': M.font, 'font-size': M.labelSize, opacity: 0 }, g); tx.textContent = hl.label; tl.to(tx, { opacity: 1, duration: .4 }, at0 + .9 + k * .3); } });
    // arrows: drawn along the path, with a head
    (s.arrows || []).forEach((ar, k) => { const P = ar.path || []; if (P.length < 2) return; let dd = `M${P[0][0]} ${P[0][1]}`;
      for (let q = 1; q < P.length; q++) { const [x0, y0] = P[q - 1], [x1, y1] = P[q]; dd += q < P.length - 1 ? ` Q${x1} ${y1} ${(x1 + P[q + 1][0]) / 2} ${(y1 + P[q + 1][1]) / 2}` : ` L${x1} ${y1}`; }
      let len = 0; for (let q = 1; q < P.length; q++) len += Math.hypot(P[q][0] - P[q - 1][0], P[q][1] - P[q - 1][1]);
      const col = ar.color || M.arrow, path = el('path', { d: dd, fill: 'none', stroke: col, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': len * 1.05, 'stroke-dashoffset': len * 1.05, opacity: .9 });
      const [ax, ay] = P[P.length - 1], [bx, by] = P[P.length - 2], ang = Math.atan2(ay - by, ax - bx) * 180 / Math.PI;
      const head = el('path', { d: 'M0 0 L-34 -18 L-26 0 L-34 18 Z', fill: col, transform: `translate(${ax} ${ay}) rotate(${ang})`, opacity: 0 });
      const ta = T(ar.at ?? .3); tl.to(path, { attr: { 'stroke-dashoffset': 0 }, duration: 1.2, ease: 'power2.inOut' }, ta); tl.to(head, { opacity: 1, duration: .2 }, ta + 1.1); });
    // units: seeded dot clouds that march from → to during moveAt
    (s.units || []).forEach((u, k) => { const n = Math.min(80, u.dots || 12), sp = u.spread || 80, [fx, fy] = u.from, to = u.to || u.from, [m0, m1] = u.moveAt || [.2, .7];
      const g = el('g', {}), offs = []; for (let q = 0; q < n; q++) { const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * sp; offs.push([Math.cos(a) * rr, Math.sin(a) * rr * .7]); }
      offs.forEach(([ox, oy], q) => { const dot = el('circle', { cx: fx + ox, cy: fy + oy, r: M.r, fill: u.color || M.ink, stroke: M.dotStroke || 'none', 'stroke-width': 2, opacity: 0 }, g);
        tl.to(dot, { opacity: 1, duration: .25 }, at0 + .6 + k * .2 + q * .008);
        if (u.to) tl.to(dot, { attr: { cx: to[0] + ox, cy: to[1] + oy }, duration: Math.max(.4, (m1 - m0) * d), ease: 'power1.inOut' }, T(m0) + (q % 7) * .03); });
      if (u.label) { const lb = el('text', { x: fx, y: fy - sp * .7 - 22, 'text-anchor': 'middle', fill: u.color || M.label, 'font-family': M.font, 'font-size': M.labelSize, 'font-weight': 700, stroke: M.halo || 'none', 'stroke-width': 8, 'paint-order': 'stroke', opacity: 0 }, g); lb.textContent = u.label;
        tl.to(lb, { opacity: 1, duration: .4 }, at0 + .9 + k * .2); if (u.to) tl.to(lb, { attr: { x: to[0], y: to[1] - sp * .7 - 22 }, duration: Math.max(.4, (m1 - m0) * d), ease: 'power1.inOut' }, T(m0)); } });
    // pulse: a ring that keeps calling attention to one spot (finite repeats) + a label block
    if (s.pulse) { const [px, py] = s.pulse.at, ta = T(s.pulse.atFrac ?? .3), n = Math.max(1, Math.floor((c.t1 - ta) / 1.1));
      const ring = el('circle', { cx: px, cy: py, r: 20, fill: 'none', stroke: M.arrow, 'stroke-width': 6, opacity: 0 });
      tl.fromTo(ring, { attr: { r: 20 }, opacity: .95 }, { attr: { r: 120 }, opacity: 0, duration: 1.1, ease: 'power2.out', repeat: n - 1, immediateRender: false }, ta);
      if (s.pulse.label) { const tx = el('text', { x: px, y: py - 70, 'text-anchor': 'middle', fill: M.arrow, 'font-family': M.font, 'font-size': M.labelSize + 6, 'font-weight': 700, stroke: M.halo || 'none', 'stroke-width': 8, 'paint-order': 'stroke', opacity: 0 }); tx.textContent = s.pulse.label; tl.to(tx, { opacity: 1, duration: .3 }, ta + .2); } }
    // camera: after the sheet is drawn, lean in on the focus point, then ease back before the push-through
    if (s.focus) { const [fx, fy] = s.focus.at, z = Math.min(1.18, s.focus.zoom || 1.15), wx = c.a.x + X0 + fx * SC, wy = c.a.y + Y0 + fy * SC;
      const cx = c.a.x + 540 + Math.max(-40, Math.min(40, (wx - c.a.x - 540) * .2)), cy = c.a.y + 960 + Math.max(-120, (wy - c.a.y - 960) * .45);
      cam.cam(c.t0 + 1.6, cx, cy, z, Math.min(1.6, Math.max(.6, d * .3)), 'sine.inOut'); cam.cam(c.t1 - 1.9, c.a.x + 540, c.a.y + 960, 1, .9, 'sine.inOut'); }
  };

  /* ============================== STAGE RIG (kartun panggung) ============================== */
  // faceless silhouette on a joint rig: transforms written by hand (J) — GSAP only tweens plain numbers
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const J = (g, x, y, r = 0, s = 1) => g.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${s})`);
  BANG.figure = (parent, { x, y, s = 1, body = '#345867', skin = '#2B4A57', prophet = false }) => {
    const root = svgEl('g', {}, parent), q = { x, y, s, lean: 0, la: -10, ra: 10, lf: 0, rf: 0, bob: 0, ll: 4, rl: -4 };
    const legL = svgEl('g', {}, root), legR = svgEl('g', {}, root), torso = svgEl('g', {}, root), armL = svgEl('g', {}, torso), armR = svgEl('g', {}, torso);
    [legL, legR].forEach(g => { svgEl('rect', { x: -15, y: 0, width: 30, height: 150, rx: 15, fill: body }, g); svgEl('ellipse', { cx: 8, cy: 150, rx: 26, ry: 13, fill: skin }, g); });
    svgEl('rect', { x: -52, y: -190, width: 104, height: 200, rx: 46, fill: body }, torso);
    [armL, armR].forEach(g => { svgEl('rect', { x: -13, y: 0, width: 26, height: 140, rx: 13, fill: body }, g); svgEl('circle', { cx: 0, cy: 144, r: 17, fill: skin }, g); });
    const head = svgEl('g', {}, torso); svgEl('circle', { cx: 0, cy: -262, r: 62, fill: skin }, head);   // head: a plain disc, NO face
    if (prophet) { const glow = svgEl('ellipse', { cx: 0, cy: -350, rx: 70, ry: 18, fill: 'none', stroke: '#F4BC52', 'stroke-width': 9, opacity: .9 }, head); svgEl('circle', { cx: 0, cy: -262, r: 96, fill: '#F4BC52', opacity: .18 }, head); }
    const shadow = svgEl('ellipse', { cx: 0, cy: 164, rx: 90, ry: 16, fill: 'rgba(0,0,0,.14)' }, parent); parent.insertBefore(shadow, root);
    const upd = () => { J(root, q.x, q.y - q.bob, 0, q.s); J(torso, 0, 0, q.lean); J(armL, -50, -168, 180 + q.la); J(armR, 50, -168, 180 + q.ra); J(legL, -22, 6, q.ll); J(legR, 22, 6, q.rl);
      shadow.setAttribute('cx', q.x); shadow.setAttribute('cy', q.y + 164 * q.s); shadow.setAttribute('rx', 90 * q.s); };
    upd(); q.upd = upd; return q;
  };
  const figTo = (q, at, props, dur = .5, ease = 'sine.inOut') => tl.to(q, { ...props, duration: dur, ease, onUpdate: q.upd }, at);
  const gesture = (q, at, end, kind) => {   // keeps the figure alive: idle bob + a gesture per beat, finite repeats
    const per = .9, n = Math.max(1, Math.floor((end - at) / per)); tl.to(q, { bob: 6, duration: per / 2, ease: 'sine.inOut', yoyo: true, repeat: n * 2 - 1, onUpdate: q.upd }, at);
    if (kind === 'wave') tl.to(q, { ra: -150, duration: .35, ease: 'power2.out', onUpdate: q.upd }, at), tl.to(q, { ra: -120, duration: .3, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.floor((end - at - .4) / .3)) | 1, onUpdate: q.upd }, at + .35);
    if (kind === 'point') tl.to(q, { ra: -100, lean: 4, duration: .4, ease: 'back.out(2)', onUpdate: q.upd }, at);
    if (kind === 'cheer') tl.to(q, { ra: -160, la: 160, duration: .35, ease: 'back.out(2)', onUpdate: q.upd }, at);
    if (kind === 'raise') tl.to(q, { ra: -165, la: 165, duration: .6, ease: 'sine.out', onUpdate: q.upd }, at);   // dua tangan terangkat (doa) — never a strike
    if (kind === 'walk') { const m = Math.floor((end - at) / .5); tl.to(q, { ll: -16, rl: 16, la: -28, ra: 28, duration: .25, ease: 'sine.inOut', yoyo: true, repeat: m * 2 - 1, onUpdate: q.upd }, at); }
  };
  BANG.stage = function (S) {
    hlCycle = S.hl || ['']; sayMode = S.say || 'scale';
    const world = $('#world'), stages = [], pal = S.palettes;
    const C = { x: 540, y: 960, z: 1.12, ox: 0, oy: 0, b: 0 };
    const applyCam = () => { stages.forEach((st, k) => { st.style.transform = `translate(${540 - C.x * C.z + C.ox}px,${960 - C.y * C.z + C.oy}px) scale(${C.z})`; }); world.style.filter = C.b > .2 ? `blur(${C.b.toFixed(1)}px)` : 'none'; };
    const cam = (at, x, y, z, dur, ease = 'sine.inOut') => tl.to(C, { x, y, z, duration: dur, ease, onUpdate: applyCam }, at);
    P.scenes.forEach((s, i) => {
      const t0 = s.startMs / 1000, d = s.durationMs / 1000, t1 = t0 + d, textAt = t0 + .55, T_ = s.type, pl = pal[i % pal.length], R = rng(i + 7);
      const st = h(`<div class="stage" style="background:linear-gradient(180deg,${pl.sky[0]},${pl.sky[1]} 62%)"></div>`); world.appendChild(st); stages.push(st);
      const svg = svgEl('svg', { viewBox: '0 0 1080 1920', width: 1080, height: 1920, class: 'stsvg' }, st);
      const put = (html, x, y, extra = '') => { const e = h(html); e.style.left = x + 'px'; e.style.top = y + 'px'; if (extra) e.style.cssText += extra; st.appendChild(e); return e; };
      // scenery: sun, clouds, hills, ground — flat, no texture
      const sun = svgEl('circle', { cx: 860, cy: 300, r: 70, fill: pl.sun }, svg);
      const clouds = [0, 1, 2].map(k => { const g = svgEl('g', { opacity: .9 }, svg); const cx = 120 + k * 360 + R() * 80, cy = 170 + R() * 160;
        [[0, 0, 60], [55, -18, 48], [100, 4, 42]].forEach(([dx, dy, r]) => svgEl('circle', { cx: cx + dx, cy: cy + dy, r, fill: '#FFFFFF' }, g)); return g; });
      svgEl('path', { d: `M-40 1150 C 200 980 420 1050 600 1110 C 780 1170 920 1010 1120 1080 L1120 1920 L-40 1920 Z`, fill: pl.hill }, svg);
      svgEl('rect', { x: -40, y: 1260, width: 1160, height: 700, fill: pl.ground }, svg);
      svgEl('rect', { x: -40, y: 1260, width: 1160, height: 22, fill: pl.edge }, svg);
      const props = svgEl('g', {}, svg);
      // moving things (≥ 8 per stage): clouds drift, sun breathes, grass sways, birds cross, sparkles twinkle
      clouds.forEach((g, k) => tl.fromTo(g, { x: -40 - k * 10 }, { x: 60 + k * 20, duration: d, ease: 'none', immediateRender: false }, t0));
      tl.fromTo(sun, { attr: { r: 64 } }, { attr: { r: 76 }, duration: Math.max(.5, d / 2), ease: 'sine.inOut', yoyo: true, repeat: 1, immediateRender: false }, t0);
      for (let k = 0; k < 9; k++) { const gx = 40 + k * 125 + R() * 30, blade = svgEl('path', { d: `M${gx} 1270 q -8 -40 6 -70 M${gx + 14} 1270 q 4 -36 22 -56`, stroke: pl.edge, 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, svg);
        blade.style.transformOrigin = `${gx}px 1270px`; tl.fromTo(blade, { rotate: -6 }, { rotate: 6, duration: .8, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.floor(d / .8)), immediateRender: false }, t0); }
      for (let k = 0; k < 2; k++) { const b = svgEl('path', { d: 'M0 0 q 14 -14 28 0 q 14 -14 28 0', stroke: pl.ink, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, svg);
        tl.fromTo(b, { x: -80 - k * 90, y: 420 + k * 70 }, { x: 1160, y: 300 + k * 40, duration: d + 1, ease: 'none', immediateRender: false }, t0); }
      // board: the diegetic surface for the text (posts + panel)
      const bx = 110, by = 220, bw = 860, bh = T_ === 'list' ? 600 : 560;
      svgEl('rect', { x: bx + 140, y: by + bh - 20, width: 26, height: 1270 - by - bh + 20, fill: pl.post }, props); svgEl('rect', { x: bx + bw - 166, y: by + bh - 20, width: 26, height: 1270 - by - bh + 20, fill: pl.post }, props);
      const board = put(`<div class="board" style="width:${bw}px;height:${bh}px;background:${pl.board}"></div>`, bx, by);
      tl.fromTo(board, { opacity: 0, y: 60, rotate: -3 }, { opacity: 1, y: 0, rotate: 0, duration: .45, ease: 'back.out(1.8)', immediateRender: false }, t0 + .1);
      const inB = (html, x, y, extra = '') => { const e = h(html); e.style.left = x + 'px'; e.style.top = y + 'px'; if (extra) e.style.cssText += extra; board.appendChild(e); return e; };
      if (s.eyebrow) label(inB(`<div class="tag" style="background:${pl.accent}">${esc(String(s.eyebrow).toUpperCase())}</div>`, 50, 44), t0 + .3);
      // figures: faceless silhouettes; hero.prophet = glow over the head, only raised hands / standing
      const hero = s.hero || {}, figs = [];
      const fA = BANG.figure(svg, { x: 265, y: 1105, s: .85, body: pl.fig[0], skin: pl.fig[1], prophet: !!hero.prophet }); figs.push(fA);
      if (!hero.prophet && i % 2 === 0) figs.push(BANG.figure(svg, { x: 815, y: 1125, s: .72, body: pl.fig[2], skin: pl.fig[3] }));
      const kind = hero.prophet ? 'raise' : ({ counter: 'point', list: 'point', quote: 'wave', ayat: 'raise' })[T_] || 'cheer';
      figs.forEach((q, k) => { const x0 = q.x; q.x = x0 + (k ? 260 : -260); q.upd(); figTo(q, t0 + .05, { x: x0 }, .6, 'power3.out'); gesture(q, t0 + .05, t0 + .65, 'walk'); gesture(q, t0 + .8 + k * .3, t1 - .1, k ? 'wave' : kind); });
      // text
      const bodyY = s.eyebrow ? 150 : 80;
      if (T_ === 'counter') {
        if (s.headline) { const ln = inB(`<div class="bline sm"></div>`, 50, bodyY); sayable(ln, s.headline); say(ln, textAt); }
        const it = (s.items || [])[0] || {}; const nEl = inB(`<div class="bnum" style="color:${pl.accent}"></div>`, 0, bodyY + 120); const r = counterTo(nEl, it, textAt + .6);
        if (it.label) label(inB(`<div class="bsub">${esc(it.label)}</div>`, 50, bodyY + 330), textAt + 1.1);
        // a meter: needle rises with the number
        const mg = svgEl('g', {}, props); svgEl('rect', { x: 505, y: 900, width: 70, height: 300, rx: 14, fill: pl.post }, mg); const fill = svgEl('rect', { x: 517, y: 1188, width: 46, height: 0, rx: 8, fill: pl.accent }, mg);
        const pct = r.pct != null ? Math.min(100, r.pct) / 100 : .8, o = { v: 0 }; tl.to(o, { v: pct, duration: 1.1, ease: 'power2.out', onUpdate() { fill.setAttribute('height', 276 * o.v); fill.setAttribute('y', 1188 - 276 * o.v); } }, textAt + .6);
      } else if (T_ === 'list') {
        if (s.headline) { const ln = inB(`<div class="bline sm"></div>`, 50, bodyY); sayable(ln, s.headline); say(ln, textAt); }
        (s.items || []).slice(0, 4).forEach((x, k) => { const row = inB(`<div class="brow"><b style="background:${pl.accent}">${k + 1}</b><span>${esc(x)}</span></div>`, 50, bodyY + 110 + k * 88); pop(row, textAt + .7 + k * .55); });
      } else if (T_ === 'quote') {
        const q = inB(`<div class="bline it"></div>`, 50, bodyY); sayable(q, `“${s.text || ''}”`); say(q, textAt, { st: .05 });
        if (s.source) label(inB(`<div class="bsub">— ${esc(s.source)}</div>`, 50, bh - 110), textAt + 1);
      } else if (T_ === 'ayat') {
        const ar = inB(`<div class="bar">${esc(s.arabic || '')}</div>`, 0, bodyY - 10); tl.fromTo(ar, { opacity: 0 }, { opacity: 1, duration: .8, immediateRender: false }, textAt);
        const tr = inB(`<div class="bline it sm"></div>`, 50, bodyY + 220); sayable(tr, `“${s.translation || ''}”`); say(tr, textAt + .6, { st: .05 });
        if (s.ref) label(inB(`<div class="bsub">${esc(s.ref)}</div>`, 50, bh - 100), textAt + 1.2);
      } else {
        const ln = inB(`<div class="bline"></div>`, 50, bodyY); sayable(ln, sceneText(s)); say(ln, textAt);
        const sub = s.subtitle || s.sub || s.note; if (sub) label(inB(`<div class="bsub">${esc(sub)}</div>`, 50, bh - 120), textAt + 1);
        for (let k = 0; k < 5; k++) { const sp = svgEl('path', { d: 'M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5 Z', fill: pl.sun }, svg); const sx = 160 + R() * 760, sy = 230 + R() * 60 + (k % 2) * (by + bh + 10 - 230);
          tl.fromTo(sp, { x: sx, y: sy, scale: 0, opacity: 0 }, { scale: 1.2, opacity: 1, duration: .3, ease: 'back.out(3)', yoyo: true, repeat: 3, immediateRender: false }, textAt + .4 + k * .25); }
      }
      // camera per stage: never wide (≥1.08); hold → one move per beat → hold; cut with a 96 px slide + blur
      if (i === 0) tl.set(C, { x: 540, y: 800, z: 1.35, onUpdate: applyCam }, 0);
      tl.set(st, { visibility: 'visible' }, t0); if (i) tl.set(stages[i - 1], { visibility: 'hidden' }, t0); st.style.visibility = i ? 'hidden' : 'visible';
      cam(t0 + .05, 540, 860, 1.12, .6, 'power3.out'); cam(t0 + Math.min(1.6, d * .4), 540, 830, 1.2, Math.max(.6, d - 2.2), 'sine.inOut');
      if (P.scenes[i + 1]) { const dir = i % 2 ? 72 : 96, ax = i % 2 ? 'oy' : 'ox';
        tl.to(C, { [ax]: -dir, b: 9, duration: .28, ease: 'power2.in', onUpdate: applyCam }, t1 - .28);
        tl.fromTo(C, { [ax]: dir }, { [ax]: 0, b: 0, duration: .42, ease: 'power3.out', onUpdate: applyCam, immediateRender: false }, t1); }
    });
    finish(S); applyCam();
  };

  /* ============================== FLOW RIG (explainer, mode aliran) ============================== */
  BANG.flow = function (S) {
    hlCycle = S.hl || ['']; sayMode = S.say || 'scale';
    const world = $('#world'), pal = S.palette, n = P.scenes.length, GAP = 1700;
    const sky = $('#sky'), far = h('<div class="strip far"></div>'), mid = h('<div class="strip mid"></div>'), near = h('<div class="strip near"></div>'), road = h('<div class="strip road"></div>');
    [far, mid, near, road].forEach(e => world.parentNode.insertBefore(e, world));
    const D = { x: 0 }, wheels = [];
    const apply = () => { world.style.transform = `translate(${-D.x}px,0)`; far.style.backgroundPositionX = `${-D.x * .15}px`; mid.style.backgroundPositionX = `${-D.x * .35}px`; near.style.backgroundPositionX = `${-D.x * .7}px`; road.style.backgroundPositionX = `${-D.x}px`; wheels.forEach(w => w.style.transform = `rotate(${D.x * 1.1}deg)`); };
    // the hero: a little faceless rider on a cart that never leaves the frame
    const hero = $('#hero'); $$('.wheel', hero).forEach(w => wheels.push(w));
    P.scenes.forEach((s, i) => {
      const t0 = s.startMs / 1000, d = s.durationMs / 1000, t1 = t0 + d, textAt = t0 + 1.4, T_ = s.type, X = 540 + i * GAP;
      // speed profile: roll fast between signposts, ease into the stop, creep while the VO talks
      tl.to(D, { x: X - 540, duration: i ? 1.3 : .01, ease: i ? 'power2.inOut' : 'none', onUpdate: apply }, i ? t0 - .2 : 0);
      tl.to(D, { x: X - 540 + 60, duration: Math.max(.4, d - 1.4), ease: 'none', onUpdate: apply }, t0 + 1.1);
      const sign = h(`<div class="sign" style="left:${X - 450}px"></div>`); world.appendChild(sign);
      const inS = (html, x, y, extra = '') => { const e = h(html); e.style.left = x + 'px'; e.style.top = y + 'px'; if (extra) e.style.cssText += extra; sign.appendChild(e); return e; };
      if (s.eyebrow) label(inS(`<div class="kick">${esc(String(s.eyebrow).toUpperCase())}</div>`, 50, 40), t0 + .8);
      const by = s.eyebrow ? 120 : 60;
      if (T_ === 'counter') {
        if (s.headline) { const ln = inS(`<div class="fline sm"></div>`, 50, by); sayable(ln, s.headline); say(ln, textAt - .3); }
        const it = (s.items || [])[0] || {}; const nEl = inS(`<div class="fnum"></div>`, 0, by + 150); counterTo(nEl, it, textAt + .3);
        if (it.label) label(inS(`<div class="fsub">${esc(it.label)}</div>`, 50, by + 380), textAt + .9);
      } else if (T_ === 'list') {
        if (s.headline) { const ln = inS(`<div class="fline sm"></div>`, 50, by); sayable(ln, s.headline); say(ln, textAt - .3); }
        (s.items || []).slice(0, 4).forEach((x, k) => pop(inS(`<div class="frow"><b>${k + 1}</b>${esc(x)}</div>`, 50, by + 140 + k * 105), textAt + .3 + k * .5));
      } else if (T_ === 'quote') {
        const q = inS(`<div class="fline it"></div>`, 50, by); sayable(q, `“${s.text || ''}”`); say(q, textAt, { st: .05 });
        if (s.source) label(inS(`<div class="fsub">— ${esc(s.source)}</div>`, 50, 500), textAt + 1);
      } else if (T_ === 'ayat') {
        const ar = inS(`<div class="fara">${esc(s.arabic || '')}</div>`, 0, by - 10); tl.fromTo(ar, { opacity: 0 }, { opacity: 1, duration: .8, immediateRender: false }, textAt - .4);
        const tr = inS(`<div class="fline it sm"></div>`, 50, by + 200); sayable(tr, `“${s.translation || ''}”`); say(tr, textAt + .2, { st: .05 });
        if (s.ref) label(inS(`<div class="fsub">${esc(s.ref)}</div>`, 50, 500), textAt + 1);
      } else {
        const ln = inS(`<div class="fline"></div>`, 50, by); sayable(ln, sceneText(s)); say(ln, textAt);
        const sub = s.subtitle || s.sub || s.note; if (sub) label(inS(`<div class="fsub">${esc(sub)}</div>`, 50, 500), textAt + 1);
      }
      // the signpost swings a little as it stops (it is part of the world, not a slide)
      tl.fromTo(sign, { rotate: -4 }, { rotate: 0, duration: .9, ease: 'elastic.out(1,.5)', immediateRender: false }, t0 + .9);
    });
    // hero bob, finite
    const per = .5; tl.to(hero, { y: -8, duration: per / 2, ease: 'sine.inOut', yoyo: true, repeat: Math.floor(T / per) * 2 - 1 }, 0);
    finish(S); apply();
  };
})();
