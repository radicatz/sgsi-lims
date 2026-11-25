# Phase 5 · Monitoring and search · Build design

Nov 24, 2026 · **Slice A built (not committed); owner's go given, plan defaults used** · phase 5 of `V1_Build_Plan.md` section 2

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
