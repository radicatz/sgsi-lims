const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library");
let s = fs.readFileSync("screens/reg.js", "utf8").split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 80)); s = s.split(a).join(b); };
rep(`  for (const [k, t] of Object.entries(o.texts || {})) {
    const nm = v.names || v.off;
    const pos = /^\\d+$/.test(k) ? v.texts[+k].pos : nm[k];
    if (pos === undefined) throw new Error(\`no text \${k} in \${setName} / \${variant}\`);
    this.raw("node.set", { ids: [id + pos], props: { characters: t } });
  }`,
`  for (const [k, t] of Object.entries(o.texts || {})) {
    const nm = v.names || v.off;
    const pos = /^\\d+$/.test(k) ? v.texts[+k].pos : nm[k];
    if (pos === undefined) throw new Error(\`no text \${k} in \${setName} / \${variant}\`);
    // values are never joined with a dot: "a · b · c" fills the split layers "Name", "Name 2", "Name 3" (Revision 8)
    const i = v.texts ? v.texts.findIndex((x) => x.pos === pos) : -1, sibs = [];
    if (i >= 0) for (let j = i + 1; v.texts[j] && v.texts[j].name === v.texts[i].name + " " + (sibs.length + 2); j++) sibs.push(v.texts[j]);
    const parts = String(t).split(" · ");
    if (!sibs.length) { this.raw("node.set", { ids: [id + pos], props: { characters: parts.join(", ") } }); continue; }
    this.raw("node.set", { ids: [id + pos], props: { characters: parts.length > sibs.length + 1 ? parts.slice(0, 1).join("") : parts[0] } });
    sibs.forEach((sb, j) => {
      const last = j === sibs.length - 1, val = last && parts.length > j + 2 ? parts.slice(j + 1).join(", ") : parts[j + 1];
      this.raw("node.set", { ids: [id + sb.pos], props: val === undefined ? { visible: false } : { characters: val, visible: true } });
    });
  }`);
fs.writeFileSync("screens/reg.js", s);

// row A head: no subtitle (Revision 8: counts are gone)
let a = fs.readFileSync("screens/rowA.js", "utf8");
if (!a.includes('  b.text(left, count, { style: "Body small/Regular", color: "Text/text-secondary", name: "Subtitle" });')) throw new Error("rowA subtitle line not found");
a = a.replace('  b.text(left, count, { style: "Body small/Regular", color: "Text/text-secondary", name: "Subtitle" });\n', "");
fs.writeFileSync("screens/rowA.js", a);

// toast sentence
let c = fs.readFileSync("screens/rowC.js", "utf8");
c = c.split("JO-2026-0143 submitted · add the sample IDs next").join("JO-2026-0143 submitted. Add the sample IDs next.");
fs.writeFileSync("screens/rowC.js", c);
console.log("edit4 ok");
