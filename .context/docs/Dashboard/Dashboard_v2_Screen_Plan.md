# Dashboard v2 — Design Plan

> **FORMAT MISMATCH (flagged Nov 10, 2026).** The lab's sample identifiers changed (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code `CCC.BB.NNN.Lotxx` replace the lab code `B{batch}-NN`, and the client's own name is now the Client reference. The rules in this plan follow the new format, but the built frames, the prototype and the demo values here (`BNM-3507`, `B0410-07`) **still show the old format and are not being rebuilt**. **Where they disagree, the spec wins.** Register of mismatches: `../Project/Sample_Identifiers_Plan.md`.

Nov 5, 2026 · Revision 2, frames built Nov 5 · replaces the Oct 19 plan (built in pen.dev) and the deleted parity plan `Dashboard_Screen_Plan.md`

"v2" is the name of this dashboard design, not a product release. **v1 ships with this dashboard.** The SIM Lab parity dashboard is dropped; everything it showed is on the Quality & reports tab.

## 1 · Goal

One dashboard with two jobs:

- **Operations:** what is in the lab, what is due, what is late, and how fast the lab works.
- **Quality & reports:** what the coal looks like, and which drill holes have reports.

## 2 · What changed from the Oct 19 plan

| Oct 19 plan | Now | Why |
| --- | --- | --- |
| Built in pen.dev, rows in `screens.pen` | Built in FigCraft with the library, canvas row **I** | FigCraft is the design source (Oct 29) |
| Ships after go-live, v1 goes live with the parity dashboard | Ships in v1; the parity plan is deleted | Owner, Nov 5 |
| Admin and Client roles | Seven staff roles; tab access per spec S-01 and `../Navigation/Navigation_Screen_Plan.md` | Spec 8.1, 8.2 |
| Client view with My batches | **Parked** until a client portal exists | D-35 |
| KPI "Awaiting review" with recheck flags | Replaced by **Samples received** | There is no review step or recheck in v1 (spec 9.2.1) |
| Batch workflow: Created, Preparation, Analysis, Finished, Completed | The v1 steps: Created, Receiving, Preparation, Prep finished, Analysis, Analysis finished, Completed | Spec 9.2.1 |
| — | **Your queues** strip, **Job orders by status**, **Turnaround by company** | S-01 additions (Clarity, AssayNet) |
| Expandable sidebar introduced here | Already built in the library (Oct 30) and on every screen | Section 9 |
| Old sidebar groups (Users, Companies, WORKFLOW) | The current sidebar, filtered by role | Navigation plan |

## 3 · Who sees what

| Role | Tabs | Your queues strip | Notes |
| --- | --- | --- | --- |
| Lab admin | Operations (default), Quality & reports | ✔ | Main persona: Maya Lestari |
| Supervisor, Manager | Operations (default), Quality & reports | | Dashboard is their start page |
| Superadmin | Operations (default), Quality & reports | | |
| CSO, Preparation, Analyst | Operations only, **no tab switch** | ✔ | |

Only Lab admin and Superadmin (`coa.upload`) see **Upload CoA** in the drill-hole list.

## 4 · Page header and filters

```
Dashboard                                   [Last 30 days ▾] [All companies ▾]
[ Operations | Quality & reports ]
```

- **Title** "Dashboard". The date overline is the same as on My work. No subtitle.
- **Tab switch:** Segmented control, Operations | Quality & reports. It shows only for roles with `dashboard.quality`.
- **Filters:** Period (Last 7 days, Last 30 days, This month, Last month, This year, Custom range; default Last 30 days) and Company (All companies, or one). They apply to every widget on both tabs, except where a widget says "now": the queues strip, Active batches and Deadlines always show the current state.
- **Tablet:** filters stay in the header, and the tab switch goes on its own row below the title. **Phone:** the tab switch is full width under the title and sticks when scrolling. The filters move to a **Filters** button that opens a bottom sheet.

## 5 · Operations tab

Desktop, 1440, sidebar expanded (content 1128 wide):

