import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile, settingsOf } from "@/lib/user";
import { CATALOG, getItem } from "@/lib/content";
import { ensureCards } from "@/lib/cards";
import { recordProgress } from "@/lib/progress";
import { goalOf } from "@/lib/realtalk";

const Body = z.object({ itemId: z.string().max(100), action: z.enum(["learn", "suspend", "resume", "known", "unknown", "goal"]), goal: z.enum(["understand", "use", "both"]).optional() });
const Batch = z.object({ action: z.literal("learn-next"), count: z.number().int().min(1).max(20), band: z.string().max(5).optional() });

/** Añadir un ítem desde la biblioteca, o suspender / reanudar sus tarjetas. */
export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const raw = await req.json().catch(() => null);
  // Activación gradual del catálogo: las siguientes N palabras más frecuentes que aún no estudias.
  const batch = Batch.safeParse(raw);
  if (batch.success) {
    const have = new Set((await db().selectDistinct({ id: schema.cards.itemId }).from(schema.cards).where(eq(schema.cards.userId, profile.userId))).map((r) => r.id));
    const known = new Set(settingsOf(profile).known ?? []);
    // Mismo criterio que la palabra sugerida de Hoy: desde tu nivel hacia arriba, sin determinantes ni pronombres, y con el registro que elegiste.
    const lv = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const explicit = settingsOf(profile).explicit === true;
    const next = CATALOG.filter((c) => c.status === "complete" && !c.dupOf && !have.has(c.id) && !known.has(c.id) && (!batch.data.band || c.band === batch.data.band) && lv.indexOf(c.level) >= lv.indexOf(profile.level) && c.pos !== "det" && c.pos !== "pron" && (explicit || !c.register))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, batch.data.count);
    let added = 0;
    for (const c of next) if (await ensureCards(profile.userId, c.id, new Date(), settingsOf(profile).retention)) added++;
    if (added) await recordProgress(profile, { newItems: added });
    return Response.json({ ok: true, added, ids: next.map((c) => c.id) });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success || !getItem(parsed.data.itemId)) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const { itemId, action } = parsed.data;

  const s = settingsOf(profile);
  const item = getItem(itemId)!;
  if (action === "known" || action === "unknown") {
    // "Ya la conozco" es una declaración (se muestra como tal en Progreso), no cuenta como dominio.
    const known = new Set(s.known ?? []);
    if (action === "known") known.add(itemId);
    else known.delete(itemId);
    await db().update(schema.profiles).set({ settings: { ...s, known: [...known].slice(-5000) } }).where(eq(schema.profiles.userId, profile.userId));
    return Response.json({ ok: true });
  }
  if (action === "goal" && parsed.data.goal) {
    const goal = parsed.data.goal;
    await db().update(schema.profiles).set({ settings: { ...s, goals: { ...s.goals, [itemId]: goal } } }).where(eq(schema.profiles.userId, profile.userId));
    // Cambiar la meta pausa o reactiva solo producir/hablar; nunca borra el progreso.
    await db()
      .update(schema.cards)
      .set({ suspended: goal === "understand" ? 1 : 0 })
      .where(and(eq(schema.cards.userId, profile.userId), eq(schema.cards.itemId, itemId), inArray(schema.cards.mode, ["prod", "speak"])));
    return Response.json({ ok: true });
  }
  if (action === "learn") {
    const created = await ensureCards(profile.userId, itemId, new Date(), s.retention, goalOf(item, s.goals?.[itemId]) === "understand");
    if (created) await recordProgress(profile, { newItems: 1 });
    return Response.json({ ok: true, created });
  }
  await db()
    .update(schema.cards)
    .set({ suspended: action === "suspend" ? 1 : 0 })
    .where(and(eq(schema.cards.userId, profile.userId), eq(schema.cards.itemId, itemId)));
  return Response.json({ ok: true });
}
