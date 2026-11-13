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
| Phone | The hub shows the section list; a section opens full screen with a back link; lists are cards whose rows open edit pages (changed Nov 13, see 15.7; was: read-only, editing desktop and tablet) |

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
| 5 | Configuration on the phone | **Changed Nov 13:** editing is allowed on the phone; rows open full-screen edit pages (15.7). Was: hub and read-only lists |
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

## 15 · Configuration sections on phone and tablet (BUILT Nov 13, 2026)

Written for: the product owner, who approves it, and whoever builds or reviews the frames.

Revision of Nov 13, 2026: the owner moved the tablet into this round (open point 4) and kept the defaults for points 1 to 3. **15 frames**: 8 phone and 7 tablet.

### 15.1 Why

The Configuration hub lists nine sections on every size, but only some have a screen. Phone: only **Parameters** (`Phone-14-Configuration-02-Parameters-01-List`). Tablet: **Parameters** and **Services**. Tapping any other section leads nowhere. This adds the missing sections on both sizes, using the existing Parameters frames as the pattern.

### 15.2 The patterns

**Phone** (from `Phone-14-Configuration-02-Parameters-01-List`):

| Part | Spec |
| --- | --- |
| Shell | Phone top bar, role Superadmin (Wahyu Pratama) |
| Header | Overline ADMIN, title **Configuration** (Heading/H1) |
| Breadcrumb | Configuration > *section name* (the way back to the hub) |
| Section card | Card title (Heading/H3) and a Count pill where the section has a count |
| Items | One item per row: the first line is the item name with a status pill or tag on the right; the second line is the detail (Caption, `text-secondary`); dividers between items |
| Pager | Mobile pager when the list is longer than 6 items |
| Editing (changed Nov 13) | Settings **can** be changed on the phone. Every editable row carries a chevron and opens its edit page (15.7); list sections have their Add button in the card head. Fixed validation rules and Formulas stay read-only (no chevron) |

**Tablet** (from `Tablet-14-Configuration-02-Parameters-01-List` and `-03-Services-01-List`):

| Part | Spec |
| --- | --- |
| Shell | Tablet top bar and the collapsed sidebar with Configuration active, role Superadmin |
| Header | Overline ADMIN, title **Configuration** (Display/XL) and **Search settings** on the right |
| Section select | "Section" Select field, full width, showing the open section (section 6.1: on the tablet the sections list becomes a Select) |
| Section card | Card head: title, Count pill and the section's action button (Secondary, for example **Add method**); the description line under it |
| Content | The desktop table with the columns that fit 698 px (see 15.3); settings pages as forms with **Restore defaults** and **Save** |
| Editing | Allowed on the tablet: Add buttons, row menus, pencil icons and Save stay. The Edit dialogs themselves are not drawn for the tablet (they are the same centered dialogs as on desktop) |

### 15.3 Frames

Names follow `Frame_Naming.md`, with the same SS and VV as the desktop frame of each section.

**Phone**, on the Mobile Phone page, row O, to the right of the Parameters frame (x 3570 onward, 510 apart):

