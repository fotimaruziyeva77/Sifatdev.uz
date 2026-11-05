import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { isLocale, formatDate, type Locale } from "@/lib/i18n";
import { href, idBySlug } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { getContent } from "@/lib/content-server";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { JsonLd, Words } from "@/components/ui/basics";
import NextSteps from "@/components/sections/NextSteps";
import ApplicationForm from "@/components/forms/ApplicationForm";

type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(locale: string, slug: string) {
  if (!isLocale(locale)) return null;
  const id = idBySlug("careers", locale, decodeURIComponent(slug));
  const { vacancies } = await getContent();
  const v = id ? vacancies.find((x) => x.id === id) : undefined;
  return v ? { locale: locale as Locale, v, vacancies } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = await load(locale, slug);
  if (!r) return {};
  return pageMeta({ locale: r.locale, key: "careers", itemId: r.v.id, title: `${r.v.title[r.locale]} — SIFATDEV`, description: r.v.intro[r.locale] });
}

export default async function VacancyPage({ params }: Props) {
  const { locale: l, slug } = await params;
  const r = await load(l, slug);
  if (!r) notFound();
  const { locale, v, vacancies } = r;
  const ui = UI[locale];
  const similar = vacancies.filter((x) => x.id !== v.id && x.open).slice(0, 3);
  const block = (title: string, items: typeof v.tasks) => (
    <div>
      <h2 className="t-h3 reveal mb-5">{title}</h2>
      <ul className="grid gap-3">
        {items.map((t, i) => (
          <li key={i} className="reveal flex gap-3 text-fg-2" style={{ ["--i" as string]: i }}>
            <Check size={20} className="mt-1 flex-none text-hi" aria-hidden="true" /> {t[locale]}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      {v.open && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: v.title[locale],
            description: [v.intro[locale], ...v.tasks.map((t) => t[locale]), ...v.requirements.map((t) => t[locale])].join(" "),
            datePosted: v.posted,
            employmentType: "FULL_TIME",
            hiringOrganization: { "@type": "Organization", name: "SIFATDEV", sameAs: SITE.url },
            jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: "Navoi", addressCountry: "UZ" } },
            ...(v.type === "remote" ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "Uzbekistan" } } : {}),
          }}
        />
      )}
      <section data-shape="neural" data-x="0.6" data-scale="0.7" className="pb-10 pt-[calc(var(--header-h)+48px)] max-md:pt-[calc(var(--header-h)+24svh)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.careers.title, href: href(locale, "careers") }, { name: v.title[locale], href: href(locale, "careers", v.id) }]} />
          <p className="t-label mb-5">{v.level[locale]} · {ui.careers[v.type]} · {formatDate(v.posted, locale)}</p>
          <Words text={v.title[locale]} className="t-display max-w-4xl" />
          {/* Yopilgan vakansiya 404 bermaydi (TZ 8.4) */}
          {!v.open && <p className="chip mt-6 !border-warning !text-warning">{ui.careers.closed}</p>}
          <p className="t-lead hero-in mt-6 max-w-2xl">{v.intro[locale]}</p>
        </div>
      </section>
      <section className="section !pt-6">
        <div className="container-x grid gap-14 md:grid-cols-3">
          {block(ui.careers.tasks, v.tasks)}
          {block(ui.careers.requirements, v.requirements)}
          {block(ui.careers.conditions, v.conditions)}
        </div>
      </section>
      <section className="section !pt-0">
        <div className="container-x max-w-4xl">
          {v.open ? (
            <>
              <h2 className="t-h2 reveal mb-8">{ui.cta.apply}</h2>
              <div className="card p-6 md:p-10">
                <ApplicationForm locale={locale} vacancy={v.id} />
              </div>
            </>
          ) : (
            similar.length > 0 && (
              <>
                <h2 className="t-h3 mb-6">{ui.careers.similar}</h2>
                <ul className="grid gap-3">
                  {similar.map((x) => (
                    <li key={x.id}><Link href={href(locale, "careers", x.id)} className="card block p-5 hover:border-accent-soft">{x.title[locale]}</Link></li>
                  ))}
                </ul>
              </>
            )
          )}
        </div>
      </section>
      <NextSteps locale={locale} from="vacancy" />
    </>
  );
}
