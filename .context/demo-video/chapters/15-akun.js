/* Clip 15 · Akun · flows AP3, AP4, AP2 · reset password, invite, then lockout (lockout last: the failed-attempt count is kept in the browser) */
exports.title = "Akun";
exports.run = async (d, page) => {
  await d.startFlow("AP3"); // Forgot password screen, off camera
  await d.card("Bagian 15 · AP3, AP4, AP2", "Akun dan kata sandi", "Lupa kata sandi, undangan akun baru, dan penguncian akun", 4000);
  await d.cardOff();

  // AP3 forgot password
  await d.say("Jika lupa kata sandi, pengguna memakai layar **Reset your password**. Cukup memasukkan email kerja.", 5400, "top");
  await d.hush();
  await d.hl("#fp-email", 8);
  await d.sleep(1200);
  await d.hl(null);
  await d.click('button:text-is("Send reset link")', 1600);
  await d.say("Aplikasi menjawab dengan **Check your email**. Tautan reset berlaku 60 menit, dan tombol kirim ulang menunggu hitungan mundur.", 6600, "top");
  await d.hush();
  await d.hl("text=Demo: open the reset link", 8);
  await d.say("Di prototipe, email tidak benar-benar dikirim. Tautannya ditampilkan di layar sebagai pengganti.", 5000, "top");
  await d.hl(null);
  await d.hush();
  await d.click('a.link:text-is("open the reset link")', 1500);
  await d.say("Layar **Set a new password**. Aturan kata sandi diambil dari **Configuration, Security**: minimal 10 karakter, dengan huruf dan angka.", 6400, "top");
  await d.hush();
  await d.type("#np1", "abc", 80);
  await d.type("#np2", "abc", 80);
  await d.click('button:text-is("Set password")', 1200);
  await d.say("Kata sandi yang terlalu pendek ditolak, dengan penjelasan aturannya.", 4600, "top");
  await d.hush();
  await d.type("#np1", "Laboratorium2026", 70);
  await d.type("#np2", "Laboratorium2026", 70);
  await d.click('button:text-is("Set password")', 1600);
  await d.say("Kata sandi baru tersimpan, dan pengguna kembali ke layar masuk.", 4400, "top");

  // AP4 invite
  await d.hush();
  await d.card("AP4", "Menerima undangan", "Pengguna baru mengatur kata sandi pertamanya", 3200);
  await d.startFlow("AP4"); // invite link of Sari Anggraini, behind the card
  await d.cardOff();
  await d.say("Pengguna baru menerima email undangan. Tautannya membuka layar **Welcome**, dengan nama dan email akunnya.", 6000, "top");
  await d.hush();
  await d.type("#np1", "Analisis2026!", 70);
  await d.type("#np2", "Analisis2026!", 70);
  await d.click('button:has-text("Set password and sign in")', 1800);
  await d.say("Akun berubah dari **Invited** menjadi **Active**, dan pengguna langsung masuk ke halaman awal peran **Analyst**.", 6000, "top");

  // AP2 lockout
  await d.hush();
  await d.card("AP2", "Salah kata sandi dan penguncian", "Perlindungan terhadap percobaan masuk yang berulang", 3200);
  await d.startFlow("AP2"); // sign-in screen, behind the card
  await d.cardOff();
  await d.say("Layar masuk melindungi akun. Kita coba kata sandi yang salah, yaitu \"wrong\".", 5000, "top");
  await d.hush();
  await d.type("#si-pw", "wrong", 90);
  await d.click("#si-submit", 1400);
  await d.say("Pesan **The email or password is not correct** muncul. Percobaan berikutnya diulang.", 4600, "top");
  await d.hush();
  for (let i = 0; i < 3; i++) await d.click("#si-submit", 700);
  await d.say("Setelah beberapa kali salah, aplikasi menghitung percobaan. Batasnya diatur di **Configuration, Security**.", 5400, "top");
  await d.hush();
  await d.click("#si-submit", 1500);
  await d.hl(".alert, [role=alert]", 8).catch(() => {});
  await d.say("Pada percobaan kelima akun **terkunci**: tombol masuk dinonaktifkan, dan ada pilihan **Reset** kata sandi.", 6000, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button.linkbtn:text-is("Reset")', 1600);
  await d.say("Dari sini pengguna meminta tautan reset, dan siklus yang sama berulang.", 4400, "top");

  await d.hush();
  await d.card("Selesai", "Akun dan kata sandi", "Berikutnya: notifikasi, profil, dan session timeout", 3000);
};
