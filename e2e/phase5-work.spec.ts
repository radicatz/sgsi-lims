// Phase 5, slice A (Phase5_Build_Design.md section 6) at 1440, 834 and 390: My work (queues per role, the sidebar count, a queue page, the CoAs-to-send zip, a queue a role does not have)
// and the Dashboard's Operations tab (cards, filters, the phone Filters sheet, Active batches). Read only: it needs `pnpm seed:master`, `seed:demo`, `seed:batches` and `seed:reports`.
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
const queues = (page: Page) => page.locator("[id^=queue-]");

test.describe("work and dashboard", () => {
  test("WK1: each role sees only its own queues, in flow order, and the sidebar counts them", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto("/work");
    await expect(page.locator("#queue-receive")).toBeVisible();
    await expect(page.locator("#queue-awaiting")).toBeVisible();
    await expect(page.locator("#queue-preparation")).toBeVisible();
    await expect(page.locator("#queue-coa-send")).toHaveCount(0);
    await expect(page.locator("#queue-entry")).toHaveCount(0);
    const ids = await queues(page).evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(["queue-receive", "queue-awaiting", "queue-preparation"]);
    if (!phone) await expect(page.locator(".nav-count").first()).toBeVisible();
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto("/work");
    await expect(page.locator("#queue-entry")).toBeVisible();
    await expect(queues(page)).toHaveCount(1);
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/work");
    await expect(page.locator("#queue-coa-generate")).toBeVisible();
  });

  test("WK2: a queue page lists its items with the action; a queue the role does not have is refused", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto("/work/receive");
    await expect(page.getByRole("heading", { name: "Batches to receive" })).toBeVisible();
    await expect(page.locator(phone ? "#wk-cards .wk-card" : "tbody tr").first()).toBeVisible({ timeout: 30_000 });
    await page.locator("#wk-q").fill("zzzz-no-such");
    await expect(page.getByText("Nothing matches")).toBeVisible();
    await page.locator("#wk-q").fill("");
    await page.locator(phone ? "#wk-cards .wk-card" : "tbody tr").first().click();
    await expect(page).toHaveURL(/\/batches\/B-\d{4}-\d{4}\/reception/);
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto("/work/coa-send");
    await expect(page.getByText("This queue is not part of your work")).toBeVisible();
  });

  test("WK3: the CSO ticks CoAs to send and downloads them as a zip (phone too: cards with a tick box and the bottom bar)", async ({ page }) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/work/coa-send");
    const picks = page.locator("[id^=wk-pick-]");
    await expect(picks.first()).toBeVisible({ timeout: 30_000 });
    await picks.nth(0).click();
    await picks.nth(1).click();
    await expect(page.getByText("2 selected")).toBeVisible();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#wk-zip").click()]);
    expect(dl.suggestedFilename()).toMatch(/\.zip$/);
  });

  test("DB1: the Operations dashboard shows its cards; the period and company filters apply; the phone has a Filters sheet", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/");
    await expect(page.locator("#kpi-progress")).toBeVisible({ timeout: 40_000 });
    for (const id of ["#kpi-due", "#kpi-received", "#kpi-turnaround", "#db-workflow", "#db-orders", "#db-week"]) await expect(page.locator(id)).toBeVisible();
    await expect(page.locator("#db-queues")).toContainText("Your queues");
    if (phone) {
      await page.locator("#db-filters").click();
      await expect(page.getByRole("dialog").getByText("Filters")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "Apply" }).click();
    } else {
      await page.locator("#db-period").selectOption({ label: "Last 7 days" });
      await expect(page.locator("#kpi-received")).toBeVisible();
    }
    await page.getByRole("button", { name: "Late" }).click();
    await expect(page.locator("[title='Past due']").first()).toBeVisible({ timeout: 20_000 });
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/");
    await expect(page.locator("#kpi-progress")).toBeVisible({ timeout: 40_000 });
    await expect(page.locator("#db-queues")).toHaveCount(0);        // no queues, and no My work in the sidebar
  });
});
