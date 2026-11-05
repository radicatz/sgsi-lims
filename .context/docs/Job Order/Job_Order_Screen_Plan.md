# Job Orders Screen — Design Plan

Oct 21, 2026 · screen S-17 in `../Project/Coal_LIMS_Development_Spec.md` (sections 3.5, 9.3, 10 S-17) · first screen of the new flow
Revised Oct 27, 2026 after the first review: see **Revision 2**; **Revision 3** (contact dropdown, hint clean-up) is planned and waits for approval. It covers company and contacts, the Standard field, parameter pills, the stepper, tab order, and the new Add batch screen.

Revision 7 (Nov 2, 2026, **BUILT** in the frames): the Create form follows the prototype (version 31) and three owner changes; the FigCraft file is organised by screen size. See the next section.

Revision 6 (Oct 30, 2026, built in part): the job order frames are redrawn from scratch in FigCraft, built only from the new component library. See the section after Revision 7.

## Revision 7 · Prototype sync and Create form changes (Nov 2, 2026) · BUILT

Written for: the product owner and whoever builds or reviews the frames and the prototype.

The prototype (artifact version 31, read from its source) had moved ahead of the row B frames. The frames now match it, plus three changes the product owner asked for. Frames affected: every Create frame at three sizes, the contact and signatory dropdowns and sheets, P1, P10, P11 and the Ash analysis popover and sheet.

| # | Change | Source | What the frames show now |
| --- | --- | --- | --- |
| 1 | **Contact person is one field**, not rows of contacts. A select box showing name, phone and email (phone: name and phone), disabled until a company is chosen. The company's contacts open in the dropdown (desktop, tablet) or sheet (phone). The rows with phone, email and trash, the "Primary contact" note and the **+ Add contact** button under the field are gone (the button lives in the dropdown) | Prototype | Create · Desktop, Tablet, Step 1; Company name and Client reference / PO share a row on desktop and tablet |
| 2 | **Preparation is a parameter pill**, the first row of the Parameters block, on by default. The switch "Sample preparation by the lab" is gone. Off means the client sends a ready −212 µm analysis sample | Prototype | Row "Preparation" with one pill; the count "8 selected" counts it |
| 3 | **Search parameters** is a search field between the quick select and the first row of pills ("Search parameters…"). The prototype only shows a ghost button that explains it is specified, not built | Prototype, owner's choice of look | Search field on desktop, tablet and phone |
| 4 | **A selected parameter pill has no icon.** On = tinted fill, blue border, dark blue text. Locked keeps its lock, Auto-added its sparkle. The check icon on the selected standard chips stays | Owner | Library: Parameter pill, State=On |
| 5 | **Expected samples shows a hint, not a value**: the placeholder is the muted text "e.g. 12". The earlier frames showed 12 as an entered value (in the prototype the placeholder is a bare "12", which looks like data). The filled frames keep 12 as entered data; the P1 frame shows the empty field with the hint | Owner | P1 Validation errors |
| 6 | **The Samples choice is removed** (Add samples now / Later). Submit always opens the new job order on its Samples tab with the toast "JO-2026-0143 submitted · add the sample IDs next" (frame P2) | Owner | Create · Step 2 has Report and Notes and files only |

Smaller alignments with the prototype: a subtitle under the modal title ("Enter the company's request. Sample IDs come next."); a counter "N selected" beside Parameters; the quick-select buttons are **ghost buttons (text only)** with no selected state, because they are shortcuts that replace the selection and nothing more (hover is allowed); the "Matches: …" label, the standard helper line and the P11 info alert are not drawn (hints removed in Revision 3); the section "Other" is called **Notes and files**; Sample type reads Exploration cores and Priority reads Standard; the signatory label is "Default signatory (optional)"; the remove-contact dialog reads "Remove *name* from contacts?" with "Submitted job orders keep this contact's name on their documents."

### 7.1 FigCraft pages by size

`SGSI-LIMS-screens.figcraft` now has four pages: **Library** (components, foundations), **Desktop** (1440), **Tablet** (834) and **Mobile Phone** (390). Each screen frame sits on the page of its size. Desktop: List, List · Empty, and row B (Create, P1, P11, contact dropdown list and edit, remove contact, ash analysis open, signatory dropdown list and edit). Tablet: List, Create. Mobile Phone: List, Create step 1 and 2, contact and signatory sheets (list, edit), ash analysis sheet. New screens follow the same rule. The generator (`library/screens/rowB.js`) selects the page by size.

### 7.2 Prototype follow-up

The prototype (version 31) still differs from points 2 to 6: its Preparation pill and the other selected pills show a check, unselected pills a plus; Search parameters is a button with a toast; Expected samples has the placeholder "12"; and Create still shows Add samples now / Later. These are listed in the prototype plan, section 13, as the next prototype change.

## Revision 6 · Redraw in FigCraft from the component library (Oct 30, 2026) · PLAN

Written for: the product owner, who approves the plan, and whoever builds or reviews the frames.

### 6.1 Why and where

The screens were deleted on Oct 30 so they can be rebuilt on the new library (74 component sets, Noto Sans, tokens bound by role). The job order flow goes first because every later screen reuses its shell, list, detail and modal patterns.

| Item | Plan |
| --- | --- |
| Where | Pages by size in `SGSI-LIMS-screens.figcraft` (Revision 7: Library, Desktop, Tablet, Mobile Phone; first drawn on one page "Job orders"). The library stays on "Page 1" (renamed **Library**). A separate `.figcraft` file is not used: a second file cannot reach the components without publishing a library, so the screens would lose their link to the components (see open point R6-1) |
| Content | The current design, which is the sum of Revisions 2, 3, 3b, 4, 5 and C (archived Reception plan (`../archive/Reception_Preparation_Screen_Plan.md`; current: `../Batch/Batch_Screen_Plan.md`) section 15). No new features |
| Source of truth for behaviour | This plan, `Job_Order_Prototype_Plan.md` sections 5 and 6, and archived Reception plan sections 14 and 15. The live prototype (artifact version 30) shows the intended interaction |
| Reference look | The old frames in `.context/design/export/*.png` (layout, density, demo data). They are not copied pixel for pixel: they become library instances, with the changes in 6.3 |
| Sizes | Desktop 1440, tablet 834, phone 390, as before |
| Light and dark | Frames are drawn in Light mode. One frame is switched to the Dark mode of the variables as a preview (no separate dark drawing) |

### 6.2 Frames

Grouped in rows on the new page; each row has a title. **52 frames.**

| Row | Frame | Sizes | State and demo data |
| --- | --- | --- | --- |
| A · List | List | D, T, P | 128 job orders, status chips, filters, 10 rows (one past due, one cancelled, two CoA sent) |
| | List · Empty | D | First use: `clipboard-text`, help line, **New job order** |
| B · Create | Create (modal 720 over the dimmed list) | D, T | JO for PT Bara Nusantara Mandiri, template TM + Prox + TS + CV, drawn at full length |
| | Create · Step 1, Step 2 | P, P | Full-screen form in two steps, sticky Next and Submit |
| | Contact dropdown · List, · Edit | D, D | List: Budi Hartono checked; Edit: new row with inputs and the save icon, other rows dimmed |
| | Contact sheet · List, · Edit | P, P | Bottom sheet versions |
| | Signatory dropdown · List, · Edit | D, D | Ir. Bambang Sutrisno, M.T. checked |
| | Signatory sheet · List, · Edit | P, P | Bottom sheet versions |
| | Ash analysis open | D | Checklist popover, 9 of 29 selected |
| | Ash analysis sheet | P | **New:** the phone bottom sheet, never drawn before |
| | P1 Validation errors | D | Summary "Fix 3 fields to submit", three fields in error |
| | P10 Remove contact | D | Dialog over the open contact dropdown |
| | P11 Coking coal, ASTM + GB/T | D | **Updated** to the open point 11 rule (see 6.3) |
| C · Detail | Overview | D, T, P | JO-2026-0142: stepper on Analysis, Properties, Batches card, CoA card (not ready) |
| | Overview · Dark preview | D | The desktop Overview with the frame set to the Dark mode |
| | Batches | D, T, P | JO-2026-0142: B-2026-0417 Completed with RoA number and PDF link, B-2026-0418 Analysis |
| | Batches · Empty | D, T | JO-2026-0137, **+ Add batch** |
| | Batches · Samples awaiting arrival | D | Revision B: the line about samples waiting, with the link to Add batch |
| | Samples | D, T, P | JO-2026-0134: 6 expected, editable grid (phone: cards) |
| | Samples · Mixed states | D, T, P | JO-2026-0137: 4 received, 2 in batch (B-2026-0421), 1 awaiting arrival, 1 not received; counts line "8 samples · 4 received · 2 in batch · 1 awaiting arrival · 1 not received" |
| | Samples · Mark as not received | D, P | Dialog with the required reason |
| | P2 Submitted toast | D | Empty Samples tab with "JO-2026-0143 submitted. Add the sample IDs next." |
| | P3 Paste preview | D | 12 rows found, 11 new, 1 duplicate |
| | P4 Unsaved rows | D | Unsaved dots, duplicate message |
| | P5 Locked row tooltip | D | "Received on 21 Oct by Dedi Kurniawan" |
| D · Add batch | Add batch (modal 720 over Batches · Empty) | D, T | JO-2026-0137: batch number editable with the pattern hint, Standard ASTM or GB/T, 8 of 16 samples ticked, "+ HGI compared with the job order" |
| | Add batch · Step 1, Step 2 | P, P | **Redrawn:** these two frames went missing on Oct 27 |
| | Add batch · Late samples | D | Revision B: the awaiting-arrival samples pre-selected |
| E · CoA and actions | CoA · Mark sent | D | Dialog: date, channel (segmented), recipient pre-filled |
| | CoA · Sent | D | "Sent by WhatsApp to" + recipient + date as separate texts, stepper complete |
| | Mark sent sheet | P | Bottom sheet |
| | P7 Cancel job order | D | Destructive dialog with the required reason |

D = desktop 1440, T = tablet 834, P = phone 390.

**Dropped compared with the old file:** the four tablet dropdown frames (contact and signatory, list and edit), because on tablet the dropdown is the same panel at the same width as on desktop; the separate Mobile · Create step 2 duplicate (P8 was a copy of Step 2); and Create · Dark mode preview (replaced by the Overview dark preview). Tell me if you want any of them back.

### 6.3 What changes against the old frames

| # | Change | Why |
| --- | --- | --- |
| 1 | Every part is an instance of the library: Sidebar, Top bar, Page header, Tabs, Stepper, Filter chips, Table rows, Cards, Fields, Dialog, Side sheet, Bottom sheet, Toast | One change in a component reaches every screen |
| 2 | **Five sample states** with real per-row badges and the counts line | Open item 1 of the archived Reception plan 15.13: the old frames only had the text rename |
| 3 | Batches show **Completed with the RoA number and a PDF link** | Revision C |
| 4 | Add batch: **batch number editable** with "Pattern B-YYYY-NNNN. The number must be unique." | Revision C (C1) |
| 5 | Coking pills follow the **open point 11 rule**: Gray-King, Y value and G index are unavailable under ASTM only ("No ASTM method. Add ISO or GB/T under Standard."); pills not covered by every standard carry a tag with the standards that cover them ("ISO · GB/T") | Already in the prototype since version 25; the old frames still said "GB/T only" |
| 6 | Parameter pill **On** = tinted fill and blue border, **no icon** (Revision 7: the prototype's check icon is dropped on the owner's request; fill and border still tell On from Off) | Owner, Revision 7 |
| 7 | Phone Add batch frames redrawn; phone Ash analysis sheet drawn | Missing in the old file |
| 8 | Performer chip gone; batch rows name who did what as text ("Prep: Dedi K. · Analysis: Fitri H.") | Revision C (C5) |
| 9 | Dark mode is a variable mode, not separate drawings | The library is fully token-bound |

### 6.4 Library changes needed first

Small additions to the library generator (`.context/design/figcraft/library/`), made before the screens:

| Component | Change |
| --- | --- |
| Sidebar | New variant property **Active** (My work, Dashboard, Job orders, Batches, and the other items), so each screen picks its highlighted item |
| Dialog | New size **xl (720)** for the Create, Edit and Add batch modals; the body slot holds the form |
| Parameter pill | On state as in 6.3 (6), no icon; new state **Unavailable** (disabled with tooltip text) and an optional **coverage tag** ("ISO · GB/T", "subcontracted") |
| Option row | New states **Editing** (name, phone and email inputs, save icon) and **Dimmed** (other rows while one is edited), for the contact and signatory dropdowns |
| Table row | New templates **Job order compact** (tablet list) and **Job order batch** (Batches tab: batch no., standard, samples, parameters, status, performers, RoA, deadline); the Sample template gets an **Unsaved** state (dot) |
| Stepper | No change: the job order uses Steps=6 with its own step names |

The library is rebuilt by the same scripts in order (`build.js`, `finish.js`, the Foundations merge and the dark-mode fix). This regenerates the library, so the main file is checked first: if it changed since my last save (your edits in the app), I stop and ask before rebuilding.

### 6.5 How it is built

1. Library changes (6.4), rebuilt and checked by render.
2. A screen generator (`library/screens/`): an app-shell builder (sidebar, top bar, page area at each size), the demo data, and one function per frame. It writes to a copy of the file; nothing touches the main file until the frames pass the checks.
3. Every frame is rendered and checked: no clipping, no horizontal page scroll, 44 px touch targets on tablet and phone, text inside its box.
4. The copy replaces the main file; old version to `backup/`.
5. Docs: build status here, README, memory.

I will show you renders after step 1 and after the first row (A · List), then build the rest.

### 6.5b Build status (Oct 30, 2026): row A built

Answers: new page in the same file (R6-1); tablet dropdown frames dropped (R6-4); keep "RoA approved" (R6-2); keep Input ROA and Review ROA in the sidebar for now (R6-3).

