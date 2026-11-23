// Issuing a certificate (Reports_Build_Design.md 7 and 7.1), in one place: freeze the payload, render the PDF with the signatory's own signature and the lab stamp, store it with
// its SHA-256, and set the number, the signer and the job order's status. The Sign and publish route and `pnpm seed:reports` both call this, so a demo certificate is made
// by the same code as a real one.
import { createHash } from "node:crypto";
import { verifyCodeOf } from "@sgsi/shared";
import { admin } from "./supabase";
import type { Tx } from "./db";
import { TZ } from "./batch-lib";
import { buildPayload, signingImages, type ReportRow } from "./certificate-data";
import { certAssets, renderPdf } from "./pdf";

export const REPORTS_BUCKET = "reports";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

export type IssueResult = { ok: true; number: string; id: string; company: string; order: string } | { ok: false; code: number; key: string; text: string };

/** `onUploaded` is told the stored path as soon as the PDF is up, so a caller whose transaction fails later can remove the file again. */
export async function issueCertificate(
  tx: Tx,
  rep: ReportRow & { order_no: string; company_id: string },
  signerId: string,
  o: { issuedAt?: Date; onUploaded?: (path: string) => void; replaceFile?: boolean } = {},
): Promise<IssueResult> {
  const number = `CoA-${rep.order_no}-${rep.revision}`;
  const issuedOn = o.issuedAt ? new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(o.issuedAt) : today();
  const frozen = await buildPayload(tx, rep, { draft: false, number, issuedOn, verifyCode: null });
  if (!frozen.reported) return { ok: false, code: 409, key: "no_samples", text: "No sample is left to report." };
  const { reported: _n, ...clean } = frozen;
  const verify = verifyCodeOf(createHash("sha256").update(JSON.stringify(clean)).digest("hex"));
  const payload = { ...clean, verifyCode: verify };
  const img = await signingImages(signerId);
  const { pdf, pages } = await renderPdf(payload, certAssets(img.signature, img.stamp));
  const path = `coa/${rep.order_no}/${number}.pdf`;
  const up = await admin.storage.from(REPORTS_BUCKET).upload(path, pdf, { contentType: "application/pdf", upsert: !!o.replaceFile });
  if (up.error) throw up.error;
  o.onUploaded?.(path);
  const at = o.issuedAt ?? new Date();
  await tx`update reports set status = 'issued', report_no = ${number}, issued_at = ${at}, issued_by = ${signerId}, signed_by = ${signerId}, signed_at = ${at},
      storage_path = ${path}, sha256 = ${createHash("sha256").update(pdf).digest("hex")}, payload = ${tx.json(payload as never)}, verify_code = ${verify}, page_count = ${pages}, template_revision = ${payload.template.revision},
      signatory_name = ${payload.signatory.name}, signatory_title = ${payload.signatory.title}, signature_sha256 = ${img.signatureSha}, stamp_sha256 = ${img.stampSha}, return_comment = null
    where id = ${rep.id}`;
  await tx`update reports set status = 'superseded', superseded_at = ${at} where job_order_id = ${rep.job_order_id} and kind = 'coa' and status = 'issued' and id <> ${rep.id}`;
  await tx`update job_orders set status = 'reported' where id = ${rep.job_order_id} and status in ('in_progress', 'reported', 'delivered')`;
  await tx`insert into report_sources (report_id, batch_id) select ${rep.id}, b.id from batches b where b.job_order_id = ${rep.job_order_id} and b.status = 'completed' on conflict do nothing`;
  const [co] = await tx`select c.name from companies c where c.id = ${rep.company_id}`;
  return { ok: true, number, id: rep.id, company: co!.name as string, order: rep.order_no };
}
