// Descarga (una sola vez) los pesos candidatos y CMUdict a .poc-cache/, fijados por commit.
// Uso: node scripts/poc-phonemes/download.mjs [lv60|lv60q4|gruut|student|cmudict ...]   (sin argumentos: todo)
// Es el ÚNICO script del PoC que usa la red; el resto se ejecuta sin conexión.
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { CACHE, MODELS_DIR } from "./common.mjs";

const JSONS = ["config.json", "preprocessor_config.json", "vocab.json", "tokenizer_config.json", "special_tokens_map.json"];
export const SOURCES = {
  lv60: { repo: "onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX", rev: "c69750f5043e5e1f8a71ab95dd3b98338c280c92", files: [...JSONS, "onnx/model_quantized.onnx"] },
  lv60q4: { repo: "onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX", rev: "c69750f5043e5e1f8a71ab95dd3b98338c280c92", files: [...JSONS, "onnx/model_q4.onnx"] },
  gruut: { repo: "onnx-community/wav2vec2-ljspeech-gruut-ONNX", rev: "263beb019ab71cb258a97a35b0e10db9a4ddb670", files: [...JSONS, "added_tokens.json", "onnx/model_q4.onnx"] },
  student: { repo: "air-air/xlsr-53-espeak-student-ONNX", rev: "5f7232263ceb005be09efaf2ff702d90dbce75c3", files: [...JSONS, "onnx/model_q4.onnx"] },
};
const CMU = { rev: "74790861f652b15e4ac49015a90074ad62a27690", files: ["cmudict.dict", "LICENSE"] };

async function get(url, dest) {
  if (existsSync(dest)) return statSync(dest).size;
  mkdirSync(dirname(dest), { recursive: true });
  const r = await fetch(url, { headers: { "user-agent": "poc-client" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const tmp = dest + ".part";
  await pipeline(Readable.fromWeb(r.body), createWriteStream(tmp));
  renameSync(tmp, dest);
  return statSync(dest).size;
}

const want = process.argv.slice(2);
const pick = (k) => want.length === 0 || want.includes(k);
const manifest = {};
for (const [key, s] of Object.entries(SOURCES)) {
  if (!pick(key)) continue;
  let total = 0;
  for (const f of s.files) {
    const n = await get(`https://huggingface.co/${s.repo}/resolve/${s.rev}/${f}`, join(MODELS_DIR, s.repo, f)).catch((e) => {
      if (f.endsWith(".json") && !f.startsWith("config") && !f.startsWith("vocab") && !f.startsWith("preproc")) return 0; // opcionales
      throw e;
    });
    total += n;
    console.log(`${key}  ${f}  ${(n / 1e6).toFixed(1)} MB`);
  }
  manifest[key] = { ...s, bytes: total };
  console.log(`${key}: total ${(total / 1e6).toFixed(1)} MB`);
}
if (pick("cmudict")) {
  for (const f of CMU.files) await get(`https://raw.githubusercontent.com/cmusphinx/cmudict/${CMU.rev}/${f}`, join(CACHE, "cmudict", f));
  manifest.cmudict = CMU;
  console.log("cmudict ok");
}
writeFileSync(join(CACHE, `manifest-${Date.now()}.json`), JSON.stringify(manifest, null, 2));
