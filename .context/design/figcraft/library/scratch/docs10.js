const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/docs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };

edit("Job_Order_Screen_Plan.md", (s) => {
  s = rep(s, '| | CoA · Sent | D | "Sent via WhatsApp to Budi Hartono · 25 Oct", stepper complete |', '| | CoA · Sent | D | "Sent by WhatsApp to" + recipient + date as separate texts, stepper complete |');
  s = rep(s, '| | P2 Submitted toast | D | Empty Samples tab with "JO-2026-0143 submitted · add the sample IDs next" |', '| | P2 Submitted toast | D | Empty Samples tab with "JO-2026-0143 submitted. Add the sample IDs next." |');
  return s.trimEnd() + LF + LF + `## Revision 10 · Owner edits carried to every size, rows D and E · BUILT (Nov 3, 2026)

### 10.1 Owner edits applied to all sizes

Found by comparing the file with the Revision 8 build (the owner edited desktop frames only):
- **Job order header** (every detail frame, D, T, P): company name \`Text/foreground\` (was secondary); the contact, PO and due date items and their icons \`Text/text-muted\` (were secondary); "Past due" in Body small/SemiBold, still in the error colour.
- **Overview batch list** (Overview D, T, P and the dark preview): name and date on one line (Label frame horizontal, gap 8, name fills); an analysis in progress shows "Started" in \`Text/text-muted\` and the date in secondary as two texts.
- The stepper's green line no longer runs past the last step when every step is done.

### 10.2 Rows D and E

Canvas order on every page: A list, B create, C detail, D add batch, E CoA and actions (row titles "D  Add batch", "E  CoA and actions"). Generators \`library/screens/rowD.js\` and \`rowE.js\`, run with row C (\`build-screens.js C,D,E\`); they place themselves below the lowest frame of each page.

| Frame | Size | Content |
| --- | --- | --- |
| Add batch · Desktop, · Tablet | D, T | Dialog xl over Batches · Empty of JO-2026-0137 (16 samples, ASTM and GB/T). Job order number and company as two texts; Batch no. B-2026-0422 with the pattern hint; Batch date read-only; Deadline; Standard chips ASTM (on) and GB/T with "One standard per batch. This job order has ASTM and GB/T."; Samples "8 of 16 selected", Select all (16) and Clear, checkbox grid; parameter pills with HGI added ("+ HGI compared with the job order"); Priority, CoC no., Notes; Cancel and Create batch |
| Add batch · Late samples · Desktop | D | Over Batches · Samples awaiting arrival (JO-2026-0139, ASTM only): note "Settings copied from B-2026-0421: ASTM, TM + Prox + TS + CV and Standard priority."; BNM-3507 ticked first with "Awaiting arrival" and "from B-2026-0421" as separate texts; "Awaiting arrival comes first and is ticked for you." |
| Add batch · Step 1, Step 2 · Phone | P | Step 1 Samples (full-width checkbox list, sticky "Next (8 selected)"); Step 2 Details (fields stacked, sticky Back and Create batch) |
| CoA · Mark sent · Desktop | D | CoA tab of JO-2026-0141 (Reported, stepper on Sent to client): CoA card with Download PDF, Print, Mark sent; facts Number, Revision, Published (date and name), Signatory (name and title), Covers; Built from B-2026-0416 with RoA-0416 and the approver. Dialog md "Mark CoA as sent": Date sent, Recipient (pre-filled, helper), Channel segmented (Hard copy, Email, WhatsApp on, Other), Note; Cancel and Confirm |
| CoA · Sent · Desktop | D | JO-2026-0141 Delivered, stepper complete; green line "Sent by WhatsApp to", **Sari Wulandari**, 25 Oct 2026; button Add another send |
| CoA · Mark sent sheet · Phone | P | The CoA tab on phone with the same form in a bottom sheet |
| Cancel job order · P7 · Desktop | D | Over JO-2026-0137 (no sample received): destructive dialog "Cancel JO-2026-0137?", Reason (required), Keep job order and Cancel job order |

**Deviations:** the CoA frames use **JO-2026-0141** (PT Kaltara Energi Prima, contact Sari Wulandari), not 0142, because 0142 is still in analysis. Add batch on phone keeps the two steps of section 8; the tablet keeps the modal.

### 10.3 Tokens

The owner changed 11 colour values (mostly dark mode, plus light \`Text/text-muted\` \`#A4A39A\`). \`tokens/sgsi-tokens.json\` and \`tokens/sgsi-tokens.css\` were re-exported and \`Design_Tokens.md\` regenerated (its section 1 lists the changes). Contrast to review: muted text is 2.5 to 1 on card in light (2.4 in dark), below 4.5, and the header now uses it for contact, PO and due date.

### 10.4 Still open

Touch targets on tablet and phone (the phone checkbox list rows are 14 px apart, not 44 px tall); the tablet detail frames clip below 908 px; the prototype update (Prototype plan section 14).
`;
});

