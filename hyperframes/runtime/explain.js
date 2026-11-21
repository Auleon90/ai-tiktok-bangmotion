/* explain.js — data-driven 9:16 runtime for the three EXPLAINER styles (papan-tulis, infografik-flat, sketsa-diagram).
   Same storyboard, three skins: the page passes a skin object K to EXPLAIN.run(K).
   Drawing: rough.js (MIT, vendored as runtime/rough.js) for the hand-drawn skins, plain SVG for the flat skin.
   HyperFrames contract: ONE paused GSAP timeline at window.__timelines["root"], absolute times, no repeat:-1, no Date/random.
   All machine motion is a pure function of scene-local time (one driver tween per scene), so seeking any frame is exact.

   Scene fields (on top of the usual id/type/vo/eyebrow):
     headline   text with *kata* highlights (shown above the diagram panel)
     diagram    {preset: "motor"|"fuelflow"|"cylinder"|"cycle4", ...} or {parts:[...]} (generic shapes, see below)
       cylinder: stroke = intake|compression|power|exhaust|cycle
       cycle4:   active = 0..3 | "cycle", hub = text in the centre circle
       motor:    focus = label at the engine (default "ruang bakar")
       parts:    [{shape: rect|circle|ellipse|poly|line|arrow|text, role, at (0..1 of scene), ...geometry in a 1000×936 box}]
     items      counter [{value,label,prefix,suffix}] or list ["..."] when there is no diagram
   Panel: viewBox 1000×936 drawn at x 40, y 380 (keep content above y≈880 of the box: captions start at 1320 px). */
