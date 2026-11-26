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
  for (const t of ["cards", "review_logs", "daily_stats", "lesson_progress", "sound_progress", "error_events", "active_time", "study_sessions", "gem_ledger", "inventory", "listen_events", "collection_items", "collections", "wallet_events", "profiles"]) await q.query(`delete from ${t} where user_id = $1`, [userId]);
  await q.query("delete from friendships where user_a = $1 or user_b = $1", [userId]);
  await q.query("delete from gifts where from_user = $1 or to_user = $1", [userId]);
}

/** Desbloquea un usuario de prueba en Clerk (por si una prueba anterior lo dejó bloqueado). */
export const unban = (userId: string) => api(`/users/${userId}/unban`, { method: "POST" });

/**
 * Resuelve los formatos de ejercicio de Fluye 1.0 si están en pantalla (banco de palabras, dictado, emparejar).
 * Devuelve el formato resuelto o null. Responde mal a propósito en fichas y dictado: solo se prueba que el flujo avanza.
 */
export async function solveNewFormats(page: import("@playwright/test").Page): Promise<string | null> {
  const bank = page.getByRole("group", { name: "Palabras disponibles" });
  if (await bank.isVisible().catch(() => false)) {
    await bank.getByRole("button").first().click({ timeout: 2000 }).catch(() => {});
    await page.getByRole("button", { name: "Comprobar" }).click({ timeout: 2000 }).catch(() => {});
    return "build";
  }
  const dict = page.locator("#dictation");
  if (await dict.isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "No la entendí" }).click({ timeout: 2000 }).catch(() => {});
    return "dictation";
  }
  const left = page.getByRole("group", { name: "Expresiones" });
  if (await left.isVisible().catch(() => false)) {
    const rights = page.getByRole("group", { name: "Significados" }).getByRole("button");
    for (let i = 0; i < 8; i++) {
      const l = left.getByRole("button", { disabled: false }).first();
      if (!(await l.isVisible().catch(() => false))) break;
      await l.click({ timeout: 2000 }).catch(() => {});
      const n = await rights.count();
      for (let k = 0; k < n; k++) {
        const r = rights.nth(k);
        if (await r.isDisabled({ timeout: 500 }).catch(() => true)) continue;
        await r.click({ timeout: 800 }).catch(() => {});
        await page.waitForTimeout(120);
        if (await l.isDisabled({ timeout: 500 }).catch(() => true)) break;
        if (!(await l.getAttribute("aria-pressed", { timeout: 500 }).catch(() => null))?.includes("true")) await l.click({ timeout: 1000 }).catch(() => {});
      }
    }
    return "match";
  }
  return null;
}
