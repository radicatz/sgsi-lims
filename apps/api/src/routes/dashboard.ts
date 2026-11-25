// Dashboard, Operations tab (Phase 5, slice A; Dashboard_v2_Screen_Plan.md sections 4 and 5, frames 02-Dashboard-01): one request holds every widget so the page shows its cards together.
// Period and Company apply to every widget except the "now" ones (workflow, job orders by status, Active batches, the deadline strip). Reads run as the signed-in user (RLS).
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { asUser, type Tx } from "../db";
import { TZ, shownStatus, todayIso, uuid } from "../batch-lib";

const SCREEN = "Dashboard";
type R = { user?: { userId: string; claims: Record<string, unknown>; permissions: string[] } | undefined; id: string };
const Query = z.object({
  period: z.enum(["7", "30", "this_month", "last_month", "this_year", "custom"]).default("30"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  company: uuid.optional(),
});
export const STEPS = ["created", "receiving", "preparation", "prep_finished", "analysis", "analysis_finished", "completed"] as const;
const ORDER_STATUSES = ["draft", "awaiting_samples", "in_progress", "reported", "delivered"] as const;
/** Days a batch is allowed, by the job order's service (Configuration > Services); a custom set uses 5 days up to 8 parameters, 10 days beyond (Phase 5 plan, decision 5). */
const TARGET_SQL = (tx: Tx) => tx`coalesce(sv.turnaround_days, case when (select count(*) from job_order_parameters x where x.job_order_id = j.id) <= 8 then 5 else 10 end)`;

const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
/** [from, to] inclusive, in the lab's calendar days. */
export function periodRange(q: z.infer<typeof Query>, today = todayIso()): [string, string] {
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const pad = (n: number) => String(n).padStart(2, "0");
  if (q.period === "custom" && q.from && q.to) return q.from <= q.to ? [q.from, q.to] : [q.to, q.from];
  if (q.period === "this_month") return [`${y}-${pad(m)}-01`, today];
  if (q.period === "last_month") { const ly = m === 1 ? y - 1 : y, lm = m === 1 ? 12 : m - 1; return [`${ly}-${pad(lm)}-01`, addDays(`${y}-${pad(m)}-01`, -1)]; }
  if (q.period === "this_year") return [`${y}-01-01`, today];
  return [addDays(today, -(Number(q.period === "custom" ? "30" : q.period) - 1)), today];
}
/** The band of mean turnaround against its target, as the plan names them (achieved, 100-110%, ... over 300%). */
export const bandOf = (ratio: number): string => (ratio <= 1 ? "achieved" : ratio <= 1.1 ? "100-110%" : ratio <= 1.25 ? "110-125%" : ratio <= 1.5 ? "125-150%" : ratio <= 2 ? "150-200%" : ratio <= 3 ? "200-300%" : ">300%");

export async function dashboardRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const as = <T>(req: R, fn: (tx: Tx) => Promise<T>) => asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);

  r.get("/dashboard/operations", { preHandler: requireAny("dashboard.operations"), schema: { querystring: Query } }, async (req) => {
    const today = todayIso(), [from, to] = periodRange(req.query, today);
    const days = Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;
    const prevFrom = addDays(from, -days), prevTo = addDays(from, -1);
    /** Samples received per day shows the last 14 days of the period, empty days included (owner, Nov 24: 14 thin columns as in the frame). */
    const dayFrom = days > 14 ? addDays(to, -13) : from;
    const co = req.query.company ?? null;
    const sunday = (() => { const d = new Date(`${today}T00:00:00Z`); return addDays(today, (7 - d.getUTCDay()) % 7); })();
    const monday = addDays(sunday, -6);
    const dayOf = (col: string) => `(${col} at time zone '${TZ}')::date`;

    const d = await as(req, async (tx) => {
      const cf = co ? tx`and b.company_id = ${co}` : tx``;
      const [kp, workflow, orders, mix, perDay, recvNow, recvPrev, turnBy, active, week, queues] = await Promise.all([
        tx`select count(*) filter (where b.status <> 'completed')::int as in_progress,
             count(*) filter (where b.status = 'completed' and ${tx.unsafe(dayOf("b.completed_at"))} between ${from} and ${to})::int as completed,
             count(*) filter (where ${tx.unsafe(dayOf("b.created_at"))} between ${from} and ${to})::int as created,
             count(*) filter (where b.status <> 'completed' and b.deadline_on <= ${sunday})::int as due_week,
             count(*) filter (where b.status <> 'completed' and b.deadline_on < ${today})::int as past_due
           from batches b where true ${cf}`,
        tx`select ${shownStatus(tx)} as st, count(*)::int as n from batches b where true ${cf} group by 1`,
        tx`select j.status::text as st, count(*)::int as n from job_orders j where j.status::text = any(${ORDER_STATUSES as unknown as string[]}) ${co ? tx`and j.company_id = ${co}` : tx``} group by 1`,
        tx`select case s.ply_comp when 'ply' then 'Ply' when 'comp' then 'Composite' else 'Not set' end as k, count(*)::int as n from samples s join job_orders j on j.id = s.job_order_id
           where s.received_at is not null and ${tx.unsafe(dayOf("s.received_at"))} between ${from} and ${to} ${co ? tx`and j.company_id = ${co}` : tx``} group by 1 order by 2 desc`,
        tx`select to_char(${tx.unsafe(dayOf("s.received_at"))}, 'YYYY-MM-DD') as d, count(*)::int as n
           from samples s join job_orders j on j.id = s.job_order_id where s.received_at is not null and ${tx.unsafe(dayOf("s.received_at"))} between ${dayFrom} and ${to} ${co ? tx`and j.company_id = ${co}` : tx``} group by 1 order by 1`,
        tx`select count(*)::int as n, count(distinct s.batch_id)::int as b from samples s join job_orders j on j.id = s.job_order_id where s.received_at is not null and ${tx.unsafe(dayOf("s.received_at"))} between ${from} and ${to} ${co ? tx`and j.company_id = ${co}` : tx``}`,
        tx`select count(*)::int as n from samples s join job_orders j on j.id = s.job_order_id where s.received_at is not null and ${tx.unsafe(dayOf("s.received_at"))} between ${prevFrom} and ${prevTo} ${co ? tx`and j.company_id = ${co}` : tx``}`,
        tx`select c.id, c.name, count(*)::int as n, avg(extract(epoch from (b.completed_at - b.reception_confirmed_at)) / 86400)::float as days, avg(${TARGET_SQL(tx)})::float as target
           from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id left join services sv on sv.id = j.service_id
           where b.status = 'completed' and b.reception_confirmed_at is not null and ${tx.unsafe(dayOf("b.completed_at"))} between ${from} and ${to} ${cf} group by c.id, c.name order by 4 desc`,
        tx`select b.id, b.batch_no, b.deadline_on::text as deadline_on, ${shownStatus(tx)} as st, c.name as company, j.order_no,
             (select count(*)::int from samples s where s.batch_id = b.id and s.arrived_at is not null) as arrived, (select count(*)::int from samples s where s.batch_id = b.id) as total,
             ${TARGET_SQL(tx)} as target, b.reception_confirmed_at
           from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id left join services sv on sv.id = j.service_id
           where b.status <> 'completed' ${cf} order by b.deadline_on nulls last, b.batch_no limit 60`,
        tx`select b.batch_no, b.deadline_on::text as deadline_on, ${shownStatus(tx)} as st, c.name as company from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id
           where b.status <> 'completed' and b.deadline_on between ${monday} and ${sunday} ${cf} order by b.deadline_on, b.batch_no`,
        tx`select 1`,
      ]);
      void queues;
      const [tn] = await tx`select avg(extract(epoch from (b.completed_at - b.reception_confirmed_at)) / 86400)::float as days, avg(${TARGET_SQL(tx)})::float as target, count(*)::int as n
        from batches b join job_orders j on j.id = b.job_order_id left join services sv on sv.id = j.service_id
        where b.status = 'completed' and b.reception_confirmed_at is not null and ${tx.unsafe(dayOf("b.completed_at"))} between ${from} and ${to} ${cf}`;
      return { kp: kp[0]!, workflow, orders, mix, perDay, recv: recvNow[0]!.n as number, recvBatches: recvNow[0]!.b as number, recvPrev: recvPrev[0]!.n as number, turnBy, active, week, tn: tn! };
    });
    const wf = new Map(d.workflow.map((x) => [x.st as string, x.n as number]));
    const od = new Map(d.orders.map((x) => [x.st as string, x.n as number]));
    const meanDays = d.tn.n ? Math.round((d.tn.days as number) * 10) / 10 : null, meanTarget = d.tn.n ? Math.round((d.tn.target as number) * 10) / 10 : null;
    const alertRows = d.active.filter((x) => x.deadline_on && String(x.deadline_on).slice(0, 10) <= addDays(today, 1) && String(x.deadline_on).slice(0, 10) >= today);
    return {
      period: { from, to, days, today, monday, sunday },
      kpis: {
        inProgress: d.kp.in_progress as number, completed: d.kp.completed as number, created: d.kp.created as number,
        dueWeek: d.kp.due_week as number, pastDue: d.kp.past_due as number,
        received: d.recv, receivedBatches: d.recvBatches, receivedPrev: d.recvPrev,
        turnaround: { days: meanDays, target: meanTarget, band: meanDays != null && meanTarget ? bandOf(meanDays / meanTarget) : null, n: d.tn.n as number },
      },
      workflow: STEPS.map((s) => ({ id: s, n: wf.get(s) ?? 0 })),
      orders: ORDER_STATUSES.map((s) => ({ id: s, n: od.get(s) ?? 0 })),
      mix: d.mix.map((x) => ({ label: x.k as string, n: x.n as number })),
      perDay: (() => { const m = new Map(d.perDay.map((x) => [x.d as string, x.n as number])); const out: Array<{ d: string; n: number }> = []; for (let x = dayFrom; x <= to; x = addDays(x, 1)) out.push({ d: x, n: m.get(x) ?? 0 }); return out; })(),
      turnaround: d.turnBy.map((x) => ({ id: x.id as string, company: x.name as string, n: x.n as number, days: Math.round((x.days as number) * 10) / 10, target: Math.round((x.target as number) * 10) / 10, band: bandOf((x.days as number) / (x.target as number)) })),
      active: d.active.map((x) => ({
        batchNo: x.batch_no as string, orderNo: x.order_no as string, company: x.company as string, status: x.st as string, deadline: x.deadline_on ? String(x.deadline_on).slice(0, 10) : null,
        arrived: x.arrived as number, total: x.total as number, late: !!x.deadline_on && String(x.deadline_on).slice(0, 10) < today,
        band: x.reception_confirmed_at && x.deadline_on ? bandOf(((Date.now() - new Date(x.reception_confirmed_at as string).getTime()) / 86_400_000) / (x.target as number)) : null,
      })),
      alert: alertRows.length ? { count: alertRows.length, first: { batchNo: alertRows[0]!.batch_no as string, status: alertRows[0]!.st as string } } : null,
      week: d.week.map((x) => ({ batchNo: x.batch_no as string, deadline: String(x.deadline_on).slice(0, 10), status: x.st as string, company: x.company as string })),
    };
  });
}
