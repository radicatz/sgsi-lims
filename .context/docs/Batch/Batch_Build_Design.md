# Batches: build design (phase 3)

Written Nov 18, 2026, for phase 3 of `../Project/V1_Build_Plan.md`. **Status: approved Nov 18, 2026, with the defaults of section 13. Slice A built Nov 18, 2026 (section 14); slice B is next.**

Written for: the product owner, and whoever builds and reviews phase 3.

The screens are specified in `Batch_Screen_Plan.md` (Revisions 1 to 3, module 04) and in the job order plan (`../Job Order/Job_Order_Screen_Plan.md`: the Batches tab and Add batch). The flows are in `Batch_Prototype_Plan.md` (BA1 to BA6) and `../Job Order/Job_Order_Prototype_Plan.md` (JO6). The rules come from the spec: 6.1 for sample identifiers, 9.2 and 9.2.1 for batch steps, S-07, S-08 and S-18 for the screens, F-RES-07 for value entry, and D-41 and D-44 to D-49. The notification events are in `../App/App_Screen_Plan.md` 5.1. This file says how all of that is built and tested.

## 1 · Scope

Phase 3 builds what happens to a sample from the moment the lab gets it until its batch is complete.

**The gate:** one real batch, entered from its signed RoA, gives the same numbers as the paper RoA. Each received sample also gets its Sample ID and sample code (spec 6.1).

| In phase 3 | Later |
| --- | --- |
| **Batch list** `/batches`: status chips, search, filters, a pre-filter per role, and Add batch through a job order | My work queues and the dashboards (phase 5), CSV and XLSX export (phase 6) |
| **Add batch** from the job order's Batches tab or from the list, with the job order's late samples pre-ticked. The job order **Batches tab** with its rows | Copy from a previous batch (S-07, Proposed), deleting a batch |
| **Batch page** `/batches/:no`: header, stepper, the Reception, Preparation and Analysis tabs, Edit batch number, batch log | Sample history page (phase 5), the RoA list on Reports (phase 4) |
| **Reception:** scan or type a label, Arrived, Sample ID and sample code, mass, condition, remarks, photos, labels, Hold and Release, Confirm reception (with fewer samples), and the samples that go back to the job order | Camera barcode scanning (a scanner gun types like a keyboard), a label printer driver |
| **Preparation:** ADL, Save all, Finish Preparation | Mass after preparation, top size |
| **Analysis:** one final value per sample and parameter, FC and Net CV calculated, the validation rules, Save all, Finish Analysis | The analyst worksheet (S-09, S-10), rechecks, supervisor approval in the system |
| **Signed RoA** upload and **Complete batch**, which freezes the values for the CoA (C-10) | The CoA itself (phase 4) |
| **Notifications** N1 to N5, N7 and N8, written to the database; the bell's unread badge, its panel and the notifications page (open point 1) | N6 (phase 4), e-mail |

## 2 · Screen reference (FigCraft)

The frames are in `../../design/figcraft/SGSI-LIMS-screens.figcraft`, named `Size-MM-Module-SS-Screen-VV-Variant` (`../Design System/Frame_Naming.md`). When a frame and this design disagree, this order decides:
1. Spec 6.1 for sample identifiers. The batch frames still show the old ones: "Sample ID" holding the client's name, and the lab code `B0422-01`.
2. The owner's answers.
3. The frame.

**Module 04, Batches (33 frames)**

| Screen | Variant | D | T | P | Slice |
| --- | --- | :-: | :-: | :-: | --- |
| 01 Batch_list | 01 Default | ✓ | ✓ | ✓ | A |
| | 02 Batches_to_prepare, 03 Empty, 04 No_results, 06 Add_batch_choose_job_order | ✓ | | | A |
| | 05 Filters (desktop dialog, phone sheet) | ✓ | | ✓ | A |
| 02 Batch_detail | 01 Reception_receiving | ✓ | ✓ | ✓ | A |
| | 02 Reception_print_labels | ✓ | | ✓ | A |
| | 03 Reception_photos | ✓ | ✓ | ✓ | A |
| | 04 Reception_ready, 05 Reception_confirm_with_fewer, 06 Reception_hold_sample, 08 Reception_confirmed, 09 Batch_number_edit | ✓ | | | A |
| | 07 Reception_scan_label | | | ✓ | A |
| | 10 Preparation_entering_ADL | ✓ | ✓ | ✓ | B |
| | 11 Preparation_finished | ✓ | | | B |
| | 12 Analysis_entering_results | ✓ | ✓ | ✓ | B |
| | 13 Analysis_finished_upload_RoA | ✓ | | ✓ | B |
| | 14 Completed | ✓ | | | B |

