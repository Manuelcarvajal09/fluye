// Ligas de Fluye: reglas puras (sin base de datos), para poder probarlas.
// Cada semana (lunes a domingo, hora de Edmonton) compiten todas las cuentas del mismo nivel de liga.

export const LEAGUES = ["Semilla", "Brote", "Hoja", "Arce", "Pino", "Glaciar", "Aurora", "Cumbre"] as const;
export const TOP = LEAGUES.length - 1;
export const LEAGUE_TZ = "America/Edmonton";

/** Grupos pequeños (menos de 5 activos): sube quien pase este XP semanal y baja quien no llegue al mínimo. */
export const PROMOTE_XP = [150, 250, 350, 450, 550, 700, 850, Infinity] as const;
export const STAY_XP = [0, 50, 80, 120, 160, 200, 250, 300] as const;
/** Premio en gemas al subir A ese nivel (índice = nivel nuevo). */
export const PROMOTE_GEMS = [0, 30, 45, 60, 75, 90, 105, 120] as const;
export const BIG_GROUP = 5;

export type Result = "up" | "stay" | "down";
export type Standing = { userId: string; xp: number };

/** Lunes (YYYY-MM-DD) de la semana de una fecha, en la hora de Edmonton. */
export function leagueWeek(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: LEAGUE_TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const day = new Date(`${get("year")}-${get("month")}-${get("day")}T12:00:00Z`);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  day.setUTCDate(day.getUTCDate() - ((wd + 6) % 7));
  return day.toISOString().slice(0, 10);
}
export const addWeeks = (week: string, n: number) => {
  const d = new Date(`${week}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7 * n);
  return d.toISOString().slice(0, 10);
};
/** Último día (domingo) de la semana. */
export const weekEnd = (week: string) => {
  const d = new Date(`${week}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
};

/**
 * Resultado de cada cuenta de un nivel al cerrar la semana.
 * - 5 o más con XP: sube el 30 % de arriba (con XP) y baja el 20 % de abajo.
 * - Grupo menor: por umbrales del nivel (PROMOTE_XP / STAY_XP).
 * - Con 0 XP siempre se baja (salvo en Semilla). En Cumbre no se sube; en Semilla no se baja.
 */
export function decide(tier: number, group: Standing[]): Map<string, { result: Result; rank: number }> {
  const sorted = [...group].sort((a, b) => b.xp - a.xp || a.userId.localeCompare(b.userId));
  const active = sorted.filter((s) => s.xp > 0).length;
  const n = sorted.length;
  const out = new Map<string, { result: Result; rank: number }>();
  const ups = active >= BIG_GROUP ? Math.ceil(active * 0.3) : 0;
  const downs = active >= BIG_GROUP ? Math.floor(n * 0.2) : 0;
  sorted.forEach((s, i) => {
    let result: Result = "stay";
    if (s.xp <= 0) result = "down";
    else if (active >= BIG_GROUP) result = i < ups ? "up" : i >= n - downs ? "down" : "stay";
    else result = s.xp >= PROMOTE_XP[tier] ? "up" : s.xp < STAY_XP[tier] ? "down" : "stay";
    if (result === "up" && tier >= TOP) result = "stay";
    if (result === "down" && tier <= 0) result = "stay";
    out.set(s.userId, { result, rank: i + 1 });
  });
  return out;
}

export const nextTier = (tier: number, r: Result) => Math.max(0, Math.min(TOP, tier + (r === "up" ? 1 : r === "down" ? -1 : 0)));

/** Zona en la que va alguien durante la semana (para mostrar «subes», «te mantienes», «bajas»). */
export function liveZone(tier: number, group: Standing[], userId: string): Result {
  return decide(tier, group).get(userId)?.result ?? "stay";
}
