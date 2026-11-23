import { z } from "zod";
import { sql } from "drizzle-orm";
import { apiProfile } from "@/lib/user";
import { db, schema } from "@/db";

/**
 * Tiempo activo. El cliente envía su contador ACUMULADO del día por dispositivo; aquí se guarda el máximo.
 * Reenviar el mismo valor (reintento, reconexión) no suma doble. Solo una pestaña cuenta a la vez (ver ActivityTracker).
 */
const Body = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientId: z.string().min(6).max(64),
  seconds: z.number().int().min(0).max(86_400),
});

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const { day, clientId, seconds } = parsed.data;
  // Solo se acepta hoy o ayer (cruce de medianoche o cambio de zona horaria en un viaje).
  const now = Date.now();
  const diff = (now - Date.parse(day + "T12:00:00Z")) / 86_400_000;
  if (diff < -1.6 || diff > 1.6) return Response.json({ error: "día fuera de rango" }, { status: 400 });
  await db()
    .insert(schema.activeTime)
    .values({ userId: profile.userId, day, clientId, seconds })
    .onConflictDoUpdate({
      target: [schema.activeTime.userId, schema.activeTime.day, schema.activeTime.clientId],
      set: { seconds: sql`greatest(${schema.activeTime.seconds}, ${seconds})`, updatedAt: new Date() },
    });
  return Response.json({ ok: true });
}