**From module 03 (Job orders) and module 00 (App)**

| Frame | D | T | P | Slice |
| --- | :-: | :-: | :-: | --- |
| 03-03-03 Batches (the job order's Batches tab with rows) | ✓ | ✓ | ✓ | A |
| 03-03-05 Batches_samples_awaiting_arrival | ✓ | | | A |
| 03-04-01 Add_batch Dialog | ✓ | ✓ | | A |
| 03-04-02 Add_batch Late_samples | ✓ | | | A |
| 03-04-03 Step_1 and 04 Step_2 (phone Add batch) | | | ✓ | A |
| 00-08-01 Notifications Panel, 02 Panel_unread | ✓ | ✓ (01) | | B |
| 00-08-03 Notifications Page, 04 Empty | ✓ | | ✓ (03) | B |

### 2.1 Frames to build against, by name

Every frame below is in the FigCraft file on the page of its size (**Desktop**, **Tablet**, **Mobile Phone**); search the layer list by name. 50 frames: 33 in module 04, 11 in module 03 (2 of them already built in phase 2) and 6 in module 00. Each name was checked against the file on Nov 18, 2026.

**Slice A · Batch list**

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-04-Batches-01-Batch_list-01-Default` | `Tablet-04-Batches-01-Batch_list-01-Default` | `Phone-04-Batches-01-Batch_list-01-Default` |
| `Desktop-04-Batches-01-Batch_list-02-Batches_to_prepare` | | |
| `Desktop-04-Batches-01-Batch_list-03-Empty` | | |
| `Desktop-04-Batches-01-Batch_list-04-No_results` | | |
| `Desktop-04-Batches-01-Batch_list-05-Filters` | | `Phone-04-Batches-01-Batch_list-05-Filters` |
| `Desktop-04-Batches-01-Batch_list-06-Add_batch_choose_job_order` | | |

**Slice A · Job order Batches tab and Add batch**

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-03-Job_orders-03-Job_order_detail-03-Batches` | `Tablet-03-Job_orders-03-Job_order_detail-03-Batches` | `Phone-03-Job_orders-03-Job_order_detail-03-Batches` |
| `Desktop-03-Job_orders-03-Job_order_detail-04-Batches_empty` | `Tablet-03-Job_orders-03-Job_order_detail-04-Batches_empty` | |
| `Desktop-03-Job_orders-03-Job_order_detail-05-Batches_samples_awaiting_arrival` | | |
| `Desktop-03-Job_orders-04-Add_batch-01-Dialog` | `Tablet-03-Job_orders-04-Add_batch-01-Dialog` | `Phone-03-Job_orders-04-Add_batch-03-Step_1` |
| `Desktop-03-Job_orders-04-Add_batch-02-Late_samples` | | `Phone-03-Job_orders-04-Add_batch-04-Step_2` |

**Slice A · Batch page and Reception**

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-04-Batches-02-Batch_detail-01-Reception_receiving` | `Tablet-04-Batches-02-Batch_detail-01-Reception_receiving` | `Phone-04-Batches-02-Batch_detail-01-Reception_receiving` |
| `Desktop-04-Batches-02-Batch_detail-02-Reception_print_labels` | | `Phone-04-Batches-02-Batch_detail-02-Reception_print_labels` |
| `Desktop-04-Batches-02-Batch_detail-03-Reception_photos` | `Tablet-04-Batches-02-Batch_detail-03-Reception_photos` | `Phone-04-Batches-02-Batch_detail-03-Reception_photos` |
| `Desktop-04-Batches-02-Batch_detail-04-Reception_ready` | | |
| `Desktop-04-Batches-02-Batch_detail-05-Reception_confirm_with_fewer` | | |
| `Desktop-04-Batches-02-Batch_detail-06-Reception_hold_sample` | | |
| | | `Phone-04-Batches-02-Batch_detail-07-Reception_scan_label` |
| `Desktop-04-Batches-02-Batch_detail-08-Reception_confirmed` | | |
| `Desktop-04-Batches-02-Batch_detail-09-Batch_number_edit` | | |

**Slice B · Preparation, Analysis, RoA**

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-04-Batches-02-Batch_detail-10-Preparation_entering_ADL` | `Tablet-04-Batches-02-Batch_detail-10-Preparation_entering_ADL` | `Phone-04-Batches-02-Batch_detail-10-Preparation_entering_ADL` |
| `Desktop-04-Batches-02-Batch_detail-11-Preparation_finished` | | |
| `Desktop-04-Batches-02-Batch_detail-12-Analysis_entering_results` | `Tablet-04-Batches-02-Batch_detail-12-Analysis_entering_results` | `Phone-04-Batches-02-Batch_detail-12-Analysis_entering_results` |
| `Desktop-04-Batches-02-Batch_detail-13-Analysis_finished_upload_RoA` | | `Phone-04-Batches-02-Batch_detail-13-Analysis_finished_upload_RoA` |
| `Desktop-04-Batches-02-Batch_detail-14-Completed` | | |

**Slice B · Notifications** (open point 1)

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-00-App-08-Notifications-01-Panel` | `Tablet-00-App-08-Notifications-01-Panel` | |
| `Desktop-00-App-08-Notifications-02-Panel_unread` | | |
| `Desktop-00-App-08-Notifications-03-Page` | | `Phone-00-App-08-Notifications-03-Page` |
| `Desktop-00-App-08-Notifications-04-Empty` | | |

`Desktop-` and `Tablet-03-Job_orders-03-Job_order_detail-04-Batches_empty` are already built (phase 2); they stay as the tab's empty state.

Where no frame exists, the build uses the nearest one and records it in the build status, as phase 2 did. Known cases:
- The tablet and phone states of the confirm, hold, edit-number and completed screens use the desktop dialog in the tablet layout, or a bottom sheet on the phone (`Batch_Screen_Plan.md` 4.5).
- The CSO's read-only Preparation and Analysis tabs show progress only (flow BA6).
- The batch log is a dialog listing the log rows.

## 3 · Two slices

Each slice is committed when its checks pass.

| Slice | Builds |
| --- | --- |
| **A · Batches and reception** | Batch list; Add batch (both entries, late samples pre-ticked, phone in two steps); the job order's Batches tab; batch page shell (header, stepper, tabs, ⋯ menu, Edit batch number, batch log); the whole Reception tab with scan, Arrived and the Sample ID, mass, condition, photos, labels, Hold and Release, Confirm reception with fewer samples; notifications N1 and N2 written; demo batches (`pnpm seed:batches`) |
| **B · Preparation, analysis and RoA** | Preparation tab (ADL, Save all, Finish Preparation); Analysis tab (grid, FC and Net CV calculated, the validation rules, unsaved markers, Save all, Finish Analysis; phone cards); RoA card (upload, download, Complete batch, value freeze); notifications N3 to N5, N7 and N8 with the deadline timer; the bell's badge, panel and page (open point 1) |

## 4 · Three perspectives

| Perspective | Design |
| --- | --- |
| Backend | `apps/api/src/routes/batches.ts` (list, Add batch, page, number, log, the job order's Batches tab), `batches-reception.ts` (reception rows, photos, labels, hold, confirm) and `batches-results.ts` (ADL, analysis, RoA, complete), plus `notify.ts` (the events and the deadline timer). Every route runs as the signed-in user (`asUser`), so RLS checks again, and the audit trigger records the screen "Batches". Each step change locks the batch row (`select … for update`), checks the state and the guard, writes `batch_status_log` and changes the status in one transaction. Field errors return `{code, text, field}` as before |
| Frontend | `apps/web/src/features/batches/`: `List.tsx`, `AddBatch.tsx`, `Page.tsx` (header, stepper, tabs, menu), `Reception.tsx`, `Labels.tsx`, `Photos.tsx`, `Preparation.tsx`, `Analysis.tsx`, `Roa.tsx`. `features/orders/Batches.tsx` holds the job order's tab. Routes: `/batches` and `/batches/:no/:tab?`. Components come from `components/`, plus two new ones: a value grid cell (normal, unsaved, warning, calculated) and a checklist |
| Security | Parameterised SQL only. Batch numbers are checked against their pattern. Photos (images only, up to 10 MB) and RoAs (PDF only, up to 20 MB) are checked by extension and first bytes, stored under a random path with their SHA-256, and downloaded through one-hour signed links. Result values reach only roles with `result.read`: the CSO gets counts ("26 of 36 values saved"), never values (B-3, BA6). The signed RoA file needs `roa.download`. Every write route answers 403 to a role without its permission (section 5) |

## 5 · Backend routes

| Route | Does | Permission |
| --- | --- | --- |
| `GET /batches` | List with `q` (batch, Sample ID, sample code, client reference, job order), status, company, standard, job order, batch date and deadline ranges; counts per status; 25 a page | `batch.read` |
| `GET /orders/:no/batches` | The job order's Batches tab: number, date, standard, samples, parameters ("Same as the job order", or "+ HGI compared with the job order"), status, preparation and analysis people with dates, RoA number, deadline | `order.read` |
| `GET /orders/:no/batch-form` | What Add batch needs: the samples that can go into a batch (Expected or Awaiting arrival, with the batch they came back from), the job order's standards and parameters, the suggested batch number, today's date and the default deadline (the job order's due date) | `batch.create` |
| `POST /batches` | Create a batch with its number, batch date, deadline, standard (one of the job order's), samples (at least one), parameters, priority, CoC no. and notes. The chosen samples join the batch in the same step. Sends N1 | `batch.create` |
| `GET /batches/:no` | Header, stepper dates, counts (expected, arrived, received, held, values saved and due), what the signed-in user may do (`can`), the signed RoA's details | `batch.read` |
| `PUT /batches/:no/number` | Edit the batch number while Created; it must be unique | `batch.number.edit` |
| `GET /batches/:no/log` | `batch_status_log` rows, newest first | `batch.read` |
| `GET /batches/:no/reception` | Rows with the client reference, Sample ID, sample code, arrival, mass, condition, remark, lot, photo count and first thumbnail, label status and count, hold | `batch.read` |
| `PATCH /batches/:no/samples/:id` | Save one field when it loses focus: arrived, mass, condition, remark, lot. Ticking Arrived gives the Sample ID and sample code (section 7); unticking clears them | `sample.receive` |
| `POST /batches/:no/arrive-all` | Mark all arrived | `sample.receive` |
| `POST /batches/:no/samples/:id/hold`, `/release` | Hold with a reason from the lookup `hold_reason` and a note when the reason needs one; Release | `sample.receive` |
| `GET`, `POST`, `DELETE /batches/:no/samples/:id/photos[/:pid]` | The photo gallery with tags from the lookup `photo_tag`; locked after Confirm reception | `batch.read` / `sample.photo` |
| `POST /batches/:no/labels` | Record a print of the chosen rows ("Only rows without a label", or a reprint with a reason) and return the label data | `label.print` |
| `POST /batches/:no/confirm` | Confirm reception (section 7). When fewer samples arrived than expected it answers 409 `fewer` with the counts and names, until it is sent again with `fewer: true`. Sends N2 when samples go back | `sample.receive` |
| `GET`, `PUT /batches/:no/adl`; `POST /batches/:no/finish-prep` | ADL values (save all); Finish Preparation with its guard. Sends N3 | `result.read` / `result.write.prep` / `batch.transition.prep` |
| `GET`, `PUT /batches/:no/analysis`; `POST /batches/:no/finish-analysis` | The grid (samples, parameters by group, basis, unit, decimals, rules) and its values (save all; the first save moves the batch to Analysis); Finish Analysis with its guard. Sends N4 | `result.read` / `result.write` / `batch.transition.analysis` |
| `GET /batches/:no/progress` | Counts only, for roles without `result.read` | `batch.read` |
| `POST`, `DELETE /batches/:no/roa`, `GET /batches/:no/roa/file` | Upload the signed RoA (PDF and its number) after Finish Analysis, replace it until Complete, download | `batch.document.upload` / `roa.download` |
| `POST /batches/:no/complete` | Complete batch: freeze the values. Sends N5 when it is the job order's last open batch | `batch.complete` |
| `GET /notifications`, `POST /notifications/read`, `/read-all` | The signed-in user's notifications (slice B) | signed in |

## 6 · Database

The tables already exist from phase 0: `batches`, `batch_parameters`, `batch_documents`, `batch_status_log`, `samples` (arrival, mass, condition, label, hold and the identifier columns from C-18), `sample_attachments`, `sample_counters`, `analyses`, `analysis_values`, `notifications`, and the function `next_sample_no()`. Two gaps need **one small migration (C-20)**. As before, the database tool refuses schema changes, so **you run it in the SQL editor** and I add it to the migration history:

| # | Change | Why |
| --- | --- | --- |
| C-20a | An insert policy on `batch_status_log` for signed-in staff who have `batch.read`, writing their own `by_user` | Every step writes its log row in the same transaction as the status change. Today the table has no insert policy |
| C-20b | `analyses.item_id` (nullable, references `parameter_group_items`), with the unique key becoming (sample, parameter, item, round) | The Ash analysis and Trace elements items (SiO₂, Al₂O₃, …) chosen on the job order need a place for their values. Today one analysis per parameter holds one value |

Data steps (no schema change): the private buckets `sample-photos` and `batch-documents`, and the demo batches. Notifications for other people are written by the API's service connection after the permission check, because a user may only read their own.

## 7 · Rules the build follows

**Batch steps** (spec 9.2.1):

| Step | Guard | What happens |
| --- | --- | --- |
| Add batch | Job order submitted and not cancelled or closed; number `B-YYYY-NNNN` and unique; one of the job order's standards; at least one sample that is Expected or Awaiting arrival | Status Created; the samples get the batch; the parameters are copied to `batch_parameters`; N1 |
| Confirm reception | At least one sample arrived; each arrived sample has a mass and a condition, with a remark unless the condition is Good; each has a printed label (open point 3); a dialog when fewer arrived | Arrived samples become Received (`received_at`, `received_by`). Samples not arrived and not on hold leave the batch as Awaiting arrival, and the log names them (R1 to R3). `expected_at_confirm` is kept. The batch moves to Preparation, the job order to In progress, and photos lock. N2 when samples went back |
| Finish Preparation | ADL saved for every received, not-held sample when TM is ordered | Prep finished; N3 |
| First analysis value saved | Prep finished | Analysis, with the date and the analyst |
| Finish Analysis | A value for every ordered parameter of every received, not-held sample; no Block rule broken | Analysis finished; values locked; N4 |
| Complete batch | Signed RoA uploaded with its number | Analyses marked `verified` and locked (C-10); Completed; N5 when every batch of the job order is completed |

**Receiving** is shown when a batch is Created and at least one sample is ticked Arrived. It is worked out on the fly, not stored, so the list chip and the stepper read it the same way.

**Sample ID and sample code.** The label carries the Sample ID's barcode and must be printed before Confirm reception, so the identifiers are given **when Arrived is ticked**, not at Confirm (the batch plan's rule 4.1; spec 6.1 says "when confirmed as arrived"):
- The format is `SG.{YYMMDD}.{CCC}.{BB}.{NNN}` and `{CCC}.{BB}.{NNN}.{LOT}`, with the date of the tick in the lab's time zone.
- `CCC` is the client's company code, `BB` the batch's branch (`RI`), and the number comes from `next_sample_no()`.
- Unticking clears both identifiers and the number is not reused. The log records the gap.
- The lot is `Lot01` unless Preparation changes it at reception.

**Locks.** After Confirm reception the Reception tab is read-only (lock icons, as on the job order Samples tab), and so are the job order's rows for these samples. After Finish Preparation, ADL is read-only. After Finish Analysis, the values are. A completed batch is read-only everywhere.

**Values** (Preparation and Analysis):
- Typed as numbers, with a comma accepted as the decimal sign.
- Stored as typed, up to the parameter's decimals. More decimals ask for fewer ("Use at most 2 decimals").
- Shown at the parameter's decimals (2 for most; GCV 0, as the lab's RoA).
- Each value records who entered it and when.
- Reported basis per parameter: TM as received; IM, Ash, VM, FC, TS and GCV air-dried (`parameters.measured_basis`, `Batch_Screen_Plan.md` open point 8).

**Calculated:**
- FC = 100 − (IM + Ash + VM) on the air-dried basis, with the exact decimal function in `packages/shared/src/calc.ts`.
- Net CV, when ordered, uses the batch's standard and the Seyler hydrogen estimate (owner, Nov 16).
- Both show as calculated cells and are stored as `calculated` analyses, so the CoA reads them the same way.
- The other calculated parameters (for example O) are typed from the RoA in v1.

**Validation:**
- Percent outside 0 to 100 blocks.
- The active rules of Configuration > Validation rules apply with their severity: V-01 sum, V-12 TM not below IM, and the typical ranges V-31, V-32, V-40, V-44 and V-50.
- A Warn rule marks the cell and adds a line to the checklist. A Block rule stops Finish.

## 8 · Notifications

The events are those of App plan 5.1. They are written for every active user of the receiving roles, except the person who did the action.

| Event | When | To |
| --- | --- | --- |
| N1 | Batch created | Preparation, Lab admin |
| N2 | Samples went back to Awaiting arrival at Confirm reception | CSO |
| N3 | Preparation finished | Analyst |
| N4 | Analysis finished | Lab admin |
| N5 | The job order's last batch completed | Lab admin |
| N7 | A batch is due within 24 hours | The roles whose queue the batch is in: Created goes to Preparation and Lab admin; Preparation to Preparation; Prep finished and Analysis to Analyst; Analysis finished to Lab admin |
| N8 | A batch is past its deadline and not completed | Supervisor, Manager |

N7 and N8 come from a timer in the API that runs every 15 minutes. It sends each event at most once per batch and person (it checks for an existing row), so a restart sends nothing twice.

## 9 · Labels and photos

**Labels:**
- The printer model is not known yet (request item 7), so a label is a page of the browser's print dialog, sized 50 × 30 mm (`@page`). It shows the Sample ID, the sample code, a Code 128 barcode of the Sample ID, the job order number, the date received and the company's short name.
- The barcode is drawn by a small encoder in `packages/shared`, with no new dependency.
- Pressing **Print** marks the rows Printed and counts the print. A reprint asks for a reason and goes into the batch log.
- The batch number is not on the label (spec 6.1), so editing the number no longer needs a reprint warning.

**Photos:**
- **Add photo** opens the file picker on the desktop and the camera on the tablet and phone.
- Photos are scaled to at most 2,000 px before upload and stored in `sample-photos`.
- Tags come from the lookup `photo_tag`. A photo can be removed until Confirm reception.

**Scan or type a label:**
- The field matches the client reference, the Sample ID or the sample code within the batch.
- Enter ticks Arrived and puts the cursor in the mass.
- No match shows "No sample of this batch matches …".

## 10 · Demo data

`pnpm seed:batches` loads the batches of `Batch_Screen_Plan.md` 13.4 on the demo job orders, with the new identifiers (received samples get their Sample IDs and sample codes; the companies keep their codes). `--remove` takes them out.

The batches B-2026-0420 and 0421 that `seed:orders` already put on JO-2026-0139 are kept and moved to the states of 13.4: 0420 Analysis and 0421 Preparation.

B-2026-0418 (Analysis, part of the values entered) and B-2026-0417 (Completed, RoA-0417) give slice B something to show.

## 11 · Tests

- **`apps/api/scripts/check-batches.ts`**, live against the database, as the right and the wrong roles:
  - Add batch with its rules: number pattern, uniqueness, standard, samples that are already in a batch.
  - Sample ID and sample code on tick, the running number per company and day, unticking.
  - The reception guard, confirm with fewer (samples back to Awaiting arrival, job order In progress), hold and release.
  - Photos and labels, including reprint with a reason.
  - ADL and Finish Preparation.
  - Values: decimals, the 0 to 100 block, Warn and Block rules, FC and Net CV against the workbook fixture.
  - Finish Analysis, RoA upload and replacement, Complete and the freeze.
  - The notifications and their recipients.
  - The CSO gets counts and no values, and every write answers 403 to a read-only role.
- **`e2e/phase3-batches.spec.ts`** at 1440, 834 and 390, covering BA1 to BA6 and JO6:
  - BA1: receive with scan, ticks, mass, condition, photo and labels.
  - BA2: confirm with fewer and a hold.
  - BA3: late samples into a new batch.
  - BA4: ADL and Finish Preparation.
  - BA5: values, Finish Analysis, RoA and Complete.
  - BA6: the CSO's read-only visit.
  - JO6: Add batch from the job order.
- Test data starts with `ZE` or `ZT` and is removed by `cleanup-test-data.ts`, which also removes stored photos and RoAs.
- **The gate:** the parity check against one real signed RoA waits for the lab (request item 8). Until it arrives, the workbook fixture checks the formulas.

## 12 · Where the build will differ from the frames (known now)

| Point | Frame | Build |
| --- | --- | --- |
| Identifier columns | "Sample ID" holds the client's name; "Lab code" `B0422-01` | **Client reference**, plus the sample code over the Sample ID (spec 6.1). The Preparation and Analysis grids lead with the sample code (Sample ID as a second line or tooltip), because the signed RoA prints those |
| Edit batch number | Warns that labels must be reprinted | No warning: the label does not carry the batch number (6.1) |
| Condition list | Good, Damaged, Wet, Short, No tag | The lookup values (now Good, Damp, Wet, Damaged bag, Contaminated). Configuration > Lookups changes them |
| Decimal sign | Frames show a comma (`12,40`) | Dot, as in the rest of the app; a typed comma is accepted (open point 4) |
| Undo of Confirm reception (prototype, 10 s) | — | No undo: the dialog asks first (open point 5) |
| Stepper notes on later steps | "6 of 8 arrived" on every future step | The step's own date, or "—" |

## 13 · Open points (defaults used unless you say otherwise)

| # | Question | Default |
| --- | --- | --- |
| 1 | The bell's badge, panel and notifications page belong to phase 5. Without them nobody can read N1 to N8 | **Build them in slice B** (frames 00-08-01 to 04); phase 5 keeps the settings and the rest |
| 2 | When are the Sample ID and sample code given: at the Arrived tick, or at Confirm reception (spec 6.1's wording)? | **At the tick**, because the label needs the barcode before Confirm (section 7) |
| 3 | Printed labels: does Confirm reception require them (frames, batch plan) or only warn (spec 9.2.1, V-28)? The CSO has no `label.print`, so with a block a CSO can confirm only after Preparation or the Lab admin printed the labels | **Block, as the frames**; the CSO's permissions stay as they are |
| 4 | Decimal sign in value grids | Dot shown, comma accepted |
| 5 | Undo of Confirm reception | None in v1 (identifiers are given and samples move) |
| 6 | Ash analysis and Trace elements values on the Analysis tab | Entered per chosen item, as columns under their group (C-20b) |
| 7 | Net CV: calculated, or typed from the RoA? (request item 13 is still open with the lab) | Calculated by the batch's standard with the Seyler hydrogen |
| 8 | Batch number unique across the lab (database) or per company (D-45) | Across the lab, as the database already checks |
| 9 | Delete a batch (S-07: only while Created and nothing arrived) | Not in phase 3; the frames have no Delete |
| 10 | The signed RoA number format | Free text, unique (for example RoA-0418) |

## 14 · Build status

### Slice A (Nov 18, 2026)

| Item | Result |
| --- | --- |
| Migrations | C-20 (`20261118000100_batch_log_and_group_items.sql`, run by the owner Nov 18). Data step `20261118000200_batch_buckets.sql`: private buckets `sample-photos` (10 MB, PNG, JPG, WebP) and `batch-documents` (20 MB, PDF), applied through the database tool |
| API | `routes/batches.ts` (list with several statuses at once, `GET /orders/:no/batches`, `/orders/:no/batch-form`, `POST /batches`, `/batches/open-orders`, the batch page, `PUT /batches/:no/number`, the log) and `routes/batches-reception.ts` (reception rows, `PATCH` of one row, arrive-all, hold and release, photos, labels, Confirm reception); `batch-lib.ts` (the status shown to people, identifier patterns, log row, notifications). N1 and N2 are written. Every step runs as the user; the job order's move to In progress and the notifications use the API's own connection, stamped with the same account |
| Shared | `packages/shared/src/code128.ts` (Code 128 B, no dependency; a unit test checks that all 107 patterns have 11 modules, the stop 13, and the check symbol) |
| Screens | `apps/web/src/features/batches/`: `List.tsx`, `AddBatch.tsx` (dialog, phone steps, the job order chooser), `Page.tsx`, `Reception.tsx`, `Dialogs.tsx` (print labels, photos, hold, Confirm with fewer, edit number, log), `labels.ts`; `features/orders/Batches.tsx` is the job order's tab. Styles in `styles/batches.css`. `ApiError` now carries the response body (Confirm's 409 sends the counts) |
| Demo data | `pnpm seed:batches`: B-2026-0422 on JO-2026-0137 (16 samples, 8 in the batch, 6 arrived with Sample IDs, one Wet, 4 labels printed, due tomorrow) and B-2026-0413 on JO-2026-0134 (past its deadline); the two batches of `seed:orders` get their parameters. `--remove` takes them out; `seed:orders --remove` now takes out every batch of the demo job orders |
| Tests | `scripts/check-batches.ts`: 83 live checks, all passing. `e2e/phase3-batches.spec.ts`: 4 flows at 1440, 834 and 390 (12 runs, all passing): the person's own queue and Add batch (JO6), receive with scan, mass, condition, remark, photo and labels and Confirm with fewer samples (BA1, BA2), the late sample in a second batch and the batch number (BA3), a CSO and an analyst reading (BA6). `cleanup-test-data.ts` also removes test batches, photos and their notifications |
| Not built in slice A | The Preparation and Analysis tabs show their waiting states (slice B). The row menu has no History entry (the sample history page is phase 5) |

**Where slice A differs from the frames, beyond section 12**

| Point | Frame | Build |
| --- | --- | --- |
| Add batch on the phone job order tab | Not drawn | No button there (as drawn); on the phone, Add batch is on the batch list, which asks for the job order first |
| Printer in the label dialog | A printer select (Zebra ZD421) | A disabled select: "Choose in the print window". The printer is not known (request item 7); the label prints at 50 x 30 mm through the browser. Check the barcode with the lab's scanner before relying on it |
| Label content | The old lab code under the barcode | The sample code, company, barcode of the Sample ID, the Sample ID, the job order and the date received (spec 6.1) |
| Reception columns | Sample ID, Lab code | Client reference, then the sample code over the Sample ID. Tablet: one Sample cell (reference, sample code) and no Remarks column; the remark input sits under the condition when it is needed |
| Remarks | Plain text | An input while the condition needs a remark (anything but Good) or a remark exists |
| Mass | A comma (12,40) | A dot, with a comma accepted when typed; an amber field below 0.1 kg or above 50 kg (a warning, not a block) |
| Edit batch number | Warns that printed labels must be reprinted | No warning: the label has no batch number (spec 6.1). The change goes into the batch log |
| Stepper notes | "6 of 8 arrived" on every future step | The step's own date, "Current", or "—" |
| Deadline on the list | A date field | A choice (Any date, Before today, Today, Next 7 days, Next 30 days), as the job order list; the Filters dialog has the date ranges |
| Add batch parameters | Fourteen pills | The job order's parameters plus the common ones (moisture, proximate, sulfur, calorific, ultimate, physical); a group (Ash analysis, Trace elements) only when the job order has it |
| Add batch samples | 8 of 16 ticked | Awaiting arrival first and ticked; with none awaiting, every expected sample is ticked and **Clear** starts again |
| Hold | Any sample | Only a sample that has arrived (a held sample "arrived", spec 9.2) |

**Open for later:** a real sample label test with the lab's printer and scanner. The Sample ID of a sample that is unticked is not given again (the running number moves on), as designed; the lab may want a different rule once it has seen it.

