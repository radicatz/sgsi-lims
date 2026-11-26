// Advanced search and saved queries (Phase 5, slice B3; Search_Screen_Plan.md section 6, spec S-29, frames 08-Search-03-Advanced_search-01 to 06).
// A query is a target (samples, batches, job orders, results), Match all or any, and condition rows. SQL is built only from the field lists in `search-query.ts`: a field id picks a
// fixed expression, an operator a fixed comparison, and every value is a bound parameter (Phase5_Build_Design.md section 10.5). Reads run as the signed-in user (row-level
// security). The screen gets up to 500 rows; the CSV export gets every row. The CSO has no `result.read`: no Results target and no result conditions.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { logExport } from "./audit";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { asUser, type Tx } from "../db";
import { fail, uuid } from "../batch-lib";
import { BASES, Bad, Definition, FIELDS, FROM, LIMIT, LINK, NEEDS, OPS, OP_LABEL, TARGETS, build, type Def, type Field } from "./search-query";

const SCREEN = "Search";
const csv = (rows: string[][]) => rows.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\r\n");

async function run(tx: Tx, def: Def, perms: string[], limit: number | null) {
  const { sql: where, params, fields } = build(def, perms);
  const cols = (def.columns?.length ? def.columns.map((id) => fields.find((f) => f.id === id)).filter(Boolean) as Field[] : fields.filter((f) => f.show));
  const sort = def.sort && fields.some((f) => f.id === def.sort!.col) ? fields.find((f) => f.id === def.sort!.col)! : cols[0]!;
  const dir = def.sort?.dir === "desc" ? "desc" : "asc";
  const select = cols.map((f, i) => `${f.expr}::text as c${i}`).join(", ");
  const text = `select ${select}, ${LINK[def.target]} as link ${FROM[def.target]} ${where} order by ${sort.expr} ${dir} nulls last${limit ? ` limit ${limit}` : ""}`;
  const rows = await tx.unsafe(text, params as never[]);
  const [t] = limit ? await tx.unsafe(`select count(*)::int as n ${FROM[def.target]} ${where}`, params as never[]) : [{ n: rows.length }];
  return { cols, rows: rows.map((r) => ({ link: r.link as string, cells: Object.fromEntries(cols.map((f, i) => [f.id, (r[`c${i}`] as string | null) ?? ""])) })), total: (t?.n ?? 0) as number };
}

export async function advancedSearchRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  type U = { userId: string; claims: Record<string, unknown>; permissions: string[] };
  const as = <T>(req: { user?: unknown; id: string }, fn: (tx: Tx) => Promise<T>) => asUser(req.user as U, { requestId: req.id, screen: SCREEN }, fn);
  const bad = (reply: Parameters<typeof fail>[0], e: unknown) => { if (e instanceof Bad) return fail(reply, 422, "bad_query", e.message); throw e; };

  /** What the screen may offer this role: targets, fields with their operators and options, default columns. */
  r.get("/search/advanced/fields", { preHandler: requireAny("search.use") }, async (req) => {
    const perms = (req.user as U).permissions;
    return {
      targets: TARGETS.filter((t) => perms.includes(NEEDS[t])).map((t) => ({ id: t, label: { samples: "Samples", batches: "Batches", orders: "Job orders", results: "Results" }[t], fields: FIELDS[t].map((f) => ({ id: f.id, label: f.label, type: f.type, options: f.options ?? null, ops: OPS[f.type].map((o) => [o, OP_LABEL[o]]), show: !!f.show })) })),
      resultField: perms.includes("result.read"), bases: BASES,
    };
  });

  r.post("/search/advanced", { preHandler: requireAny("search.use"), schema: { body: Definition } }, async (req, reply) => {
    try {
      const out = await as(req, (tx) => run(tx, req.body, (req.user as U).permissions, LIMIT));
      return { columns: out.cols.map((f) => ({ id: f.id, label: f.label, type: f.type })), rows: out.rows, total: out.total, capped: out.total > LIMIT, limit: LIMIT };
    } catch (e) { return bad(reply, e); }
  });

  r.post("/search/advanced/export", { preHandler: requireAny("search.use"), schema: { body: Definition } }, async (req, reply) => {
    try {
      const out = await as(req, (tx) => run(tx, req.body, (req.user as U).permissions, null));
      const text = csv([out.cols.map((f) => f.label), ...out.rows.map((x) => out.cols.map((f) => x.cells[f.id] ?? ""))]);
      await logExport(req as never, `Search: ${req.body.target}`, `${req.body.conditions.length} condition${req.body.conditions.length === 1 ? "" : "s"}, match ${req.body.match}`, out.rows.length);   // decision C-4
      return reply.header("content-type", "text/csv; charset=utf-8").header("content-disposition", `attachment; filename="search-${req.body.target}.csv"`).send(`﻿${text}`);
    } catch (e) { return bad(reply, e); }
  });

  /* ---------- saved queries (mine, and shared with me) ---------- */
  const Save = z.object({ name: z.string().trim().min(1).max(80), shared: z.boolean().default(false), definition: Definition });
  r.get("/saved-queries", { preHandler: requireAny("search.use") }, async (req) => {
    const uid = (req.user as U).userId;
    const rows = await as(req, (tx) => tx`select q.id, q.name, q.target, q.definition, q.shared, q.owner_id, p.full_name as owner from saved_queries q join profiles p on p.id = q.owner_id order by lower(q.name)`);
    const mine = rows.filter((x) => x.owner_id === uid), shared = rows.filter((x) => x.owner_id !== uid && x.shared);
    const shape = (x: (typeof rows)[number]) => ({ id: x.id as string, name: x.name as string, target: x.target as string, definition: x.definition, shared: x.shared as boolean, owner: x.owner as string });
    return { mine: mine.map(shape), shared: shared.map(shape) };
  });
  r.post("/saved-queries", { preHandler: requireAny("search.use"), schema: { body: Save } }, async (req, reply) => {
    const u = req.user as U;
    try { build(req.body.definition, u.permissions); } catch (e) { return bad(reply, e); }
    const [row] = await as(req, (tx) => tx`insert into saved_queries (owner_id, name, target, definition, shared) values (${u.userId}, ${req.body.name}, ${req.body.definition.target === "results" ? "result" : req.body.definition.target === "orders" ? "job_order" : req.body.definition.target === "batches" ? "batch" : "sample"}, ${tx.json(req.body.definition as never)}, ${req.body.shared}) returning id`);
    return { id: row!.id as string };
  });
  r.patch("/saved-queries/:id", { preHandler: requireAny("search.use"), schema: { params: z.object({ id: uuid }), body: z.object({ name: z.string().trim().min(1).max(80).optional(), shared: z.boolean().optional() }) } }, async (req, reply) => {
    const rows = await as(req, (tx) => tx`update saved_queries set name = coalesce(${req.body.name ?? null}, name), shared = coalesce(${req.body.shared ?? null}, shared) where id = ${req.params.id} and owner_id = ${(req.user as U).userId} returning id`);
    if (!rows.length) return fail(reply, 404, "not_found", "This query was not found, or it is not yours.");
    return { ok: true };
  });
  r.delete("/saved-queries/:id", { preHandler: requireAny("search.use"), schema: { params: z.object({ id: uuid }) } }, async (req, reply) => {
    const rows = await as(req, (tx) => tx`delete from saved_queries where id = ${req.params.id} and owner_id = ${(req.user as U).userId} returning id`);
    if (!rows.length) return fail(reply, 404, "not_found", "This query was not found, or it is not yours.");
    return { ok: true };
  });
}
