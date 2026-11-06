const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
let s = fs.readFileSync("rowB.js", "utf8").split(CRLF).join(LF);
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 70)); s = s.replace(a, b); };

// data: all 9 groups, the eight coking tests of the lab (prototype data.js), standards that have a method
const a = s.indexOf("const COKING = ["), e = s.indexOf("// ---------- small builders");
if (a < 0 || e < 0) throw new Error("data block not found");
s = s.slice(0, a) + `const CSN = "CSN (Crucible Swelling Number)", GIE = "Gieseler Plastometer", GKC = "Gray King Coke Type", DIL = "Dilatometer Test", SAP = "Sapozhnikov Test", GIX = "G – Index (G Caking Index Test)", CRI = "CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)", MAC = "Maceral Analysis (Petrographic)";
GROUPS.push(["Coking coal", [CSN, GIE, GKC, DIL, SAP, GIX, CRI, MAC]]);
const METHODS = { [GKC]: ["ISO", "GB/T"], [SAP]: ["ISO", "GB/T"], [GIX]: ["ISO", "GB/T"] }; // the others have ASTM, ISO and GB/T methods
const SUB = [CRI];
const ON_STD = new Set(["TM", "IM", "Ash", "VM", "FC", "TS", "GCV"]);
const ON_COKING = new Set(["TM", "IM", "Ash", "VM", "FC", "TS", "GCV", CSN, GIE, DIL, MAC, "P", "Ash analysis ▸", GIX]);

` + s.slice(e);

rep('(ck ? "12" : "8") + " selected"', '(ck ? "15" : "8") + " selected"');
rep('(ck ? COKING : GROUPS).forEach(([g, ps]) => {', 'GROUPS.forEach(([g, ps]) => {');
const p1 = s.indexOf("    ps.forEach((p) => {"), p2 = s.indexOf("    });\n  });", p1);
if (p1 < 0 || p2 < 0) throw new Error("pill block not found");
s = s.slice(0, p1) + `    ps.forEach((p) => {
      const stds = ck ? ["ASTM", "GB/T"] : ["ASTM"], m = METHODS[p];
      const avail = !m || stds.some((x) => m.includes(x));
      const isOn = avail && (on.has(p) || (o.ash && p === "Ash analysis ▸"));
      const tag = SUB.includes(p) ? "Subcontracted" : m ? (m.length === 2 ? "ISO and GB/T" : m[0]) : null;
      const sp = tag ? { "Show tag": true, Tag: b.v("Coverage tag", "Kind=" + tag).id } : {};
      b.instV(r, "Parameter pill", "Kind=Parameter, State=" + (!avail ? "Unavailable" : isOn ? "On" : "Off"), { texts: { Label: o.ash && p === "Ash analysis ▸" ? "Ash analysis 9/29 ▸" : p }, setProps: sp });
    });
  });` + s.slice(p2 + "    });\n  });".length);
s = s.replace('const COV = { "Gray-King": "ISO · GB/T", "Y value": "GB/T", "G index": "ISO · GB/T", "Roga index": "ISO · GB/T" };\n', "");
s = s.replace('const ON_STD = new Set(["TM", "IM", "Ash", "VM", "FC", "TS", "GCV"]);\nconst ON_COKING = new Set(["TM", "IM", "Ash", "VM", "FC", "TS", "GCV", "CSN", "Gray-King", "Y value", "G index"]);\n', "");
fs.writeFileSync("rowB.js", s);
console.log("edit9 ok");
