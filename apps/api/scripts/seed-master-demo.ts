// Demo master data from the prototype (Master_Data_Prototype_Plan section 6), so the lists show something until the lab's real
// lists arrive (R-08): 9 clients with contacts, 100 drill holes (88 with a CoA file, 12 missing, 3 archived), 9 lithologies, 62 seams.
// Safe to run again: existing rows are kept. Not audited (bulk demo load).
//   pnpm seed:master            load the demo data
//   pnpm seed:master --remove   remove it again (only clients nothing else uses: no job orders)
import { createHash } from "node:crypto";
import { sql, system } from "../src/db";
import { admin } from "../src/supabase";

type Client = [code: string, name: string, status: "active" | "inactive" | "archived", address: string, created: string, contacts: Array<[string, string, string, string, boolean?]>];
const CLIENTS: Client[] = [
  ["BNM", "PT Bara Nusantara Mandiri", "active", "Jl. Mulawarman No. 12, Samarinda, Kalimantan Timur", "2026-01-14", [
    ["Budi Hartono", "Site Geologist", "+62 812 5550 1844", "budi.hartono@baranusa.id", true], ["Sari Wulandari", "Finance", "+62 812 5554 0166", "sari@baranusa.id"], ["Dewi Anggraini", "Purchasing", "+62 811 5550 0192", "dewi@baranusa.id"], ["Rahmat Hidayat", "Lab Coordinator", "+62 812 5550 1901", "rahmat@baranusa.id"]]],
  ["KEP", "PT Kaltara Energi Prima", "active", "Jl. Sudirman No. 45, Tarakan, Kalimantan Utara", "2026-02-03", [
    ["Andi Pratama", "Exploration Manager", "+62 811 5550 3301", "andi.pratama@kaltaraenergi.co.id", true], ["Lukas Wibowo", "Logistics", "+62 811 5550 3310", "lukas@kaltaraenergi.co.id"], ["Maria Sihombing", "Finance", "+62 811 5550 3322", "maria@kaltaraenergi.co.id"]]],
  ["SBH", "CV Sumber Batu Hitam", "active", "Jl. Gatot Subroto No. 8, Balikpapan, Kalimantan Timur", "2026-02-20", [["Joko Santoso", "Director", "+62 812 5550 7781", "joko@sumberbatuhitam.co.id", true], ["Hendra Kusuma", "Site Geologist", "+62 812 5550 7790", "hendra@sumberbatuhitam.co.id"], ["Yuli Astuti", "Finance", "+62 812 5550 7795", "yuli@sumberbatuhitam.co.id"]]],
  ["MCR", "PT Mahakam Coal Resources", "active", "Jl. Pahlawan No. 21, Tenggarong, Kalimantan Timur", "2026-03-09", [["Rudi Hartanto", "Site Geologist", "+62 813 5550 4410", "rudi.h@mahakamcoal.co.id", true], ["Siti Rahmawati", "Purchasing", "+62 813 5550 4422", "siti@mahakamcoal.co.id"], ["Eko Prasetyo", "Logistics", "+62 813 5550 4430", "eko@mahakamcoal.co.id"]]],
  ["PTBA", "PT Bukit Asam Tbk", "active", "Jl. Parigi No. 1, Tanjung Enim, Sumatera Selatan", "2026-04-02", [
    ["Budi Santoso", "Site Geologist", "+62 812 7770 1201", "budi.santoso@bukitasam.co.id", true], ["Rina Ayu Lestari", "Purchasing", "+62 812 7770 1220", "rina.ayu@bukitasam.co.id"], ["Agus Pratama", "QA Manager", "+62 812 7770 1233", "agus.pratama@bukitasam.co.id"]]],
  ["BLC", "PT Berau Lestari Coal", "active", "Jl. Pemuda No. 3, Tanjung Redeb, Kalimantan Timur", "2026-05-11", [["Fajar Nugroho", "Site Manager", "+62 813 5550 8800", "fajar@beraulestari.co.id", true], ["Dian Permata", "Purchasing", "+62 813 5550 8811", "dian@beraulestari.co.id"], ["Bayu Setiawan", "Logistics", "+62 813 5550 8820", "bayu@beraulestari.co.id"]]],
  ["MBS", "CV Mitra Bara Sejahtera", "inactive", "Jl. Ahmad Yani No. 77, Banjarmasin, Kalimantan Selatan", "2026-03-01", [["Hasan Basri", "Owner", "+62 812 5000 1122", "", true], ["Lina Marlina", "Finance", "+62 812 5000 1130", "lina@mitrabara.co.id"], ["Tono Wijaya", "Site Geologist", "+62 812 5000 1141", "tono@mitrabara.co.id"]]],
  ["TSA", "PT Tambang Sentosa Abadi", "archived", "Jl. Diponegoro No. 5, Samarinda", "2026-01-05", [["Wahyu Nugraha", "Site Manager", "+62 811 5550 6601", "wahyu@tambangsentosa.co.id", true], ["Ratna Dewi", "Purchasing", "+62 811 5550 6612", "ratna@tambangsentosa.co.id"], ["Irfan Maulana", "Geologist", "+62 811 5550 6620", "irfan@tambangsentosa.co.id"]]],
  ["KBM", "PT Kutai Batu Mas", "archived", "Jl. Imam Bonjol No. 9, Sangatta", "2026-01-09", [["Gunawan Saputra", "Site Manager", "+62 813 5550 9901", "gunawan@kutaibatumas.co.id", true], ["Nina Kartika", "Finance", "+62 813 5550 9912", "nina@kutaibatumas.co.id"]]],
];
const CODES = CLIENTS.map((c) => c[0]);
const meta = { requestId: "seed-master-demo", screen: "Seed" };

