// Configuration routes, slice B (Configuration_Slice_B_Plan.md): Services (versioned), Methods and standards (editions) and
// Report templates (versioned). Registered by configRoutes, so the config.write guard applies; writes run as the user (RLS checks
// config.write again) and the audit trigger records each change under the screen "Configuration".
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { asUser, type Tx } from "../db";

const SCREEN = "Configuration";
const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string) => reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}) });
const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
const Id = z.object({ id: z.string().uuid() });

/* ---------- bodies ---------- */
const ServiceBody = z.object({
  name: z.string().trim().min(2, "Enter the name.").max(80),
  turnaroundDays: z.number().int().min(1, "At least 1 day.").max(90, "At most 90 days."),
  status: z.enum(["draft", "active"]),
  isDefault: z.boolean().default(false),
  parameterIds: z.array(z.string().uuid()).max(100).refine((a) => new Set(a).size === a.length, "Each parameter once."),
});
const MethodBody = z.object({
  parameterId: z.string().uuid(), family: z.enum(["ASTM", "ISO", "GBT"]),
  methodCode: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 ./-]{0,19}$/, "Up to 20 letters, numbers, dots, slashes or dashes."),
  edition: z.string().trim().regex(/^[0-9]{4}$/, "Four digits, for example 2023."),
  title: z.string().trim().max(200).optional().default(""),
  repeatability: z.number().min(0).nullable().optional(), reproducibility: z.number().min(0).nullable().optional(),
}).refine((m) => m.repeatability == null || m.reproducibility == null || m.repeatability <= m.reproducibility, { message: "R is not below r.", path: ["reproducibility"] });
const MethodEdit = z.object({
  title: z.string().trim().max(200).optional().default(""),
  repeatability: z.number().min(0).nullable().optional(), reproducibility: z.number().min(0).nullable().optional(),
}).refine((m) => m.repeatability == null || m.reproducibility == null || m.repeatability <= m.reproducibility, { message: "R is not below r.", path: ["reproducibility"] });
const TemplateBody = z.object({
  formCode: z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9 ._-]{2,30}$/, "Letters, numbers, dashes or dots, 3 to 31 characters."),
  title: z.string().trim().min(2, "Enter the title.").max(80),
  statement: z.string().trim().min(2, "Enter the statement.").max(600),
  terms: z.string().trim().min(2, "Enter the terms line.").max(300),
  note: z.string().trim().max(120).optional().default(""),
});

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "service";
const svcStatus = (s: string) => (s === "retired" ? "archived" : s);
const tplStatus = (s: string) => (s === "current" ? "active" : s === "retired" ? "archived" : s);

