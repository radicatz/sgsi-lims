// Job order routes, slice A (Job_Order_Build_Design.md; spec S-17, 9.3): the form catalogue, list, create, detail, edit, submit, cancel and
// close. Every query runs as the signed-in user, so row-level security is the final check; the guards below give a clear 403 first.
// The job order's status is stored: Draft and Awaiting samples are set here; In progress, Reported and Delivered follow from batches
// and reports in phases 3 and 4.
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { asUser, type Tx } from "../db";
import { authenticate, requireAny } from "../auth";

const SCREEN = "Job orders";
const uuid = z.string().uuid();
const text = (max = 200) => z.string().trim().max(max);
const opt = (max = 500) => text(max).nullable().optional().transform((v) => (v ? v : null));
const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string) => reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}) });
const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["draft", "awaiting_samples", "in_progress", "reported", "delivered", "closed", "cancelled"] as const;

const Body = z.object({
  orderNo: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 ./_-]{2,39}$/, "Letters, numbers, dashes or dots, 3 to 40 characters.").optional(),
  companyId: uuid,
  companyAddress: opt(300),
  contactId: uuid.nullable().optional(),
  clientReference: opt(80),
  standards: z.array(z.enum(["ASTM", "ISO", "GBT"])).min(1, "Choose at least one standard.").max(3).refine((a) => new Set(a).size === a.length, "Each standard once."),
  serviceId: uuid.nullable().optional(),
  parameterIds: z.array(uuid).max(100).refine((a) => new Set(a).size === a.length, "Each parameter once."),
  groupItemIds: z.array(uuid).max(200).default([]),
  expectedSamples: z.number().int("A whole number.").min(0, "Zero or more.").max(5000, "At most 5000.").nullable().optional(),
  sampleType: opt(60),
  dueOn: z.string().regex(DATE, "Pick a date.").nullable().optional(),
  priority: z.enum(["Standard", "Urgent"]).default("Standard"),
  signatoryId: uuid.nullable().optional(),
  signatoryName: opt(120),
  signatoryTitle: opt(120),
  notes: opt(2000),
  submit: z.boolean().default(false),
});
type OrderBody = z.infer<typeof Body>;
const NoParam = z.object({ no: z.string().max(40) });

/** What a job order needs before it can be submitted (Draft only needs the client). First problem wins on the field. */
function submitProblems(b: OrderBody): Array<[string, string]> {
  const p: Array<[string, string]> = [];
  if (!b.contactId) p.push(["contactId", "Choose the contact person."]);
  if (!b.parameterIds.length) p.push(["parameterIds", "Choose at least one parameter."]);
  if (!b.expectedSamples || b.expectedSamples < 1) p.push(["expectedSamples", "Enter how many samples to expect."]);
  if (!b.dueOn) p.push(["dueOn", "Pick the due date."]);
  return p;
}

/** The next number from the numbering pattern (Configuration > Laboratory), for example JO-2026-0143: the highest of the year plus one. */
async function nextOrderNo(tx: Tx): Promise<string> {
  const [s] = await tx`select value->>'job_order' as p from app_settings where key = 'numbering'`;
  const pattern: string = s?.p && /\{N+\}/.test(s.p) ? s.p : "JO-{YYYY}-{NNNN}";
  const year = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric" }).format(new Date()));
  const width = pattern.match(/\{(N+)\}/)![1]!.length;
  const lit = (t: string) => t.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
  const fill = (t: string) => t.replace(/\{YYYY\}/g, String(year)).replace(/\{YY\}/g, String(year).slice(2));
  const [head, tail] = pattern.split(/\{N+\}/) as [string, string];
  const re = `^${lit(fill(head))}([0-9]+)${lit(fill(tail ?? ""))}$`;
  const [m] = await tx`select max((regexp_match(order_no, ${re}))[1]::int) as n from job_orders`;
  return `${fill(head)}${String((m?.n ?? 0) + 1).padStart(width, "0")}${fill(tail ?? "")}`;
}

