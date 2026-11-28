import { describe, expect, it } from "vitest";
import { BACKGROUNDS, THEMES, bgImage, bgKey, bgPrice, canUseBg, canUseTheme, themeKey } from "@/lib/themes";
import { PRICE } from "@/lib/wardrobe";

describe("Temáticas y fondos", () => {
  it("hay 16 temáticas, incluida Navidad (regalo de registro)", () => {
    expect(THEMES).toHaveLength(16);
    expect(THEMES.some((t) => t.id === "navidad")).toBe(true);
  });
  it("una temática se usa si es tuya o con el permiso de todas", () => {
    expect(canUseTheme("halloween", new Set(), false)).toBe(false);
    expect(canUseTheme("halloween", new Set([themeKey("halloween")]), false)).toBe(true);
    expect(canUseTheme("halloween", new Set(), true)).toBe(true);
    expect(canUseTheme("no-existe", new Set(), true)).toBe(false);
  });
  it("los fondos se compran por rareza y solo se usan si son tuyos", () => {
    expect(BACKGROUNDS).toHaveLength(16);
    expect(bgPrice("cafe")).toBe(PRICE[0]);
    expect(bgPrice("navidad")).toBe(PRICE[3]);
    expect(canUseBg("cafe", new Set())).toBe(false);
    expect(canUseBg("cafe", new Set([bgKey("cafe")]))).toBe(true);
  });
  it("quien compró un fondo anterior (escena de lección) conserva el nuevo de la misma rareza", () => {
    expect(canUseBg("habitacion", new Set([bgKey("super")]))).toBe(true);
    expect(canUseBg("aurora", new Set([bgKey("invierno")]))).toBe(true);
    expect(canUseBg("aurora", new Set([bgKey("super")]))).toBe(false);
    expect(bgImage("invierno", "square")).toBe("/fondos/aurora-cuadrado.webp");
    expect(bgImage("cafe")).toBe("/fondos/cafe.webp");
  });
});
