import { describe, expect, it } from "vitest";
import { STUDY_GEMS, studyGemsFor } from "@/lib/economy-rules";
import { CHESTS, FREEZE, PET_PRICE, PRICE, petPrice } from "@/lib/wardrobe";
import { GEMS } from "@/lib/challenges";

/** Simulación de un día: XP de una sesión según respuestas (10 limpia, 15 nueva limpia, 2 fallo) + bono de retos. */
function dayGems(sessions: number, answersPerSession: number, accuracy = 0.85) {
  const correct = Math.round(answersPerSession * accuracy);
  const xpSession = correct * 10 + (answersPerSession - correct) * 2 + 20; // +20 de la lección
  const dayXp = xpSession * sessions + 3 * 20; // + 3 retos diarios (20 XP c/u)
  return studyGemsFor(dayXp) + GEMS.dailyGoal + 3 * GEMS.dailyMission;
}

describe("Economía", () => {
  it("las gemas de estudio se calculan sobre el día y tienen tope", () => {
    expect(studyGemsFor(0)).toBe(0);
    expect(studyGemsFor(119)).toBe(7);
    expect(studyGemsFor(10_000)).toBe(STUDY_GEMS.dailyCap);
  });
  it("una sesión grande ya no da ~300 gemas", () => {
    expect(dayGems(1, 100)).toBeLessThanOrEqual(STUDY_GEMS.dailyCap + 25);
  });
  // Semana normal: 7 días de dos sesiones cortas + los tres retos semanales.
  const week = () => 7 * dayGems(2, 24) + 3 * GEMS.weekly;
  it("un día normal da unas 45 gemas y una semana, menos de 420", () => {
    const d = dayGems(2, 24);
    expect(d).toBeGreaterThanOrEqual(35);
    expect(d).toBeLessThanOrEqual(STUDY_GEMS.dailyCap + GEMS.dailyGoal + 3 * GEMS.dailyMission);
    expect(week()).toBeLessThanOrEqual(420);
  });
  it("cofre aurora: como mucho dos por semana; una pieza rara, unos 3–5 días", () => {
    const aurora = CHESTS.find((c) => c.id === "aurora")!.price;
    expect(week() / aurora).toBeGreaterThanOrEqual(1);
    expect(week() / aurora).toBeLessThan(3);
    const days = PRICE[1] / dayGems(2, 24);
    expect(days).toBeGreaterThanOrEqual(3);
    expect(days).toBeLessThanOrEqual(5.5);
  });
  it("mascotas: la rara tarda más de una semana y la legendaria más de un mes", () => {
    expect(PET_PRICE[1] / week()).toBeGreaterThan(1);
    expect(PET_PRICE[3] / week()).toBeGreaterThan(4.3);
    expect(PET_PRICE[3] / week()).toBeLessThan(7); // difícil, no imposible
    expect(petPrice("ajolote")).toBe(PET_PRICE[3]);
  });
  it("precios coherentes", () => {
    expect(PRICE).toEqual([90, 170, 300, 480]);
    expect(CHESTS.map((c) => c.price)).toEqual([70, 110, 170]);
    expect(FREEZE).toEqual({ price: 120, max: 3 });
  });
});
