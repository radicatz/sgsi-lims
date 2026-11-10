# SGSI LIMS — v1 Build Plan

Written Nov 10, 2026. **Status: proposed, waiting for go.**

This plan replaces the "Roadmap & phasing" section of `Coal_LIMS_Research_and_Project_Plan.md`. That four-week plan was written before D-44 (Oct 29) took the analyst worksheet (Input ROA, Review ROA) and the RoA approval gate out of v1. It also predates every screen built since Oct 30.

The build follows the screens and the prototype as they are now:
- Screens: the FigCraft file and the `<Group>_Screen_Plan.md` files.
- Behaviour: prototype v2 and the `<Group>_Prototype_Plan.md` files.
- Data and rules: `Coal_LIMS_Development_Spec.md`.
- Technology: `Stack_Decision_Record.md`.

## 1 · What v1 is

The v1 scope is spec 1.1 (D-44): report and monitor job orders. The CSO registers the request and samples. The lab receives, prepares (ADL), enters final values, uploads its signed RoA and completes each batch. The lab admin builds and publishes the CoA, and the CSO sends it. Everyone follows the work on My work, the dashboards and search.

Not in v1:
- the analyst worksheet (S-09, S-10)
- RoA drafting and approval in the system
- imports (S-16)
- shipments and other Extended modules
- a client portal
- email notifications

## 2 · Phases

Each phase ends on a staging link you can click through, and with its gate met. Sizes are relative (S, M, L), not dates. The pace is set after phase 0.

| Phase | Builds | Screens (plans) | Gate (done when) | Size |
| --- | --- | --- | --- | --- |
| **0 · Foundation** | Repo, Compose, CI. Migrations from the spec DDL plus the changes in section 3. Seed data. Roles, permissions, RLS and their tests. Sign-in, invite, reset, lock after failed attempts, idle sign-out. App shell (sidebar by role, top bar, drawer). The component layer ported from the prototype. Audit trigger. Staging deployment | App screens, Navigation | Every persona signs in and sees their own sidebar on staging. Permission tests pass for every role. Every table change writes an audit row | L |
| **1 · Master data and settings** | Clients (contacts, logo, archive), Drill hole (CoA upload, history), Lithology, Seam. Users (invite, edit, deactivate, unlock, roles grid). Configuration: parameters, services, methods, rules, lookups, laboratory, security, formulas (view) | Master Data, Admin (Users, Configuration) | The lab's real master lists (R-08) are loaded, and the parameter catalogue and lookups match the lab's own lists | M |
| **2 · Job orders** | List, New and Edit (contact and signatory pickers, standards, parameters, checklists), Samples tab (paste, duplicates, five states, not received), Files, History, cancel, close | Job Order | A real job order (R-20) can be entered as the CSO writes it today | L |
| **3 · Batches** | Add batch, batch list, Reception (scan, arrival, mass, condition, photos, labels, hold, confirm with fewer), Preparation (ADL), Analysis (final values, FC, range warnings), signed RoA upload, Complete batch. Hand-off notifications N1 to N5, N7, N8 | Batch | One real batch, entered from its signed RoA, gives the same numbers as the paper RoA | L |
| **4 · Reports** | CoA generate, draft, PDF through Gotenberg, publish, Mark sent, revise, void. Reports list with RoA and CoA tabs. The job order's CoA tab. N6 | Reports | A CoA for the real job order matches the lab's current CoA layout (R-10), with the right signatory (R-21) | M |
| **5 · Monitoring and search** | My work queues, Dashboard (both tabs), quick and advanced search, saved queries, sample history, Audit log screen, notifications page, profile | My Work, Dashboard, Search, Admin (Audit log), App | Every prototype flow passes as an end-to-end test at 1440, 834 and 390 | M |
| **6 · Hardening and go-live** | CSV and XLSX export on every list, performance (400 samples × 60 parameters), backups with a restore test, production deployment (R-11), user accounts (R-09), UAT on a real phone and tablet, handover | All | The lab enters new job orders in the system instead of Excel | M |

