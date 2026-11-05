import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n";
import { href, idBySlug } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { serviceById } from "@/content/services";
import { CASES } from "@/content/cases";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { CaseCard } from "@/components/sections/Cards";
import { JsonLd, SERVICE_ICONS, Words } from "@/components/ui/basics";
import NextSteps from "@/components/sections/NextSteps";
import BriefForm from "@/components/forms/BriefForm";

type Props = { params: Promise<{ locale: string; slug: string }> };

function load(locale: string, slug: string) {
  if (!isLocale(locale)) return null;
  const id = idBySlug("services", locale, decodeURIComponent(slug));
  const s = id ? serviceById(id) : undefined;
  return s ? { locale: locale as Locale, s } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = load(locale, slug);
  if (!r) return {};
  return pageMeta({ locale: r.locale, key: "services", itemId: r.s.id, title: `${r.s.title[r.locale]} — SIFATDEV`, description: `${r.s.promise[r.locale]} ${r.s.short[r.locale]}` });
}

export default async function ServicePage({ params }: Props) {
  const { locale: l, slug } = await params;
  const r = load(l, slug);
  if (!r) notFound();
  const { locale, s } = r;
  const ui = UI[locale];
  const Icon = SERVICE_ICONS[s.id];
  const related = CASES.filter((c) => c.services.includes(s.id)).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: s.title[locale],
          description: s.short[locale],
          provider: { "@type": "Organization", name: "SIFATDEV", url: SITE.url },
          areaServed: ["UZ", "Worldwide"],
          url: `${SITE.url}${href(locale, "services", s.id)}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: s.faq.map((f) => ({ "@type": "Question", name: f.q[locale], acceptedAnswer: { "@type": "Answer", text: f.a[locale] } })),
        }}
      />

      {/* Hero: xizmatning 3D belgisi kursorga qarab buriladi */}
      <section data-shape={s.shape} data-x="0.55" data-scale="0.85" className="flex min-h-[80svh] items-center pb-12 pt-[calc(var(--header-h)+48px)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.services.title, href: href(locale, "services") }, { name: s.title[locale], href: href(locale, "services", s.id) }]} />
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-elevated text-accent-soft">
            <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <Words text={s.title[locale]} className="t-display mt-8 max-w-3xl" />
          <p className="t-lead hero-in mt-6 max-w-2xl">{s.promise[locale]}</p>
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-x grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="t-h3 reveal mb-6">{ui.services.problems}</h2>
            <ul className="grid gap-3">
              {s.problems.map((p, i) => (
                <li key={i} className="card reveal flex gap-4 p-5 text-fg-2" style={{ ["--i" as string]: i }}>
                  <span className="font-mono text-hi">0{i + 1}</span>
                  {p[locale]}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="t-h3 reveal mb-6">{ui.services.includes}</h2>
            <ul className="grid gap-3">
              {s.includes.map((p, i) => (
                <li key={i} className="reveal flex gap-3 text-fg-2" style={{ ["--i" as string]: i }}>
                  <Check size={20} className="mt-1 flex-none text-hi" aria-hidden="true" />
                  {p[locale]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-x">
          <h2 className="t-h3 reveal mb-6">{ui.services.process}</h2>
          <ol className="grid gap-4 md:grid-cols-4">
            {s.process.map((p, i) => (
              <li key={i} className="card reveal p-6" style={{ ["--i" as string]: i }}>
                <span className="font-mono text-[13px] text-muted">0{i + 1}</span>
                <p className="mt-3 font-display text-[17px] font-semibold">{p.name[locale]}</p>
                <p className="mt-2 font-mono text-[14px] text-hi">{p.duration[locale]}</p>
              </li>
            ))}
          </ol>
          <h2 className="t-h3 reveal mb-5 mt-16">{ui.services.tech}</h2>
          <ul className="flex flex-wrap gap-2">
            {s.tech.map((t) => <li key={t} className="chip">{t}</li>)}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section !pt-0">
          <div className="container-x">
            <h2 className="t-h3 reveal mb-8">{ui.services.cases}</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((c, i) => <CaseCard key={c.id} c={c} locale={locale} i={i} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section !pt-0">
        <div className="container-x max-w-4xl">
          <h2 className="t-h3 reveal mb-6">{ui.services.faq}</h2>
          <div className="grid gap-3">
            {s.faq.map((f, i) => (
              <details key={i} className="card group reveal p-0 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[var(--radius-card)] p-6 font-medium">
                  {f.q[locale]}
                  <ChevronDown size={20} className="flex-none transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-6 pb-6 text-fg-2">{f.a[locale]}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section data-shape="ring" data-x="0.55" data-scale="0.8" className="section !pt-0" id="brief">
        <div className="container-x max-w-4xl">
          <h2 className="t-h2 reveal mb-8">{ui.services.cta}</h2>
          <div className="card p-6 md:p-10">
            <BriefForm locale={locale} preService={s.id} />
          </div>
        </div>
      </section>
      <NextSteps locale={locale} from="service" />
    </>
  );
}
