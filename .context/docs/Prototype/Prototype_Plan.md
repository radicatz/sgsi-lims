# SGSI LIMS — Clickable Prototype Plan (v2)

Written Nov 6, 2026. **Status: plan, waiting for go.**

This plan replaces `../Job Order/Job_Order_Prototype_Plan.md`, which moves to `../archive/` when the build starts. That plan covered one module, and its version 31 was built before the FigCraft library rebuild (Oct 30). Its sections 13 and 14 were never built. They are covered here, because the new build follows the frames as they are today.

The plan was written from the frames themselves, not only from the screen plans. On Nov 6 every frame in the main file (`design/figcraft/SGSI-LIMS-screens.figcraft`) was read layer by layer: its buttons, tabs, fields, menus, dialogs and sheets. Section 5 lists what each screen has to do. Section 7 lists what the frames leave open or show differently from one module to the next.

## 1 · Goal

The lab can click through the whole v1 app on a laptop, a tablet and a phone, as any of the seven roles, before production code is written. The prototype copies the built frames (rows A to O) and adds no new design.

The prototype is done when a reviewer can follow every flow in section 9 from start to end at 1440, 834 and 390 px without being told where to click.

## 2 · Decisions

| Question | Recommendation | Why |
| --- | --- | --- |
| Patch version 31 or rebuild? | **Rebuild** as version 2. Reuse version 31's logic where it still holds: parameter rules and dependants, standards and methods, coverage tags, sample states, reception and preparation rules, paste parsing | Version 31 uses the old pen.dev styles, " · " joins, side sheets and the old tab order, and it has none of the Oct 30 to Nov 6 screens. Patching it would mean touching almost every line |
| Where does it live? | The existing artifact https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo, updated in place so the link the lab has keeps working. Version 31 stays in the artifact's history and as `.context/prototype/archive/job-order-prototype-v31.html` | One link |
| When does the lab see it? | During the build, each phase goes to a **separate private preview artifact** that only you see. The shared link is updated only after your go at the end | The shared link should not change halfway through a module |
| Stack | As in version 31: React 18.3.1 and htm 3.1.1 from cdnjs and unpkg, no build step. `build.py` inlines the files into one HTML | Proven on the artifact host |
| Components | `prototype/src/ui/` holds **one React component per library set, with the same property names**: `Button {type, size: sm/md/lg/touch, tone}`, `IconButton`, `LinkButton`, `Tabs` with Count pill, `SegmentedControl`, `FilterChip`, `Dialog {size: sm/md/lg, destructive}`, `BottomSheet`, `Card` (padding 16, head 32), `StatusBadge`, `Tag`, `RoleBadge`, `Avatar` (24 to 64, round), `TextField`, `PasswordField`, `Select`, `DateField`, `Search`, `Checkbox`, `Radio`, `Switch`, `ParameterPill`, `DropZone`, `Menu`, `Table` and its cells, `Breadcrumb`, `Stepper`, `Pager`, `StickyActionBar`, `Toast`, `InlineAlert`, `Tooltip`, `EmptyState`, `Skeleton`, `NotificationItem`, `TopBar` (Bell frame and elevated badge), `Sidebar`, `NavItem` | A token or component change in the design system becomes one edit in the prototype |
| Tokens | Generated from `design/figcraft/tokens/sgsi-tokens.css` (Light and Dark), including the elevation, radius and spacing scales | Same values as the file |
| Light and dark | A **Light / Dark** switch in the review bar, using the dark tokens. No dark frames are drawn (owner, Nov 6: the screens viewed with the dark tokens are already good) | Dark mode is reviewed in the prototype only |
| Type and icons | Google Fonts: Noto Sans, Newsreader and JetBrains Mono, with the library's text styles (section 3.1 of the library plan) as CSS classes. Icons are the Phosphor Regular SVGs of the library's glyph list plus eye-slash and sign-out, embedded inline (the artifact host blocks icon-font stylesheets) | Matches the library |
| Charts | Hand-drawn SVG that copies the chart shells in the frames: workflow bars, horizontal bars, donut, day bars, scatter with regression line, trend with limit line. Each has a hover tooltip like the Point_tooltip frame | Looks like the frames, needs no chart library, and stays small. The real app uses ECharts |
| Routing | Hash routes that follow the spec URLs (section 5), so a reviewer can send a link to one screen, for example `#/batches/B-2026-0422` | Links in feedback point at the exact screen |
| Backend | None. Demo data lives in the page, and changes are kept in the viewer's browser. **Reset demo** restores the start state | Same as version 31 |

## 3 · What the reviewer sees

The page has the app and a slim review bar that can be hidden, as in version 31.

