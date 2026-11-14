# ai-tiktok-bangmotion

Repo ini berisi pipeline untuk generate TikTok motion graphic dengan voiceover Bahasa Indonesia.

## Skill tersedia

- `/bang-motion [prompt] [--engine html]` — generate TikTok MP4 ~60 detik: Cartesia TTS (sonic-3, timestamp per kata) + animasi Remotion + render

## Setup otomatis (jalankan sekali per sesi baru)

```bash
bash scripts/setup.sh   # pip requests + npm install di remotion/
```

## Engine render

- **Remotion** (default, `remotion/`) — render per frame, H.264 CRF 16, subtitle per kata, ambience angin. Jalankan via `python3 scripts/produce.py <storyboard.json> output/final.mp4`.
- **HTML** (fallback, `--engine html`) — `scripts/record.js` + `scripts/mux.sh`, lebih cepat tapi kualitas lebih rendah.
- Contoh storyboard: `examples/uhud.storyboard.json`.
- Konten sirah: JANGAN menggambarkan sosok/wajah Nabi ﷺ atau sahabat — pakai peta, simbol, kaligrafi.

## Environment variables yang diperlukan

- `CARTESIA_API_KEY` — tersimpan di Default environment (otomatis tersedia)
- `CARTESIA_VOICE_ID` — tersimpan di Default environment (Galang, id-ID)

## Penting

Ketika user mengetik `/bang-motion`, SELALU gunakan skill `.claude/skills/bang-motion.md` dari repo ini — JANGAN gunakan `anthropic-skills:tiktok-motion-generator`.

Output MP4 disimpan di `output/` (folder ini di-gitignore).
