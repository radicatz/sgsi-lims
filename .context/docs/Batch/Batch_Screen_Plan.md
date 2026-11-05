# Batch Screens — Design Plan

Nov 4, 2026 · **BUILT (frames, Nov 4, 2026; prototype not updated yet)** · the single-batch page: Reception, Preparation and Analysis tabs, the RoA upload and Complete batch (spec S-18, with S-08 as its summary state)

Written for: the product owner, and whoever builds the frames and the prototype.

This plan replaces `../archive/Reception_Preparation_Screen_Plan.md`. That file keeps the history: the first reception design (Oct 28), the decision review on samples that do not arrive (its section 13) and Revisions B and C. Everything still valid from it is restated here, so this file alone describes the screens to build.

## 1 · Scope

| In this plan (v1) | Not in this plan |
| --- | --- |
| Batch page for one batch: header, stepper, tabs Reception, Preparation, Analysis | Batch list `/batches` (S-07): next plan, step 2 of the build order |
| Reception: arrived, mass, condition, remarks, photos, labels, **Confirm reception** | Camera barcode scanning (a scanner gun types like a keyboard), real label printing |
| Preparation: **ADL only**, Finish Preparation | Mass after preparation, top size (next goal) |
| Analysis: one final value per sample and parameter, Finish Analysis | The analyst worksheet: replicates, weighings, conversions, rechecks (S-09, S-10, next goal) |
| Signed RoA PDF upload and **Complete batch** | RoA drafted in the app, supervisor approval in the app (next goal) |
| Batch number edit while Created; Hold and Release a sample | Job order screens (done in `../Job Order/`): Batches tab, Add batch, Samples tab states |

Sources: spec `../Project/Coal_LIMS_Development_Spec.md` sections 1.1 (v1 scope), 8.2 (permissions), 9.2 and 9.2.1 (batch states), S-08, S-18, F-RES-07, decisions D-06, D-41, D-44 to D-49.

## 2 · Who uses it and where they start

| Role (demo person) | Starts from | Does |
| --- | --- | --- |
| Preparation (Dedi Kurniawan) | My work "Job orders awaiting samples" or "Batches to prepare"; a batch row | Receives, labels, confirms reception, enters ADL, finishes preparation |
| CSO (Rina Kartika) | A batch row in the job order's Batches tab | Receives and confirms reception (D-46); otherwise read-only |
| Lab admin (Maya Lestari) | A batch row; My work "Signed RoA to upload" | Receives and confirms reception, reprints labels, uploads the signed RoA, completes the batch |
| Analyst (Fitri Handayani) | My work "Batches ready for data entry" | Enters the final values, finishes analysis |

Every action is stamped with the signed-in account (no performer chip, C5).

## 3 · Batch steps (v1)

| From | Action | To | Who | Guard |
| --- | --- | --- | --- | --- |
| — | Create batch (Add batch) | Created | CSO, Preparation, Lab admin | Batch number valid (`B-YYYY-NNNN`) and unique |
| Created | **Confirm reception** | Preparation | CSO, Preparation, Lab admin | At least one sample arrived; every arrived sample has a mass, a condition (a remark unless Good) and a printed label. Fewer than expected: warn and confirm |
| Preparation | **Finish Preparation** | Prep finished | Preparation | ADL saved for every arrived, not-held sample when TM is ordered |
| Prep finished | (first value saved) | Analysis | Analyst | Implicit: there is no Start Analysis button |
| Analysis | **Finish Analysis** | Analysis finished | Analyst | A value for every ordered parameter of every arrived, not-held sample |
| Analysis finished | **Complete batch** | Completed | Lab admin | Signed RoA PDF uploaded with its RoA number; the supervisor's signature is on that paper RoA |

"Receiving" is shown while the batch is Created and at least one sample is ticked Arrived; it is derived, not stored. The stepper on the page has six steps: **Created, Receiving, Preparation, Prep finished, Analysis, Completed** (the job order stepper is a separate, six-step stepper of its own).

### Samples that do not arrive (Revision B, decision D-41)

