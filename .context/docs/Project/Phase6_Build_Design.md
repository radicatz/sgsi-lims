# Phase 6 · Hardening and go-live · Build design

Nov 27, 2026 · **Plan, waiting for go** · phase 6 of `V1_Build_Plan.md` section 2

Written for: the product owner (decisions in section 7, lab and IT requests in section 8) and the developers who build it.

## 1 · What phase 6 builds, and when it is done

The build plan's row: **CSV and XLSX export on every list, the RoA as XLSX and CSV per batch and per drill hole (spec F-RPT-01; owner, Nov 25, 2026), performance (400 samples × 60 parameters), backups with a restore test, production deployment (R-11), user accounts (R-09), UAT on a real phone and tablet, handover.**

**Gate:** the lab enters new job orders in the system instead of Excel.

Phase 6 is the only phase whose gate depends mostly on people outside the build. Slices A and B are building work and can start on go. Slice C needs answers on hosting and mail (section 8, items 1 and 2). Slice D needs the lab.

| Slice | What | Who it waits on | Size |
| --- | --- | --- | --- |
| **A · Exports** | Export on every list, the RoA as XLSX and CSV, XLSX for the two existing CSV exports | Nobody (frames first) | M |
| **B · Performance and accounts** | Load test at full size, server paging where missing, the audit sample index, 7-day invite links, the checks carried from phase 0 | The owner runs two migrations | M |
| **C · Deployment and backups** | Containers, staging link, production, mail sender, nightly backups and a restore test, monitoring, runbook | Hosting and mail answers (section 8) | M |
| **D · Go-live with the lab** | Real master lists and staff accounts, demo data retired, Phase 4 gate G1 to G9, Privacy wording, UAT on real devices, training and handover | The lab | depends on the lab |

## 2 · Carried into this phase

These were left open by earlier phases and are part of phase 6's work. Each one has a row in the slices below.

| Item | From | Source |
| --- | --- | --- |
| Staging deployment, mail delivery (SMTP), per-table RLS tests, end-to-end tests in CI | Phase 0, still open after phase 1 | `V1_Build_Plan.md` phase 0 "Left for later", phase 1 status "Carried from phase 0" |
| Invite links that last 7 days | Phase 5 slice D | `Phase5_Build_Design.md` s14: Supabase links expire after the Email OTP expiration (at most 24 hours); a 7-day invite needs app-made tokens (`password_tokens`, App plan data model) |
| A sample's audit log takes about 2.2 s | Phase 5 feedback F9 | `Phase5_Build_Design.md` s15: the server scans about 15,600 rows for the JSON filter on `sample_id` |
| XLSX for the advanced search export | Phase 5 decision 1 | `Phase5_Build_Design.md` section 8: "CSV now, XLSX in phase 6" |
| Phase 4 gate G1 to G9 | Phase 4 | `../Reports/Reports_Build_Design.md` s18 |
| Privacy dialog wording not confirmed | Phase 5 slice D, decision A-1 | `Phase5_Build_Design.md` s14; the lab confirms before go-live |
| Real master lists (R-08), method list (R-05, R-06), staff list (R-09) | Phases 1 and 6 | `V1_Build_Plan.md` section 4, items 2, 3 and 11 |

**Not in phase 6** (kept out of v1 by earlier decisions): the import wizard (on hold, owner Nov 16, 2026), the analyst worksheet and RoA approval in the app (v1 scope, Oct 29, 2026), email notifications, shipments, a client portal (`V1_Build_Plan.md` section 1).

## 3 · Slice A · Exports

### 3.1 Export on every list

Spec 16 (NFR Export): *Every list exports to CSV or XLSX.* Spec S-07 (Batch list) toolbar: *Export list (CSV, XLSX)*.

| List | Page | Rows exported | Permission | Today |
| --- | --- | --- | --- | --- |
| Job orders | `/orders` | The current tab, filters and sort, every page | `order.read` | None |
| Batches | `/batches` | The same | `batch.read` | None |
| Reports, CoA tab | `/reports` | The same | `coa.download` | Download PDFs (zip) only |
| Reports, RoA tab | `/reports` | The same | `roa.download` | Download PDFs (zip) only |
| Clients | `/clients` | Clients; a second sheet in XLSX lists their contacts | `company.read` | None |
| Drill hole, Lithology, Seam | `/master/...` | The list as filtered | `master.read` | None |
| Users | `/users` | Name, email, roles, status, last sign-in | `user.manage` | None |
| Audit log | `/audit` | Filtered rows, every page | `audit.read` | **CSV built**; adds XLSX |
| Advanced search | `/search/advanced` | Every matching row | `search.use`; values with `result.read` | **CSV built**; adds XLSX |

