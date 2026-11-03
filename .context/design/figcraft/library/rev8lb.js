// library: rebuild the batch table sets with separate Preparation and Analysis columns. node rev8lb.js <in> <out>
const fs = require("fs"), cp = require("child_process");
const { B } = require("./dsl.js");
const { loadReg } = require("./screens/reg.js");
require("./screens/shell.js"); require("./screens/rowC.js");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const [i, o] = process.argv.slice(2);
cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/lb.json"]);
const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/lb.json"));
const b = new B(J.next_id).useReg(loadReg(J)).regSets();
b.patchC();
b.applyTextStyles();
b.raw("file.save", { path: o });
run(b, i, o, "rev8LB");
