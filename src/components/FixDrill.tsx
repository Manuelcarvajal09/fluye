"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import type { CommonError } from "@/lib/types";
import { evaluateFix } from "@/lib/evaluate";
import { AudioButton, Bar } from "./ui";

/** "Corrige la frase": reescribe una frase con un error típico de hispanohablante. */
export function FixDrill({ items, dayId }: { items: CommonError[]; dayId: string }) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [res, setRes] = useState<"right" | "close" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const e = items[i];

  if (!items.length) return <p className="text-muted">El banco de errores aún no está disponible.</p>;

  if (!e)
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center gap-3 p-6 text-center">
        <p className="text-5xl font-black text-accent">
          {Math.round(score)}/{items.length}
        </p>
        <p className="text-muted">Los errores que corriges en voz alta y por escrito dejan de salirte en conversación.</p>
        <div className="flex gap-3">
          <a href="/practicar/corrige" className="btn btn-primary">
            Otra ronda
          </a>
          <Link href="/practicar" className="btn btn-ghost">
            Volver
          </Link>
        </div>
      </div>
    );

  function check() {
    const r = evaluateFix(value, e);
    setRes(r);
    const s = r === "right" ? 1 : r === "close" ? 0.7 : 0;
    setScore((x) => x + s);
    if (i + 1 === items.length) {
      const total = (score + s) / items.length;
      void fetch("/api/practice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "fix", id: dayId, score: total }) });
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Bar value={i} max={items.length} label="Progreso" />
        <span className="text-sm font-bold text-muted">
          {i + 1}/{items.length}
        </span>
      </div>
      <p className="font-bold text-muted">Esta frase tiene un error típico. Escríbela como la diría alguien de Canadá:</p>
      <p className="rounded-2xl bg-bad-soft p-4 text-xl font-bold line-through decoration-bad/40" lang="en">
        {e.wrong}
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!res && value.trim()) check();
        }}
      >
        <label htmlFor="fix" className="sr-only">
          Frase corregida
        </label>
        <input id="fix" lang="en" autoComplete="off" autoCapitalize="sentences" value={value} disabled={!!res} onChange={(ev) => setValue(ev.target.value)} className="h-14 rounded-2xl border-2 border-line bg-surface px-4 text-lg font-semibold outline-none focus:border-accent" placeholder="Tu versión corregida…" autoFocus />
        {!res && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setRes("wrong")}>
              No sé
            </button>
            <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
              Comprobar
            </button>
          </div>
        )}
      </form>
      {res && (
        <div className={`flex flex-col gap-2 rounded-2xl p-4 ${res === "wrong" ? "bg-bad-soft" : "bg-good-soft"}`}>
          <p className={`flex items-center gap-2 font-black ${res === "wrong" ? "text-bad" : "text-good"}`}>
            {res === "wrong" ? <X size={20} aria-hidden /> : <Check size={20} aria-hidden />}
            {res === "right" ? "¡Perfecto!" : res === "close" ? "Casi: revisa la versión natural" : "Versión natural:"}
          </p>
          {e.right.map((r) => (
            <p key={r} className="flex items-center gap-2 text-lg font-bold" lang="en">
              <AudioButton text={r} size="sm" /> {r}
            </p>
          ))}
          <p className="text-sm">{e.why_es}</p>
          <button
            type="button"
            className="btn btn-primary mt-1"
            autoFocus
            onClick={() => {
              setI(i + 1);
              setValue("");
              setRes(null);
            }}
          >
            Siguiente <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
