// Revision C: patches existing frame specs and composes the new frames (N6..N10).
const fs = require("fs");
const vm = require("vm");
const cv = require("./convert.js");

const ICONS = (() => { const w = {}; vm.runInNewContext(fs.readFileSync("D:/SGSI/LIMS/.context/prototype/src/icons.js", "utf8"), { window: w }); return w.ICONS; })();
const RED = "#C04020", NAVY = "#0E2A4E", BLUE = "#1B3A6F", MUTED = "#7D8699", INK = "#1A1A1A", SLATE = "#4A5876", LINE = "#D9CFB8", CREAM = "#F3EEE3", GREEN = "#2E7D5B";

const clone = (o) => JSON.parse(JSON.stringify(o));
const walk = (n, f, p) => { f(n, p); (n.ch || []).forEach((c) => walk(c, f, n)); };
const find = (n, pred) => { let r = null; walk(n, (x) => { if (!r && pred(x)) r = x; }); return r; };
const findAll = (n, pred) => { const r = []; walk(n, (x) => { if (pred(x)) r.push(x); }); return r; };
const removeWhere = (n, pred) => { let c = 0; if (!n.ch) return 0; n.ch = n.ch.filter((x) => { if (pred(x)) { c++; return false; } return true; }); n.ch.forEach((x) => (c += removeWhere(x, pred))); return c; };
const textMap = (n, fn) => walk(n, (x) => { if (x.k === "t") x.tx = fn(x.tx); });
const T = (tx, fs, c, fw, extra) => Object.assign({ k: "t", tx, fs, c, fw: fw || 400 }, extra || {});

