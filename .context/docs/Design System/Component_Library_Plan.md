# Component Library Plan (FigCraft rebuild)

Oct 30, 2026 · Revision 2 · design file: `.context/design/figcraft/SGSI-LIMS-screens.figcraft`

Written for: the product owner, and whoever builds the screens from this library.

## 0. Decisions taken (Oct 30, 2026)

| # | Decision |
| --- | --- |
| 1 | The old 113 components are **deleted** once the new library exists. The backup file `figcraft/backup/SGSI-LIMS-screens.backup-before-reset.figcraft` keeps them. The component list comes from the 93 frames in `.context/design/export/` |
| 2 | Interactive components get **Type** = Primary, Secondary, Tertiary, Ghost (where a type applies) and **State** = Default, Hover, Pressed, Focused (active), Disabled, Loading (processing) |
| 3 | Build route: headless, from scripts (section 7) |
| 4 | The icon set is every glyph the exported frames use: 71 Phosphor icons (section 3.3) |
| 5 | Every file that still names Montserrat is updated to Noto Sans as phase 0 (section 8) |

## 1. Goal

Rebuild every component from scratch in FigCraft as a proper library, before any screen is drawn again:

- one **component set per component**, with variant properties, not separate components named `· v1 … · v17`;
- **text, boolean and instance-swap properties** for labels, optional icons and counts, so screens never detach an instance;
- every fill, stroke and shadow **bound to the SGSI tokens**, by role (`Action/action` for a button, not `Primary/primary`). Light and Dark come from the variable modes, so there are no "Dark" variants;
- **text styles** for the whole type scale: body in **Noto Sans**, headings in Newsreader, codes in JetBrains Mono;
- **auto layout** everywhere, so labels can change length and components stretch;
- bigger components built from smaller ones: a table row uses the Status badge, a button uses the Icon.

Your `Logo` component set (Type = Full / Icon × Color = Default / Secondary / White) is the pattern and stays as it is.

## 2. What is in the file now

113 components across six frames:

- many are duplicates, for example 17 `Status · v1–v17`, 4 Sidebars and 3 Top bars;
- each state is its own component;
- Side sheet, Dialog, Queue card, WIP row and Activity item are plain frames;
- there are no text styles, and only one effect style;
- the 269 icons are loose vectors;
- many fills are raw hex.

All of these get replaced.

## 3. Foundations (phase A)

### 3.1 Text styles

Taken from the Foundations type specimen.

| Style | Font | Size / line |
| --- | --- | --- |
| Display/XL | Newsreader Medium | 36 / 42 |
| Heading/H1 | Newsreader SemiBold | 28 / 34 |
| Heading/H2 | Newsreader SemiBold | 22 / 28 |
| Heading/H3 (card title) | Newsreader SemiBold | 18 / 24 |
| Lead | Newsreader Italic | 18 / 28 |
| Number/Display | Newsreader Medium | 30 / 34 |
| Body/Regular, Medium, SemiBold | Noto Sans | 14 / 22 |
| Body small/Regular, Medium, SemiBold | Noto Sans | 13 / 20 |
| Caption/Regular, Medium | Noto Sans | 12 / 16 |
| Label/Button md, sm | Noto Sans SemiBold | 14 / 20, 13 / 18 |
| Overline (uppercase, +1.5) | JetBrains Mono Medium | 11 / 16 |
| Data | JetBrains Mono Regular | 13 / 20 |
| Data/Strong | JetBrains Mono SemiBold | 13 / 20 |

### 3.2 Effect styles

- `Elevation/2xs`, `xs`, `md`, `lg`, `xl` and `2xl`, with the layers from `Design_Tokens.md`, bound to `Shadow/deep`, `mid` and `light`.
- `Focus ring`: a 3 px ring in `Primary/primary-200`, used by every Focused state.

### 3.3 Icons

