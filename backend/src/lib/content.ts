import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { cleanLine, cleanText } from "./sanitize.js";

/**
 * Bir matn 3 tilda. Faqat o'zbekcha yozilsa, ru/en shu matn bilan to'ldiriladi:
 * saytda bo'sh joy qolmasligi uchun. Tarjimani keyin admin paneldan qo'shish mumkin.
 */
const langText = (max: number, multiline = false) => {
  const clean = (v: string) => (multiline ? cleanText(v, max) : cleanLine(v, max));
  const one = z.string().max(max * 2).optional().default("").transform(clean);
  return z.object({ uz: one, ru: one, en: one }).strict().transform((v) => ({ uz: v.uz, ru: v.ru || v.uz, en: v.en || v.uz }));
};

const required = (s: z.ZodType<{ uz: string; ru: string; en: string }>) =>
  s.refine((v) => v.uz.length > 0, { message: "uz_required" });

const langList = (max: number) => z.array(langText(max)).max(16).transform((a) => a.filter((x) => x.uz.length > 0));

export const SLUG = /^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/;
const MEDIA_SRC = /^\/(images\/cases\/[a-z0-9-]+\.webp|api\/v1\/media\/[0-9a-f-]{36}\.(png|jpg|webp))$/;

const device = z.enum(["laptop", "phone"]);

export const caseSchema = z
  .object({
    order: z.number().min(0).max(100_000).default(100),
    title: required(langText(120)),
    client: langText(150),
    clientHidden: z.boolean().default(false),
    industry: z.enum(["gov", "construction", "agro", "hr", "retail", "legal", "services"]),
    services: z.array(z.enum(["web", "mobile", "ai", "gov", "automation", "outsourcing"])).max(6).default([]),
    year: z.number().int().min(2000).max(2100),
    duration: langText(60).optional(),
    team: langText(60).optional(),
    summary: required(langText(300)),
    problem: langText(1500, true),
    solution: langText(1500, true),
    features: langList(160).default([]),
    results: langList(200).default([]),
    tech: z.array(z.string().max(40).transform((v) => cleanLine(v, 40))).max(30).default([]),
    hue: z.number().int().min(0).max(360).default(220),
    device: device.default("laptop"),
    url: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(300)]).optional(),
    shots: z.array(z.object({ src: z.string().regex(MEDIA_SRC), device }).strict()).max(12).default([]),
  })
  .strict();

export const vacancySchema = z
  .object({
    open: z.boolean().default(true),
    direction: z.enum(["frontend", "backend", "mobile", "design", "qa", "ai"]),
    level: langText(60),
    type: z.enum(["office", "remote", "hybrid"]),
    title: required(langText(120)),
    intro: required(langText(400, true)),
    tasks: langList(200).default([]),
    requirements: langList(200).default([]),
    conditions: langList(200).default([]),
    posted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const statsSchema = z
  .array(
    z
      .object({
        value: z.number().int().min(0).max(100_000_000),
        suffix: z.string().max(4).default("").transform((v) => cleanLine(v, 4)),
        label: required(langText(60)),
      })
      .strict(),
  )
  .max(8);

export type ContentKind = "case" | "vacancy";
export const schemaFor = (kind: ContentKind) => (kind === "case" ? caseSchema : vacancySchema);

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATHS = [path.resolve(here, "../db/seed-content.json"), path.resolve(here, "../../src/db/seed-content.json")];

/**
 * Birinchi ishga tushishda mavjud kontent bazaga ko'chiriladi. Bir marta ishlaydi:
 * admin o'chirgan yozuvlar qayta tiklanmaydi.
 */
export async function ensureContentSeed(): Promise<void> {
  const done = await pool.query("SELECT 1 FROM content_settings WHERE key = 'seeded'");
  if (done.rowCount) return;
  let raw: string | null = null;
  for (const p of SEED_PATHS) {
    raw = await readFile(p, "utf8").catch(() => null);
    if (raw) break;
  }
  if (!raw) throw new Error("seed-content.json topilmadi");
  const seed = JSON.parse(raw) as { cases: { id: string }[]; vacancies: { id: string }[]; stats: unknown };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [kind, items] of [["case", seed.cases], ["vacancy", seed.vacancies]] as const) {
      for (const { id, ...data } of items) {
        await client.query("INSERT INTO content_items(kind, id, data) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [kind, id, JSON.stringify(data)]);
      }
    }
    await client.query("INSERT INTO content_settings(key, data) VALUES ('stats', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(seed.stats)]);
    await client.query("INSERT INTO content_settings(key, data) VALUES ('seeded', 'true')");
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
