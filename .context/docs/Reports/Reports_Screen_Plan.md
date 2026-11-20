# Reports screen plan

> **FORMAT MISMATCH (flagged Nov 10, 2026).** The lab's sample identifiers changed (spec 6.1, D-51): Sample ID `SG.YYMMDD.CCC.BB.NNN` and sample code `CCC.BB.NNN.Lotxx` replace the lab code `B{batch}-NN`, and the client's own name is now the Client reference. The rules in this plan follow the new format, but the built frames, the prototype and the demo values here (`BNM-3507`, `B0410-07`) **still show the old format and are not being rebuilt**. **Where they disagree, the spec wins.** Register of mismatches: `../Project/Sample_Identifiers_Plan.md`.

Written Nov 5, 2026. **Status: BUILT Nov 5, 2026** (section 14). Module 07 Reports, canvas row **L**. Builds on spec S-11, S-28, 9.5 and 9.8 (`../Project/Coal_LIMS_Development_Spec.md`), the job order CoA tab (`../Job Order/Job_Order_Screen_Plan.md` sections 2 and 5), the batch RoA card (`../Batch/Batch_Screen_Plan.md`), the My work queues Q6 and Q7 (`../My Work/My_Work_Screen_Plan.md`) and the sidebar rules (`../Navigation/Navigation_Screen_Plan.md`).

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

Same layout, read-only. Header: RoA number, badge **Signed copy**, the batch, job order and client as texts. Note in Card content: "Internal, not for distribution. This is the lab's signed paper RoA, uploaded when the batch was completed." Preview: the uploaded signed PDF (section 5.5 shows what it contains). Actions: **Download**, **Print**.

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
4. **Results**: one table per sample (Sample ID and sample code, then parameter, unit and one column per chosen basis, and the method with edition on each row), as the sample RoA's per-sample block (F-RPT-02).
5. **Remarks**, if any.
6. **Signature block**: signature and stamp area, signatory name and title.
7. **Footer**: "Issued at Samarinda on 2 Nov 2026", "This certificate may not be reproduced except in full", page n of m, verification code, form code.

No specification column (D-43).

### 5.5 RoA document (what the RoA preview draws)

The RoA is the lab's paper report (form FM-LAB-021 rev 1), signed by the Technical Supervisor and uploaded as a PDF when the batch is completed. The preview on the RoA page shows it, so its content is part of this plan:

1. **Header**: SGSI logo, laboratory name and address; RoA number, "Internal, not for distribution" in red, and the issue date.
2. **Title and client block**: "Report of Analysis"; principal, attention, reference (PO), job order, date received, and the number of coal samples (held samples excluded).
3. **Statement**: "Results as entered by the Analyst and signed by the Supervisor. The values are reported on four bases."
4. **Results**: one block per sample (Sample ID and sample code), a table with parameter, unit, one column per basis (ADB, DB, DAF, AR) and the method with edition. Total moisture is reported on AR only, inherent moisture on ADB only, and ash on ADB, DB and AR. Fixed carbon is "By calculation". A held sample shows "Not analysed" with its hold reason.
5. **Signature block**: "Issued at Samarinda", the date, and the Technical Supervisor's name and title.
6. **Footer**: "Internal, not for distribution. Signed copy kept in the laboratory file.", page n of m, and the form code.

The preview shows a page pager; the prototype draws two samples per page.

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

## 14 · Build status (Nov 5, 2026)

All 28 frames are built: 26 on row **L  Reports** with `library/screens/rowL.js` (module 07, final names, role sidebar per persona) and 2 on row E (`rowE.js`, module 03 screen 05, 04 Ready_to_generate and 05 Draft_in_progress, built as Lab admin Maya Lestari). The open points of section 12 were used with their defaults. Deployed to the main file (backup `backup/SGSI-LIMS-screens.before-reports.figcraft`).

