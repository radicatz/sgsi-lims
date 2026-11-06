// Row L/M desktop pages (owner, Nov 6, 2026): the two-column row has a fixed height (its tallest card) and the left card fills it.
// node colsfill.js <in> <out>  (run after the build chain)
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/colsfill.json"]);
const N = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/colsfill.json")).nodes;
const steps = [];
const top = (id) => { let n = N[id]; while (N[n.parent] && N[N[n.parent].parent] && N[n.parent].type !== "page") n = N[n.parent]; return N[id] && n; };
const root = (id) => { let n = N[id]; while (N[n.parent] && N[n.parent].type !== "page") n = N[n.parent]; return n; };
for (const k of Object.keys(N)) {
  const n = N[k];
  if (n.type !== "frame" || n.name !== "Columns") continue;
  if (!/^Desktop-08-Search-(02|03|04)-/.test(root(+k).name || "")) continue;
  const kids = (n.children || []).map((c) => N[c]);
  const left = kids.find((c) => /^(Types|Saved queries|Sample) card$/.test(c.name));
  if (!left) continue;
  const h = Math.max(...kids.map((c) => c.height));
  const rt = root(+k), main = N[n.parent];
  // a page shorter than the viewport lets Main and the row fill it; a longer page gets a fixed row height (the tallest card)
  if (rt.height <= 1030 && main && main.name === "Main") { steps.push({ command: "node.set", params: { ids: [main.id], props: { sizingV: "fill" } } }); steps.push({ command: "node.set", params: { ids: [+k], props: { sizingV: "fill" } } }); }
  else steps.push({ command: "node.set", params: { ids: [+k], props: { sizingV: "fixed", height: h } } });
  steps.push({ command: "node.set", params: { ids: [left.id], props: { sizingV: "fill" } } });
}
steps.push({ command: "file.save", params: { path: o } });
console.log("columns rows:", steps.filter((x) => x.params.ids && x.params.props && x.params.props.sizingV && x.params.ids.length).length);
run({ steps, expect: [] }, i, o, "colsfill");