Order and overlap:
- Phases 1 and 2 depend on 0.
- Phase 3 needs 2.
- Phase 4 needs 3.
- Phase 5 can start once 3 is done.
- Phase 6 follows 5.

### Definition of done for every screen

- It matches its frames at the three widths and behaves like the prototype.
- Its permission rules are enforced in the API and tested per role. The hidden-information rules of Navigation section 3 are covered.
- Empty, loading and error states are present.
- No " · " joins in the interface.
- Changes appear in the audit log.
- Its prototype flows run as Playwright tests.

## 3 · Schema changes before phase 0's first migration

The DDL in spec 13.3 was written before several screen decisions. These changes go into the first migration and back into the spec.

| # | Table or type | Change | Why |
| --- | --- | --- | --- |
| C-1 | `batch_status` | Add `receiving` and `prep_finished`; rename `finished_analysis` to `analysis_finished` | Batch screens and the stepper have seven states |
| C-2 | `batches` | Add `standard` (one of ASTM, ISO, GBT), `reception_confirmed_at`, `reception_confirmed_by`, `expected_at_confirm`; add a `batch_parameters` table for a batch's own parameter set | One standard per batch; Add batch can add or remove parameters; Confirm reception (D-46) |
| C-3 | `job_orders` | Replace `method_family` (ASTM or ISO) with `standards text[]` (ASTM, ISO, GBT; at least one). Add `preparation boolean`, the default signatory (`signatory_id`, or name and title), and `service_version`. Add a `job_order_group_items` table (Ash analysis, Trace elements) | New job order form, Revision 9 coverage rules |
| C-4 | `samples` | Add `client_description`, `drill_hole_text`, `depth_from`, `depth_to` (as registered by the CSO, before master data is linked), `arrived_at`, `arrived_by`, `condition`, `condition_remark`, `label_status` | Samples tab and Reception grid |
| C-5 | `sample_intervals` | Created only when the drill hole is matched to master data (it requires `drill_hole_id`, `seam_id`, `ply_comp`) | The CSO's registration carries free text |
| C-6 | ADL | Stored as an analysis of a new parameter `ADL` (category Preparation) | One results model; Entered by comes from `analyses.entered_by` |
| C-7 | New `lookups` table | `list_key`, `value`, `needs_remark`, `sort_order`, `active` for sample conditions, hold reasons, photo tags, lithology kinds and send channels | Configuration, Lookups |
| C-8 | `report_deliveries` | `channel` becomes `channels text[]` | Mark sent allows several channels |
| C-9 | `reports` and `report_sources` | v1 builds the CoA from the frozen values of its completed batches, so `report_sources` links a CoA to batches (`coa_id`, `batch_id`). Add `bases text[]`, `parameter_ids uuid[]`, `attention_contact_id`, `client_reference`, `revision_reason`. A CoA's status uses `draft`, `issued`, `superseded`, `void`; "sent" comes from its deliveries | D-49: the RoA is uploaded, not generated, in v1 |
| C-10 | Value freeze | `transition_batch(complete)` marks the batch's analyses `verified` and locks them. The CoA payload reads only verified values of completed batches | Replaces the RoA snapshot of spec 14.3 for v1 |
| C-11 | `profiles` | Add `title`, `phone`, `failed_attempts`, `locked_until`, `invited_at`, `prefs jsonb` (sidebar, start page, notification switches). Status gains `invited` and `locked` | Users and Profile screens, sign-in lock |
| C-12 | `services` | Add `version`, `status`, `is_default`, `turnaround_days` (replacing hours) | Configuration, Services |
| C-13 | `parameters` | Add `typical_low`, `typical_high` | Range warnings on the Analysis tab |
| C-14 | `report_templates` | Add `form_code`, `revision`, `status` (current, retired), `since` | Configuration, Report templates |
| C-15 | `audit_log` | Add `screen` and `actor_name` | The Audit log and History screens show where and who |
| C-16 | `notifications` | Add `event` (N1 to N8) and `icon` | Notification items |
| C-17 | `app_settings` | Keys `laboratory`, `security`, `numbering`, `timezone` | Configuration, Laboratory and Security; S-16 |

