/**
 * Kiritilgan matnni tozalash. Ma'lumot HTML sifatida hech qayerda render qilinmaydi
 * (React avtomatik escape qiladi, Telegram'ga parse_mode'siz yuboriladi), shuning uchun
 * bu yerda boshqaruv belgilari, nol-kenglikdagi va bidi belgilar olib tashlanadi.
 */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;

export function cleanText(input: string, maxLen: number): string {
  return input.replace(CONTROL, "").replace(INVISIBLE, "").normalize("NFC").trim().slice(0, maxLen);
}

/** Bir qatorli maydonlar: yangi qator yo'q (email header injection'dan himoya). */
export function cleanLine(input: string, maxLen: number): string {
  return cleanText(input, maxLen).replace(/[\r\n\t]+/g, " ");
}

/** Fayl nomi: faqat xavfsiz belgilar, yo'l bo'laklari yo'q. */
export function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = cleanLine(base, 120).replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/^\.+/, "");
  return cleaned || "file";
}

/** CSV/Excel formula injection himoyasi. */
export function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Telegram username: @ siz, 5-32 belgi. */
export function cleanTelegram(input: string): string {
  const v = cleanLine(input, 64).replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
  return /^[A-Za-z0-9_]{5,32}$/.test(v) ? v : "";
}
