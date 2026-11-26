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
   **Storyboard ditampilkan LENGKAP di chat (aturan pemilik, 2026-11-25):** setiap scene dengan teks layar, narasi VO PENUH kata per kata
   (bukan ringkasan), dalil, visual, SFX; plus caption, gaya, durasi. Tidak ada yang dipotong/diringkas, supaya pemilik bisa review penuh.
2. SETELAH approve: WAJIB tampilkan DAFTAR SEMUA GAYA (aturan pemilik, 2026-11-25) — bukan pertanyaan mode 1/2/3/4 lagi
   (kecuali user sudah menyebut gayanya). Daftar dibaca dari `docs/styles/index.json` (nomor, nama gaya, engine, cocok untuk, perkiraan
   waktu render, rekomendasi ★ untuk storyboard ini), lalu kirim gambar contohnya: `docs/styles/gallery.jpg` (semua gaya, bernomor) dan/atau
   `docs/styles/<id>.jpg` per gaya. Gambar contoh SUDAH ADA di repo — jangan di-generate saat bertanya (buat ulang hanya bila gaya baru
   ditambahkan: `python3 scripts/style_previews.py <id>`). Gaya Opuscar (99, lisensi CC BY-NC, tidak di-commit) tampil sebagai satu baris
   dengan link galeri https://lemomo-ai.github.io/lemo-opuscar/. Pemilik membalas dengan nomor/nama gaya. Rincian engine (referensi):
   1. **HyperFrames + GSAP + Lottie** (`hyperframes/`) — render per frame, ±2 menit. Lalu tanya sub-pilihan gaya:
      **Ukiran Tembaga** (explainer khas pemilik, `hyperframes/bang/ukiran-tembaga.hf.html`; pilihan pertama/Recommended untuk video
      yang menjelaskan: ayat kauniyah, penciptaan, alam, hewan, tubuh, sains detail; tema tanpa preset digambar mendadak lewat `subject.parts`) ·
      Auto Bang Motion (gaya `hyperframes/bang/`, tanpa gambar Cloudflare/Opuscar/action/custom) · Auto Lemo-Opuscar / campuran ·
      Tulis bebas (user menentukan gaya, gambar, custom, backsound, dll.)
   2. **Remotion + Lottie** (`remotion/`) — kualitas tertinggi, ±20 menit
   3. **Manim** (`manim/`, `.venv-manim`) — sains/matematika, ±1 menit
   4. **Lemo native** (`lemo/`) — kode demo Lemo-Opuscar diadaptasi ke 9:16, 11 gaya (`python3 scripts/styles.py native`; memphis-diorama untuk aktivitas penduduk; tilt-shift & brick-toy dinonaktifkan: 3D terlalu berat), ±1 menit.
      Adegan perang/kericuhan dua kubu: scene `clash` (gaya bertanda ⚔: paper-lantern, gilded-illumination, paper-popup,
      urban-sketch, colored-pencil, watercolor). Gaya lanskap (paper-popup, paper-lantern, colored-pencil, urban-sketch, watercolor) TIDAK memakai gambar AI: adegan diperagakan
      dengan scene `action` (bukit/dataran + siluet atau titik koordinat yang bergerak, mis. pemanah turun dari bukit Uhud). Adegan lain yang tidak ada tipenya: scene `custom` (kode per video di
      `output/custom/<nama>.js`, tetap memakai gaya kit) — JANGAN menambal kit untuk kebutuhan satu video.
   5. **Auto** — Claude memilih sesuai topik & storyboard (aturan di skill)
3. Gambar AI: DEFAULT TIDAK DIPAKAI (aturan pemilik 22 Nov 2026: tanpa gambar tempel, lihat "Visual @valsyz7"). Bila pemilik memintanya — Gambar AI (Cloudflare FLUX) untuk TEMA APA PUN: nilai tiap scene — kalau adegannya punya sesuatu yang bisa dilihat
   (tempat, benda, alam, hewan, peristiwa, proses, suasana) dan gambar membuatnya lebih menarik, pakai gambar. Biasanya 3–6 gambar per video,
   dicampur scene yang digambar kode. Angka/grafik/rumus/teks tetap digambar kode (boleh di atas gambar).
   Tandai scene 🖼️ di storyboard + jumlahnya, supaya user bisa menolak.
   Batasan GAMBAR AI: tanpa wajah manusia untuk konten Islami, tanpa teks Arab dari AI, tidak pernah menggambar Nabi ﷺ/sahabat dengan AI;
   Manim tidak mendukung gambar.
   Kuota Cloudflare HANYA untuk gambar — jangan dipakai untuk QA atau hal lain.
