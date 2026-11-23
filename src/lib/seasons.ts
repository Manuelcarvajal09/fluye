// Temporadas: se calculan al abrir (y se actualizan solas al cambiar el día). Sin cron ni redeploy.
// Tema (qué temporada), paleta, decoración y contenido recomendado son interruptores separados.
// Nunca afectan progreso, ids ni FSRS.

export type SeasonId = "navidad" | "invierno" | "primavera" | "verano" | "otono" | "neutral";
export type Region = "CA" | "US" | "MX";
export type MonthDay = `${number}-${number}`; // "MM-DD"

export type SeasonPrefs = {
  mode?: "auto" | "manual" | "off";
  manual?: SeasonId;
  region?: Region;
  /** Celebraciones (Navidad): solo si la persona lo activa; no se asume que todos las celebran. */
  holidays?: boolean;
  palette?: boolean;
  decor?: boolean;
  content?: boolean;
  ranges?: Partial<Record<SeasonId, { start: MonthDay; end: MonthDay }>>;
  /** Fecha simulada (YYYY-MM-DD) para probar temporadas. */
  simDate?: string;
};

export const SEASONS: { id: SeasonId; label: string; route: string | null }[] = [
  { id: "navidad", label: "Navidad", route: "navidad" },
  { id: "invierno", label: "Invierno", route: "invierno" },
  { id: "primavera", label: "Primavera", route: "amistades" },
  { id: "verano", label: "Verano", route: "aeropuerto" },
  { id: "otono", label: "Otoño", route: "vivienda" },
  { id: "neutral", label: "Sin temporada", route: null },
];

/** Estaciones meteorológicas del hemisferio norte (las tres regiones lo son). */
const BASE: Record<Exclude<SeasonId, "neutral" | "navidad">, { start: MonthDay; end: MonthDay }> = {
  invierno: { start: "12-01", end: "02-29" },
  primavera: { start: "03-01", end: "05-31" },
  verano: { start: "06-01", end: "08-31" },
  otono: { start: "09-01", end: "11-30" },
};
/** Fechas de la temporada navideña por región (en México se extiende a Reyes). */
const HOLIDAY: Record<Region, { start: MonthDay; end: MonthDay }> = {
  CA: { start: "12-01", end: "01-01" },
  US: { start: "12-01", end: "01-01" },
  MX: { start: "12-01", end: "01-06" },
};

const md = (day: string) => day.slice(5) as MonthDay;
/** ¿Está MM-DD dentro de [start, end]? Soporta rangos que cruzan el año (12-01 → 02-29). */
export function inRange(x: MonthDay, start: MonthDay, end: MonthDay) {
  return start <= end ? x >= start && x <= end : x >= start || x <= end;
}

/** Temporada activa para un día local YYYY-MM-DD. La elección manual gana; "off" = neutral. */
export function seasonFor(day: string, p: SeasonPrefs = {}): SeasonId {
  const mode = p.mode ?? "auto";
  if (mode === "off") return "neutral";
  if (mode === "manual") return p.manual ?? "neutral";
  const x = md(p.simDate && /^\d{4}-\d{2}-\d{2}$/.test(p.simDate) ? p.simDate : day);
  if (p.holidays) {
    const h = p.ranges?.navidad ?? HOLIDAY[p.region ?? "CA"];
    if (inRange(x, h.start, h.end)) return "navidad";
  }
  for (const id of ["invierno", "primavera", "verano", "otono"] as const) {
    const r = p.ranges?.[id] ?? BASE[id];
    if (inRange(x, r.start, r.end)) return id;
  }
  return "neutral";
}

export const seasonLabel = (id: SeasonId) => SEASONS.find((s) => s.id === id)?.label ?? "Sin temporada";
export const seasonRoute = (id: SeasonId) => SEASONS.find((s) => s.id === id)?.route ?? null;
