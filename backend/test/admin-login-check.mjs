// Admin kirishini tekshirish: ADMIN_LOGIN, ADMIN_PASSWORD, ADMIN_TOTP_SECRET env'dan olinadi.
//   node test/admin-login-check.mjs [base]
import * as OTPAuth from "otpauth";

const base = process.argv[2] ?? "http://127.0.0.1:3000";
const { ADMIN_LOGIN, ADMIN_PASSWORD, ADMIN_TOTP_SECRET } = process.env;
const totp = new OTPAuth.TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(ADMIN_TOTP_SECRET) });
const post = (body) =>
  fetch(`${base}/api/v1/admin/auth/login`, { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3000" }, body: JSON.stringify(body) });

const bad = await post({ email: ADMIN_LOGIN, password: ADMIN_PASSWORD, totp: "000000" });
console.log("noto'g'ri 2FA:", bad.status);
const ok = await post({ email: ADMIN_LOGIN, password: ADMIN_PASSWORD, totp: totp.generate() });
const data = await ok.json();
console.log("to'g'ri kirish:", ok.status, JSON.stringify(data.user ? { email: data.user.email, role: data.user.role } : data.error));
const cookie = (ok.headers.get("set-cookie") ?? "").split(";")[0];
const me = await fetch(`${base}/api/v1/admin/me`, { headers: { cookie } });
console.log("/me:", me.status);
await fetch(`${base}/api/v1/admin/auth/logout`, { method: "POST", headers: { cookie, origin: "http://localhost:3000", "x-csrf-token": data.csrf } });
