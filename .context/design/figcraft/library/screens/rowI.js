// Row I · Dashboard (module 02: 01 Operations, 02 Quality_and_reports). Plan: .context/docs/Dashboard/Dashboard_v2_Screen_Plan.md (Revision 2).
// Run after row H: build-screens.js C,D,E,G,F,H,I,J. Frames are created under their final names.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver } = H;

const I_NAMES = /^(Desktop|Tablet|Phone)-02-Dashboard-/;
const isI = (n) => I_NAMES.test(n.name || "") || (n.name === "Row title" && /^I( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isI(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.hEnd ? b.hEnd[k] : 0); }
  return out;
}
const clearI = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isI(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const icon = (b, parent, glyph, tok = "Text/text-muted", size = 14) => { const ic = b.instV(parent, "Icon", `Glyph=${glyph}, Size=${size}`); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const txt = (b, parent, t, style, color, name, o = {}) => b.text(parent, t, { style, color, name: name || t, ...o });
const hframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "h", gap, cross: o.cross || "center", main: o.main, wrap: o.wrap, pad: o.pad, sizeH: o.sizeH || "hug", sizeV: o.sizeV || "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw, clip: o.clip });
const vframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "v", gap, pad: o.pad, cross: o.cross, sizeH: o.sizeH || "fill", sizeV: "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });
const btn = (b, parent, type, label, glyph, o = {}) => b.instV(parent, "Button", `Type=${type}, Tone=Default, Size=${o.size || "md"}, State=${o.state || "Default"}`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false }, props: o.fill ? { sizingH: "fill" } : undefined });
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const cardTop = (b, c, title, o = {}) => { const hd = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" }); txt(b, hd, title, "Heading/H3", "Text/heading", "Title"); return hd; };
const OVERLINE = "THURSDAY 5 NOVEMBER 2026";

// positions of named layers inside a standalone component (pre-order, root = 0)
function compPos(b, name) {
  const N = b.reg.N, root = b.reg.comps[name].id, out = {}; let pos = 0;
  const walk = (i) => { const n = N[i]; if (pos > 0) (out[n.name] = out[n.name] || []).push(pos); pos++; (n.children || []).forEach(walk); };
  walk(root); return out;
}
const setIn = (b, id, map, name, val, i = 0) => b.raw("node.set", { ids: [id + map[name][i]], props: { characters: val } });

// ---------- demo data ----------
const COMPANIES = ["PT Bara Nusantara Mandiri", "CV Sumber Batu Hitam", "PT Kaltara Energi Prima", "PT Bukit Asam"];
const ROWS = [
  ["B-2026-0417", COMPANIES[0], "JO-2026-0138", "5 Nov", "due", "Preparation", "9 / 12"],
  ["B-2026-0415", COMPANIES[3], "JO-2026-0135", "4 Nov", "late", "Analysis finished", "36 / 36"],
  ["B-2026-0418", COMPANIES[0], "JO-2026-0139", "6 Nov", "", "Analysis", "26 / 36"],
  ["B-2026-0422", COMPANIES[2], "JO-2026-0137", "7 Nov", "", "Receiving", "6 / 8"],
  ["B-2026-0421", COMPANIES[1], "JO-2026-0140", "7 Nov", "", "Preparation", "3 / 6"],
  ["B-2026-0420", COMPANIES[2], "JO-2026-0141", "8 Nov", "", "Analysis", "12 / 20"],
  ["B-2026-0413", COMPANIES[1], "JO-2026-0136", "3 Nov", "late", "Created", "0 / 5"],
  ["B-2026-0419", COMPANIES[3], "JO-2026-0142", "10 Nov", "", "Preparation", "8 / 8"],
];
const WORKFLOW = [["Created", 3, "Status/st-created"], ["Receiving", 2, "Status/st-created"], ["Preparation", 7, "Status/st-prep"], ["Prep finished", 2, "Status/st-prep"], ["Analysis", 9, "Status/st-analysis"], ["Analysis finished", 2, "Status/st-finished"], ["Completed", 4, "Status/st-completed"]];
const JOB_ORDERS = [["Draft", 3], ["Awaiting samples", 9], ["In progress", 21], ["Reported", 4], ["Delivered", 87]];
const PERDAY = [34, 52, 61, 48, 70, 12, 8, 64, 58, 77, 69, 82, 14, 9];
const TURN = [["PT Bara Nusantara Mandiri", 4.1, "Feedback/success"], ["CV Sumber Batu Hitam", 5.6, "Feedback/warning"], ["PT Kaltara Energi Prima", 4.8, "Feedback/success"], ["PT Bukit Asam", 7.2, "Feedback/error"]];
const DRILL = [
  ["DH-BNM-021", COMPANIES[0], 19, "RoA-0417", "CoA-BNM-021.pdf", "2 Nov"], ["DH-BNM-022", COMPANIES[0], 32, "RoA-0417", "CoA-BNM-022.pdf", "2 Nov"], ["DH-BKA-007", COMPANIES[3], 36, "RoA-0415", "CoA-BKA-007.pdf", "28 Oct"], ["DH-BKA-008", COMPANIES[3], 14, "RoA-0415", "CoA-BKA-008.pdf", "28 Oct"],
  ["DH-KEP-031", COMPANIES[2], 16, "RoA-0422", "", ""], ["DH-KEP-032", COMPANIES[2], 11, "RoA-0420", "CoA-KEP-032.pdf", "1 Nov"], ["DH-SBH-040", COMPANIES[1], 6, "RoA-0421", "", ""], ["DH-SBH-041", COMPANIES[1], 5, "RoA-0413", "CoA-SBH-041.pdf", "30 Oct"],
];
const QUEUES = {
  Lab: [["Batches to receive", 2, false], ["Signed RoA to upload", 1, false], ["CoAs to generate", 1, true]],
  CSO: [["Batches to receive", 2, false], ["Samples awaiting arrival", 1, false], ["CoAs to send", 3, true]],
};

// ---------- pieces ----------
const segmented = (b, parent, labels, on, o = {}) => {
  const bar = hframe(b, parent, "Tab switch", 2, { sizeH: o.fill ? "fill" : "hug", fill: "Surface/muted", r: 10, pad: [4, 4, 4, 4], main: o.fill ? "center" : undefined });
  labels.forEach((l, i) => { const id = b.instV(bar, "Segmented item", `Selected=${i === on ? "On" : "Off"}, State=Default`, { texts: { Label: l }, props: o.fill ? { sizingH: "fill" } : undefined }); });
  return bar;
};
// page tabs (owner, Nov 5, 2026): library Tab instances in a Tabs frame, as on the job order and batch pages
const pageTabs = (b, main, kind, sel) => {
  const r = b.frame(main, { name: "Tabs", w: 800, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug", clip: kind === "phone" });
  ["Operations", "Quality & reports"].forEach((l, i) => b.instV(r, "Tab", `Selected=${i === sel ? "On" : "Off"}, State=Default`, { texts: { 0: l }, hide: ["Count"] }));
  return r;
};
function header(b, main, kind, o) {
  const cw = o.cw;
  const filters = (parent) => { b.instV(parent, "Select", "State=Filled, Size=md", { texts: { Label: "Period", Value: "Last 30 days" }, setProps: { "Show helper": false }, props: { width: 200, sizingH: "fixed" } }); b.instV(parent, "Select", "State=Filled, Size=md", { texts: { Label: "Company", Value: "All companies" }, setProps: { "Show helper": false }, props: { width: 220, sizingH: "fixed" } }); };
  const tb = (parent) => { const h = vframe(b, parent, "Title block", 4, { sizeH: kind === "desktop" ? "hug" : "fill" }); txt(b, h, kind === "phone" ? "DASHBOARD" : OVERLINE, "Overline", "Text/text-muted", "Overline"); txt(b, h, "Dashboard", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title"); return h; };
  if (kind === "desktop") {
    const r = hframe(b, main, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "max" }); tb(r); const f = hframe(b, r, "Filters", 12, { cross: "max" }); filters(f);
    if (o.tabs) pageTabs(b, main, kind, o.tab === "Quality" ? 1 : 0);
  } else if (kind === "tablet") {
    tb(b.frame(main, { name: "Title row", w: cw, h: 60, layout: "h", sizeH: "fill", sizeV: "hug" }));
    const f = hframe(b, main, "Filters", 12, { sizeH: "fill", cross: "max" }); filters(f);
    if (o.tabs) pageTabs(b, main, kind, o.tab === "Quality" ? 1 : 0);
  } else {
    const r = hframe(b, main, "Header", 12, { sizeH: "fill", main: "spaceBetween", cross: "max" }); tb(r); btn(b, r, "Secondary", "Filters", "funnel", { size: "touch" });
    if (o.tabs) pageTabs(b, main, kind, o.tab === "Quality" ? 1 : 0);
  }
}
function queuesStrip(b, parent, kind, key) {
  const c = card(b, parent, "Your queues card");
  if (kind === "phone") {
    cardTop(b, c, "Your queues");
    const row = hframe(b, c, "Queue chips", 8, { sizeH: "fill", clip: true });
    QUEUES[key].forEach(([n, k, late]) => { const ch = hframe(b, row, "Queue chip", 8, { fill: "Surface/muted", r: 10, pad: [8, 12, 8, 12] }); txt(b, ch, n, "Body small/Medium", "Text/foreground", "Queue"); txt(b, ch, String(k), "Body small/SemiBold", late ? "Feedback/error" : "Text/heading", "Count"); });
    btn(b, c, "Ghost", "Open My work", "arrow-right");
    return c;
  }
  const row = hframe(b, c, "Queues", 28, { sizeH: "fill", main: "spaceBetween" });
  const l = hframe(b, row, "Items", 28, { wrap: false });
  txt(b, l, "Your queues", "Heading/H3", "Text/heading", "Title");
  QUEUES[key].forEach(([n, k, late]) => { const it = hframe(b, l, "Queue", 8); txt(b, it, n, "Body small/Regular", "Text/text-secondary", "Queue"); txt(b, it, String(k), "Body/SemiBold", late ? "Feedback/error" : "Text/heading", "Count"); if (late) icon(b, it, "warning", "Feedback/error"); });
  btn(b, row, "Ghost", "Open My work", "arrow-right");
  return c;
}
function kpis(b, parent, kind, list) {
  const row = b.frame(parent, { name: "KPI strip", w: 400, h: 120, layout: "h", gap: kind === "phone" ? 12 : 16, wrap: kind !== "desktop", sizeH: "fill", sizeV: "hug" });
  const w = kind === "tablet" ? 341 : kind === "phone" ? 173 : undefined;
  list.forEach((k) => {
    const kind2 = k.progress ? "Progress" : "Delta";
    const o = { texts: k.progress ? { 0: k.label, 1: k.number, Value: k.value, Caption: k.caption } : { 0: k.label, 1: k.number, Caption: k.caption }, props: w ? { width: w, sizingH: "fixed" } : { sizingH: "fill" }, hide: [], fills: k.fill ? { Caption: k.fill } : undefined };
    if (!k.progress) { if (k.delta) o.texts[2] = k.delta; else o.hide.push("Delta"); if (k.down) o.swaps = [["Delta", "Delta", "Direction=Down"]]; }
    b.instV(row, "Card KPI", `Kind=${kind2}`, o);
  });
  return row;
}
// horizontal bars (owner, Nov 5, 2026): Label 120 | Bar container (fill, clips, no fill) holding the Bar | Value (hug).
// The values line up at the right edge of the card. w is the card width, used to size the bars.
const charW = (t) => t.length * 8;
function hbars(b, parent, rows, max, w, labelW = 120) {
  const list = vframe(b, parent, "Bars", 10);
  const valW = Math.max(...rows.map(([l, v, c, t]) => charW(t || String(v))));
  const cont = w - 32 - labelW - 20 - valW;
  rows.forEach(([l, v, col, t]) => {
    const r = hframe(b, list, "Bar row", 10, { sizeH: "fill" });
    const lf = b.frame(r, { name: "Label", w: labelW, h: 16, layout: "h", cross: "center", sizeH: "fixed", sizeV: "hug" }); txt(b, lf, l, "Caption/Regular", "Text/text-secondary", "Label");
    const bc = b.frame(r, { name: "Bar container", w: cont, h: 14, clip: true, sizeH: "fill", sizeV: "fixed" });
    b.frame(bc, { name: "Bar", w: Math.max(6, Math.round((v / max) * cont)), h: 14, fill: col, r: 4 });
    txt(b, r, t || String(v), "Data", "Text/foreground", "Value");
  });
}
// vertical bars (owner, Nov 5, 2026): Column = Bar container (fixed width, height ch) with the Bar standing on its bottom, then Day
function vbars(b, parent, data, ch, w) {
  const cols = hframe(b, parent, "Bars", 6, { sizeH: "fill", main: "spaceBetween", cross: "max" });
  const mx = Math.max(...data);
  data.forEach((v, i) => {
    const c = vframe(b, cols, "Column", 4, { sizeH: "hug", cross: "center" });
    const bc = b.frame(c, { name: "Bar container", w, h: ch, clip: true, sizeH: "fixed", sizeV: "fixed" });
    const h = Math.max(4, Math.round((v / mx) * ch)); b.frame(bc, { name: "Bar", w, h, y: ch - h, fill: "Primary/primary", r: 4 });
    txt(b, c, String(i + 23 > 30 ? i - 7 : i + 23), "Caption/Regular", "Text/text-muted", "Day");
  });
}
const panel = (b, parent, title, w, h, fill) => { const c = card(b, parent, title + " card"); b.raw("node.set", { ids: [c], props: { ...(w && !fill ? { width: w, sizingH: "fixed" } : { ...(w ? { width: w } : {}), sizingH: "fill" }), ...(h ? { sizingV: "fixed", height: h } : {}) } }); const hd = cardTop(b, c, title); return { c, hd }; };
const emptyCard = (b, c) => b.instV(c, "Empty state", "Size=Card", { texts: { Title: "No data for this period", Text: "Try a longer period or another company.", Label: "Last 90 days" }, props: { sizingH: "fill" } });

// ---------- Operations widgets (plan O6 to O13) ----------
function workflowCard(b, parent, w, o) {
  const { c } = panel(b, parent, "Batch workflow", w, o.empty ? undefined : o.h, o.fill);
  if (o.empty) return emptyCard(b, c);
  hbars(b, c, WORKFLOW.map(([l, v, col]) => [l, v, col]), 9, w || FULLW);
}
function jobOrdersCard(b, parent, w, o) {
  const { c } = panel(b, parent, "Job orders by status", w, o.empty ? undefined : o.h, o.fill);
  if (o.empty) return emptyCard(b, c);
  hbars(b, c, JOB_ORDERS.map(([l, v]) => [l, v, "Primary/primary"]), 87, w || FULLW);
}
function mixCard(b, parent, w, o) {
  const { c } = panel(b, parent, "Sample type mix", w, o.empty ? undefined : o.h, o.fill);
  if (o.empty) return emptyCard(b, c);
  const side = !o.phone;
  const row = side ? hframe(b, c, "Mix", 12, { sizeH: "fill", cross: "center" }) : vframe(b, c, "Mix", 12, { cross: "center" });
  const d = b.comp(row, "Donut");
  const pos = compPos(b, "Donut"); b.raw("node.set", { ids: [d + pos.Total[0]], props: { characters: "1,284" } });
  const lg = side ? vframe(b, row, "Legend", 10) : hframe(b, row, "Legend", 12, { sizeH: "fill", main: "center", wrap: true });
  [["Primary", "Ply", "46%"], ["Accent", "Composite", "27%"], ["Success", "Roof, floor", "19%"], ["Purple", "Parting", "8%"]].forEach(([col, l, v]) => b.instV(lg, "Legend item", `Color=${col}`, { texts: { Label: l, Value: v } }));
}
function perDayCard(b, parent, w, o) {
  const { c } = panel(b, parent, "Samples received per day", w, o.empty ? undefined : o.h, o.fill);
  if (o.empty) return emptyCard(b, c);
  vbars(b, c, PERDAY, o.h ? o.h - 100 : 92, w && w < 500 ? 16 : 22);
}
function turnCard(b, parent, w, o) {
  const { c, hd } = panel(b, parent, "Turnaround by company", w, o.empty ? undefined : o.h, o.fill);
  if (o.empty) return emptyCard(b, c);
  txt(b, hd, "Target 5 days", "Caption/Regular", "Text/text-muted", "Target");
  hbars(b, c, TURN.map(([l, v, col]) => [l.replace("PT ", "").replace("CV ", ""), v, col, v.toFixed(1) + " d"]), 8, w || FULLW);
}
function weekCard(b, parent, kind, o = {}) {
  const { c } = panel(b, parent, "This week"); if (kind === "desktop" && !o.empty) b.raw("node.set", { ids: [c], props: { sizingV: "fill" } });
  const strip = hframe(b, c, "Week strip", kind === "phone" ? 6 : 8, { sizeH: "fill", main: "spaceBetween", clip: true });
  [["Mon", 2], ["Tue", 3], ["Wed", 4], ["Thu", 5], ["Fri", 6], ["Sat", 7], ["Sun", 8]].forEach(([d, n]) => { const st = n === 5 ? "Today" : [6, 7].includes(n) ? "Has due" : "Default"; b.instV(strip, "Calendar day", `State=${st}`, { texts: { Weekday: d, Date: String(n) } }); });
  const di = compPos(b, "Deadline item");
  [["B-2026-0417", "Thu 5 Nov", "17:00", COMPANIES[0]], ["B-2026-0418", "Fri 6 Nov", "12:00", COMPANIES[0]]].forEach(([nb, d, t, co]) => {
    const id = b.comp(c, "Deadline item", { props: { sizingH: "fill" } });
    setIn(b, id, di, "Batch", nb); setIn(b, id, di, "Meta", d); setIn(b, id, di, "Meta 2", t); setIn(b, id, di, "Meta 3", co);
  });
  return c;
}
function alertCard(b, parent, kind) {
  return b.instV(parent, "Card callout", "Tone=Alert", { texts: { Overline: "DEADLINE ALERT", Title: "3 batches are due within 24 h", Text: "B-2026-0417 is still in preparation." }, props: { sizingH: "fill" } });
}
function tableHead(b, t, cols) {
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (h) txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); });
}
function tableLine(b, t, cols) {
  const r = vframe(b, t, "Row", 0);
  const line = b.frame(r, { name: "Cells", w: 800, h: 52, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  const cells = cols.map(([h, w]) => ({ h, f: b.frame(line, { name: "Cell", w: w || 120, h: 52, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }) }));
  b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  return cells;
}
function activeTable(b, parent, kind, o) {
  const c = card(b, parent, "Active batches table card"); b.raw("node.set", { ids: [c], props: { sizingH: "fill" } });
  const hd = cardTop(b, c, "Active batches");
  const ch = hframe(b, hd, "Filter chips", 8); [["All", "23", 1], ["Due", "9", 0], ["Late", "2", 0]].forEach(([l, n, on]) => b.instV(ch, "Filter chip", `Selected=${on ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: n } }));
  if (o.empty) return emptyCard(b, c);
  if (kind === "phone") {
    ROWS.slice(0, 4).forEach(([no, co, jo, dl, flag, st, pr]) => {
      const it = vframe(b, c, "Item card", 8, { fill: "Surface/muted", r: 12, pad: [12, 12, 12, 12] });
      const top = hframe(b, it, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, top, no, "Data/Strong", "Text/heading", "Number"); b.instV(top, "Status badge", `Status=${st}, Size=sm`);
      txt(b, it, co, "Caption/Regular", "Text/text-secondary", "Company");
      const m = hframe(b, it, "Meta", 12, { sizeH: "fill" }); const d = hframe(b, m, "Deadline", 4); icon(b, d, "calendar-blank", flag === "late" ? "Feedback/error" : "Text/text-muted"); txt(b, d, dl, "Body small/Regular", flag === "late" ? "Feedback/error" : "Text/text-secondary", "Deadline"); if (flag === "late") txt(b, d, "Past due", "Body small/SemiBold", "Feedback/error", "Past due");
      txt(b, m, pr, "Body small/Regular", "Text/text-secondary", "Progress");
    });
    return c;
  }
  const cols = kind === "desktop" ? [["Batch", 120], ["Company", 0], ["Job order", 120], ["Deadline", 100], ["Progress", 80], ["Status", 140]] : [["Batch", 0], ["Deadline", 120], ["Progress", 80], ["Status", 150]];
  const t = vframe(b, c, "Table", 0);
  tableHead(b, t, cols);
  ROWS.forEach(([no, co, jo, dl, flag, st, pr]) => {
    tableLine(b, t, cols).forEach(({ h, f }) => {
      if (h === "Batch") { if (kind === "desktop") txt(b, f, no, "Data/Strong", "Text/heading", "Number"); else { const t2 = vframe(b, f, "Two lines", 0); txt(b, t2, no, "Data/Strong", "Text/heading", "Number"); txt(b, t2, co, "Caption/Regular", "Text/text-secondary", "Company"); } }
      if (h === "Company") txt(b, f, co, "Body small/Regular", "Text/foreground", "Company", { fill: true });
      if (h === "Job order") txt(b, f, jo, "Data", "Primary/primary", "Job order");
      if (h === "Deadline") { txt(b, f, dl, "Body small/Regular", flag === "late" ? "Feedback/error" : flag === "due" ? "Feedback/warning" : "Text/foreground", "Deadline"); if (flag === "late") icon(b, f, "warning", "Feedback/error"); }
      if (h === "Progress") txt(b, f, pr, "Body small/Regular", "Text/text-secondary", "Progress");
      if (h === "Status") b.instV(f, "Status badge", `Status=${st}, Size=md`);
    });
  });
  b.instV(c, "Pager", "Breakpoint=Desktop", { texts: { Summary: "Showing 1–8 of 23" }, props: { sizingH: "fill" } });
  return c;
}

// ---------- Quality widgets (plan Q1 to Q7) ----------
function scatterCard(b, parent, w, title, r2, kind) {
  const { c, hd } = panel(b, parent, title, w, kind === "phone" ? undefined : 300);
  txt(b, hd, r2, "Caption/SemiBold", "Text/text-secondary", "R2");
  const row = hframe(b, c, "Plot", 0, { sizeH: "fill", main: "center", clip: true });
  b.comp(row, "Scatter", { props: kind === "phone" ? { width: 326 } : {} });
  return c;
}
function trendCard(b, parent, kind) {
  const { c, hd } = panel(b, parent, "Trend CV");
  b.instV(hd, "Segmented control", "Items=4, Selected=2", { texts: { 0: "ADB", 1: "AR", 2: "DB", 3: "DAF" } });
  const row = hframe(b, c, "Plot", 0, { sizeH: "fill", main: "center", clip: true });
  const W = kind === "desktop" ? 1096 : kind === "tablet" ? 666 : 520, tp = compPos(b, "Trend");
  const t = b.comp(row, "Trend", { props: { width: W } });
  [["Limit"], ["X axis"], ["Vector"]].forEach(([n]) => b.raw("node.set", { ids: [t + tp[n][0]], props: { width: W - 40 } }));
}
function drillTable(b, parent, kind, o) {
  const c = card(b, parent, "Drill holes table card"); b.raw("node.set", { ids: [c], props: { sizingH: "fill" } });
  const hd = cardTop(b, c, "Drill holes");
  const tools = hframe(b, hd, "Tools", 8); [["All", "74", !o.missing], ["Missing CoA", "12", !!o.missing]].forEach(([l, n, on]) => b.instV(tools, "Filter chip", `Selected=${on ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: n } }));
  if (kind !== "phone") b.instV(tools, "Search", "Size=sm, State=Default", { texts: { Value: "Search drill hole" }, props: { width: kind === "desktop" ? 240 : 180 }, hide: ["Scan"] });
  const rows = o.missing ? DRILL.filter((d) => !d[4]) : DRILL;
  if (kind === "phone") {
    b.instV(c, "Search", "Size=lg, State=Default", { texts: { Value: "Search drill hole" }, props: { sizingH: "fill" }, hide: ["Scan"] });
    rows.slice(0, 4).forEach(([code, co, n, roa, file]) => {
      const it = vframe(b, c, "Item card", 8, { fill: "Surface/muted", r: 12, pad: [12, 12, 12, 12] });
      const top = hframe(b, it, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, top, code, "Data/Strong", "Text/heading", "Code"); b.instV(top, "Tag", file ? "Type=CoA uploaded" : "Type=CoA missing");
      txt(b, it, co, "Caption/Regular", "Text/text-secondary", "Company");
      const m = hframe(b, it, "Meta", 12, { sizeH: "fill" }); txt(b, m, n + " samples", "Body small/Regular", "Text/text-secondary", "Samples"); txt(b, m, roa, "Data", "Text/text-secondary", "RoA");
      if (!file) btn(b, it, "Secondary", "Upload CoA", "upload-simple", { size: "touch", fill: true });
    });
    return c;
  }
  const cols = kind === "desktop" ? [["Code", 120], ["Company", 0], ["Samples", 90], ["RoA", 130], ["CoA", 240], ["", 150]] : [["Code", 110], ["Samples", 80], ["CoA", 0], ["", 140]];
  const t = vframe(b, c, "Table", 0);
  tableHead(b, t, cols);
  rows.forEach(([code, co, n, roa, file, d]) => {
    tableLine(b, t, cols).forEach(({ h, f }) => {
      if (h === "Code") txt(b, f, code, "Data/Strong", "Text/heading", "Code");
      if (h === "Company") txt(b, f, co, "Body small/Regular", "Text/foreground", "Company");
      if (h === "Samples") txt(b, f, String(n), "Body small/Regular", "Text/foreground", "Samples");
      if (h === "RoA") txt(b, f, roa, "Data", "Text/text-secondary", "RoA");
      if (h === "CoA") { if (file) { b.instV(f, "Tag", "Type=CoA uploaded"); txt(b, f, file, "Caption/Regular", "Text/text-secondary", "File"); } else b.instV(f, "Tag", "Type=CoA missing"); }
      if (h === "") btn(b, f, "Secondary", file ? "Replace CoA" : "Upload CoA", "upload-simple");
    });
  });
  b.instV(c, "Pager", "Breakpoint=Desktop", { texts: { Summary: o.missing ? "Showing 1–4 of 12" : "Showing 1–8 of 74" }, props: { sizingH: "fill" } });
  return c;
}

// ---------- frames ----------
const CW = { desktop: 1128, tablet: 698, phone: 358 };
let FULLW = 400;
function frameOf(b, x, y, kind, name, o) {
  page(b, kind);
  const s = b.shell({ name, x, y, kind, active: "Dashboard", role: o.role, collapsed: o.collapsed });
  const cw = kind === "desktop" && o.collapsed ? 1288 : CW[kind];
  header(b, s.main, kind, { ...o, cw });
  return { s, cw };
}
const OPS_Q = { number: [["Batches in progress", "23", "4 completed · 27 total"], ["Due this week", "9", "2 past due · 7 on time"], ["Samples received", "1,284", "Last 30 days · 46 batches"], ["Mean turnaround", "4.6 d", "Target 5 d · On target"]] };
function operations(b, x, y, kind, variant, o = {}) {
  const name = `${KIND(kind)}-02-Dashboard-01-Operations-${o.vv}-${variant}`;
  const { s, cw } = frameOf(b, x, y, kind, name, { tabs: o.tabs, tab: "Ops", role: o.role, collapsed: o.collapsed });
  const m = s.main, e = !!o.empty; FULLW = cw;
  if (o.queues) queuesStrip(b, m, kind, o.queues);
  kpis(b, m, kind, e
    ? [{ label: "Batches in progress", number: "0", caption: "0 completed · 0 total" }, { label: "Due this week", number: "0", caption: "0 past due · 0 on time" }, { label: "Samples received", number: "0", caption: "Last 30 days · 0 batches" }, { label: "Mean turnaround", number: "No data", caption: "Target 5 d" }]
    : [{ label: "Batches in progress", number: "23", caption: "4 completed · 27 total" }, { label: "Due this week", number: "9", caption: "2 past due · 7 on time", fill: "Feedback/error" }, { label: "Samples received", number: "1,284", delta: "+12%", caption: "Last 30 days · 46 batches" }, { label: "Mean turnaround", number: "4.6 d", caption: "Target 5 d · On target" }]);
  const cw2 = Math.floor((cw - 16) / 2);
  const mk = (n) => b.frame(m, { name: n, w: cw, h: 300, layout: kind === "phone" ? "v" : "h", gap: kind === "phone" ? 12 : 16, cross: "min", sizeH: "fill", sizeV: "hug" });
  if (kind === "desktop") {
    // owner, Nov 5, 2026: the bar cards fill, Sample type mix and Turnaround stay 365; the right rail is 365 and fills the row's height
    const SIDE = 365, half = Math.floor((cw - 32 - SIDE) / 2), wide = cw - 16 - SIDE;
    const r1 = mk("Charts row 1"); workflowCard(b, r1, half, { empty: e, h: 282, fill: true }); jobOrdersCard(b, r1, half, { empty: e, h: 282, fill: true }); mixCard(b, r1, SIDE, { empty: e, h: 282 });
    const r2 = mk("Charts row 2"); perDayCard(b, r2, wide, { empty: e, h: 192, fill: true }); turnCard(b, r2, SIDE, { empty: e, h: 192 });
    const r3 = b.frame(m, { name: "Active batches row", w: cw, h: 594, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: e ? "hug" : "fixed" });
    activeTable(b, r3, kind, { empty: e });
    const rail = vframe(b, r3, "Right rail", 16); b.raw("node.set", { ids: [rail], props: { width: SIDE, sizingH: "fixed", ...(e ? {} : { sizingV: "fill" }) } });
    if (!e) alertCard(b, rail, kind); weekCard(b, rail, kind, { empty: e });
  } else if (kind === "tablet") {
    const r1 = mk("Charts row 1"); workflowCard(b, r1, cw2, { empty: e, h: 282 }); jobOrdersCard(b, r1, cw2, { empty: e, h: 282 });
    const r2 = mk("Charts row 2"); mixCard(b, r2, cw2, { empty: e, h: 282 }); perDayCard(b, r2, cw2, { empty: e, h: 282 });
    turnCard(b, m, undefined, { empty: e });
    if (!e) alertCard(b, m, kind); weekCard(b, m, kind);
    activeTable(b, m, kind, { empty: e });
  } else {
    if (!e) alertCard(b, m, kind); weekCard(b, m, kind);
    workflowCard(b, m, undefined, { empty: e }); jobOrdersCard(b, m, undefined, { empty: e }); mixCard(b, m, undefined, { empty: e, phone: true }); perDayCard(b, m, undefined, { empty: e }); turnCard(b, m, undefined, { empty: e });
    activeTable(b, m, kind, { empty: e });
  }
  return s;
}
function quality(b, x, y, kind, variant, o = {}) {
  const name = `${KIND(kind)}-02-Dashboard-02-Quality_and_reports-${o.vv}-${variant}`;
  const { s, cw } = frameOf(b, x, y, kind, name, { tabs: true, tab: "Quality", role: o.role || "Lab" });
  const m = s.main;
  kpis(b, m, kind, [{ label: "Batches completed", number: "23", delta: "+4", caption: "27 total" }, { label: "RoA uploaded", number: "21", delta: "+3", caption: "2 waiting for upload" }, { label: "Drill holes with CoA", number: "62 of 74", progress: true, value: "84%", caption: "12 missing" }, { label: "Determinations", number: "6,840", delta: "+9%", caption: "Last 30 days" }]);
  const cw3 = Math.floor((cw - 32) / 3), cw2 = Math.floor((cw - 16) / 2);
  const mk = (n) => b.frame(m, { name: n, w: cw, h: 300, layout: "h", gap: 16, cross: "min", sizeH: "fill", sizeV: "hug" });
  const P = [["CV vs Ash", "R² 0.81, n 312"], ["RD vs Ash", "R² 0.93, n 312"], ["FC vs GCV", "R² 0.77, n 312"]];
  if (kind === "desktop") { const r = mk("Charts row"); P.forEach(([t, r2]) => scatterCard(b, r, cw3, t, r2, kind)); }
  else if (kind === "tablet") { const r = mk("Charts row"); scatterCard(b, r, cw2, P[0][0], P[0][1], kind); scatterCard(b, r, cw2, P[1][0], P[1][1], kind); scatterCard(b, m, undefined, P[2][0], P[2][1], kind); }
  else P.forEach(([t, r2]) => scatterCard(b, m, undefined, t, r2, kind));
  trendCard(b, m, kind);
  drillTable(b, m, kind, { missing: o.missing });
  return s;
}

function sidebarOpen(b, x, y, role) {
  const s = operations(b, x, y, "tablet", "Sidebar_open", { vv: "05", role, tabs: true, queues: "Lab" });
  const H = 1126;
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: H } });
  scrimOver(b, s.root, 834, H);
  const v = b.v("Sidebar", "Collapsed=No");
  const id = b.instV(s.root, "Sidebar", "Collapsed=No", { props: { absolute: true, x: 0, y: 0, sizingV: "fixed", height: H } });
  b.hideNav(id, v, role, "No");
}
function filtersSheet(b, x, y) {
  const s = operations(b, x, y, "phone", "Filters", { vv: "07", role: "Lab", tabs: true, queues: "Lab" });
  const H = 1100;
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: H } });
  scrimOver(b, s.root, 390, H);
  const v = b.v("Bottom sheet");
  const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: "Filters" }, props: { absolute: true, x: 0, y: H - 440, width: 390 } });
  const bt = v.insts.filter((i) => i.name === "Button"); b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: "Clear all" } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: "Apply" } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug", fill: "none", mainAlign: "min", gap: 14 } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } });
  const bd = id + v.names.Body;
  b.instV(bd, "Select", "State=Filled, Size=touch", { texts: { Label: "Period", Value: "Last 30 days" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(bd, "Select", "State=Filled, Size=touch", { texts: { Label: "Company", Value: "All companies" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
}
function pointTooltip(b, x, y) {
  const s = quality(b, x, y, "desktop", "Point_tooltip", { vv: "03" });
  b.instV(s.root, "Tooltip", "Placement=Top", { texts: { Text: "BNM-3507  Ash 11.8%  CV 5,420" }, props: { absolute: true, x: 420, y: 470 } });
}
exports.build = (b) => {
  clearI(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "I  Dashboard"); });
  const DX = 1560, TX = 954, PX = 510, d = Y.desktop, t = Y.tablet, p = Y.phone;
  operations(b, 0, d, "desktop", "Lab_admin", { vv: "01", role: "Lab", tabs: true, queues: "Lab" });
  operations(b, DX, d, "desktop", "Supervisor", { vv: "02", role: "Supervisor", tabs: true });
  operations(b, DX * 2, d, "desktop", "CSO", { vv: "03", role: "CSO", queues: "CSO" });
  operations(b, DX * 3, d, "desktop", "Sidebar_collapsed", { vv: "04", role: "Lab", tabs: true, queues: "Lab", collapsed: true });
  operations(b, 0, d + 3000, "desktop", "No_data", { vv: "06", role: "Lab", tabs: true, queues: "Lab", empty: true });
  quality(b, DX, d + 3000, "desktop", "Default", { vv: "01" });
  quality(b, DX * 2, d + 3000, "desktop", "Missing_CoA", { vv: "02", missing: true });
  pointTooltip(b, DX * 3, d + 3000);
  operations(b, 0, t, "tablet", "Lab_admin", { vv: "01", role: "Lab", tabs: true, queues: "Lab" });
  quality(b, TX, t, "tablet", "Default", { vv: "01" });
  sidebarOpen(b, TX * 2, t, "Lab");
  operations(b, 0, p, "phone", "Lab_admin", { vv: "01", role: "Lab", tabs: true, queues: "Lab" });
  quality(b, PX, p, "phone", "Default", { vv: "01" });
  filtersSheet(b, PX * 3, p);
  operations(b, PX * 2, p, "phone", "CSO", { vv: "03", role: "CSO", queues: "CSO" });
  b.iEnd = { desktop: d + 3000 + 2800 + 400, tablet: t + 3200 + 400, phone: p + 3600 + 400 };
};
