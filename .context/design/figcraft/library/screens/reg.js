// Registry of the sets already in the file: variant ids, node counts, and text / nested-instance positions
// (position = DFS preorder index inside the variant, which is how an instance numbers its copies).
const { B } = require("../dsl.js");

function loadReg(json) {
  const N = {}; (Array.isArray(json.nodes) ? json.nodes : Object.values(json.nodes)).forEach((n) => (N[n.id] = n));
  const kids = (i) => N[i].children || [];
  const cnt = (i) => 1 + kids(i).reduce((a, c) => a + cnt(c), 0);
  const reg = { N, sets: {}, byVariant: {}, next: json.next_id, pageIds: json.pages };
  for (const n of Object.values(N)) {
    if (n.type !== "componentSet") continue;
    const set = { id: n.id, name: n.name, variants: {} };
    for (const vid of kids(n.id)) {
      const v = N[vid]; if (v.type !== "component") continue;
      const texts = [], insts = [], names = {}, all = {}; let pos = 0;
      const walk = (i, root) => {
        const x = N[i];
        if (!root) {
          if (x.type === "text") { texts.push({ pos, name: x.name, chars: x.characters }); if (names[x.name] === undefined) names[x.name] = pos; }
          if (x.type === "instance") { const first = (j) => { const y = N[j]; if (y.type === "text") return y.characters; for (const c of kids(j)) { const r = first(c); if (r !== undefined) return r; } }; insts.push({ pos, name: x.name, comp: x.component, label: first(i) }); }
          if (names[x.name] === undefined && x.type !== "text") names[x.name] = pos;
        }
        if (!root) (all[x.name] = all[x.name] || []).push(pos);
        pos++;
        kids(i).forEach((c) => walk(c, false));
      };
      walk(vid, true);
      set.variants[v.name] = { id: vid, size: cnt(vid), texts, insts, names, off: names, all };
      reg.byVariant[vid] = { set: n.name, variant: v.name };
    }
    reg.sets[n.name] = set;
  }
  // standalone components
  reg.comps = {};
  for (const n of Object.values(N)) if (n.type === "component" && !reg.byVariant[n.id]) reg.comps[n.name] = { id: n.id, size: cnt(n.id) };
  return reg;
}

// B.prototype extensions
B.prototype.useReg = function (reg) { this.reg = reg; return this; };
B.prototype.v = function (setName, variant) {
  const s = this.reg.sets[setName]; if (!s) throw new Error("no set " + setName);
  const v = variant ? s.variants[variant] : Object.values(s.variants)[0];
  if (!v) throw new Error("no variant " + setName + " / " + variant + ". Have: " + Object.keys(s.variants).slice(0, 8).join(" | "));
  return v;
};
// instance with overrides: texts {indexOrName: "string"}, swaps [[nestedIndex, setName, variantName]], props {width, sizingH ...}
B.prototype.instV = function (parent, setName, variant, o = {}) {
  const v = this.v(setName, variant);
  const id = this.step("instance.create", { component: v.id, parent }, v.size);
  for (const [k, t] of Object.entries(o.texts || {})) {
    const nm = v.names || v.off;
    const pos = /^\d+$/.test(k) ? v.texts[+k].pos : nm[k];
    if (pos === undefined) throw new Error(`no text ${k} in ${setName} / ${variant}`);
    this.raw("node.set", { ids: [id + pos], props: { characters: t } });
  }
  for (const [ni, sn, vn] of o.swaps || []) {
    const nm = v.names || v.off; let pos;
    if (typeof ni === "string" && v.insts) { const ins = v.insts.find((i) => i.name === ni); if (ins) pos = ins.pos; }
    if (pos === undefined && typeof ni === "string") pos = nm[ni];
    if (pos === undefined && typeof ni === "number") pos = v.insts[ni].pos;
    if (pos === undefined) throw new Error("no nested " + ni);
    this.raw("instance.swap", { ids: [id + pos], component: this.v(sn, vn).id });
  }
  for (const [k, tk] of Object.entries(o.fills || {})) {
    const nm = v.names || v.off; const pos = /^\d+$/.test(k) ? v.texts[+k].pos : nm[k];
    const { LIGHT } = require("../dsl.js");
    this.raw("node.set", { ids: [id + pos], props: { fill: LIGHT[tk] } }); this.bind(id + pos, "fill", tk);
  }
  for (const k of o.hide || []) { const nm = v.names || v.off; if (nm[k] === undefined) throw new Error("no node " + k); this.raw("node.set", { ids: [id + nm[k]], props: { visible: false } }); }
  if (o.props && Object.keys(o.props).length) this.raw("node.set", { ids: [id], props: o.props });
  if (o.setProps) this.raw("instance.setProperties", { ids: [id], properties: o.setProps });
  return id;
};
B.prototype.comp = function (parent, name, o = {}) {
  const c = this.reg.comps[name]; if (!c) throw new Error("no component " + name);
  const id = this.step("instance.create", { component: c.id, parent }, c.size);
  if (o.props) this.raw("node.set", { ids: [id], props: o.props });
  return id;
};
module.exports = { loadReg };

B.prototype.regSets = function () { this.sets = this.reg.sets; return this; };
B.prototype.iconId = function (glyph, size = 14) { return this.v("Icon", `Glyph=${glyph}, Size=${size}`).id; };