| Review bar control | Does |
| --- | --- |
| **Width:** Desktop 1440, Tablet 834, Phone 390, Fit | Shows the app at that width. The layout switches as the frames do: expanded sidebar at 1440 (or collapsed, as the user's profile choice), rail at 834, top bar and menu drawer at 390. Fit is the default on a real phone or tablet |
| **Role:** Superadmin, Lab admin, Supervisor, Manager, CSO, Preparation, Analyst | Signs in as the persona (section 10). The sidebar, start page, page actions and hidden information follow `../Navigation/Navigation_Screen_Plan.md` sections 2 to 4 |
| **Theme:** Light, Dark | Swaps the token set |
| **Flows** | The flow list of section 9, grouped by module. **Start** sets the role, data and screen for step 1 |
| **Spec only** | Lists what the prototype shows but does not do (section 8.3), so a gap is not mistaken for a decision |
| **Reset demo** | Restores the demo data and signs out |

The prototype opens on **Sign in**. Any of the demo emails with any password signs in. The password "wrong" shows the Wrong_credentials alert, and five tries show Locked. The Role switch skips sign-in.

## 4 · The frames

278 frames: 167 desktop, 42 tablet and 69 phone, in 14 modules. Appendix A lists every screen with its states and sizes.

| Module | Frames | Module | Frames |
| --- | --- | --- | --- |
| 00 App | 36 | 09 Clients | 13 |
| 01 My work | 14 | 10 Drill hole | 10 |
| 02 Dashboard | 15 | 11 Lithology | 4 |
| 03 Job orders | 55 | 12 Seam | 4 |
| 04 Batches | 33 | 13 Users | 14 |
| 07 Reports | 26 | 14 Configuration | 22 |
| 08 Search | 26 | 15 Audit log | 6 |

Where a state is drawn only on desktop, the prototype builds the tablet and phone versions from the patterns the module already has at those sizes: the dialog becomes a bottom sheet or a full-screen step on the phone, tables become cards, filters move into a Filters sheet. Those views are tagged "Built from the pattern" in the Spec only list.

## 5 · Screens and what they do

What each screen must do in the prototype, read from the frames. "→" means "opens".

### 5.1 App (module 00)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Sign in | `#/login` | Email, Password with the eye toggle, **Sign in**, **Forgot password?**. Alerts: "The email or password is not correct.", "Too many failed attempts" (try again at a time, or reset), "You were signed out" (after the session timeout) |
| Forgot password | `#/forgot` | Email → **Send reset link** → Link sent with **Resend link in 0:42** counting down; **Back to sign in**. A demo link opens Set password |
| Set password | `#/set-password` | Reset (**Set password**), Invite (**Set password and sign in**), Link expired (**Send a new link**) |
| User menu | top bar chip | **Profile**, **Notification settings** (→ Profile, notification switches), **Sign out**. On the phone it is a drawer |
| Notifications | bell, `#/notifications` | Bell with the unread count badge. Panel: Tabs **All** and **Unread** with count, **Mark all read**, **See all notifications**; an item → its record and turns read. Page: same tabs, **Load more**, empty state "You're all caught up" |
| Profile | `#/profile` | Name, Sidebar **Expanded / Collapsed** (segmented control, applied at once), **Start page**, four notification switches, **Save**; **Change password** dialog (rules text, error state); **Sign out** |
| Session timeout | dialog | "Still there?" with a countdown, **Stay signed in**, **Sign out** → Sign in with "You were signed out" |
| No access | any hidden route | Empty state "You don't have access to this page" and **Go to My work** or **Go to Dashboard** |
| Sidebar and drawer | shell | Per role (Navigation section 2); collapse toggle on desktop; rail on tablet; menu drawer on the phone with the profile block |

### 5.2 My work (module 01)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Overview | `#/work` | One card per queue the role has, with **Continue** on the first item and **View all** → the queue. All caught up empty state |
| Queue | `#/work/:queue` | Breadcrumb My work > queue; Tabs, one per queue of the role, with counts; Search, Company select, **Past due only**. Batches to receive: **Open reception** → batch page Reception. CoAs to send: row checkboxes, then a selection bar with **Download PDFs**, **Mark sent**, **Clear** |

### 5.3 Dashboard (module 02)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Operations | `#/` | Period and Company selects change every card. Tabs **Operations** and **Quality & reports** (only for roles with `dashboard.quality`; the CSO has no tabs). Your queues → **Open My work**. Deadline alert → **Open batch**. Active batches filter chips **All / Due / Late** with counts, rows → batch page, Pager. No data empty state. Phone: **Filters** → bottom sheet with **Apply**, **Clear all** |
| Quality & reports | `#/?tab=quality` | Scatter cards with point tooltips ("BNM-3507, Ash 11.8%, CV 5,420"), Trend CV with the basis switch **ADB / AR / DB / DAF**, Drill holes table with chips **All / Missing CoA**, Search, **Upload CoA** and **Replace CoA** (Lab admin, Superadmin) → the drill hole CoA upload dialog |

### 5.4 Job orders (module 03)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| List | `#/orders` | **New job order**, **Filters**; status chips All, Draft, Awaiting samples, In progress, Reported, Delivered, Closed, Cancelled with counts; Search; Company, CSO and Due date filters; rows → detail; row menu (Open, Edit, Cancel); Pager. Empty state. Phone: cards and a sticky **New job order** |
| New job order | dialog, phone steps | Company name (search or add), address, Contact person dropdown (list, edit with Save, **Add contact**, remove with a confirm dialog), Client reference / PO, Sample type, Priority, Standard chips **ASTM / ISO / GB/T**, quick select (**TM + Prox + TS + CV**, **Prox only**, **Full analysis**, **Coking coal**, **Preparation only**, **Clear**), **Search parameters…**, the parameter pills with coverage tags, **Ash analysis ▸** and **Trace elements ▸** checklists (**Done**), Expected samples, Due date, Default signatory dropdown (**Add signatory**), Drop zone for files. **Cancel**, **Save as draft**, **Submit**; error summary "Fix 3 fields to submit". Phone: Step 1 (**Save as draft**, **Next**), Step 2 (**Back**, **Submit**), contact, signatory and Ash sheets |
| Detail | `#/orders/:no` | Breadcrumb, status, header icon row (contact, PO, due date), **Edit**, ⋯ (Edit, Cancel, Close). Tabs **Overview**, **Samples**, **Batches**, **Files**, **CoA**, **History**, with counts on Samples, Batches and Files |
| Overview tab | | Properties, stepper, batch list (each → batch page), CoA card |
| Samples tab | `#/orders/:no/samples` | **Add row**, **Paste from Excel** (lg dialog: rows found, new, duplicate, **Add 11 rows**), **Import list** (toast), **Save (3)** with unsaved dots and the duplicate alert. Sample states Expected, In batch, Received, Awaiting arrival, Not received; locked rows with the lock tooltip "Received on 21 Oct by Dedi Kurniawan…"; Action column **Mark as not received** (dialog with a Reason select) and **Restore**. Empty state with **Add samples** after Submit, with the toast "JO-2026-0143 submitted. Add the sample IDs next." Phone: **Add sample** |
| Batches tab | `#/orders/:no/batches` | Table with Preparation and Analysis columns; rows → batch page; **Add batch**; empty state; the amber note for samples awaiting arrival |
| Add batch | dialog, phone steps | Head with job order and client; Batch no. (editable), CoC no., Batch date, Deadline, Standard (one of the job order's), Priority, parameter pills, sample checklist with **Select all (16)** and **Clear**, late samples pre-ticked; **Create batch**. Phone: Step 1 (**Next (8 selected)**), Step 2 (**Back**, **Create batch**) |
| CoA tab | `#/orders/:no/coa` | Ready to generate (**Generate CoA** → Reports draft), Draft in progress (**Continue draft**), published (**Download PDF**, **Print**, **Mark sent**, **Open in Reports**), Mark sent dialog (date, channels Hard copy, Email, WhatsApp, Other as checkboxes, recipient, note; **Confirm**) and phone sheet, Sent (**Add another send**) |
| Cancel | dialog | "Cancel JO-2026-0137?" with **Keep job order** and **Cancel job order**, only before any sample is received |
| Files, History tabs | | Not drawn (section 7.1) |

### 5.5 Batches (module 04)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Batch list | `#/batches` | **Add batch** (first a dialog "Choose the job order", **Next** → Add batch), **Filters** (dialog: Company, Status, Standard, Job order, batch date and deadline ranges; **Clear all**, **Show 12 batches**), status chips All, Created, Preparation, Prep finished, Analysis, Analysis finished, Completed, Search, pre-filter per role (Batches to prepare for Preparation), empty and no-results states. Rows → batch page on the tab that matches the status |
| Batch page | `#/batches/:no` | Breadcrumb Batches > number; the job order number links to the job order's Batches tab; pencil → **Edit batch number** dialog (labels reprint warning, "already used"); Tabs **Reception**, **Preparation**, **Analysis** |
| Reception | | **Scan or type a label**, per row: arrived tick, mass, condition select (Good, Wet, …), remark, photos, label; **Mark all arrived**; **Print labels (2)** dialog (printer, copies, only samples without a label); Photos dialog with tags Condition, Weighing, Other and **Add photo**; row menu Hold (dialog with Reason), Release, Reprint label; **Confirm reception**, with the "6 of 8" dialog when samples are missing; confirmed state locks rows and offers **Open the job order's samples**. Phone: scan state, sheets |
| Preparation | | ADL per sample with the warning above the range, Entered by; **Save all**, **Finish Preparation**; finished state |
| Analysis | | Values per parameter and sample, calculated FC, range warnings; **Save all**, **Finish Analysis**; then RoA number, Drop zone for the signed RoA, **Complete batch**; Completed state with **Download**. The CSO sees progress only |

### 5.6 Reports (module 07)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Reports list | `#/reports` | Tabs **CoA** and **RoA** with counts (only for roles that see both; the CSO sees CoAs only, the Analyst RoAs only), Search, Period, Company, status chips All, Draft, Published, Sent, Superseded; row checkboxes → selection bar **Download PDFs**, **Clear**; download icon and row menu per row (CoA: Open job order, Print, Mark sent, Revise, Void; RoA: Open batch, Print); empty and no-results states; phone Filters sheet |
| CoA page | `#/reports/:no` | Draft: preview with page arrows, bases **ADB / DB / DAF / AR**, parameter pills, Attention, Signatory (with **Type manually**, see 7.2), Client reference; **Publish** → confirm dialog → number given. Published: **Download**, **Print**, **Mark sent** (dialog as in the job order) → Sent with **Add another send**; ⋯ **Revise** (dialog, **Create revision**) and **Void** (destructive dialog, **Keep CoA**, **Void CoA**); Superseded alert on old revisions. Phone: **Open PDF**, **Preview PDF** |
| RoA page | `#/reports/roa/:no` | "Internal, not for distribution" alert, **Download**, **Print** |

### 5.7 Search (module 08)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Quick search | top bar | Recent searches, typing results grouped by type, exact match (Enter opens the record), no match with **Open advanced search** |
| Results | `#/search?q=` | Groups with **Show all**, one type, the CSO version (no result values), no results; **Advanced search**. Phone start screen with **Scan a label** |
| Advanced search | `#/search/advanced` | Type select (Samples, Results, …), conditions (field, operator, value), **Match All / Any** toggle, **Add condition**, remove (x), **Clear all**, **Search**, **Columns** menu (checkboxes), **Export**, **Save query** dialog (name, **Share with staff**), saved queries list with its row menu (Rename, Duplicate, Share, Delete), the "first 500 of 2,318" alert |
| Sample history | `#/samples/:id/history` | Timeline with person and date, **View values** (not for the CSO), **Export PDF**, Held and In progress versions; the **Audit** link for Supervisor, Manager and Superadmin (section 7.1) |

### 5.8 Master data (modules 09 to 12)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Clients list | `#/clients` | **Add client** (dialog: logo drop zone, name, code, status, address with **Same as address**), chips All, Active, Inactive, Archived, Search, **Edit** link, row menu (Archive or Restore, Delete when unused), Archive dialog; empty state. Rows → client page |
| Client page | `#/clients/:code` | Logo or initials avatar 64, **Edit**, **Add contact**, contact dialog (name, position, email, phone, **Default contact** switch), contact row menu (Edit, Make default, Archive), CoA and job order history |
| Drill hole | `#/master/drill-holes` | **Import** (toast), **Add drill hole** (dialog), **Upload CoA** (dialog with drop zone), chips All, Missing CoA, Archived, Company select, Search, row menu with **CoA history** (dialog with downloads); read-only for Supervisor and Manager |
| Lithology, Seam | `#/master/lithologies`, `#/master/seams` | **Add** and **Edit** dialogs (lithology kind as Radio Coal, Parting, No lithology; seam code, description, order), chips, Company select, row menu |

### 5.9 Admin (modules 13 to 15)

| Screen | Route | What the frames show and the prototype does |
| --- | --- | --- |
| Users | `#/users` | Tabs **Users** and **Roles**; **Add user** (dialog: name, email, title, phone, role tiles; **Send invite**), Search, Role select, chips All, Active, Invited, Inactive, Locked, row menu (Edit, Send password reset, Resend invite, Unlock, Deactivate or Reactivate). Roles tab: the read-only permission grid |
| User page | `#/users/:id` | **Edit**, **Send password reset**, ⋯, the Locked alert with Unlock, the Invited alert with **Resend invite**, **Open in audit log** → audit log filtered by user. Deactivate dialog; Last Superadmin dialog that blocks **Remove role** |
| Audit log | `#/audit` | Search by record ID, Date, User, Record type, Action, **Export CSV**, rows expand to Field, Before, After; filtered by record with a removable chip and **Clear**; phone Filters sheet |
| Configuration | `#/config` | Hub with **Search settings** (results across sections) and the section list. Parameters (group chips, **Add parameter**, edit dialog with unit, group, basis, decimals, typical range, switches), Services (edit dialog, **Save as version 3**), Methods and standards (matrix, **Add edition** dialog), Validation rules (edit dialog with **Warn / Block**), Report templates (**New version**: fields and the certificate preview), Lookups (tabs Sample conditions, Hold reasons, Photo tags, Lithology kinds, Send channels; edit dialog), Laboratory (number formats, **Replace logo**, **Restore defaults**, **Save**), Security (lock, timeout, password rules), Formulas (view only). Changes here feed the rest of the prototype where the data is shared: a new condition appears in Reception, a new parameter in New job order, the timeout value in Session timeout |

## 6 · Cross-module links

The prototype has to keep these connections, which the frames draw on separate pages.

| From | Link | To |
| --- | --- | --- |
| Job order CoA tab | **Generate CoA**, **Continue draft**, **Open in Reports** | Reports CoA page |
| Reports CoA page | Job order number | Job order CoA tab |
| Batch page header | Job order number | Job order Batches tab |
| Job order Batches tab, Overview batch list | Row | Batch page (breadcrumb starts at Batches) |
| My work queues, Dashboard Active batches, deadline alert, notifications | Row or button | Batch page on the right tab, or the job order tab |
| Dashboard Drill holes table | **Upload CoA** | Drill hole CoA upload dialog |
| Search results, quick search, Samples tab and Reception row menu (**History**) | Sample | Sample history |
| Sample history (Supervisor, Manager, Superadmin), User page | **Audit** link, **Open in audit log** | Audit log filtered by record or user |
| User menu | **Notification settings** | Profile, notification switches |
| Any link to a page the role cannot open | — | Plain text (Navigation section 3) |

## 7 · Found in the frames

### 7.1 Gaps: what the frames do not define

| Gap | How the prototype fills it |
| --- | --- |
| **Row menus** are drawn closed in every list (job orders, batch rows, reports, clients, drill holes, lithology, seam, users, parameters, services, report templates, lookups, saved queries) | Menus with the items the plans name (Job orders plan section 6.2, Batch plan Reception, Reports section 4, Master data sections 4 and 5, Admin section 4, Search section 6), drawn with the library's Dropdown menu. Tagged "Built from the pattern" |
| **History** entry in the job order Samples tab and Reception row menus (Search plan) | Added to those menus |
| **Audit** link on Sample history (Search plan section 15) | Added for Supervisor, Manager and Superadmin, opening the Audit log filtered by record |
| Job order **Files** tab (count 0 to 2 in the frames) | A list of the files added in New job order (File chip, name, size, added by, date, Download, Remove) with a Drop zone. Tagged "Built from the pattern" |
| Job order **History** tab | The job order's audit entries, using the Audit log row layout (expandable Before and After). Tagged "Built from the pattern" |
| **Delete draft** in the Draft CoA ⋯ menu (Reports plan) | Destructive dialog, back to the job order CoA tab |
| CoA preview page arrows (caret left and right) | Pages 1 and 2 of the sample certificate image |
| Tablet and phone versions of desktop-only states | Section 4, last paragraph |

### 7.2 Differences between modules

These are the same records or rules drawn differently in two modules. The prototype needs one version; the frames can be aligned afterwards (open point 6).

| # | What differs | Where | Prototype uses |
| --- | --- | --- | --- |
| D1 | **JO-2026-0142** belongs to PT Bara Nusantara Mandiri in Job orders, Batches and Dashboard, but its CoA (CoA-JO-2026-0142-1) is for **PT Bukit Asam Tbk**, Attention Budi Santoso, in Reports and the report template preview | 03, 04, 02 vs 07, 14 | JO-2026-0142 stays PT Bara Nusantara Mandiri. The Bukit Asam CoA moves to a job order of its own, **JO-2026-0130**, with its batch and RoA (RoA-0412) |
| D2 | **PT Bara Nusantara Mandiri contacts**: Budi Hartono, Sari Wulandari and Dewi Anggraini in New job order; Budi Santoso (default), Rina Ayu Lestari and Sari Wulandari (Finance) on the client page | 03 vs 09 | Bara Nusantara: Budi Hartono (default), Sari Wulandari, Dewi Anggraini. Budi Santoso and Rina Ayu Lestari are PT Bukit Asam Tbk contacts |
| D3 | The Mark sent recipient for JO-2026-0141 (PT Kaltara Energi Prima) is **Sari Wulandari**, a Bara Nusantara contact | 03 | The Kaltara contact on that job order |
| D4 | **BNM-3507** is on JO-2026-0139 (PT Mahakam Coal Resources) on the Samples tab, but on JO-2026-0131 in Sample history and the Audit log. The BNM prefix belongs to Bara Nusantara Mandiri | 03 vs 08, 15 | BNM samples stay on Bara Nusantara job orders. JO-2026-0139's samples get Mahakam codes (MCR-…), and BNM-3507 stays on JO-2026-0131 |
| D5 | **Dates**: the job order and batch frames were drawn around 21 to 28 Oct (Add batch "Batch date 27 Oct"), while Dashboard, Reports, Search and Admin use 2 to 5 Nov with "today" Thursday 5 Nov | 03, 04 vs 02, 07, 08, 13–15 | Today is 5 Nov. Records keep their history dates, and new forms default to today. Due dates are set so the "past due" and "due within 24 h" examples still read as drawn |
| D6 | **Default signatory**: the job order form has no manual entry (Revision 3b), but the Draft CoA shows **Type manually** next to the signatory | 03 vs 07 | Same as the job order: pick from the list, or **Add signatory** |
| D7 | **List filters**: the owner rule of Nov 6 puts filters such as All / Unread on page Tabs (Notifications). The status filters of Job orders, Batches, Reports, Clients, Master data, Users, Parameters and the Dashboard Active batches card are still Filter chips | 00 vs others | As drawn: Tabs in Notifications and My work queues, Filter chips elsewhere, until you decide (open point 7) |
| D8 | **Signatory title**: "Head of Laboratory" on the phone sheet; the Users list has Bambang Sutrisno as Manager | 03, 13 | "Ir. Bambang Sutrisno, M.T., Head of Laboratory", role Manager |

### 7.3 Frame defects

| # | Defect | Fix |
| --- | --- | --- |
| E1 | **Phone-09-Clients-03-Client_form-01-New_client** and **Phone-10-Drill_hole-02-Drill_hole_form-01-New_drill_hole**: the sticky action bar still shows the library's default second button, **Start Preparation**, next to Save | In `rowK.js`: give the second button **Cancel** (or hide it) and rebuild row K. The prototype shows Cancel |

## 8 · Behaviour rules

### 8.1 Rules that apply on every screen

| Rule | In the prototype |
| --- | --- |
| No " · " joins (rule 8.1) | A test fails the build if any rendered view contains " · " |
| Centered dialogs only | Dialog sm 400, md 560 or lg 800 on desktop and tablet; bottom sheet or full-screen steps on the phone, as each frame shows |
| Card anatomy | Padding 16, head 32 with title, actions and short texts; notes below the head |
| Overlays | Esc closes the innermost layer; focus is trapped and returned; "Discard changes?" when a form has input; only one menu or popover open at a time |
| Hidden information | Per Navigation section 3: the CSO sees no result values or RoA files, links to a page the role cannot open are plain text, and a direct link to such a page shows No access |
| Read-only roles | No Add, Import, Edit, row menu or upload buttons (Master data section 3, Drill_hole Read_only frame) |
| Toasts | Sentences, with **Undo** where the plan has it (remove contact, Confirm reception for 10 s) |
| Audit | Every change made in the demo writes an audit entry, so the Audit log and the History tab show what the reviewer did |
| Notifications | The events N1 to N8 (App plan section 5) create notifications for the roles that receive them, so switching role after a hand-off shows the bell badge |

### 8.2 Changes version 31 never got

Version 31 is missing old plan sections 13 and 14 and every later revision. They are not listed one by one: the rebuild follows the frames, and the checks in section 12 compare each view with its frame.

### 8.3 Spec only (listed in the review bar)

- Session timeout runs on a 60-second demo timer, started from the review bar, instead of 30 minutes.
- Notifications are not pushed in real time.
- Saved queries and saved filters live in the browser.
- The "link sent" screen has a demo link instead of an email.
- PDFs are sample images.
- Uploads keep only the file name.
- Import list and Import (S-16) show a toast.
- Input ROA and Review ROA are hidden, as in v1.
- Configuration's Result tabs and Field definitions are "Next goal" rows.

## 9 · Flows

The flow IDs of version 31 (F1 to F23) are kept in the "Was" column so earlier notes still point somewhere.

| ID | Flow | Role | Steps (short) | Was |
| --- | --- | --- | --- | --- |
| AP1 | Sign in and land on the start page | each | Sign in → My work (queue roles) or Dashboard | — |
| AP2 | Wrong password, locked | Lab admin | "wrong" → alert; five times → Locked → **Forgot password?** | — |
| AP3 | Forgot and set password | Analyst | Forgot password → Link sent (countdown) → demo link → Set password → Sign in | — |
| AP4 | Invite | Superadmin, then the new user | AD1 → sign out → demo invite link → **Set password and sign in** | — |
| AP5 | Notifications | Lab admin | Bell (3 unread) → panel → Unread tab → item → batch page; **Mark all read**; **See all notifications** | — |
| AP6 | Profile and password | Preparation | User menu → Profile → sidebar Collapsed → Change password (error, then success) → Sign out | — |
| AP7 | Session timeout | CSO | Review bar timer → "Still there?" → **Stay signed in**; again → signed out alert | — |
| AP8 | No access | CSO | Open the Users link from the Flows panel → No access → **Go to My work** | — |
| MW1 | Work a queue | Preparation | My work → Batches to receive → **Open reception** → batch page Reception | — |
| MW2 | Send several CoAs | CSO | CoAs to send → tick 3 → **Download PDFs** → **Mark sent** | — |
| DB1 | Operations by role | Lab admin, Supervisor, CSO | Dashboard → Period → Due chip → batch row; deadline alert → **Open batch**; CSO has no tabs | — |
| DB2 | Quality & reports | Lab admin | Tab → scatter point tooltip → Trend basis AR → Missing CoA → **Upload CoA** | — |
| JO1 | Create a job order | CSO | List → **New job order** → client, contact, Standard, quick select, pills → **Submit** → Samples tab with the toast | F1 |
| JO2 | Draft, validation | CSO | **Save as draft**; **Submit** with 3 empty fields → "Fix 3 fields to submit" | F1a, F1b |
| JO3 | Contacts and signatory | CSO | Add, edit and remove a contact (the client page shows the same contacts); add a signatory | F1c–F1e, F8 |
| JO4 | Ash checklist, coking standards | CSO | **Ash analysis ▸** → search → **Done**; ASTM + GB/T → **Coking coal** → pills with their tags | F10, F11 |
| JO5 | Register samples | CSO | **Paste from Excel** → preview with 1 duplicate → **Add 11 rows** → fix → **Save**; locked rows | F2, F2b |
| JO6 | Add a batch | Lab admin | JO-2026-0137 → Batches → **Add batch** → **Create batch** → new row | F9 |
| JO7 | Generate and send the CoA | Lab admin, then CSO | CoA tab **Generate CoA** → RE2 → back → **Mark sent** (two channels) → Delivered | F4 |
| JO8 | Edit, cancel, close | CSO | ⋯ → Edit, Cancel (reason), Close | F5 |
| JO9 | Create on a phone | CSO | 390 → **New job order** → Step 1 → **Next** → Step 2 → **Submit** | F7 |
| JO10 | Mark a sample not received | CSO | Samples → **Mark as not received** (reason) → **Restore** | F19 |
| JO11 | Files and history | CSO | Files tab → add a file; History tab → see the changes made in JO1 to JO10 | — |
| BA1 | Receive a batch | Preparation | Batch list (Batches to prepare) → batch → scan → tick → mass and condition → photos → **Print labels** | F12, F13 |
| BA2 | Confirm with fewer, hold | Preparation | 6 of 8 arrived, one on hold → **Confirm reception** → 2 back to the job order | F14, F15 |
| BA3 | Late samples into a new batch | CSO | Samples awaiting arrival → **Add batch** pre-ticks them → receive | F18 |
| BA4 | Enter ADL and finish | Preparation | Preparation tab → ADL (22.4 % warns) → **Finish Preparation** → N3 to the Analyst | F16 |
| BA5 | Analysis and RoA | Analyst, then Lab admin | Analysis tab → values, calculated FC, range warning → **Finish Analysis** → upload signed RoA → **Complete batch** | F20–F23 |
| BA6 | Read-only batch | CSO | Batch page → progress only, no values, RoA as plain text | F17 |
| BA7 | Edit the batch number | Lab admin | Pencil → "already used" → new number → labels warning | — |
| BA8 | Add a batch from the list | Lab admin | Batch list → **Add batch** → choose job order → **Next** → Add batch | — |
| RE1 | Find and download reports | Analyst, CSO | Reports → RoA only (Analyst) or CoA only (CSO) → filters → multi-select → **Download PDFs** | — |
| RE2 | Build and publish a CoA | Lab admin | Draft → bases, signatory → **Publish** → confirm → number → N6 to the CSO | — |
| RE3 | Revise and void | Lab admin, Superadmin | Published CoA → **Revise** → revision 2, revision 1 Superseded; **Void** | — |
| SE1 | Quick search | any | Top bar search → recent → type "BNM-3501" → exact match → sample history | — |
| SE2 | Advanced search | Lab admin | Conditions, **Match All / Any**, **Columns**, **Save query** (shared), **Export** | — |
| SE3 | From history to audit | Supervisor | Sample history → **Audit** → audit log filtered by record | — |
| MD1 | Client page | CSO | Clients → PT Bara Nusantara Mandiri → **Add contact** → **Default contact** → back to New job order, contact pre-filled | — |
| MD2 | Drill hole CoA | Lab admin | Missing CoA → **Upload CoA** → CoA history; as Supervisor: read-only | — |
| MD3 | Lithology and seam | Lab admin | Edit a lithology kind; add a seam | — |
| AD1 | Add and invite a user | Superadmin | Users → **Add user** → role tiles → **Send invite** → Invited | — |
| AD2 | Lock, deactivate, last Superadmin | Superadmin | Bagus Prasetyo locked → Unlock; deactivate; remove Superadmin from Wahyu Pratama → blocked | — |
| AD3 | Audit trail | Supervisor | Audit log → filter by user → expand a row → **Export CSV** | — |
| AD4 | Configuration feeds the app | Superadmin | Hub search "ash" → Parameters edit; Lookups → add a condition → Reception shows it; Security timeout → Session timeout uses it | — |

## 10 · Demo data

One data module, `prototype/src/data/`, holds the records the frames show, with the differences of section 7.2 settled, so the prototype and the frames tell the same story.

| Item | Values |
| --- | --- |
| Today | **Thursday 5 November 2026**, the "Today" of the dashboard week strip and the Admin frames. Version 31 used 27 October |
| People | The ten accounts of the Admin frames. Role personas: Wahyu Pratama (Superadmin), Maya Lestari (Lab admin), Hendra Wijaya, S.T. (Supervisor), Ir. Bambang Sutrisno, M.T. (Manager), Rina Kartika (CSO), Dedi Kurniawan (Preparation), Fitri Handayani (Analyst). Yusuf Hidayat holds two roles, Bagus Prasetyo is locked, Sari Anggraini is invited |
| Clients | PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, CV Sumber Batu Hitam, PT Mahakam Coal Resources, PT Bukit Asam Tbk (with the logo), PT Tambang Sentosa Abadi (archived), as in the Clients list |
| Job orders | JO-2026-0130 to JO-2026-0143: JO-2026-0142 in Analysis with two batches; JO-2026-0137 with 16 registered samples and no batch; JO-2026-0139 with samples in every state; JO-2026-0141 with its CoA ready, then sent; JO-2026-0134 with 6 expected samples; JO-2026-0143 created by JO1; one Draft, one Cancelled, one Closed. Counts on chips, tabs and pagers are computed from the data, so they can differ from the numbers drawn ("128 job orders") |
| Batches | B-2026-0412 to B-2026-0422, spread over every status, with B-2026-0422 in Reception (8 samples, KEP-3301 to KEP-3308) and B-2026-0418 in Analysis |
| Reports | The CoAs and RoAs of the Reports list, attached to the job orders and batches above (D1) |
| Master data | Drill holes DH-BNM-021 to DH-BNM-031 and others (12 missing a CoA), the 9 lithologies, the seams |
| Configuration | The parameters, services, methods, validation rules, lookups and settings of the Admin frames, plus the 36 parameter pills, 29 Ash analysis items and 36 trace elements of version 31 |
| Audit and notifications | Seeded entries for the Audit log and Notifications frames, plus everything the reviewer does |

## 11 · Build phases and files

Each phase ends with a publish to the private preview artifact and a short note of what to try.

| Phase | Content | Flows ready |
| --- | --- | --- |
| 1 · Foundation | Tokens Light and Dark, text styles, icons, the component layer, app shell (sidebar per role, top bar with Bell, rail, drawer, user menu), router, review bar, demo data with the section 7.2 decisions, No access | AP8 |
| 2 · App, My work, Dashboard | Sign in and password screens, notifications, profile, session timeout; My work; both dashboard tabs with the SVG charts | AP1–AP7, MW1–MW2, DB1–DB2 |
| 3 · Job orders | List, create, detail and every tab including Files and History, Add batch, CoA states | JO1–JO11 |
| 4 · Batches | Batch list and the batch page with every tab | BA1–BA8 |
| 5 · Reports, Search | Reports list and pages, quick and advanced search, sample history | RE1–RE3, SE1–SE3 |
| 6 · Master data, Admin | Clients, drill hole, lithology, seam; users, audit log, configuration | MD1–MD3, AD1–AD4 |
| 7 · Polish and hand-over | Skeletons on navigation, toasts, keyboard (`/` focuses search, Esc), reduced motion, Spec only list; all checks; after your go, publish to the shared link | All |

Files: `src/ui/` (components), `src/data/` (demo data and rules), `src/modules/` (one file per module), `src/shell.js`, `src/review.js`, `src/styles/` (generated tokens and text styles). `build.py` joins them into one HTML. Version 31's `src` moves to `prototype/archive/src_v31/`.

Frame fix E1 is made in `rowK.js` with the next FigCraft build, or before the prototype if you prefer.

## 12 · Checks

1. **Flows:** a headless run (jsdom, as in version 31) clicks every flow in section 9 at 1440, 834 and 390, with no console errors.
2. **Rules:**
   - No " · " in any view.
   - The sidebar of each role matches Navigation section 2.
   - No access appears on every hidden route.
   - The CSO sees no result values and no RoA links.
   - Read-only roles see no edit controls.
   - Every route in section 5 opens.
3. **Coverage:** every frame in Appendix A is matched to a prototype view and state, checked by a script against the frame list of the main file.
4. **Looks:** for each screen, a headless Edge screenshot of the prototype sits next to a FigCraft render of its frame. Both stay in the scratchpad and are not exported to the docs. Differences are fixed or listed under Spec only.
5. **Theme:** each phase is checked once in Dark.

## 13 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Build in a private preview artifact, and update the shared link only at the end? | Yes |
| 2 | Start on Sign in, or straight in as a role? | Sign in; the Role switch skips it |
| 3 | Charts drawn in SVG like the frames, or real ECharts? | SVG |
| 4 | Is the build order in section 11 right, or should a module you want to show the lab first come earlier? | Order as in section 11 |
| 5 | The gaps of section 7.1 (row menus, Files and History tabs, Audit and History links): build them in the prototype from existing patterns, or draw frames first? | Build in the prototype, tagged "Built from the pattern"; draw frames later if you want them |
| 6 | The differences of section 7.2: also fix the frames to match the prototype data? | Yes, in one FigCraft pass after the prototype, together with E1 |
| 7 | D7: should the status filters of the other lists also become page Tabs, like Notifications? | No; keep Filter chips as drawn |
| 8 | Should the Flows panel also hold a short guided tour for first-time reviewers? | No; Flows and Start are enough |

## Appendix A · Frames by screen

D desktop, T tablet, P phone. Read from the main file on Nov 6, 2026.

| Module | Screen | States (sizes) |
| --- | --- | --- |
| 00 App | 01 Sidebar_by_role | Expanded (D), Collapsed (T) |
| | 02 Menu_drawer | Lab_admin (P), CSO (P) |
| | 03 No_access | Default (D P) |
| | 04 Sign_in | Default (D T P), Wrong_credentials (D P), Locked (D), Signed_out (D) |
| | 05 Forgot_password | Email (D P), Link_sent (D P) |
| | 06 Set_password | Reset (D P), Invite (D), Link_expired (D) |
| | 07 User_menu | Open (D), Drawer (P) |
| | 08 Notifications | Panel (D T), Panel_unread (D), Page (D P), Empty (D) |
| | 09 Profile | Default (D T P), Change_password (D P), Password_error (D) |
| | 10 Session_timeout | Warning (D) |
| 01 My work | 01 Overview | Lab_admin (D T P), Preparation (D), Analyst (D), CSO (D), All_caught_up (D P) |
| | 02 Queue | Batches_to_receive (D T P), CoAs_to_send_multi_select (D T P) |
| 02 Dashboard | 01 Operations | Lab_admin (D T P), Supervisor (D), CSO (D P), Sidebar_collapsed (D), Sidebar_open (T), No_data (D), Filters (P) |
| | 02 Quality_and_reports | Default (D T P), Missing_CoA (D), Point_tooltip (D) |
| 03 Job orders | 01 Job_orders_list | Default (D T P), Empty (D) |
| | 02 New_job_order | Form (D T), Contact_dropdown_list, Contact_dropdown_edit, Signatory_dropdown_list, Signatory_dropdown_edit, Ash_analysis_open, Validation_errors, Remove_contact, Coking_coal_ASTM_and_GBT (D); Step_1, Step_2, Contact_sheet_list, Contact_sheet_edit, Signatory_sheet_list, Signatory_sheet_edit, Ash_analysis_sheet (P) |
| | 03 Job_order_detail | Overview (D T P), Overview_dark_preview (D), Batches (D T P), Batches_empty (D T), Batches_samples_awaiting_arrival (D), Samples (D T P), Samples_mixed_states (D T P), Samples_mark_as_not_received (D T P), Samples_submitted_toast, Samples_paste_preview, Samples_unsaved_rows, Samples_locked_row_tooltip (D) |
| | 04 Add_batch | Dialog (D T), Late_samples (D), Step_1, Step_2 (P) |
| | 05 CoA_and_actions | Mark_sent (D; P as Mark_sent_sheet), Sent, Cancel_job_order, Ready_to_generate, Draft_in_progress (D) |
| 04 Batches | 01 Batch_list | Default (D T P), Batches_to_prepare (D), Empty (D), No_results (D), Filters (D P), Add_batch_choose_job_order (D) |
| | 02 Batch_detail | Reception_receiving (D T P), Reception_print_labels (D P), Reception_photos (D T P), Reception_ready, Reception_confirm_with_fewer, Reception_hold_sample (D), Reception_scan_label (P), Reception_confirmed, Batch_number_edit (D), Preparation_entering_ADL (D T P), Preparation_finished (D), Analysis_entering_results (D T P), Analysis_finished_upload_RoA (D P), Completed (D) |
| 07 Reports | 01 Reports_list | CoA_tab (D T P), RoA_tab, CSO, Analyst, Multi_select, Empty, No_results (D), Filters (P) |
| | 02 CoA | Draft (D T P), Draft_signatory, Publish_confirm (D), Published (D T P), Mark_sent, Sent, Revise, Superseded, Void_confirm (D) |
| | 03 RoA | Default (D P), Analyst (D) |
| 08 Search | 01 Quick_search | Recent (D), Typing (D T), Exact_match (D), No_match (D) |
| | 02 Search_results | All (D T P), One_type, CSO, No_results (D), Phone_start (P) |
| | 03 Advanced_search | Empty (D), Sample_query (D T P), Results_query, Columns_menu, Save_query, Over_limit (D) |
| | 04 Sample_history | Default (D T P), CSO, In_progress, Held (D) |
| 09 Clients | 01 Clients_list | Default (D T P), Empty (D) |
| | 02 Client_detail | Default (D T P), Contact_form, With_logo (D) |
| | 03 Client_form | New_client (D P), Archive_confirm, Logo_uploaded (D) |
| 10 Drill hole | 01 Drill_hole_list | Default (D T P), Missing_CoA, Read_only (D) |
| | 02 Drill_hole_form | New_drill_hole (D P) |
| | 03 CoA_upload | Upload (D P), History (D) |
| 11 Lithology | 01 Lithology_list, 02 Lithology_form | Default (D T P); Edit (D) |
| 12 Seam | 01 Seam_list, 02 Seam_form | Default (D T P); New_seam (D) |
| 13 Users | 01 Users_list | Default (D T P), Roles (D) |
| | 02 User_detail | Default (D T P), Locked, Invited (D) |
| | 03 User_form | Add_user (D P), Edit_user, Deactivate_confirm, Last_superadmin (D) |
| 14 Configuration | 01 Configuration_hub | Overview (D T P), Search (D) |
| | 02 Parameters | List (D T P), Edit (D) |
| | 03 Services | List (D T), Edit (D) |
| | 04 to 10 | Methods_and_standards (Matrix, Edit), Validation_rules (List, Edit), Report_templates (List, New_version), Lookups (List, Edit), Laboratory, Security, Formulas (D) |
| 15 Audit log | 01 Audit_log | Default (D T P), Row_expanded, Filtered_by_record (D), Filters (P) |
