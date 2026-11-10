// User routes (Admin screen plan, module 13; spec 14.2). All of them need user.manage. Accounts live in Supabase Auth; the
// profile and the roles live in our tables. Invites and resets give back the link, because mail delivery (SMTP) is set up
// at the end of the phase; once it is, the same link goes out by email and the screen still shows it to the admin.
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { asUser, type Tx } from "../db";
import { authenticate, forgetUser, requireAny } from "../auth";
import { admin } from "../supabase";
import { env } from "../env";

const Id = z.object({ id: z.string().uuid() });
const ROLE_CODES = ["superadmin", "lab_admin", "supervisor", "manager", "cso", "prep", "analyst"] as const;
const Roles = z.array(z.enum(ROLE_CODES)).min(1, "Pick at least one role.");
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const UserBody = z.object({ fullName: z.string().trim().min(2, "Enter the name.").max(120), title: optText(120), phone: optText(40), roles: Roles });
const NewUserBody = UserBody.extend({ email: z.string().trim().toLowerCase().email("Enter a valid email.") });

const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string) => reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}) });
const link = (type: "invite" | "recovery", email: string) => admin.auth.admin.generateLink({ type, email, options: { redirectTo: `${env.WEB_ORIGIN}/set-password` } } as never);

export async function userRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  r.addHook("preHandler", requireAny("user.manage"));
  const run = <T>(req: { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string }, screen: string, fn: (tx: Tx) => Promise<T>) =>
    asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen }, fn);

  const userRows = (tx: Tx, where: ReturnType<Tx>) => tx`
    select p.id, p.email, p.full_name, p.title, p.phone, p.status, p.locked_until, p.failed_attempts, p.invited_at, p.invite_expires_at, p.last_sign_in_at, p.created_at,
      coalesce((select array_agg(r.code order by r.sort_order) from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = p.id), '{}') as roles
    from profiles p ${where} order by p.full_name`;
  const shape = (u: Record<string, unknown>) => {
    const lockedNow = u.status === "locked" || (u.locked_until && new Date(u.locked_until as string) > new Date());
    return { id: u.id, email: u.email, fullName: u.full_name, title: u.title, phone: u.phone, roles: u.roles as string[], status: lockedNow ? "locked" : u.status,
      lockedUntil: u.locked_until, failedAttempts: u.failed_attempts, invitedAt: u.invited_at, inviteExpiresAt: u.invite_expires_at, lastSignInAt: u.last_sign_in_at, createdAt: u.created_at };
  };
  /** The only active Superadmin may not be deactivated or lose the role. */
  const lastSuperadmin = async (tx: Tx, id: string) => {
    const rows = await tx`select p.id from profiles p join user_roles ur on ur.user_id = p.id join roles r on r.id = ur.role_id where r.code = 'superadmin' and p.status = 'active'`;
    return rows.length === 1 && rows[0]!.id === id;
  };
  const LAST = "There must be at least one active Superadmin.";

  r.get("/users", async (req) => ({ items: (await run(req, "Users", (tx) => userRows(tx, tx``))).map(shape) }));

  /* the permission grid for the Roles tab */
  r.get("/roles", async (req) => run(req, "Users", async (tx) => {
    const roles = await tx`select r.id, r.code, r.name, r.description from roles r where r.code <> 'client' order by r.sort_order`;
    const perms = await tx`select code, description from permissions order by code`;
    const grid = await tx`select r.code as role, rp.permission_code as perm from role_permissions rp join roles r on r.id = rp.role_id where r.code <> 'client'`;
    return { roles: roles.map((x) => ({ code: x.code, name: x.name, description: x.description })), permissions: perms.map((x) => ({ code: x.code, description: x.description })),
      grid: grid.map((g) => `${g.role}:${g.perm}`) };
  }));

  r.get("/users/:id", { schema: { params: Id } }, async (req, reply) => {
    const out = await run(req, "User page", async (tx) => {
      const [u] = await userRows(tx, tx`where p.id = ${req.params.id}`);
      if (!u) return null;
      const activity = await tx`select action, table_name, record_label, screen, at from audit_log where actor = ${req.params.id} order by at desc limit 5`;
      const perms = await tx`select distinct rp.permission_code as code from user_roles ur join role_permissions rp on rp.role_id = ur.role_id where ur.user_id = ${req.params.id} order by 1`;
      return { u, activity, perms };
    });
    if (!out) return fail(reply, 404, "not_found", "This user was not found.");
    return { ...shape(out.u), permissions: out.perms.map((x) => x.code as string),
      activity: out.activity.map((a) => ({ action: a.action, table: a.table_name, label: a.record_label, screen: a.screen, at: a.at })) };
  });

  r.post("/users", { schema: { body: NewUserBody } }, async (req, reply) => {
    const b = req.body;
    const [dup] = await run(req, "Users", (tx) => tx`select id from profiles where email = ${b.email}`);
    if (dup) return fail(reply, 409, "duplicate", `${b.email} already has an account.`, "email");
    const made = await link("invite", b.email);
    if (made.error || !made.data?.user) return fail(reply, 409, "duplicate", made.error?.message.includes("registered") ? `${b.email} already has an account.` : "The invite could not be created. Check the email address.", "email");
    const id = made.data.user.id;
    try {
      await run(req, "Users", async (tx) => {
        await tx`insert into profiles (id, email, full_name, title, phone, status, invited_at, invite_expires_at) values (${id}, ${b.email}, ${b.fullName}, ${b.title}, ${b.phone}, 'invited', now(), now() + interval '7 days')`;
        await tx`insert into user_roles (user_id, role_id) select ${id}, id from roles where code = any(${b.roles})`;
      });
    } catch (e) { await admin.auth.admin.deleteUser(id); throw e; }
    return reply.code(201).send({ id, inviteLink: made.data.properties?.action_link ?? null, emailed: false });
  });

  r.patch("/users/:id", { schema: { params: Id, body: UserBody } }, async (req, reply) => {
    const b = req.body;
    const res = await run(req, "User page", async (tx) => {
      const [u] = await tx`select id from profiles where id = ${req.params.id}`;
      if (!u) return "missing" as const;
      if (!b.roles.includes("superadmin") && (await lastSuperadmin(tx, req.params.id))) return "last" as const;
      await tx`update profiles set full_name = ${b.fullName}, title = ${b.title}, phone = ${b.phone} where id = ${req.params.id}`;
      await tx`delete from user_roles where user_id = ${req.params.id}`;
      await tx`insert into user_roles (user_id, role_id) select ${req.params.id}, id from roles where code = any(${b.roles})`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This user was not found.");
    if (res === "last") return fail(reply, 409, "last_superadmin", LAST, "roles");
    forgetUser(req.params.id);
    return { ok: true };
  });

  r.post("/users/:id/deactivate", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, "User page", async (tx) => {
      if (await lastSuperadmin(tx, req.params.id)) return "last" as const;
      const rows = await tx`update profiles set status = 'inactive' where id = ${req.params.id} returning id`;
      return rows.length ? "ok" as const : "missing" as const;
    });
    if (res === "last") return fail(reply, 409, "last_superadmin", LAST);
    if (res === "missing") return fail(reply, 404, "not_found", "This user was not found.");
    forgetUser(req.params.id);
    return { ok: true };
  });
  r.post("/users/:id/reactivate", { schema: { params: Id } }, async (req, reply) => {
    const rows = await run(req, "User page", (tx) => tx`update profiles set status = case when last_sign_in_at is null then 'invited' else 'active' end, failed_attempts = 0, locked_until = null
      where id = ${req.params.id} and status = 'inactive' returning id`);
    forgetUser(req.params.id);
    return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This user is not deactivated.");
  });
  r.post("/users/:id/unlock", { schema: { params: Id } }, async (req, reply) => {
    const rows = await run(req, "User page", (tx) => tx`update profiles set status = 'active', failed_attempts = 0, locked_until = null where id = ${req.params.id} and (status = 'locked' or locked_until is not null) returning id`);
    return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This user is not locked.");
  });

  /* password reset for an active user, and a fresh invite link for an invited one */
  for (const [path, invited] of [["reset", false], ["resend-invite", true]] as const) {
    r.post(`/users/:id/${path}`, { schema: { params: Id } }, async (req, reply) => {
      const [u] = await run(req, "User page", (tx) => tx`select email, status from profiles where id = ${req.params.id}`);
      if (!u) return fail(reply, 404, "not_found", "This user was not found.");
      if (invited !== (u.status === "invited")) return fail(reply, 409, "wrong_state", invited ? "This user has already accepted the invite." : "This user has not accepted the invite yet. Resend the invite instead.");
      const made = await link("recovery", u.email as string);
      if (made.error) throw made.error;
      if (invited) await run(req, "User page", (tx) => tx`update profiles set invited_at = now(), invite_expires_at = now() + interval '7 days' where id = ${req.params.id}`);
      return { link: made.data.properties?.action_link ?? null, emailed: false };
    });
  }
}
