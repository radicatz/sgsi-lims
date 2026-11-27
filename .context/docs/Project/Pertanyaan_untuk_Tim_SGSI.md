# Pertanyaan untuk Tim SGSI

Disusun 27 November 2026, untuk aplikasi SGSI LIMS versi 1.

Bapak/Ibu yang terhormat,

Aplikasi sudah selesai dibangun sampai tahap akhir. Supaya bisa dipakai di lab (go-live), kami butuh jawaban dan beberapa file dari tim SGSI. Dokumen ini berisi semua pertanyaan yang masih terbuka, dikelompokkan menurut siapa yang paling tepat menjawab.

## Cara memakai dokumen ini

- Jawab dengan kata-kata biasa. Tidak perlu formal.
- Kalau jawabannya berupa file (misalnya daftar Excel), kirim apa adanya. Tidak perlu dirapikan.
- Kalau belum bisa menjawab, tidak apa-apa. Setiap pertanyaan punya bagian **"Kalau belum dijawab"**: itu pilihan yang kami pakai sementara, supaya pekerjaan tetap jalan. Jawaban Bapak/Ibu bisa mengubahnya kapan saja.
- Pertanyaan bertanda **(Wajib)** harus dijawab sebelum go-live. Bertanda **(Segera)** perlu dijawab lebih dulu karena pekerjaan lain menunggu.

## Istilah yang dipakai

| Istilah | Artinya |
| --- | --- |
| **RoA** | Report of Analysis: laporan hasil analisis internal per batch |
| **CoA** | Certificate of Analysis: sertifikat hasil analisis untuk klien |
| **Batch** | Kelompok sampel yang dianalisis bersama |
| **Job order** | Permintaan kerja dari klien |
| **CSO** | Customer Service Officer |
| **Go-live** | Hari aplikasi mulai dipakai lab untuk pekerjaan sungguhan |
| **UAT** | Uji coba oleh staf lab di HP dan tablet mereka sendiri sebelum go-live |

## Ringkasan

| No. | Topik | Yang menjawab | Prioritas |
| --- | --- | --- | --- |
| A1 sampai A7 | Tempat aplikasi berjalan, alamat web, email, akun | Tim IT SGSI | Segera |
| B1 sampai B5 | Daftar klien, drill hole, staf, volume sampel | Admin lab dan geologi | Wajib |
| C1 sampai C8 | Metode, perhitungan, jenis uji | Manajer mutu atau kepala lab | Wajib |
| D1 sampai D5 | Kode sampel, nomor batch, penerimaan, label | CSO, tim Preparation, Pak Hans | Wajib |
| E1 sampai E8 | Isi dan tanda tangan CoA dan RoA | Manajer lab dan Lab admin | Wajib |
| F1 | Pemberitahuan di aplikasi | Manajer lab | Wajib |
| G1 dan G2 | Privasi dan data pribadi | Manajer lab dan IT | Wajib |
| H1 dan H2 | Uji coba, pelatihan, tanggal go-live | Manajer lab | Wajib |
| I1 sampai I3 | Hal yang boleh dijawab nanti | Berbagai pihak | Boleh nanti |

---

## A. Tempat aplikasi berjalan (Tim IT SGSI)

Bagian ini paling mendesak. Server, alamat web, dan pengiriman email tidak bisa disiapkan sebelum pertanyaan A1 sampai A3 dijawab.

### A1. Aplikasi dijalankan di mana? (Segera)

**Pertanyaan:** Aplikasi bisa berjalan di cloud (server milik penyedia layanan, di luar kantor) atau di server milik SGSI sendiri. Mana yang SGSI inginkan? Apakah ada aturan bahwa data harus disimpan di Indonesia?

**Kenapa kami tanya:** Ini menentukan di mana data disimpan dan siapa yang merawat server. Aturan perlindungan data pribadi (UU PDP) juga bisa memengaruhi pilihannya.

**Jawaban berupa:** "Cloud", "server sendiri", atau "belum tahu, ini aturan yang kami punya: ...".

**Kalau belum dijawab:** Kami siapkan di cloud (database di Singapura, server aplikasi di VPS dekat lab). Untuk uji coba (staging) ini sudah cukup, tapi go-live menunggu jawaban Bapak/Ibu.

### A2. Alamat web dan akses domain (Segera)

SGSI sudah punya domain **sgsi-lab.com** di Niagahoster, dan aksesnya sudah kami terima (27 November 2026). Tersisa pertanyaan tentang paket hosting.

**Pertanyaan:**
1. Boleh kami membuat alamat turunan untuk aplikasi, yaitu `lims.sgsi-lab.com`?
2. Website sgsi-lab.com memakai paket Single Web Hosting (hosting bersama) di Niagahoster/Hostinger, jadi tidak bisa menjalankan LIMS. Apakah SGSI setuju menyewa satu VPS baru (kira-kira Rp150.000 sampai Rp235.000 per bulan, atas nama akun SGSI)?

