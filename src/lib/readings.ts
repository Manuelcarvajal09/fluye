import data from "@/generated/readings.json";
import { addWeeks } from "./league-rules";

export type Gloss = { term: string; es: string; def?: string; note?: string };
export type ReadingQ = { q: string; options: string[]; answer: number; why_es?: string };
export type Reading = {
  id: string;
  level: string;
  title: string;
  title_es: string;
  topic: string;
  minutes: number;
  intro_es: string;
  paragraphs: string[];
  glossary: Gloss[];
  main_idea: ReadingQ;
  questions: ReadingQ[];
  club?: boolean;
  words: number;
};

export const READINGS = data as unknown as Reading[];
export const getReading = (id: string) => READINGS.find((r) => r.id === id);

/** Lectura del club de esta semana: rota entre las marcadas como club (la misma para todas las cuentas). */
export function clubReading(week: string) {
  const club = READINGS.filter((r) => r.club);
  if (!club.length) return undefined;
  let n = 0;
  for (let w = "2026-01-05"; w < week; w = addWeeks(w, 1)) n++;
  return club[n % club.length];
}

/** XP por terminar una lectura (solo la primera vez): base + por respuesta correcta. */
export const readingXp = (score: number) => 15 + 5 * score;
