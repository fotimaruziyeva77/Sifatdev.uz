"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { UI } from "@/content/ui";
import { leadSource, track } from "@/lib/analytics";
import { Consent, Field, Honeypot, Success, errorMessage, fieldMap, postForm, useTurnstile, type SubmitState } from "./shared";

/** CTA blokidagi tezkor forma: ism, telefon yoki Telegram, izoh (TZ 5.1, 8.2). */
export default function QuickForm({ locale }: { locale: Locale }) {
  const f = UI[locale].form;
  const [s, setS] = useState<SubmitState>({ status: "idle" });
  const ts = useTurnstile(locale);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const contact = String(fd.get("contact") ?? "").trim();
    const errs: Record<string, string> = {};
    if (name.length < 2) errs.name = f.required;
    if (contact.length < 3) errs.contact = f.required;
    if (!fd.get("consent")) errs.consent = f.required;
    if (Object.keys(errs).length) return setS({ status: "error", fields: errs });
    setS({ status: "sending" });
    const r = await postForm("/api/v1/leads/quick", {
      locale,
      name,
      contact,
      comment: String(fd.get("comment") ?? ""),
      consent: true,
      website: String(fd.get("website") ?? ""),
      turnstileToken: ts.token,
      source: leadSource(),
    });
    if (r.ok) {
      track("form_submit_quick");
      return setS({ status: "done" });
    }
    ts.reset();
    setS({ status: "error", message: errorMessage(locale, r.data, r.status), fields: fieldMap(locale, r.data?.fields) });
  }

  if (s.status === "done") return <Success locale={locale} />;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <Honeypot />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={f.name} name="q-name" error={s.fields?.name}>
          <input id="f-q-name" name="name" className="input" autoComplete="name" maxLength={100} required aria-invalid={s.fields?.name ? "true" : undefined} aria-describedby={s.fields?.name ? "e-q-name" : undefined} />
        </Field>
        <Field label={f.contact} name="q-contact" error={s.fields?.contact}>
          <input id="f-q-contact" name="contact" className="input" autoComplete="tel" maxLength={100} required placeholder="+998 __ ___ __ __ / @username" aria-invalid={s.fields?.contact ? "true" : undefined} />
        </Field>
      </div>
      <Field label={f.comment} name="q-comment">
        <textarea id="f-q-comment" name="comment" className="input" rows={3} maxLength={1000} />
      </Field>
      <Consent locale={locale} error={s.fields?.consent} />
      {ts.widget}
      {s.status === "error" && s.message && <p className="err" role="alert">{s.message}</p>}
      <div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={s.status === "sending"}>
          {s.status === "sending" ? f.sending : f.send} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
