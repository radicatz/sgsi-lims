const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/docs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const f = "Job_Order_Screen_Plan.md";
const raw = fs.readFileSync(f, "utf8"), crlf = raw.includes(CR);
let s = raw.split(CR).join(LF).trimEnd() + LF + LF + `## Revision 9 · Parameter selection like the prototype · PLAN, waiting for go (Nov 3, 2026)

**Why the frames differ from the prototype (found Nov 3, 2026).** No note asks for a different selection; it is drift.
- The plan ("How many pills") has **9 groups including Coking coal**. The row B build (\`rowB.js\`, list GROUPS) only drew the first 8, so the Coking coal group is missing from Create · Desktop, Tablet, Phone and the frames built on them.
- P11 used a separate, shorter list (Moisture, Proximate, Sulfur, Calorific, plus five coking pills named CSN, Gray-King, Y value, G index, Roga), written before the research of Oct 28. The prototype and the plan's own standards table use the **eight tests on the lab's list**: CSN, Gieseler Plastometer, Gray King Coke Type, Dilatometer Test, Sapozhnikov Test, G Index, CRI/CSR, Maceral Analysis. The plan's pill list (Dilatation, Ro, Macerals, Roga, Y value, Gray-King, CSR/CRI) is out of date and is corrected here.
- The coverage tag exists only as one hidden text in the Parameter pill ("ISO, GB/T" since Revision 8) and shows on four pills in P11 only. The **SUB** (subcontracted) tag and the unavailable pills under ASTM are not drawn at all.

**Plan.**
1. **New library component "Coverage tag"**: small mono tag (Accent/accent-100 fill, Accent/accent-text text, radius 4, 10 px, padding 0/4). Variants: Standards (the standards that have a method, as separate layers: "ISO", "GB/T") and Subcontracted ("SUB"). Parameter pill gets a Tag slot with an instance of it instead of the single text.
2. **Parameter pill** states stay Off, On, Locked, Unavailable (grey, no icon, tag visible). Pills have no icon when Off or On (Revision 7); long names wrap the row like the prototype.
3. **Create frames at three sizes** show all 9 groups and the eight coking tests with their full names. Default (ASTM): Gray King, Sapozhnikov and G Index unavailable with tag ISO + GB/T; CRI/CSR with SUB. P11 (ASTM + GB/T): the same pills available, tags still shown for the pills not covered by every standard. Phone keeps the accordion; the Coking coal group is one more accordion item.
4. **Frames rebuilt:** Create D, T, P Step 1; P1; P11; Contact and Signatory dropdown and sheet frames; Remove contact; Ash analysis open (17 frames, taller because of the Coking group). Docs: the pill list table above is corrected to the eight tests.
5. The prototype already has this behaviour; no prototype change.
` ;
fs.writeFileSync(f, crlf ? s.split(LF).join(CR) : s);
console.log("ok");
