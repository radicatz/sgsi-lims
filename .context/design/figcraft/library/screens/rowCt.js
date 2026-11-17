// Add-only run: the three tablet Samples frames rebuilt with the compact sample table (no sideways scroll). Plan: Job_Order_Screen_Plan.md Revision 14.
// build-screens.js Ct
const { S } = require("./rowC.js");
const NAMES = { samples: "Tablet-03-Job_orders-03-Job_order_detail-06-Samples", mixed: "Tablet-03-Job_orders-03-Job_order_detail-07-Samples_mixed_states", mark: "Tablet-03-Job_orders-03-Job_order_detail-08-Samples_mark_as_not_received" };
exports.build = (b) => {
  const N = b.reg.N, at = {};
  const old = [];
  for (const pid of Object.values(b.pageIds)) for (const id of N[pid].children || []) { const n = N[id]; for (const [k, nm] of Object.entries(NAMES)) if (n.name === nm) { at[k] = { x: n.transform[4], y: n.transform[5] }; old.push(id); } }
  if (Object.keys(at).length !== 3) throw new Error("tablet Samples frames not all found: " + Object.keys(at));
  b.patchSamplesTablet();
  b.raw("edit.delete", { ids: old });
  const ren = (s, n) => b.raw("node.set", { ids: [s.root], props: { name: n } });
  ren(S.samples(b, at.samples.x, at.samples.y, "tablet"), NAMES.samples);
  ren(S.mixed(b, at.mixed.x, at.mixed.y, "tablet").s, NAMES.mixed);
  ren(S.markDesktop(b, at.mark.x, at.mark.y, "tablet"), NAMES.mark);
};
