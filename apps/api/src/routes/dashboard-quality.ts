// Dashboard, Quality & reports tab (Phase 5, slice C1; Dashboard_v2_Screen_Plan.md section 6, Phase5_Build_Design.md 12.3 and 12.5): four KPIs, three scatters with their regression, Trend CV on
// four bases, and the Drill holes card. Period and Company apply to all of it. Reads run as the signed-in user (RLS). The regression and R² are computed here (spec S-01, 13.6).
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { fromAdb, type Basis } from "@sgsi/shared";
import { authenticate, requireAny } from "../auth";
import { asUser, type Tx } from "../db";
import { TZ, todayIso, uuid } from "../batch-lib";
import { periodRange } from "./dashboard";
import { regress, thin } from "../regression";

const SCREEN = "Dashboard";
type R = { user?: { userId: string; claims: Record<string, unknown>; permissions: string[] } | undefined; id: string };
const Period = z.object({
  period: z.enum(["7", "30", "this_month", "last_month", "this_year", "custom"]).default("30"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), company: uuid.optional(),
});
const Holes = Period.extend({ filter: z.enum(["all", "missing"]).default("all"), q: z.string().trim().max(60).optional(), page: z.coerce.number().int().min(1).max(10000).default(1) });
const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const dayOf = (col: string) => `(${col} at time zone '${TZ}')::date`;
const POINTS = 2000, PER = 10;
/** The pairs of the three scatters: the first named value runs across, the second up (decision C-2, as SIM Lab's bivariate charts). */
const PAIRS = [
  { id: "cv-ash", title: "CV vs Ash", x: "gcv", y: "ash", xl: "CV (ADB)", yl: "Ash (ADB)" },
  { id: "rd-ash", title: "RD vs Ash", x: "rd", y: "ash", xl: "RD (ADB)", yl: "Ash (ADB)" },
  { id: "fc-gcv", title: "FC vs GCV", x: "fc", y: "gcv", xl: "FC (ADB)", yl: "GCV (ADB)" },
] as const;

