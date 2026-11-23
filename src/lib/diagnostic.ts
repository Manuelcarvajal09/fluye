import { LEVELS, type Level } from "./types";

export type DiagQ = { level: Level; term: string; example: string; options: string[]; answer: number };

/** Nivel estimado: el más alto con >= 3 de 4 aciertos, sin saltarse niveles fallados. */
export function estimateLevel(qs: DiagQ[], answers: (number | null)[]): Level {
  let best: Level = "A1";
  for (const l of LEVELS) {
    const idx = qs.map((q, i) => (q.level === l ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) continue;
    const ok = idx.filter((i) => answers[i] === qs[i].answer).length;
    if (ok / idx.length >= 0.75) best = l;
    else break;
  }
  return best;
}
