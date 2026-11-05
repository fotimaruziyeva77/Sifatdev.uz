/**
 * Analitika maqsadlari (TZ 8.8). Skriptlar faqat rozilik (yoki EI bo'lmagan hudud) bo'lganda yuklanadi;
 * shungacha hodisalar e'tiborsiz qoldiriladi — hech qanday ma'lumot tashqariga ketmaydi.
 */
type W = Window & { gtag?: (...a: unknown[]) => void; ym?: (...a: unknown[]) => void };

export function track(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as W;
  try {
    w.gtag?.("event", name, params);
    const ymId = process.env.NEXT_PUBLIC_YM_ID;
    if (ymId) w.ym?.(Number(ymId), "reachGoal", name, params);
  } catch {
    /* analitika saytni buzmasligi kerak */
  }
}

/** Joriy sahifa manbasi (TZ 8.2: sahifa, til, UTM, qurilma). */
export function leadSource(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const src: Record<string, string> = { page: location.pathname.slice(0, 300) };
  const w = window.innerWidth;
  src.device = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  let utm: Record<string, string> = {};
  try {
    utm = JSON.parse(sessionStorage.getItem("sifat-utm") ?? "{}");
  } catch {
    /* ignore */
  }
  for (const [k, v] of Object.entries(utm)) if (k.startsWith("utm_") && typeof v === "string") src[k] = v.slice(0, 100);
  if (document.referrer && !document.referrer.startsWith(location.origin)) src.referrer = document.referrer.slice(0, 300);
  return src;
}

export function captureUtm() {
  try {
    const p = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = p.get(k);
      if (v) utm[k] = v.slice(0, 100);
    }
    if (Object.keys(utm).length) sessionStorage.setItem("sifat-utm", JSON.stringify(utm));
  } catch {
    /* ignore */
  }
}