**Kenapa kami tanya:** Aplikasi LIMS butuh server yang bisa menjalankan program khusus (Docker). Hosting website biasa umumnya tidak bisa, sehingga LIMS biasanya ditempatkan di server terpisah dari website. Alamat turunan `lims.sgsi-lab.com` cukup diarahkan ke server LIMS tanpa mengganggu website.

**Jawaban berupa:** "Boleh", nama atau kontak orang yang mengatur DNS, dan keterangan tempat website berjalan.

**Kalau belum dijawab:** Uji coba memakai alamat sementara. Go-live menunggu akses DNS.

### A3. Email pengirim (Segera)

Email SGSI memakai Google Workspace, dan akun `noreply@sgsi-lab.com` sudah dibuat (27 November 2026). Tersisa pengaturan teknisnya.

**Pertanyaan:**
1. Siapa admin Google Workspace-nya, untuk membuat kata sandi aplikasi?
2. Bisakah admin mengaktifkan pengiriman email lewat akun itu dari aplikasi (kata sandi khusus aplikasi), dan mengaktifkan pengaman email DKIM untuk domain di pengaturan admin Google? Pengaman ini membuat email dari aplikasi tidak masuk spam.

**Kenapa kami tanya:** Aplikasi mengirim email undangan akun baru dan email reset password. Kalau tidak diatur, email itu bisa masuk spam dan staf tidak bisa membuat password pertama mereka.

**Jawaban berupa:** Konfirmasi jenis email, nama atau kontak admin Google Workspace, dan akun `noreply` yang sudah dibuat.

**Kalau belum dijawab:** Kami memakai layanan pengirim email lewat domain SGSI. Sampai itu siap, link undangan ditampilkan kepada Superadmin untuk diteruskan sendiri.

### A4. Cara login staf (Wajib)

**Pertanyaan:** Apakah staf cukup login dengan email dan password yang dibuat di aplikasi? Atau SGSI mewajibkan login dengan akun perusahaan (Microsoft atau Google)?

**Kenapa kami tanya:** Versi 1 memakai email dan password. Kalau SGSI mewajibkan akun perusahaan, itu menjadi pekerjaan tambahan.

**Jawaban berupa:** "Email dan password cukup", atau "wajib akun perusahaan".

**Kalau belum dijawab:** Email dan password. Akun dikunci setelah 5 kali salah dalam 15 menit, dan link undangan berlaku 7 hari.

### A5. Internet dan perangkat di lab (Wajib)

**Pertanyaan:**
1. Kira-kira berapa kecepatan internet di lab? Apakah stabil, atau sering putus?
2. Staf akan memakai HP atau tablet apa untuk aplikasi ini (merek dan jenisnya)?

**Kenapa kami tanya:** Aplikasi dipakai di tiga ukuran layar (komputer, tablet, HP). Kami perlu tahu kondisi sebenarnya untuk mengujinya dengan tepat, dan untuk memastikan data tidak hilang kalau sinyal putus sebentar.

**Jawaban berupa:** Perkiraan kecepatan dalam Mbps, dan daftar perangkat.

**Kalau belum dijawab:** Kami menguji dengan kondisi internet biasa dan koneksi yang diputus di tengah penyimpanan.

### A6. Akun atas nama siapa? (Wajib)

**Pertanyaan:** Akun layanan yang dipakai aplikasi (database, server, domain, email, GitHub) sebaiknya atas nama perusahaan atau pemilik proyek, dengan satu administrator kedua. Siapa orangnya?

**Kenapa kami tanya:** Kalau akun atas nama satu orang pribadi, akun itu sulit dipulihkan saat orang tersebut pindah atau lupa kata sandi.

**Jawaban berupa:** Nama dan email pemilik akun, dan nama administrator kedua.

**Kalau belum dijawab:** Akun dipegang pemilik proyek, dan kami mencatat siapa yang belum ada penggantinya.

### A7. Tempat menyimpan cadangan data (Wajib)

**Pertanyaan:** Aplikasi akan membuat salinan cadangan setiap malam. Cadangan itu sebaiknya disimpan di tempat yang berbeda dari server aplikasi. Apakah SGSI punya tempat penyimpanan sendiri (NAS, drive kantor, atau cloud)? Atau SGSI lebih suka memakai penyimpanan cloud yang kami sediakan?

**Kenapa kami tanya:** Cadangan yang disimpan di server yang sama akan ikut hilang kalau server rusak.

**Jawaban berupa:** "Pakai milik SGSI: ...", atau "silakan pakai penyimpanan cloud".

**Kalau belum dijawab:** Penyimpanan cloud terpisah, disimpan 30 hari, dan satu salinan tiap awal bulan disimpan setahun.

---

## B. Data master dan staf (Admin lab dan geologi)

### B1. Daftar klien dan kontak (Wajib)

