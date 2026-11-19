// Batch routes, part 3: Preparation (ADL) and, below it, the analysis values, the signed RoA and Complete batch (Batch_Build_Design.md section 15;
// spec 9.2.1, F-RES-07; frames 04-02-10 to 14). Values are analyses with one primary value on the parameter's reporting basis. The CSO has no
// `result.read`: for that role the routes answer with counts only, read with the API's own connection after the batch.read check.
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { fixedCarbon, hydrogenSeyler, netCalorific, type Standard } from "@sgsi/shared";
import { requireAny } from "../auth";
import { createHash, randomUUID } from "node:crypto";
import { admin } from "../supabase";
import { system, type Tx } from "../db";
import { NoParam, SCREEN, fail, logStep, notify, runAs, runAsActor, uuid } from "../batch-lib";

/** "8,42" and "8.42" are both accepted; the value is kept with a dot. Null when it is not a plain number. */
export const parseValue = (t: string): string | null => {
  const s = t.trim().replace(/\s/g, "").replace(",", ".");
  return /^\d+(\.\d+)?$/.test(s) ? s : null;
};
export const decimalsOf = (s: string) => (s.split(".")[1] ?? "").length;

export interface Rule { severity: "warn" | "block"; low: number | null; high: number | null; unit: string | null; message: string | null; parameter: string }
/** The active range rule of a parameter (V-31, V-32, V-40, V-44, V-50): its typical range, severity and message, or null when there is none. */
export async function rangeRules(tx: Tx): Promise<Map<string, Rule>> {
  const rows = await tx`select v.severity, v.params, p.code, p.unit, p.typical_low, p.typical_high
    from validation_rules v join parameters p on p.code = v.params->>'parameter' where v.active`;
  return new Map(rows.map((r) => [r.code as string, {
    severity: r.severity as "warn" | "block", parameter: r.code as string, unit: (r.unit as string | null) ?? null, message: (r.params?.message as string | undefined) ?? null,
    low: r.typical_low == null ? null : Number(r.typical_low), high: r.typical_high == null ? null : Number(r.typical_high),
  }]));
}
/** Why a value is outside its rule, or null. "KEP-3303 is above 20 %: check the value" unless the rule has a message of its own. */
export function ruleLine(ref: string, v: number, r: Rule): string | null {
  const above = r.high != null && v > r.high, below = r.low != null && v < r.low;
  if (!above && !below) return null;
  const unit = r.unit ? ` ${r.unit}` : "";
  if (r.message) return `${ref}: ${r.message.replace(/\{(parameter|low|high|unit)\}/g, (_m, k: string) => ({ parameter: r.parameter, low: String(r.low ?? ""), high: String(r.high ?? ""), unit: r.unit ?? "" })[k] ?? "")}`;
  return `${ref} is ${above ? "above" : "below"} ${above ? r.high : r.low}${unit}: check the value`;
}

const AdlBody = z.object({ values: z.array(z.object({ sampleId: uuid, value: z.string().trim().max(20).nullable() })).max(2000) });

