// Row G · Batch list (module 04 Batches, screen 01): the page the sidebar item "Batches" opens. Sits above row F.
// Plan: .context/docs/Batch/Batch_Screen_Plan.md section 13. Run before row F: build-screens.js C,D,E,G,F
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver, dialogAt } = H;

const G_NAMES = /^(Batch list ·|(Desktop|Tablet|Phone)-04-Batches-01-)/;
const isG = (n) => G_NAMES.test(n.name || "") || (n.name === "Row title" && /^G( ·|  )/.test(n.characters || ""));
const isF = (n) => /^(Batch detail ·|(Desktop|Tablet|Phone)-04-Batches-02-)/.test(n.name || "") || (n.name === "Row title" && /^F( ·|  )/.test(n.characters || ""));
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (/ ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/.test(n.name || "")) continue; if (/-03-Job_orders-0[45]-|^(Add batch|CoA · Mark sent|CoA · Sent|Cancel job order) ·|-01-My_work-|^My work ·/.test(n.name || "") || (n.name === "Row title" && /^[DEH]( ·|  )/.test(n.characters || ""))) continue; if (isG(n) || isF(n)) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.rowE ? b.rowE[k] + 1600 : 0); }
  return out;
}
const clearG = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isG(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const W = { desktop: 1440, tablet: 834, phone: 390 };
const icon = (b, parent, glyph, tok = "Text/text-muted", size = 14) => { const ic = b.instV(parent, "Icon", `Glyph=${glyph}, Size=${size}`); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const txt = (b, parent, t, style, color, name, o = {}) => b.text(parent, t, { style, color, name: name || t, ...o });
const hframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "h", gap, cross: o.cross || "center", main: o.main, wrap: o.wrap, pad: o.pad, sizeH: o.sizeH || "hug", sizeV: "hug", fill: o.fill, r: o.r });
const vframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "v", gap, pad: o.pad, sizeH: o.sizeH || "fill", sizeV: "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });
const btn = (b, parent, type, label, glyph, o = {}) => b.instV(parent, "Button", `Type=${type}, Tone=Default, Size=${o.size || "lg"}, State=${o.state || "Default"}`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false }, props: o.fill ? { sizingH: "fill" } : undefined });

// no, date, jo, company, std, samples (arrived or count), expected (or ""), status, deadline, past due, roa
const ROWS = [
  ["B-2026-0422", "27 Oct", "JO-2026-0137", "PT Kaltara Energi Prima", "ASTM", "6", "of 8", "Receiving", "28 Oct 2026", false, ""],
  ["B-2026-0421", "27 Oct", "JO-2026-0139", "PT Mahakam Coal Resources", "ASTM", "3", "", "Preparation", "25 Oct 2026", false, ""],
  ["B-2026-0420", "20 Oct", "JO-2026-0139", "PT Mahakam Coal Resources", "ASTM", "4", "", "Analysis", "24 Oct 2026", false, ""],
  ["B-2026-0419", "22 Oct", "JO-2026-0138", "PT Bara Nusantara Mandiri", "ASTM", "10", "", "Prep finished", "30 Oct 2026", false, ""],
  ["B-2026-0418", "22 Oct", "JO-2026-0142", "PT Bara Nusantara Mandiri", "ASTM", "6", "", "Analysis", "26 Oct 2026", false, ""],
  ["B-2026-0417", "21 Oct", "JO-2026-0142", "PT Bara Nusantara Mandiri", "ASTM", "12", "", "Completed", "24 Oct 2026", false, "RoA-0417"],
  ["B-2026-0416", "14 Oct", "JO-2026-0141", "PT Kaltara Energi Prima", "ASTM", "8", "", "Completed", "23 Oct 2026", false, "RoA-0416"],
  ["B-2026-0415", "15 Oct", "JO-2026-0140", "CV Sumber Batu Hitam", "ISO", "24", "", "Analysis finished", "22 Oct 2026", false, ""],
  ["B-2026-0414", "10 Oct", "JO-2026-0140", "CV Sumber Batu Hitam", "ISO", "12", "", "Completed", "20 Oct 2026", false, "RoA-0414"],
  ["B-2026-0413", "13 Oct", "JO-2026-0136", "CV Sumber Batu Hitam", "ASTM", "0", "of 5", "Created", "20 Oct 2026", true, ""],
];
const PREP_ROWS = [ROWS[0], ROWS[1], ROWS[9], ["B-2026-0412", "12 Oct", "JO-2026-0134", "PT Bara Nusantara Mandiri", "ASTM", "0", "of 6", "Created", "31 Oct 2026", false, ""]];
const CHIPS = [["All", "46"], ["Created", "3"], ["Preparation", "4"], ["Prep finished", "2"], ["Analysis", "6"], ["Analysis finished", "1"], ["Completed", "30"]];

