// Removes the Side sheet component (owner, Nov 5, 2026: every form is a centered Dialog): node dropsheet.js <in> <out>
// Instances left behind (the owner's "Add client modal ref") are detached first, so they keep their look.
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/dropsheet.json"]);
const N = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/dropsheet.json")).nodes;
const set = Object.keys(N).find((k) => N[k].type === "componentSet" && N[k].name === "Side sheet");
const steps = [];
if (set) {
  const vars = N[set].children;
  const inst = Object.keys(N).filter((k) => N[k].type === "instance" && vars.includes(N[k].component)).map(Number);
  console.log("Side sheet found, instances to detach:", inst.map((k) => k + " " + N[k].name));
  if (inst.length) steps.push({ command: "component.detach", params: { ids: inst } });
  steps.push({ command: "edit.delete", params: { ids: [Number(set)] } });
} else console.log("no Side sheet component");
steps.push({ command: "file.save", params: { path: o } });
run({ steps, expect: [] }, i, o, "dropsheet");
