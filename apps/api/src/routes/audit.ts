// Audit log (Phase 5, slice C2; frames 15-Audit_log-01 to 04, Admin_Screen_Plan.md section 5, Phase5_Build_Design.md 12.3 and 12.5): `audit_log` read as a person reads it. The rows are read
// through row-level security (`audit.read`); the text (record type, action, field labels, names instead of ids) is made here. Nothing can be changed. Exports (this CSV, the advanced
// search CSV, the Sample history PDF) are written to the log by `logExport` (decision C-4).
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { asUser, system, type Tx } from "../db";
import { env } from "../env";
import { ACTIONS, ACTION_LABEL, OWN_KIND, PARENT, RECORD_TYPES, REF_COLUMN, TYPE_OF_TABLE, changeSummary, changesOf, type Change, type Json } from "../audit-text";
import { fail } from "../batch-lib";

const SCREEN = "Audit log";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const Filters = z.object({
  from: z.string().regex(DATE).optional(), to: z.string().regex(DATE).optional(), user: z.string().uuid().optional(), type: z.enum(RECORD_TYPES).optional(),
  action: z.string().max(20).optional(), q: z.string().trim().max(80).optional(), record: z.string().uuid().optional(), page: z.coerce.number().int().min(1).max(100000).default(1),
});
type F = z.infer<typeof Filters>;
const PER = 10;

/* the record type and the action are decided once, in SQL, so the filters and the page agree */
const tabs = (t: string) => Object.entries(TYPE_OF_TABLE).filter(([, v]) => v === t).map(([k]) => `'${k}'`).join(",");
const TYPE_SQL = `case when l.table_name = 'export' then 'Export' when l.table_name = 'profiles' and l.screen = 'Sign in' then 'Sign-in' ${
  [...new Set(Object.values(TYPE_OF_TABLE))].map((t) => `when l.table_name in (${tabs(t)}) then '${t}'`).join(" ")} else 'Other' end`;
const ACTION_SQL = `case when l.table_name = 'export' then 'exported' when l.action = 'insert' then 'created' when l.action = 'delete' then 'deleted'
  when l.table_name = 'profiles' and l.screen = 'Sign in' then case
    when l.after->>'status' = 'locked' and coalesce(l.before->>'status', '') <> 'locked' then 'locked'
    when l.after->>'last_sign_in_at' is distinct from l.before->>'last_sign_in_at' then 'signed_in' else 'signin_failed' end
  when l.table_name = 'reports' and l.after->>'status' = 'issued' and l.before->>'status' is distinct from 'issued' then 'published'
  when l.before->>'status' is distinct from l.after->>'status' then 'status'
  when l.table_name in (${tabs("Configuration")}) then 'setting' else 'updated' end`;

const like = (s: string) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
function select(tx: Tx, f: F, limit: number, offset: number) {
  const to = f.to ?? new Date().toISOString().slice(0, 10), from = f.from ?? new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10), tz = env.LAB_TIMEZONE;
  return tx`
    select * from (
      select l.id, l.at, l.table_name, l.record_id, l.record_label, l.action, l.before, l.after, l.actor, l.actor_name, l.screen, ${tx.unsafe(TYPE_SQL)} as rtype, ${tx.unsafe(ACTION_SQL)} as act
      from audit_log l
      where l.at >= (${from}::date)::timestamp at time zone ${tz} and l.at < (${to}::date + 1)::timestamp at time zone ${tz}
        ${f.q ? tx`and (l.record_label ilike ${like(f.q)} or l.record_id = ${f.q})` : tx``}
        ${f.record ? tx`and (l.record_id = ${f.record} or l.after->>'sample_id' = ${f.record} or l.before->>'sample_id' = ${f.record}
          or (l.table_name = 'analysis_values' and coalesce(l.after->>'analysis_id', l.before->>'analysis_id') in (select a.id::text from analyses a where a.sample_id = ${f.record}::uuid)))` : tx``}
    ) x
    where true
      ${f.user ? tx`and (x.actor = ${f.user}::uuid or (x.rtype = 'Sign-in' and x.record_id = ${f.user}))` : tx``}
      ${f.type ? tx`and x.rtype = ${f.type}` : tx``}
      ${f.action ? tx`and x.act = ${f.action}` : tx``}
    order by x.at desc, x.id desc
    ${limit ? tx`limit ${limit} offset ${offset}` : tx``}`;
}
const total = async (tx: Tx, f: F) => {
  const [n] = await tx`select count(*)::int as n from (${select(tx, f, 0, 0)}) c`;
  return (n?.n as number) ?? 0;
};

