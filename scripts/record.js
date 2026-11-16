/**
 * Record an HTML animation file to WebM video using Playwright.
 * Usage: node record.js <html_file> <output.webm> <duration_ms> [width] [height]
 *
 * The HTML page must call window.__motionReady() when animations are loaded
 * and window.__motionDone() when finished (or rely on duration timeout).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const [,, htmlFile, outFile, durationMs = '60000', width = '1080', height = '1920'] = process.argv;

if (!htmlFile || !outFile) {
  console.error('Usage: node record.js <html_file> <output.webm> <duration_ms> [w] [h]');
  process.exit(1);
}

const absHtml    = path.resolve(htmlFile);
const absOut     = path.resolve(outFile);
const durationN  = parseInt(durationMs, 10);
const videoDir   = path.dirname(absOut);
const videoName  = path.basename(absOut);
const W          = parseInt(width, 10);
const H          = parseInt(height, 10);

(async () => {
  const browser = await chromium.launch({
    ...(require('fs').existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless']
  });

  const context = await browser.newContext({
    viewport:        { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: {
      dir:  videoDir,
      size: { width: W, height: H }
    }
  });

  const page = await context.newPage();

  // Silence console noise
  page.on('pageerror', () => {});

  await page.goto(`file://${absHtml}`, { waitUntil: 'domcontentloaded' });

  // Wait for page signal or duration, whichever comes first
  try {
    await Promise.race([
      page.evaluate(d => new Promise(resolve => {
        window.__motionDone = resolve;
        setTimeout(resolve, d);
      }), durationN),
      new Promise(r => setTimeout(r, durationN + 2000))
    ]);
  } catch {}

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  // Move to desired output path
  if (videoPath && videoPath !== absOut) {
    fs.renameSync(videoPath, absOut);
  }

  console.log(`OK  ${absOut}`);
})().catch(e => { console.error(e.message); process.exit(1); });