- **`Icon`** is one component set with `Glyph` (the 71 names below) × `Size` = 14 (the size the screens use 3,889 times) and 20. Glyphs come from the official `@phosphor-icons/core` SVGs, Regular weight, not traced. The colour is bound to `Text/foreground` and overridden in instances.
- **The 71 glyphs, from the export:** plus, check, caret-down, caret-up, caret-left, caret-right, caret-double-left, caret-double-right, dots-three, dots-three-vertical, magnifying-glass, squares-four, upload-simple, download-simple, bell, file-pdf, file-xls, file-csv, file-text, file-x, arrows-down-up, check-circle, check-square-offset, stack, cylinder, buildings, package, flask, rows, users, clipboard-text, clock-counter-clockwise, clock, alarm, hourglass, gear-six, gear, printer, tray, calendar-blank, x, pencil-simple, pencil-simple-line, trash, warning, warning-circle, info, prohibit, lock-simple, arrow-up-right, arrow-right, arrow-counter-clockwise, arrows-counter-clockwise, arrow-u-up-left, floppy-disk, list, list-numbers, funnel, whatsapp-logo, envelope-simple, barcode, play, circle, certificate, link-simple, paper-plane-tilt, eye, copy, function, sparkle, trash-simple.
- **Two names are not Phosphor names.** `trash-2` (a Lucide name, used once) maps to `trash-simple`, and `sparkles` maps to `sparkle`.
- **Spinner** is a separate small component, used by the Loading state.

## 4. The interaction state model

Two property axes apply to every interactive component that can take them.

| Property | Values | Notes |
| --- | --- | --- |
| **Type** | Primary, Secondary, Tertiary, Ghost | Buttons and icon buttons; other components take only the types that make sense (section 5) |
| **State** | Default, Hover, Pressed, Focused, Disabled, Loading | Focused = keyboard focus or the active/open state (focus ring); Loading = processing: the label stays, a spinner replaces the leading icon and the button is not clickable |

**Button type mapping** from the old styles, for you to confirm (open point 1):

| Type | Look | Old style it replaces | Examples in the export |
| --- | --- | --- | --- |
| Primary | Navy fill, white text | Button/Primary | Save, Confirm, Add 11 rows, Create batch |
| Secondary | White fill, border, navy text | Button/Outline and Secondary | Add row, Paste from Excel, Import list, Cancel, Print labels |
| Tertiary | Soft tint fill (`primary-50`), navy text | Button/Secondary (soft) | Export RoA, Mark all arrived, Keep job order |
| Ghost | No fill, no border | Button/Ghost | View, Add a row…, Collapse, View all |

Two older styles have no place among the four types:

- **Destructive** (Cancel job order, Delete, Remove contact) becomes `Tone` = Default / Danger, a second property that recolours Primary and Ghost to `Feedback/error`.
- **Accent** amber (Open batch in the deadline card, Apply) becomes Primary with `Tone` = Accent.

**State coverage per component:**

| Component | States drawn |
| --- | --- |
| Button, Icon button | all six |
| Text field, Select, Date field, Textarea, Search | Default, Hover, Focused, Disabled + Filled and Error (fields need these) |
| Checkbox, Radio, Switch | Default, Hover, Focused, Disabled (Loading does not apply) |
| Chip (filter and segmented), Tab, Nav item, Menu item, Option row, Table row, Parameter pill | Default, Hover, Pressed, Focused, Disabled, plus Selected/Active where the component has it |
| Display components (badge, tag, card, cell) | no interaction states |

## 5. Component inventory

Grouped by the frame they live in. Every set gets a short usage note beside it. **New** marks the components added from the export review.

### 5.1 Actions

| Set | Properties |
| --- | --- |
| **Button** | Type × State × Size (md 40, sm 32, touch 44) × Tone (Default, Danger, Accent) · Label, Leading icon (bool + swap), Trailing icon (bool + swap), Count (bool, "Print labels (2)") |
| **Icon button** | Type × State × Size (28, 32, 36, 44) × Shape (Square, Circle) · Icon (swap), Dot (bool) |
| **Segmented control** (New as a set) | Item: State (Default, Hover, Selected, Disabled); bar: 2–5 items · "Operations / Quality & reports", "ADB / AR / DB / DAF", "WhatsApp / Email / Print / Other", "All / Due / Late" |
| **Link button** | State · Label, Leading icon ("+ Add a row…", "View all →", "Download template") |
| **Overflow menu button** | the "⋯" with its Menu (New) |

