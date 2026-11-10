# Admin screen plan: users, audit log, configuration

> **FORMAT MISMATCH (flagged Nov 10, 2026).** The lab's sample identifiers changed (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code `CCC.BB.NNN.Lotxx` replace the lab code `B{batch}-NN`, and the client's own name is now the Client reference. The rules in this plan follow the new format, but the built frames, the prototype and the demo values here (`BNM-3507`, `B0410-07`) **still show the old format and are not being rebuilt**. **Where they disagree, the spec wins.** Register of mismatches: `../Project/Sample_Identifiers_Plan.md`.

Written Nov 6, 2026. **Status: BUILT Nov 6, 2026** (section 14). Modules 13 Users, 14 Configuration, 15 Audit_log (the ADMIN group of the sidebar), canvas row **O**. Builds on spec S-02 (users), S-14 (audit log), S-15 (configuration hub), sections 8.1 and 8.2 (roles and permissions), 11 (parameters), 12.3 (validation rules), D-11, D-16, D-23, D-29 (`../Project/Coal_LIMS_Development_Spec.md`), the job order parameter pills and quick-select templates (`../Job Order/Job_Order_Screen_Plan.md`), the reception conditions and hold reasons (`../Batch/Batch_Screen_Plan.md`), the App screens' security defaults (`../App/App_Screen_Plan.md`, section 14) and the Clarity LIMS videos 04 (System Settings) and 07 (Add a New User), frames in `../../research/clarity-lims/screenshots/04-system-settings/` and `07-add-user/`.

## 1 · Goal

The screens that keep the system itself in order: who may sign in and what they may do, what changed and who changed it, and the lab's own lists and settings (parameters, services, methods, rules, templates, codes) that the job order, batch and report screens read.

## 2 · What the references show

| Clarity LIMS | Here |
| --- | --- |
| Users grouped by role in collapsible lists with counts; the user's details on the right (name, title, email, phone, username, **roles as chips**, login and password, status Active / Archived) | A Users **table** with a Role filter and a **Roles** tab; a **user page** for the details; add and edit in a centered dialog (owner rule: no side sheets) |
| New user: the system emails login instructions; the user sets a password against listed rules | Same: **invite by email**, the user sets the password on the App screens' Set password page (invite) |
| Roles & permissions: role list, assigned permissions as chips, "What these permissions mean" | A read-only **Roles** tab: the permission grid of spec 8.2 with a line per permission explaining it. Roles are fixed in v1 |
| System settings: a left list of sections (Application properties, Banner, Export logs, Tokens, IP whitelisting, Roles & permissions); a searchable property list; details with Save / Cancel / Restore defaults | **Configuration hub**: a searchable list of sections on the left, the section on the right; each list item opens a centered dialog with Save / Cancel; settings pages have **Restore defaults** |
| AssayNet LIMS 4 (spec 4.2): one searchable configuration page | The hub's search finds settings and list items across sections |

## 3 · Who sees what

From spec 8.2 and 8.3.

| Screen | Superadmin (Wahyu Pratama) | Supervisor (Hendra Wijaya), Manager (Bambang Sutrisno) | Others |
| --- | --- | --- | --- |
| Users | Full: add, edit, deactivate, reset, unlock (`user.manage`) | — | — |
| Configuration | Full (`config.write`) | — | — |
| Audit log | Read, export | Read, export (`audit.read`) | — |

Everyone else sees No access on these URLs (row J). Every change made here is written to the audit log.

## 4 · Users (module 13)

### 4.1 Users list `/users`

