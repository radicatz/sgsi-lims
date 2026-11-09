/* Merge every clip in out/clips into one video, in file-name order, without re-encoding.
   Writes out/SGSI-LIMS-Demo-ID.mp4 (with chapter markers) and out/chapters.txt (timestamps for YouTube or Drive).
   Usage: node merge.js */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const HERE = __dirname;
const CLIPS = path.join(HERE, "out/clips");
const OUT = path.join(HERE, "out");
const files = fs.readdirSync(CLIPS).filter((f) => f.endsWith(".mp4")).sort();
if (!files.length) { console.log("No clips in", CLIPS); process.exit(1); }

const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(CLIPS, f)]).toString().trim());
const titleOf = (f) => {
  const js = path.join(HERE, "chapters", f.replace(/\.mp4$/, ".js"));
  try { return require(js).title || f; } catch (e) { return f.replace(/\.mp4$/, ""); }
};
const stamp = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60); return (h ? h + ":" : "") + String(m).padStart(h ? 2 : 1, "0") + ":" + String(x).padStart(2, "0"); };

let t = 0, meta = ";FFMETADATA1\ntitle=SGSI LIMS Prototype v2 (Indonesian demo)\n", txt = "", list = "";
files.forEach((f, i) => {
  const d = dur(f), title = `${String(i + 1).padStart(2, "0")} ${titleOf(f)}`;
  meta += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(t * 1000)}\nEND=${Math.round((t + d) * 1000)}\ntitle=${title}\n`;
  txt += `${stamp(t)} ${titleOf(f)}\n`;
  list += `file '${path.join(CLIPS, f).replace(/\\/g, "/")}'\n`;
  t += d;
});
fs.writeFileSync(path.join(OUT, "concat.txt"), list);
fs.writeFileSync(path.join(OUT, "chapters.ffmeta"), meta);
fs.writeFileSync(path.join(OUT, "chapters.txt"), txt);

const out = path.join(OUT, "SGSI-LIMS-Demo-ID.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(OUT, "concat.txt"),
  "-i", path.join(OUT, "chapters.ffmeta"), "-map_metadata", "1", "-c", "copy", "-movflags", "+faststart", out]);
console.log(`${files.length} clips, ${stamp(t)} -> ${out}`);
