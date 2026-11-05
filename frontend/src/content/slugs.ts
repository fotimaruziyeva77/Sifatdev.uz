/**
 * Faqat slug'lar (har tilda alohida, TZ 4). Til almashtirgich uchun clientga ham yuboriladi,
 * shuning uchun bu fayl yengil saqlanadi — matnlar boshqa fayllarda.
 */
import type { L } from "@/lib/i18n";

export const SERVICE_SLUGS = {
  web: { uz: "veb-platformalar", ru: "veb-platformy", en: "web-platforms" },
  mobile: { uz: "mobil-ilovalar", ru: "mobilnye-prilozheniya", en: "mobile-apps" },
  ai: { uz: "suniy-intellekt", ru: "iskusstvennyj-intellekt", en: "ai-agents" },
  gov: { uz: "davlat-tizimlari", ru: "gosudarstvennye-sistemy", en: "government-systems" },
  automation: { uz: "avtomatlashtirish", ru: "avtomatizaciya", en: "automation" },
  outsourcing: { uz: "autsors", ru: "autsorsing", en: "dedicated-team" },
} satisfies Record<string, L>;

export const CASE_SLUGS = {
  inspection: { uz: "inspeksiya-nazorat-tizimi", ru: "sistema-kontrolya-inspekcii", en: "inspection-control-system" },
  construction: { uz: "qurilish-nazorati-platformasi", ru: "platforma-kontrolya-stroitelstva", en: "construction-oversight-platform" },
  "ai-office": { uz: "ai-ofis", ru: "ai-ofis", en: "ai-office" },
  kadrvision: { uz: "kadrvision", ru: "kadrvision", en: "kadrvision" },
  sellvia: { uz: "sellvia", ru: "sellvia", en: "sellvia" },
  sbozor: { uz: "sbozor", ru: "sbozor", en: "sbozor" },
  gasnlab: { uz: "gasnlab", ru: "gasnlab", en: "gasnlab" },
  eqhp: { uz: "eqhp-qurilish-hujjatlari", ru: "eqhp-stroitelnye-dokumenty", en: "eqhp-construction-documents" },
  qzithb: { uz: "quyi-zarafshon-havza-boshqarmasi", ru: "nizhne-zarafshanskoe-upravlenie", en: "lower-zarafshan-basin-authority" },
  "ai-call-center": { uz: "ai-call-markaz", ru: "ai-koll-centr", en: "ai-call-center" },
  "legal-ai": { uz: "huquqshunos-ai-agent", ru: "yuridicheskij-ai-agent", en: "legal-ai-agent" },
  greenhouse: { uz: "issiqxona-boshqaruvi", ru: "upravlenie-teplicej", en: "greenhouse-management" },
} satisfies Record<string, L>;

export const VACANCY_SLUGS = {
  "frontend-react": { uz: "frontend-dasturchi-react", ru: "frontend-razrabotchik-react", en: "frontend-developer-react" },
  "python-backend": { uz: "python-backend-dasturchi", ru: "python-backend-razrabotchik", en: "python-backend-developer" },
} satisfies Record<string, L>;

export const POST_SLUGS: Record<string, L> = {};

export type ServiceId = keyof typeof SERVICE_SLUGS;
export type CaseId = keyof typeof CASE_SLUGS;
export type VacancyId = keyof typeof VACANCY_SLUGS;
