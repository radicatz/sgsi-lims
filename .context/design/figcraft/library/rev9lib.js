// Revision 9, stage P1: library component "Coverage tag". node rev9lib.js <in> <out>
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
require("./screens/shell.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/r9.json"]);
const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/r9.json"));
const N = J.nodes;
const b = new B(J.next_id).useReg(loadReg(J)).regSets();
if (b.reg.sets["Coverage tag"]) throw new Error("Coverage tag exists already");
const pill = Object.values(N).find((n) => n.type === "componentSet" && n.name === "Parameter pill");
const holder = N[pill.parent], section = N[holder.parent];
const hx = holder.transform ? holder.transform[4] : 0, hy = holder.transform ? holder.transform[5] : 0;
const KINDS = { "ISO and GB/T": ["ISO", "GB/T"], "ISO": ["ISO"], "GB/T": ["GB/T"], "Subcontracted": ["SUB"] };
b.set(section.id, "Coverage tag", Object.entries(KINDS).map(([k, parts]) => ({
  name: `Kind=${k}`, w: 40, h: 14, frame: { fill: "Accent/accent-100", r: 4, layout: "h", gap: 3, pad: [0, 4, 0, 4], main: "center", cross: "center", sizeH: "hug", sizeV: "hug" },
  build(cid) {
    const refs = {};
    parts.forEach((t, j) => {
      const id = b.text(cid, t, { style: "Data", color: "Accent/accent-text", name: j ? "Standard " + (j + 1) : "Standard" });
      b.raw("node.set", { ids: [id], props: { fontSize: 10, lineHeight: 14 } });
      b.textIds.Data.pop(); // 10 px mono: no text style
      refs[j ? "Standard " + (j + 1) : "Standard"] = id;
    });
    return refs;
  } })), { cols: 4, cw: 120, ch: 40, W: 520, H: 80 });
const info = b.sets["Coverage tag"];
b.raw("node.set", { ids: [info.holder], props: { x: hx + 360, y: hy } });
b.raw("file.save", { path: o });
const r = run(b, i, o, "rev9P1");
console.log(JSON.stringify({ section: section.name, hx, hy, holder: holder.name, variants: Object.keys(info.variants), ids: Object.fromEntries(Object.entries(info.variants).map(([k, v]) => [k, v.id])) }));
