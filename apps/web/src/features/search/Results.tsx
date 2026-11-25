// Search results (Phase 5, slice B2; frames 08-Search-02-Search_results-01 to 05, Search_Screen_Plan.md section 5): everything that matches a word, grouped by type. The Types card
// (chips on tablet and phone) lists the counts; a type opens alone with a pager. With no word the page is the phone's start screen: the field, Scan a label, Recent.
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../app/api";
import { useBreakpoint, useSession } from "../../app/session";
import { Button, Card, Chips, Empty, Icon, PageHead, Pager, Search, cx, todayLabel } from "../../components";
import { HitRow, TYPE_ICON, TYPE_LABEL, readRecent, rememberRecord, rememberSearch, type Hit, type SearchType } from "./shared";
import { ScanDialog, canScan } from "./Scan";

interface Res {
  q: string; types: Array<{ type: SearchType; total: number }>;
  groups?: Array<{ type: SearchType; total: number; rows: Hit[] }>;
  type?: SearchType; total?: number; page?: number; pages?: number; rows?: Hit[];
}

export function SearchPage() {
  const [sp, setSp] = useSearchParams(), nav = useNavigate(), bp = useBreakpoint(), phone = bp === "phone", { me } = useSession();
  const q = sp.get("q")?.trim() ?? "", type = (sp.get("type") as SearchType | null) ?? undefined, page = Number(sp.get("page") ?? "1") || 1;
  const [text, setText] = useState(q), [scan, setScan] = useState(false);
  useEffect(() => setText(q), [q]);
  useEffect(() => { if (me && q) rememberSearch(me.id, q); }, [me, q]);
  const r = useQuery({ queryKey: ["search", q, type ?? "", page], queryFn: () => api<Res>(`/search?q=${encodeURIComponent(q)}${type ? `&type=${type}&page=${page}` : ""}`), enabled: !!q, placeholderData: (p) => p });
  const go = (v: string, t?: SearchType, pg = 1) => { const p = new URLSearchParams(); if (v) p.set("q", v); if (t) p.set("type", t); if (pg > 1) p.set("page", String(pg)); setSp(p); };
  const open = (h: Hit) => { if (me) rememberRecord(me.id, h); };
  const d = r.data, grand = d?.types.reduce((a, x) => a + x.total, 0) ?? 0;
  const field = (
    <form onSubmit={(e) => { e.preventDefault(); go(text.trim()); }} className={phone ? "row g8" : undefined} style={phone ? { alignItems: "flex-end", flexWrap: "nowrap" } : undefined}>
      <Search id="sr-q" label="Search" value={text} onChange={setText} placeholder="Sample ID, batch, job order, drill hole, report or client" width={phone ? "100%" : 480} />
      {phone && canScan() && <Button size="lg" icon="barcode" id="sr-scan" onClick={() => setScan(true)}>Scan a label</Button>}
    </form>
  );
  const adv = <Button size={phone ? "touch" : "lg"} icon="funnel" id="sr-advanced" onClick={() => nav(`/search/advanced`, { state: { from: `/search${sp.toString() ? `?${sp}` : ""}` } })}>Advanced search</Button>;

  // phone start screen: no word yet
  if (!q) {
    const rec = me ? readRecent(me.id) : { records: [], searches: [] };
    return (
      <div className="page">
        <PageHead overline={todayLabel()} title="Search" actions={adv} />
        {field}
        {phone && !canScan() && <span className="t-cap c-mut">A USB scanner types into the field above.</span>}
        <div className="col g12" id="sr-recent">
          {rec.records.length > 0 && <Card title="Recent records"><div className="col">{rec.records.map((x) => <a key={x.link} className="qs-row" href={x.link} onClick={(e) => { e.preventDefault(); nav(x.link); }}><Icon n={TYPE_ICON[x.type]} s={16} /><span className="t-data c-head grow">{x.title}</span><span className="t-cap c-mut">{TYPE_LABEL[x.type]}</span></a>)}</div></Card>}
          {rec.searches.length > 0 && <Card title="Recent searches"><div className="col">{rec.searches.map((s) => <button key={s} type="button" className="qs-row" onClick={() => go(s)}><Icon n="clock-counter-clockwise" s={16} /><span className="t-sm grow">{s}</span></button>)}</div></Card>}
          {rec.records.length === 0 && rec.searches.length === 0 && <Card><Empty icon="magnifying-glass" title="Search the lab" text="Type a Sample ID, batch, job order, drill hole, report or client." /></Card>}
        </div>
        {scan && <ScanDialog onClose={() => setScan(false)} />}
      </div>
    );
  }

  const types = d?.types ?? [];
  const typesCard = !phone && bp === "desktop" ? (
    <Card title="Types" className="sr-types">
      <div className="col" id="sr-types">
        <button type="button" className={cx("sr-type", !type && "on")} onClick={() => go(q)}><span>All</span><span className="cpill">{grand}</span></button>
        {types.map((t) => <button key={t.type} type="button" disabled={t.total === 0} className={cx("sr-type", type === t.type && "on", t.total === 0 && "none")} onClick={() => go(q, t.type)}><span>{TYPE_LABEL[t.type]}</span><span className="cpill">{t.total}</span></button>)}
      </div>
    </Card>
  ) : (
    <Chips scroll items={[{ id: "all", label: "All", count: grand }, ...types.filter((t) => t.total > 0).map((t) => ({ id: t.type as string, label: TYPE_LABEL[t.type], count: t.total }))]} value={type ?? "all"} onChange={(v) => go(q, v === "all" ? undefined : (v as SearchType))} />
  );
  const body = !d ? <Card><Empty icon="magnifying-glass" title="Searching" /></Card> : grand === 0 ? (
    <Card><Empty icon="magnifying-glass" title={`Nothing matches "${q}"`} text="Check the ID, or search by another field." action={<Button type="ghost" icon="funnel" onClick={() => nav(`/search/advanced`, { state: { from: `/search${sp.toString() ? `?${sp}` : ""}` } })}>Open advanced search</Button>} /></Card>
  ) : type ? (
    <Card title={TYPE_LABEL[type]} count={d.total ?? 0}>
      <div className="col" id="sr-rows">{(d.rows ?? []).map((h) => <HitRow key={h.link} h={h} q={q} onOpen={open} />)}</div>
      {(d.pages ?? 1) > 1 && <Pager page={page} pages={d.pages ?? 1} total={d.total ?? 0} from={(page - 1) * 10 + 1} to={Math.min(page * 10, d.total ?? 0)} onPage={(p) => go(q, type, p)} compact={phone} />}
    </Card>
  ) : (
    <div className="col g16" id="sr-groups">
      {(d.groups ?? []).map((g) => (
        <Card key={g.type} title={TYPE_LABEL[g.type]} count={g.total} actions={g.total > g.rows.length ? <Button type="ghost" onClick={() => go(q, g.type)}>Show all</Button> : undefined}>
          <div className="col">{g.rows.map((h) => <HitRow key={h.link} h={h} q={q} onOpen={open} />)}</div>
        </Card>
      ))}
    </div>
  );
  return (
    <div className="page">
      <PageHead overline={todayLabel()} title={`Results for "${q}"`} actions={adv} />
      {field}
      {!phone && bp !== "desktop" ? typesCard : phone ? typesCard : null}
      {bp === "desktop" ? <div className="sr-cols">{typesCard}<div style={{ minWidth: 0 }}>{body}</div></div> : body}
      {scan && <ScanDialog onClose={() => setScan(false)} />}
    </div>
  );
}
