# Search screen plan

Written Nov 5, 2026. **Status: BUILT Nov 5, 2026** (section 14). Module 08 Search, canvas row **M**. Builds on spec S-29 (advanced search), S-30 (sample history), F-SRCH-01 and F-GEN-01 (`../Project/Coal_LIMS_Development_Spec.md`), the sidebar rules (`../Navigation/Navigation_Screen_Plan.md`, section 4: the CSO never sees result values or RoA files) and the Clarity LIMS search videos 03 and 08 (frames in `../../research/clarity-lims/screenshots/03-advanced-search/` and `08-search-functionality/`).

## 1 · Goal

Find any record from anywhere in a few keystrokes, and answer questions the lists cannot ("every sample from DH-BNM-021 with Ash above 10 % on ADB"). Then show one sample's whole story in one place. Three tools:

1. **Quick search** in the top bar: type or scan an ID and go straight to the record.
2. **Search results** page: everything that matches a word, grouped by type.
3. **Advanced search**: conditions on job orders, batches, samples or results, saved queries, export.

Plus the **Sample history** page, opened from search, from the job order Samples tab and from the batch page.

## 2 · What the references show

| Clarity LIMS (videos 03 and 08) | Here |
| --- | --- |
| Header search with a scope dropdown (All, Sample, Container, Project, Protocol step) | The top bar search we already draw ("Search by batch, lab code, or drill hole…" with the scan button). No scope dropdown: one box finds every type, and the results page filters by type |
| Results page: "Your search for 'Sample 1' returned 11 results", category list with counts on the left, one card per hit, expandable to its workflow steps | Same layout. Each hit is a row with the facts that identify it and its status; the step history lives on the Sample history page instead of an expanding card |
| With "All", the results are grouped in sections (Samples, Containers, Projects, Protocol steps), each with **Show all** | Same: sections Samples, Batches, Job orders, Drill holes, Reports, Clients, each up to 5 hits and **Show all** |
| Advanced search: "I'm searching for [Sample]"; numbered rows "Where [entity] has [field] [operator] [value]" joined by AND or OR; grouping controls; Add, Undo, Clear all, Save query, Import query; Order results by | Same idea, simplified for v1: one **Match all / Match any** switch instead of per-row AND/OR and grouping; Add condition, Clear all, Save query; sort by clicking a column |
| Saved queries listed on the left | Same: **My queries** and **Shared with me** |
| Results grid with CSV download and a show/hide columns menu; a notice when results pass the display limit of 500 | Same: **Columns** menu, **Export** (CSV, XLSX), and a notice above 500 rows (the export still holds every row) |

## 3 · Who sees what

Everyone has Search (`search.use`). Results follow the same rules as the pages they lead to:

| Role | Finds | Never sees |
| --- | --- | --- |
| CSO | Job orders, batches, samples, drill holes, CoAs, clients | **Result values** (the Results target and value columns are not offered) and **RoA** files |
| Preparation | Job orders, batches, samples, drill holes | Reports, clients |
| Analyst | Job orders, batches, samples, drill holes, results, RoAs | CoAs, clients |
| Lab admin, Supervisor, Manager, Superadmin | Everything their sidebar holds | — |

A hit the role cannot open is not shown at all, so counts are per role.

## 4 · Quick search (top bar)

Desktop and tablet. Focusing the field opens a panel under it (width 560, Elevation/md):

