const fs = require("fs");
const j = require("../fc/user-tokens.json"); const m = j.meta || j;
const col = Object.values(m.variableCollections)[0]; const ids = col.modes.map((x) => x.modeId || x.id);
const hx = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const V = Object.values(m.variables);
const T = {}; V.forEach((v) => { T[v.name] = v.resolvedType === "COLOR" ? { L: hx(v.valuesByMode[ids[0]]), D: hx(v.valuesByMode[ids[1]]) } : { L: v.valuesByMode[ids[0]], D: v.valuesByMode[ids[1]] }; });
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const USE = {
  "Primary/primary": "Brand blue; primary button fill, selected tab and pill outlines",
  "Primary/primary-deep": "Headings on tints, notification button, strong blue text",
  "Primary/primary-hover": "Hover and pressed state of primary",
  "Primary/primary-50": "Table header rows, selected pill fill",
  "Primary/primary-100": "Secondary button fill, avatar fill, info tint",
  "Primary/primary-200": "Soft outlines on blue tints",
  "Primary/primary-300": "Disabled and decorative blue",
  "Primary/primary-400": "Chart blue, secondary icons on tints",
  "Accent/accent": "Highlights and the current stepper marker",
  "Accent/accent-soft": "Soft highlight",
  "Accent/accent-100": "Amber tint (Preparation chip, search button, hint boxes)",
  "Accent/accent-text": "Text on the amber tint",
  "Rust/rust": "Errors, destructive actions, required marks",
  "Rust/rust-100": "Error tint",
  "Surface/background": "Page background",
  "Surface/shell": "App shell and panels behind cards",
  "Surface/card": "Cards, inputs, dialogs, tables",
  "Surface/muted": "Disabled inputs, read-only cells, calculated cells, count pills",
  "Surface/sand": "Neutral fills and skeletons",
  "Surface/border": "Card and input outlines",
  "Surface/border-strong": "Emphasised outlines, stepper lines, drop zones",
  "Surface/divider": "Row dividers, header underlines",
  "Text/foreground": "Body text",
  "Text/heading": "Headings",
  "Text/text-secondary": "Secondary text, labels",
  "Text/text-muted": "Hints, placeholders, units",
  "Text/text-inverse": "Text on filled primary surfaces",
  "Feedback/success": "Success text and icons",
  "Feedback/success-100": "Success tint",
  "Feedback/warning": "Warning text and icons",
  "Feedback/warning-100": "Warning tint",
  "Feedback/error": "Error text and icons",
  "Feedback/error-100": "Error tint",
  "Feedback/info": "Info text and icons",
  "Feedback/info-100": "Info tint",
  "Status/st-created": "Batch status Created",
  "Status/st-created-100": "Created chip background",
  "Status/st-prep": "Batch status Preparation",
  "Status/st-prep-100": "Preparation chip background",
  "Status/st-analysis": "Batch status Analysis",
  "Status/st-analysis-100": "Analysis chip background",
  "Status/st-finished": "Batch status Analysis finished",
  "Status/st-finished-100": "Finished chip background",
  "Status/st-completed": "Batch status Completed",
  "Status/st-completed-100": "Completed chip background",
  "Action/action": "Button fill and links; the interactive colour",
  "Action/action-hover": "Hover of action",
  "Action/action-foreground": "Text and icons on action",
  "Action/action-strong": "Strong action (confirm dialogs)",
  "Action/brand-text": "Brand name text",
  "Action/nav-active": "Active navigation item",
  "Other/review": "Review bar and presentation chrome",
  "Other/review-fg": "Text on the review bar",
  "radius/xs": "Checkbox, small chips", "radius/sm": "Inputs, buttons", "radius/md": "Cards inside panels", "radius/lg": "Panels and dialogs",
};
const groups = ["Primary", "Accent", "Rust", "Surface", "Text", "Feedback", "Status", "Action", "Other"];
const old = { "Primary/primary": ["D", "#122B52"], "Primary/primary-deep": ["D", "#081B38"], "Primary/primary-100": ["D", "#14284A"], "Accent/accent": ["D", "#8DB4F0"], "Surface/background": ["D", "#0A1424"], "Surface/shell": ["D", "#0D1A2E"], "Surface/card": ["D", "#101F36"], "Surface/muted": ["L", "#F3EEE3"], "Status/st-created": ["D", "#9AA3B8"], "Status/st-created-100": ["D", "#1F2638"] };
let o = "";
o += "# SGSI LIMS Design Tokens\n\nOct 29, 2026 · source of truth: the colour variables in `.context/design/figcraft/SGSI-LIMS-screens.figcraft` (collection **SGSI tokens**, exported to `.context/design/figcraft/tokens/sgsi-tokens.json` and `sgsi-tokens.css`)\n\nWritten for: designers and developers who build or restyle screens.\n\n";
o += "## 1. What changed, and where the values come from\n\nThe tokens started as the `screens.pen` variables (Revision 2, mirrored in the prototype's `styles.css`). On Oct 29, 2026 the product owner corrected the colours **inside the FigCraft file**. This document records the corrected set exactly as exported from that file. Where the older documents (research plan, screen plans) or the prototype show other values, **this file wins**.\n\n";
o += "Ten values differ from the earlier set (one light, nine dark):\n\n| Token | Mode | Earlier | Now |\n| --- | --- | --- | --- |\n";
Object.entries(old).forEach(([n, [md, v]]) => { o += "| `" + n + "` | " + (md === "L" ? "Light" : "Dark") + " | `" + v + "` | `" + T[n][md] + "` |\n"; });
o += "\nReading the dark changes: `primary` is now a mid blue (`#3D69B0`) instead of a near-black navy, so the primary button and the active elements stand out on the dark surfaces (the problem the research plan lists under \"Problems found in the dark preview\"). `primary-deep` and `primary-100` become light blues, because in dark mode they carry text and tints on dark surfaces. `accent` returns to the amber family (`#F1AA41`); the lighter-blue accent of Revision 2 (`#8DB4F0`) now lives in `feedback-info`, `status-analysis` and `action`. Surfaces are darker (`background #03060C`) with the card lifted above the shell (`#152032` over `#0F1929`). `status-created` is a dimmer grey-blue. In light mode only `muted` changed (`#F3EEE3` to `#F9F6F1`, lighter and closer to the cream background).\n\n";
o += "## 2. How the tokens are organised\n\n- One collection, **SGSI tokens**, with two modes: **Light** (default) and **Dark**. FigCraft allows several modes in a collection; the Figma Starter plan did not, which is why the earlier Figma attempt used two collections.\n- Names are `Group/token`. Groups: Primary, Accent, Rust, Surface, Text, Feedback, Status, Action, Other, plus `radius/*` numbers. The CSS export turns them into `--group-token` (for example `--surface-card`, `--text-text-muted`); the prototype uses the shorter `--card`, `--text-muted`. The mapping is the token name without its group prefix.\n- **Alias duplicates:** several tokens carry the same colour on purpose, because they mean different things. In light mode `#1B3A6F` is `primary`, `action`, `brand-text`, `feedback-info` and `status-analysis`; `#0E2A4E` is `primary-deep`, `text-heading`, `action-strong`, `nav-active` and `review`. Keep them separate: dark mode pulls them apart.\n- **Binding in the design file:** fills and strokes whose hex matched a token were bound by value. Where several tokens share a hex the **first** in the list was used (for example `Primary/primary` rather than `Action/action`), so most bound fills show the colour's base name, not its role. When you restyle a role, bind by role.\n- Not tokens (raw values in the file): gradients, shadows, the scrim (`#0E2A4E66`) and alpha fills.\n\n";
o += "## 3. Colour tokens\n\n";
groups.forEach((g) => {
  o += "### " + g + "\n\n| Token | Light | Dark | Use |\n| --- | --- | --- | --- |\n";
  Object.keys(T).filter((n) => n.startsWith(g + "/")).forEach((n) => { o += "| `" + n + "` | `" + T[n].L + "` | `" + T[n].D + "` | " + (USE[n] || "") + " |\n"; });
  o += "\n";
});
o += "### Radii (numbers, the same in both modes)\n\n| Token | px | Use |\n| --- | --- | --- |\n";
Object.keys(T).filter((n) => n.startsWith("radius/")).forEach((n) => { o += "| `" + n + "` | " + T[n].L + " | " + USE[n] + " |\n"; });
o += "\n## 4. Contrast of the main pairs\n\nWCAG 2 contrast ratios computed from the exported values (4.5 is the AA minimum for body text, 3 for large text and icons).\n\n| Pair | Light | Dark |\n| --- | --- | --- |\n";
const pairs = [["Text/foreground", "Surface/card"], ["Text/heading", "Surface/card"], ["Text/text-secondary", "Surface/card"], ["Text/text-muted", "Surface/card"], ["Text/text-muted", "Surface/muted"], ["Action/action-foreground", "Action/action"], ["Text/text-inverse", "Primary/primary"], ["Feedback/success", "Surface/card"], ["Feedback/error", "Surface/card"], ["Feedback/warning", "Surface/card"], ["Accent/accent-text", "Accent/accent-100"], ["Status/st-created", "Status/st-created-100"], ["Status/st-prep", "Status/st-prep-100"], ["Status/st-analysis", "Status/st-analysis-100"], ["Status/st-finished", "Status/st-finished-100"], ["Status/st-completed", "Status/st-completed-100"], ["Primary/primary-deep", "Primary/primary-50"], ["Action/brand-text", "Surface/shell"]];
const flag = (x) => x.toFixed(1) + (x < 4.5 ? " (below 4.5)" : "");
pairs.forEach(([a, b]) => { o += "| `" + a + "` on `" + b + "` | " + flag(cr(T[a].L, T[b].L)) + " | " + flag(cr(T[a].D, T[b].D)) + " |\n"; });
o += "\nA pair below 4.5 is acceptable only for large text, icons and bold chip text of 13 px or more if the ratio is 3 or higher; anything lower needs a change. Check the list again after every token edit.\n\n";
o += "## 5. Where the tokens are used\n\n- **FigCraft file:** the variables above (53 colours and 4 radii). `tools/tokens.js` creates them from `tokens/sgsi-tokens.json` on every rebuild, so an edit made in the app must be re-exported with `variable.export` to survive a rebuild.\n- **Prototype (`.context/prototype/src/styles.css`):** still carries the **earlier** values (and a few extra tokens: `scrim`, shadows, `review-soft`, `review-line`). Update its `:root` and `:root[data-theme=\"dark\"]` blocks from `sgsi-tokens.css` before the next prototype release; until then the prototype's dark preview differs from the design file.\n- **Older documents:** the research plan's dark-mode section (Revisions 1 and 2) describes the superseded dark values and keeps them as history. The screen plans quote light values that did not change, except `muted`.\n- **Development:** map the CSS export to the app's theme (Tailwind `@theme` or CSS custom properties). `variable.export` can also write a Tailwind v4 stylesheet and a Dart file.\n";
fs.writeFileSync("D:/SGSI/LIMS/.context/docs/Design_Tokens.md", o);
console.log(o.length + " chars");
const bad = pairs.filter(([a, b]) => cr(T[a].L, T[b].L) < 4.5 || cr(T[a].D, T[b].D) < 4.5).map(([a, b]) => a + " on " + b + " L" + cr(T[a].L, T[b].L).toFixed(1) + " D" + cr(T[a].D, T[b].D).toFixed(1));
console.log(bad.join("\n"));
