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
const b = new B(J.next_id).useReg(reg).regSets();
b.logo = {};
const rows = (process.argv[2] || "A").split(",");
// pages
if (rows.includes("A")) { b.raw("page.rename", { id: 1, name: "Library" }); b.raw("page.add", { name: "Job orders" }); b.id += 1; }
else {
  const byName = (n) => J.pages.find((id) => J.nodes[id].name === n);
  b.pageIds = { desktop: byName("Desktop"), tablet: byName("Tablet"), phone: byName("Mobile Phone") };
}
for (const id of Object.keys(J.nodes)) { const n = J.nodes[id]; if (n.type === "frame" && n.name === "Samples · P5 Locked row tooltip · Desktop" && n.var_modes) b.raw("node.set", { ids: [+id], props: { name: "Samples · P5 Locked row tooltip · Desktop dark reference" } }); }
for (const r of rows) require("./row" + r + ".js").build(b);
b.applyTextStyles();
b.raw("file.save", { path: process.env.OUT || dir + "/scratch/screens.figcraft" });
const res = run(b, MAIN, process.env.OUT || dir + "/scratch/screens.figcraft", "screens");
module.exports = { b, res };
