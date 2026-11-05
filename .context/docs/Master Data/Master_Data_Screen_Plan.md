# Master Data — Design Plan

Nov 5, 2026 · Revision 1, frames built Nov 5

Written for: the owner and anyone building the master data screens.

The four MASTER DATA sidebar items: **Clients, Drill hole, Lithology, Seam** (spec S-03 to S-06, F-MD-01 to 04). They hold the lists that every job order, sample and report picks from.

**Reference:** SIM Lab's four list pages, in the proposal PDF (`../../source-documents/Proposal LIMS PT Energy Fortune Invesment.pdf`, pages 19 and 20): Manajemen Perusahaan, Drill Hole, Lithology and Seam Classification. This plan keeps their columns and row actions and adds what v1 needs: a client page with contacts, CoA upload with history, and archive instead of delete. The other vendors are cited where they decide a point.

## 1 · Who sees what

From `../Navigation/Navigation_Screen_Plan.md` (spec 8.3). "Edit" means the page shows the Add button and the row actions; "read" means it shows neither.

| Page | Edit | Read |
| --- | --- | --- |
| Clients and the client page | Superadmin, CSO, Manager (`company.manage`) | Lab admin |
| Drill hole, Lithology, Seam | Superadmin, Lab admin (`master.write`; CoA upload is `coa.upload`) | Supervisor, Manager |

The CSO, Preparation and Analyst pick drill holes, lithologies and seams inside forms, but do not get these pages.

## 2 · What SIM Lab has, and what changes

| SIM Lab | This plan | Why |
| --- | --- | --- |
| Search by keyword and **Reset** (Companies: a Status filter and Reset) | Search, a **Company** select, filter chips, and **Reset** when a filter is set | SIM Lab holds one company; this lab works for several, and the masters are per company (data model, D-01) |
| "Total Drill Hole: 100" above the table | The count sits in the **All** chip ("All 100") | No count subtitles (design rule); the chip carries the same number |
| **Add …** button at the top right of the table | Same, in the page header (edit roles only) | Same place on every page of this app |
| Sortable columns | Same | |
| Row actions as text links: Edit, Hapus/Delete (Drill hole: Edit, Upload COA, Delete) | Edit stays a link; Upload CoA is a small button in the CoA cell; Delete moves to a row menu with **Archive** | Archive (soft delete) for masters is decided (D-30); a record that is used cannot be deleted (S-03, S-04) |
| 25 rows per page ("Baris per halaman 25") | **25 rows per page**, with the rows-per-page select in the pager | Kept from SIM Lab: 100 drill holes and 62 seams. The frames draw the first 12 rows of a page |
| Companies: Nama Perusahaan with logo, Kode, Alamat, Status, Total Sample, Tanggal Pembuatan | Same columns. A click on a row opens the **client page** | Owner, Nov 5 |
| Lithology column "Interval" for the name; "Description" holds Coal, Parting or No Litology | Columns **Name** and **Kind** | The column is a kind, not a description (spec 15, item 7) |
| Seam page title "Seam Classification" | Title **Seam**, as the sidebar item | One name per module |
| No contacts anywhere | Contacts on the client page | Clarity's accounts hold client contacts; the job order and CoA print one as "Attention" (spec 6, S-03) |
| No import | **Import** on Drill hole, Lithology and Seam | The lab sends 100 drill holes, 62 seams and 9 lithologies as files (R-08); the import wizard (S-16) is designed with the App group |

## 3 · One pattern for the four lists

```
Drill hole                                          [Import] [+ Add drill hole]
[Search code or description] [Company ▾] [All 100] [Missing CoA 12] [Archived 3]
┌ Table card ───────────────────────────────────────────────────────────────┐
│ Code ↕       Description ↕  Total sample ↕  Company ↕     CoA ↕          ⋯ │
│ DH-BNM-021   Batch 5        19              PT Bara Nus…  ✓ CoA-021.pdf  ⋯ │
│ …                                                                          │
│ Rows per page 25 ▾      Showing 1–25 of 100            ‹ 1 2 3 4 ›         │
└───────────────────────────────────────────────────────────────────────────┘
```

