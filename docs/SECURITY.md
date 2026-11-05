# SIFATDEV sayti — xavfsizlik auditi va himoya choralari

Sana: 2026-11-05 · Qamrov: `frontend/` (Next.js 16), `backend/` (Fastify 5 + PostgreSQL), `infra/` (Docker, nginx).
Asos: TZ 9.4–9.5, OWASP Top 10 (2021/2025), OWASP ASVS L2 tanlangan bandlari.

## 1. Tahdid modeli (qisqa)

| Aktiv | Tahdid | Himoya |
|---|---|---|
| Mijoz so'rovlari (shaxsiy ma'lumot) | Sizib chiqish, ruxsatsiz o'qish | Admin 2FA, rollar, IDOR tekshiruvi, IP xeshlangan, O'zbekistonda saqlash, saqlash muddati |
| Yuklangan fayllar (CV, TZ) | Zararli fayl, RCE, path traversal | Magic-bytes tekshiruvi, tasodifiy nom, ommaviy bo'lmagan papka, faqat `attachment` |
| Admin panel | Brute-force, sessiya o'g'irlash, CSRF | argon2id, TOTP + replay himoyasi, bloklash, `__Host-` cookie, CSRF token + Origin |
| Formalar | Spam, DoS, injection | Honeypot, Turnstile, rate-limit (app + nginx), zod validatsiya, parametrlangan SQL |
| Sayt sahifalari | XSS, clickjacking | Nonce'li qat'iy CSP, `frame-ancestors 'none'`, React escape, JSON-LD escape |
| Telegram/SMTP kalitlari | Sizib chiqish | Faqat env, logda redaction, repoga kirmaydi |

## 2. Joriy qilingan choralar (OWASP Top 10 bo'yicha)

