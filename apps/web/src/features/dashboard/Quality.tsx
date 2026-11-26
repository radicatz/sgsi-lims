// Dashboard, Quality & reports tab (Phase 5, slice C1; frames 02-Dashboard-02-Quality_and_reports-01 to 03, Dashboard_v2_Screen_Plan.md section 6, Phase5_Build_Design.md 12.3):
// four KPIs, three scatters (CV vs Ash, RD vs Ash, FC vs GCV: the first named value runs across, as SIM Lab), Trend CV with a basis switch, and the Drill holes card.
// Charts are SVG in the token colours (Phase 5 decision 3). The regression and R² come from the server; the card head says "R² 0.81, n 312".
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useSession } from "../../app/session";
import { Button, Card, Chips, Empty, Pager, Search, Seg, Tag, cx } from "../../components";
import { CoaUpload } from "../master-data/Lists";
import { Kpi, fmt } from "./Kpi";

interface Point { x: number; y: number; sampleId: string; sampleCode: string | null; hole: string | null }
interface Scatter { id: string; title: string; xLabel: string; yLabel: string; n: number; slope: number | null; intercept: number | null; r2: number | null; points: Point[] }
type Basis = "adb" | "ar" | "db" | "daf";
interface Quality {
  period: { from: string; to: string; today: string };
  kpis: {
    completed: { n: number; change: number | null; total: number; toDate: number };
    roa: { n: number; change: number | null; waiting: number };
    coverage: { withCoa: number; of: number; missing: number; percent: number | null };
    determinations: { n: number; change: number | null };
  };
  scatters: Scatter[];
  trend: Record<Basis, Array<{ batchNo: string; at: string; value: number; n: number }>>;
}
interface Hole { id: string; code: string; company: string; samples: number; roas: string[]; coa: { fileName: string; at: string } | null }
interface Holes { total: number; page: number; per: number; counts: { all: number; missing: number }; items: Hole[] }

const SERIES = ["var(--primary)", "var(--status-st-prep)", "var(--status-st-completed)"];
const dShort = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Makassar" });
const dLong = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Makassar" });
const delta = (c: number | null) => (c == null ? undefined : { up: c >= 0, text: `${c >= 0 ? "+" : "−"}${fmt(Math.abs(c))}%` });

/** About five round ticks between lo and hi. */
function ticks(lo: number, hi: number): number[] {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / 4, mag = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}
const fmtTick = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : String(Number(v.toFixed(2))));

/** One scatter: points, the regression line, axes with ticks, and a tooltip on the point under the pointer (sample code, Sample ID, drill hole, both values). */
function ScatterChart({ s, color }: { s: Scatter; color: string }) {
  const [tip, setTip] = useState<Point | null>(null);
  const W = 400, H = 240, L = 58, B = 34, T = 10, Rr = 12;
  if (s.n < 3) return <Empty icon="chart-scatter" title="Not enough results in this period" />;
  const xs = s.points.map((p) => p.x), ys = s.points.map((p) => p.y);
  const padx = (Math.max(...xs) - Math.min(...xs)) * 0.05 || 1, pady = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 1;
  const x0 = Math.min(...xs) - padx, x1 = Math.max(...xs) + padx, y0 = Math.min(...ys) - pady, y1 = Math.max(...ys) + pady;
  const sx = (v: number) => L + ((v - x0) / (x1 - x0)) * (W - L - Rr), sy = (v: number) => H - B - ((v - y0) / (y1 - y0)) * (H - B - T);
  const line = s.slope != null && s.intercept != null ? { a: [sx(x0), sy(s.intercept + s.slope * x0)], b: [sx(x1), sy(s.intercept + s.slope * x1)] } : null;
  return (
    <div className="sc-wrap" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${s.title}: ${s.n} samples`} style={{ width: "100%", height: "auto", display: "block" }}>
        {ticks(y0, y1).map((v) => (<g key={`y${v}`}><line x1={L} x2={W - Rr} y1={sy(v)} y2={sy(v)} stroke="var(--surface-divider)" /><text x={L - 6} y={sy(v) + 3} textAnchor="end" className="sc-t">{fmtTick(v)}</text></g>))}
        {ticks(x0, x1).map((v) => (<g key={`x${v}`}><line y1={T} y2={H - B} x1={sx(v)} x2={sx(v)} stroke="var(--surface-divider)" /><text x={sx(v)} y={H - B + 14} textAnchor="middle" className="sc-t">{fmtTick(v)}</text></g>))}
        <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--surface-border-strong)" /><line x1={L} x2={W - Rr} y1={H - B} y2={H - B} stroke="var(--surface-border-strong)" />
        <text x={(L + W - Rr) / 2} y={H - 4} textAnchor="middle" className="sc-l">{s.xLabel}</text>
        <text transform={`translate(11 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" className="sc-l">{s.yLabel}</text>
        {line && <line x1={line.a[0]} y1={line.a[1]} x2={line.b[0]} y2={line.b[1]} stroke={color} strokeWidth={1.5} opacity={0.7} />}
        {s.points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={tip === p ? 5 : 3.2} fill={color} opacity={tip && tip !== p ? 0.45 : 0.8} onMouseEnter={() => setTip(p)} onMouseLeave={() => setTip(null)} onClick={() => setTip(tip === p ? null : p)} />
        ))}
      </svg>
      {tip && (
        <div className="sc-tip" role="status" style={{ left: `${(sx(tip.x) / W) * 100}%`, top: `${(sy(tip.y) / H) * 100}%` }}>
          <b className="t-data-b c-head">{tip.sampleCode ?? tip.sampleId}</b>
          {tip.sampleCode && <span className="t-data-sm c-sec">{tip.sampleId}</span>}
          {tip.hole && <span className="t-cap c-sec">{tip.hole}</span>}
          <span className="t-data-sm">{s.xLabel} {fmtTick(tip.x)}</span>
          <span className="t-data-sm">{s.yLabel} {fmtTick(tip.y)}</span>
        </div>
      )}
    </div>
  );
}

