import { describe, expect, it } from "vitest";
import { attemptXp, classifyError, finalGrade } from "@/lib/grading";
import { inRange, seasonFor } from "@/lib/seasons";
import { rankOf, weekStart, weeklyChallenges } from "@/lib/challenges";
import { goalOf, maskExplicit } from "@/lib/realtalk";
import { lookOf, wearOf } from "@/lib/look";
import { CHESTS, FASE3_ART_READY, PETS, PIECES, PRICE, STARTERS, chestPool, combine, dressLayers, dupRefund, missingFor, ownsPiece, poseLayers, sanitizeWear } from "@/lib/wardrobe";

describe("calificación de intentos", () => {
  it("ver la solución es olvido y casi no da XP", () => {
    expect(finalGrade({ correct: true, grade: 3, revealed: true })).toBe(1);
    expect(attemptXp({ correct: false, grade: 1, revealed: true }, false)).toBe(1);
  });
  it("un fallo calificado por la app es Again aunque la persona elija otra cosa", () => {
    expect(finalGrade({ correct: false, grade: 3 })).toBe(1);
  });
  it("con pistas, como mucho Hard", () => {
    expect(finalGrade({ correct: true, grade: 4, hints: 1 })).toBe(2);
  });
  it("la autoevaluación se respeta", () => {
    expect(finalGrade({ correct: true, grade: 4, kind: "self" })).toBe(4);
    expect(finalGrade({ correct: false, grade: 2, kind: "self" })).toBe(2);
  });
  it("recordar en primer intento vale más que con ayuda", () => {
    expect(attemptXp({ correct: true, grade: 3 }, false)).toBeGreaterThan(attemptXp({ correct: true, grade: 2, hints: 1 }, false));
  });
});

describe("clasificación de errores", () => {
  it("detecta artículo, preposición, orden y ortografía", () => {
    expect(classifyError("I bought a car", "I bought the car")).toBe("article");
    expect(classifyError("depends on you", "depends of you")).toBe("preposition");
    expect(classifyError("what time is it", "what time it is")).toBe("word_order");
    expect(classifyError("looking forward", "lookin forward")).toBe("spelling");
    expect(classifyError("give up", "surrender")).toBe("vocab");
  });
});

describe("temporadas", () => {
  it("rangos que cruzan el año", () => {
    expect(inRange("01-15", "12-01", "02-29")).toBe(true);
    expect(inRange("06-15", "12-01", "02-29")).toBe(false);
  });
  it("automático por estación y Navidad solo si se activa", () => {
    expect(seasonFor("2026-12-20", {})).toBe("invierno");
    expect(seasonFor("2026-12-20", { holidays: true })).toBe("navidad");
    expect(seasonFor("2026-07-10", {})).toBe("verano");
    expect(seasonFor("2026-10-10", {})).toBe("otono");
  });
  it("en México la temporada navideña llega a Reyes; en Canadá no", () => {
    expect(seasonFor("2027-01-05", { holidays: true, region: "MX" })).toBe("navidad");
    expect(seasonFor("2027-01-05", { holidays: true, region: "CA" })).toBe("invierno");
  });
  it("manual gana, off es neutral, y la fecha simulada se respeta", () => {
    expect(seasonFor("2026-07-10", { mode: "manual", manual: "navidad" })).toBe("navidad");
    expect(seasonFor("2026-12-24", { mode: "off", holidays: true })).toBe("neutral");
    expect(seasonFor("2026-07-10", { simDate: "2026-04-02" })).toBe("primavera");
  });
  it("rangos personalizados", () => {
    expect(seasonFor("2026-11-20", { ranges: { invierno: { start: "11-15", end: "03-15" } } })).toBe("invierno");
  });
});

describe("retos y rangos", () => {
  it("la semana empieza en lunes", () => {
    expect(weekStart("2026-11-23")).toBe("2026-11-23"); // lunes
    expect(weekStart("2026-11-29")).toBe("2026-11-23"); // domingo
  });
  it("retos semanales deterministas y sin repetir", () => {
    const a = weeklyChallenges("2026-11-23").map((w) => w.id);
    expect(a).toEqual(weeklyChallenges("2026-11-23").map((w) => w.id));
    expect(new Set(a).size).toBe(3);
  });
  it("el rango de juego crece con XP", () => {
    expect(rankOf(0).id).toBe("brote");
    expect(rankOf(5000).id).toBe("oro");
  });
});

