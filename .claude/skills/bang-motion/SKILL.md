---
name: bang-motion
description: Generate a ~60 s vertical TikTok motion-graphic MP4 with Indonesian Cartesia voice-over, word-synced captions, original music and SFX. Use for /bang-motion or any request to make a video in this repo. Flow - idea, storyboard, approval, render-mode question (HyperFrames, Remotion, Manim, Cepat, Auto), pre-render QA, render, deliver.
argument-hint: "[topik video] [mode/gaya opsional]"
---

# /bang-motion — TikTok Motion Graphic Pipeline

Triggered by: `/bang-motion [prompt]` or any request to make a video in this repo.

Every mode produces the same deliverable: a 1080×1920 MP4 with the Cartesia voiceover
(sonic-3, Galang id-ID, per-word timestamps), word-synced captions and a mixed/normalised soundtrack.
All modes share one storyboard and one audio pipeline (`scripts/produce.py`); only the visual engine differs.

Repo root: `/home/user/ai-tiktok-bangmotion` (below: `$R`).

---

## Flow (always in this order)

1. **Setup** — `bash $R/scripts/setup.sh` (idempotent). `CARTESIA_API_KEY` must be set; if not, stop and ask.
2. **Idea** — from the prompt, pick an angle/hook (one sentence) and the story arc.
3. **Storyboard** — write `$R/output/storyboard.json` (format below).
4. **Approval** — show the summary and AskUserQuestion: **Lanjutkan** / **Revisi**. Loop on Revisi.
5. **Mode** — ONLY after approval, ask which render mode (section "Mode question"). Skip only if the user already named a mode in this request.
6. **Voiceover** — `cd $R && python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render`
   (TTS is cached per text in `output/vo/`; revisions only re-generate changed scenes.)
7. **Build + render** — follow the chosen mode's section. Long renders run in background; tell the user.
8. **Deliver** — `SendUserFile(["$R/output/final.mp4"])` (absolute path) + report duration, size, scene count, mode, voice.

Never stop at an HTML page, an Artifact or a raw render without audio: the result is always `output/final.mp4`.

---

## Storyboard format (shared by all modes)

```json
{
  "title": "...",
  "ambience": "wind",                       // "wind" | "none"
  "voice": "<cartesia voice id>",          // optional; default CARTESIA_VOICE_ID (Galang). Female id-ID: Siti b441c4fd-4910-4c55-ae56-f0291057e2cc (cheerful), Citra 74546efd-3ac5-4c41-ba59-4756227f429a, Safira 9076f14a-5602-48a7-bfd1-67ef9b40dd6d
  "music": "warm",                          // warm | epic | tense | calm | playful | sacred | none  (original score, synthesised)
  "sfx": true,                              // whooshes on cuts, title hit, counter ticks, map pulse, final ding
  "style": "risograph",                     // optional, mode 1 only: a Lemo-Opuscar style slug (see "Visual styles")
  "theme": { "accent": "#e9b552" },         // optional: skyTop, skyMid, horizon, ground, text, accent, muted
  "scenes": [
    { "id": 1, "type": "title", "vo": "Teks yang diucapkan", "eyebrow": "LABEL", "lottie": [ ... ], ... }
  ]
}
```

Every scene: `id`, `type`, `vo` (spoken Indonesian, ~2.3 words/s), optional `eyebrow`, `pad_before_ms`, `gap_after_ms`, `lottie`.
Durations come from the real audio — never set them by hand. 6–9 scenes, ~55–60 s. Scene 1 must hook.

Built-in scene types (rendered automatically by modes 1 and 2):

| type | fields |
|------|--------|
| `title` | `arabic?`, `title`, `subtitle?` |
| `headline` | `headline`, `sub?`, `icon?` (sword, bow, mountain, moon, drop, star, shield — Remotion only) |
| `counter` | `items: [{value, label, color?, prefix?, suffix?}]`, `versus?` |
| `quote` | `text`, `source?` |
| `ayat` | `arabic`, `translation`, `ref` |
| `tribute` | `name`, `arabic?`, `note?` |
| `map` | coords 0–1000 (y down): `hills[{label?, at, r, color?}]`, `units[{label?, color, dots, from, to?, moveAt?, spread?}]`, `arrows[{path, color, at?}]`, `pulse{at, label?, atFrac?}`, `focus{at, zoom}` |

