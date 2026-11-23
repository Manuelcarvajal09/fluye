// Reglas puras de calificación de un intento (probadas en tests).
import type { Grade } from "./srs";

export type AttemptMeta = { correct: boolean; grade: Grade; firstTry?: boolean; hints?: number; revealed?: boolean; kind?: "graded" | "self" };

/**
 * Normaliza la calificación FSRS de un intento:
 * - Ver la solución = olvido (Again) y no cuenta como recuerdo.
 * - Un fallo calificado por la app es Again aunque luego acierte en un reintento.
 * - Con pistas, como mucho Hard (recordó con dificultad).
 * - La autoevaluación se respeta (se usa donde la app no puede calificar con fiabilidad).
 */
export function finalGrade(m: AttemptMeta): Grade {
  if (m.revealed) return 1;
  if (m.kind !== "self" && !m.correct) return 1;
  if (m.kind !== "self" && m.firstTry === false) return 1;
  if ((m.hints ?? 0) > 0) return Math.min(m.grade, 2) as Grade;
  return m.grade;
}

/** XP de un intento: el recuerdo real en primer intento vale más; ver la respuesta da lo mínimo. */
export function attemptXp(m: AttemptMeta, isNewItem: boolean) {
  const clean = m.correct && m.firstTry !== false && !(m.hints ?? 0);
  const base = m.revealed ? 1 : clean ? 10 : m.correct ? 5 : 2;
  return base + (isNewItem ? 5 : 0);
}

export const ERROR_CATEGORIES = ["tense", "article", "preposition", "word_order", "false_friend", "comprehension", "sound", "vocab", "spelling"] as const;
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];
export const ERROR_LABEL: Record<ErrorCategory, string> = {
  tense: "Tiempos verbales",
  article: "Artículos",
  preposition: "Preposiciones",
  word_order: "Orden de palabras",
  false_friend: "Falsos amigos",
  comprehension: "Comprensión",
  sound: "Contrastes de sonido",
  vocab: "Vocabulario",
  spelling: "Ortografía",
};

/** Id único de intento generado en el cliente (reintentos de red reutilizan el mismo). */
export function newAttemptId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const ARTICLES = new Set(["a", "an", "the"]);
const PREPS = new Set(["in", "on", "at", "to", "for", "of", "with", "from", "by", "about", "into", "onto", "up", "out", "off", "over", "down", "through", "around", "back", "away"]);
const toks = (s: string) => s.toLowerCase().replace(/[^a-z'\s-]/g, " ").split(/\s+/).filter(Boolean);

/**
 * Clasifica un error escrito comparando lo esperado con lo escrito (heurística, orientativa):
 * artículo, preposición/partícula, orden de palabras, ortografía o vocabulario.
 */
export function classifyError(expected: string, given: string): ErrorCategory {
  const e = toks(expected);
  const g = toks(given);
  if (!g.length) return "vocab";
  const se = [...e].sort().join(" ");
  const sg = [...g].sort().join(" ");
  if (se === sg) return "word_order";
  const strip = (a: string[], set: Set<string>) => a.filter((w) => !set.has(w)).join(" ");
  if (strip(e, ARTICLES) === strip(g, ARTICLES)) return "article";
  if (strip(e, PREPS) === strip(g, PREPS)) return "preposition";
  const dist = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[m][n];
  };
  if (e.length === g.length && dist(e.join(" "), g.join(" ")) <= Math.max(2, Math.round(e.join(" ").length * 0.2))) return "spelling";
  return "vocab";
}