Next-goal tables stay in the spec but are not created in v1:
- `batch_assignments`
- `sample_rechecks`
- `escalations`
- `report_comments`
- `import_jobs`
- `result_tabs` and `tab_fields`

## 4 · What we need from the lab and client

| # | What | Needed by | Spec ref | If it is late |
| --- | --- | --- | --- | --- |
| 1 | Where production runs (Supabase Cloud or the client's server), the domain, internet speed at the lab, and the mail sender for invites | Phase 0 for staging; phase 6 for production | R-11, D-25 | Staging on Supabase Cloud; go-live waits |
| 2 | Master lists as files: clients and contacts, drill holes, seams, lithologies | Phase 1 | R-08 | Demo lists from the prototype; real data loaded later |
| 3 | The lab's method list (standard, edition, r, R) and decimals per parameter | Phase 1 | R-05, R-06 | Spec 11 defaults |
| 4 | Sample conditions, hold reasons and send channels as the lab uses them | Phase 1 | — | Prototype lists |
| 5 | One real job order as written today (quote, PO or email) and the CoA sent for it | Phase 2 | R-20 | The form follows the screens; fields may change |
| 6 | The sample ID and lab code format; the batch number format (still `B-YYYY-NNNN`); whether the job order number comes from another system | Phase 2, 3 | R-07, D-45, D-01 | Our formats, kept configurable |
| 7 | The label printer model and label size | Phase 3 | — | PDF label sheet printed from the browser |
| 8 | One completed batch with its signed RoA | Phase 3 | R-03 | Parity check postponed |
| 9 | The CoA template (logo, wording, form code, numbering) and the signatory rule | Phase 4 | R-10, R-21 | The prototype's certificate layout; the default signatory per job order |
| 10 | Which events each person should be notified of | Phase 3 | R-14, D-28 | Events N1 to N8 as designed |
| 11 | The staff list with roles | Phase 6 | R-09 | Demo personas on staging |
| 12 | Personal data and retention duties under UU PDP | Phase 6 | NFR | Staff names and emails only; audit kept without expiry |

### Request ready to send

> To prepare the SGSI LIMS build, we need the following from the lab and IT. Items 1 and 2 are needed first:
>
> 1. Where the system should run (cloud or your own server), the web address to use, the internet speed at the lab, and an email account the system can send invites and password resets from.
> 2. Your master lists in Excel: clients with contact persons, drill holes, seams and lithologies.
> 3. The method list per parameter (standard, edition, repeatability r, reproducibility R) and how many decimals you report.
> 4. The sample conditions, hold reasons and send channels you use.
> 5. One real job order as you receive it today (quote, PO or email), and the CoA you sent for it.
> 6. Your sample ID, lab code and batch number formats, and whether the job order number comes from another system.
> 7. The label printer model and label size.
> 8. One completed batch with its signed RoA.
> 9. Your CoA template and who signs which CoA.
> 10. Who should be notified of what (batch ready to receive, analysis finished, CoA ready, and so on).
> 11. The staff list with each person's role.
> 12. Any data-protection requirements from your side.

## 5 · Working method

- One branch and pull request per screen or feature. CI must pass before merging.
- At the end of each phase, staging is updated and you get a short note of what to try, the same way the prototype phases worked.
- When a screen changes during the build, the frames and plans are updated first and the code follows. The design stays the source of truth.
- The prototype stays as the behaviour reference until each module is live. Its flows become the end-to-end tests.

## 6 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Is the phase order right, or should a module come earlier, for example Reports, to show the lab sooner? | As in section 2 |
| 2 | Accept the schema changes C-1 to C-17 and apply them to the spec now? | Yes, in the same change as the first migration |
| 3 | Send the request in section 4 now, in your name? | You send it; I can shorten it or translate it into Indonesian |
| 4 | Stack open points (`Stack_Decision_Record.md` section 4) | Their defaults |