| # | Frame | Card content | Items shown |
| --- | --- | --- | --- |
| P1 | `Phone-14-Configuration-03-Services-01-List` | **Services 5** and the line "Quick-select templates on the job order form. A change makes a new version." | TM + Prox + TS + CV (Active, **Default** tag), Prox only, Full analysis, Coking coal v2 (Active), Coking coal v3 (**Draft**), Preparation only. Detail line: "7 parameters, 5 days, v3" |
| P2 | `Phone-14-Configuration-04-Methods_and_standards-01-Matrix` | **Methods and standards 42** and the line "An empty cell means the standard has no method for the parameter." | One item per parameter (TM, IM, Ash, VM, TS, GCV), each with three short rows ASTM / ISO / GB/T and the method number in Data style; "No method" in `text-muted` where a standard has none. Pager 1 / 2. The matrix does not fit 358 px, so it is shown per parameter; the frame keeps the desktop name `01-Matrix` |
| P3 | `Phone-14-Configuration-05-Validation_rules-01-List` | **Validation rules 33** and the line "Fixed rules come from the specification and can't be changed here." | The 9 rules of the desktop list: rule ID (Data style) and what it applies to, with a **Warn** or **Block** tag; detail line = the bounds ("Above 60 %"); the two fixed rules (V-09, V-30) carry a lock icon and "(fixed)" |
| P4 | `Phone-14-Configuration-06-Report_templates-01-List` | **House CoA template** and the line "One template in v1. Activating a version changes new CoAs only." | v3 **Draft**, v2 **Active**, v1 **Archived**; detail line: changed by, date and the note |
| P5 | `Phone-14-Configuration-07-Lookups-01-List` | **Lookups 5**, then the five lists as page **Tabs** in a row that scrolls sideways (Sample conditions 5, Hold reasons 4, Photo tags 3, Lithology kinds 3, Send channels 4) | Sample conditions open: Good, Damaged, Wet, Short, No tag, each with the Active pill; detail line: "Order 1, needs a remark: No" |
| P6 | `Phone-14-Configuration-08-Laboratory-01-Default` | Cards of Key-value rows (stacked): **Laboratory** (logo, name, address, accreditation number, place of issue), **Numbering** and **Branch offices** | Numbering follows the spec: job order `JO-YYYY-NNNN`, batch `B-YYYY-NNNN`, Sample ID `SG.YYMMDD.CCC.BB.NNN`, sample code `CCC.BB.NNN.Lotxx`, CoA `CoA-{job order}-{revision}`; branch `RI` Rapak Indah |
| P7 | `Phone-14-Configuration-09-Security-01-Default` | Cards of Key-value rows: **Sign-in** (lock after 5 failed attempts, for 15 minutes), **Session** (sign out after 30 minutes idle, warn 60 seconds before), **Passwords** (at least 10 characters, a letter and a number, not the email; special character not required), **Links** (reset link valid 60 minutes, invite valid 7 days) | Values as on the desktop frame |
| P8 | `Phone-14-Configuration-10-Formulas-01-View` | **Formulas 5** and the line "Formulas can't be edited in v1. A change comes as a new version with the release notes." | FC (ADB), ADB to DB, DB to DAF, ADB to AR, TM from ADL and RM; first line name and `v1`; detail line the expression in Data style and "Used since 1 Oct 2026" |

**Tablet**, on the Tablet page, row O, to the right of the Services frame (x 5724 onward, 954 apart):

| # | Frame | Card | Columns or content (desktop columns dropped to fit) |
| --- | --- | --- | --- |
| T1 | `Tablet-14-Configuration-04-Methods_and_standards-01-Matrix` | **Methods and standards 42**, **Add method** | Parameter, ASTM, ISO, GB/T: the full matrix fits; the 10 parameters of the desktop frame |
| T2 | `Tablet-14-Configuration-05-Validation_rules-01-List` | **Validation rules 33** | Rule, Applies to, Severity, Bounds, pencil (lock for fixed rules); all 9 rules |
| T3 | `Tablet-14-Configuration-06-Report_templates-01-List` | **House CoA template**, **New version** | Version, Status, Changed by, Date, row menu (the Note column drops) |
| T4 | `Tablet-14-Configuration-07-Lookups-01-List` | **Lookups 5**, **Add value** | The five lists as page Tabs; Order, Value, Needs a remark, Status, row menu |
| T5 | `Tablet-14-Configuration-08-Laboratory-01-Default` | **Laboratory** and **Numbering** cards as forms | Logo with Replace logo; name and address full width; accreditation number and place of issue side by side; the numbering fields in two columns with the spec's new identifiers and the branch row; **Restore defaults** and **Save** |
| T6 | `Tablet-14-Configuration-09-Security-01-Default` | **Sign-in**, **Session**, **Passwords**, **Links** cards as forms | Fields in two columns as on desktop; **Restore defaults** and **Save** |
| T7 | `Tablet-14-Configuration-10-Formulas-01-View` | **Formulas 5** | Name, Expression, Version (Used since moves under the name) |

Not drawn, on purpose: the Edit dialogs (02 variants) on phone and tablet, the Report template New version on phone and tablet, and the hub search on the phone (the tablet header already has the search field).

### 15.4 How it is built

