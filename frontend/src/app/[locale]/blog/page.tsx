import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";
import { UI } from "@/content/ui";
import { POST_SLUGS } from "@/content/slugs";
import NextSteps from "@/components/sections/NextSteps";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

type Props = { params: Promise<{ locale: string }> };

/** Blog — 2-bosqich (TZ 8.5). Maqola bo'lmasa sahifa indekslanmaydi va menyuda ko'rinmaydi. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ui = UI[locale].blog;
  return pageMeta({ locale, key: "blog", title: `${ui.title} — SIFATDEV`, description: ui.empty, noindex: Object.keys(POST_SLUGS).length === 0 });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ui = UI[locale];
  return (
    <>
    <section data-shape="code" data-x="0.6" data-scale="0.6" className="min-h-[70svh] pb-24 pt-[calc(var(--header-h)+48px)] max-md:pt-[calc(var(--header-h)+24svh)]">
      <div className="container-x">
        <Breadcrumbs locale={locale} items={[{ name: ui.blog.title, href: href(locale, "blog") }]} />
        <h1 className="t-display">{ui.blog.title}</h1>
        <p className="t-lead mt-6">{ui.blog.empty}</p>
      </div>
    </section>
    <NextSteps locale={locale} from="other" />
    </>
  );
}
