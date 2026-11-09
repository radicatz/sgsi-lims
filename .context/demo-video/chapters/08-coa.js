/* Clip 08 · CoA · flows JO7, RE2, MW2 · Lab admin (Maya), then CSO (Rina) */
const CARD = (t) => `xpath=//*[normalize-space(text())="${t}"]/ancestor::*[contains(concat(" ",normalize-space(@class)," ")," card ")][1]`;
exports.title = "CoA";
exports.run = async (d, page) => {
  await d.startFlow("JO7"); // Lab admin on JO-2026-0141, CoA tab, off camera
  await d.card("Bagian 8 · JO7, RE2, MW2", "CoA", "Dari batch yang selesai menjadi sertifikat untuk klien", 3800);
  await d.cardOff();

  await d.say("Semua batch **JO-2026-0141** sudah selesai dan punya RoA. Tab **CoA** memberi tanda **Ready to generate**: sertifikat siap dibuat.", 6000, "top");
  await d.hl(CARD("Certificate of Analysis"), 6);
  await d.say("Kartu ini juga menunjukkan batch dan RoA yang menjadi dasar sertifikat.", 4200, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#gen-coa", 1800);

  // draft page
  await d.say("**Generate CoA** membuka draf sertifikat di halaman **Reports**. Di kiri ada pratinjau dua halaman, di kanan pengaturan.", 6000, "top");
  await d.hush();
  await d.click('button[aria-label="Next page"]', 1500);
  await d.say("Halaman 2 memuat catatan dan metode uji yang dipakai, lengkap dengan nama dan jabatan penandatangan.", 5000, "top");
  await d.hush();
  await d.click('button[aria-label="Previous page"]', 1000);
  await d.hl(CARD("Build the certificate"), 6);
  await d.say("**Build the certificate**: pilih basis hasil (**ADB**, **DB**, **DAF**, **AR**), parameter yang dicetak, **Attention**, **Signatory**, dan nomor PO.", 6800, "top");
  await d.hl(null);
  await d.hush();
  await d.click('label.cb:has-text("DB"):not(:has-text("DAF"))', 1000);
  await d.click("button.ppill >> nth=2", 900);
  await d.say("Pratinjau berubah langsung: basis **DB** ditambahkan, dan satu parameter dikeluarkan dari sertifikat.", 4800, "top");
  await d.hush();
  await d.click("#publish", 1200);
  await d.say("**Publish** meminta konfirmasi: sertifikat mendapat nomor, tidak bisa diedit lagi, dan perubahan berikutnya harus lewat revisi.", 6200);
  await d.hush();
  await d.click('button:text-is("Publish"):not(#publish)', 1800);
  await d.hl(CARD("Delivery"), 6);
  await d.say("CoA berstatus **Published**, dengan nomornya. Kartu **Delivery** masih kosong, dan kartu **Built from** mencatat batch dan RoA asalnya.", 6400, "top");
  await d.hl(null);

  // CSO
  await d.hush();
  await d.say("Sekarang **CSO** yang mengirim sertifikat ke klien. Pindah peran ke **CSO**.", 3800, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("CSO")', 1500);
  await d.bar(false);
  await d.click('button[aria-label^="Notifications"]', 1000);
  await d.hl("#notif-panel", 6);
  await d.say("**Rina Kartika** menerima notifikasi bahwa CoA sudah terbit dan siap dikirim ke klien.", 5000);
  await d.hl(null);
  await d.hush();
  await d.click('#notif-panel :text("is published")', 1800);
  await d.hl("#mark-sent", 10);
  await d.say("Dari halaman CoA, **Mark sent** mencatat pengiriman. Untuk beberapa CoA sekaligus, CSO memakai antrean di **My work**.", 6000, "top");
  await d.hl(null);

  // MW2
  await d.hush();
  await d.go("work-send");
  await d.say("Antrean **CoAs to send** memuat semua CoA yang sudah terbit tetapi belum dikirim.", 4600, "top");
  await d.hush();
  await d.click("thead label.cb", 1200);
  await d.say("Centang semua baris, lalu muncul bilah aksi: **Download PDFs** untuk mengunduh, **Mark sent** untuk mencatat pengiriman.", 5800, "top");
  await d.hush();
  await d.click('.sticky-bar button:has-text("Download PDFs")', 1500);
  await d.click('.sticky-bar button:text-is("Mark sent")', 1200);
  await d.say("Dialog **Mark sent**: tanggal, **cara pengiriman** (boleh lebih dari satu), penerima, dan catatan.", 5400);
  await d.hush();
  await d.click('label.cb[id="ms-WhatsApp"]', 900);
  await d.hl("#mark-sent-dlg .field:has-text('Sent by')", 8);
  await d.say("Di sini dipilih dua cara sekaligus: **Email** dan **WhatsApp**. Penerima tiap CoA diambil dari kontak job order-nya.", 6000);
  await d.hl(null);
  await d.hush();
  await d.click("#ms-confirm", 1800);
  await d.say("Semua CoA ditandai terkirim, dan job order-nya menjadi **Delivered**. Antrean kini kosong.", 5200, "top");

  await d.hush();
  await d.card("Selesai", "CoA", "Berikutnya: revisi, pembatalan, dan daftar laporan", 3000);
};
