/* Clip 03 · Daftar sampel · flows JO5, JO10 · CSO (Rina) */
exports.title = "Daftar sampel";
exports.run = async (d, page) => {
  await d.startFlow("JO5"); // CSO on JO-2026-0134, Samples tab, off camera
  await d.card("Bagian 3 · JO5, JO10", "Daftar sampel", "CSO memasukkan daftar sampel yang dikirim klien", 3800);
  await d.cardOff();

  // empty state
  await d.say("Job order **JO-2026-0134** menunggu sampel dari klien. Tab **Samples** sudah berisi 6 sampel, dan klien mengirim daftar tambahan.", 5200, "top");
  await d.hl(".card:has-text('Registered Samples')", 6);
  await d.say("Daftar ini adalah daftar versi klien. Nanti laboratorium menerima sampel dengan mencocokkannya pada daftar ini.", 5200, "top");
  await d.hl(null);

  // paste from Excel
  await d.click('#paste-btn', 1000);
  await d.say("**Paste from Excel**: salin baris dari Excel dan tempel di sini. Kolom dibaca dari kiri ke kanan.", 4600);
  await d.click("#paste-sample", 1200);
  await d.hl("#paste-dlg .errrow", 6);
  await d.say("Pratinjau menunjukkan **12 baris**: 11 baru dan **1 duplikat**. Baris duplikat ditandai merah dan dilewati.", 5400);
  await d.hl(null);
  await d.hl("#paste-dlg .grid", 6);
  await d.say("Pemetaan kolom bisa diubah per kolom jika urutan di Excel berbeda.", 3800);
  await d.hl(null);
  await d.click("#paste-add", 1400);

  // table with unsaved rows
  await d.hl("#samples-table", 6);
  await d.say("Baris yang baru ditempel ditandai titik **belum tersimpan**, dan masih bisa diedit langsung di tabel.", 4800, "top");
  await d.hl(null);
  await d.hush();
  await d.type('input[aria-label="Client description"] >> nth=0', "Ply 1 upper (sesuai daftar klien)");
  await d.say("Deskripsi sampel bisa diubah langsung di tabel sebelum disimpan. Tombol **Save** menunjukkan jumlah baris yang belum tersimpan.", 5400, "top");
  await d.hl("#samples-save", 8);
  await d.sleep(1200);
  await d.hl(null);
  await d.hush();
  await d.click("#samples-save", 1600);
  await d.say("**11 sampel baru** tersimpan, dan semuanya berstatus **Expected** sampai laboratorium menerimanya.", 4400, "top");

  // locked rows + not received (JO10)
  await d.hush();
  await d.say("Sekarang job order lain, **JO-2026-0139**, di mana sampel sudah ada di berbagai status.", 4200, "top");
  await d.go("order-JO-2026-0139-samples");
  await d.hl("#samples-table", 6);
  await d.say("Lima status: **Expected**, **In batch**, **Received**, **Awaiting arrival**, dan **Not received**.", 5000, "top");
  await d.hl(null);
  await d.move('button[aria-label="Locked"] >> nth=0');
  await d.say("Sampel yang sudah diterima atau masuk batch **terkunci** dan tidak bisa diubah. Tooltip menjelaskan alasannya.", 5600, "top");

  await d.hush();
  await d.hl('button[aria-label="Restore MCR-2208"]', 12);
  await d.say("**MCR-2208** sebelumnya ditandai tidak diterima. Ikon panah **Restore** mengembalikannya.", 4600, "top");
  await d.hl(null);
  await d.click('button[aria-label="Restore MCR-2208"]', 1400);

  await d.hush();
  await d.hl('button[aria-label="Mark MCR-2206 as not received"]', 12);
  await d.say("**MCR-2206** tidak kunjung tiba. **Mark as not received** menandainya, dengan alasan.", 4600, "top");
  await d.hl(null);
  await d.click('button[aria-label="Mark MCR-2206 as not received"]', 1000);
  await d.hl("#nr-reason", 8);
  await d.say("Pilih alasan: klien tidak mengirim, hilang di perjalanan, atau lainnya. Sampel tetap ada di job order, tetapi CoA tidak lagi menunggunya.", 6200);
  await d.hl(null);
  await d.click('button:text-is("Mark as not received")', 1400);
  await d.hl("#samples-table", 6);
  await d.say("Status berubah menjadi **Not received** dan perubahan tercatat di riwayat job order.", 4600, "top");
  await d.hl(null);

  await d.hush();
  await d.card("Selesai", "Daftar sampel", "Berikutnya: membuat batch dari job order", 3000);
};
