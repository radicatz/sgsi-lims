# SGSI LIMS Prototype — Demo Guide

> **FORMAT MISMATCH (flagged Nov 10, 2026).** The lab's sample identifiers changed (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code `CCC.BB.NNN.Lotxx` replace the lab code `B{batch}-NN`, and the client's own name is now the Client reference. The recorded clips and the guide show the old format (`BNM-3507`, lab code `B0410-07`) and **are not being re-recorded**. **Where they disagree, the spec wins.** Register of mismatches: `../Project/Sample_Identifiers_Plan.md`.

Written Nov 9, 2026, for presenting the clickable prototype v2 to the lab. It lists every screen group, what each feature does, and who can see and use it. The suggested running order is at the end.

- **Prototype link (preview):** https://claude.ai/artifact/SPepzodQgNhFaSNwenYbao. It is private until you share it from the page's Share menu.
- **Older link (version 31, job orders only):** https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo
- **Plans behind it:** `Prototype_Plan.md` and the `<Group>_Prototype_Plan.md` file in each group folder.

## 1 · Before you start

### The review bar

The dark bar across the top is for the demo, not part of the app.

| Control | What it does |
| --- | --- |
| **Width** | Fit, Desktop 1440, Tablet 834, Phone 390. The app switches layout the way the real app would: full sidebar on desktop, icon rail on tablet, menu drawer on the phone |
| **Role** | Signs in as one of the seven people below. The sidebar, the start page, the buttons and what is hidden all change with the role |
| **Theme** | Light or Dark |
| **Flows** | 49 ready-made demo scenarios. **Start** resets the data, signs in as the right person and opens the right screen |
| **Spec only** | What the prototype shows but does not really do, a list of parts built from existing patterns, and a button that starts the session timeout |
| **Reset demo** | Puts every record back to the start and signs out |
| **Chevron (far right)** | Hides the bar. A small tab at the top brings it back |

### Demo facts to mention

- Everything is demo data. "Today" is **Thursday 5 November 2026** for everyone.
- Changes stay in the viewer's own browser until **Reset demo**. Nothing is saved to a server.
- PDFs are sample files, uploads keep only the file name, and Print shows a message, because the page cannot open a printer.
- A link can point straight at one screen, for example `#batch-B-2026-0422-reception`.

### The seven roles

| Role | Person | Sign-in email | Starts on |
| --- | --- | --- | --- |
| Superadmin | Wahyu Pratama | wahyu@sgsi.co.id | Dashboard |
| Lab admin | Maya Lestari | maya@sgsi.co.id | My work |
| Supervisor | Hendra Wijaya, S.T. | hendra@sgsi.co.id | Dashboard |
| Manager (Head of Laboratory) | Ir. Bambang Sutrisno, M.T. | bambang@sgsi.co.id | Dashboard |
| CSO | Rina Kartika | rina@sgsi.co.id | My work |
| Preparation | Dedi Kurniawan | dedi@sgsi.co.id | My work |
| Analyst | Fitri Handayani | fitri@sgsi.co.id | My work |

Any of these emails signs in with any password. The password `wrong` shows the error message.

### Sidebar by role

✔ = sees and uses the page. **read** = sees it without edit actions. — = not in the sidebar; opening it by link shows "You don't have access to this page".

| Page | Superadmin | Lab admin | Supervisor | Manager | CSO | Preparation | Analyst |
| --- | --- | --- | --- | --- | --- | --- | --- |
| My work | — | ✔ | — | — | ✔ | ✔ | ✔ |
| Dashboard | ✔ | ✔ | ✔ | ✔ | ✔ (Operations only) | ✔ (Operations only) | ✔ (Operations only) |
| Job orders | ✔ | read | read | read | ✔ | read | read |
| Batches | ✔ | ✔ | read | read | ✔ | ✔ | ✔ |
| Reports | ✔ | ✔ | ✔ | ✔ | CoA only | — | RoA only |
| Search | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Clients | ✔ | read | — | read | ✔ | — | — |
| Drill hole, Lithology, Seam | ✔ | ✔ | read | read | — | — | — |
| Users | ✔ | — | — | — | — | — | — |
| Configuration | ✔ | — | — | — | — | — | — |
| Audit log | ✔ | — | ✔ | ✔ | — | — | — |
| Notifications, Profile | everyone | | | | | | |

Lab admin and Preparation see job orders mostly read-only, but can still add batches. Input ROA and Review ROA are hidden for every role in v1.

### What some roles never see

