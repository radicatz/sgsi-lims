// follow-ups of the docs reorganisation: textual "Reception plan" mentions, archive banner, Batch plan wording, reception.js header, README, docs index
const fs = require("fs");
const D = "D:/SGSI/LIMS/.context/docs";
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); const t = fn(s); if (t !== s) fs.writeFileSync(file, crlf ? t.split(LF).join(CR) : t); return t !== s; };
// 1. "Reception plan" -> archived file (first mention with the path)
for (const f of ["Job Order/Job_Order_Screen_Plan.md", "Job Order/Job_Order_Prototype_Plan.md", "Project/Coal_LIMS_Development_Spec.md"]) {
  edit(D + "/" + f, (s) => { let first = true; return s.replace(/(?<!archived )Reception plan(?! \(`)/g, () => { if (first) { first = false; return "archived Reception plan (`../archive/Reception_Preparation_Screen_Plan.md`; current: `../Batch/Batch_Screen_Plan.md`)"; } return "archived Reception plan"; }); });
}
// 2. archive banner
edit(D + "/archive/Reception_Preparation_Screen_Plan.md", (s) => s.startsWith("> **Archived") ? s : "> **Archived on Nov 4, 2026.** Superseded by `../Batch/Batch_Screen_Plan.md`, which restates the current design of the batch page. Kept as history; other documents cite its section numbers (12 to 15).\n\n" + s);
// 3. Batch plan wording
edit(D + "/Batch/Batch_Screen_Plan.md", (s) => s.replace("This plan replaces `../archive/Reception_Preparation_Screen_Plan.md` (now in `../archive/`).", "This plan replaces `../archive/Reception_Preparation_Screen_Plan.md`."));
// 4. reception.js header: the current plan is the Batch plan
edit("D:/SGSI/LIMS/.context/prototype/src/reception.js", (s) => s.replace("plan: .context/docs/archive/Reception_Preparation_Screen_Plan.md.", "plan: .context/docs/Batch/Batch_Screen_Plan.md (history: .context/docs/archive/Reception_Preparation_Screen_Plan.md)."));
// 5. README docs row
edit("D:/SGSI/LIMS/README.md", (s) => s.replace(/\| `\.context\/docs\/` \| [^\n]*\n/, "| `.context/docs/` | Our written plans and specifications, one folder per screen group: `Project/` (development spec, research plan), `Design System/` (component library, design tokens, frame naming), `Job Order/`, `Batch/`, `My Work/`, `Dashboard/`, and `archive/` for superseded plans. `.context/docs/README.md` lists every file |\n"));
// 6. docs index
fs.writeFileSync(D + "/README.md", `# Docs

Nov 4, 2026. Plans and specifications for SGSI LIMS, one folder per screen group. Links inside the files are relative to the file's own folder.

| Folder | File | What it is | Status |
| --- | --- | --- | --- |
| Project | \`Coal_LIMS_Development_Spec.md\` | Build-side specification: features, screens (S-00 to S-30), flows, data model, rules, decisions | Living; v1 scope in section 1.1 |
| Project | \`Coal_LIMS_Research_and_Project_Plan.md\` | First research, scope, stack, roadmap and vendor sources (Oct 16 to 19) | Background; the spec overrides it where they differ |
| Design System | \`Component_Library_Plan.md\` | FigCraft component library (Revision 2) | Built Oct 30 |
| Design System | \`Design_Tokens.md\` | Colour, radius and elevation tokens, Light and Dark, with contrast | Current (Nov 3 values) |
| Design System | \`Frame_Naming.md\` | Naming of every frame and exported PNG | Rule |
| Job Order | \`Job_Order_Screen_Plan.md\` | Job order screens: list, create, detail, add batch, CoA and actions (rows A to E) | Built through Revision 10 |
| Job Order | \`Job_Order_Prototype_Plan.md\` | The clickable prototype (artifact) and what it still has to take | Section 14 waits for go |
| Batch | \`Batch_Screen_Plan.md\` | The batch page: Reception, Preparation, Analysis, RoA and Complete batch | Plan, waiting for go |
| My Work | \`My_Work_Screen_Plan.md\` | My work queues per role | Plan; to be redrawn on the new library |
| Dashboard | \`Dashboard_Screen_Plan.md\` | Dashboard for go-live (SIM Lab parity) | Plan; to be redrawn |
| Dashboard | \`Dashboard_v2_Screen_Plan.md\` | Dashboard version 2 (Operations, Quality, Client) after go-live | Plan; to be redrawn |
| archive | \`Reception_Preparation_Screen_Plan.md\` | The first batch-page plan with Revisions B and C | Superseded by the Batch plan; kept as history |

New screen groups get their own folder and a \`<Group>_Screen_Plan.md\`; a plan that is replaced moves to \`archive/\` with a banner naming its successor.
`);
console.log("follow-ups done");
