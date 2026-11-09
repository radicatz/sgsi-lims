/* Helpers handed to every chapter: cursor moves, clicks, typing, captions, highlights, cards. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function makeApi(page) {
  let cx = 720, cy = 405;
  const api = {
    sleep,
    /* caption for as long as it takes to read (about 14 characters a second), at least minMs */
    async say(text, minMs = 2200, pos) {
      await page.evaluate(() => window.__demo.caption(null)); await sleep(260); // fade out, then in, so changes are not abrupt
      await page.evaluate(([t, p]) => window.__demo.caption(t, p), [text, pos]);
      await sleep(Math.max(minMs, text.replace(/\*\*/g, "").length * 70));
    },
    async hush() { await page.evaluate(() => window.__demo.caption(null)); },
    async box(sel, timeout = 8000) {
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: "visible", timeout });
      // keep the target clear of the caption bar (bottom) and the top bar: scroll it to the middle when it is near an edge
      const moved = await loc.evaluate((el) => {
        const r = el.getBoundingClientRect(), H = window.innerHeight;
        if (r.top > 90 && r.bottom < H - 170) return false;
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }); return true;
      });
      if (moved) await sleep(750);
      return loc.boundingBox();
    },
    /* A highlight that cannot find its target is skipped after 1.5 s with a warning, instead of freezing the video for 8 s */
    async hl(sel, pad) {
      if (!sel) return page.evaluate(() => window.__demo.highlight(null));
      let b;
      try { b = await api.box(sel, 1500); } catch (e) { console.log("  WARN highlight not found:", sel); return; }
      await page.evaluate(([b, pad]) => window.__demo.highlight(b, pad), [b, pad]);
    },
    /* One narrated step: the caption and the highlight appear together, the action (if any) runs while they are on screen,
       then both stay until the reading time is over and go away together. Do not navigate inside a step that has a highlight. */
    async step({ say, pos, hl, pad, minMs = 2200 }, action) {
      const t0 = Date.now();
      await page.evaluate(() => window.__demo.caption(null)); await sleep(150);
      if (hl) await api.hl(hl, pad);
      await page.evaluate(([t, p]) => window.__demo.caption(t, p), [say, pos]);
      if (action) await action();
      const need = Math.max(minMs, say.replace(/\*\*/g, "").length * 70), left = need - (Date.now() - t0);
      if (left > 0) await sleep(left);
      if (hl) await api.hl(null);
      await page.evaluate(() => window.__demo.caption(null));
    },
    async key(t) { await page.evaluate((k) => window.__demo.key(k), t || null); },
    async move(sel) {
      const b = await api.box(sel);
      const tx = b.x + b.width / 2, ty = b.y + b.height / 2;
      // time-based so even a short hop lasts long enough for the recorder to catch it (min 0.5 s)
      const dist = Math.hypot(tx - cx, ty - cy), dur = Math.min(1300, Math.max(500, dist * 1.1));
      const sx = cx, sy = cy, t0 = Date.now();
      for (;;) {
        const p = Math.min(1, (Date.now() - t0) / dur), e = ease(p);
        await page.mouse.move(sx + (tx - sx) * e, sy + (ty - sy) * e);
        if (p >= 1) break;
        await sleep(16);
      }
      cx = tx; cy = ty;
    },
    async click(sel, after = 700) {
      await api.move(sel); await sleep(250);
      await page.mouse.down(); await sleep(70); await page.mouse.up();
      await sleep(after);
    },
    async type(sel, text, delay = 75) {
      await api.click(sel, 200);
      await page.keyboard.press("Control+A"); await page.keyboard.press("Delete"); // fields can be pre-filled
      await page.keyboard.type(text, { delay }); await sleep(400);
    },
    /* native <select>: its popup is not drawn in the recording, so point at it and set the value */
    async select(sel, value) {
      await api.move(sel); await sleep(500);
      await page.selectOption(sel, value); await sleep(700);
    },
    /* file drop zone: the native file chooser cannot be shown, so point at the zone and attach the file */
    async upload(zone, file) {
      await api.move(zone); await sleep(600);
      await page.setInputFiles(zone + " input[type=file]", file); await sleep(1000);
    },
    async card(kicker, title, sub, ms = 3000) {
      await page.evaluate(([k, t, s]) => window.__demo.card(k, t, s), [kicker, title, sub]);
      await sleep(ms);
    },
    async cardOff() { await page.evaluate(() => window.__demo.card(null)); await sleep(450); },
    async bar(show) { await page.evaluate((s) => window.__demo.bar(s), show); await sleep(250); },
    /* Start a flow from the review bar (used off camera, under the title card) */
    async startFlow(id) {
      await api.bar(true);
      await page.locator(".rbtn", { hasText: "Flows" }).first().click();
      await page.locator("#start-" + id).click();
      await sleep(900);
      await api.bar(false);
    },
    async go(hash) { await page.evaluate((h) => { location.hash = h; }, hash); await sleep(700); },
  };
  return api;
}
module.exports = { makeApi, sleep };
