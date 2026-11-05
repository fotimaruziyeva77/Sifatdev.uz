import { NextResponse, type NextRequest } from "next/server";
import { FALLBACK_LOCALE, isLocale, type Locale } from "@/lib/i18n";
import { SEGMENTS, internalSegment } from "@/lib/routes";

const LOCALE_COOKIE = "NEXT_LOCALE";
/** Ichki rewrite belgisi: rewrite qilingan so'rov proxy'dan qayta o'tganda kanonik 301 sikliga tushmasligi uchun. */
const REWRITE_MARK = "x-sifat-rewritten";
const isDev = process.env.NODE_ENV === "development";

function detectLocale(req: NextRequest): Locale {
  const c = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  const al = req.headers.get("accept-language") ?? "";
  for (const part of al.split(",")) {
    const code = part.split(";")[0]?.trim().toLowerCase().slice(0, 2);
    if (isLocale(code)) return code;
  }
  return FALLBACK_LOCALE; // mos til topilmasa — /en (TZ 4)
}

function buildCsp(nonce: string): string {
  const analytics = Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_YM_ID);
  const ga = process.env.NEXT_PUBLIC_GA_ID
    ? " https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com"
    : "";
  const ym = process.env.NEXT_PUBLIC_YM_ID ? " https://mc.yandex.ru https://mc.yandex.com wss://mc.yandex.com" : "";
  const ts = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? " https://challenges.cloudflare.com" : "";
  return [
    "default-src 'self'",
    // 'strict-dynamic': faqat nonce'li skriptlar va ular yuklagan skriptlar ishlaydi.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React SSR style atributlari uchun; skriptlardan farqli o'laroq XSS xavfi past.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data:${analytics ? ga + ym : ""}`,
    "font-src 'self'",
    `connect-src 'self'${ga}${ym}${ts}${isDev ? " ws:" : ""}`,
    `frame-src https://www.openstreetmap.org${ts}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...((process.env.NEXT_PUBLIC_SITE_URL ?? "https://").startsWith("https://") && !isDev ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function withCsp(req: NextRequest, make: (headers: Headers) => NextResponse): NextResponse {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCharCode(...bytes));
  const csp = buildCsp(nonce);
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("Content-Security-Policy", csp);
  const res = make(reqHeaders);
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Admin panel: til prefiksi yo'q, faqat CSP.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return withCsp(req, (headers) => NextResponse.next({ request: { headers } }));
  }

  const parts = pathname.split("/");
  const loc = parts[1];

  // "/" yoki tilsiz manzil → aniqlangan tilga yo'naltirish.
  if (!isLocale(loc)) {
    const l = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${l}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const seg = parts[2];
  if (seg) {
    const key = internalSegment(loc, seg);
    if (key && key !== "home") {
      // Lokalizatsiya qilingan segment → ichki marshrut.
      if (seg !== key) {
        const url = req.nextUrl.clone();
        url.pathname = ["", loc, key, ...parts.slice(3)].join("/");
        return withCsp(req, (headers) => {
          headers.set(REWRITE_MARK, "1");
          return setLocaleCookie(NextResponse.rewrite(url, { request: { headers } }), loc);
        });
      }
    } else if (req.headers.get(REWRITE_MARK) !== "1") {
      // Ichki nom boshqa tilda ishlatilgan bo'lsa (masalan /uz/services) → kanonik manzilga 301.
      const asInternal = (Object.keys(SEGMENTS) as (keyof typeof SEGMENTS)[]).find((k) => k === seg);
      if (asInternal && SEGMENTS[asInternal][loc] !== seg) {
        const url = req.nextUrl.clone();
        url.pathname = ["", loc, SEGMENTS[asInternal][loc], ...parts.slice(3)].join("/");
        url.search = search;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  return withCsp(req, (headers) => setLocaleCookie(NextResponse.next({ request: { headers } }), loc));
}

function setLocaleCookie(res: NextResponse, l: Locale): NextResponse {
  res.cookies.set(LOCALE_COOKIE, l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: !isDev });
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|fonts|images|.*\\.[a-z0-9]{2,12}$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
