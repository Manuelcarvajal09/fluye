// Lista las tablas de la base (diagnóstico rápido).
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config();
const sql = neon(process.env.DATABASE_URL);
const rows = await sql.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
console.log(rows.map((r) => r.table_name).join(", "));
