import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { CULTURE, HIRING } from "@/content/company";
import { getContent } from "@/lib/content-server";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Words } from "@/components/ui/basics";
import ApplicationForm from "@/components/forms/ApplicationForm";
import NextSteps from "@/components/sections/NextSteps";
import VacancyFilter from "@/components/sections/VacancyFilter";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ui = UI[locale].careers;
  return pageMeta({ locale, key: "careers", title: `${ui.title} — SIFATDEV`, description: ui.lead });
}

export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ui = UI[locale];
  const { vacancies } = await getContent();
  const open = vacancies.filter((v) => v.open);
  return (
    <>
      <section data-shape="neural" data-x="0.55" data-scale="0.8" className="flex min-h-[70svh] items-center pb-12 pt-[calc(var(--header-h)+48px)] max-md:pt-[calc(var(--header-h)+24svh)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.careers.title, href: href(locale, "careers") }]} />
          <Words text={ui.careers.title} className="t-display" />
          <p className="t-lead hero-in mt-6 max-w-2xl">{ui.careers.lead}</p>
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-x">
          <h2 className="t-h3 reveal mb-8">{ui.careers.culture}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {CULTURE.map((c, i) => (
              <div key={i} className="card reveal p-7" style={{ ["--i" as string]: i }}>
                <p className="font-display text-lg font-semibold">{c.title[locale]}</p>
                <p className="mt-3 text-fg-2">{c.text[locale]}</p>
              </div>
            ))}
          </div>
          <h2 className="t-h3 reveal mb-8 mt-16">{ui.careers.hiring}</h2>
          <ol className="grid gap-3 md:grid-cols-5">
            {HIRING.map((h, i) => (
              <li key={i} className="reveal flex items-center gap-3 rounded-full border border-line px-5 py-3 text-[15px]" style={{ ["--i" as string]: i }}>
                <span className="font-mono text-hi">{i + 1}</span> {h[locale]}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section !pt-0" id="vacancies">
        <div className="container-x">
          <h2 className="t-h2 reveal mb-8">{ui.careers.open}</h2>
          {open.length > 0 ? (
            <VacancyFilter
              locale={locale}
              items={open.map((v) => ({ id: v.id, direction: v.direction, href: href(locale, "careers", v.id), title: v.title[locale], level: v.level[locale], type: ui.careers[v.type] }))}
            />
          ) : (
            <p className="text-fg-2">{ui.careers.none}</p>
          )}
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-x max-w-4xl">
          <h2 className="t-h3 reveal mb-6">{ui.careers.resume}</h2>
          <div className="card p-6 md:p-10">
            <ApplicationForm locale={locale} />
          </div>
          <p className="mt-6 text-center">
            <Link href={href(locale, "work")} className="inline-flex items-center gap-1 text-accent-soft">{ui.nav.work} <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </p>
        </div>
      </section>
      <NextSteps locale={locale} from="careers" />
    </>
  );
}
