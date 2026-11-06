const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";
edit(D + "/Batch/Batch_Screen_Plan.md", (s) => {
  s = rep(s, "Nov 4, 2026 · **PLAN, waiting for go** ·", "Nov 4, 2026 · **BUILT (frames, Nov 4, 2026; prototype not updated yet)** ·");
  s = rep(s, "Total **24 frames** (14 desktop, 4 tablet, 6 phone)", "Total **24 frames** (13 desktop, 4 tablet, 7 phone)");
  return s.trimEnd() + LF + LF + `## 12 · Build status (Nov 4, 2026)

All 24 frames are in the FigCraft file, canvas row **F  Batch detail** below row E on each page, named \`{Size}-04-Batches-02-Batch_detail-VV-Variant\` (backup before: \`backup/SGSI-LIMS-screens.before-rowF.figcraft\`). PNGs in \`.context/design/export/\`.

- **Library:** Status badge **Prep finished** (md, sm) added; "Finished analysis" renamed **Analysis finished**.
- **Generator:** \`library/screens/rowF.js\` (\`build-screens.js F\`), then \`rev8.js D\`, \`naming.js\` (module 04 rules added) and the new \`fit.js\`.
- **\`fit.js\`:** the shell's Body kept a fixed height, so long pages were cut at 1018 (desktop) and 908 (tablet). The pass grows Body (and fixed overlay frames with their scrim and side sheet) to the main column's height. It also fixed 19 job order frames, among them the tablet Overview, whose Batches card was hidden.
- **Deviations from section 6:** the photos column uses a thumbnail and a "+1" count (the icon set has no paperclip or camera glyph); the condition warning is a warning icon after the select; the tablet Analysis table is wider than the card and clips at the right (sideways scroll in the app); the Sheets' placeholder body fill is cleared so content starts at the top.
- **Not done yet:** the prototype update (section 8), touch-target check on phone, the tablet Reception table keeps no Lab code column.
`;
});
edit(D + "/Design System/Frame_Naming.md", (s) => s.trimEnd() + LF + LF + `## Batches screens (module 04)

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Batch_list | Not drawn yet |
| 02 | Batch_detail | 01 Reception_receiving, 02 Reception_print_labels, 03 Reception_photos, 04 Reception_ready, 05 Reception_confirm_with_fewer, 06 Reception_hold_sample, 07 Reception_scan_label, 08 Reception_confirmed, 09 Batch_number_edit, 10 Preparation_entering_ADL, 11 Preparation_finished, 12 Analysis_entering_results, 13 Analysis_finished_upload_RoA, 14 Completed |

Canvas row F holds the batch detail frames. \`fit.js\` runs after \`naming.js\` on every build.
`);
edit(D + "/README.md", (s) => s.replace("| Batch | `Batch/Batch_Screen_Plan.md` | The batch page: Reception, Preparation, Analysis, RoA and Complete batch | Plan, waiting for go |", "| Batch | `Batch/Batch_Screen_Plan.md` | The batch page: Reception, Preparation, Analysis, RoA and Complete batch | Frames built Nov 4; prototype update pending |"));
const M = "C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/batch-screens-planned.md";
fs.appendFileSync(M, LF + "**Nov 4 2026 BUILT:** 24 frames deployed (row F), library badges Prep finished / Analysis finished, rowF.js + fit.js (grows Body to the main column; run after naming.js). Build chain: build-screens.js <rows> -> rev8.js D -> naming.js -> fit.js -> deploy -> export_all. Prototype not updated." + LF);
console.log("docs ok");
