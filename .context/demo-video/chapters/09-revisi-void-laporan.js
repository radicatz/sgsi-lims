/* Clip 09 · Revisi, void, daftar laporan · flows RE3, RE1 · Lab admin, Superadmin, Analyst, CSO */
exports.title = "Revisi, void, daftar laporan";
exports.run = async (d, page) => {
  await d.startFlow("RE3"); // Lab admin on CoA-JO-2026-0138-1, off camera
  await d.card("Bagian 9 · RE3, RE1", "Revisi, void, dan daftar laporan", "Mengoreksi CoA yang sudah terbit, membatalkannya, dan mencari laporan", 4000);
  await d.cardOff();

  await d.say("**CoA-JO-2026-0138-1** sudah terbit dan terkirim. CoA yang sudah terbit tidak bisa diedit, tetapi bisa **direvisi**.", 6000, "top");
  await d.hush();
  await d.click('button[aria-label="More actions"]', 900);
  await d.click('.menu button.mi:has-text("Revise")', 1000);
  await d.say("**Revise** membuat revisi baru dan wajib menyebut alasannya. Klien tetap memegang versi yang sudah dikirim.", 6000);
  await d.hush();
  await d.type("#rev-reason", "Nomor PO klien dikoreksi", 60);
  await d.click('button:text-is("Create revision")', 1800);
  await d.say("Draf revisi terbuka. Ubah yang perlu, lalu **Publish** seperti CoA biasa.", 4600, "top");
  await d.hush();
  await d.click("#publish", 1000);
  await d.click('button:text-is("Publish"):not(#publish)', 1800);
  await d.say("**Revisi 2** terbit dengan nomor baru. Kartu **Versions** menampilkan semua revisi beserta statusnya.", 5600, "top");
  await d.hush();
  await d.click('button:has-text("CoA-JO-2026-0138-1")', 1600);
  await d.hl("text=Superseded by revision 2", 8);
  await d.say("Revisi 1 kini **Superseded**: disimpan sebagai arsip, dengan tautan ke revisi yang berlaku.", 5400, "top");
  await d.hl(null);
  await d.hush();

  // void as superadmin
  await d.say("Jika sertifikat harus dibatalkan seluruhnya, hanya **Superadmin** yang bisa melakukan **Void**.", 5000, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Superadmin")', 1200);
  await d.bar(false);
  await d.go("report-CoA-JO-2026-0138-2");
  await d.click('button[aria-label="More actions"]', 900);
  await d.click('.menu button.mi:has-text("Void")', 1000);
  await d.say("**Void** meminta alasan. Nomor CoA tidak pernah dipakai ulang, dan siapa pun yang mengunduhnya melihat tanda void.", 6200);
  await d.hush();
  await d.type("#void-reason", "Salah kirim ke klien lain", 60);
  await d.click('button:text-is("Void CoA")', 1800);
  await d.say("CoA berstatus **Void**, lengkap dengan alasan, dan tercatat di audit log.", 4800, "top");

  // RE1: analyst
  await d.hush();
  await d.say("Sekarang halaman **Reports** menurut peran. Pertama, **Analyst**.", 4000, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Analyst")', 1200);
  await d.bar(false);
  await d.go("reports");
  await d.say("Analis hanya melihat daftar **RoA**, laporan internal laboratorium. Tidak ada tab CoA.", 5000, "top");
  await d.hush();
  await d.type("#rep-q", "Bara", 90);
  await d.say("Pencarian dan filter periode serta perusahaan mempersempit daftar.", 4200, "top");
  await d.hush();
  await d.click("tbody tr:nth-child(1) label.cb", 700);
  await d.click("tbody tr:nth-child(2) label.cb", 900);
  await d.say("Centang beberapa laporan, lalu **Download PDFs** mengunduhnya sekaligus sebagai satu berkas ZIP.", 5200, "top");
  await d.hush();
  await d.click('.sticky-bar button:has-text("Download PDFs")', 1500);

  // RoA page (signed copy preview)
  await d.hush();
  await d.click("tbody tr:nth-child(3) td:nth-child(2)", 1800);
  await d.say("Klik sebuah baris untuk membuka **RoA**. Halaman ini menampilkan salinan RoA yang sudah ditandatangani, dengan tanda **Signed copy** dan peringatan bahwa dokumen ini internal.", 6800, "top");
  await d.hl("#roa-doc", 4);
  await d.say("**Preview** menampilkan dokumen RoA: hasil setiap sampel pada empat basis (**ADB**, **DB**, **DAF**, **AR**), metode uji, dan tanda tangan supervisor.", 6800, "top");
  await d.hl(null);
  await d.hush();
  await d.click('#roa-preview button[aria-label="Next page"]', 1600);
  await d.say("Dua sampel per halaman. Panah di kanan atas kartu berpindah halaman.", 4000, "top");
  await d.hush();
  await d.hl("#roa-used", 6);
  await d.say("Kartu **Used in** menunjukkan CoA yang dibuat dari RoA ini, beserta statusnya.", 4600, "top");
  await d.hl(null);

  // CSO
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("CSO")', 1200);
  await d.bar(false);
  await d.go("reports");
  await d.say("Untuk **CSO**, daftar yang sama hanya memuat **CoA**.", 4200, "top");
  await d.hl("main .chips", 6);
  await d.say("Tab status **Draft**, **Published**, **Sent**, dan **Superseded** menyaring CoA. Setiap baris punya tombol unduh dan menu aksi.", 6200, "top");
  await d.hl(null);
  await d.hush();
  await d.click('main .chips button:has-text("Published")', 1400);

  await d.hush();
  await d.card("Selesai", "Revisi, void, dan daftar laporan", "Berikutnya: apa yang tidak boleh dilihat CSO", 3000);
};
