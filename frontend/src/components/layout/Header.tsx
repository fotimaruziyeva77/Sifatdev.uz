"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { href, switchLocalePath, type PageKey } from "@/lib/routes";
import { UI } from "@/content/ui";
import { Logo } from "@/components/ui/basics";
import { Magnetic } from "@/components/ui/interactive";
import { track } from "@/lib/analytics";
import ThemeToggle from "@/components/ui/ThemeToggle";

const NAV: PageKey[] = ["services", "work", "about", "careers"];

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  return (
    <nav aria-label={UI[locale].language} className="flex items-center gap-1 font-mono text-[13px]">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={switchLocalePath(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          onClick={() => l !== locale && track("language_switch", { from: locale, to: l })}
          className={`grid h-11 min-w-11 place-items-center rounded-full px-2 uppercase transition ${l === locale ? "text-fg" : "text-muted hover:text-fg"}`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}

export default function Header({ locale, showBlog }: { locale: Locale; showBlog: boolean }) {
  const ui = UI[locale];
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const items = showBlog ? [...NAV, "blog" as PageKey] : NAV;

  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 120);
        last = y;
      }
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const isActive = (k: PageKey) => pathname.startsWith(href(locale, k));

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 border-b ${scrolled || open ? "border-line bg-base/70 backdrop-blur-xl" : "border-transparent"}`}
      data-hidden={hidden && !open ? "true" : "false"}
    >
      <div className="container-x flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href={href(locale, "home")} aria-label="SIFATDEV" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Asosiy" className="hidden items-center gap-1 lg:flex">
          {items.map((k) => (
            <Link key={k} href={href(locale, k)} aria-current={isActive(k) ? "page" : undefined} className={`rounded-full px-4 py-2.5 text-[15px] transition ${isActive(k) ? "text-fg" : "text-fg-2 hover:text-fg"}`}>
              {ui.nav[k as keyof typeof ui.nav]}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle locale={locale} />
          <Magnetic>
            <Link href={href(locale, "contact")} className="btn btn-primary btn-sm">
              {ui.cta.discuss}
            </Link>
          </Magnetic>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
        <ThemeToggle locale={locale} />
        <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-line text-fg transition hover:border-accent" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          <span className="sr-only">{open ? ui.close : ui.menu}</span>
        </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-50 flex flex-col overflow-y-auto bg-base px-[var(--gutter)] pb-10 pt-6 lg:hidden">
          <nav aria-label="Mobil menyu" className="flex flex-col">
            {[...items, "contact" as PageKey].map((k, i) => (
              <Link key={k} href={href(locale, k)} className="reveal is-in border-b border-line py-5 font-display text-2xl" style={{ ["--i" as string]: i }}>
                {ui.nav[k as keyof typeof ui.nav]}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex items-center justify-between">
            <LanguageSwitcher locale={locale} />
          </div>
          <Link href={href(locale, "contact")} className="btn btn-primary btn-lg mt-8">
            {ui.cta.discuss}
          </Link>
        </div>
      )}
    </header>
  );
}
