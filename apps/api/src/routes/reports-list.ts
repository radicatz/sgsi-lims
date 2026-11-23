// Reports, slice B, part 2 (Reports_Build_Design.md 16.2 steps 5 to 7; frames 07-01 Reports_list, 07-03 RoA): the list of CoAs and signed RoAs, several files as one zip,
// the RoA page, and the client's default bases and signatory. Reads run as the signed-in user, so row-level security decides what a role sees
// (a draft only for the Lab admin side, a CoA waiting for its signatory). The zip checks each file against the user's rights.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate, requireAny } from "../auth";
import { asUser, type Tx } from "../db";
import { admin } from "../supabase";
import { NoParam, fail, runAsActor, uuid } from "../batch-lib";

const SCREEN = "Reports";
const SIZE = 10, MAX_ZIP = 50;
const COA_STATUS = ["draft", "awaiting_signature", "published", "sent", "superseded", "void"] as const;
const ListQuery = z.object({
  kind: z.enum(["coa", "roa"]).default("coa"),
  status: z.string().max(120).optional(),
  q: z.string().trim().max(80).optional(),
  period: z.enum(["30", "90", "365", "all"]).default("90"),
  company: uuid.optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(["number", "order", "client", "status", "published", "signatory", "sent", "roa", "batch", "uploaded", "by"]).optional(),
  dir: z.enum(["asc", "desc"]).default("asc"),
});
const DownloadBody = z.object({ kind: z.enum(["coa", "roa"]), ids: z.array(uuid).min(1).max(MAX_ZIP) });
const DefaultsBody = z.object({ bases: z.array(z.enum(["adb", "db", "daf", "ar"])).min(1).max(4), signatoryId: uuid.nullable().optional() });
type R = { user?: { userId: string; claims: Record<string, unknown>; permissions: string[] } | undefined; id: string };

