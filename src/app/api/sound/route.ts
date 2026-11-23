import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { SOUNDS, PROSODY } from "@/lib/content";
import { recordProgress } from "@/lib/progress";
import { XP } from "@/lib/game";

const Body = z.object({
  soundId: z.string().max(100),
  perceptionTotal: z.number().int().min(0).max(50).default(0),
  perceptionCorrect: z.number().int().min(0).max(50).default(0),
  recordings: z.number().int().min(0).max(50).default(0),
  selfScore: z.number().int().min(0).max(250).default(0),
});

/** Guarda práctica de pronunciación: percepción (medida) y grabaciones (autoevaluadas). */
export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const known = parsed.success && [...SOUNDS, ...PROSODY].some((s) => s.id === parsed.data.soundId);
  if (!parsed.success || !known) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = parsed.data;
  if (b.perceptionCorrect > b.perceptionTotal) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const t = schema.soundProgress;
  await db()
    .insert(t)
    .values({ userId: profile.userId, soundId: b.soundId, perceptionTotal: b.perceptionTotal, perceptionCorrect: b.perceptionCorrect, recordings: b.recordings, selfScoreSum: b.selfScore })
    .onConflictDoUpdate({
      target: [t.userId, t.soundId],
      set: {
        perceptionTotal: sql`${t.perceptionTotal} + ${b.perceptionTotal}`,
        perceptionCorrect: sql`${t.perceptionCorrect} + ${b.perceptionCorrect}`,
        recordings: sql`${t.recordings} + ${b.recordings}`,
        selfScoreSum: sql`${t.selfScoreSum} + ${b.selfScore}`,
        lastAt: new Date(),
      },
    });
  const progress = await recordProgress(profile, {
    xp: b.perceptionCorrect * XP.perceptionCorrect + b.recordings * XP.recording,
    speaking: b.recordings + (b.perceptionTotal ? 1 : 0),
  });
  return Response.json({ ok: true, progress });
}
