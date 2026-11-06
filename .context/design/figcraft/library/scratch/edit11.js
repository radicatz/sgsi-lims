const fs = require("fs");
process.chdir("D:/SGSI/LIMS/.context/design/figcraft/library/screens");
const LF = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10);
const rw = (f, fn) => { let s = fs.readFileSync(f, "utf8").split(CRLF).join(LF); s = fn(s); fs.writeFileSync(f, s); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing " + a.slice(0, 70)); return s.replace(a, b); };
// generators find their own earlier frames by old or new name (new names: Frame_Naming.md)
rw("rowB.js", (s) => rep(s, "/^(Create|Contact |Signatory |Ash analysis)(?!.*reference$)/.test(n.name || \"\")", "(/^(Create|Contact |Signatory |Ash analysis)(?!.*reference$)/.test(n.name || \"\") || /^(Desktop|Tablet|Phone)-03-Job_orders-02-/.test(n.name || \"\"))"));
rw("rowC.js", (s) => rep(s, "const NAMES = /^(Overview|Batches|Samples)( ·|$)(?!.*( edit( dark)?| reference)$)/;", "const NAMES = /^((Overview|Batches|Samples)( ·|$)(?!.*( edit( dark)?| reference)$)|(Desktop|Tablet|Phone)-03-Job_orders-03-)/;"));
rw("rowD.js", (s) => rep(s, "const DE_NAMES = /^(Add batch ·|CoA · Mark sent|CoA · Sent|Cancel job order ·)/;", "const DE_NAMES = /^(Add batch ·|CoA · Mark sent|CoA · Sent|Cancel job order ·|(Desktop|Tablet|Phone)-03-Job_orders-0[45]-)/;"));
console.log("edit11 ok");