1. `rowO.js` gets phone and tablet branches for the sections, the same way Parameters already has them. It reuses the existing helpers (`configFrame`, `card`, `sectionHead`, `status`, `pager`, Breadcrumb, the tablet Section select).
2. **Add-only run:** a new entry builds only these 15 frames. The other row O frames, including your edits and the reference frames on the pages, are not deleted or rebuilt.
3. Check each frame by screenshot: no clipping, nothing wider than 390 (phone) or 834 (tablet), 44 px touch targets on tabs, pager and buttons.
4. Save the main file: dirty check, backup first, then swap.
5. Docs: build status here, `Frame_Naming.md` entries, memory. No PNG export unless you ask.

### 15.5 Decisions (Nov 13, 2026)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Info note "To change these settings, use a computer or tablet." | **Withdrawn Nov 13:** the phone can edit settings. The note is removed; rows open edit pages (15.7). This replaces open point 5 of section 12 |
| 2 | Methods and standards on the phone | One item per parameter with ASTM, ISO and GB/T rows; the frame name stays `01-Matrix` |
| 3 | Laboratory numbering on phone and tablet | The spec's new identifiers. The desktop Laboratory frame still shows the old lab code `B{batch}-NN` (format mismatch, see the note at the top of this plan) and is **not** changed by this work |
| 4 | Tablet | In this round: the seven missing sections (T1 to T7) |

### 15.6 Build status (Nov 13, 2026)

All 15 frames are built with `library/screens/rowOcfg.js` (run `build-screens.js Ocfg`; add-only, it deletes only its own frames by exact name): 8 phone frames to the right of the Parameters frame, 7 tablet frames to the right of the Services frame. Deployed to the main file (backup `backup/SGSI-LIMS-screens.before-config-phone-tablet.figcraft`). `fit.js` was **not** run on the whole file because it would have grown 90 older frames by 2 to 6 px; only the two tablet frames that needed it (Laboratory, Security) were fitted, with `fitcfg.js` (an `ONLY` name filter).

Deviations from the plan:

- **Tablet Lookups:** the tab row is clipped at the card edge (it scrolls sideways), so "Send channels" is cut off.
- **Phone Validation rules:** the 9 rules are all shown, no pager (as planned); the long rule "Labels printed before Confirm reception" sits close to its Warn tag.
- **Phone Branch offices** is a one-row card (RI, Rapak Indah); the desktop Laboratory frame has no such card yet.
- **Tablet Methods and standards** reuses the desktop table as built (10 parameters); Security reuses the desktop form cards.

### 15.7 Phone edit pages (BUILT Nov 13, 2026)

The owner decided on Nov 13 that settings **can** be changed on the phone. Done the same day: the info note is removed from the 8 phone frames, every editable row has a chevron, and the list sections have their Add button (Add service, Add, New version, Add value). Fixed rules (V-09, V-30) and Formulas have no chevron. Backup before that change: `backup/SGSI-LIMS-screens.before-config-phone-chevrons.figcraft`.

This section plans the pages the rows open.

**Pattern** (from `Phone-13-Users-03-User_form-01-Add_user`): phone top bar; Breadcrumb with three levels (Configuration > *section* > *item*); title (Heading/H1); one form card with touch-size fields (44); a sticky bottom bar with **Cancel** (Secondary) and the save action (Primary), touch size. The desktop dialogs give the fields, so the three sizes ask for the same data.