What was built, from library instances: Tab, Filter chip, Search, Select, Checkbox, Status badge, Pager, Sticky action bar, Empty state, Inline alert, Key-value row (Inline), Parameter pill, Option row, Dialog, Bottom sheet, Icon button, Avatar (and the `ptba-logo` frame for PT Bukit Asam). The **document page** (A4, 560 × 792, header, client block, standards statement, two sample tables on four bases, signature block, footer, DRAFT watermark) is a drawing helper in `rowL.js`, not a library component.

Deviations from the plan:

- **No zoom controls** under the preview: the icon library has no minus glyph. The preview shows **‹ Page 1 of 2 ›** only.
- **CoA status badge** reuses the job order Status badge colours with its own label: Published (the Reported colour), Sent (Delivered), Superseded and Void (Cancelled). A dedicated badge set is not needed yet.
- **Download PDFs** on the multi-select frame is the library **Sticky action bar** (note "2 selected", Clear, Download PDFs), as in My work.
- **Details** shows the person next to the date as a second text (Value 2), and the signatory's title as its own row, so no value joins two facts with a separator.
- **Draft** shows "Number on publish" where the certificate number goes, because a draft has none. Demo sample IDs follow the client's initials and the job order number (BA-0142-01, BN-0131-01); from Nov 10 they follow spec 6.1 (`SG.260901.001.RI.001`, sample code `001.RI.001.Lot01`).
- **Persona per frame:** Lab admin on the lists, Draft, Published and Revise; CSO on the CSO list, multi-select, Mark sent and Sent (desktop) and on the phone Published frame (sticky bar Download and Mark sent); Superadmin on Void; Analyst on the Analyst frames.
- **Row menu** is not drawn open; its entries are in section 4. A frame can be added when the menu component is wanted.
- **Tablet and phone** frames exist for the CoA list, CoA draft and CoA published, plus the phone Filters sheet and the phone RoA page; the RoA tab, CSO, Analyst, Empty and No_results states are desktop only, as planned.
- **Job order CoA card:** the published and sent cards got an **Open in Reports** ghost button; the two new states (Ready with **Generate CoA**, Draft with **Continue draft**) follow section 6.
- **Dates:** the demo CoA list uses job orders JO-2026-0126 to 0132 and 0141 to 0142, so it does not collide with the job orders that are still in progress on the Dashboard.

## 15 · Owner edits (Nov 6, 2026)

The search field in the Reports list toolbar is 360 wide on desktop (was 300); the Status, Period and Company controls move with it. Built into `rowL.js`. The tablet and phone lists keep their width.

## 16 · Revision 2 · Digital signing and the new certificate (Nov 20, 2026) · PLAN

Why:
- **Digital signature (lab, Nov 20):** the lab wants CoAs signed digitally.
- **Signing rule (owner, Nov 20):** only the signed-in user named as signatory can sign. To delegate, change the signatory.
- **Certificate design:** the lab's sample CoA and RoA (`../../source-documents/`) settle the certificate's content. The build design is `Reports_Build_Design.md` (sections 6.2 and 7.1).

This revision changes who publishes, adds the signing screens, and redraws the certificate in every preview. Generator: `library/screens/rowLs.js` (add-only, `build-screens.js Ls`). It never rebuilds row L, so the owner's edits on the existing frames stay.

### 16.1 The flow

| Step | Who | Screen |
| --- | --- | --- |
| Generate CoA, fill the draft | Lab admin | 02-01 Draft (as built), with **Send for signature** in place of Publish |
| Send for signature | Lab admin | 02-03 Send_for_signature_confirm (was Publish_confirm) |
| Wait; withdraw to edit again | Lab admin | **02-10 Awaiting_signature** |
| Review the certificate | The signatory | **02-11 Sign_review** |
| Sign and publish with their password | The signatory | **02-12 Sign_dialog** |
| Or return it with a comment | The signatory | **02-13 Return_dialog**, then the Lab admin sees **02-14 Returned** |
| Published, then sent | CSO | 02-04 to 02-06 (as built) |

### 16.2 New frames (module 07, screen 02 CoA)

Personas: Lab admin Maya Lestari (10, 14), Manager Ir. Bambang Sutrisno, M.T. (11 to 13). Demo: JO-2026-0132, CV Sumber Batu Hitam, reference SBH-077, the same draft as 02-01. It becomes **CoA-JO-2026-0132-1** at signing.

