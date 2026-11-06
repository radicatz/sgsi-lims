const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";

// 1. design rule: card anatomy
edit(D + "/Design System/Component_Library_Plan.md", (s) => s.trimEnd() + LF + LF + `## Card anatomy (Nov 4, 2026, owner rule) · applied with Batch plan Revision 3

Source: the owner's frame "Desktop-04-Batches-02-Batch_detail-12-Analysis_entering_results ref".

\`\`\`
Card (Surface/card, border, radius 16, padding 16 / 20, gap 16)
  Card top row (vertical, gap 0, hug)
    Card head    (horizontal, height fixed 32, space between, centered): Title, Actions, short texts (a count such as "4 of 6 saved", a status such as "Ready for analysis")
    Card content (vertical, gap 8, hug): description line, warning or info note, header line with avatar, inline alert
  Card body: table, list, grid, fields, checklist (the checklist sits inside the same card, below the table)
\`\`\`

- **Card head** is always 32 px high. Anything taller than one line (a subtitle, a note, a second row of filters) goes into **Card content**, never into the head.
- A card with nothing but a head and a body has no Card content frame.
- **Table card** (a card that only holds a table and its pager, as on the list pages) has padding **16 on all four sides**; table rows inside it drop their own side padding (cells keep 8).
- On tablet and phone, when the actions do not fit in 32 px, the head keeps the title and the primary action; the other actions (search, secondary buttons) move to the first line of Card content.
`);

// 2. Batch plan: decision B, Revision 3 plan
edit(D + "/Batch/Batch_Screen_Plan.md", (s) => {
  s = rep(s, "| 1 | Breadcrumb on the batch page: start at Batches (sidebar module) or at Job orders (where most users come from)? | Batches, with the job order as a link in the header |",
    "| 1 | Breadcrumb on the batch page: start at Batches (sidebar module) or at Job orders (where most users come from)? | **Decided Nov 4 (option B):** one fixed (location-based) breadcrumb, Batches > batch number, whatever the entry route; the sidebar always highlights Batches; the job order is a link in the header (research: section 14.1) |");
  return s.trimEnd() + LF + LF + `## 14 · Revision 3 · Navigation decision and the desktop feedback of Nov 4 · PLAN, waiting for go

### 14.1 Navigation (decided Nov 4, option B)

A batch can be reached from the Batches list and from a job order's Batches tab. Guidance for a page with several parents is to pick **one canonical, location-based** trail (Nielsen Norman Group, as quoted by the Visa and Michelin design systems); AssayNet also shows the menu location, and Clarity LIMS has no breadcrumb. Decision:

| Part | Rule |
| --- | --- |
| Breadcrumb | Always **Batches > B-2026-0422**, whichever way the user came |
| Sidebar | **Batches** active on the batch list and on every batch page |
| Job order link | The first item of the meta row under the batch number shows the job order number in **Primary/primary** (icon and text). It is a link: it opens that job order's detail on its **Batches** tab, with the job order's own breadcrumb (Job orders > JO-2026-0137) and Job orders active in the sidebar. Hover underlines it |
| Prototype | Changes from "Job orders > JO > batch" to the rule above (Job Order prototype plan, section 14) |

### 14.2 Feedback and where it applies

| # | Feedback | Frames (all sizes where the structure exists) |
| --- | --- | --- |
| 1 | **Card anatomy**: Card top row = Card head (fixed 32) + Card content (\`../Design System/Component_Library_Plan.md\`, Card anatomy) | Reception (D 01 to 09, T 01, 03), Preparation (D 10, 11; T 10), Analysis (D 12 to 14; T 12; P 12, 13), RoA (D 13, 14; P 13); the analysis header line, the RoA hint, the returned note (08) move to Card content |
| 2 | Checklist inside the card, below the table (as in the owner's edit of 04) | Reception D 01, 02, 03, 05, 06, 09 and T 01, 03 (Preparation and Analysis already have it inside) |
| 3 | Condition cell: a 14 px icon after every select, **check-circle in Feedback/success** for Good and warning in Feedback/warning otherwise, so all selects have the same width ("Reception card ref") | Reception tables D 01 to 06, 08, 09; T 01, 03 |
| 4 | Job order number in the meta row in Primary/primary, documented as a link (14.1) | Every batch detail frame (24) |
| 5 | Preparation, entering: "4 of 6 saved" moves into the head, beside Save all | D 10, T 10 (phone: above the sticky bar) |
| 6 | Preparation, finished: "Ready for analysis" (check-circle and text in Feedback/success) at the right end of the head, on the title's line | D 11 |
| 7 | Batch list Samples column as "n / n", the same format as the job order list ("6 / 8", "12 / 12", "0 / 5": arrived or received over expected) | List D 01, 02, 05, 06; phone cards |
| 8 | Batch list Filters: a centered **Dialog lg** instead of the side sheet (desktop); the phone keeps the bottom sheet | D 05 |
| 9 | Table card padding 16 on all sides (Card anatomy) | Batch list D 01, 02, 05, 06 (job order list: Job Order plan Revision 12) |

### 14.3 Build steps (after go)

1. \`rowF.js\` and \`rowG.js\`: helpers for Card top row, Card head 32 and Card content; the changes above.
2. Rebuild rows C, D, E, G, F (with the Job Order Revision 12 changes), then \`rev8.js D\`, \`naming.js\`, \`fit.js\`; deploy when the open file has no unsaved edits; export.
3. The owner's reference frames ("... 12-Analysis_entering_results ref", "Reception card ref") are kept and skipped by the generators.
4. Build status, memory, commit. Prototype rows are added to the pending update.

### 14.4 Open points

| # | Question | Default |
| --- | --- | --- |
| 15 | The reference analysis card has padding 16 on all four sides; the card padding rule says 16 / 20. Which for all cards? | Keep 16 / 20 for cards; 16 all round only for Table cards (as the feedback says) |
| 16 | Tablet heads whose actions do not fit in 32 px (Reception toolbar, Analysis) | Title and primary action in the head; search and secondary buttons on the first line of Card content |
| 17 | Gap between Card head and Card content | 0, as in the reference (the head's 32 px carries the space) |
`;
});