### 5.2 Status and labels

| Set | Properties |
| --- | --- |
| **Status badge** | Status = Batch (Created, Receiving, Preparation, Analysis, Finished analysis, Completed) · Job order (Draft, Registered, Awaiting samples, In progress, Reported, Delivered, Cancelled) · Sample (Expected, Registered, Received, In batch, Awaiting arrival, Not received, Held) · Size md, sm |
| **Tag** | Type = Recheck, CoA uploaded, CoA missing, No CoA, Due today, Overdue, Late, Locked, Saved, Pending, Not printed, Printed, Check warning, New, Duplicate · each has an icon |
| **Delta** | Up, Down, Flat · "+12%", "1 today" |
| **On-target pill** (New) | Good, Warning, Bad ("On target") |
| **Role badge** | Superadmin, Lab admin, Analyst, Preparation, Reception, Customer service, Client |
| **Avatar** | Size 24, 28, 32, 40 · Initials |
| **Person chip** (New) | Avatar + name, optional caret ("DK Dedi Kurniawan ▾", performer cells) |
| **Count pill** | Neutral, Primary, Alert (tab counts, "Active batches 12") |
| **File chip** | PDF, XLS, CSV × Available, Missing |
| **Summary chip** (New) | Neutral, Success, Error ("12 rows found", "11 new", "1 duplicate") |

### 5.3 Forms

| Set | Properties |
| --- | --- |
| **Field label** (New) | Required (bool), Optional (bool) |
| **Text field** | State × Size (md, touch) · Label, Value/Placeholder, Helper or Error (bool + text), Leading icon, Suffix ("kg", "%") |
| **Select**, **Date field**, **Textarea** | same as Text field |
| **Search** | Size (md, lg) × State · Placeholder, Scan button, Clear (bool) |
| **Inline cell input** (New) | Table-embedded input and select: Default, Focused, Warning, Error, Disabled ("2.40", "Good ▾", "22.40 ⚠") |
| **Checkbox**, **Radio**, **Switch** | Checked (Off, On, Mixed) × State · Label, Description (bool) |
| **Filter chip** | Selected × State · Label, Count, Caret |
| **Parameter pill** | Kind (Parameter, Group) × State (Off, On, Locked, Auto-added) |
| **Parameter group row** (New) | Group label + wrap of pills ("Moisture: TM IM EQM") |
| **Quick-pick chips** (New) | Service presets ("TM + Prox + TS + CV", "Prox only", …) |
| **Drop zone** (New) | Default, Drag-over, Uploading, Error |
| **Dropdown menu** + **Menu item** | Menu item: State + Selected, Destructive · Label, Icon, Meta |
| **Option row** | Contact / Signatory: State · Name, Role or phone, email, Edit and Delete (bool) |
| **Column mapper** (New) | "Column A ▾" select with header, for Paste from Excel |
| **Form section header** (New) | Overline + optional description |

### 5.4 Navigation and page structure

| Set | Properties |
| --- | --- |
| **Nav item** | State (Default, Hover, Pressed, Focused, Active) × Collapsed · Icon, Label, Count |
| **Nav group label** | Collapsible (bool) |
| **Sidebar** | Collapsed (No 248, Yes 88) × Breakpoint (Desktop, Tablet drawer) · Logo instance, user block |
| **Top bar** | Breakpoint (Desktop, Tablet, Mobile) · Logo, Search, Bell, User chip (name + role) |
| **Breadcrumb** | 2 or 3 levels, Mobile back link |
| **Page header** (New) | Title, Status badge, meta line, Person chip, Overflow menu, Actions slot · Desktop and Mobile |
| **Tab** + **Tab bar** | State + Active · Count |
| **Stepper step** | State (Done, Current, Upcoming) × Orientation (Horizontal, Vertical) · Title, Meta |
| **Stepper** (New as a set) | 5 or 6 steps, connector Done or Upcoming; Vertical for Mobile |
| **Mobile step progress** (New) | "Step 1 of 2" bar for Create on Mobile |
| **Pager** | Desktop and Mobile |
| **Sticky action bar** | Desktop, Mobile (Print (2), Start Preparation); bulk-select count |

