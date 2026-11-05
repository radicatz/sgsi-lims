// Row M · Search (module 08). Plan: .context/docs/Search/Search_Screen_Plan.md
// Run after row L: build-screens.js C,D,E,G,F,H,I,J,K,L,M. Frames are created under their final names.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver } = H;
const { U } = require("./rowL.js");
const { icon, txt, hframe, vframe, btn, iconBtn, cardTop, pill, avatar, badge, CLIENT, dialog, overlay, KIND, W, CW } = U;

const M_NAMES = /^(Desktop|Tablet|Phone)-08-Search-/;
const isM = (n) => M_NAMES.test(n.name || "") || (n.name === "Row title" && /^M( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isM(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.lEnd ? b.lEnd[k] : 0); }
  return out;
}
const clearM = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isM(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const sel = (b, p, value, w, o = {}) => b.instV(p, "Select", "State=Filled, Size=md", { texts: { Value: value, Label: o.label || "" }, hide: o.label ? [] : ["Label"], setProps: { "Show helper": false }, props: w ? { width: w, sizingH: "fixed" } : { sizingH: "fill" } });
const field = (b, p, value, w, o = {}) => b.instV(p, "Text field", `State=${value ? "Filled" : "Default"}, Size=md`, { texts: { Value: value || o.ph || "", Label: o.label || "" }, hide: o.label ? [] : ["Label"], setProps: { "Show helper": false }, props: w ? { width: w, sizingH: "fixed" } : { sizingH: "fill" } });
const segmented = (b, parent, labels, on) => { const bar = hframe(b, parent, "Match", 2, { fill: "Surface/muted", r: 10, pad: [4, 4, 4, 4] }); labels.forEach((l, i) => b.instV(bar, "Segmented item", `Selected=${i === on ? "On" : "Off"}, State=Default`, { texts: { Label: l } })); return bar; };
const searchField = (b, p, value, kind, o = {}) => b.instV(p, "Search", `Size=${kind === "phone" ? "lg" : "md"}, State=${value ? "Filled" : "Default"}`, { texts: { Value: value || o.ph || "Search by batch, lab code, or drill hole…" }, props: o.w ? { width: o.w, sizingH: "fixed" } : { sizingH: "fill" }, hide: o.scan ? [] : ["Scan"] });
function header(b, main, kind, title, o = {}) {
  const r = hframe(b, main, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "max" });
  const t = vframe(b, r, "Title block", 4, { sizeH: kind === "desktop" ? "hug" : "fill" });
  txt(b, t, "SEARCH", "Overline", "Text/text-muted", "Overline"); txt(b, t, title, kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (o.adv && kind !== "phone") btn(b, r, "Secondary", "Advanced search", "funnel");
  return r;
}
const frame = (b, x, y, kind, screen, vv, variant, role, o = {}) => { page(b, kind); return b.shell({ name: `${KIND(kind)}-08-Search-${screen}-${vv}-${variant}`, x, y, kind, active: o.active || "Search", role, search: o.search }); };

// ---------- demo data (plan section 9) ----------
const SAMPLE = (n) => ({ id: "BNM-35" + String(n).padStart(2, "0"), lab: "B0410-" + String(n).padStart(2, "0"), jo: "JO-2026-0131", client: "BNM", status: "In batch" });
const QSAMPLES = Array.from({ length: 12 }, (_, i) => SAMPLE(i + 1));
const dateRel = ["22 Oct 2026"];

// ---------- quick search (plan 4) ----------
const stBadge = (b, p, st, size = "sm") => (st === "In batch" ? b.instV(p, "Status badge", `Status=Received, Size=${size}`, { texts: { Label: "In batch" } }) : b.instV(p, "Status badge", `Status=${st}, Size=${size}`));
const QHIT = (b, p, main, subs, st) => { const r = hframe(b, p, "Hit", 12, { sizeH: "fill", pad: [8, 12, 8, 12], r: 8 }); txt(b, r, main, "Data/Strong", "Text/heading", "ID"); subs.forEach((s) => txt(b, r, s, "Body small/Regular", "Text/text-secondary", "Detail")); if (st) { b.frame(r, { name: "Spacer", w: 8, h: 8, sizeH: "fill", sizeV: "fixed" }); stBadge(b, r, st, "sm"); } return r; };
const QLABEL = (b, p, l) => txt(b, p, l, "Overline", "Text/text-muted", "Section");
function quickPanel(b, root, x, y, w, o) {
  const p = b.frame(root, { name: "Quick search panel", w, h: 300, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 4, pad: [12, 8, 8, 8], sizeH: "fixed", sizeV: "hug", absolute: true, x, y });
  b.raw("style.apply", { ids: [p], style: "Elevation/md" });
  const lab = (l) => { const f = hframe(b, p, "Label", 0, { sizeH: "fill", pad: [4, 12, 2, 12] }); QLABEL(b, f, l); };
  if (o.mode === "recent") {
    lab("RECENT RECORDS"); QHIT(b, p, "JO-2026-0131", ["PT Bara Nusantara Mandiri"], "Reported"); QHIT(b, p, "B-2026-0417", ["JO-2026-0138"], "Preparation"); QHIT(b, p, "BNM-3507", ["B0410-07"], "In batch");
    lab("RECENT SEARCHES");
    ["BNM", "DH-BNM-021", "CoA-JO-2026-0142"].forEach((s) => { const r = hframe(b, p, "Search", 10, { sizeH: "fill", pad: [8, 12, 8, 12] }); icon(b, r, "clock-counter-clockwise", "Text/text-muted"); txt(b, r, s, "Body small/Regular", "Text/foreground", "Query"); });
  } else if (o.mode === "typing") {
    lab("SAMPLES"); QHIT(b, p, "B0417-01", ["BNM-3601", "PT Bara Nusantara Mandiri"], "In batch"); QHIT(b, p, "B0417-02", ["BNM-3602", "PT Bara Nusantara Mandiri"], "In batch"); QHIT(b, p, "B0417-03", ["BNM-3603", "PT Bara Nusantara Mandiri"], "In batch");
    lab("BATCHES"); QHIT(b, p, "B-2026-0417", ["JO-2026-0138"], "Preparation");
    lab("JOB ORDERS"); QHIT(b, p, "JO-2026-0138", ["PT Bara Nusantara Mandiri"], "In progress");
  } else if (o.mode === "exact") {
    lab("GO TO"); const g = QHIT(b, p, "JO-2026-0137", ["PT Kaltara Energi Prima", "Go to"], "Registered"); b.raw("node.set", { ids: [g], props: { fill: LIGHT["Primary/primary-50"] } }); b.bind(g, "fill", "Primary/primary-50");
    lab("BATCHES"); QHIT(b, p, "B-2026-0422", ["JO-2026-0137"], "Receiving");
  } else { const e = vframe(b, p, "No match", 4, { pad: [20, 12, 12, 12] }); txt(b, e, "No match for \"XK-77\"", "Body/SemiBold", "Text/heading", "Title"); txt(b, e, "Check the ID, or search by another field.", "Body small/Regular", "Text/text-secondary", "Text"); }
  const ft = hframe(b, p, "Footer", 8, { sizeH: "fill", main: "spaceBetween", pad: [10, 12, 4, 12] });
  if (o.mode === "none") { btn(b, ft, "Tertiary", "Open advanced search", "funnel", { size: "md" }); }
  else if (o.mode !== "recent") { txt(b, ft, o.footer || "See all 14 results for \"b0417\"", "Body small/SemiBold", "Primary/primary", "See all"); txt(b, ft, "Enter", "Caption/Medium", "Text/text-muted", "Key"); }
  return p;
}
function dashBase(b, s, kind) {
  const m = s.main;
  const hd = hframe(b, m, "Header", 16, { sizeH: "fill" }); const t = vframe(b, hd, "Title block", 4, { sizeH: "hug" }); txt(b, t, "THURSDAY 5 NOVEMBER 2026", "Overline", "Text/text-muted", "Overline"); txt(b, t, "Dashboard", "Display/XL", "Text/heading", "Title");
  const row = b.frame(m, { name: "KPI strip", w: 400, h: 120, layout: "h", gap: 16, wrap: kind !== "desktop", sizeH: "fill", sizeV: "hug" });
  [["Batches in progress", "23", "4 completed"], ["Due this week", "9", "2 past due"], ["Samples received", "1,284", "Last 30 days"], ["Mean turnaround", "4.6 d", "Target 5 d"]].forEach(([l, n, c]) => b.instV(row, "Card KPI", "Kind=Delta", { texts: { 0: l, 1: n, Caption: c }, hide: ["Delta"], props: kind === "tablet" ? { width: 341, sizingH: "fixed" } : { sizingH: "fill" } }));
  const c = card(b, m, "Active batches card"); cardTop(b, c, "Active batches");
  ["B-2026-0417", "B-2026-0415", "B-2026-0418"].forEach((n) => { const r = hframe(b, c, "Row", 12, { sizeH: "fill", pad: [8, 0, 8, 0] }); txt(b, r, n, "Data/Strong", "Text/heading", "Number"); txt(b, r, "PT Bara Nusantara Mandiri", "Body small/Regular", "Text/text-secondary", "Company"); });
}
function quick(b, x, y, kind, vv, variant, role, mode, o = {}) {
  const s = frame(b, x, y, kind, "01-Quick_search", vv, variant, role, { search: o.search, active: "Dashboard" });
  dashBase(b, s, kind);
  const pw = kind === "desktop" ? 560 : 500;
  quickPanel(b, s.root, kind === "desktop" ? 812 : 280, 56, pw, { mode, footer: o.footer });
  return s;
}

// ---------- search results (plan 5) ----------
const TYPES = [["All", 28], ["Samples", 12], ["Batches", 3], ["Job orders", 2], ["Drill holes", 4], ["Reports", 6], ["Clients", 1]];
function sectionCard(b, p, type, count, rows, kind, o = {}) {
  const c = card(b, p, type + " card"); b.raw("node.set", { ids: [c], props: { sizingH: "fill" } });
  const hd = cardTop(b, c, type); const cn = hframe(b, hd, "Count", 8); txt(b, cn, String(count), "Body small/SemiBold", "Text/text-muted", "Count"); if (!o.all) btn(b, cn, "Ghost", "Show all " + count, null, { size: "md" });
  rows.forEach((r) => { const rr = vframe(b, c, "Row", 0); const line = hframe(b, rr, "Cells", 12, { sizeH: "fill", pad: [10, 0, 10, 0], wrap: kind === "phone" }); r(line); b.frame(rr, { name: "Divider", w: 400, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" }); });
  if (o.pager) b.instV(c, "Pager", kind === "phone" ? "Breakpoint=Mobile" : "Breakpoint=Desktop", kind === "phone" ? { texts: { Page: "1 / 2" }, props: { sizingH: "fill" } } : { texts: { Summary: "Showing 1–10 of 12" }, props: { sizingH: "fill" } });
  return c;
}
const spacer = (b, p) => b.frame(p, { name: "Spacer", w: 8, h: 8, sizeH: "fill", sizeV: "fixed" });
let b0;
const rowFns = {
  Samples: (kind) => (i) => (line) => { const sm = QSAMPLES[i]; txt(b0, line, sm.id, "Data/Strong", "Text/heading", "Sample ID"); txt(b0, line, sm.lab, "Data", "Text/text-secondary", "Lab code"); if (kind !== "phone") { txt(b0, line, sm.jo, "Data", "Primary/primary", "Job order"); avatar(b0, line, "BNM"); txt(b0, line, CLIENT.BNM[0], "Body small/Regular", "Text/foreground", "Client"); } spacer(b0, line); b0.instV(line, "Status badge", "Status=Received, Size=sm", { texts: { Label: "In batch" } }); },
  Batches: (kind) => (i) => (line) => { const d = [["B-2026-0411", "JO-2026-0131", "Completed"], ["B-2026-0410", "JO-2026-0131", "Completed"], ["B-2026-0409", "JO-2026-0130", "Completed"]][i]; txt(b0, line, d[0], "Data/Strong", "Text/heading", "Batch"); txt(b0, line, d[1], "Data", "Primary/primary", "Job order"); if (kind !== "phone") { avatar(b0, line, "BNM"); txt(b0, line, CLIENT.BNM[0], "Body small/Regular", "Text/foreground", "Client"); } spacer(b0, line); b0.instV(line, "Status badge", `Status=${d[2]}, Size=sm`); },
  "Job orders": (kind) => (i) => (line) => { const d = [["JO-2026-0131", "BNM-318", "Reported"], ["JO-2026-0138", "BNM-402", "In progress"]][i]; txt(b0, line, d[0], "Data/Strong", "Text/heading", "Job order"); txt(b0, line, "PO " + d[1], "Data", "Text/text-secondary", "PO"); if (kind !== "phone") { avatar(b0, line, "BNM"); txt(b0, line, CLIENT.BNM[0], "Body small/Regular", "Text/foreground", "Client"); } spacer(b0, line); b0.instV(line, "Status badge", `Status=${d[2]}, Size=sm`); },
  "Drill holes": (kind) => (i) => (line) => { const c = ["DH-BNM-021", "DH-BNM-022", "DH-BNM-023", "DH-BNM-031"][i]; txt(b0, line, c, "Data/Strong", "Text/heading", "Code"); txt(b0, line, "Batch " + (i + 5), "Body small/Regular", "Text/text-secondary", "Description"); spacer(b0, line); b0.instV(line, "Tag", i === 2 ? "Type=CoA missing" : "Type=CoA uploaded"); },
  Reports: (kind) => (i) => (line) => { const d = [["CoA-JO-2026-0131-2", "CoA", "Published"], ["CoA-JO-2026-0131-1", "CoA", "Superseded"], ["RoA-0411", "RoA", ""], ["RoA-0410", "RoA", ""], ["CoA-JO-2026-0130-1", "CoA", "Sent"], ["RoA-0409", "RoA", ""]][i]; txt(b0, line, d[0], "Data/Strong", "Text/heading", "Number"); txt(b0, line, d[1], "Body small/Regular", "Text/text-secondary", "Kind"); spacer(b0, line); if (d[2]) badge(b0, line, d[2], "sm"); else pill(b0, line, "Signed copy", "Primary/primary-100", "Primary/primary", false); },
  Clients: (kind) => (i) => (line) => { avatar(b0, line, "BNM"); txt(b0, line, CLIENT.BNM[0], "Body small/SemiBold", "Text/heading", "Name"); txt(b0, line, "BNM", "Body small/Regular", "Text/text-secondary", "Code"); spacer(b0, line); pill(b0, line, "Active", "Feedback/success-100", "Feedback/success", true); },
};
function typesList(b, p, kind, on, counts) {
  const c = card(b, p, "Types card"); cardTop(b, c, "Types");
  counts.forEach(([l, n]) => { const r = hframe(b, c, "Type", 8, { sizeH: "fill", main: "spaceBetween", pad: [8, 12, 8, 12], r: 8, fill: l === on ? "Primary/primary-50" : undefined }); txt(b, r, l, l === on ? "Body small/SemiBold" : "Body small/Regular", n ? (l === on ? "Text/heading" : "Text/foreground") : "Text/text-muted", "Label"); txt(b, r, String(n), "Body small/Medium", "Text/text-muted", "Count"); });
  return c;
}
function results(b, x, y, kind, vv, variant, role, o) {
  b0 = b;
  const s = frame(b, x, y, kind, "02-Search_results", vv, variant, role, { search: o.q });
  const m = s.main;
  header(b, m, kind, o.empty ? "Results for \"XK-77\"" : `Results for "${o.q || "BNM"}"`, { adv: true });
  searchField(b, m, o.empty ? "XK-77" : o.q || "BNM", kind, { scan: kind === "phone" });
  if (kind === "phone" && o.start) { return startPhone(b, s); }
  if (o.empty) { b.instV(m, "Empty state", "Size=Page", { texts: { Title: "Nothing matches \"XK-77\"", Text: "Check the ID, or search by another field.", Label: "Open advanced search" }, swaps: [[0, "Icon", "Glyph=magnifying-glass, Size=20"]], props: { sizingH: "fill" } }); return s; }
  const counts = o.cso ? TYPES.map(([l, n]) => (l === "Reports" ? [l, 3] : [l, n])) : TYPES;
  const on = o.type || "All";
  const list = (host) => {
    const types = on === "All" ? ["Samples", "Batches", "Job orders", "Drill holes", "Reports", "Clients"] : [on];
    types.forEach((t) => { const total = counts.find(([l]) => l === t)[1]; const n = on === "All" ? Math.min(5, total) : Math.min(10, total); const rowsF = Array.from({ length: n }, (_, i) => rowFns[t](kind)(i)); sectionCard(b, host, t, total, rowsF, kind, { all: on !== "All", pager: on !== "All" && total > 10 }); });
  };
  if (kind === "desktop") { const cols = b.frame(m, { name: "Columns", w: 1128, h: 800, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); const tl = typesList(b, cols, kind, on, counts); b.raw("node.set", { ids: [tl], props: { width: 240, sizingH: "fixed" } }); const right = vframe(b, cols, "Results", 16); list(right); }
  else { const ch = hframe(b, m, "Types", 8, { sizeH: "fill", wrap: kind === "tablet", clip: kind === "phone" }); counts.forEach(([l, n]) => b.instV(ch, "Filter chip", `Selected=${l === on ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: String(n) } })); list(m); }
  return s;
}
function startPhone(b, s) {
  const m = s.main; const c = card(b, m, "Recent card"); cardTop(b, c, "Recent");
  [["JO-2026-0131", "Reported"], ["B-2026-0417", "Preparation"], ["BNM-3507", "In batch"]].forEach(([n, st]) => { const r = hframe(b, c, "Recent record", 12, { sizeH: "fill", pad: [10, 0, 10, 0] }); txt(b, r, n, "Data/Strong", "Text/heading", "ID"); spacer(b, r); b.instV(r, "Status badge", `Status=${st === "Reported" ? "Reported" : st === "Preparation" ? "Preparation" : "Received"}, Size=sm`, st === "In batch" ? { texts: { Label: "In batch" } } : undefined); });
  const c2 = card(b, m, "Searches card"); cardTop(b, c2, "Recent searches");
  ["BNM", "DH-BNM-021", "CoA-JO-2026-0142"].forEach((q) => { const r = hframe(b, c2, "Search", 10, { sizeH: "fill", pad: [10, 0, 10, 0] }); icon(b, r, "clock-counter-clockwise", "Text/text-muted"); txt(b, r, q, "Body small/Regular", "Text/foreground", "Query"); });
  btn(b, m, "Secondary", "Scan a label", "barcode", { size: "touch", fill: true });
  return s;
}

// ---------- advanced search (plan 6) ----------
const COLS = {
  Samples: [["Sample ID", 110], ["Lab code", 110], ["Drill hole", 0], ["Depth (m)", 110], ["Ash ADB", 90], ["TS ADB", 90], ["Status", 110]],
  Results: [["Sample ID", 110], ["Parameter", 0], ["Value", 90], ["Basis", 80], ["Entered by", 140], ["Entered", 110], ["Status", 110]],
};
const SROWS = [["BNM-3503", "B0410-03", "DH-BNM-021", "38.0–38.6", "10.42", "0.51", "In batch"], ["BNM-3506", "B0410-06", "DH-BNM-021", "40.1–41.0", "11.08", "0.48", "In batch"], ["BNM-3507", "B0410-07", "DH-BNM-021", "41.2–42.0", "10.77", "0.44", "In batch"], ["BNM-3509", "B0410-09", "DH-BNM-021", "43.0–43.8", "12.15", "0.62", "In batch"], ["BNM-3511", "B0411-02", "DH-BNM-021", "45.2–46.0", "10.31", "0.40", "In batch"], ["BNM-3512", "B0411-03", "DH-BNM-021", "46.0–46.9", "13.04", "0.57", "In batch"], ["BNM-3514", "B0411-05", "DH-BNM-021", "48.1–48.9", "10.96", "0.53", "In batch"], ["BNM-3517", "B0411-08", "DH-BNM-021", "50.0–50.7", "11.52", "0.49", "In batch"]];
const RROWS = SROWS.map((r, i) => [r[0], "Ash", r[4], "ADB", ["Fitri Handayani", "Fitri Handayani", "Fitri Handayani", "Fitri Handayani", "Fitri Handayani", "Fitri Handayani", "Fitri Handayani", "Fitri Handayani"][i], "25 Oct 2026", "In batch"]);
function savedQueries(b, p, kind) {
  const c = card(b, p, "Saved queries card"); cardTop(b, c, "Saved queries");
  const grp = (t, items) => { const g = vframe(b, c, "Group", 2); txt(b, g, t, "Overline", "Text/text-muted", "Group"); items.forEach((q, i) => { const r = hframe(b, g, "Query", 8, { sizeH: "fill", main: "spaceBetween", pad: [8, 10, 8, 10], r: 8, fill: q[1] ? "Primary/primary-50" : undefined }); txt(b, r, q[0], q[1] ? "Body small/SemiBold" : "Body small/Regular", "Text/foreground", "Name"); iconBtn(b, r, "dots-three"); }); };
  grp("MY QUERIES", [["High-ash BNM samples", true], ["Held this month", false]]); grp("SHARED WITH ME", [["Late batches", false]]);
  return c;
}
function condRow(b, p, kind, n, field, op, val, o = {}) {
  const r = hframe(b, p, "Condition", 8, { sizeH: "fill", wrap: kind !== "desktop" }); txt(b, r, String(n), "Body small/SemiBold", "Text/text-muted", "Number");
  sel(b, r, field, kind === "desktop" ? 210 : kind === "tablet" ? 200 : undefined); sel(b, r, op, kind === "desktop" ? 170 : kind === "tablet" ? 170 : undefined);
  if (o.between) { field_(b, r, val[0], 120, kind); txt(b, r, "to", "Body small/Regular", "Text/text-muted", "To"); field_(b, r, val[1], 120, kind); } else if (o.select) sel(b, r, val, kind === "desktop" ? 220 : undefined); else field_(b, r, val, kind === "desktop" ? 220 : undefined, kind);
  if (o.basis) sel(b, r, o.basis, 90);
  iconBtn(b, r, "x");
}
const field_ = (b, p, v, w, kind) => field(b, p, v, w);
function queryCard(b, p, kind, o) {
  const c = card(b, p, "Query card"); cardTop(b, c, "Query");
  const top = hframe(b, c, "Searching for", 16, { sizeH: "fill", wrap: true, cross: "max" }); const t1 = vframe(b, top, "Target", 4, { sizeH: "hug" }); txt(b, t1, "Searching for", "Caption/Medium", "Text/text-secondary", "Label"); sel(b, t1, o.target, 220); const t2 = vframe(b, top, "Match", 4, { sizeH: "hug" }); txt(b, t2, "Match conditions", "Caption/Medium", "Text/text-secondary", "Label"); segmented(b, t2, ["All", "Any"], 0);
  if (o.empty) condRow(b, c, kind, 1, "Choose a field", "is", "", { }); else if (o.target === "Results") { condRow(b, c, kind, 1, "Result: parameter", "is", "Ash", {}); condRow(b, c, kind, 2, "Result: value", "greater than", "10", { basis: "ADB" }); condRow(b, c, kind, 3, "Entered date", "between", ["1 Oct 2026", "31 Oct 2026"], { between: true }); }
  else { condRow(b, c, kind, 1, "Drill hole", "is", "DH-BNM-021", {}); condRow(b, c, kind, 2, "Result: Ash", "greater than", "10", { basis: "ADB" }); condRow(b, c, kind, 3, "Received date", "between", ["1 Oct 2026", "31 Oct 2026"], { between: true }); }
  const act = hframe(b, c, "Actions", 8, { sizeH: "fill", main: "spaceBetween", wrap: true }); btn(b, act, "Tertiary", "Add condition", "plus", { size: "md" }); const ar = hframe(b, act, "Right", 8); btn(b, ar, "Ghost", "Clear all", null, { size: "md" }); btn(b, ar, "Secondary", "Save query", "floppy-disk", { size: "md" }); btn(b, ar, "Primary", "Search", "magnifying-glass", { size: "md" });
  return c;
}
function resultsCard(b, p, kind, o) {
  const c = card(b, p, "Results card"); const hd = cardTop(b, c, o.target === "Results" ? "24 results" : "24 samples");
  const ac = hframe(b, hd, "Actions", 8); const cb = btn(b, ac, "Secondary", "Columns", "list", { size: "md" }); btn(b, ac, "Secondary", "Export", "download-simple", { size: "md" });
  if (o.over) b.instV(c, "Inline alert", "Tone=Info", { texts: { 0: "Showing the first 500 of 2,318", 1: "Narrow the conditions, or export to get every row." }, hide: ["Action"], props: { sizingH: "fill" } });
  const cols = COLS[o.target]; const rows = o.target === "Results" ? RROWS : SROWS;
  if (kind === "phone") { rows.slice(0, 4).forEach((r) => { const it = vframe(b, c, "Item card", 6, { fill: "Surface/muted", r: 12, pad: [12, 12, 12, 12] }); const top = hframe(b, it, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, top, r[0], "Data/Strong", "Text/heading", "Sample ID"); b.instV(top, "Status badge", "Status=Received, Size=sm", { texts: { Label: "In batch" } }); txt(b, it, o.target === "Results" ? `${r[1]} ${r[2]} ${r[3]}` : r[2], "Body small/Regular", "Text/text-secondary", "Detail"); txt(b, it, o.target === "Results" ? r[4] : "Ash ADB " + r[4] + "   TS ADB " + r[5], "Caption/Regular", "Text/text-secondary", "Values"); }); b.instV(c, "Pager", "Breakpoint=Mobile", { texts: { Page: "1 / 6" }, props: { sizingH: "fill" } }); return { c, cb }; }
  const showCols = kind === "desktop" ? cols : cols.filter((_, i) => [0, 1, 2, 6].includes(i)).map(([h, w]) => [h, h === "Status" ? 110 : w === 0 ? 0 : 110]);
  const t = vframe(b, c, "Table", 0); const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  showCols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", gap: 4, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); icon(b, f, "arrows-down-up", "Text/text-muted", 14); });
  rows.forEach((r) => { const rr = vframe(b, t, "Row", 0); const line = b.frame(rr, { name: "Cells", w: 800, h: 48, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" }); showCols.forEach(([h, w]) => { const f = b.frame(line, { name: "Cell", w: w || 120, h: 48, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); const idx = cols.findIndex(([hh]) => hh === h); const v = r[idx]; if (h === "Sample ID") txt(b, f, v, "Data/Strong", "Text/heading", "Sample ID"); else if (h === "Status") b.instV(f, "Status badge", "Status=Received, Size=sm", { texts: { Label: "In batch" } }); else if (h === "Lab code" || h === "Drill hole") txt(b, f, v, "Data", "Text/text-secondary", h); else txt(b, f, v, "Body small/Regular", "Text/foreground", h); }); b.frame(rr, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" }); });
  b.instV(c, "Pager", "Breakpoint=Desktop", { texts: { Summary: "Showing 1–8 of 24" }, props: { sizingH: "fill" } });
  return { c, cb };
}
function advanced(b, x, y, kind, vv, variant, role, o = {}) {
  b0 = b;
  const s = frame(b, x, y, kind, "03-Advanced_search", vv, variant, role);
  const m = s.main; header(b, m, kind, "Advanced search");
  const target = o.target || "Samples";
  if (kind === "desktop") { const cols = b.frame(m, { name: "Columns", w: 1128, h: 800, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); const sq = savedQueries(b, cols, kind); b.raw("node.set", { ids: [sq], props: { width: 260, sizingH: "fixed" } }); const right = vframe(b, cols, "Right column", 16); queryCard(b, right, kind, { target, empty: o.empty }); if (o.empty) { b.instV(right, "Empty state", "Size=Card", { texts: { 0: "Build a query, then press Search", 1: "Pick what you are searching for, add conditions, and the results appear here." }, swaps: [[0, "Icon", "Glyph=magnifying-glass, Size=20"]], props: { sizingH: "fill" }, hide: ["Button"] }); return s; } const r = resultsCard(b, right, kind, { target, over: o.over }); s.cb = r.cb; s.rc = r.c; s.right = right; }
  else { sel(b, m, "High-ash BNM samples", undefined, { label: "Saved queries" }); queryCard(b, m, kind, { target }); const r = resultsCard(b, m, kind, { target }); }
  return s;
}
function columnsMenu(b, s) {
  const p = b.frame(s.root, { name: "Columns menu", w: 260, h: 300, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, layout: "v", gap: 2, pad: [8, 12, 8, 12], sizeH: "fixed", sizeV: "hug", absolute: true, x: 1030, y: 612 });
  b.raw("style.apply", { ids: [p], style: "Elevation/md" });
  txt(b, p, "Columns", "Body small/SemiBold", "Text/heading", "Title");
  [["Sample ID", 1], ["Lab code", 1], ["Drill hole", 1], ["Depth (m)", 1], ["Ash ADB", 1], ["TS ADB", 1], ["Status", 1], ["Client", 0], ["Received date", 0], ["Condition", 0]].forEach(([l, on]) => b.instV(p, "Checkbox", `Checked=${on ? "On" : "Off"}, State=Default`, { texts: { Label: l } }));
}

// ---------- sample history (plan 7) ----------
function histEntry(b, p, o) {
  const r = hframe(b, p, "Entry", 12, { sizeH: "fill", cross: "min" });
  const dot = b.frame(r, { name: "Dot", w: 12, h: 12, fill: o.pending ? "Surface/border-strong" : o.tone || "Status/st-completed", r: 6, sizeH: "fixed", sizeV: "fixed" });
  const t = vframe(b, r, "Text", 4, { sizeH: "fill" });
  txt(b, t, o.text, "Body small/SemiBold", o.pending ? "Text/text-muted" : "Text/heading", "Event");
  if (o.person) { const w = hframe(b, t, "Who", 8, { wrap: true }); b.instV(w, "Avatar", "Size=24", { texts: { Initials: o.person[1] } }); txt(b, w, o.person[0], "Body small/Regular", "Text/foreground", "Person"); txt(b, w, o.when, "Body small/Regular", "Text/text-secondary", "When"); }
  (o.sub || []).forEach((l) => txt(b, t, l, "Caption/Regular", "Text/text-secondary", "Detail", { fill: true }));
  if (o.link) btn(b, t, "Ghost", o.link, null, { size: "sm" });
  return r;
}
const P = { rina: ["Rina Kartika", "RK"], dedi: ["Dedi Kurniawan", "DK"], maya: ["Maya Lestari", "ML"], fitri: ["Fitri Handayani", "FH"] };
function history(b, x, y, kind, vv, variant, role, o = {}) {
  const s = frame(b, x, y, kind, "04-Sample_history", vv, variant, role);
  const m = s.main; const id = o.id || "BNM-3507";
  b.instV(m, "Breadcrumb", "Levels=3", { texts: { 0: "Job orders", 1: o.jo || "JO-2026-0131", 2: id } });
  const hd = hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center", wrap: kind === "tablet" });
  const idt = vframe(b, hd, "Identity", 6, { sizeH: kind === "phone" ? "fill" : "hug" });
  const ti = hframe(b, idt, "Title", 12, kind === "phone" ? { sizeH: "fill", wrap: true } : {}); txt(b, ti, id, kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title"); b.instV(ti, "Status badge", `Status=${o.status === "Held" ? "Held" : "Received"}, Size=md`, o.status === "Held" ? undefined : { texts: { Label: o.badge || "In batch" } });
  const f = hframe(b, idt, "Facts", 12, { wrap: true, sizeH: kind === "phone" ? "fill" : "hug" }); txt(b, f, o.lab || "B0410-07", "Data", "Text/text-secondary", "Lab code"); txt(b, f, o.jo || "JO-2026-0131", "Data", "Primary/primary", "Job order"); txt(b, f, o.batch || "B-2026-0410", "Data", "Primary/primary", "Batch"); txt(b, f, "PT Bara Nusantara Mandiri", "Body small/Regular", "Text/text-secondary", "Client");
  if (kind !== "phone") btn(b, hd, "Secondary", "Export PDF", "file-pdf");
  const sampleCard = (p) => { const c = card(b, p, "Sample card"); cardTop(b, c, "Sample"); const v = b.v("Key-value row", "Layout=Inline"); [["Drill hole", "DH-BNM-021"], ["Seam", "EN2"], ["Lithology", "Coal"], ["Depth", "41.2 to 42.0 m"], ["Mass", "2.41 kg"], ["Condition", "Good"], ["Status", o.status === "Held" ? "Held" : o.badge || "In batch"]].concat(o.status === "Held" ? [["Held reason", "Wet, label unreadable"]] : []).forEach(([k, val]) => { const i = b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: k, Value: val }, props: { sizingH: "fill" } }); b.raw("node.set", { ids: [i + v.names.Value], props: { sizingH: "fill", textAutoResize: "height" } }); }); return c; };
  const histCard = (p) => {
    const c = card(b, p, "History card"); b.raw("node.set", { ids: [c], props: { sizingH: "fill" } }); cardTop(b, c, "History");
    const E = (e) => histEntry(b, c, e);
    E({ text: "Registered on " + (o.jo || "JO-2026-0131"), person: P.rina, when: "20 Oct 2026" });
    if (o.held) { E({ text: "Received and labelled B0410-07", person: P.dedi, when: "22 Oct 2026, 09:12", sub: ["Mass 2.41 kg", "Condition Wet", "2 photos"] }); E({ text: "Held at reception", tone: "Feedback/warning", person: P.dedi, when: "22 Oct 2026, 09:15", sub: ["Reason: wet, label unreadable"] }); E({ text: "Released after relabelling", person: P.maya, when: "22 Oct 2026, 14:40" }); }
    else E({ text: "Received and labelled B0410-07", person: P.dedi, when: "22 Oct 2026, 09:12", sub: ["Mass 2.41 kg", "Condition Good", "2 photos"] });
    E({ text: "Added to batch B-2026-0410", person: P.maya, when: "22 Oct 2026" });
    E({ text: "Preparation finished, ADL 6.42 %", person: P.dedi, when: "23 Oct 2026" });
    if (o.progress) { E({ text: "Entering values", tone: "Status/st-analysis", person: P.fitri, when: "25 Oct 2026", sub: ["5 of 8 parameters saved"] }); ["Analysis finished", "Batch completed, RoA uploaded", "CoA published"].forEach((t) => E({ text: t, pending: true })); return c; }
    E({ text: "Values entered (8 parameters)", person: P.fitri, when: "25 Oct 2026", sub: o.cso ? [] : ["TM 14.20   IM 8.10   Ash 5.42   VM 39.85   FC 46.63   TS 0.42   GCV 5,980 (ADB)"], link: o.cso ? undefined : "View values" });
    E({ text: "Batch completed, RoA-0410 uploaded", person: P.maya, when: "28 Oct 2026" });
    E({ text: "CoA-JO-2026-0131-1 published", person: P.maya, when: "28 Oct 2026" });
    E({ text: "CoA revised: revision 2 published", person: P.maya, when: "1 Nov 2026" });
    return c;
  };
  if (kind === "desktop") { const cols = b.frame(m, { name: "Columns", w: 1128, h: 800, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); const sc = sampleCard(cols); b.raw("node.set", { ids: [sc], props: { width: 378, sizingH: "fixed" } }); histCard(cols); }
  else { sampleCard(m); histCard(m); }
  return s;
}

// ---------- build ----------
exports.build = (b) => {
  clearM(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "M  Search"); });
  const d = Y.desktop, t = Y.tablet, p = Y.phone, DX = 1560, TX = 954, PX = 510, RY = 2000, HH = 1018;
  const D = (n) => [DX * (n % 4), d + RY * Math.floor(n / 4)];
  // 01 Quick_search
  quick(b, ...D(0), "desktop", "01", "Recent", "Lab", "recent");
  quick(b, ...D(1), "desktop", "02", "Typing", "Lab", "typing", { search: "b0417" });
  quick(b, ...D(2), "desktop", "03", "Exact_match", "CSO", "exact", { search: "JO-2026-0137", footer: "Open JO-2026-0137" });
  quick(b, ...D(3), "desktop", "04", "No_match", "Prep", "none", { search: "XK-77" });
  quick(b, 0, t, "tablet", "02", "Typing", "Lab", "typing", { search: "b0417" });
  // 02 Search_results
  results(b, ...D(4), "desktop", "01", "All", "Lab", { q: "BNM" });
  results(b, ...D(5), "desktop", "02", "One_type", "Lab", { q: "BNM", type: "Samples" });
  results(b, ...D(6), "desktop", "03", "CSO", "CSO", { q: "BNM", cso: true });
  results(b, ...D(7), "desktop", "04", "No_results", "Lab", { empty: true });
  results(b, TX, t, "tablet", "01", "All", "Lab", { q: "BNM" });
  results(b, 0, p, "phone", "01", "All", "Lab", { q: "BNM" });
  results(b, PX, p, "phone", "05", "Phone_start", "Prep", { q: "", start: true });
  // 03 Advanced_search
  advanced(b, ...D(8), "desktop", "01", "Empty", "Lab", { empty: true });
  advanced(b, ...D(9), "desktop", "02", "Sample_query", "Lab");
  advanced(b, ...D(10), "desktop", "03", "Results_query", "Supervisor", { target: "Results" });
  { const s = advanced(b, ...D(11), "desktop", "04", "Columns_menu", "Lab"); columnsMenu(b, s); }
  { const s = advanced(b, ...D(12), "desktop", "05", "Save_query", "Lab"); dialog(b, s, "desktop", 1500, "md", "Save query", "Saved queries appear on the left and can be run again.", "Cancel", "Save", (bd) => { b.instV(bd, "Text field", "State=Filled, Size=md", { texts: { Label: "Name *", Value: "High-ash BNM samples" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); b.instV(bd, "Switch", "On=Off, State=Default", { texts: { Label: "Share with staff (they can run and duplicate it)" } }); }); }
  advanced(b, ...D(13), "desktop", "06", "Over_limit", "Manager", { over: true });
  advanced(b, TX * 2, t, "tablet", "02", "Sample_query", "Lab");
  advanced(b, PX * 2, p, "phone", "02", "Sample_query", "Lab");
  // 04 Sample_history
  history(b, ...D(14), "desktop", "01", "Default", "Lab");
  history(b, ...D(15), "desktop", "02", "CSO", "CSO", { cso: true });
  history(b, ...D(16), "desktop", "03", "In_progress", "Analyst", { progress: true, id: "BNM-3602", lab: "B0417-02", jo: "JO-2026-0138", batch: "B-2026-0417", badge: "In batch" });
  history(b, ...D(17), "desktop", "04", "Held", "Prep", { held: true, status: "Held", id: "BNM-3508", lab: "B0410-08" });
  history(b, TX * 3, t, "tablet", "01", "Default", "Lab");
  history(b, PX * 3, p, "phone", "01", "Default", "Lab");
  b.mEnd = { desktop: d + RY * 5 + 400, tablet: t + 3000, phone: p + 3200 };
};
