import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool, tx } from "../db/pool.js";
import { csvCell, cleanText } from "../lib/sanitize.js";
import { readStored, deleteStored } from "../lib/files.js";
import { audit, login, logout, requireAdmin, setSessionCookie, visibleKinds } from "../security/auth.js";

const loginSchema = z.object({
  email: z.string().max(254),
  password: z.string().min(1).max(128),
  totp: z.string().max(6),
});

const listSchema = z.object({
  kind: z.enum(["brief", "quick", "application", "subscribe"]).optional(),
  status: z.enum(["new", "in_progress", "closed"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

const uuid = z.object({ id: z.uuid() });

const patchSchema = z
  .object({
    status: z.enum(["new", "in_progress", "closed"]).optional(),
    assigneeId: z.uuid().nullable().optional(),
  })
  .strict();

export async function adminRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const p = loginSchema.safeParse(req.body);
      if (!p.success) return reply.code(400).send({ ok: false, error: "invalid" });
      const r = await login(p.data.email, p.data.password, p.data.totp, req);
      // Bir xil xabar: email yoki parol yoki kod — qaysi biri xatoligi aytilmaydi.
      if (!r.ok) return reply.code(r.reason === "locked" ? 423 : 401).send({ ok: false, error: r.reason });
      setSessionCookie(reply, r.token);
      return { ok: true, user: r.user, csrf: r.csrf };
    },
  );

  app.post("/auth/logout", { preHandler: requireAdmin() }, async (req, reply) => {
    await logout(req, reply);
    return { ok: true };
  });

  app.get("/me", { preHandler: requireAdmin() }, async (req) => {
    const a = req.admin!;
    return { ok: true, user: { id: a.id, email: a.email, name: a.name, role: a.role }, csrf: a.csrf };
  });

  app.get("/leads", { preHandler: requireAdmin(["sales", "hr"]) }, async (req, reply) => {
    const q = listSchema.safeParse(req.query);
    if (!q.success) return reply.code(400).send({ ok: false, error: "invalid_query" });
    const kinds = visibleKinds(req.admin!.role).filter((k) => !q.data.kind || k === q.data.kind);
    const limit = 50;
    const { rows } = await pool.query(
      `SELECT id, kind, status, name, phone, email, telegram, locale, source, created_at, first_response_at, assignee_id
       FROM leads WHERE kind = ANY($1) AND ($2::text IS NULL OR status = $2)
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [kinds, q.data.status ?? null, limit, (q.data.page - 1) * limit],
    );
    return { ok: true, items: rows, page: q.data.page };
  });

  app.get("/leads/:id", { preHandler: requireAdmin(["sales", "hr"]) }, async (req, reply) => {
    const p = uuid.safeParse(req.params);
    if (!p.success) return reply.code(404).send({ ok: false });
    const { rows } = await pool.query(`SELECT * FROM leads WHERE id = $1 AND kind = ANY($2)`, [p.data.id, visibleKinds(req.admin!.role)]);
    if (!rows[0]) return reply.code(404).send({ ok: false });
    const [files, notes] = await Promise.all([
      pool.query(`SELECT id, original_name, mime, size, created_at FROM lead_files WHERE lead_id = $1`, [p.data.id]),
      pool.query(
        `SELECT n.id, n.body, n.created_at, u.name AS author FROM lead_notes n LEFT JOIN admin_users u ON u.id = n.author_id WHERE lead_id = $1 ORDER BY n.id`,
        [p.data.id],
      ),
    ]);
    const { ip_hash: _ip, ...lead } = rows[0];
    await audit(req.admin!.id, "lead_view", p.data.id, {}, req);
    return { ok: true, lead, files: files.rows, notes: notes.rows };
  });

  app.patch("/leads/:id", { preHandler: requireAdmin(["sales", "hr"]) }, async (req, reply) => {
    const p = uuid.safeParse(req.params);
    const b = patchSchema.safeParse(req.body);
    if (!p.success || !b.success) return reply.code(400).send({ ok: false, error: "invalid" });
    const { rowCount } = await pool.query(
      `UPDATE leads SET
         status = COALESCE($3, status),
         assignee_id = CASE WHEN $4::boolean THEN $5::uuid ELSE assignee_id END,
         first_response_at = CASE WHEN first_response_at IS NULL AND $3 IS NOT NULL AND $3 <> 'new' THEN now() ELSE first_response_at END,
         updated_at = now()
       WHERE id = $1 AND kind = ANY($2)`,
      [p.data.id, visibleKinds(req.admin!.role), b.data.status ?? null, b.data.assigneeId !== undefined, b.data.assigneeId ?? null],
    );
    if (!rowCount) return reply.code(404).send({ ok: false });
    await audit(req.admin!.id, "lead_update", p.data.id, b.data, req);
    return { ok: true };
  });

  app.post("/leads/:id/notes", { preHandler: requireAdmin(["sales", "hr"]) }, async (req, reply) => {
    const p = uuid.safeParse(req.params);
    const b = z.object({ body: z.string().min(1).max(4000) }).safeParse(req.body);
    if (!p.success || !b.success) return reply.code(400).send({ ok: false });
    const own = await pool.query(`SELECT 1 FROM leads WHERE id = $1 AND kind = ANY($2)`, [p.data.id, visibleKinds(req.admin!.role)]);
    if (!own.rowCount) return reply.code(404).send({ ok: false });
    await pool.query(`INSERT INTO lead_notes(lead_id, author_id, body) VALUES ($1,$2,$3)`, [p.data.id, req.admin!.id, cleanText(b.data.body, 4000)]);
    return { ok: true };
  });

  /** GDPR / shaxsiy ma'lumotlar subyekti so'rovi: so'rov va fayllarni butunlay o'chirish. */
  app.delete("/leads/:id", { preHandler: requireAdmin(["admin"]) }, async (req, reply) => {
    const p = uuid.safeParse(req.params);
    if (!p.success) return reply.code(404).send({ ok: false });
    const files = await tx(async (c) => {
      const f = await c.query(`SELECT stored_path FROM lead_files WHERE lead_id = $1`, [p.data.id]);
      const d = await c.query(`DELETE FROM leads WHERE id = $1`, [p.data.id]);
      if (!d.rowCount) return null;
      return f.rows.map((r) => r.stored_path as string);
    });
    if (!files) return reply.code(404).send({ ok: false });
    await Promise.all(files.map((f) => deleteStored(f).catch(() => undefined)));
    await audit(req.admin!.id, "lead_delete", p.data.id, { files: files.length }, req);
    return { ok: true };
  });

  app.get("/files/:id", { preHandler: requireAdmin(["sales", "hr"]) }, async (req, reply) => {
    const p = uuid.safeParse(req.params);
    if (!p.success) return reply.code(404).send({ ok: false });
    const { rows } = await pool.query(
      `SELECT f.* FROM lead_files f JOIN leads l ON l.id = f.lead_id WHERE f.id = $1 AND l.kind = ANY($2)`,
      [p.data.id, visibleKinds(req.admin!.role)],
    );
    const f = rows[0];
    if (!f) return reply.code(404).send({ ok: false });
    await audit(req.admin!.id, "file_download", f.id, {}, req);
    const buf = await readStored(f.stored_path);
    const ascii = String(f.original_name).replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
    return reply
      .header("content-type", "application/octet-stream")
      .header("content-disposition", `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(f.original_name)}`)
      .header("cache-control", "no-store")
      .send(buf);
  });

  app.get("/leads.csv", { preHandler: requireAdmin(["sales", "hr"]) }, async (req, reply) => {
    const { rows } = await pool.query(
      `SELECT id, kind, status, name, phone, email, telegram, locale, data, source, created_at FROM leads
       WHERE kind = ANY($1) ORDER BY created_at DESC LIMIT 10000`,
      [visibleKinds(req.admin!.role)],
    );
    const head = ["id", "kind", "status", "name", "phone", "email", "telegram", "locale", "data", "source", "created_at"];
    const lines = [head.map(csvCell).join(",")];
    for (const r of rows) {
      lines.push(head.map((h) => csvCell(typeof r[h] === "object" && r[h] !== null && !(r[h] instanceof Date) ? JSON.stringify(r[h]) : r[h] instanceof Date ? r[h].toISOString() : r[h])).join(","));
    }
    await audit(req.admin!.id, "leads_export", null, { count: rows.length }, req);
    return reply
      .header("content-type", "text/csv; charset=utf-8")
      .header("content-disposition", `attachment; filename="leads.csv"`)
      .header("cache-control", "no-store")
      .send("﻿" + lines.join("\r\n"));
  });

  app.get("/audit", { preHandler: requireAdmin(["admin"]) }, async () => {
    const { rows } = await pool.query(
      `SELECT a.id, a.action, a.target, a.meta, a.created_at, u.email FROM audit_log a
       LEFT JOIN admin_users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 500`,
    );
    return { ok: true, items: rows };
  });

  app.get("/users", { preHandler: requireAdmin(["sales", "hr"]) }, async () => {
    const { rows } = await pool.query(`SELECT id, name, role FROM admin_users WHERE is_active ORDER BY name`);
    return { ok: true, items: rows };
  });
}
