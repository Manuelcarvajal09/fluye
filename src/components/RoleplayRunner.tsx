"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Send, Eye, EyeOff, RotateCcw, ArrowRight, Check, Lightbulb, Trophy, Loader2 } from "lucide-react";
import type { CommonError, Roleplay } from "@/lib/types";
import { evaluateTurn, type TurnResult } from "@/lib/evaluate";
import { useDictation } from "@/lib/audio/dictation";
import { speak, stopSpeaking } from "@/lib/audio/tts";
import { AudioButton, Bar } from "./ui";
import { Burst } from "./Burst";
import { playSfx } from "@/lib/audio/sfx";

type Done = { turn: number; answer: string; result: TurnResult; attempts: number };

const STATUS = {
  great: { label: "¡Muy natural!", cls: "bg-good-soft text-good" },
  ok: { label: "Se entiende, pero puede sonar más natural", cls: "bg-fire-soft text-fire" },
  partial: { label: "Casi: te faltó algo importante", cls: "bg-fire-soft text-fire" },
  miss: { label: "Todavía no comunica lo que se pide", cls: "bg-bad-soft text-bad" },
} as const;

export function RoleplayRunner({ rp, bank }: { rp: Roleplay; bank: CommonError[] }) {
  const [n, setN] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<TurnResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState<Done[]>([]);
  const [showText, setShowText] = useState(false);
  const saved = useRef(false);
  const onText = useCallback((t: string) => {
    if (t) setAnswer(t);
  }, []);
  const dict = useDictation(onText);
  const turn = rp.turns[n];
  const finished = n >= rp.turns.length;

  useEffect(() => {
    if (!turn) return;
    const t = setTimeout(() => void speak(turn.npc, { partner: true }), 300);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, [turn]);

  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    const score = done.reduce((a, d) => a + (d.result.status === "great" ? 1 : d.result.status === "ok" ? 0.8 : d.result.ratio * 0.6) / Math.max(1, d.attempts * 0.75), 0) / Math.max(1, done.length);
    void fetch("/api/practice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "roleplay", id: rp.id, score: Math.min(1, score) }) });
  }, [finished, done, rp.id]);

  function check() {
    const r = evaluateTurn(answer, turn, bank);
    playSfx(r.status === "great" ? "streak" : r.status === "ok" ? "ok" : "bad");
    setResult(r);
    setAttempts((a) => a + 1);
  }

  function next() {
    if (result) setDone((d) => [...d, { turn: n, answer, result, attempts }]);
    setAnswer("");
    setResult(null);
    setAttempts(0);
    setShowText(false);
    setN((x) => x + 1);
  }

  if (finished) return <Summary rp={rp} done={done} />;

  const history = done.map((d) => ({ npc: rp.turns[d.turn].npc, me: d.answer }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Bar value={n} max={rp.turns.length} label="Progreso del roleplay" />
        <span className="text-sm font-bold text-muted">
          {n + 1}/{rp.turns.length}
        </span>
      </div>

      {history.length > 0 && (
        <ol className="flex flex-col gap-2 opacity-70" aria-label="Conversación anterior">
          {history.map((h, k) => (
            <li key={k} className="flex flex-col gap-1">
              <p className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-sm" lang="en">
                {h.npc}
              </p>
              <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-accent-soft px-3 py-2 text-sm" lang="en">
                {h.me}
              </p>
            </li>
          ))}
        </ol>
      )}

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <AudioButton text={turn.npc} size="sm" label={`Escuchar a ${rp.npc}`} partner />
          <AudioButton text={turn.npc} size="sm" slow partner />
          <span className="font-black">{rp.npc}</span>
          <button type="button" className="ml-auto flex items-center gap-1 text-sm font-bold text-muted" onClick={() => setShowText((v) => !v)} aria-pressed={showText}>
            {showText ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />} {showText ? "Ocultar" : "Ver texto"}
          </button>
        </div>
        {showText || result ? (
          <div>
            <p className="text-xl font-bold" lang="en">
              {turn.npc}
            </p>
            <p className="text-muted">{turn.npc_es}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">Escucha primero. Si no entiendes, repite o usa «Ver texto».</p>
        )}
      </div>

      <p className="rounded-2xl bg-brand-soft p-3 font-bold text-brand-ink">Tu turno: {turn.task_es}</p>

      {!result && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (answer.trim()) check();
          }}
        >
          <label htmlFor="rp-answer" className="sr-only">
            Tu respuesta en inglés
          </label>
          <textarea
            id="rp-answer"
            lang="en"
            rows={2}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (answer.trim()) check();
              }
            }}
            placeholder="Escribe o dicta tu respuesta en inglés…"
            className="rounded-2xl border-2 border-line bg-surface p-3 text-lg font-semibold outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            {dict.rec.state !== "unsupported" && dict.rec.state !== "denied" && (
              <button
                type="button"
                className={`btn ${dict.rec.state === "recording" ? "btn-bad animate-pulse" : "btn-ghost"}`}
                disabled={dict.busy}
                onClick={() => {
                  if (dict.rec.state === "recording") dict.rec.stop();
                  else {
                    dict.prepare();
                    void dict.rec.start(10_000);
                  }
                }}
              >
                {dict.busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Mic size={18} aria-hidden />} {dict.busy ? "Entendiendo…" : dict.rec.state === "recording" ? "Detener" : "Hablar"}
              </button>
            )}
            <button type="submit" className="btn btn-primary grow" disabled={!answer.trim()}>
              <Send size={18} aria-hidden /> Responder
            </button>
          </div>
          <button type="button" className="self-start text-sm font-bold text-muted underline" onClick={() => setResult({ status: "miss", missing: turn.expect.map((g) => g[0]), tips: [], ratio: 0 })}>
            No sé qué decir: muéstrame cómo
          </button>
        </form>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          {answer && (
            <p className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-accent-soft px-3 py-2 font-semibold" lang="en">
              {answer}
            </p>
          )}
          <div className={`relative rounded-2xl p-3 font-black ${STATUS[result.status].cls}`}>
            {result.status === "great" && <Burst kind="mix" count={14} spread={90} />}
            {STATUS[result.status].label}
          </div>
          {result.missing.length > 0 && answer && (
            <p className="text-sm">
              Te faltó expresar: <b lang="en">{result.missing.join(", ")}</b>
            </p>
          )}
          {result.tips.map((t, k) => (
            <p key={k} className="flex gap-2 rounded-2xl bg-fire-soft p-3 text-sm">
              <Lightbulb size={18} className="shrink-0 text-fire" aria-hidden />
              <span>
                Mejor: <b lang="en">{t.fix}</b>. {t.why_es}
              </span>
            </p>
          ))}
          <div className="card p-3">
            <p className="mb-2 text-sm font-black text-muted">Así suena natural</p>
            <ul className="flex flex-col gap-2">
              {turn.model.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <AudioButton text={m} size="sm" />
                  <span className="font-semibold" lang="en">
                    {m}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            {result.status !== "great" && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setResult(null);
                }}
              >
                <RotateCcw size={18} aria-hidden /> Intentar otra vez
              </button>
            )}
            <button type="button" className="btn btn-primary grow" onClick={next} autoFocus>
              {n + 1 < rp.turns.length ? "Siguiente turno" : "Terminar"} <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ rp, done }: { rp: Roleplay; done: Done[] }) {
  const good = done.filter((d) => d.result.status === "great" || d.result.status === "ok");
  const improve = done.flatMap((d) => [...d.result.tips.map((t) => `${t.fix} — ${t.why_es}`), ...(d.result.status === "partial" || d.result.status === "miss" ? [`Turno ${d.turn + 1}: ${rp.turns[d.turn].model[0]}`] : [])]);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="card flex flex-col items-center gap-2 p-6 text-center">
        <Trophy size={48} className="text-fire" aria-hidden />
        <h2 className="text-2xl font-black">Conversación terminada</h2>
        <p className="text-muted">
          {good.length} de {done.length} turnos con una respuesta que comunica bien.
        </p>
      </div>
      <section className="card p-5">
        <h3 className="mb-2 font-black">Lo que hiciste bien</h3>
        {good.length ? (
          <ul className="flex flex-col gap-1">
            {good.slice(0, 3).map((d) => (
              <li key={d.turn} className="flex gap-2" lang="en">
                <Check size={18} className="shrink-0 text-good" aria-hidden /> {d.answer}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Esta vez costó; repítelo y verás la diferencia.</p>
        )}
      </section>
      {improve.length > 0 && (
        <section className="card p-5">
          <h3 className="mb-2 font-black">Para mejorar</h3>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {improve.slice(0, 3).map((t, k) => (
              <li key={k}>{t}</li>
            ))}
          </ul>
        </section>
      )}
      <section className="card p-5">
        <h3 className="mb-2 font-black">Expresiones útiles</h3>
        <ul className="flex flex-col gap-2">
          {rp.useful.slice(0, 6).map((u) => (
            <li key={u} className="flex items-center gap-2">
              <AudioButton text={u} size="sm" />
              <span className="font-semibold" lang="en">
                {u}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex gap-3">
        <a href={`/practicar/roleplay/${rp.id}`} className="btn btn-ghost grow">
          Repetir
        </a>
        <Link href="/practicar" className="btn btn-primary grow">
          Más prácticas
        </Link>
      </div>
    </div>
  );
}
