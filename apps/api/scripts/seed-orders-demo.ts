// Demo job orders from the prototype (Job_Order_Prototype_Plan section 7), so the list and the detail show something until the lab's
// real job orders arrive (R-20). 14 job orders for the demo clients, in every status the app can show, and the samples of frames 03-03-06
// and 07 (JO-2026-0134 expected, JO-2026-0139 in the five states with two batches). Safe to run again: existing numbers are kept, and a
// job order that already has samples gets none. Not audited (bulk demo load). Needs `pnpm seed:master` first.
//   pnpm seed:orders            load the demo job orders and samples
//   pnpm seed:orders --remove   remove them again (with their samples, the two demo batches and the files rows)
import { sql } from "../src/db";

type Std = "ASTM" | "ISO" | "GBT";
// [no, client code, PO, service code or null (custom), standards, expected, sample type, due in days (negative = past), status, created days ago, contact index]
const ORDERS: Array<[string, string, string, string | null, Std[], number, string, number, string, number, number]> = [
  ["JO-2026-0130", "PTBA", "PTBA-2210", "basic", ["ASTM"], 11, "Exploration cores", -20, "reported", 40, 0],
  ["JO-2026-0131", "BNM", "PO 4500-2198", "basic", ["ASTM"], 4, "Exploration cores", -12, "delivered", 32, 0],
  ["JO-2026-0132", "SBH", "SBH-0902", "prox", ["ASTM"], 8, "Channel samples", -9, "closed", 30, 0],
  ["JO-2026-0133", "KEP", "KEP-109", "basic", ["ASTM"], 10, "Exploration cores", -6, "delivered", 27, 0],
  ["JO-2026-0134", "BNM", "PO 4500-2241", "basic", ["ASTM"], 6, "Exploration cores", 10, "awaiting_samples", 8, 0],
  ["JO-2026-0135", "MCR", "MCR-2199", "prep", ["ASTM"], 5, "Stockpile", 5, "cancelled", 12, 0],
  ["JO-2026-0136", "SBH", "SBH-0940", "prox", ["ASTM"], 0, "Exploration cores", 9, "draft", 5, 0],
  ["JO-2026-0137", "KEP", "KEP-121", "coking", ["ASTM", "GBT"], 16, "Exploration cores", 7, "awaiting_samples", 6, 0],
  ["JO-2026-0138", "BNM", "PO 4500-2230", "basic", ["ASTM"], 12, "Exploration cores", 0, "reported", 22, 0],
  ["JO-2026-0139", "MCR", "MCR-2207", "basic", ["ASTM"], 10, "Exploration cores", -1, "in_progress", 18, 0],
  ["JO-2026-0140", "SBH", "SBH-0931", "full", ["ASTM"], 24, "Exploration cores", 1, "delivered", 20, 0],
  ["JO-2026-0141", "KEP", "KEP-118", "basic", ["ASTM"], 8, "Exploration cores", 2, "reported", 16, 1],
  ["JO-2026-0142", "BNM", "PO 4500-2231", "basic", ["ASTM"], 12, "Exploration cores", 3, "in_progress", 14, 0],
  ["JO-2026-0143", "PTBA", "PTBA-2260", null, ["ISO"], 6, "Shipment", 12, "draft", 2, 0],
];
const NOS = ORDERS.map((o) => o[0]);

