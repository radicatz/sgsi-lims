# Reports screen plan

Written Nov 5, 2026. **Status: plan, waiting for go.** Module 07 Reports, canvas row **L**. Builds on spec S-11, S-28, 9.5 and 9.8 (`../Project/Coal_LIMS_Development_Spec.md`), the job order CoA tab (`../Job Order/Job_Order_Screen_Plan.md` sections 2 and 5), the batch RoA card (`../Batch/Batch_Screen_Plan.md`), the My work queues Q6 and Q7 (`../My Work/My_Work_Screen_Plan.md`) and the sidebar rules (`../Navigation/Navigation_Screen_Plan.md`).

## 1 · Goal

One place for every report the lab has issued: the signed RoA of each batch and the CoA of each job order. Users find a report, open it, download or print it, and follow what happened to it (published, sent, revised). The Lab admin also **builds and publishes the CoA** here, which no frame shows yet: today the CoA appears only after it is published (Mark sent, Sent).

## 2 · What v1 has (spec 1.1, D-44)

| Document | In v1 | Next goal (not in this plan) |
| --- | --- | --- |
| **RoA** (internal, one per batch) | The lab's own signed RoA, uploaded as a PDF with its number on the batch page (RoA card), when the Lab admin completes the batch. Read-only afterwards | RoA drafted in the app, submit, supervisor approval, publish and print from the system (F-RPT-05, S-10); XLSX and CSV exports (S-11) |
| **CoA** (client, one per job order) | Built in the app once every batch of the job order is completed: draft, choose contents and signatory, publish (number, PDF), download, print, mark sent, revise | Templates per client (Configuration, S-15), distribution lists and email from the system (F-DST), client portal (S-31) |

So the Reports page lists two kinds of files: **uploaded** RoAs and **generated** CoAs.

## 3 · Who sees what

From the sidebar matrix (spec 8.3) and the permission grid (spec 8.2).

| Role | Persona | Sees in Reports | Can do |
| --- | --- | --- | --- |
| Lab admin | Maya Lestari | RoAs and CoAs, including CoA drafts | Build and publish CoAs, revise, download and print both |
| CSO | Rina Kartika | **CoAs only** (published, sent) | Download, print, **Mark sent** |
| Analyst | Fitri Handayani | **RoAs only** | Download |
| Supervisor | Hendra Wijaya | RoAs and published CoAs | Download, print |
| Manager | Bambang Sutrisno | RoAs and published CoAs | Download, print |
| Superadmin | Wahyu Pratama | Everything | Also **Void** |
| Preparation | Dedi Kurniawan | No Reports item; the URL shows No access | — |

Inside the page a role that sees one document type gets no type filter (the list is that type only), as the Dashboard does with its tabs.

## 4 · Reports list `/reports`

Desktop, Lab admin, sidebar expanded:

