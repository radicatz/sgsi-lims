# Batches — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 4.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Batch_Screen_Plan.md`. The rules R1 to R7 and the Revision C decisions (`../archive/Reception_Preparation_Screen_Plan.md`, sections 14 and 15) carry over from version 31 as logic.

## 1 · Frames

Module 04, 33 frames. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Batch_list | Default (D T P), Batches_to_prepare (D), Empty (D), No_results (D), Filters (D P), Add_batch_choose_job_order (D) |
| 02 Batch_detail | Reception_receiving (D T P), Reception_print_labels (D P), Reception_photos (D T P), Reception_ready, Reception_confirm_with_fewer, Reception_hold_sample (D), Reception_scan_label (P), Reception_confirmed, Batch_number_edit (D), Preparation_entering_ADL (D T P), Preparation_finished (D), Analysis_entering_results (D T P), Analysis_finished_upload_RoA (D P), Completed (D) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Batch list | `#/batches` | See below |
| Batch page | `#/batches/:no` | Breadcrumb Batches > number. The job order number links to the job order's Batches tab. The pencil opens **Edit batch number** (labels reprint warning, "already used"); it works until Confirm reception. Tabs **Reception** (with count), **Preparation**, **Analysis** |
| Reception tab | | See below |
| Preparation tab | | ADL per sample, a warning above the range (22.4 % in BA4), Entered by (read-only, the signed-in account). **Save all**, then **Finish Preparation** with its checklist. The finished state is read-only |
| Analysis tab | | See below |

**Batch list:**

- **Add batch** first opens a dialog to choose the job order, then **Next** opens Add batch (Job order plan).
- **Filters** opens a dialog: Company, Status, Standard, Job order, batch date and deadline ranges, **Clear all**, **Show 12 batches**. A bottom sheet on the phone.
- Status chips: All, Created, Preparation, Prep finished, Analysis, Analysis finished, Completed.
- Search ("Search batch, sample or job order"), Company select, Deadline field.
- Pre-filtered per role (L3): Batches to prepare for Preparation; Prep finished and Analysis for the Analyst.
- Empty and No results states.
- Rows open the batch page on the tab that matches the status (L2).

**Reception tab:**

- **Scan or type a label**. On the phone this is the scan state.
- Per row: arrived tick, mass, condition select (Good, Wet and the other Lookups values; a remark is needed unless Good), remark, photos, label status.
- **Mark all arrived**.
- **Print labels (2)** dialog: printer, copies per sample, "Only samples without a label".
- Photos dialog with the tags Condition, Weighing and Other, and **Add photo**.
- Row menu: Hold (dialog with a Reason), Release, Reprint label, History.
- **Confirm reception**. When samples are missing, the "Confirm reception with 6 of 8 samples?" dialog shows first. Unarrived samples go back to the job order (R1 to R3), with **Undo** for 10 s (R7).
- Confirmed state: rows locked, **Open the job order's samples**.
- Phone: bottom sheets for labels and photos.

**Analysis tab:**

- Values per parameter and sample, calculated FC, range warnings from the Configuration validation rules (Warn or Block).
- **Save all**, then **Finish Analysis**, which locks the values.
- Then the RoA card: RoA number, a Drop zone for the signed RoA, **Complete batch**.
- Completed state with **Download**.
- The CSO sees progress ("26 of 36 values saved") and no values. The RoA shows as plain text for the CSO and Preparation.

## 3 · Links to other groups

| From | To |
| --- | --- |
| Job order number in the header | Job order Batches tab (Job order plan) |
| **Open the job order's samples** | Job order Samples tab |
| Reception row menu **History** | Sample history (Search plan) |
| Complete batch | Reports RoA list (Reports plan); notification N5 when it is the job order's last batch (App plan) |
| Condition values, validation rules, number formats | Configuration Lookups, Validation rules, Laboratory (Admin plan) |

## 4 · Gaps and differences

| Item | Prototype |
| --- | --- |
| Row menu (Reception) drawn closed | Hold, Release, Reprint label, History |
| Batch list row menu | None; the row opens the batch page (L1) |
| D5: these frames are dated around 21 to 28 Oct | Today is 5 Nov (Job order plan, D5) |

## 5 · Flows

The version 31 flow numbers are kept in the "Was" column.

| ID | Flow | Role | Steps | Was |
| --- | --- | --- | --- | --- |
| BA1 | Receive a batch | Preparation | Batch list (Batches to prepare) → batch → scan → tick → mass and condition → photos → **Print labels** | F12, F13 |
| BA2 | Confirm with fewer, hold | Preparation | 6 of 8 arrived, one on hold → **Confirm reception** → 2 back to the job order (N2 to the CSO) | F14, F15 |
| BA3 | Late samples into a new batch | CSO | Samples awaiting arrival → **Add batch** pre-ticks them → receive | F18 |
| BA4 | Enter ADL and finish | Preparation | Preparation tab → ADL (22.4 % warns) → **Finish Preparation** → N3 to the Analyst | F16 |
| BA5 | Analysis and RoA | Analyst, then Lab admin | Analysis tab → values, calculated FC, range warning → **Finish Analysis** → upload signed RoA → **Complete batch** | F20–F23 |
| BA6 | Read-only batch | CSO | Batch page → progress only, no values, RoA as plain text | F17 |
| BA7 | Edit the batch number | Lab admin | Pencil → "already used" → new number → labels warning | — |
| BA8 | Add a batch from the list | Lab admin | Batch list → **Add batch** → choose job order → **Next** → Add batch | — |

## 6 · Demo data

| Item | Values |
| --- | --- |
| Batches | B-2026-0412 to B-2026-0422, spread over every status |
| Key records | B-2026-0422: in Reception, 8 samples KEP-3301 to KEP-3308 of JO-2026-0137, two without a label. B-2026-0418: in Analysis. B-2026-0417: Completed with its RoA |
| Printers, photo tags, hold reasons | From Configuration Lookups |
