// Top bar bell badge (owner, Nov 6, 2026): the Unread badge sat at a fixed distance from the right edge, so a wider
// user chip (Rina Kartika, Customer Service Officer) put it on the avatar. Now the bell and its badge share a 36 x 36
// "Bell" frame, so the badge follows the bell; the badge gets the Elevation/xs effect style.
// node topbell.js <in> <out>   (pass 1 creates the frames; pass 2 moves the layers, because frames added to a main
// component are copied into every instance and their ids cannot be predicted)
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
const mid = o.replace(/\.figcraft$/, ".pass1.figcraft");
const load = (f) => { cp.execFileSync(CLI, ["convert", f, "C:/Users/pc/AppData/Local/Temp/topbell.json"]); return JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/topbell.json")); };
const topbar = (N) => Object.values(N).find((n) => n.type === "componentSet" && n.name === "Top bar");
const isBell = (N, c) => N[c].type === "instance" && N[c].name === "Icon button" && (N[c].children || []).some((k) => N[k].component && /Glyph=bell/.test(N[N[k].component].name));

// ---- pass 1: one empty "Bell" frame per variant
let J = load(i), N = J.nodes;
const steps1 = [];
for (const vid of topbar(N).children) {
  if (N[vid].children.some((c) => N[c].name === "Bell")) throw new Error("already patched");
  steps1.push({ command: "node.create", params: { type: "frame", name: "Bell", parent: vid, width: 36, height: 36, props: { fill: "none", clip: false } } });
}
steps1.push({ command: "file.save", params: { path: mid } });
run({ steps: steps1, expect: [] }, i, mid, "topbell1");

// ---- pass 2: bell and badge into the frame, the frame where the bell was, the badge on the bell's top-right corner
J = load(mid); N = J.nodes;
const steps2 = [];
for (const vid of topbar(N).children) {
  const kids = N[vid].children;
  const bell = kids.find((c) => isBell(N, c)), badge = kids.find((c) => N[c].name === "Unread"), frame = kids.find((c) => N[c].name === "Bell");
  if (!bell || !badge || !frame) throw new Error("missing layer in " + N[vid].name);
  const at = kids.indexOf(bell);
  steps2.push({ command: "node.reparent", params: { ids: [bell], parent: frame } });
  steps2.push({ command: "node.set", params: { ids: [bell], props: { x: 0, y: 0 } } });
  steps2.push({ command: "node.reparent", params: { ids: [badge], parent: frame } });
  steps2.push({ command: "node.set", params: { ids: [badge], props: { absolute: false, x: 22, y: -4, constraints: { horizontal: "left", vertical: "top" } } } });
  steps2.push({ command: "style.apply", params: { ids: [badge], style: "Elevation/xs" } });
  steps2.push({ command: "node.reparent", params: { ids: [frame], parent: vid, index: at } });
}
steps2.push({ command: "file.save", params: { path: o } });
run({ steps: steps2, expect: [] }, mid, o, "topbell2");
fs.unlinkSync(mid);
