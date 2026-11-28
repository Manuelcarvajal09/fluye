// Temáticas legendarias (cambian toda la interfaz) y fondos del personaje. Sin base de datos: lo usan cliente y servidor.
import data from "@/generated/themes.json";
import { PRICE } from "./wardrobe";

export type ThemePreview = { bg: string; surface: string; text: string; muted: string; brand: string; accent: string; soft: string; heroFrom: string; heroTo: string; line: string };
export type Theme = { id: string; name: string; desc: string; rarity: number; swatch: string[]; preview?: { l: ThemePreview; d: ThemePreview } };
export const THEMES = data as Theme[];
export const THEME_IDS = THEMES.map((t) => t.id);
export const THEME_PRICE = 900;
export const themeKey = (id: string) => `theme-${id}`;
export const themeOf = (id: string) => THEMES.find((t) => t.id === id);

/** Fondos detrás de la mascota: ilustraciones propias (Fase 3, Codex), en 4:3 y cuadradas, en public/fondos/. */
export const BACKGROUNDS = [
  { id: "habitacion", name: "Habitación acogedora", tier: 0 },
  { id: "jardin", name: "Jardín soleado", tier: 0 },
  { id: "parque", name: "Parque en otoño", tier: 0 },
  { id: "cafe", name: "Rincón de café", tier: 0 },
  { id: "biblioteca", name: "Biblioteca", tier: 1 },
  { id: "playa", name: "Playa al atardecer", tier: 1 },
  { id: "cocina", name: "Cocina casera", tier: 1 },
  { id: "estudio", name: "Estudio de música", tier: 1 },
  { id: "bosque", name: "Bosque canadiense", tier: 2 },
  { id: "lago", name: "Lago en las Rocosas", tier: 2 },
  { id: "ciudad", name: "Edmonton de noche", tier: 2 },
  { id: "nieve", name: "Día de nieve", tier: 2 },
  { id: "aurora", name: "Aurora boreal", tier: 3 },
  { id: "navidad", name: "Navidad junto al árbol", tier: 3 },
  { id: "estrellas", name: "Noche estrellada", tier: 3 },
  { id: "feria", name: "Feria mexicana", tier: 3 },
] as const;
export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];
/**
 * Los primeros fondos eran escenas de las lecciones. Quien compró uno conserva el nuevo de la misma rareza
 * (y quien lo tenía puesto lo sigue viendo): no se toca la base de datos.
 */
const LEGACY_BG: Record<string, BackgroundId> = {
  super: "habitacion", transporte: "parque", vivienda: "jardin",
  amistades: "playa", medico: "biblioteca", reuniones: "estudio", sistemas: "cocina",
  aeropuerto: "lago", biologia: "bosque", series: "ciudad", gimnasio: "nieve",
  invierno: "aurora", entrevista: "estrellas", vuelo: "feria",
};
export const bgId = (id: string) => LEGACY_BG[id] ?? id;
export const bgKey = (id: string) => `bg-${id}`;
export const bgOf = (id: string) => BACKGROUNDS.find((b) => b.id === bgId(id));
export const bgPrice = (id: string) => {
  const b = bgOf(id);
  return b ? PRICE[b.tier as 0 | 1 | 2 | 3] : 0;
};
/** `wide` (4:3) para tarjetas; `square` para el escenario del armario y el perfil. */
export const bgImage = (id?: string | null, shape: "wide" | "square" = "wide") => {
  const b = id ? bgOf(id) : undefined;
  return b ? `/fondos/${b.id}${shape === "square" ? "-cuadrado" : ""}.webp` : undefined;
};
/** ¿Es tuyo? Comprado con su id actual o con el id del fondo anterior que lo sustituye. */
const ownsBg = (id: string, owned: Set<string>) => {
  const b = bgOf(id);
  return !!b && (owned.has(bgKey(b.id)) || Object.entries(LEGACY_BG).some(([old, now]) => now === b.id && owned.has(bgKey(old))));
};

/** ¿Puede usar esta temática? Comprada, o con el permiso «todas las temáticas» (propietarios incluidos). */
export const canUseTheme = (id: string, owned: Set<string>, allThemes: boolean) => !!themeOf(id) && (allThemes || owned.has(themeKey(id)));
export const canUseBg = (id: string, owned: Set<string>) => ownsBg(id, owned);
export const ownsBackground = ownsBg;
