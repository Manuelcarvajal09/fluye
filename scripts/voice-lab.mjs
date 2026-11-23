// Laboratorio de voces: genera frases con Kokoro (fp32) y comprueba con Whisper base que se entienden.
// Uso: node scripts/voice-lab.mjs af_heart,am_adam [carpeta-de-muestras]
import { KokoroTTS } from "kokoro-js";
import { pipeline } from "@huggingface/transformers";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const phrases = [
  "I'm looking forward to catching up with you this weekend.",
  "Could I get a medium flat white to go, please?",
  "We ran into a problem, but we figured it out.",
  "Are utilities included in the rent?",
  "I'm gonna grab some groceries and head out.",
  "Let's go over the requirements before we deploy the update.",
];
const voices = (process.argv[2] ?? "af_heart").split(",");
const outDir = process.argv[3];
if (outDir) mkdirSync(outDir, { recursive: true });

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
const asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en", { dtype: "q8" });
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const wer = (a, b) => {
  const x = norm(a).split(" "), y = norm(b).split(" ");
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return d[x.length][y.length] / x.length;
};
function mp3(samples, rate, file) {
  const pcm = Buffer.from(new Int16Array(Array.from(samples, (v) => Math.max(-1, Math.min(1, v)) * 32767)).buffer);
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(rate), "-ac", "1", "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", "48k", file], { input: pcm });
  if (r.status !== 0) throw new Error(String(r.stderr));
}
for (const v of voices) {
  let tot = 0;
  const t0 = Date.now();
  let aud = 0;
  for (let i = 0; i < phrases.length; i++) {
    const a = await tts.generate(phrases[i], { voice: v });
    aud += a.audio.length / a.sampling_rate;
    const out = await asr(a.audio, { sampling_rate: a.sampling_rate });
    tot += wer(phrases[i], out.text);
    if (outDir && i === 0) mp3(a.audio, a.sampling_rate, `${outDir}/${v}.mp3`);
  }
  console.log(`${v.padEnd(12)} error de reconocimiento ${(100 * tot / phrases.length).toFixed(0).padStart(3)}% | ${(((Date.now() - t0) / 1000) / aud).toFixed(2)}x tiempo real`);
}
