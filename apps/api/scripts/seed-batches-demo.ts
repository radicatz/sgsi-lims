// Demo batches for the reception screens (Batch_Build_Design.md section 10; frames 04-02-01 and 04-01-01), until the lab's real batches arrive:
//   B-2026-0422  JO-2026-0137 (PT Kaltara Energi Prima): 8 of the job order's 16 samples, 6 arrived (one wet), 4 labels printed, due tomorrow
//   B-2026-0413  JO-2026-0134 (PT Bara Nusantara Mandiri): 3 samples, nothing arrived, past its deadline
// B-2026-0420 and 0421 on JO-2026-0139 come from `pnpm seed:orders`. Safe to run again. Not audited (bulk demo load). Needs `pnpm seed:orders` first.
//   pnpm seed:batches            load the demo batches (and the 16 samples of JO-2026-0137)
//   pnpm seed:batches --remove   take them out again
import { sql } from "../src/db";

const BATCHES = ["B-2026-0422", "B-2026-0413"];
const KEP: Array<[string, string, string, number, number]> = Array.from({ length: 16 }, (_, i) => {
  const hole = `DH-KEP-0${31 + Math.floor(i / 4)}`, from = 10 + (i % 4) * 0.35 + Math.floor(i / 4) * 6;
  return [`KEP-33${String(i + 1).padStart(2, "0")}`, ["Ply A1 upper", "Ply A1 lower", "Ply A2", "Ply B1"][i % 4]!, hole, Number(from.toFixed(2)), Number((from + 0.35).toFixed(2))];
});
// [client ref index, mass kg, condition, remark, label printed]
const ARRIVALS: Array<[number, string, string, string | null, boolean]> = [
  [0, "12.40", "Good", null, true], [1, "11.85", "Good", null, true], [2, "13.10", "Wet", "Bag wet on arrival", true], [3, "12.05", "Good", null, true], [4, "9.60", "Good", null, false], [5, "12.75", "Good", null, false],
];

if (process.argv.includes("--remove")) {
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`update samples set batch_id = null, arrived_at = null, arrived_by = null, sample_no = null, sample_code = null, label_status = 'none', label_print_count = 0, mass_received_kg = null,
      condition = null, condition_remark = null, attributes = attributes - 'labelPrintedAt' where batch_id in (select id from batches where batch_no = any(${BATCHES}::text[]))`;
    await tx`delete from samples where job_order_id in (select id from job_orders where order_no = 'JO-2026-0137')`;
    const del = await tx`delete from batches where batch_no = any(${BATCHES}::text[]) returning batch_no`;
    console.log(`removed ${del.length} demo batches`);
  });
  // the batches seed:orders made (0420, 0421) get the job order's parameters, as Add batch would have given them
await sql`select set_config('app.skip_audit','on',false)`;
const fixed = await sql`insert into batch_parameters (batch_id, parameter_id)
  select b.id, x.parameter_id from batches b join job_order_parameters x on x.job_order_id = b.job_order_id join parameters p on p.id = x.parameter_id
  where p.code <> all(${["PREP", "ADL"]}::text[]) and not exists (select 1 from batch_parameters bp where bp.batch_id = b.id)
  on conflict do nothing returning batch_id`;
if (fixed.length) console.log(`parameters added to ${new Set(fixed.map((f) => f.batch_id)).size} demo batches`);
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
// the batches seed:orders made (0420, 0421) get the job order's parameters, as Add batch would have given them
await sql`select set_config('app.skip_audit','on',false)`;
const fixed = await sql`insert into batch_parameters (batch_id, parameter_id)
  select b.id, x.parameter_id from batches b join job_order_parameters x on x.job_order_id = b.job_order_id join parameters p on p.id = x.parameter_id
  where p.code <> all(${["PREP", "ADL"]}::text[]) and not exists (select 1 from batch_parameters bp where bp.batch_id = b.id)
  on conflict do nothing returning batch_id`;
if (fixed.length) console.log(`parameters added to ${new Set(fixed.map((f) => f.batch_id)).size} demo batches`);
await sql.end();
