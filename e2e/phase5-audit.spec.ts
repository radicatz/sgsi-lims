// Phase 5, slice C2 (Phase5_Build_Design.md 12.9: AU1, AU2) at 1440, 834 and 390: the Supervisor reads the Audit log, filters it, opens a row's before and after, downloads the CSV,
// and the export shows up as an Exported row; the Audit link on Sample history opens the log on that sample (its results included) with a removable chip; the Lab admin has no
// access and no link. Needs `pnpm seed:master`, `seed:demo`, `seed:batches` and `seed:reports` (the sample of phase5-search).
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });
/** The demo samples were seeded without audit rows, so the sample for the link is made through the API (its creation and one edit are audited). Returns its id and client reference. */
async function seedSample(request: APIRequestContext, no: string): Promise<{ id: string; ref: string }> {
  const token = ((await (await request.post(`${API}/auth/sign-in`, { data: { email: "rina@sgsi.co.id", password: PW } })).json()) as { accessToken: string }).accessToken;
  const h = { authorization: `Bearer ${token}` };
  const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
  const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
  expect((await request.post(`${API}/orders`, { headers: h, data: { orderNo: no, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE audit ${no}`, standards: ["ASTM"],
    parameterIds: ["PREP", "TM", "IM", "ASH"].map(pid), expectedSamples: 1, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } })).status()).toBe(201);
  expect((await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: [{ clientRef: "ZE-AU1", description: "Ply A" }], removed: [] } })).status()).toBe(200);
  const one = async () => ((await (await request.get(`${API}/orders/${no}/samples`, { headers: h })).json()) as { items: Array<{ id: string; clientRef: string }> }).items[0]!;
  const s = await one();
  expect((await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: [{ id: s.id, clientRef: "ZE-AU1", description: "Ply A edited", plyComp: "ply" }], removed: [] } })).status()).toBe(200);
  return { id: s.id, ref: s.clientRef };
}
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
/** A filter is a select on the page; on the phone it is in the Filters sheet. */
async function pick(page: Page, phone: boolean, id: string, label: string) {
  if (phone) {
    await page.locator("#au-filters").click();
    await page.getByRole("dialog").locator(`#${id}`).selectOption({ label });
    await page.getByRole("button", { name: "Done" }).click();
  } else await page.locator(`#${id}`).selectOption({ label });
}
const rowsOf = (page: Page, phone: boolean) => (phone ? page.locator("#au-cards .hcard") : page.locator("#au-table tbody tr:not(.xrow)"));

test.describe.serial("audit log", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });
  test("AU1: filter, open a row, export CSV and see the export logged", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/audit");
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
    await expect(rowsOf(page, phone).first()).toBeVisible({ timeout: 30_000 });
    // record type and action filters
    await pick(page, phone, "au-type", "Result");
    await expect(rowsOf(page, phone).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(phone ? "#au-cards" : "#au-table")).toContainText("Result");
    await pick(page, phone, "au-type", "All types");
    await pick(page, phone, "au-action", "Signed in");
    await expect(rowsOf(page, phone).first()).toContainText("Sign-in", { timeout: 30_000 });
    await pick(page, phone, "au-action", "All actions");
    // a row with changes opens its before and after
    await pick(page, phone, "au-type", "Sample");
    await pick(page, phone, "au-action", "Updated");
    await expect(rowsOf(page, phone).first()).toBeVisible({ timeout: 30_000 });
    const first = phone ? page.locator("#au-cards .hcard[aria-expanded]").first() : page.locator("#au-table tr.click").first();   // a row that has changes to show
    await expect(first).toBeVisible({ timeout: 30_000 });
    await (phone ? first.locator("b").first() : first.locator("td").last()).click();   // not the record link in the middle of the row
    if (phone) await expect(page.locator("#au-cards .hist-x").first()).toBeVisible();
    else { await expect(page.locator(".hist-grid").first()).toContainText("Field"); await expect(page.locator(".hist-grid").first()).toContainText("Before"); }
    await pick(page, phone, "au-type", "All types");
    await pick(page, phone, "au-action", "All actions");
    // export, then the Exported row
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#au-export").click()]);
    expect(dl.suggestedFilename()).toBe("audit-log.csv");
    await pick(page, phone, "au-action", "Exported");
    await expect(rowsOf(page, phone).first()).toContainText("Audit log", { timeout: 30_000 });
    if (info.project.name !== "tablet") await expect(rowsOf(page, phone).first()).toContainText("Hendra");   // the tablet keeps the user in the open block
  });

  test("AU2: the Audit link on Sample history opens the log on that sample; a Lab admin has no access", async ({ page, request }, info) => {
    const phone = info.project.name === "phone";
    const made = await seedSample(request, `ZE-JO-05${["desktop", "tablet", "phone"].indexOf(info.project.name)}`);
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto(`/samples/${made.id}/history`);
    await expect(page.locator("#sh-list")).toBeVisible({ timeout: 30_000 });
    await page.locator(".sh-audit").first().click();
    await expect(page).toHaveURL(/\/audit\?record=/);
    await expect(page.locator('#au-chips [data-chip="record"]')).toContainText(made.ref, { timeout: 30_000 });
    await expect(rowsOf(page, phone).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(phone ? "#au-cards" : "#au-table")).toContainText("Sample");
    await page.locator("#au-clear").click();
    await expect(page.locator("#au-chips")).toHaveCount(0);
    // a Lab admin: no link on the history, and the page says no access
    await signIn(page, "maya@sgsi.co.id");
    await page.goto(`/samples/${made.id}/history`);
    await expect(page.locator("#sh-list")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".sh-audit")).toHaveCount(0);
    await page.goto("/audit");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
