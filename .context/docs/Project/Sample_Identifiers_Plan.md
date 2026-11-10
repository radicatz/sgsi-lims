# Sample identifiers: implementation and mismatch register

Written Nov 10, 2026. **Status: decided. The details are closed with defaults; the frames, prototype and demo video are not rebuilt and are flagged as mismatched.** The format and rules live in `Coal_LIMS_Development_Spec.md` section 6.1 (D-51); the build is in `V1_Build_Plan.md` (schema change C-18, phases 1 to 3). This file is the register of what still shows the old format.

## 1. The change

| | Before | After |
| --- | --- | --- |
| Identifier the lab gives | Lab code `B{batch}-NN`, e.g. `B0410-07` | **Sample ID** `SG.YYMMDD.CCC.BB.NNN`, e.g. `SG.261022.001.RI.007`, and **sample code** `CCC.BB.NNN.Lotxx`, e.g. `001.RI.007.Lot01` |
| What the CSO types on the job order | "Sample ID", e.g. `BNM-3507` | **Client reference**: the client's own name for the sample |
| When the lab's identifier appears | At reception | At reception (unchanged) |
| Barcode on the label | Lab code | Sample ID |

`SG` is Sentra Geo, `YYMMDD` the date received, `CCC` the client's company code, `BB` the branch office (`RI` Rapak Indah), `NNN` the running number of that company's samples that day, `Lotxx` the lot.

## 2. Decisions (owner, Nov 10, 2026: the defaults)

The lab has not confirmed these; the full wording is in spec 6.1.

| # | Question | Decision |
| --- | --- | --- |
| 1 | Date | Date received (Confirm reception) |
| 2 | Running number | Per company and per date, from `001` each day; refused at `999`, width set by an Admin |
| 3 | Branch code | `RI` only; list in Admin > Laboratory |
| 4 | Company code | Next free 3-digit number when the client is created; editable by a Superadmin until the first received sample, then locked |
| 5 | Lot | `Lot01`, settable at reception |
| 6 | Client reference on reports | Not printed on the RoA or CoA |

## 3. Where it is implemented

| Where | What | Status |
| --- | --- | --- |
| Spec | Section 6.1 (format, rules, decisions), 6.2 (mismatches), D-51, R-07 closed, glossary, features, label, import, reception step, screen columns, search, validation, database table | Done Nov 10 |
| Build plan | C-18 (new migration at the start of phase 1), phase 1 (company code, branch offices), phase 2 (client references on the job order), phase 3 (IDs generated at Confirm reception, gate), request item 6, open point 5 closed | Done Nov 10 |
| Screen plans | The rule text in the Job Order, Batch, Search, Reports, Admin and Dashboard plans | Done Nov 10; the demo values in them are not changed |
| Database and app | C-18 migration, `next_sample_no()`, company code field, branch offices setting, the search placeholder text | **Not built**; planned in phases 1 to 3 |

## 4. Mismatch register (flagged)

These show the old format and **disagree with the spec**. The owner chose not to rebuild them. **The spec wins.** Each plan or document in the second table carries a flag note at the top.

| Artifact | Old-format occurrences | What it shows |
| --- | --- | --- |
| Frame builders, `design/figcraft/library/screens/` | `rowM.js` 58, `rowC.js` 53, `rowF.js` 33, `rowK.js` 23, `rowO.js` 12, `rowL.js` 12, `rowI.js` 11, `rowA.js` 1, `rowD.js` 1, `rowE.js` 1; also `library/data.js` 10, `screens/parts.js` 7, `cards2.js` 4, `forms.js` 1 | The built frames in the FigCraft file: "Sample ID" = client's name, lab code `B0410-07`, one ID column, the old label |
| Prototype v2 source, `prototype/src/` | `data.js` 57, `modules/search.js` 10, `modules/joborders.js` 6, `modules/batches.js` 6, `modules/reports.js` 1, `modules/admin.js` 1 | Private preview and shared link: the same, plus search and the Laboratory settings page |
| Demo video, `demo-video/chapters/` | `05-penerimaan-sampel.js` 24, `03-daftar-sampel.js` 6, `06-preparasi.js` 5, `13-pencarian.js` 2, `04-batch.js` 1 | The recorded clips |
| Database, `supabase/migrations/` | `20261110000300_work.sql` (`sample_ref`, `lab_code`), `20261110000500_reference_data.sql` (numbering `lab_code`) | Applied in phase 0; changed by C-18, not edited in place |
| Web app | `apps/web/src/app/Shell.tsx` (search placeholder), `apps/web/src/pages/master/Lists.tsx` (1) | Text only; changed in phase 1 with C-18 |

Left as history, not flagged: `library/screens/rowC.before-nov3.js`, `tools/newframes.js`, `tools/revc.js`, the archived plans, and `prototype/archive/`.

| Document | Flag |
| --- | --- |
| Job Order, Batch, Search, Reports, Admin and Dashboard screen plans | Note at the top |
| Prototype plan, the Job Order, Batch, Search, Admin and Dashboard prototype plans, Demo Video Plan, Prototype Demo Guide | Note at the top |

## 5. How to work with a mismatched artifact

1. **Spec first.** Where a frame, the prototype or a demo value disagrees with spec 6.1, follow the spec.
2. **Reading an old ID column.** Before reception it is the **Client reference**. After reception it is the **sample code**, with the **Sample ID** as a second line.
3. **New work uses the new terms**: Sample ID, sample code, client reference. Never "lab code", and never an old demo value such as `BNM-3507` as a Sample ID.
4. **If an artifact is rebuilt later**, follow section 6 and remove its flag.

## 6. If the frames or prototype are rebuilt later

Reference only; nothing here is planned.

Design points:

| # | Point | Proposal |
| --- | --- | --- |
| 1 | Width | The Sample ID is 20 characters against 8 to 9 today. Tables show the **sample code** in the ID column with the Sample ID as a second line in the secondary style; desktop column 130 → 180 |
| 2 | Before reception | Job order Samples tab: **Client reference** (typed) first; **Sample ID** column reads "Given at reception" until the sample is received |
| 3 | Label (50 × 30 mm) | Sample code large, Sample ID small, Code 128 of the Sample ID, job order no., date received |
| 4 | Reports | Per-sample blocks show Sample ID and sample code; no client reference (decision 6) |
| 5 | Search and scan | Matches Sample ID, sample code and client reference; a scanned label opens the sample by Sample ID; placeholder "Search by sample ID, batch, job order or drill hole…" |
| 6 | Configuration | Admin > Laboratory: the two patterns and a Branch offices list; Clients get a Company code field |

Demo values (company codes in prototype client order: `BNM` 001, `KEP` 002, `SBH` 003, `MCR` 004, `PTBA` 005, `BLC` 006; every demo sample received at `RI`; lot `Lot01`):

| Old demo value | New Sample ID | New sample code |
| --- | --- | --- |
| `BNM-3507` (JO-2026-0131, received 22 Oct 2026, old lab code `B0410-07`) | `SG.261022.001.RI.007` | `001.RI.007.Lot01` |
| `KEP-3301` to `KEP-3308` (B-2026-0422, in Reception) | `SG.{date received}.002.RI.001` to `.008`, given when each arrives | `002.RI.001.Lot01` to `002.RI.008.Lot01` |

The old client-style values stay as the samples' client references.
