// Add-only run: Configuration sections on phone (8 frames) and tablet (7 frames). Plan: Admin_Screen_Plan.md section 15.
// build-screens.js Ocfg    (needs the main file with row O built; deletes only its own frames, by exact name)
const { H } = require("./rowC.js");
const { CFG } = require("./rowO.js");
const { frame, configFrame, sectionHead, status, tag, tf, sel, tabs, table, pager, card, vframe, hframe, txt, icon, iconBtn, btn, pill, methods, lookups, laboratory, security, footerBtns, settingsCard, RULES, METHODS, SERVICES } = CFG;
const { page } = H;

const divider = (b, c) => b.frame(c, { name: "Divider", w: 400, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
const note = (b, c, t) => txt(b, c, t, "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
const infoNote = (b, m) => { const r = hframe(b, m, "Info note", 8, { sizeH: "fill", cross: "min", pad: [4, 4, 4, 4] }); icon(b, r, "info", "Text/text-muted", 14); txt(b, r, "To change these settings, use a computer or tablet.", "Caption/Regular", "Text/text-secondary", "Text", { fill: true }); };
// phone list item: top row (left builder, right builder) then detail lines
function item(b, c, i, left, right, details, noOpen) {
  if (i) divider(b, c);
  const row = vframe(b, c, "Item", 4);
  const top = hframe(b, row, "Top", 8, { sizeH: "fill", main: "spaceBetween", cross: "center" });
  left(top);
  if (right || !noOpen) { const g = hframe(b, top, "Right", 6, { cross: "center" }); if (right) right(g); if (!noOpen) icon(b, g, "caret-right", "Text/text-muted", 14); }
  (details || []).forEach(([t, st, col]) => txt(b, row, t, st || "Caption/Regular", col || "Text/text-secondary", "Detail", { fill: true }));
  return row;
}
const name = (b, t, st) => (top) => txt(b, top, t, st || "Body small/SemiBold", "Text/heading", "Name");
const stack = (b, p, k, v, open = true) => { const r = hframe(b, p, "Setting", 8, { sizeH: "fill", cross: "center" }); b.instV(r, "Key-value row", "Layout=Stacked", { texts: { Key: k, Value: v }, props: { sizingH: "fill" } }); if (open) icon(b, r, "caret-right", "Text/text-muted", 14); return r; };

// ---------- phone ----------
function phoneFrame(b, x, y, ss, screen, on, content) {
  const s = configFrame(b, x, y, "phone", ss, screen, "01", screen === "Formulas" ? "View" : screen === "Laboratory" || screen === "Security" ? "Default" : screen === "Methods_and_standards" ? "Matrix" : "List", on, (m) => content(m));
  return s;
}
function pServices(b, m) {
  const c = card(b, m, "Services card"); sectionHead(b, c, "Services", 5, "Add service"); note(b, c, "Quick-select templates on the job order form. A change makes a new version.");
  SERVICES.forEach((r, i) => item(b, c, i, name(b, r[0]), (top) => { const g = hframe(b, top, "Tags", 6, { cross: "center" }); if (r[5]) pill(b, g, "Default", "Accent/accent-100", "Accent/accent-text", false); status(b, g, r[4]); }, [[`${r[1]}, ${r[2]}, ${r[3]}`]]));
}
function pMethods(b, m) {
  const c = card(b, m, "Methods card"); sectionHead(b, c, "Methods and standards", 42, "Add"); note(b, c, "An empty cell means the standard has no method for the parameter.");
  METHODS.slice(0, 6).forEach((r, i) => { if (i) divider(b, c); const row = vframe(b, c, "Item", 6); const tp = hframe(b, row, "Top", 8, { sizeH: "fill", main: "spaceBetween", cross: "center" }); txt(b, tp, r[0], "Body small/SemiBold", "Text/heading", "Parameter"); icon(b, tp, "caret-right", "Text/text-muted", 14); [["ASTM", r[1]], ["ISO", r[2]], ["GB/T", r[3]]].forEach(([s, v]) => { const l = hframe(b, row, "Method row", 8, { sizeH: "fill", cross: "center" }); const lw = b.frame(l, { name: "Standard", w: 48, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, lw, s, "Caption/Medium", "Text/text-secondary", "Standard"); if (v) txt(b, l, v, "Data", "Text/foreground", "Method"); else txt(b, l, "No method", "Caption/Regular", "Text/text-muted", "Empty"); }); });
  pager(b, c, "1 / 2", "phone");
}
function pRules(b, m) {
  const c = card(b, m, "Rules card"); sectionHead(b, c, "Validation rules", 33); note(b, c, "Fixed rules come from the specification and can't be changed here.");
  RULES.forEach((r, i) => item(b, c, i, (top) => { const g = hframe(b, top, "Rule", 8, { cross: "center" }); txt(b, g, r[0], "Data/Strong", "Text/heading", "Rule"); txt(b, g, r[1], "Body small/Regular", "Text/foreground", "Applies"); }, (top) => status(b, top, r[2]), [[r[3]]], /fixed/.test(r[3])));
}
function pTemplates(b, m) {
  const c = card(b, m, "Templates card"); sectionHead(b, c, "House CoA template", null, "New version"); note(b, c, "One template in v1. Activating a version changes new CoAs only.");
  [["v3", "Draft", "Wahyu Pratama, 5 Nov 2026", "New form code in the footer"], ["v2", "Active", "Wahyu Pratama, 20 Oct 2026", "Terms line updated"], ["v1", "Archived", "Wahyu Pratama, 1 Oct 2026", "First version"]].forEach((r, i) => item(b, c, i, (top) => txt(b, top, r[0], "Data/Strong", "Text/heading", "Version"), (top) => status(b, top, r[1]), [[r[2]], [r[3], "Caption/Regular", "Text/text-muted"]]));
}
function pLookups(b, m) {
  const c = card(b, m, "Lookups card"); sectionHead(b, c, "Lookups", 5, "Add value");
  const t = tabs(b, c, [["Sample conditions", 5], ["Hold reasons", 4], ["Photo tags", 3], ["Lithology kinds", 3], ["Send channels", 4]], 0); b.raw("node.set", { ids: [t], props: { clip: true } });
  [["Good", "No"], ["Damaged", "Yes"], ["Wet", "Yes"], ["Short", "Yes"], ["No tag", "Yes"]].forEach((r, i) => item(b, c, i, name(b, r[0]), (top) => status(b, top, "Active"), [[`Order ${i + 1}, needs a remark: ${r[1]}`]]));
}
function pLab(b, m) {
  const a = card(b, m, "Laboratory card"); sectionHead(b, a, "Laboratory");
  const r = hframe(b, a, "Logo", 12, { sizeH: "fill", cross: "center", wrap: true }); const lg = b.instV(r, "Logo", "Type=Full, Color=Default"); b.raw("transform.scale", { ids: [lg], factor: 150 / 990 }); btn(b, r, "Secondary", "Replace logo", "upload-simple", { size: "md" });
  [["Laboratory name", "PT Sentra Geo Survey Indonesia"], ["Address", "Jl. Pangeran Antasari 12, Samarinda, Kalimantan Timur"], ["Accreditation number", "LP-1234-IDN"], ["Place of issue", "Samarinda"]].forEach(([k, v]) => stack(b, a, k, v));
  const n = card(b, m, "Numbering card"); sectionHead(b, n, "Numbering");
  [["Job order", "JO-YYYY-NNNN"], ["Batch", "B-YYYY-NNNN"], ["Sample ID", "SG.YYMMDD.CCC.BB.NNN"], ["Sample code", "CCC.BB.NNN.Lotxx"], ["CoA", "CoA-{job order}-{revision}"]].forEach(([k, v]) => stack(b, n, k, v));
  note(b, n, "New numbers follow the pattern; existing numbers never change.");
  const o = card(b, m, "Branch offices card"); sectionHead(b, o, "Branch offices"); stack(b, o, "RI", "Rapak Indah");
}
function pSecurity(b, m) {
  [["Sign-in", [["Lock after failed attempts", "5"], ["Lock for", "15 minutes"]]], ["Session", [["Sign out after inactivity", "30 minutes"], ["Warn before", "60 seconds"]]], ["Passwords", [["Minimum length", "10 characters"], ["A letter and a number", "Required"], ["Not the email", "Required"], ["A special character", "Not required"]]], ["Links", [["Reset link valid", "60 minutes"], ["Invite valid", "7 days"]]]].forEach(([t, rows]) => { const c = card(b, m, t + " card"); sectionHead(b, c, t); rows.forEach(([k, v]) => stack(b, c, k, v)); });
}
const FORMULAS = [["FC (ADB)", "100 − (IM + Ash + VM)"], ["ADB to DB", "X × 100 / (100 − IM)"], ["DB to DAF", "X × 100 / (100 − Ash DB)"], ["ADB to AR", "X × (100 − TM) / (100 − IM)"], ["TM from ADL and RM", "ADL + RM × (100 − ADL) / 100"]];
function pFormulas(b, m) {
  const c = card(b, m, "Formulas card"); sectionHead(b, c, "Formulas", 5); note(b, c, "Formulas can't be edited in v1. A change comes as a new version with the release notes.");
  FORMULAS.forEach((r, i) => item(b, c, i, name(b, r[0]), (top) => txt(b, top, "v1", "Data", "Text/text-secondary", "Version"), [[r[1], "Data", "Text/foreground"], ["Used since 1 Oct 2026", "Caption/Regular", "Text/text-muted"]], true));
}

// ---------- tablet ----------
function tRules(b, p) {
  const c = card(b, p, "Rules card"); sectionHead(b, c, "Validation rules", 33); note(b, c, "Fixed rules come from the specification and can't be changed here.");
  table(b, c, [["Rule", 64], ["Applies to", 0], ["Severity", 96], ["Bounds", 190], ["", 40]], RULES, (cell, h, r) => { if (h === "Rule") txt(b, cell, r[0], "Data/Strong", "Text/heading", "Rule"); if (h === "Applies to") txt(b, cell, r[1], "Body small/Regular", "Text/foreground", "Applies", { fill: true }); if (h === "Severity") status(b, cell, r[2]); if (h === "Bounds") txt(b, cell, r[3], "Body small/Regular", "Text/text-secondary", "Bounds", { fill: true }); if (h === "") (/fixed/.test(r[3]) ? icon(b, cell, "lock-simple", "Text/text-muted", 14) : iconBtn(b, cell, "pencil-simple")); }, { h: 56 });
}
function tTemplates(b, p) {
  const c = card(b, p, "Templates card"); sectionHead(b, c, "House CoA template", null, "New version"); note(b, c, "One template in v1; templates per client are next goal. Activating a version changes new CoAs only.");
  table(b, c, [["Version", 72], ["Status", 100], ["Changed by", 0], ["Date", 110], ["", 40]], [["v3", "Draft", "Wahyu Pratama", "5 Nov 2026"], ["v2", "Active", "Wahyu Pratama", "20 Oct 2026"], ["v1", "Archived", "Wahyu Pratama", "1 Oct 2026"]], (cell, h, r) => { if (h === "Version") txt(b, cell, r[0], "Data/Strong", "Text/heading", "Version"); if (h === "Status") status(b, cell, r[1]); if (h === "Changed by") txt(b, cell, r[2], "Body small/Regular", "Text/foreground", "By"); if (h === "Date") txt(b, cell, r[3], "Body small/Regular", "Text/text-secondary", "Date"); if (h === "") iconBtn(b, cell, "dots-three"); }, { h: 52 });
}
function tLookups(b, p) {
  const c = card(b, p, "Lookups card"); sectionHead(b, c, "Lookups", 5, "Add value");
  const t = tabs(b, c, [["Sample conditions", 5], ["Hold reasons", 4], ["Photo tags", 3], ["Lithology kinds", 3], ["Send channels", 4]], 0); b.raw("node.set", { ids: [t], props: { clip: true } });
  table(b, c, [["Order", 60], ["Value", 0], ["Needs a remark", 130], ["Status", 96], ["", 40]], [["1", "Good", "No"], ["2", "Damaged", "Yes"], ["3", "Wet", "Yes"], ["4", "Short", "Yes"], ["5", "No tag", "Yes"]], (cell, h, r) => { if (h === "Order") txt(b, cell, r[0], "Body small/Regular", "Text/text-muted", "Order"); if (h === "Value") txt(b, cell, r[1], "Body small/SemiBold", "Text/heading", "Value"); if (h === "Needs a remark") txt(b, cell, r[2], "Body small/Regular", "Text/text-secondary", "Remark"); if (h === "Status") status(b, cell, "Active"); if (h === "") iconBtn(b, cell, "dots-three"); }, { h: 48 });
}
function tLab(b, p) {
  settingsCard(b, p, "Laboratory", (c) => { const r = hframe(b, c, "Logo", 16, { sizeH: "fill", cross: "center" }); const lg = b.instV(r, "Logo", "Type=Full, Color=Default"); b.raw("transform.scale", { ids: [lg], factor: 168 / 990 }); btn(b, r, "Secondary", "Replace logo", "upload-simple", { size: "md" }); tf(b, c, "Laboratory name", "PT Sentra Geo Survey Indonesia"); b.instV(c, "Textarea", "State=Filled, Size=md", { texts: { Label: "Address", Value: "Jl. Pangeran Antasari 12, Samarinda, Kalimantan Timur" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); const r2 = hframe(b, c, "Row", 12, { sizeH: "fill" }); tf(b, r2, "Accreditation number", "LP-1234-IDN"); tf(b, r2, "Place of issue", "Samarinda"); });
  settingsCard(b, p, "Numbering", (c) => { const pair = (a, av, bb, bv) => { const r = hframe(b, c, "Row", 12, { sizeH: "fill" }); tf(b, r, a, av); tf(b, r, bb, bv); }; pair("Job order", "JO-YYYY-NNNN", "Batch", "B-YYYY-NNNN"); pair("Sample ID", "SG.YYMMDD.CCC.BB.NNN", "Sample code", "CCC.BB.NNN.Lotxx"); pair("CoA", "CoA-{job order}-{revision}", "Branch RI", "Rapak Indah"); txt(b, c, "New numbers follow the pattern; existing numbers never change.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); });
  footerBtns(b, p);
}
function tFormulas(b, p) {
  const c = card(b, p, "Formulas card"); sectionHead(b, c, "Formulas", 5); note(b, c, "Formulas can't be edited in v1. A change comes as a new version with the release notes.");
  table(b, c, [["Name", 0], ["Expression", 290], ["Version", 70]], FORMULAS.map((r) => [...r, "v1"]), (cell, h, r) => { if (h === "Name") { const v = vframe(b, cell, "Name", 2); txt(b, v, r[0], "Body small/SemiBold", "Text/heading", "Name"); txt(b, v, "Used since 1 Oct 2026", "Caption/Regular", "Text/text-muted", "Since"); } if (h === "Expression") txt(b, cell, r[1], "Data", "Text/foreground", "Expression"); if (h === "Version") txt(b, cell, "v1", "Data", "Text/text-secondary", "Version"); }, { h: 56 });
}

const PH = [["03", "Services", "Services", pServices], ["04", "Methods_and_standards", "Methods and standards", pMethods], ["05", "Validation_rules", "Validation rules", pRules], ["06", "Report_templates", "Report templates", pTemplates], ["07", "Lookups", "Lookups", pLookups], ["08", "Laboratory", "Laboratory", pLab], ["09", "Security", "Security", pSecurity], ["10", "Formulas", "Formulas", pFormulas]];
const TB = [["04", "Methods_and_standards", "Methods and standards", (b, r) => methods(b, r)], ["05", "Validation_rules", "Validation rules", tRules], ["06", "Report_templates", "Report templates", tTemplates], ["07", "Lookups", "Lookups", tLookups], ["08", "Laboratory", "Laboratory", tLab], ["09", "Security", "Security", (b, r) => security(b, r)], ["10", "Formulas", "Formulas", tFormulas]];
const vv = (screen) => (screen === "Formulas" ? ["01", "View"] : screen === "Laboratory" || screen === "Security" ? ["01", "Default"] : screen === "Methods_and_standards" ? ["01", "Matrix"] : ["01", "List"]);
const nm = (kind, ss, screen) => `${kind}-14-Configuration-${ss}-${screen}-${vv(screen).join("-")}`;

exports.build = (b) => {
  const N = b.reg.N;
  const at = (n) => { for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (N[id].name === n) return { x: N[id].transform[4], y: N[id].transform[5] }; return null; };
  const ph0 = at("Phone-14-Configuration-02-Parameters-01-List"), tb0 = at("Tablet-14-Configuration-03-Services-01-List");
  if (!ph0 || !tb0) throw new Error("base frames not found");
  const KINDS = process.env.OCFG_KINDS || "phone,tablet"; const mine = new Set([...(KINDS.includes("phone") ? PH.map(([ss, sc]) => nm("Phone", ss, sc)) : []), ...(KINDS.includes("tablet") ? TB.map(([ss, sc]) => nm("Tablet", ss, sc)) : [])]);
  const old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (mine.has(N[id].name)) old.push(id);
  if (old.length) b.raw("edit.delete", { ids: old });
  if (KINDS.includes("phone")) PH.forEach(([ss, sc, on, fn], i) => { const [v, vn] = vv(sc); page(b, "phone"); configFrame(b, ph0.x + 510 * (i + 1), ph0.y, "phone", ss, sc, v, vn, on, (m) => fn(b, m)); });
  if (KINDS.includes("tablet")) TB.forEach(([ss, sc, on, fn], i) => { const [v, vn] = vv(sc); page(b, "tablet"); configFrame(b, tb0.x + 954 * (i + 1), tb0.y, "tablet", ss, sc, v, vn, on, (m) => fn(b, m)); });
};
exports.X = { item, note, divider, stack, name };
