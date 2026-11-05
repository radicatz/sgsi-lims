// "Components" overview sheet: built only from instances of the new sets, so it also tests them.
const { section } = require("./found.js");

function sheet(b, host) {
  const row = (pan, name) => b.frame(pan, { name, w: 1400, h: 60, layout: "h", gap: 16, wrap: true, cross: "center", sizeH: "fill", sizeV: "hug" });
  const p1 = section(b, host, "Buttons", "Primary, Secondary, Tertiary, Ghost; Danger and Accent tones; every state of the Primary button.");
  let r = row(p1, "Types");
  ["Primary", "Secondary", "Tertiary", "Ghost"].forEach((t) => b.instT(r, "Button", `Type=${t}, Tone=Default, Size=lg, State=Default`, { Label: t }));
  b.instT(r, "Button", "Type=Primary, Tone=Danger, Size=lg, State=Default", { Label: "Delete" });
  b.instT(r, "Button", "Type=Primary, Tone=Accent, Size=lg, State=Default", { Label: "Open batch" });
  r = row(p1, "States");
  ["Default", "Hover", "Pressed", "Focused", "Disabled", "Loading"].forEach((s) => b.instT(r, "Button", `Type=Primary, Tone=Default, Size=lg, State=${s}`, { Label: s }));
  r = row(p1, "Icon buttons");
  ["Primary", "Secondary", "Tertiary", "Ghost"].forEach((t) => b.inst(r, "Icon button", `Type=${t}, Size=36, State=Default`));
  const p2 = section(b, host, "Badges and status", "Status badge, Tag, Delta, Count pill, Role badge, File chip.");
  r = row(p2, "Badges");
  ["Created", "Preparation", "Analysis", "Finished analysis", "Completed", "Cancelled"].forEach((s) => b.instT(r, "Status badge", `Status=${s}, Size=md`));
  r = row(p2, "Tags");
  ["Recheck", "CoA uploaded", "Due today", "Overdue", "Locked", "Saved"].forEach((s) => b.inst(r, "Tag", `Type=${s}`));
  b.inst(r, "Delta", "Direction=Up"); b.inst(r, "Count pill", "Tone=Primary"); b.inst(r, "Role badge"); ["PDF", "XLS", "CSV"].forEach((t) => b.inst(r, "File chip", `Type=${t}, State=Available`));
  const p3 = section(b, host, "Form controls", "Fields, search, toggles, chips and pills.");
  r = row(p3, "Fields");
  b.inst(r, "Text field", "State=Default, Size=md"); b.inst(r, "Select", "State=Filled, Size=md"); b.inst(r, "Date field", "State=Default, Size=md"); b.inst(r, "Text field", "State=Error, Size=md");
  r = row(p3, "Controls");
  b.inst(r, "Search", "Size=md, State=Default"); b.inst(r, "Checkbox", "Checked=On, State=Default"); b.inst(r, "Checkbox", "Checked=Off, State=Default"); b.inst(r, "Radio", "Selected=On, State=Default"); b.inst(r, "Switch", "On=On, State=Default");
  r = row(p3, "Chips");
  b.inst(r, "Filter chip", "Selected=On, State=Default"); b.inst(r, "Filter chip", "Selected=Off, State=Default");
  ["Off", "On", "Locked", "Auto-added"].forEach((s) => b.inst(r, "Parameter pill", `Kind=Parameter, State=${s}`));
  b.inst(r, "Segmented item", "Selected=On, State=Default"); b.inst(r, "Segmented item", "Selected=Off, State=Default");
  const p4 = section(b, host, "Navigation", "Top bar, tabs and stepper.");
  r = row(p4, "Top bar");
  b.inst(r, "Top bar", "Breakpoint=Tablet");
  r = row(p4, "Tabs");
  b.inst(r, "Tab", "Selected=On, State=Default"); b.inst(r, "Tab", "Selected=Off, State=Default"); b.inst(r, "Tab", "Selected=Off, State=Default");
  r = row(p4, "Stepper");
  b.inst(r, "Stepper", "Steps=5");
  const p5 = section(b, host, "RoA entry grid", "Cell states for the Input RoA grid.");
  r = row(p5, "Cells");
  ["Input", "Focused", "Calculated", "Out of range", "Warning", "Locked", "Dirty", "Header"].forEach((s) => b.inst(r, "Grid cell", `State=${s}`));
  const p6 = section(b, host, "Cards and table", "KPI, Panel, Callout and a table.");
  r = row(p6, "Cards");
  b.inst(r, "Card KPI", "Kind=Delta"); b.inst(r, "Card panel", "Footer=On"); b.inst(r, "Card callout", "Tone=Alert");
  r = row(p6, "Table");
  b.inst(r, "Table header row", "Template=Batch");
  b.inst(r, "Table row", "Template=Batch, State=Default");
  b.inst(r, "Table row", "Template=Batch, State=Hover");
}
module.exports = { sheet };
