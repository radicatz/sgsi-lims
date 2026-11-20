// Browser-test fixture for Phase 4: puts the samples of a test job order (ZE-...) into a COMPLETED batch with verified values, so the CoA can be generated.
// Usage: tsx scripts/test-fixture-reports.ts <order no> <batch no>. The cleanup script removes it with the job order.
import { sql } from "../src/db";

const [orderNo, batchNo] = process.argv.slice(2) as [string, string];
const [jo] = await sql`select j.id, j.company_id, c.company_code from job_orders j join companies c on c.id = j.company_id where j.order_no = ${orderNo}`;
if (!jo) throw new Error(`no job order ${orderNo}`);
const [cso] = await sql`select id from profiles where email = 'rina@sgsi.co.id'`;
const [adm] = await sql`select id from profiles where email = 'maya@sgsi.co.id'`;
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  await tx`update job_orders set status = 'in_progress' where id = ${jo.id}`;
  const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, standard, status, branch_code, created_by, completed_at, completed_by)
    values (${jo.id}, ${jo.company_id}, ${batchNo}, current_date, 'ASTM', 'completed', 'RI', ${cso!.id}, now(), ${adm!.id}) returning id`;
  const V: Array<[string, string, string]> = [["TM", "ar", "14.20"], ["IM", "adb", "8.10"], ["ASH", "adb", "5.42"], ["VM", "adb", "39.85"], ["FC", "adb", "46.63"], ["TS", "adb", "0.42"], ["GCV", "adb", "5980"]];
  const rows = await tx`select id from samples where job_order_id = ${jo.id} order by row_no limit 2`;
  for (const [i, s] of rows.entries()) {
    await tx`update samples set batch_id = ${b!.id}, arrived_at = now(), arrived_by = ${cso!.id}, received_at = now(), received_by = ${cso!.id},
      sample_no = ${`SG.261120.${jo.company_code}.RI.7${i}${batchNo.slice(-1)}`}, sample_code = ${`${jo.company_code}.RI.7${i}${batchNo.slice(-1)}.Lot01`}, mass_received_kg = 5, condition = 'Good' where id = ${s.id}`;
    for (const [code, basis, v] of V) {
      const [a] = await tx`insert into analyses (sample_id, parameter_id, status, source, entered_by) select ${s.id}, id, 'verified', ${code === "FC" ? "calculated" : "entered"}, ${adm!.id} from parameters where code = ${code} returning id`;
      await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, ${basis}, ${Number(v) + (i + 1) / 100}, true)`;
    }
  }
});
await sql.end();