// 3. Job Order plan: Revision 12
edit(D + "/Job Order/Job_Order_Screen_Plan.md", (s) => s.trimEnd() + LF + LF + `## Revision 12 · Desktop feedback of Nov 4, 2026 · PLAN, waiting for go

| # | Feedback | Frames |
| --- | --- | --- |
| 1 | **Overline without "WORK"**: the Split "WORK" + date (or "JOB ORDERS") becomes one text: "TUESDAY 21 OCTOBER 2026" on desktop, "JOB ORDERS" on tablet and phone (the owner already changed List · Desktop) | 21 frames: job order list T, P, Empty D; every Create frame behind the overlay (D 10, T 1); batch list D 6, T 1, P 2 ("BATCHES") |
| 2 | **Table card** padding 16 on all sides; the library table rows inside drop their side padding (cells keep 8) | Job order list D 01 and the 10 Create backdrops; T 01 and the tablet Create backdrop |
| 3 | **Card head fixed 32**; short texts stay in the head, notes and hints move to **Card content** (Card anatomy, \`../Design System/Component_Library_Plan.md\`) | Samples card: hint "Paste IDs from Excel ..." (D, T 06), inline alert (D 11); Batches card: awaiting-arrival note (D 05, Add batch D 02 backdrop); every other card head (Properties, Overview Batches, CoA) is set to 32 |
| 4 | **Add batch** buttons in the Batches tab are **sm** | Batches card head D, T 03, 04, 05; the Add batch and P7 backdrops (D 04-01, 04-02, 05-03) |

Built with Batch plan Revision 3 (\`../Batch/Batch_Screen_Plan.md\` section 14).
`);

// 4. prototype plan rows
edit(D + "/Job Order/Job_Order_Prototype_Plan.md", (s) => rep(s, "| Contact person field | Name, phone, email as separate texts, chevron at the right |",
  "| Batch page navigation (decided Nov 4, option B) | Breadcrumb always Batches > batch number; sidebar Batches; the job order number in the batch header is a link (Primary/primary, underline on hover) to the job order's Batches tab | Breadcrumb Job orders > JO > batch, Job orders active (`reception.js` 398, `app.js` 277) |\n" +
  "| Cards and lists (Revision 12, Batch Revision 3) | Card head 32 px with title, actions and short texts; notes and hints below it; checklist inside the card under the table; Table cards padded 16; overline without \"WORK\"; Add batch buttons small in the Batches tab; batch list samples as \"6 / 8\"; batch filters in a centered dialog; condition select followed by a status icon | Older layout |\n" +
  "| Contact person field | Name, phone, email as separate texts, chevron at the right |"));
console.log("docs14 ok");
