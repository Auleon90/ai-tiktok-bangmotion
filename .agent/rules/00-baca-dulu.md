---
trigger: always_on
---

# WAJIB sebelum mengerjakan apa pun di workspace ini

1. Baca `CLAUDE.md` (root) dan `.claude/skills/bang-motion/SKILL.md` SECARA LENGKAP sebelum menjawab atau menjalankan perintah apa pun.
   Semua aturan di dua file itu berlaku untukmu juga (alur ide → storyboard → approval → pilih mode → QA → render, aturan konten Islami,
   gaya Lemo, gambar FLUX, level musik di bawah VO, dll.). Kalau ada yang bertentangan, `CLAUDE.md` + `SKILL.md` yang menang,
   kecuali perbedaan teknis lokal di bawah.
2. Permintaan "buat video", "motion graphic", "/bang-motion …" = jalankan alur `SKILL.md` (workflow `/bang-motion`).

# Perbedaan teknis: laptop Windows 10 lokal (bukan cloud Claude Code)

- **Semua perintah dijalankan lewat WSL Ubuntu**, bukan PowerShell/cmd langsung. Pakai wrapper di root:
  `.\bm.cmd <perintah linux>` — contoh `.\bm.cmd python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render`.
  Path di dalam perintah selalu relatif ke root project dan memakai `/`. Jangan memakai `python`, `npm`, `ffmpeg` versi Windows.
- `$R` di SKILL.md = root project ini (mis. `D:\motion-graphic`, di WSL `/mnt/d/motion-graphic`). Abaikan `/home/user/...`.
- Setup sudah dilakukan user (`windows\2-setup.bat`). Jangan jalankan `scripts/setup.sh` lagi kecuali ada error "missing deps".
- Kunci API dibaca otomatis dari file `.env` (oleh `scripts/envfile.py`). JANGAN tampilkan, salin, atau commit isi `.env`.
  Kalau `CARTESIA_API_KEY` kosong → berhenti dan minta user mengisinya di `.env`.
- Gambar AI: pakai Cloudflare FLUX (`CF_ACCOUNT_ID` + `CF_API_TOKEN` di `.env`). Kalau kosong → tawarkan render tanpa gambar.
  Jangan memakai generator gambar Gemini/Imagen bawaan Antigravity untuk scene video kecuali user meminta.
- Pertanyaan pilihan (AskUserQuestion di SKILL.md) → tanyakan di chat sebagai daftar bernomor dan TUNGGU jawaban user.
- `SendUserFile` di SKILL.md → cukup sebutkan path hasil: `output\final.mp4` (user membukanya di Explorer).
- Render panjang (Remotion ±20 menit): jalankan, beri tahu user, jangan dihentikan di tengah.
- Untuk melihat frame/QA sheet, buka file gambar `output/qa_sheet.jpg` / `output/qa_prerender.jpg` dan periksa sebelum menyerahkan hasil.
