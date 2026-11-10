// Phase 1, Users (Admin plan module 13) at 1440, 834 and 390: invite, edit roles, resend, deactivate and reactivate, the Roles tab,
// and the last-Superadmin rule. Test accounts are zt-*@sgsi.co.id and are removed afterwards.
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

test.describe.serial("users", () => {
  const stamp = String(Date.now()).slice(-7);
  let name = "", email = "";
  test.beforeAll(({}, info) => { const n = info.project.name[0]!; name = `Zeta E2E ${n}${stamp}`; email = `zt-e2e-${n}${stamp}@sgsi.co.id`; });
  test.afterAll(() => { cleanup(); });

  test("superadmin invites a user and gets the link", async ({ page }) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/users");
    await page.locator("#add-user").click();
    await page.locator("#us-name").fill(name);
    await page.locator("#us-email").fill(email);
    await page.getByRole("dialog").getByText("Analyst", { exact: true }).click();
    await page.locator("#us-save").click();
    await expect(page.getByRole("dialog", { name: "Invite created" })).toBeVisible();
    await expect(page.locator("#lk")).toHaveValue(/^https:\/\/.+/);
    await page.getByRole("button", { name: "Done" }).click();
    await page.locator("#us-q").fill(email);
    await expect(page.getByText(name).first()).toBeVisible();
    await expect(page.getByText("Invited").first()).toBeVisible();
  });

  test("a duplicate email is refused on the field", async ({ page }) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/users");
    await page.locator("#add-user").click();
    await page.locator("#us-name").fill("Someone Else");
    await page.locator("#us-email").fill(email);
    await page.getByRole("dialog").getByText("Analyst", { exact: true }).click();
    await page.locator("#us-save").click();
    await expect(page.getByText(`${email} already has an account.`)).toBeVisible();
  });

  test("the user page: edit roles, resend the invite, deactivate and reactivate", async ({ page }) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/users");
    await page.locator("#us-q").fill(email);
    await page.getByText(name).first().click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await page.locator("#edit-user").click();
    await page.getByRole("dialog").getByText("Preparation", { exact: true }).click();
    await page.locator("#us-save").click();
    await expect(page.locator(".role", { hasText: "Preparation" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Resend invite" }).click();
    await expect(page.getByRole("dialog", { name: "New invite link" })).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "More for this user" }).click();
    await page.getByRole("menuitem", { name: "Deactivate" }).click();
    await page.locator("#deact-ok").click();
    await expect(page.locator(".badge", { hasText: "Inactive" })).toBeVisible();
    await page.getByRole("button", { name: "More for this user" }).click();
    await page.getByRole("menuitem", { name: "Reactivate" }).click();
    await expect(page.locator(".badge", { hasText: "Invited" })).toBeVisible();
  });

  test("the Roles tab shows the permission grid", async ({ page }) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/users");
    await page.getByRole("tab", { name: "Roles" }).click();
    await expect(page.getByText("Roles are fixed in v1")).toBeVisible();
    await expect(page.getByText("Add, edit and deactivate accounts")).toBeVisible();
  });

  test("the only Superadmin cannot be deactivated", async ({ page }) => {
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto("/users");
    await page.locator("#us-q").fill("wahyu@");
    await page.locator("tr, .mcard").filter({ hasText: "wahyu@sgsi.co.id" }).first().click();
    await page.getByRole("button", { name: "More for this user" }).click();
    await page.getByRole("menuitem", { name: "Deactivate" }).click();
    await page.locator("#deact-ok").click();
    await expect(page.getByText("There must be at least one active Superadmin.")).toBeVisible();
    await expect(page.locator("#deact-ok")).toBeDisabled();
  });

  test("a lab admin has no access to Users", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/users");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
