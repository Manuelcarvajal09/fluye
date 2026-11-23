// Sesión en curso guardada en el navegador (para reanudar). Sin datos en el servidor.
import type { Step } from "./types";

export type SessionMeta = { id: string; kind: "daily" | "mission" | "return"; minutes: number; title?: string; reason?: string; trackId?: string; roleplayId?: string };
export const SAVE_KEY = "fluye-session";
export type Saved = { meta: SessionMeta; queue: Step[]; i: number; xp: number; lessonId?: string; savedAt: number };

/** Sesión sin terminar de las últimas 12 h, o null. */
export function readSavedSession(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as Saved | null;
    return s && Date.now() - s.savedAt < 12 * 3_600_000 && s.i < s.queue.length ? s : null;
  } catch {
    return null;
  }
}