export async function orderRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const run = <T>(req: { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string }, fn: (tx: Tx) => Promise<T>) =>
    asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const uid = (req: { user?: { userId: string } }) => req.user!.userId;
  const readOrders = requireAny("order.read"), createOrders = requireAny("order.create"), formUsers = requireAny("order.create", "order.edit"),
    editOrders = requireAny("order.edit"), cancelOrders = requireAny("order.cancel");

  /* ================= catalogue: what the form needs ================= */
  r.get("/orders/catalogue", { preHandler: formUsers }, async (req) => run(req, async (tx) => {
    const [params, items, services, companies, contacts, types, signers, no] = await Promise.all([
      tx`select p.id, p.code, p.label, p.name, p.category, p.is_group, p.is_subcontracted, p.kind::text as kind,
          coalesce((select array_agg(distinct s.family::text) from methods m join standards s on s.id = m.standard_id where m.parameter_id = p.id and m.is_default), '{}') as families
         from parameters p where p.active and p.code <> 'ADL' order by p.sort_order, p.code`,
      tx`select i.id, i.parameter_id, i.section, i.code, i.is_preset from parameter_group_items i order by i.parameter_id, i.sort_order`,
      tx`select s.id, s.code, s.name, s.version, s.is_default, s.turnaround_days,
          coalesce((select array_agg(sp.parameter_id) from service_parameters sp where sp.service_id = s.id), '{}') as parameter_ids
         from services s where s.status = 'active' order by s.sort_order, s.code`,
      tx`select c.id, c.code, c.name, c.address from companies c where c.status = 'active' order by c.name`,
      tx`select k.id, k.company_id, k.full_name, k.position, k.email, k.phone, k.is_default from company_contacts k where k.archived_at is null order by k.is_default desc, k.full_name`,
      tx`select value from lookups where list_key = 'sample_type' and active order by sort_order, value`,
      tx`select p.id, p.full_name, p.title, bool_or(ro.code = 'manager') as is_manager
         from profiles p join user_roles ur on ur.user_id = p.id join roles ro on ro.id = ur.role_id
           join role_permissions rp on rp.role_id = ur.role_id and rp.permission_code = 'report.sign'
         where p.status = 'active' group by p.id order by bool_or(ro.code = 'manager') desc, p.full_name`,
      nextOrderNo(tx),
    ]);
    return {
      nextOrderNo: no,
      parameters: params.map((p) => ({ id: p.id, code: p.code, label: p.label, name: p.name, category: p.category, isGroup: p.is_group, subcontracted: p.is_subcontracted, kind: p.kind, families: p.families })),
      groupItems: items.map((i) => ({ id: i.id, parameterId: i.parameter_id, section: i.section, code: i.code, preset: i.is_preset })),
      services: services.map((s) => ({ id: s.id, code: s.code, name: s.name, version: s.version, isDefault: s.is_default, turnaroundDays: s.turnaround_days, parameterIds: s.parameter_ids })),
      companies: companies.map((c) => ({ id: c.id, code: c.code, name: c.name, address: c.address ?? "",
        contacts: contacts.filter((k) => k.company_id === c.id).map((k) => ({ id: k.id, fullName: k.full_name, position: k.position, email: k.email, phone: k.phone, isDefault: k.is_default })) })),
      sampleTypes: types.map((t) => t.value as string),
      priorities: ["Standard", "Urgent"],
      signatories: signers.map((s) => ({ id: s.id, name: s.full_name, title: s.title ?? (s.is_manager ? "Laboratory Manager" : ""), isManager: s.is_manager })),
    };
  }));

  /* ================= list ================= */
  const Query = z.object({
    q: z.string().trim().max(80).optional(), status: z.enum(STATUSES).optional(), company: uuid.optional(), cso: uuid.optional(),
    dueFrom: z.string().regex(DATE).optional(), dueTo: z.string().regex(DATE).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1), size: z.coerce.number().int().min(1).max(100).default(25),
  });
  r.get("/orders", { preHandler: readOrders, schema: { querystring: Query } }, async (req) => run(req, async (tx) => {
    const f = req.query;
    const like = f.q ? `%${f.q.replace(/[%_\\]/g, "\\$&")}%` : null;
    // the filters every count shares; the status chip adds its own on top
    const common = tx`true
      ${like ? tx`and (j.order_no ilike ${like} or c.name ilike ${like} or j.client_reference ilike ${like})` : tx``}
      ${f.company ? tx`and j.company_id = ${f.company}` : tx``}
      ${f.cso ? tx`and j.cso_id = ${f.cso}` : tx``}
      ${f.dueFrom ? tx`and j.due_on >= ${f.dueFrom}` : tx``}
      ${f.dueTo ? tx`and j.due_on <= ${f.dueTo}` : tx``}`;
    const [csos, counts, [tot], rows] = await Promise.all([
      tx`select distinct p.id, p.full_name from job_orders j join profiles p on p.id = j.cso_id order by p.full_name`,
      tx`select j.status::text as status, count(*)::int as n from job_orders j join companies c on c.id = j.company_id where ${common} group by j.status`,
      tx`select count(*)::int as n from job_orders j join companies c on c.id = j.company_id where ${common} ${f.status ? tx`and j.status = ${f.status}` : tx``}`,
      tx`select j.id, j.order_no, j.status::text as status, j.due_on::text as due_on, j.client_reference, j.expected_samples, j.created_at, j.standards::text[] as standards,
          c.id as company_id, c.name as company_name, k.full_name as contact_name, sv.name as service_name, cso.full_name as cso_name,
          (select count(*)::int from samples x where x.job_order_id = j.id) as registered,
          (select count(*)::int from samples x where x.job_order_id = j.id and x.received_at is not null) as received,
          (select count(*)::int from batches b where b.job_order_id = j.id) as batches,
          (select count(*)::int from batches b where b.job_order_id = j.id and b.status = 'completed') as batches_done,
          (select r.status::text from reports r where r.job_order_id = j.id and r.kind = 'coa' and r.status <> 'void' order by r.created_at desc limit 1) as coa
         from job_orders j join companies c on c.id = j.company_id
           left join company_contacts k on k.id = j.contact_id left join services sv on sv.id = j.service_id left join profiles cso on cso.id = j.cso_id
         where ${common} ${f.status ? tx`and j.status = ${f.status}` : tx``}
         order by j.created_at desc, j.order_no desc limit ${f.size} offset ${(f.page - 1) * f.size}`,
    ]);
    const byStatus: Record<string, number> = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const c of counts) byStatus[c.status as string] = c.n as number;
    return {
      csos: csos.map((c) => ({ id: c.id, name: c.full_name })), total: tot!.n, page: f.page, size: f.size, counts: { all: Object.values(byStatus).reduce((a, b) => a + b, 0), ...byStatus },
      items: rows.map((j) => ({ id: j.id, orderNo: j.order_no, status: j.status, dueOn: j.due_on, clientReference: j.client_reference, companyId: j.company_id, company: j.company_name,
        contact: j.contact_name, service: j.service_name, standards: j.standards, expected: j.expected_samples ?? 0, registered: j.registered, received: j.received,
        batches: j.batches, batchesDone: j.batches_done, coa: j.coa, cso: j.cso_name, createdAt: j.created_at })),
    };
  }));

  /* ================= detail ================= */
  const detail = async (tx: Tx, no: string) => {
    const [j] = await tx`select j.*, j.due_on::text as due_on_text, j.status::text as status_text, j.standards::text[] as standards_text, c.name as company_name, c.address as company_address,
        k.full_name as contact_name, k.phone as contact_phone, k.email as contact_email, k.position as contact_position,
        sv.name as service_name, sv.version as service_version, cso.full_name as cso_name, cb.full_name as created_by_name,
        coalesce((select array_agg(sp.parameter_id) from service_parameters sp where sp.service_id = j.service_id), '{}') as service_parameter_ids
      from job_orders j join companies c on c.id = j.company_id left join company_contacts k on k.id = j.contact_id left join services sv on sv.id = j.service_id
        left join profiles cso on cso.id = j.cso_id left join profiles cb on cb.id = j.created_by where j.order_no = ${no}`;
    if (!j) return null;
    const [params, items, [n], batches] = await Promise.all([
      tx`select p.id, p.code, p.label, p.category from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${j.id} order by p.sort_order, p.code`,
      tx`select i.id, i.section, i.code, i.parameter_id from job_order_group_items x join parameter_group_items i on i.id = x.item_id where x.job_order_id = ${j.id} order by i.sort_order`,
      tx`select (select count(*)::int from samples where job_order_id = ${j.id}) as samples,
          (select count(*)::int from samples where job_order_id = ${j.id} and received_at is not null) as received,
          (select count(*)::int from samples where job_order_id = ${j.id} and not_received_at is not null) as not_received,
          (select count(*)::int from job_order_files where job_order_id = ${j.id}) as files`,
      tx`select b.id, b.batch_no, b.status::text as status, b.standard::text as standard, b.batch_date::text as batch_date, b.completed_at,
          (select count(*)::int from samples s where s.batch_id = b.id) as samples
         from batches b where b.job_order_id = ${j.id} order by b.batch_date, b.batch_no`,
    ]);
    const status = j.status_text as string;
    const started = batches.some((b) => b.status !== "created");
    const edit = status === "cancelled" || status === "closed" ? "This job order is " + status + "."
      : started ? "A batch is in preparation, so the job order can't change." : null;
    const cancel = status === "cancelled" ? "Already cancelled." : status === "closed" ? "A closed job order can't be cancelled."
      : n!.received > 0 ? "A sample has been received, so it can't be cancelled." : null;
    const close = status === "delivered" ? null : status === "closed" ? "Already closed." : "A job order can be closed once its CoA is marked sent.";
    return {
      id: j.id, orderNo: j.order_no, status, createdAt: j.created_at, submittedAt: j.submitted_at, closedAt: j.closed_at, cancelledAt: j.cancelled_at, cancelReason: j.cancel_reason,
      company: { id: j.company_id, name: j.company_name, address: j.company_address ?? "" },
      contact: j.contact_id ? { id: j.contact_id, fullName: j.contact_name, phone: j.contact_phone, email: j.contact_email, position: j.contact_position } : null,
      clientReference: j.client_reference, standards: j.standards_text, service: j.service_id ? { id: j.service_id, name: j.service_name, version: j.service_version, parameterIds: j.service_parameter_ids } : null,
      parameters: params.map((p) => ({ id: p.id, code: p.code, label: p.label, category: p.category })),
      groupItems: items.map((i) => ({ id: i.id, section: i.section, code: i.code, parameterId: i.parameter_id })),
      preparation: j.preparation, expectedSamples: j.expected_samples, sampleType: j.sample_type, dueOn: j.due_on_text, priority: j.priority,
      signatory: j.signatory_name ? { id: j.signatory_id, name: j.signatory_name, title: j.signatory_title } : null, notes: j.notes,
      cso: j.cso_name, createdBy: j.created_by_name,
      counts: { samples: n!.samples, received: n!.received, notReceived: n!.not_received, batches: batches.length, files: n!.files },
      batches: batches.map((b) => ({ id: b.id, batchNo: b.batch_no, status: b.status, standard: b.standard, batchDate: b.batch_date, samples: b.samples, completedAt: b.completed_at })),
      can: { edit: { ok: edit === null, why: edit }, cancel: { ok: cancel === null, why: cancel }, close: { ok: close === null, why: close } },
    };
  };
  r.get("/orders/:no", { preHandler: readOrders, schema: { params: NoParam } }, async (req, reply) => {
    const d = await run(req, (tx) => detail(tx, req.params.no));
    return d ?? fail(reply, 404, "not_found", "This job order was not found.");
  });

  /* ================= create and edit ================= */
  /** The parts shared by create and edit: checks the references, then rewrites the parameter set. Returns a field error or null. */
  const writeParts = async (tx: Tx, id: string, b: OrderBody): Promise<[string, string] | null> => {
    if (b.parameterIds.length) {
      const found = await tx`select id from parameters where id = any(${b.parameterIds}::uuid[]) and active`;
      if (found.length !== b.parameterIds.length) return ["parameterIds", "A chosen parameter is not available."];
    }
    if (b.groupItemIds.length) {
      const found = await tx`select i.id from parameter_group_items i where i.id = any(${b.groupItemIds}::uuid[]) and i.parameter_id = any(${b.parameterIds}::uuid[])`;
      if (found.length !== b.groupItemIds.length) return ["groupItemIds", "A chosen item does not belong to a chosen parameter."];
    }
    await tx`delete from job_order_parameters where job_order_id = ${id}`;
    await tx`delete from job_order_group_items where job_order_id = ${id}`;
    if (b.parameterIds.length) await tx`insert into job_order_parameters (job_order_id, parameter_id) select ${id}, x from unnest(${b.parameterIds}::uuid[]) as x`;
    if (b.groupItemIds.length) await tx`insert into job_order_group_items (job_order_id, item_id) select ${id}, x from unnest(${b.groupItemIds}::uuid[]) as x`;
    return null;
  };
  /** Company, contact and address checks. The address typed on the form updates the client record (frame note). */
  const checkCompany = async (tx: Tx, b: OrderBody): Promise<[string, string] | null> => {
    const [c] = await tx`select id, status::text as status, address from companies where id = ${b.companyId}`;
    if (!c) return ["companyId", "This client was not found."];
    if (c.status !== "active") return ["companyId", "This client is not active."];
    if (b.contactId) {
      const [k] = await tx`select 1 from company_contacts where id = ${b.contactId} and company_id = ${b.companyId} and archived_at is null`;
      if (!k) return ["contactId", "This contact does not belong to the client."];
    }
    if (b.companyAddress !== undefined && (b.companyAddress ?? "") !== (c.address ?? "")) await tx`update companies set address = ${b.companyAddress ?? null} where id = ${b.companyId}`;
    return null;
  };
  const signatoryOf = async (tx: Tx, b: OrderBody): Promise<{ id: string | null; name: string | null; title: string | null }> => {
    if (b.signatoryId) {
      const [p] = await tx`select full_name, title from profiles where id = ${b.signatoryId}`;
      return p ? { id: b.signatoryId, name: p.full_name, title: b.signatoryTitle ?? p.title ?? null } : { id: null, name: b.signatoryName, title: b.signatoryTitle };
    }
    return { id: null, name: b.signatoryName, title: b.signatoryTitle };
  };

  r.post("/orders", { preHandler: createOrders, schema: { body: Body } }, async (req, reply) => {
    const b = req.body;
    if (b.submit) { const p = submitProblems(b); if (p.length) return fail(reply, 422, "invalid", `Fix ${p.length} field${p.length === 1 ? "" : "s"} to submit.`, p[0]![0]); }
    try {
      const res = await run(req, async (tx) => {
        await tx`select pg_advisory_xact_lock(hashtext('job_order_no'))`;      // two CSOs never get the same number
        const bad = await checkCompany(tx, b); if (bad) return bad;
        const no = b.orderNo ?? (await nextOrderNo(tx));
        const sig = await signatoryOf(tx, b);
        const preparation = b.parameterIds.length ? !!(await tx`select 1 from parameters where id = any(${b.parameterIds}::uuid[]) and code = 'PREP'`).length : true;
        const [row] = await tx`insert into job_orders (order_no, company_id, contact_id, client_reference, service_id, standards, preparation, expected_samples, sample_type, due_on, priority,
            signatory_id, signatory_name, signatory_title, notes, status, cso_id, submitted_at, created_by)
          values (${no}, ${b.companyId}, ${b.contactId ?? null}, ${b.clientReference}, ${b.serviceId ?? null}, ${b.standards}::standard_family[], ${preparation}, ${b.expectedSamples ?? null},
            ${b.sampleType}, ${b.dueOn ?? null}, ${b.priority}, ${sig.id}, ${sig.name}, ${sig.title}, ${b.notes}, ${b.submit ? "awaiting_samples" : "draft"}::order_status, ${uid(req)},
            ${b.submit ? new Date() : null}, ${uid(req)}) returning id, order_no`;
        const bad2 = await writeParts(tx, row!.id, b); if (bad2) throw Object.assign(new Error("bad"), { field: bad2 });
        return { orderNo: row!.order_no as string };
      });
      if (Array.isArray(res)) return fail(reply, 422, "invalid", res[1], res[0]);
      return reply.code(201).send(res);
    } catch (e) {
      const fe = (e as { field?: [string, string] }).field; if (fe) return fail(reply, 422, "invalid", fe[1], fe[0]);
      if (isUnique(e)) return fail(reply, 409, "duplicate", "This job order number is already used.", "orderNo");
      throw e;
    }
  });

  r.put("/orders/:no", { preHandler: editOrders, schema: { params: NoParam, body: Body } }, async (req, reply) => {
    const b = req.body;
    if (b.submit) { const p = submitProblems(b); if (p.length) return fail(reply, 422, "invalid", `Fix ${p.length} field${p.length === 1 ? "" : "s"} to submit.`, p[0]![0]); }
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status::text as status from job_orders where order_no = ${req.params.no} for update`;
      if (!cur) return "missing" as const;
      const d = await detail(tx, req.params.no);
      if (!d!.can.edit.ok) return { locked: d!.can.edit.why! };
      const bad = await checkCompany(tx, b); if (bad) return bad;
      const sig = await signatoryOf(tx, b);
      const preparation = b.parameterIds.length ? !!(await tx`select 1 from parameters where id = any(${b.parameterIds}::uuid[]) and code = 'PREP'`).length : true;
      const submit = b.submit && cur.status === "draft";
      await tx`update job_orders set company_id = ${b.companyId}, contact_id = ${b.contactId ?? null}, client_reference = ${b.clientReference}, service_id = ${b.serviceId ?? null},
          standards = ${b.standards}::standard_family[], preparation = ${preparation}, expected_samples = ${b.expectedSamples ?? null}, sample_type = ${b.sampleType}, due_on = ${b.dueOn ?? null},
          priority = ${b.priority}, signatory_id = ${sig.id}, signatory_name = ${sig.name}, signatory_title = ${sig.title}, notes = ${b.notes}
          ${submit ? tx`, status = 'awaiting_samples'::order_status, submitted_at = now()` : tx``} where id = ${cur.id}`;
      const bad2 = await writeParts(tx, cur.id, b); if (bad2) throw Object.assign(new Error("bad"), { field: bad2 });
      return "ok" as const;
    }).catch((e) => { const fe = (e as { field?: [string, string] }).field; if (fe) return fe; throw e; });
    if (res === "missing") return fail(reply, 404, "not_found", "This job order was not found.");
    if (Array.isArray(res)) return fail(reply, 422, "invalid", res[1], res[0]);
    if (typeof res === "object") return fail(reply, 409, "locked", res.locked);
    return { ok: true };
  });

  /* ================= submit, cancel, close ================= */
  r.post("/orders/:no/submit", { preHandler: editOrders, schema: { params: NoParam } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [j] = await tx`select id, status::text as status, contact_id, expected_samples, due_on, (select count(*)::int from job_order_parameters x where x.job_order_id = job_orders.id) as np
        from job_orders where order_no = ${req.params.no} for update`;
      if (!j) return "missing" as const;
      if (j.status !== "draft") return "not_draft" as const;
      const missing: Array<[string, string]> = [];
      if (!j.contact_id) missing.push(["contactId", "Choose the contact person."]);
      if (!j.np) missing.push(["parameterIds", "Choose at least one parameter."]);
      if (!j.expected_samples) missing.push(["expectedSamples", "Enter how many samples to expect."]);
      if (!j.due_on) missing.push(["dueOn", "Pick the due date."]);
      if (missing.length) return missing;
      await tx`update job_orders set status = 'awaiting_samples', submitted_at = now() where id = ${j.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This job order was not found.");
    if (res === "not_draft") return fail(reply, 409, "not_draft", "Only a draft can be submitted.");
    if (Array.isArray(res)) return fail(reply, 422, "invalid", `Fix ${res.length} field${res.length === 1 ? "" : "s"} to submit.`, res[0]![0]);
    return { ok: true };
  });

  r.post("/orders/:no/cancel", { preHandler: cancelOrders, schema: { params: NoParam, body: z.object({ reason: text(300).min(3, "Say why it is cancelled.") }) } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [j] = await tx`select id from job_orders where order_no = ${req.params.no} for update`;
      if (!j) return "missing" as const;
      const d = await detail(tx, req.params.no);
      if (!d!.can.cancel.ok) return { why: d!.can.cancel.why! };
      await tx`update job_orders set status = 'cancelled', cancelled_at = now(), cancel_reason = ${req.body.reason} where id = ${j.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This job order was not found.");
    if (typeof res === "object") return fail(reply, 409, "not_cancellable", res.why);
    return { ok: true };
  });

  r.post("/orders/:no/close", { preHandler: cancelOrders, schema: { params: NoParam } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [j] = await tx`select id, status::text as status from job_orders where order_no = ${req.params.no} for update`;
      if (!j) return "missing" as const;
      if (j.status !== "delivered") return "not_delivered" as const;
      await tx`update job_orders set status = 'closed', closed_at = now() where id = ${j.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This job order was not found.");
    if (res === "not_delivered") return fail(reply, 409, "not_delivered", "A job order can be closed once its CoA is marked sent.");
    return { ok: true };
  });
}
