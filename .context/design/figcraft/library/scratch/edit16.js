const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library");
const LF = "\n", CRLF = String.fromCharCode(13, 10);
const rw = (f, fn) => { let s = fs.readFileSync(f, "utf8").split(CRLF).join(LF); s = fn(s); fs.writeFileSync(f, s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 90)); return s.replace(a, b); };

rw("screens/rowH.js", (s) => {
  s = rep(s, "const { B, LIMS_UNUSED, LIGHT } = require", "const { B, LIGHT } = require");
  const a = s.indexOf("// ---------- overview ----------"), e = s.indexOf("function overviewFrame");
  return s.slice(0, a) + "// ---------- overview ----------\n" + s.slice(e);
});
// rows D, F, G ignore row H frames and the title of row H when they place themselves
for (const f of ["screens/rowD.js", "screens/rowG.js", "screens/rowF.js"]) rw(f, (s) => {
  let n = 0;
  s = s.replace(/\|\^\(Add batch\|CoA · Mark sent\|CoA · Sent\|Cancel job order\) ·\/\.test\(n\.name \|\| ""\) \|\| \(n\.name === "Row title" && \/\^\[DE\]/g, () => { n++; return '|^(Add batch|CoA · Mark sent|CoA · Sent|Cancel job order) ·|-01-My_work-|^My work ·/.test(n.name || "") || (n.name === "Row title" && /^[DEH]'; });
  s = s.replace(/\(n\.name === "Row title" && \/\^\[FG\]\( ·\|  \)\/\.test/g, () => { n++; return '(n.name === "Row title" && /^[FGH]( ·|  )/.test'; });
  console.log(f, "patched", n); return s;
});
// row F tells row H where it ends
rw("screens/rowF.js", (s) => {
  if (s.includes("b.fEnd")) return s;
  const a = s.lastIndexOf("};");
  return s.slice(0, a) + "  b.fEnd = { desktop: D3 + 1500 + 400, tablet: T1 + 1500 + 400, phone: P1 + 2800 + 400 };\n" + s.slice(a);
});
// naming rules, module 01 My_work
rw("naming.js", (s) => {
  s = rep(s, "  const bl = /^Batch list · (.+)$/.exec(base);", "  const mw = /^My work · (Overview|Queue) · (.+)$/.exec(base);\n  if (mw && MW_VV[mw[1] + \":\" + mw[2]]) return [size, \"01\", \"My_work\", mw[1] === \"Overview\" ? \"01\" : \"02\", mw[1], MW_VV[mw[1] + \":\" + mw[2]], mw[2]].join(\"-\");\n  const bl = /^Batch list · (.+)$/.exec(base);");
  s = rep(s, "const LIST_VV = {", "const MW_VV = { \"Overview:Lab_admin\": \"01\", \"Overview:Preparation\": \"02\", \"Overview:Analyst\": \"03\", \"Overview:CSO\": \"04\", \"Overview:All_caught_up\": \"05\", \"Queue:Batches_to_receive\": \"01\", \"Queue:CoAs_to_send_multi_select\": \"02\" };\nconst LIST_VV = {");
  return s;
});
console.log("edit16 ok");