| VV | Variant | Desktop (1440) | Tablet (834) | Phone (390) |
| --- | --- | --- | --- | --- |
| 03 | Send_for_signature_confirm | Existing frame, renamed and reworded: Dialog md "Send CoA for signature?" / "Ir. Bambang Sutrisno, M.T. is asked to sign it. You can't change the contents until it is signed, returned or withdrawn." / **Cancel**, **Send for signature** | **New:** the same dialog over the tablet draft | **New:** Bottom sheet over the phone draft, same text, touch buttons |
| 10 | Awaiting_signature | Header "Draft CoA" with the status badge **Awaiting signature** (amber, the Awaiting samples colour). Actions: **Withdraw** (secondary lg) and ⋯. Inline alert Info: "Waiting for Ir. Bambang Sutrisno, M.T. to sign" / "Sent by Maya Lestari on 4 Nov 2026. Withdraw it to change the contents." Preview with the DRAFT mark. Right column: **Contents** read-only (Key-value rows: Template, Bases, Parameters, Samples, Attention, Client reference, Remarks, Signatory, On behalf of) | Preview on top, the alert and the read-only Contents below, actions in the header | Header compact; alert; document card (thumbnail, **Open PDF**); read-only Contents; sticky bar with **Withdraw** |
| 11 | Sign_review | Signatory's view. Badge **Awaiting signature**. Actions: **Return** (secondary lg) and **Sign and publish** (primary lg). Inline alert Info: "Maya Lestari asks you to sign this certificate" / "Sent on 4 Nov 2026. Check every page, then sign or return it with a comment." Preview with the DRAFT mark; read-only Contents | Same, stacked | Document card, alert, Contents; sticky bar **Return** and **Sign and publish** |
| 12 | Sign_dialog | Dialog md over 11: "Sign and publish CoA for JO-2026-0132?" / "It gets the number CoA-JO-2026-0132-1, your signature and the lab stamp, and can no longer be edited." Body: a **signature preview** panel (the signature and the stamp as they print, the name "Ir. Bambang Sutrisno, M.T.", the title "Laboratory Manager", and the On behalf of line when set), then a **Password** field "Enter your password to sign". Buttons **Cancel**, **Sign and publish** | The same dialog over the tablet frame | Bottom sheet over the phone frame, same content |
| 13 | Return_dialog | Dialog md over 11: "Return the draft to Maya Lestari?" / "Maya Lestari can change it and send it again." Body: **Comment** textarea, required ("e.g. Remarks missing for sample 3"). Buttons **Cancel**, **Return draft** | Same dialog | Bottom sheet |
| 14 | Returned | The Lab admin's draft after a return: badge **Draft**; Inline alert Warning "Returned by Ir. Bambang Sutrisno, M.T. on 4 Nov 2026" / the comment; Contents editable again; **Send for signature** | Same, stacked | Alert above the document card; sticky bar **Preview PDF**, **Send for signature** |

### 16.3 Changes to the existing frames (in place)

| Frame | Change |
| --- | --- |
| 02-01 Draft (D, T, P) | **Publish** becomes **Send for signature**. Under the Signatory select a note reads "People with signing rights. They sign with their own login." A new field **On behalf of (optional)**, placeholder "e.g. Laboratory Manager", sits under the Signatory |
| 02-02 Draft_signatory (D) | The list shows only users with signing rights: Ir. Bambang Sutrisno, M.T. (Laboratory Manager) and Hendra Wijaya, S.T. (Technical Supervisor). No edit or delete icons, no **Type manually** |
| 02-03 Publish_confirm (D) | Renamed `Send_for_signature_confirm`, text as 16.2 |
| 02-04 to 02-09 (D, T, P) | Details: "Published" shows the signer (Bambang Sutrisno) instead of the Lab admin |
| Every CoA preview: 02-01 to 02-14 (D, T), and Configuration 06-02 New_version | The **new certificate drawing** (16.4) replaces the old document page |

### 16.4 The certificate drawing

