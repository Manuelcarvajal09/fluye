import "server-only";
import itemsJson from "@/generated/items.json";
import lessonsJson from "@/generated/lessons.json";
import soundsJson from "@/generated/sounds.json";
import prosodyJson from "@/generated/prosody.json";
import roleplaysJson from "@/generated/roleplays.json";
import errorsJson from "@/generated/errors.json";
import placementJson from "@/generated/placement.json";
import tensesJson from "@/generated/tenses.json";
import routesJson from "@/generated/routes.json";
import musicJson from "@/generated/music.json";
import scenesJson from "@/generated/scenes.json";
import catalogJson from "@/generated/catalog.json";
import type { Route, RouteTrack, MusicExercise, ItemFull, Item, Lesson, Sound, ProsodyLesson, Level, Roleplay, CommonError, PlacementQ, Tense } from "./types";
import { LEVELS } from "./types";

export const ITEMS = itemsJson as unknown as (ItemFull & { tvRank?: number })[];
export const LESSONS = lessonsJson as unknown as Lesson[];
export const SOUNDS = soundsJson as unknown as Sound[];
export const PROSODY = prosodyJson as unknown as ProsodyLesson[];
export const ROLEPLAYS = roleplaysJson as unknown as Roleplay[];
export const ERRORS = errorsJson as unknown as CommonError[];
export const PLACEMENT = placementJson as unknown as PlacementQ[];
export const TENSES = tensesJson as unknown as Tense[];
export const ROUTES = routesJson as unknown as Route[];
export const MUSIC = musicJson as unknown as MusicExercise[];
export type Scene = { id: string; file: string; title_es: string; alt_es: string; long_es: string; caption_en: string; caption_es: string; route: string | null; items: string[]; sense_es?: string; provenance: string; license: string };
export const SCENES = scenesJson as unknown as Scene[];
export const getScene = (id: string | null | undefined) => (id ? SCENES.find((s) => s.id === id) : undefined);
export const scenesForItem = (itemId: string) => SCENES.filter((s) => s.items.includes(itemId));

const trackIndex = new Map<string, { route: Route; track: RouteTrack }>();
for (const r of ROUTES) for (const t of r.tracks) trackIndex.set(t.id, { route: r, track: t });
export const getTrack = (id: string) => trackIndex.get(id);
export const trackOfLesson = (lessonId: string) => ROUTES.flatMap((r) => r.tracks).find((t) => t.lesson.id === lessonId);
export const getRoute = (id: string) => ROUTES.find((r) => r.id === id);
/** Lecciones y roleplays de rutas también se pueden abrir por id (p. ej. desde la biblioteca o el historial). */
export const getLesson = (id: string) => LESSONS.find((l) => l.id === id) ?? ROUTES.flatMap((r) => r.tracks).find((t) => t.lesson.id === id)?.lesson;
export const getRoleplay = (id: string) => ROLEPLAYS.find((r) => r.id === id) ?? ROUTES.flatMap((r) => r.tracks).find((t) => t.roleplay.id === id)?.roleplay;

/** Catálogo de palabras (wordfreq + Wiktionary + Tatoeba). Solo se activa a mano o por tandas. */
export type CatalogEntry = ItemFull & { pos: string; band: string; rank: number; ipaCa?: string; status: "complete" | "pending"; review: string; dupOf?: string; ex: { en: string; es: string; src?: string; by?: string }[] };
export const CATALOG = catalogJson as unknown as CatalogEntry[];
const byId = new Map<string, ItemFull & { tvRank?: number }>(ITEMS.map((i) => [i.id, i]));
const catalogById = new Map(CATALOG.map((c) => [c.id, c]));
/** Ítem curado, o entrada completa del catálogo (las pendientes o duplicadas no se pueden estudiar). */
export const getItem = (id: string) => byId.get(id) ?? (() => {
  const c = catalogById.get(id);
  return c && c.status === "complete" && !c.dupOf ? c : undefined;
})();
export const getCatalogEntry = (id: string) => catalogById.get(id);
export const levelIndex = (l: Level | string) => Math.max(0, LEVELS.indexOf(l as Level));

/** Orden pedagógico para tarjetas nuevas: nivel, luego frecuencia. */
export function newItemOrder(a: Item, b: Item) {
  return levelIndex(a.level) - levelIndex(b.level) || b.freq - a.freq || a.id.localeCompare(b.id);
}
