// Demo batches for the reception screens (Batch_Build_Design.md section 10; frames 04-02-01 and 04-01-01), until the lab's real batches arrive:
//   B-2026-0422  JO-2026-0137 (PT Kaltara Energi Prima): 8 of the job order's 16 samples, 6 arrived (one wet), 4 labels printed, due tomorrow
//   B-2026-0413  JO-2026-0134 (PT Bara Nusantara Mandiri): 3 samples, nothing arrived, past its deadline
// B-2026-0420 and 0421 on JO-2026-0139 come from `pnpm seed:orders`. Safe to run again. Not audited (bulk demo load). Needs `pnpm seed:orders` first.
//   pnpm seed:batches            load the demo batches (and the 16 samples of JO-2026-0137)
//   pnpm seed:batches --remove   take them out again
import { createHash } from "node:crypto";
import { fixedCarbon } from "@sgsi/shared";
import { sql } from "../src/db";
import { admin } from "../src/supabase";

const BATCHES = ["B-2026-0422", "B-2026-0413", "B-2026-0418", "B-2026-0417"];
const KEP: Array<[string, string, string, number, number]> = Array.from({ length: 16 }, (_, i) => {
  const hole = `DH-KEP-0${31 + Math.floor(i / 4)}`, from = 10 + (i % 4) * 0.35 + Math.floor(i / 4) * 6;
  return [`KEP-33${String(i + 1).padStart(2, "0")}`, ["Ply A1 upper", "Ply A1 lower", "Ply A2", "Ply B1"][i % 4]!, hole, Number(from.toFixed(2)), Number((from + 0.35).toFixed(2))];
});
// [client ref index, mass kg, condition, remark, label printed]
const ARRIVALS: Array<[number, string, string, string | null, boolean]> = [
  [0, "12.40", "Good", null, true], [1, "11.85", "Good", null, true], [2, "13.10", "Wet", "Bag wet on arrival", true], [3, "12.05", "Good", null, true], [4, "9.60", "Good", null, false], [5, "12.75", "Good", null, false],
];

if (process.argv.includes("--remove")) {
  const docs = await sql`select storage_path from batch_documents where batch_id in (select id from batches where batch_no = any(${BATCHES}::text[]))`;
  if (docs.length) await admin.storage.from("batch-documents").remove(docs.map((d) => d.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`delete from analyses where sample_id in (select s.id from samples s join batches b on b.id = s.batch_id where b.batch_no = any(${BATCHES}::text[]))`;
    await tx`update samples set batch_id = null, arrived_at = null, arrived_by = null, sample_no = null, sample_code = null, label_status = 'none', label_print_count = 0, mass_received_kg = null,
      condition = null, condition_remark = null, attributes = attributes - 'labelPrintedAt' where batch_id in (select id from batches where batch_no = any(${BATCHES}::text[]))`;
    await tx`delete from samples where job_order_id in (select id from job_orders where order_no = any(${["JO-2026-0137", "JO-2026-0142"]}::text[]))`;
    const del = await tx`delete from batches where batch_no = any(${BATCHES}::text[]) returning batch_no`;
    console.log(`removed ${del.length} demo batches`);
  });
  await sql.end();
  process.exit(0);
}