/** Names for the ids the rows mention, read with the API's own connection (a name is no secret to someone who may read the log). */
async function namesFor(rows: Array<Record<string, unknown>>): Promise<Map<string, string>> {
  const ids: Record<string, Set<string>> = {};
  const add = (kind: string, id: unknown) => { if (typeof id === "string" && id) (ids[kind] ??= new Set()).add(id); };
  for (const r of rows) {
    const b = (r.before ?? {}) as Record<string, unknown>, a = (r.after ?? {}) as Record<string, unknown>, own = OWN_KIND[r.table_name as string], par = PARENT[r.table_name as string];
    if (own) add(own, r.record_id);
    if (par) add(par[1], a[par[0]] ?? b[par[0]]);
    for (const [col, kind] of Object.entries(REF_COLUMN)) { add(kind, a[col]); add(kind, b[col]); }
    add("user", r.actor);
  }
  const out = new Map<string, string>();
  const get = async (kind: string, q: (ids: string[]) => Promise<Array<{ id: string; name: string | null }>>) => {
    const want = [...(ids[kind] ?? [])]; if (!want.length) return;
    for (const x of await q(want)) out.set(`${kind}:${x.id}`, x.name ?? "");
  };
  return system({ requestId: "audit-names", screen: SCREEN }, async (tx) => {
    // a result value points to its analysis, which points to the sample and the parameter
    const an = [...(ids.analysis ?? [])];
    if (an.length) for (const x of await tx`select a.id::text as id, a.sample_id::text as sample_id, p.code from analyses a join parameters p on p.id = a.parameter_id where a.id = any(${an}::uuid[])`) {
      out.set(`analysis:${x.id}`, x.code as string); out.set(`analysis-sample:${x.id}`, x.sample_id as string); add("sample", x.sample_id);
    }
    const q = (t: string, expr: string) => async (w: string[]) => (await tx.unsafe(`select id::text as id, ${expr} as name from ${t} where id = any($1::uuid[])`, [w] as never)) as unknown as Array<{ id: string; name: string | null }>;
    await Promise.all([
      get("sample", q("samples", "coalesce(sample_no, client_ref)")), get("order", q("job_orders", "order_no")), get("batch", q("batches", "batch_no")), get("report", q("reports", "report_no")),
      get("user", q("profiles", "full_name")), get("company", q("companies", "name")), get("drill", q("drill_holes", "code")), get("seam", q("seams", "code")),
      get("lithology", q("lithologies", "name")), get("parameter", q("parameters", "code")), get("service", q("services", "name")), get("contact", q("company_contacts", "full_name")),
    ]);
    return out;
  });
}

interface Row {
  id: string; at: string; user: { id: string | null; name: string | null }; action: string; actionCode: string; type: string; record: string; recordSub: string | null;
  link: { to: string; need: string } | null; summary: string; changes: Change[];
}
function shape(rows: Array<Record<string, unknown>>, names: Map<string, string>): Row[] {
  return rows.map((r) => {
    const table = r.table_name as string, before = (r.before ?? null) as Json, after = (r.after ?? null) as Json, row = { ...(r as object), before, after } as never as { table_name: string; action: string; before: Json; after: Json };
    const body = (after ?? before ?? {}) as Record<string, unknown>, par = PARENT[table], own = OWN_KIND[table], type = r.rtype as string, act = r.act as string;
    // the record: its own label, or the parent's (a result is shown under its sample, a parameter under its batch)
    let kind = own ?? par?.[1] ?? "", id = own ? (r.record_id as string) : par ? (body[par[0]] as string) : (r.record_id as string);
    let valueName: string | null = null;
    if (table === "analysis_values") {
      const code = names.get(`analysis:${id}`), sid = names.get(`analysis-sample:${id}`);
      valueName = `${code ?? "Value"} (${String(body.basis ?? "").toUpperCase()})`;
      kind = "sample"; id = sid ?? id;
    }
    const label = (own ? (r.record_label as string | null) : null) || names.get(`${kind}:${id}`) || (r.record_label as string | null) || (par ? `Removed ${type.toLowerCase()}` : "");
    const name = type === "Sign-in" ? (names.get(`user:${r.record_id}`) ?? (r.record_label as string | null)) : ((r.actor_name as string | null) ?? names.get(`user:${r.actor}`) ?? null);
    const link: Row["link"] = ({
      order: label && { to: `/orders/${label}`, need: "order.read" }, batch: label && { to: `/batches/${label}`, need: "batch.read" }, sample: id && { to: `/samples/${id}/history`, need: "search.use" },
      report: id && { to: `/reports/coa/${id}`, need: "report.sign" }, user: id && { to: `/users/${id}`, need: "user.manage" }, company: id && { to: `/clients/${id}`, need: "company.read" },
    } as Record<string, Row["link"] | "" | undefined | null>)[kind] || null;
    const live = link && names.has(`${kind}:${id}`);   // a record that has since been removed has no page to open
    const changes = act === "exported" ? [] : changesOf(row, names, valueName, par?.[0]);
    // an export row says what was exported and the filters
    const exp = act === "exported" ? ((after ?? {}) as Record<string, unknown>) : null;
    return {
      id: String(r.id), at: new Date(r.at as string).toISOString(), user: { id: (r.actor as string | null) ?? (type === "Sign-in" ? (r.record_id as string) : null), name },
      action: ACTION_LABEL[act] ?? act, actionCode: act, type, record: type === "Export" ? ((r.record_label as string | null) ?? "Audit log") : label || (r.record_id as string),
      recordSub: exp ? String(exp.filters ?? "") || null : null, link: act === "exported" || !live ? null : link,
      summary: type === "Sign-in" ? "" : act === "created" || act === "deleted" ? (changes.length ? `${changes.length} ${changes.length === 1 ? "field" : "fields"}` : "") : changeSummary(changes),
      changes: act === "exported" || type === "Sign-in" ? [] : changes,
    };
  });
}

