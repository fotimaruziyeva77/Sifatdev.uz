import { hash, verify } from "@node-rs/argon2";
import * as OTPAuth from "otpauth";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { decrypt, hashIp, randomToken, safeEqual, sha256 } from "../lib/crypto.js";

export type Role = "admin" | "sales" | "hr" | "content";
export type AdminUser = { id: string; email: string; name: string; role: Role };

declare module "fastify" {
  interface FastifyRequest {
    admin?: AdminUser & { sessionId: string; csrf: string };
  }
}

// OWASP tavsiyasi: argon2id, m=19MiB, t=2, p=1
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
export const hashPassword = (p: string) => hash(p, ARGON);

// Foydalanuvchi topilmaganda ham bir xil vaqt sarflash uchun (user enumeration himoyasi).
let dummyHash: string | null = null;
async function getDummy() {
  dummyHash ??= await hashPassword(randomToken(16));
  return dummyHash;
}

export const COOKIE = config.isProd ? "__Host-sid" : "sid";
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export function passwordPolicy(p: string): string | null {
  if (p.length < 12) return "kamida 12 belgi";
  if (p.length > 128) return "ko'pi bilan 128 belgi";
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  if (classes < 3) return "kichik/katta harf, raqam, belgi — kamida 3 turi";
  return null;
}

export function newTotp(email: string) {
  return new OTPAuth.TOTP({ issuer: "SIFATDEV Admin", label: email, algorithm: "SHA1", digits: 6, period: 30, secret: new OTPAuth.Secret({ size: 20 }) });
}

type LoginResult = { ok: true; token: string; csrf: string; user: AdminUser } | { ok: false; reason: "invalid" | "locked" };

export async function login(email: string, password: string, totpCode: string, req: FastifyRequest): Promise<LoginResult> {
  const { rows } = await pool.query(
    `SELECT id, email, name, role, password_hash, totp_secret, totp_last_step, failed_attempts, locked_until, is_active
     FROM admin_users WHERE email = $1`,
    [email.toLowerCase().trim()],
  );
  const u = rows[0];
  if (!u) {
    await verify(await getDummy(), password).catch(() => false);
    return { ok: false, reason: "invalid" };
  }
  if (u.locked_until && new Date(u.locked_until) > new Date()) return { ok: false, reason: "locked" };

  const passOk = u.is_active && (await verify(u.password_hash, password).catch(() => false));
  let step: number | null = null;
  if (passOk && /^\d{6}$/.test(totpCode)) {
    const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(decrypt(u.totp_secret)) });
    const delta = totp.validate({ token: totpCode, window: 1 });
    if (delta !== null) {
      const s = Math.floor(Date.now() / 30_000) + delta;
      // Bir martalik kodni qayta ishlatishdan himoya (replay).
      if (s > Number(u.totp_last_step)) step = s;
    }
  }

  if (!passOk || step === null) {
    const fails = u.failed_attempts + 1;
    const lockNow = fails >= MAX_FAILS;
    await pool.query(
      `UPDATE admin_users SET failed_attempts = $2,
       locked_until = CASE WHEN $3::boolean THEN now() + make_interval(mins => $4) ELSE locked_until END WHERE id = $1`,
      [u.id, lockNow ? 0 : fails, lockNow, LOCK_MINUTES],
    );
    await audit(u.id, "login_failed", null, {}, req);
    return { ok: false, reason: fails >= MAX_FAILS ? "locked" : "invalid" };
  }

  await pool.query(`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, totp_last_step = $2 WHERE id = $1`, [u.id, step]);
  const token = randomToken(32);
  const csrf = randomToken(24);
  await pool.query(
    `INSERT INTO admin_sessions(user_id, token_hash, csrf_token, ip_hash, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + make_interval(hours => $6))`,
    [u.id, sha256(token), csrf, hashIp(req.ip), String(req.headers["user-agent"] ?? "").slice(0, 200), config.SESSION_TTL_HOURS],
  );
  await audit(u.id, "login", null, {}, req);
  return { ok: true, token, csrf, user: { id: u.id, email: u.email, name: u.name, role: u.role } };
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(COOKIE, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "strict",
    path: "/",
    maxAge: config.SESSION_TTL_HOURS * 3600,
  });
}

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies[COOKIE];
  if (token) await pool.query("DELETE FROM admin_sessions WHERE token_hash = $1", [sha256(token)]);
  reply.clearCookie(COOKIE, { path: "/" });
}

/** preHandler: sessiyani tekshiradi, o'zgartiruvchi so'rovlarda CSRF tokenni talab qiladi. */
export function requireAdmin(roles?: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies[COOKIE];
    if (!token || token.length > 100) return reply.code(401).send({ ok: false, error: "unauthorized" });
    const { rows } = await pool.query(
      `SELECT s.id AS session_id, s.csrf_token, u.id, u.email, u.name, u.role
       FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active`,
      [sha256(token)],
    );
    const r = rows[0];
    if (!r) return reply.code(401).send({ ok: false, error: "unauthorized" });
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const sent = String(req.headers["x-csrf-token"] ?? "");
      if (!sent || !safeEqual(sent, r.csrf_token)) return reply.code(403).send({ ok: false, error: "csrf" });
    }
    if (roles && r.role !== "admin" && !roles.includes(r.role)) return reply.code(403).send({ ok: false, error: "forbidden" });
    req.admin = { id: r.id, email: r.email, name: r.name, role: r.role, sessionId: r.session_id, csrf: r.csrf_token };
  };
}

export async function audit(userId: string | null, action: string, target: string | null, meta: Record<string, unknown>, req?: FastifyRequest) {
  await pool.query(`INSERT INTO audit_log(user_id, action, target, meta, ip_hash) VALUES ($1,$2,$3,$4,$5)`, [
    userId,
    action,
    target,
    JSON.stringify(meta),
    req ? hashIp(req.ip) : null,
  ]);
}

/** Rol bo'yicha qaysi so'rov turlarini ko'rish mumkin. */
export function visibleKinds(role: Role): string[] {
  switch (role) {
    case "admin":
      return ["brief", "quick", "application", "subscribe"];
    case "sales":
      return ["brief", "quick", "subscribe"];
    case "hr":
      return ["application"];
    default:
      return [];
  }
}
