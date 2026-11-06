const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = "\n";
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";
edit(D + "/My Work/My_Work_Screen_Plan.md", (s) => {
  s = rep(s, "**Revision 2: PLAN, waiting for go**", "**Revision 2: BUILT (Nov 4, 2026)**");
  return s.trimEnd() + LF + LF + `## 13 · Build status (Nov 4, 2026)

All 14 frames are in the FigCraft file, canvas row **H  My work** below row F (\`library/screens/rowH.js\`; naming rules for module 01 in \`naming.js\`; backup before: \`backup/SGSI-LIMS-screens.before-mywork.figcraft\`). PNGs in \`.context/design/export/\`.

- **Overview** (Lab_admin D, T, P; Preparation, Analyst, CSO D; All_caught_up D, P): header with the date overline and no subtitle; Work in progress card with the library WIP row; queue cards (Queue card, Overdue tone when something is past due; the past-due text is the second part of the card's warning line); Recent activity card (8 items) on desktop, below the queues on tablet (5 items), a row on phone; the sidebar item My work shows its count pill on desktop.
- **Queue** (Batches_to_receive D, T, P; CoAs_to_send_multi_select D, T, P): breadcrumb, queue tabs with counts, search, company, Past due only, a Table card with Waiting (warning icon and red when past due), batch or CoA, job order link, samples "n / n", status, deadline with "Past due", note and one action button. The multi-select frames show the mixed header checkbox, two of three rows ticked and the Sticky action bar ("2 selected", Clear, Download PDFs). Phone: one card per item.
- **Placement:** rows D, F and G ignore row H; row F tells row H where it ends (\`b.fEnd\`). Build chain: \`build-screens.js C,D,E,G,F,H\`, \`rev8.js D\`, \`naming.js\`, \`cards.js\`, \`fit.js\`.
- **Deviations:** the Activity item library component has one text, so the actor is not bold; the collapsed tablet sidebar shows no count (the Nav item rail has no pill yet); the phone queue rows and Work in progress card are built from frames (no library component).
- Not done: the prototype page (screens first).
`;
});
edit(D + "/Design System/Frame_Naming.md", (s) => s.trimEnd() + LF + LF + `## My work (module 01)

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Overview | 01 Lab_admin, 02 Preparation, 03 Analyst, 04 CSO, 05 All_caught_up |
| 02 | Queue | 01 Batches_to_receive, 02 CoAs_to_send_multi_select |

Canvas row H holds the My work frames.
`);
edit(D + "/README.md", (s) => rep(s, "Revision 2 (v1 queues) planned Nov 4, waiting for go |", "Revision 2 (v1 queues) frames built Nov 4 |"));
fs.appendFileSync("C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/batch-screens-planned.md", LF + "**Nov 4 2026 (My work):** My_Work_Screen_Plan Revision 2 rewritten for v1 queues and built: 14 frames, rowH.js, canvas row H below F, naming module 01. Chain: build-screens C,D,E,G,F,H -> rev8 D -> naming -> cards -> fit. 100 screens exported. Remaining v1 groups: Dashboard (~15), Reports/CoA review (~6), master data (~24), admin (~25-30). Prototype still deferred." + LF);
console.log("docs16 ok");
