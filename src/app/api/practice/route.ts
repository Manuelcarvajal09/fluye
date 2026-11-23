import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { getRoleplay, TENSES } from "@/lib/content";
import { recordProgress } from "@/lib/progress";

const Body = z.object({ kind: z.enum(["roleplay", "fix", "grammar"]), id: z.string().max(80), score: z.number().min(0).max(1) });

/** Guarda práctica guiada (roleplays, corrige la frase, gramática) y suma XP. */
export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const { kind, id, score } = parsed.data;
  const valid = kind === "roleplay" ? !!getRoleplay(id) : kind === "grammar" ? TENSES.some((t) => t.id === id) : /^fix-\d{4}-\d{2}-\d{2}$/.test(id);
  if (!valid) return Response.json({ error: "id inválido" }, { status: 400 });
  const t = schema.lessonProgress;
  await db()
    .insert(t)
    .values({ userId: profile.userId, lessonId: id, score })
    .onConflictDoUpdate({ target: [t.userId, t.lessonId], set: { score: sql`greatest(${t.score}, ${score})`, completedAt: new Date() } });
  const progress = await recordProgress(profile, { xp: Math.round(10 + 30 * score), speaking: kind === "roleplay" ? 1 : 0, reviews: 1, correct: score >= 0.6 ? 1 : 0 });
  return Response.json({ ok: true, progress });
}
