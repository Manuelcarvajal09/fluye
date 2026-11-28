import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { getItem } from "@/lib/content";

/** Exportación completa de los datos de la persona (JSON). */
export async function GET() {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const d = db();
  const u = profile.userId;
  const [cards, logs, days, lessons, sounds, journal, photos, readings] = await Promise.all([
    d.select().from(schema.cards).where(eq(schema.cards.userId, u)),
    d.select().from(schema.reviewLogs).where(eq(schema.reviewLogs.userId, u)),
    d.select().from(schema.dailyStats).where(eq(schema.dailyStats.userId, u)),
    d.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, u)),
    d.select().from(schema.soundProgress).where(eq(schema.soundProgress.userId, u)),
    d.select().from(schema.journalEntries).where(eq(schema.journalEntries.userId, u)),
    d.select().from(schema.journalPhotos).where(eq(schema.journalPhotos.userId, u)),
    d.select().from(schema.readingProgress).where(eq(schema.readingProgress.userId, u)),
  ]);
  const omit = <T extends object>(row: T, ...keys: string[]) => Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)));
  const strip = <T extends object>(rows: T[], ...extra: string[]) => rows.map((r) => omit(r, "userId", ...extra));
  const body = { app: "fluye", version: 1, exportedAt: new Date().toISOString(), profile: omit(profile, "userId"), cards: strip(cards), logs: strip(logs, "id"), days: strip(days), lessons: strip(lessons), sounds: strip(sounds), journal: strip(journal), journalPhotos: photos.map((p) => ({ id: p.id, day: p.day, mime: p.mime, w: p.w, h: p.h, data: Buffer.from(p.data).toString("base64") })), readings: strip(readings) };
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="fluye-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}

const Card = z.object({
  itemId: z.string().max(100),
  mode: z.enum(["recog", "prod", "listen", "speak"]),
  due: z.coerce.date(),
  state: z.number().int().min(0).max(3),
  stability: z.number(),
  reps: z.number().int(),
  lapses: z.number().int(),
  fsrs: z.record(z.string(), z.unknown()),
  suspended: z.number().int().min(0).max(1).default(0),
  lastReview: z.coerce.date().nullable().optional(),
});
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const JournalRow = z.object({ day: Day, mood: z.number().int().min(1).max(5).nullable(), activities: z.array(z.string().max(30)).max(16), answers: z.record(z.string().max(40), z.string().max(400)), englishLine: z.string().max(400), learned: z.string().max(600) });
const PhotoRow = z.object({ id: z.string().max(40), day: Day, mime: z.enum(["image/webp", "image/jpeg"]), w: z.number().int().min(1).max(1280), h: z.number().int().min(1).max(1280), data: z.string().max(560_000) });
const Import = z.object({ app: z.literal("fluye"), cards: z.array(Card).max(50_000), journal: z.array(JournalRow).max(5000).optional(), journalPhotos: z.array(PhotoRow).max(15_000).optional() });

/**
 * Importa tarjetas de una exportación. Por cada tarjeta gana la versión con el repaso más reciente,
 * así importar dos veces no duplica ni retrocede progreso.
 */
export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Import.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "archivo no válido" }, { status: 400 });
  const rows = parsed.data.cards.filter((c) => getItem(c.itemId)).map((c) => ({ ...c, userId: profile.userId, lastReview: c.lastReview ?? null }));
  const t = schema.cards;
  for (let i = 0; i < rows.length; i += 500) {
    await db()
      .insert(t)
      .values(rows.slice(i, i + 500))
      .onConflictDoUpdate({
        target: [t.userId, t.itemId, t.mode],
        set: {
          due: sql`excluded.due`,
          state: sql`excluded.state`,
          stability: sql`excluded.stability`,
          reps: sql`excluded.reps`,
          lapses: sql`excluded.lapses`,
          fsrs: sql`excluded.fsrs`,
          suspended: sql`excluded.suspended`,
          lastReview: sql`excluded.last_review`,
        },
        setWhere: sql`coalesce(excluded.last_review, 'epoch') > coalesce(${t.lastReview}, 'epoch')`,
      });
  }
  // Diario y fotos: se añaden los días que no existan (nunca se sobrescribe lo que ya tienes).
  for (const j of parsed.data.journal ?? []) await db().insert(schema.journalEntries).values({ ...j, userId: profile.userId }).onConflictDoNothing();
  for (const p of parsed.data.journalPhotos ?? []) {
    const data = Buffer.from(p.data, "base64");
    if (data.length > 400_000) continue;
    await db().insert(schema.journalPhotos).values({ id: p.id, userId: profile.userId, day: p.day, mime: p.mime, w: p.w, h: p.h, data, size: data.length }).onConflictDoNothing();
  }
  return Response.json({ ok: true, imported: rows.length, skipped: parsed.data.cards.length - rows.length, journal: parsed.data.journal?.length ?? 0 });
}
