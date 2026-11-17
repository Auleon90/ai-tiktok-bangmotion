# Menjalankan bang-motion di laptop (Antigravity IDE, VS Code, dll.)

## 1. Prasyarat

| Alat | Versi | Catatan |
|---|---|---|
| Python | 3.10+ | `python3`, `pip`, `venv` |
| Node.js | 20+ | `node`, `npm`, `npx` |
| ffmpeg | 6+ | harus ada di PATH (`ffmpeg -version`) |
| git, bash | — | skrip memakai bash |

- **macOS**: `brew install python node ffmpeg pango pkg-config` (pango untuk mode Manim).
- **Linux (Ubuntu/Debian)**: `sudo apt install python3-venv nodejs npm ffmpeg libpango1.0-dev pkg-config`.
- **Windows**: pakai **WSL2 (Ubuntu)**, lalu ikuti langkah Linux. Buka folder proyek dari WSL di Antigravity
  (Remote/WSL). Skrip bash tidak jalan di PowerShell biasa.

## 2. Kunci API (`.env`)

Salin `.env.example` menjadi `.env` di root proyek dan isi nilainya. `scripts/produce.py` membacanya otomatis.
`.env` sudah di-`.gitignore`: jangan di-commit.

| Variabel | Untuk | Wajib |
|---|---|---|
| `CARTESIA_API_KEY` | voice-over (Cartesia) | ya |
| `CARTESIA_VOICE_ID` | suara (default Galang id-ID) | tidak |
| `CARTESIA_MODEL`, `CARTESIA_VERSION`, `CARTESIA_EMOTION`, `CARTESIA_SPEED`, `CARTESIA_VOLUME` | pengaturan TTS | tidak |
| `CF_ACCOUNT_ID` + `CF_API_TOKEN` | gambar AI (Cloudflare Workers AI, FLUX) | hanya jika memakai gambar |

Di cloud session Claude, token Cloudflare disuntikkan proxy; di laptop **harus** diisi `CF_API_TOKEN`
(token Workers AI dari dashboard Cloudflare: My Profile → API Tokens → template "Workers AI").

## 3. Setup (sekali)

```bash
bash scripts/setup.sh
```

Memasang: paket Python, Remotion, HyperFrames, venv Manim, venv audio (musik + SFX), sampel musik CC0 (~700 MB),
rekaman SFX Kenney, pustaka gaya Lemo-Opuscar (`.lemo/`, tidak di-commit), three.js, serta Playwright + Chromium
headless untuk renderer Lemo. Pertama kali bisa 10–20 menit; berikutnya hanya memeriksa.

## 4. Membuat video

```bash
python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=lemo --check-only   # QA dulu
python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=lemo                # render
```

Mesin lain: `--engine=hyperframes --html=output/hf_index.html`, `--engine=manim --scene=output/manim_scene.py`,
atau tanpa `--engine` (Remotion). Contoh storyboard ada di `examples/`.

## 5. Agen AI di Antigravity

- Aturan proyek: `AGENTS.md` dan `.agent/rules/bang-motion.md` (keduanya merujuk ke `CLAUDE.md`).
- Alur `/bang-motion`: `.agent/workflows/bang-motion.md` → panduan lengkap di `.claude/skills/bang-motion/SKILL.md`.
- SKILL.md ditulis untuk Claude Code: di sana disebut alat `AskUserQuestion` (= tanyakan pilihan di chat) dan
  `SendUserFile` (= sebutkan path `output/final.mp4`). Agen lain cukup melakukan hal yang sama lewat chat.

## 6. Gaya Lemo native

`python3 scripts/styles.py native` menampilkan 10 gaya yang aktif. tilt-shift dan brick-toy dinonaktifkan
(3D, terlalu berat tanpa GPU); kodenya tetap di `lemo/kits/`. Di laptop dengan GPU, keduanya bisa dicoba lagi
dengan menghapus `"disabled"` di `lemo/kits/kits.json` (tilt-shift memakai `prerender.mjs`).
