// Phone stepper (owner design, frame "Phone-04-Batches-02-Batch_detail-01-Reception_receiving ref"): a horizontal stepper, steps 104 wide, line through
// the markers, in a clipped window that shows the current step in the middle (the app scrolls the same way). Replaces the vertical list in every phone
// frame that still has it. In place: node.set / delete / create inside each "Stepper card"; frames with the new design are skipped.
// node stepperphone.js        (reads the main file, writes scratch/screens.figcraft)
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
require("./screens/shell.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft";
const MAIN = process.env.MAIN_IN || dir + "/SGSI-LIMS-screens.figcraft", json = "C:/Users/pc/AppData/Local/Temp/stepper.json";
cp.execFileSync(CLI, ["convert", MAIN, json]);
const J = JSON.parse(fs.readFileSync(json)), reg = loadReg(J), N = reg.N;
const b = new B(J.next_id).useReg(reg).regSets(); b.logo = {};
const page = J.pages.find((id) => N[id].name === "Mobile Phone");
b.pageIds = { phone: page };
const texts = (i, o = []) => { const n = N[i]; if (n.type === "text") o.push(n); (n.children || []).forEach((c) => texts(c, o)); return o; };
const find = (i, nm) => { const n = N[i]; if (n.name === nm) return i; for (const c of n.children || []) { const r = find(c, nm); if (r) return r; } return null; };
const STW = 104, WIN = 326;
const stateOf = (c) => { const v = reg.byVariant[N[c].component]; const m = v && /State=(\w+)/.exec(v.variant); return m ? m[1] : null; };
const log = [];
b.raw("page.select", { id: page });
for (const fid of N[page].children) {
  const f = N[fid]; if (f.type !== "frame" || / ref$/.test(f.name)) continue;
  const cardId = find(fid, "Stepper card"); if (!cardId) continue;
  const card = N[cardId];
  const kids = (card.children || []).filter((c) => N[c].type === "instance" && reg.byVariant[N[c].component] && /Orientation=Vertical/.test(reg.byVariant[N[c].component].variant));
  if (!kids.length) { log.push(`skip ${f.name} (already new)`); continue; }
  const steps = kids.map((c) => { const t = texts(c); return { st: stateOf(c), title: t[0].characters, meta: t[1] ? t[1].characters : "" }; });
  const n = steps.length, cur = Math.max(0, steps.findIndex((s) => s.st === "Current") >= 0 ? steps.findIndex((s) => s.st === "Current") : steps.map((s) => s.st).lastIndexOf("Done"));
  const off = Math.max(0, Math.min(cur * STW + STW / 2 - WIN / 2, n * STW - WIN));
  b.raw("edit.delete", { ids: card.children });
  const win = b.frame(cardId, { name: "Frame", w: WIN, h: 66, fill: "Surface/card", clip: true, sizeH: "fill", sizeV: "fixed" });
  const row = b.frame(win, { name: "Stepper", x: -off, y: 0, w: n * STW, h: 66, layout: "h", gap: 0, sizeH: "fixed", sizeV: "hug" });
  b.frame(row, { name: "Track", w: STW * (n - 1), h: 2, fill: "Surface/border-strong", absolute: true, x: STW / 2, y: 11, sizeH: "fixed", sizeV: "fixed" });
  if (cur > 0) b.frame(row, { name: "Progress", w: STW * Math.min(cur, n - 1), h: 2, fill: "Feedback/success", absolute: true, x: STW / 2, y: 11, sizeH: "fixed", sizeV: "fixed" });
  steps.forEach((s) => b.instV(row, "Stepper step", `State=${s.st}, Orientation=Horizontal`, { texts: { 0: s.title, 1: s.meta }, props: { width: STW, sizingH: "fixed" } }));
  log.push(`${f.name}: ${n} steps, current ${cur + 1}, offset ${Math.round(off)}`);
}
console.log(log.join("\n"));
b.applyTextStyles();
b.raw("file.save", { path: dir + "/scratch/screens.figcraft" });
run(b, MAIN, dir + "/scratch/screens.figcraft", "stepper");
