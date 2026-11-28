import { describe, expect, it } from "vitest";
import { addDays, dayDiff, goalXp, levelFromXp, localDay, missionsFor, nextStreak, visibleStreak, xpForLevel } from "@/lib/game";
import { checkTyped, normalize, wordMatch } from "@/lib/answer";
import { newCard, review, previewLabels, fmtInterval } from "@/lib/srs";
import { pitchContour, endingTrend } from "@/lib/audio/pitch";
import { estimateLevel, type DiagQ } from "@/lib/diagnostic";
import { bracketed, plain } from "@/lib/types";

describe("FSRS", () => {
  it("programa una tarjeta nueva y la manda lejos al acertar varias veces", async () => {
    const t0 = new Date("2026-01-01T12:00:00Z");
    let c = await newCard(t0);
    expect(c.dueAt).toBe(t0.toISOString());
    let r = await review(c, 3, t0);
    expect(r.reps).toBe(1);
    let now = new Date(r.dueAt);
    expect(now.getTime()).toBeGreaterThan(t0.getTime());
    for (let k = 0; k < 4; k++) {
      c = r;
      r = await review(c, 3, now);
      now = new Date(r.dueAt);
    }
    expect(r.state).toBe(2);
    expect(r.stability).toBeGreaterThan(10);
    expect(now.getTime() - t0.getTime()).toBeGreaterThan(20 * 86_400_000);
  });

  it("'Otra vez' reprograma el mismo día y cuenta un lapso en repaso", async () => {
    const t0 = new Date("2026-01-01T12:00:00Z");
    let r = await review(await newCard(t0), 3, t0);
    let now = new Date(r.dueAt);
    r = await review(r, 3, now);
    now = new Date(r.dueAt);
    const failed = await review(r, 1, now);
    expect(new Date(failed.dueAt).getTime() - now.getTime()).toBeLessThan(24 * 60 * 60_000);
    expect(failed.lapses).toBe(1);
  });

  it("sobrevive a la ida y vuelta por JSON (como en la base de datos)", async () => {
    const t0 = new Date("2026-02-01T00:00:00Z");
    const stored = JSON.parse(JSON.stringify(await review(await newCard(t0), 4, t0)));
    const again = await review(stored, 3, new Date(stored.dueAt));
    expect(again.reps).toBe(2);
  });

  it("los intervalos de vista previa crecen de Again a Easy", async () => {
    const t0 = new Date("2026-01-01T00:00:00Z");
    const r = await review(await newCard(t0), 3, t0);
    const labels = await previewLabels(r, new Date(r.dueAt));
    expect(labels).toHaveLength(4);
    expect(fmtInterval(10 * 60_000)).toBe("10 min");
    expect(fmtInterval(3 * 86_400_000)).toBe("3 d");
  });
});

describe("racha y XP", () => {
  it("suma racha si la meta anterior fue ayer, reinicia si no", () => {
    expect(nextStreak(4, "2026-03-09", "2026-03-10")).toBe(5);
    expect(nextStreak(4, "2026-03-10", "2026-03-10")).toBe(4);
    expect(nextStreak(4, "2026-03-07", "2026-03-10")).toBe(1);
    expect(nextStreak(0, null, "2026-03-10")).toBe(1);
  });
  it("la racha visible se pierde tras un día sin meta", () => {
    expect(visibleStreak(5, "2026-03-09", "2026-03-10")).toBe(5);
    expect(visibleStreak(5, "2026-03-08", "2026-03-10")).toBe(0);
  });
  it("niveles", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(299)).toEqual({ level: 2, into: 199, span: 200 });
    expect(goalXp(10)).toBe(100);
  });
  it("misiones deterministas y sin repetir", () => {
    const a = missionsFor("2026-05-01", 10);
    expect(a.map((m) => m.id)).toEqual(missionsFor("2026-05-01", 10).map((m) => m.id));
    expect(new Set(a.map((m) => m.id)).size).toBe(3);
    expect(a[0].id).toBe("goal");
  });
  it("días locales", () => {
    expect(localDay("America/Mexico_City", new Date("2026-01-02T04:00:00Z"))).toBe("2026-01-01");
    expect(localDay("America/Toronto", new Date("2026-01-02T04:00:00Z"))).toBe("2026-01-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(dayDiff("2026-03-01", "2026-03-08")).toBe(7);
  });
});

