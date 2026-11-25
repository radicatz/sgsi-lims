// My work (Phase 5, slice A; My_Work_Screen_Plan.md sections 2 to 6, frames 01-My_work): the seven queues of the v1 flow, what the person started and has not finished,
// and the lab's recent hand-offs. Reads run as the signed-in user, so row-level security decides what each role sees. A queue is offered by permission
// (and, for Samples awaiting arrival, by role: the CSO and Preparation own it). Waiting is calendar time since the record entered the queue.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { asUser, sql, type Tx } from "../db";
import { TZ, fail, shownStatus, todayIso } from "../batch-lib";

const SCREEN = "My work";
type R = { user?: { userId: string; claims: Record<string, unknown>; permissions: string[] } | undefined; id: string };

/** The queues in flow order: Q1 to Q7. `perm` is what the queue needs; `role` narrows it where two roles share the permission. */
export const QUEUES = [
  { id: "receive", label: "Batches to receive", perm: "sample.receive", action: "Open reception", tab: "reception" },
  { id: "awaiting", label: "Samples awaiting arrival", perm: "sample.receive", roles: ["cso", "prep"], action: "Open job order" },
  { id: "preparation", label: "In preparation", perm: "result.write.prep", action: "Open preparation", tab: "preparation" },
  { id: "entry", label: "Ready for data entry", perm: "result.write", action: "Enter results", tab: "analysis" },
  { id: "roa", label: "Signed RoA to upload", perm: "batch.document.upload", action: "Upload RoA", tab: "analysis" },
  { id: "coa-generate", label: "CoAs to generate", perm: "report.publish", action: "Open CoA" },
  { id: "coa-send", label: "CoAs to send", perm: "coa.mark_sent", action: "Mark sent" },
] as const;
type QueueId = (typeof QUEUES)[number]["id"];
const IDS = QUEUES.map((q) => q.id) as [QueueId, ...QueueId[]];
const LIMIT = 200;

interface Row {
  id: string; since: string | null; number: string; numberSub: string | null; orderNo: string; company: string; samples: string | null;
  status: string | null; deadline: string | null; note: string | null; link: string;
}
const iso = (d: unknown) => (d == null ? null : new Date(d as string).toISOString());
const day = (d: unknown) => (d == null ? null : String(d).slice(0, 10));

