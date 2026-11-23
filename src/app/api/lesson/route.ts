import { z } from "zod";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { getLesson, trackOfLesson } from "@/lib/content";
import { awardGems } from "@/lib/rewards";
import { GEMS } from "@/lib/challenges";
import { recordProgress } from "@/lib/progress";
import { XP } from "@/lib/game";

const Body = z.object({ lessonId: z.string().max(100), score: z.number().min(0).max(1) });

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !getLesson(parsed.data.lessonId)) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const inserted = await db()
    .insert(schema.lessonProgress)
    .values({ userId: profile.userId, lessonId: parsed.data.lessonId, score: parsed.data.score })
    .onConflictDoNothing()
    .returning();
  const progress = inserted.length ? await recordProgress(profile, { xp: XP.lessonDone }) : null;
  // Primera vez que completa una pista de ruta temática: gemas (una sola vez por pista).
  const track = trackOfLesson(parsed.data.lessonId);
  const gems = track && (await awardGems(profile.userId, `route:${track.id}`, GEMS.route, `Misión: ${track.objective_es}`)) ? GEMS.route : 0;
  return Response.json({ ok: true, progress, gems });
}
