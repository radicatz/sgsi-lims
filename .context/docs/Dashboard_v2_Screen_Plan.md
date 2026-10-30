# Dashboard v2 — Design Plan

Oct 19, 2026 · merges `Dashboard · Desktop/Tablet/Mobile` (v1, SIM Lab parity) with `Dashboard — concept` in `screens.pen`

"v2" here means version 2 of the dashboard screen, not release v2 of the product (shipment, CoA, QA/QC). Everything below runs on v1 data. It ships right after v1 go-live; v1 goes live with the parity dashboard.

v2 also introduces the **expandable sidebar**, which replaces the icon-only rail on every screen from then on (see Expandable sidebar).

## Goal

One dashboard that serves two jobs:

- **Lab operations:** what is in the lab, what is due, and what is stuck. This comes from the concept.
- **Quality and reports:** what the coal looks like and where the reports are. This comes from v1, i.e. SIM Lab parity.

Everything SIM Lab shows stays, so parity is not lost. The concept's widgets are added where v1 data can feed them, and duplicates are merged.

## What each source has

| Widget | v1 (SIM Lab parity) | Concept |
| --- | --- | --- |
| Batch counts | In progress 6, Completed 1, Total 8 | Header stats: In progress 17, Due this week 9, RoA issued 30 d 46 |
| Work KPIs | — | Samples received 1,284 (+12%) · Awaiting review 42 (42 of 70) · Recheck flags 7 (3 batches, lab codes) · Mean turnaround 4d 6h (On target) |
| Status breakdown | — | Batch workflow: Created 6, Preparation 11, Analysis 17, Finished 8, Completed 4 |
| Intake | — | Sample type mix donut (Ply, Composite, Roof/floor, Parting) · Samples received per day this week |
| Batch list | — | Active batches table with All / Mine / Due / Late filters, progress, status, RoA ("Mine" is dropped in v2) |
| Deadlines | — | Week calendar with batches due · Deadline alert callout |
| Quality charts | CV vs Ash, RD vs Ash, FC vs GCV with regression; Trend CV with basis toggle | — |
| Drill holes | Full list: code, samples, RoA downloads, CoA status, pagination | Short "Drill holes · CoA" list with Missing badge |
| Filters | Period, Company | — (date in header only) |

## Merge rules

1. **Batch numbers appear once.** v1's three cards and the concept's header stats fold into one **Batches** KPI: in progress as the main number, with completed and total underneath. The concept's Batch workflow panel gives the per-status breakdown.
2. **One drill-hole list.** The concept's short CoA list is dropped. The v1 table gains a "Missing CoA" filter chip, which covers the same need.
3. **Every widget obeys the Period and Company filters.** The concept had no filters; in v2 they sit in the page header and apply to every widget on both tabs.
4. **No widget needs data v1 doesn't store.** The two concept features that would have needed new data are changed: the "Mine" filter is dropped, and the deadline alert is rule-based only.

## Structure: two tabs

The page header holds the title, a tab switch (**Operations | Quality & reports**) and the shared filters. Each tab fits roughly one desktop screen instead of one very long page.

| Tab | Sections, top to bottom | Source |
| --- | --- | --- |
| **Operations** (Admin default) | KPI strip: Batches, Due this week, Awaiting review (with recheck flags), Mean turnaround | Merged |
| | Row: Batch workflow · Sample type mix · Samples received per day | Concept |
| | Active batches table (All / Due / Late), with a right rail: deadlines week strip, rule-based deadline alert | Concept |
| **Quality & reports** (Client default) | KPI strip: Batches (in progress / completed / total), RoA issued, drill holes with CoA | v1 + concept |
| | Bivariate charts: CV vs Ash, RD vs Ash, FC vs GCV | v1 |
| | Trend CV with basis toggle | v1 |
| | Drill-hole list with "Missing CoA" filter, RoA downloads, CoA upload (Admin) | v1 |

### Client view

Clients see only **Quality & reports**, with no tab switch, limited to their own company: the Company filter is locked to it and CoA upload is hidden. Above the KPI strip sits a small **My batches** list: batch no., deadline, progress and status for their open batches. It is read-only and has no workload or deadline data from other companies.

