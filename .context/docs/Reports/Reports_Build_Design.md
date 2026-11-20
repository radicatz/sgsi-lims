# Reports: build design (phase 4)

Written Nov 20, 2026, for phase 4 of `../Project/V1_Build_Plan.md`. **Updated the same day** with the lab's first answers (section 14), the two sample documents, and the owner's signing rule: **the signatory is the signed-in user, and delegating means changing the signatory on the job order** (section 7.1). **Status: plan, waiting for the owner's go and the open points in section 13.**

Written for: the product owner, and whoever builds and reviews phase 4.

**Sources:**
- **Screens:** `Reports_Screen_Plan.md` (module 07, built Nov 5, 2026) and the job order CoA card (`../Job Order/Job_Order_Screen_Plan.md` sections 2 and 5).
- **Flows:** `Reports_Prototype_Plan.md`.
- **Rules (spec):**
  - 9.5 for the report states and 9.8 for what a CoA carries.
  - S-28 for the screen and 14.3 for report generation.
  - D-12 and D-13 for rounding and fixed carbon by difference.
  - D-41 and F-SIG-01 for the signatory, D-43 for no specification column, D-49 for the RoA being uploaded.
  - 6.1 for sample identifiers.
- **The lab's sample documents** (`../../source-documents/`):
  - `pdf-p-COA contoh.pdf`: another vendor's certificate (SUCOFINDO).
  - `pdf-roa-contoh.pdf`: a report of analysis (PT Jasa Mutu Mineral Indonesia).
- **Logos:** `../../assets/`. The certificate uses the SVG lockup `sgsi-logo-primary.svg` (owner, Nov 20).
- **Notifications:** `../App/App_Screen_Plan.md` 5.1 for N6; N9 and N10 are new (section 9).
- **The certificate's text fields:** Configuration, Report templates (`../Admin/Configuration_Slice_B_Plan.md`).

This file says how all of that is built and tested.

## 1 · Scope

Phase 4 turns the frozen values of a job order's completed batches into the client's **Certificate of Analysis**, **signed digitally** by the person named as signatory. It also gives every role one place to find the lab's reports.

**The gate:** a CoA for a real job order (request item 5) matches the lab's CoA layout (R-10), signed by the right person (R-21).

Until the lab has a job order with samples in, the gate is checked against demo data (section 14, item 7).

| In phase 4 | Later |
| --- | --- |
| **Generate CoA** from the job order's CoA card, once every batch is completed. The **draft**: bases, parameters, attention, client reference, remarks and signatory, with a live preview | My work Q6 and Q7 (phase 5); the CoA coverage figures on the Dashboard (phase 5) |
| **Send for signature** (Lab admin), then **Sign and publish** by the signatory, signed in as themselves and entering their password again. This assigns the number `CoA-{job order}-{revision}`, places their signature and the lab stamp, stores the PDF with its SHA-256, and notifies the CSO (N6) | A certified signature through an Indonesian certificate authority (PSrE), if clients or KAN require it (open point 12) |
| **My signature** (Profile): each signatory uploads their own. **The lab stamp**: uploaded once by the Manager | Delegation records with dates, two-step sign-in (MFA) for signatories |
| **Download**, **Print** (counted), and **Mark sent** (date, one or more channels, recipient, note) | E-mail from the system, a client portal, a public verify page for the verification code |
| **Revise** (reason; a new revision that supersedes the old one once signed) and **Void** (Superadmin, reason; the number is never reused) | Reopening a batch to fix a value (next goal, spec 9.5) |
| **Reports list** `/reports`: CoA and RoA tabs, search, period, company, status chips, multi-select **Download PDFs** (one zip) | CSV and XLSX export of the list (phase 6) |
| **CoA page** (draft, awaiting signature, published, sent, superseded, void) and **RoA page** (the signed file uploaded in phase 3, read-only) | RoA drafted, reviewed and printed from the system (S-10, next goal) |
| Job order: the CoA card in all its states, the status moves **Reported** (signed) and **Delivered** (sent), and the signatory picker without a typed name (section 7.1). Close then works as built in phase 2 | — |
| The Configuration template preview and the Laboratory logo draw the **same certificate** as the PDF, in SGSI branding | Client-specific branding on a CoA |

## 2 · Screen reference (FigCraft)

The frames are in `../../design/figcraft/SGSI-LIMS-screens.figcraft`. When a frame and this design disagree, this order decides:
1. Spec 6.1 for sample identifiers. The Reports frames still print "Sample BA-0142-01, Lab ID LBA-26-1101".
2. The owner's and the lab's answers (sections 13 and 14).
3. The frame.

**Existing frames.** Module 07 has 26 frames; 6 more come from module 03 (Job orders). Each name was checked against the file on Nov 20, 2026.

