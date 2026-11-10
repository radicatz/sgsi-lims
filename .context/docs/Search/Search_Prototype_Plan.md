# Search — Prototype Plan

> **FORMAT MISMATCH (flagged Nov 10, 2026).** The lab's sample identifiers changed (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code `CCC.BB.NNN.Lotxx` replace the lab code `B{batch}-NN`, and the client's own name is now the Client reference. This plan, the prototype it describes and the sample values in it (`BNM-3507`, `B0410-07`) **still show the old format and are not being rebuilt**. **Where they disagree, the spec wins.** Register of mismatches: `../Project/Sample_Identifiers_Plan.md`.

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 5.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Search_Screen_Plan.md`.

## 1 · Frames

Module 08, 26 frames. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Quick_search | Recent (D), Typing (D T), Exact_match (D), No_match (D) |
| 02 Search_results | All (D T P), One_type, CSO, No_results (D), Phone_start (P) |
| 03 Advanced_search | Empty (D), Sample_query (D T P), Results_query, Columns_menu, Save_query, Over_limit (D) |
| 04 Sample_history | Default (D T P), CSO, In_progress, Held (D) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Quick search | top bar (`/` focuses it) | Recent searches when empty; while typing, results grouped by type (samples, batches, job orders, reports, clients). An exact ID match opens the record on Enter. No match shows **Open advanced search**. **See all N results** opens the results page |
| Results | `#/search?q=` | Groups with **Show all**, the one-type view, no results ("Nothing matches…"), **Advanced search**. The CSO version has no result values and no RoA files. Phone: a start screen with **Scan a label** |
| Advanced search | `#/search/advanced` | See below |
| Sample history | `#/samples/:id/history` | Breadcrumb Job orders > job order. Timeline of events with the person (avatar 24) and date. **View values** (not for the CSO), **Export PDF**. In progress and Held versions |

**Advanced search:**

- Type select: Samples, Batches, Job orders, Results.
- Conditions: field, operator and value, with remove (x) and **Add condition**.
- **Match All / Any**: the fully rounded toggle component.
- **Clear all**, **Search**.
- Results table with a **Columns** menu (checkboxes) and **Export**.
- **Save query** dialog: name and **Share with staff**.
- Saved queries list (My queries, Shared with me) with a row menu: Rename, Duplicate, Share, Delete.
- Over the limit, the alert "Showing the first 500 of 2,318".
- The CSO cannot search Results.

## 3 · Links to other groups

| From | To |
| --- | --- |
| Results and history | The job order, batch, report and client pages (their plans) |
| Job order Samples tab and Reception row menus, **History** | Sample history |
| Sample history **Audit** (Supervisor, Manager, Superadmin) | Audit log filtered by the sample (Admin plan) |

## 4 · Gaps and differences

| Item | Prototype |
| --- | --- |
| **Audit** link on Sample history, not drawn (screen plan section 15) | Added for Supervisor, Manager and Superadmin |
| Saved queries row menu drawn closed | Rename, Duplicate, Share, Delete (own queries only; shared ones can be duplicated) |
| D4: BNM-3507 is on JO-2026-0131 here and on JO-2026-0139 in the job order frames | BNM-3507 stays on JO-2026-0131 (Job order plan, D4) |

## 5 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| SE1 | Quick search | any | Top bar search → recent → type "BNM-3501" → exact match → sample history |
| SE2 | Advanced search | Lab admin | Conditions, **Match All / Any**, **Columns**, **Save query** (shared), **Export** |
| SE3 | From history to audit | Supervisor | Sample history → **Audit** → audit log filtered by record |

## 6 · Spec only

- Saved queries live in the browser.
- **Export** and **Export PDF** download a sample file.
