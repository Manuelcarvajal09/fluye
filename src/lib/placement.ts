import { LEVELS, type Level, type PlacementQ } from "./types";

export type Tally = Record<string, { right: number; total: number; skipped?: number }>;

/**
 * Acierto corregido por azar: con 4 opciones, responder a ciegas da 25 %. Cada fallo resta 1/3 de punto; un «No lo sé»
 * no resta (por eso conviene usarlo en vez de adivinar). 1 = todo bien, 0 = lo esperable adivinando.
 */
export function corrected(t: { right: number; total: number; skipped?: number } | undefined) {
  if (!t || !t.total) return null;
  const wrong = t.total - t.right - (t.skipped ?? 0);
  return Math.max(0, (t.right - wrong / 3) / t.total);
}

/** Dominas un nivel con ≥ 55 % corregido (≈ 66 % de aciertos sin saltar ninguna). Los niveles de abajo deben ir en ≥ 45 %. */
const PASS = 0.55;
const BASE = 0.45;
/** Entre 40 % y 55 % en el nivel siguiente: estás «entre dos niveles». */
const NEAR = 0.4;

export function estimate(byLevel: Tally): { level: Level; near: Level | null } {
  let best = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const c = corrected(byLevel[LEVELS[i]]);
    if (c === null) continue;
    const lowerOk = LEVELS.slice(0, i).every((x) => (corrected(byLevel[x]) ?? 1) >= BASE);
    if (c >= PASS && lowerOk) best = i;
  }
  const nextC = corrected(byLevel[LEVELS[best + 1]]);
  return { level: LEVELS[best], near: nextC !== null && nextC >= NEAR && nextC < PASS ? LEVELS[best + 1] : null };
}
export const estimateFromTally = (byLevel: Tally): Level => estimate(byLevel).level;

export function grade(questions: PlacementQ[], answers: Record<string, number | null>) {
  const bySection: Tally = {};
  const byLevel: Tally = {};
  let score = 0;
  const review: { id: string; ok: boolean; answer: number; picked: number | null; why_es?: string }[] = [];
  for (const q of questions) {
    const picked = answers[q.id] ?? null;
    const ok = picked === q.answer;
    if (ok) score++;
    for (const [tally, key] of [
      [bySection, q.section],
      [byLevel, q.level],
    ] as const) {
      tally[key] ??= { right: 0, total: 0 };
      tally[key].total++;
      if (ok) tally[key].right++;
      else if (picked === null) tally[key].skipped = (tally[key].skipped ?? 0) + 1;
    }
    review.push({ id: q.id, ok, answer: q.answer, picked, why_es: q.why_es });
  }
  const est = estimate(byLevel);
  return { level: est.level, near: est.near, score, total: questions.length, bySection, byLevel, review };
}
