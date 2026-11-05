# SIFATDEV — korporativ 3D veb-sayt

TZ: `SIFATDEV korporativ 3D veb-sayti — Texnik topshiriq (TZ).docx`. Xavfsizlik: [docs/SECURITY.md](docs/SECURITY.md).

```
frontend/   Next.js 16 + React 19 + three.js (R3F) + Tailwind 4 — 3 tilli sayt, 3D sahna, admin panel UI
backend/    Fastify 5 + PostgreSQL — formalar, fayllar, Telegram/email outbox, admin API (2FA)
infra/      docker-compose, nginx (TLS, rate-limit), zaxira skripti
docs/       xavfsizlik auditi
```

## Lokal ishga tushirish

Talab: Node.js 22+, PostgreSQL 14+.

```bash
# 1. Backend
cd backend
cp .env.example .env          # DATABASE_URL, IP_HASH_SECRET, DATA_ENC_KEY ni to'ldiring
npm ci
npm run migrate
npm run admin:create -- --email you@sifatdev.uz --name "Ism" --role admin   # 2FA havolasini ilovaga qo'shing
npm run dev                   # http://127.0.0.1:4000

# 2. Frontend (boshqa terminalda)
cd frontend
cp .env.example .env.local
npm ci
npm run dev                   # http://localhost:3000  (/api → backend'ga proksi)
```

Admin panel: `http://localhost:3000/admin`.

Testlar: `cd backend && npm test` (unit), ishlab turgan server bilan — `node test/admin-e2e.mjs <otp-admin.txt> <otp-hr.txt>`.

## Production

```bash
cd infra
cp .env.example .env                       # POSTGRES_PASSWORD, SITE_URL, kalitlar
cp ../backend/.env.example backend.env     # NODE_ENV=production, ALLOWED_ORIGINS=https://sifatdev.uz, Telegram, SMTP, Turnstile
# TLS sertifikatlari: infra/certs/fullchain.pem, privkey.pem (certbot)
docker compose up -d --build
docker compose exec backend node dist/scripts/create-admin.js --email ... --name ... --role admin
```

Zaxira: `infra/backup.sh` ni cron'ga qo'shing (kunlik, 30 kun).

## Brend (TZ 6.2, 13.2)

SIFAT logotipi asosida: qora fon, oq matn, qizil urg'u `#E3262F`. Logotip vektori — `frontend/src/content/brand.ts` (asl fayllar: `frontend/public/brand/`). Shrift — Manrope (lotin + kirill), yorliqlar logotip uslubida keng intervalli bosh harflarda.

## 3D qatlam (TZ 7)

- **Orbita maydoni** (`components/three/glsl.ts → FIELD_*`): antigravity yondashuvidagi fon — minglab cho'zinchoq zarracha kursor atrofida halqa hosil qiladi, markazga yo'naladi, aylanadi; kursor bo'lmasa avtomatik orbita. Ranglar SIFATDEV palitrasidan, Google brend elementlari ishlatilmagan.
- **Sifat yadrosi** (`CORE_*`): 18k–100k oq/kumush zarracha, qizil urg‘ular bilan. Ochilishda sferadan **SIFAT logotipiga** yig‘iladi, so‘ng scroll bo‘yicha morf: logotip → `</>` → smartfon → neyron tarmoq → qalqon → tishli g‘ildirak → globus → to‘lqin okeani → DNK spirali → globus → halqa. Kursor itaradi va girdob qiladi. Shakllar `shapes.ts`da oldindan hisoblanadi.
- Sahifa bo'limlari `data-shape`, `data-x`, `data-scale`, `data-opacity`, `data-depth`, `data-push` atributlari bilan sahnani boshqaradi (`SceneDirector.tsx`). Scroll-jacking yo'q.
- Adaptiv sifat (`lib/gpu.ts`): GPU darajasi evristika bilan, FPS < 30 bo'lsa DPR → partikul soni kamayadi → statik poster. WebGL2 yo'q / kuchsiz qurilma / context lost → poster.
- "Kam harakat": `prefers-reduced-motion` yoki footer kaliti — statik kadr, animatsiyalar o'chadi.
- 3D kodi alohida chunk, hero matnidan keyin (`requestIdleCallback`) yuklanadi.

## Kontent

Hozircha kontent `frontend/src/content/*.ts` da (CMS'ga o'tkazishga tayyor tuzilma). **`TASDIQLANSIN`** deb belgilangan qiymatlarni almashtiring:
`site.ts` (telefon, manzil, raqamlar, ijtimoiy tarmoqlar), `cases.ts` (muddat, jamoa, natijalar), `company.ts` (tarix, vakansiyalar), `privacy.ts` (yurist).

## TZ'dan ongli chetlashishlar

| TZ | Qilingan | Sabab |
|---|---|---|
| GSAP, Framer Motion | CSS + IntersectionObserver, o'z sticky/gorizontal scroll | Boshlang'ich JS ≤ 200 KB byudjeti |
| detect-gpu | O'z evristikasi + FPS nazorati | detect-gpu benchmark'larni uchinchi tomon CDN'dan yuklaydi (TZ 9.5) |
| postprocessing Bloom | Additive blending bilan yorug'lik | Mobil unumdorlik |
| GLB qurilma maketlari | CSS 3D maketlar | Real skrinshotlar/modellar tayyor bo'lgach `DeviceMock` ga `image` beriladi |
| Payload/Strapi CMS | Admin panel (so'rovlar CRUD, rollar, 2FA, audit) + TS kontent fayllari | Matnlarni tahrirlash uchun headless CMS keyingi bosqichda ulanadi |
| Blog | Infratuzilma tayyor, maqola yo'q — menyuda yashirin, `noindex` | TZ: 2-bosqich |
