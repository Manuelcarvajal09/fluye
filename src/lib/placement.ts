import { LEVELS, type Level, type PlacementQ } from "./types";

export type Tally = Record<string, { right: number; total: number }>;

/**
 * Nivel = el más alto con >= 60 % de aciertos en sus preguntas,
 * siempre que los niveles inferiores tengan al menos 50 % (evita aciertos al azar en C1 con A2 débil).
 */
export function estimateFromTally(byLevel: Tally): Level {
  let best: Level = "A1";
  for (let i = 0; i < LEVELS.length; i++) {
    const l = LEVELS[i];
    const t = byLevel[l];
    if (!t || !t.total) continue;
    const lowerOk = LEVELS.slice(0, i).every((x) => !byLevel[x]?.total || byLevel[x].right / byLevel[x].total >= 0.5);
    if (t.right / t.total >= 0.6 && lowerOk) best = l;
  }
  return best;
}

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
    }
    review.push({ id: q.id, ok, answer: q.answer, picked, why_es: q.why_es });
  }
  return { level: estimateFromTally(byLevel), score, total: questions.length, bySection, byLevel, review };
}
