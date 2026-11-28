import { describe, expect, it } from "vitest";
import { pickSignupGift, promoActive } from "@/lib/promo";
import { CHRISTMAS, PETS, PIECES } from "@/lib/wardrobe";

describe("Regalo de registro", () => {
  it("vigente hasta el 31 de diciembre de 2026", () => {
    expect(promoActive(new Date("2026-11-26T12:00:00Z"))).toBe(true);
    expect(promoActive(new Date("2026-12-31T23:00:00-06:00"))).toBe(true);
    expect(promoActive(new Date("2027-01-01T06:30:00Z"))).toBe(false);
  });
  it("mascota de pago no legendaria, pieza de tienda y navideña distintas, y la temática Navidad", () => {
    for (let i = 0; i < 200; i++) {
      let n = i;
      const g = pickSignupGift(() => ((n = (n * 9301 + 49297) % 233280) / 233280));
      const pet = PETS.find((p) => p.id === g.pet)!;
      expect(pet.free).toBe(false);
      expect(pet.tier).toBeLessThan(3);
      expect(PIECES.find((p) => p.id === g.piece)?.source).toBe("shop");
      expect((CHRISTMAS as readonly string[]).includes(g.xmas)).toBe(true);
      expect(g.piece).not.toBe(g.xmas);
      expect(g.theme).toBe("theme-navidad");
    }
  });
});
