"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Play, RotateCcw, Info, Loader2 } from "lucide-react";
import { useRecorder } from "@/lib/audio/recorder";
import { preloadStt, resampleTo16k, subscribeStt, transcribe, type SttStatus } from "@/lib/audio/stt";
import { pitchContour, endingTrend, type PitchPoint } from "@/lib/audio/pitch";
import { wordMatch } from "@/lib/answer";
import { AudioButton } from "./ui";
import { SpeechFeedback } from "./SpeechFeedback";

export type SpeakResult = { ratio: number | null; self: 1 | 2 | 3 | null };

/**
 * Práctica oral honesta:
 * 1) escuchas la referencia, 2) te grabas (queda solo en tu navegador), 3) un reconocedor local (Whisper) te transcribe
 * y ves qué palabras entendió, 4) comparas oyendo ambas voces, 5) te autoevalúas.
 * Whisper mide si se te entiende, NO la calidad fonética: tiende a "corregir" pronunciaciones dudosas.
 */
export function SpeakPanel({ target, onResult, showPitch = false, compact = false, requireTerm }: { target: string; onResult: (r: SpeakResult) => void; showPitch?: boolean; compact?: boolean; requireTerm?: string }) {
  const fullTarget = target.replace(/[\[\]]/g, "");
  // Practicar solo el fragmento difícil y luego volver a la frase completa.
  const [part, setPart] = useState<string | null>(null);
  const plainTarget = part ?? fullTarget;
  const [heard, setHeard] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stt, setStt] = useState<SttStatus>({ state: "idle", progress: 0 });
  const run = useRef(0);

  const analyze = useCallback(async (b: AudioBuffer) => {
    const id = ++run.current;
    setBusy(true);
    setFailed(false);
    try {
      const text = await transcribe(await resampleTo16k(b));
      if (id === run.current) setHeard(text.trim());
    } catch {
      if (id === run.current) setFailed(true);
    } finally {
      if (id === run.current) setBusy(false);
    }
  }, []);
  const rec = useRecorder(analyze);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!conn?.saveData) preloadStt();
    return subscribeStt(setStt);
  }, []);

  const match = useMemo(() => (heard !== null ? wordMatch(plainTarget, heard) : null), [heard, plainTarget]);
  const contour = useMemo<PitchPoint[] | null>(() => (rec.buffer ? pitchContour(rec.buffer.getChannelData(0), rec.buffer.sampleRate) : null), [rec.buffer]);
  const practicePart = (p: string | null) => {
    run.current++;
    setBusy(false);
    setHeard(null);
    rec.reset();
    setPart(p);
  };

  if (rec.state === "unsupported") return <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">Este navegador no permite grabar audio. Repite en voz alta y continúa.</p>;
  if (rec.state === "denied") return <p className="rounded-2xl bg-bad-soft p-4 text-sm">No hay permiso para el micrófono. Actívalo en los ajustes del navegador para esta página.</p>;

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      {part && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm font-bold" role="status">
          Practicando solo: <span lang="en">«{part}»</span>
          <button type="button" className="chip-btn" onClick={() => practicePart(null)}>
            Volver a la frase completa
          </button>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <AudioButton text={plainTarget} label="Escuchar la referencia" />
        <AudioButton text={plainTarget} slow />
        {rec.state !== "recording" ? (
          <button
            type="button"
            onClick={() => {
              setHeard(null);
              void rec.start(12_000);
            }}
            className="btn btn-primary h-12 grow sm:grow-0"
          >
            <Mic size={20} aria-hidden /> {rec.state === "ready" ? "Grabar otra vez" : "Grabarme"}
          </button>
        ) : (
          <button type="button" onClick={rec.stop} className="btn btn-bad h-12 grow animate-pulse sm:grow-0">
            <Square size={18} aria-hidden /> Detener
          </button>
        )}
      </div>

      {stt.state === "loading" && rec.state !== "ready" && (
        <p className="flex items-center gap-2 text-sm text-muted" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden /> Preparando el reconocedor de voz{stt.progress > 0 ? ` (${Math.round(stt.progress * 100)} %)` : ""}. Solo la primera vez, ≈73 MB.
        </p>
      )}

      {rec.state === "ready" && rec.url && (
        <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-muted">Compara:</span>
            <AudioButton text={plainTarget} size="sm" label="Referencia" />
            <PlayMine url={rec.url} />
            <button type="button" className="btn btn-ghost h-9 min-h-9 px-3 text-sm" onClick={() => { run.current++; setBusy(false); setHeard(null); rec.reset(); }}>
              <RotateCcw size={16} aria-hidden /> Borrar
            </button>
          </div>
          {contour && showPitch && <PitchChart points={contour} />}
          {busy && (
            <p className="flex items-center gap-2 text-sm font-bold" role="status">
              <Loader2 size={16} className="animate-spin" aria-hidden /> Analizando tu voz…
            </p>
          )}
          {failed && <p className="text-sm text-muted">No pude analizar el audio esta vez. Compara oyendo ambas voces y autoevalúate.</p>}
          {heard !== null && (
            <div>
              <SpeechFeedback target={plainTarget} heard={heard} buffer={rec.buffer} trend={contour ? endingTrend(contour) : null} onPracticePart={practicePart} requireTerm={part ? undefined : requireTerm} />
              {heard.trim() === "" && <p className="mt-1 text-sm text-muted">No se reconoció voz: puede ser ruido, volumen bajo o el micrófono. No cuenta como error; intenta de nuevo.</p>}
              <label className="mt-2 flex flex-col gap-1 text-xs font-bold text-muted">
                ¿Se equivocó? Corrige lo que dijiste:
                <input value={heard ?? ""} onChange={(e) => setHeard(e.target.value)} className="h-10 rounded-[var(--r-sm)] border border-line bg-surface px-3 text-sm font-bold text-text" />
              </label>
            </div>
          )}
          {!part && <div>
            <p className="mb-2 text-sm font-bold">¿Cómo te sonó comparado con la referencia?</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                [1, "Muy distinto"],
                [2, "Casi"],
                [3, "Igual"],
              ] as const).map(([v, l]) => (
                <button key={v} type="button" className="btn btn-ghost h-11 min-h-11 px-2 text-sm" disabled={busy} onClick={() => onResult({ ratio: match?.ratio ?? null, self: v })}>
                  {l}
                </button>
              ))}
            </div>
          </div>}
        </div>
      )}
      {!compact && (
        <p className="flex gap-2 text-xs text-muted">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden /> Tu grabación se queda en este dispositivo: el reconocimiento corre en tu navegador y no se sube nada. No hay calificación por fonema todavía.
        </p>
      )}
    </div>
  );
}

