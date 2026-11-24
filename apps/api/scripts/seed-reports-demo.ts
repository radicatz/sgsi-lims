// Demo data for the Reports screens (Reports_Build_Design.md section 10 and 16; frames 07-01 to 07-03), until the lab's real job orders arrive. It adds its own job orders
// JO-2026-0120 to 0129 (batches B-2026-0450 to 0459, RoA-0450 to 0459), so the demo orders of phases 2 and 3 keep their states:
//   0120 to 0124  signed and sent (WhatsApp, Email, Hard copy, Email and WhatsApp, Hard copy)     0125  revision 1 superseded ("Wrong client reference"), revision 2 signed
//   0126  signed by the Supervisor on behalf of the Manager, not sent     0127  awaiting the Manager's signature     0128  a draft     0129  ready to generate
// Certificates are made by the same code as the Sign and publish button (certificate-issue.ts) and need Gotenberg (GOTENBERG_URL). The placeholder signature (owner, Nov 23) is
// b_sutrisno-sign.png for the demo Manager; the lab stamp is sgsi-stamp.svg turned into a PNG once; the demo Supervisor gets a second, generated placeholder. They are stored as
// ordinary signing_assets rows under a "demo-" file name, only where nobody has set an image yet.
// Needs `pnpm seed:master`, `pnpm seed:demo` and the Phase 4 migrations. Safe to run again. Not audited (bulk demo load).
//   pnpm seed:reports            load
//   pnpm seed:reports --remove   take it out again (the demo images are retired)
//   pnpm seed:reports --roa      only make the demo batches' RoA files again with the app's RoA renderer (roa-data.ts), keeping everything else
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fixedCarbon } from "@sgsi/shared";
import { sql } from "../src/db";
import { env } from "../src/env";
import { admin } from "../src/supabase";
import { orderedParameters } from "../src/certificate-data";
import { issueCertificate } from "../src/certificate-issue";
import { buildRoaPayload, renderRoaPdf } from "../src/roa-data";

const IMG = new URL("../../../.context/assets/images/", import.meta.url);
const ORDERS = Array.from({ length: 10 }, (_, i) => `JO-2026-01${20 + i}`);
const BATCHES = Array.from({ length: 10 }, (_, i) => `B-2026-04${50 + i}`);
const COMPANIES = ["PTBA", "BNM", "SBH", "KEP", "MCR", "PTBA", "BNM", "KEP", "SBH", "MCR"];

/** 0 = signed and sent, 1 = superseded then signed, 2 = signed by the Supervisor, 3 = awaiting signature, 4 = draft, 5 = ready */
const PLAN: Array<{ kind: number; channels?: string[] }> = [
  { kind: 0, channels: ["WhatsApp"] }, { kind: 0, channels: ["Email"] }, { kind: 0, channels: ["Hard copy"] }, { kind: 0, channels: ["Email", "WhatsApp"] }, { kind: 0, channels: ["Hard copy"] },
  { kind: 1 }, { kind: 2 }, { kind: 3 }, { kind: 4 }, { kind: 5 },
];

