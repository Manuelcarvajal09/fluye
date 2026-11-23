import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { addDays, localDay } from "./game";
import type { Profile } from "./user";
import { MASTERY_DAYS } from "./srs";

export async function dueCount(userId: string, until = new Date()) {
  const [r] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.cards)
    .where(and(eq(schema.cards.userId, userId), eq(schema.cards.suspended, 0), lte(schema.cards.due, until)));
  return r?.n ?? 0;
}

/** Estado por ítem: nuevo (sin tarjetas), aprendiendo, dominado (recog+prod+listen estables >= 21 días). */
export async function itemStatus(userId: string) {
  const rows = await db()
    .select({
      itemId: schema.cards.itemId,
      mastered: sql<boolean>`bool_and(case when ${schema.cards.mode} in ('recog','prod','listen') then ${schema.cards.state} = 2 and ${schema.cards.stability} >= ${MASTERY_DAYS} else true end)`,
      suspended: sql<boolean>`bool_or(${schema.cards.suspended} = 1)`,
    })
    .from(schema.cards)
    .where(eq(schema.cards.userId, userId))
    .groupBy(schema.cards.itemId);
  return new Map(rows.map((r) => [r.itemId, r.suspended ? "suspended" : r.mastered ? "mastered" : "learning"] as const));
}

export async function lastDays(profile: Profile, days: number) {
  const today = localDay(profile.tz);
  const from = addDays(today, -(days - 1));
  const rows = await db()
    .select()
    .from(schema.dailyStats)
    .where(and(eq(schema.dailyStats.userId, profile.userId), gte(schema.dailyStats.day, from)));
  const map = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(from, i);
    const r = map.get(day);
    return { day, xp: r?.xp ?? 0, reviews: r?.reviews ?? 0, correct: r?.correct ?? 0, newItems: r?.newItems ?? 0, speaking: r?.speaking ?? 0, seconds: r?.seconds ?? 0, missions: r?.missions ?? [] };
  });
}

/** Carga de los próximos días (tarjetas que vencen por día local). */
export async function forecast(profile: Profile, days = 14) {
  const rows = await db()
    .select({ day: sql<string>`to_char(${schema.cards.due} at time zone ${profile.tz}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
    .from(schema.cards)
    .where(and(eq(schema.cards.userId, profile.userId), eq(schema.cards.suspended, 0), lte(schema.cards.due, new Date(Date.now() + days * 86_400_000))))
    .groupBy(sql`1`);
  const today = localDay(profile.tz);
  const map = new Map(rows.map((r) => [r.day < today ? today : r.day, 0]));
  for (const r of rows) {
    const d = r.day < today ? today : r.day;
    map.set(d, (map.get(d) ?? 0) + r.n);
  }
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i);
    return { day, n: map.get(day) ?? 0 };
  });
}

/** Retención real: % de repasos de tarjetas ya en repaso que no fueron "Again", últimos 30 días. */
export async function retention(userId: string) {
  const [r] = await db()
    .select({
      total: sql<number>`count(*)::int`,
      kept: sql<number>`count(*) filter (where ${schema.reviewLogs.rating} > 1)::int`,
    })
    .from(schema.reviewLogs)
    .where(and(eq(schema.reviewLogs.userId, userId), eq(schema.reviewLogs.stateBefore, 2), gte(schema.reviewLogs.reviewedAt, new Date(Date.now() - 30 * 86_400_000))));
  return { total: r?.total ?? 0, rate: r && r.total ? r.kept / r.total : null };
}

/** Totales para los logros. */
export async function achievementTotals(userId: string) {
  const d = db();
  const [[reviews], [rec], [rp], [ls]] = await Promise.all([
    d.select({ n: sql<number>`count(*)::int` }).from(schema.reviewLogs).where(eq(schema.reviewLogs.userId, userId)),
    d.select({ n: sql<number>`coalesce(sum(${schema.soundProgress.recordings}), 0)::int` }).from(schema.soundProgress).where(eq(schema.soundProgress.userId, userId)),
    d.select({ n: sql<number>`count(*)::int` }).from(schema.lessonProgress).where(and(eq(schema.lessonProgress.userId, userId), sql`${schema.lessonProgress.lessonId} like 'rp-%'`)),
    d.select({ n: sql<number>`count(*)::int` }).from(schema.lessonProgress).where(and(eq(schema.lessonProgress.userId, userId), sql`${schema.lessonProgress.lessonId} like 'les-%'`)),
  ]);
  return { reviews: reviews?.n ?? 0, recordings: rec?.n ?? 0, roleplays: rp?.n ?? 0, lessons: ls?.n ?? 0 };
}

export async function modeBreakdown(userId: string) {
  return db()
    .select({ mode: schema.cards.mode, state: schema.cards.state, n: sql<number>`count(*)::int` })
    .from(schema.cards)
    .where(eq(schema.cards.userId, userId))
    .groupBy(schema.cards.mode, schema.cards.state);
}
