const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
const rw = (f, fn) => { let s = fs.readFileSync(f, "utf8").split(CRLF).join(LF); s = fn(s); fs.writeFileSync(f, s); };
// every card: padding 16 on all four sides (owner, Nov 4)
rw("screens/rowC.js", (s) => {
  let n = 0;
  s = s.replace(/pad: \[16, ?20, ?16, ?20\]/g, () => { n++; return "pad: [16, 16, 16, 16]"; });
  s = s.replace("const W = WCONTENT[kind] - 42, sw = W / 6;", "const W = WCONTENT[kind] - 32, sw = W / 6;");
  console.log("rowC pads", n); return s;
});
rw("screens/rowF.js", (s) => {
  let n = 0;
  s = s.replace(/pad: \[16, ?20, ?16, ?20\]/g, () => { n++; return "pad: [16, 16, 16, 16]"; });
  s = s.replace("(kind === \"desktop\" ? 1128 : 698) - 42, sw = Wc / 6;", "(kind === \"desktop\" ? 1128 : 698) - 32, sw = Wc / 6;");
  s = s.replace(/r: 12, pad: 12 \}\)/g, "r: 12, pad: 16 })").replace(/r: 12, pad: 12, /g, "r: 12, pad: 16, ");
  console.log("rowF pads", n); return s;
});
// post pass: any card still on another padding (rows that are not rebuilt)
rw("cards.js", (s) => {
  if (s.includes("// 5.")) return s;
  s = s.replace("//  4. Table cards are padded 16", "//  5. every card is padded 16 on all four sides (card, Properties, Batches, Samples ...)\n//  4. Table cards are padded 16");
  s = s.replace("    if (n.name === \"Table card\") {", "    if ((/ card$/.test(n.name) || /^(Properties|Batches|Samples|Batch card)$/.test(n.name)) && n.layout && n.layout.mode === \"vertical\" && JSON.stringify(n.layout.padding) !== \"[16,16,16,16]\" && n.layout.padding && n.layout.padding.some((p) => p > 0)) { b.raw(\"node.set\", { ids: [n.id], props: { padding: [16, 16, 16, 16] } }); stats.pad = (stats.pad || 0) + 1; } // 5.\n    if (n.name === \"Table card\") {");
  return s;
});
console.log("edit15 ok");
