// Row H · My work (module 01, screens 01 Overview and 02 Queue). Plan: .context/docs/My Work/My_Work_Screen_Plan.md (Revision 2).
// Run last: build-screens.js C,D,E,G,F,H
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card } = H;

const H_NAMES = /^(My work ·|(Desktop|Tablet|Phone)-01-My_work-)/;
const isH = (n) => H_NAMES.test(n.name || "") || (n.name === "Row title" && /^H( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isH(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.fEnd ? b.fEnd[k] : 0); }
  return out;
}
const clearH = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isH(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const icon = (b, parent, glyph, tok = "Text/text-muted", size = 14) => { const ic = b.instV(parent, "Icon", `Glyph=${glyph}, Size=${size}`); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const txt = (b, parent, t, style, color, name, o = {}) => b.text(parent, t, { style, color, name: name || t, ...o });
const hframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "h", gap, cross: o.cross || "center", main: o.main, wrap: o.wrap, pad: o.pad, sizeH: o.sizeH || "hug", sizeV: o.sizeV || "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });
const vframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "v", gap, pad: o.pad, sizeH: o.sizeH || "fill", sizeV: "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });
const btn = (b, parent, type, label, glyph, o = {}) => b.instV(parent, "Button", `Type=${type}, Tone=Default, Size=${o.size || "sm"}, State=${o.state || "Default"}`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false }, props: o.fill ? { sizingH: "fill" } : undefined });

// ---------- data ----------
const QN = { Q1: ["package", "Batches to receive", "Open reception"], Q2: ["hourglass", "Samples awaiting arrival", "Open job order"], Q3: ["flask", "In preparation", "Open Preparation"], Q4: ["pencil-simple-line", "Ready for data entry", "Enter results"], Q5: ["upload-simple", "Signed RoA to upload", "Upload RoA"], Q6: ["certificate", "CoAs to generate", "Generate CoA"], Q7: ["paper-plane-tilt", "CoAs to send", "Mark sent"] };
const ROLES = {
  Lab: { role: "Lab", name: "Maya Lestari", wip: ["B-2026-0415 · RoA upload", "Started 2 h ago · CV Sumber Batu Hitam"], queues: [["Q1", 2, "Oldest waiting 6 d", "1 past due"], ["Q5", 1, "Oldest waiting 6 h"], ["Q6", 1, "Oldest waiting 2 d", "1 past due"]] },
  Prep: { role: "Prep", name: "Dedi Kurniawan", wip: ["B-2026-0422 · Reception", "Started 1 h ago · PT Kaltara Energi Prima"], queues: [["Q1", 2, "Oldest waiting 6 d", "1 past due"], ["Q2", 1, "Oldest waiting 3 d"], ["Q3", 1, "Oldest waiting 1 d", "ADL missing"]] },
  Analyst: { role: "Analyst", name: "Fitri Handayani", wip: ["B-2026-0418 · Analysis", "Started 3 h ago · PT Bara Nusantara Mandiri"], queues: [["Q4", 3, "Oldest waiting 2 d", "1 past due"]] },
  CSO: { role: "CSO", name: "Rina Kartika", wip: null, queues: [["Q1", 2, "Oldest waiting 6 d", "1 past due"], ["Q2", 1, "Oldest waiting 3 d"], ["Q7", 3, "Oldest waiting 5 d", "1 past due"]] },
};
const ACT = [
  ["DK", "Dedi Kurniawan confirmed reception of B-2026-0421", "35 min ago"], ["FH", "Fitri Handayani saved 12 values in B-2026-0418", "1 h ago"], ["ML", "Maya Lestari uploaded RoA-0417 for B-2026-0417", "2 h ago"],
  ["RK", "Rina Kartika marked CoA-JO-2026-0141-1 as sent", "3 h ago"], ["DK", "Dedi Kurniawan entered ADL for B-2026-0422", "4 h ago"], ["ML", "Maya Lestari completed B-2026-0417", "Yesterday"],
  ["RK", "Rina Kartika added batch B-2026-0422", "Yesterday"], ["FH", "Fitri Handayani finished analysis of B-2026-0415", "2 d ago"],
];
const OVERLINE = "WEDNESDAY 4 NOVEMBER 2026";

