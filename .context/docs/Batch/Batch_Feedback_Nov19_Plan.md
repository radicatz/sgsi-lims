# Batch feedback, Nov 19: plan

Owner feedback after slice B. Three parts:
1. The Analysis table and the status pills.
2. The phone rows for Reception, Preparation and Analysis.
3. A horizontal stepper on the phone, for both the batch and the job order.

Every change is compared with its FigCraft frame at 1440, 834 and 390.

Nothing changes in the API or the database. This is web work only, plus test updates.

---

## 1. Batches: Analysis table and status pills

### 1a. Status pill (frame Desktop-04-02-10 Preparation_entering_ADL, Status column)

**In the frame:** "● Received" is a fully rounded pill with a dot in front of the label.

**In the app:** the Preparation Status column uses `Tag`, which has a 6 px radius and no dot.

**Change:** use `Badge` there instead: 999 px radius, a 6 px dot, and the same green or red tone.
- `Received` uses the green tone.
- `Held` uses the red tone.

**What stays a Tag:** `Saved` / `Pending` (Preparation) and `Printed` / `Not printed` (Reception) stay as Tags, because the frames draw them square with an icon.

### 1b. Analysis table (frame Desktop-04-02-12 Analysis_entering_results; tablet uses the same rules)

| | Frame | App now | Change |
|---|---|---|---|
| Box around the table | none | 1 px border, 8 px radius | Remove the border and the radius from `.agrid-wrap`. |
| Group row (Moisture, Proximate…) | No fill, 28 px high, left aligned, padding 0 8. Text in the Overline style: JetBrains Mono Medium 11/16, 1.5 px letter-spacing, upper case, `--text-muted`. | Grey fill, Noto Sans 600, centred, a line between groups | Transparent background, no lines, left aligned, Overline style (the `.t-over` token set). |
| Head row | `--primary-50` (#F0F4FA), 48 px high, 8 px radius at both ends | `--surface-muted` (beige), square | Use `--primary-50`, the same as `.tbl th`. Round the first and last head cells. |
| Head text | Caption SemiBold 12/16, `--text-secondary`, **left aligned**, with the unit below in Caption Regular 12/16 `--text-muted` | 14 px heading colour, right aligned | Match the frame. `#` and `Sample code` use the same caption style. |
| Rows | 48 px high, cells padded 0 4, a 1 px `--surface-divider` line under every row, the last row included | Padding 8 10, `--surface-border` lines, no line under the last row | Match the frame. |
| `#` | JetBrains Mono 13, `--text-muted` | body font | Mono 13, muted. |
| Sample code | JetBrains Mono SemiBold 13, `--text-heading` | same | No change. |
| Column width | 96, with an 88 px value box (radius 4, `--surface-border-strong`) | min 104 | 96 / 88. |
| FC / NCV box | `--surface-subtle` fill (#F9F6F1), `--surface-border` stroke, ƒ mark | close | Check the tokens only. |

**Unchanged:** the sticky `#` and Sample code columns (B1), with their shadow once the table is scrolled. The sticky head cells take the new head colour.

**Label stays:** the frame says "Sample ID" for the second column, but spec 6.1 wins, so the label stays "Sample code".

---

## 2. Phone: one card with rows, not a card per sample

**Reference frames:**
- Reception: Phone-04-02-01 Reception_receiving ref.
- Preparation: Phone-04-02-10 Preparation_entering_ADL ref.
- Analysis: Phone-04-02-12 Analysis_entering_results ref.

### Shared pattern (all three tabs)

- **One card:** a single `Card` titled Reception, Preparation or Analysis, with 16 px padding, a 16 px radius, and the `--surface-border` stroke. The title is Newsreader SemiBold 18.
- **Rows:** inside the card, one row per sample. A row has padding 12 / 0 and no border of its own. Rows are separated by a 1 px `--surface-divider` line, including after the last row.
- **Ids line:**
  - Client reference: JetBrains Mono SemiBold 13, `--text-heading`.
  - Sample code: JetBrains Mono Regular 13, `--text-secondary`, 8 px gap.
- **Field labels:** Body small SemiBold 12, `--text-secondary`.
- **Inputs:** 44 px high, Noto Sans 14, 8 px radius, `--surface-border-strong`.
- **Checklist:** stays at the bottom of the same card. The sticky action bar is unchanged.
- **CSS:** a new class `.prow` for a row; `.rc` is removed. The ids `#rc-<id>` stay for the tests.

### Reception row (top to bottom)

1. **Top line:** the ids on the left. On the right, the `…` row menu as a 44 px ghost icon button. The menu moves up from the label line.
2. **Arrived:** the checkbox with its label, on its own line. It is no longer in the top-right corner.
3. **Held:** if the sample is held, the red "Held: reason" line.
4. **Mass and Condition:** two fields side by side, 10 px apart.
5. **Remark:** the remark field when the condition needs one. When it is read-only, the remark shows as Caption 12 `--text-secondary`.
6. **Photo strip:**
   - **Left:** the thumbnail, 56 × 56 with a 12 px radius on `--surface-muted`.
   - **Right:** the "Add photo" button: secondary, 40 px high, pill shaped.
7. **Label line:** the Printed / Not printed tag on the left; the printed date and time on the right, as Caption 12 `--text-muted`.

A sample that has not arrived shows only lines 1 and 2, as in the frame.

### Preparation row

1. Ids.
2. "ADL (%)" label and the field, full width.
3. A warning line below the field when the value is out of range.
4. **"Who" line:** a 24 px avatar, the name (Body small 12 `--text-secondary`), then the date and time (`--text-muted`). It shows only once a value is saved.

The Saved / Pending tag is not in the phone frame, so it is dropped there. An unsaved value already shows as an edited field.

### Analysis row

1. Ids.
2. **Groups:** for each category, an Overline group label (Moisture, Proximate…), then that category's fields **two to a line**.
   - Field label: "TM (%, ar)".
   - FC and Net CV are the read-only calculated field (ƒ).
3. A held sample shows "On hold" instead of its fields.

The card head keeps "26 of 36 values saved", Started, and the analyst.

---

## 3. Horizontal stepper on the phone (batch and job order)

**Frame:** the stepper card in Phone-04-02-01 Reception_receiving ref.

### Layout

- The same horizontal stepper as on desktop, inside the 16 px card.
- **Steps:** each step is **104 px wide and does not shrink**: a 24 px marker, 6 px gap, the name in 12/20 SemiBold, and the note in 12/16.
- **Line:** a 2 px line joins the markers. It is green up to the current step and the border colour after it.
- **Overflow:** the row is wider than the card (6 × 104 = 624 px), so it **scrolls sideways** inside the card. There is no visible scrollbar (as in the frame); touch scrolling works.
- **Cleanup:** the vertical stepper (`.stepper.vert` and the `vertical` prop) is removed.

### Opening position

When the page opens, the stepper scrolls so the **current step is centred**, for example Analysis on a batch in analysis.
- It jumps there instantly, with no animation, because it is the first view.
- It only scrolls the stepper sideways, never the page.
- It runs again if the status changes while the page is open.
- The same logic sits in the shared `Stepper` component, so the batch page and the job order page both get it. The same applies on tablet and desktop whenever the steps do not fit.

---

## Files

| File | Change |
|---|---|
| `components/display.tsx` | `Stepper`: drop `vertical`, add the scroll-to-current effect |
| `styles/tables.css` | Stepper phone sizes and hidden scrollbar; remove `.stepper.vert` |
| `features/batches/Page.tsx`, `features/orders/Detail.tsx` | Remove `vertical={phone}` |
| `features/batches/Preparation.tsx` | Status column becomes `Badge`; phone rows |
| `features/batches/Reception.tsx` | Phone rows in one card |
| `features/batches/Analysis.tsx` | Grid head markup (unit under the label, left aligned); phone rows with groups |
| `styles/batches.css` | `.agrid` restyle, `.prow` rows, remove `.rc` |
| `e2e/phase3-batches.spec.ts` | `rowOf` on the phone uses `.prow` |
| `e2e/phase2-orders.spec.ts` | Line 198: check that the stepper is horizontal and the current step is in view, not `.stepper.vert` |

## Checks

- Typecheck web.
- e2e `phase3-batches`, `phase3-batches-b` and `phase2-orders` at desktop, tablet and phone.
- Screenshots of Reception, Preparation, Analysis and the job order Overview at 1440, 834 and 390, compared with the frames.

## Decisions (owner, Nov 19)

1. **Lock icon in the Reception phone row: keep it, with the app's rule.**
   - **What it is:** the lock means "Reception is confirmed, so the rows can't change". The app already shows it with that tooltip (`Reception.tsx`, only after Confirm reception).
   - **Docs:** `Batch_Screen_Plan.md` line 98 and `Batch_Build_Design.md` section on locks both say the Reception tab turns read-only after Confirm reception, with lock icons, as on the job order Samples tab.
   - **The frame:** the ref frame (Phone-04-02-01) is the Receiving state, but it draws the lock on the two arrived rows. That is a drawing slip, not a rule: the lock is not a "label printed" marker.
   - **In the app:** the lock shows only once reception is confirmed, on every row, as a disabled 44 px ghost icon button left of the `…` menu, as in the frame. While receiving, only `…` shows.
2. **ADL warning on the phone: amber.** The border and fill are amber, with "Above 20 %: check the value." in amber under the field.
3. **"Global" in point 1: batch tabs only.** Every per-row status label in the Batch tabs becomes the round pill with a dot (Received and Held in Preparation). Square tags that carry an icon (Saved / Pending, Printed / Not printed) keep their shape. The rest of the app is not touched.
