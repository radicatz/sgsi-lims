# My Work Screen — Design Plan

Nov 4, 2026 · **Revision 2: BUILT (Nov 4, 2026)** · screen S-19 in `../Project/Coal_LIMS_Development_Spec.md` (sections 1.1, 4.6, 4.8, 9.6, 10 S-19) · first written Oct 26, 2026

Written for: the product owner, and whoever builds the frames.

Revision 2 rewrites the plan for v1 (report and monitoring, spec 1.1) and for the current design rules. What changed and why is listed in section 11; the Oct 26 plan is summarised there as history.

## 1 · Why this screen

My work is the **landing page for every staff role that acts in the system**. After signing in, each person sees the work waiting for them and opens it in one click, without searching the job order or batch lists. The pattern comes from Clarity's Lab View (`.context/research/clarity-lims/screenshots/29-recording-a-standard-step/01_lab-view_work-in-progress_available-work.jpg`): work in progress, queues with counts, recent activity.

Every queue row now leads to a drawn screen: the job order detail (`../Job Order/Job_Order_Screen_Plan.md`), the batch page and the batch list (`../Batch/Batch_Screen_Plan.md`).

## 2 · Queues in v1

In v1 the Analyst enters final values, the Lab admin uploads the signed RoA and completes the batch, and the Supervisor and Manager sign on paper (spec 1.1). The queues follow from that.

| # | Queue | Roles | Contents | Opens | Bulk action |
| --- | --- | --- | --- | --- | --- |
| Q1 | **Batches to receive** | CSO, Preparation, Lab admin | Batches Created or Receiving (some samples ticked arrived) | Batch page, Reception tab | None |
| Q2 | **Samples awaiting arrival** | CSO, Preparation | Samples returned to the job order at Confirm reception and not yet in a new batch or marked not received (D-41) | Job order, Batches tab (Add batch pre-ticks them) | None |
| Q3 | **In preparation** | Preparation | Batches in Preparation; "ADL missing" flagged | Batch page, Preparation tab | None |
| Q4 | **Ready for data entry** | Analyst | Batches Prep finished or Analysis | Batch page, Analysis tab | None |
| Q5 | **Signed RoA to upload** | Lab admin | Batches Analysis finished | Batch page, Analysis tab with the RoA card | None |
| Q6 | **CoAs to generate** | Lab admin | Job orders whose batches are all Completed and that have no CoA | Job order, CoA tab | None |
| Q7 | **CoAs to send** | CSO | Published CoAs not marked sent | Job order, CoA tab (Mark sent) | **Download PDFs** |
| — | **Work in progress** | Everyone above | What the user started and has not finished: a reception with some samples ticked, ADL or results partly saved | The record, where it was left | Continue (per row) |

**Next goal (spec keeps them, not in v1):** Results to approve, RoAs to draft, RoAs to approve, RoAs to publish, Manager reviews, and assigning analysts.

**Supervisor and Manager** have no queue in v1; they start on the Dashboard (open point 1).

## 3 · Roles and demo personas

| Role | Persona | Queues (count, oldest) | Frames |
| --- | --- | --- | --- |
| Lab admin | Maya Lestari | Batches to receive 2, 1 d; Signed RoA to upload 1, 6 h; CoAs to generate 1, 2 d (1 past due) | Main frames (desktop, tablet, phone) |
| Preparation | Dedi Kurniawan | Batches to receive 2, 1 d; Samples awaiting arrival 1, 3 d; In preparation 1, 1 d (ADL missing) | Desktop |
| Analyst | Fitri Handayani | Ready for data entry 3, 2 d (1 past due) | Desktop |
| CSO | Rina Kartika | Batches to receive 2, 1 d; Samples awaiting arrival 1, 3 d; CoAs to send 3, 1 d | Desktop; multi-select frames |

Demo records come from the drawn screens: batches B-2026-0413 to B-2026-0422 (batch list), job orders JO-2026-0133 to JO-2026-0142 (job order list), the four demo companies and the spec 8.1 personas. Example rows: B-2026-0422 (JO-2026-0137, Receiving, 6 / 8 arrived), B-2026-0413 (JO-2026-0136, Created, past due), B-2026-0418 (Analysis, 26 of 36 values saved), B-2026-0415 (Analysis finished, RoA to upload), JO-2026-0141 (CoA to send).

## 4 · Screen 01 · Overview

```
Sidebar      My work active, with a count pill (items in my queues)
Header       overline date (no "WORK" layer), title "My work"; no count subtitle
Work in progress card   WIP rows: record, state, started, Continue
My queues    Queue cards in flow order (Q1 to Q7 order), past-due tone where any item is past due
Right column Recent activity card (desktop): Activity items, View all
```