### Deadline alert

The alert is rule-based only: "3 batches due within 24 h; B-2026-0417 is still in preparation", plus an "Open batch" button. It makes no staffing suggestion, because that needs personnel data (release v4).

### Desktop layout (1440, sidebar expanded)

```
┌ Sidebar 248 ──┬ Top Bar ─────────────────────────────────────────────────┐
│ ▣ Dashboard   │ Dashboard  [Operations | Quality & reports] [30 days][Co.]│
│ ◻ Users       │ ── Operations ─────────────────────────────────────────── │
│ ◻ Companies   │ [Batches] [Due this week] [Awaiting review] [Turnaround]  │
│ MASTER DATA ▾ │ [Batch workflow] [Sample type mix] [Samples/day]│Deadlines│
│ ◻ Drill hole  │ [Active batches table ─────────────────────]    │ Alert   │
│ ◻ Lithology   │ ── Quality & reports ──────────────────────────────────── │
│ ◻ Seam        │ [Batches] [RoA issued] [CoA coverage]                     │
│ WORKFLOW      │ [CV vs Ash] [RD vs Ash] [FC vs GCV]                       │
│ ◻ Batch       │ [Trend CV (arb) · arb|ADB|DB|DAF ]                        │
│ ◻ Input ROA   │ [List drill hole · All | Missing CoA · search · pages ]   │
│ ◻ Review ROA  │                                                           │
│ « Collapse    │                                                           │
└───────────────┴───────────────────────────────────────────────────────────┘
```

## Expandable sidebar

From dashboard v2 on, the icon-only rail becomes a sidebar the user can expand and collapse. It applies to every screen, not only the dashboard.

| State | Width | Content |
| --- | --- | --- |
| Expanded | 248 px | Icon and label per item. Group labels MASTER DATA (Drill hole, Lithology, Seam) and WORKFLOW (Batch, Input ROA, Review ROA), with Dashboard, Users and Companies above them. The Master Data group folds with a caret. The active item is filled `primary-deep`. A "Collapse" button sits at the bottom |
| Collapsed | 88 px desktop, 64 px tablet | Icons only, as the v1 rail, with dividers between groups. Labels show as tooltips on hover and focus. An "Expand" button sits at the bottom |

| Breakpoint | Default | Behaviour |
| --- | --- | --- |
| Desktop ≥ 1200 | Expanded | The toggle pushes the content: main width changes and charts and tables resize. The user's choice is remembered per user |
| Tablet 768–1199 | Collapsed | Expanding opens the sidebar over the content with a scrim. It closes when an item is chosen or the scrim is tapped, and the content does not reflow |
| Mobile < 768 | Hidden | Unchanged: the menu button opens the drawer (the v1 `Dashboard · Mobile · Menu` frame), which already has the expanded layout |

Details:

- **Toggle icons:** `caret-double-left` (collapse) and `caret-double-right` (expand), both Phosphor.
- **Accessibility:** the toggle has `aria-expanded`, items keep their accessible names when collapsed, and focus stays on the toggle after it switches.
- **Sizes:** item height 44 px; the expanded item uses the same layout as the mobile drawer rows, so desktop, tablet and phone share one pattern.
- **Animation:** width transition about 200 ms; none when the user prefers reduced motion.

### Tablet (834) and mobile (390)

| Part | Tablet | Mobile |
| --- | --- | --- |
| Tab switch | Segmented control in the page header | Full-width segmented control under the title, sticky when scrolling |
| KPI strip | 2 × 2 grid | 2 × 2 grid |
| Ops panels row | Workflow and Sample mix side by side; Samples/day full width | All stacked |
| Right rail (deadlines, alert) | Moves above the Active batches table, full width | Alert first (most urgent), then a horizontally scrolling week strip |
| Active batches | Table without the Batch date column | Cards: batch no., company, deadline, progress bar, status |
| Quality tab | As in the v1 tablet frame | As in the v1 mobile frame |

The filter sheet and drawer patterns are reused from the v1 frames. For navigation, see Expandable sidebar below.

## Data each widget needs (v1 data model)

