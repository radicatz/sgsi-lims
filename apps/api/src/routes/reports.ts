// Reports, slice A (Reports_Build_Design.md sections 4, 5 and 7; frames module 07 and 03-05): generate a CoA from a job order whose batches are all
// completed, fill the draft, send it for signature, and let the named signatory sign and publish it. The signatory is the signed-in user named on the
// certificate and nobody else (section 7.1); delegating means changing the signatory. Reads run as the user (row-level security applies); the steps a
// role may cause without owning the table (signing, the job order's status, other people's notifications) run through runAsActor after the checks.
import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { BASIS_ORDER, fmtDate, verifyCodeOf } from "@sgsi/shared";
import { authenticate, requireAny } from "../auth";
import { asUser, getSetting, sql, system, type Tx } from "../db";
import { admin, authClient } from "../supabase";
import { NoParam, fail, notify, runAsActor, todayIso, uuid } from "../batch-lib";
import { buildPayload, leftOut, orderedParameters, signingImages, type ReportRow } from "../certificate-data";
import { PdfUnavailable, certAssets, renderPdf } from "../pdf";

const SCREEN = "Reports";
const IdParam = z.object({ id: uuid });
const BUCKET = "reports";
const ALL_BASES = [...BASIS_ORDER] as string[];

const PatchBody = z.object({
  bases: z.array(z.enum(["adb", "db", "daf", "ar"])).max(4).optional(),
  parameterIds: z.array(uuid).max(100).optional(),
  attentionContactId: uuid.nullable().optional(),
  clientReference: z.string().trim().max(80).nullable().optional(),
  remarks: z.string().trim().max(1000).nullable().optional(),
  signatoryId: uuid.nullable().optional(),
  onBehalfOf: z.string().trim().max(80).nullable().optional(),
});
const SignBody = z.object({ password: z.string().min(1).max(200) });
const ReturnBody = z.object({ comment: z.string().trim().min(1, "Write what to change.").max(1000) });
const SignatoryBody = z.object({ signatoryId: uuid });

type R = { user?: { userId: string; claims: Record<string, unknown>; permissions: string[]; email: string } | undefined; id: string };

