# Mode Storyboard: "Contoh Analogi Inspirasi Kehidupan"

Format video perumpamaan singkat, tajam, langsung kena di hati — dipelajari dari video referensi pemilik
(28 Nov 2026, akun lain, ±27 detik, siluet di atas latar kertas abu-abu).

## Bedah video referensi ("Dua lubang & pohon tumbang")

| Detik | Yang terlihat | Fungsi emosional |
|---|---|---|
| 0–4 | Dua orang terjebak di dua lubang tanah yang sama, dipisah batang pohon. Keduanya berdoa: "Ya Allah, bantulah saya" (balon biru & merah) | Identifikasi: "ini aku" — semua pernah terjebak dan berdoa |
| 4–7 | Pohon justru tumbang/patah, dahannya jatuh menimpa kedua lubang | Twist pahit: doa seolah dijawab dengan musibah |
| 7–11 | Merah: "Ya Allah, musibah apalagi ini?… saya ngga sanggup" lalu meringkuk. Biru: "Apa yang bisa saya lakukan dengan dahan ini?" | Kontras dua respons atas ujian yang SAMA |
| 11–19 | Biru mematahkan dahan, merangkai tangga, memanjat | Harapan bekerja; tanpa kata, hanya aksi |
| 19–26 | Biru berdiri di atas, menoleh ke lubang merah. Teks: QS. Al-Baqarah 286 | Pukulan akhir + dalil sebagai penutup, bukan pembuka |

Kenapa kena:
1. **Tanpa narasi panjang** — cerita dibawa gambar; teks hanya 3–4 balon pendek. Penonton "menemukan" maknanya sendiri.
2. **Dua tokoh, satu ujian, dua respons** — struktur kontras paling mudah dipahami dalam 3 detik.
3. **Twist di tengah** — jawaban doa datang dalam bentuk yang terlihat seperti musibah.
4. **Dalil di akhir** — ayat menjadi "kunci jawaban" setelah emosi terbangun, bukan ceramah di awal.
5. **Visual minimal** — siluet tanpa wajah di latar polos: universal, siapa pun bisa jadi tokohnya.

## Resep mode (untuk ide baru — ide & visual dicari sendiri, referensi hanya contoh)

- **Durasi** 25–45 detik, 4–6 scene. Satu perumpamaan saja per video. (Tetap "dalam, bukan receh": kedalaman ada di makna, bukan durasi.)
- **Struktur 5 ketukan:** `situasi "ini aku"` → `ujian/twist` → `kontras dua respons` (atau satu benda yang berubah makna)
  → `hasil` → `kunci: dalil + 1 kalimat sains/fakta`.
- **Teks layar:** balon/kalimat ≤ 8 kata. VO boleh tipis (bisikan/kalimat pendek) atau hanya di scene kunci; scene aksi boleh diam + SFX.
  Bila VO dipakai: kalimat pendek, jeda panjang (`gap_after_ms` 600–1200).
- **Visual:** siluet tanpa wajah digambar kode (Lemo `paper-lantern`, `paper-popup`, `watercolor`, Bang `kartun-panggung`/`explainer-aliran`),
  scene `custom` per video (`output/custom/<nama>.js`). Warna pembeda dua tokoh (mis. biru = harap, merah = putus asa). Tanpa gambar tempel.
- **Dalil & sumber:** setiap analogi WAJIB ditopang minimal satu sumber yang bisa dipertanggungjawabkan (ayat / hadis sahih-hasan /
  studi sains), dicek ulang redaksinya, dan masuk blok "📚 Sumber:" di caption.
- **Thumbnail frame 0:** momen paling "berbicara" (mis. dua orang di dua lubang + judul hook "DOA YANG SAMA, NASIB BERBEDA").
- **Audio:** default pemilik tetap berlaku — tanpa musik, tanpa ambience, SFX on (dahan patah, langkah, kayu diikat).

## Bank ide (contoh — kembangkan/temukan yang baru)

| # | Analogi (visual) | Twist / kontras | Kunci dalil | Tambahan sains / fakta |
|---|---|---|---|---|
| 1 | Dua orang di dua lubang, pohon tumbang (referensi) | Dahan = musibah bagi satu, tangga bagi yang lain | QS. Al-Baqarah 286; QS. Al-Insyirah 5–6 | — |
| 2 | Pensil diraut | Makin diraut makin tajam, makin pendek tapi tulisannya makin jelas | QS. Al-Ankabut 2–3 (diuji untuk dibuktikan) | — |
| 3 | Kupu-kupu & gunting | Seseorang "menolong" membuka kepompong → sayapnya lemah, tak bisa terbang | QS. Al-Baqarah 214 | Perjuangan keluar kepompong memompa cairan ke sayap (hemolimf) |
| 4 | Pohon di tebing diterpa angin | Pohon yang sering diguncang akarnya paling dalam | QS. Ibrahim 24–25 (kalimat thayyibah = pohon baik) | Thigmomorfogenesis: batang yang sering digoyang angin tumbuh lebih kokoh (Jaffe, 1973) |
| 5 | Gelas air keruh diaduk | Didiamkan → endapan turun, air jernih: hati perlu diam (zikir) | QS. Ar-Ra'd 28 | Sedimentasi |
| 6 | Dua bejana: satu bocor sedikit-sedikit | Dosa kecil yang dibiarkan menggenang jadi danau | HR. Ahmad no. 3818 (dosa kecil ibarat ranting yang dikumpulkan jadi api), sahih | — |
| 7 | Busur & anak panah | Ditarik ke BELAKANG supaya melesat jauh ke depan | QS. Al-Insyirah 5–6 | Energi potensial pegas busur |
| 8 | Bambu Cina 4 tahun tak terlihat tumbuh | Akar dulu, lalu meninggi puluhan meter | HR. Bukhari 6464 & Muslim 783 (amal paling dicintai = kontinu walau sedikit) | Bambu Phyllostachys bisa tumbuh ±1 m/hari setelah sistem rizom matang |
| 9 | Mutiara di dalam kerang | Butir pasir yang menyakitkan dibungkus lapis demi lapis | HR. Bukhari 5641 & Muslim 2573 (tiada lelah/sakit menimpa mukmin melainkan menghapus dosanya) | Nacre: lapisan aragonit yang disekresi untuk melindungi diri dari iritan |
| 10 | Lilin & cermin | Satu orang menyalakan lilin, yang lain hanya mengeluh gelap | HR. Muslim 1017 (siapa memulai sunnah yang baik, dapat pahalanya & pahala pengikutnya) | — |
| 11 | Kaktus di gurun | Tidak minta hujan setiap hari — menyimpan saat hujan datang | QS. Ibrahim 7 (syukur → ditambah) | Kaktus menyimpan air di jaringan sukulen, stomata membuka malam hari (fotosintesis CAM) |
| 12 | Kompas yang diguncang | Jarum bergoyang tapi selalu kembali menunjuk utara | QS. Al-A'raf 201 (bila diganggu setan, mereka ingat Allah lalu melihat kebenaran) | Medan magnet bumi |

Sebelum dipakai: cek ulang redaksi & nomor hadis/ayat, dan catat ide yang sudah dipakai di `content/topics_used.md`.
