// Live check of Configuration slice A against the real database: access, settings validation and effect (the sign-in lock follows
// the configured count), lookups, parameters, validation rules, formulas, the company code. Restores every value it changes.
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-config.ts
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
async function signIn(email: string, password = PW) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  return { status: r.status, token: r.status === 200 ? ((await r.json()) as { accessToken: string }).accessToken : "" };
}

const S = (await signIn("wahyu@sgsi.co.id")).token, LAB = (await signIn("maya@sgsi.co.id")).token, CSO = (await signIn("rina@sgsi.co.id")).token;
const orig = {
  security: (await call(S, "GET", "/config/settings/security")).body.value,
  laboratory: (await call(S, "GET", "/config/settings/laboratory")).body.value,
  numbering: (await call(S, "GET", "/config/settings/numbering")).body.value,
};
const [ash] = await sql`select id, code, name, label, category, unit, measured_basis, decimals, allows_qualifier, typical_low, typical_high, active from parameters where code = 'ASH'`;
const [v31] = await sql`select severity, active from validation_rules where code = 'V-31'`;
const [bnm] = await sql`select id, company_code from companies where code = 'BNM'`;

try {
  ok("lab admin gets 403 on Configuration", (await call(LAB, "GET", "/config/summary")).status === 403 && (await call(LAB, "PUT", "/config/settings/security", orig.security)).status === 403);
  const sum = (await call(S, "GET", "/config/summary")).body;
  ok("summary counts the sections", sum.counts.parameters > 30 && sum.counts.rules === 7 && sum.counts.formulas === 2, JSON.stringify(sum.counts));

  /* security */
  ok("lock after 2 attempts is refused on the field", (await call(S, "PUT", "/config/settings/security", { ...orig.security, lock_after_attempts: 2 })).body?.field === "lock_after_attempts");
  ok("a warning after the sign-out is refused", (await call(S, "PUT", "/config/settings/security", { ...orig.security, idle_sign_out_minutes: 5, warn_before_seconds: 300 })).body?.field === "warn_before_seconds");
  ok("lock after 3 attempts saves", (await call(S, "PUT", "/config/settings/security", { ...orig.security, lock_after_attempts: 3 })).status === 200);
  let last = 0; for (let i = 0; i < 3; i++) last = (await signIn("joko@sgsi.co.id", "wrong-password-1")).status;
  ok("the sign-in lock follows the new count (3)", last === 423, String(last));
  await sql`update profiles set status = 'active', failed_attempts = 0, locked_until = null where email = 'joko@sgsi.co.id'`;

  /* laboratory and numbering */
  ok("a branch office is added", (await call(S, "PUT", "/config/settings/laboratory", { ...orig.laboratory, branches: [...orig.laboratory.branches, { code: "SM", name: "Samarinda" }] })).status === 200
    && (await call(S, "GET", "/config/settings/laboratory")).body.value.branches.length === orig.laboratory.branches.length + 1);
  ok("a repeated branch code is refused", (await call(S, "PUT", "/config/settings/laboratory", { ...orig.laboratory, branches: [{ code: "RI", name: "A" }, { code: "RI", name: "B" }] })).status === 422);
  ok("a lower-case branch code is refused", (await call(S, "PUT", "/config/settings/laboratory", { ...orig.laboratory, branches: [{ code: "ri", name: "A" }] })).status === 422);
  ok("an unknown numbering token is refused", (await call(S, "PUT", "/config/settings/numbering", { ...orig.numbering, batch: "B-{XYZ}-{NNNN}" })).body?.field === "batch");
  ok("a Sample ID without {NNN} is refused", (await call(S, "PUT", "/config/settings/numbering", { ...orig.numbering, sample_id: "SG.{YYMMDD}.{CCC}" })).body?.field === "sample_id");

  /* lookups */
  const lk = await call(S, "POST", "/config/lookups", { listKey: "hold_reason", value: "ZT check reason", needsRemark: true, sortOrder: 9 });
  ok("a lookup value is added", lk.status === 201, JSON.stringify(lk.body));
  ok("a duplicate value is 409 on the field", (await call(S, "POST", "/config/lookups", { listKey: "hold_reason", value: "ZT check reason" })).body?.field === "value");
  ok("a value is deactivated", (await call(S, "PATCH", `/config/lookups/${lk.body.id}`, { listKey: "hold_reason", value: "ZT check reason", needsRemark: true, sortOrder: 9, active: false })).status === 200
    && (await call(S, "GET", "/config/lookups")).body.items.find((l: any) => l.id === lk.body.id).active === false);

  /* parameters and rules */
  const P = (over: Record<string, unknown>) => ({ code: ash!.code, name: ash!.name, label: ash!.label, category: ash!.category, unit: ash!.unit, measuredBasis: ash!.measured_basis,
    decimals: ash!.decimals, allowsQualifier: ash!.allows_qualifier, typicalLow: ash!.typical_low == null ? null : Number(ash!.typical_low), typicalHigh: ash!.typical_high == null ? null : Number(ash!.typical_high), active: ash!.active, ...over });
  ok("a parameter's decimals and range save", (await call(S, "PATCH", `/config/parameters/${ash!.id}`, P({ decimals: 3, typicalLow: 1, typicalHigh: 40 }))).status === 200
    && (await call(S, "GET", "/config/parameters")).body.items.find((p: any) => p.code === "ASH").decimals === 3);
  ok("a reversed range is refused", (await call(S, "PATCH", `/config/parameters/${ash!.id}`, P({ typicalLow: 50, typicalHigh: 10 }))).body?.field === "typicalHigh");
  ok("a code already used is refused", (await call(S, "PATCH", `/config/parameters/${ash!.id}`, P({ code: "VM" }))).body?.field === "code");
  ok("a rename carries over to the range rule", (await call(S, "PATCH", `/config/parameters/${ash!.id}`, P({ code: "ASHX" }))).status === 200
    && (await call(S, "GET", "/config/rules")).body.items.find((r: any) => r.code === "V-31").parameter === "ASHX");
  await call(S, "PATCH", `/config/parameters/${ash!.id}`, P({}));
  ok("V-31 severity and bounds save (bounds on the parameter)", (await call(S, "PATCH", "/config/rules/V-31", { severity: "block", active: true, low: 2, high: 35 })).status === 200
    && (await call(S, "GET", "/config/parameters")).body.items.find((p: any) => p.code === "ASH").typicalHigh === 35);
  ok("the fixed rule V-12 cannot change", (await call(S, "PATCH", "/config/rules/V-12", { severity: "warn", active: true })).status === 409);
  ok("formulas are listed", (await call(S, "GET", "/config/formulas")).body.items.some((f: any) => f.parameter === "FC"));

  /* company code (C-18) */
  ok("the Superadmin changes a company code", (await call(S, "PATCH", `/companies/${bnm!.id}`, { name: "PT Bara Nusantara Mandiri", code: "BNM", companyCode: "099" })).status === 200
    && (await call(S, "GET", `/companies/${bnm!.id}`)).body.companyCode === "099");
  ok("a used company code is 409 on the field", (await call(S, "PATCH", `/companies/${bnm!.id}`, { name: "PT Bara Nusantara Mandiri", code: "BNM", companyCode: "004" })).body?.field === "companyCode");
  ok("the CSO cannot change the company code", (await call(CSO, "PATCH", `/companies/${bnm!.id}`, { name: "PT Bara Nusantara Mandiri", code: "BNM", companyCode: "098" })).status === 403);
  ok("a new client gets the next free code", await (async () => {
    const mk = await call(S, "POST", "/companies", { name: "PT ZT Code", code: "ZTCODE" });
    const c = (await call(S, "GET", `/companies/${mk.body.id}`)).body.companyCode;
    await sql.begin(async (tx) => { await tx`select set_config('app.skip_audit','on',true)`; await tx`delete from companies where code = 'ZTCODE'`; });
    return /^[0-9]{3}$/.test(c);
  })());

  const [a] = await sql`select count(*)::int as n from audit_log where screen = 'Configuration' and at > now() - interval '5 minutes'`;
  ok("changes wrote audit rows with the screen Configuration", a!.n >= 6, String(a!.n));
} finally {
  for (const k of ["security", "laboratory", "numbering"] as const) await call(S, "PUT", `/config/settings/${k}`, orig[k]);
  await sql.begin(async (tx) => {
    await tx`select set_config('app.skip_audit','on',true)`;
    await tx`update parameters set code = ${ash!.code}, decimals = ${ash!.decimals}, typical_low = ${ash!.typical_low}, typical_high = ${ash!.typical_high} where id = ${ash!.id}`;
    await tx`update validation_rules set severity = ${v31!.severity}, active = ${v31!.active}, params = jsonb_set(params, '{parameter}', '"ASH"') where code = 'V-31'`;
    await tx`delete from lookups where value like 'ZT %'`;
    await tx`update companies set company_code = ${bnm!.company_code} where id = ${bnm!.id}`;
    await tx`update profiles set status = 'active', failed_attempts = 0, locked_until = null where email = 'joko@sgsi.co.id'`;
  });
  await sql.end();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll configuration checks passed");
process.exit(failed ? 1 : 0);
