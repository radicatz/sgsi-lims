const { B } = require("../dsl.js");
const PERSON = { CSO: ["Rina Kartika", "Customer Service Officer", "RK"], Lab: ["Maya Lestari", "Lab Admin", "ML"], Prep: ["Dedi Kurniawan", "Preparation", "DK"], Analyst: ["Fitri Handayani", "Analyst", "FH"] };

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
    const col = kind === "desktop" ? "No" : "Yes";
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
    this.sidebar = sb;
  }
  const main = this.frame(body, { name: "Main", w: W - (kind === "desktop" ? 248 : kind === "tablet" ? 88 : 0), h: 600, layout: "v", gap: 20, pad: kind === "phone" ? [16, 16, 24, 16] : kind === "tablet" ? [24, 24, 32, 24] : [28, 32, 40, 32], sizeH: "fill", sizeV: "hug" });
  return { root, main };
};
