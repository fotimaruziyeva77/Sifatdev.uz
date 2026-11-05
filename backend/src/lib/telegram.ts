import { config } from "../config.js";
import { readStored } from "./files.js";

const API = "https://api.telegram.org";

export type TelegramPayload = {
  chat: "sales" | "hr";
  text: string;
  file?: { storedPath: string; originalName: string; mime: string };
};

function chatId(chat: TelegramPayload["chat"]): string {
  return chat === "hr" ? config.TELEGRAM_HR_CHAT_ID : config.TELEGRAM_SALES_CHAT_ID;
}

export function telegramEnabled(): boolean {
  return Boolean(config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_SALES_CHAT_ID);
}

async function call(method: string, body: FormData | Record<string, unknown>): Promise<void> {
  // Token URL ichida — xatolik xabariga URL qo'shilmaydi (token logga tushmasligi uchun).
  const isForm = body instanceof FormData;
  const res = await fetch(`${API}/bot${config.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "content-type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const txt = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`telegram ${method} ${res.status}: ${txt}`);
  }
}

/**
 * Matn parse_mode'siz (oddiy matn) yuboriladi — foydalanuvchi kiritgan
 * belgilar Telegram HTML/Markdown sifatida talqin qilinmaydi.
 */
export async function sendTelegram(p: TelegramPayload): Promise<void> {
  const id = chatId(p.chat);
  if (!config.TELEGRAM_BOT_TOKEN || !id) throw new Error("telegram_not_configured");
  await call("sendMessage", { chat_id: id, text: p.text.slice(0, 4000), disable_web_page_preview: true });
  if (p.file) {
    const buf = await readStored(p.file.storedPath);
    const fd = new FormData();
    fd.set("chat_id", id);
    fd.set("document", new Blob([new Uint8Array(buf)], { type: p.file.mime }), p.file.originalName);
    await call("sendDocument", fd);
  }
}
