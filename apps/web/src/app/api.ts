// API client. The web app talks only to our API (Stack_Decision_Record S-6). The session (access and refresh token) is
// kept in localStorage so a reload keeps the user signed in; the idle timer in session.tsx signs them out after the
// Security setting's idle time.

export interface Session { accessToken: string; refreshToken: string; expiresAt: number | null }
export class ApiError extends Error {
  constructor(public status: number, public code: string, public title: string | undefined, public text: string, public field?: string) { super(text); }
}

const KEY = "sgsi.session";
export const loadSession = (): Session | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; } };
export const saveSession = (s: Session | null) => { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

let onExpired: (() => void) | null = null;
export const setOnExpired = (fn: () => void) => { onExpired = fn; };

async function raw(path: string, init: RequestInit, token?: string) {
  const headers: Record<string, string> = { ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers as Record<string, string>) };
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(`/api${path}`, { ...init, headers });
}

let refreshing: Promise<Session | null> | null = null;
async function refresh(): Promise<Session | null> {
  const s = loadSession();
  if (!s) return null;
  refreshing ??= raw("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: s.refreshToken }) })
    .then(async (r) => (r.ok ? ((await r.json()) as Session) : null))
    .then((n) => { saveSession(n); return n; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  if (json !== undefined) rest.body = JSON.stringify(json);
  let s = loadSession();
  let res = await raw(path, rest, s?.accessToken);
  if (res.status === 401 && s) {
    s = await refresh();
    if (s) res = await raw(path, rest, s.accessToken);
    else { onExpired?.(); }
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.code ?? "error", body.title, body.text ?? "Something went wrong.", body.field);
  return body as T;
}
