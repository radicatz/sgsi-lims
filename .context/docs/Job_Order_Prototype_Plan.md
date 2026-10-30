# Job Orders — Clickable Prototype Plan

Written Oct 27, 2026. **Built Oct 27, 2026** (see section 11). Builds on `Job_Order_Screen_Plan.md` (Revisions 2, 3 and 3b) and the frames in `screens.pen`. It replaces the section "Prototype and interaction" of that plan where the two differ: that section was written on Oct 21, before the modal forms, the contact and signatory dropdowns, the group-pill checklist and the Batches tab existed.

Dark mode is on hold (to be reworked later), so the prototype is **light mode only**.

## 1 · Goal

Let the CSO, the lab admin and the Preparation team click through the job order module on a laptop, a tablet and a phone, and react to it before any production code is written. The prototype copies the approved frames; it does not introduce new design.

Success means a reviewer can follow every flow in section 5 end to end, at all three widths, without being told where to click.

## 2 · Approach

| Question | Decision | Why |
| --- | --- | --- |
| Prototype in pen.dev or HTML? | **HTML** | The pen.dev tools available here have no frame links or click interactions (they cover drawing, components, variables, scripts, shaders and code export). Checked Oct 27 |
| Where does it live? | A private claude.ai artifact (a web page), linked from this plan; you decide whether to share the link with the lab | One URL that works on laptop, tablet and phone; nothing to install |
| Real backend? | **No.** Demo data in the page; changes kept in the viewer's own browser, with a **Reset demo** button | Fast to build; nothing can leak; each reviewer starts from the same state |
| Stack | React 18.3.1 and htm 3.1.1 from a CDN (no build step), Phosphor icons web font 2.1.1, Google Fonts (Montserrat, Newsreader, JetBrains Mono) | Same icon set and fonts as `screens.pen`; components are written once and reused, which a plain HTML page would not give |
| Design tokens | The `screens.pen` variables written out as CSS custom properties at the top of `prototype/src/styles.css` (light values only), so colours, radii, spacing and fonts match the file exactly | One source of truth; a token change in the file is one regeneration away |
| Logo | The original `images/sgsi-logo.png` and `assets/sgsi-logo-icon.png`, published with the page | Light mode only |
| Flow map (old "layer 1": arrows between frames in `screens.pen`) | **Replaced** by a Flows panel inside the prototype: each flow listed with its steps and a **Start** button that opens the right screen with the right data | A flow map of 1440-px frames in pen.dev would be huge and go stale; the panel is always in step with the prototype |

## 3 · What the reviewer sees

The page has two parts: the **app** and a slim **review bar** above it (it can be collapsed).

| Review bar control | Does |
| --- | --- |
| Width: Desktop 1440 · Tablet 834 · Phone 390 · Fit | Shows the app at that width inside the page (the layout switches as the real app would: expanded sidebar, collapsed rail, phone with drawer). On a real phone or tablet, Fit is the default |
| Role: CSO · Lab admin · Preparation | Switches the signed-in persona: Rina Kartika (CSO), Maya Lestari (Lab admin), Dedi Kurniawan (Preparation). Actions follow the permission rules: hidden when the role cannot use them, disabled with a reason when blocked by state |
| Flows | Opens the flow list (section 5); **Start** jumps to the first step with the needed data |
| Spec only | Lists the rules from section 6 that the prototype does not perform, so nobody mistakes a gap for a design decision |
| Reset demo | Restores the demo data |

## 4 · Scope

### Screens in the prototype, mapped to the frames

