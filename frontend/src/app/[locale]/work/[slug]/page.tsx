import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n";
import { href, idBySlug } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { INDUSTRY_LABELS, caseById, sortedCases } from "@/content/cases";
import { serviceById } from "@/content/services";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import DeviceMock from "@/components/sections/DeviceMock";
import CaseGallery from "@/components/sections/CaseGallery";
import { JsonLd, Words } from "@/components/ui/basics";
import NextSteps from "@/components/sections/NextSteps";
import { Magnetic, Tilt } from "@/components/ui/interactive";

type Props = { params: Promise<{ locale: string; slug: string }> };

function load(locale: string, slug: string) {
  if (!isLocale(locale)) return null;
  const id = idBySlug("work", locale, decodeURIComponent(slug));
  const c = id ? caseById(id) : undefined;
  return c ? { locale: locale as Locale, c } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = load(locale, slug);
  if (!r) return {};
  return pageMeta({ locale: r.locale, key: "work", itemId: r.c.id, title: `${r.c.title[r.locale]} — SIFATDEV`, description: r.c.summary[r.locale] + " " + r.c.problem[r.locale] });
}

export default async function CasePage({ params }: Props) {
  const { locale: l, slug } = await params;
  const r = load(l, slug);
  if (!r) notFound();
  const { locale, c } = r;
  const ui = UI[locale];
  const all = sortedCases();
  const next = all[(all.findIndex((x) => x.id === c.id) + 1) % all.length]!;

  const facts: [string, string][] = [
    [ui.work.client, c.clientHidden ? `${c.client[locale]} · ${ui.work.hidden}` : c.client[locale]],
    [ui.work.industry, INDUSTRY_LABELS[c.industry][locale]],
    ...(c.duration ? ([[ui.work.duration, c.duration[locale]]] as [string, string][]) : []),
    ...(c.team ? ([[ui.work.team, c.team[locale]]] as [string, string][]) : []),
    [ui.work.servicesL, c.services.map((s) => serviceById(s)?.title[locale]).filter(Boolean).join(", ")],
    [ui.work.year, String(c.year)],
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: c.title[locale],
          abstract: c.summary[locale],
          dateCreated: String(c.year),
          creator: { "@type": "Organization", name: "SIFATDEV", url: SITE.url },
          ...(c.tech.length ? { keywords: c.tech.join(", ") } : {}),
          ...(c.shots?.[0] ? { image: `${SITE.url}${c.shots[0].src}` } : {}),
          ...(c.url ? { sameAs: c.url } : {}),
          url: `${SITE.url}${href(locale, "work", c.id)}`,
        }}
      />
      <section data-shape="sphere" data-x="0.5" data-scale="0.6" data-opacity="0" data-depth="0.5" className="pb-10 pt-[calc(var(--header-h)+48px)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.work.title, href: href(locale, "work") }, { name: c.title[locale], href: href(locale, "work", c.id) }]} />
          <p className="t-label mb-5">{INDUSTRY_LABELS[c.industry][locale]} · {c.year}</p>
          <Words text={c.title[locale]} className="t-display max-w-4xl" />
          <p className="t-lead hero-in mt-6 max-w-2xl">{c.summary[locale]}</p>
          {c.url && (
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary hero-in mt-8">
              {ui.work.visit} <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
          <div className="reveal mt-14 grid place-items-center rounded-[var(--radius-block)] border border-line py-12" style={{ background: `radial-gradient(70% 80% at 50% 10%, rgb(227 38 47 / .18), transparent 70%)`, perspective: "1200px" }}>
            <div className="w-full max-w-3xl">
              <DeviceMock device={c.device} hue={c.hue} image={c.shots?.[0]?.src} alt={c.title[locale]} priority />
            </div>
          </div>
        </div>
      </section>

      <section className="section !pt-6">
        <div className="container-x grid gap-14 lg:grid-cols-[360px_1fr]">
          <dl className="card h-fit divide-y divide-line lg:sticky lg:top-28">
            {facts.map(([k, v]) => (
              <div key={k} className="grid gap-1 p-5">
                <dt className="t-label">{k}</dt>
                <dd className="text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-14">
            <div>
              <h2 className="t-h3 reveal mb-4">{ui.work.problem}</h2>
              <p className="reveal text-fg-2">{c.problem[locale]}</p>
            </div>
            <div>
              <h2 className="t-h3 reveal mb-4">{ui.work.solution}</h2>
              <p className="reveal text-fg-2">{c.solution[locale]}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {c.features.map((f, i) => (
                  <li key={i} className="card reveal flex gap-3 p-4 text-[15px]" style={{ ["--i" as string]: i }}>
                    <Check size={18} className="mt-0.5 flex-none text-hi" aria-hidden="true" />
                    {f[locale]}
                  </li>
                ))}
              </ul>
            </div>
            {c.results.length > 0 && (
            <div>
              <h2 className="t-h3 reveal mb-4">{ui.work.results}</h2>
              <ul className="grid gap-3">
                {c.results.map((x, i) => (
                  <li key={i} className="reveal border-l-2 border-accent pl-4 text-lg">{x[locale]}</li>
                ))}
              </ul>
            </div>
            )}
            {c.tech.length > 0 && (
            <div>
              <h2 className="t-h3 reveal mb-4">{ui.work.tech}</h2>
              <ul className="flex flex-wrap gap-2">{c.tech.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
            </div>
            )}
            <div>
              <h2 className="t-h3 reveal mb-6">{ui.work.gallery}</h2>
              {c.shots ? (
                <CaseGallery shots={c.shots} title={c.title[locale]} labels={{ zoom: ui.work.zoom, prev: ui.work.prev, next: ui.work.next, close: ui.close }} />
              ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 40, 80, 120].map((d, i) => (
                  <Tilt key={i} className="reveal rounded-[var(--radius-card)]">
                    <div className="card grid aspect-[4/3] place-items-center" style={{ perspective: "900px" }}>
                      <DeviceMock device={i % 2 ? "phone" : "laptop"} hue={(c.hue + d) % 360} />
                    </div>
                  </Tilt>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section data-shape="ring" data-x="0" data-y="0.2" data-scale="1" data-opacity="0" data-push="1.6" className="section">
        <div className="container-x grid gap-6 md:grid-cols-2">
          <Link href={href(locale, "contact", undefined, { case: c.title[locale].slice(0, 120) })} className="card group flex flex-col justify-between gap-10 p-8 md:p-10">
            <p className="t-h3">{ui.cta.similar}</p>
            <Magnetic>
              <span className="btn btn-primary">{ui.cta.discuss} <ArrowRight size={18} aria-hidden="true" /></span>
            </Magnetic>
          </Link>
          <Link href={href(locale, "work", next.id)} className="card group flex flex-col justify-between gap-10 p-8 md:p-10">
            <span className="t-label">{ui.cta.next}</span>
            <span className="t-h3 flex items-center justify-between gap-4">
              {next.title[locale]} <ArrowRight className="flex-none transition group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </section>
      <NextSteps locale={locale} from="case" />
    </>
  );
}