**Pertanyaan:** Mohon kirim daftar klien dalam Excel. Untuk setiap klien: nama perusahaan, alamat, alamat penagihan, dan nama kontak (jabatan, telepon, email).

**Kenapa kami tanya:** Daftar ini dimuat sekali ke aplikasi, supaya CSO tidak mengetik ulang saat membuat job order.

**Jawaban berupa:** File Excel apa adanya.

**Kalau belum dijawab:** Aplikasi memakai data contoh. Data asli dimuat kemudian.

### B2. Daftar drill hole, seam, dan litologi (Wajib)

**Pertanyaan:** Mohon kirim daftar drill hole (beserta perusahaannya), daftar seam, dan daftar litologi dalam Excel.

**Kenapa kami tanya:** CSO dan analis memilih nama-nama ini dari daftar, supaya penulisannya seragam dan tidak ada salah ketik.

**Jawaban berupa:** File Excel apa adanya.

**Kalau belum dijawab:** Data contoh dari prototipe.

### B3. Daftar staf dan perannya (Wajib)

**Pertanyaan:**
1. Mohon kirim daftar staf yang akan memakai aplikasi: nama, email, dan tugasnya.
2. Aplikasi punya tujuh peran: CSO, Lab admin, Preparation, Analis, Supervisor, Manager, dan Superadmin. Untuk tiap orang, peran mana yang cocok?
3. Bolehkah satu orang memegang lebih dari satu peran? Misalnya satu orang yang menjadi Preparation sekaligus analis.

**Kenapa kami tanya:** Peran menentukan apa yang boleh dilihat dan dilakukan seseorang, misalnya hanya Manager yang menandatangani CoA.

**Jawaban berupa:** Daftar nama, email, dan peran. Jawaban "ya" atau "tidak" untuk peran ganda.

**Kalau belum dijawab:** Akun contoh di tahap uji coba. Peran ganda tetap diperbolehkan.

### B4. Jumlah sampel (Wajib)

**Pertanyaan:** Kira-kira berapa sampel yang diterima lab dalam satu bulan biasa? Dan berapa sampel terbanyak yang pernah ada dalam satu batch?

**Kenapa kami tanya:** Kami menguji kecepatan aplikasi dengan jumlah data sebesar pekerjaan sebenarnya.

**Jawaban berupa:** Dua angka perkiraan.

**Kalau belum dijawab:** Kami memakai 400 sampel per batch dan sekitar 20.000 sampel per tahun. Angka tahunan itu perkiraan kami, bukan dari SGSI.

### B5. Data lama dari Excel (Wajib)

**Pertanyaan:** Apakah setuju bahwa job order lama dari Excel **tidak** dimasukkan ke aplikasi, dan job order baru mulai dicatat di aplikasi sejak hari go-live?

**Kenapa kami tanya:** Memasukkan data lama menambah pekerjaan besar, dan fitur impornya belum dibuat.

**Jawaban berupa:** "Setuju", atau "data lama perlu dimasukkan, yaitu: ...".

**Kalau belum dijawab:** Aplikasi mulai dengan data kosong, hanya daftar klien, metode, dan staf.

---

## C. Metode dan perhitungan (Manajer mutu atau kepala lab)

### C1. Daftar metode per parameter (Wajib)

**Pertanyaan:** Untuk setiap parameter yang diuji, mohon kirim:
- standar yang dipakai (ASTM, ISO, atau GB/T) dan tahun edisinya,
- repeatability (r) dan reproducibility (R),
- batas deteksi (detection limit).

**Kenapa kami tanya:** Informasi ini tercetak di laporan dan dipakai aplikasi untuk memeriksa apakah dua hasil uji masih selisih dalam batas wajar.

**Jawaban berupa:** Tabel atau Excel, atau daftar metode resmi lab (misalnya dari dokumen mutu).

**Kalau belum dijawab:** Aplikasi memakai nilai bawaan dan mencetaknya apa adanya. Nilai itu bisa belum sama dengan yang dipakai lab.

### C2. Parameter "Form of Sulphur" dan "Metal in Ash" (Wajib)

**Pertanyaan:** Parameter apa saja yang ada di dua tab ini? Untuk tiap parameter: namanya, satuannya, dan basisnya (misalnya adb atau db).

**Kenapa kami tanya:** Kami hanya tahu nama kedua tab dari SIM Lab, belum tahu isinya.

**Jawaban berupa:** Daftar parameter, atau foto atau contoh form dari lab.

**Kalau belum dijawab:** Dua tab ini dikosongkan di aplikasi sampai daftarnya ada.

### C3. Net Calorific Value (Net CV): memakai standar apa? (Wajib)

**Pertanyaan:** Net CV dilaporkan mengikuti standar mana: ISO 1928, ASTM D5865, atau GB/T 213?

**Kenapa kami tanya:** Rumus perhitungannya sedikit berbeda untuk tiap standar.

**Jawaban berupa:** Nama standarnya.

