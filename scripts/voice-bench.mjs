import { KokoroTTS } from "kokoro-js";
const dtype = process.argv[2] ?? "q8";
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype, device: "cpu" });
const texts = ["I'm looking forward to catching up with you this weekend.", "Could I get a medium flat white to go, please?", "give up", "We ran into a problem, but we figured it out."];
await tts.generate("warm up", { voice: "af_heart" });
let aud = 0, t = Date.now();
for (const x of texts) { const a = await tts.generate(x, { voice: "af_heart" }); aud += a.audio.length / a.sampling_rate; }
const el = (Date.now() - t) / 1000;
console.log(`${dtype}: ${aud.toFixed(1)}s de audio en ${el.toFixed(1)}s -> ${(el / aud).toFixed(2)}x del tiempo real por proceso`);
