# ai-tiktok-bangmotion

Repo ini berisi pipeline untuk generate TikTok motion graphic dengan voiceover Bahasa Indonesia.

## Skill tersedia

- `/bang-motion [prompt]` — generate TikTok MP4 60 detik lengkap dengan Cartesia TTS + animasi + render

## Setup otomatis (jalankan sekali per sesi baru)

```bash
pip install requests --quiet
```

## Environment variables yang diperlukan

- `CARTESIA_API_KEY` — tersimpan di Default environment (otomatis tersedia)
- `CARTESIA_VOICE_ID` — tersimpan di Default environment (Galang, id-ID)

## Penting

Ketika user mengetik `/bang-motion`, SELALU gunakan skill `.claude/skills/bang-motion.md` dari repo ini — JANGAN gunakan `anthropic-skills:tiktok-motion-generator`.

Output MP4 disimpan di `output/` (folder ini di-gitignore).