export async function dashboardQualityRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const as = <T>(req: R, fn: (tx: Tx) => Promise<T>) => asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const range = (q: z.infer<typeof Period>) => {
    const today = todayIso(), [from, to] = periodRange(q as never, today);
    const days = Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;
    return { today, from, to, days, prevFrom: addDays(from, -days), prevTo: addDays(from, -1) };
  };
  /** Drill holes that have samples received in the period (decision: only those, so the card follows the filters), with the batches and RoAs that hold them and their current CoA. */
  const holes = (tx: Tx, from: string, to: string, co: string | null, filter: "all" | "missing", q: string | undefined, limit: number, offset: number) => tx`
    with h as (
      select d.id, d.code, c.name as company, count(s.id)::int as samples,
        (select array_agg(distinct bd.roa_no order by bd.roa_no) from batch_documents bd join batches bb on bb.id = bd.batch_id join samples ss on ss.batch_id = bb.id
          where lower(ss.drill_hole_text) = lower(d.code) and ss.job_order_id in (select id from job_orders where company_id = d.company_id)) as roas,
        cf.file_name, cf.uploaded_at as coa_at
      from drill_holes d join companies c on c.id = d.company_id
        join samples s on lower(s.drill_hole_text) = lower(d.code) and s.received_at is not null and ${tx.unsafe(dayOf("s.received_at"))} between ${from} and ${to}
        join job_orders j on j.id = s.job_order_id and j.company_id = d.company_id
        left join coa_files cf on cf.drill_hole_id = d.id and cf.is_current
      where true ${co ? tx`and d.company_id = ${co}` : tx``} ${q ? tx`and d.code ilike ${`%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`}` : tx``}
      group by d.id, d.code, c.name, cf.file_name, cf.uploaded_at
    )
    select h.*, count(*) over()::int as total, count(*) filter (where file_name is null) over()::int as missing, (select count(*)::int from h) as all_n
    from h ${filter === "missing" ? tx`where file_name is null` : tx``} order by code ${limit ? tx`limit ${limit} offset ${offset}` : tx``}`;
  const holeRow = (x: Record<string, unknown>) => ({
    id: x.id as string, code: x.code as string, company: x.company as string, samples: x.samples as number, roas: ((x.roas as string[] | null) ?? []).slice(0, 3),
    coa: x.file_name ? { fileName: x.file_name as string, at: x.coa_at as string } : null,
  });

  r.get("/dashboard/quality", { preHandler: requireAny("dashboard.quality"), schema: { querystring: Period } }, async (req) => {
    const { today, from, to, prevFrom, prevTo } = range(req.query), co = req.query.company ?? null;
    const cf = (tx: Tx, a = "b") => (co ? tx`and ${tx.unsafe(a)}.company_id = ${co}` : tx``);
    const d = await as(req, async (tx) => {
      const [kp, roa, waiting, det, rows, holeKp] = await Promise.all([
        tx`select count(*) filter (where b.status = 'completed' and ${tx.unsafe(dayOf("b.completed_at"))} between ${from} and ${to})::int as completed,
                  count(*) filter (where b.status = 'completed' and ${tx.unsafe(dayOf("b.completed_at"))} between ${prevFrom} and ${prevTo})::int as completed_prev,
                  count(*) filter (where b.status = 'completed')::int as completed_all,
                  count(*) filter (where ${tx.unsafe(dayOf("b.created_at"))} between ${from} and ${to})::int as created
           from batches b where true ${cf(tx)}`,
        tx`select count(*) filter (where ${tx.unsafe(dayOf("bd.uploaded_at"))} between ${from} and ${to})::int as n,
                  count(*) filter (where ${tx.unsafe(dayOf("bd.uploaded_at"))} between ${prevFrom} and ${prevTo})::int as prev
           from batch_documents bd join batches b on b.id = bd.batch_id where true ${cf(tx)}`,
        tx`select count(*)::int as n from batches b where b.status = 'analysis_finished' and not exists (select 1 from batch_documents bd where bd.batch_id = b.id) ${cf(tx)}`,
        tx`select count(*) filter (where ${tx.unsafe(dayOf("a.entered_at"))} between ${from} and ${to})::int as n,
                  count(*) filter (where ${tx.unsafe(dayOf("a.entered_at"))} between ${prevFrom} and ${prevTo})::int as prev
           from analyses a join samples s on s.id = a.sample_id join parameters p on p.id = a.parameter_id join batches b on b.id = s.batch_id
           where a.round = 1 and a.entered_at is not null and p.code <> 'ADL' ${cf(tx)}`,
        // one row per sample of a batch completed in the period, with the ADB values the charts use (TM is as received)
        tx`select s.id, coalesce(s.sample_no, s.client_ref) as sid, s.sample_code, s.drill_hole_text as hole, b.batch_no, b.completed_at,
                  max(av.value_num) filter (where p.code = 'GCV')::float as gcv, max(av.value_num) filter (where p.code = 'ASH')::float as ash, max(av.value_num) filter (where p.code = 'RD')::float as rd,
                  max(av.value_num) filter (where p.code = 'FC')::float as fc, max(av.value_num) filter (where p.code = 'IM')::float as im, max(av.value_num) filter (where p.code = 'TM')::float as tm
           from samples s join batches b on b.id = s.batch_id join analyses a on a.sample_id = s.id and a.round = 1 join parameters p on p.id = a.parameter_id
             join analysis_values av on av.analysis_id = a.id and av.is_primary
           where b.status = 'completed' and ${tx.unsafe(dayOf("b.completed_at"))} between ${from} and ${to} ${cf(tx)}
           group by s.id, s.sample_no, s.client_ref, s.sample_code, s.drill_hole_text, b.batch_no, b.completed_at order by b.completed_at, s.id`,
        holes(tx, from, to, co, "all", undefined, 1, 0),
      ]);
      return { kp: kp[0]!, roa: roa[0]!, waiting: waiting[0]!.n as number, det: det[0]!, rows, hole: holeKp[0] };
    });
    const pct = (n: number, p: number) => (p > 0 ? Math.round(((n - p) / p) * 100) : null);
    const scatters = PAIRS.map((p) => {
      const all = d.rows.filter((x) => x[p.x] != null && x[p.y] != null), fit = regress(all.map((x) => [x[p.x] as number, x[p.y] as number]));
      return { id: p.id, title: p.title, xLabel: p.xl, yLabel: p.yl, n: all.length, slope: fit.slope, intercept: fit.intercept, r2: fit.r2,
        points: thin(all, POINTS).map((x) => ({ x: x[p.x] as number, y: x[p.y] as number, sampleId: x.sid as string, sampleCode: x.sample_code as string | null, hole: x.hole as string | null })) };
    });
    // Trend CV: the mean CV of each completed batch, on each basis (a sample lacking the moisture a basis needs is left out of that basis)
    type Sample = Record<string, unknown>;
    const bases: Basis[] = ["adb", "ar", "db", "daf"], byBatch = new Map<string, { at: string; rows: Sample[] }>();
    for (const x of d.rows) { const b = byBatch.get(x.batch_no as string) ?? { at: x.completed_at as string, rows: [] }; b.rows.push(x); byBatch.set(x.batch_no as string, b); }
    const trend = Object.fromEntries(bases.map((bs) => [bs, [...byBatch.entries()].flatMap(([batchNo, b]) => {
      const vs = b.rows.map((x) => (x.gcv == null ? null : fromAdb(x.gcv as number, bs, { im: x.im as number | null, tm: x.tm as number | null, ash: x.ash as number | null }))).filter((v): v is string => v != null).map(Number);
      return vs.length ? [{ batchNo, at: new Date(b.at).toISOString(), value: Math.round(vs.reduce((a, c) => a + c, 0) / vs.length), n: vs.length }] : [];
    })])) as Record<Basis, Array<{ batchNo: string; at: string; value: number; n: number }>>;
    const hk = d.hole as { total?: number; missing?: number; all_n?: number } | undefined, withCoa = (hk?.all_n ?? 0) - (hk?.missing ?? 0);
    return {
      period: { from, to, today },
      kpis: {
        completed: { n: d.kp.completed as number, prev: d.kp.completed_prev as number, change: pct(d.kp.completed as number, d.kp.completed_prev as number), total: d.kp.created as number, toDate: d.kp.completed_all as number },
        roa: { n: d.roa.n as number, prev: d.roa.prev as number, change: pct(d.roa.n as number, d.roa.prev as number), waiting: d.waiting },
        coverage: { withCoa, of: hk?.all_n ?? 0, missing: hk?.missing ?? 0, percent: hk?.all_n ? Math.round((withCoa / hk.all_n) * 100) : null },
        determinations: { n: d.det.n as number, prev: d.det.prev as number, change: pct(d.det.n as number, d.det.prev as number) },
      },
      scatters, trend,
    };
  });

  r.get("/dashboard/quality/drill-holes", { preHandler: requireAny("dashboard.quality"), schema: { querystring: Holes } }, async (req) => {
    const { from, to } = range(req.query), f = req.query, co = f.company ?? null;
    const rows = await as(req, (tx) => holes(tx, from, to, co, f.filter, f.q, PER, (f.page - 1) * PER));
    const x = rows[0] as { total?: number; missing?: number; all_n?: number } | undefined;
    // the chip counts come from the first row of the whole list; with a filter or search they come from a second, unfiltered look
    const counts = f.filter === "all" && !f.q ? { all: x?.total ?? 0, missing: x?.missing ?? 0 }
      : await as(req, async (tx) => { const [c] = await holes(tx, from, to, co, "all", f.q, 1, 0); return { all: (c?.all_n as number | undefined) ?? 0, missing: (c?.missing as number | undefined) ?? 0 }; });
    return { total: f.filter === "missing" ? (x?.total ?? 0) : (x?.total ?? 0), page: f.page, per: PER, counts, items: rows.map(holeRow) };
  });
}