const [cso] = await sql`select id from profiles where email = 'rina@sgsi.co.id'`;
const [prep] = await sql`select id from profiles where email = 'dedi@sgsi.co.id'`;
if (!cso || !prep) throw new Error("Run pnpm seed:demo first (the CSO and Preparation accounts are missing).");
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [today] = await tx`select (now() at time zone 'Asia/Makassar')::date::text as d`;
  const day = today!.d as string;

  /* B-2026-0422 */
  const [kep] = await tx`select j.id, j.company_id, c.company_code, j.sample_type from job_orders j join companies c on c.id = j.company_id where j.order_no = 'JO-2026-0137'`;
  if (!kep) throw new Error("JO-2026-0137 is missing: run pnpm seed:orders first.");
  const have = await tx`select client_ref from samples where job_order_id = ${kep.id}`;
  if (!have.length) {
    for (const [i, [ref, descr, hole, from, to]] of KEP.entries())
      await tx`insert into samples (job_order_id, row_no, client_ref, client_description, sample_type, drill_hole_text, depth_from, depth_to) values (${kep.id}, ${i + 1}, ${ref}, ${descr}, ${kep.sample_type}, ${hole}, ${from}, ${to})`;
    console.log("JO-2026-0137: 16 demo samples");
  }
  const [exists] = await tx`select id from batches where batch_no = 'B-2026-0422'`;
  if (!exists) {
    const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, created_at)
      values (${kep.id}, ${kep.company_id}, 'B-2026-0422', ${day}::date - 1, ${day}::date + 1, 'ASTM', 'created', 'RI', ${cso.id}, now() - interval '1 day') returning id`;
    await tx`insert into batch_parameters (batch_id, parameter_id)
      select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${kep.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
    const first8 = await tx`select id, client_ref from samples where job_order_id = ${kep.id} order by row_no limit 8`;
    await tx`update samples set batch_id = ${b!.id} where id = any(${first8.map((s) => s.id as string)}::uuid[])`;
    for (const [idx, mass, cond, remark, printed] of ARRIVALS) {
      const [c] = await tx`insert into sample_counters as c (company_id, branch_code, day, last) values (${kep.company_id}, 'RI', ${day}::date, 1)
        on conflict (company_id, branch_code, day) do update set last = c.last + 1 returning last`;
      const nnn = String(c!.last).padStart(3, "0");
      await tx`update samples set arrived_at = now() - interval '3 hours' + make_interval(mins => ${idx * 4}), arrived_by = ${prep.id},
          sample_no = ${`SG.${day.slice(2, 4)}${day.slice(5, 7)}${day.slice(8, 10)}.${kep.company_code}.RI.${nnn}`}, sample_code = ${`${kep.company_code}.RI.${nnn}.Lot01`},
          mass_received_kg = ${mass}, condition = ${cond}, condition_remark = ${remark}, label_status = ${printed ? "printed" : "none"}, label_print_count = ${printed ? 1 : 0},
          attributes = ${printed ? tx.json({ labelPrintedAt: new Date(Date.now() - 2 * 3600_000).toISOString() } as never) : tx.json({} as never)}
        where id = ${first8[idx]!.id}`;
    }
    await tx`insert into batch_status_log (batch_id, from_status, to_status, action, note, by_user) values (${b!.id}, null, 'created', 'Batch created', '8 samples from JO-2026-0137', ${cso.id})`;
    console.log("B-2026-0422: receiving, 6 of 8 arrived");
  }

  /* B-2026-0413 */
  const [bnm] = await tx`select j.id, j.company_id from job_orders j where j.order_no = 'JO-2026-0134'`;
  const [exists2] = await tx`select id from batches where batch_no = 'B-2026-0413'`;
  if (bnm && !exists2) {
    const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, created_at)
      values (${bnm.id}, ${bnm.company_id}, 'B-2026-0413', ${day}::date - 16, ${day}::date - 4, 'ASTM', 'created', 'RI', ${cso.id}, now() - interval '16 days') returning id`;
    await tx`insert into batch_parameters (batch_id, parameter_id)
      select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${bnm.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
    const three = await tx`select id from samples where job_order_id = ${bnm.id} and batch_id is null and not_received_at is null order by row_no limit 3`;
    await tx`update samples set batch_id = ${b!.id} where id = any(${three.map((s) => s.id as string)}::uuid[])`;
    await tx`insert into batch_status_log (batch_id, from_status, to_status, action, note, by_user) values (${b!.id}, null, 'created', 'Batch created', '3 samples from JO-2026-0134', ${cso.id})`;
    console.log("B-2026-0413: created, past its deadline");
  }
});
// B-2026-0421 (JO-2026-0139) goes to Preparation: its two samples are received with Sample IDs, one has an ADL (frame 04-02-10)
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [b] = await tx`select b.id, b.company_id, b.batch_date::text as day, b.status::text as status, c.company_code from batches b join companies c on c.id = b.company_id where b.batch_no = 'B-2026-0421'`;
  if (!b || b.status !== "created") return;
  const smp = await tx`select id from samples where batch_id = ${b.id} order by row_no`;
  for (const [i, s] of smp.entries()) {
    const [c] = await tx`insert into sample_counters as c (company_id, branch_code, day, last) values (${b.company_id}, 'RI', ${b.day}::date, 1)
      on conflict (company_id, branch_code, day) do update set last = c.last + 1 returning last`;
    const nnn = String(c!.last).padStart(3, "0");
    await tx`update samples set arrived_at = ${b.day}::date + time '10:00', arrived_by = ${prep.id}, received_at = ${b.day}::date + time '10:30', received_by = ${prep.id},
        sample_no = ${`SG.${b.day.slice(2, 4)}${b.day.slice(5, 7)}${b.day.slice(8, 10)}.${b.company_code}.RI.${nnn}`}, sample_code = ${`${b.company_code}.RI.${nnn}.Lot01`},
        mass_received_kg = ${i ? "9.20" : "10.40"}, condition = 'Good', label_status = 'printed', label_print_count = 1 where id = ${s.id}`;
  }
  await tx`update batches set status = 'preparation', reception_confirmed_at = ${b.day}::date + time '10:30', reception_confirmed_by = ${prep.id}, expected_at_confirm = ${smp.length} where id = ${b.id}`;
  await tx`insert into batch_status_log (batch_id, from_status, to_status, action, note, by_user) values (${b.id}, 'created', 'preparation', 'Reception confirmed', ${`Confirmed with ${smp.length} samples`}, ${prep.id})`;
  if (smp[0]) {
    const [adl] = await tx`select id from parameters where code = 'ADL'`;
    const [a] = await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at) values (${smp[0].id}, ${adl!.id}, 1, 'entered', 'entered', ${prep.id}, now() - interval '1 hour') returning id`;
    await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, 'ar', 8.42, true)`;
  }
  console.log("B-2026-0421: preparation, 1 of 2 ADL saved");
});

