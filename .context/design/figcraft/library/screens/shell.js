const { B } = require("../dsl.js");
const PERSON = { CSO: ["Rina Kartika", "Customer Service Officer", "RK"], Lab: ["Maya Lestari", "Lab Admin", "ML"], Prep: ["Dedi Kurniawan", "Preparation", "DK"], Analyst: ["Fitri Handayani", "Analyst", "FH"], Supervisor: ["Hendra Wijaya", "Supervisor", "HW"], Manager: ["Bambang Sutrisno", "Manager", "BS"], Superadmin: ["Wahyu Pratama", "Superadmin", "WP"] };
// sidebar items per role (Navigation_Screen_Plan.md section 2); Input ROA and Review ROA are hidden in v1
const CORE = ["Dashboard", "Job orders", "Batches", "Reports", "Search"];
const VISIBLE = {
  CSO: ["My work", "Dashboard", "Job orders", "Batches", "Reports", "Search", "Clients"],
  Prep: ["My work", "Dashboard", "Job orders", "Batches", "Search"],
  Analyst: ["My work", "Dashboard", "Job orders", "Batches", "Reports", "Search"],
  Lab: ["My work", ...CORE, "Clients", "Drill hole", "Lithology", "Seam"],
  Supervisor: [...CORE, "Drill hole", "Lithology", "Seam", "Audit log"],
  Manager: [...CORE, "Clients", "Drill hole", "Lithology", "Seam", "Audit log"],
  Superadmin: [...CORE, "Clients", "Drill hole", "Lithology", "Seam", "Users", "Configuration", "Audit log"],
};
const GROUPS = { "MASTER DATA": ["Clients", "Drill hole", "Lithology", "Seam"], ADMIN: ["Users", "Configuration", "Audit log"] };

// hide the items the role cannot use, and a group label or rail divider when its group is empty
B.prototype.hideNav = function (sb, sv, role, col) {
  const vis = VISIBLE[role], hide = [];
  for (const i of sv.insts) { const l = i.label || ""; if (l && l !== "Collapse" && !GROUPS[l] && l !== "WORK" && !vis.includes(l)) hide.push(sb + i.pos); }
  const anyOf = (g) => GROUPS[g].some((l) => vis.includes(l));
  for (const g of Object.keys(GROUPS)) if (!anyOf(g) && col === "No") { const gi = sv.insts.find((i) => i.label === g); if (gi) hide.push(sb + gi.pos); }
  if (col === "Yes") { const dv = sv.all.Divider; if (!anyOf("MASTER DATA")) hide.push(sb + dv[0]); if (!anyOf("ADMIN")) hide.push(sb + dv[1]); }
  if (hide.length) this.raw("node.set", { ids: hide, props: { visible: false } });
};
// one screen frame: Top bar + (Sidebar) + main column. Returns {root, main}.
B.prototype.shell = function (o) {
  const { name, x, y, kind, active, role = "CSO" } = o;
  const W = { desktop: 1440, tablet: 834, phone: 390 }[kind];
  const root = this.frame(undefined, { name, x, y, w: W, h: 900, fill: "Surface/shell", layout: "v", gap: 0, pad: 0, sizeH: "fixed", sizeV: "hug", clip: true });
  const [pn, pr, pi] = PERSON[role];
  const bp = { desktop: "Desktop", tablet: "Tablet", phone: "Mobile" }[kind];
  this.instV(root, "Top bar", `Breakpoint=${bp}`, { texts: kind === "phone" ? { Initials: pi } : { UserName: pn, UserRole: pr, Initials: pi, ...(o.search ? { Value: o.search } : {}) }, props: { sizingH: "fill" } });
  const body = this.frame(root, { name: "Body", w: W, h: 800, layout: "h", gap: 0, pad: 0, sizeH: "fill", sizeV: "hug" });
  if (kind !== "phone") {
    const col = kind === "desktop" && !o.collapsed ? "No" : "Yes";
    const sv = this.v("Sidebar", `Collapsed=${col}`);
    const sb = this.step("instance.create", { component: sv.id, parent: body }, sv.size);
    const NI = this.reg.sets["Nav item"].variants;
    const dflt = NI[`State=Default, Collapsed=${col}`].id, act = NI[`State=Active, Collapsed=${col}`].id;
    // the library sidebar has Dashboard active: reset it, then activate the wanted item
    const dash = sv.insts.find((i) => i.label === "Dashboard"), want = sv.insts.find((i) => (i.label || "") === active) || null;
    if (active !== "Dashboard") { this.raw("instance.swap", { ids: [sb + dash.pos], component: dflt }); }
    if (want && active !== "Dashboard") {
      this.raw("instance.swap", { ids: [sb + want.pos], component: act });
      // the swapped-in Icon variant brings its own dark glyph colour: give it the label colour (Text/text-inverse)
      this.bind(sb + want.pos + 2, "fill", "Text/text-inverse");
    }
    if (kind === "desktop" || kind === "tablet") this.raw("node.set", { ids: [sb], props: { sizingV: "fill" } });
    this.hideNav(sb, sv, role, col);
    this.sidebar = sb;
  }
  const main = this.frame(body, { name: "Main", w: W - (kind === "desktop" ? (o.collapsed ? 88 : 248) : kind === "tablet" ? 88 : 0), h: 600, layout: "v", gap: 20, pad: kind === "phone" ? [16, 16, 24, 16] : kind === "tablet" ? [24, 24, 32, 24] : [28, 32, 40, 32], sizeH: "fill", sizeV: "hug" });
  return { root, main };
};