| Prototype view | Source frames in `screens.pen` |
| --- | --- |
| App shell: top bar, sidebar (expand and collapse), tablet rail, mobile drawer | Sidebar and Top Bar components; Dashboard v2 frames (sidebar open, collapsed) |
| Job orders list: status chips, search, filters, table, pagination, row menu; empty and no-results states | List · Desktop, Tablet, Mobile; List · Empty |
| New job order modal (desktop, tablet) and two-step full-screen form (mobile) | Create · Desktop, Tablet, Mobile Step 1, Step 2; P8 |
| Contact person dropdown: list, edit, add, remove | Contact dropdown · Desktop, Tablet (list and edit); Mobile contact sheet (list and edit); P10 |
| Default signatory dropdown: list, edit, add | Signatory dropdown · Desktop, Tablet (list and edit); Mobile signatory sheet (list and edit) |
| Parameter pills, templates, Ash analysis checklist | Create frames; Create · Ash analysis open · Desktop; P11 (coking coal with ASTM + GB/T) |
| Validation | P1 |
| Detail: header, actions, stepper, tabs Overview · Batches · Samples · Files · CoA · History | Detail · Overview, Samples, Batches (all widths); Batches · Empty |
| Add batch modal | Add batch · Desktop, Tablet |
| Samples grid: type, paste, paste preview, unsaved rows, locked rows | Samples frames; P2, P3, P4, P5 |
| CoA tab: states, Mark sent dialog (desktop) and sheet (mobile) | CoA · Mark sent; CoA · Sent; P9 |
| Cancel job order dialog | P7 |

### Parts not drawn in `screens.pen` yet

The prototype needs these to make the flows complete. Each is built from an existing pattern and carries a small **"Not drawn yet"** tag in the review bar's Spec only list, so it can be designed properly later.

| Part | Built from | Treatment |
| --- | --- | --- |
| Edit job order | New job order modal, pre-filled, title "Edit JO-2026-0142" | Built |
| Filters panel (desktop) and filter sheet (tablet, mobile) | Side panel and bottom sheet patterns | Built, simple: Client, CSO, Due range, Standard |
| Add batch on mobile | Add batch modal as a full-screen form | Built (the two mobile frames went missing on Oct 27) |
| Ash analysis checklist on mobile | Bottom sheet with the same checklist | Built |
| Trace elements checklist | Ash analysis checklist with the 36 elements | Built |
| Files tab, History tab | — | Placeholder panel: "Designed in a later round" |
| Import list wizard (S-16) | — | Spec only: the button shows a toast "Import is designed later" |
| Links to Dashboard, My work, Batches, Reports and Master data | — | A placeholder page "Outside this prototype" with a link back |

### Out of scope

Dark mode (on hold), real sign-in, real PDFs (Download opens a sample image of the CoA), saving to a server, the batch detail screen, reception (S-18), result entry.

## 5 · Flows

These replace the flow table in the screen plan. Start state is set by the Flows panel.

