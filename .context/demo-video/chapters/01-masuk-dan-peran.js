/* Clip 01 · Masuk & peran · flows AP1, AP8 · CSO, then the role switcher */
exports.title = "Masuk & peran";
exports.run = async (d, page) => {
  await d.startFlow("AP1"); // off camera, under the card
  await d.card("Bagian 1 · AP1, AP8", "Masuk & peran", "Cara masuk, tujuh peran, dan apa yang berubah di setiap peran", 3800);
  await d.cardOff();

  // sign in
  await d.say("Ini layar **Sign in** SGSI LIMS. Semua data di prototipe ini adalah data demo.", 3200);
  await d.hl("#si-email"); await d.say("Masukkan email: kita masuk sebagai **Rina Kartika**, peran **CSO**.", 2400);
  await d.hl(null);
  await d.type("#si-email", "rina@sgsi.co.id");
  await d.type("#si-pw", "demo1234");
  await d.say("Di prototipe, kata sandi apa pun diterima. Klik **Sign in**.", 2600);
  await d.click("#si-submit", 1500);

  // landing + sidebar
  await d.say("CSO langsung masuk ke **My work**: pekerjaan milik Rina sendiri.", 3000);
  await d.hl("nav.side", 4);
  await d.say("Menu di sisi kiri mengikuti peran. CSO melihat **My work**, **Dashboard**, **Job orders**, **Batches**, **Reports**, **Search**, dan **Clients**.", 5000);
  await d.hl(null);

  // role switcher
  await d.say("Bilah gelap di atas hanya untuk demo, bukan bagian dari aplikasi. Tombol **Role** berpindah ke peran lain.", 4500);
  await d.bar(true);
  await d.hl(".rseg >> nth=1", 6);
  await d.sleep(1200); await d.hl(null);

  const tour = [
    ["Lab admin", "**Lab admin** (Maya Lestari) mulai di **My work**, dan bisa mengelola Drill hole, Lithology, dan Seam."],
    ["Supervisor", "**Supervisor** (Hendra Wijaya) mulai di **Dashboard**, dan bisa membuka **Audit log**. Job orders hanya bisa dibaca."],
    ["Manager", "**Manager**, Kepala Laboratorium, juga mulai di **Dashboard** dengan akses baca ke sebagian besar halaman."],
    ["Preparation", "**Preparation** (Dedi Kurniawan): fokus pada penerimaan sampel dan preparasi di **Batches**."],
    ["Analyst", "**Analyst** (Fitri Handayani): fokus mengisi hasil analisis, dan melihat **RoA** di Reports."],
    ["Superadmin", "**Superadmin** (Wahyu Pratama) melihat semuanya, termasuk **Users**, **Configuration**, dan **Audit log**."],
  ];
  for (const [label, text] of tour) {
    await d.hush();
    await d.click(`.rseg button:text-is("${label}")`, 1500);
    await d.hl("nav.side", 4);
    await d.say(text, 3800);
    await d.hl(null);
  }

  // AP8: no access
  await d.click('.rseg button:text-is("CSO")', 900);
  await d.bar(false);
  await d.say("Bagaimana jika CSO membuka halaman yang bukan haknya? Misalnya **Users**, lewat tautan langsung.", 4200);
  await d.go("users");
  await d.hl("main .page", 0);
  await d.hl(null);
  await d.say("Aplikasi menampilkan **You don't have access to this page**, bukan data apa pun.", 3600);
  await d.click('button:has-text("Go to My work")', 900);
  await d.say("Tombol di sini membawa pengguna kembali ke halaman awalnya.", 3000);

  await d.card("Selesai", "Masuk & peran", "Berikutnya: membuat job order sebagai CSO", 3000);
};
