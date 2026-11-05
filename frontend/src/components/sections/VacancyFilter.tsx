"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { UI } from "@/content/ui";

type Item = { id: string; direction: string; href: string; title: string; level: string; type: string };

/** Vakansiyalar ro'yxati, yo'nalish filtri bilan (TZ 5.5). */
export default function VacancyFilter({ locale, items }: { locale: Locale; items: Item[] }) {
  const dirs = Array.from(new Set(items.map((i) => i.direction)));
  const [dir, setDir] = useState("");
  const list = items.filter((i) => !dir || i.direction === dir);
  return (
    <>
      {dirs.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2" role="radiogroup" aria-label={UI[locale].careers.direction}>
          {["", ...dirs].map((d) => (
            <label key={d || "all"} className="opt !min-h-10 !text-[14px] capitalize">
              <input type="radio" name="dir" checked={dir === d} onChange={() => setDir(d)} />
              {d || UI[locale].work.all}
            </label>
          ))}
        </div>
      )}
      <ul className="grid gap-3">
        {list.map((v) => (
          <li key={v.id}>
            <Link href={v.href} className="card group flex flex-wrap items-center justify-between gap-4 p-6 transition hover:border-accent-soft">
              <span>
                <span className="block font-display text-lg font-semibold">{v.title}</span>
                <span className="mt-1 block font-mono text-[13px] text-muted">{v.level} · {v.type} · {v.direction}</span>
              </span>
              <ArrowUpRight className="text-muted transition group-hover:text-hi" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
