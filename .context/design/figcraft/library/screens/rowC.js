// Row C · Job order detail: Overview, Batches, Samples (stage 1). Frames sit on the page of their size.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");

const TITLE = (b, x, y, t) => b.text(undefined, t, { style: "Heading/H2", color: "Text/heading", x, y, name: "Row title" });
const PAGE = { desktop: "desktop", tablet: "tablet", phone: "phone" };
const page = (b, kind) => b.raw("page.select", { id: b.pageIds[PAGE[kind]] });
const NAMES = /^((Overview|Batches|Samples)( ·|$)(?!.*( edit( dark)?| reference)$)|(Desktop|Tablet|Phone)-03-Job_orders-03-)/;
const WCONTENT = { desktop: 1128, tablet: 698, phone: 358 };
const PAD = { desktop: [28, 32, 40, 32], tablet: [24, 24, 32, 24], phone: [16, 16, 24, 16] };

// ---------- library additions (new sets on the Library page) ----------
const BATCHES = [
  // no, date, std, samples, params, extra, status, prep, analysis, roa, deadline
  ["B-2026-0417", "21 Oct", "ASTM", "12", "TM + Prox + TS + CV", "Same as the job order", "Completed", ["DK", "Dedi Kurniawan", "21 Oct"], ["FH", "Fitri Handayani", "22 Oct"], "RoA-0417", "24 Oct"],
  ["B-2026-0418", "22 Oct", "ASTM", "6", "TM + Prox + TS + CV", "+ HGI compared with the job order", "Analysis", ["DK", "Dedi Kurniawan", "22 Oct"], ["FH", "Fitri Handayani", "Started 23 Oct"], "—", "26 Oct"],
];
exports.BATCHES = BATCHES;

