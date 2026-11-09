/* Clip 13 · Pencarian · flows SE1, SE2, SE3 · Lab admin, then Supervisor */
exports.title = "Pencarian";
exports.run = async (d, page) => {
  await d.startFlow("SE1"); // Lab admin on the Dashboard, off camera
  await d.card("Bagian 13 · SE1, SE2, SE3", "Pencarian", "Menemukan sampel, batch, laporan, dan riwayatnya", 3800);
  await d.cardOff();

  // SE1 quick search
  await d.say("Kolom pencarian di bilah atas ada di setiap halaman. Tekan **/** dari mana saja untuk langsung mengetik di sana.", 5400);
  await d.key("/"); await page.keyboard.press("/"); await d.sleep(1200); await d.key(null);
  await d.hl("#quick-panel", 6);
  await d.say("Panel menampilkan **pencarian terakhir**. Ketik atau pindai ID sampel, kode lab, batch, job order, laporan, klien, atau drill hole.", 6600);
  await d.hl(null);
  await d.hush();
  await d.type("#quick-search", "BNM-3507", 90);
  await d.hl("#quick-panel", 6);
  await d.say("Hasil dikelompokkan menurut jenis, dan hanya memuat yang boleh dibuka oleh peran ini. Tekan **Enter** untuk membuka hasil yang cocok persis.", 6400);
  await d.hl(null);
  await d.hush();
  await d.key("Enter"); await page.keyboard.press("Enter"); await d.sleep(1600); await d.key(null);
  await d.say("**Sample history** menampilkan perjalanan satu sampel: terdaftar, masuk batch, diterima, ADL, analisis, tercantum di RoA, dan di CoA.", 7000, "top");
  await d.hush();
  await d.hl('button:has-text("View values")', 10);
  await d.say("**View values** menampilkan nilai hasil uji, kecuali untuk CSO. **Export PDF** mengunduh riwayatnya.", 5400, "top");
  await d.hl(null);
  await d.hush();

  // SE2 advanced search
  await d.step({ say: "Untuk pencarian yang lebih rinci, ada **Advanced search**. Jalannya lewat kolom pencarian yang sama: klik kolomnya.", pos: "top", minMs: 5200 },
    async () => { await page.evaluate(() => document.activeElement && document.activeElement.blur()); await d.click("#quick-search", 1000); }); // the box keeps focus after Enter; it opens its panel only when focused
  await d.step({ say: "Di bagian bawah panel ada pilihan **Advanced search**. Klik untuk membukanya.", hl: '#quick-panel :text("Advanced search")', pad: 8, minMs: 4200 });
  await d.click('#quick-panel :text("Advanced search")', 1600);
  await d.hl('.card:has-text("Saved queries")', 6);
  await d.say("Di kiri ada **Saved queries**: milik sendiri dan yang dibagikan staf lain. Kita buka **High-ash BNM samples**.", 5600, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button.linkbtn:has-text("High-ash BNM samples")', 1500);
  await d.hl('.card:has-text("Conditions")', 6);
  await d.say("Pencarian dibangun dari **kondisi**: bidang, operator, dan nilai. **Match** menentukan apakah semua kondisi harus terpenuhi atau salah satu saja.", 7000, "top");
  await d.hl(null);
  await d.hush();
  await d.click('button:text-is("Any")', 1500);
  await d.say("Dengan **Any**, hasil memuat sampel yang cocok dengan salah satu kondisi, jadi jumlahnya bertambah.", 5000, "top");
  await d.hush();
  await d.click('button:has-text("Columns")', 900);
  await d.step({ say: "Tombol **Columns** membuka daftar kolom yang ditampilkan dan diekspor. Halaman digulir agar daftarnya terlihat penuh.", pos: "top", hl: '.menu:has-text("Sample ID")', pad: 8, minMs: 5600 });
  await d.click('button:has-text("Columns")', 900);
  await d.click('button:has-text("Save query")', 1000);
  await d.say("**Save query** menyimpan pencarian, dan bisa dibagikan ke staf lain agar mereka dapat menjalankan dan menduplikasinya.", 6000);
  await d.hush();
  await d.type("#sq-name", "Kadar abu tinggi BNM (revisi)", 60);
  await d.click("#sq-save", 1400);
  await d.click('button:has-text("Export")', 1400);
  await d.say("**Export** mengunduh hasil sebagai CSV. Setiap query tersimpan punya menu **Rename**, **Duplicate**, **Share**, dan **Delete**.", 6200, "top");

  // SE3
  await d.hush();
  await d.say("Terakhir, hubungan antara riwayat sampel dan audit log, yang dilihat oleh **Supervisor**.", 5000, "top");
  await d.hush();
  await d.bar(true);
  await d.click('.rseg button:text-is("Supervisor")', 1500);
  await d.bar(false);
  await d.go("sample-BNM-3507");
  await d.hl("#to-audit", 10);
  await d.say("Tombol **Audit** hanya ada untuk peran yang boleh membaca audit log: superadmin, supervisor, dan manajer.", 5600, "top");
  await d.hl(null);
  await d.hush();
  await d.click("#to-audit", 1800);
  await d.hl("#audit-rows", 6);
  await d.say("Audit log terbuka dan sudah disaring ke sampel itu: siapa mengubah apa, dan kapan.", 5200, "top");
  await d.hl(null);

  await d.hush();
  await d.card("Selesai", "Pencarian", "Berikutnya: pengelolaan job order", 3000);
};
