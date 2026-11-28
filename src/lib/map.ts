import "server-only";
import { and, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { ITEMS, LESSONS, ROLEPLAYS, ROUTES, getItem } from "./content";
import { READINGS } from "./readings";
import { openChest } from "./economy";
import { awardGems } from "./rewards";
import { buildIslands, ISLAND_NAMES, MAP_LEVELS, type MapLevel } from "./map-rules";
import type { Profile } from "./user";

const TRACKS = ROUTES.flatMap((r) =>
  r.tracks.map((t) => ({ id: t.id, level: t.level, band: t.band, lessonId: t.lesson.id, routeId: r.id, routeTitle: r.title_es, minutes: t.minutes, interview: r.id.startsWith("entrevista-") })),
);
const WORD_TOTALS = new Map<string, number>();
for (const i of ITEMS) WORD_TOTALS.set(i.level, (WORD_TOTALS.get(i.level) ?? 0) + 1);

/** Islas con tu progreso real (lecciones, misiones, conversaciones, lecturas y expresiones aprendidas). */
export async function mapOf(userId: string) {
  const d = db();
  const [lessons, reads, chests, trophies, cards] = await Promise.all([
    d.select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, userId)),
    d.select({ id: schema.readingProgress.readingId }).from(schema.readingProgress).where(eq(schema.readingProgress.userId, userId)),
    d.select({ key: schema.walletEvents.key }).from(schema.walletEvents).where(and(eq(schema.walletEvents.userId, userId), like(schema.walletEvents.key, "map-chest:%"))),
    d.select({ key: schema.gemLedger.key }).from(schema.gemLedger).where(and(eq(schema.gemLedger.userId, userId), like(schema.gemLedger.key, "map-island:%"))),
    d.selectDistinct({ itemId: schema.cards.itemId }).from(schema.cards).where(eq(schema.cards.userId, userId)),
  ]);
  const known = new Map<string, number>();
  for (const c of cards) {
    const lv = getItem(c.itemId)?.level;
    if (lv) known.set(lv, (known.get(lv) ?? 0) + 1);
  }
  const words: Partial<Record<MapLevel, { known: number; total: number }>> = {};
  for (const lv of MAP_LEVELS) words[lv] = { known: known.get(lv) ?? 0, total: WORD_TOTALS.get(lv) ?? 0 };
  return buildIslands({
    lessons: LESSONS,
    tracks: TRACKS,
    roleplays: ROLEPLAYS,
    readings: READINGS,
    done: new Set(lessons.map((l) => l.id)),
    readDone: new Set(reads.map((r) => r.id)),
    claimed: new Set([...chests, ...trophies].map((k) => k.key)),
    words,
  });
}

/** Cofre de una sección terminada: gratis y una sola vez (la clave lo hace idempotente). */
export async function claimSectionChest(profile: Profile, sectionId: string) {
  const islands = await mapOf(profile.userId);
  const section = islands.flatMap((i) => i.sections).find((s) => s.id === sectionId);
  if (!section) return { ok: false as const, error: "No existe esa sección." };
  if (section.chest.claimed) return { ok: false as const, error: "Ese cofre ya se abrió." };
  if (!section.chest.ready) return { ok: false as const, error: "Termina todas las paradas de la sección para abrir su cofre." };
  const level = sectionId.split("-")[0] as MapLevel;
  return openChest(profile, section.chest.chestId, "", { key: section.chest.key, reason: `Cofre del mapa · ${ISLAND_NAMES[level]}, sección ${section.n}` });
}

/** Trofeo de una isla completa: gemas, una sola vez. */
export async function claimIslandTrophy(profile: Profile, level: string) {
  const islands = await mapOf(profile.userId);
  const isl = islands.find((i) => i.level === level);
  if (!isl) return { ok: false as const, error: "No existe esa isla." };
  if (isl.trophy.claimed) return { ok: false as const, error: "Ya recogiste este trofeo." };
  if (!isl.trophy.ready) return { ok: false as const, error: "Completa todas las paradas de la isla para ganar el trofeo." };
  const paid = await awardGems(profile.userId, isl.trophy.key, isl.trophy.gems, `Trofeo · ${isl.name}`);
  if (!paid) return { ok: false as const, error: "Ya recogiste este trofeo." };
  return { ok: true as const, gems: isl.trophy.gems };
}