| Rule | Who |
| --- | --- |
| Result values are hidden: the Analysis tab shows only progress ("26 of 42 values saved"), and Search has no values | CSO |
| The signed RoA cannot be opened; RoA numbers show as plain text | CSO, Preparation |
| A link to a page the role cannot open shows as plain text | Everyone |

## 2 · Screen groups and features

### 2.1 App: sign in, notifications, profile

| Feature | What it is about | Who |
| --- | --- | --- |
| Sign in | Email and password with a show/hide eye. It shows a message after a wrong password and locks the account after 5 tries. After a timeout it explains why the user was signed out | Everyone |
| Forgot password | Sends a reset link, with a resend countdown. The demo shows the link on screen instead of emailing it | Everyone |
| Set password | Three cases: a new password after a reset, a first password from an invite, and an expired link. Password rules come from Configuration, Security | Everyone; the invite is for new users |
| Bell and notification panel | Unread count on the bell. All and Unread tabs, Mark all read. An item opens the batch, job order or report it is about | Everyone, each sees their own |
| Notifications page | The full list, with Load more and an empty state. On the phone, the bell opens this page | Everyone |
| Hand-off notifications | The app tells the next person when work reaches them: a batch is ready to receive, samples did not arrive, preparation finished, analysis finished, a job order is ready for its CoA, a CoA is published, a batch is due within 24 h or past due | The role that receives each one |
| User menu | Profile, Notification settings, Sign out. On the phone it is a drawer | Everyone |
| Profile | Name, sidebar expanded or collapsed, start page, which notifications to get, Change password | Everyone |
| Session timeout | "Still there?" with a countdown, then sign-out. Started from the review bar in the demo | Everyone |
| No access | Shown when someone opens a page their role cannot use, with a button back to their start page | Everyone |

Flows: **AP1 to AP8**.

### 2.2 My work

| Feature | What it is about | Who |
| --- | --- | --- |
| Overview | The person's own work: the task in progress with **Continue**, one card per queue (count, oldest waiting, past due in red), and the lab's recent activity | Lab admin, CSO, Preparation, Analyst |
| Batches to receive | Batches waiting for reception, with **Open reception** | CSO, Preparation, Lab admin |
| Samples awaiting arrival | Samples that did not arrive with their batch, with **Add batch** | CSO, Preparation |
| In preparation | Batches the Preparation team is working on | Preparation |
| Ready for data entry | Batches ready for analysis values | Analyst |
| Signed RoA to upload | Batches whose analysis is finished | Lab admin |
| CoAs to generate | Job orders whose batches are all completed | Lab admin |
| CoAs to send | Published CoAs not sent yet. Select several, then **Download PDFs** or **Mark sent** | CSO |
| Filters | Search, Company and "Past due only" on every queue | Same as the queue |

The sidebar shows the person's total open work as a count on My work. Flows: **MW1, MW2**.

### 2.3 Dashboard

| Feature | What it is about | Who |
| --- | --- | --- |
| Period and Company | Filters every card (last 7, 30 or 90 days) | Everyone |
| Your queues | The person's queue counts in one line, with **Open My work** | Roles with My work |
| KPI cards | Batches in progress, due this week (with past due), samples received (with the change against the last period), mean turnaround against the 5-day target | Everyone |
| Batch workflow | How many batches are at each step, from Created to Completed | Everyone |
| Job orders by status | Draft, Awaiting samples, In progress, Reported, Delivered | Everyone |
| Sample type mix | Ply, Composite, Roof and floor, Parting | Everyone |
| Samples received per day | The last two weeks, today highlighted, hover for the count | Everyone |
| Turnaround by company | Average days per client, coloured against the target | Everyone |
| Active batches | All, Due and Late tabs, deadline colour, progress, status. A row opens the batch | Everyone |
| Deadline alert | Batches due within 24 hours, with **Open batch** | Everyone, when one is due |
| This week | A week strip with the deadlines of the chosen day | Everyone |
| Quality & reports tab | Batches completed, RoAs uploaded, drill holes with a CoA, determinations | Superadmin, Lab admin, Supervisor, Manager |
| Scatter charts | CV vs Ash, RD vs Ash, FC vs GCV with the trend line and R². Hover a dot for the sample | Same as the tab |
| Trend CV | CV per completed batch against the limit, switchable between ADB, AR, DB and DAF | Same as the tab |
| Drill holes table | All or Missing CoA, search, and **Upload CoA** or **Replace CoA** | Lab admin and Superadmin upload; the others view |

