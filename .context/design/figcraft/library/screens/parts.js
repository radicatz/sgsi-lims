// Library parts added for the job order screens: compact table (tablet) and the job order list card (phone)
const { B } = require("../dsl.js");

const JO = [
  // no, company, attn line, service, samples, batches, due, due state, status, coa [tag variant, label], progress, roa
  ["JO-2026-0142", "PT Bara Nusantara Mandiri", "Attn. Budi Hartono · PO 4500-2241", "TM + Prox + TS + CV", "12 / 12", "0 / 1", "24 Oct 2026", "ok", "In progress", ["No CoA", "No CoA"], "12/12", "RoA 0 / 1"],
  ["JO-2026-0141", "PT Kaltara Energi Prima", "Attn. Sari Wulandari · PO KEP-118", "TM + Prox + TS + CV", "8 / 8", "1 / 1", "23 Oct 2026", "ok", "Reported", ["Saved", "Published"], "8/8", "RoA 1 / 1"],
  ["JO-2026-0140", "CV Sumber Batu Hitam", "Attn. Joko Santoso · PO SBH-0931", "Full analysis", "24 / 24", "2 / 2", "22 Oct 2026", "ok", "Delivered", ["CoA uploaded", "Sent · WhatsApp"], "24/24", "RoA 2 / 2"],
  ["JO-2026-0139", "PT Mahakam Coal Resources", "Attn. Rudi Hartanto · PO MCR-2207", "TM + Prox + TS + CV", "6 / 10", "0 / 1", "20 Oct 2026", "late", "In progress", ["No CoA", "No CoA"], "6/10", "RoA 0 / 1"],
  ["JO-2026-0138", "PT Bara Nusantara Mandiri", "Attn. Budi Hartono · PO 4500-2230", "TM + Prox + TS + CV", "12 / 12", "1 / 1", "21 Oct 2026", "ok", "Reported", ["Saved", "Published"], "12/12", "RoA 1 / 1"],
  ["JO-2026-0137", "PT Kaltara Energi Prima", "Attn. Sari Wulandari · PO KEP-121", "Coking coal", "0 / 16", "0 / 0", "28 Oct 2026", "ok", "Awaiting samples", ["No CoA", "No CoA"], "0/16", "RoA 0 / 0"],
  ["JO-2026-0136", "CV Sumber Batu Hitam", "Attn. Joko Santoso · PO SBH-0940", "Prox only", "0 / 0", "0 / 0", "30 Oct 2026", "ok", "Draft", ["No CoA", "No CoA"], "0/0", "RoA 0 / 0"],
  ["JO-2026-0135", "PT Mahakam Coal Resources", "Attn. Rudi Hartanto · PO MCR-2199", "Preparation only", "0 / 5", "0 / 0", "26 Oct 2026", "ok", "Cancelled", ["No CoA", "No CoA"], "0/5", "RoA 0 / 0"],
  ["JO-2026-0134", "PT Bara Nusantara Mandiri", "Attn. Budi Hartono · PO 4500-2241", "TM + Prox + TS + CV", "0 / 6", "0 / 0", "31 Oct 2026", "ok", "Awaiting samples", ["No CoA", "No CoA"], "0/6", "RoA 0 / 0"],
  ["JO-2026-0133", "PT Kaltara Energi Prima", "Attn. Sari Wulandari · PO KEP-109", "TM + Prox + TS + CV", "10 / 10", "1 / 1", "17 Oct 2026", "ok", "Delivered", ["CoA uploaded", "Sent · Email"], "10/10", "RoA 1 / 1"],
];