export async function configBRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const run = <T>(req: { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string }, fn: (tx: Tx) => Promise<T>) =>
    asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);
  const uid = (req: { user?: { userId: string } }) => req.user!.userId;

  /* ================= services ================= */
  const serviceRows = (tx: Tx) => tx`
    select s.id, s.code, s.name, s.version, s.status, s.is_default, s.turnaround_days, s.created_at, s.note, p.full_name as changed_by,
      coalesce((select array_agg(sp.parameter_id order by pr.sort_order) from service_parameters sp join parameters pr on pr.id = sp.parameter_id where sp.service_id = s.id), '{}') as parameter_ids,
      (select count(*)::int from job_orders j where j.service_id = s.id) as used_by
    from services s left join profiles p on p.id = s.created_by
    order by s.sort_order, s.code, s.version desc`;
  const svc = (s: Awaited<ReturnType<typeof serviceRows>>[number]) => ({
    id: s.id, code: s.code, name: s.name, version: s.version, status: svcStatus(s.status as string), isDefault: s.is_default, turnaroundDays: s.turnaround_days,
    parameterIds: s.parameter_ids as string[], parameterCount: (s.parameter_ids as string[]).length, usedBy: s.used_by, changedBy: s.changed_by ?? null, at: s.created_at, note: s.note ?? null,
  });

  r.get("/config/services", async (req) => {
    const rows = await run(req, (tx) => serviceRows(tx));
    return { items: rows.map(svc) };
  });

  const setParams = async (tx: Tx, serviceId: string, ids: string[]) => {
    if (!ids.length) return true;
    const found = await tx`select id from parameters where id = any(${ids}::uuid[])`;
    if (found.length !== ids.length) return false;
    await tx`insert into service_parameters (service_id, parameter_id) select ${serviceId}, x from unnest(${ids}::uuid[]) as x`;
    return true;
  };

  r.post("/config/services", { schema: { body: ServiceBody } }, async (req, reply) => {
    const b = req.body;
    try {
      const res = await run(req, async (tx) => {
        let code = slug(b.name);
        const [dup] = await tx`select 1 from services where code = ${code}`;
        if (dup) code = `${code}-${Math.random().toString(36).slice(2, 5)}`;
        if (b.isDefault && b.status === "active") await tx`update services set is_default = false where is_default and status = 'active'`;
        const [mx] = await tx`select coalesce(max(sort_order), 0) + 1 as n from services`;
        const [row] = await tx`insert into services (code, name, version, status, is_default, turnaround_days, sort_order, created_by)
          values (${code}, ${b.name}, 1, ${b.status}, ${b.isDefault}, ${b.turnaroundDays}, ${mx!.n}, ${uid(req)}) returning id`;
        if (!(await setParams(tx, row!.id, b.parameterIds))) throw Object.assign(new Error("bad parameters"), { bad: true });
        return row!.id as string;
      });
      return reply.code(201).send({ id: res });
    } catch (e) { if ((e as { bad?: boolean }).bad) return fail(reply, 422, "invalid", "A chosen parameter does not exist.", "parameterIds"); throw e; }
  });

  // Draft: changed in place. Active: saved as the next version (Draft or Active as chosen); an Active new version archives the old one.
  r.put("/config/services/:id", { schema: { params: Id, body: ServiceBody } }, async (req, reply) => {
    const b = req.body;
    try {
      const res = await run(req, async (tx) => {
        const [cur] = await tx`select id, code, version, status, sort_order, is_default, name from services where id = ${req.params.id}`;
        if (!cur) return { err: "missing" as const };
        if (cur.status === "retired") return { err: "archived" as const };
        if (b.isDefault && b.status === "active") await tx`update services set is_default = false where is_default and status = 'active' and id <> ${cur.id}`;
        if (cur.status === "draft") {
          if (b.status === "active") await tx`update services set status = 'retired', is_default = false where code = ${cur.code} and status = 'active'`;
          await tx`update services set name = ${b.name}, turnaround_days = ${b.turnaroundDays}, status = ${b.status}, is_default = ${b.isDefault}, created_by = ${uid(req)}, created_at = now() where id = ${cur.id}`;
          await tx`delete from service_parameters where service_id = ${cur.id}`;
          if (!(await setParams(tx, cur.id, b.parameterIds))) return { err: "params" as const };
          return { id: cur.id as string, version: cur.version as number };
        }
        // active: a new version
        if (b.status === "draft") {
          const [d] = await tx`select 1 from services where code = ${cur.code} and status = 'draft'`;
          if (d) return { err: "draft_exists" as const };
        } else {
          await tx`update services set status = 'retired', is_default = false where id = ${cur.id}`;
        }
        const [mx] = await tx`select max(version) + 1 as v from services where code = ${cur.code}`;
        const [row] = await tx`insert into services (code, name, version, status, is_default, turnaround_days, sort_order, created_by)
          values (${cur.code}, ${b.name}, ${mx!.v}, ${b.status}, ${b.isDefault && b.status === "active"}, ${b.turnaroundDays}, ${cur.sort_order}, ${uid(req)}) returning id, version`;
        if (!(await setParams(tx, row!.id, b.parameterIds))) return { err: "params" as const };
        return { id: row!.id as string, version: row!.version as number };
      });
      if ("err" in res) {
        if (res.err === "missing") return fail(reply, 404, "not_found", "This service was not found.");
        if (res.err === "archived") return fail(reply, 409, "archived", "An archived version cannot be changed.");
        if (res.err === "draft_exists") return fail(reply, 409, "draft_exists", "This service already has a draft. Open the draft instead.");
        return fail(reply, 422, "invalid", "A chosen parameter does not exist.", "parameterIds");
      }
      return { ok: true, id: res.id, version: res.version };
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "conflict", "Another version was changed at the same time. Reload and try again."); throw e; }
  });

  r.post("/config/services/:id/activate", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, code, status, is_default from services where id = ${req.params.id}`;
      if (!cur) return "missing" as const;
      if (cur.status !== "draft") return "not_draft" as const;
      const [old] = await tx`select is_default from services where code = ${cur.code} and status = 'active'`;
      await tx`update services set status = 'retired', is_default = false where code = ${cur.code} and status = 'active'`;
      const makeDefault = cur.is_default || old?.is_default;
      if (makeDefault) await tx`update services set is_default = false where is_default and status = 'active'`;
      await tx`update services set status = 'active', is_default = ${!!makeDefault}, created_by = ${uid(req)}, created_at = now() where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This service was not found.");
    if (res === "not_draft") return fail(reply, 409, "not_draft", "Only a draft can be activated.");
    return { ok: true };
  });
  r.post("/config/services/:id/default", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status from services where id = ${req.params.id}`;
      if (!cur) return "missing" as const;
      if (cur.status !== "active") return "not_active" as const;
      await tx`update services set is_default = false where is_default and status = 'active'`;
      await tx`update services set is_default = true where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This service was not found.");
    if (res === "not_active") return fail(reply, 409, "not_active", "Only an active version can be the default.");
    return { ok: true };
  });
  r.post("/config/services/:id/archive", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status, is_default from services where id = ${req.params.id}`;
      if (!cur) return "missing" as const;
      if (cur.status !== "active") return "not_active" as const;
      if (cur.is_default) return "default" as const;
      await tx`update services set status = 'retired' where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This service was not found.");
    if (res === "not_active") return fail(reply, 409, "not_active", "Only an active version can be archived.");
    if (res === "default") return fail(reply, 409, "default", "This is the default for new job orders. Make another service the default first.");
    return { ok: true };
  });
  r.delete("/config/services/:id", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status, (select count(*)::int from job_orders j where j.service_id = services.id) as used from services where id = ${req.params.id}`;
      if (!cur) return "missing" as const;
      if (cur.status !== "draft" || cur.used > 0) return "kept" as const;
      await tx`delete from services where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This service was not found.");
    if (res === "kept") return fail(reply, 409, "kept", "Only a draft that no job order used can be deleted.");
    return { ok: true };
  });

  /* ================= methods and standards ================= */
  r.get("/config/methods", async (req) => {
    const rows = await run(req, (tx) => tx`
      select m.id, m.parameter_id, p.code as parameter_code, p.label as parameter_label, p.sort_order, s.family::text as family, s.code as method_code, s.edition, s.title,
        m.repeatability, m.reproducibility, m.is_default
      from methods m join parameters p on p.id = m.parameter_id join standards s on s.id = m.standard_id
      order by p.sort_order, p.code, s.family, s.edition desc`);
    return { items: rows.map((m) => ({ id: m.id, parameterId: m.parameter_id, parameterCode: m.parameter_code, parameterLabel: m.parameter_label, family: m.family, methodCode: m.method_code,
      edition: m.edition, title: m.title ?? "", repeatability: m.repeatability == null ? null : Number(m.repeatability), reproducibility: m.reproducibility == null ? null : Number(m.reproducibility),
      isDefault: m.is_default })) };
  });

  // A new method, or a new edition of one: the standard row is found or added, the new method becomes the default of that parameter and standard, older editions stay.
  r.post("/config/methods", { schema: { body: MethodBody } }, async (req, reply) => {
    const b = req.body;
    const res = await run(req, async (tx) => {
      const [p] = await tx`select id from parameters where id = ${b.parameterId}`;
      if (!p) return "no_parameter" as const;
      let [std] = await tx`select id from standards where family = ${b.family}::standard_family and code = ${b.methodCode} and edition = ${b.edition}`;
      if (!std) [std] = await tx`insert into standards (family, code, edition, title) values (${b.family}::standard_family, ${b.methodCode}, ${b.edition}, ${b.title || null}) returning id`;
      const [dup] = await tx`select 1 from methods where parameter_id = ${b.parameterId} and standard_id = ${std!.id}`;
      if (dup) return "duplicate" as const;
      await tx`update methods set is_default = false where parameter_id = ${b.parameterId} and standard_id in (select id from standards where family = ${b.family}::standard_family)`;
      const [row] = await tx`insert into methods (parameter_id, standard_id, repeatability, reproducibility, is_default)
        values (${b.parameterId}, ${std!.id}, ${b.repeatability ?? null}, ${b.reproducibility ?? null}, true) returning id`;
      return row!.id as string;
    });
    if (res === "no_parameter") return fail(reply, 422, "invalid", "This parameter does not exist.", "parameterId");
    if (res === "duplicate") return fail(reply, 409, "duplicate", "This edition is already listed for the parameter.", "edition");
    return reply.code(201).send({ id: res });
  });

  // Fix a typo without a new edition: title, r and R only. The title belongs to the standard, so other parameters using it see the same title.
  r.patch("/config/methods/:id", { schema: { params: Id, body: MethodEdit } }, async (req, reply) => {
    const b = req.body;
    const ok = await run(req, async (tx) => {
      const [m] = await tx`select id, standard_id from methods where id = ${req.params.id}`;
      if (!m) return false;
      await tx`update methods set repeatability = ${b.repeatability ?? null}, reproducibility = ${b.reproducibility ?? null} where id = ${m.id}`;
      await tx`update standards set title = ${b.title || null} where id = ${m.standard_id}`;
      return true;
    });
    return ok ? { ok: true } : fail(reply, 404, "not_found", "This method was not found.");
  });

  /* ================= report templates ================= */
  const tplRows = (tx: Tx) => tx`
    select t.id, t.name, t.form_code, t.revision, t.status, t.since, t.fields, t.note, t.created_at, p.full_name as changed_by,
      (select count(*)::int from reports x where x.template_id = t.id) as used_by
    from report_templates t left join profiles p on p.id = t.created_by
    where t.kind = 'coa' and t.company_id is null
    order by t.revision desc`;
  const tpl = (t: Awaited<ReturnType<typeof tplRows>>[number]) => ({
    id: t.id, name: t.name, formCode: t.form_code, revision: t.revision, status: tplStatus(t.status as string), since: t.since,
    title: (t.fields as Record<string, string>).title ?? t.name, statement: (t.fields as Record<string, string>).statement ?? "", terms: (t.fields as Record<string, string>).terms ?? "",
    note: t.note ?? null, changedBy: t.changed_by ?? null, at: t.created_at, usedBy: t.used_by,
  });
  r.get("/config/templates", async (req) => ({ items: (await run(req, tplRows)).map(tpl) }));

  r.post("/config/templates/draft", async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [d] = await tx`select id from report_templates where kind = 'coa' and company_id is null and status = 'draft'`;
      if (d) return { err: "draft_exists" as const, id: d.id as string };
      const [cur] = await tx`select name, form_code, fields, html from report_templates where kind = 'coa' and company_id is null and status = 'current'`;
      if (!cur) return { err: "no_active" as const };
      const [mx] = await tx`select max(revision) + 1 as v from report_templates where kind = 'coa' and company_id is null`;
      const [row] = await tx`insert into report_templates (kind, name, form_code, revision, status, fields, html, note, created_by)
        values ('coa', ${cur.name}, ${cur.form_code}, ${mx!.v}, 'draft', ${tx.json(cur.fields as never)}, ${cur.html}, null, ${uid(req)}) returning id`;
      return { id: row!.id as string };
    });
    if ("err" in res) return res.err === "draft_exists" ? fail(reply, 409, "draft_exists", "There is already a draft. Open it instead.") : fail(reply, 409, "no_active", "There is no active version to copy.");
    return reply.code(201).send({ id: res.id });
  });
  r.put("/config/templates/:id", { schema: { params: Id, body: TemplateBody } }, async (req, reply) => {
    const b = req.body;
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status from report_templates where id = ${req.params.id} and kind = 'coa'`;
      if (!cur) return "missing" as const;
      if (cur.status !== "draft") return "not_draft" as const;
      await tx`update report_templates set name = ${b.title}, form_code = ${b.formCode}, note = ${b.note || null}, created_by = ${uid(req)},
        fields = ${tx.json({ title: b.title, statement: b.statement, terms: b.terms })} where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This version was not found.");
    if (res === "not_draft") return fail(reply, 409, "not_draft", "Only a draft can be changed. Make a new version.");
    return { ok: true };
  });
  r.post("/config/templates/:id/activate", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status from report_templates where id = ${req.params.id} and kind = 'coa'`;
      if (!cur) return "missing" as const;
      if (cur.status !== "draft") return "not_draft" as const;
      await tx`update report_templates set status = 'retired' where kind = 'coa' and company_id is null and status = 'current'`;
      await tx`update report_templates set status = 'current', since = current_date, created_by = ${uid(req)} where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This version was not found.");
    if (res === "not_draft") return fail(reply, 409, "not_draft", "Only a draft can be activated.");
    return { ok: true };
  });
  r.delete("/config/templates/:id", { schema: { params: Id } }, async (req, reply) => {
    const res = await run(req, async (tx) => {
      const [cur] = await tx`select id, status from report_templates where id = ${req.params.id} and kind = 'coa'`;
      if (!cur) return "missing" as const;
      if (cur.status !== "draft") return "kept" as const;
      await tx`delete from report_templates where id = ${cur.id}`;
      return "ok" as const;
    });
    if (res === "missing") return fail(reply, 404, "not_found", "This version was not found.");
    if (res === "kept") return fail(reply, 409, "kept", "Only a draft can be deleted.");
    return { ok: true };
  });
}