Phone: the filters move into a sheet. Flows: **DB1, DB2**.

### 2.4 Job orders

| Feature | What it is about | Who |
| --- | --- | --- |
| Job order list | Status tabs with counts, search by number, client or PO, filters (company, CSO, due date, standard). It shows samples received, batches, due date, status and CoA state. Phone shows cards | Everyone with Job orders |
| New job order | The client's request. It covers:<br>• company (pick or add) and address<br>• the contact person<br>• PO and standard (ASTM, ISO, GB/T)<br>• quick-select services and parameter pills; dependent pills lock (FC needs IM, Ash and VM)<br>• Ash analysis and Trace elements checklists<br>• tags for coking tests that a standard does not cover<br>• expected samples, due date and priority<br>• default signatory, notes and files<br><br>**Save as draft** or **Submit**. Phone: two steps | CSO, Superadmin |
| Contact and signatory pickers | Pick, edit, add or remove a contact (with Undo) or a signatory without leaving the form | CSO, Superadmin |
| Validation | "Fix 3 fields to submit" with links to each field | CSO, Superadmin |
| Edit, Cancel, Close | Edit closes once preparation starts. Cancel needs a reason and is allowed only before any sample is received. Close is for delivered job orders | CSO, Superadmin |
| Overview tab | Progress stepper (Registered to Sent to client), properties, the batches with who prepared and analysed them, CoA status | Everyone with Job orders |
| Samples tab | The client's sample list:<br>• add rows, or **Paste from Excel** (preview, column mapping, duplicates skipped)<br>• Import list is a placeholder<br>• five states: Expected, In batch, Received, Awaiting arrival, Not received<br>• received rows are locked<br>• **Mark as not received** with a reason, and **Restore**<br>• History opens the sample's timeline | View: everyone. Edit: CSO, Superadmin |
| Batches tab | The job order's batches with preparation and analysis people. A warning shows when samples are awaiting arrival. **Add batch** | View: everyone. Add batch: CSO, Preparation, Lab admin, Superadmin |
| Add batch | Batch number (editable), CoC, dates, one standard, priority, parameters, the samples to include (late samples pre-ticked). Settings are copied from the previous batch | CSO, Preparation, Lab admin, Superadmin |
| Files tab | Files on the job order: add, download, remove | Add and remove: CSO, Preparation, Lab admin, Superadmin |
| CoA tab | One of these states:<br>• Pending<br>• Ready to generate (**Generate CoA**)<br>• Draft in progress<br>• Published or Delivered: details, every send, "Built from" batches and RoAs, **Mark sent** or **Add another send**, **Open in Reports** | Generate: Lab admin, Superadmin. Mark sent: CSO. Others view |
| History tab | Every change to the job order, its samples, batches and CoAs, with before and after | Everyone with Job orders |

Flows: **JO1 to JO12**.

### 2.5 Batches

| Feature | What it is about | Who |
| --- | --- | --- |
| Batch list | Status tabs with counts, opening pre-filtered for the role ("Batches to prepare", "Ready for data entry"). Search, company and a filters dialog. **Add batch** asks for the job order first | View: everyone with Batches. Add: CSO, Preparation, Lab admin, Superadmin |
| Batch page header | Client, job order link, standard, due date, arrived count, and a stepper (Created to Completed). The pencil edits the batch number until reception is confirmed, warning when labels must be reprinted | Edit number: CSO, Preparation, Lab admin, Superadmin |
| Reception tab | **Scan or type a label**, tick arrived, mass, condition (a remark unless Good), photos tagged Condition, Weighing or Other, print or reprint labels, hold or release a sample, **Mark all arrived**. A checklist, then **Confirm reception**. With missing samples it asks "Confirm reception with 6 of 8?" and sends the missing ones back to the job order as Awaiting arrival (Undo for 10 s) | Act: CSO, Preparation, Lab admin, Superadmin. Others view |
| Preparation tab | ADL per sample, with a warning above the typical range, and "Entered by". **Save all**, then **Finish Preparation**, which notifies the analysts | Enter: Preparation only. Others view |
| Analysis tab | A values grid by parameter group with units and basis. FC is calculated. Out-of-range values are flagged. Includes a demo "fill empty cells" link. **Save all**, then **Finish Analysis**, which notifies the lab admin | Enter: Analyst, Superadmin. View values: everyone except the CSO, who sees progress only |
| Signed RoA and Complete batch | RoA number plus the signed PDF, then **Complete batch**. When it is the job order's last batch, the lab admin is told to generate the CoA | Upload: Lab admin, Superadmin. Open the RoA file: Superadmin, Lab admin, Supervisor, Manager, Analyst |

