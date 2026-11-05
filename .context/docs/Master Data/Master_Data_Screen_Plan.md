# Master Data — Design Plan

Nov 5, 2026 · plan, waiting for go

Written for: the owner and anyone building the master data screens.

The four MASTER DATA sidebar items: **Clients, Drill hole, Lithology, Seam** (spec S-03 to S-06, F-MD-01 to 04). They hold the lists that every job order, sample and report picks from. SIM Lab had all four; this plan keeps its columns and adds what v1 needs: client contacts, CoA upload with history on the drill hole, and archive instead of delete.

## 1 · Who sees what

From `../Navigation/Navigation_Screen_Plan.md` (spec 8.3). "Edit" means the page shows the Add button and the row actions; "read" means it shows neither.

| Page | Edit | Read |
| --- | --- | --- |
| Clients | Superadmin, CSO, Manager (`company.manage`) | Lab admin |
| Drill hole, Lithology, Seam | Superadmin, Lab admin (`master.write`; CoA upload is `coa.upload`) | Supervisor, Manager |

The CSO, Preparation and Analyst pick drill holes, lithologies and seams inside forms, but do not get these pages.

## 2 · One pattern for all four

All four pages share one layout, so they look and behave the same.

```
Drill hole                                         [Import] [+ Add drill hole]
[Search code or description] [Company ▾] [All 100 | Missing CoA 12 | Archived 3]
┌ Table card ──────────────────────────────────────────────────────────────┐
│ Code         Description   Company        Samples   CoA            ⋯     │
│ DH-BNM-021   Batch 5       PT Bara Nus…   19        ✓ CoA-021.pdf  ⋯     │
│ …10 rows                                                                  │
│ Showing 1–10 of 100                                   ‹ 1 2 3 … 10 ›      │
└──────────────────────────────────────────────────────────────────────────┘
```

| Part | Rule |
| --- | --- |
| Header | Title; primary button **Add …** (edit roles only); **Import** (secondary) on Drill hole, Lithology and Seam, opening the import wizard (S-16, designed with the App group). No count subtitle |
| Toolbar | Search; **Company** select (masters are per company, D-01); filter chips with counts. "Archived" shows archived rows only |
| Table | Table card padded 16, 10 rows, pager. The Samples column is a count and links to the samples of that record (Search, later) |
| Row menu | Edit; Archive (or Restore when archived); **Delete** only when nothing uses the record (no samples, no job orders). Otherwise Delete is left out, and Archive is the way to retire it |
| Add and edit | **Side sheet** (480) on desktop and tablet; **full-screen form** on the phone with a sticky Save bar |
| Archive | Confirm dialog (sm). An archived record stays on its old samples and reports but no longer appears in pickers |
| Phone | Cards instead of rows; toolbar is Search plus a **Filters** button (bottom sheet) |
| Empty | Empty state Size=Page: "No drill holes yet", with Add and Import |
| Read-only | Same page without Add, Import, the row menu or the CoA actions |

Uniqueness errors show inline on the field: "DH-BNM-021 already exists for PT Bara Nusantara Mandiri."

## 3 · Clients (module 09)

Clients are the companies the lab works for. A client has contacts, who appear as "Attention" on the job order and the CoA.

**List** columns: Client (logo and name), Code, Address, Contacts (count), Samples, Status (Active or Inactive), Created. Chips: All, Active, Inactive, Archived.

**Client page** (`/clients/:id`, new in this plan; SIM Lab edited everything in one form). Breadcrumb Clients > client name.

| Card | Content |
| --- | --- |
| Header | Logo, name, code tag, status badge; **Edit** (edit roles) |
| Properties | Code, Address, Billing address, Created, Job orders (count, links to the job order list filtered by this client), Samples |
| Contacts | Table: Name, Position, Email, Phone, Default (a star on the default contact). **Add contact**; row menu Edit, Make default, Archive. The default contact is pre-filled on new job orders |
| Master data | Counts of Drill holes, Lithologies and Seams for this client, each linking to its list filtered by the client |

**Form** (side sheet): Name, Code (short, unique, upper case), Address, Billing address, Status, Logo upload (optional). **Contact form** (side sheet 480): Name, Position, Email, Phone, Default.

## 4 · Drill hole (module 10)

**List** columns: Code, Description, Company, Samples, CoA, row menu. Chips: All, Missing CoA, Archived. The CoA cell shows the CoA uploaded tag and the file name, or the CoA missing tag with an **Upload CoA** button (sm) for `coa.upload` roles.

**Form:** Code (unique per company), Description, Company.

**Upload CoA** (dialog md on desktop, bottom sheet on phone): Drop zone (PDF, up to 10 MB), the chosen file as a file row with size, and **Upload**. When a CoA already exists the dialog is **Replace CoA** and says the old file is kept in the history.

