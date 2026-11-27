# Phase 5 · Monitoring and search · Build design

Nov 25, 2026 · **Slice A pushed (29cb3ca), slice B pushed (99c2e1a); slice C planned (section 12), waiting for go** · phase 5 of `V1_Build_Plan.md` section 2

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
- **Sample type mix** groups by Ply, Composite and Not set, from the Ply/Comp recorded per sample (`Open_Points_Check_Nov25.md` M-1, built Nov 25, 2026).

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
| 7 | Sample type categories for the mix chart | The job order's sample type as entered (see `Open_Points_Check_Nov25.md` M-1) |

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

### Slice B, FigCraft frames updated (Nov 25, 2026)

Saved to the main file (not committed; the file is 130 MB).
- **Day overline:** every Search frame that has a title now reads "WEDNESDAY, 25 NOVEMBER 2026" (results, advanced search and their states, at 1440, 834 and 390).
- **Close button:** added to the header of all Advanced search frames (desktop 01 to 06, tablet, phone; phone at size touch, 44).
- **Phone Search:** `Phone-08-Search-02-Search_results-05-Phone_start` is titled "Search"; it and the phone results frame carry an Advanced search button (touch) under the title.
- **Already matching the app:** the funnel icon on Advanced search, the No_match frame's ghost button, the Save_query dialog, Sample history Export PDF (desktop and tablet).
- **Search label (done, Nov 25):** every search field in the page body that had no label now has "Search" above it, as the Batches list and the Reports lists already did: 84 on Desktop, 27 on Tablet, 24 on Phone (results, lists of clients, drill holes, lithology, users, batches, job orders, parameters, settings, Reception scan fields, and their dialog and filter-sheet variants). The top bar search is unchanged.
- **Not drawn:** the sticky Types card (a still frame can't show it).

## 12 · Slice C plan: Dashboard Quality & reports, Audit log, Profile (Nov 25, 2026)

**Status:** built Nov 26, 2026 (section 13). The owner ran the SQL in 12.6.

**Sources** (checked against the project documents; see 12.2):
- `../Dashboard/Dashboard_v2_Screen_Plan.md` sections 3, 4, 6, 7, 10, 12, and the owner edits of section 15;
- `../Admin/Admin_Screen_Plan.md` sections 3, 5 (Audit log) and 12 (open points);
- `../App/App_Screen_Plan.md` sections 2, 4 (user menu), 5.1 (events), 6 (Profile), 14 (open points), 17 and 18 (signature and stamp);
- spec S-01, S-13, S-14, S-30, D-29, F-AUTH-03, and sections 8.2, 13.4, 13.6, 14 and 15;
- `V1_Build_Plan.md` phase 5 and `Stack_Decision_Record.md`;
- the rules of section 4 here, and the owner rules since: no underlined links, the date above every Work page title, the Search label over list searches.

### 12.1 What exists today

- **Dashboard:** the Operations tab is built (slice A). The tab switch is hidden because Quality & reports does not exist yet, and there is no `GET /dashboard/quality`.
- **Drill hole list** (`/master/drill-holes`): it has the All and Missing CoA chips and the **Upload CoA** dialog (`CoaUpload` in `master-data/Lists.tsx`). The dashboard's Drill holes card can reuse both.
- **Audit log data:** every table has the audit trigger (`audit_row()`): one row per insert, update or delete, with before and after as JSON, the actor, the screen and the request. Reading it needs `audit.read` (Supervisor, Manager, Superadmin). `/audit` is a holding page.
- **Sign-in events** are not rows of their own. A sign-in, a failed attempt and a lock change the person's profile, and the trigger records that change.
- **Exports** (the advanced search CSV, the Sample history PDF) are not recorded anywhere.
- **Profile** (`common/Basics.tsx`): name, sidebar, start page, and the Signature and Lab stamp cards, in an older layout. It has no Change password and no Notifications card, and profiles have no `password_changed_at`.
- **Notifications:** `notify()` sends N1 to N10 to every active user with the role. Nobody can mute an event yet.
- **User menu:** name, email, Profile and Sign out. It has no role badges and no Notification settings item. On the phone, the drawer shows the person at the top, without Sign out.

### 12.2 Checked against the project documentation

| Document | What it says | Effect on this plan |
| --- | --- | --- |
| Spec S-01 | Quality tab: KPIs (Batches, RoA issued, CoA coverage), CV vs Ash, RD vs Ash, FC vs GCV with regression and R², Trend CV with a basis switch, drill-hole list with a Missing CoA chip. Regression on the server (13.6); never round below stored precision | All in, as C1. The Determinations KPI is the dashboard plan's Q4 (from AssayNet) |
| Spec S-01, open point | All 100 drill holes, or only those with samples? | Dashboard plan open point 2: only those with samples in the period, so the card follows the filters. The Drill holes with CoA KPI counts the same set |
| Dashboard plan section 3 | Tabs only with `dashboard.quality`: Lab admin, Supervisor, Manager, Superadmin | The tab switch shows for these roles. CSO, Preparation and Analyst keep Operations alone |
| Dashboard plan 15.1 (D-1) | Page tabs are library **Tab** instances. The Segmented item stays for the basis switch in Trend CV | As drawn |
| Spec S-14 and Admin plan section 5 | Filters: record, date, user, record type, action; expandable before and after; read only; Export CSV; opened pre-filtered from Sample history or a user page | All in, as C2. The Nov 24 rule puts the filters **above** the table card (the frame has them inside) |
| Spec D-29 | All core tables audited, kept without expiry | The screen only reads; nothing is ever deleted from the log |
| Spec S-30 | Each Sample history entry links to its audit rows | An **Audit** link on each history entry for roles with `audit.read`, opening `/audit` filtered to the sample. The filter takes the sample's analyses and values too |
| Admin plan section 9 | Demo entries include "Hendra exporting the audit log" and "Bagus locked after 5 failures" | Exports are written to the log by the API (12.5). Sign-in, failed attempt and lock are read from the profile change (12.5) |
| Spec S-13 and App plan section 6 | Name, email read-only, change password, sidebar, language, start page, notification switches | All in, as C3 |
| App plan section 14, point 3 | Password rules: at least 10 characters, a letter and a number, not the email | The rules come from Configuration > Security through `passwordProblem`, as Set password already does |
| Spec 14 | `POST /me/password`; `GET /dashboard/quality` (period, company); `GET /audit` (filters, CSV) | The endpoints as listed |
| Spec 15 | Routes `/`, `/audit`, `/profile`; touch 44; the page never scrolls sideways | As listed. The Quality tab is `/?tab=quality`, so a link or a reload keeps it |
| Navigation plan section 4 | A link to a page the role cannot open shows as plain text | Audit records link to their page only when the role can open it |
| Section 4 rules here | Filters outside cards with the Search label; phone Filters button lg beside the search; touch 44; chips scroll | Applied to the Dashboard Drill holes card, the Audit log and the phone sheets |

### 12.3 Screens and their frames

Frame names are the FigCraft names.

**C1 Dashboard, Quality & reports tab** (`/?tab=quality`)

| Frame | Shows |
| --- | --- |
| `Desktop-02-Dashboard-02-Quality_and_reports-01-Default`, `Tablet-02-Dashboard-02-Quality_and_reports-01-Default`, `Phone-02-Dashboard-02-Quality_and_reports-01-Default` | The tabs, four KPIs, three scatters, Trend CV, Drill holes |
| `Desktop-02-Dashboard-02-Quality_and_reports-02-Missing_CoA` | The Drill holes card with Missing CoA chosen |
| `Desktop-02-Dashboard-02-Quality_and_reports-03-Point_tooltip` | A tooltip on a CV vs Ash point |

- **Tabs:** Operations and Quality & reports, as library Tabs under the title. The Period and Company filters apply to both.
- **KPIs:**
  - **Batches completed** in the period, with the change from the previous period as a pill. The caption gives every batch in the period, whatever its status ("27 total"; SIM Lab's Total Batch, decision C-6).
  - **RoA uploaded** in the period, with its change. The caption gives the batches waiting for the upload (analysis finished, no RoA).
  - **Drill holes with CoA:** "62 of 74", a progress bar with the percentage, and "12 missing". It counts the drill holes with samples in the period.
  - **Determinations:** values saved in the period (one parameter of one sample is one determination), with the change in percent.
- **Scatters** CV vs Ash, RD vs Ash and FC vs GCV:
  - The first-named value runs across and the second up, as in SIM Lab (decision C-2): CV across and Ash up; RD across and Ash up; FC across and GCV up.
  - They use the ADB values of samples in batches completed in the period.
  - The server computes the regression line, R² and n; the card head shows "R² 0.81, n 312".
  - A point's tooltip shows the Sample ID, the sample code, the drill hole and both values.
  - Above 2,000 points the chart draws an even sample of them; n still counts all.
  - With fewer than 3 points the card shows its empty state, "Not enough results in this period".
- **Trend CV:**
  - The mean CV of each batch completed in the period, by completion date (decision C-7).
  - The basis switch (ADB, AR, DB, DAF) opens on **AR**, as the frame and SIM Lab's "Trend CV (arb)". It converts each value with the shared `fromAdb`, which needs IM (and TM for AR). A batch without the needed moisture is left out of that basis.
  - No limit line (decision C-1).
- **Drill holes card:**
  - The chips All and Missing CoA (with counts) and the labelled Search sit above the card (Nov 24 rule). The card holds the table and a pager of 10.
  - Columns: Code; Company; Samples (in the period); RoA (the RoA numbers of the batches that hold its samples, a download where the role has `roa.download`); CoA (the Uploaded tag with the file name, or the Missing tag); Actions.
  - Actions: **Upload CoA** or **Replace CoA** for roles with `coa.upload` (Lab admin, Superadmin), with the existing dialog.
  - Tablet: no Company column. Phone: cards with the same actions.
- **Phone:** the tabs are full width under the title and scroll with the page (they stuck to the top until the owner's Nov 26 feedback, section 15). The Filters button opens the sheet, as on Operations. The scatters stack, and Trend CV scrolls sideways inside its card.

**C2 Audit log** (`/audit`: Supervisor, Manager, Superadmin)

| Frame | Shows |
| --- | --- |
| `Desktop-15-Audit_log-01-Audit_log-01-Default`, `Tablet-15-Audit_log-01-Audit_log-01-Default`, `Phone-15-Audit_log-01-Audit_log-01-Default` | Last 7 days, 10 rows per page |
| `Desktop-15-Audit_log-01-Audit_log-02-Row_expanded` | The Field, Before and After diff under a row |
| `Desktop-15-Audit_log-01-Audit_log-03-Filtered_by_record` | Opened from Sample history, with a removable record chip |
| `Phone-15-Audit_log-01-Audit_log-04-Filters` | The filter sheet |

- **Head:** the overline stays **ADMIN** (the Audit log is not a Work page, so the date rule doesn't apply). **Export CSV** sits at the right.
- **Filters** above the card: Search (record ID, labelled), Date (Today, Last 7 days, Last 30 days, Custom range), User, Record type, Action. A filter that came from a link shows as a removable chip.
- **Columns:**
  - **When:** "Today, 10:42", "Yesterday, 16:05", or "4 Nov 2026, 14:20".
  - **User:** avatar and name. A sign-in row shows the person who signed in.
  - **Action.**
  - **Record:** the record type above the record's ID, which links to the record when the role can open it.
  - **Changes:** the field ("Ash (ADB)") or "3 fields", with a caret that opens the diff.
- **Diff:** Field, Before and After. Before is struck through in the muted colour.
- **Read only:** nothing can be changed here.
- **Tablet:** the Changes column folds into the opened row. **Phone:** cards (when, user, action, record); the Filters button lg beside the search opens the sheet.
- **Export CSV:** every row of the current filters (all pages), with the same columns plus the changed fields as text. The export is itself written to the log as **Exported**.

**C3 Profile** (`/profile`) and the **user menu**

| Frame | Shows |
| --- | --- |
| `Desktop-00-App-09-Profile-01-Default`, `Tablet-00-App-09-Profile-01-Default`, `Phone-00-App-09-Profile-01-Default` | Header, Personal, Password, Preferences, Notifications |
| `Desktop-00-App-09-Profile-02-Change_password`, `Phone-00-App-09-Profile-02-Change_password` | The dialog (on the phone, a full-screen form) with the rules checklist |
| `Desktop-00-App-09-Profile-03-Password_error` | "The current password is not correct." and an unmet rule |
| `Desktop-00-App-09-Profile-04-Signing`, `Tablet-00-App-09-Profile-04-Signing`, `Phone-00-App-09-Profile-04-Signing` | The Manager's Profile with the Signature and Lab stamp cards (built in phase 4, moved into the new layout) |
| `Desktop-00-App-09-Profile-05-Signature_upload` (and Tablet, Phone) | The existing upload dialog, unchanged |
| `Desktop-00-App-07-User_menu-01-Open`, `Phone-00-App-07-User_menu-02-Drawer` | The user menu, and the phone drawer's profile block |

- **Header:** avatar 64, the name in Display, the role badges and the email, and **Sign out** at the right. On the phone, Sign out is full width under the header.
- **Personal:** Name (editable), Email (read-only, "Only a Superadmin can change the email."), and **Save**, enabled once the name has changed.
- **Password:**
  - "Last changed 12 Oct 2026", or "Not changed since the account was set up".
  - **Change password** opens a dialog md: Current password, New password, Confirm, and the rules checklist from Configuration > Security, which ticks as the person types.
  - Errors show under the fields. The server checks the rules again.
  - On success, a toast "Password changed"; the person stays signed in.
- **Preferences:** Sidebar (Expanded or Collapsed; tablets always show the rail), Language (English, read-only, with the D-24 note), Start page (only for roles with My work).
- **Notifications:** one switch per event that reaches the person's roles (12.4), all on by default, and the line "Notifications are in the app only."
- **Signature and Lab stamp:** the existing cards. On desktop they sit in the left column under Password; on the tablet and phone, after Password (App plan 18.2).
- **Layout:** desktop has two columns (Personal, Password and the signing cards on the left; Preferences and Notifications on the right). Tablet and phone have one column.
- **User menu:**
  - Avatar 40, name, email, and the role badges.
  - **Profile**, **Notification settings** (opens the Profile at its Notifications card), and **Sign out**.
  - On the phone, the drawer gets the same block at its bottom, with Profile and Sign out, as the Drawer frame shows. The block moves from the drawer's top to its bottom.

**C4 Audit links from other pages**
- **Sample history:** an **Audit** link on every entry for roles with `audit.read`. It opens `/audit?record=<sample id>`, which lists the sample's rows together with its analyses and values (the value rows point to their analysis, not to the sample).
- **User page** (`/users/:id`): its Recent activity card already has **Open in audit log** (`/audit?user=<id>`) from phase 1. Its five entries switch to the same readable text as the log, and its Security card gains "Password changed 2 Nov" from the new column (Admin plan 4.3).

### 12.4 Who gets which notification switch

The switches follow who each event reaches in `notify()` today:

| Event | Switch label | Shown to |
| --- | --- | --- |
| N1 | Batch ready to receive | Preparation, Lab admin |
| N2 | Samples did not arrive | CSO |
| N3 | Batch ready for data entry | Analyst |
| N4 | Analysis finished, RoA to upload | Lab admin |
| N5 | Job order ready for its CoA | Lab admin |
| N6 | CoA published, to send | CSO |
| N7 | Batch due within 24 h | The roles with a queue (CSO, Preparation, Analyst, Lab admin) |
| N8 | Batch past its deadline | Supervisor, Manager |
| N9 | CoA waiting for my signature | Signatories (`report.sign`) |
| N10 | CoA returned to me | Lab admin |

A switch turned off is saved in `profiles.prefs.notifications` (for example `{"N7": false}`), and `notify()` skips anyone whose switch for that event is off. A person with two roles sees each switch once.

### 12.5 Server

| Need | How |
| --- | --- |
| `GET /dashboard/quality?period=&company=` (`dashboard.quality`) | One request: the KPIs with the previous period, the three scatters (points and regression), the trend per basis, and the first page of drill holes. The queries run in parallel. Values come from `analysis_values` (the primary value, round 1), joined to `parameters` by code (GCV, ASH, RD, FC, IM, TM) |
| `GET /dashboard/quality/drill-holes?filter=&q=&page=` | The Drill holes card's paging and search, so paging does not reload the charts |
| `GET /audit?from=&to=&user=&type=&action=&q=&record=&page=` (`audit.read`) | Read through row-level security. The server turns each row into text: table to record type, column to field label (a fixed dictionary), ids to names (sample, batch, job order, report, user, parameter and basis). Internal columns (`updated_at`, ids, hashes, storage paths) are left out of Changes |
| `GET /audit/export` | The CSV of the same filters. It writes an **Exported** row |
| Actions | An insert is **Created**, a delete **Deleted**. An update is **Status changed** when the status moved, **Published** when a report became issued, **Changed setting** on configuration tables, else **Updated**. On profiles changed by the screen "Sign in": **Signed in**, **Sign-in failed** or **Account locked**, from the columns that changed |
| Record types | Job order, Batch, Sample, Result (analyses and values), Report, Master data, User, Configuration, Sign-in, Saved query |
| Recorded exports | The API writes an **Exported** row (who, what, which filters) for the Audit log CSV, the advanced search CSV and the Sample history PDF (decision C-4) |
| `POST /me/password` | Checks the current password with Supabase Auth (a wrong one counts as a failed attempt, as at sign-in), then the Security rules, then sets the password and `password_changed_at`. The reset and invite links also set the date |
| `GET /me` | Adds `passwordChangedAt` |
| `notify()` | Skips people whose `prefs.notifications.<event>` is `false` |

### 12.6 SQL for the owner

`supabase/migrations/20261126000100_profile_password_audit_index.sql` (written, not run):
- `profiles.password_changed_at` (timestamptz), for the Password card;
- the indexes `audit_actor (actor, at desc)` and `audit_table_at (table_name, at desc)`, for the User and Record type filters.

### 12.7 Differences from the plans and frames

| Item | Frame or plan | Build |
| --- | --- | --- |
| Audit log filters | Inside the table card | Above the card (Nov 24 rule) |
| Dashboard Drill holes chips and search | In the card head | Above the card (Nov 24 rule) |
| Trend CV limit line | "Limit 6,300 kcal/kg" | Left out (decision C-1) |
| "RoA issued" (spec S-01) | — | "RoA uploaded", the dashboard plan's wording: the lab uploads a signed RoA |
| Sign-in rows | Events of their own | Read from the profile change a sign-in makes; nothing new is stored |
| The phone drawer's profile block | At the top in the app today | At the bottom with Profile and Sign out, as the Drawer frame |

### 12.8 Demo data

`pnpm seed:quality` (`--remove` takes it out):
- **Values:** gives the completed demo batches CV, RD and FC values where they lack them, so the scatters and the trend have points (about 120 samples).
- **Drill-hole CoAs:** about one in six drill holes with samples has no CoA.
- **Audit rows:** the seeds and the e2e runs already fill the log. The script adds an export and a locked account for Bagus Prasetyo, made through the sign-in route rather than written by hand.

### 12.9 Tests (`e2e/phase5-quality-audit-profile.spec.ts`, three sizes)

- **QA1:** the Lab admin sees both tabs; the CSO sees no tab switch. The Quality tab shows its KPIs, three scatters with R² and n, and the trend. Switching the basis changes the trend.
- **QA2:** the Drill holes card filters to Missing CoA, searches and pages. The Lab admin sees Upload CoA; the Supervisor doesn't.
- **AU1:** the Supervisor opens the Audit log, filters by user and record type, opens a row's diff, and downloads the CSV, which then shows as an Exported row.
- **AU2:** the Sample history Audit link opens the log filtered to that sample, value rows included. Removing the chip clears the filter. The Lab admin gets No access on `/audit`, and her Sample history has no Audit link.
- **PR1:** the Profile saves the name. Change password refuses a wrong current password and an unmet rule, then changes the password and changes it back.
- **PR2:** a person who turns off "Batch ready to receive" gets no N1. A batch made by the CSO still reaches the other Lab admins and Preparation.
- **PR3:** the user menu shows the roles and opens the Notification settings. On the phone, the drawer shows the profile block at its bottom, with Sign out.
- **Unit:** the audit row-to-text mapping (actions, record types, field labels, sign-in rows) and the regression (slope, R², n).

### 12.10 Frames to update in FigCraft (decision 6)

- **Audit log**, Desktop `01` to `03` and Tablet `01`: the filters move above the card, with the Search label.
- **Dashboard Quality**, Desktop `01` and `02`, Tablet `01`, Phone `01`: the Drill holes chips and search move above the card.
- **Trend CV**, Desktop `01` to `03`, Tablet `01`, Phone `01`: the limit line and its label are removed (decision C-1). The scatters get axis names (C-2).
- **Phone drawer** (`Phone-00-App-02-Menu_drawer-01-Lab_admin`, `-02-CSO`): the profile block at the bottom, as in `Phone-00-App-07-User_menu-02-Drawer`.

### 12.11 Decisions for the owner

Checked on Nov 25 against every plan and research document, the SIM Lab Quality dashboard in the proposal (`source-documents/Proposal LIMS PT Energy Fortune Invesment.pdf`, page 17, the source of spec F-DSH-02) and the prototype. Five of the seven are settled by the documents; C-4 and C-7 stay open with a default.

| # | Question | What the documents say | Answer |
| --- | --- | --- | --- |
| C-1 | Trend CV's limit line ("Limit 6,300 kcal/kg") | No document defines a CV limit. The value came from the prototype (6,300 on ADB, 5,400 on AR), and the chart generator copied it. SIM Lab's Trend CV has no limit line. Spec limits belong to contract specs (D-27, D-43), and control charts to the QC module (research plan, v2) | **Settled: no limit line in v1.** It can come back with contract specs in v2 |
| C-2 | Scatter axes | SIM Lab plots "CV (ADB) vs Ash (ADB)" with CV across and Ash up, "RD vs Ash" with RD across, "FC vs GCV" with FC across; each with the line's equation and r² | **Settled, and the opposite of the first default:** the first-named value runs across. The card head keeps "R² 0.81, n 312" as the frame |
| C-3 | Sign-ins in the Audit log | Admin plan 5 lists the actions Signed in, Sign-in failed and Account locked and the record type Sign-in; the Default frame shows a Signed in row; the user page (Admin plan 4.3) lists "Signed in" in its activity | **Settled: shown.** The Action filter hides them |
| C-4 | Which exports are logged | Admin plan 5 has the action Exported and names only the audit log export. Spec S-30 says the history PDF is "for an audit". Nothing else asks for it | **Open.** Default: all three (Audit CSV, advanced search CSV, Sample history PDF) |
| C-5 | Can N8 and N9 be turned off? | App plan section 2: switches "so a user can mute what does not concern them"; 18.4 draws "Batch past its deadline" and "CoA waiting for my signature" as switches on the Manager's Profile | **Settled: yes**, every switch can be turned off |
| C-6 | Batches completed caption | The research plan (screen 9) and SIM Lab show three counts for the date range: in progress, completed, and **Total Batch**. The dashboard plan's Q1 says "23 total" | **Settled, and different from the first default:** "N total" is every batch in the period, whatever its status |
| C-7 (new) | Trend CV per sample or per batch | SIM Lab plots CV (arb) for every sample, about 1,150 dots along the sample order. The Dashboard v2 plan (Q6), the frame and the prototype draw one line point per completed batch | **Open.** Default: per batch, as the approved plan and frame. One line point per sample would be unreadable at that count |

**Size:** M to L. The audit row-to-text mapping and the scatters are the bigger parts.

## 13 · Slice C build status (Nov 26, 2026)

Built, **not committed**. The owner ran the SQL of 12.6 (checked) and gave go with the decisions of 12.11: C-1 no limit line, C-2 the first-named value across, C-3 sign-ins shown, C-4 all three exports logged, C-5 every switch can be turned off, C-6 "N total", C-7 Trend CV per batch.

**Built**
- **Profile** (`features/common/Profile.tsx`, replaces the old page):
  - Header with the avatar, the name, role badges, the email and **Sign out** (full width on the phone); **Personal** (Name, read-only Email, Save only once the name changed); **Password**; **Preferences**; **Notifications**; and the Signature and Lab stamp cards.
  - **Change password** (`POST /me/password`): checks the current password with Supabase Auth, where a wrong one counts as a failed attempt and can lock the account like a failed sign-in (the window of M-9); then the Security rules, shown as a checklist that ticks while typing; then sets the password and `password_changed_at`. The reset and invite links set the date too. The Password card says "Last changed 25 Nov 2026".
  - **Notifications:** one switch per event that reaches the person's roles (12.4). A switch off is saved in `profiles.prefs.notifications`; `notify()` skips that person for that event only.
- **User menu:** role badges and **Notification settings** (opens the Profile at that card). **Phone drawer:** the person's block (avatar, name, roles, Profile, Sign out) sits at the bottom, as the frame shows.
- **Audit log** (`/audit`, `features/admin/Audit.tsx`, `routes/audit.ts`, `audit-text.ts`):
  - Filters above the card (Search labelled, Date, User, Record type, Action); the date options are Today, Last 7 days, Last 30 days, All time and Custom range. A link by record or user opens on All time with a counted chip and **Clear**.
  - Rows read as text: record type, action (Created, Updated, Deleted, Status changed, Published, Signed in, Sign-in failed, Account locked, Exported, Changed setting), field labels, and names instead of ids. A result value is named by its parameter and basis ("Ash (ADB)"). A row opens its Field, Before and After.
  - A record that has since been removed shows no link. Tablet: the user moves into the open block. Phone: cards, with the filters in a sheet.
  - **Export CSV** writes every row of the filters; the export is logged as an **Exported** row, as are the advanced search CSV and the Sample history PDF (C-4).
  - Sample history: an **Audit** link on each entry for roles with `audit.read`. User page: Recent activity uses the same wording as the log.
- **Dashboard, Quality & reports tab** (`dashboard/Quality.tsx`, `routes/dashboard-quality.ts`):
  - The tab switch for roles with `dashboard.quality` (full width and sticky on the phone), kept in the address (`?tab=quality`). The CSO has none and the API answers 403.
  - Four KPIs; three scatters with the regression, "R² 0.78, n 32" in the head and a tooltip on a point; Trend CV (opens on AR, with the ADB, AR, DB and DAF switch); the Drill holes card (chips and labelled Search above it, table or cards, Upload CoA or Replace CoA for people with `coa.upload`).
- **Demo data:** `pnpm seed:quality` adds an RD value to the 32 samples of completed batches (the batch demo had none), so RD vs Ash has points; `--remove` takes them out.
- **Tests:**
  - Unit: `audit-text.test.ts` (7) and `regression.test.ts` (5).
  - E2E at 1440, 834 and 390: `phase5-profile.spec.ts` (PR1 to PR3), `phase5-audit.spec.ts` (AU1, AU2) and `phase5-quality.spec.ts` (QA1, QA1b, QA2).

**Differences from the plan**
- **Change password on the phone** is a bottom sheet like the other phone dialogs, not a full-screen form.
- **RoA column** of the Drill holes card lists the RoA numbers as text; the download link of 12.3 is not built (the file link needs the batch number, not the RoA number).
- **Samples of a drill hole** are matched by the sample's drill hole text to the hole's code within the job order's company, because only 11 of the demo samples have a drill hole interval.
- **Demo data:** only the RD values were added. The completed batches already had a mix of holes with and without a CoA (3 of 10 missing), and the e2e runs and sign-ins already fill the log.
- **Sign-ins are half the log** (3,400 of 4,400 rows today, because every test signs in); the Action filter hides them.
- **Axis titles of the scatters** are in the app (C-2) but not drawn in the frames.

**Frames updated in FigCraft (not committed)**
- Audit log, Desktop `01` to `03` and Tablet `01`: the filters (and the record chip of `03`) sit above the card.
- Dashboard Quality, Desktop `01` to `03`, Tablet `01`, Phone `01`: the Drill holes chips and Search sit above the card, and the Trend CV limit line and label are hidden (C-1).
- The phone drawer frames already show the profile block at the bottom.

## 14 · Slice D: sign-in pages and the tablet sidebar (built Nov 26, 2026)

Plan and gap table: `Frames_Coverage_Check_Nov26.md`. Owner went with defaults A-1 to A-6 on Nov 26.

- **Sign in, Forgot password, Set password** (`features/auth/Auth.tsx`) now follow frames 00-App-04 to 06 (generator `rowN.js`):
  - Desktop is a split page: a 720 px brand panel with the white logo, the tagline, the company name and the faint mark.
  - Tablet is a navy page with the white logo above a 440 px card.
  - Phone is the shell colour with the colour logo above a full-width card.
  - The footer has Version 1.0 and **Privacy**.
- **Sign in states:**
  - Wrong credentials: the password is cleared.
  - Locked: Warning "Try again at 10:42, or reset your password." with **Reset password** (opens Forgot with the email). Password and Sign in are off until the lock time; the API now returns `until`.
  - Inactive: "This account is inactive. Ask your Superadmin to activate it."
  - Signed out (idle): the email is pre-filled, and the alert gives the idle minutes from Configuration.
  - Session ended.
  - Plain sign-out: "You signed out."
- **Return to the page:** after a timeout, an ended session or a link opened while signed out, sign-in goes back to that page. After a plain sign-out it goes to the start page.
- **Forgot password:** "It works for N minutes" (N from Security `reset_link_minutes`), envelope icon, **Resend link** locked for 60 seconds.
- **Set password:**
  - New endpoint `GET /auth/link-info` (bearer = the link's token): email, roles, invited, and `invitedBy` (the actor of the audit log's insert of the profile; no name when none).
  - Invite: "{Inviter} added you to the lab. Set a password to sign in." with the email and role badges. It goes straight into the app, to the person's start page.
  - Reset: "For {email}". The link's own session is signed out, then a toast and Sign in with the email filled.
  - Both show the shared rules checklist (`common/PasswordRules.tsx`, also used by Change password).
- **Expired links:**
  - Links now carry `?kind=invite|reset` (the Supabase redirect allow-list accepts it; checked Nov 26), because a resent invite is a recovery link in Supabase.
  - Invite: "Invite links work for 7 days. Ask your Superadmin for a new invite."
  - Reset: "Reset links work for 60 minutes. Ask for a new one and use it soon after." with **Send a new link**.
- **Privacy (A-1):** a dialog covering staff and client-contact data, the audit log kept without expiry, UU PDP No. 27/2022, and who to ask. **UNCONFIRMED: the lab has not confirmed the wording (owner, Nov 26). It must be confirmed before go-live.**
- **Sign-out is this device only (A-6):** `/auth/sign-out` called Supabase `admin.signOut(token)`, whose default scope is global. Signing out anywhere ended every session of that person. It is now `local`.
- **Fix:** reactivate put a person who joined through the invite link (never used the sign-in form) back to Invited. It now also checks `password_changed_at`.
- **Tablet sidebar** (frame `Tablet-02-Dashboard-01-Operations-05-Sidebar_open`, Dashboard plan section 9): **Expand** at the bottom of the rail opens the 248 px sidebar over the whole page with the scrim and **Collapse** at its bottom. An item, the scrim or Esc closes it.
- **Tests:** `e2e/phase5-auth.spec.ts` AD1 to AD7 at three sizes (19 pass; AD7 is tablet only). They use a real invite link and a real reset link, the lock after five failures, an idle sign-out on a fake clock, and expired links. Regression run: phase0, phase1-users and phase5-profile pass. PR2 now resets its switch first and waits for the save before the reload.
- **Open for the owner:**
  - Supabase email links (invite, reset) expire after the project's **Email OTP expiration** (Auth settings; default 1 hour, at most 24 hours), not after Configuration > Security. "Invite links work for 7 days" cannot hold. Set the expiration to 86400 seconds; a 7-day invite needs app-made invite tokens (App plan data model `password_tokens`), phase 6.
  - Set `reset_link_minutes` to match the Supabase value, so the pages tell the truth.

## 15 · Owner feedback on slice C and the shell (Nov 26, 2026)

Built the same day, not committed. The owner's FigCraft edits are the reference where named.

| # | Feedback | Done |
| --- | --- | --- |
| F1 | Phone, Dashboard Operations, Active batches: rows like the frame `Phone-02-Dashboard-01-Operations-01-Lab_admin`, not a card per batch | Plain rows with a 1 px divider, 16 apart (`.rowlist`), company in the secondary colour |
| F2 | Desktop, Trend CV: the chart takes the card's width, and a point shows a tooltip like the scatters | The chart measures its box; with more batches than fit (56 px each) it scrolls. A point (hover or tap, 24 px target) shows the batch, completion date, mean CV on the basis and the sample count. The tip opens below high points and to the side at the edges of the part on screen |
| F3 | Drill holes card, desktop frame: the Search sits in the card head at the right, the chips under it. Same on tablet, and the tablet frame gets them | App: Search sm (32 px, 240 wide) in the head, chips under it, inside the card. Frame `Tablet-02-Dashboard-02-Quality_and_reports-01-Default` now has the Search and the chips, copied from the desktop frame |
| F4 | Phone: the Operations and Quality & reports tabs no longer stick | They scroll with the page |
| F5 | Phone, Drill holes, frame `Phone-02-Dashboard-02-Quality_and_reports-01-Default`: the Search inside the card, no Search label, fix the CoA missing tag | Search lg (44 px) without a label under the title, then the chips; each drill hole is a row (code with the CoA tag at the right, company, samples and RoA, then Upload or Replace CoA). The tag no longer stretches to the card's width. The chips and the action stay, though the frame has neither: the chips filter Missing CoA and the action is the Lab admin's upload |
| F6 | Desktop sidebar: the group separator still opened and closed its group | A group row is a label only; the open and close code and its motion are gone (Motion.md updated) |
| F7 | Tablet: the sidebar opened over the page has no logo | The logo (40 px, links to the start page) heads it, as in the phone drawer |
| F8 | Notification items: odd spacing | The list used the shared column class, which put 8 px between items; the items now touch with only the 1 px line, in the bell panel and on the page |
| F9 | Audit log: rows were 57 px for the Supervisor and 58 px for the Superadmin | A record that is a link sat on a taller line. Every row now has a least height of 58 px |
| F10 | Audit log from Sample history: a sample with rows, to see it | The demo seeds write without audit rows, so demo samples show none. Samples changed through the app have rows: **SG.261119.003.RI.075** (12 rows) and **SG.261119.003.RI.071** (10), both in B-2026-0413. Opening one took 4 s: the policy `audit_read` called `has_permission()` (security definer, so never inlined) for every row of about 15,600, and the page reads twice. `supabase/migrations/20261126000400_audit_policy_once.sql` wraps the call in a sub-select so it runs once per query (**owner runs it**) |
| F11 | Phone: no user menu in the top bar, since the drawer has it; frames too | The top bar keeps the menu button, the logo and the bell. In FigCraft the Avatar of the `Breakpoint=Mobile` top bar component is hidden, so every phone frame follows |

Tests: `phase5-quality` checks the trend's width and tooltip and the Search inside the card without a label; `phase0` and `phase5-auth` sign out on the phone from the drawer; AD7 checks the logo and that group labels are not buttons.

**Follow-ups (Nov 26, after F1 to F11):**
- **Due and Late (owner):** Due is now only what is still ahead (a deadline today up to 7 days away); Late is past its deadline. They no longer overlap. Before, Due included Late, so five late batches showed Due 5 and Late 5.
- **Trend CV on the phone (owner):** the vertical axis (numbers, title, line) is its own sticky layer at the left of the scrolling chart, so it stays in view.
- **Phone Drill holes (owner):** the chips and the Upload or Replace CoA button stay; the frame `Phone-02-Dashboard-02-Quality_and_reports-01-Default` now has both, for documentation.
- **Audit policy migration (owner ran it Nov 26):** `audit_read` is now `(select has_permission('audit.read'))`; the row check costs 0.57 s against 0.39 s without, down from 1.1 s. `GET /audit` also runs its page, count and record name together. A sample's log opens in about 2.2 s (was 4 s). The remaining time is the server scanning about 15,600 rows for the JSON filters; an index on the sample id inside the row JSON, or a sample id column, would remove it (phase 6 performance).
- **Link lifetimes (Nov 26, owner did the setting):** the Reset link field in Configuration > Security > Links is read-only by design (Component Library plan: "set in Supabase Auth"). Supabase's **Email OTP Expiration** decides how long links work (set to 86400 s); the number the pages show is `reset_link_minutes` in `app_settings` (security), changed to 1440 by SQL, not by the screen. Invite validity is still the 7-day setting, which Supabase links cannot honour; app-made invite tokens are phase 6.
- **Next (after this commit):** the Phase 5 gate suite (prototype flows as e2e at three sizes, about half a day), then Phase 6; Phase 4 gate G1 to G9 with the lab. Open owner items: the lab confirms the Privacy wording; Supabase OTP and `reset_link_minutes` set.

## 16 · Gate plan (Nov 27, 2026)

V1 plan, phase 5 gate: "Every prototype flow passes as an end-to-end test at 1440, 834 and 390." The owner warned (Nov 27) that the prototype (`.context/prototype`, built Nov 6) is old and unfinished, so a gate that only follows it would let later features go untested. This plan keeps the prototype's flows as the list, tests each one **as the app works today**, and adds what came after the prototype.

### 16.1 What the gate checks

1. **The 45 prototype flows** (registered in the prototype's Flows panel, the same list as the group prototype plans: AP1–8, MW1–2, DB1–2, JO1–12, BA1–8, MD1–3, AD1–4, RE1–3, SE1–3). Where the prototype is out of date, the build designs, screen plans and owner rulings decide the expected result (16.3).
2. **What the prototype never had** (16.4): each already has its own test in the phase specs; the gate runs them.
3. **One journey across the roles** (GT1): a job order from the CSO's request to the CoA sent, then found again in search, history, audit and the dashboards. No per-phase test follows one order through every hand-off.
4. **The whole suite once**, at the three sizes, on freshly seeded data, with the results recorded here (16.6).

### 16.2 The 45 flows and their tests

| Flow | Test today | Gap |
| --- | --- | --- |
| AP1 Sign in, land on the start page | phase0 (one person), WK1 (queues per role) | **GT2**: every persona lands on its start page with its own sidebar |
| AP2 Wrong password, locked | AD3 | — |
| AP3 Forgot and set password | AD3, AD4 | — |
| AP4 Invite | AD2 | — |
| AP5 Notifications | phase3-batches-b (bell) | — |
| AP6 Profile and password | PR1, PR3 | **GT3**: Preferences (sidebar Collapsed, start page) keep after a reload |
| AP7 Session timeout | AD6 (signed out) | **GT4**: "Still there?" then **Stay signed in** keeps the session |
| AP8 No access | the "has no access" tests in phase1 and phase5 | — |
| MW1 Work a queue | WK2 | — |
| MW2 Send several CoAs | WK3 (Download PDFs) | none: Mark sent stays one by one (16.3) |
| DB1 Operations by role | DB1 (cards, filters) | **GT5**: Due and Late chips, the deadline alert's **Open batch**, the CSO without tabs |
| DB2 Quality & reports | QA1, QA2 | **GT6**: **Upload CoA** from the dashboard changes the Missing CoA count |
| JO1–JO12 | phase2-orders (all twelve), phase3-batches (JO6), phase4-reports (JO7) | — |
| BA1 Receive a batch | phase3-batches (receive) | — |
| BA2 Confirm with fewer, hold | phase3-batches (confirm with fewer) | **GT7**: hold a sample with a reason, release it; the CSO gets N2 for the samples that went back |
| BA3–BA8 | phase3-batches, phase3-batches-b | — |
| MD1–MD3 | phase1-master | — |
| AD1 Add and invite a user | phase1-users | — |
| AD2 Lock, deactivate, last Superadmin | phase1-users, AD4 (unlock by reset link) | **GT8**: **Unlock** on the user page |
| AD3 Audit trail | AU1 | — |
| AD4 Configuration feeds the app | phase1-config (each section on its own) | **GT9**: a new condition in Lookups shows in Reception; a new idle time is what the session uses |
| RE1 Find and download reports | RB2, RB3 | — |
| RE2 Build and publish a CoA | RA1, RA2 | none: signing replaced Publish (16.3) |
| RE3 Revise and void | RB4 | — |
| SE1–SE3 | SR1, SR6, AU2 | — |

### 16.3 Where the prototype is out of date (the app follows the right column)

| Prototype | Today | Source |
| --- | --- | --- |
| RE2: the Lab admin publishes the CoA | The Lab admin sends it for signature; the named signatory signs with the password; signing publishes it | Reports_Build_Design (phase 4), owner Nov 16 "Manager signs" |
| MW2: tick several CoAs and Mark sent them together | Download PDFs for several; Mark sent one by one (each CoA has its own recipient and channels) | My_Work_Screen_Plan "Rule" row |
| Samples keyed by client reference only | Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code given on arrival | Spec 6.1 and 6.2 |
| BA5: the Lab admin uploads a signed RoA only | The app drafts the RoA; the signed one is uploaded | Phase 4 RoA notes |
| DB1: Due includes late batches | Due is upcoming only (today to 7 days); Late is past the deadline | Owner Nov 26 (section 15) |
| Sign-in, set password, sidebar | Rebuilt to the frames in slice D; groups no longer collapse | Section 14, section 15 F6 |
| Saved queries in the browser | Saved on the server, shared with staff | Section 10 (slice B) |

### 16.4 After the prototype (already tested; the gate runs them)

Signing and the signing cards (RA2, RB1), Sample IDs (phase2-orders, phase3-batches), Ply/Comp per sample (ply-comp), delete a batch (batch-delete), the app-drafted RoA (RB3), camera scan and history PDF (SR7), saved queries (SR4), notification switches (PR2), audit links (AU2), real invite and reset links (AD2, AD4, AD5), Configuration services, methods and templates (phase1-config-b).

### 16.5 New tests (`e2e/phase5-gate.spec.ts`)

- **GT1 Journey**, one order per size, numbered `ZG-…` and removed afterwards:
  1. The CSO creates and submits a job order and registers three samples.
  2. The Lab admin adds a batch; the batch shows on Preparation's My work.
  3. Preparation receives two samples (Sample IDs appear) and holds one, then confirms; the held sample goes back to the job order.
  4. Preparation enters the ADL and finishes; the Analyst enters the values (FC calculated) and finishes.
  5. The Lab admin uploads the signed RoA and completes the batch; generates the CoA and sends it for signature; the Manager signs.
  6. The CSO sees the CoA on My work (CoAs to send) and marks it sent; the job order reads Delivered.
  7. Afterwards: quick search finds a Sample ID, Sample history lists every step, the Audit log has the record's rows, and the Operations dashboard counts the completed batch.
- **GT2** to **GT9** as named in 16.2.

### 16.6 The run

- Seeds first, in order: `pnpm seed:master`, `seed:demo`, `seed:batches`, `seed:reports`, `seed:work`, `seed:quality`. Gotenberg must run (`docker start sgsi-gotenberg`).
- One Playwright run, one worker, the three sizes. About 100 tests a size, so expect **45 to 60 minutes**.
- A test that fails and then passes on a rerun is fixed, not ignored.
- The result goes into a table here: tests per size, passed, failed, skipped, and anything fixed.

### 16.7 Decisions for the owner

| # | Question | What the documents say | Proposed answer |
| --- | --- | --- | --- |
| G-1 | Test the prototype's flows as the prototype does them, or as the app does them today? | V1 plan: each screen "behaves like the prototype"; but later documents changed RE2, MW2, Sample IDs and Due (16.3) | **As the app does them today**; 16.3 records each difference |
| G-2 | Update the prototype to match? | No document asks for it. The Sample ID memo already left the frames and prototype behind (spec 6.2) | **Decided by the owner (Nov 27): do not update the prototype.** The app and the frames are the reference; 16.3 is its errata |
| G-3 | The journey at all three sizes, or desktop only? | The gate text says three sizes | **All three** (three orders, about 6 minutes each) |
| G-4 | Seven personas signing in at three sizes hit Supabase's sign-in limit | Earlier runs: two Playwright runs at once failed on it | **Sign each persona in once per size and reuse the session** in the gate spec |

**Size:** about half a day: GT1 to GT9 about 2 to 3 hours, then the full run and fixes.

### 16.8 Gate build (Nov 27, 2026)

The owner decided G-2 (do not update the prototype); G-1, G-3 and G-4 were taken as proposed.

**`e2e/phase5-gate.spec.ts`**: seven tests, serial, at the three sizes. **21 of 21 pass.** Desktop takes about 4 minutes, tablet and phone about 8 together.
- **GT1, the journey.** Each step is done through the API as the role that does it, and the next person's screen is checked in the browser. The screens of each step have their own tests in the phase specs.
  - It runs on its own test client, contact and drill hole, so the demo data is untouched.
  - The chain: the CSO's order, the Lab admin's batch (due tomorrow), and N1 to Preparation. Then reception: two samples arrive and get Sample IDs. One sample is held in the browser with a hold reason added in Lookups a moment before, then released. One sample never comes, and N2 goes to the CSO.
  - Then the ADL (N3 to the analyst), the values (N4 to the Lab admin), the signed RoA and Complete, the CoA, Send for signature and N9 to the Manager. The Manager signs, the order appears in the CSO's CoAs to send, Mark sent, and the order reads Delivered.
  - Finally the Supervisor finds the Sample ID in search, its history shows the steps, and the Audit log has its rows.
- **GT2:** each of the seven personas lands on its start page (computed with the shared `startPath`) with exactly the sidebar `navFor` gives its permissions.
- **GT3:** the Profile's start page and sidebar choice keep after a reload.
- **GT4 and GT9:** Security's idle time of 5 minutes is what the session uses; "Still there?" then Stay signed in keeps the person signed in.
- **GT5:** Late shows only past deadlines, Due none of them, and the two never add up to more than All. The deadline alert opens a batch.
- **GT6:** Upload CoA on the Quality tab clears the journey drill hole's Missing CoA.
- **GT8:** five failed sign-ins lock Bagus Prasetyo; Unlock on his user page brings him back.

**How it was built** (skills: playwright-expert for the suite, debugging-wizard for the failures):
- **Sessions:** each persona signs in once per size and the stored session is reused (G-4).
- **Selectors:** accessible names and the app's ids, not colour classes. GT5 reads the "Past due" label.
- **Traces:** `trace: "retain-on-failure"` was added to `playwright.config.ts`.
- **Shared state:** the gate is serial and shares GT1's records with GT5 and GT6 on purpose. The rest of the suite keeps its tests independent.

**Found and fixed on the way:**
- **Cleanup deleted in the wrong order.** It removed test clients and their contacts before the job orders that point at them; it also missed a test client's job orders and its Sample ID counter. It now deletes job orders first, then contacts, counters and clients.
- **A 500 mid-journey came from the network, not the app.** The machine briefly could not resolve the Supabase database host (`ENOTFOUND`, then `CONNECTION_CLOSED`, in the API log at 02:33). It passed on the rerun.

**The full run (Nov 27, 2026).** The whole e2e suite was run at the three sizes, with Gotenberg running: **293 passed, 4 failed, 11 skipped by design, 1 not run.** It took 1.5 hours. None of the failures was an app bug; the tests were fixed and both files rerun at all three sizes: **18 of 18 pass.**
| Size | Tests | Passed | Failed | Skipped | Not run | After the fixes |
|---|---|---|---|---|---|---|
| Desktop | 103 | 99 | 1 (QA1) | 3 | 0 | all pass |
| Tablet | 103 | 98 | 2 (QA1, RA2) | 2 | 1 (RA3) | all pass |
| Phone | 103 | 96 | 1 (QA1) | 6 | 0 | all pass |

The run took 1.5 hours, longer than the 45 to 60 minutes estimated in s16.6. The gate file alone takes about 3.5 minutes a size; the slowest other file is phase2-orders at about 2.7 minutes.

- **QA1 (desktop, tablet, phone): the test was out of date.** The sticky y axis of Trend CV (owner, Nov 26) is a second `svg` in `#tr-scroll`, so `#tr-scroll svg` matched two. The test now reads `svg[role=img]`.
- **RA2 (tablet): the wait was too short.** Signing renders the final PDF in Gotenberg. The failure screenshot shows "Certificate signed and published"; it came after the 15 s wait. That one check now waits 45 s. RA3 did not run because the file is serial.
- **The 11 skips** are tests that apply to one size only: phone-only Configuration buttons and sheets, desktop/tablet tables and header search, and the tablet rail.
- **The owner reviewed the gate on Nov 27, 2026.** Still open for go-live: Phase 4 gate G1 to G9 with the lab, and the Privacy wording (lab to confirm, s14).
