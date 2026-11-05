"use client";

import { useState } from "react";
import { ArrowRight, Paperclip } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { UI } from "@/content/ui";
import { leadSource, track } from "@/lib/analytics";
import { Consent, Field, Honeypot, Success, errorMessage, fieldMap, formatPhone, postForm, useTurnstile, type SubmitState } from "./shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Vakansiyaga ariza / rezyume (TZ 8.2): CV pdf/docx ≤ 5 MB. */
export default function ApplicationForm({ locale, vacancy = "general" }: { locale: Locale; vacancy?: string }) {
  const f = UI[locale].form;
  const [s, setS] = useState<SubmitState>({ status: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const ts = useTurnstile(locale);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const src = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    if (String(src.get("name") ?? "").trim().length < 2) errs.name = f.required;
    if (String(src.get("phone") ?? "").replace(/\D/g, "").length < 9) errs.phone = f.invalidPhone;
    if (!EMAIL_RE.test(String(src.get("email") ?? "").trim())) errs.email = f.invalidEmail;
    if (!file) errs.file = f.required;
    else if (!/\.(pdf|docx)$/i.test(file.name) || file.size > 5 * 1024 * 1024) errs.file = f.fileRejected;
    if (!src.get("consent")) errs.consent = f.required;
    if (Object.keys(errs).length) return setS({ status: "error", fields: errs });

    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("vacancy", vacancy);
    for (const k of ["name", "phone", "email", "portfolio", "comment", "website"]) {
      const v = src.get(k);
      if (v !== null && String(v) !== "") fd.set(k, String(v));
    }
    fd.set("consent", "true");
    if (ts.token) fd.set("turnstileToken", ts.token);
    for (const [k, v] of Object.entries(leadSource())) fd.set(`source.${k}`, v);
    fd.set("file", file!, file!.name);
    setS({ status: "sending" });
    const r = await postForm("/api/v1/applications", fd);
    if (r.ok) {
      track("form_submit_application", { vacancy });
      return setS({ status: "done" });
    }
    ts.reset();
    setS({ status: "error", message: errorMessage(locale, r.data, r.status), fields: fieldMap(locale, r.data?.fields) });
  }

  if (s.status === "done") return <Success locale={locale} />;
  const err = s.fields ?? {};
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <Honeypot />
      <div className="grid gap-6 md:grid-cols-2">
        <Field label={`${f.name} *`} name="a-name" error={err.name}>
          <input id="f-a-name" name="name" className="input" autoComplete="name" maxLength={100} aria-invalid={err.name ? "true" : undefined} />
        </Field>
        <Field label={`${f.phone} *`} name="a-phone" error={err.phone}>
          <input id="f-a-phone" name="phone" type="tel" inputMode="tel" className="input" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+998 __ ___ __ __" aria-invalid={err.phone ? "true" : undefined} />
        </Field>
        <Field label={`${f.email} *`} name="a-email" error={err.email}>
          <input id="f-a-email" name="email" type="email" className="input" autoComplete="email" maxLength={254} aria-invalid={err.email ? "true" : undefined} />
        </Field>
        <Field label={f.portfolio} name="a-portfolio">
          <input id="f-a-portfolio" name="portfolio" type="url" className="input" placeholder="https://" maxLength={300} />
        </Field>
      </div>
      <div className="field">
        <span className="label">{f.cv} *</span>
        <label className="flex min-h-20 cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-input p-5 hover:border-accent-soft">
          <Paperclip size={20} aria-hidden="true" className="text-accent-soft" />
          <span className="text-[15px] text-fg-2">{file ? file.name : f.cvHint}</span>
          <input type="file" className="sr-only" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {err.file && <p className="err" role="alert">{err.file}</p>}
      </div>
      <Field label={f.comment} name="a-comment">
        <textarea id="f-a-comment" name="comment" className="input" rows={4} maxLength={1000} />
      </Field>
      <Consent locale={locale} error={err.consent} />
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
