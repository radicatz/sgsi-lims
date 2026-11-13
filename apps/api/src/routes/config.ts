// Configuration routes, slice A (Admin screen plan section 6; Configuration_Build_Design.md): the hub summary, the Security,
// Laboratory and Numbering settings, Lookups, Parameters, Validation rules and Formulas (view). Every route needs config.write;
// writes run as the user, so the *_write policies check config.write again and the audit trigger records each change.
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { asUser, type Tx } from "../db";
import { authenticate, requireAny } from "../auth";
import { configBRoutes } from "./config-b";

const SCREEN = "Configuration";
const fail = (reply: FastifyReply, code: number, key: string, message: string, field?: string) => reply.code(code).send({ code: key, text: message, ...(field ? { field } : {}) });
const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";

/* ---------- settings: schema and defaults per key ---------- */
const Security = z.object({
  lock_after_attempts: z.number().int().min(3, "At least 3 attempts.").max(10, "At most 10 attempts."),
  lock_minutes: z.number().int().min(5, "At least 5 minutes.").max(1440, "At most 24 hours."),
  idle_sign_out_minutes: z.number().int().min(5, "At least 5 minutes.").max(480, "At most 8 hours."),
  warn_before_seconds: z.number().int().min(15, "At least 15 seconds.").max(300, "At most 5 minutes."),
  min_password_length: z.number().int().min(8, "At least 8 characters.").max(64, "At most 64 characters."),
  require_letter_and_number: z.boolean(), require_special_character: z.boolean(), forbid_email_in_password: z.boolean(),
  reset_link_minutes: z.number().int().min(15).max(1440), invite_days: z.number().int().min(1, "At least 1 day.").max(30, "At most 30 days."),
}).refine((s) => s.warn_before_seconds < s.idle_sign_out_minutes * 60, { message: "The warning must come before the sign-out.", path: ["warn_before_seconds"] });
const Branch = z.object({ code: z.string().trim().regex(/^[A-Z]{2}$/, "Two capital letters, for example RI."), name: z.string().trim().min(2, "Enter the office name.").max(80) });
const Laboratory = z.object({
  name: z.string().trim().min(2, "Enter the laboratory name.").max(120), address: z.string().trim().max(300).optional().default(""),
  accreditation: z.string().trim().max(60).optional().default(""), place_of_issue: z.string().trim().min(2, "Enter the place of issue.").max(60),
  branches: z.array(Branch).min(1, "Keep at least one branch office.").max(20).refine((b) => new Set(b.map((x) => x.code)).size === b.length, "Each branch code once."),
});
// numbering patterns use a fixed set of tokens; each needs a running number
const TOKENS = ["YYYY", "YY", "MM", "DD", "YYMMDD", "NNNN", "NNN", "NN", "CCC", "BB", "LOT", "job_order", "revision"];
const pattern = (needs: RegExp, needsText: string) => z.string().trim().min(3).max(60)
  .refine((p) => [...p.matchAll(/\{([^}]*)\}/g)].every((m) => TOKENS.includes(m[1]!)), "Use only the listed tokens.")
  .refine((p) => needs.test(p), needsText);
const Numbering = z.object({
  job_order: pattern(/\{N{2,4}\}/, "Include a running number such as {NNNN}."), batch: pattern(/\{N{2,4}\}/, "Include a running number such as {NNNN}."),
  sample_id: pattern(/\{NNN\}/, "Include {NNN}, the running number per client and day."), sample_code: pattern(/\{NNN\}/, "Include {NNN}."),
  coa: pattern(/\{revision\}/, "Include {revision}."), sample_no_width: z.number().int().min(3, "At least 3 digits.").max(5, "At most 5 digits."),
});
const SETTINGS = { security: Security, laboratory: Laboratory, numbering: Numbering } as const;
type SettingKey = keyof typeof SETTINGS;
export const SETTING_DEFAULTS: Record<SettingKey, Record<string, unknown>> = {
  security: { lock_after_attempts: 5, lock_minutes: 15, idle_sign_out_minutes: 30, warn_before_seconds: 60, min_password_length: 10, require_letter_and_number: true,
    require_special_character: false, forbid_email_in_password: true, reset_link_minutes: 60, invite_days: 7 },
  laboratory: { name: "PT Sentra Geo Survey Indonesia", address: "", accreditation: "LP-1234-IDN", place_of_issue: "Samarinda", branches: [{ code: "RI", name: "Rapak Indah" }] },
  numbering: { job_order: "JO-{YYYY}-{NNNN}", batch: "B-{YYYY}-{NNNN}", sample_id: "SG.{YYMMDD}.{CCC}.{BB}.{NNN}", sample_code: "{CCC}.{BB}.{NNN}.{LOT}", coa: "CoA-{job_order}-{revision}", sample_no_width: 3 },
};
const Key = z.object({ key: z.enum(["security", "laboratory", "numbering"]) });