/** Trend CV: the mean CV of each completed batch, by completion date. It takes the card's whole width; with more batches than fit (56 px each) it scrolls sideways inside the card.
 *  A point under the pointer (or tapped) shows the batch, its completion date, the mean CV and how many samples it averages, as the scatters do. */
function TrendChart({ rows, basis }: { rows: Quality["trend"][Basis]; basis: Basis }) {
  const box = useRef<HTMLDivElement>(null), [avail, setAvail] = useState(0), [tip, setTip] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth)); ro.observe(el); setAvail(el.clientWidth);
    return () => ro.disconnect();
  }, [rows.length > 0]);   // the box exists only while there are points
  useEffect(() => setTip(null), [basis, rows]);
  const W = Math.max(avail || 560, rows.length * 56), H = 220, L = 62, B = 34, T = 10, Rr = 14;
  if (!rows.length) return <Empty icon="chart-line" title="No batch completed in this period" />;
  const vs = rows.map((r) => r.value), pad = (Math.max(...vs) - Math.min(...vs)) * 0.15 || 100, y0 = Math.min(...vs) - pad, y1 = Math.max(...vs) + pad;
  const P0 = L + 10;   // the first point sits clear of the sticky axis, so it is not half covered
  const sx = (i: number) => P0 + (rows.length === 1 ? (W - P0 - Rr) / 2 : (i / (rows.length - 1)) * (W - P0 - Rr)), sy = (v: number) => H - B - ((v - y0) / (y1 - y0)) * (H - B - T);
  const t = tip == null ? null : rows[tip];
  // the tip opens to the side that has room in the part of the chart on screen (the chart scrolls sideways on a phone)
  const seen = tip == null ? 0 : sx(tip) - (box.current?.scrollLeft ?? 0), view = box.current?.clientWidth ?? W;
  const side = seen < 110 ? "l" : seen > view - 110 ? "r" : undefined;
  return (
    <div className="scroll-x" id="tr-scroll" ref={box}>
      <div style={{ position: "relative", width: W }}>
        {/* the vertical axis (numbers, title and line) stays at the left edge while the plot scrolls under it */}
        <svg className="tr-yaxis" width={L + 1} height={H} aria-hidden="true">
          {ticks(y0, y1).map((v) => (<text key={v} x={L - 6} y={sy(v) + 3} textAnchor="end" className="sc-t">{fmtTick(v)}</text>))}
          <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--surface-border-strong)" />
          <text transform={`translate(11 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" className="sc-l">CV (kcal/kg)</text>
        </svg>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Trend CV per completed batch" style={{ display: "block" }}>
          {ticks(y0, y1).map((v) => (<line key={v} x1={L} x2={W - Rr} y1={sy(v)} y2={sy(v)} stroke="var(--surface-divider)" />))}
          <line x1={L} x2={W - Rr} y1={H - B} y2={H - B} stroke="var(--surface-border-strong)" />
          <polyline fill="none" stroke="var(--primary)" strokeWidth={2} points={rows.map((r, i) => `${sx(i)},${sy(r.value)}`).join(" ")} />
          {rows.map((r, i) => (
            <g key={r.batchNo}>
              <circle cx={sx(i)} cy={sy(r.value)} r={tip === i ? 5.5 : 3.6} fill="var(--primary)" />
              {/* a wider target than the dot, so the point is easy to hit */}
              <circle cx={sx(i)} cy={sy(r.value)} r={12} fill="transparent" data-batch={r.batchNo} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)} onClick={() => setTip(tip === i ? null : i)} style={{ cursor: "pointer" }} />
              <text x={sx(i)} y={H - B + 14} textAnchor="middle" className="sc-t">{dShort(r.at)}</text>
            </g>
          ))}
        </svg>
        {t && (
          // the chart box scrolls sideways, so it also clips upwards: a high point gets its tip below it
          <div className={cx("sc-tip", side, sy(t.value) < H / 2 && "b")} role="status" id="tr-tip" style={{ left: sx(tip!), top: sy(t.value) }}>
            <b className="t-data-b c-head">{t.batchNo}</b>
            <span className="t-cap c-sec">Completed {dLong(t.at)}</span>
            <span className="t-data-sm">CV {basis.toUpperCase()} {fmt(t.value)} kcal/kg</span>
            <span className="t-cap c-sec">Mean of {t.n} {t.n === 1 ? "sample" : "samples"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** The Drill holes card (owner frames Nov 26): on desktop and tablet the Search sits in the card head at the right and the chips go under it; on the phone the Search (lg, no label)
 *  and the chips sit under the title, and each drill hole is a plain row: code and CoA tag, company, samples and RoA, then the action. */
function DrillHoles({ qs, phone, tablet }: { qs: string; phone: boolean; tablet: boolean }) {
  const { can } = useSession(), qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "missing">("all"), [q, setQ] = useState(""), [page, setPage] = useState(1), [upload, setUpload] = useState<Hole | null>(null);
  const p = new URLSearchParams(qs); p.set("filter", filter); p.set("page", String(page)); if (q) p.set("q", q);
  const data = useQuery({ queryKey: ["dash-holes", p.toString()], queryFn: () => api<Holes>(`/dashboard/quality/drill-holes?${p}`), placeholderData: (x) => x });
  const d = data.data, canUp = can("coa.upload");
  const act = (h: Hole) => canUp && <Button size={phone ? "touch" : "sm"} icon="upload-simple" id={`dh-up-${h.code}`} onClick={() => setUpload(h)}>{h.coa ? "Replace CoA" : "Upload CoA"}</Button>;
  const coaTag = (h: Hole) => (h.coa ? <Tag label="CoA uploaded" tone="green" icon="check-circle" /> : <Tag label="CoA missing" tone="outline" icon="file-x" />);
  const coa = (h: Hole) => (h.coa ? <span className="row g8 wrap">{coaTag(h)}<span className="t-cap c-sec ellip">{h.coa.fileName}</span></span> : coaTag(h));
  const search = <Search id="dh-q" size={phone ? "lg" : "sm"} value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search drill hole" width={phone ? "100%" : 240} />;
  const chips = <Chips scroll items={[{ id: "all", label: "All", count: d?.counts.all ?? 0 }, { id: "missing", label: "Missing CoA", count: d?.counts.missing ?? 0 }]} value={filter} onChange={(v) => { setFilter(v as "all" | "missing"); setPage(1); }} />;
  return (
    <>
      <Card title="Drill holes" actions={phone ? undefined : search}>
        {phone && search}
        {chips}
        {!d ? <span className="t-sm c-mut">Loading…</span> : d.items.length === 0 ? (
          <Empty icon="cylinder" title={filter === "missing" ? "No drill hole is missing its CoA" : "No drill hole has samples in this period"} text="Change the period or the company." />
        ) : phone ? (
          <div className="rowlist" id="dh-cards">
            {d.items.map((h) => (
              <div key={h.id} className="dh-row">
                <span className="row between g8" style={{ flexWrap: "nowrap" }}><b className="t-data-b c-head">{h.code}</b>{coaTag(h)}</span>
                <span className="t-cap c-sec">{h.company}</span>
                <span className="row g12 t-cap c-sec" style={{ flexWrap: "wrap" }}>
                  <span>{h.samples} {h.samples === 1 ? "sample" : "samples"}</span>
                  {h.roas.length > 0 && <span className="t-data-sm c-sec">{h.roas.join(", ")}</span>}
                </span>
                {act(h)}
              </div>
            ))}
          </div>
        ) : (
          <div className="tblwrap">
            <table className="tbl" id="dh-table">
              <thead><tr><th style={{ width: 130 }}>Code</th>{!tablet && <th>Company</th>}<th style={{ width: 90 }}>Samples</th><th style={{ width: 130 }}>RoA</th><th>CoA</th>{canUp && <th style={{ width: 150 }} aria-label="Actions" />}</tr></thead>
              <tbody>
                {d.items.map((h) => (
                  <tr key={h.id}>
                    <td><b className="t-data-b c-head">{h.code}</b></td>
                    {!tablet && <td className="t-sm">{h.company}</td>}
                    <td className="t-data">{h.samples}</td>
                    <td>{h.roas.length ? <span className="t-data-sm c-act">{h.roas.join(", ")}</span> : <span className="t-sm c-mut">—</span>}</td>
                    <td>{coa(h)}</td>
                    {canUp && <td>{act(h)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d && d.total > d.per && <Pager page={d.page} pages={Math.ceil(d.total / d.per)} total={d.total} from={(d.page - 1) * d.per + 1} to={Math.min(d.page * d.per, d.total)} onPage={setPage} compact={phone} />}
        {d && d.total > 0 && d.total <= d.per && <span className="t-cap c-mut">Showing {d.total} of {d.total}</span>}
      </Card>
      {upload && <CoaUpload dh={{ id: upload.id, code: upload.code, coa: upload.coa } as never} onClose={() => { setUpload(null); qc.invalidateQueries({ queryKey: ["dash-holes"] }); qc.invalidateQueries({ queryKey: ["dash-quality"] }); }} />}
    </>
  );
}

export function QualityTab({ period, company, phone, tablet, desk }: { period: string; company: string; phone: boolean; tablet: boolean; desk: boolean }) {
  const [basis, setBasis] = useState<Basis>("ar");
  const qs = `period=${period}${company ? `&company=${company}` : ""}`;
  const q = useQuery({ queryKey: ["dash-quality", qs], queryFn: () => api<Quality>(`/dashboard/quality?${qs}`), placeholderData: (p) => p, staleTime: 30_000, retry: false });
  const d = q.data;
  if (!d) return <Card><Empty icon="chart-scatter" title="Loading the quality tab" /></Card>;
  const k = d.kpis;
  return (
    <>
      <div className="kpi-grid" id="qa-kpis">
        <Kpi id="qa-completed" label="Batches completed" value={fmt(k.completed.n)} delta={delta(k.completed.change)} to="/batches?status=completed" captions={[{ text: `${fmt(k.completed.total)} total` }]} />
        <Kpi id="qa-roa" label="RoA uploaded" value={fmt(k.roa.n)} delta={delta(k.roa.change)} captions={[{ text: k.roa.waiting ? `${k.roa.waiting} waiting for upload` : "None waiting for upload" }]} />
        <section id="qa-coverage" className="card kpi">
          <span className="t-cap w5 c-sec">Drill holes with CoA</span>
          <b className="t-num">{k.coverage.of ? `${k.coverage.withCoa} of ${k.coverage.of}` : "-"}</b>
          {k.coverage.of > 0 && <span className="row g8" style={{ flexWrap: "nowrap", alignItems: "center" }}><span className="progress ok" style={{ flex: 1 }}><i style={{ width: `${k.coverage.percent ?? 0}%` }} /></span><span className="t-data-sm c-sec">{k.coverage.percent}%</span></span>}
          <span className="t-cap c-mut">{k.coverage.of ? `${k.coverage.missing} missing` : "No drill hole has samples in the period"}</span>
        </section>
        <Kpi id="qa-det" label="Determinations" value={fmt(k.determinations.n)} delta={delta(k.determinations.change)} captions={[{ text: "Values saved in the period" }]} />
      </div>
      <div className={cx("qa-scatters", desk ? "d3" : tablet ? "d2" : "d1")} id="qa-scatters">
        {d.scatters.map((s, i) => (
          <Card key={s.id} title={s.title} actions={s.r2 != null ? <span className="t-data-sm c-sec" id={`sc-${s.id}-fit`}>{`R² ${s.r2.toFixed(2)}, n ${fmt(s.n)}`}</span> : <span className="t-data-sm c-mut">{`n ${s.n}`}</span>}>
            <ScatterChart s={s} color={SERIES[i]!} />
          </Card>
        ))}
      </div>
      <Card title="Trend CV" actions={<Seg label="Basis" items={[["adb", "ADB"], ["ar", "AR"], ["db", "DB"], ["daf", "DAF"]]} value={basis} onChange={setBasis} />}>
        <TrendChart rows={d.trend[basis]} basis={basis} />
        <span className="t-cap c-mut" id="tr-note">The mean CV of each batch completed in the period, in kcal/kg on the {basis.toUpperCase()} basis.</span>
      </Card>
      <DrillHoles qs={qs} phone={phone} tablet={tablet} />
    </>
  );
}
