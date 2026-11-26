// Utilidades compartidas por la tubería de audio. La normalización y la clave DEBEN coincidir con src/lib/audio/key.ts.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const cacheDir = join(root, ".audio-cache");
export const voices = JSON.parse(readFileSync(join(root, "content", "voices.json"), "utf8"));

/** Texto tal como se narra: sin corchetes, espacios colapsados. */
export const clipText = (s) => s.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
export const clipKey = (voice, text) => createHash("sha1").update(`${voice}|${clipText(text)}`).digest("hex").slice(0, 12);
export const cachePath = (voice, text) => join(cacheDir, voice, `${clipKey(voice, text)}.mp3`);

const gen = (name) => JSON.parse(readFileSync(join(root, "src", "generated", name), "utf8"));
const byGender = (g) => voices.voices.find((v) => v.gender === g)?.id ?? voices.default;
const voiceOfSpeaker = (who) => (who ? byGender(voices.speakers[who] ?? "f") : voices.default);

/**
 * Lista ordenada por prioridad de {voice, text}. Cada ítem queda junto a sus ejemplos
 * para que el empaquetado los deje contiguos (una sola petición trae la tarjeta completa).
 */
export function collect(only = voices.voices.map((v) => v.id)) {
  const out = [];
  const seen = new Set();
  const add = (voice, text, group) => {
    const t = clipText(text ?? "");
    if (!t || !only.includes(voice)) return;
    const k = clipKey(voice, t);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ voice, text: t, group });
  };
  const all = voices.voices.map((v) => v.id);
  const d = voices.default;
  const mains = voices.voices.filter((v) => v.scope === "full").map((v) => v.id);
  const gender = (id) => voices.voices.find((v) => v.id === id)?.gender;
  // El interlocutor de cada voz principal es la voz del otro género.
  const partnerOf = (m) => voices.voices.find((v) => v.gender !== gender(m))?.id ?? m;

  // Frase de prueba de la pantalla de Ajustes (todas las voces)
  for (const v of all) add(v, "I'm looking forward to catching up with you this weekend.", "sample");

  // P1: conversaciones y test (las dos voces: el interlocutor depende de la voz principal de cada persona)
  for (const l of gen("lessons.json")) for (const ln of l.lines) add(voiceOfSpeaker(ln.who), ln.en, "lesson");
  for (const q of gen("placement.json").filter((q) => q.audio)) {
    for (const line of q.audio.split("\n")) {
      const m = line.match(/^([A-Z]):\s*(.*)$/);
      add(m ? (m[1] === "A" ? byGender("f") : byGender("m")) : d, m ? m[2] : line, "placement");
    }
  }
  for (const r of gen("roleplays.json")) {
    for (const t of r.turns) for (const m of mains) add(partnerOf(m), t.npc, "roleplay");
    for (const t of r.turns) for (const m of t.model) for (const v of mains) add(v, m, "roleplay-model");
    for (const u of r.useful) for (const v of mains) add(v, u, "roleplay-useful");
  }
  for (const s of gen("sounds.json")) {
    for (const w of s.words) add(d, w.word, "sound");
    for (const p of s.pairs) { add(d, p.a.word, "sound"); add(d, p.b.word, "sound"); }
    for (const p of s.phrases) add(d, p.en, "sound");
  }
  for (const p of gen("prosody.json")) for (const x of p.drills) add(d, x.en, "prosody");
  for (const g of gen("tenses.json")) for (const e of g.examples) add(d, e.en, "grammar");
  for (const e of gen("errors.json")) for (const r of e.right) add(d, r, "errors");

  // P1b: rutas temáticas (diálogos, misión final, frases de reparación y modelos de producción) y música.
  for (const r of gen("routes.json")) {
    for (const t of r.tracks) {
      for (const ln of t.lesson.lines) add(voiceOfSpeaker(ln.who), ln.en, "route");
      for (const tn of t.roleplay.turns) for (const m of mains) add(partnerOf(m), tn.npc, "route-roleplay");
      for (const tn of t.roleplay.turns) for (const x of tn.model) for (const v of mains) add(v, x, "route-model");
      for (const p of t.repair) for (const v of mains) add(v, p.en, "route-repair");
      for (const p of t.production) for (const x of p.model) for (const v of mains) add(v, x, "route-model");
    }
  }
  // Inglés de series: cada personaje con la voz de su género (escenas completas, para escucharlas sin subtítulos).
  for (const s of gen("series.json")) {
    for (const ln of s.lines) add(byGender(ln.g), ln.en, "series");
    for (const m of s.reply.model) for (const v of mains) add(v, m, "series-model");
  }
  for (const e of gen("music.json")) for (const v of mains) {
    add(v, e.line, "music");
    add(v, e.spoken, "music");
    for (const x of e.transfer?.model ?? []) add(v, x, "music");
    for (const x of e.examples ?? []) add(v, x.en, "music");
  }

  // P2: vocabulario. Primero lo más frecuente en series y los niveles bajos; término + ejemplos contiguos.
  const lv = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const items = [...gen("items.json")].sort(
    (a, b) => (a.tvRank ?? 9999) - (b.tvRank ?? 9999) || lv.indexOf(a.level) - lv.indexOf(b.level) || b.freq - a.freq || a.id.localeCompare(b.id),
  );
  for (const v of mains) {
    for (const it of items) {
      add(v, it.term, "item");
      for (const e of it.ex) add(v, e.en, "item");
    }
  }
  return out;
}

export const have = (c) => existsSync(cachePath(c.voice, c.text));