/** A small but valid one-page PDF that says what it is. */
function demoPdf(title: string) {
  const text = `BT /F1 18 Tf 72 720 Td (${title}) Tj 0 -28 Td /F1 11 Tf (Demo file for the SGSI LIMS. Not a real certificate.) Tj ET`;
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let out = "%PDF-1.4\n"; const offs: number[] = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

async function remove() {
  const used = await sql`select c.code from companies c where c.code = any(${CODES}) and exists (select 1 from job_orders j where j.company_id = c.id)`;
  const codes = CODES.filter((c) => !used.some((u) => u.code === c));
  const ids = sql`select id from companies where code = any(${codes})`;
  const logos = await sql`select logo_path from companies where code = any(${codes}) and logo_path is not null`;
  if (logos.length) await admin.storage.from("logos").remove(logos.map((l) => l.logo_path as string));
  const files = await sql`select storage_path from coa_files where drill_hole_id in (select id from drill_holes where company_id in (${ids}))`;
  for (let i = 0; i < files.length; i += 100) await admin.storage.from("coa").remove(files.slice(i, i + 100).map((f) => f.storage_path as string));
  await system(meta, async (tx) => {
    await tx`select set_config('app.skip_audit', 'on', true)`;
    await tx`delete from coa_files where drill_hole_id in (select id from drill_holes where company_id in (${ids}))`;
    for (const t of ["drill_holes", "seams", "lithologies", "company_contacts"]) await tx.unsafe(`delete from ${t} where company_id in (select id from companies where code = any($1))`, [codes]);
    await tx`delete from companies where code = any(${codes})`;
  });
  console.log(`Removed demo master data for ${codes.join(", ")}${used.length ? `; kept ${used.map((u) => u.code).join(", ")} (used by job orders)` : ""}.`);
}

async function load() {
  const [maya] = await sql`select id from profiles where email = 'maya@sgsi.co.id'`;
  const ids: Record<string, string> = {};
  await system(meta, async (tx) => {
    await tx`select set_config('app.skip_audit', 'on', true)`;
    for (const [code, name, status, address, created, contacts] of CLIENTS) {
      const [c] = await tx`insert into companies (code, name, status, address, archived_at, created_at) values (${code}, ${name}, ${status}, ${address}, ${status === "archived" ? created : null}, ${created})
        on conflict (code) do update set name = excluded.name returning id`;
      ids[code] = c!.id as string;
      const [{ n }] = await tx`select count(*)::int as n from company_contacts where company_id = ${c!.id}` as unknown as [{ n: number }];
      if (!n) for (const [full, pos, phone, email, def] of contacts)
        await tx`insert into company_contacts (company_id, full_name, position, phone, email, is_default) values (${c!.id}, ${full}, ${pos}, ${phone}, ${email || null}, ${!!def})`;
    }
    // lithologies (prototype: 9) and seams (6 clients, 62 in all, ordered top to bottom)
    const LITHO: Array<[string, "coal" | "parting" | "no_lithology", string]> = [["Coal", "coal", "BNM"], ["Claystone", "parting", "BNM"], ["Carbonaceous Claystone", "parting", "KEP"], ["Sandstone", "parting", "KEP"],
      ["Siltstone", "parting", "SBH"], ["Mudstone", "parting", "MCR"], ["Shale", "parting", "PTBA"], ["Core loss", "no_lithology", "BNM"], ["Unknown", "no_lithology", "KEP"]];
    for (const [name, kind, cl] of LITHO) await tx`insert into lithologies (company_id, name, kind) values (${ids[cl]!}, ${name}, ${kind}) on conflict (company_id, name) do nothing`;
    const SEAM_CL: Array<[string, number]> = [["BNM", 14], ["KEP", 12], ["SBH", 10], ["MCR", 10], ["PTBA", 9], ["BLC", 7]];
    for (const [ci, [cl, n]] of SEAM_CL.entries()) for (let i = 0; i < n; i++) {
      const L = "ABCDEFG"[Math.floor(i / 3)]!, k = (i % 3) + 1, part = ["upper", "middle", "lower"][i % 3]!;
      await tx`insert into seams (company_id, code, description, sort_order) values (${ids[cl]!}, ${L + (ci + 1) + ["U", "M", "L"][i % 3] + k}, ${`Seam ${L}${ci + 1}, ${part} ${k}`}, ${i + 1}) on conflict (company_id, code) do nothing`;
    }
  });
  // drill holes: 100 across six clients; 12 have no CoA yet and 3 are archived (prototype numbering)
  const DH_CL: Array<[string, number]> = [["BNM", 30], ["KEP", 22], ["SBH", 16], ["MCR", 14], ["PTBA", 12], ["BLC", 6]];
  const missing = new Set([3, 9, 17, 22, 28, 35, 41, 47, 55, 63, 72, 88]), archived = new Set([5, 44, 90]);
  let dn = 0, uploaded = 0;
  for (const [cl, n] of DH_CL) for (let i = 1; i <= n; i++) {
    dn++;
    const code = `DH-${cl}-0${String(i + 4).padStart(2, "0")}`;
    const [row] = await system(meta, async (tx) => {
      await tx`select set_config('app.skip_audit', 'on', true)`;
      return tx`insert into drill_holes (company_id, code, description, archived_at) values (${ids[cl]!}, ${code}, ${`Batch ${1 + (i % 9)}`}, ${archived.has(dn) ? new Date() : null})
        on conflict (company_id, code) do update set code = excluded.code returning id, (select count(*)::int from coa_files f where f.drill_hole_id = drill_holes.id) as files`;
    });
    if (missing.has(dn) || archived.has(dn) || row!.files > 0) continue;
    const pdf = demoPdf(`Certificate of Analysis ${code}`), path = `${row!.id}/demo-${code}.pdf`, name = `CoA-${code.slice(3)}.pdf`;
    const up = await admin.storage.from("coa").upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (up.error) throw up.error;
    const at = new Date(Date.UTC(2026, 5, 1 + dn));
    await system(meta, async (tx) => {
      await tx`select set_config('app.skip_audit', 'on', true)`;
      await tx`insert into coa_files (drill_hole_id, storage_path, file_name, size_bytes, sha256, uploaded_by, uploaded_at) values (${row!.id}, ${path}, ${name}, ${pdf.length}, ${createHash("sha256").update(pdf).digest("hex")}, ${maya?.id ?? null}, ${at})`;
    });
    uploaded++;
  }
  // PT Bukit Asam's logo, as on the prototype's client page
  const logo = new URL("../../../.context/assets/bukit-asam-tbk--600.png", import.meta.url);
  const [ptba] = await sql`select id, logo_path from companies where code = 'PTBA'`;
  if (ptba && !ptba.logo_path) {
    const { readFileSync, existsSync } = await import("node:fs");
    if (existsSync(logo)) {
      const path = `${ptba.id}/demo-ptba.png`;
      const up = await admin.storage.from("logos").upload(path, readFileSync(logo), { contentType: "image/png", upsert: true });
      if (!up.error) await system(meta, async (tx) => { await tx`select set_config('app.skip_audit', 'on', true)`; await tx`update companies set logo_path = ${path} where id = ${ptba.id}`; });
    }
  }
  console.log(`Demo master data ready: ${CLIENTS.length} clients, ${dn} drill holes (${uploaded} CoA files uploaded now), 9 lithologies, 62 seams.`);
}

if (process.argv.includes("--remove")) await remove(); else await load();
await sql.end();
