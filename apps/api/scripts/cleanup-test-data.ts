// Removes the rows, accounts and files the automated checks create: test accounts zt-*@sgsi.co.id; clients whose code starts with ZT (API checks) or ZE (browser tests),
// with their contacts, drill holes, CoA files, seams and lithologies. Never touches real data.
// Run alone: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/cleanup-test-data.ts
import { sql } from "../src/db";
import { admin } from "../src/supabase";

export async function cleanupTestData() {
  const co = sql`select id from companies where code like 'ZT%' or code like 'ZE%'`;
  const files = await sql`select storage_path from coa_files where drill_hole_id in (select id from drill_holes where company_id in (${co}))`;
  if (files.length) await admin.storage.from("coa").remove(files.map((f) => f.storage_path as string));
  const logos = await sql`select logo_path from companies where (code like 'ZT%' or code like 'ZE%') and logo_path is not null`;
  if (logos.length) await admin.storage.from("logos").remove(logos.map((l) => l.logo_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit', 'on', true)`;
    await tx`delete from coa_files where drill_hole_id in (select id from drill_holes where company_id in (${co}))`;
    await tx`delete from drill_holes where company_id in (${co})`;
    await tx`delete from seams where company_id in (${co})`;
    await tx`delete from lithologies where company_id in (${co})`;
    await tx`delete from company_contacts where company_id in (${co})`;
    await tx`delete from companies where code like 'ZT%' or code like 'ZE%'`;
    await tx`delete from lookups where value like 'ZT %' or value like 'ZE %'`;
  });
  // test accounts (zt-*@sgsi.co.id): profile, roles and the Supabase Auth user
  const users = await sql`select id from profiles where email like 'zt-%@sgsi.co.id'`;
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit', 'on', true)`;
    await tx`delete from user_roles where user_id in (select id from profiles where email like 'zt-%@sgsi.co.id')`;
    await tx`delete from profiles where email like 'zt-%@sgsi.co.id'`;
  });
  for (const u of users) await admin.auth.admin.deleteUser(u.id as string);
}
if (process.argv[1]?.endsWith("cleanup-test-data.ts")) { await cleanupTestData(); await sql.end(); console.log("Test data removed"); }
