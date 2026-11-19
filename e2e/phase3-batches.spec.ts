// Phase 3, slice A (Batch_Build_Design.md; prototype flows JO6, BA1 to BA3, BA6) at 1440, 834 and 390: Add batch from the job order and from the list,
// the Reception tab (scan, ticks, mass, condition, remark, photo, labels), Confirm reception with fewer samples, the batch number, a read-only visit,
// and the list opening on the person's own queue. Test values start with ZE and are removed afterwards. Needs `pnpm seed:orders` and `pnpm seed:batches`.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(PW);
  await page.locator("#si-submit").click();
  await expect(page.locator(".frame")).toBeVisible();
}
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });
const dlg = (page: Page) => page.getByRole("dialog").last();

/** A submitted job order with six expected samples, made through the API (the screens for it are phase 2's). */
async function seedOrder(request: APIRequestContext, no: string) {
  const token = ((await (await request.post(`${API}/auth/sign-in`, { data: { email: "rina@sgsi.co.id", password: PW } })).json()) as { accessToken: string }).accessToken;
  const h = { authorization: `Bearer ${token}` };
  const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
  const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
  const made = await request.post(`${API}/orders`, { headers: h, data: { orderNo: no, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE batches ${no}`, standards: ["ASTM"],
    parameterIds: ["PREP", "TM", "IM", "ASH", "VM", "TS", "GCV"].map(pid), expectedSamples: 6, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } });
  expect(made.status()).toBe(201);
  const s = await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: ["ZE-A1", "ZE-A2", "ZE-A3", "ZE-A4", "ZE-A5", "ZE-A6"].map((c) => ({ clientRef: c, description: `Ply ${c}` })), removed: [] } });
  expect(s.status()).toBe(200);
}
const rowOf = (page: Page, phone: boolean, ref: string) => (phone ? page.locator(".prow", { hasText: ref }) : page.locator("tbody tr", { hasText: ref }));

test.describe.serial("batches, slice A", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });
  let order = "", batch = "", second = "";

  test("the list opens on the person's own queue, and Add batch creates a batch from a job order (JO6)", async ({ page, request }, info) => {
    const phone = info.project.name === "phone";
    order = `ZE-JO-03${["desktop", "tablet", "phone"].indexOf(info.project.name)}`;
    await seedOrder(request, order);
    // Preparation starts on Created and Preparation (the batches to prepare)
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto("/batches");
    await expect(page.getByRole("button", { name: /^Created \d+/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /^Preparation \d+/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /^Completed \d+/ })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("B-2026-0422").first()).toBeVisible();
    await page.getByRole("button", { name: /^All \d+/ }).click();
    await page.locator("#bl-q").fill("KEP-3301");
    await expect(page.getByText("B-2026-0422").first()).toBeVisible();
    await expect(page.getByText("B-2026-0420")).toHaveCount(0);

    // the CSO adds a batch
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await signIn(page, "rina@sgsi.co.id");
    if (!phone) {
      await page.goto(`/orders/${order}/batches`);
      await expect(page.getByText("No batches yet")).toBeVisible();
      await page.locator("#add-batch-tab").click();
      await expect(page.locator("#ab-create")).toBeVisible();
      batch = await page.locator("#ab-no").inputValue();
      await expect(page.getByText("6 of 6 selected")).toBeVisible();
      await page.locator(".ab-s", { hasText: "ZE-A5" }).locator(".box").click();     // two samples stay out, for the batch after this one
      await page.locator(".ab-s", { hasText: "ZE-A6" }).locator(".box").click();
      await expect(page.getByText("4 of 6 selected")).toBeVisible();
      await page.locator("#ab-no").fill("B-12");
      await page.locator("#ab-create").click();
      await expect(page.getByText("Pattern B-YYYY-NNNN. The number must be unique.").first()).toBeVisible();
      await page.locator("#ab-no").fill("B-2026-0422");
      await page.locator("#ab-create").click();
      await expect(page.getByText("B-2026-0422 is already used.")).toBeVisible();
      await page.locator("#ab-no").fill(batch);
      await page.locator("#ab-create").click();
      await expect(page.getByText(`${batch} created`)).toBeVisible();
      await expect(page.locator("tbody tr", { hasText: batch })).toBeVisible();
      if (info.project.name === "desktop") await expect(page.locator("tbody tr", { hasText: batch })).toContainText("Same as the job order");   // the tablet table drops the Parameters column (frame)
    } else {
      // the phone's job order tab has no Add batch (as drawn): the list's Add batch asks for the job order, then two steps
      await page.goto("/batches");
      await page.locator("#add-batch").click();
      await page.locator(".ab-o", { hasText: order }).click();
      await page.locator("#ab-next-order").click();
      await expect(page.locator("#ab-next")).toBeVisible();
      batch = "";
      await page.locator(".ab-s", { hasText: "ZE-A5" }).locator(".box").click();
      await page.locator(".ab-s", { hasText: "ZE-A6" }).locator(".box").click();
      await expect(page.locator("#ab-next")).toHaveText("Next (4 selected)");
      await page.locator("#ab-next").click();
      batch = await page.locator("#ab-no").inputValue();
      await page.locator("#ab-create").click();
      await expect(page).toHaveURL(new RegExp(`/batches/${batch}/reception$`));
    }
    await page.goto(`/batches/${batch}/reception`);
    await expect(page.getByRole("heading", { name: batch })).toBeVisible();
    await expect(page.getByText("0 of 4 arrived")).toBeVisible();
    if (info.project.name === "desktop") await expect(page.getByText("Given on arrival").first()).toBeVisible();   // the tablet and phone show only the reference of a sample that has not arrived (frames)
  });

  test("receive: scan, tick, mass, condition, remark, a photo and the labels; Confirm with fewer samples (BA1, BA2)", async ({ page }, info) => {
    const phone = info.project.name === "phone", tablet = info.project.name === "tablet";
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto(`/batches/${batch}/reception`);
    await expect(page.locator("#confirm-reception")).toBeDisabled();
    // scan a label: the sample is found, ticked, and gets its Sample ID and sample code
    await page.locator("#scan").fill("zz-none");
    await page.locator("#scan").press("Enter");
    await expect(page.getByText('No sample of this batch matches "zz-none".')).toBeVisible();
    await page.locator("#scan").fill("ZE-A1");
    await page.locator("#scan").press("Enter");
    await expect(page.getByRole("checkbox", { name: "Arrived, ZE-A1" })).toHaveAttribute("aria-checked", "true");
    await expect(rowOf(page, phone, "ZE-A1")).toContainText(/\d{3}\.RI\.\d{3}\.Lot01/);
    if (info.project.name === "desktop") await expect(rowOf(page, phone, "ZE-A1")).toContainText(/SG\.\d{6}\.\d{3}\.RI\.\d{3}/);   // tablet and phone show the sample code; the Sample ID is its tooltip (spec 6.1)
    await expect(page.getByLabel("Mass in kg, ZE-A1")).toBeFocused();
    await page.getByLabel("Mass in kg, ZE-A1").fill("12,4");
    await page.getByLabel("Mass in kg, ZE-A1").press("Tab");
    await expect(page.getByLabel("Mass in kg, ZE-A1")).toHaveValue("12.40");
    // a mass with three decimals is refused and goes back
    await page.getByLabel("Mass in kg, ZE-A1").fill("12.345");
    await page.getByLabel("Mass in kg, ZE-A1").press("Tab");
    await expect(page.getByText("Use at most 2 decimals.")).toBeVisible();
    await expect(page.getByLabel("Mass in kg, ZE-A1")).toHaveValue("12.40");
    // Mark all arrived ticks the others (the phone has no such button: its cards are ticked one by one)
    if (!phone) { await page.locator("#mark-all").click(); } else { for (const r of ["ZE-A2", "ZE-A3"]) await page.getByRole("checkbox", { name: `Arrived, ${r}` }).click(); }
    await expect(page.getByRole("checkbox", { name: "Arrived, ZE-A2" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("checkbox", { name: "Arrived, ZE-A3" })).toHaveAttribute("aria-checked", "true");
    // the fourth sample never arrives: untick it
    if (!phone) { await page.getByRole("checkbox", { name: "Arrived, ZE-A4" }).click(); await expect(page.getByRole("checkbox", { name: "Arrived, ZE-A4" })).toHaveAttribute("aria-checked", "false"); }
    for (const r of ["ZE-A2", "ZE-A3"]) { await page.getByLabel(`Mass in kg, ${r}`).fill("10.5"); await page.getByLabel(`Mass in kg, ${r}`).press("Tab"); await expect(page.getByLabel(`Mass in kg, ${r}`)).toHaveValue("10.50"); }
    // a wet sample needs a remark
    await rowOf(page, phone, "ZE-A3").locator("select").selectOption("Wet");
    await expect(rowOf(page, phone, "ZE-A3").getByLabel("Remark, ZE-A3")).toBeVisible();
    await expect(page.getByText("with a remark unless Good").first()).toBeVisible();
    await rowOf(page, phone, "ZE-A3").getByLabel("Remark, ZE-A3").fill("Bag wet on arrival");
    await rowOf(page, phone, "ZE-A3").getByLabel("Remark, ZE-A3").press("Tab");
    // a photo: Add, choose a file, it is counted and shows as a thumbnail
    await (phone ? rowOf(page, phone, "ZE-A2").getByRole("button", { name: "Add photo" }) : rowOf(page, phone, "ZE-A2").getByRole("button", { name: "Add a photo of ZE-A2" })).click();
    await expect(dlg(page)).toContainText("Photos of ZE-A2");
    await page.locator("#ph-file").setInputFiles({ name: "ze wet.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByText("Photo added")).toBeVisible();
    await expect(dlg(page).getByRole("img", { name: /photo of ZE-A2/ })).toBeVisible();
    await dlg(page).getByRole("button", { name: /^Open the/ }).click();           // a thumbnail opens the photo large
    await expect(page.getByRole("img", { name: /large/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("img", { name: /large/ })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(rowOf(page, phone, "ZE-A2").getByRole("button", { name: "Photos of ZE-A2, 1" })).toBeVisible();
    // labels: the checklist wants them; Confirm stays off until all are printed
    await expect(page.locator("#confirm-reception")).toBeDisabled();
    await expect(page.getByText(/printed label \(3 to print\)/)).toBeVisible();
    await page.locator("#print-labels").click();
    await expect(dlg(page)).toContainText("Print 3 labels");
    await expect(dlg(page).locator(".slbl")).toContainText(/\d{3}\.RI\.\d{3}\.Lot01/);
    await dlg(page).locator("#pl-print").click();
    await expect(page.getByText("3 labels sent to print")).toBeVisible();
    await expect(page.locator("#confirm-reception")).toBeEnabled();
    // Confirm with fewer samples: asks first, names the sample that leaves
    await page.locator("#confirm-reception").click();
    await expect(dlg(page)).toContainText("Confirm reception with 3 of 4 samples?");
    await expect(dlg(page)).toContainText("ZE-A4");
    await page.locator("#fewer-confirm").click();
    await expect(page).toHaveURL(new RegExp(`/batches/${batch}/preparation$`));
    await expect(page.getByText("Reception confirmed")).toBeVisible();
    await expect(page.getByRole("heading", { name: batch })).toBeVisible();
    // the tab is read-only now and says which sample went back
    await page.getByRole("tab", { name: /^Reception/ }).click();
    await expect(page.getByLabel("Mass in kg, ZE-A1")).toHaveCount(0);
    await expect(page.getByText("1 sample returned to")).toBeVisible();
    await expect(page.getByText("ZE-A4").first()).toBeVisible();
    if (!tablet && !phone) await expect(page.getByRole("heading", { name: batch })).toBeVisible();
    // the job order shows the sample as awaiting arrival
    await page.goto(`/orders/${order}/samples`);
    await expect(page.getByText("Awaiting arrival").first()).toBeVisible();
    await page.goto(`/orders/${order}/batches`);
    await expect(page.locator("#awaiting-note")).toContainText(`returned from ${batch}`);
  });

  test("a second batch takes the late sample; the batch number can change until reception is confirmed (BA3)", async ({ page, request }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/orders/${order}/batches`);
    if (!phone) {
      await page.locator("#add-batch-tab").click();
      await expect(page.getByText(/Settings copied from .+: ASTM/)).toBeVisible();   // the late sample came back from the first batch
      await expect(page.locator(".ab-s", { hasText: "ZE-A4" })).toContainText("Awaiting arrival");
      await expect(page.locator(".ab-s", { hasText: "ZE-A4" })).toContainText(`from ${batch}`);
      second = await page.locator("#ab-no").inputValue();
      await page.locator("#ab-create").click();
      await expect(page.getByText(`${second} created`)).toBeVisible();
    } else {
      await page.goto("/batches");
      await page.locator("#add-batch").click();
      await page.locator(".ab-o", { hasText: order }).click();
      await page.locator("#ab-next-order").click();
      await expect(page.locator(".ab-s", { hasText: "ZE-A4" })).toContainText("Awaiting arrival");
      await page.locator("#ab-next").click();
      second = await page.locator("#ab-no").inputValue();
      await page.locator("#ab-create").click();
      await expect(page).toHaveURL(new RegExp(`/batches/${second}/reception$`));
    }
    // the preparation user edits the number: used numbers are refused with the frame's text
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await signIn(page, "dedi@sgsi.co.id");
    await page.goto(`/batches/${second}/reception`);
    await page.locator("#edit-number").click();
    await page.locator("#bn-no").fill("B-2026-0422");
    await page.locator("#bn-save").click();
    await expect(dlg(page)).toContainText("B-2026-0422 is already used.");
    const free = second.replace(/-(\d{4})$/, (_m, n: string) => `-${String(Number(n) + 50).padStart(4, "0")}`);
    await page.locator("#bn-no").fill(free);
    await page.locator("#bn-save").click();
    await expect(page).toHaveURL(new RegExp(`/batches/${free}/reception$`));
    second = free;
    // the batch log has both steps
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "View batch log" }).click();
    await expect(dlg(page)).toContainText("Batch number changed");
    await expect(dlg(page)).toContainText("Batch created");
    void request;
  });

  test("a CSO and an analyst read a batch without edit controls (BA6)", async ({ page }, info) => {
    const phone = info.project.name === "phone";
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/batches/${second}/reception`);
    await expect(page.getByRole("heading", { name: second })).toBeVisible();
    await expect(page.locator("#print-labels")).toHaveCount(0);              // a CSO has no label.print
    await expect(page.locator("#edit-number")).toBeVisible();                // but may edit the number (batch.number.edit)
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto(`/batches/${second}/reception`);
    await expect(page.getByRole("heading", { name: second })).toBeVisible();
    await expect(page.locator("#edit-number")).toHaveCount(0);
    await expect(page.locator("#confirm-reception")).toHaveCount(0);
    await expect(page.locator("#mark-all")).toHaveCount(0);
    await expect(page.getByLabel("Mass in kg, ZE-A4")).toHaveCount(0);
    await page.goto("/batches");
    await expect(page.getByRole("button", { name: /^Prep finished \d+/ })).toHaveAttribute("aria-pressed", "true");   // the analyst's own queue
    if (!phone) await expect(page.locator("#add-batch")).toHaveCount(0);
  });

  test("the job order and batch tables sort on their heads", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "the phone shows cards, not a table");
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/batches");
    await page.getByRole("button", { name: /^All \d+/ }).click();
    const first = () => page.locator("tbody tr").first().locator("td").first();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    const head = page.locator("th", { hasText: "Batch no." });
    await page.getByRole("button", { name: "Batch no." }).click();               // ascending
    await expect(head).toHaveAttribute("aria-sort", "ascending");
    await expect.poll(async () => (await first().innerText()).slice(0, 11)).toBe("B-2026-0413");
    await page.getByRole("button", { name: "Batch no." }).click();               // descending
    await expect(head).toHaveAttribute("aria-sort", "descending");
    await expect.poll(async () => (await first().innerText()).slice(0, 11)).not.toBe("B-2026-0413");
    await page.goto("/orders");
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await page.getByRole("button", { name: "Status" }).click();
    await expect(page.locator("th", { hasText: "Status" })).toHaveAttribute("aria-sort", "ascending");
    await page.getByRole("button", { name: "Status" }).click();
    await expect(page.locator("th", { hasText: "Status" })).toHaveAttribute("aria-sort", "descending");
  });
});