```
ADMIN
Users                                                             [+ Add user]
[Users 12] [Roles]                                                       (Tabs)
┌ Table card ──────────────────────────────────────────────────────────────────────┐
│ [Search name or email]  [Role ▾]   All 12 | Active 9 | Invited 1 | Inactive 1 | Locked 1 │
│ Name                     Email               Roles                 Status   Last sign-in │
│ (WP) Wahyu Pratama       wahyu@sgsi.co.id    [Superadmin]          Active   Today 08:02  │
│ (ML) Maya Lestari        maya@sgsi.co.id     [Lab Admin]           Active   Today 07:45  │
│ (YH) Yusuf Hidayat       yusuf@sgsi.co.id    [Preparation][Analyst] Active  4 Nov 2026   │
│ (BP) Bagus Prasetyo      bagus@sgsi.co.id    [Analyst]             Locked   Today 07:58  │
│ (SA) Sari Anggraini      sari.a@sgsi.co.id   [Analyst]             Invited  —            │
│ …                                                                pager               │
└──────────────────────────────────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Tabs | **Users** (count) and **Roles**, the library Tab (page tabs, owner rule for list switches) |
| Toolbar | Search (name or email), Role select (all seven roles), status Filter chips: All, Active, Invited, Inactive, Locked |
| Columns | **Name** (avatar 40 and name), **Email**, **Roles** (one Role badge per role; roles add up, D-02), **Status** (pill: Active, Invited, Inactive, Locked), **Last sign-in**, **Created**, row menu |
| Row menu | Edit, Send password reset, Resend invite (invited), Unlock (locked), Deactivate / Reactivate |
| Row click | Opens the user page |
| No Company column | Staff users have no company in Core; the Client role is dormant (spec 8.2 rules, D-35), so SIM Lab's Company column and the form's Company field are left out |

### 4.2 Roles tab (read-only)

The permission grid of spec 8.2 as a table: one row per permission (plain-language name, for example "Enter analysis values" for `result.write`), one column per role, a check where the role has it, and a short "What it allows" line under each permission name. A note: "Roles are fixed in v1. Ask for a change through the product owner." Role editing is next goal.

### 4.3 User page `/users/:id`

```
Users > Hendra Wijaya
(HW 64) Hendra Wijaya, S.T.   [Supervisor]  Active                 [Edit] [⋯]
┌ Details ────────────────────┐ ┌ Roles and permissions ─────────────────────────┐
│ Email   hendra@sgsi.co.id   │ │ [Supervisor]                                   │
│ Title   Laboratory Supervisor│ │ Can approve results and RoAs (next goal),     │
│ Phone   +62 811 5550 0731   │ │ assign analysts, read the audit log, sign     │
│ Created 12 Oct 2026, Wahyu P.│ │ reports …  (list from 8.2)                    │
└─────────────────────────────┘ │ Signatory: yes (report.sign)                   │
┌ Security ───────────────────┐ └────────────────────────────────────────────────┘
│ Status       Active         │ ┌ Recent activity ──────────────────────────────┐
│ Last sign-in Today, 07:12   │ │ Exported the audit log  Today 10:20           │
│ Password     changed 2 Nov  │ │ Signed in               Today 07:12           │
│ Failed tries 0              │ │ …                         [Open in audit log]  │
│ [Send password reset]       │ └────────────────────────────────────────────────┘
└─────────────────────────────┘
```

| Card | Content |
| --- | --- |
| Header | Avatar 64 (round, initials), name with degree, Role badges, status pill; **Edit** (Secondary) and a menu (Send password reset, Deactivate) |
| Details | Email, **Title** (printed on RoA and CoA when the user signs, spec 8.1), Phone, Created (date and by whom) |
| Roles and permissions | The user's roles, then the permissions they give as a short list; **Signatory** yes/no (from `report.sign`) |
| Security | Status, last sign-in, password last changed, failed attempts; **Send password reset**; for a locked user an Inline alert (Warning) "Locked after 5 failed attempts until 10:42" with **Unlock**; for an invited user "Invite sent 5 Nov 2026, expires 12 Nov" with **Resend invite** |
| Recent activity | The last 5 audit entries by this user, **Open in audit log** (filtered to the user) |

### 4.4 Add, edit, deactivate

| Dialog | Spec |
| --- | --- |
| **Add user** (Dialog lg) | Name *, Email * (unique), Title (printed), Phone; **Roles** * as a checkbox list, each with its one-line description (several allowed); note "We email an invite. It works for 7 days." **Send invite** (Primary). Errors: email already used |
| **Edit user** | The same fields; email read-only after the first sign-in; **Save** |
| **Deactivate** (Destructive sm) | "Deactivate Bagus Prasetyo? He can no longer sign in. His work and history stay." **Deactivate**. Reactivate from the row menu or the page |
| **Last Superadmin** | Deactivating or removing the Superadmin role from the only active Superadmin is blocked: Inline alert in the dialog "There must be at least one active Superadmin." and the action disabled |
| Phone | Add user as a full-screen form with a sticky Send invite |

## 5 · Audit log (module 15) `/audit`

```
ADMIN
Audit log                                                          [Export CSV]
┌ Table card ──────────────────────────────────────────────────────────────────────┐
│ [Search record ID]  [Date: Last 7 days ▾] [User ▾] [Record type ▾] [Action ▾]       │
│ When            User              Action          Record              Changes        │
│ Today 10:42     (FH) Fitri H.     Updated         Sample BNM-3507     Ash ADB  ▾     │
│   ┌ Field        Before      After ┐                                                 │
│   │ Ash (ADB)    5.40        5.42  │                                                 │
│   └──────────────────────────────┘                                                 │
│ Today 09:12     (ML) Maya L.      Published       CoA-JO-2026-0131-2   —             │
│ Today 08:31     (WP) Wahyu P.     Changed setting Validation rule V-31  1 field ▾    │
│ Today 07:58     (BP) Bagus P.     Account locked  User Bagus Prasetyo   —            │
│ …                                                                  pager            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Filters | Search by record ID (sample, batch, job order, report, user); Date (Today, Last 7 days, Last 30 days, custom range); User; Record type (Job order, Batch, Sample, Result, Report, Master data, User, Configuration, Sign-in); Action (Created, Updated, Deleted, Status changed, Published, Signed in, Sign-in failed, Account locked, Exported, Changed setting) |
| Columns | **When** (date and time), **User** (avatar 24 and name), **Action**, **Record** (type and ID, a link to the record), **Changes** ("Ash ADB" or "3 fields", with an expand caret) |
| Expanded row | A diff table: Field, Before, After (before struck through in muted text, after in foreground); a relaxed segregation-of-duties approval shows a Warning tag "Relaxed approval" (spec 8.2 rules) |
| Read-only | Nothing can be edited or deleted here |
| Export CSV | Exports the filtered rows (all pages) |
| Filtered by record | Opened from the Sample history Audit link or a user page: the record or user filter is pre-set and shown as a removable Filter chip |
| Tablet, phone | Tablet: the Changes column folds into the expanded row; phone: cards (when, user, action, record), filters in a Bottom sheet |
| Retention | Kept for good (spec D-29, ISO/IEC 17025); see open point 6 |

