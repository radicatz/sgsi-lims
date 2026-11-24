// The RoA the app drafts for a batch (owner, Nov 24 2026; Reports_Build_Design.md 17): the batch's parameters, every sample that reached the lab
// and is not on hold, the latest round of each value (entered or verified), on all four bases. Read under the caller's RLS (`result.read`).
import { methodLabel, roaSample, valueKey, renderRoaFooter, renderRoaHtml, type CertParam, type CertValue, type RoaPayload } from "@sgsi/shared";
import type { Tx } from "./db";
import { TZ } from "./batch-lib";
import { env } from "./env";
import { baseAssets, PdfUnavailable } from "./pdf";

const dayIn = (d: Date | string | null) => (d ? new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d)) : null);

/** Null when the batch is not found. `reportedOn` defaults to today in the lab's time zone. */
export async function buildRoaPayload(tx: Tx, batchNo: string, o: { number?: string | null; reportedOn?: string } = {}): Promise<RoaPayload | null> {
  const [b] = await tx`select b.id, b.batch_no, b.job_order_id, b.standard::text as standard, b.analysis_started_at, b.analysis_finished_at, b.reception_confirmed_at,
      j.order_no, j.client_reference, j.contact_id, c.name as company, c.address as company_address, d.roa_no
    from batches b join job_orders j on j.id = b.job_order_id join companies c on c.id = j.company_id
    left join batch_documents d on d.batch_id = b.id and d.kind = 'signed_roa' where b.batch_no = ${batchNo}`;
  if (!b) return null;
  const [att] = await tx`select full_name from company_contacts where id = ${b.contact_id}`;
  const samples = await tx`select s.id, s.sample_no, s.sample_code, s.mass_received_kg::text as mass, s.received_at
    from samples s where s.batch_id = ${b.id} and s.received_at is not null and not s.on_hold and s.not_received_at is null order by s.sample_no`;
  const ids = samples.map((s) => s.id as string);
  const [params, items, methods, vals, [lab], [tested]] = await Promise.all([
    tx`select p.id, p.code, p.name, p.unit, p.decimals, p.measured_basis, p.kind::text as kind, p.sort_order, p.is_group
      from batch_parameters bp join parameters p on p.id = bp.parameter_id where bp.batch_id = ${b.id} and p.code not in ('PREP', 'ADL', 'O') order by p.sort_order`,
    tx`select i.id, i.parameter_id, i.code, i.sort_order from job_order_group_items g join parameter_group_items i on i.id = g.item_id where g.job_order_id = ${b.job_order_id}`,
    tx`select m.parameter_id, s.code, s.edition, m.detection_limit::text as dl from methods m join standards s on s.id = m.standard_id
      where s.active and s.family::text = ${b.standard} order by s.edition desc`,
    ids.length ? tx`select distinct on (a.sample_id, a.parameter_id, a.item_id) a.sample_id, a.parameter_id, a.item_id, v.value_num::text as value, v.qualifier, v.value_text, v.basis
      from analyses a join analysis_values v on v.analysis_id = a.id and v.is_primary where a.sample_id = any(${ids}::uuid[]) order by a.sample_id, a.parameter_id, a.item_id, a.round desc` : [],
    tx`select value from app_settings where key = 'laboratory'`,
    ids.length ? tx`select min(entered_at) as first, max(entered_at) as last from analyses where sample_id = any(${ids}::uuid[])` : [{ first: null, last: null }],
  ]);
  const method = new Map<string, { label: string; dl: number | null }>();
  for (const m of methods) if (!method.has(m.parameter_id as string)) method.set(m.parameter_id as string, { label: methodLabel(b.standard as string, m.code as string, m.edition as string), dl: m.dl == null ? null : Number(m.dl) });
  const cp: CertParam[] = [];
  for (const p of params) {
    const base = { code: p.code as string, name: p.name as string, unit: (p.unit as string | null) ?? null, decimals: p.decimals as number, measuredBasis: (p.measured_basis as string | null) ?? null, kind: p.kind as string };
    const m = method.get(p.id as string), common = { method: m?.label ?? null, detectionLimit: m?.dl ?? null };
    if (p.is_group) for (const i of items.filter((x) => x.parameter_id === p.id)) cp.push({ ...base, ...common, sort: (p.sort_order as number) * 1000 + (i.sort_order as number), itemId: i.id as string, itemLabel: i.code as string });
    else cp.push({ ...base, ...common, sort: (p.sort_order as number) * 1000 });
  }
  const codeOf = new Map(params.map((p) => [p.id as string, p.code as string]));
  const valuesOf = new Map<string, Record<string, CertValue>>();
  for (const v of vals) {
    const code = codeOf.get(v.parameter_id as string); if (!code) continue;
    const m = valuesOf.get(v.sample_id as string) ?? {}; valuesOf.set(v.sample_id as string, m);
    m[valueKey(code, v.item_id as string | null)] = { value: (v.value as string | null) ?? null, qualifier: (v.qualifier as "<" | ">" | null) ?? null, text: (v.value_text as string | null) ?? null, basis: (v.basis as string) ?? "" };
  }
  const l = (lab?.value ?? {}) as { name?: string; address?: string; accreditation?: string; place_of_issue?: string };
  const firstIn = samples.map((s) => s.received_at as Date).sort((x, y) => +new Date(x) - +new Date(y))[0] ?? b.reception_confirmed_at;
  return {
    number: o.number !== undefined ? o.number : ((b.roa_no as string | null) ?? null),
    reportedOn: o.reportedOn ?? dayIn(new Date())!,
    lab: { name: l.name ?? "PT Sentra Geo Survey Indonesia", address: l.address ?? "", accreditation: l.accreditation || null, placeOfIssue: l.place_of_issue ?? "Samarinda" },
    client: { name: b.company as string, address: (b.company_address as string | null) ?? "", attention: (att?.full_name as string | undefined) ?? "", reference: (b.client_reference as string | null) ?? "" },
    batchNo: b.batch_no as string, jobOrderNo: b.order_no as string, standard: b.standard === "GBT" ? "GB/T" : (b.standard as string),
    receivedOn: dayIn(firstIn as Date | null) ?? "",
    testedFrom: dayIn((b.analysis_started_at as Date | null) ?? (tested?.first as Date | null) ?? null), testedTo: dayIn((b.analysis_finished_at as Date | null) ?? (tested?.last as Date | null) ?? null),
    samples: samples.map((s) => roaSample(cp, { sampleCode: (s.sample_code as string) ?? "", sampleNo: (s.sample_no as string) ?? "", mass: s.mass == null ? null : Number(s.mass).toFixed(2), values: valuesOf.get(s.id as string) ?? {} })),
    remarks: null,
    formCode: "FM-LAB-021",
  };
}

/** The RoA as a PDF through Gotenberg, with the same margins as the CoA. */
export async function renderRoaPdf(p: RoaPayload): Promise<Buffer> {
  const a = baseAssets(), fd = new FormData();
  fd.append("files", new Blob([renderRoaHtml(p, a)], { type: "text/html" }), "index.html");
  fd.append("files", new Blob([renderRoaFooter(p, a.fontCss)], { type: "text/html" }), "footer.html");
  const pt = (n: number) => String(Math.round((n / 72) * 10000) / 10000);
  for (const [k, v] of Object.entries({ paperWidth: pt(595), paperHeight: pt(842), marginTop: pt(34), marginBottom: pt(65), marginLeft: pt(40), marginRight: pt(40), printBackground: "true", preferCssPageSize: "false" })) fd.append(k, v);
  let res: Response;
  try { res = await fetch(`${env.GOTENBERG_URL}/forms/chromium/convert/html`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) }); }
  catch { throw new PdfUnavailable("The PDF service is not available."); }
  if (!res.ok) throw new PdfUnavailable(`The PDF service refused the RoA (${res.status}).`);
  const pdf = Buffer.from(await res.arrayBuffer());
  if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") throw new PdfUnavailable("The PDF service did not return a PDF.");
  return pdf;
}
