const { section } = require("./found.js");
const { pill } = require("./status.js");

const setText = (b, id, text) => b.raw("node.set", { ids: [id], props: { characters: text } });
const swap = (b, id, glyph, size) => b.raw("instance.swap", { ids: [id], component: b.icons[glyph + "|" + size].id });

function logoInst(b, parent, kind, h) {
  const L = b.logo[kind];
  const id = b.step("instance.create", { component: L.id, parent }, L.size);
  b.raw("transform.scale", { ids: [id], factor: h / 354 });
  return id;
}

const NAV = [
  ["WORK", [["My work", "check-square-offset"], ["Dashboard", "squares-four"], ["Job orders", "clipboard-text"], ["Batches", "stack"], ["Input ROA", "rows"], ["Review ROA", "eye"], ["Reports", "file-text"], ["Search", "magnifying-glass"]]],
  ["MASTER DATA", [["Clients", "buildings"], ["Drill hole", "cylinder"], ["Lithology", "package"], ["Seam", "rows"]]],
  ["ADMIN", [["Users", "users"], ["Configuration", "gear-six"], ["Audit log", "clock-counter-clockwise"]]],
];

function navItem(b, pan) {
  const v = [];
  for (const col of ["No", "Yes"]) for (const st of ["Default", "Hover", "Pressed", "Focused", "Active"]) {
    const fill = { Default: "none", Hover: "Primary/primary-50", Pressed: "Primary/primary-100", Focused: "Primary/primary-50", Active: "Action/nav-active" }[st];
    const text = st === "Active" ? "Text/text-inverse" : "Text/text-secondary";
    v.push({ name: `State=${st}, Collapsed=${col}`, w: col === "No" ? 216 : 56, h: 44, frame: { fill, r: 10, layout: "h", gap: 12, pad: [0, 14, 0, 14], cross: "center", main: col === "No" ? "min" : "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        if (st === "Focused") b.raw("style.apply", { ids: [cid], style: "Focus ring" });
        const ic = b.icon(cid, "squares-four", 20, text);
        const l = b.text(cid, "Dashboard", { style: "Body/Medium", color: text, name: "Label", fill: true });
        const cnt = b.frame(cid, { name: "Count", w: 22, h: 18, fill: "Accent/accent-100", r: 999, layout: "h", pad: [0, 6, 0, 6], main: "center", cross: "center", sizeH: "hug", sizeV: "fixed" });
        b.text(cnt, "8", { style: "Caption/SemiBold", color: "Accent/accent-text", name: "CountText" });
        b.raw("node.set", { ids: [cnt], props: { visible: false } });
        if (col === "Yes") b.raw("node.set", { ids: [l], props: { visible: false } });
        return { Icon: ic, Label: l, Count: cnt };
      } });
  }
  b.set(pan, "Nav item", v, { cols: 5, cw: 260, ch: 70, W: 1332, H: 172, textProps: ["Label"], bools: [{ name: "Show count", key: "Count", default: false }], swaps: [{ name: "Icon", key: "Icon" }] });
  const gl = b.component(pan, { name: "Nav group label", w: 216, h: 28, layout: "h", gap: 6, pad: [14, 14, 6, 14], cross: "center", sizeH: "fixed", sizeV: "hug" });
  b.text(gl, "WORK", { style: "Overline", color: "Text/text-muted", name: "Label", fill: true });
  b.icon(gl, "caret-down", 14, "Text/text-muted");
  b.sets["Nav group label"] = { first: { id: gl, size: 3 + b.icons["caret-down|14"].paths } };
}
function sidebar(b, pan) {
  const sv = [];
  for (const col of ["No", "Yes"]) {
    sv.push({ name: `Collapsed=${col}`, w: col === "No" ? 248 : 88, h: 900, frame: { fill: "Surface/shell", stroke: "Surface/border", sw: 1, layout: "v", gap: 4, pad: [16, 16, 16, 16], sizeH: "fixed", sizeV: "hug", cross: "min" },
      build(cid) {
        const nvar = col === "No" ? "State=Default, Collapsed=No" : "State=Default, Collapsed=Yes";
        const avar = col === "No" ? "State=Active, Collapsed=No" : "State=Active, Collapsed=Yes";
        const ip = b.icons["squares-four|20"].paths;
        NAV.forEach(([grp, items], gi) => {
          if (col === "No") { const g = b.step("instance.create", { component: b.sets["Nav group label"].first.id, parent: cid }, b.sets["Nav group label"].first.size); setText(b, g + 1, grp); b.raw("node.set", { ids: [g], props: { sizingH: "fill" } }); }
          else if (gi > 0) b.frame(cid, { name: "Divider", w: 56, h: 1, fill: "Surface/divider", sizeH: "fill" });
          items.forEach(([lab, glyph]) => {
            const active = lab === "Dashboard";
            const it = b.inst(cid, "Nav item", active ? avar : nvar);
            b.raw("node.set", { ids: [it], props: { sizingH: "fill" } });
            if (glyph !== "squares-four") swap(b, it + 1, glyph, 20);
            setText(b, it + 1 + 1 + ip, lab);
          });
        });
        const sp = b.frame(cid, { name: "Spacer", w: 10, h: 24, sizeV: "fixed" });
        const it = b.inst(cid, "Nav item", nvar);
        b.raw("node.set", { ids: [it], props: { sizingH: "fill" } }); swap(b, it + 1, "caret-double-left", 20); setText(b, it + 1 + 1 + ip, "Collapse");
      } });
  }
  b.set(pan, "Sidebar", sv, { cols: 2, cw: 330, ch: 960, W: 692, H: 1000 });
}

