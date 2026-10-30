const { section } = require("./found.js");
const { LIGHT } = require("./dsl.js");

const COLORS = { Primary: "Action/action", Accent: "Accent/accent", Success: "Status/st-completed", Purple: "Status/st-finished", Rust: "Rust/rust", Grey: "Status/st-created" };
let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

function charts(b, host) {
  const p1 = section(b, host, "Chart card · Legend item", "Chart shells: the card, header, legend and axes. The real plots come from ECharts in the app; the examples below show the intended look.");
  const lg = Object.entries(COLORS).map(([n, c]) => ({ name: `Color=${n}`, w: 120, h: 20, frame: { layout: "h", gap: 6, cross: "center", sizeH: "hug", sizeV: "hug", pad: 0 },
    build(cid) { b.frame(cid, { name: "Swatch", w: 10, h: 10, fill: c, r: 5 }); const l = b.text(cid, "Ply", { style: "Caption/Medium", color: "Text/text-secondary", name: "Label" }); const v = b.text(cid, "58%", { style: "Caption/SemiBold", name: "Value" }); return { Label: l, Value: v }; } }));
  b.set(p1, "Legend item", lg, { cols: 6, cw: 140, ch: 50, W: 872, H: 82, textProps: ["Label", "Value"] });
  const cc = ["Plain", "With basis switch"].map((k) => ({ name: `Header=${k}`, w: 520, h: 300, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 12, pad: 20, sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const h = b.frame(cid, { name: "Header", w: 480, h: 44, layout: "h", gap: 12, cross: "center", sizeH: "fill", sizeV: "hug" });
      const c = b.frame(h, { name: "Titles", w: 300, h: 40, layout: "v", gap: 2, sizeH: "fill", sizeV: "hug" });
      const t = b.text(c, "CV vs Ash (ADB)", { style: "Body/SemiBold", color: "Text/heading", name: "Title" }); const s = b.text(c, "46 batches · last 30 days", { style: "Caption/Regular", color: "Text/text-muted", name: "Subtitle" });
      if (k !== "Plain") { const seg = b.frame(h, { name: "Basis", w: 150, h: 28, fill: "Surface/muted", r: 999, layout: "h", gap: 2, pad: 2, cross: "center", sizeH: "hug", sizeV: "hug" }); ["ADB", "AR", "DB"].forEach((x, i) => { const f = b.frame(seg, { name: x, w: 44, h: 24, fill: i === 0 ? "Action/action" : "none", r: 999, layout: "h", main: "center", cross: "center", pad: [0, 10, 0, 10], sizeH: "hug", sizeV: "fixed" }); b.text(f, x, { style: "Caption/SemiBold", color: i === 0 ? "Action/action-foreground" : "Action/brand-text" }); }); }
      b.inst(h, "Icon button", "Type=Ghost, Size=32, State=Default");
      const plot = b.frame(cid, { name: "Plot", w: 480, h: 180, fill: "Surface/muted", r: 10, sizeH: "fill", sizeV: "fixed" });
      const lgr = b.frame(cid, { name: "Legend", w: 480, h: 20, layout: "h", gap: 16, sizeH: "fill", sizeV: "hug" });
      ["Primary", "Accent"].forEach((n) => b.inst(lgr, "Legend item", `Color=${n}`));
      return { Title: t, Subtitle: s, Plot: plot };
    } }));
  b.set(p1, "Chart card", cc, { cols: 2, cw: 580, ch: 360, W: 1192, H: 392, textProps: ["Title", "Subtitle"], slots: [{ key: "Plot", name: "Plot" }] });

  let p2 = section(b, host, "Chart examples", "Workflow bars, Donut, Bar chart, Scatter and Trend. Colours come from the Status, Accent and Primary tokens.");
  const wrapx = b.frame(p2, { name: "Examples", w: 1400, h: 400, layout: "h", wrap: true, gap: 40, sizeH: "fill", sizeV: "hug" });
  p2 = wrapx;
  // Workflow bars
  const wf = b.component(p2, { name: "Workflow bars", w: 360, h: 160, layout: "v", gap: 10, pad: 0, sizeH: "fixed", sizeV: "hug" });
  [["Created", 6, "Status/st-created-100", "Status/st-created"], ["Preparation", 11, "Status/st-prep-100", "Status/st-prep"], ["Analysis", 17, "Status/st-analysis-100", "Status/st-analysis"], ["Finished", 8, "Status/st-finished-100", "Status/st-finished"], ["Completed", 4, "Status/st-completed-100", "Status/st-completed"]].forEach(([n, v, bg, fg]) => {
    const r = b.frame(wf, { name: n, w: 360, h: 24, layout: "h", gap: 10, cross: "center", sizeH: "fill", sizeV: "hug" });
    b.text(r, n, { style: "Caption/Medium", color: "Text/text-secondary", name: "Label", w: 80 });
    b.frame(r, { name: "Bar", w: v * 14, h: 20, fill: bg, r: 6, layout: "h", cross: "center", pad: [0, 8, 0, 8], sizeH: "fixed", sizeV: "fixed" });
    b.text(r, String(v), { style: "Caption/SemiBold", color: fg, name: "Value" });
  });
  // Donut
  const dn = b.component(p2, { name: "Donut", w: 200, h: 200 });
  const segs = [[58, "Action/action"], [24, "Accent/accent"], [12, "Rust/rust"], [6, "Status/st-finished"]];
  let a0 = 0;
  segs.forEach(([pc, col]) => {
    const sw = pc * 3.6;
    const id = b.step("node.create", { type: "ellipse", name: "Segment", parent: dn, x: 0, y: 0, width: 200, height: 200, props: { fill: LIGHT[col], arcStart: a0, arcSweep: sw, arcInner: 0.62 } }, 1);
    b.bind(id, "fill", col); a0 += sw;
  });
  const ctr = b.frame(dn, { name: "Center", x: 50, y: 70, w: 100, h: 60, layout: "v", gap: 0, main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
  b.text(ctr, "258", { style: "Heading/H1", color: "Text/heading", name: "Total" }); b.text(ctr, "samples", { style: "Caption/Regular", color: "Text/text-secondary", name: "Unit" });
  // Bar chart
  const bc = b.component(p2, { name: "Bar chart", w: 360, h: 200, layout: "v", gap: 8, pad: 0, sizeH: "fixed", sizeV: "hug" });
  const plot = b.frame(bc, { name: "Plot", w: 360, h: 150, layout: "h", gap: 14, cross: "max", main: "spaceBetween", pad: [0, 8, 0, 8], sizeH: "fill", sizeV: "fixed" });
  [30, 52, 120, 48, 70, 24, 18].forEach((h, i) => b.frame(plot, { name: "Bar", w: 30, h, fill: i === 2 ? "Action/action" : "Primary/primary-200", r: 6, sizeV: "fixed" }));
  const ax = b.frame(bc, { name: "Axis", w: 360, h: 16, layout: "h", main: "spaceBetween", pad: [0, 8, 0, 8], sizeH: "fill", sizeV: "hug" });
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) => b.text(ax, d, { style: "Caption/Regular", color: "Text/text-muted", name: d }));
  // Scatter
  const sc = b.component(p2, { name: "Scatter", w: 360, h: 220, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 10 });
  b.frame(sc, { name: "Band", x: 20, y: 90, w: 380, h: 36, fill: "Primary/primary-100", opacity: 0.6, r: 18 }).toString();
  b.raw("node.set", { ids: [b.id - 1], props: { rotation: 22 } });
  b.frame(sc, { name: "X axis", x: 24, y: 196, w: 320, h: 1, fill: "Surface/border-strong" });
  b.frame(sc, { name: "Y axis", x: 24, y: 16, w: 1, h: 180, fill: "Surface/border-strong" });
  for (let i = 0; i < 34; i++) { const x = 40 + rnd() * 290, y = 190 - (x - 24) * 0.52 + (rnd() - 0.5) * 36; b.frame(sc, { name: "Point", x, y: Math.max(20, Math.min(188, y)), w: 7, h: 7, fill: "Action/action", opacity: 0.75, r: 4 }); }
  // Trend
  const tr = b.component(p2, { name: "Trend", w: 520, h: 200, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 10 });
  b.frame(tr, { name: "Limit", x: 20, y: 60, w: 480, h: 1, fill: "Rust/rust", dash: [6, 4] });
  b.frame(tr, { name: "X axis", x: 20, y: 170, w: 480, h: 1, fill: "Surface/border-strong" });
  let d = ""; for (let i = 0; i <= 24; i++) { const x = 20 + i * 20, y = 110 + Math.sin(i / 3) * 24 + (rnd() - 0.5) * 18; d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " "; }
  const line = b.step("vector.create", { path: d, x: 0, y: 0, parent: tr, props: { fill: "none", stroke: LIGHT["Action/action"], strokeWeight: 2 } }, 1);
  b.bind(line, "stroke", "Action/action");
  b.text(tr, "Limit 6,300 kcal/kg", { style: "Caption/Medium", color: "Rust/rust", name: "Limit label", x: 24, y: 40 });
}
module.exports = { charts };
