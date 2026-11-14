/* bang-motion HyperFrames helpers. Requires gsap + window.PROPS (injected by scripts/produce.py).
 * PROPS = { totalMs, scenes:[{id,type,startMs,durationMs,...storyboard fields}], words:[{text,startMs,endMs}] }
 * Everything here is a pure function of timeline time (HyperFrames seeks frame by frame).
 */
(function () {
  const s = (ms) => ms / 1000;

  /** Fade a scene element in/out over its storyboard window. */
  function scene(tl, el, sc, opts = {}) {
    const fade = opts.fade ?? 0.4;
    const a = s(sc.startMs), d = s(sc.durationMs);
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: fade, ease: "power2.out" }, a);
    if (opts.keepLast !== true) tl.to(el, { opacity: 0, duration: fade, ease: "power2.in" }, a + d - fade / 2);
    return { start: a, dur: d, end: a + d };
  }

  /** Word-synced captions: groups of <=3 words, active word highlighted with a pop. */
  function captions(tl, container, words, opts = {}) {
    const accent = opts.accent ?? "#e9b552";
    const text = opts.text ?? "#f6efe2";
    const max = opts.maxWords ?? 3;
    const groups = [];
    let cur = [];
    words.forEach((w, i) => {
      cur.push(w);
      if (cur.length >= max || /[.,!?;:]$/.test(w.text) || i === words.length - 1) { groups.push(cur); cur = []; }
    });
    groups.forEach((g, gi) => {
      const line = document.createElement("div");
      line.className = "bm-line";
      container.appendChild(line);
      const gStart = s(g[0].startMs);
      const next = groups[gi + 1];
      const gEnd = next ? Math.min(s(next[0].startMs), s(g[g.length - 1].endMs) + 0.6) : s(g[g.length - 1].endMs) + 0.6;
      tl.set(line, { opacity: 1 }, gStart);
      tl.set(line, { opacity: 0 }, gEnd);
      g.forEach((w, wi) => {
        const span = document.createElement("span");
        span.className = "bm-word";
        span.textContent = w.text;
        line.appendChild(span);
        const ws = s(w.startMs);
        const we = wi < g.length - 1 ? s(g[wi + 1].startMs) : gEnd;
        tl.fromTo(span, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, ws);
        tl.fromTo(span, { color: text, scale: 0.85 }, { color: accent, scale: 1.05, duration: 0.18, ease: "back.out(3)" }, ws);
        tl.to(span, { color: text, scale: 1, duration: 0.1 }, Math.max(ws + 0.18, we - 0.05));
      });
    });
  }

  /** Place a looping Lottie from assets/lottie/<name>.json (data preloaded in window.LOTTIE). */
  function lottieFx(parent, name, x, y, size = 400) {
    const el = document.createElement("div");
    el.className = "bm-lottie";
    Object.assign(el.style, { left: x - size / 2 + "px", top: y - size / 2 + "px", width: size + "px", height: size + "px" });
    parent.appendChild(el);
    const data = (window.LOTTIE || {})[name];
    if (!data || !window.lottie) { console.warn("lottie missing", name); return el; }
    window.lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: false, animationData: data });
    return el;
  }

  /** Seeded PRNG (mulberry32) for deterministic particles. */
  function rng(seed) {
    return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  window.BM = { scene, captions, lottieFx, rng, sec: s };
})();