/* Analysis demo (frames 04-02-12): B-2026-0420 with 18 of 24 values, B-2026-0418 (JO-2026-0142, six samples) with 26 of 36, one Ash and one GCV out of range */
const VALUES = (i: number): Record<string, string> => ({
  TM: (17.2 + (i % 5) * 0.8).toFixed(2), IM: (8.1 + (i % 4) * 0.45).toFixed(2), ASH: (5.2 + (i % 6) * 1.1).toFixed(2), VM: (38.4 + (i % 5) * 0.9).toFixed(2),
  TS: (0.31 + (i % 4) * 0.12).toFixed(2), GCV: String(5480 + (i % 7) * 60),
});
async function putValues(tx: typeof sql, sampleId: string, vals: Record<string, string>, byId: string, hoursAgo: number) {
  const ps = await tx`select id, code, measured_basis from parameters where code = any(${[...Object.keys(vals), "FC"]}::text[])`;
  const withFc = { ...vals } as Record<string, string>;
  const fc = fixedCarbon(vals.IM, vals.ASH, vals.VM);
  const all: Array<[string, string, string]> = Object.entries(withFc).map(([c, v]) => [c, v, "entered"]);
  if (fc && ps.some((p) => p.code === "FC")) all.push(["FC", fc, "calculated"]);
  for (const [code, v, source] of all) {
    const p = ps.find((x) => x.code === code);
    if (!p) continue;
    const [have] = await tx`select id from analyses where sample_id = ${sampleId} and parameter_id = ${p.id} and item_id is null and round = 1`;
    if (have) continue;
    const [a] = await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at) values (${sampleId}, ${p.id}, 1, ${source}, 'entered', ${byId}, now() - make_interval(hours => ${hoursAgo})) returning id`;
    await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, ${p.measured_basis ?? "adb"}, ${v}, true)`;
  }
}
const [ana] = await sql`select id from profiles where email = 'fitri@sgsi.co.id'`;
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [b20] = await tx`select id, status::text as status from batches where batch_no = 'B-2026-0420'`;
  if (b20?.status === "analysis" && ana) {
    const smp = await tx`select id from samples where batch_id = ${b20.id} and received_at is not null order by row_no limit 3`;
    for (const [i, s] of smp.entries()) await putValues(tx as never, s.id as string, VALUES(i), ana.id as string, 30 - i);
    if (smp.length) console.log("B-2026-0420: analysis, 18 of 24 values");
  }
  const [jo] = await tx`select j.id, j.company_id, c.company_code from job_orders j join companies c on c.id = j.company_id where j.order_no = 'JO-2026-0142'`;
  if (!jo || !ana) return;
  const [has] = await tx`select id from batches where batch_no = 'B-2026-0418'`;
  if (has) return;
  const [haveS] = await tx`select 1 from samples where job_order_id = ${jo.id} limit 1`;
  if (!haveS) {
    for (let i = 0; i < 6; i++)
      await tx`insert into samples (job_order_id, row_no, client_ref, client_description, sample_type, drill_hole_text, depth_from, depth_to)
        values (${jo.id}, ${i + 1}, ${`BNM-${3413 + i}`}, ${["Ply A1 upper", "Ply A1 lower", "Ply A2", "Ply B1", "Ply B2", "Ply C"][i]!}, 'Core', ${`DH-BNM-0${21 + Math.floor(i / 3)}`}, ${12 + i * 0.4}, ${12.4 + i * 0.4})`;
    console.log("JO-2026-0142: 6 demo samples");
  }
  const [jday] = await tx`select (now() at time zone 'Asia/Makassar')::date::text as d`;
  const day = jday!.d as string;
  const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, created_at,
      reception_confirmed_at, reception_confirmed_by, prep_finished_at, prep_finished_by, analysis_started_at, analysis_started_by)
    values (${jo.id}, ${jo.company_id}, 'B-2026-0418', ${day}::date - 6, ${day}::date + 3, 'ASTM', 'analysis', 'RI', ${cso.id}, now() - interval '6 days',
      now() - interval '5 days', ${prep.id}, now() - interval '4 days', ${prep.id}, now() - interval '3 days', ${ana.id}) returning id`;
  await tx`insert into batch_parameters (batch_id, parameter_id) select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${jo.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
  const six = await tx`select id from samples where job_order_id = ${jo.id} order by row_no limit 6`;
  await tx`update samples set batch_id = ${b!.id} where id = any(${six.map((s) => s.id as string)}::uuid[])`;
  for (const [i, s] of six.entries()) {
    const [c] = await tx`insert into sample_counters as c (company_id, branch_code, day, last) values (${jo.company_id}, 'RI', ${day}::date, 1) on conflict (company_id, branch_code, day) do update set last = c.last + 1 returning last`;
    const nnn = String(c!.last).padStart(3, "0");
    await tx`update samples set arrived_at = now() - interval '5 days', arrived_by = ${prep.id}, received_at = now() - interval '5 days', received_by = ${prep.id},
        sample_no = ${`SG.${day.slice(2, 4)}${day.slice(5, 7)}${day.slice(8, 10)}.${jo.company_code}.RI.${nnn}`}, sample_code = ${`${jo.company_code}.RI.${nnn}.Lot01`},
        mass_received_kg = 9.8, condition = 'Good', label_status = 'printed', label_print_count = 1 where id = ${s.id}`;
    const v = VALUES(i + 2);
    if (i === 2) { v.ASH = "47.30"; v.GCV = "2310"; }          // BNM-3415: Ash and GCV outside the typical range
    const mine = i < 4 ? v : i === 4 ? { TM: v.TM, IM: v.IM } : {};
    if (Object.keys(mine).length) await putValues(tx as never, s.id as string, mine as Record<string, string>, ana.id as string, 20 - i);
  }
  for (const [f, t, a] of [[null, "created", "Batch created"], ["created", "preparation", "Reception confirmed"], ["preparation", "prep_finished", "Preparation finished"], ["prep_finished", "analysis", "Analysis started"]] as const)
    await tx`insert into batch_status_log (batch_id, from_status, to_status, action, by_user) values (${b!.id}, ${f}::batch_status, ${t}::batch_status, ${a}, ${t === "analysis" ? ana.id : t === "created" ? cso.id : prep.id})`;
  console.log("B-2026-0418: analysis, 26 of 36 values, Ash and GCV out of range");
});

