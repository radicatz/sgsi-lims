# Dashboard — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 2.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Dashboard_v2_Screen_Plan.md`.

## 1 · Frames

Module 02, 15 frames. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Operations | Lab_admin (D T P), Supervisor (D), CSO (D P), Sidebar_collapsed (D), Sidebar_open (T), No_data (D), Filters (P) |
| 02 Quality_and_reports | Default (D T P), Missing_CoA (D), Point_tooltip (D) |

## 2 · Screens and what they do

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Header | `#/` | **Period** (Last 30 days) and **Company** selects change every card. Tabs **Operations** and **Quality & reports** appear only for roles with `dashboard.quality`; the CSO, Preparation and Analyst see Operations with no tabs. Phone: **Filters** opens a bottom sheet with **Apply** and **Clear all** |
| Operations | `#/` | O1 Your queues with **Open My work** (roles with My work only). O2 to O5 KPI cards. O6 Batch workflow. O7 Job orders by status. O8 Sample type mix. O9 Samples received per day. O10 Turnaround by company. O11 Active batches with Filter chips **All / Due / Late** and their counts, rows that open the batch page, and the Pager. O12 Deadline alert with **Open batch**. O13 This week, where clicking a day shows its deadlines. The No data empty state shows for a period with no batches |
| Quality & reports | `#/?tab=quality` | Q1 to Q4 KPI cards. Q5 scatter cards (CV vs Ash, RD vs Ash, FC vs GCV) with point tooltips ("BNM-3507, Ash 11.8%, CV 5,420"). Q6 Trend CV with the basis switch **ADB / AR / DB / DAF**. Q7 Drill holes table with chips **All / Missing CoA**, Search, Pager, and **Upload CoA** or **Replace CoA** (Lab admin, Superadmin) |

## 3 · Charts

Hand-drawn SVG (shared plan, section 2), one component per chart shell of the library: Workflow bars, horizontal Bar chart, Donut with Legend items, day Bar chart with today highlighted, Scatter with regression line, R² and n in the card head, and Trend with a limit line. The values are computed from the demo batches and results, so they follow the Period and Company filters. Hover shows the tooltip from the Point_tooltip frame.

## 4 · Links to other groups

| From | To |
| --- | --- |
| Your queues, **Open My work** | My work (My work plan) |
| Active batches row, Deadline alert **Open batch**, This week item | Batch page on the tab for its status (Batch plan) |
| Drill holes **Upload CoA**, **Replace CoA** | Drill hole CoA upload dialog (Master data plan) |

## 5 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| DB1 | Operations by role | Lab admin, Supervisor, CSO | Dashboard → Period → Due chip → batch row; Deadline alert → **Open batch**; as CSO: no tabs |
| DB2 | Quality & reports | Lab admin | Tab → scatter point tooltip → Trend basis AR → Missing CoA → **Upload CoA** |

## 6 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Charts drawn in SVG like the frames, or real ECharts? | SVG |
| 2 | The Active batches Filter chips: keep as drawn, or page Tabs (shared plan, D7)? | As drawn |