| ID | Flow | Role | Steps |
| --- | --- | --- | --- |
| F1 | Create a job order | CSO | List → **New job order** → modal → Company name (pick "PT Bara Nusantara Mandiri"; address fills) → Contact person: open dropdown → pick **Budi Hartono** (check moves to him, panel closes) → Standard ASTM (default) → template **TM + Prox + TS + CV** (default) → Expected samples 12 → Due date (suggested) → Default signatory: pick **Ir. Bambang Sutrisno, M.T.** → **Submit** → modal closes, toast "JO-2026-0143 submitted · Add samples" → detail opens on the **Samples** tab (P2) |
| F1a | Save as draft | CSO | As F1, then **Save as draft** with only the company filled → list shows the row with a Draft badge |
| F1b | Validation error | CSO | **Submit** with Company, Contact person and Expected samples empty → fields marked, summary "Fix 3 fields to submit" at the top, focus on the summary; each item jumps to its field (P1) |
| F1c | Add a new contact | CSO | Contact dropdown → **+ Add contact** → new row with Name, Phone, Email inputs; other rows and **+ Add contact** dimmed; the row's check becomes **Save** (floppy disk) → type "Kurnia Mega", phone → **Save** → contact added to the company, selected, panel closes. Missing name or phone keeps the row open with a message |
| F1d | Edit a contact | CSO | Contact dropdown → pencil on Sari Wulandari → her row turns into inputs → change the phone → **Save** → row updated |
| F1e | Add a signatory | CSO | Signatory dropdown → **+ Add signatory** → Name and Title inputs → **Save** → selected |
| F8 | Remove a contact | CSO | Contact dropdown → trash on Sari Wulandari → dialog "Remove Sari Wulandari from contacts?" → **Remove** → row gone, toast with **Undo**. The selected contact's trash is disabled with the tooltip "Choose another contact first" (P10) |
| F10 | Pick Ash analysis items | CSO | Parameters → **Ash analysis ▸** → checklist popover (9 of 29 preset, Na₂O among them) → search "SO" → tick SO₃ → **Apply · 10 parameters** → pill on, count updates; **Cancel** or Esc discards |
| F11 | Coking coal with two standards | CSO | Standard: ASTM + GB/T → template **Coking coal** → pills include G index and Y value (GB/T only) → Submit (P11) |
| F2 | Register sample IDs | CSO | Samples tab (empty) → **Paste from Excel** → paste preview: rows found, columns mapped, 1 duplicate flagged (P3) → **Add 12 rows** → grid filled, unsaved dots, duplicate message (P4) → fix the duplicate → **Save** → toast "12 samples saved" |
| F2b | Locked rows | CSO | JO with received samples → Samples tab → locked rows; hover shows who received them and when; editing refused with that message (P5) |
| F3 | Follow progress | CSO | List → chip **In progress** → row JO-2026-0142 → Overview: stepper on Analysis, Properties card, Batches card → **Batches** tab → batch row (opens "Outside this prototype") |
| F9 | Add a batch | CSO, Preparation or Lab admin (spec: `batch.create` is allowed for all three; the prototype first hid it from the CSO by mistake, fixed Oct 27) | JO-2026-0137 → **Batches** tab (empty) → **+ Add batch** → modal: first 8 of 16 samples ticked, Standard ASTM (GB/T is the other choice), HGI on, shown as "+ HGI compared with the job order" → **Create batch** → toast, new row "B-2026-0420 · ASTM · Created" |
| F4 | Send the CoA | CSO | List chip **Reported** → row → **CoA** tab → **Download** (sample image) → **Mark sent** → dialog: date today, channel WhatsApp, recipient pre-filled from the job order contact → **Confirm** → card shows "Sent via WhatsApp to Budi Hartono · 27 Oct"; status Delivered; stepper complete |
| F5 | Edit, cancel, close | CSO | `⋯` → **Edit** (modal pre-filled; disabled once a batch is in preparation, with the reason) · **Cancel** (dialog with a required reason; only before any sample is received) (P7) · **Close** (only when Delivered) |
| F6 | Read-only visit | Preparation | Role Preparation → list → detail → Samples tab shows the expected IDs without edit controls; hint "Receive samples in Reception" |
| F7 | Create on a phone | CSO | Phone width → list → sticky **New job order** → step 1 Company and Work (contact sheet, signatory sheet, Ash sheet) → **Next** → step 2 Report, Samples, Notes, Files → **Submit** → detail |

## 6 · Interaction rules that changed since Oct 21

Rules in the screen plan that are not listed here still apply.

| Part | Behaviour now |
| --- | --- |
| Contact person | One contact per job order. A select field showing name, phone and email (mobile: name and phone). Disabled until a company is chosen ("Select a company first"). Opens a dropdown (desktop, tablet) or bottom sheet (mobile) with the company's contacts: name, phone, email; **check** on the selected row only; pencil; trash; **+ Add contact** at the bottom. Clicking a row selects it and closes the panel. Edit or add switches to the edit state: the edited row becomes inputs, its check becomes **Save** (floppy disk), every other row and **+ Add contact** are dimmed and inactive. Save needs a name and a phone; email is optional and checked when given. Esc cancels the edit; Esc again closes the panel. Focus returns to the field. The field never shows more than one contact |
| Default signatory | Same pattern as Contact person: name and title, check on the selected row, pencil, trash, **+ Add signatory**; the edit row has Name and Title. The "Type name and title manually" button is gone |
| Group pills (Ash analysis ▸, Trace elements ▸) | Clicking the pill (not toggling it) opens a checklist popover anchored under the pill, 560 px, flipped above the pill when there is no room below; mobile uses a bottom sheet. Search filters the list as you type. Select all, Clear. **Apply · N parameters** turns the pill on when at least one item is ticked and off when none; **Cancel**, Esc or a click outside discards. The pill counts as one parameter in "N selected" |
| Parameter pills | Click or Space toggles. On: tinted fill, blue border and a check icon (not colour alone). Arrow keys move within a group. Dependent pills cannot be turned off; the tooltip names the dependant |
| Templates | Clicking a template replaces the selection and highlights that template; changing any pill afterwards removes the highlight (custom). No "Matches" label |
| Standard | Toggle chips ASTM, ISO, GB/T; at least one stays on (the last one cannot be turned off, with a tooltip). No helper line; the rule "one standard per batch" shows in Add batch, where the batch picks one of the job order's standards |
| Remove contact dialog | "Remove *name* from contacts?" / "Submitted job orders keep this contact's name on their documents." / Cancel, **Remove** |
| Modal (New job order, Edit, Add batch) | As in the screen plan: centered 720 px, scrim, Esc closes (asks "Discard changes?" when there is input), focus trapped and returned. Only one dropdown or popover open at a time; Esc closes the innermost layer first |
| Table header rows | `primary-50` background (visual only) |
| Mark sent | Recipient pre-filled from the job order contact |

