import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

const encKey = Buffer.from(config.DATA_ENC_KEY, "hex");

/** AES-256-GCM: "v1.iv.tag.ciphertext" (base64url). TOTP sirlari bazada shifrlangan holda saqlanadi. */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decrypt(blob: string): string {
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("bad_ciphertext");
  const d = createDecipheriv("aes-256-gcm", encKey, Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}

/** IP manzil xom holda saqlanmaydi — faqat HMAC (GDPR: ma'lumotlarni minimallashtirish). */
export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHmac("sha256", config.IP_HASH_SECRET).update(ip).digest("hex").slice(0, 32);
}

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
