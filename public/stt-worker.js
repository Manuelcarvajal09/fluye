// Reconocimiento de voz local con Whisper (base.en, cuantizado). Corre 100 % en el navegador: el audio no se envía a ningún servidor.
// transformers.js se carga desde jsDelivr (versión fija); el modelo desde Hugging Face y queda en caché del navegador.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;
let asr = null;

async function load() {
  if (asr) return;
  asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en", {
    dtype: "q8",
    device: "wasm",
    progress_callback: (p) => postMessage({ type: "progress", p }),
  });
}

self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === "load") {
      await load();
      postMessage({ type: "ready" });
    } else if (m.type === "run") {
      await load();
      const out = await asr(m.audio, { chunk_length_s: 30 });
      postMessage({ type: "result", id: m.id, text: out.text });
    }
  } catch (err) {
    postMessage({ type: "error", id: m.id, message: String(err) });
  }
};
