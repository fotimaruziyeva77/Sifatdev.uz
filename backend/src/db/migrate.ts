import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./pool.js";

// dist/ ichida .sql fayllar yo'q bo'lishi mumkin — har doim src/db/migrations dan o'qiymiz.
const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [path.join(here, "migrations"), path.resolve(here, "../../src/db/migrations")];

async function migrationsDir(): Promise<string> {
  for (const d of candidates) {
    try {
      const f = await readdir(d);
      if (f.some((x) => x.endsWith(".sql"))) return d;
    } catch {
      /* keyingisi */
    }
  }
  throw new Error("Migratsiya papkasi topilmadi");
}

export async function migrate(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const dir = await migrationsDir();
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const done = await pool.query("SELECT 1 FROM schema_migrations WHERE name=$1", [f]);
    if (done.rowCount) continue;
    const sql = await readFile(path.join(dir, f), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [f]);
      await client.query("COMMIT");
      console.log(`migratsiya qo'llandi: ${f}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  migrate()
    .then(() => pool.end())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
