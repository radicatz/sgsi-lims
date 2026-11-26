// A KPI card of the Dashboard (both tabs): label, a display number in Newsreader, an optional change pill, and captions as separate texts. The whole card is a link when `to` is given.
import { Link } from "react-router";
import { cx } from "../../components";

export const fmt = (n: number) => n.toLocaleString("en-US");

export function Kpi({
  label,
  value,
  captions,
  delta,
  id,
  to,
}: {
  label: string;
  value: string;
  captions: Array<{ text: string; err?: boolean }>;
  delta?: { up: boolean; text: string };
  id: string;
  to?: string;
}) {
  const body = (
    <>
      <span className="t-cap w5 c-sec">{label}</span>
      <span className="row g10" style={{ flexWrap: "nowrap" }}>
        <b className="t-num">{value}</b>
        {delta && (
          <span
            className={cx("delta", delta.up ? "tn-green" : "tn-red")}
            id={`${id}-delta`}
          >
            {delta.text}
          </span>
        )}
      </span>
      <span className="row g6 t-cap c-mut">
        {captions.map((c, i) => (
          <span key={i} className={c.err ? "c-err" : undefined}>
            {c.text}
          </span>
        ))}
      </span>
    </>
  );
  return to ? (
    <Link to={to} id={id} className="card kpi kpi-link">
      {body}
    </Link>
  ) : (
    <section id={id} className="card kpi">
      {body}
    </section>
  );
}
