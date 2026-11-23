// Barrera contra escrituras accidentales en la base de producción.
//
// La base de DESARROLLO lleva una marca: la tabla `fluye_dev_marker` con la fila 'dev'
// (la crea `npm run db:dev-setup`). Producción NO la tiene y nunca debe tenerla.
// Pruebas, semillas y utilidades que escriben se niegan a correr si la marca no existe.
// Así no hace falta guardar en el código el host de producción: basta con no haber marcado esa base.
import { neon } from "@neondatabase/serverless";

export const MARKER_TABLE = "fluye_dev_marker";

export async function isDevDatabase(url = process.env.DATABASE_URL) {
  if (!url) return false;
  try {
    const rows = await neon(url).query(`select role from ${MARKER_TABLE} where role = 'dev'`);
    return rows.length === 1;
  } catch {
    return false; // la tabla no existe → no es una base de desarrollo
  }
}

/** Lanza un error claro si la base configurada no es una base de desarrollo marcada. */
export async function assertDevDatabase(what = "esta operación") {
  if (!(await isDevDatabase())) {
    throw new Error(
      `BLOQUEADO: ${what} escribe datos y la base configurada en DATABASE_URL no está marcada como desarrollo ` +
        `(falta la tabla ${MARKER_TABLE}). Si es tu base de desarrollo, ejecuta \`npm run db:dev-setup\`. ` +
        `Si es producción, esto es justo lo que la barrera debe impedir.`,
    );
  }
}

/** Claves de Clerk de prueba (sk_test_/pk_test_): los E2E nunca deben correr con claves live. */
export function assertClerkTestKeys() {
  const sk = process.env.CLERK_SECRET_KEY ?? "";
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!sk.startsWith("sk_test_") || !pk.startsWith("pk_test_")) throw new Error("BLOQUEADO: las pruebas exigen claves de Clerk de desarrollo (sk_test_/pk_test_).");
}
