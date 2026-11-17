// Job order routes, slice B (Job_Order_Build_Design.md sections 5 to 7; frames 03-03-06 to 12): the sample list by client reference
// (one save of adds, edits and removals, refused as a whole on a duplicate), Mark as not received and Restore, the files kept with the
// job order (private bucket job-order-files, one-hour signed links) and the History tab (the audit rows of the job order).
// Registered by orderRoutes, so the sign-in hook applies; writes run as the user (RLS checks again) under the screen "Job orders".
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createHash, randomUUID } from "node:crypto";
import multipart from "@fastify/multipart";
import { z } from "zod";
import { asUser, system, type Tx } from "../db";
import { requireAny } from "../auth";
import { admin } from "../supabase";

const SCREEN = "Job orders";
const BUCKET = "job-order-files";
const MAX_FILE = 20 * 1024 * 1024;
const uuid = z.string().uuid();
const opt = (max: number) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));
const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string) => reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}) });
const NoParam = z.object({ no: z.string().max(40) });
const NoId = z.object({ no: z.string().max(40), id: uuid });
const TZ = "Asia/Makassar";
const day = (iso: string | Date) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ });

/* ================= samples ================= */
type SampleState = "expected" | "in_batch" | "received" | "awaiting_arrival" | "not_received" | "held";
const STATE_WORD: Record<SampleState, string> = { expected: "expected", in_batch: "in a batch", received: "received", awaiting_arrival: "awaiting arrival", not_received: "marked not received", held: "held in a batch" };
/** Expected and Awaiting arrival rows can still change; a row in a batch, received or marked not received is locked (frame 07, P5). */
const editable = (s: SampleState) => s === "expected" || s === "awaiting_arrival";
const lockWhy = (s: { state: SampleState; batch_no: string | null; received_at: string | null; received_by: string | null }) =>
  s.state === "received" ? `Received on ${day(s.received_at!)}${s.received_by ? ` by ${s.received_by}` : ""}. Received samples can't be edited.`
  : s.state === "in_batch" || s.state === "held" ? `In batch ${s.batch_no ?? ""}. Samples in a batch can't be edited.`.replace("  ", " ")
  : s.state === "not_received" ? "Marked not received. Restore it to edit." : null;

const Ref = z.string().trim().min(1, "Enter the client reference.").max(60, "At most 60 characters.").regex(/^[^\t\r\n]+$/, "One line only.");
const Depth = z.number().min(0, "Zero or more.").max(99999.99, "Too deep.").nullable().optional();
const SampleRow = z.object({ id: uuid.optional(), clientRef: Ref, description: opt(200), drillHole: opt(60), depthFrom: Depth, depthTo: Depth, remarks: opt(300) });
const SamplesBody = z.object({ rows: z.array(SampleRow).max(2000), removed: z.array(uuid).max(2000).default([]) });

