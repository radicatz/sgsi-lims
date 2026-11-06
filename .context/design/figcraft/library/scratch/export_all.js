// export every screen frame (Desktop, Tablet, Mobile Phone pages) as PNG into .context/design/export/<desktop|tablet|phone>/
const fs = require("fs"), cp = require("child_process");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const SRC = "D:/SGSI/LIMS/.context/design/figcraft/SGSI-LIMS-screens.figcraft", OUT = "D:/SGSI/LIMS/.context/design/export";
const JSON_OUT = "C:/Users/pc/AppData/Local/Temp/export.json";
cp.execFileSync(CLI, ["convert", SRC, JSON_OUT]);
const J = JSON.parse(fs.readFileSync(JSON_OUT)), N = J.nodes;
const list = [];
for (const p of J.pages) { const pg = N[p]; if (pg.name === "Library") continue; for (const c of pg.children) { const n = N[c]; if (n.type === "frame" && !/reference$| edit( dark)?$|^Properties ref$|^Select reference$/.test(n.name)) list.push({ id: c, name: n.name, page: pg.name, w: n.width, h: n.height }); } }
const safe = (s) => s.replace(/[\\/:*?"<>|]/g, "!").trim();
const used = {};
let ok = 0, bad = [];
for (const f of list) {
  let name = safe(f.name); if (used[name]) name += " (" + f.page + ")"; used[name] = 1;
  const dir = OUT + "/" + name.split("-")[0].toLowerCase(); fs.mkdirSync(dir, { recursive: true });
  const out = dir + "/" + name + ".png";
  const r = cp.spawnSync(CLI, ["export", SRC, "--node", String(f.id), "--out", out, "--scale", "1"], { encoding: "utf8" });
  if (r.status === 0 && fs.existsSync(out)) ok++; else bad.push(f.name);
}
console.log("frames", list.length, "exported", ok, "failed", bad);
fs.writeFileSync(OUT + "/_list.json", JSON.stringify(list.map((f) => f.page + " | " + f.name + " | " + Math.round(f.w) + "x" + Math.round(f.h)), null, 1));
