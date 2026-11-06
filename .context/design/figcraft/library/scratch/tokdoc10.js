const fs = require("fs");
const f = "D:/SGSI/LIMS/.context/docs/Design_Tokens.md";
let s = fs.readFileSync(f, "utf8");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10), crlf = s.includes(CR);
s = s.split(CR).join(LF);
const rep = (a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 60)); s = s.replace(a, b); };
rep("Oct 29, 2026 · source of truth", "Nov 3, 2026 (values updated; first written Oct 29) · source of truth");
rep("## 1. What changed, and where the values come from\n\n", `## 1. What changed, and where the values come from

**Nov 3, 2026 update.** The product owner adjusted these colour values in the FigCraft file after the Oct 29 export. \`tokens/sgsi-tokens.json\` and \`tokens/sgsi-tokens.css\` were re-exported from the file and the tables below show the new values.

| Token | Mode | Before (Oct 29 export) | Now |
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

Contrast to review (section 4): \`Text/text-muted\` on card is 2.5 in light and 2.4 in dark, below the 4.5 needed for body text. Since Nov 3 the job order header uses it for the contact, PO and due date, so those texts are below AA. Accent text on the amber tint is 3.6 in dark. Keep muted for placeholders and decorative text, or darken it.

`);
fs.writeFileSync(f, crlf ? s.split(LF).join(CR) : s);
console.log("ok");