let SV = null; // svgs registry of the current build
let sc = 0;
function icon(name, color, size) {
  const body = ICONS[name];
  if (!body) throw new Error("icon " + name);
  const svg = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${body.replace("<path ", "<path fill=\"" + color + "\" ")}</svg>`
    .replace(/<path fill="([^"]+)" d="([^"]+)"\/>/g, '<path d="$2" fill="$1"/>');
  const key = "r" + sc++;
  SV[key] = svg;
  return { k: "v", sv: key, w: size, h: size };
}
const thumb = (w, h, r, a, b) => ({ n: "Photo", w, h, r, fg: [135, [[a || "#CDB98F", 0], [b || "#7F9BBE", 1]]] });
const chip = (label, sel) => ({ n: "Tag chip", d: "H", p: [6, 12, 6, 12], r: 999, f: sel ? BLUE : "#FFFFFF", s: sel ? undefined : [LINE, 1, "C"], ch: [T(label, 13, sel ? "#FFFFFF" : NAVY, 600)] });

// ---------- shared patches ----------
const PHOTOS = { "BNM-3501": 2, "BNM-3502": 1, "BNM-3504": 2 };

function dropPerformer(t) {
  removeWhere(t, (n) => n.n === "Performer chip");
  removeWhere(t, (n) => n.d === "H" && n.ch && n.ch.length <= 3 && n.h && n.h >= 40 && n.h <= 60 && find(n, (x) => x.tx === "Dedi Kurniawan") && find(n, (x) => x.tx === "DK"));
}
function sixPhone(t) {
  textMap(t, (s) => s.replace(/^Step (\d) of 5/, "Step $1 of 6"));
  const bars = find(t, (n) => n.d === "H" && n.ch && n.ch.length === 5 && n.ch.every((c) => c.h && c.h <= 6));
  if (bars) bars.ch.push(clone(bars.ch[4]));
}
function recvText(t) {
  dropPerformer(t);
  textMap(t, (s) => s
    .replace(/^Start Preparation$/, "Confirm reception").replace(/^Start$/, "Confirm")
    .replace("BEFORE YOU CAN START PREPARATION", "BEFORE YOU CAN CONFIRM RECEPTION")
    .replace(/^Start with (\d+) of (\d+) samples\?$/, "Confirm reception with $1 of $2 samples?")
    .replace("when preparation started", "when reception was confirmed"));
}

function batchPencil(t) {
  const h = find(t, (n) => n.n === "Number and status");
  if (!h || find(h, (n) => n.n === "Edit number")) return;
  const status = find(h, (n) => n.n === "Status");
  if (!status || !find(status, (n) => n.tx === "Created")) return;
  const i = h.ch.findIndex((c) => c.n === "Heading");
  h.ch.splice(i + 1, 0, { n: "Edit number", d: "H", a: "C", i: "C", w: 32, h: 32, r: 999, f: "#FFFFFF", s: ["#E3DCCB", 1, "C"], ch: [icon("pencil-simple", SLATE, 16)] });
}

function photosCol(t) {
  const hr = find(t, (n) => n.n === "Header Row");
  if (!hr) return 0;
  const idx = hr.ch.findIndex((c) => find(c, (x) => x.tx === "Label"));
  const src = hr.ch.find((c) => find(c, (x) => x.tx === "Containers")) || hr.ch[idx];
  if (idx < 0 || !src) return 0;
  const hc = clone(src); hc.w = 84; find(hc, (x) => x.k === "t").tx = "Photos";
  hr.ch.splice(idx, 0, hc);
  const ci = hr.ch.findIndex((c) => c !== hc && find(c, (x) => x.tx === "Containers"));
  hc.w = 76; if (ci >= 0) { hr.ch[idx + 1].w = 124; hr.ch[ci].w = 72; }
  let n = 0;
  findAll(t, (x) => /^Row BNM/.test(x.n || "")).forEach((r) => {
    const id = r.n.slice(4), arrived = !!find(r, (x) => x.n === "Checked" || (x.f === BLUE && x.w === 20)), cnt = PHOTOS[id];
    let cell;
    if (!arrived) cell = { d: "H", w: 84, i: "C", ch: [T("—", 13, MUTED)] };
    else if (cnt) cell = { d: "H", w: 84, i: "C", g: 6, ch: [icon("paperclip", SLATE, 14), T(String(cnt), 13, NAVY, 600), thumb(26, 26, 6)] };
    else cell = { d: "H", w: 84, i: "C", g: 5, ch: [icon("plus", BLUE, 12), T("Add", 12.5, BLUE, 600)] };
    cell.w = 76;
    r.ch.splice(idx, 0, cell); if (ci >= 0) { r.ch[idx + 1].w = 124; r.ch[ci].w = 72; } n++;
  });
  return n;
}

function photoStrips(t) {
  let n = 0;
  findAll(t, (x) => /^Card BNM/.test(x.n || "")).forEach((card) => {
    const id = card.n.slice(5), arrived = !!find(card, (x) => x.f === BLUE && x.w === 28), cnt = PHOTOS[id] || 0;
    if (!arrived) return;
    const kids = [];
    for (let i = 0; i < cnt; i++) kids.push(thumb(40, 40, 8));
    kids.push({ k: undefined, w: "F", h: 1 });
    kids.push({ n: "Button/Outline", d: "H", g: 6, i: "C", p: [8, 12, 8, 12], f: "#FFFFFF", r: 999, s: [LINE, 1, "C"], ch: [icon("plus", NAVY, 14), T("Add photo", 13, NAVY, 600)] });
    card.ch.push({ n: "Photos", d: "H", g: 8, i: "C", w: "F", ch: kids });
    n++;
  });
  return n;
}

function sixSteps(t) {
  const bp = find(t, (n) => n.n === "Batch progress");
  if (!bp) return;
  const steps = bp.ch.filter((c) => /^Step\//.test(c.n || ""));
  const up = bp.ch.find((c) => c.n === "Line upcoming"), done = bp.ch.find((c) => c.n === "Line done");
  if (steps.length !== 5 || !up || !done) return;
  const total = (up.w * 5) / 4, nd = steps.filter((s) => s.n === "Step/Done").length;
  const last = clone(steps[steps.length - 1]); find(last, (x) => x.tx === "Analysis").tx = "Completed";
  bp.ch.push(last);
  up.ab = [total / 12, up.ab[1]]; up.w = +(total * 5 / 6).toFixed(1);
  done.ab = [total / 12, done.ab[1]]; done.w = Math.max(0.5, +(nd * total / 6).toFixed(1));
}

let TAB_ON = null, TAB_OFF = null;
function tabs(t, order, active, counts) {
  const tb = find(t, (n) => n.n === "Tabs");
  if (!tb) return;
  const on = TAB_ON || clone(tb.ch.find((c) => c.n === "Tab/Underline")), off = TAB_OFF || clone(tb.ch.find((c) => c.n === "Tab/Underline · Off"));
  if (on && off) { TAB_ON = TAB_ON || on; TAB_OFF = TAB_OFF || off; }
  if (!TAB_ON || !TAB_OFF) return;
  tb.ch = order.map((lab) => { const n = clone(lab === active ? TAB_ON : TAB_OFF); find(n, (x) => x.n === "Label").tx = lab; const c = find(n, (x) => x.n === "Value"); if (c && counts[lab] !== undefined) c.tx = String(counts[lab]); else if (c) removeWhere(n, (x) => x.n === "Count"); n.w = undefined; return n; });
}

function removeColumn(t, re) {
  const hr = find(t, (n) => n.n === "Header Row");
  if (!hr) return 0;
  const idx = hr.ch.findIndex((c) => findAll(c, (x) => x.k === "t" && re.test(x.tx)).length);
  if (idx < 0) return 0;
  hr.ch.splice(idx, 1);
  findAll(t, (x) => /^Row BNM/.test(x.n || "")).forEach((r) => r.ch.splice(idx, 1));
  return 1;
}

function prepPatch(t) {
  dropPerformer(t);
  while (removeColumn(t, /^(Mass after|Top size)/));
  textMap(t, (s) => s.replace(/^Performer$/, "Entered by")
    .replace("An analyst can start analysis from Input ROA.", "The Analyst enters results in the Analysis tab."));
  removeWhere(t, (n) => n.d === "V" && n.ch && n.ch[0] && n.ch[0].k === "t" && /^(Mass after|Top size)/.test(n.ch[0].tx));
  for (let i = 0; i < 3; i++) removeWhere(t, (n) => n.d === "H" && n.ch && n.ch.length === 0);
}

function sizeOf(n) { return 1 + (n.ch || []).reduce((a, c) => a + sizeOf(c), 0); }
// A sample row or card: the smallest node holding the sample id text and a status Label with the given text.
function sampleRow(t, id, label) {
  let best = null, bs = 1e9;
  walk(t, (n) => { if (n.ch && find(n, (x) => x.tx === id) && find(n, (x) => x.n === "Label" && x.tx === label)) { const z = sizeOf(n); if (z < bs) { best = n; bs = z; } } });
  return best;
}
function toInBatch(t, id, batch) {
  const row = sampleRow(t, id, "Received");
  if (!row) return 0;
  const chip = find(row, (x) => x.f === "#E2F2EA" && find(x, (y) => y.n === "Label"));
  if (!chip) return 0;
  chip.f = "#E3EAF4"; find(chip, (y) => y.n === "Dot").f = BLUE;
  const l = find(chip, (y) => y.n === "Label"); l.tx = "In batch"; l.c = BLUE;
  walk(row, (x) => { if (x.k === "t" && /^B-2026-\d{4}$/.test(x.tx)) x.tx = batch; });
  return 1;
}
function joPatch(t, name) {
  const hasCounts = !!find(t, (n) => n.k === "t" && /^\d+ received · /.test(n.tx));
  textMap(t, (s) => s.replace(/^Registered$/, "Expected")
    .replace(/(\d+) registered samples are not in a batch yet\./, "$1 expected samples are not in a batch yet.")
    .replace("Rows lock once preparation starts", "Rows lock once reception is confirmed")
    .replace(/(\d+) samples registered/, hasCounts ? "$1 samples" : "$1 samples · $1 expected")
    .replace(/^(\d+) samples received$/, "$1 samples · $1 received"));
  // five states: in the awaiting-arrival frames the last two received samples belong to a second batch that is not confirmed yet
  if (/Awaiting arrival|Mark as not received/.test(name || "")) {
    const n = toInBatch(t, "BNM-3505", "B-2026-0421") + toInBatch(t, "BNM-3506", "B-2026-0421");
    if (n) textMap(t, (s) => s.replace(/^6 received · 1 awaiting arrival · 1 not received/, "4 received · 2 in batch · 1 awaiting arrival · 1 not received").replace(/^8 samples · 8 expected$/, "8 samples · 4 received · 2 in batch · 1 awaiting · 1 not received"));
  }
}

function addBatchPatch(t) {
  const box = find(t, (n) => n.n === "Box" && find(n, (x) => /^B-2026-\d{4}$/.test(x.tx || "")));
  if (!box) return;
  walk(t, (n) => {
    if (!n.ch) return;
    const i = n.ch.indexOf(box);
    if (i >= 0) n.ch.splice(i + 1, 0, T("Pattern B-YYYY-NNNN. The number must be unique.", 12, MUTED, 400));
  });
}

const RECV_DESK = ["Reception · Receiving · Desktop", "Reception · Ready to start · Desktop", "Reception · Start with fewer samples · Desktop", "Reception · Hold sample · Desktop", "Reception · Print labels · Desktop"];
const RECV_PHONE = ["Reception · Receiving · Phone", "Reception · Print labels · Phone", "Reception · Scan a label · Phone"];
const JO = (n) => /^Job Order|^Flow P|^Mark as not received/.test(n) && !/^Reception|^Preparation/.test(n);

const PATCHED = {};
function patch(name, t) {
  const isRecv = /^Reception ·/.test(name), isPrep = /^Preparation ·/.test(name);
  if (isRecv) {
    recvText(t);
    if (RECV_DESK.includes(name) || name === "Reception · Receiving · Tablet" || name === "Reception · Started with fewer samples · Desktop") photosCol(t);
    if (RECV_PHONE.includes(name)) photoStrips(t);
    if (!/Started with fewer/.test(name)) batchPencil(t);
    tabs(t, ["Reception", "Preparation", "Analysis"], "Reception", { Reception: 8, Preparation: 0 });
    sixSteps(t); sixPhone(t);
  } else if (isPrep) {
    prepPatch(t);
    tabs(t, ["Reception", "Preparation", "Analysis"], "Preparation", { Reception: 6, Preparation: 6 });
    sixSteps(t); sixPhone(t);
  } else if (/^Job Order · Add batch/.test(name)) { joPatch(t, name); addBatchPatch(t); }
  else if (JO(name)) joPatch(t, name);
  PATCHED[name] = t;
  return t;
}

module.exports = { patch, PATCHED, helpers: { clone, find, findAll, walk, removeWhere, textMap, T, icon, thumb, chip, tabs, sixSteps, ICONS, RED, NAVY, BLUE, MUTED, INK, SLATE, LINE, CREAM, GREEN }, setSvgs: (s) => { SV = s; }, resetTabs: () => { TAB_ON = TAB_OFF = null; } };