| # | Rule |
| --- | --- |
| R1 | At **Confirm reception**, every sample of the batch that has not arrived and is not on hold leaves the batch and goes back to the job order as **Awaiting arrival** ("from B-2026-0422"). It is not deleted |
| R2 | A sample **on hold** arrived, so it stays in the batch (printed on the RoA as not analysed) |
| R3 | The batch's sample count becomes the number that arrived; the batch log records "Confirmed with 6 of 8 expected; returned to JO-2026-0137: KEP-3307, KEP-3308" with account and time |
| R4 | A returned sample that arrives later goes into a **new batch** through Add batch (no late receipt into a confirmed batch) |
| R5 | **Mark as not received** and **Restore** live on the job order's Samples tab (CSO only); already built there |
| R6 | A job order is settled when every registered sample is received in a batch or marked not received; until then the CoA shows a warning, not a block |
| R7 | Undo of Confirm reception (prototype, 10 s) puts the returned samples back |

## 4 · Screen structure

The page follows the job order detail layout (`../Job Order/Job_Order_Screen_Plan.md`, Revisions 8 and 10), so both read as one product.

```
Sidebar      Batches active (this is a batch page, route /batches/:id)
Breadcrumb   Batches  >  B-2026-0422
Header       B-2026-0422 [pencil while Created]  [Status badge]                         [ ... ]
             PT Kaltara Energi Prima                                  (company, foreground)
             (clipboard) JO-2026-0137   (flask) ASTM   (calendar) 28 Oct 2026   (stack) 6 of 8 arrived   (muted icon row)
Stepper card Created  Receiving  Preparation  Prep finished  Analysis  Completed
Tabs         Reception  Preparation  Analysis        (16 px gap; count pill only where a count helps: Reception 8)
Tab card     card head (title + actions), checklist, table or cards
```

- The job order number in the meta row is a link back to the job order (the breadcrumb starts at Batches, the module of this page).
- Header actions in the `...` menu: Edit batch number (while Created), Print labels, View batch log.
- One card per tab, owning its padding (16 on all sides, gap 16); table rows inside drop their side padding (card padding rule, job order plan 6.5e).

### 4.1 Reception tab (batch Created)

Card head: title **Reception**, actions Scan field, **Mark all arrived**, **Print labels (n)**, **Confirm reception** (primary; shown to CSO, Lab admin, Preparation).

| Column | Behaviour |
| --- | --- |
| # | Row number |
| Sample ID | From the job order, read-only, mono |
| Lab code | Created on arrival, `B0422-01` style (open point 2) |
| Arrived | Checkbox; ticking sets the lab code, the arrival time and the account |
| Mass received (kg) | 2 decimals; required for arrived rows; warning below 0.1 kg or above 50 kg |
| Condition | Select: Good (default), Damaged, Wet, Short, No tag; anything but Good needs a remark and shows a warning dot |
| Remarks | Free text (left out of the tablet table, shown on the phone card) |
| Photos | Paperclip, count and first thumbnail, or **Add**; opens the Photos sheet |
| Label | "Printed" with the date and time as two texts, or "Not printed"; reprint count when above 1 |
| Action | Icon-only button (as the job order Samples table): row menu with Hold, Release, Reprint label |

Below the table, the checklist card **Before you can confirm reception**: at least one sample arrived; every arrived sample has a mass; every arrived sample has a condition (and a remark unless Good); every arrived sample has a printed label. Each line ticks as it becomes true (Checklist item component).

After Confirm reception the tab turns read-only (lock icons in the Action column, as on the job order Samples tab), and a muted line names the samples returned to the job order with a link **Open the job order's samples**.

### 4.2 Preparation tab (batch Preparation)

Columns: #, Sample ID, Lab code, **ADL (%)**, **Entered by** (avatar and name, date as a second text), Saved, Status. ADL: 2 decimals, warning above 20 %, entered by the Preparation team only. Card head actions: **Save all**, **Finish Preparation** (disabled with the reason until the guard passes). After finishing: badge Prep finished, the tab read-only, a line "Ready for analysis".

### 4.3 Analysis tab (batch Prep finished, Analysis)