/* B-2026-0417: a completed batch with its signed RoA (frame 04-02-14), twelve more samples of JO-2026-0142 */
const [adm] = await sql`select id from profiles where email = 'maya@sgsi.co.id'`;
const [jo2] = await sql`select j.id, j.company_id, c.company_code from job_orders j join companies c on c.id = j.company_id where j.order_no = 'JO-2026-0142'`;
const [done] = await sql`select id from batches where batch_no = 'B-2026-0417'`;
if (jo2 && adm && ana && !done) {
  const pdf = Buffer.from(["%PDF-1.4", "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj", "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj", "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj", "trailer<</Root 1 0 R>>", "%%EOF", ""].join(String.fromCharCode(10)));
  const path = `demo/RoA-0417-${Date.now()}.pdf`;
  const up = await admin.storage.from("batch-documents").upload(path, pdf, { contentType: "application/pdf" });
  if (up.error) throw up.error;
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    const [d] = await tx`select (now() at time zone 'Asia/Makassar')::date::text as d`;
    const day = d!.d as string;
    for (let i = 6; i < 18; i++)
      await tx`insert into samples (job_order_id, row_no, client_ref, client_description, sample_type, drill_hole_text, depth_from, depth_to)
        values (${jo2.id}, ${i + 1}, ${`BNM-${3413 + i}`}, ${["Ply A1 upper", "Ply A1 lower", "Ply A2", "Ply B1"][i % 4]!}, 'Core', ${`DH-BNM-0${21 + Math.floor(i / 3)}`}, ${12 + i * 0.4}, ${12.4 + i * 0.4})`;
    const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, created_at,
        reception_confirmed_at, reception_confirmed_by, prep_finished_at, prep_finished_by, analysis_started_at, analysis_started_by, analysis_finished_at, analysis_finished_by, completed_at, completed_by)
      values (${jo2.id}, ${jo2.company_id}, 'B-2026-0417', ${day}::date - 12, ${day}::date - 2, 'ASTM', 'completed', 'RI', ${cso.id}, now() - interval '12 days',
        now() - interval '11 days', ${prep.id}, now() - interval '10 days', ${prep.id}, now() - interval '9 days', ${ana.id}, now() - interval '5 days', ${ana.id}, now() - interval '4 days', ${adm.id}) returning id`;
    await tx`insert into batch_parameters (batch_id, parameter_id) select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${jo2.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
    const twelve = await tx`select id from samples where job_order_id = ${jo2.id} and row_no > 6 order by row_no`;
    await tx`update samples set batch_id = ${b!.id} where id = any(${twelve.map((s) => s.id as string)}::uuid[])`;
    for (const [i, s] of twelve.entries()) {
      const [c] = await tx`insert into sample_counters as c (company_id, branch_code, day, last) values (${jo2.company_id}, 'RI', ${day}::date, 1) on conflict (company_id, branch_code, day) do update set last = c.last + 1 returning last`;
      const nnn = String(c!.last).padStart(3, "0");
      await tx`update samples set arrived_at = now() - interval '11 days', arrived_by = ${prep.id}, received_at = now() - interval '11 days', received_by = ${prep.id},
          sample_no = ${`SG.${day.slice(2, 4)}${day.slice(5, 7)}${day.slice(8, 10)}.${jo2.company_code}.RI.${nnn}`}, sample_code = ${`${jo2.company_code}.RI.${nnn}.Lot01`},
          mass_received_kg = 9.4, condition = 'Good', label_status = 'printed', label_print_count = 1 where id = ${s.id}`;
      await putValues(tx as never, s.id as string, VALUES(i + 9), ana.id as string, 120 - i);
    }
    await tx`update analyses set status = 'verified' where sample_id = any(${twelve.map((s) => s.id as string)}::uuid[])`;
    await tx`insert into batch_documents (batch_id, kind, roa_no, storage_path, file_name, size_bytes, sha256, uploaded_by, uploaded_at)
      values (${b!.id}, 'signed_roa', 'RoA-0417', ${path}, 'RoA-0417.pdf', ${pdf.length}, ${createHash("sha256").update(pdf).digest("hex")}, ${adm.id}, now() - interval '4 days')`;
    for (const [f, t, a, who] of [[null, "created", "Batch created", cso.id], ["created", "preparation", "Reception confirmed", prep.id], ["preparation", "prep_finished", "Preparation finished", prep.id],
      ["prep_finished", "analysis", "Analysis started", ana.id], ["analysis", "analysis_finished", "Analysis finished", ana.id], ["analysis_finished", "completed", "Batch completed", adm.id]] as const)
      await tx`insert into batch_status_log (batch_id, from_status, to_status, action, by_user) values (${b!.id}, ${f}::batch_status, ${t}::batch_status, ${a}, ${who})`;
    console.log("B-2026-0417: completed, 12 samples, RoA-0417 attached");
  });
}

// the batches seed:orders made (0420, 0421) get the job order's parameters, as Add batch would have given them
await sql`select set_config('app.skip_audit','on',false)`;
const fixed = await sql`insert into batch_parameters (batch_id, parameter_id)
  select b.id, x.parameter_id from batches b join job_order_parameters x on x.job_order_id = b.job_order_id join parameters p on p.id = x.parameter_id
  where p.code <> all(${["PREP", "ADL"]}::text[]) and not exists (select 1 from batch_parameters bp where bp.batch_id = b.id)
  on conflict do nothing returning batch_id`;
if (fixed.length) console.log(`parameters added to ${new Set(fixed.map((f) => f.batch_id)).size} demo batches`);
await sql.end();