Built on the page **Job orders** (the library page is renamed **Library**): List · Desktop, List · Empty · Desktop, List · Tablet, List · Phone. The shell (top bar, sidebar with the active item, content area) is generated at three sizes from library instances. Library changes made for row A, in the generator (`library/screens/`), not by hand: the job order table row is narrower (1102) with a flexible Company column; new `Table header row compact` and `Table row compact` for the tablet list; the old `Card job order` is replaced by a card with progress, RoA and CoA lines and a past-due state. The other changes in 6.4 (pill On state, Dialog 720, Option row editing) come with rows B to D. The CoA column uses the existing Tag variants (No CoA, Saved with the text Published, CoA uploaded with the text Sent · channel); a dedicated CoA tag is a later library item.

### 6.6 Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| R6-1 | "New page file": a new **page** in the same file, or a separate `.figcraft` file? | New page "Job orders" in the same file, because a separate file loses the link to the components |
| R6-2 | Job order stepper in v1: the fourth step is "RoA approved", but in v1 the batch completes when the lab's signed RoA is uploaded | Keep "RoA approved" (the signature on the uploaded RoA is the approval) |
| R6-3 | Sidebar in v1: **Input ROA** and **Review ROA** describe the worksheet flow, which is out of v1 (results are entered in the batch's Analysis tab) | **Settled Nov 5:** hidden from every role in v1 (Navigation plan, section 1) |
| R6-4 | Tablet dropdown frames dropped (6.2) | Dropped |

## Why this screen first

The Oct 20–21 changes added a record that every other screen now depends on: the **job order**. The CSO creates it (step 1 of the flow), the sample IDs are registered on it, the Preparation team labels with those IDs, batches sit inside it, and the one CoA per job order hangs off it. Nothing in `screens.pen` shows it yet.

| Candidate | Why not first |
| --- | --- |
| New dashboard | Two dashboard versions already exist. They need edits (new roles, no client view, CoA per job order, job order counts), not a redesign, and those edits are easier once the screens they link to exist |
| My work (S-19) | Every queue on it opens a screen that does not exist yet (job order, reception, report review). It is quick to build last |
| Reception, Input/Review ROA, Report review | Each needs the job order's data (sample list, method family, client contact) to look right |

Designing Job orders first also fixes the **new navigation** (section "Sidebar update"), which every later screen reuses.

## Goal

Design the Job orders list, the job order detail, and the create/edit flow at three sizes: desktop 1440, tablet 834 (portrait), mobile 390. Use only the existing design-system components and tokens in `screens.pen`, and Phosphor icons. Demo data uses the personas in spec section 8.1 and invented client names.

## Who uses it

| Role | What they do here |
| --- | --- |
| CSO (Rina Kartika) | Creates job orders, registers sample IDs, attaches files, follows status, downloads the CoA, marks it sent |
| Preparation team | Opens a job order to see the expected samples before reception (read-only here; reception is S-18) |
| Lab admin, Supervisor, Manager | Read the job order and its batches; lab admin creates batches |
| Analyst | Reads only |

The frames are drawn for the CSO, who has every action on this screen. The Add batch frames are drawn for the lab admin.

## Revision 2 · Feedback of Oct 27, 2026

| # | Feedback | Decision | Where in this plan |
| --- | --- | --- | --- |
| 1 | "Client name" becomes **Company name** | Renamed on every job order screen: create form, list column and filter, detail header, Properties card | Section 4, list columns |
| 2 | Add company address (optional), contact person, contact phone, email (optional) | Company block with address; contacts as rows | Company and contacts |
| 3 | Contact is a dropdown; **+ Add contact** adds a row | Each row's name field picks an existing contact of the company or takes a new name | Company and contacts |
| 4 | Trash icon per contact row, shown on hover, with confirmation; hidden when only one contact is left | Agreed. On touch screens the icon is always visible, because there is no hover | Company and contacts |
| 5 | Method family: add GB/T and rename the field **Standard** | Agreed. The spec already lists `GBT` in the `standards` table; the job order check constraint must be widened | Standard |
| 6 | Standard as a multiselect, because batches in one job order can use different standards | **Feasible, with one rule: the job order holds the allowed set, and each batch uses exactly one standard from it.** See the evaluation below | Standard |
| 7 | Service becomes **parameter pills** with quick-select templates; rename the default to **TM + Prox + TS + CV** | Agreed, with dependency rules and grouping (230 parameters cannot all be pills). The parameter set can also be adjusted per batch | Parameters and quick-select templates |
| 8 | Add **Preparation** and **Coking coal** | Preparation becomes a switch on every job order, plus a "Preparation only" template. Coking coal adds a pill group and a template | Parameters and quick-select templates |
| 9 | Connect the stepper line | Steps are joined by a continuous line: solid in the success colour up to the current step, solid in the neutral border colour after it (no dashes; changed Oct 27) | Section 2 |
| 12 (Oct 27) | New job order opens as a **centered modal**, not a right side sheet | 720 px wide, centered over the dimmed list, rounded corners; the body scrolls and the footer stays fixed. Mobile stays full screen in two steps. Add batch keeps its side sheet (see open point 10) | Section 4 |
| 13 (Oct 27) | Section headers use **JetBrains Mono** | Every uppercase section header (COMPANY, WORK, REPORT, SAMPLES, NOTES AND FILES) uses the Section header style: mono 11 / 16, weight 500, letter-spacing +1.5, uppercase, `text-muted`. It is the same family as the dashboard's date overline and is documented in the Typography scale of the Foundations frame | Design system |
| 10 | Tab order: Overview, Batches, Samples, Files, … | Overview · Batches · Samples · Files · CoA · History | Section 2 |
| 11 | Add the **+ Add batch** screen | New Batches tab frame and Add batch sheet at three sizes | Sections 7 and 8 |

### Answers of Oct 27, 2026 (second round)

| Question | Answer | Effect |
| --- | --- | --- |
| Which contact is "Attention" on the CoA | The sample CoA (`source-documents/pdf-p-COA contoh.pdf`, SUCOFINDO 05442/BLAEAP) prints **no contact person**: it prints company names with addresses (Shipper, Consignee). The sample RoA prints "Attention" and an email | The first contact is the **primary contact**: printed as "Attention" on the RoA, and the default recipient in Mark sent. The CoA prints company name and address only, so the **address matters more than a contact**; it stays optional on the form but the CoA shows a warning when it is empty |
| Does the lab run CSR/CRI, G index and Y value in-house | No answer given | Default kept: pills shown, CSR/CRI tagged "subcontracted" |
| Parameters per sample or per batch | Per **batch** | Confirmed; no sample-level override |
| Sidebar "Clients" vs form "Company" | Keep **Clients** in the sidebar | Job order screens say "Company"; the sidebar and Master data keep "Clients" |
| Batch before samples are received | Yes | Registered samples can be selected; "Received only" filters them out |

### How many pills

The form shows **34 pills in 9 groups**, plus two group pills that open a checklist, and a search for the rest of the catalogue. The Preparation switch is not a pill.

| Group | Pills | Count |
| --- | --- | --- |
| Moisture | TM, IM, EQM | 3 |
| Proximate | Ash, VM, FC | 3 |
| Sulfur | TS, Forms of sulfur | 2 |
| Calorific | GCV, NCV | 2 |
| Ultimate | C, H, N, O | 4 |
| Physical | HGI, RD, Sizing | 3 |
| Ash | AFT reducing, AFT oxidising, Ash analysis ▸, Metal in ash | 4 |
| Chemical | Cl, P, F, Hg, Trace elements ▸ | 5 |
| Coking coal | CSN (Crucible Swelling Number), Gieseler Plastometer, Gray King Coke Type, Dilatometer Test, Sapozhnikov Test, G – Index (G Caking Index Test), CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction), Maceral Analysis (Petrographic): the eight tests of the lab (corrected Nov 3, 2026; earlier drafts listed Ro, Roga and Y value) | 8 |
| **Total** | | **34** |

`Ash analysis ▸` opens a checklist of about 29 oxides and ratios, and `Trace elements ▸` about 36 elements (spec section 11). Both count as one pill each on the form. The default template turns on 7 pills; Full analysis turns on 20; Coking coal turns on 14 (16 with GB/T). The lists are data (`parameters`, `service_parameters`), so the lab can change them in Configuration.

### Company and contacts

```
Company
┌ Company name * ─────────────────────────────┐
│ PT Bara Nusantara Mandiri                ▾  │  searchable; "+ Add 'PT X' as a new company"
└─────────────────────────────────────────────┘
┌ Company address (optional) ─────────────────┐
│ Jl. Mulawarman No. 12, Samarinda            │  pre-filled for an existing company
└─────────────────────────────────────────────┘
Contacts
┌ Contact person * ──────▾┐┌ Phone * ─────────┐┌ Email (optional) ──┐
│ Budi Hartono            ││ +62 812 5550 1844 ││ budi@baranusa.co.id │  🗑 (on hover)
└─────────────────────────┘└───────────────────┘└─────────────────────┘
┌ Contact person * ──────▾┐┌ Phone * ─────────┐┌ Email (optional) ──┐
│ Sari Wulandari          ││ +62 813 …         ││                     │  🗑
└─────────────────────────┘└───────────────────┘└─────────────────────┘
+ Add contact                                         (tertiary button)
Client reference / PO
```

| Part | Rule |
| --- | --- |
| Company name | Required. Searchable select over existing companies; typing a name with no match offers "+ Add 'name' as a new company", which creates the company when the job order is saved |
| Company address | Optional. Pre-filled from the company record; an edit here updates the company record (audited) and a note under the field says so |
| Contact person | Required, at least one row. A combobox: the dropdown lists the company's saved contacts; picking one fills phone and email. Typing a new name keeps the row as a new contact, which is saved to the company's contacts on save |
| Phone | Required. Accepts `+62` and local formats; spaces allowed; validated as 8–15 digits |
| Email | Optional; validated when filled |
| + Add contact | Tertiary button under the rows; adds an empty row and focuses its name field |
| First row | The first contact is the **primary contact**: "Attention" on the RoA and the default recipient when the CoA is sent. A small "Primary contact" label sits under the first row. The CoA itself prints no contact person (sample CoA) |
| Trash icon | Desktop: appears when the row is hovered or any of its fields has focus (so keyboard users reach it). Tablet and mobile: always visible. **Not shown when only one row is left** |
| Delete confirmation | Dialog "Remove Budi Hartono from this job order?" with the line "The contact stays in PT Bara Nusantara Mandiri's contacts." and buttons **Cancel** and **Remove** (danger). Removing the first row moves the next one up as the attention contact |

### Standard (was Method family)

The field is a **multi-select of toggle chips**: `ASTM` · `ISO` · `GB/T`. At least one is required; ASTM is on by default. With more than one chip on, a helper line reads "Each batch uses one of these standards. You choose it when adding the batch."

**Evaluation of the multi-select:** it is feasible, but only with the rule that **one batch uses exactly one standard**. The reasons:

| Concern | Why it matters | How the rule handles it |
| --- | --- | --- |
| Results differ by standard | ASTM ashes at 750 °C, ISO and GB/T at 815 °C, and volatile matter at 950 °C vs 900 °C, so the same coal gives different numbers. Mixing standards inside one batch would make the batch's averages and the RoA meaningless | A batch is analysed under one standard, so every value in it is comparable |
| Methods, limits and formulas | The methods list, repeatability limits and the NCV formula all follow the standard (spec W-5) | They are resolved per batch instead of per job order |
| RoA | One RoA per batch | Prints one standard and one methods block, as today |
| CoA | One CoA per job order, which can now span batches with different standards | The CoA shows a **Standard** line per batch and groups the methods block by standard. This needs a CoA template change, recorded in the spec changes below |
| Dashboard and trends | Values from different standards should not be mixed on one chart | Charts filter by standard, ASTM by default |

Rejected alternatives: one standard per sample (it breaks batch averages and duplicates), and splitting the job order in two (the client sent one request and expects one CoA).

### Parameters and quick-select templates

The single Service select is replaced by **parameter pills**: each pill is one parameter, and clicking it turns it on or off. Above the pills, quick-select templates appear as tertiary buttons. Clicking a template **replaces** the selection with the template's set. A label shows which template the selection matches, or "Custom · 9 parameters" when it matches none.

```
Quick select:  TM + Prox + TS + CV · Prox only · Full analysis · Coking coal · Preparation only · Clear
[ Search parameters…                    ]    (Revision 7: a search field above the first row)
Preparation  [Preparation●]    (Revision 7: a pill, not a switch; off when the client sends a ready −212 µm analysis sample)
Moisture     [TM●] [IM●] [EQM]
Proximate    [Ash●] [VM●] [FC●]
Sulfur       [TS●] [Forms of sulfur]
Calorific    [GCV●] [NCV]
Ultimate     [C] [H] [N] [O]
Physical     [HGI] [RD] [Sizing]
Ash          [AFT red.] [AFT ox.] [Ash analysis ▸] [Metal in ash]
Chemical     [Cl] [P] [F] [Hg] [Trace elements ▸]
Coking coal  [CSN] [Gieseler] [Gray King Coke Type ISO GB/T] [Dilatometer] [Sapozhnikov ISO GB/T] [G Index ISO GB/T] [CRI/CSR SUB] [Maceral]
```

Agreed with the proposal, with these additions:

- **Grouping.** The catalogue has about 230 lab parameters (spec section 11), too many for pills. The common ones are pills, arranged by group as above. Large families (Ash analysis with about 29 oxides and ratios, Trace elements with about 36 elements) are single group pills with a `▸` that opens a checklist. **Search parameters** finds anything else in the catalogue and adds it as a pill.
- **Dependencies.**
  - Turning on a calculated parameter turns on its inputs, with a short note ("Added IM, Ash, VM: FC is calculated from them").
  - An input cannot be switched off while something depends on it; its tooltip names the dependant.
  - The rules, from the spec's formulas:

  | Parameter | Needs |
  | --- | --- |
  | FC (by difference) | IM, Ash, VM |
  | TM (two-stage) | ADL from preparation, plus RM; reported as TM |
  | O (by difference) | C, H, N, TS, Ash, IM |
  | NCV | GCV, H, TM (ISO also O and N) |
  | Any as-received value | TM |
  | Coking tests | Sample preparation on (they need specific sizing) |

