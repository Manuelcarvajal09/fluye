// Curva de tono (F0) por autocorrelación sobre la grabación del usuario.
// Es evidencia acústica real de la entonación (sube / baja), no una calificación.

export type PitchPoint = { t: number; hz: number | null; rms: number };

export function pitchContour(samples: Float32Array, sampleRate: number, hop = 0.02, win = 0.04): PitchPoint[] {
  const size = Math.floor(win * sampleRate);
  const step = Math.floor(hop * sampleRate);
  const minLag = Math.floor(sampleRate / 400); // 400 Hz
  const maxLag = Math.floor(sampleRate / 70); // 70 Hz
  const out: PitchPoint[] = [];
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const gate = Math.max(0.015, peak * 0.08);

  for (let start = 0; start + size + maxLag < samples.length; start += step) {
    let rms = 0;
    for (let i = 0; i < size; i++) rms += samples[start + i] ** 2;
    rms = Math.sqrt(rms / size);
    if (rms < gate) {
      out.push({ t: start / sampleRate, hz: null, rms });
      continue;
    }
    let best = -1;
    let bestLag = 0;
    let norm0 = 0;
    for (let i = 0; i < size; i++) norm0 += samples[start + i] ** 2;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      let normL = 0;
      for (let i = 0; i < size; i++) {
        sum += samples[start + i] * samples[start + i + lag];
        normL += samples[start + i + lag] ** 2;
      }
      const c = sum / Math.sqrt(norm0 * normL || 1);
      if (c > best) {
        best = c;
        bestLag = lag;
      }
    }
    out.push({ t: start / sampleRate, hz: best > 0.55 ? sampleRate / bestLag : null, rms });
  }
  // Suaviza saltos de octava sueltos con mediana de 5.
  return out.map((p, i) => {
    if (p.hz === null) return p;
    const near = out
      .slice(Math.max(0, i - 2), i + 3)
      .map((q) => q.hz)
      .filter((h): h is number => h !== null)
      .sort((a, b) => a - b);
    return { ...p, hz: near[Math.floor(near.length / 2)] };
  });
}

/** Tendencia final: compara el tono medio del último 25 % con voz contra el 25 % anterior. */
export function endingTrend(points: PitchPoint[]): "up" | "down" | "flat" | null {
  const voiced = points.filter((p) => p.hz !== null) as { hz: number }[];
  if (voiced.length < 8) return null;
  const q = Math.max(2, Math.floor(voiced.length / 4));
  const last = voiced.slice(-q).reduce((a, p) => a + p.hz, 0) / q;
  const prev = voiced.slice(-2 * q, -q).reduce((a, p) => a + p.hz, 0) / q;
  const ratio = last / prev;
  return ratio > 1.06 ? "up" : ratio < 0.94 ? "down" : "flat";
}
