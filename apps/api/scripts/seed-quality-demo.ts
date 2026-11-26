// Demo data for the Dashboard's Quality & reports tab (Phase5_Build_Design.md 12.8): the completed demo batches have CV, Ash and FC from the batch demo but no relative density, so the RD vs Ash
// chart is empty. This adds an RD value (ADB) to each sample of a completed batch that lacks one, following Ash the way coal does (denser with more ash) with a little scatter.
// Run: pnpm seed:quality. `--remove` takes the values it added out again (they carry the comment "seed:quality"). Written without audit rows, like the other demo seeds.
import { sql } from "../src/db";

const remove = process.argv.includes("--remove");
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  if (remove) {
    const gone = await tx`delete from analyses where comment = 'seed:quality' returning id`;
    console.log(`removed ${gone.length} RD values`);
    return;
  }
  const [rd] = await tx`select id from parameters where code = 'RD'`;
  if (!rd) throw new Error("The RD parameter is not in the catalogue.");
  const [who] = await tx`select id from profiles where email = 'fitri@sgsi.co.id'`;
  const rows = await tx`
    select s.id, b.completed_at,
      (select av.value_num::float from analyses a join parameters p on p.id = a.parameter_id join analysis_values av on av.analysis_id = a.id and av.is_primary where a.sample_id = s.id and a.round = 1 and p.code = 'ASH') as ash
    from samples s join batches b on b.id = s.batch_id
    where b.status = 'completed' and not exists (select 1 from analyses a where a.sample_id = s.id and a.parameter_id = ${rd.id} and a.round = 1)
    order by s.id`;
  let n = 0;
  for (const [i, s] of rows.entries()) {
    if (s.ash == null) continue;
    const noise = (((i * 37) % 17) - 8) / 400;                            // deterministic, within about 0.02
    const value = (1.27 + 0.0125 * (s.ash as number) + noise).toFixed(2);
    const [a] = await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at, comment)
      values (${s.id}, ${rd.id}, 1, 'entered', 'verified', ${who?.id ?? null}, ${s.completed_at}, 'seed:quality') returning id`;
    await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, 'adb', ${value}, true)`;
    n++;
  }
  console.log(`added ${n} RD values to the samples of completed batches`);
});
await sql.end();
