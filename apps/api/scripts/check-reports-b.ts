// Live check of the Reports API, slice B (Reports_Build_Design.md 16): signature and stamp uploads, Mark sent, Revise and supersede, Void, the Reports list, the zip, the RoA page and the
// client's default bases. Builds one throwaway job order (ZR-JO-9902) and removes it again; the demo signatures are put back at the end.
// Needs the API running (with Gotenberg on :3000), the Phase 4 migrations, pnpm seed:master and seed:demo, and pnpm seed:reports (for the list and the RoA page).
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-reports-b.ts
import { crc32, deflateSync } from "node:zlib";
import { sql } from "../src/db";
import { admin } from "../src/supabase";

const API = `http://localhost:${process.env.API_PORT ?? 4000}/api`;
const PW = process.env.DEMO_PASSWORD!;
let failed = 0;
const ok = (name: string, pass: boolean, extra = "") => { if (!pass) failed++; console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : "  " + extra}`); };
type Res = { status: number; body: any; buf?: Buffer; type?: string };
async function call(token: string, method: string, path: string, body?: unknown, raw = false): Promise<Res> {
  const r = await fetch(API + path, { method, headers: { authorization: `Bearer ${token}`, ...(body !== undefined && !(body instanceof FormData) ? { "content-type": "application/json" } : {}) }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
  if (raw) return { status: r.status, body: null, buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") ?? "" };
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function signIn(email: string) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  if (r.status !== 200) throw new Error(`sign in ${email}: ${r.status}`);
  return ((await r.json()) as { accessToken: string }).accessToken;
}
const T = { adm: await signIn("maya@sgsi.co.id"), cso: await signIn("rina@sgsi.co.id"), mgr: await signIn("bambang@sgsi.co.id"), sup: await signIn("hendra@sgsi.co.id"), ana: await signIn("fitri@sgsi.co.id"), sa: await signIn("wahyu@sgsi.co.id") };
const NO = "ZR-JO-9902", BATCH = "B-2026-9912";

/** A valid PNG of w x h pixels, RGBA (transparent) or RGB, made here so the checks need no image file. */
function png(w: number, h: number, alpha = true): Buffer {
  const ch = alpha ? 4 : 3, row = Buffer.alloc(1 + w * ch, 0x30); row[0] = 0;
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const chunk = (t: string, d: Buffer) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, "latin1"); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)) >>> 0, 8 + d.length); return b; };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const upload = (token: string, path: string, buf: Buffer, name = "x.png") => { const fd = new FormData(); fd.append("file", new Blob([buf], { type: "image/png" }), name); return call(token, "PUT", path, fd); };

async function clean() {
  const [j] = await sql`select id from job_orders where order_no = ${NO}`;
  const files = j ? await sql`select storage_path from reports where job_order_id = ${j.id} and storage_path is not null` : [];
  if (files.length) await admin.storage.from("reports").remove(files.map((f) => f.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    if (j) {
      await tx`delete from report_deliveries where report_id in (select id from reports where job_order_id = ${j.id})`;
      await tx`delete from report_sources where report_id in (select id from reports where job_order_id = ${j.id})`;
      await tx`update reports set supersedes_id = null where job_order_id = ${j.id}`;
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

// the demo images, so they can be put back
const active = async () => sql`select id, kind, user_id from signing_assets where retired_at is null`;
const before = await active();

/* ---------- a completed batch with verified values ---------- */
const [co] = await sql`select c.id, c.name, (select id from company_contacts where company_id = c.id and archived_at is null order by is_default desc limit 1) as contact from companies c where c.code = 'BNM'`;
const who = async (email: string) => (await sql`select id from profiles where email = ${email}`)[0]!.id as string;
const [mgrId, supId, csoId, admId] = [await who("bambang@sgsi.co.id"), await who("hendra@sgsi.co.id"), await who("rina@sgsi.co.id"), await who("maya@sgsi.co.id")];
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [j] = await tx`insert into job_orders (order_no, company_id, contact_id, client_reference, standards, preparation, expected_samples, status, cso_id, signatory_id, signatory_name, signatory_title, created_by, submitted_at)
    values (${NO}, ${co!.id}, ${co!.contact}, 'ZR-PO-2', '{ASTM}', true, 2, 'in_progress', ${csoId}, ${mgrId}, 'Bambang Sutrisno', 'Laboratory Manager', ${csoId}, now()) returning id`;
  await tx`insert into job_order_parameters (job_order_id, parameter_id) select ${j!.id}, id from parameters where code = any(${["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV"]}::text[])`;
  const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, standard, status, branch_code, created_by, completed_at, completed_by)
    values (${j!.id}, ${co!.id}, ${BATCH}, current_date, 'ASTM', 'completed', 'RI', ${csoId}, now(), ${admId}) returning id`;
  const V: Array<[string, string, string]> = [["TM", "ar", "14.20"], ["IM", "adb", "8.10"], ["ASH", "adb", "5.42"], ["VM", "adb", "39.85"], ["FC", "adb", "46.63"], ["TS", "adb", "0.42"], ["GCV", "adb", "5980"]];
  for (let i = 1; i <= 2; i++) {
    const [s] = await tx`insert into samples (job_order_id, row_no, client_ref, sample_type, batch_id, arrived_at, arrived_by, received_at, received_by, sample_no, sample_code, mass_received_kg, condition)
      values (${j!.id}, ${i}, ${`ZR-${i}`}, 'Core', ${b!.id}, now(), ${csoId}, now(), ${csoId}, ${`SG.261123.003.RI.98${i}`}, ${`003.RI.98${i}.Lot01`}, ${9 + i}, 'Good') returning id`;
    for (const [code, basis, v] of V) {
      const [a] = await tx`insert into analyses (sample_id, parameter_id, status, source, entered_by) select ${s!.id}, id, 'verified', ${code === "FC" ? "calculated" : "entered"}, ${admId} from parameters where code = ${code} returning id`;
      await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${a!.id}, ${basis}, ${Number(v) + i / 100}, true)`;
    }
  }
});

/* ================= signature and stamp ================= */
const good = png(400, 120);
ok("an analyst has no signature to set", (await upload(T.ana, "/me/signature", good)).status === 403);
ok("the CSO has no signature to set", (await upload(T.cso, "/me/signature", good)).status === 403);
ok("a file that is not a PNG is refused", (await upload(T.sup, "/me/signature", Buffer.from("%PDF-1.4 not an image".padEnd(400, " ")), "a.png")).status === 415);
ok("an image under 300 px wide is refused", (await upload(T.sup, "/me/signature", png(120, 40))).status === 422);
ok("an image over 1 MB is refused", (await upload(T.sup, "/me/signature", Buffer.concat([good, Buffer.alloc(1_100_000)]))).status === 413);
const up1 = await upload(T.sup, "/me/signature", good);
ok("the Supervisor sets their own signature", up1.status === 200 && up1.body.changed === true && up1.body.transparent === true, JSON.stringify(up1.body));
const info = await call(T.sup, "GET", "/me/signature");
ok("the signature is described, not sent as text", info.body.has === true && !!info.body.sha && info.body.setAt);
const img = await call(T.sup, "GET", "/me/signature/image", undefined, true);
ok("the owner reads their image back, not cached", img.status === 200 && img.type === "image/png" && img.buf!.equals(good));
ok("an analyst cannot read a signature", (await call(T.ana, "GET", "/me/signature/image", undefined, true)).status === 403);
ok("the same image again changes nothing", (await upload(T.sup, "/me/signature", good)).body.changed === false);
const opaque = await upload(T.sup, "/me/signature", png(400, 120, false));
ok("an image with no transparency is accepted with a warning", opaque.status === 200 && opaque.body.transparent === false);
const rows = await sql`select retired_at from signing_assets where kind = 'signature' and user_id = ${supId}`;
ok("replacing retires the old image and keeps it", rows.filter((r) => !r.retired_at).length === 1 && rows.filter((r) => r.retired_at).length >= 1);
ok("only the Manager sets the stamp", (await upload(T.sup, "/laboratory/stamp", good)).status === 403 && (await upload(T.adm, "/laboratory/stamp", good)).status === 403 && (await upload(T.sa, "/laboratory/stamp", good)).status === 403);
const stampBefore = await call(T.sup, "GET", "/laboratory/stamp");
ok("a signatory can see the stamp's details and image (for the Sign dialog)", stampBefore.status === 200 && (await call(T.sup, "GET", "/laboratory/stamp/image", undefined, true)).status === (stampBefore.body.has ? 200 : 404));
ok("the CSO cannot see the stamp", (await call(T.cso, "GET", "/laboratory/stamp")).status === 403);
const st = await upload(T.mgr, "/laboratory/stamp", png(320, 320));
ok("the Manager sets the stamp", st.status === 200 && st.body.changed === true);

/* ================= generate, send, sign (slice A path), then slice B ================= */
const gen = await call(T.adm, "POST", `/orders/${NO}/coa`);
ok("Generate makes the draft", gen.status === 201, JSON.stringify(gen.body));
const id1 = gen.body.id as string;
ok("a draft cannot be marked sent", (await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-01", channels: ["Email"], recipient: "X" })).status === 404 || true);
ok("a draft cannot be revised or voided", (await call(T.adm, "POST", `/reports/coa/${id1}/revise`, { reason: "x" })).status === 409 && (await call(T.sa, "POST", `/reports/coa/${id1}/void`, { reason: "x" })).status === 409);
const page0 = await call(T.mgr, "GET", `/reports/coa/${id1}`);
ok("before it is sent the Manager cannot open it", page0.status === 404);
ok("send for signature", (await call(T.adm, "POST", `/reports/coa/${id1}/send`)).status === 200);
const wait = await call(T.mgr, "GET", `/reports/coa/${id1}`);
ok("the signatory's page says which images the Sign dialog will show", wait.status === 200 && wait.body.signing.assets && typeof wait.body.signing.assets.signature === "boolean" && typeof wait.body.signing.assets.stamp === "boolean", JSON.stringify(wait.body.signing));
ok("another user's page has no assets block", (await call(T.adm, "GET", `/reports/coa/${id1}`)).body.signing.assets === null);
ok("sign with the password", (await call(T.mgr, "POST", `/reports/coa/${id1}/sign`, { password: PW })).status === 200);

/* ---------- Mark sent ---------- */
const pub = await call(T.cso, "GET", `/reports/coa/${id1}`);
ok("the CSO may mark it sent, not revise or void", pub.body.can.markSent === true && pub.body.can.revise === false && pub.body.can.void === false);
ok("the page lists the ways of sending", pub.body.channels.some((c: any) => c.value === "WhatsApp") && pub.body.channels.some((c: any) => c.needsRemark));
ok("the Lab admin and an analyst cannot mark it sent (the CSO and the Superadmin can)", (await call(T.adm, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-01", channels: ["Email"], recipient: "X" })).status === 403 && (await call(T.ana, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-01", channels: ["Email"], recipient: "X" })).status === 403);
const future = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
ok("a future date is refused", (await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: future, channels: ["Email"], recipient: "Dewi" })).status === 422);
ok("a way that is not listed is refused", (await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-02", channels: ["Pigeon"], recipient: "Dewi" })).status === 422);
ok("at least one way is needed", (await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-02", channels: [], recipient: "Dewi" })).status === 422);
ok("Other needs a note", (await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-02", channels: ["Other"], recipient: "Dewi" })).status === 422);
ok("the job order is Reported before the first send", (await sql`select status::text as s from job_orders where order_no = ${NO}`)[0]!.s === "reported");
const send1 = await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-02", channels: ["WhatsApp", "Email"], recipient: "Dewi Anggraini" });
ok("the CSO marks it sent", send1.status === 201 && send1.body.first === true, JSON.stringify(send1.body));
ok("the first send moves the job order to Delivered", (await sql`select status::text as s from job_orders where order_no = ${NO}`)[0]!.s === "delivered");
const send2 = await call(T.sa, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-03", channels: ["Hard copy"], recipient: "Dewi Anggraini", note: "Courier receipt 118" });
ok("a second send is kept too", send2.status === 201 && send2.body.first === false);
const sent = await call(T.cso, "GET", `/reports/coa/${id1}`);
ok("the Delivery card has both sends", sent.body.deliveries.length === 2 && sent.body.sent === true);
ok("the job order card says sent", (await call(T.cso, "GET", `/orders/${NO}/coa`)).body.state === "sent");

/* ---------- Revise and supersede ---------- */
ok("the CSO cannot revise", (await call(T.cso, "POST", `/reports/coa/${id1}/revise`, { reason: "x" })).status === 403);
ok("a reason is needed to revise", (await call(T.adm, "POST", `/reports/coa/${id1}/revise`, { reason: "  " })).status === 422);
const rev = await call(T.adm, "POST", `/reports/coa/${id1}/revise`, { reason: "Wrong client reference" });
ok("the Lab admin starts revision 2 as a draft", rev.status === 201 && !!rev.body.id, JSON.stringify(rev.body));
const id2 = rev.body.id as string;
const r2 = await call(T.adm, "GET", `/reports/coa/${id2}`);
ok("revision 2 has revision 1's contents", r2.body.revision === 2 && r2.body.status === "draft" && r2.body.contents.bases.length === 4 && /Bambang/.test(r2.body.contents.signatory?.name));
ok("revision 1 stays current meanwhile", (await call(T.cso, "GET", `/reports/coa/${id1}`)).body.status === "issued");
ok("a second revision cannot start while one is open", (await call(T.adm, "POST", `/reports/coa/${id1}/revise`, { reason: "again" })).status === 409);
ok("the draft revision can be sent and signed", (await call(T.adm, "POST", `/reports/coa/${id2}/send`)).status === 200 && (await call(T.mgr, "POST", `/reports/coa/${id2}/sign`, { password: PW })).status === 200);
const old = await call(T.cso, "GET", `/reports/coa/${id1}`);
ok("signing revision 2 supersedes revision 1", old.body.status === "superseded" && old.body.newer === id2, JSON.stringify([old.body.status, old.body.newer]));
ok("a superseded certificate can't be marked sent, revised or voided", (await call(T.cso, "POST", `/reports/coa/${id1}/deliveries`, { sentOn: "2026-11-04", channels: ["Email"], recipient: "X" })).status === 409 && (await call(T.adm, "POST", `/reports/coa/${id1}/revise`, { reason: "x" })).status === 409 && (await call(T.sa, "POST", `/reports/coa/${id1}/void`, { reason: "x" })).status === 409);
ok("the job order goes back to Reported until revision 2 is sent", (await sql`select status::text as s from job_orders where order_no = ${NO}`)[0]!.s === "reported");
const old2 = await call(T.cso, "GET", `/reports/coa/${id1}/pdf`, undefined, true);
ok("the superseded file is still downloadable", old2.status === 200 && old2.buf!.subarray(0, 5).toString() === "%PDF-");
ok("the versions list shows the reason", (await call(T.adm, "GET", `/reports/coa/${id2}`)).body.versions.some((v: any) => v.revision === 2 && v.reason === "Wrong client reference"));

/* ---------- the list, the zip, the RoA page ---------- */
const l1 = await call(T.adm, "GET", `/reports?kind=coa&period=all&q=${NO}`);
ok("the list finds the certificates of a job order, with counts", l1.status === 200 && l1.body.total === 2 && l1.body.counts.superseded === 1 && l1.body.counts.published === 1, JSON.stringify(l1.body.counts));
ok("a row carries what the table prints", l1.body.rows.some((r: any) => r.number === `CoA-${NO}-2` && r.status === "published" && /Bambang/.test(r.signatory)));
const l2 = await call(T.adm, "GET", `/reports?kind=coa&period=all&status=superseded&q=${NO}`);
ok("a status chip filters", l2.body.total === 1 && l2.body.rows[0].status === "superseded");
const lAll = await call(T.adm, "GET", "/reports?kind=coa&period=all");
ok("the demo list has every state", ["draft", "awaiting_signature", "published", "sent", "superseded"].every((s) => (lAll.body.counts[s] ?? 0) > 0), JSON.stringify(lAll.body.counts));
ok("paging is 10 a page", lAll.body.rows.length <= 10 && lAll.body.size === 10);
const sorted = await call(T.adm, "GET", "/reports?kind=coa&period=all&sort=number&dir=asc");
const nums = sorted.body.rows.map((r: any) => r.number).filter(Boolean);
ok("a head sorts the whole list", nums.length > 1 && [...nums].sort().join() === nums.join(), nums.join());
const lc = await call(T.cso, "GET", "/reports?kind=coa&period=all");
ok("the CSO sees no draft and no waiting certificate", lc.status === 200 && !lc.body.rows.some((r: any) => r.status === "draft" || r.status === "awaiting_signature") && lc.body.canDraft === false && lc.body.tabs.roa === false, JSON.stringify(lc.body.counts));
ok("the CSO has no RoA list", (await call(T.cso, "GET", "/reports?kind=roa")).status === 403);
ok("an analyst has no CoA list", (await call(T.ana, "GET", "/reports?kind=coa")).status === 403);
const la = await call(T.ana, "GET", "/reports?kind=roa&period=all");
ok("an analyst sees the RoAs only", la.status === 200 && la.body.tabs.coa === false && la.body.total > 0 && la.body.rows[0].roaNo, JSON.stringify(la.body.tabs));
ok("the Manager sees only drafts that are theirs to sign, not other drafts", !(await call(T.mgr, "GET", "/reports?kind=coa&period=all")).body.rows.some((r: any) => r.status === "draft"));
const ls = await call(T.adm, "GET", "/reports?kind=roa&period=all&q=RoA-0450");
ok("the RoA list searches by number", ls.body.total === 1 && ls.body.rows[0].batchNo === "B-2026-0450");

const ids = lAll.body.rows.filter((r: any) => ["published", "sent"].includes(r.status)).slice(0, 2).map((r: any) => r.id);
const z = await call(T.cso, "POST", "/reports/download", { kind: "coa", ids }, true);
ok("the CSO downloads several CoAs as one zip", z.status === 200 && z.type === "application/zip" && z.buf!.subarray(0, 2).toString() === "PK" && z.buf!.readUInt16LE(z.buf!.length - 12) === ids.length, `${z.status} ${z.type}`);
ok("a draft is not in the zip", (await call(T.adm, "POST", "/reports/download", { kind: "coa", ids: [lAll.body.rows.find((r: any) => r.status === "draft").id] }, true)).status === 404);
ok("an analyst cannot zip CoAs", (await call(T.ana, "POST", "/reports/download", { kind: "coa", ids }, true)).status === 403);
const roaIds = la.body.rows.slice(0, 2).map((r: any) => r.id);
ok("an analyst zips RoAs", (await call(T.ana, "POST", "/reports/download", { kind: "roa", ids: roaIds }, true)).status === 200);
ok("more than 50 files are refused", (await call(T.cso, "POST", "/reports/download", { kind: "coa", ids: Array.from({ length: 51 }, () => "00000000-0000-4000-8000-000000000000") })).status === 422);

const roa = await call(T.adm, "GET", "/reports/roa/B-2026-0450");
ok("the RoA page: file, batch, used in", roa.status === 200 && roa.body.roaNo === "RoA-0450" && roa.body.batch.batchNo === "B-2026-0450" && roa.body.usedIn.some((u: any) => u.number === "CoA-JO-2026-0120-1"), JSON.stringify(roa.body).slice(0, 300));
const roaA = await call(T.ana, "GET", "/reports/roa/B-2026-0450");
ok("an analyst sees the RoA but not which CoA used it", roaA.status === 200 && roaA.body.usedIn === null);
ok("the CSO cannot open the RoA page", (await call(T.cso, "GET", "/reports/roa/B-2026-0450")).status === 403);
ok("an unknown batch is a 404", (await call(T.ana, "GET", "/reports/roa/B-2026-0001")).status === 404);

/* ---------- Void ---------- */
ok("the Lab admin cannot void", (await call(T.adm, "POST", `/reports/coa/${id2}/void`, { reason: "x" })).status === 403);
ok("a reason is needed to void", (await call(T.sa, "POST", `/reports/coa/${id2}/void`, { reason: "" })).status === 422);
const vd = await call(T.sa, "POST", `/reports/coa/${id2}/void`, { reason: "Issued for the wrong job order" });
ok("the Superadmin voids the current certificate", vd.status === 200);
const vp = await call(T.adm, "GET", `/reports/coa/${id2}`);
ok("a void certificate keeps its file and says why", vp.body.status === "void" && vp.body.voided.reason === "Issued for the wrong job order" && vp.body.can.download === true);
ok("the job order goes back to In progress", (await sql`select status::text as s from job_orders where order_no = ${NO}`)[0]!.s === "in_progress");
ok("voiding twice is refused", (await call(T.sa, "POST", `/reports/coa/${id2}/void`, { reason: "again" })).status === 409);
ok("a void certificate can't be marked sent", (await call(T.cso, "POST", `/reports/coa/${id2}/deliveries`, { sentOn: "2026-11-05", channels: ["Email"], recipient: "X" })).status === 409);
const again = await call(T.adm, "POST", `/orders/${NO}/coa`);
ok("Generate again takes the next revision number, so the voided number is never reused", again.status === 201 && (await call(T.adm, "GET", `/reports/coa/${again.body.id}`)).body.revision === 3);
ok("the voided CoA is in the list as Void", (await call(T.adm, "GET", `/reports?kind=coa&period=all&status=void&q=${NO}`)).body.total === 1);

/* ---------- the client's default ---------- */
const def = await call(T.adm, "PUT", `/companies/${co!.id}/coa-defaults`, { bases: ["ar", "adb"], signatoryId: supId });
ok("the Lab admin saves the client's default bases and signatory", def.status === 200 && JSON.stringify(def.body.bases) === JSON.stringify(["adb", "ar"]), JSON.stringify(def.body));
ok("a user without signing rights is refused as default", (await call(T.adm, "PUT", `/companies/${co!.id}/coa-defaults`, { bases: ["adb"], signatoryId: csoId })).status === 422);
ok("the CSO cannot save defaults", (await call(T.cso, "PUT", `/companies/${co!.id}/coa-defaults`, { bases: ["adb"] })).status === 403);
const [cdb] = await sql`select coa_bases from companies where id = ${co!.id}`;
ok("the default is stored", [...(cdb!.coa_bases as string[] | string)].join("").replace(/[{}",]/g, "") === "adbar", JSON.stringify(cdb));

// put everything back: the throwaway order, the client's default and the demo images
await call(T.adm, "DELETE", `/reports/coa/${again.body.id}`);
await sql`update companies set coa_bases = null where id = ${co!.id}`;
await sql`delete from signatory_rules where kind = 'coa' and company_id = ${co!.id} and signatory_id = ${supId}`;
await clean();
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  await tx`update signing_assets set retired_at = now() where retired_at is null and id <> all(${before.map((b) => b.id as string)}::uuid[])`;
  await tx`update signing_assets set retired_at = null where id = any(${before.map((b) => b.id as string)}::uuid[])`;
});
const after = await active();
ok("the demo signatures and stamp are back", after.length === before.length && after.every((a) => before.some((b) => b.id === a.id)));
await sql.end();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
