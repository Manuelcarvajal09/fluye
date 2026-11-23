// Ejecuta un reconocedor de fonemas CTC (ONNX, transformers.js 3.8.1 + onnxruntime-node) sobre todos los audios del manifiesto,
// sin red, y guarda las emisiones por unidad fonética para evaluate.mjs. También mide arranque en frío, latencia y memoria.
// Uso: node scripts/poc-phonemes/run-model.mjs <lv60|lv60q4|gruut|student> [--threads N] [--bench]
//   --pad S: añade S segundos de silencio antes y después de cada clip (los mp3 de la app vienen recortados al ras).
//   --bench: solo arranque en frío, latencia de 3 s y memoria (no recorre el corpus ni sobrescribe las emisiones).
import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CACHE, DATA_DIR, MODELS_DIR, ROOT, SR, loadAudio, tokenToUnits } from "./common.mjs";

export const MODELS = {
  lv60: { id: "onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX", dtype: "q8", file: "onnx/model_quantized.onnx" },
  lv60q4: { id: "onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX", dtype: "q4", file: "onnx/model_q4.onnx" },
  gruut: { id: "onnx-community/wav2vec2-ljspeech-gruut-ONNX", dtype: "q4", file: "onnx/model_q4.onnx" },
  student: { id: "air-air/xlsr-53-espeak-student-ONNX", dtype: "q4", file: "onnx/model_q4.onnx" },
};

const key = process.argv[2];
const ti = process.argv.indexOf("--threads");
const threads = ti > 0 ? Number(process.argv[ti + 1]) : 0;
const M = MODELS[key];
if (!M) throw new Error(`modelo desconocido: ${key}`);

let peak = 0;
const sampleMem = () => (peak = Math.max(peak, process.memoryUsage().rss));
const memTimer = setInterval(sampleMem, 20);

const t0 = performance.now();
const { env, AutoModelForCTC, AutoFeatureExtractor } = await import("@huggingface/transformers");
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = MODELS_DIR + "/";
const opts = { dtype: M.dtype, device: "cpu" };
if (threads) opts.session_options = { intraOpNumThreads: threads, interOpNumThreads: 1 };
const extractor = await AutoFeatureExtractor.from_pretrained(M.id);
const model = await AutoModelForCTC.from_pretrained(M.id, opts);
const tLoad = performance.now() - t0;

// Vocabulario → unidades normalizadas
const vocab = JSON.parse(readFileSync(join(MODELS_DIR, M.id, "vocab.json"), "utf8"));
const id2tok = [];
for (const [tok, id] of Object.entries(vocab)) id2tok[id] = tok;
try { for (const [tok, id] of Object.entries(JSON.parse(readFileSync(join(MODELS_DIR, M.id, "added_tokens.json"), "utf8")))) id2tok[id] = tok; } catch {}
const cfg = JSON.parse(readFileSync(join(MODELS_DIR, M.id, "config.json"), "utf8"));
const blankId = cfg.pad_token_id ?? vocab["<pad>"] ?? 0;
const blankLike = new Set([blankId]);
for (const t of ["|", " ", "<s>", "</s>", "<unk>"]) if (vocab[t] !== undefined) blankLike.add(vocab[t]);
const tokUnits = id2tok.map((t) => tokenToUnits(t));
const UNITS = [...new Set(tokUnits.filter((u) => u.length === 1).map((u) => u[0]))].sort();
const uIndex = new Map(UNITS.map((u, i) => [u, i]));

async function infer(x) {
  const inputs = await extractor(x);
  const { logits } = await model(inputs);
  const [, T, V] = logits.dims;
  const d = logits.data;
  const U = UNITS.length;
  const E = new Float32Array(T * (U + 1)); // última columna = blanco (incluye delimitador de palabra)
  const greedy = [];
  let prev = -1;
  const acc = new Float64Array(U + 1);
  for (let t = 0; t < T; t++) {
    let mx = -Infinity, arg = 0;
    for (let v = 0; v < V; v++) { const z = d[t * V + v]; if (z > mx) { mx = z; arg = v; } }
    let s = 0;
    for (let v = 0; v < V; v++) s += Math.exp(d[t * V + v] - mx);
    const lse = mx + Math.log(s);
    acc.fill(0);
    for (let v = 0; v < V; v++) {
      const p = Math.exp(d[t * V + v] - lse);
      if (blankLike.has(v)) acc[U] += p;
      else if (tokUnits[v]?.length === 1) acc[uIndex.get(tokUnits[v][0])] += p;
    }
    for (let u = 0; u <= U; u++) E[t * (U + 1) + u] = Math.log(Math.max(acc[u], 1e-12));
    if (arg !== prev && !blankLike.has(arg)) greedy.push(...(tokUnits[arg] ?? []));
    prev = arg;
  }
  return { T, E, greedy };
}

