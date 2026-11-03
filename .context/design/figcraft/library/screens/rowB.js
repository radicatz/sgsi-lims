// Row B · Create job order: modal (desktop, tablet), phone steps, contact and signatory dropdowns and sheets,
// ash analysis checklist, validation errors, remove-contact dialog, coking coal standards.
const { B } = require("../dsl.js");
const { listDesktop, listTablet } = require("./rowA.js");

const TITLE = (b, x, y, t) => b.text(undefined, t, { style: "Heading/H2", color: "Text/heading", x, y, name: "Row title" });
const Y0 = 2000;

const GROUPS = [
  ["Moisture", ["TM", "IM", "EQM"]], ["Proximate", ["Ash", "VM", "FC"]], ["Sulfur", ["TS", "Forms of sulfur"]], ["Calorific", ["GCV", "NCV"]],
  ["Ultimate", ["C", "H", "N", "O"]], ["Physical", ["HGI", "RD", "Sizing"]], ["Ash", ["AFT red.", "AFT ox.", "Ash analysis ▸", "Metal in ash"]], ["Chemical", ["Cl", "P", "F", "Hg", "Trace elements ▸"]],
];
const CSN = "CSN (Crucible Swelling Number)", GIE = "Gieseler Plastometer", GKC = "Gray King Coke Type", DIL = "Dilatometer Test", SAP = "Sapozhnikov Test", GIX = "G – Index (G Caking Index Test)", CRI = "CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)", MAC = "Maceral Analysis (Petrographic)";
GROUPS.push(["Coking coal", [CSN, GIE, GKC, DIL, SAP, GIX, CRI, MAC]]);
const METHODS = { [GKC]: ["ISO", "GB/T"], [SAP]: ["ISO", "GB/T"], [GIX]: ["ISO", "GB/T"] }; // the others have ASTM, ISO and GB/T methods
const SUB = [CRI];
const ON_STD = new Set(["TM", "IM", "Ash", "VM", "FC", "TS", "GCV"]);
const ON_COKING = new Set(["TM", "IM", "Ash", "VM", "FC", "TS", "GCV", CSN, GIE, DIL, MAC, "P", "Ash analysis ▸", GIX]);

// ---------- small builders ----------
const SZ = (o) => (o.phone ? "touch" : "md");
const fld = (b, parent, set, state, texts, o = {}) => b.instV(parent, set, `State=${state}, Size=${SZ(o)}`, { texts, fills: o.muted ? { Value: "Text/text-muted" } : undefined, props: o.width ? { width: o.width } : { sizingH: "fill" }, setProps: { "Show helper": !!texts.Helper } });
const col = (b, parent, name, gap, W = 672) => b.frame(parent, { name, w: W, h: 100, layout: "v", gap, sizeH: "fill", sizeV: "hug" });
const row = (b, parent, name, gap = 12, W = 672) => b.frame(parent, { name, w: W, h: 70, layout: "h", gap, cross: "min", sizeH: "fill", sizeV: "hug" });
const label = (b, parent, t) => b.text(parent, t, { style: "Body small/SemiBold", color: "Text/text-secondary", name: "Group label" });
const sec = (b, parent, t, W) => { const s = col(b, parent, t, 14, W); b.instV(s, "Form section header", "Has description=Off", { texts: { Title: t }, props: { sizingH: "fill" } }); return s; };

function company(b, s, o) {
  const W = o.phone ? 358 : 672, e = o.err;
  const r0 = o.phone ? col(b, s, "Company row", 14, W) : row(b, s, "Company row", 12);
  fld(b, r0, "Select", e ? "Error" : "Filled", { Label: "Company name *", Value: e ? "Search or add a company" : "PT Bara Nusantara Mandiri", ...(e ? { Helper: "Choose a company, or add a new one." } : {}) }, { ...o, muted: e });
  fld(b, r0, "Text field", "Filled", { Label: "Client reference / PO", Value: "PO 4500-2241" }, o);
  fld(b, s, "Text field", "Filled", { Label: "Company address (optional)", Value: "Jl. Mulawarman No. 12, Samarinda", Helper: "Editing the address here updates the company record." }, o);
  // one contact field; the company's contacts open in a dropdown (desktop) or a sheet (phone). The wrapper anchors the dropdown.
  const w = b.frame(s, { name: "Contact field", w: W, h: 70, layout: "v", sizeH: "fill", sizeV: "hug" });
  const cv = o.phone ? "Budi Hartono · +62 812 5550 1844" : "Budi Hartono · +62 812 5550 1844 · budi@baranusa.co.id";
  fld(b, w, "Select", e ? "Error" : o.contactOpen ? "Focused" : "Filled", { Label: "Contact person *", Value: e ? "Select a contact" : cv, ...(e ? { Helper: "Choose a contact for this job order." } : {}) }, { ...o, muted: e });
  return w;
}

