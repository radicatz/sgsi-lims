const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
let r = fs.readFileSync("rowC.js", "utf8");
const rep = (a, b) => { if (!r.includes(a)) throw new Error("missing: " + a.slice(0, 80)); r = r.split(a).join(b); };

rep(`  if (b.reg.sets["Table row batches"]) { b.fresh = false; return; }
  b.fresh = true;
  const byName = (type, name) => Object.values(N).find((n) => n.type === type && n.name === name);`,
`  const oldRows = b.reg.sets["Table row batches"];
  const stale = oldRows && Object.values(oldRows.variants).some((v) => v.texts.some((x) => /Prep: /.test(x.chars)));
  if (oldRows && !stale) { b.fresh = false; return; }
  b.fresh = !stale;
  const byName = (type, name) => Object.values(N).find((n) => n.type === type && n.name === name);
  const keep = {};
  if (stale) for (const nm of ["Table header row batches", "Table row batches"]) { const h = byName("frame", nm + " (set)"); if (h) { keep[nm] = [h.transform ? h.transform[4] : 0, h.transform ? h.transform[5] : 0]; b.raw("edit.delete", { ids: [h.id] }); delete b.reg.sets[nm]; } }`);

// header: Preparation and Analysis columns, no side padding (the card pads)
rep('["Status", 124], ["Prep and analysis", 0], ["RoA", 88]', '["Status", 124], ["Preparation", 0], ["Analysis", 0], ["RoA", 88]');
rep('frame: { fill: "Primary/primary-50", r: 8, layout: "h", pad: [0, 16, 0, 16], cross: "center", sizeH: "fixed", sizeV: "fixed" },\n    build(cid) { COLS[t]',
    'frame: { fill: "Primary/primary-50", r: 8, layout: "h", pad: [0, 0, 0, 0], cross: "center", sizeH: "fixed", sizeV: "fixed" },\n    build(cid) { COLS[t]');
rep('const row = b.frame(cid, { name: "Row", w: W[t], h: 64, layout: "h", pad: [0, 16, 0, 16], cross: "center", sizeH: "fill", sizeV: "fixed" });',
    'const row = b.frame(cid, { name: "Row", w: W[t], h: 64, layout: "h", pad: [0, 0, 0, 0], cross: "center", sizeH: "fill", sizeV: "fixed" });');

// row: separate Preparation and Analysis cells (avatar + name + date)
const a = r.indexOf("          c = cell(0, true); tw = two(c);\n          const pr = b.frame(tw, { name: \"Prep\"");
const e = r.indexOf("          c = cell(88); o.RoA");
if (a < 0 || e < 0) throw new Error("prep block not found");
r = r.slice(0, a) + `          for (const [role, ini, nm, dt] of [["Prep", "DK", "PrepName", "PrepDate"], ["Analysis", "FH", "AnalysisName", "AnalysisDate"]]) {
            c = cell(0, true);
            const pr = b.frame(c, { name: role, w: 200, h: 34, layout: "h", gap: 6, cross: "center", sizeH: "fill", sizeV: "hug" });
            o[role + "Av"] = b.instV(pr, "Avatar", "Size=24", { texts: { Initials: ini } });
            const lb = b.frame(pr, { name: "Label", w: 100, h: 34, layout: "v", sizeH: "hug", sizeV: "hug" });
            o[nm] = b.text(lb, role === "Prep" ? "Dedi Kurniawan" : "Fitri Handayani", { style: "Body small/Medium", color: "Text/foreground", name: nm });
            o[dt] = b.text(lb, role === "Prep" ? "21 Oct" : "22 Oct", { style: "Caption/Regular", color: "Text/text-secondary", name: dt });
          }
` + r.slice(e);

// after the batch row set is built: stop here when only this set was rebuilt
rep('  b.set(pan, "Table row batches", rv, { cols: 2, cw: 1200, ch: 90, W: 2440, H: 2 * 90 + 32 });',
`  b.set(pan, "Table row batches", rv, { cols: 2, cw: 1200, ch: 90, W: 2440, H: 2 * 90 + 32 });
  if (stale) {
    for (const nm of ["Table header row batches", "Table row batches"]) if (keep[nm]) b.raw("node.set", { ids: [b.sets[nm].holder], props: { x: keep[nm][0], y: keep[nm][1] } });
    b.fresh = false; return;
  }`);
fs.writeFileSync("rowC.js", r);
console.log("edit3 ok");
