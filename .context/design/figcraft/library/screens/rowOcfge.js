// Add-only run: phone edit pages of the Configuration sections + the Parameters phone list with chevrons. Plan: Admin_Screen_Plan.md 15.7.
// build-screens.js Ocfge   (run after Ocfg; deletes only its own frames, by exact name)
const { H } = require("./rowC.js");
const { CFG, CFG2 } = require("./rowO.js");
const { X } = require("./rowOcfg.js");
const { frame, configFrame, sectionHead, status, tf, sel, card, vframe, hframe, txt, icon, btn, pager } = CFG;
const { PARAMS, sw } = CFG2;
const { item, note, name } = X;
const { page } = H;

const swt = (b, p, label, on) => sw(b, p, label, on);
const sub = (b, c, t) => txt(b, c, t, "Heading/H3", "Text/heading", "Group title");
const ta = (b, c, label, value) => b.instV(c, "Textarea", "State=Filled, Size=md", { texts: { Label: label, Value: value }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
const T = { touch: true };
const hint = (b, c, t) => txt(b, c, t, "Caption/Regular", "Text/text-muted", "Note", { fill: true });
const fullBtn = (b, c, kind, label, ic) => { const id = btn(b, c, kind, label, ic, { size: "touch" }); b.raw("node.set", { ids: [id], props: { sizingH: "fill" } }); return id; };

function editFrame(b, x, y, ss, screen, vv, variant, on, title, crumb, build, saveLabel) {
  page(b, "phone");
  const s = frame(b, x, y, "phone", "config", ss, screen, vv, variant, "Superadmin"); const m = s.main;
  b.instV(m, "Breadcrumb", "Levels=3", { texts: { 0: "Configuration", 1: on, 2: crumb } });
  txt(b, m, title, "Heading/H1", "Text/heading", "Title");
  const c = card(b, m, "Form card"); build(c, m);
  const bar = b.instV(s.root, "Sticky action bar", "Breakpoint=Mobile", { texts: { Note: "" }, props: { sizingH: "fill" } }); const v = b.v("Sticky action bar", "Breakpoint=Mobile");
  b.raw("node.set", { ids: [bar + v.texts[1].pos], props: { characters: "Cancel" } }); b.raw("node.set", { ids: [bar + v.texts[2].pos], props: { characters: saveLabel || "Save" } }); b.raw("node.set", { ids: [bar + v.names.Note], props: { visible: false } });
  return s;
}
const FIELDSET = { sizeH: "fill" };

function parametersList(b, x, y) {
  page(b, "phone");
  configFrame(b, x, y, "phone", "02", "Parameters", "01", "List", "Parameters", (m) => {
    const c = card(b, m, "Parameters card"); sectionHead(b, c, "Parameters", 34, "Add parameter");
    PARAMS.slice(0, 6).forEach((r, i) => item(b, c, i, name(b, r[0] + "  " + r[1]), (top) => status(b, top, "Active"), [[`${r[3]}, ${r[2]}, ${r[4]}`]]));
    pager(b, c, "1 / 4", "phone");
  });
}

const GROUPS = [["Moisture", [["TM", 1], ["IM", 1], ["EQM", 0]]], ["Proximate", [["Ash", 1], ["VM", 1], ["FC", 1]]], ["Sulfur", [["TS", 1], ["Forms of sulfur", 0]]], ["Calorific", [["GCV", 1], ["NCV", 0]]], ["Coking coal", [["CSN", 1], ["Gieseler", 1], ["Gray King", 1], ["Dilatometer", 1], ["Sapozhnikov", 1], ["G – Index", 1], ["CRI/CSR", 1], ["Maceral", 1]]]];

exports.build = (b) => {
  const N = b.reg.N;
  const at = (n) => { for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (N[id].name === n) return { x: N[id].transform[4], y: N[id].transform[5] }; return null; };
  const base = at("Phone-14-Configuration-02-Parameters-01-List"); if (!base) throw new Error("Parameters phone frame not found");
  const PX = base.x, Y0 = base.y, EY = Y0 + 1800;
  const EDIT = ["02-Parameters-02-Edit", "03-Services-02-Edit", "04-Methods_and_standards-02-Edit", "05-Validation_rules-02-Edit", "06-Report_templates-02-New_version", "07-Lookups-02-Edit", "08-Laboratory-02-Edit", "09-Security-02-Edit"].map((s) => `Phone-14-Configuration-${s}`);
  const mine = new Set([...EDIT, "Phone-14-Configuration-02-Parameters-01-List"]);
  const old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (mine.has(N[id].name)) old.push(id);
  if (old.length) b.raw("edit.delete", { ids: old });
  parametersList(b, PX, Y0);
  const col = (i) => PX + 510 * i;

  // E1 Parameters, Ash
  editFrame(b, col(0), EY, "02", "Parameters", "02", "Edit", "Parameters", "Edit parameter", "Ash", (c) => {
    tf(b, c, "Name *", "Ash", T); tf(b, c, "Code", "Ash", { ...T, disabled: true }); sel(b, c, "Unit", "%", T); sel(b, c, "Group", "Proximate", T); sel(b, c, "Measured basis", "ADB", T); tf(b, c, "Decimals", "2", T);
    tf(b, c, "Typical range, from", "0", T); tf(b, c, "to", "45", T); hint(b, c, "The typical range feeds rule V-31 (warn).");
    swt(b, c, "Qualified values allowed (<0.01)", false); swt(b, c, "Active", true);
  });
  // E2 Services, Coking coal v3
  editFrame(b, col(1), EY, "03", "Services", "02", "Edit", "Services", "Edit service", "Coking coal", (c) => {
    tf(b, c, "Name *", "Coking coal", T); tf(b, c, "Turnaround target (days)", "12", T); sel(b, c, "Status", "Draft", T);
    const gl = vframe(b, c, "Parameters", 12); txt(b, gl, "Parameters (16 selected)", "Caption/SemiBold", "Text/text-secondary", "Label");
    GROUPS.forEach(([g, ps]) => { const gv = vframe(b, gl, "Group", 6); txt(b, gv, g, "Caption/Medium", "Text/text-secondary", "Group"); const r = hframe(b, gv, "Pills", 8, { sizeH: "fill", wrap: true }); ps.forEach(([pp, on]) => b.instV(r, "Parameter pill", `Kind=Parameter, State=${on ? "On" : "Off"}`, { texts: { Label: pp } })); });
    swt(b, c, "Default for new job orders", false); hint(b, c, "Saving makes version 3. Job orders keep the version they used.");
  }, "Save as version 3");
  // E3 Methods, Ash
  editFrame(b, col(2), EY, "04", "Methods_and_standards", "02", "Edit", "Methods and standards", "Ash methods", "Ash", (c) => {
    [["ASTM", "D3174", "2023", "0.15", "0.30"], ["ISO", "ISO 1171", "2010", "0.20", "0.40"], ["GB/T", "GB/T 212", "2008", "0.20", "0.40"]].forEach(([s, m, e, r, R], i) => {
      if (i) b.frame(c, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
      sub(b, c, s); tf(b, c, "Method", m, T); tf(b, c, "Edition", e, T); tf(b, c, "Repeatability r", r, T); tf(b, c, "Reproducibility R", R, T);
    });
    hint(b, c, "The 2012 edition stays on results entered before.");
  });
  // E4 Validation rule V-31
  editFrame(b, col(3), EY, "05", "Validation_rules", "02", "Edit", "Validation rules", "Edit rule V-31", "V-31", (c) => {
    tf(b, c, "Applies to", "Ash (ADB)", { ...T, disabled: true });
    const g = vframe(b, c, "Severity", 6); txt(b, g, "Severity", "Caption/SemiBold", "Text/text-secondary", "Label"); b.instV(g, "Segmented control", "Items=2, Selected=1", { texts: { 0: "Warn", 1: "Block" } });
    tf(b, c, "Lower bound (%)", "0", T); tf(b, c, "Upper bound (%)", "45", T);
    ta(b, c, "Message shown", "Ash above 45 % is unusual for this lab. Check the value before you save."); swt(b, c, "Active", true);
  });
  // E5 Report template v3
  editFrame(b, col(4), EY, "06", "Report_templates", "02", "New_version", "Report templates", "Version 3 (draft)", "Version 3", (c) => {
    tf(b, c, "Title", "Certificate of Analysis", T); tf(b, c, "Form code", "FM-LAB-014 rev 3", T);
    ta(b, c, "Statement", "Samples were prepared and analysed in accordance with the methods listed. The results relate to the samples as received.");
    ta(b, c, "Terms line", "This certificate may not be reproduced except in full.");
    fullBtn(b, c, "Secondary", "Preview certificate", "file-text"); fullBtn(b, c, "Secondary", "Activate version 3", "check-circle");
    hint(b, c, "Activating makes version 3 the template for new CoAs only.");
  }, "Save draft");
  // E6 Lookups, Wet
  editFrame(b, col(5), EY, "07", "Lookups", "02", "Edit", "Lookups", "Edit condition", "Wet", (c) => {
    tf(b, c, "Value *", "Wet", T); tf(b, c, "Order", "3", T); swt(b, c, "Needs a remark", true); swt(b, c, "Active", true);
  });
  // E7 Laboratory
  editFrame(b, col(6), EY, "08", "Laboratory", "02", "Edit", "Laboratory", "Laboratory", "Edit", (c) => {
    sub(b, c, "Laboratory");
    const r = hframe(b, c, "Logo", 12, { sizeH: "fill", cross: "center", wrap: true }); const lg = b.instV(r, "Logo", "Type=Full, Color=Default"); b.raw("transform.scale", { ids: [lg], factor: 150 / 990 }); btn(b, r, "Secondary", "Replace logo", "upload-simple", { size: "md" });
    tf(b, c, "Laboratory name", "PT Sentra Geo Survey Indonesia", T); ta(b, c, "Address", "Jl. Pangeran Antasari 12, Samarinda, Kalimantan Timur"); tf(b, c, "Accreditation number", "LP-1234-IDN", T); tf(b, c, "Place of issue", "Samarinda", T);
    b.frame(c, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    sub(b, c, "Numbering"); tf(b, c, "Job order", "JO-YYYY-NNNN", T); tf(b, c, "Batch", "B-YYYY-NNNN", T); tf(b, c, "Sample ID", "SG.YYMMDD.CCC.BB.NNN", T); tf(b, c, "Sample code", "CCC.BB.NNN.Lotxx", T); tf(b, c, "CoA", "CoA-{job order}-{revision}", T);
    hint(b, c, "New numbers follow the pattern; existing numbers never change.");
    b.frame(c, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    sub(b, c, "Branch offices"); tf(b, c, "Branch code", "RI", T); tf(b, c, "Branch name", "Rapak Indah", T); fullBtn(b, c, "Secondary", "Add branch", "plus");
    fullBtn(b, c, "Ghost", "Restore defaults");
  });
  // E8 Security
  editFrame(b, col(7), EY, "09", "Security", "02", "Edit", "Security", "Security", "Edit", (c) => {
    sub(b, c, "Sign-in"); tf(b, c, "Lock after failed attempts", "5", T); tf(b, c, "Lock for (minutes)", "15", T);
    b.frame(c, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    sub(b, c, "Session"); tf(b, c, "Sign out after inactivity (minutes)", "30", T); tf(b, c, "Warn before (seconds)", "60", T);
    b.frame(c, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    sub(b, c, "Passwords"); tf(b, c, "Minimum length", "10", T);
    const l = vframe(b, c, "Rules", 10); [["A letter and a number", 1], ["Not the email", 1], ["A special character", 0]].forEach(([t, on]) => b.instV(l, "Checkbox", `Checked=${on ? "On" : "Off"}, State=Default`, { texts: { Label: t } }));
    b.frame(c, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    sub(b, c, "Links"); tf(b, c, "Reset link valid (minutes)", "60", T); tf(b, c, "Invite valid (days)", "7", T);
    fullBtn(b, c, "Ghost", "Restore defaults");
  });
};
