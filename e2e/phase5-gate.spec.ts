// Phase 5 gate (Phase5_Build_Design.md section 16) at 1440, 834 and 390: the tests the 45 prototype flows lacked (GT1 to GT9), as the app works today.
// GT1 follows one job order through every hand-off: each step is done through the API as the role that does it, and the next person's screen is checked in the browser
// (the screens of each step have their own tests in the phase specs). Its test client, drill hole and order start with ZE and are removed afterwards.
// G-4: each persona signs in once per size and the session is reused, to stay under Supabase's sign-in limit. Needs the demo seeds and Gotenberg.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { navFor, startPath } from "../packages/shared/src/permissions";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
const PDF = Buffer.from(["%PDF-1.4", "1 0 obj<</Type/Catalog>>endobj", "trailer<</Root 1 0 R>>", "%%EOF", ""].join("\n"));
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });
const PEOPLE = { cso: "rina@sgsi.co.id", prep: "dedi@sgsi.co.id", analyst: "fitri@sgsi.co.id", admin: "maya@sgsi.co.id", supervisor: "hendra@sgsi.co.id", manager: "bambang@sgsi.co.id", superadmin: "wahyu@sgsi.co.id" };
const LAB_TODAY = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Makassar" });

/* ---------- sessions: one sign-in per persona per size (G-4) ---------- */
const sessions = new Map<string, string>(), tokens = new Map<string, string>();
async function as(page: Page, email: string, path = "/") {
  const saved = sessions.get(email);
  await page.goto("/login");
  if (saved) {
    await page.evaluate((v) => { localStorage.clear(); localStorage.setItem("sgsi.session", v); }, saved);
  } else {
    await page.evaluate(() => localStorage.clear());
    await page.goto("/login");
    await page.locator("#si-email").fill(email);
    await page.locator("#si-pw").fill(PW);
    await page.locator("#si-submit").click();
    await expect(page.locator(".frame")).toBeVisible();
    sessions.set(email, (await page.evaluate(() => localStorage.getItem("sgsi.session")))!);
  }
  await page.goto(path);
  await expect(page.locator(".frame")).toBeVisible();
}
async function token(request: APIRequestContext, email: string) {
  if (!tokens.has(email)) tokens.set(email, ((await (await request.post(`${API}/auth/sign-in`, { data: { email, password: PW } })).json()) as { accessToken: string }).accessToken);
  return tokens.get(email)!;
}
async function call<T = Record<string, unknown>>(request: APIRequestContext, email: string, method: "GET" | "POST" | "PUT" | "PATCH", path: string, data?: unknown): Promise<{ status: number; body: T }> {
  const r = await request.fetch(`${API}${path}`, { method, headers: { authorization: `Bearer ${await token(request, email)}` }, ...(data !== undefined ? { data } : {}) });
  return { status: r.status(), body: (await r.json().catch(() => null)) as T };
}
const ok = async <T,>(p: Promise<{ status: number; body: T }>, want = [200, 201, 204]) => { const r = await p; expect(want, JSON.stringify(r.body)).toContain(r.status); return r.body; };
const cardOf = (page: Page, title: string) => page.locator("section.card").filter({ has: page.locator("h2", { hasText: new RegExp(`^${title}$`) }) }).first();
/** The notifications page lists the person's notifications at every size (the bell panel is desktop and tablet only). */
async function sees(page: Page, email: string, text: string | RegExp) {
  await as(page, email, "/notifications");
  await expect(page.locator("main")).toContainText(text, { timeout: 20_000 });
}

