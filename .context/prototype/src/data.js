/* FORMAT MISMATCH (flagged Nov 10, 2026): the sample ids and lab codes below use the OLD format (client name as 'sample ID', lab code B{batch}-NN).
   The lab's format is Sample ID SG.YYMMDD.CCC.BB.NNN + sample code CCC.BB.NNN.Lotxx (spec 6.1, D-51). Not rebuilt on purpose; the spec wins. See .context/docs/Project/Sample_Identifiers_Plan.md */
/* Demo data and rules. Records follow the FigCraft frames, with the cross-module differences D1 to D8 settled as in
   docs/Prototype/Prototype_Plan.md section 8. "Today" is Thursday 5 November 2026 for every reviewer. */
const D = (function () {
  const TODAY = "2026-11-05";
  const NOW = "2026-11-05T09:12";

  /* ---------- roles, sidebar, permissions (Navigation plan sections 2 and 3, spec 8.2) ---------- */
  const ROLES = ["superadmin", "lab_admin", "supervisor", "manager", "cso", "prep", "analyst"];
  const ROLE_LABEL = { superadmin: "Superadmin", lab_admin: "Lab admin", supervisor: "Supervisor", manager: "Manager", cso: "CSO", prep: "Preparation", analyst: "Analyst" };
  const ROLE_FULL = { superadmin: "Superadmin", lab_admin: "Lab Admin", supervisor: "Supervisor", manager: "Manager", cso: "CSO", prep: "Preparation", analyst: "Analyst" };
  const PERSONA = {
    superadmin: { user: "u1", name: "Wahyu Pratama", title: "System Administrator" },
    lab_admin: { user: "u2", name: "Maya Lestari", title: "Lab Admin" },
    supervisor: { user: "u8", name: "Hendra Wijaya, S.T.", title: "Laboratory Supervisor" },
    manager: { user: "u9", name: "Ir. Bambang Sutrisno, M.T.", title: "Head of Laboratory" },
    cso: { user: "u3", name: "Rina Kartika", title: "Customer Service Officer" },
    prep: { user: "u4", name: "Dedi Kurniawan", title: "Preparation" },
    analyst: { user: "u6", name: "Fitri Handayani", title: "Analyst" },
  };
  const NAV = [
    { group: "WORK", items: [["work", "My work", "check-square-offset"], ["dashboard", "Dashboard", "squares-four"], ["orders", "Job orders", "clipboard-text"], ["batches", "Batches", "stack"], ["reports", "Reports", "file-text"], ["search", "Search", "magnifying-glass"]] },
    { group: "MASTER DATA", items: [["clients", "Clients", "buildings"], ["drill-holes", "Drill hole", "cylinder"], ["lithologies", "Lithology", "package"], ["seams", "Seam", "rows"]] },
    { group: "ADMIN", items: [["users", "Users", "users"], ["config", "Configuration", "gear-six"], ["audit", "Audit log", "clock-counter-clockwise"]] },
  ];
  const CORE = ["dashboard", "orders", "batches", "reports", "search"];
  const VISIBLE = {
    cso: ["work", "dashboard", "orders", "batches", "reports", "search", "clients"],
    prep: ["work", "dashboard", "orders", "batches", "search"],
    analyst: ["work", "dashboard", "orders", "batches", "reports", "search"],
    lab_admin: ["work", ...CORE, "clients", "drill-holes", "lithologies", "seams"],
    supervisor: [...CORE, "drill-holes", "lithologies", "seams", "audit"],
    manager: [...CORE, "clients", "drill-holes", "lithologies", "seams", "audit"],
    superadmin: [...CORE, "clients", "drill-holes", "lithologies", "seams", "users", "config", "audit"],
  };
  const START = (r) => (VISIBLE[r].includes("work") ? "work" : "dashboard");
  const P = {
    "order.write": ["cso", "superadmin"], "batch.create": ["cso", "prep", "lab_admin", "superadmin"], reception: ["cso", "prep", "lab_admin", "superadmin"],
    adl: ["prep"], "result.write": ["analyst", "superadmin"], "roa.upload": ["lab_admin", "superadmin"], "coa.write": ["lab_admin", "superadmin"],
    "coa.revise": ["lab_admin"], "coa.void": ["superadmin"], "coa.send": ["cso"], "coa.download": ["cso", "lab_admin", "supervisor", "manager", "superadmin"],
    "roa.download": ["analyst", "lab_admin", "supervisor", "manager", "superadmin"], "values.view": ["superadmin", "lab_admin", "supervisor", "manager", "prep", "analyst"],
    "master.write": ["lab_admin", "superadmin"], "coa.upload": ["lab_admin", "superadmin"], "company.manage": ["cso", "superadmin"],
    "user.manage": ["superadmin"], "config.write": ["superadmin"], "audit.read": ["superadmin", "supervisor", "manager"],
    "dashboard.quality": ["superadmin", "lab_admin", "supervisor", "manager"], "batch.number": ["cso", "prep", "lab_admin", "superadmin"],
  };
  const can = (role, p) => !!(P[p] && P[p].includes(role));
  const PERM_GRID = [
    ["Manage users and roles", "Add, edit and deactivate accounts", "user.manage"],
    ["Manage clients and contacts", "Client pages, contacts", "company.manage"],
    ["Edit master data", "Drill holes, lithologies, seams", "master.write"],
    ["Create and edit job orders", "Request, sample IDs, cancel", "order.write"],
    ["Create batches", "Add batch from a job order", "batch.create"],
    ["Confirm reception", "Arrival, mass, condition, labels", "reception"],
    ["Enter ADL", "Preparation tab", "adl"],
    ["Enter analysis values", "Analysis tab", "result.write"],
    ["Upload the signed RoA", "Complete batch", "roa.upload"],
    ["Build and publish CoAs", "Reports", "coa.write"],
    ["Mark CoAs as sent", "Delivery to the client", "coa.send"],
    ["See result values", "Batch page, search, reports", "values.view"],
    ["Read the audit log", "Audit log, export", "audit.read"],
    ["Change configuration", "Parameters, services, rules, templates", "config.write"],
  ];
  const ROLE_DESC = { superadmin: "Users, roles and configuration", cso: "Job orders, clients, sending CoAs", prep: "Receives samples, enters ADL", analyst: "Enters analysis values", lab_admin: "Runs the lab day to day, RoA and CoA", supervisor: "Oversees work, reads the audit log", manager: "Head of laboratory, signs CoAs" };

  /* ---------- parameters, standards, services ---------- */
  const PARAM_GROUPS = [
    { id: "moisture", label: "Moisture", items: ["TM", "IM", "EQM"] },
    { id: "proximate", label: "Proximate", items: ["Ash", "VM", "FC"] },
    { id: "sulfur", label: "Sulfur", items: ["TS", "Forms of sulfur"] },
    { id: "calorific", label: "Calorific", items: ["GCV", "NCV"] },
    { id: "ultimate", label: "Ultimate", items: ["C", "H", "N", "O"] },
    { id: "physical", label: "Physical", items: ["HGI", "RD", "Sizing"] },
    { id: "ash", label: "Ash", items: ["AFT red.", "AFT ox.", "Ash analysis", "Metal in ash"] },
    { id: "chemical", label: "Chemical", items: ["Cl", "P", "F", "Hg", "Trace elements"] },
    { id: "coking", label: "Coking coal", items: ["CSN (Crucible Swelling Number)", "Gieseler Plastometer", "Gray King Coke Type", "Dilatometer Test", "Sapozhnikov Test", "G – Index (G Caking Index Test)", "CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)", "Maceral Analysis (Petrographic)"] },
  ];
  const DEPENDS = { FC: ["IM", "Ash", "VM"], NCV: ["GCV", "TM", "H"] };
  const STANDARDS = ["ASTM", "ISO", "GB/T"];
  const STD_METHODS = {
    "CSN (Crucible Swelling Number)": { ASTM: "ASTM D720", ISO: "ISO 501", "GB/T": "GB/T 5448" },
    "Gieseler Plastometer": { ASTM: "ASTM D2639", ISO: "ISO 10329", "GB/T": "GB/T 25213" },
    "Gray King Coke Type": { ISO: "ISO 502", "GB/T": "GB/T 1341" },
    "Dilatometer Test": { ASTM: "ASTM D5515", ISO: "ISO 349", "GB/T": "GB/T 5450" },
    "Sapozhnikov Test": { ISO: "ISO/TS 20362", "GB/T": "GB/T 479" },
    "G – Index (G Caking Index Test)": { ISO: "ISO 15585", "GB/T": "GB/T 5447" },
    "CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)": { ASTM: "ASTM D5341", ISO: "ISO 18894", "GB/T": "GB/T 4000" },
    "Maceral Analysis (Petrographic)": { ASTM: "ASTM D2799", ISO: "ISO 7404-3", "GB/T": "GB/T 8899" },
  };
  const covered = (p, stds) => { const m = STD_METHODS[p]; return !m || stds.some((s) => m[s]); };
  const coverTags = (p) => { const m = STD_METHODS[p]; return m && STANDARDS.some((s) => !m[s]) ? STANDARDS.filter((s) => m[s]) : []; };
  const SUBCONTRACTED = ["CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)"];
  const GROUP_PILLS = {
    "Ash analysis": { sections: [
      { label: "Oxides", items: ["SiO₂", "Al₂O₃", "Fe₂O₃", "CaO", "MgO", "Na₂O", "K₂O", "TiO₂", "P₂O₅", "SO₃", "Mn₃O₄", "BaO", "SrO", "Cr₂O₃"] },
      { label: "Ratios and indices", items: ["Base/acid ratio", "Silica ratio", "SiO₂/Al₂O₃", "Fe₂O₃/CaO", "Slagging index Rs", "Fouling index Rf", "Alkali index", "Total alkalis (Na₂O eq.)", "Basicity index", "Silica value", "Viscosity index Sr", "Ash loading", "Dolomite ratio", "Iron + calcium", "Fusion index"] }],
      preset: ["SiO₂", "Al₂O₃", "Fe₂O₃", "CaO", "MgO", "Na₂O", "K₂O", "TiO₂", "Base/acid ratio"] },
    "Trace elements": { sections: [{ label: "Elements", items: ["As", "B", "Ba", "Be", "Cd", "Co", "Cr", "Cu", "Ga", "Ge", "Li", "Mn", "Mo", "Ni", "Pb", "Rb", "Sb", "Sc", "Se", "Sn", "Sr", "Th", "Tl", "U", "V", "W", "Zn", "Zr", "Ag", "Bi", "Cs", "Nb", "Ta", "Y", "La", "Ce"] }], preset: ["As", "Cd", "Cr", "Pb", "Se"] },
  };
  const BASIC = ["TM", "IM", "Ash", "VM", "FC", "TS", "GCV"];
  const SERVICES = [
    { id: "basic", label: "TM + Prox + TS + CV", params: BASIC, days: 5, version: 4, status: "Active", def: true },
    { id: "prox", label: "Prox only", params: ["IM", "Ash", "VM", "FC"], days: 3, version: 2, status: "Active" },
    { id: "full", label: "Full analysis", params: BASIC.concat(["NCV", "C", "H", "N", "O", "HGI", "AFT red.", "AFT ox.", "Ash analysis"]), days: 10, version: 3, status: "Active" },
    { id: "coking", label: "Coking coal", params: BASIC.concat(["CSN (Crucible Swelling Number)", "Gieseler Plastometer", "Dilatometer Test", "Maceral Analysis (Petrographic)", "P", "Ash analysis"]), days: 12, version: 2, status: "Active" },
    { id: "prep", label: "Preparation only", params: [], days: 2, version: 1, status: "Active" },
  ];
  const PARAM_INFO = { TM: ["Total moisture", "%", "AR", 1, 2, 45], IM: ["Inherent moisture", "%", "ADB", 2, 0.5, 25], EQM: ["Equilibrium moisture", "%", "ADB", 2, 1, 40], Ash: ["Ash", "%", "ADB", 2, 0, 45], VM: ["Volatile matter", "%", "ADB", 2, 5, 55], FC: ["Fixed carbon", "%", "ADB", 2, 20, 80], TS: ["Total sulfur", "%", "ADB", 2, 0, 6], "Forms of sulfur": ["Forms of sulfur", "%", "ADB", 2, 0, 6], GCV: ["Gross calorific value", "kcal/kg", "ADB", 0, 2500, 8000], NCV: ["Net calorific value", "kcal/kg", "AR", 0, 2000, 7500], C: ["Carbon", "%", "DAF", 2, 50, 92], H: ["Hydrogen", "%", "DAF", 2, 2, 7], N: ["Nitrogen", "%", "DAF", 2, 0.5, 2.5], O: ["Oxygen", "%", "DAF", 2, 2, 25], HGI: ["Hardgrove grindability", "", "—", 0, 30, 110], RD: ["Relative density", "", "ADB", 2, 1.2, 1.9], Sizing: ["Size distribution", "%", "AR", 1, 0, 100], "AFT red.": ["Ash fusion, reducing", "°C", "—", 0, 1000, 1600], "AFT ox.": ["Ash fusion, oxidising", "°C", "—", 0, 1000, 1600], "Ash analysis": ["Ash analysis", "%", "Ash", 2, 0, 100], "Metal in ash": ["Metal in ash", "%", "Ash", 2, 0, 100], Cl: ["Chlorine", "%", "ADB", 3, 0, 1], P: ["Phosphorus", "%", "ADB", 3, 0, 1], F: ["Fluorine", "ppm", "ADB", 0, 0, 500], Hg: ["Mercury", "ppm", "ADB", 3, 0, 2], "Trace elements": ["Trace elements", "ppm", "ADB", 1, 0, 1000] };
  const SHORT = (p) => ({ "CSN (Crucible Swelling Number)": "CSN", "Gieseler Plastometer": "Gieseler", "Gray King Coke Type": "Gray King", "Dilatometer Test": "Dilatometer", "Sapozhnikov Test": "Sapozhnikov", "G – Index (G Caking Index Test)": "G – Index", "CRI/CSR (Coke Reactivity Index/Coke Strength After Reaction)": "CRI/CSR", "Maceral Analysis (Petrographic)": "Maceral" }[p] || p);

  /* ---------- statuses ---------- */
  const JO_STATUS = { draft: ["Draft", "grey"], awaiting: ["Awaiting samples", "amber"], progress: ["In progress", "blue"], reported: ["Reported", "purple"], delivered: ["Delivered", "green"], closed: ["Closed", "grey"], cancelled: ["Cancelled", "red"] };
  const B_STATUS = { created: ["Created", "grey"], receiving: ["Receiving", "navy"], preparation: ["Preparation", "amber"], prepfinished: ["Prep finished", "amber"], analysis: ["Analysis", "blue"], analysisfinished: ["Analysis finished", "purple"], completed: ["Completed", "green"] };
  const B_ORDER = ["created", "receiving", "preparation", "prepfinished", "analysis", "analysisfinished", "completed"];
  const S_STATE = { expected: ["Expected", "outline"], inbatch: ["In batch", "blue"], received: ["Received", "green"], awaiting: ["Awaiting arrival", "amber"], notreceived: ["Not received", "red"], held: ["Held", "red"] };
  const COA_STATUS = { draft: ["Draft", "grey"], published: ["Published", "blue"], sent: ["Sent", "green"], superseded: ["Superseded", "outline"], void: ["Void", "red"] };

  /* ---------- deterministic numbers ---------- */
  let seedN = 20261105;
  const rnd = () => { seedN = (seedN * 1103515245 + 12345) % 2147483648; return seedN / 2147483648; };
  const rr = (a, b, d = 2) => +(a + rnd() * (b - a)).toFixed(d);
  function values(params) {
    const IM = rr(3, 12), Ash = rr(4, 17), VM = rr(36, 43), TM = rr(IM + 6, IM + 22, 1);
    const v = { TM, IM, Ash, VM, FC: +(100 - IM - Ash - VM).toFixed(2), TS: rr(0.18, 1.1), GCV: Math.round(7600 - 92 * Ash - 70 * IM + rr(-120, 120, 0)), NCV: 0, HGI: Math.round(rr(40, 62, 0)), RD: rr(1.3, 1.5), C: rr(70, 80), H: rr(4.5, 5.8), N: rr(1.1, 1.7), O: rr(10, 18), EQM: rr(IM + 1, IM + 6), "AFT red.": Math.round(rr(1180, 1420, 0)), "AFT ox.": Math.round(rr(1220, 1460, 0)), Cl: rr(0.01, 0.08, 3), P: rr(0.004, 0.03, 3) };
    v.NCV = Math.round(v.GCV * (100 - TM) / (100 - IM) - 5.85 * (9 * v.H + TM));
    const out = {}; params.forEach((p) => { if (v[p] !== undefined) out[p] = v[p]; }); if (out.Ash != null && out.RD == null) out.RD = +(1.28 + out.Ash * 0.011 + rr(-0.02, 0.02)).toFixed(2); return out;
  }

  /* ---------- people and clients ---------- */
  const USERS = [
    { id: "u1", name: "Wahyu Pratama", email: "wahyu@sgsi.co.id", roles: ["superadmin"], status: "Active", last: "Today, 08:02", created: "2026-10-01", title: "System Administrator", phone: "+62 812 5550 1001" },
    { id: "u2", name: "Maya Lestari", email: "maya@sgsi.co.id", roles: ["lab_admin"], status: "Active", last: "Today, 07:45", created: "2026-10-12", title: "Laboratory Administrator, A.Md.", phone: "+62 812 5550 1002" },
    { id: "u3", name: "Rina Kartika", email: "rina@sgsi.co.id", roles: ["cso"], status: "Active", last: "Today, 07:30", created: "2026-10-12", title: "Customer Service Officer", phone: "+62 812 5550 1003" },
    { id: "u4", name: "Dedi Kurniawan", email: "dedi@sgsi.co.id", roles: ["prep"], status: "Active", last: "Today, 07:20", created: "2026-10-12", title: "Sample Preparation Technician", phone: "+62 812 5550 1004" },
    { id: "u5", name: "Yusuf Hidayat", email: "yusuf@sgsi.co.id", roles: ["prep", "analyst"], status: "Active", last: "4 Nov 2026", created: "2026-10-14", title: "Sample Preparation Technician", phone: "+62 813 5550 2290" },
    { id: "u6", name: "Fitri Handayani", email: "fitri@sgsi.co.id", roles: ["analyst"], status: "Active", last: "Today, 07:40", created: "2026-10-12", title: "Laboratory Analyst", phone: "+62 812 5550 1006" },
    { id: "u7", name: "Bagus Prasetyo, A.Md.", email: "bagus@sgsi.co.id", roles: ["analyst"], status: "Locked", last: "Today, 07:58", created: "2026-10-14", title: "Laboratory Analyst", phone: "+62 812 5550 1007", lockedUntil: "10:42" },
    { id: "u8", name: "Hendra Wijaya, S.T.", email: "hendra@sgsi.co.id", roles: ["supervisor"], status: "Active", last: "Today, 07:12", created: "2026-10-12", title: "Laboratory Supervisor", phone: "+62 812 5550 1008" },
    { id: "u9", name: "Ir. Bambang Sutrisno, M.T.", email: "bambang@sgsi.co.id", roles: ["manager"], status: "Active", last: "5 Nov 2026", created: "2026-10-12", title: "Head of Laboratory", phone: "+62 812 5550 1009" },
    { id: "u10", name: "Sari Anggraini", email: "sari.a@sgsi.co.id", roles: ["analyst"], status: "Invited", last: "—", created: "2026-11-05", title: "Laboratory Analyst", phone: "", invite: { sent: "2026-11-05", expires: "2026-11-12" } },
    { id: "u11", name: "Joko Santoso", email: "joko@sgsi.co.id", roles: ["prep"], status: "Active", last: "3 Nov 2026", created: "2026-10-14", title: "Sample Preparation Technician", phone: "+62 812 5550 1011" },
    { id: "u12", name: "Dewi Lestiani", email: "dewi.l@sgsi.co.id", roles: ["analyst"], status: "Inactive", last: "12 Oct 2026", created: "2026-10-01", title: "Laboratory Analyst", phone: "" },
  ];
  const SIGNATORIES = [
    { id: "sg1", name: "Ir. Bambang Sutrisno, M.T.", title: "Head of Laboratory" },
    { id: "sg2", name: "Hendra Wijaya, S.T.", title: "Laboratory Supervisor" },
  ];
  const CLIENTS = [
    { id: "BNM", name: "PT Bara Nusantara Mandiri", short: "Bara Nusantara Mandiri", status: "Active", address: "Jl. Mulawarman No. 12, Samarinda, Kalimantan Timur", created: "2026-01-14", contacts: [
      { id: "c1", name: "Budi Hartono", position: "Site Geologist", phone: "+62 812 5550 1844", email: "budi.hartono@baranusa.id", def: true },
      { id: "c2", name: "Sari Wulandari", position: "Finance", phone: "+62 812 5554 0166", email: "sari@baranusa.id" },
      { id: "c3", name: "Dewi Anggraini", position: "Purchasing", phone: "+62 811 5550 0192", email: "dewi@baranusa.id" }] },
    { id: "KEP", name: "PT Kaltara Energi Prima", short: "Kaltara Energi Prima", status: "Active", address: "Jl. Sudirman No. 45, Tarakan, Kalimantan Utara", created: "2026-02-03", contacts: [
      { id: "c4", name: "Andi Pratama", position: "Exploration Manager", phone: "+62 811 5550 3301", email: "andi.pratama@kaltaraenergi.co.id", def: true },
      { id: "c5", name: "Lukas Wibowo", position: "Logistics", phone: "+62 811 5550 3310", email: "lukas@kaltaraenergi.co.id" }] },
    { id: "SBH", name: "CV Sumber Batu Hitam", short: "Sumber Batu Hitam", status: "Active", address: "Jl. Gatot Subroto No. 8, Balikpapan, Kalimantan Timur", created: "2026-02-20", contacts: [
      { id: "c6", name: "Joko Santoso", position: "Director", phone: "+62 812 5550 7781", email: "joko@sumberbatuhitam.co.id", def: true }] },
    { id: "MCR", name: "PT Mahakam Coal Resources", short: "Mahakam Coal Resources", status: "Active", address: "Jl. Pahlawan No. 21, Tenggarong, Kalimantan Timur", created: "2026-03-09", contacts: [
      { id: "c7", name: "Rudi Hartanto", position: "Site Geologist", phone: "+62 813 5550 4410", email: "rudi.h@mahakamcoal.co.id", def: true }] },
    { id: "PTBA", name: "PT Bukit Asam Tbk", short: "Bukit Asam", status: "Active", logo: "ptba", logoFile: { name: "bukit-asam-logo.png", size: 48000, dims: "960 × 270" }, address: "Jl. Parigi No. 1, Tanjung Enim, Sumatera Selatan", created: "2026-04-02", contacts: [
      { id: "c8", name: "Budi Santoso", position: "Site Geologist", phone: "+62 812 7770 1201", email: "budi.santoso@bukitasam.co.id", def: true },
      { id: "c9", name: "Rina Ayu Lestari", position: "Purchasing", phone: "+62 812 7770 1220", email: "rina.ayu@bukitasam.co.id" }] },
    { id: "BLC", name: "PT Berau Lestari Coal", short: "Berau Lestari Coal", status: "Active", address: "Jl. Pemuda No. 3, Tanjung Redeb, Kalimantan Timur", created: "2026-05-11", contacts: [{ id: "c10", name: "Fajar Nugroho", position: "Site Manager", phone: "+62 813 5550 8800", email: "fajar@beraulestari.co.id", def: true }] },
    { id: "MBS", name: "CV Mitra Bara Sejahtera", short: "Mitra Bara Sejahtera", status: "Inactive", address: "Jl. Ahmad Yani No. 77, Banjarmasin, Kalimantan Selatan", created: "2026-03-01", contacts: [{ id: "c11", name: "Hasan Basri", position: "Owner", phone: "+62 812 5000 1122", email: "" }] },
    { id: "TSA", name: "PT Tambang Sentosa Abadi", short: "Tambang Sentosa Abadi", status: "Archived", address: "Jl. Diponegoro No. 5, Samarinda", created: "2026-01-05", contacts: [] },
    { id: "KBM", name: "PT Kutai Batu Mas", short: "Kutai Batu Mas", status: "Archived", address: "Jl. Imam Bonjol No. 9, Sangatta", created: "2026-01-09", contacts: [] },
  ];

  /* ---------- job orders and batches ---------- */
  const DESCS = ["Ply 4 upper", "Ply 4 lower", "Composite", "Ply 5 upper", "Ply 5 lower", "Roof", "Parting", "Floor", "Composite B", "Ply 6 upper", "Ply 6 lower", "Channel sample", "Ply 7", "Ply 8 upper", "Ply 8 lower", "Composite C"];
  const TYPES = ["Ply", "Ply", "Composite", "Ply", "Ply", "Roof and floor", "Parting", "Roof and floor"];
  function regSamples(prefix, start, n, hole) {
    const out = [];
    for (let i = 0; i < n; i++) out.push({ id: prefix + "-" + (start + i), desc: DESCS[i % DESCS.length], type: TYPES[i % TYPES.length], hole: hole, from: (10.2 + i * 0.7).toFixed(2), to: (10.9 + i * 0.7).toFixed(2), batch: null, flag: null });
    return out;
  }
  const svc = (id) => SERVICES.find((s) => s.id === id);
  function order(o) {
    const s = svc(o.service || "basic");
    return Object.assign({ standards: ["ASTM"], params: s.params.slice(), groupItems: {}, sampleType: "Exploration cores", priority: "Standard", signatory: "sg1", createdBy: "Rina Kartika", cso: "Rina Kartika", notes: "", files: [], coas: [], service: "basic", po: "" }, o);
  }
  const orders = [], batches = [];
  function batch(b, ord, ids, extra) {
    const st = b.status, done = B_ORDER.indexOf(st);
    const rows = {};
    ids.forEach((sid, i) => {
      const confirmed = done >= 2;
      const r = { lab: "B" + b.no.slice(-4) + "-" + pad2(i + 1), arrived: confirmed, mass: confirmed ? rr(1.6, 3.2) : null, cond: confirmed ? (i === 5 ? "Wet" : "Good") : "", remark: confirmed && i === 5 ? "Wet on arrival" : "", label: confirmed ? "printed" : "none", photos: [], hold: null, adl: null, values: {} };
      if (done >= 3) r.adl = { v: rr(2.5, 11), by: "Dedi Kurniawan", at: addDaysISO(b.date, 1) };
      if (done >= 5) r.values = values(ord.params);
      rows[sid] = r;
    });
    const full = Object.assign({ std: ord.standards[0], priority: "Standard", params: ord.params.slice(), coc: "", jo: ord.no, samples: ids, rows, log: [], roa: null, createdBy: "Maya Lestari" }, b, extra || {});
    if (done >= 2) full.confirmed = { by: "Dedi Kurniawan", at: addDaysISO(b.date, 0) + "T10:20", of: ids.length };
    if (done >= 3) full.prepDone = { by: "Dedi Kurniawan", at: addDaysISO(b.date, 1) + "T15:40" };
    if (done >= 5) full.anaDone = { by: "Fitri Handayani", at: addDaysISO(b.date, 3) + "T16:05" };
    if (done >= 6) { const tat = 3 + Math.round(rnd() * 4) + (["MCR", "PTBA"].includes(ord.client) ? 1 : 0); full.completed = { by: "Maya Lestari", at: addDaysISO(b.date, tat) + "T11:00" }; full.roa = { no: "RoA-" + b.no.slice(-4), file: "RoA-" + b.no.slice(-4) + "-signed.pdf", by: "Maya Lestari", at: addDaysISO(b.date, tat) }; }
    ids.forEach((sid) => { const s = ord.samples.find((x) => x.id === sid); if (s) s.batch = b.no; });
    batches.push(full);
    return full;
  }
  const pad2 = (n) => String(n).padStart(2, "0");
  function addDaysISO(iso, n) { return addDays(iso, n); }
  function coa(ord, rev, status, published, extra) {
    return Object.assign({ no: "CoA-" + ord.no + "-" + rev, rev, status, published, by: "Maya Lestari", signatory: "sg1", bases: ["ADB", "AR"], params: ord.params.filter((p) => PARAM_INFO[p]), attention: ord.contact, po: ord.po, sends: [] }, extra || {});
  }

  // historic job orders JO-2026-0100 to 0127, one completed batch each (B-2026-0380 to 0407)
  const HIST = ["BNM", "KEP", "SBH", "MCR", "PTBA", "BLC"];
  for (let i = 0; i < 28; i++) {
    const cl = HIST[i % HIST.length], c = CLIENTS.find((x) => x.id === cl);
    const created = addDaysISO("2026-08-03", i * 3), n = 5 + (i % 6);
    const o = order({ no: "JO-2026-" + pad(100 + i), client: cl, contact: c.contacts[0].id, po: "PO " + cl + "-" + (2100 + i * 7), status: i === 27 ? "closed" : "delivered", expected: n, created, due: addDaysISO(created, 9), service: i % 5 === 3 ? "full" : "basic" });
    o.params = svc(o.service).params.slice();
    o.samples = regSamples(cl, 1001 + i * 20, n, "DH-" + cl + "-0" + pad2(5 + (i % 20)));
    orders.push(o);
    const b = batch({ no: "B-2026-" + pad(380 + i), date: addDaysISO(created, 2), deadline: addDaysISO(created, 8), status: "completed" }, o, o.samples.map((s) => s.id));
    const pub = addDaysISO(created, 8);
    o.coas = [coa(o, 1, "sent", pub, { sends: [{ date: addDaysISO(pub, 1), channels: [i % 2 ? "Email" : "WhatsApp"], recipient: c.contacts[0].name }] })];
  }
  const add = (o) => { orders.push(o); return o; };
  // JO-2026-0128: KEP, batch B-2026-0408 Prep finished (Ready for data entry)
  let o = add(order({ no: "JO-2026-0128", client: "KEP", contact: "c4", po: "PO KEP-112", status: "progress", expected: 6, created: "2026-10-27", due: "2026-11-09" }));
  o.samples = regSamples("KEP", 3101, 6, "DH-KEP-014");
  batch({ no: "B-2026-0408", date: "2026-11-02", deadline: "2026-11-08", status: "prepfinished" }, o, o.samples.map((s) => s.id));
  // JO-2026-0129: PTBA, batch B-2026-0409 Analysis finished, past due (Signed RoA to upload)
  o = add(order({ no: "JO-2026-0129", client: "PTBA", contact: "c8", po: "PTBA-2204", status: "progress", expected: 8, created: "2026-10-24", due: "2026-11-06" }));
  o.samples = regSamples("PTBA", 901, 8, "DH-PTBA-007");
  batch({ no: "B-2026-0409", date: "2026-10-28", deadline: "2026-11-04", status: "analysisfinished" }, o, o.samples.map((s) => s.id));
  // JO-2026-0130: PTBA, CoA published, not sent (D1: the Bukit Asam CoA of the Reports frames)
  o = add(order({ no: "JO-2026-0130", client: "PTBA", contact: "c8", po: "PTBA-2210", status: "reported", expected: 8, created: "2026-10-15", due: "2026-10-30", service: "basic" }));
  o.params = o.params.concat(["HGI"]);
  o.samples = regSamples("PTBA", 801, 8, "DH-PTBA-004");
  batch({ no: "B-2026-0412", date: "2026-10-19", deadline: "2026-10-27", status: "completed" }, o, o.samples.map((s) => s.id));
  o.coas = [coa(o, 1, "published", "2026-11-02", { signatory: "sg1", bases: ["ADB", "DB", "AR"] })];
  // JO-2026-0131: BNM, delivered; revision 2 sent, revision 1 superseded; BNM-3507 lives here (D4), BNM-3508 held
  o = add(order({ no: "JO-2026-0131", client: "BNM", contact: "c1", po: "PO 4500-2201", status: "delivered", expected: 8, created: "2026-10-05", due: "2026-10-20" }));
  o.samples = regSamples("BNM", 3501, 8, "DH-BNM-021");
  const b414 = batch({ no: "B-2026-0414", date: "2026-10-08", deadline: "2026-10-16", status: "completed" }, o, o.samples.map((s) => s.id));
  b414.rows["BNM-3508"].hold = "Insufficient"; b414.rows["BNM-3508"].values = {};
  b414.rows["BNM-3507"].values.Ash = 11.8; b414.rows["BNM-3507"].values.GCV = 5420;
  o.coas = [coa(o, 1, "superseded", "2026-10-17", { supersededAt: "2026-11-04", sends: [{ date: "2026-10-18", channels: ["Email"], recipient: "Budi Hartono" }] }),
    coa(o, 2, "sent", "2026-11-04", { reason: "Client reference corrected", sends: [{ date: "2026-11-04", channels: ["Email", "Hard copy"], recipient: "Budi Hartono" }] })];
  // JO-2026-0132: SBH, batches completed, CoA draft (Draft CoA frames)
  o = add(order({ no: "JO-2026-0132", client: "SBH", contact: "c6", po: "PO SBH-0921", status: "progress", expected: 6, created: "2026-10-12", due: "2026-10-28" }));
  o.samples = regSamples("SBH", 1301, 6, "DH-SBH-011");
  batch({ no: "B-2026-0411", date: "2026-10-14", deadline: "2026-10-22", status: "completed" }, o, o.samples.map((s) => s.id));
  o.coas = [coa(o, 0, "draft", null, { no: "Draft CoA" })];
  // JO-2026-0133: KEP delivered, sent by email
  o = add(order({ no: "JO-2026-0133", client: "KEP", contact: "c4", po: "PO KEP-109", status: "delivered", expected: 10, created: "2026-10-01", due: "2026-10-17" }));
  o.samples = regSamples("KEP", 2901, 10, "DH-KEP-011");
  batch({ no: "B-2026-0415", date: "2026-10-03", deadline: "2026-10-10", status: "completed" }, o, o.samples.map((s) => s.id));
  o.coas = [coa(o, 1, "sent", "2026-10-15", { sends: [{ date: "2026-10-16", channels: ["Email"], recipient: "Andi Pratama" }] })];
  // JO-2026-0134: BNM awaiting samples, 6 expected (Samples frame)
  o = add(order({ no: "JO-2026-0134", client: "BNM", contact: "c1", po: "PO 4500-2241", status: "awaiting", expected: 6, created: "2026-11-02", due: "2026-11-14" }));
  o.samples = regSamples("BNM", 3701, 6, "DH-BNM-024");
  // JO-2026-0135: MCR cancelled
  o = add(order({ no: "JO-2026-0135", client: "MCR", contact: "c7", po: "PO MCR-2199", status: "cancelled", expected: 5, created: "2026-10-20", due: "2026-10-26", service: "prep", cancelReason: "Client postponed the drilling campaign" }));
  o.params = []; o.samples = [];
  // JO-2026-0136: SBH draft
  o = add(order({ no: "JO-2026-0136", client: "SBH", contact: "c6", po: "PO SBH-0940", status: "draft", expected: 0, created: "2026-11-03", due: "2026-11-16", service: "prox" }));
  o.params = svc("prox").params.slice(); o.samples = [];
  // JO-2026-0137: KEP awaiting samples, 16 registered, batch B-2026-0422 created with the first 8 (reception demo)
  o = add(order({ no: "JO-2026-0137", client: "KEP", contact: "c4", po: "PO KEP-121", status: "awaiting", expected: 16, created: "2026-10-30", due: "2026-11-10", service: "coking", standards: ["ASTM", "GB/T"] }));
  o.params = svc("coking").params.slice(); o.groupItems = { "Ash analysis": GROUP_PILLS["Ash analysis"].preset.slice() };
  o.samples = regSamples("KEP", 3301, 16, "DH-KEP-018");
  o.files = [{ name: "KEP-sample-list.xlsx", size: 24000, by: "Rina Kartika", at: "2026-10-30" }];
  batch({ no: "B-2026-0422", date: "2026-11-04", deadline: "2026-11-07", status: "created", priority: "Standard", params: ["TM", "IM", "Ash", "VM", "FC", "TS", "GCV", "HGI"] }, o, o.samples.slice(0, 8).map((s) => s.id));
  // JO-2026-0138: BNM reported (CoA published)
  o = add(order({ no: "JO-2026-0138", client: "BNM", contact: "c1", po: "PO 4500-2230", status: "reported", expected: 12, created: "2026-10-09", due: "2026-10-24" }));
  o.samples = regSamples("BNM", 3601, 12, "DH-BNM-022");
  batch({ no: "B-2026-0416", date: "2026-10-12", deadline: "2026-10-20", status: "completed" }, o, o.samples.map((s) => s.id));
  o.coas = [coa(o, 1, "published", "2026-11-03")];
  // JO-2026-0139: MCR in progress, past due; samples in every state (Revision B story)
  o = add(order({ no: "JO-2026-0139", client: "MCR", contact: "c7", po: "PO MCR-2207", status: "progress", expected: 8, created: "2026-10-20", due: "2026-11-04" }));
  o.samples = regSamples("MCR", 2201, 8, "DH-MCR-009");
  o.files = [{ name: "MCR-request-letter.pdf", size: 182000, by: "Rina Kartika", at: "2026-10-20" }];
  const b420 = batch({ no: "B-2026-0420", date: "2026-10-31", deadline: "2026-11-05", status: "preparation" }, o, ["MCR-2201", "MCR-2202", "MCR-2203", "MCR-2204"]);
  b420.confirmed.of = 6; b420.log.push({ at: "2026-11-01T10:20", by: "Dedi Kurniawan", text: "Confirmed with 4 of 6 expected. Returned to JO-2026-0139: MCR-2205, MCR-2206." });
  batch({ no: "B-2026-0421", date: "2026-11-04", deadline: "2026-11-07", status: "created" }, o, ["MCR-2205", "MCR-2207"]);
  o.samples.find((s) => s.id === "MCR-2206").flag = { state: "awaiting", from: "B-2026-0420" };
  o.samples.find((s) => s.id === "MCR-2208").flag = { state: "notreceived", reason: "Client did not send it", by: "Rina Kartika", at: "2026-11-03" };
  // JO-2026-0140: SBH delivered, two batches, sent by WhatsApp
  o = add(order({ no: "JO-2026-0140", client: "SBH", contact: "c6", po: "PO SBH-0931", status: "delivered", expected: 12, created: "2026-10-06", due: "2026-10-22", service: "full" }));
  o.params = svc("full").params.slice(); o.groupItems = { "Ash analysis": GROUP_PILLS["Ash analysis"].preset.slice() };
  o.samples = regSamples("SBH", 1201, 12, "DH-SBH-008");
  batch({ no: "B-2026-0410", date: "2026-10-08", deadline: "2026-10-18", status: "completed" }, o, o.samples.slice(0, 6).map((s) => s.id));
  batch({ no: "B-2026-0413", date: "2026-10-10", deadline: "2026-10-20", status: "completed" }, o, o.samples.slice(6).map((s) => s.id));
  o.coas = [coa(o, 1, "sent", "2026-10-21", { sends: [{ date: "2026-10-22", channels: ["WhatsApp"], recipient: "Joko Santoso" }] })];
  // JO-2026-0141: KEP, every batch completed, CoA to generate (D3: Kaltara contact)
  o = add(order({ no: "JO-2026-0141", client: "KEP", contact: "c5", po: "PO KEP-118", status: "progress", expected: 8, created: "2026-10-16", due: "2026-11-06" }));
  o.samples = regSamples("KEP", 2101, 8, "DH-KEP-012");
  o.files = [{ name: "KEP-118-PO.pdf", size: 96000, by: "Rina Kartika", at: "2026-10-16" }, { name: "Chain-of-custody.pdf", size: 140000, by: "Dedi Kurniawan", at: "2026-10-21" }];
  batch({ no: "B-2026-0419", date: "2026-10-21", deadline: "2026-10-31", status: "completed" }, o, o.samples.map((s) => s.id));
  // JO-2026-0142: BNM in progress, B-2026-0417 completed, B-2026-0418 in Analysis
  o = add(order({ no: "JO-2026-0142", client: "BNM", contact: "c1", po: "PO 4500-2231", status: "progress", expected: 12, created: "2026-10-26", due: "2026-11-12", notes: "Deliver a hard copy together with the email." }));
  o.samples = regSamples("BNM", 3401, 12, "DH-BNM-031");
  o.files = [{ name: "BNM-request.pdf", size: 210000, by: "Rina Kartika", at: "2026-10-26" }, { name: "Sample-list.xlsx", size: 18000, by: "Rina Kartika", at: "2026-10-26" }];
  batch({ no: "B-2026-0417", date: "2026-10-28", deadline: "2026-11-03", status: "completed" }, o, o.samples.slice(0, 6).map((s) => s.id));
  const b418 = batch({ no: "B-2026-0418", date: "2026-10-30", deadline: "2026-11-06", status: "analysis" }, o, o.samples.slice(6).map((s) => s.id));
  b418.samples.forEach((sid, i) => { if (i < 4) b418.rows[sid].values = values(["IM", "Ash", "VM", "FC", "TS", "GCV"].concat(i < 2 ? ["TM"] : [])); });
  b418.rows[b418.samples[3]].values.Ash = 18.62;

  /* ---------- notifications and audit ---------- */
  const NOTES = [
    { id: "n1", to: ["lab_admin", "prep"], ev: "N1", icon: "stack", title: "B-2026-0422 is ready to receive", text: "Created by Maya Lestari for JO-2026-0137.", at: "2026-11-04T15:10", link: "batch-B-2026-0422", read: [] },
    { id: "n2", to: ["lab_admin"], ev: "N4", icon: "flask", title: "B-2026-0409 analysis is finished", text: "Upload the signed RoA to complete the batch.", at: "2026-11-04T16:05", link: "batch-B-2026-0409-analysis", read: [] },
    { id: "n3", to: ["lab_admin"], ev: "N5", icon: "certificate", title: "All batches of JO-2026-0141 are completed", text: "Generate the CoA.", at: "2026-11-05T08:30", link: "order-JO-2026-0141-coa", read: [] },
    { id: "n4", to: ["cso"], ev: "N6", icon: "certificate", title: "CoA-JO-2026-0130-1 is published", text: "Send it to PT Bukit Asam Tbk.", at: "2026-11-02T14:20", link: "report-CoA-JO-2026-0130-1", read: [] },
    { id: "n5", to: ["cso"], ev: "N2", icon: "warning", title: "1 sample of JO-2026-0139 did not arrive", text: "Add it to a new batch when it comes, or mark it not received.", at: "2026-11-01T10:21", link: "order-JO-2026-0139-samples", read: ["cso"] },
    { id: "n6", to: ["analyst"], ev: "N3", icon: "flask", title: "B-2026-0408 is ready for data entry", text: "6 samples, ADL done by Dedi Kurniawan.", at: "2026-11-03T15:40", link: "batch-B-2026-0408-analysis", read: [] },
    { id: "n7", to: ["prep", "lab_admin", "cso"], ev: "N7", icon: "alarm", title: "B-2026-0420 is due within 24 h", text: "It is still in preparation.", at: "2026-11-04T17:00", link: "batch-B-2026-0420-preparation", read: ["lab_admin"] },
    { id: "n8", to: ["supervisor", "manager"], ev: "N8", icon: "alarm", title: "B-2026-0409 is past due", text: "Due 4 Nov. It is in Analysis finished.", at: "2026-11-05T00:05", link: "batch-B-2026-0409", read: [] },
  ];
  const AUDIT = [
    { id: "a1", at: "2026-11-05T08:02", user: "Wahyu Pratama", type: "Sign-in", rec: "wahyu@sgsi.co.id", action: "Signed in", fields: [] },
    { id: "a2", at: "2026-11-05T07:58", user: "Bagus Prasetyo, A.Md.", type: "Sign-in", rec: "bagus@sgsi.co.id", action: "Account locked", fields: [["Failed attempts", "4", "5"]] },
    { id: "a3", at: "2026-11-04T16:05", user: "Fitri Handayani", type: "Batch", rec: "B-2026-0409", action: "Status changed", fields: [["Status", "Analysis", "Analysis finished"]], screen: "Batch page, Analysis tab" },
    { id: "a4", at: "2026-11-04T15:10", user: "Maya Lestari", type: "Batch", rec: "B-2026-0422", action: "Created", fields: [["Samples", "", "8"], ["Standard", "", "ASTM"]], screen: "Job order, Add batch" },
    { id: "a5", at: "2026-11-04T11:02", user: "Maya Lestari", type: "Report", rec: "CoA-JO-2026-0131-2", action: "Published", fields: [["Revision", "1", "2"], ["Client reference", "PO 4500-2210", "PO 4500-2201"]], screen: "Reports, CoA page" },
    { id: "a6", at: "2026-11-03T10:15", user: "Rina Kartika", type: "Sample", rec: "MCR-2208", action: "Status changed", fields: [["State", "Expected", "Not received"], ["Reason", "", "Client did not send it"]], screen: "Job order, Samples tab" },
    { id: "a7", at: "2026-10-18T09:12", user: "Fitri Handayani", type: "Result", rec: "BNM-3507", action: "Updated", fields: [["Ash (ADB)", "11.24", "11.80"]], screen: "Batch page, Analysis tab" },
    { id: "a8", at: "2026-10-16T14:40", user: "Fitri Handayani", type: "Result", rec: "BNM-3507", action: "Created", fields: [["Ash (ADB)", "", "11.24"], ["GCV (ADB)", "", "5,420"]], screen: "Batch page, Analysis tab" },
    { id: "a9", at: "2026-10-09T15:30", user: "Dedi Kurniawan", type: "Sample", rec: "BNM-3507", action: "Updated", fields: [["ADL", "", "6.10"]], screen: "Batch page, Preparation tab" },
    { id: "a10", at: "2026-10-08T10:20", user: "Dedi Kurniawan", type: "Sample", rec: "BNM-3507", action: "Status changed", fields: [["State", "In batch", "Received"], ["Mass (kg)", "", "2.40"], ["Condition", "", "Good"]], screen: "Batch page, Reception tab" },
    { id: "a11", at: "2026-10-08T09:05", user: "Maya Lestari", type: "Sample", rec: "BNM-3507", action: "Updated", fields: [["Batch", "", "B-2026-0414"]], screen: "Job order, Add batch" },
    { id: "a12", at: "2026-10-05T13:44", user: "Rina Kartika", type: "Sample", rec: "BNM-3507", action: "Created", fields: [["Sample ID", "", "BNM-3507"], ["Drill hole", "", "DH-BNM-021"]], screen: "Job order, Samples tab" },
    { id: "a13", at: "2026-11-02T09:40", user: "Wahyu Pratama", type: "Configuration", rec: "Validation rule V-31", action: "Changed setting", fields: [["Upper bound (%)", "40", "45"]], screen: "Configuration, Validation rules" },
    { id: "a14", at: "2026-11-01T10:20", user: "Dedi Kurniawan", type: "Batch", rec: "B-2026-0420", action: "Status changed", fields: [["Status", "Receiving", "Preparation"], ["Samples", "6", "4"]], screen: "Batch page, Reception tab" },
    { id: "a15", at: "2026-10-30T08:55", user: "Rina Kartika", type: "Job order", rec: "JO-2026-0137", action: "Created", fields: [["Client", "", "PT Kaltara Energi Prima"], ["Service", "", "Coking coal"]], screen: "Job orders, New job order" },
    { id: "a16", at: "2026-11-05T07:30", user: "Rina Kartika", type: "Sign-in", rec: "rina@sgsi.co.id", action: "Signed in", fields: [] },
    { id: "a17", at: "2026-11-04T13:00", user: "Wahyu Pratama", type: "User", rec: "Sari Anggraini", action: "Created", fields: [["Roles", "", "Analyst"], ["Status", "", "Invited"]], screen: "Users, Add user" },
    { id: "a18", at: "2026-11-02T16:12", user: "Rina Kartika", type: "Report", rec: "CoA-JO-2026-0133-1", action: "Exported", fields: [], screen: "Reports" },
  ];

  /* ---------- master data ---------- */
  const DRILL = [];
  const DH_CL = [["BNM", 30], ["KEP", 22], ["SBH", 16], ["MCR", 14], ["PTBA", 12], ["BLC", 6]];
  let dn = 0;
  DH_CL.forEach(([cl, n]) => { for (let i = 1; i <= n; i++) { dn++; const code = "DH-" + cl + "-0" + pad2(i + 4);
    const missing = [3, 9, 17, 22, 28, 35, 41, 47, 55, 63, 72, 88].includes(dn), arch = [5, 44, 90].includes(dn);
    DRILL.push({ code, desc: "Batch " + (1 + (i % 9)), cl, samples: arch ? 0 : 4 + (dn * 7) % 23, status: arch ? "Archived" : "Active", coa: missing || arch ? null : { file: "CoA-" + code.slice(3) + ".pdf", at: addDaysISO("2026-06-01", dn), history: [{ file: "CoA-" + code.slice(3) + ".pdf", at: addDaysISO("2026-06-01", dn), by: "Maya Lestari" }] } }); } });
  ["DH-BNM-021", "DH-BNM-022", "DH-BNM-024", "DH-BNM-031"].forEach((c, i) => { if (!DRILL.find((d) => d.code === c)) DRILL.push({ code: c, desc: "Batch " + (5 + i), cl: "BNM", samples: 12, status: "Active", coa: i === 3 ? null : { file: "CoA-" + c.slice(3) + ".pdf", at: "2026-09-12", history: [{ file: "CoA-" + c.slice(3) + ".pdf", at: "2026-09-12", by: "Maya Lestari" }] } }); });
  const LITHO = [["Coal", "Coal", "BNM", 412], ["Claystone", "Parting", "BNM", 64], ["Carbonaceous Claystone", "Parting", "KEP", 38], ["Sandstone", "Parting", "KEP", 21], ["Siltstone", "Parting", "SBH", 17], ["Mudstone", "Parting", "MCR", 9], ["Shale", "Parting", "PTBA", 6], ["Core loss", "No lithology", "BNM", 5], ["Unknown", "No lithology", "KEP", 2]].map(([name, kind, cl, n], i) => ({ id: "l" + i, name, kind, cl, samples: n, status: "Active" }));
  const SEAMS = []; ["BNM", "KEP", "SBH", "MCR", "PTBA", "BLC"].forEach((cl, ci) => { const n = [14, 12, 10, 10, 9, 7][ci]; for (let i = 0; i < n; i++) { const L = "ABCDEFG"[Math.floor(i / 3)], k = (i % 3) + 1; SEAMS.push({ id: cl + i, code: L + (ci + 1) + ["U", "M", "L"][i % 3] + k, desc: "Seam " + L + (ci + 1) + ", " + ["upper", "middle", "lower"][i % 3] + " " + k, cl, order: i + 1, status: "Active" }); } });

  /* ---------- configuration ---------- */
  const CONFIG = {
    params: PARAM_GROUPS.flatMap((g) => g.items.map((p) => { const info = PARAM_INFO[p] || [p, g.id === "coking" ? "" : "%", "—", 1, 0, 100];
      return { code: SHORT(p), name: info[0] === p && g.id === "coking" ? p : info[0], group: g.label, unit: info[1], basis: info[2], dec: info[3], lo: info[4], hi: info[5], qual: ["Cl", "P", "Hg", "F", "Trace elements"].includes(p), active: true }; })),
    services: SERVICES.map((s) => Object.assign({}, s)),
    methods: [["Ash", "ASTM", "D3174", 2023, 0.15, 0.30], ["Ash", "ISO", "1171", 2010, 0.2, 0.3], ["Ash", "GB/T", "212", 2008, 0.2, 0.3], ["IM", "ASTM", "D3173", 2017, 0.1, 0.2], ["IM", "ISO", "11722", 2013, 0.1, 0.2], ["VM", "ASTM", "D3175", 2020, 0.5, 1.0], ["VM", "ISO", "562", 2010, 0.3, 0.6], ["TS", "ASTM", "D4239", 2018, 0.05, 0.1], ["TS", "ISO", "19579", 2006, 0.05, 0.1], ["GCV", "ASTM", "D5865", 2019, 120, 240], ["GCV", "ISO", "1928", 2020, 120, 300], ["TM", "ASTM", "D3302", 2022, 0.3, 0.6], ["HGI", "ASTM", "D409", 2016, 2, 4], ["CSN", "ASTM", "D720", 2015, 0.5, 1], ["G – Index", "GB/T", "5447", 2014, 2, 4]].map(([p, s, m, e, r, R]) => ({ p, s, m, e, r, R, title: "Standard Test Method for " + p })),
    rules: [["V-01", "Total of IM + Ash + VM + FC", "Equals 100 ± 0.05 %", "Block"], ["V-12", "TM ≥ IM", "Total moisture not below inherent moisture", "Block"], ["V-31", "Ash (ADB)", "0 to 45 %", "Warn"], ["V-32", "VM (ADB)", "5 to 55 %", "Warn"], ["V-40", "GCV (ADB)", "2,500 to 8,000 kcal/kg", "Warn"], ["V-44", "TS (ADB)", "0 to 6 %", "Warn"], ["V-50", "ADL", "0 to 20 %", "Warn"]].map(([id, what, bound, sev]) => ({ id, what, bound, sev, active: true })),
    templates: [{ name: "Certificate of Analysis", code: "FM-LAB-014", rev: 3, since: "2026-10-01", status: "Current" }, { name: "Certificate of Analysis", code: "FM-LAB-014", rev: 2, since: "2026-03-01", status: "Retired" }, { name: "Sample label", code: "FM-LAB-021", rev: 1, since: "2026-03-01", status: "Current" }],
    lookups: { "Sample conditions": [["Good", false], ["Damp", true], ["Wet", true], ["Damaged bag", true], ["Contaminated", true]], "Hold reasons": [["Damaged", false], ["Insufficient", false], ["Client request", false], ["Other", true]], "Photo tags": [["Condition", false], ["Weighing", false], ["Other", false]], "Lithology kinds": [["Coal", false], ["Parting", false], ["No lithology", false]], "Send channels": [["Hard copy", false], ["Email", false], ["WhatsApp", false], ["Other", true]] },
    lab: { name: "PT Sentra Geo Survey Indonesia", accr: "LP-1234-IDN", place: "Samarinda", jo: "JO-YYYY-NNNN", batch: "B-YYYY-NNNN", lab: "B{batch}-NN", coa: "CoA-{job order}-{revision}" },
    security: { lockAfter: 5, lockFor: 15, idle: 30, warn: 60, minLen: 10, letterNum: true, notEmail: true, special: false, resetValid: 60, inviteValid: 7 },
  };
  const QUERIES = [
    { id: "q1", name: "High-ash BNM samples", owner: "Maya Lestari", shared: true, type: "Samples", match: "all", conds: [["Drill hole", "is", "DH-BNM-021"], ["Result: Ash", "greater than", "10"], ["Received date", "between", "2026-10-01..2026-10-31"]] },
    { id: "q2", name: "Wet samples this month", owner: "Maya Lestari", shared: false, type: "Samples", match: "all", conds: [["Condition", "is", "Wet"]] },
    { id: "q3", name: "Late batches", owner: "Hendra Wijaya, S.T.", shared: true, type: "Batches", match: "any", conds: [["Status", "is not", "Completed"], ["Deadline", "before", TODAY]] },
  ];

  function seed() {
    return clone({ version: 2, clients: CLIENTS, signatories: SIGNATORIES, users: USERS, orders, batches, notes: NOTES, audit: AUDIT, drill: DRILL, litho: LITHO, seams: SEAMS, config: CONFIG, queries: QUERIES, recent: ["BNM-3507", "B-2026-0418", "JO-2026-0137"], prefs: {} });
  }

  return { TODAY, NOW, ROLES, ROLE_LABEL, ROLE_FULL, PERSONA, NAV, VISIBLE, START, can, P, PERM_GRID, ROLE_DESC, PARAM_GROUPS, DEPENDS, STANDARDS, STD_METHODS, covered, coverTags, SUBCONTRACTED, GROUP_PILLS, BASIC, SERVICES, PARAM_INFO, SHORT,
    JO_STATUS, B_STATUS, B_ORDER, S_STATE, COA_STATUS, values, seed };
})();

