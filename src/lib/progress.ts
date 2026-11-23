import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { goalXp, localDay, missionsFor, nextStreak, XP, type DayCounters } from "./game";
import { applyFreezes, awardGems } from "./rewards";
import { GEMS } from "./challenges";

export type Delta = Partial<DayCounters> & { seconds?: number };

/**
 * Suma contadores del día, otorga bonos de misión, actualiza XP total y racha.
 * Todo con upserts idempotentes por (persona, día): no hace falta transacción.
 */
export async function recordProgress(original: Profile, delta: Delta) {
  const profile = await applyFreezes(original);
  const today = localDay(profile.tz);
  const d = db();
  const [row] = await d
    .insert(schema.dailyStats)
    .values({
      userId: profile.userId,
      day: today,
      xp: delta.xp ?? 0,
      reviews: delta.reviews ?? 0,
      correct: delta.correct ?? 0,
      newItems: delta.newItems ?? 0,
      speaking: delta.speaking ?? 0,
      seconds: delta.seconds ?? 0,
    })
    .onConflictDoUpdate({
      target: [schema.dailyStats.userId, schema.dailyStats.day],
      set: {
        xp: sql`${schema.dailyStats.xp} + ${delta.xp ?? 0}`,
        reviews: sql`${schema.dailyStats.reviews} + ${delta.reviews ?? 0}`,
        correct: sql`${schema.dailyStats.correct} + ${delta.correct ?? 0}`,
        newItems: sql`${schema.dailyStats.newItems} + ${delta.newItems ?? 0}`,
        speaking: sql`${schema.dailyStats.speaking} + ${delta.speaking ?? 0}`,
        seconds: sql`${schema.dailyStats.seconds} + ${delta.seconds ?? 0}`,
      },
    })
    .returning();

  // Misiones recién completadas -> bono.
  const done = new Set(row.missions ?? []);
  const newly = missionsFor(today, profile.goalMinutes).filter((m) => !done.has(m.id) && m.value(row) >= m.target);
  let bonus = 0;
  let dayXp = row.xp;
  if (newly.length) {
    bonus = newly.length * XP.mission;
    const [upd] = await d
      .update(schema.dailyStats)
      .set({ xp: sql`${schema.dailyStats.xp} + ${bonus}`, missions: [...done, ...newly.map((m) => m.id)] })
      .where(and(eq(schema.dailyStats.userId, profile.userId), eq(schema.dailyStats.day, today)))
      .returning();
    dayXp = upd.xp;
  }

  const gained = (delta.xp ?? 0) + bonus;
  const reachedNow = dayXp >= goalXp(profile.goalMinutes) && profile.lastGoalDay !== today;
  const streak = reachedNow ? nextStreak(profile.streak, profile.lastGoalDay, today) : profile.streak;
  await d
    .update(schema.profiles)
    .set({
      xp: sql`${schema.profiles.xp} + ${gained}`,
      ...(reachedNow ? { streak, bestStreak: Math.max(profile.bestStreak, streak), lastGoalDay: today } : {}),
    })
    .where(eq(schema.profiles.userId, profile.userId));

  let gems = 0;
  if (reachedNow && (await awardGems(profile.userId, `goal:${today}`, GEMS.dailyGoal, "Meta diaria"))) gems += GEMS.dailyGoal;
  for (const m of newly) if (await awardGems(profile.userId, `mission:${today}:${m.id}`, GEMS.dailyMission, `Reto diario: ${m.label}`)) gems += GEMS.dailyMission;

  return { gems, gained, dayXp, goal: goalXp(profile.goalMinutes), goalReached: reachedNow, streak, missions: newly.map((m) => m.label) };
}