**Slice A · Generate, draft, sign and publish, and the job order's CoA card**

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-03-Job_orders-05-CoA_and_actions-04-Ready_to_generate` | | |
| `Desktop-03-Job_orders-05-CoA_and_actions-05-Draft_in_progress` | | |
| `Desktop-07-Reports-02-CoA-01-Draft` | `Tablet-07-Reports-02-CoA-01-Draft` | `Phone-07-Reports-02-CoA-01-Draft` |
| `Desktop-07-Reports-02-CoA-02-Draft_signatory` | | |
| `Desktop-07-Reports-02-CoA-03-Publish_confirm` (becomes the Send for signature confirm) | | |
| `Desktop-07-Reports-02-CoA-04-Published` | `Tablet-07-Reports-02-CoA-04-Published` | `Phone-07-Reports-02-CoA-04-Published` |

**Slice B · Send, revise, void, Reports list and the RoA page**

| Desktop | Tablet | Phone |
| --- | --- | --- |
| `Desktop-07-Reports-01-Reports_list-01-CoA_tab` | `Tablet-07-Reports-01-Reports_list-01-CoA_tab` | `Phone-07-Reports-01-Reports_list-01-CoA_tab` |
| `Desktop-07-Reports-01-Reports_list-02-RoA_tab` | | |
| `Desktop-07-Reports-01-Reports_list-03-CSO` | | |
| `Desktop-07-Reports-01-Reports_list-04-Analyst` | | |
| `Desktop-07-Reports-01-Reports_list-05-Multi_select` | | |
| `Desktop-07-Reports-01-Reports_list-06-Empty` | | |
| `Desktop-07-Reports-01-Reports_list-07-No_results` | | `Phone-07-Reports-01-Reports_list-08-Filters` |
| `Desktop-07-Reports-02-CoA-05-Mark_sent` | | `Phone-03-Job_orders-05-CoA_and_actions-01-Mark_sent_sheet` |
| `Desktop-07-Reports-02-CoA-06-Sent` | | |
| `Desktop-07-Reports-02-CoA-07-Revise` | | |
| `Desktop-07-Reports-02-CoA-08-Superseded` | | |
| `Desktop-07-Reports-02-CoA-09-Void_confirm` | | |
| `Desktop-07-Reports-03-RoA-01-Default` | | `Phone-07-Reports-03-RoA-01-Default` |
| `Desktop-07-Reports-03-RoA-02-Analyst` | | |
| `Desktop-03-Job_orders-05-CoA_and_actions-01-Mark_sent` | | |
| `Desktop-03-Job_orders-05-CoA_and_actions-02-Sent` | | |

**New and changed frames (the design stays the source of truth).** The signing step, the signature and the stamp had no frames. They are specified at all three sizes in the screen plans and drawn in FigCraft before the build, with `library/screens/rowLs.js` (add-only, so the owner's edits stay):

| Plan | Frames (each at Desktop, Tablet and Phone) |
| --- | --- |
| `Reports_Screen_Plan.md` 16 | `07-Reports-02-CoA-03-Send_for_signature_confirm` (renamed from Publish_confirm; tablet and phone added), `-10-Awaiting_signature`, `-11-Sign_review`, `-12-Sign_dialog`, `-13-Return_dialog`, `-14-Returned`; in place: Publish becomes Send for signature, the signatory list without typed names, "On behalf of", and the **new certificate drawing** in every CoA preview |
| `../Job Order/Job_Order_Screen_Plan.md` Revision 17 | `03-Job_orders-05-CoA_and_actions-06-Awaiting_signature`, `-07-Signatory_change_confirm`; in place: the form's signatory list without typed names (the two typed-name edit frames renamed " retired") |
| `../App/App_Screen_Plan.md` 18 | `00-App-09-Profile-04-Signing` (Signature and Lab stamp cards), `-05-Signature_upload`; events N9 and N10 |

The stamp sits on the Manager's Profile, not in Configuration > Laboratory, because the Manager has no Configuration access.

**Where no frame exists**, the build uses the nearest one and records it in the build status, as phases 2 and 3 did. Known cases:
- **Tablet:** the RoA page, the dialogs and the job order CoA card use the desktop layout at tablet width.
- **Phone:**
  - Dialogs become bottom sheets.
  - The job order CoA card stacks its buttons.
  - Revise and Void use the sheet pattern of Mark sent.
  - The superseded banner sits above the certificate card.

## 3 · Two slices

Each slice is committed when its checks pass. The signing step is part of slice A; the signature and stamp images arrive in slice B.

| Slice | Builds |
| --- | --- |
| **A · The certificate and signing** | Migration C-21; the payload builder and the certificate renderer (section 6); PDF rendering and the `reports` bucket; Generate CoA; the CoA page as a draft (preview, Contents, Send for signature, Delete draft), awaiting signature (Withdraw; the signatory's Sign and publish or Return), and once published (preview, Details, Versions, Download, Print); the job order's CoA card (not ready, ready, draft, awaiting signature, published); the job order's signatory without a typed name; job order status Reported; N6, N9 and N10; the Configuration preview on the same renderer. Until the images arrive, a signed CoA prints the signatory's name over a signature line |
| **B · Delivery, the Reports page and the images** | Mark sent (dialog and sheet), the Delivery card and "Add another send"; job order status Delivered; Revise, the Superseded banner, Void; the Reports list with both tabs, filters, chips, the per-role views and the multi-select zip; the RoA page; saving the client's default bases and signatory; **My signature** on the Profile and the **stamp** on Laboratory, both placed on the certificate at signing; demo data `pnpm seed:reports` |

## 4 · Who does what

From the permission grid (migration 0500), spec 8.2 and the screen plan section 3. **New:** `signing.stamp` for the Manager.

| Role | Reports sidebar | CoA | RoA |
| --- | --- | --- | --- |
| **Lab admin** | CoA and RoA tabs | Generate, edit the draft, **send for signature**, withdraw, delete a draft, revise, download, print. **Cannot sign** | Download, print |
| **Manager** (`report.sign`, `signing.stamp`) | Both, published CoAs, plus those waiting for their signature | **Sign and publish** or **return** a CoA that names them; upload their signature; upload the stamp; download, print | Download, print |
| **Supervisor** (`report.sign`) | Both, published CoAs, plus those waiting for their signature | Sign and publish or return a CoA that names them; upload their signature; download, print | Download, print |
| **Superadmin** | Both | Everything the Lab admin does, plus **Void** and Mark sent. **Cannot sign** and cannot change anyone's signature | Download, print |
| **CSO** | CoA only, no tabs, no Draft chip | Download, print, **Mark sent**. Can change the job order's signatory (section 7.1) | Not shown |
| **Analyst** | RoA only, no tabs | Not shown | Download |
| **Preparation** | No Reports item (No access page) | — | — |

Two separations follow:
- The person who **prepares** a CoA (Lab admin) is never the person who **signs** it, unless they are also named as signatory and hold `report.sign` (none of the seeded roles do).
- The person who **administers** the system (Superadmin) can't sign.

The API checks every action first, with a clear 403. Row-level security stays as the second line.

## 5 · Backend routes

All under `/api`, in a new `routes/reports.ts`. Each one checks its permission (section 4).

| Route | What it does | Permission |
| --- | --- | --- |
| `GET /orders/:no/coa` | The job order's CoA card: the state (not ready with "n of m batches completed", ready, draft, awaiting signature, published, sent), the current CoA, its deliveries, the batches it is built from | `order.read` (CoA details need `coa.download`) |
| `POST /orders/:no/coa` | Creates the draft (section 7). 409 when a batch is still open, when a draft already exists, or when no current CoA template exists (V-22) | `report.publish` |
| `GET /reports?kind=coa\|roa&status&q&period&company&page&sort` | The list for the tab. CoA rows: number, job order, client with logo, status, published, signatory, last send. RoA rows: RoA number, batch, job order, client, uploaded, uploaded by | `coa.download` / `roa.download` |
| `GET /reports/coa/:id` | Header, Contents (draft) or Details, Delivery, Versions, the signing state, and what the user can do with the reasons | `coa.download`; a draft needs `report.publish`; awaiting signature also opens for its signatory |
| `PATCH /reports/coa/:id` | Draft contents: bases, parameters, attention, client reference, remarks, signatory (a user with `report.sign`), the optional "on behalf of" line | `report.publish` |
| `GET /reports/coa/:id/html` | The certificate as HTML pages for the preview: live from the contents for a draft, from the stored payload once published | as `GET` |
| `GET /reports/coa/:id/pdf` | Published: a one-hour signed link to the stored PDF. Draft: a PDF rendered on the spot with the DRAFT mark, not stored (the phone's **Preview PDF**) | as `GET` |
| `POST /reports/coa/:id/send` | Draft to **Awaiting signature**. Locks the contents and notifies the signatory (N9) | `report.publish` |
| `POST /reports/coa/:id/withdraw` | Back to Draft, so the Lab admin can edit again | `report.publish` |
| `POST /reports/coa/:id/return` | The signatory sends it back to Draft with a required comment (N10 to the Lab admin who sent it) | `report.sign`, and the CoA names them |
| `POST /reports/coa/:id/sign` | Allowed only when **the signed-in user is the CoA's signatory**. The password is checked again (failures count towards the sign-in lock). Freezes the payload, assigns the number, places the signature and the stamp, renders and stores the PDF with its SHA-256 and the verification code. Records who signed and when. Moves the job order to Reported, supersedes the previous revision, sends N6 | `report.sign`, and the CoA names them |
| `DELETE /reports/coa/:id` | Deletes a draft (revision 1 brings the job order card back to Ready; a draft revision leaves the published one current) | `report.publish` |
| `POST /reports/coa/:id/revise` | Reason required. A draft of the next revision with the same contents; the published revision stays current until the new one is signed | `report.revise` |
| `POST /reports/coa/:id/void` | Reason required. The CoA becomes Void; its number is never reused; the job order goes back to In progress (open point 5) | `report.void` |
| `POST /reports/coa/:id/print` | Counts a print (count and last print on Details) | `coa.download` |
| `POST /reports/coa/:id/deliveries` | Mark sent: date (not in the future), channels (one or more from the `send_channel` lookup), recipient, note. The first send of the current revision moves the job order to Delivered | `coa.mark_sent` |
| `POST /reports/download` | Several published CoAs or signed RoAs as one zip | `coa.download` / `roa.download` per file |
| `GET /reports/roa/:batchNo` | The RoA page: the uploaded file's details, the batch, and "Used in" (the CoA built from it) | `roa.download` |
| `PUT /companies/:id/coa-defaults` | Saves the bases and signatory as the client's default (the toast after signing, spec S-28) | `report.publish` |
| `GET`, `PUT /me/signature` | One's own signature: preview, upload or replace (PNG with transparency, at most 1 MB). Only the signed-in user can set their own; no route sets someone else's | `report.sign` |
| `PUT /laboratory/stamp` | Upload or replace the lab stamp | `signing.stamp` |

**Existing routes that change**
- `POST` and `PATCH /orders` (phase 2): the signatory must be a user with `report.sign`. The typed name is refused (open point 14).
- **A signatory change on the job order** while a CoA is a draft updates the draft. While it is awaiting signature, it moves the request to the new signatory: N9 to the new one, and a plain "no longer waiting for you" to the old one.

The RoA file itself keeps its phase 3 route (`GET /batches/:no/roa/file`).

**Connections:**
- Print counts, signing, and the job order status moves run through `runAsActor`. A CSO can't write `reports`, and a signatory can't write `reports` or `job_orders` on their own. This is the same pattern as Complete batch.
- Everything else runs as the signed-in user.

## 6 · The certificate: payload, layout and PDF

### 6.1 Payload (built once, frozen at signing)

The payload is built from the **verified** values of the job order's **completed** batches (C-10), never from live entry. It carries:
- **Header:** lab name and address, number, revision, date issued.
- **Client block:** client (principal) and address, attention, client reference, job order, date received (the first reception), sample count.
- **Statement and terms:** from the current template.
- **The samples.**
- **Signatory and footer:** the signatory's name and title, the optional "on behalf of" line, the template's form code and revision.

Per sample and parameter it holds the value on each chosen basis, rounded by the parameter's decimals (2, owner Nov 16), and the method with its edition.

Where a rule below comes from the lab's samples, the source is named: the RoA is `pdf-roa-contoh.pdf`, the CoA is `pdf-p-COA contoh.pdf`.

| Rule | How |
| --- | --- |
| **Which samples** | Received samples of completed batches. Held samples and samples marked not received are left out. The draft says how many, for example "11 samples reported. 1 not received is left out" |
| **Identifiers** | Sample code and Sample ID (spec 6.1). The client reference is **not printed** (spec 6.1 default) |
| **Bases** (both samples agree) | **TM:** AR only. **IM:** ADB only. **Ash:** ADB, DB, AR (DAF "-"). **VM, FC, TS, GCV:** every chosen basis. **HGI** and the Ash analysis and Trace element items: one value across the basis columns, as the CoA prints HGI. **Net CV:** AR only. Converted from ADB with `fromAdb()` in `packages/shared` |
| **Basis columns** | Air Dried, Dry, Dry Ash Free, As Received, in that order (the RoA). A basis the draft turns off drops its column |
| **Mass as received (kg)** | The first row of each sample, from reception (the RoA) |
| **Fixed carbon** | **By difference on each basis, from the rounded values** of that basis (D-13, closed): ADB = 100 − IM − Ash − VM; DB = 100 − Ash − VM; DAF = 100 − VM; AR = 100 − TM − Ash − VM. The method column prints the standard's proximate practice (ASTM D3172, as both samples), not "By calculation" (open point 13) |
| **Net CV** | Printed only when NCV is ordered on the job order (lab, Nov 20). Neither sample prints it |
| **Detection limit** | A value below its method's limit prints as `<limit` (W-9); a value saved with "<" prints as typed |
| **Parameters** | The job order's ordered parameters, in catalogue order. The draft can turn any off (the values stay in the system). PREP, ADL and O are never printed |
| **Numbers** (both samples agree) | Dot decimals and **no thousands separator** in results: 6018, 5914, 46.63 |
| **Methods** | The method and edition from Configuration, as "ASTM D3175-20". The lab has not confirmed the list yet (section 14, item 6) |
| **Language** | English, as both samples |

### 6.2 Layout, branding and print scale

**One certificate renderer** in `packages/shared` writes the pages as HTML with their own CSS. It is a plain function from the payload, template fields and lab settings to a string, so the API (PDF) and the web app (preview) draw the same thing. A working sample of it is `.context/design/figcraft/samples/make-samples.js`, which renders the five sample PDFs of the frames (Reports_Screen_Plan.md 16.8). It becomes the renderer in slice A.

**Print scale (owner, Nov 20: "I liked the preview in Configuration > Report templates, use its colour and font sizes").** The rules come from that preview (`apps/web/src/styles/overlays.css`, `.a4*`) and apply to the PDF and to every preview:

| Rule | Value |
| --- | --- |
| **Unit** | The page is A4, 595 × 842 pt. **1 px of the Configuration preview is 1 pt** in the PDF, so every size below is in **pt**. (The app's design tokens are in px for a screen; a 12 px caption on a 595 px page would print as 12 pt, about twice too large.) |
| **Margins** | 34 pt top, 40 pt left and right, 60 pt at the bottom for the footer. The footer repeats on every page |
| **Type sizes** | Body 8 pt on 12. Lab name 14 pt Newsreader on 16. Title 22 pt Newsreader on 28. Number 9 pt mono. Address and footer 7 pt on 10. **Table 7.5 pt on 11.** Small labels under a head (the basis names) 6.5 pt on 9. **Nothing under 6.5 pt** |
| **Fonts** | Newsreader for the lab name and the title, Noto Sans for text, **JetBrains Mono for every number and code**: the certificate number, the values, the mass, the sample code and the Sample ID, the job order |
| **Colours** | Keys and labels **muted** (`--text-muted`), values **neutral** (`--text-foreground`), strokes the **warm border** (`--surface-border`), headings and table heads **heading navy** (`--text-heading`). Navy is not used as a fill. The error red only for "Internal, not for distribution". No coloured head rows |
| **Table lines** | 0.75 pt in the warm border colour, collapsed. No fills |
| **Table width** | The page's content width (515 pt). Fixed layout: parameter 30 %, method 20 %, four basis columns 12.5 % each |
| **Cells wrap, never crop** | A long text wraps to a second line in its cell (`white-space: normal`, `overflow-wrap: anywhere`). The Configuration preview crops with an ellipsis; the printed document must not |
| **Long values** | Text-only values (HGI, free text, the Ash analysis and Trace element items) span the basis columns in one wide cell, as the lab's CoA prints HGI. A value that does not fit is wrapped, not shrunk |
| **A table that does not fit** | One sample's table is kept whole on a page. A table longer than a page (a full analysis with Ash analysis and Trace elements, 35 to 40 rows) continues on the next page and **repeats its head rows with "(continued)"** (`thead` as a header group) |
| **What cannot overflow** | Columns are fixed (parameter, method, at most four bases); more parameters add rows, not columns. A basis the draft turns off removes its column. There is no landscape page and no "samples as columns" layout |
| **Signature block** | Kept together at the end of the last page: "Issued at Samarinda" and the date on the left; on the right the signature image (about 40 pt high) with the stamp (50 pt) beside its end, then a 0.75 pt line, the name and the title. "On behalf of" under the title when set |
| **DRAFT mark** | A fixed 90 pt watermark at 6 % opacity, on every page of an unsigned certificate |
| **Pages** | "Page n of m" in the footer. The client block and the statement print on page 1, remarks and the signature on the last page |

**Branding.** The certificate carries SGSI's branding, not the vendors'. The samples set the content and order; the look is ours:
- The SGSI icon (SVG, `sgsi-icon-primary.svg`) with the lab name and address, as in the Configuration preview.
- The placeholder signature and stamp are `b_sutrisno-sign.png` and `sgsi-stamp.svg` (`.context/assets/images/`). Each signatory's own signature replaces the first; the lab's stamp replaces the second.
- The lab can adjust the branding later without code: the logo and address live in Configuration > Laboratory, the wording in Report templates.

From top to bottom:
1. **Letterhead:** the icon, the lab name and the address with the accreditation; on the right the certificate number (mono), the revision and the date issued.
2. **Title:** "Certificate of Analysis" (template field), centred.
3. **Client block:** two columns of key and value: Principal, Address, Attention, Reference; Job order, Received, Samples, Standard.
4. **Statement** (template field, with the job order's standard).
5. **Results:** one bordered table per sample, as the lab's RoA: head rows CODE SAMPLE and Test Method with the sample code over the Sample ID, then the basis row (ADB Air Dried, DB Dry, DAF Dry Ash Free, AR As Received), then Mass as Received (kg), then a row per parameter with its method.
6. **Remarks**, if any.
7. **Signature block** (above).
8. **Footer** on every page: the terms line, page *n* of *m*, the verification code and the form code with its revision.

The RoA preview on the RoA page uses the same rules with its own header ("Report of Analysis", "Internal, not for distribution" in red, the batch), a held sample shown as "Not analysed" with its reason, and the Technical Supervisor's signature line without an image (it is the lab's uploaded paper).

**How the frames show it.** The preview in a frame is an **image of page 1 of the real PDF** (Gotenberg, then PyMuPDF at 3×), so type, colours and scale are the printed ones. One extra frame (`Desktop-07-Reports-02-CoA-15-Published_last_page`) shows page 4, with the signature and stamp.
### 6.3 PDF

- **Staging and production (S-11):** a **Gotenberg 8** container turns the HTML into the PDF.
- **Development:** Gotenberg runs in Docker once the owner has installed it on this machine. Until then, when `GOTENBERG_URL` is not set, the API prints the same HTML through the installed Chrome (`playwright-core`, already used by the tests). Both are Chromium, so the output is the same (open point 2).
- **Embedded assets:** the fonts, the SVG logo, the signature and the stamp are embedded in the HTML, so a PDF never depends on the internet.
- **Storage:** the file goes to a private bucket `reports`, as `coa/{job order}/{number}.pdf`, with its SHA-256.
- **Verification code:** 8 characters of the SHA-256 of the frozen payload, printed as `7F3A-91C2`.

### 6.4 Preview in the app

The CoA page fetches the HTML (with the user's token) and shows it in a sandboxed frame, scaled to the card with the zoom bar the Configuration preview already has. The pager (‹ Page 1 of 4 ›) scrolls to a page.

A draft's preview refreshes after each change to Contents, which is saved as you go, debounced. The DRAFT mark shows across every draft page. The signatory sees the same preview before signing.

## 7 · Rules the build follows

| Rule | How |
| --- | --- |
| **Generate** | Every batch of the job order is Completed and there is at least one. No CoA is current, in draft or awaiting signature. A current CoA template exists. Samples still awaiting arrival are listed as left out (open point 3) |
| **Draft defaults** | Bases: the client's saved default, else ADB, DB, DAF and AR. Parameters: all ordered. Attention and client reference: from the job order. **Signatory: the job order's** (the Manager by default, owner Nov 16); if the job order has none, the client's default, else the Manager |
| **Signatory** | A user with `report.sign`. The job order form, the draft and the client default all offer only those users (open point 14) |
| **One open CoA** | One draft or awaiting-signature CoA per job order (database index) |
| **Send for signature** | Needs a signatory and at least one basis and one parameter. The contents lock; the Lab admin can **Withdraw** until it is signed |
| **Sign and publish** | **Only the signed-in user who is the CoA's signatory can sign.** The Lab admin, the Superadmin and every other user are refused. The password is entered again. The payload freezes; the number, file, SHA-256, verification code, signer and time are set together. A failed render signs nothing |
| **Return** | The signatory sends it back to Draft with a comment, shown on the draft |
| **Numbering** | `CoA-{job order}-{revision}`: revision 1 at the first signing, then the next revision. Voided and superseded numbers are never reused (`report_no` is unique) |
| **Revise** | Reason required. A draft of the next revision copies the contents and goes through signing again. Once signed, the old revision becomes **Superseded** (date kept) and the job order goes back to **Reported** until the new revision is sent |
| **Void** | Superadmin, reason required. A void CoA keeps its file and shows a banner. The job order goes back to In progress, and the CoA card is Ready again |
| **Job order status** | Reported at signing; Delivered at the first send of the current revision. Close is allowed from Delivered (phase 2) |
| **Locks** | Signed, superseded and void CoAs never change; only deliveries and the print count are added. To change the signatory of a signed CoA, revise it |
| **Audit** | Every change is in the audit log (trigger); the report's label is its number. Signing, signatory changes, and signature and stamp uploads are audited too |

### 7.1 Signing and delegation (the lab's question, Nov 20)

> *"Misal yang punya wewenang untuk sign dan stempel manager lab, tapi manager lab delegasi. Itu potensi masalah nggak? Gimana kontrolnya?"*
> (If the authority to sign and stamp belongs to the lab manager, but the lab manager delegates, is that a potential problem? How is it controlled?)

**The rule (owner, Nov 20):**
1. The certificate names one **signatory**: a user of the system with signing rights.
2. **Only that user can sign it**, signed in as themselves.
3. **To delegate, change the signatory on the job order** (or in the draft) to the person who will sign. The delegate then signs with their own name, title and signature. Nobody ever signs with someone else's name or signature.
4. Everyone who may edit a job order can change its signatory, **the CSO included**. The change is in the audit log, and it can't make anyone sign: the named person still has to sign in.

**Why this answers the lab's question.** Delegating is normal. The risk is a certificate that shows the Manager's name or signature when the Manager did not authorise it (ISO/IEC 17025:2017, clause 7.8.2.1 o). Under this rule that can't happen, because the app prints the name and signature of whoever actually signed.

| Control | How |
| --- | --- |
| **The signer is the named person** | The API refuses `sign` unless the signed-in user is the CoA's signatory. No role, including the Superadmin, can sign for someone else |
| **Only the owner can set a signature** | Each signatory uploads their own signature from their Profile. No route sets or replaces someone else's |
| **The signer's own password at signing** | Sign and publish asks for it again, so an open session or a colleague at the keyboard can't sign |
| **Who changed the signatory is recorded** | The audit log shows the job order's signatory change: who, when, from and to. Changing it on a CoA that waits moves the request and notifies both people |
| **The stamp** | Uploaded once by the Manager (`signing.stamp`). It prints only beside a signature, which only the signatory's own login can produce. Whether a delegate's signature also carries the stamp is the lab's choice (open point 15; default yes) |
| **A full trail on every certificate** | The record keeps: who prepared it, who sent it for signature, who signed and when, the hashes of the signature and stamp images used, the SHA-256 of the PDF, and the verification code printed on it. Details shows "Signed by Hendra Wijaya, S.T." and the optional "on behalf of" line |
| **Old signatures stay checkable** | A replaced signature or stamp is retired, not deleted, so older certificates can still be verified |

**One thing the rule does not do.** It can't stop a signatory from signing when they are not entitled to. Who may be the signatory is the lab's decision (section 14, "Still to ask"), and the system only offers users who hold signing rights. If the lab wants a stricter control later, such as delegations that expire or only the Manager granting them, it can be added without changing the flow.

**What kind of signature this is.** v1 places a signature image under these controls: an *uncertified* electronic signature in the terms of PP 71/2019, which is valid under UU ITE. A *certified* electronic signature, from a licensed Indonesian certificate authority (PSrE), gives stronger legal standing. It can be added later, without changing the flow, if the lab's clients or KAN ask for it (open point 12). This is a design note, not legal advice: the lab should confirm with its quality manager or KAN.

## 8 · Database (migration C-21)

The owner runs it in the SQL editor, as before.

| Change | Why |
| --- | --- |
| `report_status` gains `awaiting_signature` | The signing step |
| `reports`: `remarks`, `print_count` (default 0), `last_printed_at`, `verify_code`, `page_count`, `template_revision`, `supersedes_id` | Remarks; Printed on Details; the footer code; the pager; the template version; the version chain |
| `reports`: `sent_for_signature_by`, `sent_for_signature_at`, `signed_by`, `signed_at`, `on_behalf_of text`, `signature_sha256`, `stamp_sha256`, `return_comment` | Who signed, with which images, and the optional line |
| Unique index `(job_order_id, revision)` for CoAs; one draft or awaiting-signature CoA per job order | Revision numbers once; one open CoA |
| `companies.coa_bases text[]` | The client's default bases (the signatory default already has `signatory_rules`) |
| New `signing_assets` (kind signature or stamp, user for a signature, file path, SHA-256, set by, set at, retired at) | Signatures and the stamp, with their history |
| Permission `signing.stamp`, given to the Manager | Uploading the stamp |
| Policies: a draft or awaiting-signature CoA is readable with `report.publish`, or by its signatory; anything else with `coa.download` or `report.publish`. `signing_assets` are never read from the browser (the API embeds them) | Drafts stay with the Lab admin and Superadmin (screen plan point 7); signatures don't leak |
| Private buckets `reports` (PDF, 10 MB) and `signing` (PNG, 1 MB) | Stored certificates; signatures and the stamp |
| Method rows for fixed carbon: ASTM D3172, ISO 17246, GB/T 212 | The method column of FC (open point 13) |

No table is added for delegation: the job order's signatory column (phase 2) is the delegation.

## 9 · Notifications

| Event | When | To | Text |
| --- | --- | --- | --- |
| **N9** (new) | A CoA is sent for signature, or its signatory is changed while it waits | The signatory | "CoA for JO-2026-0131 waits for your signature" / "Sent by Maya Lestari." |
| **N10** (new) | A signatory returns a CoA | The Lab admin who sent it | "CoA for JO-2026-0131 was returned" / the comment |
| **N6** | A CoA or a revision is signed | Every CSO | "CoA-JO-2026-0131-2 is published" / "Send it to PT Bara Nusantara Mandiri." |

All three link to the CoA page. N9 and N10 are added to the App plan's event list.

## 10 · Demo data

`pnpm seed:reports` (with `--remove`) adds its own job orders, so the demo orders of phases 2 and 3 (JO-2026-0130 to 0143) keep their states. Each new job order has completed batches, verified values, an uploaded signed RoA, and CoAs rendered by the real renderer. The CoA list and the job order cards then show every state:

| Job order | CoA |
| --- | --- |
| JO-2026-0120 to 0124 | Signed and sent (WhatsApp, email, hard copy), for the list's Sent rows |
| JO-2026-0125 | Revision 1 superseded ("Wrong client reference"), revision 2 signed |
| JO-2026-0126 | Signed, not sent (the CSO's Mark sent demo) |
| JO-2026-0127 | Awaiting the Manager's signature |
| JO-2026-0128 | A draft |
| JO-2026-0129 | Ready to generate (both batches completed, no CoA) |

Further demo data:
- **Signatures:** the demo Manager and Supervisor get signature images and the lab a stamp image, each printed with the word **DEMO**, so they can never pass for real ones. JO-2026-0126 is signed by the Supervisor, so the "on behalf of" line can be seen.
- **JO-2026-0142** (phase 3 demo) shows "1 of 2 batches completed" until B-2026-0418 is completed.
- **RoA tab:** it lists the signed files of the new batches and B-2026-0417.

## 11 · Tests

| Kind | What |
| --- | --- |
| Unit (`packages/shared`) | The payload maths against the RoA sample and the shipment workbook fixture: Ash DB and AR, VM DAF, GCV AR, DB and DAF, FC by difference on each basis, `<limit`, rounding, no thousands separator; page filling (a sample never splits) |
| Live API (`scripts/check-reports.ts`) | Every route as the right and the wrong role. Generate guards. Draft edits. Send and withdraw. **Signing: only the signed-in signatory can sign; the Lab admin, the Superadmin and a different Supervisor are refused; a wrong password is refused and counted; a changed signatory moves the request and notifies both people; a typed signatory is refused on the job order.** Publish results: number, file present, SHA-256 matches, job order Reported, N6. Revise and supersede. Void and the next revision number. Mark sent (Delivered, channels from the lookup, no future date). The zip. A CSO never sees a draft; an Analyst never sees a CoA. A signature can only be set by its owner; only the Manager can set the stamp |
| Browser (`e2e/phase4-reports-a.spec.ts`, `-b`), at 1440, 834 and 390 | Lab admin generates from the job order, changes bases and parameters, sends for signature. The Manager signs with their password. The CSO finds it in Reports, marks it sent, sees Delivered. Lab admin revises; the Manager returns it once, then signs revision 2 (revision 1 shows Superseded). Superadmin voids. The CSO changes the signatory to the Supervisor, who signs. Analyst opens a RoA. The CSO's list has no RoA tab |

## 12 · Where the build will differ from the frames (known now)

| What | Frames | Build |
| --- | --- | --- |
| Certificate layout | Reports frames: a light table per sample | The RoA's bordered table per sample, with the CoA's header and signature block, in SGSI branding (section 6.2) |
| Publish | The Lab admin publishes | The Lab admin sends for signature; the signatory signs and publishes (new frames, section 2) |
| Signatory on the job order and CoA | Pick a user or "Type manually" | Pick a user with signing rights only (open point 14) |
| Sample identifiers | "Sample BA-0142-01, Lab ID LBA-26-1101" | Sample code and Sample ID (spec 6.1) |
| Numbers | "5,980" in the frames and the Configuration preview | 5980, as both samples |
| FC method | "By calculation" | ASTM D3172 (or the ISO or GB/T equivalent), as both samples |
| Zoom | Pager only (the icon was missing on Nov 5) | Pager plus the zoom bar of the Configuration preview |
| Job order CoA card, "Built from" | "Approved by Hendra Wijaya" | "Uploaded by" the person who uploaded the signed RoA (D-49: no approval in the system) |
| Mark sent channels | Checkboxes (Reports frame) and a segmented control (job order plan) | Checkboxes, several channels (C-8) |
| Status badge for Sent | Green "Sent"; the job order card says "Delivered" | As the frames: Sent on the CoA, Delivered on the job order |

## 13 · Open points (defaults used unless you say otherwise)

| # | Question | Default |
| --- | --- | --- |
| 1 | Certificate layout | **Answered by the samples:** the RoA's bordered table per sample, with the CoA's header and signature block, in SGSI branding (section 6.2) |
| 2 | **PDF engine during development** | Docker Desktop is being installed on this machine (owner, Nov 20), so Gotenberg runs from day one. Until it works, Chrome on this machine prints the same HTML |
| 3 | Samples still **awaiting arrival** when the batches are all completed | Generate is allowed; the draft lists them as left out with a link to the Samples tab |
| 4 | Number format | **Answered by the samples:** dot decimals, no thousands separator |
| 5 | **Void** of the current CoA | The job order goes back to In progress, the card shows Ready, and the next Generate takes the next revision number |
| 6 | Revising a CoA that was already **sent** | The job order goes back to Reported until the new revision is sent; the old one stays downloadable as Superseded |
| 7 | **Undo** after Mark sent (the job order plan mentions a 10-second Undo) | No undo, as with Confirm reception. A wrong send is corrected by adding another send with a note |
| 8 | Signature | **Answered (lab, Nov 20): digital.** The rule of section 7.1 (owner, Nov 20): the signed-in signatory signs; delegating means changing the signatory |
| 9 | **Addresses** | `/reports`, `/reports/coa/:id` and `/reports/roa/:batch` (drafts have no number yet, and a RoA is a batch file) |
| 10 | Where the Reports list opens for roles that see both | The CoA tab |
| 11 | **Client default** after signing | A toast "Save these bases and signatory as PT Bukit Asam's default" for the Lab admin |
| 12 | **Certified signature** (PSrE) | Not in v1. The image signature with the controls of 7.1; a certified provider can be added later if clients or KAN require it |
| 13 | **FC method column** | The proximate practice of the batch's standard (ASTM D3172, ISO 17246, GB/T 212), as both samples. Editions to confirm with the method list |
| 14 | **Typed signatory** | Removed from the job order form, the draft and the client default: a typed name has no account, so nobody could sign as it. Existing job orders with a typed name keep it as text until a CoA is generated; the draft then asks the Lab admin to pick a user (the Manager is pre-selected) |
| 15 | Does a **delegate's** signature carry the stamp? | Yes: the stamp authenticates the lab, and the certificate names the person who signed |
| 16 | **Who may upload the stamp** | The Manager only (`signing.stamp`); the Superadmin can't, so the stamp can't be placed by an administrator |
| 17 | **"On behalf of" line** | Optional text chosen in the draft by the Lab admin, empty by default; it prints under the signatory's name |
| 18 | **Who may change the job order's signatory** | Everyone who can edit the job order, the CSO included (owner, Nov 20); every change is audited |
| 19 | **New frames** for signing (section 2) | Drawn in FigCraft before slice A's signing part and before My signature and the stamp, then built against them. FigCraft must be connected for this |

## 14 · What the lab answered (Nov 20) and what is still open

| # | Request | Lab's answer | Where it went |
| --- | --- | --- | --- |
| 1 | Their CoA | A CoA from another vendor (SUCOFINDO, `pdf-p-COA contoh.pdf`) as the reference | Section 6.2: header, client block, signature with stamp, footer serial |
| 2 | Logo and wording | The logos are in `.context/assets`; use the SVG (`sgsi-logo-primary.svg`). The branding is SGSI's and can still be adjusted | Section 6.2; Configuration > Laboratory and Report templates hold it |
| 3 | Layout choices | "Check the CoA or RoA" | Section 6.1: bases per parameter, mass as received, one table per sample, English, dot decimals with no thousands separator |
| 4 | Signing | **Digital signature.** Open question from the lab: is delegation by the Manager a problem, and how is it controlled? | Section 7.1: the signed-in signatory signs; delegating means changing the signatory |
| 5 | Net CV | Follow the samples (neither prints it); print it only when NCV is selected on the job order | Section 6.1 |
| 6 | Methods and detection limits | Keep the defaults for now. **Not yet clarified with the lab** | Configuration's methods print as they are; flagged for the gate |
| 7 | A completed batch with its signed RoA | "Our job orders have no samples in yet" | The gate waits for the first real job order; demo data until then |

**Still to ask the lab:**
- Who may be a signatory, and with which titles. Must every certificate be signed by the Manager or someone they appoint, or may a Supervisor sign on their own?
- Whether a delegate's signature carries the stamp (open point 15).
- The signature and stamp images (PNG with a transparent background) from each signatory.
- The form code and revision for the CoA, and the exact terms line.
- The method list with editions and detection limits (item 6).
- Whether a certified signature (PSrE) is needed for any client or for KAN (open point 12).

## 15 · Order of work and size

1. **Environment:** Docker Desktop and Gotenberg on this machine (the owner is installing it; Chrome until then).
2. **Design:** draw the slice A signing frames (section 2) in FigCraft.
3. **Database:** migration C-21 (the owner runs it); buckets `reports` and `signing`.
4. **Shared:** the payload maths, the certificate renderer, the unit tests.
5. **API, slice A:** the PDF driver (Gotenberg or local Chrome), the routes, the job order's signatory rule, N6, N9 and N10, `check-reports.ts` part A.
6. **Web, slice A:**
   - The job order CoA card states and the signatory picker without a typed name.
   - The CoA page (draft, awaiting signature, sign and return, published).
   - The Configuration preview on the shared renderer.
   - Compare with the frames at 1440, 834 and 390; browser tests for slice A. **Commit.**
7. **Slice B:** Mark sent, revise, void, the list, the RoA page, the zip, the client default; draw My signature and the stamp row, then build them and put the images on the certificate; `pnpm seed:reports`; checks and browser tests. **Commit.**

**Size: M**, as in the build plan. The signing step adds a little to slice A; the images are a small part of slice B.

## Build status

**Slice A built (Nov 20, 2026).** Migrations C-21 applied. API: card, Generate, draft page and edit, Send, Withdraw, Return, Sign with password, PDF, Print, signatory change, N6/N9/N10 (`apps/api/src/routes/reports.ts`, `scripts/check-reports.ts` all pass). Web: job order CoA card (five states plus the signatory control), CoA page at `/reports/coa/:id` (draft, awaiting signature, signatory view, published), Notifications tint, job order form without a typed signatory. Deviations: the preview is the PDF itself in a frame (phone: Open PDF), not an HTML render; the CSO opens a published certificate from the job order card. Browser tests: `e2e/phase4-reports-a.spec.ts` at 1440, 834 and 390. Slice B (Mark sent, revise, void, list, RoA page, signature and stamp uploads, client default, seed) is next.
