import "server-only";
import { CATALOG, ITEMS } from "./content";

/**
 * Diccionario local (sin servicios externos): términos curados y catálogo de palabras.
 * Busca la forma exacta y algunas formas flexionadas simples (plural, -ed, -ing, 3.ª persona).
 */
type Entry = { term: string; es: string; def?: string; level: string; id: string };
let index: Map<string, Entry> | null = null;
function build() {
  const m = new Map<string, Entry>();
  for (const c of CATALOG) if (c.status === "complete" && !c.dupOf && c.es) m.set(c.term.toLowerCase(), { term: c.term, es: c.es, def: c.def, level: c.level, id: c.id });
  for (const i of ITEMS) m.set(i.term.toLowerCase(), { term: i.term, es: i.es, def: i.def, level: i.level, id: i.id });
  return m;
}

export function lookup(raw: string): Entry | null {
  index ??= build();
  const w = raw.toLowerCase().replace(/[^a-z' -]/g, "").trim();
  if (!w) return null;
  const tries = [w, w.replace(/'s$/, ""), w.replace(/ies$/, "y"), w.replace(/es$/, ""), w.replace(/s$/, ""), w.replace(/ied$/, "y"), w.replace(/ed$/, ""), w.replace(/ed$/, "e"), w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w.replace(/([a-z])\1ing$/, "$1"), w.replace(/([a-z])\1ed$/, "$1")];
  for (const t of tries) {
    const e = index.get(t);
    if (e) return e;
  }
  return null;
}

/** Palabras del texto que existen en el diccionario, del nivel indicado o superior (para preguntas de vocabulario). */
export function vocabIn(paragraphs: string[], minLevel: number, max = 12): Entry[] {
  const lv = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const w of paragraphs.join(" ").split(/[^A-Za-z']+/)) {
    if (w.length < 4) continue;
    const e = lookup(w);
    if (!e || seen.has(e.term) || lv.indexOf(e.level) < minLevel || e.es.length > 60) continue;
    seen.add(e.term);
    out.push(e);
    if (out.length >= max) break;
  }
  return out;
}
