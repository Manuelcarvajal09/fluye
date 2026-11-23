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
  { id: "castor", label: "Castor", defaultName: "Timber", color: "#a8693b", blurb: "El símbolo de Canadá" },
  { id: "oso", label: "Oso", defaultName: "Bruno", color: "#8b5a3c", blurb: "Tranquilo y constante" },
  { id: "zorro", label: "Zorro", defaultName: "Rufo", color: "#e8782f", blurb: "Listo y rápido" },
  { id: "buho", label: "Búho", defaultName: "Hoot", color: "#8a7a66", blurb: "Le encanta estudiar" },
  { id: "panda", label: "Panda", defaultName: "Mochi", color: "#2f2a33", blurb: "Tierno y paciente" },
] as const;
export type Species = (typeof SPECIES)[number]["id"];
export const SPECIES_IDS = SPECIES.map((s) => s.id) as Species[];

export const FUR_COLORS = ["#a8693b", "#8b5a3c", "#e8782f", "#8a7a66", "#2f2a33", "#5b7fa6", "#3f9e8f", "#8a63c9", "#d96a8f", "#e3b23c", "#e9e4da"] as const;
/** Colores de tienda (cosméticos). */
export const SHOP_COLORS = [
  { id: "color-menta", label: "Menta", hex: "#5fd3b0", price: 40 },
  { id: "color-lavanda", label: "Lavanda", hex: "#b59cf0", price: 40 },
  { id: "color-cielo", label: "Cielo", hex: "#7cc3f5", price: 40 },
  { id: "color-oro", label: "Oro", hex: "#d4a72c", price: 80 },
] as const;

/** price 0 = gratis desde el inicio. Los demás se compran con gemas (solo cosmético). */
export const ACCESSORIES = [
  { id: "none", label: "Nada", price: 0 },
  { id: "toque", label: "Gorro (toque)", price: 0 },
  { id: "glasses", label: "Lentes", price: 0 },
  { id: "headphones", label: "Audífonos", price: 0 },
  { id: "scarf", label: "Bufanda", price: 0 },
  { id: "cap", label: "Gorra", price: 30 },
  { id: "flower", label: "Flor", price: 30 },
  { id: "bowtie", label: "Moño", price: 40 },
  { id: "earmuffs", label: "Orejeras", price: 50 },
  { id: "santa", label: "Gorro navideño", price: 50 },
  { id: "wizard", label: "Sombrero de mago", price: 90 },
  { id: "crown", label: "Corona", price: 150 },
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

export type Look = { accent: AccentId; species: Species; name: string; color: string; accessory: Accessory; outfit: Outfit };

export const DEFAULT_LOOK: Look = { accent: "esmeralda", species: "castor", name: "Timber", color: "#a8693b", accessory: "toque", outfit: "none" };

export function lookOf(raw: Partial<Look> | undefined): Look {
  const sp = SPECIES.find((s) => s.id === raw?.species) ?? SPECIES[0];
  return {
    accent: ACCENT_IDS.includes(raw?.accent as AccentId) ? (raw!.accent as AccentId) : DEFAULT_LOOK.accent,
    species: sp.id,
    name: (raw?.name ?? "").trim().slice(0, 16) || sp.defaultName,
    color: /^#[0-9a-f]{6}$/i.test(raw?.color ?? "") ? raw!.color! : sp.color,
    accessory: ACCESSORY_IDS.includes(raw?.accessory as Accessory) ? (raw!.accessory as Accessory) : DEFAULT_LOOK.accessory,
    outfit: OUTFIT_IDS.includes(raw?.outfit as Outfit) ? (raw!.outfit as Outfit) : "none",
  };
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
  const acc = ACCESSORIES.find((a) => a.id === look.accessory);
  const out = OUTFITS.find((o) => o.id === look.outfit);
  const col = SHOP_COLORS.find((c) => c.hex.toLowerCase() === look.color.toLowerCase());
  return (!acc?.price || owned.has(`acc-${acc.id}`)) && (!out?.price || owned.has(`out-${out.id}`)) && (!col || owned.has(col.id));
}
