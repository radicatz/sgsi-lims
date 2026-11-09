/* Clip 14 · Pengelolaan job order · flows JO8, JO11, JO12 · CSO (Rina), then Preparation (Dedi) */
const fs = require("fs"), path = require("path");
const DOC = path.join(__dirname, "../out/PO-4500-revisi.pdf");
exports.title = "Pengelolaan job order";
exports.run = async (d, page) => {
  fs.mkdirSync(path.dirname(DOC), { recursive: true });
  fs.writeFileSync(DOC, "%PDF-1.1\n% contoh dokumen demo\n");

  await d.startFlow("JO8"); // CSO on JO-2026-0134, off camera
  await d.card("Bagian 14 · JO8, JO11, JO12", "Pengelolaan job order", "Mengubah, membatalkan, menutup, dan melihat riwayat job order", 4000);
  await d.cardOff();

  // edit
  await d.say("Dari halaman job order, menu **⋯** di kanan atas memuat tindakan: **Edit**, **Cancel job order**, dan **Close job order**.", 6000, "top");
  await d.hush();
  await d.click('button[aria-label="More actions"]', 1000);
  await d.say("Item yang belum boleh dipakai dinonaktifkan, dengan alasannya. **Edit** tertutup setelah preparasi dimulai.", 5200, "top");
  await d.hush();
  await d.click('.menu button.mi:has-text("Edit")', 1400);
  await d.say("**Edit** membuka formulir yang sama dengan membuat job order, sudah terisi data permintaan.", 5000);
  await d.hush();
  await d.type("#fc-expected", "8", 90);
  await d.click("#fc-submit", 1600);
  await d.say("Perubahan tersimpan dan tercatat di riwayat job order.", 4000, "top");
  await d.hush();

  // cancel
  await d.click('button[aria-label="More actions"]', 900);
  await d.click('.menu button.mi:has-text("Cancel job order")', 1200);
  await d.say("**Cancel job order** hanya bisa dilakukan sebelum ada sampel yang diterima, dan wajib disertai alasan.", 6000);
  await d.hush();
  await d.type("#cancel-reason", "Klien menunda kampanye pengeboran", 55);
  await d.click('button:text-is("Cancel job order"):not([role="menuitem"])', 1800);
  await d.say("Job order berstatus **Cancelled**, alasannya tampil di halaman, dan job order tetap ada di daftar.", 5600, "top");

  // close
  await d.hush();
  await d.say("**Close job order** dipakai untuk job order yang sudah **Delivered**. Kita lihat contohnya pada **JO-2026-0133**.", 5600, "top");
  await d.hush();
  await d.go("order-JO-2026-0133");
  await d.click('button[aria-label="More actions"]', 900);
  await d.click('.menu button.mi:has-text("Close job order")', 1200);
  await d.say("Menutup job order menyimpan semua catatan dan memindahkannya dari daftar yang terbuka.", 5000);
  await d.hush();
  await d.click('button:text-is("Close job order"):not([role="menuitem"])', 1600);

  // JO11 files and history
  await d.say("Dua tab lain: **Files** dan **History**.", 3600, "top");
  await d.hush();
  await d.go("order-JO-2026-0142-files");
  await d.say("Tab **Files** menyimpan dokumen job order, misalnya surat PO atau daftar sampel dari klien. Setiap berkas bisa diunduh atau dihapus.", 6200, "top");
  await d.hush();
  await d.upload(".dz", DOC);
  await d.say("Berkas baru ditambahkan lewat kotak unggah. Di prototipe, hanya nama file yang disimpan.", 4800, "top");
  await d.hush();
  await d.click('#jo-tabs button:has-text("History")', 1500);
  await d.hl("#audit-rows", 6);
  await d.say("Tab **History** mencatat setiap perubahan pada job order, sampel, batch, dan CoA-nya, termasuk berkas yang baru ditambahkan.", 6400, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#audit-rows button >> nth=0", 1400);
  await d.say("Baris yang dibuka menunjukkan nilai **sebelum** dan **sesudah** untuk setiap bidang yang berubah.", 5000, "top");

  // JO12 read-only
  await d.hush();
  await d.say("Peran lain hanya bisa **membaca** job order. Kita lihat sebagai **Preparation**.", 4600, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Preparation")', 1500);
  await d.bar(false);
  await d.go("order-JO-2026-0139-samples");
  await d.hl('.card:has-text("Registered Samples")', 6);
  await d.say("Tab **Samples** tidak punya tombol ubah, dan menu **⋯** tidak muncul. Catatan di atas tabel mengarahkan penerimaan sampel ke halaman batch.", 7000, "top");
  await d.hl(null);
  await d.hush();
  await d.click('#jo-tabs button:has-text("Batches")', 1400);
  await d.hl("#add-batch", 10);
  await d.say("Namun tim Preparation tetap bisa **Add batch** dari tab **Batches**, karena membuat batch memang bagian dari pekerjaannya.", 6200, "top");
  await d.hl(null);

  await d.hush();
  await d.card("Selesai", "Pengelolaan job order", "Berikutnya: akun dan kata sandi", 3000);
};
