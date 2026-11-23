// Phase 4, slice A (Reports_Build_Design.md section 14) at 1440, 834 and 390: the job order's CoA card, Generate, the draft page (real PDF preview, Open PDF on the phone),
// Send for signature, the Lab admin cannot sign, the named signatory signs with the wrong and then the right password, the published certificate.
// Test values start with ZE and are removed afterwards. Needs Gotenberg on :3000, `pnpm seed:master`, and the Phase 4 migrations.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
async function signIn(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(PW);
  await page.locator("#si-submit").click();
  await expect(page.locator(".frame")).toBeVisible();
}
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });
const fixture = (order: string, batch: string) => execSync(`npx tsx --env-file=../../.env scripts/test-fixture-reports.ts ${order} ${batch}`, { cwd: "apps/api", stdio: "pipe" });

async function seedOrder(request: APIRequestContext, no: string) {
  const token = ((await (await request.post(`${API}/auth/sign-in`, { data: { email: "rina@sgsi.co.id", password: PW } })).json()) as { accessToken: string }).accessToken;
  const h = { authorization: `Bearer ${token}` };
  const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
  const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
  const made = await request.post(`${API}/orders`, { headers: h, data: { orderNo: no, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE results ${no}`, standards: ["ASTM"], parameterIds: ["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV"].map(pid), expectedSamples: 2, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } });
  expect(made.status()).toBe(201);
  const s = await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: ["ZE-A1", "ZE-A2"].map((c) => ({ clientRef: c, description: `Ply ${c}` })), removed: [] } });
  expect(s.status()).toBe(200);
}

test.describe.serial("reports, slice A", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });
  let order = "", coaUrl = "";

  test("RA1: the card says ready, the Lab admin generates the draft and sees the real PDF", async ({ page, request }, info) => {
    const phone = info.project.name === "phone", idx = ["desktop", "tablet", "phone"].indexOf(info.project.name);
    order = `ZE-JO-06${idx}`;
    await seedOrder(request, order);
    fixture(order, `B-2026-991${idx + 1}`);
    await signIn(page, "maya@sgsi.co.id");
    await page.goto(`/orders/${order}/coa`);
    await expect(page.getByText(/(batch is|batches are) completed/)).toBeVisible();
    await page.locator("#coa-generate").click();
    await expect(page).toHaveURL(/\/reports\/coa\/[0-9a-f-]{36}/);
    coaUrl = new URL(page.url()).pathname;
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
    if (phone) await expect(page.locator("#coa-open")).toBeVisible({ timeout: 45_000 }); else await expect(page.locator("#coa-preview")).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("#coa-send")).toBeEnabled();
    await expect(page.locator("#coa-sign")).toHaveCount(0);
    await page.locator("#coa-remarks").fill("Checked twice.");
    await page.waitForTimeout(1500);   // saved as you go, a short pause after the last change
    await page.locator("#coa-send").click();
    await expect(page.getByRole("dialog").getByText(/is asked to sign it/)).toBeVisible();
    await page.locator("#coa-send-ok").click();
    await expect(page.getByText("Awaiting signature").first()).toBeVisible();
    await expect(page.locator("#coa-sign")).toHaveCount(0);   // the Lab admin never signs
    await expect(page.getByText(/Waiting for .*Sutrisno.* to sign/).first()).toBeVisible();
  });

  test("RA2: only the named signatory signs, the wrong password is refused, then the certificate is published", async ({ page }) => {
    await signIn(page, "bambang@sgsi.co.id");
    await page.goto(coaUrl);
    await expect(page.getByText(/asks you to sign this certificate/)).toBeVisible();
    await page.locator("#coa-sign").click();
    await page.locator("#coa-password").fill("not-the-password");
    await page.locator("#coa-sign-ok").click();
    await expect(page.getByText("The password is not correct.")).toBeVisible();
    await page.locator("#coa-password").fill(PW);
    await page.locator("#coa-sign-ok").click();
    await expect(page.getByText("Certificate signed and published").first()).toBeVisible();
    await expect(page.getByText("Published", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(new RegExp(`CoA-${order}-1`)).first()).toBeVisible();
  });

  test("RA3: the job order card shows the published certificate, the CSO sees it too", async ({ page }) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/orders/${order}/coa`);
    await expect(page.locator("#coa-no")).toContainText(`CoA-${order}-1`);
    await expect(page.getByText("Not sent to the client yet")).toBeVisible();
    await page.locator("#coa-open").click();
    await expect(page).toHaveURL(/\/reports\/coa\//);
    await expect(page.locator("#coa-download")).toBeVisible();
    await expect(page.getByText("Verify code")).toBeVisible();
  });
});
