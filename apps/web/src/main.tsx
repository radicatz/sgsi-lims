import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NAV, startPath } from "@sgsi/shared";
import { SessionProvider, useSession } from "./app/session";
import { Guard, Shell } from "./app/Shell";
import { Forgot, SetPassword, SignIn } from "./features/auth/Auth";
import { Coming, NotFound, Profile } from "./features/common/Basics";
import { NotificationsPage } from "./features/notifications/Notifications";
import { Clients, ClientPage } from "./features/master-data/Clients";
import { DrillHoles, Lithologies, Seams } from "./features/master-data/Lists";
import { UserPage, Users } from "./features/admin/Users";
import { Config } from "./features/admin/Config";
import { Orders } from "./features/orders/List";
import { OrderPage } from "./features/orders/Detail";
import { Batches } from "./features/batches/List";
import { BatchPage } from "./features/batches/Page";
import { CoaPage } from "./features/reports/CoaPage";
import { SampleHistoryPage } from "./features/search/SampleHistory";
import { SearchPage } from "./features/search/Results";
import { AdvancedPage } from "./features/search/Advanced";
import { RoaPage } from "./features/reports/RoaPage";
import { Reports } from "./features/reports/List";
import { Toasts } from "./components";
import { QueuePage, WorkPage } from "./features/work/Work";
import { DashboardPage } from "./features/dashboard/Dashboard";
import "./styles/index.css";

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

function Root() { return <SessionProvider><Outlet /><Toasts /></SessionProvider>; }
function Public() {
  const { me, loading } = useSession();
  if (loading) return null;
  return me ? <Navigate to={startPath(me.permissions, me.prefs.startPage)} replace /> : <Outlet />;
}
function Private() {
  const { me, loading } = useSession();
  if (loading) return <div className="boot">Loading…</div>;
  return me ? <Shell /> : <Navigate to="/login" replace />;
}
function Start() { const { me } = useSession(); return <Navigate to={startPath(me!.permissions, me!.prefs.startPage)} replace />; }

const pages = NAV.flatMap((g) => g.items);
const BUILT: Record<string, () => ReactElement> = { "/work": WorkPage, "/search": SearchPage, "/clients": Clients, "/master/drill-holes": DrillHoles, "/master/lithologies": Lithologies, "/master/seams": Seams, "/users": Users, "/config": Config, "/orders": Orders, "/batches": Batches, "/reports": Reports };
const CLIENT_READ = ["company.read"];
function Built({ path }: { path: string }) { const Page = BUILT[path]!; return <Page />; }
const router = createBrowserRouter([{ element: <Root />, children: [
  { element: <Public />, children: [{ path: "/login", element: <SignIn /> }, { path: "/forgot", element: <Forgot /> }] },
  { path: "/set-password", element: <SetPassword /> },
  { element: <Private />, children: [
    ...pages.map((p) => ({ path: p.path, element: <Guard anyOf={p.anyOf}>{p.path === "/" ? <DashboardOrStart /> : BUILT[p.path] ? <Built path={p.path} /> : <Coming path={p.path} />}</Guard> })),
    { path: "/orders/:no/:tab?", element: <Guard anyOf={["order.read"]}><OrderPage /></Guard> },
    { path: "/batches/:no/:tab?", element: <Guard anyOf={["batch.read"]}><BatchPage /></Guard> },
    { path: "/work/:queue", element: <Guard anyOf={["work.use"]}><QueuePage /></Guard> },
    { path: "/search/advanced", element: <Guard anyOf={["search.use"]}><AdvancedPage /></Guard> },
    { path: "/samples/:id/history", element: <Guard anyOf={["search.use"]}><SampleHistoryPage /></Guard> },
    { path: "/reports/coa/:id", element: <Guard anyOf={["coa.download", "report.publish", "report.sign"]}><CoaPage /></Guard> },
    { path: "/reports/roa/:no", element: <Guard anyOf={["roa.download"]}><RoaPage /></Guard> },
    { path: "/clients/:id", element: <Guard anyOf={CLIENT_READ}><ClientPage /></Guard> },
    { path: "/users/:id", element: <Guard anyOf={["user.manage"]}><UserPage /></Guard> },
    { path: "/config/:section", element: <Guard anyOf={["config.write"]}><Config /></Guard> },
    { path: "/profile", element: <Profile /> },
    { path: "/notifications", element: <NotificationsPage /> },
    { path: "/start", element: <Start /> },
    { path: "*", element: <NotFound /> },
  ] },
] }]);
function DashboardOrStart() { return <DashboardPage />; }

createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider></StrictMode>);
