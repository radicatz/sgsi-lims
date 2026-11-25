// Notifications (App plan 5.1; frames 00-08-01 to 04): a user reads only their own. Written by the API after a permission check (batch-lib `notify`),
// and by the deadline timer below: N7 (due today or tomorrow) to the roles of the batch's queue, N8 (past its deadline) to the Supervisor and Manager,
// each once per batch and person. The timer runs every 15 minutes and once at start, under a database lock so two API processes never send twice.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../auth";
import { asUser, system } from "../db";
import { fail, notify, todayIso, uuid } from "../batch-lib";

const SCREEN = "Notifications";
const requireAuth = async (req: FastifyRequest, reply: FastifyReply) => { if (!req.user) return reply.code(401).send({ code: "unauthenticated", text: "Sign in to continue." }); };

export async function notificationRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const mine = (req: { user?: unknown; id: string }) => ({ user: req.user as { userId: string; claims: Record<string, unknown> }, meta: { requestId: req.id, screen: SCREEN } });
  const Query = z.object({ unread: z.coerce.boolean().optional(), before: z.string().datetime().optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });

  r.get("/notifications", { preHandler: requireAuth, schema: { querystring: Query } }, async (req) => {
    const { user, meta } = mine(req), { unread, before, limit } = req.query;
    return asUser(user, meta, async (tx) => {
      const rows = await tx`select id, event, icon, title, body, link, created_at, read_at from notifications
        where user_id = auth.uid() ${unread ? tx`and read_at is null` : tx``} ${before ? tx`and created_at < ${before}` : tx``}
        order by created_at desc limit ${limit + 1}`;
      const [c] = await tx`select count(*)::int as n from notifications where user_id = auth.uid() and read_at is null`;
      return {
        unread: c!.n as number, more: rows.length > limit,
        items: rows.slice(0, limit).map((x) => ({ id: x.id, event: x.event, icon: x.icon, title: x.title, body: x.body, link: x.link, createdAt: x.created_at, read: x.read_at != null })),
      };
    });
  });
  r.post("/notifications/:id/read", { preHandler: requireAuth, schema: { params: z.object({ id: uuid }) } }, async (req, reply) => {
    const { user, meta } = mine(req);
    const got = await asUser(user, meta, (tx) => tx`update notifications set read_at = coalesce(read_at, now()) where id = ${req.params.id} and user_id = auth.uid() returning id`);
    return got.length ? { ok: true } : fail(reply, 404, "not_found", "This notification was not found.");
  });
  r.post("/notifications/read-all", { preHandler: requireAuth }, async (req) => {
    const { user, meta } = mine(req);
    const n = await asUser(user, meta, (tx) => tx`update notifications set read_at = now() where user_id = auth.uid() and read_at is null returning id`);
    return { ok: true, n: n.length };
  });
}

/** One pass of the deadline timer. Returns how many notifications it wrote. */
export async function deadlineSweep(): Promise<number> {
  return system({ requestId: "deadline-timer", screen: SCREEN }, async (tx) => {
    const [lock] = await tx`select pg_try_advisory_xact_lock(7440901) as ok`;
    if (!lock?.ok) return 0;
    const today = todayIso(), tomorrow = todayIso(1);
    const batches = await tx`select batch_no, status::text as status, deadline_on::text as deadline from batches where status <> 'completed' and deadline_on is not null and deadline_on <= ${tomorrow}::date`;
    // notifications are kept 90 days, then removed (App plan open point 7)
    await tx`delete from notifications where created_at < now() - interval '90 days'`;
    let sent = 0;
    for (const b of batches) {
      const no = b.batch_no as string, status = b.status as string, due = b.deadline as string;
      const tab = status === "created" ? "reception" : status === "preparation" || status === "prep_finished" ? "preparation" : "analysis";
      const link = `/batches/${no}/${tab}`;
      if (due < today) {
        sent += await notify(tx, { event: "N8", title: `${no} is past its deadline`, body: `It was due on ${new Date(due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} and is still ${status.replace("_", " ")}.`, link }, { roles: ["supervisor", "manager"] }, null, true);
      } else {
        const roles = status === "created" || status === "preparation" ? ["prep"] : status === "prep_finished" || status === "analysis" ? ["analyst"] : ["lab_admin"];
        sent += await notify(tx, { event: "N7", title: `${no} is due ${due === today ? "today" : "tomorrow"}`, body: `It is still ${status.replace("_", " ")}.`, link }, { roles }, null, true);
      }
    }
    return sent;
  });
}
export function startDeadlineTimer(log: { info: (o: unknown, m?: string) => void; error: (e: unknown) => void }) {
  const run = () => deadlineSweep().then((n) => n && log.info({ sent: n }, "deadline notifications")).catch((e) => log.error(e));
  void run();
  return setInterval(run, 15 * 60_000).unref();
}
