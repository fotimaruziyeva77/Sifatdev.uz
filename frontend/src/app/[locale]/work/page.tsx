import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PortfolioGrid from "@/components/sections/PortfolioGrid";
import NextSteps from "@/components/sections/NextSteps";
import { Words } from "@/components/ui/basics";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ui = UI[locale].work;
  return pageMeta({ locale, key: "work", title: `${ui.title} — SIFATDEV`, description: ui.lead });
}

export default async function WorkPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const initial: Record<string, string | undefined> = {};
  for (const k of ["industry", "service", "tech", "year"]) {
    const v = sp[k];
    initial[k] = typeof v === "string" ? v.slice(0, 300) : undefined;
  }
  const ui = UI[locale];
  return (
    <>
      <section data-shape="sphere" data-x="0.5" data-scale="0.6" data-opacity="0" data-depth="0.4" className="pb-12 pt-[calc(var(--header-h)+48px)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.work.title, href: href(locale, "work") }]} />
          <Words text={ui.work.title} className="t-display" />
          <p className="t-lead hero-in mt-6 max-w-2xl">{ui.work.lead}</p>
        </div>
      </section>
      <section className="section !pt-4">
        <PortfolioGrid locale={locale} initial={initial} />
      </section>
      <NextSteps locale={locale} from="work" />
    </>
  );
}