test.describe.serial("phase 5 gate", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });

  /* GT1 shares its records with GT5, GT6, GT7 and GT9 */
  let size = "", idx = 0, order = "", batch = "", company = "", hole = "", holdReason = "", sample = { id: "", no: "" };

  test("GT2 (AP1): every persona lands on its start page with its own sidebar", async ({ page, request }, info) => {
    test.setTimeout(180_000);                                                                   // the first sign-in of each persona at this size
    const phone = info.project.name === "phone";
    for (const email of Object.values(PEOPLE)) {
      await as(page, email, "/login");                                                          // a signed-in person on /login is sent to the start page
      const me = (await call<{ permissions: string[]; prefs: { startPage?: string } }>(request, email, "GET", "/me")).body;
      const start = startPath(me.permissions, me.prefs.startPage);
      await expect(page, email).toHaveURL(new RegExp(`${start === "/" ? "/$" : `${start}$`}`));
      const want = navFor(me.permissions).flatMap((g) => g.items.map((i) => i.path)).sort();
      if (phone) await page.getByRole("button", { name: "Open menu" }).click();
      const nav = page.locator(phone ? ".scrim nav.side" : "nav.side").first();
      const got = (await nav.locator("a.nav").evaluateAll((as) => as.map((a) => new URL((a as HTMLAnchorElement).href).pathname))).sort();
      expect(got, email).toEqual(want);
    }
  });

  test("GT1: one job order through every hand-off, then found again in search, history and the audit log", async ({ page, request }, info) => {
    test.setTimeout(240_000);
    size = info.project.name; idx = ["desktop", "tablet", "phone"].indexOf(size);
    order = `ZE-JO-G${idx}`; hole = `ZE-DH-G${idx}`; holdReason = `ZE gate ${size} ${Date.now() % 100000}`;
    const { cso, prep, analyst, admin, manager, supervisor, superadmin } = PEOPLE;

    // 0. a test client with a contact and a drill hole (the CSO manages clients; the Lab admin, drill holes)
    company = (await ok(call<{ id: string }>(request, cso, "POST", "/companies", { name: `ZE Gate ${size}`, code: `ZEG${idx}${Date.now() % 10000}` }))).id;
    const contact = (await ok(call<{ id: string }>(request, cso, "POST", `/companies/${company}/contacts`, { fullName: "ZE Gate contact", email: "" }))).id;
    await ok(call(request, admin, "POST", "/drill-holes", { companyId: company, code: hole }));

    // 1. the CSO submits the job order and registers three samples from the hole
    const cat = (await ok(call<{ parameters: Array<{ id: string; code: string }>; signatories: Array<{ id: string; isManager: boolean }> }>(request, cso, "GET", "/orders/catalogue")));
    const pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
    await ok(call(request, cso, "POST", "/orders", { orderNo: order, companyId: company, contactId: contact, clientReference: `ZE gate ${size}`, standards: ["ASTM"],
      parameterIds: ["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV"].map(pid), expectedSamples: 3, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard",
      signatoryId: cat.signatories.find((s) => s.isManager)!.id, submit: true }));
    await ok(call(request, cso, "PUT", `/orders/${order}/samples`, { rows: ["ZE-G1", "ZE-G2", "ZE-G3"].map((c) => ({ clientRef: c, drillHole: hole })), removed: [] }));
    await as(page, cso, `/orders/${order}/samples`);
    await expect(page.locator("main")).toContainText("0 of 3 arrived");                         // the three registered samples wait for reception

    // 2. the Lab admin adds a batch due tomorrow; Preparation is told (N1)
    const form = await ok(call<{ nextBatchNo: string; batchDate: string; samples: Array<{ id: string }>; parameters: Array<{ id: string; inOrder: boolean }> }>(request, admin, "GET", `/orders/${order}/batch-form`));
    batch = form.nextBatchNo;
    const tomorrow = new Date(Date.parse(`${LAB_TODAY()}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    await ok(call(request, admin, "POST", "/batches", { orderNo: order, batchNo: batch, batchDate: form.batchDate, deadlineOn: tomorrow, standard: "ASTM", sampleIds: form.samples.map((s) => s.id),
      parameterIds: form.parameters.filter((p) => p.inOrder).map((p) => p.id), cocNo: "", priority: "Standard", notes: "" }));
    await sees(page, prep, batch);

    // 3. reception: two samples arrive (Sample IDs), one is held with a reason added in Configuration and released (GT7, GT9), one never comes
    await as(page, superadmin, "/config/lookups");
    await page.getByRole("tab", { name: /^Hold reasons/ }).click();
    await page.locator("#add-hold_reason").click();
    await page.locator("#lk-value").fill(holdReason);
    await page.locator("#lk-save").click();
    await expect(page.locator(size === "phone" ? ".lrow" : "tr", { hasText: holdReason })).toBeVisible();
    const rec = await ok(call<{ items: Array<{ id: string; clientRef: string; sampleNo: string | null }> }>(request, prep, "GET", `/batches/${batch}/reception`));
    const row = (c: string) => rec.items.find((r) => r.clientRef === c)!;
    for (const c of ["ZE-G1", "ZE-G2"]) await ok(call(request, prep, "PATCH", `/batches/${batch}/samples/${row(c).id}`, { arrived: true, mass: "5.20", condition: "Good" }));
    await as(page, prep, `/batches/${batch}/reception`);
    await page.getByRole("button", { name: "More for ZE-G2" }).first().click();
    await page.getByRole("menuitem", { name: "Hold sample" }).click();
    await page.getByRole("dialog").getByLabel("Reason").selectOption(holdReason);              // the reason added a moment ago is offered
    await page.locator("#hold-confirm").click();
    await expect(page.getByText(`Held: ${holdReason}`).first()).toBeVisible();
    await page.getByRole("button", { name: "More for ZE-G2" }).first().click();
    await page.getByRole("menuitem", { name: "Release from hold" }).click();
    await expect(page.getByText("ZE-G2 released from hold").first()).toBeVisible();
    const arrived = await ok(call<{ items: Array<{ id: string; clientRef: string; sampleNo: string | null }> }>(request, prep, "GET", `/batches/${batch}/reception`));
    const g1 = arrived.items.find((r) => r.clientRef === "ZE-G1")!;
    expect(g1.sampleNo).toMatch(/^SG\.\d{6}\.\d{3}\.[A-Z]{2}\.\d{3}$/);                      // spec 6.1, given on arrival
    sample = { id: g1.id, no: g1.sampleNo! };
    await ok(call(request, prep, "POST", `/batches/${batch}/labels`, { sampleIds: [row("ZE-G1").id, row("ZE-G2").id] }));
    expect((await call(request, prep, "POST", `/batches/${batch}/confirm`, {})).status).toBe(409);   // one sample is missing: Confirm asks first
    await ok(call(request, prep, "POST", `/batches/${batch}/confirm`, { fewer: true }));
    await sees(page, cso, `1 sample of ${order} did not arrive`);                              // N2 to the CSO

    // 4. Preparation enters the ADL and finishes (N3); the analyst enters the values and finishes (N4)
    await ok(call(request, prep, "PUT", `/batches/${batch}/adl`, { values: [{ sampleId: row("ZE-G1").id, value: "8.40" }, { sampleId: row("ZE-G2").id, value: "9.10" }] }));
    await ok(call(request, prep, "POST", `/batches/${batch}/finish-prep`));
    await sees(page, analyst, batch);
    const grid = await ok(call<{ cols: Array<{ key: string; code: string; kind: string }> }>(request, analyst, "GET", `/batches/${batch}/analysis`));
    const key = (c: string) => grid.cols.find((x) => x.code === c)!.key;
    const v: Record<string, string> = { TM: "14.50", IM: "9.10", ASH: "8.50", VM: "40.20", TS: "0.55", GCV: "5600" };
    await ok(call(request, analyst, "PUT", `/batches/${batch}/analysis`, { values: ["ZE-G1", "ZE-G2"].flatMap((c) => Object.entries(v).map(([p, value]) => ({ sampleId: row(c).id, key: key(p), value }))) }));
    await ok(call(request, analyst, "POST", `/batches/${batch}/finish-analysis`));
    await sees(page, admin, batch);

    // 5. the Lab admin uploads the signed RoA and completes the batch, drafts the CoA and sends it for signature; the Manager signs (publishes it)
    const up = await request.post(`${API}/batches/${batch}/roa`, { headers: { authorization: `Bearer ${await token(request, admin)}` }, multipart: { roaNo: `RoA-ZE-G${idx}`, file: { name: "roa.pdf", mimeType: "application/pdf", buffer: PDF } } });
    expect(up.status(), await up.text()).toBe(201);
    await ok(call(request, admin, "POST", `/batches/${batch}/complete`));
    const coa = (await ok(call<{ id: string }>(request, admin, "POST", `/orders/${order}/coa`))).id;
    await ok(call(request, admin, "POST", `/reports/coa/${coa}/send`));
    await sees(page, manager, `CoA for ${order} waits for your signature`);                   // N9 to the signatory
    await ok(call(request, manager, "POST", `/reports/coa/${coa}/sign`, { password: PW }));

    // 6. the CSO finds it in CoAs to send and marks it sent; the job order is Delivered
    await as(page, cso, "/work/coa-send");
    await expect(page.locator("main")).toContainText(new RegExp(`${order}|ZE Gate ${size}`), { timeout: 20_000 });
    await ok(call(request, cso, "POST", `/reports/coa/${coa}/deliveries`, { sentOn: LAB_TODAY(), channels: ["Email"], recipient: "ZE Gate contact" }));
    await as(page, cso, `/orders/${order}`);
    await expect(page.locator("main")).toContainText("Delivered", { timeout: 20_000 });

    // 7. afterwards: search finds the Sample ID, its history has the steps, and the audit log has its rows (Supervisor)
    await as(page, supervisor, `/search?q=${encodeURIComponent(sample.no)}`);
    await expect(page.locator("main")).toContainText(sample.no, { timeout: 20_000 });
    await as(page, supervisor, `/samples/${sample.id}/history`);
    for (const step of [/received/i, /analysis/i]) await expect(page.locator("main")).toContainText(step, { timeout: 20_000 });
    await as(page, supervisor, `/audit?record=${sample.id}`);
    await expect(page.locator(size === "phone" ? "#au-cards > *" : "#au-table tbody tr").first()).toBeVisible({ timeout: 30_000 });
  });

  test("GT5 (DB1): Due is what is ahead, Late what is past; the deadline alert opens a batch", async ({ page }) => {
    test.skip(!batch, "needs GT1");
    await as(page, PEOPLE.admin, "/");
    const active = cardOf(page, "Active batches");
    // GT1's batch is completed by now, so this reads the demo batches: Late shows only past deadlines, Due none of them
    await active.getByRole("button", { name: /^Late \d+/ }).click();
    if (Number((await active.getByRole("button", { name: /^Late \d+/ }).innerText()).replace(/\D/g, ""))) await expect(active.getByTitle("Past due").first()).toBeVisible();
    const dueText = await active.getByRole("button", { name: /^Due \d+/ }).innerText();
    const lateText = await active.getByRole("button", { name: /^Late \d+/ }).innerText();
    const all = Number((await active.getByRole("button", { name: /^All \d+/ }).innerText()).replace(/\D/g, ""));
    expect(Number(dueText.replace(/\D/g, "")) + Number(lateText.replace(/\D/g, ""))).toBeLessThanOrEqual(all);   // the two never overlap
    await active.getByRole("button", { name: /^Due \d+/ }).click();
    await expect(active.getByTitle("Past due")).toHaveCount(0);                                // nothing past its deadline under Due
    if (await page.locator("#db-alert").count()) {
      await page.locator("#db-alert-open").click();
      await expect(page).toHaveURL(/\/batches\/B-\d{4}-\d{4}/);
    }
  });

  test("GT6 (DB2): Upload CoA from the Quality tab clears the drill hole's Missing CoA", async ({ page }, info) => {
    test.skip(!batch, "needs GT1");
    const phone = info.project.name === "phone";
    await as(page, PEOPLE.admin, `/?tab=quality`);
    if (phone) {
      await page.locator("#db-filters").click();
      const dlg = page.getByRole("dialog");
      await dlg.locator("#db-period").selectOption("this_year");
      await dlg.locator("#db-company").selectOption(company);
      await page.getByRole("button", { name: "Apply" }).click();
    } else {
      await page.locator("#db-period").selectOption("this_year");
      await page.locator("#db-company").selectOption(company);
    }
    const card = cardOf(page, "Drill holes");
    await expect(card).toContainText(hole, { timeout: 30_000 });
    await expect(card).toContainText("CoA missing");
    await page.locator(`#dh-up-${hole}`).click();
    await page.locator("#coa-file").setInputFiles({ name: `CoA-${hole}.pdf`, mimeType: "application/pdf", buffer: PDF });
    await page.locator("#coa-save").click();
    await expect(card).toContainText("CoA uploaded", { timeout: 20_000 });
    await expect(card.getByText("CoA missing")).toHaveCount(0);
  });

  test("GT3 (AP6): the Profile's start page and sidebar choice keep after a reload", async ({ page, request }, info) => {
    const email = PEOPLE.admin;
    try {
      await as(page, email, "/profile");
      const saved = () => page.waitForResponse((r) => r.url().endsWith("/api/me") && r.request().method() === "PATCH");
      let wait = saved();
      await page.locator("#pf-start").selectOption("/");
      await wait;
      if (info.project.name === "desktop") {
        wait = saved();
        await page.getByRole("group", { name: "Sidebar" }).getByRole("button", { name: "Collapsed" }).click();
        await wait;
        await expect(page.locator("nav.side.rail")).toBeVisible();
      }
      await page.reload();
      await expect(page.locator("#pf-start")).toHaveValue("/");
      await expect(page.locator(".brand")).toHaveAttribute("href", "/");                        // the logo goes to the chosen start page
      if (info.project.name === "desktop") await expect(page.locator("nav.side.rail")).toBeVisible();
    } finally {
      await call(request, email, "PATCH", "/me", { prefs: { sidebar: "expanded", startPage: null } });
    }
  });

  test("GT4 and GT9 (AP7, AD4): a new idle time in Security is what the session uses; Stay signed in keeps the person signed in", async ({ page, request }) => {
    const sa = PEOPLE.superadmin;
    const sec = (await ok(call<Record<string, unknown>>(request, sa, "GET", "/config/settings/security")));
    const value = (sec as { value?: Record<string, unknown> }).value ?? sec;
    try {
      await ok(call(request, sa, "PUT", "/config/settings/security", { ...value, idle_sign_out_minutes: 5, warn_before_seconds: 60 }));
      await page.clock.install();
      await as(page, PEOPLE.cso, "/orders");
      await page.clock.fastForward("04:05");                                                    // 5 minutes less the 60 s warning
      const dlg = page.getByRole("dialog", { name: "Still there?" });
      await expect(dlg).toBeVisible();
      await dlg.getByRole("button", { name: "Stay signed in" }).click();
      await expect(dlg).toHaveCount(0);
      await page.clock.fastForward("02:00");                                                    // the clock started again: no sign-out yet
      await expect(page).toHaveURL(/\/orders$/);
    } finally {
      await call(request, sa, "PUT", "/config/settings/security", { ...value, idle_sign_out_minutes: value.idle_sign_out_minutes ?? 30, warn_before_seconds: value.warn_before_seconds ?? 60 });
    }
  });

  test("GT8 (AD2): Unlock on the user page brings a locked person back", async ({ page, request }) => {
    const email = "bagus@sgsi.co.id";
    for (let i = 0; i < 5; i++) await request.post(`${API}/auth/sign-in`, { data: { email, password: "not-the-password-1" } });
    const users = (await ok(call<{ items: Array<{ id: string; email: string; status: string }> }>(request, PEOPLE.superadmin, "GET", "/users"))).items;
    const who = users.find((u) => u.email === email)!;
    expect(who.status).toBe("locked");
    await as(page, PEOPLE.superadmin, `/users/${who.id}`);
    await page.getByRole("button", { name: "Unlock" }).first().click();
    await expect(page.getByText("User unlocked").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Locked after too many failed attempts");
  });
});
