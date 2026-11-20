// Signing assets pass (owner, Nov 20, 2026): the placeholder signature (component "b_sutrisno-sign", from .context/assets/images/b_sutrisno-sign.png)
// and stamp (component "sgsi-stamp", from sgsi-stamp.svg) replace the drawn stand-ins in every "Signature art" and "Stamp art" frame; the numbers and
// codes of the certificate tables use the JetBrains Mono data style (Data/Small). In place on the main file; frames without art are left alone.
// node signassets.js        (reads the main file, writes scratch/screens-assets.figcraft)
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
require("./screens/shell.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const dir = "D:/SGSI/LIMS/.context/design/figcraft";
const MAIN = process.env.MAIN_IN || dir + "/SGSI-LIMS-screens.figcraft", OUT = dir + "/scratch/screens-assets.figcraft", json = "C:/Users/pc/AppData/Local/Temp/assets.json";
cp.execFileSync(CLI, ["convert", MAIN, json]);
const J = JSON.parse(fs.readFileSync(json)), reg = loadReg(J), N = reg.N;
const b = new B(J.next_id).useReg(reg).regSets();
const SIG = { w: 600, h: 190 }, STAMP = 750.74;
const walk = (id, fn) => { fn(N[id], id); (N[id].children || []).forEach((c) => walk(c, fn)); };
const log = { sig: 0, stamp: 0, texts: 0 };
const place = (parent, comp, native, size, x, y) => { const id = b.comp(parent, comp); b.raw("transform.scale", { ids: [id], factor: size / native }); b.raw("node.set", { ids: [id], props: { x: Math.round(x), y: Math.round(y) } }); return id; };
const mono = [];
for (const pid of J.pages) for (const top of N[pid].children || []) walk(top, (n, id) => {
  if (n.name === "Signature art" && n.type === "frame") {
    const kids = n.children || [];
    if (kids.some((c) => N[c].name === "Placeholder")) return; // unsigned: the dashed box stays
    const hasStamp = kids.some((c) => N[c].name === "Stamp"), w = n.width, h = n.height;
    if (kids.length) b.raw("edit.delete", { ids: kids });
    if (hasStamp) { const s = Math.min(h, 64); place(id, "sgsi-stamp", STAMP, s, w - s, (h - s) / 2); log.stamp++; }
    const sw = hasStamp ? w * 0.74 : Math.min(w * 0.9, (h * 0.9 * SIG.w) / SIG.h), f = sw / SIG.w;
    place(id, "b_sutrisno-sign", SIG.w, sw, hasStamp ? 0 : (w - sw) / 2, (h - SIG.h * f) / 2);
    log.sig++;
  }
  if (n.name === "Stamp art" && n.type === "frame") {
    const kids = n.children || []; if (kids.length) b.raw("edit.delete", { ids: kids });
    const s = Math.min(n.height, 80); place(id, "sgsi-stamp", STAMP, s, (n.width - s) / 2, (n.height - s) / 2); log.stamp++;
  }
  if (n.name === "Sample table") walk(id, (t, tid) => { if (t.type === "text" && ["Value", "Mass", "Sample code", "Sample ID"].includes(t.name)) mono.push(tid); });
  if (n.name === "Head code" && n.type === "frame") (n.children || []).forEach((c) => b.raw("node.set", { ids: [c], props: { height: 40 } })); // two mono lines need 40
});
if (mono.length) { b.raw("style.apply", { ids: mono, style: "Data/Small" }); log.texts = mono.length; }
console.log(`signature art ${log.sig}, stamps ${log.stamp}, mono texts ${log.texts}`);
b.raw("file.save", { path: OUT });
run(b, MAIN, OUT, "assets");
