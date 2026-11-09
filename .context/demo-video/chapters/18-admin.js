/* Clip 18 · Admin · flows AD1, AD2, AD3, AD4 · Superadmin (Wahyu), Supervisor (Hendra) */
exports.title = "Admin";
exports.run = async (d, page) => {
  await d.startFlow("AD1"); // Superadmin on Users, off camera
  await d.card("Bagian 18 · AD1 – AD4", "Admin", "Pengguna, peran, audit log, dan konfigurasi", 3800);
  await d.cardOff();

  // AD1 users
  await d.say("Halaman **Users** hanya untuk superadmin. Daftarnya memuat nama, email, peran, status, dan sign-in terakhir.", 6000, "top");
  await d.hl("main table", 6);
  await d.sleep(1200);
  await d.hl(null);
  await d.say("Status pengguna: **Active**, **Invited**, **Inactive**, dan **Locked**, masing-masing dengan chip penyaring.", 5000, "top");
  await d.hush();
  await d.click('main button:has-text("Roles")', 1400);
  await d.say("Tab **Roles** adalah tabel baca-saja tentang apa yang boleh dilakukan setiap peran. Peran bersifat tetap di versi 1, dan seseorang bisa memegang beberapa peran.", 7400, "top");
  await d.hush();
  await d.click('main button:has-text("Users")', 1200);
  await d.click("#add-user", 1200);
  await d.type("#uf-name", "Sari Anggraini", 70);
  await d.type("#uf-email", "sari.anggraini@sgsi.co.id", 55);
  await d.click('[id="role-analyst"]', 800);
  await d.click('[id="role-prep"]', 900);
  await d.say("Formulir **Add user**: nama, email, jabatan, dan **kartu peran** dengan satu baris penjelasan. Dua peran dicentang, dan izinnya menjumlah.", 7000);
  await d.hush();
  await d.click("#uf-save", 1800);
  await d.say("**Send invite** mengirim tautan untuk mengatur kata sandi. Pengguna baru berstatus **Invited** sampai ia menerima undangannya.", 6000, "top");

  // AD2
  await d.hush();
  await d.go("user-u7");
  await d.say("Halaman pengguna **Bagus Prasetyo** menunjukkan akunnya **terkunci** setelah beberapa kali salah memasukkan kata sandi.", 6200, "top");
  await d.hl("#unlock", 10);
  await d.say("Superadmin dapat membuka kuncinya dengan **Unlock**, tanpa menunggu waktu penguncian berakhir.", 5200, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#unlock", 1500);
  await d.hl("#open-audit", 10);
  await d.say("Kartu **Recent activity** memuat aktivitas pengguna, dan **Open in audit log** membuka audit log yang sudah disaring ke orang ini.", 6400, "top");
  await d.hl(null);
  await d.hush();
  await d.go("users");
  await d.type("#us-q", "Joko", 90);
  await d.click('button[aria-label="Actions for Joko Santoso"]', 1000);
  await d.say("**Deactivate** mencabut kemampuan masuk, tetapi riwayat pekerjaan orang itu tetap ada.", 5000, "top");
  await d.hush();
  await d.click('.menu button.mi:has-text("Deactivate")', 1200);
  await d.say("Aplikasi meminta konfirmasi: pengguna tidak bisa masuk lagi, tetapi pekerjaan dan riwayatnya tetap tersimpan.", 5200);
  await d.hush();
  await d.click('button:text-is("Deactivate"):not([role="menuitem"])', 1600);
  await d.type("#us-q", "Wahyu", 90);
  await d.click('button[aria-label="Actions for Wahyu Pratama"]', 1000);
  await d.click('.menu button.mi:has-text("Deactivate")', 1400);
  await d.say("Menonaktifkan **Superadmin terakhir** diblokir, supaya aplikasi tidak pernah kehilangan satu-satunya pengelola.", 6200);
  await d.hush();
  await d.click('button:text-is("Cancel"), button:text-is("Close"), button:text-is("OK")', 900).catch(() => {});

  // AD3 audit
  await d.say("**Audit log** dapat dibuka oleh superadmin, supervisor, dan manajer. Kita lihat sebagai **Supervisor**.", 5600, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Supervisor")', 1500);
  await d.bar(false);
  await d.go("audit");
  await d.say("Audit log mencatat siapa mengubah apa, dan kapan, di seluruh aplikasi.", 4600, "top");
  await d.hush();
  await d.hl("#al-q", 8);
  await d.say("Cari berdasarkan nomor rekaman, lalu saring dengan **Date**, **User**, **Record type**, dan **Action**.", 5600, "top");
  await d.hl(null);
  await d.hush();
  await d.select("#al-user", "Maya Lestari");
  await d.say("Dengan filter **User**, daftar hanya memuat perubahan oleh satu orang.", 4200, "top");
  await d.hush();
  await d.click("#audit-rows button >> nth=0", 1400);
  await d.say("Baris yang dibuka menunjukkan nilai **sebelum** dan **sesudah**, serta layar tempat perubahan dibuat.", 5400, "top");
  await d.hush();
  await d.click('main button:has-text("Export CSV")', 1500);
  await d.say("**Export CSV** mengunduh hasil yang sedang tampil.", 4200, "top");

  // AD4 configuration
  await d.hush();
  await d.say("Terakhir, **Configuration**: pengaturan yang memengaruhi seluruh aplikasi, hanya untuk superadmin.", 5400, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Superadmin")', 1500);
  await d.bar(false);
  await d.go("config");
  await d.type("#cfg-q", "ash", 90);
  await d.say("Pencarian di bagian atas menemukan pengaturan di semua bagian, misalnya parameter **Ash** beserta rentang tipikalnya yang dipakai untuk peringatan di tab Analysis.", 7400, "top");
  await d.hush();
  await d.click("#cfg-q", 500); await page.keyboard.press("Control+A"); await page.keyboard.press("Delete"); await d.sleep(500); // clear the search: it is kept between sections
  await d.go("config-lookups");
  await d.say("**Lookups** adalah daftar pilihan yang dipakai di aplikasi: kondisi sampel, alasan hold, tag foto, jenis litologi, dan cara pengiriman.", 6600, "top");
  await d.hush();
  await d.click('main button:has-text("Add value")', 1200);
  await d.type("#lk-v", "Berjamur", 80);
  await d.click("#lk-save", 1600);
  await d.say("Nilai baru, kondisi sampel **Berjamur**, langsung muncul di tempat ia dipakai, misalnya daftar **Condition** pada tab Reception.", 6600, "top");
  await d.hush();
  await d.go("config-security");
  await d.say("**Security** mengatur penguncian akun, batas waktu sesi, aturan kata sandi, dan masa berlaku tautan.", 6000, "top");
  await d.hush();
  await d.type("#set-warn", "20", 90);
  await d.click("#settings-save", 1600);
  await d.say("Nilai **Warn before** diubah menjadi 20 detik. Dialog session timeout dan layar masuk memakai nilai ini langsung.", 6200, "top");

  await d.hush();
  await d.card("Selesai", "Admin", "Berikutnya: tablet, ponsel, dan tema gelap", 3000);
};
