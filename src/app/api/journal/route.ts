import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { localDay } from "@/lib/game";
import { entryOf, monthOf, PHOTO_LIMITS } from "@/lib/journal";

/** Diario personal: solo su dueño lo lee o lo escribe. Las fotos llegan ya comprimidas desde el navegador. */
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("save"),
    day: Day,
    mood: z.number().int().min(1).max(5).nullable(),
    activities: z.array(z.string().max(30)).max(16),
    answers: z.record(z.string().max(40), z.string().max(400)),
    englishLine: z.string().max(400),
    learned: z.string().max(600),
  }),
  z.object({ action: z.literal("photo"), day: Day, mime: z.enum(PHOTO_LIMITS.mimes), data: z.string().max(Math.ceil((PHOTO_LIMITS.maxBytes * 4) / 3) + 8), w: z.number().int().min(1).max(PHOTO_LIMITS.maxSide), h: z.number().int().min(1).max(PHOTO_LIMITS.maxSide) }),
  z.object({ action: z.literal("delete-photo"), id: z.string().max(40) }),
]);

export async function GET(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const u = new URL(req.url);
  const month = u.searchParams.get("mes");
  if (month && /^\d{4}-\d{2}$/.test(month)) return Response.json({ days: await monthOf(profile.userId, month) });
  const day = u.searchParams.get("dia") ?? localDay(profile.tz);
  if (!Day.safeParse(day).success) return Response.json({ error: "día inválido" }, { status: 400 });
  return Response.json(await entryOf(profile.userId, day));
}

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = parsed.data;
  const d = db();
  const today = localDay(profile.tz);
  if (b.action === "save") {
    if (b.day > today) return Response.json({ error: "No se puede escribir un día futuro." }, { status: 400 });
    const values = { mood: b.mood, activities: b.activities, answers: b.answers, englishLine: b.englishLine.trim(), learned: b.learned.trim(), updatedAt: new Date() };
    await d.insert(schema.journalEntries).values({ userId: profile.userId, day: b.day, ...values }).onConflictDoUpdate({ target: [schema.journalEntries.userId, schema.journalEntries.day], set: values });
    return Response.json({ ok: true });
  }
  if (b.action === "photo") {
    if (b.day > today) return Response.json({ error: "No se puede añadir fotos a un día futuro." }, { status: 400 });
    const bytes = Buffer.from(b.data, "base64");
    if (bytes.length > PHOTO_LIMITS.maxBytes) return Response.json({ error: "La foto pesa demasiado." }, { status: 413 });
    // Firma real del archivo (no solo lo que diga el navegador): WebP "RIFF....WEBP" o JPEG FF D8 FF.
    const isWebp = bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if ((b.mime === "image/webp" && !isWebp) || (b.mime === "image/jpeg" && !isJpeg)) return Response.json({ error: "Archivo de imagen no válido." }, { status: 400 });
    const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.journalPhotos).where(and(eq(schema.journalPhotos.userId, profile.userId), eq(schema.journalPhotos.day, b.day)));
    if (n >= PHOTO_LIMITS.perDay) return Response.json({ error: `Máximo ${PHOTO_LIMITS.perDay} fotos por día.` }, { status: 409 });
    const id = `ph_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    await d.insert(schema.journalPhotos).values({ id, userId: profile.userId, day: b.day, mime: b.mime, data: bytes, w: b.w, h: b.h, size: bytes.length });
    return Response.json({ ok: true, id });
  }
  await d.delete(schema.journalPhotos).where(and(eq(schema.journalPhotos.id, b.id), eq(schema.journalPhotos.userId, profile.userId)));
  return Response.json({ ok: true });
}
