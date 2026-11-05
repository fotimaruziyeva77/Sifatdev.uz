/**
 * Kompaniya ma'lumotlari. ⚠ "TASDIQLANSIN" deb belgilangan qiymatlar SIFATDEV tomonidan
 * tasdiqlanishi kerak (TZ 10.2, 13.2). Haqiqiy bo'lmagan raqam saytda qolmasin.
 */
export const SITE = {
  name: "SIFATDEV",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sifatdev.uz",
  phone: "+998 99 750 17 17",
  phoneHref: "+998997501717",
  email: "info@sifatdev.uz", // TASDIQLANSIN
  telegram: "sifatdev_admin",
  /** WhatsApp raqami tasdiqlanmagan — bo'sh bo'lsa ko'rsatilmaydi. */
  whatsapp: "",
  address: {
    uz: "Toshkent sh., O'zbekiston", // TASDIQLANSIN
    ru: "г. Ташкент, Узбекистан",
    en: "Tashkent, Uzbekistan",
  },
  hours: { uz: "9:00–18:00 (UTC+5)", ru: "9:00–18:00 (UTC+5)", en: "9:00–18:00 (UTC+5)" },
  geo: { lat: 41.3111, lng: 69.2797 }, // TASDIQLANSIN
  /** Faqat tasdiqlangan tarmoqlar. LinkedIn/Instagram havolalari berilganda qo'shing. */
  social: [{ name: "Telegram", href: "https://t.me/sifatdev_admin" }],
  meetingUrl: "", // Cal.com havolasi (ixtiyoriy, TZ 5.6)
  /** TZ 5.1 "Raqamlar" — TASDIQLANSIN: faqat haqiqiy qiymatlar. */
  stats: [
    { value: 40, suffix: "+", label: { uz: "amalga oshirilgan loyiha", ru: "реализованных проектов", en: "projects delivered" } },
    { value: 25, suffix: "+", label: { uz: "mijoz va hamkor", ru: "клиентов и партнёров", en: "clients and partners" } },
    { value: 5, suffix: "+", label: { uz: "yillik tajriba", ru: "лет опыта", en: "years of experience" } },
    { value: 30, suffix: "", label: { uz: "jamoa a'zosi", ru: "человек в команде", en: "team members" } },
  ],
  /** Mijoz logotiplari — faqat yozma ruxsat bilan (TZ 5.1). Bo'sh bo'lsa blok ko'rsatilmaydi. */
  clientLogos: [] as { name: string; src: string }[],
  /** Mijoz fikrlari — faqat haqiqiy va ruxsat olingan. Bo'sh bo'lsa blok ko'rsatilmaydi. */
  testimonials: [] as { quote: Record<"uz" | "ru" | "en", string>; author: string; role: string }[],
};
