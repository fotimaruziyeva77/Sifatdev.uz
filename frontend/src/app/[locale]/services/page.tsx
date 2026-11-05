import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SERVICES } from "@/content/services";
import { getContent } from "@/lib/content-server";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { ServiceCard } from "@/components/sections/Cards";
import NextSteps from "@/components/sections/NextSteps";
import { ButtonLink, Words } from "@/components/ui/basics";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ui = UI[locale].services;
  return pageMeta({ locale, key: "services", title: `${ui.title} — SIFATDEV`, description: ui.lead });
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ui = UI[locale];
  const { cases } = await getContent();
  return (
    <>
      <section data-shape="sphere" data-x="0.6" data-scale="0.75" className="pb-12 pt-[calc(var(--header-h)+48px)] max-md:pt-[calc(var(--header-h)+24svh)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.services.title, href: href(locale, "services") }]} />
          <Words text={ui.services.title} className="t-display max-w-3xl" />
          <p className="t-lead hero-in mt-6 max-w-2xl">{ui.services.lead}</p>
        </div>
      </section>
      <section className="section !pt-8">
        <div className="container-x grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.id} s={s} locale={locale} i={i} count={cases.filter((c) => c.services.includes(s.id)).length} />
          ))}
        </div>
        <div className="container-x mt-16 flex justify-center">
          <ButtonLink href={href(locale, "contact")} size="lg">{ui.cta.discuss}</ButtonLink>
        </div>
      </section>
      <NextSteps locale={locale} from="services" />
    </>
  );
}
