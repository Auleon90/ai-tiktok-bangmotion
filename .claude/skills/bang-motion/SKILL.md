---
name: bang-motion
description: Generate a ~60 s vertical TikTok motion-graphic MP4 with Indonesian Cartesia voice-over, word-synced captions, original music and SFX. Use for /bang-motion or any request to make a video in this repo. Flow - idea, storyboard, approval, render-mode question (HyperFrames, Remotion, Manim, Lemo native, Auto), pre-render QA, render, deliver.
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

## Channel formula (@valsyz7 — Supermetrics TikTok Organic + Metricool data, Nov 2026; full analysis: `content/strategi.md`)

Applies to every video unless the user asks otherwise. Re-check weekly with Supermetrics (`TIKBA`, report `videos`: views, average_view_time,
video_completion_rate, shares, duration) or Metricool, and update this section, `content/strategi.md` and `content/topics_used.md`.
Data (121 videos): viewers leave at 10–15 s even on the 46k hit; completion is 1–5 % at 50–100 s but 25 % at 43 s with one message;
shares drive reach (hit: 1,123 shares) and come from loss/"ini aku" reflections, not from facts.

- **Niche:** gratitude for the blessings of Allah that we forget ("nikmat yang sering kita lupa"). Science/facts are only the
  PROOF of a blessing, never the centre (pure fact videos stalled at ~200–300 views; the 37k-view hit was a "jangan sampai" reflection).
- **Unique topic:** read `content/topics_used.md` first; propose 3 new topics, never repeat a used blessing/fact/ayat with the same angle.
  After delivery, add a row (date, topic, hook, ayat, style; views filled in later).
- **Hook — score 3 candidates in the approval summary**, each a different pattern:
  "Jangan sampai…" (loss) · harga nikmat ("Kalau X harus dibayar…") · celah penasaran with a specific number + promised answer
  ("Ada satu doa … isinya cuma 9 kata") · tuduhan lembut ("Kamu mungkin sudah 3 kali melewatkan nikmat ini hari ini"). Never open with a
  greeting, the channel name, "tahukah kamu" or context: start with the stakes. ≤ 8 words on screen.
  Score 1–5 on: relatable ("ini aku"), loss/stakes, ≤ 12 words / ±3 s spoken, reason to send it to someone. Use the highest in scene 1
  and say why in one line; the user may pick another.
