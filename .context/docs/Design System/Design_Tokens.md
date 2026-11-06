# SGSI LIMS Design Tokens

Nov 4, 2026 (values updated; first written Oct 29) · source of truth: the colour variables in `.context/design/figcraft/SGSI-LIMS-screens.figcraft` (collection **SGSI tokens**, exported to `.context/design/figcraft/tokens/sgsi-tokens.json` and `sgsi-tokens.css`)

Written for: designers and developers who build or restyle screens.

## 1. What changed, and where the values come from

**Change log after Oct 29, 2026.** The product owner adjusts values in the FigCraft file; `tokens/sgsi-tokens.json` and `tokens/sgsi-tokens.css` are re-exported from it and the tables below show the current values.

Nov 4, 2026 (light mode):

| Token | Before | Now |
| --- | --- | --- |
| `Primary/primary-100` | `#E3EAF4` | `#E9EEF4` |
| `Status/st-analysis-100` | `#E3EAF4` | `#D9E5F7` |
| `Feedback/error-100` | `#F8E3DC` | `#FEE9E1` |

Nov 3, 2026:

| Token | Mode | Before | Now |
| --- | --- | --- | --- |
| `Text/text-muted` | Light | `#7D8699` | `#A4A39A` |
| `Text/text-muted` | Dark | `#7F8DA6` | `#435C86` |
| `Text/heading` | Dark | `#F4F7FB` | `#C0D8F9` |
| `Text/text-secondary` | Dark | `#A9B6CC` | `#92AEDD` |
| `Text/text-inverse` | Dark | `#0A1A33` | `#FFFFFF` |
| `Primary/primary-deep` | Dark | `#8CA4C6` | `#588DD9` |
| `Primary/primary-50` | Dark | `#0F1E36` | `#14243D` |
| `Primary/primary-100` | Dark | `#B6C9E7` | `#2A4A7D` |
| `Primary/primary-200` | Dark | `#1E3A66` | `#274C86` |
| `Accent/accent-text` | Dark | `#A9C6F5` | `#6D8FE7` |
| `Surface/muted` | Dark | `#14243D` | `#1D3050` |

Contrast to review (section 4): `Text/text-muted` on card is 2.5 in light and 2.4 in dark, below the 4.5 needed for body text; the job order and batch headers use it for contact, PO, due date and other meta items. Keep muted for placeholders and meta, never for values the user must read.

