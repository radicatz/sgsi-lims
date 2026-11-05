const fs = require("fs"), cp = require("child_process");
const { B } = require("../dsl.js");
const { loadReg } = require("./reg.js");
require("./shell.js");
const run = require("../run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft";
const MAIN = process.env.MAIN_IN || dir + "/SGSI-LIMS-screens.figcraft";
const json = process.env.JSON_IN || "C:/Users/pc/AppData/Local/Temp/main.json";
cp.execFileSync(CLI, ["convert", MAIN, json]);
const J = JSON.parse(fs.readFileSync(json));
const reg = loadReg(J);
// rows H, I and J are always rebuilt last, in that order: delete their old frames here and hide them from the other rows' placement
const b = new B(J.next_id).useReg(reg).regSets();
b.logo = {};
const STALE = [[/(^|,)H(,|$)/, /^(Desktop|Tablet|Phone)-01-My_work-/, /^H  /], [/(^|,)[IJ](,|$)/, /^(Desktop|Tablet|Phone)-(02-Dashboard|00-App)-/, /^[IJ]  /]];
const staleIds = [];
for (const [on, nameRx, titleRx] of STALE) if (on.test(process.argv[2] || "")) for (const pid of J.pages) { const n = J.nodes[pid]; n.children = (n.children || []).filter((id) => { const x = J.nodes[id], hit = nameRx.test(x.name || "") || (x.name === "Row title" && titleRx.test(x.characters || "")); if (hit) staleIds.push(id); return !hit; }); }
const rows = (process.argv[2] || "A").split(",");
// pages
if (rows.includes("A")) { b.raw("page.rename", { id: 1, name: "Library" }); b.raw("page.add", { name: "Job orders" }); b.id += 1; }
else {
  const byName = (n) => J.pages.find((id) => J.nodes[id].name === n);
  b.pageIds = { desktop: byName("Desktop"), tablet: byName("Tablet"), phone: byName("Mobile Phone") };
}
for (const id of Object.keys(J.nodes)) { const n = J.nodes[id]; if (n.type === "frame" && n.name === "Samples · P5 Locked row tooltip · Desktop" && n.var_modes) b.raw("node.set", { ids: [+id], props: { name: "Samples · P5 Locked row tooltip · Desktop dark reference" } }); }
if (staleIds.length) { b.raw("edit.delete", { ids: staleIds }); }
for (const r of rows) require("./row" + r + ".js").build(b);
b.applyTextStyles();
b.raw("file.save", { path: process.env.OUT || dir + "/scratch/screens.figcraft" });
const res = run(b, MAIN, process.env.OUT || dir + "/scratch/screens.figcraft", "screens");
module.exports = { b, res };
