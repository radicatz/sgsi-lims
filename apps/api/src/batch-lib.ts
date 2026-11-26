// Shared parts of the batch routes (Batch_Build_Design.md sections 4, 7 and 8): the answer helpers, the status shown to people, the identifier
// patterns, the log row and the notifications.
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { asUser, system, type Tx } from "./db";

export const SCREEN = "Batches";
export const TZ = "Asia/Makassar";
export const uuid = z.string().uuid();
export const NoParam = z.object({ no: z.string().max(40) });
export const NoId = z.object({ no: z.string().max(40), id: uuid });
export const BATCH_RE = /^B-\d{4}-\d{4}$/;
export const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string, extra?: Record<string, unknown>) =>
  reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}), ...(extra ?? {}) });

type Req = { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string };
/** Run as the signed-in user (row-level security applies) under the screen "Batches". */
export const runAs = <T>(req: Req, fn: (tx: Tx) => Promise<T>) => asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
/** Run with the API's own connection, but stamped with the signed-in account, for steps a role may cause without owning the table (the job order's status, other people's notifications). */
export const runAsActor = <T>(req: Req, screen: string, fn: (tx: Tx) => Promise<T>) =>
  system({ requestId: req.id, screen }, async (tx) => {
    await tx`select set_config('request.jwt.claim.sub', ${req.user!.userId}, true)`;
    return fn(tx);
  });

/** The status people see: a batch that is Created with at least one sample ticked Arrived is Receiving (derived, not stored). */
export const shownStatus = (tx: Tx, alias = "b") => tx`case when ${tx(alias)}.status = 'created' and exists (select 1 from samples sx where sx.batch_id = ${tx(alias)}.id and sx.arrived_at is not null) then 'receiving' else ${tx(alias)}.status::text end`;

export const STATUS_WORD: Record<string, string> = {
  created: "Created", receiving: "Receiving", preparation: "Preparation", prep_finished: "Prep finished", analysis: "Analysis", analysis_finished: "Analysis finished", completed: "Completed",
};
export const dayText = (iso: string | Date) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ });
/** Today in the lab's time zone as yyyy-mm-dd. */
export const todayIso = (plus = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(Date.now() + plus * 86_400_000));

/** One row of the batch log (every step writes one, in the same transaction as the change). */
export const logStep = (tx: Tx, batchId: string, from: string | null, to: string, action: string, note: string | null, by: string) =>
  tx`insert into batch_status_log (batch_id, from_status, to_status, action, note, by_user) values (${batchId}, ${from}::batch_status, ${to}::batch_status, ${action}, ${note}, ${by})`;

/** The next batch number from the numbering pattern (Configuration > Laboratory): the highest of the year plus one. */
export async function nextBatchNo(tx: Tx): Promise<string> {
  const [s] = await tx`select value->>'batch' as p from app_settings where key = 'numbering'`;
  const pattern: string = s?.p && /\{N+\}/.test(s.p) ? s.p : "B-{YYYY}-{NNNN}";
  const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric" }).format(new Date()));
  const width = pattern.match(/\{(N+)\}/)![1]!.length;
  const lit = (t: string) => t.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
  const fill = (t: string) => t.replace(/\{YYYY\}/g, String(year)).replace(/\{YY\}/g, String(year).slice(2));
  const [head, tail] = pattern.split(/\{N+\}/) as [string, string];
  const re = `^${lit(fill(head))}([0-9]+)${lit(fill(tail ?? ""))}$`;
  const [m] = await tx`select max((regexp_match(batch_no, ${re}))[1]::int) as n from batches`;
  return `${fill(head)}${String((m?.n ?? 0) + 1).padStart(width, "0")}${fill(tail ?? "")}`;
}

/** Fill the Sample ID or sample code pattern (spec 6.1): {YYMMDD} {CCC} {BB} {NNN} {LOT}. */
export function fillPattern(pattern: string, v: { day: string; company: string; branch: string; n: number; width: number; lot: string }): string {
  const [y, m, d] = v.day.split("-");
  return pattern.replace(/\{YYMMDD\}/g, `${y!.slice(2)}${m}${d}`).replace(/\{CCC\}/g, v.company).replace(/\{BB\}/g, v.branch)
    .replace(/\{NNN\}/g, String(v.n).padStart(v.width, "0")).replace(/\{LOT\}/g, v.lot);
}
export async function idPatterns(tx: Tx): Promise<{ sampleId: string; sampleCode: string; width: number }> {
  const [s] = await tx`select value from app_settings where key = 'numbering'`;
  const v = (s?.value ?? {}) as { sample_id?: string; sample_code?: string; sample_no_width?: number };
  return { sampleId: v.sample_id ?? "SG.{YYMMDD}.{CCC}.{BB}.{NNN}", sampleCode: v.sample_code ?? "{CCC}.{BB}.{NNN}.{LOT}", width: v.sample_no_width ?? 3 };
}
/** "2" and "02" and "Lot02" all mean Lot02. */
export const normLot = (t: string): string | null => { const m = t.trim().match(/^(?:lot)?\s*(\d{1,2})$/i); return m ? `Lot${m[1]!.padStart(2, "0")}` : null; };

/* ---------- notifications (App plan 5.1): written by the API after the permission check, because a user may only read their own ---------- */
export const EVENTS = {
  N1: { icon: "package" }, N2: { icon: "warning-circle" }, N3: { icon: "flask" }, N4: { icon: "upload-simple" }, N5: { icon: "certificate" }, N6: { icon: "paper-plane-tilt" }, N7: { icon: "alarm" }, N8: { icon: "alarm" },
  N9: { icon: "pencil-simple-line" }, N10: { icon: "arrow-u-up-left" },   // phase 4: a CoA waits for a signature, a signatory returned it (App_Screen_Plan.md 18.1)
} as const;
export interface Note { event: keyof typeof EVENTS; title: string; body: string; link: string }
/** One notification for every active user holding one of the roles (or the given people), except the person who did the action. */
export async function notify(tx: Tx, n: Note, to: { roles?: string[]; users?: string[] }, actor: string | null, once = false): Promise<number> {
  const rows = await tx`insert into notifications (user_id, event, icon, title, body, link)
    select distinct p.id, ${n.event}, ${EVENTS[n.event].icon}, ${n.title}, ${n.body}, ${n.link}
    from profiles p left join user_roles ur on ur.user_id = p.id left join roles r on r.id = ur.role_id
    where p.status = 'active' and (r.code = any(${to.roles ?? []}::text[]) or p.id = any(${to.users ?? []}::uuid[]))
      and coalesce(p.prefs->'notifications'->>${n.event}, 'true') <> 'false'      -- a person who turned this event off on the Profile (App plan 6)
      ${actor ? tx`and p.id <> ${actor}` : tx``}
      ${once ? tx`and not exists (select 1 from notifications x where x.user_id = p.id and x.event = ${n.event} and x.link = ${n.link})` : tx``}
    returning id`;
  return rows.length;
}
