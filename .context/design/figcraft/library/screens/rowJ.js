// Row J · App (module 00: screens outside the sidebar). Plan: .context/docs/Navigation/Navigation_Screen_Plan.md (section 5).
// 01 Sidebar_by_role (board of every role's sidebar), 02 Menu_drawer (phone), 03 No_access.
const { B, LIGHT } = require("../dsl.js");
require("./shell.js");
const { H } = require("./rowC.js");
const { TITLE, page, scrimOver } = H;

const J_NAMES = /^(Desktop|Tablet|Phone)-00-App-0[1-3]-/; // screens 04 to 10 are row N
const isJ = (n) => J_NAMES.test(n.name || "") || (n.name === "Row title" && /^J( ·|  )/.test(n.characters || ""));
const REFS = / ref$|reference$| edit( dark)?$|^Properties ref$|^Select reference$/;
function bottoms(b) {
  const N = b.reg.N, out = {};
  for (const [k, pid] of Object.entries(b.pageIds)) { let m = 0; for (const id of N[pid].children || []) { const n = N[id]; if (isJ(n) || REFS.test(n.name || "")) continue; m = Math.max(m, (n.transform ? n.transform[5] : 0) + (n.height || 0)); } out[k] = Math.max(Math.ceil((m + 400) / 100) * 100, b.iEnd ? b.iEnd[k] : 0); }
  return out;
}
const clearJ = (b) => { const N = b.reg.N, old = []; for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) if (isJ(N[id])) old.push(id); if (old.length) b.raw("edit.delete", { ids: old }); };
const txt = (b, parent, t, style, color, name) => b.text(parent, t, { style, color, name: name || t });
const KIND = (k) => (k === "desktop" ? "Desktop" : k === "tablet" ? "Tablet" : "Phone");
const ROLES = [["Lab", "Lab admin", "Maya Lestari"], ["CSO", "CSO", "Rina Kartika"], ["Prep", "Preparation", "Dedi Kurniawan"], ["Analyst", "Analyst", "Fitri Handayani"], ["Supervisor", "Supervisor", "Hendra Wijaya"], ["Manager", "Manager", "Bambang Sutrisno"], ["Superadmin", "Superadmin", "Wahyu Pratama"]];

