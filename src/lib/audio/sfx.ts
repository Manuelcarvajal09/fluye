"use client";
// Efectos de sonido sintetizados (sin archivos ni servicios): suaves, cortos y cálidos. Se pueden desactivar en Ajustes.
// Criterio: acompañan la acción sin llamar la atención. Lo más frecuente (tocar un botón) es casi imperceptible;
// lo raro (un cofre legendario) puede lucirse un poco más.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
export const setSfxEnabled = (v: boolean) => {
  enabled = v;
};

function out() {
  if (!ctx) return null;
  if (!master) {
    // Un filtro pasa-bajos suaviza los agudos: todo suena más «de madera» que «de alarma».
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 5200;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(lp).connect(ctx.destination);
  }
  return master;
}

/** Nota con ataque rápido y caída exponencial (tipo marimba o campanita). */
function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.1, slideTo?: number) {
  const dest = out();
  if (!ctx || !dest) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.03);
}

/** Ruido filtrado (soplo, roce o «whoosh») con barrido de frecuencia. */
function noise(start: number, dur: number, from: number, to: number, vol = 0.05, q = 1.2) {
  const dest = out();
  if (!ctx || !dest) return;
  const t = ctx.currentTime + start;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const chord = (freqs: number[], start: number, dur: number, vol: number, type: OscillatorType = "sine") => freqs.forEach((f) => tone(f, start, dur, type, vol));

export type Sfx =
  | "tap" // tocar un botón: un «tic» casi imperceptible
  | "ok" // respuesta correcta
  | "bad" // respuesta incorrecta: grave y amable, nunca un zumbido
  | "streak" // racha de aciertos
  | "done" // sesión terminada
  | "level" // subir de nivel o lograr algo
  | "gem" // gemas que llegan al contador
  | "chest-shake" // el cofre tiembla
  | "chest-charge-0" | "chest-charge-1" | "chest-charge-2" | "chest-charge-3" // la luz crece (más larga cuanto mayor la rareza)
  | "chest-open" // se abre la tapa
  | "chest-empty" // salió vacío
  | "reveal-0" | "reveal-1" | "reveal-2" | "reveal-3"; // premio normal, raro, épico o legendario

export function playSfx(kind: Sfx) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    switch (kind) {
      case "tap":
        tone(420, 0, 0.05, "sine", 0.022, 300);
        break;
      case "ok":
        tone(659, 0, 0.16, "sine", 0.075);
        tone(988, 0.08, 0.26, "sine", 0.07);
        break;
      case "bad":
        tone(233, 0, 0.2, "sine", 0.07, 196);
        tone(175, 0.11, 0.28, "sine", 0.06, 156);
        break;
      case "streak":
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.22, "sine", 0.07));
        break;
      case "done":
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.36, "triangle", 0.08));
        chord([523, 784, 1047], 0.55, 0.9, 0.04);
        break;
      case "level":
        [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.42, "triangle", 0.085));
        break;
      case "gem":
        tone(1319, 0, 0.09, "sine", 0.04);
        tone(1760, 0.05, 0.14, "sine", 0.035);
        break;
      case "chest-shake":
        // Golpecitos de madera, irregulares.
        [0, 0.11, 0.2, 0.33, 0.43].forEach((s, i) => tone(i % 2 ? 150 : 185, s, 0.07, "triangle", 0.05, 110));
        break;
      case "chest-charge-0":
        tone(330, 0, 0.5, "sine", 0.035, 440);
        break;
      case "chest-charge-1":
        tone(294, 0, 0.9, "sine", 0.04, 587);
        noise(0.2, 0.7, 600, 1800, 0.012);
        break;
      case "chest-charge-2":
        tone(262, 0, 1.3, "sine", 0.045, 784);
        tone(392, 0.3, 1.0, "sine", 0.03, 1175);
        noise(0.3, 1.0, 500, 2600, 0.018);
        break;
      case "chest-charge-3":
        tone(196, 0, 1.9, "sine", 0.05, 784);
        tone(294, 0.4, 1.5, "sine", 0.04, 1175);
        tone(392, 0.8, 1.1, "sine", 0.03, 1568);
        noise(0.4, 1.5, 400, 3600, 0.022);
        break;
      case "chest-open":
        tone(140, 0, 0.16, "triangle", 0.07, 90); // el cerrojo
        noise(0.04, 0.42, 500, 3200, 0.04, 0.8); // aire que sale
        break;
      case "chest-empty":
        noise(0, 0.38, 900, 250, 0.03, 0.7);
        tone(262, 0.12, 0.3, "sine", 0.04, 208);
        break;
      case "reveal-0":
        tone(784, 0, 0.3, "sine", 0.07);
        tone(1047, 0.09, 0.42, "sine", 0.06);
        break;
      case "reveal-1":
        [659, 831, 988, 1319].forEach((f, i) => tone(f, i * 0.08, 0.42, "sine", 0.07));
        break;
      case "reveal-2":
        [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.075, 0.5, "triangle", 0.07));
        chord([523, 659, 784], 0.5, 1.0, 0.035);
        noise(0.45, 0.6, 3000, 6000, 0.012, 2);
        break;
      case "reveal-3":
        // Fanfarria corta: arpegio, acorde abierto y un brillo final.
        [392, 523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.07, 0.6, "triangle", 0.075));
        chord([261.6, 392, 523, 659, 784], 0.6, 1.6, 0.04);
        tone(98, 0.6, 1.2, "sine", 0.06, 65); // un grave que «pesa»
        [2093, 2637, 3136].forEach((f, i) => tone(f, 0.9 + i * 0.12, 0.5, "sine", 0.03));
        noise(0.55, 0.9, 2500, 7000, 0.016, 2);
        break;
    }
  } catch {}
}

/**
 * Sonido de toque para toda la app: escucha una sola vez en el documento y suena al pulsar un control.
 * No suena en campos de texto ni en controles deshabilitados; las opciones de respuesta ya tienen su propio sonido.
 */
export function installTapSound() {
  if (typeof document === "undefined") return () => {};
  const onDown = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.("button, a.btn, .chip-btn, .nav-link, .tabbar a, .module, .card, [role='tab'], [role='radio'], [role='switch'], summary");
    if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true" || el.classList.contains("option")) return;
    if (el.matches("div, section, li")) return; // tarjetas que no son enlaces ni botones
    playSfx("tap");
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  return () => document.removeEventListener("pointerdown", onDown);
}
