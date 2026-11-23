"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Languages, Mic, Pencil, Play, Square, Trash2, Turtle, Captions } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { plain } from "@/lib/types";
import { speak, speakSequence, stopSpeaking } from "@/lib/audio/tts";
import { useRecorder } from "@/lib/audio/recorder";
import { checkTyped } from "@/lib/answer";
import { markActive } from "../ActivityTracker";
import { Highlight } from "../ui";

type Consult = "transcript" | "subtitles" | "translation" | "line";
const log = (lessonId: string, kind: Consult) => void fetch("/api/listen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId, kind }) }).catch(() => {});

/**
 * Escucha activa: la transcripción empieza oculta (consultarla queda registrado),
 * subtítulos progresivos opcionales, repetir cualquier fragmento (normal o lento), dictado y sombra (grabar y comparar A/B).
 * Las grabaciones viven solo en la memoria del navegador y se pueden borrar.
 */
export function ListenStory({ lesson: l, onNext, label }: { lesson: Lesson & { simulated?: boolean }; onNext: () => void; label: string }) {
  const [showText, setShowText] = useState(false);
  const [subs, setSubs] = useState(false);
  const [showEs, setShowEs] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [heard, setHeard] = useState<Set<number>>(new Set());
  const [peek, setPeek] = useState<Set<number>>(new Set());
  const [tool, setTool] = useState<{ line: number; kind: "dict" | "shadow" } | null>(null);
  const logged = useRef(new Set<Consult>());
  const once = (k: Consult) => {
    if (logged.current.has(k)) return;
    logged.current.add(k);
    log(l.id, k);
  };

  useEffect(() => () => stopSpeaking(), []);

  function playAll() {
    markActive();
    void speakSequence(
      l.lines.map((ln) => ({ text: plain(ln.en), speaker: ln.who })),
      {
        gap: 900,
        onLine: (i) => {
          setPlaying(i);
          if (i !== null) setHeard((h) => new Set(h).add(i));
        },
      },
    );
  }
  const visible = (n: number) => showText || peek.has(n) || (subs && heard.has(n));

  return (
    <section className="flex flex-1 flex-col">
      <p className="mb-1 text-sm font-black text-muted">{label}</p>
      <h2 className="font-display text-3xl font-extrabold">{l.title}</h2>
      <p className="mb-4 text-muted">{l.intro_es}</p>
      {l.simulated && <p className="mb-3 rounded-[var(--r-md)] bg-fire-soft px-3 py-2 text-sm font-bold text-fire">Noticia simulada para practicar: no es real.</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-accent h-11 min-h-11" onClick={playAll}>
          <Play size={18} fill="currentColor" aria-hidden /> Escuchar todo
        </button>
        <button type="button" className="btn btn-ghost h-11 min-h-11" aria-pressed={subs} onClick={() => (setSubs((v) => !v), once("subtitles"))}>
          <Captions size={18} aria-hidden /> Subtítulos al escuchar
        </button>
        <button type="button" className="btn btn-ghost h-11 min-h-11" aria-pressed={showText} onClick={() => (setShowText((v) => !v), once("transcript"))}>
          {showText ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />} {showText ? "Ocultar texto" : "Ver texto"}
        </button>
        {(showText || subs) && (
          <button type="button" className="btn btn-ghost h-11 min-h-11" aria-pressed={showEs} onClick={() => (setShowEs((v) => !v), once("translation"))}>
            <Languages size={18} aria-hidden /> {showEs ? "Ocultar español" : "Español"}
          </button>
        )}
      </div>
      {!showText && <p className="mb-3 text-sm text-muted">Primero escucha sin leer. Si lo necesitas, ve el texto de una línea o de todo.</p>}

      <ol className="flex flex-col gap-2">
        {l.lines.map((ln, n) => (
          <li key={n} className={`rounded-[var(--r-md)] border p-3 transition-colors duration-200 ${playing === n ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>
            <div className="flex items-start gap-2">
              <button type="button" aria-label={`Repetir la línea ${n + 1}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-white" onClick={() => (markActive(), setHeard((h) => new Set(h).add(n)), void speak(plain(ln.en), { speaker: ln.who }))}>
                <Play size={16} fill="currentColor" aria-hidden />
              </button>
              <button type="button" aria-label={`Repetir la línea ${n + 1} lento`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent" onClick={() => (markActive(), void speak(plain(ln.en), { speaker: ln.who, rate: 0.7 }))}>
                <Turtle size={18} aria-hidden />
              </button>
              <div className="min-w-0 flex-1">
                {ln.who && <p className="text-xs font-black text-accent">{ln.who}</p>}
                {visible(n) ? (
                  <p lang="en" className="text-lg font-semibold">
                    <Highlight text={ln.en} />
                  </p>
                ) : (
                  <button type="button" className="text-left text-sm font-bold text-muted underline-offset-4 hover:underline" onClick={() => (setPeek((p) => new Set(p).add(n)), once("line"))}>
                    ••• ••••• •••• — ver esta línea
                  </button>
                )}
                {showEs && visible(n) && <p className="text-muted">{ln.es}</p>}
              </div>
            </div>
            <div className="mt-2 flex gap-2 pl-[5.5rem]">
              <button type="button" className="chip" aria-pressed={tool?.line === n && tool.kind === "dict"} onClick={() => setTool(tool?.line === n && tool.kind === "dict" ? null : { line: n, kind: "dict" })}>
                <Pencil size={12} aria-hidden /> Dictado
              </button>
              <button type="button" className="chip" aria-pressed={tool?.line === n && tool.kind === "shadow"} onClick={() => setTool(tool?.line === n && tool.kind === "shadow" ? null : { line: n, kind: "shadow" })}>
                <Mic size={12} aria-hidden /> Sombra
              </button>
            </div>
            {tool?.line === n && tool.kind === "dict" && <Dictation text={plain(ln.en)} speaker={ln.who} />}
            {tool?.line === n && tool.kind === "shadow" && <Shadow text={plain(ln.en)} speaker={ln.who} />}
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-primary mt-6 w-full" onClick={() => (stopSpeaking(), onNext())}>
        Continuar
      </button>
    </section>
  );
}

/** Escribe lo que oyes. Se compara de forma tolerante; no afecta tus repasos. */
function Dictation({ text, speaker }: { text: string; speaker?: string }) {
  const [v, setV] = useState("");
  const [r, setR] = useState<string | null>(null);
  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setR(checkTyped(v, text));
      }}
    >
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost h-10 min-h-10" onClick={() => void speak(text, { speaker })} aria-label="Escuchar otra vez">
          <Play size={15} aria-hidden />
        </button>
        <label className="sr-only" htmlFor={`d-${text.length}`}>
          Escribe lo que oyes
        </label>
        <input id={`d-${text.length}`} value={v} onChange={(e) => (setV(e.target.value), setR(null))} placeholder="Escribe lo que oyes…" className="h-10 flex-1 rounded-[var(--r-sm)] border border-line bg-surface px-3 font-bold" />
        <button className="btn btn-primary h-10 min-h-10">Revisar</button>
      </div>
      {r && (
        <p className={`text-sm font-bold ${r === "exact" ? "text-good" : r === "close" ? "text-fire" : "text-bad"}`}>
          {r === "exact" ? "¡Exacto!" : r === "close" ? "Casi:" : "Era:"} {r !== "exact" && <span lang="en">{text}</span>}
        </p>
      )}
    </form>
  );
}

/** Sombra: escucha, graba tu versión y compara A/B (tu grabación también lenta, sin cambiar el tono). */
function Shadow({ text, speaker }: { text: string; speaker?: string }) {
  const rec = useRecorder();
  const audio = useRef<HTMLAudioElement | null>(null);
  function playMine(rate: number) {
    if (!rec.url) return;
    audio.current?.pause();
    const a = new Audio(rec.url);
    a.playbackRate = rate;
    a.preservesPitch = true;
    audio.current = a;
    markActive();
    void a.play();
  }
  useEffect(() => () => audio.current?.pause(), []);
  if (rec.state === "denied" || rec.state === "unsupported")
    return <p className="mt-3 text-sm text-muted">Sin micrófono disponible. Puedes hacer la sombra en voz alta sin grabar: escucha y repite al mismo ritmo.</p>;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" onClick={() => void speak(text, { speaker })}>
        <Play size={15} aria-hidden /> A: modelo
      </button>
      {rec.state === "recording" ? (
        <button type="button" className="btn btn-bad h-10 min-h-10 animate-pulse text-sm" onClick={rec.stop}>
          <Square size={14} aria-hidden /> Detener
        </button>
      ) : (
        <button type="button" className="btn btn-accent h-10 min-h-10 text-sm" onClick={() => (markActive(), void rec.start(10_000))}>
          <Mic size={15} aria-hidden /> {rec.url ? "Grabar de nuevo" : "Grabar mi voz"}
        </button>
      )}
      {rec.url && (
        <>
          <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" onClick={() => playMine(1)}>
            <Play size={15} aria-hidden /> B: yo
          </button>
          <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" onClick={() => playMine(0.75)}>
            <Turtle size={15} aria-hidden /> Yo, lento
          </button>
          <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" onClick={rec.reset} aria-label="Borrar mi grabación">
            <Trash2 size={15} aria-hidden />
          </button>
        </>
      )}
      <p className="w-full text-xs text-muted">Tu grabación se queda en este navegador y se borra al salir. No se califica: compara tú.</p>
    </div>
  );
}
