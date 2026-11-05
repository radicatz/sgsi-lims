# Frame naming

Nov 3, 2026. Every screen frame in `SGSI-LIMS-screens.figcraft` (Desktop, Tablet and Mobile Phone pages) and every exported PNG uses this name.

Written for: designers and anyone who generates or exports frames.

## Format

`{Size}-{MM}-{Module}-{SS}-{Screen}-{VV}-{Variant}`

| Part | Rule | Example |
| --- | --- | --- |
| Size | Desktop, Tablet or Phone (the Mobile Phone page) | `Desktop` |
| MM | Two-digit number of the sidebar module, in sidebar order | `03` |
| Module | The sidebar item, words joined with underscores | `Job_orders` |
| SS | Two-digit number of the screen inside the module, in flow order | `02` |
| Screen | Screen title, underscores | `New_job_order` |
| VV | Two-digit number of the state or variant inside the screen; the same state keeps the same number on all sizes where it exists | `04` |
| Variant | State or variant, underscores, no dots or slashes | `Contact_dropdown_list` |

Example: `Desktop-03-Job_orders-02-New_job_order-04-Contact_dropdown_list`.

Sorted by name, the frames group by size, then module, then screen, then state.

## Module numbers (sidebar order)

App 00 (screens outside the sidebar), My_work 01, Dashboard 02, Job_orders 03, Batches 04, Input_ROA 05, Review_ROA 06, Reports 07, Search 08, Clients 09, Drill_hole 10, Lithology 11, Seam 12, Users 13, Configuration 14, Audit_log 15. The sidebar Batches item (04) is the batch module across job orders and is not designed yet; the Batches tab of a job order is a state of Job_order_detail, so its frames keep the Job orders item active in the sidebar.

## Job orders screens

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Job_orders_list | 01 Default, 02 Empty |
| 02 | New_job_order | 01 Form, 02 Step_1, 03 Step_2, 04 Contact_dropdown_list (phone: Contact_sheet_list), 05 Contact_dropdown_edit, 06 Signatory_dropdown_list, 07 Signatory_dropdown_edit, 08 Ash_analysis_open (phone: Ash_analysis_sheet), 09 Validation_errors, 10 Remove_contact, 11 Coking_coal_ASTM_and_GBT |
| 03 | Job_order_detail | 01 Overview, 02 Overview_dark_preview, 03 Batches, 04 Batches_empty, 05 Batches_samples_awaiting_arrival, 06 Samples, 07 Samples_mixed_states, 08 Samples_mark_as_not_received, 09 Samples_submitted_toast, 10 Samples_paste_preview, 11 Samples_unsaved_rows, 12 Samples_locked_row_tooltip |
| 04 | Add_batch | 01 Dialog, 02 Late_samples, 03 Step_1, 04 Step_2 |
| 05 | CoA_and_actions | 01 Mark_sent (phone: Mark_sent_sheet), 02 Sent, 03 Cancel_job_order |

The screen number equals the row letter on the canvas (A 01, B 02, C 03, D 04, E 05).

## How it is applied

- `library/naming.js` holds the rules and renames all frames of the three pages (`node naming.js <in> <out>`); run it at the end of every build, after the row generators, and before exporting.
- The generators (`rowB.js` to `rowE.js`) still create frames under their short working names and find their earlier frames under either name.
- Frames the owner keeps as references (names ending in "reference", "edit", "edit dark", and "Select reference", "Properties ref") are not renamed and not exported.
- Exports go to `.context/design/export/`, one PNG per frame, file name = frame name.
- A new screen or state gets the next free number; a new module takes its sidebar number.

## Batches screens (module 04)

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Batch_list | 01 Default, 02 Batches_to_prepare, 03 Empty, 04 No_results, 05 Filters, 06 Add_batch_choose_job_order |
| 02 | Batch_detail | 01 Reception_receiving, 02 Reception_print_labels, 03 Reception_photos, 04 Reception_ready, 05 Reception_confirm_with_fewer, 06 Reception_hold_sample, 07 Reception_scan_label, 08 Reception_confirmed, 09 Batch_number_edit, 10 Preparation_entering_ADL, 11 Preparation_finished, 12 Analysis_entering_results, 13 Analysis_finished_upload_RoA, 14 Completed |

Canvas row G holds the batch list frames and row F the batch detail frames. `fit.js` runs after `naming.js` on every build.

## My work (module 01)

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Overview | 01 Lab_admin, 02 Preparation, 03 Analyst, 04 CSO, 05 All_caught_up |
| 02 | Queue | 01 Batches_to_receive, 02 CoAs_to_send_multi_select |

Canvas row H holds the My work frames.

## Dashboard (module 02)

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Operations | 01 Lab_admin, 02 Supervisor, 03 CSO, 04 Sidebar_collapsed, 05 Sidebar_open (tablet), 06 No_data, 07 Filters (phone) |
| 02 | Quality_and_reports | 01 Default, 02 Missing_CoA, 03 Point_tooltip |

Canvas row I holds the Dashboard frames. These frames are created under their final names.

## App (module 00)

Screens outside the sidebar. Sign in, Notifications and Profile join this module later.

| SS | Screen | Variants (VV) |
| --- | --- | --- |
| 01 | Sidebar_by_role | 01 Expanded (desktop), 02 Collapsed (tablet) |
| 02 | Menu_drawer | 01 Lab_admin, 02 CSO (phone) |
| 03 | No_access | 01 Default (desktop, phone) |

Canvas row J holds the App frames.
