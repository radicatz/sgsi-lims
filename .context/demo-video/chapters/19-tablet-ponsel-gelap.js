/* Clip 19 · Tablet, ponsel, tema gelap · flow JO9 + tablet batch page + Dark theme · CSO, Lab admin */
exports.title = "Tablet, ponsel, tema gelap";
exports.run = async (d, page) => {
  await d.startFlow("JO9"); // CSO on Job orders, off camera
  await d.card("Bagian 19 · JO9", "Tablet, ponsel, dan tema gelap", "Aplikasi menyesuaikan tata letak untuk setiap perangkat", 4000);
  await d.cardOff();

  // phone
  await d.say("Aplikasi berpindah tata letak sesuai lebar layar. Pertama **ponsel**, dengan lebar 390.", 5000, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Phone 390")', 1600);
  await d.bar(false);
  await d.say("Di ponsel, menu samping menjadi **laci menu**, dan tabel menjadi **kartu**. Tombol **New job order** menempel di bawah layar.", 6400, "top");
  await d.hush();
  await d.click('button[aria-label="Open menu"]', 1200);
  await d.hl("nav.side", 4);
  await d.say("**Laci menu** memuat semua halaman untuk peran ini, dengan nama dan peran pengguna di atasnya.", 5200, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button[aria-label="Close menu"]', 1000);
  await d.click("#new-jo", 1400);
  await d.say("Di ponsel, formulir job order dibagi menjadi **dua langkah** dengan indikator kemajuan: langkah 1 untuk permintaan, langkah 2 untuk laporan dan berkas.", 7200, "top");
  await d.hush();
  await d.type("#fc-company", "Bara", 80);
  await d.click('.menu button.mi:has-text("PT Bara Nusantara Mandiri")', 1200);
  await d.type("#fc-expected", "12", 90);
  await d.click("#fc-next", 1400);
  await d.say("Langkah 2 memuat penandatangan bawaan, catatan, dan berkas. **Back** kembali ke langkah 1.", 5200, "top");
  await d.hush();
  await d.click("#fc-submit", 1800);
  await d.say("**Submit** menyimpan job order, dan halaman **Samples** terbuka seperti di desktop.", 5000, "top");

  // tablet
  await d.hush();
  await d.say("Berikutnya **tablet**, dengan lebar 834. Kita lihat halaman batch sebagai lab admin.", 5200, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Lab admin")', 1200);
  await d.click('.rseg button:text-is("Tablet 834")', 1600);
  await d.bar(false);
  await d.go("batch-B-2026-0422");
  await d.hl("nav.side", 4);
  await d.say("Di tablet, menu samping selalu berupa **deretan ikon** supaya ruang layar tersedia untuk isi halaman.", 5600, "top");
  await d.hl(null);
  await d.hush();
  await d.sleep(1200);

  // dark
  await d.say("Terakhir, **tema gelap**, yang dipilih dari bilah demo.", 4400, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Dark")', 1600);
  await d.click('.rseg button:text-is("Desktop 1440")', 1600);
  await d.bar(false);
  await d.say("Seluruh antarmuka mengikuti warna tema gelap: latar, kartu, status, dan grafik. Ini berlaku di semua halaman dan semua ukuran layar.", 6600, "top");
  await d.hush();
  await d.go("dashboard");
  await d.sleep(1800);
  await d.go("batch-B-2026-0422");
  await d.sleep(1800);
  await d.bar(true);
  await d.click('.rseg button:text-is("Light")', 1200);
  await d.click('.rseg button:text-is("Fit")', 1200);
  await d.bar(false);

  await d.hush();
  await d.card("Selesai", "Tablet, ponsel, dan tema gelap", "Berikutnya: penutup", 3000);
};
