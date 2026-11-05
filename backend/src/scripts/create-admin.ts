/**
 * Admin foydalanuvchi yaratish:
 *   npm run admin:create -- --email a@sifatdev.uz --name "Ism" --role admin
 * Parol interaktiv so'raladi (terminal tarixiga tushmasligi uchun) yoki ADMIN_PASSWORD env'dan olinadi.
 * Natijada 2FA uchun otpauth:// havola chiqadi — Google Authenticator / 1Password'ga qo'shing.
 */
import { parseArgs } from "node:util";
import qrcode from "qrcode-terminal";
import { createInterface } from "node:readline/promises";
import { pool } from "../db/pool.js";
import { migrate } from "../db/migrate.js";
import { encrypt } from "../lib/crypto.js";
import { hashPassword, newTotp, passwordPolicy } from "../security/auth.js";

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string", default: "admin" } },
});
if (!values.email || !values.name) {
  console.error("Foydalanish: npm run admin:create -- --email EMAIL --name ISM [--role admin|sales|hr|content]");
  process.exit(1);
}
if (!["admin", "sales", "hr", "content"].includes(values.role!)) {
  console.error("Rol noto'g'ri");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD ?? "";
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question("Parol (kamida 12 belgi): ");
  rl.close();
}
const err = passwordPolicy(password);
if (err) {
  console.error(`Parol talabga javob bermaydi: ${err}`);
  process.exit(1);
}

await migrate();
const totp = newTotp(values.email);
await pool.query(
  `INSERT INTO admin_users(email, name, password_hash, totp_secret, role) VALUES ($1,$2,$3,$4,$5)`,
  [values.email.toLowerCase(), values.name, await hashPassword(password), encrypt(totp.secret.base32), values.role],
);
console.log("\nFoydalanuvchi yaratildi.");
console.log("Google Authenticator / Microsoft Authenticator / 1Password bilan QR-kodni skanerlang.");
console.log("Bu QR-kod va kalitni hech kimga yubormang, skrinshot qilib saqlamang.\n");
qrcode.generate(totp.toString(), { small: true });
console.log("\nQo'lda kiritish uchun kalit:", totp.secret.base32);
console.log("Kirish: <sayt>/admin — email, parol va ilovadagi 6 xonali kod.");
await pool.end();
