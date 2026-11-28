import type { GrammarGroup, Tense } from "./types";

/** Bloques de la lista de gramática, en orden. */
export const GROUP_INFO: { id: GrammarGroup; title: string; text: string }[] = [
  { id: "tiempos", title: "Tiempos verbales", text: "Cuándo usar cada tiempo, cómo se forma y qué palabras lo delatan." },
  { id: "estructuras", title: "Estructuras clave", text: "Artículos, cuantificadores, comparativos, cláusulas, condicionales y más." },
  { id: "escritura", title: "Escritura (IELTS Writing)", text: "Conectores, lenguaje prudente, describir gráficas, pasiva académica y estilo formal." },
  { id: "conversacion", title: "Conversación (IELTS Speaking)", text: "Preguntas, opiniones, hipótesis y énfasis para sonar natural y con rango." },
];

/** Las 12 primeras unidades de tenses.json son tiempos verbales; el resto, estructuras (si la unidad no dice su grupo). */
export const groupOf = (t: Pick<Tense, "group" | "order">): GrammarGroup => t.group ?? (t.order <= 12 ? "tiempos" : "estructuras");
