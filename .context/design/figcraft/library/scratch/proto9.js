const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/docs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const f = "Job_Order_Prototype_Plan.md";
const raw = fs.readFileSync(f, "utf8"), crlf = raw.includes(CR);
let s = raw.split(CR).join(LF);
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); s = s.replace(a, b); };

rep('the toast "JO-2026-0143 submitted · add the sample IDs next"', 'the toast "JO-2026-0143 submitted. Add the sample IDs next."');
rep("## 14 · Nov 3 feedback the prototype still has to take (Nov 3, 2026) · PLAN, frames built, prototype not updated yet",
  "## 14 · Nov 3 feedback the prototype still has to take (Nov 3, 2026) · PLAN, waiting for go");
rep("Two rounds of owner feedback on Nov 3 changed the frames (screen plan sections 6.5f and Revision 8). Prototype version 31 has none of it yet. Done together with the section 13 points in one update.",
  "Three rounds of owner feedback on Nov 3 changed the frames (screen plan sections 6.5f, Revision 8 and Revision 9). Prototype version 31 has none of it yet. Done together with the section 13 points in one update (version 32).");
rep('| Create | Coverage tag "ISO" "GB/T" as two texts; Apply button "Apply 3 parameters"; dependency note as sentences | `data.js` 33, `app2.js` 209, 283, 290 |',
  '| Create | Apply button "Apply 3 parameters"; dependency note as sentences ("FC needs IM, Ash and VM, so those stay on.") | `app2.js` 209, 290 |\n' +
  '| Coverage tags (Revision 9) | One amber tag **per standard**: "ISO" and "GB/T" are two separate tag pills, 4 px apart; "SUB" stays one tag. Unavailable pills keep their tags | One tag "ISO · GB/T" built by `coverTag` (`data.js` 33, `app2.js` 284) |\n' +
  '| Parameter groups (Revision 9) | All 9 groups with the eight coking tests; already the same in the prototype | No change |\n' +
  '| Contact person field | Name, phone, email as separate texts, chevron at the right | Already separate spans (`app2.js` 139); only the Overview contact (`app2.js` 510) still joins phone and email |');
s = s.trimEnd() + LF + LF + `### 14.1 Order of work and checks

1. Text rule first (rule 8.1): replace every " · " join in \`app.js\`, \`app2.js\`, \`data.js\` and \`reception.js\` with separate elements, a comma or a sentence, so later edits do not reintroduce it. A test fails the build if a rendered page contains " · ".
2. Section 13 points (Preparation pill without icon, no icons on pills, Search field, "e.g. 12", Samples choice removed, toast).
3. Detail screens: header icon row, Overview properties and batch list, Batches table columns, Samples tab (Registered Samples, Action column, row colours, batch colour), tabs.
4. Coverage tags as separate pills (\`coverTag\` returns a list; the pill renders one tag per standard).
5. Re-run the headless suites (all earlier checks plus C1 to C8), add checks for: no " · " in any view, the Action column states, separate Preparation and Analysis columns, two tags on Gray King Coke Type under ASTM. Then publish to the same artifact URL as version 32 (https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo). Publishing changes the shared link, so it waits for the owner's go.
`;
fs.writeFileSync(f, crlf ? s.split(LF).join(CR) : s);
console.log("ok");
