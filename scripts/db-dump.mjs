// Respaldo JSON de todas las tablas (uso privado; la salida NUNCA va al repo).
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { writeFileSync, mkdirSync } from "node:fs";
config({ path: ".env.local" });
config();
const out = process.argv[2];
if (!out) throw new Error("uso: node scripts/db-dump.mjs <carpeta-fuera-del-repo>");
mkdirSync(out, { recursive: true });
const sql = neon(process.env.DATABASE_URL);
const tables = (await sql.query("select table_name from information_schema.tables where table_schema='public' order by 1")).map((r) => r.table_name);
for (const t of tables) {
  const rows = await sql.query(`select * from "${t}"`);
  writeFileSync(`${out}/${t}.json`, JSON.stringify(rows));
  console.log(t, rows.length);
}