// Primera inferencia (parte del arranque en frío)
const manifest = JSON.parse(readFileSync(join(DATA_DIR, "manifest.json"), "utf8"));
const benchOnly = process.argv.includes("--bench");
const pi = process.argv.indexOf("--pad");
const pad = pi > 0 ? Number(process.argv[pi + 1]) : 0;
const padded = (x) => { if (!pad) return x; const n = Math.round(pad * SR), y = new Float32Array(x.length + 2 * n); y.set(x, n); return y; };
const files = benchOnly ? [manifest.samples[0].file] : [...new Set(manifest.samples.map((s) => s.file))];
const t1 = performance.now();
await infer(loadAudio(files[0]));
const tFirst = performance.now() - t1;

const out = { model: key, ...M, threads: threads || "default", units: UNITS, results: {} };
const per = [];
for (const [i, f] of files.entries()) {
  const x = padded(loadAudio(f));
  const s = performance.now();
  try {
    const r = await infer(x);
    const ms = performance.now() - s;
    per.push({ dur: x.length / SR, ms });
    out.results[f] = { T: r.T, dur: x.length / SR, ms, greedy: r.greedy, E: Buffer.from(r.E.buffer).toString("base64") };
  } catch (e) {
    out.results[f] = { error: String(e).slice(0, 200) };
  }
  sampleMem();
  if (i % 200 === 0) console.log(`${key} ${i}/${files.length}`);
}

// Latencia en caliente para 3 s de audio: tests/fixtures/speech.wav (3,5 s) recortado a 3,0 s, 10 repeticiones.
const base = loadAudio(join(ROOT, "tests", "fixtures", "speech.wav"));
const three = new Float32Array(3 * SR);
for (let i = 0; i < three.length; i++) three[i] = base[i % base.length];
const lat = [];
for (let k = 0; k < 10; k++) { const s = performance.now(); await infer(three); lat.push(performance.now() - s); sampleMem(); }
lat.sort((a, b) => a - b);
clearInterval(memTimer);

const dir = join(MODELS_DIR, M.id);
const sizeOf = (p) => statSync(join(dir, p)).size;
const jsons = readdirSync(dir).filter((f) => f.endsWith(".json"));
out.metrics = {
  downloadMB: +((sizeOf(M.file) + jsons.reduce((s, f) => s + sizeOf(f), 0)) / 1e6).toFixed(1),
  coldLoadMs: Math.round(tLoad),
  firstInferMs: Math.round(tFirst),
  warm3sMedianMs: Math.round(lat[4]),
  warm3sP95Ms: Math.round(lat[9]),
  warm3sAll: lat.map(Math.round),
  realTimeFactor: +(per.reduce((s, p) => s + p.ms, 0) / 1000 / per.reduce((s, p) => s + p.dur, 0)).toFixed(3),
  peakRssMB: Math.round(peak / 1e6),
  errors: Object.values(out.results).filter((r) => r.error).length,
  files: files.length,
  ortNode: JSON.parse(readFileSync(new URL("../../node_modules/onnxruntime-node/package.json", import.meta.url), "utf8")).version,
  transformersJs: JSON.parse(readFileSync(new URL("../../node_modules/@huggingface/transformers/package.json", import.meta.url), "utf8")).version,
};
mkdirSync(join(CACHE, "out"), { recursive: true });
const suffix = (threads ? `-t${threads}` : "") + (pad ? "-pad" : "") + (benchOnly ? "-bench" : "");
writeFileSync(join(CACHE, "out", `${key}${suffix}.json`), JSON.stringify(out));
console.log(JSON.stringify({ model: key, threads: out.threads, units: UNITS.length, ...out.metrics, warm3sAll: undefined }, null, 1));
