// Add-only run: job order History tab (5 frames). Plan: Job_Order_Screen_Plan.md Revision 13. build-screens.js Ch
const { H } = require("./rowC.js");
const { CFG } = require("./rowO.js");
const { sectionHead, table, pager, card, vframe, hframe, txt, icon, iconBtn } = CFG;
const { page, detailFrame, JO0139, KIND } = H;

const SAMPLES = [["BNM-3501", "Ply A1 upper, DH-MCR-011, 6.20-6.55 m"], ["BNM-3502", "Ply A1 lower, DH-MCR-011, 6.55-6.90 m"], ["BNM-3503", "Ply A2, DH-MCR-011, 8.10-8.45 m"], ["BNM-3504", "Ply B1, DH-MCR-012, 3.40-3.75 m"], ["BNM-3505", "Ply B, DH-MCR-012, 4.00-4.35 m"], ["BNM-3506", "Ply C, DH-MCR-012, 5.10-5.40 m"], ["BNM-3507", "Ply D1, DH-MCR-013, 2.20-2.55 m"], ["BNM-3508", "Ply D2, DH-MCR-013, 2.55-2.90 m"]];
// when, initials, user, action, record type, record, summary, changes [[field, before, after]], note
const ROWS = [
  ["22 Oct 2026, 10:05", "RK", "Rina Kartika", "Marked not received", "Sample", "BNM-3508", "Reason", [["Reason", "—", "Client did not send it"], ["Note", "—", "Client confirmed the ply was lost in transport"]]],
  ["21 Oct 2026, 08:40", "DK", "Dedi Kurniawan", "Updated", "Sample", "BNM-3507", "2 fields", [["Batch", "B-2026-0421", "—"], ["Released from batch", "—", "B-2026-0421"]]],
  ["20 Oct 2026, 16:12", "DK", "Dedi Kurniawan", "Status changed", "Job order", "JO-2026-0139", "Status", [["Status", "Awaiting samples", "In progress"]]],
  ["20 Oct 2026, 09:30", "RK", "Rina Kartika", "File added", "File", "PO-MCR-2207.pdf", "—"],
  ["16 Oct 2026, 11:20", "RK", "Rina Kartika", "Parameters changed", "Job order", "JO-2026-0139", "Parameters added", [["Parameters added", "—", "HGI"]]],
  ["15 Oct 2026, 14:02", "RK", "Rina Kartika", "Updated", "Sample", "BNM-3505", "Client description", [["Client description", "Ply B", "Ply B2"]]],
  ["15 Oct 2026, 10:48", "RK", "Rina Kartika", "Samples added", "Samples", "8 samples", "8 samples", SAMPLES.map(([id, d]) => [id, "—", d])],
  ["14 Oct 2026, 15:30", "RK", "Rina Kartika", "Submitted", "Job order", "JO-2026-0139", "Status", [["Status", "Draft", "Awaiting samples"]]],
  ["14 Oct 2026, 15:22", "RK", "Rina Kartika", "Updated", "Job order", "JO-2026-0139", "2 fields", [["Due date", "24 Oct 2026", "20 Oct 2026"], ["Priority", "Standard", "Urgent"]]],
  ["14 Oct 2026, 15:10", "RK", "Rina Kartika", "Created", "Job order", "JO-2026-0139", "12 fields"],
];
const isData = (v) => /^[<>]?[\d.,:\- ]+$/.test(v) || /^[A-Z0-9][A-Z0-9.\-_/]*$/.test(v);
const val = (b, p, v, after) => v === "—" ? txt(b, p, "—", "Body small/Regular", "Text/text-muted", after ? "After" : "Before") : isData(v) ? txt(b, p, v, after ? "Data/Strong" : "Data", after ? "Text/heading" : "Text/text-muted", after ? "After" : "Before") : txt(b, p, v, after ? "Body small/SemiBold" : "Body small/Regular", after ? "Text/heading" : "Text/text-muted", after ? "After" : "Before");
const closing = (a) => `${a[3]} by ${a[2]} on the Job orders screen.`;