/* ---------- a stored-only zip: PDFs are compressed already, so no deflate is needed ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]!) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zipStore(files: Array<{ name: string; data: Buffer }>): Buffer {
  const parts: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8"), crc = crc32(f.data), h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8); h.writeUInt16LE(time, 10); h.writeUInt16LE(date, 12);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(f.data.length, 18); h.writeUInt32LE(f.data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    parts.push(h, name, f.data);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10); c.writeUInt16LE(time, 12); c.writeUInt16LE(date, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(f.data.length, 20); c.writeUInt32LE(f.data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += 30 + name.length + f.data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

export async function reportListRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  const as = <T>(req: R, fn: (tx: Tx) => Promise<T>) => asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const can = (req: R, p: string) => !!req.user?.permissions.includes(p);
  const uid = (req: R) => req.user!.userId;

  /* ================= the list ================= */
  r.get("/reports", { preHandler: requireAny("coa.download", "report.publish", "roa.download", "report.sign"), schema: { querystring: ListQuery } }, async (req, reply) => {
    const f = req.query;
    const seeCoa = can(req, "coa.download") || can(req, "report.publish") || can(req, "report.sign"), seeRoa = can(req, "roa.download");
    if (f.kind === "coa" && !seeCoa) return fail(reply, 403, "forbidden", "Your role doesn't include this action.");
    if (f.kind === "roa" && !seeRoa) return fail(reply, 403, "forbidden", "Your role doesn't include this action.");
    const like = f.q ? `%${f.q.replace(/[%_\\]/g, "\\$&")}%` : null;
    const since = f.period === "all" ? null : new Date(Date.now() - Number(f.period) * 86_400_000);
    const dir = f.dir === "desc" ? "desc" : "asc";
    const out = await as(req, async (tx) => {
      if (f.kind === "roa") {
        const base = tx`from batch_documents d join batches b on b.id = d.batch_id join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id
          left join profiles p on p.id = d.uploaded_by where d.kind = 'signed_roa'
          ${like ? tx`and (d.roa_no ilike ${like} or b.batch_no ilike ${like} or j.order_no ilike ${like} or c.name ilike ${like})` : tx``}
          ${f.company ? tx`and c.id = ${f.company}` : tx``} ${since ? tx`and d.uploaded_at >= ${since}` : tx``}`;
        const order = ({ roa: "d.roa_no", batch: "b.batch_no", order: "j.order_no", client: "c.name", uploaded: "d.uploaded_at", by: "p.full_name" } as Record<string, string>)[f.sort ?? "uploaded"] ?? "d.uploaded_at";
        const [n] = await tx`select count(*)::int as n ${base}`;
        const rows = await tx`select d.id, d.roa_no, b.batch_no, j.order_no, c.name as company, d.uploaded_at, p.full_name as uploaded_by ${base}
          order by ${tx.unsafe(order)} ${tx.unsafe(f.sort ? dir : "desc")} nulls last, d.id limit ${SIZE} offset ${(f.page - 1) * SIZE}`;
        const [cnt] = await tx`select (select count(*) from batch_documents where kind = 'signed_roa')::int as roa`;
        return { total: n!.n as number, rows: rows.map((x) => ({ id: x.id, roaNo: x.roa_no, batchNo: x.batch_no, orderNo: x.order_no, company: x.company, uploadedAt: x.uploaded_at, uploadedBy: x.uploaded_by ?? null })), counts: { all: n!.n, roa: cnt!.roa } };
      }
      const status = tx`case when r.status = 'issued' then (case when exists (select 1 from report_deliveries x where x.report_id = r.id) then 'sent' else 'published' end) else r.status::text end`;
      const common = tx`from reports r join job_orders j on j.id = r.job_order_id join companies c on c.id = j.company_id left join profiles s on s.id = r.signatory_id
        where r.kind = 'coa'
        ${like ? tx`and (r.report_no ilike ${like} or j.order_no ilike ${like} or c.name ilike ${like})` : tx``}
        ${f.company ? tx`and c.id = ${f.company}` : tx``} ${since ? tx`and coalesce(r.issued_at, r.created_at) >= ${since}` : tx``}`;
      const want = (f.status ?? "").split(",").filter((x) => (COA_STATUS as readonly string[]).includes(x));
      const [n] = await tx`select count(*)::int as n ${common} ${want.length ? tx`and ${status} = any(${want}::text[])` : tx``}`;
      const counts = await tx`select ${status} as st, count(*)::int as n ${common} group by 1`;
      const order = ({ number: "r.report_no", order: "j.order_no", client: "c.name", status: "st", published: "coalesce(r.issued_at, r.created_at)", signatory: "s.full_name", sent: "last_sent" } as Record<string, string>)[f.sort ?? "published"] ?? "r.issued_at";
      const rows = await tx`select r.id, r.report_no, r.revision, j.order_no, c.name as company, ${status} as st, r.issued_at, r.created_at, s.full_name as signatory,
          (select max(x.sent_on) from report_deliveries x where x.report_id = r.id) as last_sent,
          (select x.channels from report_deliveries x where x.report_id = r.id order by x.sent_on desc, x.at desc limit 1) as last_channels
        ${common} ${want.length ? tx`and ${status} = any(${want}::text[])` : tx``}
        order by ${tx.unsafe(order)} ${tx.unsafe(f.sort ? dir : "desc")} nulls last, r.id limit ${SIZE} offset ${(f.page - 1) * SIZE}`;
      const by: Record<string, number> = {}; let all = 0;
      for (const c of counts) { by[c.st as string] = c.n as number; all += c.n as number; }
      const [roaN] = seeRoa ? await tx`select count(*)::int as n from batch_documents where kind = 'signed_roa'` : [{ n: 0 }];
      return {
        total: n!.n as number,
        rows: rows.map((x) => ({ id: x.id, number: x.report_no ?? null, revision: x.revision, orderNo: x.order_no, company: x.company, status: x.st, publishedAt: x.issued_at ?? null, signatory: x.signatory ?? null, lastSent: x.last_sent ?? null, lastChannels: x.last_channels ?? [] })),
        counts: { all, ...by, roa: roaN!.n },
      };
    });
    return { kind: f.kind, size: SIZE, page: f.page, ...out, tabs: { coa: seeCoa, roa: seeRoa }, canDraft: can(req, "report.publish") };
  });

  /* ================= several files as one zip ================= */
  r.post("/reports/download", { preHandler: requireAny("coa.download", "report.publish", "roa.download"), schema: { body: DownloadBody } }, async (req, reply) => {
    const { kind, ids } = req.body;
    if (kind === "coa" && !(can(req, "coa.download") || can(req, "report.publish"))) return fail(reply, 403, "forbidden", "Your role doesn't include this action.");
    if (kind === "roa" && !can(req, "roa.download")) return fail(reply, 403, "forbidden", "Your role doesn't include this action.");
    const rows = await as(req, async (tx) => kind === "coa"
      ? tx`select r.report_no as name, r.storage_path as path, 'reports' as bucket from reports r where r.id = any(${ids}::uuid[]) and r.kind = 'coa' and r.status in ('issued', 'superseded', 'void') and r.storage_path is not null`
      : tx`select d.file_name as name, d.storage_path as path, 'batch-documents' as bucket from batch_documents d where d.id = any(${ids}::uuid[]) and d.kind = 'signed_roa'`);
    if (!rows.length) return fail(reply, 404, "not_found", kind === "coa" ? "None of the chosen certificates is published yet." : "No signed RoA was found.");
    const files: Array<{ name: string; data: Buffer }> = [], used = new Set<string>();
    for (const x of rows) {
      const { data, error } = await admin.storage.from(x.bucket as string).download(x.path as string);
      if (error || !data) continue;
      let name = String(x.name ?? "file").replace(/[\\/\u0000-\u001f]/g, "_"); if (!/\.pdf$/i.test(name)) name += ".pdf";
      for (let i = 2; used.has(name.toLowerCase()); i++) name = name.replace(/(\.pdf)$/i, ` (${i})$1`).replace(/ \(\d+\) \((\d+)\)/, ` ($1)`);
      used.add(name.toLowerCase());
      files.push({ name, data: Buffer.from(await data.arrayBuffer()) });
    }
    if (!files.length) return fail(reply, 404, "no_file", "The files are missing.");
    const zip = zipStore(files);
    return reply.header("content-type", "application/zip").header("content-disposition", `attachment; filename="${kind === "coa" ? "CoAs" : "RoAs"}-${new Date().toISOString().slice(0, 10)}.zip"`).header("cache-control", "no-store").send(zip);
  });

  /* ================= the RoA page ================= */
  r.get("/reports/roa/:no", { preHandler: requireAny("roa.download"), schema: { params: NoParam } }, async (req, reply) => {
    const d = await as(req, async (tx) => {
      const [x] = await tx`select d.id, d.roa_no, d.file_name, d.size_bytes, d.uploaded_at, p.full_name as uploaded_by, b.id as batch_id, b.batch_no, b.status::text as batch_status, b.completed_at, (select full_name from profiles where id = b.completed_by) as completed_by, b.standard::text as standard,
          j.order_no, c.name as company, (select count(*)::int from samples s where s.batch_id = b.id and s.received_at is not null) as samples
        from batch_documents d join batches b on b.id = d.batch_id join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id left join profiles p on p.id = d.uploaded_by
        where d.kind = 'signed_roa' and b.batch_no = ${req.params.no}`;
      if (!x) return null;
      const used = !(can(req, "coa.download") || can(req, "report.publish")) ? [] : await tx`select r.id, r.report_no, r.revision, r.status::text as status from report_sources s join reports r on r.id = s.report_id where s.batch_id = ${x.batch_id} and r.kind = 'coa' and r.status in ('issued', 'superseded') order by r.revision desc`;
      return { x, used };
    });
    if (!d) return fail(reply, 404, "not_found", "No signed RoA is attached to this batch.");
    const x = d.x;
    return {
      id: x.id, roaNo: x.roa_no, fileName: x.file_name, sizeBytes: Number(x.size_bytes), uploadedAt: x.uploaded_at, uploadedBy: x.uploaded_by ?? null,
      batch: { batchNo: x.batch_no, status: x.batch_status, standard: x.standard, samples: x.samples, completedAt: x.completed_at ?? null, completedBy: x.completed_by ?? null }, orderNo: x.order_no, company: x.company,
      usedIn: !(can(req, "coa.download") || can(req, "report.publish")) ? null : d.used.map((u) => ({ id: u.id, number: u.report_no, revision: u.revision, status: u.status })),
    };
  });

  /* ================= the client's default bases and signatory (the toast after signing, spec S-28) ================= */
  r.put("/companies/:id/coa-defaults", { preHandler: requireAny("report.publish"), schema: { params: z.object({ id: uuid }), body: DefaultsBody } }, async (req, reply) => {
    const res = await runAsActor(req, SCREEN, async (tx) => {
      const [co] = await tx`select id from companies where id = ${req.params.id}`;
      if (!co) return { code: 404, key: "not_found", text: "This client was not found." };
      const bases = ["adb", "db", "daf", "ar"].filter((b) => req.body.bases.includes(b as never));
      if (req.body.signatoryId) {   // check first: a refused request must not save anything
        const [ok] = await tx`select 1 from user_roles ur join role_permissions rp on rp.role_id = ur.role_id join profiles p on p.id = ur.user_id
          where ur.user_id = ${req.body.signatoryId} and rp.permission_code = 'report.sign' and p.status = 'active' limit 1`;
        if (!ok) return { code: 422, key: "invalid", text: "Choose a person with signing rights.", field: "signatoryId" };
      }
      await tx`update companies set coa_bases = ${bases}::text[] where id = ${co.id}`;
      if (req.body.signatoryId) {
        const [rule] = await tx`select id from signatory_rules where kind = 'coa' and company_id = ${co.id} and signatory_id is not null`;
        if (rule) await tx`update signatory_rules set signatory_id = ${req.body.signatoryId}, active = true where id = ${rule.id}`;
        else await tx`insert into signatory_rules (kind, company_id, signatory_id) values ('coa', ${co.id}, ${req.body.signatoryId})`;
      }
      return { ok: true as const, bases };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return { ok: true, bases: res.bases };
  });
  void uid;
}
