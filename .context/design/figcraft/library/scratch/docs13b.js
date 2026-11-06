const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";
edit(D + "/Batch/Batch_Screen_Plan.md", (s) => {
  s = rep(s, "## 13 · Revision 2 · Batch list, and the Nov 4 feedback · PLAN, waiting for go", "## 13 · Revision 2 · Batch list, and the Nov 4 feedback · BUILT (Nov 4, 2026)");
  return s.trimEnd() + LF + LF + `### 13.9 Build status (Nov 4, 2026)

- **Batch list:** 9 frames in canvas row **G  Batch list** above row F (\`library/screens/rowG.js\`; naming rules for screen 01 in \`naming.js\`): Default (D, T, P), Batches_to_prepare (Preparation role, Created and Preparation chips on, 4 rows), Empty, No_results, Filters (desktop side sheet 480, phone bottom sheet) and Add_batch_choose_job_order (Dialog sm with the job order select and options). Demo data as in 13.4; B-2026-0413 shows the past due date in red with a separate "Past due" text.
- **Photos** on desktop and tablet is a centered Dialog lg (800 wide) with the gallery and the Add photo tile; the phone keeps the bottom sheet.
- **Small search** is used for the Reception scan field in the card toolbar (desktop and tablet).
- **Tokens:** \`tokens/sgsi-tokens.json\` and \`.css\` re-exported (three light values), \`Design_Tokens.md\` regenerated and its change log kept (the generator writes only current values, so \`library/scratch/tokdoc13.js\` re-adds the log: run it after \`tokdoc.js\`).
- **Build chain:** \`build-screens.js C,D,E,G,F\` (G before F, which starts below G), then \`rev8.js D\`, \`naming.js\`, \`fit.js\`, deploy, \`export_all.js\`.
- Open point 12 used its default (G above F).
`;
});
edit(D + "/Job Order/Job_Order_Screen_Plan.md", (s) => {
  s = rep(s, "## Revision 11 · Tab order (Nov 4, 2026) · PLAN, waiting for go", "## Revision 11 · Tab order (Nov 4, 2026) · BUILT (Nov 4, 2026)");
  return s.trimEnd() + LF + LF + `Built: \`rowC.js\` \`tabs()\` now lists Overview, Samples, Batches, Files, CoA, History; rows C, D and E were rebuilt, so every job order detail frame at three sizes has the new order.
`;
});
edit(D + "/Design System/Frame_Naming.md", (s) => rep(s, "| 01 | Batch_list | Not drawn yet |", "| 01 | Batch_list | 01 Default, 02 Batches_to_prepare, 03 Empty, 04 No_results, 05 Filters, 06 Add_batch_choose_job_order |"));
edit(D + "/Design System/Frame_Naming.md", (s) => rep(s, "Canvas row F holds the batch detail frames.", "Canvas row G holds the batch list frames and row F the batch detail frames."));
edit(D + "/README.md", (s) => rep(s, "Frames built Nov 4; prototype update pending |", "Batch page and batch list frames built Nov 4; prototype update pending |"));
const M = "C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/batch-screens-planned.md";
fs.appendFileSync(M, LF + "**Nov 4 2026 (later):** batch list (rowG.js, 9 frames, row G above F), photos as a centered Dialog lg, small Search in card toolbars, job order tabs Overview/Samples/Batches, tokens re-exported (primary-100, st-analysis-100, error-100 light). Build chain: build-screens.js C,D,E,G,F -> rev8.js D -> naming.js -> fit.js -> deploy -> export_all.js; run scratch/tokdoc13.js after tokdoc.js to keep the change log. 86 screens exported. Prototype still not updated." + LF);
console.log("docs13b ok");
