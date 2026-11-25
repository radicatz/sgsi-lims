// Search (Phase 5, slice B1 and B2; Search_Screen_Plan.md sections 3 to 5, spec S-29): quick search for the top bar and the results page. One small query per type, run as the
// signed-in user (row-level security), each a case-insensitive "contains" on the ID columns that the trigram indexes cover. What a role is offered follows its permissions
// (Phase5_Build_Design.md section 10.4): a type the role cannot open is not returned and not counted. An exact Sample ID ranks first, then any other exact ID, then starts-with.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { asUser, type Tx } from "../db";
import { shownStatus } from "../batch-lib";

const SCREEN = "Search";
export const TYPES = ["samples", "batches", "orders", "drill_holes", "reports", "clients"] as const;
export type SearchType = (typeof TYPES)[number];
export interface Hit {
  id: string; type: SearchType; title: string; subs: string[]; status: { kind: string; code: string } | null; tags: string[]; link: string; exact: boolean; match: string;
}
/** Which permission opens each type. Reports are offered when either kind can be opened (the query narrows to the kinds the role may). */
export const NEEDS: Record<SearchType, string[]> = { samples: ["order.read"], batches: ["batch.read"], orders: ["order.read"], drill_holes: ["master.read"], reports: ["coa.download", "roa.download"], clients: ["company.read"] };
export const offeredTypes = (perms: string[]) => TYPES.filter((t) => NEEDS[t].some((p) => perms.includes(p)));
const esc = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`);
const day = (d: unknown) => (d == null ? null : String(d).slice(0, 10));

interface Ctx { tx: Tx; q: string; like: string; limit: number; offset: number; perms: string[] }
type Found = { rows: Hit[]; total: number };
/** The rank column as a SQL fragment: 0 exact Sample ID, 1 exact other ID, 2 starts with, 3 contains. The text goes in as a quoted literal (quotes doubled, backslashes literal), never as raw input. */
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
const rank = (tx: Tx, cols: string[], q: string, first?: string) =>
  tx.unsafe(`case ${first ? `when lower(${first}) = ${lit(q)} then 0 ` : ""}when ${cols.map((c) => `lower(${c}) = ${lit(q)}`).join(" or ")} then 1 when ${cols.map((c) => `lower(${c}) like ${lit(`${esc(q)}%`)}`).join(" or ")} then 2 else 3 end`);

const FINDERS: Record<SearchType, (c: Ctx) => Promise<Found>> = {
  async samples({ tx, q, like, limit, offset }) {
    const rs = await tx`select s.id, s.sample_no, s.sample_code, s.client_ref, s.state, j.order_no, c.name as company, count(*) over()::int as total,
        ${rank(tx, ["s.sample_no", "s.sample_code", "s.client_ref"], q, "s.sample_no")} as rk
      from v_samples s join job_orders j on j.id = s.job_order_id join companies c on c.id = j.company_id
      where lower(s.sample_no) like ${like} or lower(s.sample_code) like ${like} or lower(s.client_ref) like ${like}
      order by rk, s.created_at desc, s.row_no limit ${limit} offset ${offset}`;
    return { total: rs[0]?.total ?? 0, rows: rs.map((x) => ({ id: x.id, type: "samples" as const, title: (x.sample_no ?? x.client_ref) as string, subs: [x.sample_code, x.sample_no ? x.client_ref : null, x.order_no, x.company].filter(Boolean) as string[],
      status: { kind: "sample", code: x.state as string }, tags: [], link: `/samples/${x.id}/history`, exact: x.rk <= 1, match: x.rk === 0 ? "sample" : "id" })) };
  },
  async batches({ tx, q, like, limit, offset }) {
    const rs = await tx`select b.batch_no, b.deadline_on::text as deadline_on, ${shownStatus(tx)} as st, j.order_no, c.name as company, count(*) over()::int as total, ${rank(tx, ["b.batch_no"], q)} as rk
      from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id where lower(b.batch_no) like ${like} order by rk, b.created_at desc limit ${limit} offset ${offset}`;
    return { total: rs[0]?.total ?? 0, rows: rs.map((x) => ({ id: x.batch_no, type: "batches" as const, title: x.batch_no as string, subs: [x.order_no, x.company, day(x.deadline_on)].filter(Boolean) as string[],
      status: { kind: "batch", code: x.st as string }, tags: [], link: `/batches/${x.batch_no}`, exact: x.rk <= 1, match: "id" })) };
  },
  async orders({ tx, q, like, limit, offset }) {
    const rs = await tx`select j.order_no, j.client_reference, j.status::text as st, j.due_on::text as due_on, c.name as company, count(*) over()::int as total, ${rank(tx, ["j.order_no", "j.client_reference"], q)} as rk
      from job_orders j join companies c on c.id = j.company_id where lower(j.order_no) like ${like} or lower(j.client_reference) like ${like} order by rk, j.created_at desc limit ${limit} offset ${offset}`;
    return { total: rs[0]?.total ?? 0, rows: rs.map((x) => ({ id: x.order_no, type: "orders" as const, title: x.order_no as string, subs: [x.company, x.client_reference, day(x.due_on)].filter(Boolean) as string[],
      status: { kind: "order", code: x.st as string }, tags: [], link: `/orders/${x.order_no}`, exact: x.rk <= 1, match: "id" })) };
  },
  async drill_holes({ tx, q, like, limit, offset }) {
    const rs = await tx`select d.id, d.code, d.description, d.archived_at, c.name as company, count(*) over()::int as total, ${rank(tx, ["d.code"], q)} as rk,
        exists (select 1 from coa_files f where f.drill_hole_id = d.id and f.is_current) as has_coa
      from drill_holes d join companies c on c.id = d.company_id where lower(d.code) like ${like} order by rk, d.code limit ${limit} offset ${offset}`;
    return { total: rs[0]?.total ?? 0, rows: rs.map((x) => ({ id: x.id, type: "drill_holes" as const, title: x.code as string, subs: [x.description, x.company].filter(Boolean) as string[],
      status: null, tags: [x.archived_at ? "Archived" : null, x.has_coa ? "CoA" : null].filter(Boolean) as string[], link: `/master/drill-holes?q=${encodeURIComponent(x.code as string)}`, exact: x.rk <= 1, match: "id" })) };
  },
  async reports({ tx, q, like, limit, offset, perms }) {
    const coa = perms.includes("coa.download"), roa = perms.includes("roa.download");
    const rs = await tx`select * from (
        select r.id::text as id, 'coa' as kind, r.report_no as no, r.status::text as st, j.order_no, c.name as company, r.issued_at as at from reports r join job_orders j on j.id = r.job_order_id join companies c on c.id = j.company_id
          where ${coa} and r.kind = 'coa' and r.report_no is not null and lower(r.report_no) like ${like}
        union all
        select d.roa_no, 'roa', d.roa_no, 'uploaded', j.order_no, c.name, d.uploaded_at from batch_documents d join batches b on b.id = d.batch_id join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id
          where ${roa} and lower(d.roa_no) like ${like}
      ) u order by (case when lower(no) = ${q} then 0 when lower(no) like ${`${esc(q)}%`} then 1 else 2 end), at desc nulls last limit ${limit} offset ${offset}`;
    const [cnt] = await tx`select (
        (select case when ${coa} then count(*) else 0 end from reports r where r.kind = 'coa' and r.report_no is not null and lower(r.report_no) like ${like}) +
        (select case when ${roa} then count(*) else 0 end from batch_documents d where lower(d.roa_no) like ${like}))::int as n`;
    return { total: (cnt?.n ?? 0) as number, rows: rs.map((x) => ({ id: x.id, type: "reports" as const, title: x.no as string, subs: [x.kind === "coa" ? "CoA" : "RoA", x.order_no, x.company].filter(Boolean) as string[],
      status: x.kind === "coa" ? { kind: "report", code: x.st as string } : null, tags: [], link: x.kind === "coa" ? `/reports/coa/${x.id}` : `/reports/roa/${x.no}`, exact: String(x.no).toLowerCase() === q, match: "id" })) };
  },
  async clients({ tx, q, like, limit, offset }) {
    const rs = await tx`select c.id, c.code, c.name, c.company_code, c.status, count(*) over()::int as total, ${rank(tx, ["c.code", "c.name"], q)} as rk
      from companies c where lower(c.name) like ${like} or lower(c.code) like ${like} order by rk, c.name limit ${limit} offset ${offset}`;
    return { total: rs[0]?.total ?? 0, rows: rs.map((x) => ({ id: x.id, type: "clients" as const, title: x.name as string, subs: [x.code, x.company_code].filter(Boolean) as string[],
      status: null, tags: [x.status !== "active" ? (x.status === "archived" ? "Archived" : "Inactive") : null].filter(Boolean) as string[], link: `/clients/${x.id}`, exact: x.rk <= 1, match: "name" })) };
  },
};

const Query = z.object({ q: z.string().trim().min(1).max(80), type: z.enum(TYPES).optional(), page: z.coerce.number().int().min(1).max(500).default(1) });

export async function searchRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const run = async (req: { user?: unknown; id: string; query: z.infer<typeof Query> }, per: number, only?: SearchType) => {
    const user = req.user as { userId: string; claims: Record<string, unknown>; permissions: string[] };
    const q = req.query.q.toLowerCase(), like = `%${esc(q)}%`, types = offeredTypes(user.permissions);
    const off = (t: SearchType) => (only === t ? (req.query.page - 1) * per : 0), lim = (t: SearchType) => (only && only !== t ? 1 : per);
    const done = await asUser(user, { requestId: req.id, screen: SCREEN }, (tx) => Promise.all(types.map(async (t) => [t, await FINDERS[t]({ tx, q, like, limit: lim(t), offset: off(t), perms: user.permissions })] as const)));
    return { types, done };
  };

  /** The top bar panel: up to 3 hits per type, the exact match first. A Sample ID typed or scanned in full opens that sample's history (`go`). */
  r.get("/search/quick", { preHandler: requireAny("search.use"), schema: { querystring: Query.pick({ q: true }) } }, async (req) => {
    const { done } = await run({ user: req.user, id: req.id, query: { q: req.query.q, page: 1 } }, 3);
    const groups = done.map(([type, f]) => ({ type, total: f.total, hits: f.rows })).filter((g) => g.total > 0);
    const all = groups.flatMap((g) => g.hits);
    const go = all.find((h) => h.exact && h.match === "sample") ?? all.find((h) => h.exact) ?? null;
    return { q: req.query.q, groups, total: groups.reduce((a, g) => a + g.total, 0), go };
  });

  /** The results page: counts per type, with 5 rows each, or one type paged by 10. */
  r.get("/search", { preHandler: requireAny("search.use"), schema: { querystring: Query } }, async (req) => {
    const only = req.query.type;
    const { types, done } = await run(req, only ? 10 : 5, only);
    if (only) { const f = done.find(([t]) => t === only)?.[1] ?? { total: 0, rows: [] }; return { q: req.query.q, types: done.map(([t, x]) => ({ type: t, total: x.total })), type: only, total: f.total, page: req.query.page, pages: Math.max(1, Math.ceil(f.total / 10)), rows: f.rows }; }
    return { q: req.query.q, types: done.map(([t, f]) => ({ type: t, total: f.total })), groups: done.map(([t, f]) => ({ type: t, total: f.total, rows: f.rows })).filter((g) => g.total > 0) };
  });
}
