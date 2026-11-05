import type { BriefInput, QuickInput, ApplicationInput } from "./schemas.js";

type Locale = "uz" | "ru" | "en";

export const SERVICE_LABELS: Record<string, string> = {
  web: "Veb-platforma",
  mobile: "Mobil ilova",
  ai: "AI agentlar",
  gov: "Davlat tizimlari",
  automation: "Korporativ avtomatlashtirish",
  outsourcing: "Autsors / dedicated team",
};

function sourceLine(src: Record<string, unknown>, locale: string): string {
  const utm = Object.entries(src)
    .filter(([k, v]) => k.startsWith("utm_") && v)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  return `Manba: ${src.page ?? "-"} · ${locale.toUpperCase()} · ${src.device ?? "-"}${utm ? " · " + utm : ""}`;
}

export function telegramBrief(d: BriefInput, adminUrl: string): string {
  return [
    "YANGI SO'ROV · Loyiha brifi",
    `Ism: ${d.name}${d.company ? " · Kompaniya: " + d.company : ""}`,
    `Aloqa: ${[d.phone, d.email, d.telegram && "@" + d.telegram].filter(Boolean).join(" · ")}`,
    d.preferredContact ? `Qulay aloqa: ${d.preferredContact}` : "",
    `Xizmat: ${d.services.map((s) => SERVICE_LABELS[s] ?? s).join(", ")}`,
    `Holat: ${d.stage ?? "-"} · Byudjet: ${d.budget ?? "-"} ${d.currency} · Muddat: ${d.timeline ?? "-"}`,
    d.caseRef ? `O'xshash keys: ${d.caseRef}` : "",
    d.description ? `Tavsif: ${d.description}` : "",
    sourceLine(d.source, d.locale),
    `CMS'da ochish: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function telegramQuick(d: QuickInput, adminUrl: string): string {
  return [
    "YANGI SO'ROV · Tezkor forma",
    `Ism: ${d.name}`,
    `Aloqa: ${d.contact}`,
    d.comment ? `Izoh: ${d.comment}` : "",
    sourceLine(d.source, d.locale),
    `CMS'da ochish: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function telegramApplication(d: ApplicationInput, adminUrl: string): string {
  return [
    "YANGI ARIZA · Karyera",
    `Vakansiya: ${d.vacancy}`,
    `Ism: ${d.name}`,
    `Aloqa: ${d.phone} · ${d.email}`,
    d.portfolio ? `Portfolio: ${d.portfolio}` : "",
    d.comment ? `Izoh: ${d.comment}` : "",
    sourceLine(d.source, d.locale),
    `CMS'da ochish: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const AUTO: Record<"lead" | "application", Record<Locale, { subject: string; body: (n: string) => string }>> = {
  lead: {
    uz: {
      subject: "SIFATDEV — so'rovingiz qabul qilindi",
      body: (n) =>
        `Assalomu alaykum, ${n}!\n\nSo'rovingiz uchun rahmat. Menejerimiz 2 ish soati ichida siz bilan bog'lanadi.\n\nHurmat bilan,\nSIFATDEV jamoasi\nhttps://sifatdev.uz`,
    },
    ru: {
      subject: "SIFATDEV — ваша заявка принята",
      body: (n) =>
        `Здравствуйте, ${n}!\n\nСпасибо за заявку. Менеджер свяжется с вами в течение 2 рабочих часов.\n\nС уважением,\nкоманда SIFATDEV\nhttps://sifatdev.uz/ru`,
    },
    en: {
      subject: "SIFATDEV — we received your request",
      body: (n) =>
        `Hello ${n},\n\nThank you for reaching out. A manager will get back to you within 2 business hours (UTC+5).\n\nBest regards,\nThe SIFATDEV team\nhttps://sifatdev.uz/en`,
    },
  },
  application: {
    uz: {
      subject: "SIFATDEV — arizangiz qabul qilindi",
      body: (n) =>
        `Assalomu alaykum, ${n}!\n\nArizangiz uchun rahmat. HR jamoamiz uni ko'rib chiqib, 5 ish kuni ichida javob beradi.\n\nSIFATDEV jamoasi`,
    },
    ru: {
      subject: "SIFATDEV — ваш отклик получен",
      body: (n) =>
        `Здравствуйте, ${n}!\n\nСпасибо за отклик. HR-команда рассмотрит его и ответит в течение 5 рабочих дней.\n\nКоманда SIFATDEV`,
    },
    en: {
      subject: "SIFATDEV — application received",
      body: (n) =>
        `Hello ${n},\n\nThank you for applying. Our HR team will review your application and reply within 5 business days.\n\nThe SIFATDEV team`,
    },
  },
};

export function autoReply(kind: "lead" | "application", locale: Locale, name: string) {
  const t = AUTO[kind][locale];
  return { subject: t.subject, text: t.body(name) };
}
