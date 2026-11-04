# Dashboard Screen — Design Plan

Oct 19, 2026 · screen 9 of the v1 list in `../Project/Coal_LIMS_Research_and_Project_Plan.md`

## Goal

Design the v1 Dashboard in `screens.pen` as three new frames: desktop (1440), tablet (834, portrait) and mobile (390). It should match SIM Lab's "Dashboard Quality" page one for one: the same data, sections and actions. It uses our design system, not SIM Lab's look. Anything SIM Lab doesn't show stays off the screen, with two additions: the company filter, which the project plan adds ("filters by company"), and a basis toggle on the trend chart.

The app must work on tablets and phones (project plan, Responsive, tablet and mobile), so the tablet and mobile frames are part of this screen, not a later step.

## Reference: SIM Lab "Halaman Dashboard Quality"

Source: proposal PDF, page 17 ("Contoh Halaman"). Top to bottom, the page shows:

| # | SIM Lab section | Content |
| --- | --- | --- |
| 1 | Header | Title "Overview", SUCOFINDO logo, notification bell with an unread count |
| 2 | Batch Statistic | Date range selector, default "30 Hari Terakhir" (last 30 days). Three cards: Batch In Progress (6), Batch Completed (1), Total Batch (8) |
| 3 | Grafik Bivariate | Three scatter plots, each with a regression line, its equation and r²: CV (ADB) vs Ash (ADB), x = CV, r² 0.9635. RD (ADB) vs Ash (ADB), x = RD, r² 0.8917. FC (ADB) vs GCV (ADB), x = FC, r² 0.9260 |
| 4 | Trend CV (arb) | Full-width scatter: x = sample sequence (0–1,130), y = CV arb (0–7,500 kcal/kg) |
| 5 | List Drill Hole | Total count (74). Columns: Code (sortable), Total Sample (sortable), ROA (PDF / XLSX / CSV download icons, sortable), COA ("No COA" or a file) |
| — | Sidebar | Dashboard, Manajemen User, Manajemen Perusahaan, Master Data Sample (Drill Hole, Lithology, Seam), Batch, Input ROA, Review ROA; user chip (name and role) at the bottom |

The page scrolls. The drill-hole list sits below the trend chart and is longer than one screen.

## Mapping to our design

| SIM Lab | Our screen | Design-system parts |
| --- | --- | --- |
| Red sidebar | Navigation rail with the same 9 entries; Master Data shown as a group | `Rail/Active`, `Rail/Default`, Phosphor icons from the plan's Iconography table |
| Header with logo and bell | `Top Bar` instance: brand, search, notifications, user chip | `Top Bar`, `User Chip`, `Avatar` |
| Title "Overview" | Page header: "Dashboard", subtitle, then filters for date range (default last 30 days) and company | `Input/Date`, `Input/Select` |
| 3 batch cards | KPI row: Batches in progress, Batches completed, Total batches, each with a small "vs previous period" delta | `Card/KPI`, `Badge/Delta` |
| Grafik Bivariate | Three chart panels in one row. Each has a title, axis labels, about 150 points, the regression line, and the equation and r² in a chip | `Card/Panel`, chart tokens `chart-1…3` |
| Trend CV (arb) | Full-width panel with a segmented basis toggle: arb (default), ADB, DB, DAF | `Card/Panel`, `Segmented Control` |
| List Drill Hole | Table panel: count in the header, search, sortable Code / Total samples, RoA download chips (PDF, XLSX, CSV), CoA status badge with an upload action for Admin, pagination at 10 rows | `Table/Header Row`, `Table/Row`, `Badge/Status`, `IconButton/Ghost`, `Input/Search` |

### Layout (desktop 1440 px)

```
┌ Rail ┬ Top Bar ───────────────────────────────────────────────┐
│      │ Dashboard                     [Last 30 days ▾] [Company ▾]│
│      │ ┌ In progress ┐ ┌ Completed ┐ ┌ Total batches ┐           │
│      │ ┌ CV vs Ash ──┐ ┌ RD vs Ash ┐ ┌ FC vs GCV ────┐ bivariate │
│      │ ┌ Trend CV (arb) ─────────────────────────────┐ full width│
│      │ ┌ Drill holes (74) [search] ──────────────────┐           │
│      │ │ Code │ Total samples │ RoA PDF XLSX CSV │ CoA │ rows… │
│      │ └ pagination ─────────────────────────────────┘           │
└──────┴───────────────────────────────────────────────────────┘
```

The frame is 1440 wide and as tall as the content needs, about 1,900 px. It shows the whole page, not one viewport.

### Layout (tablet 834 px, portrait)

```
┌Rail┬ Top Bar: Coal LIMS      [search]  [🔔] [avatar] ┐
│ ▣  │ Dashboard            [Last 30 days ▾] [Company ▾]│
│ ▣  │ ┌ In progress ┐ ┌ Completed ┐ ┌ Total batches ┐  │
│ ▣  │ ┌ CV vs Ash ────────┐ ┌ RD vs Ash ────────┐       │
│ ▣  │ ┌ FC vs GCV ─────────────────────────────┐ full   │
│ ▣  │ ┌ Trend CV [arb|ADB|DB|DAF] ─────────────┐ full   │
│    │ ┌ Drill holes (74) [search] ─────────────┐        │
│    │ │ Code │ Samples │ RoA PDF XLSX CSV │ CoA │ ⋮    │
│    │ └ ‹ 1 2 3 … 8 › ─────────────────────────┘        │
└────┴──────────────────────────────────────────────────┘
```

