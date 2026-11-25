import { z } from "zod";
import { apiProfile, settingsOf } from "@/lib/user";
import { getItem } from "@/lib/content";
import { ensureCards, reviewCard } from "@/lib/cards";
import { recordProgress } from "@/lib/progress";
import { attemptXp, ERROR_CATEGORIES, finalGrade } from "@/lib/grading";
import { db, schema } from "@/db";
import { goalOf } from "@/lib/realtalk";
import { loseLife, practiceCorrect, type LifeChange } from "@/lib/economy";

const Body = z.object({
  itemId: z.string().max(100),
  mode: z.enum(["recog", "prod", "listen", "speak"]),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  correct: z.boolean(),
  isNew: z.boolean().default(false),
  ms: z.number().int().min(0).max(3_600_000).nullable().default(null),
  attemptId: z.string().min(8).max(64).optional(),
  firstTry: z.boolean().optional(),
  hints: z.number().int().min(0).max(10).optional(),
  revealed: z.boolean().optional(),
  kind: z.enum(["graded", "self"]).optional(),
  /** lesson: un error resta vida (o consume la protección). practice: los aciertos devuelven vidas. */
  ctx: z.enum(["lesson", "practice"]).optional(),
  errors: z
    .array(z.object({ category: z.enum(ERROR_CATEGORIES), expected: z.string().max(200).optional(), given: z.string().max(200).optional() }))
    .max(5)
    .optional(),
});

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = parsed.data;
  const item = getItem(b.itemId);
  if (!item) return Response.json({ error: "ítem inexistente" }, { status: 404 });

  const now = new Date();
  const retention = settingsOf(profile).retention;
  const grade = finalGrade(b);
  const created = b.isNew ? await ensureCards(profile.userId, b.itemId, now, retention, goalOf(item, settingsOf(profile).goals?.[b.itemId]) === "understand") : false;
  const res = await reviewCard(profile.userId, b.itemId, b.mode, grade, now, b.ms, retention, b);
  if (!res) return Response.json({ error: "tarjeta inexistente" }, { status: 404 });
  // Intento repetido (recarga, reintento de red): no suma nada.
  if (res.duplicate) return Response.json({ ...res, gained: 0 });

  if (b.errors?.length && b.attemptId) {
    await db()
      .insert(schema.errorEvents)
      .values(b.errors.map((e) => ({ userId: profile.userId, attemptId: b.attemptId!, itemId: b.itemId, mode: b.mode, category: e.category, expected: e.expected ?? null, given: e.given ?? null })))
      .onConflictDoNothing();
  }

  const recalled = b.correct && !b.revealed;
  const progress = await recordProgress(profile, {
    xp: attemptXp(b, created),
    reviews: 1,
    correct: recalled ? 1 : 0,
    newItems: created ? 1 : 0,
    speaking: b.mode === "speak" ? 1 : 0,
    seconds: Math.round(Math.min(b.ms ?? 0, 90_000) / 1000),
  });
  // Vidas: nunca bloquean; solo informan. Las autoevaluaciones no restan.
  let life: LifeChange | null = null;
  if (b.ctx === "lesson" && !b.correct && b.kind !== "self") life = await loseLife(profile.userId, b.attemptId ?? `${b.itemId}:${now.getTime()}`);
  else if (b.ctx === "practice" && recalled) life = await practiceCorrect(profile);
  return Response.json({ ...res, grade, ...progress, life });
}
