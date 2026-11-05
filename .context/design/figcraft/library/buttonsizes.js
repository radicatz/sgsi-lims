// Button sizes (owner, Nov 5, 2026): sm -> md, md -> lg, and a new sm (28 px).
// Text styles follow: Label/Button sm -> md, md -> lg, new Label/Button sm (Noto Sans SemiBold 12/16).
// node buttonsizes.js <in> <out>   (two passes through figcraft-cli; instances keep their links, so no screen changes)
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
const mid = o.replace(/\.figcraft$/, ".pass1.figcraft");
const load = (f) => { cp.execFileSync(CLI, ["convert", f, "C:/Users/pc/AppData/Local/Temp/buttonsizes.json"]); return JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/buttonsizes.json")); };

// ---- pass 1: duplicate the 32 px variants below the set, add a sample text for the new style
let J = load(i), N = J.nodes;
const setId = +Object.keys(N).find((k) => N[k].type === "componentSet" && N[k].name === "Button");
const set = N[setId];
if (set.children.some((c) => /Size=lg/.test(N[c].name))) throw new Error("already converted");
const sm = set.children.filter((c) => /Size=sm,/.test(N[c].name));
const bottom = Math.max(...set.children.map((c) => N[c].transform[5] + N[c].height));
const smTop = Math.min(...sm.map((c) => N[c].transform[5]));
const smBottom = Math.max(...sm.map((c) => N[c].transform[5] + N[c].height));
const dy = bottom + 40 - smTop;
const steps1 = [
  { command: "edit.duplicate", params: { ids: sm, dx: 0, dy } },
  { command: "node.set", params: { ids: [setId], props: { height: set.height + (smBottom - smTop) + 40 } } },
  { command: "node.create", params: { type: "text", text: "Button", name: "tmp Label/Button sm", parent: N[setId].parent, x: 0, y: -200, props: { fontFamily: "Noto Sans", fontStyle: "SemiBold", fontSize: 12, lineHeight: 16 } } },
  { command: "file.save", params: { path: mid } },
];
run({ steps: steps1, expect: [] }, i, mid, "buttonsizes1");

// ---- pass 2: rename variants and text styles, size the new sm, apply its style
J = load(mid); N = J.nodes;
const set2 = N[setId];
const newSm = set2.children.filter((c) => !sm.includes(c) && /Size=sm,/.test(N[c].name) && N[c].transform[5] >= bottom);
if (newSm.length !== sm.length) throw new Error("expected " + sm.length + " copies, found " + newSm.length);
const tmp = +Object.keys(N).find((k) => N[k].name === "tmp Label/Button sm");
const styleId = (name) => J.styles.find((s) => s.name === name).id;
const sMd = styleId("Label/Button md"), sSm = styleId("Label/Button sm");
const steps2 = [];
// variant names: md -> lg first, then the old sm -> md, then the copies -> sm (same name as before, made unique by the step order)
set2.children.filter((c) => /Size=md,/.test(N[c].name)).forEach((c) => steps2.push({ command: "node.set", params: { ids: [c], props: { name: N[c].name.replace("Size=md,", "Size=lg,") } } }));
sm.forEach((c) => steps2.push({ command: "node.set", params: { ids: [c], props: { name: N[c].name.replace("Size=sm,", "Size=md,") } } }));
// text styles
steps2.push({ command: "style.update", params: { style: sMd, name: "Label/Button lg" } });
steps2.push({ command: "style.update", params: { style: sSm, name: "Label/Button md" } });
steps2.push({ command: "style.create", params: { type: "text", name: "Label/Button sm", from: tmp } });
steps2.push({ command: "edit.delete", params: { ids: [tmp] } });
// new sm: same name as its original 32 px variant had (Size=sm), 28 high, padding 10, gap 6, label style Label/Button sm
newSm.forEach((c) => { const src = sm.find((s) => N[s].transform[4] === N[c].transform[4] && Math.abs(N[s].transform[5] + dy - N[c].transform[5]) < 1); if (!src) throw new Error("no original for " + c); steps2.push({ command: "node.set", params: { ids: [c], props: { name: N[src].name } } }); });
const labels = [];
newSm.forEach((c) => { const walk = (id) => { const n = N[id]; if (n.type === "text" && n.name === "Label") labels.push(+id); (n.children || []).forEach(walk); }; walk(c); });
steps2.push({ command: "node.set", params: { ids: newSm, props: { height: 28, padding: [0, 10, 0, 10], gap: 6 } } });
steps2.push({ command: "style.apply", params: { ids: labels, style: "Label/Button sm" } });
steps2.push({ command: "file.save", params: { path: o } });
run({ steps: steps2, expect: [] }, mid, o, "buttonsizes2");
fs.unlinkSync(mid);
console.log("variants: lg", set2.children.filter((c) => /Size=md,/.test(N[c].name)).length, "md", sm.length, "sm", newSm.length, "labels", labels.length);

// ---- pass 3: lay the set out per Type/Tone combination, rows lg, md, sm, touch; columns by State
const J3 = load(o), N3 = J3.nodes, s3 = N3[setId];
const STATES = ["Default", "Hover", "Pressed", "Focused", "Disabled", "Loading"], SIZES = ["lg", "md", "sm", "touch"];
const combos = []; s3.children.forEach((c) => { const m = /Type=([^,]+), Tone=([^,]+)/.exec(N3[c].name); const k = m[1] + "|" + m[2]; if (!combos.includes(k)) combos.push(k); });
const steps3 = []; let y = 20;
combos.forEach((k) => { const [t, tn] = k.split("|"); SIZES.forEach((sz) => { STATES.forEach((st, col) => { const c = s3.children.find((x) => N3[x].name === `Type=${t}, Tone=${tn}, Size=${sz}, State=${st}`); steps3.push({ command: "node.set", params: { ids: [c], props: { x: 20 + col * 220, y: y + Math.round((44 - N3[c].height) / 2) } } }); }); y += 60; }); y += 20; });
const H3 = y;
steps3.push({ command: "node.set", params: { ids: [setId], props: { height: H3 } } });
steps3.push({ command: "node.set", params: { ids: [s3.parent], props: { height: H3 + 8 } } });
steps3.push({ command: "file.save", params: { path: o } });
run({ steps: steps3, expect: [] }, o, o, "buttonsizes3");
console.log("laid out", combos.length, "combinations, set height", H3);
