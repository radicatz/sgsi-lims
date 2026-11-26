// Sample history (Phase 5, slice B4; Search_Screen_Plan.md section 7, spec S-30, frames 08-Search-04-Sample_history): one sample's story as a timeline of the events the lab
// records in v1. Nothing is stored for it: it is read from the sample's own stamps, the batch log, the audit log (hold and release), the analyses, the signed RoA and the
// reports. The sample is read as the signed-in user (row-level security decides whether it can be opened at all). Values appear only with `result.read` (the CSO has none).
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { SAMPLE_STATE } from "@sgsi/shared";
import { authenticate, requireAny } from "../auth";
import { asUser, system, type Tx } from "../db";
import { fail, uuid } from "../batch-lib";
import { PdfUnavailable } from "../pdf";
import { logExport } from "./audit";
import { renderHistoryPdf } from "../sample-history-pdf";

const SCREEN = "Search";
export interface HistoryEvent {
  key: string; at: string | null; by: string | null; title: string; detail: string | null; tone: "done" | "warn" | "pending";
  values?: Array<{ code: string; value: string; basis: string; unit: string | null }>; link?: { label: string; kind: "batch" | "coa" | "roa" | "analysis"; to: string };
}
const iso = (d: unknown) => (d == null ? null : new Date(d as string).toISOString());

export async function sampleHistoryRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook("preHandler", authenticate);

  r.get("/samples/:id/history", { preHandler: requireAny("search.use"), schema: { params: z.object({ id: uuid }) } }, async (req, reply) => {
    const h = await loadHistory(req.user as User, req.id, req.params.id);
    return h ?? fail(reply, 404, "not_found", "This sample was not found.");
  });

  // the same history as a PDF (frame Desktop-08-Search-04-Sample_history-01-Default, Export PDF): the page's contents, rendered by Gotenberg like the CoA and the RoA
  r.get("/samples/:id/history/pdf", { preHandler: requireAny("search.use"), schema: { params: z.object({ id: uuid }) } }, async (req, reply) => {
    const h = await loadHistory(req.user as User, req.id, req.params.id);
    if (!h) return fail(reply, 404, "not_found", "This sample was not found.");
    try {
      const pdf = await renderHistoryPdf(h);
      await logExport(req as never, `Sample history: ${h.sample.title}`, h.sample.orderNo, h.events.length);   // decision C-4
      return reply.header("content-type", "application/pdf").header("content-disposition", `attachment; filename="History-${h.sample.title.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf"`).send(pdf);
    } catch (e) {
      if (e instanceof PdfUnavailable) return fail(reply, 503, "pdf_unavailable", e.message);
      throw e;
    }
  });
}

type User = { userId: string; claims: Record<string, unknown>; permissions: string[] };
export type SampleHistory = NonNullable<Awaited<ReturnType<typeof loadHistory>>>;

