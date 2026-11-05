import { LOCALES, isLocale, type L, type Locale } from "./i18n";
import { CASE_SLUGS, POST_SLUGS, SERVICE_SLUGS, VACANCY_SLUGS } from "@/content/slugs";

export type PageKey = "home" | "services" | "work" | "about" | "careers" | "contact" | "blog" | "privacy";

/** Ichki marshrut nomi (app/[locale]/<internal>) va har tildagi URL segmenti. */
export const SEGMENTS: Record<Exclude<PageKey, "home">, L> = {
  services: { uz: "xizmatlar", ru: "uslugi", en: "services" },
  work: { uz: "portfolio", ru: "portfolio", en: "work" },
  about: { uz: "kompaniya", ru: "o-kompanii", en: "about" },
  careers: { uz: "karyera", ru: "karera", en: "careers" },
  contact: { uz: "aloqa", ru: "kontakty", en: "contact" },
  blog: { uz: "blog", ru: "blog", en: "blog" },
  privacy: { uz: "maxfiylik", ru: "konfidencialnost", en: "privacy" },
};

const DETAIL_SLUGS: Partial<Record<PageKey, Record<string, L>>> = {
  services: SERVICE_SLUGS,
  work: CASE_SLUGS,
  careers: VACANCY_SLUGS,
  blog: POST_SLUGS,
};

export function href(l: Locale, key: PageKey, itemId?: string, query?: Record<string, string>): string {
  let p = key === "home" ? `/${l}` : `/${l}/${SEGMENTS[key][l]}`;
  if (itemId) {
    const slug = DETAIL_SLUGS[key]?.[itemId]?.[l];
    if (slug) p += `/${slug}`;
  }
  if (query && Object.keys(query).length) p += `?${new URLSearchParams(query).toString()}`;
  return p;
}

/** Lokalizatsiya qilingan segmentni ichki nomga aylantirish (proxy rewrite uchun). */
export function internalSegment(l: Locale, seg: string): PageKey | null {
  for (const [key, v] of Object.entries(SEGMENTS)) if (v[l] === seg) return key as PageKey;
  return null;
}

export function idBySlug(key: PageKey, l: Locale, slug: string): string | null {
  const table = DETAIL_SLUGS[key];
  if (!table) return null;
  for (const [id, v] of Object.entries(table)) if (v[l] === slug) return id;
  return null;
}

/** Joriy sahifaning boshqa tildagi manzili (til almashtirgich bosh sahifaga qaytarmaydi — TZ 8.1). */
export function switchLocalePath(pathname: string, to: Locale): string {
  const [, loc, seg, slug] = pathname.split("/");
  if (!isLocale(loc)) return `/${to}`;
  if (!seg) return `/${to}`;
  const key = internalSegment(loc, seg);
  if (!key) return `/${to}`;
  if (!slug) return href(to, key);
  const id = idBySlug(key, loc, decodeURIComponent(slug));
  return id ? href(to, key, id) : href(to, key);
}

/** hreflang uchun barcha tillardagi manzillar. */
export function alternates(key: PageKey, itemId?: string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, href(l, key, itemId)])) as Record<Locale, string>;
}
