const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
let r = fs.readFileSync("rowC.js", "utf8");
const rep = (a, b) => { if (!r.includes(a)) throw new Error("missing: " + a.slice(0, 80)); r = r.split(a).join(b); };

// ---- T tolerant of split placeholders
rep('const T = (b, set, variant, map) => { const v = b.v(set, variant), o = {}; for (const [ph, t] of Object.entries(map)) { const i = v.texts.findIndex((x) => x.chars === ph);',
  'const T = (b, set, variant, map) => { const v = b.v(set, variant), o = {}; for (const [ph, t] of Object.entries(map)) { const i = v.texts.findIndex((x) => !/ source$/.test(x.name) && (x.chars === ph || x.chars === ph.split(" · ")[0]));');

// ---- header (Batches · Desktop reference): company line, then icon items
rep('  b.text(left, o.meta, { style: "Body small/Regular", color: "Text/text-secondary", name: "Meta", fill: true });',
`  const mp = o.meta.split(" · "), late = / [(]past due[)]$/.test(o.meta);
  const company = mp[0], contact = (mp[1] || "").replace(/^Attn[.] /, ""), po = mp[2] || "", due = (mp[3] || "").replace(/^Due /, "").replace(/ [(]past due[)]$/, "");
  b.text(left, company, { style: "Body/Medium", color: "Text/text-secondary", name: "Meta", fill: true });
  const mr = b.frame(left, { name: "Row", w: 400, h: 20, layout: "h", gap: kind === "phone" ? 12 : 16, wrap: kind === "phone", sizeH: "fill", sizeV: "hug" });
  [["user", contact, false], ["receipt", po, false], ["calendar-blank", due, late]].forEach(([g, t, bad]) => {
    const it = b.frame(mr, { name: "Name", w: 90, h: 20, layout: "h", gap: 4, cross: "center", sizeH: "hug", sizeV: "hug" });
    const ic = b.instV(it, "Icon", "Glyph=" + g + ", Size=14");
    if (bad) { b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT["Feedback/error"] } }); b.bind(ic + 1, "fill", "Feedback/error"); }
    b.text(it, t, { style: "Body small/Regular", color: bad ? "Feedback/error" : "Text/text-secondary", name: "Meta" });
    if (bad) b.text(it, "Past due", { style: "Body small/Medium", color: "Feedback/error", name: "Past due" });
  });`);

// ---- Overview properties card (Properties ref)
const a = r.indexOf('  const KV = [["Company"'), e = r.indexOf("  // batches + CoA");
r = r.slice(0, a) + `  const KV = [["Company", "PT Bara Nusantara Mandiri"], ["Address", "Jl. Mulawarman No. 12, Samarinda"], ["Contact", kind === "phone" ? "Budi Hartono · +62 812 5550 1844" : "Budi Hartono · +62 812 5550 1844 · budi@baranusa.co.id"], ["Client reference", "PO 4500-2231"]];
  const kv = (k, v) => b.instV(kvs, "Key-value row", kind === "phone" ? "Layout=Stacked" : "Layout=Inline", { texts: { Key: k, Value: v }, props: { sizingH: "fill" } });
  KV.forEach(([k, v]) => kv(k, v));
  // Parameters: row 1 = service, "customized" (only when the quick select was changed), total on the right; row 2 = all pills under the value column
  const phone = kind === "phone";
  const pr = b.frame(kvs, { name: "Key-value row", w: 400, h: 20, layout: phone ? "v" : "h", gap: phone ? 4 : 12, sizeH: "fill", sizeV: "hug" });
  const kt = b.text(pr, "Parameters", { style: "Caption/Medium", color: "Text/text-muted", name: "Key" });
  if (!phone) b.raw("node.set", { ids: [kt], props: { width: 110, sizingH: "fixed" } });
  const left = b.frame(pr, { name: "Left", w: 300, h: 20, layout: "h", gap: 12, cross: "center", sizeH: "fill", sizeV: "hug" });
  b.text(left, "TM + Prox + TS + CV", { style: "Body small/Medium", color: "Text/foreground", name: "Service" });
  if (o2.custom) b.text(left, "customized", { style: "Body small/Medium", color: "Text/text-muted", name: "Customized" });
  b.text(pr, "8 parameters", { style: "Body small/Medium", color: "Text/text-secondary", name: "Total" });
  const pills = b.frame(kvs, { name: "Parameter pills", w: 400, h: 30, layout: "h", gap: 6, pad: [0, 0, 0, phone ? 0 : 122], wrap: true, sizeH: "fill", sizeV: "hug" });
  ["Preparation", "TM", "IM", "Ash", "VM", "FC", "TS", "GCV"].forEach((p) => minipill(b, pills, p));
  [["Standard", "ASTM"], ["Expected samples", "12 · Exploration cores"], ["Priority", "Standard"], ["Due date", "24 Oct 2026"], ["Default signatory", "Ir. Bambang Sutrisno, M.T. · Laboratory Manager"], ["Created by", "Rina Kartika · 14 Oct 2026"], ["Notes", "—"]].forEach(([k, v]) => kv(k, v));
` + r.slice(e);
rep("function overview(b, x, y, kind) {", "function overview(b, x, y, kind) {\n  const o2 = { custom: true };");