export async function batchResultsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const readBatches = requireAny("batch.read"), writePrep = requireAny("result.write.prep"), finishPrep = requireAny("batch.transition.prep");
  const uid = (req: { user?: { userId: string } }) => req.user!.userId;
  const sees = (req: { user?: { permissions: string[] } }) => !!req.user?.permissions.includes("result.read");
  const batchOf = async (tx: Tx, no: string, lock = false) => {
    const [b] = lock
      ? await tx`select b.id, b.batch_no, b.status::text as status, b.job_order_id, j.order_no from batches b join job_orders j on j.id = b.job_order_id where b.batch_no = ${no} for update of b`
      : await tx`select b.id, b.batch_no, b.status::text as status, b.job_order_id, j.order_no from batches b join job_orders j on j.id = b.job_order_id where b.batch_no = ${no}`;
    return b as { id: string; batch_no: string; status: string; job_order_id: string; order_no: string } | undefined;
  };
  const adlParam = (tx: Tx) => tx`select id, decimals, unit from parameters where code = 'ADL'`;
  /** Samples that take an ADL: received and not on hold. */
  const adlSamples = (tx: Tx, batchId: string) => tx`select s.id, s.row_no, s.client_ref, s.sample_code, s.sample_no, s.on_hold, s.hold_reason,
      a.entered_at, p.full_name as entered_by, (v.value_num)::text as value
    from samples s left join analyses a on a.sample_id = s.id and a.parameter_id = (select id from parameters where code = 'ADL') and a.item_id is null and a.round = 1
      left join analysis_values v on v.analysis_id = a.id and v.is_primary left join profiles p on p.id = a.entered_by
    where s.batch_id = ${batchId} and s.received_at is not null order by s.row_no`;

  /* ================= Preparation: ADL ================= */
  r.get("/batches/:no/adl", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const out = await runAs(req, async (tx) => {
      const b = await batchOf(tx, req.params.no);
      if (!b) return null;
      const [tm] = await tx`select 1 from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = ${b.id} and p.code = 'TM'`;
      return { b, tmOrdered: !!tm };
    });
    if (!out) return fail(reply, 404, "not_found", "This batch was not found.");
    const { b, tmOrdered } = out;
    const open = b.status === "preparation";
    if (!sees(req)) {
      // counts only (the CSO never sees result values, B-3)
      const c = await system({ requestId: req.id, screen: SCREEN }, async (tx) => {
        const [x] = await tx`select count(*) filter (where not s.on_hold)::int as total,
            count(*) filter (where not s.on_hold and exists (select 1 from analyses a join parameters p on p.id = a.parameter_id where a.sample_id = s.id and p.code = 'ADL'))::int as saved
          from samples s where s.batch_id = ${b.id} and s.received_at is not null`;
        return x!;
      });
      return { hidden: true, open, status: b.status, saved: c.saved, total: c.total, tmOrdered };
    }
    const { rows, rule, adl } = await runAs(req, async (tx) => {
      const [rows, rules, [adl]] = await Promise.all([adlSamples(tx, b.id), rangeRules(tx), adlParam(tx)]);
      return { rows, rule: rules.get("ADL") ?? null, adl: adl! };
    });
    const live = rows.filter((x) => !x.on_hold);
    const saved = live.filter((x) => x.value != null).length;
    const lines = rule ? live.filter((x) => x.value != null).map((x) => ruleLine(x.client_ref as string, Number(x.value), rule)).filter(Boolean) as string[] : [];
    const checks = [{ ok: !tmOrdered || saved === live.length, text: tmOrdered ? `ADL saved for every sample (TM is ordered): ${saved} of ${live.length}` : "ADL is optional: TM is not ordered", warn: false }, ...lines.map((text) => ({ ok: false, text, warn: true }))];
    return {
      hidden: false, open, status: b.status, tmOrdered, saved, total: live.length, decimals: adl.decimals, unit: adl.unit,
      range: rule ? { low: rule.low, high: rule.high, severity: rule.severity } : null,
      ready: b.status === "prep_finished" || b.status === "analysis" || b.status === "analysis_finished" || b.status === "completed",
      canFinish: open && (!tmOrdered || saved === live.length), checks,
      items: rows.map((x) => ({ id: x.id, rowNo: x.row_no, clientRef: x.client_ref, sampleCode: x.sample_code, sampleNo: x.sample_no, held: x.on_hold ? (x.hold_reason ?? "On hold") : null,
        value: x.value, enteredBy: x.entered_by, enteredAt: x.entered_at })),
    };
  });

  r.put("/batches/:no/adl", { preHandler: writePrep, schema: { params: NoParam, body: AdlBody } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await batchOf(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "preparation") return { code: 409, key: "locked", text: b.status === "created" ? "Confirm reception first." : "Preparation is finished, so the ADL values are locked." };
      const [[adl], rules] = await Promise.all([adlParam(tx), rangeRules(tx)]);
      const rule = rules.get("ADL");
      const mine = new Map((await adlSamples(tx, b.id)).map((x) => [x.id as string, x]));
      let saved = 0, cleared = 0;
      for (const [i, v] of req.body.values.entries()) {
        const s = mine.get(v.sampleId);
        if (!s) return { code: 404, key: "not_found", text: "A sample is not in this batch.", field: `values.${i}` };
        if (s.on_hold) return { code: 409, key: "held", text: `${s.client_ref} is on hold, so it has no ADL.`, field: `values.${i}` };
        const text = v.value === null || v.value === "" ? null : parseValue(v.value);
        if (v.value && text === null) return { code: 422, key: "invalid", text: `${s.client_ref}: enter the ADL as a number, for example 8.42.`, field: `values.${i}` };
        if (text !== null) {
          if (decimalsOf(text) > adl!.decimals) return { code: 422, key: "invalid", text: `${s.client_ref}: use at most ${adl!.decimals} decimals.`, field: `values.${i}` };
          if (Number(text) > 100) return { code: 422, key: "invalid", text: `${s.client_ref}: a percentage can't be more than 100.`, field: `values.${i}` };
          const line = rule && rule.severity === "block" ? ruleLine(s.client_ref as string, Number(text), rule) : null;
          if (line) return { code: 422, key: "invalid", text: `${line}.`, field: `values.${i}` };
        }
        const [cur] = await tx`select a.id from analyses a where a.sample_id = ${s.id} and a.parameter_id = ${adl!.id} and a.item_id is null and a.round = 1`;
        if (text === null) { if (cur) { await tx`delete from analyses where id = ${cur.id}`; cleared++; } continue; }
        if (s.value != null && Number(s.value) === Number(text) && cur) continue;      // unchanged: keep who entered it
        const id = cur?.id ?? (await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at)
          values (${s.id}, ${adl!.id}, 1, 'entered', 'entered', ${uid(req)}, now()) returning id`)[0]!.id;
        if (cur) await tx`update analyses set entered_by = ${uid(req)}, entered_at = now() where id = ${cur.id}`;
        await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${id}, 'ar', ${text}, true)
          on conflict (analysis_id, basis) do update set value_num = excluded.value_num, is_primary = true`;
        saved++;
      }
      return { ok: true as const, saved, cleared };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return res;
  });

  r.post("/batches/:no/finish-prep", { preHandler: finishPrep, schema: { params: NoParam } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await batchOf(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "preparation") return { code: 409, key: "locked", text: b.status === "created" ? "Confirm reception first." : "Preparation is already finished." };
      const [tm] = await tx`select 1 from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = ${b.id} and p.code = 'TM'`;
      const rows = (await adlSamples(tx, b.id)).filter((x) => !x.on_hold);
      const missing = rows.filter((x) => x.value == null);
      if (tm && missing.length) return { code: 409, key: "not_ready", text: `Before you can finish preparation: ADL saved for every sample (${rows.length - missing.length} of ${rows.length}).` };
      await tx`update batches set status = 'prep_finished', prep_finished_at = now(), prep_finished_by = ${uid(req)} where id = ${b.id}`;
      await logStep(tx, b.id, "preparation", "prep_finished", "Preparation finished", `${rows.length - missing.length} of ${rows.length} samples with an ADL`, uid(req));
      const [me] = await tx`select full_name from profiles where id = ${uid(req)}`;
      return { ok: true as const, no: b.batch_no, n: rows.length, by: (me?.full_name as string) ?? "a colleague" };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    // N3: the analysts are told the batch is ready for data entry
    try {
      await runAsActor(req, SCREEN, (tx) => notify(tx, { event: "N3", title: `${res.no} is ready for data entry`, body: `${res.n} samples, ADL done by ${res.by}.`, link: `/batches/${res.no}/analysis` }, { roles: ["analyst"] }, uid(req)));
    } catch (e) { req.log.error(e); }
    return { ok: true };
  });

  /* ================= Analysis ================= */
  const CALC = new Set(["FC", "NCV"]);                       // worked out from the entered values (never typed)
  interface Col { key: string; parameterId: string; itemId: string | null; code: string; label: string; group: string; unit: string | null; basis: string | null; decimals: number; kind: "number" | "text" | "calc"; qualifier: boolean }
  /** The grid's columns: the batch's parameters (not PREP and ADL), one per chosen item for Ash analysis and Trace elements. */
  const columnsOf = async (tx: Tx, b: { id: string; job_order_id: string }): Promise<Col[]> => {
    const [ps, items] = await Promise.all([
      tx`select p.id, p.code, p.label, p.category, p.unit, p.kind::text as kind, p.measured_basis, p.decimals, p.allows_qualifier, p.is_group
        from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = ${b.id} and p.code <> all(${["PREP", "ADL", "O"]}::text[]) order by p.sort_order`,
      tx`select i.id, i.parameter_id, i.code from job_order_group_items g join parameter_group_items i on i.id = g.item_id where g.job_order_id = ${b.job_order_id} order by i.sort_order`,
    ]);
    const out: Col[] = [];
    for (const p of ps) {
      const base = { parameterId: p.id as string, group: (p.category as string).toUpperCase(), unit: p.unit as string | null, basis: p.measured_basis as string | null, decimals: p.decimals as number, qualifier: !!p.allows_qualifier };
      if (p.is_group) for (const i of items.filter((x) => x.parameter_id === p.id)) out.push({ ...base, group: (p.label as string).toUpperCase(), key: `${p.id}:${i.id}`, itemId: i.id as string, code: i.code as string, label: i.code as string, kind: "number" });
      else out.push({ ...base, key: p.id as string, itemId: null, code: p.code as string, label: p.label as string, kind: CALC.has(p.code as string) ? "calc" : p.kind === "text" ? "text" : "number" });
    }
    return out;
  };
  const cellsOf = (tx: Tx, batchId: string) => tx`select a.id, a.sample_id, a.parameter_id, a.item_id, a.source::text as source, a.entered_at, p.full_name as by,
      (v.value_num)::text as value, v.qualifier, v.value_text
    from analyses a join samples s on s.id = a.sample_id left join analysis_values v on v.analysis_id = a.id and v.is_primary left join profiles p on p.id = a.entered_by
    where s.batch_id = ${batchId} and a.round = 1 and a.parameter_id <> (select id from parameters where code = 'ADL')`;
  const liveSamples = (tx: Tx, batchId: string) => tx`select s.id, s.row_no, s.client_ref, s.sample_code, s.sample_no, s.on_hold, s.hold_reason from samples s
    where s.batch_id = ${batchId} and s.received_at is not null order by s.row_no`;
  const keyOf = (c: { parameter_id: string; item_id: string | null }) => (c.item_id ? `${c.parameter_id}:${c.item_id}` : c.parameter_id);
  const numOf = (c: Record<string, any> | undefined): string | null => (c?.value != null ? (c.value as string) : null);

  /** Lines for the checklist: Block rules (V-01 sum of the proximate, V-12 TM not below IM) and Warn rules per sample. */
  async function gridChecks(tx: Tx, cols: Col[], samples: Array<Record<string, any>>, cells: Array<Record<string, any>>) {
    const rules = await rangeRules(tx);
    const codeOf = new Map(cols.map((c) => [c.parameterId, c.code]));
    const [ps] = [await tx`select id, code from parameters where code = any(${["IM", "TM", "ASH", "VM", "FC"]}::text[])`];
    const pid = new Map(ps.map((p) => [p.code as string, p.id as string]));
    const blocks: string[] = [], warns: string[] = [];
    for (const s of samples.filter((x) => !x.on_hold)) {
      const mine = new Map(cells.filter((c) => c.sample_id === s.id && !c.item_id).map((c) => [c.parameter_id as string, c]));
      const v = (code: string) => numOf(mine.get(pid.get(code) ?? ""));
      const tm = v("TM"), im = v("IM");
      if (tm != null && im != null && Number(tm) < Number(im)) blocks.push(`${s.client_ref}: total moisture (${tm}) is below inherent moisture (${im}).`);
      const [i, a, m, f] = [v("IM"), v("ASH"), v("VM"), v("FC")];
      if (i != null && a != null && m != null && f != null && Math.abs(Number(i) + Number(a) + Number(m) + Number(f) - 100) > 0.05) blocks.push(`${s.client_ref}: IM + Ash + VM + FC is not 100.`);
      const out: string[] = [];
      for (const c of mine.values()) {
        const code = codeOf.get(c.parameter_id as string), rule = code ? rules.get(code) : undefined;
        if (rule && rule.severity === "warn" && c.value != null && ruleLine("x", Number(c.value), rule)) out.push(cols.find((k) => k.parameterId === c.parameter_id)!.label);
      }
      if (out.length) warns.push(`${s.client_ref} has ${out.join(" and ")} outside the typical range: check ${out.length > 1 ? "them" : "it"}`);
    }
    return { blocks, warns };
  }

  const analysisCounts = async (tx: Tx, b: { id: string; job_order_id: string }) => {
    const [cols, samples, cells] = await Promise.all([columnsOf(tx, b), liveSamples(tx, b.id), cellsOf(tx, b.id)]);
    const entry = cols.filter((c) => c.kind !== "calc"), live = samples.filter((s) => !s.on_hold);
    const ok = new Set(live.map((s) => s.id as string));
    const keys = new Set(entry.map((c) => c.key));
    const saved = cells.filter((c) => ok.has(c.sample_id) && c.source !== "calculated" && keys.has(keyOf(c as never))).length;
    return { cols, samples, cells, entry, live, saved, total: live.length * entry.length };
  };

  r.get("/batches/:no/analysis", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const out = await runAs(req, async (tx) => {
      const [b] = await tx`select b.id, b.batch_no, b.status::text as status, b.job_order_id, b.standard::text as standard, b.analysis_started_at, sp.full_name as started_by
        from batches b left join profiles sp on sp.id = b.analysis_started_by where b.batch_no = ${req.params.no}`;
      return b ?? null;
    });
    if (!out) return fail(reply, 404, "not_found", "This batch was not found.");
    const b = out as { id: string; status: string; job_order_id: string; standard: string; analysis_started_at: string | null; started_by: string | null };
    const open = b.status === "analysis" || b.status === "prep_finished";
    const done = b.status === "analysis_finished" || b.status === "completed";
    const data = sees(req)
      ? await runAs(req, (tx) => analysisCounts(tx, b))
      : await system({ requestId: req.id, screen: SCREEN }, (tx) => analysisCounts(tx, b));
    const base = { status: b.status, standard: b.standard, open, ready: done, saved: data.saved, total: data.total, startedAt: b.analysis_started_at, startedBy: b.started_by };
    if (!sees(req)) return { hidden: true, ...base };
    const { blocks, warns } = await runAs(req, (tx) => gridChecks(tx, data.cols, data.samples, data.cells));
    const missing = data.total - data.saved;
    const rules = await runAs(req, (tx) => rangeRules(tx));
    return {
      hidden: false, ...base,
      canFinish: b.status === "analysis" && !missing && !blocks.length,
      cols: data.cols.map((c) => ({ ...c, range: (() => { const x = rules.get(c.code); return x ? { low: x.low, high: x.high, severity: x.severity } : null; })() })),
      checks: [
        { ok: !missing && data.total > 0, text: `A value for every ordered parameter of every sample: ${data.saved} of ${data.total}`, warn: false },
        ...blocks.map((text) => ({ ok: false, text, warn: false })),
        ...warns.map((text) => ({ ok: false, text, warn: true })),
      ],
      rows: data.samples.map((s) => ({
        id: s.id, rowNo: s.row_no, clientRef: s.client_ref, sampleCode: s.sample_code, sampleNo: s.sample_no, held: s.on_hold ? (s.hold_reason ?? "On hold") : null,
        cells: Object.fromEntries(data.cells.filter((c) => c.sample_id === s.id).map((c) => [keyOf(c as never), { value: c.value, qualifier: c.qualifier, text: c.value_text, calc: c.source === "calculated", by: c.by, at: c.entered_at }])),
      })),
    };
  });

  r.get("/batches/:no/progress", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const res = await system({ requestId: req.id, screen: SCREEN }, async (tx) => {
      const [b] = await tx`select id, job_order_id, status::text as status from batches where batch_no = ${req.params.no}`;
      if (!b) return null;
      const c = await analysisCounts(tx, b as never);
      const [x] = await tx`select count(*) filter (where not s.on_hold)::int as total,
          count(*) filter (where not s.on_hold and exists (select 1 from analyses a join parameters p on p.id = a.parameter_id where a.sample_id = s.id and p.code = 'ADL'))::int as saved
        from samples s where s.batch_id = ${b.id} and s.received_at is not null`;
      return { status: b.status, adl: { saved: x!.saved, total: x!.total }, values: { saved: c.saved, total: c.total } };
    });
    return res ?? fail(reply, 404, "not_found", "This batch was not found.");
  });

  /** FC and Net CV are stored like any value, source "calculated", worked out again after every save. */
  async function recalc(tx: Tx, batch: { id: string; standard: string }, sampleIds: string[], by: string) {
    const ps = await tx`select p.id, p.code, p.measured_basis from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = ${batch.id}`;
    const pid = new Map(ps.map((p) => [p.code as string, p]));
    const fc = pid.get("FC"), ncv = pid.get("NCV");
    if (!fc && !ncv) return;
    const need = ["IM", "ASH", "VM", "GCV", "TM"].map((c) => pid.get(c)?.id as string | undefined).filter(Boolean) as string[];
    const vals = await tx`select a.sample_id, a.parameter_id, v.value_num::text as value from analyses a join analysis_values v on v.analysis_id = a.id and v.is_primary
      where a.sample_id = any(${sampleIds}::uuid[]) and a.round = 1 and a.item_id is null and a.parameter_id = any(${need}::uuid[])`;
    const put = async (sampleId: string, p: Record<string, any>, value: string | null) => {
      const [cur] = await tx`select id from analyses where sample_id = ${sampleId} and parameter_id = ${p.id as string} and item_id is null and round = 1`;
      if (value === null) { if (cur) await tx`delete from analyses where id = ${cur.id}`; return; }
      const id = cur?.id ?? (await tx`insert into analyses (sample_id, parameter_id, round, source, status, entered_by, entered_at) values (${sampleId}, ${p.id as string}, 1, 'calculated', 'entered', ${by}, now()) returning id`)[0]!.id;
      await tx`insert into analysis_values (analysis_id, basis, value_num, is_primary) values (${id}, ${(p.measured_basis as string | null) ?? "adb"}, ${value}, true)
        on conflict (analysis_id, basis) do update set value_num = excluded.value_num, is_primary = true`;
    };
    for (const sid of sampleIds) {
      const v = (code: string) => { const id = pid.get(code)?.id; return vals.find((x) => x.sample_id === sid && x.parameter_id === id)?.value as string | undefined; };
      const [im, ash, vm, gcv, tm] = [v("IM"), v("ASH"), v("VM"), v("GCV"), v("TM")];
      if (fc) await put(sid, fc, fixedCarbon(im, ash, vm));
      if (ncv) await put(sid, ncv, netCalorific(gcv, tm, im, hydrogenSeyler(gcv, vm, im, ash), batch.standard as Standard));
    }
  }

  const AnalysisBody = z.object({ values: z.array(z.object({ sampleId: uuid, key: z.string().max(80), value: z.string().trim().max(120).nullable() })).max(5000) });
  r.put("/batches/:no/analysis", { preHandler: requireAny("result.write"), schema: { params: NoParam, body: AnalysisBody } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const [b] = await tx`select b.id, b.batch_no, b.status::text as status, b.job_order_id, b.standard::text as standard from batches b where b.batch_no = ${req.params.no} for update of b`;
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "prep_finished" && b.status !== "analysis")
        return { code: 409, key: "locked", text: b.status === "analysis_finished" || b.status === "completed" ? "Analysis is finished, so the values are locked." : "Finish preparation first." };
      const [cols, samples, rules] = await Promise.all([columnsOf(tx, b as never), liveSamples(tx, b.id), rangeRules(tx)]);
      const colOf = new Map(cols.map((c) => [c.key, c])), smp = new Map(samples.map((s) => [s.id as string, s]));
      let saved = 0, cleared = 0;
      const touched = new Set<string>();
      for (const [i, v] of req.body.values.entries()) {
        const at = `values.${i}`, s = smp.get(v.sampleId), c = colOf.get(v.key);
        if (!s) return { code: 404, key: "not_found", text: "A sample is not in this batch.", field: at };
        if (!c) return { code: 404, key: "not_found", text: `${s.client_ref}: this parameter is not in the batch.`, field: at };
        if (c.kind === "calc") return { code: 409, key: "calculated", text: `${c.label} is calculated, so it can't be typed.`, field: at };
        if (s.on_hold) return { code: 409, key: "held", text: `${s.client_ref} is on hold, so it takes no values.`, field: at };
        const raw = v.value ?? "";
        let num: string | null = null, qual: string | null = null, txt: string | null = null;
        if (raw !== "") {
          if (c.kind === "text") txt = raw;
          else {
            let t = raw;
            if (t.startsWith("<")) {
              if (!c.qualifier) return { code: 422, key: "invalid", text: `${s.client_ref}: ${c.label} doesn't take "<".`, field: at };
              qual = "<"; t = t.slice(1);
            }
            num = parseValue(t);
            if (num === null) return { code: 422, key: "invalid", text: `${s.client_ref}: enter ${c.label} as a number, for example ${(8.5).toFixed(c.decimals)}.`, field: at };
            if (decimalsOf(num) > c.decimals) return { code: 422, key: "invalid", text: `${s.client_ref}: ${c.label}, use at most ${c.decimals} decimal${c.decimals === 1 ? "" : "s"}.`, field: at };
            if (c.unit === "%" && Number(num) > 100) return { code: 422, key: "invalid", text: `${s.client_ref}: a percentage can't be more than 100.`, field: at };
            const rule = rules.get(c.code), line = rule && rule.severity === "block" ? ruleLine(s.client_ref as string, Number(num), rule) : null;
            if (line) return { code: 422, key: "invalid", text: `${line}.`, field: at };
          }
        }
        const [cur] = await tx`select a.id from analyses a where a.sample_id = ${s.id} and a.parameter_id = ${c.parameterId} and a.item_id is not distinct from ${c.itemId} and a.round = 1`;
        touched.add(s.id as string);
        if (raw === "") { if (cur) { await tx`delete from analyses where id = ${cur.id}`; cleared++; } continue; }
        const id = cur?.id ?? (await tx`insert into analyses (sample_id, parameter_id, item_id, round, source, status, entered_by, entered_at)
          values (${s.id}, ${c.parameterId}, ${c.itemId}, 1, 'entered', 'entered', ${uid(req)}, now()) returning id`)[0]!.id;
        if (cur) await tx`update analyses set entered_by = ${uid(req)}, entered_at = now(), source = 'entered' where id = ${cur.id}`;
        await tx`insert into analysis_values (analysis_id, basis, value_num, qualifier, value_text, is_primary) values (${id}, ${c.basis ?? "adb"}, ${num}, ${qual}, ${txt}, true)
          on conflict (analysis_id, basis) do update set value_num = excluded.value_num, qualifier = excluded.qualifier, value_text = excluded.value_text, is_primary = true`;
        saved++;
      }
      await recalc(tx, b as never, [...touched], uid(req));
      if (b.status === "prep_finished" && saved > 0) {
        await tx`update batches set status = 'analysis', analysis_started_at = now(), analysis_started_by = ${uid(req)} where id = ${b.id}`;
        await logStep(tx, b.id, "prep_finished", "analysis", "Analysis started", null, uid(req));
      }
      return { ok: true as const, saved, cleared };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    return res;
  });

  r.post("/batches/:no/finish-analysis", { preHandler: requireAny("batch.transition.analysis"), schema: { params: NoParam } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const [b] = await tx`select b.id, b.batch_no, b.status::text as status, b.job_order_id, j.order_no from batches b join job_orders j on j.id = b.job_order_id where b.batch_no = ${req.params.no} for update of b`;
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "analysis") return { code: 409, key: "locked", text: b.status === "analysis_finished" || b.status === "completed" ? "Analysis is already finished." : "Enter the first values first." };
      const d = await analysisCounts(tx, b as never);
      if (d.saved < d.total) return { code: 409, key: "not_ready", text: `Before you can finish analysis: a value for every ordered parameter (${d.saved} of ${d.total}).` };
      const { blocks } = await gridChecks(tx, d.cols, d.samples, d.cells);
      if (blocks.length) return { code: 409, key: "not_ready", text: blocks[0]! };
      await tx`update batches set status = 'analysis_finished', analysis_finished_at = now(), analysis_finished_by = ${uid(req)} where id = ${b.id}`;
      await logStep(tx, b.id, "analysis", "analysis_finished", "Analysis finished", `${d.saved} values for ${d.live.length} samples`, uid(req));
      const [me] = await tx`select full_name from profiles where id = ${uid(req)}`;
      return { ok: true as const, no: b.batch_no as string, n: d.live.length, by: (me?.full_name as string) ?? "a colleague" };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    try {
      await runAsActor(req, SCREEN, (tx) => notify(tx, { event: "N4", title: `${res.no} analysis is finished`, body: `${res.n} samples, finished by ${res.by}. Upload the signed RoA and complete the batch.`, link: `/batches/${res.no}/analysis` }, { roles: ["lab_admin"] }, uid(req)));
    } catch (e) { req.log.error(e); }
    return { ok: true };
  });

  /* ================= Signed RoA and Complete batch ================= */
  const DOCS = "batch-documents", MAX_ROA = 10 * 1024 * 1024;
  const roaOf = (tx: Tx, batchId: string) => tx`select d.id, d.roa_no, d.file_name, d.size_bytes, d.storage_path, d.uploaded_at, p.full_name as uploaded_by
    from batch_documents d left join profiles p on p.id = d.uploaded_by where d.batch_id = ${batchId} and d.kind = 'signed_roa'`;
  const upload = requireAny("batch.document.upload");

  r.get("/batches/:no/roa", { preHandler: readBatches, schema: { params: NoParam } }, async (req, reply) => {
    const out = await runAs(req, async (tx) => {
      const b = await batchOf(tx, req.params.no);
      if (!b) return null;
      const [d] = await roaOf(tx, b.id);
      return { status: b.status, d };
    });
    if (!out) return fail(reply, 404, "not_found", "This batch was not found.");
    const canDownload = !!req.user?.permissions.includes("roa.download"), d = out.d;
    return {
      status: out.status, canDownload,
      roa: d ? { roaNo: d.roa_no, fileName: canDownload ? d.file_name : null, sizeBytes: canDownload ? Number(d.size_bytes) : null, uploadedBy: d.uploaded_by, uploadedAt: d.uploaded_at } : null,
    };
  });

  r.post("/batches/:no/roa", { preHandler: upload, schema: { params: NoParam } }, async (req, reply) => {
    const file = await req.file().catch(() => null);
    if (!file) return fail(reply, 400, "no_file", "Choose the signed RoA first.");
    const roaNo = ((file.fields.roaNo as { value?: string } | undefined)?.value ?? "").trim();
    const buf = await file.toBuffer().catch(() => null);
    if (!roaNo) return fail(reply, 422, "invalid", "Enter the RoA number.", "roaNo");
    if (roaNo.length > 60) return fail(reply, 422, "invalid", "The RoA number can be up to 60 characters.", "roaNo");
    if (!buf || buf.length > MAX_ROA || file.file.truncated) return fail(reply, 413, "too_big", "The file is larger than 10 MB.", "file");
    if (!buf.length) return fail(reply, 422, "empty", "The file is empty.", "file");
    if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return fail(reply, 415, "bad_type", "Use a PDF file.", "file");
    const name = file.filename.replace(/[\\/\u0000-\u001f]/g, "_").slice(-200);
    const pre = await runAs(req, async (tx) => {
      const b = await batchOf(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "analysis_finished") return { code: 409, key: "locked", text: b.status === "completed" ? "The batch is complete, so the RoA can't change." : "Finish the analysis first." };
      const [dup] = await tx`select 1 from batch_documents where roa_no = ${roaNo} and batch_id <> ${b.id}`;
      if (dup) return { code: 409, key: "duplicate", text: `The RoA number ${roaNo} is already used by another batch.`, field: "roaNo" };
      const [old] = await roaOf(tx, b.id);
      return { ok: true as const, b, oldPath: (old?.storage_path as string | undefined) ?? null };
    });
    if ("code" in pre) { const e = pre as { code: number; key: string; text: string; field?: string }; return fail(reply, e.code, e.key, e.text, e.field); }
    const path = `${pre.b.id}/${randomUUID()}.pdf`;
    const up = await admin.storage.from(DOCS).upload(path, buf, { contentType: "application/pdf" });
    if (up.error) throw up.error;
    try {
      await runAs(req, async (tx) => {
        await tx`delete from batch_documents where batch_id = ${pre.b.id} and kind = 'signed_roa'`;
        await tx`insert into batch_documents (batch_id, kind, roa_no, storage_path, file_name, size_bytes, sha256, uploaded_by)
          values (${pre.b.id}, 'signed_roa', ${roaNo}, ${path}, ${name}, ${buf.length}, ${createHash("sha256").update(buf).digest("hex")}, ${uid(req)})`;
        await logStep(tx, pre.b.id, "analysis_finished", "analysis_finished", pre.oldPath ? "Signed RoA replaced" : "Signed RoA uploaded", roaNo, uid(req));
      });
    } catch (e) { await admin.storage.from(DOCS).remove([path]); throw e; }
    if (pre.oldPath) await admin.storage.from(DOCS).remove([pre.oldPath]);
    return reply.code(201).send({ ok: true, roaNo, fileName: name });
  });

  r.delete("/batches/:no/roa", { preHandler: upload, schema: { params: NoParam } }, async (req, reply) => {
    const res = await runAs(req, async (tx) => {
      const b = await batchOf(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "analysis_finished") return { code: 409, key: "locked", text: "The RoA can only be removed before the batch is completed." };
      const [d] = await roaOf(tx, b.id);
      if (!d) return { code: 404, key: "not_found", text: "No RoA is attached." };
      await tx`delete from batch_documents where id = ${d.id}`;
      await logStep(tx, b.id, "analysis_finished", "analysis_finished", "Signed RoA removed", d.roa_no as string, uid(req));
      return { ok: true as const, path: d.storage_path as string };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    await admin.storage.from(DOCS).remove([res.path]);
    return { ok: true };
  });

  r.get("/batches/:no/roa/file", { preHandler: requireAny("roa.download"), schema: { params: NoParam } }, async (req, reply) => {
    const d = await runAs(req, async (tx) => { const b = await batchOf(tx, req.params.no); return b ? (await roaOf(tx, b.id))[0] ?? null : null; });
    if (!d) return fail(reply, 404, "not_found", "No signed RoA is attached to this batch.");
    const { data, error } = await admin.storage.from(DOCS).createSignedUrl(d.storage_path as string, 3600, { download: d.file_name as string });
    if (error || !data) throw error ?? new Error("no link");
    return { url: data.signedUrl, fileName: d.file_name };
  });

  r.post("/batches/:no/complete", { preHandler: requireAny("batch.complete"), schema: { params: NoParam } }, async (req, reply) => {
    // the lab admin has no write access to analyses of her own: the freeze is a step the API takes on her behalf, after batch.complete was checked
    const res = await runAsActor(req, SCREEN, async (tx) => {
      const b = await batchOf(tx, req.params.no, true);
      if (!b) return { code: 404, key: "not_found", text: "This batch was not found." };
      if (b.status !== "analysis_finished") return { code: 409, key: "locked", text: b.status === "completed" ? "The batch is already complete." : "Finish the analysis first." };
      const [d] = await roaOf(tx, b.id);
      if (!d) return { code: 409, key: "not_ready", text: "Upload the signed RoA first." };
      const v = await tx`update analyses set status = 'verified' where sample_id in (select id from samples where batch_id = ${b.id}) and status = 'entered' returning id`;
      await tx`update batches set status = 'completed', completed_at = now(), completed_by = ${uid(req)} where id = ${b.id}`;
      await logStep(tx, b.id, "analysis_finished", "completed", "Batch completed", `${d.roa_no}, ${v.length} values verified`, uid(req));
      const [open] = await tx`select count(*)::int as n from batches where job_order_id = ${b.job_order_id} and status <> 'completed'`;
      return { ok: true as const, no: b.batch_no, order: b.order_no, roa: d.roa_no as string, last: (open?.n ?? 1) === 0 };
    });
    if ("code" in res) { const e = res as { code: number; key: string; text: string }; return fail(reply, e.code, e.key, e.text); }
    if (res.last) {
      try {
        await runAsActor(req, SCREEN, (tx) => notify(tx, { event: "N5", title: `${res.order} is ready for its certificate`, body: `${res.no} was the last open batch of the job order.`, link: `/orders/${res.order}` }, { roles: ["lab_admin"] }, uid(req)));
      } catch (e) { req.log.error(e); }
    }
    return { ok: true, last: res.last };
  });

  void uuid;
}
