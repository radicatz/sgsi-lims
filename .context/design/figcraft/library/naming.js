// Frame naming (see .context/docs/Design System/Frame_Naming.md):  {Size}-{MM}-{Module}-{SS}-{Screen}-{VV}-{Variant}
// node naming.js <in.figcraft> <out.figcraft>   renames every screen frame of the Desktop, Tablet and Mobile Phone pages
const fs = require("fs"), cp = require("child_process");
const run = require("./run.js");
const CLI = "C:/Users/pc/figcraft/app/figcraft-0.12.1-windows-x64-portable/figcraft-cli.exe";
const SIZE = { Desktop: "Desktop", Tablet: "Tablet", "Mobile Phone": "Phone" };
const MODULES = { Job_orders: "03", Batches: "04" }; // sidebar order: My_work 01, Dashboard 02, Job_orders 03, Batches 04, Input_ROA 05, Review_ROA 06, Reports 07, Search 08, Clients 09, Drill_hole 10, Lithology 11, Seam 12, Users 13, Configuration 14, Audit_log 15
const NEW = /^(Desktop|Tablet|Phone)-\d\d-[A-Za-z_]+-\d\d-/;
// old name (size suffix removed) -> [screen no, screen, variant no, variant]
const RULES = [
  [/^List$/, "01", "Job_orders_list", "01", "Default"], [/^List · Empty$/, "01", "Job_orders_list", "02", "Empty"],
  [/^Create$/, "02", "New_job_order", "01", "Form"], [/^Create · Step 1$/, "02", "New_job_order", "02", "Step_1"], [/^Create · Step 2$/, "02", "New_job_order", "03", "Step_2"],
  [/^Contact (dropdown|sheet) · List$/, "02", "New_job_order", "04", (m) => "Contact_" + m[1] + "_list"], [/^Contact (dropdown|sheet) · Edit$/, "02", "New_job_order", "05", (m) => "Contact_" + m[1] + "_edit"],
  [/^Signatory (dropdown|sheet) · List$/, "02", "New_job_order", "06", (m) => "Signatory_" + m[1] + "_list"], [/^Signatory (dropdown|sheet) · Edit$/, "02", "New_job_order", "07", (m) => "Signatory_" + m[1] + "_edit"],
  [/^Create · Ash analysis open$/, "02", "New_job_order", "08", "Ash_analysis_open"], [/^Ash analysis sheet$/, "02", "New_job_order", "08", "Ash_analysis_sheet"],
  [/^Create · P1 Validation errors$/, "02", "New_job_order", "09", "Validation_errors"], [/^Create · Remove contact$/, "02", "New_job_order", "10", "Remove_contact"],
  [/^Create · P11 Coking coal, ASTM \+ GB.T$/, "02", "New_job_order", "11", "Coking_coal_ASTM_and_GBT"],
  [/^Overview$/, "03", "Job_order_detail", "01", "Overview"], [/^Overview · Dark preview$/, "03", "Job_order_detail", "02", "Overview_dark_preview"],
  [/^Batches$/, "03", "Job_order_detail", "03", "Batches"], [/^Batches · Empty$/, "03", "Job_order_detail", "04", "Batches_empty"], [/^Batches · Samples awaiting arrival$/, "03", "Job_order_detail", "05", "Batches_samples_awaiting_arrival"],
  [/^Samples$/, "03", "Job_order_detail", "06", "Samples"], [/^Samples · Mixed states$/, "03", "Job_order_detail", "07", "Samples_mixed_states"], [/^Samples · Mark as not received$/, "03", "Job_order_detail", "08", "Samples_mark_as_not_received"],
  [/^Samples · P2 Submitted toast$/, "03", "Job_order_detail", "09", "Samples_submitted_toast"], [/^Samples · P3 Paste preview$/, "03", "Job_order_detail", "10", "Samples_paste_preview"],
  [/^Samples · P4 Unsaved rows$/, "03", "Job_order_detail", "11", "Samples_unsaved_rows"], [/^Samples · P5 Locked row tooltip$/, "03", "Job_order_detail", "12", "Samples_locked_row_tooltip"],
  [/^Add batch$/, "04", "Add_batch", "01", "Dialog"], [/^Add batch · Late samples$/, "04", "Add_batch", "02", "Late_samples"], [/^Add batch · Step 1$/, "04", "Add_batch", "03", "Step_1"], [/^Add batch · Step 2$/, "04", "Add_batch", "04", "Step_2"],
  [/^CoA · Mark sent$/, "05", "CoA_and_actions", "01", "Mark_sent"], [/^CoA · Mark sent sheet$/, "05", "CoA_and_actions", "01", "Mark_sent_sheet"], [/^CoA · Sent$/, "05", "CoA_and_actions", "02", "Sent"], [/^Cancel job order · P7$/, "05", "CoA_and_actions", "03", "Cancel_job_order"], [/^CoA · Ready to generate$/, "05", "CoA_and_actions", "04", "Ready_to_generate"], [/^CoA · Draft in progress$/, "05", "CoA_and_actions", "05", "Draft_in_progress"],
];
// module 04 Batches, screen 02 Batch_detail (Batch_Screen_Plan.md section 6)
const BATCH_VV = { Reception_receiving: "01", Reception_print_labels: "02", Reception_photos: "03", Reception_ready: "04", Reception_confirm_with_fewer: "05", Reception_hold_sample: "06", Reception_scan_label: "07", Reception_confirmed: "08", Batch_number_edit: "09", Preparation_entering_ADL: "10", Preparation_finished: "11", Analysis_entering_results: "12", Analysis_finished_upload_RoA: "13", Completed: "14" };
const MW_VV = { "Overview:Lab_admin": "01", "Overview:Preparation": "02", "Overview:Analyst": "03", "Overview:CSO": "04", "Overview:All_caught_up": "05", "Queue:Batches_to_receive": "01", "Queue:CoAs_to_send_multi_select": "02" };
const LIST_VV = { Default: "01", Batches_to_prepare: "02", Empty: "03", No_results: "04", Filters: "05", Add_batch_choose_job_order: "06" };
function newName(old, page) {
  if (NEW.test(old) || /reference$| edit( dark)?$|^Properties ref$|^Select reference$/.test(old)) return null;
  const size = SIZE[page]; if (!size) return null;
  const base = old.replace(/ · (Desktop|Tablet|Phone)$/, "");
  const mw = /^My work · (Overview|Queue) · (.+)$/.exec(base);
  if (mw && MW_VV[mw[1] + ":" + mw[2]]) return [size, "01", "My_work", mw[1] === "Overview" ? "01" : "02", mw[1], MW_VV[mw[1] + ":" + mw[2]], mw[2]].join("-");
  const bl = /^Batch list · (.+)$/.exec(base);
  if (bl && LIST_VV[bl[1]]) return [size, "04", "Batches", "01", "Batch_list", LIST_VV[bl[1]], bl[1]].join("-");
  const bd = /^Batch detail · (.+)$/.exec(base);
  if (bd && BATCH_VV[bd[1]]) return [size, "04", "Batches", "02", "Batch_detail", BATCH_VV[bd[1]], bd[1]].join("-");
  for (const [rx, sn, screen, vn, variant] of RULES) { const m = rx.exec(base); if (m) return [size, MODULES.Job_orders, "Job_orders", sn, screen, vn, typeof variant === "function" ? variant(m) : variant].join("-"); }
  return undefined; // no rule
}
module.exports = { newName, NEW };
if (require.main === module) {
  const [i, o] = process.argv.slice(2);
  cp.execFileSync(CLI, ["convert", i, "C:/Users/pc/AppData/Local/Temp/naming.json"]);
  const J = JSON.parse(fs.readFileSync("C:/Users/pc/AppData/Local/Temp/naming.json")), N = J.nodes;
  const steps = [], miss = [], seen = {};
  for (const p of J.pages) { const pg = N[p]; for (const c of pg.children) { const n = N[c]; if (n.type !== "frame" || pg.name === "Library") continue;
    const nn = newName(n.name, pg.name); if (nn === undefined) miss.push(pg.name + " | " + n.name); if (!nn) continue;
    if (seen[nn]) throw new Error("duplicate " + nn); seen[nn] = 1; steps.push({ command: "node.set", params: { ids: [c], props: { name: nn } } }); } }
  console.log("renamed", steps.length, "no rule:", miss);
  steps.push({ command: "file.save", params: { path: o } });
  const b = { steps, expect: [] };
  run(b, i, o, "naming");
}
