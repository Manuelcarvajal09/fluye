// Crea datos FICTICIOS de demostración para un usuario (por id de Clerk): perfil, algo de progreso y membresía activa.
// Uso: node scripts/seed-demo.mjs <userId> [correo-ficticio]
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { assertDevDatabase } from "./lib/db-guard.mjs";

config({ path: ".env.local" });
config();
const [userId, email = "demo@example.com"] = process.argv.slice(2);
if (!userId) throw new Error("uso: node scripts/seed-demo.mjs <userId> [correo]");
await assertDevDatabase("la semilla de demostración");
const sql = neon(process.env.DATABASE_URL);
const day = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

await sql.query("insert into members (email, user_id, status, activated_at) values ($1, $2, 'active', now()) on conflict (email) do update set user_id = excluded.user_id, status = 'active'", [email.toLowerCase(), userId]);
await sql.query(
  `insert into profiles (user_id, name, level, goal_minutes, daily_new, topics, xp, streak, best_streak, last_goal_day, gems, onboarded_at, settings)
   values ($1, 'Demo', 'A2', 10, 8, '["conversacion","restaurantes","viajes"]', 420, 3, 5, $2, 60, now(), '{"look":{"species":"panda","name":"Mochi"}}')
   on conflict (user_id) do nothing`,
  [userId, day(0)],
);
for (let n = 0; n < 6; n++)
  await sql.query("insert into daily_stats (user_id, day, xp, reviews, correct, new_items) values ($1, $2, $3, $4, $5, $6) on conflict do nothing", [userId, day(n), 60 + n * 10, 20 + n, 15 + n, 4]);
console.log("Datos de demostración listos para", userId);
