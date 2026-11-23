"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Info, Music2, Plus, Trash2 } from "lucide-react";
import type { MusicExercise } from "@/lib/types";
import { AudioButton } from "./ui";

const STYLE: Record<MusicExercise["style"], string> = { "rap-battle": "Batalla de rap", "flirty-pop": "Pop coqueto", "pop-funk": "Pop / funk" };
const SKILL: Record<string, string> = { reductions: "Reducciones", linking: "Enlace de palabras", metaphor: "Metáforas", pun: "Juegos de palabras", sarcasm: "Sarcasmo", punchline: "Remates", delivery: "Cantado vs. hablado" };
type Fragment = { id: string; text: string; note: string };

/**
 * Ejercicios de canciones y rap con letras ORIGINALES escritas para Fluye (no de artistas reales).
 * Lo cantado o rapeado no se califica con una rúbrica de habla neutral: aquí se escucha, se entiende y se transfiere.
 */
export function MusicPractice({ exercises, hiddenExplicit, initialFragments }: { exercises: MusicExercise[]; hiddenExplicit: number; initialFragments: Fragment[] }) {
  const [style, setStyle] = useState<string>("all");
  const [frags, setFrags] = useState(initialFragments);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const list = useMemo(() => exercises.filter((e) => style === "all" || e.style === style), [exercises, style]);

  async function saveFrags(next: Fragment[]) {
    setFrags(next);
    await fetch("/api/fragments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fragments: next }) });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold">
          <Music2 size={34} className="text-accent" aria-hidden /> Música y rap
        </h1>
        <p className="mt-1 max-w-prose text-muted">Reducciones como gonna o lemme, frases que se enlazan rápido, metáforas, juegos de palabras y sarcasmo. Todas las líneas son originales para practicar; no son letras de ningún artista.</p>
      </header>
      <div className="seg self-start overflow-x-auto" role="tablist" aria-label="Estilo">
        {[["all", "Todo"], ...Object.entries(STYLE)].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={style === id} onClick={() => setStyle(id)}>
            {label}
          </button>
        ))}
      </div>
      {hiddenExplicit > 0 && (
        <p className="module-quiet flex items-center gap-2 p-3 text-sm text-muted">
          <Info size={16} aria-hidden /> {hiddenExplicit} ejercicios con lenguaje explícito están ocultos. Puedes mostrarlos en Ajustes → Lenguaje explícito.
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-2 3xl:grid-cols-3">
        {list.map((e) => (
          <li key={e.id} className="module flex flex-col gap-3 p-5">
            <p className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="chip bg-accent-soft text-accent">{STYLE[e.style]}</span>
              <span className="chip">{SKILL[e.skill] ?? e.skill}</span>
              {e.confidence === "low" && <span className="chip bg-fire-soft text-fire">Sentido incierto</span>}
            </p>
            <h2 className="font-black">{e.title_es}</h2>
            <blockquote className="rounded-[var(--r-md)] border-l-4 border-accent bg-surface-2 p-3 text-lg font-extrabold italic">{e.line}</blockquote>
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <AudioButton text={e.line} size="sm" label="Escuchar la línea" /> La línea
              <AudioButton text={e.spoken} size="sm" slow label="Escuchar hablado y lento" /> Hablado, lento
            </div>
            <details className="expand rounded-[var(--r-md)] bg-surface-2 p-3">
              <summary className="flex items-center justify-between text-sm font-extrabold">
                ¿Qué quiere decir? <ChevronDown size={16} className="chev" aria-hidden />
              </summary>
              <div className="expand-body mt-2 flex flex-col gap-2 text-sm">
                <p>
                  <b>Hablado:</b> {e.spoken}
                </p>
                {!!e.reductions?.length && (
                  <p>
                    <b>Reducciones:</b> {e.reductions.map((r) => `${r.sung} = ${r.full}`).join(" · ")}
                  </p>
                )}
                <p>{e.explain_es}</p>
                {e.artistic_es && <p className="text-muted">Recurso artístico (no es un error): {e.artistic_es}</p>}
                {e.transfer && (
                  <div className="rounded-[var(--r-sm)] bg-surface p-2">
                    <p className="font-bold">Úsalo en otra situación: {e.transfer.prompt_es}</p>
                    {e.transfer.model.map((m) => (
                      <p key={m} className="mt-1 flex items-center gap-2">
                        <AudioButton text={m} size="sm" /> {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section className="module flex flex-col gap-3 p-5" aria-labelledby="frags">
        <h2 id="frags" className="font-black">
          Mis fragmentos (privados)
        </h2>
        <p className="text-sm text-muted">Guarda aquí una frase corta que escuchaste para estudiarla. Solo la ves tú; no se publica ni se comparte. Evita pegar letras completas.</p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!text.trim()) return;
            void saveFrags([{ id: crypto.randomUUID(), text: text.trim().slice(0, 200), note: note.trim().slice(0, 200) }, ...frags].slice(0, 100));
            setText("");
            setNote("");
          }}
        >
          <label className="sr-only" htmlFor="frag">
            Fragmento en inglés
          </label>
          <input id="frag" value={text} maxLength={200} onChange={(ev) => setText(ev.target.value)} placeholder="Fragmento en inglés" className="h-11 flex-1 rounded-[var(--r-md)] border border-line bg-surface px-3 font-bold" />
          <label className="sr-only" htmlFor="fragnote">
            Nota
          </label>
          <input id="fragnote" value={note} maxLength={200} onChange={(ev) => setNote(ev.target.value)} placeholder="Qué crees que significa (opcional)" className="h-11 flex-1 rounded-[var(--r-md)] border border-line bg-surface px-3" />
          <button type="submit" className="btn btn-primary h-11 min-h-11">
            <Plus size={16} aria-hidden /> Guardar
          </button>
        </form>
        <ul className="flex flex-col gap-2">
          {frags.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-[var(--r-md)] bg-surface-2 p-2">
              <AudioButton text={f.text} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{f.text}</span>
                {f.note && <span className="block text-sm text-muted">{f.note}</span>}
              </span>
              <button type="button" aria-label="Borrar fragmento" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface" onClick={() => saveFrags(frags.filter((x) => x.id !== f.id))}>
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
