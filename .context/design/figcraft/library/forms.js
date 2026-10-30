const { section } = require("./found.js");
const { pill } = require("./status.js");

const FS = ["Default", "Hover", "Focused", "Filled", "Error", "Disabled", "Read-only"];
function boxLook(st) {
  return {
    Default: { stroke: "Surface/border-strong", fill: "Surface/card", text: "Text/text-muted" },
    Hover: { stroke: "Primary/primary-300", fill: "Surface/card", text: "Text/text-muted" },
    Focused: { stroke: "Primary/primary", fill: "Surface/card", text: "Text/foreground", ring: true },
    Filled: { stroke: "Surface/border-strong", fill: "Surface/card", text: "Text/foreground" },
    Error: { stroke: "Feedback/error", fill: "Surface/card", text: "Text/foreground" },
    Disabled: { stroke: "Surface/border", fill: "Surface/muted", text: "Text/text-muted" },
    "Read-only": { stroke: "Surface/border", fill: "Surface/muted", text: "Text/foreground" },
  }[st];
}
const FIELD_W = 280;
function field(b, pan, kind) {
  const variants = [];
  const trail = { "Text field": null, Select: "caret-down", "Date field": "calendar-blank", Textarea: null }[kind];
  for (const size of ["md", "touch"]) for (const st of FS) {
    const k = boxLook(st), bh = kind === "Textarea" ? 88 : size === "md" ? 40 : 44;
    variants.push({
      name: `State=${st}, Size=${size}`, w: FIELD_W, h: 80,
      frame: { layout: "v", gap: 6, pad: 0, sizeH: "fixed", sizeV: "hug", fill: "none" },
      build(cid) {
        const label = b.text(cid, "Label", { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Label", fill: true });
        const box = b.frame(cid, { name: "Input", w: FIELD_W, h: bh, fill: k.fill, stroke: k.stroke, sw: 1, r: 8, layout: "h", gap: 8, pad: kind === "Textarea" ? [10, 12, 10, 12] : [0, 12, 0, 12], cross: kind === "Textarea" ? "min" : "center", sizeH: "fill", sizeV: "fixed" });
        const val = b.text(box, kind === "Select" || st === "Filled" || st === "Read-only" ? "Value" : "Placeholder", { style: "Body/Regular", color: k.text, name: "Value", fill: true });
        let tr;
        if (trail) tr = b.icon(box, trail, 14, "Text/text-secondary");
        if (k.ring) b.raw("style.apply", { ids: [box], style: "Focus ring" });
        const help = b.text(cid, st === "Error" ? "This field is required" : "Helper text", { style: "Caption/Regular", color: st === "Error" ? "Feedback/error" : "Text/text-muted", name: "Helper", fill: true });
        return { Label: label, Value: val, Helper: help, "Show helper": help };
      },
    });
  }
  return b.set(pan, kind, variants, { cols: 7, cw: 310, ch: 150, W: 7 * 310 + 32, H: 2 * 150 + 32, textProps: ["Label", "Value", "Helper"], bools: [{ name: "Show helper", key: "Show helper", default: true }] });
}

function search(b, pan) {
  const variants = [];
  for (const size of ["md", "lg"]) for (const st of ["Default", "Hover", "Focused", "Filled", "Disabled"]) {
    const k = boxLook(st), h = size === "md" ? 40 : 44;
    variants.push({ name: `Size=${size}, State=${st}`, w: 360, h, frame: { fill: k.fill, stroke: k.stroke, sw: 1, r: 999, layout: "h", gap: 8, pad: [0, 6, 0, 14], cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        b.icon(cid, "magnifying-glass", 14, "Text/text-secondary");
        const val = b.text(cid, st === "Filled" ? "B-2026-0417" : "Search by batch, lab code, or drill hole…", { style: "Body/Regular", color: k.text, name: "Value", fill: true });
        const sc = b.frame(cid, { name: "Scan", w: h - 12, h: h - 12, fill: "Accent/accent-100", r: 999, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
        b.icon(sc, "barcode", 14, "Accent/accent-text");
        if (k.ring) b.raw("style.apply", { ids: [cid], style: "Focus ring" });
        return { Value: val, Scan: sc };
      } });
  }
  b.set(pan, "Search", variants, { cols: 5, cw: 390, ch: 64, W: 5 * 390 + 32, H: 2 * 64 + 32, textProps: ["Value"], bools: [{ name: "Scan", key: "Scan", default: true }] });
}

function toggles(b, pan) {
  const ST = ["Default", "Hover", "Focused", "Disabled"];
  const cb = [];
  for (const ch of ["Off", "On", "Mixed"]) for (const st of ST) {
    const on = ch !== "Off", dis = st === "Disabled";
    cb.push({ name: `Checked=${ch}, State=${st}`, w: 140, h: 20, frame: { layout: "h", gap: 8, pad: 0, cross: "center", sizeH: "hug", sizeV: "hug" },
      build(cid) {
        const box = b.frame(cid, { name: "Box", w: 18, h: 18, fill: dis ? "Surface/muted" : on ? (st === "Hover" ? "Action/action-hover" : "Action/action") : "Surface/card", stroke: on && !dis ? "Action/action" : st === "Hover" ? "Primary/primary-300" : dis ? "Surface/border" : "Surface/border-strong", sw: 1.5, r: 4, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
        if (ch === "On") b.icon(box, "check", 14, dis ? "Text/text-muted" : "Action/action-foreground");
        if (ch === "Mixed") b.frame(box, { name: "Dash", w: 8, h: 2, fill: dis ? "Text/text-muted" : "Action/action-foreground", r: 1 });
        if (st === "Focused") b.raw("style.apply", { ids: [box], style: "Focus ring" });
        return { Label: b.text(cid, "Flag for recheck", { style: "Body/Regular", color: dis ? "Text/text-muted" : "Text/foreground", name: "Label" }) };
      } });
  }
  b.set(pan, "Checkbox", cb, { cols: 4, cw: 180, ch: 44, W: 752, H: 164, textProps: ["Label"] });
  const rd = [];
  for (const sel of ["Off", "On"]) for (const st of ST) {
    const on = sel === "On", dis = st === "Disabled";
    rd.push({ name: `Selected=${sel}, State=${st}`, w: 120, h: 20, frame: { layout: "h", gap: 8, pad: 0, cross: "center", sizeH: "hug", sizeV: "hug" },
      build(cid) {
        const o = b.frame(cid, { name: "Circle", w: 18, h: 18, fill: dis ? "Surface/muted" : "Surface/card", stroke: dis ? "Surface/border" : on ? "Action/action" : st === "Hover" ? "Primary/primary-300" : "Surface/border-strong", sw: 1.5, r: 9, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
        if (on) b.frame(o, { name: "Dot", w: 8, h: 8, fill: dis ? "Text/text-muted" : "Action/action", r: 4 });
        if (st === "Focused") b.raw("style.apply", { ids: [o], style: "Focus ring" });
        return { Label: b.text(cid, "Option", { style: "Body/Regular", color: dis ? "Text/text-muted" : "Text/foreground", name: "Label" }) };
      } });
  }
  b.set(pan, "Radio", rd, { cols: 4, cw: 160, ch: 44, W: 672, H: 120, textProps: ["Label"] });
  const sw = [];
  for (const on of ["Off", "On"]) for (const st of ST) {
    const isOn = on === "On", dis = st === "Disabled";
    sw.push({ name: `On=${on}, State=${st}`, w: 140, h: 20, frame: { layout: "h", gap: 10, pad: 0, cross: "center", sizeH: "hug", sizeV: "hug" },
      build(cid) {
        const tr = b.frame(cid, { name: "Track", w: 36, h: 20, fill: dis ? "Surface/border" : isOn ? (st === "Hover" ? "Action/action-hover" : "Action/action") : st === "Hover" ? "Primary/primary-300" : "Surface/border-strong", r: 10, layout: "h", pad: 2, main: isOn ? "max" : "min", cross: "center", sizeH: "fixed", sizeV: "fixed" });
        b.frame(tr, { name: "Knob", w: 16, h: 16, fill: "Surface/card", r: 8, effects: [{ type: "dropShadow", color: "#0E2A4E33", offset: [0, 1], radius: 2 }] });
        if (st === "Focused") b.raw("style.apply", { ids: [tr], style: "Focus ring" });
        return { Label: b.text(cid, "Comma decimal", { style: "Body/Regular", color: dis ? "Text/text-muted" : "Text/foreground", name: "Label" }) };
      } });
  }
  b.set(pan, "Switch", sw, { cols: 4, cw: 180, ch: 44, W: 752, H: 120, textProps: ["Label"] });
}

function chipsPills(b, pan) {
  const fc = [];
  for (const sel of ["Off", "On"]) for (const st of ["Default", "Hover", "Pressed", "Focused", "Disabled"]) {
    const on = sel === "On", dis = st === "Disabled";
    const fill = dis ? "Surface/muted" : on ? (st === "Hover" ? "Action/action-hover" : st === "Pressed" ? "Action/action-strong" : "Action/action") : { Hover: "Primary/primary-50", Pressed: "Primary/primary-100" }[st] || "Surface/card";
    const text = dis ? "Text/text-muted" : on ? "Action/action-foreground" : "Action/brand-text";
    fc.push({ name: `Selected=${sel}, State=${st}`, w: 90, h: 36, frame: { fill, stroke: on && !dis ? undefined : dis ? "Surface/border" : "Surface/border-strong", sw: 1, r: 999, layout: "h", gap: 6, pad: [0, 14, 0, 14], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" },
      build(cid) {
        if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" });
        const l = b.text(cid, "All", { style: "Body small/SemiBold", color: text, name: "Label" });
        const c = b.text(cid, "128", { style: "Body small/Medium", color: text, name: "Count" });
        const ca = b.icon(cid, "caret-down", 14, text);
        b.raw("node.set", { ids: [ca], props: { visible: false } });
        return { Label: l, Count: c, Caret: ca };
      } });
  }
  b.set(pan, "Filter chip", fc, { cols: 5, cw: 150, ch: 56, W: 782, H: 144, textProps: ["Label", "Count"], bools: [{ name: "Show count", key: "Count", default: true }, { name: "Caret", key: "Caret", default: false }] });
  const pp = [];
  for (const kind of ["Parameter", "Group"]) for (const st of ["Off", "On", "Locked", "Auto-added"]) {
    const fill = { Off: "Surface/card", On: "Action/action", Locked: "Surface/muted", "Auto-added": "Accent/accent-100" }[st];
    const stroke = { Off: "Surface/border-strong", On: undefined, Locked: "Surface/border", "Auto-added": "Accent/accent-soft" }[st];
    const text = { Off: "Text/text-secondary", On: "Action/action-foreground", Locked: "Text/text-secondary", "Auto-added": "Accent/accent-text" }[st];
    pp.push({ name: `Kind=${kind}, State=${st}`, w: 62, h: 32, frame: { fill, stroke, sw: 1, r: kind === "Group" ? 8 : 999, layout: "h", gap: 4, pad: [0, 12, 0, 12], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" },
      build(cid) {
        if (st === "Locked") b.icon(cid, "lock-simple", 14, text);
        if (st === "Auto-added") b.icon(cid, "sparkle", 14, text);
        return { Label: b.text(cid, kind === "Group" ? "Moisture" : "TM", { style: kind === "Group" ? "Body small/SemiBold" : "Body small/Medium", color: text, name: "Label" }) };
      } });
  }
  b.set(pan, "Parameter pill", pp, { cols: 4, cw: 150, ch: 52, W: 632, H: 120, textProps: ["Label"] });
}

function menus(b, pan) {
  const mi = [];
  for (const st of ["Default", "Hover", "Selected", "Destructive", "Disabled"]) {
    const fill = { Hover: "Primary/primary-50", Selected: "Primary/primary-50" }[st] || "none";
    const text = st === "Destructive" ? "Feedback/error" : st === "Disabled" ? "Text/text-muted" : "Text/foreground";
    mi.push({ name: `State=${st}`, w: 220, h: 36, frame: { fill, r: 8, layout: "h", gap: 10, pad: [0, 10, 0, 10], cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        const ic = b.icon(cid, "pencil-simple", 14, text);
        const l = b.text(cid, "Menu item", { style: "Body small/Medium", color: text, name: "Label", fill: true });
        const ck = b.icon(cid, "check", 14, "Action/action");
        b.raw("node.set", { ids: [ic], props: { visible: false } });
        if (st !== "Selected") b.raw("node.set", { ids: [ck], props: { visible: false } });
        return { Label: l, Icon: ic };
      } });
  }
  const r = b.set(pan, "Menu item", mi, { cols: 5, cw: 250, ch: 56, W: 5 * 250 + 32, H: 104, textProps: ["Label"], bools: [{ name: "Icon", key: "Icon", default: false }] });
  // Dropdown menu: a component made of Menu item instances
  const dm = b.component(pan, { name: "Dropdown menu", w: 232, h: 100, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, layout: "v", gap: 2, pad: 6, sizeH: "fixed", sizeV: "hug" });
  b.raw("style.apply", { ids: [dm], style: "Elevation/md" });
  ["Edit contact", "Add contact", "Remove contact"].forEach((t, i) => { const inst = b.inst(dm, "Menu item", i === 2 ? "State=Destructive" : "State=Default"); b.raw("node.set", { ids: [inst + 3], props: { characters: t } }); b.raw("node.set", { ids: [inst], props: { sizingH: "fill" } }); });
}
function options(b, pan) {
  const orv = [];
  for (const st of ["Default", "Hover", "Selected"]) {
    orv.push({ name: `State=${st}`, w: 360, h: 56, frame: { fill: st === "Default" ? "Surface/card" : "Primary/primary-50", stroke: st === "Selected" ? "Primary/primary-300" : "Surface/border", sw: 1, r: 10, layout: "h", gap: 12, pad: [0, 12, 0, 12], cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        const col = b.frame(cid, { name: "Text", w: 200, h: 36, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" });
        const n = b.text(col, "Budi Hartono", { style: "Body/SemiBold", name: "Name" });
        const d = b.text(col, "+62 812 5550 1844 · budi@example.co.id", { style: "Caption/Regular", color: "Text/text-secondary", name: "Detail", fill: true });
        const a = b.frame(cid, { name: "Actions", w: 60, h: 24, layout: "h", gap: 8, sizeH: "hug", sizeV: "hug", cross: "center" });
        b.icon(a, "pencil-simple", 14, "Text/text-secondary"); b.icon(a, "trash-simple", 14, "Feedback/error");
        if (st === "Selected") b.icon(cid, "check", 14, "Action/action");
        return { Name: n, Detail: d, Actions: a };
      } });
  }
  b.set(pan, "Option row", orv, { cols: 3, cw: 400, ch: 84, W: 1232, H: 116, textProps: ["Name", "Detail"], bools: [{ name: "Show actions", key: "Actions", default: true }] });
  const ci = [];
  for (const st of ["Default", "Focused", "Warning", "Error", "Disabled"]) {
    const stroke = { Default: "Surface/border-strong", Focused: "Primary/primary", Warning: "Feedback/warning", Error: "Feedback/error", Disabled: "Surface/border" }[st];
    ci.push({ name: `State=${st}`, w: 96, h: 32, frame: { fill: st === "Disabled" ? "Surface/muted" : st === "Warning" ? "Feedback/warning-100" : st === "Error" ? "Feedback/error-100" : "Surface/card", stroke, sw: 1, r: 6, layout: "h", gap: 4, pad: [0, 8, 0, 8], main: "max", cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        if (st === "Warning") b.icon(cid, "warning", 14, "Feedback/warning");
        if (st === "Error") b.icon(cid, "warning-circle", 14, "Feedback/error");
        if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" });
        return { Value: b.text(cid, "2.40", { style: "Data", color: st === "Disabled" ? "Text/text-muted" : "Text/foreground", name: "Value", align: "right" }) };
      } });
  }
  b.set(pan, "Cell input", ci, { cols: 5, cw: 130, ch: 52, W: 682, H: 84, textProps: ["Value"] });
  const dz = [];
  for (const st of ["Default", "Drag-over", "Uploading", "Error"]) {
    const stroke = { Default: "Surface/border-strong", "Drag-over": "Primary/primary", Uploading: "Primary/primary-300", Error: "Feedback/error" }[st];
    const fill = { Default: "Surface/muted", "Drag-over": "Primary/primary-50", Uploading: "Surface/muted", Error: "Feedback/error-100" }[st];
    dz.push({ name: `State=${st}`, w: 440, h: 120, frame: { fill, stroke, sw: 1.5, dash: [6, 4], r: 12, layout: "v", gap: 6, pad: 16, main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        b.icon(cid, st === "Error" ? "warning-circle" : "upload-simple", 20, st === "Error" ? "Feedback/error" : "Action/brand-text");
        const t = b.text(cid, st === "Uploading" ? "Uploading RoA.pdf…" : st === "Error" ? "This file could not be uploaded" : "Drop the file here, or click to browse", { style: "Body small/SemiBold", color: st === "Error" ? "Feedback/error" : "Text/foreground", name: "Title", align: "center" });
        const h = b.text(cid, "PDF, XLS or CSV · up to 10 MB", { style: "Caption/Regular", color: "Text/text-secondary", name: "Hint", align: "center" });
        return { Title: t, Hint: h };
      } });
  }
  b.set(pan, "Drop zone", dz, { cols: 4, cw: 470, ch: 150, W: 1912, H: 182, textProps: ["Title", "Hint"] });
  const cm = ["Default", "Focused"].map((st) => ({ name: `State=${st}`, w: 180, h: 60, frame: { layout: "v", gap: 4, sizeH: "fixed", sizeV: "hug" },
    build(cid) { const h = b.text(cid, "COLUMN A", { style: "Overline", color: "Text/text-secondary", name: "Header" }); const bx = b.frame(cid, { name: "Select", w: 180, h: 36, fill: "Surface/card", stroke: st === "Focused" ? "Primary/primary" : "Surface/border-strong", sw: 1, r: 8, layout: "h", pad: [0, 10, 0, 10], cross: "center", sizeH: "fill", sizeV: "fixed" }); const v = b.text(bx, "Sample ID", { style: "Body small/Medium", name: "Value", fill: true }); b.icon(bx, "caret-down", 14, "Text/text-secondary"); if (st === "Focused") b.raw("style.apply", { ids: [bx], style: "Focus ring" }); return { Header: h, Value: v }; } }));
  b.set(pan, "Column mapper", cm, { cols: 2, cw: 210, ch: 90, W: 452, H: 122, textProps: ["Header", "Value"] });
  const fh = [{ n: "Off", d: false }, { n: "On", d: true }].map((x) => ({ name: `Has description=${x.n}`, w: 400, h: 40, frame: { layout: "v", gap: 4, sizeH: "fixed", sizeV: "hug" },
    build(cid) { const t = b.text(cid, "COMPANY", { style: "Overline", color: "Accent/accent-text", name: "Title" }); let d; if (x.d) d = b.text(cid, "Who the job order is for and who receives the CoA.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Description", fill: true }); return { Title: t, ...(d ? { Description: d } : {}) }; } }));
  b.set(pan, "Form section header", fh, { cols: 2, cw: 440, ch: 90, W: 912, H: 122, textProps: ["Title", "Description"] });
}

function forms(b, host) {
  const p1 = section(b, host, "Text field · Select · Date field · Textarea", "Label above, box, helper below. Error shows the message in red; Read-only keeps normal text. Size touch (44) for phones.");
  field(b, p1, "Text field"); field(b, p1, "Select"); field(b, p1, "Date field"); field(b, p1, "Textarea");
  const p2 = section(b, host, "Search · Checkbox · Radio · Switch", "Search is pill-shaped with an optional scan button (labels, barcodes).");
  search(b, p2); toggles(b, p2);
  const p3 = section(b, host, "Filter chip · Parameter pill", "Filter chip filters a list. Parameter pill picks analysis parameters; Group toggles a whole group; Locked and Auto-added come from the service rules.");
  chipsPills(b, p3);
  const p4 = section(b, host, "Menus and rows", "Menu item and Dropdown menu; Option row for choosing a contact or signatory; Cell input inside tables; Drop zone for file upload; Column mapper for Paste from Excel.");
  menus(b, p4); options(b, p4);
}
module.exports = { forms };
