// Component library DSL: emits FigCraft command steps with predicted sequential ids.
const fs = require("fs"), path = require("path");
const tok = require("../tokens/sgsi-tokens.json");

const LIGHT = {}, DARK = {};
{
  const vs = Object.values(tok.meta.variables), m = tok.meta.variableCollections["VariableCollectionId:1"].modes;
  const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
  vs.filter((v) => v.resolvedType === "COLOR").forEach((v) => { LIGHT[v.name] = hex(v.valuesByMode[m[0].modeId]); DARK[v.name] = hex(v.valuesByMode[m[1].modeId]); });
}
const isTok = (s) => typeof s === "string" && !s.startsWith("#") && s !== "none";

// text styles (Noto Sans body, Newsreader headings, JetBrains Mono codes)
const NS = "Noto Sans", NR = "Newsreader", JM = "JetBrains Mono";
const TS = {
  "Display/XL": [NR, "Medium", 36, 42], "Heading/H1": [NR, "SemiBold", 28, 34], "Heading/H2": [NR, "SemiBold", 22, 28], "Heading/H3": [NR, "SemiBold", 18, 24],
  "Lead": [NR, "Italic", 18, 28], "Number/Display": [NR, "Medium", 30, 34],
  "Body/Regular": [NS, "Regular", 14, 22], "Body/Medium": [NS, "Medium", 14, 22], "Body/SemiBold": [NS, "SemiBold", 14, 22],
  "Body small/Regular": [NS, "Regular", 13, 20], "Body small/Medium": [NS, "Medium", 13, 20], "Body small/SemiBold": [NS, "SemiBold", 13, 20],
  "Caption/Regular": [NS, "Regular", 12, 16], "Caption/Medium": [NS, "Medium", 12, 16], "Caption/SemiBold": [NS, "SemiBold", 12, 16],
  "Label/Button lg": [NS, "SemiBold", 14, 20], "Label/Button md": [NS, "SemiBold", 13, 18], "Label/Button sm": [NS, "SemiBold", 12, 16],
  "Overline": [JM, "Medium", 11, 16, 1.5, "upper"], "Data": [JM, "Regular", 13, 20], "Data/Strong": [JM, "SemiBold", 13, 20],
};