/* ---------- list items ---------- */
const LIST_KEYS = ["sample_condition", "hold_reason", "photo_tag", "lithology_kind", "send_channel", "not_received_reason", "sample_type"] as const;
const LookupBody = z.object({ listKey: z.enum(LIST_KEYS), value: z.string().trim().min(1, "Enter the value.").max(60), needsRemark: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(999).default(0), active: z.boolean().default(true) });
const ParamBody = z.object({
  code: z.string().trim().regex(/^[A-Za-z0-9_.-]{1,16}$/, "Up to 16 letters, numbers, dots or dashes."), name: z.string().trim().min(1, "Enter the name.").max(120),
  label: z.string().trim().min(1, "Enter the label.").max(60), category: z.string().trim().min(1).max(40), unit: z.string().trim().max(20).nullable().optional(),
  measuredBasis: z.enum(["ar", "adb", "db", "daf", "ash"]).nullable().optional(), decimals: z.number().int().min(0).max(6),
  allowsQualifier: z.boolean(), typicalLow: z.number().nullable().optional(), typicalHigh: z.number().nullable().optional(), active: z.boolean(),
}).refine((p) => p.typicalLow == null || p.typicalHigh == null || p.typicalLow < p.typicalHigh, { message: "The low end must be below the high end.", path: ["typicalHigh"] });
const RuleBody = z.object({ severity: z.enum(["warn", "block"]), active: z.boolean(), tolerance: z.number().min(0).max(5).optional(),
  low: z.number().nullable().optional(), high: z.number().nullable().optional() })
  .refine((r) => r.low == null || r.high == null || r.low < r.high, { message: "The low end must be below the high end.", path: ["high"] });
const FIXED_RULES = ["V-12"];   // structural checks: listed, not edited

