# SGSI LIMS — v1 Build Plan

Written Nov 10, 2026. **Status: approved Nov 10, 2026 (defaults). Phase 0 built, section 7.**

> **Nov 10, 2026: sample identifiers fixed by the lab** (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` (e.g. `SG.260901.001.RI.001`) and sample code `CCC.BB.NNN.Lotxx`, generated at reception, replacing the lab code `B{batch}-NN`; the client's own name becomes the Client reference. Built into phases 1 to 3 below as schema change C-18; the six open details are **closed with defaults** (spec 6.1); the frames, prototype and demo video are **not rebuilt** and their old format is flagged as a mismatch (spec 6.2, `Sample_Identifiers_Plan.md`).

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
| **1 · Master data and settings** | Clients (contacts, logo, archive), Drill hole (CoA upload, history), Lithology, Seam. Users (invite, edit, deactivate, unlock, roles grid). Configuration: parameters, services, methods, rules, lookups, laboratory (with branch offices and their codes, `RI` Rapak Indah), security, formulas (view). A 3-digit company code on each client (spec 6.1) | Master Data, Admin (Users, Configuration) | The lab's real master lists (R-08) are loaded, and the parameter catalogue and lookups match the lab's own lists | M |
| **2 · Job orders** | List, New and Edit (contact and signatory pickers, standards, parameters, checklists), Samples tab by client reference (paste, duplicates, five states, not received), Files, History, cancel, close | Job Order | A real job order (R-20) can be entered as the CSO writes it today | L |
| **3 · Batches** | Add batch, batch list, Reception (Sample ID and sample code generated on arrival per spec 6.1, scan, arrival, mass, condition, photos, labels, hold, confirm with fewer), Preparation (ADL), Analysis (final values, FC, range warnings), signed RoA upload, Complete batch. Hand-off notifications N1 to N5, N7, N8 | Batch | One real batch, entered from its signed RoA, gives the same numbers as the paper RoA, and each received sample gets its Sample ID and sample code (spec 6.1) | L |
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
| C-18 | `samples`, `companies`, numbering (**added Nov 10, after phase 0 was applied: a new migration at the start of phase 1**) | `samples.sample_ref` becomes `client_ref` (unique within a job order); `lab_code` becomes `sample_no` (the Sample ID, unique) plus `sample_code`; `samples.lot` (text, default `Lot01`, set at reception) and the received date the Sample ID uses. `companies.company_code` (3 digits, unique): the next free number when a client is created, editable by a Superadmin until the client's first received sample, then locked. Branch offices (2-letter code, name) under `app_settings.laboratory`, seeded with `RI` Rapak Indah; a batch belongs to one branch. A function `next_sample_no(company, branch, date)` called by Confirm reception: numbers per company and date from 001, refuses at 999 with a message, width settable by an Admin. The `numbering` setting gets `sample_id` and `sample_code` patterns in place of `lab_code` | D-51, spec 6.1 |

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
| 6 | Sample ID and sample code: format and details decided (spec 6.1: date received, number per company and date, branch `RI` only, company code auto-assigned, lot `Lot01`, client reference not on reports); ask the lab to confirm or correct. Also the batch number format (still `B-YYYY-NNNN`) and whether the job order number comes from another system | Phase 2, 3 | R-07, D-45, D-01 | The defaults in spec 6.1 |
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
> 6. We number samples as `SG.YYMMDD.CCC.BB.NNN` (sample ID) and `CCC.BB.NNN.Lotxx` (sample code), using the date the sample is received, a running number per company that restarts each day, branch `RI`, system-assigned company codes and lot `Lot01`. Please tell us if any of this should differ. Also your batch number format, and whether the job order number comes from another system.
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
| 2 | Accept the schema changes C-1 to C-18 and apply them to the spec now? | Yes, in the same change as the first migration |
| 3 | Send the request in section 4 now, in your name? | You send it; I can shorten it or translate it into Indonesian |
| 4 | Stack open points (`Stack_Decision_Record.md` section 4) | Their defaults |
| 5 | Sample ID details (spec 6.1) | **Closed Nov 10, 2026 with the defaults** (date received; number per company and date, restarting daily; branch `RI` only; company code auto-assigned; lot `Lot01`; client reference not on the RoA or CoA). The lab can still correct them |

## 7 · Build status

### Phase 0 · Foundation (Nov 10, 2026)

| Item | Result |
| --- | --- |
| Database | Supabase project `sgsi-lims` (waxtkvfepwdopggynwlv, Tokyo, free plan). Migrations 0100 to 0600 in `supabase/migrations/`: 42 tables with C-1 to C-17, audit trigger on every core table, row-level security on every table (87 policies), reference data (roles, 37 permissions and the grid, 36 parameters, standards and methods, services, lookups, rules, settings), function grants from the security advisor |
| Code | `packages/shared` (permissions and sidebar by role, statuses, exact-decimal FC, NCV and basis conversion, password rules; 8 unit tests), `apps/api` (Fastify; each request runs as the signed-in user; sign-in with the lock after failed attempts, refresh, forgot and set password, `/me`), `apps/web` (React 19 and Vite: Sign in, Forgot password, Set password from the email links, the shell with the role sidebar, tablet rail and phone drawer, No access, idle sign-out warning, Profile, a holding page for each later module) |
| Demo accounts | 10 accounts from the Admin frames, created with `pnpm seed:demo` (the seven personas plus Yusuf, Bagus, Joko) |
| Checks | Live check against the real database: 29 of 29 (every role's sidebar and start page, the CSO has no `result.read`, tokens refused when missing or malformed, five wrong passwords lock the account, a locked account stays locked with the right password, profile preference saved). Browser tests: 30 of 30 at 1440, 834 and 390 (each persona signs in to its own sidebar and gets No access on a page it cannot open; wrong password; sign out) |
| Gate | Met: every persona signs in and sees their own sidebar; the permission checks pass for every role; every table change writes an audit row |
| Left for later in phase 0 | Row-level security tests per table in the database, a staging deployment, end-to-end tests in CI (needs the demo password as a repository secret), SMTP for invite and reset emails |

### Phase 1 · Master data and settings, parts 1 and 2 (Nov 10, 2026)

| Item | Result |
| --- | --- |
| Master data | Clients (list, client page, contacts with a default, round logo upload, archive, restore, delete when unused), Drill hole (list, CoA upload and replace, CoA history with downloads, archive), Lithology, Seam. Filters, search, 25 rows per page, phone cards, read-only for Supervisor and Manager, links from the client page to its lists. Migration 0700: private buckets `logos` and `coa`; files reach the web only as one-hour signed links |
| Users | List with status chips, Roles tab (permission grid from the database), user page, Add user (invite link), Edit, Send password reset, Resend invite, Unlock, Deactivate and Reactivate, and the rule that the last active Superadmin cannot be deactivated or lose the role. Mail is not set up yet, so the invite and reset links are shown to the Superadmin to send |
| Fixes found on the way | Invited and locked accounts could not reach set-password (the guard accepted only active accounts); the per-request database setup now runs in one pipelined statement (a list call went from about 620 ms to about 420 ms) |
| Checks | Live API checks against the real database (`apps/api/scripts/check-*.ts`): 40 for master data and 27 for users, run as the right and wrong roles; browser tests at 1440, 834 and 390 for master data (7 flows) and users (6 flows) |
| Owner feedback (Nov 10) | Official Phosphor icon font; sidebar icons Batches `files`, Lithology `stack`, Seam `tray`; a Search label over every list search; `pnpm seed:master` loads the prototype's master data (`--remove` takes it out); table row hover uses `--surface-muted` and the selected row a half-strength primary tint, so neither matches the head |
| C-18 sample identifiers | Migration 0800 (run by the owner in the SQL editor, recorded in the migration history as 20261110094000): `client_ref`, `sample_no`, `sample_code`, `lot`; 3-digit `company_code` (next free, locked after the first received sample, changed only by the Superadmin on the client form); `batches.branch_code`; `next_sample_no()` per client, branch and day; branch offices and the new patterns in the settings |
| Configuration, slice A | Hub (sections with counts and last change, search across sections, parameters, values and rules), Security, Laboratory with branch offices, Numbering (token check), Lookups, Parameters (code locked once in use, a rename follows into the range rules), Validation rules (Warn or Block, bounds on the parameter, V-12 fixed), Formulas (view). Read-only on the phone. Invites now last the configured number of days. Design: `../Admin/Configuration_Build_Design.md`. Checks: 26 live API checks, 7 browser flows |
| Left in phase 1 | Configuration slice B: Services (versioned), Methods and standards (matrix), Report templates (versioned). Import wizard for drill holes, seams and lithologies (S-16). The lab's real master lists (R-08). Mail delivery (SMTP) |

### Clients feedback round, design and app (Nov 11, 2026)

| Item | Result |
| --- | --- |
| Review board | `Desktop-09-Clients-90-Feedback_Nov11-01-Review_board` in the FigCraft file (Desktop page, right of the Clients row), revised by the owner: the client page header shows Edit, Archive and Delete buttons (trash icon) instead of the three dots, the Actions column has no gap, Make default is the last icon |
| All design frames | Sidebar icons everywhere and in the library: Batches `files`, Lithology `stack`, Seam `tray`. All 157 table rows in the Clients, Drill hole, Lithology and Seam desktop and tablet frames: Actions column of icon-only ghost buttons (Edit, Archive; Drill hole adds CoA history and Replace CoA at the end), gap 0, sorted first head with a caret. The five client detail frames: Edit, Archive and Delete buttons, ghost View list and ghost Add contact, Properties 440 wide, contacts Actions column. Phone: client cards rebuilt from Item card ref, stacked dots on the client, Drill hole, Lithology and Seam cards and on the contact cards, touch-size form buttons. Tablet and phone detail headers stack the buttons under the title. Library icons added: archive, files, star |
| App | The same changes in Clients, Drill hole, Lithology and Seam (heads sort, Actions column, header buttons, ghost buttons, wider Properties, item cards with the stacked dots, touch-size dialog buttons on the phone). 26 browser tests at three widths |
| Not done | Table head and status pill sizes still differ from the design (design 10 px head at 40 px high; app 12 px at 44 px); a token-by-token audit of the app against the FigCraft library is still to do |

### Clients feedback round 2 and folder reorganisation (Nov 11, 2026)

- Client page: tablet and phone contact layouts follow the design frames, Set as default is an icon button (`user-check`), the Default tag sits inline with the name, header buttons are large, the Properties keys use the muted colour, the logo drop zone and preview are 100 px, dialog footers use large buttons, the Master data cards are links.
- Contacts: Archive became **Delete** (`DELETE /contacts/:id`). A client always keeps at least one contact (409 `last_contact`; the icon is disabled with a reason). A contact that job orders or reports use is hidden, an unused one is removed; deleting the default hands the default to another contact.
- Token audit in `Design System/Token_Audit.md`. Owner decision: keep the app at 12 px small text; the design's Caption and component labels still say 10 px and need updating.
- Folder structure of `apps/web/src`: `components/` (library, one file per family, import from `components`), `features/` (auth, common, master-data, admin), `styles/` (tokens plus one stylesheet per family via `index.css`). README has the table.
- Verified: typecheck, `pnpm build`, API master check, 90 browser tests at 1440, 834 and 390.
