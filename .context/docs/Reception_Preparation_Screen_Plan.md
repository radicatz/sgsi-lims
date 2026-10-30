# Reception and Preparation (S-18) — Design and Prototype Plan

Written Oct 28, 2026. **Built Oct 28, 2026** (frames and prototype; see section 12). Open points 1 to 7 used their defaults.

**Revision B (Oct 28, 2026): BUILT** (frames and prototype version 27; see section 14.8). Option B of the decision review (section 13) is accepted: samples that have not arrived leave the batch at Start Preparation and go back to the job order.

**Revision C (Oct 29, 2026): PLAN, not built.** v1 is report and monitor: Confirm reception by three roles, photos, ADL only, no performer chip, five sample states, analyst value entry with the signed RoA uploaded, editable batch number, and a dark / light switch in the prototype. Section 15; it waits for the go-ahead.

Covers two things: the frames in `screens.pen` (desktop 1440, tablet 834, phone 390) and the extension of the live job order prototype (https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo) so the flow continues from "batch created" to "preparation finished".

## 1 · Why this screen next

The job order prototype stops where the lab's physical work starts: a batch is created, and its row opens "Outside this prototype". S-18 is step 2 and 3 of the flow (spec B-8): the Preparation team receives the samples, labels them with the sample IDs the CSO registered, records mass and condition, prepares them and records ADL. Without it, the "Samples received" step of the job order stepper never moves, and the Samples tab's locked rows have no source.

## 2 · Sources in the spec

| Item | Spec |
| --- | --- |
| Screen | S-18 `/batches/:id/receive`: header (job order, client, expected, received, performer chip); grid with arrived tick, mass received, condition (good, damaged, wet, short, no tag), remarks; **Print labels**; **Start Preparation** with its guard; Preparation tab with ADL; **Finish Preparation**; tablet-first; phone finds a row by scanning a label |
| Flow | B-8 steps 2–3; F-REC-01, F-REC-02, F-LBL-01, F-SMP-05 (mass received), F-SMP-07 (issue codes, T-10) |
| Batch states | Section 9.2: `created` → **Start Preparation** → `preparation` → **Finish Preparation** → preparation (prep finished) → **Start Analysis** (analyst, outside this screen) |
| Start Preparation guard | At least one sample; mass and condition recorded; labels printed; warn and confirm when received < expected (D-06) |
| Finish Preparation guard | Preparation tab complete for the service: ADL when TM is ordered (B-8 step 3) |
| Locks | Sample information locks at Start Preparation (V-13, V-14); sample rows cannot be deleted after it (F-BAT-05) |
| Hold | Per sample: Hold with a reason (damaged, insufficient, client request) takes it out of the completeness checks; Release returns it; a held sample prints as "not analysed" on the RoA |
| Permissions (8.2) | `sample.receive`: Prep. `label.print`: Prep, Lab admin. `batch.transition.prep`: Prep, Supervisor. `result.write.prep` (mass, ADL): Prep |
| Performer | Every saved row records its performer (signed-in user by default; a picker allows another staff member) and the time (V-25) |
| Decimals | ADL 2 decimals (W-2); TM = ADL + RM × (100 − ADL) / 100 (section 6) |

## 3 · Who uses it and where they start

| Role | Start | Does |
| --- | --- | --- |
| Preparation team (Dedi Kurniawan, Yusuf Hidayat) | My work card "Job orders awaiting samples" or "Batches to prepare"; or a batch row in the job order's Batches tab | Receives, labels, starts and finishes preparation, records ADL |
| Lab admin | Batch row | Reprints labels; read-only otherwise |
| Supervisor | Batch row | May start or finish preparation (permission grid); otherwise read-only |
| CSO | Batch row | Read-only view of what arrived, with condition and mass |

## 4 · Screen structure

One page per batch with two tabs that follow the batch state. Route stays `/batches/:id/receive` (the Preparation tab is `#preparation`).

```
Breadcrumb   Job orders › JO-2026-0137 › B-2026-0420
Header       B-2026-0420  [Created]   PT Bara Nusantara Mandiri · JO-2026-0137 · ASTM · deadline 1 Nov
             Received 6 / 8 expected     Labels printed 6     Performer: (DK) Dedi Kurniawan ▾
Mini stepper Created ── Receiving ── Preparation ── Prep finished ── Analysis
Tabs         Reception (8)   Preparation
Toolbar      [Scan or type a label]   Mark all arrived   Print labels (6)   … Hold   [Start Preparation]
Grid         # | Sample ID | Lab code | Arrived | Mass received (kg) | Condition | Remarks | Label
Footer       Rules box: what Start Preparation needs, with a tick per rule
```

### 4.1 Reception tab (batch `created`)

| Column | Behaviour |
| --- | --- |
| Sample ID | From the job order (read-only); the label prints it |
| Lab code | Generated on arrival, `B0420-01` style (open point 2) |
| Arrived | Tick; ticking fills the lab code and the arrival time, and sets the performer |
| Mass received (kg) | Number, 2 decimals, required for arrived rows; warning when above 50 kg or below 0.1 kg (open point 4) |
| Condition | Select: Good (default), Damaged, Wet, Short, No tag (issue codes, T-10). Anything but Good asks for a remark |
| Remarks | Free text |
| Label | "Printed 27 Oct 10:42" or "Not printed"; reprint count when > 1 |
| Row menu | Hold (reason: damaged, insufficient, client request, other), Release, Reprint label |

Toolbar:

- **Scan or type a label**: focuses the row with that sample ID or lab code and ticks Arrived. On phone it is the main way to find a row (camera scanning is a later step; see section 9).
- **Mark all arrived**: ticks every row not on hold; asks to confirm.
- **Print labels**: dialog (4.3) for the selected rows, or all arrived rows without a label.
- **Start Preparation**: primary; disabled with the list of what is missing until the guard passes; when received < expected it asks "Start with 6 of 8 samples?" (D-06 warn and confirm).

Rules box (as SIM Lab shows its rules): Every arrived sample has a mass · Every arrived sample has a condition · Every arrived sample has a printed label · At least one sample arrived. Each line ticks green as it becomes true.

### 4.2 Preparation tab (batch `preparation`)

Opens after Start Preparation; the Reception tab turns read-only (locked rows with the lock icon used in the Samples tab).

| Column | Behaviour |
| --- | --- |
| Sample ID, Lab code | Read-only |
| ADL (%) | Required when TM is among the parameters; 2 decimals; warning above 20 % (open point 4) |
| Mass after preparation (g) | Optional (Proposed) |
| Top size (mm) | Optional (Proposed), default 0.212 for analysis samples |
| Performer, time | Filled on save; performer picker per row |
| Status | Pending, Saved, On hold |

Actions: **Save** (per row and Save all), **Finish Preparation** (disabled until every non-held row needed for TM has ADL; the button says what is missing). After Finish, the batch shows "Prep finished · ready for analysis" and the tab turns read-only.

### 4.3 Print labels dialog

