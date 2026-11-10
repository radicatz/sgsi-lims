// Phase 0 gate: every persona signs in and sees their own sidebar, start page and No access (Navigation plan 2 and 4),
// at 1440, 834 and 390. Prototype flows AP1, AP2 (wrong password), AP8 (No access).
import { expect, test, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const PEOPLE = [
  { email: "wahyu@sgsi.co.id", name: "Wahyu Pratama", items: 12, start: "/", noAccess: "/work" },
  { email: "maya@sgsi.co.id", name: "Maya Lestari, A.Md.", items: 10, start: "/work", noAccess: "/users" },
  { email: "hendra@sgsi.co.id", name: "Hendra Wijaya, S.T.", items: 9, start: "/", noAccess: "/clients" },
  { email: "bambang@sgsi.co.id", name: "Ir. Bambang Sutrisno, M.T.", items: 10, start: "/", noAccess: "/config" },
  { email: "rina@sgsi.co.id", name: "Rina Kartika, S.E.", items: 7, start: "/work", noAccess: "/users" },
  { email: "dedi@sgsi.co.id", name: "Dedi Kurniawan", items: 5, start: "/work", noAccess: "/reports" },
  { email: "fitri@sgsi.co.id", name: "Fitri Handayani, S.Si.", items: 6, start: "/work", noAccess: "/clients" },
];

async function signIn(page: Page, email: string, password = PW) {
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(password);
  await page.locator("#si-submit").click();
}
async function expectSidebar(page: Page, phone: boolean, items: number) {
  if (phone) await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Main" }).last().locator("a.nav")).toHaveCount(items);   // waits for the shell to load
}

for (const p of PEOPLE) {
  test(`${p.email} signs in to their own sidebar`, async ({ page }, info) => {
    await signIn(page, p.email);
    await expect(page).toHaveURL(new RegExp(p.start === "/" ? "/$" : p.start + "$"));
    const phone = info.project.name === "phone";
    await expectSidebar(page, phone, p.items);
    if (phone) await page.keyboard.press("Escape");
    await page.goto(p.noAccess);
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
}

test("a wrong password shows the error and no session", async ({ page }) => {
  await signIn(page, "fitri@sgsi.co.id", "not-the-password-1");
  await expect(page.getByText("The email or password is not correct.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("sign out returns to Sign in", async ({ page }, info) => {
  await signIn(page, "maya@sgsi.co.id");
  await expect(page).toHaveURL(/\/work$/);
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({ path: `test-results/phase0-signin-${info.project.name}.png` });
});

test("shell screenshot for review", async ({ page }, info) => {
  await signIn(page, "maya@sgsi.co.id");
  await expect(page.getByText("My work is built in phase 5")).toBeVisible();
  await page.screenshot({ path: `test-results/phase0-shell-${info.project.name}.png` });
});
