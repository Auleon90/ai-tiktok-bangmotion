// Lemo-native renderer for a built kit page (output/lemo/index.html). Same idea as Lemo-Opuscar core/render/video.mjs (MIT):
// call window.render(t) for every frame, screenshot, pipe JPEGs to ffmpeg, split across workers, join losslessly.
//
//   node lemo/render.mjs <dir> video  <out.mp4> [--fps 30] [--workers 4]
//   node lemo/render.mjs <dir> stills <outdir> <t> [<t> ...]          (PNG per time, for review sheets)
//   node lemo/render.mjs <dir> layout <report.json>                    (composition check, see below)
//
// layout: for every scene, sample window.TEXTS(t) after its entrance (35%, 65%, 92% of the scene) and check
//   overflow (text did not fit its box at the minimum size) · out of frame · outside the SAFE box (content) or CAP band (captions)
//   · two different texts overlapping. Exit 0 always; the report lists the issues and produce.py decides.
import fs from 'fs'; import path from 'path'; import http from 'http'; import { spawn, execFileSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('playwright-core'); }

const [dir, mode, out, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const W = 1080, H = 1920, FPS = +opt('--fps', 30), WK = +opt('--workers', 4);
const SAFE = { x0: 84, x1: 960, y0: 210, y1: 1250 }, CAP = { x0: 84, x1: 960, y0: 1330, y1: 1560 };
if (!dir || !mode || !out) { console.error('usage: render.mjs <dir> video|stills|layout <out> ...'); process.exit(2); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.css': 'text/css' };
const root = path.resolve(dir);
const srv = http.createServer((q, r) => {
  const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${srv.address().port}/index.html`;

async function open() {
  const browser = await pw.chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(URL_);
  const t0 = Date.now();
  while (!(await page.evaluate(() => window.READY === true))) {
    if (errs.length) throw new Error('page error: ' + errs[0]);
    if (Date.now() - t0 > 120000) throw new Error('page never set window.READY');
    await new Promise(r => setTimeout(r, 100));
  }
  return { browser, page, errs };
}
const done = code => { srv.close(); process.exit(code); };

try {
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true }); const { browser, page } = await open();
    const ts = rest.filter(x => !x.startsWith('--') && !isNaN(+x));
    for (const [k, t] of ts.entries()) {
      await page.evaluate(t => window.render(t), +t);
      await page.locator('#c').screenshot({ path: path.join(out, `${String(k).padStart(2, '0')}.png`) });
    }
    await browser.close(); console.log(`stills: ${ts.length} -> ${out}`); done(0);
  }

  if (mode === 'layout') {
    const { browser, page, errs } = await open();
    const scenes = await page.evaluate(() => window.SCENES), issues = [];
    const inBox = (b, B, tol = 3) => b.x0 >= B.x0 - tol && b.x1 <= B.x1 + tol && b.y0 >= B.y0 - tol && b.y1 <= B.y1 + tol;
    const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    for (const s of scenes) for (const f of [.35, .65, .92]) {
      const t = s.t0 + (s.t1 - s.t0) * f, tx = await page.evaluate(t => window.TEXTS(t), t);
      const where = `scene ${s.id} (${s.type}) t=${t.toFixed(2)}s`;
      for (const b of tx) {
        if (b.over) issues.push({ code: 'text_overflow', where, text: b.text.slice(0, 50), msg: 'text does not fit its box even at the minimum size: shorten it' });
        if (b.x0 < 0 || b.x1 > W || b.y0 < 0 || b.y1 > H) issues.push({ code: 'out_of_frame', where, text: b.text.slice(0, 50) });
        else if (!inBox(b, b.cap ? CAP : SAFE)) issues.push({ code: b.cap ? 'caption_outside_band' : 'outside_safe_area', where, text: b.text.slice(0, 50), box: [b.x0, b.y0, b.x1, b.y1].map(Math.round) });
      }
      for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) {
        const a = tx[i], b = tx[j]; if (a.id === b.id || a.layer !== b.layer) continue;
        const o = overlap(a, b), m = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
        if (m > 0 && o / m > .08) issues.push({ code: 'text_overlap', where, text: `${a.text.slice(0, 30)} ⟂ ${b.text.slice(0, 30)}` });
      }
    }
    errs.forEach(e => issues.push({ code: 'runtime', where: 'page', text: e }));
    const seen = new Set(), uniq = issues.filter(x => { const k = x.code + x.text; if (seen.has(k)) return false; seen.add(k); return true; });
    fs.writeFileSync(out, JSON.stringify({ scenes: scenes.length, issues: uniq }, null, 1));
    await browser.close(); console.log(`layout: ${uniq.length} issue(s) -> ${out}`); done(0);
  }

  if (mode === 'video') {
    const probe = await open(); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
    const TOTAL = Math.round(DUR * FPS), per = Math.ceil(TOTAL / WK), segDir = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), '.lemo_segs-')), t0 = Date.now();
    await Promise.all([...Array(WK)].map(async (_, w) => {
      const a = w * per, b = Math.min(TOTAL, a + per); if (a >= b) return;
      const { browser, page, errs } = await open();
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', `seg_${w}.mp4`], { cwd: segDir, stdio: ['pipe', 'inherit', 'inherit'] });
      const closed = new Promise(r => ff.on('close', r));
      for (let f = a; f < b; f++) {
        await page.evaluate(t => window.render(t), f / FPS);
        if (errs.length) throw new Error('page error at frame ' + f + ': ' + errs[0]);
        const buf = await page.locator('#c').screenshot({ type: 'jpeg', quality: 94 });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if ((f - a) % 150 === 0) console.log(`w${w} ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      ff.stdin.end(); const code = await closed; await browser.close();
      if (code !== 0) throw new Error('ffmpeg failed for worker ' + w);
    }));
    fs.writeFileSync(path.join(segDir, 'segs.txt'), [...Array(WK)].map((_, w) => `file 'seg_${w}.mp4'`).filter((_, w) => w * per < TOTAL).join('\n'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'segs.txt', '-c', 'copy', 'merged.mp4'], { cwd: segDir });
    fs.renameSync(path.join(segDir, 'merged.mp4'), path.resolve(out)); fs.rmSync(segDir, { recursive: true, force: true });
    console.log(`video: ${TOTAL} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${out}`); done(0);
  }
  console.error('unknown mode ' + mode); done(2);
} catch (e) { console.error(String(e.message || e).split('\n')[0]); done(1); }
