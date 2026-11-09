/* Clip 06 · Preparasi · flow BA4 · Preparation (Dedi), then Analyst's bell */
exports.title = "Preparasi";
exports.run = async (d, page) => {
  await d.startFlow("BA4"); // Preparation on B-2026-0420, Preparation tab, off camera
  await d.card("Bagian 6 · BA4", "Preparasi", "Tim Preparation memasukkan ADL, lalu menyerahkan batch ke analis", 3800);
  await d.cardOff();

  await d.say("Setelah penerimaan dikonfirmasi, batch **B-2026-0420** masuk ke tab **Preparation**. Di sini tim Preparation memasukkan **ADL** (air-dry loss) setiap sampel.", 6400, "top");
  await d.hl("#prep-table", 6);
  await d.say("Tabel menampilkan sampel yang diterima beserta kode lab-nya. Kolom **Entered by** akan terisi setelah nilai disimpan.", 5000, "top");
  await d.hl(null);
  await d.hush();

  // enter ADL
  await d.type('input[aria-label="ADL of MCR-2201"]', "8.2", 90);
  await d.type('input[aria-label="ADL of MCR-2202"]', "9.1", 90);
  await d.hl("div:has(> b:text-is('Before you can finish preparation'))", 8);
  await d.say("Daftar periksa menghitung kemajuan: **ADL for every sample**. **Finish Preparation** baru aktif jika semuanya terisi.", 5400, "top");
  await d.hl(null);
  await d.hush();
  await d.type('input[aria-label="ADL of MCR-2203"]', "22.4", 90);
  await d.move('#prep-table tr:has-text("MCR-2203") .c-warn');
  await d.sleep(500);
  await d.say("Nilai **22.4** di atas rentang tipikal (0 sampai 15 %), sehingga muncul ikon peringatan. Peringatan tidak memblokir penyimpanan: petugas diminta memeriksa ulang.", 7000, "top");
  await d.hush();
  await d.type('input[aria-label="ADL of MCR-2204"]', "7.6", 90);

  // save all
  await d.hush();
  await d.click('button:has-text("Save all")', 1500);
  await d.say("**Save all** menyimpan nilai, dan kolom **Entered by** mencatat siapa yang memasukkan dan kapan.", 5000, "top");
  await d.hush();

  // finish
  await d.click("#finish-prep", 1600);
  await d.say("**Finish Preparation** menutup preparasi: nilai ADL terkunci dan analis diberi tahu bahwa batch siap untuk entri data.", 6400, "top");
  await d.hush();

  // analyst
  await d.say("Sekarang kita lihat dari sisi analis. Pindah peran ke **Analyst**.", 3600, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Analyst")', 1500);
  await d.bar(false);
  await d.say("**Fitri Handayani**, analis, melihat angka merah di ikon lonceng: ada hand-off baru untuknya.", 5000, "top");
  await d.hush();
  await d.click('button[aria-label^="Notifications"]', 1000);
  await d.hl("#notif-panel", 6);
  await d.say("Panel notifikasi memuat **B-2026-0420 is ready for data entry**, lengkap dengan jumlah sampel dan siapa yang menyelesaikan ADL.", 6000);
  await d.hl(null);
  await d.hush();
  await d.click('#notif-panel :text("is ready for data entry")', 1800);
  await d.say("Satu klik pada notifikasi membuka batch di tab **Analysis**, siap untuk memasukkan hasil.", 5000, "top");

  await d.hush();
  await d.card("Selesai", "Preparasi", "Berikutnya: analisis dan RoA", 3000);
};