| `image` | full-screen AI illustration only; optional `headline`, `sub` overlay |

### AI illustrations (Cloudflare FLUX — any theme, per scene where it fits)

Any scene may add `"image": "<English prompt>"` (or `{"prompt": "...", "steps": 6}`); top-level `"image_style"` is appended to every prompt
(default: clean 2D cartoon, bold outlines, no text). The image becomes a full-bleed background with a Ken Burns move; the scene's normal
content (headline, counter, quote…) is drawn on top with a darkening scrim. Images are cached by prompt in `output/img/`.

- Any theme qualifies (facts, science, tips, listicles, news, history, fables, motivation, Islamic…). Judge each scene: if it has something
  visible — a place, object, animal, nature, an event, a process (rain hitting soil, bacteria under a microscope), a mood — and an image
  makes it more engaging, give it an `image`. Typically 3–6 images per video, mixed with code-drawn scenes; default to using images
  unless the video is pure diagrams/formulas. Numbers, charts, formulas and text stay code-drawn (they may sit on top of an image).
- ALSO use images for **science/knowledge tied to life inspiration, motivation or Islamic reflection**
  (e.g. "Ayat tentang lebah dan sains madu", "Air: 70% tubuh kita", "Tafakur alam semesta", "Pelajaran dari pohon yang tumbang").
  Images there show the **wonder**: nature, cosmos, cells/microscopy look, water, light, landscapes, plants, animals in nature,
  objects (a candle, an open window, a sajadah from above), mosque architecture. The science itself (numbers, diagrams, cycles)
  stays code-drawn; the reflection/ayat scene stays typographic (calligraphy) over the image or a calm background.
- Islamic inspiration rules for images: never the Prophet ﷺ, prophets or sahabat; avoid human faces (people only as tiny silhouettes,
  from behind, or hands); never ask FLUX to write Arabic/Qur'an text (it garbles it) — ayat are always rendered by code (Amiri font);
  no symbols of other religions; modest, calm palettes. Pair with `"music": "sacred"` or `"none"`.
- Do NOT use images for: scenes that are only numbers/diagrams/formulas (keep them code-drawn), Manim videos,
  and **sirah Nabi ﷺ** figures (maps/calligraphy only; at most a landscape with no human figures).
- Mark image scenes with 🖼️ in the approval summary and state the count ("3 dari 8 scene pakai gambar AI") so the user can decline.
- Supported in modes 1 (HyperFrames), 2 (Remotion) and 4 (Cepat, as `PROPS.scenes[i].imageSrc` relative to the page). Ignored in Manim.
- Prompts in English, describe composition + light + mood, always end with "no text". FLUX output is 1024×1024 (center-cropped to 9:16),
  so keep the subject centred.
- Quota: free plan 10,000 neurons/day (~100+ images at 6 steps), resets 07:00 WIB. Error "quota exhausted" → tell the user and offer
  to render without images or wait for the reset.
- Needs `CF_ACCOUNT_ID` (Default environment) and the Cloudflare token saved as a network secret for api.cloudflare.com.

Manim mode (3) uses free-form types (e.g. `triangle`, `graph`, `formula`) plus a `visual` description — the Manim scene code draws them.

`lottie` (modes 1 & 2): `[{ "name": "<pulse|burst|sparkle|dust|ring>-<gold|white|red>", "x": px, "y": px, "size": px, "at": 0..1, "loop": true, "opacity": 1 }]`
in 1080×1920 pixel space. Assets live in `assets/lottie/` (generated by `scripts/make_lottie.py`; LottieFiles is not reachable from the container — add new animations to that script).

Content rules:
- `vo` is what is spoken; on-screen text can differ (say "Rasulullah" in vo, show "ﷺ" on screen).
- Sirah/Islamic content: NEVER depict the Prophet ﷺ or sahabat as figures or faces — maps, unit dots, symbols, calligraphy, ayat.
- Verify facts (numbers, dates, hadith wording) and cite them in `quote.source` / `ayat.ref`.
- Keep important visuals above pixel y≈1280; captions sit at y 1320+.

