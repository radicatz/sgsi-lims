/* Clip 00 · Pembuka · what the prototype is, demo facts, the review bar */
exports.title = "Pembuka";
exports.run = async (d, page) => {
  await d.bar(true);
  await d.card("Prototipe v2", "SGSI LIMS", "Model yang bisa diklik untuk seluruh aplikasi versi 1", 4200);
  await d.cardOff();

  await d.say("Ini **prototipe SGSI LIMS**: model yang bisa diklik untuk seluruh layar aplikasi versi 1.", 3800);
  await d.say("Ini **bukan sistem yang sebenarnya**. Tujuannya agar laboratorium bisa memberi tanggapan sebelum pengembangan dimulai.", 4800);

  // review bar tour
  await d.say("Bilah gelap di atas adalah **alat untuk demo**, bukan bagian dari aplikasi.", 3400);

  await d.hl(".rseg >> nth=0", 6);
  await d.say("**Width**: mengubah lebar layar. Aplikasi menyesuaikan tata letaknya seperti aplikasi sungguhan.", 3800);
  await d.hl(null);
  await d.click('.rseg button:text-is("Tablet 834")', 1300);
  await d.click('.rseg button:text-is("Phone 390")', 1300);
  await d.click('.rseg button:text-is("Fit")', 1000);

  await d.hl(".rseg >> nth=1", 6);
  await d.say("**Role**: masuk sebagai salah satu dari tujuh orang. Menu, halaman awal, dan tombol berubah sesuai peran.", 4200);
  await d.hl(null);

  await d.hl(".rseg >> nth=2", 6);
  await d.say("**Theme**: tampilan **Light** atau **Dark**.", 2400);
  await d.hl(null);
  await d.click('.rseg button:text-is("Dark")', 1800);
  await d.click('.rseg button:text-is("Light")', 1000);

  // Flows
  await d.click('.rbtn:has-text("Flows")', 900);
  await d.hl(".rpanel", 0);
  await d.say("**Flows**: puluhan skenario siap pakai. Tombol **Start** mengatur ulang data, masuk sebagai orang yang tepat, dan membuka layar yang tepat.", 6000);
  await d.hl(null);

  // Spec only
  await d.click('.rbtn:has-text("Spec only")', 900);
  await d.hl(".rpanel", 0);
  await d.say("**Spec only**: daftar hal yang hanya ditampilkan prototipe tetapi tidak benar-benar dilakukan, misalnya cetak dan pengiriman email. Di sini juga ada tombol untuk memulai **session timeout**.", 7000);
  await d.hl(null);

  // Reset demo
  await d.click('.rbtn:has-text("Reset demo")', 900);
  await d.hl(".rpanel", 0);
  await d.say("**Reset demo**: mengembalikan semua data ke keadaan awal dan keluar dari akun.", 3800);
  await d.hl(null);
  await d.click('.rpanel button:has-text("Keep my changes")', 800);

  // demo facts
  await d.move(".brandline small"); await d.hl(".brandline small", 8);
  await d.say("Beberapa hal yang perlu diingat. Semua data adalah **data demo**, dan hari ini adalah **Kamis, 5 November 2026** untuk semua orang.", 6200);
  await d.hl(null);
  await d.move('.rbtn:has-text("Reset demo")');
  await d.say("Perubahan hanya tersimpan di **browser Anda** sampai **Reset demo**. Tidak ada yang disimpan ke server.", 4600);
  await d.move("#si-submit");
  await d.say("PDF adalah contoh file, unggahan hanya menyimpan nama file, dan **Print** menampilkan pesan karena halaman tidak bisa membuka printer.", 6200);
  await d.move('.rseg button:text-is("Fit")');
  await d.say("Panah di ujung kanan menyembunyikan bilah ini. Untuk bagian berikutnya, bilah disembunyikan agar layar aplikasi terlihat penuh.", 5400);
  await d.bar(false);

  await d.card("Selesai", "Pembuka", "Berikutnya: masuk dan tujuh peran", 3000);
};