## 7 · Demo data

| Item | Values |
| --- | --- |
| Job orders | 12, `JO-2026-0131` to `JO-2026-0142`, statuses spread over all seven, one past due, one cancelled, two with CoA sent (email, WhatsApp). Counts on chips and "Showing 1–10 of 12" are computed from the data, so they will not read 128 as the frames do |
| Key records | JO-2026-0142 (PT Bara Nusantara Mandiri, in Analysis, one batch B-2026-0417, 12 samples); JO-2026-0137 (16 samples registered, no batch yet, for F9); one Reported JO for F4; one Draft |
| Companies | PT Bara Nusantara Mandiri, PT Kaltara Energi Prima, CV Sumber Batu Hitam, PT Mahakam Coal Resources |
| Contacts | Budi Hartono and Sari Wulandari (PT Bara Nusantara Mandiri), one or two per other company; invented +62 numbers and company-domain emails |
| Signatories | Ir. Bambang Sutrisno, M.T. (Laboratory Manager) and Hendra Wijaya, S.T. (Laboratory Supervisor), from spec section 8.1 |
| People | Spec personas only: Rina Kartika (CSO), Maya Lestari (Lab admin), Dedi Kurniawan (Preparation), Fitri Handayani (Analyst) |
| Parameters | The 36 pills in 9 groups, the 29 Ash analysis items, the 36 trace elements, the four templates |

Correction found while planning: the signatory dropdown frames list "Maya Lestari, S.T. · Quality Manager" as the second signatory. In the spec, Maya Lestari is the lab admin (A.Md.). The prototype uses Hendra Wijaya, S.T., Laboratory Supervisor, and the frames should be corrected to match.

## 8 · Build plan

Each phase ends with a published update of the same link and a short note of what to try.

| Phase | Content | Check |
| --- | --- | --- |
| 1 · Skeleton | CSS variables from the design tokens; shell (top bar, sidebar expand and collapse, rail, drawer); routing; review bar (width, role, reset); demo data | Shell matches the Dashboard v2 and job order frames at 1440, 834, 390 |
| 2 · List | Status chips, search, filters, sort, pagination, row menu, empty and no-results states, mobile cards | F3 first half |
| 3 · Create | Modal and mobile steps; company select; contact and signatory dropdowns with edit and add; Standard; templates; pills; Ash and Trace checklists; validation; draft; submit | F1, F1a–F1e, F7, F8, F10, F11 |
| 4 · Detail | Header, actions, stepper, tabs; Overview; Batches and Add batch; Samples grid with paste, preview, unsaved, locked; CoA states and Mark sent; Edit, Cancel, Close | F2, F2b, F3, F4, F5, F6, F9 |
| 5 · Polish | Loading skeletons (shown briefly on navigation), error banner demo, toasts with Undo, keyboard shortcuts (`N`, `/`, Esc), focus handling, reduced motion; Flows panel and Spec only list complete | Every flow at all three widths; keyboard-only run of F1 |

Testing: each phase is opened in the pen.dev integrated browser at the three widths and compared against the frames by screenshot.

## 9 · Done when

- Every flow in section 5 can be followed end to end at 1440, 834 and 390.
- Every rule in section 6 and in the screen plan's interaction rules is either working or listed under Spec only.
- Every view in the section 4 table looks like its frame (layout, tokens, icons, copy); differences are listed in the prototype's Spec only list.
- Reset demo returns everything to the start state.

## 11 · Build result (Oct 27, 2026)

