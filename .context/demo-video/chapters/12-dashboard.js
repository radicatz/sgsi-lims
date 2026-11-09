/* Clip 12 · Dashboard · flows DB1, DB2 · Lab admin, Supervisor, CSO */
const CARD = (t) => `xpath=//*[normalize-space(text())="${t}"]/ancestor::*[contains(concat(" ",normalize-space(@class)," ")," card ")][1]`;
exports.title = "Dashboard";
exports.run = async (d, page) => {
  await d.startFlow("DB1"); // Lab admin on the Dashboard, off camera
  await d.card("Bagian 12 · DB1, DB2", "Dashboard", "Gambaran laboratorium: pekerjaan berjalan dan kualitas hasil", 3800);
  await d.cardOff();

  await d.say("**Dashboard** memberi gambaran seluruh laboratorium. Tab **Operations** menunjukkan pekerjaan yang sedang berjalan.", 5600, "top");
  await d.hush();
  await d.hl("div.grid:has(> .kpi)", 6);
  await d.say("Empat kartu utama: **Batches in progress**, **Due this week** (dengan yang sudah lewat tenggat), **Samples received** (dibanding periode sebelumnya), dan **Mean turnaround** terhadap target 5 hari.", 8000, "top");
  await d.hl(null);
  await d.hush();

  await d.hl("#db-period", 8);
  await d.say("**Period** dan **Company** menyaring semua kartu sekaligus.", 3800, "top");
  await d.hl(null);
  await d.hush();
  await d.select("#db-period", "7");
  await d.say("Dengan 7 hari terakhir, semua angka dihitung ulang.", 3400, "top");
  await d.hush();
  await d.select("#db-period", "30");

  await d.hl(CARD("Batch workflow"), 6);
  await d.say("**Batch workflow** menghitung batch di setiap langkah, dari Created sampai Completed. **Job orders by status** dan **Sample type mix** melengkapinya.", 7000, "top");
  await d.hl(null);
  await d.hush();
  await d.move('svg[aria-label="Samples received per day"] g >> nth=12');
  await d.say("Grafik **Samples received per day** menyorot hari ini. Arahkan kursor ke batang untuk melihat jumlah sampel pada hari itu.", 6000, "top");
  await d.hush();

  await d.hl("#active-batches", 6);
  await d.say("**Active batches** menampilkan batch yang belum selesai. Warna tenggat menandai yang sudah lewat atau jatuh tempo dalam 24 jam.", 6400, "top");
  await d.hl(null);
  await d.hush();
  await d.click('#active-batches .chip:has-text("Late")', 1200);
  await d.say("Chip **Due** dan **Late** menyaring daftar. Satu klik pada baris membuka batch-nya.", 5000, "top");
  await d.hush();
  await d.click('#active-batches .chip:has-text("All")', 900);
  await d.hl(".callout", 8);
  await d.say("**Deadline alert** muncul saat ada batch yang jatuh tempo dalam 24 jam, dengan tombol **Open batch**.", 5600, "top");
  await d.hl(null);
  await d.hush();

  // roles
  await d.say("Dashboard menyesuaikan diri dengan peran. Sekarang **Supervisor**.", 4000, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Supervisor")', 1500);
  await d.bar(false);
  await d.hl("#db-tabs", 6);
  await d.say("Supervisor, manajer, lab admin, dan superadmin melihat dua tab: **Operations** dan **Quality & reports**.", 5600, "top");
  await d.hl(null);
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("CSO")', 1500);
  await d.bar(false);
  await d.go("dashboard");
  await d.say("**CSO** hanya melihat tab Operations, tanpa tab Quality & reports. Kartu **Your queues** di atas membawa ke **My work**.", 6200, "top");
  await d.hush();

  // DB2
  await d.bar(true);
  await d.click('.rseg button:text-is("Lab admin")', 1500);
  await d.bar(false);
  await d.go("dashboard-quality");
  await d.say("Tab **Quality & reports** menunjukkan kualitas hasil uji dan kelengkapan laporan.", 5000, "top");
  await d.hush();
  await d.hl("div.grid:has(> .kpi)", 6);
  await d.say("Kartunya: batch selesai, RoA yang diunggah, **drill hole yang sudah punya CoA**, dan jumlah determinasi.", 5800, "top");
  await d.hl(null);
  await d.hush();
  await d.move('svg[aria-label="CV vs Ash"] circle >> nth=6');
  await d.say("Grafik sebar **CV vs Ash** menampilkan garis tren dan nilai R². Arahkan kursor ke titik untuk melihat sampel, nilai, dan drill hole-nya.", 7000, "top");
  await d.hush();
  await d.hl(CARD("Trend CV"), 6);
  await d.say("**Trend CV** menampilkan nilai kalori per batch terhadap batas, dan bisa diganti basisnya.", 5000, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button:text-is("AR")', 1500);
  await d.say("Dengan basis **AR**, garis dan batas ikut berubah.", 3600, "top");
  await d.hush();

  await d.hl(CARD("Drill holes"), 6);
  await d.say("Tabel **Drill holes** memantau kelengkapan CoA per drill hole.", 4600, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button:has-text("Missing CoA")', 1400);
  await d.hl('button:has-text("Upload CoA") >> nth=0', 10);
  await d.say("Chip **Missing CoA** menyaring yang belum punya CoA. Lab admin dan superadmin dapat **Upload CoA** langsung dari sini.", 6400, "top");
  await d.hl(null);

  await d.hush();
  await d.card("Selesai", "Dashboard", "Berikutnya: pencarian", 3000);
};
