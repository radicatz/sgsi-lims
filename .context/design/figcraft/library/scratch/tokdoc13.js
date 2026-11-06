// re-add the change log to Design_Tokens.md after tokdoc.js regenerated it (the generator writes only the current values)
const fs = require("fs");
const f = "D:/SGSI/LIMS/.context/docs/Design System/Design_Tokens.md";
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
let s = fs.readFileSync(f, "utf8"); const crlf = s.includes(CR); s = s.split(CR).join(LF);
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 60)); s = s.replace(a, b); };
rep("Oct 29, 2026 · source of truth", "Nov 4, 2026 (values updated; first written Oct 29) · source of truth");
rep("## 1. What changed, and where the values come from\n\n", `## 1. What changed, and where the values come from

**Change log after Oct 29, 2026.** The product owner adjusts values in the FigCraft file; \`tokens/sgsi-tokens.json\` and \`tokens/sgsi-tokens.css\` are re-exported from it and the tables below show the current values.

Nov 4, 2026 (light mode):

| Token | Before | Now |
| --- | --- | --- |
| \`Primary/primary-100\` | \`#E3EAF4\` | \`#E9EEF4\` |
| \`Status/st-analysis-100\` | \`#E3EAF4\` | \`#D9E5F7\` |
| \`Feedback/error-100\` | \`#F8E3DC\` | \`#FEE9E1\` |

Nov 3, 2026:

| Token | Mode | Before | Now |
| --- | --- | --- | --- |
| \`Text/text-muted\` | Light | \`#7D8699\` | \`#A4A39A\` |
| \`Text/text-muted\` | Dark | \`#7F8DA6\` | \`#435C86\` |
| \`Text/heading\` | Dark | \`#F4F7FB\` | \`#C0D8F9\` |
| \`Text/text-secondary\` | Dark | \`#A9B6CC\` | \`#92AEDD\` |
| \`Text/text-inverse\` | Dark | \`#0A1A33\` | \`#FFFFFF\` |
| \`Primary/primary-deep\` | Dark | \`#8CA4C6\` | \`#588DD9\` |
| \`Primary/primary-50\` | Dark | \`#0F1E36\` | \`#14243D\` |
| \`Primary/primary-100\` | Dark | \`#B6C9E7\` | \`#2A4A7D\` |
| \`Primary/primary-200\` | Dark | \`#1E3A66\` | \`#274C86\` |
| \`Accent/accent-text\` | Dark | \`#A9C6F5\` | \`#6D8FE7\` |
| \`Surface/muted\` | Dark | \`#14243D\` | \`#1D3050\` |

Contrast to review (section 4): \`Text/text-muted\` on card is 2.5 in light and 2.4 in dark, below the 4.5 needed for body text; the job order and batch headers use it for contact, PO, due date and other meta items. Keep muted for placeholders and meta, never for values the user must read.

`);
fs.writeFileSync(f, crlf ? s.split(LF).join(CR) : s);
console.log("ok");