export async function configRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);
  r.addHook("preHandler", requireAny("config.write"));
  const run = <T>(req: { user?: { userId: string; claims: Record<string, unknown> } | undefined; id: string }, fn: (tx: Tx) => Promise<T>) =>
    asUser(req.user as { userId: string; claims: Record<string, unknown> }, { requestId: req.id, screen: SCREEN }, fn);

  /* hub: count and last change per section */
  r.get("/config/summary", async (req) => run(req, async (tx) => {
    const [c] = await tx`select (select count(*)::int from parameters where not is_group) as parameters, (select count(*)::int from services where status = 'active') as services,
      (select count(*)::int from methods where is_default) as methods, (select count(*)::int from validation_rules) as rules, (select count(distinct list_key)::int from lookups) as lookups,
      (select count(*)::int from report_templates where kind = 'coa') as templates, (select count(*)::int from formulas) as formulas`;
    const last = await tx`select distinct on (k) k, at, actor_name from (
        select case when table_name in ('parameters','parameter_group_items') then 'parameters' when table_name in ('services','service_parameters') then 'services'
          when table_name in ('methods','standards') then 'methods' when table_name = 'validation_rules' then 'rules' when table_name = 'lookups' then 'lookups'
          when table_name = 'report_templates' then 'templates' when table_name = 'formulas' then 'formulas' when table_name = 'app_settings' then coalesce(record_id, 'settings') end as k, at, actor_name
        from audit_log where table_name in ('parameters','parameter_group_items','services','service_parameters','methods','standards','validation_rules','lookups','report_templates','formulas','app_settings')) x
      where k is not null order by k, at desc`;
    return { counts: c, lastChanged: Object.fromEntries(last.map((l) => [l.k, { at: l.at, by: l.actor_name }])) };
  }));

  await configBRoutes(app);

  /* settings pages */
  r.get("/config/settings/:key", { schema: { params: Key } }, async (req) => {
    const [row] = await run(req, (tx) => tx`select value, updated_at from app_settings where key = ${req.params.key}`);
    return { value: { ...SETTING_DEFAULTS[req.params.key], ...(row?.value ?? {}) }, defaults: SETTING_DEFAULTS[req.params.key], updatedAt: row?.updated_at ?? null };
  });
  r.put("/config/settings/:key", { schema: { params: Key } }, async (req, reply) => {
    const parsed = SETTINGS[req.params.key].safeParse(req.body);
    if (!parsed.success) { const i = parsed.error.issues[0]!; return fail(reply, 422, "invalid", i.message, String(i.path[0] ?? "form")); }
    await run(req, (tx) => tx`insert into app_settings (key, value, updated_at) values (${req.params.key}, ${tx.json(parsed.data as never)}, now())
      on conflict (key) do update set value = excluded.value, updated_at = now()`);
    req.log.info({ setting: req.params.key, by: req.user!.email }, "configuration setting changed");   // security-relevant: logged as well as audited
    return { ok: true };
  });

  /* lookups */
  r.get("/config/lookups", async (req) => ({ items: (await run(req, (tx) => tx`select id, list_key, value, needs_remark, sort_order, active from lookups order by list_key, sort_order, value`))
    .map((l) => ({ id: l.id, listKey: l.list_key, value: l.value, needsRemark: l.needs_remark, sortOrder: l.sort_order, active: l.active })) }));
  r.post("/config/lookups", { schema: { body: LookupBody } }, async (req, reply) => {
    const b = req.body;
    try { const [row] = await run(req, (tx) => tx`insert into lookups (list_key, value, needs_remark, sort_order, active) values (${b.listKey}, ${b.value}, ${b.needsRemark}, ${b.sortOrder}, ${b.active}) returning id`); return reply.code(201).send({ id: row!.id }); }
    catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", `${b.value} is already in this list.`, "value"); throw e; }
  });
  r.patch("/config/lookups/:id", { schema: { params: z.object({ id: z.string().uuid() }), body: LookupBody } }, async (req, reply) => {
    const b = req.body;
    try {
      const rows = await run(req, (tx) => tx`update lookups set value = ${b.value}, needs_remark = ${b.needsRemark}, sort_order = ${b.sortOrder}, active = ${b.active} where id = ${req.params.id} returning id`);
      return rows.length ? { ok: true } : fail(reply, 404, "not_found", "This value was not found.");
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", `${b.value} is already in this list.`, "value"); throw e; }
  });

  /* parameters: in use = on a job order, a batch or a result; its code is then locked, and it is deactivated, never deleted */
  r.get("/config/parameters", async (req) => {
    const rows = await run(req, (tx) => tx`select p.*, exists (select 1 from job_order_parameters x where x.parameter_id = p.id) or exists (select 1 from batch_parameters x where x.parameter_id = p.id)
        or exists (select 1 from analyses x where x.parameter_id = p.id) as in_use,
      coalesce((select array_agg(distinct s.family::text) from methods m join standards s on s.id = m.standard_id where m.parameter_id = p.id), '{}') as families
      from parameters p order by p.sort_order, p.code`);
    return { items: rows.map((p) => ({ id: p.id, code: p.code, name: p.name, label: p.label, category: p.category, unit: p.unit, kind: p.kind, measuredBasis: p.measured_basis,
      decimals: p.decimals, allowsQualifier: p.allows_qualifier, typicalLow: p.typical_low == null ? null : Number(p.typical_low), typicalHigh: p.typical_high == null ? null : Number(p.typical_high),
      isGroup: p.is_group, active: p.active, inUse: p.in_use, families: p.families })) };
  });
  /* a new parameter goes last in its group; it has no methods until they are added under Methods and standards */
  r.post("/config/parameters", { schema: { body: ParamBody } }, async (req, reply) => {
    const b = req.body;
    if (b.typicalLow != null && b.typicalHigh != null && b.typicalLow >= b.typicalHigh) return fail(reply, 400, "invalid", "The low end must be below the high end.", "typicalHigh");
    try {
      const [row] = await run(req, (tx) => tx`insert into parameters (code, name, label, category, unit, measured_basis, decimals, allows_qualifier, typical_low, typical_high, active, sort_order)
        values (${b.code}, ${b.name}, ${b.label}, ${b.category}, ${b.unit ?? null}, ${b.measuredBasis ?? null}, ${b.decimals}, ${b.allowsQualifier}, ${b.typicalLow ?? null}, ${b.typicalHigh ?? null}, ${b.active},
          (select coalesce(max(sort_order), 0) + 1 from parameters where category = ${b.category})) returning id`);
      return reply.code(201).send({ id: row!.id });
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", `${b.code} is already used by another parameter.`, "code"); throw e; }
  });
  r.patch("/config/parameters/:id", { schema: { params: z.object({ id: z.string().uuid() }), body: ParamBody } }, async (req, reply) => {
    const b = req.body;
    try {
      const res = await run(req, async (tx) => {
        const [p] = await tx`select code, exists (select 1 from job_order_parameters x where x.parameter_id = parameters.id) or exists (select 1 from batch_parameters x where x.parameter_id = parameters.id)
          or exists (select 1 from analyses x where x.parameter_id = parameters.id) as in_use from parameters where id = ${req.params.id}`;
        if (!p) return "missing" as const;
        if (p.in_use && p.code !== b.code) return "locked" as const;
        await tx`update parameters set code = ${b.code}, name = ${b.name}, label = ${b.label}, category = ${b.category}, unit = ${b.unit ?? null}, measured_basis = ${b.measuredBasis ?? null},
          decimals = ${b.decimals}, allows_qualifier = ${b.allowsQualifier}, typical_low = ${b.typicalLow ?? null}, typical_high = ${b.typicalHigh ?? null}, active = ${b.active} where id = ${req.params.id}`;
        // range rules point at the parameter by code: carry a rename over
        if (p.code !== b.code) await tx`update validation_rules set params = jsonb_set(params, '{parameter}', to_jsonb(${b.code}::text)) where params->>'parameter' = ${p.code}`;
        return "ok" as const;
      });
      if (res === "missing") return fail(reply, 404, "not_found", "This parameter was not found.");
      if (res === "locked") return fail(reply, 409, "in_use", "This parameter is in use, so its code cannot change.", "code");
      return { ok: true };
    } catch (e) { if (isUnique(e)) return fail(reply, 409, "duplicate", `${b.code} is already used by another parameter.`, "code"); throw e; }
  });

  /* validation rules: range rules keep their bounds on the parameter (typical range); V-12 is fixed */
  r.get("/config/rules", async (req) => {
    const rows = await run(req, (tx) => tx`select v.code, v.description, v.severity, v.params, v.active, p.id as parameter_id, p.code as parameter_code, p.unit, p.typical_low, p.typical_high
      from validation_rules v left join parameters p on p.code = v.params->>'parameter' order by v.code`);
    return { items: rows.map((v) => ({ code: v.code, description: v.description, severity: v.severity, active: v.active, fixed: FIXED_RULES.includes(v.code as string),
      tolerance: v.params?.tolerance ?? null, parameter: v.parameter_code ?? null, unit: v.unit ?? null,
      low: v.typical_low == null ? null : Number(v.typical_low), high: v.typical_high == null ? null : Number(v.typical_high) })) };
  });
  r.patch("/config/rules/:code", { schema: { params: z.object({ code: z.string().max(10) }), body: RuleBody } }, async (req, reply) => {
    if (FIXED_RULES.includes(req.params.code)) return fail(reply, 409, "fixed", "This rule is fixed and cannot be changed.");
    const b = req.body;
    const ok = await run(req, async (tx) => {
      const [v] = await tx`select params from validation_rules where code = ${req.params.code}`;
      if (!v) return false;
      const params = { ...(v.params ?? {}), ...(b.tolerance !== undefined ? { tolerance: b.tolerance } : {}) };
      await tx`update validation_rules set severity = ${b.severity}, active = ${b.active}, params = ${tx.json(params)} where code = ${req.params.code}`;
      if (v.params?.parameter && (b.low !== undefined || b.high !== undefined))
        await tx`update parameters set typical_low = ${b.low ?? null}, typical_high = ${b.high ?? null} where code = ${v.params.parameter}`;
      return true;
    });
    return ok ? { ok: true } : fail(reply, 404, "not_found", "This rule was not found.");
  });

  /* formulas: view only in v1 (S-15) */
  r.get("/config/formulas", async (req) => ({ items: (await run(req, (tx) => tx`select f.id, p.code as parameter, p.name, f.target_basis, f.version, f.expression, f.inputs, f.valid_from, f.status
      from formulas f join parameters p on p.id = f.parameter_id order by p.sort_order, f.target_basis, f.version`))
    .map((f) => ({ id: f.id, parameter: f.parameter, name: f.name, basis: f.target_basis, version: f.version, expression: f.expression, inputs: f.inputs, validFrom: f.valid_from, status: f.status })) }));
}
