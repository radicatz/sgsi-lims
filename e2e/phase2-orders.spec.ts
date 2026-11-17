// Phase 2, job orders (Job_Order_Build_Design.md; prototype flows JO1 to JO5 and JO8 to JO12) at 1440, 834 and 390. Slice A: the list and its
// filters, the New job order form (dialog on desktop and tablet, two steps on the phone), draft and submit rules, contacts, the coking-coal
// pills, edit, cancel and close, and a read-only visit. Slice B: samples by paste and by typing, not received and restore, files and history.
// Test values start with ZE and are removed afterwards. Needs `pnpm seed:orders`.
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
const dlg = (page: Page) => page.getByRole("dialog").last();

/** Open the form and choose the client; the contact, the template and the due date fill in. */
async function openForm(page: Page, company = "PT Bara Nusantara Mandiri") {
  await page.goto("/orders");
  await expect(page.getByText("JO-2026-0142").first()).toBeVisible();
  await page.locator("#new-order").click();
  await expect(page.locator("#jo-company")).toBeVisible();
  await page.locator("#jo-company").selectOption({ label: company });
  await expect(page.locator("#jo-contact")).toBeEnabled();
}
/** On the phone Submit lives on step 2; Save as draft is on step 1. */
async function press(page: Page, phone: boolean, what: "submit" | "draft") {
  if (what === "submit" && phone && (await page.locator("#jo-next").isVisible())) await page.locator("#jo-next").click();
  await page.locator(what === "submit" ? "#jo-submit" : "#jo-draft").click();
}
/** Create and submit one job order through the form; returns its number. */
async function makeOrder(page: Page, phone: boolean, ref: string) {
  await openForm(page);
  await page.locator("#jo-ref").fill(ref);
  await page.locator("#jo-expected").fill("7");
  await press(page, phone, "submit");
  await expect(page).toHaveURL(/\/orders\/JO-\d{4}-\d{4}\/samples$/);
  return page.url().match(/(JO-\d{4}-\d{4})/)![1]!;
}

