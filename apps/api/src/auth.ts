// Request authentication: a Supabase access token in `Authorization: Bearer`, verified, then checked against the
// profile (status active). Routes declare the permission they need; the database checks it again through RLS.
import type { FastifyReply, FastifyRequest } from "fastify";
import { authClient } from "./supabase";
import { sql, type Caller } from "./db";

export interface AuthedUser extends Caller { email: string; permissions: string[] }
declare module "fastify" { interface FastifyRequest { user?: AuthedUser } }

const verifier = authClient();
const cache = new Map<string, { user: AuthedUser; until: number }>();   // short cache: permissions change rarely, tokens live 1 h

async function resolveUser(req: FastifyRequest, reply: FastifyReply, allowed: string[], useCache: boolean) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return reply.code(401).send({ code: "unauthenticated", text: "Sign in to continue." });
  const token = h.slice(7);
  const hit = useCache ? cache.get(token) : undefined;
  if (hit && hit.until > Date.now()) { req.user = hit.user; return; }
  let claims: Record<string, unknown> | undefined;
  try {
    const { data, error } = await verifier.auth.getClaims(token);
    claims = error ? undefined : (data?.claims as Record<string, unknown> | undefined);
  } catch { claims = undefined; }                     // malformed tokens throw while decoding
  if (!claims?.sub) return reply.code(401).send({ code: "session_expired", text: "Your session has ended. Sign in again." });
  const userId = String(claims.sub);
  const [p] = await sql`select email, status, (select coalesce(array_agg(distinct rp.permission_code), '{}') from user_roles ur
                         join role_permissions rp on rp.role_id = ur.role_id where ur.user_id = profiles.id) as permissions
                        from profiles where id = ${userId}`;
  if (!p || !allowed.includes(p.status)) return reply.code(403).send({ code: "account_inactive", text: "This account cannot sign in. Ask your lab admin." });
  const user: AuthedUser = { userId, claims, email: p.email, permissions: p.permissions };
  if (useCache) cache.set(token, { user, until: Date.now() + 60_000 });
  req.user = user;
}

/** Signed-in, active accounts only. */
export const authenticate = (req: FastifyRequest, reply: FastifyReply) => resolveUser(req, reply, ["active"], true);
/** For choosing a password: an invited or locked account holds a valid link session but cannot work yet. Never cached. */
export const authenticateForPassword = (req: FastifyRequest, reply: FastifyReply) => resolveUser(req, reply, ["invited", "active", "locked"], false);
/** Drop cached permissions for a user (after a role change or a deactivation) so the change takes effect at once. */
export const forgetUser = (userId: string) => { for (const [t, v] of cache) if (v.user.userId === userId) cache.delete(t); };

/** Route guard: 403 unless the user holds one of the permissions. */
export const requireAny = (...perms: string[]) => async (req: FastifyRequest, reply: FastifyReply) => {
  if (!req.user) return reply.code(401).send({ code: "unauthenticated", text: "Sign in to continue." });
  if (!perms.some((p) => req.user!.permissions.includes(p))) return reply.code(403).send({ code: "forbidden", text: "Your role doesn't include this action." });
};

export const forgetToken = (token: string) => cache.delete(token);
