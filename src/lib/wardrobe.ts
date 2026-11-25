// Armario de Fluye: mascotas, piezas, rarezas, precios y composición por capas.
// Las capas y sus cajas vienen de la entrega de arte (scripts/armario/export.mjs → armario-data.json).
// Este módulo no toca la base de datos: lo usan cliente y servidor.
import data from "./armario-data.json";

export const TIERS = ["Normal", "Raro", "Épico", "Legendario"] as const;
export type Tier = 0 | 1 | 2 | 3;
/** Precio directo en gemas por rareza. Las mascotas cuestan 25 más. */
export const PRICE = [35, 65, 105, 160] as const;

export const PETS = [
  { id: "zorro", label: "Zorro", defaultName: "Rufo", tier: 0, free: true, x: 47.5 },
  { id: "gato", label: "Gato", defaultName: "Misu", tier: 0, free: true, x: 47.7 },
  { id: "perro", label: "Perro", defaultName: "Toby", tier: 0, free: true, x: 50 },
  { id: "castor", label: "Castor", defaultName: "Maple", tier: 0, free: true, x: 47.1 },
  { id: "oso", label: "Oso", defaultName: "Bruno", tier: 0, free: true, x: 50.8 },
  { id: "panda", label: "Panda", defaultName: "Mochi", tier: 0, free: true, x: 52 },
  { id: "buho", label: "Búho", defaultName: "Hoot", tier: 0, free: true, x: 53.1 },
  { id: "conejo", label: "Conejo", defaultName: "Lila", tier: 0, free: false, x: 50.8 },
  { id: "nutria", label: "Nutria", defaultName: "Ondi", tier: 1, free: false, x: 51.8 },
  { id: "ciervo", label: "Ciervo", defaultName: "Brío", tier: 1, free: false, x: 49 },
  { id: "panda-rojo", label: "Panda rojo", defaultName: "Kumo", tier: 2, free: false, x: 50.8 },
  { id: "ajolote", label: "Ajolote", defaultName: "Axo", tier: 3, free: false, x: 48.6 },
] as const satisfies readonly { id: string; label: string; defaultName: string; tier: Tier; free: boolean; x: number }[];
export type PetId = (typeof PETS)[number]["id"];
export const PET_IDS = PETS.map((p) => p.id) as PetId[];
export const petOf = (id: string) => PETS.find((p) => p.id === id);
export const petPrice = (id: string) => {
  const p = petOf(id);
  return p && !p.free ? PRICE[p.tier] + 25 : 0;
};

export const MOODS = ["happy", "cheer", "think", "oops", "wow", "sleep", "encourage", "proud"] as const;
export type Mood = (typeof MOODS)[number];

/** Zonas: una pieza por zona. El orden es el de dibujo (de abajo hacia arriba). */
export type Slot = "body" | "neck" | "chest" | "face" | "head" | "hair";
export const SLOTS: Slot[] = ["body", "neck", "chest", "face", "head", "hair"];
export const SLOT_LABEL: Record<Slot, string> = { body: "Cuerpo", neck: "Cuello", chest: "Pecho", face: "Cara", head: "Cabeza", hair: "Cabello" };
const KIND_SLOT: Record<string, Slot> = { coat: "body", scarf: "neck", bowtie: "neck", badge: "chest", glasses: "face", hat: "head", crown: "head", wizard: "head", arch: "head", flower: "hair" };

/** Cómo se consigue: tienda (gemas o cofre), logro (solo ganándolo) o inicial (todas las cuentas). */
export type Source = "shop" | "award" | "starter";

const BASE: Record<string, [string, string, Tier, Source?]> = {
  toque: ["Gorro de lana", "hat", 0],
  cap: ["Gorra violeta", "hat", 0],
  flower: ["Flor rosa", "flower", 0, "starter"],
  glasses: ["Lentes redondos", "glasses", 0, "starter"],
  scarf: ["Bufanda amarilla", "scarf", 0],
  headphones: ["Audífonos", "arch", 1],
  earmuffs: ["Orejeras", "arch", 1],
  bowtie: ["Moño rojo", "bowtie", 1],
  santa: ["Gorro navideño", "hat", 2],
  wizard: ["Sombrero de mago", "wizard", 2],
  crown: ["Corona", "crown", 3],
  hoodie: ["Sudadera esmeralda", "coat", 0],
  sweater: ["Suéter navideño", "coat", 1],
  labcoat: ["Bata de laboratorio", "coat", 1],
  suit: ["Traje con corbata", "coat", 2],
};
const CLOTHES = ["chaleco", "poncho", "marinera", "delantal", "capa", "chaqueta", "vestido", "manto"];

