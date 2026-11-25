// The pure part of Advanced search (Phase 5, slice B3): the field lists, the operators and `build`, which turns a definition into a where clause with bound parameters.
// Nothing here touches the database, so it is unit-tested alone (search-query.test.ts).
import { z } from "zod";

export const LIMIT = 500;
const TZ = "Asia/Makassar";
export type FieldType = "text" | "number" | "date" | "choice";
export interface Field { id: string; label: string; type: FieldType; expr: string; options?: Array<[string, string]>; show?: boolean }
export type Target = "samples" | "batches" | "orders" | "results";
export const TARGETS: Target[] = ["samples", "batches", "orders", "results"];
const d = (col: string) => `(${col} at time zone '${TZ}')::date`;
const STATE: Array<[string, string]> = [["expected", "Expected"], ["in_batch", "In batch"], ["received", "Received"], ["awaiting_arrival", "Awaiting arrival"], ["not_received", "Not received"], ["held", "Held"]];
const BATCH_ST: Array<[string, string]> = [["created", "Created"], ["preparation", "Preparation"], ["prep_finished", "Prep finished"], ["analysis", "Analysis"], ["analysis_finished", "Analysis finished"], ["completed", "Completed"]];
const ORDER_ST: Array<[string, string]> = [["draft", "Draft"], ["awaiting_samples", "Awaiting samples"], ["in_progress", "In progress"], ["reported", "Reported"], ["delivered", "Delivered"], ["closed", "Closed"], ["cancelled", "Cancelled"]];
export const BASES: Array<[string, string]> = [["ar", "AR"], ["adb", "ADB"], ["db", "DB"], ["daf", "DAF"]];