Approval summary format:
```
📋 STORYBOARD — [title]
━━━━━━━━━━━━━━━━━━━━━━━━
Scene 1 [type]: [eyebrow]            (🖼️ if it uses an AI image, 🔊 name if it has scene SFX)
  🎬 Visual: [what is shown]
  🎙️ VO: "[vo]"
...
━━━━━━━━━━━━━━━━━━━━━━━━
🎨 Gaya: <style or default> · 🎵 Musik: <mood> · 🔊 SFX: on
Perkiraan durasi: ~Xs · Gambar AI: N dari M scene
(mode 1: "🎨 Gaya" WAJIB berisi gaya Lemo + link galeri)
```

### Sound (all modes)

`scripts/score.py` (run automatically by `produce.py` with `.venv-audio`) writes an original score and timed SFX from the scene timings,
using `audio/lemo/` (sfx.py + pluck.py, MIT, vendored from Lemo-Opuscar). The mixer compresses the voice, ducks the bed (ambience + music)
under it, adds SFX and masters to −14 LUFS.

**VO always wins.** `produce.py` measures the loudness of the voice and of each stem and levels them RELATIVE to the VO:
music/ambience bed at **−20 dB** under the voice, SFX at **−9 dB** (gain never pushed up more than +6 dB), the bed gets an
EQ cut in the speech band (−6 dB @ 2.5 kHz, −3 dB @ 600 Hz) and is ducked ~10 dB by a sidechain whenever the voice speaks.
The mix log prints `levels: VO … bed target … ` — check it. Override per video only if asked: `"music_level_db": 16`
(louder music) / `"sfx_level_db": 12` (quieter SFX). Never raise music volume in score.py instead.

The score is **different for every video**: a seed from the title (or `"music_seed"`) picks key, tempo, chord progression,
arpeggio patterns and the instrument palette from the mood's options; the Lemo `style` steers the palette (engraving → harpsichord +
violas, ink-wash/ukiyoe → dan tranh, newsreel → piano, rubber-hose → xylophone + tuba…); the arrangement follows the scenes
(thin intro, fuller middle, peak around 2/3, thinning outro, final tonic chord). Instruments are real CC0 samples (VCSL + VSCO 2 CE,
via Lemo-Opuscar `core/audio/sampler.py`, downloaded by `setup.sh` into `.lemo/`); without them it falls back to synth plucks.
Force instruments when the topic calls for it: `"instruments": {"lead": "marimba", "pad": "violas", "bass": "contrabass_pizz", "perc": "shaker"}`
(names: `.lemo/lemo-opuscar/core/audio/INSTRUMENTS.md`). Different `"music_seed"` = a different tune for the same title.
State the music line in the approval summary (mood + main instrument).

**Scene SFX (pick them while writing the storyboard).** Built-in SFX fire automatically per scene type (whoosh on cuts,
title hit, counter ticks, map pulse, final ding). For what HAPPENS in a scene, add named effects:
`"sfx": [{"name": "explosion", "at": 0.3, "gain": 1, "pan": 0}]` (`at` = 0–1 within the scene; a plain string = at 0).
Library (`scripts/sfxlib.py`): real CC0 recordings from the Kenney packs (`.lemo/kenney/`, fetched by setup.sh, random take each
time, synth fallback) for punch, impact, metal_hit, wood_hit, glass_break, footsteps(_grass/_snow), door_creak, coin, typing,
camera, clock_tick, page_turn, cloth, knife, laser, powerup, glitch, notify, error, scifi_explosion, engine; synthesised
(+ CC0 orchestral percussion) for explosion, boom, gunshot, sword_clash, thunder, rain, wind, fire, splash, earthquake, bell, gong,
heartbeat, riser (tension before a reveal), magic, swoosh, ding, pop. Use them where the picture/VO shows the event (1–3 per video is plenty;
`riser` before a big reveal, `boom` on it). Mark them 🔊 in the approval summary. Preview without rendering:
`.venv-audio/bin/python scripts/score.py preview explosion,thunder` → `output/sfx_preview/*.wav` (`preview list` names all).
Not available (needs real recordings): crowds, animal calls, engines, speech.

