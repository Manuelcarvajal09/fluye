"use client";
import { useEffect, useMemo, useState } from "react";
import { alignWords, words, type WordOp } from "@/lib/answer";
import { AudioButton } from "./ui";

/** Pausas largas dentro de la frase (entre la primera y la última voz), medidas en la propia grabación. */
export function pauseStats(buf: AudioBuffer | null) {
  if (!buf) return null;
  const x = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const frame = Math.round(sr * 0.02);
  const rms: number[] = [];
  for (let i = 0; i + frame <= x.length; i += frame) {
    let s = 0;
    for (let k = i; k < i + frame; k++) s += x[k] * x[k];
    rms.push(Math.sqrt(s / frame));
  }
  const peak = Math.max(...rms, 1e-6);
  const voiced = rms.map((r) => r > peak * 0.12);
  const first = voiced.indexOf(true), last = voiced.lastIndexOf(true);
  if (first < 0 || last - first < 10) return null;
  let pauses = 0, run = 0, longest = 0;
  for (let i = first; i <= last; i++) {
    if (!voiced[i]) run++;
    else {
      if (run * 20 >= 400) pauses++;
      longest = Math.max(longest, run * 20);
      run = 0;
    }
  }
  return { seconds: ((last - first) * 20) / 1000, pauses, longest };
}

type Terms = Record<string, string>;
let termsCache: Promise<Terms> | null = null;
const loadTerms = () => (termsCache ??= import("@/generated/terms-es.json").then((m) => m.default as Terms));

/** Busca un término del catálogo (2–3 palabras) que empiece en la posición dada. */
function termAt(ws: string[], i: number, terms: Terms) {
  for (const n of [3, 2]) {
    const t = ws.slice(i, i + n).join(" ");
    if (terms[t]) return t;
  }
  return null;
}

/**
 * Retroalimentación oral honesta. Separa lo que mide el reconocedor (si entendió la frase) de lo que no puede medir
 * con fiabilidad (pronunciación fonema a fonema). Explica sustituciones concretas y permite practicar solo el fragmento.
 */
export function SpeechFeedback({ target, heard, buffer, trend, onPracticePart, requireTerm }: { target: string; heard: string; buffer: AudioBuffer | null; trend?: "up" | "down" | "flat" | null; onPracticePart: (part: string | null) => void; requireTerm?: string }) {
  const ops = useMemo(() => alignWords(target, heard), [target, heard]);
  const ok = ops.filter((o) => o.op === "ok" || o.op === "near").length;
  const total = Math.max(1, words(target).length);
  const pct = Math.round((ok / total) * 100);
  const pauses = useMemo(() => pauseStats(buffer), [buffer]);
  const [terms, setTerms] = useState<Terms | null>(null);
  const subs = ops.filter((o) => o.op === "sub" || o.op === "missing" || o.op === "extra");
  useEffect(() => {
    if (subs.length) void loadTerms().then(setTerms);
  }, [subs.length]);

  // Fragmento problemático: desde una palabra antes del primer error hasta una después del último.
  const part = useMemo(() => {
    const idx = ops.map((o, i) => (o.op !== "ok" && o.op !== "near" ? i : -1)).filter((i) => i >= 0);
    if (!idx.length) return null;
    const tw = ops.map((o) => o.want).filter((w): w is string => !!w);
    let a = 0;
    const map = ops.map((o) => (o.want ? a++ : a));
    const from = Math.max(0, map[idx[0]] - 1), to = Math.min(tw.length, map[idx[idx.length - 1]] + 2);
    return tw.slice(from, to).join(" ");
  }, [ops]);

  const msgs: string[] = [];
  const tw = words(target), hw = words(heard);
  for (const o of ops)
    if (o.op === "sub") {
      const ti = tw.indexOf(o.want!), hi = hw.indexOf(o.got!);
      const tt = terms && ti >= 0 ? termAt(tw, ti, terms) : null;
      const ht = terms && hi >= 0 ? termAt(hw, hi, terms) : null;
      if (tt && ht && tt !== ht) msgs.push(`El reconocedor detectó «${ht}» en lugar de «${tt}». «${tt}» = ${terms![tt]}; «${ht}» = ${terms![ht]}. Escucha la expresión y practica ese fragmento.`);
      else msgs.push(`Se entendió «${o.got}» donde esperaba «${o.want}».`);
    }
  const missing = ops.filter((o) => o.op === "missing").map((o) => o.want);
  const extra = ops.filter((o) => o.op === "extra").map((o) => o.got);
  if (missing.length) msgs.push(`No se oyó: ${missing.map((w) => `«${w}»`).join(", ")}.`);
  if (extra.length) msgs.push(`Se oyó de más: ${extra.map((w) => `«${w}»`).join(", ")}.`);
  const termMissed = requireTerm && !words(heard).join(" ").includes(words(requireTerm).join(" "));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-muted">Esto entendió el reconocedor (orientativo; no cambia tu progreso)</p>
      <p className="flex flex-wrap gap-1 text-lg font-bold" lang="en">
        {ops.map((o: WordOp, i) =>
          o.op === "extra" ? (
            <span key={i} className="diff-extra">
              {o.got}
            </span>
          ) : (
            <span key={i} className={o.op === "ok" ? "text-good" : o.op === "near" ? "diff-near" : "diff-sub"} title={o.got ? `Se entendió «${o.got}»` : "No se oyó"}>
              {o.want}
            </span>
          ),
        )}
      </p>
      {msgs.length === 0 ? <p className="text-sm font-bold text-good">La frase completa se entendió.</p> : msgs.map((m, i) => <p key={i} className="text-sm">{m}</p>)}
      {termMissed && <p className="text-sm font-bold text-bad">Este ejercicio pide usar «{requireTerm}»: no se reconoció en tu respuesta.</p>}
      {part && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">Practica el fragmento:</span>
          <AudioButton text={part} size="sm" label={`Escuchar «${part}»`} />
          <button type="button" className="chip-btn" onClick={() => onPracticePart(part)}>
            Grabar solo «{part}»
          </button>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-xl bg-surface p-2">
          <dt className="font-bold text-muted">Comprensión del reconocedor</dt>
          <dd className="text-base font-black">{pct} %</dd>
        </div>
        <div className="rounded-xl bg-surface p-2">
          <dt className="font-bold text-muted">Fluidez (pausas)</dt>
          <dd className="text-base font-black">{pauses ? (pauses.pauses ? `${pauses.pauses} pausa${pauses.pauses > 1 ? "s" : ""} larga${pauses.pauses > 1 ? "s" : ""}` : "Sin pausas largas") : "No medible"}</dd>
        </div>
        <div className="rounded-xl bg-surface p-2">
          <dt className="font-bold text-muted">Entonación final</dt>
          <dd className="text-base font-black">{trend === "up" ? "Sube ↗" : trend === "down" ? "Baja ↘" : trend === "flat" ? "Plana →" : "No medida"}</dd>
        </div>
        <div className="rounded-xl bg-surface p-2">
          <dt className="font-bold text-muted">Pronunciación</dt>
          <dd className="text-sm font-bold">No medible con fiabilidad: compárala tú oyendo ambas voces</dd>
        </div>
      </dl>
    </div>
  );
}