```
┌ Your queues ─────────────────────────────────────────────────────────────────┐
│ Batches to receive 2   Signed RoA to upload 1   CoAs to generate 1   Open My work →│
└──────────────────────────────────────────────────────────────────────────────┘
[Batches in progress] [Due this week] [Samples received] [Mean turnaround]
[Batch workflow            ] [Job orders by status     ] [Sample type mix    ]
[Samples received per day                ] [Turnaround by company           ]
┌ Active batches  All | Due | Late ───────────────┐ ┌ Deadline alert ──────┐
│ Batch  Company  Job order  Deadline  Progress  St │ │ This week (strip)    │
│ … 8 rows, pager                                  │ │ Deadline items       │
└──────────────────────────────────────────────────┘ └──────────────────────┘
```

| # | Widget | Content | Library |
| --- | --- | --- | --- |
| O1 | **Your queues** (roles with My work) | One link per queue the user's roles have, each with the queue name and count; overdue counts in the error colour. **Open My work** at the right. Hidden when every count is 0 | Card; Queue tag or text links |
| O2 | **Batches in progress** | Main number; "4 completed", "23 total" as two lines under it, in the period | Card KPI, Kind=Delta |
| O3 | **Due this week** | Count of batches due by Sunday; "2 past due" in the error colour | Card KPI, Kind=Delta |
| O4 | **Samples received** | Samples received in the period, with the change against the previous period | Card KPI, Kind=Delta, Delta Up/Down |
| O5 | **Mean turnaround** | Days from Confirm reception to Completed. The colour band (achieved, 100–110%, 110–125%, 125–150%, 150–200%, 200–300%, >300% of the service turnaround) colours the value and a small label | Card KPI, Kind=Progress |
| O6 | **Batch workflow** | One bar per v1 step: Created, Receiving, Preparation, Prep finished, Analysis, Analysis finished, Completed, with counts. "Now" | Workflow bars |
| O7 | **Job orders by status** | Draft, Awaiting samples, In progress, Reported, Delivered (spec 9.3); Closed and Cancelled are left out. "Now" | Bar chart (horizontal) |
| O8 | **Sample type mix** | Ply, Composite, Roof and floor, Parting (categories open, R-07) | Donut, Legend item |
| O9 | **Samples received per day** | Bars per day for the period (per week when the period is longer than 31 days) | Bar chart |
| O10 | **Turnaround by company** | Mean days per company, bar coloured by its band; target line | Bar chart |
| O11 | **Active batches** | Filter tabs All, Due (within 7 days), Late. Columns: Batch, Company, Job order, Deadline, Progress (values saved or samples received, by step), Status. The row's deadline is coloured by the turnaround band. Rows open the batch page. 8 rows and pager. "Now" | Table card, Status badge, Progress bar, Pager |
| O12 | **Deadline alert** | Rule-based: "3 batches are due within 24 h. B-2026-0417 is still in preparation." with **Open batch**. No staffing advice (needs personnel data). Hidden when no batch is due within 24 h | Card callout, Tone=Alert |
| O13 | **This week** | A week strip (Mon–Sun, today marked, days with deadlines dotted), then the deadline items of the selected day | Calendar day, Deadline item |

Links: a KPI opens the batch list filtered to that set. Workflow bars and job order bars open their lists filtered by status.

## 6 · Quality & reports tab

```
[Batches completed] [RoA uploaded] [Drill holes with CoA] [Determinations]
[CV vs Ash            ] [RD vs Ash            ] [FC vs GCV            ]
[Trend CV   basis: ADB | AR | DB | DAF                                  ]
┌ Drill holes  All | Missing CoA   [Search drill hole]  ───────────────────┐
│ Code  Company  Samples  RoA  CoA  Actions                              │
└───────────────────────────────────────────────────────────────────────────┘
```

