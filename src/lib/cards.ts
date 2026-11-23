import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { newCard, review, type Grade } from "./srs";
import type { Mode } from "./types";
import { MODES } from "./types";

const DAY = 86_400_000;
/** Escalonado al aprender: reconocer y producir hoy; oído mañana; voz pasado mañana. */
const OFFSET: Record<Mode, number> = { recog: 0, prod: 0, listen: DAY, speak: 2 * DAY };

/** Crea las 4 tarjetas de un ítem si no existen. Devuelve true si el ítem era nuevo. */
export async function ensureCards(userId: string, itemId: string, now: Date, retention?: number, understandOnly = false) {
  const rows = await Promise.all(
    MODES.map(async (mode) => {
      const due = new Date(now.getTime() + OFFSET[mode]);
      const fsrs = await newCard(due, retention);
      // Meta "entenderla": producir y hablar quedan en pausa (no se borran; se activan si cambias la meta).
      return { userId, itemId, mode, due, fsrs, suspended: understandOnly && (mode === "prod" || mode === "speak") ? 1 : 0 };
    }),
  );
  const inserted = await db().insert(schema.cards).values(rows).onConflictDoNothing().returning({ mode: schema.cards.mode });
  return inserted.length === MODES.length;
}

export type ReviewMeta = { attemptId?: string; firstTry?: boolean; hints?: number; revealed?: boolean; kind?: "graded" | "self" };

/**
 * Aplica un repaso. Con attemptId es idempotente: el registro se inserta primero y, si ya existía
 * (recarga, reintento, reconexión), no se vuelve a tocar la tarjeta ni a sumar puntos.
 */
export async function reviewCard(userId: string, itemId: string, mode: Mode, grade: Grade, now: Date, ms: number | null, retention?: number, meta: ReviewMeta = {}) {
  const d = db();
  const where = and(eq(schema.cards.userId, userId), eq(schema.cards.itemId, itemId), eq(schema.cards.mode, mode));
  const [card] = await d.select().from(schema.cards).where(where);
  if (!card) return null;
  const next = await review(card.fsrs, grade, now, retention);
  const logged = await d
    .insert(schema.reviewLogs)
    .values({
      userId,
      itemId,
      mode,
      rating: grade,
      stateBefore: card.state,
      stabilityAfter: next.stability,
      scheduledDays: next.scheduledDays,
      durationMs: ms,
      reviewedAt: now,
      attemptId: meta.attemptId ?? null,
      firstTry: meta.firstTry ?? null,
      hints: meta.hints ?? 0,
      revealed: meta.revealed ?? false,
      kind: meta.kind ?? "graded",
    })
    .onConflictDoNothing()
    .returning({ id: schema.reviewLogs.id });
  if (!logged.length) return { duplicate: true as const, due: String(card.fsrs.dueAt), state: card.state, scheduledDays: 0 };
  await d
    .update(schema.cards)
    .set({ fsrs: next, due: new Date(next.dueAt), state: next.state, stability: next.stability, reps: next.reps, lapses: next.lapses, lastReview: now })
    .where(where);
  return { duplicate: false as const, due: next.dueAt, state: next.state, scheduledDays: next.scheduledDays };
}