B.prototype.patchParts = function () {
  const b = this, N = b.reg.N;
  const byName = (type, name) => Object.values(N).find((n) => n.type === type && n.name === name);
  // 1. job order list card: replaces the old one
  const oldHolder = byName("frame", "Card job order (set)");
  const cardPan = oldHolder.parent;
  b.raw("edit.delete", { ids: [oldHolder.id] });
  delete b.reg.sets["Card job order"];
  const cv = [];
  for (const late of ["No", "Yes"]) cv.push({ name: `Past due=${late}`, w: 358, h: 170, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 8, pad: 16, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const row = (n) => b.frame(cid, { name: n, w: 326, h: 24, layout: "h", gap: 8, cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
      const h = row("Head"); const no = b.text(h, "JO-2026-0142", { style: "Data/Strong", color: "Text/heading", name: "Number" }); const badge = b.instV(h, "Status badge", "Status=In progress, Size=md");
      const co = b.text(cid, "PT Bara Nusantara Mandiri", { style: "Body/SemiBold", name: "Company", fill: true });
      const sv = b.text(cid, "TM + Prox + TS + CV · ASTM", { style: "Caption/Regular", color: "Text/text-secondary", name: "Service", fill: true });
      const r1 = row("Batches"); const bt = b.text(r1, "Batches 0 / 1", { style: "Caption/Medium", color: "Text/text-secondary", name: "Batches" }); const due = b.text(r1, "Due 24 Oct", { style: "Caption/Medium", color: late === "Yes" ? "Feedback/error" : "Text/text-secondary", name: "Due" });
      const pr = b.instV(cid, "Progress bar", "Tone=Primary", { texts: { Value: "12/12" }, props: { sizingH: "fill" } });
      const r2 = row("Footer"); const roa = b.text(r2, "RoA 0 / 1", { style: "Caption/Regular", color: "Text/text-muted", name: "RoA" }); const coa = b.text(r2, "CoA —", { style: "Caption/Regular", color: "Text/text-muted", name: "CoA" });
      return { Number: no, Badge: badge, Company: co, Service: sv, Batches: bt, Due: due, Progress: pr, RoA: roa, CoA: coa };
    } });
  b.set(cardPan, "Card job order", cv, { cols: 2, cw: 400, ch: 230, W: 832, H: 262 });
  // 2. compact table (tablet): No. | Company + samples line | Due | Status | CoA
  const tblHolder = byName("frame", "Table row (set)"), tblPan = tblHolder.parent;
  const COLS = [["No.", 120], ["Company", 214], ["Due", 90], ["Status", 130], ["CoA", 112]];
  const W = COLS.reduce((a, c) => a + c[1], 0) + 32;
  b.set(tblPan, "Table header row compact", [{ name: "Template=Job order", w: W, h: 44, frame: { fill: "Primary/primary-50", r: 8, layout: "h", pad: [0, 16, 0, 16], cross: "center", sizeH: "fixed", sizeV: "fixed" },
    build(cid) { COLS.forEach(([h, w], i) => { const f = b.frame(cid, { name: "Head", w, h: 40, layout: "h", pad: [0, 8, 0, 8], cross: "center", sizeH: i === 1 ? "fill" : "fixed", sizeV: "fixed" }); b.text(f, h, { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Label" }); }); } }], { cols: 1, cw: 700, ch: 60, W: 740, H: 92 });
  const rv = [];
  for (const st of ["Default", "Hover", "Selected"]) {
    const fill = { Default: "Surface/card", Hover: "Primary/primary-50", Selected: "Primary/primary-100" }[st];
    rv.push({ name: `Template=Job order, State=${st}`, w: W, h: 57, frame: { fill, layout: "v", sizeH: "fixed", sizeV: "hug" },
      build(cid) {
        const row = b.frame(cid, { name: "Row", w: W, h: 56, layout: "h", pad: [0, 16, 0, 16], cross: "center", sizeH: "fill", sizeV: "fixed" });
        const cell = (w, fl) => b.frame(row, { name: "Cell", w, h: 40, layout: "h", gap: 6, pad: [0, 8, 0, 8], cross: "center", sizeH: fl ? "fill" : "fixed", sizeV: "fixed" });
        let c = cell(120); const no = b.text(c, "JO-2026-0142", { style: "Data/Strong", color: "Text/heading", name: "Number" });
        c = cell(214, true); const two = b.frame(c, { name: "Two lines", w: 220, h: 36, layout: "v", sizeH: "fill", sizeV: "hug" }); const co = b.text(two, "PT Bara Nusantara Mandiri", { style: "Body small/SemiBold", name: "Company", fill: true }); const ln = b.text(two, "12 samples · TM + Prox + TS + CV", { style: "Caption/Regular", color: "Text/text-secondary", name: "Line", fill: true });
        c = cell(90); const due = b.text(c, "24 Oct", { style: "Body small/Regular", name: "Due" });
        c = cell(130); const badge = b.instV(c, "Status badge", "Status=In progress, Size=md");
        c = cell(112); const tag = b.instV(c, "Tag", "Type=No CoA");
        b.frame(cid, { name: "Divider", w: W, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
        return { Number: no, Company: co, Line: ln, Due: due, Badge: badge, Tag: tag };
      } });
  }
  b.set(tblPan, "Table row compact", rv, { cols: 1, cw: 700, ch: 76, W: 740, H: 3 * 76 + 32 });
};

// the library's Job order table was 1252 wide; the desktop content area is 1128. Narrow the cells and let Client absorb the rest.
B.prototype.patchTables = function () {
  const b = this, W = 1102;
  const WID = [140, 220, 170, 80, 80, 100, 130, 110, 40];
  for (const sn of ["Table row", "Table header row"]) {
    const set = b.reg.sets[sn];
    for (const [vn, v] of Object.entries(set.variants)) {
      if (!vn.startsWith("Template=Job order")) continue;
      const cells = v.all[sn === "Table row" ? "Cell" : "Head"] || [];
      cells.forEach((pos, i) => { b.raw("node.set", { ids: [v.id + pos], props: i === 1 ? { sizingH: "fill", width: WID[i] } : { width: WID[i] } }); });
      b.raw("node.set", { ids: [v.id], props: { width: W } });
    }
  }
};

module.exports = { JO };