The tokens started as the `screens.pen` variables (Revision 2, mirrored in the prototype's `styles.css`). On Oct 29, 2026 the product owner corrected the colours **inside the FigCraft file**. This document records the corrected set exactly as exported from that file. Where the older documents (research plan, screen plans) or the prototype show other values, **this file wins**.

Ten values differ from the earlier set (one light, nine dark):

| Token | Mode | Earlier | Now |
| --- | --- | --- | --- |
| `Primary/primary` | Dark | `#122B52` | `#3D69B0` |
| `Primary/primary-deep` | Dark | `#081B38` | `#588DD9` |
| `Primary/primary-100` | Dark | `#14284A` | `#2A4A7D` |
| `Accent/accent` | Dark | `#8DB4F0` | `#F1AA41` |
| `Surface/background` | Dark | `#0A1424` | `#03060C` |
| `Surface/shell` | Dark | `#0D1A2E` | `#0F1929` |
| `Surface/card` | Dark | `#101F36` | `#152032` |
| `Surface/muted` | Light | `#F3EEE3` | `#F9F6F1` |
| `Status/st-created` | Dark | `#9AA3B8` | `#485470` |
| `Status/st-created-100` | Dark | `#1F2638` | `#293044` |

Reading the dark changes: `primary` is now a mid blue (`#3D69B0`) instead of a near-black navy, so the primary button and the active elements stand out on the dark surfaces (the problem the research plan lists under "Problems found in the dark preview"). `primary-deep` and `primary-100` become light blues, because in dark mode they carry text and tints on dark surfaces. `accent` returns to the amber family (`#F1AA41`); the lighter-blue accent of Revision 2 (`#8DB4F0`) now lives in `feedback-info`, `status-analysis` and `action`. Surfaces are darker (`background #03060C`) with the card lifted above the shell (`#152032` over `#0F1929`). `status-created` is a dimmer grey-blue. In light mode only `muted` changed (`#F3EEE3` to `#F9F6F1`, lighter and closer to the cream background).

## 2. How the tokens are organised

- One collection, **SGSI tokens**, with two modes: **Light** (default) and **Dark**. FigCraft allows several modes in a collection; the Figma Starter plan did not, which is why the earlier Figma attempt used two collections.
- Names are `Group/token`. Groups: Primary, Accent, Rust, Surface, Text, Feedback, Status, Action, Other, Shadow, plus `radius/*` numbers. The CSS export turns them into `--group-token` (for example `--surface-card`, `--text-text-muted`); the prototype uses the shorter `--card`, `--text-muted`. The mapping is the token name without its group prefix.
- **Alias duplicates:** several tokens carry the same colour on purpose, because they mean different things. In light mode `#1B3A6F` is `primary`, `action`, `brand-text`, `feedback-info` and `status-analysis`; `#0E2A4E` is `primary-deep`, `text-heading`, `action-strong`, `nav-active` and `review`. Keep them separate: dark mode pulls them apart.
- **Binding in the design file:** fills and strokes whose hex matched a token were bound by value. Where several tokens share a hex the **first** in the list was used (for example `Primary/primary` rather than `Action/action`), so most bound fills show the colour's base name, not its role. When you restyle a role, bind by role.
- Not tokens (raw values in the file): gradients, the scrim (`#0E2A4E66`) and alpha fills.

## 3. Colour tokens

### Primary

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Primary/primary` | `#1B3A6F` | `#3D69B0` | Brand blue; primary button fill, selected tab and pill outlines |
| `Primary/primary-deep` | `#0E2A4E` | `#588DD9` | Headings on tints, notification button, strong blue text |
| `Primary/primary-hover` | `#15305C` | `#0E2347` | Hover and pressed state of primary |
| `Primary/primary-50` | `#F0F4FA` | `#14243D` | Table header rows, selected pill fill |
| `Primary/primary-100` | `#E9EEF4` | `#2A4A7D` | Secondary button fill, avatar fill, info tint |
| `Primary/primary-200` | `#C5D2E6` | `#274C86` | Soft outlines on blue tints |
| `Primary/primary-300` | `#9AB0D2` | `#3A5A8E` | Disabled and decorative blue |
| `Primary/primary-400` | `#5F7FB0` | `#6E8EC0` | Chart blue, secondary icons on tints |

### Accent

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Accent/accent-soft` | `#F4B860` | `#A9C6F5` | Soft highlight |
| `Accent/accent-100` | `#FCEFD9` | `#1E3A66` | Amber tint (Preparation chip, search button, hint boxes) |
| `Accent/accent-text` | `#9A5A00` | `#6D8FE7` | Text on the amber tint |
| `Accent/accent` | `#E89010` | `#F1AA41` | Highlights and the current stepper marker |

### Rust

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Rust/rust` | `#C04020` | `#E2573A` | Errors, destructive actions, required marks |
| `Rust/rust-100` | `#F8E3DC` | `#3A1D16` | Error tint |

### Surface

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Surface/background` | `#F6F1E6` | `#03060C` | Page background |
| `Surface/shell` | `#FBF9F4` | `#0F1929` | App shell and panels behind cards |
| `Surface/card` | `#FFFFFF` | `#152032` | Cards, inputs, dialogs, tables |
| `Surface/muted` | `#F9F6F1` | `#1D3050` | Disabled inputs, read-only cells, calculated cells, count pills |
| `Surface/sand` | `#EDE5D2` | `#1A2C48` | Neutral fills and skeletons |
| `Surface/border` | `#E8DFC9` | `#1F3250` | Card and input outlines |
| `Surface/border-strong` | `#D9CFB8` | `#2C4468` | Emphasised outlines, stepper lines, drop zones |
| `Surface/divider` | `#F0EADC` | `#172740` | Row dividers, header underlines |

### Text

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Text/foreground` | `#1A1A1A` | `#EDF1F7` | Body text |
| `Text/heading` | `#0E2A4E` | `#C0D8F9` | Headings |
| `Text/text-secondary` | `#4A5876` | `#92AEDD` | Secondary text, labels |
| `Text/text-muted` | `#A4A39A` | `#435C86` | Hints, placeholders, units |
| `Text/text-inverse` | `#FFFFFF` | `#FFFFFF` | Text on filled primary surfaces |

### Feedback

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Feedback/success` | `#2E7D5B` | `#4FB287` | Success text and icons |
| `Feedback/success-100` | `#E2F2EA` | `#12302A` | Success tint |
| `Feedback/warning` | `#9A5A00` | `#E8A93A` | Warning text and icons |
| `Feedback/warning-100` | `#FCEFD9` | `#3A2E12` | Warning tint |
| `Feedback/error` | `#C04020` | `#E2573A` | Error text and icons |
| `Feedback/error-100` | `#FEE9E1` | `#3A1D16` | Error tint |
| `Feedback/info` | `#1B3A6F` | `#8DB4F0` | Info text and icons |
| `Feedback/info-100` | `#E3EAF4` | `#1E3A66` | Info tint |

### Status

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Status/st-created` | `#6B7385` | `#485470` | Batch status Created |
| `Status/st-created-100` | `#EEEFF2` | `#293044` | Created chip background |
| `Status/st-prep` | `#9A5A00` | `#E8A93A` | Batch status Preparation |
| `Status/st-prep-100` | `#FCEFD9` | `#3A2E12` | Preparation chip background |
| `Status/st-analysis` | `#1B3A6F` | `#8DB4F0` | Batch status Analysis |
| `Status/st-analysis-100` | `#D9E5F7` | `#1E3A66` | Analysis chip background |
| `Status/st-finished` | `#6A4BA8` | `#B79CF0` | Batch status Analysis finished |
| `Status/st-finished-100` | `#EEE8F8` | `#2B2244` | Finished chip background |
| `Status/st-completed` | `#2E7D5B` | `#4FB287` | Batch status Completed |
| `Status/st-completed-100` | `#E2F2EA` | `#12302A` | Completed chip background |

### Action

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Action/action` | `#1B3A6F` | `#8DB4F0` | Button fill and links; the interactive colour |
| `Action/action-hover` | `#15305C` | `#A9C6F5` | Hover of action |
| `Action/action-foreground` | `#FFFFFF` | `#0A1A33` | Text and icons on action |
| `Action/action-strong` | `#0E2A4E` | `#8DB4F0` | Strong action (confirm dialogs) |
| `Action/brand-text` | `#1B3A6F` | `#8DB4F0` | Brand name text |
| `Action/nav-active` | `#0E2A4E` | `#1E3A66` | Active navigation item |

### Other

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Other/review` | `#0E2A4E` | `#081B38` | Review bar and presentation chrome |
| `Other/review-fg` | `#FFFFFF` | `#FFFFFF` | Text on the review bar |

### Shadow

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `Shadow/deep` | `#0E2A4E` | `#06071A` | Tightest, darkest layer of every elevation step |
| `Shadow/mid` | `#264164` | `#06071A` | Middle layer of steps xs to 2xl |
| `Shadow/light` | `#365071` | `#06071A` | Widest, softest layer of steps xs to 2xl |

### Radii (numbers, the same in both modes)

| Token | px | Use |
| --- | --- | --- |

### Elevation (shadow scale)

Six steps, **2xs** to **2xl**. Each step stacks one to three drop shadows whose colours are the three Shadow tokens above, so dark mode swaps them automatically. Offsets, blur and spread are plain numbers, not variables. Specimens: Foundations frame, section 03 *Spacing, radius & elevation*.

| Step | Layers (x, y, blur, spread · colour token) |
| --- | --- |
| **2xs** | 0, 2, 2, 0 · `Shadow/mid`<br>0, 4, 4, 0 · `Shadow/light` |
| **xs** | 0, 1, 2, 0 · `Shadow/deep`<br>0, 2, 2, 0 · `Shadow/mid`<br>0, 4, 6, 0 · `Shadow/light` |
| **md** | 0, 2, 6, 0 · `Shadow/deep`<br>0, 4, 6, 0 · `Shadow/mid`<br>0, 6, 8, 0 · `Shadow/light` |
| **lg** | 0, 2, 6, 1 · `Shadow/deep`<br>0, 4, 6, 2 · `Shadow/mid`<br>0, 6, 8, 2 · `Shadow/light` |
| **xl** | 0, 4, 8, 2 · `Shadow/deep`<br>0, 8, 8, 4 · `Shadow/mid`<br>0, 10, 10, 6 · `Shadow/light` |
| **2xl** | 0, 6, 8, 4 · `Shadow/deep`<br>0, 10, 10, 8 · `Shadow/mid`<br>0, 12, 12, 12 · `Shadow/light` |

Colours: Light mode navy at 12 %, 5 % and 2 % (`deep`, `mid`, `light`); Dark mode near-black `#06071A` at 25 %, 20 % and 15 %, because a navy shadow disappears on dark surfaces.

Use (owner rule, Nov 6, 2026): **2xs** resting cards and inputs; **xs** raised elements that sit on another surface: raised cards, sticky bars, and floating badges such as the top bar's unread Count pill; **md** menus, popovers, dropdowns, tooltips; **lg** dialogs; **xl** bottom sheets (the Side sheet was removed Nov 5); **2xl** the largest overlays. A floating badge shares a wrapper frame with the element it follows (the top bar's Bell frame), so it moves with it.

