"use client";
import { useMemo, useState } from "react";
import { Ear, Mic, RefreshCw, Check, X } from "lucide-react";
import type { Sound } from "@/lib/types";
import { speakSequence } from "@/lib/audio/tts";
import { AudioButton, Bar } from "./ui";
import { SpeakPanel, type SpeakResult } from "./SpeakPanel";

type Trial = { pair: Sound["pairs"][number]; target: "a" | "b" };

const ROUND = 10;

function makeRound(sound: Sound): Trial[] {
  const out: Trial[] = [];
  for (let i = 0; i < ROUND; i++) out.push({ pair: sound.pairs[i % sound.pairs.length], target: Math.random() < 0.5 ? "a" : "b" });
  return out.sort(() => Math.random() - 0.5);
}

async function save(soundId: string, body: Record<string, number>) {
  await fetch("/api/sound", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ soundId, ...body }) }).catch(() => {});
}

export function SoundTrainer({ sound }: { sound: Sound }) {
  const [tab, setTab] = useState<"ear" | "voice">("ear");
  return (
    <section className="card p-5">
      <div role="tablist" aria-label="Práctica" className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1">
        {([
          ["ear", "Entrena el oído", <Ear key="e" size={18} aria-hidden />],
          ["voice", "Practica tu voz", <Mic key="m" size={18} aria-hidden />],
        ] as const).map(([k, label, icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`flex h-11 items-center justify-center gap-2 rounded-xl font-extrabold ${tab === k ? "bg-surface shadow-card" : "text-muted"}`}>
            {icon} {label}
          </button>
        ))}
      </div>
      {tab === "ear" ? <Perception sound={sound} /> : <Production sound={sound} />}
    </section>
  );
}

/** Pares mínimos: la app dice una de las dos palabras y eliges cuál oíste. Esto sí se puede medir. */
function Perception({ sound }: { sound: Sound }) {
  const [trials, setTrials] = useState(() => makeRound(sound));
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [right, setRight] = useState(0);
  const t = trials[n];
  const finished = n >= trials.length;

  function pick(side: "a" | "b") {
    if (picked) return;
    setPicked(side);
    if (side === t.target) setRight((r) => r + 1);
  }
  function next() {
    const last = n + 1 >= trials.length;
    if (last) void save(sound.id, { perceptionTotal: trials.length, perceptionCorrect: right });
    setPicked(null);
    setN((x) => x + 1);
  }

  if (finished)
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-5xl font-black text-accent">
          {right}/{trials.length}
        </p>
        <p className="text-muted">{right >= 9 ? "Tu oído ya distingue este contraste. ¡Excelente!" : right >= 7 ? "Vas muy bien. Otra ronda para afinarlo." : "Este contraste todavía cuesta: es normal. Repite y escucha despacio."}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setTrials(makeRound(sound));
            setN(0);
            setRight(0);
          }}
        >
          <RefreshCw size={18} aria-hidden /> Otra ronda
        </button>
      </div>
    );

  const word = t.pair[t.target].word;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Bar value={n} max={trials.length} color="var(--accent)" label="Progreso de la ronda" />
        <span className="text-sm font-bold text-muted">
          {n + 1}/{trials.length}
        </span>
      </div>
      <p className="text-center text-lg font-bold">¿Qué palabra escuchaste?</p>
      <div className="flex justify-center gap-3">
        <AudioButton text={word} size="lg" autoPlayKey={`${n}-${word}`} />
        <AudioButton text={word} size="lg" slow />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => {
          const w = t.pair[side];
          const state = !picked ? undefined : side === t.target ? "right" : side === picked ? "wrong" : undefined;
          return (
            <button key={side} type="button" className="option flex flex-col items-center gap-1 !text-center" data-state={state} onClick={() => pick(side)}>
              <span className="text-2xl font-black" lang="en">
                {w.word}
              </span>
              <span className="font-mono text-sm text-muted">{w.ipa}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-3 ${picked === t.target ? "bg-good-soft" : "bg-bad-soft"}`}>
          <span className="flex items-center gap-1 font-black">
            {picked === t.target ? <Check size={20} aria-hidden /> : <X size={20} aria-hidden />} {picked === t.target ? "¡Bien!" : `Era “${word}”`}
          </span>
          <button type="button" className="btn btn-ghost h-10 min-h-10 px-3 text-sm" onClick={() => void speakSequence([{ text: t.pair.a.word, rate: 0.85 }, { text: t.pair.b.word, rate: 0.85 }], { gap: 700 })}>
            Oír las dos
          </button>
          <button type="button" className="btn btn-primary ml-auto h-10 min-h-10" onClick={next} autoFocus>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

/** Producción: escucha la referencia, grábate, compárate y autoevalúate. */
function Production({ sound }: { sound: Sound }) {
  const targets = useMemo(() => [...sound.words.map((w) => w.word), ...sound.pairs.slice(0, 4).map((p) => `${p.a.word}, ${p.b.word}`), ...sound.phrases.map((p) => p.en)], [sound]);
  const [n, setN] = useState(0);
  const [count, setCount] = useState(0);
  const target = targets[n % targets.length];
  const phrase = sound.phrases.find((p) => p.en === target);

  function onResult(r: SpeakResult) {
    setCount((c) => c + 1);
    void save(sound.id, { recordings: 1, selfScore: r.self ?? 0 });
    setN((x) => x + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-muted">
        Ejercicio {(n % targets.length) + 1} de {targets.length} · {count} grabaciones hoy en este sonido
      </p>
      <div>
        <p className="text-3xl font-black" lang="en">
          {target}
        </p>
        {phrase && <p className="text-muted">{phrase.es}</p>}
      </div>
      <SpeakPanel key={n} target={target} onResult={onResult} showPitch={!!phrase} />
    </div>
  );
}