function header(b, main, kind) {
  const hdr = b.frame(main, { name: "Header", w: 800, h: 100, layout: kind === "phone" ? "v" : "h", gap: 12, main: "spaceBetween", cross: kind === "phone" ? "min" : "max", sizeH: "fill", sizeV: "hug" });
  const left = vframe(b, hdr, "Title block", 4, { sizeH: kind === "phone" ? "fill" : "hug" });
  txt(b, left, kind === "desktop" ? "WORK · TUESDAY 4 NOVEMBER 2026" : "WORK · BATCHES", "Overline", "Text/text-muted", "Overline");
  txt(b, left, "Batches", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (kind !== "phone") btn(b, hdr, "Primary", "Add batch", "plus");
}
function chips(b, main, on, counts) {
  const r = b.frame(main, { name: "Status chips", w: 800, h: 40, layout: "h", gap: 10, wrap: true, sizeH: "fill", sizeV: "hug" });
  CHIPS.forEach(([l, c]) => b.instV(r, "Filter chip", `Selected=${on.includes(l) ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: counts ? counts[l] ?? c : c } }));
  return r;
}
function filters(b, main, kind, o = {}) {
  const r = b.frame(main, { name: "Filters", w: 800, h: 60, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug" });
  const sc = b.instV(r, "Search", `Size=${kind === "phone" ? "lg" : "md"}, State=${o.query ? "Filled" : "Default"}`, { texts: { Value: o.query || (kind === "phone" ? "Search batches" : "Search batch, sample or job order") }, props: kind === "desktop" ? { width: 320 } : { sizingH: "fill" }, hide: ["Scan"] });
  if (kind === "desktop") {
    b.instV(r, "Select", "State=Default, Size=md", { texts: { Label: "Company", Value: "All companies" }, props: { width: 220 }, setProps: { "Show helper": false } });
    b.instV(r, "Date field", "State=Default, Size=md", { texts: { Label: "Deadline", Value: "Any date" }, props: { width: 200 }, setProps: { "Show helper": false } });
    b.frame(r, { name: "Spacer", w: 10, h: 10, sizeH: "fill", sizeV: "fixed" });
  }
  btn(b, r, "Secondary", "Filters", "funnel");
}
const COLS = {
  desktop: [["Batch no.", 140], ["Job order", 240], ["Standard", 100], ["Samples", 100], ["Status", 160], ["Deadline", 0], ["RoA", 130], ["", 40]],
  tablet: [["Batch no.", 150], ["Job order", 220], ["Status", 150], ["Deadline", 0], ["", 36]],
};
function tableCard(b, main, kind, rows, o = {}) {
  const c = card(b, main, "Table card"); b.raw("node.set", { ids: [c], props: { padding: [16, 16, 16, 16] } });
  const cols = COLS[kind];
  const t = vframe(b, c, "Table", 0);
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); txt(b, f, h || " ", "Caption/SemiBold", "Text/text-secondary", "Head label"); });
  rows.forEach((d) => {
    const [no, date, jo, co, std, n, of, st, dl, late, roa] = d;
    const r = vframe(b, t, "Row", 0);
    const line = b.frame(r, { name: "Cells", w: 800, h: 60, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    const cell = (i) => { const w = cols[i][1]; return b.frame(line, { name: "Cell", w: w || 120, h: 52, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); };
    const two = (f) => vframe(b, f, "Two lines", 0);
    const kinds = kind === "desktop" ? ["no", "jo", "std", "n", "st", "dl", "roa", "go"] : ["no", "jo", "st", "dl", "go"];
    kinds.forEach((k, i) => {
      const f = cell(i);
      if (k === "no") { const t2 = two(f); txt(b, t2, no, "Data/Strong", "Text/heading", "Number"); txt(b, t2, date, "Caption/Regular", "Text/text-muted", "Date"); }
      if (k === "jo") { const t2 = two(f); txt(b, t2, jo, "Data", "Primary/primary", "Job order"); txt(b, t2, co, "Caption/Regular", "Text/text-secondary", "Company"); }
      if (k === "std") { const tg = b.frame(f, { name: "Standard tag", w: 50, h: 22, fill: "Primary/primary-50", stroke: "Primary/primary-200", sw: 1, r: 6, layout: "h", pad: [0, 8, 0, 8], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" }); txt(b, tg, std, "Caption/SemiBold", "Text/text-secondary", "Standard"); }
      if (k === "n") txt(b, f, n + " / " + (of ? of.replace("of ", "") : n), "Body small/Regular", "Text/foreground", "Samples");
      if (k === "st") b.instV(f, "Status badge", `Status=${st}, Size=md`);
      if (k === "dl") { txt(b, f, dl, "Body small/Regular", late ? "Feedback/error" : "Text/foreground", "Deadline"); if (late) txt(b, f, "Past due", "Body small/SemiBold", "Feedback/error", "Past due"); }
      if (k === "roa") { if (roa) { icon(b, f, "file-pdf", "Primary/primary"); txt(b, f, roa, "Data", "Primary/primary", "RoA"); } else txt(b, f, "—", "Body small/Regular", "Text/text-muted", "RoA"); }
      if (k === "go") icon(b, f, "caret-right", "Text/text-muted");
    });
    b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
  if (!o.noPager) { const p = b.instV(c, "Pager", `Breakpoint=${kind === "phone" ? "Mobile" : "Desktop"}`, { texts: { Summary: o.summary || `Showing 1–${rows.length} of 46` }, props: { sizingH: "fill" } }); }
  return c;
}
function phoneCards(b, main, rows) {
  const list = vframe(b, main, "Cards", 10);
  rows.forEach((d) => {
    const [no, date, jo, co, std, n, of, st, dl, late, roa] = d;
    const c = vframe(b, list, "Batch card", 8, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: 16 });
    const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" });
    const l = vframe(b, top, "Ids", 0, { sizeH: "hug" }); txt(b, l, no, "Data/Strong", "Text/heading", "Number"); txt(b, l, date, "Caption/Regular", "Text/text-muted", "Date");
    b.instV(top, "Status badge", `Status=${st}, Size=md`);
    const j = hframe(b, c, "Job order", 8, { sizeH: "fill" }); txt(b, j, jo, "Data", "Primary/primary", "Job order"); txt(b, j, co, "Caption/Regular", "Text/text-secondary", "Company");
    const m = hframe(b, c, "Meta", 12, { sizeH: "fill", wrap: true });
    const a = hframe(b, m, "Samples", 4); icon(b, a, "stack"); txt(b, a, n + " / " + (of ? of.replace("of ", "") : n), "Body small/Regular", "Text/foreground", "Samples");
    const d2 = hframe(b, m, "Deadline", 4); icon(b, d2, "calendar-blank", late ? "Feedback/error" : "Text/text-muted"); txt(b, d2, dl, "Body small/Regular", late ? "Feedback/error" : "Text/text-secondary", "Deadline"); if (late) txt(b, d2, "Past due", "Body small/SemiBold", "Feedback/error", "Past due");
    if (roa) { const r = hframe(b, m, "RoA", 4); icon(b, r, "file-pdf", "Primary/primary"); txt(b, r, roa, "Data", "Primary/primary", "RoA"); }
  });
}
function listFrame(b, x, y, kind, o = {}) {
  page(b, kind);
  const s = b.shell({ name: `Batch list · ${o.variant} · ${KIND(kind)}`, x, y, kind, active: "Batches", role: o.role || "Lab" });
  header(b, s.main, kind);
  chips(b, s.main, o.on || ["All"], o.counts);
  filters(b, s.main, kind, o);
  if (o.state === "empty") b.instV(s.main, "Empty state", "Size=Page", { texts: { 0: "No batches yet", 1: "Batches are created from a job order. Open a job order and use Add batch." }, props: { sizingH: "fill" } });
  else if (o.state === "none") b.instV(s.main, "Empty state", "Size=Page", { texts: { 0: "No batches match", 1: "Nothing matches B-2025. Check the number or clear the filters." }, props: { sizingH: "fill" } });
  else if (kind === "phone") phoneCards(b, s.main, o.rows || ROWS.slice(0, 5));
  else tableCard(b, s.main, kind, o.rows || ROWS, o.table);
  if (kind === "phone") { const bar = b.frame(s.root, { name: "Sticky bar", w: 390, h: 76, fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "h", gap: 10, pad: 16, cross: "center", sizeH: "fill", sizeV: "fixed" }); btn(b, bar, "Primary", "Add batch", "plus", { size: "touch", fill: true }); }
  return s;
}
const fix = (b, s, kind, h) => { b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: h } }); scrimOver(b, s.root, W[kind], h); };

exports.build = (b) => {
  clearG(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "G  Batch list"); });
  const DX = 1560, TX = 954, PX = 510, d = Y.desktop, t = Y.tablet, p = Y.phone;
  listFrame(b, 0, d, "desktop", { variant: "Default" });
  listFrame(b, DX, d, "desktop", { variant: "Batches_to_prepare", role: "Prep", on: ["Created", "Preparation"], rows: PREP_ROWS, counts: { All: "46" }, table: { summary: "Showing 1–4 of 7" } });
  listFrame(b, DX * 2, d, "desktop", { variant: "Empty", state: "empty", counts: { All: "0", Created: "0", Preparation: "0", "Prep finished": "0", Analysis: "0", "Analysis finished": "0", Completed: "0" } });
  listFrame(b, DX * 3, d, "desktop", { variant: "No_results", state: "none", query: "B-2025", counts: { All: "0", Created: "0", Preparation: "0", "Prep finished": "0", Analysis: "0", "Analysis finished": "0", Completed: "0" } });
  { const s = listFrame(b, 0, d + 1300, "desktop", { variant: "Filters" }); fix(b, s, "desktop", 1200);
    dialogAt(b, s.root, "lg", Math.round((1440 - 800) / 2) + 64, 140, "Filters", "Narrow the batch list.", "Clear all", "Show 12 batches", (bd) => filterDialog(b, bd)); }
  { const s = listFrame(b, DX, d + 1300, "desktop", { variant: "Add_batch_choose_job_order" }); fix(b, s, "desktop", 1200);
    dialogAt(b, s.root, "sm", Math.round((1440 - 400) / 2) + 64, 260, "Add batch", "A batch is created from a job order. Choose the job order first.", "Cancel", "Next", (bd) => { const f = vframe(b, bd, "Fields", 12); b.instV(f, "Select", "State=Focused, Size=md", { texts: { Label: "Job order *", Value: "Search job order or company" }, setProps: { "Show helper": true }, props: { sizingH: "fill" } }); [["JO-2026-0137", "PT Kaltara Energi Prima"], ["JO-2026-0139", "PT Mahakam Coal Resources"], ["JO-2026-0142", "PT Bara Nusantara Mandiri"]].forEach(([jo, co], i) => b.instV(f, "Option row", `State=${i === 0 ? "Selected" : "Default"}`, { texts: { Name: jo, Detail: co }, props: { sizingH: "fill" } })); }); }
  listFrame(b, 0, t, "tablet", { variant: "Default" });
  listFrame(b, 0, p, "phone", { variant: "Default" });
  { const s = listFrame(b, PX, p, "phone", { variant: "Filters" }); fix(b, s, "phone", 1100);
    const v = b.v("Bottom sheet"); const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: "Filters" }, props: { absolute: true, x: 0, y: 1100 - 620, width: 390 } });
    const bt = v.insts.filter((i) => i.name === "Button"); b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: "Clear all" } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: "Show 12 batches" } });
    b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug", fill: "none", mainAlign: "min", gap: 14 } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } }); filterFields(b, id + v.names.Body, true); }
  b.gEnd = { desktop: d + 1300 + 1200 + 400, tablet: t + 1100 + 400, phone: p + 1700 + 400 };
};
function filterFields(b, bd, phone) {
  b.raw("node.set", { ids: [bd], props: { fill: "none", mainAlign: "min", gap: 14 } });
  const sz = phone ? "touch" : "md";
  [["Company", "All companies", "Select"], ["Standard", "ASTM", "Select"], ["Job order", "Any job order", "Select"]].forEach(([l, v, s]) => b.instV(bd, s, `State=Filled, Size=${sz}`, { texts: { Label: l, Value: v }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }));
  const r = b.frame(bd, { name: "Dates", w: 400, h: 70, layout: phone ? "v" : "h", gap: 12, sizeH: "fill", sizeV: "hug" });
  [["Batch date from", "1 Oct 2026"], ["Batch date to", "4 Nov 2026"], ["Deadline from", "Any date"], ["Deadline to", "Any date"]].slice(0, phone ? 4 : 2).forEach(([l, v]) => b.instV(r, "Date field", `State=Filled, Size=${sz}`, { texts: { Label: l, Value: v }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }));
  if (!phone) { const r2 = b.frame(bd, { name: "Deadline", w: 400, h: 70, layout: "h", gap: 12, sizeH: "fill", sizeV: "hug" }); [["Deadline from", "Any date"], ["Deadline to", "Any date"]].forEach(([l, v]) => b.instV(r2, "Date field", "State=Default, Size=md", { texts: { Label: l, Value: v }, setProps: { "Show helper": false }, props: { sizingH: "fill" } })); }
}
function filterDialog(b, bd) {
  const f = vframe(b, bd, "Fields", 14);
  const row = (a, c) => { const r = b.frame(f, { name: "Row", w: 700, h: 70, layout: "h", gap: 12, sizeH: "fill", sizeV: "hug" }); [a, c].forEach(([set, l, v, st]) => b.instV(r, set, `State=${st || "Filled"}, Size=md`, { texts: { Label: l, Value: v }, setProps: { "Show helper": false }, props: { sizingH: "fill" } })); };
  row(["Select", "Company", "All companies"], ["Select", "Status", "All statuses"]);
  row(["Select", "Standard", "ASTM"], ["Select", "Job order", "Any job order"]);
  row(["Date field", "Batch date from", "1 Oct 2026"], ["Date field", "Batch date to", "4 Nov 2026"]);
  row(["Date field", "Deadline from", "Any date", "Default"], ["Date field", "Deadline to", "Any date", "Default"]);
}
