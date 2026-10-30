// Colour tokens (Light + Dark) from the prototype styles -> FigCraft variable steps and a hex -> variable-name map.
const fs = require("fs");
const css = fs.readFileSync("D:/SGSI/LIMS/.context/prototype/src/styles.css", "utf8");
const grab = (re) => { const m = css.match(re); const o = {}; if (m) [...m[1].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].forEach((x) => (o[x[1]] = x[2].toUpperCase())); return o; };
const light = grab(/(^|\n):root\{([\s\S]*?)\n\}/); // placeholder, replaced below
function block(startRe) { const i = css.search(startRe); const j = css.indexOf("}", css.indexOf("{", i)); const body = css.slice(i, j); const o = {}; [...body.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})(?![0-9A-Fa-f])/g)].forEach((x) => (o[x[1]] = x[2].toUpperCase())); return o; }
const L = block(/^:root\{/m), D = block(/^:root\[data-theme="dark"\]\{/m);
const GROUP = (n) => /^primary/.test(n) ? "Primary" : /^accent/.test(n) ? "Accent" : /^(rust)/.test(n) ? "Rust" : /^(background|shell|card|muted|sand|border|divider)/.test(n) ? "Surface" : /^(foreground|heading|text)/.test(n) ? "Text" : /^st-/.test(n) ? "Status" : /^(success|warning|error|info)/.test(n) ? "Feedback" : /^(action|brand|nav)/.test(n) ? "Action" : "Other";
const USER = (() => { try { const m = JSON.parse(fs.readFileSync("D:/SGSI/LIMS/.context/design/figcraft/tokens/sgsi-tokens.json", "utf8")); const mm = m.meta || m; const col = Object.values(mm.variableCollections)[0]; const ids = col.modes.map((x) => x.modeId || x.id); const hx = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase(); const o = {}; Object.values(mm.variables).forEach((v) => { if (v.resolvedType === "COLOR") o[v.name] = { Light: hx(v.valuesByMode[ids[0]]), Dark: hx(v.valuesByMode[ids[1]]) }; }); return o; } catch (e) { return {}; } })();
const names = Object.keys(L);
const steps = [{ command: "variable.createCollection", params: { name: "SGSI tokens", modes: ["Light", "Dark"] } }];
const map = {};
names.forEach((n) => {
  const nm = GROUP(n) + "/" + n;
  steps.push({ command: "variable.create", params: { collection: "SGSI tokens", name: nm, type: "color", values: USER[nm] || { Light: L[n], Dark: D[n] || L[n] } } });
  if (!map[L[n]]) map[L[n]] = nm;
});
[["radius/xs", 4], ["radius/sm", 8], ["radius/md", 12], ["radius/lg", 16]].forEach(([n, v]) => steps.push({ command: "variable.create", params: { collection: "SGSI tokens", name: n, type: "number", values: { Light: v, Dark: v } } }));
module.exports = { steps, map, count: names.length };
if (require.main === module) console.log(names.length, "colours;", Object.keys(map).length, "unique light hexes");