| Topic | Rule |
| --- | --- |
| What is entered | One final value per sample and ordered parameter, as on the signed RoA |
| Layout | Desktop and tablet: samples as rows, parameters as columns grouped by parameter group (Moisture, Proximate, Sulfur, Calorific, ...), basis and unit in the column head. Tablet scrolls the table sideways with Sample ID fixed. Phone: one card per sample with the parameters as fields |
| Calculated | FC = 100 − (IM + Ash + VM), adb, shown as a calculated cell (Grid cell, Calculated state), not typed |
| Checks | Numbers only; percent outside 0 to 100 blocks; a typical range warns (Ash above 50 %, TS above 5 %, GCV outside 3,000 to 8,000 kcal/kg) |
| Saving | Unsaved markers (Grid cell, Dirty state), **Save all**; each value stamped with account and time |
| Header line | Values saved as a count ("26 of 36 values saved"), then "Started 28 Oct" and the analyst as separate texts |
| Who | Analyst only; everyone else read-only. Held samples are skipped and shown "On hold" |
| Finish | **Finish Analysis** with the checklist **Before you can finish analysis**; the values then lock |

### 4.4 RoA and Complete batch (batch Analysis finished, Completed)

After Finish Analysis an **RoA card** appears above the table: **Upload signed RoA** (Drop zone: PDF; field RoA number, for example RoA-0418), then **Complete batch** (Lab admin, confirm dialog). A completed batch shows the RoA file (name, size, uploaded by and when, as separate texts, with Download) and every tab is read-only. On the job order, the batch row then shows Completed with the RoA number (already drawn there).

### 4.5 Dialogs and sheets

| Part | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Print labels: label preview (50 × 30 mm: sample ID, lab code, Code 128 barcode, job order no., date received, company short name), printer, copies, "Only rows without a label"; a reprint asks for a reason and is logged | Dialog md | Dialog md | Bottom sheet |
| Photos: gallery with tag (Condition, Weighing, Other), taken by and time; **Add photo** (file on desktop, camera on tablet and phone); remove until Confirm reception | Side sheet | Side sheet | Bottom sheet |
| Confirm reception with fewer samples: "Confirm reception with 6 of 8 samples?", text naming the samples that go back to the job order, counts Arrived, On hold, Leave the batch | Dialog md | Dialog md | Bottom sheet |
| Hold a sample: reason (Damaged, Insufficient, Client request, Other) and note | Dialog sm | Dialog sm | Bottom sheet |
| Edit batch number: pattern hint "Pattern B-YYYY-NNNN. The number must be unique.", error "B-2026-0421 is already used"; after labels are printed, a warning that labels must be reprinted | Dialog sm | Dialog sm | Bottom sheet |
| Complete batch: "Complete B-2026-0418?" with the RoA number | Dialog sm | Dialog sm | Bottom sheet |

### 4.6 Phone

One card per sample with a sticky action bar (Print labels, Confirm reception; or Save all, Finish); a **Scan or type a label** field at the top finds a card and ticks Arrived; photo strip with **Add photo** on each reception card. Touch targets 44 px.

## 5 · Design rules that apply (from the job order work)

- No values joined with " · ": separate texts, an icon row, two lines or a sentence (`../Job Order/Job_Order_Screen_Plan.md` 8.1).
- Header: company in `Text/foreground`; meta items and their icons in `Text/text-muted`; past deadline in the error colour with a separate "Past due" text.
- Tables: shared fixed column widths for header and rows; action column with icon-only buttons; batch numbers in `Primary/primary`; same row colours for every state (the badge and the action show the state).
- Frames named by `../Design System/Frame_Naming.md`; tokens from `../Design System/Design_Tokens.md`; components from the FigCraft library (`../Design System/Component_Library_Plan.md`).
- Contrast: muted text is below 4.5 to 1 on white (../Design System/Design_Tokens.md section 1); keep it for meta, never for values the user must read.

### Library additions needed