- **Hook rotation (owner rule — viewers get bored of one opener):** read the "Pola hook" of the last 5 rows in `content/topics_used.md`.
  The chosen pattern must differ from the previous video's, and no pattern more than 2× in the last 5 (so "Jangan sampai…" at most
  2 of 5). Patterns to rotate: jangan-sampai · harga-nikmat · instruksi ("Pejamkan matamu 5 detik. Sekarang.") · debat ("Lebih berat
  mana: …?") · fakta-menampar · celah-penasaran · tuduhan-lembut · sudut-orang-lain · pengakuan ("Aku baru sadar … saat …") ·
  larangan-terbalik ("Jangan bersyukur dulu sebelum video ini selesai"). Record the pattern slug in the log row.
- **Hook on frame 0:** scene 1's hook text is fully visible from the first frame (no word-by-word entrance, no fade-in from black);
  motion is ALREADY moving at frame 0 (a line falling, a zoom, a 3D object turning) and VO starts within 0.2 s.
  In HyperFrames pages set the scene-1 words/stage to their end state at t=0.
- **Duration:** 30–45 s, ONE message, one blessing (≤ 25 s for one strong line); never over 55 s. If the idea has 4 stories, use 2 or make a
  series. 4–6 scenes, a new visual every 2–3 s, synced to the spoken words (`K.WORDS` in Lemo custom scenes, word beats in HyperFrames).
- **Retention:** an open loop in the hook paid off at ~70 % of the video; one repeated pattern the viewer learns and anticipates
  (e.g. jatuh → berdoa → diangkat with a step bar); one big contrast number drawn large; no noisy backsound (`music: none` unless asked).
- **Ending:** a share CTA aimed at ONE specific person ("Kirim ke orang yang sedang di titik terendahnya" / "…yang sering lupa minum"),
  never "follow untuk part 2"; the last line leads back into the hook so the video loops. Comment prompts only now and then, and meaningful
  ("tulis nama orang yang kamu ingat"), not "MAU"/"AAMIIN" every time.
- **Caption:** 1–3 sentences that ADD to the VO (first one an "ini aku" question) + 3–5 niche hashtags (#nikmatallah #syukur #renunganislami
  + 1–2 topical) and ALWAYS end with the two owner hashtags `#creatorsearchinsights #videofypシ゚` (exact spelling);
  one spelling of the handle or none; no names of other people/preachers, no "Upload Method" lines, no repeated #fyp.
- **Audio (owner rule, 2026-11-20): NO background music** — always `"music": "none"`, keep ambience (`"ambience": "wind"`) + SFX. Applies to every future video unless the owner asks for music.
- Vary the visual style from the previous video (see the style column in `content/topics_used.md`).
- Daily prompt to reuse: `content/daily_prompt.md`.

## Storyboard format (shared by all modes)

```json
{
  "title": "...",
  "ambience": "wind",                       // "wind" | "none"
  "voice": "<cartesia voice id>",          // optional; default CARTESIA_VOICE_ID (Galang). Female id-ID: Siti b441c4fd-4910-4c55-ae56-f0291057e2cc (cheerful), Citra 74546efd-3ac5-4c41-ba59-4756227f429a, Safira 9076f14a-5602-48a7-bfd1-67ef9b40dd6d
  "music": "warm",                          // warm | epic | tense | calm | playful | sacred | none  (original score, synthesised)
  "sfx": true,                              // whooshes on cuts, title hit, counter ticks, map pulse, final ding
  "style": "risograph",                     // mode 1: any Lemo-Opuscar slug; mode 4 (Lemo native): one of the ★ kits
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
| `list` | `headline`, `items: [string]` (3–4 short points) — Lemo native |
| `custom` | Lemo native, ALL kits: an adegan no built-in type covers — `code: "custom/<name>.js"` + any fields the code reads (see Mode 4) |
| `action` | a moment acted out on a field — landscape kits: `headline`, `sub?`, `terrain` {kind: hill/dunes/plain, hill: left/right, label, features: [{type: well/cave/city/trench/river/sea, at, name, label, side, split}]}, `groups` [{label, count, color, mode: figures/dots, act: move/gather/scatter/surround/rows/wait/follow, from, via[], to, at, start, end, run, route, banner, leader}], `hero?` (full reference in `lemo/action.js`) |
| `clash` | battle / two-sided clash with faceless figures — Lemo native ⚔ kits only: `headline`, `sub?`, `left`/`right`: `{label, count, color?, cavalry? (0–6)}`, `winner?` ("left"/"right": the other side routs at the end), `hero?`: `{side, prophet?, rider?}` |

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
  and **sirah Nabi ﷺ** figures in AI images (battles with figures go to the code-drawn `clash` scene instead).
- Mark image scenes with 🖼️ in the approval summary and state the count ("3 dari 8 scene pakai gambar AI") so the user can decline.
- Supported in modes 1 (HyperFrames), 2 (Remotion) and 4 (Lemo native: each kit treats the photo in its own look). Ignored in Manim.
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
- Sirah/Islamic content (owner's rule): AI images never show the Prophet ﷺ, prophets or sahabat, and no faces. Code-drawn FACELESS
  silhouettes (scene `clash`) are allowed in all content, sirah included. The Prophet ﷺ appears only as such a silhouette via
  `"hero": {"side": ..., "prophet": true}`: a light over the head marks him apart from the other figures; he stands with a raised arm and is
  never shown striking. Sahabat are anonymous figures. Otherwise use maps, symbols, calligraphy, ayat.
- Verify facts (numbers, dates, hadith wording) and cite them in `quote.source` / `ayat.ref`.
- Keep important visuals above pixel y≈1280; captions sit at y 1320+.

Approval summary format:
```
📋 STORYBOARD — [title]
━━━━━━━━━━━━━━━━━━━━━━━━
Scene 1 [type]: [eyebrow]            (🖼️ if it uses an AI image, 🧊 preset if it has a 3D scene, 🔊 name if it has scene SFX)
  🎬 Visual: [what is shown]
  🎙️ VO: "[vo]"
...
━━━━━━━━━━━━━━━━━━━━━━━━
🎨 Gaya: <style or default> · 🎵 Musik: <mood> · 🔊 SFX: on
Perkiraan durasi: ~Xs · Gambar AI: N dari M scene
(mode 1: "🎨 Gaya" WAJIB berisi gaya Lemo + link galeri)
```

### Sound (all modes)

**Default = NO music, ambience AUTO, SFX ON (owner rule, Nov 2026: music was noisy; ambience keeps the silence alive for retention).**
Every storyboard sets `"music": "none", "ambience": "auto", "sfx": true` (the `produce.py` defaults): Cartesia VO + a toneless ambience bed
+ SFX (built-in cut whooshes/hits/ding + scene SFX where the picture shows an event). Add music ONLY when the user asks; turn ambience or SFX
off only when asked. Approval summary line: `🎵 Musik: none · 🌬️ Ambience: <per-scene plan> · 🔊 SFX: on`.

**Ambience (`scripts/ambience.py`, synthesised with ffmpeg, no files):** `room` (soft warm air, the fallback so there is never dead silence),
`wind` (desert, hills, journeys), `rain` (hujan, petrichor), `sea` (laut, air, Musa, Yunus), `night` (malam, tidur, crickets), `fire`
(api, Ibrahim, battles), `space` (galaksi, langit, 3D globe/galaxy). `"auto"` picks one per scene from its words (and its 3D preset) and
crossfades 0.8 s between scenes; set a scene's `"ambience"` to override (or `"none"`), or the top-level one to force a single bed.
Pick deliberately while writing the storyboard: a change of ambience on a cut is a retention cue (a new place = a new sound), so match it
to what the scene shows and keep `room` for text/argument scenes. Level: the bed sits at 60 % of the VO loudness (owner, Nov 2026: 35 % was too quiet; `"ambience_level"` overrides it,
e.g. 0.45 if the user finds it busy, 0.75 for more). Preview: `python3 scripts/ambience.py preview [names]` → `output/ambience_preview/*.wav`.

`scripts/score.py` (run automatically by `produce.py` with `.venv-audio`) writes an original score and timed SFX from the scene timings,
using `audio/lemo/` (sfx.py + pluck.py, MIT, vendored from Lemo-Opuscar). The mixer compresses the voice, holds the backsound
(music + ambience) at a steady **35 % of the VO loudness** (measured EBU R128, every mode, owner's rule — no extra ducking), adds SFX and
masters to −14 LUFS. `produce.py` prints `backsound at 35% of VO`.

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

When the user asks for music, pick `music` by tone: `sacred` for sirah/Islamic content (drone + soft pulse, no melodic instruments — many viewers prefer no music;
offer `"none"` if unsure), `epic` for history/battles, `tense` for mystery, `warm` for fables/stories, `calm` for reflections and math,
`playful` for light facts/tips. State the choice in the approval summary (🎵 line) so the user can change it.

### 3D scenes (three.js — `lib3d/bm3d.js`, modes 1 & 4 and Auto)

Guides: the 13 `threejs-*` skills in `.claude/skills/` (MIT, github.com/cloudai-x/threejs-skills) — read `threejs-fundamentals`,
`threejs-geometry`, `threejs-materials`, `threejs-lighting` (and `threejs-shaders` for glow) before adding a preset or a per-video 3D scene.
Engine: `lib3d/bm3d.js` = deterministic three.js scenes (pure function of time, seeded, no rAF/clock), rendered at 540×960 and scaled up
because the server has no GPU (software WebGL, 1–20 ms per frame). Presets:

| preset | shows | use for |
|---|---|---|
| `terrain` | low-poly night hills in fog, a glowing path dipping into the valley and rising, a light beam at the lowest point | perjalanan hidup, ujian → doa → pertolongan |
| `globe` | dotted planet, atmosphere rim, orbit ring, travelling points | bumi, sains, skala, persebaran |
| `crystal` | faceted gem turning in rim light, ring of dust | nilai/harga nikmat, renungan abstrak |
| `galaxy` | 6k-star spiral, camera drifting through | kosmos, QS Adz-Dzariyat 47, skala |
| `bars` | 3D columns rising to `values` (numbers stay drawn by the page) | data, perbandingan |
| `water` | low-poly sea swell under a moon path | air, laut, hujan, kisah Musa |

Options: `accent`, `bg` (null = transparent), `fog`, `seed`, `speed`, `progress` (terrain path 0–1), `values`/`colors` (bars).
- **HyperFrames (mode 1):** add `"three": {"preset": "globe", ...}` to ANY scene → a 3D layer behind its content with a readability shade
  (template `.bg-3d`; produce.py ships `lib3d/` + three.js into `assets/lib3d/`). Custom Opuscar pages: copy the template's `.bg-3d` block
  and the `<script type="module">` that sets `window.BM3D`.
- **Lemo native (mode 4, every kit):** `{"type": "custom", "code": "lib3d/lemo-scene.js", "three": {...}, "as": "headline", ...fields of that type}`
  → the 3D plays in a framed window at the top of the kit's content box and the kit draws the text below in its own style
  (`"area": "full"` = full-frame behind a shade). build.py copies `lib3d/` when a scene uses it.
- **When to use (Auto and any mode):** 1–2 scenes per video where depth helps (cosmos, earth, a journey, a turning object, a 3D comparison);
  never for ayat/quote scenes and never for figures (no 3D people; content rules apply). Mark them 🧊 in the approval summary.
  Not in Manim or Remotion. A new preset goes into `bm3d.js` (keep it deterministic and light: low-poly, ≤ 6k points, fog instead of post-processing);
  a one-off 3D scene goes into `output/custom/<name>.js` importing `../lib3d/bm3d.js`'s `THREE`.

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
4. `Lemo native / Manim…` — "Lemo native: tampilan persis gaya Opuscar (6 gaya). Atau Manim untuk sains/matematika."

If Q1 = option 2 (HyperFrames) OR Q1 = option 1 and Auto picked HyperFrames, **Q1b** — "Mode 1: gaya dari mana?", header "Gaya" (skip only if the user already named the style source):
1. `Auto Bang Motion` — "AI memilih 1 dari 6 gaya Bang Motion. Tanpa gambar Cloudflare, tanpa gaya Opuscar, tanpa scene action/custom."
2. `Auto Lemo-Opuscar` — "AI memilih 1 dari 99 gaya Opuscar; gambar FLUX, scene action & custom ditentukan AI."
3. `Auto campuran` — "AI memilih koleksi yang paling cocok (Opuscar atau Bang Motion), lalu gayanya."
4. `Tulis bebas` — the user writes what they want (style, FLUX images yes/no, Opuscar custom yes/no, backsound yes/no, anything).
   Follow it literally; ask nothing else unless it contradicts the content rules (Islamic image rules, no Prophet ﷺ images).
In the auto options, say in one line which style was picked and why (topic + tone of the storyboard), then go on to QA/render.
**Bang Motion auto** = `hyperframes/bang/styles.json` themes; storyboard gets NO `image_prompt` (strip any), `"style": "bang:<slug>"`.
**Explain styles in Auto (all sub-options, incl. Auto Bang Motion):** when the topic explains HOW something works or what is INSIDE it, pick:
`kartun-cutaway` preset `dive` for outside → inside levels (body → heart → vessels, mountain → soil → groundwater, building → rooms,
leaf → cell → chloroplast; uses 3–6 FLUX images, the only Bang exception to "no images"), `kartun-cutaway` preset `street` for vehicles/fuel,
`infografik-flat` for a machine/process with moving parts, `papan-tulis` for a step-by-step "why", `sketsa-diagram` for a flow of logic.
Say which one and why in the Auto option line.
**Opuscar auto** = the "Visual styles" rules above (Lemo style + FLUX images + `action`/`custom` scenes where they help).
**Campuran** = Bang Motion when the video is text/number/argument driven (facts, psychology, explainers, steps, data);
Opuscar when it is visual/atmospheric (places, nature, history scenes, stories that need pictures).

If Q1 = option 4, **Q2** — "Pilih yang mana?", header "Mode":
- `Lemo native: <slug>` — "Kode demo Opuscar, komposisi 9:16 asli. ±1 menit render per 60 s."
- `Manim` — "Animasi sains/matematika ala 3Blue1Brown. ±1 menit."

### Auto rules (pick one, say why in the option description)

| Topic / storyboard | Mode |
|---|---|
| Math, physics, chemistry, formulas, graphs, geometry, algorithms | **3 Manim** |
| History / sirah with maps, troop movement, cinematic storytelling, final upload where quality matters most | **2 Remotion + Lottie** |
| "Cara kerja / apa yang terjadi di dalam" — a mechanism, process or object opened up (engine, body organ, soil/water, building, leaf/cell) | **1 HyperFrames, explain styles** (below) |
| Kinetic typography, listicles, tips, facts, motivation, news, promo — most general content | **1 HyperFrames** |
| Topic fits a ★ native kit and the user wants the Opuscar look (sejarah dunia, sains, psikologi, motivasi, Qur'an/hadits, sejarah Islam) | **4 Lemo native** |
| User says it's a draft / test / "cepat" | **4 Lemo native** (fastest full-quality render) |
| Topic gains from depth (kosmos, bumi, perjalanan, benda berputar, data 3D) | **1 HyperFrames** or **4 Lemo native** with 1–2 🧊 3D scenes (`three`, see "3D scenes") |

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

**Bang Motion styles (MIT, `hyperframes/bang/`, from github.com/bangtutorial/bang-motion)** — 6 ready, data-driven 9:16 pages on
`hyperframes/runtime/bang.js` (registry + themes: `hyperframes/bang/styles.json`). Use directly, no copy needed:
`python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=hyperframes --html=hyperframes/bang/<page>`

| slug | look | rig | images |
|---|---|---|---|
| vintage-sketch | paper, sepia engraving, ochre highlighter, drawn rings/rose, ghost year | collage (camera push-through) | optional |
| kartun-kolase | cream paper, colour cut-outs with shadow, colour pills, Caveat notes | collage | optional (polaroid) |
| jurnalisme-visual | black + grain, Barlow uppercase, yellow highlighter, timeline ruler, data bar | collage | optional (dark gradient) |
| katalog-putih | white grid, document + slammed stamp, sticky note, 20-cell scale, checklist | collage | optional (photo card) |
| kartun-panggung | flat bright stage per scene, faceless silhouettes on joint rigs, signboard, meter | stage (cut + slide) | none |
| explainer-aliran | parallax world flowing past, hero cart, signposts per scene | flow | none |
| papan-tulis | whiteboard, marker lines that draw themselves (rough.js), red marker underline, Caveat | explain | none |
| infografik-flat | navy, flat bright vectors with soft shadow, shapes pop in, slide cuts, Jakarta/Fredoka | explain | none |
| sketsa-diagram | Excalidraw-like: dot grid, hachure pastel fills, camera pans across one canvas, sticky-note subtitle | explain | none |
| kartun-cutaway | full-frame flat cartoon street + scooter (faceless helmeted rider), camera keys zoom in, torn X-ray window into the tank (preset `street`, `hyperframes/runtime/explain-cutaway.js`; example `examples/bensin-sedikit.storyboard.json`) | explain | none |

**Dive explainer (kartun-cutaway page, preset `dive`, `hyperframes/runtime/explain-dive.js`)** — outside → inside for ANY subject (body → heart →
vessels, mountain → soil → groundwater, building → floors → rooms, leaf → cell → chloroplast). One scene = one level: its `image` (FLUX, flat
cartoon cutaway, no text, subject centred) fills the frame; the camera pushes (`cam`), a torn X-ray hole (`xray` {at,x,y,size,grow}) opens on the
NEXT scene's picture and grows to fill the screen, so the next level starts where the hole ended. Code overlays: `labels` (pinned to picture
coords, pill on screen), `flows` (particles along a path: blood cells, water), `pulses`, `rain`, `card` (ayat/fact, Arabic drawn by code).
Workflow: run `--check-only` first to generate the images, LOOK at them, then place labels/flows (picture coords: x = -420 + u·1920, y = v·1920
for image fraction u,v; visible u ≈ .22–.78) and keep pills above y 1330. Islamic content: no faces/people in images (body = anatomical
cutaway or silhouette, no face). Example: `examples/air-tanah.dive.storyboard.json`.

**Explain rig (papan-tulis, infografik-flat, sketsa-diagram; runtime `hyperframes/runtime/explain.js` + vendored `rough.js`, MIT)** —
for "cara kerja / kenapa" videos. Scene `"type": "diagram"` with `headline` (`*kata*` highlight) and `"diagram"`: a preset or generic
`parts` ([{shape: rect|circle|ellipse|poly|line|arrow|text, role, at, …}] in a 1000×936 box, content above y≈880). The same storyboard
renders in all three skins. Presets: `motor` (side view, `focus` label, bursts in the engine), `fuelflow` (tank → injector + air → mix, `ratio`),
`cylinder` (slider-crank cross-section, `stroke`: intake|compression|power|exhaust|cycle, `note`), `cycle4` (4 cards in a loop, `active`,
`hub`, `hub2`). Add new presets to `EXPLAIN.presets` (motion = pure function of scene time via `B.update`). Example: `examples/mesin-4tak.storyboard.json`.

Scene types: title, counter (1–2 items; `%` suffix fills bars/cells/meter), list (≤4–5), quote, ayat, **map**. `*kata*` = highlight.
**map** (4 collage styles: vintage-sketch, kartun-kolase, jurnalisme-visual, katalog-putih — NOT panggung/aliran): same fields as the
Remotion map (coords 0–1000, y down): `headline?`, `hills[{label, at, r, color?}]` drawn as contour rings, `units[{label?, color, dots,
from, to?, moveAt:[f0,f1], spread?}]` = dot groups that march, `arrows[{path, color?, at?}]` drawn along the route, `pulse{at, label?, atFrac?}`,
`focus{at, zoom≤1.18}`. Use it for battles, migrations, routes, spread — whenever movement explains better than text
(example: `examples/uhud.vintage-sketch.storyboard.json`, scenes 2, 4–6). Keep units above y≈900 (captions sit below the sheet).
Figures are faceless silhouettes (owner rule), so every Bang style is allowed for Islamic content; in kartun-panggung a scene may set
`"hero": {"prophet": true}` (glow over head, hands raised only). The starter `starter-opener.html` (Three.js promo toolkit) is
kept as reference only — the first title scene of each style is the opener. Starters/references (16:9 originals) stay in
`hyperframes/bang/starters/` and `references/`. With "Auto Bang Motion" do NOT generate FLUX images (images stay optional in "Tulis bebas").


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

## Mode 4 — Lemo native (replaces the old "Cepat" HTML recording)

Engine: `lemo/` — portrait kits whose drawing code, palettes, fonts and motion are adapted from the Lemo-Opuscar demo films
(MIT, see `lemo/LICENSE-lemo-opuscar-MIT.txt`). Each kit is designed natively for 1080×1920 (not a crop of the 16:9 demo) and draws every
frame with `window.render(t)` on one canvas; `lemo/render.mjs` renders it frame by frame (4 workers, ~35 s per 15 s of video).

Kits (tilt-shift and brick-toy are disabled: too heavy without a GPU; their code stays in `lemo/kits/` but they are not offered) (`python3 scripts/styles.py native`, manifest `lemo/kits/kits.json`; ⚔ = has the battle scene `clash`):

| slug | look | use for |
|---|---|---|
| `kino-montage` | constructivist paper, red girder on −18°, B&W archive photos in slanted windows, Oswald numbers | sejarah dunia, pengetahuan umum, angka besar |
| `newsreel` | 1920s film gate, silver Limelight titles, art-deco intertitle cards, scratches & flicker | sejarah dunia, peristiwa abad 20 |
| `stick-explainer` | warm paper, one-line stick figures holding hands, signal red | psikologi, perilaku, pengetahuan umum |
| `flat-space-explainer` | navy night, flat planets, dashed orbits, progress HUD | sains, astronomi, skala |
| ⚔ `paper-lantern` | a backlit paper-cut shadow box: 5 cut sheets in a value ladder (`"ladder"`: night/dusk/winter/desert/green), pulp glowing near the light, burning windows and moon, soft inter-sheet shadows, slow dolly + parallax, front-sheet wipes; text on paper strips, ayat cut out of a dark sheet so the light burns through; battle = jointed silhouettes on the near ridge | motivasi, renungan, Qur'an/hadits, sirah |
| ⚔ `gilded-illumination` | the demo's own painted world full-screen (lapis sky, gold sun, spires, river, castles, gold-leaf glints, red/blue border); text on vellum plaques, photos in a gold roundel, banderole captions | Qur'an/hadits, sejarah Islam, sirah |
| `memphis-diorama` | a Memphis-colour diorama seen from a model-maker's high three-quarter view (2D isometric): three tones per surface, hard violet shadows with halftone, indigo outlines, patterns; places `"place"`: village/market/farm/harbor/mosque, `"time"`: day/dusk/night, `"walkers"`; alive with tiny faceless walkers, boats, birds, cloud shadows, lights; numbers/points/quotes as callout pills from the model; three lines of type under three marks; plain subtitles. No photos, no clash, no character acting | aktivitas penduduk, kehidupan desa/kota/pasar/pelabuhan |
| ⚔ `paper-popup` | a pop-up book on a lamp-lit desk; each scene is a spread (one hue family, `"spread"`: meadow/market/desert/sea/night/sketch); the demo's cut-paper cards pop up back→front and fold before a page turn; text lives in the paper world (sign on strings, typing bubble, pull-tab slats, hanging tags, scroll); cream/brown subtitles. Keep on-screen text short | kisah, dongeng, sejarah ringan |
| ⚔ `urban-sketch` | fineliner that draws itself, off-register washes, skyline, Caveat | tempat & kota, psikologi sehari-hari |
| ⚔ `colored-pencil` | one pencil drawing on toothed paper: a cutaway (sky wash, trees, grass line, soil horizons, stones, roots, a buried pipe) drawn with four pencil layers, a boiling graphite contour, colour drawn in by a ragged front, the camera sinking per scene, magnifier-circle transitions; titles pencilled on the sky, cream tags, subtitles on a cream slip | sains alam, biologi, ayat tentang alam |
| ⚔ `watercolor` | wet washes with dark edges, misty greens, handwritten notes | alam, renungan, inspirasi hidup |

The 3D demos (paper-popup, paper-lantern, brick-toy, tilt-shift, colored-pencil) are three.js films. This server has no GPU (software WebGL:
~1 s per 1080×1920 frame, ~25 min per 60 s), so with the 1–3 min budget: paper-popup, paper-lantern and colored-pencil are rebuilt in 2D
from their concepts (demo Canvas2D art reused where it exists); tilt-shift (hybrid, 3D stills) and brick-toy were tried and are disabled for now (too slow here); they could use 3D stills pre-rendered by the demo engine
with 2D motion on top (in progress).

**Choosing `action` automatically (storyboard step).** In a landscape kit, read each scene's narration: when it describes something that
happens in a place — people moving, gathering, scattering, surrounding, climbing, crossing, waiting in rows, a journey with stops — make it an
`action` scene yourself: pick the terrain (hill for heights, dunes for desert travel, plain otherwise), the features the story names (well,
cave, city/fort, trench, river, sea that parts), and for each group the act, route and form (dots for many people or a map-like overview,
figures when the action itself matters). Facts, numbers, quotes and ayat stay `counter` / `quote` / `ayat`. Show the choice in the approval
summary ("Scene 3 [action]: pemanah (titik) turun dari Jabal Rumat ke dataran; pasukan berkuda (siluet) memutar dari belakang bukit").
Examples: hijrah = dunes + city Makkah → via cave Tsur → city Madinah with `route`; Musa = plain + sea with `split`, the people as dots crossing
to the sea's name; Khandaq = plain + trench, defenders `rows`, the confederates `gather` on the far side; Badar = plain + well, then `clash`.

Landscape kits (paper-popup, paper-lantern, colored-pencil, urban-sketch, watercolor) do NOT take AI photos (`image` is refused by
produce.py: a photo pasted into a paper box / pencil plate / sketchbook reads as a cut-out). Tell the story by acting it out: `action`
(terrain + groups of faceless figures or coordinate dots moving between places, e.g. the archers coming down Jabal Rumat at Uhud as dots
with trails, then the cavalry riding round the hill as figures), `clash` for fights, `custom` for anything else. Photos remain fine in
kino-montage, newsreel, gilded-illumination, flat-space-explainer and stick-explainer.

Battle scene `clash` (⚔ kits): two sides march in, trade arrow volleys, charge, meet with sparks and dust, some figures fall (more on the
losing side) and, with `winner`, the loser routs. Figure counts follow the ratio of `count` (6–14 drawn per side), `cavalry` adds riders,
the side with `color` carries a banner. Figures are always faceless; `hero.prophet` adds the light over the head (see content rules).
Timeline inside the scene (fraction of its length), to place SFX on the action: arrows .12–.35 (`swoosh`), charge .32–.46
(`footsteps`/`riser`), lines meet at .46 (`sword_clash`, add another at .6), falls .52–.82 (`impact`), rout .82–1.
Give a clash scene ≥ 7 s of VO so every phase reads.

1. Storyboard: `"style": "<slug>"` (one of the ★ kits), built-in scene types only (`title headline counter quote ayat tribute list image`,
   `clash` in ⚔ kits; `map` is not supported — use Remotion for maps). The kit's `image_style` is used for FLUX automatically unless the
   storyboard sets one. People appear only as the faceless figures of `clash` (and stick-explainer's stick figures).
2. No page to write: the kit renders every scene type from `PROPS`. Keep on-screen text short (titles ≤ 6 words, list items ≤ 6 words);
   every text is fitted into its box (wrap, then shrink), so long text gets small rather than spilling.
3. Pre-render QA: `cd $R && python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=lemo --check-only`
   → composition check (`lemo/render.mjs layout`: text overflow, outside the 9:16 safe area x 84–960 / y 210–1250, captions outside the
   band y 1330–1560, overlapping texts or text over the photo) + `output/qa_prerender.jpg`. Blocking issues stop the render; shorten the text.
4. Render: same command without `--check-only` (`--workers=6` on a free machine).

**Custom scenes (`"type": "custom"`) — use them instead of patching kits.** When an adegan needs something no built-in type draws
(a city mood, a caravan, a market, a process, a dialogue…), write `output/custom/<name>.js` for this video and reference it with
`"code": "custom/<name>.js"`. The kit still draws its background, frame, eyebrow and captions; the module draws the content:

```js
export function prep(c) { /* once: build offscreen textures with c.K.mk */ }
export default function (g, c) {   // every frame, deterministic (no Date/Math.random: use c.K.mulberry / c.K.hash)
  // c.t, c.lt (scene time), c.p (0..1), c.d, c.s (scene fields), c.box (content area: put text inside), c.full, c.img (FLUX or null)
  // c.theme = the kit's fonts/colours (title, body, label, num, quote, accent, align) → text matches the style automatically
  // c.look  = the kit's figure look; c.FIG.drawFigure(g, {x, y, S, dir, pose: 'walk'|'run'|'hold'|'strike'|'command', ph, fall: 0, side}, c.t, c.look)
  // c.K     = kit helpers: block, text, reg, fit, cover, eo, seg, lerp, mix, mulberry, hash, vnoise, TAU…
  c.K.block(g, 'main', c.s.headline, { x: c.box.x, y: c.box.y, w: c.box.w, h: 200 }, { ...c.theme.title });
}
```
Rules: every text through `c.K.block`/`c.K.text` (the layout check sees them), big pictures registered with `c.K.reg`, use `c.theme`
colours/fonts so the scene stays in the kit's style, faceless figures only (content rules apply). Example: `examples/custom/kota-hujan.js`
(city street in the rain: buildings, pedestrians with umbrellas, cars, rain). The pre-render layout check and runtime errors gate it
like any scene; look at its still in `output/qa_prerender.jpg`. Copy a custom module that proves useful into `examples/custom/` for reuse.

To add a kit: copy one in `lemo/kits/`, read the demo's code in `.lemo/lemo-opuscar/styles/<slug>/demo/` (setup.sh downloads it), keep the
`kit.js` contract (`boot`, `block`/`text` for every text, `captions`, `reg` for photos), add it to `kits.json`, and run the layout check on
`lemo/test_props.py` output for all scene types until it reports 0 issues.

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
| `hf/` · `lemo/` · `manim_media/` | Engine working files |
| `final.mp4` | Finished TikTok-ready video |
