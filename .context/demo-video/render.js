/* Render one chapter (or all): node render.js 01   |   node render.js all
   Records the prototype in Chromium (1440x810 layout, captured at 1920x1080), then
   encodes to out/clips/<name>.mp4 with ffmpeg, trimming the page-load seconds. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const { makeApi, sleep } = require("./lib");

const HERE = __dirname;
const PROTO = path.resolve(HERE, "../prototype/sgsi-lims-prototype.html");
const OVERLAY = fs.readFileSync(path.join(HERE, "overlay/overlay.js"), "utf8");
const CHROME = process.env.CHROME_PATH || path.join(process.env.USERPROFILE || process.env.HOME, "AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe");
const OUT = path.join(HERE, "out");
// the built page has no <meta charset>; from disk Chromium then misreads UTF-8 ("…" shows as "â€¦"), so serve a copy that declares it
fs.mkdirSync(OUT, { recursive: true });
const PAGE = path.join(OUT, "prototype-utf8.html");
fs.writeFileSync(PAGE, '<meta charset="utf-8">' + fs.readFileSync(PROTO, "utf8"), "utf8");

async function renderChapter(file) {
  const name = path.basename(file, ".js");
  const chapter = require(path.join(HERE, "chapters", file));
  const tmp = path.join(OUT, "tmp", name);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(OUT, "clips"), { recursive: true });

  const browser = await chromium.launch({ executablePath: fs.existsSync(CHROME) ? CHROME : undefined });
  const t0 = Date.now();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 810 },
    recordVideo: { dir: tmp, size: { width: 1440, height: 810 } },
    deviceScaleFactor: 1,
  });
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  page error:", e.message));
  await page.goto("file:///" + PAGE.replace(/\\/g, "/"));
  await page.waitForSelector(".stage", { timeout: 30000 });
  await page.waitForFunction(() => window.__demo, null, { timeout: 5000 });

  const api = makeApi(page);
  // cover the page at once so the load frames never show, and note when the clip really starts
  await page.evaluate(() => window.__demo.card("SGSI LIMS", "…", ""));
  const startedAt = (Date.now() - t0) / 1000;
  try { await chapter.run(api, page); }
  catch (e) { await page.screenshot({ path: path.join(OUT, name + "-FAIL.png") }); await browser.close(); throw e; }
  await api.hush(); await sleep(400);

  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  await browser.close();

  const mp4 = path.join(OUT, "clips", name + ".mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(Math.max(0, startedAt - 0.1)), "-i", webm,
    "-vf", "scale=1920:1080:flags=lanczos,fps=30", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
  fs.rmSync(tmp, { recursive: true, force: true });
  const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim();
  console.log(`${name}: ${Number(dur).toFixed(1)} s -> ${mp4}`);
}

(async () => {
  const arg = process.argv[2] || "all";
  const files = fs.readdirSync(path.join(HERE, "chapters")).filter((f) => f.endsWith(".js")).sort();
  const pick = arg === "all" ? files : files.filter((f) => f.startsWith(arg));
  if (!pick.length) { console.log("No chapter matches", arg); process.exit(1); }
  for (const f of pick) await renderChapter(f);
})().catch((e) => { console.error(e); process.exit(1); });