B.prototype.patchC = function () {
  const b = this, N = b.reg.N;
  const oldRows = b.reg.sets["Table row batches"];
  const stale = oldRows && Object.values(oldRows.variants).some((v) => v.texts.some((x) => /Prep: /.test(x.chars)));
  if (oldRows && !stale) { b.fresh = false; return; }
  b.fresh = !stale;
  const byName = (type, name) => Object.values(N).find((n) => n.type === type && n.name === name);
  const keep = {};
  if (stale) for (const nm of ["Table header row batches", "Table row batches"]) { const h = byName("frame", nm + " (set)"); if (h) { keep[nm] = [h.transform ? h.transform[4] : 0, h.transform ? h.transform[5] : 0]; b.raw("edit.delete", { ids: [h.id] }); delete b.reg.sets[nm]; } }
  const pan = byName("frame", "Table row (set)").parent;
  const stdTag = (parent) => { const t = b.frame(parent, { name: "Standard tag", w: 50, h: 22, fill: "Primary/primary-50", stroke: "Primary/primary-200", sw: 1, r: 6, layout: "h", pad: [0, 8, 0, 8], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" }); return [t, b.text(t, "ASTM", { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Standard" })]; };
  // 1. Batches tab table, desktop (full) and compact (tablet): header + row
  const COLS = { Desktop: [["Batch no.", 130], ["Standard", 84], ["Samples", 76], ["Parameters", 0], ["Status", 124], ["Preparation", 0], ["Analysis", 0], ["RoA", 88], ["Deadline", 84], ["", 36]], Compact: [["Batch no.", 140], ["Standard", 90], ["Samples", 80], ["Status", 130], ["Deadline", 80], ["", 36]] };
  const W = { Desktop: 1096, Compact: 560 };
  b.set(pan, "Table header row batches", Object.keys(COLS).map((t) => ({ name: `Template=${t}`, w: W[t], h: 44, frame: { fill: "Primary/primary-50", r: 8, layout: "h", pad: [0, 0, 0, 0], cross: "center", sizeH: "fixed", sizeV: "fixed" },
    build(cid) { COLS[t].forEach(([h, w]) => { const f = b.frame(cid, { name: "Head", w: w || 200, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); b.text(f, h || " ", { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Head label" }); }); } })), { cols: 1, cw: 1200, ch: 70, W: 1240, H: 2 * 70 + 32 });
  const rv = [];
  for (const t of Object.keys(COLS)) for (const st of ["Default", "Hover"]) {
    rv.push({ name: `Template=${t}, State=${st}`, w: W[t], h: 64, frame: { fill: st === "Hover" ? "Primary/primary-50" : "Surface/card", layout: "v", sizeH: "fixed", sizeV: "hug" },
      build(cid) {
        const row = b.frame(cid, { name: "Row", w: W[t], h: 64, layout: "h", pad: [0, 0, 0, 0], cross: "center", sizeH: "fill", sizeV: "fixed" });
        const cell = (w, flex) => b.frame(row, { name: "Cell", w: w || 200, h: 48, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: flex ? "fill" : "fixed", sizeV: "fixed" });
        const two = (c) => b.frame(c, { name: "Two lines", w: 150, h: 36, layout: "v", sizeH: "fill", sizeV: "hug" });
        const o = {};
        let c = cell(t === "Desktop" ? 130 : 140); let tw = two(c); o.No = b.text(tw, "B-2026-0417", { style: "Data/Strong", color: "Text/heading", name: "Number" }); o.Date = b.text(tw, "21 Oct", { style: "Caption/Regular", color: "Text/text-muted", name: "Date" });
        c = cell(t === "Desktop" ? 84 : 90); const [tg, tt] = stdTag(c); o.Std = tt;
        c = cell(t === "Desktop" ? 76 : 80); o.Samples = b.text(c, "12", { style: "Body small/Regular", name: "Samples" });
        if (t === "Desktop") { c = cell(0, true); tw = two(c); o.Params = b.text(tw, "TM + Prox + TS + CV", { style: "Body small/Medium", name: "Parameters" }); o.Extra = b.text(tw, "Same as the job order", { style: "Caption/Regular", color: "Text/text-muted", name: "Extra", fill: true }); }
        c = cell(t === "Desktop" ? 124 : 130); o.Badge = b.instV(c, "Status badge", "Status=Completed, Size=md");
        if (t === "Desktop") {
          for (const [role, ini, nm, dt] of [["Prep", "DK", "PrepName", "PrepDate"], ["Analysis", "FH", "AnalysisName", "AnalysisDate"]]) {
            c = cell(0, true);
            const pr = b.frame(c, { name: role, w: 200, h: 34, layout: "h", gap: 6, cross: "center", sizeH: "fill", sizeV: "hug" });
            o[role + "Av"] = b.instV(pr, "Avatar", "Size=24", { texts: { Initials: ini } });
            const lb = b.frame(pr, { name: "Label", w: 100, h: 34, layout: "v", sizeH: "hug", sizeV: "hug" });
            o[nm] = b.text(lb, role === "Prep" ? "Dedi Kurniawan" : "Fitri Handayani", { style: "Body small/Medium", color: "Text/foreground", name: nm });
            o[dt] = b.text(lb, role === "Prep" ? "21 Oct" : "22 Oct", { style: "Caption/Regular", color: "Text/text-secondary", name: dt });
          }
          c = cell(88); o.RoA = b.text(c, "RoA-0417", { style: "Data", color: "Text/text-secondary", name: "RoA" });
        }
        c = cell(t === "Desktop" ? 84 : 80); o.Due = b.text(c, "24 Oct", { style: "Body small/Regular", name: "Deadline" });
        c = cell(36); { const ic = b.instV(c, "Icon", "Glyph=caret-right, Size=14"); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT["Text/text-muted"] } }); b.bind(ic + 1, "fill", "Text/text-muted"); }
        b.frame(cid, { name: "Divider", w: W[t], h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
        return o;
      } });
  }
  b.set(pan, "Table row batches", rv, { cols: 2, cw: 1200, ch: 90, W: 2440, H: 2 * 90 + 32 });
  if (stale) {
    for (const nm of ["Table header row batches", "Table row batches"]) if (keep[nm]) b.raw("node.set", { ids: [b.sets[nm].holder], props: { x: keep[nm][0], y: keep[nm][1] } });
    b.fresh = false; return;
  }
  // 2. phone batch card
  b.set(pan, "Card batch compact", [{ name: "Property 1=Default", w: 358, h: 88, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 8, pad: 16, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const top = b.frame(cid, { name: "Top", w: 326, h: 24, layout: "h", cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      const no = b.text(top, "B-2026-0417", { style: "Data/Strong", color: "Text/heading", name: "Number" }); const badge = b.instV(top, "Status badge", "Status=Completed, Size=md");
      const meta = b.frame(cid, { name: "Meta", w: 326, h: 22, layout: "h", cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      const l = b.frame(meta, { name: "Left", w: 160, h: 22, layout: "h", gap: 8, cross: "center", sizeH: "hug", sizeV: "hug" }); const [tg, tt] = stdTag(l); const sm = b.text(l, "12 samples", { style: "Caption/Regular", color: "Text/text-secondary", name: "Samples" });
      const due = b.text(meta, "Due 24 Oct", { style: "Caption/Medium", color: "Text/text-secondary", name: "Due" });
      return { Number: no, Std: tt, Samples: sm, Due: due, Badge: badge };
    } }], { cols: 1, cw: 400, ch: 140, W: 440, H: 172 });
  // 3. sample table row with a state line and an action link (Revision B: five sample states)
  const sv = [];
  for (const locked of ["No", "Yes"]) sv.push({ name: `Locked=${locked}`, w: 1102, h: 57, frame: { fill: "Surface/card", layout: "v", sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const row = b.frame(cid, { name: "Row", w: 1102, h: 56, layout: "h", pad: [0, 16, 0, 16], cross: "center", sizeH: "fill", sizeV: "fixed" });
      const cell = (w, flex) => b.frame(row, { name: "Cell", w: w || 200, h: 48, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: flex ? "fill" : "fixed", sizeV: "fixed" });
      const o = {}, tc = locked === "Yes" ? "Text/text-secondary" : "Text/foreground";
      let c = cell(48); o.Idx = b.text(c, "1", { style: "Data", color: "Text/text-muted", name: "Index" });
      c = cell(150); o.Id = b.text(c, "BNM-3401", { style: "Data/Strong", color: "Text/heading", name: "Sample ID" });
      c = cell(0, true); o.Desc = b.text(c, "Ply A1 upper", { style: "Body small/Regular", color: tc, name: "Description", fill: true });
      c = cell(210); o.Depth = b.text(c, "DH-BNM-021 · 14.20-14.55 m", { style: "Body small/Regular", color: tc, name: "Depth", fill: true });
      c = cell(120); o.Rem = b.text(c, "Composite", { style: "Body small/Regular", color: tc, name: "Remarks", fill: true });
      c = cell(120); o.Batch = b.text(c, "—", { style: "Data", color: "Text/text-muted", name: "Batch" });
      c = cell(190); const st = b.frame(c, { name: "State", w: 170, h: 40, layout: "v", gap: 2, sizeH: "fill", sizeV: "hug" });
      o.Badge = b.instV(st, "Status badge", "Status=Expected, Size=md"); o.Sub = b.text(st, "from B-2026-0421", { style: "Caption/Regular", color: "Text/text-muted", name: "Sub", fill: true }); o.Link = b.text(st, "Mark as not received", { style: "Caption/SemiBold", color: "Action/action", name: "Link", fill: true });
      b.raw("node.set", { ids: [o.Sub, o.Link], props: { visible: false } });
      b.frame(cid, { name: "Divider", w: 1102, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
      return o;
    } });
  b.set(pan, "Table row sample states", sv, { cols: 1, cw: 1200, ch: 90, W: 1240, H: 2 * 90 + 32, textProps: [] });
};

// Sample table (Nov 3): fixed columns shared by header and rows, Action column with an icon button, no state sub-line.
const SCOLS = [["#", 40], ["Sample ID", 130], ["Client description", 0], ["Depth / lot reference", 230], ["Remarks", 130], ["Batch", 130], ["Status", 130], ["Action", 64]];
const ACT = { Locked: ["lock-simple", "Disabled"], Mark: ["file-x", "Default"], Restore: ["arrow-counter-clockwise", "Default"] };
B.prototype.patchSamples = function () {
  const b = this, N = b.reg.N;
  if (b.reg.sets["Table row samples"]) return;
  const byName = (type, name) => Object.values(N).find((n) => n.type === type && n.name === name);
  const old = byName("frame", "Table row sample states (set)");
  const pan = byName("frame", "Table row (set)").parent;
  if (old) { b.raw("edit.delete", { ids: [old.id] }); delete b.reg.sets["Table row sample states"]; }
  const W = 1086;
  b.set(pan, "Table header row samples", [{ name: "Template=Default", w: W, h: 44, frame: { fill: "Primary/primary-50", r: 8, layout: "h", pad: 0, cross: "center", sizeH: "fixed", sizeV: "fixed" },
    build(cid) { SCOLS.forEach(([h, w]) => { const f = b.frame(cid, { name: "Head", w: w || 232, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); b.text(f, h, { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Label" }); }); } }], { cols: 1, cw: 1200, ch: 70, W: 1240, H: 102 });
  const rv = Object.keys({ None: 1, ...ACT }).map((a) => ({ name: `Action=${a}`, w: W, h: 57, frame: { fill: "Surface/card", layout: "v", sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const row = b.frame(cid, { name: "Row", w: W, h: 56, layout: "h", pad: 0, cross: "center", sizeH: "fill", sizeV: "fixed" });
      const cell = (w) => b.frame(row, { name: "Cell", w: w || 232, h: 48, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "fixed" });
      const o = {};
      o.Index = b.text(cell(40), "1", { style: "Data", color: "Text/text-muted", name: "Index" });
      o.Id = b.text(cell(130), "BNM-3401", { style: "Data/Strong", color: "Text/heading", name: "Sample ID" });
      o.Desc = b.text(cell(0), "Ply A1 upper", { style: "Body small/Regular", color: "Text/text-secondary", name: "Description", fill: true });
      o.Depth = b.text(cell(230), "DH-BNM-021 · 14.20-14.55 m", { style: "Body small/Regular", color: "Text/text-secondary", name: "Depth", fill: true });
      o.Rem = b.text(cell(130), "Composite", { style: "Body small/Regular", color: "Text/text-secondary", name: "Remarks", fill: true });
      o.Batch = b.text(cell(130), "B-2026-0420", { style: "Data", color: "Primary/primary", name: "Batch" });
      o.Badge = b.instV(cell(130), "Status badge", "Status=Expected, Size=md");
      const ac = cell(64);
      if (ACT[a]) o.Action = b.instV(ac, "Icon button", `Type=Ghost, Size=32, State=${ACT[a][1]}`, { swaps: [[0, "Icon", `Glyph=${ACT[a][0]}, Size=14`]] });
      b.frame(cid, { name: "Divider", w: W, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
      return o;
    } }));
  b.set(pan, "Table row samples", rv, { cols: 1, cw: 1200, ch: 90, W: 1240, H: 4 * 90 + 32 });
};
// text overrides keyed by the placeholder text of the library variant (names repeat in these sets)
const T = (b, set, variant, map) => { const v = b.v(set, variant), o = {}; for (const [ph, t] of Object.entries(map)) { const i = v.texts.findIndex((x) => !/ source$/.test(x.name) && (x.chars === ph || x.chars === ph.split(" · ")[0])); if (i < 0) throw new Error("no placeholder " + ph + " in " + set); o[i] = t; } return o; };
const SR = (b, variant, o) => { const ph = { Idx: "1", Id: "BNM-3401", Desc: "Ply A1 upper", Depth: "DH-BNM-021 · 14.20-14.55 m", Rem: "Composite", Batch: "B-2026-0420" }; const v = b.v("Table row samples", variant); if (!v.texts) { const r = {}; for (const [k, t] of Object.entries(o)) r[k === "Idx" ? "Index" : k] = t; return r; } const m = {}; for (const [k, t] of Object.entries(o)) m[ph[k]] = t; return T(b, "Table row samples", variant, m); };
// one sample row: the tablet keeps the full table and scrolls it sideways
const ROWW = (kind) => (kind === "tablet" ? { width: 1086 } : { sizingH: "fill" });
function sRow(b, parent, kind, action, i, id, desc, depth, rem, batch, status) {
  const variant = `Action=${action}`, v = b.v("Table row samples", variant);
  const rid = b.instV(parent, "Table row samples", variant, { texts: SR(b, variant, { Idx: String(i + 1), Id: id, Desc: desc, Depth: depth, Rem: rem, Batch: batch || "—" }), swaps: status ? [[v.insts ? "Status badge" : "Badge", "Status badge", `Status=${status}, Size=md`]] : [], props: ROWW(kind) });
  const nm = v.names || v.off;
  if (!batch) { b.raw("node.set", { ids: [rid + nm.Batch], props: { fill: LIGHT["Text/text-muted"] } }); b.bind(rid + nm.Batch, "fill", "Text/text-muted"); }
  return rid;
}
const sHead = (b, parent, kind) => b.instV(parent, "Table header row samples", "Template=Default", { props: ROWW(kind) });
function batchRow(b, parent, t, d) {
  const variant = "Template=" + t + ", State=Default", v = b.v("Table row batches", variant), pick = (ph) => v.texts.findIndex((x) => x.chars === ph);
  const texts = { Number: d[0], Date: d[1], Standard: d[2], Samples: d[3], Deadline: d[10] };
  if (t === "Desktop") {
    Object.assign(texts, { Parameters: d[4], Extra: d[5], PrepName: d[7][1], PrepDate: d[7][2], AnalysisName: d[8] ? d[8][1] : "—", AnalysisDate: d[8] ? d[8][2] : "", RoA: d[9] });
    texts[pick("DK")] = d[7][0]; if (d[8]) texts[pick("FH")] = d[8][0];
  }
  const rid = b.instV(parent, "Table row batches", variant, { texts, fills: t === "Desktop" ? { RoA: d[9] === "—" ? "Text/text-secondary" : "Primary/primary" } : undefined, swaps: [["Status badge", "Status badge", "Status=" + d[6] + ", Size=md"]], props: { sizingH: "fill" } });
  if (t === "Desktop" && !d[8]) b.raw("node.set", { ids: [rid + v.all.Avatar[1], rid + v.names.AnalysisDate], props: { visible: false } });
  flat(b, rid, "Table row batches", variant);
  return rid;
}
// the card already pads: rows inside a card keep no side padding of their own (cells keep theirs)
const flat = (b, id, set, variant) => { const v = b.v(set, variant); b.raw("node.set", { ids: [id + v.names.Row], props: { padding: [0, 0, 0, 0] } }); return id; };
// ---------- building blocks ----------
const card = (b, parent, name) => b.frame(parent, { name, w: 400, h: 100, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 16, pad: [16, 16, 16, 16], sizeH: "fill", sizeV: "hug", clip: true });
const cardHead = (b, c, title, sub, right) => {
  const h = b.frame(c, { name: "Card head", w: 400, h: 56, layout: "h", gap: 12, pad: 0, cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
  const t = b.frame(h, { name: "Titles", w: 200, h: 36, layout: "v", gap: 2, sizeH: "hug", sizeV: "hug" });
  b.text(t, title, { style: "Heading/H3", color: "Text/heading", name: "Title" });
  return h;
};

function detailHead(b, main, kind, o) {
  b.instV(main, "Breadcrumb", "Levels=2", { texts: { 0: "Job orders", 1: o.no } });
  const hdr = b.frame(main, { name: "Header", w: 800, h: 80, layout: "h", gap: 12, main: "spaceBetween", cross: "min", sizeH: "fill", sizeV: "hug" });
  const left = b.frame(hdr, { name: "Title block", w: 500, h: 70, layout: "v", gap: 6, sizeH: "fill", sizeV: "hug" });
  const tr = b.frame(left, { name: "Title row", w: 400, h: 44, layout: "h", gap: 12, cross: "center", sizeH: "hug", sizeV: "hug" });
  b.text(tr, o.no, { style: kind === "desktop" ? "Display/XL" : "Heading/H1", color: "Text/heading", name: "Number" });
  b.instV(tr, "Status badge", `Status=${o.status}, Size=md`);
  const mp = o.meta.split(" · "), late = / [(]past due[)]$/.test(o.meta);
  const company = mp[0], contact = (mp[1] || "").replace(/^Attn[.] /, ""), po = mp[2] || "", due = (mp[3] || "").replace(/^Due /, "").replace(/ [(]past due[)]$/, "");
  b.text(left, company, { style: "Body/Medium", color: "Text/foreground", name: "Meta", fill: true });
  const mr = b.frame(left, { name: "Row", w: 400, h: 20, layout: "h", gap: kind === "phone" ? 12 : 16, wrap: kind === "phone", sizeH: "fill", sizeV: "hug" });
  [["user", contact, false], ["receipt", po, false], ["calendar-blank", due, late]].forEach(([g, t, bad]) => {
    const it = b.frame(mr, { name: "Name", w: 90, h: 20, layout: "h", gap: 4, cross: "center", sizeH: "hug", sizeV: "hug" });
    const ic = b.instV(it, "Icon", "Glyph=" + g + ", Size=14");
    { const tk = bad ? "Feedback/error" : "Text/text-muted"; b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tk] } }); b.bind(ic + 1, "fill", tk); }
    b.text(it, t, { style: "Body small/Regular", color: bad ? "Feedback/error" : "Text/text-muted", name: "Meta" });
    if (bad) b.text(it, "Past due", { style: "Body small/SemiBold", color: "Feedback/error", name: "Past due" });
  });
  const act = b.frame(hdr, { name: "Actions", w: 100, h: 40, layout: "h", gap: 8, cross: "center", sizeH: "hug", sizeV: "hug" });
  if (o.primary && kind !== "phone") b.instV(act, "Button", "Type=Primary, Tone=Default, Size=md, State=Default", { texts: { Label: o.primary }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("plus") } });
  b.instV(act, "Icon button", "Type=Secondary, Size=36, State=Default", { swaps: [[0, "Icon", "Glyph=dots-three, Size=20"]] });
  return hdr;
}

function stepperCard(b, main, kind, o) {
  const c = b.frame(main, { name: "Stepper card", w: 400, h: 100, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", pad: [16, 16, 16, 16], sizeH: "fill", sizeV: "hug", clip: kind === "tablet" });
  const names = ["Registered", "Samples received", "Analysis", "RoA approved", "CoA published", "Sent to client"];
  if (kind === "phone") {
    o.steps.forEach((s, i) => {
      const st = i < o.cur ? "Done" : i === o.cur ? "Current" : "Upcoming";
      b.instV(c, "Stepper step", `State=${st}, Orientation=Vertical`, { texts: { 0: names[i], 1: s || (st === "Current" ? "Current" : "—") }, props: { sizingH: "fill" } });
    });
  } else {
    // one continuous line behind six steps (Revision 2): green up to the current step, neutral after it
    const W = WCONTENT[kind] - 32, sw = W / 6;
    const row = b.frame(c, { name: "Stepper", w: W, h: 66, layout: "h", gap: 0, sizeH: "fill", sizeV: "hug" });
    b.frame(row, { name: "Track", w: sw * 5, h: 2, fill: "Surface/border-strong", absolute: true, x: sw / 2, y: 11, sizeH: "fixed", sizeV: "fixed" });
    if (o.cur > 0) b.frame(row, { name: "Progress", w: sw * Math.min(o.cur, 5), h: 2, fill: "Feedback/success", absolute: true, x: sw / 2, y: 11, sizeH: "fixed", sizeV: "fixed" });
    o.steps.forEach((s, i) => {
      const st = i < o.cur ? "Done" : i === o.cur ? "Current" : "Upcoming";
      b.instV(row, "Stepper step", `State=${st}, Orientation=Horizontal`, { texts: { 0: names[i], 1: s || (st === "Current" ? "Current" : "—") }, props: { sizingH: "fill" } });
    });
  }
  return c;
}

function tabs(b, main, kind, sel, counts) {
  const r = b.frame(main, { name: "Tabs", w: 800, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug", clip: kind !== "desktop" });
  const T = [["Overview", null], ["Samples", counts.s], ["Batches", counts.b], ["Files", counts.f], ["CoA", null], ["History", null]];
  T.forEach(([l, n]) => b.instV(r, "Tab", `Selected=${l === sel ? "On" : "Off"}, State=Default`, { texts: n != null ? { 0: l, 1: String(n) } : { 0: l }, hide: n != null ? [] : ["Count"] }));
  return r;
}

const minipill = (b, parent, t) => { const f = b.frame(parent, { name: "Param", w: 40, h: 22, fill: "Primary/primary-50", stroke: "Primary/primary-200", sw: 1, r: 999, layout: "h", pad: [0, 8, 0, 8], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" }); b.text(f, t, { style: "Caption/Medium", color: "Text/text-secondary", name: "Param" }); return f; };

// ---------- frames ----------
function detailFrame(b, x, y, kind, o) {
  page(b, kind);
  const s = b.shell({ name: o.name, x, y, kind, active: "Job orders" });
  detailHead(b, s.main, kind, o);
  if (o.steps) stepperCard(b, s.main, kind, o);
  tabs(b, s.main, kind, o.tab, o.counts);
  return s;
}

const JO0142 = { no: "JO-2026-0142", status: "In progress", meta: "PT Bara Nusantara Mandiri · Attn. Budi Hartono · PO 4500-2231 · Due 24 Oct 2026", steps: ["21 Oct", "22 Oct", "Started 23 Oct", "", "", ""], cur: 2, counts: { b: 2, s: 12, f: 2 } };

function overview(b, x, y, kind) {
  const o2 = { custom: true };
  const s = detailFrame(b, x, y, kind, { ...JO0142, name: `Overview · ${kind === "desktop" ? "Desktop" : kind === "tablet" ? "Tablet" : "Phone"}`, tab: "Overview" });
  const W = WCONTENT[kind];
  const grid = b.frame(s.main, { name: "Grid", w: W, h: 400, layout: kind === "desktop" ? "h" : "v", gap: 20, sizeH: "fill", sizeV: "hug" });
  // properties
  const pc = card(b, grid, "Properties");
  if (kind === "desktop") b.raw("node.set", { ids: [pc], props: { width: 560, sizingH: "fixed" } });
  const ph = cardHead(b, pc, "Properties");
  b.instV(ph, "Button", "Type=Ghost, Tone=Default, Size=sm, State=Default", { texts: { Label: "Edit" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("pencil-simple") } });
  const kvs = b.frame(pc, { name: "Rows", w: 400, h: 400, layout: "v", gap: 12, pad: 0, sizeH: "fill", sizeV: "hug" });
  const KV = [["Company", "PT Bara Nusantara Mandiri"], ["Address", "Jl. Mulawarman No. 12, Samarinda"], ["Contact", kind === "phone" ? "Budi Hartono · +62 812 5550 1844" : "Budi Hartono · +62 812 5550 1844 · budi@baranusa.co.id"], ["Client reference", "PO 4500-2231"]];
  const kv = (k, v) => b.instV(kvs, "Key-value row", kind === "phone" ? "Layout=Stacked" : "Layout=Inline", { texts: { Key: k, Value: v }, props: { sizingH: "fill" } });
  KV.forEach(([k, v]) => kv(k, v));
  // Parameters: row 1 = service, "customized" (only when the quick select was changed), total on the right; row 2 = all pills under the value column
  const phone = kind === "phone";
  const pr = b.frame(kvs, { name: "Key-value row", w: 400, h: 20, layout: phone ? "v" : "h", gap: phone ? 4 : 12, sizeH: "fill", sizeV: "hug" });
  const kt = b.text(pr, "Parameters", { style: "Caption/Regular", color: "Text/text-muted", name: "Key" });
  if (!phone) b.raw("node.set", { ids: [kt], props: { width: 110, sizingH: "fixed" } });
  const left = b.frame(pr, { name: "Left", w: 300, h: 20, layout: "h", gap: 12, cross: "center", sizeH: "fill", sizeV: "hug" });
  b.text(left, "TM + Prox + TS + CV", { style: "Body small/Medium", color: "Text/foreground", name: "Service" });
  if (o2.custom) b.text(left, "customized", { style: "Body small/Medium", color: "Text/text-muted", name: "Customized" });
  b.text(pr, "8 parameters", { style: "Body small/Medium", color: "Text/text-secondary", name: "Total" });
  const pills = b.frame(kvs, { name: "Parameter pills", w: 400, h: 30, layout: "h", gap: 6, pad: [0, 0, 0, phone ? 0 : 122], wrap: true, sizeH: "fill", sizeV: "hug" });
  ["Preparation", "TM", "IM", "Ash", "VM", "FC", "TS", "GCV"].forEach((p) => minipill(b, pills, p));
  [["Standard", "ASTM"], ["Expected samples", "12 · Exploration cores"], ["Priority", "Standard"], ["Due date", "24 Oct 2026"], ["Default signatory", "Ir. Bambang Sutrisno, M.T. · Laboratory Manager"], ["Created by", "Rina Kartika · 14 Oct 2026"], ["Notes", "—"]].forEach(([k, v]) => kv(k, v));
  // batches + CoA
  const right = b.frame(grid, { name: "Right column", w: 540, h: 400, layout: "v", gap: 20, sizeH: "fill", sizeV: "hug" });
  const bc = card(b, right, "Batches");
  cardHead(b, bc, "Batches");
  const bl = b.frame(bc, { name: "Batch list", w: 400, h: 90, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" });
  BATCHES.forEach((d) => {
    const r = b.frame(bl, { name: "Batch row", w: 400, h: 90, layout: "v", gap: 8, pad: [12, 0, 12, 0], sizeH: "fill", sizeV: "hug" });
    b.frame(bl, { name: "Divider", w: 400, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    const top = b.frame(r, { name: "Top", w: 400, h: 28, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
    b.text(top, d[0], { style: "Data/Strong", color: "Text/heading", name: "Number" });
    b.instV(top, "Status badge", `Status=${d[6]}, Size=sm`);
    const tg = b.frame(top, { name: "Standard tag", w: 50, h: 22, fill: "Primary/primary-50", stroke: "Primary/primary-200", sw: 1, r: 6, layout: "h", pad: [0, 8, 0, 8], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" }); b.text(tg, d[2], { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Standard" });
    const sp = b.frame(top, { name: "Spacer", w: 8, h: 8, sizeH: "fill", sizeV: "fixed" });
    const mt = b.frame(kind === "phone" ? r : top, { name: "Meta", w: 120, h: 16, layout: "h", gap: 8, cross: "center", sizeH: "hug", sizeV: "hug" });
    b.text(mt, d[3] + " samples", { style: "Caption/Regular", color: "Text/text-secondary", name: "Samples" });
    b.text(mt, d[9], { style: "Data", color: d[9] === "—" ? "Text/text-muted" : "Primary/primary", name: "RoA" });
    [["Preparation", d[7]], ["Analysis", d[8]]].forEach(([l, p]) => {
      const pr = b.frame(r, { name: l, w: 400, h: 32, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
      const rt = b.text(pr, l, { style: "Caption/Regular", color: "Text/text-muted", name: "Role" }); b.raw("node.set", { ids: [rt], props: { width: 80, sizingH: "fixed" } });
      if (!p) { b.text(pr, "—", { style: "Body small/Regular", color: "Text/text-muted", name: "Name" }); return; }
      b.instV(pr, "Avatar", "Size=24", { texts: { Initials: p[0] } });
      const col = b.frame(pr, { name: "Label", w: 300, h: 20, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
      const nm = b.text(col, p[1], { style: "Body small/Medium", color: "Text/foreground", name: "Name" }); b.raw("node.set", { ids: [nm], props: { sizingH: "fill" } });
      const st = /^Started /.test(p[2]);
      if (st) b.text(col, "Started", { style: "Caption/Regular", color: "Text/text-muted", name: "Date" });
      b.text(col, st ? p[2].replace(/^Started /, "") : p[2], { style: "Caption/Regular", color: "Text/text-secondary", name: "Date" });
    });
  });
  const cc = b.instV(right, "Card CoA", "State=Not generated", { texts: { 2: "The CoA can be generated once every batch has an approved RoA." }, props: { sizingH: "fill" } });
  return s;
}

function batches(b, x, y, kind, empty) {
  const jo = empty ? { no: "JO-2026-0137", status: "Awaiting samples", meta: "PT Kaltara Energi Prima · Attn. Sari Wulandari · PO KEP-121 · Due 28 Oct 2026", steps: ["21 Oct", "", "", "", "", ""], cur: 0, counts: { b: 0, s: 16, f: 1 } } : JO0142;
  const s = detailFrame(b, x, y, kind, { ...jo, name: `${empty ? "Batches · Empty" : "Batches"} · ${kind === "desktop" ? "Desktop" : kind === "tablet" ? "Tablet" : "Phone"}`, tab: "Batches", primary: undefined });
  const c = card(b, s.main, "Batches card");
  const n = empty ? 0 : 2;
  const hd = cardHead(b, c, "Batches");
  if (kind !== "phone") b.instV(hd, "Button", "Type=Secondary, Tone=Default, Size=sm, State=Default", { texts: { Label: "Add batch" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("plus") } });
  if (empty) {
    b.instV(c, "Empty state", "Size=Card", { texts: { 0: "No batches yet", 1: "Use Add batch above to group the registered samples and start preparation." }, props: { sizingH: "fill" }, hide: kind === "phone" ? [] : [] });
    if (kind === "phone") b.instV(c, "Button", "Type=Secondary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Add batch" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("plus") }, props: { sizingH: "fill" } });
    return s;
  }
  if (kind === "phone") {
    const list = b.frame(c, { name: "List", w: 358, h: 200, layout: "v", gap: 10, pad: 0, sizeH: "fill", sizeV: "hug" });
    BATCHES.forEach((d) => b.instV(list, "Card batch compact", "Property 1=Default", { texts: { Number: d[0], Standard: d[2], Samples: d[3] + " samples", Due: "Due " + d[10] }, swaps: [["Status badge", "Status badge", `Status=${d[6]}, Size=md`]], props: { sizingH: "fill" } }));
    return s;
  }
  const t = kind === "desktop" ? "Desktop" : "Compact";
  const wrap = b.frame(c, { name: "Table", w: 1112, h: 200, layout: "v", pad: 0, sizeH: "fill", sizeV: "hug" });
  b.instV(wrap, "Table header row batches", `Template=${t}`, { props: { sizingH: "fill", padding: [0, 0, 0, 0] } });
  BATCHES.forEach((d) => {
    batchRow(b, wrap, t, d);
  });
  return s;
}

const SAMPLES6 = [
  ["BNM-3401", "Ply A1 upper", "DH-BNM-021 · 14.20-14.55 m", "Composite"], ["BNM-3402", "Ply A1 lower", "DH-BNM-021 · 14.55-14.90 m", ""],
  ["BNM-3403", "Ply A2", "DH-BNM-021 · 16.10-16.45 m", "Composite"], ["BNM-3404", "Ply B1", "DH-BNM-022 · 8.20-8.55 m", ""],
  ["BNM-3405", "Ply B2", "DH-BNM-022 · 9.00-9.35 m", "Composite"], ["BNM-3406", "Ply C", "DH-BNM-022 · 11.10-11.40 m", ""],
];

function samples(b, x, y, kind) {
  const jo = { no: "JO-2026-0134", status: "Awaiting samples", meta: "PT Bara Nusantara Mandiri · Attn. Budi Hartono · PO 4500-2216 · Due 31 Oct 2026", steps: ["21 Oct", "", "", "", "", ""], cur: 0, counts: { b: 0, s: 6, f: 0 } };
  const s = detailFrame(b, x, y, kind, { ...jo, name: `Samples · ${kind === "desktop" ? "Desktop" : kind === "tablet" ? "Tablet" : "Phone"}`, tab: "Samples" });
  const c = card(b, s.main, "Samples card");
  const hd = cardHead(b, c, "Registered Samples");
  if (kind !== "phone") {
    const bt = b.frame(hd, { name: "Buttons", w: 400, h: 36, layout: "h", gap: 8, sizeH: "hug", sizeV: "hug" });
    const bn = (l, g, ty = "Secondary") => b.instV(bt, "Button", `Type=${ty}, Tone=Default, Size=sm, State=${l === "Save" ? "Disabled" : "Default"}`, { texts: { Label: l }, setProps: { "Leading icon": true, "Leading glyph": b.iconId(g) } });
    bn("Add row", "plus"); if (kind === "desktop") { bn("Paste from Excel", "copy"); bn("Import list", "upload-simple"); } bn("Save", "floppy-disk", "Primary");
    b.text(c, "Paste IDs from Excel, or type them. The Preparation team receives samples by these IDs.", { style: "Caption/Regular", color: "Text/text-secondary", name: "Hint", fill: true });
  }
  if (kind === "phone") {
    const list = b.frame(c, { name: "List", w: 358, h: 200, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" });
    SAMPLES6.forEach(([id, d]) => {
      const r = b.frame(list, { name: "Sample", w: 358, h: 76, layout: "v", gap: 6, pad: [12, 0, 12, 0], stroke: undefined, sizeH: "fill", sizeV: "hug" });
      const top = b.frame(r, { name: "Top", w: 326, h: 26, layout: "h", cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      b.text(top, id, { style: "Data/Strong", color: "Text/heading", name: "Sample ID" }); b.instV(top, "Status badge", "Status=Expected, Size=md");
      const m = b.frame(r, { name: "Meta", w: 326, h: 20, layout: "h", cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      b.text(m, d, { style: "Caption/Regular", color: "Text/text-secondary", name: "Desc" }); b.text(m, "No batch", { style: "Caption/Regular", color: "Text/text-muted", name: "Batch" });
      b.frame(list, { name: "Divider", w: 358, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    });
    const ft = b.frame(c, { name: "Add", w: 358, h: 60, layout: "v", pad: 0, sizeH: "fill", sizeV: "hug" });
    b.instV(ft, "Button", "Type=Secondary, Tone=Default, Size=touch, State=Default", { texts: { Label: "Add sample" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("plus") }, props: { sizingH: "fill" } });
    return s;
  }
  const wrap = b.frame(c, { name: "Grid", w: 1112, h: 200, layout: "v", pad: 0, sizeH: "fill", sizeV: "hug", clip: kind === "tablet" });
  sHead(b, wrap, kind);
  SAMPLES6.forEach(([id, d, depth, rem], i) => sRow(b, wrap, kind, "None", i, id, d, depth, rem, "", "Expected"));
  return s;
}


// ================= stage 2 =================
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const JO0139 = { no: "JO-2026-0139", status: "In progress", meta: "PT Mahakam Coal Resources · Attn. Rudi Hartanto · PO MCR-2207 · Due 20 Oct 2026 (past due)", steps: ["14 Oct", "20 Oct", "Started 21 Oct", "", "", ""], cur: 2, counts: { b: 2, s: 8, f: 1 } };
const MIXED = [
  ["BNM-3501", "Ply A1 upper", "DH-MCR-011 · 6.20-6.55 m", "Composite", "B-2026-0420", "Received", "recv"], ["BNM-3502", "Ply A1 lower", "DH-MCR-011 · 6.55-6.90 m", "", "B-2026-0420", "Received", "recv"],
  ["BNM-3503", "Ply A2", "DH-MCR-011 · 8.10-8.45 m", "Composite", "B-2026-0420", "Received", "recv"], ["BNM-3504", "Ply B1", "DH-MCR-012 · 3.40-3.75 m", "", "B-2026-0420", "Received", "recv"],
  ["BNM-3505", "Ply B2", "DH-MCR-012 · 4.00-4.35 m", "Composite", "B-2026-0421", "In batch", "batch"], ["BNM-3506", "Ply C", "DH-MCR-012 · 5.10-5.40 m", "", "B-2026-0421", "In batch", "batch"],
  ["BNM-3507", "Ply D1", "DH-MCR-013 · 2.20-2.55 m", "", "", "Awaiting arrival", "await"], ["BNM-3508", "Ply D2", "DH-MCR-013 · 2.55-2.90 m", "Composite", "", "Not received", "notrec"],
];
const ACTION = { recv: "Locked", batch: "Locked", await: "Mark", notrec: "Restore" };


function sampleRow(b, parent, i, d, kind) {
  const [id, desc, depth, rem, batch, st, k] = d;
  return sRow(b, parent, kind, ACTION[k], i, id, desc, depth, rem, batch, st);
}

function mixed(b, x, y, kind, o = {}) {
  const s = detailFrame(b, x, y, kind, { ...JO0139, name: o.name || `Samples · Mixed states · ${KIND(kind)}`, tab: "Samples" });
  const c = card(b, s.main, "Samples card");
  const hd = cardHead(b, c, "Registered Samples");
  if (kind !== "phone") {
    const bt = b.frame(hd, { name: "Buttons", w: 400, h: 36, layout: "h", gap: 8, sizeH: "hug", sizeV: "hug" });
    ["Add row", "Paste from Excel", "Import list"].slice(0, kind === "desktop" ? 3 : 1).forEach((l, i) => b.instV(bt, "Button", "Type=Secondary, Tone=Default, Size=sm, State=Default", { texts: { Label: l }, setProps: { "Leading icon": true, "Leading glyph": b.iconId(["plus", "copy", "upload-simple"][i]) } }));
    b.instV(bt, "Button", "Type=Primary, Tone=Default, Size=sm, State=Disabled", { texts: { Label: "Save" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("floppy-disk") } });
  }
  if (kind === "phone") {
    const list = b.frame(c, { name: "List", w: 358, h: 200, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug" });
    MIXED.forEach(([id, desc, , , batch, st, k]) => {
      const r = b.frame(list, { name: "Sample", w: 358, h: 76, layout: "v", gap: 6, pad: [12, 0, 12, 0], sizeH: "fill", sizeV: "hug" });
      const top = b.frame(r, { name: "Top", w: 326, h: 26, layout: "h", cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      b.text(top, id, { style: "Data/Strong", color: "Text/heading", name: "Sample ID" });
      const sc = b.frame(top, { name: "State", w: 150, h: 44, layout: "h", gap: 4, cross: "center", sizeH: "hug", sizeV: "hug" });
      b.instV(sc, "Status badge", `Status=${st}, Size=md`);
      const ac = ACT[ACTION[k]]; b.instV(sc, "Icon button", `Type=Ghost, Size=44, State=${ac[1]}`, { swaps: [[0, "Icon", `Glyph=${ac[0]}, Size=20`]] });
      const m = b.frame(r, { name: "Meta", w: 326, h: 20, layout: "h", cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      b.text(m, desc, { style: "Caption/Regular", color: "Text/text-secondary", name: "Desc" }); b.text(m, batch || "No batch", { style: "Data", color: batch ? "Primary/primary" : "Text/text-muted", name: "Batch" });
      b.frame(list, { name: "Divider", w: 358, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    });
    return { s, c };
  }
  const wrap = b.frame(c, { name: "Grid", w: 1112, h: 200, layout: "v", pad: 0, sizeH: "fill", sizeV: "hug", clip: kind === "tablet" });
  sHead(b, wrap, kind);
  const rows = MIXED.map((d, i) => sampleRow(b, wrap, i, d, kind));
  return { s, c, rows, wrap };
}

const scrimOver = (b, root, W, H) => b.frame(root, { name: "Scrim", w: W, h: H, fill: "#0E2A4E66", absolute: true, x: 0, y: 0, sizeH: "fixed", sizeV: "fixed" });

function dialogAt(b, root, size, x, y, title, text, cancel, ok, bodyFn, type = "Default") {
  const v = b.v("Dialog", `Type=${type}, Size=${size}`);
  const id = b.instV(root, "Dialog", `Type=${type}, Size=${size}`, { texts: { 0: title, 1: text }, props: { absolute: true, x, y } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: cancel } });
  b.raw("node.set", { ids: [id + btns[1].pos + 3], props: { characters: ok } });
  if (bodyFn) bodyFn(id + v.names.Body);
  return id;
}

const reasonBody = (b, bodyId, W) => {
  const f = b.frame(bodyId, { name: "Fields", w: W, h: 200, layout: "v", gap: 12, sizeH: "fill", sizeV: "hug" });
  b.instV(f, "Select", "State=Filled, Size=md", { texts: { Label: "Reason *", Value: "Client did not send it" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(f, "Textarea", "State=Default, Size=md", { texts: { Label: "Note (optional)", Value: "Add a note…" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
};

function markDesktop(b, x, y, kind) {
  const m = mixed(b, x, y, kind, { name: `Samples · Mark as not received · ${KIND(kind)}` });
  const root = m.s.root, W = kind === "desktop" ? 1440 : 834;
  b.raw("node.set", { ids: [root], props: { sizingV: "fixed", height: kind === "desktop" ? 1180 : 1180 } });
  scrimOver(b, root, W, 1180);
  dialogAt(b, root, "md", Math.round((W - 560) / 2) + (kind === "desktop" ? 60 : 0), 260, "Mark BNM-3507 as not received?", "The sample stays on the job order with this reason. The job order can be completed without it. You can restore it if it arrives later.", "Cancel", "Mark as not received", (bd) => reasonBody(b, bd, 512));
}

function markPhone(b, x, y) {
  page(b, "phone");
  const root = b.frame(undefined, { name: "Samples · Mark as not received · Phone", x, y, w: 390, h: 844, fill: "Surface/shell", layout: "v", sizeH: "fixed", sizeV: "fixed", clip: true });
  const p = b.instV(root, "Top bar", "Breakpoint=Mobile", { texts: { Initials: "RK" }, props: { sizingH: "fill" } });
  const body = b.frame(root, { name: "Body", w: 390, h: 700, layout: "v", gap: 12, pad: [16, 16, 24, 16], sizeH: "fill", sizeV: "hug" });
  b.text(body, "JO-2026-0139", { style: "Heading/H1", color: "Text/heading", name: "Number" });
  MIXED.slice(4, 8).forEach(([id, desc, , , batch, st, k]) => { const r = b.frame(body, { name: "Sample", w: 358, h: 60, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 12, layout: "h", pad: 12, cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" }); b.text(r, id, { style: "Data/Strong", color: "Text/heading", name: "Sample ID" }); b.instV(r, "Status badge", `Status=${st}, Size=md`); });
  scrimOver(b, root, 390, 844);
  const v = b.v("Bottom sheet");
  const id = b.instV(root, "Bottom sheet", undefined, { texts: { 0: "Mark BNM-3507 as not received?" }, props: { absolute: true, x: 0, y: 300, width: 390 } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: "Cancel" } });
  b.raw("node.set", { ids: [id + btns[1].pos + 3], props: { characters: "Mark as not received" } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug" } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug", y: 844 - 470 } });
  const t = b.text(id + v.names.Body, "The sample stays on the job order with this reason. You can restore it if it arrives later.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Text", fill: true });
  reasonBody(b, id + v.names.Body, 342);
}

function awaiting(b, x, y) {
  const s = detailFrame(b, x, y, "desktop", { ...JO0139, name: "Batches · Samples awaiting arrival · Desktop", tab: "Batches" });
  const c = card(b, s.main, "Batches card");
  const hd = cardHead(b, c, "Batches");
  b.instV(hd, "Button", "Type=Secondary, Tone=Default, Size=sm, State=Default", { texts: { Label: "Add batch" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("plus") } });
  const note = b.frame(c, { name: "Note", w: 1112, h: 44, fill: "Accent/accent-100", r: 10, layout: "h", gap: 10, pad: [10, 14, 10, 14], cross: "center", sizeH: "fill", sizeV: "hug" });
  const ic = b.instV(note, "Icon", "Glyph=hourglass, Size=14"); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT["Accent/accent-text"] } }); b.bind(ic + 1, "fill", "Accent/accent-text");
  b.text(note, "1 sample is awaiting arrival (returned from B-2026-0421). When it arrives, add it with Add batch.", { style: "Body small/Regular", color: "Accent/accent-text", name: "Note", fill: true });
  const wrap = b.frame(c, { name: "Table", w: 1112, h: 200, layout: "v", pad: 0, sizeH: "fill", sizeV: "hug" });
  b.instV(wrap, "Table header row batches", "Template=Desktop", { props: { sizingH: "fill", padding: [0, 0, 0, 0] } });
  [["B-2026-0420", "20 Oct", "ASTM", "4", "TM + Prox + TS + CV", "Same as the job order", "Analysis", ["DK", "Dedi Kurniawan", "20 Oct"], ["FH", "Fitri Handayani", "Started 21 Oct"], "—", "24 Oct"], ["B-2026-0421", "21 Oct", "ASTM", "3", "TM + Prox + TS + CV", "Same as the job order", "Preparation", ["DK", "Dedi Kurniawan", "Started 21 Oct"], null, "—", "25 Oct"]].forEach((d) => {
    batchRow(b, wrap, "Desktop", d);
  });
  return s;
}

function dark(b, x, y) {
  const s = overview(b, x, y, "desktop");
  b.raw("node.set", { ids: [s.root], props: { name: "Overview · Dark preview · Desktop" } });
  b.raw("variable.setMode", { ids: [s.root], collection: "SGSI tokens", mode: "Dark" });
}

function p2(b, x, y) {
  const jo = { no: "JO-2026-0143", status: "Awaiting samples", meta: "PT Bara Nusantara Mandiri · Attn. Budi Hartono · PO 4500-2231 · Due 24 Oct 2026", steps: ["22 Oct", "", "", "", "", ""], cur: 0, counts: { b: 0, s: 0, f: 0 } };
  const s = detailFrame(b, x, y, "desktop", { ...jo, name: "Samples · P2 Submitted toast · Desktop", tab: "Samples", primary: "Add samples" });
  const c = card(b, s.main, "Samples card");
  const hd = cardHead(b, c, "Registered Samples");
  b.instV(c, "Empty state", "Size=Card", { texts: { 0: "No samples yet", 1: "Add the sample IDs the company sent, so the lab can receive and label them.", 2: "Paste from Excel" }, props: { sizingH: "fill" } });
  b.instV(s.root, "Toast", "Tone=Success", { texts: { 0: "JO-2026-0143 submitted. Add the sample IDs next.", 1: "Dismiss" }, props: { absolute: true, x: 1440 - 560 - 32, y: 880 } });
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: 1018 } });
}

function p3(b, x, y) {
  const m = mixedEmpty(b, x, y, "Samples · P3 Paste preview · Desktop");
  scrimOver(b, m.root, 1440, 1180);
  dialogAt(b, m.root, "lg", 320, 150, "Paste from Excel", "12 rows found: 11 new, 1 duplicate. Duplicates are skipped and marked in the list.", "Cancel", "Add 11 rows", (bd) => {
    const f = b.frame(bd, { name: "Preview", w: 752, h: 300, layout: "v", gap: 10, sizeH: "fill", sizeV: "hug" });
    const chips = b.frame(f, { name: "Summary", w: 400, h: 28, layout: "h", gap: 8, sizeH: "hug", sizeV: "hug" });
    b.instV(chips, "Summary chip", "Tone=Neutral", { texts: { 0: "12 rows found" } }); b.instV(chips, "Summary chip", "Tone=Success", { texts: { 0: "11 new" } }); b.instV(chips, "Summary chip", "Tone=Error", { texts: { 0: "1 duplicate" } });
    const cols = [["#", 36], ["Sample ID", 110], ["Client description", 0], ["Depth / lot reference", 210], ["Status", 110]];
    const hdr = b.frame(f, { name: "Head", w: 752, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", pad: 0, cross: "center", sizeH: "fill", sizeV: "fixed" });
    cols.forEach(([h, w]) => { const c = b.frame(hdr, { name: "Head cell", w: w || 200, h: 24, layout: "h", pad: [0, 6, 0, 6], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "hug" }); b.text(c, h, { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Head" }); });
    [["BNM-3601", "Ply A1 upper", "DH-BNM-031 · 5.10-5.45 m", 0], ["BNM-3602", "Ply A1 lower", "DH-BNM-031 · 5.45-5.80 m", 0], ["BNM-3603", "Ply A2", "DH-BNM-031 · 7.20-7.55 m", 0], ["BNM-3401", "Ply A1 upper", "DH-BNM-021 · 14.20-14.55 m", 1]].forEach(([id, d, dp, dup], i) => {
      const r = b.frame(f, { name: "Row", w: 752, h: 48, layout: "h", pad: 0, cross: "center", sizeH: "fill", sizeV: "fixed" });
      const cell = (w, t, st, color) => { const c = b.frame(r, { name: "Cell", w: w || 200, h: 24, layout: "h", pad: [0, 6, 0, 6], cross: "center", sizeH: w ? "fixed" : "fill", sizeV: "hug" }); return b.text(c, t, { style: st, color, name: "Cell text" }); };
      cell(36, String(i + 1), "Data", "Text/text-muted"); cell(110, id, "Data/Strong", dup ? "Feedback/error" : "Text/heading"); cell(0, d, "Body small/Regular", "Text/foreground"); cell(210, dp, "Body small/Regular", "Text/foreground");
      const sc = b.frame(r, { name: "Cell", w: 110, h: 24, layout: "h", pad: [0, 6, 0, 6], cross: "center", sizeH: "fixed", sizeV: "hug" }); b.instV(sc, "Tag", dup ? "Type=Duplicate" : "Type=New");
      b.frame(f, { name: "Divider", w: 752, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
    });
  });
}

function mixedEmpty(b, x, y, name) {
  const jo = { no: "JO-2026-0143", status: "Awaiting samples", meta: "PT Bara Nusantara Mandiri · Attn. Budi Hartono · PO 4500-2231 · Due 24 Oct 2026", steps: ["22 Oct", "", "", "", "", ""], cur: 0, counts: { b: 0, s: 0, f: 0 } };
  const s = detailFrame(b, x, y, "desktop", { ...jo, name, tab: "Samples", primary: "Add samples" });
  const c = card(b, s.main, "Samples card");
  cardHead(b, c, "Registered Samples");
  b.instV(c, "Empty state", "Size=Card", { texts: { 0: "No samples yet", 1: "Add the sample IDs the company sent, so the lab can receive and label them.", 2: "Paste from Excel" }, props: { sizingH: "fill" } });
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: 1180 } });
  return s;
}

function p4(b, x, y) {
  const jo = { no: "JO-2026-0143", status: "Awaiting samples", meta: "PT Bara Nusantara Mandiri · Attn. Budi Hartono · PO 4500-2231 · Due 24 Oct 2026", steps: ["22 Oct", "", "", "", "", ""], cur: 0, counts: { b: 0, s: 3, f: 0 } };
  const s = detailFrame(b, x, y, "desktop", { ...jo, name: "Samples · P4 Unsaved rows · Desktop", tab: "Samples" });
  const c = card(b, s.main, "Samples card");
  const hd = cardHead(b, c, "Registered Samples");
  const bt = b.frame(hd, { name: "Buttons", w: 400, h: 36, layout: "h", gap: 8, sizeH: "hug", sizeV: "hug" });
  ["Add row", "Paste from Excel", "Import list"].forEach((l, i) => b.instV(bt, "Button", "Type=Secondary, Tone=Default, Size=sm, State=Default", { texts: { Label: l }, setProps: { "Leading icon": true, "Leading glyph": b.iconId(["plus", "copy", "upload-simple"][i]) } }));
  b.instV(bt, "Button", "Type=Primary, Tone=Default, Size=sm, State=Default", { texts: { Label: "Save (3)" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("floppy-disk") } });
  b.instV(c, "Inline alert", "Tone=Error", { texts: { 0: "Fix 1 duplicate ID before saving", 1: "BNM-3602 is already in row 2." }, hide: ["Action"], props: { sizingH: "fill" } });
  const wrap = b.frame(c, { name: "Grid", w: 1112, h: 200, layout: "v", pad: 0, sizeH: "fill", sizeV: "hug" });
  sHead(b, wrap, "desktop");
  [["BNM-3601", "Ply A1 upper", "DH-BNM-031 · 5.10-5.45 m", "Composite"], ["BNM-3602", "Ply A1 lower", "DH-BNM-031 · 5.45-5.80 m", ""], ["BNM-3602", "Ply A2", "DH-BNM-031 · 7.20-7.55 m", "Composite"]].forEach(([id, d, dp, rm], i) => {
    const r = sRow(b, wrap, "desktop", "None", i, id, d, dp, rm, "", "Expected");
    const v = b.v("Table row samples", "Action=None"), nm = v.names || v.off, idn = nm["Sample ID"] !== undefined ? nm["Sample ID"] : nm.Id;
    b.raw("node.set", { ids: [r + nm.Index], props: { characters: "● " + (i + 1), fill: LIGHT["Accent/accent"] } }); b.bind(r + nm.Index, "fill", "Accent/accent");
    if (i === 2) { b.raw("node.set", { ids: [r + idn], props: { fill: LIGHT["Feedback/error"] } }); b.bind(r + idn, "fill", "Feedback/error"); }
  });
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: 1018 } });
}

const TIPX = 960, TIPY = 543; // owner moved it 30 px down, under the locked row (Nov 5, 2026)
function p5(b, x, y) {
  const m = mixed(b, x, y, "desktop", { name: "Samples · P5 Locked row tooltip · Desktop" });
  b.instV(m.s.root, "Tooltip", "Placement=Left", { texts: { 0: "Received on 21 Oct by Dedi Kurniawan. Received samples can't be edited." }, props: { absolute: true, x: TIPX, y: TIPY } });
}

exports.build = (b) => {
  b.patchC(); b.patchSamples();
  { const N = b.reg.N, subs = [];
    const walk = (id) => { const n = N[id]; if (n.type === "text" && n.name === "Subtitle") subs.push(id); (n.children || []).forEach(walk); };
    for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (/^List ·/.test(N[id].name || "")) walk(id);
    if (subs.length) b.raw("edit.delete", { ids: subs }); }
  const N = b.reg.N, old = [];
  for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) { const n = N[id]; if ((NAMES.test(n.name || "") && !(n.var_modes && /P5/.test(n.name))) || (n.name === "Row title" && /^C( ·|  )/.test(n.characters || ""))) old.push(id); }
  if (old.length) b.raw("edit.delete", { ids: old });
  const YD = 9000, YT = 2200, YP = 3800;
  page(b, "desktop"); TITLE(b, 0, YD - 90, "C · Job order detail");
  page(b, "tablet"); TITLE(b, 0, YT - 90, "C · Job order detail");
  page(b, "phone"); TITLE(b, 0, YP - 90, "C · Job order detail");
  overview(b, 0, YD, "desktop"); overview(b, 0, YT, "tablet"); overview(b, 0, YP, "phone");
  batches(b, 1560, YD, "desktop"); batches(b, 954, YT, "tablet"); batches(b, 510, YP, "phone");
  batches(b, 3120, YD, "desktop", true); batches(b, 1908, YT, "tablet", true);
  samples(b, 4680, YD, "desktop"); samples(b, 2862, YT, "tablet"); samples(b, 1020, YP, "phone");
  // stage 2
  const Y2 = YD + 1300, Y3 = YD + 2600;
  page(b, "desktop"); dark(b, 0, Y2);
  awaiting(b, 1560, Y2);
  mixed(b, 3120, Y2, "desktop");
  markDesktop(b, 4680, Y2, "desktop");
  p2(b, 0, Y3); p3(b, 1560, Y3); p4(b, 3120, Y3); p5(b, 4680, Y3);
  mixed(b, 0, YT + 1100, "tablet"); markDesktop(b, 954, YT + 1100, "tablet");
  mixed(b, 0, YP + 1950, "phone"); markPhone(b, 510, YP + 1950);
};

// shared with rows D and E
exports.H = { TITLE, page, card, cardHead, detailFrame, batches, awaiting, overview, scrimOver, dialogAt, KIND, JO0142, JO0139, WCONTENT };
