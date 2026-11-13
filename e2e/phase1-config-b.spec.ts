// Phase 1, Configuration slice B (Configuration_Slice_B_Plan.md) at 1440, 834 and 390: Services (add, new version, archive), Methods and
// standards (add a method in an empty cell), Report templates (draft, fields, live preview, delete). The phone edits too: a tapped row
// opens the form as a bottom sheet, a template version opens the editor. Test values start with ZE and are removed afterwards.
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

test.describe.serial("configuration slice B", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });

  test("services: add one, save a new version, archive it", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/services");
    await expect(page.getByText("TM + Prox + TS + CV").first()).toBeVisible();
    if (info.project.name === "phone") {
      // the phone lists tappable rows, has Add service, and a tapped row opens the form (Nov 13 2026)
      await expect(page.locator(".lrow").first()).toBeVisible();
      await expect(page.locator("#add-service")).toBeVisible();
      await page.locator(".lrow", { hasText: "Prox only" }).click();
      await expect(page.getByRole("dialog", { name: "Edit service" })).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      return;
    }
    await page.locator("#add-service").click();
    await page.locator("#svc-name").fill("ZE Check service");
    await page.getByRole("dialog").getByRole("button", { name: "TM", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "VM", exact: true }).click();
    await expect(page.getByText("Parameters (2 selected)")).toBeVisible();
    await page.locator("#svc-save").click();
    const row = page.locator("tr", { hasText: "ZE Check service" });
    await expect(row).toBeVisible();
    await expect(row.getByText("2 parameters")).toBeVisible();
    await row.getByRole("button", { name: /More for ZE Check service/ }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.locator("#svc-save")).toHaveText("Save as version 2");
    await page.getByRole("dialog").getByRole("button", { name: "IM", exact: true }).click();
    await page.locator("#svc-save").click();
    await expect(page.locator("tr", { hasText: "ZE Check service" }).getByText("3 parameters")).toBeVisible();
    if (info.project.name === "desktop") await expect(page.locator("tr", { hasText: "ZE Check service" }).getByText("v2")).toBeVisible();
    await page.locator("tr", { hasText: "ZE Check service" }).getByRole("button", { name: /More for ZE Check service/ }).click();
    await page.getByRole("menuitem", { name: "Archive" }).click();
    await expect(page.locator("tr", { hasText: "ZE Check service" })).toHaveCount(0);
    await page.getByRole("button", { name: /^Archived/ }).click();
    await expect(page.locator("tr", { hasText: "ZE Check service" })).toHaveCount(2);
  });

  test("methods: add an ISO method where Total moisture has none", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/methods");
    await expect(page.getByText("D3174-23").first()).toBeVisible();
    if (info.project.name === "phone") {
      await expect(page.locator(".pager.compact")).toContainText("1 /");
      await expect(page.locator("#add-method")).toHaveText("Add");
      await page.locator(".lrow").first().click();
      await expect(page.getByRole("dialog", { name: /TM/ })).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      return;
    }
    await expect(page.getByText(/^Showing 1–10 of \d+$/)).toBeVisible();
    await page.getByRole("button", { name: "Add ISO method for TM" }).click();
    await page.locator("#me-code").fill("ZE1");
    await page.locator("#me-edition").fill("2098");
    await page.locator("#me-save").click();
    await expect(page.getByText("ISO ZE1:2098")).toBeVisible();
  });

  test("report templates: a draft, its fields and the live preview, then delete it", async ({ page }, info) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/config/templates");
    await expect(page.getByText("House CoA template")).toBeVisible();
    await expect(page.getByText("Active", { exact: true }).first()).toBeVisible();
    if (info.project.name === "phone") {
      await expect(page.locator("#new-version")).toBeVisible();
      await page.locator(".lrow", { hasText: "Active" }).click();
      await expect(page.getByText(/^Version \d+ \(active\)/)).toBeVisible();
      await page.getByRole("button", { name: "All versions" }).click();
      await expect(page.locator(".lrow").first()).toBeVisible();
      return;
    }
    await page.locator("#new-version").click();
    await expect(page.getByText(/^Version \d+ \(draft\)/)).toBeVisible();
    await page.locator("#tp-note").fill("ZE note");
    await page.locator("#tp-statement").fill("ZE statement for the preview.");
    await expect(page.locator(".coa").getByText("ZE statement for the preview.")).toBeVisible();
    await page.locator("#tp-save").click();
    await expect(page.getByText("Draft saved")).toBeVisible();
    await page.getByRole("button", { name: "All versions" }).click();
    const row = page.locator("tr", { hasText: "Draft" });   // the Note column is hidden on the tablet
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: /More for version/ }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.locator(".dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.locator("tr", { hasText: "Draft" })).toHaveCount(0);
  });

  test("a lab admin cannot open the new sections", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/config/services");
    await expect(page.getByText("ZE Check service")).toHaveCount(0);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
