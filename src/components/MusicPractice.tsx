"use client";
import { useMemo, useState } from "react";
import { GenreCover } from "./ux/GenreCover";
import { SectionHeader } from "./ux/SectionHeader";
import { Check, ChevronDown, Info, Plus, Trash2 } from "lucide-react";
import type { MusicExercise } from "@/lib/types";
import { WordBank } from "./session/Exercises";
import { SpeakPanel } from "./SpeakPanel";
import { AudioButton } from "./ui";

const STYLE: Record<MusicExercise["style"], string> = {
  "rap-battle": "Batalla de rap",
  "flirty-pop": "Pop coqueto",
  "pop-funk": "Pop / funk",
};
const GENRE: Record<string, string> = {
  pop: "Pop",
  "r&b": "R&B",
  rap: "Rap",
  indie: "Indie",
  electronic: "Electrónica",
  funk: "Funk",
  country: "Country",
  rock: "Rock",
  "latin-pop": "Pop latino",
};
const SKILL: Record<string, string> = {
  reductions: "Reducciones",
  linking: "Enlace de palabras",
  metaphor: "Metáforas",
  pun: "Juegos de palabras",
  sarcasm: "Sarcasmo",
  punchline: "Remates",
  delivery: "Cantado vs. hablado",
};
type Fragment = { id: string; text: string; note: string };

/**
 * Ejercicios de canciones y rap con letras ORIGINALES escritas para Fluye (no de artistas reales).
 * Lo cantado o rapeado no se califica con una rúbrica de habla neutral: aquí se escucha, se entiende y se transfiere.
 */