4. Audio (semua mode): DEFAULT TANPA MUSIK DAN TANPA AMBIENCE, SFX ON — storyboard `"music": "none", "ambience": "none", "sfx": true` (aturan pemilik 22 Nov 2026).
   Ambience hanya bila diminta: suasana
   tanpa nada per scene (`scripts/ambience.py`: room, wind, rain, sea, night, fire, space — dipilih otomatis dari kata di scene, crossfade)
   + SFX (keputusan pemilik: musik berisik; ambience untuk retensi, level 60% dari loudness VO — `"ambience_level"`). Musik hanya kalau user memintanya; ambience/SFX dimatikan hanya kalau diminta; bila diminta: backsound (musik + ambience) 35% dari loudness VO; musik orisinal (`music`: warm/epic/tense/calm/playful/sacred/none) + SFX otomatis dari `scripts/score.py`
   (modul `audio/lemo/`, MIT dari Lemo-Opuscar). Sirah → `sacred` atau `none`.
5. Mode 1 WAJIB memakai salah satu gaya: 99 gaya Lemo-Opuscar ATAU gaya Bang Motion termasuk `ukiran-tembaga` (`hyperframes/bang/styles.json`, MIT, tanpa gambar wajib) — sesuai sub-pilihan mode 1. Untuk Opuscar (usulkan di storyboard; template polos hanya jika user minta; halaman bergaya wajib menampilkan gambar FLUX) (`scripts/styles.py`, diunduh ke `.lemo/` — JANGAN commit STYLE.md, lisensi CC BY-NC).
6. QA lokal & gratis SEBELUM render: jalankan dulu `produce.py ... --check-only` (VO + `hyperframes check` / cek komposisi 9:16 Lemo native / still per scene Remotion
   → `output/qa_precheck.md`, `output/qa_prerender.jpg`). Render otomatis DIHENTIKAN kalau ada masalah nyata; tumpukan yang disengaja
   masuk `"qa_allow"` di storyboard. Setelah render: QA file akhir (`output/qa_report.md`, `output/qa_sheet.jpg`). Baca sebelum kirim.
7. Animasi 3D (three.js, `lib3d/bm3d.js`, panduan skill `threejs-*` dari cloudai-x/threejs-skills): 1–2 scene 🧊 per video bila kedalaman membantu
   (kosmos, bumi, perjalanan, benda berputar, data). Mode 1 HyperFrames: field `"three": {"preset": ...}` di scene mana pun; mode 4 Lemo native:
   scene `custom` dengan `"code": "lib3d/lemo-scene.js"`; mode Auto memilihnya sesuai topik. Preset: terrain, globe, crystal, galaxy, bars, water.
8. Caption setiap video (aturan pemilik, 2026-11-26): ditulis dengan 3 bagian, tidak boleh datar/sekadar ringkasan judul —
   **HOOK** (kalimat pertama, ±≤70 karakter supaya terbaca sebelum "lainnya": pertanyaan menohok/fakta mengejutkan/"ini aku" yang
   membuat penasaran, tidak membocorkan jawaban) → **PENJELASAN** (1–3 kalimat yang MENAMBAH isi VO: makna, dalil singkat, analogi
   nyata, atau satu insight yang tidak ada di video) → **CTA kuat** (ajakan spesifik yang memancing interaksi: jawab pertanyaan di
   komentar, simpan untuk diingat, kirim ke orang yang butuh — bukan "like & follow" generik) + 3–5 hashtag niche, SELALU ditutup
   `#creatorsearchinsights #videofypシ゚` (ejaan persis). Di storyboard tulis caption lengkap dengan label [Hook]/[Penjelasan]/[CTA].
9. Semua mode berakhir di `output/final.mp4` dengan VO Cartesia — tidak pernah berhenti di halaman HTML.

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

**Kedalaman, bukan durasi pendek (aturan pemilik, 2026-11-24):** durasi tidak harus pendek. Yang wajib: konten tidak receh — hook kuat & mendalam (boleh emosional), bahasan dalam dan tajam, analogi nyata yang membuat penonton mudah paham, ditutup CTA kuat. Detail di SKILL.md.

**Ide konten berbasis analitik (aturan pemilik, 2026-11-25):** sebelum memberi ide/storyboard, baca bagian "Creator Search Insights"
di `content/strategi.md` (retensi 18,2 s = kelemahan utama; kata kunci naik: kata kata kehidupan, motivasi & nasihat Islami, reminder islam)
dan perbarui bagian itu setiap ada screenshot analitik baru.

**Perubahan aturan (aturan pemilik, 2026-11-24):** setiap aturan baru dari pemilik langsung di-commit dan di-push ke `main`.

**Gaya explainer, bukan gaya tempel (aturan pemilik, 2026-11-21):** video yang menjelaskan makna/perumpamaan/cara kerja memakai gaya explainer yang digambar (Bang `ukiran-tembaga` = gaya khas pemilik untuk ayat kauniyah/penciptaan/alam/sains detail (2026-11-24), `papan-tulis`, `infografik-flat`, `sketsa-diagram`, `kartun-cutaway`, Lemo `stick-explainer`), bukan jendela 3D/foto yang ditempel di kartu. Detail di SKILL.md.

