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
   1. **HyperFrames + GSAP + Lottie** (`hyperframes/`) — render per frame, ±2 menit. Lalu tanya sub-pilihan gaya:
      Auto Bang Motion (6 gaya `hyperframes/bang/`, tanpa gambar Cloudflare/Opuscar/action/custom) · Auto Lemo-Opuscar ·
      Auto campuran · Tulis bebas (user menentukan gaya, gambar, custom, backsound, dll.)
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
5. Mode 1 WAJIB memakai salah satu gaya: 99 gaya Lemo-Opuscar ATAU 6 gaya Bang Motion (`hyperframes/bang/styles.json`, MIT, tanpa gambar wajib) — sesuai sub-pilihan mode 1. Untuk Opuscar (usulkan di storyboard; template polos hanya jika user minta; halaman bergaya wajib menampilkan gambar FLUX) (`scripts/styles.py`, diunduh ke `.lemo/` — JANGAN commit STYLE.md, lisensi CC BY-NC).
6. QA lokal & gratis SEBELUM render: jalankan dulu `produce.py ... --check-only` (VO + `hyperframes check` / cek komposisi 9:16 Lemo native / still per scene Remotion
   → `output/qa_precheck.md`, `output/qa_prerender.jpg`). Render otomatis DIHENTIKAN kalau ada masalah nyata; tumpukan yang disengaja
   masuk `"qa_allow"` di storyboard. Setelah render: QA file akhir (`output/qa_report.md`, `output/qa_sheet.jpg`). Baca sebelum kirim.
7. Animasi 3D (three.js, `lib3d/bm3d.js`, panduan skill `threejs-*` dari cloudai-x/threejs-skills): 1–2 scene 🧊 per video bila kedalaman membantu
   (kosmos, bumi, perjalanan, benda berputar, data). Mode 1 HyperFrames: field `"three": {"preset": ...}` di scene mana pun; mode 4 Lemo native:
   scene `custom` dengan `"code": "lib3d/lemo-scene.js"`; mode Auto memilihnya sesuai topik. Preset: terrain, globe, crystal, galaxy, bars, water.
8. Caption setiap video: 1–3 kalimat + 3–5 hashtag niche, SELALU ditutup `#creatorsearchinsights #videofypシ゚` (ejaan persis).
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

**Gaya explainer, bukan gaya tempel (aturan pemilik, 2026-11-21):** video yang menjelaskan makna/perumpamaan/cara kerja memakai gaya explainer yang digambar (Bang `papan-tulis` default, `infografik-flat`, `sketsa-diagram`, `kartun-cutaway`, Lemo `stick-explainer`), bukan jendela 3D/foto yang ditempel di kartu. Detail di SKILL.md.

**Audio @valsyz7 (aturan pemilik, 2026-11-22): TANPA musik dan TANPA ambience** — selalu `"music": "none", "ambience": "none", "sfx": true`:
hanya VO Cartesia + SFX, untuk semua video berikutnya kecuali pemilik minta musik/ambience.

**Visual @valsyz7 (aturan pemilik, 2026-11-22): TANPA gambar tempel** — jangan menempelkan gambar/foto (FLUX atau lainnya) ke dalam frame,
panel, polaroid, kolase atau jendela. Semua visual digambar kode dalam gaya kit (garis, bentuk, lanskap, siluet, 3D, tipografi).
Pilih gaya yang tidak memakai foto (Lemo native lanskap: paper-lantern, paper-popup, colored-pencil, urban-sketch, watercolor, memphis-diorama;
Bang Motion tanpa gambar: kartun-panggung, explainer-aliran). Gambar AI hanya kalau pemilik memintanya.


Ketika user mengetik `/bang-motion`, SELALU gunakan skill `.claude/skills/bang-motion/SKILL.md` dari repo ini — JANGAN gunakan `anthropic-skills:tiktok-motion-generator`.

Output MP4 disimpan di `output/` (folder ini di-gitignore).
