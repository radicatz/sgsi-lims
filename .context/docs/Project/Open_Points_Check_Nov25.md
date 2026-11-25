# Open points check against the sources (Nov 25, 2026)

Written for: the product owner, to decide what to fix.

**Status (Nov 25, evening):** everything is fixed or decided. M-1 is built (section 6); nothing is committed.

**What was checked:** every open-point and decision table in `.context/docs` (40 plan files, archive excluded). Each was checked against the spec, the research plan, the V1 build plan, the code as built, and the source documents in `.context/source-documents`:
- the SIM Lab screens in the proposal, pages 17 to 22: Dashboard Quality, Users, Companies, Drill hole, Lithology, Seam, Batch list, Input ROA, Review ROA;
- the SIMLab slides (`simlab view.pptx`: sign-in, Order Lab, order detail, sample data);
- the sample RoA and CoA PDFs.

The slice C decisions (`Phase5_Build_Design.md` 12.11) were checked first and are not repeated here.

## 1 · Misaligned: needs a decision or a fix

| # | Point | What the plans or sources say | What is built or decided | Proposal |
| --- | --- | --- | --- | --- |
| M-1 | **Ply / Composite per sample** | Spec section 10, Information columns: "Ply/Comp*" required, marked **Fixed**; the spec has a `ply_comp` enum. SIM Lab's Input ROA and Review ROA both have a Ply/Comp column. The Dashboard plan's Sample type mix (O8) is "Ply or composite, and lithology" | Samples have no ply/comp field anywhere: not on the job order Samples tab, not on the batch. The Sample type mix groups by the job order's sample type (Exploration cores, Shipment, Stockpile, Channel samples: Phase 5 decision 7). This also disagrees with the Dashboard plan's open point 1 default (Ply, Composite, Roof and floor, Parting) | Add **Ply/Comp** to the job order Samples tab (with the paste and import), then group the mix by Ply/Comp and by lithology kind. The lithology kinds are Coal, Parting and No lithology (Master Data decision 6, from SIM Lab's Lithology page). "Roof and floor" appears in no source. Until then the chart keeps the job order sample type |
| M-2 | **Seam and lithology per sample** | SIM Lab Review ROA shows Interval Lithology chips and Thickness per sample. Spec D-19: several lithologies per interval. SIM Lab's Lithology page counts samples per lithology | The `sample_intervals` table exists, but no screen fills it, so seam and lithology are empty for every sample. The master lists' sample counts by lithology or seam stay 0 | Decide whether v1 records seam and lithology per sample (job order Samples tab or Reception). If not, note it as next goal in the spec and the Master Data plan |
| M-3 | **RoA export as XLSX and CSV** | Spec F-RPT-01, **Fixed**: RoA export PDF, XLSX, CSV, per batch and per drill hole. SIM Lab offers all three on the batch list, Input ROA, Review ROA and the dashboard's drill-hole list. Research plan: RoA export, week 3 | v1 has the app-drafted RoA PDF and the uploaded signed PDF only. Phase 6's "CSV and XLSX export on every list" covers lists, not the RoA itself. Nothing schedules F-RPT-01's XLSX and CSV | Put the RoA XLSX and CSV (per batch, and per drill hole on the dashboard's Drill holes card) into phase 6 explicitly, or mark F-RPT-01 as PDF only in v1 |
| M-4 | **Delete a batch** | Spec D-30 and S-07: a batch can be deleted only before Start Preparation (while Created, nothing arrived). SIM Lab's batch list has a delete action | Batch build open point 9: "Not in phase 3; the frames have no Delete". No later phase picks it up, and there is no delete route | Schedule it (one menu item on Created batches with nothing arrived), or record in the spec that v1 has no batch delete |
| M-5 | **Batch number uniqueness** | Spec D-45: uniqueness **per company**. SIM Lab numbers batches per company ("Batch 1" to "Batch 9" for PT Bukit Asam) | Batch build open point 8: unique **across the lab**, as the database checks | Pick one and correct the other. Lab-wide is safer for search and labels; per company matches the spec and SIM Lab |
| M-6 | **Charts library** | Stack record S-9 and its open point 4: ECharts. The Prototype plan says "the real app uses ECharts" | Phase 5 decision 3 chose hand-drawn SVG, and the Dashboard is built that way | Add S-9 to the Stack record's "As built" table (section 5) and correct the Prototype plan line |
| M-7 | **Superadmin changes a user's email** | Admin plan open point 4: allowed until the first sign-in | Not built: the edit form and `PATCH /users/:id` have no email field | Build it (invited users only), or change the open point to "not in v1" |
| M-8 | **Notification retention** | App plan open point 7: 90 days, then removed | Nothing removes old notifications | A nightly clean-up, or change the open point to "kept" |
| M-9 | **Lockout window** | App plan open point 1: 5 failed attempts **within 15 minutes** | 5 failed attempts in a row, with no time window (the count resets only on a successful sign-in) | Add the window, or change the open point to "5 in a row" |
| M-10 | **Search plan, open points 1 and 6** | Search plan: Preparation sees no values; export as CSV or XLSX | Phase 5 B-5: Preparation follows `result.read` (sees values). Decision 1: CSV now, XLSX in phase 6 | Update the Search plan's open points to the decisions |
| M-11 | **My Work plan, open point 2** | Recent activity: whole lab, last 8, linked to the audit log | Built from the batch log, with no audit link, because the roles with My work have no `audit.read` (Phase 5 section 9) | Update the My Work plan |
| M-12 | **Stale references** | The Dashboard plan (section 5 O8, section 10, open point 1) and spec S-01 call the sample type categories "R-07" | R-07 is now the sample coding scheme, closed Nov 10 | Give the category question its own number, or point to M-1 |
| M-13 | **Research plan checklist** | "Open questions for the lab" still unticked: who verifies and signs; who issues the CoA; the NCV formula; one CoA template or several | Answered: the Laboratory Manager signs (R-21, digital, Reports 7.1); the lab issues the CoA (D-26); NCV with estimated hydrogen (Seyler); a house template in v1 (Reports plan 12.4) | Tick them, with the answer and date |