### A01 — Kirish nazorati
- Barcha `/api/v1/admin/*` (login'dan tashqari) `requireAdmin()` orqali: sessiya → foydalanuvchi faol → rol.
- Rollar: `admin` (hammasi), `sales` (brif/tezkor/obuna), `hr` (faqat arizalar), `content`. **IDOR**: so'rov va fayl ID bo'yicha olinganda ham `kind = ANY(visibleKinds(role))` sharti qo'yiladi — HR savdo so'rovini ID bilan ham ocha olmaydi (E2E testda tekshirilgan).
- O'chirish (GDPR) faqat `admin`. Audit jurnalini faqat `admin` ko'radi.
- Fayllar faqat autentifikatsiyadan keyin, `Content-Disposition: attachment`, `application/octet-stream`, `no-store` bilan beriladi — brauzerda ijro etilmaydi.

### A02 — Kriptografiya
- Parollar: **argon2id** (m=19 MiB, t=2, p=1 — OWASP tavsiyasi).
- TOTP sirlari bazada **AES-256-GCM** bilan shifrlangan (`DATA_ENC_KEY`); buzilgan shifr matni rad etiladi (test).
- Sessiya tokeni 256-bit tasodifiy, bazada faqat **SHA-256 xeshi** saqlanadi.
- IP manzil xom holda saqlanmaydi — HMAC-SHA256 (`IP_HASH_SECRET`).
- TLS 1.2+/1.3, HSTS preload, OCSP stapling (nginx). SMTP: `requireTLS`, TLS 1.2+, sertifikat tekshiruvi.

### A03 — Injection
- SQL: faqat parametrlangan so'rovlar (`$1, $2…`), string konkatenatsiya yo'q. `'); DROP TABLE` matni oddiy ma'lumot sifatida saqlanishi tekshirildi.
- Email header injection: bir qatorli maydonlardan `\r\n` olib tashlanadi; xatlar faqat matnli, `disableFileAccess/disableUrlAccess`.
- Telegram: `parse_mode` ishlatilmaydi — foydalanuvchi matni HTML/Markdown sifatida talqin qilinmaydi.
- CSV/Excel formula injection: `= + - @` bilan boshlanuvchi katakchalarga `'` qo'shiladi (test).
- Boshqaruv, nol-kenglikdagi va bidi belgilar (Trojan Source) tozalanadi.

### A04 — Xavfsiz dizayn
- Transactional outbox: so'rov bazaga yozilmasdan xabar ketmaydi; Telegram ishlamasa eksponensial qayta urinish (TZ 8.2).
- Honeypot ishlaganda botga "muvaffaqiyat" qaytariladi (signal bermaslik uchun), ma'lumot saqlanmaydi.
- Login xatosida qaysi maydon noto'g'ri ekani aytilmaydi; mavjud bo'lmagan foydalanuvchi uchun ham argon2 hisoblanadi (timing/enumeration himoyasi).

### A05 — Noto'g'ri konfiguratsiya
- **CSP** (har so'rovga yangi nonce, `strict-dynamic`): `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`. Analitika/Turnstile domenlari faqat ular yoqilganda qo'shiladi.
- `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (kamera, mikrofon, geolokatsiya, to'lov o'chiq), `COOP`. `X-Powered-By` o'chirilgan, `server_tokens off`.
- API: `default-src 'none'` CSP, `CORP: same-origin`, `Cache-Control: no-store`.
- Production'da konfiguratsiya validatsiyasi: Turnstile kaliti, standart bo'lmagan maxfiy kalitlar, faqat `https` origin — aks holda server ishga tushmaydi.
- Xato javoblarida stack trace yoki ichki xabar qaytmaydi.
- Docker: root bo'lmagan foydalanuvchi, `read_only` FS, `cap_drop: ALL`, `no-new-privileges`; tashqariga faqat nginx ochiq; PostgreSQL ichki tarmoqda.

### A06 — Zaif kutubxonalar
- O'rnatishda `npm audit` 4 ta zaiflik topdi va **tuzatildi**: `nodemailer` 7 → 10 (15 ta advisory, jumladan domen allow-list bypass), `zod` 3 → 4 (xotira DoS), `next` 15 → 16 (ichki `postcss` XSS/fayl o'qish). Hozir: **0 vulnerabilities** (ikkala paket).
- Dependabot (npm, docker, actions) va CI'da `npm audit --audit-level=high`.

### A07 — Autentifikatsiya
- Parol + **TOTP 2FA majburiy**; TOTP kodi qayta ishlatilmaydi (`totp_last_step`).
- 5 xato → 15 daqiqa bloklash; login endpoint: app 10/15 daq + nginx 5/daq.
- Parol siyosati: ≥ 12 belgi, 3 turdagi belgi. Parol terminal tarixiga tushmasligi uchun interaktiv so'raladi.
- Cookie: `__Host-sid`, `HttpOnly`, `Secure`, `SameSite=Strict`, 8 soat TTL; logout bazadagi sessiyani o'chiradi.

### A08 — Ma'lumot yaxlitligi
- Fayllar: kengaytma **va** magic-bytes (file-type) mos kelishi shart; SHA-256 yoziladi; `wx` bayrog'i bilan (ustiga yozmaslik), `0600` ruxsat.
- `package-lock.json` qotirilgan, CI'da `npm ci`.

### A09 — Log va monitoring
- Pino loglarida `cookie`, `authorization`, `x-csrf-token`, `set-cookie` yashiriladi; URL query logga yozilmaydi.
- Audit jurnali: login/xato login, so'rovni ko'rish, o'zgartirish, eksport, fayl yuklab olish, o'chirish (kim, qachon, IP xeshi).
- Tavsiya: Sentry + uptime monitoring (TZ 9.1) — DSN'lar `.env`ga qo'shiladi.

### A10 — SSRF
- Backend faqat qat'iy belgilangan manzillarga murojaat qiladi (Telegram API, Turnstile, SMTP). Foydalanuvchi bergan URL (portfolio) faqat saqlanadi, server uni ochmaydi; faqat `http(s)` sxemasi qabul qilinadi (`javascript:` rad etiladi).

### CSRF va CORS
- Admin o'zgartirishlari: `SameSite=Strict` + sessiyaga bog'langan CSRF token (`x-csrf-token`, timing-safe taqqoslash) + Origin allow-list.
- Ommaviy formalar: Origin allow-list (production'da Origin majburiy), CORS faqat `ALLOWED_ORIGINS`.

### Spam va DoS
- Honeypot, Cloudflare Turnstile (server tomonida tekshiruv), formalarga **5 so'rov/soat/IP**, global 120/daq, nginx `limit_req`/`limit_conn`.
- Body limit 64 KB (JSON), multipart: 1 fayl, 40 maydon, maydon ≤ 8 KB, fayl ≤ 10/5 MB; zod'da har bir satr uzunligi cheklangan.

### Maxfiylik va qonunchilik (TZ 9.5)
- Ma'lumotlar O'zbekistondagi serverda; shriftlar o'z serverimizdan (Google'ga IP ketmaydi); xarita faqat bosilganda yuklanadi.
- GDPR: EI hududi uchun analitika faqat rozilikdan keyin; admin'da "butunlay o'chirish"; yopilgan so'rovlar `LEAD_RETENTION_DAYS` (standart 730 kun) dan keyin avtomatik o'chiriladi.
- Kunlik zaxira (`infra/backup.sh`), 30 kun, ixtiyoriy GPG shifrlash.

## 3. Bajarilgan testlar

| Test | Natija |
|---|---|
| `backend: npm test` — 13 ta unit (sanitize, CSV, AES-GCM, fayl turi, path traversal, zod, parol siyosati) | ✅ 13/13 |
| `backend/test/admin-e2e.mjs` — 20 ta E2E (2FA, replay, enumeration, CSRF, Origin, mass assignment, IDOR, rollar, fayl, logout, bloklash) | ✅ 20/20 |
| Qo'lda: soxta PDF (PHP kod) → `file_rejected`; `../../../etc/passwd.pdf` → `passwd.pdf` sifatida tasodifiy nomda; begona Origin → 403; honeypot; rate-limit 5/soat → 429; SQLi matni xavfsiz saqlandi; UTF-8 (kirill) to'g'ri | ✅ |
| CSP nonce HTML'dagi barcha skriptlarda va sarlavhada bir xil | ✅ |
| `npm audit --omit=dev` (ikkala paket) | ✅ 0 |

## 4. Qolgan xavflar va tavsiyalar (ishga tushirishdan oldin)

| # | Daraja | Masala | Tavsiya |
|---|---|---|---|
| 1 | Yuqori | Production maxfiy kalitlari hali yaratilmagan | `openssl rand -hex 32` bilan `IP_HASH_SECRET`, `DATA_ENC_KEY`; parollar menejerida saqlash |
| 2 | O'rta | Rate-limit xotirada (bitta instansiya uchun yetarli) | Bir nechta backend instansiyasi bo'lsa — Redis store |
| 3 | O'rta | Antivirus tekshiruvi yo'q (TZ'da ixtiyoriy) | ClamAV konteyneri, `storeUpload`dan keyin skan |
| 4 | O'rta | `style-src 'unsafe-inline'` (React SSR style atributlari) | Skript CSP qat'iy; uslublar uchun xavf past. Kelajakda hash'lar |
| 5 | Past | Yandex Webvisor sessiyalarni yozadi | Metrika sozlamasida forma maydonlarini yashirish ("Записывать содержимое полей" o'chiq) |
| 6 | Past | Admin panel internetdan ochiq | nginx'da ofis IP allow-list yoki VPN (konfiguratsiyada izohda tayyor) |
| 7 | Jarayon | Pentest | Ishga tushirishdan oldin tashqi pentest (OWASP ZAP baseline CI'ga qo'shish) |
| 8 | Huquqiy | Maxfiylik siyosati, davlat reestri | Yurist tasdig'i (TZ 13.2) |
