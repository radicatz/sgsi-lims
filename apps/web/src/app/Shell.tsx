// App shell: top bar, sidebar by role (expanded or collapsed), tablet rail, phone drawer, user menu
// (Navigation_Screen_Plan.md, App_Screen_Plan.md). Pages render in <Outlet/>.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { navFor, startPath } from "@sgsi/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useBreakpoint, useSession } from "./session";
import { Avatar, Button, Card, Empty, Icon, IconBtn, cx, useEsc, useOutside } from "../components";

export function Shell() {
  const { me } = useSession();
  const bp = useBreakpoint();
  const loc = useLocation();
  const qc = useQueryClient();
  const [drawer, setDrawer] = useState(false);
  const main = useRef<HTMLElement>(null);
  useEsc(() => setDrawer(false), drawer);
  useEffect(() => { main.current?.scrollTo(0, 0); setDrawer(false); }, [loc.pathname]);
  const savePrefs = useMutation({ mutationFn: (prefs: Record<string, unknown>) => api("/me", { method: "PATCH", json: { prefs } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }) });
  if (!me) return null;
  const collapsed = me.prefs.sidebar === "collapsed";
  const rail = bp === "tablet" || (bp === "desktop" && collapsed);
  return <div className={cx("frame", bp, bp === "phone" && "touch")}>
    <TopBar onMenu={() => setDrawer(true)} />
    <div className="body">
      {bp !== "phone" && <nav className={cx("side", rail && "rail")} aria-label="Main">
        <NavList rail={rail} />
        {bp === "desktop" && <div className="sidefoot"><div className="navgroup static" aria-hidden="true"><i className="gline" /></div>
          <button className="nav" title={rail ? "Expand" : undefined} aria-label={rail ? "Expand sidebar" : "Collapse sidebar"} onClick={() => savePrefs.mutate({ sidebar: collapsed ? "expanded" : "collapsed" })}>
            <Icon n="caret-double-left" s={20} className="flip" /><span className="lbl">Collapse</span></button></div>}</nav>}
      <main className="main" id="main" ref={main}><Outlet /></main>
    </div>
    {drawer && <div className="scrim" style={{ justifyContent: "flex-start", alignItems: "stretch", padding: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
      <nav className="side" style={{ width: 300, boxShadow: "var(--e-xl)" }} aria-label="Main">
        <div className="col g12" style={{ paddingBottom: 8 }}><div className="row between"><span className="logo" style={{ width: 36, height: 36 }} /><IconBtn n="x" label="Close menu" onClick={() => setDrawer(false)} /></div>
          <Link to="/profile" className="row g10"><Avatar name={me.fullName} size={40} /><span className="col" style={{ gap: 0 }}><b className="t-sm w6">{me.fullName}</b><span className="t-cap c-sec">{me.title}</span></span></Link><div className="divider" /></div>
        <NavList rail={false} /></nav></div>}
  </div>;
}

function NavList({ rail }: { rail: boolean }) {
  const { me } = useSession();
  const [shut, setShut] = useState<Record<string, boolean>>({});
  return <>{navFor(me!.permissions).map((g) => {
    const closed = !rail && !!shut[g.group];
    // One structure for expanded and rail, so the row heights never change and the width change can animate.
    return <div key={g.group} className="navg">
      <button className="navgroup" disabled={rail} aria-expanded={!closed} tabIndex={rail ? -1 : 0} onClick={() => setShut({ ...shut, [g.group]: !shut[g.group] })}>
        <span className="gtext">{g.group}</span><i className="gline" /><Icon n="caret-down" className={cx("gcaret", closed && "shut")} /></button>
      <div className={cx("gitems", closed && "shut")}><div className="gin">
        {g.items.map((it) => <NavLink key={it.id} to={it.path} end={it.path === "/"} title={rail ? it.label : undefined} tabIndex={closed ? -1 : 0} className={({ isActive }) => cx("nav", isActive && "on")}>
          <Icon n={it.icon} s={20} /><span className="lbl">{it.label}</span></NavLink>)}</div></div>
    </div>;
  })}</>;
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { me, signOut } = useSession();
  const bp = useBreakpoint();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setMenu(false), menu);
  useEsc(() => setMenu(false), menu);
  return <header className="topbar">
    {bp === "phone" && <IconBtn n="list" label="Open menu" size={36} onClick={onMenu} />}
    <Link className="brand" to={startPath(me!.permissions, me!.prefs.startPage)}><span className="logo" />{bp !== "phone" && <div><b>SGSI LIMS</b><small>Sentra Geo Survey Indonesia</small></div>}</Link>
    <span className="grow" />
    {bp !== "phone" && <label className="tsearch"><Icon n="magnifying-glass" /><input placeholder="Search by batch, lab code, or drill hole…" disabled title="Search arrives in phase 5" /><span className="scanbtn"><Icon n="barcode" /></span></label>}
    <div className="bellwrap"><IconBtn n="bell" type="secondary" size={36} label={`Notifications${me!.unread ? `, ${me!.unread} unread` : ""}`} onClick={() => nav("/notifications")} />{me!.unread > 0 && <span className="badge-n">{me!.unread}</span>}</div>
    <div ref={ref} style={{ position: "relative" }}>
      <button className="userchip" aria-label="User menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><Avatar name={me!.fullName} />{bp === "desktop" && <span style={{ textAlign: "left" }}><b>{me!.fullName}</b><small>{me!.title}</small></span>}</button>
      {menu && <div className="menu" style={{ right: 0, top: 48, width: 260 }} role="menu">
        <div className="row g10" style={{ padding: "8px 10px" }}><Avatar name={me!.fullName} size={40} /><span className="col" style={{ gap: 0 }}><b className="t-sm w6">{me!.fullName}</b><span className="t-cap c-sec">{me!.email}</span></span></div><div className="mdiv" />
        <button className="mi" role="menuitem" onClick={() => { setMenu(false); nav("/profile"); }}><Icon n="user" />Profile</button><div className="mdiv" />
        <button className="mi" role="menuitem" onClick={() => signOut()}><Icon n="sign-out" />Sign out</button></div>}
    </div>
  </header>;
}

/** Wraps a page: shows No access when the role lacks every listed permission (Navigation plan section 4). */
export function Guard({ anyOf, children }: { anyOf: string[]; children: ReactNode }) {
  const { can, me } = useSession();
  const nav = useNavigate();
  if (anyOf.length && !can(...anyOf)) {
    const start = startPath(me!.permissions);
    return <div className="page"><Card><Empty icon="lock-simple" title="You don't have access to this page" text="Your role doesn't include this page. Ask your lab admin if you need it."
      action={<Button type="primary" size="lg" onClick={() => nav(start)}>{start === "/work" ? "Go to My work" : "Go to Dashboard"}</Button>} /></Card></div>;
  }
  return <>{children}</>;
}
