// Notifications (FigCraft 00-App 08 Notifications 01 to 04; spec N1 to N8): the bell panel (desktop and tablet) and the /notifications page (phone, and "See all").
import { useState } from "react";
import { useNavigate } from "react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../app/api";
import { Button, Card, Empty, Icon, PageHead, Tabs, cx, toast } from "../../components";

export interface Note { id: string; event: string; icon: string | null; title: string; body: string | null; link: string | null; createdAt: string; read: boolean }
interface Page { unread: number; more: boolean; items: Note[] }

/** "just now", "10 min ago", "3 h ago", then the date. */
export function ago(iso: string, now = Date.now()) {
  const m = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Makassar" });
}
const TINT: Record<string, string> = { N1: "blue", N2: "amber", N3: "blue", N4: "blue", N5: "green", N6: "green", N7: "amber", N8: "red", N9: "amber", N10: "amber" };

function useNotes(unreadOnly: boolean, limit: number) {
  return useQuery({ queryKey: ["notes", unreadOnly, limit], refetchInterval: 30_000, queryFn: () => api<Page>(`/notifications?limit=${limit}${unreadOnly ? "&unread=true" : ""}`) });
}
function useActions() {
  const qc = useQueryClient(), nav = useNavigate();
  const refresh = () => { for (const k of ["notes", "notes-page", "me"]) qc.invalidateQueries({ queryKey: [k] }); };
  return {
    open: async (n: Note, after?: () => void) => {
      try { if (!n.read) await api(`/notifications/${n.id}/read`, { method: "POST" }); } catch { /* the link still opens */ }
      refresh(); after?.();
      if (n.link) nav(n.link);
    },
    readAll: async () => { try { await api("/notifications/read-all", { method: "POST" }); refresh(); } catch (e) { toast((e as ApiError).message, "error"); } },
  };
}

function Item({ n, onOpen }: { n: Note; onOpen: () => void }) {
  return (
    <button type="button" className={cx("nitem", !n.read && "unread")} onClick={onOpen}>
      <span className={cx("nico", TINT[n.event] ?? "blue")}><Icon n={n.icon ?? "bell"} s={20} /></span>
      <span className="col" style={{ gap: 2, minWidth: 0, flex: 1, textAlign: "left" }}>
        <b className="t-sm c-head">{n.title}</b>
        {n.body && <span className="t-sm c-sec">{n.body}</span>}
        <span className="t-cap c-mut">{ago(n.createdAt)}</span>
      </span>
      {!n.read && <i className="ndot" aria-label="Unread" />}
    </button>
  );
}

/** Opens under the bell: Notifications, Mark all read, tabs All and Unread, up to 6 items, See all. */
export function BellPanel({ unread, onClose }: { unread: number; onClose: () => void }) {
  const [tab, setTab] = useState<"all" | "unread">("all"), nav = useNavigate(), act = useActions();
  const q = useNotes(tab === "unread", 6);
  const items = q.data?.items ?? [];
  return (
    <div className="npanel" role="dialog" aria-label="Notifications">
      <div className="row between" style={{ padding: "14px 16px 0" }}>
        <b className="t-h3">Notifications</b>
        <Button size="sm" id="notes-readall" disabled={!unread} why="Nothing is unread" onClick={act.readAll}>Mark all read</Button>
      </div>
      <div style={{ padding: "0 16px" }}><Tabs items={[{ id: "all" as const, label: "All" }, { id: "unread" as const, label: "Unread", count: unread }]} value={tab} onChange={setTab} /></div>
      <div className="col" style={{ maxHeight: 420, overflowY: "auto" }}>
        {items.map((n) => <Item key={n.id} n={n} onOpen={() => act.open(n, onClose)} />)}
        {!q.isLoading && !items.length && <Empty icon="bell" title={tab === "unread" ? "You're all caught up" : "Nothing here yet"} text="New hand-offs and deadlines show up here." />}
      </div>
      <div className="npfoot"><Button type="ghost" id="notes-seeall" onClick={() => { onClose(); nav("/notifications"); }}>See all notifications</Button></div>
    </div>
  );
}

const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date(iso));
export function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread">("all"), act = useActions();
  const q = useInfiniteQuery({
    queryKey: ["notes-page", tab], initialPageParam: "" as string, refetchInterval: 30_000,
    queryFn: ({ pageParam }) => api<Page>(`/notifications?limit=20${tab === "unread" ? "&unread=true" : ""}${pageParam ? `&before=${encodeURIComponent(pageParam)}` : ""}`),
    getNextPageParam: (last) => (last.more ? last.items[last.items.length - 1]!.createdAt : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [], unread = q.data?.pages[0]?.unread ?? 0;
  const today = dayKey(new Date().toISOString()), yest = dayKey(new Date(Date.now() - 86400000).toISOString());
  const groups: Array<[string, Note[]]> = [];
  for (const n of items) {
    const k = dayKey(n.createdAt), name = k === today ? "Today" : k === yest ? "Yesterday" : "Earlier";
    const g = groups.find((x) => x[0] === name);
    if (g) g[1].push(n); else groups.push([name, [n]]);
  }
  return (
    <div className="page">
      <PageHead overline="NOTIFICATIONS" title="Notifications" actions={<Button icon="checks" id="notes-readall" disabled={!unread} why="Nothing is unread" onClick={act.readAll}>Mark all read</Button>} />
      <Tabs items={[{ id: "all" as const, label: "All" }, { id: "unread" as const, label: "Unread", count: unread }]} value={tab} onChange={setTab} />
      {!q.isLoading && !items.length && <Card><Empty icon="bell" title="You're all caught up" text="New hand-offs and deadlines show up here." /></Card>}
      {groups.map(([name, list]) => (
        <div key={name} className="col g8">
          <span className="t-cap w6 c-sec" style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}>{name}</span>
          <Card><div className="col">{list.map((n) => <Item key={n.id} n={n} onOpen={() => act.open(n)} />)}</div></Card>
        </div>
      ))}
      {q.hasNextPage && <span style={{ alignSelf: "center" }}><Button id="notes-more" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>Load more</Button></span>}
    </div>
  );
}
