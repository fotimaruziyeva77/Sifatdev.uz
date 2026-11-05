import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./config.js";
import { pool } from "./db/pool.js";
import { publicRoutes } from "./routes/public.js";
import { adminRoutes } from "./routes/admin.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    trustProxy: config.TRUST_PROXY,
    bodyLimit: 64 * 1024,
    disableRequestLogging: false,
    requestIdHeader: false,
    logger: {
      level: config.isProd ? "info" : "debug",
      // Shaxsiy ma'lumot va maxfiy qiymatlar logga yozilmaydi.
      redact: {
        paths: ["req.headers.cookie", "req.headers.authorization", 'req.headers["x-csrf-token"]', "res.headers['set-cookie']"],
        censor: "[redacted]",
      },
      serializers: {
        req: (r) => ({ method: r.method, url: r.url.split("?")[0], id: r.id }),
      },
    },
  });

  // API faqat JSON qaytaradi — qat'iy sarlavhalar.
  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: "same-origin" },
    hsts: config.isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });

  await app.register(cors, {
    origin: (origin, cb) => cb(null, !origin || config.allowedOrigins.includes(origin)),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["content-type", "x-csrf-token"],
    maxAge: 600,
  });

  await app.register(cookie);
  await app.register(multipart, { attachFieldsToBody: false, limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, ctx) => ({ statusCode: 429, ok: false, error: "rate_limited", retryAfter: ctx.after }),
  });

  // CSRF qo'shimcha qatlami: o'zgartiruvchi so'rovlarda Origin ruxsat etilgan bo'lishi shart.
  app.addHook("onRequest", async (req, reply) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
    const origin = req.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) return reply.code(403).send({ ok: false, error: "bad_origin" });
    if (!origin && config.isProd) return reply.code(403).send({ ok: false, error: "origin_required" });
  });

  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", reply.getHeader("cache-control") ?? "no-store");
  });

  app.setErrorHandler((err: { statusCode?: number; code?: string; message?: string }, req, reply) => {
    if (err.code === "FST_REQ_FILE_TOO_LARGE" || err.code === "FST_FILES_LIMIT") return reply.code(413).send({ ok: false, error: "file_too_large" });
    // Mijoz yuklashni o'rtada uzib qo'ydi — server xatosi emas.
    if (err.code === "ERR_STREAM_PREMATURE_CLOSE") return reply.code(400).send({ ok: false, error: "aborted" });
    const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
    if (status === 429) return reply.code(429).send({ ok: false, error: "rate_limited" });
    if (status >= 500) req.log.error({ err }, "server xatosi");
    // Ichki xato tafsilotlari mijozga ko'rsatilmaydi.
    return reply.code(status).send({ ok: false, error: status >= 500 ? "internal" : err.code ?? "bad_request" });
  });

  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ ok: false, error: "not_found" }));

  app.get("/api/health", async () => {
    await pool.query("SELECT 1");
    return { ok: true };
  });

  await app.register(publicRoutes, { prefix: "/api/v1" });
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });

  return app;
}
