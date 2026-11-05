import { config } from "./config.js";
import { buildApp } from "./app.js";
import { migrate } from "./db/migrate.js";
import { pool } from "./db/pool.js";
import { processOutbox, startOutboxWorker } from "./lib/outbox.js";
import { deleteStored } from "./lib/files.js";

const app = await buildApp();
await migrate();

const worker = startOutboxWorker(app.log);

/** Kunlik tozalash: muddati o'tgan sessiyalar va saqlash muddati tugagan so'rovlar. */
async function housekeeping() {
  try {
    await pool.query("DELETE FROM admin_sessions WHERE expires_at < now()");
    await pool.query("DELETE FROM outbox WHERE sent_at IS NOT NULL AND sent_at < now() - interval '30 days'");
    if (config.LEAD_RETENTION_DAYS > 0) {
      const { rows } = await pool.query(
        `SELECT f.stored_path FROM lead_files f JOIN leads l ON l.id = f.lead_id
         WHERE l.status = 'closed' AND l.updated_at < now() - make_interval(days => $1)`,
        [config.LEAD_RETENTION_DAYS],
      );
      await pool.query(`DELETE FROM leads WHERE status = 'closed' AND updated_at < now() - make_interval(days => $1)`, [config.LEAD_RETENTION_DAYS]);
      await Promise.all(rows.map((r) => deleteStored(r.stored_path).catch(() => undefined)));
    }
  } catch (e) {
    app.log.error({ err: e }, "housekeeping xatosi");
  }
}
void housekeeping();
const daily = setInterval(housekeeping, 24 * 3600 * 1000);

await app.listen({ port: config.PORT, host: config.HOST });
void processOutbox(app.log);

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    clearInterval(worker);
    clearInterval(daily);
    await app.close();
    await pool.end();
    process.exit(0);
  });
}
