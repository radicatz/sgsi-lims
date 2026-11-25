// Ply or composite per sample (spec section 10 "Ply/Comp*", SIM Lab Input ROA; Open_Points_Check_Nov25.md M-1) at 1440, 834 and 390: it is saved with the samples, shown on the
// job order Samples tab (desktop and tablet grids, phone cards and edit sheet), read from a paste, and shown on the Sample history card.
// Test values start with ZE and are removed afterwards. Needs `pnpm seed:orders`.
import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

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

test.describe.serial("ply or composite", () => {
  test.beforeAll(() => { cleanup(); });
  test.afterAll(() => { cleanup(); });

  test("saved with the samples, shown on the Samples tab and the history card, read from a paste", async ({ page, request }, info) => {
    const n = ["desktop", "tablet", "phone"].indexOf(info.project.name), no = `ZE-JO-07${n}`;
    const token = ((await (await request.post(`${API}/auth/sign-in`, { data: { email: "rina@sgsi.co.id", password: PW } })).json()) as { accessToken: string }).accessToken;
    const h = { authorization: `Bearer ${token}` };
    const cat = (await (await request.get(`${API}/orders/catalogue`, { headers: h })).json()) as { companies: Array<{ id: string; code: string; contacts: Array<{ id: string }> }>; parameters: Array<{ id: string; code: string }> };
    const co = cat.companies.find((c) => c.code === "BNM")!, pid = (c: string) => cat.parameters.find((p) => p.code === c)!.id;
    expect((await request.post(`${API}/orders`, { headers: h, data: { orderNo: no, companyId: co.id, contactId: co.contacts[0]!.id, clientReference: `ZE ply ${no}`, standards: ["ASTM"],
      parameterIds: ["PREP", "TM", "IM", "ASH"].map(pid), expectedSamples: 3, sampleType: "Exploration cores", dueOn: "2026-12-31", priority: "Standard", submit: true } })).status()).toBe(201);
    const put = await request.put(`${API}/orders/${no}/samples`, { headers: h, data: { rows: [
      { clientRef: "ZE-P1", description: "Ply A1", plyComp: "ply" }, { clientRef: "ZE-P2", description: "Composite A", plyComp: "comp" }, { clientRef: "ZE-P3", description: "No choice" }], removed: [] } });
    expect(put.status()).toBe(200);
    const list = (await (await request.get(`${API}/orders/${no}/samples`, { headers: h })).json()) as { items: Array<{ id: string; clientRef: string; plyComp: string | null }> };
    expect(list.items.map((s) => [s.clientRef, s.plyComp])).toEqual([["ZE-P1", "ply"], ["ZE-P2", "comp"], ["ZE-P3", null]]);

    await signIn(page, "rina@sgsi.co.id");
    await page.goto(`/orders/${no}/samples`);
    if (info.project.name === "phone") {
      await expect(page.locator(".scard", { hasText: "ZE-P2" })).toContainText("Composite");
      await page.locator(".scard", { hasText: "ZE-P1" }).click();
      await expect(page.locator("#sheet-ply")).toHaveValue("ply");
      await page.locator("#sheet-ply").selectOption("comp");
      await page.locator("#sheet-save").click();
      await expect(page.locator(".scard", { hasText: "ZE-P1" })).toContainText("Composite");
    } else {
      // the grid is always editable: each row has its own select
      const ply = (row: number) => page.getByLabel(new RegExp(`^Ply or composite, row ${row}$`));
      await expect(ply(1)).toHaveValue("ply");
      await expect(ply(2)).toHaveValue("comp");
      await expect(ply(3)).toHaveValue("");
      await ply(3).selectOption("ply");
      await page.locator("#save-samples").click();
      await expect(page.getByText("Samples saved")).toBeVisible();
      await page.reload();
      await expect(ply(3)).toHaveValue("ply");
    }

    // a paste with a Ply/Comp cell: it is taken out, so the other columns keep their places
    if (info.project.name === "desktop") {
      await page.locator("#paste-excel").click();
      await page.locator("#paste-text").fill("ZE-P4\tCore A\tComposite\tDH-BNM-022\t8.20\t8.55\nZE-P5\tCore B\tPly");
      await expect(page.getByRole("dialog").getByText("Composite", { exact: true }).first()).toBeVisible();
      await page.locator("#paste-add").click();
      await expect(page.locator(`input[value="DH-BNM-022 8.20-8.55 m"]`)).toBeVisible();
      await expect(page.getByLabel(/^Ply or composite, row 4$/)).toHaveValue("comp");
      await expect(page.getByLabel(/^Ply or composite, row 5$/)).toHaveValue("ply");
    }

    // the history card shows it
    const after = (await (await request.get(`${API}/orders/${no}/samples`, { headers: h })).json()) as { items: Array<{ id: string; clientRef: string }> };
    const id = after.items.find((s) => s.clientRef === "ZE-P2")!.id;
    await page.goto(`/samples/${id}/history`);
    await expect(page.locator("#sh-card")).toContainText("Ply or composite");
    await expect(page.locator("#sh-card")).toContainText("Composite");
  });
});
