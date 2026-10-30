// run steps with figcraft-cli on a base file, verify predicted ids
const fs = require("fs"), cp = require("child_process"), path = require("path");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
module.exports = function run(b, base, out, tag) {
  const sf = path.join(__dirname, "..", "scratch", tag + ".json");
  fs.mkdirSync(path.dirname(sf), { recursive: true });
  fs.writeFileSync(sf, JSON.stringify(b.steps));
  const t = Date.now();
  const r = cp.spawnSync(CLI, ["run", sf, "--in", base, "--out", out], { encoding: "utf8", maxBuffer: 1 << 30 });
  const lines = r.stdout.split("\n").filter((l) => l.startsWith("{")).map((l) => JSON.parse(l));
  const errs = lines.filter((l) => !l.ok);
  let bad = 0;
  for (const [i, id] of b.expect) { const l = lines[i]; if (l && l.ok && l.result && l.result.id !== undefined && l.result.id !== id) { if (bad++ < 3) console.log("ID MISMATCH step", i, l.command, "expected", id, "got", l.result.id); } }
  console.log(`steps ${b.steps.length}, errors ${errs.length}, id mismatches ${bad}, ${((Date.now() - t) / 1000).toFixed(0)}s`);
  errs.slice(0, 8).forEach((e) => console.log(JSON.stringify(e).slice(0, 300)));
  return { lines, errs, bad };
};
