# /bang-motion — TikTok Motion Graphic Pipeline

Triggered by: `/bang-motion [prompt] [--engine remotion|html]`

Generates a TikTok-ready MP4 (1080×1920) with Indonesian voiceover (Cartesia sonic-3, word timestamps).

**Engines**
- `remotion` — data-driven Remotion composition in `remotion/`, frame-accurate render, word-synced captions, ambience + loudnorm (~20 min render). Section "Remotion engine".
- `html` — legacy flow: AI-written HTML recorded with Playwright (~1–2 min render, lower quality). Section "Legacy HTML engine".

## STEP 0 — ALWAYS ask which mode first (mandatory)

Before writing any storyboard or calling any API, for EVERY video request, use AskUserQuestion:

- question: "Mau pakai mode render apa untuk video ini?"
- header: "Mode"
- options:
  - **Remotion (kualitas tinggi)** — render per frame, subtitle per kata, backsound; render ±20 menit. Untuk video final.
  - **HTML (cepat)** — rekam layar, tanpa subtitle per kata; render ±1–2 menit. Untuk draf/tes ide.

Skip this question only if the user already stated the mode in the same request (e.g. `--engine html`, "pakai remotion", "mode cepat"). Then follow ONLY the chosen engine's section below.

---

## Remotion engine (mode "Remotion (kualitas tinggi)")

### R1 — Setup
```bash
bash /home/user/ai-tiktok-bangmotion/scripts/setup.sh
```
`CARTESIA_API_KEY` must be set (Default environment). If missing, stop and ask.

### R2 — Write storyboard
Write `/home/user/ai-tiktok-bangmotion/output/storyboard.json`. Use `examples/uhud.storyboard.json` as the reference. Format:

```json
{
  "title": "...",
  "ambience": "wind",          // or "none"
  "theme": { "accent": "#e9b552" },   // optional: skyTop, skyMid, horizon, ground, text, accent, muted
  "scenes": [ { "id": 1, "type": "title", "vo": "Teks yang diucapkan", "eyebrow": "LABEL KECIL", ... } ]
}
```

Every scene: `id`, `type`, `vo` (spoken Indonesian, ~2.3 words/sec), optional `eyebrow`, `pad_before_ms`, `gap_after_ms`.
Scene duration is derived from the real audio — never set it manually.

| type | fields |
|------|--------|
| `title` | `arabic?`, `title`, `subtitle?` |
| `headline` | `headline`, `sub?`, `icon?` (sword, bow, mountain, moon, drop, star, shield) |
| `counter` | `items: [{value, label, color?, prefix?, suffix?}]`, `versus?` |
| `quote` | `text`, `source?` |
| `ayat` | `arabic`, `translation`, `ref` |
| `tribute` | `name`, `arabic?`, `note?` |
| `map` | coords 0–1000 (y down): `hills[{label?, at, r, color?}]`, `units[{label?, color, dots, from, to?, moveAt?:[0..1,0..1], spread?}]`, `arrows[{path:[[x,y]...], color, at?}]`, `pulse{at, label?, atFrac?}`, `focus{at, zoom}` |

Rules:
- 6–9 scenes, total ~55–60 s. Open with a strong hook (scene 1 must be visually striking).
- `vo` is what is spoken; on-screen text can differ (e.g. write "Rasulullah" in vo, "ﷺ" only on screen).
- Islamic/sirah content: NEVER depict the Prophet ﷺ or sahabat as figures/faces. Use maps, unit dots, symbols, calligraphy, ayat.
- Verify facts (numbers, dates, hadith wording) and cite source in `quote.source` / `ayat.ref`.

### R3 — Present for approval
Show the storyboard summary (scene, type, visual, VO). AskUserQuestion:
- **Lanjutkan** — render with the mode chosen in STEP 0
- **Revisi** — loop until approved

