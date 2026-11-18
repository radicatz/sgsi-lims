// Batch routes, part 1 (Batch_Build_Design.md sections 4 to 7; spec S-07, S-08, 9.2.1): the batch list, Add batch, the job order's Batches tab, the
// batch page header and its log, and the batch number. Reception is in batches-reception.ts. Every query runs as the signed-in user, so
// row-level security is the final check; the guards below give a clear 403 first.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { BATCH_RE, NoParam, SCREEN, dayText, fail, logStep, nextBatchNo, notify, runAs, runAsActor, shownStatus, todayIso, uuid } from "../batch-lib";
import { batchReceptionRoutes } from "./batches-reception";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STAGES = ["created", "preparation", "prep_finished", "analysis", "analysis_finished", "completed"] as const;
const opt = (max: number) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";

const ListQuery = z.object({
  // one or several statuses, comma separated ("created,preparation": the Preparation team's own queue)
  q: z.string().trim().max(80).optional(), status: z.string().regex(/^[a-z_]+(,[a-z_]+)*$/).refine((s) => s.split(",").every((x) => (STAGES as readonly string[]).includes(x)), "Unknown status.").optional(), company: uuid.optional(), standard: z.enum(["ASTM", "ISO", "GBT"]).optional(), order: z.string().trim().max(40).optional(),
  from: z.string().regex(DATE).optional(), to: z.string().regex(DATE).optional(), dueFrom: z.string().regex(DATE).optional(), dueTo: z.string().regex(DATE).optional(),
  sort: z.enum(["batch", "order", "standard", "samples", "status", "deadline", "roa"]).optional(), dir: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).max(10000).default(1), size: z.coerce.number().int().min(1).max(100).default(25),
});
const Create = z.object({
  orderNo: z.string().max(40),
  batchNo: z.string().trim().regex(BATCH_RE, "Pattern B-YYYY-NNNN. The number must be unique."),
  batchDate: z.string().regex(DATE, "Pick the batch date."),
  deadlineOn: z.string().regex(DATE, "Pick a date.").nullable().optional(),
  standard: z.enum(["ASTM", "ISO", "GBT"]),
  sampleIds: z.array(uuid).min(1, "Tick at least one sample.").max(2000),
  parameterIds: z.array(uuid).min(1, "Choose at least one parameter.").max(100),
  priority: z.enum(["Standard", "Urgent"]).default("Standard"),
  cocNo: opt(60), notes: opt(2000),
});
const NumberBody = z.object({ batchNo: z.string().trim().regex(BATCH_RE, "Pattern B-YYYY-NNNN. The number must be unique.") });

/** Parameters the Analysis tab enters: not Preparation (a service of its own) and not ADL (Preparation tab). */
const NOT_BATCH = ["PREP", "ADL"];
const COMMON = ["Moisture", "Proximate", "Sulfur", "Calorific", "Ultimate", "Physical"];
/** Why a job order takes no new batch, or null. */
const openWhy = (status: string) => status === "draft" ? "Submit the job order before adding a batch."
  : status === "cancelled" ? "This job order is cancelled." : status === "closed" ? "This job order is closed."
  : status === "reported" || status === "delivered" ? "This job order is already reported." : null;

