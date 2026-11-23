"use client";
// Motor de voz con dos motores:
//  - "hd": voces neuronales (Kokoro) pre-generadas, servidas como archivos. Suenan igual en cualquier dispositivo.
//  - "device": la síntesis del propio dispositivo (Web Speech), como respaldo y para quien la prefiera.
// Si un clip HD no existe, se usa la voz del dispositivo automáticamente.
import { clipKey } from "./key";
import { DEFAULT_HD, resolveVoice } from "./voices";

export type TtsPrefs = { engine?: "hd" | "device"; hdVoice?: string; voice?: string; rate?: number; accent?: "en-US" | "en-CA"; autoplay?: boolean };
export type SpeakOpts = { rate?: number; speaker?: string; partner?: boolean };

let prefs: TtsPrefs = {};
export const setTtsPrefs = (p: TtsPrefs) => {
  prefs = { ...prefs, ...p };
};
export const autoplayEnabled = () => prefs.autoplay !== false;
const mainVoice = () => prefs.hdVoice || DEFAULT_HD;

/* ───────── Elemento de audio compartido (iOS solo permite reproducir tras un gesto si se reutiliza el mismo) ───────── */
let el: HTMLAudioElement | null = null;
let current: { stop: () => void } | null = null;
const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

function audioEl() {
  if (!el) {
    el = new Audio();
    el.preload = "auto";
  }
  return el;
}

/** Llamar en el primer toque del usuario: desbloquea la reproducción automática en iPhone/iPad. */
export function unlockAudio() {
  try {
    const a = audioEl();
    if (a.dataset.unlocked) return;
    a.dataset.unlocked = "1";
    a.src = SILENT;
    void a.play().catch(() => {});
  } catch {}
}

/* ───────── Índice de clips HD ───────── */
type Index = { packs: string[]; clips: Record<string, [number, number, number]>; coverage?: Record<string, { count: number; total: number; scope?: string }> };
let indexP: Promise<Index | null> | null = null;
export const loadAudioIndex = () => (indexP ??= fetch("/audio/index.json").then((r) => (r.ok ? (r.json() as Promise<Index>) : null)).catch(() => null));

/** Voces con cobertura suficiente (>= 90 % de sus clips) para elegirlas como voz principal. */
export async function availableHdVoices(): Promise<Record<string, number>> {
  const idx = await loadAudioIndex();
  const out: Record<string, number> = {};
  // -1 = voz solo de diálogos (personajes e interlocutor): no se puede elegir como voz principal.
  for (const [v, c] of Object.entries(idx?.coverage ?? {})) out[v] = c.scope === "dialogue" ? -1 : c.total ? c.count / c.total : 0;
  return out;
}

const blobs = new Map<string, Blob>();
async function clipBlob(voice: string, text: string): Promise<Blob | null> {
  const idx = await loadAudioIndex();
  if (!idx) return null;
  const key = await clipKey(voice, text);
  const hit = blobs.get(key);
  if (hit) return hit;
  const e = idx.clips[key];
  if (!e) return null;
  const [pack, off, len] = e;
  try {
    const res = await fetch(`/audio/${idx.packs[pack]}`, { headers: { Range: `bytes=${off}-${off + len - 1}` } });
    const buf = res.status === 206 ? await res.arrayBuffer() : (await res.arrayBuffer()).slice(off, off + len);
    const b = new Blob([buf], { type: "audio/mpeg" });
    blobs.set(key, b);
    if (blobs.size > 300) blobs.delete(blobs.keys().next().value!);
    return b;
  } catch {
    return null;
  }
}

/** Descarga por adelantado los clips que se van a necesitar. */
export function prefetchClips(texts: string[], opts: SpeakOpts = {}) {
  if (prefs.engine === "device") return;
  const voice = resolveVoice({ main: mainVoice(), speaker: opts.speaker, partner: opts.partner });
  for (const t of texts.slice(0, 12)) void clipBlob(voice, t);
}

