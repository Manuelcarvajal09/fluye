import { describe, expect, it } from "vitest";
import { allowsNewItem, lessonMin } from "@/lib/levels";

const B1 = 2, A2 = 1;
describe("Franja de nivel", () => {
  it("un B1 no recibe expresiones A1 ni A2", () => {
    expect(allowsNewItem(B1, { level: "A1", type: "vocab" })).toBe(false);
    expect(allowsNewItem(B1, { level: "A2", type: "phrasal", tags: ["tv"] })).toBe(false);
    expect(allowsNewItem(B1, { level: "B1", type: "phrasal" })).toBe(true);
    expect(allowsNewItem(B1, { level: "B2", type: "idiom" })).toBe(true);
  });
  it("el habla real entra aunque esté catalogada abajo", () => {
    expect(allowsNewItem(B1, { level: "A2", type: "contraction" })).toBe(true);
    expect(allowsNewItem(B1, { level: "A2", type: "phrase", tags: ["slang"] })).toBe(true);
  });
  it("un A2 repasa lo básico de A1 pero no salta a B1", () => {
    expect(allowsNewItem(A2, { level: "A1", type: "phrase" })).toBe(true);
    expect(allowsNewItem(A2, { level: "A2", type: "vocab" })).toBe(true);
    expect(allowsNewItem(A2, { level: "B1", type: "vocab" })).toBe(false);
  });
  it("las lecciones del día empiezan en B1 para un B1", () => {
    expect(lessonMin(B1)).toBe(2);
    expect(lessonMin(A2)).toBe(0);
  });
});