/** Write an export to the log (decision C-4): who, what, and the filters. */
export async function logExport(req: { user?: { userId: string } | undefined; id: string }, what: string, filters: string, rows: number) {
  await system({ requestId: req.id, screen: SCREEN }, async (tx) => {
    const [p] = await tx`select full_name from profiles where id = ${req.user!.userId}`;
    await tx`insert into audit_log (table_name, record_id, record_label, action, after, actor, actor_name, screen, request_id)
      values ('export', ${what}, ${what}, 'insert', ${tx.json({ filters, rows } as never)}, ${req.user!.userId}, ${(p?.full_name as string | undefined) ?? null}, ${SCREEN}, ${req.id})`;
  });
}
const filterText = (f: F) => [f.from && f.to ? `${f.from} to ${f.to}` : f.from ? `from ${f.from}` : null, f.type, f.action && ACTION_LABEL[f.action], f.q && `"${f.q}"`, f.user && "one user", f.record && "one record"].filter(Boolean).join(", ");

export async function auditRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const need = requireAny("audit.read");
  const user = (req: { user?: unknown }) => req.user as { userId: string; claims: Record<string, unknown>; permissions: string[] };

  r.get("/audit/options", { preHandler: need }, async (req) => {
    const users = await system({ requestId: req.id, screen: SCREEN }, (tx) => tx`select id, full_name as name from profiles order by full_name`);
    return { users: users.map((u) => ({ id: u.id as string, name: u.name as string })), types: RECORD_TYPES, actions: ACTIONS };
  });

  r.get("/audit", { preHandler: need, schema: { querystring: Filters } }, async (req) => {
    const f = req.query;
    // the page and the count are independent, and so is the record's name: they run together (the hosted database is a round trip away, so waiting for each in turn cost seconds)
    // the chip of a record link names the record (a sample: its Sample ID, else its client reference)
    const label = f.record ? system({ requestId: req.id, screen: SCREEN }, (tx) => tx`select coalesce(sample_no, client_ref) as l from samples where id = ${f.record!}::uuid`) : Promise.resolve([]);
    const out = await asUser(user(req), { requestId: req.id, screen: SCREEN }, async (tx) => { const [rows, n] = await Promise.all([select(tx, f, PER, (f.page - 1) * PER), total(tx, f)]); return { rows, total: n }; });
    const [names, lab] = await Promise.all([namesFor(out.rows as never), label]);
    const recordLabel = (lab[0]?.l as string | undefined) ?? null;
    return { total: out.total, page: f.page, pages: Math.max(1, Math.ceil(out.total / PER)), per: PER, recordLabel, items: shape(out.rows as never, names) };
  });

  r.get("/audit/export", { preHandler: need, schema: { querystring: Filters } }, async (req, reply) => {
    const f = req.query;
    const rows = await asUser(user(req), { requestId: req.id, screen: SCREEN }, (tx) => select(tx, f, 50_000, 0));
    const items = shape(rows as never, await namesFor(rows as never));
    const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: env.LAB_TIMEZONE });
    const cell = (c: string) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
    const lines = [["When", "User", "Action", "Record type", "Record", "Changes"], ...items.map((x) => [when(x.at), x.user.name ?? "", x.action, x.type, x.record, x.changes.map((c) => `${c.field}: ${c.before ?? "-"} to ${c.after ?? "-"}`).join("; ")])];
    await logExport(req as never, "Audit log", filterText(f), items.length);
    return reply.header("content-type", "text/csv; charset=utf-8").header("content-disposition", 'attachment; filename="audit-log.csv"').send(`﻿${lines.map((l) => l.map(cell).join(",")).join("\r\n")}`);
  });
  void fail;
}
