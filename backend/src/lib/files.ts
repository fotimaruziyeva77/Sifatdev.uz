import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { config } from "../config.js";
import { cleanFileName, sha256 } from "./index.js";

export type FilePolicy = { maxBytes: number; allowed: Record<string, string[]> };

/** Ruxsat etilgan: kengaytma → haqiqiy (magic bytes) MIME turlari. */
export const BRIEF_FILES: FilePolicy = {
  maxBytes: 10 * 1024 * 1024,
  allowed: {
    pdf: ["application/pdf"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    png: ["image/png"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    zip: ["application/zip"],
  },
};

export const CV_FILES: FilePolicy = {
  maxBytes: 5 * 1024 * 1024,
  allowed: {
    pdf: ["application/pdf"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
};

export class FileRejected extends Error {}

export type StoredFile = {
  originalName: string;
  storedPath: string; // UPLOAD_DIR ga nisbatan
  mime: string;
  size: number;
  sha256: string;
};

const root = path.resolve(config.UPLOAD_DIR);

/**
 * Faylni tekshiradi va ommaviy bo'lmagan papkaga tasodifiy nom bilan saqlaydi.
 * Kengaytma ham, fayl ichidagi haqiqiy tur ham mos kelishi shart.
 */
export async function storeUpload(buf: Buffer, filename: string, policy: FilePolicy): Promise<StoredFile> {
  if (buf.length === 0) throw new FileRejected("empty");
  if (buf.length > policy.maxBytes) throw new FileRejected("too_large");
  const original = cleanFileName(filename);
  const ext = path.extname(original).slice(1).toLowerCase();
  const allowedMimes = policy.allowed[ext];
  if (!allowedMimes) throw new FileRejected("bad_extension");
  const detected = await fileTypeFromBuffer(buf);
  if (!detected || !allowedMimes.includes(detected.mime)) throw new FileRejected("bad_content");

  const now = new Date();
  const rel = path.join(String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  const dir = path.join(root, rel);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const name = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(path.join(dir, name), buf, { mode: 0o600, flag: "wx" });
  return {
    originalName: original,
    storedPath: path.join(rel, name).replace(/\\/g, "/"),
    mime: detected.mime,
    size: buf.length,
    sha256: sha256(buf),
  };
}

/** Path traversal'dan himoyalangan o'qish. */
export function resolveStored(storedPath: string): string {
  const full = path.resolve(root, storedPath);
  if (!full.startsWith(root + path.sep)) throw new Error("path_outside_root");
  return full;
}

export async function readStored(storedPath: string): Promise<Buffer> {
  return readFile(resolveStored(storedPath));
}

export async function deleteStored(storedPath: string): Promise<void> {
  await rm(resolveStored(storedPath), { force: true });
}

/** Saytda ko'rinadigan rasmlar (admin yuklaydi). SVG yo'q: u ichida skript saqlashi mumkin. */
export const MEDIA_FILES: FilePolicy = {
  maxBytes: 5 * 1024 * 1024,
  allowed: { png: ["image/png"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"], webp: ["image/webp"] },
};

const MEDIA_DIR = "public-media";
const MEDIA_NAME = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;

export function resolveMediaName(name: string): string | null {
  return MEDIA_NAME.test(name) ? `${MEDIA_DIR}/${name}` : null;
}

export async function storeMedia(buf: Buffer, filename: string): Promise<string> {
  if (buf.length === 0) throw new FileRejected("empty");
  if (buf.length > MEDIA_FILES.maxBytes) throw new FileRejected("too_large");
  const ext = path.extname(cleanFileName(filename)).slice(1).toLowerCase();
  const allowed = MEDIA_FILES.allowed[ext];
  if (!allowed) throw new FileRejected("bad_extension");
  const detected = await fileTypeFromBuffer(buf);
  if (!detected || !allowed.includes(detected.mime)) throw new FileRejected("bad_content");
  const dir = path.join(root, MEDIA_DIR);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const name = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
  await writeFile(path.join(dir, name), buf, { mode: 0o600, flag: "wx" });
  return name;
}
