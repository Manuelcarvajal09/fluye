import "server-only";
import { and, eq, gte, inArray, min, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { addDays, goalXp, localDay } from "./game";
import { MASTERY_DAYS } from "./srs";
import { getItem } from "./content";

export type Period = "7" | "30" | "90" | "all";
export const PERIODS: { id: Period; label: string }[] = [
  { id: "7", label: "7 días" },
  { id: "30", label: "30 días" },
  { id: "90", label: "90 días" },
  { id: "all", label: "Todo" },
];
/** Muestras menores a esto se marcan como "pocos datos". */
export const SMALL_SAMPLE = 30;

/** Desde cuándo cuenta el periodo (null = todo el historial). */
export function periodStart(profile: Profile, p: Period) {
  if (p === "all") return null;
  return addDays(localDay(profile.tz), -(Number(p) - 1));
}

/** Tiempo activo real (interacción/audio/grabación). Antes del primer registro el dato es desconocido, no cero. */
export async function activeTimeStats(profile: Profile, from: string | null) {
  const d = db();
  const where = from ? and(eq(schema.activeTime.userId, profile.userId), gte(schema.activeTime.day, from)) : eq(schema.activeTime.userId, profile.userId);
  const [rows, [first]] = await Promise.all([
    d.select({ day: schema.activeTime.day, s: sql<number>`sum(${schema.activeTime.seconds})::int` }).from(schema.activeTime).where(where).groupBy(schema.activeTime.day),
    d.select({ day: min(schema.activeTime.day) }).from(schema.activeTime).where(eq(schema.activeTime.userId, profile.userId)),
  ]);
  const total = rows.reduce((a, r) => a + r.s, 0);
  return { since: first?.day ?? null, total, byDay: new Map(rows.map((r) => [r.day, r.s])) };
}

export async function sessionStats(userId: string, fromDate: Date | null) {
  const where = fromDate ? and(eq(schema.studySessions.userId, userId), gte(schema.studySessions.startedAt, fromDate)) : eq(schema.studySessions.userId, userId);
  const [r] = await db()
    .select({ started: sql<number>`count(*) filter (where ${schema.studySessions.done} > 0 or ${schema.studySessions.finishedAt} is not null)::int`, finished: sql<number>`count(${schema.studySessions.finishedAt})::int`, missions: sql<number>`count(*) filter (where ${schema.studySessions.kind} = 'mission' and (${schema.studySessions.done} > 0 or ${schema.studySessions.finishedAt} is not null))::int` })
    .from(schema.studySessions)
    .where(where);
  return r ?? { started: 0, finished: 0, missions: 0 };
}

/**
 * Retención observada: solo repasos ELEGIBLES (tarjeta ya en repaso, primer intento, sin pistas ni solución vista).
 * Se informa con su denominador; con pocos datos se marca.
 */
export async function observedRetention(userId: string, fromDate: Date | null) {
  const t = schema.reviewLogs;
  const conds = [eq(t.userId, userId), eq(t.stateBefore, 2), eq(t.revealed, false), eq(t.hints, 0), sql`coalesce(${t.firstTry}, true)`];
  if (fromDate) conds.push(gte(t.reviewedAt, fromDate));
  const [r] = await db()
    .select({ n: sql<number>`count(*)::int`, kept: sql<number>`count(*) filter (where ${t.rating} > 1)::int` })
    .from(t)
    .where(and(...conds));
  return { n: r?.n ?? 0, rate: r?.n ? r.kept / r.n : null };
}

export async function errorStats(userId: string, fromDate: Date | null) {
  const t = schema.errorEvents;
  return db()
    .select({ category: t.category, n: sql<number>`count(*)::int` })
    .from(t)
    .where(fromDate ? and(eq(t.userId, userId), gte(t.createdAt, fromDate)) : eq(t.userId, userId))
    .groupBy(t.category)
    .orderBy(sql`2 desc`);
}

/**
 * Vocabulario por estado, sin duplicar modalidades (una expresión cuenta una vez en su estado más alto):
 * explorada (vista, sin repaso con éxito) · declarada (dijiste "ya la conozco") · reconocida con evidencia ·
 * producida (la escribiste/elegiste bien en producción) · consolidada (3 modos estables ≥ 21 días).
 */
export async function vocabStates(profile: Profile, declared: string[]) {
  const c = schema.cards;
  const rows = await db()
    .select({
      itemId: c.itemId,
      recog: sql<boolean>`bool_or(${c.mode} = 'recog' and ${c.reps} > ${c.lapses} and ${c.reps} > 0)`,
      prod: sql<boolean>`bool_or(${c.mode} = 'prod' and ${c.reps} > ${c.lapses} and ${c.reps} > 0)`,
      consolidated: sql<boolean>`bool_and(case when ${c.mode} in ('recog','prod','listen') then ${c.state} = 2 and ${c.stability} >= ${MASTERY_DAYS} else true end)`,
    })
    .from(c)
    .where(eq(c.userId, profile.userId))
    .groupBy(c.itemId);
  const words = { explored: 0, declared: 0, recognized: 0, produced: 0, consolidated: 0 };
  const expressions = { ...words };
  const seen = new Set<string>();
  for (const r of rows) {
    seen.add(r.itemId);
    const it = getItem(r.itemId);
    const bucket = it?.type === "vocab" ? words : expressions;
    if (r.consolidated && r.recog) bucket.consolidated++;
    else if (r.prod) bucket.produced++;
    else if (r.recog) bucket.recognized++;
    else bucket.explored++;
  }
  for (const id of declared) {
    if (seen.has(id)) continue;
    const it = getItem(id);
    (it?.type === "vocab" ? words : expressions).declared++;
  }
  return { words, expressions };
}

export async function areaProgress(userId: string) {
  const rows = await db().selectDistinct({ itemId: schema.cards.itemId }).from(schema.cards).where(eq(schema.cards.userId, userId));
  const map = new Map<string, number>();
  for (const r of rows) for (const a of getItem(r.itemId)?.areas ?? []) map.set(a, (map.get(a) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export async function oralStats(userId: string, fromDate: Date | null) {
  const t = schema.reviewLogs;
  const [r] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(t)
    .where(and(eq(t.userId, userId), eq(t.mode, "speak"), ...(fromDate ? [gte(t.reviewedAt, fromDate)] : [])));
  return r?.n ?? 0;
}

/** Constancia: días con actividad, con meta cumplida y protegidos (separados) en el periodo. */
export async function consistency(profile: Profile, from: string | null) {
  const t = schema.dailyStats;
  const rows = await db()
    .select()
    .from(t)
    .where(from ? and(eq(t.userId, profile.userId), gte(t.day, from)) : eq(t.userId, profile.userId));
  const goal = goalXp(profile.goalMinutes);
  const first = rows.map((r) => r.day).sort()[0] ?? null;
  return {
    first,
    active: rows.filter((r) => r.reviews > 0 || r.xp > 0).length,
    goalDays: rows.filter((r) => r.xp >= goal).length,
    frozen: rows.filter((r) => r.frozen).length,
    byDay: new Map(rows.map((r) => [r.day, r])),
  };
}

/** Reto privado entre miembros que lo activaron: % de días con su propia meta (justo para distintos minutos). */
export async function friendChallenge(profile: Profile) {
  const today = localDay(profile.tz);
  const monday = addDays(today, -((new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7));
  const people = await db()
    .select({ userId: schema.profiles.userId, name: schema.profiles.name, goal: schema.profiles.goalMinutes, settings: schema.profiles.settings })
    .from(schema.profiles)
    .innerJoin(schema.members, eq(schema.members.userId, schema.profiles.userId))
    .where(and(eq(schema.members.status, "active"), sql`${schema.profiles.settings} ->> 'social' = 'true'`));
  const ids = people.map((p) => p.userId);
  if (ids.length < 2 || !ids.includes(profile.userId)) return null;
  const rows = await db()
    .select({ userId: schema.dailyStats.userId, xp: schema.dailyStats.xp })
    .from(schema.dailyStats)
    .where(and(gte(schema.dailyStats.day, monday), inArray(schema.dailyStats.userId, ids)));
  const days = Math.max(1, Math.round((Date.parse(today) - Date.parse(monday)) / 86_400_000) + 1);
  return people
    .map((p) => ({ me: p.userId === profile.userId, name: (p.name || "Alguien").split(" ")[0], days: rows.filter((r) => r.userId === p.userId && r.xp >= goalXp(p.goal)).length, of: days }))
    .sort((a, b) => b.days - a.days);
}
