// Ajusta umbrales SOLO con el conjunto de AJUSTE y mide en EVALUACIÓN. Lee las emisiones de run-model.mjs.
// Uso: node scripts/poc-phonemes/evaluate.mjs <lv60|lv60q4|gruut|student>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CACHE, DATA_DIR, ENGLISH, ENGLISH_VOWELS, INSERTIONS, adaptRef, cmuUnits, readWav, rms } from "./common.mjs";
import { align, contrastIdx, gate, scoreFree, scoreGop, scorePair, sigmoid } from "./score.mjs";

const key = process.argv[2];
const run = JSON.parse(readFileSync(join(CACHE, "out", `${key}.json`), "utf8"));
const manifest = JSON.parse(readFileSync(join(DATA_DIR, "manifest.json"), "utf8"));
const asrFile = join(CACHE, "out", "whisper.json");
const asr = existsSync(asrFile) ? JSON.parse(readFileSync(asrFile, "utf8")) : {};
const units = run.units, U1 = units.length + 1;
const uIdx = new Map(units.map((u, i) => [u, i]));
const inv = new Set(units);
const eng = ENGLISH.filter((u) => uIdx.has(u));
const allowed = {
  vowels: new Set(eng.filter((u) => ENGLISH_VOWELS.has(u)).map((u) => uIdx.get(u))),
  subsV: eng.filter((u) => ENGLISH_VOWELS.has(u)).map((u) => uIdx.get(u)),
  subsC: eng.filter((u) => !ENGLISH_VOWELS.has(u)).map((u) => uIdx.get(u)),
  ins: INSERTIONS.filter((u) => uIdx.has(u)).map((u) => uIdx.get(u)),
};
for (const s of manifest.samples) {
  if (s.ref) s.ref = adaptRef(s.ref, inv);
  if (s.partnerRef) s.partnerRef = adaptRef(s.partnerRef, inv);
}
const toIdx = (seq) => (seq.every((u) => uIdx.has(u)) ? seq.map((u) => uIdx.get(u)) : null);

// ---------- 1) Precomputar puntuaciones (independientes de umbrales) ----------
const rmsCache = new Map();
const rows = [];
let tScore = 0, nScore = 0;
for (const s of manifest.samples) {
  const r = run.results[s.file];
  if (!r || r.error) { rows.push({ s, error: r?.error ?? "sin resultado" }); continue; }
  const buf = Buffer.from(r.E, "base64"); // ojo: Buffer pequeño vive en un pool compartido → respetar byteOffset
  const E = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  if (!rmsCache.has(s.file)) rmsCache.set(s.file, rms(readWav(s.file)));
  const row = { s, T: r.T, E, rms: rmsCache.get(s.file), greedy: r.greedy, dur: r.dur, inferMs: r.ms };
  const refIdx = toIdx(s.ref);
  if (!refIdx || s.ref.length === 0) { rows.push({ ...row, unscorable: "unidad fuera del inventario del modelo" }); continue; }
  const t0 = performance.now();
  row.free = scoreFree(s.ref, r.greedy);
  row.gop = scoreGop(E, r.T, U1, units, refIdx, allowed);
  if (s.partnerRef) {
    row.contrast = contrastIdx(s.ref, s.partnerRef);
    const pIdx = toIdx(s.partnerRef);
    row.pair = pIdx ? scorePair(E, r.T, U1, refIdx, pIdx) : null;
  }
  const dt = performance.now() - t0;
  if (s.kind === "phrase") { tScore += dt; nScore++; }
  rows.push(row);
  if (rows.length % 250 === 0) console.error(`puntuadas ${rows.length}/${manifest.samples.length} ${Math.round(performance.now() / 1000)} s`);
}

// ---------- 2) Decisiones con umbrales ----------
const decide = (row, th) => {
  if (row.error || row.unscorable) return { status: "error" };
  const g = gate({ rms: row.rms, E: row.E, T: row.T, U1, per: row.free.per }, th.gate);
  if (g) return { status: "gated", reason: g };
  const flagsFree = row.free.flags.map((f) => f.i);
  const flagsGop = row.gop.best.flatMap((b, i) => (b.llr > th.gop ? [i] : []));
  const pairFlag = row.pair == null ? null : row.pair > th.pair;
  return { status: "ok", flagsFree, flagsGop, pairFlag };
};

