import { describe, expect, it } from "vitest";
import { STUDY_GEMS, studyGemsFor } from "@/lib/economy-rules";
import { CHESTS, FREEZE, PRICE, petPrice } from "@/lib/wardrobe";
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
    expect(studyGemsFor(119)).toBe(9);
    expect(studyGemsFor(10_000)).toBe(STUDY_GEMS.dailyCap);
  });
  it("una sesión grande ya no da ~300 gemas", () => {
    expect(dayGems(1, 100)).toBeLessThanOrEqual(STUDY_GEMS.dailyCap + 25);
  });
  it("con estudio normal, una pieza rara cuesta 2–3 días", () => {
    const normal = dayGems(2, 40); // dos sesiones de ~10 min
    const days = PRICE[1] / normal;
    expect(days).toBeGreaterThanOrEqual(1.5);
    expect(days).toBeLessThanOrEqual(3.5);
  });
  it("precios nuevos coherentes", () => {
    expect(PRICE).toEqual([60, 110, 180, 280]);
    expect(petPrice("ajolote")).toBe(320);
    expect(CHESTS.map((c) => c.price)).toEqual([34, 48, 58]);
    expect(FREEZE).toEqual({ price: 80, max: 3 });
  });
});