function PlayMine({ url }: { url: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  return (
    <>
      <audio ref={audio} src={url} preload="auto" />
      <button type="button" className="btn btn-ghost h-9 min-h-9 px-3 text-sm" onClick={() => audio.current?.play()}>
        <Play size={16} aria-hidden /> Mi voz
      </button>
    </>
  );
}

export function PitchChart({ points }: { points: PitchPoint[] }) {
  const voiced = points.filter((p) => p.hz !== null) as { t: number; hz: number }[];
  if (voiced.length < 5) return <p className="text-xs text-muted">No se detectó suficiente voz para dibujar la entonación.</p>;
  const lo = Math.min(...voiced.map((p) => p.hz)) * 0.9;
  const hi = Math.max(...voiced.map((p) => p.hz)) * 1.1;
  const T = points[points.length - 1].t || 1;
  const W = 600;
  const H = 120;
  const segs: string[] = [];
  let cur = "";
  for (const p of points) {
    if (p.hz === null) {
      if (cur) segs.push(cur);
      cur = "";
      continue;
    }
    const x = (p.t / T) * W;
    const y = H - ((p.hz - lo) / (hi - lo)) * H;
    cur += `${cur ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }
  if (cur) segs.push(cur);
  const trend = endingTrend(points);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full rounded-xl bg-surface" role="img" aria-label={`Curva de tono de tu voz. Final ${trend === "up" ? "ascendente" : trend === "down" ? "descendente" : "plano"}`}>
        {segs.map((d, i) => (
          <path key={i} d={d} stroke="var(--accent)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">
        Tu melodía (tono medido de tu grabación). Final: <b>{trend === "up" ? "sube ↗" : trend === "down" ? "baja ↘" : trend === "flat" ? "plano →" : "—"}</b>
      </figcaption>
    </figure>
  );
}
