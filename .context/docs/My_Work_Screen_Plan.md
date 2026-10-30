# My Work Screen — Design Plan

Oct 26, 2026 · screen S-19 in `Coal_LIMS_Development_Spec.md` (sections 4.6, 4.8, 9.6, 10 S-19) · first screen outside the job order

## Why this screen now

My work is the **landing page for every staff role**. After signing in, each person sees the work waiting for them, without opening job orders one by one. Its source is Clarity's Lab View (screenshots `research/clarity-lims/screenshots/29-recording-a-standard-step/01_lab-view_work-in-progress_available-work.jpg` and `research/clarity-lims/screenshots/02-walk-through/scene_013.jpg`).

| Clarity Lab View | Our My work |
| --- | --- |
| Work in progress (step, age, count, Continue) | **Work in progress** strip: what I started and haven't finished |
| Available work: protocol → steps with sample counts | **Queues**: one card per queue my roles can act on, with count and oldest age |
| Ice bucket: pick samples, Begin Work | **Multi-select** rows in a queue, then one bulk action (only where the action is the same for every row) |
| Recent activities | **Recent activity** column: who moved what, when |
| Hidden protocols | Not needed. A queue shows only when a role can act on it, and empty queues collapse |

The Job orders screens already exist, so every queue row can link to a real screen. Reception (S-18), Input/Review ROA and Report review (S-28) are not designed yet, so their rows link to placeholders for now.

## Goal

Design the My work overview, an opened queue, and multi-select at three sizes: desktop 1440, tablet 834 (portrait), mobile 390. Use the existing components and tokens in `screens.pen` (including the job-order components), plus Phosphor icons. Demo data uses the personas from spec section 8.1 and the job orders and clients from the Job orders demo data.

## Who uses it

Everyone with a staff role. Each role sees only its own queues (spec S-19 table):

| Role | Persona | Queues |
| --- | --- | --- |
| CSO | Rina Kartika | Job orders awaiting samples · Samples awaiting arrival (Oct 28, not yet drawn) · CoAs to send |
| Preparation team | Dedi Kurniawan | Job orders awaiting samples · Samples awaiting arrival (Oct 28, not yet drawn) · In preparation |
| Analyst | Fitri Handayani | Ready for analysis (assigned to me first) |
| Supervisor | Hendra Wijaya | Results to approve · RoAs to approve · Ready for analysis (to assign, see open point 5) |
| Lab admin | Maya Lestari | RoAs to draft · RoAs to publish · CoAs to generate |
| Manager | Ir. Bambang Sutrisno | Manager reviews |
| Everyone | — | Work in progress |

The main frames are drawn for **Maya Lestari (Lab admin)**, who has the most queues. The per-role frames show how the page looks for the other roles.

## Frames

| # | Frame | Sizes | Content |
| --- | --- | --- | --- |
| 1 | `My Work · Overview` | Desktop, tablet, mobile | Work in progress, queue cards, recent activity (Maya) |
| 2 | `My Work · Queue` | Desktop, tablet, mobile | "RoAs to draft" opened: queue tabs and the list |
| 3 | `My Work · Queue · Multi-select` | Desktop, tablet, mobile | CSO "CoAs to send" with 3 rows selected and the bulk bar |
| 4 | `My Work · Overview · <Role>` | Desktop only | One each for Preparation, Analyst, Supervisor, CSO, Manager |
| 5 | `My Work · All caught up` | Desktop, mobile | Empty state when every queue is empty |

Frames 1–3 at three sizes (9), five role frames (5) and the empty state at two sizes (2) make **16 frames**. They go in a new "My Work" row group below the Job Orders rows.

## Sidebar

**My work** stays first in the sidebar (`tray` icon) and becomes the default page after sign-in. It gets a **count badge** with the total items in the user's queues (Work in progress not counted). This needs a new `Nav Item` variant with a badge, and the collapsed sidebar shows a dot instead.

## 1 · My Work · Overview

### Desktop (1440, sidebar expanded)