function diff(b, rr, a, kind) {
  const d = vframe(b, rr, "Diff", 6, { fill: "Surface/muted", r: 10, pad: [8, 12, 8, 12] });
  if (kind === "tablet") { const w = hframe(b, d, "Who", 8, { cross: "center", pad: [2, 0, 6, 0] }); b.instV(w, "Avatar", "Size=24", { texts: { Initials: a[1] } }); txt(b, w, a[2], "Body small/Medium", "Text/foreground", "User"); }
  const FW = kind === "tablet" ? 180 : 260, BW = kind === "tablet" ? 120 : 260;
  if (kind !== "phone") {
    const hd = hframe(b, d, "Diff head", 0, { sizeH: "fill", pad: [4, 0, 4, 0] });
    [["Field", FW], ["Before", BW], ["After", 0]].forEach(([l, w]) => { const f = b.frame(hd, { name: "Head", w: w || 200, h: 20, layout: "h", sizeH: w ? "fixed" : "fill", sizeV: "hug" }); txt(b, f, l, "Caption/SemiBold", "Text/text-secondary", "Head label"); });
    a[7].forEach(([fd, be, af]) => { const r = hframe(b, d, "Diff row", 0, { sizeH: "fill", pad: [4, 0, 4, 0], cross: "min" }); const c1 = b.frame(r, { name: "Field", w: FW, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, c1, fd, "Body small/Medium", "Text/heading", "Field"); const c2 = b.frame(r, { name: "Before", w: BW, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); val(b, c2, be, false); const c3 = b.frame(r, { name: "After", w: 200, h: 20, layout: "h", sizeH: "fill", sizeV: "hug" }); val(b, c3, af, true); });
  } else {
    a[7].forEach(([fd, be, af]) => { const g = vframe(b, d, "Change", 2); txt(b, g, fd, "Caption/Medium", "Text/text-secondary", "Field"); const r = hframe(b, g, "Values", 6, { wrap: true, cross: "center" }); if (be !== "—") { val(b, r, be, false); icon(b, r, "arrow-right", "Text/text-muted", 14); } val(b, r, af, true); });
  }
  txt(b, d, closing(a), "Caption/Regular", "Text/text-muted", "Note", { fill: true });
}

function body(b, s, kind, open) {
  const c = card(b, s.main, "History card");
  if (kind === "phone") {
    sectionHead(b, c, "History", 10);
    const list = vframe(b, c, "Cards", 10);
    ROWS.slice(0, 6).forEach((a, i) => {
      const k = vframe(b, list, "Entry card", 6, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: [14, 16, 14, 16] });
      const t = hframe(b, k, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, t, a[3], "Body small/SemiBold", "Text/heading", "Action"); txt(b, t, a[0].replace(" 2026", ""), "Caption/Regular", "Text/text-muted", "When");
      const r = hframe(b, k, "Record", 6); txt(b, r, a[4], "Caption/Regular", "Text/text-secondary", "Type"); txt(b, r, a[5], /^\d+ samples$/.test(a[5]) ? "Body small/Regular" : "Data", /^\d+ samples$/.test(a[5]) ? "Text/foreground" : "Primary/primary", "Record");
      const w = hframe(b, k, "Who", 8); b.instV(w, "Avatar", "Size=24", { texts: { Initials: a[1] } }); txt(b, w, a[2], "Caption/Regular", "Text/text-secondary", "User");
      if (open === i && a[7]) diff(b, k, a, "phone");
    });
    pager(b, c, "1 / 2", kind); return;
  }
  sectionHead(b, c, "History", 10);
  const cols = kind === "desktop" ? [["When", 160], ["User", 190], ["Action", 170], ["Record", 0], ["Changes", 160]] : [["When", 130], ["Record", 0], ["Action", 150], ["", 44]];
  table(b, c, cols, ROWS, (cell, h, a) => {
    if (h === "When") txt(b, cell, kind === "tablet" ? a[0].replace(" 2026", "") : a[0], "Body small/Regular", "Text/text-secondary", "When");
    if (h === "User") { b.instV(cell, "Avatar", "Size=24", { texts: { Initials: a[1] } }); txt(b, cell, a[2], "Body small/Regular", "Text/foreground", "User"); }
    if (h === "Action") txt(b, cell, a[3], "Body small/Medium", "Text/heading", "Action");
    if (h === "Record") { const v = vframe(b, cell, "Record", 0); txt(b, v, a[4], "Caption/Regular", "Text/text-muted", "Type"); txt(b, v, a[5], /^\d+ samples$/.test(a[5]) ? "Body small/Regular" : "Data", /^\d+ samples$/.test(a[5]) ? "Text/foreground" : "Primary/primary", "ID"); }
    if (h === "Changes") { txt(b, cell, a[6], "Body small/Regular", a[7] ? "Text/text-secondary" : "Text/text-muted", "Changes"); if (a[7]) icon(b, cell, "caret-down", "Text/text-muted", 14); }
    if (h === "" && a[7]) iconBtn(b, cell, open >= 0 && ROWS[open] === a ? "caret-up" : "caret-down");
  }, { h: 56, after: (rr, a, ri) => { if (open === ri && a[7]) diff(b, rr, a, kind); } });
  pager(b, c, "Showing 1–10 of 10", kind);
}

exports.build = (b) => {
  const N = b.reg.N, SZ = { desktop: "Desktop", tablet: "Tablet", phone: "Phone" };
  const names = [["13", "History"], ["14", "History_row_expanded"]];
  const mine = new Set(); for (const k of Object.values(SZ)) for (const [vv, v] of names) mine.add(`${k}-03-Job_orders-03-Job_order_detail-${vv}-${v}`);
  const ONLY = process.env.CH_ONLY ? process.env.CH_ONLY.split(",") : null; // e.g. tablet-14
  const want = (kind, vv) => !ONLY || ONLY.includes(`${kind}-${vv}`);
  const nameOf = (kind, vv) => `${SZ[kind]}-03-Job_orders-03-Job_order_detail-${vv}-${names.find((x) => x[0] === vv)[1]}`;
  const own = new Set(["desktop", "tablet", "phone"].flatMap((k) => ["13", "14"].filter((vv) => want(k, vv)).map((vv) => nameOf(k, vv))));
  const old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (own.has(N[id].name)) old.push(id);
  if (old.length) b.raw("edit.delete", { ids: old });
  const slot = (kind) => { // right of the last job order detail frame in the first detail row
    const fr = []; for (const id of N[b.pageIds[kind]].children || []) { const n = N[id]; if (/^(Desktop|Tablet|Phone)-03-Job_orders-03-Job_order_detail-/.test(n.name || "") && !mine.has(n.name)) fr.push(n); }
    const y = Math.min(...fr.map((n) => n.transform[5])); const row = fr.filter((n) => n.transform[5] === y);
    return { x: Math.max(...row.map((n) => n.transform[4] + n.width)) + 120, y, step: kind === "desktop" ? 1560 : kind === "tablet" ? 954 : 510 };
  };
  const mk = (kind, vv, v, open) => {
    if (!want(kind, vv)) return;
    const p = slot(kind); const x = p.x + (vv === "14" ? p.step : 0);
    page(b, kind);
    const s = detailFrame(b, x, p.y, kind, { ...JO0139, name: `${SZ[kind]}-03-Job_orders-03-Job_order_detail-${vv}-${v}`, tab: "History" });
    body(b, s, kind, open); return s;
  };
  // the second frame of a size sits one step right of the first: slot() runs before either exists, so both use the same origin
  mk("desktop", "13", "History", -1); mk("desktop", "14", "History_row_expanded", 6);
  mk("tablet", "13", "History", -1); mk("tablet", "14", "History_row_expanded", 6);
  mk("phone", "13", "History", -1); mk("phone", "14", "History_row_expanded", 0);
};
