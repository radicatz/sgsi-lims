// Shared parts of Search (Phase 5, slice B; Search_Screen_Plan.md sections 4 and 5): the types and their words, one hit row, bold match, and the Recent list kept in the browser
// per user (plan open point 4: the last 5 records and 3 searches, on this device and account).
import { Link } from "react-router";
import { SAMPLE_STATE } from "@sgsi/shared";
import { Avatar, Badge, Icon, Tag, cx, type Tone } from "../../components";
import {
  STATUS_LABEL as BATCH_LABEL,
  STATUS_TONE as BATCH_TONE,
} from "../batches/shared";
import {
  STATUS_LABEL as ORDER_LABEL,
  STATUS_TONE as ORDER_TONE,
  type OrderStatus,
} from "../orders/shared";

export type SearchType =
  | "samples"
  | "batches"
  | "orders"
  | "drill_holes"
  | "reports"
  | "clients";
export interface Hit {
  id: string;
  type: SearchType;
  title: string;
  subs: string[];
  status: { kind: string; code: string } | null;
  tags: string[];
  link: string;
  exact: boolean;
  match: string;
}
export const TYPE_LABEL: Record<SearchType, string> = {
  samples: "Samples",
  batches: "Batches",
  orders: "Job orders",
  drill_holes: "Drill holes",
  reports: "Reports",
  clients: "Clients",
};
export const TYPE_ICON: Record<SearchType, string> = {
  samples: "test-tube",
  batches: "files",
  orders: "clipboard-text",
  drill_holes: "cylinder",
  reports: "file-text",
  clients: "buildings",
};

export function statusOf(
  s: Hit["status"],
): { label: string; tone: Tone } | null {
  if (!s) return null;
  if (s.kind === "sample") {
    const [l, t] = SAMPLE_STATE[s.code as keyof typeof SAMPLE_STATE] ?? [
      s.code,
      "grey",
    ];
    return { label: l, tone: t as Tone };
  }
  if (s.kind === "batch")
    return { label: BATCH_LABEL(s.code), tone: BATCH_TONE(s.code) };
  if (s.kind === "order")
    return {
      label: ORDER_LABEL[s.code as OrderStatus] ?? s.code,
      tone: ORDER_TONE[s.code as OrderStatus] ?? "grey",
    };
  if (s.kind === "report")
    return s.code === "issued"
      ? { label: "Published", tone: "purple" }
      : {
          label:
            s.code === "superseded"
              ? "Superseded"
              : s.code === "void"
                ? "Voided"
                : s.code,
          tone: "grey",
        };
  return null;
}

/** The part of `text` that matches `q` in bold. */
export function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b className="w6">{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  );
}

/* ---------- Recent (per user, in this browser) ---------- */
export interface Recent {
  records: Array<{ title: string; link: string; type: SearchType }>;
  searches: string[];
}
const KEY = (uid: string) => `sgsi.recent.${uid}`;
export function readRecent(uid: string): Recent {
  try {
    const r = JSON.parse(
      localStorage.getItem(KEY(uid)) ?? "null",
    ) as Recent | null;
    return { records: r?.records ?? [], searches: r?.searches ?? [] };
  } catch {
    return { records: [], searches: [] };
  }
}
function save(uid: string, r: Recent) {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(r));
  } catch {
    /* storage may be blocked */
  }
}
export function rememberRecord(
  uid: string,
  h: Pick<Hit, "title" | "link" | "type">,
) {
  const r = readRecent(uid);
  r.records = [
    { title: h.title, link: h.link, type: h.type },
    ...r.records.filter((x) => x.link !== h.link),
  ].slice(0, 5);
  save(uid, r);
}
export function rememberSearch(uid: string, q: string) {
  const t = q.trim();
  if (!t) return;
  const r = readRecent(uid);
  r.searches = [
    t,
    ...r.searches.filter((x) => x.toLowerCase() !== t.toLowerCase()),
  ].slice(0, 3);
  save(uid, r);
}

/** One hit: icon or avatar, the title, the facts as separate texts, tags, the status badge. Used by the results page; the quick panel draws a denser row. */
export function HitRow({
  h,
  q,
  onOpen,
}: {
  h: Hit;
  q: string;
  onOpen: (h: Hit) => void;
}) {
  const st = statusOf(h.status);
  return (
    <Link
      to={h.link}
      className="hit-row"
      onClick={() => onOpen(h)}
      data-hit={h.type}
    >
      {h.type === "clients" ? (
        <Avatar name={h.title} size={40} />
      ) : (
        <span className="hit-ic">
          <Icon n={TYPE_ICON[h.type]} s={16} />
        </span>
      )}
      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-data-b c-head ellip">
          <Mark text={h.title} q={q} />
        </span>
        <span className="row g12 t-cap c-sec wrap">
          {h.subs.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </span>
      </span>
      {h.tags.map((t) => (
        <Tag key={t} label={t} />
      ))}
      {st && <Badge sm label={st.label} tone={st.tone} />}
      <Icon n="caret-right" className={cx("c-mut")} />
    </Link>
  );
}
