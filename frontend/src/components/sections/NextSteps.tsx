import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { L, Locale } from "@/lib/i18n";
import { href, type PageKey } from "@/lib/routes";
import { UI } from "@/content/ui";
import { Tilt } from "@/components/ui/interactive";

const P = (uz: string, ru: string, en: string): L => ({ uz, ru, en });

const TITLE = P("Keyingi qadam", "Следующий шаг", "Next step");

const DESC: Record<Exclude<PageKey, "home" | "blog" | "privacy">, L> = {
  services: P("Sayt, mobil ilova, AI va avtomatlashtirish — 6 yo'nalish", "Сайты, приложения, AI и автоматизация — 6 направлений", "Websites, apps, AI and automation — 6 practices"),
  work: P("Davlat va biznes uchun qilingan real loyihalar", "Реальные проекты для госсектора и бизнеса", "Real projects for government and business"),
  about: P("Jamoa, qadriyatlar va ish uslubimiz", "Команда, ценности и подход к работе", "Our team, values and way of working"),
  careers: P("Jamoamizga qo'shiling — ochiq vakansiyalar", "Присоединяйтесь — открытые вакансии", "Join us — open positions"),
  contact: P("Loyihangizni 3 qadamda yozing — 2 soatda javob", "Опишите проект в 3 шага — ответим за 2 часа", "Describe your project in 3 steps — reply within 2 hours"),
};

/** Har sahifa uchun mantiqiy davom (ichki bog'lanish — UX va SEO uchun). */
const NEXT: Record<string, (keyof typeof DESC)[]> = {
  services: ["work", "about", "contact"],
  service: ["work", "services", "contact"],
  work: ["services", "about", "contact"],
  case: ["services", "work", "contact"],
  about: ["work", "careers", "contact"],
  careers: ["about", "work", "contact"],
  vacancy: ["careers", "about", "work"],
  contact: ["services", "work", "about"],
  other: ["services", "work", "contact"],
};

export default function NextSteps({ locale, from }: { locale: Locale; from: keyof typeof NEXT }) {
  const ui = UI[locale];
  return (
    <section aria-labelledby="next-steps" className="section !pt-10">
      <div className="container-x">
        <p id="next-steps" className="t-label reveal mb-8">{TITLE[locale]}</p>
        <ul className="grid gap-4 md:grid-cols-3">
          {NEXT[from]!.map((k, i) => (
            <li key={k}>
              <Tilt className="reveal h-full rounded-[var(--radius-card)]">
                <Link href={href(locale, k)} className="card group flex h-full flex-col justify-between gap-8 p-7" style={{ ["--i" as string]: i }}>
                  <span className="flex items-start justify-between gap-4">
                    <span className="t-h3">{ui.nav[k]}</span>
                    <ArrowUpRight className="flex-none text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                  </span>
                  <span className="text-[15px] text-fg-2">{DESC[k][locale]}</span>
                </Link>
              </Tilt>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