test.describe.serial("job orders, slice A", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });

  test("the list shows status counts, filters by chip and search, and opens a job order", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/orders");
    await expect(page.getByRole("button", { name: /^All \d+/ })).toBeVisible();
    await expect(page.getByText("JO-2026-0142").first()).toBeVisible();
    await page.getByRole("button", { name: /^Draft \d+/ }).click();
    await expect(page.getByText("JO-2026-0136").first()).toBeVisible();
    await expect(page.getByText("JO-2026-0142")).toHaveCount(0);
    await page.getByRole("button", { name: /^All \d+/ }).click();
    await page.locator("#jo-q").fill("MCR-2207");
    await expect(page.getByText("JO-2026-0139").first()).toBeVisible();
    await expect(page.getByText("JO-2026-0142")).toHaveCount(0);
    if (!phone) { await expect(page.locator("tbody tr", { hasText: "PT Mahakam Coal Resources" })).toBeVisible(); }   // the list drops the attention line (Desktop-03)
    await page.getByText("JO-2026-0139").first().click();
    await expect(page).toHaveURL(/\/orders\/JO-2026-0139$/);
    await expect(page.getByRole("heading", { name: "JO-2026-0139" })).toBeVisible();
    await expect(page.getByText("Past due")).toBeVisible();
    await expect(page.getByText("Properties")).toBeVisible();
  });

  test("a CSO creates and submits a job order (JO1, JO9), and the detail shows what was entered", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    const ref = `ZE ${info.project.name} ${Date.now() % 100000}`;
    const no = await makeOrder(page, phone, ref);
    await expect(page.getByText(`${no} submitted. Add the sample IDs next.`)).toBeVisible();
    await page.goto(`/orders/${no}`);
    await expect(page.getByText("Awaiting samples").first()).toBeVisible();
    await expect(page.getByText(ref).first()).toBeVisible();
    await expect(page.getByText("8 parameters")).toBeVisible();
    await expect(page.getByText("Ir. Bambang Sutrisno, M.T.")).toBeVisible();
    await page.goto("/orders");
    await page.locator("#jo-q").fill(ref);
    await expect(page.getByText(no).first()).toBeVisible();
  });

  test("draft needs only the client; submit names what is missing on the fields (JO2)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await openForm(page);
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await page.locator("#jo-due").fill("");
    await press(page, phone, "submit");
    await expect(page.getByText("Fix 3 fields to submit.")).toBeVisible();
    await expect(page.getByText("Choose at least one parameter.")).toBeVisible();
    await expect(page.getByText("Enter how many samples to expect.")).toBeVisible();
    await expect(page.getByText("Pick the due date.")).toBeVisible();
    await page.locator("#jo-ref").fill(`ZE draft ${info.project.name} ${Date.now() % 100000}`);
    await page.locator("#jo-draft").click();
    await expect(page).toHaveURL(/\/orders\/JO-\d{4}-\d{4}$/);
    await expect(page.getByText("saved as a draft")).toBeVisible();
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
  });

  test("contacts: add, edit and remove one from the picker (JO3)", async ({ page }, info) => {
    await signIn(page, "rina@sgsi.co.id");
    await openForm(page, "PT Kaltara Energi Prima");
    const name = `ZE Contact ${info.project.name}`;
    await page.locator("#jo-contact").click();
    await dlg(page).getByRole("button", { name: "Add contact" }).click().catch(async () => page.getByRole("button", { name: "Add contact" }).click());
    await page.locator("#ct-name").fill(name);
    await page.getByRole("button", { name: "Save contact" }).click();
    await expect(page.getByText("Contact added")).toBeVisible();
    await expect(page.locator("#jo-contact")).toContainText(name);
    await page.locator("#jo-contact").click();
    await page.getByRole("button", { name: `Edit ${name}` }).click();
    await page.locator("#ct-name").fill(`${name} B`);
    await page.getByRole("button", { name: "Save contact" }).click();
    await expect(page.getByText("Contact saved")).toBeVisible();
    await page.getByRole("button", { name: `Remove ${name} B` }).click();
    await expect(page.getByText(`Remove ${name} B from contacts?`)).toBeVisible();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("Contact removed")).toBeVisible();
    await expect(page.getByRole("button", { name: `Edit ${name} B` })).toHaveCount(0);
  });

  test("the Ash analysis checklist and the coking-coal pills follow the chosen standards (JO4)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await openForm(page);
    await page.getByRole("button", { name: /^Ash analysis/ }).click();
    await expect(dlg(page).getByText(/^0 of \d+ selected$/)).toBeVisible();
    await dlg(page).getByRole("button", { name: "Presets" }).click();
    await expect(dlg(page).getByText(/^\d+ of \d+ selected$/)).not.toHaveText(/^0 of/);
    await dlg(page).locator("#grp-q").fill("SiO");
    await expect(dlg(page).getByText("SiO₂", { exact: true })).toBeVisible();
    await page.locator("#grp-done").click();
    await expect(page.getByRole("button", { name: /^Ash analysis/ })).toHaveAttribute("aria-pressed", "true");
    const gray = page.getByRole("button", { name: /Gray King/ });
    await expect(gray).toBeDisabled();                                  // ASTM alone has no Gray-King method
    await page.getByRole("button", { name: "GB/T", exact: true }).first().click();
    await expect(gray).toBeEnabled();
    await page.getByRole("button", { name: "Coking coal", exact: true }).click();
    await expect(page.getByText(/^1[0-9]+ selected$|^[2-9][0-9]+ selected$/)).toBeVisible();
    if (phone) await page.locator("#jo-next").click();                  // keep the phone step buttons exercised
  });

  test("edit, cancel and the close rule (JO8)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    const no = await makeOrder(page, phone, `ZE edit ${info.project.name} ${Date.now() % 100000}`);
    await page.goto(`/orders/${no}`);
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page.locator("#jo-expected")).toHaveValue("7");
    await page.locator("#jo-expected").fill("9");
    if (phone) await page.locator("#jo-next").click();
    await page.locator("#jo-save").click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await expect(page.getByText("0 of 9 arrived")).toBeVisible();
    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Close" })).toBeDisabled();       // closes once the CoA is sent
    await page.getByRole("menuitem", { name: "Cancel" }).click();
    await page.locator("#cancel-confirm").click();
    await expect(page.getByText("Say why it is cancelled.")).toBeVisible();
    await page.locator("#cancel-reason").fill("ZE the client postponed");
    await page.locator("#cancel-confirm").click();
    await expect(page.getByText(`${no} cancelled`)).toBeVisible();
    await expect(page.getByText("the client postponed")).toBeVisible();
    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Edit" })).toBeDisabled();
  });

  test("a preparation user reads job orders without edit controls (JO12)", async ({ page }) => {
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto("/orders");
    await expect(page.getByText("JO-2026-0142").first()).toBeVisible();
    await expect(page.locator("#new-order")).toHaveCount(0);
    await page.getByText("JO-2026-0142").first().click();
    await expect(page.getByText("Properties")).toBeVisible();
    await expect(page.getByRole("button", { name: "More actions" })).toHaveCount(0);
    await expect(page.locator("#edit-order")).toHaveCount(0);
    await page.goto("/orders/JO-2026-0142?edit");
    await expect(page.locator("#jo-company")).toHaveCount(0);
  });
});

