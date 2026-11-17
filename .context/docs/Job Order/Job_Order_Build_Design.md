# Job orders: build design (phase 2)

Written Nov 16, 2026, for phase 2 of `../Project/V1_Build_Plan.md`. **Status: slice A built (Nov 16, 2026), slice B built (Nov 17, 2026); phase 2 is complete.** The screens are specified in `Job_Order_Screen_Plan.md` (Revisions 7 to 12, 55 frames in module 03) and `Job_Order_Prototype_Plan.md` (flows JO1 to JO12); the rules in spec S-17, 9.3 and 6.1. This file says how they are built and tested.

## 1 · Scope

Phase 2 builds what the CSO does before the lab touches a sample. The gate: **a real job order (R-20) can be entered as the CSO writes it today.**

| In phase 2 | Later |
| --- | --- |
| Job order list, New and Edit, the detail with Overview, Samples, Files and History; Submit, Cancel, Close | **Batches tab content and Add batch** (phase 3), **CoA tab content** (phase 4). Both tabs show their empty state in phase 2 |
| Sample list by client reference: add, paste from Excel with a preview, duplicates, save, Mark as not received and Restore, locked rows | Sample ID and sample code (given at Confirm reception, phase 3); the states In batch, Received and Awaiting arrival come from batches (phase 3) but are already read and shown |
| Contact and signatory pickers, standards, quick select, parameter pills with coverage, Ash analysis and Trace elements checklists | Import list (S-16, **on hold**: the button is not shown), saved filters (phase 5), sample history page (phase 5) |

## 2 · Screen reference (FigCraft)

The screens to build against are the module 03 frames in `../../design/figcraft/SGSI-LIMS-screens.figcraft`, 55 frames on the pages **Desktop** (1440), **Tablet** (834) and **Mobile Phone** (390), named `Size-03-Job_orders-SS-Screen-VV-Variant` (`../Design System/Frame_Naming.md`). Read them in the FigCraft app, or from the saved file. Where a frame and this design differ, the order is: spec 6.1 for sample identifiers, then the owner's later answers (`../Project/V1_Build_Plan.md`, "Answers from the owner"), then the frame.