describe("respuestas", () => {
  it("tolera mayúsculas, puntuación y un error de dedo", () => {
    expect(checkTyped("Gave up!", "gave up")).toBe("exact");
    expect(checkTyped("gave upp", "gave up")).toBe("close");
    expect(checkTyped("give in", "gave up")).toBe("wrong");
    expect(checkTyped("", "gave up")).toBe("wrong");
    expect(normalize("résumé")).toBe("resume");
  });
  it("coincidencia de palabras del reconocedor con contracciones", () => {
    const m = wordMatch("I'm gonna [figure it out].", "I am going to figure it out");
    expect(m.ratio).toBe(1);
    expect(wordMatch("Let's call it a day", "lets call it").ratio).toBeLessThan(1);
  });
  it("corchetes", () => {
    expect(bracketed("She [gave up] sugar.")).toBe("gave up");
    expect(plain("She [gave up] sugar.")).toBe("She gave up sugar.");
  });
});

describe("entonación", () => {
  it("detecta tono subiendo en una señal sintética", () => {
    const sr = 16000;
    const s = new Float32Array(sr);
    let phase = 0;
    for (let i = 0; i < s.length; i++) {
      const f = 120 + (i / s.length) * 120; // 120 → 240 Hz
      phase += (2 * Math.PI * f) / sr;
      s[i] = 0.5 * Math.sin(phase);
    }
    const pts = pitchContour(s, sr);
    const voiced = pts.filter((p) => p.hz);
    expect(voiced.length).toBeGreaterThan(20);
    expect(Math.abs((voiced[2].hz ?? 0) - 125)).toBeLessThan(15);
    expect(endingTrend(pts)).toBe("up");
  });
});

describe("diagnóstico", () => {
  const q = (level: DiagQ["level"]): DiagQ => ({ level, term: "x", example: "[x]", options: ["a", "b", "c", "d"], answer: 0 });
  const qs = (["A1", "A2", "B1", "B2", "C1"] as const).flatMap((l) => [q(l), q(l), q(l), q(l)]);
  it("se detiene en el primer nivel fallado", () => {
    const ans = qs.map((x) => (x.level === "A1" || x.level === "A2" || x.level === "B2" ? 0 : 1));
    expect(estimateLevel(qs, ans)).toBe("A2");
  });
  it("todo bien = C1, nada = A1", () => {
    expect(estimateLevel(qs, qs.map(() => 0))).toBe("C1");
    expect(estimateLevel(qs, qs.map(() => null))).toBe("A1");
  });
});

import { evaluateTurn, evaluateFix, contains } from "@/lib/evaluate";
import { corrected, estimate, estimateFromTally, grade } from "@/lib/placement";

describe("evaluación de roleplays", () => {
  const turn = {
    npc: "What can I get you?",
    npc_es: "",
    task_es: "",
    expect: [["flat white"], ["medium"], ["to go", "takeout"]],
    model: ["Could I get a medium flat white to go, please?"],
    tips: [{ wrong: String.raw`\bfor (to )?carry\b`, fix: "to go", why_es: "x" }],
  };
  it("acepta variantes y detecta lo que falta", () => {
    expect(evaluateTurn("Can I have a medium flat white to go?", turn, []).status).toBe("great");
    expect(evaluateTurn("A medium flat white for carry please", turn, []).status).toBe("partial");
    expect(evaluateTurn("A medium flat white for carry please", turn, []).tips[0].fix).toBe("to go");
    expect(evaluateTurn("hello", turn, []).status).toBe("miss");
    expect(contains("I'm gonna check it", "going to check")).toBe(true);
  });
  it("corrige la frase", () => {
    const e = { id: "err-x", category: "verbos", level: "A2" as const, wrong: "I have 30 years.", right: ["I'm 30.", "I'm 30 years old."], pattern: String.raw`\bi have \d+ years\b`, why_es: "" };
    expect(evaluateFix("I am 30 years old", e)).toBe("right");
    expect(evaluateFix("I have 30 years", e)).toBe("wrong");
  });
});

