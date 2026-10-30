// Merge "01 Foundations and icons" into the Foundations frame, on the main file. Output: scratch/merged.figcraft
const fs = require("fs"), cp = require("child_process");
const { B, TS } = require("./dsl.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft";
const MAIN = dir + "/SGSI-LIMS-screens.figcraft";
const j = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/cur2.json"));
const b = new B(j.next_id);

// 1. typography: replace the loose Scale column with one row per text style
b.raw("edit.delete", { ids: [1645] });
const scale = b.frame(1628, { name: "Scale", w: 832, h: 400, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" });
b.raw("node.reparent", { ids: [scale], parent: 1628, index: 1 });
const SAMPLE = (s) => (/^(Heading|Display|Number)/.test(s) ? "Laboratory operations" : s === "Lead" ? "Independent coal testing, Samarinda — East Kalimantan." : s === "Overline" ? "COMPANY · WORK · REPORT" : s.startsWith("Data") ? "6,257 kcal/kg ADB" : "Sample info locks after preparation starts.");
for (const [name, [ff, fst, size, lh]] of Object.entries(TS)) {
  const row = b.frame(scale, { name, w: 832, h: 70, layout: "v", gap: 4, pad: [14, 0, 14, 0], sizeH: "fill", sizeV: "hug", stroke: "none" });
  b.text(row, `${name}  ·  ${size} / ${lh}  ·  ${ff} ${fst}`, { style: "Caption/Medium", color: "Text/text-muted", name: "Spec", fill: true });
  b.text(row, SAMPLE(name), { style: name, name: "Sample", fill: true });
  b.frame(row, { name: "Divider", w: 832, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
}
// 2. elevation specimens use the effect styles
const E = ["2xs", "xs", "md", "lg", "xl", "2xl"];
[[40503, 40505, 40507, 40509, 40511, 40513], [40542, 40544, 40546, 40548, 40550, 40552]].forEach((ids) => ids.forEach((id, i) => b.raw("style.apply", { ids: [id], style: "Elevation/" + E[i] })));
// 3. iconography: the real Icon set replaces the loose icon grid
b.raw("edit.delete", { ids: [1807] });
b.raw("node.reparent", { ids: [40890], parent: 1800 });
b.raw("node.set", { ids: [1806], props: { characters: "Phosphor Icons (phosphoricons.com), Regular weight. One Icon component set: pick a Glyph and a Size (14 or 20), or swap the glyph on an instance with the Icon property. The colour follows the text colour of the parent; override the fill on the instance." } });
b.applyTextStyles();
// 4. remove the merged frame
b.raw("edit.delete", { ids: [40843] });
b.raw("file.save", { path: dir + "/scratch/merged.figcraft" });
fs.writeFileSync(dir + "/scratch/merge.json", JSON.stringify(b.steps));
const r = cp.spawnSync(CLI, ["run", dir + "/scratch/merge.json", "--in", MAIN], { encoding: "utf8", maxBuffer: 1 << 28 });
const lines = r.stdout.split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
const errs = lines.filter((l) => !l.ok);
console.log(`steps ${b.steps.length}, errors ${errs.length}`);
errs.slice(0, 5).forEach((e) => console.log(JSON.stringify(e).slice(0, 300)));
