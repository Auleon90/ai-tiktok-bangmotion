// Pre-render QA: how much of each AI image is actually visible in the frame.
// Usage: node scripts/qa_images.js <hf_project_dir> [minVisible=0.8]
// Seeks the HyperFrames timeline to the middle of each scene that has an image and measures, for every <img>,
// the share of the picture (after object-fit cover/contain, transforms, overflow:hidden ancestors and the
// 1080x1920 frame) that lands on screen. Prints JSON: [{scene, t, src, visible, ok}]. Exit 2 if any image < min.
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const dir = path.resolve(process.argv[2]), min = parseFloat(process.argv[3] || "0.8");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("file://" + path.join(dir, "index.html"));
  for (let i = 0; i < 100 && !(await p.evaluate(() => !!(window.__timelines && window.__timelines.root))); i++) await p.waitForTimeout(200);
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  const scenes = await p.evaluate(() => window.PROPS.scenes.filter((s) => s.imageSrc).map((s) => ({ id: s.id, t: (s.startMs + s.durationMs / 2) / 1000 })));
  const out = [];
  for (const s of scenes) {
    const res = await p.evaluate((t) => {
      window.__timelines.root.seek(t, false);
      const r = [];
      for (const img of document.images) {
        if (!img.naturalWidth) continue;
        const cs = getComputedStyle(img);
        let op = 1; for (let e = img; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
        if (op < 0.5 || cs.display === "none" || cs.visibility === "hidden") continue;
        const b = img.getBoundingClientRect(), nw = img.naturalWidth, nh = img.naturalHeight;
        const fit = cs.objectFit, k = fit === "cover" ? Math.max(b.width / nw, b.height / nh) : fit === "contain" ? Math.min(b.width / nw, b.height / nh) : null;
        const cw = k ? nw * k : b.width, ch = k ? nh * k : b.height;
        const [px, py] = (cs.objectPosition || "50% 50%").split(" ").map((v) => v.endsWith("%") ? parseFloat(v) / 100 : 0.5);
        let x0 = b.left + (b.width - cw) * px, y0 = b.top + (b.height - ch) * py, x1 = x0 + cw, y1 = y0 + ch;
        const full = cw * ch;
        // the element box itself clips the content (object-fit), then every overflow-clipping ancestor, then the frame
        const clips = [b];
        for (let e = img.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e); if (o.overflow !== "visible" || o.overflowX !== "visible") clips.push(e.getBoundingClientRect()); }
        clips.push({ left: 0, top: 0, right: 1080, bottom: 1920 });
        for (const c of clips) { x0 = Math.max(x0, c.left); y0 = Math.max(y0, c.top); x1 = Math.min(x1, c.right); y1 = Math.min(y1, c.bottom); }
        r.push({ src: img.getAttribute("src"), visible: Math.max(0, x1 - x0) * Math.max(0, y1 - y0) / full });
      }
      return r;
    }, s.t);
    for (const x of res) out.push({ scene: s.id, t: +s.t.toFixed(1), src: x.src, visible: +x.visible.toFixed(2), ok: x.visible >= min });
  }
  await b.close();
  console.log(JSON.stringify(out));
  process.exit(out.some((x) => !x.ok) ? 2 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
