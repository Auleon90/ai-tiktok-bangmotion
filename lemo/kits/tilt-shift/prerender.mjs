// Tilt-shift pre-render: the Lemo-Opuscar demo's own three.js town (engine/, MIT) renders two stills per scene in 9:16,
// same camera, the town's clock advanced between them (the time-lapse step). lemo/kits/tilt-shift/index.html animates them in 2D.
//   node prerender.mjs <built kit dir>      → <dir>/ts/a_<i>.jpg, b_<i>.jpg
import fs from 'fs'; import path from 'path'; import http from 'http'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); let pw; try { pw = require('playwright'); } catch { pw = require('playwright-core'); }
const dir = path.resolve(process.argv[2]), props = fs.readFileSync(path.join(dir, 'props.js'), 'utf8'), data = JSON.parse(props.slice(props.indexOf('=') + 1).trim().replace(/;$/, ''));
// demo shot moments used as vantage points (story clock of the demo): wide oblique, intersection, jam, rise, train, end, dawn
const VIEWS = [11.5, 36, 21, 7.2, 16, 3.2, 26, 33.5], STEP = .5;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const b = await pw.chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(`http://127.0.0.1:${srv.address().port}/engine/index.html?w=1080&h=1920&ssaa=1&noao&nohud&nosign&noev`);
await pg.waitForFunction(() => window.READY === true, null, { timeout: 180000 }).catch(() => { console.error('engine not ready', errs[0] || ''); process.exit(1); });
fs.mkdirSync(path.join(dir, 'ts'), { recursive: true }); const t0 = Date.now();
for (const [i, s] of data.scenes.entries()) {
  const tv = s.view ?? VIEWS[i % VIEWS.length];
  await pg.evaluate(t => { window.CAM_OVERRIDE = null; window.render(t); }, tv);
  await pg.screenshot({ path: path.join(dir, 'ts', `a_${i}.jpg`), type: 'jpeg', quality: 92, timeout: 300000 });
  // freeze this camera and let the town run on: the same frame, later
  await pg.evaluate(t => { const c = window.DBG.camera, d = c.getWorldDirection(new c.position.constructor()), p = c.position, l = p.clone().addScaledVector(d, 200);
    window.CAM_OVERRIDE = [p.x, p.y, p.z, l.x, l.y, l.z, c.fov].join(','); window.render(t); }, tv + STEP);
  await pg.screenshot({ path: path.join(dir, 'ts', `b_${i}.jpg`), type: 'jpeg', quality: 92, timeout: 300000 });
  console.log(`  still ${i + 1}/${data.scenes.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await b.close(); srv.close();
