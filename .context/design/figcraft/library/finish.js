// final step: delete the old components and screen-era frames, lay out the new frames in one row, save
const fs = require("fs"), cp = require("child_process");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft/scratch";
const info = JSON.parse(cp.execFileSync(CLI, ["info", dir + "/lib.figcraft", "--json"], { encoding: "utf8", maxBuffer: 1 << 28 }));
const F = info.pages[0].frames;
const byName = (n) => F.find((f) => f.name === n), startsWith = (p) => F.find((f) => f.name.startsWith(p) && f.id >= 40843);
const OLD = [2, 448, 563, 1864, 2820, 25790, 39625, 39626, 562];
const order = [byName("Foundations"), F.find((f) => f.name === "Components" && f.id >= 40843), ...["01", "02", "03", "04", "05", "06", "07", "08"].map(startsWith), byName("Brand Components")].filter(Boolean);
const logoSet = F.find((f) => f.name === "Logo");
if (logoSet) order.push(logoSet);
const steps = [{ command: "edit.delete", params: { ids: OLD } }];
let x = 0;
for (const f of order) { steps.push({ command: "node.set", params: { ids: [f.id], props: { x, y: 0 } } }); x += Math.ceil(f.width) + 240; }
steps.push({ command: "file.save", params: { path: dir + "/final.figcraft" } });
fs.writeFileSync(dir + "/finish.json", JSON.stringify(steps));
const r = cp.spawnSync(CLI, ["run", dir + "/finish.json", "--in", dir + "/lib.figcraft"], { encoding: "utf8", maxBuffer: 1 << 28 });
const lines = r.stdout.split("\n").filter(Boolean);
console.log(lines.map((l) => l.slice(0, 160)).join("\n"));
