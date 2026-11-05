import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.DATABASE_URL ??= "postgres://x:y@127.0.0.1:1/none";
process.env.IP_HASH_SECRET ??= "test-secret-test-secret-test-secret-123";
process.env.DATA_ENC_KEY ??= "a".repeat(64);
process.env.UPLOAD_DIR = await mkdtemp(path.join(tmpdir(), "sifat-up-"));
process.env.NODE_ENV = "test";

const { cleanFileName, cleanLine, csvCell, cleanTelegram } = await import("../src/lib/sanitize.js");
const { encrypt, decrypt } = await import("../src/lib/crypto.js");
const { storeUpload, resolveStored, BRIEF_FILES, CV_FILES, FileRejected } = await import("../src/lib/files.js");
const { briefSchema, quickSchema, applicationSchema } = await import("../src/lib/schemas.js");
const { passwordPolicy } = await import("../src/security/auth.js");

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001", "hex");

test("fayl nomi: yo'l bo'laklari va xavfli belgilar olib tashlanadi", () => {
  assert.equal(cleanFileName("../../etc/passwd"), "passwd");
  assert.equal(cleanFileName("..\\..\\win.ini"), "win.ini");
  assert.equal(cleanFileName(".htaccess"), "htaccess");
  assert.ok(!cleanFileName("a<script>.pdf").includes("<"));
});

test("bir qatorli maydon: CRLF (header injection) yo'qoladi", () => {
  assert.equal(cleanLine("Ali\r\nBcc: x@evil.com", 100), "Ali Bcc: x@evil.com");
  assert.equal(cleanLine("a‮b​c", 10), "abc");
});

test("CSV formula injection neytrallashtiriladi", () => {
  assert.equal(csvCell("=HYPERLINK(\"x\")"), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell("+1"), `"'+1"`);
  assert.equal(csvCell("@SUM"), `"'@SUM"`);
  assert.equal(csvCell("normal"), `"normal"`);
});

test("telegram username tekshiruvi", () => {
  assert.equal(cleanTelegram("@sifat_dev"), "sifat_dev");
  assert.equal(cleanTelegram("https://t.me/sifatdev"), "sifatdev");
  assert.equal(cleanTelegram("a b<c"), "");
});

test("AES-GCM: shifrlash va buzilgan ma'lumotni rad etish", () => {
  const e = encrypt("JBSWY3DPEHPK3PXP");
  assert.equal(decrypt(e), "JBSWY3DPEHPK3PXP");
  const parts = e.split(".");
  parts[3] = Buffer.from("tampered").toString("base64url");
  assert.throws(() => decrypt(parts.join(".")));
});

test("yuklash: haqiqiy PNG qabul qilinadi", async () => {
  const s = await storeUpload(PNG, "logo.png", BRIEF_FILES);
  assert.equal(s.mime, "image/png");
  assert.match(s.storedPath, /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
});

test("yuklash: kengaytma va mazmun mos kelmasa rad etiladi", async () => {
  await assert.rejects(storeUpload(Buffer.from("<?php system($_GET[c]); ?>"), "cv.pdf", CV_FILES), FileRejected);
  await assert.rejects(storeUpload(PNG, "shell.php", BRIEF_FILES), FileRejected);
  await assert.rejects(storeUpload(PNG, "photo.pdf", CV_FILES), FileRejected);
  await assert.rejects(storeUpload(Buffer.alloc(6 * 1024 * 1024, 1), "big.pdf", CV_FILES), FileRejected);
});

test("saqlangan fayl yo'li: path traversal bloklanadi", () => {
  assert.throws(() => resolveStored("../../secret.txt"));
  assert.throws(() => resolveStored("/etc/passwd"));
});

test("brif: telefon yoki email majburiy, telefon E.164 ga keltiriladi", () => {
  const base = { locale: "uz", services: ["ai"], name: "Ali", consent: "true" };
  assert.equal(briefSchema.safeParse(base).success, false);
  const ok = briefSchema.safeParse({ ...base, phone: "90 123 45 67" });
  assert.ok(ok.success);
  assert.equal(ok.success && ok.data.phone, "+998901234567");
  assert.equal(briefSchema.safeParse({ ...base, phone: "123" }).success, false);
  assert.equal(briefSchema.safeParse({ ...base, email: "a@b.uz", services: ["hack"] }).success, false);
});

test("rozilik (consent) majburiy", () => {
  assert.equal(quickSchema.safeParse({ locale: "ru", name: "Ivan", contact: "+998901234567" }).success, false);
});

test("portfolio havolasi faqat http(s)", () => {
  const base = { locale: "en", name: "John", phone: "+14155552671", email: "j@x.com", consent: true };
  assert.equal(applicationSchema.safeParse({ ...base, portfolio: "javascript:alert(1)" }).success, false);
  assert.ok(applicationSchema.safeParse({ ...base, portfolio: "https://github.com/j" }).success);
});

test("source.page faqat nisbiy yo'l", () => {
  const base = { locale: "uz", name: "Ali", contact: "@alivali", consent: true };
  assert.equal(quickSchema.safeParse({ ...base, source: { page: "https://evil.com" } }).success, false);
  assert.ok(quickSchema.safeParse({ ...base, source: { page: "/uz/aloqa", utm_source: "google" } }).success);
});

test("parol siyosati", () => {
  assert.ok(passwordPolicy("short"));
  assert.ok(passwordPolicy("alllowercaseletters"));
  assert.equal(passwordPolicy("Sifat-Dev-2026!"), null);
});
