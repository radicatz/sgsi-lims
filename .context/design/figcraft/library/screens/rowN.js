// Row N · App screens 04 to 10 (module 00): sign in, password, user menu, notifications, profile, session timeout.
// Plan: .context/docs/App/App_Screen_Plan.md. Run after row M: build-screens.js ...,L,M,N. Frames are created under their final names.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, card, scrimOver } = H;
const { U } = require("./rowL.js");
const { icon, txt, hframe, vframe, btn, iconBtn, cardTop, dialog, overlay, KIND, W } = U;
const { drawer } = require("./rowJ.js");

const N_NAMES = /^(Desktop|Tablet|Phone)-00-App-(0[4-9]|10)-/;
const isN = (n) => N_NAMES.test(n.name || "") || (n.name === "Row title" && /^N( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isN(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.mEnd ? b.mEnd[k] : 0); }
  return out;
}
const clearN = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isN(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const NAME = (kind, ss, screen, vv, variant) => `${KIND(kind)}-00-App-${ss}-${screen}-${vv}-${variant}`;
const VH = { desktop: 1018, tablet: 1194, phone: 844 };
const tf = (b, p, label, value, kind, o = {}) => b.instV(p, "Text field", `State=${value ? "Filled" : "Default"}, Size=${kind === "phone" ? "touch" : "md"}`, { texts: { Label: label, Value: value || o.ph || "" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } });
const pw = (b, p, label, kind, st = "Default", helper) => b.instV(p, "Password field", `State=${st}, Size=${kind === "phone" ? "touch" : "md"}`, { texts: { Label: label, ...(helper ? { Helper: helper } : {}) }, setProps: { "Show helper": !!helper, Value: st === "Filled" || st === "Error" ? "••••••••••" : "Enter your password" }, props: { sizingH: "fill" } });
const alert = (b, p, tone, title, text, action) => b.instV(p, "Inline alert", `Tone=${tone}`, { texts: { 0: title, 1: text, ...(action ? { 2: action } : {}) }, hide: action ? [] : ["Action"], props: { sizingH: "fill" } });
const link = (b, p, label) => b.instV(p, "Link button", "State=Default", { texts: { Label: label }, hide: ["Icon"] });
const check = (b, p, label, st) => b.instV(p, "Checklist item", `State=${st}`, { texts: { Label: label } });
const role = (b, p, label) => b.instV(p, "Role badge", "Property 1=Default", { texts: { Label: label } });
// filter tabs (owner, Nov 6, 2026): the page Tabs of the Dashboard (Tab instances, count pill), not a Segmented control
const tabs = (b, p, items, on, o = {}) => { const r = b.frame(p, { name: "Tabs", w: 360, h: 34, layout: "h", gap: 16, cross: "max", sizeH: "fill", sizeV: "hug", pad: o.pad }); items.forEach(([l, n], i) => b.instV(r, "Tab", `Selected=${i + 1 === on ? "On" : "Off"}, State=Default`, n ? { texts: { 0: l, 1: String(n) } } : { texts: { 0: l }, hide: ["Count"] })); return r; };
const seg = (b, p, labels, on) => b.instV(p, "Segmented control", `Items=${labels.length}, Selected=${on}`, { texts: Object.fromEntries(labels.map((l, i) => [i, l])) });
const bigBtn = (b, p, type, label, o = {}) => b.instV(p, "Button", `Type=${type}, Tone=Default, Size=${o.size || "lg"}, State=${o.disabled ? "Disabled" : "Default"}`, { texts: { Label: label }, setProps: { "Leading icon": false }, props: o.fill === false ? undefined : { sizingH: "fill" } });

// the logo scales with its vectors (transform.scale), so it keeps its shape
const logo = (b, p, variant, w) => { const id = b.instV(p, "Logo", variant); const native = /Full/.test(variant) ? 990 : 349; b.raw("transform.scale", { ids: [id], factor: w / native }); return id; };
// ---------- auth pages (no app shell) ----------
function authPage(b, x, y, kind, name) {
  page(b, kind);
  const w = W[kind], h = VH[kind];
  if (kind === "desktop") {
    const root = b.frame(undefined, { name, x, y, w, h, fill: "Surface/shell", layout: "h", sizeH: "fixed", sizeV: "fixed", clip: true });
    const bp = b.frame(root, { name: "Brand panel", w: 720, h, fill: "Primary/primary-deep", layout: "v", main: "spaceBetween", pad: [56, 64, 56, 64], sizeH: "fixed", sizeV: "fill", clip: true });
    logo(b, bp, "Type=Full, Color=White", 224);
    const mid = vframe(b, bp, "Tagline", 12); txt(b, mid, "Laboratory information system for coal analysis", "Display/XL", "Text/text-inverse", "Tagline", { fill: true }); txt(b, mid, "Job orders, batches, results and certificates in one place.", "Body/Regular", "Text/text-inverse", "Text", { fill: true });
    txt(b, bp, "PT Sentra Geo Survey Indonesia", "Body small/Regular", "Text/text-inverse", "Company");
    const mark = logo(b, bp, "Type=Icon, Color=White", 520); b.raw("node.set", { ids: [mark], props: { absolute: true, x: 330, y: 470, opacity: 0.08 } });
    const side = b.frame(root, { name: "Form side", w: 720, h, layout: "v", main: "center", cross: "center", gap: 20, sizeH: "fill", sizeV: "fill" });
    return { root, host: side };
  }
  if (kind === "tablet") {
    const root = b.frame(undefined, { name, x, y, w, h, fill: "Primary/primary-deep", layout: "v", main: "center", cross: "center", gap: 32, sizeH: "fixed", sizeV: "fixed", clip: true });
    logo(b, root, "Type=Full, Color=White", 196);
    return { root, host: root, inverse: true };
  }
  const root = b.frame(undefined, { name, x, y, w, h, fill: "Surface/shell", layout: "v", cross: "center", gap: 24, pad: [48, 16, 24, 16], sizeH: "fixed", sizeV: "hug" });
  logo(b, root, "Type=Full, Color=Default", 168);
  return { root, host: root };
}
function authCard(b, host, kind, title, sub) {
  const c = b.frame(host, { name: "Card", w: kind === "phone" ? 358 : kind === "tablet" ? 440 : 400, h: 400, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 20, pad: kind === "phone" ? [24, 20, 24, 20] : [32, 32, 32, 32], sizeH: kind === "phone" ? "fill" : "fixed", sizeV: "hug" });
  const t = vframe(b, c, "Title block", 6); txt(b, t, title, "Heading/H1", "Text/heading", "Title", { fill: true }); if (sub) txt(b, t, sub, "Body small/Regular", "Text/text-secondary", "Text", { fill: true });
  return c;
}
function authFooter(b, host, inverse) { const f = hframe(b, host, "Footer", 16); txt(b, f, "Version 1.0", "Caption/Regular", inverse ? "Text/text-inverse" : "Text/text-muted", "Version"); txt(b, f, "Privacy", "Caption/Medium", inverse ? "Text/text-inverse" : "Primary/primary", "Privacy"); }

function signIn(b, x, y, kind, vv, variant, st) {
  const { root, host, inverse } = authPage(b, x, y, kind, NAME(kind, "04", "Sign_in", vv, variant));
  const c = authCard(b, host, kind, "Sign in", "Coal analysis, from job order to certificate.");
  if (st === "wrong") alert(b, c, "Error", "The email or password is not correct.", "Check both and try again.");
  if (st === "locked") alert(b, c, "Warning", "Too many failed attempts", "Try again at 10:42, or reset your password.", "Reset password");
  if (st === "out") alert(b, c, "Info", "You were signed out", "30 minutes without activity. Sign in to continue.");
  tf(b, c, "Email", st ? "maya@sgsi.co.id" : "", kind, { ph: "name@sgsi.co.id" });
  pw(b, c, "Password", kind, st === "locked" ? "Disabled" : "Default");
  const r = hframe(b, c, "Forgot", 0, { sizeH: "fill", main: "max" }); link(b, r, "Forgot password?");
  bigBtn(b, c, "Primary", "Sign in", { size: kind === "phone" ? "touch" : "lg", disabled: st === "locked" });
  authFooter(b, host, inverse);
}
function forgot(b, x, y, kind, vv, variant, sent) {
  const { root, host, inverse } = authPage(b, x, y, kind, NAME(kind, "05", "Forgot_password", vv, variant));
  if (!sent) { const c = authCard(b, host, kind, "Reset your password", "Enter the email you sign in with. We send a link to set a new password."); tf(b, c, "Email", "maya@sgsi.co.id", kind); bigBtn(b, c, "Primary", "Send reset link", { size: kind === "phone" ? "touch" : "lg" }); bigBtn(b, c, "Ghost", "Back to sign in", { size: kind === "phone" ? "touch" : "lg" }); }
  else { const c = authCard(b, host, kind, "Check your email", "If an account uses maya@sgsi.co.id, a link is on its way. It works for 60 minutes."); const w = hframe(b, c, "Icon", 0, { sizeH: "fill", main: "center" }); const ic = b.frame(w, { name: "Icon wrap", w: 56, h: 56, r: 999, fill: "Primary/primary-50", layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); icon(b, ic, "envelope-simple", "Action/brand-text", 20); bigBtn(b, c, "Secondary", "Resend link in 0:42", { size: kind === "phone" ? "touch" : "lg", disabled: true }); bigBtn(b, c, "Ghost", "Back to sign in", { size: kind === "phone" ? "touch" : "lg" }); }
  authFooter(b, host, inverse);
}
function setPassword(b, x, y, kind, vv, variant, mode) {
  const { root, host, inverse } = authPage(b, x, y, kind, NAME(kind, "06", "Set_password", vv, variant));
  if (mode === "expired") { const c = authCard(b, host, kind, "This link has expired", "Reset links work for 60 minutes. Ask for a new one and use it soon after."); bigBtn(b, c, "Primary", "Send a new link"); bigBtn(b, c, "Ghost", "Back to sign in"); authFooter(b, host, inverse); return; }
  const inv = mode === "invite";
  const c = authCard(b, host, kind, inv ? "Welcome to SGSI LIMS" : "Set a new password", inv ? "Wahyu Pratama added you to the lab. Set a password to sign in." : "For maya@sgsi.co.id");
  if (inv) { const r = hframe(b, c, "Account", 8, { sizeH: "fill", wrap: true }); txt(b, r, "hendra@sgsi.co.id", "Body small/SemiBold", "Text/heading", "Email"); role(b, r, "Supervisor"); }
  pw(b, c, "New password", kind, "Filled"); pw(b, c, "Confirm password", kind, inv ? "Filled" : "Default");
  const l = vframe(b, c, "Rules", 6); check(b, l, "At least 10 characters", "Done"); check(b, l, "A letter and a number", "Done"); check(b, l, "Not your email", inv ? "Done" : "Pending");
  bigBtn(b, c, "Primary", inv ? "Set password and sign in" : "Set password", { size: kind === "phone" ? "touch" : "lg" });
  authFooter(b, host, inverse);
}

// ---------- app pages ----------
const PERSONS = { Lab: ["Maya Lestari", "maya@sgsi.co.id", "ML", "Lab Admin"], CSO: ["Rina Kartika", "rina@sgsi.co.id", "RK", "CSO"], Analyst: ["Fitri Handayani", "fitri@sgsi.co.id", "FH", "Analyst"] };
function shellFrame(b, x, y, kind, name, role, active = "Dashboard", unread = 0) {
  page(b, kind);
  const s = b.shell({ name, x, y, kind, active, role });
  if (unread) { const v = b.v("Top bar", `Breakpoint=${kind === "phone" ? "Mobile" : kind === "tablet" ? "Tablet" : "Desktop"}`); const tb = s.root + 1; b.raw("node.set", { ids: [tb + v.names.Unread], props: { visible: true } }); b.raw("node.set", { ids: [tb + v.names.Unread + 1], props: { characters: String(unread) } }); }
  return s;
}
function dashBase(b, s, kind) {
  const m = s.main; const t = vframe(b, m, "Title block", 4, { sizeH: "hug" }); txt(b, t, "THURSDAY 5 NOVEMBER 2026", "Overline", "Text/text-muted", "Overline"); txt(b, t, "Dashboard", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  const row = b.frame(m, { name: "KPI strip", w: 400, h: 120, layout: "h", gap: 16, wrap: kind !== "desktop", sizeH: "fill", sizeV: "hug" });
  [["Batches in progress", "23", "4 completed"], ["Due this week", "9", "2 past due"], ["Samples received", "1,284", "Last 30 days"], ["Mean turnaround", "4.6 d", "Target 5 d"]].forEach(([l, n, c]) => b.instV(row, "Card KPI", "Kind=Delta", { texts: { 0: l, 1: n, Caption: c }, hide: ["Delta"], props: kind === "tablet" ? { width: 341, sizingH: "fixed" } : { sizingH: "fill" } }));
  const c = card(b, m, "Active batches card"); cardTop(b, c, "Active batches");
  ["B-2026-0417", "B-2026-0415", "B-2026-0418", "B-2026-0422"].forEach((n) => { const r = hframe(b, c, "Row", 12, { sizeH: "fill", pad: [8, 0, 8, 0] }); txt(b, r, n, "Data/Strong", "Text/heading", "Number"); txt(b, r, "PT Bara Nusantara Mandiri", "Body small/Regular", "Text/text-secondary", "Company"); });
}
const fix = (b, s, h) => b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: h } });
function panelFrame(b, root, nm, x, y, w) { const p = b.frame(root, { name: nm, w, h: 300, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", gap: 0, pad: [8, 0, 8, 0], sizeH: "fixed", sizeV: "hug", absolute: true, x, y, clip: true }); b.raw("style.apply", { ids: [p], style: "Elevation/md" }); return p; }
const divider = (b, p) => b.frame(p, { name: "Divider", w: 300, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });

// 07 user menu
function userMenu(b, x, y) {
  const s = shellFrame(b, x, y, "desktop", NAME("desktop", "07", "User_menu", "01", "Open"), "Lab"); dashBase(b, s, "desktop"); fix(b, s, VH.desktop);
  const p = panelFrame(b, s.root, "User menu", 1136, 64, 280); b.raw("node.set", { ids: [p], props: { padding: [8, 8, 8, 8], gap: 4 } });
  const r = hframe(b, p, "Person", 12, { sizeH: "fill", pad: [8, 8, 8, 8], cross: "min" }); b.instV(r, "Avatar", "Size=40", { texts: { Initials: "ML" } });
  const t = vframe(b, r, "Text", 4); txt(b, t, "Maya Lestari", "Body small/SemiBold", "Text/heading", "Name"); txt(b, t, "maya@sgsi.co.id", "Caption/Regular", "Text/text-secondary", "Email"); const rb = hframe(b, t, "Roles", 6, { wrap: true }); role(b, rb, "Lab Admin");
  divider(b, p);
  [["Profile", "user"], ["Notification settings", "bell"]].forEach(([l, g]) => b.instV(p, "Menu item", "State=Default", { texts: { Label: l }, setProps: { Icon: true }, swaps: [[0, "Icon", `Glyph=${g}, Size=14`]], props: { sizingH: "fill" } }));
  divider(b, p);
  b.instV(p, "Menu item", "State=Default", { texts: { Label: "Sign out" }, setProps: { Icon: true }, swaps: [[0, "Icon", "Glyph=sign-out, Size=14"]], props: { sizingH: "fill" } });
}

// 08 notifications
const NOTE = {
  lab: [["Unread", "flask", "B-2026-0417 analysis is finished", "Upload the signed RoA to complete the batch.", "10 min ago"], ["Unread", "certificate", "All batches of JO-2026-0131 are completed", "Generate the CoA.", "1 h ago"], ["Unread", "alarm", "B-2026-0422 is due within 24 h", "It is still in reception.", "3 h ago"], ["Read", "package", "B-2026-0418 is ready to receive", "Created by Rina Kartika for JO-2026-0139.", "Yesterday, 16:20"], ["Read", "flask", "B-2026-0416 analysis is finished", "Upload the signed RoA to complete the batch.", "4 Nov 2026, 15:02"], ["Read", "package", "B-2026-0415 is ready to receive", "Created by Rina Kartika for JO-2026-0135.", "3 Nov 2026, 09:40"]],
  cso: { Today: [["Unread", "paper-plane-tilt", "CoA-JO-2026-0131-2 is published", "Send it to PT Bara Nusantara Mandiri.", "9:12"], ["Unread", "warning-circle", "2 samples of JO-2026-0137 did not arrive", "Add them to a new batch when they come, or mark them not received.", "8:30"]], Yesterday: [["Read", "paper-plane-tilt", "CoA-JO-2026-0142-1 is published", "Send it to PT Bukit Asam Tbk.", "16:05"], ["Read", "alarm", "B-2026-0421 is due within 24 h", "It is in preparation.", "11:20"]], Earlier: [["Read", "paper-plane-tilt", "CoA-JO-2026-0141-1 is published", "Send it to PT Kaltara Energi Prima.", "24 Oct 2026, 14:10"], ["Read", "warning-circle", "1 sample of JO-2026-0133 did not arrive", "Add it to a new batch when it comes, or mark it not received.", "22 Oct 2026, 10:02"]] },
};
const item = (b, p, [st, g, t, x, tm]) => b.instV(p, "Notification item", `State=${st}`, { texts: { 0: t, 1: x, 2: tm }, swaps: [[0, "Icon", `Glyph=${g}, Size=14`]], props: { sizingH: "fill" } });
function notifPanel(b, x, y, kind, vv, variant, unreadOnly) {
  const s = shellFrame(b, x, y, kind, NAME(kind, "08", "Notifications", vv, variant), "Lab", "Dashboard", 3); dashBase(b, s, kind); fix(b, s, VH[kind]);
  const pw_ = 400, px = kind === "desktop" ? 882 : 304; // right edge under the bell
  const p = panelFrame(b, s.root, "Notifications panel", px, 64, pw_);
  const hd = hframe(b, p, "Header", 8, { sizeH: "fill", main: "spaceBetween", pad: [8, 16, 8, 16] }); txt(b, hd, "Notifications", "Heading/H3", "Text/heading", "Title"); link(b, hd, "Mark all read");
  tabs(b, p, [["All"], ["Unread", 3]], unreadOnly ? 2 : 1, { pad: [0, 16, 0, 16] });
  const list = vframe(b, p, "List", 0); (unreadOnly ? NOTE.lab.slice(0, 3) : NOTE.lab).forEach((n, i) => { if (i) divider(b, list); item(b, list, n); });
  divider(b, p); const ft = hframe(b, p, "Footer", 0, { sizeH: "fill", main: "center", pad: [10, 16, 4, 16] }); link(b, ft, "See all notifications");
}
function notifPage(b, x, y, kind, vv, variant, role, empty) {
  const s = shellFrame(b, x, y, kind, NAME(kind, "08", "Notifications", vv, variant), role, "none", empty ? 0 : 2);
  const m = s.main;
  const hd = hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "max", wrap: kind === "phone" });
  const t = vframe(b, hd, "Title block", 4, { sizeH: kind === "phone" ? "fill" : "hug" }); txt(b, t, "NOTIFICATIONS", "Overline", "Text/text-muted", "Overline"); txt(b, t, "Notifications", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title");
  if (!empty) b.instV(hd, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", { texts: { Label: "Mark all read" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("check") } });
  tabs(b, m, [["All"], ["Unread", empty ? 0 : 2]], 1);
  if (empty) { b.instV(m, "Empty state", "Size=Page", { texts: { Title: "You're all caught up", Text: "New hand-offs to your queues appear here." }, hide: ["Button"], swaps: [[0, "Icon", "Glyph=bell, Size=20"]], props: { sizingH: "fill" } }); return s; }
  for (const [g, rows] of Object.entries(NOTE.cso)) { const c = card(b, m, g + " card"); cardTop(b, c, g); const l = vframe(b, c, "List", 0); rows.forEach((n, i) => { if (i) divider(b, l); item(b, l, n); }); b.raw("node.set", { ids: [c], props: { padding: [16, 0, 8, 0] } }); }
  btn(b, m, "Ghost", "Load more", null, { size: "md" });
  return s;
}

// 09 profile
function profile(b, x, y, kind, vv, variant, o = {}) {
  const s = shellFrame(b, x, y, kind, NAME(kind, "09", "Profile", vv, variant), "Lab", "none");
  const m = s.main;
  if (kind === "phone" && o.change) { // full-screen change password form
    b.instV(m, "Breadcrumb", "Levels=2", { texts: { 0: "Profile", 1: "Change password" } });
    txt(b, m, "Change password", "Heading/H1", "Text/heading", "Title");
    const c = card(b, m, "Form card"); pw(b, c, "Current password", kind, "Filled"); pw(b, c, "New password", kind, "Filled"); pw(b, c, "Confirm new password", kind, "Filled"); const l = vframe(b, c, "Rules", 6); ["At least 10 characters", "A letter and a number", "Not your email"].forEach((r) => check(b, l, r, "Done"));
    const bar = b.instV(s.root, "Sticky action bar", "Breakpoint=Mobile", { texts: { Note: "" }, props: { sizingH: "fill" } }); const v = b.v("Sticky action bar", "Breakpoint=Mobile"); b.raw("node.set", { ids: [bar + v.texts[1].pos], props: { characters: "Cancel" } }); b.raw("node.set", { ids: [bar + v.texts[2].pos], props: { characters: "Change password" } }); b.raw("node.set", { ids: [bar + v.names.Note], props: { visible: false } });
    return s;
  }
  const hd = kind === "phone" ? vframe(b, m, "Header", 16) : hframe(b, m, "Header", 16, { sizeH: "fill", main: "spaceBetween", cross: "center" });
  const idt = hframe(b, hd, "Identity", 16, { sizeH: kind === "phone" ? "fill" : "hug" });
  const av = b.frame(idt, { name: "Avatar", w: 64, h: 64, fill: "Accent/accent-100", r: 999, layout: "h", main: "center", cross: "center", sizeH: "fixed", sizeV: "fixed" }); txt(b, av, "ML", "Heading/H2", "Accent/accent-text", "Initials");
  const t = vframe(b, idt, "Text", 6, { sizeH: kind === "phone" ? "fill" : "hug" }); const tr = hframe(b, t, "Name row", 12, { wrap: true }); txt(b, tr, "Maya Lestari", kind === "phone" ? "Heading/H1" : "Display/XL", "Text/heading", "Title"); role(b, tr, "Lab Admin"); txt(b, t, "maya@sgsi.co.id", "Body small/Regular", "Text/text-secondary", "Email");
  b.instV(hd, "Button", `Type=Secondary, Tone=Default, Size=${kind === "phone" ? "touch" : "lg"}, State=Default`, { texts: { Label: "Sign out" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("sign-out") }, props: kind === "phone" ? { sizingH: "fill" } : undefined });
  const personal = (p) => { const c = card(b, p, "Personal card"); cardTop(b, c, "Personal"); tf(b, c, "Name", "Maya Lestari", kind); const kv = b.v("Key-value row", "Layout=Inline"); const e = b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: "Email", Value: "maya@sgsi.co.id" }, props: { sizingH: "fill" } }); txt(b, c, "Only a Superadmin can change the email.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); b.instV(c, "Button", "Type=Primary, Tone=Default, Size=md, State=Disabled", { texts: { Label: "Save" }, setProps: { "Leading icon": false } }); return c; };
  const password = (p) => { const c = card(b, p, "Password card"); cardTop(b, c, "Password"); txt(b, c, "Last changed 12 Oct 2026", "Body small/Regular", "Text/text-secondary", "Changed"); b.instV(c, "Button", "Type=Secondary, Tone=Default, Size=md, State=Default", { texts: { Label: "Change password" }, setProps: { "Leading icon": true, "Leading glyph": b.iconId("lock-simple") } }); return c; };
  const prefs = (p) => { const c = card(b, p, "Preferences card"); cardTop(b, c, "Preferences"); const g = vframe(b, c, "Sidebar", 6); txt(b, g, "Sidebar", "Caption/Medium", "Text/text-secondary", "Label"); seg(b, g, ["Expanded", "Collapsed"], 1); const lg = b.instV(c, "Key-value row", "Layout=Inline", { texts: { Key: "Language", Value: "English" }, props: { sizingH: "fill" } }); txt(b, c, "Indonesian terms are kept for RoA and CoA.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); b.instV(c, "Select", "State=Filled, Size=md", { texts: { Label: "Start page", Value: "My work" }, setProps: { "Show helper": false }, props: { sizingH: "fill" } }); return c; };
  const notes = (p) => { const c = card(b, p, "Notifications card"); cardTop(b, c, "Notifications"); ["Batch ready to receive", "Analysis finished, RoA to upload", "Job order ready for its CoA", "Batch due within 24 h"].forEach((l) => b.instV(c, "Switch", "On=On, State=Default", { texts: { Label: l } })); txt(b, c, "Notifications are in the app only.", "Caption/Regular", "Text/text-muted", "Note", { fill: true }); return c; };
  if (kind === "desktop") { const cols = b.frame(m, { name: "Columns", w: 1128, h: 600, layout: "h", gap: 20, cross: "min", sizeH: "fill", sizeV: "hug" }); const l = vframe(b, cols, "Left column", 20); const r = vframe(b, cols, "Right column", 20); personal(l); password(l); prefs(r); notes(r); }
  else { personal(m); password(m); prefs(m); notes(m); }
  if (o.change || o.error) {
    dialog(b, s, "desktop", 1018, "md", "Change password", "Use at least 10 characters with a letter and a number.", "Cancel", "Change password", (bd) => {
      pw(b, bd, "Current password", "desktop", o.error ? "Error" : "Filled", o.error ? "The current password is not correct." : null); pw(b, bd, "New password", "desktop", "Filled"); pw(b, bd, "Confirm new password", "desktop", "Filled");
      const l = vframe(b, bd, "Rules", 6); check(b, l, "At least 10 characters", "Done"); check(b, l, "A letter and a number", o.error ? "Warning" : "Done"); check(b, l, "Not your email", "Done");
    });
  }
  return s;
}

// 10 session timeout
function timeout(b, x, y) {
  const s = shellFrame(b, x, y, "desktop", NAME("desktop", "10", "Session_timeout", "01", "Warning"), "Lab", "My work");
  const m = s.main; const t = vframe(b, m, "Title block", 4, { sizeH: "hug" }); txt(b, t, "WORK", "Overline", "Text/text-muted", "Overline"); txt(b, t, "My work", "Display/XL", "Text/heading", "Title");
  const row = b.frame(m, { name: "Queues", w: 400, h: 120, layout: "h", gap: 16, sizeH: "fill", sizeV: "hug" });
  [["Batches to receive", "2"], ["Signed RoA to upload", "1"], ["CoAs to generate", "1"]].forEach(([l, n]) => { const c = card(b, row, "Queue card"); b.raw("node.set", { ids: [c], props: { sizingH: "fill" } }); txt(b, c, l, "Body small/Medium", "Text/text-secondary", "Queue"); txt(b, c, n, "Display/XL", "Text/heading", "Count"); });
  dialog(b, s, "desktop", 1018, "sm", "Still there?", "You will be signed out in 42 seconds to keep the lab's data safe.", "Sign out", "Stay signed in");
}

// ---------- build ----------
exports.build = (b) => {
  clearN(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "N  App: sign in, notifications, profile"); });
  const d = Y.desktop, t = Y.tablet, p = Y.phone, DX = 1560, TX = 954, PX = 510, RY = 1500;
  const D = (n) => [DX * (n % 4), d + RY * Math.floor(n / 4)];
  // 04 to 06: sign in and passwords
  signIn(b, ...D(0), "desktop", "01", "Default"); signIn(b, ...D(1), "desktop", "02", "Wrong_credentials", "wrong"); signIn(b, ...D(2), "desktop", "03", "Locked", "locked"); signIn(b, ...D(3), "desktop", "04", "Signed_out", "out");
  forgot(b, ...D(4), "desktop", "01", "Email", false); forgot(b, ...D(5), "desktop", "02", "Link_sent", true);
  setPassword(b, ...D(6), "desktop", "01", "Reset", "reset"); setPassword(b, ...D(7), "desktop", "02", "Invite", "invite"); setPassword(b, ...D(8), "desktop", "03", "Link_expired", "expired");
  // 07 to 10
  userMenu(b, ...D(9));
  notifPanel(b, ...D(10), "desktop", "01", "Panel", false); notifPanel(b, ...D(11), "desktop", "02", "Panel_unread", true);
  notifPage(b, ...D(12), "desktop", "03", "Page", "CSO"); notifPage(b, ...D(13), "desktop", "04", "Empty", "Analyst", true);
  profile(b, ...D(14), "desktop", "01", "Default"); profile(b, ...D(15), "desktop", "02", "Change_password", { change: true }); profile(b, ...D(16), "desktop", "03", "Password_error", { error: true });
  timeout(b, ...D(17));
  // tablet
  signIn(b, 0, t, "tablet", "01", "Default"); notifPanel(b, TX, t, "tablet", "01", "Panel", false); profile(b, TX * 2, t, "tablet", "01", "Default");
  // phone
  signIn(b, 0, p, "phone", "01", "Default"); signIn(b, PX, p, "phone", "02", "Wrong_credentials", "wrong");
  forgot(b, PX * 2, p, "phone", "01", "Email", false); forgot(b, PX * 3, p, "phone", "02", "Link_sent", true);
  setPassword(b, PX * 4, p, "phone", "01", "Reset", "reset");
  drawer(b, PX * 5, p, "Lab", "", "", NAME("phone", "07", "User_menu", "02", "Drawer"));
  notifPage(b, PX * 6, p, "phone", "03", "Page", "CSO");
  profile(b, PX * 7, p, "phone", "01", "Default"); profile(b, PX * 8, p, "phone", "02", "Change_password", { change: true });
  b.nEnd = { desktop: d + RY * 5 + 400, tablet: t + 2400, phone: p + 2000 };
};
