// Signature and lab stamp (Reports_Build_Design.md sections 7.1 and 16; frames 00-App-09-Profile-04 and -05): each signatory uploads their own signature,
// the Manager uploads the stamp. Images are PNG only, up to 1 MB, kept in the private bucket `signing`, and served only by the API. A replaced image is
// retired, not deleted, so an older certificate can still be checked against the hash it recorded.
import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { authenticate, requireAny } from "../auth";
import { admin } from "../supabase";
import { sql } from "../db";
import { fail, runAsActor } from "../batch-lib";

const SCREEN = "Profile";
const MAX = 1024 * 1024;
const BUCKET = "signing";

/** What the server finds in a PNG: its size and whether it can be transparent. Null when the bytes are not a PNG. */
export function readPng(b: Buffer): { width: number; height: number; transparent: boolean } | null {
  if (b.length < 33 || !b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || b.subarray(12, 16).toString("latin1") !== "IHDR") return null;
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20), colorType = b[25]!;
  let transparent = colorType === 4 || colorType === 6;
  for (let p = 8; !transparent && p + 8 <= b.length;) {   // a palette or grey PNG can carry transparency in a tRNS chunk
    const len = b.readUInt32BE(p), type = b.subarray(p + 4, p + 8).toString("latin1");
    if (type === "tRNS") transparent = true;
    if (type === "IDAT" || type === "IEND") break;
    p += 12 + len;
  }
  return { width, height, transparent };
}

type Kind = "signature" | "stamp";
const current = async (kind: Kind, userId: string | null) =>
  (await sql`select a.id, a.storage_path, a.sha256, a.size_bytes, a.set_at, p.full_name as set_by_name
    from signing_assets a left join profiles p on p.id = a.set_by
    where a.kind = ${kind} and a.retired_at is null and a.user_id is not distinct from ${userId}::uuid`)[0];
const summary = (a: Awaited<ReturnType<typeof current>>) => (a ? { has: true, setAt: a.set_at, setBy: a.set_by_name ?? null, sizeBytes: Number(a.size_bytes), sha: (a.sha256 as string).slice(0, 8).toUpperCase() } : { has: false, setAt: null, setBy: null, sizeBytes: 0, sha: null });

export async function signingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);
  await app.register(multipart, { limits: { fileSize: MAX + 1, files: 1, fields: 2 } });
  const uid = (req: { user?: { userId: string } | undefined }) => req.user!.userId;

  async function store(req: Parameters<typeof runAsActor>[0] & { file: () => Promise<{ toBuffer: () => Promise<Buffer>; file: { truncated: boolean } } | undefined> }, reply: Parameters<typeof fail>[0], kind: Kind, owner: string | null, what: string) {
    const file = await req.file().catch(() => null);
    if (!file) return fail(reply, 400, "no_file", `Choose the ${what} first.`, "file");
    const buf = await file.toBuffer().catch(() => null);
    if (!buf || buf.length > MAX || file.file.truncated) return fail(reply, 413, "too_big", "The file is larger than 1 MB.", "file");
    const png = readPng(buf);
    if (!png) return fail(reply, 415, "bad_type", "Use a PNG file.", "file");
    if (png.width < 300) return fail(reply, 422, "too_small", "The image is too small. Use at least 300 pixels wide.", "file");
    const sha = createHash("sha256").update(buf).digest("hex");
    const same = await current(kind, owner);
    if (same && same.sha256 === sha) return { ok: true, changed: false, transparent: png.transparent };
    const path = kind === "stamp" ? `stamp/${sha}.png` : `signature/${owner}/${sha}.png`;
    const up = await admin.storage.from(BUCKET).upload(path, buf, { contentType: "image/png", upsert: true });
    if (up.error) throw up.error;
    await runAsActor(req, SCREEN, async (tx) => {
      await tx`update signing_assets set retired_at = now() where kind = ${kind} and retired_at is null and user_id is not distinct from ${owner}::uuid`;
      await tx`insert into signing_assets (kind, user_id, storage_path, sha256, size_bytes, set_by) values (${kind}, ${owner}, ${path}, ${sha}, ${buf.length}, ${uid(req)})`;
    });
    return { ok: true, changed: true, transparent: png.transparent, width: png.width, height: png.height };
  }
  async function image(kind: Kind, owner: string | null, reply: Parameters<typeof fail>[0], what: string) {
    const a = await current(kind, owner);
    if (!a) return fail(reply, 404, "not_found", `No ${what} has been uploaded yet.`);
    const { data, error } = await admin.storage.from(BUCKET).download(a.storage_path as string);
    if (error || !data) return fail(reply, 404, "no_file", `The ${what} file is missing.`);
    return reply.header("content-type", "image/png").header("cache-control", "no-store").send(Buffer.from(await data.arrayBuffer()));
  }

  /* ---------- your own signature: only you, for yourself ---------- */
  app.get("/me/signature", { preHandler: requireAny("report.sign") }, async (req) => summary(await current("signature", uid(req))));
  app.get("/me/signature/image", { preHandler: requireAny("report.sign") }, async (req, reply) => image("signature", uid(req), reply, "signature"));
  app.put("/me/signature", { preHandler: requireAny("report.sign") }, async (req, reply) => store(req as never, reply, "signature", uid(req), "signature"));

  /* ---------- the lab stamp: uploaded by the Manager only; signatories see it in the Sign dialog ---------- */
  app.get("/laboratory/stamp", { preHandler: requireAny("signing.stamp", "report.sign") }, async () => summary(await current("stamp", null)));
  app.get("/laboratory/stamp/image", { preHandler: requireAny("signing.stamp", "report.sign") }, async (_req, reply) => image("stamp", null, reply, "lab stamp"));
  app.put("/laboratory/stamp", { preHandler: requireAny("signing.stamp") }, async (req, reply) => store(req as never, reply, "stamp", null, "lab stamp"));
}
