"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { onThemeChange, readTheme, setTheme, type Theme } from "@/lib/theme";
import { track } from "@/lib/analytics";

const LABEL: Record<Locale, { light: string; dark: string }> = {
  uz: { light: "Kun rejimiga o'tish", dark: "Tun rejimiga o'tish" },
  ru: { light: "Светлая тема", dark: "Тёмная тема" },
  en: { light: "Switch to light mode", dark: "Switch to dark mode" },
};

/** Kun/tun rejimi tugmasi (quyosh/oy). */
export default function ThemeToggle({ locale, className = "" }: { locale: Locale; className?: string }) {
  const [theme, setT] = useState<Theme>("dark");
  useEffect(() => {
    setT(readTheme());
    return onThemeChange(setT);
  }, []);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = LABEL[locale][next];
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        track("theme_toggle", { theme: next });
      }}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-full border border-line text-fg transition hover:border-accent ${className}`}
    >
      {theme === "dark" ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
    </button>
  );
}