| Part | Rule |
| --- | --- |
| Header | Overline with today's date ("WEDNESDAY 28 OCTOBER 2026"), title "My work". No summary line: counts live on the cards (rule of Nov 3) |
| Work in progress | A card titled "Work in progress" (Card head 32) with **WIP row** instances: record (for example "B-2026-0418" and "Analysis" as two texts), started (time and company as two texts), **Continue**. Hidden when empty. Up to 5 rows, then "Show all" |
| Queue cards | **Queue card** instances (Tone Default or Overdue): name, count, "Oldest waiting 1 d"; Overdue tone when at least one item is past due. The whole card is the link to the queue. Queues with count 0 collapse into one muted line under the grid ("Nothing in CoAs to generate") |
| Order | Flow order Q1 to Q7, never by count, so the layout is the same every day |
| Recent activity | Desktop: a 320 px card on the right with **Activity item** instances ("**Dedi Kurniawan** confirmed reception of B-2026-0421", time ago as its own text), 8 items, **View all** (audit log). Tablet: below the queues, 5 items. Phone: a "Recent activity" row that opens a bottom sheet |
| Several roles | A user with more than one role sees the queue cards grouped under small role headings |

Tablet: queue cards in 2 columns, the WIP rows drop the company. Phone: Work in progress as a compact card with Continue; queues as full-width rows (name, oldest, past-due icon, count, chevron), 56 px tall.

## 5 · Screen 02 · Queue

Route `/work/:queue`. Opening a queue card shows its list; the user's other queues are tabs above it.

```
Breadcrumb   My work > Batches to receive
Tabs         Batches to receive 2 | Signed RoA to upload 1 | CoAs to generate 1     (Tab component, count pill)
Filters      [Search batch, job order or company]  [Company]  [Past due only]
Table card   Waiting | Batch | Job order | Samples | Status | Deadline | Note | Action
Footer       Pager only above 25 items
```

| Column | Content |
| --- | --- |
| Waiting | Time at this status: "4 h" under a day, then "3 d"; past due rows show the warning icon |
| Batch (or record) | Number in mono heading colour, batch date as a second line |
| Job order | Number in Primary/primary (link) with the company as a second line |
| Samples | "6 / 8", as on the lists |
| Status | Status badge |
| Deadline | Date; past due in the error colour with a separate "Past due" text; due within 24 h in the warning colour |
| Note | Queue note as a Tag or short text: "ADL missing", "2 not arrived", "RoA-0415 to upload" |
| Action | One small button named after the queue's action (Open reception, Enter results, Upload RoA, Mark sent ...); the row itself opens the same place |

Rows sort past due first, then longest waiting. Tablet: tabs scroll sideways; Job order and Samples fold into the second line of Batch. Phone: one card per row (number and status, job order and company, waiting, deadline, the action as the tap target).

## 6 · Multi-select (Q7 CoAs to send)

Drawn for Rina Kartika in **CoAs to send**, with 2 of 3 rows selected, so the header checkbox shows its mixed state.

| Part | Rule |
| --- | --- |
| Checkbox column | Only in queues with a bulk action (Q7 in v1); select-all in the header selects the visible rows |
| Bulk bar | **Sticky action bar** at the bottom: "2 selected", **Download PDFs**, Clear. Phone: the sticky bar replaces the bottom area |
| Rule | A bulk action appears only when it does the same to every row; Mark sent stays one by one (each CoA has its own recipient and channels) |

## 7 · All caught up

When every queue is empty: **Empty state** (Size=Page) "All caught up" with "New work appears here as soon as it reaches you." and a secondary link to Dashboard. Recent activity stays on desktop.

## 8 · Frames

Module **01 My_work** (sidebar order), names by `../Design System/Frame_Naming.md`. Canvas: a new row **H  My work** below row F.

| SS | Screen | VV | Variant | Sizes |
| --- | --- | --- | --- | --- |
| 01 | Overview | 01 | Lab_admin | D, T, P |
| 01 | Overview | 02 | Preparation | D |
| 01 | Overview | 03 | Analyst | D |
| 01 | Overview | 04 | CSO | D |
| 01 | Overview | 05 | All_caught_up | D, P |
| 02 | Queue | 01 | Batches_to_receive | D, T, P |
| 02 | Queue | 02 | CoAs_to_send_multi_select | D, T, P |

Total **14 frames** (7 desktop, 3 tablet, 4 phone), for example `Desktop-01-My_work-01-Overview-01-Lab_admin`.

## 9 · Design rules that apply

- Card anatomy: cards padded 16 on all sides; Card head 32 px (title, actions, short texts); notes and descriptions in Card content; Table cards padded 16 (`../Design System/Component_Library_Plan.md`).
- No values joined with " · ": separate texts, an icon row, two lines or a sentence (Job Order plan 8.1). No count subtitles under titles.
- Sidebar: **My work** is active on these frames, with its Count pill showing the total of the user's queues (the Nav item already has the Count; the collapsed rail shows the same pill).
- Batch and job order numbers in their usual colours (heading for the batch, Primary/primary for the job order link); deadlines past due in red with "Past due".
- Library components used as they are: Queue card, WIP row, Activity item, Waiting tag, Tab, Status badge, Tag, Checkbox, Sticky action bar, Empty state, Button, Icon button, Search, Select, Pager. New only if needed: a phone queue row (built from frames if no component fits).

