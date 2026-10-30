// Spec tree (from convert.js) -> FigCraft command script (node.create / vector.create steps with predicted sequential ids).
const fs = require("fs");
const cv = require("./convert.js");

const STYLE = { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold" };
const NP = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

function scalePath(d, k) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let out = "", i = 0, cmd = "";
  const f = (x) => String(+(x * k).toFixed(3));
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) { cmd = toks[i++]; out += cmd; if (NP[cmd.toLowerCase()] === 0) continue; }
    const n = NP[cmd.toLowerCase()];
    const p = toks.slice(i, i + n).map(Number); i += n;
    if (cmd.toLowerCase() === "a") out += [f(p[0]), f(p[1]), p[2], p[3], p[4], f(p[5]), f(p[6])].join(" ") + " ";
    else out += p.map(f).join(" ") + " ";
  }
  return out.trim();
}

const CAND = /^(Top Bar|Sidebar|Status|Button\/(Primary|Secondary|Outline)|Input\/Search|Step\/(Done|Current|Upcoming)|Tab\/Underline( · Off)?|Brand|Avatar|Badge\/Status)$/;
const keyOf = (n) => { const c = JSON.parse(JSON.stringify(n)); delete c.ab; delete c.w; delete c.h; (function w(x) { if (x.tx !== undefined) x.tx = ""; (x.ch || []).forEach(w); })(c); return JSON.stringify(c); };
const textsOf = (n, a = []) => { if (n.k === "t") a.push(n.tx); (n.ch || []).forEach((c) => textsOf(c, a)); return a; };

class Emitter {
  constructor(svgs, startId) { this.svgs = svgs; this.id = startId || 2; this.steps = []; this.warn = new Set(); }
  step(command, params) {
    const id = this.id++;
    this.steps.push({ command, params });
    if (this.cap && command === "node.create" && params.type === "text") this.cap.push({ id, tx: params.text });
    const pr = params.props, map = Emitter.tokens;
    if (map && pr && (command === "node.create" || command === "vector.create")) {
      for (const f of ["fill", "stroke"]) { const v = pr[f]; if (typeof v === "string") { const nm = map[v.toUpperCase()]; if (nm) this.steps.push({ command: "variable.bind", params: { ids: [id], field: f, variable: nm } }); } }
    }
    return id;
  }

  paintProps(s, props) {
    if (s.f) props.fill = s.f; else if (s.fg) {
      const [deg, stops] = s.fg, a = (deg * Math.PI) / 180, dx = Math.sin(a), dy = -Math.cos(a);
      props.fills = [{ type: "linearGradient", stops: stops.map(([c, p]) => ({ position: p, color: c })), from: [+(0.5 - dx / 2).toFixed(3), +(0.5 - dy / 2).toFixed(3)], to: [+(0.5 + dx / 2).toFixed(3), +(0.5 + dy / 2).toFixed(3)] }];
    } else props.fill = "none";
    if (s.s) { props.stroke = s.s[0]; props.strokeWeight = s.s[1]; props.strokeAlign = s.s[2] === "C" ? "center" : "inside"; }
    if (s.sb) { const v = s.sb[1]; props.stroke = s.sb[0]; props.strokeAlign = "inside"; props.strokeTopWeight = v[0]; props.strokeRightWeight = v[1]; props.strokeBottomWeight = v[2]; props.strokeLeftWeight = v[3]; }
    if (s.e) props.effects = s.e.map(([x, y, b, h]) => ({ type: "dropShadow", color: h, offset: [x, y], radius: b }));
    if (s.r !== undefined) props.cornerRadius = s.r;
    if (s.o !== undefined) props.opacity = s.o;
  }