function topbar(b, pan) {
  const v = [];
  for (const [bp, w] of [["Desktop", 1376], ["Tablet", 802], ["Mobile", 390]]) {
    v.push({ name: `Breakpoint=${bp}`, w, h: 72, frame: { fill: "Surface/shell", stroke: "Surface/border", sw: 1, layout: "h", gap: 16, pad: [0, bp === "Mobile" ? 16 : 24, 0, bp === "Mobile" ? 16 : 24], cross: "center", sizeH: "fixed", sizeV: "fixed" },
      build(cid) {
        if (bp === "Mobile") { const m = b.inst(cid, "Icon button", "Type=Ghost, Size=36, State=Default"); swap(b, m + 1, "list", 14); }
        logoInst(b, cid, bp === "Mobile" ? "icon" : "full", bp === "Mobile" ? 36 : 48);
        const sp = b.frame(cid, { name: "Spacer", w: 10, h: 10, sizeH: "fill", sizeV: "fixed" });
        if (bp !== "Mobile") { const s = b.inst(cid, "Search", "Size=md, State=Default"); b.raw("node.set", { ids: [s], props: { width: bp === "Desktop" ? 400 : 260 } }); }
        const bell = b.inst(cid, "Icon button", "Type=Secondary, Size=36, State=Default"); swap(b, bell + 1, "bell", 14);
        if (bp === "Mobile") b.inst(cid, "Avatar", "Size=32"); else {
          const u = b.frame(cid, { name: "User", w: 160, h: 40, layout: "h", gap: 10, cross: "center", sizeH: "hug", sizeV: "hug" });
          b.inst(u, "Avatar", "Size=32");
          const c = b.frame(u, { name: "Name", w: 120, h: 34, layout: "v", gap: 0, sizeH: "hug", sizeV: "hug" });
          b.text(c, "Ranto Lubis", { style: "Body small/SemiBold", name: "UserName" }); b.text(c, "Lab Admin", { style: "Caption/Regular", color: "Text/text-secondary", name: "UserRole" });
        }
      } });
  }
  b.set(pan, "Top bar", v, { cols: 1, cw: 1500, ch: 100, W: 1440, H: 340 });
}

