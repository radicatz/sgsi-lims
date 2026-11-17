// The certificate as it prints: an A4 page (595 x 842) drawn once and scaled to the width it is given, never reflowed.
// Layout: the Report templates frame (letterhead, number block, title, two-column header, statement, a table per sample, signatory,
// footer) with the bordered grid of the lab's sample report (CODE SAMPLE, Test Method, basis columns, mass row).
// The text fields of the template feed it live; the results are demo values.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../../components";

export interface CoaFields {
  title: string;
  formCode: string;
  statement: string;
  terms: string;
}
export interface CoaLab {
  name: string;
  address: string;
  place_of_issue: string;
}

const BASES: Array<[string, string]> = [
  ["ADB", "Air Dried"],
  ["DB", "Dry"],
  ["DAF", "Dry Ash Free"],
  ["AR", "As Received"],
];
const W = 595,
  H = 842;

const SAMPLES: Array<{
  code: string;
  id: string;
  mass: string;
  rows: Array<[string, string, string, string, string, string]>;
}> = [
  {
    code: "BA-0142-01",
    id: "SG.261014.004.RI.001",
    mass: "9.15",
    rows: [
      ["Total Moisture (%)", "ASTM D3302-22", "-", "-", "-", "14.20"],
      ["Moisture in the Analysis Sample (%)", "ASTM D3173-17", "8.10", "-", "-", "-"],
      ["Ash Content (%)", "ASTM D3174-12", "5.42", "5.90", "-", "5.06"],
      ["Volatile Matter (%)", "ASTM D3175-20", "39.85", "43.36", "46.08", "37.21"],
      ["Fixed Carbon (%)", "By calculation", "46.63", "50.74", "53.92", "43.54"],
      ["Total Sulphur (%)", "ASTM D4239-18", "0.42", "0.46", "0.49", "0.39"],
      ["Gross Calorific Value (kcal/kg)", "ASTM D5865-19", "5,980", "6,507", "6,915", "5,584"],
    ],
  },
  {
    code: "BA-0142-02",
    id: "SG.261014.004.RI.002",
    mass: "10.25",
    rows: [
      ["Total Moisture (%)", "ASTM D3302-22", "-", "-", "-", "13.80"],
      ["Moisture in the Analysis Sample (%)", "ASTM D3173-17", "7.90", "-", "-", "-"],
      ["Ash Content (%)", "ASTM D3174-12", "6.10", "6.62", "-", "5.71"],
      ["Volatile Matter (%)", "ASTM D3175-20", "38.90", "42.24", "45.23", "36.41"],
      ["Fixed Carbon (%)", "By calculation", "47.10", "51.14", "54.77", "44.09"],
      ["Total Sulphur (%)", "ASTM D4239-18", "0.51", "0.55", "0.59", "0.48"],
      ["Gross Calorific Value (kcal/kg)", "ASTM D5865-19", "5,890", "6,395", "6,849", "5,513"],
    ],
  },
];

export function CoaDocument({
  f,
  revision,
  draft,
  lab,
}: {
  f: CoaFields;
  revision: number;
  draft: boolean;
  lab: CoaLab;
}) {
  return (
    <div className="a4" aria-label="Certificate preview">
      {draft && (
        <span className="a4-mark" aria-hidden="true">
          DRAFT
        </span>
      )}
      <header className="a4-head">
        <div className="a4-brand">
          <img src="/sgsi-icon-primary.svg" alt="" />
          <div>
            <b>{lab.name}</b>
            <span>{lab.address}</span>
          </div>
        </div>
        <div className="a4-no">
          <b>CoA-JO-2026-0142-1</b>
          <span>Revision 1</span>
          {draft && <span>Draft</span>}
        </div>
      </header>
      <h3 className="a4-title">{f.title || "Certificate of Analysis"}</h3>
      <div className="a4-meta">
        <dl>
          <Pair k="Principal" v="PT Bukit Asam Tbk" />
          <Pair k="Attention" v="Budi Santoso" />
          <Pair k="Reference" v="PTBA-2210" />
        </dl>
        <dl>
          <Pair k="Job order" v="JO-2026-0142" />
          <Pair k="Received" v="14 Oct 2026" />
          <Pair k="Samples" v="2 coal samples" />
        </dl>
      </div>
      <p className="a4-statement">{f.statement}</p>
      {SAMPLES.map((s) => (
        <table key={s.code} className="a4-t">
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "22%" }} />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>CODE SAMPLE</th>
              <th rowSpan={3}>Test Method</th>
              <th colSpan={4}>{s.code}</th>
            </tr>
            <tr>
              <th colSpan={4}>{s.id}</th>
            </tr>
            <tr>
              <th>Basis</th>
              {BASES.map(([ab, full]) => (
                <th key={ab}>
                  {ab}
                  <small>{full}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mass as Received (kg)</td>
              <td />
              <td colSpan={4}>{s.mass}</td>
            </tr>
            {s.rows.map((r) => (
              <tr key={r[0]}>
                <td>{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td>{r[3]}</td>
                <td>{r[4]}</td>
                <td>{r[5]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <div className="a4-sign">
        <span>Issued at {lab.place_of_issue}</span>
        <b>2 Nov 2026</b>
        <i />
        <span className="sig">Ir. Bambang Sutrisno, M.T.</span>
        <span>Laboratory Manager</span>
      </div>
      <footer className="a4-foot">
        <span>{f.terms}</span>
        <span>
          Page 1 of 1
          <br />
          {f.formCode} rev {revision}
        </span>
      </footer>
    </div>
  );
}
const Pair = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt>{k}</dt>
    <dd>{v}</dd>
  </div>
);

/** Scales the page to the width of its box (up to 120 %), so a phone sees the whole page, not a reflowed one.
    The bar above it zooms from 50 % to 300 % of that fit; a zoomed page scrolls inside its box. */
export function FitPage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(W);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setW(el.clientWidth || W);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fit = Math.min(1.2, w / W);
  const k = fit * zoom;
  const step = (d: number) =>
    setZoom((z) => Math.min(3, Math.max(0.5, Math.round((z + d) * 100) / 100)));
  return (
    <div style={{ width: "100%" }}>
      <div className="zoombar" role="group" aria-label="Zoom">
        <Button iconOnly icon="minus" label="Zoom out" size="lg"disabled={zoom <= 0.5} onClick={() => step(-0.25)} />
        <button type="button" className="zoomval" aria-label="Fit to width" onClick={() => setZoom(1)}>
          {Math.round(k * 100)}%
        </button>
        <Button iconOnly icon="plus" label="Zoom in" size="lg"disabled={zoom >= 3} onClick={() => step(0.25)} />
        <button type="button" className="linkbtn" onClick={() => setZoom(1)} disabled={zoom === 1}>
          Fit
        </button>
      </div>
      <div ref={ref} className="zoombox">
        <div style={{ width: W * k, height: H * k, margin: k * W < w ? "0 auto" : 0, flex: "none" }}>
          <div
            style={{
              width: W,
              height: H,
              transform: `scale(${k})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
