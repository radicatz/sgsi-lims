const fs = require("fs");
const CR = String.fromCharCode(13, 10), LF = String.fromCharCode(10);
const edit = (file, fn) => { const raw = fs.readFileSync(file, "utf8"); const crlf = raw.includes(CR); let s = raw.split(CR).join(LF); s = fn(s); fs.writeFileSync(file, crlf ? s.split(LF).join(CR) : s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
const D = "D:/SGSI/LIMS/.context/docs";
edit(D + "/Design System/Component_Library_Plan.md", (s) => {
  s = rep(s, "Card (Surface/card, border, radius 16, padding 16 / 20, gap 16)", "Card (Surface/card, border, radius 16, padding 16 on all four sides, gap 16)");
  s = rep(s, "    Card content (vertical, gap 8, hug):", "    Card content (vertical, gap 8, no padding, hug):");
  return s.trimEnd() + LF + LF + "**Nov 4, 2026 update (owner):** every card is padded **16 on all four sides** (it was 16 / 20); Card content has no top padding (the owner removed it in the batch frames, so head and content touch, as in the reference). Applies to all cards, including the phone sample cards (were 12) and the Stepper card; the stepper track width follows (card width minus 32).\n";
});
edit(D + "/Batch/Batch_Screen_Plan.md", (s) => {
  s = rep(s, "owning its padding (16 / 20, gap 16)", "owning its padding (16 on all sides, gap 16)");
  s = rep(s, "| 15 | The reference analysis card has padding 16 on all four sides; the card padding rule says 16 / 20. Which for all cards? | Keep 16 / 20 for cards; 16 all round only for Table cards (as the feedback says) |", "| 15 | The reference analysis card has padding 16 on all four sides; the card padding rule said 16 / 20. Which for all cards? | **Answered Nov 4: 16 on all four sides for every card** |");
  return s.trimEnd() + LF + LF + "**Nov 4, 2026 (later):** all cards are padded 16 on all sides (Component_Library_Plan, Card anatomy). The owner also set Card content to no top padding in the Analysis and RoA frames; the generators and `library/cards.js` follow, and the returned-samples note on Reception_confirmed is a \"Card note\" (padding 0 / 8) inside Card content, as in the owner's edit.\n";
});
edit(D + "/Job Order/Job_Order_Screen_Plan.md", (s) => s.trimEnd() + LF + LF + "**Card padding (Nov 4, 2026, supersedes the 16 / 20 rule of 6.5e):** every card on every screen is padded 16 on all four sides.\n");
console.log("docs15 ok");
