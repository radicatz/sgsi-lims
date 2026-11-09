/* Clip 04 · Batch · flows JO6, BA8, BA7 · Lab admin (Maya) */
exports.title = "Batch";
exports.run = async (d, page) => {
  await d.startFlow("JO6"); // Lab admin on JO-2026-0137, Batches tab, off camera
  await d.card("Bagian 4 · JO6, BA8, BA7", "Batch", "Mengelompokkan sampel terdaftar dan mengirimnya ke laboratorium", 3800);
  await d.cardOff();

  // JO6: add a batch from the job order
  await d.say("Job order **JO-2026-0137** milik PT Kaltara Energi Prima punya 16 sampel terdaftar. Tab **Batches** menampilkan batch yang sudah dibuat.", 5400, "top");
  await d.hl("#batches-table", 6);
  await d.say("Baru satu batch, **B-2026-0422**, yang berisi 8 sampel pertama. Masih ada 8 sampel yang belum masuk batch.", 5000, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#add-batch", 1200);

  await d.hl("#ab-no", 8);
  await d.say("**Batch no.** terisi otomatis dengan nomor berikutnya, dan masih bisa diubah.", 4200);
  await d.hl(null);
  await d.type("#ab-coc", "COC-KEP-2026-117");
  await d.say("**CoC no.** adalah nomor formulir rantai pengiriman sampel, boleh dikosongkan.", 4200);
  await d.hl("#add-batch-dlg .grid", 8);
  await d.say("**Batch date** dan **Deadline**. Deadline disarankan dari lama pengerjaan layanan dan tidak melewati jatuh tempo job order.", 5400);
  await d.hl(null);
  await d.hl("#add-batch-dlg .chips", 8);
  await d.say("**Standard**: satu standar untuk satu batch. Pilihannya dari standar yang diminta pada job order.", 4600);
  await d.hl(null);
  await d.hl("#add-batch-dlg .field:has(.ppill)", 8);
  await d.say("**Parameters** disalin dari batch sebelumnya, dan bisa disesuaikan khusus untuk batch ini.", 4600);
  await d.hl(null);
  await d.hl("text=Settings copied from", 8);
  await d.say("Catatan di atas menunjukkan dari batch mana pengaturan disalin.", 3600);
  await d.hl(null);
  await d.hl("#add-batch-dlg .field:has-text('Samples (')", 8);
  await d.say("Daftar **Samples** menampilkan sampel yang belum masuk batch. Pilih satu per satu, atau gunakan **Select all** dan **Clear**.", 5400, "top");
  await d.hl(null);
  await d.click('#add-batch-dlg button.linkbtn:text-is("Clear")', 700);
  await d.click('#add-batch-dlg button.linkbtn:has-text("Select all")', 900);
  await d.hush();
  await d.click("#ab-create", 1600);
  await d.hl("#batches-table", 6);
  await d.say("**Batch baru** dibuat dengan 8 sampel sisa. Tim Preparation dan lab admin mendapat notifikasi bahwa batch siap diterima.", 5400, "top");
  await d.hl(null);

  // BA8: add a batch from the Batches list
  await d.hush();
  await d.say("Batch juga bisa dibuat dari halaman **Batches**, tanpa membuka job order lebih dulu.", 4200, "top");
  await d.go("batches");
  await d.hush();
  await d.click("#list-add-batch", 1000);
  await d.hl("#pick-jo", 8);
  await d.say("Karena batch selalu berasal dari job order, aplikasi meminta **job order** lebih dulu. Hanya job order yang masih punya sampel bebas yang muncul.", 6000);
  await d.hl(null);
  await d.hush();
  await d.select("#pick-jo", "JO-2026-0134");
  await d.click("#pick-next", 1400);
  await d.say("Dialog yang sama terbuka untuk job order **JO-2026-0134**: semua sampel yang masih bebas sudah terpilih.", 5000);
  await d.hush();
  await d.click("#ab-create", 1600);
  await d.say("Batch kedua dibuat dan muncul di daftar **Batches**.", 3800, "top");

  // BA7: edit the batch number
  await d.hush();
  await d.go("batch-B-2026-0422");
  await d.say("Nomor batch bisa diubah **sebelum penerimaan dikonfirmasi**. Ikon pensil ada di samping judul.", 4800, "top");
  await d.hl('button[aria-label="Edit batch number"]', 10);
  await d.sleep(1200);
  await d.hl(null);
  await d.hush();
  await d.click('button[aria-label="Edit batch number"]', 1000);
  await d.type("#num-v", "B-2026-0421");
  await d.hush();
  await d.click("#num-save", 900);
  await d.say("Nomor yang sudah dipakai ditolak: **B-2026-0421 is already used**.", 4200);
  await d.hush();
  await d.type("#num-v", "B-2026-0430");
  await d.say("Nomor baru yang sah diterima. Kode lab setiap sampel mengikuti nomor baru, dan label yang sudah dicetak harus dicetak ulang.", 5600);
  await d.hush();
  await d.click("#num-save", 1600);
  await d.say("Nomor batch berubah menjadi **B-2026-0430**, dan perubahan tercatat di audit log.", 4600, "top");

  await d.hush();
  await d.card("Selesai", "Batch", "Berikutnya: penerimaan sampel", 3000);
};
