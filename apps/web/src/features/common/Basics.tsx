// Phase 0 pages: Notifications (list arrives in phase 5), a holding page per module, Not found.
import { useNavigate } from "react-router";
import { startPath } from "@sgsi/shared";
import { useSession } from "../../app/session";
import { Button, Card, Empty, PageHead } from "../../components";

const PHASE: Record<string, [number, string]> = {
  "/work": [5, "My work"], "/": [5, "Dashboard"], "/orders": [2, "Job orders"], "/batches": [3, "Batches"], "/reports": [4, "Reports"],
  "/search": [5, "Search"], "/clients": [1, "Clients"], "/master/drill-holes": [1, "Drill hole"], "/master/lithologies": [1, "Lithology"],
  "/master/seams": [1, "Seam"], "/users": [1, "Users"], "/config": [1, "Configuration"], "/audit": [5, "Audit log"], "/notifications": [5, "Notifications"],
};

export function Coming({ path }: { path: string }) {
  const [phase, name] = PHASE[path] ?? [0, "This page"];
  return <div className="page"><PageHead overline={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} title={name} />
    <Card><Empty icon="stack" title={`${name} is built in phase ${phase}`} text="The sign-in, your role's sidebar and this page's access rule already work. The screen itself follows the v1 build plan." /></Card></div>;
}

export function NotFound() {
  const nav = useNavigate(); const { me } = useSession();
  return <div className="page"><Card><Empty icon="question" title="This page does not exist" text="The link may be old or mistyped." action={<Button type="primary" onClick={() => nav(startPath(me!.permissions))}>Go to the start page</Button>} /></Card></div>;
}