- **Preparation** is a switch, not a pill, because almost every job needs it and it changes the work (the Preparation team weighs and logs ADL). The "Preparation only" template turns the switch on and clears all pills, for clients who only want the sample prepared.
- **Bases are not chosen here.** Pills choose parameters; the bases printed (AR, ADB, DB, DAF) follow the report template, as in spec section 11.
- **Per-batch changes.** The job order holds the default set, and each batch starts from it. On Add batch, the pills can be changed for that batch (section 8), and a line shows the difference ("+ HGI, − TS compared with the job order").
- **Mobile.** Groups collapse into an accordion; the group with selected pills opens first; pills are 36 px tall inside 44 px touch rows.

#### Quick-select templates

| Template | Pills turned on | Preparation |
| --- | --- | --- |
| **TM + Prox + TS + CV** (default; renamed from "Prox + TM + TS + CV") | TM, IM, Ash, VM, FC, TS, GCV | On |
| Prox only | IM, Ash, VM, FC | On |
| Full analysis | TM + Prox + TS + CV, plus NCV, C, H, N, O, HGI, AFT red., AFT ox., Ash analysis | On |
| Coking coal | TM + Prox + TS + CV, plus CSN, Gieseler, Dilatation, Ro, Macerals, P, Ash analysis (for alkalis and the basicity index). When GB/T is a selected standard, **G index** and **Y value** are added too | On |
| Preparation only | none | On |
| Clear | none | unchanged |

Templates are the existing `services` rows (spec T-06), so the lab admin edits them in Configuration, and their turnaround still drives the suggested due date. A job order with a custom selection keeps a link to the template it started from, for reporting.

#### Coking coal: research summary

Coking (metallurgical) coal is judged on how it softens, swells and forms coke, not only on its proximate analysis. The tests that labs offer, with what each gives:

| Pill | Test | What it gives |
| --- | --- | --- |
| CSN | Crucible swelling number (free swelling index) | Swelling profile 0–9; a quick screen for caking ability |
| Gieseler | Gieseler plastometer | Maximum fluidity (ddpm), softening, maximum fluidity and resolidification temperatures, plastic range |
| Dilatation | Audibert-Arnu dilatometer | Softening temperature, maximum contraction and dilatation (%), and their temperatures |
| Ro | Vitrinite reflectance | Mean maximum reflectance (rank) and the reflectogram |
| Macerals | Maceral analysis | Vitrinite, inertinite, liptinite (% vol.); reactive and inert content |
| G index | Caking index G | G value, typically 20 to above 100 (above 85 preferred for coking) |
| Y value | Plastic layer (Sapozhnikov) | Plastic layer thickness Y (mm) and final contraction X |
| Roga | Roga index | Caking power |
| Gray-King | Gray-King coke type | Coke type A–G and G1+ |
| CSR/CRI | Coke reactivity and strength after reaction | Measured on coke from a test oven, not on coal; typical blast-furnace targets are CRI below about 33 and CSR above about 55 (ISO 18894 scope), and buyers often ask for CSR above 60 and CRI below 25 |
| P | Phosphorus in coal | Phosphorus (%), a penalty element for steelmaking |

#### Coking coal tests by standard (researched Oct 28, 2026)

The eight tests on the lab's coking coal list (CSN, Gieseler, Gray-King, Dilatometer, Sapozhnikov, G index, CRI/CSR, Maceral analysis) sorted into ASTM, ISO and GB/T. "None found" means the search did not find a method of that family; it is not proof that none exists.

| Test (pill) | ASTM | ISO | GB/T | Covered by |
| --- | --- | --- | --- | --- |
| Crucible swelling number, also called free swelling index (CSN) | D720/D720M (current revision -25) | ISO 501 (2025 edition) | GB/T 5448-2014 (electrical heating method) | All three |
| Gieseler plastometer (Gieseler) | D2639/D2639M (constant-torque; -23 and -24 listed) | ISO 10329:2025 | GB/T 25213-2010 | All three |
| Gray-King coke type (Gray-King) | None found | ISO 502:2025 | GB/T 1341-2007 (modified from ISO 502:1982, not identical) | ISO and GB/T |
| Dilatometer (Dilatation) | D5515 (-22 listed; applies to coals with a free swelling index of at least 1) | ISO 349:2020 (Audibert-Arnu) | GB/T 5450-2014 (modified from ISO 349:1975) | All three |
| Plastic layer, Sapozhnikov (Y value) | None found | ISO/TS 20362:2022 (automated Sapozhnikov penetration plastometer; a technical specification, for ash below 15 % dry) | GB/T 479-2016 (the Chinese plastic layer index, 烟煤胶质层指数) | ISO and GB/T |
| Caking index G (G index) | None found | ISO 15585 (2006 edition; current status not checked) | GB/T 5447-2014 (modified from ISO 15585:2006) | ISO and GB/T |
| Coke reactivity (CRI) and strength after reaction (CSR) | D5341/D5341M (-19 current) | ISO 18894:2018 | GB/T 4000-2017 (named in patent literature; not confirmed on a standards site) | All three |
| Maceral analysis (Macerals) | D2799 (-23) | ISO 7404-3:2025 | GB/T 8899 (the number is from memory; the search did not confirm it) | All three |

Related tests in the same family: Roga index has GB/T 5449-2015 and ISO 335, but ISO 335 (1974) is withdrawn. Vitrinite reflectance (Ro) has ASTM D2798 and ISO 7404-5; the GB/T number was not searched.

What this means for the design:

- **Gray-King, Sapozhnikov (Y value) and G index have no ASTM method.** A batch run under ASTM cannot report them according to ASTM. The three pills should be unavailable, or carry a note ("No ASTM method"), when the batch's standard is ASTM.
- **G index and Y value are not GB/T only.** Both have an ISO method, so the earlier rule "add them only when GB/T is selected" is a buyer convention (Chinese buyers ask for them), not a standards limit. The Coking coal template keeps it as drawn until the lab decides; see open point 11.
- **GB/T mostly mirrors ISO** for this family (CSN, dilatometer, G index and Gray-King are modified adoptions or close relatives), so results are not interchangeable without checking which edition and which deviations apply.
- **CSR/CRI** needs a test coke oven; most labs subcontract it, so the pill keeps its "subcontracted" tag until the lab says otherwise (open point 6).
- **Editions matter.** Several ISO standards were reissued in 2025 (501, 502, 7404-3, 10329) and ISO 349 in 2020, so the job order or batch should record the edition the lab uses.

Sources checked: ISO 501 and 502 pages (iso.org, ANSI, SCC), ASTM D720, D2639, D5515, D5341 and D2799 store pages, ISO 10329:2025 and ISO 349:2020 catalogue entries, ISO/TS 20362:2022 (ANSI, BSI), ISO 18894:2018, and the Chinese standard listings for GB/T 1341-2007, 5447-2014, 5448-2014, 5449, 5450-2014, 25213-2010, 479-2016 and 4000-2017.

### Spec changes this revision needs

These go into `../Project/Coal_LIMS_Development_Spec.md` once the frames are approved:

