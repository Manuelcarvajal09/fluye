// Valida content/items y content/lessons. Uso:
//   node scripts/validate-content.mjs            -> todo (incluye duplicados globales y lecciones)
//   node scripts/validate-content.mjs a.json ... -> solo esos archivos de ítems (más ids duplicados contra el resto)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const itemsDir = join(root, "content", "items");
const lessonsDir = join(root, "content", "lessons");

const TYPES = { phrasal: "pv-", collocation: "col-", idiom: "idi-", vocab: "voc-", phrase: "phr-", contraction: "con-" };
const AREAS = ["conversacion","hogar","relaciones","restaurantes","compras","salud","noticias","vivienda","bancos","transporte","viajes","emergencias","canada","series","entrevistas","reuniones","analisis","automatizacion","software","devops","crm","datos","soporte","proyectos","ciencia","biologia"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const TOPICS = ["daily", "work", "tech", "travel", "canada", "interview", "social", "informal", "money", "health", "feelings", "study", "home", "food"];

const errors = [];
const warns = [];
const err = (file, id, msg) => errors.push(`${file} :: ${id ?? "?"} :: ${msg}`);
const warn = (file, id, msg) => warns.push(`${file} :: ${id ?? "?"} :: ${msg}`);

const listJson = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => join(dir, f)) : []);
const load = (file) => {
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(data)) throw new Error("el archivo debe ser un array");
    return data;
  } catch (e) {
    err(file, null, `JSON inválido: ${e.message}`);
    return [];
  }
};
const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const brackets = (s) => (s.match(/\[[^\[\]]+\]/g) ?? []).length;

function checkItem(file, it) {
  const id = it?.id;
  if (!str(id, 80) || !/^[a-z0-9-]+$/.test(id)) return err(file, id, "id inválido (minúsculas, números y guiones)");
  if (!TYPES[it.type]) return err(file, id, `type inválido: ${it.type}`);
  if (!id.startsWith(TYPES[it.type])) err(file, id, `el id debe empezar con ${TYPES[it.type]}`);
  if (!str(it.term, 80)) err(file, id, "term vacío o demasiado largo");
  if (!LEVELS.includes(it.level)) err(file, id, `level inválido: ${it.level}`);
  if (!TOPICS.includes(it.topic)) err(file, id, `topic inválido: ${it.topic}`);
  if (!Number.isInteger(it.freq) || it.freq < 1 || it.freq > 5) err(file, id, "freq debe ser entero 1–5");
  if (!str(it.es, 90)) err(file, id, "es vacío o > 90 caracteres");
  if (!str(it.def, 130)) err(file, id, "def vacío o > 130 caracteres");
  if (it.note !== undefined && !str(it.note, it.type === "contraction" ? 260 : 220)) err(file, id, "note vacío o demasiado largo");
  if ((it.type === "phrasal" || it.type === "vocab" || it.type === "contraction") && !str(it.ipa, 80)) err(file, id, "ipa obligatorio");
  if (it.type === "contraction" && (!str(it.full, 80) || !str(it.note, 260))) err(file, id, "contraction requiere full y note (<= 260)");
  if (it.areas !== undefined && (!Array.isArray(it.areas) || !it.areas.length || it.areas.length > 4 || it.areas.some((a) => !AREAS.includes(a)))) err(file, id, `areas inválidas: ${JSON.stringify(it.areas)}`);
  if (it.tags !== undefined && (!Array.isArray(it.tags) || it.tags.some((t) => !/^[a-z0-9-]+$/.test(t)))) err(file, id, "tags inválidas");
  if (it.ipa !== undefined && !/^\/.+\/$/.test(it.ipa)) err(file, id, "ipa debe ir entre barras /.../");
  if (it.sep !== undefined && typeof it.sep !== "boolean") err(file, id, "sep debe ser booleano");
  if (it.syn !== undefined && (!Array.isArray(it.syn) || it.syn.some((s) => !str(s, 60)))) err(file, id, "syn debe ser array de textos");
  // Ficha ampliada (Fluye 1.0): sentido explícito, registro, transitividad, confusiones, errores típicos y 3–5 ejemplos.
  const rich = it.sense !== undefined;
  if (rich) {
    if (!str(it.sense, 90)) err(file, id, "sense vacío o > 90 caracteres");
    if (!["formal", "neutral", "informal", "vulgar"].includes(it.register)) err(file, id, `register inválido: ${it.register}`);
    if (!["transitive", "intransitive", "both"].includes(it.trans)) err(file, id, `trans inválido: ${it.trans}`);
    if (it.trans !== "intransitive" && it.type === "phrasal" && typeof it.sep !== "boolean") err(file, id, "transitivo: sep obligatorio");
    if (it.confuse !== undefined && (!Array.isArray(it.confuse) || it.confuse.some((x) => !str(x, 120)))) err(file, id, "confuse debe ser array de textos");
    if (!str(it.errors_es, 240)) err(file, id, "errors_es obligatorio (<= 240)");
    if (it.forms !== undefined && !str(it.forms, 160)) err(file, id, "forms demasiado largo");
    if (!str(it.freq_src, 120)) err(file, id, "freq_src obligatorio: fuente o «estimación»");
  }
  const [minEx, maxEx] = rich ? [3, 5] : [2, 3];
  if (!Array.isArray(it.ex) || it.ex.length < minEx || it.ex.length > maxEx) return err(file, id, `ex debe tener ${minEx}–${maxEx} ejemplos`);
  for (const e of it.ex) {
    if (!str(e?.en, 160) || !str(e?.es, 180)) { err(file, id, "ejemplo sin en/es o demasiado largo"); continue; }
    if (brackets(e.en) !== 1 || /[\[\]]/.test(e.en.replace(/\[[^\[\]]+\]/, ""))) err(file, id, `el ejemplo necesita exactamente un [par de corchetes]: ${e.en}`);
    if (/[\[\]]/.test(e.es)) err(file, id, "la traducción del ejemplo no lleva corchetes");
    const words = e.en.replace(/[\[\]]/g, "").trim().split(/\s+/).length;
    if (words < 3 || words > 18) warn(file, id, `ejemplo de ${words} palabras (ideal 5–14)`);
  }
}

