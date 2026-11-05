"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { href } from "@/lib/routes";
import { UI } from "@/content/ui";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TurnstileApi = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Cloudflare Turnstile — ko'rinmas captcha (TZ 8.2). Kalit yo'q bo'lsa (dev) — hech narsa ko'rsatilmaydi. */
export function useTurnstile(locale: Locale) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef<string | undefined>(undefined);
  const [token, setToken] = useState("");
  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        const ts = (window as Window & { turnstile?: TurnstileApi }).turnstile;
        if (cancelled || !ts || !ref.current) return;
        id.current = ts.render(ref.current, {
          sitekey: SITE_KEY,
          language: locale,
          appearance: "interaction-only",
          theme: "dark",
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      const ts = (window as Window & { turnstile?: TurnstileApi }).turnstile;
      if (id.current) ts?.remove(id.current);
    };
  }, [locale]);
  const reset = useCallback(() => {
    (window as Window & { turnstile?: TurnstileApi }).turnstile?.reset(id.current);
    setToken("");
  }, []);
  return { widget: <div ref={ref} className="min-h-0" />, token, reset };
}

export type SubmitState = { status: "idle" | "sending" | "done" | "error"; message?: string; fields?: Record<string, string> };

export function errorMessage(locale: Locale, res: { error?: string; fields?: { field: string; code: string }[] } | null, status: number) {
  const f = UI[locale].form;
  if (status === 429) return f.rateLimited;
  if (res?.error === "captcha_failed") return f.captcha;
  if (res?.error === "file_rejected" || res?.error === "file_too_large" || status === 413) return f.fileRejected;
  return f.error;
}

export function fieldMap(locale: Locale, fields?: { field: string; code: string }[]) {
  const f = UI[locale].form;
  const out: Record<string, string> = {};
  for (const e of fields ?? []) {
    const k = e.field.split(".")[0] ?? e.field;
    out[k] = e.code === "invalid_phone" ? f.invalidPhone : e.code === "phone_or_email_required" ? f.phoneOrEmail : k === "email" ? f.invalidEmail : f.required;
  }
  return out;
}

/** +998 uchun maska: +998 90 123 45 67; boshqa davlatlar — erkin xalqaro format. */
export function formatPhone(v: string): string {
  const digits = v.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+998") && !/^998/.test(digits) && !/^\d{9}$/.test(digits)) return v.replace(/[^\d+\s()-]/g, "").slice(0, 20);
  const d = digits.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(" ")}`.trim();
}

export function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function Consent({ locale, error }: { locale: Locale; error?: string }) {
  const f = UI[locale].form;
  return (
    <div>
      <label className="check">
        <input type="checkbox" name="consent" value="true" required aria-invalid={error ? "true" : undefined} />
        <span>
          {f.consentPre}{" "}
          <Link href={href(locale, "privacy")} target="_blank" className="text-accent-soft underline underline-offset-4">
            {f.consentLink}
          </Link>
        </span>
      </label>
      {error && <p className="err mt-1">{error}</p>}
    </div>
  );
}

export function Field({ label, name, error, children, hint }: { label: string; name: string; error?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={`f-${name}`}>{label}</label>
      {children}
      {hint && !error && <p className="text-[13px] text-muted">{hint}</p>}
      {error && (
        <p id={`e-${name}`} className="err" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Success({ locale }: { locale: Locale }) {
  const f = UI[locale].form;
  return (
    <div className="flex flex-col items-start gap-4 py-6" role="status">
      <CheckCircle2 size={40} className="text-hi" aria-hidden="true" />
      <p className="t-h3">{f.successTitle}</p>
      <p className="text-fg-2">{f.successText}</p>
    </div>
  );
}

export async function postForm(url: string, body: FormData | Record<string, unknown>) {
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method: "POST",
    headers: isForm ? undefined : { "content-type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
    credentials: "same-origin",
  });
  let data: { ok?: boolean; error?: string; fields?: { field: string; code: string }[] } | null = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  return { ok: res.ok && data?.ok !== false, status: res.status, data };
}
