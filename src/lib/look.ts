// Personalización visual por persona: color de acento, mascota (especie, nombre) y un conjunto guardado por mascota.
import { PETS, PET_IDS, combine, sanitizeWear, type PetId } from "./wardrobe";

export const ACCENTS = [
  { id: "esmeralda", label: "Esmeralda", swatch: "#087a56" },
  { id: "oceano", label: "Océano", swatch: "#0b6bb5" },
  { id: "uva", label: "Uva", swatch: "#6a3cc7" },
  { id: "mandarina", label: "Mandarina", swatch: "#b8460a" },
  { id: "fresa", label: "Fresa", swatch: "#c0285c" },
  { id: "grafito", label: "Grafito", swatch: "#3f4a5a" },
] as const;
export type AccentId = (typeof ACCENTS)[number]["id"];
export const ACCENT_IDS = ACCENTS.map((a) => a.id) as AccentId[];

const BLURB: Record<string, string> = {
  zorro: "Listo y travieso",
  gato: "Curioso y elegante",
  perro: "Leal y entusiasta",
  castor: "Constructor incansable",
  oso: "Tranquilo y constante",
  panda: "Tierno y paciente",
  buho: "Le encanta estudiar",
  conejo: "Rápido y alegre",
  nutria: "Juguetona y lista",
  ciervo: "Sereno y atento",
  "panda-rojo": "Dormilón con estilo",
  ajolote: "Siempre se regenera",
  tlacuache: "Mexicano y resistente",
  mapache: "Ingenioso y nocturno",
  dragon: "Legendario y cariñoso",
  unicornio: "Legendario y soñador",
};
/** Todas las especies (las de pago se desbloquean en la tienda o en cofres). */
export const SPECIES = PETS.map((p) => ({ ...p, blurb: BLURB[p.id] ?? "" }));
/** Las que cualquiera puede elegir desde el inicio. */
export const FREE_SPECIES = SPECIES.filter((s) => s.free);
export type Species = PetId;
export const SPECIES_IDS = PET_IDS;

/** `sets` guarda un conjunto por mascota: al cambiar de mascota, cada una conserva el suyo. */
export type Look = { accent: AccentId; species: Species; name: string; sets: Partial<Record<Species, string[]>> };
export const wearOf = (l: Look) => l.sets[l.species] ?? [];

export const DEFAULT_LOOK: Look = { accent: "esmeralda", species: "zorro", name: "Rufo", sets: {} };

type Legacy = Partial<Look> & { accessory?: string; face?: string; neck?: string; outfit?: string };

export function lookOf(raw: Legacy | undefined): Look {
  const sp = SPECIES.find((s) => s.id === raw?.species) ?? SPECIES[0];
  const sets: Look["sets"] = {};
  if (raw?.sets && typeof raw.sets === "object") for (const id of SPECIES_IDS) if (raw.sets[id]) sets[id] = sanitizeWear(raw.sets[id]);
  // Aspecto anterior (un accesorio por zona y un atuendo): pasa a ser el conjunto de la mascota actual.
  if (!sets[sp.id] && raw && ("accessory" in raw || "outfit" in raw)) {
    sets[sp.id] = [raw.outfit, raw.neck, raw.face, raw.accessory].reduce<string[]>((acc, k) => (k && k !== "none" ? combine(acc, k) : acc), []);
  }
  return {
    accent: ACCENT_IDS.includes(raw?.accent as AccentId) ? (raw!.accent as AccentId) : DEFAULT_LOOK.accent,
    species: sp.id,
    name: (raw?.name ?? "").trim().slice(0, 16) || sp.defaultName,
    sets,
  };
}
