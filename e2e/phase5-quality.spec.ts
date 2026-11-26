// Phase 5, slice C1 (Phase5_Build_Design.md 12.9: QA1, QA2) at 1440, 834 and 390: the Dashboard's Quality & reports tab for the roles that have it (Lab admin, Supervisor; the CSO has no tab and the API
// refuses her), its KPIs, the three scatters with R² and n, the Trend CV basis switch, and the Drill holes card (Missing CoA, search, Upload CoA only for people who may upload).
// Needs `pnpm seed:master`, `seed:demo`, `seed:batches`, `seed:reports` and `seed:quality` (RD values for the completed demo batches).
import { expect, test, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
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
/** The period is a select on the page; on the phone it is in the Filters sheet. */
async function period(page: Page, phone: boolean, value: string) {
  if (phone) {
    await page.locator("#db-filters").click();
    await page.getByRole("dialog").locator("#db-period").selectOption(value);
    await page.getByRole("button", { name: "Apply" }).click();
  } else await page.locator("#db-period").selectOption(value);
}
const quality = (page: Page) => page.getByRole("tab", { name: "Quality & reports" });

test.describe("dashboard, quality and reports", () => {
  test("QA1: both tabs for the Lab admin; KPIs, three scatters with R² and n, Trend CV on four bases", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Operations" })).toHaveAttribute("aria-selected", "true");
    await quality(page).click();
    await expect(page).toHaveURL(/tab=quality/);
    await period(page, phone, "this_year");
    await expect(page.locator("#qa-kpis")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#qa-completed")).toContainText("Batches completed");
    await expect(page.locator("#qa-coverage")).toContainText(/\d+ of \d+/, { timeout: 30_000 });
    await expect(page.locator("#qa-det")).toContainText("Determinations");
    for (const id of ["cv-ash", "rd-ash", "fc-gcv"]) await expect(page.locator(`#sc-${id}-fit`)).toContainText(/R² \d\.\d\d, n \d+/, { timeout: 30_000 });
    // a tooltip on a point of the first scatter
    await page.locator("#qa-scatters svg").first().locator("circle").first().hover({ force: true });
    await expect(page.locator(".sc-tip").first()).toContainText("CV (ADB)");
    // the trend opens on AR and switches basis
    await expect(page.locator("#tr-note")).toContainText("AR basis");
    await page.getByRole("group", { name: "Basis" }).getByRole("button", { name: "DAF" }).click();
    await expect(page.locator("#tr-note")).toContainText("DAF basis");
    // a reload keeps the tab
    await page.reload();
    await expect(quality(page)).toHaveAttribute("aria-selected", "true");
  });

  test("QA1b: the CSO has no tab switch and the API refuses her", async ({ page, request }) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/?tab=quality");
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0);
    const tok = ((await (await request.post("http://localhost:4000/api/auth/sign-in", { data: { email: "rina@sgsi.co.id", password: PW } })).json()) as { accessToken: string }).accessToken;
    expect((await request.get("http://localhost:4000/api/dashboard/quality", { headers: { authorization: `Bearer ${tok}` } })).status()).toBe(403);
  });

  test("QA2: Drill holes filters to Missing CoA, searches and offers Upload CoA only to people who may", async ({ page }, info) => {
    const phone = info.project.name === "phone", tablet = info.project.name === "tablet";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/?tab=quality");
    await period(page, phone, "this_year");
    const body = page.locator(phone ? "#dh-cards" : "#dh-table");
    await expect(body).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[id^="dh-up-"]').first()).toBeVisible();                      // Lab admin may upload
    const all = await page.getByRole("button", { name: /^All \d+/ }).last().innerText();
    await page.getByRole("button", { name: /^Missing CoA \d+/ }).click();
    await expect(page.locator(phone ? "#dh-cards .scard" : "#dh-table tbody tr").first()).toContainText("CoA missing", { timeout: 20_000 });
    await expect(page.getByText("CoA uploaded")).toHaveCount(0, { timeout: 20_000 });
    await page.getByRole("button", { name: /^All \d+/ }).last().click();
    await page.locator("#dh-q").fill("DH-BNM-02");
    await expect(page.locator(phone ? "#dh-cards .scard" : "#dh-table tbody tr").first()).toContainText("DH-BNM-02", { timeout: 20_000 });
    expect(all).toMatch(/\d+/);
    if (!tablet && !phone) await expect(page.locator("#dh-table th", { hasText: "Company" })).toBeVisible();
    if (tablet) await expect(page.locator("#dh-table th", { hasText: "Company" })).toHaveCount(0);
    // the Supervisor sees the tab and the table but no Upload CoA
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/?tab=quality");
    await period(page, phone, "this_year");
    await expect(body).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[id^="dh-up-"]')).toHaveCount(0);
  });
});
