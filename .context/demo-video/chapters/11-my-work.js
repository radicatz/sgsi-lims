/* Clip 11 · My work · flow MW1 · Preparation (Dedi)
   Every step uses d.step: the caption and its highlight appear together, the action runs while they are shown. */
exports.title = "My work";
exports.run = async (d, page) => {
  await d.startFlow("MW1"); // Preparation (Dedi) on My work, off camera
  await d.card("Bagian 11 · MW1", "My work", "Satu halaman untuk pekerjaan yang menunggu setiap orang", 3800);
  await d.cardOff();

  await d.step({ say: "**My work** adalah halaman awal untuk Preparation, CSO, lab admin, dan analis. Isinya hanya pekerjaan milik orang yang sedang masuk.", pos: "top" });
  await d.step({ say: "Angka di samping **My work** pada menu adalah jumlah semua pekerjaan terbuka milik Dedi.", pos: "top", hl: "nav.side .cnt", pad: 10 });
  await d.step({ say: "Setiap antrean punya satu kartu: jumlah batch, **batch tertua yang menunggu**, dan jumlah yang sudah lewat tenggat, berwarna merah.", pos: "top", hl: "#q-receive", pad: 6, minMs: 6400 });
  await d.step({ say: "**Recent activity** menunjukkan apa yang baru dikerjakan orang lain di laboratorium.", pos: "top", hl: '.card:has-text("Recent activity")', pad: 6 });

  // open the queue: the caption is up while the click happens
  await d.step({ say: "Kartu membuka antreannya. **Batches to receive** memuat batch yang menunggu diterima oleh tim Preparation.", pos: "top", minMs: 5400 },
    () => d.click("#q-receive", 1200));
  await d.step({ say: "Tab di atas berpindah antar antrean milik Dedi, dengan jumlahnya.", pos: "top", hl: "main .tabs", pad: 6, minMs: 4200 });
  await d.step({ say: "Di bawahnya ada **pencarian**, filter perusahaan, dan **Past due only**.", pos: "top", hl: 'main .row:has(label.cb:has-text("Past due only"))', pad: 6, minMs: 4200 });
  await d.step({ say: "Dengan **Past due only**, antrean hanya menampilkan yang sudah melewati tenggat.", pos: "top", minMs: 4200 },
    () => d.click('main label.cb:has-text("Past due only")', 1200));
  await d.step({ say: "Mematikannya lagi menampilkan semua batch yang menunggu.", pos: "top", minMs: 3200 },
    () => d.click('main label.cb:has-text("Past due only")', 1000));

  await d.step({ say: "Tombol di ujung baris, **Open reception**, langsung membuka batch pada langkah yang tepat.", pos: "top", hl: 'button[id^="act-"] >> nth=0', pad: 10, minMs: 4600 });
  await d.step({ say: "Batch terbuka di tab **Reception**, siap diterima. Dari sini alurnya berlanjut seperti pada bagian penerimaan sampel.", pos: "top", minMs: 5600 },
    () => d.click('button[id^="act-"] >> nth=0', 1200));

  await d.card("Selesai", "My work", "Berikutnya: Dashboard", 3000);
};
