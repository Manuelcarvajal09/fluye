import { describe, expect, it } from "vitest";
import { clipKey as browserKey, clipText } from "@/lib/audio/key";
import { resolveVoice } from "@/lib/audio/voices";
import { correctSay, doneSay, greetingSay, wrongSay } from "@/lib/motivation";
import { ACHIEVEMENTS, unlockedCount } from "@/lib/achievements";
import { lookOf } from "@/lib/look";
import { clipKey as nodeKey } from "../../scripts/audio/lib.mjs";

describe("audio HD", () => {
  it("la clave del navegador coincide con la del generador (si no, el audio nunca se encuentra)", async () => {
    for (const t of ["give up", "I'm [gonna] go.", "  Could   I get a flat white?  ", "résumé", "24/7"]) {
      expect(await browserKey("af_heart", t)).toBe(nodeKey("af_heart", t));
    }
    expect(clipText("She [gave up]  sugar.")).toBe("She gave up sugar.");
  });
  it("asigna voz por personaje y al interlocutor del otro género", () => {
    expect(resolveVoice({ main: "af_heart", speaker: "Maya" })).toBe("af_heart");
    expect(resolveVoice({ main: "af_heart", speaker: "Leo" })).toBe("am_adam");
    expect(resolveVoice({ main: "af_heart", partner: true })).toBe("am_adam");
    expect(resolveVoice({ main: "am_adam", partner: true })).toBe("af_heart");
    expect(resolveVoice({ main: "af_heart" })).toBe("af_heart");
  });
});

describe("motivación", () => {
  it("celebra más cuanto más larga la racha de aciertos", () => {
    expect(correctSay(1, "Ana", 0).mood).toBe("happy");
    expect(correctSay(5, "Ana", 0).mood).toBe("cheer");
    expect(correctSay(12, "Ana", 1).text).toContain("12");
  });
  it("anima, no regaña, cuando se falla", () => {
    for (let i = 0; i < 8; i++) {
      const s = wrongSay(i % 5, "Ana", i);
      expect(s.mood).toBe("oops");
      expect(s.text).not.toMatch(/mal|error grave|fallaste/i);
    }
  });
  it("el cierre depende de la precisión y el saludo de la racha", () => {
    expect(doneSay(0.95, "Ana", 0).mood).toBe("cheer");
    expect(doneSay(0.1, "Ana", 0).text.length).toBeGreaterThan(10);
    const base = { name: "Ana", hour: 10, streak: 6, todayXp: 0, goal: 100, due: 3, doneYesterday: true, sessionsToday: 0, hasStarted: true };
    expect(greetingSay(base, 0).text).toContain("6");
    expect(greetingSay({ ...base, todayXp: 120 }, 0).mood).toBe("cheer");
  });
});

describe("logros y aspecto", () => {
  const zero = { bestStreak: 0, reviews: 0, learned: 0, mastered: 0, roleplays: 0, lessons: 0, recordings: 0, level: 1, placement: 0 };
  it("se desbloquean con los datos reales", () => {
    expect(unlockedCount(zero)).toBe(0);
    expect(unlockedCount({ ...zero, reviews: 120, bestStreak: 7, placement: 1 })).toBe(ACHIEVEMENTS.filter((a) => ["first", "reviews100", "streak3", "streak7", "placement"].includes(a.id)).length);
  });
  it("normaliza el aspecto y descarta valores inválidos", () => {
    const l = lookOf({ species: "zorro", color: "no-es-color", name: "  ", accent: "inexistente" as never });
    expect(l.species).toBe("zorro");
    expect(l.name).toBe("Rufo");
    expect(l.color).toBe("#f0832f");
    expect(l.accent).toBe("esmeralda");
  });
});
