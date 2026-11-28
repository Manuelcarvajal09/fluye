// Armario de Fluye: mascotas, piezas, rarezas, precios y composición por capas.
// Las capas y sus cajas vienen de la entrega de arte (scripts/armario/export.mjs → armario-data.json).
// Este módulo no toca la base de datos: lo usan cliente y servidor.
import data from "./armario-data.json";
// Capas por pose (celebra, piensa…), con el mismo formato que la pose feliz. Se llena con scripts/armario/import-poses.mjs.
import posesData from "./armario-poses.json";

export const TIERS = ["Normal", "Raro", "Épico", "Legendario"] as const;
export type Tier = 0 | 1 | 2 | 3;
/** Precio directo en gemas por rareza. Las mascotas cuestan 40 más. (Fase 3: subidos para equilibrar la economía.) */
export const PRICE = [60, 110, 180, 280] as const;
export const PET_EXTRA = 40;

const ALL_PETS = [
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
  // Fase 3 (arte de Codex): cuatro especies nuevas.
  { id: "tlacuache", label: "Tlacuache", defaultName: "Tlaco", tier: 1, free: false, x: 55.5 },
  { id: "mapache", label: "Mapache", defaultName: "Bandi", tier: 2, free: false, x: 53.2 },
  { id: "dragon", label: "Dragón", defaultName: "Jade", tier: 3, free: false, x: 56.1 },
  { id: "unicornio", label: "Unicornio", defaultName: "Luna", tier: 3, free: false, x: 52.8 },
] as const satisfies readonly { id: string; label: string; defaultName: string; tier: Tier; free: boolean; x: number }[];
/**
 * Arte en regeneración (docs/ux/CODEX-FASE3-REGENERACION.md): las prendas venían pegadas sobre la mascota.
 * Mientras llega el arte nuevo, las cuatro especies de la Fase 3 y la colección navideña nueva no se muestran,
 * no se venden y no salen en cofres ni regalos. Pon `true` cuando se integre la entrega corregida.
 */
export const FASE3_ART_READY = false;
const PENDING_PETS = new Set(["tlacuache", "mapache", "dragon", "unicornio"]);
export const PETS = ALL_PETS.filter((p) => FASE3_ART_READY || !PENDING_PETS.has(p.id));
export type PetId = (typeof PETS)[number]["id"];
export const PET_IDS = PETS.map((p) => p.id) as PetId[];
export const petOf = (id: string) => PETS.find((p) => p.id === id);
export const petPrice = (id: string) => {
  const p = petOf(id);
  return p && !p.free ? PRICE[p.tier] + PET_EXTRA : 0;
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
/** Colección navideña (Fase 3): rareza de cada pieza. Nombre y tipo vienen del arte (armario-data.json). */
const XMAS: Record<string, Tier> = { "gorro-reno": 1, "bufanda-luces": 1, "pijama-navidad": 2, "lentes-estrella": 0, "mono-regalo": 0, "pin-baston": 0, "pin-galleta": 1, "diadema-copos": 2 };
/** Piezas con el arte en revisión (se ven mal sobre las mascotas): no se venden ni salen en cofres hasta que llegue el arte corregido. */
const ART_PENDING = new Set(FASE3_ART_READY ? [] : ["pijama-navidad", "bufanda-luces", "gorro-reno", "lentes-estrella", "mono-regalo", "pin-baston", "pin-galleta", "diadema-copos"]);

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
  for (const [id, tier] of Object.entries(XMAS)) if (names[id] && !ART_PENDING.has(id)) add(id, names[id].name, names[id].kind, tier);
  for (const a of AWARDS) add(a.id, names[a.id].name, "badge", a.tier, "award", a.how);
  return out;
})();
export const pieceOf = (id: string) => PIECES.find((p) => p.id === id);
export const STARTERS = PIECES.filter((p) => p.source === "starter").map((p) => p.id);

