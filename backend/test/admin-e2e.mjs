// Admin oqimi E2E testi (ishlab turgan backend + DB kerak):
//   E2E_ADMIN_PASSWORD=... E2E_HR_PASSWORD=... node test/admin-e2e.mjs <otpauth-admin.txt> <otpauth-hr.txt> [base]
import { readFileSync } from "node:fs";
import * as OTPAuth from "otpauth";

const [adminOtp, hrOtp, base = "http://127.0.0.1:4000"] = process.argv.slice(2);
const API = `${base}/api/v1/admin`;
const ORIGIN = "http://localhost:3000";
let pass = 0, fail = 0;
const ok = (c, m) => (c ? (pass++, console.log("✔", m)) : (fail++, console.log("✘", m)));

const code = (file, offset = 0) => OTPAuth.URI.parse(readFileSync(file, "utf8").trim()).generate({ timestamp: Date.now() + offset });

async function login(email, password, totp) {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ email, password, totp }) });
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  return { status: r.status, cookie, body: await r.json().catch(() => ({})), setCookie: r.headers.get("set-cookie") ?? "" };
}
const get = (path, cookie) => fetch(`${API}${path}`, { headers: { cookie } });

// 1. Noto'g'ri 2FA
let r = await login("admin@sifatdev.test", process.env.E2E_ADMIN_PASSWORD, "000000");
ok(r.status === 401, `noto'g'ri 2FA rad etiladi (${r.status})`);
// 2. Mavjud bo'lmagan foydalanuvchi — bir xil javob
r = await login("nobody@sifatdev.test", "x", "123456");
ok(r.status === 401 && r.body.error === "invalid", "mavjud bo'lmagan email — bir xil xabar (enumeration yo'q)");
// 3. To'g'ri kirish
const totp = code(adminOtp);
r = await login("admin@sifatdev.test", process.env.E2E_ADMIN_PASSWORD, totp);
ok(r.status === 200 && r.body.csrf, "admin parol + 2FA bilan kiradi");
ok(/HttpOnly/i.test(r.setCookie) && /SameSite=Strict/i.test(r.setCookie), "sessiya cookie: HttpOnly, SameSite=Strict");
const admin = { cookie: r.cookie, csrf: r.body.csrf };
// 4. Replay: bir xil kod qayta ishlatilmaydi
r = await login("admin@sifatdev.test", process.env.E2E_ADMIN_PASSWORD, totp);
ok(r.status === 401, "TOTP kodni qayta ishlatish (replay) bloklanadi");

// 5. Ro'yxat
let res = await get("/leads", admin.cookie);
const list = (await res.json()).items ?? [];
ok(res.status === 200 && list.length > 0, `admin so'rovlarni ko'radi (${list.length})`);
ok(list.every((l) => !("ip_hash" in l)), "IP xeshi ro'yxatda qaytmaydi");
const quick = list.find((l) => l.kind === "quick");

// 6. CSRF: tokensiz PATCH rad etiladi
res = await fetch(`${API}/leads/${quick.id}`, { method: "PATCH", headers: { cookie: admin.cookie, "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ status: "in_progress" }) });
ok(res.status === 403, `CSRF tokensiz o'zgartirish bloklanadi (${res.status})`);
res = await fetch(`${API}/leads/${quick.id}`, { method: "PATCH", headers: { cookie: admin.cookie, "content-type": "application/json", origin: ORIGIN, "x-csrf-token": admin.csrf }, body: JSON.stringify({ status: "in_progress" }) });
ok(res.status === 200, "CSRF token bilan status o'zgaradi");
res = await fetch(`${API}/leads/${quick.id}`, { method: "PATCH", headers: { cookie: admin.cookie, "content-type": "application/json", origin: "https://evil.com", "x-csrf-token": admin.csrf }, body: JSON.stringify({ status: "closed" }) });
ok(res.status === 403, "begona Origin'dan o'zgartirish bloklanadi");
res = await fetch(`${API}/leads/${quick.id}`, { method: "PATCH", headers: { cookie: admin.cookie, "content-type": "application/json", origin: ORIGIN, "x-csrf-token": admin.csrf }, body: JSON.stringify({ status: "closed", kind: "x" }) });
ok(res.status === 400, "ortiqcha maydon (mass assignment) rad etiladi");

// 7. Detal va birinchi javob vaqti
res = await get(`/leads/${quick.id}`, admin.cookie);
const det = await res.json();
ok(det.lead?.status === "in_progress" && det.lead.first_response_at, "first_response_at yoziladi (SLA ≤ 2 soat nazorati)");

// 8. CSV formula injection
res = await get("/leads.csv", admin.cookie);
const csv = await res.text();
ok(res.status === 200 && !/,"=|,"\+|,"@/.test(csv), "CSV eksportda formula injection neytrallangan");

// 9. Rol: HR faqat arizalarni ko'radi
r = await login("hr@sifatdev.test", process.env.E2E_HR_PASSWORD, code(hrOtp));
ok(r.status === 200, "HR kiradi");
res = await get("/leads", r.cookie);
const hrList = (await res.json()).items ?? [];
ok(hrList.length > 0 && hrList.every((l) => l.kind === "application"), `HR faqat arizalarni ko'radi (${hrList.length})`);
res = await get(`/leads/${quick.id}`, r.cookie);
ok(res.status === 404, "HR savdo so'roviga kira olmaydi (IDOR himoyasi)");
res = await get("/audit", r.cookie);
ok(res.status === 403, "HR audit jurnalini ko'ra olmaydi");

// 10. Fayl yuklab olish
const app = hrList[0];
res = await get(`/leads/${app.id}`, r.cookie);
const fileId = (await res.json()).files?.[0]?.id;
res = await get(`/files/${fileId}`, r.cookie);
ok(res.status === 200 && res.headers.get("content-disposition")?.startsWith("attachment") && res.headers.get("content-type") === "application/octet-stream", "fayl faqat attachment sifatida beriladi");

// 11. Chiqish — sessiya bekor bo'ladi
res = await fetch(`${API}/auth/logout`, { method: "POST", headers: { cookie: admin.cookie, origin: ORIGIN, "x-csrf-token": admin.csrf } });
res = await get("/leads", admin.cookie);
ok(res.status === 401, "logout'dan keyin sessiya ishlamaydi");

// 12. Brute-force: 5 xato → bloklash
for (let i = 0; i < 5; i++) await login("hr@sifatdev.test", "wrong-password", "123456");
r = await login("hr@sifatdev.test", process.env.E2E_HR_PASSWORD, code(hrOtp, 30_000));
ok(r.status === 423 || r.status === 429, `5 ta xato urinishdan keyin hisob bloklanadi (${r.status})`);

console.log(`\n${pass} o'tdi, ${fail} xato`);
process.exit(fail ? 1 : 0);
