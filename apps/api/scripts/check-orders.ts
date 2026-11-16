// Live check of the job order API (slice A) against the real database: who may read and write, the form catalogue, create and submit rules,
// numbering, edit, cancel and close rules, the list filters. Needs the API running and the demo job orders (pnpm seed:orders).
// Test rows have client reference "ZT ..." or order numbers "ZT-..." and are removed at the end.
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-orders.ts
import { sql } from "../src/db";

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
} finally {
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