/** Logros que regalan una pieza (se entregan una sola vez). */
export const AWARDS = [
  { id: "racha-5", rule: "streak", n: 5, tier: 0, how: "5 días seguidos cumpliendo tu meta" },
  { id: "racha-10", rule: "streak", n: 10, tier: 0, how: "10 días seguidos cumpliendo tu meta" },
  { id: "racha-30", rule: "streak", n: 30, tier: 1, how: "30 días seguidos cumpliendo tu meta" },
  { id: "racha-60", rule: "streak", n: 60, tier: 1, how: "60 días seguidos cumpliendo tu meta" },
  { id: "racha-120", rule: "streak", n: 120, tier: 2, how: "120 días seguidos cumpliendo tu meta" },
  { id: "racha-360", rule: "streak", n: 360, tier: 3, how: "360 días seguidos cumpliendo tu meta" },
  { id: "primer-repaso", rule: "review", n: 1, tier: 0, how: "Completa tu primer repaso" },
  { id: "primera-amistad", rule: "friend", n: 1, tier: 1, how: "Agrega tu primera amistad" },
] as const;
export type AwardId = (typeof AWARDS)[number]["id"];

const names = data.names as Record<string, { name: string; kind: string }>;

export type Piece = { id: string; name: string; kind: string; slot: Slot; tier: Tier; source: Source; price: number; how: string };
export const PIECES: Piece[] = (() => {
  const out: Piece[] = [];
  const add = (id: string, name: string, kind: string, tier: Tier, source: Source = "shop", how?: string) =>
    out.push({ id, name, kind, slot: KIND_SLOT[kind], tier, source, price: source === "shop" ? PRICE[tier] : 0, how: how ?? (source === "starter" ? "Incluida desde el inicio" : `Tienda o cofres · ${TIERS[tier]}`) });
  for (const [id, [name, kind, tier, source]] of Object.entries(BASE)) add(id, name, kind, tier, source);
  CLOTHES.forEach((id, i) => add(id, names[id].name, names[id].kind, Math.floor(i / 2) as Tier));
  // Colección del jardín: en cada grupo de 8, dos piezas por rareza.
  for (const [id, v] of Object.entries(names)) if (id.startsWith("jardin-")) add(id, v.name, v.kind, Math.floor(((Number(id.slice(-1)) - 1) % 8) / 2) as Tier);
  for (const a of AWARDS) add(a.id, names[a.id].name, "badge", a.tier, "award", a.how);
  return out;
})();
export const pieceOf = (id: string) => PIECES.find((p) => p.id === id);
export const STARTERS = PIECES.filter((p) => p.source === "starter").map((p) => p.id);

/** Inventario: la pieza X se guarda como "pz-X" y la mascota Y como "pet-Y". Los id anteriores ("acc-X", "out-X") siguen valiendo. */
export const pieceKey = (id: string) => `pz-${id}`;
export const petKey = (id: string) => `pet-${id}`;
export function ownsPiece(id: string, owned: Set<string>) {
  return STARTERS.includes(id) || owned.has(pieceKey(id)) || owned.has(`acc-${id}`) || owned.has(`out-${id}`);
}
export function ownsPet(id: string, owned: Set<string>) {
  return !!petOf(id)?.free || owned.has(petKey(id));
}

/** Une una pieza al conjunto: reemplaza la que ocupe su misma zona. */
export function combine(wear: string[], id: string): string[] {
  const p = pieceOf(id);
  if (!p) return wear;
  return [...wear.filter((k) => pieceOf(k)?.slot !== p.slot), id];
}
export const sanitizeWear = (wear: unknown): string[] => (Array.isArray(wear) ? wear.filter((k): k is string => typeof k === "string" && !!pieceOf(k)).reduce<string[]>((acc, k) => combine(acc, k), []) : []);

// ---------- Composición por capas (port del probador de la entrega) ----------

type Box = [number, number, number, number];
type PetData = { whole: string[]; lower: Record<string, Box>; top: Record<string, Box>; fabric: Record<string, Box>; front: Record<string, Box>; ink: Record<string, Box>; badges: Record<string, [number, number, number]> };
const D = data as unknown as { feet: Record<string, Record<string, number>>; groups: { body: string[]; neck: string[]; head: string[] }; pets: Record<string, PetData>; boxes: Record<string, Record<string, Box>> };

/**
 * Para las demás poses (celebra, piensa…) solo se ponen las piezas de cabeza, cara y cabello, con la caja medida
 * para cada especie. La ropa del cuerpo está dibujada para la pose feliz y no se fuerza sobre otras.
 */
export function poseLayers(pet: string, wear: string[]): Layer[] {
  const boxes = D.boxes[pet];
  if (!boxes) return [];
  return [...wear]
    .filter((k) => ["face", "head", "hair"].includes(pieceOf(k)?.slot ?? "") && boxes[k])
    .sort((a, b) => SLOTS.indexOf(pieceOf(a)!.slot) - SLOTS.indexOf(pieceOf(b)!.slot))
    .map((k) => {
      const [x, y, w, h] = boxes[k];
      return { src: `/armario/layers/${k}.webp`, x: x / 10.24, y: y / 10.24, w: w / 10.24, h: h / 10.24 };
    });
}

