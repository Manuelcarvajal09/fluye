import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { getReading, readingXp } from "@/lib/readings";
import { recordProgress } from "@/lib/progress";

/** Guarda el resultado de una lectura o de la noticia del día ("news:<día>"). El XP se da solo la primera vez. */
const Body = z.object({
  id: z.string().regex(/^(lectura-[a-z0-9-]+|news:\d{4}-\d{2}-\d{2})$/),
  score: z.number().int().min(0).max(20),
  total: z.number().int().min(1).max(20),
  reflection: z.string().max(280).optional(),
});

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.score > parsed.data.total) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const { id, score, total } = parsed.data;
  if (id.startsWith("lectura-") && !getReading(id)) return Response.json({ error: "no existe" }, { status: 404 });
  const reflection = (parsed.data.reflection ?? "").trim();
  const d = db();
  const ins = await d.insert(schema.readingProgress).values({ userId: profile.userId, readingId: id, score, total, reflection }).onConflictDoNothing().returning({ id: schema.readingProgress.readingId });
  if (!ins.length) {
    // Repetir: se actualiza la reflexión (y la mejor puntuación), sin volver a dar XP.
    await d
      .update(schema.readingProgress)
      .set({ score: sql`greatest(${schema.readingProgress.score}, ${score})`, ...(reflection ? { reflection } : {}) })
      .where(and(eq(schema.readingProgress.userId, profile.userId), eq(schema.readingProgress.readingId, id)));
    return Response.json({ ok: true, xp: 0 });
  }
  const xp = readingXp(score);
  const r = await recordProgress(profile, { xp });
  return Response.json({ ok: true, xp, gems: r.gems });
}