/* ---------- selectors used by every module ---------- */
const S = {
  client: (db, id) => db.clients.find((c) => c.id === id),
  contact: (db, o) => { const c = S.client(db, o.client); return c && c.contacts.find((x) => x.id === o.contact); },
  order: (db, no) => db.orders.find((o) => o.no === no),
  batch: (db, no) => db.batches.find((b) => b.no === no),
  batchesOf: (db, no) => db.batches.filter((b) => b.jo === no),
  user: (db, id) => db.users.find((u) => u.id === id),
  userByName: (db, n) => db.users.find((u) => u.name === n),
  signatory: (db, id) => db.signatories.find((s) => s.id === id),
  /* sample state on the job order (C6: Expected, In batch, Received, Awaiting arrival, Not received) */
  sampleState(db, o, s) {
    if (s.flag && s.flag.state === "notreceived") return "notreceived";
    if (s.flag && s.flag.state === "awaiting") return "awaiting";
    if (!s.batch) return "expected";
    const b = S.batch(db, s.batch); if (!b) return "expected";
    const r = b.rows[s.id];
    if (r && r.hold) return "held";
    return b.confirmed ? "received" : "inbatch";
  },
  currentCoa: (o) => { const live = o.coas.filter((c) => c.status !== "superseded" && c.status !== "void"); return live[live.length - 1] || null; },
  coaState(db, o) { // none | ready | draft | published | sent
    const c = S.currentCoa(o); if (c) return c.status;
    const bs = S.batchesOf(db, o.no);
    const allIn = o.samples.length && o.samples.every((s) => s.batch || (s.flag && s.flag.state === "notreceived"));
    return bs.length && allIn && bs.every((b) => b.status === "completed") ? "ready" : "none";
  },
  received: (db, o) => o.samples.filter((s) => S.sampleState(db, o, s) === "received" || S.sampleState(db, o, s) === "held").length,
  allCoas(db) { const out = []; db.orders.forEach((o) => o.coas.forEach((c) => out.push(Object.assign({ jo: o.no, client: o.client }, c)))); return out; },
  allRoas(db) { return db.batches.filter((b) => b.roa).map((b) => Object.assign({ batch: b.no, jo: b.jo, client: S.order(db, b.jo).client }, b.roa)); },
  progress(b) { // "values saved or samples received, by step"
    const n = b.samples.length;
    if (["created", "receiving"].includes(b.status)) return [b.samples.filter((s) => b.rows[s].arrived).length, n];
    if (["preparation", "prepfinished"].includes(b.status)) return [b.samples.filter((s) => b.rows[s].adl).length, n];
    const want = b.params.filter((p) => D.PARAM_INFO[p] && !["Ash analysis", "Trace elements", "Metal in ash", "Sizing"].includes(p)).length * b.samples.filter((s) => !b.rows[s].hold).length;
    const have = b.samples.reduce((a, s) => a + Object.keys(b.rows[s].values).length, 0);
    return [Math.min(have, want), want];
  },
};
