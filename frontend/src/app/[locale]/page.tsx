import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { SERVICES } from "@/content/services";
import { getContent } from "@/lib/content-server";
import { PROCESS, TECH, WHY } from "@/content/company";
import { SERVICE_ICONS, Words } from "@/components/ui/basics";
import { Counter, Magnetic } from "@/components/ui/interactive";
import { CaseCard } from "@/components/sections/Cards";
import HorizontalScroll from "@/components/sections/HorizontalScroll";
import TechSphere from "@/components/sections/TechSphere";
import QuickForm from "@/components/forms/QuickForm";

type Props = { params: Promise<{ locale: string }> };

const META: Record<Locale, { t: string; d: string }> = {
  uz: { t: "Sayt, mobil ilova va AI yaratish — Navoiy | SIFATDEV", d: "IT kompaniya SIFATDEV: veb-sayt va portal yaratish, mobil ilova (iOS, Android), AI chatbot va avtomatlashtirish. Davlat va biznes uchun. ☎ +998 99 750 17 17" },
  ru: { t: "Разработка сайтов, приложений и AI — Навои | SIFATDEV", d: "IT-компания SIFATDEV: создание сайтов и порталов, мобильных приложений, AI-ботов и автоматизация для бизнеса и госсектора. ☎ +998 99 750 17 17" },
  en: { t: "Web, Mobile App & AI Development in Uzbekistan | SIFATDEV", d: "SIFATDEV is a software company in Navoi, Uzbekistan: web platforms, iOS/Android apps, AI agents and dedicated teams for government and business worldwide." },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMeta({ locale, key: "home", title: META[locale].t, description: META[locale].d });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ui = UI[locale];
  const { cases, stats } = await getContent();
  const featured = cases.slice(0, 6);
  const h1Words = ui.home.h1.split(" ");

  return (
    <>
      {/* 2. Hero — "Sifat yadrosi" */}
      <section data-shape="logo" data-x="0.6" data-y="0.02" data-scale="0.58" data-my="0.68" data-mscale="0.36" className="relative flex min-h-[100svh] items-center pb-20 pt-[calc(var(--header-h)+48px)] max-md:items-start max-md:pt-[calc(var(--header-h)+15svh)]">
        <div className="container-x">
          <div className="max-w-[760px]">
            <p className="t-label mb-6">{ui.home.eyebrow}</p>
            <Words text={ui.home.h1} className="t-display" highlight={h1Words.flatMap((w, i) => (w.startsWith("AI") ? [i] : []))} />
            <p className="t-lead hero-in mt-7 max-w-[620px]">{ui.home.lead}</p>
            <div className="hero-in mt-10 flex flex-wrap gap-3" style={{ animationDelay: ".25s" }}>
              <Magnetic>
                <Link href={href(locale, "contact")} className="btn btn-primary btn-lg">
                  {ui.cta.discuss} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Magnetic>
              <Link href={href(locale, "work")} className="btn btn-secondary btn-lg">{ui.cta.portfolio}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Ishonch qatori — faqat ruxsat bilan */}
      {SITE.clientLogos.length > 0 && (
        <section aria-label={ui.home.clients} className="marquee-wrap overflow-hidden border-y border-line py-8">
          <div className="marquee">
            {[...SITE.clientLogos, ...SITE.clientLogos].map((l, i) => (
              <img key={i} src={l.src} alt={i < SITE.clientLogos.length ? l.name : ""} className="h-8 w-auto opacity-60 grayscale" loading="lazy" />
            ))}
          </div>
        </section>
      )}

      {/* 4. Xizmatlar — har xizmatga ~100vh, partikullar shaklga morf bo'ladi */}
      <section aria-labelledby="services-h" className="relative">
        <div className="container-x pt-24">
          <p className="t-label reveal mb-4">01 · {ui.home.services}</p>
          <h2 id="services-h" className="t-h2 reveal max-w-2xl">{ui.home.servicesLead}</h2>
        </div>
        {SERVICES.map((s, i) => {
          const Icon = SERVICE_ICONS[s.id];
          return (
            <div key={s.id} data-shape={s.shape} data-x="0.5" data-scale="0.95" data-my="0.44" data-mscale="1" className="flex min-h-[92svh] items-end pb-6 md:min-h-[100vh] md:items-center md:pb-0">
              <div className="container-x">
                <Link href={href(locale, "services", s.id)} className="card reveal group block max-w-[560px] p-8 md:p-10">
                  <span className="t-label">0{i + 1} / 06</span>
                  <span className="mt-6 grid h-12 w-12 place-items-center rounded-xl border border-line bg-elevated text-accent-soft">
                    <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="t-h3 mt-5">{s.title[locale]}</h3>
                  <p className="mt-3 text-fg-2">{s.short[locale]}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-accent-soft">
                    {ui.cta.more} <ArrowUpRight size={18} aria-hidden="true" className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* 5. Raqamlar */}
      <section aria-label={ui.home.stats} className="section">
        <div className="container-x">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-block)] border border-line bg-line md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="reveal bg-base/90 p-8 backdrop-blur" style={{ ["--i" as string]: i }}>
                <dt className="sr-only">{s.label[locale]}</dt>
                <dd>
                  <span className="block font-display text-[clamp(40px,4.5vw,64px)] font-bold leading-none">
                    <Counter value={s.value} suffix={s.suffix} locale={locale} />
                  </span>
                  <span className="mt-3 block text-[15px] text-fg-2" aria-hidden="true">{s.label[locale]}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 6. Tanlangan loyihalar — galaktika, gorizontal scroll */}
      <section data-shape="sphere" data-x="0.5" data-scale="0.6" data-opacity="0" data-depth="0.25" aria-labelledby="work-h" className="relative pt-16">
        <div className="container-x flex flex-wrap items-end justify-between gap-6 pb-10">
          <div className="max-w-2xl">
            <p className="t-label reveal mb-4">02 · {ui.home.work}</p>
            <h2 id="work-h" className="t-h2 reveal">{ui.home.work}</h2>
            <p className="t-lead reveal mt-4">{ui.home.workLead}</p>
          </div>
          <Link href={href(locale, "work")} className="btn btn-secondary reveal">{ui.cta.allCases} ({cases.length})</Link>
        </div>
        <HorizontalScroll>
          {featured.map((c, i) => (
            <div key={c.id} className="w-full max-md:w-[84vw] max-md:flex-none max-md:snap-center lg:w-[min(560px,42vw)] lg:flex-none">
              <CaseCard c={c} locale={locale} i={i} />
            </div>
          ))}
        </HorizontalScroll>
      </section>

      {/* 7. Ish jarayoni — partikullar oqimi 3D yo'l bo'ylab */}
      <section data-shape="helix" data-my="0.62" data-x="0" data-y="0.05" data-scale="0.85" data-opacity="0.75" data-depth="0.2" aria-labelledby="process-h" className="section">
        <div className="container-x">
          <p className="t-label reveal mb-4">03 · {ui.home.process}</p>
          <h2 id="process-h" className="t-h2 reveal mb-14">{ui.home.process}</h2>
          <ol className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {PROCESS.map((p, i) => (
              <li key={i} className="card reveal p-6" style={{ ["--i" as string]: i }}>
                <span className="font-mono text-[13px] text-hi">0{i + 1}</span>
                <h3 className="mt-4 font-display text-[18px] font-semibold leading-snug">{p.title[locale]}</h3>
                <p className="mt-2 text-[14px] text-fg-2">{p.text[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 8. Texnologiyalar — globus va 3D sfera */}
      <section data-shape="globe" data-my="0.5" data-x="0.55" data-scale="1" aria-labelledby="tech-h" className="section">
        <div className="container-x grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="t-label reveal mb-4">04 · {ui.home.tech}</p>
            <h2 id="tech-h" className="t-h2 reveal">{ui.home.tech}</h2>
            <p className="t-lead reveal mt-4">{ui.home.techLead}</p>
            <ul className="sr-only">{TECH.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <TechSphere items={TECH} label={ui.home.tech} />
        </div>
      </section>

      {/* 9. Nega SIFATDEV */}
      <section aria-labelledby="why-h" className="section">
        <div className="container-x">
          <p className="t-label reveal mb-4">05 · {ui.home.why}</p>
          <h2 id="why-h" className="t-h2 reveal mb-12">{ui.home.why}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => (
              <div key={i} className="card reveal p-7" style={{ ["--i" as string]: i }}>
                <span className="block h-1 w-10 rounded-full bg-gradient-to-r from-accent to-hi" />
                <h3 className="mt-6 font-display text-[19px] font-semibold">{w.title[locale]}</h3>
                <p className="mt-3 text-[15px] text-fg-2">{w.text[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Mijozlar fikri — faqat haqiqiy; bo'lmasa ko'rsatilmaydi */}
      {SITE.testimonials.length > 0 && (
        <section aria-labelledby="t-h" className="section">
          <div className="container-x">
            <h2 id="t-h" className="t-h2 reveal mb-10">{ui.home.testimonials}</h2>
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
              {SITE.testimonials.map((t, i) => (
                <figure key={i} className="card min-w-[320px] snap-start p-8 md:min-w-[480px]">
                  <blockquote className="text-lg">“{t.quote[locale]}”</blockquote>
                  <figcaption className="mt-6 text-[14px] text-muted">{t.author} · {t.role}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 12. CTA — partikullar halqa bo'lib yig'iladi */}
      <section data-shape="ring" data-my="0.62" data-x="0" data-y="0.3" data-scale="1.15" data-push="1.8" aria-labelledby="cta-h" className="section">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <Words as="h2" text={ui.home.ctaTitle} className="t-h2" />
            <p className="t-lead reveal mt-5">{ui.home.ctaLead}</p>
            <div className="reveal mt-8 flex justify-center">
              <Magnetic>
                <Link href={href(locale, "contact")} className="btn btn-primary btn-lg">
                  {ui.cta.discuss} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>
          </div>
          <div className="card reveal mx-auto mt-16 max-w-3xl p-6 md:p-10">
            <QuickForm locale={locale} />
          </div>
        </div>
      </section>
    </>
  );
}