## 2 · Settled by the sources (defaults confirmed)

| Plan | Point | Source | Result |
| --- | --- | --- | --- |
| Dashboard plan 12.2 | Drill-hole list: all, or only those with samples in the period | SIM Lab dashboard lists 74 drill holes; its master has 100 | Confirmed: only those with samples |
| Dashboard plan 12.3, Phase 5 decision 5 | Turnaround target | SIMLab's order shows "Rencana Tanggal Selesai: 10 Hari" for a barge package. The build reads each service's turnaround from Configuration and falls back to 5 or 10 days | Consistent |
| Batch build 13.4 | Decimal sign | SIM Lab Input ROA rule 1: "use the dot as the decimal separator" | Aligned (the app also accepts a comma) |
| Batch build, locks | Samples can't be removed once preparation starts | SIM Lab Input ROA rule 5 | Aligned |
| Master Data decision 8 | 25 rows per page | SIM Lab lists | Aligned on the master lists. The batch and job order lists page by 10 |
| Reports plan 12.5 | Each print logged | Built (`print_count`, last printed) | Aligned; supports slice C decision C-4 |
| Phase 5 C-1, C-2, C-3, C-5, C-6 | Quality tab and Audit log | SIM Lab Quality dashboard, Admin and App plans | Settled (Phase 5 section 12.11) |

## 3 · Still open with the lab (no source answers them)

- Field lists for Form of Sulphur and Metal in Ash (SIM Lab shows the tab names, not the fields).
- Methods per parameter and their editions, with repeatability limits (request item 13).
- Hosting for production (R-11, Stack record open point 2).
- How often a shipment arrives in parts (R-01, D-41).
- Whether CSR/CRI and the Chinese coking tests run in-house (Job Order plan, Revision 2 open point 6).
- The lab's batch number format (D-45; see M-5). The job order number format stays `JO-YYYY-NNNN` (R-10). SIMLab's `BGL/6102/50/…` numbers belong to the parent system, not to SGSI.
- Phase 5 C-4 (which exports are logged) and C-7 (Trend CV per sample or per batch).

## 4 · Fixed on Nov 25, 2026

