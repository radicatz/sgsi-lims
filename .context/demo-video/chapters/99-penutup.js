/* Clip 99 · Penutup · what is not in v1, how to give feedback · Superadmin */
exports.title = "Penutup";
exports.run = async (d, page) => {
  await d.startFlow("AD4"); // Superadmin on the Configuration hub, off camera
  await d.card("Penutup", "Yang belum ada, dan cara memberi tanggapan", "Ringkasan akhir demo prototipe SGSI LIMS", 4000);
  await d.cardOff();

  await d.step({ say: "Prototipe ini adalah **model yang bisa diklik** dari layar-layar versi 1, dengan data demo. Ini bukan sistem yang sebenarnya.", pos: "top", minMs: 5600 });
  await d.step({ say: "Beberapa hal memang belum masuk versi 1. Di **Configuration**, **Result tabs** dan **Field definitions** ditandai **Next goal**.", pos: "top", hl: 'div.card:has(b:text-is("Result tabs"))', pad: 10, minMs: 6200 });

  await d.bar(true);
  await d.click('.rbtn:has-text("Spec only")', 1200);
  await d.step({ say: "Daftar **Spec only** menjelaskan apa yang hanya ditampilkan prototipe: PDF contoh, cetak, email, impor, dan **Input ROA** serta **Review ROA** yang disembunyikan.", pos: undefined, hl: ".rpanel", pad: 0, minMs: 8200 });
  await d.click('.rbtn:has-text("Spec only")', 900);
  await d.bar(false);

  await d.step({ say: "Yang belum ada di versi 1: lembar kerja **Input ROA** dan **Review ROA**, wizard **Import**, **Result tabs** dan **Field definitions** di Configuration, serta portal klien.", pos: "top", minMs: 8000 });
  await d.step({ say: "Cetak, email, dan PDF di prototipe hanya berupa pesan atau berkas contoh, karena halaman tidak bisa membuka printer atau mengirim email.", pos: "top", minMs: 6400 });

  await d.go("batch-B-2026-0422-reception");
  await d.key("#batch-B-2026-0422-reception");
  await d.step({ say: "Untuk memberi tanggapan, catat **tautan layar**, yaitu bagian setelah tanda **#** di bilah alamat, dan **peran** yang sedang dipakai.", pos: "top", minMs: 7000 });
  await d.key(null);
  await d.step({ say: "Dengan dua hal itu, setiap catatan bisa langsung dibuka kembali di layar yang sama, dengan peran yang sama.", pos: "top", minMs: 5400 });

  await d.card("Terima kasih", "SGSI LIMS", "Prototipe v2, demo dengan data contoh. Tanggapan Anda menentukan pengembangan berikutnya.", 6000);
};
