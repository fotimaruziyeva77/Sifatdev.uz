import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { ABOUT } from "@/content/company";
import { getContent } from "@/lib/content-server";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Words } from "@/components/ui/basics";
import { Counter, Tilt } from "@/components/ui/interactive";
import NextSteps from "@/components/sections/NextSteps";
import MapEmbed from "@/components/sections/MapEmbed";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta({ locale, key: "about", title: `${UI[locale].about.title} — SIFATDEV`, description: ABOUT.mission[locale] });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ui = UI[locale];
  const { stats } = await getContent();
  return (
    <>
      <section data-shape="logo" data-x="0.5" data-scale="0.6" className="flex min-h-[80svh] items-center pb-12 pt-[calc(var(--header-h)+48px)] max-md:pt-[calc(var(--header-h)+24svh)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.about.title, href: href(locale, "about") }]} />
          <p className="t-label mb-5">{ui.about.mission}</p>
          <Words text={ABOUT.mission[locale]} className="t-h2 max-w-3xl" />
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-x">
          <h2 className="t-h3 reveal mb-8">{ui.about.values}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ABOUT.values.map((v, i) => (
              <div key={i} className="card reveal p-7" style={{ ["--i" as string]: i }}>
                <p className="font-display text-xl font-semibold">{v.title[locale]}</p>
                <p className="mt-3 text-fg-2">{v.text[locale]}</p>
              </div>
            ))}
          </div>
          <dl className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="reveal">
                <dt className="sr-only">{s.label[locale]}</dt>
                <dd>
                  <span className="block font-display text-5xl font-bold"><Counter value={s.value} suffix={s.suffix} locale={locale} /></span>
                  <span className="mt-2 block text-[15px] text-fg-2" aria-hidden="true">{s.label[locale]}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section !pt-0">
        <div className="container-x">
          <h2 className="t-h3 reveal mb-10">{ui.about.history}</h2>
          <ol className="relative grid gap-10 border-l border-line pl-8 md:grid-cols-4 md:gap-6 md:border-l-0 md:border-t md:pl-0 md:pt-8">
            {ABOUT.history.map((h, i) => (
              <li key={h.year} className="reveal relative" style={{ ["--i" as string]: i }}>
                <span className="absolute -left-[37px] top-1.5 h-2.5 w-2.5 rounded-full bg-hi md:-top-[37px] md:left-0" aria-hidden="true" />
                <p className="font-mono text-hi">{h.year}</p>
                <p className="mt-2 text-fg-2">{h.text[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {ABOUT.team.length > 0 && (
        <section className="section !pt-0">
          <div className="container-x">
            <h2 className="t-h3 reveal mb-8">{ui.about.team}</h2>
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {ABOUT.team.map((m) => (
                <li key={m.name}>
                  <Tilt max={5} className="overflow-hidden rounded-[var(--radius-card)]">
                    <img src={m.photo} alt={m.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
                  </Tilt>
                  <p className="mt-3 font-medium">{m.name}</p>
                  <p className="text-[14px] text-muted">{m.role[locale]}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {ABOUT.certificates.length > 0 && (
        <section className="section !pt-0">
          <div className="container-x">
            <h2 className="t-h3 reveal mb-8">{ui.about.certs}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {ABOUT.certificates.map((c) => (
                <li key={c.number} className="card p-5">
                  {c.title[locale]} <span className="font-mono text-muted">№ {c.number}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section !pt-0">
        <div className="container-x grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="t-h3 reveal mb-4">{ui.about.office}</h2>
            <p className="text-fg-2">{SITE.address[locale]}</p>
            <p className="mt-1 text-muted">{SITE.hours[locale]}</p>
          </div>
          <MapEmbed label={ui.contact.mapShow} />
        </div>
      </section>
      <NextSteps locale={locale} from="about" />
    </>
  );
}