Phone: cards instead of tables, sheets for labels and photos. Flows: **BA1 to BA8**.

### 2.6 Reports

| Feature | What it is about | Who |
| --- | --- | --- |
| Reports list | CoA and RoA tabs with counts, search, period, company, CoA status tabs. Select several, then **Download PDFs**. Download and a row menu on every row | Both tabs: Superadmin, Lab admin, Supervisor, Manager. CoA only: CSO. RoA only: Analyst |
| Draft CoA | Certificate preview (two pages). Choose bases (ADB, DB, DAF, AR), parameters, attention contact, signatory and PO. **Publish** gives the number and tells the CSO. **Delete draft** | Lab admin, Superadmin |
| Published CoA | Download, details, delivery history, versions, "Built from" | Everyone who sees CoAs |
| Mark sent | Date, channels (Hard copy, Email, WhatsApp, Other; several allowed), recipient, note. The job order becomes Delivered | CSO |
| Revise | Makes a new revision with a reason. The old one shows "Superseded" | Lab admin |
| Void | Voids the CoA with a reason; the number is never reused | Superadmin |
| RoA page | The lab's signed RoA, marked "Signed copy" and "Internal, not for distribution". A paper preview of the RoA (results per sample on ADB, DB, DAF and AR, methods, the supervisor's signature) with a page arrow, a Details card, and a **Used in** card that lists the CoAs built from it. **Download** gives a sample file and **Print** shows a message | Superadmin, Lab admin, Supervisor, Manager, Analyst |

Flows: **RE1 to RE3**.

### 2.7 Search

| Feature | What it is about | Who |
| --- | --- | --- |
| Quick search (top bar) | Type or scan a sample ID or lab code (the prototype shows the old format; see the note at the top), batch, job order, report, client or drill hole. Shows recent searches, grouped results and the exact match (Enter opens it). Press `/` to jump to it. On the phone it is a search page with **Scan a label** | Everyone; results only include what the role can open |
| Search results | Grouped by type with counts and **Show all**, and a "nothing matches" state | Everyone |
| Advanced search | Find samples, batches, job orders or results by conditions:<br>• All or Any of the conditions<br>• choose the columns<br>• export to CSV<br>• save a query and share it with staff; saved queries have Rename, Duplicate, Share and Delete | Everyone. Searching by results: roles that see values (not the CSO) |
| Sample history | One sample's life: registered, added to a batch, received (mass and condition), held, ADL, analysis, reported in an RoA, certified in a CoA. **View values** and **Export PDF** | Everyone with Search. Values: not the CSO |
| Audit link | From a sample's history to the audit log filtered to that sample | Superadmin, Supervisor, Manager |

Flows: **SE1 to SE3**.

### 2.8 Master data

| Feature | What it is about | Who |
| --- | --- | --- |
| Clients list | Logo, code, address, status, total samples. Active, Inactive and Archived tabs. Add, edit, archive or restore, and delete when unused | Edit: CSO, Superadmin. Read: Lab admin, Manager |
| Client page | Details, contacts (add, edit, make default, archive), the client's job orders and certificates. The default contact is pre-filled on new job orders | Same as the list |
| Drill hole | Code, description, samples, company and CoA. Tabs for All, Missing CoA and Archived. Add or edit, **Upload CoA** or **Replace CoA**, CoA history, archive. Import is a placeholder | Edit and upload: Lab admin, Superadmin. Read: Supervisor, Manager |
| Lithology | Name and kind (Coal, Parting, No lithology) with kind tabs, add or edit, archive | Edit: Lab admin, Superadmin. Read: Supervisor, Manager |
| Seam | Code, description, order and company, add or edit, archive | Same as Lithology |

Flows: **MD1 to MD3**.

### 2.9 Admin