### 5.5 Data display

| Set | Properties |
| --- | --- |
| **Table header cell** | Align × Sort (No, Asc, Desc) · Checkbox (bool) |
| **Table cell** | Text, Two-line, Mono, Number, Badge, Progress, File chips, Person, Input, Actions |
| **Table row** | Template (Batch, Job order, Job order compact, Drill hole, Sample, Reception, Preparation, Paste preview) × State (Default, Hover, Selected, Error/Duplicate, Locked) |
| **Grid cell** (Input RoA) | Input, Focused, Calculated, Out of range, Warning, Locked, Header, Dirty |
| **Progress bar** | Primary, Success, Warning · "18/24" |
| **Key–value row** | Inline, Stacked (Properties panel) |
| **Checklist item** (New) | Done, Pending, Warning ("Before you can start preparation") |
| **Card/KPI** | With Delta, With progress, With mini bars (New: "Mean turnaround") |
| **Card/Panel** | Header (title, count, action), Body slot, Footer |
| **Card/Callout** | Alert (dark navy "Deadline alert"), Info |
| **Card/Queue** + **Queue row/Mobile** | Default, Overdue |
| **WIP row**, **Activity item**, **Waiting tag** | From My work |
| **Card/Batch**, **Card/Job order**, **Card/Drill hole**, **Card/Sample entry** (New: mobile reception card with mass and condition) | Mobile list cards |
| **Card/CoA** (New) | Not generated, Generated, Sent |
| **Batch mini card** (New) | In the job order Overview side panel |
| **Mini calendar** (New) | Week strip with month header, Today, Has-due dot |
| **Deadline item** (New) | Batch, time, Due-today tag |
| **Photo thumbnail** | Image, Empty, Uploading |
| **Label preview** | Barcode label for printing |
| **Empty state** | Page, Card · Icon, Title, Text, Action |
| **Skeleton** | Line, Row, Card |

### 5.6 Charts (New)

These are chart **shells**: the card, header, legend, axes and an example plot. The real charts come from ECharts in the app.

| Set | Properties |
| --- | --- |
| **Chart card** | Title, subtitle, legend, basis switch (segmented), expand button |
| **Legend item** | Swatch colour, Label, Value |
| **Workflow bars** | Horizontal stage bars (Batch workflow) |
| **Donut** | Sample type mix |
| **Bar chart** | Samples received by day, Today highlighted |
| **Scatter** | CV vs Ash and similar, with a tolerance band |
| **Trend** | Trend CV (adb), with a limit line |

### 5.7 Feedback and overlays

| Set | Properties |
| --- | --- |
| **Inline alert** | Error, Warning, Info, Success · Action (bool) |
| **Info note** (New) | One-line hint with info icon ("These IDs are printed on the labels…") |
| **Toast** | Success, Error, Info · Action |
| **Tooltip** | Top, Bottom, Left, Right (Locked row tooltip) |
| **Dialog** | Default, Destructive × Size (sm 400, md 560, lg 800 for Paste from Excel) · Title, Body slot, Footer buttons |
| **Side sheet** | 480, 640 · Header, Body slot, sticky Footer (New job order, Add batch) |
| **Bottom sheet** | Handle, Title, Close, Body slot, Footer (Contact, Mark CoA as sent) |
| **Scrim** | — |

### 5.8 Brand

| Set | Notes |
| --- | --- |
| **Logo** | Yours, unchanged. Sidebar and Top bar use instances of it |

**Size:** about 85 component sets, about 600 variants (Button alone is 4 types × 6 states × 3 sizes, about 72, plus the Tone variants), and 142 icon variants (71 glyphs × 2 sizes).

