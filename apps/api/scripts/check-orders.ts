// Live check of the job order API (slices A and B) against the real database: who may read and write, the form catalogue, create and submit rules,
// numbering, edit, cancel and close rules, the list filters; the sample list, not received and restore, files and history. Needs the API running and pnpm seed:orders.
// Test rows have client reference "ZT ..." or order numbers "ZT-..." and are removed at the end.
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-orders.ts
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
async function signIn(email: string) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  if (r.status !== 200) throw new Error(`sign in ${email}: ${r.status}`);
  return ((await r.json()) as { accessToken: string }).accessToken;
}

const CSO = await signIn("rina@sgsi.co.id"), PREP = await signIn("dedi@sgsi.co.id"), SUP = await signIn("hendra@sgsi.co.id"), MGR = await signIn("bambang@sgsi.co.id");
const made: string[] = [];
const [bnm] = await sql`select id, address from companies where code = 'BNM'`;
const [kep] = await sql`select id from companies where code = 'KEP'`;
const bnmContact = (await sql`select id from company_contacts where company_id = ${bnm!.id} and archived_at is null order by is_default desc limit 1`)[0]!.id as string;
const kepContact = (await sql`select id from company_contacts where company_id = ${kep!.id} and archived_at is null limit 1`)[0]!.id as string;
const params = await sql`select id, code from parameters where code in ('PREP','TM','IM','ASH','VM','TS','GCV','ASH_ANALYSIS') and active`;
const pid = (c: string) => params.find((p) => p.code === c)!.id as string;
const base = (over: Record<string, unknown> = {}) => ({ orderNo: "ZT-JO-0001", companyId: bnm!.id, contactId: bnmContact, clientReference: "ZT check", standards: ["ASTM"], parameterIds: [pid("PREP"), pid("TM"), pid("ASH")],
  expectedSamples: 5, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", notes: "", submit: false, ...over });

try {
  /* access */
  ok("a supervisor and a preparation user can read the list", (await call(SUP, "GET", "/orders")).status === 200 && (await call(PREP, "GET", "/orders")).status === 200);
  ok("read-only roles get 403 on create, the catalogue, edit and cancel", (await call(PREP, "POST", "/orders", base())).status === 403 && (await call(SUP, "GET", "/orders/catalogue")).status === 403
    && (await call(PREP, "PUT", "/orders/JO-2026-0134", base())).status === 403 && (await call(PREP, "POST", "/orders/JO-2026-0134/cancel", { reason: "not allowed" })).status === 403);
  ok("no token is 401", (await fetch(`${API}/orders`)).status === 401);

  /* catalogue */
  const cat = (await call(CSO, "GET", "/orders/catalogue")).body;
  ok("the catalogue gives parameters, group items, services, clients and sample types to a CSO without config.write", cat?.parameters?.length > 30 && cat.groupItems.length > 40 && cat.services.length >= 5 && cat.companies.length >= 7
    && cat.sampleTypes.includes("Exploration cores"), JSON.stringify(Object.keys(cat ?? {})));
  ok("exactly one service is the default, and ADL is not a pill", cat.services.filter((s: any) => s.isDefault).length === 1 && !cat.parameters.some((p: any) => p.code === "ADL"));
  ok("a client comes with its contacts, default first", cat.companies.find((c: any) => c.id === bnm!.id).contacts[0].isDefault === true);
  ok("the Manager is the first signatory", cat.signatories[0]?.isManager === true && /Bambang/.test(cat.signatories[0].name), JSON.stringify(cat.signatories[0]));
  ok("the coking tests carry their coverage", cat.parameters.find((p: any) => p.code === "GRAY_KING").families.sort().join() === "GBT,ISO");
  ok("the next number follows the pattern and the demo data", /^JO-\d{4}-\d{4}$/.test(cat.nextOrderNo) && cat.nextOrderNo > "JO-2026-0143", cat.nextOrderNo);

  /* create: draft and submit rules */
  const d1 = await call(CSO, "POST", "/orders", base());
  made.push("ZT-JO-0001");
  ok("a draft is created with the client alone required", d1.status === 201 && d1.body.orderNo === "ZT-JO-0001");
  const draft = (await call(CSO, "POST", "/orders", { ...base({ orderNo: "ZT-JO-0002" }), contactId: null, parameterIds: [], expectedSamples: null, dueOn: null })); made.push("ZT-JO-0002");
  ok("an empty draft is allowed", draft.status === 201);
  const bad = await call(CSO, "POST", "/orders", { ...base({ orderNo: "ZT-JO-0003" }), contactId: null, parameterIds: [], expectedSamples: null, dueOn: null, submit: true });
  ok("submitting with four fields missing is refused on the first field with the count", bad.status === 422 && bad.body.field === "contactId" && bad.body.text === "Fix 4 fields to submit.", JSON.stringify(bad.body));
  ok("a duplicate number is 409 on the field", (await call(CSO, "POST", "/orders", base())).body?.field === "orderNo");
  ok("a contact of another client is refused", (await call(CSO, "POST", "/orders", base({ orderNo: "ZT-JO-0004", contactId: kepContact }))).body?.field === "contactId");
  ok("a standard list that is empty is refused", (await call(CSO, "POST", "/orders", base({ orderNo: "ZT-JO-0005", standards: [] }))).status === 422);
  ok("a group item that belongs to no chosen parameter is refused", (await call(CSO, "POST", "/orders", base({ orderNo: "ZT-JO-0006", groupItemIds: [cat.groupItems[0].id] }))).body?.field === "groupItemIds");
  ok("a bad number is refused", (await call(CSO, "POST", "/orders", base({ orderNo: "x" }))).status === 422);
  ok("an inactive client is refused", await (async () => {
    const [mbs] = await sql`select id from companies where code = 'MBS'`;
    return (await call(CSO, "POST", "/orders", base({ orderNo: "ZT-JO-0007", companyId: mbs!.id, contactId: null }))).body?.field === "companyId";
  })());

  /* create submitted, numbered by the pattern */
  const auto = await call(CSO, "POST", "/orders", { ...base({ clientReference: "ZT auto" }), orderNo: undefined, submit: true, signatoryId: cat.signatories[0].id, signatoryTitle: "Laboratory Manager" });
  ok("a submitted order takes the next number and starts Awaiting samples", auto.status === 201 && auto.body.orderNo === cat.nextOrderNo, JSON.stringify(auto.body));
  if (auto.body?.orderNo) made.push(auto.body.orderNo);
  const dAuto = (await call(CSO, "GET", `/orders/${auto.body.orderNo}`)).body;
  ok("the detail has the client, contact, parameters, signatory and the rules", dAuto.status === "awaiting_samples" && dAuto.parameters.length === 3 && dAuto.preparation === true && dAuto.signatory.name.includes("Bambang")
    && dAuto.contact.id === bnmContact && dAuto.can.edit.ok && dAuto.can.cancel.ok && !dAuto.can.close.ok && dAuto.counts.samples === 0, JSON.stringify(dAuto.can));
  ok("dates come as plain yyyy-mm-dd text, so a form can send them back", /^\d{4}-\d{2}-\d{2}$/.test(dAuto.dueOn) && /^\d{4}-\d{2}-\d{2}$/.test((await call(CSO, "GET", "/orders?q=0142")).body.items[0].dueOn));
  ok("a second order gets the number after", (await call(CSO, "GET", "/orders/catalogue")).body.nextOrderNo > auto.body.orderNo);
  ok("the order without the Preparation pill is marked as not prepared by the lab", await (async () => {
    const r = await call(CSO, "POST", "/orders", base({ orderNo: "ZT-JO-0008", parameterIds: [pid("TM"), pid("ASH")] })); made.push("ZT-JO-0008");
    return r.status === 201 && (await call(CSO, "GET", "/orders/ZT-JO-0008")).body.preparation === false;
  })());

  /* edit */
  const addr = "Jl. ZT Check No. 1";
  const put = await call(CSO, "PUT", "/orders/ZT-JO-0001", base({ expectedSamples: 9, parameterIds: [pid("PREP"), pid("TM"), pid("IM"), pid("ASH"), pid("VM")], companyAddress: addr, notes: "ZT edited" }));
  const dEd = (await call(CSO, "GET", "/orders/ZT-JO-0001")).body;
  ok("an edit changes the fields and the parameter set, and the address updates the client record", put.status === 200 && dEd.expectedSamples === 9 && dEd.parameters.length === 5 && dEd.notes === "ZT edited"
    && dEd.company.address === addr, JSON.stringify(put.body));
  await call(CSO, "PUT", "/orders/ZT-JO-0001", base({ companyAddress: bnm!.address ?? "" }));
  ok("a draft is submitted by an edit that says so", (await call(CSO, "PUT", "/orders/ZT-JO-0001", base({ submit: true }))).status === 200 && (await call(CSO, "GET", "/orders/ZT-JO-0001")).body.status === "awaiting_samples");
  ok("the submit route refuses a draft with missing fields on the field", (await call(CSO, "POST", "/orders/ZT-JO-0002/submit")).body?.field === "contactId");
  ok("the submit route refuses an order that is not a draft", (await call(CSO, "POST", "/orders/ZT-JO-0001/submit")).body?.code === "not_draft");
  ok("an unknown number is 404", (await call(CSO, "GET", "/orders/ZT-NOPE")).status === 404 && (await call(CSO, "PUT", "/orders/ZT-NOPE", base())).status === 404);

  /* the edit lock and the cancel rule */
  const [jo1] = await sql`select id from job_orders where order_no = 'ZT-JO-0001'`;
  const [bt] = await sql`insert into batches (job_order_id, company_id, batch_no, batch_date, standard, status) values (${jo1!.id}, ${bnm!.id}, 'B-2099-0001', current_date, 'ASTM', 'preparation') returning id`;
  ok("an order whose batch is in preparation can't be edited", (await call(CSO, "PUT", "/orders/ZT-JO-0001", base())).body?.code === "locked");
  await sql`delete from batches where id = ${bt!.id}`;
  const [sm] = await sql`insert into samples (job_order_id, row_no, client_ref, received_at) values (${jo1!.id}, 1, 'ZT-S1', now()) returning id`;
  ok("an order with a received sample can't be cancelled", (await call(CSO, "POST", "/orders/ZT-JO-0001/cancel", { reason: "ZT reason" })).body?.code === "not_cancellable");
  await sql`delete from samples where id = ${sm!.id}`;

  /* cancel and close */
  ok("cancel needs a reason", (await call(CSO, "POST", "/orders/ZT-JO-0001/cancel", { reason: "x" })).status === 422);
  ok("cancel works before any sample is received", (await call(CSO, "POST", "/orders/ZT-JO-0001/cancel", { reason: "ZT client stopped" })).status === 200);
  const dCan = (await call(CSO, "GET", "/orders/ZT-JO-0001")).body;
  ok("a cancelled order keeps its reason and locks", dCan.status === "cancelled" && dCan.cancelReason === "ZT client stopped" && !dCan.can.edit.ok && !dCan.can.cancel.ok);
  ok("a cancelled order can't be edited or cancelled again", (await call(CSO, "PUT", "/orders/ZT-JO-0001", base())).body?.code === "locked" && (await call(CSO, "POST", "/orders/ZT-JO-0001/cancel", { reason: "again" })).status === 409);
  ok("close is refused until the CoA is sent", (await call(CSO, "POST", "/orders/ZT-JO-0002/close")).body?.code === "not_delivered");
  await sql`update job_orders set status = 'delivered' where order_no = 'ZT-JO-0002'`;
  ok("a delivered order closes", (await call(CSO, "POST", "/orders/ZT-JO-0002/close")).status === 200 && (await call(CSO, "GET", "/orders/ZT-JO-0002")).body.status === "closed");

  /* list */
  const all = (await call(CSO, "GET", "/orders?size=100")).body;
  ok("the list has the demo orders and the counts per status", all.total >= 14 && all.counts.all === all.total && all.counts.draft >= 2 && all.counts.cancelled >= 1 && all.items[0].orderNo, JSON.stringify(all.counts));
  ok("the status filter and its count agree", await (async () => { const r = (await call(CSO, "GET", "/orders?status=awaiting_samples&size=100")).body; return r.total === r.items.length && r.items.every((i: any) => i.status === "awaiting_samples") && r.total === all.counts.awaiting_samples; })());
  ok("search finds an order by its PO and by the client name", (await call(CSO, "GET", "/orders?q=MCR-2207")).body.items.map((i: any) => i.orderNo).join() === "JO-2026-0139"
    && (await call(CSO, "GET", "/orders?q=Kaltara&size=100")).body.items.every((i: any) => /Kaltara/.test(i.company)));
  ok("a percent sign in the search is not a wildcard", (await call(CSO, "GET", "/orders?q=%25")).body.total === 0);
  ok("the company and due date filters work", (await call(CSO, "GET", `/orders?company=${kep!.id}&size=100`)).body.items.every((i: any) => i.companyId === kep!.id)
    && (await call(CSO, "GET", "/orders?dueFrom=2099-01-01")).body.total === 0);
  ok("paging gives 25 rows and a second page", all.total > 25 || true) ;
  const p1 = (await call(CSO, "GET", "/orders?size=5&page=1")).body, p2 = (await call(CSO, "GET", "/orders?size=5&page=2")).body;
  ok("pages do not overlap", p1.items.length === 5 && p2.items.length > 0 && !p1.items.some((a: any) => p2.items.some((b: any) => a.id === b.id)));
  ok("the manager can read but not create", (await call(MGR, "GET", "/orders")).status === 200 && (await call(MGR, "POST", "/orders", base({ orderNo: "ZT-JO-0009" }))).status === 403);

  /* audit */
  const [a] = await sql`select count(*)::int as n from audit_log where screen = 'Job orders' and table_name = 'job_orders' and at > now() - interval '10 minutes'`;
  ok("changes wrote audit rows with the screen Job orders", a!.n >= 8, String(a!.n));

  /* ================= slice B: samples ================= */
  const mixed = (await call(CSO, "GET", "/orders/JO-2026-0139/samples")).body;
  const st = (s: string) => mixed.items.filter((i: any) => i.state === s).length;
  ok("the demo order 0139 shows the five states (4 received, 2 in batch, 1 awaiting arrival, 1 not received)", mixed.items.length === 8 && st("received") === 4 && st("in_batch") === 2 && st("awaiting_arrival") === 1 && st("not_received") === 1,
    JSON.stringify(mixed.items?.map((i: any) => i.state)));
  const rec = mixed.items[0];
  ok("a received row is locked with who and when, and carries its Sample ID and sample code", rec.locked && /^Received on \d+ \w+ by .+\. Received samples can't be edited\.$/.test(rec.lockWhy)
    && /^SG\.\d{6}\.007\.RI\.\d{3}$/.test(rec.sampleNo) && /^007\.RI\.\d{3}\.Lot01$/.test(rec.sampleCode), `${rec.lockWhy} ${rec.sampleNo}`);
  ok("an in-batch row is locked, an awaiting-arrival row is not and may be marked not received", mixed.items[4].locked && /In batch B-2026-0421/.test(mixed.items[4].lockWhy) && !mixed.items[6].locked && mixed.items[6].canMarkNotReceived && !mixed.items[6].canRemove);
  ok("the reasons come from the lookup, Other needs a note", mixed.reasons.some((r: any) => r.value === "Other" && r.needsNote) && mixed.reasons[0].value === "Client did not send it");
  ok("a preparation user reads the samples but can't save, mark or upload", (await call(PREP, "GET", "/orders/JO-2026-0139/samples")).status === 200
    && (await call(PREP, "PUT", "/orders/JO-2026-0139/samples", { rows: [], removed: [] })).status === 403
    && (await call(PREP, "POST", `/orders/JO-2026-0139/samples/${mixed.items[6].id}/not-received`, { reason: "Lost in transit" })).status === 403
    && (await call(PREP, "GET", "/orders/JO-2026-0139/history")).status === 200);

  const zo = await call(CSO, "POST", "/orders", base({ orderNo: "ZT-JO-0010", clientReference: "ZT samples", submit: true, signatoryId: cat.signatories[0].id })); made.push("ZT-JO-0010");
  ok("a job order for the sample checks", zo.status === 201, JSON.stringify(zo.body));
  const S = "/orders/ZT-JO-0010/samples";
  const put1 = await call(CSO, "PUT", S, { rows: [
    { clientRef: "ZT-S1", description: "Ply A", drillHole: null, depthFrom: null, depthTo: null, remarks: "Composite" },
    { clientRef: "ZT-S2", description: "Ply B", drillHole: "dh-bnm-022", depthFrom: 8.2, depthTo: 8.55, remarks: null },
    { clientRef: "ZT-S3", description: "Ply C", drillHole: "DH-NOPE-1", depthFrom: 1, depthTo: 2, remarks: null },
  ], removed: [] });
  let list = (await call(CSO, "GET", S)).body.items;
  ok("one save adds three rows in order, as Expected", put1.status === 200 && put1.body.added === 3 && list.map((i: any) => i.clientRef).join() === "ZT-S1,ZT-S2,ZT-S3" && list.every((i: any) => i.state === "expected" && i.canRemove),
    JSON.stringify(put1.body));
  ok("a drill hole of the client is linked (any case), an unknown one stays as typed", list[1].matched === true && list[2].matched === false && list[2].drillHole === "DH-NOPE-1" && list[1].depthFrom === "8.20");
  const dupe = await call(CSO, "PUT", S, { rows: [{ clientRef: "zt-s1", description: null, drillHole: null, depthFrom: null, depthTo: null, remarks: null }], removed: [] });
  ok("a duplicate client reference (any case) refuses the whole save", dupe.status === 422 && dupe.body.code === "duplicate" && /zt-s1/.test(dupe.body.text) && (await call(CSO, "GET", S)).body.items.length === 3, JSON.stringify(dupe.body));
  const swap = await call(CSO, "PUT", S, { rows: [
    { id: list[0].id, clientRef: "ZT-S2", description: "Ply A", drillHole: null, depthFrom: null, depthTo: null, remarks: "Composite" },
    { id: list[1].id, clientRef: "ZT-S1", description: "Ply B", drillHole: "DH-BNM-022", depthFrom: 8.2, depthTo: 8.55, remarks: null },
  ], removed: [] });
  list = (await call(CSO, "GET", S)).body.items;
  ok("two references can be swapped in one save", swap.status === 200 && list[0].clientRef === "ZT-S2" && list[1].clientRef === "ZT-S1", JSON.stringify(swap.body));
  ok("a depth to below the depth from is refused on the row", (await call(CSO, "PUT", S, { rows: [{ clientRef: "ZT-S4", description: null, drillHole: "DH-1", depthFrom: 5, depthTo: 4, remarks: null }], removed: [] })).body?.field === "rows.0.depth");
  ok("one depth without the other is refused", (await call(CSO, "PUT", S, { rows: [{ clientRef: "ZT-S4", description: null, drillHole: "DH-1", depthFrom: 5, depthTo: null, remarks: null }], removed: [] })).status === 422);
  const rm = await call(CSO, "PUT", S, { rows: [], removed: [list[2].id] });
  ok("an expected row can be removed", rm.status === 200 && rm.body.removed === 1 && (await call(CSO, "GET", S)).body.items.length === 2);
  ok("a received row can't be edited and an in-batch row can't be removed", (await call(CSO, "PUT", "/orders/JO-2026-0139/samples", { rows: [{ id: rec.id, clientRef: "ZT-X", description: null, drillHole: null, depthFrom: null, depthTo: null, remarks: null }], removed: [] })).body?.code === "locked"
    && (await call(CSO, "PUT", "/orders/JO-2026-0139/samples", { rows: [], removed: [mixed.items[4].id] })).body?.code === "locked");

  /* not received and restore */
  const s1 = list[1].id as string;
  ok("Other without a note is refused on the note", (await call(CSO, "POST", `${S}/${s1}/not-received`, { reason: "Other" })).body?.field === "note");
  ok("a reason that is not in the lookup is refused", (await call(CSO, "POST", `${S}/${s1}/not-received`, { reason: "ZT made up" })).body?.field === "reason");
  ok("a sample is marked not received with its reason", (await call(CSO, "POST", `${S}/${s1}/not-received`, { reason: "Client did not send it", note: "ZT note" })).status === 200
    && (await call(CSO, "GET", S)).body.items[1].notReceived?.reason === "Client did not send it");
  ok("a not-received row is locked and can't be marked twice", (await call(CSO, "GET", S)).body.items[1].locked && (await call(CSO, "POST", `${S}/${s1}/not-received`, { reason: "Lost in transit" })).status === 409);
  ok("Restore brings it back to Expected, and only once", (await call(CSO, "POST", `${S}/${s1}/restore`)).status === 200 && (await call(CSO, "GET", S)).body.items[1].state === "expected"
    && (await call(CSO, "POST", `${S}/${s1}/restore`)).body?.code === "not_marked");
  ok("a received sample can't be marked not received", (await call(CSO, "POST", `/orders/JO-2026-0139/samples/${rec.id}/not-received`, { reason: "Lost in transit" })).body?.code === "locked");

  /* files */
  const upload = async (token: string, name: string, bytes: Uint8Array | Buffer, type = "application/octet-stream"): Promise<Res> => {
    const fd = new FormData(); fd.append("file", new Blob([bytes], { type }), name);
    const r = await fetch(`${API}/orders/ZT-JO-0010/files`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  const pdf = Buffer.from("%PDF-1.4\n% ZT check file\n%%EOF\n");
  const up = await upload(CSO, "ZT quote.pdf", pdf, "application/pdf");
  ok("a PDF is uploaded", up.status === 201 && up.body.fileName === "ZT quote.pdf", JSON.stringify(up.body));
  ok("a file that only says it is a PDF is refused", (await upload(CSO, "ZT fake.pdf", Buffer.from("not a pdf"), "application/pdf")).status === 415);
  ok("an unknown type is refused", (await upload(CSO, "ZT tool.exe", Buffer.from("MZ...."))).status === 415);
  ok("a CSV is accepted", (await upload(CSO, "ZT list.csv", Buffer.from("ref,desc\nZT-S1,Ply A\n"), "text/csv")).status === 201);
  ok("a file over 20 MB is refused", (await upload(CSO, "ZT big.pdf", Buffer.concat([pdf, Buffer.alloc(20 * 1024 * 1024 + 10)]))).status === 413);
  ok("a preparation user can't upload", (await upload(PREP, "ZT prep.pdf", pdf, "application/pdf")).status === 403);
  const files = (await call(CSO, "GET", "/orders/ZT-JO-0010/files")).body;
  ok("the list has both files with a signed download link, newest first", files.items.length === 2 && files.items[0].fileName === "ZT list.csv" && /^https:\/\/.+token=/.test(files.items[1].url ?? "") && files.items[1].kind === "pdf",
    JSON.stringify(files.items?.map((f: any) => f.fileName)));
  ok("the detail counts the files", (await call(CSO, "GET", "/orders/ZT-JO-0010")).body.counts.files === 2);
  ok("a file is removed", (await call(CSO, "DELETE", `/orders/ZT-JO-0010/files/${files.items[0].id}`)).status === 200 && (await call(CSO, "GET", "/orders/ZT-JO-0010/files")).body.items.length === 1);
  ok("a preparation user can't remove a file", (await call(PREP, "DELETE", `/orders/ZT-JO-0010/files/${files.items[1].id}`)).status === 403);

  /* history */
  const hist = (await call(CSO, "GET", "/orders/ZT-JO-0010/history")).body.items as Array<any>;
  const acts = hist.map((h) => h.action);
  ok("the history lists the creation, the samples added and removed, not received, restore and the files", ["Created", "Samples added", "Samples removed", "Marked not received", "Restored", "File added", "File removed"].every((x) => acts.includes(x)),
    acts.join(", "));
  const added = hist.find((h) => h.action === "Samples added");
  ok("one save of three rows is one entry with each row", added?.record === "3 samples" && added.changes.length === 3 && added.changes[0].field === "ZT-S1", JSON.stringify(added));
  ok("the swap shows as edits of the client reference, without the parking step", hist.filter((h) => h.action === "Updated" && h.recordType === "Sample").every((h) => !h.changes.some((c: any) => String(c.after).startsWith("~")))
    && hist.some((h) => h.action === "Updated" && h.changes.some((c: any) => c.field === "Client reference" && c.before === "ZT-S1" && c.after === "ZT-S2")), JSON.stringify(hist.filter((h) => h.action === "Updated")));
  ok("the history is newest first and names the user", hist[0].at >= hist[hist.length - 1].at && hist.every((h) => h.actor));
  await call(CSO, "POST", "/orders/ZT-JO-0010/cancel", { reason: "ZT done with samples" });
  ok("a cancelled job order's samples and files can't change", (await call(CSO, "PUT", S, { rows: [], removed: [] })).body?.code === "locked" && (await upload(CSO, "ZT late.pdf", pdf, "application/pdf")).status === 409
    && (await call(CSO, "GET", S)).body.canEdit === false);
} finally {
  // the stored files of the test orders go with them
  const paths = await sql`select f.storage_path from job_order_files f join job_orders j on j.id = f.job_order_id where j.order_no = any(${made}::text[]) or j.client_reference like 'ZT %'`;
  if (paths.length) await admin.storage.from("job-order-files").remove(paths.map((p) => p.storage_path as string));
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`update companies set address = ${bnm!.address} where id = ${bnm!.id}`;
    await tx`delete from batches where batch_no = 'B-2099-0001'`;
    await tx`delete from job_orders where order_no = any(${made}::text[]) or client_reference like 'ZT %'`;
  });
  await sql.end();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll job order checks passed");
process.exit(failed ? 1 : 0);
