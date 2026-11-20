// The certificate's data (Reports_Build_Design.md 6.1): reads the verified values of the job order's completed batches and builds the payload
// the renderer prints. A draft is built live from its contents; at signing the payload is frozen into reports.payload and never read again.
import { BASIS_ORDER, buildRows, methodLabel, valueKey, type CertBasis, type CertParam, type CertPayload, type CertSampleInput, type CertValue } from "@sgsi/shared";
import { admin } from "./supabase";
import { sql, type Tx } from "./db";
import { TZ } from "./batch-lib";

export interface ReportRow {
  id: string; job_order_id: string; revision: number; status: string; report_no: string | null; bases: string[]; parameter_ids: string[];
  attention_contact_id: string | null; client_reference: string | null; remarks: string | null; signatory_id: string | null; on_behalf_of: string | null;
}
const TEMPLATE_DEFAULT = { title: "Certificate of Analysis", statement: "Samples were prepared and analysed in accordance with the methods listed. The results relate to the samples as received.", terms: "This certificate may not be reproduced except in full." };
const dayIn = (d: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));

/** Samples of the job order that did not reach the certificate, for the line on the draft: "11 samples reported. 1 not received is left out." */
export const leftOut = async (tx: Tx, jobOrderId: string) => {
  const [n] = await tx`select count(*) filter (where not_received_at is not null)::int as not_received,
      count(*) filter (where on_hold and not_received_at is null)::int as held,
      count(*) filter (where batch_id is null and not_received_at is null)::int as awaiting
    from samples where job_order_id = ${jobOrderId}`;
  return { notReceived: n!.not_received as number, held: n!.held as number, awaiting: n!.awaiting as number };
};

/** The parameters a CoA can print for a job order (ordered, without the preparation ones), group parameters expanded to their chosen items. */
export async function orderedParameters(tx: Tx, jobOrderId: string) {
  return tx`select p.id, p.code, p.label, p.name, p.unit, p.decimals, p.measured_basis, p.kind::text as kind, p.sort_order, p.is_group
    from job_order_parameters jp join parameters p on p.id = jp.parameter_id
    where jp.job_order_id = ${jobOrderId} and p.code not in ('PREP', 'ADL', 'O') order by p.sort_order`;
}