function breadcrumb(b, pan) {
  const v = [];
  for (const n of [2, 3]) v.push({ name: `Levels=${n}`, w: 300, h: 20, frame: { layout: "h", gap: 6, pad: 0, cross: "center", sizeH: "hug", sizeV: "hug" },
    build(cid) { const refs = {}; for (let i = 1; i <= n; i++) { const last = i === n; refs["Level " + i] = b.text(cid, i === 1 ? "Job orders" : i === 2 && n === 3 ? "JO-2026-0137" : "B-2026-0420", { style: last ? "Caption/SemiBold" : "Caption/Medium", color: last ? "Text/foreground" : "Text/text-secondary", name: "Level " + i }); if (!last) b.icon(cid, "caret-right", 14, "Text/text-muted"); } return refs; } });
  b.set(pan, "Breadcrumb", v, { cols: 2, cw: 360, ch: 44, W: 752, H: 76, textProps: ["Level 1", "Level 2", "Level 3"] });
}

function tabs(b, pan) {
  const v = [];
  for (const sel of ["Off", "On"]) for (const st of ["Default", "Hover", "Pressed", "Focused", "Disabled"]) {
    const on = sel === "On", dis = st === "Disabled";
    const text = dis ? "Text/text-muted" : on ? "Action/brand-text" : st === "Hover" || st === "Pressed" ? "Text/foreground" : "Text/text-secondary";
    v.push({ name: `Selected=${sel}, State=${st}`, w: 100, h: 36, frame: { layout: "v", gap: 0, pad: 0, cross: "min", sizeH: "hug", sizeV: "fixed" },
      build(cid) {
        const row = b.frame(cid, { name: "Row", w: 100, h: 34, fill: st === "Hover" ? "Primary/primary-50" : st === "Pressed" ? "Primary/primary-100" : "none", stroke: st === "Focused" ? "Surface/border-strong" : undefined, sw: 1, r: 6, layout: "h", gap: 6, pad: [0, 12, 0, 12], cross: "center", sizeH: "hug", sizeV: "fixed" });
        const l = b.text(row, "Overview", { style: on ? "Body small/SemiBold" : "Body small/Medium", color: text, name: "Label" });
        const c = b.text(row, "12", { style: "Caption/SemiBold", color: dis ? "Text/text-muted" : "Text/text-secondary", name: "Count" });
        b.frame(cid, { name: "Underline", w: 100, h: 2, fill: on && !dis ? "Action/action" : "none", sizeH: "fill", sizeV: "fixed" });
        return { Label: l, Count: c };
      } });
  }
  b.set(pan, "Tab", v, { cols: 5, cw: 150, ch: 56, W: 782, H: 144, textProps: ["Label", "Count"], bools: [{ name: "Show count", key: "Count", default: true }] });
}

