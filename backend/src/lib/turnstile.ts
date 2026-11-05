import { config } from "../config.js";

/**
 * Cloudflare Turnstile tokenini serverda tekshirish.
 * Development'da kalit bo'lmasa — o'tkazib yuboriladi (production'da config majburlaydi).
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!config.TURNSTILE_SECRET) return !config.isProd;
  if (!token || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret: config.TURNSTILE_SECRET, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