// Demo samples (slice B, frames 03-03-06 and 07). The client references keep the frames' values; a received sample gets its Sample ID and
// sample code in the C-18 format (company code, branch RI, the day's running number). [ref, description, hole, from, to, remarks, state]
type DemoState = "expected" | "received" | "in_batch" | "awaiting" | "not_received";
const SAMPLES: Record<string, { batches?: Array<[string, string, number]>; rows: Array<[string, string, string, number, number, string, DemoState, string?]> }> = {
  "JO-2026-0134": { rows: [
    ["BNM-3401", "Ply A1 upper", "DH-BNM-021", 14.2, 14.55, "Composite", "expected"], ["BNM-3402", "Ply A1 lower", "DH-BNM-021", 14.55, 14.9, "", "expected"],
    ["BNM-3403", "Ply A2", "DH-BNM-021", 16.1, 16.45, "Composite", "expected"], ["BNM-3404", "Ply B1", "DH-BNM-022", 8.2, 8.55, "", "expected"],
    ["BNM-3405", "Ply B2", "DH-BNM-022", 9.0, 9.35, "Composite", "expected"], ["BNM-3406", "Ply C", "DH-BNM-022", 11.1, 11.4, "", "expected"],
  ] },
  // [batch no, status, days ago it was made]
  "JO-2026-0139": { batches: [["B-2026-0420", "analysis", 12], ["B-2026-0421", "created", 2]], rows: [
    ["BNM-3501", "Ply A1 upper", "DH-MCR-011", 6.2, 6.55, "Composite", "received", "B-2026-0420"], ["BNM-3502", "Ply A1 lower", "DH-MCR-011", 6.55, 6.9, "", "received", "B-2026-0420"],
    ["BNM-3503", "Ply A2", "DH-MCR-011", 8.1, 8.45, "Composite", "received", "B-2026-0420"], ["BNM-3504", "Ply B1", "DH-MCR-012", 3.4, 3.75, "", "received", "B-2026-0420"],
    ["BNM-3505", "Ply B2", "DH-MCR-012", 4.0, 4.35, "Composite", "in_batch", "B-2026-0421"], ["BNM-3506", "Ply C", "DH-MCR-012", 5.1, 5.4, "", "in_batch", "B-2026-0421"],
    ["BNM-3507", "Ply D1", "DH-MCR-013", 2.2, 2.55, "", "awaiting", "B-2026-0420"], ["BNM-3508", "Ply D2", "DH-MCR-013", 2.55, 2.9, "Composite", "not_received"],
  ] },
};
const BATCH_NOS = Object.values(SAMPLES).flatMap((s) => (s.batches ?? []).map((b) => b[0]));

if (process.argv.includes("--remove")) {
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`delete from samples where job_order_id in (select id from job_orders where order_no = any(${NOS}::text[]))`;
    await tx`delete from batches where batch_no = any(${BATCH_NOS}::text[]) or job_order_id in (select id from job_orders where order_no = any(${NOS}::text[]))`;   // also the batches of pnpm seed:batches
    const del = await tx`delete from job_orders where order_no = any(${NOS}::text[]) returning order_no`;
    console.log(`removed ${del.length} demo job orders`);
  });
  await sql.end();
  process.exit(0);
}

const [cso] = await sql`select id from profiles where email = 'rina@sgsi.co.id'`;
const [mgr] = await sql`select p.id, p.full_name, p.title from profiles p join user_roles ur on ur.user_id = p.id join roles r on r.id = ur.role_id where r.code = 'manager' and p.status = 'active' limit 1`;
if (!cso) throw new Error("Run pnpm seed:demo first (the CSO account is missing).");
let made = 0;
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  for (const [no, code, po, service, standards, expected, sampleType, dueIn, status, ago, ci] of ORDERS) {
    const [have] = await tx`select 1 from job_orders where order_no = ${no}`;
    if (have) continue;
    const [co] = await tx`select id from companies where code = ${code}`;
    if (!co) { console.log(`skip ${no}: client ${code} is missing (run pnpm seed:master)`); continue; }
    const contacts = await tx`select id from company_contacts where company_id = ${co.id} and archived_at is null order by is_default desc, full_name`;
    const [sv] = service ? await tx`select id from services where code = ${service} and status = 'active'` : [];
    const submitted = status !== "draft";
    const [jo] = await tx`insert into job_orders (order_no, company_id, contact_id, client_reference, service_id, standards, preparation, expected_samples, sample_type, due_on, priority,
        signatory_id, signatory_name, signatory_title, status, cso_id, submitted_at, closed_at, cancelled_at, cancel_reason, created_by, created_at)
      values (${no}, ${co.id}, ${contacts[ci]?.id ?? contacts[0]?.id ?? null}, ${po}, ${sv?.id ?? null}, ${standards}::standard_family[], true, ${expected || null}, ${sampleType},
        current_date + ${dueIn}::int, 'Standard', ${mgr?.id ?? null}, ${mgr?.full_name ?? null}, ${mgr?.title ?? "Laboratory Manager"}, ${status}::order_status, ${cso.id},
        ${submitted ? tx`now() - make_interval(days => ${ago})` : null}, ${status === "closed" ? tx`now() - interval '3 days'` : null},
        ${status === "cancelled" ? tx`now() - interval '2 days'` : null}, ${status === "cancelled" ? "The client postponed the drilling" : null}, ${cso.id}, now() - make_interval(days => ${ago}))
      returning id`;
    // the service's parameters (plus Preparation, which is a pill of its own), or a custom set for the order without a service
    const codes = service ? null : ["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV", "NCV", "C", "H", "N"];
    await tx`insert into job_order_parameters (job_order_id, parameter_id)
      select ${jo!.id}, p.id from parameters p where p.active and (
        ${sv ? tx`p.id in (select parameter_id from service_parameters where service_id = ${sv.id}) or p.code = 'PREP'` : tx`p.code = any(${codes!}::text[])`})`;
    // the preset items of a chosen group (Ash analysis, Trace elements)
    await tx`insert into job_order_group_items (job_order_id, item_id)
      select ${jo!.id}, i.id from parameter_group_items i where i.is_preset and i.parameter_id in (select parameter_id from job_order_parameters where job_order_id = ${jo!.id})`;
    made++;
  }
});
console.log(`loaded ${made} demo job orders (${NOS.length - made} already there)`);