// Slice B (frames 03-03-06 to 12; flows JO5, JO10, JO11): the Samples tab, the Files tab and the form's drop zone, the History tab.
test.describe.serial("job orders, slice B", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });
  let no = "";
  const ref = (page: Page, v: string) => page.locator(`input[value="${v}"]`);

  test("register samples by paste or by typing; duplicates are caught before saving (JO5)", async ({ page }, info) => {
    const phone = info.project.name === "phone", tablet = info.project.name === "tablet";
    await signIn(page, "rina@sgsi.co.id");
    no = await makeOrder(page, phone, `ZE samples ${info.project.name} ${Date.now() % 100000}`);
    await expect(page.getByText("No samples yet")).toBeVisible();
    if (phone) {
      await page.locator("#add-sample").click();
      await page.locator("#sheet-ref").fill("ZE-1");
      await page.locator("#sheet-depth").fill("DH-BNM-022 8.20-8.55");
      await page.locator("#sheet-save").click();
      await expect(page.locator(".scard", { hasText: "ZE-1" })).toBeVisible();
      await page.locator("#add-sample").click();
      await page.locator("#sheet-ref").fill("ze-1");
      await page.locator("#sheet-save").click();
      await expect(page.getByText("ze-1 is already on this job order.")).toBeVisible();
      await page.locator("#sheet-ref").fill("ZE-2");
      await page.locator("#sheet-save").click();
      await expect(page.locator(".scard", { hasText: "ZE-2" })).toBeVisible();
      await page.locator(".scard", { hasText: "ZE-2" }).click();
      await page.locator("#sheet-desc").fill("ZE edited");
      await page.locator("#sheet-save").click();
      await expect(page.locator(".scard", { hasText: "ZE edited" })).toBeVisible();
      return;
    }
    if (!tablet) {
      await page.locator("#empty-paste").click();
      await page.locator("#paste-text").fill("Sample ID\tDescription\tHole\tFrom\tTo\nZE-1\tPly A\tDH-BNM-022\t8.20\t8.55\nZE-2\tPly B\tDH-BNM-022\t8.55\t8.90\nZE-3\tPly C\nZE-2\tPly B again");
      await expect(dlg(page).getByText("1 duplicate", { exact: true })).toBeVisible();
      await expect(dlg(page).getByText("Duplicate", { exact: true })).toBeVisible();
      await page.locator("#paste-add").click();
      await expect(ref(page, "ZE-3")).toBeVisible();
      await expect(ref(page, "DH-BNM-022 8.20-8.55 m")).toBeVisible();
    } else {
      await page.locator("#empty-add").click();
      for (const [i, r] of ["ZE-1", "ZE-2", "ZE-3"].entries()) {
        if (i) await page.locator("#add-row").click();
        await page.locator("[id^=ref-n]").last().fill(r);
      }
    }
    await expect(page.locator("#save-samples")).toHaveText("Save (3)");
    await page.locator("[id^=ref-n]").last().fill("ZE-1");
    await expect(page.getByText("Fix 1 duplicate ID before saving")).toBeVisible();
    await expect(page.getByText("ZE-1 is already in row 1.")).toBeVisible();
    await page.locator("[id^=ref-n]").last().fill("ZE-3");
    await page.locator("#save-samples").click();
    await expect(page.getByText("Samples saved")).toBeVisible();
    await page.reload();
    for (const r of ["ZE-1", "ZE-2", "ZE-3"]) await expect(ref(page, r)).toBeVisible();
    await expect(page.locator("#save-samples")).toHaveText("Save");
  });

  test("mark a sample not received with a reason, then restore it; locked rows say why (JO10)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/orders/${no}/samples`);
    if (phone) {
      await page.locator(".scard", { hasText: "ZE-1" }).click();
      await page.locator("#sheet-nr").click();
    } else {
      await ref(page, "ZE-1").click();                                    // the row's actions show while it is being typed in
      await page.getByRole("button", { name: "Mark ZE-1 as not received" }).click();
    }
    await expect(page.getByText("Mark ZE-1 as not received?")).toBeVisible();
    await page.locator("#nr-reason").selectOption("Other");
    await page.locator("#nr-confirm").click();
    await expect(page.getByText("Add a note for this reason.")).toBeVisible();
    await page.locator("#nr-note").fill("ZE the core box broke");
    await page.locator("#nr-confirm").click();
    await expect(page.getByText("ZE-1 marked not received")).toBeVisible();
    await expect(page.getByText("Not received", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Restore ZE-1" }).click();
    await expect(page.getByText("ZE-1 restored")).toBeVisible();
    await expect(page.getByText("Not received", { exact: true })).toHaveCount(0);
    // the demo order 0139: received and in-batch rows are locked with their reason
    await page.goto("/orders/JO-2026-0139/samples");
    if (phone) {
      await expect(page.locator(".scard", { hasText: "BNM-3501" }).getByText("Received", { exact: true })).toBeVisible();
      await page.locator(".lockic").first().click();
      await expect(page.getByText(/Received on .+\. Received samples can't be edited\./)).toBeVisible();
    } else {
      await expect(page.getByText("007.RI.001.Lot01")).toBeVisible();
      await page.locator(".lockic").first().hover();
      await expect(page.getByRole("tooltip")).toContainText("Received samples can't be edited.");
      await expect(page.getByRole("button", { name: "Mark BNM-3507 as not received" })).toBeVisible();   // awaiting arrival: shown at rest
    }
  });

  test("files from the form and the Files tab, then the History tab lists the changes (JO11)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await openForm(page);
    await page.locator("#jo-ref").fill(`ZE files ${info.project.name} ${Date.now() % 100000}`);
    await page.locator("#jo-expected").fill("3");
    if (phone) await page.locator("#jo-next").click();
    await page.locator("#jo-form-file").setInputFiles({ name: "ZE quote.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% ZE\n%%EOF\n") });
    await expect(page.locator(".filerow", { hasText: "ZE quote.pdf" })).toBeVisible();
    await page.locator("#jo-submit").click();
    await expect(page).toHaveURL(/\/orders\/JO-\d{4}-\d{4}\/samples$/);
    await page.getByRole("tab", { name: /^Files/ }).click();
    await expect(page.locator(".filerow", { hasText: "ZE quote.pdf" })).toBeVisible();
    await page.locator("#jo-file").setInputFiles({ name: "ZE tool.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") });
    await expect(page.getByText("Use a PDF, image, Excel, Word or CSV file.")).toBeVisible();
    await page.locator("#jo-file").setInputFiles({ name: "ZE list.csv", mimeType: "text/csv", buffer: Buffer.from("ref,desc\nZE-1,Ply A\n") });
    await expect(page.getByText("ZE list.csv added")).toBeVisible();
    await expect(page.getByRole("link", { name: "Download ZE list.csv" })).toHaveAttribute("href", /token=/);
    await page.getByRole("button", { name: "Remove ZE list.csv" }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("ZE list.csv removed")).toBeVisible();
    await expect(page.locator(".filerow", { hasText: "ZE list.csv" })).toHaveCount(0);
    await page.getByRole("tab", { name: /^History/ }).click();
    await expect(page.getByText("File removed", { exact: true })).toBeVisible();
    await expect(page.getByText("File added", { exact: true }).first()).toBeVisible();
    await page.getByText("Created", { exact: true }).click();
    await expect(page.getByText("Expected samples", { exact: true })).toBeVisible();
  });
});