function work(b, s, o) {
  const W = o.phone ? 358 : 672, e = o.err, ck = o.coking;
  label(b, s, "Standard *");
  const chips = b.frame(s, { name: "Standard chips", w: 300, h: 40, layout: "h", gap: 10, sizeH: "fill", sizeV: "hug" });
  (ck ? [["ASTM", "On"], ["ISO", "Off"], ["GB/T", "On"]] : [["ASTM", "On"], ["ISO", "Off"], ["GB/T", "Off"]]).forEach(([l, st]) => b.instV(chips, "Filter chip", `Selected=${st}, State=Default`, { texts: { Label: l }, setProps: { "Show count": false } }));
  const ph = b.frame(s, { name: "Parameters head", w: W, h: 24, layout: "h", main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "hug" });
  b.text(ph, "Parameters *", { style: "Body small/SemiBold", color: "Text/text-secondary", name: "Group label" });
  b.text(ph, (ck ? "15" : "8") + " selected", { style: "Caption/Regular", color: "Text/text-muted", name: "Selected count" });
  const q = b.frame(s, { name: "Quick select", w: 600, h: 36, layout: "h", gap: 4, wrap: true, cross: "center", sizeH: "fill", sizeV: "hug" });
  b.text(q, "Quick select", { style: "Caption/SemiBold", color: "Text/text-muted", name: "Quick label" });
  ["TM + Prox + TS + CV", "Prox only", "Full analysis", "Coking coal", "Preparation only", "Clear"].forEach((t) => b.instV(q, "Button", "Type=Ghost, Tone=Default, Size=sm, State=Default", { texts: { Label: t }, setProps: { "Leading icon": false } }));
  b.instV(s, "Search", `Size=${o.phone ? "lg" : "md"}, State=Default`, { texts: { Value: "Search parameters…" }, props: { sizingH: "fill" }, hide: ["Scan"] });
  const grid = col(b, s, "Parameter groups", 10, W);
  { const pr = b.frame(grid, { name: "Group row", w: W, h: 32, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug", wrap: true });
    if (o.phone) { b.raw("node.set", { ids: [grid], props: { gap: 14 } }); }
    else { const lb = b.frame(pr, { name: "Label cell", w: 96, h: 24, layout: "h", cross: "center", sizeH: "fixed", sizeV: "hug" }); b.text(lb, "Preparation", { style: "Body small/Medium", color: "Text/text-secondary", name: "Group" }); }
    b.instV(pr, "Parameter pill", "Kind=Parameter, State=On", { texts: { Label: "Preparation" } }); }
  const on = ck ? ON_COKING : ON_STD;
  if (o.ash) o.ashGrid = grid;
  GROUPS.forEach(([g, ps]) => {
    const wrap = o.phone ? col(b, grid, "Group", 6, W) : null;
    const r = b.frame(wrap || grid, { name: "Group row", w: W, h: 32, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug", wrap: true });
    if (o.phone) b.text(wrap, g, { style: "Caption/SemiBold", color: "Text/text-muted", name: "Group" }), b.raw("arrange.back", { ids: [r] }), b.raw("arrange.front", { ids: [r] });
    else { const lb = b.frame(r, { name: "Label cell", w: 96, h: 24, layout: "h", cross: "center", sizeH: "fixed", sizeV: "hug" }); b.text(lb, g, { style: "Body small/Medium", color: "Text/text-secondary", name: "Group" }); }
    ps.forEach((p) => {
      const stds = ck ? ["ASTM", "GB/T"] : ["ASTM"], m = METHODS[p];
      const avail = !m || stds.some((x) => m.includes(x));
      const isOn = avail && (on.has(p) || (o.ash && p === "Ash analysis ▸"));
      const tag = SUB.includes(p) ? "Subcontracted" : m ? (m.length === 2 ? "ISO and GB/T" : m[0]) : null;
      const sp = tag ? { "Show tag": true, Tag: b.v("Coverage tag", "Kind=" + tag).id } : {};
      b.instV(r, "Parameter pill", "Kind=Parameter, State=" + (!avail ? "Unavailable" : isOn ? "On" : "Off"), { texts: { Label: o.ash && p === "Ash analysis ▸" ? "Ash analysis 9/29 ▸" : p }, setProps: sp });
    });
  });
  const r1 = o.phone ? col(b, s, "Row", 14, W) : row(b, s, "Row", 12);
  fld(b, r1, "Select", "Filled", { Label: "Sample type", Value: "Exploration cores" }, o);
  fld(b, r1, "Text field", e ? "Error" : "Filled", { Label: "Expected samples *", Value: e ? "e.g. 12" : ck ? "16" : "12", ...(e ? { Helper: "Enter a number of 1 or more." } : {}) }, { ...o, muted: e });
  const r2 = o.phone ? col(b, s, "Row", 14, W) : row(b, s, "Row", 12);
  fld(b, r2, "Date field", "Filled", { Label: "Due date *", Value: "24 Oct 2026", Helper: "Suggested from the template turnaround." }, o);
  fld(b, r2, "Select", "Filled", { Label: "Priority", Value: "Standard" }, o);
}

function tail(b, body, o) {
  const W = o.phone ? 358 : 672;
  let s = sec(b, body, "Report", W);
  const sw = b.frame(s, { name: "Signatory field", w: W, h: 70, layout: "v", sizeH: "fill", sizeV: "hug" }); o.sigWrap = sw;
  fld(b, sw, "Select", o.sigOpen ? "Focused" : "Filled", { Label: "Default signatory (optional)", Value: "Ir. Bambang Sutrisno, M.T." }, o);
  s = sec(b, body, "Notes and files", W);
  b.instV(s, "Textarea", `State=Default, Size=${SZ(o)}`, { texts: { Label: "Notes", Value: "Add a note for the lab…" }, props: { sizingH: "fill" }, setProps: { "Show helper": false } });
  b.instV(s, "Drop zone", "State=Default", { props: { sizingH: "fill" } });
}

// the form: step undefined = whole form
function formBody(b, body, o = {}) {
  const W = o.phone ? 358 : 672;
  if (!o.phone && !o.noSub) b.text(body, "Enter the company's request. Sample IDs come next.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Subtitle" });
  if (o.err) b.instV(body, "Inline alert", "Tone=Error", { texts: { 0: "Fix 3 fields to submit", 1: "Company name, Contact person and Expected samples need a value." }, hide: ["Action"], props: { sizingH: "fill" } });
  if (o.step !== 2) {
    o.contactWrap = company(b, sec(b, body, "Company", W), o);
    work(b, sec(b, body, "Work", W), o);
  }
  if (o.step !== 1) tail(b, body, o);
}

function dialogXl(b, root, x, y, title) {
  const v = b.v("Dialog", "Type=Default, Size=xl");
  const id = b.instV(root, "Dialog", "Type=Default, Size=xl", { texts: { Title: title }, hide: ["Text"], props: { absolute: true, x, y } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: "Cancel" } });
  b.raw("node.set", { ids: [id + btns[2].pos + 3], props: { characters: "Submit" } });
  return { id, body: id + v.names.Body };
}
const scrim = (b, root, W, H) => b.frame(root, { name: "Scrim", w: W, h: H, fill: "#0E2A4E66", absolute: true, x: 0, y: 0, sizeH: "fixed", sizeV: "fixed" });
const FH = 2000;
const page = (b, kind) => b.raw("page.select", { id: b.pageIds[kind] });

// ---------- desktop / tablet frames ----------
function createModal(b, x, y, o) {
  const tablet = o.kind === "tablet";
  page(b, tablet ? "tablet" : "desktop");
  const s = tablet ? listTablet(b, x, y) : listDesktop(b, x, y, { name: o.name });
  b.raw("node.set", { ids: [s.root], props: { name: o.name, sizingV: "fixed", height: o.H || FH } });
  scrim(b, s.root, tablet ? 834 : 1440, o.H || FH);
  const d = dialogXl(b, s.root, tablet ? 57 : 360, 40, "New job order");
  const body = b.frame(d.body, { name: "Form", w: 672, h: 100, layout: "v", gap: 28, sizeH: "fill", sizeV: "hug" });
  formBody(b, body, o);
  return { s, d, o, form: body };
}

// dropdown panel, anchored inside a wrapper frame (absolute x, y relative to that frame)
function panel(b, parent, o) {
  const p = b.frame(parent, { name: o.name, w: o.w || 672, h: 200, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, layout: "v", gap: 6, pad: 8, absolute: true, x: o.x, y: o.y, sizeH: "fixed", sizeV: "hug" });
  b.raw("style.apply", { ids: [p], style: "Elevation/md" });
  return p;
}
const CONTACTS = [["Budi Hartono", "+62 812 5550 1844 · budi@baranusa.co.id"], ["Sari Wulandari", "+62 813 5550 2210"], ["Agus Pratama", "+62 811 5550 0731 · agus@baranusa.co.id"]];
const SIGNERS = [["Ir. Bambang Sutrisno, M.T.", "Head of Laboratory"], ["Dr. Ratna Dewi", "Quality Manager"], ["Hendra Wijaya, S.T.", "Laboratory Manager"]];

function optionRows(b, parent, list, mode, signer) {
  list.forEach(([n, d], i) => {
    b.instV(parent, "Option row", `State=${mode === "edit" ? "Dimmed" : i === 0 ? "Selected" : "Default"}`, { texts: { Name: n, Detail: d }, props: { sizingH: "fill" } });
  });
  if (mode === "edit") {
    const id = b.instV(parent, "Option row", "State=Editing", { props: { sizingH: "fill" } });
    const T = (k, t) => b.raw("node.set", { ids: [id + k], props: { characters: t } });
    if (signer) { T(2, "Name"); T(4, "Marta Simanjuntak, M.Sc."); T(8, "Title"); T(10, "Senior Chemist"); b.raw("node.set", { ids: [id + 12], props: { visible: false } }); }
    else { T(4, "Dewi Anggraini"); T(10, "+62 811 5550 0192"); T(15, "dewi@baranusa.id"); }
  }
  b.instV(parent, "Button", `Type=Tertiary, Tone=Default, Size=md, State=${mode === "edit" ? "Disabled" : "Default"}`, { texts: { Label: signer ? "Add signatory" : "Add contact" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("plus") } });
}

function dropdown(b, x, y, o) {
  const m = createModal(b, x, y, { kind: "desktop", name: o.name, contactOpen: !o.signer, sigOpen: !!o.signer });
  if (o.signer) b.raw("node.set", { ids: [m.form], props: { padding: [0, 0, 220, 0] } }); // room for the open dropdown above the footer
  // positions measured in the Form frame (the panel is its last child so it draws above every field)
  const p = panel(b, m.form, { name: o.signer ? "Signatory dropdown" : "Contact dropdown", x: 0, y: o.signer ? 1458 : 318 });
  optionRows(b, p, o.signer ? SIGNERS : CONTACTS, o.mode, o.signer);
  return m;
}

function ashPopover(b, x, y) {
  const m = createModal(b, x, y, { kind: "desktop", name: "Create · Ash analysis open", ash: true });
  const p = panel(b, m.form, { name: "Ash analysis checklist", x: 240, y: 964, w: 380 });
  const hd = b.frame(p, { name: "Header", w: 364, h: 40, layout: "h", pad: [4, 8, 4, 8], cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
  b.text(hd, "Ash analysis", { style: "Body/SemiBold", color: "Text/heading", name: "Title" });
  b.text(hd, "9 of 29 selected", { style: "Caption/Medium", color: "Text/text-secondary", name: "Count" });
  b.instV(p, "Search", "Size=md, State=Default", { texts: { Value: "Search parameters…" }, props: { sizingH: "fill" }, hide: ["Scan"] });
  const list = b.frame(p, { name: "List", w: 364, h: 200, layout: "v", gap: 2, pad: [4, 8, 4, 8], sizeH: "fill", sizeV: "hug" });
  const items = [["SiO₂", 1], ["Al₂O₃", 1], ["Fe₂O₃", 1], ["CaO", 1], ["MgO", 1], ["Na₂O", 1], ["K₂O", 1], ["TiO₂", 1], ["P₂O₅", 1], ["SO₃", 0], ["Mn₃O₄", 0], ["BaO", 0], ["SrO", 0], ["Cr₂O₃", 0]];
  items.forEach(([t, on]) => b.instV(list, "Checkbox", `Checked=${on ? "On" : "Off"}, State=Default`, { texts: { Label: t } }));
  const ft = b.frame(p, { name: "Footer", w: 364, h: 48, layout: "h", gap: 8, pad: [8, 8, 8, 8], main: "max", cross: "center", sizeH: "fill", sizeV: "hug" });
  b.instV(ft, "Button", "Type=Tertiary, Tone=Default, Size=sm, State=Default", { texts: { Label: "Clear" }, setProps: { "Leading icon": false } });
  b.instV(ft, "Button", "Type=Primary, Tone=Default, Size=sm, State=Default", { texts: { Label: "Done" }, setProps: { "Leading icon": false } });
  return m;
}

function removeContact(b, x, y) {
  const m = dropdown(b, x, y, { name: "Create · Remove contact", mode: "list" });
  scrim(b, m.s.root, 1440, FH);
  const v = b.v("Dialog", "Type=Destructive, Size=sm");
  const id = b.instV(m.s.root, "Dialog", "Type=Destructive, Size=sm", { texts: { Title: "Remove Sari Wulandari from contacts?", Text: "Submitted job orders keep this contact's name on their documents." }, props: { absolute: true, x: 520, y: 640 } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: "Cancel" } });
  b.raw("node.set", { ids: [id + btns[1].pos + 3], props: { characters: "Remove" } });
  return m;
}

// ---------- phone ----------
function phoneForm(b, x, y, o) {
  page(b, "phone");
  const H = o.H;
  const root = b.frame(undefined, { name: o.name, x, y, w: 390, h: H || 900, fill: "Surface/shell", layout: "v", gap: 0, sizeH: "fixed", sizeV: H ? "fixed" : "hug", clip: true });
  const hd = b.frame(root, { name: "Header", w: 390, h: 56, fill: "Surface/card", stroke: "Surface/divider", sw: 1, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", sizeH: "fill", sizeV: "fixed" });
  b.instV(hd, "Icon button", "Type=Ghost, Size=44, State=Default", { swaps: [[0, "Icon", "Glyph=caret-left, Size=20"]] });
  b.text(hd, "New job order", { style: "Heading/H3", color: "Text/heading", name: "Title", fill: true });
  b.instV(hd, "Icon button", "Type=Ghost, Size=44, State=Default", { swaps: [[0, "Icon", "Glyph=x, Size=20"]] });
  const prog = b.frame(root, { name: "Progress", w: 390, h: 40, layout: "v", pad: [12, 16, 0, 16], sizeH: "fill", sizeV: "hug" });
  b.instV(prog, "Mobile step progress", `Step=${o.step || 1}`, { texts: { Label: o.step === 2 ? "Step 2 of 2 · Report, notes, files" : "Step 1 of 2 · Company and work" }, props: { sizingH: "fill" } });
  const body = b.frame(root, { name: "Body", w: 390, h: 400, layout: "v", gap: 24, pad: [16, 16, 24, 16], sizeH: "fill", sizeV: "hug" });
  formBody(b, body, { phone: true, step: o.step, err: o.err, noSub: false });
  if (!o.noBar) {
    const bar = b.frame(root, { name: "Sticky bar", w: 390, h: 76, fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "h", gap: 10, pad: 16, cross: "center", sizeH: "fill", sizeV: "fixed", absolute: false });
    if (o.step === 2) {
      b.instV(bar, "Button", "Type=Secondary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Back" }, setProps: { "Leading icon": false } });
      b.instV(bar, "Button", "Type=Primary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Submit" }, setProps: { "Leading icon": false }, props: { sizingH: "fill" } });
    } else {
      b.instV(bar, "Button", "Type=Secondary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Save as draft" }, setProps: { "Leading icon": false } });
      b.instV(bar, "Button", "Type=Primary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Next" }, setProps: { "Leading icon": false }, props: { sizingH: "fill" } });
    }
  }
  return { root, body };
}

