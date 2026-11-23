// Aplica las migraciones SQL de ./drizzle a DATABASE_URL (lee .env.local o .env).
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { isDevDatabase } from "./lib/db-guard.mjs";

config({ path: ".env.local" });
config();
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
// Migrar una base NO marcada como desarrollo (p. ej. producción) exige confirmarlo a propósito.
if (!(await isDevDatabase()) && process.env.FLUYE_ALLOW_PROD_MIGRATE !== "1") {
  console.error("BLOQUEADO: esta base no está marcada como desarrollo. Para migrar producción a propósito: FLUYE_ALLOW_PROD_MIGRATE=1 (haz antes un respaldo con scripts/db-dump.mjs).");
  process.exit(1);
}
await migrate(drizzle(neon(process.env.DATABASE_URL)), { migrationsFolder: "./drizzle" });
console.log("migraciones aplicadas");
