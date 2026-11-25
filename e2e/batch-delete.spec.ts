// Delete a batch (spec D-30, S-07; Open_Points_Check_Nov25.md M-4) at 1440, 834 and 390: a Created batch where nothing has arrived can be deleted from
// the batch page's menu; its samples go back to the job order, ready for another batch. Once a sample has arrived, the menu has no Delete.
// Test values start with ZE and are removed afterwards. Needs `pnpm seed:orders`.
import { execSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const API = "http://localhost:4000/api";
async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.locator("#si-email").fill(email);
  await page.locator("#si-pw").fill(PW);
  await page.locator("#si-submit").click();
  await expect(page.locator(".frame")).toBeVisible();
}
const cleanup = () => execSync("npx tsx --env-file=../../.env scripts/cleanup-test-data.ts", { cwd: "apps/api", stdio: "pipe" });

/** A submitted job order with two expected samples and one batch holding both, made through the API. Returns the batch number. */
async function seedBatch(request: APIRequestContext, no: string): Promise<string> {
  const token = ((await (await request.post(`${API}/auth/sign-in`, { data: { email: "rina@sgsi.co.id", password: PW } })).json()) as { accessToken: string }).accessToken;
  const h = { authorization: `Bearer ${token}` };
  const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
  const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
  expect((await request.post(`${API}/orders`, { headers: h, data: { orderNo: no, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE delete ${no}`, standards: ["ASTM"],
    parameterIds: ["PREP", "TM", "IM", "ASH"].map(pid), expectedSamples: 2, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } })).status()).toBe(201);
  expect((await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: ["ZE-D1", "ZE-D2"].map((c) => ({ clientRef: c, description: `Ply ${c}` })), removed: [] } })).status()).toBe(200);
  const f = (await (await request.get(`${API}/orders/${no}/batch-form`, { headers: h })).json()) as { nextBatchNo: string; batchDate: string; samples: Array<{ id: string }>; parameters: Array<{ id: string; inOrder: boolean }> };
  const made = await request.post(`${API}/batches`, { headers: h, data: { orderNo: no, batchNo: f.nextBatchNo, batchDate: f.batchDate, deadlineOn: null, standard: "ASTM", sampleIds: f.samples.map((s) => s.id),
    parameterIds: f.parameters.filter((p) => p.inOrder).map((p) => p.id), cocNo: "", priority: "Standard", notes: "" } });
  expect(made.status()).toBe(201);
  return f.nextBatchNo;
}

test.describe.serial("delete a batch", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });

  test("a Created batch with nothing arrived is deleted, and its samples go back to the job order", async ({ page, request }, info) => {
    const order = `ZE-JO-09${["desktop", "tablet", "phone"].indexOf(info.project.name)}`;
    const batch = await seedBatch(request, order);
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/batches/${batch}/reception`);
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete batch" }).click();
    await expect(page.getByRole("dialog", { name: `Delete ${batch}?` })).toContainText(`back to ${order}`);
    await page.getByRole("button", { name: "Delete batch", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order}/batches`));
    await expect(page.getByText("No batches yet")).toBeVisible({ timeout: 20_000 });
    const r = await page.request.get(`/batches/${batch}`);
    expect(r.status()).toBeLessThan(500);
  });

  test("once a sample has arrived, the batch can't be deleted", async ({ page, request }, info) => {
    const order = `ZE-JO-08${["desktop", "tablet", "phone"].indexOf(info.project.name)}`;
    const batch = await seedBatch(request, order);
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/batches/${batch}/reception`);
    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Delete batch" })).toBeVisible();
    await page.keyboard.press("Escape");
    // tick one sample as arrived through the API, then the menu no longer offers Delete and the API refuses it
    const res = await page.evaluate(async (no) => {
      const tok = JSON.parse(localStorage.getItem("sgsi.session")!).accessToken, h = { authorization: `Bearer ${tok}`, "content-type": "application/json" };
      const all = await fetch(`/api/batches/${no}/arrive-all`, { method: "POST", headers: h, body: "{}" });
      const del = await fetch(`/api/batches/${no}`, { method: "DELETE", headers: { authorization: `Bearer ${tok}` } });
      return { all: all.status, del: del.status };
    }, batch);
    expect(res.all).toBeLessThan(300);
    expect(res.del).toBe(409);
    await page.reload();
    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Delete batch" })).toHaveCount(0);
  });
});
