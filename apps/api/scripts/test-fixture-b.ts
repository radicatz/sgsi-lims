// Browser-test fixture for slice B: puts two samples of a test job order (ZE-...) into a batch at the state the test needs, with the numbers Reception gives.
// Usage: tsx scripts/test-fixture-b.ts <order no> <batch no> <preparation|prep_finished>. The cleanup script removes it with the job order.
import { sql } from "../src/db";

const [orderNo, batchNo, state] = process.argv.slice(2) as [string, string, "preparation" | "prep_finished"];
const [jo] = await sql`select j.id, j.company_id, c.company_code from job_orders j join companies c on c.id = j.company_id where j.order_no = ${orderNo}`;
if (!jo) throw new Error(`no job order ${orderNo}`);
const [prep] = await sql`select id from profiles where email = 'dedi@sgsi.co.id'`;
const [cso] = await sql`select id from profiles where email = 'rina@sgsi.co.id'`;
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, reception_confirmed_at, reception_confirmed_by, prep_finished_at, prep_finished_by)
    values (${jo.id}, ${jo.company_id}, ${batchNo}, current_date - 1, current_date + 5, 'ASTM', ${state}, 'RI', ${cso!.id}, now(), ${prep!.id}, ${state === "prep_finished" ? tx`now()` : null}, ${state === "prep_finished" ? prep!.id : null}) returning id`;
  await tx`insert into batch_parameters (batch_id, parameter_id) select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${jo.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
  const two = await tx`select id from samples where job_order_id = ${jo.id} order by row_no limit 2`;
  for (const [i, s] of two.entries())
    await tx`update samples set batch_id = ${b!.id}, arrived_at = now(), arrived_by = ${prep!.id}, received_at = now(), received_by = ${prep!.id},
      sample_no = ${`SG.261119.${jo.company_code}.RI.8${i}${batchNo.slice(-1)}`}, sample_code = ${`${jo.company_code}.RI.8${i}${batchNo.slice(-1)}.Lot01`}, mass_received_kg = 5, condition = 'Good' where id = ${s.id}`;
});
await sql.end();