**Audio @valsyz7 (aturan pemilik, 2026-11-22): TANPA musik dan TANPA ambience** — selalu `"music": "none", "ambience": "none", "sfx": true`:
hanya VO Cartesia + SFX, untuk semua video berikutnya kecuali pemilik minta musik/ambience.

**Visual @valsyz7 (aturan pemilik, 2026-11-22): TANPA gambar tempel** — jangan menempelkan gambar/foto (FLUX atau lainnya) ke dalam frame,
panel, polaroid, kolase atau jendela. Semua visual digambar kode dalam gaya kit (garis, bentuk, lanskap, siluet, 3D, tipografi).
Pilih gaya yang tidak memakai foto (Lemo native lanskap: paper-lantern, paper-popup, colored-pencil, urban-sketch, watercolor, memphis-diorama;
Bang Motion tanpa gambar: kartun-panggung, explainer-aliran). Gambar AI hanya kalau pemilik memintanya.

**Ayat di paper-lantern (aturan pemilik, 2026-11-24): TANPA latar hitam/kotak gelap** — teks Arab emas langsung di langit dengan
bayangan hitam lembut per huruf (jatuh sedikit ke bawah), diapit dua garis emas berhias belah ketupat, kartu terjemahan tepat di bawahnya
(contoh https://vt.tiktok.com/ZSsN7mw5y/, adegan Nabi Ayyub); bulan disembunyikan di scene ayat.
Kotak gelap di belakang ayat terkesan tempelan. Sudah diterapkan di `lemo/kits/paper-lantern/lantern.js`.

**Thumbnail di detik 00:00:00 (aturan pemilik, 2026-11-26):** frame PERTAMA setiap video (t=0, tanpa fade-in dari hitam/kosong)
WAJIB sudah berupa visual utuh yang layak jadi thumbnail/cover TikTok: judul hook besar 2 baris (kata kunci diwarnai beda, mis. emas/merah,
huruf tebal kapital, kontras tinggi), subjudul kecil opsional, plus satu ikon/ilustrasi pusat yang langsung terbaca (teks Arab kunci,
sosok siluet, benda/simbol) di atas latar gelap/bertema. Semua elemen muncul penuh di frame 0 — animasi masuk dimulai SETELAH frame 0
atau elemen sudah tampil lalu bergerak. Teks thumbnail di zona aman (di bawah tab TikTok, jauh dari ikon kanan & caption bawah) dan
tidak menumpuk watermark. Storyboard scene 1 wajib punya field `"thumbnail"` (judul, subjudul, visual). Cek di QA: frame 0 diekstrak
(`ffmpeg -ss 0 -frames:v 1`) dan dilihat sebelum kirim; frame 0 kosong/hitam/setengah muncul = tidak boleh dikirim.
OTOMATIS: `qa.py precheck` memblokir render bila scene 1 tanpa `"thumbnail"`; `qa.py all` (setelah render) / `qa.py thumb <mp4>`
menyimpan `output/qa_thumb.jpg` dan gagal (exit 3, "DO NOT DELIVER") bila frame 0 hitam, datar, atau detailnya < 60% frame detik 1.

**Watermark @valsyz7 (aturan pemilik, 2026-11-24):** setiap video diberi nama akun samar — otomatis di `produce.py`
(`add_watermark`: teks `@valsyz7` 34%, di bawah tab TikTok, aman dari ikon kanan & caption bawah).
Posisi PER GAYA (aturan pemilik, 2026-11-25) supaya tidak menumpuk judul scene: tabel `WM_POS` di `scripts/produce.py`
(default kiri atas y 8,5%; jurnalisme-visual, papan-tulis, infografik-flat, sketsa-diagram → kanan atas; kartun-cutaway → kanan atas y 12,5%).
Gaya baru: cek gambar contohnya di `docs/styles/` lalu tambahkan ke `WM_POS` bila watermark menumpuk teks.
Halaman yang menggambar cap sendiri memakai atribut `data-watermark` (Ukiran Tembaga: "ex collectione @valsyz7" tegak di tepi kiri plat).
Storyboard `"watermark": "<teks>"` mengganti teks, `false` mematikan (hanya bila pemilik minta).
**WAJIB (aturan pemilik, 2026-11-25):** setiap video yang di-generate/render, mode apa pun, membawa watermark `@valsyz7`
terlihat dari detik 0 sampai frame terakhir tanpa jeda (drawtext tanpa `enable=`, juga di render draft dan render ulang).
Cek di `qa_sheet.jpg` sebelum kirim; video tanpa watermark tidak boleh dikirim.

Ketika user mengetik `/bang-motion`, SELALU gunakan skill `.claude/skills/bang-motion/SKILL.md` dari repo ini — JANGAN gunakan `anthropic-skills:tiktok-motion-generator`.

Output MP4 disimpan di `output/` (folder ini di-gitignore).