**Kalau belum dijawab:** Rumus mengikuti standar yang dipilih di job order. Hidrogen diperkirakan dengan cara Seyler, sesuai jawaban sebelumnya. Net CV dicetak hanya kalau dipilih di job order.

### C4. Pembulatan Fixed Carbon pada basis AR (Wajib)

**Pertanyaan:** Fixed Carbon (FC) dihitung dari selisih: 100 dikurangi IM, Ash, dan VM. Pada basis AR, mana cara yang dipakai lab?
- (a) hitung dulu dengan angka penuh, baru dibulatkan, atau
- (b) bulatkan dulu tiap angka, lalu hitung selisihnya.

Contoh: aplikasi menghasilkan **32,99**, sedangkan dokumen kertas lab menampilkan **33,00**.

**Kenapa kami tanya:** Selisih 0,01 seperti ini bisa terlihat oleh klien. Kami ingin angkanya sama persis dengan dokumen lab.

**Jawaban berupa:** "(a)" atau "(b)", atau cara lain yang dipakai.

**Kalau belum dijawab:** Aplikasi menghitung selisih pada tiap basis dengan angka penuh.

### C5. Uji batu bara kokas (Wajib)

**Pertanyaan:** Apakah CSR/CRI, G index, dan Y value dikerjakan sendiri oleh lab SGSI, atau dikirim ke lab lain (subkontrak)?

**Kenapa kami tanya:** Aplikasi menandai uji tersebut "subkontrak" supaya CSO tidak menjanjikan hal yang tidak dikerjakan di lab.

**Jawaban berupa:** Untuk tiap uji: "dikerjakan sendiri" atau "subkontrak".

**Kalau belum dijawab:** CSR/CRI ditandai "subkontrak". Uji lain tampil sebagai uji biasa.

### C6. Jenis sampel (Wajib)

**Pertanyaan:**
1. Jenis sampel apa saja yang diterima lab? Aplikasi sekarang mengenal: Exploration cores, Shipment, Stockpile, dan Channel samples. Apakah itu sudah benar dan lengkap?
2. Apakah sampel produksi dan stockpile benar-benar dikerjakan di lab ini? Kalau ya, apa kodenya dan dari lokasi mana?

**Kenapa kami tanya:** Jenis sampel dipakai di pilihan job order dan di grafik dashboard.

**Jawaban berupa:** Daftar jenis sampel yang benar.

**Kalau belum dijawab:** Empat jenis di atas.

### C7. Target waktu pengerjaan (Wajib)

**Pertanyaan:** Berapa hari target penyelesaian untuk tiap paket layanan lab (misalnya paket Basic dan Full)? Dihitung hari kerja atau hari kalender?

**Kenapa kami tanya:** Dashboard memberi peringatan kalau pekerjaan hampir melewati target. Tanggal selesai yang disarankan di job order juga dihitung dari angka ini.

**Jawaban berupa:** Daftar layanan dan jumlah harinya.

**Kalau belum dijawab:** Basic 5 hari dan Full 10 hari.

### C8. Analisis cepat (Boleh nanti)

**Pertanyaan:** Untuk analisis cepat (rapid analysis) di luar pengiriman kapal: parameter apa saja yang diuji, dan berapa target waktunya?

**Jawaban berupa:** Daftar parameter dan target jam atau hari.

**Kalau belum dijawab:** Tidak ada fitur khusus analisis cepat di versi 1.

---

## D. Penerimaan sampel, kode, dan label (CSO, tim Preparation, Pak Hans)

### D1. Konfirmasi format kode sampel (Wajib)

Format kode ini berasal dari penjelasan Pak Hans. Enam detail di bawah kami putuskan sementara dengan pilihan paling masuk akal, dan **belum dikonfirmasi lab**. Mohon dicek.

Kode sampel dibuat otomatis oleh aplikasi dengan bentuk **`SG.YYMMDD.CCC.BB.NNN`**, contoh `SG.260901.001.RI.001`. Bagian sampel dari kode itu, ditambah nomor lot, menjadi kode pendek, contoh `001.RI.001.Lot01`.

| No. | Pertanyaan | Yang kami pakai sekarang |
| --- | --- | --- |
| 1 | Tanggal di kode (YYMMDD) adalah **tanggal sampel diterima** di lab, bukan tanggal sampel diambil. Benar? | Tanggal diterima. Tanggal pengambilan boleh diisi terpisah |
| 2 | Nomor urut (NNN) dihitung **per perusahaan, per hari**, dan mulai lagi dari 001 setiap hari. Benar? Kalau satu perusahaan mengirim lebih dari 999 sampel dalam sehari, apakah perlu diperlebar? | 001 sampai 999 per hari. Setelah 999, aplikasi menolak dan admin harus memperlebar |
| 3 | Kode cabang (BB) hanya **RI** (Rapak Indah). Apakah ada cabang lain yang menerima sampel? Kalau ada, apa kodenya? | Hanya RI |
| 4 | Kode perusahaan (CCC) 3 angka diberikan **otomatis oleh aplikasi** berurutan saat klien dibuat. Setuju? Atau lab sudah punya kode perusahaan sendiri? | Otomatis. Superadmin bisa mengubahnya sampai sampel pertama klien diterima |
| 5 | Nomor lot selalu **Lot01** kecuali tim Preparation mengubahnya saat penerimaan. Benar? | Lot01 |
| 6 | **Referensi klien** (nama sampel menurut klien) **tidak dicetak** di RoA dan CoA, hanya ada di aplikasi. Benar? | Tidak dicetak |