It replaces the old "Document page". The new page is **600 × 849**, still A4 proportions (the old one was 560 × 792): the table needs the width for the long parameter names. The preview Canvas hugs its content, so every card keeps its layout. It follows `Reports_Build_Design.md` 6.1 and 6.2 and the lab's samples, in SGSI branding:

1. **Letterhead:** the full SGSI logo (the library Logo, Type=Full, the SVG) on the left. On the right: "PT Sentra Geo Survey Indonesia", the address, "Accreditation LP-1234-IDN". The certificate number and the date issued sit under the logo (as on the lab sample CoA), so there is no separate number block.
2. **Number lines** (left, under the logo): "Certificate No. CoA-JO-2026-0132-1" and "Date issued 4 Nov 2026"; "Revision 1" sits under the laboratory on the right. On a draft: "Assigned at signing" and "At signing".
3. **Title:** "CERTIFICATE OF ANALYSIS", centred, Heading/H2.
4. **Client block**, two columns of label : value rows:
   - Left: Principal, Address, Attention, Reference.
   - Right (200 wide): Job order, Date received, Sample (11 coal samples), Standard.
5. **Statement**, one line: "Samples were analysed in accordance with ASTM methods." (The template's longer wording wraps in the real renderer.)
6. **Two sample tables**, bordered (Surface/border-strong, 1 px), as the RoA:
   - Head: CODE SAMPLE over Basis, Test Method, then the sample code over the Sample ID over Air Dried, Dry, Dry Ash Free and As Received.
   - Rows: Mass as Received (kg) (one value across), Total Moisture, Moisture in the Analysis Sample, Ash Content, Volatile Matter, Fixed Carbon, Total Sulphur, Gross Calorific Value (kcal/kg). The two long names wrap to two lines. The table is a grid: the row frame is the border colour and shows through 1 px gaps between white cells.
   - Methods: ASTM D3302-19, D3173-17, D3174-12, D3175-20, D3172-13, D4239-18, D5865-19.
   - Values: dot decimals, no thousands separator (5980). Ash has "-" on DAF; TM shows AR only; IM shows ADB only.
   - Identifiers per spec 6.1: sample code `005.RI.001.Lot01` over Sample ID `SG.261029.005.RI.001`.
7. **Signature block**, right:
   - "Issued at Samarinda, 4 Nov 2026".
   - On a signed CoA, the signature (Newsreader italic "B. Sutrisno" as the demo stand-in) over a round stamp: two navy rings with "SGSI" and "LAB" inside, slightly overlapping the signature. The signature is marked **DEMO** (the stamp is marked DEMO on the Profile). For review, the drawing shows the signature block on page 1; the real renderer puts it on the last page (Build design 6.2). A draft shows a dashed box "Signature placed at signing".
   - The name; the title; "On behalf of the Laboratory Manager" when set.
8. **Footer:** the terms line; "Page 1 of 2"; "Verify 7F3A-91C2", "FM-LAB-014 rev 2" (rev 3 on the Configuration preview of the draft template).
9. **DRAFT mark** on every unsigned version, as before.

### 16.5 Open points for this revision

| # | Question | Default |
| --- | --- | --- |
| 1 | Badge colour for Awaiting signature | The amber of Awaiting samples, with its own label; no new library variant |
| 2 | Who sees 02-11 Sign_review | Only the named signatory; everyone else with access sees 02-10 |
| 3 | The stamp's ring text | "SGSI" and "LAB" inside two rings, a stand-in; replaced by the lab's real stamp image when it arrives |

### 16.6 Build status (Nov 20, 2026)

Built with `library/screens/rowLs.js` and `library/screens/certpage.js` (the certificate drawing, also used by `rowL.js` for a future rebuild of row L). The run was add-only on a copy of the main file, then `stepperphone.js` and `fitcfg.js` (limited to the changed frames, never the whole file), and was deployed to the main file. Backup: `backup/SGSI-LIMS-screens.before-signing.figcraft`. 17,889 steps, 0 errors.

- **New frames (22):** on the row "P  Digital signing (Nov 20, 2026)" at the bottom of each page.
  - **Desktop (5):** 10 Awaiting_signature, 11 Sign_review, 12 Sign_dialog, 13 Return_dialog, 14 Returned.
  - **Tablet and phone (6 each):** the same five, plus 03 Send_for_signature_confirm.
  - Dialogs over the desktop and tablet frames are centred Dialog md; on the phone they are Bottom sheets.
- **Changed in place:**
  - The new certificate drawing in 12 previews: Desktop 02-01 to 02-09, Tablet 02-01 and 02-04, and Configuration 06-02 New_version (desktop).
  - **Send for signature** replaces Publish in 02-01 to 02-03 at every size.
  - The Contents card gets the signatory note and the **On behalf of (optional)** field.
  - 02-02 lists only the two people with signing rights.
  - 02-03 is renamed `Send_for_signature_confirm` and reworded.
  - Details shows the signer, Bambang Sutrisno.
- **Not changed:** the RoA pages keep their own drawing (it is the lab's uploaded paper). The phone CoA frames show the certificate card and "Open PDF", so they have no drawing.
- **Deviations:** the page is 600 × 849 (16.4); the drawing puts the signature block on page 1 for review; the comment of a returned draft shows in the alert only.
- **Not exported:** the PNG exports are stale (export only on request).

### 16.7 Placeholder signature and stamp, mono numbers (Nov 20, 2026, owner)

- **Placeholders:** the owner's placeholder images replace the drawn stand-ins everywhere a signature or stamp shows: the signed certificates, the Sign dialog, and the Profile Signature, Lab stamp and upload frames. The signature is `.context/assets/images/b_sutrisno-sign.png` and the stamp is `.context/assets/images/sgsi-stamp.svg`. Both are now components on the Library page (`b_sutrisno-sign`, `sgsi-stamp`). The DEMO marks are gone. The real images replace them when the lab sends its own (Build design 14).
- **Numbers in JetBrains Mono:** every value in the certificate tables, the mass, and the sample code and Sample ID use the **Data/Small** text style (JetBrains Mono). The head row with the sample code and Sample ID is 40 high, for the two mono lines.
- **Built** in place on the owner's saved file with `library/signassets.js` (0 errors), then deployed. Backup: `backup/SGSI-LIMS-screens.before-sign-assets.figcraft`. `certpage.js` and `rowLs.js` now draw the same, so a rebuild matches.

### 16.8 The preview is the real PDF page (Nov 20, 2026, owner)

The owner's question was whether the PDF table is cropped and whether it is prepared for a table too wide for the print size. The answer was that the drawing used the app's text styles: 12 px on a 600 px page, about twice the print size. So it is replaced.

- **Method:** the certificate and the RoA are written as HTML in the print scale of the Configuration > Report templates preview (Build design 6.2), rendered to PDF by Gotenberg, and rasterised page by page (PyMuPDF, 3×). Generator and files: `.context/design/figcraft/samples/` (`make-samples.js`; `coa-draft-sbh`, `coa-signed-ptba`, `coa-signed-bnm-r1`, `coa-draft-ptba-rev3`, `roa-0412`, each as `.html`, `.pdf` and `-p1.png` to `-p4.png`).
- **In the frames:** every CoA preview (Desktop and Tablet 02-01 to 02-14), the Configuration New_version preview and the two RoA pages show the image of page 1, with the pager "Page 1 of 4". The sample has 11 samples (the RoA 12, one held), so it runs to 4 pages.
- **New frame:** `Desktop-07-Reports-02-CoA-15-Published_last_page` shows page 4 of the signed CoA: the last tables, the signature, the stamp and the footer.
- **What changed from 16.4:** the drawing described there (600 × 849, app text styles, primary-50 head fill, a dashed signature box) is dropped. The head rows have no fill, the unsigned certificate has an empty signature space and a line, and cells wrap. The signature and stamp are the owner's placeholder images.
- **Rebuild:** `certpage.js` places the same images, so a rebuild matches. To refresh the images after a design change, run `node make-samples.js` (Gotenberg on :3000), then `library/signpreview.js` on the main file.
