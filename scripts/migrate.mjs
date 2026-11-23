// Aplica las migraciones SQL de ./drizzle a DATABASE_URL (lee .env.local o .env).
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });
config();
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
await migrate(drizzle(neon(process.env.DATABASE_URL)), { migrationsFolder: "./drizzle" });
console.log("migraciones aplicadas");
