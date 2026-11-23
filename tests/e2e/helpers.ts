import { neon } from "@neondatabase/serverless";

/** Usuario de prueba de Clerk (modo test: el dominio example.com con +clerk_test no envía correos). */
export const TEST_EMAIL = "fluye-e2e+clerk_test@example.com";

const api = (path: string, init?: RequestInit) =>
  fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, "content-type": "application/json", ...(init?.headers ?? {}) },
  });

/** Segunda cuenta de prueba (sin invitación) para probar el acceso restringido. */
export const GUEST_EMAIL = "fluye-e2e-guest+clerk_test@example.com";

export async function ensureTestUser(email = TEST_EMAIL): Promise<string> {
  const found = (await (await api(`/users?email_address=${encodeURIComponent(email)}`)).json()) as { id: string }[];
  if (found.length) return found[0].id;
  const r = await api("/users", { method: "POST", body: JSON.stringify({ email_address: [email], first_name: "Prueba", skip_password_requirement: true }) });
  if (!r.ok) throw new Error(`No se pudo crear el usuario de prueba: ${r.status} ${await r.text()}`);
  return ((await r.json()) as { id: string }).id;
}

export const sql = () => neon(process.env.DATABASE_URL!);

/** Borra solo los datos del usuario de prueba. */
export async function resetTestData(userId: string) {
  const q = sql();
  for (const t of ["cards", "review_logs", "daily_stats", "lesson_progress", "sound_progress", "error_events", "active_time", "study_sessions", "gem_ledger", "inventory", "listen_events", "profiles"]) await q.query(`delete from ${t} where user_id = $1`, [userId]);
}

/** Desbloquea un usuario de prueba en Clerk (por si una prueba anterior lo dejó bloqueado). */
export const unban = (userId: string) => api(`/users/${userId}/unban`, { method: "POST" });
