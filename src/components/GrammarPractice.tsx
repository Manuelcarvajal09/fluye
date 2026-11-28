"use client";
import { useState } from "react";
import type { Tense } from "@/lib/types";

export function GrammarPractice({ id, practice }: { id: string; practice: Tense["practice"] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const doneCount = Object.keys(picked).length;
  const right = practice.filter((p, i) => picked[i] === p.answer).length;
  return (
    <section className="card flex flex-col gap-4 p-5">
      <h2 className="text-lg font-black">Practica</h2>
      {practice.map((p, i) => (
        <div key={i} className="flex flex-col gap-2">
          <p className="font-bold" lang="en">
            {i + 1}. {p.q}
          </p>
          <div className="flex flex-wrap gap-2">
            {p.options.map((o, n) => {
              const state = picked[i] === undefined ? undefined : n === p.answer ? "right" : n === picked[i] ? "wrong" : undefined;
              return (
                <button
                  key={n}
                  type="button"
                  className="option !w-auto !min-h-11 !py-2"
                  data-state={state}
                  disabled={picked[i] !== undefined}
                  onClick={() => {
                    const next = { ...picked, [i]: n };
                    setPicked(next);
                    if (Object.keys(next).length === practice.length) {
                      const score = practice.filter((q, k) => next[k] === q.answer).length / practice.length;
                      void fetch("/api/practice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "grammar", id, score }) });
                    }
                  }}
                  lang="en"
                >
                  {o}
                </button>
              );
            })}
          </div>
          {picked[i] !== undefined && p.why_es && (
            <p className={`rounded-xl p-2.5 text-sm ${picked[i] === p.answer ? "bg-good-soft" : "bg-bad-soft"}`}>
              <b>{picked[i] === p.answer ? "Correcto. " : `La respuesta es «${p.options[p.answer]}». `}</b>
              {p.why_es}
            </p>
          )}
        </div>
      ))}
      {doneCount === practice.length && (
        <p className="rounded-2xl bg-accent-soft p-3 font-black text-accent" role="status">
          {right} de {practice.length} correctas
        </p>
      )}
    </section>
  );
}