describe("test de nivel", () => {
  it("no sube de nivel si los inferiores están flojos", () => {
    expect(estimateFromTally({ A1: { right: 4, total: 4 }, A2: { right: 4, total: 5 }, B1: { right: 4, total: 6 }, B2: { right: 1, total: 6 } })).toBe("B1");
    expect(estimateFromTally({ A1: { right: 1, total: 4 }, C1: { right: 4, total: 4 } })).toBe("A1");
  });
  it("califica y cuenta por sección", () => {
    const qs = [
      { id: "a", section: "grammar" as const, level: "A1" as const, prompt: "", options: ["1", "2", "3", "4"], answer: 0 },
      { id: "b", section: "vocab" as const, level: "A1" as const, prompt: "", options: ["1", "2", "3", "4"], answer: 2 },
    ];
    const r = grade(qs, { a: 0, b: null });
    expect(r.score).toBe(1);
    expect(r.bySection.vocab).toEqual({ right: 0, total: 1, skipped: 1 });
  });
  it("descuenta el azar: adivinar no sube de nivel, «No lo sé» no resta y avisa si quedas entre dos niveles", () => {
    // 3 de 8 al azar en B2 (37 %) no alcanza; con 5 de 8 sí.
    const base = { A1: { right: 8, total: 8 }, A2: { right: 8, total: 8 }, B1: { right: 7, total: 8 } };
    expect(estimate({ ...base, B2: { right: 3, total: 8 } }).level).toBe("B1");
    expect(estimate({ ...base, B2: { right: 6, total: 8 } }).level).toBe("B2");
    // 4 aciertos y 4 «No lo sé» puntúan mejor que 4 aciertos y 4 fallos.
    expect(corrected({ right: 4, total: 8, skipped: 4 })!).toBeGreaterThan(corrected({ right: 4, total: 8 })!);
    expect(estimate({ ...base, B2: { right: 5, total: 8, skipped: 3 } }).level).toBe("B2");
    expect(estimate({ ...base, B2: { right: 4, total: 8, skipped: 3 } })).toEqual({ level: "B1", near: "B2" });
  });
});

import { alignWords, gradeSentence } from "@/lib/answer";
describe("alineación de palabras", () => {
  it("detecta sustitución, omisión y palabra añadida", () => {
    const ops = alignWords("I couldn't figure out what happened", "I couldn't find out what happened");
    expect(ops.filter((o) => o.op === "sub")).toEqual([{ op: "sub", want: "figure", got: "find" }]);
    expect(alignWords("she gave up sugar", "she gave sugar").some((o) => o.op === "missing" && o.want === "up")).toBe(true);
    expect(alignWords("she gave up", "she just gave up").some((o) => o.op === "extra" && o.got === "just")).toBe(true);
  });
  it("las contracciones equivalen a la forma completa", () => {
    expect(gradeSentence("I do not know", "I don't know").result).toBe("exact");
    expect(gradeSentence("I'm gonna leave", "I am going to leave").result).toBe("exact");
  });
  it("un error de una letra cuenta como casi; otra palabra no", () => {
    expect(gradeSentence("she gave up sugr last year", "she gave up sugar last year").result).toBe("close");
    expect(gradeSentence("she gave in", "she gave up").result).toBe("wrong");
  });
});
