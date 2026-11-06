# Job Orders — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 3.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Job_Order_Screen_Plan.md`. The version 31 plan is in `../archive/Job_Order_Prototype_Plan_v31.md`. Its rules for parameters, standards, contacts and samples carry over as logic, and its screens are rebuilt from the current frames.

## 1 · Frames

Module 03, 55 frames. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Job_orders_list | Default (D T P), Empty (D) |
| 02 New_job_order | Desktop: Form (also T), Contact_dropdown_list, Contact_dropdown_edit, Signatory_dropdown_list, Signatory_dropdown_edit, Ash_analysis_open, Validation_errors, Remove_contact, Coking_coal_ASTM_and_GBT. Phone: Step_1, Step_2, Contact_sheet_list, Contact_sheet_edit, Signatory_sheet_list, Signatory_sheet_edit, Ash_analysis_sheet |
| 03 Job_order_detail | Overview (D T P), Overview_dark_preview (D), Batches (D T P), Batches_empty (D T), Batches_samples_awaiting_arrival (D), Samples (D T P), Samples_mixed_states (D T P), Samples_mark_as_not_received (D T P), Samples_submitted_toast, Samples_paste_preview, Samples_unsaved_rows, Samples_locked_row_tooltip (D) |
| 04 Add_batch | Dialog (D T), Late_samples (D), Step_1, Step_2 (P) |
| 05 CoA_and_actions | Mark_sent (D; P as Mark_sent_sheet), Sent, Cancel_job_order, Ready_to_generate, Draft_in_progress (D) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| List | `#/orders` | **New job order** and **Filters**. Status chips All, Draft, Awaiting samples, In progress, Reported, Delivered, Closed and Cancelled, with counts. Search ("Search no., company, PO…"), Company, CSO and Due date filters. Rows open the detail. Row menu: Open, Edit, Cancel. Pager. Empty state. Phone: cards and a sticky **New job order** |
| New job order | dialog, phone steps | See below |
| Detail | `#/orders/:no` | Breadcrumb, status, a header icon row (contact, PO, due date; past due in the error colour), **Edit**, and ⋯ (Edit, Cancel, Close). Tabs **Overview**, **Samples**, **Batches**, **Files**, **CoA**, **History**, with counts on Samples, Batches and Files only. The phone tabs scroll sideways |
| Overview tab | | Properties, stepper, batch list (each row opens the batch page), CoA card |
| Samples tab | `#/orders/:no/samples` | See below |
| Batches tab | `#/orders/:no/batches` | Table with separate Preparation and Analysis columns (avatar, name, date). Rows open the batch page. **Add batch** (CSO, Preparation, Lab admin). Empty state. The amber note for samples awaiting arrival |
| Add batch | dialog, phone steps | See below |
| CoA tab | `#/orders/:no/coa` | See below |
| Cancel | dialog | "Cancel JO-2026-0137?" with **Keep job order** and **Cancel job order**. Only before any sample is received |
| Files tab, History tab | | Not drawn (section 4) |

**New job order** (a dialog on desktop and tablet, two steps on the phone):

- Company name: search, or add a new one.
- Address.
- Contact person dropdown: list, edit with Save, **Add contact**, and remove with a confirm dialog.
- Client reference / PO, Sample type, Priority.
- Standard chips **ASTM / ISO / GB/T**.
- Quick select: **TM + Prox + TS + CV**, **Prox only**, **Full analysis**, **Coking coal**, **Preparation only**, **Clear**.
- **Search parameters…** and the parameter pills, with coverage tags.
- The **Ash analysis ▸** and **Trace elements ▸** checklists, closed with **Done**.
- Expected samples, Due date.
- Default signatory dropdown with **Add signatory**.
- A Drop zone for files.
- Footer: **Cancel**, **Save as draft**, **Submit**. Missing fields show the error summary "Fix 3 fields to submit".
- Phone: Step 1 (**Save as draft**, **Next**), Step 2 (**Back**, **Submit**), and bottom sheets for the contact, the signatory and the Ash checklist.

