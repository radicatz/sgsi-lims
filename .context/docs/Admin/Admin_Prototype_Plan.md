# Admin — Prototype Plan

> **FORMAT MISMATCH (flagged Nov 10, 2026).** The lab's sample identifiers changed (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code `CCC.BB.NNN.Lotxx` replace the lab code `B{batch}-NN`, and the client's own name is now the Client reference. This plan, the prototype it describes and the sample values in it (`BNM-3507`, `B0410-07`) **still show the old format and are not being rebuilt**. **Where they disagree, the spec wins.** Register of mismatches: `../Project/Sample_Identifiers_Plan.md`.

Written Nov 6, 2026. **Status: plan, waiting for go.** Phase 6.

This is part of prototype v2. The shared decisions, review bar, shell, rules and checks are in `../Prototype/Prototype_Plan.md`. The screens are specified in `Admin_Screen_Plan.md`.

## 1 · Frames

Modules 13 to 15, 42 frames. D desktop, T tablet, P phone.

| Module | Screen | States (sizes) |
| --- | --- | --- |
| 13 Users | 01 Users_list | Default (D T P), Roles (D) |
| | 02 User_detail | Default (D T P), Locked, Invited (D) |
| | 03 User_form | Add_user (D P), Edit_user, Deactivate_confirm, Last_superadmin (D) |
| 14 Configuration | 01 Configuration_hub | Overview (D T P), Search (D) |
| | 02 Parameters | List (D T P), Edit (D) |
| | 03 Services | List (D T), Edit (D) |
| | 04 to 10 | Methods_and_standards (Matrix, Edit), Validation_rules (List, Edit), Report_templates (List, New_version), Lookups (List, Edit), Laboratory, Security, Formulas (D) |
| 15 Audit log | 01 Audit_log | Default (D T P), Row_expanded, Filtered_by_record (D), Filters (P) |

## 2 · Screens and what they do

What the frames show, and what the prototype does with it.

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Users | `#/users` | Tabs **Users** and **Roles**. **Add user** opens a dialog: name, email, title (printed on reports), phone, role tiles, **Send invite**. Search, Role select. Chips All, Active, Invited, Inactive, Locked. Row menu: Edit, Send password reset, Resend invite, Unlock, Deactivate or Reactivate. The Roles tab is the read-only permission grid |
| User page | `#/users/:id` | **Edit**, **Send password reset**, ⋯. The Locked alert with Unlock; the Invited alert with **Resend invite**. **Open in audit log** opens the Audit log filtered by this user. The Deactivate dialog. The Last Superadmin dialog, with the Error alert and **Remove role** blocked |
| Audit log | `#/audit` | Search by record ID; Date, User, Record type and Action selects; **Export CSV**. Rows with a diff expand to Field, Before and After. Filtered by record: a removable chip ("Record: BNM-3507 6") and **Clear**. Phone: a Filters sheet. Supervisor and Manager read and export |
| Configuration hub | `#/config` | **Search settings** finds settings and list items across sections (the Search frame: "ash"). The section list with counts and "Next goal" rows |

**Configuration sections:**

| Section | Route | What the prototype does |
| --- | --- | --- |
| Parameters | `#/config/parameters` | Group chips with counts, **Add parameter**, Search. Edit dialog: name, code, unit, group, measured basis, decimals, typical range, **Qualified values allowed**, **Active** |
| Services | `#/config/services` | **Add service**. Edit dialog: name, turnaround target, status, parameter pills, **Default for new job orders**, **Save as version 3** |
| Methods and standards | `#/config/methods` | Matrix; **Add method**; new edition dialog (standard, method, edition, title, repeatability, reproducibility; **Add edition**) |
| Validation rules | `#/config/rules` | Pencil per rule; edit dialog with **Warn / Block**, bounds, **Active** |
| Report templates | `#/config/templates` | **New version**: title, form code, and the certificate preview |
| Lookups | `#/config/lookups` | Tabs Sample conditions, Hold reasons, Photo tags, Lithology kinds, Send channels. **Add value**. Edit dialog: value, order, **Needs a remark**, **Active** |
| Laboratory | `#/config/laboratory` | Name, accreditation, place of issue, number formats, **Replace logo**, **Restore defaults**, **Save** |
| Security | `#/config/security` | Lock after failed attempts, lock time, sign-out after inactivity, warning time, password rules, link and invite validity; **Restore defaults**, **Save** |
| Formulas | `#/config/formulas` | View only |

## 3 · Configuration feeds the rest of the prototype

Changes here are used where the data is shared, so a reviewer can see the effect.

| Change | Shows in |
| --- | --- |
| A parameter or service | New job order pills and quick select (Job order plan) |
| A validation rule | Analysis tab warnings and blocks (Batch plan) |
| A lookup value (condition, hold reason, photo tag, send channel) | Reception, Mark sent (Batch, Job order and Reports plans) |
| Security values | Sign in lock, Session timeout, Set password rules (App plan) |
| Laboratory number formats | The next job order, batch and CoA numbers |
| A new user | Can be signed in as, after Set password (flow AP4) |

## 4 · Links to other groups

| From | To |
| --- | --- |
| Sample history **Audit** (Search plan), job order History tab (Job order plan) | Audit log filtered by record |
| Add user, Send password reset | Set password, invite or reset (App plan) |
| Every change made in the demo | Audit log entries |

## 5 · Gaps

| Item | Prototype |
| --- | --- |
| Row menus drawn closed (users, parameters, services, report templates, lookups) | Users as listed above; the others: Edit, Deactivate or Activate |

## 6 · Flows

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| AD1 | Add and invite a user | Superadmin | Users → **Add user** → role tiles → **Send invite** → Invited |
| AD2 | Lock, deactivate, last Superadmin | Superadmin | Bagus Prasetyo locked → Unlock; deactivate; remove Superadmin from Wahyu Pratama → blocked |
| AD3 | Audit trail | Supervisor | Audit log → filter by user → expand a row → **Export CSV** |
| AD4 | Configuration feeds the app | Superadmin | Hub search "ash" → Parameters edit; Lookups → add a condition → Reception shows it; Security timeout → Session timeout uses it |

## 7 · Demo data

| Item | Values |
| --- | --- |
| Users | The ten accounts of the frames (12 in the list with page 2: Joko Santoso and Dewi Lestiani). Yusuf Hidayat holds two roles, Bagus Prasetyo is locked, Sari Anggraini is invited |
| Audit | Seeded entries of the Audit log frames, plus every change the reviewer makes |
| Configuration | The parameters, services, methods, rules, templates, lookups and settings of the frames |
