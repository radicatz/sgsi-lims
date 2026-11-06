const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
let s = fs.readFileSync("rev8.js", "utf8").split(CRLF).join(LF);
const a = s.indexOf("    if (insideInstance) {"), e = s.indexOf("    // plain layer on a screen");
if (a < 0 || e < 0) throw new Error("block not found");
s = s.slice(0, a) + `    if (insideInstance) {
      const parts = n.characters.split(SEP2), isSrc = / source$/.test(n.name), base = n.name.replace(/ source$/, "");
      let targets = [];
      if (isSrc) { const sp = N[par.children[par.children.indexOf(n.id) + 1]]; if (sp && sp.name === "Split") targets = sp.children.map((c) => N[c]).filter((c) => c.type === "text"); }
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
        b.raw("node.set", { ids: [n.id], props: { characters: n.characters.replace(/\\s*·\\s*/g, ", ") } });
        fallback.push(pageName(N, J, n.id) + " | " + n.characters);
      }
      continue;
    }
` + s.slice(e);
fs.writeFileSync("rev8.js", s);
console.log("edit6 ok");
