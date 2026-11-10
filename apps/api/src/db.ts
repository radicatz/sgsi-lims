// Database access. Every request runs as the signed-in user (Stack_Decision_Record S-6): inside one transaction the
// role becomes `authenticated` and the JWT claims are set, so row-level security and auth.uid() apply exactly as they
// would for that user. `system` is only for steps that must run before a user exists (sign-in counters, seeding).
import postgres from "postgres";
import { env } from "./env";

export const sql = postgres(env.DATABASE_URL, {
  prepare: false,          // required by the Supabase transaction pooler
  max: 10,
  idle_timeout: 20,
  types: { numeric: { to: 1700, from: [1700], serialize: (v: unknown) => String(v), parse: (v: string) => v } }, // keep numerics exact (strings)
});

export type Tx = postgres.TransactionSql;
export interface Caller { userId: string; claims: Record<string, unknown> }
export interface RequestMeta { requestId: string; screen?: string | undefined }

/** Run `fn` in one transaction as the caller, with the audit metadata (screen, request id) set. */
export async function asUser<T>(caller: Caller, meta: RequestMeta, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe("set local role authenticated");
    await tx`select set_config('request.jwt.claims', ${JSON.stringify(caller.claims)}, true),
                    set_config('request.jwt.claim.sub', ${caller.userId}, true),
                    set_config('app.request_id', ${meta.requestId}, true),
                    set_config('app.screen', ${meta.screen ?? ""}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

/** Privileged access, bypassing row-level security. Use only where no signed-in user exists yet. */
export async function system<T>(meta: RequestMeta, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('app.request_id', ${meta.requestId}, true), set_config('app.screen', ${meta.screen ?? ""}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

export async function getSetting<T>(key: string): Promise<T> {
  const [row] = await sql`select value from app_settings where key = ${key}`;
  return row?.value as T;
}
