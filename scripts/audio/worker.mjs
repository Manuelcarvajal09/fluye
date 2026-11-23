// Trabajador: genera con Kokoro (fp32) los clips que le tocan y los guarda como mp3 mono de 32 kbps.
import { createRequire } from "node:module";
import { KokoroTTS } from "kokoro-js";

// kokoro-js no permite configurar hilos: se fijan interceptando InferenceSession.create (evita que varios procesos se pisen).
const threads = Number(process.env.ORT_THREADS ?? 3);
const require = createRequire(import.meta.url);
const ort = require(require.resolve("onnxruntime-node", { paths: [require.resolve("@huggingface/transformers")] }));
const create = ort.InferenceSession.create.bind(ort.InferenceSession);
ort.InferenceSession.create = (a, opts = {}, ...rest) => create(a, { ...opts, intraOpNumThreads: threads, interOpNumThreads: 1 }, ...rest);
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { cachePath, voices } from "./lib.mjs";

const [listFile, shardStr, shardsStr, progressFile] = process.argv.slice(2);
const shard = Number(shardStr), shards = Number(shardsStr);
const clips = JSON.parse(readFileSync(listFile, "utf8")).filter((_, i) => i % shards === shard);

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });

for (const c of clips) {
  const file = cachePath(c.voice, c.text);
  try {
    const a = await tts.generate(c.text, { voice: c.voice, speed: voices.speed ?? 1 });
    const pcm = Buffer.alloc(a.audio.length * 2);
    for (let i = 0; i < a.audio.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a.audio[i])) * 32767), i * 2);
    mkdirSync(dirname(file), { recursive: true });
    const tmp = file + ".tmp.mp3";
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(a.sampling_rate), "-ac", "1", "-i", "pipe:0", "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse", "-c:a", "libmp3lame", "-b:a", "32k", tmp], { input: pcm });
    if (r.status !== 0) throw new Error(String(r.stderr));
    renameSync(tmp, file);
    appendFileSync(progressFile, "1");
  } catch (e) {
    appendFileSync(progressFile + ".err", `${c.voice} | ${c.text} | ${String(e).slice(0, 120)}\n`);
  }
}
