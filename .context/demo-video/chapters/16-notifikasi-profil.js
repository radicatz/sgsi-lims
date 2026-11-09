/* Clip 16 · Notifikasi, profil, session timeout · flows AP5, AP6, AP7 · Lab admin, Preparation, CSO */
exports.title = "Notifikasi, profil, session timeout";
exports.run = async (d, page) => {
  await d.startFlow("AP5"); // Lab admin on My work, off camera
  await d.card("Bagian 16 · AP5, AP6, AP7", "Notifikasi, profil, dan session timeout", "Hand-off antar orang, pengaturan pribadi, dan keamanan sesi", 4000);
  await d.cardOff();

  // AP5 notifications
  await d.hl('button[aria-label^="Notifications"]', 10);
  await d.say("Angka merah di ikon lonceng adalah jumlah notifikasi yang belum dibaca. Setiap orang hanya melihat notifikasi untuk perannya.", 6400, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button[aria-label^="Notifications"]', 1000);
  await d.hl("#notif-panel", 6);
  await d.say("Panel memuat tab **All** dan **Unread**. Notifikasi muncul saat pekerjaan berpindah ke orang berikutnya: batch siap diterima, analisis selesai, CoA terbit, atau tenggat dalam 24 jam.", 8000);
  await d.hl(null);
  await d.hush();
  await d.click('#notif-panel button:has-text("Unread")', 1200);
  await d.say("Tab **Unread** hanya memuat yang belum dibaca.", 3600);
  await d.hush();
  await d.click('#notif-panel button:has-text("Mark all read")', 1400);
  await d.say("**Mark all read** menandai semuanya sudah dibaca, dan angka merah pada lonceng hilang.", 5000);
  await d.hush();
  await d.click('#notif-panel button:has-text("See all notifications")', 1500);
  await d.say("**See all notifications** membuka halaman lengkapnya, dengan **Load more** dan tampilan kosong jika semua sudah dibaca.", 6200, "top");
  await d.step({ say: "Satu klik pada notifikasi membuka batch, job order, atau laporan yang dimaksud.", pos: "top", minMs: 4600 },
    () => d.click("main button.row.top >> nth=0", 1600));

  // AP6 profile
  await d.hush();
  await d.say("Sekarang pengaturan pribadi, dari menu pengguna di kanan atas. Kita lihat sebagai **Preparation**.", 5400, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Preparation")', 1500);
  await d.bar(false);
  await d.click('button[aria-label="User menu"]', 1000);
  await d.hl("#user-menu", 6);
  await d.say("Menu pengguna memuat **Profile**, **Notification settings**, dan **Sign out**.", 4800);
  await d.hl(null);
  await d.hush();
  await d.click('#user-menu button:has-text("Profile")', 1600);
  await d.say("Halaman **Profile**: nama, peran, email, dan jabatan yang dicetak pada laporan. Email dan jabatan diubah oleh lab admin.", 6400, "top");
  await d.hush();
  await d.hl('.card:has-text("Layout")', 6);
  await d.say("**Layout** mengatur menu samping (**Expanded** atau **Collapsed**) dan **Start page**, yaitu halaman yang terbuka setelah masuk.", 6400, "top");
  await d.hl(null);
  await d.hush();
  await d.click('main button:text-is("Collapsed")', 1500);
  await d.say("Dengan **Collapsed**, menu samping menjadi deretan ikon.", 3800, "top");
  await d.hush();
  await d.click('main button:text-is("Expanded")', 1200);
  await d.hl("#notif-settings", 6);
  await d.say("Bagian **Notifications** memilih hand-off mana yang sampai ke lonceng. Setiap jenis punya saklar sendiri.", 5600, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#sw-due", 1000);
  await d.click('main button:text-is("Save")', 1400);
  await d.click('main button:has-text("Change password")', 1200);
  await d.say("**Change password** meminta kata sandi saat ini, lalu kata sandi baru dengan aturan dari **Configuration, Security**.", 6200);
  await d.hush();
  await d.type("#cp-cur", "lama12345", 60);
  await d.type("#cp-a", "abc", 70);
  await d.type("#cp-b", "abc", 70);
  await d.click('#pw-dialog button:text-is("Change password")', 1200);
  await d.say("Kata sandi yang terlalu pendek ditolak dengan penjelasan aturannya. Kata sandi yang sah tersimpan dengan pesan **Password changed**.", 6000);
  await d.hush();
  await d.type("#cp-a", "Laboratorium2026", 60);
  await d.type("#cp-b", "Laboratorium2026", 60);
  await d.click('#pw-dialog button:text-is("Change password")', 1400);

  // AP7 session timeout
  await d.hush();
  await d.say("Terakhir, **session timeout**, yang menjaga data laboratorium jika seseorang meninggalkan layar.", 5400, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rbtn:has-text("Spec only")', 1200);
  await d.click('.rpanel button:has-text("Start the session timeout")', 1500);
  await d.bar(false);
  await d.say("Dialog **Still there?** menghitung mundur. Di prototipe hitungannya 60 detik, dan waktunya diatur di **Configuration, Security**.", 7000);
  await d.hush();
  await d.click('button:text-is("Stay signed in")', 1500);
  await d.say("**Stay signed in** melanjutkan sesi, dan perubahan yang belum disimpan tetap ada di halaman. Jika hitungan habis, pengguna keluar otomatis dan layar masuk menjelaskan alasannya.", 8200, "top");

  await d.hush();
  await d.card("Selesai", "Notifikasi, profil, dan session timeout", "Berikutnya: master data", 3000);
};