const isPair = (r) => r.s.kind === "correct" || r.s.kind === "wrong";
const pairRows = (split) => rows.filter((r) => r.s.split === split && isPair(r) && !r.unscorable && !r.error && r.contrast?.length);

function metrics(list, th) {
  const m = {};
  for (const meth of ["free", "gop", "pair"]) {
    let tp = 0, fp = 0, fn = 0, tn = 0, anyFlagCorrect = 0, nCorrect = 0, gatedCorrect = 0, gatedWrong = 0, nWrong = 0;
    for (const r of list) {
      const d = decide(r, th);
      const wrong = r.s.kind === "wrong";
      wrong ? nWrong++ : nCorrect++;
      if (d.status !== "ok") { wrong ? gatedWrong++ : gatedCorrect++; continue; }
      let atContrast, any;
      if (meth === "pair") { atContrast = d.pairFlag; any = d.pairFlag; }
      else {
        const f = meth === "free" ? d.flagsFree : d.flagsGop;
        atContrast = f.some((i) => r.contrast.includes(i));
        any = f.length > 0;
      }
      if (wrong) atContrast ? tp++ : fn++;
      else { atContrast ? fp++ : tn++; if (any) anyFlagCorrect++; }
    }
    const evalCorrect = nCorrect - gatedCorrect;
    m[meth] = {
      tp, fp, fn, tn,
      precision: tp + fp ? +(tp / (tp + fp)).toFixed(3) : null,
      recall: tp + fn ? +(tp / (tp + fn)).toFixed(3) : null,
      falseCorrectionContrast: evalCorrect ? +(fp / evalCorrect).toFixed(3) : null,
      falseCorrectionAny: evalCorrect ? +(anyFlagCorrect / evalCorrect).toFixed(3) : null,
      gatedCorrect, gatedWrong, nCorrect, nWrong,
    };
  }
  return m;
}

// ---------- 3) Ajuste (solo TUNING) ----------
const tuning = pairRows("tuning");
const grid = (a, b, st) => Array.from({ length: Math.round((b - a) / st) + 1 }, (_, i) => +(a + i * st).toFixed(2));
// Compuerta: el PER máximo se elige para no rechazar más del 2 % de los pares de AJUSTE (correctos y erróneos)
// y a la vez rechazar todas las frases "distintas" de AJUSTE.
const tuneRows = rows.filter((r) => r.s.split === "tuning" && !r.error && !r.unscorable && r.free);
const diffTune = tuneRows.filter((r) => r.s.kind === "different").map((r) => r.free.per);
const pairPer = tuneRows.filter(isPair).map((r) => r.free.per).sort((a, b) => a - b);
const per98 = pairPer[Math.floor(pairPer.length * 0.98)] ?? 0.75;
const maxPer = +Math.max(0.5, Math.min(per98 + 0.01, Math.min(...diffTune, 1) - 0.01)).toFixed(2);
// Mínimo de tramas con voz: el mayor valor (1–3) que no deja "sin voz" a más del 1 % de los pares de AJUSTE.
const speechFrames = (r) => { let n = 0; for (let t = 0; t < r.T; t++) if (r.E[t * U1 + U1 - 1] < Math.log(0.5)) n++; return n; };
const tunePairs = tuneRows.filter(isPair);
const minSpeechFrames = [3, 2, 1].find((k) => tunePairs.filter((r) => speechFrames(r) < k).length <= 0.01 * tunePairs.length) ?? 1;
const gateTh = { minRms: 0.003, maxPer, minSpeechFrames };
// GOP y par: el umbral más bajo con falsa corrección ≤ 5 % en AJUSTE (margen frente al 10 % del criterio).
const pickTau = (meth, field) => {
  for (const t of grid(-4, 20, 0.25)) {
    const th = { gate: gateTh, gop: t, pair: t };
    const mm = metrics(tuning, th)[meth];
    if ((mm[field] ?? 1) <= 0.05) return t;
  }
  return 20;
};
const tauGop = pickTau("gop", "falseCorrectionAny");
const tauPair = pickTau("pair", "falseCorrectionContrast");
const TH = { gate: gateTh, gop: tauGop, pair: tauPair };

