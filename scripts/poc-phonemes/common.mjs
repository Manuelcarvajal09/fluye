// Utilidades compartidas del PoC de notas fonéticas. Sin red: los modelos se leen de .poc-cache/models.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CACHE = join(ROOT, ".poc-cache");
export const MODELS_DIR = join(CACHE, "models");
export const DATA_DIR = join(CACHE, "data");
export const SR = 16000;

/** Decodifica cualquier audio (mp3/wav) a Float32 mono 16 kHz con ffmpeg. */
export function loadAudio(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "pipe:1"], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4).slice();
}

/** Lee un WAV PCM16 mono (los que escribe writeWav); si no lo es, cae a ffmpeg. */
export function readWav(file) {
  const b = readFileSync(file);
  let o = 12;
  while (o + 8 <= b.length) {
    const id = b.toString("ascii", o, o + 4), n = b.readUInt32LE(o + 4);
    if (id === "fmt " && (b.readUInt16LE(o + 8) !== 1 || b.readUInt16LE(o + 10) !== 1 || b.readUInt32LE(o + 12) !== SR || b.readUInt16LE(o + 22) !== 16)) break;
    if (id === "data") {
      const x = new Float32Array(Math.floor(Math.min(n, b.length - o - 8) / 2));
      for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(o + 8 + i * 2) / 32768;
      return x;
    }
    o += 8 + n + (n % 2);
  }
  return loadAudio(file);
}

/** Remuestreo lineal simple (solo para pasar Kokoro 24 kHz a 16 kHz en la generación de datos). */
export function resample(x, from, to) {
  if (from === to) return x;
  const n = Math.floor((x.length * to) / from);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = (i * from) / to, i0 = Math.floor(t), f = t - i0;
    y[i] = (x[i0] ?? 0) * (1 - f) + (x[i0 + 1] ?? x[i0] ?? 0) * f;
  }
  return y;
}

export function writeWav(file, x, sr = SR) {
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  return b;
}

export const rms = (x) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(1, x.length));

// ---------- Fonemas: normalización a un inventario común (IPA estadounidense sin longitud ni acento) ----------
// Los modelos espeak escriben "iː", "ɐ", "ᵻ", "oʊ"...; el contenido de la app escribe "/ʃip/". Se reduce todo a
// unidades comparables. Las equivalencias se decidieron con el conjunto de AJUSTE (ver docs/oral-poc.md).
const MULTI = ["tʃ", "dʒ", "eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ", "ɝ", "ɚ"]; // unidades de varios caracteres (tras limpiar)
const MAP = {
  "ɐ": "ə", "ᵻ": "ɪ", "ɜ": "ɝ", "ɹ̩": "ɚ", "r": "ɹ", "ɾ": "ɾ", "g": "ɡ", "ɫ": "l", "ʔ": "", "ɒ": "ɑ", "a": "æ",
  "e": "eɪ", "o": "oʊ", "əʊ": "oʊ", "ɛə": "ɛ", "ɪə": "ɪ", "ʊə": "ʊ", "ɑː": "ɑ", "ɔː": "ɔ", "ɜː": "ɝ", "ʌ": "ʌ",
  "x": "k", "ç": "h", "n̩": "n", "l̩": "l", "m̩": "m", "ɬ": "l", "ɑ̃": "ɑ", "ɐ̃": "ə",
};
const STRIP = /[ˈˌːˑ̚ʰʲʷ̃‿.̩̚ʰ̞̪͜͡0-9]/g; // acento, longitud, aspiración, no liberación, ligaduras, tonos
// Tokens compuestos de espeak (vocal + r de coda, l silábica). Si el modelo los tiene, la referencia se fusiona igual (adaptRef).
export const COMPOUNDS = { "ɛɹ": "ɛɹ", "ɪɹ": "ɪɹ", "ɑːɹ": "ɑɹ", "ɔːɹ": "ɔɹ", "oːɹ": "ɔɹ", "ʊɹ": "ʊɹ", "əl": "əl" };
const VOWELS = new Set(["i", "ɪ", "eɪ", "ɛ", "æ", "ɑ", "ɔ", "oʊ", "ʊ", "u", "ʌ", "ə", "ɚ", "ɝ", "aɪ", "aʊ", "ɔɪ"]);
const SPECIAL = new Set(["<pad>", "<s>", "</s>", "<unk>", "[PAD]", "[UNK]", "|", " "]);

/** Convierte una cadena IPA ("/ˈvɛɹi/") en lista de unidades normalizadas. */
export function ipaToUnits(ipa) {
  let s = ipa.replace(/[\/\[\]]/g, "").replace(/ɝː/g, "ɝ").replace(/ɜːɹ?/g, "ɝ").replace(/əɹ/g, "ɚ");
  s = s.replace(STRIP, "").replace(/\s+/g, "");
  const out = [];
  for (let i = 0; i < s.length; ) {
    const two = s.slice(i, i + 2);
    if (MULTI.includes(two)) { out.push(two); i += 2; continue; }
    const c = s[i]; i++;
    if (c === "ɹ" && out.at(-1) === "ɝ") continue; // "ɝɹ" de algunas transcripciones
    out.push(c);
  }
  return out.map((u) => MAP[u] ?? u).flatMap((u) => (u === "" ? [] : [u]));
}

