import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { PRIVACY } from "@/content/privacy";
import NextSteps from "@/components/sections/NextSteps";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta({ locale, key: "privacy", title: `${UI[locale].footer.privacy} — SIFATDEV`, description: PRIVACY[locale].sections[0]!.p[0]! });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const p = PRIVACY[locale];
  return (
    <>
    <section data-shape="shield" data-x="0.6" data-scale="0.6" data-opacity="0.5" className="pb-24 pt-[calc(var(--header-h)+48px)]">
      <div className="container-x max-w-3xl">
        <Breadcrumbs locale={locale} items={[{ name: UI[locale].footer.privacy, href: href(locale, "privacy") }]} />
        <h1 className="t-h2">{UI[locale].footer.privacy}</h1>
        <p className="mt-3 font-mono text-[13px] text-muted">{formatDate(p.updated, locale)}</p>
        <div className="prose-site mt-10">
          {p.sections.map((s) => (
            <div key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((t, i) => <p key={i}>{t}</p>)}
            </div>
          ))}
        </div>
      </div>
    </section>
    <NextSteps locale={locale} from="other" />
    </>
  );
}