| Item | Result |
| --- | --- |
| Link | The existing artifact https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo was **updated in place**, so the link already shared with the lab keeps working. The old version stays in the artifact's history and as `.context/prototype/archive/job-order-prototype-v1.html` |
| Source | `.context/prototype/src/` (`index.html`, `styles.css`, `icons.js`, `data.js`, `app.js`, `app2.js`); `python .context/prototype/build.py` writes `.context/prototype/job-order-prototype.html`, which is what gets published |
| Stack as built | React 18.3.1 and react-dom 18.3.1 from cdnjs, htm 3.1.1 from unpkg; the 66 Phosphor icons used are embedded as SVG (the Phosphor web font needs a stylesheet the artifact host blocks); the logo is embedded |
| Open points | Answered by the defaults: job order module only; not-drawn parts built and tagged; Flows panel replaces the pen.dev flow map; signatory demo data uses Hendra Wijaya (frames still to fix) |
| Checked | A headless run of the built page (jsdom) clicks through the list, chips, search, F1, F1b, F1c, F1e, F8, F10, F11, F2, F9, F4, F5, F2b, F7 on a phone width and a Flows-panel start, with no console errors |
| Add batch button | One only: **Add batch** is a secondary button in the top-right of the Batches tab panel, for CSO, Preparation and Lab admin. The detail header has no Add batch (it shows **Add samples** while a job order has none), the phone `⋯` menu has none, and the empty state points to the button above |
| Review bar | The chevron at the far right hides the whole bar. While hidden, a small chevron-down tab stays fixed at the top edge (centered) and brings the bar back; the app then uses the full height |
| Coking pills by standard (Oct 28) | Version 25 of the live artifact applies the standards table from the screen plan: pills follow the selected Standard (and the batch's standard in Add batch). Checked in a headless run of every Standard combination, the template and Add batch. The live page was edited in place; **`prototype/src` no longer matches it** (the live pill labels are the long names such as "Gray King Coke Type"), so rebuild from the live copy `job-order-prototype.html`, not from `src`, until the source is merged |
| Reception and preparation (Oct 28) | Version 26 adds S-18 with flows F12 to F17 (see `Reception_Preparation_Screen_Plan.md`, section 12). `prototype/src` matches the live page again, including `reception.js` |
| Known limits | Width switching uses CSS `zoom` to fit 1440 px into smaller screens; on very old browsers without `zoom` the desktop view scrolls instead. Saved demo state lives in each reviewer's own browser |

## 10 · Open points

| # | Question | Default if not answered |
| --- | --- | --- |
| 1 | Scope: job order module only, or also Dashboard v2 and My work? | Job order module only; other nav items lead to "Outside this prototype" |
| 2 | Parts not drawn yet (section 4): build them in the prototype from existing patterns, or draw them in `screens.pen` first? | Build in the prototype, tagged "Not drawn yet"; Files and History stay placeholders |
| 3 | Replace the pen.dev flow map with the in-prototype Flows panel? | Yes |
| 4 | Fix the signatory demo data in the frames (Hendra Wijaya instead of Maya Lestari) now or with the next design round? | Next design round |

## 12 · Revisions B and C (Oct 28 and 29, 2026)

The prototype (https://claude.ai/artifact/73FDBne3B8rbFcXoa6dDZo, version 28) grew past the job order module. Source and `build.py` stay in `.context/prototype/`.

| Revision | What the prototype gained | Where it is specified |
| --- | --- | --- |
| B (Oct 28, version 27) | Unarrived samples released to the job order (Awaiting arrival, Not received), a late batch through Add batch, the Samples awaiting arrival queue | Reception plan section 14, spec D-41 |
| C (Oct 29, version 28) | Roles CSO, Lab admin and Preparation confirm reception; photos at reception; editable batch number; ADL-only preparation with Entered by; the Analysis tab with calculated FC and range warnings; signed RoA upload and Complete batch; five sample states; a new **Analyst** role (Fitri Handayani); a **Light / Dark** switch in the review bar; flows F18 to F23 | Reception plan section 15, spec sections 1.1 and 9.2.1 |

Headless checks: all earlier suites plus the C1 to C8 checks pass. The prototype and the FigCraft frames (`.context/design/figcraft`) cover the same Revision C screens; where they differ, the prototype is the behaviour reference and the frames are the visual reference. Frames still to redraw for the five sample states are listed in section 15.13 of the Reception plan.
