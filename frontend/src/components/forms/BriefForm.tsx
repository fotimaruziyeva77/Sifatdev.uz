"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Paperclip, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { UI } from "@/content/ui";
import { SERVICES } from "@/content/services";
import { leadSource, track } from "@/lib/analytics";
import { Consent, Field, Honeypot, Success, errorMessage, fieldMap, formatPhone, postForm, useTurnstile, type SubmitState } from "./shared";

const ALLOWED = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg", "zip"];
const MAX = 10 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 3 qadamli loyiha brifi (TZ 8.2). Xizmat va keys URL'dan oldindan tanlanishi mumkin. */
export default function BriefForm({ locale, preService, caseRef }: { locale: Locale; preService?: string; caseRef?: string }) {
  const f = UI[locale].form;
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [s, setS] = useState<SubmitState>({ status: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [phone, setPhone] = useState("");
  const ts = useTurnstile(locale);

  const validate = (st: number): Record<string, string> => {
    const fd = new FormData(formRef.current!);
    const e: Record<string, string> = {};
    if (st === 0 && fd.getAll("services").length === 0) e.services = f.required;
    if (st === 2) {
      if (String(fd.get("name") ?? "").trim().length < 2) e.name = f.required;
      const ph = String(fd.get("phone") ?? "").replace(/\D/g, "");
      const em = String(fd.get("email") ?? "").trim();
      if (!ph && !em) e.phone = f.phoneOrEmail;
      if (ph && ph.length < 9) e.phone = f.invalidPhone;
      if (em && !EMAIL_RE.test(em)) e.email = f.invalidEmail;
      if (!fd.get("consent")) e.consent = f.required;
    }
    return e;
  };

  const go = (dir: 1 | -1) => {
    if (dir === 1) {
      const e = validate(step);
      if (Object.keys(e).length) return setS({ status: "error", fields: e });
      track("brief_step", { step: step + 2 });
    }
    setS({ status: "idle" });
    setStep((x) => Math.max(0, Math.min(2, x + dir)));
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const pick = (fl: File | undefined) => {
    if (!fl) return;
    const ext = fl.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.includes(ext) || fl.size > MAX) {
      setFile(null);
      return setS({ status: "error", fields: { file: f.fileRejected } });
    }
    setS({ status: "idle" });
    setFile(fl);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) return go(1);
    const errs = validate(2);
    if (Object.keys(errs).length) return setS({ status: "error", fields: errs });
    const src = new FormData(e.currentTarget);
    const fd = new FormData();
    fd.set("locale", locale);
    for (const sv of src.getAll("services")) fd.append("services", String(sv));
    for (const k of ["stage", "budget", "currency", "timeline", "description", "caseRef", "name", "company", "phone", "email", "telegram", "preferredContact", "website"]) {
      const v = src.get(k);
      if (v !== null && String(v) !== "") fd.set(k, String(v));
    }
    fd.set("consent", "true");
    if (ts.token) fd.set("turnstileToken", ts.token);
    for (const [k, v] of Object.entries(leadSource())) fd.set(`source.${k}`, v);
    if (file) fd.set("file", file, file.name);
    setS({ status: "sending" });
    const r = await postForm("/api/v1/leads/brief", fd);
    if (r.ok) {
      track("form_submit_brief", { services: src.getAll("services").join(",") });
      return setS({ status: "done" });
    }
    ts.reset();
    const fields = fieldMap(locale, r.data?.fields);
    if (fields.services) setStep(0);
    setS({ status: "error", message: errorMessage(locale, r.data, r.status), fields });
  }

  if (s.status === "done") return <Success locale={locale} />;
  const err = s.fields ?? {};

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="scroll-mt-28">
      <Honeypot />
      {/* Progress */}
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label={`${f.step} ${step + 1} ${f.of} 3`}>
        {f.briefSteps.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={`block h-1 rounded-full transition ${i <= step ? "bg-accent" : "bg-line"}`} />
            <span className={`mt-2 block font-mono text-[12px] uppercase tracking-wider ${i === step ? "text-fg" : "text-muted"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {/* 1-qadam */}
      <fieldset hidden={step !== 0} className="grid gap-8">
        <div>
          <legend className="label mb-3 text-[14px] font-medium text-fg-2">{f.serviceType} *</legend>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((sv) => (
              <label key={sv.id} className="opt">
                <input type="checkbox" name="services" value={sv.id} defaultChecked={preService === sv.id} />
                {sv.title[locale]}
              </label>
            ))}
          </div>
          {err.services && <p className="err mt-2" role="alert">{err.services}</p>}
        </div>
        <div>
          <p className="mb-3 text-[14px] font-medium text-fg-2">{f.stage}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {(Object.keys(f.stages) as (keyof typeof f.stages)[]).map((k) => (
              <label key={k} className="opt">
                <input type="radio" name="stage" value={k} />
                {f.stages[k]}
              </label>
            ))}
          </div>
        </div>
        {caseRef && <input type="hidden" name="caseRef" value={caseRef} />}
        {caseRef && <p className="chip w-fit">{f.caseRef}: {caseRef}</p>}
      </fieldset>

      {/* 2-qadam */}
      <fieldset hidden={step !== 1} className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <Field label={f.budget} name="budget">
            <select id="f-budget" name="budget" className="input" defaultValue="">
              <option value="">—</option>
              {(Object.keys(f.budgets) as (keyof typeof f.budgets)[]).map((k) => (
                <option key={k} value={k}>{f.budgets[k]}</option>
              ))}
            </select>
          </Field>
          <Field label={f.currency} name="currency">
            <select id="f-currency" name="currency" className="input" defaultValue={locale === "en" ? "USD" : "UZS"}>
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </select>
          </Field>
        </div>
        <Field label={f.timeline} name="timeline">
          <select id="f-timeline" name="timeline" className="input" defaultValue="">
            <option value="">—</option>
            {(Object.keys(f.timelines) as (keyof typeof f.timelines)[]).map((k) => (
              <option key={k} value={k}>{f.timelines[k]}</option>
            ))}
          </select>
        </Field>
        <Field label={f.description} name="description" hint={f.descriptionHint}>
          <textarea id="f-description" name="description" className="input" rows={6} maxLength={2000} />
        </Field>
        <div className="field">
          <span className="label">{f.file}</span>
          <label
            className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed p-6 text-center transition ${drag ? "border-accent bg-accent/10" : "border-input hover:border-accent-soft"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files[0]);
            }}
          >
            <Paperclip size={22} aria-hidden="true" className="text-accent-soft" />
            <span className="text-[15px] text-fg-2">{f.fileDrop}</span>
            <span className="text-[13px] text-muted">{f.fileHint}</span>
            <input type="file" className="sr-only" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {file && (
            <p className="chip mt-2 w-fit">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
              <button type="button" onClick={() => setFile(null)} aria-label={f.fileRemove} className="ml-1 rounded-full p-1 hover:bg-elevated">
                <X size={14} aria-hidden="true" />
              </button>
            </p>
          )}
          {err.file && <p className="err" role="alert">{err.file}</p>}
        </div>
      </fieldset>

      {/* 3-qadam */}
      <fieldset hidden={step !== 2} className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label={`${f.name} *`} name="name" error={err.name}>
            <input id="f-name" name="name" className="input" autoComplete="name" maxLength={100} aria-invalid={err.name ? "true" : undefined} />
          </Field>
          <Field label={f.company} name="company">
            <input id="f-company" name="company" className="input" autoComplete="organization" maxLength={150} />
          </Field>
          <Field label={`${f.phone} *`} name="phone" error={err.phone}>
            <input id="f-phone" name="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="+998 __ ___ __ __" aria-invalid={err.phone ? "true" : undefined} />
          </Field>
          <Field label={`${f.email} *`} name="email" error={err.email}>
            <input id="f-email" name="email" className="input" type="email" autoComplete="email" maxLength={254} aria-invalid={err.email ? "true" : undefined} />
          </Field>
          <Field label={f.telegram} name="telegram">
            <input id="f-telegram" name="telegram" className="input" placeholder="@username" maxLength={64} />
          </Field>
          <Field label={f.preferred} name="preferredContact">
            <select id="f-preferredContact" name="preferredContact" className="input" defaultValue="">
              <option value="">—</option>
              {(Object.keys(f.preferredOpts) as (keyof typeof f.preferredOpts)[]).map((k) => (
                <option key={k} value={k}>{f.preferredOpts[k]}</option>
              ))}
            </select>
          </Field>
        </div>
        <Consent locale={locale} error={err.consent} />
        {ts.widget}
      </fieldset>

      {s.status === "error" && s.message && <p className="err mt-6" role="alert">{s.message}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        {step > 0 && (
          <button type="button" className="btn btn-secondary" onClick={() => go(-1)}>
            <ArrowLeft size={18} aria-hidden="true" /> {f.back}
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={s.status === "sending"}>
          {step < 2 ? f.next : s.status === "sending" ? f.sending : f.send} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