export async function reportRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const as = <T>(req: R, fn: (tx: Tx) => Promise<T>) => asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const uid = (req: R) => req.user!.userId;
  const can = (req: R, p: string) => !!req.user?.permissions.includes(p);

  /* ---------- helpers ---------- */
  /** People who can sign (report.sign, active), the Manager first. */
  const signers = (tx: Tx) => tx`select p.id, p.full_name as name,
      coalesce(p.title, case when exists (select 1 from user_roles u2 join roles r2 on r2.id = u2.role_id where u2.user_id = p.id and r2.code = 'manager') then 'Laboratory Manager' end, '') as title,
      exists (select 1 from user_roles u2 join roles r2 on r2.id = u2.role_id where u2.user_id = p.id and r2.code = 'manager') as is_manager
    from profiles p where p.status = 'active' and exists (select 1 from user_roles ur join role_permissions rp on rp.role_id = ur.role_id where ur.user_id = p.id and rp.permission_code = 'report.sign')
    order by is_manager desc, p.full_name`;
  const mayBeSignatory = async (tx: Tx, id: string) => (await signers(tx)).some((s) => s.id === id);
  const reportOf = async (tx: Tx, id: string, lock = false): Promise<(ReportRow & { order_no: string; company_id: string; sent_for_signature_by: string | null; sent_for_signature_at: Date | null; page_count: number | null; storage_path: string | null; kind: string }) | undefined> => {
    const q = lock
      ? tx`select r.*, j.order_no, j.company_id from reports r join job_orders j on j.id = r.job_order_id where r.id = ${id} for update of r`
      : tx`select r.*, j.order_no, j.company_id from reports r join job_orders j on j.id = r.job_order_id where r.id = ${id}`;
    return (await q)[0] as never;
  };
  const noteAll = async (req: R, fn: (tx: Tx) => Promise<unknown>) => { try { await runAsActor(req, SCREEN, fn); } catch (e) { (req as unknown as { log: { error: (e: unknown) => void } }).log.error(e); } };
  /** Check the signed-in user's password again for a signature. Failures count towards the sign-in lock. */
  async function checkPassword(req: R, password: string): Promise<{ code: number; key: string; text: string } | null> {
    const sec = await getSetting<{ lock_after_attempts: number; lock_minutes: number }>("security");
    const [p] = await sql`select failed_attempts, locked_until, status from profiles where id = ${uid(req)}`;
    if (p?.locked_until && new Date(p.locked_until) > new Date()) return { code: 423, key: "locked", text: "Too many failed attempts. Try again later, or reset your password." };
    const { data, error } = await authClient().auth.signInWithPassword({ email: req.user!.email, password });
    if (error || !data.session) {
      const n = ((p?.failed_attempts as number | undefined) ?? 0) + 1, lock = n >= sec.lock_after_attempts ? new Date(Date.now() + sec.lock_minutes * 60_000) : null;
      await system({ requestId: req.id, screen: SCREEN }, (tx) => tx`update profiles set failed_attempts = ${lock ? 0 : n}, locked_until = ${lock}, status = ${lock ? "locked" : (p?.status ?? "active")} where id = ${uid(req)}`);
      return lock ? { code: 423, key: "locked", text: "Too many failed attempts. Try again later, or reset your password." } : { code: 422, key: "wrong_password", text: "The password is not correct." };
    }
    await system({ requestId: req.id, screen: SCREEN }, (tx) => tx`update profiles set failed_attempts = 0, locked_until = null where id = ${uid(req)}`);
    return null;
  }
  const pdfError = (reply: Parameters<typeof fail>[0], e: unknown) => (e instanceof PdfUnavailable ? fail(reply, 503, "pdf_unavailable", e.message + " Try again in a moment.") : (() => { throw e; })());

  /* ================= the job order's CoA card ================= */
  r.get("/orders/:no/coa", { preHandler: requireAny("order.read"), schema: { params: NoParam } }, async (req, reply) => {
    const res = await runAsActor(req, SCREEN, async (tx) => {
      const [j] = await tx`select id, order_no, status::text as status from job_orders where order_no = ${req.params.no}`;
      if (!j) return null;
      const [n] = await tx`select count(*)::int as total, count(*) filter (where status = 'completed')::int as done from batches where job_order_id = ${j.id}`;
      const reps = await tx`select r.id, r.revision, r.status::text as status, r.report_no, r.sent_for_signature_at, r.signed_at, r.issued_at, r.signatory_id,
          (select full_name from profiles where id = r.signatory_id) as signatory_name, (select title from profiles where id = r.signatory_id) as signatory_title,
          (select full_name from profiles where id = r.signed_by) as signed_by_name, (select full_name from profiles where id = r.sent_for_signature_by) as sent_by_name,
          (select full_name from profiles where id = r.drafted_by) as drafted_by_name, r.created_at, r.page_count,
          (select count(*)::int from report_deliveries d where d.report_id = r.id) as sends
        from reports r where r.job_order_id = ${j.id} and r.kind = 'coa' and r.status <> 'void' order by r.revision desc`;
      const cur = reps.find((x) => x.status === "issued"), open = reps.find((x) => x.status === "draft" || x.status === "awaiting_signature");
      const sees = can(req, "report.publish") || can(req, "coa.download");
      const state = cur ? (cur.sends > 0 ? "sent" : "published")
        : open ? (open.status === "awaiting_signature" ? "awaiting_signature" : can(req, "report.publish") ? "draft" : "preparing")
        : n!.total > 0 && n!.done === n!.total ? "ready" : "not_ready";
      const fmt = (x: Record<string, unknown> | undefined) => (x ? {
        id: x.id, number: x.report_no, revision: x.revision, status: x.status, signatory: x.signatory_name ? { name: x.signatory_name, title: x.signatory_title ?? "" } : null,
        signedBy: x.signed_by_name ?? null, signedAt: x.signed_at, publishedAt: x.issued_at, sentForSignatureAt: x.sent_for_signature_at, sentBy: x.sent_by_name ?? null, draftedBy: x.drafted_by_name ?? null, createdAt: x.created_at, pages: x.page_count,
      } : null);
      const mine = !!open && open.signatory_id === uid(req);
      return {
        state, orderNo: j.order_no, orderStatus: j.status, batches: { total: n!.total, done: n!.done },
        current: sees ? fmt(cur) : null,
        open: sees && open && (can(req, "report.publish") || mine) ? fmt(open) : null,
        sends: cur?.sends ?? 0,
        can: { generate: can(req, "report.publish"), download: can(req, "coa.download") || can(req, "report.publish"), open: can(req, "report.publish") || mine || (!!cur && sees) },
      };
    });
    return res ?? fail(reply, 404, "not_found", "This job order was not found.");
  });

  /* ================= create the draft ================= */
  r.post("/orders/:no/coa", { preHandler: requireAny("report.publish"), schema: { params: NoParam } }, async (req, reply) => {
    const res = await as(req, async (tx) => {
      const [j] = await tx`select j.id, j.order_no, j.status::text as status, j.contact_id, j.client_reference, j.signatory_id, j.company_id, c.coa_bases
        from job_orders j join companies c on c.id = j.company_id where j.order_no = ${req.params.no} for update of j`;
      if (!j) return { code: 404, key: "not_found", text: "This job order was not found." };
      if (j.status === "cancelled" || j.status === "closed") return { code: 409, key: "locked", text: `This job order is ${j.status}.` };
      const [n] = await tx`select count(*)::int as total, count(*) filter (where status = 'completed')::int as done from batches where job_order_id = ${j.id}`;
      if (!n!.total || n!.done !== n!.total) return { code: 409, key: "not_ready", text: `Every batch must be completed first (${n!.done} of ${n!.total}).` };
      const [open] = await tx`select id from reports where job_order_id = ${j.id} and kind = 'coa' and status in ('draft', 'awaiting_signature')`;
      if (open) return { code: 409, key: "exists", text: "A CoA is already being prepared for this job order.", id: open.id as string };
      const [cur] = await tx`select report_no from reports where job_order_id = ${j.id} and kind = 'coa' and status = 'issued'`;
      if (cur) return { code: 409, key: "published", text: `${cur.report_no} is already published. Revise it to change it.` };
      const [tpl] = await tx`select id from report_templates where kind = 'coa' and status = 'current' order by company_id nulls first limit 1`;
      if (!tpl) return { code: 409, key: "no_template", text: "No CoA template is active. Activate one in Configuration, Report templates." };
      // the signatory: the job order's, else the client's default, else the Manager; only people who can sign
      const who = await signers(tx);
      const [rule] = await tx`select signatory_id from signatory_rules where kind = 'coa' and active and company_id = ${j.company_id} and signatory_id is not null order by priority limit 1`;
      const pick = [j.signatory_id, rule?.signatory_id].find((id) => id && who.some((s) => s.id === id)) ?? who[0]?.id ?? null;
      const params = (await orderedParameters(tx, j.id)).map((p) => p.id as string);
      const [rev] = await tx`select coalesce(max(revision), 0) + 1 as n from reports where job_order_id = ${j.id} and kind = 'coa'`;
      const [row] = await tx`insert into reports (kind, job_order_id, revision, status, template_id, bases, parameter_ids, attention_contact_id, client_reference, signatory_id, drafted_by)
        values ('coa', ${j.id}, ${rev!.n}, 'draft', ${tpl.id}, ${(j.coa_bases as string[] | null)?.length ? j.coa_bases : ALL_BASES}::text[], ${params}::uuid[], ${j.contact_id}, ${j.client_reference}, ${pick}, ${uid(req)}) returning id`;
      return { ok: true as const, id: row!.id as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; id?: string }; return fail(reply, e.code, e.key, e.text, undefined, e.id ? { id: e.id } : undefined); }
    return reply.code(201).send({ id: res.id });
  });

  /* ================= the CoA page ================= */
  r.get("/reports/coa/:id", { schema: { params: IdParam } }, async (req, reply) => {
    if (!can(req, "coa.download") && !can(req, "report.publish")) {
      // a signatory without download rights still opens the certificate that waits for them: the read below is what row-level security allows
      if (!can(req, "report.sign")) return fail(reply, 403, "forbidden", "Your role doesn't include this action.");
    }
    const d = await as(req, async (tx) => {
      const rep = await reportOf(tx, req.params.id); if (!rep || rep.kind !== "coa") return null;
      const [x] = await tx`select r.*, j.order_no, c.name as company, c.id as company_id, c.address as company_address, j.contact_id,
          (select full_name from profiles where id = r.signatory_id) as signatory_name,
          (select coalesce(p.title, case when exists (select 1 from user_roles u2 join roles r2 on r2.id = u2.role_id where u2.user_id = p.id and r2.code = 'manager') then 'Laboratory Manager' end, '') from profiles p where p.id = r.signatory_id) as signatory_title,
          (select full_name from profiles where id = r.sent_for_signature_by) as sent_by_name, (select full_name from profiles where id = r.signed_by) as signed_by_name,
          (select full_name from profiles where id = r.returned_by) as returned_by_name, (select full_name from profiles where id = r.drafted_by) as drafted_by_name,
          (select full_name from company_contacts where id = coalesce(r.attention_contact_id, j.contact_id)) as attention_name, j.client_reference as order_reference,
          (select name from report_templates where id = r.template_id) as template_name, (select revision from report_templates where id = r.template_id) as template_rev
        from reports r join job_orders j on j.id = r.job_order_id join companies c on c.id = j.company_id where r.id = ${rep.id}`;
      const versions = await tx`select id, revision, status::text as status, report_no, issued_at, superseded_at, void_reason, revision_reason, created_at from reports where job_order_id = ${rep.job_order_id} and kind = 'coa' order by revision desc`;
      const deliveries = await tx`select d.id, d.sent_on::text as sent_on, d.channels, d.recipient, d.note, d.at, p.full_name as by from report_deliveries d left join profiles p on p.id = d.by_user where d.report_id = ${rep.id} order by d.sent_on desc, d.at desc`;
      const open = rep.status === "draft" || rep.status === "awaiting_signature";
      const ordered = open ? await orderedParameters(tx, rep.job_order_id) : [];
      const contacts = open ? await tx`select id, full_name as name from company_contacts where company_id = ${x!.company_id} and archived_at is null order by is_default desc, full_name` : [];
      const who = open ? await signers(tx) : [];
      const left = open ? await leftOut(tx, rep.job_order_id) : null;
      const reported = open ? (await tx`select count(*)::int as n from samples s join batches b on b.id = s.batch_id where b.job_order_id = ${rep.job_order_id} and b.status = 'completed' and s.received_at is not null and not s.on_hold and s.not_received_at is null`)[0]!.n as number : (x!.payload as { samples?: unknown[] } | null)?.samples?.length ?? 0;
      return { rep, x: x as Record<string, any>, versions, deliveries, ordered, contacts, who, left, reported };
    });
    if (!d) return fail(reply, 404, "not_found", "This certificate was not found.");
    const { rep, x } = d, open = rep.status === "draft" || rep.status === "awaiting_signature", mine = rep.signatory_id === uid(req);
    const chosen = new Set((rep.parameter_ids as string[]) ?? []);
    const payload = x.payload as { bases?: string[]; samples?: unknown[]; jobOrder?: { receivedOn?: string } } | null;
    const pub = can(req, "report.publish");
    const reasons = {
      send: !rep.signatory_id ? "Choose who signs it first." : !(rep.bases as string[]).length ? "Choose at least one basis." : !chosen.size ? "Keep at least one parameter." : d.reported === 0 ? "No sample is left to report." : null,
    };
    return {
      id: rep.id, number: rep.report_no, revision: rep.revision, status: rep.status, orderNo: x.order_no, company: x.company, companyId: x.company_id,
      sent: d.deliveries.length > 0, pages: rep.page_count,
      contents: {
        template: `${x.template_name ?? "House CoA template"}, version ${x.template_rev ?? 1}`, bases: (rep.bases as string[]), reported: d.reported, left: d.left,
        parameters: d.ordered.map((p) => ({ id: p.id, code: p.code, label: p.label, on: !chosen.size || chosen.has(p.id as string) })),
        attention: { id: rep.attention_contact_id ?? x.contact_id, name: x.attention_name ?? "" }, contacts: d.contacts.map((c) => ({ id: c.id, name: c.name })),
        clientReference: rep.client_reference ?? x.order_reference ?? "", remarks: rep.remarks ?? "", onBehalfOf: rep.on_behalf_of ?? "",
        signatory: rep.signatory_id ? { id: rep.signatory_id, name: x.signatory_name ?? "", title: x.signatory_title ?? "" } : null,
        signers: d.who.map((s) => ({ id: s.id, name: s.name, title: s.title })),
      },
      details: open ? null : {
        reference: payload ? (x.payload as { client: { reference: string } }).client.reference : "", attention: payload ? (x.payload as { client: { attention: string } }).client.attention : "",
        bases: (payload?.bases ?? (rep.bases as string[])).map((b) => b.toUpperCase()), parameters: chosen.size, samples: d.reported,
        publishedAt: x.issued_at, publishedBy: x.signed_by_name, signatory: { name: x.signatory_name ?? "", title: x.signatory_title ?? "", onBehalfOf: rep.on_behalf_of ?? "" },
        printed: { count: x.print_count ?? 0, last: x.last_printed_at }, verifyCode: x.verify_code,
      },
      signing: { sentBy: x.sent_by_name, sentAt: rep.sent_for_signature_at, returned: x.return_comment ? { by: x.returned_by_name, at: x.returned_at, comment: x.return_comment } : null, draftedBy: x.drafted_by_name },
      deliveries: d.deliveries.map((e) => ({ id: e.id, sentOn: e.sent_on, channels: e.channels, recipient: e.recipient, note: e.note, by: e.by })),
      versions: d.versions.map((v) => ({ id: v.id, revision: v.revision, status: v.status, number: v.report_no, at: v.issued_at ?? v.created_at, reason: v.revision_reason ?? v.void_reason ?? "", current: v.id === rep.id })),
      can: {
        edit: rep.status === "draft" && pub, send: rep.status === "draft" && pub, sendWhy: reasons.send, withdraw: rep.status === "awaiting_signature" && pub, remove: rep.status === "draft" && pub,
        sign: rep.status === "awaiting_signature" && mine && can(req, "report.sign"), return: rep.status === "awaiting_signature" && mine && can(req, "report.sign"),
        download: !open && (can(req, "coa.download") || pub), print: !open && (can(req, "coa.download") || pub), preview: true,
      },
    };
  });

  /* ================= edit the draft ================= */
  r.patch("/reports/coa/:id", { preHandler: requireAny("report.publish"), schema: { params: IdParam, body: PatchBody } }, async (req, reply) => {
    const b = req.body;
    const res = await as(req, async (tx) => {
      const rep = await reportOf(tx, req.params.id, true); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status !== "draft") return { code: 409, key: "locked", text: rep.status === "awaiting_signature" ? "It waits for a signature. Withdraw it to change it." : "A published certificate can't change. Revise it instead." };
      if (b.signatoryId && !(await mayBeSignatory(tx, b.signatoryId))) return { code: 422, key: "invalid", text: "Choose a person with signing rights.", field: "signatoryId" };
      if (b.parameterIds) {
        const ok = new Set((await orderedParameters(tx, rep.job_order_id)).map((p) => p.id as string));
        if (b.parameterIds.some((p) => !ok.has(p))) return { code: 422, key: "invalid", text: "A chosen parameter is not on this job order.", field: "parameterIds" };
      }
      const bases = b.bases ? BASIS_ORDER.filter((x) => b.bases!.includes(x)) : undefined;
      await tx`update reports set
        bases = ${bases ?? rep.bases}::text[], parameter_ids = ${b.parameterIds ?? rep.parameter_ids}::uuid[],
        attention_contact_id = ${b.attentionContactId === undefined ? rep.attention_contact_id : b.attentionContactId},
        client_reference = ${b.clientReference === undefined ? rep.client_reference : b.clientReference}, remarks = ${b.remarks === undefined ? rep.remarks : b.remarks},
        signatory_id = ${b.signatoryId === undefined ? rep.signatory_id : b.signatoryId}, on_behalf_of = ${b.onBehalfOf === undefined ? rep.on_behalf_of : (b.onBehalfOf || null)}
        where id = ${rep.id}`;
      return { ok: true as const };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return { ok: true };
  });

  r.delete("/reports/coa/:id", { preHandler: requireAny("report.publish"), schema: { params: IdParam } }, async (req, reply) => {
    const res = await as(req, async (tx) => {
      const rep = await reportOf(tx, req.params.id, true); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status !== "draft") return { code: 409, key: "locked", text: "Only a draft can be deleted." };
      await tx`delete from report_sources where report_id = ${rep.id}`; await tx`delete from reports where id = ${rep.id}`;
      return { ok: true as const, orderNo: rep.order_no };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    return { ok: true, orderNo: res.orderNo };
  });

  /* ================= send for signature, withdraw, return ================= */
  r.post("/reports/coa/:id/send", { preHandler: requireAny("report.publish"), schema: { params: IdParam } }, async (req, reply) => {
    const res = await as(req, async (tx) => {
      const rep = await reportOf(tx, req.params.id, true); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status !== "draft") return { code: 409, key: "locked", text: "It was already sent for signature." };
      if (!rep.signatory_id || !(await mayBeSignatory(tx, rep.signatory_id))) return { code: 409, key: "no_signatory", text: "Choose a person with signing rights first." };
      if (!(rep.bases as string[]).length) return { code: 409, key: "no_bases", text: "Choose at least one basis." };
      if (!(rep.parameter_ids as string[]).length) return { code: 409, key: "no_parameters", text: "Keep at least one parameter." };
      const p = await buildPayload(tx, rep, { draft: true, number: null, issuedOn: null, verifyCode: null });
      if (!p.reported) return { code: 409, key: "no_samples", text: "No sample is left to report." };
      await tx`update reports set status = 'awaiting_signature', sent_for_signature_by = ${uid(req)}, sent_for_signature_at = now(), return_comment = null, returned_by = null, returned_at = null where id = ${rep.id}`;
      const [me] = await tx`select full_name from profiles where id = ${uid(req)}`;
      return { ok: true as const, order: rep.order_no, signatory: rep.signatory_id, by: (me?.full_name as string | undefined) ?? "a colleague" };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    await noteAll(req, (tx) => notify(tx, { event: "N9", title: `CoA for ${res.order} waits for your signature`, body: `Sent by ${res.by}.`, link: `/reports/coa/${req.params.id}` }, { users: [res.signatory] }, uid(req)));
    return { ok: true };
  });

  r.post("/reports/coa/:id/withdraw", { preHandler: requireAny("report.publish"), schema: { params: IdParam } }, async (req, reply) => {
    const res = await as(req, async (tx) => {
      const rep = await reportOf(tx, req.params.id, true); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status !== "awaiting_signature") return { code: 409, key: "locked", text: "It does not wait for a signature." };
      await tx`update reports set status = 'draft', sent_for_signature_by = null, sent_for_signature_at = null where id = ${rep.id}`;
      return { ok: true as const };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    return { ok: true };
  });

  r.post("/reports/coa/:id/return", { preHandler: requireAny("report.sign"), schema: { params: IdParam, body: ReturnBody } }, async (req, reply) => {
    const res = await runAsActor(req, SCREEN, async (tx) => {
      const rep = await reportOf(tx, req.params.id, true); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status !== "awaiting_signature") return { code: 409, key: "locked", text: "It does not wait for a signature." };
      if (rep.signatory_id !== uid(req)) return { code: 403, key: "not_signatory", text: "Only the person named as signatory can return it." };
      await tx`update reports set status = 'draft', return_comment = ${req.body.comment}, returned_by = ${uid(req)}, returned_at = now(), sent_for_signature_by = null, sent_for_signature_at = null where id = ${rep.id}`;
      const [me] = await tx`select full_name from profiles where id = ${uid(req)}`;
      return { ok: true as const, order: rep.order_no, to: rep.sent_for_signature_by, who: me!.full_name as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    if (res.to) await noteAll(req, (tx) => notify(tx, { event: "N10", title: `CoA for ${res.order} was returned`, body: `${res.who}: ${req.body.comment}`, link: `/reports/coa/${req.params.id}` }, { users: [res.to as string] }, uid(req)));
    return { ok: true };
  });

  /* ================= sign and publish ================= */
  r.post("/reports/coa/:id/sign", { preHandler: requireAny("report.sign"), schema: { params: IdParam, body: SignBody }, config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    // only the signed-in user who is the CoA's signatory can sign; checked before the password, so a colleague's attempts are not counted against the signatory
    const pre = await runAsActor(req, SCREEN, async (tx) => {
      const rep = await reportOf(tx, req.params.id); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status !== "awaiting_signature") return { code: 409, key: "locked", text: rep.status === "draft" ? "It has not been sent for signature." : "It is already signed." };
      if (rep.signatory_id !== uid(req)) { const [s] = await tx`select full_name from profiles where id = ${rep.signatory_id}`; return { code: 403, key: "not_signatory", text: `Only ${s?.full_name ?? "the named signatory"} can sign this certificate.` }; }
      return null;
    });
    if (pre) return fail(reply, pre.code, pre.key, pre.text);
    const bad = await checkPassword(req, req.body.password);
    if (bad) return fail(reply, bad.code, bad.key, bad.text, "password");

    let uploaded: string | null = null;
    try {
      const res = await runAsActor(req, SCREEN, async (tx) => {
        const rep = await reportOf(tx, req.params.id, true);
        if (!rep || rep.status !== "awaiting_signature" || rep.signatory_id !== uid(req)) return { code: 409, key: "locked", text: "It changed while you were signing. Open it again." };
        const number = `CoA-${rep.order_no}-${rep.revision}`, issuedOn = todayIso();
        const frozen = await buildPayload(tx, rep, { draft: false, number, issuedOn, verifyCode: null });
        if (!frozen.reported) return { code: 409, key: "no_samples", text: "No sample is left to report." };
        const { reported: _n, ...clean } = frozen;
        const verify = verifyCodeOf(createHash("sha256").update(JSON.stringify(clean)).digest("hex"));
        const payload = { ...clean, verifyCode: verify };
        const img = await signingImages(uid(req));
        const { pdf, pages } = await renderPdf(payload, certAssets(img.signature, img.stamp));
        const path = `coa/${rep.order_no}/${number}.pdf`;
        const up = await admin.storage.from(BUCKET).upload(path, pdf, { contentType: "application/pdf", upsert: false });
        if (up.error) throw up.error;
        uploaded = path;
        await tx`update reports set status = 'issued', report_no = ${number}, issued_at = now(), issued_by = ${uid(req)}, signed_by = ${uid(req)}, signed_at = now(),
            storage_path = ${path}, sha256 = ${createHash("sha256").update(pdf).digest("hex")}, payload = ${tx.json(payload as never)}, verify_code = ${verify}, page_count = ${pages}, template_revision = ${payload.template.revision},
            signatory_name = ${payload.signatory.name}, signatory_title = ${payload.signatory.title}, signature_sha256 = ${img.signatureSha}, stamp_sha256 = ${img.stampSha}, return_comment = null
          where id = ${rep.id}`;
        await tx`update reports set status = 'superseded', superseded_at = now() where job_order_id = ${rep.job_order_id} and kind = 'coa' and status = 'issued' and id <> ${rep.id}`;
        await tx`update job_orders set status = 'reported' where id = ${rep.job_order_id} and status in ('in_progress', 'reported', 'delivered')`;
        await tx`insert into report_sources (report_id, batch_id) select ${rep.id}, b.id from batches b where b.job_order_id = ${rep.job_order_id} and b.status = 'completed' on conflict do nothing`;
        const [co] = await tx`select c.name from companies c where c.id = ${rep.company_id}`;
        return { ok: true as const, number, id: rep.id, company: co!.name as string, order: rep.order_no };
      });
      if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
      await noteAll(req, (tx) => notify(tx, { event: "N6", title: `${res.number} is published`, body: `Send it to ${res.company}.`, link: `/reports/coa/${res.id}` }, { roles: ["cso"] }, uid(req)));
      return { ok: true, number: res.number };
    } catch (e) {
      if (uploaded) await admin.storage.from(BUCKET).remove([uploaded]);   // a failed step signs nothing
      return pdfError(reply, e);
    }
  });

  /* ================= the document: preview, download, print ================= */
  r.get("/reports/coa/:id/pdf", { schema: { params: IdParam } }, async (req, reply) => {
    const rep = await as(req, (tx) => reportOf(tx, req.params.id));   // row-level security: a draft is read by the Lab admin side only, a waiting CoA also by its signatory
    if (!rep || rep.kind !== "coa") return fail(reply, 404, "not_found", "This certificate was not found.");
    const done = rep.status === "issued" || rep.status === "superseded" || rep.status === "void";
    if (done && !can(req, "coa.download") && !can(req, "report.publish")) return fail(reply, 403, "forbidden", "Your role doesn't include this action.");
    try {
      let pdf: Buffer;
      if (done && rep.storage_path) {
        const { data, error } = await admin.storage.from(BUCKET).download(rep.storage_path);
        if (error || !data) return fail(reply, 404, "no_file", "The file of this certificate is missing.");
        pdf = Buffer.from(await data.arrayBuffer());
      } else {
        const p = await as(req, (tx) => buildPayload(tx, rep, { draft: true, number: null, issuedOn: null, verifyCode: null }));
        pdf = (await renderPdf(p, certAssets(null, null))).pdf;   // a draft is rendered on the spot and not stored
      }
      return reply.header("content-type", "application/pdf").header("content-disposition", `inline; filename="${rep.report_no ?? "Draft-CoA"}.pdf"`).header("cache-control", "no-store").send(pdf);
    } catch (e) { return pdfError(reply, e); }
  });

  r.post("/reports/coa/:id/print", { preHandler: requireAny("coa.download", "report.publish"), schema: { params: IdParam } }, async (req, reply) => {
    const res = await runAsActor(req, SCREEN, async (tx) => {
      const rep = await reportOf(tx, req.params.id, true); if (!rep) return { code: 404, key: "not_found", text: "This certificate was not found." };
      if (rep.status === "draft" || rep.status === "awaiting_signature") return { code: 409, key: "not_published", text: "Only a published certificate is printed." };
      const [u] = await tx`update reports set print_count = print_count + 1, last_printed_at = now() where id = ${rep.id} returning print_count`;
      return { ok: true as const, count: u!.print_count as number };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    return { ok: true, count: res.count };
  });

  /* ================= delegating: change the job order's signatory ================= */
  // Everyone who may edit a job order can change its signatory, the CSO included (owner, Nov 20, 2026). It does not make anybody sign: the named person still has to sign in.
  r.put("/orders/:no/signatory", { preHandler: requireAny("order.edit"), schema: { params: NoParam, body: SignatoryBody } }, async (req, reply) => {
    const res = await runAsActor(req, SCREEN, async (tx) => {
      const [j] = await tx`select id, order_no, status::text as status from job_orders where order_no = ${req.params.no} for update`;
      if (!j) return { code: 404, key: "not_found", text: "This job order was not found." };
      if (j.status === "cancelled" || j.status === "closed") return { code: 409, key: "locked", text: `This job order is ${j.status}.` };
      const who = (await signers(tx)).find((s) => s.id === req.body.signatoryId);
      if (!who) return { code: 422, key: "invalid", text: "Choose a person with signing rights.", field: "signatoryId" };
      const [pub] = await tx`select id from reports where job_order_id = ${j.id} and kind = 'coa' and status = 'issued'`;
      if (pub) return { code: 409, key: "published", text: "The CoA is signed. Revise it to change the signatory." };
      await tx`update job_orders set signatory_id = ${who.id}, signatory_name = ${who.name}, signatory_title = ${who.title} where id = ${j.id}`;
      const [open] = await tx`select id, status::text as status, signatory_id from reports where job_order_id = ${j.id} and kind = 'coa' and status in ('draft', 'awaiting_signature') for update`;
      let moved: { id: string; from: string | null } | null = null;
      if (open && open.signatory_id !== who.id) {
        await tx`update reports set signatory_id = ${who.id} where id = ${open.id}`;
        if (open.status === "awaiting_signature") moved = { id: open.id as string, from: open.signatory_id as string | null };
      }
      return { ok: true as const, order: j.order_no as string, who: who.id as string, moved };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    if (res.moved) {
      const m = res.moved;
      await noteAll(req, async (tx) => {
        await notify(tx, { event: "N9", title: `CoA for ${res.order} waits for your signature`, body: "The signatory was changed.", link: `/reports/coa/${m.id}` }, { users: [res.who] }, uid(req));
        if (m.from) await notify(tx, { event: "N9", title: `CoA for ${res.order} no longer waits for you`, body: "Another signatory was named.", link: `/reports/coa/${m.id}` }, { users: [m.from] }, uid(req));
      });
    }
    return { ok: true, moved: !!res.moved };
  });

  void fmtDate;
}