// ---------- 4) Evaluación ----------
const evalPairs = pairRows("eval");
const res = { model: key, engine: `${run.id} (${run.dtype})`, thresholds: TH, metricsRun: run.metrics };
res.tuning = metrics(tuning, TH);
res.eval = metrics(evalPairs, TH);
res.evalByVoice = Object.fromEntries(["af_heart", "am_adam"].map((v) => [v, metrics(evalPairs.filter((r) => r.s.voice === v), TH)]));
res.excluded = {
  sinContraste: rows.filter((r) => isPair(r) && r.contrast && r.contrast.length === 0).length,
  fueraInventario: rows.filter((r) => r.unscorable).length,
  errores: rows.filter((r) => r.error).length,
};

// Por sonido (EVAL, método par y GOP): recall y falsa corrección
const bySound = {};
for (const r of evalPairs) {
  const b = (bySound[r.s.sound] ??= []);
  b.push(r);
}
res.bySound = Object.fromEntries(Object.entries(bySound).map(([k, l]) => { const m = metrics(l, TH); return [k, { pairRecall: m.pair.recall, pairFC: m.pair.falseCorrectionContrast, gopRecall: m.gop.recall, gopFC: m.gop.falseCorrectionAny, n: l.length }]; }));

// Variantes válidas (Reino Unido) y casos de fallo controlado
const evalOf = (k) => rows.filter((r) => r.s.split === "eval" && r.s.kind === k);
const summarize = (list) => {
  const d = list.map((r) => ({ r, d: decide(r, TH) }));
  const ok = d.filter((x) => x.d.status === "ok");
  return {
    n: list.length,
    gated: d.filter((x) => x.d.status === "gated").length,
    reasons: d.reduce((m, x) => ((m[x.d.reason ?? x.d.status] = (m[x.d.reason ?? x.d.status] ?? 0) + 1), m), {}),
    anyFlagFree: ok.filter((x) => x.d.flagsFree.length).length,
    anyFlagGop: ok.filter((x) => x.d.flagsGop.length).length,
    contrastFlagGop: ok.filter((x) => x.r.contrast && x.d.flagsGop.some((i) => x.r.contrast.includes(i))).length,
    pairFlag: ok.filter((x) => x.d.pairFlag).length,
    evaluated: ok.length,
  };
};
res.variantsUK = summarize(evalOf("variant").filter((r) => r.contrast?.length && !r.unscorable));
res.phrases = summarize(evalOf("phrase"));
res.different = summarize(evalOf("different"));
res.silence = summarize(evalOf("silence"));
res.noise = summarize(evalOf("noise"));

// Omisión: se detecta si al menos la mitad de los fonemas de la palabra quitada quedan marcados (GOP) o borrados (libre)
const om = evalOf("omission");
const wordSpan = (s) => {
  const words = s.target.replace(/[.,!?]/g, "").split(/\s+/);
  let start = 0;
  for (let j = 0; j < s.droppedIndex; j++) start += adaptRef(cmuUnits(words[j]) ?? [], inv).length;
  return start;
};
let omFree = 0, omGop = 0, omGated = 0;
for (const r of om) {
  const d = decide(r, TH);
  if (d.status !== "ok") { omGated++; continue; }
  const st = wordSpan(r.s), len = adaptRef(cmuUnits(r.s.droppedWord) ?? [], inv).length;
  const inSpan = (i) => i >= st && i < st + len;
  if (d.flagsFree.filter(inSpan).length >= len / 2) omFree++;
  if (d.flagsGop.filter(inSpan).length >= len / 2) omGop++;
}
res.omission = { n: om.length, gated: omGated, detectedFree: omFree, detectedGop: omGop };