**Jawaban berupa:** "Benar" atau koreksi per nomor.

**Kalau belum dijawab:** Kolom paling kanan.

### D2. Format nomor batch dan nomor job order (Wajib)

**Pertanyaan:**
1. Bagaimana lab menulis nomor batch? Aplikasi memakai `B-2026-0001` (huruf B, tahun, nomor urut), dan nomor itu tidak boleh sama dengan batch lain di lab.
2. Nomor job order sekarang `JO-2026-0001`. Apakah nomor job order diberikan oleh sistem lain (misalnya sistem klien atau induk perusahaan) yang harus dipakai?

**Kenapa kami tanya:** Nomor ini tercetak di label dan laporan, jadi harus sesuai kebiasaan lab.

**Jawaban berupa:** Contoh nomor batch dan job order yang lab pakai sekarang.

**Kalau belum dijawab:** Format di atas.

### D3. Pilihan isian di aplikasi (Wajib)

**Pertanyaan:** Mohon cek apakah pilihan berikut sudah sesuai dengan kebiasaan lab. Tambah, hapus, atau ganti kata yang kurang tepat.
- **Kondisi sampel saat diterima:** Good, Damaged, Wet, Short, No tag.
- **Alasan menahan sampel (hold):** Damaged, Insufficient, Client request, Other.
- **Cara mengirim CoA ke klien:** Hard copy, Email, WhatsApp, Other.

**Kenapa kami tanya:** Ini tampil sebagai pilihan di layar, jadi harus sama dengan istilah yang lab pakai.

**Jawaban berupa:** "Sudah sesuai" atau daftar yang benar.

**Kalau belum dijawab:** Pilihan di atas.

### D4. Sampel yang datang bertahap (Wajib)

**Pertanyaan:** Seberapa sering sampel dari satu job order datang tidak sekaligus, misalnya sebagian dulu dan sisanya menyusul? Apa yang dilakukan lab sekarang kalau ada sampel yang belum datang saat batch sudah mau mulai dikerjakan?

**Kenapa kami tanya:** Aplikasi mengeluarkan sampel yang belum datang dari batch, lalu menandainya "Awaiting arrival". Kami ingin memastikan cara itu cocok.

**Jawaban berupa:** Perkiraan (jarang, kadang, sering) dan cara yang dipakai sekarang.

**Kalau belum dijawab:** Sampel yang belum datang keluar dari batch saat Start Preparation dan masuk batch baru setelah datang.

### D5. Printer dan ukuran label (Wajib)

**Pertanyaan:** Printer label apa yang dipakai atau akan dibeli (merek dan tipe), dan berapa ukuran labelnya?

**Kenapa kami tanya:** Label berisi kode sampel dan barcode. Ukurannya harus pas.

**Jawaban berupa:** Merek, tipe, dan ukuran label (misalnya 50 x 25 mm).

**Kalau belum dijawab:** Aplikasi membuat lembar label dalam PDF yang dicetak dari browser.

---

## E. CoA dan RoA (Manajer lab dan Lab admin)

### E1. Siapa yang boleh menandatangani CoA? (Wajib)

**Pertanyaan:** Sudah dijawab bahwa Laboratory Manager yang menandatangani CoA. Pertanyaan lanjutan:
1. Apakah Supervisor boleh menandatangani sendiri tanpa Manager, atau harus selalu Manager?
2. Kalau Manager meminta orang lain menandatangani, bagaimana lab ingin mengontrolnya? Di aplikasi, yang menandatangani adalah orang yang sedang login (tanda tangan tidak bisa dipinjamkan). Mendelegasikan berarti mengganti nama penandatangan di job order, dan setiap penggantian tercatat.

**Kenapa kami tanya:** Lab sendiri bertanya apakah pendelegasian bermasalah dan bagaimana cara mengontrolnya.

**Jawaban berupa:** Aturan siapa boleh menandatangani, beserta gelar dan jabatan yang dicetak.

**Kalau belum dijawab:** Manager menandatangani. Supervisor boleh menandatangani "atas nama" kalau namanya dipilih di job order.

### E2. Apakah tanda tangan pengganti memakai stempel lab? (Wajib)

**Pertanyaan:** Kalau CoA ditandatangani oleh pengganti Manager, apakah stempel lab tetap dicetak?

