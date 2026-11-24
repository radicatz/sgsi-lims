// The certificate as a PDF (Stack_Decision_Record S-11, Reports_Build_Design.md 6.3): HTML in, Gotenberg (Chromium) out.
// The fonts and images are embedded in the HTML, so the service never needs the network.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderCertificateFooter, renderCertificateHtml, type CertAssets, type CertPayload } from "@sgsi/shared";
import { env } from "./env";

const asset = (p: string) => readFileSync(fileURLToPath(new URL(`../assets/${p}`, import.meta.url)));
const dataUri = (mime: string, b: Buffer) => `data:${mime};base64,${b.toString("base64")}`;
let base: { fontCss: string; logo: string } | null = null;
/** The fonts (Noto Sans, Newsreader, JetBrains Mono: OFL) and the lab logo, read once. */
export function baseAssets() {
  if (!base) {
    const face = (family: string, file: string, weight: string) => `@font-face { font-family: "${family}"; src: url(${dataUri("font/ttf", asset(`fonts/${file}`))}); font-weight: ${weight}; }`;
    base = {
      fontCss: [face("Noto Sans", "NotoSans-VF.ttf", "100 900"), face("Newsreader", "Newsreader.ttf", "200 800"), face("JetBrains Mono", "JetBrainsMono.ttf", "100 800")].join("\n"),
      logo: dataUri("image/svg+xml", asset("sgsi-icon-primary.svg")),
    };
  }
  return base;
}
export const certAssets = (signature: Buffer | null, stamp: Buffer | null): CertAssets => ({
  ...baseAssets(),
  signature: signature ? dataUri("image/png", signature) : null,
  stamp: stamp ? dataUri("image/png", stamp) : null,
});

export class PdfUnavailable extends Error {}
/** Render a payload to a PDF. Margins: 34 pt top, 40 pt left and right, 65 pt at the bottom for the footer (Build design 6.2). */
export async function renderPdf(payload: CertPayload, assets: CertAssets): Promise<{ pdf: Buffer; pages: number | null }> {
  const fd = new FormData();
  fd.append("files", new Blob([renderCertificateHtml(payload, assets)], { type: "text/html" }), "index.html");
  fd.append("files", new Blob([renderCertificateFooter(payload, assets.fontCss)], { type: "text/html" }), "footer.html");
  const pt = (n: number) => String(Math.round((n / 72) * 10000) / 10000);   // Gotenberg takes inches
  for (const [k, v] of Object.entries({ paperWidth: pt(595), paperHeight: pt(842), marginTop: pt(34), marginBottom: pt(65), marginLeft: pt(40), marginRight: pt(40), printBackground: "true", preferCssPageSize: "false" })) fd.append(k, v);
  let res: Response;
  try { res = await fetch(`${env.GOTENBERG_URL}/forms/chromium/convert/html`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) }); }
  catch { throw new PdfUnavailable("The PDF service is not available."); }
  if (!res.ok) throw new PdfUnavailable(`The PDF service refused the certificate (${res.status}).`);
  const pdf = Buffer.from(await res.arrayBuffer());
  if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") throw new PdfUnavailable("The PDF service did not return a PDF.");
  const counts = [...pdf.toString("latin1").matchAll(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  return { pdf, pages: counts.length ? Math.max(...counts) : null };
}
