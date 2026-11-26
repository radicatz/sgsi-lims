// Phase 5, slice D (Frames_Coverage_Check_Nov26.md, App_Screen_Plan.md section 3) at 1440, 834 and 390: the sign-in pages to frames
// 00-App-04 to 06 (layout per size, Privacy), a real invite link (inviter, roles, the rules checklist, straight into the app), the plain
// sign-out message, the lock after failed attempts (Sign in off, Reset password), Forgot password with the 60-second resend, a real
// reset link (For email, toast, email pre-filled), expired links, the idle sign-out with return to the page, and the tablet sidebar
// opened over the page. Test accounts are zt-*@sgsi.co.id and are removed afterwards.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
const NEW_PW = "Coal2026sample";
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });
async function token(request: APIRequestContext, email: string, password = PW) {
  const r = await request.post(`${API}/auth/sign-in`, { data: { email, password } });
  return ((await r.json()) as { accessToken: string }).accessToken;
}
async function signIn(page: Page, email: string, password = PW) {
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(password);
  await page.locator("#si-submit").click();
}

test.describe.serial("sign in, links and the tablet sidebar", () => {
  const stamp = String(Date.now()).slice(-7);
  let email = "", id = "";
  test.beforeAll(({}, info) => { email = `zt-auth-${info.project.name[0]}${stamp}@sgsi.co.id`; });
  test.afterAll(() => { cleanup(); });

  test("AD1: each size has its frame layout; Privacy opens", async ({ page }, info) => {
    await page.goto("/login");
    const size = info.project.name;
    await expect(page.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
    await expect(page.getByText("Coal analysis, from job order to certificate.")).toBeVisible();
    await expect(page.locator(".abrandpanel")).toHaveCount(size === "desktop" ? 1 : 0);
    if (size === "desktop") await expect(page.getByText("Laboratory information system for coal analysis")).toBeVisible();
    // desktop: the white logo on the brand panel; tablet: white above the card on navy; phone: the colour logo on the shell
    await expect(page.locator(size === "desktop" ? ".abrandpanel .alogo" : ".aside .alogo")).toHaveAttribute("src", size === "phone" ? "/sgsi-logo-primary.svg" : "/sgsi-logo-white.svg");
    await expect(page.locator("#si-pw")).toHaveAttribute("placeholder", "Enter your password");
    await page.locator("#privacy-link").click();
    await expect(page.getByRole("dialog", { name: "Privacy" })).toContainText("UU PDP No. 27/2022");
    await page.getByRole("dialog", { name: "Privacy" }).getByText("Close", { exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.screenshot({ path: `test-results/slice-d-signin-${size}.png` });
  });

  test("AD2: an invite link names who added the person, ticks the rules and goes straight in; Sign out says so", async ({ page, request }, info) => {
    const phone = info.project.name === "phone";
    const admin = await token(request, "wahyu@sgsi.co.id");
    const made = await request.post(`${API}/users`, { headers: { authorization: `Bearer ${admin}` }, data: { fullName: "Zeta Auth", email, roles: ["analyst"] } });
    expect(made.status()).toBe(201);
    const body = (await made.json()) as { id: string; inviteLink: string };
    id = body.id;
    await page.goto(body.inviteLink);
    await expect(page).toHaveURL(/\/set-password\?kind=invite/);
    await expect(page.getByRole("heading", { name: "Welcome to SGSI LIMS" })).toBeVisible();
    await expect(page.getByText("Wahyu Pratama added you to the lab. Set a password to sign in.")).toBeVisible();
    await expect(page.locator("#sp-account")).toContainText(email);
    await expect(page.locator("#sp-account .role")).toHaveText("Analyst");
    await page.locator("#sp-new").fill("short");
    await expect(page.locator('#pw-rules li[data-done="false"]').first()).toBeVisible();
    await page.locator("#sp-new").fill(NEW_PW);
    await expect(page.locator('#pw-rules li[data-done="false"]')).toHaveCount(0);
    await page.locator("#sp-again").fill(NEW_PW + "x");
    await page.locator("#sp-save").click();
    await expect(page.getByText("The two passwords are not the same.")).toBeVisible();
    await page.locator("#sp-again").fill(NEW_PW);
    await page.locator("#sp-save").click();
    await expect(page.locator(".frame")).toBeVisible();
    await expect(page).toHaveURL(/\/work$/);
    // a plain sign-out: "You signed out." and no way back to the last page
    if (phone) { await page.getByRole("button", { name: "Open menu" }).click(); await page.locator("#drawer-signout").click(); }
    else { await page.getByRole("button", { name: "User menu" }).click(); await page.getByRole("menuitem", { name: "Sign out" }).click(); }
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("You signed out.")).toBeVisible();
    await expect(page.locator("#si-email")).toHaveValue("");
  });

  test("AD3: five wrong passwords lock the account; Sign in is off and Reset password opens Forgot with the email", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await signIn(page, email, "not-the-password-1");
      await expect(page.locator(".alert")).toBeVisible();
      await expect(page.locator("#si-pw")).toHaveValue("");                                      // the password is cleared after an error
    }
    await expect(page.getByText("Too many failed attempts")).toBeVisible();
    await expect(page.getByText(/Try again at \d\d:\d\d, or reset your password\./)).toBeVisible();
    await expect(page.locator("#si-pw")).toBeDisabled();
    await expect(page.locator("#si-submit")).toBeDisabled();
    await page.locator("#si-reset").click();
    await expect(page).toHaveURL(/\/forgot\?email=/);
    await expect(page.locator("#fp-email")).toHaveValue(email);
    await page.locator("#fp-send").click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText(`If an account uses ${email}, a link is on its way. It works for 60 minutes.`)).toBeVisible();
    await expect(page.locator("#fp-resend")).toBeDisabled();
    await expect(page.locator("#fp-resend")).toHaveText(/Resend link in [01]:\d\d/);
  });

  test("AD4: a reset link says who it is for, unlocks the account and returns to Sign in with the email filled", async ({ page, request }) => {
    const admin = await token(request, "wahyu@sgsi.co.id");
    await request.post(`${API}/users/${id}/unlock`, { headers: { authorization: `Bearer ${admin}` } });
    const made = await request.post(`${API}/users/${id}/reset`, { headers: { authorization: `Bearer ${admin}` } });
    expect(made.status()).toBe(200);
    await page.goto(((await made.json()) as { link: string }).link);
    await expect(page).toHaveURL(/\/set-password\?kind=reset/);
    await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible();
    await expect(page.getByText(`For ${email}`)).toBeVisible();
    await page.locator("#sp-new").fill(NEW_PW + "2");
    await page.locator("#sp-again").fill(NEW_PW + "2");
    await page.locator("#sp-save").click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Password set. Sign in with your new password.")).toBeVisible();
    await expect(page.locator("#si-email")).toHaveValue(email);
    await page.locator("#si-pw").fill(NEW_PW + "2");
    await page.locator("#si-submit").click();
    await expect(page.locator(".frame")).toBeVisible();
  });

  test("AD5: expired links say which kind they were", async ({ page }) => {
    await page.goto("/set-password?kind=invite#error=access_denied&error_code=otp_expired");
    await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
    await expect(page.getByText("Invite links work for 7 days. Ask your Superadmin for a new invite.")).toBeVisible();
    await expect(page.locator("#sp-new-link")).toHaveCount(0);
    await page.goto("/set-password?kind=reset#error=access_denied&error_code=otp_expired");
    await expect(page.getByText("Reset links work for 60 minutes. Ask for a new one and use it soon after.")).toBeVisible();
    await page.locator("#sp-new-link").click();
    await expect(page).toHaveURL(/\/forgot$/);
  });

  test("AD6: the idle sign-out shows Signed out with the email and returns to the page after sign-in", async ({ page }) => {
    await page.clock.install();
    await signIn(page, "maya@sgsi.co.id");
    await expect(page.locator(".frame")).toBeVisible();
    await page.goto("/batches");
    await expect(page.getByRole("heading", { name: "Batches", level: 1 })).toBeVisible();
    await page.clock.fastForward("31:00");
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
    await expect(page.getByText("You were signed out")).toBeVisible();
    await expect(page.getByText("30 minutes without activity. Sign in to continue.")).toBeVisible();
    await expect(page.locator("#si-email")).toHaveValue("maya@sgsi.co.id");
    await page.locator("#si-pw").fill(PW);
    await page.locator("#si-submit").click();
    await expect(page).toHaveURL(/\/batches$/);
  });

  test("AD7: on the tablet the rail's Expand opens the sidebar over the page; an item, the scrim or Esc closes it", async ({ page }, info) => {
    test.skip(info.project.name !== "tablet", "the tablet rail only");
    await signIn(page, "maya@sgsi.co.id");
    await expect(page.locator(".frame")).toBeVisible();
    await page.locator("#side-expand").click();
    const over = page.locator("#side-over");
    await expect(over).toBeVisible();
    await expect(over.getByText("Job orders")).toBeVisible();                                     // labels show, unlike the rail
    await expect(over.locator(".side-logo .logo")).toBeVisible();                                 // it covers the top bar, so it has the logo (owner Nov 26)
    // group labels are labels only: no button, nothing opens or closes (owner Nov 26)
    await expect(over.locator("button.navgroup")).toHaveCount(0);
    await page.screenshot({ path: "test-results/slice-d-tablet-sidebar-open.png" });
    await page.keyboard.press("Escape");
    await expect(over).toHaveCount(0);
    await page.locator("#side-expand").click();
    await page.mouse.click(700, 600);                                                            // the scrim
    await expect(over).toHaveCount(0);
    await page.locator("#side-expand").click();
    await over.getByRole("link", { name: "Batches" }).click();
    await expect(page).toHaveURL(/\/batches$/);
    await expect(over).toHaveCount(0);
  });
});
