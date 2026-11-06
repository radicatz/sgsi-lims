// nest Value, Value 2, Value 3 in a "Values" frame in every Select variant that does not have one (live app, through the bridge)
const cp = require("child_process");
const J = require("./r8/U.json"), N = J.nodes;
const SP = "C:/Users/pc/AppData/Local/Temp/claude/d--SGSI-LIMS/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad";
const call = (command, params) => JSON.parse(cp.execFileSync("node", [SP + "/fcall.js", "run_command", JSON.stringify({ command, params })], { cwd: SP, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const set = Object.values(N).find((n) => n.type === "componentSet" && n.name === "Select");
const out = [];
for (const vid of set.children) {
  if (vid === 42734) { out.push("Default md: done by hand"); continue; }
  const v = N[vid], input = (v.children || []).map((c) => N[c]).find((c) => c.name === "Input");
  if (!input) { out.push(v.name + ": no Input"); continue; }
  const kids = input.children.map((c) => N[c]);
  if (kids.some((k) => k.name === "Values")) { out.push(v.name + ": already"); continue; }
  const texts = kids.filter((k) => k.type === "text" && /^Value/.test(k.name));
  if (texts.length !== 3) { out.push(v.name + ": " + texts.length + " value texts"); continue; }
  const f = call("node.create", { type: "frame", name: "Values", parent: input.id, index: 0, x: 0, y: 0, width: 100, height: 22, props: { fill: "none", layout: "horizontal", gap: 8, mainAlign: "min", crossAlign: "min", sizingH: "fill", sizingV: "hug" } });
  const r = call("node.reparent", { ids: texts.map((t) => t.id), parent: f.id });
  out.push(v.name + ": frame " + f.id + " " + JSON.stringify(r));
}
console.log(out.join("\n"));