## 6 · Configuration (module 14) `/config`

### 6.1 Hub

```
ADMIN
Configuration                                              [Search settings… ]
┌ Sections ────────────┐ ┌ (the selected section) ─────────────────────────────┐
│ LAB DATA             │ │                                                      │
│ Parameters       34  │ │                                                      │
│ Services          5  │ │                                                      │
│ Methods and standards│ │                                                      │
│ Validation rules 33  │ │                                                      │
│ Lookups           5  │ │                                                      │
│ DOCUMENTS            │ │                                                      │
│ Report templates  1  │ │                                                      │
│ Laboratory           │ │                                                      │
│ SYSTEM               │ │                                                      │
│ Security             │ │                                                      │
│ Formulas (view)      │ │                                                      │
│ NEXT GOAL            │ │                                                      │
│ Result tabs   (tag)  │ │                                                      │
│ Field definitions    │ │                                                      │
└──────────────────────┘ └──────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Overview (no section chosen) | A grid of section cards (title, one-line description, count, "Last changed 4 Nov by Wahyu Pratama") |
| Sections list (left, 260) | Grouped LAB DATA, DOCUMENTS, SYSTEM; each row a Menu item with its count; **Next goal** sections (Result tabs and fields, Field definitions) listed with a "Next goal" tag and not clickable |
| Search | Finds sections, settings and list items ("ash" finds the Ash parameter, the Ash range rule and the Ash method); results grouped by section, each opens its place |
| Saving | List items open a centered dialog (Save / Cancel); settings pages have **Save** and **Restore defaults** at the bottom; every save writes an audit entry; a toast confirms |
| Tablet | The sections list becomes a Select above the content |
| Phone | The hub shows the section list; a section opens full screen with a back link; lists are read-only cards (editing is desktop and tablet) |

### 6.2 Sections

| Section | List | Item dialog (Edit) |
| --- | --- | --- |
| **Parameters** | Table: Code (TM, IM, Ash …), Name, Unit, Group (Moisture, Proximate, Sulfur, Calorific, Ultimate, Physical, Ash, Chemical, Coking coal), Measured basis, Decimals, Methods (ASTM, ISO, GB/T tags), Legacy ID (P###), Active; group chips and search | Name, code (read-only after use), unit, group, measured basis, decimals, typical range (links to V-31), qualified values allowed (`<0.01`), active switch; parameters in use are deactivated, never deleted |
| **Services** (quick-select templates) | TM + Prox + TS + CV (default), Prox only, Full analysis, Coking coal, Preparation only: name, parameter count, turnaround target, status (Draft, Active, Archived) | Name, parameters as **Parameter pills** in groups (the job order form's picker), turnaround target (days), status; "Default for new job orders" switch. A change makes a new version; job orders keep the version they used |
| **Methods and standards** | A matrix: parameter rows × ASTM, ISO, GB/T columns, each cell the method number and edition (ASTM D3174-12), empty where the standard has no method (drives "No ASTM method" on the job order form) | Standard, method number, edition, title, repeatability r and reproducibility R (optional); a new edition is added, the old one kept for older results |
| **Validation rules** | The V-rules that have settings: V-11 and V-31 plausible ranges per parameter, V-27, V-28, V-32; columns Rule, Applies to, Severity (Warn / Block), Bounds, Active; fixed rules listed read-only | Severity, lower and upper bound, message shown to the user |
| **Lookups** | The short lists screens use: Sample conditions (Good, Damaged, Wet, Short, No tag), Hold reasons, Photo tags, Lithology kinds, Send channels; each with its values, order and active | Value, order, active; "needs a remark" switch for conditions |
| **Report templates** | House CoA template (v1 has one): version, status (Draft, Active, Archived), changed by, date; per-client templates are next goal (D-11) | **New version**: the template's text fields (title, statement, terms line, footer, form code), shown in a live preview of the CoA page from Reports; **Activate** replaces the active version for new CoAs only |
| **Laboratory** (settings page) | — | Lab name, address, logo, accreditation number, place of issue ("Issued at Samarinda"), numbering patterns (job order `JO-YYYY-NNNN`, batch `B-YYYY-NNNN`, Sample ID `SG.YYMMDD.CCC.BB.NNN`, sample code `CCC.BB.NNN.Lotxx`, CoA `CoA-{job order}-{revision}`), branch offices with their codes (`RI` Rapak Indah; spec 6.1) |
| **Security** (settings page) | — | Lock after N failed attempts (5) for M minutes (15); idle sign-out (30 min) and warning (60 s); password rules (10 characters, a letter and a number, not the email); reset link (60 min) and invite (7 days) validity. Defaults from the App plan |
| **Formulas** (view only) | FC by difference, basis conversions (ADB to DB, DAF, AR), TM from ADL and RM: name, expression, version, used since | None: editing is disabled in Core (S-15) |

## 7 · Library

No new component sets are needed. Used: Tab, Filter chip, Search, Select, Checkbox (role list), Switch, Role badge, Avatar, Status badge, Tag, Menu item (sections list), Parameter pill (services), Key-value row, Inline alert, Dialog, Toast, Pager, Empty state, Card KPI (hub overview counts optional). Patterns drawn in the generator: the status pill (Active, Invited, Inactive, Locked, as on the master data lists), the permission grid, the audit diff table, the methods matrix.

## 8 · Frames (row O)

| Module | SS | Screen | VV Variant | Sizes | Persona | Content |
| --- | --- | --- | --- | --- | --- | --- |
| 13 Users | 01 | Users_list | 01 Default | D, T, P | Wahyu Pratama | 12 users, statuses mixed |
| | | | 02 Roles | D | Wahyu Pratama | Permission grid |
| | 02 | User_detail | 01 Default | D, T, P | Wahyu Pratama | Hendra Wijaya, Supervisor, signatory |
| | | | 02 Locked | D | Wahyu Pratama | Bagus Prasetyo, Unlock |
| | | | 03 Invited | D | Wahyu Pratama | Sari Anggraini, Resend invite |
| | 03 | User_form | 01 Add_user | D, P | Wahyu Pratama | Dialog with the role checklist (phone: full-screen form) |
| | | | 02 Edit_user | D | Wahyu Pratama | Yusuf Hidayat, two roles |
| | | | 03 Deactivate_confirm | D | Wahyu Pratama | Destructive dialog |
| | | | 04 Last_superadmin | D | Wahyu Pratama | Blocked, alert |
| 15 Audit_log | 01 | Audit_log | 01 Default | D, T, P | Hendra Wijaya | Last 7 days |
| | | | 02 Row_expanded | D | Hendra Wijaya | Ash ADB diff open |
| | | | 03 Filtered_by_record | D | Bambang Sutrisno | Record BNM-3507 chip |
| | | | 04 Filters | P | Hendra Wijaya | Bottom sheet |
| 14 Configuration | 01 | Configuration_hub | 01 Overview | D, T, P | Wahyu Pratama | Section cards |
| | | | 02 Search | D | Wahyu Pratama | "ash" across sections |
| | 02 | Parameters | 01 List | D, T, P | Wahyu Pratama | 34 parameters, group chips |
| | | | 02 Edit | D | Wahyu Pratama | Ash |
| | 03 | Services | 01 List | D, T | Wahyu Pratama | 5 templates |
| | | | 02 Edit | D | Wahyu Pratama | Coking coal, pills |
| | 04 | Methods_and_standards | 01 Matrix | D | Wahyu Pratama | Parameters × ASTM, ISO, GB/T |
| | | | 02 Edit | D | Wahyu Pratama | New ASTM edition |
| | 05 | Validation_rules | 01 List | D | Wahyu Pratama | Ranges |
| | | | 02 Edit | D | Wahyu Pratama | V-31 Ash bounds |
| | 06 | Report_templates | 01 List | D | Wahyu Pratama | Versions |
| | | | 02 New_version | D | Wahyu Pratama | Fields and preview |
| | 07 | Lookups | 01 List | D | Wahyu Pratama | Sample conditions open |
| | | | 02 Edit | D | Wahyu Pratama | Condition "Wet" |
| | 08 | Laboratory | 01 Default | D | Wahyu Pratama | Lab identity and numbering |
| | 09 | Security | 01 Default | D | Wahyu Pratama | Lockout, timeout, passwords |
| | 10 | Formulas | 01 View | D | Wahyu Pratama | Read-only list |

Totals: 29 desktop, 6 tablet and 7 phone frames: **42 frames**.

## 9 · Demo data

- Users (12): Wahyu Pratama (Superadmin), Rina Kartika (CSO), Dedi Kurniawan and Yusuf Hidayat (Preparation; Yusuf also Analyst), Fitri Handayani and Bagus Prasetyo (Analyst; Bagus locked), Maya Lestari (Lab admin), Hendra Wijaya, S.T. (Supervisor), Ir. Bambang Sutrisno, M.T. (Manager), Sari Anggraini (Analyst, invited), Joko Santoso (Preparation, inactive), Dewi Lestiani (CSO). Emails `firstname@sgsi.co.id`.
- Audit entries from the built screens: Fitri's value on BNM-3507, Dedi confirming reception of B-2026-0417, Maya publishing CoA-JO-2026-0131-2, Wahyu changing V-31, Bagus locked after 5 failures, Hendra exporting the audit log.
- Parameters, groups and templates from the job order form (34 pills, 9 groups, 5 templates); methods from the Reports preview (ASTM D3302, D3173, D3174, D3175, D4239, D5865).

## 10 · Data each screen needs (v1)

`users`, `user_roles`, `roles` and `permissions` (seeded, read-only in v1), `audit_log` (when, user, action, table, record, before JSON, after JSON, flags), `parameters`, `parameter_groups`, `services` and `service_parameters` (versioned), `methods` (standard, number, edition, parameter), `validation_rules`, `lookups` and `lookup_values`, `report_templates` (versioned), `settings` (laboratory, security, numbering), `formulas` (versioned, read-only).

## 11 · Design rules that apply

Card anatomy (padding 16, Card head 32); centered dialogs (lg for Add user, md for list items, sm for confirmations), Bottom sheet or full-screen form on the phone; Button sizes lg 40 (page actions), md 32 (card heads, dialogs), sm 28 (inside rows); page **Tabs** for list switches (Users / Roles), Segmented control for two-way settings (Warn / Block); avatars round, 40 in tables; Elevation scale for menus and popovers (md); no " · " between values; no count subtitles under titles; role sidebar per persona (Superadmin shows the ADMIN group with all three items; Supervisor and Manager show Audit log only).

## 12 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Invite or an initial password typed by the Superadmin (S-02 allows both) | Invite by email only |
| 2 | Can roles be edited in v1 | No; the Roles tab is read-only |
| 3 | Delete users | Never; deactivate, keep history, reactivate allowed |
| 4 | Can the Superadmin change a user's email | Yes until the first sign-in, then only through support (audit entry) |
| 5 | Configuration on the phone | Hub and read-only lists; editing on desktop and tablet |
| 6 | Audit log retention | Kept for good; exports for older periods |
| 7 | Report template editing | Text fields with a live preview; no visual designer |
| 8 | Service and template changes | A new version; job orders and CoAs keep the version they used |
| 9 | Parameters in use | Deactivated, never deleted; code read-only after first use |

## 13 · Build steps (after go)

1. `library/screens/rowO.js` builds row O (modules 13, 14, 15) with the role sidebar; `build-screens.js` gets the O entry after N.
2. `naming.js` needs no rules (final names); `cards.js` and `fit.js` as usual.
3. Deploy (dirty check, backup, swap), commit. No export unless asked.
4. Docs: build status here; spec S-02, S-14, S-15 v1 notes; `Frame_Naming.md` modules 13 to 15; Navigation plan; README.

## 14 · Build status (Nov 6, 2026)

All 42 frames are built on row **O** with `library/screens/rowO.js` (modules 13, 14, 15, final names, role sidebar per persona). The open points of section 12 were used with their defaults. No library changes were needed. Deployed to the main file (backup `backup/SGSI-LIMS-screens.before-admin.figcraft`).

Deviations from the plan:

- **Users list:** shows 10 of the 12 demo users with a pager (Joko Santoso and Dewi Lestiani are on page 2).
- **Role options** in Add user and Edit user are tiles (checkbox, role, one-line description), two per row, the selected ones tinted.
- **Last Superadmin:** the destructive dialog shows the Error alert and a dimmed **Remove role** button (the Dialog footer button has no disabled override).
- **Audit log:** the Changes column carries a caret for rows with a diff; the expanded row shows Field, Before (struck through) and After, with a note naming the screen the change came from. Filtered_by_record also opens the first row.
- **Configuration sections list** is a card of rows (not Menu items), with counts and a "Next goal" pill for the two sections that are not in v1.
- **Report template version** shows the fields above a full-size preview of the certificate (the Reports drawing), not side by side.
- **Tablet and phone:** Users list, user page (tablet, phone), Add user (phone, full screen), Audit log (tablet, phone, phone filters), Configuration hub (tablet, phone), Parameters (tablet, phone) and Services (tablet), as planned.
