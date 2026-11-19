# Strategi @valsyz7 — analisis data & playbook (19 Nov 2026)

Sumber: Supermetrics TikTok Organic (`TIKBA`, report `videos`), 121 video (Des 2022 – 19 Nov 2026).
Ulangi analisis ini tiap minggu dengan query yang sama dan perbarui angka di bawah.

## 1. Diagnosis

| Temuan | Angka | Artinya |
|---|---|---|
| Satu hit, sisanya datar | 1 video 46.310 views; 9 video 3–12 rb; ±100 video 150–400 | Algoritma sudah pernah mendorong akun ini — polanya bisa diulang, bukan masalah akun |
| Penonton pergi di detik 10–15 | rata-rata waktu tonton 6–19 s, termasuk di video viral (12,9 s dari 47 s) | 10 detik pertama menentukan segalanya; bagian setelah itu jarang dilihat |
| Completion sangat rendah | 1–5 % di video 50–100 s; 25 % di video 43 s satu pesan (singa); 27 % di drama ibu beli beras | Durasi panjang + banyak poin = ditinggal. Satu pesan + cerita = ditonton sampai habis |
| Share = mesin viral | hit 1.123 share (2,4 % dari views); video lain 0–15 share | Yang dibagikan: rasa bersalah lembut + "ini aku" (nikmat yang baru terasa saat diambil) |
| Fakta sains murni mentok | besi, petrichor, galaksi, hiu, neuroplastisitas: 200–300 views | Fakta tanpa taruhan emosional tidak dibagikan |
| Video pipeline terbaru | ginjal 166, sidik jari 195, tonton rata² 13–15 s, 0 share | Hook bagus di atas kertas, tapi durasi 52–88 s dan CTA belum memicu share |
| Akun tidak konsisten | drama berseri, parfum (keranjang kuning), "lo-gue" motivasi, kajian, sains | Algoritma bingung siapa penontonmu; pengikut dari satu jenis tidak menonton jenis lain |
| Caption & hashtag berantakan | esai 150–250 kata; #Valzsy7 / #Valszy7 / #Valsyz7; nama ustadz; #fyppppp; "Upload Method" | Caption panjang tidak dibaca; tag nama orang lain dan hashtag spam menurunkan kepercayaan |

## 2. Rumus video (berlaku untuk setiap video dari pipeline)

**Durasi 30–45 detik, satu pesan, satu nikmat.** Kalau ada empat kisah, pilih dua atau jadikan seri.

### Hook (0–3 detik) — penasaran sejak frame 0
- Teks hook SUDAH terbaca di frame 0 (tanpa fade-in), ≤ 8 kata di layar, VO mulai ≤ 0,2 s.
- Gerak besar di detik 0–1 (zoom/garis/objek 3D sudah bergerak) — mata menangkap gerak sebelum membaca.
- Pakai salah satu pola yang terbukti, dan ganti pola tiap video:
  1. **Kehilangan** — "Jangan sampai Allah mengambil ___, baru kamu sadar…" (pola hit 46 rb)
  2. **Harga** — "Kalau ___ harus dibayar, kamu sanggup berapa hari?"
  3. **Celah penasaran** — "Ada satu doa yang menyelamatkan Nabi Yunus dari perut ikan. Isinya cuma 9 kata." (angka spesifik + janji jawaban)
  4. **Tuduhan lembut** — "Kamu mungkin sudah 3 kali melewatkan nikmat ini hari ini." (langsung "ini aku")
- Jangan buka dengan salam, nama channel, "tahukah kamu", atau konteks. Mulai dari taruhannya.

### Retensi (3–35 detik)
- **Open loop**: janjikan sesuatu di hook yang baru dibayar di 70 % durasi ("…dan doa ketiga paling pendek").
- **Visual baru tiap 2–3 detik**, sinkron dengan kata yang diucapkan (kit sudah bisa: `K.WORDS` di scene custom, langkah 1-2-3 di `garis-doa.js`, layer 🧊 3D).
- **Pola yang diulang** (jatuh → berdoa → diangkat) supaya penonton menebak dan menunggu — tebakan = betah.
- **Satu angka kontras** yang mengejutkan per video (180 L vs 4 jam cuci darah), digambar besar.
- **Tanpa backsound berisik**; VO jelas, jeda pendek. Kata panjang/molor diperbaiki sebelum render (QA VO).
- Subtitle per kata wajib (banyak yang menonton tanpa suara).

### CTA (5 detik terakhir) — menggerakkan tanpa terasa disuruh
- **Share ke orang spesifik**, bukan "follow": "Kirim ke orang yang sedang di titik terendahnya." / "…yang sering lupa minum."
  Penonton langsung memikirkan satu nama → share terasa seperti kepedulian, bukan permintaan.
- **Loop**: kalimat terakhir menyambung ke hook, supaya tontonan ulang terjadi tanpa sadar (replay ikut dihitung algoritma).
- **Komentar satu kata yang bermakna** hanya sesekali ("tulis nama orang yang kamu ingat"), bukan "MAU/AAMIIN" tiap video.

### Caption & posting
- Caption 1–3 kalimat yang menambah, bukan mengulang VO; kalimat pertama = pertanyaan "ini aku".
- 3–5 hashtag niche: #nikmatallah #syukur #renunganislami + 1–2 topik, lalu SELALU tutup dengan `#creatorsearchinsights #videofypシ゚` (aturan pemilik). Satu ejaan handle saja (#valsyz7) atau tidak sama sekali.
- Tanpa nama ustadz/tokoh lain, tanpa #fyp berulang, tanpa "Upload Method".
- Konsisten niche: "nikmat Allah yang sering kita lupa". Drama berseri & produk ke akun lain (atau hentikan).
- Unggah 1 video/hari di jam yang sama; cek jam terbaik dari data mingguan.

## 3. Target yang diukur (per video, 3 hari setelah unggah)

| Metrik | Sekarang | Target 30 hari |
|---|---|---|
| Rata-rata waktu tonton | 6–15 s | ≥ 18 s (≥ 50 % dari 35 s) |
| Completion rate | 1–5 % | ≥ 20 % |
| Share per 1.000 views | 0–5 | ≥ 15 |
| Views median | ±200 | ≥ 1.000 |

Kalau dua video berturut-turut di bawah target, ubah hook dulu (bukan gaya visual) — hook adalah yang pertama kali diputuskan penonton.