```
REPORTS
Reports                                                        
[RoA 46] [CoA 21]  (Tabs; count pill)                                    
┌ Table card ───────────────────────────────────────────────────────────────────────┐
│ [Search number, job order, batch, client]  [Period ▾] [Company ▾]  All | Draft | Published | Sent │
│ ☐ Number            Job order     Client                  Status      Published    Signatory       ⋯ │
│ ☐ CoA-JO-2026-0142-1 JO-2026-0142  PT Bukit Asam Tbk      Sent        2 Nov 2026   Bambang S.  [↓] ⋯ │
│ ☐ CoA-JO-2026-0139-2 JO-2026-0139  PT Bara Nusantara M.   Published   1 Nov 2026   Bambang S.  [↓] ⋯ │
│ ☐ —  (draft)        JO-2026-0141  PT Kaltara Energi Prima Draft       —            —           ⋯ │
│ … 8 rows, pager                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Header | Overline REPORTS, title Reports. No Add button: a CoA starts from its job order (section 6), an RoA from its batch |
| Tabs | **CoA** and **RoA**, each with a count, library **Tab**. Shown only to roles that see both types; CSO sees the CoA table without tabs, Analyst the RoA table without tabs |
| Toolbar (in the card, Card content) | Search (number, job order, batch, client), Period select, Company select, status chips |
| CoA columns | Checkbox, **Number** (with revision, "CoA-JO-2026-0139-2"), **Job order** (link), **Client** (40 avatar and name), **Status** badge, **Published** date, **Signatory**, **Sent** (channel icon, date), Download icon button, row menu |
| CoA status chips | All, Draft (Lab admin only), Published (not sent yet), Sent, Superseded |
| RoA columns | Checkbox, **RoA number** (as typed at upload, "RoA-0418"), **Batch** (link), **Job order** (link), **Client**, **Uploaded** date, **Uploaded by**, Download icon button, row menu |
| RoA chips | None in v1 (every RoA is a completed batch's signed file); the period and company filters apply |
| Row click | Opens the report page `/reports/:id` |
| Row menu | CoA: Open job order, Print, Mark sent (CSO, published), Revise (Lab admin, published or sent), Void (Superadmin). RoA: Open batch, Print |
| Multi-select | Selecting rows shows a bar with **Download PDFs** (one zip). Mark sent stays one by one, as in My work Q7 |
| Pager | 10 rows; "Showing 1–10 of 21" |
| Empty | Empty state "No reports yet", text "CoAs appear here when a job order's batches are completed. RoAs appear when a batch's signed RoA is uploaded." No button |
| No results | Empty state "No reports match", **Clear filters** |

The RoA row's Download is hidden for roles without `roa.download` (CSO never sees RoA rows anyway). Every RoA file carries "Internal, not for distribution" (it is the lab's own paper); the page shows the same note.

## 5 · Report page `/reports/:id`

One layout for both document types: the **document preview** on the left, **cards** on the right. Breadcrumb Reports > number.

```
Reports > CoA-JO-2026-0142-1
CoA-JO-2026-0142-1  [Published]                     [Download] [Print] [Mark sent]  ⋯
JO-2026-0142   PT Bukit Asam Tbk   Revision 1
┌ Preview (A4 page, scroll) ─────────────┐ ┌ Details ─────────────────────────┐
│  [CoA page 1 of 2 drawn as the PDF]     │ │ Job order   JO-2026-0142          │
│                                         │ │ Client      PT Bukit Asam Tbk     │
│                                         │ │ Attention   Budi Santoso          │
│                                         │ │ Published   2 Nov 2026, Maya L.   │
│                                         │ │ Signatory   Ir. Bambang Sutrisno… │
│                                         │ └───────────────────────────────────┘
│                                         │ ┌ Delivery ─────────────────────────┐
│  page 1 / 2   [‹] [›]   [−] 100% [+]    │ │ Sent by WhatsApp to Budi Santoso │
└─────────────────────────────────────────┘ │ 3 Nov 2026, Rina K.               │
                                            └───────────────────────────────────┘
                                            ┌ Versions ─────────────────────────┐
                                            │ Rev 1  Published  2 Nov  current  │
                                            └───────────────────────────────────┘