## 6. Layout in the file

- **Foundations** frame: kept, with a new section that lists the text and effect styles.
- One frame per group, in a row: `01 Icons`, `02 Actions`, `03 Status`, `04 Forms`, `05 Navigation`, `06 Data`, `07 Charts`, `08 Feedback & overlays`, `09 Brand` (your Logo frame moves in here).
- Each set sits in a panel with its name, a one-line rule for when to use it, and the token roles it binds.
- The **Components** documentation sheet is rebuilt from instances of the new sets, so it also tests them.
- Naming: set `Button`, variant `Type=Primary, State=Hover, Size=md, Tone=Default`. Helper layers that should not be published start with `_`.

## 7. Build route (what "headless" means)

There are two ways for me to put things into FigCraft.

- **Live:** I drive the FigCraft window you have open, one call at a time, through its control port. You watch it appear, but it needs FigCraft started as `figcraft.exe --control 7979`. Your installed copy runs without it, so I can't reach it now. It is also slow and costly for about 600 variants, since every call goes through me.
- **Headless (chosen):** I write a generator script that lists all the steps. `figcraft-cli` (FigCraft without a window) runs it on a **copy** of the file in a few minutes and saves the result. I then render each group to PNG, check it, and show you. When you approve, the copy replaces the main file. The old file goes to `figcraft/backup/` first.

During a headless run, keep the design file **closed** in FigCraft, or close it without saving afterwards, so your open tab doesn't overwrite the result.

Generator location: `.context/design/figcraft/tools/library/`, one module per group, plus `icons.js`, which downloads the Phosphor SVGs once.

## 8. Phases

Each phase ends with renders for you to approve.

| Phase | Work |
| --- | --- |
| **0. Font in files** | Replace Montserrat with Noto Sans in: prototype `src/index.html` (Google Fonts link) and `src/styles.css` (`--f-body`), then rebuild the prototype; `README.md`; `../Job Order/Job_Order_Prototype_Plan.md`; `../archive/Reception_Preparation_Screen_Plan.md`; the generator tools `convert.js`, `emit.js` and `layout.js` (default family). Republishing the prototype artifact needs your go-ahead |
| **A. Foundations** | Text styles, effect styles, Icon set (71 glyphs), Spinner |
| **B. Actions and Status** | Button, Icon button, Segmented, Link, Status badge, Tag and the other labels |
| **C. Forms and Navigation** | Fields, controls, chips, pills, menus, Sidebar, Top bar, Page header, Stepper, Tabs |
| **D. Data and Charts** | Table, Grid cells, Cards, Checklist, Calendar, chart shells |
| **E. Overlays and clean-up** | Dialog, Sheets, Toast, Tooltip; rebuild the Components sheet; delete the old 113 components and the old component frames |

## 9. Open points

1. **Button type mapping (section 4):** Primary = navy fill, Secondary = white with border, Tertiary = soft tint, Ghost = text only; Destructive and Accent become a `Tone` property. Is that right?
2. **Sizes:** md 40, sm 32 and touch 44 for every button type, or fewer?
3. **Phase 0, prototype:** change the prototype's font and republish the artifact now, or only at its next release?

## 10. Build status (Oct 30, 2026)

Phases 0 and A to E are built and saved in `SGSI-LIMS-screens.figcraft`: 74 component sets (about 740 variants), 28 styles, 60 variables. Frames, left to right: Foundations (now also holds the text styles list, effect-styled elevation and the Icon set), Components (test sheet made of instances), 01 Actions, 02 Status and labels, 03 Forms, 04 Navigation, 05 Data display, 06 Charts, 07 Overlays, Brand Components, Logo. The 113 old components and their frames are gone (backup: `figcraft/backup/`). Generator: `figcraft/library/` (`node build.js`, then `node finish.js`).

Known gaps: the Loading spinner is a still glyph; Foundations still shows the older type and elevation specimens next to the new styles; charts are static shells; the Dashboard sample cards use fixed progress widths.