(function () {
  const P = window.PROPS, T = P.totalMs / 1000, NS = 'http://www.w3.org/2000/svg';
  const tl = gsap.timeline({ paused: true });
  const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const el = (tag, a = {}, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };
  const html = (s) => { const d = document.createElement('div'); d.innerHTML = s.trim(); return d.firstChild; };
  const rng = seed => { let x = (seed * 9301 + 49297) % 233280; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const EX = window.EXPLAIN = { tl, el, rng, presets: {} };

  EX.run = function (K) {
    const stage = $('#stage'), world = $('#world');
    const C = K.col;
    const role = r => {   // → {stroke, fill} for this skin
      if (r === 'none') return { stroke: C.ink, fill: 'none' };
      const f = C[r] ?? r;
      if (K.rough) return { stroke: (K.colorStroke && /^(fire|fuel|air|gas|accent|hl)$/.test(r)) ? C[r + 'Ink'] || C.ink : C.ink, fill: f };
      return { stroke: 'none', fill: f };
    };

    P.scenes.forEach((s, i) => {
      const t0 = s.startMs / 1000, d = s.durationMs / 1000, t1 = t0 + d;
      const sc = html(`<div class="scn"></div>`); world.appendChild(sc);
      if (K.trans === 'pan') sc.style.left = (i * 1180) + 'px';
      const inner = html(`<div class="scn-in"></div>`); sc.appendChild(inner);
      // ---- text: eyebrow + headline (scene 1 = hook, fully visible on frame 0)
      if (s.eyebrow) { const e = html(`<div class="eb">${esc(s.eyebrow)}</div>`); inner.appendChild(e); if (i) tl.fromTo(e, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .35, immediateRender: false }, t0 + .1); }
      const head = s.headline || s.title || '';
      if (head) {
        const hd = html(`<div class="hd"></div>`); inner.appendChild(hd);
        String(head).split(/(\*[^*]+\*)/).forEach(p => { if (!p) return;
          if (/^\*.*\*$/.test(p)) hd.appendChild(html(`<span class="w hl"><i></i><b>${esc(p.slice(1, -1))}</b></span>`));
          else p.split(/\s+/).filter(Boolean).forEach(w => hd.appendChild(html(`<span class="w">${esc(w)}</span>`))); });
        const ws = $$('.w', hd), his = $$('.hl i', hd);
        if (i === 0) { his.forEach(h => h.style.transform = 'scaleX(1)'); }
        else { ws.forEach(w => w.style.opacity = 0); his.forEach(h => h.style.transform = 'scaleX(0)');
          tl.fromTo(ws, K.say.from, { ...K.say.to, stagger: K.say.stagger, immediateRender: false }, t0 + .2);
          his.forEach((h, k) => tl.to(h, { scaleX: 1, duration: .45, ease: 'power2.out' }, t0 + .4 + ws.length * K.say.stagger + k * .2)); }
      }
      const sub = s.subtitle || s.sub; if (sub) { const e = html(`<div class="sub">${esc(sub)}</div>`); inner.appendChild(e); tl.fromTo(e, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .4, immediateRender: false }, t0 + 1.2); }

      // ---- panel
      const svg = el('svg', { viewBox: K.full ? '0 0 1080 1920' : '0 0 1000 936', class: 'panel' }); inner.appendChild(svg);
      const layer = el('g', {}, svg);
      const rc = K.rough ? rough.svg(svg) : null;
      let seed = i * 997 + 11; const enters = [], ups = [];
      const B = {
        C, t0, d, t1, i, svg, layer, rng: rng(i * 31 + 7),
        // shape(kind, geometry, role, opts) → {outer, inner}; outer gets the entrance, inner is free for motion
        shape(kind, g, r, o = {}) {
          const outer = el('g', {}, o.parent || layer), inn = el('g', {}, outer), c = role(r);
          const sw = o.sw ?? (K.rough ? K.rough.strokeWidth : 0);
          if (rc && !o.plain) {
            const opt = { seed: seed++, roughness: o.roughness ?? K.rough.roughness, bowing: K.rough.bowing, stroke: o.stroke || c.stroke, strokeWidth: sw,
              fill: c.fill === 'none' ? undefined : c.fill, fillStyle: o.fillStyle || K.rough.fillStyle, hachureGap: o.gap || K.rough.hachureGap, fillWeight: K.rough.fillWeight, hachureAngle: -41 + (seed % 3) * 8 };
            let n;
            if (kind === 'rect') n = rc.rectangle(g.x, g.y, g.w, g.h, opt);
            else if (kind === 'circle') n = rc.circle(g.cx, g.cy, g.r * 2, opt);
            else if (kind === 'ellipse') n = rc.ellipse(g.cx, g.cy, g.rx * 2, g.ry * 2, opt);
            else if (kind === 'poly') n = rc.polygon(g.pts, opt);
            else if (kind === 'line' || kind === 'arrow') { n = g.curve ? rc.curve(g.pts, { ...opt, fill: undefined }) : rc.linearPath(g.pts, { ...opt, fill: undefined }); if (o.stroke == null && r !== 'ink') n.querySelectorAll('path').forEach(p => p.setAttribute('stroke', C[r] || c.fill)); }
            inn.appendChild(n);
            if (kind === 'arrow') { const h = arrowHead(g.pts, o.head || 34); const hn = rc.linearPath([h[1], h[0], h[2]], { ...opt, fill: undefined, roughness: .6 }); hn.querySelectorAll('path').forEach(p => p.setAttribute('stroke', C[r] || c.fill)); inn.appendChild(hn); }
          } else {
            const f = c.fill, line = kind === 'line' || kind === 'arrow', col = C[r] || f;
            const a = line ? { fill: 'none', stroke: col, 'stroke-width': o.sw ?? 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } : { fill: f, stroke: o.stroke || 'none', 'stroke-width': o.sw ?? 0 };
            if (kind === 'rect') el('rect', { x: g.x, y: g.y, width: g.w, height: g.h, rx: g.r ?? K.radius ?? 0, ...a }, inn);
            else if (kind === 'circle') el('circle', { cx: g.cx, cy: g.cy, r: g.r, ...a }, inn);
            else if (kind === 'ellipse') el('ellipse', { cx: g.cx, cy: g.cy, rx: g.rx, ry: g.ry, ...a }, inn);
            else if (kind === 'poly') el('path', { d: rounded(g.pts, K.radius ? 10 : 0), ...a }, inn);
            else if (line) el('path', { d: g.curve ? smooth(g.pts) : 'M' + g.pts.map(p => p.join(' ')).join(' L'), ...a }, inn);
            if (kind === 'arrow') { const h = arrowHead(g.pts, o.head || 40); el('path', { d: `M${h[1].join(' ')} L${h[0].join(' ')} L${h[2].join(' ')} Z`, fill: col, stroke: col, 'stroke-width': 6, 'stroke-linejoin': 'round' }, inn); }
            if (K.shade && !line && f !== 'none' && !o.noShade) outer.setAttribute('filter', 'url(#shade)');
          }
          if (!o.noEnter) enters.push({ el: outer, at: o.at, text: false });
          return { outer, inner: inn };
        },
        text(x, y, t, o = {}) {
          const outer = el('g', {}, o.parent || layer), inn = el('g', {}, outer);
          const lines = String(t).split('\n');
          lines.forEach((ln, k) => { const tx = el('text', { x, y: y + k * (o.size || K.label.size) * 1.12, 'text-anchor': o.anchor || 'middle', 'font-family': o.font || K.label.font, 'font-size': o.size || K.label.size, 'font-weight': o.weight || K.label.weight, fill: o.fill || C[o.role] || K.label.color }, inn); tx.textContent = ln;
            if (o.halo) { tx.setAttribute('stroke', o.halo); tx.setAttribute('stroke-width', 10); tx.setAttribute('paint-order', 'stroke'); } });
          if (!o.noEnter) enters.push({ el: outer, at: o.at, text: true });
          return { outer, inner: inn };
        },
        dot(r, fill) { const c = el('circle', { r, fill, cx: -99, cy: -99 }, layer); if (K.rough) { c.setAttribute('stroke', C.ink); c.setAttribute('stroke-width', 2.5); } return c; },
        update(f) { ups.push(f); },
        T: f => t0 + f * d,
      };
      const dg = s.diagram;
      if (dg && dg.preset && EX.presets[dg.preset]) EX.presets[dg.preset](B, dg, s);
      else if (dg && dg.parts) parts(B, dg.parts);
      else if (s.type === 'counter') counter(B, s);
      else if (s.type === 'list') list(B, s);
      else if (s.type === 'quote' || s.type === 'ayat') quote(B, s);

      // ---- entrances (draw-on for the rough skins, pop for flat)
      let k = 0;
      enters.forEach(e => {
        const at = e.at != null ? t0 + e.at * d : t0 + .45 + (k++) * K.stagger;
        if (K.enter === 'draw' && !e.text) {
          const ps = $$('path', e.el); ps.forEach(p => { const L = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600) + 2; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
          if (ps.length) tl.to(ps, { strokeDashoffset: 0, duration: K.drawDur, ease: 'power1.inOut', stagger: K.drawDur / Math.max(4, ps.length) * .6 }, at);
        } else {
          e.el.style.opacity = 0;
          if (K.enter === 'pop' && !e.text) tl.fromTo(e.el, { opacity: 0, scale: .55, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: .55, ease: 'back.out(1.7)', immediateRender: false }, at);
          else tl.fromTo(e.el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out', immediateRender: false }, at);
        }
      });
      // ---- motion driver: one tween, all machine motion = f(local time)
      if (ups.length) { const st = { lt: 0 }; ups.forEach(f => f(0)); tl.fromTo(st, { lt: 0 }, { lt: d + .5, duration: d + .5, ease: 'none', immediateRender: false, onUpdate: () => ups.forEach(f => f(st.lt)) }, t0); }
      // ---- slow breath on the panel
      if ((K.breath ?? 1.03) !== 1) tl.fromTo(svg, { scale: 1, transformOrigin: '50% 40%' }, { scale: K.breath ?? 1.03, duration: d, ease: 'sine.inOut', immediateRender: false }, t0);

      // ---- transitions
      if (K.trans === 'cut') {
        sc.style.visibility = i ? 'hidden' : 'visible'; if (i) tl.set(sc, { visibility: 'visible' }, t0 - .01); if (P.scenes[i + 1]) tl.set(sc, { visibility: 'hidden' }, t1 + .02);
      } else if (K.trans === 'pan') {
        if (i === 0) tl.set(world, { x: 0 }, 0); else tl.to(world, { x: -i * 1180, duration: .75, ease: 'power3.inOut' }, t0 - .4);
      } else {
        sc.style.visibility = i ? 'hidden' : 'visible';
        if (i) tl.set(sc, { visibility: 'visible' }, t0 - .01);
        if (P.scenes[i + 1]) tl.set(sc, { visibility: 'hidden' }, t1 + .02);
        if (K.trans === 'slide' && i) tl.fromTo(sc, { y: 160, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out', immediateRender: false }, t0);
        if (P.scenes[i + 1]) tl.to(sc, K.trans === 'slide' ? { scale: .94, opacity: 0, duration: .3, ease: 'power2.in' } : { opacity: 0, x: -60, filter: 'blur(5px)', duration: .3, ease: 'power2.in' }, t1 - .3);
      }
    });
    if (window.BM && $('#caps')) BM.captions(tl, $('#caps'), P.words, { accent: K.cap.accent, text: K.cap.text });
    tl.to({}, { duration: .01 }, T);
    K.ambient && K.ambient(tl, T);
    window.__timelines = window.__timelines || {}; window.__timelines["root"] = tl;
  };

  // ---------- geometry helpers
  function arrowHead(pts, s) { const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[pts.length - 2], a = Math.atan2(y1 - y0, x1 - x0);
    return [[x1, y1], [x1 - s * Math.cos(a - .45), y1 - s * Math.sin(a - .45)], [x1 - s * Math.cos(a + .45), y1 - s * Math.sin(a + .45)]]; }
  function smooth(P) { let d = `M${P[0][0]} ${P[0][1]}`; for (let q = 1; q < P.length; q++) { const [x1, y1] = P[q]; d += q < P.length - 1 ? ` Q${x1} ${y1} ${(x1 + P[q + 1][0]) / 2} ${(y1 + P[q + 1][1]) / 2}` : ` L${x1} ${y1}`; } return d; }
  function rounded(P, r) { if (!r) return 'M' + P.map(p => p.join(' ')).join(' L') + 'Z'; let d = ''; const n = P.length;
    for (let k = 0; k < n; k++) { const p = P[k], a = P[(k - 1 + n) % n], b = P[(k + 1) % n];
      const u = (q) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, rr = Math.min(r, L / 2); return [p[0] + dx / L * rr, p[1] + dy / L * rr]; };
      const A = u(a), Bp = u(b); d += (k ? ' L' : 'M') + A.join(' ') + ` Q${p[0]} ${p[1]} ${Bp.join(' ')}`; } return d + 'Z'; }
  function alongPath(P, s) { let L = 0; const seg = []; for (let q = 1; q < P.length; q++) { const l = Math.hypot(P[q][0] - P[q - 1][0], P[q][1] - P[q - 1][1]); seg.push(l); L += l; }
    let t = clamp(s) * L; for (let q = 0; q < seg.length; q++) { if (t <= seg[q]) { const f = t / seg[q]; return [lerp(P[q][0], P[q + 1][0], f), lerp(P[q][1], P[q + 1][1], f)]; } t -= seg[q]; } return P[P.length - 1]; }
  const star = (cx, cy, R, r, n = 8) => { const p = []; for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r : R; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };
  const scaleAbout = (g, cx, cy, s) => g.setAttribute('transform', `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`);
  EX.util = { arrowHead, smooth, alongPath, star, scaleAbout, clamp, ease, lerp };

  // ---------- generic parts
  function parts(B, list) { list.forEach(p => { const g = p, r = p.role || 'ink', o = { at: p.at, sw: p.sw };
    if (p.shape === 'text') B.text(p.x, p.y, p.text, { size: p.size, role: p.role, at: p.at, anchor: p.anchor }); else B.shape(p.shape, g, r, o); }); }
  function counter(B, s) { const it = (s.items || [])[0] || {}; const t = B.text(500, 420, '0', { size: 230, weight: 900, role: 'accent', font: B.C.numFont });
    const tx = t.inner.querySelector('text'), target = parseFloat(String(it.value).replace(/\./g, '').replace(',', '.')) || 0;
    B.update(lt => { const v = target * ease(clamp((lt - .6) / 1.2)); tx.textContent = (it.prefix || '') + (Number.isInteger(target) ? Math.round(v).toLocaleString('id-ID') : v.toFixed(1).replace('.', ',')) + (it.suffix || ''); });
    if (it.label) B.text(500, 540, it.label, { size: 46 }); }
  function list(B, s) { (s.items || []).slice(0, 4).forEach((x, k) => { B.shape('circle', { cx: 120, cy: 120 + k * 170, r: 44 }, 'accent'); B.text(120, 136 + k * 170, String(k + 1), { size: 48, weight: 800, fill: '#fff' }); B.text(200, 136 + k * 170, x, { size: 50, anchor: 'start' }); }); }
  function quote(B, s) { if (s.arabic) s.arabic.split(/\s*۝\s*/).forEach((ln, k) => B.text(500, 110 + k * 130, ln, { size: 64, font: 'Amiri', role: 'accentText' })); B.text(500, s.arabic ? 420 : 300, (s.text || s.translation || '').replace(/(.{1,26})(\s|$)/g, '$1\n').trim(), { size: 54 }); if (s.source || s.ref) B.text(500, 760, '— ' + (s.source || s.ref), { size: 40, role: 'mute' }); }

  // ================= PRESETS (engine explainer) =================
  /* motor — side view of a motorcycle; the engine gets a pulse ring + label, then tiny bursts (the explosions) */
  EX.presets.motor = function (B, sp) {
    const W1 = [240, 690], W2 = [790, 690], R = 120;
    const wheel = ([x, y]) => { const w = B.shape('circle', { cx: x, cy: y, r: R }, 'tire', { sw: (B.C.tireW) }); const hub = B.shape('circle', { cx: x, cy: y, r: 46 }, 'metal');
      const sp3 = B.shape('line', { pts: [[x - 84, y], [x + 84, y]] }, 'ink', { sw: 6 }); const sp4 = B.shape('line', { pts: [[x, y - 84], [x, y + 84]] }, 'ink', { sw: 6 });
      return [sp3, sp4]; };
    const spokes = [...wheel(W1), ...wheel(W2)];
    B.shape('line', { pts: [[240, 690], [430, 610]] }, 'ink', { sw: 16 });                       // swing arm
    B.shape('line', { pts: [[180, 690], [300, 700], [470, 690]] }, 'metal', { sw: 20, curve: true }); // exhaust
    const eng = B.shape('rect', { x: 400, y: 540, w: 210, h: 160, r: 22 }, 'metal');              // engine block
    B.shape('line', { pts: [[420, 580], [590, 580]] }, 'ink', { sw: 5 }); B.shape('line', { pts: [[420, 615], [590, 615]] }, 'ink', { sw: 5 });
    B.shape('poly', { pts: [[300, 440], [700, 430], [745, 500], [700, 540], [330, 540], [270, 500]] }, 'body'); // frame cover
    B.shape('poly', { pts: [[450, 380], [660, 372], [700, 440], [440, 450]] }, 'accent');          // tank
    B.shape('poly', { pts: [[230, 420], [450, 400], [445, 448], [250, 460]] }, 'seat');           // seat
    B.shape('line', { pts: [[700, 400], [790, 690]] }, 'metal', { sw: 18 });                      // fork
    B.shape('line', { pts: [[650, 360], [720, 345], [690, 320]] }, 'ink', { sw: 12 });           // handlebar
    B.shape('circle', { cx: 760, cy: 450, r: 34 }, 'hl');                                         // headlight
    B.shape('line', { pts: [[700, 600], [790, 560], [880, 600]] }, 'body', { sw: 16, curve: true }); // fender
    // ground
    B.shape('line', { pts: [[40, 815], [960, 815]] }, 'mute', { sw: 5 });
    // focus: dashed ring + label + arrow
    const ring = B.shape('circle', { cx: 505, cy: 620, r: 150 }, 'none', { at: .42, sw: 6, stroke: B.C.accent, roughness: 1.4 });
    ring.outer.setAttribute('stroke-dasharray', '1');
    B.shape('arrow', { pts: [[800, 210], [700, 330], [610, 520]], curve: true }, 'accent', { at: .5, sw: 8 });
    B.text(800, 180, sp.focus || 'ruang bakar', { at: .55, size: 58, weight: 800, role: 'accentText' });
    // bursts inside the engine (explosions), from 60 % of the scene
    const bursts = [0, 1, 2].map(k => { const b = B.shape('poly', { pts: star(470 + k * 35, 630 - (k % 2) * 25, 46, 18) }, 'fire', { noEnter: true, sw: 3 }); b.outer.style.opacity = 0; return b; });
    B.update(lt => {
      const run = clamp((lt - .3) / 1.2), ang = lt * 260 * run;
      spokes.forEach((s, k) => { const c = k < 2 ? W1 : W2; s.inner.setAttribute('transform', `rotate(${ang} ${c[0]} ${c[1]})`); });
      const on = lt > B.d * .6;
      bursts.forEach((b, k) => { const ph = ((lt * 7 + k / 3) % 1); b.outer.style.opacity = on ? (ph < .5 ? 1 : 0) : 0; scaleAbout(b.inner, 470 + k * 35, 630 - (k % 2) * 25, .5 + ph); });
    });
  };

  /* fuelflow — tank → pipe → injector spray + air → mixing chamber, with the ratio */
  EX.presets.fuelflow = function (B, sp) {
    B.shape('rect', { x: 70, y: 90, w: 320, h: 230, r: 26 }, 'metal');
    B.shape('rect', { x: 92, y: 190, w: 276, h: 110, r: 14 }, 'fuel', { gap: 10 });
    B.text(230, 160, 'tangki', { size: 46, weight: 700 });
    const pipe = [[230, 320], [230, 470], [330, 560], [430, 580]];
    B.shape('line', { pts: pipe, curve: true }, 'ink', { sw: 12 });
    B.shape('poly', { pts: [[430, 555], [500, 565], [500, 600], [430, 610]] }, 'metal');
    B.text(300, 670, 'injektor', { size: 42, role: 'mute' });
    const air = [[960, 380], [800, 470], [620, 600]];
    B.shape('arrow', { pts: air, curve: true }, 'air', { sw: 12 });
    B.text(880, 350, 'udara', { size: 50, weight: 700, role: 'airText' });
    B.shape('circle', { cx: 560, cy: 720, r: 130 }, 'mix', { gap: 16 });
    B.text(560, 885, 'campuran', { size: 42, role: 'mute', at: .45 });
    B.text(840, 720, sp.ratio || '1 : 14,7', { size: 74, weight: 900, role: 'accentText', at: .55 });
    B.text(840, 770, sp.ratioNote || 'bensin : udara', { size: 34, role: 'mute', at: .6 });
    const r = B.rng, fuel = [], airs = [];
    for (let k = 0; k < 14; k++) fuel.push({ c: B.dot(11, B.C.fuel), ph: r(), a: r() * 6.28, rr: 30 + r() * 85 });
    for (let k = 0; k < 18; k++) airs.push({ c: B.dot(10, B.C.air), ph: r(), a: r() * 6.28, rr: 30 + r() * 90 });
    const fuelPath = [...pipe, [500, 585], [540, 650]];
    B.update(lt => {
      const vis = clamp((lt - 1.1) / .4);
      const move = (list, path, sp) => list.forEach((p, k) => { const s = (lt * sp + p.ph) % 1.8; let x, y;
        if (s < 1) [x, y] = alongPath(path, s); else { const a = p.a + lt * 2.2 * (k % 2 ? 1 : -1), rr = p.rr * clamp((s - 1) * 3); x = 560 + Math.cos(a) * rr; y = 720 + Math.sin(a) * rr; }
        p.c.setAttribute('cx', x.toFixed(1)); p.c.setAttribute('cy', y.toFixed(1)); p.c.setAttribute('opacity', vis); });
      move(fuel, fuelPath, .35); move(airs, air, .45);
    });
  };

  /* cylinder — cross-section, slider-crank geometry; stroke: intake|compression|power|exhaust|cycle */
  EX.presets.cylinder = function (B, sp) {
    const CX = 500, CY = 705, r = 90, L = 240, TOP = 232, XL = 335, XR = 665, stroke = sp.stroke || 'cycle';
    // static block
    B.shape('rect', { x: 60, y: 140, w: 290, h: 56, r: 10 }, 'port', { gap: 12 });     // intake port
    B.shape('rect', { x: 650, y: 140, w: 290, h: 56, r: 10 }, 'port', { gap: 12 });    // exhaust port
    B.shape('rect', { x: 300, y: 120, w: 400, h: 112, r: 14 }, 'metal');              // head
    B.shape('rect', { x: 300, y: 232, w: 35, h: 420 }, 'metal');                      // walls
    B.shape('rect', { x: 665, y: 232, w: 35, h: 420 }, 'metal');
    B.shape('circle', { cx: CX, cy: CY, r: 165 }, 'none', { sw: 4, stroke: B.C.mute });   // crankcase
    const plug = B.shape('rect', { x: 482, y: 40, w: 36, h: 100, r: 6 }, 'plug');
    B.shape('line', { pts: [[500, 140], [500, 236]] }, 'ink', { sw: 6 });
    // labels
    B.text(205, 120, 'katup masuk', { size: 36, role: 'mute' }); B.text(795, 120, 'katup buang', { size: 36, role: 'mute' });
    B.text(600, 70, 'busi', { size: 40, weight: 700, anchor: 'start' });
    B.text(845, 470, 'piston', { size: 40, weight: 700 }); B.shape('line', { pts: [[780, 470], [700, 470]] }, 'ink', { sw: 4 });
    B.text(845, 860, 'poros engkol', { size: 36, role: 'mute' });
    // moving parts (built at the origin, placed per frame)
    const vIn = B.shape('line', { pts: [[410, 150], [410, 225]] }, 'ink', { sw: 8 }); B.shape('ellipse', { cx: 410, cy: 228, rx: 42, ry: 10 }, 'ink', { parent: vIn.inner, noEnter: true, sw: 3 });
    const vEx = B.shape('line', { pts: [[590, 150], [590, 225]] }, 'ink', { sw: 8 }); B.shape('ellipse', { cx: 590, cy: 228, rx: 42, ry: 10 }, 'ink', { parent: vEx.inner, noEnter: true, sw: 3 });
    const crank = B.shape('circle', { cx: 0, cy: 0, r: 110 }, 'metal2'); B.shape('circle', { cx: 0, cy: -r, r: 22 }, 'ink', { parent: crank.inner, noEnter: true, sw: 3 });
    const rod = B.shape('rect', { x: -17, y: 0, w: 34, h: L, r: 14 }, 'metal2');
    const pis = B.shape('rect', { x: -160, y: -40, w: 320, h: 110, r: 10 }, 'metal');
    B.shape('line', { pts: [[-160, -18], [160, -18]] }, 'ink', { parent: pis.inner, noEnter: true, sw: 4 }); B.shape('line', { pts: [[-160, 2], [160, 2]] }, 'ink', { parent: pis.inner, noEnter: true, sw: 4 });
    const flame = B.shape('rect', { x: XL, y: TOP, w: XR - XL, h: 100 }, 'fire', { noEnter: true, plain: true }); flame.outer.style.opacity = 0;
    const spark = B.shape('poly', { pts: star(500, 245, 70, 22, 9) }, 'spark', { noEnter: true, sw: 3 }); spark.outer.style.opacity = 0;
    const push = B.shape('arrow', { pts: [[955, 270], [955, 600]] }, 'fire', { noEnter: true, sw: 14 }); push.outer.style.opacity = 0;
    const flowIn = B.shape('arrow', { pts: [[80, 168], [330, 168]] }, 'air', { noEnter: true, sw: 10 }); flowIn.outer.style.opacity = 0;
    const flowOut = B.shape('arrow', { pts: [[670, 168], [930, 168]] }, 'gas', { noEnter: true, sw: 10 }); flowOut.outer.style.opacity = 0;
    const note = sp.note ? B.text(500, 925 - 40, sp.note, { size: 44, weight: 800, role: 'accentText', at: .7, halo: B.C.paper }) : null;
    // particles
    const N = 30, R = B.rng, ps = []; for (let k = 0; k < N; k++) ps.push({ c: B.dot(11, k % 3 ? B.C.air : B.C.fuel), u: R(), v: R(), ph: R() * 6.28, pk: k / N, fuel: !(k % 3) });
    const th0 = { intake: 0, compression: 180, power: 360, exhaust: 540, cycle: 0 }[stroke];
    const span = stroke === 'cycle' ? 720 * (sp.turns || 2) : 180;
    const geo = th => { const a = th * Math.PI / 180, sx = r * Math.sin(a), pinY = CY - (r * Math.cos(a) + Math.sqrt(L * L - sx * sx)); return { a, pinY, cpx: CX + sx, cpy: CY - r * Math.cos(a) }; };
    B.update(lt => {
      const w0 = B.d * (stroke === 'cycle' ? .1 : .2), w1 = B.d * (stroke === 'cycle' ? .95 : .8);
      const prog = stroke === 'cycle' ? clamp((lt - w0) / (w1 - w0)) : ease(clamp((lt - w0) / (w1 - w0)));
      const th = th0 + span * prog, g = geo(th), phase = stroke === 'cycle' ? ['intake', 'compression', 'power', 'exhaust'][Math.floor(((th % 720) + 720) % 720 / 180)] : stroke;
      const ph = stroke === 'cycle' ? ((th % 180) / 180) : prog;
      pis.inner.setAttribute('transform', `translate(${CX} ${g.pinY})`);
      rod.inner.setAttribute('transform', `translate(${CX} ${g.pinY}) rotate(${-Math.atan2(g.cpx - CX, g.cpy - g.pinY) * 180 / Math.PI})`);
      crank.inner.setAttribute('transform', `translate(${CX} ${CY}) rotate(${th})`);
      const open = (on) => on ? Math.sin(clamp(ph) * Math.PI) * 34 : 0;
      vIn.inner.setAttribute('transform', `translate(0 ${open(phase === 'intake')})`); vEx.inner.setAttribute('transform', `translate(0 ${open(phase === 'exhaust')})`);
      const top = g.pinY - 40 - 8, H = Math.max(20, top - TOP - 14);
      // power: spark, flame, push arrow
      const pw = phase === 'power';
      spark.outer.style.opacity = pw && ph < .14 ? 1 : 0; scaleAbout(spark.inner, 500, 245, .6 + ph * 4);
      flame.outer.style.opacity = pw ? (1 - ph) * .85 : 0; flame.inner.querySelector('rect,path') && flame.inner.firstChild.setAttribute('height', Math.max(0, top - TOP));
      push.outer.style.opacity = pw && ph > .08 ? 1 : 0;
      flowIn.outer.style.opacity = phase === 'intake' && lt > w0 ? .9 : 0; flowOut.outer.style.opacity = phase === 'exhaust' && lt > w0 ? .9 : 0;
      ps.forEach((p, k) => {
        const jx = Math.sin(lt * 3 + p.ph) * 6, jy = Math.cos(lt * 2.6 + p.ph) * 6;
        let x = XL + 18 + p.u * (XR - XL - 36) + jx, y = TOP + 14 + p.v * H + jy, op = 1, col = p.fuel ? B.C.fuel : B.C.air;
        if (phase === 'intake') { const e = (ph - p.pk * .85) / .15;
          if (e < 0) { x = 330 - (-e) * 120; y = 168; op = x < 70 ? 0 : 1; } else if (e < 1) { x = lerp(410, x, e); y = lerp(245, y, e); } }
        if (phase === 'power') col = ph < .55 ? B.C.fire : B.C.gas;
        if (phase === 'exhaust') { col = B.C.gas; const e = (ph - p.pk * .85) / .15; if (e > 0) { if (e < 1) { x = lerp(x, 590, e); y = lerp(y, 245, e); } else { x = 610 + (e - 1) * 140; y = 168; op = x > 930 ? 0 : 1; } } }
        if (stroke === 'cycle' && phase === 'intake' && th < 180) op = op;   // first intake fills the cylinder
        p.c.setAttribute('cx', x.toFixed(1)); p.c.setAttribute('cy', y.toFixed(1)); p.c.setAttribute('fill', col);
        p.c.setAttribute('opacity', (lt > .5 ? op : 0)); p.c.setAttribute('r', phase === 'compression' ? 11 - ph * 2 : 11);
      });
    });
  };

  /* cycle4 — the four strokes as a loop of cards; active card cycles; hub text in the middle */
  EX.presets.cycle4 = function (B, sp) {
    const box = [[60, 60], [540, 60], [540, 480], [60, 480]], W = 400, H = 340;
    const names = sp.names || ['1 · Hisap', '2 · Kompresi', '3 · Usaha', '4 · Buang'];
    const notes = sp.notes || ['katup masuk buka\npiston turun', 'katup tertutup\npiston naik', 'busi memercik\npiston terdorong', 'katup buang buka\ngas keluar'];
    const roles = ['air', 'card', 'fire', 'gas'];
    box.forEach(([x, y], k) => { B.shape('rect', { x, y, w: W, h: H, r: 26 }, roles[k] === 'card' ? 'card' : roles[k] + 'Soft', { gap: 18 });
      B.text(x + W / 2, y + 110, names[k], { size: 58, weight: 800 }); B.text(x + W / 2, y + 200, notes[k], { size: 38, role: 'mute' }); });
    const arrows = [[[470, 150], [530, 150]], [[750, 410], [750, 470]], [[530, 720], [470, 720]], [[250, 470], [250, 410]]];
    arrows.forEach(a => B.shape('arrow', { pts: a }, 'ink', { sw: 8, head: 22 }));
    const hl = B.shape('rect', { x: 0, y: 0, w: W + 24, h: H + 24, r: 32 }, 'none', { noEnter: true, sw: 10, stroke: B.C.accent, roughness: .8, fillStyle: 'solid' });
    hl.outer.style.opacity = 0;
    B.shape('circle', { cx: 500, cy: 450, r: 110 }, 'fire', { at: .35 });
    B.text(500, 440, sp.hub || '1 ledakan', { size: 44, weight: 900, at: .4, fill: B.C.hubText });
    if (sp.hub2) B.text(500, 492, sp.hub2, { size: 34, at: .45, fill: B.C.hubText });
    B.update(lt => { const k = sp.active === 'cycle' || sp.active == null ? Math.floor(Math.max(0, lt - 1.2) / .8) % 4 : sp.active;
      hl.outer.style.opacity = lt > 1.2 ? 1 : 0; hl.inner.setAttribute('transform', `translate(${box[k][0] - 12} ${box[k][1] - 12})`); });
  };
})();
