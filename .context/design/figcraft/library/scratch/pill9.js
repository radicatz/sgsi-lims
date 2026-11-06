// Revision 9 stage P2 (live app): Parameter pill gets a Tag instance (Show tag + Tag swap) instead of the Coverage text
const cp = require("child_process");
const SP = "C:/Users/pc/AppData/Local/Temp/claude/d--SGSI-LIMS/47836466-5a4a-49c3-8dbb-f21a1e9d2c68/scratchpad";
const call = (command, params) => { const r = JSON.parse(cp.execFileSync("node", [SP + "/fcall.js", "run_command", JSON.stringify({ command, params })], { cwd: SP, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); if (r.error) throw new Error(command + ": " + JSON.stringify(r)); return r; };
const SET = 43274, TAG = 164233;
const V = [[43250, 48071], [43252, 48073], [48069, 48076]];
const inst = [];
for (const [v] of V) {
  const r = call("instance.create", { component: TAG, parent: v });
  call("node.set", { ids: [r.id], props: { name: "Tag", visible: false } });
  inst.push(r.id);
}
for (const [, t] of V) call("edit.delete", { ids: [t] });
call("component.deleteProperty", { id: SET, name: "Show coverage" });
V.forEach((_, k) => {
  if (k === 0) { call("component.addProperty", { id: SET, name: "Show tag", type: "boolean", layer: inst[k], default: false }); call("component.addProperty", { id: SET, name: "Tag", type: "instanceSwap", layer: inst[k] }); }
  else { call("component.bindProperty", { layer: inst[k], property: "Show tag", field: "visible" }); call("component.bindProperty", { layer: inst[k], property: "Tag", field: "mainComponent" }); }
});
console.log("tag instances", inst.join(","));
