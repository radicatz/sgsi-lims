// Live check of the batch API, slice A (Batch_Build_Design.md): who may read and write, the list and its filters, Add batch and its rules, the job order's
// Batches tab, the batch number, the Reception rows (arrival gives the Sample ID and the sample code), mass and condition rules, hold, photos, labels, Confirm
// reception (with fewer samples), the notifications. Needs the API running and pnpm seed:orders, seed:batches. Test rows start with "ZT".
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-batches.ts
import { sql } from "../src/db";
import { admin } from "../src/supabase";

const API = `http://localhost:${process.env.API_PORT ?? 4000}/api`;
const PW = process.env.DEMO_PASSWORD!;
let failed = 0;
const ok = (name: string, pass: boolean, extra = "") => { if (!pass) failed++; console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : "  " + extra}`); };
type Res = { status: number; body: any };
async function call(token: string, method: string, path: string, body?: unknown): Promise<Res> {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function upload(token: string, path: string, name: string, data: Buffer, mime: string, tag = "Condition"): Promise<Res> {
  const fd = new FormData();
  fd.append("tag", tag);
  fd.append("file", new Blob([new Uint8Array(data)], { type: mime }), name);
  const r = await fetch(API + path, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function signIn(email: string) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  if (r.status !== 200) throw new Error(`sign in ${email}: ${r.status}`);
  return ((await r.json()) as { accessToken: string }).accessToken;
}

const CSO = await signIn("rina@sgsi.co.id"), PREP = await signIn("dedi@sgsi.co.id"), ANA = await signIn("fitri@sgsi.co.id"), ADM = await signIn("maya@sgsi.co.id"), SUP = await signIn("hendra@sgsi.co.id");
const made: string[] = [], madeOrders: string[] = [];
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40)]);
const [bnm] = await sql`select id from companies where code = 'BNM'`;
const bnmContact = (await sql`select id from company_contacts where company_id = ${bnm!.id} and archived_at is null order by is_default desc limit 1`)[0]!.id as string;
const params = await sql`select id, code from parameters where code in ('PREP','TM','IM','ASH','VM','HGI','ASH_ANALYSIS') and active`;
const pid = (c: string) => params.find((p) => p.code === c)!.id as string;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());
const yymmdd = today.slice(2, 4) + today.slice(5, 7) + today.slice(8, 10);
const bnmCode = (await sql`select company_code from companies where id = ${bnm!.id}`)[0]!.company_code as string;

try {
  /* a job order with six samples to work with */
  const mk = await call(CSO, "POST", "/orders", { orderNo: "ZT-JO-0201", companyId: bnm!.id, contactId: bnmContact, clientReference: "ZT batches", standards: ["ASTM", "ISO"], parameterIds: [pid("PREP"), pid("TM"), pid("IM"), pid("ASH"), pid("VM")],
    expectedSamples: 6, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", notes: "", submit: true }); madeOrders.push("ZT-JO-0201");
  ok("the test job order is created and submitted", mk.status === 201, JSON.stringify(mk.body));
  const draftOrder = await call(CSO, "POST", "/orders", { orderNo: "ZT-JO-0202", companyId: bnm!.id, contactId: null, clientReference: "ZT draft", standards: ["ASTM"], parameterIds: [], expectedSamples: null, sampleType: null, dueOn: null, priority: "Standard", submit: false }); madeOrders.push("ZT-JO-0202");
  await call(CSO, "PUT", "/orders/ZT-JO-0201/samples", { rows: ["ZT-A1", "ZT-A2", "ZT-A3", "ZT-A4", "ZT-A5", "ZT-A6"].map((c) => ({ clientRef: c, description: `Ply ${c}` })), removed: [] });
  const samples = (await call(CSO, "GET", "/orders/ZT-JO-0201/samples")).body.items as Array<{ id: string; clientRef: string }>;
  ok("six samples are registered", samples.length === 6 && draftOrder.status === 201);

  /* access */
  ok("every staff role reads the list", [CSO, PREP, ANA, ADM, SUP].every(() => true) && (await Promise.all([CSO, PREP, ANA, ADM, SUP].map((t) => call(t, "GET", "/batches")))).every((r) => r.status === 200));
  ok("no token is 401", (await fetch(`${API}/batches`)).status === 401);
  const form = (await call(CSO, "GET", "/orders/ZT-JO-0201/batch-form")).body;
  ok("Add batch's form gives the next number, the standards, the samples and the parameters", /^B-\d{4}-\d{4}$/.test(form.nextBatchNo) && form.standards.length === 2 && form.samples.length === 6 && form.canAdd === true
    && form.parameters.some((p: any) => p.code === "TM" && p.inOrder) && form.parameters.some((p: any) => p.code === "HGI" && !p.inOrder) && !form.parameters.some((p: any) => p.code === "PREP" || p.code === "ADL"), JSON.stringify(form).slice(0, 300));
  ok("a preparation user may open the form, an analyst may not", (await call(PREP, "GET", "/orders/ZT-JO-0201/batch-form")).status === 200 && (await call(ANA, "GET", "/orders/ZT-JO-0201/batch-form")).status === 403);
  ok("a draft job order takes no batch", (await call(CSO, "GET", "/orders/ZT-JO-0202/batch-form")).body.canAdd === false);

  /* Add batch */
  const body = (over: Record<string, unknown> = {}) => ({ orderNo: "ZT-JO-0201", batchNo: "B-2099-0101", batchDate: today, deadlineOn: "2026-12-30", standard: "ASTM", sampleIds: samples.slice(0, 4).map((s) => s.id),
    parameterIds: [pid("TM"), pid("IM"), pid("ASH"), pid("VM")], priority: "Standard", cocNo: "", notes: "", ...over });
  ok("an analyst can't add a batch", (await call(ANA, "POST", "/batches", body())).status === 403);
  ok("a bad number is refused on the field", (await call(CSO, "POST", "/batches", body({ batchNo: "B-99" }))).body?.field === "batchNo");
  ok("a standard the job order does not have is refused", (await call(CSO, "POST", "/batches", body({ standard: "GBT" }))).body?.field === "standard");
  ok("no samples is refused", (await call(CSO, "POST", "/batches", body({ sampleIds: [] }))).body?.field === "sampleIds");
  ok("a deadline before the batch date is refused", (await call(CSO, "POST", "/batches", body({ deadlineOn: "2020-01-01" }))).body?.field === "deadlineOn");
  ok("a parameter outside the catalogue (Preparation) is refused", (await call(CSO, "POST", "/batches", body({ parameterIds: [pid("PREP")] }))).body?.field === "parameterIds");
  ok("a draft job order can't take a batch", (await call(CSO, "POST", "/batches", body({ orderNo: "ZT-JO-0202" }))).body?.code === "locked");
  const first = await call(CSO, "POST", "/batches", body()); made.push("B-2099-0101");
  ok("a batch is created with its samples, parameters and a log row", first.status === 201 && first.body.batchNo === "B-2099-0101", JSON.stringify(first.body));
  ok("the same number again is refused as already used", (await call(CSO, "POST", "/batches", body({ sampleIds: [samples[4]!.id] }))).body?.text === "B-2099-0101 is already used.");
  ok("a sample that is already in a batch is refused", (await call(CSO, "POST", "/batches", body({ batchNo: "B-2099-0102", sampleIds: [samples[0]!.id] }))).body?.code === "locked");
  const det = (await call(CSO, "GET", "/batches/B-2099-0101")).body;
  ok("the batch page starts Created with 4 expected, none arrived, and the job order", det.status === "created" && det.counts.inBatch === 4 && det.counts.arrived === 0 && det.order.orderNo === "ZT-JO-0201" && det.parameters.length === 4 && det.company.name, JSON.stringify(det).slice(0, 300));
  const log0 = (await call(CSO, "GET", "/batches/B-2099-0101/log")).body.items;
  ok("the log starts with Batch created", log0.length === 1 && log0[0].action === "Batch created");
  const jobSamples = (await call(CSO, "GET", "/orders/ZT-JO-0201/samples")).body.items;
  ok("the job order's samples are In batch and locked", jobSamples.filter((s: any) => s.state === "in_batch").length === 4 && jobSamples.filter((s: any) => s.state === "expected").length === 2);
  const nCso = await sql`select n.title, n.link, p.email from notifications n join profiles p on p.id = n.user_id where n.title = 'B-2099-0101 is ready to receive'`;
  ok("N1 went to Preparation and the Lab admin, not to the CSO who made the batch", nCso.length >= 2 && nCso.every((n) => ["dedi@sgsi.co.id", "maya@sgsi.co.id", "joko@sgsi.co.id", "yusuf@sgsi.co.id", "wahyu@sgsi.co.id"].includes(n.email as string)) && !nCso.some((n) => n.email === "rina@sgsi.co.id") && nCso[0]!.link === "/batches/B-2099-0101/reception", JSON.stringify(nCso));

  /* the job order's Batches tab */
  const tab = (await call(CSO, "GET", "/orders/ZT-JO-0201/batches")).body;
  ok("the Batches tab lists the batch with its parameter note", tab.items.length === 1 && tab.items[0].batchNo === "B-2099-0101" && tab.items[0].samples === 4 && /Same as the job order/.test(tab.items[0].parametersNote) && tab.items[0].status === "created", JSON.stringify(tab));

  /* the list */
  const lst = (await call(CSO, "GET", "/batches?size=100")).body;
  ok("the list has the demo batches and counts per status", lst.total >= 3 && lst.counts.all === lst.total && lst.items.some((b: any) => b.batchNo === "B-2026-0422" && b.status === "receiving" && b.arrived === 6 && b.expected === 8), JSON.stringify(lst.counts));
  ok("the Created chip counts a Receiving batch too, and shows it as Receiving", (await call(CSO, "GET", "/batches?status=created&size=100")).body.items.some((b: any) => b.status === "receiving"));
  ok("a batch past its deadline is marked", (await call(CSO, "GET", "/batches?q=0413")).body.items[0]?.pastDue === true);
  ok("search finds a batch by number, by job order and by a sample code", (await call(CSO, "GET", "/batches?q=B-2026-0422")).body.total === 1 && (await call(CSO, "GET", "/batches?q=JO-2026-0137")).body.items.some((b: any) => b.batchNo === "B-2026-0422")
    && (await call(CSO, "GET", "/batches?q=KEP-3301")).body.items.some((b: any) => b.batchNo === "B-2026-0422"));
  ok("a percent sign in the search is not a wildcard", (await call(CSO, "GET", "/batches?q=%25")).body.total === 0);

  /* the batch number */
  ok("a preparation user may edit the number, an analyst may not", (await call(ANA, "PUT", "/batches/B-2099-0101/number", { batchNo: "B-2099-0103" })).status === 403);
  ok("a number that is used is refused with the text of the frame", (await call(CSO, "PUT", "/batches/B-2099-0101/number", { batchNo: "B-2026-0422" })).body?.text === "B-2026-0422 is already used.");
  ok("the number changes and is logged", (await call(CSO, "PUT", "/batches/B-2099-0101/number", { batchNo: "B-2099-0103" })).status === 200 && (await call(CSO, "GET", "/batches/B-2099-0103/log")).body.items.some((l: any) => l.action === "Batch number changed" && /B-2099-0101 to B-2099-0103/.test(l.note)));
  made.push("B-2099-0103");
  const NO = "B-2099-0103";

  /* Reception */
  const rec = (await call(PREP, "GET", `/batches/${NO}/reception`)).body;
  ok("Reception lists the four samples with the lookups and an open checklist", rec.open && rec.items.length === 4 && rec.items.every((i: any) => !i.arrived && !i.sampleNo) && rec.conditions[0].value === "Good" && rec.checks.length === 4 && !rec.checks[0].ok);
  const [r1, r2, r3, r4] = rec.items as Array<{ id: string }>;
  ok("an analyst can't change a row, a CSO can", (await call(ANA, "PATCH", `/batches/${NO}/samples/${r1!.id}`, { arrived: true })).status === 403 && (await call(CSO, "PATCH", `/batches/${NO}/samples/${r1!.id}`, { arrived: true })).status === 200);
  const t1 = (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items[0];
  ok("ticking Arrived gives the Sample ID and the sample code in the format of spec 6.1, and Good as the condition", t1.arrived && t1.sampleNo === `SG.${yymmdd}.${bnmCode}.RI.${t1.sampleNo.slice(-3)}` && /^\d{3}$/.test(t1.sampleNo.slice(-3))
    && t1.sampleCode === `${bnmCode}.RI.${t1.sampleNo.slice(-3)}.Lot01` && t1.condition === "Good", JSON.stringify(t1));
  const n1 = Number(t1.sampleNo.slice(-3));
  const t2 = (await call(PREP, "PATCH", `/batches/${NO}/samples/${r2!.id}`, { arrived: true })).body;
  ok("the next sample gets the next running number", Number(t2.sampleNo.slice(-3)) === n1 + 1, `${t1.sampleNo} ${t2.sampleNo}`);
  const undo = (await call(PREP, "PATCH", `/batches/${NO}/samples/${r2!.id}`, { arrived: false })).body;
  ok("unticking clears the identifiers", !undo.arrived && undo.sampleNo === null && undo.sampleCode === null);
  const again = (await call(PREP, "PATCH", `/batches/${NO}/samples/${r2!.id}`, { arrived: true })).body;
  ok("ticking again does not reuse the number", Number(again.sampleNo.slice(-3)) === n1 + 2, again.sampleNo);
  ok("the undo is in the log", (await call(PREP, "GET", `/batches/${NO}/log`)).body.items.some((l: any) => l.action === "Arrival undone"));
  ok("the batch shows Receiving once a sample is ticked", (await call(PREP, "GET", `/batches/${NO}`)).body.status === "receiving");
  ok("Mark all arrived ticks the rest", (await call(PREP, "POST", `/batches/${NO}/arrive-all`)).body.ticked === 2 && (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items.every((i: any) => i.arrived && i.sampleNo));
  const allNos = (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items.map((i: any) => i.sampleNo);
  ok("every Sample ID in the batch is different", new Set(allNos).size === 4);

  /* mass, condition, lot */
  const P = (id: string, b: unknown, tok = PREP) => call(tok, "PATCH", `/batches/${NO}/samples/${id}`, b);
  ok("a mass with a comma is accepted and kept with 2 decimals", (await P(r1!.id, { mass: "12,4" })).body.mass === "12.40");
  ok("three decimals are refused", (await P(r1!.id, { mass: "12.345" })).body?.text === "Use at most 2 decimals.");
  ok("text and zero are refused as a mass", (await P(r1!.id, { mass: "abc" })).body?.field === "mass" && (await P(r1!.id, { mass: "0" })).body?.field === "mass");
  ok("a condition outside the lookup is refused", (await P(r1!.id, { condition: "Great" })).body?.field === "condition");
  ok("a condition and its remark are saved", (await P(r2!.id, { condition: "Wet" })).body.condition === "Wet" && (await P(r2!.id, { conditionRemark: "Bag wet on arrival" })).body.conditionRemark === "Bag wet on arrival");
  const lot = (await P(r1!.id, { lot: "2" })).body;
  ok("a lot of 2 means Lot02 and changes the sample code, not the Sample ID", lot.lot === "Lot02" && lot.sampleCode.endsWith(".Lot02") && lot.sampleNo === t1.sampleNo);
  ok("a bad lot is refused", (await P(r1!.id, { lot: "ab" })).body?.field === "lot");
  await P(r1!.id, { lot: "1" });

  /* hold */
  ok("a hold needs a reason from the list and a note when the reason asks for one", (await call(PREP, "POST", `/batches/${NO}/samples/${r4!.id}/hold`, { reason: "Because" })).body?.field === "reason"
    && (await call(PREP, "POST", `/batches/${NO}/samples/${r4!.id}/hold`, { reason: "Other" })).body?.field === "note");
  ok("a sample is put on hold with its reason", (await call(PREP, "POST", `/batches/${NO}/samples/${r4!.id}/hold`, { reason: "Damaged", note: "" })).status === 200
    && (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items.find((i: any) => i.id === r4!.id).hold.reason === "Damaged");
  ok("a sample that has not arrived can't be put on hold", await (async () => {
    await P(r3!.id, { arrived: false });
    const x = await call(PREP, "POST", `/batches/${NO}/samples/${r3!.id}/hold`, { reason: "Damaged" });
    await P(r3!.id, { arrived: true });
    return x.body?.code === "not_arrived";
  })());

  /* photos */
  ok("a photo is added with its tag", (await upload(PREP, `/batches/${NO}/samples/${r2!.id}/photos`, "ZT wet.png", png, "image/png", "Condition")).status === 201);
  ok("a file that only says it is an image is refused, and a PDF too", (await upload(PREP, `/batches/${NO}/samples/${r2!.id}/photos`, "ZT fake.png", Buffer.from("nope"), "image/png")).status === 415
    && (await upload(PREP, `/batches/${NO}/samples/${r2!.id}/photos`, "ZT doc.pdf", Buffer.from("%PDF-1.4"), "application/pdf")).status === 415);
  ok("a photo over 10 MB is refused", (await upload(PREP, `/batches/${NO}/samples/${r2!.id}/photos`, "ZT big.png", Buffer.concat([png, Buffer.alloc(10 * 1024 * 1024 + 10)]), "image/png")).status === 413);
  ok("an analyst can't add a photo", (await upload(ANA, `/batches/${NO}/samples/${r2!.id}/photos`, "ZT a.png", png, "image/png")).status === 403);
  const ph = (await call(CSO, "GET", `/batches/${NO}/samples/${r2!.id}/photos`)).body;
  ok("the gallery has the photo with a signed link, tag and who took it", ph.items.length === 1 && /token=/.test(ph.items[0].url ?? "") && ph.items[0].tag === "Condition" && ph.items[0].takenBy && ph.tags.includes("Weighing"), JSON.stringify(ph));
  ok("the Reception row counts the photo and carries its thumbnail", (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items.find((i: any) => i.id === r2!.id).photos.count === 1);
  ok("a photo can be removed until Confirm reception", (await call(PREP, "DELETE", `/batches/${NO}/samples/${r2!.id}/photos/${ph.items[0].id}`)).status === 200);
  await upload(PREP, `/batches/${NO}/samples/${r2!.id}/photos`, "ZT wet2.png", png, "image/png", "Weighing");

  /* labels and the checklist */
  const chk0 = (await call(PREP, "GET", `/batches/${NO}/reception`)).body.checks;
  ok("the checklist says what is missing: masses and labels", chk0[0].ok && !chk0[1].ok && !chk0[3].ok && /to print/.test(chk0[3].text), JSON.stringify(chk0));
  ok("Confirm reception refuses while masses are missing, in the checklist's words", (await call(PREP, "POST", `/batches/${NO}/confirm`, {})).body?.code === "not_ready");
  for (const s of [r1!, r2!, r3!, r4!]) await P(s.id, { mass: "10.50" });
  ok("a CSO can't print labels", (await call(CSO, "POST", `/batches/${NO}/labels`, { sampleIds: [r1!.id] })).status === 403);
  const lab = await call(PREP, "POST", `/batches/${NO}/labels`, { sampleIds: [r1!.id, r2!.id, r3!.id] });
  ok("labels return what each carries: Sample ID, sample code, job order, date and company", lab.status === 200 && lab.body.labels.length === 3 && lab.body.labels[0].sampleNo === t1.sampleNo && lab.body.labels[0].orderNo === "ZT-JO-0201" && lab.body.labels[0].company === "BNM", JSON.stringify(lab.body).slice(0, 200));
  ok("printing again needs a reason, which is logged", (await call(PREP, "POST", `/batches/${NO}/labels`, { sampleIds: [r1!.id] })).body?.field === "reason" && (await call(PREP, "POST", `/batches/${NO}/labels`, { sampleIds: [r1!.id], reason: "Label torn" })).status === 200
    && (await call(PREP, "GET", `/batches/${NO}/log`)).body.items.some((l: any) => l.action === "Labels printed again" && /Label torn/.test(l.note)));
  ok("a sample that has not arrived has no label", await (async () => { await P(r3!.id, { arrived: false }); const x = await call(PREP, "POST", `/batches/${NO}/labels`, { sampleIds: [r3!.id] }); await P(r3!.id, { arrived: true }); await P(r3!.id, { mass: "10.50" }); return x.body?.code === "not_arrived"; })());
  ok("a new lot after printing makes the label unprinted again", await (async () => { await P(r1!.id, { lot: "3" }); const x = (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items.find((i: any) => i.id === r1!.id); await P(r1!.id, { lot: "1" }); return x.label.printed === false; })());
  await call(PREP, "POST", `/batches/${NO}/labels`, { sampleIds: [r1!.id, r2!.id, r3!.id], reason: "Reprint after the lot check" });
  const r2row = (await call(PREP, "GET", `/batches/${NO}/reception`)).body.items;
  ok("Confirm reception wants a remark for a Wet sample that has none", await (async () => {
    await P(r2!.id, { conditionRemark: "" });
    const x = await call(PREP, "POST", `/batches/${NO}/confirm`, {});
    await P(r2!.id, { conditionRemark: "Bag wet on arrival" });
    return x.body?.code === "not_ready" && /remark/.test(x.body.text);
  })(), JSON.stringify(r2row.map((i: any) => i.conditionRemark)));

  /* Confirm reception with fewer samples: the fourth is held (stays), un-tick nothing; add a fifth sample that never arrives */
  const second = await call(CSO, "POST", "/batches", body({ batchNo: "B-2099-0104", sampleIds: [samples[4]!.id, samples[5]!.id] })); made.push("B-2099-0104");
  ok("a second batch takes the two samples still expected", second.status === 201);
  const rec2 = (await call(PREP, "GET", "/batches/B-2099-0104/reception")).body.items as Array<{ id: string; clientRef: string }>;
  const a1 = await call(PREP, "PATCH", `/batches/B-2099-0104/samples/${rec2[0]!.id}`, { arrived: true, mass: "8.20" });
  ok("one of two samples is ticked", a1.status === 200);
  await call(PREP, "POST", "/batches/B-2099-0104/labels", { sampleIds: [rec2[0]!.id] });
  const fewer = await call(PREP, "POST", "/batches/B-2099-0104/confirm", {});
  ok("with a sample that has not arrived, Confirm asks first and names it", fewer.status === 409 && fewer.body.code === "fewer" && fewer.body.expected === 2 && fewer.body.arrived === 1 && fewer.body.leaving.join() === rec2[1]!.clientRef, JSON.stringify(fewer.body));
  const done2 = await call(PREP, "POST", "/batches/B-2099-0104/confirm", { fewer: true });
  ok("confirming with fewer returns the missing sample to the job order", done2.status === 200 && done2.body.received === 1 && done2.body.returned.join() === rec2[1]!.clientRef, JSON.stringify(done2.body));
  const jo2 = (await call(CSO, "GET", "/orders/ZT-JO-0201/samples")).body.items;
  ok("it is Awaiting arrival, from B-2099-0104, and the other is Received", jo2.find((s: any) => s.clientRef === rec2[1]!.clientRef).state === "awaiting_arrival" && jo2.find((s: any) => s.clientRef === rec2[1]!.clientRef).releasedFrom === "B-2099-0104"
    && jo2.find((s: any) => s.clientRef === rec2[0]!.clientRef).state === "received");
  const d2 = (await call(CSO, "GET", "/batches/B-2099-0104")).body;
  ok("the batch is in Preparation with 1 of 2 expected and says who came back", d2.status === "preparation" && d2.counts.expected === 2 && d2.counts.received === 1 && d2.returned.join() === rec2[1]!.clientRef, JSON.stringify(d2.counts));
  ok("the log records the confirmation with the returned sample", (await call(CSO, "GET", "/batches/B-2099-0104/log")).body.items.some((l: any) => l.action === "Reception confirmed" && /Confirmed with 1 of 2 expected; returned to ZT-JO-0201/.test(l.note)));
  ok("the job order is In progress, and now can't be edited", (await call(CSO, "GET", "/orders/ZT-JO-0201")).body.status === "in_progress");
  const n2 = await sql`select p.email, n.title from notifications n join profiles p on p.id = n.user_id where n.event = 'N2' and n.link = '/orders/ZT-JO-0201/batches'`;
  ok("N2 went to the CSO", n2.length === 1 && n2[0]!.email === "rina@sgsi.co.id" && /1 sample of ZT-JO-0201 did not arrive/.test(n2[0]!.title), JSON.stringify(n2));
  ok("after Confirm the rows can't change, photos lock and a second confirm is refused", (await call(PREP, "PATCH", `/batches/B-2099-0104/samples/${rec2[0]!.id}`, { mass: "9" })).body?.code === "locked"
    && (await upload(PREP, `/batches/B-2099-0104/samples/${rec2[0]!.id}/photos`, "ZT late.png", png, "image/png")).status === 409 && (await call(PREP, "POST", "/batches/B-2099-0104/confirm", {})).body?.code === "locked");
  ok("the number can't change after Confirm", (await call(CSO, "PUT", "/batches/B-2099-0104/number", { batchNo: "B-2099-0105" })).body?.code === "locked");
  ok("a late sample can go into a new batch, pre-marked as returned", await (async () => {
    const f = (await call(CSO, "GET", "/orders/ZT-JO-0201/batch-form")).body;
    const late = f.samples.find((s: any) => s.clientRef === rec2[1]!.clientRef);
    return late?.awaiting === true && late.releasedFrom === "B-2099-0104";
  })());

  /* Confirm with all four: the held sample stays in the batch */
  for (const s of [r1!, r2!, r3!]) await P(s.id, { lot: "1" });
  await call(PREP, "POST", `/batches/${NO}/labels`, { sampleIds: [r4!.id], reason: "check" });
  const done = await call(CSO, "POST", `/batches/${NO}/confirm`, {});
  ok("a CSO confirms reception when everything is ready", done.status === 200 && done.body.received === 4 && done.body.returned.length === 0, JSON.stringify(done.body));
  const dd = (await call(CSO, "GET", `/batches/${NO}`)).body;
  ok("a held sample arrived, so it stays and counts as received", dd.counts.received === 4 && dd.counts.held === 1 && dd.status === "preparation");
  ok("reception rows after Confirm are read-only and the checklist is gone", (await call(PREP, "GET", `/batches/${NO}/reception`)).body.open === false && (await call(PREP, "GET", `/batches/${NO}/reception`)).body.checks.length === 0);

  /* audit and RLS */
  const [a] = await sql`select count(*)::int as n from audit_log where screen = 'Batches' and at > now() - interval '15 minutes'`;
  ok("changes wrote audit rows with the screen Batches", a!.n >= 15, String(a!.n));
  ok("an analyst reads the batch page but its Reception rows hide nothing they may see", (await call(ANA, "GET", `/batches/${NO}`)).status === 200 && (await call(ANA, "GET", `/batches/${NO}/reception`)).status === 200);
  ok("an unknown batch is 404", (await call(CSO, "GET", "/batches/B-0000-0000")).status === 404 && (await call(CSO, "GET", "/batches/B-0000-0000/reception")).status === 404);
} finally {
  const paths = await sql`select a.storage_path from sample_attachments a join samples s on s.id = a.sample_id join job_orders j on j.id = s.job_order_id where j.order_no = any(${madeOrders}::text[])`;
  if (paths.length) await admin.storage.from("sample-photos").remove(paths.map((p) => p.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`delete from notifications where title like '%B-2099-%' or link like '%B-2099-%' or link like '%ZT-JO-%'`;
    await tx`update samples set batch_id = null, released_from_batch_id = null where job_order_id in (select id from job_orders where order_no = any(${madeOrders}::text[]))`;
    await tx`delete from batches where batch_no like 'B-2099-%'`;
    await tx`delete from job_orders where order_no = any(${madeOrders}::text[])`;
  });
  await sql.end();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll batch checks passed");
process.exit(failed ? 1 : 0);
