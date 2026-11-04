// Row D · Add batch: modal (desktop, tablet), phone steps 1 and 2, late samples (Revision B). Row E sits below it.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, batches, awaiting, scrimOver } = H;

const DE_NAMES = /^(Add batch ·|CoA · Mark sent|CoA · Sent|Cancel job order ·|(Desktop|Tablet|Phone)-03-Job_orders-0[45]-)/;
// lowest frame on each page, row D and E frames left out (they are rebuilt)
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) {
    let m = 0;
    for (const id of N[pid].children || []) {
      const n = N[id]; if (/ ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$|^(Batch list|Batch detail) ·|-04-Batches-0[12]-/.test(n.name || "") || (n.name === "Row title" && /^[FGH]( ·|  )/.test(n.characters || ""))) continue; if (DE_NAMES.test(n.name || "") || (n.name === "Row title" && /^[DE]( ·|  )/.test(n.characters || ""))) continue;
      const y = n.transform ? n.transform[5] : 0; m = Math.max(m, y + (n.height || 0));
    }
    out[k] = Math.ceil((m + 400) / 100) * 100;
  }
  return out;
}
function clearDE(b) {
  const N = b.reg.N, old = [];
  for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) { const n = N[id]; if (/ ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/.test(n.name || "")) continue; if (DE_NAMES.test(n.name || "") || (n.name === "Row title" && /^[DE]( ·|  )/.test(n.characters || ""))) old.push(id); }
  if (old.length) b.raw("edit.delete", { ids: old });
}

const JO0137 = { no: "JO-2026-0137", company: "PT Kaltara Energi Prima" };
const IDS = Array.from({ length: 16 }, (_, i) => "KEP-" + (3301 + i));
const label = (b, parent, t) => b.text(parent, t, { style: "Body small/SemiBold", color: "Text/text-secondary", name: "Field label" });
const help = (b, parent, t) => b.text(parent, t, { style: "Caption/Regular", color: "Text/text-muted", name: "Help", fill: true });
const col = (b, parent, name, gap, W) => b.frame(parent, { name, w: W, h: 100, layout: "v", gap, sizeH: "fill", sizeV: "hug" });
const row = (b, parent, name, gap, W) => b.frame(parent, { name, w: W, h: 70, layout: "h", gap, cross: "min", sizeH: "fill", sizeV: "hug" });
const SZ = (o) => (o.phone ? "touch" : "md");
const fld = (b, parent, set, state, texts, o = {}) => b.instV(parent, set, `State=${state}, Size=${SZ(o)}`, { texts, props: { sizingH: "fill" }, setProps: { "Show helper": !!texts.Helper } });