const only = process.argv.slice(2).map((p) => resolve(p));
const allFiles = listJson(itemsDir);
const byId = new Map();
const bySense = new Map();
for (const file of allFiles) {
  const checkThis = only.length === 0 || only.includes(resolve(file));
  for (const it of load(file)) {
    if (checkThis) checkItem(file, it);
    if (typeof it?.id !== "string") continue;
    if (byId.has(it.id)) {
      if (checkThis || only.includes(resolve(byId.get(it.id)))) err(file, it.id, `id duplicado (también en ${byId.get(it.id)})`);
    } else byId.set(it.id, file);
    const sense = `${it.type}|${String(it.term).toLowerCase()}|${String(it.es).toLowerCase()}`;
    if (bySense.has(sense) && checkThis) err(file, it.id, `mismo término y significado que ${bySense.get(sense)}`);
    else bySense.set(sense, it.id);
  }
}
for (const p of only) if (!allFiles.map((f) => resolve(f)).includes(p)) err(p, null, "archivo no encontrado en content/items");

let lessonCount = 0;
if (only.length === 0) {
  const lessonIds = new Set();
  for (const file of listJson(lessonsDir)) {
    for (const l of load(file)) {
      lessonCount++;
      const id = l?.id;
      if (!str(id, 80) || !/^les-[a-z0-9-]+$/.test(id)) { err(file, id, "id de lección inválido (les-...)"); continue; }
      if (lessonIds.has(id)) err(file, id, "lección duplicada");
      lessonIds.add(id);
      if (!LEVELS.includes(l.level)) err(file, id, "level inválido");
      if (!TOPICS.includes(l.topic)) err(file, id, "topic inválido");
      if (!str(l.title, 60) || !str(l.title_es, 80) || !str(l.intro_es, 200)) err(file, id, "title/title_es/intro_es");
      if (!Array.isArray(l.items) || l.items.length < 3 || l.items.length > 6) err(file, id, "items: 3–6 ids");
      for (const ref of l.items ?? []) if (!byId.has(ref)) err(file, id, `item inexistente: ${ref}`);
      if (!Array.isArray(l.lines) || l.lines.length < 5 || l.lines.length > 12) err(file, id, "lines: 5–12");
      const seen = new Set();
      for (const ln of l.lines ?? []) {
        if (!str(ln?.en, 200) || !str(ln?.es, 220)) err(file, id, "línea sin en/es");
        const n = brackets(ln?.en ?? "");
        if (ln.item) {
          if (n !== 1) err(file, id, `línea con item necesita un par de corchetes: ${ln.en}`);
          if (!(l.items ?? []).includes(ln.item)) err(file, id, `line.item fuera de items: ${ln.item}`);
          seen.add(ln.item);
        } else if (n !== 0) err(file, id, `línea con corchetes pero sin item: ${ln.en}`);
      }
      for (const ref of l.items ?? []) if (!seen.has(ref)) err(file, id, `el ítem ${ref} no aparece en ninguna línea`);
      if (!Array.isArray(l.questions) || l.questions.length < 2 || l.questions.length > 4) err(file, id, "questions: 2–4");
      for (const q of l.questions ?? []) {
        if (!str(q?.q, 160) || !Array.isArray(q.options) || q.options.length !== 3 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 2 || !str(q.why_es, 200)) err(file, id, `pregunta inválida: ${q?.q}`);
      }
    }
  }
}

