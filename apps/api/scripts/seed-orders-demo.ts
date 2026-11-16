// Demo job orders from the prototype (Job_Order_Prototype_Plan section 7), so the list and the detail show something until the lab's
// real job orders arrive (R-20). 14 job orders for the demo clients, in every status the app can show. Safe to run again: existing
// numbers are kept. Not audited (bulk demo load). Needs `pnpm seed:master` first.
//   pnpm seed:orders            load the demo job orders
//   pnpm seed:orders --remove   remove them again (with their samples and files rows)
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

if (process.argv.includes("--remove")) {
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
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
await sql.end();
