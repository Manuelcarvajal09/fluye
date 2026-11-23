"use client";
// Efectos de sonido sintetizados (sin archivos). Suaves y cortos; se pueden desactivar en Ajustes.

let ctx: AudioContext | null = null;
let enabled = true;
export const setSfxEnabled = (v: boolean) => {
  enabled = v;
};

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export type Sfx = "ok" | "bad" | "streak" | "done" | "level";
export function playSfx(kind: Sfx) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    if (kind === "ok") {
      tone(659, 0, 0.14);
      tone(988, 0.09, 0.22);
    } else if (kind === "bad") {
      tone(262, 0, 0.18, "triangle", 0.1);
      tone(220, 0.12, 0.24, "triangle", 0.1);
    } else if (kind === "streak") {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.2));
    } else if (kind === "done") {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.32, "triangle", 0.13));
    } else if (kind === "level") {
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.4, "triangle", 0.14));
    }
  } catch {}
}
