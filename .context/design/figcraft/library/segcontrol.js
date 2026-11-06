// Adds the Segmented control component set (owner, Nov 6, 2026): a fully rounded bar (Surface/muted, radius 999, padding 4, gap 2)
// holding 2 to 5 Segmented item instances; variants Items x Selected. node segcontrol.js <in> <out>
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/segcontrol.json"]);
const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/segcontrol.json"));
if (Object.values(J.nodes).some((n) => n.type === "componentSet" && n.name === "Segmented control")) throw new Error("already built");
const reg = loadReg(J);
const b = new B(J.next_id).useReg(reg).regSets();
const host = Number(Object.keys(J.nodes).find((k) => J.nodes[k].type === "frame" && J.nodes[k].name === "Segmented control" && J.nodes[J.nodes[k].parent].name === "01 Actions"));
const doc = Object.keys(J.nodes).find((k) => J.nodes[k].type === "text" && J.nodes[k].parent == host && /^Item sets one option/.test(J.nodes[k].characters || ""));
const LAB = ["ADB", "AR", "DB", "DAF", "Item 5"];
const variants = [];
for (const n of [2, 3, 4, 5]) for (let s = 1; s <= n; s++) variants.push({ name: `Items=${n}, Selected=${s}`, w: 60 * n, h: 36, frame: { fill: "Surface/muted", r: 999, layout: "h", gap: 2, pad: [4, 4, 4, 4], main: "min", cross: "center", sizeH: "hug", sizeV: "hug" }, build(cid) { for (let k = 1; k <= n; k++) b.instV(cid, "Segmented item", `Selected=${k === s ? "On" : "Off"}, State=Default`, { texts: { Label: LAB[k - 1] } }); } });
b.set(host, "Segmented control", variants, { cols: 4, cw: 340, ch: 56, W: 1380, H: 4 * 56 + 24 });
if (doc) b.raw("node.set", { ids: [Number(doc)], props: { characters: "Item sets one option of a small group (basis ADB / AR / DB / DAF, Match all / any, channel). The Segmented control is the fully rounded bar: choose Items (2 to 5) and Selected (the position of the selected item), then replace the item labels in the instance." } });
b.applyTextStyles();
b.raw("file.save", { path: o });
run(b, i, o, "segcontrol");
