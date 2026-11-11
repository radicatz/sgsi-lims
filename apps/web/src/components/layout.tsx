// Component layer, part of the FigCraft library port (Stack_Decision_Record S-7, S-8): layout.
import { type ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "./Icon";
import { cx } from "./utils";

export function Card({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cx("card", className)}>{(title || actions) && <div className="card-head">{title && <h2 className="t-h3">{title}</h2>}{actions && <div className="row g8 wrap">{actions}</div>}</div>}{children}</section>;
}

/** `avatar` sits left of the title block; `sub` goes under the title (code and status on a client page); `badge` sits beside the title. */
export function PageHead({ overline, title, actions, crumb, badge, sub, avatar }: { overline?: string; title: ReactNode; actions?: ReactNode; crumb?: Array<[string, string?]>; badge?: ReactNode; sub?: ReactNode; avatar?: ReactNode }) {
  const head = <div className="col g6" style={{ minWidth: 0 }}><div className="row g12 wrap"><h1 className="t-display">{title}</h1>{badge}</div>{sub}</div>;
  return <div className="col g12">
    {crumb && <nav className="crumb" aria-label="Breadcrumb">{crumb.map(([label, to], i) => <span key={label} className="row g6">{i > 0 && <Icon n="caret-right" />}{to ? <Link to={to}>{label}</Link> : <b>{label}</b>}</span>)}</nav>}
    <div className="page-head"><div className="tt">{overline && <span className="t-over">{overline}</span>}{avatar ? <div className="row g16" style={{ alignItems: "center" }}>{avatar}{head}</div> : head}</div>
      {actions && <div className="row g10 wrap">{actions}</div>}</div></div>;
}
