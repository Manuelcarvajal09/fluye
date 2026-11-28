import { describe, expect, it } from "vitest";
import { buildIslands, nextStop, SECTION_SIZE, trophyGems, type MapInput } from "@/lib/map-rules";

const lessons = Array.from({ length: 8 }, (_, i) => ({ id: `les-a2-${i}`, level: "A2", order: 8 - i, title: `L${i}`, title_es: `Lección ${i}` }));
const base: MapInput = {
  lessons: [...lessons, { id: "les-b1-0", level: "B1", order: 1, title: "B", title_es: "B1" }],
  tracks: [
    { id: "casa-a", level: "A2", band: "A1-A2", lessonId: "ls-casa-a", routeId: "casa", routeTitle: "En casa", minutes: 12, interview: false },
    { id: "entrevista-ti-b", level: "B1", band: "B1-B2", lessonId: "ls-entrevista-ti-b", routeId: "entrevista-ti", routeTitle: "Soporte TI", minutes: 18, interview: true },
  ],
  roleplays: [{ id: "rp-x", level: "A2", title_es: "Pedir café" }],
  readings: [{ id: "rd-1", level: "A2", title: "Snow", title_es: "La nieve", minutes: 4 }],
  done: new Set(),
  readDone: new Set(),
  claimed: new Set(),
  words: { A2: { known: 3, total: 10 } },
};

describe("Mapa «Tu viaje»", () => {
  it("hay una isla por nivel, de A1 a C2, aunque un nivel no tenga contenido", () => {
    const islands = buildIslands(base);
    expect(islands.map((i) => i.level)).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
    expect(islands.find((i) => i.level === "C2")!.total).toBe(0);
    expect(islands.find((i) => i.level === "C2")!.trophy.ready).toBe(false);
  });
  it("secciones de hasta SECTION_SIZE paradas, intercalando tipos y con las lecciones en su orden", () => {
    const a2 = buildIslands(base)[1];
    expect(a2.total).toBe(11);
    expect(a2.sections).toHaveLength(Math.ceil(11 / SECTION_SIZE));
    expect(a2.sections[0].stops.slice(0, 4).map((s) => s.kind)).toEqual(["lesson", "mission", "roleplay", "reading"]);
    expect(a2.sections[0].stops[0].id).toBe("les-a2-7"); // order 1
    expect(a2.sections[0].stops[0].href).toBe("/sesion?leccion=les-a2-7");
    expect(a2.words).toEqual({ known: 3, total: 10 });
  });
  it("las entrevistas cuentan como su propio tipo y enlazan a la misión", () => {
    const b1 = buildIslands(base)[2];
    const iv = b1.sections[0].stops.find((s) => s.kind === "interview")!;
    expect(iv.href).toBe("/sesion?mision=entrevista-ti-b&min=20");
  });
  it("el cofre se habilita al terminar la sección y no se repite si ya se cobró", () => {
    const first = buildIslands(base)[1].sections[0];
    const done = new Set(first.stops.filter((s) => s.kind !== "reading").map((s) => (s.kind === "mission" ? "ls-casa-a" : s.id)));
    const readDone = new Set(["rd-1"]);
    const s = buildIslands({ ...base, done, readDone })[1].sections[0];
    expect(s.done).toBe(s.total);
    expect(s.chest.ready).toBe(true);
    expect(s.chest.claimed).toBe(false);
    const again = buildIslands({ ...base, done, readDone, claimed: new Set([s.chest.key]) })[1].sections[0];
    expect(again.chest.claimed).toBe(true);
  });
  it("trofeo al completar toda la isla; las gemas suben con el nivel", () => {
    const all = new Set([...lessons.map((l) => l.id), "ls-casa-a", "rp-x"]);
    const a2 = buildIslands({ ...base, done: all, readDone: new Set(["rd-1"]) })[1];
    expect(a2.trophy.ready).toBe(true);
    expect(a2.trophy.gems).toBe(trophyGems("A2"));
    expect(trophyGems("C1")).toBeGreaterThan(trophyGems("A1"));
  });
  it("«sigue aquí» empieza por tu nivel y salta a la siguiente isla con algo pendiente", () => {
    const islands = buildIslands(base);
    expect(nextStop(islands, "B1")!.island).toBe("B1");
    const allB1 = buildIslands({ ...base, done: new Set(["les-b1-0", "ls-entrevista-ti-b"]) });
    expect(nextStop(allB1, "B1")!.island).toBe("A2");
  });
});
