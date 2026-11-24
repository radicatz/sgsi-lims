# Phase 5 · Monitoring and search · Build design

Nov 24, 2026 · **PLAN, waiting for the owner's go** · phase 5 of `V1_Build_Plan.md` section 2

Written for: the product owner (decisions in section 8) and the developers who build it.

## 1 · What phase 5 builds, and when it is done

The build plan's row: **My work queues, Dashboard (both tabs), quick and advanced search, saved queries, sample history, Audit log screen, notifications page, profile.**

**Gate:** every prototype flow passes as an end-to-end test at 1440, 834 and 390.

**Phase 4's gate stays open** alongside this phase. Its nine lab items (G1 to G9) are in `../Reports/Reports_Build_Design.md` section 18. Phase 5 touches none of them, except the Profile (G4: real signature and stamp images, retiring the demo ones). Any change to reports, signing or templates during phase 5 updates that table.

## 2 · What is already there

| Piece | State | Built in |
| --- | --- | --- |
| Notifications: bell, panel, page `/notifications`, events N1 to N10, the deadline timer (N7, N8) | **Done.** Phase 5 adds only the per-event switches on the Profile (section 3.6) | Phases 0, 3, 4 |
| Sidebar per role, start page rule (My work or Dashboard), idle sign-out with its warning | Done | Phase 0 |
| Profile `/profile` | **Partial:** name, sidebar, start page, Signature and Lab stamp cards. Missing Password (Change password), Notifications switches, the frame layout | Phases 0, 4 |
| `/work`, `/` (Dashboard), `/search`, `/audit` | Holding pages ("built in phase 5") | Phase 0 |
| Tables `saved_queries`, `audit_log` (trigger on every table), `notifications`; permissions `work.use`, `dashboard.operations`, `dashboard.quality`, `search.use`, `audit.read` | Done; no data screens yet | Phase 0 |
| Frames | All drawn: My work (row H, 14), Dashboard (row I, 15), Search (row M, 26), Audit log (row O), App and Profile (row N) | Nov 4 to 6, Nov 20 |

## 3 · The screens

Each screen follows its own plan; this section lists only what the build must add to or change from that plan.

### 3.1 My work `/work` and `/work/:queue` · `../My Work/My_Work_Screen_Plan.md`

- **Queues Q1 to Q7** as planned (Batches to receive, Samples awaiting arrival, In preparation, Ready for data entry, Signed RoA to upload, CoAs to generate, CoAs to send), counted per role, flow order, Overdue tone when anything is past due, empty queues folded into one muted line.
- **Work in progress:** records the user started and left unfinished (a reception with some samples ticked, ADL or values partly saved). Derived from what is stored; nothing new is saved for it.
- **Recent activity:** last 8 audit entries of the lab (open point 2 of the plan), **View all** to the Audit log for roles with `audit.read`; for the others the link is hidden.
- **Queue page:** tabs per queue, search, company, Past due only, the table and its single action button; phone cards. **CoAs to send** has multi-select with **Download PDFs** (the Reports zip endpoint).
- **Sidebar count pill** on My work = total of the user's queues.
- **Since the plan:** Q5 now also offers **Download RoA** (the app-drafted RoA, Reports section 17); Q7's queue reads "Published, not sent" from the Reports list's derived status.

### 3.2 Dashboard `/` · `../Dashboard/Dashboard_v2_Screen_Plan.md` (including the owner edits of section 15)

- **Operations tab** O1 to O13 and **Quality & reports tab** Q1 to Q7 as planned; tabs only for roles with `dashboard.quality`; Period and Company filters on every widget except the "now" ones; KPI and bar links open the lists filtered.
- **Charts:** drawn as SVG in the app with the token colours (no chart library), the same bar patterns as the frames (Bar container, values in one column). Scatter regression and R² computed on the server (spec S-01).
- **Turnaround band** uses each job order's service turnaround (Configuration > Services); a custom set falls back to open point 3 (5 or 10 days).
- **Sample type mix** groups by the job order's sample type until the lab gives categories (R-07).

### 3.3 Search · `../Search/Search_Screen_Plan.md`

- **Quick search** in the top bar (desktop, tablet): panel with Recent, typed hits per type, exact match first with **Go to**, scan to Sample history, keyboard.
- **Results page** `/search?q=`: Types list with counts, sections per type, one-type view with pager.
- **Advanced search** `/search/advanced`: Searching for Samples, Batches, Job orders, Results; Match All / Any; condition rows; Columns menu; 500-row notice; **Saved queries** (mine, shared with me; rename, duplicate, share, delete).
- **Sample history** `/samples/:id/history`: the sample card and the timeline of v1 events; values hidden for the CSO; pending steps grey; **Audit** link per entry for Supervisor, Manager, Superadmin; **History** in the row menus of the job order Samples tab and the batch page.
- **Since the plan:** the sample identifiers are the spec 6.1 format (Sample ID `SG.YYMMDD.CCC.BB.NNN`, sample code `CCC.BB.NNN.Lotxx`, client reference), not the old lab codes the frames show; search matches all three. Permissions per role as section 3 of the plan: a hit the role cannot open is not shown, and counts are per role.

### 3.4 Audit log `/audit` · `../Admin/Admin_Screen_Plan.md` section 5

- Filters (record ID, date, user, record type, action), rows with an expandable Before / After diff, read only, pager; opened pre-filtered from Sample history or a user page (removable chip); phone cards with filters in a sheet.
- Rows are read from `audit_log` and turned into readable text on the server: table to record type, column to field label, ids to names where known.

### 3.5 Profile `/profile` · `../App/App_Screen_Plan.md` sections 4, 6, 18

