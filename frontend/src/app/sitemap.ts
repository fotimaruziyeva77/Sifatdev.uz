import type { MetadataRoute } from "next";
import { HTML_LANG, LOCALES } from "@/lib/i18n";
import { alternates, type PageKey } from "@/lib/routes";
import { SITE } from "@/content/site";
import { SERVICES } from "@/content/services";
import { getContent } from "@/lib/content-server";

// Admin qo'shgan sahifalar ham kirishi uchun har so'rovda hisoblanadi
export const dynamic = "force-dynamic";

/** Tillar bo'yicha sitemap.xml, hreflang alternativlari bilan (TZ 8.7). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { cases, vacancies } = await getContent();
  const entries: { key: PageKey; id?: string; priority: number }[] = [
    { key: "home", priority: 1 },
    { key: "services", priority: 0.9 },
    ...SERVICES.map((s) => ({ key: "services" as PageKey, id: s.id, priority: 0.8 })),
    { key: "work", priority: 0.9 },
    ...cases.map((c) => ({ key: "work" as PageKey, id: c.id, priority: 0.7 })),
    { key: "about", priority: 0.6 },
    { key: "careers", priority: 0.6 },
    ...vacancies.filter((v) => v.open).map((v) => ({ key: "careers" as PageKey, id: v.id, priority: 0.5 })),
    { key: "contact", priority: 0.8 },
    { key: "privacy", priority: 0.2 },
  ];
  const now = new Date();
  return entries.flatMap(({ key, id, priority }) => {
    const alt = alternates(key, id);
    const languages = Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], `${SITE.url}${alt[l]}`]));
    return LOCALES.map((l) => ({ url: `${SITE.url}${alt[l]}`, lastModified: now, priority, alternates: { languages } }));
  });
}
