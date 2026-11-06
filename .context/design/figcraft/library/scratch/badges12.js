// Batch plan library additions (live app): Status badge "Prep finished" (md, sm); "Finished analysis" reads "Analysis finished"
const cp = require("child_process");
const SP = "C:/Users/pc/AppData/Local/Temp/claude/d--SGSI-LIMS/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad";
const call = (command, params) => { const r = JSON.parse(cp.execFileSync("node", [SP + "/fcall.js", "run_command", JSON.stringify({ command, params })], { cwd: SP, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); if (r && r.error) throw new Error(command + ": " + JSON.stringify(r)); return r; };
const get = (id) => JSON.parse(cp.execFileSync("node", [SP + "/fcall.js", "get_node", JSON.stringify({ id, depth: 2 })], { cwd: SP, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const out = [];
for (const [prep, fin, size] of [[42397, 42409, "md"], [42400, 42412, "sm"]]) {
  const r = call("component.addVariant", { id: prep, property: "Status", value: "Prep finished" });
  out.push(["new", size, JSON.stringify(r).slice(0, 200)]);
  call("node.set", { ids: [fin], props: { name: `Status=Analysis finished, Size=${size}` } });
}
console.log(out.map((x) => x.join(" ")).join("\n"));
