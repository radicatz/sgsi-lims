// Revision 8 passes. node rev8.js L <in> <out>   library: split dot-joined component texts into separate layers
//                    node rev8.js D <in> <out>   screens + docs: dot-joined texts left in instances and plain layers
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const SEP = " · ";
const SEP2 = /\s+·\s+/;

function load(inFile) {
  const json = "C:/Users/pc/AppData/Local/Temp/rev8.json";
  cp.execFileSync(CLI, ["convert", inFile, json]);
  const J = JSON.parse(fs.readFileSync(json));
  const N = J.nodes;
  const vars = {}; for (const g of Object.values(J.variables)) for (const v of g) if (v.name) vars[v.id] = v.name;
  const styles = {}; for (const s of J.styles) if (s.id && s.name) styles[s.id] = s.name;
  return { J, N, vars, styles };
}
const pageOf = (N, J, id) => { let n = N[id]; while (n && !J.pages.includes(n.id)) n = N[n.parent]; return n && n.id; };
const chain = (N, J, id) => { const up = []; let n = N[id]; while (n && !J.pages.includes(n.id)) { up.push(n); n = N[n.parent]; } return up; };

// forced splits: set name -> [text name, parts, gap]
const FORCED = { "Select": ["Value", 3, 8], "Key-value row": ["Value", 3, 12] };
const GAP = {};
const COMMA = new Set(["Parameter pill", "Drop zone"]); // tag text stays one layer (its visibility is bound to a property), comma instead of dot

