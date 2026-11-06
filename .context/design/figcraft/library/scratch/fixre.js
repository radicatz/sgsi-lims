const fs=require("fs");let r=fs.readFileSync("rev8.js","utf8");
const BS=String.fromCharCode(92);
r=r.replace("/^(.*?)( d)?$/","/^(.*?)( "+BS+"d)?$/");
r=r.replace("replace(/s*·s*/g","replace(/"+BS+"s*·"+BS+"s*/g");
fs.writeFileSync("rev8.js",r);
