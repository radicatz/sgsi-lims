const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";

edit(D + "/Batch/Batch_Screen_Plan.md", (s) => s.trimEnd() + LF + LF + `## 13 · Revision 2 · Batch list, and the Nov 4 feedback · PLAN, waiting for go

Written Nov 4, 2026. The sidebar item **Batches** must land on a list of all batches; choosing a row opens the batch page built in Revision 1. The owner also asked for the Photos view as a centered modal, and changed the library by hand (section 13.6).

### 13.1 Decisions (from the discussion of Nov 4)

| # | Decision | Status |
| --- | --- | --- |
| L1 | Clicking a row opens the **full batch page**; no preview pane (the spec's LIMS 4 bottom pane is dropped: it does not work on a phone) | Default, accepted |
| L2 | The batch page opens on the tab that matches the status: Created opens Reception, Preparation and Prep finished open Preparation, Analysis and Analysis finished open Analysis, Completed opens Analysis with the RoA | Default, accepted |
| L3 | The list opens **pre-filtered per role**: Preparation on Created and Preparation ("Batches to prepare"); Analyst on Prep finished and Analysis; Lab admin and CSO on All. The chips show it and can be changed; the same queues as My work | Default, accepted |
| L4 | **Add batch** on the list first asks for the job order (a dialog with a job order select), then opens the existing Add batch dialog for it | Default, accepted |
| L5 | From a job order's Batches tab a row still opens the batch page directly; the breadcrumb there starts at Batches (section 4) | As built |

### 13.2 The list page (spec S-07, \`/batches\`)

\`\`\`
Sidebar      Batches active
Header       Batches                                                   [+ Add batch]
Chips        [All 46] [Created 3] [Preparation 4] [Prep finished 2] [Analysis 6] [Analysis finished 1] [Completed 30]
Filters      [Search batch, sample or job order]  [Company]  [Deadline]  [Filters]
Table card   Batch no. | Job order | Standard | Samples | Status | Deadline | RoA | >
Footer       Pager
\`\`\`

| Column | Content |
| --- | --- |
| Batch no. | Number (mono, heading colour) and the batch date as a second line |
| Job order | Job order number (primary colour) and the company as a second line |
| Standard | Standard tag |
| Samples | Arrived and expected as two texts ("6" and "of 8"); after reception the count only |
| Status | Status badge (Created, Receiving, Preparation, Prep finished, Analysis, Analysis finished, Completed) |
| Deadline | Date; past due in the error colour with a separate "Past due" text |
| RoA | RoA number with a PDF icon when uploaded, otherwise "—" |
| > | Chevron; the whole row is the link |

Tablet keeps Batch no., Job order, Status, Deadline and the chevron. Phone shows one card per batch: number and status, job order and company, samples, deadline; the chips scroll sideways; **Add batch** is a sticky button.

No subtitle under the title and no count lines (rule of Nov 3). Page-level filters use the md search; card toolbars use the new **sm** search (13.6).

### 13.3 Frames (module 04 Batches, screen 01 Batch_list)

| VV | Variant | Sizes | Shows |
| --- | --- | --- | --- |
| 01 | Default | D, T, P | Lab admin; All; 10 batches over 6 job orders, one past due |
| 02 | Batches_to_prepare | D | Preparation role: chips Created and Preparation on, 4 rows |
| 03 | Empty | D | No batches yet: empty state, "Batches are added from a job order", Add batch |
| 04 | No_results | D | Search "B-2025" with no match: "No batches match", Clear filters |
| 05 | Filters | D, P | Desktop: filter panel (side sheet 480: company, status, standard, batch date and deadline ranges, job order); phone: bottom sheet |
| 06 | Add_batch_choose_job_order | D | Dialog sm "Add batch": job order select (number and company as two texts per option), Next |

Total **9 frames** (6 desktop, 1 tablet, 2 phone). Canvas: row **F** gets a second line, or a row **G  Batch list** above row F (default: **G above F**, because the list comes first in the flow; the row letters stay in build order).

### 13.4 Demo data

| Batch | Job order (company) | Status | Notes |
| --- | --- | --- | --- |
| B-2026-0422 | JO-2026-0137 (PT Kaltara Energi Prima) | Receiving | 6 of 8 arrived |
| B-2026-0421 | JO-2026-0139 (PT Mahakam Coal Resources) | Preparation | |
| B-2026-0420 | JO-2026-0139 | Analysis | |
| B-2026-0419 | JO-2026-0138 (PT Bara Nusantara Mandiri) | Prep finished | |
| B-2026-0418 | JO-2026-0142 (PT Bara Nusantara Mandiri) | Analysis | |
| B-2026-0417 | JO-2026-0142 | Completed | RoA-0417 |
| B-2026-0416 | JO-2026-0141 (PT Kaltara Energi Prima) | Completed | RoA-0416 |
| B-2026-0415 | JO-2026-0140 (CV Sumber Batu Hitam) | Analysis finished | RoA to upload |
| B-2026-0414 | JO-2026-0140 | Completed | RoA-0414 |
| B-2026-0413 | JO-2026-0136 (CV Sumber Batu Hitam) | Created | Deadline 20 Oct 2026, past due |

### 13.5 Photos as a centered modal (feedback 2)

\`Reception_photos\` on **desktop and tablet** becomes a centered **Dialog lg** over the reception page (instead of the side sheet on the right): title "Photos of KEP-3303", tag chips, a gallery of three photos per row (each with tag, taken by and time), the Add photo tile, footer Close and **Add photo**. The phone keeps the bottom sheet. Spec S-18 and section 4.5 of this plan change from "side sheet" to "dialog".

### 13.6 Library changes made by the owner (Nov 4)

| Change | Use |
| --- | --- |
| **Search, Size=sm** (32 px), all five states | Card toolbars next to sm buttons: the Reception scan field and any search inside a card. Page filters keep md, phone keeps lg |
| Tokens (light): \`Feedback/error-100\` \`#F8E3DC\` to \`#FEE9E1\`; \`Status/st-analysis-100\` \`#E3EAF4\` to \`#D9E5F7\`; \`Primary/primary-100\` \`#E3EAF4\` to \`#E9EEF4\` | Re-export \`tokens/sgsi-tokens.json\` and \`.css\`, regenerate \`../Design System/Design_Tokens.md\`, recheck contrast. Note: the message named \`st-success-100\`, but the file shows \`st-analysis-100\` changed; the plan follows the file |

### 13.7 Build steps (after go)

1. Tokens: export and docs (13.6).
2. Job order tabs (Job Order plan, Revision 11) and the photos dialog (13.5): rebuild rows C to F.
3. Batch list: \`rowG.js\`, 9 frames; \`naming.js\` rules for screen 01; \`fit.js\`; deploy when the open file has no unsaved edits; export.
4. Build status here and in the Job Order plan; memory; commit.
5. Prototype (Job Order prototype plan, section 14): batch list, tab order and the photos dialog join the pending update; publishing waits for the owner's go.

### 13.8 Open points

| # | Question | Default |
| --- | --- | --- |
| 12 | Canvas row for the list: G above F, or a second line in F? | G above F |
| 13 | Should Analyst and Preparation see Completed batches at all? | Yes, through the All chip |
| 14 | Batch list on tablet: table or cards? | Table with five columns |
`);