| Feature | What it is about | Who |
| --- | --- | --- |
| Users list | Name, email, roles, status (Active, Invited, Inactive, Locked), last sign-in. Search, role filter, status tabs, a row menu | Superadmin |
| Roles tab | Read-only grid of what each of the seven roles can do. Roles are fixed in v1, and a user's roles add up | Superadmin |
| Add and Edit user | Name, email, title printed on reports, phone, and role tiles with a one-line description each. **Send invite** emails a set-password link | Superadmin |
| User page | Account details, recent activity, **Open in audit log**, **Send password reset**. A locked account shows **Unlock**; an invited one shows **Resend invite** | Superadmin |
| Deactivate and the last Superadmin | Deactivate keeps the person's history. Removing the role from the only Superadmin is blocked | Superadmin |
| Audit log | Who changed what and when. Search by record, filters (date, user, record type, action), rows that expand to before and after, the screen where it happened. Can be filtered to one record or user. **Export CSV** | Superadmin, Supervisor, Manager |
| Configuration hub | Search across all settings and a section list. Result tabs and Field definitions are marked "Next goal" | Superadmin |
| Parameters | Code, name, group, unit, basis, decimals, typical range, active. The range drives the Analysis warnings | Superadmin |
| Services | The quick-select bundles: parameters, turnaround days, status, default. Saved as a new version | Superadmin |
| Methods and standards | Method editions per parameter and standard, with a new-edition dialog | Superadmin |
| Validation rules | Bounds and Warn or Block per rule | Superadmin |
| Report templates | CoA layout versions, and a new version with a live preview | Superadmin |
| Lookups | Sample conditions, hold reasons, photo tags, lithology kinds, send channels. A new value appears straight away where it is used, for example in Reception | Superadmin |
| Laboratory | Lab name, accreditation, place of issue, number formats, logo | Superadmin |
| Security | Lockout, idle sign-out, warning time, password rules, link and invite validity. The demo sign-in and timeout use these values | Superadmin |
| Formulas | Calculated results (FC, NCV, basis conversions), view only | Superadmin |

Flows: **AD1 to AD4**.

## 3 · Suggested running order (about 40 minutes)

The story follows one request from the client to the certificate, then shows oversight and admin. Each step names the flow to **Start** from the review bar.

| # | Part | Flow and role | What to show | Time |
| --- | --- | --- | --- | --- |
| 1 | Sign in and roles | AP1 (CSO) | Sign in as Rina. Switch roles in the review bar and point out how the sidebar changes | 3 min |
| 2 | Client request | JO1, JO3, JO4 (CSO) | Create a job order: contact picker, standards, quick select, the Ash checklist, coking tags. Submit lands on the Samples tab | 5 min |
| 3 | Sample list | JO5 (CSO) | Paste from Excel with one duplicate, save; locked rows on another job order | 3 min |
| 4 | Batch | JO6 (Lab admin) | Add batch from the job order | 2 min |
| 5 | Reception | BA1, BA2 (Preparation) | Scan, masses, a wet sample, photos, labels; confirm with 6 of 8 and see 2 go back to the job order | 5 min |
| 6 | Preparation | BA4 (Preparation) | ADL with a warning, Finish Preparation, then the analyst's bell | 2 min |
| 7 | Analysis and RoA | BA5 (Analyst, then Lab admin) | Values grid, calculated FC, range warnings, Finish Analysis; upload the signed RoA, Complete batch | 4 min |
| 8 | CoA | JO7, RE2 (Lab admin, then CSO) | Generate the CoA, build and publish it, then the CSO marks it sent by two channels | 4 min |
| 9 | What the CSO cannot see | BA6 (CSO) | Analysis shows progress only, RoA numbers are plain text, the CoA-only Reports list | 2 min |
| 10 | Monitoring | MW1, DB1, DB2 (Lab admin, Supervisor) | My work queues, Operations and Quality dashboards, chart tooltips, the deadline alert | 4 min |
| 11 | Finding things | SE1, SE2, SE3 (Lab admin, Supervisor) | Quick search to a sample's history, advanced search, the jump to the audit log | 3 min |
| 12 | Admin | AD1, AD2, AD4 (Superadmin) | Invite a user, unlock, the last-Superadmin block, a lookup value that appears in Reception | 3 min |

Optional if there is time:
- Phone width with JO9 (create on a phone) and the menu drawer.
- Tablet width on the batch page.
- The Dark theme.
- MD1 and MD2 for master data.
- AP7 for the session timeout.

## 4 · Things to say if asked

| Question | Answer |
| --- | --- |
| Is this the real system? | No. It is a clickable model of the v1 screens with demo data, so the lab can react before development starts |
| Why does a count differ from the design file? | Counts are computed from the demo data, so they are smaller than the illustrative numbers in the frames |
| Can I print or email from it? | Not in the prototype. Print, email and PDFs are shown as messages or sample files |
| What is not in v1? | Input ROA and Review ROA worksheets, the Import wizard, Result tabs and Field definitions in Configuration, and a client portal |
| Where do I give feedback? | Note the screen link (the part after `#` in the address bar) and the role you were using |
