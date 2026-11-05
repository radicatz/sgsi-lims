const { section } = require("./found.js");
const STATES = ["Default", "Hover", "Pressed", "Focused", "Disabled", "Loading"];
// colour roles per Type/Tone/State -> {fill, fillOp, stroke, text}
function look(type, tone, st) {
  const dis = st === "Disabled";
  let o;
  if (tone === "Accent") {
    o = { fill: { Default: "Accent/accent", Hover: "Accent/accent-soft", Pressed: "Accent/accent-text", Focused: "Accent/accent", Disabled: "Surface/muted", Loading: "Accent/accent" }[st], text: st === "Pressed" ? "Text/text-inverse" : "Text/heading" };
  } else if (tone === "Danger") {
    if (type === "Primary") o = { fill: "Feedback/error", fillOp: { Hover: 0.92, Pressed: 0.82 }[st], text: "Text/text-inverse" };
    else if (type === "Secondary") o = { fill: { Hover: "Feedback/error-100", Pressed: "Rust/rust-100" }[st] || "Surface/card", stroke: "Feedback/error", text: "Feedback/error" };
    else o = { fill: { Hover: "Feedback/error-100", Pressed: "Rust/rust-100", Focused: "Feedback/error-100" }[st] || "none", text: "Feedback/error" };
  } else if (type === "Primary") o = { fill: { Default: "Action/action", Hover: "Action/action-hover", Pressed: "Action/action-strong", Focused: "Action/action", Disabled: "Surface/muted", Loading: "Action/action" }[st], text: "Action/action-foreground" };
  else if (type === "Secondary") o = { fill: { Hover: "Primary/primary-50", Pressed: "Primary/primary-100" }[st] || "Surface/card", stroke: "Surface/border-strong", text: "Action/brand-text" };
  else if (type === "Tertiary") o = { fill: { Default: "Primary/primary-50", Hover: "Primary/primary-100", Pressed: "Primary/primary-200" }[st] || "Primary/primary-50", text: "Action/brand-text" };
  else o = { fill: { Hover: "Primary/primary-50", Pressed: "Primary/primary-100", Focused: "Primary/primary-50" }[st] || "none", text: "Action/brand-text" };
  if (dis) { o.text = "Text/text-muted"; if (type === "Primary" || tone === "Accent") o.fill = "Surface/muted"; if (o.stroke) { o.stroke = "Surface/border"; o.fill = "Surface/muted"; } if (tone === "Danger") { o.fill = type === "Primary" ? "Surface/muted" : o.fill; } if (type === "Tertiary") o.fill = "Surface/muted"; if (type === "Ghost") o.fill = "none"; delete o.fillOp; }
  return o;
}
// Button sizes (owner, Nov 5, 2026): sm 28 (new), md 32 (was sm), lg 40 (was md), touch 44
const SIZES = { lg: { h: 40, px: 16, st: "Label/Button lg" }, md: { h: 32, px: 12, st: "Label/Button md" }, sm: { h: 28, px: 10, gap: 6, st: "Label/Button sm" }, touch: { h: 44, px: 20, st: "Label/Button lg" } };
const COMBOS = [["Primary", "Default"], ["Secondary", "Default"], ["Tertiary", "Default"], ["Ghost", "Default"], ["Primary", "Danger"], ["Secondary", "Danger"], ["Ghost", "Danger"], ["Primary", "Accent"]];

