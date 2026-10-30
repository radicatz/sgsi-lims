// Foundations "Dark mode" stage: switch it to the Dark variable mode, bind swatches to the tokens, show real components.
const fs = require("fs"), cp = require("child_process");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft";
const j = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/cur3.json"));
const N = {}; (Array.isArray(j.nodes) ? j.nodes : Object.values(j.nodes)).forEach((n) => (N[n.id] = n));
const kids = {}; Object.values(N).forEach((n) => { if (n.parent != null) (kids[n.parent] = kids[n.parent] || []).push(n.id); });
const cnt = (i) => 1 + (kids[i] || []).reduce((a, c) => a + cnt(c), 0);
const variant = (setName, vname) => { const s = Object.values(N).find((n) => n.type === "componentSet" && n.name === setName); const v = kids[s.id].map((i) => N[i]).find((n) => n.name === vname); if (!v) throw new Error(setName + " / " + vname); return { id: v.id, size: cnt(v.id) }; };

const tok = JSON.parse(fs.readFileSync(dir + "/tokens/sgsi-tokens.json")).meta.variables;
const dark = {}; const hx = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
Object.values(tok).filter((v) => v.resolvedType === "COLOR").forEach((v) => (dark[v.name] = hx(v.valuesByMode["VariableCollectionId:1/mode2"])));

const steps = [];
const raw = (command, params) => steps.push({ command, params });
raw("variable.setMode", { ids: [1550], collection: "SGSI tokens", mode: "Dark" });
raw("variable.bind", { ids: [1550], field: "fill", variable: "Surface/background" });
// swatches: [swatch frame id, chip id, hex id, token]
const SW = [[1552, "Surface/background"], [1556, "Surface/shell"], [1560, "Surface/card"], [1564, "Surface/border-strong"], [1568, "Primary/primary"], [1572, "Primary/primary-deep"], [1576, "Accent/accent"], [1580, "Action/action"], [1584, "Action/brand-text"], [1588, "Text/foreground"], [1592, "Text/text-muted"]];
for (const [sw, name] of SW) {
  const [chip, , hex] = kids[sw];
  raw("variable.bind", { ids: [chip], field: "fill", variable: name });
  raw("node.set", { ids: [hex], props: { characters: dark[name] } });
}
// sample strip: real components
let id = j.next_id;
raw("edit.delete", { ids: kids[1596] });
const inst = (comp, texts = []) => {
  const c = typeof comp === "string" ? comp : comp;
  raw("instance.create", { component: c.id, parent: 1596 });
  const at = id; id += c.size;
  for (const [off, t] of texts) raw("node.set", { ids: [at + off], props: { characters: t } });
  return at;
};
raw("transform.scale", { ids: [inst(variant("Logo", "Type=Icon, Color=White"))], factor: 36 / 354 });
inst(variant("Button", "Type=Primary, Tone=Default, Size=md, State=Default"), [[3, "New batch"]]);
inst(variant("Switch", "On=On, State=Default"));
inst(variant("Tab", "Selected=On, State=Default"));
inst(variant("Filter chip", "Selected=On, State=Default"));
inst(variant("Parameter pill", "Kind=Parameter, State=On"));
inst(variant("Nav item", "State=Active, Collapsed=No"));
raw("node.set", { ids: [1549], props: { characters: "Every colour token has a dark value, set per mode in the SGSI tokens collection. This stage is switched to the Dark mode, so the swatches and the components on it show the dark values. Primary becomes a mid blue (#3D69B0) so the primary button stands out; primary-deep and primary-100 become light blues for text and tints; the accent returns to amber (#F1AA41); surfaces are darker, with the card (#152032) above the shell (#0F1929) on a #03060C background. The logo switches to the white version (the Logo component, Color = White); documents (RoA, CoA) always use the colour logo." } });
raw("file.save", { path: dir + "/scratch/darkfix.figcraft" });
fs.writeFileSync(dir + "/scratch/darkfix.json", JSON.stringify(steps));
const r = cp.spawnSync(CLI, ["run", dir + "/scratch/darkfix.json", "--in", dir + "/SGSI-LIMS-screens.figcraft"], { encoding: "utf8", maxBuffer: 1 << 28 });
const lines = r.stdout.split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
const errs = lines.filter((l) => !l.ok);
console.log(`steps ${steps.length}, errors ${errs.length}`);
errs.slice(0, 5).forEach((e) => console.log(JSON.stringify(e).slice(0, 300)));
