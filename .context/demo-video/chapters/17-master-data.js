/* Clip 17 · Master data · flows MD1, MD2, MD3 · CSO (Rina), then Lab admin, Supervisor */
exports.title = "Master data";
exports.run = async (d, page) => {
  await d.startFlow("MD1"); // CSO on Clients, off camera
  await d.card("Bagian 17 · MD1, MD2, MD3", "Master data", "Klien, drill hole, litologi, dan seam", 3800);
  await d.cardOff();

  // MD1 clients
  await d.say("**Clients** adalah daftar perusahaan klien, dengan logo, kode, alamat, status, dan jumlah sampel.", 5400, "top");
  await d.hl("main table", 6);
  await d.sleep(1400);
  await d.hl(null);
  await d.say("Tab **Active**, **Inactive**, dan **Archived** menyaring daftar. CSO dan superadmin dapat menambah, mengubah, mengarsipkan, atau menghapus klien yang belum dipakai.", 7200, "top");
  await d.hush();
  await d.click('tr:has-text("PT Bara Nusantara Mandiri")', 1800);
  await d.say("**Halaman klien** memuat detail perusahaan, daftar **kontak**, dan job order serta sertifikat milik klien tersebut.", 6000, "top");
  await d.hush();
  await d.click("#add-contact", 1200);
  await d.say("**Add contact**: nama, jabatan, telepon, email, dan saklar **Default contact**. Kontak default terisi otomatis sebagai Attention pada job order baru.", 7000);
  await d.hush();
  await d.type("#ct-name", "Maria Sinaga", 70);
  await d.click("#ct-def", 900);
  await d.click("#ct-save", 1500);
  await d.say("Maria Sinaga kini menjadi kontak default. Menu **⋯** pada setiap kontak memuat **Edit**, **Make default**, dan **Archive**.", 6200, "top");
  await d.hush();
  await d.go("orders");
  await d.click("#new-jo", 1200);
  await d.type("#fc-company", "Bara", 80);
  await d.click('.menu button.mi:has-text("PT Bara Nusantara Mandiri")', 1200);
  await d.hl("#fc-contact", 8);
  await d.say("Pada job order baru, kontak default langsung terpilih untuk perusahaan ini, jadi CSO tidak perlu mencarinya lagi.", 5800);
  await d.hl(null);
  await d.hush();
  await d.click('button:text-is("Cancel")', 900);
  await d.click('button:text-is("Discard")', 900);

  // MD2 drill hole
  await d.say("Berikutnya **Drill hole**, yang dikelola oleh lab admin. Kita pindah peran.", 4600, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Lab admin")', 1500);
  await d.bar(false);
  await d.go("drill-holes");
  await d.say("Daftar drill hole memuat kode, deskripsi, jumlah sampel, perusahaan, dan status **CoA**.", 5000, "top");
  await d.hush();
  await d.click('main button:has-text("Missing CoA")', 1400);
  await d.hl('button[id^="up-"] >> nth=0', 10);
  await d.say("Chip **Missing CoA** menyaring drill hole yang belum punya CoA. Tombol **Upload CoA** ada di setiap baris.", 5800, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button[id^="up-"] >> nth=0', 1200);
  await d.say("Dialog unggah menerima berkas CoA dari klien. Di prototipe, tautan **Use a sample CoA file** menggantikan file asli.", 5800);
  await d.hush();
  await d.click("#cu-sample", 1200);
  await d.click("#cu-upload", 1600);
  await d.say("CoA terpasang pada drill hole dan muncul di dashboard Quality. Untuk mengganti, tombolnya berubah menjadi **Replace CoA**, dan menu **⋯** memuat **CoA history**.", 7000, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Supervisor")', 1500);
  await d.bar(false);
  await d.go("drill-holes");
  await d.say("**Supervisor** dan manajer hanya bisa **membaca** drill hole: tombol unggah dan ubah tidak ada.", 5400, "top");

  // MD3 lithology and seam
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Lab admin")', 1500);
  await d.bar(false);
  await d.go("lithologies");
  await d.say("**Lithology** memuat nama litologi dan jenisnya: **Coal**, **Parting**, atau **No lithology**, dengan tab per jenis.", 6200, "top");
  await d.hush();
  await d.click('tr:has-text("Carbonaceous Claystone") button.linkbtn:text-is("Edit")', 1400);
  await d.say("Jenis litologi bisa diubah di dialog **Edit lithology**. Perubahan ini langsung berlaku di tempat litologi dipakai.", 5800);
  await d.hush();
  await d.click('#simple-form :text-is("Coal")', 1000);
  await d.click("#sf-save", 1600);
  await d.go("seams");
  await d.say("**Seam** memuat kode, deskripsi, urutan, dan perusahaan. Lab admin menambah seam dengan tombol **Add seam**.", 5800, "top");
  await d.hush();
  await d.click('main button:has-text("Add seam")', 1200);
  await d.type("#sf-code", "A2U4", 80);
  await d.click("#sf-save", 1600);
  await d.say("Seam baru muncul di daftar. Seam, litologi, dan drill hole yang tidak lagi dipakai diarsipkan, bukan dihapus, agar riwayat tetap utuh.", 6600, "top");

  await d.hush();
  await d.card("Selesai", "Master data", "Berikutnya: admin", 3000);
};
