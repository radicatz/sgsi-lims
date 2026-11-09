/* Clip 02 · Membuat job order · flows JO1, JO2, JO3, JO4 · CSO (Rina) */
exports.title = "Membuat job order";
exports.run = async (d, page) => {
  await d.startFlow("JO1"); // CSO, Job orders list, off camera
  await d.card("Bagian 2 · JO1 – JO4", "Membuat job order", "Permintaan klien dicatat sebagai job order oleh CSO", 3800);
  await d.cardOff();

  // list
  await d.hl("#jo-table", 4);
  await d.say("Halaman **Job orders** menampilkan semua permintaan klien: nomor, klien, layanan, jatuh tempo, dan status.", 4600);
  await d.hl(null);
  await d.hl("#new-jo", 6);
  await d.say("CSO membuat permintaan baru dengan tombol **New job order**.", 3000);
  await d.hl(null);
  await d.click("#new-jo", 1200);

  // JO2: validation first
  await d.say("Jika **Submit** ditekan saat formulir kosong, aplikasi tidak menyimpan apa pun.", 3600);
  await d.click("#fc-submit", 1200);
  await d.hl("#fc-errsum", 6);
  await d.say("Muncul **Fix 3 fields to submit**, dengan tautan ke setiap kolom yang harus diisi.", 4200);
  await d.hl(null);
  await d.say("Klik **Cancel** untuk menutup, lalu kita isi formulir dari awal.", 3200);
  await d.click('button:text-is("Cancel")', 900);
  await d.click("#new-jo", 1200);

  // company
  await d.say("Pertama, **perusahaan**. Ketik untuk mencari, atau tambahkan perusahaan baru langsung dari sini.", 4400);
  await d.type("#fc-company", "Bara");
  await d.click('.menu button.mi:has-text("PT Bara Nusantara Mandiri")', 1000);
  await d.hl("#fc-address", 6);
  await d.say("Alamat dan **kontak utama** perusahaan terisi otomatis dari data klien.", 4000);
  await d.hl(null);
  await d.type("#fc-po", "PO 4500-2241");

  // JO3: contacts
  await d.click("#fc-contact", 900);
  await d.hl(".menu", 6);
  await d.say("**Contact person**: pilih kontak yang ada, ubah, hapus, atau tambah kontak baru tanpa meninggalkan formulir.", 5200);
  await d.hl(null);
  await d.click("#fc-contact-add", 700);
  await d.type("#fc-contact-name", "Andi Pratama");
  await d.type("#fc-contact-phone", "+62 812 5550 7788");
  await d.click("#fc-contact-save", 1200);
  await d.say("Kontak baru langsung tersimpan di data klien dan terpilih untuk job order ini.", 4000);

  await d.click("#fc-contact", 700);
  await d.click('.menu button:has-text("Budi Hartono")', 900);
  await d.click("#fc-contact", 700);
  await d.click('button[aria-label="Remove Andi Pratama"]', 800);
  await d.say("Menghapus kontak meminta konfirmasi. Kontak yang sedang dipilih tidak bisa dihapus.", 4200);
  await d.click('button:text-is("Remove")', 800);
  await d.say("Setelah dihapus, ada **Undo** selama 10 detik. **Budi Hartono**, kontak utama, tetap terpilih.", 4200);

  // JO4: standard, quick select, pills
  await d.hl("#order-form .chips", 6);
  await d.say("**Standard**: ASTM, ISO, atau GB/T. Minimal satu standar harus tetap aktif.", 4200);
  await d.hl(null);
  await d.click('button.btn:text-is("Full analysis")', 1000);
  await d.say("**Quick select** langsung memilih paket parameter, di sini **Full analysis**.", 3800);
  await d.hl('#order-form .row.top:has(.t-cap:text-is("Proximate"))', 8);
  await d.say("Parameter yang bergantung pada yang lain terkunci. **FC** membutuhkan IM, Ash, dan VM, jadi ketiganya tidak bisa dimatikan.", 5800);
  await d.hl(null);

  await d.click('button.ppill:has-text("Ash analysis")', 1000);
  await d.say("**Ash analysis** punya daftar centang sendiri: oksida dan rasio, dengan pilihan awal yang sudah ditentukan.", 4800, "top");
  await d.type("#gl-q", "Fe");
  await d.say("Daftar bisa dicari. Klik **Done** untuk menerapkan pilihan.", 3200, "top");
  await d.hush();
  await d.click("#group-apply", 1000);

  await d.click('.chips .chip:text-is("GB/T")', 900);
  await d.click('button.btn:text-is("Coking coal")', 1000);
  await d.hl('#order-form .row.top:has(button.ppill:has-text("Gray King"))', 8);
  await d.say("Untuk uji kokas, **tag** di pill menunjukkan standar mana yang punya metode. Pill tanpa metode untuk standar yang dipilih dinonaktifkan.", 6200);
  await d.hl(null);

  // expected samples, then submit
  await d.type("#fc-expected", "12");
  await d.hl("#order-form .grid:has(#fc-expected)", 10);
  await d.say("**Sample type**, **Expected samples**, **Due date**, dan **Priority** melengkapi permintaan. Tanggal jatuh tempo disarankan dari lama pengerjaan layanan.", 5600, "top");
  await d.hl(null);
  await d.hl("#fc-draft", 8);
  await d.say("**Save as draft** menyimpan permintaan yang belum lengkap. Yang wajib hanya nama perusahaan.", 4400, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#fc-submit", 1600);

  await d.say("Job order tersimpan dan halaman **Samples** terbuka: berikutnya CSO memasukkan daftar sampel dari klien.", 5200, "top");

  await d.card("Selesai", "Membuat job order", "Berikutnya: daftar sampel", 3000);
};
