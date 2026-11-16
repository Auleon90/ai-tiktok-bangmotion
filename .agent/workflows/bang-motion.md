---
description: Buat video TikTok motion graphic ~60 detik (VO Cartesia + subtitle + musik) — alur bang-motion
---

1. Baca `CLAUDE.md` dan `.claude/skills/bang-motion/SKILL.md` sampai habis (jika belum di percakapan ini). Ikuti semua aturannya,
   dengan penyesuaian lokal dari rule `00-baca-dulu` (semua perintah lewat `.\bm.cmd ...`).
2. Pastikan `.env` berisi `CARTESIA_API_KEY` (cek hanya ada/tidaknya, jangan tampilkan nilainya).
3. Dari permintaan user: tentukan hook + alur cerita, tulis `output/storyboard.json` sesuai format SKILL.md.
4. Tampilkan ringkasan storyboard (format "📋 STORYBOARD" di SKILL.md) lalu tanya: **1. Lanjutkan / 2. Revisi**. Tunggu jawaban. Ulangi bila revisi.
5. Setelah disetujui, tanya mode render (1 Auto, 2 HyperFrames, 3 Remotion, 4 Manim, 5 Cepat) kecuali user sudah menyebutnya. Tunggu jawaban.
6. VO: `.\bm.cmd python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render`
7. Bangun halaman/scene sesuai mode (SKILL.md), lalu QA dulu dengan `--check-only`. Baca `output/qa_precheck.md`, perbaiki, ulangi sampai lolos.
8. Render final (perintah yang sama tanpa `--check-only`). Baca `output/qa_report.md` dan lihat `output/qa_sheet.jpg`.
9. Laporkan: path `output\final.mp4`, durasi, ukuran, jumlah scene, mode, hasil QA, kata yang perlu didengar ulang, dan kredit gaya Lemo bila mode 1.
