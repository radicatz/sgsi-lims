// Phase 1, Configuration slice A (Admin plan section 6) at 1440, 834 and 390: the hub, Security save and restore, Lookups add,
// Parameters and rules dialogs with their checks, Laboratory branches and numbering, Formulas, search, and access.
// Layouts per the FigCraft frames *-14-Configuration-*: the phone edits too (list rows open a bottom sheet; Laboratory and Security
// show a read view whose rows open an edit page).
// Test values start with ZE and are removed afterwards.
import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(PW);
  await page.locator("#si-submit").click();
  await expect(page.locator(".frame")).toBeVisible();
}
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });

test.describe.serial("configuration", () => {
  test.afterAll(() => { cleanup(); });

  test("the hub lists the sections and opens one", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config");
    await expect(page.locator(".mcard", { hasText: "Validation rules" })).toBeVisible();
    if (info.project.name === "desktop") await expect(page.locator(".cfg-side").getByText("Sections", { exact: true })).toBeVisible();
    else await expect(page.locator(".cfg-next")).toContainText("Field definitions");
    await page.locator(".mcard", { hasText: "Lockout, sign-out" }).click();
    if (phone) {
      await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Configuration" })).toBeVisible();
      await expect(page.locator(".lrow", { hasText: "Lock after failed attempts" })).toContainText("5");
    } else await expect(page.locator("#sec-lock")).toHaveValue("5");
  });

  test("security: save a new lock count, then restore the defaults", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    // the phone opens the edit page from a row of the read view
    const edit = async () => {
      if (!phone) return;
      await page.locator(".lrow", { hasText: "Lock after failed attempts" }).click();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Edit", { exact: true })).toBeVisible();
    };
    const lock = async (n: string) => {
      if (phone) await expect(page.locator(".lrow", { hasText: "Lock after failed attempts" })).toContainText(n);
      else await expect(page.locator("#sec-lock")).toHaveValue(n);
    };
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/security");
    await edit();
    await page.locator("#sec-lock").fill("6");
    await page.locator("#save-security").click();
    await expect(page.getByText("Security saved")).toBeVisible();
    await page.reload();
    await lock("6");
    await edit();
    await page.locator("#sec-lock").fill("2");
    await page.locator("#save-security").click();
    await expect(page.getByText("At least 3 attempts.")).toBeVisible();
    await page.getByRole("button", { name: "Restore defaults" }).click();
    await page.locator("#save-security").click();
    await expect(page.getByText("Security saved").last()).toBeVisible();
    await page.reload();
    await lock("5");
  });

  test("lookups: tabs per list, add a hold reason", async ({ page }, info) => {
    const value = `ZE ${info.project.name} ${Date.now() % 100000}`;
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/lookups");
    await page.getByRole("tab", { name: /^Hold reasons/ }).click();
    await page.locator("#add-hold_reason").click();
    await page.locator("#lk-value").fill(value);
    await page.locator("#lk-save").click();
    await expect(page.locator(info.project.name === "phone" ? ".lrow" : "tr", { hasText: value })).toBeVisible();
  });

  test("rules: fixed rules show a lock; on the phone a tapped row opens the form", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/rules");
    const row = (code: string) => page.locator(info.project.name === "phone" ? ".lrow" : "tr", { hasText: code });
    await expect(row("V-12").getByLabel("Fixed")).toBeVisible();
    if (info.project.name === "phone") await row("V-31").click();
    else await row("V-31").getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("dialog", { name: "Edit V-31" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("parameters: the dialog checks its values", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "read-only on the phone");
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/parameters");
    await page.locator("#pa-q").fill("ASH");
    await page.locator("tr", { hasText: "Ash" }).first().getByRole("button", { name: "Edit" }).click();
    await page.locator("#pa-lo").fill("50");
    await page.locator("#pa-hi").fill("10");
    await page.locator("#pa-save").click();
    await expect(page.getByText("The low end must be below the high end.")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("parameters: one card, 10 rows a page, add a parameter; on the phone a tapped row opens the form", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/parameters");
    if (info.project.name === "phone") {
      const rows = page.locator(".lrow");
      await expect(rows).toHaveCount(10);
      await expect(page.locator(".pager.compact")).toContainText("1 /");
      await expect(page.locator("#add-param")).toBeVisible();
      const chips = page.locator(".chips.scroll");
      expect(await chips.evaluate((c) => c.scrollWidth > c.clientWidth && getComputedStyle(c).flexWrap === "nowrap")).toBe(true);
      await page.locator("#pa-q").fill("moisture");
      await expect(rows.first()).toContainText("moisture");
      await page.locator("#pa-q").fill("");
      await rows.first().click();
      await expect(page.getByRole("dialog", { name: /^Edit / })).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      return;
    }
    await expect(page.locator("tbody tr")).toHaveCount(10);
    await expect(page.getByText(/^Showing 1–10 of \d+$/)).toBeVisible();
    const code = info.project.name === "tablet" ? "ZE-T1" : "ZE-D1";
    await page.locator("#add-param").click();
    await page.locator("#pa-save").click();
    await expect(page.getByText("Enter the code.")).toBeVisible();
    await page.locator("#pa-code").fill(code);
    await page.locator("#pa-label").fill(code);
    await page.locator("#pa-name").fill("ZE test parameter");
    await page.locator("#pa-save").click();
    await page.locator("#pa-q").fill(code);
    await expect(page.locator("tr", { hasText: code })).toBeVisible();
  });

  test("laboratory: branch offices and a numbering check, one Save for the page", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/laboratory");
    if (info.project.name === "phone") {
      await expect(page.locator(".lrow", { hasText: "Rapak Indah" })).toContainText("RI");
      await page.locator(".lrow", { hasText: "Batch" }).click();
      await expect(page.getByRole("heading", { name: "Laboratory", level: 1 })).toBeVisible();
    }
    await expect(page.getByLabel("Office 1")).toHaveValue("Rapak Indah");
    await page.locator("#num-batch").fill("B-{XYZ}-{NNNN}");
    await page.locator("#save-laboratory").click();
    await expect(page.getByText("Use only the listed tokens.")).toBeVisible();
  });

  test("formulas are view only, and search groups its results by section", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/formulas");
    await expect(page.getByText("100 - IM - ASH - VM")).toBeVisible();
    await expect(page.getByText("FC (ADB)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    test.skip(info.project.name === "phone", "search sits in the desktop and tablet header");
    await page.goto("/config");
    await page.locator("#cfg-q").fill("ash");
    await expect(page.getByText(/^\d+ results for "ash" in \d+ sections$/)).toBeVisible();
    await expect(page.locator(".card", { hasText: "Methods and standards" }).locator(".lrow").first()).toBeVisible();
    await page.locator(".lrow", { hasText: "Proximate" }).first().click();
    await expect(page).toHaveURL(/\/config\/parameters$/);
  });

  test("a lab admin has no access to Configuration", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/config/security");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
