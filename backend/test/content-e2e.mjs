// Kontent API'ni boshidan oxirigacha tekshirish (faqat lokal test bazasida).
//   TEST_PASSWORD=... ADMIN_SECRET=... SALES_SECRET=... HR_SECRET=... node test/content-e2e.mjs [base]
// Foydalanuvchilar: e2e-admin@test.local, e2e-sales@test.local, e2e-hr@test.local
import * as OTPAuth from "otpauth";

const base = process.argv[2] ?? "http://127.0.0.1:4000";
const origin = "http://localhost:3000";
const { TEST_PASSWORD, ADMIN_SECRET, SALES_SECRET, HR_SECRET } = process.env;
let failed = 0;
const check = (name, ok, extra = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "XATO"} ${name}${extra ? ` (${extra})` : ""}`);
};

async function login(email, secret) {
  const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
  const r = await fetch(`${base}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password: TEST_PASSWORD, totp: totp.generate() }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`login ${email}: ${r.status} ${JSON.stringify(data)}`);
  return { cookie: (r.headers.get("set-cookie") ?? "").split(";")[0], csrf: data.csrf };
}

const call = (s, method, path, body, opts = {}) =>
  fetch(`${base}/api/v1${path}`, {
    method,
    headers: {
      ...(s ? { cookie: s.cookie } : {}),
      ...(s && !opts.noCsrf ? { "x-csrf-token": s.csrf } : {}),
      origin,
      ...(body && !(body instanceof FormData) ? { "content-type": "application/json" } : {}),
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

const content = async () => (await fetch(`${base}/api/v1/content`)).json();

const admin = await login("e2e-admin@test.local", ADMIN_SECRET);
const sales = await login("e2e-sales@test.local", SALES_SECRET);
const hr = await login("e2e-hr@test.local", HR_SECRET);

const before = await content();
check("ommaviy kontent: 13 loyiha, 2 vakansiya, 4 statistika", before.cases.length === 13 && before.vacancies.length === 2 && before.stats.length === 4, `${before.cases.length}/${before.vacancies.length}/${before.stats.length}`);

const { id: _c, ...caseData } = before.cases[0];
const { id: _v, ...vacData } = before.vacancies[0];
const ID = "e2e-loyiha";
const newCase = { ...caseData, title: { uz: "E2E loyiha", ru: "E2E loyiha", en: "E2E loyiha" } };

check("kirmagan foydalanuvchi: 401", (await call(null, "GET", "/admin/content/case")).status === 401);
check("CSRF'siz yozish: 403", (await call(admin, "PUT", `/admin/content/case/${ID}`, { data: newCase, create: true }, { noCsrf: true })).status === 403);
check("sotuv roli loyihani o'qiy olmaydi: 403", (await call(sales, "GET", "/admin/content/case")).status === 403);
check("sotuv roli statistikani o'zgartira olmaydi: 403", (await call(sales, "PUT", "/admin/stats", { stats: before.stats })).status === 403);
check("HR loyiha yarata olmaydi: 403", (await call(hr, "PUT", `/admin/content/case/${ID}`, { data: newCase, create: true })).status === 403);
check("noto'g'ri identifikator: 400", (await call(admin, "PUT", "/admin/content/case/..%2Fetc", { data: newCase, create: true })).status === 400);
check("javascript: havola rad etiladi: 422", (await call(admin, "PUT", `/admin/content/case/${ID}`, { data: { ...newCase, url: "javascript:alert(1)" }, create: true })).status === 422);
check("begona rasm manzili rad etiladi: 422", (await call(admin, "PUT", `/admin/content/case/${ID}`, { data: { ...newCase, shots: [{ src: "https://evil.example/a.webp", device: "laptop" }] }, create: true })).status === 422);

let r = await call(admin, "PUT", `/admin/content/case/${ID}`, { data: newCase, create: true, published: true });
check("loyiha yaratildi", r.status === 200, String(r.status));
check("takror yaratish: 409", (await call(admin, "PUT", `/admin/content/case/${ID}`, { data: newCase, create: true })).status === 409);
check("saytda ko'rindi", (await content()).cases.some((c) => c.id === ID));

r = await call(admin, "PUT", `/admin/content/case/${ID}`, { data: newCase, published: false });
check("yashirildi", r.status === 200 && !(await content()).cases.some((c) => c.id === ID));

const VID = "e2e-vakansiya";
r = await call(hr, "PUT", `/admin/content/vacancy/${VID}`, { data: vacData, create: true });
check("HR vakansiya yaratadi", r.status === 200, String(r.status));
check("vakansiya saytda", (await content()).vacancies.some((v) => v.id === VID));

const newStats = before.stats.map((s, i) => (i === 0 ? { ...s, value: s.value + 7 } : s));
r = await call(admin, "PUT", "/admin/stats", { stats: newStats });
check("statistika o'zgardi", r.status === 200 && (await content()).stats[0].value === newStats[0].value);
check("noto'g'ri statistika: 422", (await call(admin, "PUT", "/admin/stats", { stats: [{ value: "x" }] })).status === 422);

// 1x1 PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/AAAMBAQAY3Y2wAAAAAElFTkSuQmCC", "base64");
const upload = (s, buf, name, type) => {
  const f = new FormData();
  f.append("file", new Blob([buf], { type }), name);
  return call(s, "POST", "/admin/media", f);
};
r = await upload(admin, png, "a.png", "image/png");
const up = await r.json();
check("rasm yuklandi", r.status === 201 && /^\/api\/v1\/media\//.test(up.src ?? ""), String(r.status));
const got = await fetch(`${base}${up.src}`);
check("rasm ochiq va turi to'g'ri", got.status === 200 && got.headers.get("content-type") === "image/png");
r = await upload(admin, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "x.svg", "image/svg+xml");
check("SVG rad etildi", r.status === 422, String(r.status));
r = await upload(admin, Buffer.from("<html>not an image</html>"), "x.png", "image/png");
check("rasmga o'xshatilgan fayl rad etildi", r.status === 422, String(r.status));
check("yo'l bilan hujum: 404", [400, 404].includes((await fetch(`${base}/api/v1/media/..%2F..%2Fpackage.json`)).status));
check("sotuv roli rasm yuklay olmaydi: 403", (await upload(sales, png, "a.png", "image/png")).status === 403);

r = await call(admin, "PUT", `/admin/content/case/${ID}`, { data: { ...newCase, shots: [{ src: up.src, device: "laptop" }] }, published: true });
check("yuklangan rasm loyihaga biriktirildi", r.status === 200, String(r.status));

if (process.argv.includes("--keep")) {
  console.log("Sinov yozuvlari qoldirildi (--keep).");
} else {
  check("loyiha o'chirildi", (await call(admin, "DELETE", `/admin/content/case/${ID}`)).status === 200);
  check("vakansiya o'chirildi", (await call(hr, "DELETE", `/admin/content/vacancy/${VID}`)).status === 200);
  check("HR loyihani o'chira olmaydi: 403", (await call(hr, "DELETE", `/admin/content/case/${before.cases[0].id}`)).status === 403);
  await call(admin, "PUT", "/admin/stats", { stats: before.stats });
  const after = await content();
  check("hammasi joyiga qaytdi", after.cases.length === 13 && after.vacancies.length === 2 && after.stats[0].value === before.stats[0].value);
}
console.log(failed ? `\n${failed} ta XATO` : "\nHammasi o'tdi");
process.exit(failed ? 1 : 0);