function orderLine(b, parent, o) {
  const r = b.frame(parent, { name: "Job order", w: 400, h: 20, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
  b.text(r, o.no, { style: "Data/Strong", color: "Text/heading", name: "Number" });
  b.text(r, o.company, { style: "Body small/Regular", color: "Text/text-secondary", name: "Company" });
  return r;
}
function sampleChecklist(b, parent, o, W) {
  const s = col(b, parent, "Samples", 10, W);
  const hd = b.frame(s, { name: "Head", w: W, h: 20, layout: "h", main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "hug" });
  label(b, hd, "Samples *");
  b.text(hd, o.sel + " of " + o.ids.length + " selected", { style: "Caption/Regular", color: "Text/text-muted", name: "Count" });
  if (o.late) help(b, s, "Awaiting arrival comes first and is ticked for you.");
  const ln = b.frame(s, { name: "Links", w: W, h: 32, layout: "h", gap: 4, cross: "center", sizeH: "fill", sizeV: "hug" });
  ["Select all (" + o.ids.length + ")", "Clear"].forEach((t) => b.instV(ln, "Button", "Type=Ghost, Tone=Default, Size=sm, State=Default", { texts: { Label: t }, setProps: { "Leading icon": false } }));
  const grid = b.frame(s, { name: "Checklist", w: W, h: 100, layout: o.list ? "v" : "h", gap: o.list ? 14 : 8, wrap: !o.list, sizeH: "fill", sizeV: "hug" });
  o.ids.forEach((id, i) => {
    const on = i < o.sel;
    if (o.late && i === 0) {
      const it = b.frame(grid, { name: "Awaiting sample", w: W, h: 32, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
      b.instV(it, "Checkbox", "Checked=On, State=Default", { texts: { Label: id } });
      b.text(it, "Awaiting arrival", { style: "Caption/Medium", color: "Accent/accent-text", name: "State" });
      b.text(it, "from B-2026-0421", { style: "Caption/Regular", color: "Text/text-muted", name: "From" });
      return;
    }
    const c = b.instV(grid, "Checkbox", `Checked=${on ? "On" : "Off"}, State=Default`, { texts: { Label: id } });
    b.raw("node.set", { ids: [c], props: o.list ? { sizingH: "fill" } : { width: Math.floor((W - 24) / 4), sizingH: "fixed" } });
  });
  return s;
}
const PARAMS = [["TM", 1], ["IM", 1], ["Ash", 1], ["VM", 1], ["FC", 1], ["TS", 1], ["GCV", 1], ["HGI", 1], ["NCV", 0], ["RD", 0], ["C", 0], ["H", 0], ["N", 0], ["O", 0]];
function details(b, parent, o, W) {
  const phone = !!o.phone;
  const r1 = phone ? col(b, parent, "Numbers", 14, W) : row(b, parent, "Numbers", 12, W);
  fld(b, r1, "Text field", "Filled", { Label: "Batch no. *", Value: o.batchNo, Helper: "Pattern B-YYYY-NNNN. The number must be unique." }, o);
  fld(b, r1, "Date field", "Read-only", { Label: "Batch date", Value: "27 Oct 2026" }, o);
  fld(b, r1, "Date field", "Filled", { Label: "Deadline", Value: o.deadline }, o);
  if (o.copied) {
    const n = b.frame(parent, { name: "Copied note", w: W, h: 40, fill: "Primary/primary-50", r: 10, layout: "h", gap: 8, pad: [10, 12, 10, 12], cross: "center", sizeH: "fill", sizeV: "hug" });
    const ic = b.instV(n, "Icon", "Glyph=copy, Size=14"); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT["Text/text-secondary"] } }); b.bind(ic + 1, "fill", "Text/text-secondary");
    b.text(n, "Settings copied from B-2026-0421: ASTM, TM + Prox + TS + CV and Standard priority.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Text", fill: true });
  }
  const st = col(b, parent, "Standard", 8, W);
  label(b, st, "Standard *");
  const ch = b.frame(st, { name: "Standard chips", w: 300, h: 40, layout: "h", gap: 10, sizeH: "fill", sizeV: "hug" });
  o.standards.forEach((s, i) => b.instV(ch, "Filter chip", `Selected=${i === 0 ? "On" : "Off"}, State=Default`, { texts: { Label: s }, setProps: { "Show count": false } }));
  help(b, st, o.standards.length > 1 ? "One standard per batch. This job order has ASTM and GB/T." : "One standard per batch. The job order uses ASTM only.");
  if (!o.noSamples) sampleChecklist(b, parent, o, W);
  const pm = col(b, parent, "Parameters", 8, W);
  label(b, pm, "Parameters");
  const pills = b.frame(pm, { name: "Pills", w: W, h: 40, layout: "h", gap: 8, wrap: true, sizeH: "fill", sizeV: "hug" });
  PARAMS.forEach(([p, on]) => b.instV(pills, "Parameter pill", `Kind=Parameter, State=${on && (p !== "HGI" || o.hgi) ? "On" : "Off"}`, { texts: { Label: p } }));
  help(b, pm, o.hgi ? "+ HGI compared with the job order" : "Same parameters as the job order");
  const r2 = phone ? col(b, parent, "More", 14, W) : row(b, parent, "More", 12, W);
  fld(b, r2, "Select", "Filled", { Label: "Priority", Value: "Standard" }, o);
  fld(b, r2, "Text field", "Default", { Label: "CoC no. (optional)", Value: "Chain of custody form" }, o);
  b.instV(parent, "Textarea", `State=Default, Size=${SZ(o)}`, { texts: { Label: "Notes", Value: "Add a note for the lab…" }, props: { sizingH: "fill" }, setProps: { "Show helper": false } });
}

// Add batch modal (Dialog xl, 720) over a Batches tab frame
function modal(b, s, W, H, o) {
  b.raw("node.set", { ids: [s.root], props: { name: o.name, sizingV: "fixed", height: H } });
  scrimOver(b, s.root, W, H);
  const v = b.v("Dialog", "Type=Default, Size=xl");
  const id = b.instV(s.root, "Dialog", "Type=Default, Size=xl", { texts: { Title: "Add batch" }, hide: ["Text"], props: { absolute: true, x: Math.round((W - 720) / 2) + (W === 1440 ? 64 : 0), y: 40 } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: "Cancel" } });
  b.raw("node.set", { ids: [id + btns[1].pos], props: { visible: false } });
  b.raw("node.set", { ids: [id + btns[2].pos + 3], props: { characters: "Create batch" } });
  const body = b.frame(id + v.names.Body, { name: "Form", w: 672, h: 100, layout: "v", gap: 24, sizeH: "fill", sizeV: "hug" });
  orderLine(b, body, o.jo);
  details(b, body, o, 672);
}

