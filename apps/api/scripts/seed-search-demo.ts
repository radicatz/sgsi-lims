// Demo saved queries for Search (Phase 5, slice B; Phase5_Build_Design.md section 10.8): "High-ash samples" and "Held this month" (Maya Lestari), "Late batches" (Hendra Wijaya, shared).
// Needs `pnpm seed:demo`. Safe to run again. Not audited (demo load).
//   pnpm seed:search            load
//   pnpm seed:search --remove   take them out again
import { sql } from "../src/db";

const NAMES = ["High-ash samples", "Held this month", "Late batches"];
const remove = process.argv.includes("--remove");
await sql.begin(async (tx) => {
  await tx`select set_config('app.skip_audit', 'on', true)`;
  await tx`delete from saved_queries where name = any(${NAMES}::text[])`;
  if (remove) { console.log("saved queries removed"); return; }
  const [maya] = await tx`select id from profiles where email = 'maya@sgsi.co.id'`, [hendra] = await tx`select id from profiles where email = 'hendra@sgsi.co.id'`;
  if (!maya || !hendra) throw new Error("Run pnpm seed:demo first (the demo users are missing).");
  const first = new Date(); first.setUTCDate(1);
  const ym = first.toISOString().slice(0, 10), next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const rows: Array<[string, string, string, boolean, unknown]> = [
    [maya.id, "High-ash samples", "sample", false, { target: "samples", match: "all", conditions: [{ field: "result", op: "gt", param: "ASH", basis: "adb", value: "10" }] }],
    [maya.id, "Held this month", "sample", false, { target: "samples", match: "all", conditions: [{ field: "status", op: "is", value: "held" }, { field: "received", op: "between", value: [ym, next] }] }],
    [hendra.id, "Late batches", "batch", true, { target: "batches", match: "all", conditions: [{ field: "status", op: "any", value: ["created", "preparation", "prep_finished", "analysis", "analysis_finished"] }, { field: "deadline", op: "before", value: new Date().toISOString().slice(0, 10) }] }],
  ];
  for (const [owner, name, target, shared, def] of rows) await tx`insert into saved_queries (owner_id, name, target, definition, shared) values (${owner as string}, ${name}, ${target}, ${tx.json(def as never)}, ${shared})`;
  console.log("saved queries: High-ash samples, Held this month (Maya), Late batches (Hendra, shared)");
});
await sql.end();