  // ---- components: repeated shell and control structures become main components in a library frame, used as instances
  prepare(trees) {
    const counts = {}, first = {};
    trees.forEach((t) => { if (/Components$/.test(t.n)) return; (function w(n) { if (n.n && n.k !== "t" && CAND.test(n.n)) { const k = keyOf(n); counts[k] = (counts[k] || 0) + 1; if (!first[k]) first[k] = n; return; } (n.ch || []).forEach(w); })(t); });
    const byName = {};
    Object.keys(counts).filter((k) => counts[k] >= 3).forEach((k) => { (byName[first[k].n] = byName[first[k].n] || []).push(k); });
    this.pending = [];
    Object.entries(byName).forEach(([nm, keys]) => keys.forEach((k, i) => this.pending.push({ k, spec: first[k], name: keys.length > 1 ? nm + " · v" + (i + 1) : nm, uses: counts[k] })));
    this.comps = {};
  }
  buildLibrary() {
    const lib = this.step("node.create", { type: "frame", name: "Component library", x: 0, y: 0, width: 2400, height: 200, props: { fill: "#F6F1E6", layout: "horizontal", wrap: true, gap: 32, padding: 32, crossAlign: "min", sizingV: "hug", clip: false } });
    this.inMain = true;
    for (const p of this.pending) {
      const spec = JSON.parse(JSON.stringify(p.spec)); spec.k = "c"; spec.n = p.name; delete spec.ab;
      const w = typeof spec.w === "number" ? spec.w : undefined, h = typeof spec.h === "number" ? spec.h : undefined;
      if (spec.w === "F") delete spec.w; if (spec.h === "F") delete spec.h;
      this.cap = []; const start = this.id;
      const id = this.node(spec, lib, { auto: true, w: undefined, h: undefined });
      const size = this.id - start, texts = this.cap; this.cap = null;
      texts.forEach((t, i) => this.steps.push({ command: "component.addProperty", params: { id, name: "t" + i, type: "text", layer: t.id } }));
      this.comps[p.k] = { id, size, texts: texts.map((t) => t.tx), w, h, name: p.name };
    }
    this.inMain = false;
    return lib;
  }
  instance(s, parent, pctx, c) {
    const id = this.id;
    this.steps.push({ command: "instance.create", params: { component: c.id, parent } });
    this.id += c.size;
    const set = {};
    if (s.ab) { if (pctx.auto) set.absolute = true; set.x = s.ab[0]; set.y = s.ab[1]; }
    if (pctx.auto && !s.ab) { if (s.w === "F") set.sizingH = "fill"; if (s.h === "F") set.sizingV = "fill"; }
    if (typeof s.w === "number" && s.w !== c.w) set.width = s.w;
    if (typeof s.h === "number" && s.h !== c.h) set.height = s.h;
    if (Object.keys(set).length) this.steps.push({ command: "node.set", params: { ids: [id], props: set } });
    const props = {};
    textsOf(s).forEach((tx, i) => { if (tx !== c.texts[i]) props["t" + i] = tx; });
    if (Object.keys(props).length) this.steps.push({ command: "instance.setProperties", params: { ids: [id], properties: props } });
    this.used = (this.used || 0) + 1;
    return id;
  }

  node(s, parent, pctx) {
    if (this.comps && !this.inMain && s.n && s.k !== "t" && CAND.test(s.n)) { const c = this.comps[keyOf(s)]; if (c) return this.instance(s, parent, pctx, c); }
    // pctx: { auto: parent has auto layout, w, h }
    if (s.k === "i") {
      const id = this.step("image.place", { path: "D:/SGSI/LIMS/.context/assets/sgsi-logo" + ((s.w / s.h) >= 1.5 ? "" : "-icon") + (s.im === 0 ? "" : "-white") + ".png", parent, x: 0, y: 0, width: s.w, height: s.h, mode: "fill" });
      if (pctx.auto) this.steps.push({ command: "node.set", params: { ids: [id], props: { absolute: true, x: 0, y: 0 } } });
      return id;
    }
    if (s.k === "x") { this.warn.add("ref " + s.n); return null; }
    if (s.k === "v") return this.icon(s, parent, pctx);
    const abs = !!s.ab;
    const place = {};
    if (parent !== undefined) { if (abs) { place.x = s.ab[0]; place.y = s.ab[1]; } }
    if (s.k === "t") {
      const fw = s.fw || 400, family = s.ff || "Noto Sans";
      let style = STYLE[fw] || "Regular";
      if (family === "JetBrains Mono" && fw === 600) style = "Bold";
      if (s.it) style = style === "Regular" ? "Italic" : style + " Italic";
      const props = { fontFamily: family, fontStyle: style, fontSize: s.fs, fill: s.c || "#1A1A1A", textAlign: s.al === "C" ? "center" : s.al === "R" ? "right" : "left" };
      if (s.lh) props.lineHeight = s.lh;
      if (s.ls) props.letterSpacing = s.ls;
      if (s.o !== undefined) props.opacity = s.o;
      const p = { type: "text", text: s.tx, name: s.n || undefined, parent, ...place, props };
      if (typeof s.w === "number") { p.width = s.w; props.textAutoResize = "height"; }
      else if (s.w === "F" && pctx.auto && !abs) { props.textAutoResize = "height"; props.sizingH = "fill"; }
      if (abs && pctx.auto) props.absolute = true;
      if (s.h === "F" && pctx.auto && !abs) props.sizingV = "fill";
      return this.step("node.create", p);
    }
    // frame / component
    const props = {};
    this.paintProps(s, props);
    props.clip = !!s.cl;
    if (s.d) {
      props.layout = s.d === "H" ? "horizontal" : "vertical";
      props.gap = s.g || 0;
      if (s.p) props.padding = s.p;
      props.mainAlign = { C: "center", E: "max", B: "spaceBetween" }[s.a] || "min";
      props.crossAlign = { C: "center", E: "max" }[s.i] || "min";
    }
    const p = { type: s.k === "c" ? "component" : "frame", name: s.n || undefined, parent, ...place, props };
    const wNum = typeof s.w === "number", hNum = typeof s.h === "number";
    if (wNum) p.width = s.w; else if (!s.d || s.w === "F") p.width = typeof pctx.w === "number" ? pctx.w : 100;
    if (hNum) p.height = s.h; else if (!s.d || s.h === "F") p.height = typeof pctx.h === "number" ? pctx.h : 100;
    if (abs && pctx.auto) props.absolute = true;
    const flowIn = pctx.auto && !abs;
    if (s.d) {
      if (!wNum && s.w !== "F") props.sizingH = "hug";
      if (!hNum && s.h !== "F") props.sizingV = "hug";
    }
    if (flowIn) {
      if (s.w === "F") props.sizingH = "fill";
      if (s.h === "F") props.sizingV = "fill";
    }
    const id = this.step("node.create", p);
    const ctx = { auto: !!s.d, w: wNum ? s.w : p.width, h: hNum ? s.h : p.height };
    (s.ch || []).forEach((c) => this.node(c, id, ctx));
    return id;
  }

