const fs=require("fs");
const [,, idsFile, infoFile, outFile, nOrig]=process.argv;
const ids=JSON.parse(fs.readFileSync(idsFile));const info=JSON.parse(fs.readFileSync(infoFile));
const fr=Object.fromEntries(info.pages[0].frames.map(f=>[f.id,f]));
const steps=[];let x=0,y=0,rowH=0;const W=9000,G=120;
const place=(name,id)=>{const f=fr[id];if(!f)return;if(x>0&&x+f.width>W){x=0;y+=rowH+200;rowH=0;}steps.push({command:"node.set",params:{ids:[id],props:{x,y}}});x+=f.width+G;rowH=Math.max(rowH,f.height);};
const orig=+nOrig;
ids.slice(0,orig).forEach(([n,id])=>place(n,id));
x=0;y+=rowH+400;rowH=0;
steps.push({command:"node.create",params:{type:"text",text:"Batch · Revision C Row",x:0,y:y-90,props:{fontFamily:"Montserrat",fontStyle:"SemiBold",fontSize:40,fill:"#0E2A4E"}}});
ids.slice(orig).filter(([n])=>n!=="Component library").forEach(([n,id])=>place(n,id));
const lib=ids.find(([n])=>n==="Component library");
if(lib){x=0;y+=rowH+400;rowH=0;steps.push({command:"node.create",params:{type:"text",text:"Component library",x:0,y:y-90,props:{fontFamily:"Montserrat",fontStyle:"SemiBold",fontSize:40,fill:"#0E2A4E"}}});place(lib[0],lib[1]);}
fs.writeFileSync(outFile,JSON.stringify(steps));console.log(steps.length,"layout steps; end y",y+rowH);
