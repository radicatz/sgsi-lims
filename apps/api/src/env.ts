// Environment, checked at start-up. Values come from the repo's .env (see .env.example).
import { z } from "zod";

const Env = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
  SUPABASE_SECRET_KEY: z.string().min(10, "Set SUPABASE_SECRET_KEY in .env (Supabase > Project Settings > API Keys > Secret keys)"),
  DATABASE_URL: z.string().startsWith("postgres", "Set DATABASE_URL in .env (Supabase > Connect > Transaction pooler)"),
  API_PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  LAB_TIMEZONE: z.string().default("Asia/Makassar"),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error("The API cannot start. Fix .env:\n" + parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}
export const env = parsed.data;