  icon(s, parent, pctx) {
    const svg = this.svgs[s.sv];
    const vb = svg.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
    const k = s.w / vb[2];
    const wrap = this.step("node.create", { type: "frame", name: s.n || "Icon", parent, x: s.ab ? s.ab[0] : 0, y: s.ab ? s.ab[1] : 0, width: s.w, height: s.h, props: { fill: "none", clip: false, ...(s.ab && pctx.auto ? { absolute: true } : {}) } });
    for (const m of svg.matchAll(/<path ([^>]*)\/>/g)) {
      const a = m[1], d = (a.match(/ ?d="([^"]+)"/) || [])[1];
      if (!d) continue;
      const fill = (a.match(/ fill="([^"]+)"/) || [])[1], stroke = (a.match(/stroke="([^"]+)"/) || [])[1], sw = (a.match(/stroke-width="([\d.]+)"/) || [])[1];
      const props = { fill: fill && fill !== "none" ? fill : "none" };
      if (stroke) { props.stroke = stroke; props.strokeWeight = sw ? +sw : 1; }
      this.step("vector.create", { path: scalePath(d, k), x: 0, y: 0, parent: wrap, props });
    }
    return wrap;
  }
}

const IMG_DIR = "C:/Users/pc/figcraft/img";
function writeImages() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  Object.values(cv.IMGS).forEach((v) => { const f = IMG_DIR + "/" + v.n + ".png"; if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(v.b64, "base64")); });
}

function build(frames, opts = {}) {
  cv.OPT.images = true;
  const svgs = {};
  const trees = frames.map((n) => { const t = cv.convert(cv.frameByName(n), null, svgs); delete t.ab; return t; });
  const em = new Emitter(svgs, opts.startId || 2);
  let x = 0;
  const ids = [];
  trees.forEach((t, i) => {
    const id = em.node(t, undefined, { auto: false });
    ids.push(id);
    const step = em.steps.find((s, j) => j >= 0 && s.params.name === t.n && !s.params.parent);
    step.params.x = x; step.params.y = 0;
    x += (typeof t.w === "number" ? t.w : 1440) + 120;
  });
  writeImages();
  return { steps: em.steps, ids, warn: [...em.warn] };
}

module.exports = { build, scalePath, Emitter, writeImages };

if (require.main === module) {
  const [, , out, ...names] = process.argv;
  const r = build(names);
  fs.writeFileSync(out, JSON.stringify(r.steps));
  console.log(JSON.stringify({ steps: r.steps.length, ids: r.ids, warn: r.warn }));
}