| # | Fix |
| --- | --- |
| M-6 | `Stack_Decision_Record.md`: S-9 added to "As built" (hand-drawn SVG), open point 4 marked changed. `Prototype_Plan.md`: the "real app uses ECharts" line corrected |
| M-7 | Built. An invited user who never signed in can have the email corrected in **Edit user** (`PATCH /users/:id` takes `email`). The auth account and the profile change together, and saving shows a new invite link. After the first sign-in the field stays locked. Test added to `e2e/phase1-users.spec.ts`, 18 of 18 pass at three sizes |
| M-8 | Built. The 15-minute deadline timer also removes notifications older than 90 days (`deadlineSweep` in `routes/notifications.ts`) |
| M-10 | `Search_Screen_Plan.md` open points 1 and 6 now carry Phase 5 B-5 and decision 1 |
| M-11 | `My_Work_Screen_Plan.md` open point 2 now says how Recent activity was built |
| M-12 | The "R-07" references for sample type categories are replaced in the Dashboard plan, spec S-01 and the Phase 5 design, pointing to M-1 |
| M-13 | Research plan: four lab questions ticked, each with its answer and date |

## 5 · Left

| # | Waits on | What happens next |
| --- | --- | --- |
| M-9 | The owner runs `supabase/migrations/20261126000200_failed_attempts_window.sql` (`profiles.failed_since`) | Sign-in then counts only failed attempts within 15 minutes of the first one; a later failure starts a new count |
| M-1 | Decision: add Ply/Comp per sample (job order Samples tab, paste, import), then regroup the Sample type mix | Needs a column on `samples` (SQL for the owner) |
| M-2 | Decision: record seam and lithology per sample in v1, or mark them next goal | If v1: a screen to fill `sample_intervals` |
| M-3 | Decision: RoA XLSX and CSV in phase 6, or v1 PDF only | Changes spec F-RPT-01 or the phase 6 list |
| M-4 | Decision: batch delete (Created, nothing arrived) now, or no delete in v1 | One menu item and a route; the frames have no Delete |
| M-5 | Decision: batch number unique lab-wide (as built) or per company (spec D-45, SIM Lab) | The spec or the database changes to match |

## 6 · Decided and done (Nov 25, 2026, evening)

The owner ran the M-9 SQL and took the suggestions for M-1 to M-5.

| # | Decision | Done |
| --- | --- | --- |
| M-9 | 5 failed attempts within the window lock the account | Built: `profiles.failed_since`; a failure older than the window (the Security setting's lock minutes, 15) starts a new count; success, Set password, Unlock and Reactivate clear it. Checked against the running API: 4 old failures + 1 → count 1; 4 recent + 1 → locked (the demo account was restored) |
| M-4 | Delete a batch while Created with nothing arrived | Built: **Delete batch** in the batch page's menu for people with `batch.create`, with a confirm; the samples go back to the job order; its N1 notices are removed; the audit log keeps the record. `e2e/batch-delete.spec.ts` 6 of 6 at three sizes. Spec D-30 and Batch build open point 9 updated. The frames draw the menu closed, so none changes |
| M-5 | Batch number unique across the lab | Spec D-45 and Batch build open point 8 updated; nothing in the code changes |
| M-3 | RoA XLSX and CSV in phase 6 | Spec F-RPT-01 and `V1_Build_Plan.md` phase 6 updated |
| M-2 | Seam and lithology per sample are next goal | Spec D-19 and Master Data decision 6 updated |
| M-1 | Record Ply/Comp per sample | Built after the owner ran `20261126000300_sample_ply_comp.sql` (checked: `samples.ply_comp`, its check, and `v_samples` rebuilt, still 68 samples). **Samples tab:** a Ply / Comp select per row on desktop and tablet, a select in the phone edit sheet and the word on the phone card; a pasted cell reading Ply or Composite is taken out first, so the other columns keep their places. **Sample history:** a "Ply or composite" line on the card and in its PDF. **Job order History:** the change reads "Ply or composite". **Dashboard:** the Sample type mix groups by Ply, Composite and Not set (it used the job order's sample type). `e2e/ply-comp.spec.ts` 3 of 3 at three sizes. The batch Reception and RoA do not show it yet (next goal with seam and lithology) |

**Regression run (Nov 25, evening):** `phase2-orders` and `phase5-work` at three sizes: 40 of 41 passed on the first run. The failure was the tablet JO10 test: the job order Samples grid scrolled sideways (688 px in a 664 px card). It came from the **History** icon button added in slice B (commit 99c2e1a), which was never run against the job order tests. On a row with History, Mark not received and Remove, the three icons overflowed the 72 px Action column. Fixed by widening the tablet Action column to 104 px (Depth 122, Batch 96, Status 128); all three slice B job order tests pass on tablet. The Ply/Comp change did not cause it (the grid overflowed the same with the Ply/Comp cell removed).
