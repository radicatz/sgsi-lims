// Puts the demo signature and stamp images back after a browser test replaced them: retires every active image that is not a demo one and re-activates the latest demo one.
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/restore-demo-signing.ts
import { sql } from "../src/db";

await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const demo = await tx`select distinct on (kind, user_id) id, kind, user_id from signing_assets where storage_path like '%/demo-%' order by kind, user_id, set_at desc`;
  for (const d of demo) {
    await tx`update signing_assets set retired_at = now() where retired_at is null and kind = ${d.kind} and user_id is not distinct from ${d.user_id}::uuid and id <> ${d.id}`;
    await tx`update signing_assets set retired_at = null where id = ${d.id}`;
  }
  console.log(`${demo.length} demo images are active again`);
});
await sql.end();
