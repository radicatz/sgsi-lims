const fs = require("fs"), path = require("path");
const { TS, LIGHT } = require("./dsl.js");
const { scalePath } = require("../tools/emit.js");
const ICON_DIR = path.join(__dirname, "icons");
const GLYPHS = fs.readdirSync(ICON_DIR).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4)).sort();

function docFrame(b, name, x, w = 1600) {
  const f = b.frame(undefined, { name, x, y: -6000, w, h: 400, fill: "Surface/background", layout: "v", gap: 32, pad: 40, sizeV: "hug", r: 0 });
  b.text(f, name.replace(/^\d+ /, ""), { style: "Heading/H1", color: "Text/heading" });
  return f;
}
function section(b, parent, title, note) {
  const s = b.frame(parent, { name: title, w: 1500, h: 100, layout: "v", gap: 12, sizeH: "fill", sizeV: "hug", fill: "Surface/card", stroke: "Surface/border", sw: 1, r: 16, pad: 24 });
  b.text(s, title, { style: "Heading/H3", color: "Text/heading" });
  if (note) b.text(s, note, { style: "Body small/Regular", color: "Text/text-secondary", fill: true });
  return s;
}

// Phase A: styles, then the Icon set
function styles(b, host) {
  const pan = section(b, host, "Text styles", "Body in Noto Sans, headings in Newsreader, codes in JetBrains Mono.");
  const rows = b.frame(pan, { name: "rows", w: 1400, h: 100, layout: "v", gap: 8, sizeH: "fill", sizeV: "hug" });
  for (const st of Object.keys(TS)) {
    const t = b.text(rows, st.includes("Heading") || st.includes("Display") || st.includes("Number") || st === "Lead" ? "Coal laboratory testing" : st.startsWith("Overline") ? "COMPANY · WORK · REPORT" : st === "Data" || st === "Data/Strong" ? "SS-1172 · 6,257 kcal/kg" : "Sample info locks after preparation starts.", { style: st, name: st });
    b.raw("style.create", { type: "text", name: st, from: t }); b.styleSeq++;
  }
  // effect styles (colours bound to Shadow tokens)
  const eff = section(b, host, "Effect styles", "Elevation 2xs to 2xl and the focus ring. Colours follow the Shadow tokens, so Dark mode swaps them.");
  const row = b.frame(eff, { name: "samples", w: 1400, h: 120, layout: "h", gap: 32, pad: 16, sizeH: "fill", sizeV: "hug", cross: "center", wrap: true });
  const A = { deep: "1F", mid: "0D", light: "05" }, col = (k) => LIGHT["Shadow/" + k] + A[k];
  const L = (k, x, y, bl, sp) => ({ type: "dropShadow", color: col(k), offset: [x, y], radius: bl, spread: sp, k });
  const ELEV = {
    "2xs": [L("mid", 0, 2, 2, 0), L("light", 0, 4, 4, 0)], "xs": [L("deep", 0, 1, 2, 0), L("mid", 0, 2, 2, 0), L("light", 0, 4, 6, 0)],
    "md": [L("deep", 0, 2, 6, 0), L("mid", 0, 4, 6, 0), L("light", 0, 6, 8, 0)], "lg": [L("deep", 0, 2, 6, 1), L("mid", 0, 4, 6, 2), L("light", 0, 6, 8, 2)],
    "xl": [L("deep", 0, 4, 8, 2), L("mid", 0, 8, 8, 4), L("light", 0, 10, 10, 6)], "2xl": [L("deep", 0, 6, 8, 4), L("mid", 0, 10, 10, 8), L("light", 0, 12, 12, 12)],
  };
  const out = {};
  for (const [n, fx] of Object.entries(ELEV)) {
    const f = b.frame(row, { name: "Elevation/" + n, w: 72, h: 56, fill: "Surface/card", r: 12, effects: fx.map(({ k, ...e }) => e) });
    b.text(f, n.toUpperCase(), { style: "Caption/Medium", x: 20, y: 18 });
    const sid = "S:" + b.styleSeq++; out[n] = sid;
    b.raw("style.create", { type: "effect", name: "Elevation/" + n, from: f });
    fx.forEach((e, i) => b.raw("style.bind", { style: sid, field: `effects/${i}/color`, variable: "Shadow/" + e.k }));
  }
  const ring = b.frame(row, { name: "Focus ring", w: 72, h: 56, fill: "Surface/card", r: 12, effects: [{ type: "dropShadow", color: LIGHT["Primary/primary-200"], offset: [0, 0], radius: 0, spread: 3 }] });
  b.text(ring, "Focus", { style: "Caption/Medium", x: 18, y: 18 });
  b.raw("style.create", { type: "effect", name: "Focus ring", from: ring });
  b.raw("style.bind", { style: "S:" + b.styleSeq++, field: "effects/0/color", variable: "Primary/primary-200" });
  b.ring = true;
}

function icons(b, host) {
  const pan = section(b, host, "Icon", "Phosphor Regular. One set, Glyph × Size (14 or 20). Colour follows the parent text colour: override the fill on the instance.");
  const variants = [];
  const files = {};
  GLYPHS.forEach((g) => { files[g] = fs.readFileSync(path.join(ICON_DIR, g + ".svg"), "utf8"); });
  for (const g of GLYPHS) for (const size of [14, 20]) {
    const d = [...files[g].matchAll(/<path[^>]*? d="([^"]+)"/g)].map((m) => m[1]);
    variants.push({ name: `Glyph=${g}, Size=${size}`, w: size, h: size, glyph: g, size, paths: d, build: (cid) => { d.forEach((p) => { const v = b.step("vector.create", { path: scalePath(p, size / 256), x: 0, y: 0, parent: cid, props: { fill: LIGHT["Text/foreground"] } }, 1); b.bind(v, "fill", "Text/foreground"); }); } });
  }
  const cols = 12, cw = 60, ch = 48;
  const holder = b.frame(pan, { name: "Icon (set)", w: cols * cw + 32, h: Math.ceil(variants.length / cols) * ch + 32 });
  const per = [];
  variants.forEach((v, i) => {
    const cid = b.component(holder, { name: v.name, x: (i % cols) * cw + 16, y: Math.floor(i / cols) * ch + 16, w: v.w, h: v.h });
    v.build(cid); per.push(cid); b.icons[v.glyph + "|" + v.size] = { id: cid, paths: v.paths.length };
  });
  const setId = b.step("component.combineVariants", { ids: per }, 1);
  b.raw("node.set", { ids: [setId], props: { name: "Icon" } });
  b.iconSet = setId;
}
module.exports = { docFrame, section, styles, icons, GLYPHS };
