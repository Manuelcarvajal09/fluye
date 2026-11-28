import "server-only";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const J = schema.journalEntries;
const Ph = schema.journalPhotos;

export const PHOTO_LIMITS = { perDay: 3, maxBytes: 400_000, maxSide: 1280, mimes: ["image/webp", "image/jpeg"] } as const;

export type JournalEntry = { day: string; mood: number | null; activities: string[]; answers: Record<string, string>; englishLine: string; learned: string; photos: { id: string; w: number; h: number }[] };

/** Entrada de un día (o vacía) con sus fotos (solo metadatos; la imagen se sirve aparte, solo a su dueño). */
export async function entryOf(userId: string, day: string): Promise<JournalEntry> {
  const [[e], photos] = await Promise.all([
    db().select().from(J).where(and(eq(J.userId, userId), eq(J.day, day))),
    db().select({ id: Ph.id, w: Ph.w, h: Ph.h }).from(Ph).where(and(eq(Ph.userId, userId), eq(Ph.day, day))).orderBy(asc(Ph.createdAt)),
  ]);
  return { day, mood: e?.mood ?? null, activities: e?.activities ?? [], answers: e?.answers ?? {}, englishLine: e?.englishLine ?? "", learned: e?.learned ?? "", photos };
}

/** Ánimo y si hay fotos, día por día, de un mes (YYYY-MM). */
export async function monthOf(userId: string, month: string) {
  const from = `${month}-01`;
  // Último día real del mes (noviembre no tiene 31: Postgres rechaza la fecha).
  const [y, m] = month.split("-").map(Number);
  const to = `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
  const [entries, photos] = await Promise.all([
    db().select({ day: J.day, mood: J.mood, learned: J.learned, englishLine: J.englishLine }).from(J).where(and(eq(J.userId, userId), gte(J.day, from), lte(J.day, to))),
    db().select({ day: Ph.day, n: sql<number>`count(*)::int` }).from(Ph).where(and(eq(Ph.userId, userId), gte(Ph.day, from), lte(Ph.day, to))).groupBy(Ph.day),
  ]);
  const pics = new Map(photos.map((p) => [p.day, p.n]));
  return entries.map((e) => ({ day: e.day, mood: e.mood, photos: pics.get(e.day) ?? 0, written: !!(e.learned || e.englishLine) }));
}

/** Espacio que ocupan la base y las fotos (para vigilar el límite del plan gratuito). */
export async function storageUsage() {
  const [[dbSize], [pics]] = await Promise.all([
    db().execute(sql`select pg_database_size(current_database())::bigint as bytes`).then((r) => (r as unknown as { rows?: { bytes: string }[] }).rows ?? (r as unknown as { bytes: string }[])),
    db().select({ bytes: sql<number>`coalesce(sum(${Ph.size}), 0)::bigint`, n: sql<number>`count(*)::int` }).from(Ph),
  ]);
  return { dbBytes: Number(dbSize?.bytes ?? 0), photoBytes: Number(pics?.bytes ?? 0), photos: Number(pics?.n ?? 0) };
}
