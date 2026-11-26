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

## Creator Search Insights (screenshot pemilik, 25 Nov 2026) — WAJIB dipakai saat memberi ide konten

**Pertumbuhan mingguan**
| Minggu | Tayangan | Pengikut | Suka |
|---|---|---|---|
| 9–15 Nov | 126K (+38,7K) | 1,03K (+25) | 4,43K (+971) |
| 16–22 Nov | 682K (+556K) | 2,75K (+1,71K) | 51K (+46,6K) |
Lonjakan dari Al-Insyirah "bersama, bukan sesudah" (317K) dan "titik terendah" (169K). Postingan mengungguli 99,5% kreator di pencarian.

**Pencarian, 14 hari:** impresi 2,5K (+501%), tayangan 2,1K (+623%), CTR sampul 85% (+20%), **waktu tonton rata-rata 18,2 s (+14%)**,
engagement 14,2% (+195%). Postingan yang mengikuti topik saran TikTok: 1,1K impresi, 874 tayangan pencarian.
Tayangan hampir semuanya dari FYP; pencarian baru ±2K dari 682K → ruang tumbuh.

**Pelajaran untuk ide konten**
1. Kelemahan utama = retensi: 18,2 s dari video 40–65 s. Setiap ide wajib punya janji di detik 1 yang dibayar bertahap, penanda bab
   di layar ("1/3", "2/4"), jawaban terpenting di sepertiga akhir, pancingan baru tiap ±20 s bila video panjang.
2. CTR sampul 85% → format judul/sampul sekarang sudah tepat, pertahankan.
3. Kata kunci pencarian masuk ke: teks judul di layar, kalimat pertama VO, dan caption.
4. Topik/kata kunci saran TikTok (Dipilih untuk Anda): **Kata kata kehidupan** 20,5K ▲266%, **motivasi dan nasihat Islami** 18,6K naik,
   kata kata hidup motivasi 3,1K, reminder islam 1,8K, video motivasi islami 999 ▲150%, Kata Motivasi Islami 200 ▲100%, Islami quotes 299.
   Hindari "islamic fyp" (pencarian global anjlok ±260K → ±0 sejak 19 Nov) dan "Qoutes/motivationquotes" (umum, bukan Islami).
5. Rumus terbaik: kalimat kehidupan yang relatable → dibedah dengan ayat + hadits + analogi sehari-hari (pola Insyirah) → CTA satu kata.
6. Perbarui bagian ini setiap pemilik mengirim screenshot analitik baru.

## Pembaruan data 26 Nov 2026 (Supermetrics TIKBA `videos`, 138 video + Metricool best time)

| Video | Durasi | Views | Tonton rata² | Share | Simpan | Komentar |
|---|---|---|---|---|---|---|
| Al-Insyirah "bersama, bukan sesudah" (21 Nov) | 48 s | 381.446 | 20,4 s | 9.491 | 10.503 | 160 |
| "Satu kalimat menghapus semua amalnya" (24 Nov) | 207 s | 21.878 | 75,3 s | 1.009 | 1.077 | 177 |
| "Hidupmu berat, iman dikencengin" (25 Nov) | 140 s | 7.138 | 65,7 s | 149 | 147 | 11 |

- Video panjang BERHASIL bila berupa kisah dengan taruhan (amal hilang): tonton rata² 66–75 s.
- Simpan ≥ share di video ayat yang "dibalik" maknanya → format seri "ayat yang sering salah dipahami".
- Fakta sains murni tetap mentok 300–700 views; topik abstrak tanpa taruhan pribadi ±200.
- 2 unggahan/hari: video kedua selalu < 230 views → 1 video/hari.
- Jam terbaik (Metricool, WIB): Rabu–Kamis 10.00, lalu 18.00 dan 12.00; Jumat 10.00; Sabtu–Minggu ±40% lebih lemah.
