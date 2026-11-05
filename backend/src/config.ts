import { z } from "zod";

const bool = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default("0.0.0.0"),
    ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),
    TRUST_PROXY: bool,
    PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1),
    IP_HASH_SECRET: z.string().min(32, "kamida 32 belgi bo'lishi kerak"),
    DATA_ENC_KEY: z.string().regex(/^[0-9a-f]{64}$/i, "64 belgili hex (32 bayt) bo'lishi kerak"),
    UPLOAD_DIR: z.string().default("./storage/uploads"),
    TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
    TELEGRAM_SALES_CHAT_ID: z.string().optional().default(""),
    TELEGRAM_HR_CHAT_ID: z.string().optional().default(""),
    SMTP_HOST: z.string().optional().default(""),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_USER: z.string().optional().default(""),
    SMTP_PASS: z.string().optional().default(""),
    SMTP_FROM: z.string().default("SIFATDEV <no-reply@sifatdev.uz>"),
    TEAM_EMAIL_SALES: z.string().optional().default(""),
    TEAM_EMAIL_HR: z.string().optional().default(""),
    TURNSTILE_SECRET: z.string().optional().default(""),
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24).default(8),
    LEAD_RETENTION_DAYS: z.coerce.number().int().min(0).default(730),
  })
  .superRefine((c, ctx) => {
    if (c.NODE_ENV === "production") {
      if (!c.TURNSTILE_SECRET)
        ctx.addIssue({ code: "custom", path: ["TURNSTILE_SECRET"], message: "production'da majburiy" });
      if (c.IP_HASH_SECRET.startsWith("change-me"))
        ctx.addIssue({ code: "custom", path: ["IP_HASH_SECRET"], message: "standart qiymat ishlatilmasin" });
      if (/^0+$/.test(c.DATA_ENC_KEY))
        ctx.addIssue({ code: "custom", path: ["DATA_ENC_KEY"], message: "standart qiymat ishlatilmasin" });
      if (c.ALLOWED_ORIGINS.split(",").some((o) => o.trim().startsWith("http://")))
        ctx.addIssue({ code: "custom", path: ["ALLOWED_ORIGINS"], message: "production'da faqat https" });
    }
  });

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Maxfiy qiymatlar logga chiqmaydi — faqat maydon nomi va xabar.
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Konfiguratsiya xatosi:\n${issues}`);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
export type Config = typeof config;
