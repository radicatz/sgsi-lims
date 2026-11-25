# Phase 5 · Monitoring and search · Build design

Nov 25, 2026 · **Slice A built and pushed (29cb3ca); slice B planned (section 10), waiting for go** · phase 5 of `V1_Build_Plan.md` section 2

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
| 2 | Sample history **Export PDF**: now (through Gotenberg, as the RoA) or phase 6? | Phase 6; **changed Nov 25: built now** at the owner's request (section 11, feedback round) |
| 3 | Dashboard charts: hand-drawn SVG to match the frames, or a chart library (heavier, less exact)? | Hand-drawn SVG |
| 4 | Does Preparation see result values in search (Search plan open point 1)? | No (reopened as B-5 in section 10.11: the role grid gives Preparation `result.read`) |
| 5 | Turnaround target for a custom parameter set (no service) | 5 days for Basic-sized sets, 10 for the rest, until the lab says |
| 6 | Frames: update in FigCraft per slice where the Nov 23 and 24 rules change them (section 4), or leave the frames as drawn and follow the rules in the app only? | Update per slice |
| 7 | Sample type categories for the mix chart (R-07) | The job order's sample type as entered |

## 9 · Build status

### Slice A (Nov 24, 2026): My work and the Dashboard's Operations tab

The owner said go and left the section 8 decisions at their defaults. Built, **not committed and not pushed** (owner's instruction).

**Built**
- **API:** `routes/work.ts` (`GET /work`, `GET /work/:queue`) and `routes/dashboard.ts` (`GET /dashboard/operations`). Reads run as the signed-in user. Queues are offered by permission; Samples awaiting arrival only to the CSO and Preparation.
- **My work** (`features/work/Work.tsx`): the overview (Work in progress, queue cards in flow order with the oldest waiting item and the past-due tone, empty queues folded into one line, Recent activity from the batch hand-offs), the queue page (tabs, Search, Company, Past due only, table with a single action, phone cards, multi-select with Download PDFs for CoAs to send), and the count pill on the sidebar's My work.
- **Dashboard, Operations** (`features/dashboard/Dashboard.tsx`): Your queues strip, four KPIs, Batch workflow, Job orders by status, Sample type mix (donut), Samples received per day, Turnaround by company, Active batches (All, Due, Late; pager 8; phone cards), the deadline alert and the week strip; Period and Company filters, the phone Filters sheet. Charts are CSS and SVG in the token colours.
- **Tests:** `e2e/phase5-work.spec.ts` (queues per role, a queue page, the zip, a refused queue, the dashboard cards and filters), 11 passed and 1 skipped (the bulk bar is not on the phone) at 1440, 834 and 390.

**Differences from the plan and frames**
- **Dashboard tab switch** is not shown yet: the Quality & reports tab is slice C, so the Operations tab stands alone for every role.
- **Recent activity** comes from the batch status log, because the roles that have My work have no `audit.read`; it lists hand-offs, not every audit change.
- **Work in progress** shows a reception the person started and analysis values they saved; Preparation entries are not included yet.
- **Speed:** the dashboard request takes about 3 s against the remote database because its queries share one connection. Each card waits for the one request.
- **Frames:** the My work queue frame already had the filters outside the card, and the page now matches it (Search, Company, Past due only as a checkbox). No frame was redrawn yet (decision 6: update per slice, still to do for the Search label and the Dashboard frames).
- The top bar's user menu is not built yet (App plan section 4); it goes with slice C's Profile.

**A bug found by the tests:** dates read from the database arrived as Date objects and were cut as text, so nothing counted as past due. They are cast to text in SQL now.

### Slice A, owner feedback round (Nov 24, 2026)

Still **not committed and not pushed**.

**Data**
- **Work in progress** now covers four kinds of started work: a reception you started, ADL values you saved in a batch that is still in Preparation, analysis values you saved (ADL excluded), and a CoA draft or revision you drafted. It links to the batch tab or to the CoA page.
- **Demo data:** `pnpm seed:work` (`apps/api/scripts/seed-work-demo.ts`; `--remove` takes it out) adds:
  - Dedi: an ADL value on B-2026-0413, which is still in Preparation.
  - Maya: a revision 2 draft of the CoA of JO-2026-0124, opened two hours ago.
  - Fitri already had analysis values saved from the Phase 3 demo.
- **Recent activity** returns 20 items. The page shows 8; View all shows the rest.
- **Samples received per day** shows the last 14 days of the period, with empty days included (owner: 14 thin columns as in the frame). The Samples received KPI also gives the number of batches.

**My work** (frames `01-My_work-01-Overview-01` to `05`, Tablet `01`, Phone `01`, `02-01`, `02-02`)
- **Work in progress:** the heading sits outside a card, and each item is a bordered row with an icon square in the accent colours. On the tablet, Continue goes under the text. On the phone, the items sit inside a card with a primary Continue button.
- **Queue cards:** each has an icon square (primary-50), the title, the count in Newsreader, Oldest waiting, and the past-due line. They have no shadow and sit under a "My queues" heading. Desktop shows 3 per row and the tablet 1 per row. On the phone, each queue is a row: icon, title, Oldest, past due, count, caret.
- **Recent activity:**
  - Each item has an avatar and a sentence such as "Dedi Kurniawan confirmed reception of B-2026-0421", with the time in the muted colour.
  - On desktop and tablet the card fills the screen height and keeps View all at the bottom.
  - The phone has a Recent activity row that opens a sheet.
- **Queue page on the phone:**
  - Past due only sits under the search.
  - The cards sit straight on the page, without an outer card. Each card has the number and date, the status pill, the job order and company, the waiting time and deadline with icons, the note, and a full-width action button.
  - CoAs to send shows tick boxes on the cards and the bottom bar (`2 selected`, Clear, Download PDFs).

**Dashboard** (frames `02-Dashboard-01-Operations-01-Lab_admin ref`, desktop and phone)
- **Your queues:** the title and a secondary "Open My work" button (touch size on the phone) sit at the left. Each queue is a cell with a divider, the count in Newsreader 18 (red with a warning icon when past due), and the name underneath. On the phone the cells stack.
- **Number fonts:** every number is JetBrains Mono (bar values, legend percentages, table progress). Display numbers are Newsreader: KPIs, the donut total and queue counts.
- **Bar colours:**
  - Batch workflow and Job orders by status bars take the colour of their status pill (`TONE_COLOR`). Receiving takes navy, i.e. primary-deep.
  - Turnaround bars are green on target, amber up to 150% of target, and red beyond.
- **KPIs:** the change on Samples received is a pill (`.delta`, green or red). The captions are separate texts, with no middle dots.
- **Sample type mix:** the donut ring is thicker (40 of 200) and the legend shows percentages. On the phone, the legend sits under the donut.
- **Samples received per day:** the 14 columns are 22 px wide at most, labelled with the day number, with no scroll bar.
- **Deadline alert:** the callout of the frame. It has a navy card, the "Deadline alert" overline, a white title and text, and a full-width accent "Open batch" button.
- **This week:**
  - Today is filled. A day with deadlines has a dot, and tapping a day filters the list.
  - Each item shows the batch, a tag (Past due, Due today, Due tomorrow or Due Fri), the day and the company.
  - On desktop the card stretches to the height of Active batches, and the grid areas keep it in the right column.
- **Layout by size:**
  - Tablet: the Period and Company filters go under the title, and the cards run in two columns (frame Tablet `02-01`).
  - Phone order: queues, KPIs, alert, week, workflow, job orders, mix, per day, turnaround, active batches.
- **Active batches:** the chips show counts, and the status pills are md. Late deadlines show a warning icon in the table and "Past due" on the phone cards, both titled "Past due".

**Frames updated in FigCraft**
- **Desktop My work `02` to `05`:**
  - Work in progress no longer sits in a card.
  - Main and Columns fill the frame height.
  - The activity items are wrapped in an "Activities" frame that fills.
  - The Recent activity card fills the height.
- **Your queues card** from the desktop ref replaces the old one in Desktop `01`, `03` CSO, `04` Sidebar collapsed and `06` No data, and in Tablet `01` and `05`. The CSO copies are renamed to its queues.
- **Phone:** the phone ref's card replaces the old one in Phone `01`, `03` CSO and `07` Filters.
- **Bar colours:** the Job orders by status bars and the Receiving bar take the pill colours in every Dashboard frame that has charts, ref frames included.

**Tests:** `e2e/phase5-work.spec.ts` passes 12 of 12 at the three sizes. WK3 now runs on the phone too (tick boxes on the cards, the bottom bar, the zip download). DB1 checks the late mark by its "Past due" title.

## 10 · Slice B plan: Search and Sample history (Nov 25, 2026)

**Status:** waiting for the owner's go.

**Sources** (checked against every project document; see 10.2):
- `../Search/Search_Screen_Plan.md`, with the owner edits S-1 to S-8 of its section 15;
- `../Search/Search_Prototype_Plan.md`;
- spec S-29 and S-30, plus sections 6.1, 6.2, 8.2, 8.3, 13.5, 14 and 15;
- `../Navigation/Navigation_Screen_Plan.md` section 4;
- `Sample_Identifiers_Plan.md`, `V1_Build_Plan.md` and `Stack_Decision_Record.md`;
- the rules of section 4 here.

### 10.1 What exists today

- **Top bar:** the search field and scan button are drawn but do nothing.
- **Holding page:** `/search` is still a holding page.
- **Saved queries:** the `saved_queries` table (spec T-26) exists, with row-level security: own rows, plus shared rows for staff.
- **No camera scanning anywhere:** a USB label scanner types into a focused field like a keyboard, so it already works with any text box.
- **Samples:** they hold the drill hole as text (`drill_hole_text`), not as a link to the Drill hole master. They hold no seam or lithology.
- **Drill hole list:** it has a search box but does not read a search word from the address yet.

### 10.2 Checked against the project documentation

| Document | What it says | Effect on this plan |
| --- | --- | --- |
| Spec S-29 | Searching for job orders, batches, samples, results. Operators: is, contains, between, greater, less, is empty. Column chooser; export CSV and XLSX; saved and shared queries; header quick search by Sample ID, sample code, client reference, batch, job order. The CSO never gets RoA values | All in. XLSX moves to phase 6 (section 8 decision 1, and `V1_Build_Plan` phase 6: "CSV and XLSX export on every list") |
| Spec S-30 | v1 events: registration, reception, hold, batch, ADL, values, RoA upload, CoA publish, revise, send. Each entry links to its audit rows. Export PDF | Events as listed in 10.3 B4. The audit link comes with slice C (`/audit` doesn't exist yet). Export PDF is phase 6 (decision 2) |
| Spec 6.1 | The Sample ID is unique, the barcode carries it, and "search matches it first" | An exact Sample ID ranks first in quick search, ahead of every other exact match |
| Spec 6.2, item 6 | The client reference is not printed on reports but stays in the app's search, history and grids | Quick search and the results page match the client reference |
| `Sample_Identifiers_Plan` decision 5 | A scanned label opens the sample by Sample ID; the placeholder text | Decision B-2 (opens the history). The placeholder is already built |
| Spec 8.2 role grid (and the live `role_permissions`) | `result.read`: everyone except the CSO, so **Preparation has it**. `master.read`: Lab admin, Supervisor, Manager, Superadmin. `company.read`: CSO, Lab admin, Manager, Superadmin. `coa.download`: everyone except Prep and Analyst. `roa.download`: everyone except the CSO and Prep | The types and values each role gets are keyed to these codes (10.4), not to role names. Two corrections to Search plan section 3: drill holes are **not** found by the CSO, Preparation or Analyst (no `master.read`); Clients are **not** found by the Supervisor (no `company.read`). Preparation and values: decision B-5 |
| Spec 8.3 and Navigation section 4 | A link to a page the role cannot open shows as plain text. The CSO's search never shows values or RoA files | In history and results, a hidden page's link (a drill hole for the CSO, a CoA for the Analyst) shows as plain text |
| `Batch_Build_Design` 15.1 | "Everyone else reads only". Preparation already sees values on the batch page; only the CSO sees counts | This is why decision B-5 recommends following `result.read` |
| Spec 13.5 | Lists a view `v_sample_history` (sample, event, at, by, detail, link) | The history is assembled in the API from the same tables. No view, so there is no extra migration and the value hiding stays in one place. Spec 13.5 gets a note when the build lands |
| Spec 14 API | `GET /search?q=`, `POST /search/advanced`, saved-queries CRUD, `GET /samples/:ref/history`; values only with `values.view` | The endpoints are as listed, plus `GET /search/quick` and the CSV export. `values.view` in the spec is `result.read` in the code. The history is keyed by the sample's **id**, because the Sample ID only exists after reception and the client reference is unique only within its job order. Spec 14 and 15 get updated route lines when the build lands |
| Spec 15 | Route `/samples/:ref/history`; TanStack Table; touch 44; no horizontal page scroll | Route `/samples/:id/history`, as above. Tables use the app's own `Table` component, as every built list does. The phone rules apply |
| `Search_Prototype_Plan` | The `/` key focuses the quick search. Flows SE1 (quick search to history), SE2 (advanced search, Lab admin), SE3 (history, then Audit, Supervisor). A **History** item in the Samples tab and Reception row menus | The `/` shortcut is in. SE1 and SE2 are in the tests. SE3 waits for slice C |
| `V1_Build_Plan` phase 5 | "quick and advanced search, saved queries, sample history" | Matches B1 to B5 |
| Phase 5 section 4 | The Nov 23 and 24 rules: Search label over list searches, phone touch 44, filters outside cards, chips scroll | Applied to the results page, the phone start screen and advanced search |

### 10.3 Screens and their frames

Frame names are the FigCraft names (`Size-MM-Module-SS-Screen-VV-Variant`).

**B1 Quick search** (top bar panel, any page; desktop and tablet)

| Frame | Shows |
| --- | --- |
| `Desktop-08-Search-01-Quick_search-01-Recent` | Empty field: last 5 records opened, last 3 searches |
| `Desktop-08-Search-01-Quick_search-02-Typing` and `Tablet-08-Search-01-Quick_search-02-Typing` | Hits grouped by type, matched part bold, See all N results |
| `Desktop-08-Search-01-Quick_search-03-Exact_match` | The exact match first, marked **Go to** |
| `Desktop-08-Search-01-Quick_search-04-No_match` | "No match for …" and **Open advanced search** |

- **Opening it:** focusing the field opens the panel (560 wide, Elevation/md). The `/` key focuses the field from anywhere.
- **Hits:** from 2 characters, after a 200 ms pause, up to 3 hits per type, in the order Samples, Batches, Job orders, Drill holes, Reports, Clients.
- **Exact matches:** an exact Sample ID comes first (spec 6.1), then any other exact ID.
- **Keys:** ↑ and ↓ move, Enter opens, Esc closes.
- **Scanned Sample ID:** a Sample ID typed or scanned exactly opens that sample's history (B-2).

**B2 Search results** (`/search?q=&type=`)

| Frame | Shows |
| --- | --- |
| `Desktop-08-Search-02-Search_results-01-All`, `Tablet-08-Search-02-Search_results-01-All`, `Phone-08-Search-02-Search_results-01-All` | Types card with counts, one card per type (5 rows, **Show all**) |
| `Desktop-08-Search-02-Search_results-02-One_type` | One type, 10-row pager |
| `Desktop-08-Search-02-Search_results-03-CSO` | The CSO's types: no RoA, no values |
| `Desktop-08-Search-02-Search_results-04-No_results` | "Nothing matches …", **Open advanced search** |
| `Phone-08-Search-02-Search_results-05-Phone_start` | The phone's Search page with an empty field: field, **Scan a label**, Recent |

- **Header:** overline SEARCH, title `Results for "…"`, and **Advanced search** (Secondary, lg).
- **Search field:** lg, with its Search label (the Nov 24 rule), above the results.
- **Types card:** 240 wide and fills the row (S-3). A type with no hits is muted.
- **Result cards:** a Title section with a Count pill, plus a ghost **Show all** (S-2).
- **Tablet and phone:** the types become scrolling chips, and the phone rows become cards.
- **Phone entry:** the phone reaches this page from Search in the menu drawer (`Phone-00-App-02-Menu_drawer-01-Lab_admin`).
- **Scan a label:** it opens the camera scan (B-1). The camera screen follows `Phone-04-Batches-02-Batch_detail-07-Reception_scan_label`.

**B3 Advanced search** (`/search/advanced?query=`)

| Frame | Shows |
| --- | --- |
| `Desktop-08-Search-03-Advanced_search-01-Empty` | Searching for Samples, one empty condition, Saved queries, "Build a query, then press Search." |
| `Desktop-08-Search-03-Advanced_search-02-Sample_query`, `Tablet-08-Search-03-Advanced_search-02-Sample_query`, `Phone-08-Search-03-Advanced_search-02-Sample_query` | Three conditions and the results |
| `Desktop-08-Search-03-Advanced_search-03-Results_query` | Searching for Results: parameter, value, basis, entered by, date |
| `Desktop-08-Search-03-Advanced_search-04-Columns_menu` | The Columns popover (checkboxes) |
| `Desktop-08-Search-03-Advanced_search-05-Save_query` | Save query dialog md with **Share with staff** |
| `Desktop-08-Search-03-Advanced_search-06-Over_limit` | Info alert "Showing the first 500 of 2,318" |

- **Searching for:** Samples, Batches, Job orders, Results. Results needs `result.read` (B-5).
- **Match:** All or Any, on the Segmented control (S-1).
- **Condition rows:** a number, then a Select container (field, operator, value, basis; S-5), then remove. Operators by type:
  - text: is, is not, contains, starts with, is empty;
  - number: equals, greater than, less than, between;
  - date: on, before, after, between;
  - choice: is, is any of.
- **Buttons:** Add condition, Clear all, Save query, Search. When a condition changes after a search, the results read "Out of date, search again".
- **Results card:**
  - The count, plus **Columns** and **Export CSV**.
  - Sortable columns, a 25-row pager.
  - Above 500 rows an Info alert; the export still holds every row.
  - A sample or result row opens the Sample history.
- **Saved queries card:** 260 wide, fills the row (S-4).
  - Lists My queries and Shared with me. Opening one fills the conditions and runs them.
  - Row menu: Rename, Duplicate, Share or Unshare, Delete. A query shared by someone else offers Duplicate only.
- **Tablet and phone:** saved queries become a select, and condition rows wrap. Phone results are cards with the first three columns; Columns is hidden and Export stays.

**B4 Sample history** (`/samples/:id/history`)

| Frame | Shows |
| --- | --- |
| `Desktop-08-Search-04-Sample_history-01-Default`, `Tablet-08-Search-04-Sample_history-01-Default`, `Phone-08-Search-04-Sample_history-01-Default` | Every v1 event up to a CoA revision |
| `Desktop-08-Search-04-Sample_history-02-CSO` | Values hidden, no View values |
| `Desktop-08-Search-04-Sample_history-03-In_progress` | A sample in analysis: pending steps grey |
| `Desktop-08-Search-04-Sample_history-04-Held` | Held at reception with the reason, then released |

- **Header:**
  - Breadcrumb: Job orders, the job order, the sample.
  - Title: the Sample ID (the client reference before reception) and its status badge.
  - Separate texts: sample code, client reference, job order link, batch link, client.
- **Sample card:** 378 wide. It holds drill hole, depth from and to, client description, sample type, mass as received, condition, status, and the held reason when held.
- **History card:** a list with dividers (S-6). Each entry has a dot in a 20 × 20 container, the event, an avatar 24 with the name, and the date and time as separate texts.
- **Events (spec S-30 v1 note), built from stored data only:**
  - registered on the job order;
  - released from a batch (awaiting arrival) or marked not received;
  - arrived;
  - received and labelled (mass, condition, photos);
  - held or released;
  - added to a batch;
  - preparation finished with ADL;
  - values entered, with the count of parameters, and edited;
  - analysis finished;
  - batch completed, with the RoA number;
  - CoA published, revised, voided or sent.
- **Values:** parameter and value pairs on the measured basis, plus **View values** to the batch Analysis tab. Without `result.read` (the CSO), the entry reads "Values entered (8 parameters)", with no numbers and no link.
- **Pending steps:** grey dots, with no person or date.
- **Links:** a link to a page the role can't open shows as plain text. The **Audit** link, with `audit.read`, comes with slice C, per `Desktop-15-Audit_log-01-Audit_log-03-Filtered_by_record`.

**B5 History in the row menus** (no new frames)

| Frame it extends | Change |
| --- | --- |
| `Desktop-03-Job_orders-03-Job_order_detail-06-Samples`, `-07-Samples_mixed_states` (and the Tablet and Phone `06` and `07`) | Row menu gets **History** |
| `Desktop-04-Batches-02-Batch_detail-01-Reception_receiving` (and Tablet, Phone `01`) | Row menu gets **History** |

History opens for every role that sees the row, also before reception (the route uses the sample's id).

### 10.4 What each role finds (keyed to permission codes)

| Type, or values | Needs | Roles today (live grid) |
| --- | --- | --- |
| Samples, Batches, Job orders | `batch.read`, `order.read` | All seven |
| Drill holes | `master.read` | Lab admin, Supervisor, Manager, Superadmin |
| Reports: CoAs | `coa.download` | CSO, Lab admin, Supervisor, Manager, Superadmin |
| Reports: RoAs | `roa.download` | Analyst, Lab admin, Supervisor, Manager, Superadmin |
| Clients | `company.read` | CSO, Lab admin, Manager, Superadmin |
| Results target, values in history, value columns | `result.read` | Everyone except the CSO (Preparation included: decision B-5) |

A hit the role cannot open is never returned, so counts are per role. Row-level security applies under all of it.

### 10.5 Server

| Endpoint | What it does |
| --- | --- |
| `GET /search/quick?q=` | Up to 3 hits per type, plus the exact match. One small query per offered type, run in parallel as the signed-in user, each `ilike '%q%'` on lower-cased IDs. Order: exact Sample ID, other exact IDs, starts-with, newest |
| `GET /search?q=&type=&page=` | Counts per type, plus 5 rows per type (or one type paged by 10) |
| `POST /search/advanced` | `{ target, match, conditions[], sort, page }`. Fields come only from a fixed list per target (column or join, type, operators); values are bound parameters, never text in SQL. Returns rows, total and `capped` (above 500) |
| `POST /search/advanced/export` | The same query as CSV, every row |
| `GET`, `POST`, `PATCH`, `DELETE /saved-queries` | Through RLS. A definition is checked against the field list before it is saved |
| `GET /samples/:id/history` | The sample card and the events, assembled from `samples`, `batch_status_log`, `analyses` and `analysis_values`, `sample_photos`, `batch_documents`, `reports`, `report_sources` and `report_deliveries`. Values are included only with `result.read` |

**Unit tests** (vitest, API): one per operator and one per target. They check that a field outside the list is refused and that values are bound as parameters.

**Small change elsewhere:** the Drill hole list reads `?q=` into its search box, so a drill hole hit opens the list already searched.

### 10.6 Migration for the owner

`supabase/migrations/20261125000100_search_trgm.sql`:
- `pg_trgm`, with trigram indexes on every ID column search matches;
- two indexes for the saved queries list.

Search works without it, only slower on a big table. The build does not wait for it; the gate does.

### 10.7 Differences from the Search plan

| Plan | Build | Why |
| --- | --- | --- |
| Section 3: the CSO, Preparation and Analyst find drill holes; the Supervisor finds clients | Drill holes need `master.read`; Clients need `company.read` | The role grid (spec 8.2) and the sidebar (8.3) |
| Advanced fields include seam and lithology | Not offered | Samples store neither; only the drill hole as text |
| A drill hole hit opens "the list filtered to it" | The list with the code in its search (`?q=`) | Same effect, no new filter |
| Export CSV and XLSX | CSV | Decision 1; XLSX with phase 6 |
| Sample history Export PDF | Not built | Decision 2: phase 6 |
| Audit link per entry | With slice C | `/audit` is slice C |
| Route `/samples/:ref/history` (spec 14, 15) | `/samples/:id/history` | The Sample ID exists only after reception |
| `v_sample_history` view (spec 13.5) | Assembled in the API | No migration; value hiding in one place |
| Frames show old lab codes (`B0417-07`, `BNM-3507`) | Spec 6.1 identifiers | Format mismatch flagged Nov 10; the spec wins |

### 10.8 Demo data

`pnpm seed:search` (`--remove` takes it out):
- **Saved queries:** "High-ash samples" and "Held this month" (Maya's), and "Late batches" (Hendra's, shared).
- **Histories:** the existing demo batches already give full histories. B-2026-0450 to 0459 run to the CoA, B-2026-0418 is in analysis, B-2026-0422 is at reception, and B-2026-0413 is in preparation. No new job orders.

### 10.9 Tests (`e2e/phase5-search.spec.ts`, three sizes)

| Test | Flow | Checks |
| --- | --- | --- |
| SR1 | SE1 | Quick search: grouped hits, an exact Sample ID first with Go to, Enter opens the history, `/` focuses, Esc closes, See all (desktop, tablet) |
| SR2 | | Results: Types counts, Show all, one type with a pager, No results; phone start screen from the drawer |
| SR3 | SE2 | Advanced (Lab admin): two conditions, Match Any, Columns, Export CSV downloads, Out of date notice |
| SR4 | SE2 | Saved queries: save shared, open, rename; another user duplicates it; delete |
| SR5 | | Roles: the CSO gets no RoA, no Drill holes and no Results target, and its history has no values; the Analyst gets RoAs but no CoAs; the Supervisor gets no Clients |
| SR6 | | History: events in order, pending steps grey, View values opens the Analysis tab; History from the Samples and Reception row menus |

SE3 (history, then Audit) is tested with slice C.

### 10.10 Frames to update in FigCraft (decision 6: only where a later rule changes them)

- **Search label:** the results field in `Desktop-08-Search-02-Search_results-01-All` and `-02-One_type`, the Tablet and Phone `01-All`, and `Phone-08-Search-02-Search_results-05-Phone_start`.
- **Phone touch 44:** the **Scan a label** button and the advanced search phone actions (`Phone-08-Search-03-Advanced_search-02-Sample_query`).
- **History in row menus:** none to draw; the menus are drawn closed.

The identifier format stays as drawn (flagged mismatch).

### 10.11 Decisions for the owner

Defaults are used if you say go without answering.

| # | Question | Default |
| --- | --- | --- |
| B-1 | **Phone camera scan.** Only Android Chrome reads barcodes from the camera without a library; iPhone Safari needs one (about 150 KB). Options: camera where supported and the button hidden elsewhere; a library for every phone; or no camera scan in v1 | **Camera where supported, hidden elsewhere** |
| B-2 | **What a Sample ID match opens**, typed or scanned | **Sample history** (Search plan open point 3, identifiers decision 5) |
| B-3 | **Archived drill holes and clients** in search | **Shown with an Archived tag** (open point 7) |
| B-4 | **Order.** B4 Sample history and B5 first, then B1 to B3 | **History first** |
| B-5 | **Preparation and result values** in search and history. Section 8 decision 4 said "No". But the role grid gives Preparation `result.read`, and the batch page already shows Preparation the values; only the CSO is hidden. Follow the permission (Preparation sees values and the Results target), or keep the extra Preparation rule? | **Follow `result.read`.** This replaces decision 4 so that search and the batch page agree |

**Size: L**, about the same as Phase 4 slice B.

## 11 · Slice B build status (Nov 25, 2026)

Built, **not committed** (commit when the owner says). The owner gave go with the defaults and ran `20261125000100_search_trgm.sql` (checked: `pg_trgm` and all 11 trigram indexes exist). Decision B-5 applied: Preparation follows `result.read`.

**Built**
- **Sample history** (`/samples/:id/history`, `features/search/SampleHistory.tsx`, `routes/sample-history.ts`):
  - The sample card and a timeline of the events in 10.3 B4, with pending steps (Preparation, Analysis, CoA) grey.
  - Values show as parameter and value pairs with **View values** only with `result.read`. The CSO sees "Values entered (7 parameters)" and nothing more.
  - A link to a page the role cannot open shows as plain text.
- **History in the row menus:**
  - A **History** icon button on every saved row of the job order Samples tab.
  - A **History** item in the Reception row menu.
  - Both also work before reception.
- **Quick search** (top bar, `features/search/QuickSearch.tsx`, `routes/search.ts`):
  - The panel opens on focus and shows Recent records and Recent searches when the field is empty.
  - From 2 characters it shows up to 3 hits per type, with the matched part bold.
  - An exact Sample ID ranks first and is marked **Go to**; Enter opens it.
  - Keys: arrows, Enter, Esc, and `/` to focus. The panel never shows or lets a click use the answer to an earlier word.
- **Search results** (`/search?q=&type=&page=`): the Types card (chips on tablet and phone), one card per type with **Show all**, one type paged by 10, the Nothing-matches state, and the phone start screen with Recent.
- **Camera scan** (`Scan.tsx`, decision B-1): shown only where the browser has `BarcodeDetector` (Android Chrome); a read Sample ID opens its history. A USB scanner types into the field.
- **Advanced search** (`/search/advanced`, `routes/advanced-search.ts`, `routes/search-query.ts`):
  - The four targets, Match All or Any, and condition rows with operators per field type.
  - On Samples, a Result condition (parameter, basis, number operator).
  - Columns menu (changing it re-runs the search), sortable columns, a 25-row pager, the over-500 notice, **Out of date** when a condition changes, and **Export CSV**.
  - **Saved queries:** mine and shared with me; Rename, Duplicate, Share or Unshare, Delete; a Save dialog with Share with staff. `?query=` opens one.
- **Drill hole list:** it reads `?q=` into its search box.
- **Work pages:** every page under Work now shows today's day above its title, at every size, from one helper (`todayLabel`): My work, Dashboard, Job orders, Batches, Reports, Search, Results and Advanced search.
- **Types by permission:** drill holes need `master.read`, clients `company.read`, CoAs `coa.download`, RoAs `roa.download`.
- **Demo data:** `pnpm seed:search` adds "High-ash samples", "Held this month" (Maya) and "Late batches" (Hendra, shared); `--remove` takes them out.

**Tests**
- **Unit:** `apps/api/src/routes/search-query.test.ts`, 11 tests (values as bound parameters, unknown fields and wrong operators refused, each operator and target, role limits).
- **E2E:** `e2e/phase5-search.spec.ts` (SR1 to SR6) and `e2e/phase5-work.spec.ts` pass together at 1440, 834 and 390: 29 passed, 1 skipped (quick search has no field on the phone).
- **Bugs the tests found:**
  - Quick search let a click use the previous word's answer. It now shows only the answer to the current word.
  - `useNavigate` was called after an early return in the job order Samples tab, which broke that tab. It is at the top of the component now.
  - A SQL fragment with its own parameters clashed with the outer ones, so the rank now uses quoted literals.

**Differences from the plan**
- **Saved queries on tablet and phone:** a select that opens a query. Rename, Duplicate, Share and Delete are in the desktop list only; the plan gave no row menu for the select.
- **Sample history keys:** it is keyed by the sample's id (10.7). The "Added to batch" entry is dated from the batch's creation entry in the batch log, because a sample's own date of joining a batch is not stored.
- **Results columns:** the Results target returns one row per sample and parameter (round 1), with the reporting basis of the value.
- **Statuses:** the status choices in advanced search results show as grey badges, not in their status colours.

**Left for later**
- **FigCraft frames:** not updated this slice (10.10); the Work date label also changes the frames' overlines (REPORTS, SEARCH, phone variants).
- **Audit link on history entries:** with slice C.
- **XLSX export:** phase 6. (The Sample history PDF was built in the feedback round below.)

### Slice B, owner feedback round (Nov 25, 2026)

Built, **not committed**.
- **Links:** no underline anywhere, at rest or on hover (`a` in `base.css`, `.link`, `.linkbtn`, breadcrumbs, the batch page meta); hover now darkens a link slightly or turns a row title brand blue.
- **Quick search, no match** (frame `Desktop-08-Search-01-Quick_search-04-No_match`): the title and the hint stack with space between them; **Open advanced search** is a ghost button with the funnel icon under them.
- **Search results:** the Types card is sticky and as tall as the window; **Advanced search** has the funnel icon and shows on the Search start page too (all sizes). The Nothing-matches card offers a ghost Open advanced search button.
- **Advanced search:**
  - **Save query** and **Search** carry the floppy-disk and magnifying-glass icons.
  - **Save dialog** (frame `Desktop-08-Search-03-Advanced_search-05-Save_query`): centred on desktop and tablet (it was always a phone sheet), with the line "Saved queries appear on the left and can be run again." ("in the list above" on tablet and phone), Name marked required, and "Share with staff (they can run and duplicate it)".
  - **Close and return:** a **Close** button at the top right of the page returns to where Advanced search was opened from: the results for the same word, or the page the quick search was used on. Opened directly, it returns to Search. The browser's Back works the same way. The date overline stays (the Work rule).
  - **Phone results** (frame `Phone-08-Search-03-Advanced_search-02-Sample_query`): list rows with dividers, not cards. The top line has the first column and the status; text columns sit under it; number and date columns come last with their labels. The export button reads **Export** on the phone.
- **Sample history:**
  - **Export PDF** at the top right on desktop and tablet (the phone frame has none). `GET /samples/:id/history/pdf` renders the page's card and timeline on A4 through Gotenberg, with the lab's name from the Laboratory settings and its logo. Values appear only with `result.read`.
  - **Tablet** (frame `Tablet-08-Search-04-Sample_history-01-Default`): one column; the Sample card shows two key-value columns.
- **Tests:** SR7 added (no-match button, Close back to the work page and to the results, dialog vs sheet, phone rows, PDF download). SR1 to SR7 pass at the three sizes.
- **Cleanup:** two leftover "E2E query" saved queries from earlier runs were deleted.
