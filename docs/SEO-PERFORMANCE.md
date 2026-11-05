# Tezlik va SEO hisoboti

Sana: 2026-11-05 · Vosita: Lighthouse 12.8 (lokal production build, mobil = 4× CPU sekinlashtirish + sekin 4G).

## Lighthouse natijalari

| Sahifa | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/uz` desktop | **99** | 100 | 100 | 100 | 0.9 s | 70 ms | 0 |
| `/uz` mobil | **85** (oldin 45) | 100 | 100 | 100 | 3.4 s | 250 ms | 0 |
| `/ru/uslugi/…` mobil | 77 | 100 | 100 | 100 | 3.8 s | 430 ms | 0 |
| `/en/work` mobil | 87 | 98 → tuzatildi | 100 | 92 → tuzatildi | 3.3 s | 240 ms | 0 |

Hajm: boshlang'ich JS **198 KB gzip** (TZ ≤ 200 KB), 3D kodi **231 KB** (≤ 300 KB, alohida yuklanadi), HTML 25 KB, TTFB ~90 ms (lokal).

### Qilingan optimallashtirishlar
- 3D sahna birinchi harakatda (sichqoncha, scroll, teginish) yoki 3–4 s dan keyin yuklanadi — matn va tugmalar avval to'liq ishlaydi.
- Hero matni scroll animatsiyasini kutmaydi (LCP tezlashdi).
- Manrope va JetBrains Mono — variable shriftlar (5 ta vazn o'rniga bitta fayl), mono shrift oldindan yuklanmaydi.
- Raqam sanagichlari React state o'rniga DOM'ni to'g'ridan-to'g'ri yangilaydi; reveal kuzatuvchisi kadrga bir marta ishlaydi.
- FPS < 30 bo'lsa sifat avtomatik pasayadi; tab yashirilganda render to'xtaydi.

Mobil LCP ≤ 2.5 s ga yetish uchun production'da: nginx gzip/brotli, CDN (statik fayllar), HTTP/2 — `infra/nginx/sifatdev.conf` da tayyor. Real foydalanuvchi ko'rsatkichlarini Search Console → Core Web Vitals'da kuzating.

## SEO — saytda qilingan

- Har sahifada: kalit so'zli `title` (≤ 60), `description` (≤ 160), `canonical`, `hreflang` (uz-Latn, ru, en, x-default), Open Graph rasm.
  - Bosh sahifa: "Sayt, mobil ilova va AI yaratish Toshkentda | SIFATDEV" / "Разработка сайтов, приложений и AI в Ташкенте" / "Web, Mobile App & AI Development in Uzbekistan".
- Schema.org: `Organization` + `ProfessionalService` (telefon, hudud, tillar), `WebSite`, `Service`, `FAQPage`, `CreativeWork`, `JobPosting`, `BreadcrumbList`.
- `sitemap.xml` (69 URL, til alternativlari bilan), `robots.txt`, `manifest.webmanifest`, `/.well-known/security.txt`.
- Ichki bog'lanish: har sahifa oxirida "Keyingi qadam" bloki, breadcrumb, xizmat ↔ keys havolalari.
- Matnlar HTML'da (3D faqat bezak) — Google to'liq o'qiydi.
- Search Console / Yandex tasdiqlash: `frontend/.env` → `GOOGLE_SITE_VERIFICATION`, `YANDEX_VERIFICATION`.

## Google'da birinchi o'rinlarga chiqish — sizdan talab qilinadigan ishlar

Hech kim (jumladan Google'ning o'zi) 1-o'rinni kafolatlay olmaydi: reyting raqobat, kontent va vaqtga bog'liq. Texnik tomoni tayyor; qolgani quyidagilar:

1. **Domen va HTTPS** — `sifatdev.uz` da ishga tushirish (HTTPS majburiy).
2. **Google Search Console** — saytni qo'shish, `sitemap.xml` ni yuborish; **Yandex Webmaster** ham.
3. **Google Business Profile** (Google Xaritalar) — kompaniya kartochkasi: manzil, telefon +998 99 750 17 17, ish vaqti, rasmlar. "IT kompaniya Toshkent" kabi mahalliy qidiruvlarda eng katta ta'sir shu.
4. **Kontent (eng muhim)** — blog maqolalari (oyiga 2–4 ta): "Toshkentda sayt yaratish narxi", "Telegram bot yaratish", "AI chatbot biznes uchun" va h.k. — 3 tilda. Blog tuzilmasi tayyor.
5. **Haqiqiy keyslar** — raqamli natijalar, skrinshotlar, mijoz fikrlari (ruxsat bilan).
6. **Tashqi havolalar** — kataloglar (2GIS, Yandex Maps, Clutch, GoodFirms), hamkorlar saytlari, IT yangiliklari, Telegram kanallar.
7. **Sharhlar** — Google Business'da mijozlardan baho so'rash.
8. **Kuzatish** — Search Console'da qaysi so'rovlar bo'yicha ko'rinayotganingizni har oy tahlil qilib, sahifa matnlarini moslash.
