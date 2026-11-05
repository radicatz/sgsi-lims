const { section } = require("./found.js");

const TONES = { Error: ["warning-circle", "Feedback/error", "Feedback/error-100"], Warning: ["warning", "Feedback/warning", "Feedback/warning-100"], Info: ["info", "Feedback/info", "Feedback/info-100"], Success: ["check-circle", "Feedback/success", "Feedback/success-100"] };

function feedback(b, pan) {
  const al = Object.entries(TONES).map(([t, [ic, fg, bg]]) => ({ name: `Tone=${t}`, w: 420, h: 64, frame: { fill: bg, stroke: fg, sw: 1, r: 12, layout: "h", gap: 10, pad: 14, cross: "min", sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      b.icon(cid, ic, 20, fg);
      const c = b.frame(cid, { name: "Text", w: 300, h: 40, layout: "v", gap: 2, sizeH: "fill", sizeV: "hug" });
      const ti = b.text(c, "Logic check failed", { style: "Body small/SemiBold", color: fg, name: "Title", fill: true });
      const tx = b.text(c, "SS-1174: Ash + VM + IM exceeds 100%.", { style: "Caption/Regular", color: "Text/text-secondary", name: "Text", fill: true });
      const ac = b.text(cid, "Review", { style: "Body small/SemiBold", color: fg, name: "Action" });
      return { Title: ti, Text: tx, Action: ac };
    } }));
  b.set(pan, "Inline alert", al, { cols: 4, cw: 470, ch: 110, W: 1912, H: 142, textProps: ["Title", "Text", "Action"], bools: [{ name: "Show action", key: "Action", default: true }] });
  const nt = b.component(pan, { name: "Info note", w: 480, h: 24, layout: "h", gap: 8, pad: 0, cross: "min", sizeH: "fixed", sizeV: "hug" });
  b.icon(nt, "info", 14, "Text/text-muted");
  b.text(nt, "These IDs are printed on the labels. Rows lock once preparation starts.", { style: "Caption/Regular", color: "Text/text-secondary", name: "Text", fill: true });
  const ts = Object.entries({ Success: ["check-circle", "Status/st-completed"], Error: ["warning-circle", "Rust/rust"], Info: ["info", "Accent/accent-soft"] }).map(([t, [ic, col]]) => ({ name: `Tone=${t}`, w: 260, h: 44, frame: { fill: "Primary/primary-deep", r: 999, layout: "h", gap: 10, pad: [0, 18, 0, 14], cross: "center", sizeH: "hug", sizeV: "fixed" },
    build(cid) { b.icon(cid, ic, 20, col); const x = b.text(cid, "Row SS-1172 saved", { style: "Body small/SemiBold", color: "Text/text-inverse", name: "Text" }); const a = b.text(cid, "Undo", { style: "Body small/SemiBold", color: "Accent/accent-soft", name: "Action" }); b.raw("style.apply", { ids: [cid], style: "Elevation/lg" }); return { Text: x, Action: a }; } }));
  b.set(pan, "Toast", ts, { cols: 3, cw: 320, ch: 80, W: 992, H: 112, textProps: ["Text", "Action"], bools: [{ name: "Show action", key: "Action", default: false }] });
  const tp = ["Top", "Bottom", "Left", "Right"].map((pl) => ({ name: `Placement=${pl}`, w: 220, h: 44, frame: { fill: "none", sizeH: "fixed", sizeV: "fixed" },
    build(cid) {
      const bx = b.frame(cid, { name: "Box", x: 0, y: 4, w: 210, h: 34, fill: "Primary/primary-deep", r: 8, layout: "h", pad: [0, 12, 0, 12], main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
      const t = b.text(bx, "Locked: preparation has started", { style: "Caption/Medium", color: "Text/text-inverse", name: "Text" });
      const pos = { Top: [100, 33], Bottom: [100, -1], Left: [205, 14], Right: [-5, 14] }[pl];
      const ar = b.frame(cid, { name: "Arrow", x: pos[0], y: pos[1] + 4, w: 10, h: 10, fill: "Primary/primary-deep" });
      b.raw("node.set", { ids: [ar], props: { rotation: 45 } });
      return { Text: t };
    } }));
  b.set(pan, "Tooltip", tp, { cols: 4, cw: 270, ch: 90, W: 1112, H: 122, textProps: ["Text"] });
}

function sheets(b, pan) {
  const footer = (cid, w, danger, a, c) => { const f = b.frame(cid, { name: "Footer", w, h: 56, layout: "h", gap: 12, main: "max", cross: "center", sizeH: "fill", sizeV: "hug" }); b.instT(f, "Button", "Type=Secondary, Tone=Default, Size=lg, State=Default", { Label: c }); b.instT(f, "Button", danger ? "Type=Primary, Tone=Danger, Size=md, State=Default" : "Type=Primary, Tone=Default, Size=md, State=Default", { Label: a }); return f; };
  const head = (cid, w, title) => { const h = b.frame(cid, { name: "Header", w, h: 32, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" }); const t = b.text(h, title, { style: "Heading/H3", color: "Text/heading", name: "Title", fill: true }); b.inst(h, "Icon button", "Type=Ghost, Size=32, State=Default"); return t; };
  const dv = [];
  for (const type of ["Default", "Destructive"]) for (const [sz, W] of [["sm", 400], ["md", 560], ["lg", 800]]) {
    dv.push({ name: `Type=${type}, Size=${sz}`, w: W, h: 240, frame: { fill: "Surface/card", r: 16, layout: "v", gap: 16, pad: 24, sizeH: "fixed", sizeV: "hug", stroke: "Surface/border", sw: 1 },
      build(cid) {
        b.raw("style.apply", { ids: [cid], style: "Elevation/lg" });
        const t = head(cid, W - 48, type === "Destructive" ? "Cancel job order JO-2026-0134?" : "Add 11 rows?");
        const body = b.frame(cid, { name: "Body", w: W - 48, h: 60, layout: "v", gap: 8, sizeH: "fill", sizeV: "hug" });
        const tx = b.text(body, type === "Destructive" ? "No samples have been received yet, so the job order can still be cancelled. It stays in the list as Cancelled and cannot be reopened." : "11 new rows will be added to this job order. Duplicate IDs are skipped and marked in the list.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Text", fill: true });
        footer(cid, W - 48, type === "Destructive", type === "Destructive" ? "Cancel job order" : "Add 11 rows", type === "Destructive" ? "Keep job order" : "Cancel");
        return { Title: t, Text: tx, Body: body };
      } });
  }
  b.set(pan, "Dialog", dv, { cols: 3, cw: 860, ch: 340, W: 3 * 860 + 32, H: 2 * 340 + 32, textProps: ["Title", "Text"], slots: [{ key: "Body", name: "Body" }] });
  const sv = [480, 640].map((W) => ({ name: `Width=${W}`, w: W, h: 760, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "v", gap: 16, pad: 24, sizeH: "fixed", sizeV: "fixed" },
    build(cid) { b.raw("style.apply", { ids: [cid], style: "Elevation/xl" }); const t = head(cid, W - 48, "New job order"); const body = b.frame(cid, { name: "Body", w: W - 48, h: 560, fill: "Surface/muted", r: 12, layout: "v", main: "center", cross: "center", sizeH: "fill", sizeV: "fill" }); footer(cid, W - 48, false, "Create job order", "Cancel"); return { Title: t, Body: body }; } }));
  b.set(pan, "Side sheet", sv, { cols: 2, cw: 700, ch: 820, W: 1432, H: 852, textProps: ["Title"], slots: [{ key: "Body", name: "Body" }] });
  const bs = [{ name: "Sheet", w: 390, h: 420, frame: { fill: "Surface/card", r: [20, 20, 0, 0], layout: "v", gap: 14, pad: [10, 16, 20, 16], sizeH: "fixed", sizeV: "hug", stroke: "Surface/border", sw: 1 },
    build(cid) { b.raw("style.apply", { ids: [cid], style: "Elevation/xl" }); const hd = b.frame(cid, { name: "Handle", w: 358, h: 6, layout: "h", main: "center", sizeH: "fill", sizeV: "fixed" }); b.frame(hd, { name: "Bar", w: 36, h: 4, fill: "Surface/border-strong", r: 2 }); const t = head(cid, 358, "Mark CoA as sent"); const body = b.frame(cid, { name: "Body", w: 358, h: 160, fill: "Surface/muted", r: 12, layout: "v", main: "center", cross: "center", sizeH: "fill", sizeV: "fixed" }); footer(cid, 358, false, "Confirm", "Cancel"); return { Title: t, Body: body }; } }];
  b.set(pan, "Bottom sheet", bs, { cols: 1, cw: 430, ch: 500, W: 462, H: 532, textProps: ["Title"], slots: [{ key: "Body", name: "Body" }] });
  const sc = b.component(pan, { name: "Scrim", w: 480, h: 300, fill: "Primary/primary-deep", opacity: 0.42 });
}
function overlays(b, host) {
  feedback(b, section(b, host, "Inline alert · Info note · Toast · Tooltip", "Alert sits inside a page next to the problem. Toast confirms an action and fades. Tooltip explains a locked row or a disabled control."));
  sheets(b, section(b, host, "Dialog · Side sheet · Bottom sheet · Scrim", "Dialog for a decision (Destructive for cancel and delete). Side sheet for long forms on desktop and tablet; Bottom sheet is its phone version. Body is a slot: drop any content into it."));
}
module.exports = { overlays };
