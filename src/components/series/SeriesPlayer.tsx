"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Eye, Languages, Pause, Play, X } from "lucide-react";
import type { SeriesScene } from "@/lib/types";
import { speak, speakSequence, stopSpeaking } from "@/lib/audio/tts";
import { playSfx } from "@/lib/audio/sfx";
import { SpeakPanel } from "../SpeakPanel";
import { MyMascot } from "../Coach";
import { Bar } from "../ui";

type Step = "listen" | "context" | "spot" | "gap" | "subs" | "intent" | "shadow" | "reply" | "done";
const ORDER: Step[] = ["listen", "context", "spot", "gap", "subs", "intent", "shadow", "reply", "done"];
const TITLE: Record<Step, string> = {
  listen: "1. Escucha sin subtítulos",
  context: "2. ¿Qué está pasando?",
  spot: "3. Escucha otra vez: ¿qué expresiones oíste?",
  gap: "4. Completa lo que dijo",
  subs: "5. Ahora con subtítulos",
  intent: "6. Lee entre líneas",
  shadow: "7. Shadowing: repite al mismo ritmo",
  reply: "8. Respóndele al personaje",
  done: "Resumen",
};

/**
 * Práctica de «Inglés de series»: se escucha primero sin texto y la ayuda se va abriendo poco a poco.
 * La puntuación sale de respuestas reales (contexto, expresiones, hueco e intención); no de XP.
 */