| Part | Rule |
| --- | --- |
| Header | Title; **Add …** (primary); **Import** (secondary, not on Clients). Both only for edit roles |
| Toolbar | Search; Company select (default All companies; not on Clients); filter chips with counts; Reset appears when anything is set |
| Table | Table card padded 16; sortable headers; 25 rows per page |
| Row actions | **Edit** link, then a row menu (⋯) with **Archive** (or **Restore** on archived rows) and **Delete**. Delete shows only when nothing uses the record: no samples, no job orders, no CoA |
| Archive | Confirm dialog (sm): "Archive DH-BNM-021? It stays on its samples and reports, but you can no longer pick it." The **Archived** chip lists archived rows |
| Add and edit | **Centered dialog** (lg 792 for the client form, md 560 for the others) on desktop and tablet; full-screen form on the phone with a sticky Save bar |
| Errors | Inline on the field: "DH-BNM-021 already exists for PT Bara Nusantara Mandiri." |
| Phone | Cards instead of rows; Search plus a **Filters** button (bottom sheet with Company and the chips) |
| Empty | Empty state Size=Page with Add and Import: "No drill holes yet" |
| Read-only roles | No Add, Import, Edit, row menu or CoA buttons |

## 4 · Clients (module 09)

### 4.1 Clients list (as SIM Lab)

Columns: **Client** (logo and name), **Code**, **Address**, **Status** (Active, Inactive), **Total sample**, **Created**, then Edit and the row menu. Toolbar: Search and the Status chips (All, Active, Inactive, Archived). **Add client** opens the client form. A click anywhere on the row (outside Edit and the menu) opens the client page.

### 4.2 Client page `/clients/:id`

Breadcrumb **Clients > PT Bara Nusantara Mandiri**; Clients is active in the sidebar.

