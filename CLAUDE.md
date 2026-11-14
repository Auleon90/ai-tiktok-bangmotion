# ai-tiktok-bangmotion

Repo ini berisi pipeline untuk generate TikTok motion graphic dengan voiceover Bahasa Indonesia.

## Skill tersedia

- `/bang-motion [prompt]` — generate TikTok MP4 ~60 detik dengan Cartesia TTS (sonic-3, timestamp per kata) + subtitle per kata.

## Setup otomatis (jalankan sekali per sesi baru)

```bash
bash scripts/setup.sh   # requests/fonttools, npm install (remotion, hyperframes), venv Manim, aset Lottie
```

## Alur wajib setiap request video

1. Ide → storyboard (`output/storyboard.json`) → minta approval (Lanjutkan / Revisi).
2. SETELAH approve: WAJIB tanya mode render via AskUserQuestion (kecuali user sudah menyebut modenya):
   1. **HyperFrames + GSAP + Lottie** (`hyperframes/`) — render per frame, ±2 menit
   2. **Remotion + Lottie** (`remotion/`) — kualitas tertinggi, ±20 menit
   3. **Manim** (`manim/`, `.venv-manim`) — sains/matematika, ±1 menit
   4. **Cepat** (bang-motion klasik: HTML + rekam layar) — draf, ±1,5 menit
   5. **Auto** — Claude memilih sesuai topik & storyboard (aturan di skill)
3. Semua mode berakhir di `output/final.mp4` dengan VO Cartesia — tidak pernah berhenti di halaman HTML.

Detail lengkap: `.claude/skills/bang-motion.md`. Semua mode dijalankan lewat `scripts/produce.py`.
Contoh: `examples/uhud.storyboard.json` (sirah, mode 1/2), `examples/pythagoras.storyboard.json` + `examples/pythagoras_manim.py` (mode 3).
Konten sirah: JANGAN menggambarkan sosok/wajah Nabi ﷺ atau sahabat — pakai peta, simbol, kaligrafi.

## Environment variables yang diperlukan

- `CARTESIA_API_KEY` — tersimpan di Default environment (otomatis tersedia)
- `CARTESIA_VOICE_ID` — tersimpan di Default environment (Galang, id-ID)

## Penting

Ketika user mengetik `/bang-motion`, SELALU gunakan skill `.claude/skills/bang-motion.md` dari repo ini — JANGAN gunakan `anthropic-skills:tiktok-motion-generator`.

Output MP4 disimpan di `output/` (folder ini di-gitignore).
