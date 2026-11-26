// Phase 5, slice C3 (Phase5_Build_Design.md 12.9: PR1 to PR3) at 1440, 834 and 390: the Profile saves the name, Change password refuses a wrong current password and an unmet rule, then
// changes the password and changes it back; a notification switched off stops that event for that person only; the user menu shows the roles and opens Notification settings, and the
// phone drawer shows the profile block at its bottom with Sign out. Test values start with ZE and are removed afterwards. Needs `pnpm seed:orders`.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
async function signIn(page: Page, email: string, pw = PW) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(pw);
  await page.locator("#si-submit").click();
  await expect(page.locator(".frame")).toBeVisible();
}
const token = async (request: APIRequestContext, email: string, pw = PW) => ((await (await request.post(`${API}/auth/sign-in`, { data: { email, password: pw } })).json()) as { accessToken: string }).accessToken;
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });

/** A submitted job order with two samples and one batch, made through the API by the CSO; returns the batch number. */
async function seedBatch(request: APIRequestContext, no: string): Promise<string> {
  const h = { authorization: `Bearer ${await token(request, "rina@sgsi.co.id")}` };
  const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
  const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
  expect((await request.post(`${API}/orders`, { headers: h, data: { orderNo: no, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE profile ${no}`, standards: ["ASTM"],
    parameterIds: ["PREP", "TM", "IM", "ASH"].map(pid), expectedSamples: 2, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } })).status()).toBe(201);
  expect((await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: ["ZE-N1", "ZE-N2"].map((c) => ({ clientRef: c })), removed: [] } })).status()).toBe(200);
  const f = (await (await request.get(`${API}/orders/${no}/batch-form`, { headers: h })).json()) as { nextBatchNo: string; batchDate: string; samples: Array<{ id: string }>; parameters: Array<{ id: string; inOrder: boolean }> };
  expect((await request.post(`${API}/batches`, { headers: h, data: { orderNo: no, batchNo: f.nextBatchNo, batchDate: f.batchDate, deadlineOn: null, standard: "ASTM", sampleIds: f.samples.map((s) => s.id),
    parameterIds: f.parameters.filter((p) => p.inOrder).map((p) => p.id), cocNo: "", priority: "Standard", notes: "" } })).status()).toBe(201);
  return f.nextBatchNo;
}

test.describe.serial("profile", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });

  test("PR1: the name saves; Change password refuses a wrong current password and an unmet rule, then changes it and back", async ({ page, request }, info) => {
    const email = "joko@sgsi.co.id", next = `Coal-lab-${Date.now() % 100000}x9`, who = info.project.name;
    await signIn(page, email);
    await page.goto("/profile");
    await expect(page.locator("#pf-pw-date")).toBeVisible();
    await expect(page.locator("#pf-save")).toBeDisabled();
    const original = await page.locator("#pf-name").inputValue();
    await page.locator("#pf-name").fill(`${original} ${who[0]}`);
    await page.locator("#pf-save").click();
    await expect(page.getByText("Profile saved")).toBeVisible();
    await page.locator("#pf-name").fill(original);
    await page.locator("#pf-save").click();
    await expect(page.getByText("Profile saved").last()).toBeVisible();

    await page.locator("#pf-pw").click();
    await page.locator("#pw-current").fill("not-the-password-1");
    await page.locator("#pw-new").fill(next);
    await page.locator("#pw-again").fill(next);
    await page.locator("#pw-save").click();
    await expect(page.getByText("The current password is not correct.")).toBeVisible({ timeout: 20_000 });
    await page.locator("#pw-current").fill(PW);
    await page.locator("#pw-new").fill("short1");
    await page.locator("#pw-again").fill("short1");
    await expect(page.locator("#pw-rules")).toContainText("At least 10 characters");
    await page.locator("#pw-save").click();
    await expect(page.getByText(/^Use at least 10 characters/)).toBeVisible();
    await page.locator("#pw-new").fill(next);
    await page.locator("#pw-again").fill("something-else-9");
    await page.locator("#pw-save").click();
    await expect(page.getByText("The two passwords are not the same.")).toBeVisible();
    await page.locator("#pw-again").fill(next);
    await page.locator("#pw-save").click();
    await expect(page.getByText("Password changed")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("#pf-pw-date")).toContainText("Last changed");

    // the new password works; change it back through the API so every other test keeps its sign-in
    const t = await token(request, email, next);
    const back = await request.post(`${API}/me/password`, { headers: { authorization: `Bearer ${t}` }, data: { current: next, password: PW } });
    expect(back.status()).toBe(204);
    expect(await token(request, email)).toBeTruthy();
  });

  test("PR2: turning off an event stops it for that person only", async ({ page, request }, info) => {
    const no = `ZE-JO-06${["desktop", "tablet", "phone"].indexOf(info.project.name)}`;
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto("/profile");
    const sw = page.locator("#nt-N1");
    await expect(sw).toContainText("Batch ready to receive");
    await expect(sw.locator("[role=switch]")).toHaveAttribute("aria-checked", "true");
    await sw.click();
    await expect(sw.locator("[role=switch]")).toHaveAttribute("aria-checked", "false");
    await page.reload();
    await expect(page.locator("#nt-N1 [role=switch]")).toHaveAttribute("aria-checked", "false");
    try {
      const batch = await seedBatch(request, no);
      const mine = JSON.stringify(await (await request.get(`${API}/notifications`, { headers: { authorization: `Bearer ${await token(request, "dedi@sgsi.co.id")}` } })).json());
      const other = JSON.stringify(await (await request.get(`${API}/notifications`, { headers: { authorization: `Bearer ${await token(request, "yusuf@sgsi.co.id")}` } })).json());
      expect(mine).not.toContain(batch);
      expect(other).toContain(batch);
    } finally {
      const h = { authorization: `Bearer ${await token(request, "dedi@sgsi.co.id")}` };
      await request.patch(`${API}/me`, { headers: h, data: { prefs: { notifications: {} } } });
    }
  });

  test("PR3: the user menu shows the roles and opens Notification settings; the phone drawer has the profile block", async ({ page }, info) => {
    await signIn(page, "maya@sgsi.co.id");
    if (info.project.name === "phone") {
      await page.getByRole("button", { name: /menu/i }).first().click();
      await expect(page.locator("#drawer-profile")).toContainText("Lab admin");
      await expect(page.locator("#drawer-signout")).toBeVisible();
      await page.locator("#drawer-profile").getByText("Profile", { exact: true }).click();
      await expect(page).toHaveURL(/\/profile/);
      return;
    }
    await page.getByRole("button", { name: "User menu" }).click();
    await expect(page.locator("#menu-roles")).toContainText("Lab admin");
    await page.locator("#menu-notes").click();
    await expect(page).toHaveURL(/\/profile#notifications/);
    await expect(page.locator("#pf-notes")).toBeVisible();
    await expect(page.locator("#nt-N4")).toContainText("Analysis finished, RoA to upload");
    await expect(page.locator("#nt-N8")).toHaveCount(0);
  });
});