## 10 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Supervisor and Manager have no queue in v1. Start page? | **Settled Nov 5:** Dashboard. My work is hidden from their sidebar (it would always be empty), per `../Navigation/Navigation_Screen_Plan.md` |
| 2 | Recent activity: whole lab or only my queues? | Whole lab, last 8, linked to the audit log |
| 3 | When is a row "due soon"? | Due within 24 h: warning colour; past due: error colour with "Past due" |
| 4 | Waiting in calendar or working days? | Calendar time ("4 h", "3 d") |
| 5 | Does Q1 Batches to receive also show to the Lab admin? | Yes (Confirm reception is CSO, Preparation, Lab admin, D-46) |
| 6 | CoAs to generate: Lab admin or CSO? | Lab admin (spec CoA flow) |

## 11 · What changed from the Oct 26 plan

| Oct 26 plan | Revision 2 (Nov 4) | Why |
| --- | --- | --- |
| Queues RoAs to draft, RoAs to approve, RoAs to publish, Results to approve, Manager reviews; Ready for analysis with "assign analyst" | Removed (next goal); new queues Batches to receive, Ready for data entry, Signed RoA to upload | v1 scope, spec 1.1, D-44 to D-49 |
| Main persona Maya with RoA queues; role frames for Supervisor and Manager | Maya with v1 queues; role frames for Preparation, Analyst, CSO only | Supervisor and Manager have no in-system work in v1 |
| "Job orders awaiting samples" opens reception | Reception is per batch: **Batches to receive** opens the batch page | Batch page design, D-46 |
| Summary line "9 items waiting · 2 past due" | No subtitle | No count subtitles, no dot joins (Nov 3) |
| New components to draw (Queue Card, WIP Row, Activity Item, Waiting Tag, Bulk Action Bar, Nav Item badge) | Use the library's Queue card, WIP row, Activity item, Waiting tag, Sticky action bar and the Nav item Count | The component library rebuild (Oct 30) |
| Frames in `screens.pen`, names like "My Work · Overview" | FigCraft file, names by Frame_Naming.md, canvas row H | Design source moved (Oct 29); naming rule (Nov 3) |
| 16 frames | 14 frames | Fewer role frames |
| Prototype section | Deferred: screens first (owner, Nov 4) | |

History: on Oct 26 frame 1 (Overview for Maya) was built at three sizes in `screens.pen`, with the components Queue Card, WIP Row, Activity Item, Waiting Tag and Queue Row/Mobile. On Oct 29 the frames moved to FigCraft and on Oct 30 they were deleted with the library rebuild; the components were rebuilt in the new library.

## 12 · Build steps (after go)

1. Generator `library/screens/rowH.js` (14 frames), placed below row F; naming rules for module 01.
2. Build chain: `build-screens.js C,D,E,G,F,H`, `rev8.js D`, `naming.js`, `cards.js`, `fit.js`; deploy when the open file has no unsaved edits; export.
3. Build status here, memory, commit.

## 13 · Build status (Nov 4, 2026)

All 14 frames are in the FigCraft file, canvas row **H  My work** below row F (`library/screens/rowH.js`; naming rules for module 01 in `naming.js`; backup before: `backup/SGSI-LIMS-screens.before-mywork.figcraft`). PNGs in `.context/design/export/`.

- **Overview** (Lab_admin D, T, P; Preparation, Analyst, CSO D; All_caught_up D, P): header with the date overline and no subtitle; Work in progress card with the library WIP row; queue cards (Queue card, Overdue tone when something is past due; the past-due text is the second part of the card's warning line); Recent activity card (8 items) on desktop, below the queues on tablet (5 items), a row on phone; the sidebar item My work shows its count pill on desktop.
- **Queue** (Batches_to_receive D, T, P; CoAs_to_send_multi_select D, T, P): breadcrumb, queue tabs with counts, search, company, Past due only, a Table card with Waiting (warning icon and red when past due), batch or CoA, job order link, samples "n / n", status, deadline with "Past due", note and one action button. The multi-select frames show the mixed header checkbox, two of three rows ticked and the Sticky action bar ("2 selected", Clear, Download PDFs). Phone: one card per item.
- **Placement:** rows D, F and G ignore row H; row F tells row H where it ends (`b.fEnd`). Build chain: `build-screens.js C,D,E,G,F,H`, `rev8.js D`, `naming.js`, `cards.js`, `fit.js`.
- **Deviations:** the Activity item library component has one text, so the actor is not bold; the collapsed tablet sidebar shows no count (the Nav item rail has no pill yet); the phone queue rows and Work in progress card are built from frames (no library component).
- Not done: the prototype page (screens first).