// Contrastes "idénticos para el ASR de palabras": muestras erróneas que Whisper base.en transcribe como la palabra objetivo
const norm = (t) => (t ?? "").toLowerCase().replace(/[^a-z']/g, "");
const asrSame = evalPairs.filter((r) => r.s.kind === "wrong" && asr[r.s.file] !== undefined && norm(asr[r.s.file]) === norm(r.s.target));
res.asrIdentical = { n: asrSame.length, withAsr: Object.keys(asr).length > 0, ...(asrSame.length ? { pair: metrics(asrSame, TH).pair, gop: metrics(asrSame, TH).gop } : {}) };
const asrWrongAccept = evalPairs.filter((r) => r.s.kind === "wrong" && asr[r.s.file] !== undefined);
res.asrIdentical.ofWrong = asrWrongAccept.length;

// Calibración de la confianza (GOP en EVAL): precisión por tramo de sigmoide(LLR) en marcas sobre el fonema en contraste
const buckets = [[0.5, 0.9], [0.9, 0.99], [0.99, 0.9999], [0.9999, 1.01]];
res.calibration = buckets.map(([a, b]) => {
  let tp = 0, fp = 0;
  for (const r of evalPairs) {
    const d = decide(r, TH);
    if (d.status !== "ok") continue;
    for (const i of r.contrast) {
      const c = sigmoid(r.gop.best[i].llr);
      if (r.gop.best[i].llr > TH.gop && c >= a && c < b) r.s.kind === "wrong" ? tp++ : fp++;
    }
  }
  return { range: `${a}–${Math.min(b, 1)}`, tp, fp, precision: tp + fp ? +(tp / (tp + fp)).toFixed(3) : null };
});

// Confianza utilizable en la UI (método par): precisión empírica por margen sobre el umbral (tramos fijados de antemano).
res.pairConfidence = [[0, 2, "baja"], [2, 5, "media"], [5, Infinity, "alta"]].map(([a, b, label]) => {
  let tp = 0, fp = 0;
  for (const r of evalPairs) {
    const d = decide(r, TH);
    if (d.status !== "ok" || !d.pairFlag) continue;
    const m = r.pair - TH.pair;
    if (m >= a && m < b) r.s.kind === "wrong" ? tp++ : fp++;
  }
  return { label, margin: `[${a}, ${b})`, tp, fp, precision: tp + fp ? +(tp / (tp + fp)).toFixed(3) : null };
});

// Ejemplos de fallos (EVAL): errores no detectados y correcciones falsas del método par
const ex = [];
for (const r of evalPairs) {
  const d = decide(r, TH);
  if (d.status !== "ok") { ex.push(`${r.s.kind} ${r.s.voice} objetivo=${r.s.target} dicho=${r.s.said}: no evaluable (${d.reason}), oído=/${r.greedy.join("")}/`); continue; }
  const wrong = r.s.kind === "wrong";
  if (wrong !== d.pairFlag) ex.push(`${wrong ? "NO DETECTADO" : "FALSA CORRECCIÓN"} ${r.s.voice} objetivo=${r.s.target} dicho=${r.s.said} LLR=${r.pair.toFixed(2)} oído=/${r.greedy.join("")}/ ref=/${r.s.ref.join("")}/`);
}
res.failures = ex;
res.human = rows.filter((r) => r.s.kind === "human").map((r) => {
  const d = decide(r, TH);
  return { heard: r.greedy.join(" "), ref: r.s.ref.join(" "), per: r.free && +r.free.per.toFixed(2), dur: r.dur, status: d.status, reason: d.reason, gopFlags: d.flagsGop?.map((i) => `${r.s.ref[i]}→${r.gop.best[i].alt}`) };
});
res.scoringMsPhrase = nScore ? Math.round(tScore / nScore) : null;
res.examples = rows.filter((r) => r.s.split === "eval" && r.s.voice === "af_heart" && ["ship", "think", "very"].includes(r.s.target)).map((r) => {
  const d = decide(r, TH);
  return { kind: r.s.kind, target: r.s.target, said: r.s.said, heard: r.greedy.join(" "), ref: r.s.ref.join(" "), pairLLR: r.pair?.toFixed(2), pairConf: r.pair != null ? sigmoid(r.pair).toFixed(3) : null, gop: d.status === "ok" ? d.flagsGop.map((i) => `${r.s.ref[i]}→${r.gop.best[i].alt} (${sigmoid(r.gop.best[i].llr).toFixed(2)})`) : d.reason };
});

writeFileSync(join(CACHE, "out", `eval-${key}.json`), JSON.stringify(res, null, 1));
const brief = { model: key, human: res.human, thresholds: TH, eval: res.eval, variantsUK: res.variantsUK, phrases: res.phrases, different: res.different, silence: res.silence, noise: res.noise, omission: res.omission, asrIdentical: res.asrIdentical, calibration: res.calibration, pairConfidence: res.pairConfidence, scoringMsPhrase: res.scoringMsPhrase, excluded: res.excluded, nFailures: ex.length };
console.log(JSON.stringify(brief, null, 1));
