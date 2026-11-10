// Session routes (spec 14.2, Session). Sign-in passes through here so failed attempts can be counted per account and the
// account locked (App screens: Sign in, Locked; Configuration, Security). Supabase Auth checks the password itself.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ForgotBody, SetPasswordBody, SignInBody, passwordProblem, type Me } from "@sgsi/shared";
import { admin, authClient } from "../supabase";
import { asUser, getSetting, sql, system } from "../db";
import { authenticate, forgetToken } from "../auth";
import { env } from "../env";

interface Security { lock_after_attempts: number; lock_minutes: number; idle_sign_out_minutes: number; warn_before_seconds: number;
  min_password_length: number; require_letter_and_number: boolean; require_special_character: boolean; forbid_email_in_password: boolean }

const session = (s: { access_token: string; refresh_token: string; expires_at?: number | undefined }) =>
  ({ accessToken: s.access_token, refreshToken: s.refresh_token, expiresAt: s.expires_at ?? null });

export async function sessionRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post("/auth/sign-in", { schema: { body: SignInBody }, config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const { email, password } = req.body;
    const sec = await getSetting<Security>("security");
    const meta = { requestId: req.id, screen: "Sign in" };
    const [p] = await sql`select id, status, failed_attempts, locked_until from profiles where email = ${email}`;
    const tz = env.LAB_TIMEZONE;
    const lockedText = (until: Date) => `Try again at ${until.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz })}, or reset your password.`;
    if (p?.locked_until && new Date(p.locked_until) > new Date())
      return reply.code(423).send({ code: "locked", title: "Too many failed attempts", text: lockedText(new Date(p.locked_until)) });
    if (p && (p.status === "inactive" || p.status === "invited"))
      return reply.code(403).send({ code: "account_inactive", title: "This account cannot sign in", text: p.status === "invited" ? "Open the invite email to set your password first." : "Ask your lab admin to reactivate it." });

    const { data, error } = await authClient().auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      if (p) {
        const n = (p.failed_attempts ?? 0) + 1;
        const lock = n >= sec.lock_after_attempts ? new Date(Date.now() + sec.lock_minutes * 60_000) : null;
        await system(meta, (tx) => tx`update profiles set failed_attempts = ${lock ? 0 : n}, locked_until = ${lock}, status = ${lock ? "locked" : p.status} where id = ${p.id}`);
        if (lock) return reply.code(423).send({ code: "locked", title: "Too many failed attempts", text: lockedText(lock) });
      }
      return reply.code(401).send({ code: "wrong_credentials", title: "The email or password is not correct.", text: "Check both and try again." });
    }
    await system(meta, (tx) => tx`update profiles set failed_attempts = 0, locked_until = null, last_sign_in_at = now(),
                                   status = case when status = 'locked' then 'active' else status end where id = ${data.user.id}`);
    return session(data.session);
  });

  r.post("/auth/refresh", { schema: { body: z.object({ refreshToken: z.string().min(10) }) } }, async (req, reply) => {
    const { data, error } = await authClient().auth.refreshSession({ refresh_token: req.body.refreshToken });
    if (error || !data.session) return reply.code(401).send({ code: "session_expired", text: "Your session has ended. Sign in again." });
    return session(data.session);
  });

  r.post("/auth/forgot", { schema: { body: ForgotBody }, config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
    // Always the same answer, so the form does not reveal which emails have accounts.
    await authClient().auth.resetPasswordForEmail(req.body.email, { redirectTo: `${env.WEB_ORIGIN}/set-password` });
    return reply.code(204).send();
  });

  r.post("/auth/set-password", { schema: { body: SetPasswordBody }, preHandler: authenticate }, async (req, reply) => {
    const sec = await getSetting<Security>("security");
    const problem = passwordProblem(req.body.password, sec, req.user!.email);
    if (problem) return reply.code(422).send({ code: "weak_password", field: "password", text: problem });
    const { error } = await admin.auth.admin.updateUserById(req.user!.userId, { password: req.body.password });
    if (error) return reply.code(422).send({ code: "weak_password", field: "password", text: error.message });
    await system({ requestId: req.id, screen: "Set password" }, (tx) =>
      tx`update profiles set status = 'active', failed_attempts = 0, locked_until = null where id = ${req.user!.userId} and status in ('invited','locked','active')`);
    return reply.code(204).send();
  });

  r.post("/auth/sign-out", { preHandler: authenticate }, async (req, reply) => {
    const token = req.headers.authorization!.slice(7);
    forgetToken(token);
    await admin.auth.admin.signOut(token).catch(() => undefined);
    return reply.code(204).send();
  });

  r.get("/me", { preHandler: authenticate }, async (req): Promise<Me> => {
    const sec = await getSetting<Security>("security");
    const tz = await getSetting<string>("timezone");
    return asUser(req.user!, { requestId: req.id }, async (tx) => {
      const [p] = await tx`select id, email, full_name, title, prefs from profiles where id = auth.uid()`;
      const roles = await tx`select r.code from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = auth.uid() order by r.sort_order`;
      const [n] = await tx`select count(*)::int as unread from notifications where user_id = auth.uid() and read_at is null`;
      return { id: p!.id, email: p!.email, fullName: p!.full_name, title: p!.title, roles: roles.map((x) => x.code as string),
        permissions: req.user!.permissions, prefs: p!.prefs ?? {}, unread: n!.unread,
        settings: { timezone: tz ?? env.LAB_TIMEZONE, idleSignOutMinutes: sec.idle_sign_out_minutes, warnBeforeSeconds: sec.warn_before_seconds } };
    });
  });

  r.patch("/me", { preHandler: authenticate, schema: { body: z.object({ fullName: z.string().trim().min(2).optional(), prefs: z.record(z.unknown()).optional() }) } }, async (req, reply) => {
    await asUser(req.user!, { requestId: req.id, screen: "Profile" }, (tx) =>
      tx`update profiles set full_name = coalesce(${req.body.fullName ?? null}, full_name),
                             prefs = prefs || ${sql.json((req.body.prefs ?? {}) as never)} where id = auth.uid()`);
    return reply.code(204).send();
  });

  r.get("/auth/rules", async () => {
    const sec = await getSetting<Security>("security");
    return { minPasswordLength: sec.min_password_length, requireLetterAndNumber: sec.require_letter_and_number, requireSpecialCharacter: sec.require_special_character };
  });
}