**Rules for every export** (from the two built exports, so they all behave the same):
- **One API endpoint per list**, `GET <list>/export?format=csv|xlsx&<the list's filters>`. It reuses the list's own query without the page limit, so the file and the screen can never disagree.
- **Through row-level security**, as the signed-in person. The CSO never gets RoA values (spec B-3, S-29).
- **Every export is written to the audit log** with its filters (Phase 5 decision C-4, `logExport`).
- **CSV:** UTF-8 with BOM, comma separator, CRLF, as the search and audit CSVs (Excel opens them with the right characters).
- **XLSX:** one sheet named after the list, a bold header row, frozen header, column widths set from the content, numbers as numbers and dates as dates in the lab's time zone (spec 15 Time), not text.
- **File name:** `<list>-<yyyy-mm-dd>.<ext>`, for example `job-orders-2026-11-27.xlsx`.
- **No row cap.** The screen shows pages; the file has every row (Search plan open point 6).

**On the screen:** an **Export** button in the page head with a menu of **CSV** and **XLSX**, at all three sizes, where the Audit log has its Export CSV today (`Audit.tsx`). Advanced search and the Audit log get the same menu. A toast says when the file is ready.

**Frames first.** No list frame shows an Export button today (checked against the Job Order, Batch, Reports, Master Data and Admin screen plans; only the Audit log's header and Advanced search have one). Before building, the Export button and its open menu are drawn on one list frame per size (Job orders at 1440, 834 and 390), and the button alone is added to the other list frames. The FigCraft file is not committed.

### 3.2 The RoA as XLSX and CSV

Spec F-RPT-01 (owner, Nov 25, 2026): **XLSX and CSV per batch and per drill hole in phase 6.** Spec S-11: *one row per sample, same columns as the grid; before completion the files are marked DRAFT; after completion they serve the stored snapshot (D-10). The RoA is internal: "Internal — not for distribution" on every page, and roles without `roa.download` cannot open it.*

| | Per batch | Per drill hole |
| --- | --- | --- |
| **Where** | The batch's RoA card and the RoA page (`/reports/roa/:no`): **Download** menu with PDF (built), XLSX, CSV | Dashboard > Quality & reports > Drill holes: a row menu with **Download RoA data** (XLSX, CSV) |
| **Samples** | The batch's received samples | The samples whose drill hole is that code, within the drill hole's company (the same match the Drill holes card uses, `dashboard-quality.ts`), from **completed** batches only (decision P6-3) |
| **Rows** | One per sample | One per sample, in depth order, with its batch number |
| **Columns** | Sample ID, sample code, drill hole, depth from and to, mass as received, then each parameter on each basis in SGSI order AR, ADB, DB, DAF, as the RoA PDF prints them (`packages/shared/src/roa.ts`, Reports s17) | The same, with Batch and RoA number added |
| **Header (XLSX)** | Rows above the table: lab name, Report No., batch, job order, principal, date received, date tested, and "Internal — not for distribution". A batch not yet completed says **DRAFT** | The drill hole, its company, the period covered, and the internal line |
| **CSV** | The table only, with the internal line and DRAFT (when it applies) as the first line | The same |
| **Permission** | `roa.download` | `roa.download` and `dashboard.quality` |
| **Values** | From the same payload as the RoA PDF (`roa-data.ts`), so the three formats always agree | The same builder, per sample |

Both are written to the audit log.

### 3.3 Tests

- **API:** each list's export gives the same rows as the list with the same filters (row count and first row); the CSO's results export has no values; a role without the permission gets 403; XLSX opens and its numbers are numeric cells.
- **RoA:** the XLSX and CSV of a demo batch match its PDF digit for digit on every basis (the unit fixture of Reports s17 runs on all three).
- **Browser:** the Export menu at the three sizes on two lists; the download arrives with the right name.

## 4 · Slice B · Performance and accounts

### 4.1 Load test at full size

Spec 16 (NFR Performance): *a grid with 400 rows and 60 parameters stays responsive; list screens page on the server.*

1. **Seed a large data set** with a script (`pnpm seed:load`), on a separate Supabase branch or project, never on the demo data: one batch of 400 samples with 60 parameters, and a year of work at the volume in decision P6-9.
2. **Measure** the Analysis tab of that batch (first paint, typing in a cell, saving a row), the lists at their largest, the Dashboard, quick and advanced search, a sample's history and its audit log, and the RoA PDF and XLSX of the 400-sample batch.
3. **Targets** (decision P6-9): a list page or search answers in under 1 s at the API; the Analysis tab shows within 2 s and typing never lags; a 400-sample RoA PDF in under 30 s.
4. **Fix what misses the target.** What we already expect:
   - **The Analysis grid renders every cell** (400 × 60 is 24,000 inputs; no row virtualisation today). If it misses the target, rows outside the view are not drawn (TanStack Virtual, as Stack record S-7 planned).
   - **The master lists and Users load the whole list** (no server paging in `master.ts` and `users.ts`). Fine at demo size; with the lab's real drill holes they page on the server like Job orders and Batches (spec 16: "list screens page on the server").
5. Results go into a table in this document (screen, measured, target, fix).

### 4.2 The audit log for one sample

The Audit log filter for a sample reads `after->>'sample_id'` and `before->>'sample_id'` on every row (`audit.ts`). A migration adds expression indexes on those two keys (and on `analysis_id` for result rows), so the filter reads the index instead of scanning. Target: under 0.5 s (now about 2.2 s, `Phase5_Build_Design.md` s15). **The owner runs the migration.**

### 4.3 Invite links that last 7 days

Today invite and reset links come from Supabase Auth and expire after the project's Email OTP expiration, at most 24 hours (Phase 5 s14). The App plan's data model has `password_tokens` (kind invite or reset, expires, used) for this.

- **Migration** (the owner runs it): `password_tokens` (token hash, user, kind, expires at, used at, created by).
- **Invite:** the API makes a token that lasts **7 days**, emails the link `/set-password?token=…&kind=invite` through the lab's mail sender (slice C), and keeps "Resend invite" on the user page. The link works once.
- **Reset:** the same, lasting `reset_link_minutes` from Configuration > Security, which then becomes editable (today it is read-only because Supabase sets it, s14).
- **Setting the password** goes through the API, which checks the token and sets the password with the Supabase admin API. Sign-in itself does not change.
- Until slice C has a mail sender, the link is shown to the Superadmin to pass on, as it is today (Stack record risk table).
- Decision P6-5 keeps the 24-hour Supabase links instead, if 7 days is not needed.

### 4.4 Checks carried from phase 0

- **Row-level security tests per table:** for each table and each role, what can be read and written directly through the database, so RLS is proven as the second line of defence (Stack record S-6, S-17).
- **End-to-end tests in CI:** the Playwright suite on GitHub Actions against the staging project, with the demo password as a repository secret. It runs nightly and on demand, not on every push: the full suite takes 1.5 hours (Phase 5 s16.8).
- **Supabase security and performance advisors** run on staging and production before go-live; every warning is fixed or written down with the reason.
- **Saving on a weak connection** (spec 16 Connectivity: *per-row saves with retry; no data loss on a dropped connection*): a browser test cuts the network during a save on Reception and Analysis and checks that nothing is lost and the retry works.

## 5 · Slice C · Deployment and backups

Stack record S-19: *Docker Compose behind Caddy (TLS): `web` (static files), `api`, `gotenberg`. Supabase beside it, Cloud or self-hosted, per open point 2. Nightly database dump and storage copy, restore tested before go-live.* None of the deployment files exist yet (`infra/` holds only migrations and seed).

### 5.1 Build

- `apps/api/Dockerfile`, `apps/web/Dockerfile` (the Vite build served as static files by Caddy), `infra/compose.yml` (web, api, gotenberg, caddy), `infra/Caddyfile`, an `.env.example` with every setting named and none filled.
- CI builds the images and pushes them to GitHub Container Registry (Stack record S-18).
- `/health` on the API checks the database and Gotenberg (Stack record S-20).

### 5.2 Staging, then production

1. **Staging first**, on the current Supabase project (`sgsi-lims`, Tokyo, free plan) and a small server, so you have a link to click through. This closes the phase 0 item.
2. **Production** where decision P6-6 says. Default: **a new Supabase Cloud project in Singapore on the Pro plan**, and the containers on a VPS near the lab. Production starts with the reference data and migrations only; the demo seeds never run there.
3. **The domain** with TLS from Caddy.
4. **Supabase production settings:** custom SMTP (5.3), Email OTP expiration, Auth rate limits, the site URL and redirect URLs set to the domain.

### 5.3 The mail sender

Supabase's built-in mail **only sends to members of the Supabase team and is rate-limited; it is not meant for production** (Supabase docs, "Send emails with custom SMTP"). Production needs an SMTP account: the lab's own mail server or a transactional service (the docs list Resend, AWS SES, Postmark, SendGrid, ZeptoMail and Brevo). The same account sends Supabase's mail and the API's invite and reset mail (4.3). The sending domain gets SPF, DKIM and DMARC records.

### 5.4 Backups and the restore test

- **What Supabase gives:** Pro projects are backed up daily and keep 7 days. Free projects have none; Supabase recommends regular `db dump` exports kept off-site. **Database backups do not include the files in Storage** (signed RoAs, CoAs, logos, photos, signatures) (Supabase docs, "Database Backups").
- **So we add our own, nightly** (spec 16 Backup): `supabase db dump` (schema, data and roles) and a copy of every Storage bucket, written to storage outside Supabase (decision P6-7), kept 30 days, plus the first of each month kept for a year.
- **A backup that has failed** alerts the Superadmin by email.
- **The restore test, before go-live and then every three months:** restore last night's dump and files into an empty project, start the app on it, sign in, open a job order, a batch, a CoA PDF and a drill hole CoA, and compare row counts with production. The result goes into the runbook.

### 5.5 Monitoring and the runbook

- **Uptime:** a check on `/health` every minute, alerting by email (a free uptime service is enough for one site).
- **Logs:** the API's JSON logs kept 30 days on the server.
- **Runbook** (`.context/docs/Project/Runbook.md`): how to deploy a new version, run a migration, restore a backup, rotate keys, unlock or re-invite a person, renew the domain, and who to call.

## 6 · Slice D · Go-live with the lab

| Step | What | Needs |
| --- | --- | --- |
| D1 | **Real master lists:** clients and contacts, drill holes, seams, lithologies loaded from the lab's Excel files with a one-off script (the import wizard stays on hold). Each list is checked by the lab on screen after loading | Request item 2 (R-08) |
| D2 | **Methods and lookups** matching the lab's lists: methods with editions, r, R and detection limits; sample conditions, hold reasons, send channels | Request items 3 and 4 (R-05, R-06); closes Phase 4 G3 |
| D3 | **Staff accounts** with their roles, invited by the Superadmin with 7-day links | Request item 11 (R-09) |
| D4 | **Demo data retired in production:** no demo personas, job orders or batches; the demo signature and stamp images replaced by the real ones | Phase 4 G4 |
| D5 | **Phase 4 gate G1 to G9:** the first real job order goes through the whole chain; the lab answers G2 (FC on AR), G5 (form codes and terms), G6 (who signs), G7 (certified signature), G8 (RoA fields); G9 compares the first real CoA with the lab's own | `../Reports/Reports_Build_Design.md` s18 |
| D6 | **The Privacy wording** on the sign-in page, confirmed or corrected by the lab (UU PDP) | Request item 12; `Phase5_Build_Design.md` s14 |
| D7 | **UAT on a real phone and tablet:** lab staff run the gate flows (Phase 5 s16.2) on their own devices on staging, one session per role, with a checklist. Each problem is logged, fixed and re-checked | The lab's people and devices |
| D8 | **Training:** one session per role group (CSO; Lab admin and Preparation; analysts; Supervisor and Manager; Superadmin), using the staging link and a one-page guide per role | The lab |
| D9 | **Handover:** the runbook, the user guides, the spec and build designs as built, the repository and the accounts (Supabase, server, domain, mail, GitHub) in the lab's or owner's name | The owner |
| D10 | **Go-live day:** production opened to staff; the CSO enters the first new job order in the system instead of Excel. That is the gate | Everything above |

## 7 · Decisions for the owner

Each default says where it comes from. Where there is no source, it says so.

| # | Decision | Default | Source |
| --- | --- | --- | --- |
| P6-1 | Which lists get Export | The ten list pages in section 3.1 (the nine lists in the sidebar, plus Advanced search). **Not** the tabs inside a record (a job order's Samples or History tab, a batch's tabs). **Not** the My work queues: they show the same records the Job orders, Batches and Reports exports already give | Spec 16 NFR Export ("every list"); Job Order plan decision 3 ("Export CSV from the tab: No; the Audit log exports, filtered by record"). The My work exclusion has no source; it is my recommendation |
| P6-2 | How XLSX files are made | On the API with **ExcelJS**, streamed, so a large file never sits in memory. Not SheetJS: its npm package is no longer updated there | Stack record S-6 (every call through the API); no project source for the library choice, this is my recommendation |
| P6-3 | RoA per drill hole: which batches | **Completed batches only**, so the file serves the stored values and nothing changes under it | Spec S-11 ("after completion, exports serve the stored snapshot", D-10) |
| P6-4 | The RoA export dialog (several formats at once, choose bases, include recheck rounds) | **No dialog**: a menu with PDF, XLSX and CSV, always all four bases. Recheck rounds don't exist in v1 | Spec S-11 marks the dialog Proposed; v1 scope (Oct 29, 2026): worksheet and recheck rounds are out |
| P6-5 | Invite links | **7 days, through app-made tokens** (4.3) | Spec and App plan ("invite links work for 7 days"); `Phase5_Build_Design.md` s14 moved it here |
| P6-6 | Where production runs | **Supabase Cloud, Singapore, Pro plan**, and the containers on a VPS near the lab | Stack record open point 2 and its risk table ("Supabase Cloud, region Singapore"); R-11 is still open with the client, so this is the default until they answer |
| P6-7 | Where our own nightly backups go | **Storage outside Supabase and outside the app server**: an S3-compatible bucket in another provider, or the lab's own drive if they prefer | Spec 16 Backup; Supabase docs (keep off-site backups; Storage files are not in database backups) |
| P6-8 | The mail sender | **The lab's domain through a transactional mail service** (the lab or IT picks the service) | Stack record risk table ("the client's mail domain or a transactional mail service"); Supabase docs (built-in mail is not for production) |
| P6-9 | Load test volume and targets | One batch of 400 samples × 60 parameters (spec), and **about 20,000 samples a year** for the lists. Targets as in 4.1 | 400 × 60: spec 16. **The yearly volume has no source**: it is a working number until the lab tells us its real volume (section 8, item 5) |
| P6-10 | Old job orders from Excel | **Not imported.** Production starts with master lists, methods and staff; job orders start new on go-live day | The gate ("the lab enters **new** job orders"); the import wizard is on hold (owner, Nov 16, 2026) |
| P6-11 | Who does UAT and on which devices | One person per role group, on **their own** phone and tablet, against staging | The build plan's phase 6 row ("UAT on a real phone and tablet") |

## 8 · Requests for the lab and IT

Items 1 to 3 are needed before slice C can finish; 4 to 7 before go-live. Items 1 to 4 repeat the build plan's open requests (`V1_Build_Plan.md` section 4) that are still unanswered.

1. **Where the system runs** (cloud or the lab's own server), the **web address**, and the internet speed at the lab (R-11).
2. **A mail account or service** the system can send invites and password resets from, with access to the domain's DNS for SPF and DKIM.
3. **Who owns the accounts:** the Supabase, server, domain and mail accounts should be in the lab's name or the owner's, with a second administrator.
4. **The master lists in Excel** (clients with contacts, drill holes, seams, lithologies), **the method list** per parameter, and **the staff list with roles** (R-08, R-05, R-06, R-09).
5. **How many samples the lab receives in a typical month**, and the largest batch it has had (for the load test, P6-9).
6. **The Phase 4 gate answers** G2, G5, G6, G7, G8, and the signature and stamp images (G4).
7. **The Privacy wording** confirmed, and **who in the lab** does UAT and attends training.

## 9 · Order of work

1. **Slice A:** frames for Export (three sizes), then the list exports, then the RoA files. Tests as in 3.3.
2. **Slice B**, alongside: load seed and measurements, the two migrations for the owner, the invite tokens, then the fixes the measurements call for. The RLS tests, CI end-to-end and advisors close the slice.
3. **Slice C**, once section 8 items 1 to 3 are answered (staging can go up earlier on the current project): containers, staging link, production, mail, backups and the first restore test, monitoring, runbook.
4. **Slice D** as the lab's answers arrive; go-live day last.

Each slice ends with its tests passing at the three sizes and a short status section in this document, and is committed only when you say so.

## 10 · Gate checklist

| # | Gate item | Done when |
| --- | --- | --- |
| H1 | Every list exports | CSV and XLSX on the ten list pages of 3.1, tested per role |
| H2 | The RoA as XLSX and CSV | Per batch and per drill hole, matching the PDF digit for digit |
| H3 | Performance | Every row of the 4.1 table meets its target |
| H4 | Backups | A nightly backup has run for a week and the restore test passed |
| H5 | Production | Running on the domain with TLS, mail delivered, advisors clean |
| H6 | Accounts | Every staff member signed in once with their own password; no demo accounts in production |
| H7 | Phase 4 gate | G1 to G9 closed with the lab |
| H8 | Privacy | The wording confirmed by the lab |
| H9 | UAT | Every role's flows passed on a real phone and tablet |
| H10 | Handover | Runbook, guides and account access handed over; training given |
| **Gate** | **The lab enters new job orders in the system instead of Excel** | The first real job order of go-live day is in the system |
