// Master data routes (Master Data screen plan; spec 14.2): clients and their contacts and logo, drill holes with their CoA
// files, lithologies and seams. Every query runs as the signed-in user, so row-level security is the final check; the
// route guards below only give a clear 403 first. Records are archived, never removed, once anything uses them.
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { createHash, randomUUID } from "node:crypto";
import multipart from "@fastify/multipart";
import { z } from "zod";
import { asUser, type Tx } from "../db";
import { authenticate, requireAny } from "../auth";
import { admin } from "../supabase";

const uuid = z.string().uuid();
const Id = z.object({ id: uuid });
const text = (max = 200) => z.string().trim().max(max);
const opt = (max = 500) => text(max).optional().transform((v) => (v ? v : null));

const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string) => reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}) });
const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
const signed = async (bucket: string, paths: string[]) => {
  const out = new Map<string, string>(); const list = paths.filter(Boolean);
  if (!list.length) return out;
  const { data } = await admin.storage.from(bucket).createSignedUrls(list, 3600);
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
};

const CompanyBody = z.object({
  name: text().min(1, "Enter the client name."), code: text(12).min(1, "Enter a short code.").regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers and dashes."),
  status: z.enum(["active", "inactive"]).default("active"), address: opt(), billingAddress: opt(),
  // C-18: the 3-digit company code in the Sample ID; assigned automatically, changed only by a Superadmin, locked after the first received sample
  companyCode: z.string().trim().regex(/^[0-9]{3}$/, "Three digits, for example 012.").optional(),
});
const ContactBody = z.object({ fullName: text().min(1, "Enter the contact's name."), position: opt(120), email: z.union([z.literal(""), z.string().trim().email("Enter a valid email.")]).optional().transform((v) => v || null), phone: opt(40), isDefault: z.boolean().default(false) });
const HoleBody = z.object({ companyId: uuid, code: text(40).min(1, "Enter the drill hole code."), description: opt() });
const LithoBody = z.object({ companyId: uuid, name: text(80).min(1, "Enter the lithology name."), kind: z.enum(["coal", "parting", "no_lithology"]) });
const SeamBody = z.object({ companyId: uuid, code: text(40).min(1, "Enter the seam code."), description: opt(), sortOrder: z.number().int().min(0).max(9999).nullable().optional() });

