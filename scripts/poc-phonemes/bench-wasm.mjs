// Aproxima el coste en el NAVEGADOR: mismo .onnx ejecutado con onnxruntime-web (backend WASM, el que usa transformers.js
// en un Web Worker sin WebGPU), en Node. La app no envía COOP/COEP, así que en el navegador WASM corre con 1 hilo.
// Uso: node scripts/poc-phonemes/bench-wasm.mjs <lv60|lv60q4|gruut|student> [hilos=1] [segundos=3]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MODELS_DIR, ROOT, SR, loadAudio } from "./common.mjs";
import * as ort from "onnxruntime-web";

const FILES = { lv60: ["onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX", "onnx/model_quantized.onnx"], lv60q4: ["onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX", "onnx/model_q4.onnx"], gruut: ["onnx-community/wav2vec2-ljspeech-gruut-ONNX", "onnx/model_q4.onnx"], student: ["air-air/xlsr-53-espeak-student-ONNX", "onnx/model_q4.onnx"] };
const [key, th = "1", secs = "3"] = process.argv.slice(2);
const [id, file] = FILES[key];
ort.env.wasm.numThreads = Number(th);

let peak = 0;
const mem = setInterval(() => (peak = Math.max(peak, process.memoryUsage().rss)), 20);
const t0 = performance.now();
const sess = await ort.InferenceSession.create(readFileSync(join(MODELS_DIR, id, file)), { executionProviders: ["wasm"] });
const tLoad = performance.now() - t0;

const base = loadAudio(join(ROOT, "tests", "fixtures", "speech.wav")); // 3,5 s de voz; se usan 3,0 s
const x = new Float32Array(Math.round(Number(secs) * SR));
for (let i = 0; i < x.length; i++) x[i] = base[i % base.length];
// Normalización de Wav2Vec2FeatureExtractor (media 0, varianza 1)
const mean = x.reduce((a, b) => a + b, 0) / x.length;
const sd = Math.sqrt(x.reduce((a, b) => a + (b - mean) ** 2, 0) / x.length + 1e-7);
const xin = x.map((v) => (v - mean) / sd);
const feeds = { input_values: new ort.Tensor("float32", xin, [1, xin.length]) };
if (sess.inputNames.includes("attention_mask")) feeds.attention_mask = new ort.Tensor("int64", BigInt64Array.from({ length: xin.length }, () => 1n), [1, xin.length]);
const lat = [];
for (let k = 0; k < 6; k++) { const s = performance.now(); await sess.run(feeds); lat.push(performance.now() - s); }
clearInterval(mem);
const warm = lat.slice(1).sort((a, b) => a - b);
console.log(JSON.stringify({ model: key, backend: "onnxruntime-web wasm", threads: Number(th), seconds: Number(secs), loadMs: Math.round(tLoad), firstMs: Math.round(lat[0]), warm3sMedianMs: Math.round(warm[2]), warm3sMaxMs: Math.round(warm[4]), peakRssMB: Math.round(peak / 1e6) }));