/** Inventario: la pieza X se guarda como "pz-X" y la mascota Y como "pet-Y". Los id anteriores ("acc-X", "out-X") siguen valiendo. */
/** Piezas navideñas (se amplía cuando llegan las nuevas de Codex). */
export const CHRISTMAS = ["santa", "sweater", ...Object.keys(XMAS).filter((id) => !ART_PENDING.has(id))] as readonly string[];
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
type PetData = { whole: string[]; lower: Record<string, Box>; top: Record<string, Box>; fabric: Record<string, Box>; front: Record<string, Box>; ink: Record<string, Box>; badges: Record<string, [number, number, number]>; inkWithHat?: Record<string, Record<string, Box>> };
const D = data as unknown as { feet: Record<string, Record<string, number>>; groups: { body: string[]; neck: string[]; head: string[] }; pets: Record<string, PetData>; boxes: Record<string, Record<string, Box>>; fit?: Record<string, { s: number; dx: number; dy: number }>; pieceFit?: Record<string, Record<string, number>> };

/**
 * Para las demás poses (celebra, piensa…) solo se ponen las piezas de cabeza, cara y cabello, con la caja medida
 * para cada especie. La ropa del cuerpo está dibujada para la pose feliz y no se fuerza sobre otras.
 */
export function poseLayers(pet: string, wear: string[]): Layer[] {
  const boxes = D.boxes[pet];
  if (!boxes) return [];
  const head = wear.find((k) => pieceOf(k)?.slot === "head");
  const hat = head ? hatLayer(pet, head) : undefined;
  return [...wear]
    .filter((k) => ["face", "head", "hair"].includes(pieceOf(k)?.slot ?? "") && boxes[k])
    .sort((a, b) => SLOTS.indexOf(pieceOf(a)!.slot) - SLOTS.indexOf(pieceOf(b)!.slot))
    .map((k) => {
      const [x, y, w, h] = boxes[k];
      const s = pieceOf(k)!.slot;
      return { src: `/armario/layers/${k}.webp`, x: x / 10.24, y: y / 10.24, w: w / 10.24, h: h / 10.24, ...(hat && (s === "face" || s === "hair") ? { mask: hat } : {}) };
    });
}

/** Capa: imagen y caja en % del lienzo. `mask` = silueta que la tapa (p. ej. el ala del sombrero sobre los lentes). */
export type Layer = { src: string; x: number; y: number; w: number; h: number; mask?: Omit<Layer, "mask"> };

/** El sombrero solo (sin mascota), en su caja medida para la especie: sirve de pieza suelta y de máscara de oclusión. */
function hatLayer(pet: string, head: string): Omit<Layer, "mask"> | undefined {
  const b = D.boxes[pet]?.[head];
  return b ? { src: `/armario/layers/${head}.webp`, x: b[0] / 10.24, y: b[1] / 10.24, w: b[2] / 10.24, h: b[3] / 10.24 } : undefined;
}

/**
 * Imágenes de cabeza con defectos de arte (docs/qa/mascotas-defectos.csv): en vez de la mascota repintada con el gorro,
 * se dibuja la base (o la ropa) y el gorro como pieza suelta. Se quitan de aquí cuando llegue el arte corregido.
 */
const LOOSE_HEAD: Record<string, string[] | "all"> = {}; // vacío: la entrega de Codex (nov. 2026) corrigió la nutria y los audífonos
const looseHead = (pet: string, head?: string) => !!head && (LOOSE_HEAD[pet] === "all" || (LOOSE_HEAD[pet] as string[] | undefined)?.includes(head));

/** Capas (en % del lienzo cuadrado) para dibujar la mascota feliz con su conjunto. */
type PoseData = PetData & { feet: Record<string, number>; fit: { s: number; dx: number; dy: number }; pieceFit?: Record<string, number> };
const POSES = posesData as unknown as Record<string, Partial<Record<string, PoseData>>>;

/** ¿Hay capas dibujadas para esta pose que cubran todas las piezas de cuerpo y cuello del conjunto? */
export function poseCovers(pet: string, mood: string, wear: string[]) {
  if (mood === "happy") return true;
  const p = POSES[pet]?.[mood];
  if (!p) return false;
  return wear.every((k) => {
    const s = pieceOf(k)?.slot;
    return s === "body" || s === "neck" || s === "head" ? p.whole.includes(k) : s === "chest" || s === "face" || s === "hair" ? !!p.ink[k] : true;
  });
}

