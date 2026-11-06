# Reports — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 5.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Reports_Screen_Plan.md`.

## 1 · Frames

Module 07, 26 frames, plus two job order CoA states (Ready_to_generate, Draft_in_progress) in the Job order plan. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Reports_list | CoA_tab (D T P), RoA_tab, CSO, Analyst, Multi_select, Empty, No_results (D), Filters (P) |
| 02 CoA | Draft (D T P), Draft_signatory, Publish_confirm (D), Published (D T P), Mark_sent, Sent, Revise, Superseded, Void_confirm (D) |
| 03 RoA | Default (D P), Analyst (D) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Reports list | `#/reports` | See below |
| CoA page, Draft | `#/reports/:no` | Preview with page arrows (caret left and right). Bases **ADB / DB / DAF / AR**, parameter pills, Attention select, Signatory select, Client reference or PO. **Publish** opens the confirm dialog ("It gets the number CoA-JO-2026-0132-1…"); **Publish** gives the number, and a toast offers to save the bases and signatory as the client's default. ⋯ **Delete draft**. Phone: **Open PDF**, **Preview PDF**, **Publish** |
| CoA page, Published | `#/reports/:no` | **Download**, **Print**, **Mark sent** (the same dialog as the job order: date, channels, recipient, note), then Sent with **Add another send**. ⋯ **Revise** (Lab admin): a dialog, then **Create revision** makes revision 2, and revision 1 shows the Superseded alert. ⋯ **Void** (Superadmin): a destructive dialog with **Keep CoA** and **Void CoA**. Phone: **Open PDF**, **Download**, **Mark sent** in a sticky bar |
| RoA page | `#/reports/roa/:no` | The "Internal, not for distribution" alert, **Download**, **Print**. The Analyst version |

**Reports list:**

- Tabs **CoA** and **RoA** with counts, only for roles that see both. The CSO sees CoAs only and the Analyst RoAs only, with no tabs.
- Search, Period (Last 90 days), Company.
- Status chips: All, Draft, Published, Sent, Superseded.
- Row checkboxes open a selection bar with **Download PDFs** and **Clear**.
- Each row has a download icon and a row menu:
  - CoA: Open job order, Print, Mark sent (CSO, published), Revise (Lab admin), Void (Superadmin).
  - RoA: Open batch, Print.
- Empty and No results states. Phone: a Filters sheet.

## 3 · Links to other groups

| From | To |
| --- | --- |
| Job order CoA tab, **Generate CoA**, **Continue draft**, **Open in Reports** | CoA page |
| CoA page, the job order number; row menu **Open job order** | Job order CoA tab (Job order plan) |
| RoA row menu **Open batch** | Batch page (Batch plan) |
| Publish | Notification N6 to the CSO (App plan) |
| Report layout | Configuration Report templates (Admin plan) |

## 4 · Gaps and differences

| Item | Prototype |
| --- | --- |
| Row menus drawn closed | Items as listed in section 2 (screen plan, section 4) |
| **Delete draft** (screen plan) | A destructive dialog, then back to the job order CoA tab |
| Page arrows on the preview | Pages 1 and 2 of the sample certificate image |
| D1: CoA-JO-2026-0142-1 is drawn for PT Bukit Asam Tbk, but JO-2026-0142 is a PT Bara Nusantara Mandiri job order | The Bukit Asam CoA becomes CoA-JO-2026-0130-1, on a Bukit Asam job order JO-2026-0130 with its batch and RoA-0412. JO-2026-0142 gets its own CoA once its batches complete |
| D6: Draft_signatory shows **Type manually** next to the signatory; the job order form removed manual entry in Revision 3b | As the job order: pick from the list or **Add signatory** |

## 5 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| RE1 | Find and download reports | Analyst, CSO | Reports → RoA only (Analyst) or CoA only (CSO) → filters → multi-select → **Download PDFs** |
| RE2 | Build and publish a CoA | Lab admin | Draft → bases, signatory → **Publish** → confirm → number → N6 to the CSO |
| RE3 | Revise and void | Lab admin, Superadmin | Published CoA → **Revise** → revision 2, revision 1 Superseded; as Superadmin: **Void** |

## 6 · Demo data

The CoAs and RoAs of the Reports list frames (21 CoAs, 46 RoAs), attached to the job orders and batches of the Job order and Batch plans, with the D1 change.

## 7 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | D6: drop **Type manually** from the Draft CoA frame too? | Yes, with the frame fixes after the prototype |
