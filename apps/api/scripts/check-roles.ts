// Live check against a running API (`pnpm dev:api`) and the demo accounts: every role signs in, gets its own
// permissions, sidebar and start page, and data rules hold. Usage: tsx --env-file=../../.env scripts/check-roles.ts
import { navFor, startPath } from "@sgsi/shared";

const API = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}/api`;
const PW = process.env.DEMO_PASSWORD!;
const results: string[] = [];
const ok = (name: string, pass: boolean, detail = "") => results.push(`${pass ? "PASS" : "FAIL"} ${name}${detail ? "  " + detail : ""}`);

async function call(path: string, init: RequestInit & { token?: string; json?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (init.json !== undefined) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const r = await fetch(API + path, { method: init.method ?? (init.json ? "POST" : "GET"), headers, body: init.json !== undefined ? JSON.stringify(init.json) : undefined });
  return { status: r.status, body: r.status === 204 ? null : (await r.json().catch(() => null)) as any };
}

const health = await call("/health");
ok("health", health.status === 200 && health.body?.permissions === 37, JSON.stringify(health.body));

// Navigation plan section 2: items and start page per role
const EXPECT: Record<string, [string, number, string]> = {
  "wahyu@sgsi.co.id": ["superadmin", 12, "/"], "maya@sgsi.co.id": ["lab_admin", 10, "/work"], "hendra@sgsi.co.id": ["supervisor", 9, "/"],
  "bambang@sgsi.co.id": ["manager", 10, "/"], "rina@sgsi.co.id": ["cso", 7, "/work"], "dedi@sgsi.co.id": ["prep", 5, "/work"], "fitri@sgsi.co.id": ["analyst", 6, "/work"],
};
const tokens: Record<string, string> = {};
for (const [email, [role, items, start]] of Object.entries(EXPECT)) {
  const s = await call("/auth/sign-in", { json: { email, password: PW } });
  if (s.status !== 200) { ok(`sign in ${role}`, false, `${s.status} ${JSON.stringify(s.body)}`); continue; }
  tokens[role] = s.body.accessToken;
  const me = await call("/me", { token: s.body.accessToken });
  const nav = navFor(me.body.permissions).flatMap((g) => g.items);
  ok(`${role}: sidebar ${items} items`, nav.length === items, nav.map((i) => i.label).join(", "));
  ok(`${role}: start page ${start}`, startPath(me.body.permissions) === start);
  ok(`${role}: /me runs as the user (roles from RLS-protected tables)`, me.body.roles.includes(role), me.body.roles.join(","));
}

// segregation: the CSO holds no result.read; the analyst no order.create
const cso = await call("/me", { token: tokens.cso! });
ok("CSO cannot see result values (no result.read)", !cso.body.permissions.includes("result.read"));
const an = await call("/me", { token: tokens.analyst! });
ok("Analyst cannot create job orders", !an.body.permissions.includes("order.create"));

// no token, bad token
ok("no token is refused", (await call("/me")).status === 401);
ok("a made-up token is refused", (await call("/me", { token: "abc.def.ghi" })).status === 401);

// wrong password, then the lock after the Security setting's attempts (uses joko@, unlocked again afterwards by the seed)
let last = 0, lockText = "";
for (let i = 0; i < 5; i++) { const r = await call("/auth/sign-in", { json: { email: "joko@sgsi.co.id", password: "wrong-password-1" } }); last = r.status; lockText = r.body?.text ?? ""; }
ok("five wrong passwords lock the account (423)", last === 423, lockText);
const locked = await call("/auth/sign-in", { json: { email: "joko@sgsi.co.id", password: PW } });
ok("a locked account cannot sign in even with the right password", locked.status === 423);

// profile preferences round trip
await call("/me", { method: "PATCH", token: tokens.prep!, json: { prefs: { sidebar: "collapsed" } } });
const prep = await call("/me", { token: tokens.prep! });
ok("profile preference saved", prep.body.prefs.sidebar === "collapsed");
await call("/me", { method: "PATCH", token: tokens.prep!, json: { prefs: { sidebar: "expanded" } } });

console.log(results.join("\n"));
console.log(`${results.filter((r) => r.startsWith("PASS")).length}/${results.length} pass`);
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