| Spec item | Change |
| --- | --- |
| W-5, S-17 create row | "Method family (ASTM or ISO)" becomes "Standard: one or more of ASTM, ISO, GB/T; each batch uses one" |
| `job_orders` | `method_family text` becomes `standards text[]`, non-empty, values in ASTM, ISO, GBT. `service_id` becomes `template_id` (nullable). `extra_parameters` is replaced by a `job_order_parameters` table. `contact_id` is replaced by a `job_order_contacts` table (job order, contact, sort order; sort 1 is the attention contact). New `prep_by_lab boolean default true` |
| `batches` | New `standard text not null` (must be in the job order's standards), plus a `batch_parameters` table (copied from the job order on create, editable until preparation starts) |
| `companies` | `address text` (optional) |
| `company_contacts` | `phone` becomes required for contacts used on a job order |
| `parameter_standards` (new, Oct 28) | Which standard method covers which parameter: `parameter_id`, `standard` (ASTM, ISO, GBT), `method_code` (for example `ISO 501`, `GB/T 5448`), `edition` (year), `status` (current, withdrawn). Seeded from the coking coal table above; the lab edits it in Configuration. It lets the app flag a parameter that has no method under the batch's standard (Gray-King, Y value and G index have none under ASTM) and print the method and edition on the RoA |
| `services` | Labelled "templates" in the UI; seed rows as in the template table above |
| `parameters` | Seed the coking coal parameters above (one parameter per reported value, for example Gieseler gives five results) |
| CoA template | Standard per batch, methods block grouped by standard |

## Revision 3 · Contact dropdown and form clean-up (Oct 27, 2026) · BUILT Oct 27, 2026

Feedback on the New job order modal. References in `screens.pen`: `contact-dropdown` (list state), `contact-dropdown_add-contact` (edit state), and the Create row of frames (where the field lives). This section replaces the contact rows in "Company and contacts" above once approved.

| # | Feedback | Plan |
| --- | --- | --- |
| 1 | Remove three hint texts | Delete "First contact is the primary contact" (desktop, tablet), "Each batch uses one of these standards. You choose it when adding the batch" (under Standard) and "Matched: TM + Prox + TS + CV" (under the template chips). Applies to Create · Desktop, Create · Tablet and P1, P10, P11. On mobile, the same two hints go and the "Primary" tag on contact 1 goes with the contact rows (see 3). The rules those hints explained stay in this plan (interaction rules) |
| 2 | Wider contact person field | The Contact person field spans the full body width (672 px in the modal) on its own row, no longer a narrow third of a row with phone and email beside it. The closed field shows the selected contact as name, phone and email on one line (phone and email in `text-secondary`) |
| 3 | Contact becomes a dropdown with the company's contacts | See the spec below. The Contact rows (name, phone, email, trash, **+ Add contact**) leave the form: contact entry moves into the dropdown |

### Contact dropdown spec

Closed field: label "Contact person *", `Input/Select` look, full width, value `Budi Hartono · +62 812 5550 1844 · budi.hartono@baranusantara.co.id`, caret on the right. Empty until a company is picked; then it says "Select a contact". Disabled when no company is chosen.

Open (matches `contact-dropdown`): a panel under the field, same width. One row per contact of the company: name, phone, email in three columns, then three icon buttons. **+ Add contact** (tertiary) sits at the bottom of the panel.

| Part | Spec |
| --- | --- |
| Selected contact | Its row carries the **check** icon (`ph check`, accent colour) and a light primary tint. On other rows the check slot is empty, so only the selected contact shows a check. Clicking a row (or its check) selects it, closes the panel and fills the field |
| Edit | Pencil icon on a row switches the panel to the edit state for that row |
| Delete | Trash icon (danger colour) opens the existing remove dialog "Remove Sari Wulandari?" with "The contact stays in the company's contacts" replaced by "This removes the contact from PT Bara Nusantara Mandiri". Not allowed for the selected contact (trash disabled) |
| Add | **+ Add contact** switches to the edit state with a new empty row at the bottom, first field focused |

Edit state (matches `contact-dropdown_add-contact`): the row being edited has its name, phone and email as text inputs; every other row is dimmed and all its buttons (check, pencil, trash) and **+ Add contact** are disabled. On the row being edited the **check icon becomes a save icon** (`ph floppy-disk`), so saving a contact is never confused with selecting one. Save validates (name and phone required, email optional and valid when given), stores the contact on the company, selects it, and returns to the list state. The trash on the edited row discards the edit; for a new row it removes the row. Esc cancels the edit; Esc again closes the panel.

Mobile: the field opens a bottom sheet with the same list (name on the first line, phone and email below) and the same edit state, because three columns do not fit 390 px. A row shows its icons at the right as on desktop.

### Decisions and open points for Revision 3

| Point | Default used in the plan | Needs your answer |
| --- | --- | --- |
| One contact or several · **answered** | **One contact per job order** (confirmed Oct 27) (the checked one is the attention contact on the RoA and the default CoA recipient). This follows your description: one field, one check mark | none; answered: one contact only |
| Tablet | Same as desktop, panel width = field width | none |
| Spec | `job_order_contacts` (many) is replaced by `job_orders.contact_id` (one), with phone required on the contact | To apply to `../Project/Coal_LIMS_Development_Spec.md` together with the other Revision 2 spec changes |

### Frames to change when built

Create · Desktop, Create · Tablet, P1, P10, P11 (remove hints, wide contact field); new frames: **Create · Contact dropdown (list)** and **Create · Contact dropdown (edit)** for desktop and mobile (bottom sheet), plus the matching tablet frame; the Contact Row component is reworked to the dropdown row (name, phone, email, check/save, pencil, trash, plus disabled variants). The two sample frames `contact-dropdown` and `contact-dropdown_add-contact` are used as the source for the row design, then moved into the "Revision 2 components" group. F8 (remove a contact) and the P10 dialog follow the new delete rule.

## Frames

| # | Frame | Sizes | Content |
| --- | --- | --- | --- |
| 1 | `Job Orders · List` | Desktop, tablet, mobile | List with filters and status counts |
| 2 | `Job Order · Detail · Overview` | Desktop, tablet, mobile | Header, progress stepper, Properties, batches summary, CoA card |
| 3 | `Job Order · Detail · Samples` | Desktop, tablet, mobile | The sample list tab (the CSO's main data entry) |
| 4 | `Job Order · Create` | Desktop (centered modal), tablet (centered modal), mobile (full screen, 2 steps) | The create form |
| 5 | `Job Order · Detail · CoA · Mark sent` | Desktop only | The CoA tab with the "Mark sent" dialog open |
| 6 | `Job Orders · List · Empty` | Desktop only | First-use empty state |
| 7 | `Job Order · Detail · Batches` (Revision 2) | Desktop, tablet, mobile | The Batches tab with **+ Add batch** |
| 8 | `Job Order · Add batch` (Revision 2) | Desktop (centered modal), tablet (centered modal), mobile (full screen, 2 steps) | The Add batch form |

Frames 1–4 at three sizes (12) plus frames 5 and 6 on desktop (2) make **14 frames**, in a new "Job Orders" row group of the Screens region, below the dashboard rows. Revision 2 adds frames 7 (3) and 8 (4), making **21 screen frames**.

## Sidebar update (applies to every screen from here on)

The v2 sidebar groups were built for the old three-role model. The new flow needs these entries. Items a role cannot use are hidden for that role.

| Group | Items | Phosphor icon |
| --- | --- | --- |
| — | My work | `tray` |
| — | Dashboard | `squares-four` |
| WORK | Job orders | `clipboard-text` |
| | Batches | `stack` |
| | Input ROA | `pencil-simple-line` |
| | Review ROA | `check-square-offset` |
| | Reports (RoA & CoA) | `file-text` |
| — | Search | `magnifying-glass` |
| MASTER DATA ▾ | Clients | `buildings` |
| | Drill hole, Lithology, Seam | existing icons |
| ADMIN ▾ | Users, Configuration, Audit log | `users`, `gear-six`, `clock-counter-clockwise` |

- Update the existing components `Sidebar/Expanded` and `Sidebar/Collapsed` in place, so the dashboard v2 frames pick up the change. "Companies" is renamed **Clients**.
- The user chip at the bottom shows name and role title, e.g. "Rina Kartika · Customer Service Officer".

## 1 · Job Orders · List

### Desktop (1440, sidebar expanded)

```
┌ Sidebar ──┬ Top bar: search · bell · Rina Kartika (CSO) ──────────────────────┐
│ My work   │ Job orders                                   [+ New job order]     │
│ Dashboard │ 128 job orders                                                     │
│ WORK      │ [All 128][Draft 3][Awaiting samples 9][In progress 21]             │
│ ▣ Job ord.│ [Reported 4][Delivered 87][Closed][Cancelled]   ← status chips      │
│ Batches   │ [Search no., client, PO] [Client ▾] [CSO ▾] [Due ▾] [Filters ⚲]    │
│ …         │ ┌──────────────────────────────────────────────────────────────┐  │
│           │ │No.   Client      Service  Samples Batches Due    Status  CoA │  │
│           │ │JO-26 PT Bara…    Prox+TM… 12/12   1/1     24 Oct ●In pr. —   │  │
│           │ │…  (10 rows, one past due highlighted, one "Sent" CoA)        │  │
│           │ └──────────────────────────────────────────────────────────────┘  │
│           │ Showing 1–10 of 128                         ‹ 1 2 3 … 13 ›        │
└───────────┴────────────────────────────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Header | Title, total count, primary button **New job order** (CSO only) |
| Status chips | One chip per job order status (spec 9.3) with its count; selecting one filters the table. "All" is default |
| Filters | Search (job order no., client, client reference/PO), Client, CSO, Due date range; "Filters" opens the side panel (saved filters) |
| Columns | Job order no. · Client (with contact underneath, small) · Service · Samples (received / expected) · Batches (RoA issued / total) · Due date · Status badge · CoA (—, Draft, Published, **Sent** with channel icon) · row menu (Open, Edit, Cancel) |
| Row states | Past due: due date in danger colour with a `warning` icon; on hold: `pause` badge |
| Footer | Count and pagination, 10 rows |

### Tablet (834, sidebar collapsed)

Status chips scroll sideways in one row. Filters collapse to Search + "Filters" button (sheet). Table drops Service and Batches columns; Client keeps the contact line.

### Mobile (390)

Top bar with menu button. Title + count, then a **full-width New job order button** pinned at the bottom (CSO). Status chips scroll sideways. One card per job order:

```
┌──────────────────────────────┐
│ JO-2026-0142      ● In progress│
│ PT Bara Nusantara Mandiri     │
│ Prox + TM + TS + CV · ASTM    │
│ Samples 12/12 · Due 24 Oct    │
│ ▓▓▓▓▓▓▓░░░ RoA 0/1 · CoA —    │
└──────────────────────────────┘
```

## 2 · Job Order · Detail · Overview

### Desktop

```
Job orders / JO-2026-0142
JO-2026-0142  ● In progress                     [Add batch] [⋯ Edit · Cancel · Close]
PT Bara Nusantara Mandiri · Attn. Budi Hartono · PO 4500-2231 · Due 24 Oct 2026
┌ Stepper ───────────────────────────────────────────────────────────────────────┐
│ ●━━━━━━━━━━━●━━━━━━━━━━━━━━━◐───────────○─────────────○─────────○ │
│ Registered  Samples received Analysis   RoA approved CoA published Sent │
└────────────────────────────────────────────────────────────────────────────────┘
[Overview] [Batches 1] [Samples 12] [Files 2] [CoA] [History]
┌ Properties ──────────────────┐ ┌ Batches ──────────────────────────────────────┐
│ Company, address, contacts, PO│ │ B-2026-0417  ASTM  Analysis  12 samples  RoA —│
│ Parameters: TM + Prox + TS + CV│ │ Prep: Dedi K. 21 Oct · Analysis: Fitri H.     │
│ Standard ASTM                 │ └───────────────────────────────────────────────┘
│ Expected samples 12 · type    │ ┌ CoA ───────────────────────────────────────────┐
│ Priority · Created by Rina K. │ │ Not generated yet. Needs 1 of 1 RoA issued.    │
│ Default signatory: Manager    │ │ (later: number, revision, published, Sent via  │
│ Notes                         │ │  WhatsApp to Budi H. on 25 Oct)                │
└───────────────────────────────┘ └───────────────────────────────────────────────┘
```

| Part | Spec |
| --- | --- |
| Header | Breadcrumb, job order no., status badge, company line (company · attention contact · PO · due), actions by role and status (spec S-17) |
| Stepper | The job order's progress in plain words. It is derived from batch and report states (spec 9.3), so it is read-only. Steps: Registered, Samples received, Analysis, RoA approved, CoA published, Sent. **The steps are joined by one continuous line** (Revision 2): solid in the success colour up to the current step, solid in the neutral border colour after it (no dashes), with the step dots sitting on the line |
| Tabs | Overview · **Batches** (count) · **Samples** (count) · Files (count) · CoA · History (order changed in Revision 2) |
| Properties card | All create-form fields, read-only: company, address, contacts (attention first, with phone and email), PO, Standard(s), Preparation by lab, parameters as read-only pills with the template name, expected samples, due date, priority, signatory, notes. **Edit** for the CSO while editing is allowed (until the first batch starts preparation) |
| Batches card | One row per batch: number, **standard**, status badge, samples, RoA status, and **who did what** (prep and analysis performers, spec V-25). A row whose parameters differ from the job order shows "Custom parameters" |
| CoA card | Empty state with the condition ("needs every batch's RoA issued"); when published: number, revision, published by/date, signatory, **Download**, **Mark sent**; when sent: channel icon (hard copy, email, WhatsApp), recipient, date |

Tablet: Properties above Batches and CoA (one column); stepper scrolls sideways if needed. Mobile: header compacts to number + status + client; actions go into a `⋯` menu; stepper becomes a vertical list with the current step expanded; tabs scroll sideways.

## 3 · Job Order · Detail · Samples

The CSO's data-entry tab. The sample IDs typed here are the IDs the Preparation team prints on the labels (spec B-8 step 2).

| Part | Spec |
| --- | --- |
| Toolbar | **Add row**, **Paste from Excel**, **Import list** (S-16, with "Download template"), count "12 samples", search |
| Grid columns | # · Sample ID* · Client description · Depth / lot reference · Remarks · Batch (empty until received) · Received (tick + date) · Status (Registered, Received, On hold) |
| Rules | Editable until the sample's batch starts preparation; after that the row shows a `lock-simple` icon and a tooltip "Received on 21 Oct by Dedi Kurniawan". Duplicate sample IDs in the job order are flagged under the cell (spec V-06) |
| Save | Explicit **Save** with an unsaved-changes dot, as on Input ROA |

Tablet: same grid with frozen # and Sample ID columns and sideways scroll. Mobile: one card per sample (ID, description, status) with **Add sample** opening a small form sheet; paste and import are hidden on mobile.

## 4 · Job Order · Create

Desktop and tablet: a **centered modal**, 720 px wide, with rounded corners and a dimmed list behind it (changed Oct 27 from a right side sheet). The header (title, subtitle, close) and the footer (Cancel, Save as draft, Submit) stay fixed while the body scrolls; the viewport caps the modal at about 90 % of the window height. In the frames the modal is drawn at full length (about 2,000 px) so every field is visible. Mobile: full-screen form in two steps with a progress label.

| Section | Fields |
| --- | --- |
| Company (Revision 2, 3, 7) | Company name* (searchable select, "+ Add as new company") and Client reference / PO on one row, Company address (optional), **Contact person*** (one select field; the company's contacts open in a dropdown or sheet, see Revision 3) |
| Work (Revision 2, 7) | **Standard*** (ASTM · ISO · GB/T toggle chips, multi-select), **Parameters*** ("N selected", quick-select templates, a search field, then rows of pills; **Preparation** is the first pill, on by default; default TM + Prox + TS + CV), Sample type, Expected samples* (placeholder "e.g. 12"), Due date* (suggested from the template turnaround), Priority |
| Report | Default signatory (optional): pick from the dropdown or sheet, add and edit there (spec D-41) |
| Samples | **Removed in Revision 7.** Submit opens the job order on its Samples tab (P2) |
| Notes and files | Notes, Files (drop zone) |
| Actions | **Save as draft**, **Submit** (draft → awaiting samples) |

Mobile step 1: Company + Work. Step 2: Report, Samples, Notes, Files, then Submit. With contacts and pills the create sheet no longer fits without scrolling on desktop; the sheet body scrolls and the footer stays fixed.

## 5 · CoA tab with Mark sent (desktop)

CoA tab of a reported job order: CoA card with number `CoA-JO-2026-0142-1`, revision 1, published by Maya Lestari, signatory **Ir. Bambang Sutrisno, M.T. — Laboratory Manager**, Download and Print. The **Mark sent** dialog is open: Date (today), Channel (Hard copy · Email · WhatsApp · Other, as a segmented control), Recipient (pre-filled with the contact), Note, **Confirm**.

## 6 · Empty state (desktop)

"No job orders yet" with an illustration-free icon (`clipboard-text`), one line of help ("A job order holds a client's request and its sample IDs."), and **New job order**.

## 7 · Job Order · Detail · Batches (Revision 2)

The second tab. It lists the job order's batches and is where **+ Add batch** lives; the header's Add batch button opens the same sheet.

| Part | Spec |
| --- | --- |
| Toolbar | Count "2 batches", **+ Add batch** (lab admin, supervisor), a line "4 of 12 samples not in a batch yet" with a link that opens Add batch with those samples pre-selected |
| Columns | Batch no. · Standard · Samples · Parameters (template name, or "Custom · 9") · Status badge · Prep and analysis performers · RoA status · Deadline · row menu (Open, Edit, Put on hold) |
| Empty state | "No batches yet" with "Batches group the samples that are prepared and analysed together." and **+ Add batch** |
| Tablet | Drops the performers and Deadline columns |
| Mobile | One card per batch (reuses `Card/Batch` with a standard tag); **Add batch** pinned at the bottom |

Demo state: JO-2026-0142 with batch B-2026-0417 (ASTM, 8 samples, Analysis) and four samples waiting.

## 8 · Job Order · Add batch (Revision 2)

Desktop and tablet: a **centered modal**, 720 px wide, over the dimmed Batches tab, the same treatment as New job order (changed Oct 27 from a right side sheet). Mobile: full screen in two steps.

```
Add batch to JO-2026-0142                                        ✕
Batch no. *  [B-2026-0418]      Batch date * [27 Oct 2026]  Deadline [31 Oct 2026]
Standard *   (● ASTM) (○ GB/T)        ← only the job order's standards; read-only text if it has one
Samples *    4 of 4 available selected                [Search]  [Received only ☐]
  ☑ Select all
  ☑ BNM-26-009   Seam C, 42.10–43.05 m   Received
  ☑ BNM-26-010   …                      Received
  ☐ BNM-26-001   in B-2026-0417 (disabled)
Parameters   Starts from the job order: TM + Prox + TS + CV
  [pills as on the create form]          + HGI, − TS compared with the job order
Priority [Normal ▾]   CoC no. [ ]   Notes [ ]
                                           [Cancel]  [Create batch]
```

| Part | Rule |
| --- | --- |
| Batch no. | Suggested next number, editable, unique per company (spec `batches` unique key); a clash is shown under the field |
| Batch date / Deadline | Today; the deadline defaults to the job order's due date and cannot be before the batch date |
| Standard | Required. Toggle chips limited to the job order's standards, with the first one pre-selected. With one standard on the job order it is shown as read-only text. It locks once the batch starts preparation |
| Samples | Checklist of the job order's samples that are not in another batch; samples already in a batch are shown disabled with their batch number. **Select all**, search, and "Received only". At least one sample. The batch's expected sample count equals the number selected |
| Parameters | Pills and templates as on the create form, pre-filled from the job order. Changes apply to this batch only; a diff line names what changed. Dependency rules are the same |
| Footer | **Cancel** and **Create batch**. On success the sheet closes, the toast reads "B-2026-0418 created · 4 samples", and the new row appears in the Batches tab with status Created |
| Validation | Missing standard, no samples or a duplicate batch number are marked on the field with an error summary at the top, as on the create form |
| Mobile | Step 1 **Samples** (checklist, sticky "Next · 4 selected"); step 2 **Details** (number, dates, standard, parameters, priority, notes, sticky **Create batch**) |

## Demo data

| Item | Values |
| --- | --- |
| Clients (invented) | PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, CV Sumber Batu Hitam, PT Mahakam Coal Resources |
| Job order numbers | `JO-2026-0131` to `JO-2026-0142` (numbering is a placeholder until R-10) |
| People | Personas from spec section 8.1 only |
| Parameters | TM + Prox + TS + CV (most), Full analysis (two), Coking coal (one, on a job order with ASTM and GB/T), Preparation only (one), one custom set |
| Contacts | Budi Hartono (attention) and Sari Wulandari on PT Bara Nusantara Mandiri; invented +62 numbers and company-domain emails |
| Statuses | A spread over all seven, one past due, one cancelled, two with CoA sent (one email, one WhatsApp) |

## Components

Reuse: `Top Bar`, `User Chip`, `Avatar`, `Sidebar/Expanded`, `Sidebar/Collapsed`, `Nav Item/*`, `Nav Group Label`, `Card/Panel`, `Table/Header Row`, `Table/Row`, `Badge/Status`, `IconButton/Ghost`, `Input/Search`, `Input/Select`, `Input/Date`, `Segmented Control`, `Card/Batch` (as the pattern for the mobile job order card).

New reusable components (needed again by later screens):

| Component | Used later by |
| --- | --- |
| `Status Chip Filter` (label + count, selected/unselected) | Batches, Reports, My work |
| `Stepper/Horizontal` and `Stepper/Vertical` (done, current, upcoming) | Batch detail, Report review |
| `Tabs/Underline` (with count) | Batch detail, Report review |
| `Side Sheet` (header, scrolling body, sticky footer) | Every create/edit form |
| `Dialog` (title, body, footer actions) | Mark sent, confirmations |
| `Card/Job Order` (mobile) | My work |
| `Performer Line` (avatar + "Prep: Dedi K. · 21 Oct") | Input/Review ROA, Sample history |
| `Channel Icon` (hard copy `printer`, email `envelope-simple`, WhatsApp `whatsapp-logo`, other `dots-three`) | Reports, My work |

## Responsive rules

As the dashboard plans: breakpoints 360–767 mobile, 768–1199 tablet, 1200+ desktop; 44 px touch targets on tablet and mobile; no horizontal page scroll (grids scroll inside their panel); sticky primary action at the bottom on mobile.

## Open points (defaults used in the frames)

| # | Question | Default drawn |
| --- | --- | --- |
| 1 | Job order number format (R-10) | `JO-YYYY-NNNN` |
| 2 | Does the CSO enter sample IDs, or paste the client's list as is | Both: typed or pasted, with a template import |
| 3 | Which fields are required on create | Client, service, method family, expected samples, due date |
| 4 | Is "Close" needed in Core or only "Delivered" | Both shown; Close is a menu action |
| 5 (Rev. 2) · answered | Which contact is printed on the CoA | None. The first contact is the primary contact (RoA attention, default send recipient); the CoA prints company name and address |
| 6 (Rev. 2) · open | Does the lab run CSR/CRI and the Chinese tests (G index, Y value) in-house | Pills shown; CSR/CRI tagged "subcontracted" |
| 7 (Rev. 2) · answered | Parameters per sample or per batch | Per batch only; no sample-level override |
| 8 (Rev. 2) · answered | Sidebar label | Stays **Clients**; job order screens say "Company" |
| 9 (Rev. 2) · answered | Batches before samples are received | Yes; "Received only" filters them out |
| 10 (Oct 27) · answered | Should Add batch also be a centered modal | Yes: both forms are centered modals (720 px); the right side sheet is no longer used on this screen |
| 11 (Oct 28) · applied in the prototype, frames not updated | Do G index and Y value stay GB/T only, now that ISO methods exist, and should pills with no ASTM method be blocked when a batch uses ASTM | **Rule applied in the prototype (version 25):** a coking pill is available when at least one selected standard has a method for it. Gray King, Sapozhnikov and G – Index are disabled under ASTM only ("No ASTM method. Add ISO or GB/T under Standard.") and enabled with ISO or GB/T. Pills not covered by every standard carry a tag with the standards that cover them ("ISO · GB/T"); tooltips list the methods of the selected standards. The Coking coal template turns on only available pills and says what it skipped. In Add batch the batch's single standard applies the same rule. The frames in `screens.pen` still show the old "GB/T only" tag on G index and need updating |

## Prototype and interaction

> **Updated Oct 27, 2026:** the prototype is now planned in `Job_Order_Prototype_Plan.md`. Its flows (section 5) and changed interaction rules (section 6) replace the matching parts below: the contact rows, "Type manually" signatory, "Matches" label, Standard helper line and two-contact remove flow are gone, and the pen.dev flow map is replaced by a Flows panel in the prototype. Rules below that the new plan does not mention still apply.

This section says how the screen behaves and how we show that behaviour before anything is coded.

### Prototype approach

| Layer | What | Where |
| --- | --- | --- |
| 1 · Flow map | The flows below drawn as numbered frames joined by arrows, with a one-line note under each arrow ("click Submit"). It is the reference for developers and reviewers | `screens.pen`, a "Job Orders · Flows" row next to the screen frames |
| 2 · Clickable prototype | A browser prototype built from the approved frames: real navigation between list, detail, tabs, sheet and dialog; working filters, form validation, paste into the samples grid, toasts. Demo data only, no backend | An HTML page published as a private artifact, linked from this plan |
| 3 · Interaction spec | The rules in the tables below: states, validation, keyboard, motion | This document |

Why both: pen.dev frames show what each state looks like, but whether pen.dev can link frames into a clickable prototype is not confirmed yet (the Pencil app was not connected when this plan was written; checked again before building). The HTML prototype lets the CSO and the lab try the flow on a laptop, tablet and phone and react to it. If pen.dev supports frame links, layer 2 is also wired in pen.dev, and the HTML prototype becomes optional.

The prototype is built only after the frames are approved, so it copies settled designs instead of competing with them.

### Flows

| ID | Flow | Actor | Steps (each step is a frame or a state) |
| --- | --- | --- | --- |
| F1 | Create a job order | CSO | List → **New job order** → modal opens → fill Company name (pick or add new), address, Contact person (dropdown), Standard, Parameters (default template pre-set, pills adjusted), Expected samples, Due date (suggested) → **Submit** → validation passes → sheet closes, toast "JO-2026-0143 submitted · Add samples" → detail opens on the **Samples** tab |
| F1a | Save as draft | CSO | Same as F1, but **Save as draft** needs only Client; the list shows the row with a Draft badge |
| F1b | Validation error | CSO | **Submit** with missing fields → fields marked, error summary at the top of the sheet with links to each field, focus moves to the summary |
| F2 | Register sample IDs | CSO | Samples tab → **Paste from Excel** → paste preview (rows found, columns mapped, 1 duplicate flagged) → **Add 12 rows** → grid filled, unsaved dot → **Save** → toast "12 samples saved" |
| F2a | Import a list | CSO | **Import list** → import wizard (S-16) → back to the grid with rows added |
| F2b | Locked rows | CSO | After the Preparation team starts preparation, received rows show a lock; hovering shows who received them and when; editing is refused with that tooltip |
| F3 | Follow progress | CSO, lab staff | List → status chip "In progress" → row → detail Overview → stepper shows the current step → Batches card → batch row opens the batch (outside this screen) |
| F4 | Send the CoA | CSO | List chip "Reported" → row → CoA tab → **Download** (PDF opens in a new tab) → **Mark sent** → dialog: date, channel, recipient → **Confirm** → CoA card shows "Sent via WhatsApp to Budi Hartono · 25 Oct"; job order status becomes Delivered; stepper completes |
| F5 | Edit, cancel, close | CSO | `⋯` → **Edit** (sheet pre-filled; disabled once any batch is in preparation, with the reason) · **Cancel** (dialog with required reason; only before any sample is received) · **Close** (dialog; only when Delivered) |
| F6 | Read-only visit | Preparation team | My work or list → detail → Samples tab shows the expected IDs without edit controls; a hint links to reception (S-18) |
| F7 (mobile) | Create on a phone | CSO | List → sticky **New job order** → step 1 Company + Work → **Next** → step 2 Report, Samples, Notes, Files → **Submit** → detail |
| F8 (Rev. 2) | Remove a contact | CSO | Create or edit sheet with two contacts → hover the second row → trash → dialog "Remove Sari Wulandari from this job order?" → **Remove** → row gone, toast with Undo; with one row left the trash no longer appears |
| F9 (Rev. 2) | Add a batch | Lab admin | Detail of JO-2026-0137 → **Batches** tab (empty) → **+ Add batch** → sheet with the first 8 of 16 registered samples ticked → Standard ASTM (GB/T is the other choice) → HGI turned on, shown as "+ HGI compared with the job order" → **Create batch** → toast, new row "B-2026-0420 · ASTM · Created" |

### Interaction rules by part

| Part | Behaviour |
| --- | --- |
| Status chips | Single select; counts update with the other filters; the selection is kept in the URL (`?status=in_progress`) so a link opens the same view |
| Search | Filters as you type after 300 ms; matches job order no., client, PO; shows "No job orders match 'xyz'" with **Clear filters** |
| Filters panel | Slides in from the right; changes apply on **Apply**; **Save filter** stores it per user; active filters show as removable chips above the table |
| Table row | Whole row is a link (hover tint, pointer); the row menu `⋯` opens without opening the row; past-due rows keep their danger date even on hover |
| Sort | Click a header to sort; second click reverses; default sort is due date ascending for open statuses, newest first for Delivered |
| Pagination | 10 rows; page kept in the URL; changing a filter returns to page 1 |
| Modal (New job order, Add batch) | Fades and scales in from 96 % in 150 ms over a scrim; Esc or the close button closes it; clicking the scrim does not close it while the form has input (it asks "Discard changes?"); focus starts on the first field, is trapped in the modal and returns to **New job order** on close; header and footer stay visible while the body scrolls |
| Company select | Type to search; no match offers "+ Add 'name' as a new company", which keeps the typed name and unlocks the address field; the company is created when the job order is saved |
| Contact person | One select field (Revision 3 and 7); disabled until a company is chosen ("Select a company first"). Opens the dropdown of the company's contacts: check on the selected row, pencil, trash (disabled on the selected row), **+ Add contact** inside the dropdown. Trash opens the remove dialog |
| Parameter pills | Click or Space toggles a pill; on state uses a tinted fill and a blue border with no icon (Revision 7), off state an outline. Auto-added inputs show a short note under the group. A pill that others depend on cannot be turned off; its tooltip names the dependant. Arrow keys move between pills in a group |
| Templates | Ghost (text-only) buttons with no selected state (Revision 7; the "Matches" label was dropped in Revision 3); clicking replaces the selection; the due date suggestion follows the template turnaround (or the longest turnaround among the selected parameters when custom) and stays marked "suggested" until the user changes it |
| Standard | Toggle chips ASTM, ISO, GB/T; at least one stays on (the last chip on cannot be turned off, with a tooltip); with two or more on, the helper line about batches appears |
| Default signatory | Pick from the list, or "Type manually" reveals name and title fields |
| Validation | On blur for each field, on Submit for all; messages under the field in plain words ("Enter the expected number of samples"); Submit is never disabled, so the user always learns what is missing |
| Samples grid | Spreadsheet keys: arrows move, Enter edits and moves down, Tab moves right, Esc cancels the cell; Ctrl/Cmd + V pastes a block; empty pasted rows are ignored; duplicates are marked in the cell with a message; unsaved rows show a dot; **Save** saves all changed rows; leaving the tab with unsaved rows asks to save |
| Paste preview | Shows the first 10 rows, the column mapping (Sample ID, Description, Depth/lot, Remarks), counts of new, duplicate and empty rows; **Add rows** or **Cancel** |
| Stepper | Read-only; each completed step shows its date on hover or below on mobile; the current step is announced to screen readers ("Step 3 of 6, Analysis, current") |
| Tabs | Underline tabs; the tab is kept in the URL hash (`#samples`); counts update after saves |
| CoA card | Four states: not ready (with the condition), draft (lab admin only), published (Download, Print, Mark sent for the CSO), sent (channel icon, recipient, date; **Mark sent** becomes "Add another send" for a second channel) |
| Mark sent dialog | Date defaults to today and cannot be in the future; channel is required; recipient pre-filled from the contact and editable; Confirm closes the dialog and shows a toast with **Undo** for 10 seconds |
| Toasts | Bottom-left on desktop, top on mobile; success 5 s, with action 10 s; never used for errors that need action (those stay inline) |
| Permissions | Actions a role cannot use are hidden, not disabled; actions blocked by state are shown disabled with a tooltip giving the reason ("Editing closes once preparation starts") |

### States every view needs

| State | List | Detail | Samples tab | Sheet |
| --- | --- | --- | --- | --- |
| Loading | Skeleton rows (8) | Skeleton header and cards | Skeleton grid | Spinner on Submit only |
| Empty | First-use empty state (frame 6) | — | "No samples yet" with Add, Paste, Import | — |
| No results | "No job orders match" + Clear filters | — | "No samples match" | — |
| Error | Inline banner with **Retry** | Banner with **Retry** | Row-level error with retry; unsaved rows kept | Error summary at the top; input kept |
| Offline / save failed | — | — | Rows stay marked unsaved; banner "Not saved, retrying"; nothing is lost | Submit shows "Could not submit, try again"; input kept |

### Responsive differences

| Interaction | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Create | Centered modal 720 px | Centered modal 720 px | Full screen, 2 steps, sticky Next/Submit |
| Filters | Inline + side panel | Search + "Filters" sheet | Search + "Filters" bottom sheet |
| Row actions | Hover row menu `⋯` | Always-visible `⋯` | Card tap opens detail; actions in the detail `⋯` |
| Samples entry | Grid with paste and import | Grid with paste and import | Card list + "Add sample" form sheet; paste and import hidden |
| Mark sent | Centred dialog | Centred dialog | Bottom sheet |

### Motion and accessibility

- Durations: sheet and panel 200 ms, dialog 150 ms, toast 150 ms in and out; ease-out on enter, ease-in on exit. No motion when the user prefers reduced motion.
- Focus order follows the visual order; every icon button has a label; the sheet and dialog trap focus and return it to the button that opened them.
- Keyboard: `N` opens New job order on the list (only when no field has focus); `/` focuses search; Esc closes the top sheet or dialog.
- Colour is never the only signal: status badges carry text, past-due dates carry an icon, duplicate cells carry a message.

### Extra frames for the flows

Added to the "Job Orders · Flows" row (desktop unless noted):

| # | Frame | Shows |
| --- | --- | --- |
| P1 | `Create · Validation errors` | F1b: error summary and marked fields |
| P2 | `Create · Submitted toast` | F1: detail on the Samples tab with the toast |
| P3 | `Samples · Paste preview` | F2: preview dialog with mapping and one duplicate |
| P4 | `Samples · Unsaved rows` | F2: grid with unsaved dots and one duplicate message |
| P5 | `Samples · Locked row tooltip` | F2b |
| P6 | `CoA · Sent` | F4 end state: card with channel, recipient, date, and the completed stepper |
| P7 | `Cancel dialog` | F5 with required reason |
| P8 | `Mobile · Create step 2` | F7 second step |
| P9 | `Mobile · Mark sent sheet` | F4 on a phone |

With these, the screen has **23 frames** (14 screen frames + 9 flow frames).

### Prototype done when

- Every flow F1–F7 can be followed end to end in the clickable prototype on desktop, tablet and phone widths.
- Every interaction rule above is either working in the prototype or marked "spec only" in a list at the top of the prototype page.
- The flow map in `screens.pen` matches the prototype's screens one for one.

## Build status (Oct 21, 2026)

Built in `screens.pen`, in new rows at the bottom of the "v1 Screens" region. The clickable prototype (layer 2) and the arrow flow map (layer 1) are **not** built yet; they follow approval of these frames.

| Row | Frames |
| --- | --- |
| Job Order Components | `Chip/Status`, `Chip/Status · Off`, `Tab/Underline`, `Tab/Underline · Off`, `Step/Done`, `Step/Current`, `Step/Upcoming`, `Performer Line`, `Side Sheet`, `Dialog`, `Table/Header Row · Job order`, `Table/Row · Job order`, the two `· Compact` versions for tablet, `Card/Job Order` |
| Job Orders · Desktop Row | List · Desktop, Tablet, Mobile |
| Job Order · Detail Row | Overview · Desktop, Tablet, Mobile; Samples · Desktop, Tablet, Mobile |
| Job Order · Create Row | Create · Desktop (sheet over the list), Tablet (sheet), Mobile step 1, Mobile step 2 |
| Job Order · Flows Row A | P2 submitted with toast (empty Samples tab), P4 unsaved rows with a duplicate, P5 locked-row tooltip, P3 paste preview |
| Job Order · Flows Row B | Mark sent dialog (CoA tab), CoA sent end state (P6), P1 validation errors, P7 cancel dialog |
| Job Order · States Row | List · Empty, P8 mobile create step 2, P9 mobile mark sent sheet |

Frame count: 14 screen frames and 9 flow frames, plus one extra copy (Create · Mobile · Step 2 exists both as a screen frame and as P8).

**Sidebar:** `Sidebar/Expanded` and `Sidebar/Collapsed` were rebuilt in place with the new navigation (My work, Dashboard, WORK, MASTER DATA, ADMIN groups); both dashboard v2 frames render correctly with it. Companies is now **Clients**. Icons differ slightly from the table above because the existing icons were kept where they were already used: Batches `package`, Input ROA `flask`, Review ROA `check-square-offset`, Job orders `clipboard-text`.

**Differences from the plan:**

| Plan | Built |
| --- | --- |
| Samples tab shown on JO-2026-0142 | The editable Samples frames use **JO-2026-0134** (awaiting samples, 6 expected), so the grid is genuinely editable; the locked variant (P5) uses JO-2026-0142 |
| Tablet table keeps Client with its contact line | Tablet uses compact rows: No., Client with `samples · service` underneath, Due, Status, CoA; Service, Samples and Batches columns are dropped |
| Mobile card progress | Bar shows samples received; the meta line shows batches; footer shows RoA and CoA |
| Channel icon component | Not made a component; the icons (`whatsapp-logo`, `envelope-simple`, `printer`) are used inline |
| Create form as a long sheet | Short fields are paired in two columns so the whole form fits without scrolling; the frames are 1180 px (desktop) and 1290 px (tablet) tall |
| Mark sent channel labels | Desktop: WhatsApp, Email, Hard copy, Other. Mobile sheet: WhatsApp, Email, **Print**, Other, to fit the width |
| Role in toast | The "submitted" toast reads "JO-2026-0143 submitted · add the sample IDs next" |

Notes for later screens:

- A **component slot only accepts inserts while it is empty**. `Dialog` and `Side Sheet` are empty slots, so each instance gets its own content. Do not add a default child to a slot.
- Top-level region rows use automatic layout, so new rows are appended below rather than placed by coordinates.

## Revision 2 · Build status (Oct 27, 2026)

Built in `screens.pen`. The new frames were appended to the existing job order rows (Detail row, Flows row B); a "Revision 2 components" group was added to the Job Order Components row.

| Change | Frames | Status |
| --- | --- | --- |
| Rebuilt | Create · Desktop, Tablet, Mobile step 1; P1 validation errors | Done |
| Unchanged apart from wording | Create · Mobile step 2 and P8 (no company or parameter fields on that step) | Done |
| Updated | Overview · Desktop, Tablet, Mobile (continuous stepper line, tab order, Properties card with address, contacts, standard, preparation and parameter pills, standard tag on the batch row); every detail and flow frame (tab order, stepper line); list, detail and flow frames ("Company", "All companies", "Standard", "Parameters", template renamed to TM + Prox + TS + CV) | Done |
| New | Detail · Batches · Desktop, Tablet, Mobile (JO-2026-0142); Detail · Batches · Empty · Desktop, Tablet (JO-2026-0137); Add batch · Desktop, Tablet, Mobile step 1, Mobile step 2; P10 remove contact dialog; P11 coking coal with ASTM + GB/T | Done |
| New components | `Pill/Parameter · Off`, `· On`, `· Auto-added`, `· Locked`; `Pill/Group · Off`, `· On` (with the `▸` caret); `Toggle Chip · On`, `· Off`; `Switch · On`, `· Off`; `Contact Row` | Done |
| Sidebar | Unchanged: it keeps "Clients" | Done |

Frame count after Revision 2: 21 screen frames (14 + Batches 3 + Add batch 4) and 11 flow frames (9 + P10 + P11), plus two Batches empty-state frames, 34 in all.

**Differences from the Revision 2 plan:**

| Plan | Built |
| --- | --- |
| Create sheet fits the viewport and the body scrolls | The sheets are drawn at full length (about 2,100 px) so every field is visible; in the app the body scrolls and the footer stays fixed |
| Contacts first row shows the primary contact label | Desktop and tablet show a hint "First contact is the primary contact" above the rows; mobile cards carry a "Primary" tag on contact 1 |
| Trash hidden when one row remains | Desktop and tablet show two rows: the second row is drawn in its hover state with the trash; on touch both rows show it. A one-contact state is not drawn |
| Parameter pills on mobile as an accordion | Create step 1 uses the accordion (groups with selected pills open, the others collapsed with "None"). Add batch step 2 uses stacked pill groups instead, to keep the whole form visible |
| Add batch demo on JO-2026-0142 | The Add batch frames use **JO-2026-0137** (Kaltara Energi Prima, awaiting samples, 16 registered samples, ASTM + GB/T, Coking coal template), because JO-2026-0142 has all its samples in a batch. JO-2026-0142 is used for the populated Batches tab. The list row for 0137 now reads "Coking coal" |
| Batches tab rows show performers | Desktop shows prep and analysis performers; tablet moves the parameters under the batch number and drops performers; mobile reuses `Card/Batch` |
| Pill group component | Pill rows are built per frame (pills wrap manually, because pen.dev has no wrapping layout); only the pills, toggle chips, switch and contact row are components |
| Demo data | Second contact is Sari Wulandari; the first contact's email is shortened to `budi@bara.id` so it fits the row (a wider email column would be needed in the app) |

Pill count on the form: **36 pills in 9 groups** (see "How many pills" above).

**Changes of Oct 27, 2026 (second pass), built:**

| Change | Where |
| --- | --- |
| Section headers set in JetBrains Mono (`$font-mono`, 11, weight 500, +1.5, uppercase, `text-muted`) | 33 headers across the create modals, the mobile create steps, P8 and the other frames that carried COMPANY, WORK, REPORT, SAMPLES or NOTES AND FILES |
| Section header documented in the design system | Foundations frame, Typography scale: new "Section header" row next to "Overline", with spec and usage; "Overline" row gets a usage line |
| Unfinished stepper line is solid, in the neutral border colour | All 15 steppers (desktop, tablet, mobile, flow frames); the dashes are gone |
| New job order is a centered modal, 720 px wide | Create · Desktop, Create · Tablet, P1, P10, P11. The body was rebuilt at the wider width: Company name and Client reference / PO share a row, the contact email column is wider (full address `budi.hartono@baranusantara.co.id` now fits), and the quick-select buttons sit on one row. Mobile is unchanged |

The modal is drawn with the existing `Side Sheet` instance, restyled (centered, radius 16, named "Modal"). A dedicated `Modal` component is worth making now that two forms use it.

**Add batch as a modal (Oct 27, third pass):** the Add batch frames for desktop and tablet were recreated as 720 px centered modals over the empty Batches tab of JO-2026-0137 (batch number, date and deadline share a row; priority and CoC no. share a row). The two **mobile Add batch frames (step 1 and step 2) were not found in the file** when this change was made, so they are not part of the file now; they would be unchanged full-screen steps and can be recreated on request.

Known limits of the frames:

- Quick-select templates are static: the active template is highlighted, but the "Matches" label and counts are not live.
- The "Pill/Parameter · Locked" and "· Auto-added" variants exist as components but are not shown in a frame yet.
- Hover and focus states are drawn only for the contact row.

## Done when

- Revision 2: all frames are built or updated (see its build status), open points 5, 7, 8 and 9 are answered, open point 6 keeps its default, and the spec changes are listed for the spec update.
- All 23 frames are built (14 screen, 9 flow), use only design-system components and tokens, and Phosphor icons.
- The sidebar components are updated in place and the dashboard v2 frames still render correctly.
- Every field in spec S-17 appears on the create form or the Properties card.
- Checks pass on every frame: no clipping, 44 px touch targets on tablet and mobile, no horizontal page scroll, text contrast AA.

## Revision 3 · Build status (Oct 27, 2026)

| Change | Where |
| --- | --- |
| Three hints removed ("First contact is the primary contact", "Each batch uses one of these standards…", "Matches: …") | Create · Desktop, Create · Tablet, P1, P10, P11, Create · Mobile · Step 1 (the Primary tag went with the contact cards). Modal, scrim and frame heights were refitted |
| Contact is one full-width field "Contact person *" (name, phone, email; mobile shows name and phone) | The same frames; the contact rows, "Contacts" label and "+ Add contact" button are gone |
| New: dropdown, list state (check on the selected row, pencil, trash, + Add contact) | Contact dropdown · Desktop, · Tablet; mobile as a bottom sheet (Contact sheet) |
| New: dropdown, edit state (other rows and + Add contact dimmed, inputs on the edited row, **save icon** instead of check) | Contact dropdown · Desktop · Edit, · Tablet · Edit; Contact sheet · Edit (mobile) |
| P1 validation: contact field in error ("Choose a contact for this job order"), summary now says 3 fields | Flow P1 |
| P10 is now "Remove contact" from the dropdown: list open behind the dialog, title "Remove Sari Wulandari from contacts?", text "Submitted job orders keep this contact's name on their documents." | Flow P10 |
| Detail Contact property shows one contact; "Mark sent" hint reads "Pre-filled from the job order contact" | Detail overview frames, Mark sent dialog |

New frames sit at the right end of the Job Order · Create Row. `contact-dropdown` and `contact-dropdown_add-contact` (your samples) are untouched. Not done: the `Contact Row` component still has its old shape, and the dropdown rows are drawn per frame (not a component yet); the Standard field no longer says that each batch picks one standard, so Add batch is where that rule shows.

## Revision 3b · Signatory dropdown, Ash analysis checklist, dark mode (Oct 27, 2026) · BUILT

| Change | Where |
| --- | --- |
| **Default signatory** works like Contact person: a select field showing the chosen signatory (name and title), and a dropdown of the company's signatories (name, title, check on the selected row, pencil, trash, **+ Add signatory**). The edit state dims the other rows, turns the edited row into Name and Title inputs and swaps check for the save icon. The button "Type name and title manually" is removed everywhere | All Create frames and flow frames (field and button); new frames Signatory dropdown · Desktop, · Desktop · Edit, · Tablet, · Tablet · Edit; mobile Signatory sheet, · Edit |
| **Ash analysis ▸** opens a checklist popover under the pill (560 px, anchored right): title, "9 of 29 selected", search, OXIDES · 14 and RATIOS AND INDICES · 15 as three-column checkboxes, Select all / Clear, Cancel, **Apply · 9 parameters**. Apply turns the pill on and counts it as one parameter. Mobile would use a bottom sheet (not drawn) | New frame Create · Ash analysis open · Desktop. The same pattern applies to Trace elements ▸ (36 elements) |
| **Dark mode** added to the design tokens: every colour variable now has a light value (unchanged) and a dark value under theme `mode`. The blue is darker (primary `#122B52`, primary-deep `#081B38`, tints `#0F1E36` to `#6E8EC0`); the **accent is the yellow** (`#F5B700`, soft `#FFD24D`, text `#FFD24D`, foreground `#0A1A33`); surfaces are blue-black (background `#0A1424`, card `#101F36`) | Variables in `screens.pen`; preview frame "Create · Dark mode preview · Desktop" (a copy of Create · Desktop with theme dark) |

Not done: the mobile Ash analysis sheet. The dark preview showed that active elements (primary button, switch, active tab, chips, selected pill, nav item) and the logo do not stand out in dark mode. The fix is planned in `../Project/Coal_LIMS_Research_and_Project_Plan.md`, section "Dark mode": role tokens (`action`, `action-foreground`, `brand-text`, `nav-active`) with the yellow accent for active states, and a reversed logo. Built Oct 27, 2026, then revised the same day to a lighter blue accent (`#8DB4F0`) and an all-white dark logo (see that section's "Build result of Revision 2"). Dark frames: Create · Dark mode preview · Desktop and Detail · Overview · Desktop · Dark. The Properties card label "Contacts" now reads "Contact" (one contact per job order). Known issue: the sidebar on job order screens is missing the **Job orders** item, so no nav item is highlighted; to fix next.

**Table header rows (Oct 27):** every table and grid header row now has a `primary-50` background (radius 8), matching the Samples grid: the four `Table/Header Row` components (base, Drill hole, Job order, Job order · Compact) and the hand-built headers in Samples · Tablet, Batches · Desktop and Tablet, and flows P4, P5, P7. Instances follow the components, so list, detail, flow and dashboard tables all changed.

## Revision 4 note · Sample states (Oct 28, 2026)

The Samples tab status column now has four states: Registered, Received, **Awaiting arrival** (returned from a started batch, with the batch it left) and **Not received** (marked by the CSO, with the reason). Rules, frames and prototype are in section 14 of `../archive/Reception_Preparation_Screen_Plan.md`.

## Revision 5 note · Five sample states and the new design source (Oct 29, 2026)

The Samples tab now has **five** states: **Expected** (was Registered; on the job order, not in a batch), **In batch** (reception not confirmed yet, shows the batch number), **Received** (arrival confirmed, locked), **Awaiting arrival** and **Not received**. The header counts only the states that occur, for example "8 samples · 2 expected · 4 in batch · 2 received". The Batches tab shows Completed batches with the RoA number and a PDF link. Rules, frames and prototype are in section 15 of `../archive/Reception_Preparation_Screen_Plan.md`.

**Design source:** from Oct 29, 2026 the frames live in FigCraft (`.context/design/figcraft/SGSI-LIMS-screens.figcraft`), not in `screens.pen`; the pen.dev plan limit was reached. In the FigCraft file the job order frames carry the rename "Registered" to "Expected" as a text change only. The per-row badges and header counts for In batch and Received are still to be redrawn (see 15.13 in the archived Reception plan, open item 1).

### 6.5c Build status (Nov 2, 2026): sidebar fix and library patches for row B

- **Sidebar active icon:** the Icon variant swapped into the active Nav item brought its own dark glyph colour. The active icon is now bound to `Text/text-inverse` (same as the label) on the three built frames, and `screens/shell.js` does it for every new frame.
- **Library patches made live in the file** (with `component.addVariant`, not by regenerating the library): Dialog **Size=xl** (720 wide); Parameter pill **On** = tinted fill (`primary-50`), `action` border, check icon, `primary-deep` text; new Parameter pill **Unavailable** state and a boolean **Show coverage** property (text "ISO · GB/T", hidden by default); Option row **Dimmed** (50 % opacity) and **Editing** (Name field, Phone and Email fields, discard and save icon buttons). Still to come with the frames: Table row templates Job order batch and Sample Unsaved (rows C and D).
- Live edits are driven through the app's control port with `scratchpad/fcall.js` (a stdio bridge to `figcraft-cli mcp --attach 7979`) when the MCP tools are not attached to the session.

### 6.5d Build status (Nov 2, 2026): row B built (17 frames), then updated by Revision 7

Frames sit on the page of their size (generator `library/screens/rowB.js`; a rebuild deletes row B first, so it can be rerun):
- **Desktop** (row B from y 1910): **Create · Desktop**, **P1 Validation errors** (company, contact person and expected samples in error, "e.g. 12" hint), **P11 Coking coal, ASTM + GB/T** (coverage tags on the pills that not every chosen standard covers), **Contact dropdown · List / Edit**, **Remove contact**, **Create · Ash analysis open** (checklist popover, 9 of 29), **Signatory dropdown · List / Edit**.
- **Tablet:** **Create · Tablet** (modal 720).
- **Mobile Phone:** **Create · Step 1 · Phone**, **Step 2 · Phone**, **Contact sheet · List / Edit**, **Signatory sheet · List / Edit**, **Ash analysis sheet**.
- Library: the Dialog xl footer has Cancel · Save as draft · Submit; Parameter pill has On without icon, Unavailable, and a Show coverage option; Option row has Dimmed and Editing. The icon set has no left arrow, so the phone back button uses a left caret.
- Not yet: the dark preview frame (row C) and a touch-target check on tablet and phone.

### 6.5e Build status (Nov 2, 2026): row C built (stage 1 and 2)

Frames on the page of their size (generator `library/screens/rowC.js`, rerunnable; it deletes its own frames first).
- **Desktop:** Overview, Overview · Dark preview (the Overview frame set to the Dark mode of the variables), Batches, Batches · Empty, Batches · Samples awaiting arrival, Samples, Samples · Mixed states, Samples · Mark as not received (dialog), P2 Submitted toast, P3 Paste preview, P4 Unsaved rows, P5 Locked row tooltip.
- **Tablet:** Overview, Batches, Batches · Empty, Samples, Samples · Mixed states, Samples · Mark as not received.
- **Mobile Phone:** Overview, Batches, Samples, Samples · Mixed states, Samples · Mark as not received (bottom sheet).
- **Deviation:** the mixed-states frames use **JO-2026-0139** (PT Mahakam Coal Resources, 8 samples: 4 received, 2 in batch B-2026-0421, 1 awaiting arrival, 1 not received), not JO-2026-0137, because 0137 has no batch in the list and in the Batches · Empty frame.
- **Library additions:** table sets "Table header row batches" and "Table row batches" (desktop and compact), "Card batch compact" (phone), "Table row sample states" (state line and action link under the badge, locked variant). The job order stepper is drawn as one continuous line behind six Stepper step instances (green up to the current step).
- **Not yet in row C:** the unsaved state is shown with an accent dot in the index cell and the duplicate message under the row's status cell (P4); a separate "Unsaved" library variant is still to do if wanted.

**Card padding rule (Nov 2, 2026, from the product owner's edit of the "Batches card"):** a card carries its own padding (16 top and bottom, 20 left and right) and a gap of 16 between its parts. The children (card head, tables, notes, lists, key-value rows) have no padding of their own on the card's sides; table headers and rows inside a card drop their side padding (cells keep their 8 px so text is not glued to the header fill). This replaces the earlier build where each child padded itself, which let text such as the Samples hint touch the card edge. Applied to every card in row C (Properties, Batches, Samples, Batches tab, empty and P2 to P5 frames).

### 6.5f Feedback of Nov 3, 2026 on the Samples tab (applied in row C)

From the owner's reference frames "Samples · P5 Locked row tooltip · Desktop edit" and "… edit dark" (kept on the Desktop page):
- **Card titles carry no count subtitle** ("8 samples · 4 received · …", "2 batches · 12 samples", "12 expected", "3 unsaved changes"). The counts already show in the tabs, badges and tables. Applies to every screen: the subtitle under the job order list title (row A) is removed too. The modal subtitle in Create is a sentence, not a count, and stays.
- The samples card is titled **Registered Samples**.
- **Sample table** (library sets "Table header row samples" and "Table row samples", replacing "Table row sample states"): header and rows share fixed columns (# 40, Sample ID 130, Client description fills, Depth / lot reference 230, Remarks 130, Batch 130, Status 130, **Action 64**), so they line up.
- **Action column**: one ghost icon button per row (library "Icon button", Ghost 32; Ghost 44 on phone). Received and in-batch rows show a **disabled lock**; an awaiting-arrival row shows **Mark as not received** (file-x); a not-received row shows **Restore** (arrow-counter-clockwise); editable expected rows have no action. The links and the state sub-line ("from B-2026-0421", "Lost in transit") are gone. P5's tooltip now points at the lock.
- All rows use the same colours (secondary text on white); the state is shown by the badge and the action, not by a row tint. The batch number uses `Primary/primary` (light `#1B3A6F`, dark `#3D69B0`); "—" for no batch is muted.
- **Tabs** follow the updated library Tab: 16 px between tabs, the count pill only on tabs with a count (Batches, Samples, Files).

## Revision 8 · Second feedback of Nov 3, 2026 · BUILT (Nov 3, 2026)

Source: the owner's feedback of Nov 3 and three reference frames on the Desktop page: **Select reference** (contact person field), **Properties ref** (Overview properties card) and **Batches · Desktop reference** (job order header and batch table). The reference frames stay in the file.

### 8.1 Rule: no values joined with " · "

UI text never joins values with a middle dot, as in "Budi Hartono · +62 812 5550 1844 · budi@baranusa.co.id". Each value is its own text layer, in one of four patterns:

| Pattern | Where | Build |
| --- | --- | --- |
| **Inline values** | Select field value, key-value values, table cells with two facts | Text layers side by side in a horizontal row. First value `Text/text` (or the cell's main colour), the others `Text/text-secondary`. Gap 8 inside an input (Select reference), gap 12 in a key-value value (Properties ref) |
| **Icon meta row** | Job order header under the title | Horizontal row, gap 16; each item is a 14 px icon + text, gap 4, `Text/text-secondary`, Body small/Regular. Wraps on phone |
| **Two lines** | Table cells (batch number and date, person and date) | Main line Body small/Medium, second line Caption/Regular `Text/text-secondary` |
| **Plain sentence** | Toasts, hints, status words | Rewrite as a sentence or with a comma: "PDF, XLS or CSV, up to 10 MB", "Sent by WhatsApp", "JO-2026-0143 submitted. Add the sample IDs next." |

Frame and layer names (for example "Samples · Desktop") are names, not UI text, and keep the dot.

### 8.2 Contact person field (Select reference)

The Select field gets a **Contact** value layout: a horizontal frame "Contact" (gap 8, fill) holding three Body/Regular texts: name (`Text/text`), phone and email (`Text/text-secondary`), then the caret. The phone version shows name and phone only. The contact dropdown's Option row second line follows the same rule: phone and email as two text layers, gap 8.

### 8.3 Job order header (all row C frames)

From Batches · Desktop reference: under the title row,
1. **Company** on its own line, Body/Medium, `Text/text-secondary`.
2. **Icon meta row**: `user` + contact name, `receipt` + client reference (PO), `calendar-blank` + due date. The `user` and `receipt` glyphs (14) were added to the Icon set by the owner.
3. Past due (JO-2026-0139): the due item's icon and text use the error colour and a separate "Past due" text follows it; "(past due)" in brackets goes.

Applies to every job order detail frame on all three pages (header height grows from 68 to 96 on desktop).

### 8.4 Overview · Properties card (Properties ref)

- **Remove** the Preparation row ("By the lab (Preparation team)"); preparation shows as the first pill of the parameters.
- **Contact**: name `Text/text`, phone and email `Text/text-secondary`, gap 12 (phone: name and phone).
- **Parameters**, two rows:
  - Row 1, in the value column: service name (the quick select used, "TM + Prox + TS + CV") · then **"customized"** in `Text/text-muted` only when parameters were added to or removed from that quick select (nothing otherwise) · then the **total** ("8 parameters", `Text/text-secondary`) pushed to the right end.
  - Row 2: every parameter pill (Preparation first), starting at the value column: left inset 122 = key width 110 + gap 12. On phone (stacked rows) the pills start at the left edge.
- **Expected samples**: "12" then "Exploration cores" (`Text/text-secondary`), gap 12.
- **Default signatory**: name then title ("Laboratory Manager", secondary), gap 12. **Created by**: name then date, gap 12.
- The Overview's **Batches** list (right column) drops "12 samples · RoA RoA-0417" and "Prep: Dedi K. · 21 Oct": samples and RoA become two separate texts, and Preparation and Analysis each become an avatar + two lines (full name, date) under a muted caption "Preparation" / "Analysis".

### 8.5 Batches tab (Batches · Desktop reference)

- **Columns** (header and rows share them): Batch no. 130 (number + date, two lines) · Standard 84 (tag) · Samples 76 · Parameters fills (service + note on two lines) · Status 124 · **Preparation** fills · **Analysis** fills · RoA 88 · Deadline 84 · chevron 36. Preparation and Analysis were one "Progress" cell; each is now its own column: 24 px avatar + two lines (full name Body small/Medium, date Caption `Text/text-secondary`). A batch not started shows "—" in `Text/text-muted`.
- The card head is the title "Batches" and the **Add batch** secondary button, no subtitle.
- Tablet (Compact template): keeps Batch no., Standard, Samples, Status, Deadline, chevron; no dot texts. Phone ("Card batch compact"): samples, standard and due as separate texts.

### 8.6 Create job order (row B)

- Remove the subtitle "128 job orders · 21 in progress, 9 waiting for samples" under the "Job orders" heading behind the overlay (9 desktop frames and the tablet frame).
- Contact person field and dropdown per 8.2.
- Coverage tag on Parameter pills ("ISO · GB/T"): two text layers, gap 4 ("ISO", "GB/T").
- Phone step progress: "Step 1 of 2" (caption) and "Company and work" (title) as two texts.
- Drop zone hint: "PDF, XLS or CSV, up to 10 MB". Ash analysis label: "Ash analysis" and "9 of 29" as two texts.

### 8.7 Every screen that changes

| Row | Frames | Changes |
| --- | --- | --- |
| Library | Select (Contact layout), Option row, Parameter pill (coverage), Table row (Attn and PO), Table row compact, Table row samples (depth: drill hole and interval as two texts), Table header row batches + Table row batches (Preparation and Analysis columns, Desktop template), Card batch compact, Card job order (service + standard tag), Mobile step progress, Drop zone, Toast text, Page header, Grid cell ("% adb"), Card KPI, Card panel, Queue card, WIP row, Card batch, Card CoA ("Revision 1" as its own text), Deadline item, Label preview, Chart card | 8.1 patterns; library documentation labels on the Foundations and section frames use commas or separate columns |
| A · List | List · Desktop, List · Tablet, List · Phone | Contact and PO as two texts; "Sent by WhatsApp", "Sent by email"; tablet line "12 samples" and the service as two texts; phone card service + standard tag |
| B · Create | Create · Desktop, P1, P11, Contact dropdown List and Edit, Remove contact, Ash analysis open, Signatory dropdown List and Edit, Create · Tablet; phone Step 1, Step 2, Contact sheet List and Edit, Signatory sheet List and Edit, Ash analysis sheet (17) | 8.6 |
| C · Detail | All 23 frames (12 desktop, 6 tablet, 5 phone) | Header 8.3 on every frame; Overview D/T/P + Dark preview: 8.4; Batches D, Batches · Empty D/T, Batches · Samples awaiting arrival, Batches T/P: 8.5; every Samples frame: depth column as two texts; P2 toast as a sentence |
| Canvas | Row titles "A · Job orders list", "B · Create job order", "C · Job order detail" | "A  Job orders list" style: letter and name as separate texts |

Reference frames kept: Select reference, Properties ref, Batches · Desktop reference, and the owner's **dark copy of Samples · P5** (it has the same name as the generated P5, so it is renamed "Samples · P5 Locked row tooltip · Desktop dark reference" before the rebuild and the generator skips frames whose name ends in "reference").

### 8.8 Build order (after go)

1. Library patches (8.1 to 8.5 components) on the open file, generators `rowC.js` `patchC` and a new `patchR8`.
2. Rebuild rows A, B and C with the generators (backup first, then swap the file).
3. Render and check one frame per size for each row, then update the prototype (Prototype plan section 14).

### 8.9 Build status (Nov 3, 2026)

Built in the FigCraft file (backup before: backup/SGSI-LIMS-screens.before-rev8.figcraft). No text in the file joins values with a middle dot any more (checked by a scan of every text layer).
- **Library:** 76 component texts were split into separate layers by `library/rev8.js` (stage L). A text in a horizontal row gets extra texts after it; a text in a two-line cell gets a **Split** frame (horizontal, gap 6) and the original is kept hidden as "... source". **Select** (Value, Value 2, Value 3, gap 8) and **Key-value row** (gap 12) carry three value layers; the unused ones are hidden. The table sets "Table header row batches" and "Table row batches" were rebuilt with separate **Preparation** and **Analysis** columns (`library/rev8lb.js`). Documentation labels use commas.
- **Deviations from 8.1:** the Parameter pill coverage tag stays one layer, written "ISO, GB/T" (its visibility is bound to the Show coverage property, which cannot drive extra layers); the Drop zone hint is "PDF, XLS or CSV, up to 10 MB"; the row titles read "A  Job orders list" (two spaces); the overline "WORK  TUESDAY 21 OCTOBER 2026" is two texts.
- **Rows B and C rebuilt** (40 frames), row A patched in place (stage D, `rev8.js`): the job order header, Overview properties, Overview batch list, Batches tab, Create contact field and dropdown, and the list rows follow 8.2 to 8.6. The "128 job orders ..." subtitle is gone behind the Create overlay.
- **Reference frames kept:** Select reference, Properties ref, Batches · Desktop reference, and the dark P5 copy, renamed "Samples · P5 Locked row tooltip · Desktop dark reference". The generators skip frames whose name ends in "reference".
- **Notes:** the Key-value instances inside the frame "Properties ref" picked up the new split layers, so its contact and expected samples now show as separate texts. Touch-target checks on tablet and phone are still open.

## Revision 9 · Parameter selection like the prototype · BUILT (Nov 3, 2026)

**Why the frames differ from the prototype (found Nov 3, 2026).** No note asks for a different selection; it is drift.
- The plan ("How many pills") has **9 groups including Coking coal**. The row B build (`rowB.js`, list GROUPS) only drew the first 8, so the Coking coal group is missing from Create · Desktop, Tablet, Phone and the frames built on them.
- P11 used a separate, shorter list (Moisture, Proximate, Sulfur, Calorific, plus five coking pills named CSN, Gray-King, Y value, G index, Roga), written before the research of Oct 28. The prototype and the plan's own standards table use the **eight tests on the lab's list**: CSN, Gieseler Plastometer, Gray King Coke Type, Dilatometer Test, Sapozhnikov Test, G Index, CRI/CSR, Maceral Analysis. The plan's pill list (Dilatation, Ro, Macerals, Roga, Y value, Gray-King, CSR/CRI) is out of date and is corrected here.
- The coverage tag exists only as one hidden text in the Parameter pill ("ISO, GB/T" since Revision 8) and shows on four pills in P11 only. The **SUB** (subcontracted) tag and the unavailable pills under ASTM are not drawn at all.

**Plan.**
1. **New library component "Coverage tag"**: small mono tag (Accent/accent-100 fill, Accent/accent-text text, radius 4, 10 px, padding 0/4). Variants: Standards (the standards that have a method, as separate layers: "ISO", "GB/T") and Subcontracted ("SUB"). Parameter pill gets a Tag slot with an instance of it instead of the single text.
2. **Parameter pill** states stay Off, On, Locked, Unavailable (grey, no icon, tag visible). Pills have no icon when Off or On (Revision 7); long names wrap the row like the prototype.
3. **Create frames at three sizes** show all 9 groups and the eight coking tests with their full names. Default (ASTM): Gray King, Sapozhnikov and G Index unavailable with tag ISO + GB/T; CRI/CSR with SUB. P11 (ASTM + GB/T): the same pills available, tags still shown for the pills not covered by every standard. Phone keeps the accordion; the Coking coal group is one more accordion item.
4. **Frames rebuilt:** Create D, T, P Step 1; P1; P11; Contact and Signatory dropdown and sheet frames; Remove contact; Ash analysis open (17 frames, taller because of the Coking group). Docs: the pill list table above is corrected to the eight tests.
5. The prototype already has this behaviour; no prototype change.

### 9.1 Build status (Nov 3, 2026)

- **Library:** new component set **Coverage tag** (Kind: ISO and GB/T, ISO, GB/T, Subcontracted; amber soft fill, 10 px mono, the standards as separate layers 3 px apart). **Parameter pill** (Off, On, Unavailable) now holds a Tag instance with the properties **Show tag** (boolean) and **Tag** (instance swap); the old Coverage text and the "Show coverage" property are gone.
- **Create frames** (17, desktop, tablet, phone) show all 9 groups. Default (ASTM only): Gray King Coke Type, Sapozhnikov Test and G – Index are Unavailable with the ISO and GB/T tag; CRI/CSR carries SUB. P11 (ASTM + GB/T): those three are available, G – Index is on, the tags stay; "15 selected". Frame height 2000 (P1 +150, P11 +160), signatory dropdown anchor moved to y 1458.
- Clean-up pass fixed one bug of Revision 8: untouched default text in hidden "source" layers was being copied over real values (the three contacts in the dropdown all showed Budi's phone and email). The contact and signatory dropdowns are correct now.
- The prototype already behaves this way; no prototype change.

## Revision 10 · Owner edits carried to every size, rows D and E · BUILT (Nov 3, 2026)

### 10.1 Owner edits applied to all sizes

Found by comparing the file with the Revision 8 build (the owner edited desktop frames only):
- **Job order header** (every detail frame, D, T, P): company name `Text/foreground` (was secondary); the contact, PO and due date items and their icons `Text/text-muted` (were secondary); "Past due" in Body small/SemiBold, still in the error colour.
- **Overview batch list** (Overview D, T, P and the dark preview): name and date on one line (Label frame horizontal, gap 8, name fills); an analysis in progress shows "Started" in `Text/text-muted` and the date in secondary as two texts.
- The stepper's green line no longer runs past the last step when every step is done.

### 10.2 Rows D and E

Canvas order on every page: A list, B create, C detail, D add batch, E CoA and actions (row titles "D  Add batch", "E  CoA and actions"). Generators `library/screens/rowD.js` and `rowE.js`, run with row C (`build-screens.js C,D,E`); they place themselves below the lowest frame of each page.

| Frame | Size | Content |
| --- | --- | --- |
| Add batch · Desktop, · Tablet | D, T | Dialog xl over Batches · Empty of JO-2026-0137 (16 samples, ASTM and GB/T). Job order number and company as two texts; Batch no. B-2026-0422 with the pattern hint; Batch date read-only; Deadline; Standard chips ASTM (on) and GB/T with "One standard per batch. This job order has ASTM and GB/T."; Samples "8 of 16 selected", Select all (16) and Clear, checkbox grid; parameter pills with HGI added ("+ HGI compared with the job order"); Priority, CoC no., Notes; Cancel and Create batch |
| Add batch · Late samples · Desktop | D | Over Batches · Samples awaiting arrival (JO-2026-0139, ASTM only): note "Settings copied from B-2026-0421: ASTM, TM + Prox + TS + CV and Standard priority."; BNM-3507 ticked first with "Awaiting arrival" and "from B-2026-0421" as separate texts; "Awaiting arrival comes first and is ticked for you." |
| Add batch · Step 1, Step 2 · Phone | P | Step 1 Samples (full-width checkbox list, sticky "Next (8 selected)"); Step 2 Details (fields stacked, sticky Back and Create batch) |
| CoA · Mark sent · Desktop | D | CoA tab of JO-2026-0141 (Reported, stepper on Sent to client): CoA card with Download PDF, Print, Mark sent; facts Number, Revision, Published (date and name), Signatory (name and title), Covers; Built from B-2026-0416 with RoA-0416 and the approver. Dialog md "Mark CoA as sent": Date sent, Recipient (pre-filled, helper), Channel as checkboxes (Hard copy, Email, WhatsApp ticked, Other; more than one can be ticked), Note; Cancel and Confirm |
| CoA · Sent · Desktop | D | JO-2026-0141 Delivered, stepper complete; green line "Sent by WhatsApp to", **Sari Wulandari**, 25 Oct 2026; button Add another send |
| CoA · Mark sent sheet · Phone | P | The CoA tab on phone with the same form in a bottom sheet |
| Cancel job order · P7 · Desktop | D | Over JO-2026-0137 (no sample received): destructive dialog "Cancel JO-2026-0137?", Reason (required), Keep job order and Cancel job order |

**Deviations:** the CoA frames use **JO-2026-0141** (PT Kaltara Energi Prima, contact Sari Wulandari), not 0142, because 0142 is still in analysis. Add batch on phone keeps the two steps of section 8; the tablet keeps the modal.

### 10.3 Tokens

The owner changed 11 colour values (mostly dark mode, plus light `Text/text-muted` `#A4A39A`). `tokens/sgsi-tokens.json` and `tokens/sgsi-tokens.css` were re-exported and `../Design System/Design_Tokens.md` regenerated (its section 1 lists the changes). Contrast to review: muted text is 2.5 to 1 on card in light (2.4 in dark), below 4.5, and the header now uses it for contact, PO and due date.

### 10.4 Still open

Touch targets on tablet and phone (the phone checkbox list rows are 14 px apart, not 44 px tall); the tablet detail frames clip below 908 px; the prototype update (Prototype plan section 14).

## Revision 11 · Tab order (Nov 4, 2026) · BUILT (Nov 4, 2026)

Owner feedback: the job order tabs read **Overview, Samples, Batches, Files, CoA, History** (Samples before Batches: samples are registered first, then batched). Count pills stay on Samples, Batches and Files.

| Where | Change |
| --- | --- |
| Frames | Every job order detail frame at three sizes: row C (Overview, Batches, Samples and their states), row D (Add batch over the Batches tab), row E (CoA frames, P7). Generator `rowC.js` (tabs) and the rows built on it |
| Prototype | Tab order in `app2.js` (detail tabs), listed in the prototype plan section 14 |
| Text | Earlier sections of this plan list the old order (Overview, Batches, Samples); this revision replaces it |

Built together with the batch list (`../Batch/Batch_Screen_Plan.md` section 13).

Built: `rowC.js` `tabs()` now lists Overview, Samples, Batches, Files, CoA, History; rows C, D and E were rebuilt, so every job order detail frame at three sizes has the new order.

## Revision 12 · Desktop feedback of Nov 4, 2026 · BUILT (Nov 4, 2026)

| # | Feedback | Frames |
| --- | --- | --- |
| 1 | **Overline without "WORK"**: the Split "WORK" + date (or "JOB ORDERS") becomes one text: "TUESDAY 21 OCTOBER 2026" on desktop, "JOB ORDERS" on tablet and phone (the owner already changed List · Desktop) | 21 frames: job order list T, P, Empty D; every Create frame behind the overlay (D 10, T 1); batch list D 6, T 1, P 2 ("BATCHES") |
| 2 | **Table card** padding 16 on all sides; the library table rows inside drop their side padding (cells keep 8) | Job order list D 01 and the 10 Create backdrops; T 01 and the tablet Create backdrop |
| 3 | **Card head fixed 32**; short texts stay in the head, notes and hints move to **Card content** (Card anatomy, `../Design System/Component_Library_Plan.md`) | Samples card: hint "Paste IDs from Excel ..." (D, T 06), inline alert (D 11); Batches card: awaiting-arrival note (D 05, Add batch D 02 backdrop); every other card head (Properties, Overview Batches, CoA) is set to 32 |
| 4 | **Add batch** buttons in the Batches tab are **sm** | Batches card head D, T 03, 04, 05; the Add batch and P7 backdrops (D 04-01, 04-02, 05-03) |

Built with Batch plan Revision 3 (`../Batch/Batch_Screen_Plan.md` section 14).

Built with `library/cards.js` and the changed generators (`../Batch/Batch_Screen_Plan.md` section 14.5): 21 overlines lost the "WORK" layer, 17 Table cards are padded 16, every Card head is 32 px, notes and hints sit in Card content (Samples hint, inline alert, awaiting-arrival note), and the Add batch buttons of the Batches tab are small.

**Card padding (Nov 4, 2026, supersedes the 16 / 20 rule of 6.5e):** every card on every screen is padded 16 on all four sides.