/* ================= files ================= */
// Types by extension, each with the content type it is stored under and a check of its first bytes.
const zip = (b: Buffer) => b.subarray(0, 4).toString("latin1") === "PK\x03\x04";
const ole = (b: Buffer) => b.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
const TYPES: Record<string, { mime: string; kind: string; ok: (b: Buffer) => boolean }> = {
  pdf: { mime: "application/pdf", kind: "pdf", ok: (b) => b.subarray(0, 4).toString("latin1") === "%PDF" },
  png: { mime: "image/png", kind: "image", ok: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  jpg: { mime: "image/jpeg", kind: "image", ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  jpeg: { mime: "image/jpeg", kind: "image", ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  webp: { mime: "image/webp", kind: "image", ok: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "sheet", ok: zip },
  xlsm: { mime: "application/vnd.ms-excel.sheet.macroEnabled.12", kind: "sheet", ok: zip },
  xls: { mime: "application/vnd.ms-excel", kind: "sheet", ok: ole },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "doc", ok: zip },
  doc: { mime: "application/msword", kind: "doc", ok: ole },
  csv: { mime: "text/csv", kind: "csv", ok: (b) => !b.subarray(0, 4096).includes(0) },
};
const extOf = (name: string) => (name.match(/\.([A-Za-z0-9]{1,5})$/)?.[1] ?? "").toLowerCase();

/* ================= history ================= */
const STATUS_WORD: Record<string, string> = { draft: "Draft", awaiting_samples: "Awaiting samples", in_progress: "In progress", reported: "Reported", delivered: "Delivered", closed: "Closed", cancelled: "Cancelled" };
const JO_FIELDS: Record<string, string> = {
  order_no: "Number", company_id: "Company", contact_id: "Contact", client_reference: "Client reference", service_id: "Service", standards: "Standard", preparation: "Preparation",
  expected_samples: "Expected samples", sample_type: "Sample type", due_on: "Due date", priority: "Priority", signatory_name: "Signatory", signatory_title: "Signatory title",
  notes: "Notes", status: "Status", cancel_reason: "Cancel reason",
};
const S_FIELDS: Record<string, string> = {
  client_ref: "Client reference", client_description: "Client description", drill_hole_text: "Drill hole or lot", depth_from: "Depth from (m)", depth_to: "Depth to (m)", remarks: "Remarks",
  sample_type: "Sample type", batch_id: "Batch", released_from_batch_id: "Released from batch", sample_no: "Sample ID", sample_code: "Sample code", lot: "Lot", received_at: "Received",
  arrived_at: "Arrived", mass_received_kg: "Mass received (kg)", condition: "Condition", condition_remark: "Condition remark", on_hold: "On hold", hold_reason: "Hold reason",
  not_received_reason: "Not received reason", not_received_note: "Note",
};
interface Change { field: string; before: string | null; after: string | null }
interface Entry { id: string; at: string; actor: string | null; action: string; recordType: string; record: string; summary: string; changes: Change[]; note: string | null }
interface AuditRow { id: string; table_name: string; record_id: string; record_label: string | null; action: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null; actor_name: string | null; at: Date; request_id: string | null }

export async function orderSliceBRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  await app.register(multipart, { limits: { fileSize: MAX_FILE + 1, files: 1 } });
  const run = <T>(req: { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string }, fn: (tx: Tx) => Promise<T>) =>
    asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const uid = (req: { user?: { userId: string } }) => req.user!.userId;
  const readOrders = requireAny("order.read"), editOrders = requireAny("order.edit");
  const closedWhy = (status: string) => (status === "cancelled" ? "This job order is cancelled." : status === "closed" ? "This job order is closed." : null);

  /* ---------- the sample list ---------- */
  const sampleRows = (tx: Tx, orderId: string) => tx`
    select s.id, s.row_no, s.client_ref, s.client_description, s.remarks, s.drill_hole_text, s.depth_from::text as depth_from, s.depth_to::text as depth_to,
      s.state, s.batch_id, b.batch_no, s.sample_no, s.sample_code, s.received_at, rp.full_name as received_by, s.released_from_batch_id, rb.batch_no as released_from,
      s.not_received_reason, s.not_received_note, s.not_received_at, np.full_name as not_received_by, (i.sample_id is not null) as matched
    from v_samples s left join batches b on b.id = s.batch_id left join batches rb on rb.id = s.released_from_batch_id
      left join profiles rp on rp.id = s.received_by left join profiles np on np.id = s.not_received_by left join sample_intervals i on i.sample_id = s.id
    where s.job_order_id = ${orderId} order by s.row_no`;

  r.get("/orders/:no/samples", { preHandler: readOrders, schema: { params: NoParam } }, async (req, reply) => {
    const out = await run(req, async (tx) => {
      const [j] = await tx`select id, status::text as status from job_orders where order_no = ${req.params.no}`;
      if (!j) return null;
      const [rows, reasons] = await Promise.all([
        sampleRows(tx, j.id),
        tx`select value, needs_remark from lookups where list_key = 'not_received_reason' and active order by sort_order, value`,
      ]);
      return { j, rows, reasons };
    });
    if (!out) return fail(reply, 404, "not_found", "This job order was not found.");
    const closed = closedWhy(out.j.status);
    return {
      canEdit: !closed, why: closed,
      reasons: out.reasons.map((x) => ({ value: x.value as string, needsNote: x.needs_remark as boolean })),
      items: out.rows.map((s) => ({
        id: s.id, rowNo: s.row_no, clientRef: s.client_ref, description: s.client_description, remarks: s.remarks, drillHole: s.drill_hole_text, depthFrom: s.depth_from, depthTo: s.depth_to,
        state: s.state, batchNo: s.batch_no, sampleNo: s.sample_no, sampleCode: s.sample_code, receivedAt: s.received_at, receivedBy: s.received_by, releasedFrom: s.released_from,
        notReceived: s.not_received_at ? { reason: s.not_received_reason, note: s.not_received_note, at: s.not_received_at, by: s.not_received_by } : null,
        matched: s.matched, locked: !editable(s.state as SampleState), lockWhy: lockWhy(s as never),
        canRemove: s.state === "expected" && !s.released_from_batch_id, canMarkNotReceived: s.state === "expected" || s.state === "awaiting_arrival",
      })),
    };
  });

  r.put("/orders/:no/samples", { preHandler: editOrders, schema: { params: NoParam, body: SamplesBody } }, async (req, reply) => {
    const b = req.body;
    for (const [i, row] of b.rows.entries()) {
      if ((row.depthFrom == null) !== (row.depthTo == null)) return fail(reply, 422, "invalid", `${row.clientRef}: enter both depths, from and to.`, `rows.${i}.depth`);
      if (row.depthFrom != null && row.depthTo != null && row.depthTo <= row.depthFrom) return fail(reply, 422, "invalid", `${row.clientRef}: the depth to must be more than the depth from.`, `rows.${i}.depth`);
    }
    const res = await run(req, async (tx) => {
      const [j] = await tx`select id, company_id, status::text as status, sample_type from job_orders where order_no = ${req.params.no} for update`;
      if (!j) return { code: 404, key: "not_found", text: "This job order was not found." };
      const closed = closedWhy(j.status); if (closed) return { code: 409, key: "locked", text: closed };
      const cur = await tx`select s.id, s.row_no, s.client_ref, s.state, s.released_from_batch_id from v_samples s where s.job_order_id = ${j.id} order by s.row_no`;
      const byId = new Map(cur.map((c) => [c.id as string, c]));
      const updates = b.rows.filter((x) => x.id), adds = b.rows.filter((x) => !x.id);
      for (const u of updates) {
        const c = byId.get(u.id!);
        if (!c) return { code: 409, key: "gone", text: `${u.clientRef} was removed by someone else. Reload the list.` };
        if (!editable(c.state)) return { code: 409, key: "locked", text: `${c.client_ref} is ${STATE_WORD[c.state as SampleState]}, so it can't change.` };
      }
      const removed = new Set(b.removed.filter((id) => byId.has(id)));
      for (const id of removed) {
        const c = byId.get(id)!;
        if (c.state !== "expected" || c.released_from_batch_id) return { code: 409, key: "locked", text: `${c.client_ref} is ${STATE_WORD[c.state as SampleState]}, so it can't be removed.` };
      }
      // duplicates in the list as it will be after the save, ignoring case
      const upd = new Map(updates.map((u) => [u.id!, u]));
      const final = [...cur.filter((c) => !removed.has(c.id)).map((c) => (upd.get(c.id)?.clientRef ?? c.client_ref) as string), ...adds.map((a) => a.clientRef)];
      const seen = new Map<string, number>(), dups: string[] = [];
      final.forEach((ref, i) => { const k = ref.toLowerCase(); if (seen.has(k)) dups.push(ref); else seen.set(k, i); });
      if (dups.length) return { code: 422, key: "duplicate", text: `${dups[0]} is already on this job order${dups.length > 1 ? `, and ${dups.length - 1} more` : ""}. Each client reference once.`, field: "rows" };

      if (removed.size) await tx`delete from samples where id = any(${[...removed]}::uuid[]) and job_order_id = ${j.id}`;
      // a swap of two references would hit the unique key half way: park the changed ones first
      const changedRef = updates.filter((u) => byId.get(u.id!)!.client_ref !== u.clientRef);
      const taken = new Set(cur.filter((c) => !removed.has(c.id)).map((c) => (c.client_ref as string)));
      if (changedRef.some((u) => taken.has(u.clientRef))) await tx`update samples set client_ref = '~' || id::text where id = any(${changedRef.map((u) => u.id!)}::uuid[])`;
      const pack = (x: z.infer<typeof SampleRow>) => ({ id: x.id ?? null, ref: x.clientRef, descr: x.description, hole: x.drillHole, dfrom: x.depthFrom ?? null, dto: x.depthTo ?? null, remarks: x.remarks });
      if (updates.length) await tx`update samples s set client_ref = v.ref, client_description = v.descr, drill_hole_text = v.hole, depth_from = v.dfrom, depth_to = v.dto, remarks = v.remarks
        from jsonb_to_recordset(${tx.json(updates.map(pack) as never)}) as v(id uuid, ref text, descr text, hole text, dfrom numeric, dto numeric, remarks text)
        where s.id = v.id and s.job_order_id = ${j.id}`;
      let added: string[] = [];
      if (adds.length) {
        const start = Math.max(0, ...cur.filter((c) => !removed.has(c.id)).map((c) => c.row_no as number));
        const rows = adds.map((a, i) => ({ ...pack(a), row_no: start + i + 1 }));
        added = (await tx`insert into samples (job_order_id, row_no, client_ref, client_description, drill_hole_text, depth_from, depth_to, remarks, sample_type)
          select ${j.id}, v.row_no, v.ref, v.descr, v.hole, v.dfrom, v.dto, v.remarks, ${j.sample_type}
          from jsonb_to_recordset(${tx.json(rows as never)}) as v(row_no int, ref text, descr text, hole text, dfrom numeric, dto numeric, remarks text) order by v.row_no
          returning id`).map((x) => x.id as string);
      }
      // drill holes: a row whose hole matches one of the client's codes (any case) and has both depths gets its interval (section 6)
      const touched = [...updates.map((u) => u.id!), ...added];
      if (touched.length) {
        const matched = await tx`insert into sample_intervals (sample_id, drill_hole_id, depth_from, depth_to)
          select s.id, d.id, s.depth_from, s.depth_to from samples s
            join drill_holes d on d.company_id = ${j.company_id} and lower(d.code) = lower(s.drill_hole_text) and d.archived_at is null
          where s.id = any(${touched}::uuid[]) and s.depth_from is not null and s.depth_to is not null
          on conflict (sample_id) do update set drill_hole_id = excluded.drill_hole_id, depth_from = excluded.depth_from, depth_to = excluded.depth_to
          returning sample_id`;
        const keep = matched.map((m) => m.sample_id as string);
        await tx`delete from sample_intervals where sample_id = any(${touched}::uuid[]) and not (sample_id = any(${keep}::uuid[]))`;
      }
      return { ok: true as const, added: added.length, updated: updates.length, removed: removed.size };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return res;
  });

  /* ---------- not received and restore (CSO, R5): a sample in no batch and not received ---------- */
  const NotReceived = z.object({ reason: z.string().trim().min(1, "Choose the reason.").max(80), note: z.string().trim().max(300).optional().default("") });
  r.post("/orders/:no/samples/:id/not-received", { preHandler: editOrders, schema: { params: NoId, body: NotReceived } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [s] = await tx`select s.id, s.client_ref, s.state, j.status::text as status from v_samples s join job_orders j on j.id = s.job_order_id
        where s.id = ${req.params.id} and j.order_no = ${req.params.no} for update of j`;
      if (!s) return [404, "not_found", "This sample was not found.", undefined] as const;
      const closed = closedWhy(s.status); if (closed) return [409, "locked", closed, undefined] as const;
      if (s.state !== "expected" && s.state !== "awaiting_arrival") return [409, "locked", `${s.client_ref} is ${STATE_WORD[s.state as SampleState]}, so it can't be marked not received.`, undefined] as const;
      const [reason] = await tx`select value, needs_remark from lookups where list_key = 'not_received_reason' and active and value = ${req.body.reason}`;
      if (!reason) return [422, "invalid", "Choose one of the reasons.", "reason"] as const;
      if (reason.needs_remark && req.body.note.length < 3) return [422, "invalid", "Add a note for this reason.", "note"] as const;
      await tx`update samples set not_received_reason = ${reason.value}, not_received_note = ${req.body.note || null}, not_received_by = ${uid(req)}, not_received_at = now() where id = ${s.id}`;
      return [200, "ok", s.client_ref as string, undefined] as const;
    });
    return res[0] === 200 ? { ok: true, clientRef: res[2] } : fail(reply, res[0], res[1], res[2], res[3]);
  });
  r.post("/orders/:no/samples/:id/restore", { preHandler: editOrders, schema: { params: NoId } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [s] = await tx`select s.id, s.client_ref, s.not_received_at, j.status::text as status from samples s join job_orders j on j.id = s.job_order_id
        where s.id = ${req.params.id} and j.order_no = ${req.params.no} for update of j`;
      if (!s) return [404, "not_found", "This sample was not found."] as const;
      const closed = closedWhy(s.status); if (closed) return [409, "locked", closed] as const;
      if (!s.not_received_at) return [409, "not_marked", `${s.client_ref} is not marked not received.`] as const;
      await tx`update samples set not_received_reason = null, not_received_note = null, not_received_by = null, not_received_at = null where id = ${s.id}`;
      return [200, "ok", s.client_ref as string] as const;
    });
    return res[0] === 200 ? { ok: true, clientRef: res[2] } : fail(reply, res[0], res[1], res[2]);
  });

  /* ---------- files ---------- */
  r.get("/orders/:no/files", { preHandler: readOrders, schema: { params: NoParam } }, async (req, reply) => {
    const out = await run(req, async (tx) => {
      const [j] = await tx`select id, status::text as status from job_orders where order_no = ${req.params.no}`;
      if (!j) return null;
      const rows = await tx`select f.id, f.file_name, f.size_bytes, f.storage_path, f.uploaded_at, p.full_name as uploaded_by
        from job_order_files f left join profiles p on p.id = f.uploaded_by where f.job_order_id = ${j.id} order by f.uploaded_at desc`;
      return { j, rows };
    });
    if (!out) return fail(reply, 404, "not_found", "This job order was not found.");
    // one signed link per file so the download keeps the file's own name
    const urls = await Promise.all(out.rows.map((f) => admin.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600, { download: f.file_name as string }).then((x) => x.data?.signedUrl ?? null)));
    const closed = closedWhy(out.j.status);
    return {
      canEdit: !closed, why: closed,
      items: out.rows.map((f, i) => ({ id: f.id, fileName: f.file_name, sizeBytes: Number(f.size_bytes), kind: TYPES[extOf(f.file_name)]?.kind ?? "other", uploadedAt: f.uploaded_at, uploadedBy: f.uploaded_by, url: urls[i] })),
    };
  });

  r.post("/orders/:no/files", { preHandler: editOrders, schema: { params: NoParam } }, async (req, reply) => {
    const file = await req.file().catch(() => null);
    if (!file) return fail(reply, 400, "no_file", "Choose a file first.");
    const buf = await file.toBuffer().catch(() => null);
    if (!buf || buf.length > MAX_FILE || file.file.truncated) return fail(reply, 413, "too_big", "The file is larger than 20 MB.");
    if (!buf.length) return fail(reply, 422, "empty", "The file is empty.");
    const ext = extOf(file.filename), t = TYPES[ext];
    if (!t || !t.ok(buf)) return fail(reply, 415, "bad_type", "Use a PDF, image, Excel, Word or CSV file.");
    const name = file.filename.replace(/[\\/\u0000-\u001f]/g, "_").slice(-200);
    const [j] = await run(req, (tx) => tx`select id, status::text as status from job_orders where order_no = ${req.params.no}`);
    if (!j) return fail(reply, 404, "not_found", "This job order was not found.");
    const closed = closedWhy(j.status); if (closed) return fail(reply, 409, "locked", closed);
    const path = `${j.id}/${randomUUID()}.${ext}`;
    const up = await admin.storage.from(BUCKET).upload(path, buf, { contentType: t.mime });
    if (up.error) throw up.error;
    try {
      const [row] = await run(req, (tx) => tx`insert into job_order_files (job_order_id, storage_path, file_name, size_bytes, sha256, uploaded_by)
        values (${j.id}, ${path}, ${name}, ${buf.length}, ${createHash("sha256").update(buf).digest("hex")}, ${uid(req)}) returning id`);
      return reply.code(201).send({ id: row!.id, fileName: name });
    } catch (e) { await admin.storage.from(BUCKET).remove([path]); throw e; }
  });

  r.delete("/orders/:no/files/:id", { preHandler: editOrders, schema: { params: NoId } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [f] = await tx`select f.id, f.storage_path, f.file_name, j.status::text as status from job_order_files f join job_orders j on j.id = f.job_order_id
        where f.id = ${req.params.id} and j.order_no = ${req.params.no}`;
      if (!f) return null;
      const closed = closedWhy(f.status);
      if (closed) return { locked: closed, path: "", name: "" };
      await tx`delete from job_order_files where id = ${f.id}`;
      return { locked: null, path: f.storage_path as string, name: f.file_name as string };
    });
    if (!res) return fail(reply, 404, "not_found", "This file was not found.");
    if (res.locked) return fail(reply, 409, "locked", res.locked);
    await admin.storage.from(BUCKET).remove([res.path]);
    return { ok: true, fileName: res.name };
  });

  /* ---------- history: the audit rows of the job order, its parameters, samples and files ---------- */
  r.get("/orders/:no/history", { preHandler: readOrders, schema: { params: NoParam } }, async (req, reply) => {
    const [j] = await run(req, (tx) => tx`select id, order_no from job_orders where order_no = ${req.params.no}`);
    if (!j) return fail(reply, 404, "not_found", "This job order was not found.");
    // audit_log is audit.read only: read after the order.read check above, with the API's own connection
    const { rows, names } = await system({ requestId: req.id }, async (tx) => {
      const rows = (await tx`select id::text, table_name, record_id, record_label, action, before, after, actor_name, at, request_id from audit_log
        where (table_name = 'job_orders' and record_id = ${j.id})
           or (table_name in ('samples', 'job_order_files', 'job_order_parameters', 'job_order_group_items') and coalesce(after->>'job_order_id', before->>'job_order_id') = ${j.id})
        order by at desc, id desc limit 2000`) as unknown as AuditRow[];
      const ids = new Set<string>();
      for (const a of rows) for (const v of [a.before, a.after]) if (v) for (const k of ["company_id", "contact_id", "service_id", "parameter_id", "item_id", "batch_id", "released_from_batch_id"]) if (typeof v[k] === "string") ids.add(v[k] as string);
      const list = [...ids];
      const names = new Map<string, string>();
      if (list.length) {
        const found = await tx`select id::text, name from companies where id = any(${list}::uuid[])
          union all select id::text, full_name from company_contacts where id = any(${list}::uuid[])
          union all select id::text, name || ' v' || version from services where id = any(${list}::uuid[])
          union all select id::text, label from parameters where id = any(${list}::uuid[])
          union all select id::text, code from parameter_group_items where id = any(${list}::uuid[])
          union all select id::text, batch_no from batches where id = any(${list}::uuid[])`;
        for (const f of found) names.set(f.id as string, f.name as string);
      }
      return { rows, names };
    });
    return { items: buildHistory(rows, names, j.order_no as string) };
  });
}