class B {
  constructor(startId) { this.id = startId; this.steps = []; this.expect = []; this.textIds = {}; this.styleSeq = 2; this.icons = {}; }
  step(command, params, newIds) {
    const i = this.steps.length; this.steps.push({ command, params });
    if (newIds) { this.expect.push([i, this.id]); this.id += newIds; }
    return this.id - newIds;
  }
  raw(command, params) { this.steps.push({ command, params }); }
  bind(id, field, name) { this.raw("variable.bind", { ids: [id], field, variable: name }); }
  paint(id, props, o) {
    for (const [k, f] of [["fill", "fill"], ["stroke", "stroke"]]) {
      const v = o[k]; if (v === undefined) continue;
      if (v === "none") props[f] = "none"; else if (isTok(v)) { props[f] = LIGHT[v]; (this.pend = this.pend || []).push([f, v]); } else props[f] = v;
    }
  }
  frame(parent, o = {}) {
    const props = { clip: !!o.clip };
    this.pend = [];
    this.paint(0, props, { fill: o.fill === undefined ? "none" : o.fill, stroke: o.stroke });
    if (o.sw !== undefined) props.strokeWeight = o.sw;
    if (o.strokeAlign) props.strokeAlign = o.strokeAlign;
    if (o.dash) props.dashes = o.dash;
    if (o.r !== undefined) props.cornerRadius = o.r;
    if (o.opacity !== undefined) props.opacity = o.opacity;
    if (o.effects) props.effects = o.effects;
    if (o.layout) { props.layout = o.layout === "h" ? "horizontal" : "vertical"; props.gap = o.gap || 0; if (o.pad !== undefined) props.padding = o.pad; props.mainAlign = o.main || "min"; props.crossAlign = o.cross || "min"; if (o.wrap) props.wrap = true; }
    if (o.sizeH) props.sizingH = o.sizeH; if (o.sizeV) props.sizingV = o.sizeV;
    if (o.absolute) props.absolute = true;
    const p = { type: o.type || "frame", name: o.name, parent, x: o.x || 0, y: o.y || 0, width: o.w || 100, height: o.h || 100, props };
    if (o.index !== undefined) p.index = o.index;
    const id = this.step("node.create", p, 1);
    (this.pend || []).forEach(([f, v]) => this.bind(id, f, v));
    this.pend = [];
    return id;
  }
  component(parent, o) { return this.frame(parent, { ...o, type: "component" }); }
  text(parent, str, o = {}) {
    const st = o.style || "Body/Regular", [ff, fs_, size, lh, ls, tc] = TS[st];
    const props = { fontFamily: ff, fontStyle: fs_, fontSize: size, lineHeight: lh, textAlign: o.align || "left" };
    if (ls) props.letterSpacing = ls; if (tc) props.textCase = tc;
    this.pend = []; this.paint(0, props, { fill: o.color || "Text/foreground" });
    const p = { type: "text", text: str, name: o.name || str, parent, x: o.x || 0, y: o.y || 0, props };
    if (o.index !== undefined) p.index = o.index;
    if (o.w) { p.width = o.w; props.textAutoResize = "height"; if (o.fill) props.sizingH = "fill"; } else if (o.fill) { props.textAutoResize = "height"; props.sizingH = "fill"; }
    const id = this.step("node.create", p, 1);
    (this.pend || []).forEach(([f, v]) => this.bind(id, f, v)); this.pend = [];
    (this.textIds[st] = this.textIds[st] || []).push(id);
    return id;
  }
  applyTextStyles() { for (const [st, ids] of Object.entries(this.textIds)) this.raw("style.apply", { ids, style: st }); this.textIds = {}; }
  // instance of a built set (default = first variant, or by variant name)
  inst(parent, setName, variant) {
    const info = this.sets[setName], v = variant ? info.variants[variant] : info.first;
    if (!v) throw new Error("no variant " + setName + " " + variant);
    return this.step("instance.create", { component: v.id, parent }, v.size);
  }
  // instance + text overrides {RefKey: "text"} using offsets recorded at build
  instT(parent, setName, variant, texts = {}, props = {}) {
    const info = this.sets[setName], v = variant ? info.variants[variant] : info.first;
    const id = this.inst(parent, setName, variant);
    for (const [k, t] of Object.entries(texts)) { if (v.off[k] === undefined) throw new Error("no ref " + k + " in " + setName); this.raw("node.set", { ids: [id + v.off[k]], props: { characters: t } }); }
    if (Object.keys(props).length) this.raw("node.set", { ids: [id], props });
    return id;
  }
  // glyph instance of the Icon set
  icon(parent, glyph, size = 14, color) {
    const c = this.icons[glyph + "|" + size]; if (!c) throw new Error("no icon " + glyph + " " + size);
    const id = this.step("instance.create", { component: c.id, parent }, 1 + c.paths);
    if (color) for (let k = 1; k <= c.paths; k++) { this.bind(id + k, "fill", color); this.raw("node.set", { ids: [id + k], props: { fill: LIGHT[color] } }); }
    return id;
  }
  // variant set. variants: [{name:"Type=Primary, State=Default", w,h,x,y, build(compId)->{Label:textId,...}}]
  // textProps: names of text properties; bools: [{name,key,default}]; swaps: [{name,key}]
  set(parent, name, variants, o = {}) {
    const holder = this.frame(parent, { name: name + " (set)", w: o.W || 800, h: o.H || 200 });
    const per = [];
    const cols = o.cols || 6, cw = o.cw || 200, ch = o.ch || 60;
    const vmap = {};
    variants.forEach((v, i) => {
      const x = (i % cols) * cw + 16, y = Math.floor(i / cols) * ch + 16;
      const start = this.id;
      const cid = this.component(holder, { name: v.name, x, y, w: v.w, h: v.h, ...v.frame });
      const refs = v.build(cid) || {};
      per.push({ cid, refs });
      const off = {}; for (const [k, r] of Object.entries(refs)) off[k] = r - cid;
      vmap[v.name] = { id: cid, size: this.id - start, off };
    });
    const setId = this.step("component.combineVariants", { ids: per.map((p) => p.cid) }, 1);
    this.raw("node.set", { ids: [setId], props: { name } });
    for (const pn of o.textProps || []) {
      per.forEach((p, i) => { if (p.refs[pn] === undefined) return; if (!per.slice(0, i).some((q) => q.refs[pn] !== undefined)) this.raw("component.addProperty", { id: setId, name: pn, type: "text", layer: p.refs[pn] }); else this.raw("component.bindProperty", { layer: p.refs[pn], property: pn, field: "characters" }); });
    }
    for (const b of o.bools || []) {
      per.forEach((p) => { if (p.refs[b.key] === undefined) return; if (!b.done) { this.raw("component.addProperty", { id: setId, name: b.name, type: "boolean", layer: p.refs[b.key], default: b.default }); b.done = true; } else this.raw("component.bindProperty", { layer: p.refs[b.key], property: b.name, field: "visible" }); });
    }
    for (const sl of o.slots || []) {
      let first = true;
      per.forEach((p) => { if (p.refs[sl.key] === undefined) return; if (first) { this.raw("component.makeSlot", { id: p.refs[sl.key], name: sl.name || sl.key }); first = false; } else this.raw("component.bindProperty", { layer: p.refs[sl.key], property: sl.name || sl.key, field: "slot" }); });
    }
    for (const sw of o.swaps || []) {
      let first = true;
      per.forEach((p) => { if (p.refs[sw.key] === undefined) return; if (first) { this.raw("component.addProperty", { id: setId, name: sw.name, type: "instanceSwap", layer: p.refs[sw.key] }); first = false; } else this.raw("component.bindProperty", { layer: p.refs[sw.key], property: sw.name, field: "mainComponent" }); });
    }
    const info = { setId, holder, per, variants: vmap, first: vmap[variants[0].name] };
    (this.sets = this.sets || {})[name] = info;
    return info;
  }
}
module.exports = { B, LIGHT, DARK, TS, isTok };