edit("Job_Order_Prototype_Plan.md", (s) => {
  s = rep(s, "Three rounds of owner feedback on Nov 3 changed the frames (screen plan sections 6.5f, Revision 8 and Revision 9).", "Four rounds of owner feedback on Nov 3 changed the frames (screen plan sections 6.5f and Revisions 8, 9 and 10).");
  s = rep(s, "| Contact person field | Name, phone, email as separate texts, chevron at the right |",
    "| Header colours (Revision 10) | Company in `foreground`; contact, PO, due date and their icons in `text-muted`; \"Past due\" semibold in the error colour | `.dmeta` in one colour (`app2.js` 475) |\n" +
    "| Overview batch list (Revision 10) | Name and date on one line; \"Started\" muted, date secondary, as two texts | Name above date (`app2.js` 530) |\n" +
    "| Add batch (Revision 10) | Job order number and company as two texts in the modal head; \"Settings copied from B-2026-0421: ASTM, TM + Prox + TS + CV and Standard priority.\"; \"Awaiting arrival\" and \"from B-…\" as two texts; links Select all and Clear without a dot between them; toast \"B-2026-0418 created. 4 samples, ASTM.\"; the phone version is drawn now, so its \"Not drawn yet\" tag goes | `app2.js` 609 to 636 |\n" +
    "| CoA tab and Mark sent (Revision 10) | Facts as separate texts (date and name, name and title, batches and samples); sent line \"Sent by WhatsApp to\" + recipient + date; \"Built from\" row: batch, RoA, \"Approved by …\"; dialog text \"CoA-JO-2026-0141-1 for PT Kaltara Energi Prima.\"; toast \"CoA marked as sent. JO-2026-0141 is delivered.\" | `app2.js` 798 to 837 |\n" +
    "| Colour tokens (Revision 10) | 11 values changed on Nov 3 (see Design_Tokens.md section 1) | `styles.css` `:root` and dark blocks still hold the older values: copy them from `tokens/sgsi-tokens.css` |\n" +
    "| Contact person field | Name, phone, email as separate texts, chevron at the right |");
  s = rep(s, "4. Coverage tags as separate pills (`coverTag` returns a list; the pill renders one tag per standard).",
    "4. Coverage tags as separate pills (`coverTag` returns a list; the pill renders one tag per standard).\n4a. Revision 10: header colours, Overview batch list, Add batch and CoA texts, and the token values in `styles.css`.");
  return s;
});
fs.appendFileSync("C:/Users/pc/.claude/projects/d--SGSI-LIMS/memory/job-order-redraw-planned.md", LF + "**Nov 3 2026 Revision 10 BUILT:** owner header and Overview batch-list edits carried to all sizes (rowC.js); rows D (rowD.js) and E (rowE.js) built, run as `build-screens.js C,D,E`, placed below the lowest frame of each page; tokens JSON/CSS re-exported, Design_Tokens.md updated. All rows of the job order redraw are now built; prototype update (plan section 14) still waiting for go." + LF);
console.log("docs ok");
