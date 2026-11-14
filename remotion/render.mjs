// Usage: node render.mjs <props.json> <out.mp4> [--draft]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { globSync } from "node:fs";

const [, , propsFile, outFile, flag] = process.argv;
if (!propsFile || !outFile) {
  console.error("Usage: node render.mjs <props.json> <out.mp4> [--draft]");
  process.exit(1);
}
const draft = flag === "--draft";
const inputProps = JSON.parse(fs.readFileSync(propsFile, "utf8"));
const root = path.dirname(new URL(import.meta.url).pathname);

const findBrowser = () => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  try {
    const hits = globSync("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell");
    if (hits.length) return hits[0];
  } catch {}
  return null; // Remotion downloads its own
};

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const browserExecutable = findBrowser();
const composition = await selectComposition({ serveUrl, id: "BangMotion", inputProps, browserExecutable });

let last = -1;
await renderMedia({
  serveUrl,
  composition,
  inputProps,
  browserExecutable,
  codec: "h264",
  crf: draft ? 28 : 16,
  x264Preset: draft ? "veryfast" : "slow",
  pixelFormat: "yuv420p",
  audioCodec: "aac",
  audioBitrate: "192k",
  scale: draft ? 0.5 : 1,
  concurrency: Math.max(1, (await import("node:os")).cpus().length),
  outputLocation: outFile,
  chromiumOptions: { gl: "swangle" },
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 10);
    if (p !== last) { last = p; console.log(`render ${p * 10}%`); }
  },
});
console.log(`OK  ${outFile}`);
