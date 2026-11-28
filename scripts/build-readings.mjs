// Lecturas graduadas (content/readings/*.json) → src/generated/readings.json, con validación.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "content", "readings");
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const errs = [];
const err = (id, m) => errs.push(`${id}: ${m}`);
const out = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
  const r = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const id = r.id ?? f;
  if (`${r.id}.json` !== f) err(id, "el id no coincide con el archivo");
  if (!LEVELS.includes(r.level)) err(id, "nivel inválido");
  for (const k of ["title", "title_es", "intro_es"]) if (!r[k]) err(id, `falta ${k}`);
  if (!Array.isArray(r.paragraphs) || r.paragraphs.length < 3) err(id, "párrafos insuficientes");
  const text = (r.paragraphs ?? []).join(" ").toLowerCase();
  for (const g of r.glossary ?? []) {
    if (!text.includes(g.term.toLowerCase())) err(id, `el glosario "${g.term}" no aparece en el texto`);
    if (!g.es || g.es.length > 90) err(id, `es inválido en "${g.term}"`);
  }
  for (const q of [r.main_idea, ...(r.questions ?? [])]) if (!q || q.options?.length !== 3 || q.answer < 0 || q.answer > 2) err(id, "pregunta inválida");
  out.push({ ...r, words: text.split(/\s+/).length });
}
if (errs.length) {
  console.error(errs.join("\n"));
  process.exit(1);
}
mkdirSync(join(root, "src", "generated"), { recursive: true });
writeFileSync(join(root, "src", "generated", "readings.json"), JSON.stringify(out));
console.log(`lecturas: ${out.length} (club: ${out.filter((r) => r.club).length})`);
