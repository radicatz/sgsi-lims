const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/docs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const f = "Job_Order_Screen_Plan.md";
const raw = fs.readFileSync(f, "utf8"), crlf = raw.includes(CR);
let s = raw.split(CR).join(LF);
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 60)); s = s.replace(a, b); };
rep("## Revision 9 · Parameter selection like the prototype · PLAN, waiting for go (Nov 3, 2026)", "## Revision 9 · Parameter selection like the prototype · BUILT (Nov 3, 2026)");
rep("| Coking coal | CSN, Gieseler, Dilatation, Ro, Macerals, G index, Y value, Roga, Gray-King, CSR/CRI | 10 |\n| **Total** | | **36** |", "| Coking coal | CSN (Crucible Swelling Number), Gieseler Plastometer, Gray King Coke Type, Dilatometer Test, Sapozhnikov Test, G – Index (G Caking Index Test), CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction), Maceral Analysis (Petrographic): the eight tests of the lab (corrected Nov 3, 2026; earlier drafts listed Ro, Roga and Y value) | 8 |\n| **Total** | | **34** |");
rep("The form shows **36 pills in 9 groups**", "The form shows **34 pills in 9 groups**");
rep("Coking coal  [CSN] [Gieseler] [Dilatation] [Ro] [Macerals] [G index] [Y value] [Roga] [Gray-King] [CSR/CRI]", "Coking coal  [CSN] [Gieseler] [Gray King Coke Type ISO GB/T] [Dilatometer] [Sapozhnikov ISO GB/T] [G Index ISO GB/T] [CRI/CSR SUB] [Maceral]");
s = s.trimEnd() + LF + LF + `### 9.1 Build status (Nov 3, 2026)

- **Library:** new component set **Coverage tag** (Kind: ISO and GB/T, ISO, GB/T, Subcontracted; amber soft fill, 10 px mono, the standards as separate layers 3 px apart). **Parameter pill** (Off, On, Unavailable) now holds a Tag instance with the properties **Show tag** (boolean) and **Tag** (instance swap); the old Coverage text and the "Show coverage" property are gone.
- **Create frames** (17, desktop, tablet, phone) show all 9 groups. Default (ASTM only): Gray King Coke Type, Sapozhnikov Test and G – Index are Unavailable with the ISO and GB/T tag; CRI/CSR carries SUB. P11 (ASTM + GB/T): those three are available, G – Index is on, the tags stay; "15 selected". Frame height 2000 (P1 +150, P11 +160), signatory dropdown anchor moved to y 1458.
- Clean-up pass fixed one bug of Revision 8: untouched default text in hidden "source" layers was being copied over real values (the three contacts in the dropdown all showed Budi's phone and email). The contact and signatory dropdowns are correct now.
- The prototype already behaves this way; no prototype change.
`;
fs.writeFileSync(f, crlf ? s.split(LF).join(CR) : s);
fs.appendFileSync("C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/job-order-redraw-planned.md", LF + "**Nov 3 2026 Revision 9 BUILT:** Coverage tag component set + Tag slot in Parameter pill (made live in the app, pill9.js), rowB.js shows all 9 groups with the eight coking tests, unavailable pills and tags. Backups before-rev9*.figcraft. Do not rerun rev8.js L; stage D skips untouched default source layers." + LF);
console.log("docs ok");