// ---------- pieces ----------
function header(b, main, kind) {
  const h = vframe(b, main, "Title block", 4);
  txt(b, h, kind === "phone" ? "MY WORK" : OVERLINE, "Overline", "Text/text-muted", "Overline");
  txt(b, h, "My work", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
}
function cardTop(b, c, title) {
  const hd = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" });
  txt(b, hd, title, "Heading/H3", "Text/heading", "Title");
  return hd;
}
function wipCard(b, parent, kind, wip) {
  const c = card(b, parent, "Work in progress card");
  cardTop(b, c, "Work in progress");
  if (kind === "phone") {
    const r = hframe(b, c, "Row", 10, { sizeH: "fill", main: "spaceBetween" });
    const t = vframe(b, r, "Text", 2, { sizeH: "hug" }); txt(b, t, wip[0].split(" · ").join("  "), "Body small/SemiBold", "Text/foreground", "Record"); txt(b, t, wip[1].split(" · ")[0], "Caption/Regular", "Text/text-muted", "Started");
    btn(b, r, "Primary", "Continue", null, { size: "touch" });
    return c;
  }
  const w = b.instV(c, "WIP row", "Property 1=Default", { texts: { Title: wip[0], Meta: wip[1], Label: "Continue" }, props: { sizingH: "fill" } });
  return c;
}
function queueGrid(b, parent, kind, queues, colW) {
  const label = txt(b, parent, "My queues", "Heading/H3", "Text/heading", "Section");
  if (kind === "phone") {
    const list = vframe(b, parent, "Queues", 10);
    queues.forEach(([q, n, meta, warn]) => {
      const [g, name] = QN[q];
      const r = hframe(b, list, "Queue row", 12, { sizeH: "fill", fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, pad: [0, 16, 0, 16], cross: "center" });
      b.raw("node.set", { ids: [r], props: { height: 64, sizingV: "fixed" } });
      icon(b, r, g, "Primary/primary", 20);
      const t = vframe(b, r, "Text", 0, { sizeH: "fill" }); txt(b, t, name, "Body small/SemiBold", "Text/foreground", "Name");
      const m = hframe(b, t, "Meta", 6); txt(b, m, meta.replace("Oldest waiting ", "Oldest "), "Caption/Regular", "Text/text-muted", "Oldest"); if (warn) { icon(b, m, "warning", "Feedback/error"); txt(b, m, warn, "Caption/SemiBold", "Feedback/error", "Past due"); }
      txt(b, r, String(n), "Heading/H3", "Text/heading", "Count"); icon(b, r, "caret-right", "Text/text-muted");
    });
    return;
  }
  const g = b.frame(parent, { name: "Queue cards", w: 400, h: 140, layout: "h", gap: 16, wrap: true, sizeH: "fill", sizeV: "hug" });
  queues.forEach(([q, n, meta, warn]) => {
    const [glyph, name] = QN[q];
    const id = b.instV(g, "Queue card", `Tone=${warn ? "Overdue" : "Default"}`, { texts: { Title: name, Count: String(n), Meta: meta, ...(warn ? { Warning: warn } : {}) }, swaps: [[0, "Icon", `Glyph=${glyph}, Size=20`]], props: { width: colW, sizingH: "fixed" } });
  });
}
function activityCard(b, parent, kind, items) {
  const c = card(b, parent, "Recent activity card");
  if (kind === "desktop") b.raw("node.set", { ids: [c], props: { width: 320, sizingH: "fixed" } });
  cardTop(b, c, "Recent activity");
  items.forEach(([i, t, tm]) => b.instV(c, "Activity item", "Property 1=Default", { texts: { 0: i, 1: t, 2: tm }, props: { sizingH: "fill" } }));
  const a = hframe(b, c, "Footer", 8, { sizeH: "fill" }); btn(b, a, "Ghost", "View all");
  return c;
}
const setCount = (b, sidebar, n) => { b.raw("node.set", { ids: [sidebar + 9], props: { visible: true } }); b.raw("node.set", { ids: [sidebar + 10], props: { characters: String(n) } }); };

// ---------- overview ----------
function overviewFrame(b, x, y, kind, key, variant, o = {}) {
  page(b, kind);
  const d = ROLES[key], total = d.queues.reduce((a, q) => a + q[1], 0);
  const s = b.shell({ name: `My work · Overview · ${variant} · ${KIND(kind)}`, x, y, kind, active: "My work", role: d.role });
  if (kind === "desktop") setCount(b, b.sidebar, o.empty ? 0 : total);
  header(b, s.main, kind);
  const row = kind === "desktop" ? b.frame(s.main, { name: "Columns", w: 1128, h: 600, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }) : null;
  const left = vframe(b, row || s.main, "Main column", 20);
  if (o.empty) {
    b.instV(left, "Empty state", "Size=Page", { texts: { Title: "All caught up", Text: "New work appears here as soon as it reaches you.", Label: "Open the Dashboard" }, props: { sizingH: "fill" } });
  } else {
    if (d.wip) wipCard(b, left, kind, d.wip);
    queueGrid(b, left, kind, d.queues, kind === "desktop" ? 252 : 341);
  }
  if (kind === "desktop") activityCard(b, row, kind, ACT);
  else if (kind === "tablet") activityCard(b, s.main, kind, ACT.slice(0, 5));
  else { const r = hframe(b, s.main, "Recent activity row", 12, { sizeH: "fill", fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, pad: [0, 16, 0, 16] }); b.raw("node.set", { ids: [r], props: { height: 56, sizingV: "fixed" } }); icon(b, r, "clock-counter-clockwise", "Text/text-muted", 20); txt(b, r, "Recent activity", "Body small/SemiBold", "Text/foreground", "Name"); b.frame(r, { name: "Spacer", w: 8, h: 8, sizeH: "fill", sizeV: "fixed" }); icon(b, r, "caret-right"); }
  return s;
}

// ---------- queue ----------
const WROWS = {
  receive: [["6 d", true, "B-2026-0413", "13 Oct", "JO-2026-0136", "CV Sumber Batu Hitam", "0 / 5", "Created", "20 Oct 2026", true, "Nothing arrived yet"], ["1 d", false, "B-2026-0422", "27 Oct", "JO-2026-0137", "PT Kaltara Energi Prima", "6 / 8", "Receiving", "28 Oct 2026", false, "2 labels to print"]],
  coa: [["5 d", true, "CoA-JO-2026-0140-1", "Published 30 Oct", "JO-2026-0140", "CV Sumber Batu Hitam", "3 batches", "", "5 Nov 2026", false, ""], ["2 d", false, "CoA-JO-2026-0141-1", "Published 2 Nov", "JO-2026-0141", "PT Kaltara Energi Prima", "1 batch", "", "6 Nov 2026", false, ""], ["1 d", false, "CoA-JO-2026-0138-1", "Published 3 Nov", "JO-2026-0138", "PT Bara Nusantara Mandiri", "2 batches", "", "7 Nov 2026", false, ""]],
};
function queueFrame(b, x, y, kind, o) {
  page(b, kind);
  const d = ROLES[o.key];
  const s = b.shell({ name: `My work · Queue · ${o.variant} · ${KIND(kind)}`, x, y, kind, active: "My work", role: d.role });
  if (kind === "desktop") setCount(b, b.sidebar, d.queues.reduce((a, q) => a + q[1], 0));
  b.instV(s.main, "Breadcrumb", "Levels=2", { texts: { 0: "My work", 1: o.title } });
  txt(b, s.main, o.title, kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  const tabs = b.frame(s.main, { name: "Tabs", w: 800, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug", clip: kind !== "desktop" });
  d.queues.forEach(([q, n]) => b.instV(tabs, "Tab", `Selected=${QN[q][1] === o.title ? "On" : "Off"}, State=Default`, { texts: { 0: QN[q][1], 1: String(n) } }));
  const f = b.frame(s.main, { name: "Filters", w: 800, h: 60, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug" });
  b.instV(f, "Search", `Size=${kind === "phone" ? "lg" : "md"}, State=Default`, { texts: { Value: "Search batch, job order or company" }, props: kind === "desktop" ? { width: 320 } : { sizingH: "fill" }, hide: ["Scan"] });
  if (kind === "desktop") { b.instV(f, "Select", "State=Default, Size=md", { texts: { Label: "Company", Value: "All companies" }, props: { width: 220 }, setProps: { "Show helper": false } }); const cb = b.frame(f, { name: "Past due only", w: 140, h: 40, layout: "h", cross: "center", sizeH: "hug", sizeV: "fixed" }); b.instV(cb, "Checkbox", "Checked=Off, State=Default", { texts: { Label: "Past due only" } }); }
  const rows = WROWS[o.data];
  if (kind === "phone") { phoneRows(b, s.main, rows, o); }
  else table(b, s.main, kind, rows, o);
  if (o.multi) {
    const bar = b.instV(s.main, "Sticky action bar", `Breakpoint=${kind === "phone" ? "Mobile" : "Desktop"}`, { texts: { Note: "2 selected", 0: "Clear" }, props: { sizingH: "fill" } });
    const v = b.v("Sticky action bar", `Breakpoint=${kind === "phone" ? "Mobile" : "Desktop"}`);
    b.raw("node.set", { ids: [bar + v.texts[1].pos], props: { characters: "Clear" } }); b.raw("node.set", { ids: [bar + v.texts[2].pos], props: { characters: "Download PDFs" } });
  }
  return s;
}
function table(b, main, kind, rows, o) {
  const c = card(b, main, "Table card"); b.raw("node.set", { ids: [c], props: { padding: [16, 16, 16, 16] } });
  const coa = o.data === "coa";
  const cols = kind === "desktop"
    ? (coa ? [["", 44], ["Waiting", 90], ["CoA", 200], ["Job order", 240], ["Batches", 120], ["Deadline", 0], ["", 130]] : [["Waiting", 90], ["Batch", 130], ["Job order", 230], ["Samples", 90], ["Status", 140], ["Deadline", 130], ["Note", 0], ["", 150]])
    : (coa ? [["", 44], ["Waiting", 80], ["CoA", 0], ["", 120]] : [["Waiting", 80], ["Batch", 0], ["Status", 140], ["Deadline", 120], ["", 140]]);
  const t = vframe(b, c, "Table", 0);
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (h) txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); else if (coa && w === 44) b.instV(f, "Checkbox", "Checked=Mixed, State=Default", { hide: ["Label"] }); });
  rows.forEach((d, ri) => {
    const [wait, late, no, date, jo, co, smp, st, dl, pd, note] = d;
    const r = vframe(b, t, "Row", 0);
    const line = b.frame(r, { name: "Cells", w: 800, h: 60, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    const cell = (i) => { const w = cols[i][1]; return b.frame(line, { name: "Cell", w: w || 120, h: 52, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); };
    const two = (f) => vframe(b, f, "Two lines", 0);
    const kinds = kind === "desktop" ? (coa ? ["ck", "wait", "no", "jo", "n", "dl", "act"] : ["wait", "no", "jo", "n", "st", "dl", "note", "act"]) : (coa ? ["ck", "wait", "no", "act"] : ["wait", "no", "st", "dl", "act"]);
    kinds.forEach((k, i) => {
      const f = cell(i);
      if (k === "ck") b.instV(f, "Checkbox", `Checked=${ri < 2 ? "On" : "Off"}, State=Default`, { hide: ["Label"] });
      if (k === "wait") { const w = hframe(b, f, "Waiting", 4); if (late) icon(b, w, "warning", "Feedback/error"); txt(b, w, wait, "Body small/Medium", late ? "Feedback/error" : "Text/foreground", "Waiting"); }
      if (k === "no") { const t2 = two(f); txt(b, t2, no, "Data/Strong", "Text/heading", "Number"); txt(b, t2, kind === "desktop" ? date : jo + "  " + co, "Caption/Regular", "Text/text-muted", "Date"); }
      if (k === "jo") { const t2 = two(f); txt(b, t2, jo, "Data", "Primary/primary", "Job order"); txt(b, t2, co, "Caption/Regular", "Text/text-secondary", "Company"); }
      if (k === "n") txt(b, f, smp, "Body small/Regular", "Text/foreground", "Samples");
      if (k === "st") b.instV(f, "Status badge", `Status=${st}, Size=md`);
      if (k === "dl") { txt(b, f, dl, "Body small/Regular", pd ? "Feedback/error" : "Text/foreground", "Deadline"); if (pd) txt(b, f, "Past due", "Body small/SemiBold", "Feedback/error", "Past due"); }
      if (k === "note") txt(b, f, note, "Body small/Regular", "Text/text-secondary", "Note");
      if (k === "act") btn(b, f, "Secondary", o.action, null);
    });
    b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
}
function phoneRows(b, main, rows, o) {
  const list = vframe(b, main, "Cards", 10); const coa = o.data === "coa";
  rows.forEach((d, ri) => {
    const [wait, late, no, date, jo, co, smp, st, dl, pd, note] = d;
    const c = vframe(b, list, "Item card", 8, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: 16 });
    const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" });
    const l = hframe(b, top, "Ids", 8); if (coa) b.instV(l, "Checkbox", `Checked=${ri < 2 ? "On" : "Off"}, State=Default`, { hide: ["Label"] }); const ids = vframe(b, l, "Ids", 0, { sizeH: "hug" }); txt(b, ids, no, "Data/Strong", "Text/heading", "Number"); txt(b, ids, date, "Caption/Regular", "Text/text-muted", "Date");
    if (st) b.instV(top, "Status badge", `Status=${st}, Size=md`);
    const j = hframe(b, c, "Job order", 8, { sizeH: "fill" }); txt(b, j, jo, "Data", "Primary/primary", "Job order"); txt(b, j, co, "Caption/Regular", "Text/text-secondary", "Company");
    const m = hframe(b, c, "Meta", 12, { sizeH: "fill", wrap: true }); const w = hframe(b, m, "Waiting", 4); icon(b, w, late ? "warning" : "clock", late ? "Feedback/error" : "Text/text-muted"); txt(b, w, "Waiting " + wait, "Body small/Regular", late ? "Feedback/error" : "Text/text-secondary", "Waiting");
    const dd = hframe(b, m, "Deadline", 4); icon(b, dd, "calendar-blank", pd ? "Feedback/error" : "Text/text-muted"); txt(b, dd, dl, "Body small/Regular", pd ? "Feedback/error" : "Text/text-secondary", "Deadline"); if (pd) txt(b, dd, "Past due", "Body small/SemiBold", "Feedback/error", "Past due");
    if (note) txt(b, c, note, "Caption/Regular", "Text/text-secondary", "Note");
    btn(b, c, "Secondary", o.action, null, { size: "touch", fill: true });
  });
}

exports.build = (b) => {
  clearH(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "H  My work"); });
  const DX = 1560, TX = 954, PX = 510, d = Y.desktop, t = Y.tablet, p = Y.phone;
  overviewFrame(b, 0, d, "desktop", "Lab", "Lab_admin"); overviewFrame(b, DX, d, "desktop", "Prep", "Preparation"); overviewFrame(b, DX * 2, d, "desktop", "Analyst", "Analyst"); overviewFrame(b, DX * 3, d, "desktop", "CSO", "CSO");
  overviewFrame(b, DX * 4, d, "desktop", "Lab", "All_caught_up", { empty: true });
  queueFrame(b, 0, d + 1700, "desktop", { key: "Lab", variant: "Batches_to_receive", title: "Batches to receive", data: "receive", action: "Open reception" });
  queueFrame(b, DX, d + 1700, "desktop", { key: "CSO", variant: "CoAs_to_send_multi_select", title: "CoAs to send", data: "coa", action: "Mark sent", multi: true });
  overviewFrame(b, 0, t, "tablet", "Lab", "Lab_admin");
  queueFrame(b, TX, t, "tablet", { key: "Lab", variant: "Batches_to_receive", title: "Batches to receive", data: "receive", action: "Open reception" });
  queueFrame(b, TX * 2, t, "tablet", { key: "CSO", variant: "CoAs_to_send_multi_select", title: "CoAs to send", data: "coa", action: "Mark sent", multi: true });
  overviewFrame(b, 0, p, "phone", "Lab", "Lab_admin"); overviewFrame(b, PX, p, "phone", "Lab", "All_caught_up", { empty: true });
  queueFrame(b, PX * 2, p, "phone", { key: "Lab", variant: "Batches_to_receive", title: "Batches to receive", data: "receive", action: "Open reception" });
  queueFrame(b, PX * 3, p, "phone", { key: "CSO", variant: "CoAs_to_send_multi_select", title: "CoAs to send", data: "coa", action: "Mark sent", multi: true });
};
