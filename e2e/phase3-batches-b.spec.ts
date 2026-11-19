// Phase 3, slice B (Batch_Build_Design.md section 15; prototype flows BA4 to BA6) at 1440, 834 and 390: ADL and Finish Preparation, the analysis values with a
// range warning and Finish Analysis, the signed RoA and Complete batch, the CSO reading a completed batch, and the bell (panel on desktop and tablet, page on the phone).
// Test values start with ZE and are removed afterwards. Needs `pnpm seed:orders` and `pnpm seed:batches`.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
const PDF = Buffer.from(["%PDF-1.4", "1 0 obj<</Type/Catalog>>endobj", "trailer<</Root 1 0 R>>", "%%EOF", ""].join("\n"));
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
const fixture = (order: string, batch: string, state: string) => execSync(`npx tsx --env-file=../../.env scripts/test-fixture-b.ts ${order} ${batch} ${state}`, { cwd: "apps/api", stdio: "pipe" });

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

test.describe.serial("batches, slice B", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });
  let batch = "", roa = "";

  test("BA4: the Preparation team enters the ADL, sees the warning, saves and finishes preparation", async ({ page, request }, info) => {
    const phone = info.project.name === "phone", idx = ["desktop", "tablet", "phone"].indexOf(info.project.name);
    const order = `ZE-JO-04${idx}`;
    batch = `B-2026-980${idx + 1}`; roa = `RoA-ZE-${idx + 1}`;
    await seedOrder(request, order);
    fixture(order, batch, "preparation");
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto(`/batches/${batch}/preparation`);
    await expect(page.getByText("0 of 2 saved").first()).toBeVisible();
    await expect(page.locator("#adl-finish")).toBeDisabled();
    const a1 = page.getByLabel("ADL in %, ZE-A1"), a2 = page.getByLabel("ADL in %, ZE-A2");
    await a1.fill("25");
    await expect(page.locator(".vcell.warn")).toHaveCount(1);       // above the typical range of 20
    await a1.fill("8,42");
    await a2.fill("9.1");
    await expect(page.locator(".vcell.dirty")).toHaveCount(2);
    await page.locator("#adl-save").click();
    await expect(page.getByText("ADL saved").first()).toBeVisible();
    await expect(page.getByText("2 of 2 saved").first()).toBeVisible();
    await expect(page.locator("#adl-finish")).toBeEnabled();
    await page.locator("#adl-finish").click();
    await dlgConfirm(page, "Finish Preparation");
    await expect(page.locator("#ready-analysis")).toBeVisible();
    await expect(page.locator(".vcell.locked").first()).toBeVisible();
    if (!phone) await expect(page.getByText("Prep finished").first()).toBeVisible();
  });

  test("BA5: the analyst enters the values, a range warning shows, Save all and Finish Analysis", async ({ page }) => {
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto(`/batches/${batch}/analysis`);
    await expect(page.locator("#an-progress")).toContainText("0 of 12 values saved");
    await expect(page.locator("#an-finish")).toBeDisabled();
    const set = async (name: string, ref: string, v: string) => page.getByLabel(`${name}, ${ref}`, { exact: true }).fill(v);
    for (const ref of ["ZE-A1", "ZE-A2"]) {
      await set("TM in % ar", ref, "14.50"); await set("IM in % adb", ref, "9.10"); await set("VM in % adb", ref, "40.20");
      await set("TS in % adb", ref, "0.55");
      await set("Ash in % adb", ref, ref === "ZE-A1" ? "47,30" : "8.50");
      await set("GCV in kcal/kg adb", ref, ref === "ZE-A1" ? "2310" : "5600");
    }
    await expect(page.locator(".vcell.warn")).toHaveCount(2);        // Ash 47.3 and GCV 2310 of ZE-A1
    await expect(page.locator("#an-progress")).toContainText("12 of 12");
    await page.locator("#an-save").click();
    await expect(page.getByText("Values saved").first()).toBeVisible();
    await expect(page.getByLabel("Before you can finish analysis")).toContainText("ZE-A1 has Ash and GCV outside the typical range");
    await expect(page.locator(".vcell.calc").first()).toContainText(/\d/);           // FC is calculated
    await expect(page.locator("#an-finish")).toBeEnabled();
    await page.locator("#an-finish").click();
    await dlgConfirm(page, "Finish Analysis");
    await expect(page.getByText("Analysis finished").first()).toBeVisible();
    await expect(page.locator(".vcell.locked").first()).toBeVisible();
  });

  test("BA5: the Lab admin uploads the signed RoA and completes the batch", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto(`/batches/${batch}/analysis`);
    await expect(page.locator("#batch-complete")).toBeDisabled();
    await page.locator("#roa-upload").click();
    await expect(page.getByText("Enter the RoA number.")).toBeVisible();
    await page.locator("#roa-number").fill(roa);
    await page.locator("#roa-file").setInputFiles({ name: `${roa}.pdf`, mimeType: "application/pdf", buffer: PDF });
    await page.locator("#roa-upload").click();
    await expect(page.locator("#roa-no")).toHaveText(roa);
    await expect(page.locator("#batch-complete")).toBeEnabled();
    await page.locator("#batch-complete").click();
    await dlgConfirm(page, "Complete batch");
    await expect(page.locator("#roa-done")).toContainText("The batch is complete. Every tab is read-only.");
    await expect(page.locator("#roa-download")).toBeVisible();
    await expect(page.locator("#an-save")).toHaveCount(0);
  });

  test("BA6: the CSO reads the completed batch: the RoA number, no values, no download", async ({ page }) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/batches/${batch}/analysis`);
    await expect(page.locator("#roa-no")).toHaveText(roa);
    await expect(page.locator("#roa-download")).toHaveCount(0);
    await expect(page.getByText("The values are for the lab")).toBeVisible();
    await expect(page.locator("#an-progress")).toContainText("12 of 12 values saved");
    await page.goto(`/batches/${batch}/preparation`);
    await expect(page.locator("#adl-progress")).toContainText("2 of 2 ADL saved");
    await expect(page.locator("input.cell")).toHaveCount(0);
  });

  test("the bell: the panel on desktop and tablet, the page on the phone; open an item and Mark all read", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/");
    const bell = page.getByRole("button", { name: /^Notifications/ });
    await expect(bell).toBeVisible();
    await bell.click();
    if (phone) await expect(page).toHaveURL(/\/notifications$/);
    else {
      await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
      await page.locator("#notes-seeall").click();
      await expect(page).toHaveURL(/\/notifications$/);
    }
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByText(`${batch} analysis is finished`)).toBeVisible();
    await page.getByText(`${batch} analysis is finished`).click();
    await expect(page).toHaveURL(new RegExp(`/batches/${batch}/analysis`));
    await page.goto("/notifications");
    await page.getByRole("tab", { name: /^Unread/ }).click();
    const ready = page.locator("#notes-readall:enabled"), empty = page.getByText("You're all caught up").first();
    await expect(ready.or(empty)).toBeVisible();
    if (await ready.count()) await ready.click();
    await expect(empty).toBeVisible();
    await expect(page.locator("#notes-readall")).toBeDisabled();
  });
});

/** The confirm dialog every step asks: click its main button. */
async function dlgConfirm(page: Page, label: string) {
  const d = page.getByRole("dialog").last();
  await d.getByRole("button", { name: label }).click();
}
