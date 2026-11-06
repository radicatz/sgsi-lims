const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
let s = fs.readFileSync("rowC.js", "utf8").split(CRLF).join(LF);
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing: " + a.slice(0, 80)); s = s.replace(a, b); };

// owner edits of Nov 3 (Overview · Desktop and the other desktop frames): company in foreground, icon items muted, Past due semibold
rep('b.text(left, company, { style: "Body/Medium", color: "Text/text-secondary", name: "Meta", fill: true });',
    'b.text(left, company, { style: "Body/Medium", color: "Text/foreground", name: "Meta", fill: true });');
rep('{ const tk = bad ? "Feedback/error" : "Text/text-secondary";', '{ const tk = bad ? "Feedback/error" : "Text/text-muted";');
rep('b.text(it, t, { style: "Body small/Regular", color: bad ? "Feedback/error" : "Text/text-secondary", name: "Meta" });',
    'b.text(it, t, { style: "Body small/Regular", color: bad ? "Feedback/error" : "Text/text-muted", name: "Meta" });');
rep('if (bad) b.text(it, "Past due", { style: "Body small/Medium", color: "Feedback/error", name: "Past due" });',
    'if (bad) b.text(it, "Past due", { style: "Body small/SemiBold", color: "Feedback/error", name: "Past due" });');

// Overview batch list: name and date on one line, "Started" as its own muted text
rep(`      const col = b.frame(pr, { name: "Label", w: 150, h: 34, layout: "v", gap: 0, sizeH: "hug", sizeV: "hug" });
      b.text(col, p[1], { style: "Body small/Medium", color: "Text/foreground", name: "Name" });
      b.text(col, p[2], { style: "Caption/Regular", color: "Text/text-secondary", name: "Date" });`,
`      const col = b.frame(pr, { name: "Label", w: 300, h: 20, layout: "h", gap: 8, cross: "center", sizeH: "fill", sizeV: "hug" });
      const nm = b.text(col, p[1], { style: "Body small/Medium", color: "Text/foreground", name: "Name" }); b.raw("node.set", { ids: [nm], props: { sizingH: "fill" } });
      const st = /^Started /.test(p[2]);
      if (st) b.text(col, "Started", { style: "Caption/Regular", color: "Text/text-muted", name: "Date" });
      b.text(col, st ? p[2].replace(/^Started /, "") : p[2], { style: "Caption/Regular", color: "Text/text-secondary", name: "Date" });`);

// helpers for rows D and E
if (!s.includes("exports.H = ")) s = s.trimEnd() + LF + LF + "// shared with rows D and E" + LF + "exports.H = { TITLE, page, card, cardHead, detailFrame, batches, awaiting, overview, scrimOver, dialogAt, KIND, JO0142, JO0139, WCONTENT };" + LF;
fs.writeFileSync("rowC.js", s);
console.log("edit10 ok");
