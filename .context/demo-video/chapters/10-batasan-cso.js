/* Clip 10 · Batasan CSO · flow BA6 · CSO (Rina) */
const CARD = (t) => `xpath=//*[normalize-space(text())="${t}"]/ancestor::*[contains(concat(" ",normalize-space(@class)," ")," card ")][1]`;
exports.title = "Batasan CSO";
exports.run = async (d, page) => {
  await d.startFlow("BA6"); // CSO on B-2026-0418, Analysis tab, off camera
  await d.card("Bagian 10 · BA6", "Batasan CSO", "Apa yang sengaja tidak dilihat oleh CSO", 3800);
  await d.cardOff();

  await d.say("CSO berurusan dengan klien, bukan dengan angka laboratorium. Mari lihat batasan yang dipasang pada perannya.", 5400, "top");
  await d.hush();
  await d.hl('.card:has-text("values saved")', 6);
  await d.say("Tab **Analysis** milik CSO hanya menampilkan **kemajuan**, misalnya \"26 of 42 values saved\". Nilai hasil uji tidak ditampilkan.", 6600, "top");
  await d.hl(null);
  await d.say("Keterangan di kartu menjelaskan alasannya: nilai hanya untuk laboratorium, dan CoA membawa hasil yang sudah disetujui.", 5600, "top");
  await d.hush();

  // RoA plain text
  await d.go("batch-B-2026-0416-analysis");
  await d.say("Untuk batch yang sudah selesai, kartu **Signed RoA** hanya menampilkan **nomor RoA** sebagai teks biasa.", 5600, "top");
  await d.hl(CARD("Signed RoA"), 6);
  await d.sleep(1500);
  await d.hl(null);
  await d.hush();
  await d.say("RoA bersifat internal. File RoA yang sudah ditandatangani tidak bisa dibuka atau diunduh oleh CSO.", 5000, "top");
  await d.hush();
  await d.go("roa-RoA-0416");
  await d.say("Jika CSO mencoba membuka RoA lewat tautan langsung, aplikasi menolak: **You don't have access to this page**.", 5800, "top");
  await d.hush();
  await d.click('button:has-text("Go to My work")', 900);

  // reports list
  await d.go("reports");
  await d.say("Halaman **Reports** milik CSO hanya memuat **CoA**, yaitu dokumen yang memang dikirim ke klien. Tab RoA tidak ada.", 6200, "top");
  await d.hl("main .chips", 6);
  await d.sleep(1200);
  await d.hl(null);

  // sidebar
  await d.hush();
  await d.hl("nav.side", 4);
  await d.say("Pembatasan lain mengikuti peran: menu **Users**, **Configuration**, dan **Audit log** tidak muncul sama sekali di menu CSO.", 6200, "top");
  await d.hl(null);

  await d.hush();
  await d.card("Selesai", "Batasan CSO", "Berikutnya: My work dan Dashboard", 3000);
};
