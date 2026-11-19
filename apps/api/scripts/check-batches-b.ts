// Live check of the batch API, slice B (Batch_Build_Design.md section 15): the analysis values and their rules, FC, Finish Analysis, the signed RoA, Complete
// batch and the freeze, who may do what, and the notifications N4. Builds one throwaway batch (B-2026-9901) on JO-2026-0142 and removes it again.
// Needs the API running and pnpm seed:orders, seed:batches. Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-batches-b.ts
import { sql } from "../src/db";
import { admin } from "../src/supabase";
import { deadlineSweep } from "../src/routes/notifications";

const API = `http://localhost:${process.env.API_PORT ?? 4000}/api`;
const PW = process.env.DEMO_PASSWORD!;
let failed = 0;
const ok = (name: string, pass: boolean, extra = "") => { if (!pass) failed++; console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : "  " + extra}`); };
type Res = { status: number; body: any };
async function call(token: string, method: string, path: string, body?: unknown): Promise<Res> {
  const r = await fetch(API + path, { method, headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function roaUpload(token: string, path: string, roaNo: string | null, name: string, data: Buffer): Promise<Res> {
  const fd = new FormData();
  if (roaNo !== null) fd.append("roaNo", roaNo);
  fd.append("file", new Blob([new Uint8Array(data)], { type: "application/pdf" }), name);
  const r = await fetch(API + path, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function signIn(email: string) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  if (r.status !== 200) throw new Error(`sign in ${email}: ${r.status}`);
  return ((await r.json()) as { accessToken: string }).accessToken;
}

const CSO = await signIn("rina@sgsi.co.id"), PREP = await signIn("dedi@sgsi.co.id"), ANA = await signIn("fitri@sgsi.co.id"), ADM = await signIn("maya@sgsi.co.id");
const NO = "B-2026-9901";
const pdf = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(200, 32), Buffer.from("\n%%EOF")]);
const paths: string[] = [];

async function clean() {
  await sql`select set_config('app.skip_audit','on',false)`;
  const [b] = await sql`select id from batches where batch_no = ${NO}`;
  const docs = b ? await sql`select storage_path from batch_documents where batch_id = ${b.id}` : [];
  if (docs.length) await admin.storage.from("batch-documents").remove(docs.map((d) => d.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    if (b) {
      await tx`delete from analyses where sample_id in (select id from samples where batch_id = ${b.id})`;
      await tx`delete from batch_documents where batch_id = ${b.id}`;
      await tx`update samples set batch_id = null where batch_id = ${b.id}`;
    }
    await tx`delete from samples where client_ref like 'ZTB-%'`;
    if (b) { await tx`delete from batch_status_log where batch_id = ${b.id}`; await tx`delete from batches where id = ${b.id}`; }
    await tx`delete from notifications where title like ${"%" + NO + "%"}`;
  });
}
await clean();

const [jo] = await sql`select j.id, j.company_id from job_orders j where j.order_no = 'JO-2026-0142'`;
if (!jo) throw new Error("Run pnpm seed:orders first (JO-2026-0142).");
const [prep] = await sql`select id from profiles where email = 'dedi@sgsi.co.id'`;
const [cso] = await sql`select id from profiles where email = 'rina@sgsi.co.id'`;
const batchId = await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit','on',true)`;
  const [b] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, status, branch_code, created_by, prep_finished_at, prep_finished_by)
    values (${jo.id}, ${jo.company_id}, ${NO}, current_date, current_date + 5, 'ASTM', 'prep_finished', 'RI', ${cso!.id}, now(), ${prep!.id}) returning id`;
  await tx`insert into batch_parameters (batch_id, parameter_id) select ${b!.id}, x.parameter_id from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${jo.id} and p.code <> all(${["PREP", "ADL"]}::text[])`;
  for (let i = 1; i <= 2; i++)
    await tx`insert into samples (job_order_id, row_no, client_ref, sample_type, batch_id, arrived_at, arrived_by, received_at, received_by, sample_no, sample_code, mass_received_kg, condition)
      values (${jo.id}, ${900 + i}, ${`ZTB-${i}`}, 'Core', ${b!.id}, now(), ${prep!.id}, now(), ${prep!.id}, ${`SG.261119.003.RI.9${i}`}, ${`003.RI.9${i}.Lot01`}, 5, 'Good')`;
  return b!.id as string;
});

const g0 = await call(ANA, "GET", `/batches/${NO}/analysis`);
const cols = (g0.body?.cols ?? []) as Array<{ key: string; code: string; kind: string }>;
const col = (c: string) => cols.find((x) => x.code === c)!.key;
const rows = (g0.body?.rows ?? []) as Array<{ id: string; clientRef: string }>;
ok("analyst reads the grid: 6 entry columns, FC calculated", g0.status === 200 && cols.filter((c) => c.kind !== "calc").length === 6 && cols.find((c) => c.code === "FC")?.kind === "calc", JSON.stringify(g0.body).slice(0, 200));
ok("total is samples times entry columns (12)", g0.body?.total === 12 && g0.body?.saved === 0);
ok("nothing can finish yet", g0.body?.canFinish === false);
const [s1, s2] = rows.map((r) => r.id) as [string, string];
const put = (values: Array<{ sampleId: string; key: string; value: string | null }>, tok = ANA) => call(tok, "PUT", `/batches/${NO}/analysis`, { values });

ok("the Preparation role can't enter values", (await put([{ sampleId: s1, key: col("TM"), value: "10" }], PREP)).status === 403);
ok("the CSO can't enter values", (await put([{ sampleId: s1, key: col("TM"), value: "10" }], CSO)).status === 403);
ok("text in a number cell is refused", (await put([{ sampleId: s1, key: col("TM"), value: "abc" }])).status === 422);
ok("too many decimals are refused", (await put([{ sampleId: s1, key: col("TM"), value: "10.123" }])).status === 422);
ok("a percentage above 100 is refused", (await put([{ sampleId: s1, key: col("TM"), value: "101" }])).status === 422);
ok('"<" is refused where not allowed', (await put([{ sampleId: s1, key: col("TM"), value: "<1" }])).status === 422);
const calc = await put([{ sampleId: s1, key: col("FC"), value: "40" }]);
ok("a calculated cell can't be typed", calc.status === 409, JSON.stringify(calc.body));
ok("an unknown sample is refused", (await put([{ sampleId: "00000000-0000-4000-8000-000000000000", key: col("TM"), value: "10" }])).status === 404);

const first = await put([
  { sampleId: s1, key: col("TM"), value: "18,50" }, { sampleId: s1, key: col("IM"), value: "9.00" }, { sampleId: s1, key: col("ASH"), value: "47.30" },
  { sampleId: s1, key: col("VM"), value: "40.20" }, { sampleId: s1, key: col("TS"), value: "0.55" }, { sampleId: s1, key: col("GCV"), value: "2310" },
]);
ok("Save all saves six values (a comma is accepted)", first.status === 200 && first.body?.saved === 6, JSON.stringify(first.body));
const g1 = await call(ANA, "GET", `/batches/${NO}/analysis`);
const cell = (g: any, sample: string, c: string) => g.body.rows.find((r: any) => r.id === sample)?.cells[col(c)];
ok("the first save starts the analysis", g1.body?.status === "analysis" && !!g1.body?.startedAt);
ok("TM 18,50 is kept as 18.50", Number(cell(g1, s1, "TM")?.value) === 18.5);
ok("FC = 100 - IM - Ash - VM, stored as calculated", cell(g1, s1, "FC")?.calc === true && Number(cell(g1, s1, "FC")?.value) === Number((100 - 9 - 47.3 - 40.2).toFixed(2)), JSON.stringify(cell(g1, s1, "FC")));
ok("an out-of-range Ash and GCV add a warning line", (g1.body?.checks ?? []).some((c: any) => c.warn && /ZTB-1 has Ash and GCV outside the typical range/.test(c.text)), JSON.stringify(g1.body?.checks));
ok("saved is 6 of 12", g1.body?.saved === 6);

ok("Finish is refused until every value is in", (await call(ANA, "POST", `/batches/${NO}/finish-analysis`)).status === 409);
const clr = await put([{ sampleId: s1, key: col("TS"), value: null }]);
ok("a saved value can be cleared before Finish", clr.status === 200 && clr.body?.cleared === 1);
const g2 = await call(ANA, "GET", `/batches/${NO}/analysis`);
ok("clearing lowers the count", g2.body?.saved === 5);

await put([
  { sampleId: s1, key: col("TS"), value: "0.55" },
  { sampleId: s2, key: col("TM"), value: "6.00" }, { sampleId: s2, key: col("IM"), value: "8.00" }, { sampleId: s2, key: col("ASH"), value: "9.00" },
  { sampleId: s2, key: col("VM"), value: "40.00" }, { sampleId: s2, key: col("TS"), value: "0.40" }, { sampleId: s2, key: col("GCV"), value: "5500" },
]);
const g3 = await call(ANA, "GET", `/batches/${NO}/analysis`);
ok("all 12 values saved, but TM below IM blocks Finish", g3.body?.saved === 12 && g3.body?.canFinish === false && (g3.body?.checks ?? []).some((c: any) => !c.warn && /below inherent moisture/.test(c.text)), JSON.stringify(g3.body?.checks));
const blocked = await call(ANA, "POST", `/batches/${NO}/finish-analysis`);
ok("Finish says why (V-12)", blocked.status === 409 && /below inherent moisture/.test(blocked.body?.text ?? ""), JSON.stringify(blocked.body));
await put([{ sampleId: s2, key: col("TM"), value: "12.00" }]);
ok("Preparation can't finish the analysis", (await call(PREP, "POST", `/batches/${NO}/finish-analysis`)).status === 403);
const cs = await call(CSO, "GET", `/batches/${NO}/analysis`);
ok("the CSO gets counts only", cs.status === 200 && cs.body?.hidden === true && cs.body?.saved === 12 && !cs.body?.rows && !cs.body?.cols);
const pg = await call(CSO, "GET", `/batches/${NO}/progress`);
ok("progress gives counts to the CSO", pg.status === 200 && pg.body?.values?.saved === 12);

const early = await call(ADM, "POST", `/batches/${NO}/complete`);
ok("Complete is refused before the analysis is finished", early.status === 409);
const fin = await call(ANA, "POST", `/batches/${NO}/finish-analysis`);
ok("Finish Analysis", fin.status === 200, JSON.stringify(fin.body));
ok("the batch is Analysis finished", (await call(ANA, "GET", `/batches/${NO}/analysis`)).body?.status === "analysis_finished");
ok("values are locked after Finish", (await put([{ sampleId: s1, key: col("TS"), value: "0.60" }])).status === 409);
const n4 = await sql`select n.id from notifications n join profiles p on p.id = n.user_id where n.event = 'N4' and n.title like ${"%" + NO + "%"} and p.email = 'maya@sgsi.co.id'`;
ok("N4 goes to the Lab admin", n4.length === 1);

/* notifications: the lists, mark read, and the deadline timer (N7, N8) */
const mine = await call(ADM, "GET", "/notifications?limit=5");
ok("a user reads their own notifications", mine.status === 200 && Array.isArray(mine.body?.items) && mine.body.items.some((n: any) => n.title.includes(NO)), JSON.stringify(mine.body).slice(0, 200));
const n4id = mine.body?.items?.find((n: any) => n.event === "N4" && n.title.includes(NO))?.id as string;
ok("another user can't mark it read", (await call(ANA, "POST", `/notifications/${n4id}/read`)).status === 404);
ok("mark one read", (await call(ADM, "POST", `/notifications/${n4id}/read`)).status === 200 && (await call(ADM, "GET", "/notifications?unread=true&limit=50")).body.items.every((n: any) => n.id !== n4id));
await sql`update batches set deadline_on = current_date + 1 where batch_no = ${NO}`;
await deadlineSweep(); await deadlineSweep();
const n7 = await sql`select n.id from notifications n join profiles p on p.id = n.user_id where n.event = 'N7' and n.title like ${"%" + NO + "%"} and p.email = 'maya@sgsi.co.id'`;
ok("N7 (due tomorrow) goes to the queue's role, once", n7.length === 1, String(n7.length));
await sql`update batches set deadline_on = current_date - 1, batch_date = current_date - 5 where batch_no = ${NO}`;
await deadlineSweep(); await deadlineSweep();
const n8 = await sql`select p.email from notifications n join profiles p on p.id = n.user_id where n.event = 'N8' and n.title like ${"%" + NO + "%"}`;
ok("N8 (past its deadline) goes to the Supervisor and Manager, once each", n8.length >= 2 && new Set(n8.map((x) => x.email)).size === n8.length, JSON.stringify(n8));
await sql`update batches set deadline_on = current_date + 5, batch_date = current_date where batch_no = ${NO}`;

/* signed RoA */
ok("the analyst can't upload the RoA", (await roaUpload(ANA, `/batches/${NO}/roa`, "RoA-ZT1", "a.pdf", pdf)).status === 403);
ok("Complete is refused without the RoA", (await call(ADM, "POST", `/batches/${NO}/complete`)).status === 409);
ok("the RoA number is required", (await roaUpload(ADM, `/batches/${NO}/roa`, "", "a.pdf", pdf)).status === 422);
ok("a file that is not a PDF is refused", (await roaUpload(ADM, `/batches/${NO}/roa`, "RoA-ZT1", "a.pdf", Buffer.from("hello world, not a pdf"))).status === 415);
const up = await roaUpload(ADM, `/batches/${NO}/roa`, "RoA-ZT1", "RoA-ZT1.pdf", pdf);
ok("the Lab admin uploads the signed RoA", up.status === 201, JSON.stringify(up.body));
const roa1 = await call(ADM, "GET", `/batches/${NO}/roa`);
ok("the RoA shows with its file for roles that download", roa1.body?.roa?.roaNo === "RoA-ZT1" && roa1.body?.roa?.fileName === "RoA-ZT1.pdf" && roa1.body?.canDownload === true);
const roaCso = await call(CSO, "GET", `/batches/${NO}/roa`);
ok("the CSO sees the RoA number but no file", roaCso.body?.roa?.roaNo === "RoA-ZT1" && roaCso.body?.roa?.fileName === null && roaCso.body?.canDownload === false);
const rep = await roaUpload(ADM, `/batches/${NO}/roa`, "RoA-ZT2", "RoA-ZT2.pdf", pdf);
ok("the file can be replaced before Complete", rep.status === 201 && (await call(ADM, "GET", `/batches/${NO}/roa`)).body?.roa?.roaNo === "RoA-ZT2");
const dl = await call(ADM, "GET", `/batches/${NO}/roa/file`);
ok("download gives a signed link", dl.status === 200 && /^https?:\/\//.test(dl.body?.url ?? ""), JSON.stringify(dl.body));
ok("the CSO can't download", (await call(CSO, "GET", `/batches/${NO}/roa/file`)).status === 403);
ok("the analyst can't complete the batch", (await call(ANA, "POST", `/batches/${NO}/complete`)).status === 403);
const done = await call(ADM, "POST", `/batches/${NO}/complete`);
ok("Complete batch", done.status === 200, JSON.stringify(done.body));
const frozen = await sql`select count(*)::int as n, count(*) filter (where status = 'verified')::int as v from analyses where sample_id in (select id from samples where batch_id = ${batchId})`;
ok("every value is verified", frozen[0]!.n > 0 && frozen[0]!.n === frozen[0]!.v, JSON.stringify(frozen[0]));
ok("the batch is Completed", (await call(ADM, "GET", `/batches/${NO}/roa`)).body?.status === "completed");
ok("values stay locked", (await put([{ sampleId: s1, key: col("TS"), value: "0.70" }])).status === 409);
ok("the RoA can't change after Complete", (await roaUpload(ADM, `/batches/${NO}/roa`, "RoA-ZT3", "c.pdf", pdf)).status === 409);
ok("the RoA can't be removed after Complete", (await call(ADM, "DELETE", `/batches/${NO}/roa`)).status === 409);
ok("Complete twice is refused", (await call(ADM, "POST", `/batches/${NO}/complete`)).status === 409);

void paths;
await clean();
await sql.end();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
