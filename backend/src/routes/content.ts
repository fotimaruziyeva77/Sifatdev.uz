import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { SLUG, schemaFor, statsSchema, type ContentKind } from "../lib/content.js";
import { FileRejected, MEDIA_FILES, readStored, resolveMediaName, storeMedia } from "../lib/files.js";
import { readMultipart } from "../lib/multipart.js";
import { audit, requireAdmin, type Role } from "../security/auth.js";

const kinds = z.enum(["case", "vacancy"]);
const LARGE_JSON = 512 * 1024;
const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Kim nimani tahrirlaydi (admin hamma narsani): loyiha — kontent, vakansiya — kontent va HR. */
const editors = (kind: ContentKind): Role[] => (kind === "vacancy" ? ["content", "hr"] : ["content"]);

function issues(err: z.ZodError) {
  return err.issues.slice(0, 20).map((i) => ({ field: i.path.join("."), code: i.message.slice(0, 80) }));
}

/** Ommaviy: sayt kontenti va rasmlar. */
export async function publicContentRoutes(app: FastifyInstance) {
  // Frontend server ichki tarmoqdan o'qiydi; kesh frontend'da (15 s).
  app.get("/content", { config: { rateLimit: false } }, async () => {
    const [items, stats] = await Promise.all([
      pool.query("SELECT kind, id, data FROM content_items WHERE published ORDER BY id"),
      pool.query("SELECT data FROM content_settings WHERE key = 'stats'"),
    ]);
    const pick = (kind: string) => items.rows.filter((r) => r.kind === kind).map((r) => ({ id: r.id, ...r.data }));
    return { ok: true, cases: pick("case"), vacancies: pick("vacancy"), stats: stats.rows[0]?.data ?? [] };
  });

  app.get("/media/:name", { config: { rateLimit: false } }, async (req, reply) => {
    const name = (req.params as { name: string }).name;
    const stored = resolveMediaName(name);
    if (!stored) return reply.code(404).send({ ok: false, error: "not_found" });
    const buf = await readStored(stored).catch(() => null);
    if (!buf) return reply.code(404).send({ ok: false, error: "not_found" });
    return reply
      .header("content-type", MIME[name.split(".").pop() ?? ""] ?? "application/octet-stream")
      .header("cache-control", "public, max-age=31536000, immutable")
      .header("cross-origin-resource-policy", "same-origin")
      .send(buf);
  });
}

/** Admin: loyiha, vakansiya, statistika va rasm yuklash. */
export async function adminContentRoutes(app: FastifyInstance) {
  app.get("/content/:kind", { preHandler: requireAdmin(["content", "hr"]) }, async (req, reply) => {
    const k = kinds.safeParse((req.params as { kind: string }).kind);
    if (!k.success) return reply.code(404).send({ ok: false });
    const { rows } = await pool.query("SELECT id, data, published, updated_at FROM content_items WHERE kind = $1 ORDER BY id", [k.data]);
    return { ok: true, items: rows };
  });

  /** Yaratish (mode=create) yoki yangilash. */
  app.put(
    "/content/:kind/:id",
    { bodyLimit: LARGE_JSON, preHandler: requireAdmin(["content", "hr"]) },
    async (req, reply) => {
      const params = req.params as { kind: string; id: string };
      const k = kinds.safeParse(params.kind);
      if (!k.success || !SLUG.test(params.id)) return reply.code(400).send({ ok: false, error: "invalid_id" });
      const a = req.admin!;
      if (a.role !== "admin" && !editors(k.data).includes(a.role)) return reply.code(403).send({ ok: false, error: "forbidden" });

      const body = z
        .object({ data: z.unknown(), published: z.boolean().default(true), create: z.boolean().default(false) })
        .strict()
        .safeParse(req.body);
      if (!body.success) return reply.code(422).send({ ok: false, error: "validation", fields: issues(body.error) });
      const parsed = schemaFor(k.data).safeParse(body.data.data);
      if (!parsed.success) return reply.code(422).send({ ok: false, error: "validation", fields: issues(parsed.error) });

      if (body.data.create) {
        const { rowCount } = await pool.query(
          "INSERT INTO content_items(kind, id, data, published) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
          [k.data, params.id, JSON.stringify(parsed.data), body.data.published],
        );
        if (!rowCount) return reply.code(409).send({ ok: false, error: "id_exists" });
      } else {
        const { rowCount } = await pool.query(
          "UPDATE content_items SET data = $3, published = $4, updated_at = now() WHERE kind = $1 AND id = $2",
          [k.data, params.id, JSON.stringify(parsed.data), body.data.published],
        );
        if (!rowCount) return reply.code(404).send({ ok: false, error: "not_found" });
      }
      await audit(a.id, body.data.create ? "content_create" : "content_update", `${k.data}:${params.id}`, { published: body.data.published }, req);
      return { ok: true };
    },
  );

  app.delete("/content/:kind/:id", { preHandler: requireAdmin(["content", "hr"]) }, async (req, reply) => {
    const params = req.params as { kind: string; id: string };
    const k = kinds.safeParse(params.kind);
    if (!k.success || !SLUG.test(params.id)) return reply.code(400).send({ ok: false, error: "invalid_id" });
    const a = req.admin!;
    if (a.role !== "admin" && !editors(k.data).includes(a.role)) return reply.code(403).send({ ok: false, error: "forbidden" });
    const { rowCount } = await pool.query("DELETE FROM content_items WHERE kind = $1 AND id = $2", [k.data, params.id]);
    if (!rowCount) return reply.code(404).send({ ok: false, error: "not_found" });
    await audit(a.id, "content_delete", `${k.data}:${params.id}`, {}, req);
    return { ok: true };
  });

  app.get("/stats", { preHandler: requireAdmin(["content"]) }, async () => {
    const { rows } = await pool.query("SELECT data FROM content_settings WHERE key = 'stats'");
    return { ok: true, stats: rows[0]?.data ?? [] };
  });

  app.put("/stats", { preHandler: requireAdmin(["content"]) }, async (req, reply) => {
    const parsed = statsSchema.safeParse((req.body as { stats?: unknown } | null)?.stats);
    if (!parsed.success) return reply.code(422).send({ ok: false, error: "validation", fields: issues(parsed.error) });
    await pool.query(
      "INSERT INTO content_settings(key, data) VALUES ('stats', $1) ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = now()",
      [JSON.stringify(parsed.data)],
    );
    await audit(req.admin!.id, "stats_update", null, { count: parsed.data.length }, req);
    return { ok: true };
  });

  /** Rasm yuklash: faqat png, jpg, webp (magic bytes tekshiriladi); SVG qabul qilinmaydi. */
  app.post("/media", { preHandler: requireAdmin(["content", "hr"]) }, async (req, reply) => {
    if (!req.isMultipart()) return reply.code(415).send({ ok: false, error: "multipart_required" });
    const mp = await readMultipart(req, MEDIA_FILES.maxBytes);
    if (!mp.file || mp.file.buffer.length === 0) return reply.code(422).send({ ok: false, error: "file_required" });
    if (mp.file.truncated) return reply.code(413).send({ ok: false, error: "file_too_large" });
    try {
      const name = await storeMedia(mp.file.buffer, mp.file.filename);
      await audit(req.admin!.id, "media_upload", name, {}, req);
      return reply.code(201).send({ ok: true, src: `/api/v1/media/${name}` });
    } catch (e) {
      if (e instanceof FileRejected) return reply.code(422).send({ ok: false, error: "file_rejected", reason: e.message });
      throw e;
    }
  });
}
