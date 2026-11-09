/* Clip 07 · Analisis & RoA · flow BA5 · Analyst (Fitri), then Lab admin (Maya) */
exports.title = "Analisis & RoA";
exports.run = async (d, page) => {
  await d.startFlow("BA5"); // Analyst on B-2026-0418, Analysis tab, off camera
  await d.card("Bagian 7 · BA5", "Analisis & RoA", "Analis memasukkan hasil uji, lalu lab admin mengunggah RoA yang sudah ditandatangani", 4000);
  await d.cardOff();

  await d.say("Preparasi **B-2026-0418** sudah selesai, jadi analis **Fitri Handayani** membuka tab **Analysis** untuk memasukkan hasil uji.", 5600, "top");
  await d.hl("#analysis-table", 6);
  await d.say("Tabel nilai dikelompokkan per kelompok parameter (Moisture, Proximate, Sulfur, Calorific), dengan satuan dan basis di bawah nama parameter.", 6400, "top");
  await d.hl(null);
  await d.hush();

  // manual values -> FC calculated
  await d.type("#v-0-IM", "3.10", 80);
  await d.type("#v-0-Ash", "12.40", 80);
  await d.type("#v-0-VM", "38.20", 80);
  await d.hl('input[aria-label$=", calculated"] >> nth=0', 10);
  await d.say("**FC** (fixed carbon) dihitung otomatis dari IM, Ash, dan VM, sehingga tidak diisi manual. Sel ini hanya bisa dibaca.", 6200, "top");
  await d.hl(null);
  await d.hush();

  // out of range
  await d.type("#v-1-Ash", "48.5", 80);
  await d.hl("#v-1-Ash", 10);
  await d.say("Nilai di luar rentang tipikal diberi tanda. **Ash 48.5** terlalu tinggi, jadi selnya berwarna dan analis diminta memeriksa ulang. Tanda ini tidak memblokir penyimpanan.", 7000, "top");
  await d.hl(null);
  await d.hush();

  // demo fill
  await d.hl("#fill-demo", 8);
  await d.say("Untuk keperluan demo, tautan **Fill the empty cells with demo values** mengisi semua sel yang kosong, agar kita tidak mengetik puluhan angka.", 6400, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#fill-demo", 1500);
  await d.hl("div:has(> b:text-is('Before you can finish analysis'))", 8);
  await d.say("Daftar periksa menghitung nilai yang sudah terisi dan menyebut sampel yang nilainya di luar rentang. **Finish Analysis** aktif setelah semua nilai terisi.", 6400, "top");
  await d.hl(null);

  // save + finish
  await d.hush();
  await d.click("#save-values", 1500);
  await d.say("**Save all** menyimpan nilai, dan status batch berubah menjadi **Analysis**.", 4200, "top");
  await d.hush();
  await d.click("#finish-analysis", 1600);
  await d.say("**Finish Analysis** mengunci nilai dan memberi tahu lab admin agar mengunggah RoA yang sudah ditandatangani.", 5600, "top");
  await d.hush();

  // lab admin
  await d.say("Sekarang giliran **lab admin**. Pindah peran ke **Lab admin**.", 3600, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Lab admin")', 1500);
  await d.bar(false);
  await d.click('button[aria-label^="Notifications"]', 1000);
  await d.hl("#notif-panel", 6);
  await d.say("**Maya Lestari** menerima notifikasi **B-2026-0418 analysis is finished**: unggah RoA yang sudah ditandatangani untuk menyelesaikan batch.", 6000);
  await d.hl(null);
  await d.hush();
  await d.click('#notif-panel :text("analysis is finished")', 1800);

  await d.hl("#roa-no", 10);
  await d.say("Kartu **Signed RoA**: isi **RoA number**, lalu unggah PDF hasil cetak RoA yang sudah ditandatangani dari kertas.", 6000, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#roa-sample", 1400);
  await d.say("Di prototipe, tautan **Use a sample signed RoA** menggantikan file asli. Setelah ada file, **Complete batch** aktif.", 5600, "top");
  await d.hush();
  await d.click("#complete-batch", 1800);
  await d.say("Batch **Completed**: RoA tersimpan dengan nomornya. Jika ini batch terakhir dari job order, lab admin diberi tahu untuk membuat CoA.", 6400, "top");

  await d.hush();
  await d.card("Selesai", "Analisis & RoA", "Berikutnya: CoA", 3000);
};
