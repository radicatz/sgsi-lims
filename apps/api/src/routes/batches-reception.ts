// Batch routes, part 2: Reception (Batch_Build_Design.md sections 5, 7 and 9; spec S-18, 6.1; frames 04-02-01 to 09). The rows of a batch as the
// lab receives them: arrival (which gives the Sample ID and the sample code), mass, condition, photos, labels, hold, and Confirm reception.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import multipart from "@fastify/multipart";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAny } from "../auth";
import type { Tx } from "../db";
import { NoId, NoParam, SCREEN, fail, fillPattern, idPatterns, logStep, normLot, notify, runAs, runAsActor, todayIso, uuid } from "../batch-lib";
import { admin } from "../supabase";

const PHOTOS = "sample-photos";
const MAX_PHOTO = 10 * 1024 * 1024;
const MAX_PHOTOS_PER_SAMPLE = 10;
const IMAGES: Record<string, { mime: string; ok: (b: Buffer) => boolean }> = {
  png: { mime: "image/png", ok: (b) => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
  jpg: { mime: "image/jpeg", ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  jpeg: { mime: "image/jpeg", ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  webp: { mime: "image/webp", ok: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
};
const extOf = (name: string) => (name.match(/\.([A-Za-z0-9]{1,5})$/)?.[1] ?? "").toLowerCase();

const Patch = z.object({
  arrived: z.boolean().optional(),
  mass: z.string().trim().max(12).nullable().optional(),
  condition: z.string().trim().max(60).nullable().optional(),
  conditionRemark: z.string().trim().max(300).nullable().optional(),
  lot: z.string().trim().max(10).optional(),
});
const Hold = z.object({ reason: z.string().trim().min(1, "Choose the reason.").max(80), note: z.string().trim().max(300).optional().default("") });
const Labels = z.object({ sampleIds: z.array(uuid).min(1, "Choose at least one sample.").max(2000), reason: z.string().trim().max(200).optional().default("") });
const Confirm = z.object({ fewer: z.boolean().optional().default(false) });

interface Row {
  id: string; row_no: number; client_ref: string; client_description: string | null; sample_no: string | null; sample_code: string | null; lot: string;
  arrived_at: Date | null; mass: string | null; condition: string | null; condition_remark: string | null; label_status: string; label_print_count: number;
  label_at: string | null; on_hold: boolean; hold_reason: string | null; hold_note: string | null; received_at: Date | null; photos: number; thumb: string | null;
}
const ROWS = (tx: Tx, batchId: string, only?: string) => tx`select s.id, s.row_no, s.client_ref, s.client_description, s.sample_no, s.sample_code, s.lot, s.arrived_at,
    (s.mass_received_kg::numeric(10,2))::text as mass, s.condition, s.condition_remark, s.label_status, s.label_print_count, s.attributes->>'labelPrintedAt' as label_at,
    s.on_hold, s.hold_reason, s.attributes->>'holdNote' as hold_note, s.received_at,
    (select count(*)::int from sample_attachments a where a.sample_id = s.id) as photos,
    (select a.storage_path from sample_attachments a where a.sample_id = s.id order by a.taken_at limit 1) as thumb
  from samples s where s.batch_id = ${batchId} ${only ? tx`and s.id = ${only}` : tx``} order by s.row_no`;

/** The four lines of "Before you can confirm reception" and whether each holds (frame 04-02-01). */
function checks(rows: Row[], needsRemark: Set<string>) {
  const arrived = rows.filter((r) => r.arrived_at);
  const noLabel = arrived.filter((r) => !r.on_hold && r.label_status !== "printed").length;
  return [
    { text: "At least one sample arrived", ok: arrived.length > 0 },
    { text: "Every arrived sample has a mass", ok: arrived.every((r) => r.mass != null) },
    { text: "Every arrived sample has a condition, with a remark unless Good", ok: arrived.every((r) => r.condition && (!needsRemark.has(r.condition) || (r.condition_remark ?? "").trim().length > 0)) },
    { text: `Every arrived sample has a printed label${noLabel ? ` (${noLabel} to print)` : ""}`, ok: noLabel === 0 },
  ];
}

export async function batchReceptionRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  await app.register(multipart, { limits: { fileSize: MAX_PHOTO + 1, files: 1, fields: 4 } });
  const readBatches = requireAny("batch.read"), receive = requireAny("sample.receive"), photo = requireAny("sample.photo"), label = requireAny("label.print");
  const uid = (req: { user?: { userId: string } }) => req.user!.userId;
  const locked = "Reception is confirmed, so this can't change.";

  interface BatchRow { id: string; batch_no: string; status: string; company_id: string; branch_code: string; job_order_id: string; company_code: string; company_short: string }
  const loadBatch = async (tx: Tx, no: string, lock = false): Promise<BatchRow | undefined> => {
    const [b] = lock
      ? await tx`select b.id, b.batch_no, b.status::text as status, b.company_id, b.branch_code, b.job_order_id, c.company_code, c.code as company_short from batches b join companies c on c.id = b.company_id where b.batch_no = ${no} for update of b`
      : await tx`select b.id, b.batch_no, b.status::text as status, b.company_id, b.branch_code, b.job_order_id, c.company_code, c.code as company_short from batches b join companies c on c.id = b.company_id where b.batch_no = ${no}`;
    return b as BatchRow | undefined;
  };
  const lookup =(tx: Tx, key: string) => tx`select value, needs_remark from lookups where list_key = ${key} and active order by sort_order, value`;

  /** Give a sample its Sample ID and sample code (spec 6.1): the day's running number for the company and branch. */
  const give = async (tx: Tx, b: { company_id: string; branch_code: string; company_code: string }, s: { id: string; lot: string }) => {
    const [pat, [c]] = await Promise.all([idPatterns(tx), tx`select (next_sample_no(${b.company_id}, ${b.branch_code}, ${todayIso()}::date)) as n`]);
    const v = { day: todayIso(), company: b.company_code, branch: b.branch_code, n: c!.n as number, width: pat.width, lot: s.lot };
    return { sampleNo: fillPattern(pat.sampleId, v), sampleCode: fillPattern(pat.sampleCode, v) };
  };
  const tick = async (tx: Tx, b: BatchRow, s: { id: string; lot: string }, who: string, defaultCondition: string | null) => {
    const ids = await give(tx, b, s);
    await tx`update samples set arrived_at = now(), arrived_by = ${who}, sample_no = ${ids.sampleNo}, sample_code = ${ids.sampleCode}, condition = coalesce(condition, ${defaultCondition}) where id = ${s.id}`;
  };

  const out = (x: Row, signed: Map<string, string>) => ({
    id: x.id, rowNo: x.row_no, clientRef: x.client_ref, description: x.client_description, sampleNo: x.sample_no, sampleCode: x.sample_code, lot: x.lot,
    arrived: !!x.arrived_at, arrivedAt: x.arrived_at, mass: x.mass, condition: x.condition, conditionRemark: x.condition_remark,
    label: { printed: x.label_status === "printed", count: x.label_print_count, at: x.label_at }, hold: x.on_hold ? { reason: x.hold_reason, note: x.hold_note } : null,
    received: !!x.received_at, photos: { count: x.photos, thumb: x.thumb ? signed.get(x.thumb) ?? null : null },
  });
  const sign = async (paths: string[]) => {
    const m = new Map<string, string>();
    if (!paths.length) return m;
    const { data } = await admin.storage.from(PHOTOS).createSignedUrls(paths, 3600);
    for (const d of data ?? []) if (d.path && d.signedUrl) m.set(d.path, d.signedUrl);
    return m;
  };

  /* ================= the rows ================= */
  r.get("/batches/:no/reception", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const got = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no);
      if (!b) return null;
      const [rows, conditions, holds, tags] = await Promise.all([ROWS(tx, b.id), lookup(tx, "sample_condition"), lookup(tx, "hold_reason"), lookup(tx, "photo_tag")]);
      return { b, rows: rows as unknown as Row[], conditions, holds, tags };
    });
    if (!got) return fail(reply, 404, "not_found", "This batch was not found.");
    const signed = await sign(got.rows.map((x) => x.thumb).filter(Boolean) as string[]);
    const needs = new Set(got.conditions.filter((c) => c.needs_remark).map((c) => c.value as string));
    return {
      open: got.b.status === "created", status: got.b.status,
      conditions: got.conditions.map((c) => ({ value: c.value, needsRemark: c.needs_remark })),
      holdReasons: got.holds.map((c) => ({ value: c.value, needsNote: c.needs_remark })),
      photoTags: got.tags.map((c) => c.value as string),
      checks: got.b.status === "created" ? checks(got.rows, needs) : [],
      items: got.rows.map((x) => out(x, signed)),
    };
  });

  /* ================= one row: arrival, mass, condition, remark, lot ================= */
  r.patch("/batches/:no/samples/:id", { preHandler: receive, schema: { params: NoId, body: Patch } }, async (req, reply) => {
    const p = req.body;
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: locked };
      const [s] = await tx`select id, client_ref, lot, sample_no, arrived_at, on_hold, label_status from samples where id = ${req.params.id} and batch_id = ${b.id} for update`;
      if (!s) return { code: 404, key: "not_found", text: "This sample is not in the batch." };
      const conds = await lookup(tx, "sample_condition");
      let lot = s.lot as string;
      if (p.lot !== undefined) {
        const n = normLot(p.lot); if (!n) return { code: 422, key: "invalid", text: "The lot is a number from 1 to 99, for example Lot01.", field: "lot" };
        lot = n;
      }
      let mass: string | null | undefined;
      if (p.mass !== undefined) {
        if (p.mass === null || p.mass === "") mass = null;
        else {
          const t = p.mass.replace(",", ".");
          if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return { code: 422, key: "invalid", text: /^\d+\.\d{3,}$/.test(t) ? "Use at most 2 decimals." : "Enter the mass in kg, for example 12.40.", field: "mass" };
          if (Number(t) <= 0) return { code: 422, key: "invalid", text: "The mass must be more than 0.", field: "mass" };
          mass = t;
        }
      }
      if (p.condition != null && p.condition !== "" && !conds.some((c) => c.value === p.condition)) return { code: 422, key: "invalid", text: "Choose one of the conditions.", field: "condition" };

      if (p.arrived === true && !s.arrived_at) await tick(tx, b, { id: s.id, lot }, uid(req), (conds[0]?.value as string) ?? null);
      if (p.arrived === false && s.arrived_at) {
        await tx`update samples set arrived_at = null, arrived_by = null, sample_no = null, sample_code = null, label_status = 'none', label_print_count = 0, on_hold = false, hold_reason = null,
          attributes = attributes - 'labelPrintedAt' - 'holdNote' where id = ${s.id}`;
        if (s.sample_no) await logStep(tx, b.id, "created", "created", "Arrival undone", `${s.client_ref}: ${s.sample_no} was not given again`, uid(req));
      }
      if (mass !== undefined) await tx`update samples set mass_received_kg = ${mass} where id = ${s.id}`;
      if (p.condition !== undefined) await tx`update samples set condition = ${p.condition || null}${p.condition ? tx`` : tx`, condition_remark = null`} where id = ${s.id}`;
      if (p.conditionRemark !== undefined) await tx`update samples set condition_remark = ${p.conditionRemark || null} where id = ${s.id}`;
      if (p.lot !== undefined && lot !== s.lot) {
        // a new lot changes the sample code, and so the printed label
        const [cur] = await tx`select sample_code from samples where id = ${s.id}`;
        const code = cur!.sample_code ? (cur!.sample_code as string).replace(/\.[^.]*$/, "") + "." + lot : null;
        await tx`update samples set lot = ${lot}, sample_code = ${code}, label_status = case when sample_code is null then label_status else 'none' end where id = ${s.id}`;
      }
      const [row] = await ROWS(tx, b.id, s.id);
      return { ok: true as const, row: row as unknown as Row };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return out(res.row, await sign(res.row.thumb ? [res.row.thumb] : []));
  });

  r.post("/batches/:no/arrive-all", { preHandler: receive, schema: { params: NoParam } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: locked };
      const todo = await tx`select id, lot from samples where batch_id = ${b.id} and arrived_at is null order by row_no for update`;
      const [conds] = await lookup(tx, "sample_condition");
      for (const s of todo) await tick(tx, b, { id: s.id, lot: s.lot }, uid(req), (conds?.value as string) ?? null);
      return { ok: true as const, ticked: todo.length };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    return res;
  });

  /* ================= hold and release ================= */
  r.post("/batches/:no/samples/:id/hold", { preHandler: receive, schema: { params: NoId, body: Hold } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: locked };
      const [s] = await tx`select id, client_ref, arrived_at from samples where id = ${req.params.id} and batch_id = ${b.id} for update`;
      if (!s) return { code: 404, key: "not_found", text: "This sample is not in the batch." };
      if (!s.arrived_at) return { code: 409, key: "not_arrived", text: `${s.client_ref} has not arrived. Mark it arrived before putting it on hold.` };
      const [reason] = (await lookup(tx, "hold_reason")).filter((x) => x.value === req.body.reason);
      if (!reason) return { code: 422, key: "invalid", text: "Choose one of the reasons.", field: "reason" };
      if (reason.needs_remark && req.body.note.length < 3) return { code: 422, key: "invalid", text: "Add a note for this reason.", field: "note" };
      await tx`update samples set on_hold = true, hold_reason = ${reason.value}, attributes = attributes || ${tx.json({ holdNote: req.body.note || null } as never)} where id = ${s.id}`;
      await logStep(tx, b.id, "created", "created", "Sample put on hold", `${s.client_ref}: ${reason.value}`, uid(req));
      return { ok: true as const, clientRef: s.client_ref as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return res;
  });
  r.post("/batches/:no/samples/:id/release", { preHandler: receive, schema: { params: NoId } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: locked };
      const [s] = await tx`select id, client_ref, on_hold from samples where id = ${req.params.id} and batch_id = ${b.id} for update`;
      if (!s) return { code: 404, key: "not_found", text: "This sample is not in the batch." };
      if (!s.on_hold) return { code: 409, key: "not_held", text: `${s.client_ref} is not on hold.` };
      await tx`update samples set on_hold = false, hold_reason = null, attributes = attributes - 'holdNote' where id = ${s.id}`;
      await logStep(tx, b.id, "created", "created", "Sample released from hold", s.client_ref as string, uid(req));
      return { ok: true as const, clientRef: s.client_ref as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    return res;
  });

  /* ================= photos (D-48): optional, removable until Confirm reception ================= */
  const photoList = async (tx: Tx, bno: string, sid: string) => {
    const b = await loadBatch(tx, bno);
    if (!b) return null;
    const [s] = await tx`select id, client_ref, sample_code from samples where id = ${sid} and batch_id = ${b.id}`;
    if (!s) return null;
    const [items, tags] = await Promise.all([
      tx`select a.id, a.tag, a.file_name, a.size_bytes, a.storage_path, a.taken_at, p.full_name as taken_by from sample_attachments a left join profiles p on p.id = a.taken_by where a.sample_id = ${sid} order by a.taken_at`,
      lookup(tx, "photo_tag"),
    ]);
    return { b, s, items, tags };
  };
  r.get("/batches/:no/samples/:id/photos", { preHandler: readBatches, schema: { params: NoId } }, async (req, reply) => {
    const got = await runAs(req, (tx) => photoList(tx, req.params.no, req.params.id));
    if (!got) return fail(reply, 404, "not_found", "This sample was not found.");
    const signed = await sign(got.items.map((x) => x.storage_path as string));
    return {
      open: got.b.status === "created", clientRef: got.s.client_ref, sampleCode: got.s.sample_code, tags: got.tags.map((t) => t.value as string),
      items: got.items.map((x) => ({ id: x.id, tag: x.tag, fileName: x.file_name, sizeBytes: Number(x.size_bytes), takenAt: x.taken_at, takenBy: x.taken_by, url: signed.get(x.storage_path as string) ?? null })),
    };
  });
  r.post("/batches/:no/samples/:id/photos", { preHandler: photo, schema: { params: NoId } }, async (req, reply) => {
    const file = await req.file().catch(() => null);
    if (!file) return fail(reply, 400, "no_file", "Choose a photo first.");
    const tagField = (file.fields.tag as { value?: string } | undefined)?.value ?? "Other";
    const buf = await file.toBuffer().catch(() => null);
    if (!buf || buf.length > MAX_PHOTO || file.file.truncated) return fail(reply, 413, "too_big", "The photo is larger than 10 MB.");
    if (!buf.length) return fail(reply, 422, "empty", "The file is empty.");
    const ext = extOf(file.filename), t = IMAGES[ext];
    if (!t || !t.ok(buf)) return fail(reply, 415, "bad_type", "Use a PNG, JPG or WebP photo.");
    const name = file.filename.replace(/[\\/\u0000-\u001f]/g, "_").slice(-200);
    const pre = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: "Photos lock when reception is confirmed." };
      const [s] = await tx`select id, (select count(*)::int from sample_attachments where sample_id = samples.id) as n from samples where id = ${req.params.id} and batch_id = ${b.id}`;
      if (!s) return { code: 404, key: "not_found", text: "This sample is not in the batch." };
      if (s.n >= MAX_PHOTOS_PER_SAMPLE) return { code: 409, key: "too_many", text: `A sample can have ${MAX_PHOTOS_PER_SAMPLE} photos.` };
      const tags = await lookup(tx, "photo_tag");
      return { ok: true as const, batchId: b.id as string, tag: tags.some((x) => x.value === tagField) ? tagField : "Other" };
    });
    if ("code" in pre) { const e = pre as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    const path = `${pre.batchId}/${req.params.id}/${randomUUID()}.${ext}`;
    const up = await admin.storage.from(PHOTOS).upload(path, buf, { contentType: t.mime });
    if (up.error) throw up.error;
    try {
      const [row] = await runAs(req, (tx) => tx`insert into sample_attachments (sample_id, tag, storage_path, file_name, size_bytes, sha256, taken_by)
        values (${req.params.id}, ${pre.tag}, ${path}, ${name}, ${buf.length}, ${createHash("sha256").update(buf).digest("hex")}, ${uid(req)}) returning id`);
      return reply.code(201).send({ id: row!.id, fileName: name });
    } catch (e) { await admin.storage.from(PHOTOS).remove([path]); throw e; }
  });
  r.delete("/batches/:no/samples/:id/photos/:pid", { preHandler: photo, schema: { params: z.object({ no: z.string().max(40), id: uuid, pid: uuid }) } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: "Photos lock when reception is confirmed." };
      const [a] = await tx`select a.id, a.storage_path from sample_attachments a join samples s on s.id = a.sample_id where a.id = ${req.params.pid} and s.id = ${req.params.id} and s.batch_id = ${b.id}`;
      if (!a) return { code: 404, key: "not_found", text: "This photo was not found." };
      await tx`delete from sample_attachments where id = ${a.id}`;
      return { ok: true as const, path: a.storage_path as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    await admin.storage.from(PHOTOS).remove([res.path]);
    return { ok: true };
  });

  /* ================= labels (F-LBL-01): record the print and return what each label carries ================= */
  r.post("/batches/:no/labels", { preHandler: label, schema: { params: NoParam, body: Labels } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      const ids = [...new Set(req.body.sampleIds)];
      const rows = await tx`select s.id, s.client_ref, s.sample_no, s.sample_code, s.arrived_at, s.label_status, j.order_no from samples s join job_orders j on j.id = s.job_order_id
        where s.batch_id = ${b.id} and s.id = any(${ids}::uuid[]) order by s.row_no for update of s`;
      if (rows.length !== ids.length) return { code: 404, key: "not_found", text: "A chosen sample is not in the batch." };
      const noId = rows.find((x) => !x.sample_no);
      if (noId) return { code: 409, key: "not_arrived", text: `${noId.client_ref} has not arrived, so it has no Sample ID to print.` };
      const again = rows.filter((x) => x.label_status === "printed");
      if (again.length && req.body.reason.length < 3) return { code: 422, key: "invalid", text: "Say why the label is printed again.", field: "reason" };
      await tx`update samples set label_status = 'printed', label_print_count = label_print_count + 1, attributes = attributes || ${tx.json({ labelPrintedAt: new Date().toISOString() } as never)} where id = any(${ids}::uuid[])`;
      await logStep(tx, b.id, b.status, b.status, again.length ? "Labels printed again" : "Labels printed", `${rows.length} label${rows.length === 1 ? "" : "s"}${again.length ? `: ${req.body.reason}` : ""}`, uid(req));
      return { ok: true as const, labels: rows.map((x) => ({ id: x.id, sampleNo: x.sample_no as string, sampleCode: x.sample_code as string, orderNo: x.order_no as string, receivedOn: new Date(x.arrived_at as Date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Makassar" }), company: b.company_short as string })) };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return res;
  });

  /* ================= Confirm reception ================= */
  r.post("/batches/:no/confirm", { preHandler: receive, schema: { params: NoParam, body: Confirm } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await loadBatch(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "created") return { code: 409, key: "locked", text: "Reception is already confirmed." };
      const [rows, conds, [j]] = await Promise.all([
        ROWS(tx, b.id) as unknown as Promise<Row[]>, lookup(tx, "sample_condition"),
        tx`select j.order_no, j.cso_id from job_orders j where j.id = ${b.job_order_id}`,
      ]);
      const list = checks(rows, new Set(conds.filter((c) => c.needs_remark).map((c) => c.value as string)));
      const bad = list.find((c) => !c.ok);
      if (bad) return { code: 409, key: "not_ready", text: `Before you can confirm reception: ${bad.text.toLowerCase()}.` };
      const arrived = rows.filter((x) => x.arrived_at), leaving = rows.filter((x) => !x.arrived_at);
      if (leaving.length && !req.body.fewer)
        return { code: 409, key: "fewer", text: `Confirm reception with ${arrived.length} of ${rows.length} samples?`, extra: { expected: rows.length, arrived: arrived.length, held: arrived.filter((x) => x.on_hold).length, leaving: leaving.map((x) => x.client_ref) } };
      await tx`update samples set received_at = now(), received_by = ${uid(req)} where batch_id = ${b.id} and arrived_at is not null`;
      if (leaving.length) await tx`update samples set batch_id = null, released_from_batch_id = ${b.id}, released_at = now(), released_by = ${uid(req)} where id = any(${leaving.map((x) => x.id)}::uuid[])`;
      await tx`update batches set status = 'preparation', reception_confirmed_at = now(), reception_confirmed_by = ${uid(req)}, expected_at_confirm = ${rows.length} where id = ${b.id}`;
      const note = leaving.length ? `Confirmed with ${arrived.length} of ${rows.length} expected; returned to ${j!.order_no}: ${leaving.map((x) => x.client_ref).join(", ")}` : `Confirmed with ${arrived.length} samples`;
      await logStep(tx, b.id, "created", "preparation", "Reception confirmed", note, uid(req));
      return { ok: true as const, received: arrived.length, returned: leaving.map((x) => x.client_ref), orderId: b.job_order_id as string, orderNo: j!.order_no as string, cso: j!.cso_id as string | null };
    });
    if ("code" in res) {
      const e = res as { code: number; key: string; text: string; extra?: Record<string, unknown> };
      return fail(reply, e.code, e.key, e.text, undefined, e.extra);
    }
    // the job order is now In progress; its row belongs to the CSO, so the API's own connection moves it, stamped with this account
    try {
      await runAsActor(req, "Job orders", (tx) => tx`update job_orders set status = 'in_progress' where id = ${res.orderId} and status = 'awaiting_samples'`);
      if (res.returned.length)
        await runAsActor(req, SCREEN, (tx) => notify(tx, {
          event: "N2", title: `${res.returned.length} ${res.returned.length === 1 ? "sample" : "samples"} of ${res.orderNo} did not arrive`,
          body: "Add them to a new batch when they come, or mark them not received.", link: `/orders/${res.orderNo}/batches`,
        }, res.cso ? { users: [res.cso] } : { roles: ["cso"] }, uid(req)));
    } catch (e) { req.log.error(e); }
    return { ok: true, received: res.received, returned: res.returned };
  });
}