| Component | Addition |
| --- | --- |
| Status badge | Variant **Prep finished**; the existing "Finished analysis" variant reads **Analysis finished** |
| Condition select | The Select component with a warning-dot variant (no new set if the Select's Error state fits) |
| Label preview | Exists (05 Data display); check its text against the no-dot rule |
| Scan field | The Search component with the barcode glyph (add `barcode` to the Icon set if missing) |
| Checklist item, Grid cell, Photo thumbnail, Drop zone, Bottom sheet (the Side sheet was removed Nov 5), Stepper step | Exist; used as they are |

## 6 · Frames

Module **04 Batches**, screen **02 Batch_detail** (screen 01 is kept for the batch list). Canvas: a new row **F  Batch detail** below row E on each page. Demo data in section 7.

| VV | Frame (variant) | Sizes | Shows |
| --- | --- | --- | --- |
| 01 | Reception_receiving | D, T, P | B-2026-0422, 6 of 8 ticked, two labels to print, one Wet with a remark, checklist with two lines open, Confirm reception disabled |
| 02 | Reception_print_labels | D, P | Label preview dialog (phone: sheet) |
| 03 | Reception_photos | D, T, P | Photos sheet for KEP-3303 with two photos |
| 04 | Reception_ready | D | Every arrived sample labelled, all checks ticked, Confirm reception enabled |
| 05 | Reception_confirm_with_fewer | D | Dialog "Confirm reception with 6 of 8 samples?" |
| 06 | Reception_hold_sample | D | Hold dialog for KEP-3305 |
| 07 | Reception_scan_label | P | KEP-3304 found by scan, Arrived ticked, mass field focused, toast |
| 08 | Reception_confirmed | D | Read-only reception, lock icons, line "2 samples returned to JO-2026-0137" |
| 09 | Batch_number_edit | D | Dialog with the "already used" error |
| 10 | Preparation_entering_ADL | D, T, P | 4 of 6 saved, one at 22.4 % with the warning |
| 11 | Preparation_finished | D | Read-only, Prep finished, "Ready for analysis" |
| 12 | Analysis_entering_results | D, T, P | B-2026-0418 (JO-2026-0142), grouped columns, FC calculated, one range warning, unsaved cells, checklist |
| 13 | Analysis_finished_upload_RoA | D, P | Values locked, RoA card with the drop zone and RoA number |
| 14 | Completed | D | B-2026-0417 with RoA-0417 attached, all tabs read-only |

Total **24 frames** (13 desktop, 4 tablet, 7 phone), for example `Desktop-04-Batches-02-Batch_detail-01-Reception_receiving`. The generator is a new `library/screens/rowF.js` (run with rows C to E, then `naming.js` gains the module 04 rules).

## 7 · Demo data

| Batch | Job order | Used for |
| --- | --- | --- |
| B-2026-0422 | JO-2026-0137, PT Kaltara Energi Prima, contact Sari Wulandari, ASTM, deadline 28 Oct 2026; samples KEP-3301 to KEP-3308 (the 8 ticked in the Add batch frame) | Reception (01 to 09); after confirming with 6 of 8, Preparation (10, 11) |
| B-2026-0418 | JO-2026-0142, PT Bara Nusantara Mandiri, 6 samples, TM + Prox + TS + CV + HGI, analysis started 23 Oct by Fitri Handayani | Analysis (12, 13) |
| B-2026-0417 | JO-2026-0142, 12 samples, RoA-0417 | Completed (14) |

People: Dedi Kurniawan (Preparation), Rina Kartika (CSO), Maya Lestari (Lab admin), Fitri Handayani (Analyst); signatories as on the job order.

## 8 · Prototype

The prototype (version 31, https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo) already has the batch page with Revision C (`../../prototype/src/reception.js`). When the frames are built, the prototype takes the differences in one update, together with the job order changes listed in `../Job Order/Job_Order_Prototype_Plan.md` section 14:

| Part | Change |
| --- | --- |
| Sidebar and breadcrumb | Batches active on the batch page; breadcrumb Batches > batch number; job order link in the header |
| Header | Company line and the muted icon row (job order, standard, deadline, arrived count) |
| Text | No " · " joins (about 27 strings in `reception.js`) |
| Tables | Action column with icon-only buttons; shared column widths; Label column with two texts |
| Tokens | The Nov 3 values from `.context/design/figcraft/tokens/sgsi-tokens.css` |

Flows stay F12 to F23 (reception, labels, fewer samples, hold, ADL, read-only, late samples, not received, photos, batch number, results, RoA and complete), reworded where the text changes.

## 9 · Build steps (after go)

1. Library additions (section 5), then the 24 frames with `rowF.js`, checked by render at each size; deploy to the open FigCraft file only when it has no unsaved edits (back it up first).
2. `naming.js` rules for module 04; export the frames to `.context/design/export/`.
3. Build status in this plan; memory; commit.
4. Prototype update (section 8) only after the owner's go; publishing changes the shared link.

## 10 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Breadcrumb on the batch page: start at Batches (sidebar module) or at Job orders (where most users come from)? | **Decided Nov 4 (option B):** one fixed (location-based) breadcrumb, Batches > batch number, whatever the entry route; the sidebar always highlights Batches; the job order is a link in the header (research: section 14.1) |
| 2 | Lab code format | `B` + batch number + 2-digit sequence, `B0422-01` |
| 3 | Warning limits | Mass below 0.1 kg or above 50 kg; ADL above 20 %; the Analysis ranges in 4.3 |
| 4 | Label size and content | 50 × 30 mm as in 4.5 |
| 5 | May a supervisor still receive a late sample into a confirmed batch? | No |
| 6 | Late batch deadline | The job order due date, editable |
| 7 | Who uploads the signed RoA and completes the batch | Lab admin |
| 8 | Reporting basis and unit per parameter | TM ar (%); IM, Ash, VM, FC, TS adb (%); GCV adb (kcal/kg); the lab confirms |
| 9 | Photos after Confirm reception | Locked with the sample information |
| 10 | The lab's own batch number format | `B-YYYY-NNNN` until fixed |
| 11 | How often does one shipment arrive in parts (lab question R-01)? | Open |

## 11 · History

- Oct 28, 2026: first reception and preparation design and prototype (archive file, sections 1 to 12).
- Oct 28: decision review on samples that do not arrive, option B accepted (archive, section 13; spec D-41); Revision B built (archive, section 14).
- Oct 29: Revision C, v1 scope: Confirm reception by three roles, photos, ADL only, no performer chip, analyst value entry, signed RoA and Complete batch (archive, section 15; spec D-44 to D-49). Prototype version 28 built; frames built in FigCraft, then deleted on Oct 30 with the library rebuild.
- Nov 4: this plan restates the current design for the redraw on the new library.

## 12 · Build status (Nov 4, 2026)

All 24 frames are in the FigCraft file, canvas row **F  Batch detail** below row E on each page, named `{Size}-04-Batches-02-Batch_detail-VV-Variant` (backup before: `backup/SGSI-LIMS-screens.before-rowF.figcraft`). PNGs in `.context/design/export/`.

- **Library:** Status badge **Prep finished** (md, sm) added; "Finished analysis" renamed **Analysis finished**.
- **Generator:** `library/screens/rowF.js` (`build-screens.js F`), then `rev8.js D`, `naming.js` (module 04 rules added) and the new `fit.js`.
- **`fit.js`:** the shell's Body kept a fixed height, so long pages were cut at 1018 (desktop) and 908 (tablet). The pass grows Body (and fixed overlay frames with their scrim and side sheet) to the main column's height. It also fixed 19 job order frames, among them the tablet Overview, whose Batches card was hidden.
- **Deviations from section 6:** the photos column uses a thumbnail and a "+1" count (the icon set has no paperclip or camera glyph); the condition warning is a warning icon after the select; the tablet Analysis table is wider than the card and clips at the right (sideways scroll in the app); the Sheets' placeholder body fill is cleared so content starts at the top.
- **Not done yet:** the prototype update (section 8), touch-target check on phone, the tablet Reception table keeps no Lab code column.

## 13 · Revision 2 · Batch list, and the Nov 4 feedback · BUILT (Nov 4, 2026)

Written Nov 4, 2026. The sidebar item **Batches** must land on a list of all batches; choosing a row opens the batch page built in Revision 1. The owner also asked for the Photos view as a centered modal, and changed the library by hand (section 13.6).

### 13.1 Decisions (from the discussion of Nov 4)

| # | Decision | Status |
| --- | --- | --- |
| L1 | Clicking a row opens the **full batch page**; no preview pane (the spec's LIMS 4 bottom pane is dropped: it does not work on a phone) | Default, accepted |
| L2 | The batch page opens on the tab that matches the status: Created opens Reception, Preparation and Prep finished open Preparation, Analysis and Analysis finished open Analysis, Completed opens Analysis with the RoA | Default, accepted |
| L3 | The list opens **pre-filtered per role**: Preparation on Created and Preparation ("Batches to prepare"); Analyst on Prep finished and Analysis; Lab admin and CSO on All. The chips show it and can be changed; the same queues as My work | Default, accepted |
| L4 | **Add batch** on the list first asks for the job order (a dialog with a job order select), then opens the existing Add batch dialog for it | Default, accepted |
| L5 | From a job order's Batches tab a row still opens the batch page directly; the breadcrumb there starts at Batches (section 4) | As built |

### 13.2 The list page (spec S-07, `/batches`)

```
Sidebar      Batches active
Header       Batches                                                   [+ Add batch]
Chips        [All 46] [Created 3] [Preparation 4] [Prep finished 2] [Analysis 6] [Analysis finished 1] [Completed 30]
Filters      [Search batch, sample or job order]  [Company]  [Deadline]  [Filters]
Table card   Batch no. | Job order | Standard | Samples | Status | Deadline | RoA | >
Footer       Pager
```

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

`Reception_photos` on **desktop and tablet** becomes a centered **Dialog lg** over the reception page (instead of the side sheet on the right): title "Photos of KEP-3303", tag chips, a gallery of three photos per row (each with tag, taken by and time), the Add photo tile, footer Close and **Add photo**. The phone keeps the bottom sheet. Spec S-18 and section 4.5 of this plan change from "side sheet" to "dialog".

### 13.6 Library changes made by the owner (Nov 4)

| Change | Use |
| --- | --- |
| **Search, Size=sm** (32 px), all five states | Card toolbars next to sm buttons: the Reception scan field and any search inside a card. Page filters keep md, phone keeps lg |
| Tokens (light): `Feedback/error-100` `#F8E3DC` to `#FEE9E1`; `Status/st-analysis-100` `#E3EAF4` to `#D9E5F7`; `Primary/primary-100` `#E3EAF4` to `#E9EEF4` | Re-export `tokens/sgsi-tokens.json` and `.css`, regenerate `../Design System/Design_Tokens.md`, recheck contrast. Note: the message named `st-success-100`, but the file shows `st-analysis-100` changed; the plan follows the file |

### 13.7 Build steps (after go)

1. Tokens: export and docs (13.6).
2. Job order tabs (Job Order plan, Revision 11) and the photos dialog (13.5): rebuild rows C to F.
3. Batch list: `rowG.js`, 9 frames; `naming.js` rules for screen 01; `fit.js`; deploy when the open file has no unsaved edits; export.
4. Build status here and in the Job Order plan; memory; commit.
5. Prototype (Job Order prototype plan, section 14): batch list, tab order and the photos dialog join the pending update; publishing waits for the owner's go.

### 13.8 Open points

| # | Question | Default |
| --- | --- | --- |
| 12 | Canvas row for the list: G above F, or a second line in F? | G above F |
| 13 | Should Analyst and Preparation see Completed batches at all? | Yes, through the All chip |
| 14 | Batch list on tablet: table or cards? | Table with five columns |

### 13.9 Build status (Nov 4, 2026)

- **Batch list:** 9 frames in canvas row **G  Batch list** above row F (`library/screens/rowG.js`; naming rules for screen 01 in `naming.js`): Default (D, T, P), Batches_to_prepare (Preparation role, Created and Preparation chips on, 4 rows), Empty, No_results, Filters (desktop side sheet 480, phone bottom sheet) and Add_batch_choose_job_order (Dialog sm with the job order select and options). Demo data as in 13.4; B-2026-0413 shows the past due date in red with a separate "Past due" text.
- **Photos** on desktop and tablet is a centered Dialog lg (800 wide) with the gallery and the Add photo tile; the phone keeps the bottom sheet.
- **Small search** is used for the Reception scan field in the card toolbar (desktop and tablet).
- **Tokens:** `tokens/sgsi-tokens.json` and `.css` re-exported (three light values), `Design_Tokens.md` regenerated and its change log kept (the generator writes only current values, so `library/scratch/tokdoc13.js` re-adds the log: run it after `tokdoc.js`).
- **Build chain:** `build-screens.js C,D,E,G,F` (G before F, which starts below G), then `rev8.js D`, `naming.js`, `fit.js`, deploy, `export_all.js`.
- Open point 12 used its default (G above F).

## 14 · Revision 3 · Navigation decision and the desktop feedback of Nov 4 · BUILT (Nov 4, 2026)

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
| 1 | **Card anatomy**: Card top row = Card head (fixed 32) + Card content (`../Design System/Component_Library_Plan.md`, Card anatomy) | Reception (D 01 to 09, T 01, 03), Preparation (D 10, 11; T 10), Analysis (D 12 to 14; T 12; P 12, 13), RoA (D 13, 14; P 13); the analysis header line, the RoA hint, the returned note (08) move to Card content |
| 2 | Checklist inside the card, below the table (as in the owner's edit of 04) | Reception D 01, 02, 03, 05, 06, 09 and T 01, 03 (Preparation and Analysis already have it inside) |
| 3 | Condition cell: a 14 px icon after every select, **check-circle in Feedback/success** for Good and warning in Feedback/warning otherwise, so all selects have the same width ("Reception card ref") | Reception tables D 01 to 06, 08, 09; T 01, 03 |
| 4 | Job order number in the meta row in Primary/primary, documented as a link (14.1) | Every batch detail frame (24) |
| 5 | Preparation, entering: "4 of 6 saved" moves into the head, beside Save all | D 10, T 10 (phone: above the sticky bar) |
| 6 | Preparation, finished: "Ready for analysis" (check-circle and text in Feedback/success) at the right end of the head, on the title's line | D 11 |
| 7 | Batch list Samples column as "n / n", the same format as the job order list ("6 / 8", "12 / 12", "0 / 5": arrived or received over expected) | List D 01, 02, 05, 06; phone cards |
| 8 | Batch list Filters: a centered **Dialog lg** instead of the side sheet (desktop); the phone keeps the bottom sheet | D 05 |
| 9 | Table card padding 16 on all sides (Card anatomy) | Batch list D 01, 02, 05, 06 (job order list: Job Order plan Revision 12) |

### 14.3 Build steps (after go)

1. `rowF.js` and `rowG.js`: helpers for Card top row, Card head 32 and Card content; the changes above.
2. Rebuild rows C, D, E, G, F (with the Job Order Revision 12 changes), then `rev8.js D`, `naming.js`, `fit.js`; deploy when the open file has no unsaved edits; export.
3. The owner's reference frames ("... 12-Analysis_entering_results ref", "Reception card ref") are kept and skipped by the generators.
4. Build status, memory, commit. Prototype rows are added to the pending update.

### 14.4 Open points

| # | Question | Default |
| --- | --- | --- |
| 15 | The reference analysis card has padding 16 on all four sides; the card padding rule said 16 / 20. Which for all cards? | **Answered Nov 4: 16 on all four sides for every card** |
| 16 | Tablet heads whose actions do not fit in 32 px (Reception toolbar, Analysis) | Title and primary action in the head; search and secondary buttons on the first line of Card content |
| 17 | Gap between Card head and Card content | 0, as in the reference (the head's 32 px carries the space) |

### 14.5 Build status (Nov 4, 2026)

- Built as planned (14.2): card anatomy, checklist inside the Reception card, condition icon (check-circle for Good, warning otherwise) after every select, job order link in Primary/primary, "4 of 6 saved" beside Save all, "Ready for analysis" at the right end of the Preparation head, samples as "n / n" on the batch list, filters as a centered Dialog lg (desktop), Table cards padded 16.
- **Card content** has its own 8 px top padding (open point 17 answered by the owner: the content carries the space, the head and the content touch).
- **New pass `library/cards.js`** (runs after `naming.js`, before `fit.js`): removes the "WORK" layer of overline Splits, wraps a Card head and its notes or hints into a Card top row with a Card content, sets every Card head to 32 px, pads Table cards 16 and clears the side padding of the table rows inside. It also fixes the frames of row A that are not rebuilt.
- **Tablet:** the Reception toolbar (small search, Mark all arrived, Print labels) sits in Card content; the head keeps the title and Confirm reception. Open points 15 and 16 used their defaults.
- **Placement fix:** the row generators ignore the owner's reference frames and stale frames of the other rows when they choose where to start, so the canvas order is A, B, C, D, E, G (batch list), F (batch detail). The previous deploy had put D and E below G; this build puts them back in order.
- The owner's frames "... 12-Analysis_entering_results ref" and "Reception card ref" are untouched; frames 04, 08 and 10 that the owner edited by hand were regenerated to the same structure.
- Build chain: `build-screens.js C,D,E,G,F`, `rev8.js D`, `naming.js`, `cards.js`, `fit.js`, deploy, `export_all.js`.

**Nov 4, 2026 (later):** all cards are padded 16 on all sides (Component_Library_Plan, Card anatomy). The owner also set Card content to no top padding in the Analysis and RoA frames; the generators and `library/cards.js` follow, and the returned-samples note on Reception_confirmed is a "Card note" (padding 0 / 8) inside Card content, as in the owner's edit.
