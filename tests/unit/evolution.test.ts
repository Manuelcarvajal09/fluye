import { describe, expect, it } from "vitest";
import { attemptXp, classifyError, finalGrade } from "@/lib/grading";
import { inRange, seasonFor } from "@/lib/seasons";
import { rankOf, weekStart, weeklyChallenges } from "@/lib/challenges";
import { goalOf, maskExplicit } from "@/lib/realtalk";
import { lookOf, ownsLook } from "@/lib/look";

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

describe("tienda", () => {
  it("lo de tienda solo se puede usar si se compró", () => {
    const crown = lookOf({ accessory: "crown" });
    expect(ownsLook(crown, new Set())).toBe(false);
    expect(ownsLook(crown, new Set(["acc-crown"]))).toBe(true);
    expect(ownsLook(lookOf({ accessory: "toque" }), new Set())).toBe(true);
  });
});