```
┌ Sidebar ──┬ Top bar: search · bell · Maya Lestari (Lab admin) ────────────────────────┐
│ ▣ My work 9│ My work                                         Mon, 26 Oct 2026          │
│ Dashboard │ 9 items waiting · 2 past due                                              │
│ WORK      │                                                                           │
│ Job orders│ WORK IN PROGRESS                                     ┌ RECENT ACTIVITY ──┐ │
│ …         │ ┌───────────────────────────────────────────────┐   │ Hendra W. approved │ │
│           │ │ RoA B-2026-0415 · PT Kaltara…  Draft  2 h ago [Continue]│ RoA B-2026-0412  │ │
│           │ └───────────────────────────────────────────────┘   │ 10 min ago         │ │
│           │                                                     │ Fitri H. finished  │ │
│           │ MY QUEUES                                            │ analysis B-0417    │ │
│           │ ┌ RoAs to draft ─┐ ┌ RoAs to publish ┐ ┌ CoAs to gen. ┐│ 35 min ago         │ │
│           │ │ ✎   4          │ │ ⎙   3           │ │ ▤  2         ││ Dedi K. received   │ │
│           │ │ Oldest 3 d     │ │ Oldest 1 d      │ │ Oldest 5 h   ││ 12 samples JO-0142 │ │
│           │ │ ⚠ 1 past due   │ │                 │ │ ⚠ 1 past due ││ …                  │ │
│           │ │ 1 returned     │ │                 │ │              ││ (10 items)         │ │
│           │ └────────────────┘ └─────────────────┘ └──────────────┘│ [View all]         │ │
│           │                                                     └────────────────────┘ │
└───────────┴───────────────────────────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Header | Title, today's date, summary line "9 items waiting · 2 past due" (past due in danger colour) |
| Work in progress | One row per batch step or report the user started and hasn't finished: kind icon, record no., client, current state, last touched ("2 h ago"), item count, **Continue**. Hidden when empty. Up to 5 rows, then "Show all" |
| Queue cards | One card per queue: icon, queue name, **count** (large), "Oldest 3 d", past-due count with `warning` icon (only when > 0), and a queue-specific note (e.g. "1 returned" on RoAs to draft). The whole card is clickable and opens frame 2. Cards with count 0 shrink to a single muted line under the grid ("Nothing in CoAs to generate"), so the grid holds only work |
| Order | Queues in flow order (spec 9.6), not by count, so the layout stays the same each day |
| Recent activity | Right column, 320 px: avatar, "**Hendra Wijaya** approved RoA B-2026-0412", time ago; each line links to the record. 10 items, then **View all** (opens the audit log filtered to the lab) |
| Multi-role user | When a user has more than one role (e.g. Superadmin + CSO), the queue cards are grouped under small role headings |

### Tablet (834, sidebar collapsed)

Queue cards in **2 columns**. Recent activity moves below the queues, shows 5 items and a "Show all" link. Work in progress rows drop the client column.

### Mobile (390)

Top bar with menu button. Header becomes title + summary line. Work in progress becomes a compact card ("Continue RoA B-2026-0415"). Queues become **full-width list rows** (icon, name, oldest age, past-due icon, count, chevron), 56 px tall for touch. Recent activity sits behind a "Recent activity" row at the bottom that opens a sheet.

```
┌──────────────────────────────┐
│ ☰  My work               🔔  │
│ 9 waiting · 2 past due        │
│ ┌ Continue ─────────────────┐ │
│ │ RoA B-2026-0415 · 2 h ago ›│ │
│ └───────────────────────────┘ │
│ ✎ RoAs to draft  3 d ⚠   4  › │
│ ⎙ RoAs to publish 1 d    3  › │
│ ▤ CoAs to generate 5 h ⚠ 2  › │
│ ⟲ Recent activity           › │
└──────────────────────────────┘
```

## 2 · My Work · Queue

Route `/work/:queue`. Opening a card shows that queue's list, with the user's other queues as tabs so they can switch without going back.

### Desktop

```
My work / RoAs to draft
[RoAs to draft 4] [RoAs to publish 3] [CoAs to generate 2]      ← Status Chip Filter
[Search no., client]  [Client ▾]  [Past due only ☐]
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Waiting  Batch / RoA     Job order     Client            Samples  Due     Note    │
│ ⚠ 3 d    B-2026-0409    JO-2026-0136  CV Sumber Batu…    8        23 Oct  Returned│
│ 2 d      B-2026-0412    JO-2026-0138  PT Mahakam Coal…   20       28 Oct          │
│ 1 d      B-2026-0414    JO-2026-0140  PT Bara Nusant…    12       30 Oct          │
│ 4 h      B-2026-0416    JO-2026-0141  PT Kaltara Ene…    6        02 Nov          │
└──────────────────────────────────────────────────────────────────────────────────┘
                                                              [Open report ›] per row
