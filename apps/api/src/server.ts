// SGSI LIMS API (Fastify). All routes live under /api.
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { randomUUID } from "node:crypto";
import { env } from "./env";
import { sql } from "./db";
import { sessionRoutes } from "./routes/session";
import { masterRoutes } from "./routes/master";
import { userRoutes } from "./routes/users";
import { configRoutes } from "./routes/config";

const app = Fastify({
  logger: process.env.NODE_ENV === "production" ? true : { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } } },
  genReqId: () => randomUUID(),
}).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(cors, { origin: env.WEB_ORIGIN, credentials: false });
await app.register(rateLimit, { global: false });

// one error shape for the web app: { code, text, field? }
app.setErrorHandler((err: { validation?: unknown; statusCode?: number }, req, reply) => {
  if (err.validation) {
    // the first problem names its field, so the form can show the message on it
    const first = (err.validation as Array<{ instancePath?: string; message?: string; params?: { issue?: { path?: Array<string | number> } } }>)[0];
    const field = first?.instancePath?.split("/").filter(Boolean)[0] ?? first?.params?.issue?.path?.[0];
    return reply.code(422).send({ code: "invalid", text: first?.message ?? "Check the highlighted fields.", ...(field !== undefined ? { field: String(field) } : {}) });
  }
  req.log.error(err);
  return reply.code(err.statusCode && err.statusCode < 500 ? err.statusCode : 500).send({ code: "server_error", text: "Something went wrong. Try again, and tell the lab admin if it keeps happening." });
});

await app.register(async (api) => {
  api.get("/health", async () => {
    const [r] = await sql`select now() as db_time, (select count(*)::int from permissions) as permissions`;
    return { ok: true, dbTime: r!.db_time, permissions: r!.permissions };
  });
  await api.register(sessionRoutes);
  await api.register(masterRoutes);
  await api.register(userRoutes);
  await api.register(configRoutes);
}, { prefix: "/api" });

await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
