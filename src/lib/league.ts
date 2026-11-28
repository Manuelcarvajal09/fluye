import "server-only";
import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { settingsOf } from "./user";
import { lookOf, wearOf } from "./look";
import { awardGems } from "./rewards";
import { LEAGUES, PROMOTE_GEMS, addWeeks, decide, leagueWeek, nextTier, weekEnd, type Result } from "./league-rules";

const L = schema.leagueMembers;

/** XP de la semana (de lunes a domingo, por día local de cada cuenta) para varias cuentas. */
async function weekXp(userIds: string[], week: string) {
  if (!userIds.length) return new Map<string, number>();
  const rows = await db()
    .select({ id: schema.dailyStats.userId, xp: sql<number>`coalesce(sum(${schema.dailyStats.xp}), 0)::int` })
    .from(schema.dailyStats)
    .where(and(inArray(schema.dailyStats.userId, userIds), gte(schema.dailyStats.day, week), lte(schema.dailyStats.day, weekEnd(week))))
    .groupBy(schema.dailyStats.userId);
  return new Map(rows.map((r) => [r.id, r.xp]));
}

/**
 * Cierra una semana ya terminada para todas las cuentas (idempotente: solo quien inserta la fila de league_weeks la cierra).
 * Congela el XP, decide quién sube o baja en cada nivel y paga las gemas de ascenso.
 */
/** Si otra petición está cerrando la semana ahora mismo, espera a que termine para no dar de alta con el nivel viejo. */
async function settled(week: string) {
  const d = db();
  for (let n = 0; n < 20; n++) {
    const [open] = await d.select({ one: sql<number>`1` }).from(L).where(and(eq(L.week, week), isNull(L.result))).limit(1);
    if (!open) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function closeWeek(week: string) {
  const d = db();
  const claimed = await d.insert(schema.leagueWeeks).values({ week }).onConflictDoNothing().returning({ week: schema.leagueWeeks.week });
  if (!claimed.length) return;
  const members = await d.select().from(L).where(eq(L.week, week));
  const xp = await weekXp(members.map((m) => m.userId), week);
  const byTier = new Map<number, typeof members>();
  for (const m of members) byTier.set(m.tier, [...(byTier.get(m.tier) ?? []), m]);
  for (const [tier, group] of byTier) {
    const res = decide(tier, group.map((m) => ({ userId: m.userId, xp: xp.get(m.userId) ?? 0 })));
    for (const m of group) {
      const r = res.get(m.userId)!;
      await d.update(L).set({ xp: xp.get(m.userId) ?? 0, rank: r.rank, groupSize: group.length, result: r.result }).where(and(eq(L.userId, m.userId), eq(L.week, week)));
      if (r.result === "up") {
        const to = nextTier(tier, "up");
        await awardGems(m.userId, `league:${week}`, PROMOTE_GEMS[to], `Subiste a la liga ${LEAGUES[to]}`);
      }
    }
  }
}

/**
 * Da de alta a la cuenta en la liga de esta semana (cerrando antes las semanas pendientes).
 * Nivel de partida: el de su última semana con su resultado aplicado; cada semana completa sin entrar cuenta como 0 XP (baja uno).
 */
export async function ensureLeague(profile: Profile) {
  const d = db();
  const week = leagueWeek();
  const prev = addWeeks(week, -1);
  const [closedPrev] = await d.select().from(schema.leagueWeeks).where(eq(schema.leagueWeeks.week, prev));
  if (!closedPrev) {
    const [anyPrev] = await d.select({ one: sql<number>`1` }).from(L).where(eq(L.week, prev)).limit(1);
    if (anyPrev) await closeWeek(prev);
  }
  const [mine] = await d.select().from(L).where(and(eq(L.userId, profile.userId), eq(L.week, week)));
  if (mine) return mine;
  await settled(prev);
  const [last] = await d.select().from(L).where(eq(L.userId, profile.userId)).orderBy(desc(L.week)).limit(1);
  let tier = 0;
  if (last) {
    tier = last.result ? nextTier(last.tier, last.result as Result) : last.tier;
    // Semanas completas sin entrar (entre la última registrada y esta): cada una baja un nivel.
    let w = addWeeks(last.week, 1);
    while (w < week && tier > 0) {
      tier--;
      w = addWeeks(w, 1);
    }
  }
  const [row] = await d.insert(L).values({ userId: profile.userId, week, tier }).onConflictDoNothing().returning();
  return row ?? (await d.select().from(L).where(and(eq(L.userId, profile.userId), eq(L.week, week))))[0];
}

export type LeagueEntry = { name: string; species: string; wear: string[]; xp: number; me: boolean; friend: boolean; zone: Result };
export type LeagueView = {
  tier: number;
  name: string;
  week: string;
  endsAt: string;
  entries: LeagueEntry[];
  last: { tier: number; result: Result; rank: number | null; size: number | null; gems: number; seen: boolean; week: string } | null;
};

/** Liga de esta semana: tu nivel, la tabla de tu grupo en vivo (con amigos destacados) y el resultado de la semana pasada. */
export async function leagueView(profile: Profile, friendIds: Set<string>): Promise<LeagueView> {
  const me = await ensureLeague(profile);
  const d = db();
  const group = await d.select().from(L).where(and(eq(L.week, me.week), eq(L.tier, me.tier)));
  const ids = group.map((g) => g.userId);
  const [xp, people] = await Promise.all([weekXp(ids, me.week), ids.length ? d.select().from(schema.profiles).where(inArray(schema.profiles.userId, ids)) : Promise.resolve([])]);
  const standings = ids.map((id) => ({ userId: id, xp: xp.get(id) ?? 0 }));
  const zones = decide(me.tier, standings);
  const entries: LeagueEntry[] = people
    .map((p) => {
      const look = lookOf(settingsOf(p).look);
      return {
        name: (p.name || look.name).split(" ")[0],
        species: look.species,
        wear: wearOf(look),
        xp: xp.get(p.userId) ?? 0,
        me: p.userId === profile.userId,
        friend: friendIds.has(p.userId),
        zone: zones.get(p.userId)?.result ?? "stay",
      };
    })
    .sort((a, b) => b.xp - a.xp || Number(b.me) - Number(a.me));
  const [last] = await d.select().from(L).where(and(eq(L.userId, profile.userId), eq(L.week, addWeeks(me.week, -1))));
  return {
    tier: me.tier,
    name: LEAGUES[me.tier],
    week: me.week,
    endsAt: weekEnd(me.week),
    entries,
    last: last?.result ? { tier: last.tier, result: last.result as Result, rank: last.rank, size: last.groupSize, gems: last.result === "up" ? PROMOTE_GEMS[nextTier(last.tier, "up")] : 0, seen: last.seen, week: last.week } : null,
  };
}

/** Marca como visto el aviso del resultado de una semana. */
export async function markLeagueSeen(userId: string, week: string) {
  await db().update(L).set({ seen: true }).where(and(eq(L.userId, userId), eq(L.week, week)));
}