export async function masterRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
  r.addHook("preHandler", authenticate);
  const run = <T>(req: { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string }, screen: string, fn: (tx: Tx) => Promise<T>) =>
    asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen }, fn);
  const readCo = requireAny("company.read"), writeCo = requireAny("company.manage");
  const readMd = requireAny("master.read"), writeMd = requireAny("master.write"), upCoa = requireAny("coa.upload");

  /* ================= clients ================= */
  const companyRows = (tx: Tx, where: ReturnType<Tx>) => tx`
    select c.id, c.code, c.company_code, c.name, c.address, c.billing_address, c.logo_path, c.status, c.archived_at, c.created_at,
      (select count(*)::int from samples s join job_orders j on j.id = s.job_order_id where j.company_id = c.id) as total_sample,
      exists (select 1 from samples s join job_orders j on j.id = s.job_order_id where j.company_id = c.id and s.received_at is not null) as code_locked,
      (select count(*)::int from job_orders j where j.company_id = c.id) as job_orders,
      (select count(*)::int from drill_holes d where d.company_id = c.id and d.archived_at is null) as drill_holes,
      (select count(*)::int from lithologies l where l.company_id = c.id and l.archived_at is null) as lithologies,
      (select count(*)::int from seams m where m.company_id = c.id and m.archived_at is null) as seams
    from companies c ${where} order by c.name`;
  const shapeCompany = (c: Record<string, unknown>, urls: Map<string, string>) => ({
    id: c.id, code: c.code, companyCode: c.company_code, companyCodeLocked: c.code_locked, name: c.name, address: c.address, billingAddress: c.billing_address, status: c.status, archivedAt: c.archived_at, createdAt: c.created_at,
    logoUrl: c.logo_path ? urls.get(c.logo_path as string) ?? null : null, logoName: c.logo_path ? String(c.logo_path).split("/").pop() : null,
    totalSample: c.total_sample, jobOrders: c.job_orders, drillHoles: c.drill_holes, lithologies: c.lithologies, seams: c.seams,
  });

  /* id and name of every active client, for the Company pickers of forms and filters; anyone who works with clients or master data may read it */
  r.get("/company-options", { preHandler: requireAny("company.read", "master.read", "order.create") }, async (req) => {
    const rows = await run(req, "Pickers", (tx) => tx`select id, code, name from companies where status = 'active' order by name`);
    return { items: rows.map((c) => ({ id: c.id, code: c.code, name: c.name })) };
  });

  r.get("/companies", { preHandler: readCo }, async (req) => {
    const rows = await run(req, "Clients", (tx) => companyRows(tx, tx``));
    const urls = await signed("logos", rows.map((c) => c.logo_path as string).filter(Boolean));
    return { items: rows.map((c) => shapeCompany(c, urls)) };
  });

  r.get("/companies/:id", { preHandler: readCo, schema: { params: Id } }, async (req, reply) => {
    const { id } = req.params;
    const out = await run(req, "Client page", async (tx) => {
      const [c] = await companyRows(tx, tx`where c.id = ${id}`);
      if (!c) return null;
      const contacts = await tx`select id, full_name, position, email, phone, is_default from company_contacts where company_id = ${id} and archived_at is null order by is_default desc, full_name`;
      return { c, contacts };
    });
    if (!out) return fail(reply, 404, "not_found", "This client was not found.");
    const urls = await signed("logos", out.c.logo_path ? [out.c.logo_path as string] : []);
    return { ...shapeCompany(out.c, urls), contacts: out.contacts.map((k) => ({ id: k.id, fullName: k.full_name, position: k.position, email: k.email, phone: k.phone, isDefault: k.is_default })) };
  });

  r.post("/companies", { preHandler: writeCo, schema: { body: CompanyBody } }, async (req, reply) => {
    const b = req.body; const code = b.code.toUpperCase();
    try {
      const [row] = await run(req, "Clients", (tx) => tx`insert into companies (code, name, address, billing_address, status) values (${code}, ${b.name}, ${b.address}, ${b.billingAddress}, ${b.status}) returning id`);
      return reply.code(201).send({ id: row!.id });
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", `${code} is already used by another client.`, "code"); throw e; }
  });

  r.patch("/companies/:id", { preHandler: writeCo, schema: { params: Id, body: CompanyBody } }, async (req, reply) => {
    const b = req.body; const code = b.code.toUpperCase();
    const superadmin = req.user!.permissions.includes("config.write");
    if (b.companyCode && !superadmin) return fail(reply, 403, "forbidden", "Only the Superadmin can change the company code.", "companyCode");
    try {
      const rows = await run(req, "Client page", (tx) => tx`update companies set code = ${code}, name = ${b.name}, address = ${b.address}, billing_address = ${b.billingAddress},
        company_code = ${b.companyCode && superadmin ? b.companyCode : tx`company_code`},
        status = case when status = 'archived' then status else ${b.status} end where id = ${req.params.id} returning id`);
      return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This client was not found.");
    } catch (e) {
      const err = e as { code?: string; message?: string; constraint_name?: string };
      if (err.code === "P0001") return fail(reply, 409, "locked", err.message ?? "The company code is locked.", "companyCode");
      if (isUnique(e)) return err.constraint_name === "companies_company_code_uq"
        ? fail(reply, 409, "duplicate", `${b.companyCode} is already used by another client.`, "companyCode")
        : fail(reply, 409, "duplicate", `${code} is already used by another client.`, "code");
      throw e;
    }
  });

  for (const [path, archive] of [["archive", true], ["restore", false]] as const) {
    r.post(`/companies/:id/${path}`, { preHandler: writeCo, schema: { params: Id } }, async (req, reply) => {
      const rows = await run(req, "Clients", (tx) => archive
        ? tx`update companies set status = 'archived', archived_at = now() where id = ${req.params.id} returning id`
        : tx`update companies set status = 'active', archived_at = null where id = ${req.params.id} returning id`);
      return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This client was not found.");
    });
  }

  r.delete("/companies/:id", { preHandler: writeCo, schema: { params: Id } }, async (req, reply) => {
    const out = await run(req, "Clients", async (tx) => {
      const [u] = await tx`select (select count(*) from job_orders where company_id = ${req.params.id}) + (select count(*) from drill_holes where company_id = ${req.params.id})
        + (select count(*) from seams where company_id = ${req.params.id}) + (select count(*) from lithologies where company_id = ${req.params.id}) as used`;
      if (Number(u!.used) > 0) return "used" as const;
      const rows = await tx`delete from companies where id = ${req.params.id} returning logo_path`;
      return rows[0] ?? null;
    });
    if (out === "used") return fail(reply, 409, "in_use", "This client is used by job orders or master data. Archive it instead.");
    if (!out) return fail(reply, 404, "not_found", "This client was not found.");
    if (out.logo_path) await admin.storage.from("logos").remove([out.logo_path as string]);
    return { ok: true };
  });

  /* logo: PNG, JPEG, SVG or WebP up to 2 MB */
  r.post("/companies/:id/logo", { preHandler: writeCo, schema: { params: Id } }, async (req, reply) => {
    const file = await req.file();
    if (!file) return fail(reply, 400, "no_file", "Choose a logo file first.");
    const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/svg+xml": "svg", "image/webp": "webp" } as Record<string, string>)[file.mimetype];
    if (!ext) return fail(reply, 415, "bad_type", "The logo must be a PNG, JPEG, SVG or WebP image.");
    const buf = await file.toBuffer();
    if (buf.length > 2 * 1024 * 1024) return fail(reply, 413, "too_big", "The logo is larger than 2 MB.");
    const path = `${req.params.id}/${randomUUID()}.${ext}`;
    const old = await run(req, "Client page", async (tx) => {
      const [c] = await tx`select logo_path from companies where id = ${req.params.id}`;
      if (!c) return undefined;
      await tx`update companies set logo_path = ${path} where id = ${req.params.id}`;
      return c.logo_path as string | null;
    });
    if (old === undefined) return fail(reply, 404, "not_found", "This client was not found.");
    const up = await admin.storage.from("logos").upload(path, buf, { contentType: file.mimetype });
    if (up.error) { await run(req, "Client page", (tx) => tx`update companies set logo_path = ${old} where id = ${req.params.id}`); throw up.error; }
    if (old) await admin.storage.from("logos").remove([old]);
    return { ok: true };
  });
  r.delete("/companies/:id/logo", { preHandler: writeCo, schema: { params: Id } }, async (req) => {
    const old = await run(req, "Client page", async (tx) => {
      const [c] = await tx`select logo_path from companies where id = ${req.params.id}`;
      await tx`update companies set logo_path = null where id = ${req.params.id}`;
      return c?.logo_path as string | null | undefined;
    });
    if (old) await admin.storage.from("logos").remove([old]);
    return { ok: true };
  });

  /* contacts */
  r.post("/companies/:id/contacts", { preHandler: writeCo, schema: { params: Id, body: ContactBody } }, async (req, reply) => {
    const b = req.body;
    const row = await run(req, "Client page", async (tx) => {
      const [first] = await tx`select count(*)::int as n from company_contacts where company_id = ${req.params.id} and archived_at is null`;
      const def = b.isDefault || first!.n === 0;
      if (def) await tx`update company_contacts set is_default = false where company_id = ${req.params.id} and is_default and archived_at is null`;
      const [k] = await tx`insert into company_contacts (company_id, full_name, position, email, phone, is_default) values (${req.params.id}, ${b.fullName}, ${b.position}, ${b.email}, ${b.phone}, ${def}) returning id`;
      return k!;
    });
    return reply.code(201).send({ id: row.id });
  });
  r.patch("/contacts/:id", { preHandler: writeCo, schema: { params: Id, body: ContactBody } }, async (req, reply) => {
    const b = req.body;
    const rows = await run(req, "Client page", async (tx) => {
      const [k] = await tx`select company_id from company_contacts where id = ${req.params.id}`;
      if (!k) return [];
      if (b.isDefault) await tx`update company_contacts set is_default = false where company_id = ${k.company_id} and is_default and archived_at is null and id <> ${req.params.id}`;
      return tx`update company_contacts set full_name = ${b.fullName}, position = ${b.position}, email = ${b.email}, phone = ${b.phone}, is_default = ${b.isDefault} where id = ${req.params.id} returning id`;
    });
    return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This contact was not found.");
  });
  r.post("/contacts/:id/default", { preHandler: writeCo, schema: { params: Id } }, async (req, reply) => {
    const ok = await run(req, "Client page", async (tx) => {
      const [k] = await tx`select company_id from company_contacts where id = ${req.params.id} and archived_at is null`;
      if (!k) return false;
      await tx`update company_contacts set is_default = false where company_id = ${k.company_id} and is_default and archived_at is null`;
      await tx`update company_contacts set is_default = true where id = ${req.params.id}`;
      return true;
    });
    return ok ? { ok: true } : fail(reply, 404, "not_found", "This contact was not found.");
  });
  // Delete a contact. A client always keeps at least one. A contact that job orders or reports already point to is hidden
  // (its name stays on those records); an unused one is removed for good. Either way the Client page shows it gone.
  r.delete("/contacts/:id", { preHandler: writeCo, schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, "Client page", async (tx) => {
      const [k] = await tx`select company_id, is_default from company_contacts where id = ${req.params.id} and archived_at is null`;
      if (!k) return "missing" as const;
      const [n] = await tx`select count(*)::int as n from company_contacts where company_id = ${k.company_id} and archived_at is null`;
      if (n!.n <= 1) return "last" as const;
      const [u] = await tx`select (select count(*) from job_orders where contact_id = ${req.params.id}) + (select count(*) from reports where attention_contact_id = ${req.params.id}) as n`;
      if (Number(u!.n) > 0) await tx`update company_contacts set archived_at = now(), is_default = false where id = ${req.params.id}`;
      else await tx`delete from company_contacts where id = ${req.params.id}`;
      if (k.is_default) await tx`update company_contacts set is_default = true where id = (select id from company_contacts where company_id = ${k.company_id} and archived_at is null order by full_name limit 1)`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This contact was not found.");
    if (res === "last") return fail(reply, 409, "last_contact", "A client needs at least one contact. Add another one before deleting this one.");
    return { ok: true };
  });

  /* ================= drill holes ================= */
  r.get("/drill-holes", { preHandler: readMd }, async (req) => {
    const rows = await run(req, "Drill hole", (tx) => tx`
      select d.id, d.code, d.description, d.archived_at, d.company_id, c.name as company_name,
        (select count(*)::int from sample_intervals i where i.drill_hole_id = d.id) as total_sample,
        f.id as coa_id, f.file_name as coa_name, f.size_bytes as coa_size, f.uploaded_at as coa_at
      from drill_holes d join companies c on c.id = d.company_id
      left join coa_files f on f.drill_hole_id = d.id and f.is_current
      order by d.code`);
    return { items: rows.map((d) => ({ id: d.id, code: d.code, description: d.description, archived: !!d.archived_at, companyId: d.company_id, companyName: d.company_name, totalSample: d.total_sample,
      coa: d.coa_id ? { id: d.coa_id, fileName: d.coa_name, sizeBytes: Number(d.coa_size), uploadedAt: d.coa_at } : null })) };
  });
  const dupe = async (tx: Tx, companyId: string, what: string) => { const [c] = await tx`select name from companies where id = ${companyId}`; return `${what} already exists for ${c?.name ?? "this client"}.`; };

  r.post("/drill-holes", { preHandler: writeMd, schema: { body: HoleBody } }, async (req, reply) => {
    const b = req.body; const code = b.code.toUpperCase();
    try { const [row] = await run(req, "Drill hole", (tx) => tx`insert into drill_holes (company_id, code, description) values (${b.companyId}, ${code}, ${b.description}) returning id`); return reply.code(201).send({ id: row!.id }); }
    catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", await run(req, "Drill hole", (tx) => dupe(tx, b.companyId, code)), "code"); throw e; }
  });
  r.patch("/drill-holes/:id", { preHandler: writeMd, schema: { params: Id, body: HoleBody } }, async (req, reply) => {
    const b = req.body; const code = b.code.toUpperCase();
    try {
      const rows = await run(req, "Drill hole", (tx) => tx`update drill_holes set company_id = ${b.companyId}, code = ${code}, description = ${b.description} where id = ${req.params.id} returning id`);
      return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This drill hole was not found.");
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", await run(req, "Drill hole", (tx) => dupe(tx, b.companyId, code)), "code"); throw e; }
  });
  const archiveRoutes = (path: string, table: "drill_holes" | "lithologies" | "seams", screen: string, used: (tx: Tx, id: string) => Promise<number>) => {
    for (const [verb, on] of [["archive", true], ["restore", false]] as const) {
      r.post(`/${path}/:id/${verb}`, { preHandler: writeMd, schema: { params: Id } }, async (req, reply) => {
        const rows = await run(req, screen, (tx) => tx.unsafe(`update ${table} set archived_at = ${on ? "now()" : "null"} where id = $1 returning id`, [req.params.id]));
        return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This record was not found.");
      });
    }
    r.delete(`/${path}/:id`, { preHandler: writeMd, schema: { params: Id } }, async (req, reply) => {
      const res = await run(req, screen, async (tx) => {
        if ((await used(tx, req.params.id)) > 0) return "used" as const;
        return (await tx.unsafe(`delete from ${table} where id = $1 returning id`, [req.params.id])).length ? "ok" as const : "missing" as const;
      });
      if (res === "used") return fail(reply, 409, "in_use", "Samples or files use this record. Archive it instead.");
      return res === "ok" ? { ok: true } : fail(reply, 404, "not_found", "This record was not found.");
    });
  };
  archiveRoutes("drill-holes", "drill_holes", "Drill hole", async (tx, id) => Number((await tx`select (select count(*) from sample_intervals where drill_hole_id = ${id}) + (select count(*) from coa_files where drill_hole_id = ${id}) as n`)[0]!.n));
  archiveRoutes("lithologies", "lithologies", "Lithology", async (tx, id) => Number((await tx`select count(*) as n from sample_intervals where lithology_id = ${id}`)[0]!.n));
  archiveRoutes("seams", "seams", "Seam", async (tx, id) => Number((await tx`select count(*) as n from sample_intervals where seam_id = ${id}`)[0]!.n));

  /* outside CoA: PDF up to 10 MB; the previous file moves to the history and is never deleted (D-30) */
  r.post("/drill-holes/:id/coa", { preHandler: upCoa, schema: { params: Id } }, async (req, reply) => {
    const file = await req.file();
    if (!file) return fail(reply, 400, "no_file", "Choose the CoA file first.");
    const buf = await file.toBuffer();
    if (buf.length > 10 * 1024 * 1024) return fail(reply, 413, "too_big", "The CoA is larger than 10 MB.");
    if (file.mimetype !== "application/pdf" || buf.subarray(0, 4).toString("latin1") !== "%PDF") return fail(reply, 415, "bad_type", "The CoA must be a PDF file.");
    const path = `${req.params.id}/${randomUUID()}.pdf`;
    const up = await admin.storage.from("coa").upload(path, buf, { contentType: "application/pdf" });
    if (up.error) throw up.error;
    const sha = createHash("sha256").update(buf).digest("hex");
    try {
      await run(req, "CoA upload", async (tx) => {
        const [d] = await tx`select id from drill_holes where id = ${req.params.id}`;
        if (!d) throw Object.assign(new Error("missing"), { notFound: true });
        await tx`update coa_files set is_current = false where drill_hole_id = ${req.params.id} and is_current`;
        await tx`insert into coa_files (drill_hole_id, storage_path, file_name, size_bytes, sha256, uploaded_by) values (${req.params.id}, ${path}, ${file.filename}, ${buf.length}, ${sha}, ${req.user!.userId})`;
      });
    } catch (e) {
      await admin.storage.from("coa").remove([path]);
      if ((e as { notFound?: boolean }).notFound) return fail(reply, 404, "not_found", "This drill hole was not found.");
      throw e;
    }
    return reply.code(201).send({ ok: true });
  });
  r.get("/drill-holes/:id/coa", { preHandler: readMd, schema: { params: Id } }, async (req) => {
    const rows = await run(req, "CoA history", (tx) => tx`select f.id, f.file_name, f.size_bytes, f.is_current, f.uploaded_at, f.storage_path, p.full_name as uploaded_by
      from coa_files f left join profiles p on p.id = f.uploaded_by where f.drill_hole_id = ${req.params.id} order by f.uploaded_at desc`);
    const urls = await signed("coa", rows.map((f) => f.storage_path as string));
    return { items: rows.map((f) => ({ id: f.id, fileName: f.file_name, sizeBytes: Number(f.size_bytes), isCurrent: f.is_current, uploadedAt: f.uploaded_at, uploadedBy: f.uploaded_by, url: urls.get(f.storage_path as string) ?? null })) };
  });

  /* ================= lithologies ================= */
  r.get("/lithologies", { preHandler: readMd }, async (req) => {
    const rows = await run(req, "Lithology", (tx) => tx`select l.id, l.name, l.kind, l.archived_at, l.company_id, c.name as company_name,
      (select count(*)::int from sample_intervals i where i.lithology_id = l.id) as total_sample from lithologies l join companies c on c.id = l.company_id order by l.name`);
    return { items: rows.map((l) => ({ id: l.id, name: l.name, kind: l.kind, archived: !!l.archived_at, companyId: l.company_id, companyName: l.company_name, totalSample: l.total_sample })) };
  });
  r.post("/lithologies", { preHandler: writeMd, schema: { body: LithoBody } }, async (req, reply) => {
    const b = req.body;
    try { const [row] = await run(req, "Lithology", (tx) => tx`insert into lithologies (company_id, name, kind) values (${b.companyId}, ${b.name}, ${b.kind}) returning id`); return reply.code(201).send({ id: row!.id }); }
    catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", await run(req, "Lithology", (tx) => dupe(tx, b.companyId, b.name)), "name"); throw e; }
  });
  r.patch("/lithologies/:id", { preHandler: writeMd, schema: { params: Id, body: LithoBody } }, async (req, reply) => {
    const b = req.body;
    try {
      const rows = await run(req, "Lithology", (tx) => tx`update lithologies set company_id = ${b.companyId}, name = ${b.name}, kind = ${b.kind} where id = ${req.params.id} returning id`);
      return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This lithology was not found.");
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", await run(req, "Lithology", (tx) => dupe(tx, b.companyId, b.name)), "name"); throw e; }
  });

  /* ================= seams ================= */
  r.get("/seams", { preHandler: readMd }, async (req) => {
    const rows = await run(req, "Seam", (tx) => tx`select s.id, s.code, s.description, s.sort_order, s.archived_at, s.company_id, c.name as company_name,
      (select count(*)::int from sample_intervals i where i.seam_id = s.id) as total_sample from seams s join companies c on c.id = s.company_id order by s.sort_order nulls last, s.code`);
    return { items: rows.map((s) => ({ id: s.id, code: s.code, description: s.description, sortOrder: s.sort_order, archived: !!s.archived_at, companyId: s.company_id, companyName: s.company_name, totalSample: s.total_sample })) };
  });
  r.post("/seams", { preHandler: writeMd, schema: { body: SeamBody } }, async (req, reply) => {
    const b = req.body; const code = b.code.toUpperCase();
    try { const [row] = await run(req, "Seam", (tx) => tx`insert into seams (company_id, code, description, sort_order) values (${b.companyId}, ${code}, ${b.description}, ${b.sortOrder ?? null}) returning id`); return reply.code(201).send({ id: row!.id }); }
    catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", await run(req, "Seam", (tx) => dupe(tx, b.companyId, code)), "code"); throw e; }
  });
  r.patch("/seams/:id", { preHandler: writeMd, schema: { params: Id, body: SeamBody } }, async (req, reply) => {
    const b = req.body; const code = b.code.toUpperCase();
    try {
      const rows = await run(req, "Seam", (tx) => tx`update seams set company_id = ${b.companyId}, code = ${code}, description = ${b.description}, sort_order = ${b.sortOrder ?? null} where id = ${req.params.id} returning id`);
      return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This seam was not found.");
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", await run(req, "Seam", (tx) => dupe(tx, b.companyId, code)), "code"); throw e; }
  });
}
