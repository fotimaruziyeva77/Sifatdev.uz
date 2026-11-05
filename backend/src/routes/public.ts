import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { config } from "../config.js";
import { tx } from "../db/pool.js";
import { hashIp } from "../lib/crypto.js";
import { verifyTurnstile } from "../lib/turnstile.js";
import { enqueue, processOutbox } from "../lib/outbox.js";
import { BRIEF_FILES, CV_FILES, FileRejected, storeUpload, deleteStored, type StoredFile } from "../lib/files.js";
import { readMultipart, collectSource } from "../lib/multipart.js";
import { applicationSchema, briefSchema, quickSchema, subscribeSchema } from "../lib/schemas.js";
import { autoReply, telegramApplication, telegramBrief, telegramQuick } from "../lib/messages.js";

/** TZ 8.2: IP bo'yicha soatiga 5 ta so'rov. */
const FORM_LIMIT = { max: 5, timeWindow: "1 hour" };

function fieldErrors(err: z.ZodError) {
  return err.issues.map((i) => ({ field: i.path.join("."), code: i.message.slice(0, 60) }));
}

function adminLink(id: string) {
  return `${config.PUBLIC_SITE_URL}/admin/leads/${id}`;
}

async function guard(req: FastifyRequest, reply: FastifyReply, body: { website?: string; turnstileToken?: string }) {
  // Honeypot: bot to'ldirgan bo'lsa — muvaffaqiyat ko'rsatamiz, lekin saqlamaymiz.
  if (body.website) {
    req.log.info("honeypot ishladi");
    reply.code(200).send({ ok: true });
    return false;
  }
  if (!(await verifyTurnstile(body.turnstileToken, req.ip))) {
    reply.code(400).send({ ok: false, error: "captcha_failed" });
    return false;
  }
  return true;
}