/** Rows of one queue, oldest waiting first. */
async function rowsOf(tx: Tx, id: QueueId): Promise<Row[]> {
  const batch = (x: Record<string, unknown>, tab: string, since: unknown, note: string | null): Row => ({
    id: x.id as string, since: iso(since), number: x.batch_no as string, numberSub: x.batch_date ? day(x.batch_date) : null, orderNo: x.order_no as string, company: x.company as string,
    samples: `${x.arrived} / ${x.total}`, status: (x.shown as string) ?? null, deadline: day(x.deadline_on), note, link: `/batches/${x.batch_no}/${tab}`,
  });
  const base = (status: ReturnType<typeof tx>) => tx`select b.id, b.batch_no, b.batch_date::text as batch_date, b.deadline_on::text as deadline_on, b.created_at, b.reception_confirmed_at, b.prep_finished_at, b.analysis_started_at, b.analysis_finished_at,
      j.order_no, c.name as company, ${shownStatus(tx)} as shown,
      (select count(*)::int from samples s where s.batch_id = b.id and s.arrived_at is not null) as arrived, (select count(*)::int from samples s where s.batch_id = b.id) as total
    from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id where ${status} limit ${LIMIT}`;
  if (id === "receive") {
    const rs = await base(tx`b.status = 'created'`);
    return rs.map((x) => batch(x, "reception", x.created_at, x.arrived < x.total ? `${x.total - x.arrived} not arrived` : null));
  }
  if (id === "preparation") {
    const rs = await tx`select b.id, b.batch_no, b.batch_date::text as batch_date, b.deadline_on::text as deadline_on, b.reception_confirmed_at, j.order_no, c.name as company, 'preparation' as shown,
        (select count(*)::int from samples s where s.batch_id = b.id and s.received_at is not null) as arrived, (select count(*)::int from samples s where s.batch_id = b.id) as total,
        (select count(*)::int from samples s where s.batch_id = b.id and s.received_at is not null and not s.on_hold and not exists (
           select 1 from analyses a join parameters p on p.id = a.parameter_id where a.sample_id = s.id and p.code = 'ADL')) as no_adl,
        exists (select 1 from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = b.id and p.code = 'TM') as tm
      from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id where b.status = 'preparation' limit ${LIMIT}`;
    return rs.map((x) => batch(x, "preparation", x.reception_confirmed_at, x.tm && x.no_adl > 0 ? "ADL missing" : null));
  }
  if (id === "entry") {
    const rs = await base(tx`b.status in ('prep_finished', 'analysis')`);
    return rs.map((x) => batch(x, "analysis", x.analysis_started_at ?? x.prep_finished_at, x.shown === "analysis" ? "Values partly saved" : null));
  }
  if (id === "roa") {
    const rs = await base(tx`b.status = 'analysis_finished'`);
    return rs.map((x) => batch(x, "analysis", x.analysis_finished_at, null));
  }
  if (id === "awaiting") {
    const rs = await tx`select j.id, j.order_no, j.due_on::text as due_on, c.name as company, count(*)::int as n, min(s.released_at) as since, array_agg(distinct rb.batch_no) filter (where rb.batch_no is not null) as from_batches
      from v_samples s join job_orders j on j.id = s.job_order_id join companies c on c.id = j.company_id left join batches rb on rb.id = s.released_from_batch_id
      where s.state = 'awaiting_arrival' group by j.id, j.order_no, j.due_on, c.name limit ${LIMIT}`;
    return rs.map((x) => ({ id: x.id as string, since: iso(x.since), number: x.order_no as string, numberSub: null, orderNo: x.order_no as string, company: x.company as string,
      samples: `${x.n}`, status: null, deadline: day(x.due_on), note: x.from_batches?.length ? `returned from ${(x.from_batches as string[]).join(", ")}` : null, link: `/orders/${x.order_no}/batches` }));
  }
  if (id === "coa-generate") {
    const rs = await tx`select j.id, j.order_no, j.due_on::text as due_on, c.name as company, (select max(b.completed_at) from batches b where b.job_order_id = j.id) as since,
        (select count(*)::int from batches b where b.job_order_id = j.id) as n
      from job_orders j join companies c on c.id = j.company_id
      where j.status in ('in_progress', 'reported') and exists (select 1 from batches b where b.job_order_id = j.id)
        and not exists (select 1 from batches b where b.job_order_id = j.id and b.status <> 'completed')
        and not exists (select 1 from reports r where r.job_order_id = j.id and r.kind = 'coa' and r.status in ('draft', 'awaiting_signature', 'issued'))
      limit ${LIMIT}`;
    return rs.map((x) => ({ id: x.id as string, since: iso(x.since), number: x.order_no as string, numberSub: null, orderNo: x.order_no as string, company: x.company as string,
      samples: `${x.n} ${x.n === 1 ? "batch" : "batches"}`, status: null, deadline: day(x.due_on), note: null, link: `/orders/${x.order_no}/coa` }));
  }
  const rs = await tx`select r.id, r.report_no, r.issued_at, j.order_no, j.due_on::text as due_on, c.name as company
    from reports r join job_orders j on j.id = r.job_order_id join companies c on c.id = j.company_id
    where r.kind = 'coa' and r.status = 'issued' and not exists (select 1 from report_deliveries d where d.report_id = r.id) limit ${LIMIT}`;
  return rs.map((x) => ({ id: x.id as string, since: iso(x.issued_at), number: x.report_no as string, numberSub: null, orderNo: x.order_no as string, company: x.company as string,
    samples: null, status: "published", deadline: day(x.due_on), note: null, link: `/reports/coa/${x.id}` }));
}

const byWaiting = (a: Row, b: Row) => {
  const pa = a.deadline && a.deadline < todayIso() ? 0 : 1, pb = b.deadline && b.deadline < todayIso() ? 0 : 1;
  return pa - pb || (a.since ?? "").localeCompare(b.since ?? "");
};