```

Desktop: preview fills (about 700 wide, an A4 page scaled to fit, page controls under it); the right column is 378, as the client page's Properties card. Cards follow the card anatomy (padding 16, Card head 32).

### 5.1 CoA, draft (Lab admin builds it)

The draft is created by **Generate CoA** (section 6). The page shows the draft preview with a "DRAFT" watermark and, instead of Details, a **Contents** card the Lab admin fills; the preview follows every change.

| Contents field | Spec | Default |
| --- | --- | --- |
| Template | Select; one house CoA template in v1, so it shows as read-only text "House CoA template, version 1" | House template |
| Bases | Checkboxes AR, ADB, DB, DAF (spec 9.8) | The client's last choice; first time all four |
| Parameters | Pills of the job order's ordered parameters, all on; turning one off removes it from the CoA (values stay in the system) | All ordered |
| Samples | Read-only line "11 samples reported. 1 not received (S-12) is left out", with a link to the job order's Samples tab | Reported samples only |
| Attention and reference | Attention (contact select, pre-filled from the job order), Client reference / PO (pre-filled), Remarks (textarea, printed under the results) | From the job order |
| Signatory | Signatory dropdown as on the job order form: pick a user with `report.sign` or **Type manually**; pre-filled with the job order's default signatory | Job order default |

Header actions: **Publish** (primary) and ⋯ **Delete draft**. Publish opens a confirm dialog (md): "Publish CoA for JO-2026-0142? It gets the number CoA-JO-2026-0142-1 and can no longer be edited. To change it later, revise it." **Publish**. After publishing, a toast offers "Save these bases and signatory as PT Bukit Asam's default" (spec S-28; the client default is saved from the report flow, Navigation plan point 5).

### 5.2 CoA, published and sent

Header: number, status badge, the job order, client and revision as separate texts. Actions by role: **Download** and **Print** (Lab admin, CSO, Supervisor, Manager), **Mark sent** (CSO; becomes **Add another send** after the first), ⋯ **Revise** (Lab admin), **Void** (Superadmin).

| Card | Content |
| --- | --- |
| Details | Job order (link), Client, Attention, Client reference, Bases, Parameters (count, "8 parameters"), Samples (count), Published (date and person), Signatory (name and title as two texts), Printed (count, last print) |
| Delivery | One row per send: channel icon, recipient, date, who marked it. Empty: "Not sent yet" and **Mark sent** for the CSO |
| Versions | One row per revision: revision number, status (Current, Superseded, Void), date, reason for the revision. A superseded row opens that version |

**Mark sent** uses the existing dialog (job order plan section 5): date, channel, recipient pre-filled. **Revise** opens a dialog (md) with a required **Reason** textarea; **Create revision** makes a draft revision 2 with the same contents (5.1), and the published revision stays current until revision 2 is published. **Void** (Superadmin) is a destructive dialog with a required reason; the number is never reused.

A superseded or void version shows a banner over the preview ("Superseded by revision 2 on 4 Nov 2026" or "Void: reason") and only Download.

### 5.3 RoA (uploaded signed file)

Same layout, read-only. Header: RoA number, badge **Signed copy**, the batch, job order and client as texts. Note in Card content: "Internal, not for distribution. This is the lab's signed paper RoA, uploaded when the batch was completed." Preview: the uploaded PDF. Actions: **Download**, **Print**.

| Card | Content |
| --- | --- |
| Details | Batch (link), Job order (link), Client, Samples (count), Standard, Uploaded (date and person), Batch completed (date and person), File (name and size) |
| Used in | The CoA that includes this batch, with its status ("CoA-JO-2026-0142-1, Sent"), or "No CoA yet" |

A wrong RoA is replaced by reopening the batch, which is next goal; v1 has no Replace on this page.

### 5.4 CoA document (what the preview draws)

The preview is a drawing of the PDF the system renders (spec 14.3), so its layout is part of this plan. One A4 page per 8 samples, following the SUCOFINDO sample and spec 9.8:

1. **Header**: SGSI logo and laboratory address; title "Certificate of Analysis"; certificate number and revision; date issued.
2. **Client block**: client (principal) name and address, attention, client reference / PO, job order number, date received, sample count and description.
3. **Statement**: one line naming the standards used for preparation and analysis (from the job order's standard, ASTM, ISO or GB/T).
4. **Results**: one table per sample (sample ID and lab ID, then parameter, unit and one column per chosen basis, and the method with edition on each row), as the sample RoA's per-sample block (F-RPT-02).
5. **Remarks**, if any.
6. **Signature block**: signature and stamp area, signatory name and title.
7. **Footer**: "Issued at Samarinda on 2 Nov 2026", "This certificate may not be reproduced except in full", page n of m, verification code, form code.

No specification column (D-43).

## 6 · Where a CoA starts (changes to the job order CoA tab)

The CoA card on the job order (CoA tab and Overview) gets the two states that are missing in the frames:

| State | CoA card shows | Who |
| --- | --- | --- |
| Not ready | "Not generated yet. Needs every batch completed (1 of 2)" | Everyone |
| **Ready** | "All 2 batches are completed." **Generate CoA** (Button lg, primary) | Lab admin; others see "Ready for the Lab admin" |
| **Draft** | "Draft started by Maya Lestari on 4 Nov 2026." **Continue draft** | Lab admin |
| Published, Sent | As built (number, Download, Mark sent; sent line) plus **Open in Reports** | As built |

**Generate CoA** creates the draft and opens `/reports/:id` (5.1). My work Q6 (CoAs to generate) opens the same place. Two frames are added to module 03 (section 8).

## 7 · Tablet (834) and phone (390)

| Screen | Tablet | Phone |
| --- | --- | --- |
| List | Same table with fewer columns: Number (with client under it), Status, Published, Download, menu; tabs and chips as desktop; filters in the toolbar | Cards: number, status badge, client, job order, date; Download icon; filters behind a **Filters** button (bottom sheet); tabs scroll if needed |
| Report page | Preview on top (page width), cards below in one column; actions in the header, overflow in ⋯ | Header compacts (number, badge); a document card with the first page as a thumbnail and **Open PDF**; Details, Delivery, Versions stacked; sticky bar with **Download** and **Mark sent** (CSO) |
| CoA draft | Contents card above the preview | Contents as a full-screen form with a sticky **Publish**; preview via **Preview PDF** |
| Dialogs | Centered | Bottom sheet (Mark sent sheet exists) |

## 8 · Frames (module 07, row L)

Names follow `../Design System/Frame_Naming.md`.

| SS | Screen | VV Variant | Sizes | Persona | Content |
| --- | --- | --- | --- | --- | --- |
| 01 | Reports_list | 01 CoA_tab | D, T, P | Maya Lestari | CoA tab, 10 rows mixing Draft, Published, Sent, Superseded |
| | | 02 RoA_tab | D | Maya Lestari | RoA tab, 10 rows |
| | | 03 CSO | D | Rina Kartika | CoAs only, no tabs, no Draft chip |
| | | 04 Analyst | D | Fitri Handayani | RoAs only, no tabs |
| | | 05 Multi_select | D | Rina Kartika | 2 rows selected, Download PDFs bar |
| | | 06 Empty | D | Maya Lestari | No reports yet |
| | | 07 No_results | D | Maya Lestari | Filters with no match, Clear filters |
| | | 08 Filters | P | Maya Lestari | Filters bottom sheet |
| 02 | CoA | 01 Draft | D, T, P | Maya Lestari | Contents card, DRAFT watermark preview |
| | | 02 Draft_signatory | D | Maya Lestari | Signatory dropdown open |
| | | 03 Publish_confirm | D | Maya Lestari | Publish dialog |
| | | 04 Published | D, T, P | Maya Lestari | Details, Delivery empty, Versions |
| | | 05 Mark_sent | D | Rina Kartika | Mark sent dialog over the page |
| | | 06 Sent | D | Rina Kartika | Delivery with one send, Add another send |
| | | 07 Revise | D | Maya Lestari | Reason dialog |
| | | 08 Superseded | D | Maya Lestari | Revision 1 with the banner, Versions with revision 2 current |
| | | 09 Void_confirm | D | Wahyu Pratama | Destructive dialog with reason |
| 03 | RoA | 01 Default | D, P | Maya Lestari | Signed copy, Details, Used in |
| | | 02 Analyst | D | Fitri Handayani | Same, Download only |

Job order additions (module 03, screen 05 CoA_and_actions): **04 Ready_to_generate** (D) and **05 Draft_in_progress** (D), the CoA tab in the two new states of section 6.

Total: 18 desktop, 3 tablet and 5 phone frames in row L, plus 2 desktop frames in row C (job order): 28 frames.

## 9 · Demo data

- Job orders JO-2026-0133 to JO-2026-0142 and batches B-2026-0413 to B-2026-0422 (existing lists); clients from the Master Data plan (PT Bukit Asam Tbk with its logo, PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, PT Mahakam Coal Resources, CV Sumber Batu Hitam).
- CoA numbers `CoA-{job order}-{revision}` (as on the job order CoA card): CoA-JO-2026-0142-1 (Sent by WhatsApp to Budi Santoso), CoA-JO-2026-0139-2 (Published; revision 1 superseded, reason "Wrong client reference"), one Draft for JO-2026-0141.
- RoA numbers as uploaded: RoA-0413 to RoA-0422, uploaded by Maya Lestari.
- Signatory: Ir. Bambang Sutrisno, M.T., Laboratory Manager.
- The CoA preview uses the values of the Analysis tab demo (TM, IM, Ash, VM, FC, TS, GCV) for PT Bukit Asam's samples.

## 10 · Data each screen needs (v1)

`reports` (spec 13): kind (roa, coa), number, revision, status (draft, issued, sent, superseded, void), job order, batch (RoA), file and hash, payload (CoA), signatory name and title, published by and at, print count. `report_deliveries` (Mark sent: date, channel, recipient, by). `report_sources` (the RoAs a CoA was built from). For an uploaded RoA: the file, number, uploaded by and at, from the batch's RoA card.

## 11 · Design rules that apply

- Card anatomy: cards padded 16, Card head 32 fixed, notes in Card content (`../Design System/Component_Library_Plan.md`).
- Every form and confirmation is a centered Dialog; phones use the Bottom sheet.
- Button sizes as renamed on Nov 5: lg 40 for header actions, md 32 in card heads and table toolbars, sm 28 for actions inside table rows.
- Client avatars round, 40 in tables. Tabs are library Tab instances.
- No " · " between values; separate texts. No count subtitles under titles.
- Role sidebar per persona.

## 12 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Does the Reports list open on CoA or RoA for roles that see both? | CoA |
| 2 | Can the Lab admin leave out samples or parameters from the CoA? | Parameters yes (pills); samples no: every reported sample is on it, samples not received are left out automatically |
| 3 | Bases on the CoA | Chosen per CoA, default the client's last choice, first time all four |
| 4 | Is the CoA template choice shown in v1? | Read-only "House CoA template, version 1"; per-client templates come with Configuration |
| 5 | Who can print | Everyone who can download; each print is logged (count on Details) |
| 6 | Bulk download | Download PDFs as one zip, for every role that can download |
| 7 | Draft visibility | Lab admin and Superadmin only; CSO, Supervisor and Manager see a CoA once it is published |
| 8 | CoA number | `CoA-{job order}-{revision}`, as already drawn on the job order CoA card |
| 9 | Where Generate CoA lives | Job order CoA card and My work Q6; not on the Reports page |
| 10 | A page with more than 8 samples | More A4 pages; the preview pages with ‹ › |

## 13 · Build steps (after go)

1. Library: a **Document page** drawing helper (A4 frame, header, results table per sample, signature block, footer) used by the preview; no new library component unless the page is reused elsewhere.
2. `library/screens/rowL.js` builds row L (list, CoA, RoA) with the role sidebar; `rowC.js` gets the two CoA card states.
3. `naming.js` gets the module 07 rules; `cards.js` and `fit.js` run as usual.
4. Deploy to the open file (dirty check, backup, swap), commit. No export unless asked.
5. Docs: this plan gets its build status; spec S-28 gets a v1 note (CoA only; RoA is the uploaded file), S-11 marked next goal for v1; `Frame_Naming.md` gets module 07; README.
