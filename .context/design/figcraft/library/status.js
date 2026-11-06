const { section } = require("./found.js");
// tone -> [bg, fg]
const TONE = { grey: ["Status/st-created-100", "Status/st-created"], amber: ["Status/st-prep-100", "Status/st-prep"], blue: ["Status/st-analysis-100", "Status/st-analysis"], purple: ["Status/st-finished-100", "Status/st-finished"], green: ["Status/st-completed-100", "Status/st-completed"], red: ["Feedback/error-100", "Feedback/error"], navy: ["Primary/primary-100", "Primary/primary-deep"], outline: ["Surface/card", "Text/text-secondary"] };
const pill = (fill, o = {}) => ({ fill, stroke: o.stroke, sw: 1, r: o.r === undefined ? 999 : o.r, layout: "h", gap: o.gap || 0, pad: o.pad, main: "center", cross: "center", sizeH: o.fixedW ? "fixed" : "hug", sizeV: "fixed" });

function statusBadge(b, host) {
  const pan = section(b, host, "Status badge", "One set for every status in the app. Pick Status; Size sm is for dense tables and phone cards.");
  const S = [["Created", "grey"], ["Receiving", "navy"], ["Preparation", "amber"], ["Analysis", "blue"], ["Finished analysis", "purple"], ["Completed", "green"],
    ["Draft", "grey"], ["Registered", "grey"], ["Awaiting samples", "amber"], ["In progress", "blue"], ["Reported", "purple"], ["Delivered", "green"], ["Cancelled", "red"],
    ["Expected", "outline"], ["Received", "green"], ["In batch", "blue"], ["Awaiting arrival", "amber"], ["Not received", "red"], ["Held", "red"]];
  const variants = [];
  for (const [nm, tn] of S) for (const size of ["md", "sm"]) {
    const [bg, fg] = TONE[tn], h = size === "md" ? 26 : 21, px = size === "md" ? 10 : 8;
    variants.push({ name: `Status=${nm}, Size=${size}`, w: 100, h, frame: pill(bg, { stroke: tn === "outline" ? "Surface/border-strong" : undefined, gap: 6, pad: [0, px, 0, px] }),
      build(cid) { b.frame(cid, { name: "Dot", w: 6, h: 6, fill: fg, r: 3 }); return { Label: b.text(cid, nm, { style: "Caption/Medium", color: fg, name: "Label" }) }; } });
  }
  b.set(pan, "Status badge", variants, { cols: 8, cw: 190, ch: 44, W: 8 * 190 + 32, H: Math.ceil(variants.length / 8) * 44 + 32 });
}
function tag(b, host) {
  const pan = section(b, host, "Tag", "A flag on a row or card. Every tag has an icon or a word, so colour is never the only signal.");
  const T = [["Recheck", "red", "warning"], ["CoA uploaded", "green", "check-circle"], ["CoA missing", "outline", "file-x"], ["No CoA", "outline", "file-x"], ["Due today", "amber", "clock"], ["Overdue", "red", "alarm"], ["Late", "amber", "clock"], ["Locked", "navy", "lock-simple"], ["Saved", "green", "check-circle"], ["Pending", "outline", "clock"], ["Not printed", "amber", "printer"], ["Printed", "green", "printer"], ["Check warning", "amber", "warning"], ["New", "green", null], ["Duplicate", "red", null]];
  const variants = T.map(([nm, tn, ic]) => { const [bg, fg] = TONE[tn];
    return { name: `Type=${nm}`, w: 100, h: 24, frame: pill(bg, { stroke: tn === "outline" ? "Surface/border-strong" : undefined, r: 6, gap: 4, pad: [0, 8, 0, 8] }),
      build(cid) { if (ic) b.icon(cid, ic, 14, fg); return { Label: b.text(cid, nm, { style: "Caption/Medium", color: fg, name: "Label" }) }; } }; });
  b.set(pan, "Tag", variants, { cols: 5, cw: 190, ch: 44, W: 5 * 190 + 32, H: 3 * 44 + 32 });
}
function small(b, host) {
  const pan = section(b, host, "Delta, count pill, role badge, avatar, file chip, summary chip", "Small display components.");
  const dv = [["Up", "green", "+12%"], ["Down", "red", "-4%"], ["Flat", "grey", "0%"]].map(([d, tn, tx]) => { const [bg, fg] = TONE[tn];
    return { name: `Direction=${d}`, w: 60, h: 21, frame: pill(bg, { pad: [0, 8, 0, 8] }), build(cid) { return { Label: b.text(cid, tx, { style: "Caption/SemiBold", color: fg, name: "Label" }) }; } }; });
  b.set(pan, "Delta", dv, { cols: 3, cw: 100, ch: 40, W: 332, H: 72, textProps: ["Label"] });
  const cv = [["Neutral", "Surface/muted", "Text/text-secondary"], ["Primary", "Primary/primary-100", "Text/text-secondary"], ["Alert", "Feedback/error-100", "Feedback/error"]].map(([t, bg, fg]) => ({ name: `Tone=${t}`, w: 24, h: 14, frame: { ...pill(bg, { pad: [0, 7, 0, 7] }), sizeV: "hug" }, build(cid) { return { Label: b.text(cid, "8", { style: "Caption/SemiBold", color: fg, name: "Label" }) }; } }));
  b.set(pan, "Count pill", cv, { cols: 3, cw: 80, ch: 40, W: 272, H: 72, textProps: ["Label"] });
  b.set(pan, "Role badge", [{ name: "Role", w: 90, h: 24, frame: pill("Surface/card", { stroke: "Surface/border-strong", pad: [0, 10, 0, 10] }), build(cid) { return { Label: b.text(cid, "Superadmin", { style: "Caption/Medium", color: "Text/text-secondary", name: "Label" }) }; } }], { cols: 1, cw: 140, ch: 44, W: 172, H: 72, textProps: ["Label"] });
  const av = [24, 28, 32, 40].map((s) => ({ name: `Size=${s}`, w: s, h: s, frame: { fill: "Accent/accent-100", r: 999, layout: "h", pad: 0, main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }, build(cid) { return { Initials: b.text(cid, "RL", { style: "Caption/SemiBold", color: "Accent/accent-text", name: "Initials" }) }; } }));
  b.set(pan, "Avatar", av, { cols: 4, cw: 64, ch: 60, W: 288, H: 92, textProps: ["Initials"] });
  const fv = [];
  for (const ty of ["PDF", "XLS", "CSV"]) for (const st of ["Available", "Missing"]) {
    const c = st === "Available" ? "Text/text-secondary" : "Text/text-muted";
    fv.push({ name: `Type=${ty}, State=${st}`, w: 54, h: 24, frame: pill(st === "Available" ? "Surface/card" : "Surface/muted", { stroke: "Surface/border-strong", r: 6, gap: 4, pad: [0, 8, 0, 8] }), build(cid) { b.icon(cid, ty === "PDF" ? "file-pdf" : ty === "XLS" ? "file-xls" : "file-csv", 14, c); b.text(cid, ty, { style: "Caption/Medium", color: c, name: "Label" }); } });
  }
  b.set(pan, "File chip", fv, { cols: 6, cw: 100, ch: 44, W: 632, H: 76 });
  const sv = [["Neutral", "Surface/muted", "Text/text-secondary"], ["Success", "Feedback/success-100", "Feedback/success"], ["Error", "Feedback/error-100", "Feedback/error"]].map(([t, bg, fg]) => ({ name: `Tone=${t}`, w: 100, h: 24, frame: pill(bg, { pad: [0, 10, 0, 10] }), build(cid) { return { Label: b.text(cid, "11 new", { style: "Caption/Medium", color: fg, name: "Label" }) }; } }));
  b.set(pan, "Summary chip", sv, { cols: 3, cw: 120, ch: 44, W: 392, H: 76, textProps: ["Label"] });
}
function chips(b, host) {
  const pan = section(b, host, "Person chip and On-target pill", "Person chip names who did the work (avatar and name, optional caret). On-target pill sits next to a KPI.");
  const pv = [];
  for (const caret of ["Off", "On"]) pv.push({ name: `Caret=${caret}`, w: 150, h: 32, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 999, layout: "h", gap: 8, pad: [4, 12, 4, 4], cross: "center", sizeH: "hug", sizeV: "fixed" }, build(cid) { const a = b.frame(cid, { name: "Avatar", w: 24, h: 24, fill: "Accent/accent-100", r: 12, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); b.text(a, "DK", { style: "Caption/SemiBold", color: "Accent/accent-text", name: "Initials" }); const t = b.text(cid, "Dedi Kurniawan", { style: "Body small/Medium", name: "Name" }); const c = b.icon(cid, "caret-down", 14, "Text/text-secondary"); if (caret === "Off") b.raw("node.set", { ids: [c], props: { visible: false } }); return { Name: t }; } });
  b.set(pan, "Person chip", pv, { cols: 2, cw: 190, ch: 52, W: 412, H: 84, textProps: ["Name"] });
  const ov = [["Good", "Status/st-completed-100", "Status/st-completed"], ["Warning", "Status/st-prep-100", "Status/st-prep"], ["Bad", "Feedback/error-100", "Feedback/error"]].map(([t, bg, fg]) => ({ name: `Tone=${t}`, w: 90, h: 22, frame: pill(bg, { gap: 4, pad: [0, 8, 0, 8] }), build(cid) { b.frame(cid, { name: "Dot", w: 6, h: 6, fill: fg, r: 3 }); return { Label: b.text(cid, "On target", { style: "Caption/Medium", color: fg, name: "Label" }) }; } }));
  b.set(pan, "On-target pill", ov, { cols: 3, cw: 130, ch: 44, W: 422, H: 76, textProps: ["Label"] });
}
module.exports = { statusBadge, tag, small, chips, TONE, pill };
