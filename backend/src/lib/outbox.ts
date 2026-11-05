import type { FastifyBaseLogger } from "fastify";
import { pool, type Db } from "../db/pool.js";
import { sendTelegram, telegramEnabled, type TelegramPayload } from "./telegram.js";
import { sendEmail, mailEnabled, type EmailPayload } from "./mailer.js";

type Item =
  | { channel: "telegram"; payload: TelegramPayload }
  | { channel: "email"; payload: EmailPayload };

/**
 * Transactional outbox: xabarlar avval bazaga yoziladi, keyin yuboriladi.
 * Telegram yoki SMTP ishlamasa — eksponensial kutish bilan qayta urinadi (TZ 8.2).
 */
export async function enqueue(db: Db, items: Item[]): Promise<void> {
  for (const it of items) {
    if (it.channel === "telegram" && !telegramEnabled()) continue;
    if (it.channel === "email" && !mailEnabled()) continue;
    await db.query("INSERT INTO outbox(channel, payload) VALUES ($1, $2)", [it.channel, JSON.stringify(it.payload)]);
  }
}

const MAX_ATTEMPTS = 12;
let running = false;

export async function processOutbox(log: FastifyBaseLogger): Promise<void> {
  if (running) return;
  running = true;
  try {
    for (;;) {
      const client = await pool.connect();
      let processed = 0;
      try {
        await client.query("BEGIN");
        const { rows } = await client.query(
          `SELECT id, channel, payload, attempts FROM outbox
           WHERE sent_at IS NULL AND next_attempt_at <= now() AND attempts < $1
           ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED`,
          [MAX_ATTEMPTS],
        );
        for (const r of rows) {
          processed++;
          try {
            if (r.channel === "telegram") await sendTelegram(r.payload);
            else await sendEmail(r.payload);
            await client.query("UPDATE outbox SET sent_at = now(), attempts = attempts + 1, last_error = NULL WHERE id = $1", [r.id]);
          } catch (e) {
            const delaySec = Math.min(3600, 15 * 2 ** r.attempts);
            const msg = e instanceof Error ? e.message.slice(0, 300) : "error";
            await client.query(
              `UPDATE outbox SET attempts = attempts + 1, last_error = $2,
               next_attempt_at = now() + make_interval(secs => $3) WHERE id = $1`,
              [r.id, msg, delaySec],
            );
            log.warn({ outboxId: r.id, channel: r.channel, err: msg }, "outbox yuborish xatosi");
          }
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => undefined);
        log.error({ err: e }, "outbox ishlovchisi xatosi");
      } finally {
        client.release();
      }
      if (processed < 10) break;
    }
  } finally {
    running = false;
  }
}

export function startOutboxWorker(log: FastifyBaseLogger): NodeJS.Timeout {
  return setInterval(() => void processOutbox(log), 10_000);
}