export async function buildPayload(tx: Tx, rep: ReportRow, o: { draft: boolean; number: string | null; issuedOn: string | null; verifyCode: string | null }): Promise<CertPayload & { reported: number }> {
  const [j] = await tx`select j.id, j.order_no, j.client_reference, j.contact_id, j.standards::text[] as standards, c.name as company, c.address as company_address
    from job_orders j join companies c on c.id = j.company_id where j.id = ${rep.job_order_id}`;
  const [att] = await tx`select full_name from company_contacts where id = ${rep.attention_contact_id ?? j!.contact_id}`;
  const samples = await tx`select s.id, s.sample_no, s.sample_code, s.mass_received_kg::text as mass, s.received_at, b.standard::text as family, b.batch_no
    from samples s join batches b on b.id = s.batch_id
    where b.job_order_id = ${rep.job_order_id} and b.status = 'completed' and s.received_at is not null and not s.on_hold and s.not_received_at is null
    order by b.batch_date, b.batch_no, s.sample_no`;
  const ids = samples.map((s) => s.id as string);
  const [params, items, methods, vals, [lab], [tpl], [sig]] = await Promise.all([
    orderedParameters(tx, rep.job_order_id),
    tx`select i.id, i.parameter_id, i.code, i.sort_order from job_order_group_items g join parameter_group_items i on i.id = g.item_id where g.job_order_id = ${rep.job_order_id}`,
    tx`select m.parameter_id, s.family::text as family, s.code, s.edition, m.detection_limit::text as dl from methods m join standards s on s.id = m.standard_id where s.active order by s.edition desc`,
    ids.length ? tx`select distinct on (a.sample_id, a.parameter_id, a.item_id) a.sample_id, a.parameter_id, a.item_id, v.value_num::text as value, v.qualifier, v.value_text, v.basis
      from analyses a join analysis_values v on v.analysis_id = a.id and v.is_primary where a.sample_id = any(${ids}::uuid[]) and a.status = 'verified' order by a.sample_id, a.parameter_id, a.item_id, a.round desc` : [],
    tx`select value from app_settings where key = 'laboratory'`,
    tx`select form_code, revision, fields from report_templates where kind = 'coa' and status = 'current' order by company_id nulls first limit 1`,
    rep.signatory_id ? tx`select p.full_name, coalesce(p.title, case when exists (select 1 from user_roles ur join roles r on r.id = ur.role_id where ur.user_id = p.id and r.code = 'manager') then 'Laboratory Manager' end, '') as title
      from profiles p where p.id = ${rep.signatory_id}` : [],
  ]);
  const chosen = new Set(rep.parameter_ids);
  const wanted = (params as Array<Record<string, unknown>>).filter((p) => !chosen.size || chosen.has(p.id as string));
  const method = new Map<string, { label: string; dl: number | null }>();
  for (const m of methods) { const k = `${m.parameter_id}|${m.family}`; if (!method.has(k)) method.set(k, { label: methodLabel(m.family, m.code, m.edition), dl: m.dl == null ? null : Number(m.dl) }); }
  const paramsFor = (family: string): CertParam[] => {
    const out: CertParam[] = [];
    for (const p of wanted) {
      const base = { code: p.code as string, name: p.name as string, unit: (p.unit as string | null) ?? null, decimals: p.decimals as number, measuredBasis: (p.measured_basis as string | null) ?? null, kind: p.kind as string };
      const m = method.get(`${p.id}|${family}`);
      const common = { method: m?.label ?? null, detectionLimit: m?.dl ?? null };
      if (p.is_group) { for (const i of items.filter((x) => x.parameter_id === p.id)) out.push({ ...base, ...common, sort: (p.sort_order as number) * 1000 + (i.sort_order as number), itemId: i.id as string, itemLabel: i.code as string }); }
      else out.push({ ...base, ...common, sort: (p.sort_order as number) * 1000 });
    }
    return out;
  };
  const codeOf = new Map((params as Array<Record<string, unknown>>).map((p) => [p.id as string, p.code as string]));
  const valuesOf = new Map<string, Record<string, CertValue>>();
  for (const v of vals) {
    const code = codeOf.get(v.parameter_id as string); if (!code) continue;
    const m = valuesOf.get(v.sample_id as string) ?? {}; valuesOf.set(v.sample_id as string, m);
    m[valueKey(code, v.item_id as string | null)] = { value: (v.value as string | null) ?? null, qualifier: (v.qualifier as "<" | ">" | null) ?? null, text: (v.value_text as string | null) ?? null, basis: (v.basis as string) ?? "" };
  }
  const bases = BASIS_ORDER.filter((b) => (rep.bases as string[]).includes(b)) as CertBasis[];
  const out: CertPayload["samples"] = samples.map((s) => {
    const input: CertSampleInput = { sampleCode: (s.sample_code as string) ?? "", sampleNo: (s.sample_no as string) ?? "", mass: s.mass == null ? null : Number(s.mass).toFixed(2), values: valuesOf.get(s.id as string) ?? {} };
    return { sampleCode: input.sampleCode, sampleNo: input.sampleNo, mass: input.mass, rows: buildRows(paramsFor(s.family as string), input, bases) };
  });
  const l = (lab?.value ?? {}) as { name?: string; address?: string; accreditation?: string; place_of_issue?: string };
  const f = { ...TEMPLATE_DEFAULT, ...((tpl?.fields ?? {}) as Partial<typeof TEMPLATE_DEFAULT>) };
  const first = samples.length ? samples.map((s) => s.received_at as Date).sort((a, b) => +new Date(a) - +new Date(b))[0]! : null;
  return {
    v: 1, draft: o.draft, number: o.number, revision: rep.revision, issuedOn: o.issuedOn, verifyCode: o.verifyCode,
    lab: { name: l.name ?? "PT Sentra Geo Survey Indonesia", address: l.address ?? "", accreditation: l.accreditation || null, placeOfIssue: l.place_of_issue ?? "Samarinda" },
    template: { title: f.title, statement: f.statement, terms: f.terms, formCode: (tpl?.form_code as string | undefined) ?? "FM-LAB-014", revision: (tpl?.revision as number | undefined) ?? 1 },
    client: { name: j!.company as string, address: (j!.company_address as string | null) ?? "", attention: (att?.full_name as string | undefined) ?? "", reference: rep.client_reference ?? (j!.client_reference as string | null) ?? "" },
    jobOrder: { no: j!.order_no as string, receivedOn: first ? dayIn(first) : "", standards: (j!.standards as string[]).map((s) => (s === "GBT" ? "GB/T" : s)), sampleCount: samples.length },
    bases, remarks: rep.remarks, samples: out,
    signatory: { name: (sig?.full_name as string | undefined) ?? "", title: (sig?.title as string | undefined) ?? "", onBehalfOf: rep.on_behalf_of },
    reported: samples.length,
  };
}

/** The signature of a signatory and the lab stamp, as images (null when none is set yet), with their hashes for the record. Read with the API's own connection: the images never leave the API. */
export async function signingImages(signerId: string | null) {
  const get = async (kind: "signature" | "stamp", userId: string | null) => {
    const [a] = await sql`select storage_path, sha256 from signing_assets where kind = ${kind} and retired_at is null and user_id is not distinct from ${userId}::uuid`;
    if (!a) return { img: null as Buffer | null, sha: null as string | null };
    const { data, error } = await admin.storage.from("signing").download(a.storage_path as string);
    if (error || !data) return { img: null, sha: null };
    return { img: Buffer.from(await data.arrayBuffer()), sha: a.sha256 as string };
  };
  const [sig, stamp] = await Promise.all([signerId ? get("signature", signerId) : { img: null, sha: null }, get("stamp", null)]);
  return { signature: sig.img, stamp: stamp.img, signatureSha: sig.sha, stampSha: stamp.sha };
}