/** Capas (en % del lienzo cuadrado) para dibujar la mascota con su conjunto en la pose pedida (feliz si no hay otra). */
export function dressLayers(pet: string, wear: string[], mood = "happy"): Layer[] {
  const pose = mood !== "happy" ? POSES[pet]?.[mood] : undefined;
  const m = pose ?? D.pets[pet];
  if (!m) return [];
  const g = D.groups;
  const sel = [...wear].sort((a, b) => SLOTS.indexOf(pieceOf(a)?.slot ?? "body") - SLOTS.indexOf(pieceOf(b)?.slot ?? "body"));
  const body = sel.find((k) => g.body.includes(k));
  const neck = sel.find((k) => g.neck.includes(k));
  const headPiece = sel.find((k) => g.head.includes(k));
  const loose = !pose && looseHead(pet, headPiece);
  const head = loose ? undefined : headPiece;
  // La blusa marinera trae su propio pañuelo: con otra pieza de cuello se usa la variante sin pañuelo (si existe).
  const low0 = body ?? neck;
  const low = low0 === "marinera" && neck && m.whole.includes("marinera-sin-panuelo") ? "marinera-sin-panuelo" : low0;
  const dir = pose ? `/armario/poses/${pet}/${mood}` : `/armario/pets/${pet}`;
  const full: Box = [0, 0, 1024, 1024];
  const raw: [string, Box][] = [];
  if (head && low) raw.push([`${dir}/lower-${low}.webp`, m.lower[low]], [`${dir}/top-${head}.webp`, m.top[head]]);
  else {
    const k = head ?? low;
    raw.push([k && m.whole.includes(k) ? `${dir}/whole-${k}.webp` : `${dir}/base.webp`, full]);
  }
  if (body && neck && m.fabric[neck]) raw.push([`${dir}/fabric-${neck}.webp`, m.fabric[neck]]);
  const small = sel.filter((k) => m.ink[k]);
  // Pines: un mismo punto del pecho para todos (el de racha-5). Si hay pieza de cuello, se corren a un lado para no taparla.
  const anchor = m.ink["racha-5"];
  // Pines sobre la pijama navideña: el arte trae su punto en la tela visible (con o sin bufanda).
  const pinSpot = body ? m.badges?.[`${body}:${neck ?? ""}`] ?? m.badges?.[`${body}:`] : undefined;
  const fitted = new Set<string>();
  for (const k of small) {
    let b = m.ink[k];
    // Adorno de cabello con sombrero: caja medida por el arte para ese sombrero (no se corta con la máscara).
    const withHat = head ? m.inkWithHat?.[head]?.[k] : undefined;
    if (withHat) {
      b = withHat;
      fitted.add(`/armario/layers/${k}.webp`);
    } else if (pieceOf(k)?.kind === "badge" && pinSpot) {
      const [cx, cy, size] = pinSpot;
      const sc = Math.min(1, size / Math.max(b[2], b[3]));
      b = [Math.round(cx - (b[2] * sc) / 2), Math.round(cy - (b[3] * sc) / 2), Math.round(b[2] * sc), Math.round(b[3] * sc)];
    } else if (pieceOf(k)?.kind === "badge" && anchor) {
      const cx = anchor[0] + anchor[2] / 2 - (neck ? anchor[2] * 1.15 : 0);
      const cy = anchor[1] + anchor[3] / 2 + (neck ? anchor[3] * 0.2 : 0);
      b = [Math.round(cx - b[2] / 2), Math.round(cy - b[3] / 2), b[2], b[3]];
    }
    raw.push([`/armario/layers/${k}.webp`, b]);
  }
  if (head && small.some((k) => pieceOf(k)?.kind === "glasses") && m.front[head]) raw.push([`${dir}/front-${head}.webp`, m.front[head]]);
  const scale = 880 / 1024;
  const base = (pose?.feet ?? D.feet[pet])?.[low ?? head ?? "base"] ?? 964;
  // Calibración (scripts/armario/calibrar.mjs): la composición del probador queda más pequeña que las ilustraciones
  // de las poses; se reescala para que la mascota vestida mida y se apoye igual que en cualquier otro estado.
  const f = pose?.fit ?? D.fit?.[pet] ?? { s: 1, dx: 0, dy: 0 };
  // Las imágenes con ropa de cuerpo o cuello vienen dibujadas ~10–20 % más grandes (scripts/armario/calibrar-piezas.mjs):
  // se reducen alrededor de los pies para que la mascota no cambie de tamaño al vestirse.
  // Sin ropa de cuerpo ni cuello, la imagen dibujada es la del gorro (whole-<gorro>): se usa su propia escala.
  const fitKey = low ?? head;
  const r = (fitKey ? (pose ? pose.pieceFit?.[fitKey] : D.pieceFit?.[pet]?.[fitKey]) : undefined) ?? 1;
  const at = (x: number, y: number, rr = r, bb = base) => [512 + (72 + x * scale - 512) * rr, 964 - (964 - (964 + (y - bb) * scale)) * rr];
  // Con solo un gorro redibujado a otra escala, las piezas sueltas (lentes, pines, adornos) se miden sobre la base: van con sus pies y sin esa escala.
  const baseFeet = (pose?.feet ?? D.feet[pet])?.base ?? 964;
  const looseInk = !low && !!head && r !== 1; // solo cuando el gorro trae su propia escala (imagen redibujada a otro tamaño)
  const hat = headPiece ? hatLayer(pet, headPiece) : undefined;
  const out: Layer[] = raw
    .filter(([, b]) => !!b)
    .map(([src, [x, y, w, h]]) => {
      const ink = looseInk && src.startsWith("/armario/layers/") && !fitted.has(src);
      const rr = ink ? 1 : r;
      const [X, Y] = ink ? at(x, y, 1, baseFeet) : at(x, y);
      const kind = src.startsWith("/armario/layers/") ? pieceOf(src.slice(16, -5))?.slot : undefined;
      // Lentes y adornos de cabello quedan bajo el ala del sombrero (máscara con la silueta del sombrero).
      // Si hay capa front- del sombrero, ella ya tapa lo justo (el ala): los lentes no llevan máscara (la caja genérica cortaba el lente).
      const masked = hat && !pose && !fitted.has(src) && (kind === "hair" || (kind === "face" && !(headPiece && m.front[headPiece])));
      return { src, x: (X * f.s + f.dx) / 10.24, y: (Y * f.s + f.dy) / 10.24, w: (w * scale * rr * f.s) / 10.24, h: (h * scale * rr * f.s) / 10.24, ...(masked ? { mask: hat } : {}) };
    });
  if (loose && hat) out.push(hat);
  return out;
}