Layout of Revision 3 (the owner's edit of Nov 5, section 15):

```
Clients > PT Bara Nusantara Mandiri
[logo] PT Bara Nusantara Mandiri  [BNM] [Active]                          [Edit]
┌ Master data ─────────────────────────────────────────────────────────────────┐
│ ┌ Drill holes       ┐ ┌ Lithologies       ┐ ┌ Seams             ┐            │
│ │ 32      View list →│ │ 9       View list →│ │ 21      View list →│            │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────┘
┌ Properties ──────────────┐ ┌ Contacts                         [+ Add contact] ┐
│ Code             BNM     │ │ Budi Santoso [Default]  Site Geologist  budi@…  ⋯ │
│ Address          Samarinda…│ │ Rina Ayu Lestari       Purchasing      rina@…  ⋯ │
│ Billing address  Jl. …,  │ │ …                                                 │
│                  Jakarta │ │                                                   │
│ Status … Total sample    │ │                                                   │
└──────────────────────────┘ └───────────────────────────────────────────────────┘
          (both cards reach the bottom of the page)
```

| Card | Content |
| --- | --- |
| Header | Logo, name, code tag, status badge; **Edit** (edit roles) opens the client form |
| Properties | Code, Address, Billing address, Status, Created; **Job orders** (count, link to the job order list filtered by the client); **Total sample** |
| Contacts | Name, Position, Email, Phone, a **Default** tag on the default contact. **Add contact** in the card head; row menu **Edit**, **Make default**, **Archive**. The default contact is pre-filled as Attention on a new job order. The job order form's contact dropdown adds and edits the same records |
| Master data | Drill holes, Lithologies and Seams of this client, each a count with a link to its list filtered by the client |

Desktop (Revision 3): Master data across the full width under the header; below it Properties on the left (378) and Contacts on the right, both filling the remaining height. Tablet and phone: stacked; on the phone the contacts are cards with call and email icon buttons. (Before Revision 3: Properties on the left at 360, Contacts and Master data on the right.)

### 4.3 Forms

- **Client form** (centered dialog, as the owner's "Add client modal ref"): a round 100 px logo slot at the top (Drop or click to add logo; once uploaded it shows the logo with its file name and Remove), then Name, Code with Status, Address, and Billing address with the "Same as address" checkbox between the label and the field.
- **Contact form** (centered dialog md): Name, Position, Email, Phone, Default contact (switch).

## 5 · Drill hole (module 10)

**List** columns as SIM Lab: Code, Description, Total sample, Company, CoA, then Edit and the row menu. Chips: All, Missing CoA, Archived. The CoA cell shows the CoA uploaded tag and the file name, or the CoA missing tag with **Upload CoA** (sm) for `coa.upload` roles. The row menu adds **CoA history**.

**Form:** Code (unique per company), Description (free text; SIM Lab uses it for a batch label such as "Batch 5"), Company.

**Upload CoA** (dialog md on desktop and tablet, bottom sheet on the phone): Drop zone (PDF, up to 10 MB), the chosen file as a row with name and size, **Upload**. When a CoA exists the dialog is **Replace CoA** and says the current file moves to the history.

**CoA history** (centered dialog 666, as the owner's "CoA history ref"): the drill hole code under the title; every file, newest first, as a row with the file name and size, the **Current** tag (newest only), uploaded by and date, and Download. Files are never deleted (D-30).

## 6 · Lithology (module 11)

**List** columns: Name, Kind, Total sample, Company. Kind is a tag: **Coal**, **Parting**, **No lithology**. Chips: All, Coal, Parting, No lithology, Archived.

**Form:** Name (unique per company), Kind (radio), Company.

## 7 · Seam (module 12)

**List** columns: Order, Code, Description, Company, Total sample. Default sort by Order, because seams are stratigraphic (S-06). Chips: All, Archived.

**Form:** Code (unique per company), Description, Company, Order (a number, optional; drag to reorder is not in v1).

## 8 · Frames

Names by `../Design System/Frame_Naming.md`. Canvas row **K  Master data** below row J. Personas: Rina Kartika (CSO) on Clients; Maya Lestari (Lab admin) on Drill hole, Lithology and Seam; Hendra Wijaya (Supervisor) on the read-only frame.

| Module | SS | Screen | VV | Variant | Sizes |
| --- | --- | --- | --- | --- | --- |
| 09 Clients | 01 | Clients_list | 01 | Default | D, T, P |
| | 01 | Clients_list | 02 | Empty | D |
| | 02 | Client_detail | 01 | Default | D, T, P |
| | 02 | Client_detail | 02 | Contact_form | D |
| | 03 | Client_form | 01 | New_client | D, P |
| | 03 | Client_form | 02 | Archive_confirm | D |
| 10 Drill_hole | 01 | Drill_hole_list | 01 | Default | D, T, P |
| | 01 | Drill_hole_list | 02 | Missing_CoA | D |
| | 01 | Drill_hole_list | 03 | Read_only | D |
| | 02 | Drill_hole_form | 01 | New_drill_hole | D, P |
| | 03 | CoA_upload | 01 | Upload | D, P |
| | 03 | CoA_upload | 02 | History | D |
| 11 Lithology | 01 | Lithology_list | 01 | Default | D, T, P |
| | 02 | Lithology_form | 01 | Edit | D |
| 12 Seam | 01 | Seam_list | 01 | Default | D, T, P |
| | 02 | Seam_form | 01 | New_seam | D |

Total **31 frames**: 18 desktop, 5 tablet, 8 phone. Example: `Desktop-09-Clients-02-Client_detail-01-Default`.

## 9 · Demo data

Taken from the frames already drawn, so every screen agrees:

- **Clients:** PT Bara Nusantara Mandiri (BNM), PT Kaltara Energi Prima (KEP), CV Sumber Batu Hitam (SBH), PT Mahakam Coal Resources (MCR), PT Bukit Asam (PTBA, inactive). Contacts reuse the job order contact list.
- **Drill holes:** DH-BNM-021, DH-BNM-022, DH-BNM-031, DH-MCR-011 to DH-MCR-013 and more; descriptions such as "Batch 5".
- **Lithologies:** Coal (Coal); Silicified Coal, Coaly Claystone, Carbonaceous Claystone, Claystone, Siltstone, Sandstone (Parting); Losscoal, Coreloss (No lithology). These are SIM Lab's nine.
- **Seams:** CO, B1U3, EN2, EN1, A2L, A2U2, SM2, SM1, X10 (from SIM Lab's list of 62).

The Dashboard's drill-hole list uses codes like DH-0412. It changes to these codes in the same build.

## 10 · Design rules that apply

- Card anatomy: cards padded 16; Card head 32 px; Table cards padded 16.
- No values joined with " · "; no count subtitles under titles.
- Library components as they are: Search, Select, Filter chip, Tag, Status badge, Dialog, Bottom sheet, Drop zone, Key-value row, Breadcrumb, Card drill hole (phone), Pager, Empty state, Sticky action bar, Radio, Switch, Text field.
- Library additions, only these: **Tag** types Coal, Parting, No lithology, Current; a **Contact row** (star, name, position, email, phone, menu); a rows-per-page select in the **Pager** if it has none.

## 11 · Decisions (Nov 5, 2026)

| # | Point | Decision | Source |
| --- | --- | --- | --- |
| 1 | Clients | SIM Lab's list, and a click on a row opens the client page `/clients/:id` | Owner |
| 2 | Delete | Archive for masters; Delete only when unused | D-30, S-03, S-04 |
| 3 | Company scoping | Masters are per company; a Company select on Drill hole, Lithology and Seam | Data model; SIM Lab has a Company column |
| 4 | Import | On Drill hole, Lithology and Seam; wizard designed with the App group | R-08, S-16 |
| 5 | Seam order | A number field in v1 | S-06 |
| 6 | Lithology kinds | Coal, Parting, No lithology | SIM Lab, corrected spelling |
| 7 | Client logo | Optional upload, shown in the list and on the client page | SIM Lab shows logos |
| 8 | Rows per page | 25, as SIM Lab | SIM Lab |
| 9 | Billing address | Added; shipping address not needed (the lab sends reports, not goods) | Clarity accounts (spec 6) |
| 10 | Contacts | On the client page; the default one pre-fills Attention on new job orders | Clarity, S-03 |

## 12 · Build steps (after go)

1. Library additions in section 10.
2. `library/screens/rowK.js` builds the 30 frames under their final names, with the role sidebar.
3. Dashboard demo codes changed to the DH-BNM style in `rowI.js`.
4. Chain: build rows C to K, `rev8`, `naming`, `cards`, `fit`, then `retro.js`.
5. Deploy (dirty check, backup, swap), commit. No export unless asked.
6. Docs: build status here; spec S-03 gets the client page and contacts; `Frame_Naming.md` gets modules 09 to 12; README.

## 13 · Build status (Nov 5, 2026)

All 31 frames are built on row **K  Master data** with `library/screens/rowK.js`, under their final names, with the role sidebar of each persona. Added to the plan during the build: Client_detail 03 With_logo and Client_form 03 Logo_uploaded (desktop), the two scenarios of a client logo.

**Clients and logos.** Seven demo clients: PT Bukit Asam Tbk (PTBA, SIM Lab's client), PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, PT Mahakam Coal Resources, CV Sumber Batu Hitam, PT Borneo Karya Energi and PT Tambang Sentosa Abadi (inactive). Only PT Bukit Asam has a logo: its mark comes from Wikimedia Commons ("(Bukit Asam) Logo CMYK-01.png", cropped to the symbol and placed as an image fill). The other clients are demo names without a public logo, so they show the library **Avatar** with their initials (BN, KE, MC, SB, BK, TS); the client page uses a 56 px initials tile. The client form shows both: the drop zone (no logo) and the uploaded file row with Remove (Logo_uploaded).

Deviations:

- **Default contact** is a "Default" tag, because the icon library has no star.
- **Kind** (Coal, Parting, No lithology) and **Active / Inactive** are small pills built from frames, not Tag or Status badge variants; the library does not have these yet.
- **Rows per page** is drawn as a small select next to the pager (a frame, not a library component).
- **Phone** lists show 8 to 12 cards and the mobile pager ("1 / 4"); the client form and the drill hole form are full-screen forms with the sticky bar.
- The contact emails use the client's domain (first name only), and every client shows the same four demo contacts.

## 14 · Revision 2 (Nov 5, 2026, owner feedback)

- Add client, Edit client, Add drill hole, Edit lithology, Add seam, Edit contact and CoA history are **centered dialogs**; the Side sheet component is deleted (see `../Design System/Component_Library_Plan.md`, last section).
- The client form and the CoA history follow the owner's reference frames ("Add client modal ref", "CoA history ref"); the Properties card follows "Properties card ref": all rows Inline, also on the phone.
- The Key text of the Key-value row is Body small/Regular now.
- Rebuilt: the 7 modal frames (Contact_form, New_client, Logo_uploaded, New_drill_hole, History, Lithology Edit, New_seam) and the Properties card of Client_detail on desktop, tablet and phone.

## 15 · Revision 3 (Nov 5, 2026, owner edits in the file, saved 14:26)

The owner edited the desktop frames of row K in FigCraft after Revision 2. Found by comparing the saved file with the last generated file, layer by layer, and checked against renders. **Not yet in `library/screens/rowK.js`**: a rebuild of row K would undo them until the generator takes them over.

| # | Where | Before (generated) | Now (owner) |
| --- | --- | --- | --- |
| M-1 | Client page, layout (Default, Contact_form, With_logo) | Properties (360) left; Contacts and Master data stacked on the right; page height hug | **Master data card first**, full width under the header. Below it a **Columns** row that fills the page height: **Properties card fixed 378**, **Contacts card fills**; both cards fill the height (Main 946 instead of 720). The old right-column wrapper is gone; Contacts sits directly in Columns |
| M-2 | Master data card, stat tiles | Vertical tile: label, count, "View list →" under the count | Horizontal tile (Surface/muted, radius 12, padding 12 / 14, items at the bottom): a vertical **Stat** (label, count) that fills, and the **Link** "View list →" at the right. Three tiles fill the width (357 each) |
| M-3 | Properties card, Billing address | Value on one line, clipped at the card edge ("…Jakarta Selata") | The Value fills the row and wraps (auto height): "Jl. Jenderal Sudirman 45, Jakarta / Selatan". The row grows to 40 |
| M-4 | **Key-value row** component, Inline | Items centred vertically | Items **top-aligned** (cross align min), so the Key stays on the first line of a wrapped value. Reaches every Inline Key-value row: job order Overview (desktop, tablet, dark preview), Mark sent and Sent, the client pages (all sizes) |
| M-5 | PT Bukit Asam logo | Image fill (PNG crop from Wikimedia Commons) in a "Logo" frame | A vector component **ptba-logo** (40 × 40, two vectors, brand yellow #FDB610 and red #E82328) on the Library page. Every use is an **Avatar** frame: round (radius 999), `Surface/card` fill, `Surface/border` stroke (1 px), padding 4, with the ptba-logo instance filling it (the mark sits 5 px from the edge). Sizes: 40 in the list rows (Clients list and the list behind New_client, Archive_confirm, Logo_uploaded), 64 in the client page header (With_logo), 100 in the Edit client dialog (Logo_uploaded) |
| M-6 | Client form, logo slot (New_client) | Drop zone with its Title "Drop or click to add logo" and the hidden hint | Drop zone 100 × 100: **Title hidden**; the **Hint** carries "Drop or click to add logo" (Caption/Regular, centred, fixed 84 wide, two lines) under the upload icon |
| M-7 | Client form, uploaded logo (Logo_uploaded) | **Remove** as a Ghost button sm | **Remove** as a **Secondary** button sm (outlined) |
| M-8 | CoA history (History) | File name, Current pill and Metadata hugging, so the columns did not line up | **File name fixed 200**, **Metadata fixed 160**, then the **Current** pill; the three file rows line up in columns |

Unchanged: tablet and phone client pages (they keep the Revision 2 layout, only M-4 reaches them through the component), the drill hole, lithology and seam frames, the other dialogs.

The owner's reference frames ("Add client modal ref", "CoA history ref", "Properties card ref") were deleted from the canvas: their content is built.

### 15.1 Points found in the check

1. **Header logo sizes differ.** A client with a logo shows a 64 px round Avatar in the header (With_logo), a client without one a 56 px rounded-square initials tile (Default). Proposed: one shape and size for both (64 round, with the initials inside when there is no logo), as in the list rows, where both are 40 round.
2. **Tablet and phone client pages** still put Master data last. Proposed: Master data first on every size; on tablet and phone the three tiles stack or scroll, the Properties and Contacts cards follow.
3. **Same as address** is checked in Logo_uploaded while the billing address differs from the address. Proposed: unchecked when the two differ (generator data, not an owner edit).

### 15.2 Next

Take M-1 to M-8 into `rowK.js` (client page layout and tile anatomy, the logo as the ptba-logo instance in the Avatar frame instead of an image fill, the drop zone and Remove button, the history columns), apply 15.1, carry M-1 and M-2 to tablet and phone, rebuild row K and swap it in.