Label preview at real proportion (default 50 × 30 mm): sample ID (large, mono), lab code, barcode (Code 128 of the lab code), job order no., date received, company short name. Options: printer (setting), copies per sample, "Only rows without a label". **Print n labels**. A reprint asks for a reason and is logged (F-LBL-01). In the prototype, Print records the labels as printed and shows the preview; it does not open the browser's print dialog (the artifact host blocks it).

### 4.4 Batch states shown in the header

| State | Badge | Primary action | Tab open |
| --- | --- | --- | --- |
| created, nothing arrived | Created | Start Preparation (disabled) | Reception |
| created, some arrived | Receiving (derived, not a stored state) | Start Preparation | Reception |
| preparation | Preparation | Finish Preparation | Preparation |
| prep finished | Prep finished | none here (Start Analysis is the analyst's, S-09) | Preparation, read-only |

## 5 · Frames for `screens.pen`

New row "Reception · Preparation Row" under the job order rows, built from existing components (Top Bar, Sidebar, Badge/Status, Table/Header Row, Checkbox, Input/Select, Button/*, Dialog, Toast, Performer Line, Tab/Underline) and the tokens in light mode only (dark mode is on hold).

| # | Frame | Sizes |
| --- | --- | --- |
| 1 | Reception · Receiving (6 of 8 arrived, 2 labels to print, one Wet with a remark, Start Preparation disabled) | Desktop, Tablet, Phone |
| 2 | Reception · Print labels (label preview, printer, options) | Desktop (dialog), Phone (bottom sheet) |
| 3 | Reception · Ready to start (all arrived samples labelled, Start Preparation enabled, all checks green) | Desktop |
| 4 | Reception · Start with fewer samples (dialog on frame 3: 6 of 8) | Desktop |
| 5 | Reception · Hold sample (dialog with reason and note) | Desktop |
| 6 | Preparation tab · Entering ADL (4 of 6 saved, one above 20 % marked) | Desktop, Tablet, Phone |
| 7 | Preparation · Finished (read-only, "Ready for analysis") | Desktop |
| 8 | Phone · Scan a label (BNM-3507 found, marked arrived, mass field focused, toast) | Phone |

Total: **13 frames** (7 desktop, 2 tablet, 4 phone). The first draft of this plan counted 15 and had a "guard not met" frame; frame 1 already shows the unmet checks, so frame 3 became the ready state. Tablet is the primary size for this screen (preparation bench): 44 px targets, the grid keeps Sample ID, Arrived, Mass, Condition and Label visible; Remarks is left out of the tablet grid. Phone shows one card per sample and a sticky Print and Start Preparation bar.

New components (reused later by Input ROA and My work):

| Component | Notes |
| --- | --- |
| `Condition Select` | Good, Damaged, Wet, Short, No tag; non-Good shows the warning colour |
| `Label Preview` | 50 × 30 mm card with barcode block |
| `Rules Box` | Title + ticked lines; used again on Input ROA (S-09) |
| `Batch Mini Stepper` | Created, Receiving, Preparation, Prep finished, Analysis |
| `Performer Chip` | Avatar + name + caret; picker of staff with the role |
| `Scan Field` | Search input with a barcode icon (`barcode` from Phosphor) |

## 6 · Prototype: what gets added to the live artifact

Entry points:

- Job order **Batches tab** and the Overview **Batches card**: a batch in `created` or `preparation` opens S-18 instead of "Outside this prototype". Other states still open the placeholder.
- A new nav item is not needed: the Preparation role lands on the job order list as today; the Flows panel starts the new flows directly.

Behaviour in the prototype:

| Part | Prototype |
| --- | --- |
| Arrived, mass, condition, remarks | Editable for the Preparation role only (others read-only, hint names who can edit) |
| Scan or type a label | Typing a sample ID or lab code + Enter finds and ticks the row; no camera (the artifact host refuses camera access) |
| Print labels | Dialog with the preview; Print marks rows as printed; reprint asks for a reason and adds a log line |
| Start Preparation | Runs the guard; warn-and-confirm when fewer than expected; sets the batch to Preparation, marks the samples received (`received` with performer and time), locks them in the job order's Samples tab, and moves the job order to In progress |
| Preparation tab | ADL entry with validation and the 20 % warning; Save all; Finish Preparation with its guard; the batch shows "Prep finished" |
| Hold, Release | Row menu with reason; held rows drop out of the guard |
| Performer | Chip in the header (Dedi Kurniawan by default, Yusuf Hidayat as the other choice); each saved row shows who and when |
| Job order effects | Stepper step "Samples received" completes with the date; Batches tab shows the new status and performer lines |

New flows in the Flows panel:

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| F12 | Receive a batch | Preparation | JO-2026-0137 → Batches → B-2026-0420 (created by F9, or seeded) → scan BNM-3501 → tick the rest → masses → one sample Wet with a remark |
| F13 | Print and reprint labels | Preparation | Select arrived rows → Print labels → reprint one with a reason |
| F14 | Start with fewer samples | Preparation | 6 of 8 arrived → Start Preparation → "Start with 6 of 8 samples?" → Start |
| F15 | Hold a sample | Preparation | Row menu → Hold → "Insufficient" → guard ignores it |
| F16 | Enter ADL and finish | Preparation | Preparation tab → ADL for each sample (one at 22.4 % shows the warning) → Save all → Finish Preparation |
| F17 | Read-only view | CSO | JO-2026-0139 → B-2026-0419 → sees arrival, condition, mass; no edit controls |

Demo data additions: B-2026-0420 is created by F9 today; the seed gains **B-2026-0421** (JO-2026-0138, 8 of 10 samples, `created`, nothing arrived) so F12 can start without F9, and B-2026-0419 (JO-2026-0139, already `preparation`) gets masses, conditions and 12 of 18 ADL values for F16.

How it is built: the live artifact (version 25) is ahead of `prototype/src`, so step 0 splits the live page back into `src` (styles, icons, data, app) and checks that a rebuild reproduces it exactly. Then the S-18 code goes into a new `src/reception.js`, the build joins it, the jsdom flow tests gain F12–F17, and the result is published to the same link. Icons added: `barcode`, `printer` (already in), `scales`, `drop` (wet), `tag`.

## 7 · Interaction rules

| Part | Rule |
| --- | --- |
| Arrived tick | Space toggles; ticking sets arrival time and performer; unticking before Start clears the lab code |
| Grid keys | Arrows move, Enter edits and moves down, Tab moves right (as the Samples grid) |
| Mass | Decimal comma or point accepted; shown with 2 decimals; out-of-range shows an inline warning, not an error |
| Condition other than Good | Remark becomes required; the row gets a warning dot |
| Hold | Reason required; held rows show a grey "On hold" badge, are skipped by Mark all arrived and by the guards, and stay visible |
| Start Preparation | Never silently skips: the dialog lists counts (arrived, held, missing) |
| Leaving with unsaved rows | Same "Save your changes?" dialog as the Samples tab |
| Toasts | "6 samples received · labels printed", "Preparation started for B-2026-0420", "Preparation finished · ready for analysis" with Undo for 10 s on Start and Finish in the prototype |

## 8 · States every view needs

Loading skeleton; batch with no samples (message + link to the job order's Samples tab); nothing arrived yet; guard not met; offline save failed (rows stay marked unsaved); read-only for roles without permission; prep finished.

## 9 · Out of scope

Camera barcode scanning (a later step; the field accepts a scanner gun, which types like a keyboard); real label printing and printer setup; sample storage locations; Start Analysis and result entry (S-09); dark mode.

## 10 · Build steps (after approval)

1. Frames in `screens.pen` (section 5), checked by screenshot at each size; the plan's build status updated.
2. Prototype step 0: split the live artifact back into `src` and prove the rebuild matches.
3. Prototype: `reception.js`, entry points, data additions, flows F12–F17; jsdom tests for every new flow plus the existing 19 checks.
4. Publish to the same link; update this plan, the prototype plan and the job order plan (batch row now opens S-18).

## 11 · Open points (defaults used if not answered)

| # | Question | Default |
| --- | --- | --- |
| 1 | Is reception per batch (spec route `/batches/:id/receive`) or per job order (all samples that arrive, before batches exist)? | Per batch, as the spec says. A job order without a batch shows "Create a batch first" with the Add batch button |
| 2 | Lab code format (Kode Lab) | `B` + batch number + 2-digit sequence, e.g. `B0420-01` |
| 3 | Which preparation values besides ADL | ADL (required when TM is ordered), mass after preparation and top size (optional) |
| 4 | Warning limits | Mass below 0.1 kg or above 50 kg; ADL above 20 % |
| 5 | Label size and content | 50 × 30 mm: sample ID, lab code, Code 128 barcode, job order no., date received, company short name |
| 6 | Can the CSO see S-18 | Yes, read-only |
| 7 | Frames first, or prototype first | Frames first, then the prototype copies them, as for the job order screens |

## 12 · Build result (Oct 28, 2026)

**`screens.pen`:** new row "Reception · Preparation Row" (end of "v1 Screens") with the 13 frames above, in light mode, built from the existing components and tokens. Frames were checked by screenshot at each size (zoomed on dialogs, toolbar, rules box and cards).

**Live prototype (version 26 of https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo):**

| Part | Result |
| --- | --- |
| Entry points | A batch row in Created, Preparation or Prep finished opens S-18 from the job order's Batches tab and Overview card; completed or analysis batches still open the placeholder |
| Reception | Arrived tick, mass, condition (remark needed unless Good), remarks, label status; scan or type a label (typed codes only; no camera); Mark all arrived (confirm); row menu with Hold, Release, Print or Reprint label |
| Print labels | Dialog with the label preview and barcode, printer, copies, "only samples without a label"; reprint needs a reason; every print is logged in the batch log |
| Start Preparation | Blocked with a ticked checklist until the checks pass; "Start with 4 of 6 samples?" when fewer arrived; sets the batch to Preparation, marks samples received (locks them on the job order's Samples tab), moves the job order to In progress; Undo for 10 s |
| Preparation | ADL, mass after, top size per sample; unsaved markers; Save all; warning above 20 %; Finish Preparation blocked until ADL is saved for every sample when TM is ordered; "Prep finished" state with Undo |
| Roles | Only Preparation edits and starts or finishes; Lab admin may print; CSO sees it read-only; actions a role cannot use are hidden |
| Phone | Cards, sticky action bar, scan field |
| New flows | F12 receive, F13 print and reprint, F14 start with fewer, F15 hold, F16 enter ADL and finish, F17 read-only |
| Demo data | New batch B-2026-0421 (JO-2026-0134, six samples, created) for F12 to F15; B-2026-0419 now has masses, labels and 12 of 18 ADL values (one at 21.8 %) for F16 and F17. Saved demo state moved to a new storage key, so reviewers start from fresh data once |
| Source | The live page and `prototype/src` are in sync again: the live HTML (including the coking pills by standard) was split back into source files and a rebuild reproduced it byte for byte before the new module (`src/reception.js`) was added. Rebuild with `python .context/prototype/build.py` |
| Tests | Headless runs: the 12 new checks (every flow F12 to F17, the entry point, job order effects, phone width) and the 19 earlier ones, plus the coking pill check, all pass with no page errors. The screenshot tool timed out, so the live page has not been looked at rendered; the page does load and navigate to the screen in the pen.dev browser |

Not in the prototype (spec only): camera scanning, real label printing, Input ROA (Start Analysis), a Supervisor role, "Receiving" as a stored state (it is derived).

Differences between frames and prototype: the rules box has the same four checks in both, with the "remark for anything but Good" rule folded into the condition line; the prototype's Preparation tab shows the Performer and Saved columns on desktop only (the tablet frame omits them too); the finished frame keeps the "Check: above 20 %" row marked, and so does the prototype after finishing. The prototype also adds the batch log line under the Reception grid, which the frames do not show.


## 13 · Decision review: a registered sample that has not arrived when preparation starts (Oct 28, 2026)

**Question.** The CSO registered 8 sample IDs on the job order and the lab admin put all 8 in batch B-2026-0420. The Preparation team receives 6 and starts preparation. What happens to the other 2?

**What the build does today (and why it is wrong).** The confirm dialog says the 2 "stay in the batch and can be received later", but after Start Preparation the arrival ticks are read-only, so a late sample can never be received. The spec does not settle it: D-06 only says Start Preparation may run with registered < expected (warn and confirm, expected count editable until then), V-13 and V-14 lock sample information and deletion at Start Preparation, and SIM Lab's rule 5 says a sample cannot be deleted from that stage "to protect analysis data integrity".

### 13.1 Evidence from the project folder and the web

| Source | What it shows | Bearing on the decision |
| --- | --- | --- |
| SIM Lab proposal (spec 3.2, rules box) | Rows are entered before Start Preparation; from that stage a sample cannot be deleted; counter is registered / expected | A started batch is a locked record; its contents should not change silently |
| AssayNet screenshots (`research/assaynet/job-book_sample-batches*.png`, `jobs_sample-login*.png`) | A batch is logged from what physically arrives (scan labels, "Number Samples"); a client **submittal** pre-registers samples and is retrieved at receipt; a "pending" batch shows 0 samples; batch statuses include received and partial approval; every way of creating a batch (submittal, series, manual) gives it its own unique batch ID | Batch = what arrived. Expected-but-not-arrived samples live on the submittal, not in the batch |
| AssayNet docs, [Add a Sample After a Batch is Loaded](https://docs.dataminesoftware.com/AssayNet/LIMS/Latest/en-us/Sample-Batches/Add-a-Sample-after-a-Batch-is-Loaded.htm) | Adding to a loaded batch is possible, but it is a back-office path: open Working View (isolates the batch), clone a sample, edit it, assign packages, add it to the preparation sheet, then add it to the analysis code in the Client Job. Intended for samples "accidentally missed" during loading. No status rule, no audit beyond comments | Late addition exists but is an exception with several manual follow-ups, not the normal flow |
| Clarity LIMS (`research/clarity-lims/screenshots/29-recording-a-standard-step/`, `research/clarity-lims/screenshots/34-unhappy-path-remove-and-store/`) | Samples are individual units; **Add Samples** is always available on a project; a submitted sample with no workflow assigned simply sits idle (sample 4 in the screenshot); "Remove from workflow" and "Store for later" are reversible, a stored sample can be found by search and re-queued | Each sample enters the work on its own when it is ready; removal and return are first-class, audited actions |
| Ovation LIMS, [Receiving Samples](https://support.ovation.io/article/276-receiving-samples) | Receipt is recorded on the existing order. For samples not found, you either look them up or "ignore the missing sample and exclude it from the batch"; the remaining samples can be received later on the same order | Exclude the missing sample from the batch, keep it on the order |
| ISO/IEC 17025:2017, clause 7.4 (as summarised by [a contract-lab guide](https://contractlaboratory.com/how-to-strengthen-chain-of-custody-systems-in-third-party-testing-labs/) and [Qi-A](https://www.qi-a.com/?p=17255)) | Receipt checks compare the shipment with the paperwork (ID, quantity, condition); discrepancies must be recorded, and a custody gap that cannot be reconstructed is a nonconformance | Record "expected 8, received 6" with who and when, and tell the client |
| Canadian Grain Commission LIMS requirements (search result, not read in full) | Mentions adding and removing samples after creation and closing batches | Both patterns appear in public tenders; none says which is normal |

What was **not** found: a vendor page that describes a second partial shipment being added into a batch that is already in preparation, and anything coal-specific. The conclusion below rests on the pattern across vendors and on our own locking rules, so it is a design judgement to confirm with the lab (add to R-01).

### 13.2 Options

| Option | How it works | For | Against |
| --- | --- | --- | --- |
| A · Late receipt in the same batch | Keep the arrival tick live while the batch is in Preparation; the late sample is received, labelled and prepared with the others | One batch, one RoA, no extra admin | Breaks the lock on sample information (V-13) and the stable list the analysts will see; impossible once preparation is finished, so a second path is needed anyway; Finish Preparation can be held up by a sample that may never come |
| B · Release to the job order, new batch later | At Start Preparation, samples that have not arrived leave the batch and return to the job order's unbatched list ("Awaiting arrival"). When they arrive, **Add batch** creates a new batch for them | The batch is exactly what was received and stays locked; matches AssayNet (batch = what arrived), Ovation (exclude), SIM Lab rule 5; works at every stage; the Add batch screen already exists; own batch number gives own deadline and RoA, clean traceability | More batches and RoAs for one job order; the CSO or lab admin must remember to batch late samples (mitigated by the unbatched note and a My work item) |
| C · Hold | Keep the sample in the batch on hold with reason "not received" | Visible in the batch | A hold is for samples that arrived but cannot be used; it blocks the batch from ever being "complete" and prints "not analysed" on the RoA for a sample that simply did not come |
| D · Delete from the batch | Remove the row | Simple | Forbidden by rule 5 after start; loses the record that the sample was expected |

### 13.3 Decision: B (accepted Oct 28, 2026), with two extras

1. **Not arrived is not the same as held.** Not arrived: released to the job order at Start Preparation (option B). Arrived but unusable (damaged, insufficient, client request): **Hold** inside the batch, as built.
2. **Close the loop for samples that never come.** On the job order, a row action **Mark as not received** (reason, for example "client did not send it") settles the sample: it stays listed with its reason, and the job order can finish without it. Without it a job order could never finish.

Why B and not A: a started batch is a locked record (V-13, V-14, rule 5); option A would need an exception to the lock and still fails once preparation is finished, so the lab would run two procedures. Option B is one rule that holds at every stage and reuses a screen that exists. Its cost, extra batches, is a normal pattern for partial shipments in the vendors reviewed.

### 13.4 What changes if B is accepted (summary; section 14 is the detailed plan)

| Where | Change |
| --- | --- |
| Start with fewer samples dialog | Text: "2 samples have not arrived. They leave this batch and go back to the job order. When they arrive, add them to a new batch." Counts stay (Arrived, On hold, Not arrived). Button: **Start Preparation** |
| Batch | `samples` count becomes the number that arrived; a log line "Started with 6 of 8 expected; 2 returned to JO-2026-0137" |
| Job order · Batches tab | The unbatched note ("2 of 8 registered samples are not in a batch yet") becomes the entry point: **Add batch** pre-ticks exactly those samples; each is tagged **Awaiting arrival** |
| Job order · Samples tab | New status for a sample not in a batch and not received: **Awaiting arrival**; row action **Mark as not received** (reason) for the CSO |
| Add batch | Optional **Copy settings from B-2026-0420** (standard, parameters, priority); deadline defaults to the job order due date |
| My work (S-19) | Queue "Samples awaiting arrival" for the CSO and the Preparation team, with the age of the oldest |
| CoA | Generating or publishing the CoA warns when registered samples are neither batched with an approved RoA nor marked not received |
| Notification | The CSO is told when preparation starts with fewer samples (they contact the client) |
| Reception screen | After Start Preparation the Reception tab lists only the received samples, read-only; released samples appear under a muted line "2 samples returned to the job order" with a link |
| Frames | Update "Reception · Start with fewer samples"; add a state of the job order Batches tab with the unbatched note; one new Samples-tab row state |
| Prototype | Release logic and wording, "Awaiting arrival" and "Mark as not received", Add batch pre-selection, flow F14 extended (then Add batch for the 2 late samples) |

### 13.5 Open points

| # | Question | Default |
| --- | --- | --- |
| 12 · answered Oct 28 | Accept B (release to the job order, new batch later) as the only rule? | **Yes, B accepted** |
| 13 | May a supervisor still receive a late sample into a batch that is in Preparation (option A as an exception)? | No (default, not confirmed) |
| 14 | Should CoA publishing be blocked, or only warn, while registered samples are unbatched? | Warn (default, not confirmed) |
| 15 | Does a late batch inherit the job order due date, or get a new deadline? | Job order due date, editable (default, not confirmed) |
| 16 | Confirm with the lab (R-01): is it normal for one client shipment to arrive in two parts, and how long do they wait before preparing the first part? | Open |


## 14 · Revision B · Samples that have not arrived (built Oct 28, 2026)

Accepted Oct 28, 2026: option B (section 13). Open points 13 to 15 use their defaults until answered; open point 16 is for the lab.

Example used throughout: JO-2026-0137 has 8 samples in batch B-2026-0420. BNM-3501 to BNM-3506 arrive; BNM-3507 and BNM-3508 do not.

### 14.1 Rules

| # | Rule |
| --- | --- |
| R1 | At **Start Preparation**, every sample of the batch that has not arrived and is not on hold **leaves the batch**. It stays on the job order with the state **Awaiting arrival** and a note of the batch it left ("from B-2026-0420"). It is not deleted: the started batch stays locked (V-13, V-14, rule 5) and the sample was never part of its work |
| R2 | A sample **on hold** arrived, so it stays in the batch as built (printed on the RoA as not analysed) |
| R3 | The batch's sample count becomes the number that arrived (held samples included). The batch log records "Started with 6 of 8 expected · returned to JO-2026-0137: BNM-3507, BNM-3508", with the performer and the time |
| R4 | When a released sample arrives, it goes into a **new batch** through **Add batch**; it is received there like any other sample. There is no late receipt into a batch that has started (open point 13: no exception) |
| R5 | **Mark as not received** (CSO, on the job order's Samples tab) settles a sample that will not come: it stays listed with the state **Not received** and its reason. **Restore** reverses it if it turns up. Allowed only for a sample that is in no batch and not received |
| R6 | A job order is **settled** when every registered sample is either received in a batch or marked not received. While it is not settled, the CoA tab and the Overview CoA card show a warning line; the CoA is not blocked (open point 14) |
| R7 | **Undo** of Start Preparation (prototype, 10 s) puts the released samples back into the batch |
| R8 | Who: the release happens automatically at Start Preparation (Preparation team). Mark as not received and Restore: CSO only, because the sample list belongs to the CSO (permission grid, `order.create / edit / cancel, sample list`). Add batch: CSO, Preparation, Lab admin, as today |

### 14.2 Sample states on the job order

| State | Badge | Meaning |
| --- | --- | --- |
| Registered | Grey (existing) | On the job order; in no batch, or in a batch that has not started; not received |
| Received | Green (existing) | Received in a started batch; locked |
| **Awaiting arrival** (new) | Amber, with "from B-2026-0420" under it | Left a started batch without arriving |
| **Not received** (new) | Muted, with the reason under it; the row is dimmed | Marked by the CSO; settled |

### 14.3 Screen changes

| Screen | Change |
| --- | --- |
| Start with fewer samples dialog | Title "Start with 6 of 8 samples?". Text: "BNM-3507 and BNM-3508 have not arrived. They leave this batch and go back to JO-2026-0137 as Awaiting arrival. When they arrive, add them to a new batch. Starting preparation locks the sample information of the 6 that arrived." Counts: Arrived · On hold · **Leave the batch**. Buttons: Cancel, **Start Preparation** |
| Toast after start | "Preparation started for B-2026-0420 · 2 samples returned to JO-2026-0137" with **Undo** |
| Reception tab after start | Read-only list of the batch's samples (6). Under the panel title, a muted line with an icon: "2 samples returned to JO-2026-0137 when preparation started: BNM-3507, BNM-3508" and a link **Open the job order's samples** |
| Batch header line | "8 samples expected" becomes "6 samples · 2 returned to the job order" |
| Job order · Batches tab | Amber note above the table: "2 samples are awaiting arrival (returned from B-2026-0420). When they arrive, use Add batch." It replaces the grey "not in a batch yet" note when both apply, and lists both counts. The single **Add batch** button stays where it is (your earlier decision: one button) |
| Add batch modal | When samples are awaiting arrival, they are pre-ticked (instead of the first 8 of the free list) and listed first under a small heading "Awaiting arrival". A line "Settings copied from B-2026-0420: ASTM · TM + Prox + TS + CV · Standard priority" with the link **Use the job order's settings**. Deadline defaults to the job order due date (open point 15) |
| Job order · Samples tab | Status column shows the four states. Header line: "8 registered · 6 received · 2 awaiting arrival · 0 not received". For an Awaiting arrival row the CSO sees the action **Mark as not received**; for a Not received row, **Restore**. On phone, the same actions sit on the sample card |
| Mark as not received dialog | Title "Mark BNM-3507 as not received?". Text: "The sample stays on the job order with this reason. The job order can be completed without it. You can restore it if it arrives later." Reason *: Client did not send it · Lost in transit · Client cancelled this sample · Other. Note (optional). Buttons: Cancel, **Mark as not received**. Phone: bottom sheet |
| CoA tab and Overview CoA card | While the job order is not settled: warning line "2 registered samples are not in a batch yet (awaiting arrival)". Not a block |
| Overview · Properties | Expected samples: "8 · Exploration cores · 2 awaiting arrival" |
| Notification to the CSO, My work queue | In the spec and the My work plan; not in the prototype (it has no notification list and no My work screen). Listed under Spec only |

### 14.4 Frames for `screens.pen`

A new row "Reception · Revision B Row" under the reception row, so the changes can be reviewed together.

| # | Frame | Sizes |
| --- | --- | --- |
| U1 | Reception · Start with fewer samples (updated text and counts) | Desktop (update in place) |
| N1 | Reception · Started with fewer samples (read-only Reception tab with the "returned" line) | Desktop |
| N2 | Job order · Batches · Samples awaiting arrival (JO-2026-0137 with B-2026-0420 in Preparation and the amber note) | Desktop |
| N3 | Add batch · Late samples (2 pre-ticked, copied settings, deadline = job order due date) | Desktop |
| N4 | Job order · Samples · Awaiting arrival and not received (BNM-3507 awaiting, BNM-3508 not received with its reason) | Desktop, Tablet, Phone |
| N5 | Mark as not received | Desktop (dialog), Phone (bottom sheet) |

Total: 1 updated and 8 new frames (5 desktop, 1 tablet, 2 phone). The job order screens get their phone and tablet states only where the new states show (N4, N5); N1 to N3 change one part of an existing screen, so desktop shows the change.

### 14.5 Prototype changes

| Part | Change |
| --- | --- |
| Data | Sample: `released` {from, by, at}, `notReceived` {reason, note, by, at}. Batch: `returned` (sample IDs), `samples` count updated at start |
| Start Preparation (`reception.js`) | Release rule R1, new dialog text and counts, toast, returned line on the Reception tab, header line; Undo restores (R7) |
| Job order (`app2.js`) | Samples tab states, header counts, Mark as not received and Restore with the dialog (CSO only); Batches tab amber note; Add batch pre-selection, copied settings and deadline; CoA tab and Overview warning; Properties line |
| Flows | **F14** extended: after Start Preparation, open the job order and see the 2 samples awaiting arrival. **F18** new, "Add late samples to a new batch": B-2026-0421 was started with 4 of 6, the 2 others arrive, Add batch pre-ticks them, Create batch, receive them in B-2026-0422. **F19** new, "Mark a sample as not received": as CSO, Samples tab, mark BNM-3307 not received, see the CoA warning shrink, Restore it |
| Spec only list | Adds: notification to the CSO when preparation starts with fewer samples; the My work queue "Samples awaiting arrival" |
| Tests | Headless checks for R1 to R8 through F14, F18, F19, Undo, the CoA warning and the CSO-only actions; then the existing 12 reception checks, 19 job order checks and the coking pill check |

### 14.6 Spec changes (applied to `Coal_LIMS_Development_Spec.md` with the build)

| Section | Change |
| --- | --- |
| 9.2 Batch state machine | Start Preparation: samples not arrived are released to the job order (Awaiting arrival); log line. D-06 narrowed: warn and confirm; unarrived samples leave the batch |
| Sample states and data model | New states `awaiting_arrival` and `not_received`; fields `released_from_batch_id`, `released_at`, `released_by`, `not_received_reason`, `not_received_note`, `not_received_by`, `not_received_at` |
| Job order (F-ORD) | Mark as not received and Restore (CSO); the "settled" rule; CoA warning while not settled |
| S-19 My work | Queue "Samples awaiting arrival" (CSO, Preparation team) with the age of the oldest |
| Decision register | New D-row for this decision (B accepted), citing section 13 of this plan |

### 14.7 Build steps (after approval)

1. Frames (section 14.4), checked by screenshot at each size.
2. Prototype: read the live artifact first (the live watch on it dropped, so another session's changes would not be noticed otherwise) and merge onto it if it changed; then the code changes in 14.5.
3. Headless tests (14.5), then publish to the same link.
4. Docs: build status here, the spec changes in 14.6, the My work plan queue, the job order plan's sample states.

### 14.8 Build result (Oct 28, 2026)

**`screens.pen`:** new row "Reception · Revision B Row" with 8 new frames: Job Order · Samples · Awaiting arrival (desktop, tablet, phone), Mark as not received (desktop dialog, phone sheet), Reception · Started with fewer samples, Job Order · Batches · Samples awaiting arrival, Job Order · Add batch · Late samples. "Reception · Start with fewer samples" was updated in place (new text, counts Arrived, On hold, Leave the batch). The Batches frame has one secondary Add batch button, as decided earlier. The parameter pills in the Add batch frame are unchanged from the base frame.

**Prototype (version 27, https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo):** release at Start Preparation (R1 to R3), new dialog text, toast with Undo that restores the released samples (R7), "returned" line and header on the Reception tab, the four sample states with Mark as not received and Restore for the CSO only (R5, R8), amber Batches note, Add batch with pre-ticked awaiting samples, copied settings and the job order due date, CoA tab and Overview warning, Properties line. Flows: F14 extended, F18 (late samples, new batch B-2026-0422) and F19 (mark as not received, restore); the notification and the My work queue are in Spec only. In F18 and F19 the demo batch counter starts at 422 so the new batch does not reuse 0421.

**Tests:** 9 new headless checks (R1 to R3, R5 to R8, F14, F18, F19, settled job order) plus the 12 reception, 19 job order, batch and coking checks all pass with no page errors.

**Docs:** spec changes in 14.6 applied to `Coal_LIMS_Development_Spec.md` (9.2, F-ORD-04, S-19 queue, sample columns, decision D-41). Open point 16 (how often shipments arrive in parts) is still for the lab.



## 15 · Revision C · v1 scope: report and monitor (PLAN, not built)

Written Oct 29, 2026, from the product owner's feedback after the meeting with the lab team. The answers given are marked "decided"; the rest use the defaults in 15.10 until answered.

### 15.1 What v1 is

The goal of v1 is **reporting and monitoring of job orders**. The analyst's worksheet (weighings, replicate runs, instrument readings, calculations) is **out of scope** and moves to the next goal. Each team enters only the values the report needs, the same way the Preparation team enters ADL: the lab team's answer was "Input data aja, seperti prep".

| In v1 | Next goal (kept in the spec, not built) |
| --- | --- |
| Job order, sample list, batches | Analyst worksheet: raw data, replicates, calculations, recheck rounds |
| Reception: arrival, mass, condition, photos, labels, Confirm reception | Mass after preparation, top size (and other preparation values) |
| Preparation: ADL only | Basis conversions (ar, db, daf) beyond the reporting basis |
| Analysis: one final value per sample and parameter | On-screen supervisor review and rechecks (Review ROA) |
| RoA: the signed PDF from the lab's current process is uploaded; Complete batch | RoA drafted in the app |
| CoA from the entered values, publish, mark sent | Instrument import |
| Monitoring: job order and batch status, My work queues | |

### 15.2 Decisions

| # | Decision | Status |
| --- | --- | --- |
| C1 | **Batch number can be edited**: pre-filled with the next number; pattern `B-YYYY-NNNN` until the lab fixes its own format; unique; editable in Add batch and from the batch header until Confirm reception; after labels are printed a change warns "labels must be reprinted" and the lab codes follow the new number | Decided (format: ours for now) |
| C2 | **Confirm reception** replaces Start Preparation. CSO, Lab admin and Preparation can mark arrived, record mass and condition, add photos, print labels and Confirm reception. Confirming locks the sample information, stamps the samples received, returns unarrived samples to the job order (Revision B rule) and moves the batch to Preparation | Decided |
| C3 | **Photos at reception**: optional, any number per sample, each tagged Condition, Weighing or Other; shown as attachments in the reception table. Not tied to the condition | Decided (optional, not paired) |
| C4 | **Preparation is ADL only** in v1. Mass after preparation and top size stay in the spec as next goal. ADL is entered by the Preparation team only (not Lab admin) | Decided |
| C5 | **No performer chip.** Every action is stamped with the signed-in account; the Preparation tab column becomes "Entered by" (read-only) | Decided |
| C6 | **Five sample states** on the job order: Expected, In batch, Received, Awaiting arrival, Not received | Decided |
| C7 | **Analyst inputs data** (15.5) and the lab's signed RoA is uploaded per batch (option a) | Decided |
| C8 | **Dark / light switch** in the prototype's review bar | Decided |

### 15.3 Sample states

| State | Meaning | Badge |
| --- | --- | --- |
| **Expected** (was Registered) | ID listed on the job order, not in a batch | Grey |
| **In batch** | In a batch, reception not confirmed yet; shows the batch number | Blue |
| **Received** | Arrived and reception confirmed; locked | Green |
| **Awaiting arrival** | Left a batch without arriving (Revision B) | Amber |
| **Not received** | Marked by the CSO, with the reason | Muted |

Samples tab header: "8 samples · 2 expected · 4 in batch · 2 received" (only the states that occur). Inside reception the tick stays **Arrived** until Confirm reception turns the sample into Received.

### 15.4 Batch steps in v1

| From | Action | To | Who | Guard |
| --- | --- | --- | --- | --- |
| — | Create batch | Created | CSO, Preparation, Lab admin | As today; batch number valid and unique |
| Created | **Confirm reception** | Preparation | CSO, Preparation, Lab admin | At least one arrived; mass and condition (remark unless Good); labels printed. Warn and confirm when fewer arrived (Revision B) |
| Preparation | Finish Preparation | Prep finished | Preparation | ADL saved for every arrived, not-held sample when TM is ordered |
| Prep finished | (first value saved) | Analysis | Analyst | Implicit: no Start Analysis button |
| Analysis | **Finish Analysis** | Analysis finished | Analyst | A value for every ordered parameter of every arrived, not-held sample |
| Analysis finished | **Complete batch** | Completed | Lab admin | Signed RoA PDF uploaded with its number. The supervisor's approval is the signature on that RoA (the paper process stays in v1) |

Stepper on the batch page: Created · Receiving · Preparation · Prep finished · Analysis · Completed. The job order's CoA follows the existing flow once every batch is completed (Revision B's "settled" warning still applies).

### 15.5 Analyst input data (definition)

| Topic | v1 rule |
| --- | --- |
| What is entered | One **final value** per sample and ordered parameter, as it appears on the signed RoA. No replicates, weighings, crucible masses or instrument readings |
| Basis and unit | Fixed per parameter and shown in the column head. Default: TM on ar (%); IM, Ash, VM, FC, TS on adb (%); GCV on adb (kcal/kg); other parameters in their method's unit (open point 18) |
| Calculated | FC = 100 − (IM + Ash + VM), adb: shown as a calculated cell, not typed (D-13). No other conversions in v1 |
| Layout | Analysis tab on the batch page (next to Reception and Preparation). Desktop and tablet: grid, samples as rows, parameters as columns grouped by parameter group (Moisture, Proximate, Sulfur, Calorific, ...). Phone: one card per sample with the parameters as fields |
| Checks | Numbers only (D-15: no `<0.01` in v1). Percent 0 to 100 is a block. A typical range per parameter warns, does not block (for example Ash above 50 %, TS above 5 %, GCV outside 3,000 to 8,000 kcal/kg) |
| Saving | Same as ADL: unsaved markers, **Save all**, each value stamped with the signed-in analyst and the time |
| Who | Analyst only (like ADL is Preparation only). Others see the tab read-only |
| Held samples | Skipped; shown "On hold" |
| After Finish Analysis | Values locked. Lab admin uploads the signed RoA (PDF, RoA number) and uses **Complete batch**. Undo in the prototype |

### 15.6 Screen changes

| Screen | Change |
| --- | --- |
| Batch header | Performer chip removed. Batch number with a pencil while Created (C1); dialog with the pattern hint and "already used" error |
| Reception tab | Button **Confirm reception** (shown to CSO, Lab admin, Preparation); checklist title "Before you can confirm reception"; new column **Photos** (paperclip, count, first thumbnail); phone cards get a photo strip and an **Add photo** button |
| Photos sheet | Opens from the Photos cell: gallery of the sample's photos with tag, taken by, time; **Add photo** (camera on tablet and phone, file on desktop), tag chips Condition / Weighing / Other; delete until Confirm reception, then read-only. Desktop: side sheet; tablet: side sheet; phone: bottom sheet |
| Confirm dialogs | "Confirm reception with 6 of 8 samples?" (Revision B text kept); toast "Reception confirmed for B-..." |
| Preparation tab | Columns: #, Sample ID, Lab code, ADL (%), Entered by, Saved, Status. Mass after and top size removed |
| Analysis tab (new) | 15.5. Header line "36 of 48 values saved · started 28 Oct by Fitri Handayani"; checklist "Before you can finish analysis"; after finishing, an RoA card: **Upload signed RoA** (PDF, RoA number), then **Complete batch** (Lab admin) |
| Add batch | Batch number field editable with the pattern hint; error "B-2026-0421 is already used" |
| Job order Samples tab | The five states (15.3) and the header counts |
| Job order Batches tab and Overview | Batch rows show Completed with the RoA number and a PDF link |
| Roles in the prototype | New role **Analyst** (Fitri Handayani). Signed-in person per role: CSO Rina Kartika, Lab admin Maya Lestari, Preparation Dedi Kurniawan, Analyst Fitri Handayani |

### 15.7 Frames for `screens.pen`

Existing frames are **updated in place**, because they become the current design (the earlier states are kept in this plan's text). New screens go in a new row "Batch · Revision C Row". Light mode only.

| # | Frame | Sizes | Kind |
| --- | --- | --- | --- |
| U2 | Reception frames (Receiving, Ready, Start with fewer, Hold, Print labels, Scan): performer chip out, Confirm reception, Photos column or strip | 5 desktop, 1 tablet, 3 phone | Update |
| U3 | Preparation frames: ADL only, Entered by | 2 desktop, 1 tablet, 1 phone | Update |
| U4 | Revision B frames: Confirm reception wording; Samples tab states | 2 + 3 | Update |
| U5 | Job order Samples tab frames: the five states | Desktop, tablet, phone | Update |
| U6 | Add batch: editable batch number | Desktop, tablet | Update |
| N6 | Reception · Photos sheet | Desktop, tablet, phone | New |
| N7 | Batch number · Edit (dialog with "already used") | Desktop | New |
| N8 | Analysis · Entering results | Desktop, tablet, phone | New |
| N9 | Analysis · Finished · Upload RoA and Complete batch | Desktop, phone | New |
| N10 | Batch · Completed (RoA attached, read-only) | Desktop | New |

Total: about 26 updated and 10 new frames.

### 15.8 Prototype changes

| Part | Change |
| --- | --- |
| Reception | Roles C2; Confirm reception; photos: a real file or camera picker (`accept="image/*" capture`) shown from memory, seed photos as drawn placeholders. Added photos are not kept after a reload (they are too large for saved demo state) |
| Batch number | Editable in Add batch and from the header while Created; pattern and uniqueness checks; label warning |
| Preparation | ADL only; Entered by; no performer chip |
| Analysis | New tab per 15.5 with FC calculated, warnings, Save all, Finish Analysis; RoA upload (any PDF, kept in memory) and Complete batch for Lab admin; Undo |
| Job order | Five states; Completed batches with RoA number |
| Review bar | **Theme: Light / Dark** switch, remembered per viewer. Dark values come from the `mode: dark` theme in `screens.pen` (Revision 2: lighter blue `#8DB4F0` for active states, all-white logo). Dark mode is still due for a rework (Research plan, Dark mode), so this is a preview that will show the known issues; colours hard-coded in the prototype are moved to tokens so both themes work |
| Flows | F12 to F19 reworded (Confirm reception). New: **F20** add photos at reception, **F21** change a batch number, **F22** enter results as Analyst (B-2026-0417, partly filled), **F23** upload the signed RoA and complete the batch as Lab admin |
| Spec only | Worksheet, mass after and top size, basis conversions, on-screen review and rechecks, real file storage, user switching on a shared bench tablet |
| Tests | Update the reception, Revision B and job order checks for the new wording and roles; new checks for photos, batch number, analysis entry and checks, Finish Analysis, Complete batch, the theme switch |

### 15.9 Spec changes (applied with the build)

| Section | Change |
| --- | --- |
| New "v1 scope" section | 15.1 table; the worksheet items are marked next goal wherever they appear (Input ROA, Review ROA, S-20 to S-27 as relevant) |
| Roles and permissions | Reception and Confirm reception: CSO, Preparation, Lab admin. ADL: Preparation. Result values: Analyst. Upload RoA and Complete batch: Lab admin |
| 9.2 Batch state machine | 15.4: Confirm reception replaces Start Preparation; Start Analysis implicit; Complete batch needs the signed RoA PDF |
| Sample states | expected, in_batch, received, awaiting_arrival, not_received |
| Data model | `sample_attachments` (sample, file, tag, taken_by, taken_at); `batch_documents` for the signed RoA (number, file, uploaded_by/at); results simplified to one value per sample and parameter with basis, unit, entered_by/at; batch number rule |
| Preparation | Mass after preparation and top size marked next goal |
| Performer | Signed-in account; the performer chip is withdrawn |
| Decision register | New rows: v1 scope, batch number edit, Confirm reception roles, analyst input data, photos |

### 15.10 Open points (defaults used until answered)

| # | Question | Default |
| --- | --- | --- |
| 17 | Who uploads the signed RoA and completes the batch? | Lab admin; the supervisor signs the RoA on paper |
| 18 | Reporting basis and unit per parameter | As in 15.5; the lab confirms the list |
| 19 | Is FC calculated or typed? | Calculated (100 − IM − Ash − VM, adb) |
| 20 | Typical ranges that warn | The examples in 15.5; the lab confirms |
| 21 | Can photos be added or removed after Confirm reception? | No: they lock with the sample information |
| 22 | The lab's own batch number format | `B-YYYY-NNNN` until it is fixed |

### 15.11 Build steps (after approval)

1. Frames (15.7), checked by screenshot at each size.
2. Prototype: read the live artifact first and merge if it changed; then 15.8.
3. Headless tests, then publish to the same link.
4. Docs: build status here, the spec changes in 15.9, the job order plan's states, memory.

### 15.13 Status (Oct 29, 2026, later): frames built in FigCraft

The paused frames (15.7) are built. The design source is now **FigCraft** (github.com/storytold/figcraft, a standalone design app), because the pen.dev and the Figma Starter plan limits were both reached. Section 15.12 below is the earlier status and is kept for the record.

- **File:** `.context/design/figcraft/SGSI-LIMS-screens.figcraft` (103 frames: the 93 pen.dev frames plus 10 new). Open it with `figcraft.exe`; it needs the Newsreader and JetBrains Mono fonts installed (Noto Sans is bundled). The README lists the folder.
- **Method:** `tools/convert.js` reads the pen.dev export (`.context/design/screens-export.html`), `emit.js` writes a FigCraft command script, `revc.js` applies the Revision C changes to the existing frames, `newframes.js` composes the new ones, `tokens.js` creates the colour variables and `figcraft-cli run` builds the file (about 4 minutes, 65,641 steps, no errors). The scripts still point at the session scratchpad's `jsdom` and at the `.context` export path; adjust the two paths to rerun them. The FigCraft MCP server (`figcraft-app`, attached to `figcraft.exe --control 7979`) lets Claude edit the open file live.
- **Updated frames (15.7 U2 to U6):**
  - U2 Reception: performer chip out, **Confirm reception** (button, dialog, checklist title), a **Photos** column on desktop and tablet (paperclip, count, thumbnail, or Add), a photo strip with **Add photo** on phone, a pencil beside the batch number while Created, a six-step stepper (Completed added) and an Analysis tab.
  - U3 Preparation: ADL only, **Entered by**, no performer chip, the same stepper and tabs.
  - U4 and U5 job order frames: "Registered" renamed **Expected**; the unarrived-sample frames keep their wording. The per-row In batch, Received and Awaiting arrival badges and the header counts were **not** recomputed (text renames only). See open items.
  - U6 Add batch: hint "Pattern B-YYYY-NNNN. The number must be unique." under the batch number.
- **New frames (row "Batch · Revision C Row"):** N6 Photos sheet (desktop and tablet side sheet, phone bottom sheet); N7 Batch number · Edit (the "already used" error); N8 Analysis · Entering results (desktop, tablet, phone: grouped parameter columns, FC as a calculated cell, a range warning, Save all, Finish Analysis, checklist); N9 Analysis · Finished · Upload RoA (desktop, phone); N10 Batch · Completed (RoA file attached).
- **Tokens:** collection "SGSI tokens" with **Light and Dark modes** in one collection (FigCraft allows several modes; the Starter plan of Figma did not): 53 colour variables and 4 radii. The product owner then corrected ten values in the app (nine dark, light `muted`); the rebuild reads them from `.context/design/figcraft/tokens/sgsi-tokens.json` and the full set is documented in `Design_Tokens.md`. Fills and strokes whose hex matches a token are bound to it; where several tokens share a hex the first in the list wins (for example Primary/primary before Action/action).
- **Components and instances:** a frame **Component library** (last row of the page) holds **41 main components** found by their repeated structure: Top Bar (several variants), Sidebar variants (expanded and collapsed, one per active item), Status chips, Button/Primary, Secondary and Outline variants, Input/Search, Step/Done, Current and Upcoming, Tab/Underline (on and off), Brand and Avatar. **764 places** in the screens are instances of them; text differences (labels, names, counts) are text properties `t0`, `t1`, ... on the instance, sizes and fill-width are set per instance. Changing a main component now reaches every screen that uses it. The component sheets (names ending "Components") still hold the original specimens as components and are not used by the screens. Form inputs (select, text field) stay as plain layers, because their width follows the container.
- **Job order states redrawn:** the awaiting-arrival and mark-as-not-received frames (desktop, tablet, phone) now show the five states: Received 4, **In batch 2** (batch B-2026-0421), Awaiting arrival 1, Not received 1, with the counts line "4 received · 2 in batch · 1 awaiting arrival · 1 not received". The Expected state is shown by the Samples frames of a job order without a batch (6 samples · 6 expected); the locked-row frame reads "12 samples · 12 received".
- **Tokens changed after the build:** the product owner corrected ten colour values in the app; the file now uses them (see `Design_Tokens.md`). The prototype still has the earlier dark values.
- **Open items:**
  1. Check the new and updated frames at the three sizes against the prototype (v28) once more; the checks so far were by screenshot of single frames.
  2. Dark frames are unchanged (dark mode is still due for its rework; the Dark mode of the variables is a preview). Two contrast findings in dark mode are listed in `Design_Tokens.md`.
  3. Phone status chips keep their old colours on the Analysis frames; the other unarrived-sample frames were visited only for the state changes above.
  4. Update the prototype's `styles.css` tokens from `tokens/sgsi-tokens.css`.
  5. Lab confirmation points 17 to 22 (15.10) are still defaults.
  6. The FigCraft app must be restarted once after fonts are installed (it indexes fonts at start); the command-line build already sees them.
- **Docs:** the spec changes of 15.9 are applied in `Coal_LIMS_Development_Spec.md` (section 1.1, 3.7, 8, 9.1, 9.2.1, S-09, S-18, V-29 to V-33, T-28, T-29, D-44 to D-49).

### 15.12 Status (Oct 29, 2026): prototype built, frames paused (earlier status)

- **Prototype:** Revision C is built and live (version 28 of https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo). 11 new headless checks (C1 to C8) plus all earlier suites pass.
- **Frames:** none of the Revision C frames (15.7) exist yet. The pen.dev plan limit was reached first, so the design source moved to **Figma** (file `p2AlLJbx2YhjoFDZ2W0ZDZ`). The pen.dev export is in `.context/design/` (`screens-export.html` and `export/*.png`).
- **Figma so far:** colour tokens (collection "SGSI tokens" Light, 53 variables, plus a separate "SGSI tokens · Dark" collection, because the Starter plan allows one mode per collection), the Sidebar/Expanded component and the Top Bar component. The Components sheet (36 components) and Job Order Components (18) were next; the build stopped when the Figma Starter plan's MCP tool-call limit was reached.
- **Method:** the export HTML is converted into layer specs by `scratchpad`-style scripts and built with the Plugin API through `use_figma`; a shared builder script is kept in the Figma file as a text layer. Flattened components become real Figma components where the layer name contains "/".
- **Still to do after the limit lifts:** Components sheets, Job Order Components, the reception desktop frames (with Revision C edits: Confirm reception, Photos column, no performer chip), the Preparation ADL-only frames, then the new Analysis, Photos sheet, batch number and Completed frames, then the remaining frames.