Pick `music` by tone: `sacred` for sirah/Islamic content (drone + soft pulse, no melodic instruments — many viewers prefer no music;
offer `"none"` if unsure), `epic` for history/battles, `tense` for mystery, `warm` for fables/stories, `calm` for reflections and math,
`playful` for light facts/tips. State the choice in the approval summary (🎵 line) so the user can change it.

### Visual styles (Lemo-Opuscar library, mode 1)

`setup.sh` downloads 99 film-style guides into `.lemo/lemo-opuscar/styles/<slug>/STYLE.md` (git-ignored).
`python3 scripts/styles.py search <words>` / `list` / `show <slug>`.

- **Mode 1 always uses a Lemo style.** During the storyboard, ALWAYS propose ONE style that fits the topic (run `styles.py search`),
  name it with its gallery link `https://lemomo-ai.github.io/lemo-opuscar/` and one line why; put `"style": "<slug>"` in the storyboard.
  The approval summary always has the "🎨 Gaya" line. The plain template look is used only when the user explicitly asks for it.
  Vary styles between videos — do not reuse the previous video's style unless asked.
- The styled page MUST render `imageSrc` backgrounds (copy the `.bg-img` logic from `hyperframes/template/index.html`) and treat them in the
  style's look (duotone, grain, halftone, blend modes via CSS/SVG filters). Set top-level `"image_style"` to match the style
  (e.g. risograph → "risograph print, two-ink grain, flat shapes, no text"). `produce.py` blocks the render if images would be dropped.
- Read that STYLE.md fully before writing the page. Translate its essence, palette, type, motion and transitions into
  `output/hf_index.html` (start from `hyperframes/template/index.html` or from `examples/kopi-riso.hf.html` for a fully custom page).
  Keep 1080×1920, our captions (restyle `.bm-line`/`.bm-word` to match), and the HyperFrames contract. Approximate shaders with SVG/CSS
  (blend modes, patterns, filters) when needed.
- **Images must stay whole.** FLUX images are square. When restyling, keep the template's `.bg-img` logic or put the image in a
  framed panel near 1:1 (e.g. 940×740 at the top, text below it). NEVER change only the height of the 1920 px-wide `<img>`
  (it crops the image on both axes), keep the Ken Burns zoom ≤ 1.08 in panels, and never put the headline on top of the subject.
  The pre-render QA measures this (`scripts/qa_images.js`, code `image_crop`): < 38 % of an image on screen blocks the render,
  < 50 % is a warning. The template's full-bleed look is ≈ 43 %.
- After the draft/render, LOOK at each image scene at full size: subject whole and not covered by text, no fake letters from FLUX
  (if there are any, re-prompt without paper/signs/books and add "no markings").
- Licence: the STYLE.md docs are CC BY-NC 4.0 + a permission to adapt them for our own films (commercial OK). NEVER copy STYLE.md text into
  this repo or into a committed file; the finished film is ours. Mention the credit in the delivery message:
  "Style: <name> — Lemo-Opuscar by Lemomo (LemoLab)".
- Styles marked ✦ (manga-panels, text-flash-cuts, comic-history) need an image generator: use our FLUX step (`image` fields).
- Avoid styles that need real data/scans (lidar-survey, satellite-briefing, map-explainer 3D terrain) unless the user supplies the data.

### QA (local and free — never uses Cloudflare or other quota) — runs BEFORE the render

`produce.py` gates every render on a **pre-render QA** (`scripts/qa.py precheck` → `output/qa_precheck.md`):

| Check | Engines | Blocks the render? |
|---|---|---|
| VO: word count script vs audio (skipped/merged word), missing VO | all | ✅ yes |
| VO: stretched words (> 0.65 s), odd mid-sentence pauses, pace, clipping | all | ⚠️ report only |
| `hyperframes check`: runtime JS errors, layout overlap/overflow, contrast, lint errors | HyperFrames | ✅ yes (unless the code is in `qa_allow`) |
| AI images: share of each image visible on screen (`qa_images.js`, < 38 % → `image_crop`) | HyperFrames | ✅ yes (unless `image_crop` is in `qa_allow`) |
| One still per scene → `output/qa_prerender.jpg` (~1 min) | Remotion | look at it before the ~20 min render |

