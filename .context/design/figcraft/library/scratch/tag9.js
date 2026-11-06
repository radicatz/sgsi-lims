// "ISO and GB/T" tag: two separate tag pills (live app)
const cp = require("child_process");
const SP = "C:/Users/pc/AppData/Local/Temp/claude/d--SGSI-LIMS/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad";
const call = (command, params) => { const r = JSON.parse(cp.execFileSync("node", [SP + "/fcall.js", "run_command", JSON.stringify({ command, params })], { cwd: SP, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); if (r.error) throw new Error(command + ": " + JSON.stringify(r)); return r; };
const V = 164233, TXT = [164234, 164235];
call("node.set", { ids: [V], props: { fill: "none", gap: 4, padding: [0, 0, 0, 0] } });
TXT.forEach((t, k) => {
  const f = call("node.create", { type: "frame", name: "Tag", parent: V, index: k, x: 0, y: 0, width: 30, height: 14, props: { fill: { $var: "Accent/accent-100" }, cornerRadius: 4, layout: "horizontal", gap: 0, padding: [0, 4, 0, 4], mainAlign: "center", crossAlign: "center", sizingH: "hug", sizingV: "hug" } });
  call("node.reparent", { ids: [t], parent: f.id });
});
console.log("ok");
