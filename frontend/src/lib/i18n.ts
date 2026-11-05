export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";
export const FALLBACK_LOCALE: Locale = "en"; // hreflang x-default

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export type L = Record<Locale, string>;
export const t = (v: L, l: Locale) => v[l];

export const HTML_LANG: Record<Locale, string> = { uz: "uz-Latn", ru: "ru", en: "en" };
export const INTL_LOCALE: Record<Locale, string> = { uz: "uz-Latn-UZ", ru: "ru-RU", en: "en-US" };

/** Sana formati tilga mos (TZ 8.1). */
export function formatDate(iso: string, l: Locale): string {
  const d = new Date(iso);
  if (l === "uz") {
    const m = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
    return `${d.getUTCFullYear()}-yil ${d.getUTCDate()}-${m[d.getUTCMonth()]}`;
  }
  return new Intl.DateTimeFormat(INTL_LOCALE[l], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function formatNumber(n: number, l: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[l]).format(n);
}
