// Phase 1, Configuration slice A (Admin plan section 6) at 1440, 834 and 390: the hub, Security save and restore, Lookups add,
// Parameters and rules dialogs with their checks, Laboratory branches and numbering, Formulas, search, and access.
// Editing is on desktop and tablet; the phone shows read-only lists. Test values start with ZE and are removed afterwards.
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
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config");
    if (info.project.name === "phone") {
      await page.getByRole("link", { name: /^Security/ }).click();
      await expect(page.getByRole("link", { name: "All sections" })).toBeVisible();
    } else {
      await expect(page.locator(".mcard", { hasText: "Validation rules" })).toBeVisible();
      await page.locator(".mcard", { hasText: "Security" }).click();
    }
    await expect(page.locator("#sec-lock")).toHaveValue("5");
  });

  test("security: save a new lock count, then restore the defaults", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "read-only on the phone");
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/security");
    await page.locator("#sec-lock").fill("6");
    await page.locator("#save-security").click();
    await expect(page.getByText("Security saved")).toBeVisible();
    await page.reload();
    await expect(page.locator("#sec-lock")).toHaveValue("6");
    await page.locator("#sec-lock").fill("2");
    await page.locator("#save-security").click();
    await expect(page.getByText("At least 3 attempts.")).toBeVisible();
    await page.getByRole("button", { name: "Restore defaults" }).click();
    await page.locator("#save-security").click();
    await expect(page.getByText("Security saved").last()).toBeVisible();
    await page.reload();
    await expect(page.locator("#sec-lock")).toHaveValue("5");
  });

  test("lookups: add a hold reason", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "read-only on the phone");
    const value = `ZE ${info.project.name} ${Date.now() % 100000}`;
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/lookups");
    await page.locator("#add-hold_reason").click();
    await page.locator("#lk-value").fill(value);
    await page.locator("#lk-save").click();
    await expect(page.locator("tr", { hasText: value })).toBeVisible();
  });

  test("parameters and rules: the dialogs check their values", async ({ page }, info) => {
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
    await page.goto("/config/rules");
    await expect(page.locator("tr", { hasText: "V-12" }).getByText("Fixed", { exact: true })).toBeVisible();
    await page.locator("tr", { hasText: "V-31" }).getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("dialog", { name: "Edit V-31" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("laboratory: branch offices and a numbering check", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/laboratory");
    await expect(page.getByLabel("Office 1")).toHaveValue("Rapak Indah");
    test.skip(info.project.name === "phone", "read-only on the phone");
    await page.locator("#num-batch").fill("B-{XYZ}-{NNNN}");
    await page.locator("#save-numbering").click();
    await expect(page.getByText("Use only the listed tokens.")).toBeVisible();
  });

  test("formulas are view only, and search finds a parameter", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/formulas");
    await expect(page.getByText("100 - IM - ASH - VM")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    test.skip(info.project.name === "phone", "search sits in the desktop and tablet header");
    await page.locator("#cfg-q").fill("ash");
    await expect(page.getByText(/^ASH, /).first()).toBeVisible();
  });

  test("a lab admin has no access to Configuration", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/config/security");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
