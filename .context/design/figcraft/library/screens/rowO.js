// Row O · Admin (modules 13 Users, 14 Configuration, 15 Audit_log). Plan: .context/docs/Admin/Admin_Screen_Plan.md
// Run after row N: build-screens.js ...,M,N,O. Frames are created under their final names.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver } = H;
const { U } = require("./rowL.js");
const { icon, txt, hframe, vframe, btn, iconBtn, cardTop, pill, overlay, KIND, W, CW, docPage } = U;

const O_NAMES = /^(Desktop|Tablet|Phone)-(13-Users|14-Configuration|15-Audit_log)-/;
const isO = (n) => O_NAMES.test(n.name || "") || (n.name === "Row title" && /^O( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isO(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.nEnd ? b.nEnd[k] : 0); }
  return out;
}
const clearO = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isO(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const MOD = { users: ["13", "Users", "Users"], config: ["14", "Configuration", "Configuration"], audit: ["15", "Audit_log", "Audit log"] };
const frame = (b, x, y, kind, mod, ss, screen, vv, variant, role) => { page(b, kind); const [mm, mn, active] = MOD[mod]; return b.shell({ name: `${KIND(kind)}-${mm}-${mn}-${ss}-${screen}-${vv}-${variant}`, x, y, kind, active, role }); };
const tf = (b, p, label, value, o = {}) => b.instV(p, "Text field", `State=${o.disabled ? "Disabled" : value ? "Filled" : "Default"}, Size=${o.touch ? "touch" : "md"}`, { texts: { Label: label, Value: value || o.ph || "" }, setProps: { "Show helper": !!o.helper, ...(o.helper ? {} : {}) }, ...(o.helper ? { texts: { Label: label, Value: value || "", Helper: o.helper } } : {}), props: o.w ? { width: o.w, sizingH: "fixed" } : { sizingH: "fill" } });
const sel = (b, p, label, value, o = {}) => b.instV(p, "Select", `State=Filled, Size=${o.touch ? "touch" : "md"}`, { texts: { Label: label || "", Value: value }, hide: label ? [] : ["Label"], setProps: { "Show helper": false }, props: o.w ? { width: o.w, sizingH: "fixed" } : { sizingH: "fill" } });
const sw = (b, p, label, on) => b.instV(p, "Switch", `On=${on ? "On" : "Off"}, State=Default`, { texts: { Label: label } });
const role = (b, p, l) => b.instV(p, "Role badge", "Property 1=Default", { texts: { Label: l } });
const chips = (b, p, list) => { const c = hframe(b, p, "Chips", 8, { sizeH: "fill", wrap: true }); list.forEach(([l, n, on]) => b.instV(c, "Filter chip", `Selected=${on ? "On" : "Off"}, State=Default`, { texts: { Label: l, Count: String(n) } })); return c; };
const tabs = (b, p, items, on) => { const r = b.frame(p, { name: "Tabs", w: 400, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug" }); items.forEach(([l, n], i) => b.instV(r, "Tab", `Selected=${i === on ? "On" : "Off"}, State=Default`, n ? { texts: { 0: l, 1: String(n) } } : { texts: { 0: l }, hide: ["Count"] })); return r; };
const kv = (b, p, k, v, v2, link) => { const kv0 = b.v("Key-value row", "Layout=Inline"); const id = b.instV(p, "Key-value row", "Layout=Inline", { texts: { Key: k, Value: v, ...(v2 ? { "Value 2": v2 } : {}) }, fills: link ? { Value: "Primary/primary" } : undefined, props: { sizingH: "fill" } }); if (v2) b.raw("node.set", { ids: [id + kv0.names["Value 2"]], props: { visible: true } }); else b.raw("node.set", { ids: [id + kv0.names.Value], props: { sizingH: "fill", textAutoResize: "height" } }); return id; };
const ST = { Active: ["Feedback/success-100", "Feedback/success"], Invited: ["Primary/primary-100", "Primary/primary"], Inactive: ["Surface/muted", "Text/text-muted"], Locked: ["Feedback/warning-100", "Feedback/warning"], Draft: ["Surface/muted", "Text/text-secondary"], Archived: ["Surface/muted", "Text/text-muted"], Warn: ["Feedback/warning-100", "Feedback/warning"], Block: ["Feedback/error-100", "Feedback/error"] };
const status = (b, p, s) => pill(b, p, s, ST[s][0], ST[s][1], true);
const tag = (b, p, l) => pill(b, p, l, "Surface/muted", "Text/text-secondary", false);
const alert = (b, p, tone, title, text, action) => b.instV(p, "Inline alert", `Tone=${tone}`, { texts: { 0: title, 1: text, ...(action ? { 2: action } : {}) }, hide: action ? [] : ["Action"], props: { sizingH: "fill" } });
function header(b, m, kind, title, act) {
  const r = hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "max", wrap: kind === "phone" });
  const t = vframe(b, r, "Title block", 4, { sizeH: kind === "desktop" ? "hug" : "fill" }); txt(b, t, "ADMIN", "Overline", "Text/text-muted", "Overline"); txt(b, t, title, kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (act) act(r); return r;
}
// generic table: cols [[head, width]], rows of cell builders
function table(b, c, cols, rows, cell, o = {}) {
  const t = vframe(b, c, "Table", 0);
  const head = b.frame(t, { name: "Table header", w: 800, h: 40, fill: "Primary/primary-50", r: 8, layout: "h", cross: "center", sizeH: "fill", sizeV: "fixed" });
  cols.forEach(([h, w]) => { const f = b.frame(head, { name: "Head", w: w || 120, h: 40, layout: "h", gap: 4, pad: [0, 8, 0, 8], cross: "center", main: o.center && o.center.includes(h) ? "center" : "min", sizeH: w ? "fixed" : "fill", sizeV: "fixed" }); if (h) txt(b, f, h, "Caption/SemiBold", "Text/text-secondary", "Head label"); });
  rows.forEach((row, ri) => {
    const rr = vframe(b, t, "Row", 0); const line = b.frame(rr, { name: "Cells", w: 800, h: o.h || 56, layout: "h", cross: "center", sizeH: "fill", sizeV: o.hug ? "hug" : "fixed", pad: o.hug ? [10, 0, 10, 0] : 0 });
    cols.forEach(([h, w], i) => { const f = b.frame(line, { name: "Cell", w: w || 120, h: o.h || 56, layout: "h", gap: 8, pad: [0, 8, 0, 8], cross: "center", main: o.center && o.center.includes(h) ? "center" : "min", wrap: !!o.wrapCells, sizeH: w ? "fixed" : "fill", sizeV: o.hug ? "hug" : "fixed" }); cell(f, h, row, ri, i); });
    if (o.after) o.after(rr, row, ri);
    b.frame(rr, { name: "Divider", w: 800, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  });
  return t;
}
const pager = (b, c, summary, kind) => b.instV(c, "Pager", kind === "phone" ? "Breakpoint=Mobile" : "Breakpoint=Desktop", kind === "phone" ? { texts: { Page: summary }, props: { sizingH: "fill" } } : { texts: { Summary: summary }, props: { sizingH: "fill" } });
function dlg(b, s, kind, h, size, title, text, cancel, ok, body, type = "Default") {
  overlay(b, s, kind, h);
  const v = b.v("Dialog", `Type=${type}, Size=${size}`), dw = { sm: 400, md: 560, lg: 800 }[size];
  const id = b.instV(s.root, "Dialog", `Type=${type}, Size=${size}`, { texts: { 0: title, 1: text || "" }, props: { absolute: true, x: Math.round((W[kind] - dw) / 2), y: 120, width: dw, sizingH: "fixed" } });
  if (!text) b.raw("node.set", { ids: [id + v.names.Text], props: { visible: false } });
  const bt = v.insts.filter((i) => i.name === "Button");
  b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: cancel } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: ok } });
  b.raw("node.set", { ids: [id + v.names.Body], props: { gap: 16 } });
  if (body) body(id + v.names.Body, id, v);
  return id;
}
const avatar64 = (b, p, ini) => { const f = b.frame(p, { name: "Avatar", w: 64, h: 64, fill: "Accent/accent-100", r: 999, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, f, ini, "Heading/H2", "Accent/accent-text", "Initials"); return f; };
const fix = (b, s, h) => b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: h } });
const cols2 = (b, m, lw) => { const c = b.frame(m, { name: "Columns", w: 1128, h: 600, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); const l = vframe(b, c, "Left column", 20); if (lw) b.raw("node.set", { ids: [l], props: { width: lw, sizingH: "fixed" } }); const r = vframe(b, c, "Right column", 20); return [l, r]; };

// ---------- Users (plan section 4) ----------
const USERS = [
  ["Wahyu Pratama", "wahyu@sgsi.co.id", "WP", ["Superadmin"], "Active", "Today, 08:02", "1 Oct 2026"],
  ["Maya Lestari", "maya@sgsi.co.id", "ML", ["Lab Admin"], "Active", "Today, 07:45", "12 Oct 2026"],
  ["Rina Kartika", "rina@sgsi.co.id", "RK", ["CSO"], "Active", "Today, 07:30", "12 Oct 2026"],
  ["Dedi Kurniawan", "dedi@sgsi.co.id", "DK", ["Preparation"], "Active", "Today, 07:20", "12 Oct 2026"],
  ["Yusuf Hidayat", "yusuf@sgsi.co.id", "YH", ["Preparation", "Analyst"], "Active", "4 Nov 2026", "14 Oct 2026"],
  ["Fitri Handayani", "fitri@sgsi.co.id", "FH", ["Analyst"], "Active", "Today, 07:40", "12 Oct 2026"],
  ["Bagus Prasetyo", "bagus@sgsi.co.id", "BP", ["Analyst"], "Locked", "Today, 07:58", "14 Oct 2026"],
  ["Hendra Wijaya", "hendra@sgsi.co.id", "HW", ["Supervisor"], "Active", "Today, 07:12", "12 Oct 2026"],
  ["Bambang Sutrisno", "bambang@sgsi.co.id", "BS", ["Manager"], "Active", "5 Nov 2026", "12 Oct 2026"],
  ["Sari Anggraini", "sari.a@sgsi.co.id", "SA", ["Analyst"], "Invited", "—", "5 Nov 2026"],
];
const ROLES7 = [["Superadmin", "Users, roles and configuration"], ["CSO", "Job orders, clients, sending CoAs"], ["Preparation", "Receives samples, enters ADL"], ["Analyst", "Enters analysis values"], ["Lab Admin", "Reception, signed RoA, CoAs, master data"], ["Supervisor", "Approves, signs reports, reads the audit log"], ["Manager", "Signs reports, reads the audit log"]];
const PERMS = [
  ["Manage users and roles", "Add, edit and deactivate accounts", [1, 0, 0, 0, 0, 0, 0]],
  ["Manage clients and contacts", "Client pages, contacts", [1, 1, 0, 0, 0, 0, 1]],
  ["Edit master data", "Drill holes, lithologies, seams", [1, 0, 0, 0, 1, 0, 0]],
  ["Create and edit job orders", "Sample lists, cancel a job order", [1, 1, 0, 0, 0, 0, 0]],
  ["Create batches", "Inside a job order", [1, 1, 1, 0, 1, 0, 0]],
  ["Receive samples", "Arrival, mass, condition, Confirm reception", [1, 1, 1, 0, 1, 0, 0]],
  ["Enter ADL", "Preparation tab", [1, 0, 1, 0, 0, 0, 0]],
  ["Enter analysis values", "Analysis tab", [1, 0, 0, 1, 0, 0, 0]],
  ["Complete batches", "Upload the signed RoA", [1, 0, 0, 0, 1, 0, 0]],
  ["Publish CoAs", "Generate, publish, revise", [1, 0, 0, 0, 1, 0, 0]],
  ["Sign reports", "Offered as the signatory", [0, 0, 0, 0, 0, 1, 1]],
  ["Mark CoAs sent", "Date, channel, recipient", [1, 1, 0, 0, 0, 0, 0]],
  ["Download RoAs", "The internal file", [1, 0, 0, 1, 1, 1, 1]],
  ["See Quality & reports", "Dashboard tab", [1, 0, 0, 0, 1, 1, 1]],
  ["Change configuration", "This Configuration area", [1, 0, 0, 0, 0, 0, 0]],
  ["Read the audit log", "Who changed what", [1, 0, 0, 0, 0, 1, 1]],
];
const nameCell = (b, f, u, kind) => { b.instV(f, "Avatar", "Size=40", { texts: { Initials: u[2] } }); if (kind === "tablet") { const v = vframe(b, f, "Name", 2); txt(b, v, u[0], "Body small/SemiBold", "Text/heading", "Name"); txt(b, v, u[1], "Caption/Regular", "Text/text-secondary", "Email"); } else txt(b, f, u[0], "Body small/SemiBold", "Text/heading", "Name", { fill: true }); };
function usersBody(b, s, kind, o = {}) {
  const m = s.main;
  header(b, m, kind, "Users", (r) => btn(b, r, "Primary", "Add user", "plus", { size: kind === "phone" ? "touch" : "lg" }));
  tabs(b, m, [["Users", 12], ["Roles"]], o.roles ? 1 : 0);
  if (o.roles) {
    const c = card(b, m, "Roles card"); const hd = cardTop(b, c, "Roles and permissions"); txt(b, c, "Roles are fixed in v1. Ask the product owner for a change.", "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
    const R = ["Superadmin", "CSO", "Prep", "Analyst", "Lab admin", "Supervisor", "Manager"];
    table(b, c, [["Permission", 0], ...R.map((r) => [r, 92])], PERMS, (f, h, row, ri, i) => { if (i === 0) { const v = vframe(b, f, "Permission", 2); txt(b, v, row[0], "Body small/SemiBold", "Text/heading", "Name"); txt(b, v, row[1], "Caption/Regular", "Text/text-secondary", "What it allows"); } else if (row[2][i - 1]) icon(b, f, "check", "Feedback/success", 14); }, { center: R, h: 52 });
    return;
  }
  if (kind === "phone") {
    const tb = hframe(b, m, "Filters", 8, { sizeH: "fill" }); b.instV(tb, "Search", "Size=lg, State=Default", { texts: { Value: "Search name or email" }, props: { sizingH: "fill" }, hide: ["Scan"] }); btn(b, tb, "Secondary", "Filters", "funnel", { size: "touch" });
    const list = vframe(b, m, "Cards", 10);
    USERS.slice(0, 6).forEach((u) => { const c = vframe(b, list, "Item card", 8, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: [16, 16, 16, 16] }); const t = hframe(b, c, "Top", 10, { sizeH: "fill" }); b.instV(t, "Avatar", "Size=40", { texts: { Initials: u[2] } }); const v = vframe(b, t, "Name", 2); txt(b, v, u[0], "Body small/SemiBold", "Text/heading", "Name"); txt(b, v, u[1], "Caption/Regular", "Text/text-secondary", "Email"); status(b, t, u[4]); const r = hframe(b, c, "Roles", 6, { wrap: true, sizeH: "fill" }); u[3].forEach((x) => role(b, r, x)); });
    pager(b, m, "1 / 2", kind); return;
  }
  const c = card(b, m, "Table card");
  const f = hframe(b, c, "Filters", 12, { sizeH: "fill", wrap: true, cross: "max" }); b.instV(f, "Search", "Size=md, State=Default", { texts: { Value: "Search name or email" }, props: { width: kind === "desktop" ? 300 : 260, sizingH: "fixed" }, hide: ["Scan"] }); sel(b, f, "Role", "All roles", { w: 200 });
  chips(b, c, [["All", 12, 1], ["Active", 9], ["Invited", 1], ["Inactive", 1], ["Locked", 1]]);
  const cols = kind === "desktop" ? [["Name", 0], ["Email", 200], ["Roles", 220], ["Status", 110], ["Last sign-in", 130], ["Created", 120], ["", 48]] : [["Name", 0], ["Roles", 210], ["Status", 100], ["", 44]];
  table(b, c, cols, USERS, (cell, h, u) => { if (h === "Name") nameCell(b, cell, u, kind); if (h === "Email") txt(b, cell, u[1], "Body small/Regular", "Text/text-secondary", "Email"); if (h === "Roles") u[3].forEach((x) => role(b, cell, x)); if (h === "Status") status(b, cell, u[4]); if (h === "Last sign-in") txt(b, cell, u[5], "Body small/Regular", "Text/text-secondary", "Last"); if (h === "Created") txt(b, cell, u[6], "Body small/Regular", "Text/text-secondary", "Created"); if (h === "") iconBtn(b, cell, "dots-three"); }, { h: kind === "tablet" ? 64 : 56 });
  pager(b, c, "Showing 1–10 of 12", kind);
}
function usersList(b, x, y, kind, vv, variant, o = {}) { const s = frame(b, x, y, kind, "users", "01", "Users_list", vv, variant, "Superadmin"); usersBody(b, s, kind, o); return s; }
const PEOPLE = {
  hendra: { u: ["Hendra Wijaya, S.T.", "hendra@sgsi.co.id", "HW", ["Supervisor"], "Active"], title: "Laboratory Supervisor", phone: "+62 811 5550 0731", sign: "Yes", last: "Today, 07:12", pwd: "2 Nov 2026", fail: "0", perms: [10, 12, 13, 15], act: [["Exported the audit log", "Today, 10:20"], ["Signed in", "Today, 07:12"], ["Opened B-2026-0417", "Yesterday, 16:30"], ["Signed in", "Yesterday, 07:05"]] },
  bagus: { u: ["Bagus Prasetyo, A.Md.", "bagus@sgsi.co.id", "BP", ["Analyst"], "Locked"], title: "Laboratory Analyst", phone: "+62 812 5550 1180", sign: "No", last: "Today, 07:58", pwd: "14 Oct 2026", fail: "5", perms: [7, 12], act: [["Account locked", "Today, 07:58"], ["Sign-in failed", "Today, 07:57"], ["Sign-in failed", "Today, 07:57"], ["Entered values on B-2026-0416", "4 Nov 2026"]] },
  sari: { u: ["Sari Anggraini", "sari.a@sgsi.co.id", "SA", ["Analyst"], "Invited"], title: "Laboratory Analyst", phone: "—", sign: "No", last: "Never", pwd: "Not set", fail: "0", perms: [7, 12], act: [["Invited by Wahyu Pratama", "5 Nov 2026, 14:02"]] },
};
function userDetail(b, x, y, kind, vv, variant, key) {
  const P = PEOPLE[key], u = P.u;
  const s = frame(b, x, y, kind, "users", "02", "User_detail", vv, variant, "Superadmin"); const m = s.main;
  b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Users", 1: u[0] } });
  const hd = kind === "phone" ? vframe(b, m, "Header", 16) : hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center" });
  const idt = hframe(b, hd, "Identity", 16, { sizeH: kind === "phone" ? "fill" : "hug" }); avatar64(b, idt, u[2]);
  const t = vframe(b, idt, "Text", 6, { sizeH: kind === "phone" ? "fill" : "hug" }); txt(b, t, u[0], kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title"); const tg = hframe(b, t, "Tags", 8, { wrap: true }); u[3].forEach((x) => role(b, tg, x)); status(b, tg, u[4]);
  const a = hframe(b, hd, "Actions", 8); btn(b, a, "Secondary", "Edit", "pencil-simple", { size: kind === "phone" ? "touch" : "lg" }); iconBtn(b, a, "dots-three", 36);
  const details = (p) => { const c = card(b, p, "Details card"); cardTop(b, c, "Details"); kv(b, c, "Email", u[1]); kv(b, c, "Title", P.title); kv(b, c, "Phone", P.phone); kv(b, c, "Created", key === "sari" ? "5 Nov 2026" : "12 Oct 2026", "Wahyu Pratama"); };
  const security = (p) => { const c = card(b, p, "Security card"); cardTop(b, c, "Security");
    if (key === "bagus") alert(b, c, "Warning", "Locked after 5 failed attempts", "Until 10:42 today, or until you unlock it.", "Unlock");
    if (key === "sari") alert(b, c, "Info", "Invite sent 5 Nov 2026", "It expires on 12 Nov 2026.", "Resend invite");
    kv(b, c, "Last sign-in", P.last); kv(b, c, "Password changed", P.pwd); kv(b, c, "Failed attempts", P.fail); if (key !== "sari") btn(b, c, "Secondary", "Send password reset", "envelope-simple", { size: "md" }); };
  const roles = (p) => { const c = card(b, p, "Roles card"); cardTop(b, c, "Roles and permissions"); const r = hframe(b, c, "Roles", 6, { wrap: true }); u[3].forEach((x) => role(b, r, x)); const l = vframe(b, c, "Permissions", 8); P.perms.forEach((i) => { const row = hframe(b, l, "Permission", 8, { sizeH: "fill" }); icon(b, row, "check", "Feedback/success", 14); txt(b, row, PERMS[i][0], "Body small/Regular", "Text/foreground", "Name"); }); kv(b, c, "Signatory", P.sign); };
  const activity = (p) => { const c = card(b, p, "Activity card"); cardTop(b, c, "Recent activity"); P.act.forEach(([e, w], i) => { const r = hframe(b, c, "Event", 12, { sizeH: "fill", main: "spaceBetween" }); txt(b, r, e, "Body small/Regular", "Text/foreground", "Event"); txt(b, r, w, "Caption/Regular", "Text/text-muted", "When"); }); const l = hframe(b, c, "Link", 0); b.instV(l, "Link button", "State=Default", { texts: { Label: "Open in audit log" }, hide: ["Icon"] }); };
  if (kind === "desktop") { const [l, r] = cols2(b, m, 460); details(l); security(l); roles(r); activity(r); } else { details(m); security(m); roles(m); activity(m); }
  return s;
}
function roleChecklist(b, bd, on, touch) {
  const g = vframe(b, bd, "Roles", 8); txt(b, g, "Roles *", "Caption/SemiBold", "Text/text-secondary", "Label");
  const grid = b.frame(g, { name: "Options", w: 700, h: 100, layout: "h", gap: 12, wrap: true, sizeH: "fill", sizeV: "hug" });
  ROLES7.forEach(([r, d]) => { const o = vframe(b, grid, "Role option", 2, { w: touch ? 318 : 370, sizeH: "fixed", stroke: on.includes(r) ? "Primary/primary" : "Surface/border", sw: 1, r: 10, pad: [10, 12, 10, 12], fill: on.includes(r) ? "Primary/primary-50" : "Surface/card" }); b.instV(o, "Checkbox", `Checked=${on.includes(r) ? "On" : "Off"}, State=Default`, { texts: { Label: r } }); txt(b, o, d, "Caption/Regular", "Text/text-secondary", "Description", { fill: true }); });
}
function userForm(b, x, y, vv, variant, mode) {
  const s = usersList(b, x, y, "desktop", vv, variant); b.raw("node.set", { ids: [s.root], props: { name: `Desktop-13-Users-03-User_form-${vv}-${variant}` } });
  const H0 = 1120;
  if (mode === "add" || mode === "edit") {
    const ed = mode === "edit";
    dlg(b, s, "desktop", H0, "lg", ed ? "Edit user" : "Add user", "", "Cancel", ed ? "Save" : "Send invite", (bd) => {
      const r1 = hframe(b, bd, "Row", 12, { sizeH: "fill", cross: "min" }); tf(b, r1, "Name *", ed ? "Yusuf Hidayat" : "Sari Anggraini"); tf(b, r1, "Email *", ed ? "yusuf@sgsi.co.id" : "sari.a@sgsi.co.id", { disabled: ed });
      const r2 = hframe(b, bd, "Row", 12, { sizeH: "fill", cross: "min" }); tf(b, r2, "Title (printed on reports)", ed ? "Sample Preparation Technician" : "Laboratory Analyst"); tf(b, r2, "Phone", ed ? "+62 813 5550 2290" : "", { ph: "+62" });
      roleChecklist(b, bd, ed ? ["Preparation", "Analyst"] : ["Analyst"]);
      txt(b, bd, ed ? "Email can no longer change: Yusuf has signed in." : "We email an invite. It works for 7 days.", "Caption/Regular", "Text/text-muted", "Note", { fill: true });
    });
  } else if (mode === "deactivate") {
    dlg(b, s, "desktop", H0, "sm", "Deactivate Bagus Prasetyo?", "He can no longer sign in. His work and history stay, and you can reactivate him later.", "Cancel", "Deactivate", null, "Destructive");
  } else {
    const id = dlg(b, s, "desktop", H0, "md", "Remove the Superadmin role?", "", "Cancel", "Remove role", (bd) => { alert(b, bd, "Error", "There must be at least one active Superadmin", "Wahyu Pratama is the only one. Give another user the Superadmin role first."); }, "Destructive");
    const v = b.v("Dialog", "Type=Destructive, Size=md"); const bt = v.insts.filter((i) => i.name === "Button"); b.raw("node.set", { ids: [id + bt[1].pos], props: { opacity: 0.4 } });
  }
  return s;
}
function addUserPhone(b, x, y) {
  const s = frame(b, x, y, "phone", "users", "03", "User_form", "01", "Add_user", "Superadmin"); const m = s.main;
  b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Users", 1: "Add user" } }); txt(b, m, "Add user", "Heading/H1", "Text/heading", "Title");
  const c = card(b, m, "Form card"); tf(b, c, "Name *", "Sari Anggraini", { touch: true }); tf(b, c, "Email *", "sari.a@sgsi.co.id", { touch: true }); tf(b, c, "Title (printed on reports)", "Laboratory Analyst", { touch: true }); roleChecklist(b, c, ["Analyst"], true); txt(b, c, "We email an invite. It works for 7 days.", "Caption/Regular", "Text/text-muted", "Note", { fill: true });
  const bar = b.instV(s.root, "Sticky action bar", "Breakpoint=Mobile", { texts: { Note: "" }, props: { sizingH: "fill" } }); const v = b.v("Sticky action bar", "Breakpoint=Mobile"); b.raw("node.set", { ids: [bar + v.texts[1].pos], props: { characters: "Cancel" } }); b.raw("node.set", { ids: [bar + v.texts[2].pos], props: { characters: "Send invite" } }); b.raw("node.set", { ids: [bar + v.names.Note], props: { visible: false } });
}

// ---------- Audit log (plan section 5) ----------
const AUDIT = [
  ["Today, 10:42", "FH", "Fitri Handayani", "Updated", "Sample", "BNM-3507", "Ash (ADB)", [["Ash (ADB)", "5.40", "5.42"]]],
  ["Today, 10:20", "HW", "Hendra Wijaya", "Exported", "Audit log", "Last 7 days", "—"],
  ["Today, 09:12", "ML", "Maya Lestari", "Published", "Report", "CoA-JO-2026-0131-2", "—"],
  ["Today, 08:31", "WP", "Wahyu Pratama", "Changed setting", "Configuration", "Validation rule V-31", "1 field", [["Ash (ADB), warn above", "50 %", "45 %"]]],
  ["Today, 07:58", "BP", "Bagus Prasetyo", "Account locked", "User", "Bagus Prasetyo", "—"],
  ["Today, 07:12", "HW", "Hendra Wijaya", "Signed in", "Sign-in", "Hendra Wijaya", "—"],
  ["Yesterday, 16:05", "DK", "Dedi Kurniawan", "Status changed", "Batch", "B-2026-0417", "Status", [["Status", "Receiving", "Preparation"]]],
  ["Yesterday, 15:40", "RK", "Rina Kartika", "Created", "Job order", "JO-2026-0142", "12 fields"],
  ["Yesterday, 11:02", "FH", "Fitri Handayani", "Updated", "Sample", "BNM-3506", "2 fields"],
  ["4 Nov 2026, 14:20", "WP", "Wahyu Pratama", "Updated", "User", "Yusuf Hidayat", "Roles", [["Roles", "Preparation", "Preparation, Analyst"]]],
];
const AUDIT_REC = [
  ["Today, 10:42", "FH", "Fitri Handayani", "Updated", "Sample", "BNM-3507", "Ash (ADB)", [["Ash (ADB)", "5.40", "5.42"]]],
  ["28 Oct 2026, 15:02", "ML", "Maya Lestari", "Status changed", "Sample", "BNM-3507", "Status", [["Status", "Analysed", "Completed"]]],
  ["25 Oct 2026, 13:40", "FH", "Fitri Handayani", "Updated", "Sample", "BNM-3507", "8 fields"],
  ["23 Oct 2026, 10:15", "DK", "Dedi Kurniawan", "Updated", "Sample", "BNM-3507", "ADL", [["ADL (%)", "—", "6.42"]]],
  ["22 Oct 2026, 09:12", "DK", "Dedi Kurniawan", "Updated", "Sample", "BNM-3507", "4 fields"],
  ["20 Oct 2026, 11:30", "RK", "Rina Kartika", "Created", "Sample", "BNM-3507", "6 fields"],
];
function diffTable(b, p) { const d = vframe(b, p, "Diff", 0, { fill: "Surface/muted", r: 10, pad: [8, 12, 8, 12] }); return d; }
function auditBody(b, s, kind, o = {}) {
  const m = s.main;
  header(b, m, kind, "Audit log", (r) => { if (kind !== "phone") btn(b, r, "Secondary", "Export CSV", "download-simple"); });
  const rows = o.record ? AUDIT_REC : AUDIT;
  if (kind === "phone") {
    const tb = hframe(b, m, "Filters", 8, { sizeH: "fill" }); b.instV(tb, "Search", "Size=lg, State=Default", { texts: { Value: "Search record ID" }, props: { sizingH: "fill" }, hide: ["Scan"] }); btn(b, tb, "Secondary", "Filters", "funnel", { size: "touch" });
    const list = vframe(b, m, "Cards", 10);
    rows.slice(0, 6).forEach((a) => { const c = vframe(b, list, "Item card", 6, { fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: [14, 16, 14, 16] }); const t = hframe(b, c, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, t, a[3], "Body small/SemiBold", "Text/heading", "Action"); txt(b, t, a[0], "Caption/Regular", "Text/text-muted", "When"); const r = hframe(b, c, "Record", 6); txt(b, r, a[4], "Caption/Regular", "Text/text-secondary", "Type"); txt(b, r, a[5], "Data", "Primary/primary", "Record"); const w = hframe(b, c, "Who", 8); b.instV(w, "Avatar", "Size=24", { texts: { Initials: a[1] } }); txt(b, w, a[2], "Caption/Regular", "Text/text-secondary", "User"); });
    pager(b, m, "1 / 9", kind); return;
  }
  const c = card(b, m, "Table card");
  const f = hframe(b, c, "Filters", 12, { sizeH: "fill", wrap: true, cross: "max" }); b.instV(f, "Search", `Size=md, State=${o.record ? "Filled" : "Default"}`, { texts: { Value: o.record ? "BNM-3507" : "Search record ID" }, props: { width: 240, sizingH: "fixed" }, hide: ["Scan"] });
  [["Date", o.record ? "All time" : "Last 7 days"], ["User", "All users"], ["Record type", o.record ? "Sample" : "All types"], ["Action", "All actions"]].forEach(([l, v]) => sel(b, f, l, v, { w: kind === "desktop" ? 180 : 200 }));
  if (o.record) { const ch = hframe(b, c, "Active filters", 8, { sizeH: "fill" }); b.instV(ch, "Filter chip", "Selected=On, State=Default", { texts: { Label: "Record: BNM-3507", Count: "6" } }); b.instV(ch, "Link button", "State=Default", { texts: { Label: "Clear" }, hide: ["Icon"] }); }
  const cols = kind === "desktop" ? [["When", 150], ["User", 190], ["Action", 150], ["Record", 0], ["Changes", 170]] : [["When", 130], ["Record", 0], ["Action", 140], ["", 44]];
  table(b, c, cols, rows, (cell, h, a) => {
    if (h === "When") txt(b, cell, a[0], "Body small/Regular", "Text/text-secondary", "When");
    if (h === "User") { b.instV(cell, "Avatar", "Size=24", { texts: { Initials: a[1] } }); txt(b, cell, a[2], "Body small/Regular", "Text/foreground", "User"); }
    if (h === "Action") txt(b, cell, a[3], "Body small/Medium", "Text/heading", "Action");
    if (h === "Record") { const v = vframe(b, cell, "Record", 0); txt(b, v, a[4], "Caption/Regular", "Text/text-muted", "Type"); txt(b, v, a[5], "Data", "Primary/primary", "ID"); }
    if (h === "Changes") { txt(b, cell, a[6], "Body small/Regular", "Text/text-secondary", "Changes"); if (a[7]) icon(b, cell, "caret-down", "Text/text-muted", 14); }
    if (h === "" && a[7]) iconBtn(b, cell, "caret-down");
  }, { after: (rr, a, ri) => { if (!(o.expanded && ri === 0) || !a[7]) return; const d = vframe(b, rr, "Diff", 0, { fill: "Surface/muted", r: 10, pad: [8, 12, 8, 12] }); const hd = hframe(b, d, "Diff head", 0, { sizeH: "fill", pad: [4, 0, 4, 0] }); [["Field", 260], ["Before", 200], ["After", 200]].forEach(([l, w]) => { const fr = b.frame(hd, { name: "Head", w, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, fr, l, "Caption/SemiBold", "Text/text-secondary", "Head label"); }); a[7].forEach(([fd, be, af]) => { const r = hframe(b, d, "Diff row", 0, { sizeH: "fill", pad: [4, 0, 4, 0] }); const c1 = b.frame(r, { name: "Field", w: 260, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, c1, fd, "Body small/Medium", "Text/heading", "Field"); const c2 = b.frame(r, { name: "Before", w: 200, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); const bt = txt(b, c2, be, "Data", "Text/text-muted", "Before"); b.raw("node.set", { ids: [bt], props: { textDecoration: "strikethrough" } }); const c3 = b.frame(r, { name: "After", w: 200, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, c3, af, "Data/Strong", "Text/heading", "After"); }); txt(b, d, "Record changed by Fitri Handayani on the Analysis tab of B-2026-0410.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); } });
  pager(b, c, o.record ? "Showing 1–6 of 6" : "Showing 1–10 of 184", kind);
}
function audit(b, x, y, kind, vv, variant, roleKey, o) { const s = frame(b, x, y, kind, "audit", "01", "Audit_log", vv, variant, roleKey); auditBody(b, s, kind, o); return s; }

// ---------- Configuration (plan section 6) ----------
const SECTIONS = [["LAB DATA", [["Parameters", 34], ["Services", 5], ["Methods and standards", 42], ["Validation rules", 33], ["Lookups", 5]]], ["DOCUMENTS", [["Report templates", 1], ["Laboratory"]]], ["SYSTEM", [["Security"], ["Formulas", 5]]], ["NEXT GOAL", [["Result tabs and fields", null, true], ["Field definitions", null, true]]]];
const SDESC = { Parameters: "Codes, units, groups, bases, decimals", Services: "Quick-select templates for job orders", "Methods and standards": "ASTM, ISO and GB/T methods with editions", "Validation rules": "Ranges and severity of the checks", Lookups: "Conditions, hold reasons, tags, channels", "Report templates": "The CoA template and its versions", Laboratory: "Name, address, logo, numbering", Security: "Lockout, sign-out, passwords, links", Formulas: "Bases and calculated values (view only)" };
function sectionsList(b, p, on) {
  const c = card(b, p, "Sections card"); b.raw("node.set", { ids: [c], props: { width: 260, sizingH: "fixed" } }); cardTop(b, c, "Sections");
  SECTIONS.forEach(([g, items]) => { const gr = vframe(b, c, "Group", 2); txt(b, gr, g, "Overline", "Text/text-muted", "Group"); items.forEach(([l, n, next]) => { const r = hframe(b, gr, "Section", 8, { sizeH: "fill", main: "spaceBetween", pad: [8, 10, 8, 10], r: 8, fill: l === on ? "Primary/primary-50" : undefined }); txt(b, r, l, l === on ? "Body small/SemiBold" : "Body small/Regular", next ? "Text/text-muted" : l === on ? "Text/heading" : "Text/foreground", "Label"); if (next) tag(b, r, "Next goal"); else if (n) txt(b, r, String(n), "Caption/Medium", "Text/text-muted", "Count"); }); });
  return c;
}
function configFrame(b, x, y, kind, ss, screen, vv, variant, on, content, o = {}) {
  const s = frame(b, x, y, kind, "config", ss, screen, vv, variant, "Superadmin"); const m = s.main;
  header(b, m, kind, "Configuration", (r) => { if (kind !== "phone") b.instV(r, "Search", `Size=md, State=${o.q ? "Filled" : "Default"}`, { texts: { Value: o.q || "Search settings" }, props: { width: 320, sizingH: "fixed" }, hide: ["Scan"] }); });
  if (kind === "desktop") { const cols = b.frame(m, { name: "Columns", w: 1128, h: 600, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); sectionsList(b, cols, on); const r = vframe(b, cols, "Content", 16); content(r, s); }
  else if (kind === "tablet") { if (on) sel(b, m, "Section", on); content(m, s); }
  else { if (on) b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Configuration", 1: on } }); content(m, s); }
  return s;
}
const sectionHead = (b, c, title, count, act) => { const hd = b.frame(c, { name: "Card head", w: 400, h: 32, layout: "h", gap: 12, main: "spaceBetween", cross: "center", sizeH: "fill", sizeV: "fixed" }); const ts = hframe(b, hd, "Title section", 8); txt(b, ts, title, "Heading/H3", "Text/heading", "Title"); if (count) b.instV(ts, "Count pill", "Tone=Primary", { texts: { Label: String(count) } }); if (act) btn(b, hd, "Secondary", act, "plus", { size: "md" }); return hd; };
function hubOverview(b, p, kind) {
  const grid = b.frame(p, { name: "Section cards", w: 800, h: 400, layout: kind === "phone" ? "v" : "h", gap: 16, wrap: kind !== "phone", sizeH: "fill", sizeV: "hug" });
  SECTIONS.slice(0, 3).flatMap(([, it]) => it).forEach(([l, n]) => { const c = vframe(b, grid, "Section card", 6, { w: kind === "tablet" ? 333 : kind === "phone" ? 358 : 270, sizeH: kind === "phone" ? "fill" : "fixed", fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: [16, 16, 16, 16] }); const t = hframe(b, c, "Title", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, t, l, "Heading/H3", "Text/heading", "Title"); if (n) b.instV(t, "Count pill", "Tone=Primary", { texts: { Label: String(n) } }); txt(b, c, SDESC[l], "Body small/Regular", "Text/text-secondary", "Description", { fill: true }); const w = hframe(b, c, "Changed", 6, { wrap: true }); txt(b, w, "Last changed 4 Nov 2026", "Caption/Regular", "Text/text-muted", "When"); txt(b, w, "Wahyu Pratama", "Caption/Medium", "Text/text-secondary", "By"); });
  if (kind !== "desktop") { const n = vframe(b, p, "Next goal", 6, { fill: "Surface/muted", r: 12, pad: [12, 16, 12, 16] }); txt(b, n, "Next goal", "Body small/SemiBold", "Text/heading", "Title"); txt(b, n, "Result tabs and fields, Field definitions", "Caption/Regular", "Text/text-secondary", "Text", { fill: true }); }
}
function hubSearch(b, p) {
  const groups = [["Parameters", [["Ash", "Proximate, %, ADB"], ["Ash analysis ▸", "29 oxides and ratios"]]], ["Validation rules", [["V-31 Ash (ADB) warn above 45 %", "Warn"], ["V-09 Ash + VM + IM ≤ 100", "Block, fixed"]]], ["Methods and standards", [["ASTM D3174-12 Ash", "ASTM"], ["ISO 1171:2010 Ash", "ISO"], ["GB/T 212-2008 Proximate", "GB/T"]]]];
  txt(b, p, "7 results for \"ash\" in 3 sections", "Body small/Regular", "Text/text-secondary", "Summary");
  groups.forEach(([g, items]) => { const c = card(b, p, g + " card"); sectionHead(b, c, g, items.length); items.forEach(([t, d], i) => { if (i) b.frame(c, { name: "Divider", w: 400, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" }); const r = hframe(b, c, "Result", 12, { sizeH: "fill", main: "spaceBetween" }); txt(b, r, t, "Body small/SemiBold", "Text/heading", "Item"); txt(b, r, d, "Caption/Regular", "Text/text-secondary", "Detail"); }); });
}
const PARAMS = [["TM", "Total moisture", "%", "Moisture", "AR", "2", ["ASTM", "ISO", "GB/T"]], ["IM", "Inherent moisture", "%", "Moisture", "ADB", "2", ["ASTM", "ISO", "GB/T"]], ["EQM", "Equilibrium moisture", "%", "Moisture", "—", "2", ["ASTM", "ISO"]], ["Ash", "Ash", "%", "Proximate", "ADB", "2", ["ASTM", "ISO", "GB/T"]], ["VM", "Volatile matter", "%", "Proximate", "ADB", "2", ["ASTM", "ISO", "GB/T"]], ["FC", "Fixed carbon", "%", "Proximate", "ADB", "2", ["Calc"]], ["TS", "Total sulfur", "%", "Sulfur", "ADB", "2", ["ASTM", "ISO", "GB/T"]], ["GCV", "Gross calorific value", "kcal/kg", "Calorific", "ADB", "0", ["ASTM", "ISO", "GB/T"]], ["NCV", "Net calorific value", "kcal/kg", "Calorific", "AR", "0", ["ASTM", "ISO"]], ["HGI", "Hardgrove grindability index", "—", "Physical", "—", "0", ["ASTM", "ISO", "GB/T"]]];
function parameters(b, p, kind) {
  const c = card(b, p, "Parameters card"); sectionHead(b, c, "Parameters", 34, kind === "phone" ? null : "Add parameter");
  if (kind !== "phone") { b.instV(c, "Search", "Size=md, State=Default", { texts: { Value: "Search code or name" }, props: { width: 300, sizingH: "fixed" }, hide: ["Scan"] }); chips(b, c, [["All", 34, 1], ["Moisture", 3], ["Proximate", 3], ["Sulfur", 2], ["Calorific", 2], ["Ultimate", 4], ["Physical", 3], ["Ash", 4], ["Chemical", 5], ["Coking coal", 8]]); }
  if (kind === "phone") { PARAMS.slice(0, 6).forEach((r, i) => { if (i) b.frame(c, { name: "Divider", w: 400, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" }); const row = vframe(b, c, "Item", 4); const t = hframe(b, row, "Top", 8, { sizeH: "fill", main: "spaceBetween" }); txt(b, t, r[0] + "  " + r[1], "Body small/SemiBold", "Text/heading", "Name"); status(b, t, "Active"); txt(b, row, `${r[3]}, ${r[2]}, ${r[4]}`, "Caption/Regular", "Text/text-secondary", "Detail"); }); pager(b, c, "1 / 4", kind); return; }
  const cols = kind === "desktop" ? [["Code", 70], ["Name", 0], ["Unit", 76], ["Group", 100], ["Basis", 64], ["Decimals", 80], ["Methods", 150], ["Status", 90], ["", 44]] : [["Code", 70], ["Name", 0], ["Group", 110], ["Methods", 150], ["", 44]];
  table(b, c, cols, PARAMS, (cell, h, r) => { const map = { Code: 0, Name: 1, Unit: 2, Group: 3, Basis: 4, Decimals: 5 }; if (h === "Code") txt(b, cell, r[0], "Data/Strong", "Text/heading", "Code"); else if (h in map) txt(b, cell, r[map[h]], "Body small/Regular", h === "Name" ? "Text/foreground" : "Text/text-secondary", h); if (h === "Methods") r[6].forEach((x) => tag(b, cell, x)); if (h === "Status") status(b, cell, "Active"); if (h === "") iconBtn(b, cell, "dots-three"); }, { h: 52 });
  pager(b, c, "Showing 1–10 of 34", kind);
}
const SERVICES = [["TM + Prox + TS + CV", "7 parameters", "5 days", "v3", "Active", true], ["Prox only", "4 parameters", "3 days", "v1", "Active"], ["Full analysis", "20 parameters", "10 days", "v2", "Active"], ["Coking coal", "14 parameters", "10 days", "v2", "Active"], ["Coking coal", "16 parameters", "12 days", "v3", "Draft"], ["Preparation only", "1 parameter", "2 days", "v1", "Active"]];
function services(b, p, kind) {
  const c = card(b, p, "Services card"); sectionHead(b, c, "Services", 5, "Add service"); txt(b, c, "Quick-select templates on the job order form. A change makes a new version; job orders keep the version they used.", "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
  const cols = kind === "desktop" ? [["Name", 0], ["Parameters", 130], ["Turnaround", 110], ["Version", 80], ["Status", 100], ["", 90], ["", 44]] : [["Name", 0], ["Parameters", 120], ["Status", 100], ["", 44]];
  table(b, c, cols, SERVICES, (cell, h, r, ri, i) => { if (h === "Name") txt(b, cell, r[0], "Body small/SemiBold", "Text/heading", "Name"); if (h === "Parameters") txt(b, cell, r[1], "Body small/Regular", "Text/text-secondary", "Count"); if (h === "Turnaround") txt(b, cell, r[2], "Body small/Regular", "Text/text-secondary", "TAT"); if (h === "Version") txt(b, cell, r[3], "Data", "Text/text-secondary", "Version"); if (h === "Status") status(b, cell, r[4]); if (h === "" && i === cols.length - 2 && r[5]) pill(b, cell, "Default", "Accent/accent-100", "Accent/accent-text", false); if (h === "" && i === cols.length - 1) iconBtn(b, cell, "dots-three"); }, { h: 52 });
}
const METHODS = [["TM", "D3302-22", "ISO 589:2008", "GB/T 211-2017"], ["IM", "D3173-17", "ISO 11722:2013", "GB/T 212-2008"], ["Ash", "D3174-12", "ISO 1171:2010", "GB/T 212-2008"], ["VM", "D3175-20", "ISO 562:2010", "GB/T 212-2008"], ["TS", "D4239-18", "ISO 19579:2006", "GB/T 214-2007"], ["GCV", "D5865-19", "ISO 1928:2020", "GB/T 213-2008"], ["HGI", "D409-16", "ISO 5074:2015", "GB/T 2565-2014"], ["CSN", "D720-15", "ISO 501:2012", "GB/T 5448-2014"], ["G – Index", "", "", "GB/T 5447-2014"], ["Gray King", "", "ISO 502:2015", "GB/T 1341-2007"]];
function methods(b, p) {
  const c = card(b, p, "Methods card"); sectionHead(b, c, "Methods and standards", 42, "Add method"); txt(b, c, "An empty cell means the standard has no method for the parameter; the job order form then disables that pill for the standard.", "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
  table(b, c, [["Parameter", 160], ["ASTM", 0], ["ISO", 0], ["GB/T", 0]], METHODS, (cell, h, r) => { const i = { Parameter: 0, ASTM: 1, ISO: 2, "GB/T": 3 }[h]; if (i === 0) txt(b, cell, r[0], "Body small/SemiBold", "Text/heading", "Parameter"); else if (r[i]) txt(b, cell, r[i], "Data", "Text/foreground", "Method"); else txt(b, cell, "No method", "Caption/Regular", "Text/text-muted", "Empty"); }, { h: 48 });
}
const RULES = [["V-31", "TM (AR)", "Warn", "Above 60 %"], ["V-31", "Ash (ADB)", "Warn", "Above 45 %"], ["V-31", "TS (ADB)", "Warn", "Above 5 %"], ["V-31", "GCV (ADB)", "Warn", "Outside 3,000 to 8,000 kcal/kg"], ["V-27", "ADL before Finish Preparation", "Warn", "When the service has TM"], ["V-28", "Labels printed before Confirm reception", "Warn", "Every arrived sample"], ["V-32", "Every value before Finish Analysis", "Block", "Arrived, not-held samples"], ["V-09", "Ash + VM + IM", "Block", "At most 100 (fixed)"], ["V-30", "Percentages", "Block", "0 to 100 (fixed)"]];
function rules(b, p) {
  const c = card(b, p, "Rules card"); sectionHead(b, c, "Validation rules", 33); txt(b, c, "Fixed rules come from the specification and can't be changed here.", "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
  table(b, c, [["Rule", 70], ["Applies to", 0], ["Severity", 100], ["Bounds", 240], ["", 44]], RULES, (cell, h, r) => { if (h === "Rule") txt(b, cell, r[0], "Data/Strong", "Text/heading", "Rule"); if (h === "Applies to") txt(b, cell, r[1], "Body small/Regular", "Text/foreground", "Applies"); if (h === "Severity") status(b, cell, r[2]); if (h === "Bounds") txt(b, cell, r[3], "Body small/Regular", "Text/text-secondary", "Bounds"); if (h === "") (/fixed/.test(r[3]) ? icon(b, cell, "lock-simple", "Text/text-muted", 14) : iconBtn(b, cell, "pencil-simple")); }, { h: 52 });
}
function lookups(b, p) {
  const c = card(b, p, "Lookups card"); sectionHead(b, c, "Lookups", 5, "Add value");
  tabs(b, c, [["Sample conditions", 5], ["Hold reasons", 4], ["Photo tags", 3], ["Lithology kinds", 3], ["Send channels", 4]], 0);
  table(b, c, [["Order", 70], ["Value", 0], ["Needs a remark", 150], ["Status", 100], ["", 44]], [["1", "Good", "No"], ["2", "Damaged", "Yes"], ["3", "Wet", "Yes"], ["4", "Short", "Yes"], ["5", "No tag", "Yes"]], (cell, h, r) => { if (h === "Order") txt(b, cell, r[0], "Body small/Regular", "Text/text-muted", "Order"); if (h === "Value") txt(b, cell, r[1], "Body small/SemiBold", "Text/heading", "Value"); if (h === "Needs a remark") txt(b, cell, r[2], "Body small/Regular", "Text/text-secondary", "Remark"); if (h === "Status") status(b, cell, "Active"); if (h === "") iconBtn(b, cell, "dots-three"); }, { h: 48 });
}
function templates(b, p) {
  const c = card(b, p, "Templates card"); sectionHead(b, c, "House CoA template", null, "New version"); txt(b, c, "One template in v1; templates per client are next goal. Activating a version changes new CoAs only.", "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
  table(b, c, [["Version", 80], ["Status", 110], ["Changed by", 180], ["Date", 130], ["Note", 0], ["", 44]], [["v3", "Draft", "Wahyu Pratama", "5 Nov 2026", "New form code in the footer"], ["v2", "Active", "Wahyu Pratama", "20 Oct 2026", "Terms line updated"], ["v1", "Archived", "Wahyu Pratama", "1 Oct 2026", "First version"]], (cell, h, r) => { if (h === "Version") txt(b, cell, r[0], "Data/Strong", "Text/heading", "Version"); if (h === "Status") status(b, cell, r[1]); if (h === "Changed by") txt(b, cell, r[2], "Body small/Regular", "Text/foreground", "By"); if (h === "Date") txt(b, cell, r[3], "Body small/Regular", "Text/text-secondary", "Date"); if (h === "Note") txt(b, cell, r[4], "Body small/Regular", "Text/text-secondary", "Note"); if (h === "") iconBtn(b, cell, "dots-three"); }, { h: 52 });
}
function templateVersion(b, p) {
  const f = card(b, p, "Fields card"); sectionHead(b, f, "Version 3 (draft)");
  const r1 = hframe(b, f, "Row", 12, { sizeH: "fill", cross: "min" }); tf(b, r1, "Title", "Certificate of Analysis"); tf(b, r1, "Form code", "FM-LAB-014 rev 3");
  b.instV(f, "Textarea", "State=Filled, Size=md", { texts: { Label: "Statement", Value: "Samples were prepared and analysed in accordance with the methods listed. The results relate to the samples as received." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  b.instV(f, "Textarea", "State=Filled, Size=md", { texts: { Label: "Terms line", Value: "This certificate may not be reproduced except in full." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
  const pv = card(b, p, "Preview card"); sectionHead(b, pv, "Preview"); const cv = b.frame(pv, { name: "Canvas", w: 400, h: 840, fill: "Surface/muted", r: 12, layout: "h", main: "center", cross: "min", pad: [24, 24, 24, 24], sizeH: "fill", sizeV: "hug" }); docPage(b, cv, { draft: true, number: "CoA-JO-2026-0142-1" });
}
function settingsCard(b, p, title, rows) { const c = card(b, p, title + " card"); sectionHead(b, c, title); rows(c); return c; }
const footerBtns = (b, p) => { const r = hframe(b, p, "Footer", 8, { sizeH: "fill", main: "max" }); btn(b, r, "Ghost", "Restore defaults", null, { size: "md" }); btn(b, r, "Primary", "Save", null, { size: "md" }); };
function laboratory(b, p) {
  settingsCard(b, p, "Laboratory", (c) => { const r = hframe(b, c, "Logo", 16, { sizeH: "fill" }); const lg = b.instV(r, "Logo", "Type=Full, Color=Default"); b.raw("transform.scale", { ids: [lg], factor: 168 / 990 }); btn(b, r, "Secondary", "Replace logo", "upload-simple", { size: "md" }); tf(b, c, "Laboratory name", "PT Sentra Geo Survey Indonesia"); b.instV(c, "Textarea", "State=Filled, Size=md", { texts: { Label: "Address", Value: "Jl. Pangeran Antasari 12, Samarinda, Kalimantan Timur" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); const r2 = hframe(b, c, "Row", 12, { sizeH: "fill" }); tf(b, r2, "Accreditation number", "LP-1234-IDN"); tf(b, r2, "Place of issue", "Samarinda"); });
  settingsCard(b, p, "Numbering", (c) => { const r1 = hframe(b, c, "Row", 12, { sizeH: "fill" }); tf(b, r1, "Job order", "JO-YYYY-NNNN"); tf(b, r1, "Batch", "B-YYYY-NNNN"); const r2 = hframe(b, c, "Row", 12, { sizeH: "fill" }); tf(b, r2, "Lab code", "B{batch}-NN"); tf(b, r2, "CoA", "CoA-{job order}-{revision}"); txt(b, c, "New numbers follow the pattern; existing numbers never change.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); });
  footerBtns(b, p);
}
function security(b, p) {
  const pair = (c, a, av, bb, bv) => { const r = hframe(b, c, "Row", 12, { sizeH: "fill" }); tf(b, r, a, av); tf(b, r, bb, bv); };
  settingsCard(b, p, "Sign-in", (c) => pair(c, "Lock after failed attempts", "5", "Lock for (minutes)", "15"));
  settingsCard(b, p, "Session", (c) => pair(c, "Sign out after inactivity (minutes)", "30", "Warn before (seconds)", "60"));
  settingsCard(b, p, "Passwords", (c) => { tf(b, c, "Minimum length", "10", { w: 240 }); const l = vframe(b, c, "Rules", 8); [["A letter and a number", 1], ["Not the email", 1], ["A special character", 0]].forEach(([t, on]) => b.instV(l, "Checkbox", `Checked=${on ? "On" : "Off"}, State=Default`, { texts: { Label: t } })); });
  settingsCard(b, p, "Links", (c) => pair(c, "Reset link valid (minutes)", "60", "Invite valid (days)", "7"));
  footerBtns(b, p);
}
function formulas(b, p) {
  const c = card(b, p, "Formulas card"); sectionHead(b, c, "Formulas", 5); txt(b, c, "Formulas can't be edited in v1. A change comes as a new version with the release notes.", "Body small/Regular", "Text/text-secondary", "Note", { fill: true });
  table(b, c, [["Name", 0], ["Expression", 340], ["Version", 80], ["Used since", 120]], [["FC (ADB)", "100 − (IM + Ash + VM)", "v1", "1 Oct 2026"], ["ADB to DB", "X × 100 / (100 − IM)", "v1", "1 Oct 2026"], ["DB to DAF", "X × 100 / (100 − Ash DB)", "v1", "1 Oct 2026"], ["ADB to AR", "X × (100 − TM) / (100 − IM)", "v1", "1 Oct 2026"], ["TM from ADL and RM", "ADL + RM × (100 − ADL) / 100", "v1", "1 Oct 2026"]], (cell, h, r) => { const i = { Name: 0, Expression: 1, Version: 2, "Used since": 3 }[h]; txt(b, cell, r[i], i === 1 ? "Data" : i === 0 ? "Body small/SemiBold" : "Body small/Regular", i === 0 ? "Text/heading" : "Text/text-secondary", h); }, { h: 48 });
}

// ---------- build ----------
exports.build = (b) => {
  clearO(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "O  Admin: users, configuration, audit log"); });
  const d = Y.desktop, t = Y.tablet, p = Y.phone, DX = 1560, TX = 954, PX = 510, RY = 1800;
  let n = 0; const D = () => { const k = n++; return [DX * (k % 4), d + RY * Math.floor(k / 4)]; };
  // 13 Users
  usersList(b, ...D(), "desktop", "01", "Default"); usersList(b, ...D(), "desktop", "02", "Roles", { roles: true });
  userDetail(b, ...D(), "desktop", "01", "Default", "hendra"); userDetail(b, ...D(), "desktop", "02", "Locked", "bagus"); userDetail(b, ...D(), "desktop", "03", "Invited", "sari");
  userForm(b, ...D(), "01", "Add_user", "add"); userForm(b, ...D(), "02", "Edit_user", "edit"); userForm(b, ...D(), "03", "Deactivate_confirm", "deactivate"); userForm(b, ...D(), "04", "Last_superadmin", "last");
  // 15 Audit log
  audit(b, ...D(), "desktop", "01", "Default", "Supervisor", {}); audit(b, ...D(), "desktop", "02", "Row_expanded", "Supervisor", { expanded: true }); audit(b, ...D(), "desktop", "03", "Filtered_by_record", "Manager", { record: true, expanded: true });
  // 14 Configuration
  configFrame(b, ...D(), "desktop", "01", "Configuration_hub", "01", "Overview", null, (r) => hubOverview(b, r, "desktop"));
  configFrame(b, ...D(), "desktop", "01", "Configuration_hub", "02", "Search", null, (r) => hubSearch(b, r), { q: "ash" });
  configFrame(b, ...D(), "desktop", "02", "Parameters", "01", "List", "Parameters", (r) => parameters(b, r, "desktop"));
  { const s = configFrame(b, ...D(), "desktop", "02", "Parameters", "02", "Edit", "Parameters", (r) => parameters(b, r, "desktop")); dlg(b, s, "desktop", 1200, "md", "Edit parameter", "", "Cancel", "Save", (bd) => { const r1 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); tf(b, r1, "Name *", "Ash"); tf(b, r1, "Code", "Ash", { disabled: true }); const r2 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); sel(b, r2, "Unit", "%"); sel(b, r2, "Group", "Proximate"); const r3 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); sel(b, r3, "Measured basis", "ADB"); tf(b, r3, "Decimals", "2"); const r4 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); tf(b, r4, "Typical range, from", "0"); tf(b, r4, "to", "45"); txt(b, bd, "The typical range feeds rule V-31 (warn).", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); sw(b, bd, "Qualified values allowed (<0.01)", false); sw(b, bd, "Active", true); }); }
  configFrame(b, ...D(), "desktop", "03", "Services", "01", "List", "Services", (r) => services(b, r, "desktop"));
  { const s = configFrame(b, ...D(), "desktop", "03", "Services", "02", "Edit", "Services", (r) => services(b, r, "desktop")); dlg(b, s, "desktop", 1200, "lg", "Edit service", "", "Cancel", "Save as version 3", (bd) => { const r1 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); tf(b, r1, "Name *", "Coking coal"); tf(b, r1, "Turnaround target (days)", "12"); sel(b, r1, "Status", "Draft"); const G = [["Moisture", [["TM", 1], ["IM", 1], ["EQM", 0]]], ["Proximate", [["Ash", 1], ["VM", 1], ["FC", 1]]], ["Sulfur", [["TS", 1], ["Forms of sulfur", 0]]], ["Calorific", [["GCV", 1], ["NCV", 0]]], ["Coking coal", [["CSN", 1], ["Gieseler", 1], ["Gray King", 1], ["Dilatometer", 1], ["Sapozhnikov", 1], ["G – Index", 1], ["CRI/CSR", 1], ["Maceral", 1]]]]; const gl = vframe(b, bd, "Parameters", 10); txt(b, gl, "Parameters (16 selected)", "Caption/SemiBold", "Text/text-secondary", "Label"); G.forEach(([g, ps]) => { const r = hframe(b, gl, "Group", 8, { sizeH: "fill", wrap: true, cross: "center" }); const lw = b.frame(r, { name: "Group label", w: 100, h: 20, layout: "h", sizeH: "fixed", sizeV: "hug" }); txt(b, lw, g, "Caption/Medium", "Text/text-secondary", "Group"); ps.forEach(([pp, on]) => b.instV(r, "Parameter pill", `Kind=Parameter, State=${on ? "On" : "Off"}`, { texts: { Label: pp } })); }); sw(b, bd, "Default for new job orders", false); txt(b, bd, "Saving makes version 3. Job orders keep the version they used.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); }); }
  configFrame(b, ...D(), "desktop", "04", "Methods_and_standards", "01", "Matrix", "Methods and standards", (r) => methods(b, r));
  { const s = configFrame(b, ...D(), "desktop", "04", "Methods_and_standards", "02", "Edit", "Methods and standards", (r) => methods(b, r)); dlg(b, s, "desktop", 1200, "md", "New edition: Ash, ASTM", "", "Cancel", "Add edition", (bd) => { kv(b, bd, "Parameter", "Ash"); const r1 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); sel(b, r1, "Standard", "ASTM"); tf(b, r1, "Method", "D3174"); tf(b, r1, "Edition", "2023"); tf(b, bd, "Title", "Standard Test Method for Ash in the Analysis Sample of Coal and Coke from Coal"); const r2 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); tf(b, r2, "Repeatability r", "0.15"); tf(b, r2, "Reproducibility R", "0.30"); txt(b, bd, "The 2012 edition stays on results entered before.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); }); }
  configFrame(b, ...D(), "desktop", "05", "Validation_rules", "01", "List", "Validation rules", (r) => rules(b, r));
  { const s = configFrame(b, ...D(), "desktop", "05", "Validation_rules", "02", "Edit", "Validation rules", (r) => rules(b, r)); dlg(b, s, "desktop", 1200, "md", "Edit rule V-31: Ash (ADB)", "", "Cancel", "Save", (bd) => { const g = vframe(b, bd, "Severity", 6); txt(b, g, "Severity", "Caption/SemiBold", "Text/text-secondary", "Label"); b.instV(g, "Segmented control", "Items=2, Selected=1", { texts: { 0: "Warn", 1: "Block" } }); const r1 = hframe(b, bd, "Row", 12, { sizeH: "fill" }); tf(b, r1, "Lower bound (%)", "0"); tf(b, r1, "Upper bound (%)", "45"); b.instV(bd, "Textarea", "State=Filled, Size=md", { texts: { Label: "Message shown", Value: "Ash above 45 % is unusual for this lab. Check the value before you save." }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); sw(b, bd, "Active", true); }); }
  configFrame(b, ...D(), "desktop", "06", "Report_templates", "01", "List", "Report templates", (r) => templates(b, r));
  { const s = configFrame(b, ...D(), "desktop", "06", "Report_templates", "02", "New_version", "Report templates", (r) => templateVersion(b, r)); }
  configFrame(b, ...D(), "desktop", "07", "Lookups", "01", "List", "Lookups", (r) => lookups(b, r));
  { const s = configFrame(b, ...D(), "desktop", "07", "Lookups", "02", "Edit", "Lookups", (r) => lookups(b, r)); dlg(b, s, "desktop", 1018, "sm", "Edit condition", "", "Cancel", "Save", (bd) => { tf(b, bd, "Value *", "Wet"); tf(b, bd, "Order", "3"); sw(b, bd, "Needs a remark", true); sw(b, bd, "Active", true); }); }
  configFrame(b, ...D(), "desktop", "08", "Laboratory", "01", "Default", "Laboratory", (r) => laboratory(b, r));
  configFrame(b, ...D(), "desktop", "09", "Security", "01", "Default", "Security", (r) => security(b, r));
  configFrame(b, ...D(), "desktop", "10", "Formulas", "01", "View", "Formulas", (r) => formulas(b, r));
  // tablet
  usersList(b, 0, t, "tablet", "01", "Default"); userDetail(b, TX, t, "tablet", "01", "Default", "hendra"); audit(b, TX * 2, t, "tablet", "01", "Default", "Supervisor", {});
  configFrame(b, TX * 3, t, "tablet", "01", "Configuration_hub", "01", "Overview", null, (r) => hubOverview(b, r, "tablet"));
  configFrame(b, TX * 4, t, "tablet", "02", "Parameters", "01", "List", "Parameters", (r) => parameters(b, r, "tablet"));
  configFrame(b, TX * 5, t, "tablet", "03", "Services", "01", "List", "Services", (r) => services(b, r, "tablet"));
  // phone
  usersList(b, 0, p, "phone", "01", "Default"); userDetail(b, PX, p, "phone", "01", "Default", "hendra"); addUserPhone(b, PX * 2, p);
  audit(b, PX * 3, p, "phone", "01", "Default", "Supervisor", {});
  { const s = audit(b, PX * 4, p, "phone", "04", "Filters", "Supervisor", {}); const HP = 1100; overlay(b, s, "phone", HP); const v = b.v("Bottom sheet"); const id = b.instV(s.root, "Bottom sheet", undefined, { texts: { Title: "Filters" }, props: { absolute: true, x: 0, y: HP - 560, width: 390 } }); const bt = v.insts.filter((i) => i.name === "Button"); b.raw("node.set", { ids: [id + bt[0].pos + 3], props: { characters: "Clear all" } }); b.raw("node.set", { ids: [id + bt[1].pos + 3], props: { characters: "Apply" } }); b.raw("node.set", { ids: [id + v.names.Body], props: { sizingV: "hug", fill: "none", mainAlign: "min", gap: 14 } }); b.raw("node.set", { ids: [id], props: { sizingV: "hug" } }); [["Date", "Last 7 days"], ["User", "All users"], ["Record type", "All types"], ["Action", "All actions"]].forEach(([l, val]) => sel(b, id + v.names.Body, l, val, { touch: true })); }
  configFrame(b, PX * 5, p, "phone", "01", "Configuration_hub", "01", "Overview", null, (r) => hubOverview(b, r, "phone"));
  configFrame(b, PX * 6, p, "phone", "02", "Parameters", "01", "List", "Parameters", (r) => parameters(b, r, "phone"));
  b.oEnd = { desktop: d + RY * 8 + 400, tablet: t + 3000, phone: p + 3200 };
};
