// Regalo de registro (promoción de lanzamiento). Reglas puras: sin base de datos, para poder probarlas.
import { CHRISTMAS, PETS, PIECES } from "./wardrobe";

/** Quien cree su cuenta hasta el 31 de diciembre de 2026 (hora de México) recibe el regalo de bienvenida. */
export const SIGNUP_PROMO = { until: "2026-12-31T23:59:59-06:00", theme: "theme-navidad" } as const;
export const promoActive = (now = new Date()) => now.getTime() <= new Date(SIGNUP_PROMO.until).getTime();

export type SignupGift = { pet: string; piece: string; xmas: string; theme: string };

/**
 * Una mascota de pago no legendaria al azar, una pieza de tienda al azar y una pieza navideña
 * distinta (la pieza al azar nunca es navideña, así que no se repiten), más la temática Navidad.
 */
export function pickSignupGift(rnd: () => number = Math.random): SignupGift {
  const pick = <T,>(a: readonly T[]) => a[Math.min(a.length - 1, Math.floor(rnd() * a.length))];
  const xmasIds = CHRISTMAS as readonly string[];
  const pets = PETS.filter((p) => !p.free && p.tier < 3); // de pago y no legendaria (conejo, nutria, ciervo, panda rojo…)
  const pieces = PIECES.filter((p) => p.source === "shop" && !xmasIds.includes(p.id));
  const xmas = PIECES.filter((p) => xmasIds.includes(p.id));
  return { pet: pick(pets).id, piece: pick(pieces).id, xmas: pick(xmas).id, theme: SIGNUP_PROMO.theme };
}