// the demo samples, for job orders that have none yet
const [prep] = await sql`select id from profiles where email = 'dedi@sgsi.co.id'`;
let filled = 0;
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  for (const [no, spec] of Object.entries(SAMPLES)) {
    const [jo] = await tx`select j.id, j.company_id, j.sample_type, c.company_code from job_orders j join companies c on c.id = j.company_id where j.order_no = ${no}`;
    if (!jo || (await tx`select 1 from samples where job_order_id = ${jo.id} limit 1`).length) continue;
    const batch = new Map<string, { id: string; day: string }>();
    for (const [bno, status, ago] of spec.batches ?? []) {
      const started = status !== "created";
      const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code,
          reception_confirmed_at, reception_confirmed_by, prep_finished_at, prep_finished_by, analysis_started_at, analysis_started_by, created_by, created_at)
        values (${jo.id}, ${jo.company_id}, ${bno}, current_date - ${ago}::int, current_date - ${ago}::int + 10, 'ASTM', ${status}::batch_status, 'RI',
          ${started ? tx`now() - make_interval(days => ${ago})` : null}, ${started ? prep?.id ?? null : null},
          ${started ? tx`now() - make_interval(days => ${ago - 1})` : null}, ${started ? prep?.id ?? null : null},
          ${started ? tx`now() - make_interval(days => ${ago - 1})` : null}, ${started ? prep?.id ?? null : null}, ${cso.id}, now() - make_interval(days => ${ago}))
        on conflict (batch_no) do update set batch_no = excluded.batch_no returning id, batch_date::text as day`;
      batch.set(bno, { id: b!.id, day: b!.day });
    }
    let n = 0;
    for (const [i, [ref, descr, hole, from, to, remarks, state, bno]] of spec.rows.entries()) {
      const b = bno ? batch.get(bno) : undefined;
      let sampleNo: string | null = null, code: string | null = null;
      if (state === "received" && b) {
        const [c] = await tx`insert into sample_counters as c (company_id, branch_code, day, last) values (${jo.company_id}, 'RI', ${b.day}, 1)
          on conflict (company_id, branch_code, day) do update set last = c.last + 1 returning last`;
        const nnn = String(c!.last).padStart(3, "0");
        sampleNo = `SG.${b.day.slice(2, 4)}${b.day.slice(5, 7)}${b.day.slice(8, 10)}.${jo.company_code}.RI.${nnn}`;
        code = `${jo.company_code}.RI.${nnn}.Lot01`;
      }
      const [s] = await tx`insert into samples (job_order_id, row_no, client_ref, client_description, sample_type, remarks, drill_hole_text, depth_from, depth_to,
          batch_id, released_from_batch_id, released_at, received_at, received_by, arrived_at, arrived_by, sample_no, sample_code, label_status,
          not_received_reason, not_received_by, not_received_at)
        values (${jo.id}, ${i + 1}, ${ref}, ${descr}, ${jo.sample_type}, ${remarks || null}, ${hole}, ${from}, ${to},
          ${state === "received" || state === "in_batch" ? b?.id ?? null : null}, ${state === "awaiting" ? b?.id ?? null : null}, ${state === "awaiting" ? tx`now() - interval '11 days'` : null},
          ${state === "received" ? tx`${b!.day}::date + time '10:30'` : null}, ${state === "received" ? prep?.id ?? null : null},
          ${state === "received" ? tx`${b!.day}::date + time '10:00'` : null}, ${state === "received" ? prep?.id ?? null : null}, ${sampleNo}, ${code}, ${state === "received" ? "printed" : "none"},
          ${state === "not_received" ? "Client did not send it" : null}, ${state === "not_received" ? cso.id : null}, ${state === "not_received" ? tx`now() - interval '3 days'` : null})
        returning id`;
      await tx`insert into sample_intervals (sample_id, drill_hole_id, depth_from, depth_to)
        select ${s!.id}, d.id, ${from}, ${to} from drill_holes d where d.company_id = ${jo.company_id} and lower(d.code) = lower(${hole}) and d.archived_at is null`;
      n++;
    }
    filled++;
    console.log(`${no}: ${n} demo samples`);
  }
});
console.log(`samples loaded for ${filled} job orders`);
await sql.end();
