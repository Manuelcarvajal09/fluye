import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile, settingsOf } from "@/lib/user";
import { PLACEMENT } from "@/lib/content";
import { grade } from "@/lib/placement";
import { recordProgress } from "@/lib/progress";

const Body = z.object({ answers: z.record(z.string().max(40), z.number().int().min(0).max(3).nullable()), apply: z.boolean().default(true) });

/** Califica el test en el servidor, guarda el resultado y (si apply) actualiza el nivel. */
export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const answered = PLACEMENT.filter((q) => q.id in parsed.data.answers);
  if (answered.length < Math.min(20, PLACEMENT.length)) return Response.json({ error: "Responde al menos 20 preguntas" }, { status: 400 });
  const r = grade(answered, parsed.data.answers);
  const placement = { date: new Date().toISOString(), level: r.level, near: r.near, score: r.score, total: r.total, bySection: r.bySection, byLevel: r.byLevel };
  await db()
    .update(schema.profiles)
    .set({ settings: { ...settingsOf(profile), placement }, ...(parsed.data.apply ? { level: r.level } : {}) })
    .where(eq(schema.profiles.userId, profile.userId));
  await recordProgress(profile, { xp: 50 });
  return Response.json(r);
}
