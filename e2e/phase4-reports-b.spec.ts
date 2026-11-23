// Phase 4, slice B (Reports_Build_Design.md section 16) at 1440, 834 and 390: the Profile's Signature and Lab stamp cards, the Reports list for the CSO and the Lab admin (tabs, chips,
// search, zip, the Filters sheet on the phone), the RoA page, and Mark sent, Revise and Void on a throwaway certificate. Test values start with ZE and are removed afterwards.
// Needs Gotenberg on :3000, `pnpm seed:master`, `pnpm seed:demo`, `pnpm seed:reports` and the Phase 4 migrations.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
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
const run = (script: string, ...args: string[]) => execSync(`npx tsx --env-file=../../.env scripts/${script} ${args.join(" ")}`, { cwd: "apps/api", stdio: "pipe" });
const tok = async (request: APIRequestContext, email: string) => ((await (await request.post(`${API}/auth/sign-in`, { data: { email, password: PW } })).json()) as { accessToken: string }).accessToken;
const PNG_1X = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

test.describe.serial("reports, slice B", () => {
  test.beforeAll(() => { run("cleanup-test-data.ts"); });
  test.afterAll(() => { run("cleanup-test-data.ts"); run("restore-demo-signing.ts"); });
  let order = "", coa = "";

  test("RB1: the Profile shows each person only the signing cards they may use, and a bad file is refused", async ({ page }) => {
    await signIn(page, "bambang@sgsi.co.id");
    await page.goto("/profile");
    await expect(page.locator("#sg-signature-box img")).toBeVisible();
    await expect(page.locator("#sg-stamp-box img")).toBeVisible();
    await page.locator("#sg-signature-open").click();
    await expect(page.getByRole("dialog").getByText("Replace your signature")).toBeVisible();
    await page.locator("#sg-file").setInputFiles({ name: "x.png", mimeType: "image/png", buffer: PNG_1X });
    await expect(page.locator("#sg-err")).toContainText("too small");
    await page.locator("#sg-file").setInputFiles({ name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await expect(page.locator("#sg-err")).toContainText("PNG");
    await expect(page.locator("#sg-save")).toBeDisabled();
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/profile");
    await expect(page.locator("#sg-signature-box")).toBeVisible();
    await expect(page.locator("#sg-stamp-box")).toHaveCount(0);        // only the Manager uploads the stamp
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto("/profile");
    await expect(page.locator("#sg-signature-box")).toHaveCount(0);    // an analyst has no signature
  });

  test("RB2: the CSO's Reports list has CoAs only and no Draft chip; search, open a row, select two and download the zip", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: /RoA/ })).toHaveCount(0);
    if (!phone) {
      await expect(page.locator("#rp-chip-draft")).toHaveCount(0);
      await expect(page.locator("#rp-chip-sent")).toBeVisible();
    }
    await page.locator("#rp-q").first().fill("JO-2026-0121");
    await expect(page.getByText("CoA-JO-2026-0121-1").first()).toBeVisible();
    await expect(page.getByText("CoA-JO-2026-0120-1")).toHaveCount(0);
    if (!phone) {
      await page.locator("#rp-q").fill("");
      await expect(page.getByText("CoA-JO-2026-0120-1").first()).toBeVisible();
      // a CoA with no PDF yet (draft, awaiting signature) can't be picked: its box is disabled
      const off = page.locator("[id^=rp-pick-].dis");
      if (await off.count()) { await off.first().click(); await expect(page.getByText(/selected/)).toHaveCount(0); }
      const picks = page.locator("[id^=rp-pick-]:not(.dis)");
      await picks.nth(0).click(); await picks.nth(1).click();
      await expect(page.getByText("2 selected")).toBeVisible();
      const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#rp-zip").click()]);
      expect(dl.suggestedFilename()).toMatch(/\.zip$/);
    } else {
      await page.locator("#rp-q").first().fill("");
      await page.locator("#rp-filters").click();
      await expect(page.getByRole("dialog").getByText("Filters")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "Apply" }).click();
    }
    await page.locator("#rp-q").first().fill("JO-2026-0121");
    await page.getByText("CoA-JO-2026-0121-1").first().click();
    await expect(page).toHaveURL(/\/reports\/coa\//);
    await expect(page.locator("#coa-marksent")).toBeVisible();           // the CSO marks it sent
    await expect(page.locator("#coa-download")).toBeVisible();
  });

  test("RB3: the Lab admin sees both tabs and the Draft chip; the RoA tab and the RoA page (an analyst sees no Used in)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/reports");
    await expect(page.getByRole("tab", { name: /CoA/ })).toBeVisible();
    if (!phone) { await expect(page.locator("#rp-chip-draft")).toBeVisible(); await page.locator("#rp-chip-draft").click(); await expect(page.getByText("Draft, no number").first()).toBeVisible(); }
    await page.getByRole("tab", { name: /RoA/ }).click();
    await page.locator("#rp-q").first().fill("RoA-0450");
    await page.getByText("RoA-0450").first().click();
    await expect(page).toHaveURL(/\/reports\/roa\/B-2026-0450/);
    await expect(page.getByText("Internal, not for distribution")).toBeVisible();
    await expect(page.getByText("Used in")).toBeVisible();
    await expect(page.getByText("CoA-JO-2026-0120-1")).toBeVisible();
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto("/reports/roa/B-2026-0450");
    await expect(page.getByText("Internal, not for distribution")).toBeVisible();
    await expect(page.getByText("Used in")).toHaveCount(0);
    await page.goto("/reports");
    await expect(page.getByRole("tab", { name: /CoA/ })).toHaveCount(0);   // an analyst sees RoAs only
  });

  test("RB4: Mark sent by the CSO, Revise by the Lab admin, Void by the Superadmin", async ({ page, request }, info) => {
    test.setTimeout(240_000);
    const idx = ["desktop", "tablet", "phone"].indexOf(info.project.name), phone = info.project.name === "phone";
    order = `ZE-JO-08${idx}`;
    const rina = await tok(request, "rina@sgsi.co.id"), h = { authorization: `Bearer ${rina}` };
    const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
    const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
    const made = await request.post(`${API}/orders`, { headers: h, data: { orderNo: order, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE results ${order}`, standards: ["ASTM"], parameterIds: ["PREP", "TM", "IM", "ASH", "VM", "FC", "TS", "GCV"].map(pid), expectedSamples: 2, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } });
    expect(made.status()).toBe(201);
    await request.put(`${API}/orders/${order}/samples`, { headers: h, data: { rows: ["ZE-A1", "ZE-A2"].map((c) => ({ clientRef: c, description: `Ply ${c}` })), removed: [] } });
    run("test-fixture-reports.ts", order, `B-2026-993${idx + 1}`);
    const maya = await tok(request, "maya@sgsi.co.id"), bam = await tok(request, "bambang@sgsi.co.id");
    const gen = await request.post(`${API}/orders/${order}/coa`, { headers: { authorization: `Bearer ${maya}` } });
    coa = ((await gen.json()) as { id: string }).id;
    expect((await request.post(`${API}/reports/coa/${coa}/send`, { headers: { authorization: `Bearer ${maya}` } })).status()).toBe(200);
    expect((await request.post(`${API}/reports/coa/${coa}/sign`, { headers: { authorization: `Bearer ${bam}` }, data: { password: PW } })).status()).toBe(200);

    // Mark sent, from the job order's CoA card
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/orders/${order}/coa`);
    await expect(page.locator("#coa-no")).toContainText(`CoA-${order}-1`);
    await page.locator("#coa-marksent").click();
    await page.locator("#ms-confirm").click();
    await expect(page.getByText("Choose at least one way it was sent.")).toBeVisible();
    await page.locator("#ms-ch-WhatsApp").click();
    await page.locator("#ms-note").fill("Sent by the CSO");
    await page.locator("#ms-confirm").click();
    await expect(page.getByText("Marked as sent").first()).toBeVisible();
    await expect(page.getByText(/Sent 1 time/)).toBeVisible();
    await expect(page.locator("#coa-marksent")).toContainText("Add another send");
    await page.locator("#coa-open").click();
    await expect(page.getByText("Sent", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("WhatsApp").first()).toBeVisible();

    // Revise, by the Lab admin
    await signIn(page, "maya@sgsi.co.id");
    await page.goto(`/reports/coa/${coa}`);
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Revise" }).click();
    await page.locator("#coa-revise-ok").click();
    await expect(page.getByText("Write the reason.")).toBeVisible();
    await page.locator("#coa-reason").fill("Wrong client reference");
    await page.locator("#coa-revise-ok").click();
    await expect(page).toHaveURL(/\/reports\/coa\/[0-9a-f-]{36}/);
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
    await expect(page).not.toHaveURL(new RegExp(coa));

    // Void, by the Superadmin (revision 1 is still the current one)
    await signIn(page, "wahyu@sgsi.co.id");
    await page.goto(`/reports/coa/${coa}`);
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Void" }).click();
    await page.locator("#coa-void-ok").click();
    await expect(page.getByText("Write the reason.")).toBeVisible();
    await page.locator("#coa-reason").fill("Issued for the wrong job order");
    await page.locator("#coa-void-ok").click();
    await expect(page.getByText("Certificate voided").first()).toBeVisible();
    await expect(page.getByText(/Void since/)).toBeVisible();
    if (!phone) await expect(page.getByText("Issued for the wrong job order").first()).toBeVisible();
  });
});
