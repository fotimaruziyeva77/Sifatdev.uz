import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { UI } from "@/content/ui";
import { INDUSTRY_LABELS, type CaseStudy } from "@/content/cases";
import type { Service } from "@/content/services";
import { SERVICE_ICONS } from "@/components/ui/basics";
import { Tilt } from "@/components/ui/interactive";
import DeviceMock from "./DeviceMock";

export function CaseCard({ c, locale, i = 0 }: { c: CaseStudy; locale: Locale; i?: number }) {
  return (
    <Tilt className="reveal h-full rounded-[var(--radius-card)]">
      <Link href={href(locale, "work", c.id)} className="card group flex h-full flex-col overflow-hidden" style={{ ["--i" as string]: i }}>
        <div className="relative grid aspect-[16/11] place-items-center overflow-hidden border-b border-line" style={{ background: `radial-gradient(80% 90% at 60% 20%, rgb(227 38 47 / .2), transparent 70%)`, perspective: "900px" }}>
          <DeviceMock device={c.device} hue={c.hue} image={c.shots?.[0]?.src} alt={c.title[locale]} className="transition-transform duration-500 group-hover:scale-[1.04]" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{INDUSTRY_LABELS[c.industry][locale]}</span>
            <span className="chip">{c.year}</span>
          </div>
          <h3 className="t-h3 flex items-start justify-between gap-4">
            {c.title[locale]}
            <ArrowUpRight size={22} className="mt-1 flex-none text-muted transition group-hover:text-hi" aria-hidden="true" />
          </h3>
          <p className="text-[15px] text-fg-2">{c.summary[locale]}</p>
          {c.clientHidden && <p className="mt-auto font-mono text-[12px] text-muted">{UI[locale].work.hidden}</p>}
        </div>
      </Link>
    </Tilt>
  );
}

export function ServiceCard({ s, locale, count, i = 0 }: { s: Service; locale: Locale; count?: number; i?: number }) {
  const Icon = SERVICE_ICONS[s.id];
  return (
    <Tilt className="reveal h-full rounded-[var(--radius-card)]">
      <Link href={href(locale, "services", s.id)} className="card group flex h-full flex-col gap-4 p-7" style={{ ["--i" as string]: i }}>
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-elevated text-accent-soft transition group-hover:text-hi">
          <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h3 className="t-h3">{s.title[locale]}</h3>
        <p className="text-[15px] text-fg-2">{s.short[locale]}</p>
        <span className="mt-auto flex items-center justify-between pt-2 text-[14px] text-muted">
          {count !== undefined && <span className="font-mono">{count} {UI[locale].services.casesCount}</span>}
          <span className="flex items-center gap-1 text-accent-soft">{UI[locale].cta.more} <ArrowUpRight size={16} aria-hidden="true" /></span>
        </span>
      </Link>
    </Tilt>
  );
}
