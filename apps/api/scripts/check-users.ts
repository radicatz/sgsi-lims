// Live check of the user routes against the real database: who may manage users, invite and first password, roles,
// deactivate and reactivate, unlock, the last-Superadmin rule. Needs the API running. Test accounts use zt-*@sgsi.co.id and are removed.
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-users.ts
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
async function login(email: string, password = PW) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  return { status: r.status, token: r.status === 200 ? ((await r.json()) as { accessToken: string }).accessToken : "" };
}

const sfx = String(Date.now()).slice(-6);
const email = `zt-${sfx}@sgsi.co.id`;
const super_ = (await login("wahyu@sgsi.co.id")).token, lab = (await login("maya@sgsi.co.id")).token;

try {
  ok("lab admin cannot list users", (await call(lab, "GET", "/users")).status === 403);
  ok("lab admin cannot invite", (await call(lab, "POST", "/users", { fullName: "No Way", email: `zt-no-${sfx}@sgsi.co.id`, roles: ["analyst"] })).status === 403);
  const list = await call(super_, "GET", "/users");
  ok("superadmin lists users with roles and status", list.status === 200 && list.body.items.length >= 10 && list.body.items.find((u: any) => u.email === "maya@sgsi.co.id")?.roles[0] === "lab_admin", JSON.stringify(list.body).slice(0, 200));
  const grid = await call(super_, "GET", "/roles");
  ok("roles grid has 7 roles, 37 permissions, and the grid", grid.body.roles.length === 7 && grid.body.permissions.length === 37 && grid.body.grid.includes("superadmin:user.manage"), `${grid.body.roles?.length} roles, ${grid.body.permissions?.length} permissions, ${grid.body.grid?.length} grid`);

  const mk = await call(super_, "POST", "/users", { fullName: "Zeta Tester", email, title: "Analyst", phone: "+62 811 000", roles: ["analyst", "prep"] });
  ok("superadmin invites a user", mk.status === 201 && typeof mk.body.inviteLink === "string", JSON.stringify(mk.body));
  const id = mk.body.id as string;
  ok("duplicate email is 409 on field email", (await call(super_, "POST", "/users", { fullName: "Zeta Two", email, roles: ["analyst"] })).body?.field === "email");
  ok("no role is rejected", (await call(super_, "POST", "/users", { fullName: "Zeta Two", email: `zt-r-${sfx}@sgsi.co.id`, roles: [] })).status === 422);
  let page = (await call(super_, "GET", `/users/${id}`)).body;
  ok("new user is invited with two roles and an expiry", page.status === "invited" && page.roles.length === 2 && !!page.inviteExpiresAt, JSON.stringify(page).slice(0, 200));
  ok("invited user cannot sign in yet", (await login(email, "whatever-1A!")).status !== 200);
  ok("reset is refused for an invited user", (await call(super_, "POST", `/users/${id}/reset`)).status === 409);
  ok("resend gives a fresh link", typeof (await call(super_, "POST", `/users/${id}/resend-invite`)).body?.link === "string");

  // the invite link: Supabase verifies it and redirects with a session in the URL hash
  const verify = await fetch(mk.body.inviteLink, { redirect: "manual" });
  const loc = verify.headers.get("location") ?? "";
  const hash = new URLSearchParams(loc.split("#")[1] ?? "");
  const linkToken = hash.get("access_token");
  ok("the invite link opens a session", !!linkToken, loc.slice(0, 160));
  const newPw = "Gamma-River-Pass-7!";
  if (linkToken) {
    const sp = await call(linkToken, "POST", "/auth/set-password", { password: newPw });
    ok("the invited user can choose a password", sp.status === 204, JSON.stringify(sp.body));
    ok("then signs in and is active", (await login(email, newPw)).status === 200 && (await call(super_, "GET", `/users/${id}`)).body.status === "active");
  }

  ok("edit changes roles and name", (await call(super_, "PATCH", `/users/${id}`, { fullName: "Zeta Tester Jr", title: "Senior analyst", roles: ["analyst"] })).status === 200
    && (await call(super_, "GET", `/users/${id}`)).body.roles.join() === "analyst");
  ok("a user's new role limits them at once", (await call((await login(email, newPw)).token, "GET", "/users")).status === 403);
  ok("reset link for an active user", typeof (await call(super_, "POST", `/users/${id}/reset`)).body?.link === "string");

  ok("deactivate", (await call(super_, "POST", `/users/${id}/deactivate`)).status === 200 && (await call(super_, "GET", `/users/${id}`)).body.status === "inactive");
  ok("a deactivated user cannot sign in", (await login(email, newPw)).status !== 200);
  ok("reactivate returns an active user", (await call(super_, "POST", `/users/${id}/reactivate`)).status === 200 && (await call(super_, "GET", `/users/${id}`)).body.status === "active");
  ok("unlock on an unlocked user is 404", (await call(super_, "POST", `/users/${id}/unlock`)).status === 404);
  await sql`update profiles set status = 'locked', failed_attempts = 5, locked_until = now() + interval '10 minutes' where id = ${id}`;
  ok("a locked user shows as locked", (await call(super_, "GET", `/users/${id}`)).body.status === "locked");
  ok("unlock", (await call(super_, "POST", `/users/${id}/unlock`)).status === 200 && (await call(super_, "GET", `/users/${id}`)).body.status === "active");

  const [w] = await sql`select id from profiles where email = 'wahyu@sgsi.co.id'`;
  const wid = w!.id as string;
  ok("the only Superadmin cannot be deactivated", (await call(super_, "POST", `/users/${wid}/deactivate`)).status === 409);
  ok("the only Superadmin cannot lose the role", (await call(super_, "PATCH", `/users/${wid}`, { fullName: "Wahyu Pratama", roles: ["lab_admin"] })).body?.field === "roles");
  ok("an unknown id is 404", (await call(super_, "GET", "/users/00000000-0000-4000-8000-000000000000")).status === 404);
  const [a] = await sql`select count(*)::int as n from audit_log where record_id = ${id}`;
  ok("changes wrote audit rows", a!.n >= 4, String(a!.n));
} finally {
  const rows = await sql`select id from profiles where email like 'zt-%@sgsi.co.id'`;
  await sql.begin(async (tx) => { await tx`select set_config('app.skip_audit', 'on', true)`; await tx`delete from user_roles where user_id in (select id from profiles where email like 'zt-%@sgsi.co.id')`; await tx`delete from profiles where email like 'zt-%@sgsi.co.id'`; });
  for (const r of rows) await admin.auth.admin.deleteUser(r.id as string);
  await sql.end();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll user checks passed");
process.exit(failed ? 1 : 0);