// ---------- Cofres ----------

/** Probabilidades en %: [vacío, Normal, Raro, Épico, Legendario]. */
export const CHESTS = [
  { id: "semilla", name: "Cofre semilla", price: 34, odds: [20, 51, 21, 7, 1] },
  { id: "brote", name: "Cofre brote", price: 48, odds: [12, 35, 32, 17, 4] },
  { id: "aurora", name: "Cofre aurora", price: 58, odds: [6, 22, 32, 28, 12] },
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
export const BOOST = { minutes: 15, price: 60, label: "Doble XP (15 min)" } as const;
/** Protector de racha: se compra con gemas; cubre un día sin meta. */
export const FREEZE = { price: 80, max: 3 } as const;
export const GIFT = { perDay: 5, maxGems: 20 } as const;

/** ¿Puede usar este aspecto? La mascota debe ser suya y cada pieza de cada conjunto también. Devuelve lo que falta. */
export function missingFor(look: { species: string; sets: Partial<Record<string, string[]>> }, owned: Set<string>): string | null {
  if (!ownsPet(look.species, owned)) return petOf(look.species)?.label ?? look.species;
  for (const wear of Object.values(look.sets)) for (const id of wear ?? []) if (!ownsPiece(id, owned)) return pieceOf(id)?.name ?? id;
  return null;
}
