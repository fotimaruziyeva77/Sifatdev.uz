import Link from "next/link";
import { Phone, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { href, type PageKey } from "@/lib/routes";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { Logo } from "@/components/ui/basics";
import { MotionToggle } from "@/components/ui/interactive";

export default function Footer({ locale, showBlog }: { locale: Locale; showBlog: boolean }) {
  const ui = UI[locale];
  const links: PageKey[] = ["services", "work", "about", "careers", ...(showBlog ? (["blog"] as PageKey[]) : []), "contact"];
  return (
    <footer className="relative z-10 border-t border-line bg-base/80 pb-28 pt-16 backdrop-blur md:pb-12">
      <div className="container-x grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-[15px] text-fg-2">{ui.home.lead.split(".")[0]}.</p>
        </div>
        <nav aria-label={ui.footer.quick} className="md:col-span-2">
          <p className="t-label mb-4">{ui.footer.quick}</p>
          <ul className="grid gap-2 text-[15px]">
            {links.map((k) => (
              <li key={k}>
                <Link href={href(locale, k)} className="text-fg-2 hover:text-fg">
                  {ui.nav[k as keyof typeof ui.nav]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="t-label mb-4">{ui.footer.contacts}</p>
          <ul className="grid gap-2 text-[15px] text-fg-2">
            <li><a href={`tel:${SITE.phoneHref}`} className="hover:text-fg">{SITE.phone}</a></li>
            <li><a href={`mailto:${SITE.email}`} className="hover:text-fg">{SITE.email}</a></li>
            <li><a href={`https://t.me/${SITE.telegram}`} rel="noopener noreferrer" target="_blank" className="hover:text-fg">@{SITE.telegram}</a></li>
            <li>{SITE.address[locale]}</li>
            <li className="text-muted">{SITE.hours[locale]}</li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="t-label mb-4">{ui.footer.social}</p>
          <ul className="grid gap-2 text-[15px]">
            {SITE.social.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-fg-2 hover:text-fg">{s.name} ↗</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-x mt-14 flex flex-col gap-4 border-t border-line pt-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} SIFATDEV. {ui.footer.rights}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href(locale, "privacy")} className="btn btn-ghost btn-sm !px-3">{ui.footer.privacy}</Link>
          <MotionToggle offLabel={ui.footer.motionOff} onLabel={ui.footer.motionOn} />
        </div>
      </div>
    </footer>
  );
}

/** Mobil versiyada pastda doimiy "Bog'lanish" tugmasi: Telegram va qo'ng'iroq (TZ 5.8). */
export function MobileContactBar({ locale }: { locale: Locale }) {
  const ui = UI[locale];
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-2 gap-2 rounded-full border border-line bg-elevated/90 p-1.5 backdrop-blur-xl md:hidden">
      <a href={`https://t.me/${SITE.telegram}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
        <Send size={18} aria-hidden="true" /> {ui.cta.telegram}
      </a>
      <a href={`tel:${SITE.phoneHref}`} className="btn btn-secondary btn-sm">
        <Phone size={18} aria-hidden="true" /> {ui.cta.call}
      </a>
    </div>
  );
}