Flow:
1. `python3 scripts/produce.py ... --check-only` → builds everything, runs the pre-render QA, renders nothing (seconds to ~1 min).
2. Read `output/qa_precheck.md`; for Remotion LOOK at `output/qa_prerender.jpg`. Fix the storyboard / page and repeat.
   - Stretched words / odd pauses: rewrite that `vo` (short lead-in word, split long words, commas, phonetic spelling); only that scene is
     re-generated. Max one retry per scene, then tell the user.
   - Overlaps that are intended (double-printed titles, map labels on purpose): add the code to the storyboard, e.g.
     `"qa_allow": ["content_overlap"]`. Never allow `runtime` errors or contrast failures on captions.
   - `rotation_pivot_drift` = wrong pivot → use `svgOrigin`.
3. Only when it passes, run the real render (same command without `--check-only`). If it is blocked, the render does not start.
   `--accept-qa` overrides the gate — use it only after reviewing every remaining finding.
4. After the render, the final-file QA runs automatically (`output/qa_report.md` + `output/qa_sheet.jpg`): loudness −14 ±1.5 LUFS,
   true peak ≤ −1 dBTP, no black/frozen frames, equal A/V length. Look at the sheet before delivering.
5. Summarise QA in the delivery message (passed / fixed / remaining). Pronunciation is not machine-checked (no free ASR is reachable):
   list the stretched words so the user can listen there first.

---

## Mode question

AskUserQuestion allows max 4 options, so ask in two steps.

**Q1** — question: "Storyboard disetujui. Mau render pakai mode apa?", header "Mode":
1. `Auto: <mode pilihanmu> (Recommended)` — description: one line on why (see Auto rules).
2. `HyperFrames + GSAP + Lottie` — "Render per frame, animasi GSAP halus, efek Lottie. ±2 menit."
3. `Remotion + Lottie` — "Kualitas tertinggi: peta animasi, grain film, efek Lottie. ±20 menit."
4. `Manim / Mode cepat…` — "Pilih Manim (sains/matematika) atau mode cepat (draf)."

If Q1 = option 4, **Q2** — "Pilih yang mana?", header "Mode":
- `Manim` — "Animasi sains/matematika ala 3Blue1Brown. ±1 menit."
- `Cepat (bang-motion klasik)` — "HTML direkam real-time. ±1,5 menit, kualitas draf."

### Auto rules (pick one, say why in the option description)

| Topic / storyboard | Mode |
|---|---|
| Math, physics, chemistry, formulas, graphs, geometry, algorithms | **3 Manim** |
| History / sirah with maps, troop movement, cinematic storytelling, final upload where quality matters most | **2 Remotion + Lottie** |
| Kinetic typography, listicles, tips, facts, motivation, news, promo — most general content | **1 HyperFrames** |
| User says it's a draft / test / "cepat" | **4 Cepat** |

When torn between 1 and 2, prefer **1 HyperFrames** (similar look, ~10× faster).

---

## Mode 1 — HyperFrames + GSAP + Lottie

Engine: `hyperframes/` (npm `hyperframes` 0.8.218, GSAP, lottie-web). Renders by seeking a paused GSAP timeline frame by frame.

1. `cp $R/hyperframes/template/index.html $R/output/hf_index.html`. The template already renders every built-in scene type from `window.PROPS` (timings, words, theme), adds atmosphere, Lottie and captions.
2. Customise `output/hf_index.html` for this video when useful: theme colours in `:root`, extra scene types (add a builder to `B`), extra GSAP moves, `BM.lottieFx(...)`. For rotation/scale of SVG elements use `svgOrigin: "x y"` (canvas coordinates), never `transformOrigin` (it is relative to the element box, so pivots fly off).
   Contract (from HyperFrames): one paused timeline registered last as `window.__timelines["root"]`; tweens at absolute seconds;
   no `Date.now()`, unseeded `Math.random()` (use `BM.rng(seed)`), timers, network fetches or `repeat: -1`; keep `__TOTAL_S__` placeholders.
   Helpers (`hyperframes/runtime/bm.js`): `BM.scene`, `BM.captions`, `BM.lottieFx(parent, name, x, y, size)`, `BM.rng`.
3. Draft check (~1.5 min, half quality):
   `cd $R && python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=hyperframes --html=output/hf_index.html --draft`
   Extract a frame per scene (`ffmpeg -ss <t> -i output/final.mp4 -frames:v 1 ...`), look at them, fix overlaps.
