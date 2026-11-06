# My Work — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 2.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `My_Work_Screen_Plan.md`.

## 1 · Frames

Module 01, 14 frames. D desktop, T tablet, P phone.

| Screen | States (sizes) |
| --- | --- |
| 01 Overview | Lab_admin (D T P), Preparation (D), Analyst (D), CSO (D), All_caught_up (D P) |
| 02 Queue | Batches_to_receive (D T P), CoAs_to_send_multi_select (D T P) |

## 2 · Screens and what they do

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Overview | `#/work` | One card per queue the role has (Q1 to Q7 of the screen plan), with **Continue** on the first item and **View all**, which opens the queue. The All caught up empty state shows when every queue is empty |
| Queue | `#/work/:queue` | Breadcrumb My work > queue name. Tabs, one per queue of the role, each with its count. Search ("Search batch, job order or company"), Company select, **Past due only** |
| Batches to receive | | Rows with Created or Receiving status; **Open reception** opens the batch page on the Reception tab |
| CoAs to send | | Row checkboxes. A selection bar shows **Download PDFs**, **Mark sent** (the Mark sent dialog for every selected CoA) and **Clear** |
| Other queues | | Samples awaiting arrival, In preparation, Ready for data entry, Signed RoA to upload and CoAs to generate use the same queue page. Each row opens the target named in the screen plan's queue table. Tagged "Built from the pattern" where no frame is drawn |

The queues are computed from the demo data, so a batch moves from one queue to the next as the flows run.

## 3 · Links to other groups

| From | To |
| --- | --- |
| Batches to receive, In preparation, Ready for data entry, Signed RoA to upload | Batch page on the Reception, Preparation or Analysis tab (Batch plan) |
| Samples awaiting arrival | Job order Batches tab; Add batch pre-ticks the samples (Job order plan) |
| CoAs to generate, CoAs to send | Job order CoA tab (Job order plan) |
| Dashboard, Your queues | This page (Dashboard plan) |

## 4 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| MW1 | Work a queue | Preparation | My work → Batches to receive → **Open reception** → batch page Reception |
| MW2 | Send several CoAs | CSO | CoAs to send → tick 3 → **Download PDFs** → **Mark sent** |

## 5 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | The queues without a frame (In preparation, Ready for data entry and the others): build them on the queue page pattern? | Yes |