**Jawaban berupa:** "Ya" atau "tidak".

**Kalau belum dijawab:** Ya. Stempel menandakan lab, dan nama penandatangan tetap tercetak.

### E3. Gambar tanda tangan dan stempel (Wajib)

**Pertanyaan:** Mohon kirim gambar tanda tangan setiap orang yang boleh menandatangani CoA, dan gambar stempel lab. Format PNG dengan latar belakang transparan.

**Kenapa kami tanya:** Gambar yang ada sekarang hanya contoh dan harus diganti sebelum go-live. Setiap orang sebaiknya mengunggah tanda tangannya sendiri.

**Jawaban berupa:** File PNG, atau konfirmasi bahwa setiap penandatangan mengunggahnya sendiri lewat aplikasi.

**Kalau belum dijawab:** Gambar contoh, yang tidak boleh dipakai pada dokumen sungguhan.

### E4. Kode form, revisi, dan kalimat syarat (Wajib)

**Pertanyaan:** Apa kode form dan nomor revisi resmi untuk CoA dan untuk RoA? Dan apa kalimat persis untuk bagian syarat dan ketentuan di bawah CoA?

**Kenapa kami tanya:** Kode yang ada sekarang (`FM-LAB-014 rev 1` untuk CoA dan `FM-LAB-021` untuk RoA) hanya contoh.

**Jawaban berupa:** Kode form dan revisi, dan teks syarat dan ketentuan.

**Kalau belum dijawab:** Kode contoh dan kalimat bawaan.

### E5. Penomoran CoA dan RoA (Wajib)

**Pertanyaan:** Apakah lab punya aturan penomoran sendiri untuk CoA dan RoA?

**Kenapa kami tanya:** Aplikasi memberi nomor CoA dengan bentuk `CoA-{nomor job order}-{revisi}`.

**Jawaban berupa:** Contoh nomor CoA dan RoA yang dipakai sekarang.

**Kalau belum dijawab:** Format bawaan di atas.

### E6. Isi RoA (Wajib)

**Pertanyaan:** Mohon cek tiga hal pada RoA yang dibuat aplikasi:
1. **Date Tested** diisi dengan tanggal nilai pertama sampai tanggal nilai terakhir yang dimasukkan analis. Benar?
2. **Reference order** diisi dengan referensi klien dari job order. Benar?
3. Garis tanda tangan di bawah diberi tulisan **"Laboratory Supervisor"**. Benar?

**Jawaban berupa:** "Benar" atau koreksi per nomor.

**Kalau belum dijawab:** Seperti di atas.

### E7. Tanda tangan elektronik bersertifikat (Wajib)

**Pertanyaan:** Apakah ada klien atau badan akreditasi (KAN) yang mensyaratkan tanda tangan elektronik bersertifikat dari penyelenggara resmi (PSrE)?

**Kenapa kami tanya:** Tanda tangan di aplikasi sekarang berupa gambar tanda tangan dan penandatangan memasukkan password. Itu belum sama dengan tanda tangan elektronik bersertifikat. Kalau diwajibkan, perlu pekerjaan tambahan.

**Jawaban berupa:** "Tidak ada yang mensyaratkan", atau nama klien atau badan yang mensyaratkannya.

**Kalau belum dijawab:** Tanda tangan berupa gambar, dengan kontrol seperti di E1.

### E8. Contoh dokumen nyata (Wajib)

**Pertanyaan:** Mohon kirim:
1. Satu job order nyata sebagaimana CSO menerimanya sekarang (surat penawaran, PO, atau email), beserta CoA yang dikirim untuk job order itu.
2. Satu batch yang sudah selesai, beserta RoA yang sudah ditandatangani.
3. Template CoA yang dipakai sekarang (logo, kalimat, susunan).

**Kenapa kami tanya:** Kami mencocokkan angka dan tampilan aplikasi dengan dokumen lab, sampai sama persis. Sejauh ini kami hanya punya contoh dari lab lain.

**Jawaban berupa:** File PDF atau foto. Data klien boleh dikaburkan.

**Kalau belum dijawab:** Aplikasi mengikuti contoh yang ada. Kecocokan tampilan baru bisa diperiksa setelah job order nyata pertama.

---

## F. Pemberitahuan di aplikasi

### F1. Siapa diberi tahu tentang apa? (Wajib)

**Pertanyaan:** Aplikasi menampilkan pemberitahuan di dalam aplikasi, misalnya "Batch siap diterima", "Analisis selesai", dan "CoA siap ditandatangani". Siapa yang perlu diberi tahu untuk setiap kejadian? Adakah kejadian lain yang perlu diberi tahu?

**Kenapa kami tanya:** Pemberitahuan harus sampai ke orang yang tepat, dan tidak mengganggu orang yang tidak perlu.

**Jawaban berupa:** Daftar kejadian dan nama peran penerimanya.

