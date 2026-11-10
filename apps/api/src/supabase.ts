// Supabase clients. `admin` uses the secret key (invites, resets, account changes); `auth` signs users in.
// Neither key ever reaches the browser.
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } } as const;
export const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, opts);
export const authClient = () => createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, opts);