4. Final: same command without `--draft` (~2 min for 60 s).

## Mode 2 — Remotion + Lottie

Engine: `remotion/` (Remotion 4, `@remotion/lottie`). Built-in scene types only — no per-video code needed.
Add `lottie` entries to scenes for extra polish (e.g. `sparkle-gold` on the title, `burst-*` on counters, `pulse-red` on a map danger point).

1. Layout check: `cd $R/remotion && cp ../output/props.json src/sample.json`, then stills at ~70% of each scene:
   `npx remotion still src/index.ts BangMotion /tmp/s.png --frame=<N> --props=../output/props.json --scale=0.4 --browser-executable=$(ls /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell)`
2. Final: `cd $R && python3 scripts/produce.py output/storyboard.json output/final.mp4` (~20 min; `--draft` = half-res preview).

## Mode 3 — Manim

Engine: Manim 0.19 in `$R/.venv-manim` (created by setup.sh). Captions are burned in afterwards by `produce.py` (ASS/libass).

1. Write `$R/output/manim_scene.py` with `class Video(BMScene)`. Start from `examples/pythagoras_manim.py`. Helpers in `manim/bm_manim.py`:
   `self.scenes` (dicts with `start`, `dur` in seconds + storyboard fields), `self.at(scene_or_time)`, `self.remaining(sc)`, `self.finish()`,
   `self.eyebrow(text)`, `self.clear_scene()`; colours `TEXT ACCENT MUTED GREEN RED BLUE BG`.
2. Frame is 4.5 × 8 units (9:16). Keep content in y ∈ [-1.4, 3.6] (bottom reserved for captions).
3. No LaTeX in the container: use `Text` / `MarkupText` (superscripts like `a²` via Unicode), never `MathTex`/`Tex`.
   Fonts: `Inter`, `Playfair Display`, `Amiri`; weights `NORMAL`, `BOLD`, `HEAVY` (not `BLACK`).
4. Render: `cd $R && python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=manim --scene=output/manim_scene.py` (`--draft` = 540p).

## Mode 4 — Cepat (bang-motion klasik)

Engine: AI-written HTML recorded in real time with Playwright (`scripts/record.js`), muxed with `scripts/mux.sh`. Fastest, lowest quality.

1. Write `$R/output/animation.html` (1080×1920, self-contained, Google Fonts only, inline SVG). At render time `window.PROPS` is injected:
   `{ totalMs, theme, scenes:[{id,type,startMs,durationMs,...}], words:[{text,startMs,endMs}] }`.
   The page starts its clock on load (`performance.now()`), shows each scene in `[startMs, startMs+durationMs)` with 0.4 s fades,
   renders captions from `PROPS.words` around y=1320px, and calls `window.__motionDone()` after `totalMs`. Never hardcode timings.
2. Render: `cd $R && python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=html --html=output/animation.html` (~1.5 min).

---

## Error handling

| Error | Action |
|-------|--------|
| `CARTESIA_API_KEY not set` | Stop, ask the user |
| Cartesia 402 / quota | Report and stop |
| `Invalid language for model` | Model must be `sonic-3` (sonic-2 rejects `id`) |
| HyperFrames render fails | Run `cd $R/hyperframes && npx hyperframes check $R/output/hf --json`, fix each `Fix:` line |
| Manim `There is no Font Weight Called X` | Use NORMAL / BOLD / HEAVY |
| Manim `MathTex` / latex errors | Replace with `Text` / `MarkupText` |
| Missing deps | `bash $R/scripts/setup.sh` |
| `CF_ACCOUNT_ID not set` | Start a new session (env var lives in the Default environment) or ask the user for the account id |
| Cloudflare 3036 / quota exhausted | Offer: render without images, or wait for 07:00 WIB reset |

## Output files (`$R/output/`, git-ignored)

| File | Description |
|------|-------------|
| `storyboard.json` | Approved storyboard |
| `vo/<hash>.mp3`, `.words.json` | Cached per-scene voice + word timestamps |
| `props.json` | Real timings for all engines |
| `img/<hash>.jpg` | Cached AI illustrations |
| `hf/` · `manim_media/` · `animation.*` | Engine working files |
| `final.mp4` | Finished TikTok-ready video |