// ---- Overview batch list: samples and RoA as separate texts, preparation and analysis as avatar + name + date
rep('    b.text(top, `${d[3]} samples · RoA ${d[9]}`, { style: "Caption/Regular", color: "Text/text-secondary", name: "Meta" });',
`    const mt = b.frame(top, { name: "Meta", w: 120, h: 16, layout: "h", gap: 8, cross: "center", sizeH: "hug", sizeV: "hug" });
    b.text(mt, d[3] + " samples", { style: "Caption/Regular", color: "Text/text-secondary", name: "Samples" });
    b.text(mt, d[9], { style: "Data", color: d[9] === "—" ? "Text/text-muted" : "Primary/primary", name: "RoA" });`);
const s1 = r.indexOf('    [["Prep", d[7]], ["Analysis", d[8]]]'), s2 = r.indexOf("\n", s1);
r = r.slice(0, s1) + `    [["Preparation", d[7]], ["Analysis", d[8]]].forEach(([l, p]) => {
      const pr = b.frame(r, { name: l, w: 400, h: 32, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
      const rt = b.text(pr, l, { style: "Caption/Regular", color: "Text/text-muted", name: "Role" }); b.raw("node.set", { ids: [rt], props: { width: 80, sizingH: "fixed" } });
      if (!p) { b.text(pr, "—", { style: "Body small/Regular", color: "Text/text-muted", name: "Name" }); return; }
      b.instV(pr, "Avatar", "Size=24", { texts: { Initials: p[0] } });
      const col = b.frame(pr, { name: "Label", w: 150, h: 34, layout: "v", gap: 0, sizeH: "hug", sizeV: "hug" });
      b.text(col, p[1], { style: "Body small/Medium", color: "Text/foreground", name: "Name" });
      b.text(col, p[2], { style: "Caption/Regular", color: "Text/text-secondary", name: "Date" });
    });` + r.slice(s2);

// ---- Batches tab rows
rep('const rid = b.instV(wrap, "Table row batches", `Template=${t}, State=Default`, { texts: T(b, "Table row batches", `Template=${t}, State=Default`, RB(t, d)), swaps: [["Status badge", "Status badge", `Status=${d[6]}, Size=md`]], props: { sizingH: "fill" } });\n    flat(b, rid, "Table row batches", `Template=${t}, State=Default`);',
  "batchRow(b, wrap, t, d);");
rep('flat(b, b.instV(wrap, "Table row batches", "Template=Desktop, State=Default", { texts: T(b, "Table row batches", "Template=Desktop, State=Default", RB("Desktop", d)), swaps: [["Status badge", "Status badge", `Status=${d[6]}, Size=md`]], props: { sizingH: "fill" } }), "Table row batches", "Template=Desktop, State=Default");',
  'batchRow(b, wrap, "Desktop", d);');
const r1 = r.indexOf("const RB = (t, d) =>"), r2 = r.indexOf("\n", r1);
r = r.slice(0, r1) + `function batchRow(b, parent, t, d) {
  const variant = "Template=" + t + ", State=Default", v = b.v("Table row batches", variant), pick = (ph) => v.texts.findIndex((x) => x.chars === ph);
  const texts = { Number: d[0], Date: d[1], Standard: d[2], Samples: d[3], Deadline: d[10] };
  if (t === "Desktop") {
    Object.assign(texts, { Parameters: d[4], Extra: d[5], PrepName: d[7][1], PrepDate: d[7][2], AnalysisName: d[8] ? d[8][1] : "—", AnalysisDate: d[8] ? d[8][2] : "", RoA: d[9] });
    texts[pick("DK")] = d[7][0]; if (d[8]) texts[pick("FH")] = d[8][0];
  }
  const rid = b.instV(parent, "Table row batches", variant, { texts, fills: t === "Desktop" ? { RoA: d[9] === "—" ? "Text/text-secondary" : "Primary/primary" } : undefined, swaps: [["Status badge", "Status badge", "Status=" + d[6] + ", Size=md"]], props: { sizingH: "fill" } });
  if (t === "Desktop" && !d[8]) b.raw("node.set", { ids: [rid + v.all.Avatar[1], rid + v.names.AnalysisDate], props: { visible: false } });
  flat(b, rid, "Table row batches", variant);
  return rid;
}` + r.slice(r2);
fs.writeFileSync("rowC.js", r);
console.log("edit2 ok");
