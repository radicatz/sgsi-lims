# Master Data — Prototype Plan

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 6.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Master_Data_Screen_Plan.md`.

## 1 · Frames

Modules 09 to 12, 31 frames. D desktop, T tablet, P phone.

| Module | Screen | States (sizes) |
| --- | --- | --- |
| 09 Clients | 01 Clients_list | Default (D T P), Empty (D) |
| | 02 Client_detail | Default (D T P), Contact_form, With_logo (D) |
| | 03 Client_form | New_client (D P), Archive_confirm, Logo_uploaded (D) |
| 10 Drill hole | 01 Drill_hole_list | Default (D T P), Missing_CoA, Read_only (D) |
| | 02 Drill_hole_form | New_drill_hole (D P) |
| | 03 CoA_upload | Upload (D P), History (D) |
| 11 Lithology | 01 Lithology_list, 02 Lithology_form | Default (D T P); Edit (D) |
| 12 Seam | 01 Seam_list, 02 Seam_form | Default (D T P); New_seam (D) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Clients list | `#/clients` | **Add client** opens a dialog: logo drop zone, name, code, status, address with **Same as address**, **Save client**. Status chips All, Active, Inactive, Archived. Search. Each row has an **Edit** link and a row menu: Archive or Restore, and Delete when nothing uses the client. The Archive dialog. Empty state. A click on the row opens the client page. Phone: **Filters** and a full-screen form |
| Client page | `#/clients/:code` | Logo (Logo_uploaded: file name and size, **Remove**) or an initials avatar 64. **Edit**, **Add contact**. The contact dialog: name, position, email, phone, and the **Default contact** switch, which pre-fills Attention on new job orders. The contact row menu: Edit, Make default, Archive. The client's CoA and job order history |
| Drill hole | `#/master/drill-holes` | **Import** (shows a toast), **Add drill hole** (dialog: company, code, description), **Upload CoA** (dialog with a drop zone; a bottom sheet on the phone). Chips All, Missing CoA, Archived, with **Reset**. Company select, Search. The row menu adds **CoA history** (a dialog with downloads). Read-only for Supervisor and Manager: no Add, Import, Edit, row menu or upload |
| Lithology | `#/master/lithologies` | **Add lithology** and **Edit** dialogs: company, name, and the kind as Radio Coal, Parting or No lithology. Chips All, Coal, Parting, No lithology, Archived. Company select, row menu |
| Seam | `#/master/seams` | **Add seam** dialog: company, code, description, order. Chips All, Archived. Company select, row menu |

## 3 · Links to other groups

| From | To |
| --- | --- |
| Client contacts | The same records as the job order Contact person dropdown (Job order plan) |
| Default contact | Pre-fills the contact in New job order and Attention on the Draft CoA (Reports plan) |
| Drill hole CoA | Dashboard Quality & reports, Drill holes table (Dashboard plan) |
| Drill holes, lithologies, seams | Sample fields in the job order and in Search |

## 4 · Gaps, differences and a defect

| Item | Prototype |
| --- | --- |
| Row menus drawn closed | Archive or Restore, Delete when unused; Drill hole adds CoA history; client contacts: Edit, Make default, Archive |
| D2: the PT Bara Nusantara Mandiri contacts here (Budi Santoso default, Rina Ayu Lestari, Sari Wulandari) differ from the job order frames (Budi Hartono, Sari Wulandari, Dewi Anggraini) | Bara Nusantara: Budi Hartono (default), Sari Wulandari, Dewi Anggraini. Budi Santoso and Rina Ayu Lestari move to PT Bukit Asam Tbk |
| **E1**: on **Phone-09-Clients-03-Client_form-01-New_client** and **Phone-10-Drill_hole-02-Drill_hole_form-01-New_drill_hole**, the sticky action bar still shows the library's default second button, **Start Preparation**, next to Save (found in the layer structure: Button > Sticky action bar > Main) | The prototype shows **Cancel**. Frame fix in `rowK.js` with the next FigCraft build |

## 5 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| MD1 | Client page | CSO | Clients → PT Bara Nusantara Mandiri → **Add contact** → **Default contact** → New job order shows the contact pre-filled |
| MD2 | Drill hole CoA | Lab admin | Missing CoA → **Upload CoA** → CoA history; as Supervisor: read-only |
| MD3 | Lithology and seam | Lab admin | Edit a lithology kind; add a seam |

## 6 · Demo data

| Item | Values |
| --- | --- |
| Clients | The seven of the Clients list (shared plan, section 7), with logos for PT Bukit Asam Tbk |
| Drill holes | DH-BNM-021 to DH-BNM-031 and the others of the list frames: 100 in all, 12 missing a CoA, 3 archived |
| Lithologies, seams | The 9 lithologies and 62 seams of the list frames |

## 7 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Fix E1 in the frames now, before the prototype? | With the frame fixes after the prototype |
