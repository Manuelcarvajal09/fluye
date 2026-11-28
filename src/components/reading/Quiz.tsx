"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";

export type QuizQ = { q: string; options: string[]; answer: number; why_es?: string };

/** Preguntas de comprensión: responde, ve por qué y al final se guarda la puntuación (y una reflexión opcional). */
export function Quiz({ questions, onDone, reflection = false, doneScore }: { questions: QuizQ[]; onDone: (score: number, total: number, reflection: string) => Promise<void> | void; reflection?: boolean; doneScore?: { score: number; total: number } }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(!!doneScore);
  const [busy, setBusy] = useState(false);
  const all = picked.every((p) => p !== null);
  const score = picked.filter((p, i) => p === questions[i].answer).length;

  return (
    <div className="flex flex-col gap-4">
      {doneScore && <p className="rounded-[var(--r-md)] bg-good-soft px-3 py-2 text-sm font-bold text-good">Ya la terminaste: {doneScore.score} de {doneScore.total}. Puedes repetir las preguntas.</p>}
      {questions.map((q, i) => (
        <fieldset key={i} className="module flex flex-col gap-2 p-4">
          <legend className="sr-only">Pregunta {i + 1}</legend>
          <p className="font-black" lang="en">
            {i + 1}. {q.q}
          </p>
          {q.options.map((o, k) => {
            const chosen = picked[i] === k;
            const show = picked[i] !== null;
            const right = k === q.answer;
            return (
              <button key={k} type="button" disabled={show} onClick={() => setPicked((p) => p.map((x, j) => (j === i ? k : x)))} className="option flex items-center justify-between gap-2 text-left" data-state={show && right ? "right" : show && chosen ? "wrong" : undefined} lang="en">
                <span>{o}</span>
                {show && right && <Check size={18} className="text-good" aria-label="correcta" />}
                {show && chosen && !right && <X size={18} className="text-bad" aria-label="incorrecta" />}
              </button>
            );
          })}
          {picked[i] !== null && q.why_es && <p className="text-sm text-muted">{q.why_es}</p>}
        </fieldset>
      ))}
      {all && (
        <div className="module flex flex-col gap-3 p-4">
          <p className="text-lg font-black">
            {score} de {questions.length} correctas
          </p>
          {reflection && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Tu reflexión para el club (opcional, la ven tus amistades)</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={280} rows={2} className="rounded-[var(--r-md)] border border-line bg-surface p-3 font-semibold outline-none focus:border-accent" />
            </label>
          )}
          <button
            type="button"
            className="btn btn-primary self-start"
            disabled={busy || (saved && !reflection)}
            onClick={async () => {
              setBusy(true);
              await onDone(score, questions.length, text);
              setBusy(false);
              setSaved(true);
            }}
          >
            {saved && !reflection ? "Guardado" : "Guardar resultado"}
          </button>
        </div>
      )}
    </div>
  );
}