| # | Frame | Opened from | Title | Fields (as the desktop dialog) | Save button |
| --- | --- | --- | --- | --- | --- |
| E1 | `Phone-14-Configuration-02-Parameters-02-Edit` | The Ash row on Parameters | Edit parameter | Name *, Code (disabled), Unit, Group, Measured basis, Decimals, Typical range from / to, note "The typical range feeds rule V-31 (warn).", switches Qualified values allowed and Active | Save |
| E2 | `Phone-14-Configuration-03-Services-02-Edit` | The Coking coal v3 row | Edit service | Name *, Turnaround target (days), Status; the parameter pills in groups (Moisture, Proximate, Sulfur, Calorific, Coking coal), 16 selected; switch Default for new job orders; note "Saving makes version 3. Job orders keep the version they used." | Save as version 3 |
| E3 | `Phone-14-Configuration-04-Methods_and_standards-02-Edit` | The Ash row | Ash methods | One group per standard (ASTM, ISO, GB/T): Method and Edition side by side, Repeatability r and Reproducibility R; ASTM shows the new edition D3174 2023; note "The 2012 edition stays on results entered before." | Save |
| E4 | `Phone-14-Configuration-05-Validation_rules-02-Edit` | The V-31 Ash (ADB) row | Edit rule V-31 | Applies to (read-only: Ash (ADB)); Severity as a Segmented control Warn / Block; Lower and Upper bound (%); Message shown (textarea); switch Active | Save |
| E5 | `Phone-14-Configuration-06-Report_templates-02-New_version` | The v3 Draft row (or New version) | Version 3 (draft) | Title, Form code, Statement, Terms line; a **Preview certificate** button (Secondary, full width) that opens the CoA preview | Save draft, and **Activate** as a second action in the bar's menu |
| E6 | `Phone-14-Configuration-07-Lookups-02-Edit` | The Wet row in Sample conditions | Edit condition | Value *, Order, switches Needs a remark and Active | Save |
| E7 | `Phone-14-Configuration-08-Laboratory-02-Edit` | Any row of the Laboratory, Numbering or Branch offices cards | Laboratory | The whole settings page as one form, in three groups: Laboratory (logo with Replace logo, name, address, accreditation number, place of issue), Numbering (job order, batch, Sample ID, sample code, CoA, with the note "New numbers follow the pattern; existing numbers never change."), Branch offices (code RI, name Rapak Indah, **Add branch**); the page opens scrolled to the tapped group | Save, with **Restore defaults** as a Ghost link above the bar |
| E8 | `Phone-14-Configuration-09-Security-02-Edit` | Any row of the four Security cards | Security | One form in four groups: Sign-in (lock after 5 attempts, lock for 15 minutes), Session (30 minutes, warn 60 seconds), Passwords (minimum length 10; checkboxes A letter and a number, Not the email, A special character), Links (reset 60 minutes, invite 7 days) | Save, with **Restore defaults** as above |

Placement: Mobile Phone page, a second row under the Configuration row (y + 1,800), each edit page under its list frame where there is one (E1 under Parameters, E2 under Services, and so on).

Not drawn: the empty Add forms (Add service, Add method, Add value: the same pages with empty fields and the title "Add ..."), Formulas (view only), and the tablet edit dialogs (the tablet uses the desktop dialogs).

**Also changed with this build:** the existing `Phone-14-Configuration-02-Parameters-01-List` gets the same chevrons on its rows and an **Add parameter** button in the card head, so all phone sections behave alike (see open point 15.8-1).

How it is built: the phone edit pages go into `rowOcfg.js` as `ss-02` frames (add-only, deleted and rebuilt by exact name); the Parameters list change is one patch on that frame. Backup, dirty check and swap as before.

### 15.8 Open points for the edit pages

| # | Question | Default |
| --- | --- | --- |
| 1 | Change the existing Parameters phone list (chevrons, Add parameter) | Yes, so every section works the same way |
| 2 | Settings pages (Laboratory, Security): one form for the whole page, opened at the tapped group, or a small page per group | One form for the whole page (fewer frames, same as desktop) |
| 3 | Report template: Activate on the phone | Yes, from the bottom bar's menu, with the same confirmation as on desktop |
| 4 | Draw the empty Add forms too | No; they are the edit pages with empty fields |

### 15.9 Build status of the edit pages (Nov 13, 2026)

All 8 edit pages (E1 to E8) and the Parameters phone list (chevrons, **Add parameter**) are built with `library/screens/rowOcfge.js` (`build-screens.js Ocfge`, add-only, rebuilds its own 9 frames by exact name) on the Mobile Phone page, in a row 1,800 px under the Configuration row, each page under its list frame. Backups: `before-config-phone-chevrons` and `before-config-phone-edit`. The four open points of 15.8 were used with their defaults.

Deviation: **Activate version 3** is a full-width Secondary button in the form card (under Preview certificate), not a menu in the bottom bar. Restore defaults on Laboratory and Security is a full-width Ghost button at the end of the form, not above the bar.
