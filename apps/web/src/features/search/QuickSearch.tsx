// Quick search in the top bar (Phase 5, slice B1; frames 08-Search-01-Quick_search-01 to 04): focusing the field opens a panel under it. Empty: the Recent records and searches.
// From 2 characters: up to 3 hits per type, the exact match first and marked Go to; Enter opens the marked hit, or the results page. Keys: up and down, Enter, Esc; "/" focuses.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useSession } from "../../app/session";
import { Badge, Button, Icon, cx } from "../../components";
import {
  Mark,
  TYPE_ICON,
  TYPE_LABEL,
  readRecent,
  rememberRecord,
  rememberSearch,
  statusOf,
  type Hit,
  type SearchType,
} from "./shared";

interface Quick {
  q: string;
  total: number;
  go: Hit | null;
  groups: Array<{ type: SearchType; total: number; hits: Hit[] }>;
}

export function QuickSearch() {
  const { me } = useSession(),
    nav = useNavigate(),
    loc = useLocation();
  const [text, setText] = useState(""),
    [dq, setDq] = useState(""),
    [open, setOpen] = useState(false),
    [at, setAt] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setDq(text.trim()), 200);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => setAt(-1), [dq]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        e.key !== "/" ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) ||
        el.isContentEditable
      )
        return;
      e.preventDefault();
      input.current?.focus();
    };
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false);
    };
    window.addEventListener("keydown", key);
    document.addEventListener("mousedown", away);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", away);
    };
  }, []);
  const typed = dq.length >= 2;
  const q = useQuery({
    queryKey: ["quick-search", dq],
    queryFn: () => api<Quick>(`/search/quick?q=${encodeURIComponent(dq)}`),
    enabled: typed && open,
    staleTime: 15_000,
    placeholderData: (p) => p,
  });
  const d = typed && q.data?.q === dq ? q.data : undefined; // never show (or let a click use) the answer to an earlier word
  const rec = me ? readRecent(me.id) : { records: [], searches: [] };
  const items: Array<{ link: string; title: string; type: SearchType }> = d
    ? d.groups.flatMap((g) =>
        g.hits.map((h) => ({ link: h.link, title: h.title, type: h.type })),
      )
    : rec.records;
  const done = () => {
    setOpen(false);
    setText("");
    input.current?.blur();
  };
  const openItem = (x: { link: string; title: string; type: SearchType }) => {
    if (me) rememberRecord(me.id, x);
    nav(x.link);
    done();
  };
  const all = (v: string) => {
    if (me) rememberSearch(me.id, v);
    nav(`/search?q=${encodeURIComponent(v)}`);
    done();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      done();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setAt((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAt((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (at >= 0 && items[at]) return openItem(items[at]!);
      if (d?.go) return openItem(d.go);
      if (dq) all(dq);
    }
  };
  let n = -1;
  return (
    <div className="tsearch-wrap" ref={wrap}>
      <label className="tsearch" id="quick-search">
        <Icon n="magnifying-glass" />
        <input
          ref={input}
          id="qs-input"
          placeholder="Search by sample ID, batch, job order or drill hole…"
          value={text}
          role="combobox"
          aria-expanded={open}
          aria-controls="qs-panel"
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
        <span
          className="scanbtn"
          title="Scan a label: click here, then scan"
          onMouseDown={(e) => {
            e.preventDefault();
            input.current?.focus();
          }}
        >
          <Icon n="barcode" />
        </span>
      </label>
      {open && (
        <div className="qs-panel" id="qs-panel" role="listbox">
          {!typed ? (
            <>
              {rec.records.length === 0 && rec.searches.length === 0 && (
                <span className="t-sm c-mut qs-pad">
                  Type at least 2 characters, or scan a label.
                </span>
              )}
              {rec.records.length > 0 && (
                <div className="qs-head">Recent records</div>
              )}
              {rec.records.map((r) => {
                n++;
                return (
                  <button
                    key={r.link}
                    type="button"
                    className={cx("qs-row", n === at && "on")}
                    onClick={() => openItem(r)}
                  >
                    <Icon n={TYPE_ICON[r.type]} s={16} />
                    <span className="t-data c-head grow">{r.title}</span>
                    <span className="t-cap c-mut">{TYPE_LABEL[r.type]}</span>
                  </button>
                );
              })}
              {rec.searches.length > 0 && (
                <div className="qs-head">Recent searches</div>
              )}
              {rec.searches.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="qs-row"
                  onClick={() => all(s)}
                >
                  <Icon n="clock-counter-clockwise" s={16} />
                  <span className="t-sm grow">{s}</span>
                </button>
              ))}
            </>
          ) : !d ? (
            <span className="t-sm c-mut qs-pad">Searching…</span>
          ) : d.total === 0 ? (
            <div className="qs-none" id="qs-none">
              <span className="t-sm c-head w6">No match for "{dq}"</span>
              <span className="t-cap c-sec">
                Check the ID, or search by another field.
              </span>
              <span className="qs-none-act">
                <Button
                  type="ghost"
                  icon="funnel"
                  id="qs-advanced"
                  onClick={() => {
                    nav("/search/advanced", { state: { from: `${loc.pathname}${loc.search}` } });
                    done();
                  }}
                >
                  Open advanced search
                </Button>
              </span>
            </div>
          ) : (
            <>
              {d.groups.map((g) => (
                <div key={g.type}>
                  <div className="qs-head">{TYPE_LABEL[g.type]}</div>
                  {g.hits.map((h) => {
                    n++;
                    const st = statusOf(h.status),
                      i = n,
                      go = d.go?.link === h.link;
                    return (
                      <button
                        key={h.link}
                        type="button"
                        className={cx("qs-row", i === at && "on", go && "go")}
                        onClick={() => openItem(h)}
                        data-go={go || undefined}
                      >
                        <span className="t-data-b c-head nowrap">
                          <Mark text={h.title} q={dq} />
                        </span>
                        <span
                          className="row g8 t-cap c-sec grow"
                          style={{ minWidth: 0, flexWrap: "nowrap" }}
                        >
                          {h.subs.slice(0, 3).map((s, k) => (
                            <span key={k} className="ellip">
                              {s}
                            </span>
                          ))}
                        </span>
                        {h.tags.map((t) => (
                          <span key={t} className="t-cap c-mut">
                            {t}
                          </span>
                        ))}
                        {go && <span className="qs-go">Go to</span>}
                        {st && <Badge sm label={st.label} tone={st.tone} />}
                      </button>
                    );
                  })}
                </div>
              ))}
              <button
                type="button"
                className="qs-foot"
                onClick={() => all(dq)}
                id="qs-all"
              >
                <span>
                  See all {d.total} results for "{dq}"
                </span>
                <span className="c-mut">Enter</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
