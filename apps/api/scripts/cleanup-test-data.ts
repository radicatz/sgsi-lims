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
  // files kept with the test job orders (their rows go with the job orders below)
  const orderFiles = await sql`select f.storage_path from job_order_files f join job_orders j on j.id = f.job_order_id
    where j.order_no like 'ZT-%' or j.order_no like 'ZE-%' or j.client_reference like 'ZT %' or j.client_reference like 'ZE %'`;
  if (orderFiles.length) await admin.storage.from("job-order-files").remove(orderFiles.map((f) => f.storage_path as string));
  // reception photos of the test job orders' samples (their rows go with the samples below)
  const photos = await sql`select a.storage_path from sample_attachments a join samples s on s.id = a.sample_id join job_orders j on j.id = s.job_order_id
    where j.order_no like 'ZT-%' or j.order_no like 'ZE-%' or j.client_reference like 'ZT %' or j.client_reference like 'ZE %'`;
  if (photos.length) await admin.storage.from("sample-photos").remove(photos.map((f) => f.storage_path as string));
  // signed RoA files of the test job orders' batches
  const roas = await sql`select d.storage_path from batch_documents d join batches b on b.id = d.batch_id join job_orders j on j.id = b.job_order_id
    where j.order_no like 'ZT-%' or j.order_no like 'ZE-%' or j.client_reference like 'ZT %' or j.client_reference like 'ZE %'`;
  if (roas.length) await admin.storage.from("batch-documents").remove(roas.map((f) => f.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit', 'on', true)`;
    await tx`delete from coa_files where drill_hole_id in (select id from drill_holes where company_id in (${co}))`;
    await tx`delete from drill_holes where company_id in (${co})`;
    await tx`delete from seams where company_id in (${co})`;
    await tx`delete from lithologies where company_id in (${co})`;
    await tx`delete from company_contacts where company_id in (${co})`;
    await tx`delete from companies where code like 'ZT%' or code like 'ZE%'`;
    await tx`delete from lookups where value like 'ZT %' or value like 'ZE %'`;
    await tx`delete from methods where parameter_id in (select id from parameters where code like 'ZT-%' or code like 'ZE-%')`;
    await tx`delete from parameters where code like 'ZT-%' or code like 'ZE-%'`;
    // contacts added from the job order form by the browser tests
    await tx`delete from company_contacts where full_name like 'ZE %' or full_name like 'ZT %'`;
    // batches of the test job orders: the notifications that point at them, the samples' links to them, then the batches (the log and parameters go with them)
    const testOrders = tx`select id from job_orders where order_no like 'ZT-%' or order_no like 'ZE-%' or client_reference like 'ZT %' or client_reference like 'ZE %'`;
    await tx`delete from notifications n using batches b where b.job_order_id in (${testOrders}) and n.link like '/batches/' || b.batch_no || '/%'`;
    await tx`delete from notifications where link like '/orders/ZT-%' or link like '/orders/ZE-%'`;
    await tx`update samples set batch_id = null, released_from_batch_id = null where job_order_id in (${testOrders})`;
    await tx`delete from batches where job_order_id in (${testOrders})`;
    // notifications that point at a batch that no longer exists (left by an interrupted run)
    await tx`delete from notifications n where n.link ~ '^/batches/B-[0-9]{4}-[0-9]{4}/' and not exists (select 1 from batches b where n.link like '/batches/' || b.batch_no || '/%')`;
    // Job orders made by the checks and the browser tests
    await tx`delete from job_orders where order_no like 'ZT-%' or order_no like 'ZE-%' or client_reference like 'ZT %' or client_reference like 'ZE %'`;
    // Configuration slice B: services, methods and standards, template drafts made by the checks
    await tx`delete from service_parameters where service_id in (select id from services where name like 'ZT %' or name like 'ZE %')`;
    await tx`delete from services where name like 'ZT %' or name like 'ZE %'`;
    await tx`delete from methods where standard_id in (select id from standards where code like 'ZT%' or code like 'ZE%')`;
    await tx`delete from standards where code like 'ZT%' or code like 'ZE%'`;
    await tx`delete from report_templates where status = 'draft' and (note like 'ZT%' or note like 'ZE%')`;
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
