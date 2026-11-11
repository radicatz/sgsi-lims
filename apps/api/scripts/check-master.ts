// Live check of the master data API against the real database: who may read and write, duplicates, CoA history,
// logo upload, in-use rules. Needs the API running on API_PORT. Cleans up its own rows (codes start with ZT).
// Run: pnpm --filter @sgsi/api exec tsx --env-file=../../.env scripts/check-master.ts
import { sql } from "../src/db";
import { cleanupTestData } from "./cleanup-test-data";

const API = `http://localhost:${process.env.API_PORT ?? 4000}/api`;
const PW = process.env.DEMO_PASSWORD!;
let failed = 0;
const ok = (name: string, pass: boolean, extra = "") => { if (!pass) failed++; console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : "  " + extra}`); };

type Res = { status: number; body: any };
async function call(token: string, method: string, path: string, body?: unknown, form?: FormData): Promise<Res> {
  const headers: Record<string, string> = { authorization: `Bearer ${token}` };
  if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(API + path, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  return { status: r.status, body: await r.json().catch(() => null) };
}
async function login(email: string) {
  const r = await fetch(`${API}/auth/sign-in`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  if (r.status !== 200) throw new Error(`sign in ${email}: ${r.status}`);
  return ((await r.json()) as { accessToken: string }).accessToken;
}
const file = (name: string, type: string, bytes: Uint8Array) => { const f = new FormData(); f.append("file", new Blob([bytes], { type }), name); return f; };
const PNG = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"));
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

const sfx = String(Date.now()).slice(-6);
const T = { cso: await login("rina@sgsi.co.id"), lab: await login("maya@sgsi.co.id"), sup: await login("hendra@sgsi.co.id"), prep: await login("dedi@sgsi.co.id"), mgr: await login("bambang@sgsi.co.id") };

try {
  /* clients */
  const code = `ZT${sfx}`;
  const mk = await call(T.cso, "POST", "/companies", { name: `PT Test ${sfx}`, code, status: "active", address: "Jl. Uji 1" });
  ok("cso creates a client", mk.status === 201, JSON.stringify(mk));
  const cid = mk.body.id as string;
  ok("duplicate client code is 409 on field code", (await call(T.cso, "POST", "/companies", { name: "Other", code })).body?.field === "code");
  ok("lab admin cannot create a client", (await call(T.lab, "POST", "/companies", { name: "X", code: `ZX${sfx}` })).status === 403);
  ok("preparation cannot read clients", (await call(T.prep, "GET", "/companies")).status === 403);
  ok("lab admin reads clients", (await call(T.lab, "GET", "/companies")).status === 200);
  ok("invalid code rejected", (await call(T.cso, "POST", "/companies", { name: "X", code: "bad code!" })).status === 422);

  const c1 = await call(T.cso, "POST", `/companies/${cid}/contacts`, { fullName: "Budi Uji", position: "Geologist", email: "budi@example.com", phone: "+62 811", isDefault: false });
  const c2 = await call(T.cso, "POST", `/companies/${cid}/contacts`, { fullName: "Sari Uji", email: "", isDefault: true });
  ok("contacts created", c1.status === 201 && c2.status === 201);
  let page = (await call(T.cso, "GET", `/companies/${cid}`)).body;
  ok("first contact became default, then the second took over", page.contacts.length === 2 && page.contacts[0].fullName === "Sari Uji" && page.contacts[0].isDefault && !page.contacts[1].isDefault, JSON.stringify(page.contacts));
  await call(T.cso, "POST", `/contacts/${c1.body.id}/default`);
  page = (await call(T.cso, "GET", `/companies/${cid}`)).body;
  ok("make default moves the default", page.contacts.find((k: any) => k.isDefault)?.fullName === "Budi Uji");
  ok("bad email rejected", (await call(T.cso, "PATCH", `/contacts/${c2.body.id}`, { fullName: "Sari", email: "nope", isDefault: false })).status === 422);
  ok("a contact can be deleted while another remains", (await call(T.cso, "DELETE", `/contacts/${c2.body.id}`)).status === 200);
  { const pg = (await call(T.cso, "GET", `/companies/${cid}`)).body; ok("deleted contact leaves the page, the other becomes default", pg.contacts.length === 1 && pg.contacts[0].isDefault); }
  ok("the last contact cannot be deleted", (await call(T.cso, "DELETE", `/contacts/${c1.body.id}`)).status === 409);

  const lg = await call(T.cso, "POST", `/companies/${cid}/logo`, undefined, file("logo.png", "image/png", PNG));
  ok("logo uploads", lg.status === 200, JSON.stringify(lg));
  const withLogo = (await call(T.cso, "GET", `/companies/${cid}`)).body;
  ok("client page has a signed logo link", typeof withLogo.logoUrl === "string" && (await fetch(withLogo.logoUrl)).status === 200);
  ok("a text file is refused as a logo", (await call(T.cso, "POST", `/companies/${cid}/logo`, undefined, file("a.txt", "text/plain", PDF))).status === 415);

  /* drill holes, lithology, seam */
  const hole = await call(T.lab, "POST", "/drill-holes", { companyId: cid, code: `dh-zt-${sfx}`, description: "Batch 1" });
  ok("lab admin creates a drill hole (code upper-cased)", hole.status === 201, JSON.stringify(hole));
  const hid = hole.body.id as string;
  const dup = await call(T.lab, "POST", "/drill-holes", { companyId: cid, code: `DH-ZT-${sfx}` });
  ok("duplicate drill hole names the client", dup.status === 409 && dup.body.text.includes(`PT Test ${sfx}`), JSON.stringify(dup.body));
  ok("cso cannot read drill holes", (await call(T.cso, "GET", "/drill-holes")).status === 403);
  ok("supervisor reads drill holes", (await call(T.sup, "GET", "/drill-holes")).status === 200);
  ok("supervisor cannot add one", (await call(T.sup, "POST", "/drill-holes", { companyId: cid, code: "ZT-NO" })).status === 403);
  ok("manager cannot add one", (await call(T.mgr, "POST", "/drill-holes", { companyId: cid, code: "ZT-NO" })).status === 403);

  ok("supervisor cannot upload a CoA", (await call(T.sup, "POST", `/drill-holes/${hid}/coa`, undefined, file("c.pdf", "application/pdf", PDF))).status === 403);
  ok("a non-PDF CoA is refused", (await call(T.lab, "POST", `/drill-holes/${hid}/coa`, undefined, file("c.pdf", "application/pdf", PNG))).status === 415);
  ok("CoA 1 uploads", (await call(T.lab, "POST", `/drill-holes/${hid}/coa`, undefined, file("CoA-1.pdf", "application/pdf", PDF))).status === 201);
  ok("CoA 2 replaces it", (await call(T.lab, "POST", `/drill-holes/${hid}/coa`, undefined, file("CoA-2.pdf", "application/pdf", PDF))).status === 201);
  const hist = (await call(T.sup, "GET", `/drill-holes/${hid}/coa`)).body.items as any[];
  ok("history keeps both files, newest current", hist.length === 2 && hist[0].fileName === "CoA-2.pdf" && hist[0].isCurrent && !hist[1].isCurrent, JSON.stringify(hist));
  ok("history link downloads the PDF", (await fetch(hist[0].url)).status === 200);
  const list = (await call(T.lab, "GET", "/drill-holes")).body.items as any[];
  ok("list shows the current CoA", list.find((d) => d.id === hid)?.coa?.fileName === "CoA-2.pdf");
  ok("drill hole with a CoA cannot be deleted", (await call(T.lab, "DELETE", `/drill-holes/${hid}`)).status === 409);
  ok("client with master data cannot be deleted", (await call(T.cso, "DELETE", `/companies/${cid}`)).status === 409);
  ok("archive and restore a drill hole", (await call(T.lab, "POST", `/drill-holes/${hid}/archive`)).status === 200 && (await call(T.lab, "GET", "/drill-holes")).body.items.find((d: any) => d.id === hid).archived
    && (await call(T.lab, "POST", `/drill-holes/${hid}/restore`)).status === 200);

  const li = await call(T.lab, "POST", "/lithologies", { companyId: cid, name: `Claystone ${sfx}`, kind: "parting" });
  ok("lithology created", li.status === 201);
  ok("duplicate lithology is 409 on field name", (await call(T.lab, "POST", "/lithologies", { companyId: cid, name: `Claystone ${sfx}`, kind: "coal" })).body?.field === "name");
  ok("lithology kind edit", (await call(T.lab, "PATCH", `/lithologies/${li.body.id}`, { companyId: cid, name: `Claystone ${sfx}`, kind: "coal" })).status === 200
    && (await call(T.lab, "GET", "/lithologies")).body.items.find((x: any) => x.id === li.body.id).kind === "coal");
  ok("bad lithology kind rejected", (await call(T.lab, "POST", "/lithologies", { companyId: cid, name: "Z", kind: "rock" })).status === 422);
  const se = await call(T.lab, "POST", "/seams", { companyId: cid, code: `zt-${sfx}`, description: "Test seam", sortOrder: 5 });
  ok("seam created", se.status === 201);
  ok("seam list carries the order", (await call(T.sup, "GET", "/seams")).body.items.find((x: any) => x.id === se.body.id)?.sortOrder === 5);
  ok("unused lithology and seam delete", (await call(T.lab, "DELETE", `/lithologies/${li.body.id}`)).status === 200 && (await call(T.lab, "DELETE", `/seams/${se.body.id}`)).status === 200);

  /* client archive and delete rules */
  ok("archive and restore a client", (await call(T.cso, "POST", `/companies/${cid}/archive`)).status === 200
    && (await call(T.cso, "GET", `/companies/${cid}`)).body.status === "archived" && (await call(T.cso, "POST", `/companies/${cid}/restore`)).status === 200);
  ok("an unknown id is 404", (await call(T.cso, "GET", "/companies/00000000-0000-4000-8000-000000000000")).status === 404);

  /* audit: every change wrote a row, with the screen */
  const [a] = await sql`select count(*)::int as n from audit_log where record_id in (${cid}, ${hid})`;
  ok("changes wrote audit rows", a!.n >= 5, String(a!.n));
} finally {
  await cleanupTestData();
  await sql.end();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll master data checks passed");
process.exit(failed ? 1 : 0);
