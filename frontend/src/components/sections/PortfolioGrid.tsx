"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { UI } from "@/content/ui";
import { INDUSTRY_LABELS, type CaseStudy, type Industry } from "@/content/cases";
import { SERVICES } from "@/content/services";
import { CaseCard } from "./Cards";

type Filters = { industry: string[]; service: string[]; tech: string[]; year: string[] };
const KEYS: (keyof Filters)[] = ["industry", "service", "tech", "year"];
const PAGE = 9;

/** Filtrlar (soha, xizmat, texnologiya, yil) birga ishlaydi va URL parametrlarida saqlanadi (TZ 8.3). */
export default function PortfolioGrid({ locale, initial, cases }: { locale: Locale; initial: Record<string, string | undefined>; cases: CaseStudy[] }) {
  const ui = UI[locale].work;
  const all = cases;
  const techs = useMemo(() => Array.from(new Set(all.flatMap((c) => c.tech))).sort(), [all]);
  const years = useMemo(() => Array.from(new Set(all.map((c) => String(c.year)))).sort().reverse(), [all]);

  const [f, setF] = useState<Filters>(() => {
    const parse = (k: string) => (initial[k] ?? "").split(",").filter(Boolean).slice(0, 20);
    return { industry: parse("industry"), service: parse("service"), tech: parse("tech"), year: parse("year") };
  });
  const [shown, setShown] = useState(PAGE);

  const update = (next: Filters) => {
    setF(next);
    setShown(PAGE);
    const p = new URLSearchParams();
    for (const k of KEYS) if (next[k].length) p.set(k, next[k].join(","));
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  };
  const toggle = (k: keyof Filters, v: string) => update({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  const list = all.filter(
    (c) =>
      (!f.industry.length || f.industry.includes(c.industry)) &&
      (!f.service.length || c.services.some((s) => f.service.includes(s))) &&
      (!f.tech.length || c.tech.some((t) => f.tech.includes(t))) &&
      (!f.year.length || f.year.includes(String(c.year))),
  );
  const active = KEYS.some((k) => f[k].length);

  const group = (k: keyof Filters, label: string, opts: { v: string; l: string }[]) => (
    <fieldset className="grid content-start gap-3">
      <legend className="t-label mb-3">{label}</legend>
      <div className="flex flex-wrap content-start items-start gap-2">
        {opts.map((o) => (
          <label key={o.v} className="opt !min-h-10 !px-3.5 !py-1.5 !text-[14px]">
            <input type="checkbox" checked={f[k].includes(o.v)} onChange={() => toggle(k, o.v)} />
            {o.l}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="container-x">
      <div className="card mb-10 grid gap-6 p-6 md:p-8 lg:grid-cols-2">
        {group("industry", ui.filterIndustry, (Object.keys(INDUSTRY_LABELS) as Industry[]).map((v) => ({ v, l: INDUSTRY_LABELS[v][locale] })))}
        {group("service", ui.filterService, SERVICES.map((s) => ({ v: s.id, l: s.title[locale] })))}
        {group("tech", ui.filterTech, techs.map((t) => ({ v: t, l: t })))}
        {group("year", ui.filterYear, years.map((y) => ({ v: y, l: y })))}
        {active && (
          <div className="lg:col-span-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ industry: [], service: [], tech: [], year: [] })}>
              {ui.reset}
            </button>
          </div>
        )}
      </div>
      <h2 className="sr-only">{ui.title}</h2>
      <p className="sr-only" aria-live="polite">{list.length}</p>
      {list.length === 0 ? (
        <p className="py-20 text-center text-fg-2">{ui.empty}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, shown).map((c, i) => <CaseCard key={c.id} c={c} locale={locale} i={i % 3} />)}
        </div>
      )}
      {list.length > shown && (
        <div className="mt-12 flex justify-center">
          <button type="button" className="btn btn-secondary" onClick={() => setShown((s) => s + PAGE)}>
            {UI[locale].cta.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
