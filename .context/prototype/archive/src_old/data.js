/* Demo data for the job order prototype. Invented companies and contacts; people are the spec personas (section 8.1).
   "Today" is fixed at Tuesday 27 October 2026 so dates and "past due" read the same for every reviewer. */
window.PROTO = (function () {
  const TODAY = "2026-10-27";

  const PARAM_GROUPS = [
    { id: "moisture", label: "Moisture", items: ["TM", "IM", "EQM"] },
    { id: "proximate", label: "Proximate", items: ["Ash", "VM", "FC"] },
    { id: "sulfur", label: "Sulfur", items: ["TS", "Forms of sulfur"] },
    { id: "calorific", label: "Calorific", items: ["GCV", "NCV"] },
    { id: "ultimate", label: "Ultimate", items: ["C", "H", "N", "O"] },
    { id: "physical", label: "Physical", items: ["HGI", "RD", "Sizing"] },
    { id: "ash", label: "Ash", items: ["AFT reducing", "AFT oxidising", "Ash analysis", "Metal in ash"] },
    { id: "chemical", label: "Chemical", items: ["Cl", "P", "F", "Hg", "Trace elements"] },
    { id: "coking", label: "Coking coal", items: ["CSN", "Gieseler", "Dilatation", "Ro", "Macerals", "G index", "Y value", "Roga", "Gray-King", "CSR/CRI"] },
  ];
  // Calculated results need their inputs: turning the left one on adds and locks the right ones.
  const DEPENDS = { FC: ["IM", "Ash", "VM"], NCV: ["GCV", "TM", "H"] };
  const GBT_ONLY = ["G index", "Y value"];
  const SUBCONTRACTED = ["CSR/CRI"];

  const GROUP_PILLS = {
    "Ash analysis": {
      title: "Ash analysis",
      sections: [
        { label: "Oxides", items: ["SiO₂", "Al₂O₃", "Fe₂O₃", "CaO", "MgO", "Na₂O", "K₂O", "TiO₂", "P₂O₅", "SO₃", "Mn₃O₄", "BaO", "SrO", "ZnO"] },
        { label: "Ratios and indices", items: ["Base/acid ratio", "Silica ratio", "SiO₂/Al₂O₃", "Fe₂O₃/CaO", "Slagging index Rs", "Fouling index Rf", "Alkali index", "Total alkalis (Na₂O eq.)", "Basicity index", "Silica value", "Viscosity index Sr", "Ash loading", "Dolomite ratio", "Iron + calcium", "Fusion index"] },
      ],
      preset: ["SiO₂", "Al₂O₃", "Fe₂O₃", "CaO", "MgO", "Na₂O", "K₂O", "TiO₂", "Base/acid ratio"],
    },
    "Trace elements": {
      title: "Trace elements",
      sections: [
        { label: "Elements", items: ["As", "B", "Ba", "Be", "Cd", "Co", "Cr", "Cu", "Ga", "Ge", "Li", "Mn", "Mo", "Ni", "Pb", "Rb", "Sb", "Sc", "Se", "Sn", "Sr", "Th", "Tl", "U", "V", "W", "Zn", "Zr", "Ag", "Bi", "Cs", "Nb", "Ta", "Y", "La", "Ce"] },
      ],
      preset: ["As", "Cd", "Cr", "Pb", "Se"],
    },
  };

  const BASIC = ["TM", "IM", "Ash", "VM", "FC", "TS", "GCV"];
  const TEMPLATES = [
    { id: "basic", label: "TM + Prox + TS + CV", params: BASIC, days: 5 },
    { id: "prox", label: "Prox only", params: ["IM", "Ash", "VM", "FC"], days: 3 },
    { id: "full", label: "Full analysis", params: BASIC.concat(["NCV", "C", "H", "N", "O", "HGI", "RD", "Sizing", "AFT reducing", "AFT oxidising", "Ash analysis", "Cl", "Forms of sulfur"]), days: 10 },
    { id: "coking", label: "Coking coal", params: BASIC.concat(["CSN", "Gieseler", "Dilatation", "Ro", "Macerals", "P", "Ash analysis"]), gbt: ["G index", "Y value"], days: 12 },
    { id: "prep", label: "Preparation only", params: [], days: 2 },
  ];

  const PEOPLE = {
    cso: { name: "Rina Kartika", short: "RK", title: "Customer Service Officer" },
    lab_admin: { name: "Maya Lestari", short: "ML", title: "Laboratory Administrator" },
    prep: { name: "Dedi Kurniawan", short: "DK", title: "Sample Preparation Technician" },
  };

  function seed() {
    const companies = [
      { id: "bnm", name: "PT Bara Nusantara Mandiri", address: "Jl. Mulawarman No. 12, Samarinda, Kalimantan Timur", prefix: "BNM" },
      { id: "kep", name: "PT Kaltara Energi Prima", address: "Jl. Sudirman No. 45, Tarakan, Kalimantan Utara", prefix: "KEP" },
      { id: "sbh", name: "CV Sumber Batu Hitam", address: "Jl. Gatot Subroto No. 8, Balikpapan, Kalimantan Timur", prefix: "SBH" },
      { id: "mcr", name: "PT Mahakam Coal Resources", address: "Jl. Pahlawan No. 21, Tenggarong, Kalimantan Timur", prefix: "MCR" },
    ];
    const contacts = [
      { id: "ct1", company: "bnm", name: "Budi Hartono", phone: "+62 812 5550 1844", email: "budi.hartono@baranusantara.co.id" },
      { id: "ct2", company: "bnm", name: "Sari Wulandari", phone: "+62 813 5550 2290", email: "" },
      { id: "ct3", company: "kep", name: "Andi Pratama", phone: "+62 811 5550 3301", email: "andi.pratama@kaltaraenergi.co.id" },
      { id: "ct4", company: "sbh", name: "Yohanes Lie", phone: "+62 812 5550 7781", email: "" },
      { id: "ct5", company: "mcr", name: "Dewi Anggraini", phone: "+62 813 5550 4410", email: "dewi.anggraini@mahakamcoal.co.id" },
      { id: "ct6", company: "mcr", name: "Rudy Simanjuntak", phone: "+62 811 5550 9012", email: "rudy.s@mahakamcoal.co.id" },
    ];
    const signatories = [
      { id: "sg1", name: "Ir. Bambang Sutrisno, M.T.", title: "Laboratory Manager" },
      { id: "sg2", name: "Hendra Wijaya, S.T.", title: "Laboratory Supervisor" },
    ];

    const descs = ["Ply 4 upper", "Ply 4 lower", "Composite", "Ply 5 upper", "Ply 5 lower", "Roof", "Parting", "Floor", "Composite B", "Ply 6 upper", "Ply 6 lower", "Channel sample", "Ply 7", "Ply 8 upper", "Ply 8 lower", "Composite C"];
    function makeSamples(prefix, start, n, opts) {
      const o = opts || {};
      const out = [];
      for (let i = 0; i < n; i++) {
        const from = (12.4 + i * 0.7).toFixed(2), to = (13.1 + i * 0.7).toFixed(2);
        out.push({
          key: prefix + (start + i),
          id: prefix + "-" + (start + i),
          desc: descs[i % descs.length],
          depth: "DH " + prefix + "-022 · " + from + "–" + to + " m",
          remarks: i === 2 ? "Composite" : i === 5 ? "Wet sample" : "",
          batch: o.batch && i < (o.inBatch || n) ? o.batch : "",
          received: o.received ? { by: "Dedi Kurniawan", at: o.receivedAt || "20 Oct 2026, 14:10" } : null,
        });
      }
      return out;
    }

    const orders = [
      { no: "JO-2026-0142", company: "bnm", contact: "ct1", po: "PO 4500-2231", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Exploration cores", expected: 12, due: "2026-10-24", priority: "Standard", signatory: "sg1", prep: true, status: "progress", step: 2, created: "12 Oct 2026", createdBy: "Rina Kartika", notes: "Deliver a hard copy together with the email.",
        samples: makeSamples("BNM", 3401, 12, { batch: "B-2026-0417", received: true }), coa: { state: "notready" }, files: 2 },
      { no: "JO-2026-0141", company: "kep", contact: "ct3", po: "PO KEP-118", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Shipment", expected: 8, due: "2026-10-22", priority: "Standard", signatory: "sg1", prep: true, status: "reported", step: 5, created: "9 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("KEP", 2101, 8, { batch: "B-2026-0411", received: true, receivedAt: "10 Oct 2026, 09:30" }), coa: { state: "published", number: "CoA-JO-2026-0141-1", rev: 1, published: "23 Oct 2026", by: "Maya Lestari" }, files: 3 },
      { no: "JO-2026-0140", company: "sbh", contact: "ct4", po: "PO SBH-0931", standards: ["ASTM"], template: "full", params: TEMPLATES[2].params.slice(), groupItems: { "Ash analysis": GROUP_PILLS["Ash analysis"].preset.slice() }, sampleType: "Exploration cores", expected: 6, due: "2026-10-20", priority: "Urgent", signatory: "sg2", prep: true, status: "delivered", step: 6, created: "1 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("SBH", 1201, 6, { batch: "B-2026-0402", received: true, receivedAt: "2 Oct 2026, 10:05" }), coa: { state: "sent", number: "CoA-JO-2026-0140-1", rev: 1, published: "18 Oct 2026", by: "Maya Lestari", sent: [{ channel: "email", to: "Yohanes Lie", date: "19 Oct" }] }, files: 2 },
      { no: "JO-2026-0139", company: "mcr", contact: "ct5", po: "PO MCR-2210", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Exploration cores", expected: 24, due: "2026-10-30", priority: "Standard", signatory: "sg1", prep: true, status: "progress", step: 2, created: "14 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("MCR", 5501, 24, { batch: "B-2026-0419", inBatch: 18, received: true }), coa: { state: "notready" }, files: 1 },
      { no: "JO-2026-0138", company: "kep", contact: "ct3", po: "PO KEP-121", standards: ["ASTM"], template: "prox", params: TEMPLATES[1].params.slice(), groupItems: {}, sampleType: "Shipment", expected: 10, due: "2026-11-03", priority: "Standard", signatory: "sg1", prep: true, status: "awaiting", step: 0, created: "20 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("KEP", 2201, 10), coa: { state: "notready" }, files: 0 },
      { no: "JO-2026-0137", company: "bnm", contact: "ct1", po: "PO 4500-2240", standards: ["ASTM", "GB/T"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Exploration cores", expected: 16, due: "2026-11-06", priority: "Standard", signatory: "sg1", prep: true, status: "awaiting", step: 0, created: "22 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("BNM", 3501, 16), coa: { state: "notready" }, files: 1 },
      { no: "JO-2026-0136", company: "sbh", contact: "ct4", po: "PO SBH-0925", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Shipment", expected: 4, due: "2026-10-16", priority: "Standard", signatory: "sg1", prep: true, status: "delivered", step: 6, created: "29 Sep 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("SBH", 1101, 4, { batch: "B-2026-0398", received: true, receivedAt: "30 Sep 2026, 13:20" }), coa: { state: "sent", number: "CoA-JO-2026-0136-1", rev: 1, published: "15 Oct 2026", by: "Maya Lestari", sent: [{ channel: "whatsapp", to: "Yohanes Lie", date: "15 Oct" }] }, files: 2 },
      { no: "JO-2026-0135", company: "mcr", contact: "ct6", po: "", standards: ["ASTM"], template: null, params: [], groupItems: {}, sampleType: "Exploration cores", expected: null, due: "", priority: "Standard", signatory: null, prep: true, status: "draft", step: 0, created: "26 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: [], coa: { state: "notready" }, files: 0 },
      { no: "JO-2026-0134", company: "bnm", contact: "ct2", po: "PO 4500-2216", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Exploration cores", expected: 6, due: "2026-10-31", priority: "Standard", signatory: "sg1", prep: true, status: "awaiting", step: 0, created: "19 Oct 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("BNM", 3301, 6), coa: { state: "notready" }, files: 1 },
      { no: "JO-2026-0133", company: "kep", contact: "ct3", po: "PO KEP-109", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Shipment", expected: 5, due: "2026-10-21", priority: "Standard", signatory: "sg1", prep: true, status: "cancelled", step: 0, created: "7 Oct 2026", createdBy: "Rina Kartika", notes: "", cancelReason: "Client postponed the shipment.",
        samples: [], coa: { state: "notready" }, files: 0 },
      { no: "JO-2026-0132", company: "mcr", contact: "ct5", po: "PO MCR-2188", standards: ["ASTM"], template: "basic", params: BASIC.slice(), groupItems: {}, sampleType: "Exploration cores", expected: 10, due: "2026-10-09", priority: "Standard", signatory: "sg1", prep: true, status: "closed", step: 6, created: "22 Sep 2026", createdBy: "Rina Kartika", notes: "",
        samples: makeSamples("MCR", 5401, 10, { batch: "B-2026-0390", received: true, receivedAt: "23 Sep 2026, 11:00" }), coa: { state: "sent", number: "CoA-JO-2026-0132-1", rev: 1, published: "8 Oct 2026", by: "Maya Lestari", sent: [{ channel: "hardcopy", to: "Dewi Anggraini", date: "9 Oct" }] }, files: 3 },
      { no: "JO-2026-0131", company: "sbh", contact: "ct4", po: "PO SBH-0918", standards: ["ASTM", "GB/T"], template: "coking", params: TEMPLATES[3].params.concat(["G index", "Y value"]), groupItems: { "Ash analysis": GROUP_PILLS["Ash analysis"].preset.slice() }, sampleType: "Exploration cores", expected: 8, due: "2026-11-02", priority: "Standard", signatory: "sg2", prep: true, status: "progress", step: 2, created: "15 Oct 2026", createdBy: "Rina Kartika", notes: "Coking coal evaluation for a potential buyer in China.",
        samples: makeSamples("SBH", 1301, 8, { batch: "B-2026-0414", received: true, receivedAt: "16 Oct 2026, 08:45" }), coa: { state: "notready" }, files: 2 },
    ];

    const batches = [
      { no: "B-2026-0417", order: "JO-2026-0142", standard: "ASTM", date: "21 Oct 2026", samples: 12, params: BASIC.slice(), extra: [], status: "analysis", prep: { by: "Dedi Kurniawan", short: "DK", at: "21 Oct, 09:40" }, analysis: { by: "Fitri Handayani", short: "FH", at: "started 22 Oct, 08:15" }, roa: "—", deadline: "30 Oct 2026" },
      { no: "B-2026-0411", order: "JO-2026-0141", standard: "ASTM", date: "10 Oct 2026", samples: 8, params: BASIC.slice(), extra: [], status: "completed", prep: { by: "Yusuf Hidayat", short: "YH", at: "10 Oct, 11:00" }, analysis: { by: "Bagus Prasetyo", short: "BP", at: "done 20 Oct" }, roa: "RoA-0411", deadline: "21 Oct 2026" },
      { no: "B-2026-0402", order: "JO-2026-0140", standard: "ASTM", date: "2 Oct 2026", samples: 6, params: TEMPLATES[2].params.slice(), extra: [], status: "completed", prep: { by: "Dedi Kurniawan", short: "DK", at: "2 Oct, 13:00" }, analysis: { by: "Fitri Handayani", short: "FH", at: "done 16 Oct" }, roa: "RoA-0402", deadline: "17 Oct 2026" },
      { no: "B-2026-0419", order: "JO-2026-0139", standard: "ASTM", date: "23 Oct 2026", samples: 18, params: BASIC.slice(), extra: ["HGI"], status: "prep", prep: { by: "Yusuf Hidayat", short: "YH", at: "started 24 Oct, 10:20" }, analysis: null, roa: "—", deadline: "30 Oct 2026" },
      { no: "B-2026-0398", order: "JO-2026-0136", standard: "ASTM", date: "30 Sep 2026", samples: 4, params: BASIC.slice(), extra: [], status: "completed", prep: { by: "Dedi Kurniawan", short: "DK", at: "30 Sep, 15:00" }, analysis: { by: "Bagus Prasetyo", short: "BP", at: "done 13 Oct" }, roa: "RoA-0398", deadline: "14 Oct 2026" },
      { no: "B-2026-0390", order: "JO-2026-0132", standard: "ASTM", date: "23 Sep 2026", samples: 10, params: BASIC.slice(), extra: [], status: "completed", prep: { by: "Yusuf Hidayat", short: "YH", at: "23 Sep, 14:00" }, analysis: { by: "Fitri Handayani", short: "FH", at: "done 6 Oct" }, roa: "RoA-0390", deadline: "7 Oct 2026" },
      { no: "B-2026-0414", order: "JO-2026-0131", standard: "GB/T", date: "16 Oct 2026", samples: 8, params: TEMPLATES[3].params.concat(["G index", "Y value"]), extra: [], status: "analysis", prep: { by: "Dedi Kurniawan", short: "DK", at: "16 Oct, 10:00" }, analysis: { by: "Fitri Handayani", short: "FH", at: "started 19 Oct, 08:00" }, roa: "—", deadline: "31 Oct 2026" },
    ];

    return { companies, contacts, signatories, orders, batches, nextNo: 143, nextBatch: 420, version: 3 };
  }

  const STATUS = {
    draft: "Draft", awaiting: "Awaiting samples", progress: "In progress", reported: "Reported", delivered: "Delivered", closed: "Closed", cancelled: "Cancelled",
  };
  const BATCH_STATUS = { created: "Created", prep: "Preparation", analysis: "Analysis", finished: "Finished analysis", completed: "Completed" };
  const STEPS = ["Registered", "Samples received", "Analysis", "RoA approved", "CoA published", "Sent to client"];
  const CHANNELS = [
    { id: "hardcopy", label: "Hard copy", icon: "printer" },
    { id: "email", label: "Email", icon: "envelope-simple" },
    { id: "whatsapp", label: "WhatsApp", icon: "whatsapp-logo" },
    { id: "other", label: "Other", icon: "dots-three" },
  ];

  const PASTE_SAMPLE = [
    "BNM-3601\tPly 4 upper\tDH BNM-031 · 10.20–10.90 m\t",
    "BNM-3602\tPly 4 lower\tDH BNM-031 · 10.90–11.60 m\t",
    "BNM-3603\tComposite\tDH BNM-031 · 10.20–11.60 m\tComposite",
    "BNM-3604\tPly 5 upper\tDH BNM-031 · 14.10–14.80 m\t",
    "BNM-3605\tPly 5 lower\tDH BNM-031 · 14.80–15.40 m\t",
    "BNM-3606\tRoof\tDH BNM-031 · 9.60–10.20 m\t",
    "BNM-3607\tParting\tDH BNM-031 · 12.30–12.50 m\t",
    "BNM-3608\tFloor\tDH BNM-031 · 15.40–16.00 m\tWet sample",
    "BNM-3609\tPly 6 upper\tDH BNM-032 · 8.70–9.40 m\t",
    "BNM-3610\tPly 6 lower\tDH BNM-032 · 9.40–10.10 m\t",
    "BNM-3604\tPly 5 upper (repeat)\tDH BNM-031 · 14.10–14.80 m\t",
    "BNM-3611\tChannel sample\tDH BNM-032 · 11.00–11.50 m\t",
    "",
    "BNM-3612\tPly 7\tDH BNM-032 · 12.80–13.50 m\t",
  ].join("\n");

  return { TODAY, PARAM_GROUPS, DEPENDS, GBT_ONLY, SUBCONTRACTED, GROUP_PILLS, TEMPLATES, PEOPLE, STATUS, BATCH_STATUS, STEPS, CHANNELS, PASTE_SAMPLE, seed };
})();
