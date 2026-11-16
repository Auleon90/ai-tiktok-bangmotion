# Instalasi di Windows 10 + Antigravity (folder `D:\motion-graphic`)

Pipeline video ini berjalan di **Linux**. Di Windows, kita memakai **WSL (Ubuntu)**, yaitu Linux resmi dari Microsoft yang berjalan
di dalam Windows. File project tetap di drive **D:** dan tetap dibuka dari Antigravity seperti biasa.
Agen Antigravity menjalankan perintah lewat `bm.cmd`, yang meneruskannya ke Ubuntu.

Syarat: Windows 10 versi **2004 (build 19041) atau lebih baru**, internet, ruang kosong ±6 GB.
Cek versi Windows: tekan `Win + R`, ketik `winver`, lalu Enter.

---

## Langkah 0: Ekstrak ZIP

Ekstrak `motion-graphic.zip` ke drive D sehingga hasilnya **`D:\motion-graphic\`**. Di dalamnya harus ada `CLAUDE.md`,
`bm.cmd` dan folder `scripts`. Hati-hati: jangan sampai terbentuk `D:\motion-graphic\motion-graphic\`.

## Langkah 1: Pasang WSL + Ubuntu (sekali saja)

1. Buka `D:\motion-graphic\windows\`.
2. **Klik kanan** `1-pasang-wsl.bat`, pilih **Run as administrator**.
3. Setelah selesai, **restart laptop**.
4. Buka **Ubuntu** dari Start Menu dan tunggu sampai selesai. Buat **username** dan **password** (password tidak terlihat saat
   diketik, itu normal). Catat password ini karena akan diminta di Langkah 2.

> Kalau muncul error *"virtualization"*, aktifkan **Virtualization / VT-x / SVM** di BIOS laptop, lalu ulangi.

## Langkah 2: Pasang semua kebutuhan (sekali saja, 15–40 menit)

1. Dobel klik `D:\motion-graphic\windows\2-setup.bat`.
2. Saat diminta, masukkan **password Ubuntu** dari Langkah 1.
3. Tunggu sampai muncul `=== Selesai ===`. Proses ini mengunduh Python, Node.js, ffmpeg, browser render, Manim, dan sampel
   musik ±700 MB.
4. Notepad akan terbuka berisi file **`.env`**. Isi:
   - `CARTESIA_API_KEY=` → API key Cartesia (wajib, untuk suara VO)
   - `CF_ACCOUNT_ID=` dan `CF_API_TOKEN=` → akun Cloudflare Workers AI (opsional, untuk gambar AI FLUX).
     Token dibuat di dash.cloudflare.com, menu *My Profile → API Tokens → Create Token*, template **Workers AI**.

   Simpan, lalu tutup. **Jangan pernah membagikan file `.env`.**

## Langkah 3: Tes (opsional, ±2 menit)

Dobel klik `windows\3-tes.bat`. Kalau berhasil, video contoh `output\final.mp4` (Pythagoras) akan terbuka.

## Langkah 4: Buka di Antigravity

1. Buka **Antigravity**, pilih **File → Open Folder**, lalu pilih **`D:\motion-graphic`**.
2. **Tidak perlu membuat skill atau rule secara manual.** Project ini sudah membawa:
   - `.agent/rules/00-baca-dulu.md`: rule *always on* yang menyuruh agen membaca `CLAUDE.md` dan
     `.claude/skills/bang-motion/SKILL.md` sebelum mengerjakan apa pun, serta menjalankan perintah lewat `bm.cmd`.
   - `.agent/workflows/bang-motion.md`: workflow yang bisa dipanggil dengan mengetik **`/bang-motion`** di chat agen.
   - `AGENTS.md` / `GEMINI.md`: pengingat yang sama untuk agen lain.
3. **Cek bahwa rule terbaca.** Di panel Agent, klik menu **`…` → Customizations** (atau *Rules*). Rule `00-baca-dulu` dan
   workflow `bang-motion` harus muncul di bagian **Workspace**.
   - **Kalau tidak muncul** (versi Antigravity berbeda), buat manual: *Customizations → Rules → + Workspace*, beri nama
     `baca-dulu`, mode **Always On**, lalu salin isi file `.agent/rules/00-baca-dulu.md`. Lakukan hal yang sama untuk workflow
     (*Workflows → + Workspace*, nama `bang-motion`, isi dari `.agent/workflows/bang-motion.md`).
4. **Izin terminal:** di Settings Antigravity, atur *Terminal command auto execution* ke **Auto** (atau setujui setiap
   perintah `bm.cmd` saat diminta). Agen perlu menjalankan banyak perintah.
5. Pilih model agen yang kuat untuk tugas panjang (mis. Gemini Pro atau Claude, kalau tersedia di Antigravity).

## Cara pakai

Ketik di chat agen, misalnya:

```
/bang-motion buat video funfact psikologi tentang efek Dunning-Kruger, kaitkan dengan inspirasi Islam, hook dan CTA kuat
```

Agen akan membuat storyboard, minta persetujuan, menanyakan mode render, menjalankan QA, lalu merender.
Hasilnya ada di **`D:\motion-graphic\output\final.mp4`**.

Perintah manual (di terminal Antigravity / PowerShell, dari folder project):

```
.\bm.cmd python3 scripts/produce.py output/storyboard.json output/final.mp4 --no-render
.\bm.cmd python3 scripts/produce.py output/storyboard.json output/final.mp4 --engine=hyperframes --html=output/hf_index.html
```

## Apakah hasilnya sama dengan versi cloud?

- **Sama:** render, mixer audio (musik otomatis 20 dB di bawah VO), SFX, QA, dan suara Cartesia.
- **Bisa berbeda:** ide, storyboard, dan desain halaman, karena bergantung pada model AI di Antigravity. Gambar FLUX juga selalu
  baru setiap kali dibuat.
- **Kecepatan:** file di drive D diakses Ubuntu lewat `/mnt/d`, jadi sedikit lebih lambat dari cloud. Render HyperFrames ±3–5
  menit, Remotion bisa 30+ menit tergantung laptop.

## Masalah umum

| Gejala | Solusi |
|---|---|
| `'wsl.exe' is not recognized` / WSL belum ada | Ulangi Langkah 1, lalu restart |
| `CARTESIA_API_KEY not set` | Isi `.env` (Langkah 2.4) |
| `quota exhausted` (gambar) | Kuota Cloudflare harian habis; render tanpa gambar atau tunggu reset 07:00 WIB |
| Error `missing deps` / modul tidak ditemukan | Jalankan lagi `windows\2-setup.bat` |
| Agen menjalankan `python`/`npm` Windows | Ingatkan: "semua perintah lewat `.\bm.cmd`, baca rule 00-baca-dulu" |
| Huruf aneh di halaman video | `.\bm.cmd sudo apt-get install -y fonts-jetbrains-mono` |