export async function batchRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const readBatches = requireAny("batch.read"), readOrders = requireAny("order.read"), createBatches = requireAny("batch.create"), editNumber = requireAny("batch.number.edit");

  /* ================= list ================= */
  r.get("/batches", { preHandler: readBatches, schema: { querystring: ListQuery } }, async (req) => runAs(req, async (tx) => {
    const f = req.query;
    const like = f.q ? `%${f.q.replace(/[%_\\]/g, "\\$&")}%` : null;
    const common = tx`true
      ${like ? tx`and (b.batch_no ilike ${like} or j.order_no ilike ${like} or c.name ilike ${like}
          or exists (select 1 from samples sq where sq.batch_id = b.id and (sq.client_ref ilike ${like} or sq.sample_no ilike ${like} or sq.sample_code ilike ${like})))` : tx``}
      ${f.company ? tx`and b.company_id = ${f.company}` : tx``}
      ${f.standard ? tx`and b.standard = ${f.standard}::standard_family` : tx``}
      ${f.order ? tx`and j.order_no = ${f.order}` : tx``}
      ${f.from ? tx`and b.batch_date >= ${f.from}` : tx``} ${f.to ? tx`and b.batch_date <= ${f.to}` : tx``}
      ${f.dueFrom ? tx`and b.deadline_on >= ${f.dueFrom}` : tx``} ${f.dueTo ? tx`and b.deadline_on <= ${f.dueTo}` : tx``}`;
    const today = todayIso();
    const dir = f.dir === "desc" ? tx`desc nulls last` : tx`asc nulls last`;
    const key = { batch: tx`b.batch_no`, order: tx`j.order_no`, standard: tx`b.standard::text`, samples: tx`(select count(*) from samples s where s.batch_id = b.id and s.arrived_at is not null)`, status: tx`b.status`, deadline: tx`b.deadline_on`, roa: tx`d.roa_no` }[f.sort ?? "batch"];
    const orderBy = f.sort ? tx`${key} ${dir},` : tx``;
    const [orders, counts, [tot], rows] = await Promise.all([
      tx`select distinct j.order_no, c.name as company_name from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id order by j.order_no desc`,
      tx`select b.status::text as status, count(*)::int as n from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id where ${common} group by b.status`,
      tx`select count(*)::int as n from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id where ${common} ${f.status ? tx`and b.status = any(${f.status.split(",")}::batch_status[])` : tx``}`,
      tx`select b.id, b.batch_no, b.batch_date::text as batch_date, b.deadline_on::text as deadline_on, b.standard::text as standard, b.status::text as stored, ${shownStatus(tx)} as shown,
          j.order_no, c.name as company_name, d.roa_no,
          (select count(*)::int from samples s where s.batch_id = b.id) as in_batch,
          (select count(*)::int from samples s where s.batch_id = b.id and s.arrived_at is not null) as arrived, b.expected_at_confirm
         from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id left join batch_documents d on d.batch_id = b.id
         where ${common} ${f.status ? tx`and b.status = any(${f.status.split(",")}::batch_status[])` : tx``}
         order by ${orderBy} b.batch_date desc, b.batch_no desc limit ${f.size} offset ${(f.page - 1) * f.size}`,
    ]);
    const byStatus: Record<string, number> = Object.fromEntries(STAGES.map((s) => [s, 0]));
    for (const c of counts) byStatus[c.status as string] = c.n as number;
    return {
      total: tot!.n, page: f.page, size: f.size, counts: { all: Object.values(byStatus).reduce((a, b) => a + b, 0), ...byStatus },
      orders: orders.map((o) => ({ orderNo: o.order_no as string, company: o.company_name as string })),
      items: rows.map((b) => ({ id: b.id, batchNo: b.batch_no, batchDate: b.batch_date, deadlineOn: b.deadline_on, standard: b.standard, status: b.shown, orderNo: b.order_no, company: b.company_name,
        arrived: b.arrived, expected: b.expected_at_confirm ?? b.in_batch, roaNo: b.roa_no,
        pastDue: !!b.deadline_on && b.deadline_on < today && b.stored !== "completed" })),
    };
  }));

  /* ================= the job order's Batches tab ================= */
  r.get("/orders/:no/batches", { preHandler: readOrders, schema: { params: NoParam } }, async (req, reply) => {
    const out = await runAs(req, async (tx) => {
      const [j] = await tx`select j.id, j.status::text as status, sv.name as service_name from job_orders j left join services sv on sv.id = j.service_id where j.order_no = ${req.params.no}`;
      if (!j) return null;
      const [rows, bp, jp] = await Promise.all([
        tx`select b.id, b.batch_no, b.batch_date::text as batch_date, b.deadline_on::text as deadline_on, b.standard::text as standard, ${shownStatus(tx)} as shown, b.status::text as stored,
            b.reception_confirmed_at, b.prep_finished_at, b.analysis_started_at, b.analysis_finished_at, d.roa_no,
            pf.full_name as prep_by, pc.full_name as confirm_by, afn.full_name as an_finish_by, ast.full_name as an_start_by,
            (select count(*)::int from samples s where s.batch_id = b.id) as samples
           from batches b left join batch_documents d on d.batch_id = b.id
             left join profiles pf on pf.id = b.prep_finished_by left join profiles pc on pc.id = b.reception_confirmed_by
             left join profiles afn on afn.id = b.analysis_finished_by left join profiles ast on ast.id = b.analysis_started_by
           where b.job_order_id = ${j.id} order by b.batch_date, b.batch_no`,
        tx`select bp.batch_id, array_agg(p.code order by p.sort_order, p.code) as codes from batch_parameters bp join parameters p on p.id = bp.parameter_id
           where bp.batch_id in (select id from batches where job_order_id = ${j.id}) group by bp.batch_id`,
        tx`select array_agg(p.code order by p.sort_order, p.code) as codes from job_order_parameters x join parameters p on p.id = x.parameter_id where x.job_order_id = ${j.id} and p.code <> all(${NOT_BATCH}::text[])`,
      ]);
      const unarrived = await tx`select count(*)::int as n, coalesce(array_agg(distinct rb.batch_no), '{}') as from_batches from v_samples s left join batches rb on rb.id = s.released_from_batch_id
        where s.job_order_id = ${j.id} and s.state = 'awaiting_arrival'`;
      return { j, rows, bp, jp: (jp[0]?.codes ?? []) as string[], awaiting: unarrived[0]!.n as number, awaitingFrom: unarrived[0]!.from_batches as string[] };
    });
    if (!out) return fail(reply, 404, "not_found", "This job order was not found.");
    const mine = new Map(out.bp.map((x) => [x.batch_id as string, x.codes as string[]]));
    const service = out.j.service_name ?? "Custom set";
    const word = (codes: string[]) => {
      const add = codes.filter((c) => !out.jp.includes(c)), drop = out.jp.filter((c) => !codes.includes(c));
      return add.length || drop.length ? [add.length ? `+ ${add.join(", ")}` : "", drop.length ? `− ${drop.join(", ")}` : ""].filter(Boolean).join(" ") + " compared with the job order" : "Same as the job order";
    };
    return {
      awaitingArrival: out.awaiting, awaitingFrom: out.awaitingFrom,
      items: out.rows.map((b) => {
        const codes = mine.get(b.id as string) ?? [];
        return {
          id: b.id, batchNo: b.batch_no, batchDate: b.batch_date, deadlineOn: b.deadline_on, standard: b.standard, status: b.shown, samples: b.samples, roaNo: b.roa_no,
          parameters: service, parametersNote: word(codes),
          prep: b.prep_finished_at ? { by: b.prep_by, at: b.prep_finished_at, started: false } : b.reception_confirmed_at ? { by: b.confirm_by, at: b.reception_confirmed_at, started: true } : null,
          analysis: b.analysis_finished_at ? { by: b.an_finish_by, at: b.analysis_finished_at, started: false } : b.analysis_started_at ? { by: b.an_start_by, at: b.analysis_started_at, started: true } : null,
        };
      }),
    };
  });

  /* ================= the job orders a batch can be added to (the list's Add batch asks for one first) ================= */
  r.get("/batches/open-orders", { preHandler: createBatches }, async (req) => runAs(req, async (tx) => {
    const rows = await tx`select j.order_no, c.name as company_name, j.status::text as status,
        (select count(*)::int from v_samples s where s.job_order_id = j.id and s.state in ('expected', 'awaiting_arrival')) as free
      from job_orders j join companies c on c.id = j.company_id where j.status in ('awaiting_samples', 'in_progress') order by j.order_no desc`;
    return { items: rows.map((o) => ({ orderNo: o.order_no as string, company: o.company_name as string, free: o.free as number })) };
  }));

  /* ================= Add batch: what the form needs ================= */
  r.get("/orders/:no/batch-form", { preHandler: createBatches, schema: { params: NoParam } }, async (req, reply) => {
    const out = await runAs(req, async (tx) => {
      const [j] = await tx`select j.id, j.order_no, j.status::text as status, j.standards::text[] as standards, j.due_on::text as due_on, j.priority, c.name as company_name
        from job_orders j join companies c on c.id = j.company_id where j.order_no = ${req.params.no}`;
      if (!j) return null;
      // late samples (frame 04-04-02): the settings of the batch they came back from are the starting point
      const [from] = await tx`select b.id, b.batch_no, b.standard::text as standard, b.priority from batches b
        where b.id = (select s.released_from_batch_id from samples s where s.job_order_id = ${j.id} and s.batch_id is null and s.released_from_batch_id is not null and s.not_received_at is null
                      order by s.released_at desc limit 1)`;
      const [samples, params, chosen, no, fromParams, service] = await Promise.all([
        tx`select s.id, s.client_ref, s.state, rb.batch_no as released_from from v_samples s left join batches rb on rb.id = s.released_from_batch_id
           where s.job_order_id = ${j.id} and s.state in ('expected', 'awaiting_arrival') order by s.row_no`,
        tx`select p.id, p.code, p.label, p.is_group, p.category from parameters p where p.active and p.code <> all(${NOT_BATCH}::text[]) order by p.sort_order, p.code`,
        tx`select parameter_id from job_order_parameters where job_order_id = ${j.id}`,
        nextBatchNo(tx),
        from ? tx`select parameter_id from batch_parameters where batch_id = ${from.id}` : Promise.resolve([] as Array<{ parameter_id: string }>),
        tx`select sv.name from job_orders j left join services sv on sv.id = j.service_id where j.id = ${j.id}`,
      ]);
      const chosenSet = new Set(chosen.map((x) => x.parameter_id as string));
      const copied = from ? new Set(fromParams.map((x) => x.parameter_id as string)) : null;
      // "TM + Prox + TS + CV" is the service; a set that differs from the job order's is described by its size
      const offered = new Set(params.map((p) => p.id as string)), orderSet = [...chosenSet].filter((id) => offered.has(id));
      const same = !!copied && copied.size === orderSet.length && orderSet.every((id) => copied.has(id));
      const copiedText = copied ? (same ? (service[0]?.name ?? "the job order's parameters") : `${copied.size} parameters`) : null;
      return { j, samples, params, chosen: chosenSet, no, from, copied, copiedText };
    });
    if (!out) return fail(reply, 404, "not_found", "This job order was not found.");
    const closed = openWhy(out.j.status);
    return {
      canAdd: !closed, why: closed, orderNo: out.j.order_no, company: out.j.company_name, standards: out.j.standards, nextBatchNo: out.no, batchDate: todayIso(), deadlineOn: out.j.due_on, priority: out.j.priority,
      copyFrom: out.from && out.copied ? { batchNo: out.from.batch_no, standard: out.from.standard, priority: out.from.priority, parameterIds: [...out.copied], text: out.copiedText } : null,
      samples: out.samples.map((s) => ({ id: s.id, clientRef: s.client_ref, awaiting: s.state === "awaiting_arrival", releasedFrom: s.released_from })),
      // a group (Ash analysis, Trace elements) is offered only when the job order has it
      // the job order's own parameters, and the common ones a batch may add (moisture to physical); a group (Ash analysis, Trace elements) only when the job order has it
      parameters: out.params.filter((p) => out.chosen.has(p.id as string) || (!p.is_group && COMMON.includes(p.category as string))).map((p) => ({ id: p.id, code: p.code, label: p.label, inOrder: out.chosen.has(p.id as string) })),
    };
  });
  /* ================= Add batch ================= */
  r.post("/batches", { preHandler: createBatches, schema: { body: Create } }, async (req, reply) => {
    const b = req.body;
    if (b.deadlineOn && b.deadlineOn < b.batchDate) return fail(reply, 422, "invalid", "The deadline can't be before the batch date.", "deadlineOn");
    const res = await runAs(req, async (tx) => {
      const [j] = await tx`select j.id, j.company_id, j.order_no, j.status::text as status, j.standards::text[] as standards from job_orders j where j.order_no = ${b.orderNo} for update`;
      if (!j) return { code: 404, key: "not_found", text: "This job order was not found." };
      const closed = openWhy(j.status); if (closed) return { code: 409, key: "locked", text: closed };
      if (!(j.standards as string[]).includes(b.standard)) return { code: 422, key: "invalid", text: "Choose one of the job order's standards.", field: "standard" };
      const [dup] = await tx`select 1 from batches where batch_no = ${b.batchNo}`;
      if (dup) return { code: 409, key: "duplicate", text: `${b.batchNo} is already used.`, field: "batchNo" };
      const ids = [...new Set(b.sampleIds)];
      const smp = await tx`select s.id, s.client_ref, s.state from v_samples s where s.job_order_id = ${j.id} and s.id = any(${ids}::uuid[]) for update of s`;
      if (smp.length !== ids.length) return { code: 422, key: "invalid", text: "A chosen sample is not on this job order.", field: "sampleIds" };
      const bad = smp.find((s) => s.state !== "expected" && s.state !== "awaiting_arrival");
      if (bad) return { code: 409, key: "locked", text: `${bad.client_ref} is already in a batch, received or marked not received.`, field: "sampleIds" };
      const params = [...new Set(b.parameterIds)];
      const okp = await tx`select p.id from parameters p where p.id = any(${params}::uuid[]) and p.active and p.code <> all(${NOT_BATCH}::text[])
        and (not p.is_group or p.id in (select parameter_id from job_order_parameters where job_order_id = ${j.id}))`;
      if (okp.length !== params.length) return { code: 422, key: "invalid", text: "A chosen parameter is not available.", field: "parameterIds" };
      let batch;
      try {
        [batch] = await tx`insert into batches (job_order_id, company_id, batch_no, batch_date, deadline_on, standard, coc_no, priority, notes, status, created_by)
          values (${j.id}, ${j.company_id}, ${b.batchNo}, ${b.batchDate}, ${b.deadlineOn ?? null}, ${b.standard}::standard_family, ${b.cocNo}, ${b.priority}, ${b.notes}, 'created', ${req.user!.userId}) returning id`;
      } catch (e) { if (isUnique(e)) return { code: 409, key: "duplicate", text: `${b.batchNo} is already used.`, field: "batchNo" }; throw e; }
      await tx`insert into batch_parameters (batch_id, parameter_id) select ${batch!.id}, x from unnest(${params}::uuid[]) as x`;
      await tx`update samples set batch_id = ${batch!.id} where id = any(${ids}::uuid[])`;
      const late = smp.filter((s) => s.state === "awaiting_arrival").length;
      await logStep(tx, batch!.id, null, "created", "Batch created", `${ids.length} sample${ids.length === 1 ? "" : "s"} from ${j.order_no}${late ? `, ${late} returned earlier` : ""}`, req.user!.userId);
      return { ok: true as const, id: batch!.id as string, orderNo: j.order_no as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    // N1: the people who receive it hear about it (App plan 5.1)
    const [me] = await runAs(req, (tx) => tx`select full_name from profiles where id = ${req.user!.userId}`);
    await runAsActor(req, SCREEN, (tx) => notify(tx, { event: "N1", title: `${b.batchNo} is ready to receive`, body: `Created by ${me?.full_name ?? "a colleague"} for ${res.orderNo}.`, link: `/batches/${b.batchNo}/reception` }, { roles: ["prep", "lab_admin"] }, req.user!.userId));
    return reply.code(201).send({ id: res.id, batchNo: b.batchNo });
  });

  /* ================= the batch page ================= */
  r.get("/batches/:no", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const out = await runAs(req, async (tx) => {
      const [b] = await tx`select b.id, b.batch_no, b.batch_date::text as batch_date, b.deadline_on::text as deadline_on, b.standard::text as standard, b.coc_no, b.priority, b.notes, b.branch_code,
          b.status::text as stored, ${shownStatus(tx)} as shown, b.created_at, b.reception_confirmed_at, b.prep_finished_at, b.analysis_started_at, b.analysis_finished_at, b.completed_at, b.expected_at_confirm,
          cb.full_name as created_by, j.id as order_id, j.order_no, j.status::text as order_status, c.id as company_id, c.name as company_name, c.code as company_short,
          (select min(arrived_at) from samples where batch_id = b.id) as first_arrived,
          d.roa_no, d.file_name as roa_file, d.size_bytes as roa_size, d.uploaded_at as roa_at, up.full_name as roa_by
         from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = b.company_id left join profiles cb on cb.id = b.created_by
           left join batch_documents d on d.batch_id = b.id left join profiles up on up.id = d.uploaded_by where b.batch_no = ${req.params.no}`;
      if (!b) return null;
      const [[n], returned, params] = await Promise.all([
        tx`select count(*)::int as in_batch, count(*) filter (where arrived_at is not null)::int as arrived, count(*) filter (where received_at is not null)::int as received, count(*) filter (where on_hold)::int as held
           from samples where batch_id = ${b.id}`,
        tx`select client_ref from samples where released_from_batch_id = ${b.id} and batch_id is null order by row_no`,
        tx`select p.code, p.label from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = ${b.id} order by p.sort_order, p.code`,
      ]);
      return { b, n: n!, returned, params };
    });
    if (!out) return fail(reply, 404, "not_found", "This batch was not found.");
    const { b, n } = out;
    return {
      id: b.id, batchNo: b.batch_no, status: b.shown, stored: b.stored, batchDate: b.batch_date, deadlineOn: b.deadline_on, standard: b.standard, cocNo: b.coc_no, priority: b.priority, notes: b.notes, branch: b.branch_code,
      order: { id: b.order_id, orderNo: b.order_no, status: b.order_status }, company: { id: b.company_id, name: b.company_name, short: b.company_short },
      counts: { inBatch: n.in_batch, arrived: n.arrived, received: n.received, held: n.held, expected: b.expected_at_confirm ?? n.in_batch },
      returned: out.returned.map((x) => x.client_ref as string),
      parameters: out.params.map((p) => ({ code: p.code, label: p.label })),
      dates: { createdAt: b.created_at, createdBy: b.created_by, firstArrivedAt: b.first_arrived, receptionConfirmedAt: b.reception_confirmed_at, prepFinishedAt: b.prep_finished_at, analysisStartedAt: b.analysis_started_at, analysisFinishedAt: b.analysis_finished_at, completedAt: b.completed_at },
      roa: b.roa_no ? { roaNo: b.roa_no, fileName: b.roa_file, sizeBytes: Number(b.roa_size), uploadedAt: b.roa_at, uploadedBy: b.roa_by } : null,
    };
  });

  /* ================= the batch number ================= */
  r.put("/batches/:no/number", { preHandler: editNumber, schema: { params: NoParam, body: NumberBody } }, async (req, reply) => {
    const to = req.body.batchNo;
    const res = await runAs(req, async (tx) => {
      const [b] = await tx`select id, batch_no, status::text as status from batches where batch_no = ${req.params.no} for update`;
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: "The batch number can change only while the batch is Created." };
      if (b.batch_no === to) return { ok: true as const };
      const [dup] = await tx`select 1 from batches where batch_no = ${to}`;
      if (dup) return { code: 409, key: "duplicate", text: `${to} is already used.`, field: "batchNo" };
      try { await tx`update batches set batch_no = ${to} where id = ${b.id}`; } catch (e) { if (isUnique(e)) return { code: 409, key: "duplicate", text: `${to} is already used.`, field: "batchNo" }; throw e; }
      await logStep(tx, b.id, "created", "created", "Batch number changed", `${b.batch_no} to ${to}`, req.user!.userId);
      return { ok: true as const };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return { ok: true, batchNo: to };
  });

  /* ================= the log ================= */
  r.get("/batches/:no/log", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const rows = await runAs(req, async (tx) => {
      const [b] = await tx`select id from batches where batch_no = ${req.params.no}`;
      if (!b) return null;
      return tx`select l.id::text, l.action, l.note, l.to_status::text as to_status, l.at, p.full_name as by from batch_status_log l left join profiles p on p.id = l.by_user where l.batch_id = ${b.id} order by l.at desc, l.id desc`;
    });
    if (!rows) return fail(reply, 404, "not_found", "This batch was not found.");
    return { items: rows.map((l) => ({ id: l.id, action: l.action, note: l.note, at: l.at, by: l.by, when: dayText(l.at as Date) })) };
  });

  await batchReceptionRoutes(app);
}
