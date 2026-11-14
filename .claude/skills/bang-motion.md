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

# Legacy HTML engine (mode "HTML (cepat)")

## Prerequisites (run once)

```bash
bash /home/user/ai-tiktok-bangmotion/scripts/setup.sh
export CARTESIA_API_KEY=<user's key>
```

If `CARTESIA_API_KEY` is not set, ask the user to provide it before continuing.

---

## Pipeline (run in order, announce each step)

### STEP 1 — Parse & Generate Storyboard

Extract from the prompt:
- **topic**: the subject matter
- **duration**: default 60 seconds
- **style**: default "vintage sketch" (dark bg, hand-drawn feel, chalk-on-blackboard)
- **lang**: Indonesian (id-ID)

Generate a storyboard JSON with this exact structure:

```json
{
  "title": "...",
  "style": "vintage_sketch",
  "total_duration_s": 60,
  "scenes": [
    {
      "id": 1,
      "title": "Scene title",
      "duration_s": 10,
      "script": "Voiceover text in Bahasa Indonesia (1–2 sentences max per scene).",
      "visual": "Description of what appears on screen: text, icons, animation direction",
      "accent_color": "#hexcolor"
    }
  ]
}
```

Aim for 5–7 scenes. Each scene's `script` should be SHORT — Cartesia reads ~130 words/minute, so 10 seconds ≈ 22 words max.

Write the storyboard to `/home/user/ai-tiktok-bangmotion/output/storyboard.json`.

### STEP 2 — Present Storyboard for Approval

Show the user a formatted summary:

```
📋 STORYBOARD — [title]
━━━━━━━━━━━━━━━━━━━━━━━━
Scene 1 (Xs): [title]
  🎬 Visual: [visual description]
  🎙️ VO: "[script]"
...
━━━━━━━━━━━━━━━━━━━━━━━━
Total: Xs
```

Then use AskUserQuestion with two options:
- **Lanjutkan** — proceed to generate
- **Revisi** — user types what to change

If user selects "Revisi", update the storyboard accordingly and re-present. Loop until approved.

### STEP 3 — Generate Voiceover with Cartesia

(tts.py now also writes `<name>.words.json` with per-word timestamps; MP3 output unchanged.)

For each scene, generate a separate MP3:

```bash
python3 /home/user/ai-tiktok-bangmotion/scripts/tts.py \
  "[scene.script]" \
  /home/user/ai-tiktok-bangmotion/output/vo_scene_N.mp3
```

Run scenes sequentially (not parallel) to avoid API rate limits.

After all segments, probe the actual duration of each:

```bash
python3 /home/user/ai-tiktok-bangmotion/scripts/probe_audio.py \
  /home/user/ai-tiktok-bangmotion/output/vo_scene_N.mp3
```

Update each scene's `actual_duration_ms` with the real audio length. This becomes the authoritative timing for animation.

Then concatenate all segments with a 300ms gap between scenes:

```bash
python3 /home/user/ai-tiktok-bangmotion/scripts/concat_audio.py \
  /home/user/ai-tiktok-bangmotion/output/voiceover.mp3 \
  300 \
  /home/user/ai-tiktok-bangmotion/output/vo_scene_1.mp3 \
  /home/user/ai-tiktok-bangmotion/output/vo_scene_2.mp3 \
  ...
```

### STEP 4 — Generate Animation HTML

Write a self-contained HTML animation to `/home/user/ai-tiktok-bangmotion/output/animation.html`.

The page must:
1. Use the **vintage sketch** aesthetic: dark background (`#111008`), off-white text (`#f5f0e8`), chalk-stroke style fonts, subtle grain texture via CSS
2. Drive timing from the **actual audio durations** (not the original estimates) — embed the timing array from storyboard.json into the page's `<script>`
3. Animate each scene: fade in title, animate the visual element (SVG icon, counter, etc.), fade out at scene end
4. Call `window.__motionDone()` after the last scene completes
5. Load fonts from Google Fonts only: `Caveat` (handwritten, for headlines) + `Inter` (for body)
6. Have NO external fetch calls or CDN assets other than Google Fonts
7. Total page duration must match total voiceover duration

The animation structure per scene:
- **0.0s–0.4s**: fade in from black
- **0.4s–(duration-0.5s)**: scene content animates in stages (eyebrow label → main visual → headline → subtitle)
- **(duration-0.5s)–duration**: fade to black

For visual elements, draw them as inline SVG (atoms, neurons, DNA, etc.) — no external images.

The HTML `<script>` block defines:
```js
const SCENES = [
  { duration: 10200, title: "...", visual: "...", script: "..." },
  ...
];
```

### STEP 5 — Record Animation to Video

Get total audio duration:
```bash
python3 /home/user/ai-tiktok-bangmotion/scripts/probe_audio.py \
  /home/user/ai-tiktok-bangmotion/output/voiceover.mp3
```

Record the HTML animation for that exact duration:
```bash
node /home/user/ai-tiktok-bangmotion/scripts/record.js \
  /home/user/ai-tiktok-bangmotion/output/animation.html \
  /home/user/ai-tiktok-bangmotion/output/animation.webm \
  <total_duration_ms> \
  1080 \
  1920
```

This takes ~30–60 seconds in the cloud container. Inform the user it's rendering.

### STEP 6 — Mux Audio + Video → MP4

```bash
bash /home/user/ai-tiktok-bangmotion/scripts/mux.sh \
  /home/user/ai-tiktok-bangmotion/output/animation.webm \
  /home/user/ai-tiktok-bangmotion/output/voiceover.mp3 \
  /home/user/ai-tiktok-bangmotion/output/final.mp4
```

### STEP 7 — Deliver to User

```
SendUserFile(["/home/user/ai-tiktok-bangmotion/output/final.mp4"])
```

Also report:
- Total duration
- File size
- Scene count
- Voice used

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