```
[🔍 b0417|                                   (scan)]
┌──────────────────────────────────────────────────┐
│ SAMPLES                                           │
│  B0417-01  BNM-3601    PT Bara Nusantara M.  In batch │
│  B0417-02  BNM-3602    PT Bara Nusantara M.  In batch │
│ BATCHES                                           │
│  B-2026-0417  JO-2026-0138  Preparation           │
│ JOB ORDERS                                        │
│  …                                                │
│ ─────────────────────────────────────────────────│
│ See all 14 results for "b0417"              Enter │
└──────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Empty focus | **Recent**: the last 5 records the user opened, and the last 3 searches |
| Typing | From 2 characters: up to 3 hits per type in the order Samples, Batches, Job orders, Drill holes, Reports, Clients; the matching part of each ID is bold |
| What it matches | Sample ID, lab code, batch number, job order number, PO, drill hole code, RoA and CoA numbers, client name and code |
| Exact match | When the text is exactly one record's ID, that hit is first and marked **Go to**; Enter opens it |
| Scan | The scan button (or a USB scanner typing into the field) reads the Code 128 on a sample label (lab code) and opens that sample's **history** directly |
| Footer | **See all N results** opens the results page; also Enter when there is no exact match |
| No match | "No match for "XK-77"" and **Open advanced search** |
| Keyboard | ↑ ↓ move, Enter opens, Esc closes |

**Phone:** the top bar has no search field (it shows the menu button). The **Search** item in the menu opens the results page with the field on top, Recent under it, and the scan button opening the camera (the Reception scan frame already exists).

## 5 · Search results `/search?q=`

```
SEARCH
Results for "BNM-35"                                  [Advanced search]
┌ Types ─────────┐ ┌ Samples  12 ─────────────────────────────────────┐
│ All        31  │ │ BNM-3507  B0410-07  JO-2026-0131  PT Bara N.  In batch  → │
│ Samples    12  │ │ …  (5 rows)                          Show all 12 │
│ Batches     3  │ └──────────────────────────────────────────────────┘
│ Job orders  2  │ ┌ Batches  3 ──────────────────────────────────────┐
│ Drill holes 4  │ │ …                                                │
│ Reports     6  │ └──────────────────────────────────────────────────┘
│ Clients     0  │   (Job orders, Drill holes, Reports …)
└────────────────┘
```

| Part | Spec |
| --- | --- |
| Header | Overline SEARCH, title "Results for "BNM-35"" (the count goes in the Types list, not under the title); **Advanced search** (Secondary, lg). The page keeps a search field at the top of the main column (lg) so the user can change the word |
| Types (left, 240) | One row per type with its count; All first; a type with 0 is shown muted and not clickable. On tablet and phone the types become Filter chips above the results |
| Result sections | One card per type, Card head with the type and count; up to 5 rows; **Show all 12** switches the type |
| One type selected | One card with every hit, pager (10 rows) |
| Sample row | Sample ID, lab code, job order, client (avatar 40), status badge, arrow; opens the **Sample history** |
| Batch row | Batch number, job order, client, status badge, deadline; opens the batch page |
| Job order row | Number, client, PO, status badge, due date; opens the job order |
| Drill hole row | Code, description, client, CoA tag; opens the drill hole list filtered to it |
| Report row | Number, kind (CoA or RoA), job order, status badge; opens the report page |
| Client row | Avatar, name, code, status; opens the client page |
| No results | Empty state "Nothing matches "XK-77"", text "Check the ID, or search by another field.", **Open advanced search** |

## 6 · Advanced search `/search/advanced`

Desktop:

```
SEARCH
Advanced search                                              
┌ Saved queries ──┐ ┌ Query ──────────────────────────────────────────────────┐
│ MY QUERIES      │ │ Searching for [Samples ▾]     Match [All | Any]          │
│ High-ash BNM  ↗ │ │ 1  [Drill hole ▾] [is ▾]          [DH-BNM-021      ]  ✕  │
│ Held this month │ │ 2  [Result: Ash ▾][greater than ▾][10   ] [ADB ▾]     ✕  │
│ SHARED WITH ME  │ │ 3  [Received date][between ▾]   [1 Oct] – [31 Oct]   ✕  │
│ Late batches    │ │ [+ Add condition]                 [Clear all] [Save query] [Search] │
└─────────────────┘ └──────────────────────────────────────────────────────────┘
                    ┌ 24 samples ───────────────────────────── [Columns ▾] [Export ▾] ┐
                    │ Sample ID  Lab code  Drill hole  Depth  Ash ADB  TS ADB  Status │
                    │ …                                                     pager   │
                    └───────────────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Searching for | Select: **Samples**, **Batches**, **Job orders**, **Results** (one row per sample and parameter value). Results is not offered to the CSO |