| Part | Tablet behaviour |
| --- | --- |
| Navigation | Collapsed icon rail, 64 px wide, icons only; Master Data opens as a flyout with Drill hole, Lithology, Seam |
| Top bar | Same as desktop: brand, search, notifications, user chip (avatar only) |
| Filters | Inline in the page header, as on desktop |
| KPI cards | One row of three, with smaller values and the delta badge kept |
| Bivariate charts | CV vs Ash and RD vs Ash side by side; FC vs GCV full width below, so no chart is narrower than about 360 px |
| Trend chart | Full width with the basis toggle in the panel header; all points fit, no sideways scroll |
| Drill-hole list | Table kept: Code, Total samples, RoA download chips, CoA badge; CoA upload moves to an overflow menu per row; pagination at 10 rows |
| Touch | Every button and download chip at least 44 × 44 px |

The tablet frame is 834 wide and as tall as the content, roughly 2,300 px. Landscape (1112–1194 px) uses the same layout with the three bivariate charts in one row; it is not drawn as a separate frame.

### Layout (mobile 390 px)

```
┌ Top bar: [≡] Coal LIMS          [🔔] [avatar] ┐
│ Dashboard                                     │
│ [Last 30 days ▾] [Company ▾]   (chips → sheet) │
│ ┌ In progress ┐ ┌ Completed ┐                 │
│ ┌ Total batches ───────────┐                  │
│ ┌ CV vs Ash ───────────────┐  one per row     │
│ ┌ RD vs Ash ───────────────┐                  │
│ ┌ FC vs GCV ───────────────┐                  │
│ ┌ Trend CV [arb|ADB|DB|DAF]┐  plot scrolls →  │
│ ┌ Drill holes (74) [search]┐                  │
│ │ card: code · samples     │                  │
│ │       PDF XLSX CSV · CoA │                  │
│ └ ‹ 1 2 3 … 8 › ───────────┘                  │
└───────────────────────────────────────────────┘
```

| Part | Mobile behaviour |
| --- | --- |
| Navigation | Rail hidden; the menu button opens a full-height drawer with all 9 entries, the Master Data group and the user chip |
| Top bar | Menu, product name, notifications, avatar; search moves into the drawer |
| Filters | Two compact chips; tapping one opens a bottom sheet. Draw one sheet state as a small separate frame |
| KPI cards | Two up, then the third full width |
| Bivariate charts | Stacked, full width, about 240 px tall; equation and r² chip above the plot so it never covers points |
| Trend chart | Full width with the basis toggle above; the plot scrolls sideways inside the card, and the y-axis stays fixed |
| Drill-hole list | Card per drill hole: code and sample count on the first line, RoA download buttons and the CoA badge on the second; CoA upload in an overflow menu for Admin; same pagination |
| Touch | Every button and download chip at least 44 × 44 px |

The mobile frame is 390 wide and as tall as the content, roughly 2,600 px.

### Content and sample data

- Use realistic coal values taken from SIM Lab's charts: CV ADB 0–7,000, Ash ADB 0–80, RD 1.25–1.95, FC 0–55, GCV 0–6,500.
- Generate the scatter points so each regression matches SIM Lab's sign and r² roughly. CV vs Ash goes down; the other two go up.
- Drill-hole codes follow SIM Lab's style: `BTBB_035-R2`, `BT_020`, `BTU_045`. Show 8 rows with a mix of "No CoA" and "CoA uploaded".
- Labels are in English, with the Indonesian SIM Lab term kept only where users know it (RoA, CoA).

### Roles shown

Design the Superadmin/Admin view. For Client, the company filter is locked to their own company and the CoA upload action is hidden. A note on the frame records this rather than a second frame.

## Build approach in pen.dev

1. Reuse components (rail, top bar, cards, table, badges, inputs). No new styles outside the existing tokens. Add reusable parts that later screens need too: a collapsed rail for tablet, a mobile top bar, and a drill-hole card for mobile.
2. Draw scatter plots as `layout: "none"` plot frames. Points are small ellipses placed by a script loop, the regression line is a `path`, and axes and gridlines are thin rectangles with tick labels on flex rows.
3. Build the desktop frame section by section, checking each one with a screenshot, then the tablet frame, then the mobile frame.
4. Keep `placeholder: true` on each frame until it is finished.

## Where the frames go

The `.pen` format has no Figma-style pages, so screens live in their own region of the same canvas (decision: option A). The region is a column to the right of Foundations and Components, headed "v1 Screens". Each screen gets one row: desktop frame, then tablet, then mobile, left to right. Later screens add rows below.

## Decisions (Oct 19, 2026)

1. **Existing `Dashboard` frame (`jsStD`):** kept and renamed "Dashboard — concept". It stays where it is, as an exploration outside v1 parity.
2. **Basis toggle on the trend chart:** added (arb default; ADB, DB, DAF).
3. **Placement:** option A, a "v1 Screens" region on the same canvas.
4. **Drill-hole list:** paginated at 10 rows.
5. **Mobile:** the dashboard gets a 390 px frame designed alongside the desktop one.
6. **Tablet:** the dashboard also gets an 834 px portrait frame; landscape is checked on the device, not drawn.

## Done when

- Every SIM Lab section in the reference table has a matching part on all three frames.
- Only design-system components and tokens are used, and all icons are Phosphor.
- Nothing is clipped or collapsed in the screenshot check, and text contrast passes on cards and chips.
- Tablet and mobile: no horizontal page scroll, touch targets at least 44 px, charts readable at 834 px and 390 px.
- The frames are named `Dashboard · Desktop`, `Dashboard · Tablet` and `Dashboard · Mobile`, sit in the "v1 Screens" region, and have `placeholder` removed.