export async function workRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const as = <T>(req: R, fn: (tx: Tx) => Promise<T>) => asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const myRoles = async (userId: string) => (await sql`select r.code from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = ${userId}`).map((x) => x.code as string);
  const offered = (perms: string[], roles: string[]) =>
    QUEUES.filter((q) => perms.includes(q.perm) && (!("roles" in q) || q.roles.some((x) => roles.includes(x))));

  /* ================= counts for every queue the person has, WIP and recent activity ================= */
  r.get("/work", { preHandler: requireAny("work.use") }, async (req) => {
    const roles = await myRoles(req.user!.userId);
    const mine = offered(req.user!.permissions, roles);
    const today = todayIso();
    const out = await as(req, async (tx) => {
      const lists = await Promise.all(mine.map(async (q) => [q.id, await rowsOf(tx, q.id)] as const));
      const wip = await tx`
        select 'reception' as kind, b.batch_no, b.id, 'Receiving' as state, min(s.arrived_at) as started, c.name as company, '/batches/' || b.batch_no || '/reception' as link
          from batches b join samples s on s.batch_id = b.id and s.arrived_by = ${req.user!.userId} join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id
          where b.status = 'created' group by b.id, b.batch_no, c.name
        union all
        select 'preparation', b.batch_no, b.id, 'Preparation', min(a.entered_at), c.name, '/batches/' || b.batch_no || '/preparation'
          from batches b join samples s on s.batch_id = b.id join analyses a on a.sample_id = s.id and a.entered_by = ${req.user!.userId} and a.source = 'entered'
          join parameters p on p.id = a.parameter_id and p.code = 'ADL'
          join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id
          where b.status = 'preparation' group by b.id, b.batch_no, c.name
        union all
        select 'analysis', b.batch_no, b.id, 'Analysis', min(a.entered_at), c.name, '/batches/' || b.batch_no || '/analysis'
          from batches b join samples s on s.batch_id = b.id join analyses a on a.sample_id = s.id and a.entered_by = ${req.user!.userId} and a.source = 'entered'
          join parameters p on p.id = a.parameter_id and p.code <> 'ADL'
          join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id
          where b.status in ('prep_finished', 'analysis') group by b.id, b.batch_no, c.name
        union all
        select 'coa', j.order_no, r.id, case when r.revision > 1 then 'CoA revision ' || r.revision else 'CoA draft' end, r.created_at, c.name, '/reports/coa/' || r.id
          from reports r join job_orders j on j.id = r.job_order_id join companies c on c.id = j.company_id
          where r.kind = 'coa' and r.status = 'draft' and r.drafted_by = ${req.user!.userId}
        order by started desc limit 6`;
      const recent = await tx`select l.action, l.at, b.batch_no, p.full_name as by, '/batches/' || b.batch_no as link
        from batch_status_log l join batches b on b.id = l.batch_id left join profiles p on p.id = l.by_user order by l.at desc limit 20`;
      return { lists, wip, recent };
    });
    const queues = out.lists.map(([id, rows]) => {
      const def = QUEUES.find((q) => q.id === id)!;
      const sorted = [...rows].sort(byWaiting);
      return { id, label: def.label, count: rows.length, overdue: rows.filter((x) => x.deadline && x.deadline < today).length, oldestSince: sorted.map((x) => x.since).filter(Boolean).sort()[0] ?? null };
    });
    return {
      queues, total: queues.reduce((a, q) => a + q.count, 0), today, timeZone: TZ,
      wip: out.wip.map((x) => ({ id: x.id, kind: x.kind, number: x.batch_no, state: x.state, startedAt: iso(x.started), company: x.company, link: x.link })),
      recent: out.recent.map((x) => ({ action: x.action, at: iso(x.at), number: x.batch_no, by: x.by ?? null, link: x.link })),
    };
  });

  /* ================= one queue ================= */
  r.get("/work/:queue", { preHandler: requireAny("work.use"), schema: { params: z.object({ queue: z.enum(IDS) }), querystring: z.object({ q: z.string().trim().max(60).optional(), overdue: z.enum(["1"]).optional() }) } }, async (req, reply) => {
    const roles = await myRoles(req.user!.userId);
    const def = offered(req.user!.permissions, roles).find((x) => x.id === req.params.queue);
    if (!def) return fail(reply, 403, "forbidden", "This queue is not part of your work.");
    const today = todayIso(), needle = req.query.q?.toLowerCase();
    const rows = (await as(req, (tx) => rowsOf(tx, def.id))).sort(byWaiting);
    const shown = rows
      .filter((x) => !needle || [x.number, x.orderNo, x.company, x.note ?? ""].some((t) => t.toLowerCase().includes(needle)))
      .filter((x) => !req.query.overdue || (x.deadline && x.deadline < today));
    return { id: def.id, label: def.label, action: def.action, today, total: rows.length, bulk: def.id === "coa-send", rows: shown.slice(0, 100) };
  });
}