function board(b, x, y, kind) {
  page(b, kind);
  const col = kind === "tablet" ? "Yes" : "No", W = kind === "tablet" ? 834 : 1440, name = `${KIND(kind)}-00-App-01-Sidebar_by_role-${kind === "tablet" ? "02-Collapsed" : "01-Expanded"}`;
  const root = b.frame(undefined, { name, x, y, w: W, h: 900, fill: "Surface/shell", layout: "v", gap: 20, pad: [32, 32, 40, 32], sizeH: "fixed", sizeV: "hug", clip: true });
  txt(b, root, "Sidebar by role", "Display/XL", "Text/heading", "Title");
  txt(b, root, kind === "tablet" ? "Collapsed rail, tablet" : "Expanded sidebar, desktop", "Body/Regular", "Text/text-secondary", "Description");
  const row = b.frame(root, { name: "Sidebars", w: W - 64, h: 700, layout: "h", gap: 24, wrap: true, cross: "min", sizeH: "fill", sizeV: "hug" });
  const v = b.v("Sidebar", `Collapsed=${col}`);
  ROLES.forEach(([key, role, person]) => {
    const c = b.frame(row, { name: role, w: col === "No" ? 248 : 88, h: 700, layout: "v", gap: 8, sizeH: "hug", sizeV: "hug" });
    txt(b, c, role, "Body small/SemiBold", "Text/heading", "Role");
    if (col === "No") txt(b, c, person, "Caption/Regular", "Text/text-muted", "Persona");
    const id = b.instV(c, "Sidebar", `Collapsed=${col}`, { props: { sizingV: "fixed", height: col === "No" ? 780 : 640 } });
    b.hideNav(id, v, key, col);
  });
}
function drawer(b, x, y, key, variant, vv, nameOverride) {
  page(b, "phone");
  const name = nameOverride || `Phone-00-App-02-Menu_drawer-${vv}-${variant}`;
  const s = b.shell({ name, x, y, kind: "phone", active: "Dashboard", role: key });
  txt(b, s.main, "Dashboard", "Heading/H1", "Text/heading", "Title");
  const H0 = 844;
  b.raw("node.set", { ids: [s.root], props: { sizingV: "fixed", height: H0 } });
  scrimOver(b, s.root, 390, H0);
  const v = b.v("Sidebar", "Collapsed=No");
  const id = b.instV(s.root, "Sidebar", "Collapsed=No", { props: { absolute: true, x: 0, y: 0, width: 300, sizingV: "fixed", height: H0 } });
  b.hideNav(id, v, key, "No");
  profileBlock(b, s.root, H0, key);
}
// App plan section 4: the profile block at the bottom of the phone menu drawer
const PEOPLE = { Lab: ["Maya Lestari", "maya@sgsi.co.id", "ML", "Lab Admin"], CSO: ["Rina Kartika", "rina@sgsi.co.id", "RK", "CSO"] };
function profileBlock(b, root, H0, key) {
  const [nm, em, ini, role] = PEOPLE[key] || PEOPLE.Lab;
  const p = b.frame(root, { name: "Profile block", w: 300, h: 160, fill: "Surface/card", layout: "v", gap: 4, pad: [12, 16, 16, 16], sizeH: "fixed", sizeV: "hug", absolute: true, x: 0, y: H0 - 176 });
  b.frame(p, { name: "Divider", w: 268, h: 1, fill: "Surface/divider", sizeH: "fill", sizeV: "fixed" });
  const r = b.frame(p, { name: "Person", w: 268, h: 56, layout: "h", gap: 12, cross: "center", pad: [8, 0, 8, 0], sizeH: "fill", sizeV: "hug" });
  b.instV(r, "Avatar", "Size=40", { texts: { Initials: ini } });
  const t = b.frame(r, { name: "Text", w: 200, h: 40, layout: "v", gap: 2, sizeH: "fill", sizeV: "hug" }); txt(b, t, nm, "Body small/SemiBold", "Text/heading", "Name"); txt(b, t, em, "Caption/Regular", "Text/text-secondary", "Email"); b.instV(t, "Role badge", "Property 1=Default", { texts: { Label: role } });
  b.instV(p, "Menu item", "State=Default", { texts: { Label: "Profile" }, setProps: { Icon: true }, swaps: [[0, "Icon", "Glyph=user, Size=14"]], props: { sizingH: "fill" } });
  b.instV(p, "Menu item", "State=Default", { texts: { Label: "Sign out" }, setProps: { Icon: true }, swaps: [[0, "Icon", "Glyph=sign-out, Size=14"]], props: { sizingH: "fill" } });
  return p;
}
exports.profileBlock = profileBlock;
exports.drawer = drawer;
function noAccess(b, x, y, kind) {
  page(b, kind);
  const name = `${KIND(kind)}-00-App-03-No_access-01-Default`;
  const s = b.shell({ name, x, y, kind, active: "none", role: "CSO" });
  const w = kind === "phone" ? 358 : kind === "tablet" ? 698 : 1128;
  const c = b.frame(s.main, { name: "Page", w, h: 520, fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, layout: "v", cross: "center", main: "center", sizeH: "fill", sizeV: "fixed" });
  b.raw("node.set", { ids: [c], props: { height: 520 } });
  b.instV(c, "Empty state", "Size=Page", { texts: { Title: "You don't have access to this page", Text: "Your role doesn't include this page. Ask your lab admin if you need it.", Label: "Go to My work" }, swaps: [[0, "Icon", "Glyph=lock-simple, Size=20"]], props: { sizingH: "fill" } });
}

exports.build = (b) => {
  clearJ(b);
  const Y = bottoms(b);
  ["desktop", "tablet", "phone"].forEach((k) => { page(b, k); TITLE(b, 0, Y[k] - 90, "J  App"); });
  const d = Y.desktop, t = Y.tablet, p = Y.phone, DX = 1560, TX = 954, PX = 510;
  board(b, 0, d, "desktop"); noAccess(b, DX, d, "desktop");
  board(b, 0, t, "tablet");
  b.jEnd = { desktop: d + 2000, tablet: t + 1200, phone: p + 1300 };
  drawer(b, 0, p, "Lab", "Lab_admin", "01"); drawer(b, PX, p, "CSO", "CSO", "02"); noAccess(b, PX * 2, p, "phone");
};
