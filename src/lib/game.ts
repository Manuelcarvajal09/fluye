// Reglas de gamificación (puras, probadas en tests).

/** XP acumulada necesaria para llegar al nivel n (n >= 1). */
export const xpForLevel = (n: number) => 50 * n * (n - 1);

export function levelFromXp(xp: number) {
  let n = 1;
  while (xpForLevel(n + 1) <= xp) n++;
  const base = xpForLevel(n);
  const next = xpForLevel(n + 1);
  return { level: n, into: xp - base, span: next - base };
}

const TITLES = ["Principiante", "Curioso", "Aprendiz", "Explorador", "Conversador", "Viajero", "Con soltura", "Casi local", "Maestro", "Leyenda"];
export const levelTitle = (n: number) => TITLES[Math.min(Math.max(n, 1), TITLES.length) - 1];

/** Meta diaria de XP según minutos elegidos. */
export const goalXp = (minutes: number) => Math.max(30, minutes * 10);

export const XP = { correct: 10, newItem: 5, wrong: 2, lessonDone: 20, perceptionCorrect: 4, recording: 3, mission: 20 } as const;

export interface DayCounters {
  xp: number;
  reviews: number;
  correct: number;
  newItems: number;
  speaking: number;
}

export interface Mission {
  id: string;
  label: string;
  target: number;
  value: (d: DayCounters) => number;
}

/** Tres misiones diarias, distintas según el día (determinista para que no cambien al recargar). */
export function missionsFor(day: string, goalMinutes: number): Mission[] {
  const all: Mission[] = [
    { id: "goal", label: `Alcanza tu meta de ${goalXp(goalMinutes)} XP`, target: goalXp(goalMinutes), value: (d) => d.xp },
    { id: "reviews", label: "Haz 20 ejercicios", target: 20, value: (d) => d.reviews },
    { id: "new", label: "Aprende 3 expresiones nuevas", target: 3, value: (d) => d.newItems },
    { id: "speak", label: "Practica pronunciación 5 veces", target: 5, value: (d) => d.speaking },
    { id: "accuracy", label: "Acierta 15 ejercicios", target: 15, value: (d) => d.correct },
  ];
  const seed = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rest = all.slice(1);
  const pick = [rest[seed % 4], rest[(seed + 1 + (seed % 3)) % 4]].filter((m, i, arr) => arr.indexOf(m) === i);
  while (pick.length < 2) pick.push(rest.find((m) => !pick.includes(m))!);
  return [all[0], ...pick];
}

/**
 * Nueva racha tras alcanzar la meta hoy.
 * Si la última meta fue ayer, suma; si fue hoy, no cambia; si fue antes, reinicia en 1.
 */
export function nextStreak(streak: number, lastGoalDay: string | null, today: string) {
  if (lastGoalDay === today) return streak;
  if (lastGoalDay && dayDiff(lastGoalDay, today) === 1) return streak + 1;
  return 1;
}

/** Racha visible: si no cumpliste ayer ni hoy, ya se perdió. */
export function visibleStreak(streak: number, lastGoalDay: string | null, today: string) {
  if (!lastGoalDay) return 0;
  return dayDiff(lastGoalDay, today) <= 1 ? streak : 0;
}

export function dayDiff(a: string, b: string) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000);
}

/** Fecha local YYYY-MM-DD en la zona horaria dada. */
export function localDay(tz: string, d = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function addDays(day: string, n: number) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