export type Layer = { src: string; x: number; y: number; w: number; h: number };

/** Capas (en % del lienzo cuadrado) para dibujar la mascota feliz con su conjunto. */
export function dressLayers(pet: string, wear: string[]): Layer[] {
  const m = D.pets[pet];
  if (!m) return [];
  const g = D.groups;
  const sel = [...wear].sort((a, b) => SLOTS.indexOf(pieceOf(a)?.slot ?? "body") - SLOTS.indexOf(pieceOf(b)?.slot ?? "body"));
  const body = sel.find((k) => g.body.includes(k));
  const neck = sel.find((k) => g.neck.includes(k));
  const head = sel.find((k) => g.head.includes(k));
  const low = body ?? neck;
  const dir = `/armario/pets/${pet}`;
  const full: Box = [0, 0, 1024, 1024];
  const raw: [string, Box][] = [];
  if (head && low) raw.push([`${dir}/lower-${low}.webp`, m.lower[low]], [`${dir}/top-${head}.webp`, m.top[head]]);
  else {
    const k = head ?? low;
    raw.push([k && m.whole.includes(k) ? `${dir}/whole-${k}.webp` : `${dir}/base.webp`, full]);
  }
  if (body && neck && m.fabric[neck]) raw.push([`${dir}/fabric-${neck}.webp`, m.fabric[neck]]);
  const small = sel.filter((k) => m.ink[k]);
  for (const k of small) {
    let b = m.ink[k];
    const pin = pieceOf(k)?.kind === "badge" ? m.badges[`${body}:${neck ?? ""}`] : undefined;
    if (pin) {
      const [x, y, max] = pin;
      const s = Math.min(1, max / Math.max(b[2], b[3]));
      b = [Math.round(x - (b[2] * s) / 2), Math.round(y - (b[3] * s) / 2), Math.round(b[2] * s), Math.round(b[3] * s)];
    }
    raw.push([`/armario/layers/${k}.webp`, b]);
  }
  if (head && small.some((k) => pieceOf(k)?.kind === "glasses") && m.front[head]) raw.push([`${dir}/front-${head}.webp`, m.front[head]]);
  const scale = 880 / 1024;
  const base = D.feet[pet]?.[low ?? head ?? "base"] ?? 964;
  return raw.filter(([, b]) => !!b).map(([src, [x, y, w, h]]) => ({ src, x: (72 + x * scale) / 10.24, y: (964 + (y - base) * scale) / 10.24, w: (w * scale) / 10.24, h: (h * scale) / 10.24 }));
}

// ---------- Cofres ----------

/** Probabilidades en %: [vacío, Normal, Raro, Épico, Legendario]. */
export const CHESTS = [
  { id: "semilla", name: "Cofre semilla", price: 20, odds: [20, 51, 21, 7, 1] },
  { id: "brote", name: "Cofre brote", price: 28, odds: [12, 35, 32, 17, 4] },
  { id: "aurora", name: "Cofre aurora", price: 34, odds: [6, 22, 32, 28, 12] },
] as const;
export type ChestId = (typeof CHESTS)[number]["id"];
/** Regla de repetidos: se queda una sola copia y se devuelve la mitad del precio del cofre. */
export const dupRefund = (chest: { price: number }) => Math.floor(chest.price / 2);
/** Lo que puede salir de un cofre de una rareza: piezas de tienda y mascotas de pago. */
export const chestPool = (tier: Tier) => [
  ...PIECES.filter((p) => p.source === "shop" && p.tier === tier).map((p) => ({ type: "piece" as const, id: p.id })),
  ...PETS.filter((p) => !p.free && p.tier === tier).map((p) => ({ type: "pet" as const, id: p.id as string })),
];

// ---------- Vidas, protección y potenciadores ----------

export const LIVES = { start: 5, max: 5, bonusCap: 7, shieldGems: 5, practiceGoal: 8, practicePerDay: 3 } as const;
export const BOOST = { minutes: 15, price: 40, label: "Doble XP (15 min)" } as const;
export const GIFT = { perDay: 5, maxGems: 20 } as const;

/** ¿Puede usar este aspecto? La mascota debe ser suya y cada pieza de cada conjunto también. Devuelve lo que falta. */
export function missingFor(look: { species: string; sets: Partial<Record<string, string[]>> }, owned: Set<string>): string | null {
  if (!ownsPet(look.species, owned)) return petOf(look.species)?.label ?? look.species;
  for (const wear of Object.values(look.sets)) for (const id of wear ?? []) if (!ownsPiece(id, owned)) return pieceOf(id)?.name ?? id;
  return null;
}
