const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/docs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
edit("Job_Order_Screen_Plan.md", (s) => {
  const a = "## Revision 8 · Second feedback of Nov 3, 2026 · PLAN, waiting for go";
  if (!s.includes(a)) throw new Error("heading not found");
  s = s.replace(a, "## Revision 8 · Second feedback of Nov 3, 2026 · BUILT (Nov 3, 2026)");
  return s.trimEnd() + LF + LF + `### 8.9 Build status (Nov 3, 2026)

Built in the FigCraft file (backup before: backup/SGSI-LIMS-screens.before-rev8.figcraft). No text in the file joins values with a middle dot any more (checked by a scan of every text layer).
- **Library:** 76 component texts were split into separate layers by \`library/rev8.js\` (stage L). A text in a horizontal row gets extra texts after it; a text in a two-line cell gets a **Split** frame (horizontal, gap 6) and the original is kept hidden as "... source". **Select** (Value, Value 2, Value 3, gap 8) and **Key-value row** (gap 12) carry three value layers; the unused ones are hidden. The table sets "Table header row batches" and "Table row batches" were rebuilt with separate **Preparation** and **Analysis** columns (\`library/rev8lb.js\`). Documentation labels use commas.
- **Deviations from 8.1:** the Parameter pill coverage tag stays one layer, written "ISO, GB/T" (its visibility is bound to the Show coverage property, which cannot drive extra layers); the Drop zone hint is "PDF, XLS or CSV, up to 10 MB"; the row titles read "A  Job orders list" (two spaces); the overline "WORK  TUESDAY 21 OCTOBER 2026" is two texts.
- **Rows B and C rebuilt** (40 frames), row A patched in place (stage D, \`rev8.js\`): the job order header, Overview properties, Overview batch list, Batches tab, Create contact field and dropdown, and the list rows follow 8.2 to 8.6. The "128 job orders ..." subtitle is gone behind the Create overlay.
- **Reference frames kept:** Select reference, Properties ref, Batches · Desktop reference, and the dark P5 copy, renamed "Samples · P5 Locked row tooltip · Desktop dark reference". The generators skip frames whose name ends in "reference".
- **Notes:** the Key-value instances inside the frame "Properties ref" picked up the new split layers, so its contact and expected samples now show as separate texts. Touch-target checks on tablet and phone are still open.
`;
});
edit("Job_Order_Prototype_Plan.md", (s) => {
  const b = "## 14 · Nov 3 feedback the prototype still has to take (Nov 3, 2026) · PLAN, waiting for go";
  if (!s.includes(b)) throw new Error("heading 14 not found");
  return s.replace(b, "## 14 · Nov 3 feedback the prototype still has to take (Nov 3, 2026) · PLAN, frames built, prototype not updated yet");
});
fs.appendFileSync("C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/job-order-redraw-planned.md", LF + "**Nov 3 2026 Revision 8 BUILT:** pipeline in library/rev8.js (stage L splits library texts, stage D clean-up) plus rev8lb.js (batch table sets); rows B and C rebuilt; base file before: backup/SGSI-LIMS-screens.before-rev8.figcraft. Gotchas: node.create inside a main component gives unpredictable ids (instances get copies), node.reparent and component.bindProperty are blocked there. Prototype (v31) NOT updated yet; republishing the artifact needs the owner's confirmation first." + LF);
console.log("docs ok");