**CoA history** (side sheet 480, from the row menu): every uploaded file, newest first: file name, size, uploaded by, date, Current tag on the newest; each row has Download. Nothing is deleted (D-30).

## 5 · Lithology (module 11)

**List** columns: Name, Kind, Company, Samples. Kind is a tag: Coal, Parting, No lithology. Chips: All, Coal, Parting, No lithology, Archived.

**Form:** Name (unique per company), Kind (radio: Coal, Parting, No lithology), Company.

## 6 · Seam (module 12)

**List** columns: Order, Code, Description, Company, Samples. Seams are stratigraphic, so the default sort is Order (spec S-06, Proposed). Chips: All, Archived.

**Form:** Code (unique per company), Description, Company, Order (number, optional).

## 7 · Frames

Names by `../Design System/Frame_Naming.md`. Canvas row **K  Master data** below row J. Personas: Rina Kartika (CSO) on Clients, Maya Lestari (Lab admin) on the other three; Hendra Wijaya (Supervisor) on the read-only frame.

| Module | SS | Screen | VV | Variant | Sizes |
| --- | --- | --- | --- | --- | --- |
| 09 Clients | 01 | Clients_list | 01 | Default | D, T, P |
| | 01 | Clients_list | 02 | Empty | D |
| | 02 | Client_detail | 01 | Default | D, T, P |
| | 02 | Client_detail | 02 | Contact_edit | D |
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

Total **30 frames** (16 desktop, 5 tablet, 9 phone, counting Upload D and P), for example `Desktop-10-Drill_hole-01-Drill_hole_list-02-Missing_CoA`.

## 8 · Demo data

From the frames already drawn, so the screens agree with each other:

- **Clients:** PT Bara Nusantara Mandiri (BNM), PT Kaltara Energi Prima (KEP), CV Sumber Batu Hitam (SBH), PT Mahakam Coal Resources (MCR), PT Bukit Asam (PTBA, inactive in the demo). Contacts reuse the job order contact list (name, position, email, phone).
- **Drill holes:** DH-BNM-021, DH-BNM-022, DH-BNM-031, DH-MCR-011 to 013, and so on; descriptions like "Batch 5" as in SIM Lab.
- **Lithologies:** Coal, Silicified Coal, Coaly Claystone, Carbonaceous Claystone, Claystone, Siltstone, Sandstone (Parting); Losscoal, Coreloss (No lithology).
- **Seams:** CO, A2U2, A2L, B1U3, EN2, SM1, X10.

The Dashboard's drill-hole list uses codes like DH-0412. It is changed to these codes in the same build, so the two screens agree.

## 9 · Design rules that apply

- Card anatomy: cards padded 16; Card head 32 px; Table cards padded 16.
- No values joined with " · "; no count subtitles under titles.
- Library components as they are: Page header parts, Search, Select, Filter chip, Table rows built like the batch list, Tag (CoA uploaded, CoA missing; new types Coal, Parting, No lithology if needed), Status badge, Side sheet, Dialog, Bottom sheet, Drop zone, Key-value row, Card drill hole (phone), Pager, Empty state, Sticky action bar.
- New components only if needed: a **Contact row** (name, position, email, phone, default star) and the **Tag** kinds for lithology.

## 10 · Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Clients: a client page, or everything in the edit form as in SIM Lab? | Client page, because contacts are a list and the job orders link from it |
| 2 | Delete or archive? | Delete only when unused; otherwise Archive. Archived records stay on old samples and reports |
| 3 | Is the master data per company? | Yes, as in SIM Lab and the data model (unique per company); the Company select is on every list |
| 4 | Import on the lists | Yes for Drill hole, Lithology and Seam (100 drill holes and 62 seams come as files, R-08). The wizard itself is designed with the App group |
| 5 | Seam order: a number field or drag to reorder? | A number field in v1 |
| 6 | Lithology kind labels | Coal, Parting, No lithology (SIM Lab wrote "No Litology") |
| 7 | Client logo | Optional upload, shown in the list and on the client page |

## 11 · Build steps (after go)

1. Library additions if needed: Contact row, Tag kinds for lithology.
2. `library/screens/rowK.js` builds the 30 frames with the role sidebar (shell `role`).
3. Dashboard demo codes changed to the DH-BNM style in `rowI.js`.
4. `naming.js` is not needed (frames get their final names); `cards.js` and `fit.js` run as usual.
5. Deploy (dirty check, backup, swap), commit. No export unless asked.
6. Docs: build status here; spec S-03 gets the client page and contacts; `Frame_Naming.md` gets modules 09 to 12; README.
