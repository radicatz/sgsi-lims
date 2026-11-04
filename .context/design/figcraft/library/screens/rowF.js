// Row F · Batch detail (module 04 Batches, screen 02): Reception, Preparation, Analysis, RoA and Complete batch.
// Plan: .context/docs/Batch/Batch_Screen_Plan.md. Runs after rows C to E; places itself below the lowest frame of each page.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver, dialogAt } = H;

const F_NAMES = /^(Batch detail ·|(Desktop|Tablet|Phone)-04-Batches-02-)/;
const isF = (n) => F_NAMES.test(n.name || "") || (n.name === "Row title" && /^F( ·|  )/.test(n.characters || ""));
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (/ ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/.test(n.name || "")) continue; if (/-03-Job_orders-0[45]-|^(Add batch|CoA · Mark sent|CoA · Sent|Cancel job order) ·|-01-My_work-|^My work ·/.test(n.name || "") || (n.name === "Row title" && /^[DEH]( ·|  )/.test(n.characters || ""))) continue; if (isF(n) || isG(n)) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.ceil((m + 400) / 100) * 100; }
  if (b.gEnd) for (const k of Object.keys(out)) out[k] = Math.max(out[k], b.gEnd[k]);
  return out;
}
const isG = (n) => /^(Batch list ·|(Desktop|Tablet|Phone)-04-Batches-01-)/.test(n.name || "") || (n.name === "Row title" && /^G( ·|  )/.test(n.characters || ""));
const clearF = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isF(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };

const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const W = { desktop: 1440, tablet: 834, phone: 390 };
const icon = (b, parent, glyph, tok = "Text/text-muted", size = 14) => { const ic = b.instV(parent, "Icon", `Glyph=${glyph}, Size=${size}`); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const btn = (b, parent, type, label, glyph, o = {}) => b.instV(parent, "Button", `Type=${type}, Tone=Default, Size=${o.size || "sm"}, State=${o.state || "Default"}`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false }, props: o.fill ? { sizingH: "fill" } : undefined });
const txt = (b, parent, t, style, color, name, o = {}) => { const id = b.text(parent, t, { style, color, name: name || t, ...o }); return id; };
const hframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "h", gap, cross: o.cross || "center", main: o.main, wrap: o.wrap, pad: o.pad, sizeH: o.sizeH || "hug", sizeV: "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });
const vframe = (b, parent, name, gap = 8, o = {}) => b.frame(parent, { name, w: o.w || 200, h: o.h || 24, layout: "v", gap, pad: o.pad, sizeH: o.sizeH || "fill", sizeV: "hug", fill: o.fill, r: o.r, stroke: o.stroke, sw: o.sw });

// ---------- data ----------
const B0422 = { no: "B-2026-0422", company: "PT Kaltara Energi Prima", jo: "JO-2026-0137", std: "ASTM", deadline: "28 Oct 2026" };
const B0418 = { no: "B-2026-0418", company: "PT Bara Nusantara Mandiri", jo: "JO-2026-0142", std: "ASTM", deadline: "26 Oct 2026" };
const B0417 = { no: "B-2026-0417", company: "PT Bara Nusantara Mandiri", jo: "JO-2026-0142", std: "ASTM", deadline: "24 Oct 2026" };
// id, arrived, mass, condition, remark, photos, label (time or null)
const REC = [
  ["KEP-3301", 1, "12,40", "Good", "", 1, "27 Oct 10:42"], ["KEP-3302", 1, "11,85", "Good", "", 0, "27 Oct 10:42"],
  ["KEP-3303", 1, "13,10", "Wet", "Bag wet on arrival", 2, "27 Oct 10:43"], ["KEP-3304", 1, "12,05", "Good", "", 0, "27 Oct 10:43"],
  ["KEP-3305", 1, "9,60", "Good", "", 0, null], ["KEP-3306", 1, "12,75", "Good", "", 0, null],
  ["KEP-3307", 0, "", "", "", 0, null], ["KEP-3308", 0, "", "", "", 0, null],
];
const STEPS = ["Created", "Receiving", "Preparation", "Prep finished", "Analysis", "Completed"];

