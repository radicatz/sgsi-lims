const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
const rw = (f, fn) => { let s = fs.readFileSync(f, "utf8").split(CRLF).join(LF); s = fn(s); fs.writeFileSync(f, s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 90)); return s.replace(a, b); };
const cut = (s, from, to, text) => { const a = s.indexOf(from), e = s.indexOf(to, a); if (a < 0 || e < 0) throw new Error("block not found: " + from.slice(0, 60)); return s.slice(0, a) + text + s.slice(e); };

// ---- rowC: Add batch buttons are small
rw("rowC.js", (s) => {
  let n = 0;
  s = s.replace(/b\.instV\(hd, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", \{ texts: \{ Label: "Add batch" \}/g, () => { n++; return 'b.instV(hd, "Button", "Type=Secondary, Tone=Default, Size=sm, State=Default", { texts: { Label: "Add batch" }'; });
  if (n !== 2) throw new Error("add batch buttons " + n);
  return s;
});

// ---- rowF
rw("rowF.js", (s) => {
  // job order link: primary colour
  s = rep(s, '[["clipboard-text", bt.jo, "Text/text-secondary"],', '[["clipboard-text", bt.jo, "Primary/primary"],');
  s = rep(s, 'const it = hframe(b, mr, "Item", 4); icon(b, it, g); txt(b, it, t, "Body small/Regular", c || "Text/text-muted", "Meta");',
             'const it = hframe(b, mr, g === "clipboard-text" ? "Job order link" : "Item", 4); icon(b, it, g, c === "Primary/primary" ? c : "Text/text-muted"); txt(b, it, t, "Body small/Regular", c || "Text/text-muted", g === "clipboard-text" ? "Job order link" : "Meta");');
  // condition: a status icon after every select
  s = rep(s, 'if (cond !== "Good") icon(b, f, "warning", "Feedback/warning");', 'icon(b, f, cond === "Good" ? "check-circle" : "warning", cond === "Good" ? "Feedback/success" : "Feedback/warning");');
  // card head: fixed 32; extra lines go to Card content
  s = cut(s, "const cardHeadF = (b, c, title, sub, kind) => {", "\nfunction receptionCard", `const cardHeadF = (b, c, title, sub, kind) => {
  const h = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" });
  txt(b, h, title, "Heading/H3", "Text/heading", "Title");
  const a = hframe(b, h, "Actions", 8);
  if (sub) sub(vframe(b, c, "Card content", 8));
  return a;
};
`);
  // reception: toolbar in the head on desktop, in Card content on tablet; checklist inside the card
  s = cut(s, "  if (!o.locked) {\n    const sc = b.instV(a, \"Search\"", "  if (o.returned) {", `  if (!o.locked) {
    const tool = kind === "desktop" ? a : hframe(b, c, "Card content", 8, { wrap: true, sizeH: "fill" });
    const sc = b.instV(tool, "Search", "Size=sm, State=" + (o.scan ? "Filled" : "Default"), { texts: { Value: o.scan || "Scan or type a label" } }); b.raw("node.set", { ids: [sc], props: { width: 240 } });
    btn(b, tool, "Secondary", "Mark all arrived", "check");
    btn(b, tool, "Secondary", o.toPrint ? \`Print labels (\${o.toPrint})\` : "Print labels", "printer");
    btn(b, a, "Primary", "Confirm reception", "check-circle", { state: o.ready ? "Default" : "Disabled" });
  }
`);
  s = rep(s, 'const n = hframe(b, c, "Returned note", 8, { sizeH: "fill", fill: "Accent/accent-100", r: 10, pad: [10, 14, 10, 14] });', 'const n = hframe(b, c, "Card content", 8, { sizeH: "fill", fill: "Accent/accent-100", r: 10, pad: [10, 14, 10, 14] });');
  s = rep(s, '  const c = card(b, main, "Checklist card");\n  checklist(b, c, "Before you can confirm reception"', '  checklist(b, main, "Before you can confirm reception"');
  s = rep(s, "  receptionCard(b, s.main, kind, {", "  const rcard = receptionCard(b, s.main, kind, {");
  s = rep(s, "  if (!o.locked) receptionChecklist(b, s.main, o.ready);", "  if (!o.locked) receptionChecklist(b, rcard, o.ready);");
  // preparation: saved count beside Save all; Ready for analysis at the right end of the head
  s = cut(s, '  const a = cardHeadF(b, c, "Preparation", (t) =>', "  const cols = kind === \"desktop\" ? [[\"#\", 40]", `  const a = cardHeadF(b, c, "Preparation", null, kind);
  if (!done) { txt(b, a, "4 of 6 saved", "Body small/Regular", "Text/text-secondary", "Saved count"); btn(b, a, "Secondary", "Save all", "floppy-disk"); btn(b, a, "Primary", "Finish Preparation", "check-circle", { state: "Disabled" }); }
  else { const r = hframe(b, a, "Ready", 6); icon(b, r, "check-circle", "Feedback/success"); txt(b, r, "Ready for analysis", "Body small/Medium", "Feedback/success", "Ready"); }
`);
  return s;
});

// ---- rowG
rw("rowG.js", (s) => {
  // samples as "n / n", like the job order list
  s = rep(s, 'if (k === "n") { txt(b, f, n, "Body small/Regular", "Text/foreground", "Samples"); if (of) txt(b, f, of, "Caption/Regular", "Text/text-muted", "Expected"); }', 'if (k === "n") txt(b, f, n + " / " + (of ? of.replace("of ", "") : n), "Body small/Regular", "Text/foreground", "Samples");');
  s = rep(s, 'icon(b, a, "stack"); txt(b, a, n, "Body small/Regular", "Text/foreground", "Samples"); if (of) txt(b, a, of, "Caption/Regular", "Text/text-muted", "Expected");', 'icon(b, a, "stack"); txt(b, a, n + " / " + (of ? of.replace("of ", "") : n), "Body small/Regular", "Text/foreground", "Samples");');
  // table card padding 16 all round
  s = rep(s, '  const c = card(b, main, "Table card");\n  const cols = COLS[kind];', '  const c = card(b, main, "Table card"); b.raw("node.set", { ids: [c], props: { padding: [16, 16, 16, 16] } });\n  const cols = COLS[kind];');
  // filters: centered dialog on desktop
  s = cut(s, '  { const s = listFrame(b, 0, d + 1300, "desktop", { variant: "Filters" }); fix(b, s, "desktop", 1200);', '  { const s = listFrame(b, DX, d + 1300, "desktop", { variant: "Add_batch_choose_job_order" });', `  { const s = listFrame(b, 0, d + 1300, "desktop", { variant: "Filters" }); fix(b, s, "desktop", 1200);
    dialogAt(b, s.root, "lg", Math.round((1440 - 800) / 2) + 64, 140, "Filters", "Narrow the batch list.", "Clear all", "Show 12 batches", (bd) => filterDialog(b, bd)); }
`);
  s = s.trimEnd() + `
function filterDialog(b, bd) {
  const f = vframe(b, bd, "Fields", 14);
  const row = (a, c) => { const r = b.frame(f, { name: "Row", w: 700, h: 70, layout: "h", gap: 12, sizeH: "fill", sizeV: "hug" }); [a, c].forEach(([set, l, v, st]) => b.instV(r, set, \`State=\${st || "Filled"}, Size=md\`, { texts: { Label: l, Value: v }, setProps: { "Show helper": false }, props: { sizingH: "fill" } })); };
  row(["Select", "Company", "All companies"], ["Select", "Status", "All statuses"]);
  row(["Select", "Standard", "ASTM"], ["Select", "Job order", "Any job order"]);
  row(["Date field", "Batch date from", "1 Oct 2026"], ["Date field", "Batch date to", "4 Nov 2026"]);
  row(["Date field", "Deadline from", "Any date", "Default"], ["Date field", "Deadline to", "Any date", "Default"]);
}
`;
  return s;
});
console.log("edit14 ok");