| # | Widget | Content | Library |
| --- | --- | --- | --- |
| Q1 | **Batches completed** | Completed in the period; "23 total" under it | Card KPI |
| Q2 | **RoA uploaded** | Signed RoAs uploaded in the period (Complete batch, D-49) | Card KPI |
| Q3 | **Drill holes with CoA** | "62 of 74" with a progress bar | Card KPI, Kind=Progress |
| Q4 | **Determinations** | Values saved in the period (one parameter of one sample = one determination), AssayNet | Card KPI, Kind=Delta |
| Q5 | **CV vs Ash, RD vs Ash, FC vs GCV** | Scatter per pair (ADB), regression line, R² and n in the card head; tooltip on a point: sample code, Sample ID, drill hole, the two values | Chart card, Scatter |
| Q6 | **Trend CV** | CV per batch completed date, basis switch ADB, AR, DB, DAF in the card head | Chart card (Header=With basis switch), Trend |
| Q7 | **Drill holes** | Filter tabs All and Missing CoA, search. Columns: Code, Company, Samples, RoA (downloads of the RoAs that hold its samples), CoA (file name and date, or "Missing" tag), Actions (Upload CoA for Lab admin and Superadmin). Pager, 10 rows | Table card, Tag, Button sm, Pager |

Data rules (spec S-01): regression is computed on the server; values are never rounded below their stored precision; the scatter uses only Completed batches.

## 7 · Tablet (834) and phone (390)

| Part | Tablet | Phone |
| --- | --- | --- |
| Header | Title and filters on one row; tab switch below | Title; full-width tab switch, sticky; Filters button opens a bottom sheet |
| Your queues | One row, scrolls sideways | One row of chips, scrolls sideways |
| KPIs | 2 × 2 | 2 × 2 |
| Operations charts | Workflow and Job orders side by side; Sample mix and Samples per day side by side; Turnaround full width | All stacked, full width |
| Deadline alert and week | Above Active batches, full width | Alert first, then the week strip scrolling sideways |
| Active batches | Table without Job order and Company | Cards: batch number, company, deadline, progress bar, status badge |
| Quality charts | Two per row, the third full width; Trend full width | Stacked; Trend scrolls sideways |
| Drill holes | Table without Company | Cards with the RoA and CoA actions |

## 8 · Frames

Module **02 Dashboard**, names by `../Design System/Frame_Naming.md`. Canvas row **I  Dashboard** below row H. Every frame uses the role's sidebar from the Navigation plan; Dashboard is active.

| SS | Screen | VV | Variant | Sizes | Persona |
| --- | --- | --- | --- | --- | --- |
| 01 | Operations | 01 | Lab_admin | D, T, P | Maya Lestari |
| 01 | Operations | 02 | Supervisor | D | Hendra Wijaya: no queues strip; sidebar without My work |
| 01 | Operations | 03 | CSO | D, P | Rina Kartika: no tab switch |
| 01 | Operations | 04 | Sidebar_collapsed | D | Maya: the 88 px rail on desktop |
| 01 | Operations | 05 | Sidebar_open | T | Maya: expanded sidebar over the content with a scrim |
| 01 | Operations | 06 | No_data | D | Maya: a period with no batches; each card shows Empty state Size=Card |
| 01 | Operations | 07 | Filters | P | Maya: filter bottom sheet |
| 02 | Quality_and_reports | 01 | Default | D, T, P | Maya |
| 02 | Quality_and_reports | 02 | Missing_CoA | D | Maya: Missing CoA tab selected |
| 02 | Quality_and_reports | 03 | Point_tooltip | D | Maya: tooltip on a CV vs Ash point |

Total **15 frames** (8 desktop, 3 tablet, 4 phone), for example `Desktop-02-Dashboard-01-Operations-01-Lab_admin`.

## 9 · Expandable sidebar

The sidebar is already built in the library as **Sidebar** (Collapsed=No 248 px, Collapsed=Yes 88 px) with **Nav item** (State × Collapsed, Count pill), and every built screen uses it. Which items show for each role is set by `../Navigation/Navigation_Screen_Plan.md`.

