import { z } from "zod";
import { sql } from "drizzle-orm";
import { apiProfile } from "@/lib/user";
import { db, schema } from "@/db";

/** Inicio/fin de sesión (idempotente por id): sirve para contar sesiones y constancia reales. */
const Body = z.object({
  id: z.string().min(6).max(120),
  kind: z.enum(["daily", "mission", "return", "review", "free"]).default("daily"),
  missionId: z.string().max(60).optional(),
  minutes: z.number().int().min(1).max(60).default(10),
  steps: z.number().int().min(0).max(500).optional(),
  done: z.number().int().min(0).max(500).optional(),
  finished: z.boolean().optional(),
});

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = p.data;
  const t = schema.studySessions;
  await db()
    .insert(t)
    .values({ userId: profile.userId, id: b.id, kind: b.kind, missionId: b.missionId ?? null, minutes: b.minutes, steps: b.steps ?? 0, done: b.done ?? 0, finishedAt: b.finished ? new Date() : null })
    .onConflictDoUpdate({
      target: [t.userId, t.id],
      set: {
        done: sql`greatest(${t.done}, ${b.done ?? 0})`,
        ...(b.steps ? { steps: sql`greatest(${t.steps}, ${b.steps})` } : {}),
        ...(b.finished ? { finishedAt: sql`coalesce(${t.finishedAt}, now())` } : {}),
      },
    });
  return Response.json({ ok: true });
}