export async function publicRoutes(app: FastifyInstance) {
  // --- Tezkor forma (JSON) ---
  app.post("/leads/quick", { config: { rateLimit: FORM_LIMIT } }, async (req, reply) => {
    const parsed = quickSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(422).send({ ok: false, error: "validation", fields: fieldErrors(parsed.error) });
    const d = parsed.data;
    if (!(await guard(req, reply, d))) return reply;

    const id = await tx(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO leads(kind, name, phone, locale, data, source, ip_hash)
         VALUES ('quick', $1, $2, $3, $4, $5, $6) RETURNING id`,
        [d.name, d.contact, d.locale, JSON.stringify({ comment: d.comment }), JSON.stringify(d.source), hashIp(req.ip)],
      );
      const leadId = rows[0].id as string;
      await enqueue(c, [
        { channel: "telegram", payload: { chat: "sales", text: telegramQuick(d, adminLink(leadId)) } },
        ...(config.TEAM_EMAIL_SALES
          ? [{ channel: "email" as const, payload: { to: config.TEAM_EMAIL_SALES, subject: `Tezkor so'rov: ${d.name}`, text: telegramQuick(d, adminLink(leadId)) } }]
          : []),
      ]);
      return leadId;
    });
    void processOutbox(req.log);
    return reply.code(201).send({ ok: true, id });
  });

  // --- Loyiha brifi (multipart, ixtiyoriy fayl) ---
  app.post("/leads/brief", { config: { rateLimit: FORM_LIMIT } }, async (req, reply) => {
    if (!req.isMultipart()) return reply.code(415).send({ ok: false, error: "multipart_required" });
    const mp = await readMultipart(req, BRIEF_FILES.maxBytes);
    if (mp.file?.truncated) return reply.code(413).send({ ok: false, error: "file_too_large" });
    const parsed = briefSchema.safeParse({ ...mp.fields, source: collectSource(mp.fields) });
    if (!parsed.success) return reply.code(422).send({ ok: false, error: "validation", fields: fieldErrors(parsed.error) });
    const d = parsed.data;
    if (!(await guard(req, reply, d))) return reply;

    let stored: StoredFile | undefined;
    if (mp.file && mp.file.buffer.length > 0) {
      try {
        stored = await storeUpload(mp.file.buffer, mp.file.filename, BRIEF_FILES);
      } catch (e) {
        if (e instanceof FileRejected) return reply.code(422).send({ ok: false, error: "file_rejected", reason: e.message });
        throw e;
      }
    }

    try {
      const id = await tx(async (c) => {
        const { rows } = await c.query(
          `INSERT INTO leads(kind, name, phone, email, telegram, locale, data, source, ip_hash)
           VALUES ('brief', $1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            d.name,
            d.phone || null,
            d.email || null,
            d.telegram || null,
            d.locale,
            JSON.stringify({
              services: d.services,
              stage: d.stage,
              budget: d.budget,
              currency: d.currency,
              timeline: d.timeline,
              description: d.description,
              company: d.company,
              preferredContact: d.preferredContact,
              caseRef: d.caseRef,
            }),
            JSON.stringify(d.source),
            hashIp(req.ip),
          ],
        );
        const leadId = rows[0].id as string;
        if (stored) {
          await c.query(
            `INSERT INTO lead_files(lead_id, original_name, stored_path, mime, size, sha256) VALUES ($1,$2,$3,$4,$5,$6)`,
            [leadId, stored.originalName, stored.storedPath, stored.mime, stored.size, stored.sha256],
          );
        }
        const text = telegramBrief(d, adminLink(leadId));
        await enqueue(c, [
          { channel: "telegram", payload: { chat: "sales", text, file: stored && { storedPath: stored.storedPath, originalName: stored.originalName, mime: stored.mime } } },
          ...(config.TEAM_EMAIL_SALES
            ? [{ channel: "email" as const, payload: { to: config.TEAM_EMAIL_SALES, subject: `Loyiha brifi: ${d.name}`, text, replyTo: d.email || undefined } }]
            : []),
          ...(d.email ? [{ channel: "email" as const, payload: { to: d.email, ...autoReply("lead", d.locale, d.name) } }] : []),
        ]);
        return leadId;
      });
      void processOutbox(req.log);
      return reply.code(201).send({ ok: true, id });
    } catch (e) {
      if (stored) await deleteStored(stored.storedPath).catch(() => undefined);
      throw e;
    }
  });

  // --- Vakansiyaga ariza (multipart, CV majburiy) ---
  app.post("/applications", { config: { rateLimit: FORM_LIMIT } }, async (req, reply) => {
    if (!req.isMultipart()) return reply.code(415).send({ ok: false, error: "multipart_required" });
    const mp = await readMultipart(req, CV_FILES.maxBytes);
    if (mp.file?.truncated) return reply.code(413).send({ ok: false, error: "file_too_large" });
    const parsed = applicationSchema.safeParse({ ...mp.fields, source: collectSource(mp.fields) });
    if (!parsed.success) return reply.code(422).send({ ok: false, error: "validation", fields: fieldErrors(parsed.error) });
    const d = parsed.data;
    if (!(await guard(req, reply, d))) return reply;
    if (!mp.file || mp.file.buffer.length === 0) return reply.code(422).send({ ok: false, error: "validation", fields: [{ field: "file", code: "required" }] });

    let stored: StoredFile;
    try {
      stored = await storeUpload(mp.file.buffer, mp.file.filename, CV_FILES);
    } catch (e) {
      if (e instanceof FileRejected) return reply.code(422).send({ ok: false, error: "file_rejected", reason: e.message });
      throw e;
    }

    try {
      const id = await tx(async (c) => {
        const { rows } = await c.query(
          `INSERT INTO leads(kind, name, phone, email, locale, data, source, ip_hash)
           VALUES ('application', $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [d.name, d.phone, d.email, d.locale, JSON.stringify({ vacancy: d.vacancy, portfolio: d.portfolio, comment: d.comment }), JSON.stringify(d.source), hashIp(req.ip)],
        );
        const leadId = rows[0].id as string;
        await c.query(
          `INSERT INTO lead_files(lead_id, original_name, stored_path, mime, size, sha256) VALUES ($1,$2,$3,$4,$5,$6)`,
          [leadId, stored.originalName, stored.storedPath, stored.mime, stored.size, stored.sha256],
        );
        const text = telegramApplication(d, adminLink(leadId));
        await enqueue(c, [
          { channel: "telegram", payload: { chat: config.TELEGRAM_HR_CHAT_ID ? "hr" : "sales", text, file: { storedPath: stored.storedPath, originalName: stored.originalName, mime: stored.mime } } },
          ...(config.TEAM_EMAIL_HR ? [{ channel: "email" as const, payload: { to: config.TEAM_EMAIL_HR, subject: `Ariza: ${d.vacancy} — ${d.name}`, text, replyTo: d.email } }] : []),
          { channel: "email", payload: { to: d.email, ...autoReply("application", d.locale, d.name) } },
        ]);
        return leadId;
      });
      void processOutbox(req.log);
      return reply.code(201).send({ ok: true, id });
    } catch (e) {
      await deleteStored(stored.storedPath).catch(() => undefined);
      throw e;
    }
  });

  // --- Blog obunasi (2-bosqich; hozir bazaga yoziladi) ---
  app.post("/subscribe", { config: { rateLimit: FORM_LIMIT } }, async (req, reply) => {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(422).send({ ok: false, error: "validation", fields: fieldErrors(parsed.error) });
    const d = parsed.data;
    if (!(await guard(req, reply, d))) return reply;
    await tx((c) =>
      c.query(`INSERT INTO leads(kind, email, locale, ip_hash) VALUES ('subscribe', $1, $2, $3)`, [d.email, d.locale, hashIp(req.ip)]),
    );
    return reply.code(201).send({ ok: true });
  });
}
