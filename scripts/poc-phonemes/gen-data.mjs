// Genera los datos de prueba del PoC (voz sintética Kokoro, local) y su manifiesto con la separación AJUSTE / EVALUACIÓN.
// Uso: node scripts/poc-phonemes/gen-data.mjs
// - af_heart reutiliza los mp3 ya generados en .audio-cache/ si existen; el resto se sintetiza con kokoro-js (modelo ya en caché).
// - Separación: los pares mínimos con índice global % 4 == 0 son AJUSTE (solo af_heart); los demás son EVALUACIÓN
//   (af_heart + am_adam, voces de EE. UU.) y, para "variantes válidas", bf_emma + bm_george (Reino Unido) solo como muestras correctas.
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { DATA_DIR, ROOT, SR, loadAudio, resample, writeWav, ipaToUnits, sentenceUnits } from "./common.mjs";

const sounds = JSON.parse(readFileSync(join(ROOT, "content", "sounds", "sounds.json"), "utf8"));
const clipKey = (voice, text) => createHash("sha1").update(`${voice}|${text.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim()}`).digest("hex").slice(0, 12);
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// 1) Pares mínimos y separación
const pairs = [];
for (const s of sounds) for (const p of s.pairs) pairs.push({ sound: s.id, a: p.a, b: p.b });
pairs.forEach((p, i) => (p.split = i % 4 === 0 ? "tuning" : "eval"));

// 2) Peticiones de audio
const want = new Map(); // key voice|text -> {voice,text,file}
const need = (voice, text) => {
  const k = `${voice}|${text}`;
  if (!want.has(k)) want.set(k, { voice, text, file: join(DATA_DIR, voice, `${slug(text)}-${clipKey(voice, text).slice(0, 6)}.wav`) });
  return want.get(k).file;
};
const US = ["af_heart", "am_adam"], UK = ["bf_emma", "bm_george"];
const samples = [];
for (const p of pairs) {
  const voices = p.split === "tuning" ? ["af_heart"] : US;
  for (const [t, o] of [[p.a, p.b], [p.b, p.a]]) {
    for (const v of voices) {
      const base = { split: p.split, sound: p.sound, voice: v, target: t.word, ref: ipaToUnits(t.ipa), partner: o.word, partnerRef: ipaToUnits(o.ipa) };
      samples.push({ ...base, kind: "correct", said: t.word, file: need(v, t.word) });
      samples.push({ ...base, kind: "wrong", said: o.word, file: need(v, o.word) });
    }
    if (p.split === "eval") for (const v of UK) samples.push({ split: "eval", sound: p.sound, voice: v, target: t.word, ref: ipaToUnits(t.ipa), partner: o.word, partnerRef: ipaToUnits(o.ipa), kind: "variant", said: t.word, file: need(v, t.word) });
  }
}

// 3) Frases: correcta, omisión de una palabra, frase distinta. Referencia fonética desde CMUdict.
const phrases = sounds.flatMap((s) => s.phrases.map((p) => p.en)).filter((t, i, a) => a.indexOf(t) === i);
phrases.forEach((text, i) => {
  const split = i % 4 === 0 ? "tuning" : "eval";
  const words = text.replace(/[.,!?]/g, "").split(/\s+/);
  const v = "af_heart";
  samples.push({ split, kind: "phrase", voice: v, target: text, ref: sentenceUnits(text), said: text, file: need(v, text) });
  // omisión: se quita la palabra de contenido más larga (no la primera)
  const drop = words.slice(1).reduce((m, w, j) => (w.length > words[m].length ? j + 1 : m), 1);
  const omitted = words.filter((_, j) => j !== drop).join(" ");
  samples.push({ split, kind: "omission", voice: v, target: text, ref: sentenceUnits(text), said: omitted, droppedWord: words[drop], droppedIndex: drop, file: need(v, omitted) });
  const other = phrases[(i + 7) % phrases.length];
  samples.push({ split, kind: "different", voice: v, target: text, ref: sentenceUnits(text), said: other, file: need(v, other) });
});

// 4) Silencio, ruido blanco y la grabación humana de tests/fixtures (si existe)
mkdirSync(join(DATA_DIR, "synthetic"), { recursive: true });
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
const gen = {
  silence: new Float32Array(3 * SR),
  "noise-20db": Float32Array.from({ length: 3 * SR }, () => rnd() * 0.1 * Math.sqrt(3)),
  "noise-40db": Float32Array.from({ length: 3 * SR }, () => rnd() * 0.01 * Math.sqrt(3)),
};
for (const [name, x] of Object.entries(gen)) {
  const f = join(DATA_DIR, "synthetic", `${name}.wav`);
  writeFileSync(f, writeWav(f, x));
  for (const tgt of ["ship", "Is this his big gift?"]) samples.push({ split: "eval", kind: name.startsWith("noise") ? "noise" : "silence", voice: "-", target: tgt, ref: tgt.includes(" ") ? sentenceUnits(tgt) : ipaToUnits("/ʃɪp/"), said: name, file: f });
}
// Ruido mezclado con voz correcta (robustez): ship/sheep con ruido a ~-20 dB
const fixture = join(ROOT, "tests", "fixtures", "speech.wav");
if (existsSync(fixture)) {
  const f = join(DATA_DIR, "synthetic", "fixture-speech.wav");
  copyFileSync(fixture, f);
  // Es la frase de prueba de Ajustes; su origen (voz humana o TTS) no está documentado en el repo.
  const t = "I'm looking forward to catching up with you this weekend.";
  samples.push({ split: "eval", kind: "human", voice: "fixture", target: t, ref: sentenceUnits(t), said: t, file: f });
}

// 5) Síntesis de lo que falte
const missing = [...want.values()].filter((w) => !existsSync(w.file));
console.log(`audios: ${want.size} (faltan ${missing.length}); muestras: ${samples.length}`);
const cacheMp3 = (w) => join(ROOT, ".audio-cache", w.voice, `${clipKey(w.voice, w.text)}.mp3`);
let tts;
for (const [i, w] of missing.entries()) {
  mkdirSync(join(DATA_DIR, w.voice), { recursive: true });
  let x;
  if (w.voice === "af_heart" && existsSync(cacheMp3(w))) x = loadAudio(cacheMp3(w));
  else {
    if (!tts) {
      const { KokoroTTS } = await import("kokoro-js");
      tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
    }
    const a = await tts.generate(w.text, { voice: w.voice });
    x = resample(a.audio, a.sampling_rate, SR);
    // recorte de silencio inicial/final (como el pipeline de la app)
    const th = 0.003; let s = 0, e = x.length - 1;
    while (s < e && Math.abs(x[s]) < th) s++;
    while (e > s && Math.abs(x[e]) < th) e--;
    x = x.slice(Math.max(0, s - 800), Math.min(x.length, e + 800));
  }
  writeFileSync(w.file, writeWav(w.file, x));
  if (i % 50 === 0) console.log(`${i}/${missing.length} ${w.voice} ${w.text}`);
}
writeFileSync(join(DATA_DIR, "manifest.json"), JSON.stringify({ created: new Date().toISOString(), pairs: pairs.length, samples }, null, 1));
const count = (f) => samples.filter(f).length;
console.log(`tuning: ${count((s) => s.split === "tuning")}  eval: ${count((s) => s.split === "eval")}`);
