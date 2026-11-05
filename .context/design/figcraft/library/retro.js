// Role sidebar for the frames of rows A and B (their generators are not part of the build chain): node retro.js <in> <out>
// Hides, on every CSO job order list and create frame, the sidebar items a CSO cannot use (Navigation_Screen_Plan.md).
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const HIDE = ["Input ROA", "Review ROA", "Drill hole", "Lithology", "Seam", "ADMIN", "Users", "Configuration", "Audit log"];
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/retro.json"]);
const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/retro.json")), N = J.nodes;
const first = (id) => { const n = N[id]; if (n.type === "text") return n.characters; for (const c of n.children || []) { const r = first(c); if (r !== undefined) return r; } };
const steps = []; let frames = 0;
for (const p of J.pages) { if (N[p].name === "Library") continue; for (const c of N[p].children) { const f = N[c]; if (!/^(Desktop|Tablet)-03-Job_orders-0[12]-/.test(f.name || "")) continue;
  let sb; (function w(id) { const n = N[id]; if (sb || !n) return; if (n.type === "instance" && /^Sidebar/.test(n.name || "")) { sb = id; return; } (n.children || []).forEach(w); })(c);
  if (!sb) continue; frames++;
  const ids = [], div = [];
  for (const k of N[sb].children || []) { const n = N[k]; if (n.type === "instance" && HIDE.includes(first(k))) ids.push(k); if (n.type === "frame" && n.name === "Divider") div.push(k); }
  if (div.length === 2) ids.push(div[1]);
  if (ids.length) steps.push({ command: "node.set", params: { ids, props: { visible: false } } }); } }
console.log("frames", frames, "steps", steps.length);
steps.push({ command: "file.save", params: { path: o } });
run({ steps, expect: [] }, i, o, "retro");
