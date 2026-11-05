import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cleanLine, cleanText, cleanTelegram } from "./sanitize.js";

export const LOCALES = ["uz", "ru", "en"] as const;
export const SERVICES = ["web", "mobile", "ai", "gov", "automation", "outsourcing"] as const;

const line = (min: number, max: number) =>
  z
    .string()
    .max(max * 2)
    .transform((v) => cleanLine(v, max))
    .pipe(z.string().min(min).max(max));

const optLine = (max: number) =>
  z
    .string()
    .max(max * 2)
    .optional()
    .transform((v) => (v ? cleanLine(v, max) : ""));

const text = (max: number) =>
  z
    .string()
    .max(max * 2)
    .optional()
    .transform((v) => (v ? cleanText(v, max) : ""));

/** O'zbekiston uchun +998, boshqa davlatlar — xalqaro format (E.164). */
export const phone = z
  .string()
  .max(40)
  .transform((v, ctx) => {
    const p = parsePhoneNumberFromString(cleanLine(v, 40), "UZ");
    if (!p || !p.isValid()) {
      ctx.addIssue({ code: "custom", message: "invalid_phone" });
      return z.NEVER;
    }
    return p.number;
  });

const optPhone = z
  .string()
  .max(40)
  .optional()
  .transform((v, ctx) => {
    if (!v || !v.trim()) return "";
    const p = parsePhoneNumberFromString(cleanLine(v, 40), "UZ");
    if (!p || !p.isValid()) {
      ctx.addIssue({ code: "custom", message: "invalid_phone" });
      return z.NEVER;
    }
    return p.number;
  });

const email = z.string().max(254).trim().toLowerCase().pipe(z.email());
const optEmail = z
  .string()
  .max(254)
  .optional()
  .transform((v) => (v ? v.trim().toLowerCase() : ""))
  .pipe(z.union([z.literal(""), z.email()]));

const consent = z.union([z.literal(true), z.literal("true"), z.literal("on")]).transform(() => true as const);

const utmKey = z.string().max(200).optional().transform((v) => (v ? cleanLine(v, 100) : undefined));

export const sourceSchema = z
  .object({
    page: z.string().max(300).regex(/^\/[^\s]*$/).optional(),
    referrer: z.string().max(300).optional(),
    device: z.enum(["mobile", "tablet", "desktop"]).optional(),
    utm_source: utmKey,
    utm_medium: utmKey,
    utm_campaign: utmKey,
    utm_term: utmKey,
    utm_content: utmKey,
  })
  .strip()
  .prefault({});

const common = {
  locale: z.enum(LOCALES),
  website: z.string().max(200).optional(), // honeypot — bo'sh bo'lishi kerak
  turnstileToken: z.string().max(2048).optional(),
};

export const quickSchema = z.object({
  ...common,
  name: line(2, 100),
  contact: line(3, 100),
  comment: text(1000),
  consent,
  source: sourceSchema,
});

export const briefSchema = z
  .object({
    ...common,
    services: z.array(z.enum(SERVICES)).min(1).max(SERVICES.length),
    stage: z.enum(["idea", "prototype", "improve"]).optional(),
    budget: z.enum(["lt5k", "5-15k", "15-40k", "40-100k", "gt100k", "unknown"]).optional(),
    currency: z.enum(["UZS", "USD"]).default("USD"),
    timeline: z.enum(["asap", "1-3m", "3-6m", "6m+", "flexible"]).optional(),
    description: text(2000),
    caseRef: optLine(120),
    name: line(2, 100),
    company: optLine(150),
    phone: optPhone,
    email: optEmail,
    telegram: z.string().max(64).optional().transform((v) => (v ? cleanTelegram(v) : "")),
    preferredContact: z.enum(["phone", "telegram", "email", "whatsapp"]).optional(),
    consent,
    source: sourceSchema,
  })
  .refine((d) => d.phone || d.email, { message: "phone_or_email_required", path: ["phone"] });

export const applicationSchema = z.object({
  ...common,
  vacancy: z.string().max(120).regex(/^[a-z0-9-]+$/).default("general"),
  name: line(2, 100),
  phone,
  email,
  portfolio: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v ? v.trim() : ""))
    .pipe(z.union([z.literal(""), z.url({ protocol: /^https?$/ })])),
  comment: text(1000),
  consent,
  source: sourceSchema,
});

export const subscribeSchema = z.object({
  ...common,
  email,
  consent,
});

export type QuickInput = z.infer<typeof quickSchema>;
export type BriefInput = z.infer<typeof briefSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