**Kalau belum dijawab:** Daftar kejadian yang sudah dirancang (N1 sampai N10). Pemberitahuan lewat email tidak ada di versi 1.

---

## G. Privasi dan data pribadi (Manajer lab dan IT)

### G1. Teks Privasi di halaman login (Wajib)

**Pertanyaan:** Halaman login punya tautan **Privacy**. Isinya masih **draf** dan belum dikonfirmasi lab. Isinya: aplikasi menyimpan data staf dan kontak klien, log kegiatan (audit log) disimpan tanpa batas waktu, mengacu pada UU PDP No. 27 Tahun 2022, dan menyebut siapa yang dihubungi untuk pertanyaan data pribadi. Mohon dibaca, lalu:
1. Apakah isinya benar dan boleh dipakai?
2. Siapa nama dan email yang boleh dicantumkan sebagai kontak untuk pertanyaan data pribadi?

**Jawaban berupa:** "Boleh" atau teks perbaikan, ditambah nama dan email kontak.

**Kalau belum dijawab:** Draf dipakai, tapi go-live menunggu konfirmasi lab.

### G2. Berapa lama data harus disimpan? (Wajib)

**Pertanyaan:** Apakah SGSI atau klien punya kewajiban menyimpan data atau menghapusnya setelah jangka waktu tertentu (misalnya data kontak klien, data hasil uji, dokumen CoA)? Apakah ada aturan perlindungan data lain dari SGSI atau klien yang perlu diikuti?

**Jawaban berupa:** Lama penyimpanan per jenis data, atau "belum ada aturan".

**Kalau belum dijawab:** Hanya nama dan email staf yang disimpan sebagai data pribadi. Audit log disimpan tanpa batas waktu. Pemberitahuan lebih dari 90 hari dihapus otomatis.

---

## H. Uji coba, pelatihan, dan go-live (Manajer lab)

### H1. Siapa yang ikut uji coba dan pelatihan? (Wajib)

**Pertanyaan:** Mohon tunjuk satu orang dari tiap kelompok peran untuk uji coba (UAT) memakai HP atau tablet sendiri, dan tentukan siapa yang ikut pelatihan. Kelompoknya: CSO, Lab admin dan Preparation, Analis, Supervisor dan Manager, Superadmin.

**Kenapa kami tanya:** Uji coba oleh pemakai sungguhan menemukan masalah yang tidak terlihat oleh pembuat aplikasi. Pelatihan dilakukan per kelompok peran, memakai alamat uji coba dan panduan satu halaman.

**Jawaban berupa:** Nama peserta per kelompok, dan jadwal yang memungkinkan.

**Kalau belum dijawab:** Kami menjadwalkan ulang saat nama peserta sudah ada.

### H2. Job order nyata pertama dan tanggal go-live (Wajib)

**Pertanyaan:**
1. Kapan target lab mulai memakai aplikasi untuk job order baru sungguhan?
2. Job order nyata mana yang akan dipakai sebagai yang pertama?
3. Bersediakah lab membandingkan CoA pertama yang dicetak aplikasi dengan CoA lab yang biasa, berdampingan, sebelum dikirim ke klien?

**Kenapa kami tanya:** Aplikasi dianggap siap kalau job order baru benar-benar dicatat di aplikasi, bukan lagi di Excel. Sebelum itu, lab perlu menyetujui hasil cetak CoA dan RoA yang pertama.

**Jawaban berupa:** Tanggal target dan nama job order.

**Kalau belum dijawab:** Tanggal go-live ditentukan setelah semua pertanyaan bertanda Wajib dijawab.

---

## I. Boleh dijawab nanti (setelah versi 1)

Pertanyaan berikut tidak menghalangi go-live. Kami mencatatnya supaya tidak terlupa.

### I1. Pengiriman kapal atau tongkang

**Pertanyaan:** Apakah lab SGSI juga mengambil sampel dan menganalisis muatan kapal atau tongkang? Kalau ya, mohon satu set file lengkap: laporan cepat per lot, laporan akhir, dan CoA.

**Kenapa kami tanya:** Alur pengiriman kapal (rata-rata per lot berdasarkan tonase, spesifikasi kontrak pembeli) belum ada di versi 1. File contoh membantu kami merancangnya kemudian.

**Kalau belum dijawab:** Versi 1 hanya melayani pekerjaan eksplorasi dan job order biasa.

### I2. Alat laboratorium

**Pertanyaan:** Kalau suatu saat hasil alat ingin dimasukkan otomatis, alat apa saja yang ada, dan format file hasilnya apa? Mohon satu contoh file per alat.

**Kalau belum dijawab:** Hasil dimasukkan manual oleh analis di versi 1.

### I3. Ekspor untuk perangkat lunak geologi dan penyimpanan laporan

**Pertanyaan:**
1. Apakah ada kebutuhan ekspor data dalam format perangkat lunak geologi tertentu (collar, interval, assay)? Mohon satu contoh file.
2. Apakah laporan harus disimpan di SharePoint? Kalau ya, di situs yang mana?

