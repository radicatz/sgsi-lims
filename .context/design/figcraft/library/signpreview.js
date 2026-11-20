// Preview pass (owner, Nov 20, 2026): every certificate and RoA drawing in the Reports and Configuration frames becomes an image of the real PDF page
// (samples/make-samples.js: Gotenberg renders it in the Configuration preview's print scale, PyMuPDF rasterises it), and the pager shows the real page count.
// In place on the main file. node signpreview.js  (reads the main file, writes scratch/screens-preview.figcraft)
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
require("./screens/shell.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft", S = dir + "/samples";
const MAIN = process.env.MAIN_IN || dir + "/SGSI-LIMS-screens.figcraft", OUT = dir + "/scratch/screens-preview.figcraft", json = "C:/Users/pc/AppData/Local/Temp/preview.json";
cp.execFileSync(CLI, ["convert", MAIN, json]);
const J = JSON.parse(fs.readFileSync(json)), reg = loadReg(J), N = reg.N;
const b = new B(J.next_id).useReg(reg).regSets();
const PAGES = 4;
const KEY = (name) => {
  let m = /^(Desktop|Tablet)-07-Reports-02-CoA-(\d\d)-/.exec(name);
  if (m) return ["01", "02", "03", "10", "11", "12", "13", "14"].includes(m[2]) ? "coa-draft-sbh" : m[2] === "08" ? "coa-signed-bnm-r1" : "coa-signed-ptba";
  if (name === "Desktop-14-Configuration-06-Report_templates-02-New_version") return "coa-draft-ptba-rev3";
  if (/^Desktop-07-Reports-03-RoA-0[12]-/.test(name)) return "roa-0412";
  return null;
};
const walk = (id, fn, parent = null) => { fn(N[id], id, parent); (N[id].children || []).forEach((c) => walk(c, fn, id)); };
const log = [];
for (const pid of J.pages) for (const top of N[pid].children || []) {
  const t = N[top]; if (t.type !== "frame" || / ref$/.test(t.name || "")) continue;
  const key = KEY(t.name || ""); if (!key) continue;
  const pages = [], pager = [];
  walk(top, (n, id, parent) => { if (n.name === "Document page") pages.push({ id, parent }); if (n.type === "text" && /^Page 1 of \d+$/.test(n.characters || "") && n.name === "Page") pager.push(id); });
  const inside = new Set(); for (const p of pages) walk(p.id, (n, id) => inside.add(id));
  for (let i = pager.length - 1; i >= 0; i--) if (inside.has(pager[i])) pager.splice(i, 1);
  for (const p of pages) {
    b.raw("edit.delete", { ids: [p.id] });
    const id = b.step("image.place", { path: `${S}/${key}-p1.png`, parent: p.parent, x: 0, y: 0, width: 595, height: 841, name: "Document page" }, 1);
    b.raw("style.apply", { ids: [id], style: "Elevation/md" });
  }
  for (const id of pager) b.raw("node.set", { ids: [id], props: { characters: `Page 1 of ${PAGES}` } });
  log.push(`${t.name}: ${key}, ${pages.length} page, ${pager.length} pager`);
}
console.log(log.join("\n"));
b.raw("file.save", { path: OUT });
run(b, MAIN, OUT, "preview");
