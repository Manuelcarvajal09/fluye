"use client";
// Reconocimiento de voz local (Whisper en un Web Worker). Indica qué palabras se entendieron; no puntúa fonemas.

export type SttStatus = { state: "idle" | "loading" | "ready" | "error"; progress: number };

let worker: Worker | null = null;
let status: SttStatus = { state: "idle", progress: 0 };
const subs = new Set<(s: SttStatus) => void>();
const files = new Map<string, { loaded: number; total: number }>();
const pending = new Map<number, { ok: (t: string) => void; fail: (e: Error) => void }>();
let nextId = 1;

const set = (s: SttStatus) => {
  status = s;
  subs.forEach((f) => f(s));
};
export const sttStatus = () => status;
export function subscribeStt(f: (s: SttStatus) => void) {
  subs.add(f);
  f(status);
  return () => void subs.delete(f);
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker("/stt-worker.js", { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data;
    if (m.type === "progress" && m.p?.file) {
      files.set(m.p.file, { loaded: m.p.loaded ?? 0, total: m.p.total ?? 0 });
      const all = [...files.values()].filter((f) => f.total > 0);
      const total = all.reduce((a, f) => a + f.total, 0);
      if (total) set({ state: "loading", progress: Math.min(0.99, all.reduce((a, f) => a + f.loaded, 0) / total) });
    } else if (m.type === "ready") set({ state: "ready", progress: 1 });
    else if (m.type === "result") {
      pending.get(m.id)?.ok(m.text);
      pending.delete(m.id);
    }
    else if (m.type === "error") {
      if (m.id && pending.has(m.id)) {
        pending.get(m.id)!.fail(new Error(m.message));
        pending.delete(m.id);
      } else set({ state: "error", progress: 0 });
    }
  };
  worker.onerror = () => set({ state: "error", progress: 0 });
  return worker;
}

/** Empieza a descargar/preparar el modelo (la primera vez ≈ 73 MB; después sale de la caché). */
export function preloadStt() {
  if (status.state === "ready" || status.state === "loading") return;
  set({ state: "loading", progress: 0 });
  ensureWorker().postMessage({ type: "load" });
}

export function transcribe(samples: Float32Array): Promise<string> {
  const w = ensureWorker();
  if (status.state === "idle" || status.state === "error") set({ state: "loading", progress: 0 });
  const id = nextId++;
  return new Promise((ok, fail) => {
    pending.set(id, { ok, fail });
    w.postMessage({ type: "run", id, audio: samples });
  });
}

/** Whisper necesita mono a 16 kHz. */
export async function resampleTo16k(buf: AudioBuffer): Promise<Float32Array> {
  const frames = Math.max(1, Math.ceil(buf.duration * 16000));
  const ctx = new OfflineAudioContext(1, frames, 16000);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
  return (await ctx.startRendering()).getChannelData(0);
}
