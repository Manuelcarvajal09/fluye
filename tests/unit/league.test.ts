import { describe, expect, it } from "vitest";
import { addWeeks, decide, leagueWeek, nextTier, weekEnd } from "@/lib/league-rules";

const g = (...xp: number[]) => xp.map((x, i) => ({ userId: `u${i}`, xp: x }));

describe("Ligas", () => {
  it("la semana empieza el lunes en hora de Edmonton", () => {
    expect(leagueWeek(new Date("2026-11-26T18:00:00Z"))).toBe("2026-11-23"); // jueves
    expect(leagueWeek(new Date("2026-11-30T05:00:00Z"))).toBe("2026-11-23"); // domingo 22:00 en Edmonton
    expect(leagueWeek(new Date("2026-11-30T08:00:00Z"))).toBe("2026-11-30"); // lunes 01:00 en Edmonton
    expect(addWeeks("2026-11-23", 1)).toBe("2026-11-30");
    expect(weekEnd("2026-11-23")).toBe("2026-11-29");
  });
  it("grupo grande: sube el 30 % de arriba y baja el 20 % de abajo", () => {
    const r = decide(2, g(900, 800, 700, 600, 500, 400, 300, 200, 100, 50));
    expect([...r.values()].filter((x) => x.result === "up")).toHaveLength(3);
    expect([...r.values()].filter((x) => x.result === "down")).toHaveLength(2);
    expect(r.get("u0")).toEqual({ result: "up", rank: 1 });
    expect(r.get("u9")?.result).toBe("down");
  });
  it("grupo pequeño: por umbral del nivel; con 0 XP se baja", () => {
    const r = decide(1, g(300, 100, 20, 0));
    expect(r.get("u0")?.result).toBe("up"); // ≥ 250
    expect(r.get("u1")?.result).toBe("stay");
    expect(r.get("u2")?.result).toBe("down"); // < 50
    expect(r.get("u3")?.result).toBe("down");
  });
  it("en Semilla no se baja y en Cumbre no se sube", () => {
    expect(decide(0, g(0)).get("u0")?.result).toBe("stay");
    expect(decide(7, g(5000)).get("u0")?.result).toBe("stay");
    expect(nextTier(7, "up")).toBe(7);
    expect(nextTier(0, "down")).toBe(0);
  });
});
