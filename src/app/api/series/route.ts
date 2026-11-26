import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { getSeries } from "@/lib/content";
import { recordProgress } from "@/lib/progress";
import { XP } from "@/lib/game";

/** Resultado de una escena de series: guarda la mejor comprensión medida (no XP) y da XP solo la primera vez. */
const Body = z.object({ id: z.string().max(100), score: z.number().min(0).max(1), plays: z.number().int().min(0).max(100).optional() });

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success || !getSeries(p.data.id)) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const t = schema.lessonProgress;
  const [row] = await db()
    .insert(t)
    .values({ userId: profile.userId, lessonId: p.data.id, score: p.data.score })
    .onConflictDoUpdate({ target: [t.userId, t.lessonId], set: { score: sql`greatest(${t.score}, ${p.data.score})` } })
    .returning({ first: sql<boolean>`xmax = 0` });
  const progress = row?.first ? await recordProgress(profile, { xp: XP.lessonDone }) : null;
  return Response.json({ ok: true, progress });
}
