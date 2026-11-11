import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NAV, startPath } from "@sgsi/shared";
import { SessionProvider, useSession } from "./app/session";
import { Guard, Shell } from "./app/Shell";
import { Forgot, SetPassword, SignIn } from "./features/auth/Auth";
import { Coming, NotFound, Profile } from "./features/common/Basics";
import { Clients, ClientPage } from "./features/master-data/Clients";
import { DrillHoles, Lithologies, Seams } from "./features/master-data/Lists";
import { UserPage, Users } from "./features/admin/Users";
import { Config } from "./features/admin/Config";
import { Toasts } from "./components";
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
const BUILT: Record<string, () => ReactElement> = { "/clients": Clients, "/master/drill-holes": DrillHoles, "/master/lithologies": Lithologies, "/master/seams": Seams, "/users": Users, "/config": Config };
const CLIENT_READ = ["company.read"];
function Built({ path }: { path: string }) { const Page = BUILT[path]!; return <Page />; }
const router = createBrowserRouter([{ element: <Root />, children: [
  { element: <Public />, children: [{ path: "/login", element: <SignIn /> }, { path: "/forgot", element: <Forgot /> }] },
  { path: "/set-password", element: <SetPassword /> },
  { element: <Private />, children: [
    ...pages.map((p) => ({ path: p.path, element: <Guard anyOf={p.anyOf}>{p.path === "/" ? <DashboardOrStart /> : BUILT[p.path] ? <Built path={p.path} /> : <Coming path={p.path} />}</Guard> })),
    { path: "/clients/:id", element: <Guard anyOf={CLIENT_READ}><ClientPage /></Guard> },
    { path: "/users/:id", element: <Guard anyOf={["user.manage"]}><UserPage /></Guard> },
    { path: "/config/:section", element: <Guard anyOf={["config.write"]}><Config /></Guard> },
    { path: "/profile", element: <Profile /> },
    { path: "/notifications", element: <Coming path="/notifications" /> },
    { path: "/start", element: <Start /> },
    { path: "*", element: <NotFound /> },
  ] },
] }]);
function DashboardOrStart() { return <Coming path="/" />; }

createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider></StrictMode>);