function bottomSheet(b, root, H, title, sheetH) {
  const v = b.v("Bottom sheet");
  const id = b.instV(root, "Bottom sheet", undefined, { texts: { Title: title }, props: { absolute: true, x: 0, y: H - sheetH, width: 390 } });
  b.raw("node.set", { ids: [id + v.names.Footer], props: { visible: false } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug" } });
  b.raw("node.set", { ids: [id], props: { sizingV: "hug" } });
  return { id, body: id + v.names.Body, v };
}

function phoneSheet(b, x, y, o) {
  const H = 844;
  const f = phoneForm(b, x, y, { name: o.name, step: o.step, H, noBar: true });
  scrim(b, f.root, 390, H);
  const sh = bottomSheet(b, f.root, H, o.title, o.sheetH);
  if (o.kind === "ash") {
    const list = b.frame(sh.body, { name: "List", w: 342, h: 200, layout: "v", gap: 2, sizeH: "fill", sizeV: "hug" });
    b.instV(list, "Search", "Size=lg, State=Default", { texts: { Value: "Search parameters…" }, props: { sizingH: "fill" }, hide: ["Scan"] });
    [["SiO₂", 1], ["Al₂O₃", 1], ["Fe₂O₃", 1], ["CaO", 1], ["MgO", 1], ["Na₂O", 1], ["K₂O", 1], ["TiO₂", 1], ["P₂O₅", 1], ["SO₃", 0]].forEach(([t, on]) => b.instV(list, "Checkbox", `Checked=${on ? "On" : "Off"}, State=Default`, { texts: { Label: t } }));
  } else {
    const list = b.frame(sh.body, { name: "List", w: 342, h: 200, layout: "v", gap: 6, sizeH: "fill", sizeV: "hug" });
    optionRows(b, list, o.signer ? SIGNERS : CONTACTS, o.mode, o.signer);
  }
  return f;
}

exports.build = (b, only) => {
  // a rebuild replaces what row B drew before, on all three size pages
  const N = b.reg.N, old = [];
  for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) { const n = N[id]; if ((/^(Create|Contact |Signatory |Ash analysis)(?!.*reference$)/.test(n.name || "") || /^(Desktop|Tablet|Phone)-03-Job_orders-02-/.test(n.name || "")) || (n.name === "Row title" && /^B( ·|  )/.test(n.characters || ""))) old.push(id); }
  if (old.length) b.raw("edit.delete", { ids: old });
  // Desktop page: row B sits under row A (y 2000)
  page(b, "desktop"); TITLE(b, 0, Y0 - 90, "B · Create job order");
  createModal(b, 0, Y0, { kind: "desktop", name: "Create · Desktop" });
  createModal(b, 1560, Y0, { kind: "desktop", name: "Create · P1 Validation errors", err: true, H: FH + 150 });
  createModal(b, 3120, Y0, { kind: "desktop", name: "Create · P11 Coking coal, ASTM + GB/T", coking: true, H: FH + 160 });
  const Y1 = Y0 + FH + 360;
  dropdown(b, 0, Y1, { name: "Contact dropdown · List · Desktop", mode: "list" });
  dropdown(b, 1560, Y1, { name: "Contact dropdown · Edit · Desktop", mode: "edit" });
  removeContact(b, 3120, Y1);
  ashPopover(b, 4680, Y1);
  const Y2 = Y1 + FH + 360;
  dropdown(b, 0, Y2, { name: "Signatory dropdown · List · Desktop", mode: "list", signer: true });
  dropdown(b, 1560, Y2, { name: "Signatory dropdown · Edit · Desktop", mode: "edit", signer: true });
  // Tablet page: the list is at x 0
  createModal(b, 1000, 0, { kind: "tablet", name: "Create · Tablet", H: FH });
  // Mobile Phone page: list at x 0, then the create steps and the sheets
  phoneForm(b, 510, 0, { name: "Create · Step 1 · Phone", step: 1 });
  phoneForm(b, 1020, 0, { name: "Create · Step 2 · Phone", step: 2 });
  const Y3 = 2600;
  phoneSheet(b, 0, Y3, { name: "Contact sheet · List · Phone", step: 1, title: "Contact person", mode: "list", sheetH: 324 });
  phoneSheet(b, 510, Y3, { name: "Contact sheet · Edit · Phone", step: 1, title: "Contact person", mode: "edit", sheetH: 528 });
  phoneSheet(b, 1020, Y3, { name: "Signatory sheet · List · Phone", step: 2, title: "Default signatory", mode: "list", signer: true, sheetH: 324 });
  phoneSheet(b, 1530, Y3, { name: "Signatory sheet · Edit · Phone", step: 2, title: "Default signatory", mode: "edit", signer: true, sheetH: 528 });
  phoneSheet(b, 2040, Y3, { name: "Ash analysis sheet · Phone", step: 1, title: "Ash analysis · 9 of 29", kind: "ash", sheetH: 382 });
};
exports.formBody = formBody;
