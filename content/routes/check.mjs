// Validación de content/routes/*.json (node puro, sin dependencias).
// Uso: node content/routes/check.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const content = path.resolve(here, "..");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const TOPICS = ["daily", "work", "tech", "travel", "canada", "interview", "social", "informal", "money", "health", "feelings", "study", "home", "food"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const TYPES = ["phrasal", "collocation", "idiom", "vocab", "phrase", "contraction"];
const PREFIX = { phrasal: "pv-", collocation: "col-", idiom: "idi-", vocab: "voc-", phrase: "phr-", contraction: "con-" };
const BANDS = { a: ["A1-A2", ["A1", "A2"]], b: ["B1-B2", ["B1", "B2"]], c: ["C1", ["C1"]] };

const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));

// areas (desde src/lib/areas.ts)
const areasSrc = fs.readFileSync(path.resolve(content, "../src/lib/areas.ts"), "utf8");
const AREAS = new Set([...areasSrc.matchAll(/\{ id: "([a-z]+)", label:/g)].map((m) => m[1]));
if (AREAS.size < 20) err("no pude leer las áreas de src/lib/areas.ts");

// ítems existentes
const itemsDir = path.join(content, "items");
const itemById = new Map();
const itemFile = new Map();
const termKey = new Map();
for (const f of fs.readdirSync(itemsDir).filter((x) => x.endsWith(".json")).sort()) {
  let arr;
  try { arr = readJson(path.join(itemsDir, f)); } catch (e) { err(`items/${f}: JSON inválido (${e.message})`); continue; }
  if (!Array.isArray(arr)) { err(`items/${f}: debe ser un array`); continue; }
  for (const it of arr) {
    if (itemById.has(it.id)) err(`id de ítem duplicado: ${it.id} (${itemFile.get(it.id)} y ${f})`);
    else { itemById.set(it.id, it); itemFile.set(it.id, f); }
    const k = `${String(it.term).toLowerCase()}`;
    if (termKey.has(k) && termKey.get(k).id !== it.id && termKey.get(k).type === it.type && (f === "routes-1.json" || /^routes-/.test(termKey.get(k).file))) err(`término repetido "${k}" (${it.type}): ${it.id} en ${f} y ${termKey.get(k).id} en ${termKey.get(k).file}`);
    if (!termKey.has(k)) termKey.set(k, { id: it.id, type: it.type, file: f });
  }
}

// validar los ítems nuevos de routes-1.json
const routeItems = path.join(itemsDir, "routes-1.json");
if (fs.existsSync(routeItems)) {
  for (const it of readJson(routeItems)) {
    const p = `routes-1:${it.id}`;
    if (!TYPES.includes(it.type)) err(`${p}: type inválido`);
    if (!it.id.startsWith(PREFIX[it.type] || "?")) err(`${p}: prefijo no coincide con type ${it.type}`);
    if (!LEVELS.includes(it.level)) err(`${p}: level inválido`);
    if (!TOPICS.includes(it.topic)) err(`${p}: topic inválido (${it.topic})`);
    if (!(it.freq >= 1 && it.freq <= 5)) err(`${p}: freq fuera de 1-5`);
    for (const k of ["term", "es", "def"]) if (!it[k]) err(`${p}: falta ${k}`);
    if ((it.type === "vocab" || it.type === "phrasal") && !it.ipa) err(`${p}: falta ipa`);
    if (it.es && it.es.length > 60) warn(`${p}: es largo (${it.es.length})`);
    if (it.def && it.def.length > 95) warn(`${p}: def larga (${it.def.length})`);
    if (it.note && it.note.length > 170) warn(`${p}: note larga (${it.note.length})`);
    if (!Array.isArray(it.ex) || it.ex.length < 2 || it.ex.length > 3) err(`${p}: ex debe tener 2-3 ejemplos`);
    else for (const e of it.ex) {
      const n = (e.en.match(/\[/g) || []).length;
      if (n !== 1 || (e.en.match(/\]/g) || []).length !== 1) err(`${p}: cada ex.en necesita exactamente un par de corchetes -> ${e.en}`);
      if (!e.es) err(`${p}: ex sin es`);
    }
    if (!Array.isArray(it.areas) || !it.areas.length || it.areas.some((a) => !AREAS.has(a))) err(`${p}: areas inválidas`);
  }
}

// ids de lecciones y roleplays existentes
const lessonIds = new Set(readJson(path.join(content, "lessons/lessons.json")).map((l) => l.id));
const rpIds = new Set(readJson(path.join(content, "roleplays/roleplays.json")).map((r) => r.id));

// equivalente a src/lib/answer.ts + evaluate.ts
const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const CONTR = { "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "it's": "it is", "that's": "that is", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "cannot", "won't": "will not", "isn't": "is not", "aren't": "are not", "i'll": "i will", "you'll": "you will", "i've": "i have", "let's": "let us", gonna: "going to", wanna: "want to" };
const words = (s) => normalize(s).split(" ").flatMap((w) => (CONTR[w] ?? w).split(" ")).filter(Boolean);
const lev = (a, b) => { const dp = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let prev = dp[0]; dp[0] = i; for (let j = 1; j <= b.length; j++) { const t = dp[j]; dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return dp[b.length]; };
const contains = (answer, alt) => { const a = words(answer), b = words(alt); if (!b.length) return false; for (let i = 0; i + b.length <= a.length; i++) if (b.every((w, k) => a[i + k] === w || (w.length > 5 && lev(a[i + k], w) <= 1))) return true; return false; };
const passes = (answer, expect) => expect.every((g) => g.some((alt) => contains(answer, alt)));

const seenLessons = new Map();
const seenRps = new Map();
const seenTracks = new Set();
const allNew = new Map();
let nTracks = 0;
const only = process.argv.slice(2); // opcional: ids de rutas a validar (por defecto, todas)
const routeFiles = fs.readdirSync(here).filter((f) => f.endsWith(".json") && (!only.length || only.includes(f.replace(/.json$/, "")))).sort();
const usedItems = new Set();

function checkExpect(p, expect, models) {
  if (!Array.isArray(expect) || !expect.length) { err(`${p}: expect vacío`); return; }
  expect.forEach((g, gi) => {
    if (!Array.isArray(g) || !g.length) err(`${p}: grupo expect ${gi} vacío`);
    else g.forEach((a) => { if (typeof a !== "string" || a !== a.toLowerCase()) err(`${p}: alternativa expect no minúscula: ${a}`); });
  });
  if (expect.length > 3) warn(`${p}: más de 3 grupos expect`);
  for (const m of models || []) if (!passes(m, expect)) err(`${p}: la respuesta modelo no cumple su propio expect -> "${m}"`);
}

for (const f of routeFiles) {
  let r;
  try { r = readJson(path.join(here, f)); } catch (e) { err(`${f}: JSON inválido (${e.message})`); continue; }
  const id = f.replace(/\.json$/, "");
  const P = (s) => `${id}${s ? ":" + s : ""}`;
  if (r.id !== id) err(`${f}: id "${r.id}" no coincide con el nombre del archivo`);
  if (!/^[a-z][a-z0-9-]*$/.test(r.id || "")) err(`${f}: id inválido`);
  for (const k of ["title_es", "icon", "objective_es"]) if (!r[k]) err(`${P()}: falta ${k}`);
  if (!("scene" in r)) err(`${P()}: falta scene (puede ser null)`);
  if (!("season" in r)) err(`${P()}: falta season (puede ser null)`);
  else if (r.season !== null && !["navidad", "invierno", "primavera", "verano", "otono"].includes(r.season)) err(`${P()}: season inválida`);
  if (!Array.isArray(r.areas) || !r.areas.length || r.areas.some((a) => !AREAS.has(a))) err(`${P()}: areas inválidas`);
  if (!Array.isArray(r.tracks) || !r.tracks.length) { err(`${P()}: sin tracks`); continue; }
  const suffixes = r.tracks.map((t) => String(t.id).split("-").pop());
  if (!suffixes.includes("a") || !suffixes.includes("b")) err(`${P()}: faltan pistas -a y/o -b`);

  for (const n of r.new_items || []) {
    const ex = itemById.get(n.id);
    if (!ex) err(`${P()}: new_items ${n.id} no está en content/items/routes-1.json`);
    else if (!/^routes-[0-9]+\.json$/.test(itemFile.get(n.id))) err(`${P()}: new_items ${n.id} ya existe en ${itemFile.get(n.id)} (reutilízalo en items, no lo repitas en new_items)`);
    allNew.set(n.id, f);
  }

  for (const t of r.tracks) {
    nTracks++;
    const tp = P(t.id);
    const m = /^(.+)-(a|b|c)$/.exec(t.id || "");
    if (!m || m[1] !== r.id) { err(`${tp}: id de pista no cumple <ruta>-a|b|c`); continue; }
    if (seenTracks.has(t.id)) err(`${tp}: pista duplicada`);
    seenTracks.add(t.id);
    const [band, lv] = BANDS[m[2]];
    if (t.band !== band) err(`${tp}: band debe ser ${band}`);
    if (!lv.includes(t.level)) err(`${tp}: level debe ser uno de ${lv}`);
    if (!(t.minutes >= 8 && t.minutes <= 20)) err(`${tp}: minutes fuera de 8-20`);
    if (!Array.isArray(t.skills) || !t.skills.length) err(`${tp}: skills vacío`);
    if (!t.objective_es) err(`${tp}: falta objective_es`);
    if (!Array.isArray(t.items) || t.items.length < 6 || t.items.length > 12) err(`${tp}: items debe tener 6-12 (tiene ${t.items?.length})`);
    for (const i of t.items || []) { usedItems.add(i); if (!itemById.has(i)) err(`${tp}: item inexistente ${i}`); }
    if (new Set(t.items).size !== (t.items || []).length) err(`${tp}: items repetidos`);

    // lección
    const ls = t.lesson;
    if (!ls) { err(`${tp}: falta lesson`); }
    else {
      const lp = `${tp}/lesson`;
      if (ls.id !== "ls-" + t.id) err(`${lp}: id debe ser ls-${t.id}`);
      if (lessonIds.has(ls.id)) err(`${lp}: id colisiona con content/lessons`);
      if (seenLessons.has(ls.id)) err(`${lp}: id duplicado con ${seenLessons.get(ls.id)}`);
      seenLessons.set(ls.id, f);
      if (!LEVELS.includes(ls.level)) err(`${lp}: level inválido`);
      if (!TOPICS.includes(ls.topic)) err(`${lp}: topic inválido (${ls.topic})`);
      if (!(ls.order >= 900)) err(`${lp}: order debe ser >= 900`);
      for (const k of ["title", "title_es", "intro_es"]) if (!ls[k]) err(`${lp}: falta ${k}`);
      if (!Array.isArray(ls.lines) || ls.lines.length < 8 || ls.lines.length > 16) err(`${lp}: lines debe tener 8-16 (tiene ${ls.lines?.length})`);
      const lineItems = new Set();
      (ls.lines || []).forEach((ln, i) => {
        if (!ln.who) err(`${lp}: línea ${i + 1} sin who`);
        if (!ln.en || !ln.es) err(`${lp}: línea ${i + 1} sin en/es`);
        if (ln.item) {
          if (!itemById.has(ln.item)) err(`${lp}: línea ${i + 1} item inexistente ${ln.item}`);
          if (!/\[[^\]]+\]/.test(ln.en || "")) err(`${lp}: línea ${i + 1} tiene item pero no corchetes`);
          lineItems.add(ln.item);
        } else if (/\[[^\]]+\]/.test(ln.en || "") && !/\[Secret Santa\]/i.test(ln.en)) warn(`${lp}: línea ${i + 1} tiene corchetes sin item (${ln.en})`);
      });
      for (const i of ls.items || []) { if (!itemById.has(i)) err(`${lp}: items contiene id inexistente ${i}`); if (!lineItems.has(i)) err(`${lp}: item ${i} no aparece en ninguna línea`); }
      for (const i of lineItems) if (!(ls.items || []).includes(i)) err(`${lp}: item de línea ${i} no está en lesson.items`);
      if ((ls.items || []).length < 3 || (ls.items || []).length > 12) warn(`${lp}: ${ls.items?.length} ítems objetivo`);
      for (const i of ls.items || []) if (!(t.items || []).includes(i)) err(`${tp}: items de pista debe incluir ${i} de la lección`);
      if (!Array.isArray(ls.questions) || ls.questions.length < 3 || ls.questions.length > 5) err(`${lp}: questions debe tener 3-5`);
      (ls.questions || []).forEach((q, i) => {
        if (!q.q || !Array.isArray(q.options) || q.options.length !== 3) err(`${lp}: pregunta ${i + 1} necesita q y 3 options`);
        else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(`${lp}: pregunta ${i + 1} answer fuera de rango`);
        if (!q.why_es) err(`${lp}: pregunta ${i + 1} sin why_es`);
      });
      const ans = (ls.questions || []).map((q) => q.answer);
      if (ans.length >= 4 && new Set(ans).size === 1) warn(`${lp}: todas las respuestas en la misma posición`);
    }

    // producción
    if (!Array.isArray(t.production) || t.production.length < 2 || t.production.length > 4) err(`${tp}: production debe tener 2-4`);
    (t.production || []).forEach((p, i) => {
      if (!p.prompt_es || !Array.isArray(p.model) || !p.model.length) err(`${tp}: production ${i + 1} sin prompt_es/model`);
      checkExpect(`${tp}/production ${i + 1}`, p.expect, p.model);
    });
    // reparación
    if (!Array.isArray(t.repair) || t.repair.length < 2 || t.repair.length > 4) err(`${tp}: repair debe tener 2-4`);
    (t.repair || []).forEach((p, i) => { for (const k of ["situation_es", "en", "es"]) if (!p[k]) err(`${tp}: repair ${i + 1} sin ${k}`); });

    // roleplay
    const rp = t.roleplay;
    if (!rp) { err(`${tp}: falta roleplay`); continue; }
    const rpp = `${tp}/roleplay`;
    if (rp.id !== "rp-" + t.id) err(`${rpp}: id debe ser rp-${t.id}`);
    if (rpIds.has(rp.id)) err(`${rpp}: id colisiona con content/roleplays`);
    if (seenRps.has(rp.id)) err(`${rpp}: id duplicado con ${seenRps.get(rp.id)}`);
    seenRps.set(rp.id, f);
    if (!AREAS.has(rp.area)) err(`${rpp}: area inválida (${rp.area})`);
    if (!LEVELS.includes(rp.level)) err(`${rpp}: level inválido`);
    for (const k of ["title", "title_es", "setting_es", "npc"]) if (!rp[k]) err(`${rpp}: falta ${k}`);
    if (!Array.isArray(rp.turns) || rp.turns.length < 4 || rp.turns.length > 7) err(`${rpp}: turns debe tener 4-7 (tiene ${rp.turns?.length})`);
    (rp.turns || []).forEach((tn, i) => {
      const tpp = `${rpp} turno ${i + 1}`;
      for (const k of ["npc", "npc_es", "task_es"]) if (!tn[k]) err(`${tpp}: falta ${k}`);
      if (!Array.isArray(tn.model) || tn.model.length < 2) err(`${tpp}: model necesita 2 respuestas`);
      checkExpect(tpp, tn.expect, tn.model);
      for (const tip of tn.tips || []) {
        let re;
        try { re = new RegExp(tip.wrong, "i"); } catch { err(`${tpp}: tip con regex inválida ${tip.wrong}`); continue; }
        if (!tip.fix || !tip.why_es) err(`${tpp}: tip sin fix/why_es`);
        for (const mm of tn.model || []) if (re.test(mm.toLowerCase()) || re.test(" " + normalize(mm) + " ")) err(`${tpp}: tip "${tip.wrong}" marca como error una respuesta modelo "${mm}"`);
      }
    });
    if (!Array.isArray(rp.useful) || rp.useful.length < 3 || rp.useful.length > 6) err(`${rpp}: useful debe tener 3-6`);
  }
}

// ítems de routes-N.json que ninguna pista usa (solo si se validan todas las rutas)
if (!only.length) for (const [id, f] of itemFile) if (/^routes-[0-9]+\.json$/.test(f) && !usedItems.has(id)) warn(`ítem de ${f} sin usar en ninguna pista: ${id}`);
console.log(`rutas: ${routeFiles.length}, pistas: ${nTracks}, ítems totales: ${itemById.size}, ítems nuevos de rutas: ${allNew.size}`);
for (const w of warns) console.log("AVISO  " + w);
for (const e of errors) console.log("ERROR  " + e);
console.log(errors.length ? `FALLÓ: ${errors.length} errores` : "OK: todo válido");
process.exit(errors.length ? 1 : 0);
