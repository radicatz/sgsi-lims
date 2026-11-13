// Live check of Configuration slice B against the real database: services (versions, default, archive, delete), methods (new edition,
// fix), report templates (draft copy, save, activate). Needs migration C-19 (20261112000100). Restores what it changes.
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-config-b.ts
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
  return r.status === 200 ? ((await r.json()) as { accessToken: string }).accessToken : "";
}

const S = await signIn("wahyu@sgsi.co.id"), LAB = await signIn("maya@sgsi.co.id");
const svcBefore = await sql`select id, status, is_default from services`;
const tplBefore = await sql`select id, status from report_templates`;
const [ash] = await sql`select id from parameters where code = 'ASH'`;
const [tm] = await sql`select id from parameters where code = 'TM'`;
const pids = (await sql`select id from parameters where code in ('IM','ASH','VM')`).map((p) => p.id as string);

try {
  /* access */
  for (const [m, p] of [["GET", "/config/services"], ["GET", "/config/methods"], ["GET", "/config/templates"], ["POST", "/config/templates/draft"]] as const)
    ok(`lab admin gets 403 on ${m} ${p}`, (await call(LAB, m, p)).status === 403);

  /* services */
  const list0 = (await call(S, "GET", "/config/services")).body.items as any[];
  ok("the 5 seeded services are listed, one default", list0.length >= 5 && list0.filter((s) => s.isDefault && s.status === "active").length === 1, JSON.stringify(list0.map((s) => s.code)));
  ok("a service with a one-letter name is refused", (await call(S, "POST", "/config/services", { name: "Z", turnaroundDays: 5, status: "active", isDefault: false, parameterIds: [] })).status === 422);
  const mk = await call(S, "POST", "/config/services", { name: "ZT Check service", turnaroundDays: 4, status: "active", isDefault: false, parameterIds: pids });
  ok("a service is added as version 1", mk.status === 201);
  const find = async (name: string) => ((await call(S, "GET", "/config/services")).body.items as any[]).filter((s) => s.name === name);
  let rows = await find("ZT Check service");
  ok("it lists with 3 parameters", rows.length === 1 && rows[0].parameterCount === 3 && rows[0].version === 1 && rows[0].status === "active");
  const v1 = rows[0];
  const ed = await call(S, "PUT", `/config/services/${v1.id}`, { name: "ZT Check service", turnaroundDays: 6, status: "active", isDefault: false, parameterIds: pids.slice(0, 2) });
  rows = await find("ZT Check service");
  ok("editing an active service makes version 2 and archives version 1", ed.status === 200 && ed.body.version === 2 && rows.some((s) => s.version === 2 && s.status === "active" && s.parameterCount === 2)
    && rows.some((s) => s.version === 1 && s.status === "archived" && s.parameterCount === 3), JSON.stringify(rows.map((s) => [s.version, s.status])));
  ok("an archived version cannot be edited", (await call(S, "PUT", `/config/services/${v1.id}`, { name: "ZT Check service", turnaroundDays: 6, status: "active", isDefault: false, parameterIds: [] })).status === 409);
  const v2 = rows.find((s) => s.version === 2);
  const dr = await call(S, "PUT", `/config/services/${v2.id}`, { name: "ZT Check service", turnaroundDays: 7, status: "draft", isDefault: false, parameterIds: pids });
  ok("saving an active service as a draft keeps version 2 active", dr.status === 200 && dr.body.version === 3 && (await find("ZT Check service")).filter((s) => s.status === "active").length === 1);
  ok("a second draft is refused", (await call(S, "PUT", `/config/services/${v2.id}`, { name: "ZT Check service", turnaroundDays: 7, status: "draft", isDefault: false, parameterIds: pids })).body?.code === "draft_exists");
  const v3 = (await find("ZT Check service")).find((s) => s.version === 3);
  const e3 = await call(S, "PUT", `/config/services/${v3.id}`, { name: "ZT Check service", turnaroundDays: 8, status: "draft", isDefault: false, parameterIds: pids });
  ok("a draft is edited in place", e3.status === 200 && e3.body.version === 3 && (await find("ZT Check service")).find((s) => s.version === 3).turnaroundDays === 8);
  ok("a draft is activated and the old active one is archived", (await call(S, "POST", `/config/services/${v3.id}/activate`)).status === 200
    && (await find("ZT Check service")).filter((s) => s.status === "active").map((s) => s.version).join() === "3");
  const def = list0.find((s) => s.isDefault);
  ok("the default cannot be archived", (await call(S, "POST", `/config/services/${def.id}/archive`)).body?.code === "default");
  const v3b = (await find("ZT Check service")).find((s) => s.version === 3);
  ok("another service becomes the default (one default only)", (await call(S, "POST", `/config/services/${v3b.id}/default`)).status === 200
    && ((await call(S, "GET", "/config/services")).body.items as any[]).filter((s) => s.isDefault).length === 1);
  await call(S, "POST", `/config/services/${def.id}/default`);
  ok("an active version cannot be deleted", (await call(S, "DELETE", `/config/services/${v3b.id}`)).body?.code === "kept");
  ok("an archived version cannot be activated", (await call(S, "POST", `/config/services/${v1.id}/activate`)).body?.code === "not_draft");
  const d4 = await call(S, "PUT", `/config/services/${v3b.id}`, { name: "ZT Check service", turnaroundDays: 8, status: "draft", isDefault: false, parameterIds: pids });
  const d4row = (await find("ZT Check service")).find((s) => s.version === 4);
  ok("an unused draft is deleted", d4.status === 200 && (await call(S, "DELETE", `/config/services/${d4row.id}`)).status === 200 && !(await find("ZT Check service")).some((s) => s.version === 4));

  /* methods */
  const m0 = (await call(S, "GET", "/config/methods")).body.items as any[];
  const ashAstm = m0.find((m) => m.parameterCode === "ASH" && m.family === "ASTM" && m.isDefault);
  ok("methods list with the current ASTM method for Ash", !!ashAstm && ashAstm.methodCode === "D3174");
  const body = { parameterId: ash!.id, family: "ASTM", methodCode: "D3174", edition: "2099", title: "ZT edition", repeatability: 0.1, reproducibility: 0.2 };
  ok("a bad edition is refused", (await call(S, "POST", "/config/methods", { ...body, edition: "99" })).status === 422);
  ok("r above R is refused on the field", (await call(S, "POST", "/config/methods", { ...body, repeatability: 0.5, reproducibility: 0.2 })).status === 422);
  const ne = await call(S, "POST", "/config/methods", body);
  const m1 = (await call(S, "GET", "/config/methods")).body.items as any[];
  ok("a new edition becomes the current one and the old one stays", ne.status === 201 && m1.find((m) => m.id === ne.body.id)?.isDefault === true && m1.find((m) => m.id === ashAstm.id)?.isDefault === false);
  ok("the same edition twice is 409 on the field", (await call(S, "POST", "/config/methods", body)).body?.field === "edition");
  ok("a fix changes r, R and the title only", (await call(S, "PATCH", `/config/methods/${ne.body.id}`, { title: "ZT fixed", repeatability: 0.12, reproducibility: 0.24 })).status === 200
    && (await call(S, "GET", "/config/methods")).body.items.find((m: any) => m.id === ne.body.id).reproducibility === 0.24);
  const nm = await call(S, "POST", "/config/methods", { parameterId: tm!.id, family: "ISO", methodCode: "ZT1", edition: "2098", title: "", repeatability: null, reproducibility: null });
  ok("a method is added where the standard had none", nm.status === 201 && (await call(S, "GET", "/config/methods")).body.items.some((m: any) => m.parameterCode === "TM" && m.family === "ISO" && m.isDefault));
  ok("a missing parameter is refused", (await call(S, "POST", "/config/methods", { ...body, parameterId: "00000000-0000-4000-8000-000000000000" })).body?.field === "parameterId");

  /* report templates */
  const t0 = (await call(S, "GET", "/config/templates")).body.items as any[];
  const active = t0.find((t) => t.status === "active");
  ok("the house CoA template is listed with its text fields", !!active && active.statement.length > 10 && active.title === "Certificate of Analysis", JSON.stringify(active));
  const dd = await call(S, "POST", "/config/templates/draft");
  ok("a new version copies the active one into a draft", dd.status === 201 && (await call(S, "GET", "/config/templates")).body.items.some((t: any) => t.id === dd.body.id && t.status === "draft" && t.revision === active.revision + 1 && t.statement === active.statement));
  ok("a second draft is refused", (await call(S, "POST", "/config/templates/draft")).body?.code === "draft_exists");
  ok("a blank title is refused", (await call(S, "PUT", `/config/templates/${dd.body.id}`, { formCode: "FM-LAB-014", title: "", statement: "x ok", terms: "y ok", note: "" })).status === 422);
  ok("the active version cannot be edited", (await call(S, "PUT", `/config/templates/${active.id}`, { formCode: "FM-LAB-014", title: "Changed", statement: "x ok", terms: "y ok", note: "" })).body?.code === "not_draft");
  ok("a draft's fields save", (await call(S, "PUT", `/config/templates/${dd.body.id}`, { formCode: "FM-LAB-014", title: "Certificate of Analysis", statement: "ZT statement", terms: active.terms, note: "ZT note" })).status === 200
    && (await call(S, "GET", "/config/templates")).body.items.find((t: any) => t.id === dd.body.id).statement === "ZT statement");
  ok("activating makes it current and archives the old one", (await call(S, "POST", `/config/templates/${dd.body.id}/activate`)).status === 200
    && (await call(S, "GET", "/config/templates")).body.items.filter((t: any) => t.status === "active").map((t: any) => t.id).join() === dd.body.id
    && (await call(S, "GET", "/config/templates")).body.items.find((t: any) => t.id === active.id).status === "archived");
  ok("an archived version cannot be deleted", (await call(S, "DELETE", `/config/templates/${active.id}`)).body?.code === "kept");

  /* hub */
  const sum = (await call(S, "GET", "/config/summary")).body;
  ok("the hub counts services, methods and templates", sum.counts.services >= 5 && sum.counts.methods > 30 && sum.counts.templates >= 2, JSON.stringify(sum.counts));
  const [a] = await sql`select count(*)::int as n from audit_log where screen = 'Configuration' and at > now() - interval '5 minutes' and table_name in ('services','methods','standards','report_templates')`;
  ok("changes wrote audit rows with the screen Configuration", a!.n >= 8, String(a!.n));
} finally {
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`delete from service_parameters where service_id in (select id from services where name like 'ZT %')`;
    await tx`delete from services where name like 'ZT %'`;
    for (const s of svcBefore) await tx`update services set status = ${s.status}, is_default = ${s.is_default} where id = ${s.id}`;
    await tx`delete from methods where standard_id in (select id from standards where title like 'ZT %' or code like 'ZT%' or edition in ('2099','2098'))`;
    await tx`delete from standards where title like 'ZT %' or code like 'ZT%' or edition in ('2099','2098')`;
    await tx`update methods set is_default = true where parameter_id = ${ash!.id} and standard_id in (select id from standards where family = 'ASTM' and code = 'D3174' and edition = '2023')`;
    await tx`delete from report_templates where id <> all(${tplBefore.map((t) => t.id as string)}::uuid[])`;
    for (const t of tplBefore) await tx`update report_templates set status = ${t.status} where id = ${t.id}`;
  });
  await sql.end();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll slice B checks passed");
process.exit(failed ? 1 : 0);
