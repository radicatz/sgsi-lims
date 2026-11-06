const fs=require("fs");let r=fs.readFileSync("rowC.js","utf8");const BS=String.fromCharCode(92);
const rep=(a,b)=>{ if(!r.includes(a)) throw new Error("missing: "+a.slice(0,70)); r=r.split(a).join(b); };
// batch data: [initials, full name, date text]
rep('["DK", "Dedi K. · 21 Oct"], ["FH", "Fitri H. · 22 Oct"], "RoA-0417"','["DK", "Dedi Kurniawan", "21 Oct"], ["FH", "Fitri Handayani", "22 Oct"], "RoA-0417"');
rep('["DK", "Dedi K. · 22 Oct"], ["FH", "Fitri H. · started 23 Oct"]','["DK", "Dedi Kurniawan", "22 Oct"], ["FH", "Fitri Handayani", "Started 23 Oct"]');
rep('["DK", "Dedi K. · 20 Oct"], ["FH", "Fitri H. · started 21 Oct"]','["DK", "Dedi Kurniawan", "20 Oct"], ["FH", "Fitri Handayani", "Started 21 Oct"]');
rep('["DK", "Dedi K. · started 21 Oct"], null','["DK", "Dedi Kurniawan", "Started 21 Oct"], null');
fs.writeFileSync("rowC.js",r);
