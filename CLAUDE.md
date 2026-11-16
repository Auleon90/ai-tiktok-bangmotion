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
   4. **Lemo native** (`lemo/`) — kode demo Lemo-Opuscar diadaptasi ke 9:16, 12 gaya (`python3 scripts/styles.py native`), ±1 menit.
      Adegan perang/kericuhan dua kubu: scene `clash` (gaya bertanda ⚔: paper-lantern, gilded-illumination, paper-popup, brick-toy,
      tilt-shift, urban-sketch, colored-pencil, watercolor). Adegan lain yang tidak ada tipenya: scene `custom` (kode per video di
      `output/custom/<nama>.js`, tetap memakai gaya kit) — JANGAN menambal kit untuk kebutuhan satu video.
   5. **Auto** — Claude memilih sesuai topik & storyboard (aturan di skill)
3. Gambar AI (Cloudflare FLUX) untuk TEMA APA PUN: nilai tiap scene — kalau adegannya punya sesuatu yang bisa dilihat
   (tempat, benda, alam, hewan, peristiwa, proses, suasana) dan gambar membuatnya lebih menarik, pakai gambar. Biasanya 3–6 gambar per video,
   dicampur scene yang digambar kode. Angka/grafik/rumus/teks tetap digambar kode (boleh di atas gambar).
   Tandai scene 🖼️ di storyboard + jumlahnya, supaya user bisa menolak.
   Batasan GAMBAR AI: tanpa wajah manusia untuk konten Islami, tanpa teks Arab dari AI, tidak pernah menggambar Nabi ﷺ/sahabat dengan AI;
   Manim tidak mendukung gambar.
   Kuota Cloudflare HANYA untuk gambar — jangan dipakai untuk QA atau hal lain.
4. Audio: musik orisinal (`music`: warm/epic/tense/calm/playful/sacred/none) + SFX otomatis dari `scripts/score.py`
   (modul `audio/lemo/`, MIT dari Lemo-Opuscar). Sirah → `sacred` atau `none`.
5. Mode 1 WAJIB memakai salah satu dari 99 gaya Lemo-Opuscar (usulkan di storyboard; template polos hanya jika user minta; halaman bergaya wajib menampilkan gambar FLUX) (`scripts/styles.py`, diunduh ke `.lemo/` — JANGAN commit STYLE.md, lisensi CC BY-NC).
6. QA lokal & gratis SEBELUM render: jalankan dulu `produce.py ... --check-only` (VO + `hyperframes check` / cek komposisi 9:16 Lemo native / still per scene Remotion
   → `output/qa_precheck.md`, `output/qa_prerender.jpg`). Render otomatis DIHENTIKAN kalau ada masalah nyata; tumpukan yang disengaja
   masuk `"qa_allow"` di storyboard. Setelah render: QA file akhir (`output/qa_report.md`, `output/qa_sheet.jpg`). Baca sebelum kirim.
7. Semua mode berakhir di `output/final.mp4` dengan VO Cartesia — tidak pernah berhenti di halaman HTML.

Detail lengkap: `.claude/skills/bang-motion/SKILL.md`. Semua mode dijalankan lewat `scripts/produce.py`.
Contoh: `examples/uhud.storyboard.json` (sirah, mode 1/2), `examples/angsa-emas.storyboard.json` (fabel + gambar AI), `examples/kopi-riso.storyboard.json` + `examples/kopi-riso.hf.html` (gaya Risograph), `examples/pythagoras.storyboard.json` + `examples/pythagoras_manim.py` (mode 3), `examples/insyirah.lemo.storyboard.json` (mode 4).
Sosok manusia (keputusan pemilik repo): siluet TANPA WAJAH yang digambar kode (scene `clash`) boleh di semua konten, termasuk sirah.
Sosok Nabi ﷺ hanya boleh sebagai siluet itu dengan `"hero": {"prophet": true}` — ditandai cahaya di atas kepala supaya berbeda dari figuran,
tidak pernah ikut menebas (pose berdiri, tangan terangkat), tidak pernah berwajah/berdetail. Sahabat = siluet anonim seperti figuran.
Gambar AI (FLUX) tetap tanpa Nabi ﷺ/sahabat dan tanpa wajah untuk konten Islami.

## Environment variables yang diperlukan

- `CARTESIA_API_KEY` — tersimpan di Default environment (otomatis tersedia)
- `CARTESIA_VOICE_ID` — tersimpan di Default environment (Galang, id-ID)
- `CARTESIA_MODEL` (sonic-3.6), `CARTESIA_VERSION` (2026-08-14), `CARTESIA_EMOTION` (excited), `CARTESIA_SPEED` (1), `CARTESIA_VOLUME` (1) — Default environment, dibaca `scripts/tts.py`
- `CF_ACCOUNT_ID` — Cloudflare account (Default environment); token Workers AI tersimpan sebagai network secret untuk api.cloudflare.com
- Key Gemini juga tersimpan (generativelanguage.googleapis.com), tapi model gambar Gemini TIDAK punya kuota gratis — jangan dipakai untuk gambar

## Penting

Ketika user mengetik `/bang-motion`, SELALU gunakan skill `.claude/skills/bang-motion/SKILL.md` dari repo ini — JANGAN gunakan `anthropic-skills:tiktok-motion-generator`.

Output MP4 disimpan di `output/` (folder ini di-gitignore).
