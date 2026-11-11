# Token and component audit: app against the FigCraft design

Date: Nov 11, 2026. Sources: `SGSI-LIMS-screens.figcraft` (variables, text styles, effect styles, component sets) and `apps/web/src/styles/{tokens,app}.css`.

## Result in one line

Colours, radii, elevation and button sizes match the design exactly. Text sizes inside small components differ: the design uses 10 px where the app uses 12 px. That is a decision for the owner (see "Decision needed").

## Matches (no action)

| Area | Design | App |
|---|---|---|
| Colour tokens | 60 variables | 60 variables, every value identical (the design export doubles the group prefix in names, values are the same) |
| Dark theme | variable modes | same values in the two dark blocks of `tokens.css` |
| Radius | xs 4, sm 8, md 12, lg 16 | same |
| Elevation | 2xs, xs, md, lg, xl, 2xl, Focus ring | `--e-*` same stops; focus ring is a 3 px outline in `primary-200` |
| Display, Heading, Lead, Number | Newsreader 36/42, 28/34, 22/28, 18/24, 18/28, 30/34 | `.t-display`, `.t-h1` to `.t-num` same |
| Body | Noto Sans 14/22 | `.t-body` same |
| Overline, Data | JetBrains Mono 11/16 +1.5, 13/20 | same |
| Button | Primary, Secondary, Tertiary, Ghost; tones Default, Danger, Accent; sizes lg 40, md 32, sm 28, touch 44; padding 16/12/10/20; label 14/13/12 SemiBold | `.btn` same sizes, padding and label sizes |
| Button states | Default, Hover, Pressed, Focused, Disabled, Loading | all but Loading (see gaps) |
| Filter chip | 36 high, 14 padding, pill | `.chip` same |
| Search | 40 high, pill | `.tsearch` same |
| Dialog | sm 400, md 560, lg 800, radius 16, padding 24 | same |
| Card panel | radius 16, padding 20 | app padding 16 (see gaps) |
| Nav item | 44 high, radius 10, 14/22 Medium | same |
| Menu item | 36 high, radius 8 | `.menu` radius 12 container, rows match |

## Differences

| # | Component | Design | App | Effect |
|---|---|---|---|---|
| 1 | Table head | 10/14 SemiBold, 44 high | 12/16 Medium, 44 high | height matches, text is 2 px bigger |
| 2 | Status badge, Tag | 10/14 Medium (badge 26 high, tag 24 high) | 12/16 Medium | text 2 px bigger |
| 3 | Field label | 10/14 SemiBold | 12/16 SemiBold | text 2 px bigger |
| 4 | Avatar initials | 10/14 SemiBold (sizes 24 to 32) | 11 to 14 | small |
| 5 | Tab label | 12/20 Medium | 13/20 Medium | 1 px |
| 6 | Filter chip label | 12/20 SemiBold | 13/20 SemiBold | 1 px |
| 7 | Table cell text | 13/20 (no text style) | 13/20 | match, but the design has no style for it |
| 8 | Alert title | 12/20 SemiBold | 13/20 SemiBold | 1 px |
| 9 | Card panel padding | 20 | 16 | 4 px tighter in the app |
| 10 | Icon button sizes | 32, 36, 44 | 28, 32, 36, 44 | the app has an extra 28 |
| 11 | Text styles | no 13/20 body style, caption is 10/14 | `.t-sm` 13/20, `.t-cap` 12/16 | the app scale has two steps the design lacks |

## Gaps in the app

- Button **Loading** state is not built (no spinner).
- Key-value row key colour was `text-secondary`; fixed on Nov 11 to `text-muted` as in the design.
- Table hover row uses `surface-muted` (owner decision Nov 10); not re-checked against the design in this audit.

## Decision taken (Nov 11, 2026)

Option A: the app stays at 12 px. The design's Caption styles (S:14 to S:16) were changed to 12/16 and everything bound to them follows. Table rows 1 to 4, 6 and 8 now agree for Caption-styled text; Tab (12 in the design, 13 in the app), Filter chip, Card padding, the icon button 28 and the 13/20 body step are still open differences.

## Decision needed (kept for the record)

The design's 10 px caption text is below the usual 12 px minimum for readable UI. Two ways to close rows 1 to 8:

- **A (recommended):** keep the app at 12 px and 13 px, and update the design's Caption style to 12/16 and its component labels to match. The design then describes what ships.
- **B:** shrink the app to the design's 10 px. Matches the file, harder to read on a lab tablet.

Rows 9 to 11 follow the same choice. Nothing in this document has been changed in the app beyond the key colour until the owner picks.