**Kalau belum dijawab:** Tidak ada ekspor khusus dan tidak ada integrasi SharePoint di versi 1. Laporan dapat diunduh sebagai PDF, XLSX, atau CSV.

---

## Lampiran 1. Yang sudah dijawab (tidak perlu ditanyakan lagi)

| Hal | Jawaban | Tanggal |
| --- | --- | --- |
| Jumlah desimal | 2 desimal, seperti RoA lab | 16 November 2026 |
| Hidrogen untuk Net CV | Diperkirakan (Seyler), bukan diukur | 16 November 2026 |
| Penandatangan CoA | Laboratory Manager | 16 November 2026 |
| Penerbit CoA | Lab SGSI sendiri | 16 November 2026 |
| Tanda tangan CoA | Digital | 20 November 2026 |
| Isi satu kontak per job order | Satu kontak yang menjadi pihak yang dituju di RoA | 27 Oktober 2026 |
| Domain | SGSI sudah punya domain `sgsi-lab.com`, dikelola di Niagahoster. Akses sudah diberikan | 27 November 2026 |
| Email pengirim | Akun Google Workspace `noreply@sgsi-lab.com` sudah dibuat. Kata sandi aplikasi dan DKIM masih perlu dicek | 27 November 2026 |
| Kontainer per sampel | Satu sampel datang dalam satu kontainer, tidak ada kolom jumlah kontainer | 29 Oktober 2026 |
| Format kode sampel dan kode sampel pendek | Dari penjelasan Pak Hans (detail lain masih perlu konfirmasi, lihat D1) | 10 November 2026 |

## Lampiran 2. Catatan untuk tim pengembang (asal tiap pertanyaan)

| Pertanyaan | Sumber di dokumen proyek |
| --- | --- |
| A1 sampai A7 | `Phase6_Build_Design.md` bagian 8 (butir 1 sampai 3), keputusan P6-6, P6-7, P6-8; `V1_Build_Plan.md` bagian 4 butir 1; spec R-11, D-25 |
| A4 | Spec R-11 ("authentication requirement") |
| B1 sampai B3 | `V1_Build_Plan.md` bagian 4 butir 2 dan 11; spec R-08, R-09 |
| B4 | `Phase6_Build_Design.md` P6-9 (angka tahunan tidak ada sumbernya) |
| B5 | `Phase6_Build_Design.md` P6-10; spec R-15 |
| C1 | `V1_Build_Plan.md` butir 3; spec R-05, R-06; `Reports_Build_Design.md` bagian 18, G3 |
| C2 | Spec R-04; `Open_Points_Check_Nov25.md` bagian 3 |
| C3 | `V1_Build_Plan.md` butir 13 |
| C4 | `Reports_Build_Design.md` bagian 18, G2; spec R-06 |
| C5 | `Job_Order_Screen_Plan.md` open point 6 (Revision 2) |
| C6 | `Phase5_Build_Design.md` keputusan 7; Research Plan (pertanyaan terbuka) |
| C7 | `Dashboard_v2_Screen_Plan.md` open point 3 |
| C8 | Research Plan (pertanyaan untuk v2) |
| D1 | Spec 6.1 (enam keputusan); `Sample_Identifiers_Plan.md`; `V1_Build_Plan.md` butir 6 |
| D2 | Spec D-45; `V1_Build_Plan.md` butir 6; `Open_Points_Check_Nov25.md` bagian 3 |
| D3 | `V1_Build_Plan.md` butir 4 |
| D4 | Spec R-01, D-41; `Open_Points_Check_Nov25.md` bagian 3 |
| D5 | `V1_Build_Plan.md` butir 7 |
| E1, E2 | `Reports_Build_Design.md` bagian 14 dan open point 15; G6; spec R-21 |
| E3 | G4 |
| E4, E5 | G5; spec R-10 |
| E6 | G8 (`Reports_Build_Design.md` bagian 17) |
| E7 | G7; spec open point 12 |
| E8 | `V1_Build_Plan.md` butir 5, 8, 9; spec R-03, R-20 |
| F1 | `V1_Build_Plan.md` butir 10; spec R-14, D-28 |
| G1, G2 | `Phase5_Build_Design.md` bagian 14 (A-1); `V1_Build_Plan.md` butir 12 |
| H1, H2 | `Phase6_Build_Design.md` D7, D8, D10, P6-11; `Reports_Build_Design.md` G1, G9 |
| I1 | `V1_Build_Plan.md` butir 14; spec R-12 |
| I2, I3 | Spec R-13, R-16, R-18 |

Pertanyaan Phase 5 yang masih terbuka tapi tidak masuk dokumen ini karena itu keputusan pemilik, bukan lab: C-4 (ekspor mana yang dicatat di audit log) dan C-7 (grafik Trend CV per sampel atau per batch).
