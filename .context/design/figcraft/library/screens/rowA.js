// Row A · Job orders list (desktop, empty, tablet, phone)
const { B, LIGHT } = require("../dsl.js");
const { JO } = require("./parts.js");

const CHIPS = [["All", "128"], ["Draft", "3"], ["Awaiting samples", "9"], ["In progress", "21"], ["Reported", "4"], ["Delivered", "87"], ["Closed", "3"], ["Cancelled", "1"]];
const TITLE = (b, x, y, t) => b.text(undefined, t, { style: "Heading/H2", color: "Text/heading", x, y, name: "Row title" });

function chips(b, parent, wrap) {
  const r = b.frame(parent, { name: "Status chips", w: 800, h: 40, layout: "h", gap: 10, wrap, sizeH: "fill", sizeV: "hug", clip: !wrap });
  CHIPS.forEach(([l, c], i) => b.instV(r, "Filter chip", `Selected=${i === 0 ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: c } }));
  return r;
}
function head(b, main, kind, count) {
  const hdr = b.frame(main, { name: "Header", w: 800, h: 100, layout: kind === "phone" ? "v" : "h", gap: 12, main: "spaceBetween", cross: kind === "phone" ? "min" : "max", sizeH: "fill", sizeV: "hug" });
  const left = b.frame(hdr, { name: "Title block", w: 500, h: 90, layout: "v", gap: 4, sizeH: kind === "phone" ? "fill" : "hug", sizeV: "hug" });
  b.text(left, kind === "desktop" ? "WORK · TUESDAY 21 OCTOBER 2026" : "WORK · JOB ORDERS", { style: "Overline", color: "Text/text-muted", name: "Overline" });
  b.text(left, "Job orders", { style: kind === "phone" ? "Heading/H1" : "Display/XL", color: "Text/heading", name: "Title" });
  if (kind !== "phone") b.instV(hdr, "Button", "Type=Primary, Tone=Default, Size=md, State=Default", { texts: { Label: "New job order" }, setProps: { "Leading icon": true } });
  return hdr;
}
function filters(b, main, kind) {
  const r = b.frame(main, { name: "Filters", w: 800, h: 60, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug" });
  const search = b.instV(r, "Search", "Size=md, State=Default", { texts: { Value: "Search no., company, PO…" }, props: kind === "desktop" ? { width: 320 } : { sizingH: "fill" }, hide: ["Scan"] });
  if (kind === "desktop") {
    b.instV(r, "Select", "State=Default, Size=md", { texts: { Label: "Company", Value: "All companies" }, props: { width: 200 }, setProps: { "Show helper": false } });
    b.instV(r, "Select", "State=Default, Size=md", { texts: { Label: "CSO", Value: "All CSOs" }, props: { width: 180 }, setProps: { "Show helper": false } });
    b.instV(r, "Date field", "State=Default, Size=md", { texts: { Label: "Due date", Value: "Any date" }, props: { width: 200 }, setProps: { "Show helper": false } });
    b.frame(r, { name: "Spacer", w: 10, h: 10, sizeH: "fill", sizeV: "fixed" });
  }
  b.instV(r, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", { texts: { Label: "Filters" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("funnel") } });
  return r;
}
function card(b, main) { return b.frame(main, { name: "Table card", w: 800, h: 400, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 0, pad: 0, sizeH: "fill", sizeV: "hug", clip: true }); }
function footer(b, parent, kind) {
  const f = b.frame(parent, { name: "Footer", w: 800, h: 60, layout: "h", pad: [8, 16, 8, 16], cross: "center", main: "spaceBetween", sizeH: "fill", sizeV: "hug" });
  b.instV(f, "Pager", "Breakpoint=Desktop", { texts: { Summary: "Showing 1–10 of 128" }, props: { sizingH: "fill" } });
}
const status = (s) => `Status=${s}, Size=md`;
function row(b, parent, d, i) {
  const [no, co, attn, svc, smp, bat, due, dueState, st, coa] = d;
  const texts = { 0: no, 1: co, 2: attn, 3: svc, 4: smp, 5: bat, 6: due };
  const v = b.v("Table row", "Template=Job order, State=Default");
  const tagIdx = v.texts.findIndex((t, k) => k > 6 && t.chars === "CoA missing");
  if (coa[1] !== "No CoA") texts[tagIdx] = coa[1];
  b.instV(parent, "Table row", "Template=Job order, State=Default", { texts, fills: dueState === "late" ? { 6: "Feedback/error" } : undefined, swaps: [["Status badge", "Status badge", status(st)], ["Tag", "Tag", `Type=${coa[0]}`]], props: { sizingH: "fill" } });
}

function listDesktop(b, x, y, o = {}) {
  const s = b.shell({ name: o.name || "List · Desktop", x, y, kind: "desktop", active: "Job orders" });
  head(b, s.main, "desktop", "128 job orders · 21 in progress, 9 waiting for samples");
  if (o.empty) return s;
  chips(b, s.main, true);
  filters(b, s.main, "desktop");
  const c = card(b, s.main);
  b.instV(c, "Table header row", "Template=Job order", { props: { sizingH: "fill" } });
  JO.forEach((d, i) => row(b, c, d, i));
  footer(b, c, "desktop");
  return s;
}
function listEmpty(b, x, y) {
  const s = b.shell({ name: "List · Empty · Desktop", x, y, kind: "desktop", active: "Job orders" });
  b.text(s.main, "Job orders", { style: "Display/XL", color: "Text/heading", name: "Title" });
  const c = b.frame(s.main, { name: "Empty card", w: 800, h: 520, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", main: "center", cross: "center", sizeH: "fill", sizeV: "fixed" });
  b.instV(c, "Empty state", "Size=Page", { texts: { Title: "No job orders yet", Text: "A job order holds a company's request and its sample IDs.", Label: "New job order" }, swaps: [[0, "Icon", "Glyph=clipboard-text, Size=20"]] });
  return s;
}
function listTablet(b, x, y) {
  const s = b.shell({ name: "List · Tablet", x, y, kind: "tablet", active: "Job orders", search: "Search batch, lab code…" });
  head(b, s.main, "tablet", "128 job orders · 21 in progress");
  b.frame(s.main, { name: "Spacer", w: 1, h: 1, sizeH: "fixed", sizeV: "fixed" });
  chips(b, s.main, false);
  filters(b, s.main, "tablet");
  const c = card(b, s.main);
  b.instV(c, "Table header row compact", "Template=Job order", { props: { sizingH: "fill" } });
  JO.forEach((d) => {
    const [no, co, attn, svc, smp, bat, due, dueState, st, coa] = d;
    const n = smp.split(" / ");
    const t = { Number: no, Company: co, Line: `${n[1]} samples · ${svc}`, Due: due.replace(" 2026", "") };
    b.instV(c, "Table row compact", "Template=Job order, State=Default", { texts: t, fills: dueState === "late" ? { Due: "Feedback/error" } : undefined, swaps: [["Status badge", "Status badge", status(st)], ["Tag", "Tag", `Type=${coa[0]}`]], props: { sizingH: "fill" } });
  });
  footer(b, c, "tablet");
  return s;
}
function listPhone(b, x, y) {
  const s = b.shell({ name: "List · Phone", x, y, kind: "phone", active: "Job orders" });
  head(b, s.main, "phone", "128 job orders · 21 in progress");
  const sr = b.frame(s.main, { name: "Search row", w: 358, h: 44, layout: "h", gap: 10, cross: "center", sizeH: "fill", sizeV: "hug" });
  b.instV(sr, "Search", "Size=lg, State=Default", { texts: { Value: "Search no., company, PO…" }, props: { sizingH: "fill" }, hide: ["Scan"] });
  b.instV(sr, "Icon button", "Type=Secondary, Size=44, State=Default", { swaps: [[0, "Icon", `Glyph=funnel, Size=20`]] });
  chips(b, s.main, false);
  JO.slice(0, 6).forEach((d) => {
    const [no, co, attn, svc, smp, bat, due, dueState, st, coa, prog, roa] = d;
    const late = dueState === "late" ? "Yes" : "No";
    const v = b.v("Card job order", `Past due=${late}`);
    const id = b.instV(s.main, "Card job order", `Past due=${late}`, { texts: { Number: no, Company: co, Service: svc + " · ASTM", Batches: "Batches " + bat, Due: "Due " + due.replace(" 2026", ""), RoA: roa, CoA: "CoA " + (coa[1] === "No CoA" ? "—" : coa[1].replace("Sent · ", "Sent ")) }, swaps: [["Badge", "Status badge", status(st)]], props: { sizingH: "fill" } });
    const [a, tot] = prog.split("/").map(Number);
    b.raw("node.set", { ids: [id + v.off.Progress + 3], props: { characters: prog } });
    if (a === 0) b.raw("node.set", { ids: [id + v.off.Progress + 2], props: { visible: false } });
    else b.raw("node.set", { ids: [id + v.off.Progress + 2], props: { width: Math.max(8, Math.round(270 * (tot ? a / tot : 0))) } });
  });
  const bar = b.frame(s.root, { name: "Sticky bar", w: 390, h: 76, fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "h", pad: 16, cross: "center", sizeH: "fill", sizeV: "fixed" });
  b.instV(bar, "Button", "Type=Primary, Tone=Default, Size=touch, State=Default", { texts: { Label: "New job order" }, setProps: { "Leading icon": true }, props: { sizingH: "fill" } });
  return s;
}

exports.build = (b) => {
  b.patchTables();
  b.patchParts();
  TITLE(b, 0, -90, "A · Job orders list");
  listDesktop(b, 0, 0);
  listEmpty(b, 1560, 0);
  listTablet(b, 3120, 0);
  listPhone(b, 4074, 0);
};
exports.listDesktop = listDesktop; exports.listTablet = listTablet;
