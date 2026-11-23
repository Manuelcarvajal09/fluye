import { assertClerkTestKeys, assertDevDatabase } from "../../scripts/lib/db-guard.mjs";

/**
 * Se ejecuta UNA vez antes de cualquier prueba E2E (también con --no-deps).
 * Aborta si la base no está marcada como desarrollo, si las claves de Clerk no son de prueba
 * o si se apunta a un servidor remoto sin permiso explícito.
 */
export default async function globalSetup() {
  assertClerkTestKeys();
  await assertDevDatabase("la suite E2E");
  const base = process.env.E2E_BASE_URL;
  if (base && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(base) && process.env.E2E_ALLOW_REMOTE !== "1") {
    throw new Error(`BLOQUEADO: E2E_BASE_URL apunta a un servidor remoto (${new URL(base).host}). Usa E2E_ALLOW_REMOTE=1 solo si es un entorno de pruebas.`);
  }
}