| Breakpoint | Default | Behaviour |
| --- | --- | --- |
| Desktop ≥ 1200 | Expanded | The toggle pushes the content, so charts and tables resize. The choice is remembered per user (Profile, S-13) |
| Tablet 768–1199 | Collapsed rail | Expanding opens the sidebar over the content with a scrim. It closes when an item is chosen or the scrim is tapped. The content does not reflow |
| Phone < 768 | Hidden | The menu button in the top bar opens the drawer |

- Toggle icons: `caret-double-left` (Collapse) and `caret-double-right` (Expand).
- The toggle has `aria-expanded`; items keep their accessible names when collapsed, with labels as tooltips; focus stays on the toggle.
- Width transition about 200 ms; none when the user prefers reduced motion.

## 10 · Data each widget needs (v1 data model)

| Widget | Source | In v1 |
| --- | --- | --- |
| Batches, Due this week, Workflow, Active batches, Deadline alert, This week | Batch status, step stamps and deadline | Yes |
| Samples received, per day | Sample receipt (Confirm reception) date | Yes |
| Mean turnaround, Turnaround by company, bands | Confirm reception and Completed stamps; service turnaround as the target | Yes; the target per service needs confirming with the lab |
| Job orders by status | Derived job order status (spec 9.3) | Yes |
| Your queues | The My work queue counts (S-19) | Yes |
| Sample type mix | Ply or composite, and lithology (roof, floor, parting) | Yes, categories open (R-07) |
| RoA uploaded, Drill holes with CoA | Batch documents (D-49); drill-hole CoA uploads | Yes |
| Determinations, quality charts, trend | Saved final values per sample and parameter (D-47); basis conversion formulas | Yes |
| Awaiting review, recheck flags | Review step | **Next goal**: no widget in v1 |
| Client view, My batches | Client portal | **Parked** (D-35) |

## 11 · Design rules that apply

- Card anatomy: every card padded 16; Card head 32 px fixed (title, actions, short texts such as R²); content in Card content; Table cards padded 16 (`../Design System/Component_Library_Plan.md`).
- No values joined with " · ". No count subtitles under titles.
- Chart colours come from the tokens and Legend item colours. Status colours only for statuses and turnaround bands.
- Numbers: Data style for values, thousands separator ",", decimals per the parameter's stored precision.

## 12 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Sample type categories (R-07) | Ply, Composite, Roof and floor, Parting |
| 2 | Drill-hole list: all master drill holes, or only those with samples in the period? | Only those with samples in the period, so it obeys the filters |
| 3 | Turnaround target per service | Basic 5 days, Full 10 days until the lab gives its own |
| 4 | Your queues strip on the dashboard repeats My work | Keep it as a one-line strip (S-01); it hides when every count is 0 |

## 13 · Build steps (after go)

1. The role sidebar helper and the retrofit of built frames (Navigation plan, section 6).
2. `library/screens/rowI.js` builds the 15 frames from library instances. The chart data is fixed demo data from the batch list and job order list records.
3. `naming.js` gets the `02 Dashboard` rules; `cards.js` and `fit.js` run as usual.
4. Deploy to the open file (dirty check, backup, swap), commit. No export unless asked.
5. Docs: this plan gets its build status; spec F-DSH-03 is marked parked; the README is updated.

## 14 · Build status (Nov 5, 2026)

All 15 frames are built on row **I  Dashboard** with `library/screens/rowI.js`, from library instances (Card KPI, Card callout, Calendar day, Deadline item, Legend item, Donut, Scatter, Trend, Status badge, Tag, Filter chip, Pager, Select, Search, Empty state, Tooltip, Bottom sheet, Segmented item).

Deviations from the plan:

- **Charts** are demo drawings: the three scatter cards share one Scatter drawing, and the bars for Batch workflow, Job orders by status, Samples per day and Turnaround are built from frames with token fills. The library Workflow bars and Bar chart components were not used because they have five fixed bars and no editable labels.
- **Batch workflow** shows the seven v1 steps; the library Workflow bars has five.
- **Mean turnaround** has no delta pill. The library Delta has no "down is good" colour.
- **Sidebar_open** (tablet) is drawn as a drawer over a long frame: the scrim and the sidebar cover the first viewport height, and the page below is not dimmed in a viewport crop.
- **Active batches** shows 8 rows with the pager; the Progress column is plain text ("26 / 36") instead of the Progress bar component.
- **Phone** Active batches and Drill holes show four cards each.

