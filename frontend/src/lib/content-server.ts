import { CASES, type CaseStudy } from "@/content/cases";
import { VACANCIES, type Vacancy } from "@/content/company";
import { SITE } from "@/content/site";

export type Stat = { value: number; suffix: string; label: { uz: string; ru: string; en: string } };
export type SiteContent = { cases: CaseStudy[]; vacancies: Vacancy[]; stats: Stat[] };

const BACKEND = process.env.BACKEND_URL ?? "http://127.0.0.1:4000";
const TTL_MS = 15_000;

const sorted = (c: SiteContent): SiteContent => ({ ...c, cases: [...c.cases].sort((a, b) => a.order - b.order) });
const FALLBACK = sorted({ cases: CASES, vacancies: VACANCIES, stats: SITE.stats });

let cache: { at: number; data: SiteContent } | null = null;
let pending: Promise<SiteContent> | null = null;

async function load(): Promise<SiteContent> {
  try {
    const res = await fetch(`${BACKEND}/api/v1/content`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(String(res.status));
    const d = (await res.json()) as Partial<SiteContent>;
    if (!Array.isArray(d.cases) || !Array.isArray(d.vacancies) || !Array.isArray(d.stats)) throw new Error("shape");
    const data = sorted({ cases: d.cases, vacancies: d.vacancies, stats: d.stats });
    cache = { at: Date.now(), data };
    return data;
  } catch {
    // Backend vaqtincha ishlamasa, sayt oxirgi ma'lumot bilan ochilaveradi.
    return cache?.data ?? FALLBACK;
  } finally {
    pending = null;
  }
}

/** Admin paneldagi o'zgarish saytda 15 soniyagacha vaqt ichida ko'rinadi. */
export function getContent(): Promise<SiteContent> {
  if (cache && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.data);
  pending ??= load();
  return pending;
}