if (only.length === 0) {
  const readArr = (p) => (existsSync(p) ? load(p) : []);
  const listDir = (d) => listJson(join(root, "content", d)).flatMap((p) => load(p).map((x) => [p, x]));
  const seenIds = new Set();
  const uniq = (file, id) => { if (seenIds.has(id)) err(file, id, "id duplicado"); seenIds.add(id); };
  let rp = 0;
  for (const [file, r] of listDir("roleplays")) {
    rp++; uniq(file, r?.id);
    if (!/^rp-[a-z0-9-]+$/.test(r?.id ?? "")) err(file, r?.id, "id de roleplay inválido");
    if (!AREAS.includes(r.area)) err(file, r.id, "area inválida");
    if (!LEVELS.includes(r.level)) err(file, r.id, "level inválido");
    if (!str(r.title, 70) || !str(r.title_es, 90) || !str(r.setting_es, 300) || !str(r.npc, 40)) err(file, r.id, "title/title_es/setting_es/npc");
    if (!Array.isArray(r.turns) || r.turns.length < 4 || r.turns.length > 10) err(file, r.id, "turns: 4–10");
    for (const t of r.turns ?? []) {
      if (!str(t.npc, 300) || !str(t.npc_es, 320) || !str(t.task_es, 220)) err(file, r.id, "turno sin npc/npc_es/task_es");
      if (!Array.isArray(t.expect) || !t.expect.length || t.expect.some((g) => !Array.isArray(g) || !g.length || g.some((a) => !str(a, 60) || a !== a.toLowerCase()))) err(file, r.id, `expect inválido: ${JSON.stringify(t.expect)}`);
      if (!Array.isArray(t.model) || t.model.length < 1 || t.model.some((m) => !str(m, 220))) err(file, r.id, "model: 1–3 respuestas");
      for (const tip of t.tips ?? []) { try { new RegExp(tip.wrong, "i"); } catch { err(file, r.id, `regex inválida: ${tip.wrong}`); } if (!str(tip.fix, 120) || !str(tip.why_es, 220)) err(file, r.id, "tip sin fix/why_es"); }
    }
    if (!Array.isArray(r.useful) || r.useful.length < 2) err(file, r.id, "useful: 2–6");
  }
  const errorsBank = readArr(join(root, "content", "errors.json"));
  for (const e of errorsBank) {
    uniq("errors.json", e?.id);
    if (!/^err-[a-z0-9-]+$/.test(e?.id ?? "") || !str(e.wrong, 160) || !Array.isArray(e.right) || !e.right.length || !str(e.why_es, 240) || !LEVELS.includes(e.level)) err("errors.json", e?.id, "error mal formado");
    if (e.pattern) { try { new RegExp(e.pattern, "i"); } catch { err("errors.json", e.id, "regex inválida"); } }
  }
  const test = readArr(join(root, "content", "placement", "test.json"));
  for (const q of test) {
    uniq("test.json", q?.id);
    if (!["grammar", "vocab", "reading", "listening"].includes(q?.section) || !LEVELS.includes(q.level) || !str(q.prompt, 300) || !Array.isArray(q.options) || q.options.length !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err("test.json", q?.id, "pregunta mal formada");
    if (q.section === "reading" && !str(q.passage, 1800)) err("test.json", q.id, "reading sin passage");
    if (q.section === "listening" && !str(q.audio, 1200)) err("test.json", q.id, "listening sin audio");
  }
  // Gramática: todos los archivos de content/grammar (tiempos verbales y unidades de estructuras, escritura y examen).
  const gdir = join(root, "content", "grammar");
  const GROUPS = ["tiempos", "estructuras", "escritura", "conversacion"];
  const tenses = existsSync(gdir) ? readdirSync(gdir).filter((f) => f.endsWith(".json")).flatMap((f) => readArr(join(gdir, f))) : [];
  for (const g of tenses) {
    uniq("grammar", g?.id);
    if (!/^gr-[a-z0-9-]+$/.test(g?.id ?? "") || !str(g.name_en, 60) || !str(g.title_es, 80) || !str(g.use_es, 600) || (!g.form && !Array.isArray(g.steps)) || !Array.isArray(g.examples) || !Array.isArray(g.practice)) err("grammar", g?.id, "lección mal formada");
    if (g.group !== undefined && !GROUPS.includes(g.group)) err("grammar", g.id, `grupo desconocido ${g.group}`);
    if (g.level !== undefined && !LEVELS.includes(g.level)) err("grammar", g.id, `nivel desconocido ${g.level}`);
    for (const s of g.steps ?? []) if (!str(s?.title_es, 80) || !str(s?.body_es, 900)) err("grammar", g.id, "paso mal formado");
    if (g.ielts_es !== undefined && !str(g.ielts_es, 600)) err("grammar", g.id, "ielts_es demasiado largo");
    for (const p of g.practice ?? []) if (!Array.isArray(p.options) || p.options.length < 3 || !Number.isInteger(p.answer) || p.answer >= p.options.length || (p.why_es !== undefined && !str(p.why_es, 300))) err("grammar", g.id, "práctica mal formada");
  }
  // Inglés de series: microescenas originales.
  const GENRES = ["sitcom", "drama", "policial", "medica", "oficina", "romance", "scifi", "thriller", "amigos", "noticias", "juzgado"];
  const lower = (s) => s.toLowerCase().replace(/[’']/g, "'");
  let nSeries = 0;
  for (const file of listJson(join(root, "content", "series"))) {
    for (const s of readArr(file)) {
      nSeries++;
      uniq("series", s?.id);
      const bad = (m) => err(file, s?.id, m);
      if (!/^ser-(b1|b2|c1|c2)-[a-z0-9-]+$/.test(s?.id ?? "")) bad("id inválido (ser-<nivel>-<slug>)");
      if (!["B1", "B2", "C1", "C2"].includes(s.level) || !GENRES.includes(s.genre)) bad("level o genre inválido");
      if (!str(s.title, 80) || !str(s.title_es, 80) || !str(s.setting_es, 200)) bad("títulos o setting_es");
      if (!Array.isArray(s.lines) || s.lines.length < 6 || s.lines.length > 10) { bad("lines: 6–10"); continue; }
      for (const l of s.lines) if (!str(l.who, 30) || !["f", "m"].includes(l.g) || !str(l.en, 220) || !str(l.es, 260)) bad("línea mal formada");
      const all = lower(s.lines.map((l) => l.en).join(" "));
      for (const q of [s.context, s.intent]) if (!q || !str(q.q_es, 200) || !Array.isArray(q.options) || q.options.length !== 3 || !Number.isInteger(q.answer) || q.answer > 2 || !str(q.why_es, 600)) bad("pregunta de contexto/intención mal formada");
      if (!Array.isArray(s.expressions) || s.expressions.length < 2) bad("expressions: 2–4");
      for (const e of s.expressions ?? []) if (!str(e.text, 60) || !str(e.es, 90)) bad("expresión mal formada");
      for (const d of s.decoys ?? []) if (all.includes(lower(d))) bad(`el señuelo «${d}» sí aparece en la escena`);
      const g = s.gap;
      if (!g || !s.lines[g.line] || !lower(s.lines[g.line].en).includes(lower(g.answer ?? "")) || !g.options?.includes(g.answer)) bad("gap: la respuesta debe aparecer en esa línea y estar entre las opciones");
      if (!s.lines[s.shadow]) bad("shadow fuera de rango");
      if (!s.reply || !str(s.reply.prompt_es, 200) || !Array.isArray(s.reply.model) || !s.reply.model.length) bad("reply mal formado");
    }
  }
  console.log(`${rp} roleplays, ${errorsBank.length} errores, ${test.length} preguntas de test, ${tenses.length} lecciones de gramática, ${nSeries} escenas de series`);
}

for (const w of warns.slice(0, 40)) console.log("aviso  ", w);
for (const e of errors) console.log("ERROR  ", e);
console.log(`\n${byId.size} ítems, ${lessonCount} lecciones · ${errors.length} errores, ${warns.length} avisos`);
process.exit(errors.length ? 1 : 0);
