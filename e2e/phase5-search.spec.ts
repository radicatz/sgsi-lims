// Phase 5, slice B (Phase5_Build_Design.md section 10.9) at 1440, 834 and 390: quick search, the results page, advanced search with its columns and CSV export, saved queries
// (shared between two people), the types each role finds, and Sample history with the History entries in the row menus. Needs `pnpm seed:master`, `seed:demo`,
// `seed:batches`, `seed:reports` and `seed:search`. It saves and deletes its own query; nothing else is changed.
import { expect, test, type Page } from "@playwright/test";

const PW = process.env.DEMO_PASSWORD!;
const SAMPLE = "SG.261015.008.RI.001";   // JO-2026-0120, batch B-2026-0450 (completed, CoA sent), client reference PTBA-3300
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

test.describe("search", () => {
  test("SR1: quick search shows grouped hits, marks the exact Sample ID, and keys work", async ({ page }, info) => {
    test.skip(info.project.name === "phone", "the phone has no top bar search; its start screen is SR2");
    await signIn(page, "maya@sgsi.co.id");
    await page.locator("#qs-input").click();
    await page.locator("#qs-input").fill("b-2026-04");
    await expect(page.locator("#qs-panel")).toContainText("Batches", { timeout: 20_000 });
    await expect(page.locator("#qs-all")).toContainText("See all");
    await page.keyboard.press("Escape");
    await expect(page.locator("#qs-panel")).toHaveCount(0);
    await page.locator("#qs-input").click();
    await page.locator("#qs-input").fill(SAMPLE);
    await expect(page.locator("[data-go]")).toContainText(SAMPLE, { timeout: 20_000 });
    await expect(page.locator("[data-go]")).toContainText("Go to");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/samples\/[0-9a-f-]+\/history/);
    await page.locator("#qs-input").click();
    await page.locator("#qs-input").fill("PTBA");
    await expect(page.locator("#qs-all")).toContainText('"PTBA"', { timeout: 20_000 });
    await page.locator("#qs-all").click();
    await expect(page).toHaveURL(/\/search\?q=PTBA/);
    await page.locator("#qs-input").click();
    await page.locator("#qs-input").fill("XK-77-nothing");
    await expect(page.locator("#qs-none")).toContainText("No match", { timeout: 20_000 });
  });

  test("SR2: results are grouped per type with counts; Show all opens one type; nothing matches is explained; the phone starts with Recent", async ({ page }, info) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/search?q=PTBA");
    await expect(page.getByRole("heading", { name: 'Results for "PTBA"' })).toBeVisible();
    await expect(page.locator("#sr-groups")).toContainText("Samples", { timeout: 30_000 });
    if (info.project.name === "desktop") await expect(page.locator("#sr-types")).toContainText("Drill holes");
    await page.getByRole("button", { name: "Show all" }).first().click();
    await expect(page).toHaveURL(/type=/);
    await expect(page.locator("#sr-rows .hit-row").first()).toBeVisible();
    await page.goto("/search?q=XK-77-nothing");
    await expect(page.getByText('Nothing matches "XK-77-nothing"')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("#sr-advanced, .empty button").first()).toBeVisible();
    await page.goto("/search");
    await expect(page.locator("#sr-q")).toBeVisible();
  });

  test("SR3: advanced search runs conditions, Match any widens, Columns re-runs, a change marks out of date, CSV downloads", async ({ page }, info) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/search/advanced");
    const c1 = page.locator('[data-cond="1"]');
    await c1.locator("select").nth(0).selectOption("drill_hole");
    await c1.locator("select").nth(1).selectOption("contains");
    await c1.locator("input[aria-label$='value']").fill("PTBA");
    await page.locator("#adv-search").click();
    await expect(page.getByText(/^\d+ samples?$/)).toBeVisible({ timeout: 30_000 });
    const all = Number((await page.getByText(/^\d+ samples?$/).innerText()).split(" ")[0]);
    expect(all).toBeGreaterThan(0);
    await page.locator("#adv-add").click();
    const c2 = page.locator('[data-cond="2"]');
    await c2.locator("select").nth(0).selectOption("client_ref");
    await c2.locator("select").nth(1).selectOption("is");
    await c2.locator("input[aria-label$='value']").fill("BNM-3302");
    await expect(page.getByText("Out of date, search again")).toBeVisible();
    await page.getByRole("button", { name: "Any", exact: true }).click();
    await page.locator("#adv-search").click();
    await expect(page.getByText(`${all + 1} samples`)).toBeVisible({ timeout: 30_000 });
    if (info.project.name !== "phone") {
      await page.locator("#adv-columns").click();
      await page.locator("#adv-col-menu").getByLabel("Client", { exact: true }).check();
      await expect(page.locator("th", { hasText: "Client" }).first()).toBeVisible({ timeout: 30_000 });
    }
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#adv-export").click()]);
    expect(dl.suggestedFilename()).toMatch(/\.csv$/);
  });

  test("SR4: a saved query is shared with staff, opened by another person, renamed and deleted by its owner", async ({ page }, info) => {
    const desk = info.project.name === "desktop", name = `E2E query ${Date.now() % 100000}`, renamed = `${name} b`;
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/search/advanced");
    const c1 = page.locator('[data-cond="1"]');
    await c1.locator("select").nth(0).selectOption("client_ref");
    await c1.locator("select").nth(1).selectOption("starts");
    await c1.locator("input[aria-label$='value']").fill("PTBA");
    await page.locator("#adv-save").click();
    await page.locator("#sq-name").fill(name);
    await page.locator("#sq-share").click();
    await page.locator("#sq-save").click();
    await expect(page.getByText("Query saved")).toBeVisible();
    // another person finds it under Shared with me (a select on tablet and phone, the list on desktop)
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/search/advanced");
    if (desk) await page.locator(`[data-sq="${name}"]`).click({ timeout: 30_000 });
    else await page.locator("#sq-select").selectOption({ label: `${name} (Maya Lestari, A.Md.)` });
    await expect(page.getByText(/^\d+ samples?$/)).toBeVisible({ timeout: 30_000 });
    // the owner renames and deletes it from the list (desktop); on tablet and phone the API removes it
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/search/advanced");
    if (!desk) {
      await page.evaluate(async (n) => {
        const tok = JSON.parse(localStorage.getItem("sgsi.session")!).accessToken, h = { authorization: `Bearer ${tok}` };
        const l = (await (await fetch("/api/saved-queries", { headers: h })).json()) as { mine: Array<{ id: string; name: string }> };
        for (const q of l.mine.filter((x) => x.name === n)) await fetch(`/api/saved-queries/${q.id}`, { method: "DELETE", headers: h });
      }, name);
      return;
    }
    await page.getByRole("button", { name: `More for ${name}` }).click();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    await page.locator("#sq-name").fill(renamed);
    await page.locator("#sq-save").click();
    await expect(page.locator(`[data-sq="${renamed}"]`)).toBeVisible();
    await page.getByRole("button", { name: `More for ${renamed}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.locator(`[data-sq="${renamed}"]`)).toHaveCount(0);
  });

  test("SR5: each role is offered only the types and targets its permissions open", async ({ page }, info) => {
    const desk = info.project.name === "desktop";
    // CSO: no drill holes (no master.read), no Results target
    await signIn(page, "rina@sgsi.co.id");
    await page.goto("/search?q=PTBA");
    await expect(page.locator(desk ? "#sr-types" : "#sr-groups, .chips")).toBeVisible({ timeout: 30_000 });
    if (desk) { await expect(page.locator("#sr-types")).not.toContainText("Drill holes"); await expect(page.locator("#sr-types")).toContainText("Clients"); }
    await page.goto("/search/advanced");
    await expect(page.locator("#adv-target option")).toHaveText(["Samples", "Batches", "Job orders"]);
    // Analyst: RoAs but no CoAs and no Clients
    await signIn(page, "fitri@sgsi.co.id");
    await page.goto("/search?q=PTBA");
    if (desk) { await expect(page.locator("#sr-types")).toBeVisible({ timeout: 30_000 }); await expect(page.locator("#sr-types")).not.toContainText("Clients"); await expect(page.locator("#sr-types")).not.toContainText("Drill holes"); }
    await page.goto("/search/advanced");
    await expect(page.locator("#adv-target option")).toHaveText(["Samples", "Batches", "Job orders", "Results"]);
    // Supervisor: drill holes yes, clients no
    await signIn(page, "hendra@sgsi.co.id");
    await page.goto("/search?q=PTBA");
    if (desk) { await expect(page.locator("#sr-types")).toBeVisible({ timeout: 30_000 }); await expect(page.locator("#sr-types")).toContainText("Drill holes"); await expect(page.locator("#sr-types")).not.toContainText("Clients"); }
  });

  test("SR6: Sample history lists the events in order, hides values from the CSO, and opens from the row menus", async ({ page }) => {
    await signIn(page, "maya@sgsi.co.id");
    await page.goto(`/search?q=${SAMPLE}&type=samples`);
    await page.locator("#sr-rows .hit-row").first().click();
    await expect(page).toHaveURL(/\/samples\/[0-9a-f-]+\/history/);
    const list = page.locator("#sh-list");
    await expect(list).toContainText("Registered on JO-2026-0120", { timeout: 30_000 });
    await expect(list).toContainText("Received and labelled");
    await expect(list).toContainText("Values entered (7 parameters)");
    await expect(list).toContainText("published");
    const text = await list.innerText();
    expect(text.indexOf("Registered on")).toBeLessThan(text.indexOf("Received and labelled"));
    await expect(page.getByRole("link", { name: "View values" })).toBeVisible();
    const url = page.url();
    // the CSO sees the entry without numbers and without the link
    await signIn(page, "rina@sgsi.co.id");
    await page.goto(url.replace(/^https?:\/\/[^/]+/, ""));
    await expect(page.locator("#sh-list")).toContainText("Values entered (7 parameters)", { timeout: 30_000 });
    await expect(page.getByRole("link", { name: "View values" })).toHaveCount(0);
    await expect(page.locator(".sh-values")).toHaveCount(0);
    // History from the job order Samples tab
    await signIn(page, "maya@sgsi.co.id");
    await page.goto("/orders/JO-2026-0120/samples");
    await page.getByRole("button", { name: /^History of/ }).first().click({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/samples\/[0-9a-f-]+\/history/);
  });

  test("SR7: owner feedback Nov 25: no-match button, Close returns, save dialog, phone rows, Export PDF", async ({ page }, info) => {
    const phone = info.project.name === "phone", desk = info.project.name === "desktop";
    await signIn(page, "maya@sgsi.co.id");
    if (!phone) {
      // no match: a ghost Open advanced search button under the text; Close goes back to the page it was opened on
      await page.goto("/work");
      await page.locator("#qs-input").click();
      await page.locator("#qs-input").fill("XK-77-nothing");
      await expect(page.locator("#qs-advanced")).toHaveClass(/ghost/, { timeout: 20_000 });
      await page.locator("#qs-advanced").click();
      await expect(page).toHaveURL(/\/search\/advanced/);
      await page.locator("#adv-close").click();
      await expect(page).toHaveURL(/\/work$/);
    }
    // the start page offers Advanced search; from the results it closes back to the same word
    await page.goto("/search");
    await expect(page.locator("#sr-advanced")).toBeVisible();
    await page.goto("/search?q=PTBA");
    await expect(page.locator("#sr-groups")).toBeVisible({ timeout: 30_000 });
    await page.locator("#sr-advanced").click();
    const c1 = page.locator('[data-cond="1"]');
    await c1.locator("select").nth(0).selectOption("drill_hole");
    await c1.locator("select").nth(1).selectOption("contains");
    await c1.locator("input[aria-label$='value']").fill("PTBA");
    await page.locator("#adv-search").click();
    await expect(page.getByText(/^\d+ samples?$/)).toBeVisible({ timeout: 30_000 });
    if (phone) await expect(page.locator("#adv-cards .adv-row").first()).toBeVisible();
    // the save dialog is a centred dialog on desktop and tablet, a sheet on the phone
    await page.locator("#adv-save").click();
    await expect(page.locator(".scrim.sheet")).toHaveCount(phone ? 1 : 0);
    if (desk) await expect(page.getByText("Saved queries appear on the left and can be run again.")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.locator("#adv-close").click();
    await expect(page).toHaveURL(/\/search\?q=PTBA$/);
    // Export PDF on Sample history (desktop and tablet; the phone frame has none)
    await page.goto(`/search?q=${SAMPLE}&type=samples`);
    await page.locator("#sr-rows .hit-row").first().click();
    await expect(page.locator("#sh-list")).toBeVisible({ timeout: 30_000 });
    if (phone) { await expect(page.locator("#sh-export")).toHaveCount(0); return; }
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.locator("#sh-export").click()]);
    expect(dl.suggestedFilename()).toMatch(/^History-.*\.pdf$/);
  });
});
