// Prepara una base de DESARROLLO: aplica migraciones, la marca como dev y (opcional) carga datos ficticios.
// Uso: node scripts/dev-db-setup.mjs [--seed]
// Seguridad: se niega a marcar como dev una base que ya contenga perfiles reales
// (cualquier fila con onboarded_at y xp > 0 que no sea de demostración/prueba).
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { MARKER_TABLE, isDevDatabase } from "./lib/db-guard.mjs";

config({ path: ".env.local", quiet: true });
config({ quiet: true });
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
const sql = neon(process.env.DATABASE_URL);

await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
console.log("migraciones aplicadas");

if (!(await isDevDatabase())) {
  const [{ n }] = await sql.query("select count(*)::int n from profiles");
  if (n > 0) {
    throw new Error(`Esta base ya tiene ${n} perfiles y no está marcada como desarrollo. No se marca: podría ser producción. Si de verdad es una base de pruebas, crea la marca a mano.`);
  }
  await sql.query(`create table if not exists ${MARKER_TABLE} (role text primary key, created_at timestamptz not null default now())`);
  await sql.query(`insert into ${MARKER_TABLE} (role) values ('dev') on conflict do nothing`);
  console.log("base marcada como desarrollo");
} else console.log("la base ya está marcada como desarrollo");

if (process.argv.includes("--seed")) {
  const day = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  const people = [
    { id: "user_demo_a1", email: "demo-a1@example.com", name: "Ana (demo A1)", level: "A1", topics: ["conversacion", "restaurantes", "compras"], xp: 120 },
    { id: "user_demo_b1", email: "demo-b1@example.com", name: "Beto (demo B1)", level: "B1", topics: ["conversacion", "reuniones", "series"], xp: 900 },
  ];
  for (const p of people) {
    await sql.query("insert into members (email, user_id, status, activated_at) values ($1, $2, 'active', now()) on conflict (email) do nothing", [p.email, p.id]);
    await sql.query(
      `insert into profiles (user_id, name, level, goal_minutes, daily_new, topics, xp, streak, best_streak, last_goal_day, gems, onboarded_at, settings)
       values ($1, $2, $3, 10, 8, $4::jsonb, $5, 3, 5, $6, 40, now(), '{"look":{"species":"panda","name":"Mochi"}}'::jsonb) on conflict (user_id) do nothing`,
      [p.id, p.name, p.level, JSON.stringify(p.topics), p.xp, day(0)],
    );
    for (let n = 0; n < 6; n++) await sql.query("insert into daily_stats (user_id, day, xp, reviews, correct, new_items) values ($1, $2, $3, $4, $5, 4) on conflict do nothing", [p.id, day(n), 60 + n * 10, 20 + n, 15 + n]);
  }
  console.log("datos ficticios cargados:", people.map((p) => p.id).join(", "));
}
