"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Quiz, type QuizQ } from "./Quiz";
import { EMOJIS } from "@/lib/reactions";

/** Preguntas de una lectura o de la noticia: al guardar, se registra el resultado (XP la primera vez). */
export function ReadingQuiz({ id, questions, club = false, done }: { id: string; questions: QuizQ[]; club?: boolean; done?: { score: number; total: number } }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Quiz
        questions={questions}
        reflection={club}
        doneScore={done}
        onDone={async (score, total, reflection) => {
          const r = await fetch("/api/reading", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, score, total, reflection }) });
          const j = await r.json().catch(() => ({}));
          setMsg(r.ok ? (j.xp ? `+${j.xp} XP` : "Resultado guardado.") : (j.error ?? "No se pudo guardar."));
          router.refresh();
        }}
      />
      {msg && (
        <p role="status" className="font-black text-good">
          {msg}
        </p>
      )}
    </div>
  );
}

/** Reaccionar con un emoji a la lectura de una amistad en el club. */
export function ReactButtons({ to, target, mine }: { to: string; target: string; mine?: string | null }) {
  const [picked, setPicked] = useState(mine ?? null);
  return (
    <div className="flex gap-1" role="group" aria-label="Reaccionar">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          aria-pressed={picked === e}
          onClick={async () => {
            setPicked(e);
            await fetch("/api/reactions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to, target, emoji: e }) });
          }}
          className={`grid h-9 w-9 place-items-center rounded-full text-lg transition-transform active:scale-90 ${picked === e ? "bg-accent-soft ring-2 ring-accent" : "bg-surface-2"}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
