// Row L · Reports (module 07). Plan: .context/docs/Reports/Reports_Screen_Plan.md
// Run after row K: build-screens.js C,D,E,G,F,H,I,J,K,L. Frames are created under their final names.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver } = H;

const L_NAMES = /^(Desktop|Tablet|Phone)-07-Reports-/;
const isL = (n) => L_NAMES.test(n.name || "") || (n.name === "Row title" && /^L( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isL(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.kEnd ? b.kEnd[k] : 0); }
  return out;
}
const clearL = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isL(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const W = { desktop: 1440, tablet: 834, phone: 390 }, CW = { desktop: 1128, tablet: 698, phone: 358 };
const icon = (b, parent, glyph, tok = "Text/text-muted", size = 14) => { const ic = b.instV(parent, "Icon", `Glyph=${glyph}, Size=${size}`); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const txt = (b, parent, t, style, color, name, o = {}) => b.text(parent, t, { style, color, name: name || t, ...o });
const hframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "h", gap, cross: o.cross || "center", main: o.main, wrap: o.wrap, pad: o.pad, sizeH: o.sizeH || "hug", sizeV: o.sizeV || "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw, clip: o.clip });
const vframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "v", gap, pad: o.pad, cross: o.cross, main: o.main, sizeH: o.sizeH || "fill", sizeV: o.sizeV || "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw, clip: o.clip });
const btn = (b, parent, type, label, glyph, o = {}) => b.instV(parent, "Button", `Type=${type}, Tone=${o.tone || "Default"}, Size=${o.size || "lg"}, State=Default`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false }, props: o.fill ? { sizingH: "fill" } : undefined });
const iconBtn = (b, parent, glyph, size = 32) => b.instV(parent, "Icon button", `Type=Ghost, Size=${size}, State=Default`, { swaps: [[0, "Icon", `Glyph=${glyph}, Size=14`]] });
const cardTop = (b, c, title) => { const hd = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" }); txt(b, hd, title, "Heading/H3", "Text/heading", "Title"); return hd; };
const pill = (b, parent, label, bg, fg, dot) => { const p = hframe(b, parent, "Pill", 6, { fill: bg, r: 12, pad: [3, 10, 3, 10] }); if (dot) b.frame(p, { name: "Dot", w: 6, h: 6, fill: fg, r: 3, sizeH: "fixed", sizeV: "fixed" }); txt(b, p, label, "Caption/SemiBold", fg, "Label"); return p; };

// ---------- demo data (plan section 9) ----------
const CLIENT = { PTBA: ["PT Bukit Asam Tbk", "BA", true], BNM: ["PT Bara Nusantara Mandiri", "BN"], KEP: ["PT Kaltara Energi Prima", "KE"], MCR: ["PT Mahakam Coal Resources", "MC"], SBH: ["CV Sumber Batu Hitam", "SB"] };
function avatar(b, parent, key, size = 40) {
  const c = CLIENT[key];
  if (c[2]) { const f = b.frame(parent, { name: "Avatar", w: size, h: size, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 999, layout: "h", pad: [4, 4, 4, 4], sizeH: "fixed", sizeV: "fixed", clip: true }); b.comp(f, "ptba-logo", { props: { sizingH: "fill", sizingV: "fill" } }); return f; }
  if (size === 40) return b.instV(parent, "Avatar", "Size=40", { texts: { Initials: c[1] } });
  const f = b.frame(parent, { name: "Avatar", w: size, h: size, fill: "Accent/accent-100", r: 999, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, f, c[1], "Heading/H2", "Accent/accent-text", "Initials"); return f;
}
// CoA rows: [number, job order, client, status, published, signatory, sent channel icon, sent date]
const COA = [
  ["", "JO-2026-0132", "SBH", "Draft", "", "", "", ""],
  ["CoA-JO-2026-0142-1", "JO-2026-0142", "PTBA", "Published", "2 Nov 2026", "Bambang S.", "", ""],
  ["CoA-JO-2026-0141-1", "JO-2026-0141", "KEP", "Sent", "24 Oct 2026", "Bambang S.", "whatsapp-logo", "25 Oct 2026"],
  ["CoA-JO-2026-0131-2", "JO-2026-0131", "BNM", "Published", "1 Nov 2026", "Bambang S.", "", ""],
  ["CoA-JO-2026-0131-1", "JO-2026-0131", "BNM", "Superseded", "28 Oct 2026", "Bambang S.", "", ""],
  ["CoA-JO-2026-0130-1", "JO-2026-0130", "MCR", "Sent", "27 Oct 2026", "Bambang S.", "envelope-simple", "28 Oct 2026"],
  ["CoA-JO-2026-0129-1", "JO-2026-0129", "SBH", "Sent", "24 Oct 2026", "Bambang S.", "printer", "26 Oct 2026"],
  ["CoA-JO-2026-0128-1", "JO-2026-0128", "PTBA", "Sent", "21 Oct 2026", "Bambang S.", "envelope-simple", "22 Oct 2026"],
  ["CoA-JO-2026-0127-1", "JO-2026-0127", "KEP", "Sent", "18 Oct 2026", "Bambang S.", "whatsapp-logo", "19 Oct 2026"],
  ["CoA-JO-2026-0126-1", "JO-2026-0126", "BNM", "Sent", "15 Oct 2026", "Bambang S.", "envelope-simple", "16 Oct 2026"],
];
// RoA rows: [RoA number, batch, job order, client, uploaded, by]
const ROA = [
  ["RoA-0412", "B-2026-0412", "JO-2026-0142", "PTBA", "1 Nov 2026", "Maya Lestari"],
  ["RoA-0411", "B-2026-0411", "JO-2026-0131", "BNM", "31 Oct 2026", "Maya Lestari"],
  ["RoA-0410", "B-2026-0410", "JO-2026-0131", "BNM", "28 Oct 2026", "Maya Lestari"],
  ["RoA-0409", "B-2026-0409", "JO-2026-0130", "MCR", "27 Oct 2026", "Maya Lestari"],
  ["RoA-0408", "B-2026-0408", "JO-2026-0129", "SBH", "24 Oct 2026", "Maya Lestari"],
  ["RoA-0416", "B-2026-0416", "JO-2026-0141", "KEP", "22 Oct 2026", "Maya Lestari"],
  ["RoA-0405", "B-2026-0405", "JO-2026-0128", "PTBA", "21 Oct 2026", "Maya Lestari"],
  ["RoA-0404", "B-2026-0404", "JO-2026-0127", "KEP", "18 Oct 2026", "Maya Lestari"],
  ["RoA-0403", "B-2026-0403", "JO-2026-0126", "BNM", "15 Oct 2026", "Maya Lestari"],
  ["RoA-0402", "B-2026-0402", "JO-2026-0125", "SBH", "14 Oct 2026", "Maya Lestari"],
];
const STATUS = { Draft: ["Draft", "Draft"], Published: ["Reported", "Published"], Sent: ["Delivered", "Sent"], Superseded: ["Cancelled", "Superseded"], Void: ["Cancelled", "Void"] };
const badge = (b, parent, st, size = "md") => b.instV(parent, "Status badge", `Status=${STATUS[st][0]}, Size=${size}`, { texts: { Label: STATUS[st][1] } });

// ---------- list ----------
const CHIPS_COA = (role) => [["All", role === "Lab" ? "21" : "20", 1], ...(role === "Lab" ? [["Draft", "1", 0]] : []), ["Published", "3", 0], ["Sent", "15", 0], ["Superseded", "2", 0]];
const COLS = {
  coa: { desktop: [["", 40], ["Number", 180], ["Job order", 120], ["Client", 0], ["Status", 110], ["Published", 110], ["Signatory", 110], ["Sent", 130], ["", 44], ["", 44]], tablet: [["", 36], ["Number", 0], ["Status", 110], ["Published", 110], ["", 44], ["", 44]] },
  roa: { desktop: [["", 40], ["RoA number", 120], ["Batch", 130], ["Job order", 130], ["Client", 0], ["Uploaded", 130], ["Uploaded by", 140], ["", 44], ["", 44]], tablet: [["", 36], ["RoA number", 0], ["Uploaded", 120], ["", 44], ["", 44]] },
};
const dash = (b, f) => txt(b, f, "—", "Body small/Regular", "Text/text-muted", "Empty");
function cellFor(tab) {
  return (b, f, h, r, kind, col, o) => {
    const idx = r.idx;
    if (col === 0 && h === "") { b.instV(f, "Checkbox", `Checked=${idx < (o.sel || 0) ? "On" : "Off"}, State=Default`, { hide: ["Label"] }); return; }
    if (tab === "coa") {
      const [no, jo, ck, st, pub, sig, ch, sd] = r;
      if (h === "Number") { if (kind === "tablet") { const v = vframe(b, f, "Number", 2, { sizeH: "fill" }); txt(b, v, no || "Draft, no number", "Data/Strong", no ? "Text/heading" : "Text/text-muted", "Number"); txt(b, v, CLIENT[ck][0], "Caption/Regular", "Text/text-secondary", "Client"); } else txt(b, f, no || "—", "Data/Strong", no ? "Text/heading" : "Text/text-muted", "Number"); }
      if (h === "Job order") txt(b, f, jo, "Data", "Primary/primary", "Job order");
      if (h === "Client") { avatar(b, f, ck); txt(b, f, CLIENT[ck][0], "Body small/Regular", "Text/foreground", "Client", { fill: true }); }
      if (h === "Status") badge(b, f, st);
      if (h === "Published") (pub ? txt(b, f, pub, "Body small/Regular", "Text/text-secondary", "Published") : dash(b, f));
      if (h === "Signatory") (sig ? txt(b, f, sig, "Body small/Regular", "Text/text-secondary", "Signatory") : dash(b, f));
      if (h === "Sent") { if (ch) { icon(b, f, ch, "Text/text-secondary"); txt(b, f, sd, "Body small/Regular", "Text/text-secondary", "Sent"); } else dash(b, f); }
      if (h === "" && col === cols_len(kind, tab) - 2) { if (st !== "Draft") iconBtn(b, f, "download-simple"); }
      if (h === "" && col === cols_len(kind, tab) - 1) iconBtn(b, f, "dots-three");
    } else {
      const [no, bt, jo, ck, up, by] = r;
      if (h === "RoA number") { if (kind === "tablet") { const v = vframe(b, f, "Number", 2, { sizeH: "fill" }); txt(b, v, no, "Data/Strong", "Text/heading", "Number"); txt(b, v, CLIENT[ck][0], "Caption/Regular", "Text/text-secondary", "Client"); } else txt(b, f, no, "Data/Strong", "Text/heading", "Number"); }
      if (h === "Batch") txt(b, f, bt, "Data", "Primary/primary", "Batch");
      if (h === "Job order") txt(b, f, jo, "Data", "Primary/primary", "Job order");
      if (h === "Client") { avatar(b, f, ck); txt(b, f, CLIENT[ck][0], "Body small/Regular", "Text/foreground", "Client", { fill: true }); }
      if (h === "Uploaded") txt(b, f, up, "Body small/Regular", "Text/text-secondary", "Uploaded");
      if (h === "Uploaded by") txt(b, f, by, "Body small/Regular", "Text/text-secondary", "By");
      if (h === "" && col === cols_len(kind, tab) - 2) iconBtn(b, f, "download-simple");
      if (h === "" && col === cols_len(kind, tab) - 1) iconBtn(b, f, "dots-three");
    }
  };
}
const cols_len = (kind, tab) => COLS[tab][kind].length;

function tabsRow(b, main, kind, on, counts) {
  const r = b.frame(main, { name: "Tabs", w: 800, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug", clip: kind === "phone" });
  [["CoA", counts[0]], ["RoA", counts[1]]].forEach(([l, n]) => b.instV(r, "Tab", `Selected=${l === on ? "On" : "Off"}, State=Default`, { texts: { 0: l, 1: String(n) } }));
  return r;
}
function listHeader(b, main, kind) {
  const r = hframe(b, main, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "max" });
  const t = vframe(b, r, "Title block", 4, { sizeH: kind === "desktop" ? "hug" : "fill" });
  txt(b, t, "REPORTS", "Overline", "Text/text-muted", "Overline"); txt(b, t, "Reports", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (kind === "phone") btn(b, r, "Secondary", "Filters", "funnel", { size: "touch" });
}
function reportsList(b, x, y, kind, o) {
  page(b, kind);
  const tab = o.tab || "coa";
  const name = `${KIND(kind)}-07-Reports-01-Reports_list-${o.vv}-${o.variant}`;
  const s = b.shell({ name, x, y, kind, active: "Reports", role: o.role });
  const m = s.main;
  listHeader(b, m, kind);
  if (o.empty) { b.instV(m, "Empty state", "Size=Page", { texts: { Title: "No reports yet", Text: "CoAs appear here when a job order's batches are completed. RoAs appear when a batch's signed RoA is uploaded." }, hide: ["Button"], swaps: [[0, "Icon", "Glyph=file-text, Size=20"]], props: { sizingH: "fill" } }); return s; }
  if (o.tabs) tabsRow(b, m, kind, tab === "coa" ? "CoA" : "RoA", [o.role === "Lab" ? 21 : 20, 46]);
  const rows = o.noResults ? [] : (tab === "coa" ? (o.role === "Lab" ? COA : COA.slice(1)) : ROA).slice(0, kind === "phone" ? 5 : 10).map((r, i) => Object.assign([...r], { idx: i }));
  if (kind === "phone") { phoneCards(b, m, tab, rows, o); return s; }
  const c = card(b, m, "Table card");
  const bar = b.frame(c, { name: "Filters", w: CW[kind] - 32, h: 40, layout: "h", gap: 12, wrap: true, cross: "max", sizeH: "fill", sizeV: "hug" });
  b.instV(bar, "Search", "Size=md, State=Default", { texts: { Value: o.noResults ? "CoA-JO-2026-9999" : tab === "coa" ? "Search number, job order, client" : "Search RoA number, batch, job order, client" }, props: { width: kind === "desktop" ? 300 : 260, sizingH: "fixed" }, hide: ["Scan"] });
  b.instV(bar, "Select", "State=Filled, Size=md", { texts: { Label: "Period", Value: "Last 90 days" }, setProps: { "Show helper": false }, props: { width: 170, sizingH: "fixed" } });
  b.instV(bar, "Select", "State=Filled, Size=md", { texts: { Label: "Company", Value: "All companies" }, setProps: { "Show helper": false }, props: { width: 220, sizingH: "fixed" } });
  if (tab === "coa") { const ch = hframe(b, c, "Chips", 8, { sizeH: "fill", wrap: true }); CHIPS_COA(o.role).forEach(([l, n, on]) => b.instV(ch, "Filter chip", `Selected=${on ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: n } })); }
  if (o.noResults) { b.instV(c, "Empty state", "Size=Card", { texts: { Title: "No reports match", Text: "Try another number or clear the filters.", Label: "Clear filters" }, swaps: [[0, "Icon", "Glyph=magnifying-glass, Size=20"]], props: { sizingH: "fill" } }); return s; }
  const cols = COLS[tab][kind];
  const t = vframe(b, c, "Table", 0);
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w], i) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", gap: 4, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (h) { txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); icon(b, f, "arrows-down-up", "Text/text-muted", 14); } else if (i === 0) b.instV(f, "Checkbox", `Checked=${o.sel ? "Mixed" : "Off"}, State=Default`, { hide: ["Label"] }); });
  const cell = cellFor(tab);
  rows.forEach((r) => {
    const rr = vframe(b, t, "Row", 0);
    const line = b.frame(rr, { name: "Cells", w: 800, h: kind === "tablet" ? 64 : 56, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    cols.forEach(([h, w], i) => { const f = b.frame(line, { name: "Cell", w: w || 120, h: kind === "tablet" ? 64 : 56, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); cell(b, f, h, r, kind, i, o); });
    b.frame(rr, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
  b.instV(c, "Pager", "Breakpoint=Desktop", { texts: { Summary: `Showing 1–10 of ${tab === "coa" ? (o.role === "Lab" ? 21 : 20) : 46}` }, props: { sizingH: "fill" } });
  if (o.sel) { const bar2 = b.instV(m, "Sticky action bar", "Breakpoint=Desktop", { texts: { Note: "2 selected", 0: "Clear" }, props: { sizingH: "fill" } }); const v = b.v("Sticky action bar", "Breakpoint=Desktop"); b.raw("node.set", { ids: [bar2 + v.texts[1].pos], props: { characters: "Clear" } }); b.raw("node.set", { ids: [bar2 + v.texts[2].pos], props: { characters: "Download PDFs" } }); }
  return s;
}
function phoneCards(b, m, tab, rows, o) {
  const list = vframe(b, m, "Cards", 10);
  rows.forEach((r) => {
    const c = vframe(b, list, "Item card", 8, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: [16, 16, 16, 16] });
    const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" });
    if (tab === "coa") {
      const [no, jo, ck, st, pub, sig, ch, sd] = r;
      txt(b, top, no || "Draft, no number", "Data/Strong", no ? "Text/heading" : "Text/text-muted", "Number"); badge(b, top, st, "sm");
      const cl = hframe(b, c, "Client", 8, { sizeH: "fill" }); avatar(b, cl, ck); txt(b, cl, CLIENT[ck][0], "Body small/Regular", "Text/text-secondary", "Client", { fill: true });
      const mt = hframe(b, c, "Meta", 12, { sizeH: "fill", main: "spaceBetween" }); txt(b, mt, jo, "Data", "Primary/primary", "Job order"); if (pub) txt(b, mt, pub, "Caption/Regular", "Text/text-secondary", "Published"); if (ch) { const sg = hframe(b, mt, "Sent", 4); icon(b, sg, ch, "Text/text-secondary"); txt(b, sg, sd, "Caption/Regular", "Text/text-secondary", "Sent"); }
    } else {
      const [no, bt, jo, ck, up, by] = r;
      txt(b, top, no, "Data/Strong", "Text/heading", "Number"); iconBtn(b, top, "download-simple");
      const cl = hframe(b, c, "Client", 8, { sizeH: "fill" }); avatar(b, cl, ck); txt(b, cl, CLIENT[ck][0], "Body small/Regular", "Text/text-secondary", "Client", { fill: true });
      const mt = hframe(b, c, "Meta", 12, { sizeH: "fill", main: "spaceBetween" }); txt(b, mt, bt, "Data", "Primary/primary", "Batch"); txt(b, mt, up, "Caption/Regular", "Text/text-secondary", "Uploaded");
    }
  });
  b.instV(m, "Pager", "Breakpoint=Mobile", { texts: { Page: "1 / 5" }, props: { sizingH: "fill" } });
}

// ---------- the document page the preview draws (plan 5.4) ----------
const SAMPLES = [
  ["BA-0142-01", "LBA-26-1101", [["Total moisture", "%", "—", "—", "—", "14.20", "ASTM D3302"], ["Inherent moisture", "%", "8.10", "—", "—", "—", "ASTM D3173"], ["Ash", "%", "5.42", "5.90", "—", "5.06", "ASTM D3174"], ["Volatile matter", "%", "39.85", "43.36", "46.08", "37.21", "ASTM D3175"], ["Fixed carbon", "%", "46.63", "50.74", "53.92", "43.54", "By calculation"], ["Total sulphur", "%", "0.42", "0.46", "0.49", "0.39", "ASTM D4239"], ["Gross calorific value", "kcal/kg", "5,980", "6,507", "6,915", "5,584", "ASTM D5865"]]],
  ["BA-0142-02", "LBA-26-1102", [["Total moisture", "%", "—", "—", "—", "13.80", "ASTM D3302"], ["Inherent moisture", "%", "7.90", "—", "—", "—", "ASTM D3173"], ["Ash", "%", "6.10", "6.62", "—", "5.71", "ASTM D3174"], ["Volatile matter", "%", "38.90", "42.24", "45.23", "36.41", "ASTM D3175"], ["Fixed carbon", "%", "47.10", "51.14", "54.77", "44.09", "By calculation"], ["Total sulphur", "%", "0.51", "0.55", "0.59", "0.48", "ASTM D4239"], ["Gross calorific value", "kcal/kg", "5,890", "6,395", "6,849", "5,513", "ASTM D5865"]]],
];
const DW = [100, 44, 52, 52, 52, 52, 144];
function docPage(b, parent, o = {}) {
  const roa = o.kind === "roa";
  const pg = b.frame(parent, { name: "Document page", w: 560, h: 792, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 4, layout: "v", gap: 10, pad: [28, 32, 20, 32], sizeH: "fixed", sizeV: "fixed", clip: true });
  const h = hframe(b, pg, "Header", 10, { sizeH: "fill", main: "spaceBetween", cross: "min" });
  const lab = hframe(b, h, "Laboratory", 8); b.instV(lab, "Logo", "Type=Icon, Color=Default", { props: { width: 34, height: 35 } });
  const lt = vframe(b, lab, "Text", 1, { sizeH: "hug" }); txt(b, lt, "Sentra Geo Survey Indonesia", "Body small/SemiBold", "Text/heading", "Name"); txt(b, lt, "Jl. Pangeran Antasari 12, Samarinda", "Caption/Regular", "Text/text-muted", "Address");
  const no = vframe(b, h, "Number", 1, { sizeH: "hug", cross: "max" });
  txt(b, no, o.number || (roa ? "RoA-0412" : "CoA-JO-2026-0142-1"), "Data/Strong", "Text/heading", "Number"); txt(b, no, roa ? "Internal, not for distribution" : "Revision " + (o.rev || 1), "Caption/Regular", roa ? "Feedback/error" : "Text/text-secondary", "Revision"); txt(b, no, o.draft ? "Draft" : "Issued " + (o.issued || "2 Nov 2026"), "Caption/Regular", "Text/text-secondary", "Issued");
  txt(b, pg, roa ? "Report of Analysis" : "Certificate of Analysis", "Heading/H2", "Text/heading", "Title", { align: "center", fill: true });
  b.frame(pg, { name: "Divider", w: 496, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  const cl = hframe(b, pg, "Client block", 24, { sizeH: "fill", cross: "min" });
  const kvl = (p, k, v) => { const r = hframe(b, p, "Line", 6, { sizeH: "fill", cross: "min" }); const kf = b.frame(r, { name: "Key", w: 76, h: 14, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, kf, k, "Caption/Regular", "Text/text-muted", "Key"); txt(b, r, v, "Caption/SemiBold", "Text/heading", "Value", { fill: true }); };
  const l1 = vframe(b, cl, "Left", 3); kvl(l1, "Principal", o.client || "PT Bukit Asam Tbk"); kvl(l1, "Attention", "Budi Santoso"); kvl(l1, "Reference", o.ref || "PTBA-2210");
  const l2 = vframe(b, cl, "Right", 3); kvl(l2, "Job order", o.jo || "JO-2026-0142"); kvl(l2, "Received", "14 Oct 2026"); kvl(l2, "Samples", "11 coal samples");
  txt(b, pg, roa ? "Results as entered by the Analyst and signed by the Supervisor. The values are reported on four bases." : "Samples were prepared and analysed in accordance with the ASTM methods listed. The results relate to the samples as received.", "Caption/Regular", "Text/text-secondary", "Statement", { fill: true });
  SAMPLES.forEach(([sid, lid, rows]) => {
    const sb = vframe(b, pg, "Sample", 2);
    const sh = hframe(b, sb, "Sample head", 10, { sizeH: "fill", fill: "Primary/primary-50", pad: [3, 8, 3, 8], r: 4 }); txt(b, sh, "Sample " + sid.replace("BA-0142", (o.init || "BA") + "-" + (o.jo || "JO-2026-0142").slice(-4)), "Caption/SemiBold", "Text/heading", "Sample"); txt(b, sh, "Lab ID " + lid, "Caption/Regular", "Text/text-secondary", "Lab ID");
    const hd = hframe(b, sb, "Table head", 0, { sizeH: "fill", pad: [0, 8, 0, 8] }); ["Parameter", "Unit", "ADB", "DB", "DAF", "AR", "Method"].forEach((l, i) => { const f = b.frame(hd, { name: "Head", w: DW[i], h: 14, layout: "h", main: i > 1 && i < 6 ? "max" : "min", pad: i > 1 && i < 6 ? [0, 8, 0, 0] : 0, sizeH: "fixed", sizeV: "hug" }); txt(b, f, l, "Caption/SemiBold", "Text/text-secondary", "Head label"); });
    rows.forEach((rw) => { const rr = hframe(b, sb, "Row", 0, { sizeH: "fill", pad: [0, 8, 0, 8] }); rw.forEach((v, i) => { const f = b.frame(rr, { name: "Cell", w: DW[i], h: 15, layout: "h", main: i > 1 && i < 6 ? "max" : "min", pad: i > 1 && i < 6 ? [0, 8, 0, 0] : 0, sizeH: "fixed", sizeV: "hug" }); txt(b, f, v, i === 0 ? "Caption/Medium" : "Caption/Regular", i === 6 ? "Text/text-muted" : "Text/foreground", "Cell"); }); });
  });
  if (o.remarks) txt(b, pg, "Remarks: " + o.remarks, "Caption/Regular", "Text/text-secondary", "Remarks", { fill: true });
  const sg = hframe(b, pg, "Signature block", 16, { sizeH: "fill", main: "spaceBetween", cross: "max" });
  const iss = vframe(b, sg, "Issued", 1, { sizeH: "hug" }); txt(b, iss, "Issued at Samarinda", "Caption/Regular", "Text/text-secondary", "Place"); txt(b, iss, o.issued || "2 Nov 2026", "Caption/SemiBold", "Text/heading", "Date");
  const sn = vframe(b, sg, "Signatory", 1, { sizeH: "hug", cross: "min" }); b.frame(sn, { name: "Signature space", w: 150, h: 26, sizeH: "fixed", sizeV: "fixed" }); b.frame(sn, { name: "Signature line", w: 150, h: 1, fill: "Surface/border-strong", sizeH: "fixed", sizeV: "fixed" });
  txt(b, sn, roa ? "Hendra Wijaya, S.T." : "Ir. Bambang Sutrisno, M.T.", "Caption/SemiBold", "Text/heading", "Name"); txt(b, sn, roa ? "Technical Supervisor" : "Laboratory Manager", "Caption/Regular", "Text/text-secondary", "Title");
  b.frame(pg, { name: "Spacer", w: 10, h: 10, sizeH: "fixed", sizeV: "fill" });
  const ft = vframe(b, pg, "Footer", 1); txt(b, ft, roa ? "Internal, not for distribution. Signed copy kept in the laboratory file." : "This certificate may not be reproduced except in full.", "Caption/Regular", "Text/text-muted", "Terms", { fill: true }); const f2 = hframe(b, ft, "Codes", 12, { sizeH: "fill", main: "spaceBetween" }); txt(b, f2, "Page 1 of 2", "Caption/Regular", "Text/text-muted", "Page"); txt(b, f2, roa ? "FM-LAB-021 rev 1" : "Verify 7F3A-91C2   FM-LAB-014 rev 2", "Caption/Regular", "Text/text-muted", "Form");
  if (o.draft) { const wm = txt(b, pg, "DRAFT", "Display/XL", "Text/text-muted", "Watermark"); b.raw("node.set", { ids: [wm], props: { absolute: true, x: 150, y: 330, rotation: -28, opacity: 0.18, fontSize: 96 } }); }
  return pg;
}
function previewCard(b, parent, kind, o = {}) {
  const c = card(b, parent, "Preview card"); b.raw("node.set", { ids: [c], props: { sizingH: "fill" } });
  const hd = cardTop(b, c, "Preview"); const pn = hframe(b, hd, "Pages", 4); iconBtn(b, pn, "caret-left"); txt(b, pn, "Page 1 of 2", "Body small/Regular", "Text/text-secondary", "Page"); iconBtn(b, pn, "caret-right");
  const cv = b.frame(c, { name: "Canvas", w: 400, h: 840, fill: "Surface/muted", r: 12, layout: "h", main: "center", cross: "min", pad: [24, 24, 24, 24], sizeH: "fill", sizeV: "hug" });
  docPage(b, cv, o);
  return c;
}
function thumbCard(b, parent, o) {
  const c = card(b, parent, "Document card"); cardTop(b, c, o.roa ? "Signed RoA" : "Certificate");
  const r = hframe(b, c, "Document", 16, { sizeH: "fill", cross: "min" });
  const th = b.frame(r, { name: "Thumbnail", w: 96, h: 136, fill: "Surface/muted", stroke: "Surface/border", sw: 1, r: 6, layout: "v", gap: 6, pad: [12, 10, 10, 10], sizeH: "fixed", sizeV: "fixed" });
  [70, 56, 62, 40, 66, 52, 60].forEach((w2) => b.frame(th, { name: "Line", w: w2, h: 5, fill: "Surface/border-strong", r: 2, sizeH: "fixed", sizeV: "fixed" }));
  const t = vframe(b, r, "Text", 6, { sizeH: "fill" }); txt(b, t, o.file, "Body small/SemiBold", "Text/heading", "File"); txt(b, t, "2 pages", "Caption/Regular", "Text/text-muted", "Pages"); btn(b, t, "Secondary", "Open PDF", "file-pdf", { size: "md" });
  return c;
}

// ---------- cards on the right ----------
function kvCard(b, parent, title, rows, o = {}) {
  const c = card(b, parent, title + " card"); cardTop(b, c, title);
  const v = b.v("Key-value row", "Layout=Inline");
  rows.forEach(([k, v1, v2, link]) => {
    const id = b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: k, Value: v1, ...(v2 ? { "Value 2": v2 } : {}) }, fills: link ? { Value: "Primary/primary" } : undefined, props: { sizingH: "fill" } });
    if (v2) b.raw("node.set", { ids: [id + v.names["Value 2"]], props: { visible: true } }); else b.raw("node.set", { ids: [id + v.names.Value], props: { sizingH: "fill", textAutoResize: "height" } });
  });
  return c;
}
const detailsRows = (o) => o.roa
  ? [["Batch", "B-2026-0412", "", true], ["Job order", "JO-2026-0142", "", true], ["Client", "PT Bukit Asam Tbk"], ["Samples", "12 samples"], ["Standard", "ASTM"], ["Uploaded", "1 Nov 2026", "Maya Lestari"], ["Batch completed", "1 Nov 2026", "Maya Lestari"], ["File", "RoA-0412.pdf", "1.8 MB"]]
  : [["Job order", o.jo || "JO-2026-0142", "", true], ["Client", o.client || "PT Bukit Asam Tbk"], ["Attention", "Budi Santoso"], ["Reference", o.ref || "PTBA-2210"], ["Bases", "ADB, DB, DAF, AR"], ["Parameters", "8 parameters"], ["Samples", "11 samples"], ["Published", o.pub || "2 Nov 2026", "Maya Lestari"], ["Signatory", "Ir. Bambang Sutrisno, M.T."], ["Title", "Laboratory Manager"], ["Printed", "2 times", "last 3 Nov 2026"]];
function deliveryCard(b, parent, sent) {
  const c = card(b, parent, "Delivery card"); cardTop(b, c, "Delivery");
  if (!sent) { txt(b, c, "Not sent yet.", "Body small/Regular", "Text/text-secondary", "Empty", { fill: true }); return c; }
  const n = hframe(b, c, "Send", 8, { sizeH: "fill", fill: "Status/st-completed-100", r: 10, pad: [10, 14, 10, 14], wrap: true });
  icon(b, n, "whatsapp-logo", "Status/st-completed"); txt(b, n, "WhatsApp", "Body small/SemiBold", "Text/foreground", "Channel"); txt(b, n, "Budi Santoso", "Body small/Regular", "Text/foreground", "Recipient"); txt(b, n, "3 Nov 2026", "Body small/Regular", "Text/text-secondary", "Date"); txt(b, n, "Rina Kartika", "Body small/Regular", "Text/text-secondary", "By");
  return c;
}
function versionsCard(b, parent, rows) {
  const c = card(b, parent, "Versions card"); cardTop(b, c, "Versions");
  rows.forEach(([rev, st, date, note]) => {
    const r = hframe(b, c, "Version", 8, { sizeH: "fill", wrap: true });
    txt(b, r, rev, "Data/Strong", "Text/heading", "Revision");
    if (st === "Current") pill(b, r, "Current", "Feedback/success-100", "Feedback/success", false); else pill(b, r, st, "Surface/muted", "Text/text-muted", false);
    txt(b, r, date, "Body small/Regular", "Text/text-secondary", "Date"); if (note) txt(b, r, note, "Caption/Regular", "Text/text-muted", "Reason", { fill: true });
  });
  return c;
}
function contentsCard(b, parent, kind) {
  const c = card(b, parent, "Contents card"); cardTop(b, c, "Contents");
  const t = kind === "phone";
  const v = b.v("Key-value row", "Layout=Inline");
  const kv = b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: "Template", Value: "House CoA template, version 1" }, props: { sizingH: "fill" } }); b.raw("node.set", { ids: [kv + v.names.Value], props: { sizingH: "fill", textAutoResize: "height" } });
  const g1 = vframe(b, c, "Bases", 6); txt(b, g1, "Bases", "Caption/Medium", "Text/text-secondary", "Label"); const bs = hframe(b, g1, "Options", 16, { sizeH: "fill", wrap: true }); ["ADB", "DB", "DAF", "AR"].forEach((l) => b.instV(bs, "Checkbox", "Checked=On, State=Default", { texts: { Label: l } }));
  const g2 = vframe(b, c, "Parameters", 6); txt(b, g2, "Parameters", "Caption/Medium", "Text/text-secondary", "Label"); const ps = hframe(b, g2, "Pills", 6, { sizeH: "fill", wrap: true }); ["TM", "IM", "Ash", "VM", "FC", "TS", "GCV", "HGI"].forEach((l) => b.instV(ps, "Parameter pill", "Kind=Parameter, State=On", { texts: { Label: l } }));
  const g3 = vframe(b, c, "Samples", 2); txt(b, g3, "Samples", "Caption/Medium", "Text/text-secondary", "Label"); txt(b, g3, "11 samples reported. 1 not received is left out.", "Body small/Regular", "Text/foreground", "Text", { fill: true });
  const sz = t ? "touch" : "md";
  b.instV(c, "Select", `State=Filled, Size=${sz}`, { texts: { Label: "Attention", Value: "Budi Santoso" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(c, "Text field", `State=Filled, Size=${sz}`, { texts: { Label: "Client reference or PO", Value: "PTBA-2210" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(c, "Textarea", `State=Default, Size=${sz}`, { texts: { Label: "Remarks", Value: "Printed under the results" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  const sg = b.instV(c, "Select", `State=Filled, Size=${sz}`, { texts: { Label: "Signatory", Value: "Ir. Bambang Sutrisno, M.T." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  return { c, sg };
}

// ---------- report page frames ----------
// o: { vv, variant, role, kind:"coa"|"roa", state:"draft"|"published"|"sent"|"superseded", number, ... }
function reportPage(b, x, y, kind, o) {
  page(b, kind);
  const roa = o.kind === "roa";
  const name = `${KIND(kind)}-07-Reports-${roa ? "03-RoA" : "02-CoA"}-${o.vv}-${o.variant}`;
  const s = b.shell({ name, x, y, kind, active: "Reports", role: o.role });
  const m = s.main, st = o.state;
  const num = roa ? "RoA-0412" : st === "draft" ? "Draft CoA" : o.number || "CoA-JO-2026-0142-1";
  b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Reports", 1: num } });
  const hd = hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center", wrap: kind === "tablet" });
  const id = vframe(b, hd, "Identity", 6, { sizeH: kind === "phone" ? "fill" : "hug" });
  const ti = hframe(b, id, "Title", 12, kind === "phone" ? { sizeH: "fill", wrap: true } : {});
  txt(b, ti, num, kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (roa) pill(b, ti, "Signed copy", "Primary/primary-100", "Primary/primary", false); else badge(b, ti, { draft: "Draft", published: "Published", sent: "Sent", superseded: "Superseded" }[st]);
  const sub = hframe(b, id, "Facts", 12, { wrap: true, sizeH: kind === "phone" ? "fill" : "hug" });
  txt(b, sub, o.jo || "JO-2026-0142", "Data", "Primary/primary", "Job order"); txt(b, sub, o.client || "PT Bukit Asam Tbk", "Body small/Regular", "Text/text-secondary", "Client"); txt(b, sub, roa ? "B-2026-0412" : "Revision " + (o.rev || 1), roa ? "Data" : "Body small/Regular", roa ? "Primary/primary" : "Text/text-secondary", "Revision");
  const act = hframe(b, hd, "Actions", 8);
  if (kind !== "phone") {
    if (st === "draft") { btn(b, act, "Primary", "Publish", "check"); iconBtn(b, act, "dots-three", 36); }
    else { btn(b, act, "Secondary", "Download", "download-simple"); if (st !== "superseded") btn(b, act, "Secondary", "Print", "printer"); if (o.role === "CSO" && (st === "published" || st === "sent")) btn(b, act, "Primary", st === "sent" ? "Add another send" : "Mark sent", "paper-plane-tilt"); if (!roa && st !== "superseded") iconBtn(b, act, "dots-three", 36); }
  }
  if (roa) b.instV(m, "Inline alert", "Tone=Info", { texts: { 0: "Internal, not for distribution", 1: "This is the lab's signed paper RoA, uploaded when the batch was completed." }, hide: ["Action"], props: { sizingH: "fill" } });
  if (st === "superseded") b.instV(m, "Inline alert", "Tone=Warning", { texts: { 0: "Superseded by revision 2 on 4 Nov 2026", 1: "This version is kept for the record. You can only download it." }, hide: ["Action"], props: { sizingH: "fill" } });
  const docOpts = { kind: o.kind, draft: st === "draft", number: roa ? "RoA-0412" : st === "draft" ? "Number on publish" : o.number, rev: o.rev, jo: o.jo, client: o.client, ref: o.ref, init: (CLIENT[Object.keys(CLIENT).find((k) => CLIENT[k][0] === o.client)] || CLIENT.PTBA)[1] };
  const right = (p) => {
    let sg = null;
    if (st === "draft") ({ sg } = contentsCard(b, p, kind));
    else { kvCard(b, p, "Details", detailsRows({ roa, jo: o.jo, client: o.client, ref: o.ref, pub: o.pub })); if (!roa) { deliveryCard(b, p, st === "sent"); versionsCard(b, p, st === "superseded" ? [["Rev 2", "Current", "4 Nov 2026", ""], ["Rev 1", "Superseded", "28 Oct 2026", "Wrong client reference"]] : [["Rev 1", "Current", o.pub || "2 Nov 2026", ""]]); } else { const u = card(b, p, "Used in card"); cardTop(b, u, "Used in"); const r = hframe(b, u, "CoA", 8, { sizeH: "fill", wrap: true }); txt(b, r, "CoA-JO-2026-0142-1", "Data/Strong", "Primary/primary", "CoA"); badge(b, r, "Published", "sm"); } }
    return sg;
  };
  let sgPos = null;
  if (kind === "desktop") {
    const cols = b.frame(m, { name: "Columns", w: 1128, h: 900, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" });
    previewCard(b, cols, kind, docOpts);
    const rc = vframe(b, cols, "Right column", 16, { sizeH: "fixed" }); b.raw("node.set", { ids: [rc], props: { width: 378, sizingH: "fixed" } });
    sgPos = right(rc);
  } else if (kind === "tablet") { previewCard(b, m, kind, docOpts); sgPos = right(m); }
  else { thumbCard(b, m, { file: roa ? "RoA-0412.pdf" : st === "draft" ? "Draft preview" : (o.number || "CoA-JO-2026-0142-1") + ".pdf", roa }); sgPos = right(m); }
  s.sg = sgPos;
  return s;
}

// ---------- overlays ----------
function overlay(b, s, kind, h) { b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: h } }); scrimOver(b, s.root, W[kind], h); }
function dialog(b, s, kind, h, size, title, text, cancel, ok, body, type = "Default") {
  overlay(b, s, kind, h);
  const v = b.v("Dialog", `Type=${type}, Size=${size}`), dw = { sm: 400, md: 560 }[size];
  const id = b.instV(s.root, "Dialog", `Type=${type}, Size=${size}`, { texts: { 0: title, 1: text }, props: { absolute: true, x: Math.round((W[kind] - dw) / 2), y: 240 } });
  const bt = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: cancel } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: ok } });
  if (body) body(id + v.names.Body);
  return id;
}
function markSentFields(b, body, Wd, phone, again) {
  const f = b.frame(body, { name: "Fields", w: Wd, h: 200, layout: "v", gap: 14, sizeH: "fill", sizeV: "hug" });
  const sz = phone ? "touch" : "md";
  const r = b.frame(f, { name: "Row", w: Wd, h: 70, layout: phone ? "v" : "h", gap: 12, sizeH: "fill", sizeV: "hug" });
  b.instV(r, "Date field", `State=Filled, Size=${sz}`, { texts: { Label: "Date sent *", Value: "3 Nov 2026" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(r, "Text field", `State=Filled, Size=${sz}`, { texts: { Label: "Recipient *", Value: "Budi Santoso", Helper: "Pre-filled from the job order contact." }, setProps: { "Show helper": true }, props: { sizingH: "fill" } });
  const ch = b.frame(f, { name: "Channel", w: Wd, h: 60, layout: "v", gap: 6, sizeH: "fill", sizeV: "hug" });
  txt(b, ch, "Channel * (tick every way it was sent)", "Body small/SemiBold", "Text/text-secondary", "Field label");
  const cb = b.frame(ch, { name: "Channel options", w: Wd, h: 24, layout: "h", gap: 20, wrap: true, cross: "center", sizeH: "fill", sizeV: "hug" });
  ["Hard copy", "Email", "WhatsApp", "Other"].forEach((l) => b.instV(cb, "Checkbox", `Checked=${l === "WhatsApp" ? "On" : "Off"}, State=Default`, { texts: { Label: l } }));
  b.instV(f, "Text field", `State=Default, Size=${sz}`, { texts: { Label: "Note (optional)", Value: "e.g. courier receipt no." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
}
const SIGNERS = [["Ir. Bambang Sutrisno, M.T.", "Laboratory Manager"], ["Dr. Ratna Dewi", "Quality Manager"], ["Hendra Wijaya, S.T.", "Technical Supervisor"]];
function signatoryPanel(b, s) {
  const p = b.frame(s.root, { name: "Signatory dropdown", w: 346, h: 200, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, layout: "v", gap: 2, pad: [8, 8, 8, 8], sizeH: "fixed", sizeV: "hug", absolute: true, x: 1046, y: 886 });
  b.raw("style.apply", { ids: [p], style: "Elevation/md" });
  SIGNERS.forEach(([n, d], i) => b.instV(p, "Option row", `State=${i === 0 ? "Selected" : "Default"}`, { texts: { Name: n, Detail: d }, props: { sizingH: "fill" } }));
  b.instV(p, "Button", "Type=Tertiary, Tone=Default, Size=lg, State=Default", { texts: { Label: "Type manually" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("pencil-simple") } });
  return p;
}

// ---------- build ----------
exports.build = (b) => {
  clearL(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "L  Reports"); });
  const d = Y.desktop, t = Y.tablet, p = Y.phone, DX = 1560, TX = 954, PX = 510, RY = 2300, HH = 1018;
  const D = (n) => [DX * (n % 4), d + RY * Math.floor(n / 4)];
  // ---- 01 Reports_list
  reportsList(b, ...D(0), "desktop", { vv: "01", variant: "CoA_tab", role: "Lab", tab: "coa", tabs: true });
  reportsList(b, ...D(1), "desktop", { vv: "02", variant: "RoA_tab", role: "Lab", tab: "roa", tabs: true });
  reportsList(b, ...D(2), "desktop", { vv: "03", variant: "CSO", role: "CSO", tab: "coa" });
  reportsList(b, ...D(3), "desktop", { vv: "04", variant: "Analyst", role: "Analyst", tab: "roa" });
  reportsList(b, ...D(4), "desktop", { vv: "05", variant: "Multi_select", role: "CSO", tab: "coa", sel: 2 });
  reportsList(b, ...D(5), "desktop", { vv: "06", variant: "Empty", role: "Lab", empty: true });
  reportsList(b, ...D(6), "desktop", { vv: "07", variant: "No_results", role: "Lab", tab: "coa", tabs: true, noResults: true });
  // ---- 02 CoA
  reportPage(b, ...D(8), "desktop", { vv: "01", variant: "Draft", role: "Lab", kind: "coa", state: "draft", jo: "JO-2026-0132", client: "CV Sumber Batu Hitam", ref: "SBH-077" });
  { const s = reportPage(b, ...D(9), "desktop", { vv: "02", variant: "Draft_signatory", role: "Lab", kind: "coa", state: "draft", jo: "JO-2026-0132", client: "CV Sumber Batu Hitam", ref: "SBH-077" }); signatoryPanel(b, s); }
  { const s = reportPage(b, ...D(10), "desktop", { vv: "03", variant: "Publish_confirm", role: "Lab", kind: "coa", state: "draft", jo: "JO-2026-0132", client: "CV Sumber Batu Hitam", ref: "SBH-077" }); dialog(b, s, "desktop", HH, "md", "Publish CoA for JO-2026-0132?", "It gets the number CoA-JO-2026-0132-1 and can no longer be edited. To change it later, revise it.", "Cancel", "Publish", null); }
  reportPage(b, ...D(11), "desktop", { vv: "04", variant: "Published", role: "Lab", kind: "coa", state: "published" });
  { const s = reportPage(b, ...D(12), "desktop", { vv: "05", variant: "Mark_sent", role: "CSO", kind: "coa", state: "published" }); dialog(b, s, "desktop", HH, "md", "Mark CoA as sent", "CoA-JO-2026-0142-1 for PT Bukit Asam Tbk.", "Cancel", "Confirm", (bd) => markSentFields(b, bd, 512, false)); }
  reportPage(b, ...D(13), "desktop", { vv: "06", variant: "Sent", role: "CSO", kind: "coa", state: "sent" });
  { const s = reportPage(b, ...D(14), "desktop", { vv: "07", variant: "Revise", role: "Lab", kind: "coa", state: "published" }); dialog(b, s, "desktop", HH, "md", "Revise CoA-JO-2026-0142-1?", "Revision 1 stays current until revision 2 is published. Revision 2 starts as a draft with the same contents.", "Cancel", "Create revision", (bd) => b.instV(bd, "Textarea", "State=Default, Size=md", { texts: { Label: "Reason *", Value: "e.g. Wrong client reference" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } })); }
  reportPage(b, ...D(15), "desktop", { vv: "08", variant: "Superseded", role: "Lab", kind: "coa", state: "superseded", number: "CoA-JO-2026-0131-1", jo: "JO-2026-0131", client: "PT Bara Nusantara Mandiri", ref: "BNM-318", pub: "28 Oct 2026" });
  { const s = reportPage(b, ...D(16), "desktop", { vv: "09", variant: "Void_confirm", role: "Superadmin", kind: "coa", state: "published" }); dialog(b, s, "desktop", HH, "md", "Void CoA-JO-2026-0142-1?", "The number is never reused. Anyone who downloaded this certificate should be told it is void.", "Keep CoA", "Void CoA", (bd) => b.instV(bd, "Textarea", "State=Default, Size=md", { texts: { Label: "Reason *", Value: "e.g. Issued for the wrong job order" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }), "Destructive"); }
  // ---- 03 RoA
  reportPage(b, ...D(17), "desktop", { vv: "01", variant: "Default", role: "Lab", kind: "roa", state: "published" });
  reportPage(b, ...D(18), "desktop", { vv: "02", variant: "Analyst", role: "Analyst", kind: "roa", state: "published" });
  // ---- tablet
  reportsList(b, 0, t, "tablet", { vv: "01", variant: "CoA_tab", role: "Lab", tab: "coa", tabs: true });
  reportPage(b, TX, t, "tablet", { vv: "01", variant: "Draft", role: "Lab", kind: "coa", state: "draft", jo: "JO-2026-0132", client: "CV Sumber Batu Hitam", ref: "SBH-077" });
  reportPage(b, TX * 2, t, "tablet", { vv: "04", variant: "Published", role: "Lab", kind: "coa", state: "published" });
  // ---- phone
  reportsList(b, 0, p, "phone", { vv: "01", variant: "CoA_tab", role: "Lab", tab: "coa", tabs: true });
  { const s = reportsList(b, PX, p, "phone", { vv: "08", variant: "Filters", role: "Lab", tab: "coa", tabs: true }); const HP = 1100; overlay(b, s, "phone", HP); const v = b.v("Bottom sheet"); const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: "Filters" }, props: { absolute: true, x: 0, y: HP - 520, width: 390 } }); const bt = v.insts.filter((i) => i.name === "Button"); b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: "Clear all" } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: "Apply" } }); b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug", fill: "none", mainAlign: "min", gap: 14 } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } }); const bd = id + v.names.Body; [["Period", "Last 90 days"], ["Company", "All companies"], ["Status", "All"]].forEach(([l, val]) => b.instV(bd, "Select", "State=Filled, Size=touch", { texts: { Label: l, Value: val }, setProps: { "Show helper": false }, props: { sizingH: "fill" } })); }
  { const s = reportPage(b, PX * 2, p, "phone", { vv: "01", variant: "Draft", role: "Lab", kind: "coa", state: "draft", jo: "JO-2026-0132", client: "CV Sumber Batu Hitam", ref: "SBH-077" }); phoneBar(b, s, "Preview PDF", "Publish"); }
  { const s = reportPage(b, PX * 3, p, "phone", { vv: "04", variant: "Published", role: "CSO", kind: "coa", state: "published" }); phoneBar(b, s, "Download", "Mark sent"); }
  { const s = reportPage(b, 0, p + 3300, "phone", { vv: "01", variant: "Default", role: "Lab", kind: "roa", state: "published" }); phoneBar(b, s, "Print", "Download"); }
  b.lEnd = { desktop: d + RY * 5 + 400, tablet: t + 2800, phone: p + 3300 + 2000 };
};
function phoneBar(b, s, left, right) {
  const bar = b.instV(s.root, "Sticky action bar", "Breakpoint=Mobile", { texts: { Note: "", 0: left }, props: { sizingH: "fill" } });
  const v = b.v("Sticky action bar", "Breakpoint=Mobile");
  b.raw("node.set", { ids: [bar + v.texts[1].pos], props: { characters: left } }); b.raw("node.set", { ids: [bar + v.texts[2].pos], props: { characters: right } });
  b.raw("node.set", { ids: [bar + v.names.Note], props: { visible: false } });
}
exports.U = { icon, txt, hframe, vframe, btn, iconBtn, cardTop, pill, avatar, badge, CLIENT, dialog, overlay, KIND, W, CW };
