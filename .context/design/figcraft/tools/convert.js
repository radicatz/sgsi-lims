// Converts the pen.dev HTML export (Tailwind arbitrary classes) into compact layer specs for the Figma builder.
const fs = require("fs");
const { JSDOM } = require("C:/Users/pc/AppData/Local/Temp/claude/d--SGSI-LIMS/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad/smoke/node_modules/jsdom");
const OPT = { comp: false, refs: null, shell: false, images: false };
const IMGS = {};
const SRC = "D:/SGSI/LIMS/.context/design/screens-export.html";
let _doc = null;
const doc = () => (_doc = _doc || new JSDOM(fs.readFileSync(SRC, "utf8")).window.document);

const num = (s) => parseFloat(String(s).replace("px", ""));
const cls = (el) => (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
const un = (s) => s.replace(/_/g, " ");
const W2S = { 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold" };

function hexOk(h) { return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(h); }
function normHex(h) { h = h.toUpperCase(); return h.length === 9 && h.endsWith("FF") ? h.slice(0, 7) : h; }
function alphaOf(h) { return h.length === 9 ? parseInt(h.slice(7), 16) / 255 : 1; }

function convert(el, parent, svgs) {
  const cs = cls(el);
  const name = el.getAttribute("data-pencil-name") || "";
  const has = (re) => cs.find((c) => re.test(c));
  const get = (re, i = 1) => { const m = cs.map((c) => c.match(re)).find(Boolean); return m ? m[i] : null; };
  const style = el.getAttribute("style") || "";
  if (/background-image:\s*url/.test(style)) { const b64 = (style.match(/base64,([A-Za-z0-9+\/=]+)/) || [,""])[1]; if (b64.length > 60000 && !OPT.images) return null; const key = b64.slice(0, 60) + b64.length; if (!(key in IMGS)) IMGS[key] = { n: Object.keys(IMGS).length, b64 }; return { n: "Logo", k: "i", im: IMGS[key].n, ab: [0, 0], w: parent.w || 36, h: parent.h || 36 }; }
  if (cs.some((c) => /^\[clip-path:/.test(c))) return null;
  const out = {};
  if (name) out.n = name;
  if (OPT.comp && name.includes("/") && el.tagName.toLowerCase() !== "svg" && parent) out.k = "c";
  if (OPT.refs && OPT.refs[name] && parent) return { n: name, k: "x", ref: OPT.refs[name], ab: undefined };

  // ---- svg icon
  if (el.tagName.toLowerCase() === "svg") {
    const w = num(get(/^w-\[([\d.]+px)\]$/)) || 14, h = num(get(/^h-\[([\d.]+px)\]$/)) || w;
    const clone = el.cloneNode(true);
    ["data-pencil-name", "class", "preserveAspectRatio", "data-icon-name", "data-icon-set"].forEach((a) => clone.removeAttribute(a));
    clone.setAttribute("width", w); clone.setAttribute("height", h);
    const m = clone.outerHTML.replace(/\s+/g, " ").replace(/> </g, "><").replace(/(\d+\.\d{2})\d+/g, "$1").replace(/(\.\d)0\b/g, "$1").replace(/\.00\b/g, "").replace(/><\/path>/g, "/>").replace(/<\/path>/g, "");
    let key = Object.keys(svgs).find((k) => svgs[k] === m);
    if (!key) { key = "i" + Object.keys(svgs).length; svgs[key] = m; }
    return Object.assign(out, { k: "v", sv: key, w, h });
  }

  // ---- layout context
  const flex = cs.includes("flex");
  const dir = flex ? (cs.includes("flex-col") ? "V" : "H") : null;
  const abs = cs.includes("absolute");
  const parentDir = parent ? parent.dir : null;
  const isText = has(/^font-\[/) && el.querySelectorAll("*:not(br)").length === 0 && el.textContent.trim().length > 0;

  // ---- sizes
  const wv = get(/^w-\[([\d.]+px)\]$/), hv = get(/^h-\[([\d.]+px)\]$/);
  const grow = cs.includes("[flex:1_1_0]");
  let w, h;
  if (wv) w = num(wv); else if (cs.includes("w-full")) w = "F"; else if (cs.includes("h-0") && false) w = undefined;
  if (hv) h = num(hv); else if (cs.includes("h-full")) h = "F"; else if (cs.includes("h-0")) h = 0;
  if (grow && parentDir === "H") w = "F";
  if (grow && parentDir === "V") h = "F";
  // fill inside a parent without auto layout becomes a fixed size
  if (parent && (!parent.dir || abs)) {
    if (w === "F") w = parent.w; if (h === "F") h = parent.h;
  }
  // transform scale (lines)
  const tm = get(/^\[transform:matrix\(([^)]*)\)\]$/);
  if (tm) { const p = tm.replace(/_/g, "").split(",").map(Number); if (typeof w === "number") w = +(w * p[0]).toFixed(2); }

  if (abs) {
    const l = get(/^left-\[(-?[\d.]+)px\]$/), t = get(/^top-\[(-?[\d.]+)px\]$/);
    out.ab = [l ? +l : 0, t ? +t : 0];
  }

  if (isText) {
    out.k = "t";
    let s = "";
    el.childNodes.forEach((c) => { if (c.nodeType === 3) s += c.textContent.replace(/\s+/g, " "); else if (c.nodeName === "BR") s += "\n"; });
    out.tx = s.replace(/ ?\n ?/g, "\n").trim();
    const m = cs.map((c) => c.match(/^text-\[([\d.]+)px\]\/\[([^\]]+)\]$/)).find(Boolean);
    out.fs = m ? +m[1] : 14;
    const lh = m ? m[2] : "normal";
    if (lh !== "normal") out.lh = /px$/.test(lh) ? num(lh) : +(parseFloat(lh) * out.fs).toFixed(2);
    const col = get(/^text-\[(#[0-9A-Fa-f]{6,8})\]$/); if (col) out.c = normHex(col);
    const ff = get(/^font-\['([^']+)'/) || get(/^font-\[([A-Za-z_]+),/); if (ff && un(ff) !== "Montserrat") out.ff = un(ff);
    const fwv = cs.includes("font-bold") ? 700 : cs.includes("font-semibold") ? 600 : cs.includes("font-medium") ? 500 : 400; if (fwv !== 400) out.fw = fwv;
    if (cs.includes("italic")) out.it = 1;
    const ls = get(/^tracking-\[(-?[\d.]+)px\]$/); if (ls) out.ls = +ls;
    if (cs.includes("text-center")) out.al = "C"; else if (cs.includes("text-right")) out.al = "R";
    if (w !== undefined) out.w = w; else if (!has(/^\[white-space:nowrap\]$/)) out.w = "T"; // wrap with unknown width: hug
    if (h === "F") out.h = "F";
    const op = get(/^opacity-\[([\d.]+)\]$/); if (op) out.o = +op;
    return out;
  }

  // ---- frame
  if (dir) {
    out.d = dir;
    const g = get(/^gap-\[([\d.]+)px\]$/); if (g) out.g = +g;
    const pj = get(/^justify-(start|center|end|between)$/); if (pj && pj !== "start") out.a = { center: "C", end: "E", between: "B" }[pj];
    const ai = get(/^items-(start|center|end)$/); if (ai && ai !== "start") out.i = { center: "C", end: "E" }[ai];
    const p = get(/^p-\[([^\]]+)\]$/);
    if (p) {
      const v = p.split("_").map((x) => num(x));
      const q = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v;
      if (q.some((x) => x)) out.p = q;
    }
  }
  if (w !== undefined) out.w = w;
  if (h !== undefined) out.h = h;

  const bg = get(/^bg-\[(#[0-9A-Fa-f]{6,8})\]$/); if (bg) out.f = normHex(bg);
  const grad = cs.map((c) => c.match(/^\[background-image:linear-gradient\((\d+)deg,_([^\]]*)\)\]$/)).find(Boolean);
  if (grad) out.fg = [+grad[1], grad[2].split(",_").map((x) => { const m = x.match(/(#[0-9A-Fa-f]{6,8})_([\d.]+)%/); return [normHex(m[1]), +m[2] / 100]; })];
  const r = get(/^rounded-\[([^\]]+)\]$/);
  if (r) { const v = r.split("_").map(num); if (v.every((x) => !isNaN(x))) out.r = v.length === 1 ? v[0] : v; }
  const ol = cs.map((c) => c.match(/^\[outline:([\d.]+)px_solid_(#[0-9A-Fa-f]{6,8})\]$/)).find(Boolean);
  if (ol && alphaOf(ol[2]) > 0) out.s = [normHex(ol[2]), +ol[1], "C"];
  const bd = cs.map((c) => c.match(/^\[border:([\d.]+)px_solid_(#[0-9A-Fa-f]{6,8})\]$/)).find(Boolean);
  if (bd && alphaOf(bd[2]) > 0) out.s = [normHex(bd[2]), +bd[1], "I"];
  const bw = get(/^\[border-width:([^\]]+)\]$/), bc = get(/^\[border-color:(#[0-9A-Fa-f]{6,8})\]$/);
  if (bw && bc) { const v = bw.split("_").map(num); out.sb = [normHex(bc), v]; }
  const sh = [get(/^\[box-shadow:([^\]]+)\]$/), get(/^\[filter:drop-shadow\(([^\]]+)\)\]$/)].filter(Boolean).map((s) => { const m = s.match(/([-\d.]+)px_([-\d.]+)px_([\d.]+)px_(#[0-9A-Fa-f]{6,8})/); return m ? [+m[1], +m[2], +m[3], normHex(m[4])] : null; }).filter(Boolean);
  if (sh.length) out.e = sh;
  if (cs.includes("overflow-hidden")) out.cl = 1;
  const op = get(/^opacity-\[([\d.]+)\]$/); if (op) out.o = +op;

  const ctx = { dir, w: typeof w === "number" ? w : null, h: typeof h === "number" ? h : null };
  const kids = [];
  [...el.children].forEach((c) => { if (c.tagName.toLowerCase() === "br") return; const k = convert(c, ctx, svgs); if (k) kids.push(k); });
  if (kids.length) out.ch = kids;
  return out;
}

function lit(v) {
  if (Array.isArray(v)) return "[" + v.map(lit).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => (/^[a-z_$][\w$]*$/i.test(k) ? k : JSON.stringify(k)) + ":" + lit(x)).join(",") + "}";
  if (typeof v === "string") return JSON.stringify(v);
  return String(v);
}

function find(root, path) {
  // path: names separated by " > "
  let cur = root;
  for (const part of path.split(" > ")) {
    const next = [...cur.querySelectorAll("[data-pencil-name]")].find((e) => e.getAttribute("data-pencil-name") === part);
    if (!next) throw new Error("not found: " + part);
    cur = next;
  }
  return cur;
}

function frameByName(name) {
  return [...doc().querySelectorAll("body > div > div")].find((d) => d.getAttribute("data-pencil-name") === name);
}

module.exports = { convert, lit, find, frameByName, doc, OPT, IMGS };

if (require.main === module) {
  const [, , top, subpath, mode, flags] = process.argv;
  if (flags) { if (flags.includes("comp")) OPT.comp = true; if (flags.includes("shell")) OPT.shell = true; const rf = flags.match(/refs=([^,]+)/); if (rf) OPT.refs = Object.fromEntries(rf[1].split("+").map((x) => x.split(":"))); }
  const topEl = frameByName(top);
  if (!topEl) throw new Error("no frame " + top);
  const svgs = {};
  const paths = subpath && subpath !== "-" ? subpath.split("|") : [null];
  const trees = paths.map((pth) => {
    const el = pth ? find(topEl, pth) : topEl;
    const tree = convert(el, null, svgs);
    if (tree.ab) delete tree.ab;
    if (OPT.shell) { delete tree.ch; Object.keys(svgs).forEach((k) => delete svgs[k]); }
    if (flags && flags.includes("rootcomp")) tree.k = "c";
    return tree;
  });
  const used = lit({ svgs, node: trees.length === 1 ? trees[0] : trees });
  if (mode === "stat") console.log(used.length, Object.keys(svgs).length);
  else process.stdout.write(used);
}