export function MusicPractice({
  exercises,
  hiddenExplicit,
  initialFragments,
  initialDone,
}: {
  exercises: MusicExercise[];
  hiddenExplicit: number;
  initialFragments: Fragment[];
  initialDone: string[];
}) {
  const [style, setStyle] = useState<string>("all");
  const [frags, setFrags] = useState(initialFragments);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const list = useMemo(
    () =>
      exercises.filter(
        (e) => style === "all" || (e.genre ?? e.style) === style,
      ),
    [exercises, style],
  );
  const [done, setDone] = useState(() => new Set(initialDone));
  const [open, setOpen] = useState<string | null>(null);
  const next = list.find((e) => !done.has(e.id));
  // Agrupado por género (con su portada) cuando se ven todos.
  const groups = useMemo(() => {
    const m = new Map<string, MusicExercise[]>();
    for (const e of list) {
      const g = e.genre ?? e.style;
      m.set(g, [...(m.get(g) ?? []), e]);
    }
    return [...m.entries()];
  }, [list]);

  async function toggleDone(id: string) {
    const on = !done.has(id);
    setDone((d) => {
      const n = new Set(d);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
    await fetch("/api/music", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, done: on }),
    }).catch(() => {});
  }
  function openOne(id: string) {
    setOpen((o) => (o === id ? null : id));
    requestAnimationFrame(() =>
      document
        .getElementById(`m-${id}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  }

  async function saveFrags(next: Fragment[]) {
    setFrags(next);
    await fetch("/api/fragments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fragments: next }),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader art="musica" title="Música">
        <p className="max-w-prose text-muted">
          Reducciones como gonna o lemme, frases que se enlazan rápido,
          metáforas, juegos de palabras y sarcasmo. Todas las líneas son
          originales para practicar; no son letras de ningún artista.
        </p>
      </SectionHeader>
      <div
        className="seg self-start overflow-x-auto"
        role="tablist"
        aria-label="Género"
      >
        {[
          ["all", "Todos los géneros"],
          ...Object.entries(GENRE).filter(([g]) =>
            exercises.some((e) => e.genre === g),
          ),
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={style === id}
            onClick={() => setStyle(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {hiddenExplicit > 0 && (
        <p className="module-quiet flex items-center gap-2 p-3 text-sm text-muted">
          <Info size={16} aria-hidden /> {hiddenExplicit} ejercicios con
          lenguaje explícito están ocultos. Puedes mostrarlos en Ajustes →
          Lenguaje explícito.
        </p>
      )}
      <p className="text-sm font-bold text-muted">
        {list.filter((e) => done.has(e.id)).length} de {list.length} hechos
      </p>
      {next && (
        <button
          type="button"
          onClick={() => openOne(next.id)}
          className="hero-card flex items-center gap-4 p-4 text-left"
        >
          <GenreCover genre={next.genre ?? next.style} size={52} />
          <span className="min-w-0">
            <span className="eyebrow">Siguiente pendiente</span>
            <b className="block text-lg leading-tight">{next.title_es}</b>
            <span className="block text-sm text-muted">
              {GENRE[next.genre ?? ""] ?? STYLE[next.style]} ·{" "}
              {SKILL[next.skill] ?? next.skill}
            </span>
          </span>
        </button>
      )}
      {groups.map(([g, items]) => (
        <section
          key={g}
          className="flex flex-col gap-3"
          aria-label={GENRE[g] ?? STYLE[g as MusicExercise["style"]] ?? g}
        >
          {style === "all" && (
            <h2 className="flex items-center gap-2 text-lg font-black">
              <GenreCover genre={g} size={32} />{" "}
              {GENRE[g] ?? STYLE[g as MusicExercise["style"]] ?? g}
              <span className="text-sm font-bold text-muted">
                {items.filter((e) => done.has(e.id)).length}/{items.length}
              </span>
            </h2>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((e) => {
              const isOpen = open === e.id;
              const ok = done.has(e.id);
              return (
                <li
                  key={e.id}
                  id={`m-${e.id}`}
                  className={`module flex flex-col gap-3 p-4 ${isOpen ? "sm:col-span-2 xl:col-span-3" : ""}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => openOne(e.id)}
                    className="flex items-center gap-3 text-left"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${ok ? "border-good bg-good text-white" : "border-line text-muted"}`}
                      aria-hidden
                    >
                      {ok ? (
                        <Check size={18} strokeWidth={3} />
                      ) : (
                        <GenreCover genre={e.genre ?? e.style} size={24} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block leading-tight">{e.title_es}</b>
                      <span className="block text-xs text-muted">
                        {SKILL[e.skill] ?? e.skill}
                        {ok ? " · hecho" : ""}
                      </span>
                    </span>
                    <ChevronDown
                      size={18}
                      aria-hidden
                      className={`shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <>
                      <p className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="chip bg-accent-soft text-accent">
                          {GENRE[e.genre ?? ""] ?? STYLE[e.style]}
                        </span>
                        <span className="chip">
                          {SKILL[e.skill] ?? e.skill}
                        </span>
                        {e.confidence === "low" && (
                          <span className="chip bg-fire-soft text-fire">
                            Sentido incierto
                          </span>
                        )}
                      </p>
                      <blockquote className="rounded-[var(--r-md)] border-l-4 border-accent bg-surface-2 p-3">
                        <span
                          lang="en"
                          className="block text-lg font-extrabold italic"
                        >
                          {e.line}
                        </span>
                        {e.es && (
                          <span className="mt-1 block text-sm font-bold text-muted">
                            {e.es}
                          </span>
                        )}
                      </blockquote>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                        <AudioButton
                          text={e.line}
                          size="sm"
                          label="Escuchar la línea"
                        />{" "}
                        La línea
                        <AudioButton
                          text={e.spoken}
                          size="sm"
                          slow
                          label="Escuchar hablado y lento"
                        />{" "}
                        Hablado, lento
                      </div>
                      <details className="expand rounded-[var(--r-md)] bg-surface-2 p-3">
                        <summary className="flex items-center justify-between text-sm font-extrabold">
                          ¿Qué quiere decir?{" "}
                          <ChevronDown size={16} className="chev" aria-hidden />
                        </summary>
                        <div className="expand-body mt-2 flex flex-col gap-2 text-sm">
                          <p>
                            <b>Hablado:</b> {e.spoken}
                          </p>
                          {!!e.reductions?.length && (
                            <p>
                              <b>Reducciones:</b>{" "}
                              {e.reductions
                                .map((r) => `${r.sung} = ${r.full}`)
                                .join(" · ")}
                            </p>
                          )}
                          {e.literal_es && (
                            <p>
                              <b>Literal:</b> {e.literal_es}
                            </p>
                          )}
                          {!!e.breakdown?.length && (
                            <ul className="flex flex-col gap-1">
                              {e.breakdown.map((b) => (
                                <li key={b.text}>
                                  <b lang="en">{b.text}</b>: {b.es}
                                </li>
                              ))}
                            </ul>
                          )}
                          {e.linking_es && (
                            <p>
                              <b>Cómo suena:</b> {e.linking_es}
                            </p>
                          )}
                          <p>{e.explain_es}</p>
                          {e.intent_es && (
                            <p>
                              <b>Intención:</b> {e.intent_es}
                            </p>
                          )}
                          {e.usage_es && (
                            <p>
                              <b>
                                En la vida diaria
                                {e.register ? ` (${e.register})` : ""}:
                              </b>{" "}
                              {e.usage_es}
                            </p>
                          )}
                          {e.examples?.map((x) => (
                            <p key={x.en} className="flex items-start gap-2">
                              <AudioButton text={x.en} size="sm" />
                              <span>
                                <span lang="en" className="font-bold">
                                  {x.en}
                                </span>
                                <span className="block text-muted">{x.es}</span>
                              </span>
                            </p>
                          ))}
                          {e.artistic_es && (
                            <p className="text-muted">
                              Recurso artístico (no es un error):{" "}
                              {e.artistic_es}
                            </p>
                          )}
                          {e.transfer && (
                            <div className="rounded-[var(--r-sm)] bg-surface p-2">
                              <p className="font-bold">
                                Úsalo en otra situación: {e.transfer.prompt_es}
                              </p>
                              {e.transfer.model.map((m) => (
                                <p
                                  key={m}
                                  className="mt-1 flex items-center gap-2"
                                >
                                  <AudioButton text={m} size="sm" /> {m}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                      <MusicDrill line={e.spoken} />
                      <button
                        type="button"
                        className={`btn ${ok ? "btn-ghost" : "btn-primary"} self-start`}
                        onClick={() => void toggleDone(e.id)}
                      >
                        <Check size={18} aria-hidden />{" "}
                        {ok ? "Hecho · desmarcar" : "Marcar como hecho"}
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section
        className="module flex flex-col gap-3 p-5"
        aria-labelledby="frags"
      >
        <h2 id="frags" className="font-black">
          Mis fragmentos (privados)
        </h2>
        <p className="text-sm text-muted">
          Guarda aquí una frase corta que escuchaste para estudiarla. Solo la
          ves tú; no se publica ni se comparte. Evita pegar letras completas.
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!text.trim()) return;
            void saveFrags(
              [
                {
                  id: crypto.randomUUID(),
                  text: text.trim().slice(0, 200),
                  note: note.trim().slice(0, 200),
                },
                ...frags,
              ].slice(0, 100),
            );
            setText("");
            setNote("");
          }}
        >
          <label className="sr-only" htmlFor="frag">
            Fragmento en inglés
          </label>
          <input
            id="frag"
            value={text}
            maxLength={200}
            onChange={(ev) => setText(ev.target.value)}
            placeholder="Fragmento en inglés"
            className="h-11 flex-1 rounded-[var(--r-md)] border border-line bg-surface px-3 font-bold"
          />
          <label className="sr-only" htmlFor="fragnote">
            Nota
          </label>
          <input
            id="fragnote"
            value={note}
            maxLength={200}
            onChange={(ev) => setNote(ev.target.value)}
            placeholder="Qué crees que significa (opcional)"
            className="h-11 flex-1 rounded-[var(--r-md)] border border-line bg-surface px-3"
          />
          <button type="submit" className="btn btn-primary h-11 min-h-11">
            <Plus size={16} aria-hidden /> Guardar
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {frags.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-[var(--r-md)] bg-surface-2 p-2"
            >
              <AudioButton text={f.text} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{f.text}</span>
                {f.note && (
                  <span className="block text-sm text-muted">{f.note}</span>
                )}
              </span>
              <button
                type="button"
                aria-label="Borrar fragmento"
                className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface"
                onClick={() => saveFrags(frags.filter((x) => x.id !== f.id))}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Práctica de una línea: ordenarla con fichas (usa la versión hablada) o decirla en voz alta. */
function MusicDrill({ line }: { line: string }) {
  const [mode, setMode] = useState<null | "order" | "say">(null);
  const [res, setRes] = useState<boolean | null>(null);
  const [tiles] = useState(() =>
    line
      .replace(/[.!?,]/g, "")
      .split(/\s+/)
      .sort(() => Math.random() - 0.5),
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="chip-btn"
          aria-pressed={mode === "order"}
          onClick={() => (
            setMode(mode === "order" ? null : "order"),
            setRes(null)
          )}
        >
          Ordenar la frase
        </button>
        <button
          type="button"
          className="chip-btn"
          aria-pressed={mode === "say"}
          onClick={() => setMode(mode === "say" ? null : "say")}
        >
          Decirla en voz alta
        </button>
      </div>
      {mode === "order" && (
        <>
          <WordBank
            tiles={tiles}
            target={line}
            locked={res !== null}
            onDone={(r) => setRes(r.ok)}
          />
          {res !== null && (
            <p
              className={`text-sm font-black ${res ? "text-good" : "text-bad"}`}
            >
              {res ? "¡Bien ordenada!" : `Era: ${line}`}
            </p>
          )}
        </>
      )}
      {mode === "say" && (
        <SpeakPanel target={line} onResult={() => setMode(null)} compact />
      )}
    </div>
  );
}
