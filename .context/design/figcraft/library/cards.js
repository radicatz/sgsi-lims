// Card rules of Nov 4, 2026 (Component_Library_Plan.md, "Card anatomy"), applied to every screen frame. node cards.js <in> <out>
//  1. the "WORK" layer of every overline Split is removed
//  2. a Card head followed by notes or hints gets a Card top row (Card head + Card content)
//  3. every Card head is a fixed 32 px high
//  5. every card is padded 16 on all four sides (card, Properties, Batches, Samples ...)
//  4. Table cards are padded 16 on all sides, the table rows inside keep no side padding of their own
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/cards.json"]);
const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/cards.json")), N = J.nodes;
const b = new B(J.next_id);
const SKIP = /reference$| edit( dark)?$| ref$|^Properties ref$|^Select reference$/;
const CONTENT = new Set(["Card content", "Hint", "Inline alert", "Note", "Returned note"]);
const frames = [];
for (const p of J.pages) { const pg = N[p]; if (pg.name === "Library") continue; for (const c of pg.children) if (N[c].type === "frame" && !SKIP.test(N[c].name)) frames.push(c); }
const stats = { work: 0, wrap: 0, head: 0, table: 0 };
const walk = (id, inInst, fn) => { const n = N[id]; const ii = inInst || n.type === "instance"; fn(n, ii); (n.children || []).forEach((c) => walk(c, ii, fn)); };
for (const fr of frames) {
  const todo = [];
  walk(fr, false, (n, ii) => { if (!ii) todo.push(n); });
  for (const n of todo) {
    if (n.type === "text" && n.characters === "WORK" && N[n.parent].name === "Split") { b.raw("edit.delete", { ids: [n.id] }); stats.work++; continue; }
    if (n.type !== "frame") continue;
    const kids = (n.children || []).map((c) => N[c]);
    const hi = kids.findIndex((k) => k.name === "Card head");
    if (hi >= 0) {
      const head = kids[hi];
      const after = []; for (let k = hi + 1; k < kids.length && CONTENT.has(kids[k].name); k++) after.push(kids[k]);
      if (after.length && n.name !== "Card top row") {
        const top = b.frame(n.id, { name: "Card top row", w: Math.max(head.width, 100), h: 60, layout: "v", gap: 0, sizeH: "fill", sizeV: "hug", index: hi });
        b.raw("node.reparent", { ids: [head.id], parent: top });
        b.raw("node.set", { ids: [head.id], props: { sizingH: "fill" } });
        const inner = after.length === 1 && after[0].name === "Card content" ? after[0].id : null;
        let content = inner;
        if (!inner) { content = b.frame(top, { name: "Card content", w: 400, h: 40, layout: "v", gap: 8, pad: [0, 0, 0, 0], sizeH: "fill", sizeV: "hug" }); after.forEach((a) => b.raw("node.reparent", { ids: [a.id], parent: content })); }
        else { b.raw("node.reparent", { ids: [inner], parent: top }); b.raw("node.set", { ids: [inner], props: { sizingH: "fill", padding: [0, 0, 0, 0] } }); }
        stats.wrap++;
      }
      b.raw("node.set", { ids: [head.id], props: { height: 32, sizingV: "fixed" } }); stats.head++;
    }
    if ((/ card$/.test(n.name) || /^(Properties|Batches|Samples|Batch card)$/.test(n.name)) && n.layout && n.layout.mode === "vertical" && JSON.stringify(n.layout.padding) !== "[16,16,16,16]" && n.layout.padding && n.layout.padding.some((p) => p > 0)) { b.raw("node.set", { ids: [n.id], props: { padding: [16, 16, 16, 16] } }); stats.pad = (stats.pad || 0) + 1; } // 5.
    if (n.name === "Table card") {
      b.raw("node.set", { ids: [n.id], props: { padding: [16, 16, 16, 16] } });
      for (const k of kids) {
        if (k.type === "instance" && /^Table (header )?row/.test(k.name)) { b.raw("node.set", { ids: [k.id], props: { padding: [0, 0, 0, 0] } }); const row = (k.children || []).map((c) => N[c]).find((c) => c.name === "Row"); if (row) b.raw("node.set", { ids: [row.id], props: { padding: [0, 0, 0, 0] } }); }
        if (k.name === "Footer") b.raw("node.set", { ids: [k.id], props: { padding: [8, 0, 8, 0] } });
      }
      stats.table++;
    }
  }
}
console.log(JSON.stringify(stats));
b.raw("file.save", { path: o }); b.expect = [];
run(b, i, o, "cards");