| Match | Segmented **All** (AND) or **Any** (OR) for every condition. Groups such as "(1 AND 2) OR 3" are next goal (Clarity's grouping controls) |
| Condition row | Number, **Field** select, **Operator** select, **Value** (text, select, number, date, or two values for "between"), remove ✕. A result field adds a **Basis** select (ADB, DB, DAF, AR) |
| Operators | Text: is, is not, contains, starts with, is empty. Number: equals, greater than, less than, between. Date: on, before, after, between. Choice: is, is any of |
| Fields | Samples: sample ID, lab code, job order, batch, client, drill hole, seam, lithology, depth from, depth to, status, received date, received by, condition, held reason. Batches: number, job order, client, status, standard, created, deadline, prepared by, analysed by, RoA number. Job orders: number, client, PO, status, parameters, created, due, CoA status. Results: every sample field, plus parameter, value, basis, entered by, entered date |
| Actions | **Add condition** (Tertiary), **Clear all** (Ghost), **Save query** (Secondary), **Search** (Primary). Search runs the query; changing a condition marks the results "Out of date, search again" |
| Results card | Card head: count ("24 samples") with **Columns** (menu of checkboxes, the default columns per target ticked) and **Export** (CSV, XLSX). Table with sortable columns, pager (25 rows). A row opens its record: a sample or result row opens the Sample history |
| Over 500 rows | Inline alert (Info) "Showing the first 500 of 2,318. Narrow the conditions, or export to get every row" |
| Saved queries (left, 260) | **My queries** and **Shared with me**; a query opens with its conditions filled and runs; row menu Rename, Duplicate, Share, Delete (own queries only; shared ones can be duplicated) |
| Save query dialog (md) | Name, **Share with staff** switch (read-only for others), Save |
| Empty state | Before the first search: "Build a query, then press Search." under the query card |

Tablet: the saved queries move into a **Saved queries** select above the query card; condition rows wrap to two lines (field and operator, then value). Phone: the same, stacked; the results show as cards with the first three columns; Export stays, Columns is hidden.

## 7 · Sample history `/samples/:id/history`

One sample's story, newest last, as a timeline. In v1 the steps are the ones the lab records (spec 1.1).

```
Job orders > JO-2026-0131 > BNM-3507
BNM-3507   [In batch]                                   [Export PDF]
B0410-07   JO-2026-0131   B-2026-0410   PT Bara Nusantara Mandiri
┌ Sample ───────────────┐ ┌ History ─────────────────────────────────────────────┐
│ Drill hole DH-BNM-021 │ │ ● Registered on JO-2026-0131        Rina Kartika  20 Oct │
│ Seam       EN2        │ │ ● Received, labelled B0410-07       Dedi K.  22 Oct 09:12│
│ Lithology  Coal       │ │   Mass 2.41 kg   Condition Good   2 photos            │
│ Depth      41.2–42.0 m│ │ ● Added to batch B-2026-0410        Maya L.  22 Oct      │
│ Mass       2.41 kg    │ │ ● Preparation finished, ADL 6.42 %  Dedi K.  23 Oct      │
│ Status     In batch   │ │ ● Values entered (8 parameters)     Fitri H.  25 Oct     │
└───────────────────────┘ │   TM 14.20  IM 8.10  Ash 5.42  …   [View values]         │
                          │ ● Batch completed, RoA-0410 uploaded  Maya L.  28 Oct    │
                          │ ● CoA-JO-2026-0131-1 published        Maya L.  28 Oct    │
                          │ ● CoA revised: revision 2 published   Maya L.  1 Nov     │
                         └─────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Header | Breadcrumb Job orders > job order > sample ID; title sample ID with its status badge; the lab code, job order (link), batch (link) and client as separate texts; **Export PDF** (Secondary) |
| Sample card (left, 378) | Key-value rows (Inline): drill hole, seam, lithology, depth from and to, client description, mass as received, condition, status, held reason when held |
| History card | One entry per event: dot (status colour), event text, person (avatar 24 and name), date and time as separate texts; an entry can carry a second line (mass, condition, photos, ADL, values) |
| v1 events | Registered on the job order; marked awaiting arrival or not received (Revision B); received and labelled (mass, condition, photos); added to a batch; held or released (reason); preparation started, finished (ADL); values entered and edited (by whom, how many parameters; values for roles that may see them); analysis finished; batch completed with the RoA number; CoA published, revised, sent |
| Values | Shown in the entry as parameter and value pairs on the measured basis; **View values** opens the batch Analysis tab at this sample. For the CSO the entry reads "Values entered (8 parameters)" with no numbers and no link |
| Pending steps | Steps not reached yet show as grey dots without person and date ("Preparation", "Analysis", "CoA"), so the user sees how far the sample is |
| Audit link | For Supervisor, Manager and Superadmin, each entry has a small **Audit** link to the audit log filtered to that record (S-14, built with Admin) |
| Export PDF | The same timeline as a printable page with the sample card; for an audit |
| Entry points | Search results and advanced search rows; the scan button; the job order Samples tab row menu (**History**); the batch page sample row menu (**History**) |

Next goal (kept in the spec): result rounds per tab, rechecks with scope and reason, escalations, approvals, RoA versions, and preparation children (lab sample, reserve sample).

## 8 · Frames (module 08, row M)

| SS | Screen | VV Variant | Sizes | Persona | Content |
| --- | --- | --- | --- | --- | --- |
| 01 | Quick_search | 01 Recent | D | Maya Lestari | Panel on focus: recent records and searches, over the Dashboard |
| | | 02 Typing | D, T | Maya Lestari | "b0417": samples, batch, job order hits, See all 14 |
| | | 03 Exact_match | D | Rina Kartika | "JO-2026-0137": Go to first |
| | | 04 No_match | D | Dedi Kurniawan | "XK-77", Open advanced search |
| 02 | Search_results | 01 All | D, T, P | Maya Lestari | "BNM-35", sections per type |
| | | 02 One_type | D | Maya Lestari | Samples only, 12 rows, pager |
| | | 03 CSO | D | Rina Kartika | No Results values, CoAs only under Reports |
| | | 04 No_results | D | Maya Lestari | Empty state |
| | | 05 Phone_start | P | Dedi Kurniawan | Field, scan, Recent |
| 03 | Advanced_search | 01 Empty | D | Maya Lestari | Searching for Samples, one empty condition, saved queries |
| | | 02 Sample_query | D, T, P | Maya Lestari | Three conditions (drill hole, Ash ADB > 10, received in October), 24 rows |
| | | 03 Results_query | D | Hendra Wijaya | Searching for Results, parameter and basis columns |
| | | 04 Columns_menu | D | Maya Lestari | Columns menu open |
| | | 05 Save_query | D | Maya Lestari | Save query dialog with Share with staff |
| | | 06 Over_limit | D | Bambang Sutrisno | Info alert, 500 of 2,318 |
| 04 | Sample_history | 01 Default | D, T, P | Maya Lestari | BNM-3507, every v1 event up to the CoA revision |
| | | 02 CSO | D | Rina Kartika | Values hidden, no View values |
| | | 03 In_progress | D | Fitri Handayani | A sample in analysis: pending steps grey |
| | | 04 Held | D | Dedi Kurniawan | Held at reception with the reason, then released |

Totals: 18 desktop, 4 tablet and 4 phone frames: **26 frames**. Job order Samples tab and batch page row menus get a **History** entry when those rows are next rebuilt; no new frames there.

## 9 · Demo data

- History sample BNM-3507 of JO-2026-0131 (PT Bara Nusantara Mandiri, completed batch B-2026-0410, lab code B0410-07, drill hole DH-BNM-021, seam EN2, depth 41.2 to 42.0 m), matching the Reports frames (RoA-0410, CoA-JO-2026-0131-1 superseded by revision 2). The In_progress sample is BNM-3602 in B-2026-0417 (JO-2026-0138, in preparation on the Dashboard). Quick search types "b0417" (lab codes B0417-01 to B0417-12).
- People and dates: Rina Kartika registers (20 Oct), Dedi Kurniawan receives and prepares (22 and 23 Oct), Fitri Handayani enters values (25 Oct), Maya Lestari completes the batch and publishes the CoA (28 Oct), revision 2 on 1 Nov.
- Values from the Reports preview (TM 14.20, IM 8.10, Ash 5.42, VM 39.85, FC 46.63, TS 0.42, GCV 5,980 on ADB).
- Saved queries: "High-ash BNM samples" (mine), "Held this month" (mine), "Late batches" (shared by Hendra Wijaya).

## 10 · Data each screen needs (v1)

A search index over the ID fields of `job_orders`, `batches`, `samples`, `drill_holes`, `reports` and `companies` (Postgres full-text and trigram on IDs), filtered by the user's permissions (spec 13.7 row-level security). `saved_queries` (owner, name, target, match, conditions JSON, shared). `recent_items` per user. The Sample history reads `batch_status_log`, sample events (reception, hold, preparation, values) and `reports` with `report_deliveries`; nothing new is stored for it.

## 11 · Design rules that apply

Card anatomy (padding 16, Card head 32); centered dialogs, Bottom sheet on the phone; Button sizes lg 40, md 32, sm 28 (sm in condition rows and table rows); client avatars round, 40 in tables; Tabs and Filter chips from the library; no " · " between values; no count subtitle under titles (counts sit in the Types list and card heads); role sidebar per persona.

## 12 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Does the Preparation team see result values in search? | No: Results target hidden for Preparation as for the CSO (values are Analyst work) |
| 2 | AND / OR per row, or one Match all / any switch | One switch in v1; per-row and groups later |
| 3 | What does a scan open | The sample history |
| 4 | Recent items kept | Last 5 records and 3 searches per user, on this device and account |
| 5 | Shared queries | Read-only for others, who can duplicate them |
| 6 | Export limit | Every matching row, CSV or XLSX, filtered by permission |
| 7 | Does search find archived masters (archived drill holes, clients) | Yes, with an Archived tag |

## 13 · Build steps (after go)

1. Library: no new component expected. The quick-search panel and the condition row are screen patterns (Search, Select, Option row, Icon button); the timeline entry is a frame pattern with Avatar 24.
2. `library/screens/rowM.js` builds row M with the role sidebar; `build-screens.js` gets the M entry (after L).
3. `naming.js` needs no rules (final names); `cards.js` and `fit.js` run as usual.
4. Deploy (dirty check, backup, swap), commit. No export unless asked.
5. Docs: build status here; spec S-29 and S-30 v1 notes; `Frame_Naming.md` module 08; README.

## 14 · Build status (Nov 5, 2026)

All 26 frames are built on row **M  Search** with `library/screens/rowM.js` (module 08, final names, role sidebar per persona): Quick_search 5, Search_results 7, Advanced_search 8, Sample_history 6. Deployed to the main file (backup `backup/SGSI-LIMS-screens.before-search.figcraft`). The open points of section 12 were used with their defaults.

Built from library instances: Search, Select, Text field, Segmented item, Filter chip, Checkbox, Switch, Status badge, Tag, Card KPI, Pager, Inline alert, Empty state, Dialog, Option and Key-value rows, Avatar, Breadcrumb. The quick-search panel, the condition row and the timeline entry are frame patterns in `rowM.js`, not library components.

Deviations from the plan:

- **Quick search** is drawn over a short Dashboard (header, KPI strip, an Active batches card), because the panel opens over whatever page the user is on. The tablet frame shows the Typing state only.
- **Top bar search field** shows the typed text in the placeholder style; the library Search field has no separate "typed" colour.
- **Exact match** marks the first hit with a tinted row and the word "Go to"; the footer reads "Open JO-2026-0137" instead of "See all".
- **Match** is the All / Any segmented switch next to "Searching for"; no grouping, as decided.
- **Results query** (Supervisor frame) shows the same query as Samples with the Results columns (parameter, value, basis, entered by, date).
- **Columns menu** is a popover under the Columns button (checkbox list); **Save query** is a centered Dialog md with the Share with staff switch.
- **Sample history** shows the timeline as dots without a connecting line, the person as Avatar 24 and name with the date as a separate text, and **View values** as a small ghost button. The **Audit** link for Supervisor, Manager and Superadmin is not drawn (the Audit log is built with Admin); the **History** entry in the job order and batch row menus is not drawn.
- **Phone:** the start frame (field, Recent records and searches, Scan a label) is the entry; quick search has no phone frame, as planned.
- **Tablet and phone** exist for Search results (All), Advanced search (Sample_query) and Sample history (Default), plus the tablet Typing frame and the phone start frame.

