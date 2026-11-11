// Phase 1, master data (prototype flows MD1 to MD3) at 1440, 834 and 390: clients with contacts and logo, drill holes with CoA
// upload and history, lithology and seam, and the read-only roles. Test rows use codes starting with ZE and are removed afterwards.
import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(PW);
  await page.locator("#si-submit").click();
  await expect(page.locator(".frame")).toBeVisible();
}
/** One row action: an icon-only ghost button (named "<icon label> <row>") on desktop and tablet; the card's "More for <row>" menu on the phone. */
async function act(page: Page, phone: boolean, who: string, iconLabel: string, menuLabel: string) {
  if (phone) { await page.getByRole("button", { name: `More for ${who}` }).click(); await page.getByRole("menuitem", { name: menuLabel, exact: true }).click(); }
  else await page.getByRole("button", { name: `${iconLabel} ${who}`, exact: true }).click();
}
const row = (page: Page, text: string) => page.locator("tr, .icard").filter({ hasText: text });
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });

test.describe.serial("master data", () => {
  const stamp = String(Date.now()).slice(-7);
  let name = "", code = "", hole = "", lith = "", seam = "";
  test.beforeAll(({}, info) => { const n = info.project.name[0]!.toUpperCase(); name = `PT E2E ${n}${stamp}`; code = `ZE${n}${stamp}`; hole = `DH-${code}`; lith = `Claystone ${code}`; seam = `S-${code}`; });
  test.afterAll(() => { cleanup(); });

  test("CSO adds a client with a logo and a default contact (MD1)", async ({ page }) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/clients");
    await page.locator("#add-client").click();
    await page.locator("#cl-logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: PNG });
    await page.locator("#cl-name").fill(name);
    await page.locator("#cl-code").fill(code);
    await page.getByLabel("Address", { exact: true }).fill("Jl. Uji Coba 1, Samarinda");
    await page.locator("#cl-save").click();
    await expect(page.getByRole("heading", { name })).toBeVisible();            // lands on the client page
    await expect(page.locator(".av.logo").first()).toBeVisible();                // the logo shows round
    await page.locator("#add-contact").click();
    await page.locator("#ct-name").fill("Budi Uji");
    await page.getByLabel("Email").fill("budi@example.com");
    await page.locator("#ct-save").click();
    await expect(page.getByText("Budi Uji", { exact: true })).toBeVisible();
    await expect(page.locator(".tag", { hasText: "Default" })).toBeVisible();   // the first contact is the default
    await page.locator("#add-contact").click();
    await page.locator("#ct-name").fill("Sari Uji");
    await page.locator("#ct-def").click();
    await page.locator("#ct-save").click();
    await expect(page.locator("tr, .ccard", { hasText: "Sari Uji" }).locator(".tag", { hasText: "Default" })).toBeVisible();
    await expect(page.locator("tr, .ccard", { hasText: "Budi Uji" }).locator(".tag", { hasText: "Default" })).toHaveCount(0);
  });

  test("a duplicate code is refused on the field", async ({ page }) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/clients");
    await page.locator("#add-client").click();
    await page.locator("#cl-name").fill("Another");
    await page.locator("#cl-code").fill(code);
    await page.locator("#cl-save").click();
    await expect(page.getByText(`${code} is already used by another client.`)).toBeVisible();
  });

  test("CSO archives and restores a client; the page links to master data", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/clients");
    await page.locator("#cl-q").fill(code);
    await expect(page.getByText(name).first()).toBeVisible();
    await act(page, phone, name, "Archive", "Archive");
    await page.getByRole("dialog").getByRole("button", { name: "Archive", exact: true }).click();
    await expect(page.getByText(name)).toHaveCount(0);                           // gone from All
    await page.getByRole("button", { name: /^Archived/ }).click();
    await expect(page.getByText(name).first()).toBeVisible();
    await act(page, phone, name, "Restore", "Restore");
    await page.getByRole("button", { name: /^All/ }).click();
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("lab admin adds a drill hole, uploads and replaces its CoA (MD2)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/master/drill-holes");
    await page.locator("#add-dh").click();
    await page.getByRole("dialog").getByLabel("Company").selectOption({ label: name });
    await page.locator("#dh-code").fill(hole);
    await page.getByRole("dialog").getByLabel("Description", { exact: true }).fill("Batch 1");
    await page.locator("#sf-save").click();
    await page.locator("#dh-q").fill(hole);
    await expect(page.getByText(hole).first()).toBeVisible();
    await expect(page.getByText("CoA missing").first()).toBeVisible();
    await page.getByRole("button", { name: "Upload CoA" }).first().click();
    await page.locator("#coa-file").setInputFiles({ name: "CoA-first.pdf", mimeType: "application/pdf", buffer: PDF });
    await page.locator("#coa-save").click();
    await expect(page.getByText("CoA uploaded").first()).toBeVisible();
    await act(page, phone, hole, "Replace the CoA of", "Replace CoA");
    await page.locator("#coa-file").setInputFiles({ name: "CoA-second.pdf", mimeType: "application/pdf", buffer: PDF });
    await page.locator("#coa-save").click();
    await act(page, phone, hole, "CoA history of", "CoA history");
    const dlg = page.getByRole("dialog", { name: "CoA history" });
    await expect(dlg.getByText("CoA-second.pdf")).toBeVisible();
    await expect(dlg.getByText("CoA-first.pdf")).toBeVisible();
    await expect(dlg.getByText("Current")).toHaveCount(1);
  });

  test("lab admin edits a lithology and adds a seam (MD3)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/master/lithologies");
    await page.locator("#add-li").click();
    await page.getByRole("dialog").getByLabel("Company").selectOption({ label: name });
    await page.locator("#li-name").fill(lith);
    await page.getByRole("dialog").getByText("Parting", { exact: true }).click();
    await page.locator("#sf-save").click();
    await page.locator("#li-q").fill(lith);
    await expect(row(page, lith).locator(".tag", { hasText: "Parting" })).toBeVisible();
    await act(page, phone, lith, "Edit", "Edit");
    await page.getByRole("dialog").getByText("Coal", { exact: true }).click();
    await page.locator("#sf-save").click();
    await expect(row(page, lith).locator(".tag", { hasText: "Coal" })).toBeVisible();
    await page.goto("/master/seams");
    await page.locator("#add-se").click();
    await page.getByRole("dialog").getByLabel("Company").selectOption({ label: name });
    await page.locator("#se-code").fill(seam);
    await page.getByRole("dialog").getByLabel("Order").fill("7");
    await page.locator("#sf-save").click();
    await page.locator("#se-q").fill(seam);
    await expect(row(page, seam.toUpperCase())).toBeVisible();
  });

  test("the client page links to its lists, filtered", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/clients");
    await page.locator("#cl-q").fill(code);
    await page.getByText(name).first().click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await page.getByRole("link", { name: /View list/ }).first().click();   // the whole card does the same
    await expect(page).toHaveURL(/\/master\/drill-holes\?company=/);
    await expect(page.getByText(hole).first()).toBeVisible();
    await page.goBack();
    await page.getByRole("link", { name: "Lithologies, view list" }).click();
    await expect(page).toHaveURL(/\/master\/lithologies\?company=/);
  });

  test("a table sorts when its head is clicked", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "the phone shows cards, not a table");
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/clients");
    const head = info.project.name === "tablet" ? "Status" : "Code";    // the tablet table drops Code, Address and Created
    const codes = () => page.locator("tbody tr td:nth-child(2)").allTextContents();
    await expect(page.locator("th.sorted")).toContainText("Client");                    // sorted by name when the page opens
    await page.getByRole("button", { name: head, exact: true }).click();
    await expect(page.locator("th.sorted")).toHaveAttribute("aria-sort", "ascending");
    const up = await codes(); expect(up).toEqual([...up].sort((a, b) => a.localeCompare(b)));
    await page.getByRole("button", { name: head, exact: true }).click();
    await expect(page.locator("th.sorted")).toHaveAttribute("aria-sort", "descending");
    const down = await codes(); expect(down).toEqual([...down].sort((a, b) => b.localeCompare(a)));
  });

  test("the client page has Edit, Archive and Delete buttons and contact actions", async ({ page }, info) => {
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/clients");
    await page.locator("#cl-q").fill(code);
    await page.locator("tr, .icard").filter({ hasText: name }).first().click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.locator("#edit-client")).toBeVisible();
    await expect(page.locator("#archive-client")).toBeVisible();
    await expect(page.locator("#delete-client")).toBeDisabled();                         // the client has a drill hole, so it cannot be deleted
    await expect(page.getByRole("button", { name: "More for this client" })).toHaveCount(0);   // no three-dots menu any more
    await expect(page.getByText(code, { exact: true }).first()).toBeVisible();          // code and status sit under the name
    if (info.project.name !== "phone") {
      await page.locator("#add-contact").click();
      await page.locator("#ct-name").fill("Zeta Contact");
      await page.locator("#ct-save").click();
      await expect(page.getByRole("button", { name: "Edit Zeta Contact" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Archive Zeta Contact" })).toBeVisible();
      const zeta = page.locator("tr").filter({ hasText: "Zeta Contact" });
      await expect(zeta.getByRole("button", { name: "Make Zeta Contact the default contact" })).toBeVisible();   // user-check icon, last in the row
      await expect(page.locator("tr").filter({ hasText: "Sari Uji" }).getByRole("button", { name: /default/i })).toHaveCount(0);   // the default contact does not offer it
    }
  });

  test("a supervisor sees the lists read-only", async ({ page }) => {
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/master/drill-holes");
    await expect(page.getByText("Read only.")).toBeVisible();
    await expect(page.locator("#add-dh")).toHaveCount(0);
    await page.goto("/clients");
    await expect(page.getByText("You don't have access to this page")).toBeVisible();
  });
});