| Screen (SS) | Variant (VV) | Desktop | Tablet | Phone | Slice |
| --- | --- | :-: | :-: | :-: | --- |
| 01 Job_orders_list | 01 Default | ✓ | ✓ | ✓ | A |
| | 02 Empty | ✓ | | | A |
| 02 New_job_order | 01 Form | ✓ | ✓ | | A |
| | 02 Step_1, 03 Step_2 | | | ✓ | A |
| | 04 Contact_dropdown_list (phone: Contact_sheet_list) | ✓ | | ✓ | A |
| | 05 Contact_dropdown_edit (phone: Contact_sheet_edit) | ✓ | | ✓ | A |
| | 06 Signatory_dropdown_list (phone: Signatory_sheet_list) | ✓ | | ✓ | A |
| | 07 Signatory_dropdown_edit (phone: Signatory_sheet_edit) | ✓ | | ✓ | A |
| | 08 Ash_analysis_open (phone: Ash_analysis_sheet) | ✓ | | ✓ | A |
| | 09 Validation_errors | ✓ | | | A |
| | 10 Remove_contact | ✓ | | | A |
| | 11 Coking_coal_ASTM_and_GBT | ✓ | | | A |
| 03 Job_order_detail | 01 Overview | ✓ | ✓ | ✓ | A |
| | 02 Overview_dark_preview | ✓ | | | A (dark mode check) |
| | 03 Batches | ✓ | ✓ | ✓ | Phase 3 |
| | 04 Batches_empty | ✓ | ✓ | | A (the tab's empty state) |
| | 05 Batches_samples_awaiting_arrival | ✓ | | | Phase 3 |
| | 06 Samples | ✓ | ✓ | ✓ | B |
| | 07 Samples_mixed_states | ✓ | ✓ | ✓ | B |
| | 08 Samples_mark_as_not_received | ✓ | ✓ | ✓ | B |
| | 09 Samples_submitted_toast | ✓ | | | B |
| | 10 Samples_paste_preview | ✓ | | | B |
| | 11 Samples_unsaved_rows | ✓ | | | B |
| | 12 Samples_locked_row_tooltip | ✓ | | | B |
| 04 Add_batch | 01 Dialog, 02 Late_samples; phone 03 Step_1, 04 Step_2 | ✓ | ✓ | ✓ | Phase 3 |
| 05 CoA_and_actions | 03 Cancel_job_order | ✓ | | | A |
| | 01 Mark_sent (phone: Mark_sent_sheet), 02 Sent, 04 Ready_to_generate, 05 Draft_in_progress | ✓ | | ✓ | Phase 4 |

**Phase 2 uses 41 of the 55 frames**; the other 14 (Batches with batches, awaiting arrival, Add batch, and the CoA states) are for phases 3 and 4.

Where no frame exists, the build follows the nearest one and says so in the build status:

| Not drawn | Built from |
| --- | --- |
| Tablet and phone states of the paste preview, unsaved rows, locked tooltip, submitted toast, validation errors, remove contact, coking-coal case | The desktop frame of the same variant, in the tablet or phone layout of `06 Samples` and `02 New_job_order` |
| Tablet contact and signatory dropdowns | The desktop dropdowns (same panel width, Revision 6, R6-4) |
| Phone list empty state | The desktop empty state inside the phone list layout |
| Edit job order | `02 New_job_order` pre-filled, titled "Edit JO-…" (prototype plan section 4) |
| Close job order | A confirm dialog in the style of `05-03 Cancel_job_order`, without a reason field |
| Files tab, History tab | The CoA history file rows (Drill hole) and the Audit log rows (Admin) |
| Sample ID column | The frames show the old format (flagged): the build follows spec 6.1 (section 7) |

## 3 · Two slices

Each is committed when its checks pass, as Configuration was.

| Slice | Builds |
| --- | --- |
| **A** | Catalogue read route; list (status chips with counts, search, company, CSO and due-date filters, 25 per page, phone cards); New job order (dialog xl on desktop and tablet, two steps on the phone) and Edit; detail shell (header, ⋯ menu, tabs with counts) and the Overview tab; Submit, Save as draft, Cancel (reason), Close; demo job orders (`pnpm seed:orders`) |
| **B** | Samples tab (grid with unsaved dots, Add row, Paste from Excel with the preview dialog, duplicates, Save, the five state badges, locked rows with their tooltip, Mark as not received with a reason, Restore; phone cards and Add sample); Files tab (drop zone, list, download, remove); History tab (the audit rows of the job order in the Audit log row layout) |

## 4 · Three perspectives

| Perspective | Design |
| --- | --- |
| Backend | `apps/api/src/routes/orders.ts`. Every route runs as the signed-in user (`asUser`, RLS checks again; the audit trigger records the screen "Job orders"). Reads need `order.read`; create `order.create`; edit and the sample list `order.edit`; cancel and close `order.cancel`. zod bodies; field errors come back on the field (`{code, text, field}`), as in phase 1. Status changes check the state in one transaction (`select … for update`) |
| Frontend | `apps/web/src/features/orders/`: `List.tsx`, `OrderForm.tsx` (create and edit), `Detail.tsx` (header, tabs, Overview), `Samples.tsx`, `Files.tsx`, `History.tsx`. Routes `/orders`, `/orders/:no/:tab?` (spec 15). Components from `components/` (Table, Chips, Dialog xl, Select, ppill, DropZone, Tabs); a Stepper component is new and goes into `components/display.tsx`. Client checks mirror the server's; the server's field errors land on the same fields |
| Security | Parameterised SQL only; the order number and sample references are validated by pattern; file uploads checked for type and size, stored under a random path, hashed (SHA-256), downloaded through one-hour signed links (as CoA files). A CSO can only cancel before any sample is received. Read-only roles (Preparation, Analyst, Lab admin, Supervisor, Manager) get no edit controls and 403 from every write route |

## 5 · Backend routes

| Route | Does |
| --- | --- |
| `GET /orders/catalogue` | What the form needs, readable with `order.read`: active parameters by group with their coverage per standard (from `methods`), Ash analysis and Trace elements items, active services with their parameters and the default, sample types and priorities (lookups), signatories (active users with `report.sign`, the Manager first), the next suggested order number. The Configuration routes stay `config.write` only |
| `GET /orders` | List with filters (`q`, `status`, `company`, `cso`, `due_from`, `due_to`), counts per status, page. Columns: number, company, service, batches, samples received / expected, due date, status, CoA, CSO |
| `POST /orders` | Create as Draft or Submitted. Body: company, contact, client reference, standards (1 to 3), service used, parameters, group items, preparation, expected samples, sample type, due date, priority, signatory (picked or typed), notes. The number is suggested from `numbering.job_order` and may be edited; it is unique |
| `GET /orders/:no` | The job order with its parameters, contact, signatory, counts (samples by state, batches, files) and the derived status (spec 9.3) |
| `PUT /orders/:no` | Edit. Allowed until the first batch starts preparation (S-17 rules); then 409 with the reason |
| `POST /orders/:no/submit`, `/cancel` (reason), `/close` | Draft to Awaiting samples; Cancel only while no sample is received; Close only when Delivered (until phase 4 the button is disabled with the reason) |
| `GET`, `PUT /orders/:no/samples` | The list in row order; save is one batch of adds, edits and deletes, refused as a whole with the duplicate rows named. A row locks once it is in a batch (as built, following frame 07), is received or is marked not received |
| `POST /orders/:no/samples/:id/not-received`, `/restore` | Reason from the lookup `not_received_reason`, a note when the reason needs one (as built: under the job order, so its status is checked in the same step) |
| `GET`, `POST /orders/:no/files`, `DELETE /orders/:no/files/:id` | Bucket `job-order-files` (private; PDF, images, Excel, Word, CSV; up to 20 MB) |
| `GET /orders/:no/history` | The audit rows of the job order, its parameters, group items, samples and files, newest first, with before and after. Read by the API after the `order.read` check, because `audit_log` is `audit.read` only |

**Numbering.** `JO-{YYYY}-{NNNN}` from Configuration > Laboratory > Numbering; the next number is the highest of the year plus one, taken under a transaction-level advisory lock so two CSOs never get the same one. No counter table is needed.

**Signatory.** The owner answered (Nov 16): the Laboratory Manager signs the CoA. The picker lists the users who may sign (`report.sign`), the Manager pre-selected; "Add signatory" types a name and title (B-15). The job order stores the id when picked and always the name and title.

## 6 · Database

**No schema change.** The tables are in migrations 0300 and 0800: `job_orders` (standards as an array, service, signatory, status, cancel reason), `job_order_parameters`, `job_order_group_items`, `job_order_files`, `samples` (client reference, description, type, remarks, drill hole and depth as typed, not-received fields, release fields), `sample_intervals`. Two data steps at build time: the storage bucket `job-order-files`, and the demo job orders.

**Drill holes.** The CSO types the drill hole and depth as the client wrote them. On save, a row whose drill hole matches one of the company's drill hole codes (ignoring case) gets its `sample_intervals` row; an unmatched one shows a hint and stays as typed.

## 7 · Sample identifiers

The frames still show the old format (flagged, `../Project/Sample_Identifiers_Plan.md`). The build follows spec 6.1: the typed column is **Client reference**; a **Sample ID** column reads "Given at reception" until the sample is received (phase 3), then the sample code with the Sample ID as a second line.

## 8 · Tests

- `apps/api/scripts/check-orders.ts`, live against the database, as the right and wrong roles: create, draft, submit, number suggestion and uniqueness, edit lock, cancel with and without received samples, close rule, the catalogue for a CSO without `config.write`, sample save with duplicates refused, not received and restore, file upload limits, history rows, 403 on every write for read-only roles.
- `e2e/phase2-orders.spec.ts` at 1440, 834 and 390: JO1 create, JO2 draft and validation ("Fix 3 fields to submit"), JO3 contacts and signatory, JO4 Ash checklist and coking standards, JO5 register samples by paste, JO8 edit, cancel and close, JO9 create on a phone, JO10 not received and restore, JO11 files and history, JO12 read-only visit. JO6 (Add batch) and JO7 (CoA) come with phases 3 and 4.
- Test data starts with `ZE`/`ZT` and is removed by `cleanup-test-data.ts`, as before.

## 9 · Open points (defaults used unless you say otherwise)

| # | Question | Default |
| --- | --- | --- |
| 1 | Job order number: from another system (D-01) or ours? | Ours, suggested and editable by the CSO, unique |
| 2 | Close a job order before phase 4 (no CoA yet) | Only when Delivered, as the prototype; disabled with the reason until then |
| 3 | Signatory list | People with `report.sign`, the Manager pre-selected; a typed name allowed |
| 4 | "Import list" on the Samples tab | Hidden while the import wizard is on hold |
| 5 | Files tab and History tab are not drawn | Built from the patterns (Files: drop zone and file rows as the CoA history; History: Audit log rows), tagged in the plan |
| 6 | Batches and CoA tabs in phase 2 | Shown with their empty states, no Add batch or Generate CoA yet |
| 7 | A real job order to test the gate (R-20, request item 5) | Demo job orders until it arrives; the gate is checked against it when it does |

## 10 · Identifier formats (Nov 16, 2026)

The formats now in force for everything that hangs on a job order. They are settings (Configuration > Laboratory > Numbering) except where noted; the frames and the prototype still show the old demo values (`BNM-3507`, `B0410-07`), and **the spec wins** (6.1).

| Identifier | Format | Example | Given when | Where it is set |
| --- | --- | --- | --- | --- |
| **Job order number** | `JO-{YYYY}-{NNNN}`: year, then the next number of that year | `JO-2026-0144` | The job order is created (suggested by the form, then fixed) | Numbering, Job order |
| Batch number | `B-{YYYY}-{NNNN}` (a database check; the CSO or Preparation may edit it) | `B-2026-0418` | A batch is added (phase 3) | Numbering, Batch |
| **Client reference** | The client's own name for a sample, typed or pasted; unique within the job order; not printed on the RoA or CoA | `BNM-3507` | The sample is registered (slice B) | The CSO |
| **Sample ID** | `SG.{YYMMDD}.{CCC}.{BB}.{NNN}`: Sentra Geo, the date received, the client's company code, the branch office, the day's running number for that client | `SG.261022.003.RI.007` | Confirm reception (phase 3) | Numbering, Sample ID |
| **Sample code** | `{CCC}.{BB}.{NNN}.{LOT}` | `003.RI.007.Lot01` | Confirm reception (phase 3) | Numbering, Sample code |
| CoA number | `CoA-{job order}-{revision}` | `CoA-JO-2026-0142-1` | A CoA is generated (phase 4) | Numbering, CoA |
| RoA number | `RoA-{batch_no}-{version}` (spec D-11, a placeholder until the lab confirms); the signed RoA's own number is entered at upload | `RoA-B-2026-0417-1` | The batch is completed (phase 3) | Phase 3 design |

Company codes in the database now (assigned in order; the Superadmin may change one until the client's first received sample): TSA 001, KBM 002, **BNM 003**, KEP 004, SBH 005, MBS 006, MCR 007, PTBA 008, BLC 009. The identifiers plan's example (`BNM` 001) is therefore `SG.261022.003.RI.007` here. Branch office: `RI` Rapak Indah. Lot: `Lot01` unless Preparation sets another at reception. The running number has 3 digits and is refused at 999.

**The 14 demo job orders** (`pnpm seed:orders`) keep their prototype numbers, which already follow the pattern: JO-2026-0130 (PT Bukit Asam, reported), 0131 (Bara Nusantara, delivered), 0132 (Sumber Batu Hitam, closed), 0133 (Kaltara, delivered), 0134 (Bara Nusantara, awaiting samples), 0135 (Mahakam, cancelled), 0136 (Sumber Batu Hitam, draft), 0137 (Kaltara, awaiting samples, coking coal), 0138 (Bara Nusantara, reported), 0139 (Mahakam, in progress, past due), 0140 (Sumber Batu Hitam, delivered), 0141 (Kaltara, reported), 0142 (Bara Nusantara, in progress), 0143 (PT Bukit Asam, draft). The next new one is **JO-2026-0144**. When slice B adds the demo samples, their client references keep the old demo values and their Sample IDs and sample codes are generated in the format above (for received ones only).

## 11 · Build status

### Slice A (Nov 16, 2026)

| Item | Result |
| --- | --- |
| API | `apps/api/src/routes/orders.ts`: `GET /orders/catalogue`, `GET /orders` (filters, counts per status, server paging), `GET /orders/:no`, `POST /orders`, `PUT /orders/:no`, `POST /orders/:no/submit`, `/cancel`, `/close`. Checks: `apps/api/scripts/check-orders.ts`, 45 live checks as the right and wrong roles |
| Screens | `apps/web/src/features/orders/`: `List.tsx`, `OrderForm.tsx` (dialog on desktop and tablet, two full-screen steps on the phone; contact and signatory pickers; parameter pills with coverage; Ash and Trace checklists), `Detail.tsx` (header, Stepper, tabs with counts, Overview) |
| Tests | `e2e/phase2-orders.spec.ts`: 7 flows at 1440, 834 and 390 (21 runs): list and filters, create and submit (JO1, JO9), draft and validation (JO2), contacts (JO3), Ash checklist and coking-coal pills (JO4), edit, cancel and the close rule (JO8), read-only visit (JO12) |
| Demo data | `pnpm seed:orders` (14 job orders), `--remove` takes them out |
| Left in slice A | The Samples, Files and History tabs show a placeholder (slice B). The form has no file drop zone (Files is slice B). The job order number is assigned by the server (the frames have no number field); the CSO cannot type another one |
| Differences from the design | The form catalogue is loaded when the list opens, so New job order opens at once (the database is remote and the call takes about 1.3 s). A new job order starts with no client chosen, so a CSO cannot submit for the wrong client by leaving the default. Due date uses the browser's date field. Due-date filter is a choice (Any date, Before today, Today, Next 7 days, Next 30 days). Close stays disabled until the CoA is sent (phase 4) |

### Slice B (Nov 17, 2026)

Built against frames 03-03-06 to 12 (Samples, the three sizes where drawn), 02-01 (the form's "Notes and files" drop zone), the CoA history file rows (Files) and the Audit log frames 15-01-01 to 03 (History).

| Item | Result |
| --- | --- |
| API | `apps/api/src/routes/orders-b.ts`, registered by `orderRoutes`: `GET`, `PUT /orders/:no/samples`, `POST /orders/:no/samples/:id/not-received`, `/restore`, `GET`, `POST /orders/:no/files`, `DELETE /orders/:no/files/:id`, `GET /orders/:no/history`. Uploads are checked by extension and first bytes, up to 20 MB, stored under a random path with their SHA-256, downloaded through one-hour signed links that keep the file's name |
| Data step | Bucket `job-order-files` (`supabase/migrations/20261117000100_job_order_files_bucket.sql`, data only, applied Nov 17) |
| Screens | `apps/web/src/features/orders/Samples.tsx` (grid, paste preview, not-received dialog and sheet, phone cards and add/edit sheet), `Files.tsx` (Files tab, the form's drop zone), `History.tsx`; the detail's head gets **Add samples** while a job order has no samples (frames 09, 10) |
| Tests | `apps/api/scripts/check-orders.ts`: 80 live checks (35 new: the five states and locks, save, duplicates in any case, a swap of two references, depths, removal, not received and restore, file types and limits, signed links, history entries, read-only roles, a cancelled job order). `e2e/phase2-orders.spec.ts`: 3 new flows at 1440, 834 and 390 (JO5 samples by paste and by typing, JO10 not received and restore with the lock reasons, JO11 files from the form and the tab, then History) |
| Demo data | `pnpm seed:orders` now also loads samples: JO-2026-0134 (6 expected, as frame 06) and JO-2026-0139 (8 in the five states with batches B-2026-0420 and B-2026-0421, as frame 07). The received ones carry their Sample ID and sample code in the section 10 format (`SG.261105.007.RI.001`, `007.RI.001.Lot01`). `--remove` takes out the samples and the two batches too |

**Where the build differs from the frames, and why**

| Point | Frame | Build |
| --- | --- | --- |
| Identifier columns | "Sample ID" holds the client's ID | **Client reference** (typed) and **Sample ID** ("Given at reception", then the sample code over the Sample ID), spec 6.1 and section 7 |
| Expected rows | No action | The actions **Mark as not received** (R5 allows it for any sample in no batch) and **Remove** (a typed row must be removable) appear while the row is hovered or typed in, so the row looks as drawn at rest. Phone: in the sample's edit sheet |
| In-batch rows | Locked | Locked, as drawn (section 5 said "once its batch is in preparation"; the frame wins) |
| Empty state | Paste from Excel only | Paste from Excel and **Add row**, so the first row can be typed (tablet: Add row only, as the tablet frames have no Paste button) |
| Paste | The preview | A text box when the browser does not allow reading the clipboard, then the preview; **Paste other rows** starts again. Ctrl+V of Excel rows anywhere in the grid opens the preview too |
| Depth | "DH-BNM-021 14.20-14.55 m" | One cell, typed or pasted as "hole from-to"; a hole that is not one of the client's codes gets a small info icon with the hint (section 6) |
| Unsaved rows | Orange dot and number | As drawn; leaving the tab or the page with unsaved rows asks first |
| Save with a duplicate | Save (3) stays primary | As drawn: pressing it puts the cursor on the first problem row |
| History | (not drawn) | The Audit log rows; one save of many samples is one entry ("3 samples", each row in the expanded part); an edit of the parameter set shows only the net change |

**Open for later:** the History query filters the audit log by the job order inside the JSON before and after; at 4,600 rows it answers in about 1.3 s like every other route on the remote database. When the log grows, an expression index on `coalesce(after->>'job_order_id', before->>'job_order_id')` (a schema change, so the owner runs it) keeps it quick.