/** Every field of the sample, shared by the Samples and Results targets (alias s = v_samples, j = job order, c = company, b = batch). */
const SAMPLE_FIELDS: Field[] = [
  { id: "sample_no", label: "Sample ID", type: "text", expr: "s.sample_no", show: true },
  { id: "sample_code", label: "Sample code", type: "text", expr: "s.sample_code", show: true },
  { id: "client_ref", label: "Client reference", type: "text", expr: "s.client_ref", show: true },
  { id: "order", label: "Job order", type: "text", expr: "j.order_no", show: true },
  { id: "batch", label: "Batch", type: "text", expr: "b.batch_no", show: true },
  { id: "client", label: "Client", type: "text", expr: "c.name" },
  { id: "drill_hole", label: "Drill hole", type: "text", expr: "s.drill_hole_text", show: true },
  { id: "depth_from", label: "Depth from", type: "number", expr: "s.depth_from" },
  { id: "depth_to", label: "Depth to", type: "number", expr: "s.depth_to" },
  { id: "sample_type", label: "Sample type", type: "text", expr: "s.sample_type" },
  { id: "status", label: "Status", type: "choice", expr: "s.state", options: STATE, show: true },
  { id: "received", label: "Received date", type: "date", expr: d("s.received_at") },
  { id: "received_by", label: "Received by", type: "text", expr: "(select full_name from profiles pr where pr.id = s.received_by)" },
  { id: "condition", label: "Condition", type: "text", expr: "s.condition" },
  { id: "hold_reason", label: "Held reason", type: "text", expr: "s.hold_reason" },
];
export const FIELDS: Record<Target, Field[]> = {
  samples: SAMPLE_FIELDS,
  batches: [
    { id: "number", label: "Batch", type: "text", expr: "b.batch_no", show: true },
    { id: "order", label: "Job order", type: "text", expr: "j.order_no", show: true },
    { id: "client", label: "Client", type: "text", expr: "c.name", show: true },
    { id: "status", label: "Status", type: "choice", expr: "b.status", options: BATCH_ST, show: true },
    { id: "standard", label: "Standard", type: "choice", expr: "b.standard", options: [["ASTM", "ASTM"], ["ISO", "ISO"], ["GBT", "GB/T"]] },
    { id: "created", label: "Created", type: "date", expr: d("b.created_at") },
    { id: "deadline", label: "Deadline", type: "date", expr: "b.deadline_on", show: true },
    { id: "roa", label: "RoA number", type: "text", expr: "(select roa_no from batch_documents bd where bd.batch_id = b.id)" },
  ],
  orders: [
    { id: "number", label: "Job order", type: "text", expr: "j.order_no", show: true },
    { id: "client", label: "Client", type: "text", expr: "c.name", show: true },
    { id: "po", label: "PO or client letter", type: "text", expr: "j.client_reference", show: true },
    { id: "status", label: "Status", type: "choice", expr: "j.status", options: ORDER_ST, show: true },
    { id: "sample_type", label: "Sample type", type: "text", expr: "j.sample_type" },
    { id: "created", label: "Created", type: "date", expr: d("j.created_at") },
    { id: "due", label: "Due", type: "date", expr: "j.due_on", show: true },
  ],
  results: [
    ...SAMPLE_FIELDS.filter((f) => ["sample_no", "client_ref", "order", "batch", "client", "drill_hole"].includes(f.id)).map((f) => ({ ...f, show: ["sample_no", "order", "batch"].includes(f.id) })),
    { id: "parameter", label: "Parameter", type: "text", expr: "p.code", show: true },
    { id: "value", label: "Value", type: "number", expr: "v.value_num", show: true },
    { id: "basis", label: "Basis", type: "choice", expr: "v.basis", options: BASES, show: true },
    { id: "unit", label: "Unit", type: "text", expr: "p.unit", show: true },
    { id: "entered_by", label: "Entered by", type: "text", expr: "(select full_name from profiles pr where pr.id = a.entered_by)", show: true },
    { id: "entered", label: "Entered date", type: "date", expr: d("a.entered_at"), show: true },
  ],
};
export const FROM: Record<Target, string> = {
  samples: "from v_samples s join job_orders j on j.id = s.job_order_id join companies c on c.id = j.company_id left join batches b on b.id = s.batch_id",
  batches: "from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id",
  orders: "from job_orders j join companies c on c.id = j.company_id",
  results: "from analyses a join v_samples s on s.id = a.sample_id join parameters p on p.id = a.parameter_id left join analysis_values v on v.analysis_id = a.id and v.is_primary join job_orders j on j.id = s.job_order_id join companies c on c.id = j.company_id left join batches b on b.id = s.batch_id",
};
const BASE_WHERE: Record<Target, string> = { samples: "", batches: "", orders: "", results: "a.round = 1" };
export const LINK: Record<Target, string> = { samples: "'/samples/' || s.id || '/history'", batches: "'/batches/' || b.batch_no", orders: "'/orders/' || j.order_no", results: "'/samples/' || s.id || '/history'" };
export const NEEDS: Record<Target, string> = { samples: "order.read", batches: "batch.read", orders: "order.read", results: "result.read" };
export const OPS: Record<FieldType, string[]> = { text: ["is", "is_not", "contains", "starts", "empty"], number: ["eq", "gt", "lt", "between", "empty"], date: ["on", "before", "after", "between", "empty"], choice: ["is", "any"] };
export const OP_LABEL: Record<string, string> = { is: "is", is_not: "is not", contains: "contains", starts: "starts with", empty: "is empty", eq: "equals", gt: "greater than", lt: "less than", between: "between", on: "on", before: "before", after: "after", any: "is any of" };
const NUM_OPS = ["eq", "gt", "lt", "between"];