// ---------- page frame ----------
function batchFrame(b, x, y, kind, o) {
  page(b, kind);
  const s = b.shell({ name: `Batch detail · ${o.variant} · ${KIND(kind)}`, x, y, kind, active: "Batches", role: o.role || "Prep" });
  const bt = o.batch;
  b.instV(s.main, "Breadcrumb", "Levels=2", { texts: { 0: "Batches", 1: bt.no } });
  const hdr = b.frame(s.main, { name: "Header", w: 800, h: 80, layout: "h", gap: 12, main: "spaceBetween", cross: "min", sizeH: "fill", sizeV: "hug" });
  const left = vframe(b, hdr, "Title block", 6);
  const tr = hframe(b, left, "Title row", 12);
  txt(b, tr, bt.no, kind === "desktop" ? "Display/XL" : "Heading/H1", "Text/heading", "Number");
  if (o.pencil) b.instV(tr, "Icon button", "Type=Ghost, Size=32, State=Default", { swaps: [[0, "Icon", "Glyph=pencil-simple, Size=14"]] });
  b.instV(tr, "Status badge", `Status=${o.status}, Size=md`);
  txt(b, left, bt.company, "Body/Medium", "Text/foreground", "Company");
  const mr = b.frame(left, { name: "Row", w: 400, h: 20, layout: "h", gap: kind === "phone" ? 12 : 16, wrap: kind === "phone", sizeH: "fill", sizeV: "hug" });
  [["clipboard-text", bt.jo, "Primary/primary"], ["flask", bt.std], ["calendar-blank", bt.deadline], ["stack", o.count]].forEach(([g, t, c]) => {
    if (!t) return;
    const it = hframe(b, mr, g === "clipboard-text" ? "Job order link" : "Item", 4); icon(b, it, g, c === "Primary/primary" ? c : "Text/text-muted"); txt(b, it, t, "Body small/Regular", c || "Text/text-muted", g === "clipboard-text" ? "Job order link" : "Meta");
  });
  const act = hframe(b, hdr, "Actions", 8);
  b.instV(act, "Icon button", "Type=Secondary, Size=36, State=Default", { swaps: [[0, "Icon", "Glyph=dots-three, Size=20"]] });
  stepper(b, s.main, kind, o.cur, o.dates || []);
  const tb = b.frame(s.main, { name: "Tabs", w: 800, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug" });
  [["Reception", o.recCount], ["Preparation", null], ["Analysis", null]].forEach(([l, n]) => b.instV(tb, "Tab", `Selected=${l === o.tab ? "On" : "Off"}, State=Default`, { texts: n ? { 0: l, 1: String(n) } : { 0: l }, hide: n ? [] : ["Count"] }));
  return s;
}
function stepper(b, main, kind, cur, dates) {
  const c = b.frame(main, { name: "Stepper card", w: 400, h: 100, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", pad: [16, 16, 16, 16], sizeH: "fill", sizeV: "hug", clip: kind === "tablet" });
  const meta = (i, st) => dates[i] || (st === "Current" ? "Current" : "—");
  if (kind === "phone") {
    STEPS.forEach((n, i) => { const st = i < cur ? "Done" : i === cur ? "Current" : "Upcoming"; b.instV(c, "Stepper step", `State=${st}, Orientation=Vertical`, { texts: { 0: n, 1: meta(i, st) }, props: { sizingH: "fill" } }); });
    return c;
  }
  const Wc = (kind === "desktop" ? 1128 : 698) - 32, sw = Wc / 6;
  const row = b.frame(c, { name: "Stepper", w: Wc, h: 66, layout: "h", gap: 0, sizeH: "fill", sizeV: "hug" });
  b.frame(row, { name: "Track", w: sw * 5, h: 2, fill: "Surface/border-strong", absolute: true, x: sw / 2, y: 11, sizeH: "fixed", sizeV: "fixed" });
  if (cur > 0) b.frame(row, { name: "Progress", w: sw * Math.min(cur, 5), h: 2, fill: "Feedback/success", absolute: true, x: sw / 2, y: 11, sizeH: "fixed", sizeV: "fixed" });
  STEPS.forEach((n, i) => { const st = i < cur ? "Done" : i === cur ? "Current" : "Upcoming"; b.instV(row, "Stepper step", `State=${st}, Orientation=Horizontal`, { texts: { 0: n, 1: meta(i, st) }, props: { sizingH: "fill" } }); });
  return c;
}

// ---------- tables (header and rows share the column widths; the card pads) ----------
function table(b, parent, cols, rows, o = {}) {
  const t = vframe(b, parent, "Table", 0);
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); txt(b, f, h || " ", "Caption/SemiBold", "Text/text-secondary", "Head label"); });
  rows.forEach((cells, ri) => {
    const r = vframe(b, t, "Row", 0);
    const line = b.frame(r, { name: "Cells", w: 800, h: o.rowH || 56, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    cols.forEach(([, w], ci) => { const f = b.frame(line, { name: "Cell", w: w || 120, h: (o.rowH || 56) - 8, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (cells[ci]) cells[ci](f); });
    b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
  return t;
}
const cText = (t, style = "Body small/Regular", color = "Text/text-secondary") => (b) => (f) => txt(b, f, t, style, color, "Text");
const cDash = (b) => (f) => txt(b, f, "—", "Body small/Regular", "Text/text-muted", "Text");
const grid = (b, f, state, v) => { const g = b.instV(f, "Grid cell", `State=${state}`, { texts: { Value: v } }); b.raw("node.set", { ids: [g], props: { sizingH: "fill" } }); return g; };
const actBtn = (b, f, glyph, state = "Default") => b.instV(f, "Icon button", `Type=Ghost, Size=32, State=${state}`, { swaps: [[0, "Icon", `Glyph=${glyph}, Size=14`]] });
const thumb = (b, f, state, size = 40) => { const id = b.instV(f, "Photo thumbnail", `State=${state}`); b.raw("node.set", { ids: [id], props: { width: size, height: size } }); return id; };
function checklist(b, parent, title, items) {
  const c = vframe(b, parent, "Checklist", 8);
  txt(b, c, title, "Body small/SemiBold", "Text/heading", "Title");
  items.forEach(([st, l]) => { const id = b.instV(c, "Checklist item", `State=${st}`, { texts: { Label: l } }); b.raw("node.set", { ids: [id], props: { sizingH: "fill" } }); });
  return c;
}
const cardHeadF = (b, c, title, sub, kind) => {
  const h = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" });
  txt(b, h, title, "Heading/H3", "Text/heading", "Title");
  const a = hframe(b, h, "Actions", 8);
  if (sub) sub(vframe(b, c, "Card content", 8));
  return a;
};


// ---------- Reception ----------
function recCols(kind) {
  return kind === "desktop"
    ? [["#", 40], ["Sample ID", 104], ["Lab code", 96], ["Arrived", 72], ["Mass (kg)", 112], ["Condition", 150], ["Remarks", 0], ["Photos", 100], ["Label", 124], ["", 48]]
    : [["#", 32], ["Sample ID", 96], ["Arrived", 64], ["Mass (kg)", 96], ["Condition", 136], ["Photos", 80], ["Label", 0], ["", 44]];
}
function recRow(b, kind, d, i, o = {}) {
  const [id, arr, mass, cond, rem, ph, lab] = d, locked = !!o.locked;
  const no = (f) => txt(b, f, String(i + 1), "Data", "Text/text-muted", "Index");
  const sid = (f) => txt(b, f, id, "Data/Strong", "Text/heading", "Sample ID");
  const lc = arr ? cText("B0422-" + String(i + 1).padStart(2, "0"), "Data", "Text/text-secondary")(b) : cDash(b);
  const ck = (f) => b.instV(f, "Checkbox", `Checked=${arr ? "On" : "Off"}, State=${locked ? "Disabled" : "Default"}`, { hide: ["Label"] });
  const ms = arr ? (f) => grid(b, f, locked ? "Locked" : "Input", mass) : cDash(b);
  const cd = arr ? (f) => { const s = b.instV(f, "Select", `State=${locked ? "Read-only" : "Filled"}, Size=md`, { texts: { Value: cond }, hide: ["Label"], setProps: { "Show helper": false } }); b.raw("node.set", { ids: [s], props: { sizingH: "fill" } }); icon(b, f, cond === "Good" ? "check-circle" : "warning", cond === "Good" ? "Feedback/success" : "Feedback/warning"); } : cDash(b);
  const rm = rem ? cText(rem)(b) : cDash(b);
  const pt = (f) => { if (ph) { thumb(b, f, "Image"); if (ph > 1) txt(b, f, "+" + (ph - 1), "Caption/Medium", "Text/text-secondary", "More"); } else if (arr && !locked) btn(b, f, "Ghost", "Add", "plus"); else txt(b, f, "—", "Body small/Regular", "Text/text-muted", "Text"); };
  const lb = (f) => { if (!arr) return txt(b, f, "—", "Body small/Regular", "Text/text-muted", "Text"); const v = vframe(b, f, "Label", 2, { sizeH: "hug" }); b.instV(v, "Tag", `Type=${lab ? "Printed" : "Not printed"}`); if (lab && kind === "desktop") txt(b, v, lab, "Caption/Regular", "Text/text-muted", "Printed at"); };
  const ac = (f) => actBtn(b, f, locked ? "lock-simple" : "dots-three", locked ? "Disabled" : "Default");
  return kind === "desktop" ? [no, sid, lc, ck, ms, cd, rm, pt, lb, ac] : [no, sid, ck, ms, cd, pt, lb, ac];
}
function receptionCard(b, main, kind, o) {
  const c = card(b, main, "Reception card");
  const a = cardHeadF(b, c, "Reception", null, kind);
  if (!o.locked) {
    const tool = kind === "desktop" ? a : hframe(b, c, "Card content", 8, { wrap: true, sizeH: "fill" });
    const sc = b.instV(tool, "Search", "Size=sm, State=" + (o.scan ? "Filled" : "Default"), { texts: { Value: o.scan || "Scan or type a label" } }); b.raw("node.set", { ids: [sc], props: { width: 240 } });
    btn(b, tool, "Secondary", "Mark all arrived", "check");
    btn(b, tool, "Secondary", o.toPrint ? `Print labels (${o.toPrint})` : "Print labels", "printer");
    btn(b, a, "Primary", "Confirm reception", "check-circle", { state: o.ready ? "Default" : "Disabled" });
  }
  if (o.returned) {
    const cc = vframe(b, c, "Card content", 8); const n = hframe(b, cc, "Card note", 8, { sizeH: "fill", fill: "Accent/accent-100", r: 10, pad: [0, 8, 0, 8] });
    icon(b, n, "arrow-u-up-left", "Accent/accent-text");
    txt(b, n, "2 samples returned to JO-2026-0137 when reception was confirmed: KEP-3307 and KEP-3308.", "Body small/Regular", "Accent/accent-text", "Text", { fill: true });
    btn(b, n, "Ghost", "Open the job order's samples");
  }
  const rows = (o.rows || REC).map((d, i) => recRow(b, kind, d, i, o));
  table(b, c, recCols(kind), rows);
  return c;
}
function receptionChecklist(b, main, ready) {
  checklist(b, main, "Before you can confirm reception", [["Done", "At least one sample arrived"], ["Done", "Every arrived sample has a mass"], ["Done", "Every arrived sample has a condition, with a remark unless Good"], [ready ? "Done" : "Pending", ready ? "Every arrived sample has a printed label" : "Every arrived sample has a printed label (2 to print)"]]);
}
function recPhoneCard(b, parent, d, i, o = {}) {
  const [id, arr, mass, cond, rem, ph, lab] = d;
  const c = vframe(b, parent, "Sample card", 10, { fill: "Surface/card", stroke: o.hl ? "Action/action" : "Surface/border", sw: o.hl ? 2 : 1, r: 12, pad: 16 });
  const top = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" });
  const l = hframe(b, top, "Ids", 8); txt(b, l, id, "Data/Strong", "Text/heading", "Sample ID"); if (arr) txt(b, l, "B0422-" + String(i + 1).padStart(2, "0"), "Data", "Text/text-secondary", "Lab code");
  b.instV(top, "Checkbox", `Checked=${arr ? "On" : "Off"}, State=Default`, { texts: { Label: "Arrived" } });
  if (!arr) return c;
  const f = hframe(b, c, "Fields", 10, { sizeH: "fill", cross: "min" });
  const m = b.instV(f, "Text field", `State=${o.focus ? "Focused" : "Filled"}, Size=touch`, { texts: { Label: "Mass (kg)", Value: mass }, setProps: { "Show helper": false } }); b.raw("node.set", { ids: [m], props: { sizingH: "fill" } });
  const s = b.instV(f, "Select", "State=Filled, Size=touch", { texts: { Label: "Condition", Value: cond }, setProps: { "Show helper": false } }); b.raw("node.set", { ids: [s], props: { sizingH: "fill" } });
  if (rem) txt(b, c, rem, "Body small/Regular", "Text/text-secondary", "Remarks");
  const st = hframe(b, c, "Photo strip", 8, { sizeH: "fill" });
  for (let k = 0; k < ph; k++) thumb(b, st, "Image", 56);
  thumb(b, st, "Empty", 56);
  const bt = hframe(b, c, "Label row", 8, { sizeH: "fill", main: "spaceBetween" });
  b.instV(bt, "Tag", `Type=${lab ? "Printed" : "Not printed"}`); if (lab) txt(b, bt, lab, "Caption/Regular", "Text/text-muted", "Printed at");
  return c;
}
function phoneBar(b, root, buttons) {
  const bar = b.frame(root, { name: "Sticky bar", w: 390, h: 76, fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "h", gap: 10, pad: 16, cross: "center", sizeH: "fill", sizeV: "fixed" });
  buttons.forEach(([type, l, state], i) => btn(b, bar, type, l, null, { size: "touch", state, fill: i === buttons.length - 1 }));
}

// ---------- Preparation ----------
const ADL = [["8,42", "Saved"], ["9,10", "Saved"], ["22,40", "Warning"], ["7,95", "Saved"], ["8,61", "Dirty"], ["", "Input"]];
function prepCard(b, main, kind, done) {
  const c = card(b, main, "Preparation card");
  const a = cardHeadF(b, c, "Preparation", null, kind);
  if (!done) { txt(b, a, "4 of 6 saved", "Body small/Regular", "Text/text-secondary", "Saved count"); btn(b, a, "Secondary", "Save all", "floppy-disk"); btn(b, a, "Primary", "Finish Preparation", "check-circle", { state: "Disabled" }); }
  else { const r = hframe(b, a, "Ready", 6); icon(b, r, "check-circle", "Feedback/success"); txt(b, r, "Ready for analysis", "Body small/Medium", "Feedback/success", "Ready"); }
  const cols = kind === "desktop" ? [["#", 40], ["Sample ID", 120], ["Lab code", 110], ["ADL (%)", 140], ["Entered by", 0], ["Saved", 120], ["Status", 140]] : [["#", 32], ["Sample ID", 100], ["ADL (%)", 120], ["Entered by", 0], ["Saved", 96]];
  const rows = ADL.map(([v, st], i) => {
    const saved = done || st === "Saved" || st === "Warning";
    const no = (f) => txt(b, f, String(i + 1), "Data", "Text/text-muted", "Index");
    const sid = (f) => txt(b, f, REC[i][0], "Data/Strong", "Text/heading", "Sample ID");
    const lc = cText("B0422-" + String(i + 1).padStart(2, "0"), "Data")(b);
    const adl = (f) => grid(b, f, done ? "Locked" : st === "Saved" ? "Input" : st, done && !v ? "8,30" : v);
    const by = (f) => { if (!saved) return txt(b, f, "—", "Body small/Regular", "Text/text-muted", "Text"); b.instV(f, "Avatar", "Size=24", { texts: { Initials: "DK" } }); if (kind === "desktop") { const v2 = vframe(b, f, "Who", 0, { sizeH: "hug" }); txt(b, v2, "Dedi Kurniawan", "Body small/Medium", "Text/foreground", "Name"); txt(b, v2, "28 Oct 09:" + String(10 + i * 4), "Caption/Regular", "Text/text-secondary", "When"); } };
    const sv = (f) => b.instV(f, "Tag", `Type=${saved ? "Saved" : "Pending"}`);
    const status = (f) => b.instV(f, "Status badge", "Status=Received, Size=md");
    return kind === "desktop" ? [no, sid, lc, adl, by, sv, status] : [no, sid, adl, by, sv];
  });
  table(b, c, cols, rows);
  if (!done) checklist(b, c, "Before you can finish preparation", [["Pending", "ADL saved for every sample (TM is ordered): 4 of 6"], ["Warning", "KEP-3303 is above 20 %: check the value"]]);
  return c;
}

// ---------- Analysis ----------
const PCOLS = [["Moisture", [["TM", "%", "ar"], ["IM", "%", "adb"]]], ["Proximate", [["Ash", "%", "adb"], ["VM", "%", "adb"], ["FC", "%", "adb"]]], ["Sulfur", [["TS", "%", "adb"]]], ["Calorific", [["GCV", "kcal/kg", "adb"]]], ["Physical", [["HGI", "", ""]]]];
const ARES = [
  ["BNM-3413", ["28,40", "8,12", "6,05", "39,20", "", "0,42", "5 912", "52"]], ["BNM-3414", ["27,95", "7,88", "5,61", "40,05", "", "0,38", "5 980", "54"]],
  ["BNM-3415", ["29,10", "8,40", "52,10", "28,30", "", "1,05", "3 104", "49"]], ["BNM-3416", ["28,75", "8,05", "6,44", "39,75", "", "0,40", "5 940", "53"]],
  ["BNM-3417", ["28,20", "7,95", "", "", "", "", "", ""]], ["BNM-3418", ["", "", "", "", "", "", "", ""]],
];
const fc = (r) => { const n = (s) => parseFloat(String(s).replace(",", ".")); if (!r[1] || !r[2] || !r[3]) return ""; return (100 - n(r[1]) - n(r[2]) - n(r[3])).toFixed(2).replace(".", ","); };
function analysisTable(b, c, kind, state) {
  const params = PCOLS.flatMap(([g, ps]) => ps.map((p) => [g, ...p]));
  const pw = 96, idw = 40, sw = 112;
  const t = vframe(b, c, "Table", 0, kind === "tablet" ? { sizeH: "fixed", w: idw + sw + pw * params.length } : {});
  if (kind === "tablet") b.raw("node.set", { ids: [t], props: { width: idw + sw + pw * params.length } });
  const g = b.frame(t, { name: "Group header", w: 800, h: 28, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  b.frame(g, { name: "Spacer", w: idw + sw, h: 28, sizeH: "fixed", sizeV: "fixed" });
  PCOLS.forEach(([gn, ps]) => { const f = b.frame(g, { name: "Group", w: pw * ps.length, h: 28, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, f, gn, "Overline", "Text/text-muted", "Group"); });
  const head = b.frame(t, { name: "Table header", w: 800, h: 48, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  [["#", idw], ["Sample ID", sw]].forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w, h: 48, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); });
  params.forEach(([, p, u, basis]) => { const f = b.frame(head, { name: "Head", w: pw, h: 48, layout: "v", gap: 0, pad: [0, 8, 0, 8], main: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, f, p, "Caption/SemiBold", "Text/text-secondary", "Head label"); if (u || basis) { const r = hframe(b, f, "Unit", 4); if (u) txt(b, r, u, "Caption/Regular", "Text/text-muted", "Unit"); if (basis) txt(b, r, basis, "Caption/Regular", "Text/text-muted", "Basis"); } });
  ARES.forEach(([sid, vals], i) => {
    const r = vframe(b, t, "Row", 0);
    const line = b.frame(r, { name: "Cells", w: 800, h: 48, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
    const cell = (w) => b.frame(line, { name: "Cell", w, h: 40, layout: "h", pad: [0, 4, 0, 4], cross: "center", sizeH: "fixed", sizeV: "fixed" });
    txt(b, cell(idw), String(i + 1), "Data", "Text/text-muted", "Index");
    txt(b, cell(sw), sid, "Data/Strong", "Text/heading", "Sample ID");
    const row = vals.slice(); row[4] = fc(vals);
    params.forEach(([, p], k) => {
      const v = row[k], f = cell(pw);
      let st = "Input";
      if (state !== "entry") st = p === "FC" ? "Calculated" : "Locked";
      else if (p === "FC") st = "Calculated";
      else if (i === 2 && (p === "Ash" || p === "GCV")) st = "Warning";
      else if (i === 4 && v) st = "Dirty";
      grid(b, f, st, state !== "entry" && !v ? ["28,30", "8,01", "6,20", "39,40", "46,39", "0,41", "5 930", "51"][k] : v);
    });
    b.frame(r, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
  return t;
}
function analysisHeadLine(b, t, state) {
  const r = hframe(b, t, "Header line", 8, { wrap: true });
  txt(b, r, state === "entry" ? "26 of 36 values saved" : "36 of 36 values saved", "Body small/Medium", "Text/foreground", "Saved");
  txt(b, r, "Started 23 Oct", "Body small/Regular", "Text/text-muted", "Started");
  b.instV(r, "Avatar", "Size=24", { texts: { Initials: "FH" } });
  txt(b, r, "Fitri Handayani", "Body small/Regular", "Text/text-secondary", "Analyst");
}
function roaCard(b, main, kind, done) {
  const c = card(b, main, "RoA card");
  const a = cardHeadF(b, c, "Signed RoA", (t) => txt(b, t, done ? "The batch is complete. Every tab is read-only." : "Upload the RoA signed by the supervisor, then complete the batch.", "Body small/Regular", "Text/text-secondary", "Hint"), kind);
  if (done) {
    const f = hframe(b, c, "File", 10, { sizeH: "fill", fill: "Primary/primary-50", r: 10, pad: [12, 14, 12, 14], wrap: kind === "phone" });
    icon(b, f, "file-pdf", "Primary/primary", 20);
    const n = vframe(b, f, "Name", 0, { sizeH: "hug" }); txt(b, n, "RoA-0417.pdf", "Body small/SemiBold", "Text/foreground", "File"); const m = hframe(b, n, "Meta", 8); txt(b, m, "1.2 MB", "Caption/Regular", "Text/text-muted", "Size"); txt(b, m, "Uploaded by Maya Lestari", "Caption/Regular", "Text/text-secondary", "By"); txt(b, m, "24 Oct 2026, 16:05", "Caption/Regular", "Text/text-muted", "When");
    b.frame(f, { name: "Spacer", w: 8, h: 8, sizeH: "fill", sizeV: "fixed" });
    btn(b, f, "Secondary", "Download", "download-simple");
    return c;
  }
  btn(b, a, "Primary", "Complete batch", "check-circle", { state: "Disabled" });
  const r = b.frame(c, { name: "Fields", w: 400, h: 80, layout: kind === "desktop" ? "h" : "v", gap: 16, sizeH: "fill", sizeV: "hug" });
  const tf = b.instV(r, "Text field", `State=Filled, Size=${kind === "phone" ? "touch" : "md"}`, { texts: { Label: "RoA number *", Value: "RoA-0418" }, setProps: { "Show helper": false } }); b.raw("node.set", { ids: [tf], props: kind === "desktop" ? { width: 260 } : { sizingH: "fill" } });
  const dz = b.instV(r, "Drop zone", "State=Default", { texts: { Title: "Drop the signed RoA here, or click to browse", Hint: "PDF, up to 10 MB" } }); b.raw("node.set", { ids: [dz], props: { sizingH: "fill" } });
  return c;
}
function analysisCard(b, main, kind, state) {
  const c = card(b, main, "Analysis card");
  const a = cardHeadF(b, c, "Analysis", (t) => analysisHeadLine(b, t, state), kind);
  if (state === "entry") { btn(b, a, "Secondary", "Save all", "floppy-disk"); btn(b, a, "Primary", "Finish Analysis", "check-circle", { state: "Disabled" }); }
  if (kind === "phone") {
    ARES.slice(0, 2).forEach(([sid, vals]) => {
      const sc = vframe(b, c, "Sample card", 10, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, pad: 16 });
      txt(b, sc, sid, "Data/Strong", "Text/heading", "Sample ID");
      const g = b.frame(sc, { name: "Fields", w: 300, h: 100, layout: "h", gap: 10, wrap: true, sizeH: "fill", sizeV: "hug" });
      const row = vals.slice(); row[4] = fc(vals);
      PCOLS.flatMap(([, ps]) => ps).forEach(([p, u, basis], k) => { const f = b.instV(g, "Text field", `State=${state === "entry" ? "Filled" : "Read-only"}, Size=touch`, { texts: { Label: p + (u ? " (" + u + (basis ? ", " + basis : "") + ")" : ""), Value: row[k] }, setProps: { "Show helper": false } }); b.raw("node.set", { ids: [f], props: { width: 145 } }); });
    });
  } else analysisTable(b, c, kind, state);
  if (state === "entry") checklist(b, c, "Before you can finish analysis", [["Pending", "A value for every ordered parameter: 26 of 36"], ["Warning", "BNM-3415 has Ash and GCV outside the typical range: check them"]]);
  return c;
}

// ---------- overlays ----------
const fix = (b, s, kind, h) => { b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: h } }); scrimOver(b, s.root, W[kind], h); };
function labelPreview(b, parent) {
  const c = b.reg.comps["Label preview"]; const id = b.comp(parent, "Label preview");
  b.raw("node.set", { ids: [id + 1], props: { characters: "B0422-05" } }); b.raw("node.set", { ids: [id + 43], props: { characters: "KEP-3305" } }); b.raw("node.set", { ids: [id + 44], props: { characters: "PT Kaltara Energi Prima" } });
  return id;
}
function printBody(b, bd, W2, phone) {
  const f = vframe(b, bd, "Fields", 14);
  labelPreview(b, f);
  const sz = phone ? "touch" : "md";
  b.instV(f, "Select", `State=Filled, Size=${sz}`, { texts: { Label: "Printer", Value: "Zebra ZD421 (Prep room)" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(f, "Text field", `State=Filled, Size=${sz}`, { texts: { Label: "Copies per sample", Value: "1" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(f, "Checkbox", "Checked=On, State=Default", { texts: { Label: "Only samples without a label (2)" } });
}
function bottomSheet(b, s, H, y, title, cancel, ok, bodyFn) {
  const v = b.v("Bottom sheet");
  const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: title }, props: { absolute: true, x: 0, y, width: 390 } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: cancel } });
  b.raw("node.set", { ids: [id + btns[1].pos + 3], props: { characters: ok } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug" } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { fill: "none", mainAlign: "min", gap: 14 } });
  bodyFn(id + v.names.Body);
  return id;
}
function photosBody(b, bd, phone, size) {
  const f = vframe(b, bd, "Photos", 14);
  const chips = hframe(b, f, "Tags", 8, { wrap: true, sizeH: "fill" });
  [["Condition", "On"], ["Weighing", "Off"], ["Other", "Off"]].forEach(([l, s]) => b.instV(chips, "Filter chip", `Selected=${s}, State=Default`, { texts: { Label: l }, setProps: { "Show count": false } }));
  const g = b.frame(f, { name: "Gallery", w: 400, h: 200, layout: "h", gap: 12, wrap: true, sizeH: "fill", sizeV: "hug" });
  [["Condition", "27 Oct 10:40"], ["Weighing", "27 Oct 10:41"]].forEach(([tag, when]) => {
    const p = vframe(b, g, "Photo", 6, { sizeH: "hug" }); thumb(b, p, "Image", size || (phone ? 150 : 200));
    txt(b, p, tag, "Caption/SemiBold", "Text/foreground", "Tag"); txt(b, p, "Dedi Kurniawan", "Caption/Regular", "Text/text-secondary", "By"); txt(b, p, when, "Caption/Regular", "Text/text-muted", "When");
  });
  thumb(b, g, "Empty", size || (phone ? 150 : 200));
}

// photos: centered Dialog lg (desktop and tablet), three photos per row
function photosDialog(b, s, Wd, shift) {
  const v = b.v("Dialog", "Type=Default, Size=lg");
  const id = dialogAt(b, s.root, "lg", 0, 120, "Photos of KEP-3303", "Tag each photo. Photos lock when reception is confirmed.", "Close", "Add photo", (bd) => { b.raw("node.set", { ids: [bd], props: { fill: "none", mainAlign: "min" } }); photosBody(b, bd, false, 176); });
  const w = b.reg.N[v.id].width || 640;
  b.raw("node.set", { ids: [id], props: { x: Math.round((Wd - w) / 2) + shift } });
}

// ---------- frames ----------
function receptionFrame(b, x, y, kind, o = {}) {
  const s = batchFrame(b, x, y, kind, { variant: o.variant, batch: B0422, status: o.locked ? "Preparation" : "Receiving", pencil: !o.locked, count: o.locked ? "6 samples" : "6 of 8 arrived", cur: o.locked ? 2 : 1, dates: ["27 Oct", o.locked ? "27 Oct" : ""], tab: "Reception", recCount: o.locked ? 6 : 8, role: o.role });
  if (kind === "phone") {
    const sc = b.instV(s.main, "Search", `Size=lg, State=${o.scan ? "Filled" : "Default"}`, { texts: { Value: o.scan || "Scan or type a label" }, props: { sizingH: "fill" } });
    const list = vframe(b, s.main, "Cards", 12);
    (o.phoneRows || [0, 2, 6]).forEach((i) => recPhoneCard(b, list, REC[i], i, { hl: o.scan && i === 3, focus: o.scan && i === 3 }));
    phoneBar(b, s.root, [["Secondary", "Print labels (2)"], ["Primary", "Confirm reception", "Disabled"]]);
    return s;
  }
  const rcard = receptionCard(b, s.main, kind, { toPrint: o.ready ? 0 : 2, ready: o.ready, locked: o.locked, returned: o.locked, rows: o.locked ? REC.slice(0, 6).map((d) => [...d.slice(0, 6), d[6] || "27 Oct 11:05"]) : o.ready ? REC.map((d) => (d[1] ? [...d.slice(0, 6), d[6] || "27 Oct 11:05"] : d)) : REC });
  if (!o.locked) receptionChecklist(b, rcard, o.ready);
  return s;
}
function prepFrame(b, x, y, kind, done) {
  const s = batchFrame(b, x, y, kind, { variant: done ? "Preparation_finished" : "Preparation_entering_ADL", batch: B0422, status: done ? "Prep finished" : "Preparation", count: "6 samples", cur: done ? 3 : 2, dates: ["27 Oct", "27 Oct", done ? "28 Oct" : "Started 28 Oct", done ? "28 Oct" : ""], tab: "Preparation", recCount: 6 });
  if (kind === "phone") {
    const list = vframe(b, s.main, "Cards", 12);
    ADL.slice(0, 4).forEach(([v, st], i) => { const c = vframe(b, list, "Sample card", 8, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, pad: 16 }); const t = hframe(b, c, "Ids", 8); txt(b, t, REC[i][0], "Data/Strong", "Text/heading", "Sample ID"); txt(b, t, "B0422-0" + (i + 1), "Data", "Text/text-secondary", "Lab code"); const f = b.instV(c, "Text field", `State=${st === "Warning" ? "Error" : "Filled"}, Size=touch`, { texts: { Label: "ADL (%)", Value: v, Helper: st === "Warning" ? "Above 20 %: check the value." : "" }, setProps: { "Show helper": st === "Warning" } }); b.raw("node.set", { ids: [f], props: { sizingH: "fill" } }); const w = hframe(b, c, "Who", 6); b.instV(w, "Avatar", "Size=24", { texts: { Initials: "DK" } }); txt(b, w, "Dedi Kurniawan", "Caption/Regular", "Text/text-secondary", "Name"); txt(b, w, "28 Oct 09:" + (10 + i * 4), "Caption/Regular", "Text/text-muted", "When"); });
    phoneBar(b, s.root, [["Secondary", "Save all"], ["Primary", "Finish Preparation", "Disabled"]]);
    return s;
  }
  prepCard(b, s.main, kind, done);
  return s;
}
function analysisFrame(b, x, y, kind, state) {
  const bt = state === "done" ? B0417 : B0418;
  const s = batchFrame(b, x, y, kind, { variant: state === "entry" ? "Analysis_entering_results" : state === "upload" ? "Analysis_finished_upload_RoA" : "Completed", batch: bt, status: state === "entry" ? "Analysis" : state === "upload" ? "Analysis finished" : "Completed", count: state === "done" ? "12 samples" : "6 samples", cur: state === "entry" ? 4 : state === "upload" ? 5 : 6, dates: ["21 Oct", "22 Oct", "22 Oct", "23 Oct", state === "entry" ? "Started 23 Oct" : "24 Oct", state === "done" ? "24 Oct" : ""], tab: "Analysis", recCount: state === "done" ? 12 : 6, role: state === "entry" ? "Analyst" : "Lab" });
  if (state !== "entry") roaCard(b, s.main, kind, state === "done");
  analysisCard(b, s.main, kind, state);
  if (kind === "phone") phoneBar(b, s.root, state === "entry" ? [["Secondary", "Save all"], ["Primary", "Finish Analysis", "Disabled"]] : state === "upload" ? [["Primary", "Complete batch", "Disabled"]] : []);
  return s;
}

exports.build = (b) => {
  clearF(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "F  Batch detail"); });
  const DX = 1560, D1 = Y.desktop, D2 = Y.desktop + 1500, D3 = Y.desktop + 3000;
  // reception
  receptionFrame(b, 0, D1, "desktop", { variant: "Reception_receiving" });
  { const s = receptionFrame(b, DX, D1, "desktop", { variant: "Reception_print_labels" }); fix(b, s, "desktop", 1200); dialogAt(b, s.root, "md", Math.round((1440 - 560) / 2) + 64, 120, "Print 2 labels", "Labels for KEP-3305 and KEP-3306, which arrived without one.", "Cancel", "Print 2 labels", (bd) => printBody(b, bd, 512, false)); }
  { const s = receptionFrame(b, DX * 2, D1, "desktop", { variant: "Reception_photos" }); fix(b, s, "desktop", 1200); photosDialog(b, s, 1440, 64); }
  receptionFrame(b, DX * 3, D1, "desktop", { variant: "Reception_ready", ready: true });
  { const s = receptionFrame(b, DX * 4, D1, "desktop", { variant: "Reception_confirm_with_fewer", ready: true }); fix(b, s, "desktop", 1200); dialogAt(b, s.root, "md", Math.round((1440 - 560) / 2) + 64, 240, "Confirm reception with 6 of 8 samples?", "KEP-3307 and KEP-3308 have not arrived. They leave this batch and go back to JO-2026-0137 as Awaiting arrival. Confirming locks the sample information of the 6 that arrived.", "Cancel", "Confirm reception", (bd) => { const r = hframe(b, bd, "Counts", 12, { sizeH: "fill" }); [["6", "Arrived"], ["0", "On hold"], ["2", "Leave the batch"]].forEach(([n, l]) => { const c = vframe(b, r, "Count", 2, { fill: "Surface/muted", r: 10, pad: [10, 12, 10, 12] }); txt(b, c, n, "Heading/H2", "Text/heading", "Number"); txt(b, c, l, "Caption/Regular", "Text/text-secondary", "Label"); }); }); }
  { const s = receptionFrame(b, 0, D2, "desktop", { variant: "Reception_hold_sample", ready: true }); fix(b, s, "desktop", 1200); dialogAt(b, s.root, "sm", Math.round((1440 - 440) / 2) + 64, 240, "Hold KEP-3305?", "A held sample stays in the batch and prints as not analysed on the RoA.", "Cancel", "Hold sample", (bd) => { const f = vframe(b, bd, "Fields", 12); b.instV(f, "Select", "State=Filled, Size=md", { texts: { Label: "Reason *", Value: "Insufficient" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); b.instV(f, "Textarea", "State=Default, Size=md", { texts: { Label: "Note (optional)", Value: "Add a note…" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); }); }
  receptionFrame(b, DX, D2, "desktop", { variant: "Reception_confirmed", locked: true });
  { const s = receptionFrame(b, DX * 2, D2, "desktop", { variant: "Batch_number_edit" }); fix(b, s, "desktop", 1200); dialogAt(b, s.root, "sm", Math.round((1440 - 440) / 2) + 64, 240, "Edit batch number", "Labels already printed for 4 samples must be reprinted after the change.", "Cancel", "Save", (bd) => { b.instV(bd, "Text field", "State=Error, Size=md", { texts: { Label: "Batch no. *", Value: "B-2026-0421", Helper: "B-2026-0421 is already used." }, setProps: { "Show helper": true }, props: { sizingH: "fill" } }); }); }
  prepFrame(b, DX * 3, D2, "desktop", false); prepFrame(b, DX * 4, D2, "desktop", true);
  analysisFrame(b, 0, D3, "desktop", "entry"); analysisFrame(b, DX, D3, "desktop", "upload"); analysisFrame(b, DX * 2, D3, "desktop", "done");
  // tablet
  const TX = 954, T1 = Y.tablet;
  receptionFrame(b, 0, T1, "tablet", { variant: "Reception_receiving" });
  { const s = receptionFrame(b, TX, T1, "tablet", { variant: "Reception_photos" }); fix(b, s, "tablet", 1220); photosDialog(b, s, 834, 0); }
  prepFrame(b, TX * 2, T1, "tablet", false);
  analysisFrame(b, TX * 3, T1, "tablet", "entry");
  // phone
  const PX = 510, P1 = Y.phone;
  receptionFrame(b, 0, P1, "phone", { variant: "Reception_receiving" });
  { const s = receptionFrame(b, PX, P1, "phone", { variant: "Reception_print_labels" }); fix(b, s, "phone", 1400); bottomSheet(b, s, 1400, 1400 - 640, "Print 2 labels", "Cancel", "Print 2 labels", (bd) => printBody(b, bd, 342, true)); }
  { const s = receptionFrame(b, PX * 2, P1, "phone", { variant: "Reception_photos" }); fix(b, s, "phone", 1400); bottomSheet(b, s, 1400, 1400 - 560, "Photos of KEP-3303", "Close", "Add photo", (bd) => photosBody(b, bd, true)); }
  { const s = receptionFrame(b, PX * 3, P1, "phone", { variant: "Reception_scan_label", scan: "KEP-3304", phoneRows: [3, 4] }); b.instV(s.root, "Toast", "Tone=Success", { texts: { 0: "KEP-3304 found and marked arrived.", 1: "Undo" }, props: { absolute: true, x: 16, y: 120, width: 358 } }); }
  prepFrame(b, PX * 4, P1, "phone", false);
  analysisFrame(b, PX * 5, P1, "phone", "entry");
  analysisFrame(b, PX * 6, P1, "phone", "upload");
  b.fEnd = { desktop: D3 + 1500 + 400, tablet: T1 + 1500 + 400, phone: P1 + 2800 + 400 };
};
