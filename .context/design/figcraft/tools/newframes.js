// New Revision C frames N6..N10, composed from the patched existing frames.
exports.make = (rc, svgs) => {
  const h = rc.helpers, { clone, find, findAll, removeWhere, textMap, T, icon, thumb, chip, tabs, ICONS } = h;
  const { RED, NAVY, BLUE, MUTED, INK, SLATE, LINE, CREAM, GREEN } = h;
  const P = rc.PATCHED;
  const base = (n) => { if (!P[n]) throw new Error("base frame missing: " + n); return clone(P[n]); };
  const out = [];
  const MONO = { ff: "JetBrains Mono" };

  // ---------- generic helpers ----------
  function setStatus(t, label, bg, fg) {
    const st = find(t, (n) => n.n === "Status");
    if (!st) return;
    st.f = bg; find(st, (n) => n.n === "Dot").f = fg;
    const l = find(st, (n) => n.n === "Label"); l.tx = label; l.c = fg;
  }
  function setStepper(t, cur, dates) {
    const bp = find(t, (n) => n.n === "Batch progress");
    if (!bp) return;
    const old = bp.ch.filter((c) => /^Step\//.test(c.n || ""));
    const proto = { done: clone(old.find((c) => c.n === "Step/Done")), cur: clone(old.find((c) => c.n === "Step/Current")), up: clone(old.find((c) => c.n === "Step/Upcoming")) };
    const up = bp.ch.find((c) => c.n === "Line upcoming"), done = bp.ch.find((c) => c.n === "Line done");
    const total = (up.w * 6) / 5;
    const labels = ["Created", "Receiving", "Preparation", "Prep finished", "Analysis", "Completed"];
    bp.ch = bp.ch.filter((c) => !/^Step\//.test(c.n || ""));
    labels.forEach((lab, i) => {
      const n = clone(i < cur ? proto.done : i === cur ? proto.cur : proto.up);
      find(n, (x) => x.n === "Label").tx = lab; find(n, (x) => x.n === "Date").tx = dates[i] || "—";
      bp.ch.push(n);
    });
    done.w = Math.max(0.5, +(Math.min(cur, 5) * total / 6).toFixed(1));
  }
  const overlay = (t, node) => { t.ch.push({ n: "Scrim", ab: [0, 0], w: t.w, h: t.h, f: "#0E2A4E66" }); t.ch.push(node); };
  const dialogProto = () => clone(find(P["Reception · Start with fewer samples · Desktop"], (n) => n.n === "Dialog"));
  const swapIcon = (btn, name, color) => { const i = btn.ch.findIndex((c) => c.k === "v"); if (i >= 0) btn.ch[i] = icon(name, color, 16); };

  // ---------- N6 Photos sheet ----------
  function photoCard(w, tag, who, when) {
    return { n: "Photo card", d: "V", g: 8, w, ch: [
      thumb(w, Math.round(w * 0.72), 10, tag === "Condition" ? "#CDB98F" : "#9FB6CF", tag === "Condition" ? "#7F9BBE" : "#5E7DA6"),
      { d: "H", g: 8, i: "C", w: "F", ch: [{ d: "H", p: [3, 9, 3, 9], r: 999, f: "#E3EAF4", ch: [T(tag, 11.5, BLUE, 600)] }, T(w < 200 ? when.slice(7) : when, 12, MUTED), { w: "F", h: 1 }, icon("trash", RED, 16)] },
      T(who, 12.5, SLATE, 500)] };
  }
  function photosSheet(baseName, newName, sheetW, mode) {
    const t = base(baseName); t.n = newName;
    const dlg = dialogProto();
    dlg.n = "Photos Sheet"; dlg.w = sheetW;
    const hd = dlg.ch.find((c) => c.n === "Header"), bd = dlg.ch.find((c) => c.n === "Body"), ft = dlg.ch.find((c) => c.n === "Footer");
    const tx = findAll(hd, (n) => n.k === "t");
    tx[0].tx = "Photos · BNM-3501"; tx[1].tx = "2 photos. Photos lock when reception is confirmed.";
    const cw = Math.floor((sheetW - 48 - 12) / 2);
    bd.ch = [
      { d: "V", g: 8, w: "F", ch: [T("TAG FOR THE NEXT PHOTO", 11, MUTED, 500, Object.assign({ ls: 1.5 }, MONO)), { d: "H", g: 8, w: "F", ch: [chip("Condition", true), chip("Weighing", false), chip("Other", false)] }] },
      { d: "H", g: 12, w: "F", ch: [photoCard(cw, "Condition", "Dedi Kurniawan", "27 Oct 10:41"), photoCard(cw, "Weighing", "Dedi Kurniawan", "27 Oct 10:43")] },
    ];
    bd.p = bd.p || [0, 24, 16, 24]; bd.g = 18;
    const [cancel, primary] = ft.ch;
    find(cancel, (n) => n.tx === "Cancel").tx = "Close";
    find(primary, (n) => n.k === "t").tx = mode === "bottom" ? "Take photo" : "Add photo";
    swapIcon(primary, mode === "bottom" ? "plus" : "upload-simple", "#FFFFFF");
    if (mode === "side") { dlg.h = t.h; dlg.ab = [t.w - sheetW, 0]; dlg.r = [16, 0, 0, 16]; bd.h = "F"; }
    else { dlg.w = t.w; dlg.h = 600; dlg.ab = [0, t.h - 600]; dlg.r = [20, 20, 0, 0]; bd.h = "F"; }
    overlay(t, dlg);
    return t;
  }
  out.push(photosSheet("Reception · Receiving · Desktop", "Reception · Photos sheet · Desktop", 480, "side"));
  out.push(photosSheet("Reception · Receiving · Tablet", "Reception · Photos sheet · Tablet", 420, "side"));
  out.push(photosSheet("Reception · Receiving · Phone", "Reception · Photos sheet · Phone", 390, "bottom"));

  // ---------- N7 Batch number dialog ----------
  {
    const t = base("Reception · Ready to start · Desktop"); t.n = "Batch number · Edit · Desktop";
    const dlg = dialogProto();
    const hd = dlg.ch.find((c) => c.n === "Header"), bd = dlg.ch.find((c) => c.n === "Body"), ft = dlg.ch.find((c) => c.n === "Footer");
    const tx = findAll(hd, (n) => n.k === "t");
    tx[0].tx = "Change batch number"; tx[1].tx = "Use the pattern B-YYYY-NNNN. The number must be unique.";
    bd.ch = [{ d: "V", g: 8, w: "F", ch: [
      T("Batch number", 13, INK, 600),
      { n: "Input", d: "H", i: "C", w: "F", h: 44, p: [0, 14, 0, 14], f: "#FFFFFF", r: 10, s: [RED, 1.5, "I"], ch: [T("B-2026-0421", 14, INK, 500, MONO)] },
      { d: "H", g: 6, i: "C", w: "F", ch: [icon("warning-circle", RED, 16), T("B-2026-0421 is already used by another batch.", 13, RED, 500)] },
      T("Only while the batch is Created. The number locks when reception is confirmed.", 12, MUTED, 400, { w: "F" })] }];
    find(ft, (n) => n.tx === "Cancel").tx = "Cancel";
    const prim = ft.ch[1]; find(prim, (n) => n.k === "t").tx = "Save"; swapIcon(prim, "check", "#FFFFFF");
    overlay(t, dlg);
    out.push(t);
  }

  // ---------- Analysis (N8, N9, N10) ----------
  const VALS = [
    { id: "BNM-3501", lab: "B0420-01", v: [9.8, 3.1, 5.2, 39.4, 0.48, 5410], by: "FH", name: "Fitri Handayani", at: "09:48" },
    { id: "BNM-3502", lab: "B0420-02", v: [10.4, 2.9, 6.8, 38.1, 0.52, 5360], by: "FH", name: "Fitri Handayani", at: "09:55" },
    { id: "BNM-3503", lab: "B0420-03", v: [8.9, 3.4, 4.6, 40.2, 0.44, 5490], by: "FH", name: "Fitri Handayani", at: "10:03" },
    { id: "BNM-3504", lab: "B0420-04", v: [9.6, 3.2, 5.9, 38.8, 5.8, 5380], by: "FH", name: "Fitri Handayani", at: "10:11", warn: 4 },
    { id: "BNM-3505", lab: "B0420-05", v: [9.1, 3.3, null, null, null, null] },
    { id: "BNM-3506", lab: "B0420-06", v: [null, null, null, null, null, null] },
  ];
  const DONE = VALS.map((r, i) => Object.assign({}, r, i === 4 ? { v: [9.4, 3.0, 5.5, 39.0, 0.5, 5400], by: "FH", name: "Fitri Handayani", at: "10:19" } : i === 5 ? { v: [9.9, 3.2, 6.1, 38.6, 0.55, 5375], by: "FH", name: "Fitri Handayani", at: "10:26" } : i === 3 ? { v: [9.6, 3.2, 5.9, 38.8, 0.58, 5380], warn: undefined } : {}));
  const fc = (v) => (v[1] == null || v[2] == null || v[3] == null ? null : (100 - v[1] - v[2] - v[3]).toFixed(2));
  const fmt = (i, x) => (x == null ? "" : i === 5 ? String(x) : i === 4 ? x.toFixed(2) : x.toFixed(1));
  const PARAMS = ["TM (%)", "IM (%)", "Ash (%)", "VM (%)", "FC (%)", "TS (%)", "GCV (kcal/kg)"];

  function analysisPanel(old, o) {
    // o: { locked, widths:{n,id,p,gcv,saved,status}, tablet, title, sub, rules }
    const panel = clone(old); panel.n = "Analysis Panel";
    const tb = panel.ch.find((c) => c.n === "Toolbar"), grid = panel.ch.find((c) => c.n === "Grid");
    const tt = findAll(tb, (n) => n.k === "t"); tt[0].tx = "Analysis"; tt[1].tx = o.sub;
    const btns = findAll(tb, (c) => /^Button\//.test(c.n || ""));
    if (o.locked) { removeWhere(tb, (n) => /^Button\//.test(n.n || "")); }
    else { find(btns[1], (n) => n.k === "t").tx = "Finish Analysis"; }
    const hdr0 = grid.ch.find((c) => c.n === "Header Row"), row0 = grid.ch.find((c) => /^Row BNM/.test(c.n || "")), div0 = grid.ch.find((c) => c.n === "Divider");
    const warnRow = grid.ch.find((c) => /^Row BNM/.test(c.n || "") && find(c, (x) => x.tx && x.tx.startsWith("Check")));
    const ti = o.tablet ? 2 : 3;
    const hcell = hdr0.ch[ti], inputCell = row0.ch[ti], hashCell = row0.ch[0], idCell = row0.ch[1], byCell = row0.ch[4], atCell = row0.ch[row0.ch.length - 2], stCell = o.tablet ? row0.ch[3] : row0.ch[row0.ch.length - 1];
    const warnCell = warnRow ? find(warnRow, (x) => x.n === undefined && x.d === "H" && x.h === 36 && x.f && x.f !== "#FFFFFF" && x.s) : null;
    const W = o.widths;
    const withText = (cell, w, tx) => { const c = clone(cell); c.w = w; const t = find(c, (x) => x.k === "t"); if (t) t.tx = tx; return c; };
    const hc = (w, tx) => withText(hcell, w, tx);
    // header
    const hcells = [hc(W.n, "#"), hc(W.id, "Sample ID")];
    PARAMS.forEach((p, i) => hcells.push(hc(i === 6 ? W.gcv : W.p, p)));
    if (!o.tablet) { const by = withText(hdr0.ch[4] || hcell, "F", "Entered by"); by.w = undefined; hcells.push(by); hcells.push(hc(W.saved, "Saved")); hcells.push(hc(W.status, "Status")); }
    else { const st = hc(undefined, "Status"); st.w = "F"; hcells.push(st); }
    const header = clone(hdr0); header.ch = hcells;
    // group row
    const grp = (w, tx) => ({ d: "H", w, i: "C", ch: [T(tx, 10.5, MUTED, 500, Object.assign({ ls: 1.2 }, MONO))] });
    const groupRow = { n: "Group Row", d: "H", w: "F", h: 28, f: "#F7F9FD", p: hdr0.p || [0, 16, 0, 16], i: "C", ch: [grp(W.n + W.id, ""), grp(W.p * 2, "MOISTURE"), grp(W.p * 3, "PROXIMATE"), grp(W.p, "SULFUR"), grp(W.gcv, "CALORIFIC")] };
    if (hdr0.g) groupRow.g = hdr0.g;
    const lockedCell = (w, tx, muted) => ({ d: "H", w, i: "C", a: "E", p: [0, 14, 0, 0], ch: [T(tx, 13, muted ? MUTED : INK, 500, Object.assign({ al: "R" }, MONO))] });
    const inp = (w, tx) => { const c = clone(inputCell); c.w = w; const b = c.ch ? c.ch[0] : c; b.w = o.tablet ? w - 8 : w - 20; const t = find(b, (x) => x.k === "t"); if (t) { if (tx === "") removeWhere(b, (x) => x.k === "t"); else t.tx = tx; } return c; };
    const calc = (w, tx) => { const c = clone(inputCell); c.w = w; const b = c.ch[0]; b.w = o.tablet ? w - 8 : w - 20; b.f = CREAM; delete b.s; b.a = "B"; b.ch = [T("Σ", 11, MUTED, 600), T(tx, 13, SLATE, 500, MONO)]; if (!tx) b.ch.pop(); return c; };
    const rows = [];
    (o.locked ? DONE : VALS).forEach((r, ri) => {
      const cells = [withText(hashCell, W.n, String(ri + 1)), withText(idCell, W.id, r.id)];
      r.v.forEach((x, i) => {
        const w = i === 5 ? W.gcv : W.p;
        const col = i < 4 ? i : i + 1;
        if (i === 3) { /* VM then FC */ }
        cells.push(null); cells[cells.length - 1] = { i, w, x };
      });
      // order: TM IM Ash VM FC TS GCV
      const v = r.v, f = fc(v);
      const seq = [[v[0], 0], [v[1], 1], [v[2], 2], [v[3], 3], ["calc", 4], [v[4], 4], [v[5], 5]];
      const body = cells.slice(0, 2);
      seq.forEach(([x, k], j) => {
        const w = j === 6 ? W.gcv : W.p;
        if (x === "calc") body.push(o.locked ? lockedCell(w, f || "", true) : calc(w, f || ""));
        else if (o.locked) body.push(lockedCell(w, fmt(k, x)));
        else if (r.warn !== undefined && r.warn === 4 && j === 5 && warnCell) { const c = clone(warnCell); const wc = clone(inputCell); wc.w = w; const b = clone(warnCell); b.w = o.tablet ? w - 8 : w - 20; find(b, (q) => q.k === "t").tx = fmt(4, x); wc.ch = [b]; body.push(wc); }
        else body.push(inp(w, fmt(k, x)));
      });
      if (!o.tablet) {
        const by = clone(byCell); if (r.by) { const ts = findAll(by, (q) => q.k === "t"); ts[0].tx = r.by; ts[1].tx = r.name; } else { by.ch = [T("—", 13, MUTED)]; }
        by.w = undefined;
        const at = clone(atCell); at.w = W.saved; find(at, (q) => q.k === "t").tx = r.at || "—";
        const st = clone(stCell); st.w = W.status; const stt = findAll(st, (q) => q.k === "t"); const tl = stt[stt.length - 1];
        if (r.at) { tl.tx = r.warn !== undefined ? "Check: above 5 %" : "Saved"; if (r.warn === undefined) { /* keep saved icon */ } else { const wi = find(warnRow || row0, (q) => q.tx && q.tx.startsWith("Check")); if (wi) { const wp = clone(find(warnRow, (q) => q.d === "H" && q.ch && q.ch.some((z) => z.tx && z.tx.startsWith("Check")))); st.ch = [wp]; st.w = W.status; } } }
        else { st.ch = [T(r.v.some((x) => x != null) ? "Partly entered" : "Pending", 13, MUTED)]; }
        body.push(by, at, st);
      } else {
        const st = clone(stCell); st.w = "F"; const stt = findAll(st, (q) => q.k === "t");
        if (r.at) { stt[stt.length - 1].tx = r.warn !== undefined ? "Check" : "Saved"; } else st.ch = [T(r.v.some((x) => x != null) ? "Partly" : "Pending", 13, MUTED)];
        body.push(st);
      }
      const row = clone(row0); row.n = "Row " + r.id; row.ch = body; rows.push(row, clone(div0));
    });
    grid.ch = [header, groupRow, ...rows];
    // rules
    const rb = panel.ch.find((c) => c.n === "Rules Box");
    if (rb) {
      if (o.rules) { const tx2 = findAll(rb, (q) => q.k === "t"); o.rules.forEach((s, i) => { if (tx2[i]) tx2[i].tx = s; }); }
      else removeWhere(panel, (q) => q.n === "Rules Box");
    }
    return panel;
  }

  function roaCard(state, wide) {
    const input = (tx, w, filled) => ({ d: "H", i: "C", w, h: 44, p: [0, 14, 0, 14], f: "#FFFFFF", r: 10, s: [LINE, 1, "C"], ch: [T(tx, 14, filled ? INK : MUTED, filled ? 500 : 400, filled ? MONO : {})] });
    const kids = [T("Signed RoA", 20, NAVY, 500, { ff: "Newsreader" })];
    if (state === "upload") {
      kids.push(T("Upload the lab's signed RoA as a PDF and enter its number. Then the Lab admin can complete the batch.", 13, SLATE, 400, { w: "F" }));
      kids.push({ d: wide ? "H" : "V", g: 12, w: "F", i: wide ? "C" : undefined, ch: [
        { n: "Drop zone", d: "H", g: 10, i: "C", a: "C", w: wide ? 360 : "F", h: 56, f: CREAM, r: 12, s: [LINE, 1, "C"], ch: [icon("upload-simple", BLUE, 20), T("Upload signed RoA (PDF)", 14, BLUE, 600)] },
        { d: "V", g: 4, w: wide ? 220 : "F", ch: [T("RoA number", 12, MUTED, 500), input("RoA-0417", "F", true)] },
        { w: "F", h: 1 },
        { n: "Button/Primary", d: "H", g: 8, i: "C", a: "C", p: [12, 20, 12, 20], r: 999, f: BLUE, o: 0.45, ch: [icon("check", "#FFFFFF", 16), T("Complete batch", 14, "#FFFFFF", 600)] }] });
      kids.push(T("Complete batch stays off until a PDF is attached.", 12, MUTED));
    } else {
      kids.push({ d: "H", g: 14, i: "C", w: "F", p: [14, 16, 14, 16], f: CREAM, r: 12, ch: [
        { d: "H", a: "C", i: "C", w: 44, h: 44, r: 10, f: "#FDEBE5", ch: [icon("file-pdf", RED, 24)] },
        { d: "V", g: 2, w: "F", ch: [T("RoA-signed.pdf", 14, INK, 600), T("RoA-0417 · uploaded 29 Oct 11:58 by Maya Lestari", 12.5, SLATE)] },
        { n: "Button/Outline", d: "H", g: 6, i: "C", p: [9, 14, 9, 14], f: "#FFFFFF", r: 999, s: [LINE, 1, "C"], ch: [icon("download-simple", NAVY, 16), T("Download", 13, NAVY, 600)] }] });
      kids.push(T("Batch B-2026-0417 is completed. The RoA is attached and read-only.", 13, SLATE));
    }
    return { n: "RoA Card", d: "V", g: 14, p: [20, 24, 22, 24], w: "F", f: "#FFFFFF", r: 16, s: ["#E3DCCB", 1, "I"], ch: kids };
  }

  function analysisFrame(baseName, newName, o) {
    const t = base(baseName); t.n = newName;
    textMap(t, (s) => s.replace("B-2026-0420", "B-2026-0417"));
    const hd = find(t, (n) => n.n === "Heading"); if (hd) hd.tx = "B-2026-0417";
    const cur = o.step;
    setStepper(t, cur, ["27 Oct", "27 Oct", "27 Oct", "28 Oct", o.stepDate || "Started 28 Oct", "—"].map((d, i) => (i === 5 && o.step >= 6 ? "29 Oct" : i === 4 && o.step >= 5 ? "29 Oct" : d)));
    setStatus(t, o.status[0], o.status[1], o.status[2]);
    if (!o.noTabs) tabs(t, ["Reception", "Preparation", "Analysis"], "Analysis", { Reception: 6, Preparation: 6, Analysis: 6 });
    const old = find(t, (n) => /Panel$/.test(n.n || "")), content = findAll(t, (n) => n.ch && n.ch.includes(old))[0];
    const idx = content.ch.indexOf(old);
    content.ch[idx] = analysisPanel(old, o);
    if (o.roa) {
      content.ch.push(roaCard(o.roa, true));
      const ex = 260; t.h += ex;
      ["App Shell", "Body", "Main"].forEach((nm) => { const n = find(t, (x) => x.n === nm); if (n && typeof n.h === "number") n.h += ex; });
    }
    return t;
  }
  const WD = { n: 28, id: 110, p: 70, gcv: 84, saved: 70, status: 130 };
  const WT = { n: 24, id: 96, p: 64, gcv: 80 };
  const AN_SUB = "26 of 36 values saved · started 28 Oct 09:12 by Fitri Handayani";
  const AN_FIN = "36 of 36 values saved · analysis finished 29 Oct 11:42 by Fitri Handayani";
  const RULES = ["BEFORE YOU CAN FINISH ANALYSIS", "Analysis started 28 Oct 09:12 by Fitri Handayani", "A value for every ordered parameter · 10 still to enter"];
  const BLUEC = ["#E3EAF4", BLUE], GREENC = ["#E3F2EA", GREEN];
  out.push(analysisFrame("Preparation · Entering ADL · Desktop", "Analysis · Entering results · Desktop", { step: 4, widths: WD, sub: AN_SUB, rules: RULES, status: ["Analysis", ...BLUEC] }));
  out.push(analysisFrame("Preparation · Entering ADL · Tablet", "Analysis · Entering results · Tablet", { step: 4, widths: WT, tablet: true, sub: AN_SUB, rules: RULES, status: ["Analysis", ...BLUEC] }));
  out.push(analysisFrame("Preparation · Entering ADL · Desktop", "Analysis · Finished · Upload RoA · Desktop", { step: 5, widths: WD, locked: true, sub: AN_FIN, status: ["Analysis finished", ...BLUEC], roa: "upload", stepDate: "Finished 29 Oct" }));
  out.push(analysisFrame("Preparation · Entering ADL · Desktop", "Batch · Completed · Desktop", { step: 6, widths: WD, locked: true, sub: AN_FIN, status: ["Completed", ...GREENC], roa: "attached" }));

  // ---------- phone: analysis cards ----------
  function analysisPhone(newName, o) {
    const t = base("Preparation · Entering ADL · Phone"); t.n = newName;
    textMap(t, (s) => s.replace("B-2026-0420", "B-2026-0417").replace("Finish Preparation", o.locked ? "Complete batch" : "Finish Analysis").replace(/^Finish$/, o.locked ? "Complete" : "Finish").replace(/^Preparation$/, "Analysis"));
    const hd = find(t, (n) => n.n === "Heading" || (n.tx === "B-2026-0417")); if (hd) hd.tx = "B-2026-0417";
    setStatus(t, o.locked ? "Analysis finished" : "Analysis", ...BLUEC);
    if (o.locked) removeWhere(t, (n) => /^Button\//.test(n.n || "") && find(n, (x) => x.tx === "Save all"));
    tabs(t, ["Reception", "Preparation", "Analysis"], "Analysis", { Reception: 6, Preparation: 6 });
    const cards = findAll(t, (n) => /^Card BNM/.test(n.n || ""));
    const holder = findAll(t, (n) => n.ch && n.ch.includes(cards[0]))[0];
    const proto = clone(cards[0]);
    const fieldProto = find(proto, (n) => n.d === "V" && n.ch && n.ch.length === 2 && n.ch[0].k === "t" && n.ch[1].h === 44) || find(proto, (n) => n.d === "V" && n.ch && n.ch[0] && n.ch[0].k === "t" && n.ch[1]);
    const mkField = (label, val, kind) => {
      const f = clone(fieldProto); find(f, (n) => n.k === "t").tx = label;
      const box = f.ch[1]; const tt = find(box, (n) => n.k === "t");
      if (kind === "calc") { box.f = CREAM; delete box.s; if (tt) tt.tx = val ? "Σ  " + val : ""; }
      else if (kind === "locked") { box.f = "#FFFFFF"; if (tt) tt.tx = val; }
      else if (tt) { if (val === "") removeWhere(box, (n) => n.k === "t"); else tt.tx = val; }
      return f;
    };
    const rowOf = (a, b) => ({ d: "H", g: 12, w: "F", ch: b ? [a, b] : [a, { d: "V", w: "F", ch: [] }] });
    const newCards = (o.locked ? DONE : VALS).map((r) => {
      const c = clone(proto); c.n = "Card " + r.id;
      const head = c.ch[0], ht = findAll(head, (n) => n.k === "t");
      ht[0].tx = r.id; if (ht[1]) ht[1].tx = r.lab; ht[ht.length - 1].tx = r.at ? (r.warn !== undefined ? "Check" : "Saved") : "Pending";
      const v = r.v, f = fc(v), k = o.locked ? "locked" : "in";
      c.ch = [head,
        rowOf(mkField("TM (%)", fmt(0, v[0]), k), mkField("IM (%)", fmt(1, v[1]), k)),
        rowOf(mkField("Ash (%)", fmt(2, v[2]), k), mkField("VM (%)", fmt(3, v[3]), k)),
        rowOf(mkField("FC (%)", f || "", "calc"), mkField("TS (%)", fmt(4, v[4]), k)),
        rowOf(mkField("GCV (kcal/kg)", fmt(5, v[5]), k))];
      return c;
    });
    holder.ch.splice(holder.ch.indexOf(cards[0]), cards.length, ...newCards);
    textMap(t, (x) => x.replace(/^Step \d of 6 · .*/, o.locked ? "Step 5 of 6 · Analysis finished" : "Step 5 of 6 · Analysis").replace(/^\d+ of \d+ ADL saved/, o.locked ? "36 of 36 saved" : "26 of 36 saved"));
    const bars = find(t, (n) => n.d === "H" && n.ch && n.ch.length === 6 && n.ch.every((c) => c.h && c.h <= 6));
    if (bars) { const dn = bars.ch[0].f, cu = bars.ch[2].f, up = bars.ch[3].f; bars.ch.forEach((c, i) => { c.f = i < 4 ? dn : i === 4 ? (o.locked ? dn : cu) : up; }); }
    if (o.roa) holder.ch.push(roaCard(o.roa, false));
    return t;
  }
  out.push(analysisPhone("Analysis · Entering results · Phone", {}));
  out.push(analysisPhone("Analysis · Finished · Upload RoA · Phone", { locked: true, roa: "upload" }));
  return out;
};