/** One sample's card and timeline, or null when the caller may not open it. */
async function loadHistory(user: User, requestId: string, id: string) {
    const sees = user.permissions.includes("result.read");
    const found = await asUser(user, { requestId, screen: SCREEN }, async (tx: Tx) => {
      const [s] = await tx`select s.id, s.client_ref, s.sample_no, s.sample_code, s.client_description, s.ply_comp, s.sample_type, s.drill_hole_text, s.depth_from::float as depth_from, s.depth_to::float as depth_to,
          s.mass_received_kg::float as mass, s.condition, s.on_hold, s.hold_reason, s.state, s.created_at, s.arrived_at, s.arrived_by, s.received_at, s.received_by, s.released_at, s.released_by,
          s.not_received_at, s.not_received_by, s.not_received_reason, s.batch_id, s.job_order_id, s.attributes->>'holdNote' as hold_note,
          j.order_no, j.created_by as order_by, j.created_at as order_at, c.name as company, c.id as company_id, b.batch_no, b.status::text as batch_status,
          rb.batch_no as released_from, (select count(*)::int from sample_attachments a where a.sample_id = s.id) as photos
        from v_samples s join job_orders j on j.id = s.job_order_id join companies c on c.id = j.company_id left join batches b on b.id = s.batch_id left join batches rb on rb.id = s.released_from_batch_id
        where s.id = ${id}`;
      return s ?? null;
    });
    if (!found) return null;

    // the rest is read with the API's own connection: the sample above already proved the caller may open it, and a role without result.read still needs the counts
    const out = await system({ requestId, screen: SCREEN }, async (tx) => {
      const ids = [found.order_by, found.released_by, found.not_received_by, found.arrived_by, found.received_by].filter(Boolean) as string[];
      const log = found.batch_id ? await tx`select l.action, l.at, l.by_user, l.note from batch_status_log l where l.batch_id = ${found.batch_id} order by l.at, l.id` : [];
      const holds = await tx`select a.at, a.actor, a.before->>'on_hold' as was, a.after->>'on_hold' as now, a.after->>'hold_reason' as reason, a.before->>'hold_reason' as was_reason
        from audit_log a where a.table_name = 'samples' and a.record_id = ${found.id} and a.action = 'update' and (a.before->>'on_hold') is distinct from (a.after->>'on_hold') order by a.at`;
      const an = await tx`select p.code, p.unit, p.decimals, a.entered_by, a.entered_at, a.status::text as status, v.basis, v.value_num, v.value_text, v.qualifier, p.sort_order
        from analyses a join parameters p on p.id = a.parameter_id left join analysis_values v on v.analysis_id = a.id and v.is_primary where a.sample_id = ${found.id} and a.round = 1 order by p.sort_order`;
      const roa = found.batch_id ? (await tx`select roa_no, uploaded_at, uploaded_by from batch_documents where batch_id = ${found.batch_id}`)[0] : undefined;
      const reps = found.batch_id ? await tx`select r.id, r.report_no, r.revision, r.status::text as status, r.issued_at, r.issued_by, r.revision_reason, r.voided_at, r.voided_by, r.void_reason,
          (select json_agg(json_build_object('on', d.sent_on::text, 'by', d.by_user, 'at', d.at, 'channels', d.channels, 'to', d.recipient) order by d.at) from report_deliveries d where d.report_id = r.id) as sent
        from reports r join report_sources rs on rs.report_id = r.id where rs.batch_id = ${found.batch_id} and r.kind = 'coa' and r.status in ('issued', 'superseded', 'void') order by r.revision, r.issued_at` : [];
      for (const x of log) if (x.by_user) ids.push(x.by_user as string);
      for (const x of holds) if (x.actor) ids.push(x.actor as string);
      for (const x of an) if (x.entered_by) ids.push(x.entered_by as string);
      if (roa?.uploaded_by) ids.push(roa.uploaded_by as string);
      for (const x of reps) { for (const k of ["issued_by", "voided_by"]) if (x[k]) ids.push(x[k] as string); for (const d of (x.sent as Array<{ by: string }> | null) ?? []) if (d.by) ids.push(d.by); }
      const [lab] = await tx`select value->>'name' as name from app_settings where key = 'laboratory'`;
      const people = new Map((await tx`select id, full_name from profiles where id = any(${[...new Set(ids)]}::uuid[])`).map((p) => [p.id as string, p.full_name as string]));
      return { log, holds, an, roa, reps, people, lab: (lab?.name as string | undefined) ?? "PT Sentra Geo Survey Indonesia" };
    });
    const who = (id: unknown) => (id ? out.people.get(id as string) ?? null : null);
    const mass = found.mass != null ? `${found.mass.toFixed(2)} kg` : null;
    const ev: HistoryEvent[] = [];
    const batchLog = (action: string) => out.log.find((l) => l.action === action);
    const adl = out.an.find((a) => a.code === "ADL"), vals = out.an.filter((a) => a.code !== "ADL");

    ev.push({ key: "registered", at: iso(found.order_at), by: who(found.order_by), title: `Registered on ${found.order_no}`, detail: null, tone: "done" });
    if (found.released_at) ev.push({ key: "released", at: iso(found.released_at), by: who(found.released_by), title: `Released from ${found.released_from ?? "its batch"}, awaiting arrival`, detail: null, tone: "warn" });
    if (found.not_received_at) ev.push({ key: "not-received", at: iso(found.not_received_at), by: who(found.not_received_by), title: "Marked as not received", detail: found.not_received_reason ?? null, tone: "warn" });
    if (found.arrived_at) ev.push({ key: "arrived", at: iso(found.arrived_at), by: who(found.arrived_by), title: found.sample_no ? `Arrived, Sample ID ${found.sample_no}` : "Arrived", detail: null, tone: "done" });
    const batchCreated = batchLog("Batch created");
    if (found.batch_no && batchCreated) ev.push({ key: "batched", at: iso(batchCreated.at), by: who(batchCreated.by_user), title: `Added to batch ${found.batch_no}`, detail: null, tone: "done", link: { label: found.batch_no, kind: "batch", to: `/batches/${found.batch_no}` } });
    if (found.received_at) ev.push({ key: "received", at: iso(found.received_at), by: who(found.received_by), title: found.sample_code ? `Received and labelled ${found.sample_code}` : "Received",
      detail: [mass && `Mass ${mass}`, found.condition && `Condition ${found.condition}`, found.photos ? `${found.photos} ${found.photos === 1 ? "photo" : "photos"}` : null].filter(Boolean).join("	") || null, tone: "done" });
    for (const h of out.holds) ev.push(h.now === "true"
      ? { key: `hold-${h.at}`, at: iso(h.at), by: who(h.actor), title: "Put on hold", detail: (h.reason as string | null) ?? null, tone: "warn" }
      : { key: `release-${h.at}`, at: iso(h.at), by: who(h.actor), title: "Released from hold", detail: (h.was_reason as string | null) ?? null, tone: "done" });
    const prepDone = batchLog("Preparation finished");
    if (prepDone) ev.push({ key: "prep", at: iso(prepDone.at), by: who(adl?.entered_by ?? prepDone.by_user), title: adl && sees && adl.value_num != null ? `Preparation finished, ADL ${Number(adl.value_num).toFixed(adl.decimals ?? 2)}${adl.unit ? ` ${adl.unit}` : ""}` : "Preparation finished", detail: null, tone: "done" });
    else if (adl) ev.push({ key: "adl", at: iso(adl.entered_at), by: who(adl.entered_by), title: sees && adl.value_num != null ? `ADL saved, ${Number(adl.value_num).toFixed(adl.decimals ?? 2)}${adl.unit ? ` ${adl.unit}` : ""}` : "ADL saved", detail: null, tone: "done" });
    if (vals.length) {
      const first = [...vals].sort((a, b) => +new Date(a.entered_at) - +new Date(b.entered_at))[0]!, params = new Set(vals.map((v) => v.code as string));
      ev.push({
        key: "values", at: iso(first.entered_at), by: who(first.entered_by), title: `Values entered (${params.size} ${params.size === 1 ? "parameter" : "parameters"})`, detail: null, tone: "done",
        ...(sees ? { values: vals.filter((v) => v.value_num != null || v.value_text).map((v) => ({ code: v.code as string, value: `${v.qualifier ?? ""}${v.value_text ?? Number(v.value_num).toFixed(v.decimals ?? 2)}`, basis: String(v.basis ?? "").toUpperCase(), unit: (v.unit as string | null) ?? null })),
          ...(found.batch_no ? { link: { label: "View values", kind: "analysis" as const, to: `/batches/${found.batch_no}/analysis` } } : {}) } : {}),
      });
    }
    const aDone = batchLog("Analysis finished");
    if (aDone) ev.push({ key: "analysis-done", at: iso(aDone.at), by: who(aDone.by_user), title: "Analysis finished", detail: null, tone: "done" });
    const done = batchLog("Batch completed");
    if (done) ev.push({ key: "completed", at: iso(done.at), by: who(done.by_user), title: out.roa ? `Batch completed, signed RoA ${out.roa.roa_no} uploaded` : "Batch completed", detail: null, tone: "done" });
    for (const rep of out.reps) {
      if (rep.issued_at) ev.push({ key: `coa-${rep.id}`, at: iso(rep.issued_at), by: who(rep.issued_by), title: rep.revision > 1 ? `CoA revised: ${rep.report_no} published` : `${rep.report_no} published`, detail: (rep.revision_reason as string | null) ?? null, tone: "done", link: { label: rep.report_no as string, kind: "coa", to: `/reports/coa/${rep.id}` } });
      if (rep.voided_at) ev.push({ key: `void-${rep.id}`, at: iso(rep.voided_at), by: who(rep.voided_by), title: `${rep.report_no} voided`, detail: (rep.void_reason as string | null) ?? null, tone: "warn" });
      for (const d of (rep.sent as Array<{ on: string; by: string; at: string; channels: string[]; to: string }> | null) ?? []) ev.push({ key: `sent-${rep.id}-${d.at}`, at: iso(d.at), by: who(d.by), title: `${rep.report_no} sent`, detail: `${d.channels.join(" and ")} to ${d.to}`, tone: "done" });
    }
    ev.sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
    // steps not reached yet: grey, with no person or date
    const pending: HistoryEvent[] = [];
    const has = (k: string) => ev.some((e) => e.key === k || e.key.startsWith(k));
    if (found.state !== "not_received" && found.state !== "expected") {
      if (!has("prep") && !has("adl")) pending.push({ key: "p-prep", at: null, by: null, title: "Preparation", detail: null, tone: "pending" });
      if (!has("values")) pending.push({ key: "p-values", at: null, by: null, title: "Analysis", detail: null, tone: "pending" });
      if (!out.reps.some((x) => x.status === "issued")) pending.push({ key: "p-coa", at: null, by: null, title: "CoA", detail: null, tone: "pending" });
    }
    const [label, tone] = SAMPLE_STATE[found.state as keyof typeof SAMPLE_STATE] ?? [found.state, "grey"];
    return {
      sample: {
        id: found.id, title: found.sample_no ?? found.client_ref, sampleNo: found.sample_no, sampleCode: found.sample_code, clientRef: found.client_ref, status: label, statusTone: tone,
        orderNo: found.order_no, batchNo: found.batch_no, companyId: found.company_id, company: found.company, drillHole: found.drill_hole_text, depthFrom: found.depth_from, depthTo: found.depth_to,
        description: found.client_description, plyComp: found.ply_comp, sampleType: found.sample_type, mass: found.mass, condition: found.condition, held: found.on_hold ? { reason: found.hold_reason, note: found.hold_note } : null,
      },
      events: [...ev, ...pending], values: sees, lab: out.lab,
    };
}
