// Live check of the Reports API, slice A (Reports_Build_Design.md sections 5 and 7): the job order's CoA card, Generate, the draft's contents, Send for
// signature, Return, who may sign (only the signed-in signatory, with their password), Sign and publish (number, stored PDF, hash, job order Reported, N6),
// the signatory change, and who sees what. Builds one throwaway job order (ZR-JO-9901) and removes it again.
// Needs the API running (with Gotenberg on :3000), migration C-21 applied, pnpm seed:master. Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-reports.ts
import { createHash } from "node:crypto";
import { sql } from "../src/db";
import { admin } from "../src/supabase";

const API = `http://localhost:${process.env.API_PORT ?? 4000}/api`;
const PW = process.env.DEMO_PASSWORD!;
let failed = 0;
const ok = (name: string, pass: boolean, extra = "") => { if (!pass) failed++; console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : "  " + extra}`); };
type Res = { status: number; body: any; buf?: Buffer };
async function call(token: string, method: string, path: string, body?: unknown, raw = false): Promise<Res> {
  const r = await fetch(API + path, { method, headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (raw) return { status: r.status, body: null, buf: Buffer.from(await r.arrayBuffer()) };
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function signIn(email: string) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  if (r.status !== 200) throw new Error(`sign in ${email}: ${r.status}`);
  return ((await r.json()) as { accessToken: string }).accessToken;
}
const T = { adm: await signIn("maya@sgsi.co.id"), cso: await signIn("rina@sgsi.co.id"), mgr: await signIn("bambang@sgsi.co.id"), sup: await signIn("hendra@sgsi.co.id"), ana: await signIn("fitri@sgsi.co.id"), sa: await signIn("wahyu@sgsi.co.id") };
const NO = "ZR-JO-9901", BATCH = "B-2026-9911";

async function clean() {
  const [j] = await sql`select id from job_orders where order_no = ${NO}`;
  const files = j ? await sql`select storage_path from reports where job_order_id = ${j.id} and storage_path is not null` : [];
  if (files.length) await admin.storage.from("reports").remove(files.map((f) => f.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    if (j) {
      await tx`delete from report_deliveries where report_id in (select id from reports where job_order_id = ${j.id})`;
      await tx`delete from report_sources where report_id in (select id from reports where job_order_id = ${j.id})`;
      await tx`delete from reports where job_order_id = ${j.id}`;
      await tx`delete from analyses where sample_id in (select id from samples where job_order_id = ${j.id})`;
      await tx`update samples set batch_id = null where job_order_id = ${j.id}`;
      await tx`delete from batch_status_log where batch_id in (select id from batches where job_order_id = ${j.id})`;
      await tx`delete from batch_parameters where batch_id in (select id from batches where job_order_id = ${j.id})`;
      await tx`delete from batches where job_order_id = ${j.id}`;
      await tx`delete from samples where job_order_id = ${j.id}`;
      await tx`delete from job_order_parameters where job_order_id = ${j.id}`;
      await tx`delete from job_orders where id = ${j.id}`;
    }
    await tx`delete from notifications where title like ${"%" + NO + "%"}`;
  });
}
await clean();

// ---------- a completed batch with verified values ----------
const [co] = await sql`select c.id, (select id from company_contacts where company_id = c.id and archived_at is null order by is_default desc limit 1) as contact from companies c where c.code = 'BNM'`;
const who = async (email: string) => (await sql`select id from profiles where email = ${email}`)[0]!.id as string;
const [mgrId, supId, csoId, admId] = [await who("bambang@sgsi.co.id"), await who("hendra@sgsi.co.id"), await who("rina@sgsi.co.id"), await who("maya@sgsi.co.id")];
const joId = await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [j] = await tx`insert into job_orders (order_no, company_id, contact_id, client_reference, standards, preparation, expected_samples, status, cso_id, signatory_id, signatory_name, signatory_title, created_by, submitted_at)
    values (${NO}, ${co!.id}, ${co!.contact}, 'ZR-PO-1', '{ASTM}', true, 2, 'in_progress', ${csoId}, ${mgrId}, 'Bambang Sutrisno', 'Laboratory Manager', ${csoId}, now()) returning id`;
  await tx`insert into job_order_parameters (job_order_id, parameter_id) select ${j!.id}, id from parameters where code = any(${["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV"]}::text[])`;
  const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, standard, status, branch_code, created_by, completed_at, completed_by)
    values (${j!.id}, ${co!.id}, ${BATCH}, current_date, 'ASTM', 'completed', 'RI', ${csoId}, now(), ${admId}) returning id`;
  const V: Array<[string, string, string]> = [["TM", "ar", "14.20"], ["IM", "adb", "8.10"], ["ASH", "adb", "5.42"], ["VM", "adb", "39.85"], ["FC", "adb", "46.63"], ["TS", "adb", "0.42"], ["GCV", "adb", "5980"]];
  for (let i = 1; i <= 2; i++) {
    const [s] = await tx`insert into samples (job_order_id, row_no, client_ref, sample_type, batch_id, arrived_at, arrived_by, received_at, received_by, sample_no, sample_code, mass_received_kg, condition)
      values (${j!.id}, ${i}, ${`ZR-${i}`}, 'Core', ${b!.id}, now(), ${csoId}, now(), ${csoId}, ${`SG.261120.003.RI.99${i}`}, ${`003.RI.99${i}.Lot01`}, ${9 + i}, 'Good') returning id`;
    for (const [code, basis, v] of V) {
      const [a] = await tx`insert into analyses (sample_id, parameter_id, status, source, entered_by) select ${s!.id}, id, 'verified', ${code === "FC" ? "calculated" : "entered"}, ${admId} from parameters where code = ${code} returning id`;
      await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, ${basis}, ${Number(v) + i / 100}, true)`;
    }
  }
  return j!.id as string;
});
void joId;

// ---------- the card and Generate ----------
const card0 = await call(T.adm, "GET", `/orders/${NO}/coa`);
ok("the card says ready when every batch is completed", card0.status === 200 && card0.body.state === "ready" && card0.body.batches.done === 1, JSON.stringify(card0.body));
ok("the CSO cannot generate", (await call(T.cso, "POST", `/orders/${NO}/coa`)).status === 403);
ok("an analyst cannot generate", (await call(T.ana, "POST", `/orders/${NO}/coa`)).status === 403);
const gen = await call(T.adm, "POST", `/orders/${NO}/coa`);
ok("the Lab admin generates a draft", gen.status === 201 && !!gen.body.id, JSON.stringify(gen.body));
const id = gen.body.id as string;
ok("a second Generate is refused with the draft's id", (await call(T.adm, "POST", `/orders/${NO}/coa`)).status === 409);
const card1 = await call(T.cso, "GET", `/orders/${NO}/coa`);
ok("the CSO sees only 'preparing' while it is a draft, with no id", card1.body.state === "preparing" && !card1.body.open, JSON.stringify(card1.body));
ok("the Lab admin's card says draft and opens it", (await call(T.adm, "GET", `/orders/${NO}/coa`)).body.state === "draft");

// ---------- the draft ----------
const page = await call(T.adm, "GET", `/reports/coa/${id}`);
ok("the draft page has the contents: all bases, ordered parameters, the Manager as signatory", page.status === 200 && page.body.status === "draft" && page.body.contents.bases.length === 4 && page.body.contents.parameters.length === 7 && /Bambang Sutrisno/.test(page.body.contents.signatory?.name), JSON.stringify(page.body.contents).slice(0, 300));
ok("the draft can be edited, not signed", page.body.can.edit && page.body.can.send && !page.body.can.sign);
ok("the CSO cannot open a draft", (await call(T.cso, "GET", `/reports/coa/${id}`)).status === 404);
ok("the Manager cannot open a draft either, until it is sent", (await call(T.mgr, "GET", `/reports/coa/${id}`)).status === 404);
ok("an analyst cannot open reports", (await call(T.ana, "GET", `/reports/coa/${id}`)).status === 403);
ok("a typed or non-signing signatory is refused", (await call(T.adm, "PATCH", `/reports/coa/${id}`, { signatoryId: csoId })).status === 422);
ok("bases and the remark are saved", (await call(T.adm, "PATCH", `/reports/coa/${id}`, { bases: ["ar", "adb"], remarks: "Checked twice.", onBehalfOf: "Laboratory Manager" })).status === 200);
const p2 = await call(T.adm, "GET", `/reports/coa/${id}`);
ok("the bases keep the canonical order", JSON.stringify(p2.body.contents.bases) === JSON.stringify(["adb", "ar"]), JSON.stringify(p2.body.contents.bases));
const noParam = await call(T.adm, "PATCH", `/reports/coa/${id}`, { parameterIds: [] });
ok("turning every parameter off is allowed in the draft but not sendable", noParam.status === 200 && (await call(T.adm, "POST", `/reports/coa/${id}/send`)).status === 409);
await call(T.adm, "PATCH", `/reports/coa/${id}`, { parameterIds: p2.body.contents.parameters.map((p: { id: string }) => p.id) });

// ---------- the draft as a PDF ----------
const dpdf = await call(T.adm, "GET", `/reports/coa/${id}/pdf`, undefined, true);
ok("the draft renders as a PDF", dpdf.status === 200 && dpdf.buf!.subarray(0, 5).toString("latin1") === "%PDF-" && dpdf.buf!.length > 20_000, `status ${dpdf.status} ${dpdf.buf?.length}`);
ok("the CSO cannot read the draft PDF", (await call(T.cso, "GET", `/reports/coa/${id}/pdf`, undefined, true)).status === 404);

// ---------- send, return, send again ----------
ok("Send for signature works for the Lab admin", (await call(T.adm, "POST", `/reports/coa/${id}/send`)).status === 200);
ok("a second send is refused", (await call(T.adm, "POST", `/reports/coa/${id}/send`)).status === 409);
ok("the contents are locked once sent", (await call(T.adm, "PATCH", `/reports/coa/${id}`, { remarks: "late" })).status === 409);
const [n9] = await sql`select count(*)::int as n from notifications where user_id = ${mgrId} and event = 'N9' and title like ${"%" + NO + "%"}`;
ok("the signatory is notified (N9)", n9!.n === 1, String(n9!.n));
const mp = await call(T.mgr, "GET", `/reports/coa/${id}`);
ok("the signatory opens it and may sign or return", mp.status === 200 && mp.body.can.sign && mp.body.can.return && mp.body.status === "awaiting_signature");
ok("the CSO sees 'awaiting signature' on the card", (await call(T.cso, "GET", `/orders/${NO}/coa`)).body.state === "awaiting_signature");
ok("a Supervisor who is not the signatory cannot open it", (await call(T.sup, "GET", `/reports/coa/${id}`)).status === 404);
ok("the Lab admin cannot return it", (await call(T.adm, "POST", `/reports/coa/${id}/return`, { comment: "x" })).status === 403);
ok("a Supervisor who is not named cannot return it", (await call(T.sup, "POST", `/reports/coa/${id}/return`, { comment: "x" })).status === 403);
ok("a return needs a comment", (await call(T.mgr, "POST", `/reports/coa/${id}/return`, { comment: "  " })).status === 422);
ok("the signatory returns it with a comment", (await call(T.mgr, "POST", `/reports/coa/${id}/return`, { comment: "Remarks missing for sample 2" })).status === 200);
const rp = await call(T.adm, "GET", `/reports/coa/${id}`);
ok("it is a draft again, with the comment", rp.body.status === "draft" && rp.body.signing.returned?.comment === "Remarks missing for sample 2", JSON.stringify(rp.body.signing));
const [n10] = await sql`select count(*)::int as n from notifications where user_id = ${admId} and event = 'N10' and title like ${"%" + NO + "%"}`;
ok("the Lab admin is notified of the return (N10)", n10!.n === 1);
ok("send again", (await call(T.adm, "POST", `/reports/coa/${id}/send`)).status === 200);
ok("the Lab admin can withdraw it", (await call(T.adm, "POST", `/reports/coa/${id}/withdraw`)).status === 200);
ok("and send it again", (await call(T.adm, "POST", `/reports/coa/${id}/send`)).status === 200);

// ---------- delegating: change the signatory ----------
ok("a person without signing rights cannot be named", (await call(T.cso, "PUT", `/orders/${NO}/signatory`, { signatoryId: admId })).status === 422);
ok("an analyst cannot change the signatory", (await call(T.ana, "PUT", `/orders/${NO}/signatory`, { signatoryId: supId })).status === 403);
const mv = await call(T.cso, "PUT", `/orders/${NO}/signatory`, { signatoryId: supId });
ok("the CSO changes the signatory and the waiting request moves", mv.status === 200 && mv.body.moved === true, JSON.stringify(mv.body));
const [n9b] = await sql`select count(*)::int as n from notifications where user_id = ${supId} and event = 'N9' and title like ${"%" + NO + "%"}`;
ok("the new signatory is notified", n9b!.n === 1);
ok("the former signatory cannot sign any more", (await call(T.mgr, "POST", `/reports/coa/${id}/sign`, { password: PW })).status === 403);
ok("the Lab admin cannot sign", (await call(T.adm, "POST", `/reports/coa/${id}/sign`, { password: PW })).status === 403);
ok("the Superadmin cannot sign", (await call(T.sa, "POST", `/reports/coa/${id}/sign`, { password: PW })).status === 403);
ok("the CSO cannot sign", (await call(T.cso, "POST", `/reports/coa/${id}/sign`, { password: PW })).status === 403);
await call(T.cso, "PUT", `/orders/${NO}/signatory`, { signatoryId: mgrId });

// ---------- sign ----------
ok("a wrong password is refused and counted", (await call(T.mgr, "POST", `/reports/coa/${id}/sign`, { password: "not-the-password" })).status === 422);
const [att] = await sql`select failed_attempts from profiles where id = ${mgrId}`;
ok("the failed attempt is counted", att!.failed_attempts === 1, String(att!.failed_attempts));
const sg = await call(T.mgr, "POST", `/reports/coa/${id}/sign`, { password: PW });
ok("the signatory signs and publishes", sg.status === 200 && sg.body.number === `CoA-${NO}-1`, JSON.stringify(sg.body));
const [rep] = await sql`select status::text as status, report_no, storage_path, sha256, verify_code, page_count, signed_by, payload from reports where id = ${id}`;
ok("the certificate is issued with its number, signer and code", rep!.status === "issued" && rep!.report_no === `CoA-${NO}-1` && rep!.signed_by === mgrId && /^[0-9A-F]{4}-[0-9A-F]{4}$/.test(rep!.verify_code), JSON.stringify({ ...rep, payload: undefined }));
const file = await admin.storage.from("reports").download(rep!.storage_path as string);
const bytes = file.data ? Buffer.from(await file.data.arrayBuffer()) : Buffer.alloc(0);
ok("the PDF is stored and its SHA-256 matches", bytes.length > 20_000 && createHash("sha256").update(bytes).digest("hex") === rep!.sha256);
ok("the payload is frozen with the signer and only the chosen bases", /Bambang Sutrisno/.test(rep!.payload.signatory.name) && JSON.stringify(rep!.payload.bases) === '["adb","ar"]' && rep!.payload.samples.length === 2);
const fc = rep!.payload.samples[0].rows.find((r: { name: string }) => r.name === "Fixed Carbon");
ok("the values print on the bases chosen, fixed carbon by difference", rep!.payload.samples[0].rows.find((r: { name: string }) => r.name === "Volatile Matter").cells.length === 2 && fc.cells.length === 2, JSON.stringify(fc));
const [jo] = await sql`select status::text as status from job_orders where order_no = ${NO}`;
ok("the job order is Reported", jo!.status === "reported");
const [n6] = await sql`select count(*)::int as n from notifications where user_id = ${csoId} and event = 'N6' and title like ${"%" + NO + "%"}`;
ok("the CSO is notified (N6)", n6!.n === 1);
ok("signing twice is refused", (await call(T.mgr, "POST", `/reports/coa/${id}/sign`, { password: PW })).status === 409);
ok("a published certificate can't be edited, withdrawn or deleted", (await call(T.adm, "PATCH", `/reports/coa/${id}`, { remarks: "x" })).status === 409 && (await call(T.adm, "POST", `/reports/coa/${id}/withdraw`)).status === 409 && (await call(T.adm, "DELETE", `/reports/coa/${id}`)).status === 409);
ok("the signatory can't be changed on a signed CoA", (await call(T.cso, "PUT", `/orders/${NO}/signatory`, { signatoryId: supId })).status === 409);

// ---------- after publishing ----------
const pub = await call(T.cso, "GET", `/reports/coa/${id}`);
ok("the CSO reads the published certificate: details, no edit", pub.status === 200 && pub.body.status === "issued" && /Bambang Sutrisno/.test(pub.body.details.signatory.name) && !pub.body.can.edit && pub.body.can.download, JSON.stringify(pub.body.details));
const cpdf = await call(T.cso, "GET", `/reports/coa/${id}/pdf`, undefined, true);
ok("the CSO downloads the stored PDF", cpdf.status === 200 && createHash("sha256").update(cpdf.buf!).digest("hex") === rep!.sha256);
const apdf = (await call(T.ana, "GET", `/reports/coa/${id}/pdf`, undefined, true)).status;
ok("an analyst cannot download a CoA (hidden by row-level security)", apdf === 403 || apdf === 404, String(apdf));
const pr = await call(T.cso, "POST", `/reports/coa/${id}/print`);
ok("a print is counted", pr.status === 200 && pr.body.count === 1);
const card2 = await call(T.cso, "GET", `/orders/${NO}/coa`);
ok("the card says published, with the signer", card2.body.state === "published" && /Bambang Sutrisno/.test(card2.body.current.signatory.name) && card2.body.current.number === `CoA-${NO}-1`, JSON.stringify(card2.body));
ok("Generate is refused once published", (await call(T.adm, "POST", `/orders/${NO}/coa`)).status === 409);
ok("the PDF of an unknown certificate is a 404", (await call(T.adm, "GET", `/reports/coa/00000000-0000-4000-8000-000000000000/pdf`, undefined, true)).status === 404);

await sql`update profiles set failed_attempts = 0 where id = ${mgrId}`;
await clean();
console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
await sql.end();
process.exit(failed ? 1 : 0);