## 15 · Owner edits in the file (Nov 5, 2026) · BUILT

The owner edited the desktop frames of row I in FigCraft (saved 14:26, fixes at 14:52). These edits are the design from now on. They were found by comparing the saved file with the last generated file, layer by layer (layout, sizing, components, tokens), and checked against renders. They are now in `library/screens/rowI.js`, carried to tablet and phone, rebuilt and swapped into the main file (backup `backup/SGSI-LIMS-screens.before-owner-edits-port.figcraft`).

### 15.1 What changed

| # | Where | Before | Now |
| --- | --- | --- | --- |
| D-1 | Page tabs, every frame with tabs, all sizes | **Segmented item** pair | A **Tabs** frame (horizontal, gap 16, fill width, items at the bottom) of two library **Tab** instances, Selected On/Off, count hidden: **Operations** and **Quality & reports**. Same pattern as the job order and batch pages. The Segmented item stays for the metric switch inside the Trend CV card |
| D-2 | Bar charts: Batch workflow, Job orders by status, Turnaround by company | Bar row = Label (120) + Bar (width = value) + Value right after the bar | Bar row = Label (120 fixed) + **Bar container** (fills, height 14, clips, no fill) holding the **Bar** at its value width + **Value** (hug). The values line up in one column at the right edge of the card |
| D-3 | Samples received per day | Column = Bar + Day | Column = **Bar container** (fixed width, 92 high on desktop) with the Bar standing on its bottom, then Day |
| D-4 | Sample type mix | Donut with the legend wrapped below it | Desktop and tablet: **Mix** is horizontal, Donut 200 on the left, **Legend** a vertical list (gap 10) on the right. Phone keeps the legend below the donut |
| D-5 | Chart rows, desktop | Three equal cards (365) at 340; Samples per day 2/3 and Turnaround 1/3 at 240 | Row 1 **282**: Batch workflow and Job orders by status **fill**, Sample type mix **365**. Row 2 **192**: Samples received per day **fills**, Turnaround by company **365**. The same rule fits the 1128 and the 1288 (Sidebar_collapsed) content widths |
| D-6 | Active batches row, desktop | Row hug; table card 800, Right rail 308 | Row **fixed 594**; table card fills; **Right rail 365**, filling the row's height; Deadline alert and **This week** fill the rail's width, This week also its height, so the rail ends level with the table |
| D-7 | Active batches, Company column | One line, clipped at the column edge | The company name **fills the column and wraps** to two lines ("PT Bara Nusantara / Mandiri") |
| D-8 | No_data | Rows 340 and 240 | Empty-state cards hug (both chart rows the same height); the rail is 365 |
| D-9 | Tablet | Row 1 at 300, row 2 at 340 | Both chart rows **282**; Sample type mix with the legend on the right |

Supervisor and CSO were already built with the same function as Lab_admin; in the owner's file their chart rows were replaced by copies of the Lab_admin rows, which only gave the layers new ids. The three Operations frames match, as before.

### 15.2 Points found in the check, and how they were settled

1. **Company column overlap** (Lab_admin, Supervisor, CSO): fixed by the owner (14:52): the name wraps (D-7).
2. **Sidebar_collapsed chart rows** left 161 px empty: fixed by the owner (14:52) with filling bar cards; the generator uses that rule on every desktop frame (D-5).
3. **No_data tab** showed Quality & reports selected: the rebuilt frame selects **Operations**.
4. **Bar container fill**: the owner's containers had a hard-coded #FFFFFF; the generator draws them without a fill, so dark mode works.
5. **Tab label** "Operation" was a typo: the label is **Operations** (owner, Nov 5).

Not changed: the tablet's Your queues strip clips "Open My work" at the right edge, as before this revision.
