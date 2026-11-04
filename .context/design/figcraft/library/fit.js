// Grow every desktop and tablet screen frame to show its whole main column (the shell's Body keeps a fixed height).
// node fit.js <in.figcraft> <out.figcraft>
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/fit.json"]);
const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/fit.json")), N = J.nodes;
const steps = [], out = [];
for (const p of J.pages) {
  const pg = N[p]; if (!["Desktop", "Tablet"].includes(pg.name)) continue;
  for (const c of pg.children) {
    const r = N[c]; if (r.type !== "frame" || /reference$| edit( dark)?$|^Properties ref$|^Select reference$/.test(r.name)) continue;
    const kids = (r.children || []).map((k) => N[k]);
    const body = kids.find((k) => k.name === "Body"); if (!body) continue;
    const main = (body.children || []).map((k) => N[k]).find((k) => k.name === "Main"); if (!main) continue;
    if (main.height <= body.height + 0.5) continue;
    const top = kids.find((k) => k.name === "Top bar"), th = top ? top.height : 72;
    const h = Math.ceil(main.height);
    steps.push({ command: "node.set", params: { ids: [body.id], props: { height: h } } });
    if (r.height < th + h - 0.5) {
      const H = th + h;
      steps.push({ command: "node.set", params: { ids: [r.id], props: { height: H } } });
      for (const k of kids) if ((k.name === "Scrim" || k.name === "Side sheet") && k.child_layout && k.child_layout.absolute) steps.push({ command: "node.set", params: { ids: [k.id], props: { height: H } } });
    }
    out.push(r.name + " " + Math.round(body.height) + " -> " + h);
  }
}
console.log(out.join("\n"));
steps.push({ command: "file.save", params: { path: o } });
run({ steps, expect: [] }, i, o, "fit");