export function SeriesPlayer({ scene }: { scene: SeriesScene }) {
  const [step, setStep] = useState<Step>("listen");
  const [playing, setPlaying] = useState<number | null>(null);
  const [plays, setPlays] = useState(0);
  const [score, setScore] = useState<Record<string, boolean>>({});
  const [missed, setMissed] = useState<string[]>([]);
  const total = Object.keys(score).length;
  const right = Object.values(score).filter(Boolean).length;
  const next = () => {
    const to = ORDER[ORDER.indexOf(step) + 1];
    // Al terminar se guarda la comprensión medida (la mejor de cada escena) en el servidor.
    if (to === "done") void fetch("/api/series", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: scene.id, score: total ? right / total : 0, plays }) }).catch(() => {});
    setStep(to);
  };
  const lines = useMemo(() => scene.lines.map((l) => ({ text: l.en, gender: l.g })), [scene]);
  const play = async (rate?: number) => {
    stopSpeaking();
    setPlays((n) => n + 1);
    await speakSequence(rate ? lines.map((l) => ({ ...l, rate })) : lines, { gap: 350, onLine: setPlaying });
  };
  useEffect(() => () => stopSpeaking(), []);
  const mark = (k: string, ok: boolean, miss?: string[]) => {
    setScore((s) => ({ ...s, [k]: ok }));
    if (miss?.length) setMissed((m) => [...new Set([...m, ...miss])]);
    playSfx(ok ? "ok" : "bad");
  };


  const player = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-primary" onClick={() => (playing === null ? void play() : (stopSpeaking(), setPlaying(null)))}>
        {playing === null ? <Play size={18} fill="currentColor" aria-hidden /> : <Pause size={18} aria-hidden />} {playing === null ? (plays ? "Escuchar otra vez" : "Escuchar la escena") : "Detener"}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => void play(0.8)} disabled={playing !== null}>
        Más lento
      </button>
      {playing !== null && <span className="text-sm font-bold text-muted" aria-live="polite">Habla: {scene.lines[playing]?.who}</span>}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-start gap-3">
        <Link href="/series" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2" aria-label="Volver a las escenas">
          <X size={20} aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            {scene.level} · {scene.genre}
          </p>
          <h1 className="font-display text-3xl font-extrabold">{scene.title}</h1>
          <p className="text-muted">{scene.setting_es}</p>
        </div>
      </header>
      <Bar value={ORDER.indexOf(step)} max={ORDER.length - 1} label="Avance de la escena" className="h-2" />
      <section className="module flex flex-col gap-4 p-5" aria-live="polite">
        <h2 className="text-xl font-black">{TITLE[step]}</h2>

        {step === "listen" && (
          <>
            <p className="text-muted">Sin texto. Fíjate en quién habla, el tono y qué pasa. Puedes repetirla las veces que quieras.</p>
            {player}
            <button type="button" className="btn btn-ghost self-start" disabled={!plays} onClick={next}>
              Ya la escuché
            </button>
          </>
        )}

        {step === "context" && <Quiz q={scene.context} onDone={(ok) => mark("context", ok)} onNext={next} />}

        {step === "spot" && <Spot scene={scene} player={player} onDone={(ok, miss) => mark("spot", ok, miss)} onNext={next} />}

        {step === "gap" && (
          <Gap scene={scene} onDone={(ok) => mark("gap", ok, ok ? [] : [scene.gap.answer])} onNext={next} />
        )}

        {step === "subs" && (
          <>
            <Transcript scene={scene} playing={playing} />
            {player}
            <button type="button" className="btn btn-primary self-start" onClick={next}>
              Seguir
            </button>
          </>
        )}

        {step === "intent" && <Quiz q={scene.intent} onDone={(ok) => mark("intent", ok)} onNext={next} />}

        {step === "shadow" && (
          <>
            <p className="text-muted">Escucha la línea y repítela encima, imitando ritmo, contracciones y entonación.</p>
            <p lang="en" className="text-xl font-bold">
              {scene.lines[scene.shadow].en}
            </p>
            <SpeakPanel target={scene.lines[scene.shadow].en} onResult={next} showPitch compact />
            <button type="button" className="self-start text-sm font-bold text-muted underline" onClick={next}>
              Ahora no puedo hablar
            </button>
          </>
        )}

        {step === "reply" && <Reply scene={scene} onNext={next} />}

        {step === "done" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <MyMascot mood={right >= total - 1 ? "cheer" : "encourage"} size={96} />
              <p className="text-lg font-black">
                Comprensión: {right} de {total} {total ? `(${Math.round((right / total) * 100)} %)` : ""}
                <span className="block text-sm font-bold text-muted">Escuchaste la escena {plays} {plays === 1 ? "vez" : "veces"} antes de ver el texto y durante la práctica.</span>
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {scene.expressions.map((e) => (
                <li key={e.text} className={`rounded-xl p-3 ${missed.includes(e.text) ? "bg-bad-soft" : "bg-surface-2"}`}>
                  <b lang="en">{e.text}</b> — {e.es}
                  {missed.includes(e.text) && <span className="block text-xs font-bold text-bad">Te costó: repásala</span>}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Link href="/series" className="btn btn-primary">
                Otra escena
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => (setStep("listen"), setScore({}), setMissed([]), setPlays(0))}>
                Repetir esta
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Quiz({ q, onDone, onNext }: { q: SeriesScene["context"]; onDone: (ok: boolean) => void; onNext: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <>
      <p className="text-lg font-bold">{q.q_es}</p>
      <div className="grid gap-2">
        {q.options.map((o, i) => (
          <button key={i} type="button" className="option" disabled={picked !== null} data-state={picked === null ? undefined : i === q.answer ? "right" : i === picked ? "wrong" : undefined} onClick={() => (setPicked(i), onDone(i === q.answer))}>
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p className={`rounded-xl p-3 text-sm ${picked === q.answer ? "bg-good-soft" : "bg-bad-soft"}`}>{q.why_es}</p>
          <button type="button" className="btn btn-primary self-start" onClick={onNext}>
            Continuar
          </button>
        </>
      )}
    </>
  );
}

function Spot({ scene, player, onDone, onNext }: { scene: SeriesScene; player: React.ReactNode; onDone: (ok: boolean, missed: string[]) => void; onNext: () => void }) {
  const [opts] = useState(() => [...scene.expressions.map((e) => e.text), ...scene.decoys].sort(() => Math.random() - 0.5));
  const [sel, setSel] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const real = new Set(scene.expressions.map((e) => e.text));
  return (
    <>
      {player}
      <p className="text-muted">Marca todas las que aparecen en la escena (hay señuelos).</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const on = sel.includes(o);
          const st = !checked ? (on ? "is-on" : "") : real.has(o) ? "is-good" : on ? "is-bad" : "";
          return (
            <button key={o} type="button" lang="en" aria-pressed={on} disabled={checked} className={`chip-btn spot-chip ${st}`} onClick={() => setSel((s) => (on ? s.filter((x) => x !== o) : [...s, o]))}>
              {checked && real.has(o) && <Check size={14} aria-hidden />} {o}
            </button>
          );
        })}
      </div>
      {!checked ? (
        <button
          type="button"
          className="btn btn-primary self-start"
          disabled={!sel.length}
          onClick={() => {
            setChecked(true);
            const missed = [...real].filter((r) => !sel.includes(r));
            const wrong = sel.filter((s) => !real.has(s));
            onDone(!missed.length && !wrong.length, missed);
          }}
        >
          Comprobar
        </button>
      ) : (
        <button type="button" className="btn btn-primary self-start" onClick={onNext}>
          Continuar
        </button>
      )}
    </>
  );
}

function Gap({ scene, onDone, onNext }: { scene: SeriesScene; onDone: (ok: boolean) => void; onNext: () => void }) {
  const line = scene.lines[scene.gap.line];
  const [picked, setPicked] = useState<string | null>(null);
  const [opts] = useState(() => [...scene.gap.options].sort(() => Math.random() - 0.5));
  const i = line.en.toLowerCase().indexOf(scene.gap.answer.toLowerCase());
  const before = line.en.slice(0, i), after = line.en.slice(i + scene.gap.answer.length);
  return (
    <>
      <button type="button" className="btn btn-ghost self-start" onClick={() => void speak(line.en, { gender: line.g })}>
        <Play size={16} aria-hidden /> Escuchar la línea de {line.who}
      </button>
      <p lang="en" className="text-xl font-bold">
        {before}
        <span className="mx-1 inline-block min-w-24 border-b-2 border-accent text-center">{picked ? scene.gap.answer : "____"}</span>
        {after}
      </p>
      <div className="grid gap-2">
        {opts.map((o) => (
          <button key={o} type="button" lang="en" className="option" disabled={picked !== null} data-state={picked === null ? undefined : o === scene.gap.answer ? "right" : o === picked ? "wrong" : undefined} onClick={() => (setPicked(o), onDone(o === scene.gap.answer))}>
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <button type="button" className="btn btn-primary self-start" onClick={onNext}>
          Continuar
        </button>
      )}
    </>
  );
}

function Transcript({ scene, playing }: { scene: SeriesScene; playing: number | null }) {
  const [es, setEs] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="chip-btn self-start" aria-pressed={es} onClick={() => setEs((x) => !x)}>
        <Languages size={14} aria-hidden /> {es ? "Ocultar traducción" : "Ver traducción al español"}
      </button>
      <ol className="flex flex-col gap-2">
        {scene.lines.map((l, i) => (
          <li key={i} className={`rounded-xl p-2 ${playing === i ? "bg-accent-soft" : ""}`}>
            <button type="button" className="text-left" onClick={() => void speak(l.en, { gender: l.g })} aria-label={`Escuchar a ${l.who}: ${l.en}`}>
              <b>{l.who}:</b> <span lang="en">{l.en}</span>
            </button>
            {es && <span className="block text-sm text-muted">{l.es}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Reply({ scene, onNext }: { scene: SeriesScene; onNext: () => void }) {
  const [mode, setMode] = useState<"say" | "write" | null>(null);
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);
  return (
    <>
      <p className="text-lg font-bold">{scene.reply.prompt_es}</p>
      {!mode && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => setMode("say")}>
            Responder hablando
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setMode("write")}>
            Escribir
          </button>
        </div>
      )}
      {mode === "say" && <SpeakPanel target={scene.reply.model[0]} onResult={() => setShown(true)} compact />}
      {mode === "write" && (
        <form className="flex flex-col gap-2" onSubmit={(e) => (e.preventDefault(), setShown(true))}>
          <textarea lang="en" rows={2} className="rounded-2xl border-2 border-line bg-surface p-3 text-lg font-bold" value={text} onChange={(e) => setText(e.target.value)} aria-label="Tu respuesta" />
          <button type="submit" className="btn btn-primary self-start" disabled={!text.trim()}>
            Ver respuestas naturales
          </button>
        </form>
      )}
      {shown && (
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="mb-1 text-sm font-bold text-muted">
            <Eye size={14} className="inline" aria-hidden /> Respuestas naturales (hay más formas correctas; compara la tuya):
          </p>
          <ul className="flex flex-col gap-1">
            {scene.reply.model.map((m) => (
              <li key={m} lang="en">
                <button type="button" className="text-left font-bold underline-offset-4 hover:underline" onClick={() => void speak(m)}>
                  {m}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(shown || mode) && (
        <button type="button" className="btn btn-primary self-start" onClick={onNext}>
          Terminar
        </button>
      )}
    </>
  );
}
