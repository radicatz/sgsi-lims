// Reorganise .context/docs into folders and fix every reference to a doc file (Nov 4, 2026)
const fs = require("fs"), path = require("path"), cp = require("child_process");
const ROOT = "D:/SGSI/LIMS", DOCS = ROOT + "/.context/docs";
const MAP = {
  "Coal_LIMS_Development_Spec.md": "Project", "Coal_LIMS_Research_and_Project_Plan.md": "Project",
  "Component_Library_Plan.md": "Design System", "Design_Tokens.md": "Design System", "Frame_Naming.md": "Design System",
  "Job_Order_Screen_Plan.md": "Job Order", "Job_Order_Prototype_Plan.md": "Job Order",
  "Batch_Screen_Plan.md": "Batch",
  "My_Work_Screen_Plan.md": "My Work",
  "Dashboard_Screen_Plan.md": "Dashboard", "Dashboard_v2_Screen_Plan.md": "Dashboard",
  "Reception_Preparation_Screen_Plan.md": "archive",
};
const DRY = process.argv[2] === "dry";
// 1. move
for (const [f, d] of Object.entries(MAP)) {
  const from = DOCS + "/" + f, to = DOCS + "/" + d + "/" + f;
  if (!fs.existsSync(from)) continue;
  if (DRY) { console.log("mv", f, "->", d); continue; }
  fs.mkdirSync(DOCS + "/" + d, { recursive: true });
  const tracked = cp.spawnSync("git", ["ls-files", "--error-unmatch", from], { cwd: ROOT }).status === 0;
  if (tracked) cp.execFileSync("git", ["mv", from, to], { cwd: ROOT }); else fs.renameSync(from, to);
}
// 2. references
const names = Object.keys(MAP).map((n) => n.replace(/\./g, "\\."));
const RX = new RegExp("(\\.context/docs/)?(?<![\\w/])(" + names.join("|") + ")", "g");
const RXP = new RegExp("\\.context/docs/(" + names.join("|") + ")", "g");
const rel = (fromDir, f) => { const target = DOCS + "/" + MAP[f] + "/" + f; let r = path.posix.relative(fromDir, target); return r; };
function fixDoc(file) {
  const dir = path.posix.dirname(file);
  let s = fs.readFileSync(file, "utf8"), n = 0;
  s = s.replace(RXP, (m, f) => { n++; return ".context/docs/" + MAP[f] + "/" + f; });
  s = s.replace(RX, (m, pre, f, off, all) => {
    if (pre) return m; // full path, done above
    const r = rel(dir, f); if (r === f) return m; n++; return r;
  });
  return [s, n];
}
function fixOther(file) {
  let s = fs.readFileSync(file, "utf8"), n = 0;
  s = s.replace(RXP, (m, f) => { n++; return ".context/docs/" + MAP[f] + "/" + f; });
  s = s.replace(RX, (m, pre, f) => { if (pre) return m; n++; return ".context/docs/" + MAP[f] + "/" + f; });
  return [s, n];
}
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = d + "/" + e.name; if (e.isDirectory()) walk(p, out); else if (e.name.endsWith(".md")) out.push(p); } return out; };
const docs = DRY ? Object.keys(MAP).map((f) => DOCS + "/" + f).filter(fs.existsSync) : walk(DOCS);
let total = 0;
for (const f of docs) { const [s, n] = fixDoc(f); if (n) { total += n; console.log(n, path.relative(ROOT, f)); if (!DRY) fs.writeFileSync(f, s); } }
const OTHERS = [ROOT + "/README.md", ROOT + "/.context/design/figcraft/library/naming.js", ROOT + "/.context/design/figcraft/tools/tokdoc.js", ROOT + "/.context/prototype/src/reception.js",
  "C:/Users/pc/AppData/Local/Temp/claude/d--SGSI-LIMS/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad/figma/tokdoc.js"];
const MEM = "C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory";
for (const m of fs.readdirSync(MEM)) if (m.endsWith(".md")) OTHERS.push(MEM + "/" + m);
for (const f of OTHERS) { if (!fs.existsSync(f)) continue; const [s, n] = fixOther(f); if (n) { total += n; console.log(n, f.replace(ROOT + "/", "")); if (!DRY) fs.writeFileSync(f, s); } }
console.log("references changed", total);
