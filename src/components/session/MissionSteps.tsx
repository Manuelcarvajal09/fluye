"use client";
import { useCallback, useState } from "react";
import { Check, Loader2, Mic, MessageCircleQuestion, PencilLine } from "lucide-react";
import type { ProductionTask, RepairPhrase } from "@/lib/types";
import { contains } from "@/lib/evaluate";
import { useDictation } from "@/lib/audio/dictation";
import { AudioButton } from "../ui";

/** Frases para reparar una conversación (pedir que repitan, aclarar, reformular). No se califica. */
export function RepairStep({ phrases, onNext }: { phrases: RepairPhrase[]; onNext: () => void }) {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-black text-accent">
          <MessageCircleQuestion size={18} aria-hidden /> Si algo no sale bien
        </p>
        <h2 className="font-display text-3xl font-extrabold">Frases para salvar la conversación</h2>
        <p className="mt-1 text-muted">Escúchalas y repítelas en voz alta. Te sacan de apuros cuando no entiendes o no te entienden.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {phrases.map((p) => (
          <li key={p.en} className="module flex items-start gap-3 p-4">
            <AudioButton text={p.en} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-muted">{p.situation_es}</p>
              <p className="text-lg font-black">{p.en}</p>
              <p className="text-sm text-muted">{p.es}</p>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-primary mt-auto" onClick={onNext}>
        Continuar
      </button>
    </section>
  );
}

type Check = { matched: number; total: number; missing: string[] };

/** Revisa grupos de palabras clave: cada grupo acepta alternativas válidas. */
export function checkTask(answer: string, task: ProductionTask): Check {
  const missing: string[] = [];
  let matched = 0;
  for (const g of task.expect) {
    if (g.some((alt) => contains(answer, alt))) matched++;
    else missing.push(g[0]);
  }
  return { matched, total: task.expect.length, missing };
}

/**
 * Producción abierta (escrita o hablada). No toca FSRS ni quita puntos:
 * si la regla no reconoce la respuesta, se muestra el modelo para comparar por tu cuenta.
 */
export function TaskStep({ task, onNext }: { task: ProductionTask; onNext: () => void }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Check | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const onText = useCallback((t: string) => {
    setHeard(t);
    if (t) setText(t);
  }, []);
  const dict = useDictation(onText);
  const all = res && res.matched === res.total;

  return (
    <section className="flex flex-1 flex-col gap-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-black text-accent">
          <PencilLine size={18} aria-hidden /> Tu turno
        </p>
        <h2 className="font-display text-3xl font-extrabold">{task.prompt_es}</h2>
        <p className="mt-1 text-muted">Escríbelo o dilo. Hay muchas formas correctas.</p>
      </div>
      <label className="sr-only" htmlFor="task">
        Tu respuesta en inglés
      </label>
      <textarea
        id="task"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setRes(null);
        }}
        rows={3}
        disabled={!!res}
        className="rounded-[var(--r-md)] border-2 border-line bg-surface p-4 text-lg font-bold outline-none focus:border-accent"
        placeholder="Escribe en inglés…"
      />
      {heard !== null && (
        <p className="text-sm text-muted">
          Esto entendió el reconocedor: <b>{heard || "(nada)"}</b> — puedes corregirlo arriba antes de revisar.
        </p>
      )}
      {!res ? (
        <div className="flex flex-wrap gap-3">
          {dict.rec.state !== "unsupported" && dict.rec.state !== "denied" && (
            <button
              type="button"
              className={`btn ${dict.rec.state === "recording" ? "btn-bad animate-pulse" : "btn-ghost"}`}
              disabled={dict.busy}
              onClick={() => {
                if (dict.rec.state === "recording") dict.rec.stop();
                else {
                  dict.prepare();
                  void dict.rec.start(12_000);
                }
              }}
            >
              {dict.busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Mic size={18} aria-hidden />} {dict.busy ? "Entendiendo…" : dict.rec.state === "recording" ? "Detener" : "Hablar"}
            </button>
          )}
          <button type="button" className="btn btn-primary flex-1" disabled={!text.trim()} onClick={() => setRes(checkTask(text, task))}>
            Revisar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setRes({ matched: 0, total: task.expect.length, missing: [] })}>
            Ver un modelo
          </button>
        </div>
      ) : (
        <div className="module animate-pop flex flex-col gap-3 p-4" aria-live="polite">
          {text.trim() && (
            <p className={`flex items-center gap-2 font-black ${all ? "text-good" : "text-fire"}`}>
              {all ? <Check size={20} aria-hidden /> : null}
              {all ? "¡Comunica lo que se pedía!" : res.missing.length ? `Revisa si incluiste: ${res.missing.join(", ")}` : "Compara con el modelo"}
            </p>
          )}
          <p className="text-sm font-bold text-muted">Una forma natural de decirlo:</p>
          {task.model.map((m) => (
            <p key={m} className="flex items-center gap-2 text-lg font-extrabold">
              <AudioButton text={m} size="sm" /> {m}
            </p>
          ))}
          <p className="text-xs text-muted">Esta práctica no afecta tus repasos ni tu racha.</p>
        </div>
      )}
      {res && (
        <button type="button" className="btn btn-primary mt-auto" onClick={onNext}>
          Continuar
        </button>
      )}
    </section>
  );
}