function steps(b, pan) {
  const v = [];
  for (const ori of ["Horizontal", "Vertical"]) for (const st of ["Done", "Current", "Upcoming"]) {
    v.push({ name: `State=${st}, Orientation=${ori}`, w: 120, h: 70, frame: { layout: ori === "Horizontal" ? "v" : "h", gap: ori === "Horizontal" ? 6 : 12, pad: 0, cross: ori === "Horizontal" ? "center" : "min", sizeH: "hug", sizeV: "hug" },
      build(cid) {
        const mk = b.frame(cid, { name: "Marker", w: 24, h: 24, fill: st === "Done" ? "Status/st-completed" : "Surface/card", stroke: st === "Done" ? undefined : st === "Current" ? "Accent/accent" : "Surface/border-strong", sw: 2, r: 12, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" });
        if (st === "Done") b.icon(mk, "check", 14, "Text/text-inverse");
        if (st === "Current") b.frame(mk, { name: "Dot", w: 8, h: 8, fill: "Accent/accent", r: 4 });
        const col = b.frame(cid, { name: "Text", w: 100, h: 34, layout: "v", gap: 0, cross: ori === "Horizontal" ? "center" : "min", sizeH: "hug", sizeV: "hug" });
        const t = b.text(col, "Receiving", { style: "Body small/SemiBold", color: st === "Upcoming" ? "Text/text-muted" : "Text/heading", name: "Title" });
        const m = b.text(col, st === "Upcoming" ? "—" : "6 of 8 arrived", { style: "Caption/Regular", color: "Text/text-secondary", name: "Meta" });
        return { Title: t, Meta: m };
      } });
  }
  b.set(pan, "Stepper step", v, { cols: 3, cw: 190, ch: 100, W: 602, H: 232, textProps: ["Title", "Meta"] });
  const sv = [];
  for (const n of [5, 6]) sv.push({ name: `Steps=${n}`, w: 1000, h: 80, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 14, layout: "h", gap: 0, pad: [16, 24, 16, 24], cross: "min", sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      const names = ["Created", "Receiving", "Preparation", "Analysis", "RoA approved", "CoA published"].slice(0, n);
      const pad = 24, cell = (1000 - 2 * pad) / n, doneN = 2;
      b.frame(cid, { name: "Track", x: pad + cell / 2, y: 27, w: cell * (n - 1), h: 2, fill: "Surface/border-strong", absolute: true });
      b.frame(cid, { name: "Progress", x: pad + cell / 2, y: 27, w: cell * doneN, h: 2, fill: "Status/st-completed", absolute: true });
      names.forEach((nm, i) => {
        const st = i < 2 ? "Done" : i === 2 ? "Current" : "Upcoming";
        const s = b.inst(cid, "Stepper step", `State=${st}, Orientation=Horizontal`);
        b.raw("node.set", { ids: [s], props: { sizingH: "fill" } });
        const markerKids = st === "Upcoming" ? 0 : st === "Done" ? 1 + b.icons["check|14"].paths : 1;
        setText(b, s + 3 + markerKids, nm);
        setText(b, s + 4 + markerKids, st === "Done" ? "27 Oct" : st === "Current" ? "Started 27 Oct" : "Not started");
      });
    } });
  b.set(pan, "Stepper", sv, { cols: 1, cw: 1100, ch: 120, W: 1140, H: 280 });
}

function page(b, pan) {
  const pg = [];
  for (const bp of ["Desktop", "Mobile"]) {
    const d = bp === "Desktop";
    pg.push({ name: `Breakpoint=${bp}`, w: d ? 1100 : 358, h: d ? 90 : 160, frame: { layout: d ? "h" : "v", gap: d ? 16 : 12, pad: 0, cross: d ? "min" : "min", sizeH: "fixed", sizeV: "hug", main: d ? "min" : "min" },
      build(cid) {
        const left = b.frame(cid, { name: "Title block", w: 600, h: 70, layout: "v", gap: 6, sizeH: "fill", sizeV: "hug" });
        const row = b.frame(left, { name: "Title row", w: 500, h: 40, layout: "h", gap: 12, cross: "center", sizeH: "hug", sizeV: "hug" });
        const t = b.text(row, "B-2026-0420", { style: d ? "Heading/H1" : "Heading/H2", color: "Text/heading", name: "Title" });
        b.inst(row, "Status badge", "Status=Created, Size=md");
        const m = b.text(left, "PT Bara Nusantara Mandiri · JO-2026-0137 · ASTM · 8 samples expected", { style: "Body small/Regular", color: "Text/text-secondary", name: "Meta", fill: true });
        const act = b.frame(cid, { name: "Actions", w: 300, h: 40, layout: "h", gap: 8, cross: "center", sizeH: "hug", sizeV: "hug" });
        b.inst(act, "Person chip", "Caret=On");
        const more = b.inst(act, "Icon button", "Type=Secondary, Size=36, State=Default"); swap(b, more + 1, "dots-three", 14);
        return { Title: t, Meta: m };
      } });
  }
  b.set(pan, "Page header", pg, { cols: 1, cw: 1200, ch: 200, W: 1240, H: 440, textProps: ["Title", "Meta"] });
  const mp = [1, 2].map((n) => ({ name: `Step=${n}`, w: 358, h: 30, frame: { layout: "v", gap: 6, pad: 0, sizeH: "fixed", sizeV: "hug" },
    build(cid) { const t = b.text(cid, `Step ${n} of 2`, { style: "Caption/SemiBold", color: "Text/text-secondary", name: "Label" }); const bar = b.frame(cid, { name: "Bar", w: 358, h: 4, layout: "h", gap: 4, sizeH: "fill", sizeV: "fixed" }); b.frame(bar, { name: "Seg1", w: 100, h: 4, fill: "Action/action", r: 2, sizeH: "fill", sizeV: "fixed" }); b.frame(bar, { name: "Seg2", w: 100, h: 4, fill: n === 2 ? "Action/action" : "Surface/border", r: 2, sizeH: "fill", sizeV: "fixed" }); return { Label: t }; } }));
  b.set(pan, "Mobile step progress", mp, { cols: 2, cw: 400, ch: 70, W: 832, H: 102, textProps: ["Label"] });
  const pv = [];
  for (const bp of ["Desktop", "Mobile"]) pv.push({ name: `Breakpoint=${bp}`, w: bp === "Desktop" ? 560 : 358, h: 40, frame: { layout: "h", gap: 12, pad: 0, cross: "center", main: "max", sizeH: "fixed", sizeV: "hug" },
    build(cid) {
      let t;
      if (bp === "Desktop") { t = b.text(cid, "Showing 1–10 of 46", { style: "Body small/Regular", color: "Text/text-secondary", name: "Summary", fill: true }); }
      const mk = (g, on, label) => { const f = b.frame(cid, { name: label || g, w: 32, h: 32, fill: on ? "Action/action" : "Surface/card", stroke: on ? undefined : "Surface/border-strong", sw: 1, r: 999, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); if (g) b.icon(f, g, 14, on ? "Text/text-inverse" : "Text/text-secondary"); else b.text(f, label, { style: "Caption/SemiBold", color: on ? "Text/text-inverse" : "Text/text-secondary" }); };
      mk("caret-left", false, "Previous");
      if (bp === "Desktop") { mk(null, true, "1"); mk(null, false, "2"); mk(null, false, "3"); } else b.text(cid, "1 / 5", { style: "Body small/SemiBold", name: "Page" });
      mk("caret-right", false, "Next");
      return t ? { Summary: t } : {};
    } });
  b.set(pan, "Pager", pv, { cols: 2, cw: 640, ch: 80, W: 1312, H: 112, textProps: ["Summary"] });
  const sb = [];
  for (const bp of ["Desktop", "Mobile"]) sb.push({ name: `Breakpoint=${bp}`, w: bp === "Desktop" ? 1100 : 390, h: 68, frame: { fill: "Surface/card", stroke: "Surface/border", sw: 1, layout: "h", gap: 12, pad: [0, bp === "Desktop" ? 24 : 16, 0, bp === "Desktop" ? 24 : 16], cross: "center", main: "max", sizeH: "fixed", sizeV: "fixed" },
    build(cid) {
      const note = b.text(cid, bp === "Desktop" ? "2 labels still to print" : "2 to print", { style: "Body small/Regular", color: "Text/text-secondary", name: "Note", fill: true });
      const s = b.inst(cid, "Button", "Type=Secondary, Tone=Default, Size=lg, State=Default"); setText(b, s + 3, "Print labels");
      const p = b.inst(cid, "Button", "Type=Primary, Tone=Default, Size=lg, State=Default"); setText(b, p + 3, "Start Preparation");
      return { Note: note };
    } });
  b.set(pan, "Sticky action bar", sb, { cols: 1, cw: 1200, ch: 100, W: 1240, H: 232, textProps: ["Note"] });
}

function nav(b, host) {
  navItem(b, section(b, host, "Nav item · Nav group label", "State: Default, Hover, Pressed, Focused, Active (the open page). Collapsed shows the icon only. Swap the icon with the Icon property."));
  sidebar(b, section(b, host, "Sidebar", "Expanded (248) and Collapsed (88). Built from Nav items and Nav group labels; Dashboard shows the Active state."));
  topbar(b, section(b, host, "Top bar", "Logo, search, notifications and the signed-in user. Phone drops search and shows a menu button."));
  breadcrumb(b, section(b, host, "Breadcrumb", "Two or three levels. The last level is the current page."));
  tabs(b, section(b, host, "Tab", "Underline tabs with an optional count. Selected is the open tab."));
  steps(b, section(b, host, "Stepper step · Stepper", "Done, Current, Upcoming. The Stepper joins 5 or 6 steps with connectors (Batch: Created, Receiving, Preparation, Analysis, RoA approved, CoA published)."));
  page(b, section(b, host, "Page header · Mobile step progress · Pager · Sticky action bar", "Page header: title, status, meta line and actions. Sticky action bar pins the main action to the bottom of a long page."));
}
module.exports = { nav };
