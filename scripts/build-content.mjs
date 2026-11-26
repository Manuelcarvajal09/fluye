// Une content/**/*.json en src/generated/*.json para que la app los importe.
// Corre automáticamente antes de `dev` y `build`. Falla si el contenido no es válido.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
execFileSync(process.execPath, [join(root, "scripts", "validate-content.mjs")], { stdio: "inherit" });

const json = (p, fallback = []) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback);
const readDir = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .flatMap((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
    : [];
const c = (...p) => join(root, "content", ...p);

// Debe coincidir con TOPIC_AREAS de src/lib/areas.ts.
const TOPIC_AREAS = {
  daily: ["conversacion"], work: ["reuniones"], tech: ["software"], travel: ["viajes"], canada: ["canada"],
  interview: ["entrevistas"], social: ["relaciones"], informal: ["conversacion", "series"], money: ["bancos"],
  health: ["salud"], feelings: ["relaciones"], study: ["ciencia"], home: ["vivienda"], food: ["restaurantes"],
};

const tvList = json(c("lists", "tv-phrasal.json"));
const tvRank = new Map(tvList.map((id, i) => [id, i + 1]));

const extra = json(c("lists", "area-extra.json"), {});
const extraFor = (it) =>
  it.type !== "phrasal"
    ? []
    : Object.entries(extra)
        .filter(([k, terms]) => !k.startsWith("_") && terms.some((t) => t === it.term || t.startsWith(it.term + " ") || it.term.startsWith(t + " ")))
        .map(([k]) => k);

const items = readDir(c("items")).map((it) => {
  const areas = new Set(it.areas?.length ? it.areas : TOPIC_AREAS[it.topic] ?? ["conversacion"]);
  for (const a of extraFor(it)) areas.add(a);
  const tags = new Set(it.tags ?? []);
  if (tvRank.has(it.id)) {
    tags.add("tv");
    areas.add("series");
  }
  if (tags.has("tv")) areas.add("series");
  if (it.topic === "canada") tags.add("ca");
  const out = { ...it, areas: [...areas], tags: [...tags] };
  if (tvRank.has(it.id)) out.tvRank = tvRank.get(it.id);
  return out;
});

const out = join(root, "src", "generated");
mkdirSync(out, { recursive: true });
const write = (name, data) => writeFileSync(join(out, name), JSON.stringify(data));

write("items.json", items);
// Términos de 2–3 palabras → significado (para explicar confusiones en la retroalimentación oral; se carga bajo demanda).
write("terms-es.json", Object.fromEntries(items.filter((i) => /^[a-z]+( [a-z]+){1,2}$/.test(i.term)).map((i) => [i.term, i.es.split(";")[0].trim()])));
write("lessons.json", readDir(c("lessons")).sort((a, b) => a.order - b.order));
write("sounds.json", json(c("sounds", "sounds.json")).sort((a, b) => a.order - b.order));
write("prosody.json", json(c("sounds", "prosody.json")).sort((a, b) => a.order - b.order));
write("roleplays.json", readDir(c("roleplays")));
write("errors.json", json(c("errors.json")));
write("placement.json", json(c("placement", "test.json")));
const scenes = json(c("scenes", "scenes.json"));
// Cada ruta usa la escena "scene-<ruta>" si existe (la ilustración se puede añadir sin tocar la ruta).
const sceneIds = new Set(scenes.map((s) => s.id));
write("routes.json", readDir(c("routes")).map((r) => ({ ...r, scene: r.scene && sceneIds.has(r.scene) ? r.scene : sceneIds.has("scene-" + r.id) ? "scene-" + r.id : null })).sort((a, b) => a.id.localeCompare(b.id)));
write("scenes.json", scenes);
write("music.json", json(c("music", "exercises.json")));
// Inglés de series: microescenas originales, de B1 a C2.
const LV = ["A1", "A2", "B1", "B2", "C1", "C2"];
write("series.json", (existsSync(c("series")) ? readDir(c("series")) : []).sort((a, b) => LV.indexOf(a.level) - LV.indexOf(b.level) || a.id.localeCompare(b.id)));
write("tenses.json", json(c("grammar", "tenses.json")).sort((a, b) => a.order - b.order));

const missingTv = tvList.filter((id) => !items.some((i) => i.id === id));
if (missingTv.length) console.warn(`aviso: ${missingTv.length} ids de tv-phrasal.json no existen: ${missingTv.slice(0, 5).join(", ")}`);
console.log(`contenido: ${items.length} ítems (${items.filter((i) => i.tags.includes("tv")).length} de series) empaquetados`);