function playBlob(b: Blob, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const a = audioEl();
    const url = URL.createObjectURL(b);
    const done = () => {
      a.onended = a.onerror = null;
      current = null;
      URL.revokeObjectURL(url);
      resolve();
    };
    current = { stop: () => { a.pause(); done(); } };
    a.onended = done;
    a.onerror = done;
    a.src = url;
    a.playbackRate = rate;
    a.preservesPitch = true;
    a.play().catch(done);
  });
}

/* ───────── Voz del dispositivo ───────── */
const QUALITY = /(natural|neural|premium|enhanced|siri|google us english|samantha|ava|zoe|evan|nathan|aria|jenny|guy|online)/i;

export function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return speechSynthesis
    .getVoices()
    .filter((v) => /^en[-_](US|CA)/i.test(v.lang))
    .sort((a, b) => Number(QUALITY.test(b.name)) - Number(QUALITY.test(a.name)) || Number(b.localService) - Number(a.localService));
}

function pickVoice(accent: string) {
  const voices = englishVoices();
  if (prefs.voice) {
    const chosen = voices.find((v) => v.voiceURI === prefs.voice || v.name === prefs.voice);
    if (chosen) return chosen;
  }
  const norm = accent.replace("_", "-").toLowerCase();
  return voices.find((v) => v.lang.replace("_", "-").toLowerCase() === norm) ?? voices[0];
}

export const ttsAvailable = () => typeof window !== "undefined" && "speechSynthesis" in window;

function speakDevice(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsAvailable()) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\[\]]/g, ""));
    const accent = prefs.accent ?? "en-US";
    u.lang = accent;
    const v = pickVoice(accent);
    if (v) u.voice = v;
    u.rate = Math.max(0.5, Math.min(1.4, 0.95 * rate));
    const done = () => {
      current = null;
      resolve();
    };
    current = { stop: () => { speechSynthesis.cancel(); done(); } };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

/* ───────── API pública ───────── */
/** Habla el texto. Resuelve al terminar (o al cancelarse). `rate` es un multiplicador (0.7 = lento). */
export async function speak(text: string, opts: SpeakOpts = {}): Promise<void> {
  stopCurrent();
  const rate = (prefs.rate ?? 1) * (opts.rate ?? 1);
  if (prefs.engine !== "device") {
    const voice = resolveVoice({ main: mainVoice(), speaker: opts.speaker, partner: opts.partner });
    const b = await clipBlob(voice, text);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("fluye:voice", { detail: { fallback: !b } }));
    if (b) return playBlob(b, Math.max(0.5, Math.min(1.5, rate)));
  }
  return speakDevice(text, rate);
}

let seqToken = 0;
/** Reproduce varias líneas una tras otra con una pausa entre cada una (para distinguir a quien habla). */
export async function speakSequence(lines: { text: string; speaker?: string; partner?: boolean; rate?: number }[], opts: { gap?: number; onLine?: (i: number | null) => void } = {}) {
  const token = ++seqToken;
  for (let i = 0; i < lines.length; i++) {
    if (token !== seqToken) return;
    opts.onLine?.(i);
    await speak(lines[i].text, lines[i]);
    if (token !== seqToken) return;
    await new Promise((r) => setTimeout(r, opts.gap ?? 900));
  }
  if (token === seqToken) opts.onLine?.(null);
}

function stopCurrent() {
  current?.stop();
  if (ttsAvailable()) speechSynthesis.cancel();
}

/** Detiene todo: la línea que suena y cualquier secuencia pendiente. */
export function stopSpeaking() {
  seqToken++;
  stopCurrent();
}

/** Las voces del dispositivo cargan de forma asíncrona en Chrome. */
export function onVoicesReady(cb: () => void) {
  if (!ttsAvailable()) return () => {};
  if (speechSynthesis.getVoices().length) cb();
  speechSynthesis.addEventListener("voiceschanged", cb);
  return () => speechSynthesis.removeEventListener("voiceschanged", cb);
}