// Node ids created inside a main component are not predictable (instances get copies), so the library pass runs in three phases
// L1: Split frames and horizontal extras  L2: texts inside the Split frames  L3: link the text styles
const TXT = (S, t, str, name, color, extra = {}) => {
  const { styles } = S; const st = t.style || {};
  return { type: "text", text: str, name, props: { fontFamily: st.font_family, fontStyle: st.font_style, fontSize: st.font_size, lineHeight: st.line_height ? st.line_height.value : undefined, textAlign: "left", fill: { $var: color }, sizingH: "hug", ...extra } };
};
const tokOfText = (S, t) => S.vars[(t.bound || {}).fill] || "Text/foreground";
const moreTok = (tok) => (/text-(secondary|muted)/.test(tok) ? tok : "Text/text-secondary");
const setOf = (N, id) => { let n = N[id]; while (n) { if (n.type === "componentSet") return n.name; n = N[n.parent]; } return null; };
function libJobs(S) {
  const { J, N } = S, jobs = [];
  const walk = (id, setName, inComp) => {
    const n = N[id]; if (!n || n.type === "instance") return;
    const sn = n.type === "componentSet" ? n.name : setName;
    const ic = inComp || n.type === "component";
    if (n.type === "text" && ic) {
      const f = FORCED[setName];
      const dotted = (n.characters || "").includes(SEP);
      if (COMMA.has(setName) && dotted) jobs.push({ t: n, comma: true });
      else if (f && n.name === f[0]) jobs.push({ t: n, n: Math.max(f[1], dotted ? n.characters.split(SEP2).length : 1), gap: f[2], hidden: true });
      else if (dotted) jobs.push({ t: n, n: n.characters.split(SEP2).length, gap: GAP[setName] || 6, hidden: false });
    }
    (n.children || []).forEach((c) => walk(c, sn, ic));
  };
  (N[1].children || []).forEach((c) => walk(c, null, false));
  return jobs;
}
function stageL1(inFile, outFile) {
  const S = load(inFile), { J, N } = S; const b = new B(J.next_id); const jobs = libJobs(S);
  let nh = 0, nv = 0, nc = 0;
  jobs.sort((x, y) => N[y.t.parent].children.indexOf(y.t.id) - N[x.t.parent].children.indexOf(x.t.id)); // later siblings first so indexes stay valid
  for (const j of jobs) {
    const t = j.t; const par = N[t.parent], idx = par.children.indexOf(t.id);
    if (j.comma) { b.raw("node.set", { ids: [t.id], props: { characters: t.characters.replace(SEP2, ", ") } }); nc++; continue; }
    const parts = t.characters.split(SEP2), mode = (par.layout || {}).mode, tok = tokOfText(S, t);
    if (mode === "horizontal") {
      nh++;
      b.raw("node.set", { ids: [t.id], props: { characters: parts[0], sizingH: "hug" } });
      for (let k = 1; k < j.n; k++) b.raw("node.create", { ...TXT(S, t, parts[k] !== undefined ? parts[k] : parts[parts.length - 1], t.name + " " + (k + 1), moreTok(tok), parts[k] === undefined ? { visible: false } : {}), parent: par.id, index: idx + k, x: 0, y: 0 });
    } else {
      nv++;
      b.raw("node.set", { ids: [t.id], props: { visible: false, name: t.name + " source" } });
      const sizeH = (t.child_layout && t.child_layout.sizing_h) === "fill" ? "fill" : "hug";
      b.raw("node.create", { type: "frame", name: "Split", parent: par.id, index: idx + 1, x: 0, y: 0, width: t.width, height: t.height, props: { clip: false, fill: "none", layout: "horizontal", gap: j.gap, mainAlign: "min", crossAlign: "center", sizingH: sizeH, sizingV: "hug" } });
    }
  }
  // documentation labels on the library page
  let docs = 0;
  const walkDoc = (id, inComp) => { const n = N[id]; if (!n || n.type === "instance") return; const ic = inComp || n.type === "component"; if (n.type === "text" && !ic && (n.characters || "").includes("·")) { b.raw("node.set", { ids: [id], props: { characters: n.characters.replace(/\s*·\s*/g, ", ") } }); docs++; } (n.children || []).forEach((c) => walkDoc(c, ic)); };
  (N[1].children || []).forEach((c) => walkDoc(c, false));
  b.raw("file.save", { path: outFile }); b.expect = [];
  console.log("L1 horizontal", nh, "vertical", nv, "comma", nc, "docs", docs);
  return run(b, inFile, outFile, "rev8L1");
}
function stageL2(inFile, outFile) {
  const S = load(inFile), { J, N } = S; const b = new B(J.next_id); let n = 0;
  for (const f of Object.values(N)) {
    if (f.type !== "frame" || f.name !== "Split" || (f.children || []).length) continue;
    const up = chain(N, J, f.id); if (!up.some((a) => a.type === "component") || up.some((a) => a.type === "instance")) continue;
    const par = N[f.parent], i = par.children.indexOf(f.id), src = N[par.children[i - 1]];
    if (!src || !/ source$/.test(src.name)) continue;
    const base = src.name.replace(/ source$/, ""), set = setOf(N, f.id), forced = FORCED[set];
    const parts = src.characters.split(SEP2), cnt = forced && base === forced[0] ? Math.max(forced[1], parts.length) : parts.length, tok = tokOfText(S, src);
    for (let k = 0; k < cnt; k++) b.raw("node.create", { ...TXT(S, src, parts[k] !== undefined ? parts[k] : parts[parts.length - 1], k ? base + " " + (k + 1) : base, k ? moreTok(tok) : tok, parts[k] === undefined ? { visible: false } : {}), parent: f.id, x: 0, y: 0 });
    n++;
  }
  b.raw("file.save", { path: outFile }); b.expect = [];
  console.log("L2 split frames filled", n);
  return run(b, inFile, outFile, "rev8L2");
}
function stageL3(inFile, outFile) {
  const S = load(inFile), { J, N } = S; const b = new B(J.next_id); const by = {}; let n = 0;
  for (const t of Object.values(N)) {
    if (t.type !== "text" || (t.styles && t.styles.text)) continue;
    const up = chain(N, J, t.id); if (!up.some((a) => a.type === "component") || up.some((a) => a.type === "instance")) continue;
    const m = /^(.*?)( \d)?$/.exec(t.name); const base = m[1];
    let par = N[t.parent]; const hunt = [par, N[par.parent]].filter(Boolean);
    let ref = null;
    for (const p of hunt) for (const c of p.children || []) { const x = N[c]; if (x.type === "text" && x.id !== t.id && (x.name === base + " source" || x.name === base) && x.styles && x.styles.text) ref = x; }
    if (!ref) continue;
    (by[ref.styles.text] = by[ref.styles.text] || []).push(t.id); n++;
  }
  for (const [sid, ids] of Object.entries(by)) b.raw("style.apply", { ids, style: sid });
  b.raw("file.save", { path: outFile }); b.expect = [];
  console.log("L3 styles linked", n);
  return run(b, inFile, outFile, "rev8L3");
}
function stageL(inFile, outFile) {
  const d = require("path").dirname(outFile), t1 = d + "/L1.figcraft", t2 = d + "/L2.figcraft";
  stageL1(inFile, t1); stageL2(t1, t2); stageL3(t2, outFile);
}