**Samples tab:**

- **Add row**, **Paste from Excel**, **Import list** (shows a toast), **Save (3)**.
- Paste from Excel opens an lg dialog: rows found, new, duplicate, then **Add 11 rows**.
- Unsaved rows show a dot; a duplicate shows the alert "Fix 1 duplicate ID before saving".
- Sample states: Expected, In batch, Received, Awaiting arrival, Not received.
- Locked rows show the tooltip "Received on 21 Oct by Dedi Kurniawan…".
- Action column: **Mark as not received** (a dialog, a bottom sheet on the phone, with a Reason select) and **Restore**.
- After Submit: the empty state with **Add samples** and the toast "JO-2026-0143 submitted. Add the sample IDs next."
- Phone: **Add sample**.

**Add batch** (a dialog on desktop and tablet, two steps on the phone):

- The head shows the job order and the client.
- Batch no. (editable), CoC no., Batch date, Deadline.
- Standard: one of the job order's standards. Priority.
- Parameter pills.
- Sample checklist with **Select all (16)** and **Clear**; late samples are pre-ticked.
- **Create batch**.
- Phone: Step 1 (**Next (8 selected)**), Step 2 (**Back**, **Create batch**).

**CoA tab:**

- Ready to generate: **Generate CoA** opens the Reports draft.
- Draft in progress: **Continue draft**.
- Published: **Download PDF**, **Print**, **Mark sent**, **Open in Reports**.
- Mark sent dialog: date, channels Hard copy, Email, WhatsApp and Other as checkboxes, recipient, note, **Confirm**. A bottom sheet on the phone.
- Sent: **Add another send**.

## 3 · Links to other groups

| From | To |
| --- | --- |
| CoA tab **Generate CoA**, **Continue draft**, **Open in Reports** | Reports CoA page (Reports plan) |
| Batches tab row, Overview batch list | Batch page; its breadcrumb starts at Batches (Batch plan) |
| Samples tab row menu **History** | Sample history (Search plan) |
| Contact person dropdown | The same contact records as the client page (Master data plan) |
| Parameters and quick select | Configuration Parameters and Services (Admin plan) |
| Submit, Add batch, Mark sent | Notifications N1 and others (App plan) |

## 4 · Gaps the frames leave open

| Gap | How the prototype fills it |
| --- | --- |
| Row menu (list) drawn closed | Open, Edit, Cancel (screen plan, list columns) |
| **History** in the Samples tab row menu (Search plan) | Added |
| **Files** tab (counts 0 to 2 in the frames) | A list of the files added in New job order: File chip, name, size, added by, date, Download, Remove, and a Drop zone. Tagged "Built from the pattern" |
| **History** tab | The job order's audit entries, in the Audit log row layout (expandable Before and After). Tagged "Built from the pattern" |
| Edit job order | The New job order dialog pre-filled, titled "Edit JO-2026-0142". Disabled once a batch is in preparation, with the reason |
| Close job order | A confirm dialog, only when the job order is Delivered |

## 5 · Differences with other groups

