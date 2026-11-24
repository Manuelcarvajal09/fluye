// Personalización visual por persona: color de acento, mascota (especie, nombre, color, accesorio).

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

export const SPECIES = [
  { id: "zorro", label: "Zorro", defaultName: "Rufo", color: "#f0832f", blurb: "Listo y travieso" },
  { id: "gato", label: "Gato", defaultName: "Misu", color: "#9aa5c9", blurb: "Curioso y elegante" },
  { id: "perro", label: "Perro", defaultName: "Toby", color: "#dba05f", blurb: "Leal y entusiasta" },
  { id: "oso", label: "Oso", defaultName: "Bruno", color: "#b07a52", blurb: "Tranquilo y constante" },
  { id: "panda", label: "Panda", defaultName: "Mochi", color: "#2f2a33", blurb: "Tierno y paciente" },
  { id: "buho", label: "Búho", defaultName: "Hoot", color: "#8d7b6a", blurb: "Le encanta estudiar" },
] as const;
export type Species = (typeof SPECIES)[number]["id"];
export const SPECIES_IDS = SPECIES.map((s) => s.id) as Species[];

export const FUR_COLORS = ["#f0832f", "#9aa5c9", "#dba05f", "#b07a52", "#2f2a33", "#8d7b6a", "#f0a04b", "#5b7fa6", "#3f9e8f", "#8a63c9", "#d96a8f", "#e3b23c"] as const;
/** Colores de tienda (cosméticos). */
export const SHOP_COLORS = [
  { id: "color-menta", label: "Menta", hex: "#5fd3b0", price: 40 },
  { id: "color-lavanda", label: "Lavanda", hex: "#b59cf0", price: 40 },
  { id: "color-cielo", label: "Cielo", hex: "#7cc3f5", price: 40 },
  { id: "color-oro", label: "Oro", hex: "#d4a72c", price: 80 },
] as const;

/**
 * price 0 = gratis desde el inicio. Los demás se compran con gemas (solo cosmético).
 * slot = zona donde se pone: se puede combinar uno de cabeza + uno de cara + uno de cuello + un atuendo.
 */
export type Slot = "head" | "face" | "neck";
export const SLOT_LABEL: Record<Slot, string> = { head: "Cabeza", face: "Cara", neck: "Cuello" };
export const ACCESSORIES = [
  { id: "none", label: "Nada", price: 0, slot: "head" },
  { id: "toque", label: "Gorro (toque)", price: 0, slot: "head" },
  { id: "glasses", label: "Lentes", price: 0, slot: "face" },
  { id: "headphones", label: "Audífonos", price: 0, slot: "head" },
  { id: "scarf", label: "Bufanda", price: 0, slot: "neck" },
  { id: "cap", label: "Gorra", price: 30, slot: "head" },
  { id: "flower", label: "Flor", price: 30, slot: "head" },
  { id: "bowtie", label: "Moño", price: 40, slot: "neck" },
  { id: "earmuffs", label: "Orejeras", price: 50, slot: "head" },
  { id: "santa", label: "Gorro navideño", price: 50, slot: "head" },
  { id: "wizard", label: "Sombrero de mago", price: 90, slot: "head" },
  { id: "crown", label: "Corona", price: 150, slot: "head" },
] as const;
export const OUTFITS = [
  { id: "none", label: "Sin atuendo", price: 0 },
  { id: "hoodie", label: "Sudadera", price: 60 },
  { id: "sweater", label: "Suéter navideño", price: 70 },
  { id: "labcoat", label: "Bata de laboratorio", price: 70 },
  { id: "suit", label: "Traje", price: 90 },
] as const;
export type Outfit = (typeof OUTFITS)[number]["id"];
export const OUTFIT_IDS = OUTFITS.map((o) => o.id) as Outfit[];
export type Accessory = (typeof ACCESSORIES)[number]["id"];
export const ACCESSORY_IDS = ACCESSORIES.map((a) => a.id) as Accessory[];