/** Normaliza un token del vocabulario del modelo a 0..n unidades. */
export function tokenToUnits(tok) {
  if (!tok || SPECIAL.has(tok)) return [];
  if (COMPOUNDS[tok]) return [COMPOUNDS[tok]];
  const t = tok.replace(STRIP, "");
  if (MAP[tok] !== undefined) return MAP[tok] ? [MAP[tok]] : [];
  if (MAP[t] !== undefined) return MAP[t] ? [MAP[t]] : [];
  if (MULTI.includes(t)) return [t];
  return ipaToUnits(t);
}

/** Fusiona vocal+ɹ de coda (y ə+l) en la unidad compuesta cuando el modelo la tiene en su inventario. */
export function adaptRef(seq, inventory) {
  const out = [];
  for (let i = 0; i < seq.length; i++) {
    const a = seq[i], b = seq[i + 1], c = seq[i + 2];
    const r = a === "oʊ" ? "ɔ" : a;
    if (b === "ɹ" && inventory.has(r + "ɹ") && !VOWELS.has(c)) { out.push(r + "ɹ"); i++; continue; }
    if (a === "ə" && b === "l" && inventory.has("əl") && !VOWELS.has(c)) { out.push("əl"); i++; continue; }
    out.push(a);
  }
  // Unidades que el modelo no tiene (p. ej. gruut no tiene ɝ ni ɾ): se sustituyen por una equivalente que sí tenga.
  return out.map((u) => (inventory.has(u) ? u : EQUIV.find((g) => g.includes(u))?.find((x) => inventory.has(x)) ?? u));
}
export const ENGLISH_VOWELS = new Set(["i", "ɪ", "eɪ", "ɛ", "æ", "ɑ", "ɔ", "oʊ", "ʊ", "u", "ʌ", "ə", "ɚ", "ɝ", "aɪ", "aʊ", "ɔɪ", "ɛɹ", "ɪɹ", "ɑɹ", "ɔɹ", "ʊɹ", "əl"]);
/** Inserciones que se prueban: epéntesis vocálica (e-, típica en hispanohablantes) y consonantes finales/aspiración. */
export const INSERTIONS = ["ə", "ɛ", "ɪ", "i", "d", "t", "s", "z", "k", "ɡ", "h", "l", "ɹ"];
/** Inventario inglés contra el que se prueban las hipótesis alternativas del GOP. */
export const ENGLISH = ["i", "ɪ", "eɪ", "ɛ", "æ", "ɑ", "ɔ", "oʊ", "ʊ", "u", "ʌ", "ə", "ɚ", "ɝ", "aɪ", "aʊ", "ɔɪ", "ɛɹ", "ɪɹ", "ɑɹ", "ɔɹ", "ʊɹ", "əl",
  "p", "b", "t", "d", "k", "ɡ", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ", "m", "n", "ŋ", "l", "ɹ", "w", "j", "ɾ"];

// Grupos de unidades que NO se consideran error entre sí (variación alofónica / de transcripción).
// Ajustado en TUNING: p. ej. t/ɾ/d intervocálicas en EE. UU. y ə/ɪ en sílaba átona.
export const EQUIV = [["ɾ", "t", "d"], ["ə", "ɪ", "ʌ"], ["ɚ", "ɝ"], ["ɑ", "ɔ"], ["ɑɹ", "ɔɹ"]];
export const same = (a, b) => a === b || EQUIV.some((g) => g.includes(a) && g.includes(b));

// ---------- CMUdict (ARPAbet → unidades) para frases ----------
const ARPA = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", B: "b", CH: "tʃ", D: "d", DH: "ð", EH: "ɛ", ER: "ɝ", EY: "eɪ", F: "f",
  G: "ɡ", HH: "h", IH: "ɪ", IY: "i", JH: "dʒ", K: "k", L: "l", M: "m", N: "n", NG: "ŋ", OW: "oʊ", OY: "ɔɪ", P: "p", R: "ɹ", S: "s",
  SH: "ʃ", T: "t", TH: "θ", UH: "ʊ", UW: "u", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
};
let cmu;
export function cmuUnits(word) {
  if (!cmu) {
    cmu = new Map();
    for (const line of readFileSync(join(CACHE, "cmudict", "cmudict.dict"), "utf8").split("\n")) {
      const [w, ...ph] = line.split(" ");
      if (!w || w.includes("(")) continue; // primera pronunciación solamente
      cmu.set(w, ph.filter((p) => !p.startsWith("#")));
    }
  }
  const ph = cmu.get(word.toLowerCase().replace(/[^a-z']/g, ""));
  if (!ph) return null;
  return ph.map((p) => {
    const base = p.replace(/\d/g, "");
    if (base === "AH" && p.endsWith("0")) return "ə";
    if (base === "ER" && p.endsWith("0")) return "ɚ";
    return ARPA[base];
  });
}
export const sentenceUnits = (text) => text.split(/\s+/).flatMap((w) => cmuUnits(w) ?? []);
