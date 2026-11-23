// Transcribe con el mismo ASR de palabras que usa la app (Whisper base.en, transformers.js, ya en caché local) los audios de
// pares mínimos de EVALUACIÓN, para encontrar los contrastes que un ASR de palabras "da por buenos".
// Uso: node scripts/poc-phonemes/whisper.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CACHE, DATA_DIR, loadAudio } from "./common.mjs";

const { env, pipeline } = await import("@huggingface/transformers");
env.allowRemoteModels = false; // usa node_modules/@huggingface/transformers/.cache (descargado por la app)
const asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en", { dtype: { encoder_model: "q8", decoder_model_merged: "q8" }, device: "cpu" });
const manifest = JSON.parse(readFileSync(join(DATA_DIR, "manifest.json"), "utf8"));
const files = [...new Set(manifest.samples.filter((s) => s.split === "eval" && (s.kind === "correct" || s.kind === "wrong")).map((s) => s.file))];
const out = {};
for (const [i, f] of files.entries()) {
  const r = await asr(loadAudio(f));
  out[f] = r.text.trim();
  if (i % 100 === 0) console.log(`${i}/${files.length} ${out[f]}`);
}
mkdirSync(join(CACHE, "out"), { recursive: true });
writeFileSync(join(CACHE, "out", "whisper.json"), JSON.stringify(out, null, 1));
console.log(`ok ${files.length}`);
