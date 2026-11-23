import { DefaultScheduler } from "ts-fsrs";

export type Grade = 1 | 2 | 3 | 4;

/** Tarjeta FSRS tal como la devuelve ts-fsrs (fechas como Date). */
type Card = Record<string, unknown> & { dueAt: Date; lastReviewAt: Date | null };

/** Subconjunto de la API de ts-fsrs v6 que usamos; sus tipos son una unión por modelo. */
interface Sched {
  newCard(o: { now: Date }): Card;
  review(o: { card: Card; grade: Grade; now: Date }): { card: Card };
  preview(o: { card: Card; now: Date }): { grade: number; card: Card }[];
}

const cache = new Map<number, Promise<Sched>>();

/** Planificador FSRS (FSRS-7 por defecto en ts-fsrs v6) con fuzz, por retención deseada. */
export function scheduler(desiredRetention = 0.9): Promise<Sched> {
  const key = Math.round(desiredRetention * 100);
  if (!cache.has(key)) cache.set(key, DefaultScheduler({ desiredRetention: key / 100, enableFuzz: true, maximumInterval: 3650 }) as unknown as Promise<Sched>);
  return cache.get(key)!;
}

export function revive(raw: Record<string, unknown>): Card {
  return { ...raw, dueAt: new Date(raw.dueAt as string), lastReviewAt: raw.lastReviewAt ? new Date(raw.lastReviewAt as string) : null };
}

const toJson = (c: Card) => JSON.parse(JSON.stringify(c)) as Record<string, unknown>;

export async function newCard(now: Date, retention?: number) {
  return toJson((await scheduler(retention)).newCard({ now }));
}

export type SavedCard = Record<string, unknown> & { dueAt: string; state: number; stability: number; reps: number; lapses: number; scheduledDays: number };

/** Aplica una calificación y devuelve la tarjeta lista para guardar en JSON. */
export async function review(raw: Record<string, unknown>, grade: Grade, now: Date, retention?: number) {
  const s = await scheduler(retention);
  return toJson(s.review({ card: revive(raw), grade, now }).card) as SavedCard;
}

/** Intervalo que produciría cada botón (Again/Hard/Good/Easy), como texto corto: "10 min", "3 d"… */
export async function previewLabels(raw: Record<string, unknown>, now: Date, retention?: number): Promise<[string, string, string, string]> {
  const s = await scheduler(retention);
  const out = s.preview({ card: revive(raw), now }).map((p) => fmtInterval(p.card.dueAt.getTime() - now.getTime()));
  return [out[0], out[1], out[2], out[3]];
}

export function fmtInterval(ms: number) {
  const min = ms / 60_000;
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const h = min / 60;
  if (h < 24) return `${Math.round(h)} h`;
  const d = h / 24;
  if (d < 30) return `${Math.round(d)} d`;
  if (d < 365) return `${Math.round(d / 30)} mes`;
  return `${(d / 365).toFixed(1)} a`;
}

/** Un ítem está dominado cuando reconoce, produce y entiende de oído con estabilidad >= 21 días. */
export const MASTERY_DAYS = 21;
