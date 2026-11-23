// Convierte content/catalog/lemmas.jsonl en src/generated/catalog.json (formato ligero de ítems de la app).
// - No duplica: si un lema ya existe como ítem curado de una sola palabra, la entrada apunta a ese ítem (dupOf).
// - Marca en corchetes la forma usada en cada ejemplo (lema o inflexión) para los ejercicios.
// - Conserva fuente y autor de cada ejemplo de Tatoeba (CC BY 2.0 FR exige atribución).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "content", "catalog", "lemmas.jsonl");
const out = join(root, "src", "generated", "catalog.json");
if (!existsSync(src)) {
  writeFileSync(out, "[]");
  console.log("catálogo: no hay content/catalog/lemmas.jsonl (se omite)");
  process.exit(0);
}
const items = JSON.parse(readFileSync(join(root, "src", "generated", "items.json"), "utf8"));
const curated = new Map(items.filter((i) => !i.term.includes(" ")).map((i) => [i.term.toLowerCase(), i.id]));
const authors = new Map();
const tsv = join(root, "content", "catalog", "tatoeba-attribution.tsv");
if (existsSync(tsv))
  for (const line of readFileSync(tsv, "utf8").split("\n").slice(1)) {
    const [s, , ea, , sa] = line.split("\t");
    if (s) authors.set(s, `${ea}/${sa}`);
  }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bracket = (en, forms) => {
  for (const f of forms.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b(${esc(f)})\\b`, "i");
    if (re.test(en)) return en.replace(re, "[$1]");
  }
  return null;
};
const BAND_FREQ = { "1k": 5, "2k": 5, "3k": 4, "4k": 4, "5k": 3, "6k": 3, "7k": 2, "8k": 2, "9k": 2, "10k": 1, "10k+": 1 };
const rows = readFileSync(src, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
let dups = 0;
const outRows = rows.map((r) => {
  const forms = [r.lemma, ...(r.forms ?? [])];
  const ex = (r.ex ?? [])
    .map((e) => ({ en: bracket(e.en, forms), es: e.es, src: e.src, by: authors.get(e.src) }))
    .filter((e) => e.en);
  const dupOf = curated.get(r.lemma.toLowerCase());
  if (dupOf) dups++;
  return {
    id: r.id,
    type: "vocab",
    term: r.lemma,
    pos: r.pos,
    ipa: r.ipa_us ?? r.ipa ?? undefined,
    ipaCa: r.ipa_ca ?? undefined,
    level: r.level_est,
    topic: "daily",
    freq: BAND_FREQ[r.band] ?? 1,
    es: r.es ?? "",
    def: (r.sense_en ?? "").slice(0, 140),
    ex,
    areas: ["conversacion"],
    tags: ["catalog"],
    band: r.band,
    rank: r.rank,
    register: r.register && r.register !== "neutral" ? r.register : undefined,
    variants: r.variants,
    status: r.es && ex.length ? "complete" : "pending",
    review: r.review ?? "auto",
    dupOf,
  };
});
writeFileSync(out, JSON.stringify(outRows));
const complete = outRows.filter((r) => r.status === "complete").length;
console.log(`catálogo: ${outRows.length} entradas · ${new Set(outRows.map((r) => r.term)).size} lemas · ${complete} completas · ${dups} enlazadas a ítems existentes`);
