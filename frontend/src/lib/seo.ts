import type { Metadata } from "next";
import { HTML_LANG, LOCALES, type Locale } from "./i18n";
import { alternates, href, type PageKey } from "./routes";
import { SITE } from "@/content/site";

const OG_LOCALE: Record<Locale, string> = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" };

/** title ≤ 60, description ≤ 160, canonical, hreflang (uz, ru, en, x-default), OG/Twitter (TZ 8.7). */
export function pageMeta(opts: { locale: Locale; key: PageKey; itemId?: string; title: string; description: string; noindex?: boolean }): Metadata {
  const { locale, key, itemId } = opts;
  const alt = alternates(key, itemId);
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HTML_LANG[l]] = alt[l];
  languages["x-default"] = alt.en;
  // Uzun sarlavhada avval brend qo'shimchasi olib tashlanadi, shunda "— SIF…" bo'lib kesilmaydi
  const bare = opts.title.replace(/\s+[—|]\s+SIFATDEV$/, "");
  const title = opts.title.length <= 60 ? opts.title : bare.length <= 60 ? bare : bare.slice(0, 59).trimEnd() + "…";
  const description = opts.description.length > 160 ? opts.description.slice(0, 157) + "…" : opts.description;
  return {
    metadataBase: new URL(SITE.url),
    title,
    description,
    alternates: { canonical: href(locale, key, itemId), languages },
    openGraph: {
      type: "website",
      siteName: "SIFATDEV",
      title,
      description,
      url: href(locale, key, itemId),
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: opts.noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
