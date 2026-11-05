import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { SERVICES } from "@/content/services";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Words } from "@/components/ui/basics";
import BriefForm from "@/components/forms/BriefForm";
import NextSteps from "@/components/sections/NextSteps";
import MapEmbed from "@/components/sections/MapEmbed";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ui = UI[locale].contact;
  return pageMeta({ locale, key: "contact", title: `${ui.title} — SIFATDEV`, description: ui.lead });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const service = typeof sp.service === "string" && SERVICES.some((s) => s.id === sp.service) ? sp.service : undefined;
  const caseRef = typeof sp.case === "string" ? sp.case.slice(0, 120) : undefined;
  const ui = UI[locale];

  const rows = [
    { Icon: Phone, label: ui.form.phone, value: SITE.phone, href: `tel:${SITE.phoneHref}` },
    { Icon: Mail, label: ui.form.email, value: SITE.email, href: `mailto:${SITE.email}` },
    { Icon: Send, label: "Telegram", value: `@${SITE.telegram}`, href: `https://t.me/${SITE.telegram}` },
    ...(SITE.whatsapp ? [{ Icon: Phone, label: "WhatsApp", value: `+${SITE.whatsapp}`, href: `https://wa.me/${SITE.whatsapp}` }] : []),
    { Icon: MapPin, label: ui.contact.address, value: SITE.address[locale] },
    { Icon: Clock, label: ui.contact.hours, value: SITE.hours[locale] },
  ];

  return (
    <>
      <section data-shape="ring" data-x="0.6" data-scale="0.8" data-push="1.6" className="pb-10 pt-[calc(var(--header-h)+48px)] max-md:pt-[calc(var(--header-h)+24svh)]">
        <div className="container-x">
          <Breadcrumbs locale={locale} items={[{ name: ui.nav.contact, href: href(locale, "contact") }]} />
          <Words text={ui.contact.title} className="t-display max-w-3xl" />
          <p className="t-lead hero-in mt-6 max-w-2xl">{ui.contact.lead}</p>
        </div>
      </section>
      <section className="section !pt-6">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="card p-6 md:p-10">
            <BriefForm locale={locale} preService={service} caseRef={caseRef} />
          </div>
          <aside className="grid h-fit gap-6">
            <div className="card p-6">
              <h2 className="t-label mb-5">{ui.contact.contacts}</h2>
              <ul className="grid gap-4">
                {rows.map((r) => (
                  <li key={r.label} className="flex gap-3">
                    <r.Icon size={20} className="mt-0.5 flex-none text-accent-soft" aria-hidden="true" />
                    <span>
                      <span className="block text-[13px] text-muted">{r.label}</span>
                      {r.href ? (
                        <a href={r.href} className="hover:text-hi" {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{r.value}</a>
                      ) : (
                        <span>{r.value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {SITE.meetingUrl && (
                <a href={SITE.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-6 w-full">{ui.cta.meeting}</a>
              )}
            </div>
            <MapEmbed label={ui.contact.mapShow} />
          </aside>
        </div>
      </section>
      <NextSteps locale={locale} from="contact" />
    </>
  );
}