describe("inglés real", () => {
  it("sin lenguaje explícito se enmascara; con él se muestra completo", () => {
    expect(maskExplicit("That's bullshit", false)).toBe("That's b*******");
    expect(maskExplicit("That's bullshit", true)).toBe("That's bullshit");
    expect(maskExplicit("Give me a break", false)).toBe("Give me a break");
  });
  it("lo ofensivo es para entenderlo por defecto, pero la persona decide", () => {
    expect(goalOf({ register: "offensive" })).toBe("understand");
    expect(goalOf({ register: "offensive" }, "both")).toBe("both");
    expect(goalOf({})).toBe("both");
  });
});

describe("armario", () => {
  it("catálogo: 71 piezas y 12 mascotas (la Fase 3 sigue oculta hasta el arte regenerado), cuatro rarezas y precios por rareza", () => {
    expect(PIECES).toHaveLength(FASE3_ART_READY ? 79 : 71);
    expect(PETS).toHaveLength(FASE3_ART_READY ? 16 : 12);
    for (const p of PIECES) if (p.source === "shop") expect(p.price).toBe(PRICE[p.tier]);
    expect(new Set(PIECES.map((p) => p.tier))).toEqual(new Set([0, 1, 2, 3]));
    expect(STARTERS.sort()).toEqual(["flower", "glasses"]);
  });
  it("lo de tienda solo se puede usar si es tuyo (con id nuevo o anterior); flor y lentes vienen de inicio", () => {
    const crown = lookOf({ sets: { zorro: ["crown"] } });
    expect(missingFor(crown, new Set())).toBe("Corona");
    expect(missingFor(crown, new Set(["acc-crown"]))).toBeNull();
    expect(missingFor(crown, new Set(["pz-crown"]))).toBeNull();
    expect(ownsPiece("glasses", new Set())).toBe(true);
    expect(missingFor(lookOf({ species: "ajolote" }), new Set())).toBe("Ajolote");
    expect(missingFor(lookOf({ species: "ajolote" }), new Set(["pet-ajolote"]))).toBeNull();
  });
  it("una pieza por zona: combinar reemplaza la de la misma zona", () => {
    expect(combine(["toque", "glasses"], "crown")).toEqual(["glasses", "crown"]);
    expect(combine(["toque"], "flower")).toEqual(["toque", "flower"]);
    expect(sanitizeWear(["toque", "cap", "nada", 3])).toEqual(["cap"]);
  });
  it("conjunto completo: lentes debajo del sombrero y capas dentro del lienzo", () => {
    const l = dressLayers("zorro", ["cap", "sweater", "glasses", "primer-repaso"]);
    const src = l.map((x) => x.src);
    expect(src[0]).toContain("lower-sweater");
    expect(src.indexOf("/armario/layers/glasses.webp")).toBeLessThan(src.indexOf("/armario/pets/zorro/front-cap.webp"));
    for (const x of l) expect(x.w).toBeGreaterThan(0);
    expect(dressLayers("zorro", [])).toEqual([expect.objectContaining({ src: "/armario/pets/zorro/base.webp" })]);
    expect(poseLayers("gato", ["sweater", "cap"]).map((x) => x.src)).toEqual(["/armario/layers/cap.webp"]);
  });
  it("cofres: cuestan menos que comprar, repetidos devuelven la mitad y cada rareza tiene premios", () => {
    for (const c of CHESTS) {
      expect(c.odds.reduce((a, b) => a + b, 0)).toBe(100);
      expect(c.price).toBeLessThan(PRICE[0]);
      expect(dupRefund(c)).toBeLessThan(c.price);
    }
    for (const t of [0, 1, 2, 3] as const) expect(chestPool(t).length).toBeGreaterThan(0);
    expect(chestPool(3).some((p) => p.type === "pet")).toBe(true);
  });
});

describe("mascotas", () => {
  it("un aspecto antiguo (accesorios por zona y atuendo) pasa a ser el conjunto de su mascota", () => {
    const l = lookOf({ species: "castor", name: "Timber", accessory: "toque", face: "glasses", outfit: "hoodie" } as never);
    expect(l.species).toBe("castor");
    expect(l.name).toBe("Timber");
    expect(wearOf(l).sort()).toEqual(["glasses", "hoodie", "toque"]);
    expect(wearOf(lookOf({ accessory: "none" } as never))).toEqual([]);
  });
  it("cada mascota guarda su conjunto", () => {
    const l = lookOf({ species: "gato", sets: { zorro: ["cap"], gato: ["crown"] } });
    expect(wearOf(l)).toEqual(["crown"]);
    expect(wearOf({ ...l, species: "zorro" })).toEqual(["cap"]);
  });
});
