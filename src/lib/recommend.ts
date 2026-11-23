import "server-only";
import { ROUTES } from "./content";
import { AREA_LABEL } from "./areas";
import { seasonLabel, seasonRoute, type SeasonId } from "./seasons";
import type { Band, Level, Route, RouteTrack } from "./types";

export function bandFor(level: Level | string): Band {
  return level === "A1" || level === "A2" ? "A1-A2" : level === "C1" ? "C1" : "B1-B2";
}

/** Pista adecuada de una ruta para el nivel (C1 cae a B1–B2 si la ruta no tiene C1). */
export function trackFor(route: Route, level: Level | string): RouteTrack {
  const band = bandFor(level);
  return route.tracks.find((t) => t.band === band) ?? route.tracks.find((t) => t.band === "B1-B2") ?? route.tracks[0];
}

export type Recommendation = { route: Route; track: RouteTrack; reason: string };

/**
 * Misión recomendada con una razón corta y verdadera:
 * prioriza tus áreas, luego la temporada (si activaste contenido de temporada) y lo que aún no hiciste.
 */
export function recommendMission(opts: { level: string; topics: string[]; done: Set<string>; season: SeasonId; seasonContent: boolean; due: number }): Recommendation | null {
  if (!ROUTES.length) return null;
  const areas = new Set(opts.topics);
  const seasonal = opts.seasonContent ? seasonRoute(opts.season) : null;
  const scored = ROUTES.map((route) => {
    const track = trackFor(route, opts.level);
    const myAreas = route.areas.filter((a) => areas.has(a));
    const pending = !opts.done.has(track.lesson.id);
    const score = (pending ? 3 : 0) + myAreas.length * 2 + (route.id === seasonal ? 2.5 : 0);
    return { route, track, myAreas, pending, score };
  }).sort((a, b) => b.score - a.score || a.route.id.localeCompare(b.route.id));
  const best = scored[0];
  const parts: string[] = [];
  if (best.route.id === seasonal) parts.push(`es temporada de ${seasonLabel(opts.season).toLowerCase()}`);
  if (best.myAreas.length) parts.push(`te interesa ${AREA_LABEL[best.myAreas[0]] ?? best.myAreas[0]}`);
  if (!best.pending) parts.push("repasarla afianza lo que ya viste");
  else if (!parts.length) parts.push("aún no la haces");
  if (opts.due > 0) parts.push(`incluye ${Math.min(opts.due, 20)} de tus repasos pendientes`);
  const reason = parts.join(" y ");
  return { route: best.route, track: best.track, reason: reason.charAt(0).toUpperCase() + reason.slice(1) + "." };
}
