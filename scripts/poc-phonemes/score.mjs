// Lógica de puntuación (la parte que viviría en el Web Worker): alineación CTC forzada contra los fonemas de referencia,
// "goodness of pronunciation" por sustitución/omisión/inserción, comparación con el par mínimo y compuertas de fallo controlado.
// No depende de Node: solo aritmética sobre la matriz de emisiones E (T × (U+1), log-probabilidades, última columna = blanco).
import { same } from "./common.mjs";

const NEG = -1e30;
const lse = (a, b) => (a === NEG ? b : b === NEG ? a : a > b ? a + Math.log1p(Math.exp(b - a)) : b + Math.log1p(Math.exp(a - b)));

/** log P(seq | audio) con el algoritmo forward de CTC. seq: índices de unidad (sin blancos). */
export function ctcLogLik(E, T, U1, seq) {
  const B = U1 - 1, S = 2 * seq.length + 1;
  if (seq.length === 0) { let s = 0; for (let t = 0; t < T; t++) s += E[t * U1 + B]; return s; }
  const lab = (s) => (s % 2 === 0 ? B : seq[(s - 1) >> 1]);
  let a = new Float64Array(S).fill(NEG), n = new Float64Array(S);
  a[0] = E[B]; a[1] = E[lab(1)];
  for (let t = 1; t < T; t++) {
    n.fill(NEG);
    const off = t * U1;
    for (let s = 0; s < S; s++) {
      let v = a[s];
      if (s > 0) v = lse(v, a[s - 1]);
      if (s > 1 && s % 2 === 1 && lab(s) !== lab(s - 2)) v = lse(v, a[s - 2]);
      n[s] = v === NEG ? NEG : v + E[off + lab(s)];
    }
    [a, n] = [n, a];
  }
  return lse(a[S - 1], a[S - 2]);
}

/** Alineación de Levenshtein (match si same()); devuelve operaciones sobre la referencia. */
export function align(ref, hyp) {
  const n = ref.length, m = hyp.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (same(ref[i - 1], hyp[j - 1]) ? 0 : 1));
  const ops = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (same(ref[i - 1], hyp[j - 1]) ? 0 : 1)) {
      ops.push({ op: same(ref[i - 1], hyp[j - 1]) ? "ok" : "sub", i: i - 1, heard: hyp[j - 1] }); i--; j--;
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push({ op: "del", i: i - 1 }); i--; }
    else { ops.push({ op: "ins", i: Math.max(0, i - 1), heard: hyp[j - 1] }); j--; }
  }
  return { dist: D[n][m], ops: ops.reverse() };
}

/** Índices de la referencia donde difiere del compañero del par mínimo (el "fonema en contraste"). */
export function contrastIdx(ref, partner) {
  return [...new Set(align(ref, partner).ops.filter((o) => o.op !== "ok").map((o) => o.i))];
}

/** Método 1: reconocimiento libre (greedy) + alineación de Levenshtein contra la referencia. */
export function scoreFree(ref, greedy) {
  const { dist, ops } = align(ref, greedy);
  const flags = ops.filter((o) => o.op !== "ok").map((o) => ({ i: o.i, op: o.op, heard: o.heard ?? null }));
  return { per: ref.length ? dist / ref.length : 1, flags };
}

/**
 * Método 2: GOP por hipótesis alternativas. Para cada fonema i de la referencia compara log P(ref) con la mejor variante:
 * sustituirlo por otra unidad de su misma clase (vocal↔vocal, consonante↔consonante), borrarlo, o insertar después una
 * unidad del conjunto de inserciones (epéntesis y consonantes finales). LLR > tau ⇒ se marca; confianza = sigmoide(LLR).
 * alt = { vowels: Set<idx>, subsV: idx[], subsC: idx[], ins: idx[] }
 */
export function scoreGop(E, T, U1, units, refIdx, alt) {
  const base = ctcLogLik(E, T, U1, refIdx);
  const L = refIdx.length;
  const best = Array.from({ length: L }, () => ({ llr: -Infinity, alt: null }));
  const put = (i, llr, a) => { if (llr > best[i].llr) best[i] = { llr, alt: a }; };
  for (let i = 0; i < L; i++) {
    const pool = alt.vowels.has(refIdx[i]) ? alt.subsV : alt.subsC;
    for (const u of pool) {
      if (same(units[u], units[refIdx[i]])) continue;
      const s = refIdx.slice(); s[i] = u;
      put(i, ctcLogLik(E, T, U1, s) - base, units[u]);
    }
    if (L > 1) put(i, ctcLogLik(E, T, U1, refIdx.filter((_, k) => k !== i)) - base, "∅");
  }
  for (let g = 0; g <= L; g++) for (const u of alt.ins) {
    const s = [...refIdx.slice(0, g), u, ...refIdx.slice(g)];
    put(Math.max(0, g - 1), ctcLogLik(E, T, U1, s) - base, "+" + units[u]);
  }
  return { base, best };
}

/** Método 3: par mínimo conocido. LLR = log P(compañero) − log P(objetivo). */
export const scorePair = (E, T, U1, refIdx, partnerIdx) => ctcLogLik(E, T, U1, partnerIdx) - ctcLogLik(E, T, U1, refIdx);

/** Compuertas de fallo controlado: devuelve un motivo (no evaluable) o null. */
export function gate({ rms, E, T, U1, per }, { minRms, maxPer, minSpeechFrames }) {
  if (rms < minRms) return "silencio";
  let speech = 0;
  for (let t = 0; t < T; t++) if (E[t * U1 + U1 - 1] < Math.log(0.5)) speech++;
  if (speech < minSpeechFrames) return "sin-voz";
  if (per > maxPer) return "no-coincide";
  return null;
}

export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