/** Turn audit rows into History entries (Audit log row layout): one per change, with a paste of many samples or a parameter edit as one entry. */
function buildHistory(rows: AuditRow[], names: Map<string, string>, orderNo: string): Entry[] {
  const fmt = (k: string, v: unknown): string | null => {
    if (v === null || v === undefined || v === "") return null;
    if (Array.isArray(v)) return v.length ? v.map((x) => (x === "GBT" ? "GB/T" : String(x))).join(", ") : null;
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (k === "status") return STATUS_WORD[v as string] ?? String(v);
    if (k.endsWith("_id")) return names.get(v as string) ?? "Removed record";
    if (k === "due_on") return new Date(`${v}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    if (k.endsWith("_at")) return new Date(v as string).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ });
    if (k.startsWith("depth_")) return Number(v).toFixed(2);                       // numeric(8,2) comes out of jsonb as 5.1
    return String(v);
  };
  const diff = (fields: Record<string, string>, b: Record<string, unknown> | null, a: Record<string, unknown> | null): Change[] =>
    Object.entries(fields).flatMap(([k, label]) => {
      const x = fmt(k, b?.[k]), y = fmt(k, a?.[k]);
      return x === y ? [] : [{ field: label, before: x, after: y }];
    });
  const summary = (c: Change[]) => (c.length === 0 ? "" : c.length === 1 ? c[0]!.field : `${c.length} fields`);
  const base = (a: AuditRow) => ({ id: a.id, at: new Date(a.at).toISOString(), actor: a.actor_name });
  const out: Entry[] = [];
  // rows of one request (one save) sit together: same request id and the same transaction time
  const groups = new Map<string, AuditRow[]>();
  for (const a of rows) { const k = a.request_id ?? `row-${a.id}`; (groups.get(k) ?? groups.set(k, []).get(k)!).push(a); }
  for (const g of groups.values()) {
    const created = g.some((a) => a.table_name === "job_orders" && a.action === "insert");
    // a swap parks a reference as "~id" first: the real change is from the value before the parking
    const parked = new Map(g.filter((a) => a.table_name === "samples" && a.action === "update" && String(a.after?.client_ref ?? "").startsWith("~")).map((a) => [a.record_id, a.before ?? {}]));
    for (const a of g) {
      if (a.table_name === "job_orders") {
        if (a.action === "insert") {
          const c = diff(JO_FIELDS, null, a.after);
          out.push({ ...base(a), action: "Created", recordType: "Job order", record: orderNo, summary: `${c.length} fields`, changes: c, note: null });
        } else if (a.action === "update") {
          const c = diff(JO_FIELDS, a.before, a.after);
          if (!c.length) continue;
          const st = a.before?.status !== a.after?.status ? (a.after?.status as string) : null;
          const action = st === "awaiting_samples" && a.before?.status === "draft" ? "Submitted" : st === "cancelled" ? "Cancelled" : st === "closed" ? "Closed" : st ? "Status changed" : "Updated";
          out.push({ ...base(a), action, recordType: "Job order", record: orderNo, summary: summary(c), changes: c, note: st === "cancelled" ? ((a.after?.cancel_reason as string) ?? null) : null });
        }
      } else if (a.table_name === "samples" && a.action === "update") {
        const b = a.before ?? {}, n = a.after ?? {};
        const ref = (n.client_ref ?? b.client_ref) as string;
        if (!b.not_received_at && n.not_received_at) out.push({ ...base(a), action: "Marked not received", recordType: "Sample", record: ref, summary: "Reason", note: null,
          changes: [{ field: "Reason", before: null, after: fmt("x", n.not_received_reason) }, ...(n.not_received_note ? [{ field: "Note", before: null, after: String(n.not_received_note) }] : [])] });
        else if (b.not_received_at && !n.not_received_at) out.push({ ...base(a), action: "Restored", recordType: "Sample", record: ref, summary: "", changes: [], note: `Was: ${b.not_received_reason ?? "not received"}` });
        else {
          if (String(n.client_ref ?? "").startsWith("~")) continue;                    // the parking step of a swap
          const c = diff(S_FIELDS, String(b.client_ref ?? "").startsWith("~") ? parked.get(a.record_id) ?? b : b, n);
          if (c.length) out.push({ ...base(a), action: "Updated", recordType: "Sample", record: ref, summary: summary(c), changes: c, note: null });
        }
      }
    }
    // a paste or a save: the added and removed samples of one request are one entry each
    for (const [act, label] of [["insert", "Samples added"], ["delete", "Samples removed"]] as const) {
      const s = g.filter((a) => a.table_name === "samples" && a.action === act);
      if (!s.length) continue;
      const rec = (a: AuditRow) => (act === "insert" ? a.after : a.before) ?? {};
      const what = (v: Record<string, unknown>) => [v.client_description, v.drill_hole_text, v.depth_from != null && v.depth_to != null ? `${fmt("depth_from", v.depth_from)}-${fmt("depth_to", v.depth_to)} m` : null].filter(Boolean).join(", ") || "—";
      const changes = s.slice().reverse().map((a) => ({ field: String(rec(a).client_ref), before: act === "delete" ? what(rec(a)) : null, after: act === "insert" ? what(rec(a)) : null }));
      out.push({ ...base(s[0]!), id: `${s[0]!.id}-${act}`, action: label, recordType: s.length === 1 ? "Sample" : "Samples", record: s.length === 1 ? String(rec(s[0]!).client_ref) : `${s.length} samples`,
        summary: s.length === 1 ? "1 sample" : `${s.length} samples`, changes, note: null });
    }
    // parameters and group items: the net change of one edit (an edit rewrites the set)
    if (!created) {
      const net = (table: string) => {
        const key = table === "job_order_parameters" ? "parameter_id" : "item_id";
        const ins = new Set(g.filter((a) => a.table_name === table && a.action === "insert").map((a) => a.after![key] as string));
        const del = new Set(g.filter((a) => a.table_name === table && a.action === "delete").map((a) => a.before![key] as string));
        const name = (id: string) => names.get(id) ?? "Removed record";
        return { added: [...ins].filter((x) => !del.has(x)).map(name), removed: [...del].filter((x) => !ins.has(x)).map(name) };
      };
      const p = net("job_order_parameters"), it = net("job_order_group_items");
      const changes: Change[] = [
        ...(p.added.length ? [{ field: "Parameters added", before: null, after: p.added.join(", ") }] : []),
        ...(p.removed.length ? [{ field: "Parameters removed", before: p.removed.join(", "), after: null }] : []),
        ...(it.added.length ? [{ field: "Items added", before: null, after: it.added.join(", ") }] : []),
        ...(it.removed.length ? [{ field: "Items removed", before: it.removed.join(", "), after: null }] : []),
      ];
      const first = g.find((a) => a.table_name === "job_order_parameters" || a.table_name === "job_order_group_items");
      if (changes.length && first) out.push({ ...base(first), id: `${first.id}-params`, action: "Parameters changed", recordType: "Job order", record: orderNo, summary: summary(changes), changes, note: null });
    }
    for (const a of g.filter((x) => x.table_name === "job_order_files")) {
      const f = (a.after ?? a.before)!;
      if (a.action === "insert" || a.action === "delete")
        out.push({ ...base(a), action: a.action === "insert" ? "File added" : "File removed", recordType: "File", record: String(f.file_name), summary: "", changes: [], note: null });
    }
  }
  return out.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0)).slice(0, 300);
}
