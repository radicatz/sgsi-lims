/* Clip 05 · Penerimaan sampel · flows BA1, BA2, BA3 · Preparation (Dedi) */
const fs = require("fs"), path = require("path");
const PHOTO = path.join(__dirname, "../out/foto-sampel.png");
exports.title = "Penerimaan sampel";
exports.run = async (d, page) => {
  fs.mkdirSync(path.dirname(PHOTO), { recursive: true });
  fs.writeFileSync(PHOTO, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"));
  const row = (id) => `#reception-table tr:has-text("${id}")`;

  await d.startFlow("BA1"); // Preparation (Dedi) on the Batches list, off camera
  await d.card("Bagian 5 · BA1, BA2, BA3", "Penerimaan sampel", "Tim Preparation mencocokkan sampel yang tiba dengan daftar batch", 3800);
  await d.cardOff();

  // list -> batch
  await d.say("Dedi dari tim **Preparation** membuka **Batches**. Daftar sudah disaring ke **Batches to prepare**, yaitu batch yang menunggu diterima.", 5600, "top");
  await d.hush();
  await d.click('tr:has-text("B-2026-0422")', 1400);
  await d.say("Batch **B-2026-0422** berisi 8 sampel dari job order JO-2026-0137. Tab **Reception** terbuka lebih dulu.", 4800, "top");
  await d.hush();

  // scan
  await d.hl("#scan", 8);
  await d.say("Sampel yang tiba dipindai dengan **Scan or type a label**. Ketik atau pindai ID sampel, lalu tekan Enter.", 5000, "top");
  await d.hl(null);
  await d.type("#scan", "KEP-3301", 90);
  await d.key("Enter"); await page.keyboard.press("Enter"); await d.sleep(900); await d.key(null);
  await d.say("**KEP-3301** langsung ditandai tiba, dengan kondisi awal **Good**.", 3800, "top");

  // tick others
  await d.hush();
  await d.say("Sampel lain dicentang satu per satu di kolom **Arrived**. Tombol **Mark all arrived** mencentang semuanya sekaligus.", 5400, "top");
  await d.hush();
  for (const id of ["KEP-3302", "KEP-3303", "KEP-3304", "KEP-3305", "KEP-3306"])
    await d.click(row(id) + " label.cb", 450);
  await d.hl(row("KEP-3307"), 6);
  await d.say("Dua sampel, **KEP-3307** dan **KEP-3308**, belum tiba. Biarkan tidak dicentang.", 4600, "top");
  await d.hl(null);

  // masses
  await d.hush();
  await d.say("Setiap sampel yang tiba perlu **massa** dalam kg.", 3400, "top");
  const mass = ["2.10", "2.23", "2.36", "2.49", "2.62", "2.75"];
  const ids = ["KEP-3301", "KEP-3302", "KEP-3303", "KEP-3304", "KEP-3305", "KEP-3306"];
  for (let i = 0; i < ids.length; i++) await d.type(`input[aria-label="Mass of ${ids[i]}"]`, mass[i], 60);

  // wet sample + remark
  await d.hush();
  await d.hl(row("KEP-3304"), 6);
  await d.say("**KEP-3304** tiba dalam kondisi basah. Pilih **Condition** selain Good, dan isi **Remarks**. Alasannya wajib.", 5600, "top");
  await d.hl(null);
  await d.select('select[aria-label="Condition of KEP-3304"]', "Wet");
  await d.type('input[aria-label="Remark for KEP-3304"]', "Kantong basah saat tiba", 55);

  // photos
  await d.hush();
  await d.click(row("KEP-3304") + " button.linkbtn:has-text('Add')", 1000);
  await d.say("**Photos**: setiap foto diberi tag, yaitu **Condition**, **Weighing**, atau **Other**. Foto terkunci setelah penerimaan dikonfirmasi.", 6000);
  await d.hush();
  await d.upload(".dz", PHOTO);
  await d.click('.chips .chip:text-is("Weighing")', 600);
  await d.upload(".dz", PHOTO);
  await d.click('button:text-is("Close")', 900);

  // hold
  await d.hush();
  await d.click('button[aria-label="More for KEP-3306"]', 700);
  await d.say("Menu baris punya **Hold**: sampel yang bermasalah ditahan, tetap berada di batch tetapi diabaikan oleh daftar periksa.", 5800, "top");
  await d.hush();
  await d.click('.menu button.mi:has-text("Hold")', 1000);
  await d.hl("#hold-reason", 8);
  await d.say("Pilih alasan penahanan, misalnya **Damaged**. Sampel yang ditahan dicetak sebagai tidak dianalisis pada RoA.", 5400);
  await d.hl(null);
  await d.hush();
  await d.select("#hold-reason", "Damaged");
  await d.click('button:text-is("Hold sample")', 1200);

  // print labels
  await d.hush();
  await d.click("#print-labels", 1000);
  await d.say("**Print labels** mencetak label untuk sampel yang belum punya label. Pilih printer dan jumlah salinan.", 5200);
  await d.hush();
  await d.click("#print-go", 1400);

  // checklist
  await d.hl("div:has(> b:text-is('Before you can confirm reception'))", 8);
  await d.say("Daftar periksa di bawah tabel memastikan semuanya lengkap sebelum penerimaan bisa dikonfirmasi: massa, kondisi, remark, dan label.", 6000, "top");
  await d.hl(null);

  // confirm 6 of 8
  await d.hush();
  await d.click("#confirm-reception", 1000);
  await d.say("Karena dua sampel belum tiba, aplikasi bertanya **Confirm reception with 6 of 8 samples?** Dua sampel itu akan kembali ke job order sebagai **Awaiting arrival**.", 7000);
  await d.hush();
  await d.click('button:text-is("Confirm reception"):not(#confirm-reception)', 1600);
  await d.say("Penerimaan dikonfirmasi dan batch masuk ke **Preparation**. Informasi sampel kini terkunci. Ada **Undo** selama 10 detik.", 6000, "top");

  // back to job order (BA3 idea)
  await d.hush();
  await d.click('.t-data:text-is("JO-2026-0137")', 1400);
  await d.say("Kembali ke job order, tab **Batches** memperingatkan ada sampel yang **menunggu kedatangan**. CSO juga mendapat notifikasi.", 6000, "top");
  await d.hush();
  await d.click('#jo-tabs button:has-text("Samples")', 1200);
  await d.hl("#samples-table", 6);
  await d.say("**KEP-3307** dan **KEP-3308** kini berstatus **Awaiting arrival**, dan menunggu dikirim klien.", 5000, "top");
  await d.hl(null);
  await d.hush();
  await d.click('#jo-tabs button:has-text("Batches")', 1200);
  await d.click("#add-batch", 1200);
  await d.hl("#add-batch-dlg .field:has-text('Samples (')", 8);
  await d.say("Saat sampel susulan tiba, **Add batch** langsung mencentang sampel yang terlambat, lengkap dengan asal batch-nya.", 5800, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#ab-create", 1600);
  await d.say("Sampel susulan masuk ke batch baru dan diterima dengan cara yang sama.", 4400, "top");

  await d.hush();
  await d.card("Selesai", "Penerimaan sampel", "Berikutnya: preparasi", 3000);
};
