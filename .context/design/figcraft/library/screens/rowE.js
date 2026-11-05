// Row E · CoA and actions: CoA tab with Mark sent (desktop), CoA sent, Mark sent sheet (phone), P7 Cancel job order. Runs after row D.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, detailFrame, batches, scrimOver, dialogAt } = H;

const JO0141 = { no: "JO-2026-0141", meta: "PT Kaltara Energi Prima · Attn. Sari Wulandari · PO KEP-118 · Due 23 Oct 2026", counts: { b: 1, s: 8, f: 2 } };
const icon = (b, parent, glyph, tok) => { const ic = b.instV(parent, "Icon", "Glyph=" + glyph + ", Size=14"); b.raw("node.set", { ids: [ic + 1], props: { fill: LIGHT[tok] } }); b.bind(ic + 1, "fill", tok); return ic; };
const btn = (b, parent, type, label, glyph, size = "md") => b.instV(parent, "Button", `Type=${type}, Tone=Default, Size=${size}, State=Default`, { texts: { Label: label }, setProps: glyph ? { "Leading icon": true, "Leading glyph": b.iconId(glyph) } : { "Leading icon": false } });

function coaCard(b, main, kind, sent) {
  const phone = kind === "phone";
  const c = card(b, main, "CoA card");
  const hd = b.frame(c, { name: "Card head", w: 400, h: 40, layout: phone ? "v" : "h", gap: 12, cross: phone ? "min" : "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
  const t = b.frame(hd, { name: "Titles", w: 200, h: 26, layout: "h", gap: 10, cross: "center", sizeH: "hug", sizeV: "hug" });
  b.text(t, "Certificate of Analysis", { style: "Heading/H3", color: "Text/heading", name: "Title" });
  b.instV(t, "Status badge", `Status=${sent ? "Delivered" : "Reported"}, Size=md`);
  const act = b.frame(hd, { name: "Actions", w: 200, h: 32, layout: "h", gap: 8, cross: "center", wrap: phone, sizeH: phone ? "fill" : "hug", sizeV: "hug" });
  btn(b, act, "Secondary", "Download PDF", "file-pdf");
  if (!phone) btn(b, act, "Secondary", "Print", "printer");
  btn(b, act, "Primary", sent ? "Add another send" : "Mark sent", "paper-plane-tilt");
  const kv = b.frame(c, { name: "Facts", w: 400, h: 100, layout: "v", gap: 12, sizeH: "fill", sizeV: "hug" });
  [["Number", "CoA-JO-2026-0141-1"], ["Revision", "1"], ["Published", "24 Oct 2026 · Maya Lestari"], ["Signatory", "Ir. Bambang Sutrisno, M.T. · Laboratory Manager"], ["Covers", "1 batch · 8 samples"]]
    .forEach(([k, v]) => b.instV(kv, "Key-value row", phone ? "Layout=Stacked" : "Layout=Inline", { texts: { Key: k, Value: v }, props: { sizingH: "fill" } }));
  if (sent) {
    const n = b.frame(c, { name: "Sent", w: 400, h: 44, fill: "Status/st-completed-100", r: 10, layout: "h", gap: 8, pad: [10, 14, 10, 14], cross: "center", wrap: phone, sizeH: "fill", sizeV: "hug" });
    icon(b, n, "whatsapp-logo", "Status/st-completed");
    b.text(n, "Sent by WhatsApp to", { style: "Body small/Regular", color: "Text/foreground", name: "Text" });
    b.text(n, "Sari Wulandari", { style: "Body small/SemiBold", color: "Text/foreground", name: "Recipient" });
    b.text(n, "25 Oct 2026", { style: "Body small/Regular", color: "Text/text-secondary", name: "Date" });
  }
  b.text(c, "Built from", { style: "Body small/SemiBold", color: "Text/text-secondary", name: "Section" });
  const r = b.frame(c, { name: "Batch", w: 400, h: 40, fill: "Primary/primary-50", r: 10, layout: "h", gap: 10, pad: [10, 14, 10, 14], cross: "center", wrap: phone, sizeH: "fill", sizeV: "hug" });
  icon(b, r, "check-circle", "Status/st-completed");
  b.text(r, "B-2026-0416", { style: "Data/Strong", color: "Text/heading", name: "Batch" });
  b.text(r, "RoA-0416", { style: "Data", color: "Text/text-secondary", name: "RoA" }); // plain text: the CSO cannot open the RoA file
  b.text(r, "Approved by Hendra Wijaya, S.T.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Approved" });
  return c;
}
function coaFrame(b, x, y, kind, name, sent) {
  const s = detailFrame(b, x, y, kind, { ...JO0141, name, status: sent ? "Delivered" : "Reported", steps: ["14 Oct", "15 Oct", "16 Oct", "22 Oct", "24 Oct", sent ? "25 Oct" : ""], cur: sent ? 6 : 5, tab: "CoA" });
  coaCard(b, s.main, kind, sent);
  return s;
}
function markSentFields(b, body, W, phone) {
  const f = b.frame(body, { name: "Fields", w: W, h: 200, layout: "v", gap: 14, sizeH: "fill", sizeV: "hug" });
  const sz = phone ? "touch" : "md";
  const r = b.frame(f, { name: "Row", w: W, h: 70, layout: phone ? "v" : "h", gap: 12, sizeH: "fill", sizeV: "hug" });
  b.instV(r, "Date field", `State=Filled, Size=${sz}`, { texts: { Label: "Date sent *", Value: "25 Oct 2026" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(r, "Text field", `State=Filled, Size=${sz}`, { texts: { Label: "Recipient *", Value: "Sari Wulandari", Helper: "Pre-filled from the job order contact." }, setProps: { "Show helper": true }, props: { sizingH: "fill" } });
  const ch = b.frame(f, { name: "Channel", w: W, h: 60, layout: "v", gap: 6, sizeH: "fill", sizeV: "hug" });
  b.text(ch, "Channel * (tick every way it was sent)", { style: "Body small/SemiBold", color: "Text/text-secondary", name: "Field label" });
  const cb = b.frame(ch, { name: "Channel options", w: W, h: 24, layout: "h", gap: 20, wrap: true, cross: "center", sizeH: "fill", sizeV: "hug" });
  ["Hard copy", "Email", "WhatsApp", "Other"].forEach((l) => b.instV(cb, "Checkbox", `Checked=${l === "WhatsApp" ? "On" : "Off"}, State=Default`, { texts: { Label: l } }));
  b.instV(f, "Text field", `State=Default, Size=${sz}`, { texts: { Label: "Note (optional)", Value: "e.g. courier receipt no." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
}

function markSentDesktop(b, x, y) {
  const s = coaFrame(b, x, y, "desktop", "CoA · Mark sent · Desktop", false);
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: 1018 } });
  scrimOver(b, s.root, 1440, 1018);
  dialogAt(b, s.root, "md", Math.round((1440 - 560) / 2) + 64, 200, "Mark CoA as sent", "CoA-JO-2026-0141-1 for PT Kaltara Energi Prima.", "Cancel", "Confirm", (bd) => markSentFields(b, bd, 512, false));
}
function markSentPhone(b, x, y) {
  const s = coaFrame(b, x, y, "phone", "CoA · Mark sent sheet · Phone", false);
  const HH = 1200;
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: HH } });
  scrimOver(b, s.root, 390, HH);
  const v = b.v("Bottom sheet");
  const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: "Mark CoA as sent" }, props: { absolute: true, x: 0, y: HH - 490, width: 390 } });
  const btns = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + btns[0].pos + 3], props: { characters: "Cancel" } });
  b.raw("node.set", { ids: [id + btns[1].pos + 3], props: { characters: "Confirm" } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug" } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } });
  b.text(id + v.names.Body, "CoA-JO-2026-0141-1 for PT Kaltara Energi Prima.", { style: "Body small/Regular", color: "Text/text-secondary", name: "Text", fill: true });
  markSentFields(b, id + v.names.Body, 342, true);
}
function cancelP7(b, x, y) {
  const s = batches(b, x, y, "desktop", true);
  b.raw("node.set", { ids: [s.root], props: { name: "Cancel job order · P7 · Desktop", sizingV: "fixed", height: 1018 } });
  scrimOver(b, s.root, 1440, 1018);
  dialogAt(b, s.root, "md", Math.round((1440 - 560) / 2) + 64, 260, "Cancel JO-2026-0137?", "No sample has been received yet, so the job order can still be cancelled. The company and its contacts stay.", "Keep job order", "Cancel job order", (bd) => {
    b.instV(bd, "Textarea", "State=Default, Size=md", { texts: { Label: "Reason *", Value: "e.g. Client postponed the shipment" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  }, "Destructive");
}

exports.build = (b) => {
  const Y = b.rowE; if (!Y) throw new Error("run row D before row E");
  page(b, "desktop"); TITLE(b, 0, Y.desktop - 90, "E · CoA and actions");
  markSentDesktop(b, 0, Y.desktop);
  page(b, "desktop"); coaFrame(b, 1560, Y.desktop, "desktop", "CoA · Sent · Desktop", true);
  page(b, "desktop"); cancelP7(b, 3120, Y.desktop);
  page(b, "phone"); TITLE(b, 0, Y.phone - 90, "E · CoA and actions");
  markSentPhone(b, 0, Y.phone);
};