- Rebuilt to the frames: header (avatar, name, roles, email, **Sign out**), **Personal**, **Password** (last changed, **Change password** dialog with the current password and the Security rules checklist; full-screen form on the phone), **Preferences** (sidebar, language read-only, start page), **Notifications** (one switch per event that reaches the user's roles), and the Signature and Lab stamp cards that exist today.
- **User menu** in the top bar (name, email, roles, Profile, Sign out); on the phone the same block at the bottom of the menu drawer.

### 3.6 Notification switches

The switches are stored on the profile's preferences, and `notify()` skips a person who turned an event off. Default all on. The in-app list is the only channel (email is next goal).

## 4 · Rules from later decisions that the frames predate

The frames were drawn before these owner rules, so the build follows the rules where they differ:

| Rule | Date | Effect in phase 5 |
| --- | --- | --- |
| Filters and chips on the page, the card holds only the table and pager; Search has its label | Nov 24 | My work queue page, Audit log, Search results, Advanced search results, Dashboard Active batches and Drill holes |
| Phone: Filters button lg beside the search; main actions at least touch (44); chips scroll sideways | Nov 23, 24 | Every phone list in phase 5 |
| Page tabs use the library Tab (not Segmented) | Nov 5 | Dashboard tabs, My work queue tabs |
| Disabled pick boxes when the bulk action can't apply | Nov 23 | CoAs to send multi-select |
| Warm-grey secondary text, no " · " joins, no count subtitles | Nov 23, Nov 3 | All |
| Sample identifiers per spec 6.1 | Nov 10 | Search, Sample history, Dashboard tooltips |

Frames are **not** redrawn first. Where a rule changes a frame's layout, the frame is updated in FigCraft in the same slice, as was done for Reports.

## 5 · Server and data

| Need | How | Schema change |
| --- | --- | --- |
| Queue counts and rows | One `GET /work` (counts per queue for the caller's roles) and `GET /work/:queue` (rows), from batch status, step stamps, deadlines, documents and reports | None |
| Dashboard | `GET /dashboard/operations` and `/dashboard/quality` with period and company; aggregates in SQL | None |
| Search | `GET /search?q=` (grouped hits), `POST /search/advanced` (conditions to SQL through a fixed field list, never raw text), saved queries CRUD | **Yes:** `pg_trgm` and trigram indexes on the ID columns, so typing stays fast. The owner runs this SQL (the MCP declines schema changes) |
| Recent records and searches | Kept in the browser per user (open point 4 of the Search plan: "on this device and account") | None |
| Sample history | Built from `batch_status_log`, the sample's own stamps, analyses, `batch_documents`, `reports` and `report_deliveries`; nothing new is stored | None |
| Audit log | `GET /audit` with filters and paging; labels resolved on the server | Index on `audit_log (actor, at)` for the user filter. Owner runs it |
| Change password | `POST /me/password`: checks the current password, then the Security rules, then sets it; audited; `password_changed_at` on the profile | **Yes:** `profiles.password_changed_at`. Owner runs it |
| Notification switches | `profiles.prefs.notifications`; `notify()` reads them | None (prefs is jsonb) |

All reads go through the caller's row-level security, as everywhere else; counts and hits are per role.

## 6 · Slices and order

| Slice | Builds | Tests | Size |
| --- | --- | --- | --- |
| **A** | My work (overview, queue page, multi-select, sidebar count), Dashboard **Operations** tab, the user menu | Per role at three sizes; queue counts against seeded data | M |
| **B** | Search: quick search, results page, advanced search, saved queries, Sample history, History row menus; the migration for trigram indexes | Per role (CSO sees no values or RoAs), three sizes | L |
| **C** | Dashboard **Quality & reports** tab, Audit log, Profile rebuilt (Password, Notifications switches), the notify() switch check | Three sizes | M |
| **Gate** | The prototype's flows written as end-to-end tests across phases 0 to 5 (the list from `Prototype_v2` tests), run at three sizes | All | M |

Each slice ends as before: compare with the frames at 1440, 834 and 390, browser tests, then commit. Demo data: a `pnpm seed:work` script fills the queues and the dashboard period with the existing demo job orders and batches (no new clients), removable with `--remove`.

**Size: L overall** (the build plan said M; search and the dashboard charts are bigger than one M).

## 7 · Risks

- **Speed against the remote database.** Lists take 1.5 to 3 s today. The dashboard runs many aggregates; they go into one request per tab and run in parallel on the server, and the page shows each card's skeleton until its data arrives. If a tab is still slow, its aggregates move into a database view.
- **Test time.** The full run is already over 30 minutes. Phase 5 tests run per slice; the whole suite runs once at the gate.
- **Advanced search building SQL.** Only fields from a fixed list, values as parameters, permissions through RLS; a unit test per operator.

## 8 · Decisions for the owner

Defaults are used if you say go without answering.

| # | Question | Default |
| --- | --- | --- |
| 1 | Advanced search export: CSV and XLSX now, or CSV now and XLSX with phase 6's "export on every list"? | CSV now, XLSX in phase 6 |
| 2 | Sample history **Export PDF**: now (through Gotenberg, as the RoA) or phase 6? | Phase 6 |
| 3 | Dashboard charts: hand-drawn SVG to match the frames, or a chart library (heavier, less exact)? | Hand-drawn SVG |
| 4 | Does Preparation see result values in search (Search plan open point 1)? | No |
| 5 | Turnaround target for a custom parameter set (no service) | 5 days for Basic-sized sets, 10 for the rest, until the lab says |
| 6 | Frames: update in FigCraft per slice where the Nov 23 and 24 rules change them (section 4), or leave the frames as drawn and follow the rules in the app only? | Update per slice |
| 7 | Sample type categories for the mix chart (R-07) | The job order's sample type as entered |

## 9 · Build status

Not started. Waiting for go.