## 4. Contrast of the main pairs

WCAG 2 contrast ratios computed from the exported values (4.5 is the AA minimum for body text, 3 for large text and icons).

| Pair | Light | Dark |
| --- | --- | --- |
| `Text/foreground` on `Surface/card` | 17.4 | 14.4 |
| `Text/heading` on `Surface/card` | 14.4 | 11.2 |
| `Text/text-secondary` on `Surface/card` | 7.1 | 7.3 |
| `Text/text-muted` on `Surface/card` | 2.5 (below 4.5) | 2.4 (below 4.5) |
| `Text/text-muted` on `Surface/muted` | 2.4 (below 4.5) | 2.0 (below 4.5) |
| `Action/action-foreground` on `Action/action` | 11.2 | 8.2 |
| `Text/text-inverse` on `Primary/primary` | 11.2 | 5.5 |
| `Feedback/success` on `Surface/card` | 5.0 | 6.3 |
| `Feedback/error` on `Surface/card` | 5.3 | 4.4 (below 4.5) |
| `Feedback/warning` on `Surface/card` | 5.5 | 7.9 |
| `Accent/accent-text` on `Accent/accent-100` | 4.8 | 3.6 (below 4.5) |
| `Status/st-created` on `Status/st-created-100` | 4.1 (below 4.5) | 1.7 (below 4.5) |
| `Status/st-prep` on `Status/st-prep-100` | 4.8 | 6.4 |
| `Status/st-analysis` on `Status/st-analysis-100` | 8.8 | 5.4 |
| `Status/st-finished` on `Status/st-finished-100` | 5.5 | 6.4 |
| `Status/st-completed` on `Status/st-completed-100` | 4.3 (below 4.5) | 5.4 |
| `Primary/primary-deep` on `Primary/primary-50` | 13.0 | 4.6 |
| `Action/brand-text` on `Surface/shell` | 10.6 | 8.3 |

A pair below 4.5 is acceptable only for large text, icons and bold chip text of 13 px or more if the ratio is 3 or higher; anything lower needs a change. Check the list again after every token edit.

## 5. Where the tokens are used

- **FigCraft file:** the variables above (56 colours, 4 radii; the elevation steps are layer settings that use the three Shadow colours). `tools/tokens.js` creates them from `tokens/sgsi-tokens.json` on every rebuild, so an edit made in the app must be re-exported with `variable.export` to survive a rebuild.
- **Prototype (`.context/prototype/src/styles.css`):** still carries the **earlier** values (and a few extra tokens: `scrim`, shadows, `review-soft`, `review-line`). Update its `:root` and `:root[data-theme="dark"]` blocks from `sgsi-tokens.css` before the next prototype release; until then the prototype's dark preview differs from the design file.
- **Older documents:** the research plan's dark-mode section (Revisions 1 and 2) describes the superseded dark values and keeps them as history. The screen plans quote light values that did not change, except `muted`.
- **Development:** map the CSS export to the app's theme (Tailwind `@theme` or CSS custom properties). `variable.export` can also write a Tailwind v4 stylesheet and a Dart file.
