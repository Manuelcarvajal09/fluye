// Retos y rangos (puro, sin datos de usuario). Las reglas están en docs/GAMIFICACION.md.
import { addDays } from "./game";

/** Gemas por evento. Nunca por respuesta suelta: así no se puede "granjear" repitiendo ejercicios triviales. */
export const GEMS = { dailyGoal: 8, dailyMission: 4, weekly: 20, achievement: 12, route: 10 } as const;

/** Lunes de la semana (ISO) de un día YYYY-MM-DD. */
export function weekStart(day: string) {
  const wd = new Date(day + "T12:00:00Z").getUTCDay(); // 0 domingo
  return addDays(day, -((wd + 6) % 7));
}
export const weekKey = (monday: string) => monday;

export type WeekAgg = { goalDays: number; speaking: number; newItems: number; activeDays: number; correct: number };
export type Weekly = { id: string; label: string; target: number; value: (a: WeekAgg) => number };

const WEEKLY: Weekly[] = [
  { id: "goal4", label: "Cumple tu meta 4 días", target: 4, value: (a) => a.goalDays },
  { id: "speak15", label: "Practica en voz alta 15 veces", target: 15, value: (a) => a.speaking },
  { id: "new20", label: "Aprende 20 expresiones nuevas", target: 20, value: (a) => a.newItems },
  { id: "active5", label: "Estudia 5 días distintos", target: 5, value: (a) => a.activeDays },
  { id: "correct120", label: "Recuerda 120 respuestas", target: 120, value: (a) => a.correct },
];

/** 3 retos por semana, deterministas (no cambian al recargar). Variedad: rotan cada semana. */
export function weeklyChallenges(monday: string): Weekly[] {
  const seed = [...monday].reduce((a, c) => a + c.charCodeAt(0), 0);
  const out: Weekly[] = [];
  for (let k = 0; out.length < 3; k++) {
    const w = WEEKLY[(seed + k * 2) % WEEKLY.length];
    if (!out.includes(w)) out.push(w);
  }
  return out;
}

/** Rango de juego (por XP acumulada). Es independiente del nivel de inglés (CEFR). */
export const RANKS = [
  { id: "brote", label: "Brote", min: 0, color: "#5fae6e" },
  { id: "bronce", label: "Bronce", min: 600, color: "#b07a4a" },
  { id: "plata", label: "Plata", min: 2000, color: "#8e9aab" },
  { id: "oro", label: "Oro", min: 5000, color: "#d4a72c" },
  { id: "platino", label: "Platino", min: 11000, color: "#4fb3c4" },
  { id: "diamante", label: "Diamante", min: 22000, color: "#7c6cf0" },
] as const;

export function rankOf(xp: number) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].min) i++;
  const cur = RANKS[i];
  const next = RANKS[i + 1];
  return { ...cur, next: next ?? null, into: xp - cur.min, span: next ? next.min - cur.min : 1 };
}
