// Demo "Work in progress" for My work (Phase 5, slice A; My_Work_Screen_Plan.md section 4): something each staff role started and has not finished, so the overview shows the card.
//   Dedi Kurniawan (Preparation)  ADL saved for one of the two samples of B-2026-0413, which is still in preparation
//   Maya Lestari (Lab admin)      a revision 2 draft of the CoA of JO-2026-0124 (opened with Revise, not yet sent for signature)
//   Fitri Handayani (Analyst)     already has values saved in B-2026-0418 and B-2026-0420 from the Phase 3 demo
// Needs `pnpm seed:batches` and `pnpm seed:reports`. Safe to run again. Not audited (demo load).
//   pnpm seed:work            load
//   pnpm seed:work --remove   take it out again
import { sql } from "../src/db";

const remove = process.argv.includes("--remove");
const who = async (email: string) => (await sql`select id from profiles where email = ${email}`)[0]?.id as string | undefined;
const dedi = await who("dedi@sgsi.co.id"), maya = await who("maya@sgsi.co.id");
if (!dedi || !maya) throw new Error("Run pnpm seed:demo first (the demo users are missing).");
const [adl] = await sql`select id from parameters where code = 'ADL'`;

await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit', 'on', true)`;

  /* ---------- Preparation: ADL for the first sample of B-2026-0413 ---------- */
  const [s] = await tx`select s.id from samples s join batches b on b.id = s.batch_id where b.batch_no = 'B-2026-0413' and b.status = 'preparation' order by s.sample_no limit 1`;
  if (s) {
    const [has] = await tx`select id from analyses where sample_id = ${s.id} and parameter_id = ${adl!.id} and round = 1`;
    if (remove) {
      if (has) { await tx`delete from analysis_values where analysis_id = ${has.id}`; await tx`delete from analyses where id = ${has.id}`; }
      console.log("B-2026-0413: ADL removed");
    } else if (!has) {
      const [a] = await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at) values (${s.id}, ${adl!.id}, 1, 'entered', 'entered', ${dedi}, now() - interval '70 minutes') returning id`;
      await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, 'ar', 9.37, true)`;
      console.log("B-2026-0413: ADL 9.37 saved by Dedi Kurniawan for one sample");
    } else console.log("B-2026-0413: ADL already there");
  } else console.log("B-2026-0413 is not in preparation any more: skipped");

  /* ---------- Lab admin: a revision draft of CoA-JO-2026-0124-1 ---------- */
  const [rep] = await tx`select r.id, r.job_order_id from reports r join job_orders j on j.id = r.job_order_id where j.order_no = 'JO-2026-0124' and r.kind = 'coa' and r.status = 'issued'`;
  const [open] = await tx`select r.id from reports r join job_orders j on j.id = r.job_order_id where j.order_no = 'JO-2026-0124' and r.kind = 'coa' and r.status = 'draft'`;
  if (remove) {
    if (open) await tx`delete from reports where id = ${open.id}`;
    console.log("JO-2026-0124: revision draft removed");
  } else if (!rep) console.log("JO-2026-0124 has no published CoA: skipped");
  else if (open) console.log("JO-2026-0124: a draft is already open");
  else {
    const [rev] = await tx`select coalesce(max(revision), 0) + 1 as n from reports where job_order_id = ${rep.job_order_id} and kind = 'coa'`;
    await tx`insert into reports (kind, job_order_id, revision, status, template_id, bases, parameter_ids, attention_contact_id, client_reference, remarks, on_behalf_of, signatory_id, drafted_by, supersedes_id, revision_reason, created_at)
      select 'coa', job_order_id, ${rev!.n}, 'draft', template_id, bases, parameter_ids, attention_contact_id, client_reference, remarks, on_behalf_of, signatory_id, ${maya}, id, 'Client asked for the drill hole names', now() - interval '2 hours'
      from reports where id = ${rep.id}`;
    console.log(`JO-2026-0124: revision ${rev!.n} draft opened by Maya Lestari`);
  }
});
await sql.end();
