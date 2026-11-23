import "server-only";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { addDays, dayDiff, goalXp, localDay } from "./game";
import { shopCatalog } from "./look";
import { GEMS, weeklyChallenges, weekKey, weekStart } from "./challenges";

/**
 * Otorga gemas con clave idempotente. Devuelve true solo la primera vez para esa clave.
 * Reglas documentadas en docs/GAMIFICACION.md: las gemas vienen de metas y retos (nunca por respuesta suelta).
 */
export async function awardGems(userId: string, key: string, amount: number, reason: string) {
  const d = db();
  const ins = await d.insert(schema.gemLedger).values({ userId, key, amount, reason }).onConflictDoNothing().returning({ key: schema.gemLedger.key });
  if (!ins.length) return false;
  await d.update(schema.profiles).set({ gems: sql`${schema.profiles.gems} + ${amount}` }).where(eq(schema.profiles.userId, userId));
  return true;
}

export async function ownedItems(userId: string) {
  const rows = await db().select({ id: schema.inventory.itemId }).from(schema.inventory).where(eq(schema.inventory.userId, userId));
  return new Set(rows.map((r) => r.id));
}

/** Compra: descuenta solo si alcanza (condición en el UPDATE) y registra el objeto; si ya lo tenía, devuelve las gemas. */
export async function buy(profile: Profile, itemId: string): Promise<{ ok: true; gems: number } | { ok: false; error: string }> {
  const item = shopCatalog().find((i) => i.id === itemId);
  if (!item) return { ok: false, error: "No existe ese objeto." };
  const d = db();
  if (item.kind === "freeze" && profile.freezes >= 2) return { ok: false, error: "Ya tienes 2 protectores (el máximo)." };
  const [paid] = await d
    .update(schema.profiles)
    .set({ gems: sql`${schema.profiles.gems} - ${item.price}`, ...(item.kind === "freeze" ? { freezes: sql`least(${schema.profiles.freezes} + 1, 2)` } : {}) })
    .where(and(eq(schema.profiles.userId, profile.userId), gte(schema.profiles.gems, item.price), ...(item.kind === "freeze" ? [lte(schema.profiles.freezes, 1)] : [])))
    .returning({ gems: schema.profiles.gems });
  if (!paid) return { ok: false, error: "Te faltan gemas." };
  if (item.kind !== "freeze") {
    const ins = await d.insert(schema.inventory).values({ userId: profile.userId, itemId }).onConflictDoNothing().returning({ id: schema.inventory.itemId });
    if (!ins.length) {
      await d.update(schema.profiles).set({ gems: sql`${schema.profiles.gems} + ${item.price}` }).where(eq(schema.profiles.userId, profile.userId));
      return { ok: false, error: "Ya lo tenías." };
    }
  }
  return { ok: true, gems: paid.gems };
}

/**
 * Protectores de racha: si faltaron días desde la última meta y hay protectores suficientes, se consumen
 * y esos días quedan marcados como "protegidos" (no estudiados). Se calcula con el día local de la persona,
 * así que cambiar de zona horaria al viajar no crea días dobles.
 */
export async function applyFreezes(profile: Profile): Promise<Profile> {
  if (!profile.lastGoalDay || profile.freezes <= 0 || profile.streak <= 0) return profile;
  const today = localDay(profile.tz);
  const gap = dayDiff(profile.lastGoalDay, today) - 1; // días perdidos (sin contar hoy)
  if (gap <= 0 || gap > profile.freezes) return profile;
  const d = db();
  const days = Array.from({ length: gap }, (_, k) => addDays(profile.lastGoalDay!, k + 1));
  const [upd] = await d
    .update(schema.profiles)
    .set({ freezes: sql`${schema.profiles.freezes} - ${gap}`, lastGoalDay: days[days.length - 1] })
    .where(and(eq(schema.profiles.userId, profile.userId), eq(schema.profiles.lastGoalDay, profile.lastGoalDay), gte(schema.profiles.freezes, gap)))
    .returning();
  if (!upd) return profile;
  for (const day of days)
    await d
      .insert(schema.dailyStats)
      .values({ userId: profile.userId, day, frozen: 1 })
      .onConflictDoUpdate({ target: [schema.dailyStats.userId, schema.dailyStats.day], set: { frozen: 1 } });
  return upd;
}

/** Revisa y paga los retos semanales cumplidos (idempotente por semana y reto). */
export async function settleWeekly(profile: Profile) {
  const today = localDay(profile.tz);
  const start = weekStart(today);
  const rows = await db()
    .select()
    .from(schema.dailyStats)
    .where(and(eq(schema.dailyStats.userId, profile.userId), gte(schema.dailyStats.day, start), lte(schema.dailyStats.day, today)));
  const goal = goalXp(profile.goalMinutes);
  const agg = {
    goalDays: rows.filter((r) => r.xp >= goal && !r.frozen).length,
    speaking: rows.reduce((a, r) => a + r.speaking, 0),
    newItems: rows.reduce((a, r) => a + r.newItems, 0),
    activeDays: rows.filter((r) => r.reviews > 0).length,
    correct: rows.reduce((a, r) => a + r.correct, 0),
  };
  const list = weeklyChallenges(start).map((c) => ({ ...c, value: c.value(agg), done: c.value(agg) >= c.target }));
  for (const c of list) if (c.done) await awardGems(profile.userId, `wk:${weekKey(start)}:${c.id}`, GEMS.weekly, `Reto semanal: ${c.label}`);
  return list;
}
