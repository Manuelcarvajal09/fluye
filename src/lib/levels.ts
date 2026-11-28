// Franja de nivel para el estudio (sin dependencias del servidor, para poder probarla).
// A1–A2 avanzan paso a paso (un A2 también repasa lo básico de A1). Desde B1 nunca entra nada de A1/A2,
// salvo el habla real (contracciones y slang: gonna, wanna, y'all…), que no es "básico" aunque esté catalogado bajo.
import { LEVELS } from "./types";

const idx = (l: string) => Math.max(0, LEVELS.indexOf(l as (typeof LEVELS)[number]));

export type LevelItem = { level: string; type: string; tags?: string[] };

/** Índice mínimo y máximo de nivel de expresiones nuevas para un nivel de usuario. */
export function newItemWindow(userLevel: number) {
  return userLevel >= 2 ? { lo: Math.max(2, userLevel - 1), hi: userLevel + 1 } : { lo: 0, hi: userLevel };
}

export const isRealTalk = (i: LevelItem) => i.type === "contraction" || !!i.tags?.includes("slang");

/** ¿Puede entrar como expresión nueva para alguien de este nivel? */
export function allowsNewItem(userLevel: number, i: LevelItem) {
  const { lo, hi } = newItemWindow(userLevel);
  const l = idx(i.level);
  return l <= hi && (l >= lo || isRealTalk(i));
}

/** Nivel mínimo de las lecciones del día: desde B1 no se proponen lecciones A1/A2. */
export const lessonMin = (userLevel: number) => (userLevel >= 2 ? 2 : 0);