| # | What differs | Prototype uses |
| --- | --- | --- |
| D1 | **JO-2026-0142** belongs to PT Bara Nusantara Mandiri here, in Batches and in Dashboard. Its CoA (CoA-JO-2026-0142-1) is for **PT Bukit Asam Tbk**, Attention Budi Santoso, in Reports and the report template preview | JO-2026-0142 stays PT Bara Nusantara Mandiri. The Bukit Asam CoA moves to a job order of its own, **JO-2026-0130** (Reports plan) |
| D2 | **PT Bara Nusantara Mandiri contacts**: here Budi Hartono, Sari Wulandari and Dewi Anggraini; on the client page Budi Santoso (default), Rina Ayu Lestari and Sari Wulandari (Finance) | Bara Nusantara: Budi Hartono (default), Sari Wulandari, Dewi Anggraini. Budi Santoso and Rina Ayu Lestari are PT Bukit Asam Tbk contacts |
| D3 | The Mark sent recipient for JO-2026-0141 (PT Kaltara Energi Prima) is **Sari Wulandari**, a Bara Nusantara contact | The Kaltara contact on that job order |
| D4 | **BNM-3507** is on JO-2026-0139 (PT Mahakam Coal Resources) here, but on JO-2026-0131 in Sample history and the Audit log. The BNM prefix belongs to Bara Nusantara Mandiri | BNM samples stay on Bara Nusantara job orders. JO-2026-0139's samples get Mahakam codes (MCR-…), and BNM-3507 stays on JO-2026-0131 |
| D5 | **Dates**: these frames were drawn around 21 to 28 Oct (Add batch "Batch date 27 Oct", "Due date 24 Oct"). Dashboard, Reports, Search and Admin use 2 to 5 Nov, with "today" Thursday 5 Nov | Today is 5 Nov. Records keep their history dates, and new forms default to today. Due dates are set so the "past due" and "due within 24 h" examples still read as drawn |
| D8 | **Signatory title**: "Ir. Bambang Sutrisno, M.T., Head of Laboratory" on the phone sheet; in the Users list he is the Manager | That name and title, with the role Manager |

## 6 · Flows

The version 31 flow numbers are kept in the "Was" column.

| ID | Flow | Role | Steps | Was |
| --- | --- | --- | --- | --- |
| JO1 | Create a job order | CSO | List → **New job order** → client, contact, Standard, quick select, pills → **Submit** → Samples tab with the toast | F1 |
| JO2 | Draft, validation | CSO | **Save as draft**; **Submit** with 3 empty fields → "Fix 3 fields to submit" | F1a, F1b |
| JO3 | Contacts and signatory | CSO | Add, edit and remove a contact (the client page shows the same contacts); add a signatory | F1c–F1e, F8 |
| JO4 | Ash checklist, coking standards | CSO | **Ash analysis ▸** → search → **Done**; ASTM + GB/T → **Coking coal** → pills with their tags | F10, F11 |
| JO5 | Register samples | CSO | **Paste from Excel** → preview with 1 duplicate → **Add 11 rows** → fix → **Save**; locked rows | F2, F2b |
| JO6 | Add a batch | Lab admin | JO-2026-0137 → Batches → **Add batch** → **Create batch** → new row | F9 |
| JO7 | Generate and send the CoA | Lab admin, then CSO | CoA tab **Generate CoA** → RE2 → back → **Mark sent** (two channels) → Delivered | F4 |
| JO8 | Edit, cancel, close | CSO | ⋯ → Edit, Cancel (reason), Close | F5 |
| JO9 | Create on a phone | CSO | 390 → **New job order** → Step 1 → **Next** → Step 2 → **Submit** | F7 |
| JO10 | Mark a sample not received | CSO | Samples → **Mark as not received** (reason) → **Restore** | F19 |
| JO11 | Files and history | CSO | Files tab → add a file; History tab → see the changes made in JO1 to JO10 | — |
| JO12 | Read-only visit | Preparation | List → detail → Samples tab without edit controls; **Add batch** still on the Batches tab | F6 |

## 7 · Demo data

| Item | Values |
| --- | --- |
| Job orders | JO-2026-0130 to JO-2026-0143 |
| Key records | JO-2026-0142: in Analysis, two batches. JO-2026-0137: 16 registered samples (KEP-3301 to KEP-3316) and no batch. JO-2026-0139: samples in every state. JO-2026-0141: CoA ready, then sent. JO-2026-0134: 6 expected samples. JO-2026-0143: created by JO1. Also one Draft, one Cancelled and one Closed |
| Parameters | The 36 pills in 9 groups, the 29 Ash analysis items, the 36 trace elements, the quick-select services, the standards and methods table, from version 31 and the Configuration frames |
| Paste sample | The tab-separated paste of version 31, with drill hole and interval as two columns |

## 8 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Files and History tabs: build them from the patterns above, or draw frames first? | Build them, tagged "Built from the pattern" |
| 2 | D1 to D5 and D8: fix the frames to match after the prototype? | Yes (shared open point 4) |