const Cond = z.object({ field: z.string().max(40), op: z.string().max(12), value: z.union([z.string().max(120), z.array(z.string().max(60)).max(12)]).optional(), param: z.string().max(20).optional(), basis: z.string().max(6).optional() });
export const Definition = z.object({
  target: z.enum(["samples", "batches", "orders", "results"]), match: z.enum(["all", "any"]).default("all"), conditions: z.array(Cond).max(20),
  columns: z.array(z.string().max(40)).max(30).optional(), sort: z.object({ col: z.string().max(40), dir: z.enum(["asc", "desc"]) }).optional(),
});
export type Def = z.infer<typeof Definition>;
const esc = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`);
const ISO = /^\d{4}-\d{2}-\d{2}$/, NUM = /^-?\d+([.,]\d+)?$/;
export class Bad extends Error {}

/** Where clause and parameters for a definition; throws Bad with a sentence for the user when a condition is not valid. */
export function build(def: Def, perms: string[]): { sql: string; params: unknown[]; fields: Field[] } {
  if (!perms.includes(NEEDS[def.target])) throw new Bad("This search is not part of your access.");
  const fields = FIELDS[def.target], params: unknown[] = [], parts: string[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  const num = (v: string) => { if (!NUM.test(v.trim())) throw new Bad(`"${v}" is not a number.`); return p(v.trim().replace(",", ".")); };
  const date = (v: string) => { if (!ISO.test(v)) throw new Bad(`"${v}" is not a date.`); return p(v); };
  const one = (v: unknown) => { if (typeof v !== "string" || !v.trim()) throw new Bad("A condition has no value."); return v.trim(); };
  const two = (v: unknown): [string, string] => { if (!Array.isArray(v) || v.length !== 2 || !v[0] || !v[1]) throw new Bad("A between condition needs two values."); return [v[0], v[1]]; };
  def.conditions.forEach((c, i) => {
    const row = `Condition ${i + 1}: `;
    try {
      if (c.field === "result") {
        if (def.target !== "samples" || !perms.includes("result.read")) throw new Bad("Result conditions are not part of your access.");
        if (!NUM_OPS.includes(c.op) || !c.param) throw new Bad("Choose a parameter and a comparison.");
        const e = `(rv.value_num)`;
        const cmp = c.op === "between" ? (() => { const [a, b] = two(c.value); return `${e} between ${num(a)}::numeric and ${num(b)}::numeric`; })() : `${e} ${c.op === "gt" ? ">" : c.op === "lt" ? "<" : "="} ${num(one(c.value))}::numeric`;
        const bs = c.basis && BASES.some((b) => b[0] === c.basis) ? ` and rv.basis = ${p(c.basis)}` : "";
        parts.push(`exists (select 1 from analyses ra join parameters rp on rp.id = ra.parameter_id join analysis_values rv on rv.analysis_id = ra.id where ra.sample_id = s.id and ra.round = 1 and rp.code = ${p(c.param.toUpperCase())}${bs} and ${cmp})`);
        return;
      }
      const f = fields.find((x) => x.id === c.field);
      if (!f) throw new Bad("Choose a field.");
      if (!OPS[f.type].includes(c.op)) throw new Bad(`"${OP_LABEL[c.op] ?? c.op}" does not apply to ${f.label}.`);
      const x = f.expr;
      if (c.op === "empty") parts.push(`(${x} is null or ${x}::text = '')`);
      else if (f.type === "text") {
        const v = one(c.value).toLowerCase();
        parts.push(c.op === "is" ? `lower(${x}) = ${p(v)}` : c.op === "is_not" ? `(${x} is null or lower(${x}) <> ${p(v)})` : c.op === "contains" ? `lower(${x}) like ${p(`%${esc(v)}%`)}` : `lower(${x}) like ${p(`${esc(v)}%`)}`);
      } else if (f.type === "number") {
        parts.push(c.op === "between" ? (() => { const [a, b] = two(c.value); return `${x}::numeric between ${num(a)}::numeric and ${num(b)}::numeric`; })() : `${x}::numeric ${c.op === "gt" ? ">" : c.op === "lt" ? "<" : "="} ${num(one(c.value))}::numeric`);
      } else if (f.type === "date") {
        parts.push(c.op === "between" ? (() => { const [a, b] = two(c.value); return `${x} between ${date(a)}::date and ${date(b)}::date`; })() : `${x} ${c.op === "before" ? "<" : c.op === "after" ? ">" : "="} ${date(one(c.value))}::date`);
      } else {
        const ok = (v: string) => { if (!f.options?.some((o) => o[0] === v)) throw new Bad(`"${v}" is not an option for ${f.label}.`); return v; };
        parts.push(c.op === "is" ? `${x}::text = ${p(ok(one(c.value)))}` : `${x}::text = any(${p((Array.isArray(c.value) ? c.value : [one(c.value)]).map(ok))}::text[])`);
      }
    } catch (e) { if (e instanceof Bad) throw new Bad(row + e.message); throw e; }
  });
  const base = BASE_WHERE[def.target];
  const user = parts.length ? `(${parts.join(def.match === "any" ? " or " : " and ")})` : "";
  const where = [base, user].filter(Boolean).join(" and ");
  return { sql: where ? `where ${where}` : "", params, fields };
}

