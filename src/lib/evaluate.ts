// Evaluación por reglas de respuestas libres (roleplays y "Corrige la frase").
// No usa IA: comprueba elementos obligatorios, detecta errores típicos y compara con versiones naturales.
import { levenshtein, normalize, words } from "./answer";
import type { CommonError, Roleplay } from "./types";

/** Forma canónica: minúsculas, sin acentos ni puntuación y con contracciones expandidas. */
export const canonical = (s: string) => words(s).join(" ");

/** ¿La respuesta contiene la frase `alt` (palabra por palabra, tolerando un error de dedo en palabras largas)? */
export function contains(answer: string, alt: string) {
  const a = canonical(answer).split(" ");
  const b = canonical(alt).split(" ");
  if (!b.length || !b[0]) return false;
  for (let i = 0; i + b.length <= a.length; i++) {
    if (b.every((w, k) => a[i + k] === w || (w.length > 5 && levenshtein(a[i + k], w) <= 1))) return true;
  }
  return false;
}

export type Tip = { fix: string; why_es: string; source: "turn" | "bank" };

/** Prueba el patrón sobre el texto en minúsculas (con puntuación) y sobre el normalizado. */
function matches(pattern: string, answer: string) {
  try {
    const re = new RegExp(pattern, "i");
    return re.test(answer.toLowerCase()) || re.test(" " + normalize(answer) + " ");
  } catch {
    return false;
  }
}

export function findTips(answer: string, tips: Roleplay["turns"][number]["tips"] = [], bank: CommonError[] = []): Tip[] {
  const out: Tip[] = [];
  for (const t of tips) if (matches(t.wrong, answer)) out.push({ fix: t.fix, why_es: t.why_es, source: "turn" });
  for (const e of bank) if (e.pattern && matches(e.pattern, answer)) out.push({ fix: e.right[0], why_es: e.why_es, source: "bank" });
  return out.filter((t, i) => out.findIndex((x) => x.why_es === t.why_es) === i).slice(0, 3);
}

export type TurnResult = { status: "great" | "ok" | "partial" | "miss"; missing: string[]; tips: Tip[]; ratio: number };

export function evaluateTurn(answer: string, turn: Roleplay["turns"][number], bank: CommonError[]): TurnResult {
  if (!canonical(answer)) return { status: "miss", missing: turn.expect.map((g) => g[0]), tips: [], ratio: 0 };
  const missing = turn.expect.filter((g) => !g.some((alt) => contains(answer, alt))).map((g) => g[0]);
  const ratio = turn.expect.length ? (turn.expect.length - missing.length) / turn.expect.length : 1;
  const tips = findTips(answer, turn.tips, bank);
  const status = missing.length === 0 ? (tips.length ? "ok" : "great") : ratio >= 0.5 ? "partial" : "miss";
  return { status, missing, tips, ratio };
}

/** "Corrige la frase": correcta si coincide con alguna versión aceptada y el error ya no aparece. */
export function evaluateFix(answer: string, e: CommonError): "right" | "close" | "wrong" {
  const a = canonical(answer);
  if (!a) return "wrong";
  if (e.pattern && matches(e.pattern, answer)) return "wrong";
  let best = Infinity;
  for (const r of e.right) best = Math.min(best, levenshtein(a, canonical(r)));
  if (best === 0) return "right";
  const len = Math.max(...e.right.map((r) => canonical(r).length));
  return best <= Math.max(2, Math.round(len * 0.12)) ? "close" : "wrong";
}