async function gotenberg(route: string, parts: Array<[string, Blob, string?]>, fields: Record<string, string> = {}): Promise<Buffer> {
  const fd = new FormData();
  for (const [n, b, f] of parts) fd.append(n, b, f);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(`${env.GOTENBERG_URL}${route}`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Gotenberg ${route}: ${res.status} ${await res.text().catch(() => "")}`);
  return Buffer.from(await res.arrayBuffer());
}
const pngOf = (html: string, w: number, h: number) => gotenberg("/forms/chromium/screenshot/html", [["files", new Blob([html], { type: "text/html" }), "index.html"]], { format: "png", omitBackground: "true", width: String(w), height: String(h) });

if (process.argv.includes("--remove")) {
  const files = await sql`select r.storage_path from reports r join job_orders j on j.id = r.job_order_id where j.order_no = any(${ORDERS}::text[]) and r.storage_path is not null`;
  if (files.length) await admin.storage.from("reports").remove(files.map((f) => f.storage_path as string));
  const docs = await sql`select d.storage_path from batch_documents d join batches b on b.id = d.batch_id where b.batch_no = any(${BATCHES}::text[])`;
  if (docs.length) await admin.storage.from("batch-documents").remove(docs.map((f) => f.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    const jo = tx`select id from job_orders where order_no = any(${ORDERS}::text[])`;
    await tx`delete from notifications where link in (select '/reports/coa/' || id from reports where job_order_id in (${jo})) or link like any(${ORDERS.map((o) => `/orders/${o}%`)}::text[])`;
    await tx`delete from report_deliveries where report_id in (select id from reports where job_order_id in (${jo}))`;
    await tx`delete from report_sources where report_id in (select id from reports where job_order_id in (${jo}))`;
    await tx`update reports set supersedes_id = null where job_order_id in (${jo})`;
    await tx`delete from reports where job_order_id in (${jo})`;
    await tx`delete from analyses where sample_id in (select id from samples where job_order_id in (${jo}))`;
    await tx`update samples set batch_id = null where job_order_id in (${jo})`;
    await tx`delete from batch_documents where batch_id in (select id from batches where batch_no = any(${BATCHES}::text[]))`;
    await tx`delete from batch_status_log where batch_id in (select id from batches where batch_no = any(${BATCHES}::text[]))`;
    await tx`delete from batch_parameters where batch_id in (select id from batches where batch_no = any(${BATCHES}::text[]))`;
    await tx`delete from batches where batch_no = any(${BATCHES}::text[])`;
    await tx`delete from samples where job_order_id in (${jo})`;
    await tx`delete from job_order_parameters where job_order_id in (${jo})`;
    const del = await tx`delete from job_orders where order_no = any(${ORDERS}::text[]) returning order_no`;
    const old = await tx`update signing_assets set retired_at = now() where retired_at is null and storage_path like '%/demo-%' returning id`;
    console.log(`removed ${del.length} demo job orders, retired ${old.length} demo images`);
  });
  await sql.end();
  process.exit(0);
}

const who = async (email: string) => { const [p] = await sql`select id, full_name from profiles where email = ${email}`; if (!p) throw new Error(`Run pnpm seed:demo first (${email} is missing).`); return p as { id: string; full_name: string }; };
const [mgr, sup, cso, adm, ana, prep] = await Promise.all([who("bambang@sgsi.co.id"), who("hendra@sgsi.co.id"), who("rina@sgsi.co.id"), who("maya@sgsi.co.id"), who("fitri@sgsi.co.id"), who("dedi@sgsi.co.id")]);

/* ---------- the placeholder images (only where nobody has set one) ---------- */
async function placeSigning(kind: "signature" | "stamp", userId: string | null, file: string, png: Buffer) {
  const [have] = await sql`select id from signing_assets where kind = ${kind} and retired_at is null and user_id is not distinct from ${userId}::uuid`;
  if (have) return false;
  const sha = createHash("sha256").update(png).digest("hex");
  const path = kind === "stamp" ? `stamp/demo-${sha.slice(0, 16)}.png` : `signature/${userId}/demo-${sha.slice(0, 16)}.png`;
  const up = await admin.storage.from("signing").upload(path, png, { contentType: "image/png", upsert: true });
  if (up.error) throw up.error;
  await sql`insert into signing_assets (kind, user_id, storage_path, sha256, size_bytes, set_by) values (${kind}, ${userId}, ${path}, ${sha}, ${png.length}, ${mgr.id})`;
  console.log(`placeholder ${kind}${userId ? ` for ${userId === mgr.id ? "Bambang Sutrisno" : "Hendra Wijaya"}` : ""}: ${file}`);
  return true;
}
const stampSvg = readFileSync(new URL("sgsi-stamp.svg", IMG), "utf8");
await placeSigning("stamp", null, "sgsi-stamp.svg", await pngOf(`<html><body style="margin:0;background:transparent"><div style="width:600px;height:600px">${stampSvg.replace("<svg ", '<svg style="width:600px;height:600px" ')}</div></body></html>`, 600, 600));
await placeSigning("signature", mgr.id, "b_sutrisno-sign.png", readFileSync(new URL("b_sutrisno-sign.png", IMG)));
// a second, hand-drawn style placeholder for the demo Supervisor, so two signatories never look alike
const hendra = `<html><body style="margin:0;background:transparent"><svg width="900" height="300" viewBox="0 0 900 300" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#17315c" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
  <path d="M80 210 C 90 120, 110 60, 130 50 C 150 40, 140 150, 135 230 M 85 150 C 130 135, 200 130, 240 140"/>
  <path d="M240 205 C 270 150, 300 120, 330 135 C 350 150, 320 200, 300 215 C 340 190, 380 150, 420 140 C 450 135, 450 190, 470 190 C 500 190, 520 120, 540 100"/>
  <path d="M470 215 C 560 235, 700 230, 820 170 C 760 215, 620 250, 480 240" stroke-width="5"/>
  <path d="M560 175 C 600 140, 650 120, 700 150 C 740 175, 700 215, 660 205"/></svg></body></html>`;
await placeSigning("signature", sup.id, "generated placeholder", await pngOf(hendra, 900, 300));

/* ---------- job orders, batches with verified values, signed RoAs ---------- */
const VALUES = (i: number): Array<[string, string, string]> => {
  const im = (7.9 + (i % 5) * 0.35).toFixed(2), ash = (5.1 + (i % 6) * 0.9).toFixed(2), vm = (38.6 + (i % 4) * 0.8).toFixed(2);
  return [["TM", "ar", (13.4 + (i % 5) * 0.9).toFixed(2)], ["IM", "adb", im], ["ASH", "adb", ash], ["VM", "adb", vm], ["FC", "adb", fixedCarbon(im, ash, vm) ?? "46.00"], ["TS", "adb", (0.31 + (i % 4) * 0.11).toFixed(2)], ["GCV", "adb", String(5640 + (i % 7) * 55)]];
};
const ymdIn = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(d);
/** The demo "signed" RoA: the RoA the app drafts for the batch (SGSI template), numbered and dated as the lab would, uploaded as the signed copy. */
async function attachRoa(batchNo: string, roaNo: string, at: Date) {
  const payload = await sql.begin((tx) => buildRoaPayload(tx, batchNo, { number: roaNo, reportedOn: ymdIn(at) }));
  if (!payload) throw new Error(`${batchNo} is missing`);
  const pdf = await renderRoaPdf(payload);
  const path = `demo/${roaNo}-${randomUUID().slice(0, 8)}.pdf`;
  const up = await admin.storage.from("batch-documents").upload(path, pdf, { contentType: "application/pdf" });
  if (up.error) throw up.error;
  const [old] = await sql`select d.storage_path from batch_documents d join batches b on b.id = d.batch_id where b.batch_no = ${batchNo}`;
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`delete from batch_documents where batch_id = (select id from batches where batch_no = ${batchNo})`;
    await tx`insert into batch_documents (batch_id, kind, roa_no, storage_path, file_name, size_bytes, sha256, uploaded_by, uploaded_at)
      select id, 'signed_roa', ${roaNo}, ${path}, ${`${roaNo}.pdf`}, ${pdf.length}, ${createHash("sha256").update(pdf).digest("hex")}, ${adm.id}, ${at} from batches where batch_no = ${batchNo}`;
  });
  if (old) await admin.storage.from("batch-documents").remove([old.storage_path as string]);
}
if (process.argv.includes("--roa")) {
  // the ten Reports demo batches, and B-2026-0417 of `pnpm seed:batches`, which carries a placeholder file too
  for (const [batchNo, roaNo] of [...BATCHES.map((b, i) => [b, `RoA-04${50 + i}`] as const), ["B-2026-0417", "RoA-0417"] as const]) {
    const [b] = await sql`select d.uploaded_at from batches b left join batch_documents d on d.batch_id = b.id where b.batch_no = ${batchNo}`;
    if (!b) { console.log(`${batchNo}: not loaded`); continue; }
    await attachRoa(batchNo, roaNo, (b.uploaded_at as Date | null) ?? new Date());
    console.log(`${batchNo}: ${roaNo} made again`);
  }
  await sql.end();
  process.exit(0);
}

const [tpl] = await sql`select id from report_templates where kind = 'coa' and status = 'current' order by company_id nulls first limit 1`;
if (!tpl) throw new Error("No CoA template is active (Configuration, Report templates).");
const day = (back: number) => new Date(Date.now() - back * 86_400_000);

for (const [i, no] of ORDERS.entries()) {
  const [have] = await sql`select id from job_orders where order_no = ${no}`;
  if (have) { console.log(`${no}: already there`); continue; }
  const code = COMPANIES[i]!, plan = PLAN[i]!, batchNo = BATCHES[i]!, roaNo = `RoA-04${50 + i}`;
  const [co] = await sql`select c.id, c.name, c.company_code, (select id from company_contacts where company_id = c.id and archived_at is null order by is_default desc limit 1) as contact,
      (select full_name from company_contacts where company_id = c.id and archived_at is null order by is_default desc limit 1) as contact_name from companies c where c.code = ${code}`;
  if (!co) throw new Error(`Client ${code} is missing: run pnpm seed:master first.`);
  const ago = 40 - i * 3, ref = `${code}-${2600 + i}`;
  const status = plan.kind <= 2 ? (plan.kind === 0 ? "delivered" : "reported") : "in_progress";
  const report = await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    const [j] = await tx`insert into job_orders (order_no, company_id, contact_id, client_reference, standards, preparation, expected_samples, status, cso_id, signatory_id, signatory_name, signatory_title, created_by, submitted_at, created_at)
      values (${no}, ${co.id}, ${co.contact}, ${ref}, '{ASTM}', true, 2, ${status}::order_status, ${cso.id}, ${mgr.id}, ${mgr.full_name}, 'Laboratory Manager', ${cso.id}, ${day(ago)}, ${day(ago)}) returning id`;
    await tx`insert into job_order_parameters (job_order_id, parameter_id) select ${j!.id}, id from parameters where code = any(${["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV"]}::text[])`;
    const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, created_at, reception_confirmed_at, reception_confirmed_by,
        prep_finished_at, prep_finished_by, analysis_started_at, analysis_started_by, analysis_finished_at, analysis_finished_by, completed_at, completed_by)
      values (${j!.id}, ${co.id}, ${batchNo}, ${day(ago - 2)}, ${day(ago - 10)}, 'ASTM', 'completed', 'RI', ${cso.id}, ${day(ago)}, ${day(ago - 1)}, ${prep.id}, ${day(ago - 2)}, ${prep.id}, ${day(ago - 3)}, ${ana.id}, ${day(ago - 6)}, ${ana.id}, ${day(ago - 7)}, ${adm.id}) returning id`;
    await tx`insert into batch_parameters (batch_id, parameter_id) select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${j!.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(day(ago - 1)).replaceAll("-", "").slice(2);
    for (let s = 0; s < 2; s++) {
      const n = `${i}${s + 1}`.padStart(3, "0");
      const [sm] = await tx`insert into samples (job_order_id, row_no, client_ref, client_description, sample_type, drill_hole_text, depth_from, depth_to, batch_id, arrived_at, arrived_by, received_at, received_by,
          sample_no, sample_code, mass_received_kg, condition, label_status, label_print_count)
        values (${j!.id}, ${s + 1}, ${`${code}-${3300 + i * 2 + s}`}, ${s ? "Ply A1 lower" : "Ply A1 upper"}, 'Core', ${`DH-${code}-0${21 + (i % 3)}`}, ${12 + s * 0.4}, ${12.4 + s * 0.4}, ${b!.id}, ${day(ago - 1)}, ${prep.id}, ${day(ago - 1)}, ${prep.id},
          ${`SG.${ymd}.${co.company_code}.RI.${n}`}, ${`${co.company_code}.RI.${n}.Lot01`}, ${(9.2 + s + i * 0.1).toFixed(2)}, 'Good', 'printed', 1) returning id`;
      for (const [pc, basis, v] of VALUES(i * 2 + s)) {
        const [a] = await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at) select ${sm!.id}, id, 1, ${pc === "FC" ? "calculated" : "entered"}, 'verified', ${ana.id}, ${day(ago - 5)} from parameters where code = ${pc} returning id`;
        await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, ${basis}, ${v}, true)`;
      }
    }
    for (const [f, t, a, who2] of [[null, "created", "Batch created", cso.id], ["created", "preparation", "Reception confirmed", prep.id], ["preparation", "prep_finished", "Preparation finished", prep.id], ["prep_finished", "analysis", "Analysis started", ana.id],
      ["analysis", "analysis_finished", "Analysis finished", ana.id], ["analysis_finished", "completed", "Batch completed", adm.id]] as const)
      await tx`insert into batch_status_log (batch_id, from_status, to_status, action, by_user) values (${b!.id}, ${f}::batch_status, ${t}::batch_status, ${a}, ${who2})`;
    return { jobId: j!.id as string };
  });
  await attachRoa(batchNo, roaNo, day(ago - 7));

  /* ---------- the certificate(s), by the same code as the Sign and publish button ---------- */
  const params = (await sql.begin((tx) => orderedParameters(tx, report.jobId))).map((p) => p.id as string);
  const draft = async (revision: number, o: { reference?: string; signer?: string; behalf?: string | null; supersedes?: string; reason?: string; status?: string; sentBy?: string | null; sentAt?: Date | null }) => {
    const [r] = await sql`insert into reports (kind, job_order_id, revision, status, template_id, bases, parameter_ids, attention_contact_id, client_reference, signatory_id, on_behalf_of, drafted_by, supersedes_id, revision_reason,
        sent_for_signature_by, sent_for_signature_at, created_at)
      values ('coa', ${report.jobId}, ${revision}, ${(o.status ?? "draft") as never}, ${tpl.id}, '{adb,db,daf,ar}', ${params}::uuid[], ${co.contact}, ${o.reference ?? ref}, ${o.signer ?? mgr.id}, ${o.behalf ?? null}, ${adm.id}, ${o.supersedes ?? null}, ${o.reason ?? null},
        ${o.sentBy ?? null}, ${o.sentAt ?? null}, ${day(ago - 8)}) returning id`;
    return r!.id as string;
  };
  const issue = async (id: string, signer: string, at: Date) => {
    const [rep] = await sql`select r.*, j.order_no, j.company_id from reports r join job_orders j on j.id = r.job_order_id where r.id = ${id}`;
    const res = await sql.begin(async (tx) => { await tx`select set_config('app.skip_audit','on',true)`; return issueCertificate(tx, rep as never, signer, { issuedAt: at, replaceFile: true }); });
    if (!res.ok) throw new Error(`${no}: ${res.text}`);
    return res.number;
  };
  let note = "";
  if (plan.kind === 0) {
    const id = await draft(1, {}), at = day(ago - 9), number = await issue(id, mgr.id, at);
    await sql`insert into report_deliveries (report_id, sent_on, channels, recipient, note, by_user, at) values (${id}, ${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(day(ago - 10))}, ${plan.channels!}::text[], ${co.contact_name}, null, ${cso.id}, ${day(ago - 10)})`;
    await sql`update reports set print_count = ${1 + (i % 3)}, last_printed_at = ${day(ago - 10)} where id = ${id}`;
    note = `${number} signed and sent by ${plan.channels!.join(" and ")}`;
  } else if (plan.kind === 1) {
    const r1 = await draft(1, { reference: `${ref}-X` }), n1 = await issue(r1, mgr.id, day(ago - 9));
    const r2 = await draft(2, { supersedes: r1, reason: "Wrong client reference" }), n2 = await issue(r2, mgr.id, day(ago - 12));
    note = `${n1} superseded, ${n2} signed`;
  } else if (plan.kind === 2) {
    const id = await draft(1, { signer: sup.id, behalf: "Laboratory Manager" }), n = await issue(id, sup.id, day(ago - 9));
    note = `${n} signed by the Supervisor on behalf of the Manager, not sent`;
  } else if (plan.kind === 3) {
    await draft(1, { status: "awaiting_signature", sentBy: adm.id, sentAt: day(1) });
    note = "awaiting the Manager's signature";
  } else if (plan.kind === 4) {
    await draft(1, {});
    note = "a draft";
  } else note = "ready to generate";
  console.log(`${no} (${co.name}): batch ${batchNo}, ${roaNo}, ${note}`);
}

// notifications for the demo: the Manager has one CoA waiting (N9)
const [wait] = await sql`select r.id from reports r join job_orders j on j.id = r.job_order_id where j.order_no = 'JO-2026-0127' and r.status = 'awaiting_signature'`;
if (wait) {
  const [has] = await sql`select 1 from notifications where user_id = ${mgr.id} and link = ${`/reports/coa/${wait.id}`}`;
  if (!has) await sql`insert into notifications (user_id, event, icon, title, body, link) values (${mgr.id}, 'N9', 'pencil-simple-line', 'CoA for JO-2026-0127 waits for your signature', ${`Sent by ${adm.full_name}.`}, ${`/reports/coa/${wait.id}`})`;
}
await sql.end();
