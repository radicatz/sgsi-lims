const { section } = require("./found.js");
const { TONE } = require("./status.js");

// ---------- small data parts ----------
function progress(b, pan) {
  const v = ["Primary", "Success", "Warning"].map((t) => {
    const c = { Primary: "Action/action", Success: "Status/st-completed", Warning: "Feedback/warning" }[t];
    return { name: `Tone=${t}`, w: 150, h: 20, frame: { layout: "h", gap: 8, pad: 0, cross: "center", sizeH: "fixed", sizeV: "hug" },
      build(cid) {
        const tr = b.frame(cid, { name: "Track", w: 90, h: 6, fill: "Surface/muted", r: 3, sizeH: "fill", sizeV: "fixed" });
        b.frame(tr, { name: "Fill", w: 60, h: 6, fill: c, r: 3 });
        return { Value: b.text(cid, "18/24", { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Value" }) };
      } };
  });
  b.set(pan, "Progress bar", v, { cols: 3, cw: 190, ch: 50, W: 602, H: 82, textProps: ["Value"] });
}
function kvChecklist(b, pan) {
  const kv = ["Inline", "Stacked"].map((l) => ({ name: `Layout=${l}`, w: 320, h: 24, frame: { layout: l === "Inline" ? "h" : "v", gap: l === "Inline" ? 12 : 2, pad: 0, cross: l === "Inline" ? "min" : "min", sizeH: "fixed", sizeV: "hug", main: "min" },
    build(cid) { const k = b.text(cid, "Company", { style: "Caption/Medium", color: "Text/text-muted", name: "Key", w: l === "Inline" ? 110 : undefined, fill: l !== "Inline" }); const v = b.text(cid, "PT Bara Nusantara Mandiri", { style: "Body small/Medium", name: "Value", fill: l === "Inline" }); return { Key: k, Value: v }; } }));
  b.set(pan, "Key-value row", kv, { cols: 2, cw: 360, ch: 60, W: 752, H: 92, textProps: ["Key", "Value"] });
  const ck = ["Done", "Pending", "Warning"].map((st) => {
    const ic = { Done: ["check-circle", "Status/st-completed"], Pending: ["circle", "Text/text-muted"], Warning: ["warning", "Feedback/warning"] }[st];
    return { name: `State=${st}`, w: 320, h: 22, frame: { layout: "h", gap: 8, pad: 0, cross: "center", sizeH: "fixed", sizeV: "hug" },
      build(cid) { b.icon(cid, ic[0], 14, ic[1]); return { Label: b.text(cid, "Every arrived sample has a mass", { style: "Body small/Regular", color: st === "Pending" ? "Text/text-secondary" : "Text/foreground", name: "Label", fill: true }) }; } };
  });
  b.set(pan, "Checklist item", ck, { cols: 3, cw: 360, ch: 50, W: 1112, H: 82, textProps: ["Label"] });
  const gc = [];
  for (const st of ["Input", "Focused", "Calculated", "Out of range", "Warning", "Locked", "Dirty"]) {
    const fill = { Input: "Surface/card", Focused: "Surface/card", Calculated: "Surface/muted", "Out of range": "Feedback/error-100", Warning: "Feedback/warning-100", Locked: "Surface/muted", Dirty: "Accent/accent-100" }[st];
    const stroke = { Input: "Surface/border-strong", Focused: "Primary/primary", Calculated: "Surface/border", "Out of range": "Feedback/error", Warning: "Feedback/warning", Locked: "Surface/border", Dirty: "Accent/accent-soft" }[st];
    const tc = { Locked: "Text/text-muted", Calculated: "Text/text-secondary", "Out of range": "Feedback/error" }[st] || "Text/foreground";
    gc.push({ name: `State=${st}`, w: 120, h: 36, frame: { fill, stroke, sw: 1, r: 4, layout: "h", gap: 6, pad: [0, 10, 0, 10], main: "max", cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        if (st === "Calculated") b.icon(cid, "function", 14, "Text/text-muted");
        if (st === "Out of range") b.icon(cid, "warning-circle", 14, "Feedback/error");
        if (st === "Warning") b.icon(cid, "warning", 14, "Feedback/warning");
        if (st === "Locked") b.icon(cid, "lock-simple", 14, "Text/text-muted");
        if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" });
        return { Value: b.text(cid, st === "Locked" ? "DH-07" : "47,30", { style: "Data", color: tc, name: "Value", align: "right" }) };
      } });
  }
  const hdr = { name: "State=Header", w: 120, h: 44, frame: { fill: "Primary/primary-50", stroke: "Surface/border", sw: 1, r: 4, layout: "v", gap: 0, pad: [6, 10, 6, 10], main: "center", cross: "max", sizeH: "fixed", sizeV: "fixed" },
    build(cid) { const a = b.text(cid, "Ash", { style: "Body small/SemiBold", color: "Text/heading", name: "Value", align: "right" }); b.text(cid, "% · adb", { style: "Caption/Regular", color: "Text/text-secondary", name: "Unit", align: "right" }); return { Value: a }; } };
  gc.push(hdr);
  b.set(pan, "Grid cell", gc, { cols: 8, cw: 150, ch: 70, W: 8 * 150 + 32, H: 102, textProps: ["Value"] });
}

// ---------- table ----------
const COLS = {
  Batch: [["Batch no.", 150, "mono", "B-2026-0417"], ["Company", 240, "two", ["PT Bukit Asam", "Exploration · DH-BKA-007"]], ["Batch date", 110, "text", "14 Oct 2026"], ["Deadline", 110, "text", "21 Oct 2026"], ["Samples", 180, "progress", "18/24"], ["Status", 150, "badge", "Analysis"], ["RoA", 130, "files", ["PDF", "XLS"]], ["", 40, "more"]],
  "Job order": [["No.", 150, "mono", "JO-2026-0142"], ["Client", 260, "two", ["PT Bara Nusantara Mandiri", "Attn. Budi Hartono · PO 4500-2241"]], ["Service", 200, "text", "Prox + TM + TS + CV"], ["Samples", 90, "num", "12 / 12"], ["Batches", 90, "num", "0 / 1"], ["Due", 110, "text", "24 Oct 2026"], ["Status", 150, "badge", "In progress"], ["CoA", 130, "tag", "CoA missing"], ["", 40, "more"]],
  "Drill hole": [["Code", 190, "mono", "BTBB_035-R2"], ["Total samples", 130, "num", "19"], ["RoA", 220, "files3", ["PDF", "XLS", "CSV"]], ["CoA", 150, "tag", "No CoA"], ["", 40, "more"]],
  Sample: [["#", 40, "num", "1"], ["Sample ID", 140, "mono", "BNM-3401"], ["Client description", 260, "text", "Ply A1 upper"], ["Depth / lot reference", 230, "text", "DH-BNM-021 · 14.20-14.55 m"], ["Remarks", 140, "text", "Composite"], ["Batch", 130, "mono", "B-2026-0420"], ["Status", 130, "badge", "Registered"]],
  Reception: [["#", 40, "num", "1"], ["Sample ID", 130, "mono", "BNM-3501"], ["Lab code", 110, "mono", "B0420-01"], ["Arrived", 80, "check"], ["Mass received (kg)", 150, "input", "2.40"], ["Condition", 140, "select", "Good"], ["Remarks", 170, "text", "Wet on arrival"], ["Label", 140, "tag", "Printed"]],
  Preparation: [["#", 40, "num", "1"], ["Sample ID", 130, "mono", "BNM-3501"], ["Lab code", 110, "mono", "B0420-01"], ["ADL (%)", 110, "input", "4.19"], ["Mass after prep (g)", 150, "input", "1850"], ["Top size (mm)", 130, "input", "0.212"], ["Performer", 160, "person", "Dedi K."], ["Saved", 120, "tag", "Saved"]],
  "Paste preview": [["Sample ID", 140, "mono", "BNM-3409"], ["Client description", 260, "text", "Ply E1 upper"], ["Depth / lot reference", 230, "text", "DH-BNM-027 · 6.10-6.45 m"], ["Remarks", 140, "text", "—"], ["Check", 120, "tag", "New"]],
};
function cell(b, parent, w, kind, v, hdr) {
  const f = b.frame(parent, { name: "Cell", w, h: 40, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", main: kind === "num" ? "max" : "min", sizeH: "fixed", sizeV: "fixed" });
  const t = (s, st, c) => b.text(f, s, { style: st, color: c || "Text/foreground", name: "Text" });
  if (kind === "mono") t(v, "Data/Strong", "Text/heading");
  else if (kind === "text") t(v, "Body small/Regular");
  else if (kind === "num") t(v, "Body small/Regular");
  else if (kind === "two") { const c = b.frame(f, { name: "Two lines", w: w - 16, h: 36, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" }); b.text(c, v[0], { style: "Body small/SemiBold", name: "Primary", fill: true }); b.text(c, v[1], { style: "Caption/Regular", color: "Text/text-secondary", name: "Secondary", fill: true }); }
  else if (kind === "badge") b.instT(f, "Status badge", `Status=${v}, Size=md`);
  else if (kind === "progress") b.instT(f, "Progress bar", "Tone=Primary", { Value: v });
  else if (kind === "files" || kind === "files3") v.forEach((x) => b.inst(f, "File chip", `Type=${x}, State=Available`));
  else if (kind === "tag") b.inst(f, "Tag", `Type=${v}`);
  else if (kind === "more") b.inst(f, "Icon button", "Type=Ghost, Size=32, State=Default");
  else if (kind === "input") b.instT(f, "Cell input", "State=Default", { Value: v }, { width: w - 24 });
  else if (kind === "check") { const bx = b.frame(f, { name: "Box", w: 18, h: 18, fill: "Action/action", r: 4, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); b.icon(bx, "check", 14, "Action/action-foreground"); }
  else if (kind === "select") { const s = b.frame(f, { name: "Select", w: w - 16, h: 32, fill: "Surface/card", stroke: "Surface/border-strong", sw: 1, r: 6, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: "fill", sizeV: "fixed" }); b.text(s, v, { style: "Body small/Regular", name: "Value", fill: true }); b.icon(s, "caret-down", 14, "Text/text-secondary"); }
  else if (kind === "person") { b.instT(f, "Avatar", "Size=24", { Initials: "DK" }); t(v, "Body small/Regular"); }
  return f;
}
function table(b, pan) {
  const hv = [], rv = [];
  for (const [tpl, cols] of Object.entries(COLS)) {
    const W = cols.reduce((a, c) => a + c[1], 0) + 32;
    hv.push({ name: `Template=${tpl}`, w: W, h: 44, frame: { fill: "Primary/primary-50", r: 8, layout: "h", gap: 0, pad: [0, 16, 0, 16], cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) { cols.forEach(([h, w, kind]) => { const f = b.frame(cid, { name: "Head", w, h: 40, layout: "h", gap: 4, pad: [0, 8, 0, 8], cross: "center", main: kind === "num" ? "max" : "min", sizeH: "fixed", sizeV: "fixed" }); if (h) { b.text(f, h, { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Label" }); if (["Deadline", "Batch date", "Samples", "Status"].includes(h) && tpl === "Batch") b.icon(f, "arrows-down-up", 14, "Text/text-muted"); } }); } });
    for (const st of ["Default", "Hover", "Selected", "Error", "Locked"]) {
      const fill = { Default: "Surface/card", Hover: "Primary/primary-50", Selected: "Primary/primary-100", Error: "Feedback/error-100", Locked: "Surface/muted" }[st];
      rv.push({ name: `Template=${tpl}, State=${st}`, w: W, h: 57, frame: { fill, layout: "v", gap: 0, pad: 0, sizeH: "fixed", sizeV: "hug" },
        build(cid) {
          const row = b.frame(cid, { name: "Row", w: W, h: 56, layout: "h", gap: 0, pad: [0, 16, 0, 16], cross: "center", sizeH: "fill", sizeV: "fixed" });
          cols.forEach(([h, w, kind, val]) => cell(b, row, w, kind, val));
          b.frame(cid, { name: "Divider", w: W, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
          if (st === "Locked") b.raw("node.set", { ids: [cid], props: { opacity: 1 } });
        } });
    }
  }
  b.set(pan, "Table header row", hv, { cols: 1, cw: 1500, ch: 60, W: 1540, H: hv.length * 60 + 32 });
  b.set(pan, "Table row", rv, { cols: 1, cw: 1500, ch: 76, W: 1540, H: rv.length * 76 + 32 });
}

function cards(b, pan) {
  // KPI
  const kv = ["Delta", "Progress"].map((k) => ({ name: `Kind=${k}`, w: 300, h: 130, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 8, pad: 18, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const l = b.text(cid, "Samples received", { style: "Caption/Medium", color: "Text/text-secondary", name: "Label" });
      const row = b.frame(cid, { name: "Value row", w: 250, h: 40, layout: "h", gap: 10, cross: "center", sizeH: "fill", sizeV: "hug" });
      const n = b.text(row, "1,284", { style: "Number/Display", color: "Text/heading", name: "Number" });
      if (k === "Delta") b.inst(row, "Delta", "Direction=Up");
      if (k === "Progress") b.instT(cid, "Progress bar", "Tone=Primary", { Value: "18/24" });
      const c = b.text(cid, "Last 30 days · 46 batches", { style: "Caption/Regular", color: "Text/text-muted", name: "Caption", fill: true });
      return { Label: l, Number: n, Caption: c };
    } }));
  b.set(pan, "Card KPI", kv, { cols: 2, cw: 340, ch: 170, W: 712, H: 202, textProps: ["Label", "Number", "Caption"] });
  // Panel
  const pv = ["Off", "On"].map((f) => ({ name: `Footer=${f}`, w: 392, h: 200, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 12, pad: 20, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const h = b.frame(cid, { name: "Header", w: 350, h: 28, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
      const t = b.text(h, "Batch workflow", { style: "Heading/H3", color: "Text/heading", name: "Title", fill: true });
      b.inst(h, "Icon button", "Type=Secondary, Size=32, State=Default");
      const body = b.frame(cid, { name: "Body", w: 350, h: 100, fill: "Surface/muted", r: 8, layout: "v", main: "center", cross: "center", sizeH: "fill", sizeV: "fixed" });
      if (f === "On") { const ft = b.frame(cid, { name: "Footer", w: 350, h: 20, layout: "h", gap: 8, main: "spaceBetween", sizeH: "fill", sizeV: "hug" }); b.text(ft, "Open batches", { style: "Caption/Regular", color: "Text/text-muted", name: "FooterLabel" }); b.text(ft, "46 · 258 samples", { style: "Caption/SemiBold", name: "FooterValue" }); }
      return { Title: t, Body: body };
    } }));
  b.set(pan, "Card panel", pv, { cols: 2, cw: 440, ch: 280, W: 912, H: 312, textProps: ["Title"], slots: [{ key: "Body", name: "Body" }] });
  // Callout
  const cv = ["Alert", "Info"].map((k) => ({ name: `Tone=${k}`, w: 392, h: 190, frame: { fill: k === "Alert" ? "Primary/primary-deep" : "Primary/primary-50", stroke: k === "Alert" ? undefined : "Primary/primary-200", sw: 1, r: 16, layout: "v", gap: 10, pad: 20, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const fg = k === "Alert" ? "Text/text-inverse" : "Text/heading";
      const o = b.text(cid, k === "Alert" ? "DEADLINE ALERT" : "NOTE", { style: "Overline", color: k === "Alert" ? "Accent/accent-soft" : "Accent/accent-text", name: "Overline" });
      const t = b.text(cid, "3 batches due within 24 h", { style: "Heading/H3", color: fg, name: "Title", fill: true });
      const d = b.text(cid, "Batch 0417 is still in preparation. Move two analysts to Proximate to keep the deadline.", { style: "Body small/Regular", color: k === "Alert" ? "Text/text-inverse" : "Text/text-secondary", name: "Text", fill: true });
      b.instT(cid, "Button", "Type=Primary, Tone=Accent, Size=md, State=Default", { Label: "Open batch" }, { sizingH: "fill" });
      return { Title: t, Text: d };
    } }));
  b.set(pan, "Card callout", cv, { cols: 2, cw: 440, ch: 280, W: 912, H: 312, textProps: ["Title", "Text"] });
  // Queue card, queue row, WIP row, activity item, waiting tag
  const qv = ["Default", "Overdue"].map((t) => ({ name: `Tone=${t}`, w: 280, h: 150, frame: { fill: "Surface/card", stroke: t === "Overdue" ? "Feedback/error" : "Surface/border", sw: 1, r: 16, layout: "v", gap: 8, pad: 18, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const h = b.frame(cid, { name: "Head", w: 240, h: 36, layout: "h", gap: 10, cross: "center", sizeH: "fill", sizeV: "hug" });
      const ic = b.frame(h, { name: "Icon", w: 32, h: 32, fill: "Primary/primary-50", r: 10, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); b.icon(ic, "clipboard-text", 20, "Action/brand-text");
      const ti = b.text(h, "RoAs to draft", { style: "Body/SemiBold", color: "Text/heading", name: "Title", fill: true });
      b.icon(h, "caret-right", 14, "Text/text-muted");
      const n = b.text(cid, "4", { style: "Heading/H1", color: "Text/heading", name: "Count" });
      const m = b.text(cid, "Oldest waiting 3 d", { style: "Caption/Regular", color: "Text/text-secondary", name: "Meta" });
      if (t === "Overdue") { const w = b.frame(cid, { name: "Overdue", w: 200, h: 18, layout: "h", gap: 4, cross: "center", sizeH: "hug", sizeV: "hug" }); b.icon(w, "warning", 14, "Feedback/error"); b.text(w, "1 returned · 1 past due", { style: "Caption/Medium", color: "Feedback/error", name: "Warning" }); }
      return { Title: ti, Count: n, Meta: m };
    } }));
  b.set(pan, "Queue card", qv, { cols: 2, cw: 320, ch: 220, W: 672, H: 252, textProps: ["Title", "Count", "Meta"] });
  const wv = [{ name: "Row", w: 560, h: 64, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, layout: "h", gap: 12, pad: [0, 14, 0, 14], cross: "center", sizeH: "fixed", sizeV: "fixed" },
    build(cid) {
      const ic = b.frame(cid, { name: "Icon", w: 36, h: 36, fill: "Accent/accent-100", r: 10, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); b.icon(ic, "file-text", 20, "Accent/accent-text");
      const c = b.frame(cid, { name: "Text", w: 300, h: 36, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" });
      const t = b.text(c, "RoA B-2026-0415 · draft", { style: "Body small/SemiBold", name: "Title", fill: true }); const m = b.text(c, "Started 2 h ago · PT Bukit Asam", { style: "Caption/Regular", color: "Text/text-secondary", name: "Meta", fill: true });
      b.instT(cid, "Button", "Type=Secondary, Tone=Default, Size=sm, State=Default", { Label: "Continue" });
      return { Title: t, Meta: m };
    } }];
  b.set(pan, "WIP row", wv, { cols: 1, cw: 600, ch: 100, W: 632, H: 132, textProps: ["Title", "Meta"] });
  const av = [{ name: "Item", w: 300, h: 56, frame: { layout: "h", gap: 10, pad: 0, cross: "min", sizeH: "fixed", sizeV: "hug" },
    build(cid) { b.instT(cid, "Avatar", "Size=28", { Initials: "HW" }); const c = b.frame(cid, { name: "Text", w: 250, h: 40, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" }); const t = b.text(c, "Hendra Wijaya approved RoA B-2026-0412", { style: "Body small/Regular", name: "Text", fill: true }); const m = b.text(c, "2 h ago", { style: "Caption/Regular", color: "Text/text-muted", name: "Time" }); return { Text: t, Time: m }; } }];
  b.set(pan, "Activity item", av, { cols: 1, cw: 340, ch: 90, W: 372, H: 122, textProps: ["Text", "Time"] });
  const wt = [{ name: "Tag", w: 160, h: 22, frame: { fill: "Status/st-prep-100", r: 999, layout: "h", gap: 4, pad: [0, 10, 0, 8], cross: "center", sizeH: "hug", sizeV: "fixed" }, build(cid) { b.icon(cid, "clock", 14, "Status/st-prep"); return { Label: b.text(cid, "Waiting for Manager review", { style: "Caption/Medium", color: "Status/st-prep", name: "Label" }) }; } }];
  b.set(pan, "Waiting tag", wt, { cols: 1, cw: 200, ch: 60, W: 232, H: 92, textProps: ["Label"] });
}
function data(b, host) {
  progress(b, section(b, host, "Progress bar", "Samples done out of samples in the batch. The fill width is set by hand on each use."));
  kvChecklist(b, section(b, host, "Key-value row · Checklist item · Grid cell", "Key-value row for the Properties panel; Checklist item for 'Before you can start'; Grid cell for the Input RoA grid (Input, Focused, Calculated, Out of range, Warning, Locked, Dirty, Header)."));
  table(b, section(b, host, "Table header row · Table row", "One header and one row per template: Batch, Job order, Drill hole, Sample, Reception, Preparation, Paste preview. Row states: Default, Hover, Selected, Error (duplicate or out of range), Locked."));
  cards(b, section(b, host, "Cards", "KPI, Panel, Callout, Queue card, WIP row, Activity item and Waiting tag (Dashboard and My work)."));
}
module.exports = { data };
