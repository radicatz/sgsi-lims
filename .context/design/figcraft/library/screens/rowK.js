// Row K · Master data (modules 09 Clients, 10 Drill_hole, 11 Lithology, 12 Seam). Plan: .context/docs/Master Data/Master_Data_Screen_Plan.md
// Run after row J: build-screens.js C,D,E,G,F,H,I,J,K. Frames are created under their final names.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver } = H;

const K_NAMES = /^(Desktop|Tablet|Phone)-(09-Clients|10-Drill_hole|11-Lithology|12-Seam)-/;
const isK = (n) => K_NAMES.test(n.name || "") || (n.name === "Row title" && /^K( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isK(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.jEnd ? b.jEnd[k] : 0); }
  return out;
}
const clearK = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isK(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const W = { desktop: 1440, tablet: 834, phone: 390 }, CW = { desktop: 1128, tablet: 698, phone: 358 };
const LOGO = "C:/Users/pc/AppData/Local/Temp/claude/1587ada5b64dc4a0/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad/logos/ptba-mark.png";
const icon = (b, parent, glyph, tok = "Text/text-muted", size = 14) => { const ic = b.instV(parent, "Icon", `Glyph=${glyph}, Size=${size}`); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const txt = (b, parent, t, style, color, name, o = {}) => b.text(parent, t, { style, color, name: name || t, ...o });
const hframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "h", gap, cross: o.cross || "center", main: o.main, wrap: o.wrap, pad: o.pad, sizeH: o.sizeH || "hug", sizeV: o.sizeV || "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw, clip: o.clip });
const vframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "v", gap, pad: o.pad, cross: o.cross, sizeH: o.sizeH || "fill", sizeV: "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });
const btn = (b, parent, type, label, glyph, o = {}) => b.instV(parent, "Button", `Type=${type}, Tone=${o.tone || "Default"}, Size=${o.size || "md"}, State=Default`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false }, props: o.fill ? { sizingH: "fill" } : undefined });
const cardTop = (b, c, title) => { const hd = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" }); txt(b, hd, title, "Heading/H3", "Text/heading", "Title"); return hd; };
const OVERLINE = { clients: "CLIENTS", drill: "DRILL HOLE", lith: "LITHOLOGY", seam: "SEAM" };

// ---------- demo data ----------
const CLIENTS = [
  ["PT Bukit Asam Tbk", "PTBA", "BA", true, "Tanjung Enim, Lahat", "Active", "1,783", "30 Jan 2026"],
  ["PT Bara Nusantara Mandiri", "BNM", "BN", false, "Samarinda, Kalimantan Timur", "Active", "642", "12 Feb 2026"],
  ["PT Kaltara Energi Prima", "KEP", "KE", false, "Tanjung Selor, Kalimantan Utara", "Active", "418", "3 Mar 2026"],
  ["PT Mahakam Coal Resources", "MCR", "MC", false, "Balikpapan, Kalimantan Timur", "Active", "377", "21 Mar 2026"],
  ["CV Sumber Batu Hitam", "SBH", "SB", false, "Muara Enim, Sumatera Selatan", "Active", "296", "8 Apr 2026"],
  ["PT Borneo Karya Energi", "BKE", "BK", false, "Banjarmasin, Kalimantan Selatan", "Active", "214", "17 Jun 2026"],
  ["PT Tambang Sentosa Abadi", "TSA", "TS", false, "Sawahlunto, Sumatera Barat", "Inactive", "58", "2 Sep 2026"],
];
const DOMAIN = { PTBA: "bukitasam.co.id", BNM: "baranusantara.co.id", KEP: "kaltaraenergi.co.id", MCR: "mahakamcoal.co.id", SBH: "sumberbatuhitam.co.id", BKE: "borneokarya.co.id", TSA: "tambangsentosa.co.id" };
const CONTACTS = [
  ["Budi Santoso", "Site Geologist", "budi", "+62 812 5551 0142", true],
  ["Rina Ayu Lestari", "Purchasing", "rina", "+62 813 5552 0177", false],
  ["Agus Pratama", "QA Manager", "agus", "+62 811 5553 0120", false],
  ["Sari Wulandari", "Finance", "sari", "+62 812 5554 0166", false],
];
const COMP = { BNM: "PT Bara Nusantara Mandiri", MCR: "PT Mahakam Coal Resources", KEP: "PT Kaltara Energi Prima", SBH: "CV Sumber Batu Hitam", BKA: "PT Bukit Asam Tbk" };
const DRILL = [
  ["DH-BNM-021", "Batch 5", "19", "BNM", "CoA-BNM-021.pdf", "2 Nov 2026", "1.4 MB"], ["DH-BNM-022", "Batch 5", "32", "BNM", "CoA-BNM-022.pdf", "2 Nov 2026", "1.2 MB"],
  ["DH-BNM-031", "Batch 7", "0", "BNM", ""], ["DH-MCR-011", "Batch 6", "14", "MCR", "CoA-MCR-011.pdf", "30 Oct 2026", "1.1 MB"],
  ["DH-MCR-012", "Batch 6", "12", "MCR", ""], ["DH-MCR-013", "Batch 6", "8", "MCR", ""],
  ["DH-KEP-031", "Batch 8", "16", "KEP", "CoA-KEP-031.pdf", "1 Nov 2026", "0.9 MB"], ["DH-KEP-032", "Batch 8", "11", "KEP", ""],
  ["DH-SBH-040", "Batch 9", "6", "SBH", ""], ["DH-SBH-041", "Batch 9", "5", "SBH", "CoA-SBH-041.pdf", "30 Oct 2026", "1.0 MB"],
  ["DH-BKA-007", "Batch 4", "36", "BKA", "CoA-BKA-007.pdf", "28 Oct 2026", "1.6 MB"], ["DH-BKA-008", "Batch 4", "14", "BKA", "CoA-BKA-008.pdf", "28 Oct 2026", "1.3 MB"],
];
const LITH = [["Losscoal", "No lithology", "8", "BKA"], ["Coaly Claystone", "Parting", "24", "BKA"], ["Coreloss", "No lithology", "21", "BNM"], ["Siltstone", "Parting", "32", "BNM"], ["Sandstone", "Parting", "12", "MCR"], ["Silicified Coal", "Parting", "90", "KEP"], ["Carbonaceous Claystone", "Parting", "50", "KEP"], ["Claystone", "Parting", "141", "SBH"], ["Coal", "Coal", "1,759", "BKA"]];
const SEAM = [["1", "CO", "Coal seam, outcrop", "BKA", "212"], ["2", "B1U3", "Seam B1, upper 3", "BKA", "94"], ["3", "EN2", "", "BNM", "61"], ["4", "EN1", "", "BNM", "48"], ["5", "E", "", "MCR", "33"], ["6", "A2L", "Seam A2, lower", "KEP", "77"], ["7", "A2U2", "Seam A2, upper 2", "KEP", "58"], ["8", "SM2", "", "SBH", "19"], ["9", "SM1", "", "SBH", "27"], ["10", "X10", "", "BKA", "6"]];

// ---------- small parts ----------
const pill = (b, parent, label, bg, fg, dot) => { const p = hframe(b, parent, "Pill", 6, { fill: bg, r: 12, pad: [3, 10, 3, 10] }); if (dot) b.frame(p, { name: "Dot", w: 6, h: 6, fill: fg, r: 3, sizeH: "fixed", sizeV: "fixed" }); txt(b, p, label, "Caption/SemiBold", fg, "Label"); return p; };
const statusPill = (b, parent, s) => (s === "Active" ? pill(b, parent, "Active", "Feedback/success-100", "Feedback/success", true) : pill(b, parent, "Inactive", "Surface/muted", "Text/text-muted", true));
const KINDS = { Coal: ["Primary/primary-100", "Primary/primary"], Parting: ["Accent/accent-100", "Accent/accent-text"], "No lithology": ["Surface/muted", "Text/text-muted"] };
const kindPill = (b, parent, k) => pill(b, parent, k, KINDS[k][0], KINDS[k][1], false);
function avatar(b, parent, c, size = 40) {
  if (c[3]) { const f = b.frame(parent, { name: "Logo", w: size, h: size, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: Math.round(size / 4), sizeH: "fixed", sizeV: "fixed", clip: true }); b.raw("image.place", { path: LOGO, target: f, mode: "fit" }); return f; }
  if (size === 40) return b.instV(parent, "Avatar", "Size=40", { texts: { Initials: c[2] } });
  const f = b.frame(parent, { name: "Initials avatar", w: size, h: size, fill: "Accent/accent-100", r: Math.round(size / 4), layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, f, c[2], "Heading/H2", "Accent/accent-text", "Initials"); return f;
}
const editLink = (b, parent) => b.instV(parent, "Link button", "State=Default", { texts: { Label: "Edit" }, hide: ["Icon"] });
const menu = (b, parent) => b.instV(parent, "Icon button", "Type=Ghost, Size=32, State=Default", { swaps: [[0, "Icon", "Glyph=dots-three, Size=14"]] });
const rowsPerPage = (b, parent) => { const g = hframe(b, parent, "Rows per page", 8); txt(b, g, "Rows per page", "Caption/Regular", "Text/text-muted", "Label"); const s = hframe(b, g, "Select", 6, { stroke: "Surface/border-strong", sw: 1, r: 8, pad: [4, 10, 4, 10], fill: "Surface/card" }); txt(b, s, "25", "Body small/Medium", "Text/foreground", "Value"); icon(b, s, "caret-down", "Text/text-muted", 14); return g; };

// ---------- list frames ----------
// o: { module, screen, vv, variant, role, active, key, title, add, imp, search, company, chips, cols, rows, cell, empty, readOnly, phone, total }
function header(b, main, kind, o) {
  const r = hframe(b, main, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "max" });
  const t = vframe(b, r, "Title block", 4, { sizeH: kind === "desktop" ? "hug" : "fill" });
  txt(b, t, OVERLINE[o.key], "Overline", "Text/text-muted", "Overline"); txt(b, t, o.title, kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (!o.readOnly) { const a = hframe(b, r, "Actions", 8); if (o.imp && kind !== "phone") btn(b, a, "Secondary", "Import", "upload-simple"); btn(b, a, "Primary", o.add, "plus", { size: kind === "phone" ? "sm" : "md" }); }
}
function toolbar(b, main, kind, o) {
  const f = b.frame(main, { name: "Filters", w: CW[kind], h: 44, layout: "h", gap: 12, wrap: kind === "tablet", cross: "max", sizeH: "fill", sizeV: "hug" });
  b.instV(f, "Search", `Size=${kind === "phone" ? "lg" : "md"}, State=Default`, { texts: { Value: o.search }, props: kind === "desktop" ? { width: 320 } : { sizingH: "fill" }, hide: ["Scan"] });
  if (kind === "phone") { btn(b, f, "Secondary", "Filters", "funnel", { size: "touch" }); return; }
  if (o.company) b.instV(f, "Select", "State=Filled, Size=md", { texts: { Label: "Company", Value: "All companies" }, setProps: { "Show helper": false }, props: { width: 220, sizingH: "fixed" } });
  const ch = hframe(b, f, "Chips", 8, { wrap: kind === "tablet" }); o.chips.forEach(([l, n, on]) => b.instV(ch, "Filter chip", `Selected=${on ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: n } }));
  if (o.reset) btn(b, f, "Ghost", "Reset", null);
}
function table(b, main, kind, o) {
  const c = card(b, main, "Table card");
  const cols = o.cols[kind];
  const t = vframe(b, c, "Table", 0);
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", gap: 4, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (h) { txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); if (o.sortable !== false) icon(b, f, "arrows-down-up", "Text/text-muted", 14); } });
  o.rows.forEach((row) => {
    const r = vframe(b, t, "Row", 0);
    const line = b.frame(r, { name: "Cells", w: 800, h: 56, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    cols.forEach(([h, w], i) => { const f = b.frame(line, { name: "Cell", w: w || 120, h: 56, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); o.cell(b, f, h, row, kind); });
    b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
  const foot = hframe(b, c, "Footer", 16, { sizeH: "fill", main: "spaceBetween" });
  rowsPerPage(b, foot);
  b.instV(foot, "Pager", "Breakpoint=Desktop", { texts: { Summary: o.summary || `Showing 1–${o.rows.length} of ${o.total}` }, props: { sizingH: "fill" } });
  return c;
}
function cards(b, main, o) {
  const list = vframe(b, main, "Cards", 10);
  o.rows.forEach((row) => { const c = vframe(b, list, "Item card", 8, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: [16, 16, 16, 16] }); o.phone(b, c, row); });
  b.instV(main, "Pager", "Breakpoint=Mobile", { texts: { Page: "1 / " + Math.ceil(o.total / 25) }, props: { sizingH: "fill" } });
}
function listFrame(b, x, y, kind, o) {
  page(b, kind);
  const name = `${KIND(kind)}-${o.module}-${o.screen}-${o.vv}-${o.variant}`;
  const s = b.shell({ name, x, y, kind, active: o.active, role: o.role });
  header(b, s.main, kind, o);
  if (o.empty) { b.instV(s.main, "Empty state", "Size=Page", { texts: o.empty, props: { sizingH: "fill" } }); return s; }
  toolbar(b, s.main, kind, o);
  if (kind === "phone") cards(b, s.main, o); else table(b, s.main, kind, o);
  return s;
}

// ---------- overlays ----------
function overlay(b, s, kind, h) { b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: h } }); scrimOver(b, s.root, W[kind], h); }
// Forms are centered dialogs (owner, Nov 5, 2026): Dialog lg or md, width and estimated height by title, no description line
const MODAL = { "Add client": [792, "lg", 780], "Edit client": [792, "lg", 780], "Edit contact": [560, "md", 540], "Add drill hole": [560, "md", 430], "CoA history": [666, "lg", 640], "Edit lithology": [560, "md", 620], "Add seam": [560, "md", 540] };
function sheet(b, s, kind, h, title, ok, body, cancel = "Cancel") {
  overlay(b, s, kind, h);
  const [w, size, eh] = MODAL[title];
  const v = b.v("Dialog", `Type=Default, Size=${size}`);
  const id = b.instV(s.root, "Dialog", `Type=Default, Size=${size}`, { texts: { 0: title }, props: { absolute: true, x: Math.round((W[kind] - w) / 2), y: Math.max(40, Math.round((h - eh) / 2)), width: w, sizingH: "fixed" } });
  b.raw("node.set", { ids: [id + v.names.Text], props: { visible: false } });
  const bt = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: cancel } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: ok } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { gap: 16 } });
  body(id + v.names.Body, id);
  return id;
}
function dialog(b, s, kind, h, size, title, text, cancel, ok, body, type = "Default") {
  overlay(b, s, kind, h);
  const v = b.v("Dialog", `Type=${type}, Size=${size}`), dw = { sm: 400, md: 560 }[size];
  const id = b.instV(s.root, "Dialog", `Type=${type}, Size=${size}`, { texts: { 0: title, 1: text }, props: { absolute: true, x: Math.round((W[kind] - dw) / 2), y: 240 } });
  const bt = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: cancel } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: ok } });
  if (body) body(id + v.names.Body);
  return id;
}
const field = (b, parent, label, value, o = {}) => b.instV(parent, o.area ? "Textarea" : "Text field", `State=${value ? "Filled" : "Default"}, Size=${o.touch ? "touch" : "md"}`, { texts: { Label: label, Value: value || o.ph || "" }, setProps: { "Show helper": !!o.helper }, props: { sizingH: "fill" } });
const select = (b, parent, label, value, o = {}) => b.instV(parent, "Select", `State=Filled, Size=${o.touch ? "touch" : "md"}`, { texts: { Label: label, Value: value }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
const radio = (b, parent, label, on) => b.instV(parent, "Radio", `Selected=${on ? "On" : "Off"}, State=Default`, { texts: { Label: label } });

// ---------- Clients ----------
const clientCols = { desktop: [["Client", 0], ["Code", 100], ["Address", 250], ["Status", 110], ["Total sample", 120], ["Created", 120], ["", 110]], tablet: [["Client", 0], ["Status", 100], ["Total sample", 110], ["", 100]] };
function clientCell(b, f, h, c, kind) {
  if (h === "Client") { avatar(b, f, c); txt(b, f, c[0], "Body small/SemiBold", "Text/heading", "Name"); }
  if (h === "Code") txt(b, f, c[1], "Data", "Text/text-secondary", "Code");
  if (h === "Address") txt(b, f, c[4], "Body small/Regular", "Text/foreground", "Address");
  if (h === "Status") statusPill(b, f, c[5]);
  if (h === "Total sample") txt(b, f, c[6], "Body small/Regular", "Text/foreground", "Total sample");
  if (h === "Created") txt(b, f, c[7], "Body small/Regular", "Text/text-secondary", "Created");
  if (h === "") { editLink(b, f); menu(b, f); }
}
const clientPhone = (b, c, row) => { const top = hframe(b, c, "Top", 10, { sizeH: "fill" }); avatar(b, top, row); const t = vframe(b, top, "Text", 2); txt(b, t, row[0], "Body small/SemiBold", "Text/heading", "Name"); txt(b, t, row[4], "Caption/Regular", "Text/text-secondary", "Address"); statusPill(b, top, row[5]); const m = hframe(b, c, "Meta", 12, { sizeH: "fill" }); txt(b, m, row[1], "Data", "Text/text-secondary", "Code"); txt(b, m, row[6] + " samples", "Body small/Regular", "Text/text-secondary", "Samples"); };
const CL = (kind, o = {}) => ({ module: "09-Clients", screen: "01-Clients_list", key: "clients", title: "Clients", add: "Add client", role: "CSO", active: "Clients", search: "Search client name or code", chips: [["All", "7", 1], ["Active", "6", 0], ["Inactive", "1", 0], ["Archived", "2", 0]], cols: clientCols, rows: CLIENTS, cell: clientCell, phone: clientPhone, total: 7, summary: "Showing 1–7 of 7", ...o });

function clientFormBody(b, bd, kind, o = {}) {
  const t = !!o.touch;
  // logo slot: a 100 x 100 drop zone, or the uploaded logo with its file name and Remove
  if (o.logo) { const f = hframe(b, bd, "Logo file", 16, { sizeH: "fill" }); const tile = avatar(b, f, CLIENTS[0], 100); const t2 = vframe(b, f, "Text", 4, { sizeH: "hug" }); txt(b, t2, "bukit-asam-logo.png", "Body small/SemiBold", "Text/heading", "File"); txt(b, t2, "960 × 270, 48 KB", "Caption/Regular", "Text/text-muted", "Meta"); btn(b, t2, "Ghost", "Remove", "trash", { size: "sm" }); }
  else { const dz = b.instV(bd, "Drop zone", "State=Default", { texts: { Title: "Drop or click to add logo" }, hide: ["Hint"], props: { width: 100, height: 100, sizingH: "fixed", sizingV: "fixed", cornerRadius: 1000 } }); }
  field(b, bd, "Name *", o.name || "", { touch: t, ph: "Client name" });
  const r = hframe(b, bd, "Row", 12, { sizeH: "fill", cross: "min" }); field(b, r, "Code *", o.code || "", { touch: t, ph: "Short, unique, e.g. BNM", helper: false });
  select(b, r, "Status", "Active", { touch: t });
  field(b, bd, "Address", o.address || "", { area: true, touch: t, ph: "Street, city, province" });
  const bl = vframe(b, bd, "Billing address", 6); txt(b, bl, "Billing address", "Caption/Medium", "Text/text-secondary", "Label");
  b.instV(bl, "Checkbox", "Checked=On, State=Default", { texts: { Label: "Same as address" } });
  b.instV(bl, "Textarea", `State=${o.billing ? "Filled" : "Default"}, Size=${t ? "touch" : "md"}`, { texts: { Value: o.billing || "Street, city, province" }, hide: ["Label"], setProps: { "Show helper": false }, props: { sizingH: "fill" } });
}
function contactFormBody(b, bd) {
  field(b, bd, "Name *", "Sari Wulandari"); field(b, bd, "Position", "Finance"); field(b, bd, "Email", "sari"); field(b, bd, "Phone", "+62 812 5554 0166");
  b.instV(bd, "Switch", "On=Off, State=Default", { texts: { Label: "Default contact (pre-fills Attention on new job orders)" } });
}

function clientDetail(b, x, y, kind, o = {}) {
  page(b, kind);
  const c0 = o.client || CLIENTS[1];
  const name = `${KIND(kind)}-09-Clients-02-Client_detail-${o.vv}-${o.variant}`;
  const s = b.shell({ name, x, y, kind, active: "Clients", role: "CSO" });
  const m = s.main;
  b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Clients", 1: c0[0] } });
  const h = hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center" });
  const l = hframe(b, h, "Identity", 16, kind === "phone" ? { sizeH: "fill" } : {});
  avatar(b, l, c0, 56);
  const t = vframe(b, l, "Text", 6, { sizeH: kind === "phone" ? "fill" : "hug" }); const ti = txt(b, t, c0[0], kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title"); if (kind === "phone") b.raw("node.set", { ids: [ti], props: { sizingH: "fill", textAutoResize: "height" } });
  const tg = hframe(b, t, "Tags", 8); pill(b, tg, c0[1], "Surface/muted", "Text/text-secondary", false); statusPill(b, tg, c0[5]);
  if (kind !== "phone") btn(b, h, "Secondary", "Edit", "pencil-simple");
  const cols = kind === "desktop" ? b.frame(m, { name: "Columns", w: 1128, h: 600, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }) : null;
  // properties
  const pc = card(b, cols || m, "Properties card"); if (cols) b.raw("node.set", { ids: [pc], props: { width: 360, sizingH: "fixed" } });
  cardTop(b, pc, "Properties");
  const kv = (k, v, link) => b.instV(pc, "Key-value row", "Layout=Inline", { texts: { Key: k, Value: v }, fills: link ? { Value: "Primary/primary" } : undefined, props: { sizingH: "fill" } });
  kv("Code", c0[1]); kv("Address", c0[4]); kv("Billing address", "Jl. Jenderal Sudirman 45, Jakarta Selatan"); kv("Status", c0[5]); kv("Created", c0[7]); kv("Job orders", o.jobs || "14 job orders", true); kv("Total sample", c0[6]);
  // right column
  const right = cols ? vframe(b, cols, "Right column", 20) : m;
  const cc = card(b, right, "Contacts card");
  const ch = cardTop(b, cc, "Contacts"); btn(b, ch, "Secondary", "Add contact", "plus", { size: "sm" });
  if (kind === "phone") {
    CONTACTS.slice(0, 3).forEach((c) => { const it = vframe(b, cc, "Contact", 4, { fill: "Surface/muted", r: 12, pad: [12, 12, 12, 12] }); const top = hframe(b, it, "Top", 6, { sizeH: "fill", main: "spaceBetween" }); const nm = hframe(b, top, "Name", 6); txt(b, nm, c[0], "Body small/SemiBold", "Text/heading", "Name"); if (c[4]) pill(b, it, "Default", "Feedback/warning-100", "Feedback/warning", false); menu(b, top); txt(b, it, c[1], "Caption/Regular", "Text/text-secondary", "Position"); const ac = hframe(b, it, "Actions", 8); icon(b, ac, "envelope-simple", "Primary/primary", 14); txt(b, ac, c[2] + "@" + DOMAIN[c0[1]], "Caption/Regular", "Primary/primary", "Email"); txt(b, it, c[3], "Caption/Regular", "Text/foreground", "Phone"); });
  } else {
    const cw = kind === "desktop" ? [["Name", 190], ["Position", 120], ["Email", 0], ["Phone", 140], ["", 48]] : [["Name", 190], ["Position", 130], ["Email", 0], ["", 48]];
    const t2 = vframe(b, cc, "Table", 0);
    const head = b.frame(t2, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    cw.forEach(([hh, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (hh) txt(b, f, hh, "Caption/SemiBold", "Text/text-secondary", "Head label"); });
    CONTACTS.forEach((c) => {
      const r = vframe(b, t2, "Row", 0); const line = b.frame(r, { name: "Cells", w: 800, h: 52, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
      cw.forEach(([hh, w]) => { const f = b.frame(line, { name: "Cell", w: w || 120, h: 52, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" });
        if (hh === "Name") { txt(b, f, c[0], "Body small/SemiBold", "Text/heading", "Name"); if (c[4]) pill(b, f, "Default", "Feedback/warning-100", "Feedback/warning", false); }
        if (hh === "Position") txt(b, f, c[1], "Body small/Regular", "Text/text-secondary", "Position");
        if (hh === "Email") txt(b, f, c[2] + "@" + DOMAIN[c0[1]], "Body small/Regular", "Primary/primary", "Email");
        if (hh === "Phone") txt(b, f, c[3], "Body small/Regular", "Text/foreground", "Phone");
        if (hh === "") menu(b, f); });
      b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    });
  }
  const mc = card(b, right, "Master data card"); cardTop(b, mc, "Master data");
  const row = b.frame(mc, { name: "Stats", w: 400, h: 90, layout: "h", gap: 12, wrap: kind === "phone", sizeH: "fill", sizeV: "hug" });
  [["Drill holes", "32"], ["Lithologies", "9"], ["Seams", "21"]].forEach(([l, n]) => { const st = vframe(b, row, "Stat", 4, { fill: "Surface/muted", r: 12, pad: [12, 14, 12, 14] }); txt(b, st, l, "Caption/Regular", "Text/text-secondary", "Label"); txt(b, st, n, "Heading/H2", "Text/heading", "Count"); const lk = hframe(b, st, "Link", 4); txt(b, lk, "View list", "Body small/Medium", "Primary/primary", "Link"); icon(b, lk, "arrow-right", "Primary/primary", 14); });
  return s;
}

// ---------- phone full-screen form ----------
function phoneForm(b, x, y, name, active, role, crumb, title, bodyFn, ok) {
  page(b, "phone");
  const s = b.shell({ name, x, y, kind: "phone", active, role });
  b.instV(s.main, "Breadcrumb", "Levels=2", { texts: { 0: crumb, 1: title } });
  txt(b, s.main, title, "Heading/H1", "Text/heading", "Title");
  const bd = vframe(b, s.main, "Form", 14); bodyFn(bd);
  const bar = b.instV(s.main, "Sticky action bar", "Breakpoint=Mobile", { texts: { Note: "", 0: "Cancel", 1: ok }, props: { sizingH: "fill" } });
  return s;
}

// ---------- Drill hole ----------
const dcols = { desktop: [["Code", 140], ["Description", 120], ["Total sample", 110], ["Company", 0], ["CoA", 250], ["", 110]], tablet: [["Code", 130], ["Total sample", 100], ["CoA", 0], ["", 100]] };
function drillCell(readOnly) {
  return (b, f, h, d) => {
    if (h === "Code") txt(b, f, d[0], "Data/Strong", "Text/heading", "Code");
    if (h === "Description") txt(b, f, d[1], "Body small/Regular", "Text/text-secondary", "Description");
    if (h === "Total sample") txt(b, f, d[2], "Body small/Regular", "Text/foreground", "Total sample");
    if (h === "Company") txt(b, f, COMP[d[3]], "Body small/Regular", "Text/foreground", "Company");
    if (h === "CoA") { if (d[4]) { b.instV(f, "Tag", "Type=CoA uploaded"); txt(b, f, d[4], "Caption/Regular", "Text/text-secondary", "File"); } else { b.instV(f, "Tag", "Type=CoA missing"); if (!readOnly) btn(b, f, "Secondary", "Upload CoA", "upload-simple", { size: "sm" }); } }
    if (h === "" && !readOnly) { editLink(b, f); menu(b, f); }
  };
}
const drillPhone = (readOnly) => (b, c, d) => { const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, top, d[0], "Data/Strong", "Text/heading", "Code"); b.instV(top, "Tag", d[4] ? "Type=CoA uploaded" : "Type=CoA missing"); txt(b, c, COMP[d[3]], "Caption/Regular", "Text/text-secondary", "Company"); const m = hframe(b, c, "Meta", 12, { sizeH: "fill" }); txt(b, m, d[1], "Body small/Regular", "Text/text-secondary", "Description"); txt(b, m, d[2] + " samples", "Body small/Regular", "Text/text-secondary", "Samples"); if (!d[4] && !readOnly) btn(b, c, "Secondary", "Upload CoA", "upload-simple", { size: "touch", fill: true }); };
const DL = (o = {}) => ({ module: "10-Drill_hole", screen: "01-Drill_hole_list", key: "drill", title: "Drill hole", add: "Add drill hole", imp: true, role: "Lab", active: "Drill hole", search: "Search code or description", company: true, chips: [["All", "100", 1], ["Missing CoA", "12", 0], ["Archived", "3", 0]], cols: dcols, rows: DRILL, cell: drillCell(false), phone: drillPhone(false), total: 100, summary: "Showing 1–25 of 100", ...o });
function drillForm(b, bd, touch) { field(b, bd, "Code *", "DH-BNM-023", { touch }); field(b, bd, "Description", "Batch 7", { touch }); select(b, bd, "Company *", "PT Bara Nusantara Mandiri", { touch }); }
function uploadBody(b, bd) { b.instV(bd, "Drop zone", "State=Default", { texts: { Title: "Drop the CoA here, or click to browse", Hint: "PDF, up to 10 MB" }, props: { sizingH: "fill" } }); const f = hframe(b, bd, "File", 12, { sizeH: "fill", stroke: "Surface/border", sw: 1, r: 12, pad: [10, 12, 10, 12] }); icon(b, f, "file-pdf", "Feedback/error", 20); const t = vframe(b, f, "Text", 0); txt(b, t, "CoA-BNM-031.pdf", "Body small/SemiBold", "Text/heading", "File"); txt(b, t, "1.3 MB", "Caption/Regular", "Text/text-muted", "Size"); icon(b, f, "x", "Text/text-muted", 14); }
function historyBody(b, bd) {
  const sub = b.frame(bd, { name: "Subtitle", w: 400, h: 22, layout: "h", sizeH: "fill", sizeV: "hug" }); txt(b, sub, "DH-BNM-021", "Data/Strong", "Text/heading", "Title");
  [["CoA-BNM-021.pdf", "1.4 MB", "Maya Lestari", "2 Nov 2026, 09:14", true], ["CoA-BNM-021-v1.pdf", "1.3 MB", "Maya Lestari", "28 Oct 2026, 15:40", false], ["CoA-BNM-021-draft.pdf", "1.1 MB", "Maya Lestari", "21 Oct 2026, 11:02", false]].forEach(([f, sz, by, at, cur]) => {
    const r = hframe(b, bd, "File row", 12, { sizeH: "fill", stroke: "Surface/border", sw: 1, r: 12, pad: [12, 12, 12, 12] });
    icon(b, r, "file-pdf", "Feedback/error", 20);
    const tx = hframe(b, r, "Text", 16, { sizeH: "fill" });
    const fn = vframe(b, tx, "File name", 0, { sizeH: "hug" }); txt(b, fn, f, "Body small/SemiBold", "Text/heading", "File"); txt(b, fn, sz, "Caption/Regular", "Text/text-muted", "Size");
    if (cur) pill(b, tx, "Current", "Feedback/success-100", "Feedback/success", false);
    const md = vframe(b, tx, "Metadata", 0, { sizeH: "hug" }); txt(b, md, "Uploaded by " + by, "Caption/Regular", "Text/text-secondary", "By"); txt(b, md, at, "Caption/Regular", "Text/text-secondary", "When");
    b.instV(r, "Icon button", "Type=Ghost, Size=32, State=Default", { swaps: [[0, "Icon", "Glyph=download-simple, Size=14"]] });
  });
}

// ---------- Lithology and Seam ----------
const lcols = { desktop: [["Name", 0], ["Kind", 140], ["Total sample", 120], ["Company", 240], ["", 110]], tablet: [["Name", 0], ["Kind", 130], ["Total sample", 100], ["", 100]] };
const lithCell = (b, f, h, d) => { if (h === "Name") txt(b, f, d[0], "Body small/SemiBold", "Text/heading", "Name"); if (h === "Kind") kindPill(b, f, d[1]); if (h === "Total sample") txt(b, f, d[2], "Body small/Regular", "Text/foreground", "Total sample"); if (h === "Company") txt(b, f, COMP[d[3]], "Body small/Regular", "Text/foreground", "Company"); if (h === "") { editLink(b, f); menu(b, f); } };
const lithPhone = (b, c, d) => { const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, top, d[0], "Body small/SemiBold", "Text/heading", "Name"); kindPill(b, top, d[1]); txt(b, c, COMP[d[3]], "Caption/Regular", "Text/text-secondary", "Company"); txt(b, c, d[2] + " samples", "Body small/Regular", "Text/text-secondary", "Samples"); };
const scols = { desktop: [["Order", 80], ["Code", 120], ["Description", 0], ["Company", 240], ["Total sample", 120], ["", 110]], tablet: [["Order", 70], ["Code", 100], ["Company", 0], ["", 100]] };
const seamCell = (b, f, h, d) => { if (h === "Order") txt(b, f, d[0], "Body small/Regular", "Text/text-muted", "Order"); if (h === "Code") txt(b, f, d[1], "Data/Strong", "Text/heading", "Code"); if (h === "Description") txt(b, f, d[2] || "-", "Body small/Regular", d[2] ? "Text/foreground" : "Text/text-muted", "Description"); if (h === "Company") txt(b, f, COMP[d[3]], "Body small/Regular", "Text/foreground", "Company"); if (h === "Total sample") txt(b, f, d[4], "Body small/Regular", "Text/foreground", "Total sample"); if (h === "") { editLink(b, f); menu(b, f); } };
const seamPhone = (b, c, d) => { const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, top, d[1], "Data/Strong", "Text/heading", "Code"); txt(b, top, "Order " + d[0], "Caption/Regular", "Text/text-muted", "Order"); if (d[2]) txt(b, c, d[2], "Body small/Regular", "Text/foreground", "Description"); txt(b, c, COMP[d[3]], "Caption/Regular", "Text/text-secondary", "Company"); txt(b, c, d[4] + " samples", "Body small/Regular", "Text/text-secondary", "Samples"); };

const LI = (o = {}) => ({ module: "11-Lithology", screen: "01-Lithology_list", key: "lith", title: "Lithology", add: "Add lithology", imp: true, role: "Lab", active: "Lithology", search: "Search lithology name", company: true, chips: [["All", "9", 1], ["Coal", "1", 0], ["Parting", "6", 0], ["No lithology", "2", 0], ["Archived", "0", 0]], cols: lcols, rows: LITH, cell: lithCell, phone: lithPhone, total: 9, summary: "Showing 1–9 of 9", ...o });
const SE = (o = {}) => ({ module: "12-Seam", screen: "01-Seam_list", key: "seam", title: "Seam", add: "Add seam", imp: true, role: "Lab", active: "Seam", search: "Search seam code", company: true, chips: [["All", "62", 1], ["Archived", "0", 0]], cols: scols, rows: SEAM, cell: seamCell, phone: seamPhone, total: 62, summary: "Showing 1–10 of 62", ...o });

exports.build = (b) => {
  clearK(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "K  Master data"); });
  const d = Y.desktop, t = Y.tablet, p = Y.phone, DX = 1560, TX = 954, PX = 510, RY = 1700, HH = 1100;
  const D = (n) => [DX * (n % 4), d + RY * Math.floor(n / 4)];
  // ---- Clients (09)
  listFrame(b, ...D(0), "desktop", { ...CL(), vv: "01", variant: "Default" });
  listFrame(b, ...D(1), "desktop", { ...CL(), vv: "02", variant: "Empty", empty: { Title: "No clients yet", Text: "Add the first client to start taking job orders.", Label: "Add client" } });
  clientDetail(b, ...D(2), "desktop", { vv: "01", variant: "Default" });
  { const s = clientDetail(b, ...D(3), "desktop", { vv: "02", variant: "Contact_form" }); sheet(b, s, "desktop", HH, "Edit contact", "Save contact", (bd) => contactFormBody(b, bd)); }
  clientDetail(b, ...D(4), "desktop", { vv: "03", variant: "With_logo", client: CLIENTS[0], jobs: "9 job orders" });
  { const s = listFrame(b, ...D(5), "desktop", { ...CL(), screen: "03-Client_form", vv: "01", variant: "New_client" }); sheet(b, s, "desktop", HH, "Add client", "Save client", (bd) => clientFormBody(b, bd, "desktop")); }
  { const s = listFrame(b, ...D(6), "desktop", { ...CL(), screen: "03-Client_form", vv: "02", variant: "Archive_confirm" }); dialog(b, s, "desktop", HH, "sm", "Archive PT Tambang Sentosa Abadi?", "It stays on its job orders and reports, but you can no longer pick it. You can restore it from the Archived filter.", "Cancel", "Archive"); }
  { const s = listFrame(b, ...D(7), "desktop", { ...CL(), screen: "03-Client_form", vv: "03", variant: "Logo_uploaded" }); sheet(b, s, "desktop", HH, "Edit client", "Save client", (bd) => clientFormBody(b, bd, "desktop", { name: "PT Bukit Asam Tbk", code: "PTBA", address: "Tanjung Enim, Lahat, Sumatera Selatan", billing: "Jl. Parigi No. 1, Tanjung Enim", logo: true })); }
  // ---- Drill hole (10)
  listFrame(b, ...D(8), "desktop", { ...DL(), vv: "01", variant: "Default" });
  listFrame(b, ...D(9), "desktop", { ...DL(), vv: "02", variant: "Missing_CoA", chips: [["All", "100", 0], ["Missing CoA", "12", 1], ["Archived", "3", 0]], rows: DRILL.filter((x) => !x[4]), total: 12, summary: "Showing 1–6 of 12", reset: true });
  listFrame(b, ...D(10), "desktop", { ...DL(), vv: "03", variant: "Read_only", role: "Supervisor", readOnly: true, cell: drillCell(true), phone: drillPhone(true), cols: { ...dcols, desktop: dcols.desktop.slice(0, 5) } });
  { const s = listFrame(b, ...D(11), "desktop", { ...DL(), screen: "02-Drill_hole_form", vv: "01", variant: "New_drill_hole" }); sheet(b, s, "desktop", HH, "Add drill hole", "Save drill hole", (bd) => drillForm(b, bd, false)); }
  { const s = listFrame(b, ...D(12), "desktop", { ...DL(), screen: "03-CoA_upload", vv: "01", variant: "Upload" }); dialog(b, s, "desktop", HH, "md", "Upload CoA for DH-BNM-031", "The file is attached to the drill hole and shown in the CoA column.", "Cancel", "Upload", (bd) => uploadBody(b, bd)); }
  { const s = listFrame(b, ...D(13), "desktop", { ...DL(), screen: "03-CoA_upload", vv: "02", variant: "History" }); sheet(b, s, "desktop", HH, "CoA history", "Done", (bd) => historyBody(b, bd), "Close"); }
  // ---- Lithology (11) and Seam (12)
  listFrame(b, ...D(14), "desktop", { ...LI(), vv: "01", variant: "Default" });
  { const s = listFrame(b, ...D(15), "desktop", { ...LI(), screen: "02-Lithology_form", vv: "01", variant: "Edit" }); sheet(b, s, "desktop", HH, "Edit lithology", "Save lithology", (bd) => { field(b, bd, "Name *", "Carbonaceous Claystone"); txt(b, bd, "Kind *", "Body small/SemiBold", "Text/text-secondary", "Kind label"); radio(b, bd, "Coal", false); radio(b, bd, "Parting", true); radio(b, bd, "No lithology", false); select(b, bd, "Company *", "PT Kaltara Energi Prima"); }); }
  listFrame(b, ...D(16), "desktop", { ...SE(), vv: "01", variant: "Default" });
  { const s = listFrame(b, ...D(17), "desktop", { ...SE(), screen: "02-Seam_form", vv: "01", variant: "New_seam" }); sheet(b, s, "desktop", HH, "Add seam", "Save seam", (bd) => { field(b, bd, "Code *", "A2U3"); field(b, bd, "Description", "Seam A2, upper 3"); select(b, bd, "Company *", "PT Kaltara Energi Prima"); field(b, bd, "Order", "8"); }); }
  // ---- Tablet
  const T = (n) => [TX * n, t];
  listFrame(b, ...T(0), "tablet", { ...CL(), vv: "01", variant: "Default" });
  clientDetail(b, ...T(1), "tablet", { vv: "01", variant: "Default" });
  listFrame(b, ...T(2), "tablet", { ...DL(), vv: "01", variant: "Default" });
  listFrame(b, ...T(3), "tablet", { ...LI(), vv: "01", variant: "Default" });
  listFrame(b, ...T(4), "tablet", { ...SE(), vv: "01", variant: "Default" });
  // ---- Phone
  const P = (n) => [PX * n, p];
  listFrame(b, ...P(0), "phone", { ...CL(), vv: "01", variant: "Default" });
  clientDetail(b, ...P(1), "phone", { vv: "01", variant: "Default" });
  phoneForm(b, ...P(2), "Phone-09-Clients-03-Client_form-01-New_client", "Clients", "CSO", "Clients", "Add client", (bd) => clientFormBody(b, bd, "phone", { touch: true }), "Save client");
  listFrame(b, ...P(3), "phone", { ...DL(), vv: "01", variant: "Default" });
  phoneForm(b, ...P(4), "Phone-10-Drill_hole-02-Drill_hole_form-01-New_drill_hole", "Drill hole", "Lab", "Drill hole", "Add drill hole", (bd) => drillForm(b, bd, true), "Save drill hole");
  {
    const s = listFrame(b, ...P(5), "phone", { ...DL(), screen: "03-CoA_upload", vv: "01", variant: "Upload" });
    overlay(b, s, "phone", 1000);
    const v = b.v("Bottom sheet");
    const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: "Upload CoA for DH-BNM-031" }, props: { absolute: true, x: 0, y: 1000 - 460, width: 390 } });
    const bt = v.insts.filter((i) => i.name === "Button");
    b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: "Cancel" } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: "Upload" } });
    b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug", fill: "none", mainAlign: "min", gap: 14 } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } });
    uploadBody(b, id + v.names.Body);
  }
  listFrame(b, ...P(6), "phone", { ...LI(), vv: "01", variant: "Default" });
  listFrame(b, ...P(7), "phone", { ...SE(), vv: "01", variant: "Default" });
  b.kEnd = { desktop: d + RY * 5 + 400, tablet: t + 2400, phone: p + 3000 };
};