// plain layers on a screen (ids are predictable there)
function splitText(b, S, t, n, gap) {
  const { N, vars, styles } = S; const par = N[t.parent], idx = par.children.indexOf(t.id), parts = t.characters.split(SEP2);
  const tok = vars[(t.bound || {}).fill] || "Text/foreground", style = styles[(t.style || {}).style_id] || "Body/Regular";
  const sizeH = (t.child_layout && t.child_layout.sizing_h) === "fill" ? "fill" : "hug";
  const f = b.frame(par.id, { name: "Split", w: t.width, h: t.height, layout: "h", gap, cross: "center", sizeH, sizeV: "hug", index: idx });
  b.raw("node.reparent", { ids: [t.id], parent: f });
  b.raw("node.set", { ids: [t.id], props: { characters: parts[0], sizingH: "hug" } });
  for (let k = 1; k < n; k++) { const id = b.text(f, parts[k], { style, color: moreTok(tok), name: t.name + " " + (k + 1) }); b.raw("node.set", { ids: [id], props: { sizingH: "hug" } }); }
}
function stageD(inFile, outFile) {
  const S = load(inFile), { J, N } = S;
  const b = new B(J.next_id);
  let inst = 0, fallback = [], plain = 0, titles = 0, docs = 0;
  const norm = (t) => String(t).split(/\s*[·,]\s*/).join("|");
  const DEFAULTS = new Set();
  for (const m of Object.values(N)) if (m.type === "text" && / source$/.test(m.name) && chain(N, J, m.id).some((a) => a.type === "component") && !chain(N, J, m.id).some((a) => a.type === "instance")) DEFAULTS.add(norm(m.characters));
  for (const n of Object.values(N)) {
    if (n.type !== "text" || !(n.characters || "").includes("·")) continue;
    const up = chain(N, J, n.id);
    if (up.some((a) => a.type === "component" || a.type === "componentSet")) {
      // hidden source layers (the original text kept next to a Split frame) lose their dots too
      if (/ source$/.test(n.name) && !up.some((a) => a.type === "instance")) b.raw("node.set", { ids: [n.id], props: { characters: n.characters.replace(/\s*·\s*/g, ", ") } });
      continue;
    }
    const pg = pageOf(N, J, n.id);
    const insideInstance = up.some((a) => a.type === "instance");
    const par = N[n.parent];
    if (par && J.pages.includes(par.id)) { b.raw("node.set", { ids: [n.id], props: { characters: n.characters.replace(SEP2, "  ") } }); titles++; continue; }
    if (pg === 1 && !insideInstance) { b.raw("node.set", { ids: [n.id], props: { characters: n.characters.replace(/\s*·\s*/g, ", ") } }); docs++; continue; }
    if (insideInstance) {
      const parts = n.characters.split(SEP2), isSrc = / source$/.test(n.name), base = n.name.replace(/ source$/, "");
      let targets = [];
      if (isSrc && DEFAULTS.has(norm(n.characters))) { b.raw("node.set", { ids: [n.id], props: { characters: n.characters.split(" · ").join(", ") } }); continue; } // an untouched default in an instance, not an override
      if (isSrc) { const sp =N[par.children[par.children.indexOf(n.id) + 1]]; if (sp && sp.name === "Split") targets = sp.children.map((c) => N[c]).filter((c) => c.type === "text"); }
      else if (par.name === "Split") targets = par.children.map((c) => N[c]).filter((c) => c.type === "text");
      else { targets = [n]; const i = par.children.indexOf(n.id); for (let j = i + 1; par.children[j] && N[par.children[j]].name === base + " " + (targets.length + 1); j++) targets.push(N[par.children[j]]); }
      if (targets.length > 1) {
        targets.forEach((k, j) => {
          if (j < parts.length) b.raw("node.set", { ids: [k.id], props: { characters: j === targets.length - 1 && j < parts.length - 1 ? parts.slice(j).join(", ") : parts[j], visible: true } });
          else b.raw("node.set", { ids: [k.id], props: { visible: false } });
        });
        if (isSrc) b.raw("node.set", { ids: [n.id], props: { characters: parts.join(", ") } });
        inst++;
      } else {
        b.raw("node.set", { ids: [n.id], props: { characters: n.characters.replace(/^Sent · Email$/, "Sent by email").replace(/^Sent · WhatsApp$/, "Sent by WhatsApp").replace(/\s*·\s*/g, ", ") } });
        fallback.push(pageName(N, J, n.id) + " | " + n.characters);
      }
      continue;
    }
    // plain layer on a screen
    if (par.type === "frame") { splitText(b, S, n, n.characters.split(SEP2).length, 6); plain++; }
  }
  b.applyTextStyles();
  b.raw("file.save", { path: outFile });
  console.log({ inst, plain, titles, docs, fallback: fallback.length });
  const seen = {}; fallback.forEach((f) => (seen[f] = (seen[f] || 0) + 1)); Object.entries(seen).slice(0, 40).forEach(([k, v]) => console.log(v, k));
  return run(b, inFile, outFile, "rev8D");
}
function pageName(N, J, id) { return (N[pageOf(N, J, id)] || {}).name; }

if (require.main === module) {
  const [mode, i, o] = process.argv.slice(2);
  if (mode === "L") stageL(i, o); else stageD(i, o);
}
module.exports = { stageL, stageL1, stageL2, stageL3, stageD, splitText, load };
if (require.main === module && process.argv[2] === "L3") stageL3(process.argv[3], process.argv[4]);
