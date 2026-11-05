"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { UI } from "@/content/ui";
import { captureUtm, track } from "@/lib/analytics";

const KEY = "sifat-consent"; // "all" | "essential" | "notice"
const EU_TZ = /^(Europe\/(?!Moscow|Minsk|Kirov|Volgograd|Astrakhan|Saratov|Ulyanovsk|Samara|Simferopol|Istanbul|Kyiv|Kiev|Chisinau|Belgrade|Sarajevo|Skopje|Podgorica|Tirane|London|Isle_of_Man|Jersey|Guernsey|Oslo|Zurich|Vaduz|Gibraltar|Andorra|Monaco|San_Marino|Vatican)|Atlantic\/(Azores|Madeira|Canary|Reykjavik))/;

function needsConsent(): boolean {
  try {
    // EI (va EEA) hududi — vaqt zonasi bo'yicha taxminiy aniqlash; shubhali holatda rozilik so'raladi.
    return EU_TZ.test(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "");
  } catch {
    return true;
  }
}

function loadAnalytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const ym = process.env.NEXT_PUBLIC_YM_ID;
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; ym?: ((...a: unknown[]) => void) & { a?: unknown[]; l?: number } };
  if (ga && /^G-[A-Z0-9]{4,20}$/.test(ga) && !w.gtag) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", ga, { anonymize_ip: true });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
    document.head.appendChild(s);
  }
  if (ym && /^\d{4,12}$/.test(ym) && !w.ym) {
    const f = function ymq(...args: unknown[]) {
      (f.a = f.a || []).push(args);
    } as ((...a: unknown[]) => void) & { a?: unknown[]; l?: number };
    f.l = Date.now();
    w.ym = f;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(s);
    w.ym(Number(ym), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }
}

/** Cookie banner (TZ 8.8): EI uchun — analitika faqat rozilikdan keyin; boshqalarga — xabardor qiluvchi. */
export default function Consent({ locale }: { locale: Locale }) {
  const ui = UI[locale].cookie;
  const pathname = usePathname();
  const [state, setState] = useState<"hidden" | "consent" | "notice">("hidden");

  useEffect(() => {
    captureUtm();
    let v: string | null = null;
    try {
      v = localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    const eu = needsConsent();
    if (v === "all" || (v === "notice" && !eu)) loadAnalytics();
    if (!v || (v === "notice" && eu)) {
      if (eu) setState("consent");
      else {
        setState("notice");
        loadAnalytics();
      }
    }
    // Global hodisalar: komponentlar window.dispatchEvent orqali yuboradi
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ name: string; params?: Record<string, unknown> }>).detail;
      if (d?.name) track(d.name, d.params);
    };
    window.addEventListener("sifat:track", h);
    // Telefon/Telegram/WhatsApp bosilishi — maqsadlar
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a");
      const h2 = a?.getAttribute("href") ?? "";
      if (h2.startsWith("tel:")) track("click_phone");
      else if (h2.includes("t.me/")) track("click_telegram");
      else if (h2.includes("wa.me/")) track("click_whatsapp");
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("sifat:track", h);
      document.removeEventListener("click", click);
    };
  }, []);

  useEffect(() => {
    const w = window as Window & { gtag?: (...a: unknown[]) => void };
    w.gtag?.("event", "page_view", { page_path: pathname });
  }, [pathname]);

  const save = (v: "all" | "essential" | "notice") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    if (v === "all") loadAnalytics();
    setState("hidden");
  };

  if (state === "hidden") return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie" className="fixed inset-x-3 bottom-24 z-[60] md:bottom-6 md:left-6 md:right-auto md:max-w-md">
      <div className="card flex items-center gap-3 !bg-base p-3 shadow-2xl md:block md:p-5">
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-fg-2 md:text-[15px] md:leading-normal">
          {state === "consent" ? ui.textEu : ui.text}{" "}
          <Link href={href(locale, "privacy")} className="text-accent-soft underline underline-offset-4">
            {UI[locale].footer.privacy}
          </Link>
        </p>
        <div className="flex flex-none flex-wrap gap-2 md:mt-4">
          {state === "consent" ? (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => save("all")}>
                {ui.accept}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => save("essential")}>
                {ui.decline}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => save("notice")}>
              {ui.ok}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
