const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
const rw = (f, fn) => { let s = fs.readFileSync(f, "utf8").split(CRLF).join(LF); s = fn(s); fs.writeFileSync(f, s); };
const must = (s, a) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 60)); };
rw("screens/rowC.js", (s) => {
  must(s, "const NAMES = /^(Overview|Batches|Samples)( ·|$)(?!.* edit( dark)?$)/;");
  s = s.replace("const NAMES = /^(Overview|Batches|Samples)( ·|$)(?!.* edit( dark)?$)/;", "const NAMES = /^(Overview|Batches|Samples)( ·|$)(?!.*( edit( dark)?| reference)$)/;");
  must(s, "/^C ·/.test(n.characters");
  s = s.replace("/^C ·/.test(n.characters", "/^C( ·|  )/.test(n.characters");
  return s;
});
rw("screens/rowB.js", (s) => {
  must(s, "/^B ·/.test(n.characters");
  s = s.replace("/^B ·/.test(n.characters", "/^B( ·|  )/.test(n.characters");
  s = s.replace('/^(Create|Contact |Signatory |Ash analysis)/', '/^(Create|Contact |Signatory |Ash analysis)(?!.*reference$)/');
  return s;
});
rw("screens/build-screens.js", (s) => {
  s = s.replace('const MAIN = dir + "/SGSI-LIMS-screens.figcraft";', 'const MAIN = process.env.MAIN_IN || dir + "/SGSI-LIMS-screens.figcraft";');
  s = s.replace('const res = run(b, MAIN, dir + "/scratch/screens.figcraft", "screens");', 'const res = run(b, MAIN, process.env.OUT || dir + "/scratch/screens.figcraft", "screens");');
  s = s.replace('b.raw("file.save", { path: dir + "/scratch/screens.figcraft" });', 'b.raw("file.save", { path: process.env.OUT || dir + "/scratch/screens.figcraft" });');
  // the owner's dark copy of P5 keeps its name apart from the generated frame
  s = s.replace("for (const r of rows) require", 'for (const id of Object.keys(J.nodes)) { const n = J.nodes[id]; if (n.type === "frame" && n.name === "Samples · P5 Locked row tooltip · Desktop" && n.var_modes) b.raw("node.set", { ids: [+id], props: { name: "Samples · P5 Locked row tooltip · Desktop dark reference" } }); }\nfor (const r of rows) require');
  return s;
});
console.log("edit5 ok");