```

| Part | Spec |
| --- | --- |
| Header | Breadcrumb "My work / RoAs to draft"; queue tabs (`Status Chip Filter`, one per queue with its count) |
| Filters | Search (batch, job order, client), Client, **Past due only** toggle. Kept small, since a queue is short |
| Columns | **Waiting** (time at this status: "4 h" under a day, then "3 d") · record no. · job order (link) · client · samples · due date · queue note (Returned with the comment in a tooltip, Assigned to me, ADL missing, etc.) · row action button |
| Sort | Past due first, then the longest waiting. Analyst queue: assigned to me first (spec S-19) |
| Row states | Past due: `warning` icon and the due date in danger colour. Due within 24 h: warning colour. Returned RoA: `arrow-u-up-left` tag |
| Row action | One button per row named after the queue's action (Open report, Open reception, Open Input ROA, Answer, Download…). Clicking the row does the same |
| Checkbox column | Shown **only** in queues with a bulk action (frame 3). "RoAs to draft" has none, because each RoA needs its own check |
| Footer | "4 items". No pagination under 25 items; above that, 25 per page |

### Tablet

Queue tabs scroll sideways. The table drops Job order and Samples columns; the job order shows as a second line under the record no.

### Mobile

Queue tabs scroll sideways under the title. One card per item, reusing `Card/Job Order`: record no. + waiting tag, client, job order · due date, note, and the action as the card's tap target.

## 3 · My Work · Queue · Multi-select

Drawn for **Rina Kartika (CSO)** in "CoAs to send", with 3 of 5 rows selected.

| Part | Spec |
| --- | --- |
| Checkbox column | First column, with select-all in the header (selects the visible rows) |
| Bulk bar | Appears when 1 or more rows are selected. Desktop and tablet: a bar fixed to the bottom of the content area. Mobile: replaces the bottom area as a sticky bar. Contents: "3 selected", **Download PDFs**, Clear |
| Rule | A bulk action appears only when it does the same thing to every row. Marking sent stays one by one, because each CoA has its own recipient and channel (open point 4) |

Bulk actions per queue (default):

| Queue | Bulk action |
| --- | --- |
| CoAs to send | Download PDFs (one zip) |
| Ready for analysis (Supervisor) | Assign analyst… |
| Job orders awaiting samples | Print sample ID list |
| Every other queue | None (no checkbox column) |

## 4 · Overview per role (desktop)

The same layout as frame 1, with the role's queues and demo counts:

| Frame | Persona | Work in progress | Queues (count · oldest) |
| --- | --- | --- | --- |
| Preparation | Dedi Kurniawan | Preparation B-2026-0418 | Job orders awaiting samples 3 · 2 d · In preparation 2 · 1 d (1 "ADL missing") |
| Analyst | Fitri Handayani | Analysis B-2026-0417 (Ultimate tab) | Ready for analysis 5 · 1 d (2 assigned to me) |
| Supervisor | Hendra Wijaya | — | Results to approve 4 · 2 d (1 past due) · RoAs to approve 3 · 6 h · Ready for analysis 5 (3 unassigned) |
| CSO | Rina Kartika | — | Job orders awaiting samples 3 · 2 d · CoAs to send 5 · 1 d |
| Manager | Ir. Bambang Sutrisno | — | Manager reviews 2 · 1 d, plus a **Dashboard** shortcut card, since the Manager mostly reads |

## 5 · All caught up

When every queue is empty: `check-circle` icon, "All caught up", one line ("New work appears here as soon as it reaches you."), and a secondary link to **Dashboard**. Recent activity stays visible on desktop.

## Demo data

| Item | Values |
| --- | --- |
| Records | Batches `B-2026-0409` to `B-2026-0418`, job orders `JO-2026-0131` to `JO-2026-0142` (same as the Job orders frames) |
| Clients | PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, CV Sumber Batu Hitam, PT Mahakam Coal Resources |
| People | Personas from spec section 8.1 only |
| Waiting | A spread from 4 h to 5 d; 2 past due on Maya's page; one returned RoA with the comment "Recheck CV on sample 5, value outside expected range" |

## Components

Reuse: `Sidebar/*`, `Top Bar`, `Avatar`, `Card/Panel`, `Table/Header Row`, `Table/Row`, compact table rows, `Badge/Status`, `Status Chip Filter`, `Card/Job Order`, `Performer Line`, `Channel Icon`, `Input/Search`, `Input/Select`, `IconButton/Ghost`, buttons.

New reusable components:

| Component | Used later by |
| --- | --- |
| `Queue Card` (icon, name, count, oldest, past-due, note; default, hover, zero) | Dashboard shortcuts |
| `Queue Row/Mobile` (icon, name, oldest, past-due, count, chevron) | Mobile menus |
| `WIP Row` (kind icon, record, state, time, count, Continue) | Batch detail "resume" banner |
| `Activity Item` (avatar, sentence with bold actor, time) | Sample history (S-30), audit log |
| `Waiting Tag` (normal, due soon, past due) | Batches list, Reports list |
| `Bulk Action Bar` (count, actions, clear) | Batches, Reports, Samples grids |
| `Nav Item` badge variant | Sidebar |

## Responsive rules

Same as the earlier plans: breakpoints 360–767 mobile, 768–1199 tablet, 1200+ desktop. Touch targets are 44 px on tablet and mobile, there is no horizontal page scroll, and the bulk bar is sticky at the bottom on mobile.

## Prototype and interaction

Once the frames are approved, the HTML prototype (artifact `73FDBne3B8rbFcXoa6dDZo`) gets a My work page that becomes its start page. It reuses the job order demo data, so a queue row opens the real job order screens.

| Flow | Steps |
| --- | --- |
| A · Start the day | Sign-in lands on My work → see summary → open a queue card → open a row → (placeholder for Report review) → back to My work, count goes down |
| B · Continue | Click **Continue** on a Work in progress row → opens the record at the step where it was left |
| C · Bulk | CSO opens CoAs to send → selects 3 → **Download PDFs** → toast "3 CoAs downloaded" → selection clears |
| D · Switch role (prototype only) | A role switcher in the prototype bar redraws My work for each persona, so the review can walk every role |

| Interaction | Behaviour |
| --- | --- |
| Queue card | Hover lifts the border colour; the whole card is the link; keyboard Enter opens it |
| Queue tabs | Switch the list without reloading; the URL updates (`#work.roas-to-draft`) |
| Counts | Recomputed from the demo data, so acting on a row in the prototype lowers the count |
| Recent activity | Time ago updates every minute; new items fade in at the top |
| Empty queue | The tab stays, the list shows "Nothing waiting here" |
| States | Loading skeleton for cards and rows; error banner with Retry |

## Open points (defaults used in the frames)

| # | Question | Default drawn |
| --- | --- | --- |
| 1 | What does Recent activity cover: the whole lab or only my queues? | Whole lab, last 10, linked to the audit log |
| 2 | When is a row marked "due soon"? | Due within 24 h → warning colour; past due → danger |
| 3 | Is Waiting counted in calendar days or working days? | Calendar time ("4 h", "3 d") |
| 4 | Can the CSO mark several CoAs sent at once? | No, one by one; bulk is Download only |
| 5 | Does the Supervisor see Ready for analysis to assign analysts (D-36)? | Yes, with **Assign analyst…** as a bulk action |
| 6 | Should Dashboard or My work be the start page for the Manager? | My work for everyone; the Manager's page has a Dashboard shortcut card |

## Done when

- The 16 frames are in `screens.pen` under a "My Work" row group, using components (no detached copies).
- Every queue in the spec S-19 table appears in at least one frame.
- Past due, due soon, returned and zero-count states are each shown at least once.
- Desktop, tablet and mobile read correctly at 1440, 834 and 390 with no horizontal page scroll.
- The open points are answered or the defaults are accepted.

## Build status (Oct 26, 2026)

Built in `screens.pen`, in the "My Work · Desktop Row" and "My Work Components" frames at the bottom of "v1 Screens":

- Frame 1 `My Work · Overview` at desktop, tablet and mobile (Maya Lestari, Lab admin).
- New components: Queue Card, WIP Row, Activity Item, Waiting Tag, Queue Row/Mobile.

Not built yet: frame 2 (queue list), frame 3 (multi-select), frame 4 (five role overviews), frame 5 (All caught up), and the sidebar count badge on My work.

## Note · v1 scope and design source (Oct 29, 2026)

v1 is report and monitoring of job orders (Coal LIMS spec section 1.1). Queue effects for My work: the Preparation team's "Job orders awaiting samples" now also appears for the CSO and Lab admin, who can confirm reception; the Analyst's queue is "Batches ready for data entry" (the analyst inputs final values, no worksheet); the Lab admin's queue gains "Analysis finished, signed RoA to upload". The frames stay as built in `screens.pen` and in the FigCraft file (`.context/design/figcraft`); the queue changes above are not drawn yet.