function button(b, host) {
  const pan = section(b, host, "Button", "Type: Primary (the one main action), Secondary, Tertiary (soft), Ghost (text only). Tone: Danger for destructive, Accent for the amber call to action. State: Default, Hover, Pressed, Focused (keyboard focus ring), Disabled, Loading (processing: spinner, not clickable).");
  const variants = [];
  for (const [type, tone] of COMBOS) for (const size of Object.keys(SIZES)) for (const st of STATES) {
    const z = SIZES[size], lk = look(type, tone, st);
    variants.push({
      name: `Type=${type}, Tone=${tone}, Size=${size}, State=${st}`, w: 120, h: z.h,
      frame: { fill: lk.fill, stroke: lk.stroke, sw: lk.stroke ? 1 : undefined, r: 999, opacity: undefined, layout: "h", gap: z.gap || 8, pad: [0, z.px, 0, z.px], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed", effects: undefined },
      build(cid) {
        let spin;
        if (st === "Loading") spin = b.icon(cid, "spinner", 14, lk.text);
        const lead = b.icon(cid, "plus", 14, lk.text);
        const label = b.text(cid, "Button", { style: z.st, color: lk.text, name: "Label" });
        const trail = b.icon(cid, "caret-right", 14, lk.text);
        b.raw("node.set", { ids: [lead, trail], props: { visible: false } });
        if (lk.fillOp) b.raw("node.set", { ids: [cid], props: { fills: [{ type: "solid", color: require("./dsl.js").LIGHT[lk.fill], opacity: lk.fillOp }] } });
        if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" });
        if (st === "Disabled") b.raw("node.set", { ids: [cid], props: { opacity: 1 } });
        return { Label: label, "Leading icon": lead, "Trailing icon": trail };
      },
    });
  }
  const r = b.set(pan, "Button", variants, { cols: 6, cw: 220, ch: 60, W: 6 * 220 + 32, H: Math.ceil(variants.length / 6) * 60 + 32, textProps: ["Label"], bools: [{ name: "Leading icon", key: "Leading icon", default: false }, { name: "Trailing icon", key: "Trailing icon", default: false }], swaps: [{ name: "Leading glyph", key: "Leading icon" }, { name: "Trailing glyph", key: "Trailing icon" }] });
  b.buttonSet = r.setId;
}
function iconButton(b, host) {
  const pan = section(b, host, "Icon button", "Round, icon only. Type: Primary, Secondary, Tertiary, Ghost. Same states as Button. Swap the glyph with the Icon property.");
  const variants = [], SZ = { 32: 14, 36: 14, 44: 20 };
  for (const type of ["Primary", "Secondary", "Tertiary", "Ghost"]) for (const size of [32, 36, 44]) for (const st of STATES) {
    const lk = look(type, "Default", st);
    variants.push({ name: `Type=${type}, Size=${size}, State=${st}`, w: size, h: size,
      frame: { fill: lk.fill, stroke: lk.stroke, sw: lk.stroke ? 1 : undefined, r: 999, layout: "h", pad: 0, main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) { if (st === "Loading") b.icon(cid, "spinner", SZ[size], lk.text); else b.icon(cid, "dots-three-vertical", SZ[size], lk.text); if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" }); } });
  }
  b.set(pan, "Icon button", variants, { cols: 6, cw: 70, ch: 60, W: 6 * 70 + 32, H: 12 * 60 + 32 });
}
function segmented(b, host) {
  const pan = section(b, host, "Segmented control", "Item sets one option of a small group (basis ADB / AR / DB / DAF, channel, Operations / Quality). Build the bar from 2 to 5 items in auto layout.");
  const variants = [];
  for (const sel of ["Off", "On"]) for (const st of ["Default", "Hover", "Pressed", "Focused", "Disabled"]) {
    const on = sel === "On", dis = st === "Disabled";
    const fill = on ? (dis ? "Surface/muted" : "Action/action") : { Hover: "Primary/primary-50", Pressed: "Primary/primary-100", Focused: "Primary/primary-50" }[st] || "none";
    const text = dis ? "Text/text-muted" : on ? "Action/action-foreground" : "Action/brand-text";
    variants.push({ name: `Selected=${sel}, State=${st}`, w: 60, h: 28, frame: { fill, r: 999, layout: "h", pad: [0, 12, 0, 12], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" }, build(cid) { if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" }); return { Label: b.text(cid, "ADB", { style: "Caption/SemiBold", color: text, name: "Label" }) }; } });
  }
  b.set(pan, "Segmented item", variants, { cols: 5, cw: 100, ch: 44, W: 532, H: 108, textProps: ["Label"] });
  const bar = b.frame(pan, { name: "Segmented control example", w: 260, h: 36, fill: "Surface/muted", r: 999, layout: "h", gap: 2, pad: 4, cross: "center", sizeH: "hug", sizeV: "hug" });
  ["ADB", "AR", "DB", "DAF"].forEach((t, i) => { const f = b.frame(bar, { name: "Item " + t, w: 56, h: 28, fill: i === 0 ? "Action/action" : "none", r: 999, layout: "h", pad: [0, 12, 0, 12], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" }); b.text(f, t, { style: "Caption/SemiBold", color: i === 0 ? "Action/action-foreground" : "Action/brand-text" }); });
}
function link(b, host) {
  const pan = section(b, host, "Link button", "Inline text action, for example Add a row, View all, Download template.");
  const variants = [];
  for (const st of ["Default", "Hover", "Pressed", "Focused", "Disabled"]) {
    const text = st === "Disabled" ? "Text/text-muted" : st === "Pressed" ? "Action/action-strong" : "Action/brand-text";
    variants.push({ name: `State=${st}`, w: 100, h: 24, frame: { fill: st === "Focused" ? "Primary/primary-50" : "none", r: 6, layout: "h", gap: 6, pad: [4, 4, 4, 4], main: "center", cross: "center", sizeH: "hug", sizeV: "hug" }, build(cid) { if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" }); b.icon(cid, "plus", 14, text); const t = b.text(cid, "Add a row", { style: "Body small/SemiBold", color: text, name: "Label" }); if (st === "Hover") b.raw("node.set", { ids: [t], props: { textDecoration: "underline" } }); return { Label: t }; } });
  }
  b.set(pan, "Link button", variants, { cols: 5, cw: 150, ch: 44, W: 782, H: 76, textProps: ["Label"] });
}
module.exports = { button, iconButton, segmented, link, look, STATES };
