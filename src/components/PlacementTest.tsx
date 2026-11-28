"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Headphones, BookOpen, SpellCheck, Puzzle, Clock, Check, X, Turtle } from "lucide-react";
import type { PlacementQ } from "@/lib/types";
import type { PlacementResult } from "@/lib/user";
import { speakSequence } from "@/lib/audio/tts";
import { Bar } from "./ui";

export type PublicQ = Omit<PlacementQ, "answer" | "why_es">;
type Result = PlacementResult & { review: { id: string; ok: boolean; answer: number; picked: number | null; why_es?: string }[] };

const SECTION: Record<PublicQ["section"], { label: string; icon: React.ReactNode; hint: string }> = {
  grammar: { label: "Gramática y tiempos", icon: <SpellCheck size={18} aria-hidden />, hint: "Elige la opción correcta." },
  vocab: { label: "Vocabulario y phrasal verbs", icon: <Puzzle size={18} aria-hidden />, hint: "Significado y uso natural." },
  reading: { label: "Lectura", icon: <BookOpen size={18} aria-hidden />, hint: "Lee el texto y responde." },
  listening: { label: "Comprensión auditiva", icon: <Headphones size={18} aria-hidden />, hint: "Escucha las veces que quieras y responde. El texto no se muestra." },
};
const KEY = "fluye-placement-v1";

export function PlacementTest({ questions, previous, currentLevel }: { questions: PublicQ[]; previous: PlacementResult | null; currentLevel: string }) {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardar avance localmente para poder pausar.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved?.answers) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restauración única desde localStorage
        setAnswers(saved.answers);
        setI(Math.min(saved.i ?? 0, questions.length - 1));
      }
    } catch {}
  }, [questions.length]);
  useEffect(() => {
    if (!started || result) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ answers, i }));
    } catch {}
  }, [answers, i, started, result]);
  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [started]);

  const q = questions[i];
  const answeredCount = Object.keys(answers).length;
  const sectionCounts = useMemo(() => questions.reduce<Record<string, number>>((a, x) => ((a[x.section] = (a[x.section] ?? 0) + 1), a), {}), [questions]);

  async function finish() {
    setSending(true);
    setError(null);
    const r = await fetch("/api/placement", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) });
    const j = await r.json();
    setSending(false);
    if (!r.ok) return setError(j.error ?? "Error");
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setResult(j);
  }

  function pick(n: number | null) {
    setAnswers((a) => ({ ...a, [q.id]: n }));
    if (i + 1 < questions.length) setI(i + 1);
  }

  if (!questions.length) return <p className="text-muted">El banco de preguntas aún no está disponible.</p>;

  if (result) return <ResultView result={result} questions={questions} />;

  if (!started)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <h1 className="text-3xl font-black">Test de nivel completo</h1>
        <p className="text-lg text-muted">
          {questions.length} preguntas en 4 partes, unos 35 minutos. Mide de A1 a C1 con gramática, vocabulario, lectura y comprensión auditiva. Tu nivel actual es <b>{currentLevel}</b>
          {previous ? ` (último test: ${previous.level}, ${Math.round((previous.score / previous.total) * 100)}% el ${new Date(previous.date).toLocaleDateString("es-MX")})` : ""}.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SECTION) as PublicQ["section"][]).map((s) => (
            <li key={s} className="card flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">{SECTION[s].icon}</span>
              <span>
                <span className="block font-black">{SECTION[s].label}</span>
                <span className="block text-sm text-muted">{sectionCounts[s] ?? 0} preguntas</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Consejos: usa audífonos; si no sabes, elige «No lo sé» (adivinar distorsiona el resultado). Puedes cerrar y continuar después en este dispositivo.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setStarted(true);
            setT0(Date.now());
            setNow(Date.now());
          }}
        >
          {answeredCount ? `Continuar (${answeredCount}/${questions.length})` : "Empezar"}
        </button>
      </div>
    );

  const mins = Math.floor((now - t0) / 60000);
  const sec = SECTION[q.section];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <Bar value={answeredCount} max={questions.length} label="Progreso del test" />
        <span className="shrink-0 text-sm font-bold text-muted">
          {i + 1}/{questions.length}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-muted">
          <Clock size={14} aria-hidden /> {mins}′
        </span>
      </div>
      <p className="flex items-center gap-2 font-black text-accent">
        {sec.icon} {sec.label}
        <span className="font-semibold text-muted">· {sec.hint}</span>
      </p>

      {q.passage && (
        <article className="card max-h-80 overflow-y-auto p-4 text-[1.05rem] leading-relaxed" lang="en">
          {q.passage}
        </article>
      )}
      {q.audio && (
        <div className="card flex items-center gap-3 p-4">
          {[
            { rate: 1, label: "Escuchar el audio", icon: <Headphones size={26} aria-hidden />, cls: "btn-accent" },
            { rate: 0.75, label: "Escuchar el audio más despacio", icon: <Turtle size={26} aria-hidden />, cls: "btn-ghost" },
          ].map((b) => (
            <button
              key={b.rate}
              type="button"
              className={`btn ${b.cls} h-14 w-14 !p-0`}
              aria-label={b.label}
              onClick={() => {
                const lines = q
                  .audio!.split("\n")
                  .map((l) => {
                    const m = l.match(/^([A-Z]):\s*(.*)$/);
                    return { text: (m ? m[2] : l).trim(), speaker: m ? m[1] : undefined, rate: b.rate };
                  })
                  .filter((l) => l.text);
                void speakSequence(lines, { gap: 1000 });
              }}
            >
              {b.icon}
            </button>
          ))}
          <span className="text-sm text-muted">Puedes repetirlo todas las veces que necesites.</span>
        </div>
      )}

      <p className="text-xl font-extrabold" lang="en">
        {q.prompt}
      </p>
      <div className="grid gap-2">
        {q.options.map((o, n) => (
          <button key={`${q.id}-${n}`} type="button" className="option" data-state={answers[q.id] === n ? "selected" : undefined} onClick={() => pick(n)} lang="en">
            {o}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => pick(null)}>
          No lo sé (no resta)
        </button>
        {i > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}>
            Anterior
          </button>
        )}
        <button type="button" className="btn btn-primary ml-auto" disabled={sending || answeredCount < Math.min(20, questions.length)} onClick={finish}>
          {answeredCount < questions.length ? `Terminar ahora (${answeredCount})` : "Ver mi resultado"}
        </button>
      </div>
      {error && <p className="rounded-xl bg-bad-soft p-3 font-bold">{error}</p>}
    </div>
  );
}

