import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { JsonLd } from "@/components/ui/basics";

export type Crumb = { name: string; href: string };

/** Breadcrumb + Schema.org BreadcrumbList (TZ 5.8, 8.7). */
export default function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  const all = [{ name: UI[locale].breadcrumbHome, href: href(locale, "home") }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[13px] text-muted">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-2">
              {i < all.length - 1 ? (
                <Link href={c.href} className="hover:text-fg">{c.name}</Link>
              ) : (
                <span aria-current="page" className="text-fg-2">{c.name}</span>
              )}
              {i < all.length - 1 && <span aria-hidden="true">/</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE.url}${c.href}` })),
        }}
      />
    </>
  );
}
