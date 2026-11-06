// App screens library additions (App_Screen_Plan.md section 8, Nov 6, 2026): node applib.js <in> <out>
// Pass 1 adds the icon variants eye-slash and sign-out (Phosphor Regular, 14 and 20) by duplicating eye.
// Pass 2 gives them their paths, then builds Password field and Notification item, and puts a hidden
// "Unread" Count pill (Tone=Alert) on the bell of each Top bar variant (screens show it and set the count).
const fs = require("fs"), cp = require("child_process"), path = require("path");
const { B, LIGHT } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
// scalePath and NP copied from tools/emit.js (that module needs jsdom)
const NP = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
function scalePath(d, k) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let out = "", i = 0, cmd = "";
  const f = (x) => String(+(x * k).toFixed(3));
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) { cmd = toks[i++]; out += cmd; if (NP[cmd.toLowerCase()] === 0) continue; }
    const n = NP[cmd.toLowerCase()];
    const p = toks.slice(i, i + n).map(Number); i += n;
    if (cmd.toLowerCase() === "a") out += [f(p[0]), f(p[1]), p[2], p[3], p[4], f(p[5]), f(p[6])].join(" ") + " ";
    else out += p.map(f).join(" ") + " ";
  }
  return out.trim();
}
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
const mid = o.replace(/\.figcraft$/, ".pass1.figcraft");
const load = (f) => { cp.execFileSync(CLI, ["convert", f, "C:/Users/pc/AppData/Local/Temp/applib.json"]); return JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/applib.json")); };
const NEW = ["eye-slash", "sign-out"];

// ---- pass 1
let J = load(i), N = J.nodes;
const iconSet = Object.values(N).find((n) => n.type === "componentSet" && n.name === "Icon");
const vname = (id) => N[id].name;
if (iconSet.children.some((c) => /Glyph=eye-slash,/.test(vname(c)))) throw new Error("already patched");
const eye = (s) => iconSet.children.find((c) => vname(c) === `Glyph=eye, Size=${s}`);
const steps1 = [];
for (const g of NEW) for (const s of [14, 20]) steps1.push({ command: "component.addVariant", params: { id: eye(s), property: "Glyph", value: g } });
steps1.push({ command: "file.save", params: { path: mid } });
run({ steps: steps1, expect: [] }, i, mid, "applib1");

// ---- pass 2
J = load(mid); N = J.nodes;
const reg = loadReg(J);
const b = new B(J.next_id).useReg(reg).regSets();
const set2 = Object.values(N).find((n) => n.type === "componentSet" && n.name === "Icon");
for (const g of NEW) {
  const d = [...fs.readFileSync(path.join(__dirname, "icons", g + ".svg"), "utf8").matchAll(/<path[^>]*? d="([^"]+)"/g)].map((m) => m[1]);
  for (const s of [14, 20]) {
    const v = set2.children.find((c) => N[c].name === `Glyph=${g}, Size=${s}`);
    if (!v) throw new Error("variant missing " + g + s);
    const vec = N[v].children.filter((c) => N[c].type === "vector");
    if (vec.length !== d.length) throw new Error("path count " + g);
    vec.forEach((vid, k) => b.raw("node.set", { ids: [vid], props: { path: scalePath(d[k], s / 256), x: 0, y: 0 } }));
  }
}
const section = (nm) => Number(Object.keys(N).find((k) => N[k].type === "frame" && N[k].name === nm));
const bindFill = (id, tok) => { b.raw("node.set", { ids: [id], props: { fill: LIGHT[tok] } }); b.bind(id, "fill", tok); };

// Password field: State x Size, Label, Value, Helper, Show helper; the eye is an Icon button at the right
const pv = [];
for (const st of ["Default", "Filled", "Error", "Disabled"]) for (const sz of ["md", "touch"]) pv.push({
  name: `State=${st}, Size=${sz}`, w: 280, h: 80, frame: { layout: "v", gap: 6, sizeH: "fixed", sizeV: "hug" },
  build(cid) {
    const Label = b.text(cid, "Password", { style: "Caption/SemiBold", color: st === "Disabled" ? "Text/text-muted" : "Text/text-secondary", name: "Label", fill: true });
    const inp = b.frame(cid, { name: "Input", w: 280, h: sz === "md" ? 40 : 44, layout: "h", gap: 8, pad: [0, 4, 0, 12], cross: "center", fill: st === "Disabled" ? "Surface/muted" : "Surface/card", stroke: st === "Error" ? "Feedback/error" : "Surface/border-strong", sw: 1, r: 8, sizeH: "fill", sizeV: "fixed" });
    const Value = b.text(inp, st === "Default" ? "Enter your password" : "••••••••••", { style: "Body/Regular", color: st === "Filled" || st === "Error" ? "Text/foreground" : "Text/text-muted", name: "Value", fill: true });
    b.instV(inp, "Icon button", `Type=Ghost, Size=32, State=${st === "Disabled" ? "Disabled" : "Default"}`, { swaps: [[0, "Icon", "Glyph=eye, Size=14"]] });
    const Helper = b.text(cid, st === "Error" ? "The password is not correct." : "At least 10 characters, a letter and a number", { style: "Caption/Regular", color: st === "Error" ? "Feedback/error" : "Text/text-muted", name: "Helper", fill: true });
    return { Label, Value, Helper };
  },
});
b.set(section("Text field · Select · Date field · Textarea"), "Password field", pv, { cols: 4, cw: 320, ch: 110, W: 4 * 320 + 32, H: 2 * 110 + 32, textProps: ["Label", "Value", "Helper"], bools: [{ key: "Helper", name: "Show helper", default: true }] });

// Notification item: State Unread / Read; Title, Text, Time; icon in a round tint, unread dot
const nv = ["Unread", "Read"].map((st) => ({
  name: `State=${st}`, w: 400, h: 76, frame: { layout: "h", gap: 12, pad: [12, 16, 12, 16], cross: "min", fill: "Surface/card", sizeH: "fixed", sizeV: "hug" },
  build(cid) {
    const w = b.frame(cid, { name: "Icon wrap", w: 32, h: 32, r: 999, fill: "Primary/primary-50", layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
    const ic = b.instV(w, "Icon", "Glyph=flask, Size=14"); bindFill(ic + 1, "Action/brand-text");
    const t = b.frame(cid, { name: "Text", w: 300, h: 50, layout: "v", gap: 2, sizeH: "fill", sizeV: "hug" });
    const Title = b.text(t, "B-2026-0417 analysis is finished", { style: st === "Unread" ? "Body small/SemiBold" : "Body small/Regular", color: st === "Unread" ? "Text/heading" : "Text/foreground", name: "Title", fill: true });
    const Text = b.text(t, "Upload the signed RoA to complete the batch.", { style: "Caption/Regular", color: "Text/text-secondary", name: "Text", fill: true });
    const Time = b.text(t, "10 min ago", { style: "Caption/Regular", color: "Text/text-muted", name: "Time" });
    if (st === "Unread") b.frame(cid, { name: "Unread dot", w: 8, h: 8, r: 4, fill: "Primary/primary", sizeH: "fixed", sizeV: "fixed" });
    return { Title, Text, Time };
  },
}));
b.set(section("Inline alert · Info note · Toast · Tooltip"), "Notification item", nv, { cols: 2, cw: 440, ch: 100, W: 2 * 440 + 32, H: 100 + 32, textProps: ["Title", "Text", "Time"] });

// Top bar: create a Count pill (Tone=Alert) in each variant; pass 3 positions it on the bell, names it "Unread" and hides it
// (adding a child to a main component copies it into every instance, so its ids cannot be predicted here)
const tb = Object.values(N).find((n) => n.type === "componentSet" && n.name === "Top bar");
const cp42 = reg.sets["Count pill"].variants["Tone=Alert"].id;
for (const vid of tb.children) b.raw("instance.create", { component: cp42, parent: vid });
b.applyTextStyles();
const mid2 = o.replace(/\.figcraft$/, ".pass2.figcraft");
b.raw("file.save", { path: mid2 });
run(b, mid, mid2, "applib2");
fs.unlinkSync(mid);

// ---- pass 3: the bell badge
J = load(mid2); N = J.nodes;
const tb3 = Object.values(N).find((n) => n.type === "componentSet" && n.name === "Top bar");
const steps3 = [];
for (const vid of tb3.children) {
  const kids = N[vid].children;
  const bell = kids.find((c) => N[c].type === "instance" && N[c].name === "Icon button" && (N[c].children || []).some((k) => N[k].component && /Glyph=bell/.test(N[N[k].component].name)));
  const pill = [...kids].reverse().find((c) => N[c].type === "instance" && N[c].name === "Count pill");
  if (!bell || !pill) throw new Error("bell or pill missing in " + N[vid].name);
  const label = N[pill].children.find((c) => N[c].type === "text");
  steps3.push({ command: "node.set", params: { ids: [pill], props: { absolute: true, x: Math.round(N[bell].transform[4] + N[pill].width + ((N[vid].layout && N[vid].layout.gap) || 0) + N[bell].width - 14) /* the pill still sits in the auto layout here and pushes the bell left by its width and the gap */, y: Math.round(N[bell].transform[5] - 4), name: "Unread", visible: false, constraints: { horizontal: "right", vertical: "top" } } } });
  if (label) steps3.push({ command: "node.set", params: { ids: [label], props: { characters: "3" } } });
}
steps3.push({ command: "file.save", params: { path: o } });
run({ steps: steps3, expect: [] }, mid2, o, "applib3");
fs.unlinkSync(mid2);
