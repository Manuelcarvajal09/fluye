/**
 * «Tu viaje»: el mapa por islas (una por nivel, de A1 a C2), dividido en secciones.
 * Lógica pura (sin base de datos) para poder probarla: recibe el contenido y lo que ya hiciste.
 *
 * Reglas:
 * - Ningún nivel se oculta: todo se puede abrir, aunque esté por debajo o por encima de tu nivel.
 * - Cada sección tiene hasta SECTION_SIZE paradas de contenido (lecciones, misiones, entrevistas,
 *   conversaciones y lecturas, intercaladas), luego una parada de repaso y un cofre de regalo.
 * - El cofre se puede abrir una vez cuando terminas todas las paradas de contenido de la sección.
 * - Al final de cada isla hay un trofeo con gemas, una sola vez, al completar toda la isla.
 */
export const MAP_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type MapLevel = (typeof MAP_LEVELS)[number];
export const SECTION_SIZE = 6;

export type StopKind = "lesson" | "mission" | "interview" | "roleplay" | "reading" | "review" | "chest";
export type ContentStop = { id: string; kind: Exclude<StopKind, "review" | "chest">; title: string; sub?: string; href: string; done: boolean };
export type Section = {
  id: string;
  n: number;
  stops: ContentStop[];
  done: number;
  total: number;
  chest: { key: string; chestId: ChestKind; claimed: boolean; ready: boolean };
};
export type Island = {
  level: MapLevel;
  name: string;
  sections: Section[];
  done: number;
  total: number;
  trophy: { key: string; gems: number; claimed: boolean; ready: boolean };
  words: { known: number; total: number };
};
export type ChestKind = "semilla" | "brote" | "aurora";

export type MapInput = {
  lessons: { id: string; level: string; order: number; title: string; title_es: string }[];
  tracks: { id: string; level: string; band: string; lessonId: string; routeId: string; routeTitle: string; minutes: number; interview: boolean }[];
  roleplays: { id: string; level: string; title_es: string }[];
  readings: { id: string; level: string; title: string; title_es: string; minutes: number }[];
  /** lesson_progress: lecciones, lecciones de misión (ls-*) y conversaciones (rp-*). */
  done: Set<string>;
  readDone: Set<string>;
  /** Claves de regalos ya cobrados (map-chest:<sección>, map-island:<nivel>). */
  claimed: Set<string>;
  /** Expresiones por nivel: cuántas hay y cuántas ya tienes en tus tarjetas. */
  words: Partial<Record<MapLevel, { known: number; total: number }>>;
};

export const ISLAND_NAMES: Record<MapLevel, string> = {
  A1: "Isla Primeros pasos",
  A2: "Isla Día a día",
  B1: "Isla Conversación",
  B2: "Isla Mundo real",
  C1: "Isla Fluidez",
  C2: "Isla Cumbre",
};
export const chestFor = (level: MapLevel): ChestKind => (level === "A1" || level === "A2" ? "semilla" : level === "B1" || level === "B2" ? "brote" : "aurora");
export const trophyGems = (level: MapLevel) => 40 + 20 * MAP_LEVELS.indexOf(level);
export const sectionKey = (sectionId: string) => `map-chest:${sectionId}`;
export const islandKey = (level: MapLevel) => `map-island:${level}`;

const missionMin = (m: number) => Math.min(20, Math.max(10, Math.round(m / 5) * 5));

/** Intercala varias colas (una de cada tipo por vuelta) para que una sección no sea solo de un tipo. */
function interleave<T>(queues: T[][]): T[] {
  const out: T[] = [];
  const qs = queues.map((q) => [...q]);
  while (qs.some((q) => q.length)) for (const q of qs) if (q.length) out.push(q.shift()!);
  return out;
}

export function buildIslands(input: MapInput): Island[] {
  return MAP_LEVELS.map((level) => {
    const lessons: ContentStop[] = input.lessons
      .filter((l) => l.level === level)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ id: l.id, kind: "lesson", title: l.title_es, sub: l.title, href: `/sesion?leccion=${l.id}`, done: input.done.has(l.id) }));
    const tracks = input.tracks.filter((t) => t.level === level);
    const missions: ContentStop[] = tracks
      .filter((t) => !t.interview)
      .map((t) => ({ id: t.id, kind: "mission", title: t.routeTitle, sub: `Misión ${t.band}`, href: `/sesion?mision=${t.id}&min=${missionMin(t.minutes)}`, done: input.done.has(t.lessonId) }));
    const interviews: ContentStop[] = tracks
      .filter((t) => t.interview)
      .map((t) => ({ id: t.id, kind: "interview", title: t.routeTitle, sub: `Entrevista ${t.band}`, href: `/sesion?mision=${t.id}&min=${missionMin(t.minutes)}`, done: input.done.has(t.lessonId) }));
    const roleplays: ContentStop[] = input.roleplays
      .filter((r) => r.level === level)
      .map((r) => ({ id: r.id, kind: "roleplay", title: r.title_es, sub: "Conversación", href: `/practicar/roleplay/${r.id}`, done: input.done.has(r.id) }));
    const readings: ContentStop[] = input.readings
      .filter((r) => r.level === level)
      .map((r) => ({ id: r.id, kind: "reading", title: r.title_es, sub: `Lectura · ${r.minutes} min`, href: `/lecturas/${r.id}`, done: input.readDone.has(r.id) }));

    const all = interleave([lessons, missions, roleplays, readings, interviews]);
    const sections: Section[] = [];
    for (let i = 0; i < all.length; i += SECTION_SIZE) {
      const stops = all.slice(i, i + SECTION_SIZE);
      const n = sections.length + 1;
      const id = `${level}-${n}`;
      const done = stops.filter((s) => s.done).length;
      const key = sectionKey(id);
      sections.push({ id, n, stops, done, total: stops.length, chest: { key, chestId: chestFor(level), claimed: input.claimed.has(key), ready: done === stops.length } });
    }
    const done = all.filter((s) => s.done).length;
    const tkey = islandKey(level);
    return {
      level,
      name: ISLAND_NAMES[level],
      sections,
      done,
      total: all.length,
      trophy: { key: tkey, gems: trophyGems(level), claimed: input.claimed.has(tkey), ready: all.length > 0 && done === all.length },
      words: input.words[level] ?? { known: 0, total: 0 },
    };
  });
}

/** Primera parada sin hacer en tu isla (o en la siguiente con algo pendiente): «sigue aquí». */
export function nextStop(islands: Island[], level: string) {
  const from = Math.max(0, MAP_LEVELS.indexOf(level as MapLevel));
  for (const isl of [...islands.slice(from), ...islands.slice(0, from)])
    for (const s of isl.sections) {
      const st = s.stops.find((x) => !x.done);
      if (st) return { island: isl.level, section: s.id, stop: st };
    }
  return undefined;
}

export const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);