| Widget | Source in the data model | In v1? |
| --- | --- | --- |
| Batches, Batch workflow, Due this week | Batch status and deadline | Yes |
| Awaiting review | Analysis state = submitted | Yes |
| Recheck flags | Recheck flag per sample in Review ROA | Yes |
| Mean turnaround | Batch created → completed timestamps | Yes |
| Samples received / day | Sample receipt date | Yes |
| Sample type mix | Interval ply/composite plus lithology (roof, floor, parting) | Yes, but the categories need confirming with the lab |
| Active batches "Mine" filter | Batch assignee | **Dropped**: v1 has no assignee field |
| Deadline alert | Batch deadline and status | Yes (rule-based; the staffing suggestion is dropped until personnel data exists in release v4) |
| My batches (client) | Batch status, deadline, progress for the client's company | Yes |
| RoA issued, CoA coverage | Report records, CoA uploads | Yes |
| Quality charts, drill-hole list | Results, drill hole, reports | Yes |

## Build approach in pen.dev

1. Add a "Dashboard v2" row to the "v1 Screens" region, below the existing dashboard rows, and rename the region to "Screens".
2. Desktop, tablet and mobile each get two frames, one per tab: `Dashboard v2 · Operations · Desktop` and so on, six frames in total. Desktop frames use the expanded sidebar; tablet frames use the collapsed one.
3. Reuse rather than redraw:
   - The Quality tab copies the v1 frames and adds the tab switch and the new KPI strip.
   - The Operations tab copies the concept's panels: workflow, sample mix, samples per day, active batches, deadlines and alert.
4. The source frames stay untouched. `Dashboard — concept` and the v1 frames remain as references.
5. New reusable components:
   - `Sidebar/Expanded`, `Sidebar/Collapsed` and `Nav Item` (default, hover, active, collapsed) as the sidebar set.
   - Tab switch, active-batch card (mobile), deadline item, and the My batches row.
6. Extra frames:
   - `Dashboard v2 · Quality · Client · Desktop`: the client view.
   - `Dashboard v2 · Operations · Desktop · Sidebar collapsed`: the desktop collapsed state.
   - `Dashboard v2 · Tablet · Sidebar open`: the overlay state.

## Decisions (Oct 19, 2026)

1. **When it ships:** right after v1 go-live. v1 goes live with the parity dashboard.
2. **Layout:** two tabs, Operations and Quality & reports.
3. **Client view:** Quality & reports only, plus a My batches list.
4. **Deadline alert:** rule-based only; no staffing suggestion until personnel data exists.
5. **"Mine" filter:** dropped.
6. **Sidebar:** expandable on desktop and tablet, introduced with dashboard v2 and applied to all screens.

## Build status (Oct 19, 2026)

All frames are built in the "v1 Screens" region of `screens.pen`, in three new rows below the v1 frames:

- **Desktop:** Operations, Quality & reports, Operations with the sidebar collapsed, and the client view of Quality & reports.
- **Tablet:** Operations, Quality & reports, and Operations with the sidebar open as an overlay (drawn at a 1112 px viewport height).
- **Mobile:** Operations and Quality & reports; the menu drawer and filter sheet are the v1 frames.
- **New components:** `Sidebar/Expanded`, `Sidebar/Collapsed`, `Nav Item/Default`, `Nav Item/Active`, `Nav Group Label`, `Card/Batch`.

Differences from the plan above:

- Desktop Operations shows the Active batches table without the Batch date column, and the right rail is 280 px, so the table fits next to it.
- The tablet Operations tab places the deadline alert and week strip above the Active batches table instead of in a right rail.
- Tablet page headers put the tab switch on its own row under the title.
- The Awaiting review KPI reads 28 awaiting (42 of 70 reviewed, 7 recheck flags), so its numbers add up.

## Done when

- Every v1 widget and every concept widget is either on a v2 frame or listed above as dropped or merged, with the reason.
- All frames use only design-system components and tokens and Phosphor icons, and pass the same checks as v1: no clipping, 44 px touch targets on tablet and mobile, no horizontal page scroll.
- The sidebar is drawn expanded and collapsed on desktop, and collapsed and open on tablet, and both states keep the content readable.