### R4 — Draft check (fast)
```bash
cd /home/user/ai-tiktok-bangmotion && python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render
```
TTS is cached by text hash in `output/vo/` — revisions only regenerate changed scenes.
Then render stills (≈70% into each scene) to check layout before the long render:
```bash
cd remotion && cp ../output/props.json src/sample.json
npx remotion still src/index.ts BangMotion /tmp/s.png --frame=<N> --props=../output/props.json --scale=0.4 \
  --browser-executable=$(ls /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell)
```
Look at them; fix overlaps (map labels vs units, long text) in storyboard.json.

### R5 — Final render
```bash
cd /home/user/ai-tiktok-bangmotion && python3 scripts/produce.py output/storyboard.json output/final.mp4
```
Takes several minutes — run in background and tell the user. Add `--draft` for half-res quick preview.

### R6 — Deliver
`SendUserFile(["/home/user/ai-tiktok-bangmotion/output/final.mp4"])` and report duration, size, scene count, voice.

---

# HTML engine (mode "HTML (cepat)")

The deliverable is ALWAYS an MP4 with the Cartesia voiceover — never stop at an HTML page or an Artifact.
Voice, timing and audio mix are identical to Remotion mode; only the visuals are a hand-written HTML page.

### H1 — Setup
```bash
bash /home/user/ai-tiktok-bangmotion/scripts/setup.sh
```

### H2 — Storyboard + approval
Write `/home/user/ai-tiktok-bangmotion/output/storyboard.json` in the SAME format as Remotion mode (R2: `vo`, `type`, visual fields).
Present it and ask **Lanjutkan / Revisi** (as in R3).

### H3 — Voiceover (Cartesia) + timing
```bash
cd /home/user/ai-tiktok-bangmotion && python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render
```
This generates the Cartesia VO (cached), the mixed audio (`remotion/public/audio.mp3`) and `output/props.json` with real timings.

### H4 — Write the animation HTML
Write `/home/user/ai-tiktok-bangmotion/output/animation.html` (1080×1920, self-contained, Google Fonts only, inline SVG, no other network).
Do NOT hardcode timings. At render time the pipeline injects:
```js
window.PROPS = {
  totalMs,
  scenes: [{ id, type, startMs, durationMs, eyebrow, ...visual fields from storyboard }],
  words:  [{ text, startMs, endMs }]   // for word-by-word captions
};
```
The page must:
1. Start its clock on load (`performance.now()`), and show each scene during `[startMs, startMs+durationMs)` with a 0.4 s fade in/out.
2. Render captions from `PROPS.words` (current word highlighted), positioned around y=1320px.
3. Call `window.__motionDone()` after `totalMs`.
4. Style: dark cinematic background, `Inter` + `Amiri`/`Playfair Display`. For sirah content never draw the Prophet ﷺ or sahabat — maps, symbols, calligraphy only.

### H5 — Record + mux to MP4
```bash
cd /home/user/ai-tiktok-bangmotion && python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=html --html=output/animation.html
```
(TTS is cached, so this does not spend Cartesia quota again.) It records with Playwright (`scripts/record.js`) and muxes video + audio with `scripts/mux.sh`.

### H6 — Deliver
`SendUserFile(["/home/user/ai-tiktok-bangmotion/output/final.mp4"])` and report duration, size, scene count, voice.

---

## Error Handling

| Error | Action |
|-------|--------|
| `CARTESIA_API_KEY not set` | Stop, ask user to run `export CARTESIA_API_KEY=...` |
| Cartesia 402 / quota | Report and stop |
| `ffmpeg not found` | Run `apt-get install -y ffmpeg` |
| Playwright chromium missing | Run `node -e "require('playwright').chromium.launch()"` to trigger download |
| Animation HTML too slow to render | Increase `durationMs` by 2000ms and retry record.js once |

---

## Output Files (all in `/home/user/ai-tiktok-bangmotion/output/`)

| File | Description |
|------|-------------|
| `storyboard.json` | Approved storyboard |
| `vo_scene_N.mp3` | Per-scene voice segments |
| `voiceover.mp3` | Concatenated full VO |
| `animation.html` | Generated motion graphic |
| `animation.webm` | Recorded video (muted) |
| `final.mp4` | Finished TikTok-ready video |