/** `accessory` es la zona de cabeza (nombre histórico); `face` y `neck` son las otras dos zonas combinables. */
export type Look = { accent: AccentId; species: Species; name: string; color: string; accessory: Accessory; face: Accessory; neck: Accessory; outfit: Outfit };
export const slotOf = (id: string): Slot => (ACCESSORIES.find((a) => a.id === id)?.slot ?? "head") as Slot;

export const DEFAULT_LOOK: Look = { accent: "esmeralda", species: "zorro", name: "Rufo", color: "#f0832f", accessory: "toque", face: "none", neck: "none", outfit: "none" };

export function lookOf(raw: Partial<Look> | undefined): Look {
  const sp = SPECIES.find((s) => s.id === raw?.species) ?? SPECIES[0];
  const retired = !!raw?.species && sp.id !== raw.species; // especie retirada (castor): usa el color de la nueva
  return {
    accent: ACCENT_IDS.includes(raw?.accent as AccentId) ? (raw!.accent as AccentId) : DEFAULT_LOOK.accent,
    species: sp.id,
    name: (raw?.name ?? "").trim().slice(0, 16) || sp.defaultName,
    color: !retired && /^#[0-9a-f]{6}$/i.test(raw?.color ?? "") ? raw!.color! : sp.color,
    ...slots(raw),
    outfit: OUTFIT_IDS.includes(raw?.outfit as Outfit) ? (raw!.outfit as Outfit) : "none",
  };
}

/** Reparte los accesorios en sus zonas. Los aspectos guardados antes (un solo accesorio) se migran solos a su zona. */
function slots(raw: Partial<Look> | undefined): Pick<Look, "accessory" | "face" | "neck"> {
  const ok = (v: unknown, slot: Slot) => (ACCESSORY_IDS.includes(v as Accessory) && v !== "none" && slotOf(v as string) === slot ? (v as Accessory) : null);
  const legacy = raw?.accessory;
  const head = ok(legacy, "head") ?? (raw && "accessory" in raw ? "none" : DEFAULT_LOOK.accessory);
  return { accessory: head as Accessory, face: ok(raw?.face, "face") ?? ok(legacy, "face") ?? "none", neck: ok(raw?.neck, "neck") ?? ok(legacy, "neck") ?? "none" };
}

/** Todo lo comprable en la tienda, con id de inventario. */
export function shopCatalog() {
  return [
    ...ACCESSORIES.filter((a) => a.price > 0).map((a) => ({ id: `acc-${a.id}`, kind: "accessory" as const, value: a.id as string, label: a.label, price: a.price })),
    ...OUTFITS.filter((o) => o.price > 0).map((o) => ({ id: `out-${o.id}`, kind: "outfit" as const, value: o.id as string, label: o.label, price: o.price })),
    ...SHOP_COLORS.map((c) => ({ id: c.id, kind: "color" as const, value: c.hex as string, label: c.label, price: c.price })),
    { id: "freeze", kind: "freeze" as const, value: "freeze", label: "Protector de racha", price: 50 },
  ];
}
export type ShopItem = ReturnType<typeof shopCatalog>[number];

/** ¿Puede usar este aspecto con lo que tiene? (lo gratis siempre; lo de tienda si está en el inventario). */
export function ownsLook(look: Look, owned: Set<string>) {
  const accs = [look.accessory, look.face, look.neck].map((id) => ACCESSORIES.find((a) => a.id === id));
  const out = OUTFITS.find((o) => o.id === look.outfit);
  const col = SHOP_COLORS.find((c) => c.hex.toLowerCase() === look.color.toLowerCase());
  return accs.every((acc) => !acc?.price || owned.has(`acc-${acc.id}`)) && (!out?.price || owned.has(`out-${out.id}`)) && (!col || owned.has(col.id));
}
