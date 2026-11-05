import type { FastifyRequest } from "fastify";

export type ParsedMultipart = {
  fields: Record<string, string | string[]>;
  file?: { filename: string; buffer: Buffer; truncated: boolean };
};

const ARRAY_FIELDS = new Set(["services"]);

/** Multipart so'rovni xavfsiz o'qish: bitta fayl, cheklangan maydonlar soni va hajmi. */
export async function readMultipart(req: FastifyRequest, maxFileBytes: number): Promise<ParsedMultipart> {
  const out: ParsedMultipart = { fields: {} };
  const parts = req.parts({ limits: { fileSize: maxFileBytes, files: 1, fields: 40, fieldSize: 8 * 1024, parts: 42 } });
  for await (const part of parts) {
    if (part.type === "file") {
      if (part.fieldname !== "file" || out.file) {
        part.file.resume();
        continue;
      }
      const buffer = await part.toBuffer();
      out.file = { filename: part.filename, buffer, truncated: part.file.truncated };
    } else {
      const v = typeof part.value === "string" ? part.value : String(part.value ?? "");
      const key = part.fieldname;
      if (ARRAY_FIELDS.has(key)) {
        const arr = (out.fields[key] as string[] | undefined) ?? [];
        arr.push(v);
        out.fields[key] = arr;
      } else if (key.startsWith("source.")) {
        // source.page, source.utm_source ... → keyin obyektga yig'iladi
        out.fields[key] = v;
      } else {
        out.fields[key] = v;
      }
    }
  }
  return out;
}

/** "source.*" maydonlarini obyektga aylantiradi. */
export function collectSource(fields: Record<string, string | string[]>): Record<string, string> {
  const src: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k.startsWith("source.") && typeof v === "string") src[k.slice(7)] = v;
  }
  return src;
}