function ResultView({ result, questions }: { result: Result; questions: PublicQ[] }) {
  const wrong = result.review.filter((r) => !r.ok);
  const byId = new Map(questions.map((q) => [q.id, q]));
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="card flex flex-col items-center gap-2 p-6 text-center">
        <p className="font-bold text-muted">Tu nivel estimado</p>
        <p className="animate-pop text-7xl font-black text-brand">{result.level}</p>
        {result.near && (
          <p className="chip bg-accent-soft text-accent">
            Cerca de {result.near}: estás entre {result.level} y {result.near}
          </p>
        )}
        <p className="text-muted">
          {result.score} de {result.total} correctas. Ya ajusté tus sesiones a este nivel.
        </p>
        <p className="max-w-md text-xs text-muted">El resultado descuenta los aciertos por azar: por eso «No lo sé» no te baja y adivinar sí puede bajarte.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-black">Por habilidad</h2>
          {Object.entries(result.bySection).map(([k, v]) => (
            <div key={k} className="mb-3">
              <div className="mb-1 flex justify-between text-sm font-bold">
                <span>{SECTION[k as PublicQ["section"]]?.label ?? k}</span>
                <span className="text-muted">{Math.round((v.right / v.total) * 100)}%</span>
              </div>
              <Bar value={v.right} max={v.total} color={v.right / v.total >= 0.7 ? "var(--good)" : "var(--fire)"} label={k} />
            </div>
          ))}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-black">Por nivel de las preguntas</h2>
          {Object.entries(result.byLevel)
            .sort()
            .map(([k, v]) => (
              <div key={k} className="mb-3">
                <div className="mb-1 flex justify-between text-sm font-bold">
                  <span>{k}</span>
                  <span className="text-muted">
                    {v.right}/{v.total}
                  </span>
                </div>
                <Bar value={v.right} max={v.total} color="var(--accent)" label={k} />
              </div>
            ))}
        </section>
      </div>
      {wrong.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-black">Repasa tus errores</h2>
          <ul className="flex flex-col gap-3">
            {wrong.map((r) => {
              const q = byId.get(r.id);
              if (!q) return null;
              return (
                <li key={r.id} className="rounded-2xl bg-surface-2 p-3">
                  <p className="font-bold" lang="en">
                    {q.prompt}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-bad">
                    <X size={14} aria-hidden /> {r.picked === null ? "No lo sabías" : q.options[r.picked]}
                  </p>
                  <p className="flex items-center gap-1 text-sm font-bold text-good">
                    <Check size={14} aria-hidden /> {q.options[r.answer]}
                  </p>
                  {r.why_es && <p className="mt-1 text-sm text-muted">{r.why_es}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <div className="flex gap-3">
        <Link href="/hoy" className="btn btn-primary grow">
          Ir a Hoy
        </Link>
        <Link href="/practicar/gramatica" className="btn btn-ghost grow">
          Repasar gramática
        </Link>
      </div>
    </div>
  );
}
