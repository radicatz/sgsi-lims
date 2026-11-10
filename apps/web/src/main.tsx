import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NAV, startPath } from "@sgsi/shared";
import { SessionProvider, useSession } from "./app/session";
import { Guard, Shell } from "./app/Shell";
import { Forgot, SetPassword, SignIn } from "./pages/Auth";
import { Coming, NotFound, Profile } from "./pages/Basics";
import { Toasts } from "./ui";
import "./styles/tokens.css";
import "./styles/app.css";

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
const router = createBrowserRouter([{ element: <Root />, children: [
  { element: <Public />, children: [{ path: "/login", element: <SignIn /> }, { path: "/forgot", element: <Forgot /> }] },
  { path: "/set-password", element: <SetPassword /> },
  { element: <Private />, children: [
    ...pages.map((p) => ({ path: p.path, element: <Guard anyOf={p.anyOf}>{p.path === "/" ? <DashboardOrStart /> : <Coming path={p.path} />}</Guard> })),
    { path: "/profile", element: <Profile /> },
    { path: "/notifications", element: <Coming path="/notifications" /> },
    { path: "/start", element: <Start /> },
    { path: "*", element: <NotFound /> },
  ] },
] }]);
function DashboardOrStart() { return <Coming path="/" />; }

createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={qc}><RouterProvider router={router} /></QueryClientProvider></StrictMode>);