edit(D + "/Job Order/Job_Order_Screen_Plan.md", (s) => s.trimEnd() + LF + LF + `## Revision 11 · Tab order (Nov 4, 2026) · PLAN, waiting for go

Owner feedback: the job order tabs read **Overview, Samples, Batches, Files, CoA, History** (Samples before Batches: samples are registered first, then batched). Count pills stay on Samples, Batches and Files.

| Where | Change |
| --- | --- |
| Frames | Every job order detail frame at three sizes: row C (Overview, Batches, Samples and their states), row D (Add batch over the Batches tab), row E (CoA frames, P7). Generator \`rowC.js\` (tabs) and the rows built on it |
| Prototype | Tab order in \`app2.js\` (detail tabs), listed in the prototype plan section 14 |
| Text | Earlier sections of this plan list the old order (Overview, Batches, Samples); this revision replaces it |

Built together with the batch list (\`../Batch/Batch_Screen_Plan.md\` section 13).
`);

edit(D + "/Job Order/Job_Order_Prototype_Plan.md", (s) => rep(s, "| Contact person field | Name, phone, email as separate texts, chevron at the right |",
  "| Tab order (Revision 11, Nov 4) | Overview, Samples, Batches, Files, CoA, History | Overview, Batches, Samples, … (`app2.js` detail tabs) |\n" +
  "| Batch page and batch list (Batch plan, Nov 4) | Sidebar Batches opens the batch list; a row opens the batch page on the tab that matches its status; Batches active on both; Photos in a centered dialog on desktop and tablet | Sidebar Batches opens \"Outside this prototype\"; the batch page is reached from a job order only; photos in a side sheet |\n" +
  "| Contact person field | Name, phone, email as separate texts, chevron at the right |"));
console.log("docs13 ok");
