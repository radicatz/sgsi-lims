const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
const rw = (f, fn) => { let s = fs.readFileSync(f, "utf8").split(CRLF).join(LF); s = fn(s); fs.writeFileSync(f, s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 80)); return s.replace(a, b); };

// 1. job order tabs: Overview, Samples, Batches, Files, CoA, History
rw("rowC.js", (s) => rep(s, 'const T = [["Overview", null], ["Batches", counts.b], ["Samples", counts.s], ["Files", counts.f], ["CoA", null], ["History", null]];', 'const T = [["Overview", null], ["Samples", counts.s], ["Batches", counts.b], ["Files", counts.f], ["CoA", null], ["History", null]];'));

rw("rowF.js", (s) => {
  // 2. small search in card toolbars
  s = rep(s, 'b.instV(a, "Search", "Size=md, State=" + (o.scan ? "Filled" : "Default")', 'b.instV(a, "Search", "Size=sm, State=" + (o.scan ? "Filled" : "Default")');
  // 3. photos: centered dialog on desktop and tablet
  s = rep(s, "function photosBody(b, bd, phone) {", "function photosBody(b, bd, phone, size) {");
  s = rep(s, 'thumb(b, p, "Image", phone ? 150 : 200);', 'thumb(b, p, "Image", size || (phone ? 150 : 200));');
  s = rep(s, 'thumb(b, g, "Empty", phone ? 150 : 200);', 'thumb(b, g, "Empty", size || (phone ? 150 : 200));');
  const desk = s.indexOf('  { const s = receptionFrame(b, DX * 2, D1, "desktop", { variant: "Reception_photos" });');
  const deskEnd = s.indexOf("\n", desk);
  s = s.slice(0, desk) + '  { const s = receptionFrame(b, DX * 2, D1, "desktop", { variant: "Reception_photos" }); fix(b, s, "desktop", 1200); photosDialog(b, s, 1440, 64); }' + s.slice(deskEnd);
  const tab = s.indexOf('  { const s = receptionFrame(b, TX, T1, "tablet", { variant: "Reception_photos" });');
  const tabEnd = s.indexOf("\n", tab);
  s = s.slice(0, tab) + '  { const s = receptionFrame(b, TX, T1, "tablet", { variant: "Reception_photos" }); fix(b, s, "tablet", 1220); photosDialog(b, s, 834, 0); }' + s.slice(tabEnd);
  s = rep(s, "// ---------- frames ----------", `// photos: centered Dialog lg (desktop and tablet), three photos per row
function photosDialog(b, s, Wd, shift) {
  const v = b.v("Dialog", "Type=Default, Size=lg");
  const id = dialogAt(b, s.root, "lg", 0, 120, "Photos of KEP-3303", "Tag each photo. Photos lock when reception is confirmed.", "Close", "Add photo", (bd) => { b.raw("node.set", { ids: [bd], props: { fill: "none", mainAlign: "min" } }); photosBody(b, bd, false, 176); });
  const w = b.reg.N[v.id].width || 640;
  b.raw("node.set", { ids: [id], props: { x: Math.round((Wd - w) / 2) + shift } });
}

// ---------- frames ----------`);
  // row G (batch list) sits above row F
  s = rep(s, "const clearF = (b) =>", "const isG = (n) => /^(Batch list ·|(Desktop|Tablet|Phone)-04-Batches-01-)/.test(n.name || \"\") || (n.name === \"Row title\" && /^G( ·|  )/.test(n.characters || \"\"));\nconst clearF = (b) =>");
  s = rep(s, "const n = N[id]; if (isF(n)) continue; m = Math.max", "const n = N[id]; if (isF(n) || isG(n)) continue; m = Math.max");
  s = rep(s, "  return out;\n}\nconst isG", "  if (b.gEnd) for (const k of Object.keys(out)) out[k] = Math.max(out[k], b.gEnd[k]);\n  return out;\n}\nconst isG");
  return s;
});
console.log("edit13 ok");