function phoneStep(b, x, y, step) {
  page(b, "phone");
  const root = b.frame(undefined, { name: `Add batch · Step ${step} · Phone`, x, y, w: 390, h: 900, fill: "Surface/shell", layout: "v", gap: 0, sizeH: "fixed", sizeV: "hug", clip: true });
  const hd = b.frame(root, { name: "Header", w: 390, h: 56, fill: "Surface/card", stroke: "Surface/divider", sw: 1, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", sizeH: "fill", sizeV: "fixed" });
  b.instV(hd, "Icon button", "Type=Ghost, Size=44, State=Default", { swaps: [[0, "Icon", "Glyph=" + (step === 1 ? "x" : "caret-left") + ", Size=20"]] });
  b.text(hd, "Add batch", { style: "Heading/H3", color: "Text/heading", name: "Title", fill: true });
  const prog = b.frame(root, { name: "Progress", w: 390, h: 40, layout: "v", gap: 4, pad: [12, 16, 0, 16], sizeH: "fill", sizeV: "hug" });
  b.instV(prog, "Mobile step progress", `Step=${step}`, { texts: { Label: `Step ${step} of 2` }, props: { sizingH: "fill" } });
  b.text(prog, step === 1 ? "Samples" : "Details", { style: "Body small/SemiBold", color: "Text/heading", name: "Step title" });
  const body = b.frame(root, { name: "Body", w: 390, h: 400, layout: "v", gap: 20, pad: [16, 16, 24, 16], sizeH: "fill", sizeV: "hug" });
  orderLine(b, body, JO0137);
  const o = { phone: true, jo: JO0137, batchNo: "B-2026-0422", deadline: "28 Oct 2026", standards: ["ASTM", "GB/T"], ids: IDS, sel: 8, hgi: true, list: true };
  if (step === 1) sampleChecklist(b, body, o, 358);
  else details(b, body, { ...o, noSamples: true }, 358);
  const bar = b.frame(root, { name: "Sticky bar", w: 390, h: 76, fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "h", gap: 10, pad: 16, cross: "center", sizeH: "fill", sizeV: "fixed" });
  if (step === 2) b.instV(bar, "Button", "Type=Secondary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Back" }, setProps: { "Leading icon": false } });
  b.instV(bar, "Button", "Type=Primary, Tone=Default, Size=touch, State=Default", { texts: { Label: step === 1 ? "Next (8 selected)" : "Create batch" }, setProps: { "Leading icon": false }, props: { sizingH: "fill" } });
  return root;
}

exports.build = (b) => {
  clearDE(b);
  const Y = bottoms(b);
  b.rowD = Y;
  const base = { jo: JO0137, batchNo: "B-2026-0422", deadline: "28 Oct 2026", standards: ["ASTM", "GB/T"], ids: IDS, sel: 8, hgi: true };
  page(b, "desktop"); TITLE(b, 0, Y.desktop - 90, "D · Add batch");
  modal(b, batches(b, 0, Y.desktop, "desktop", true), 1440, 1200, { ...base, name: "Add batch · Desktop" });
  page(b, "desktop");
  const late = awaiting(b, 1560, Y.desktop);
  modal(b, late, 1440, 1200, { name: "Add batch · Late samples · Desktop", jo: { no: "JO-2026-0139", company: "PT Mahakam Coal Resources" }, batchNo: "B-2026-0422", deadline: "26 Oct 2026", standards: ["ASTM"], ids: ["BNM-3507"], sel: 1, late: true, copied: true, hgi: false });
  page(b, "tablet"); TITLE(b, 0, Y.tablet - 90, "D · Add batch");
  modal(b, batches(b, 0, Y.tablet, "tablet", true), 834, 1200, { ...base, name: "Add batch · Tablet" });
  page(b, "phone"); TITLE(b, 0, Y.phone - 90, "D · Add batch");
  phoneStep(b, 0, Y.phone, 1); phoneStep(b, 510, Y.phone, 2);
  // row E starts below the tallest row D frame on each page
  b.rowE = { desktop: Y.desktop + 1200 + 400, tablet: Y.tablet + 1200 + 400, phone: Y.phone + 1900 + 400 };
};
exports.JO0137 = JO0137;
