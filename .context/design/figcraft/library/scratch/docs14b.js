const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";
edit(D + "/Batch/Batch_Screen_Plan.md", (s) => {
  s = rep(s, "## 14 · Revision 3 · Navigation decision and the desktop feedback of Nov 4 · PLAN, waiting for go", "## 14 · Revision 3 · Navigation decision and the desktop feedback of Nov 4 · BUILT (Nov 4, 2026)");
  return s.trimEnd() + LF + LF + `### 14.5 Build status (Nov 4, 2026)

- Built as planned (14.2): card anatomy, checklist inside the Reception card, condition icon (check-circle for Good, warning otherwise) after every select, job order link in Primary/primary, "4 of 6 saved" beside Save all, "Ready for analysis" at the right end of the Preparation head, samples as "n / n" on the batch list, filters as a centered Dialog lg (desktop), Table cards padded 16.
- **Card content** has its own 8 px top padding (open point 17 answered by the owner: the content carries the space, the head and the content touch).
- **New pass \`library/cards.js\`** (runs after \`naming.js\`, before \`fit.js\`): removes the "WORK" layer of overline Splits, wraps a Card head and its notes or hints into a Card top row with a Card content, sets every Card head to 32 px, pads Table cards 16 and clears the side padding of the table rows inside. It also fixes the frames of row A that are not rebuilt.
- **Tablet:** the Reception toolbar (small search, Mark all arrived, Print labels) sits in Card content; the head keeps the title and Confirm reception. Open points 15 and 16 used their defaults.
- **Placement fix:** the row generators ignore the owner's reference frames and stale frames of the other rows when they choose where to start, so the canvas order is A, B, C, D, E, G (batch list), F (batch detail). The previous deploy had put D and E below G; this build puts them back in order.
- The owner's frames "... 12-Analysis_entering_results ref" and "Reception card ref" are untouched; frames 04, 08 and 10 that the owner edited by hand were regenerated to the same structure.
- Build chain: \`build-screens.js C,D,E,G,F\`, \`rev8.js D\`, \`naming.js\`, \`cards.js\`, \`fit.js\`, deploy, \`export_all.js\`.
`;
});
edit(D + "/Job Order/Job_Order_Screen_Plan.md", (s) => {
  s = rep(s, "## Revision 12 · Desktop feedback of Nov 4, 2026 · PLAN, waiting for go", "## Revision 12 · Desktop feedback of Nov 4, 2026 · BUILT (Nov 4, 2026)");
  return s.trimEnd() + LF + LF + "Built with \`library/cards.js\` and the changed generators (\`../Batch/Batch_Screen_Plan.md\` section 14.5): 21 overlines lost the \"WORK\" layer, 17 Table cards are padded 16, every Card head is 32 px, notes and hints sit in Card content (Samples hint, inline alert, awaiting-arrival note), and the Add batch buttons of the Batches tab are small.\n";
});
edit(D + "/Design System/Component_Library_Plan.md", (s) => rep(s, "## Card anatomy (Nov 4, 2026, owner rule) · applied with Batch plan Revision 3", "## Card anatomy (Nov 4, 2026, owner rule) · built (see Batch plan 14.5)"));
const M = "C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/batch-screens-planned.md";
fs.appendFileSync(M, LF + "**Nov 4 2026 (cards):** card anatomy built (Card top row = Card head fixed 32 + Card content with 8 px top padding; Table cards pad 16) via library/cards.js; breadcrumb decision B (Batches > batch, sidebar Batches, job order link primary); canvas order A,B,C,D,E,G(list),F(detail); placement ignores owner ref frames. Chain: build-screens C,D,E,G,F -> rev8 D -> naming -> cards -> fit -> deploy -> export_all. Prototype still not updated." + LF);
console.log("docs14b ok");
