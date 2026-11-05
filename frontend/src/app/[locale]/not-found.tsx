"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { UI } from "@/content/ui";

/** 404: "404" partikullardan yig'ilgan, kursor ularni sochib yuboradi (TZ 5.7). */
export default function NotFound() {
  const seg = usePathname()?.split("/")[1];
  const locale: Locale = isLocale(seg) ? seg : "en";
  const ui = UI[locale].notFound;
  return (
    <section data-shape="n404" data-x="0" data-y="0.28" data-scale="1.1" data-push="3" className="flex min-h-[100svh] items-end pb-24 pt-[calc(var(--header-h)+40px)]">
      <div className="container-x text-center">
        <h1 className="t-h2">
          <span className="sr-only">404. </span>
          {ui.title}
        </h1>
        <p className="t-lead mt-4">{ui.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={href(locale, "home")} className="btn btn-primary">{ui.home}</Link>
          <Link href={href(locale, "work")} className="btn btn-secondary">{ui.work}</Link>
        </div>
      </div>
    </section>
  );
}
