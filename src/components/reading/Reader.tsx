"use client";
import { Fragment, useMemo, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type Gloss = { term: string; es: string; def?: string; note?: string };
type Pop = { term: string; es: string | null; def?: string; note?: string; loading?: boolean };

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Lector con ayuda: las palabras del glosario van resaltadas (botones accesibles) y cualquier otra palabra se puede
 * tocar para ver su traducción con el diccionario de la app (sin servicios externos).
 */
export function Reader({ paragraphs, glossary = [] }: { paragraphs: string[]; glossary?: Gloss[] }) {
  const [pop, setPop] = useState<Pop | null>(null);
  const re = useMemo(() => (glossary.length ? new RegExp(`\\b(${[...glossary].sort((a, b) => b.term.length - a.term.length).map((g) => esc(g.term)).join("|")})\\b`, "gi") : null), [glossary]);
  const byTerm = useMemo(() => new Map(glossary.map((g) => [g.term.toLowerCase(), g])), [glossary]);

  async function lookup(word: string) {
    const w = word.replace(/[^A-Za-z'-]/g, "");
    if (w.length < 2) return;
    setPop({ term: w, es: null, loading: true });
    const r = await fetch(`/api/dict?w=${encodeURIComponent(w)}`).then((x) => x.json()).catch(() => null);
    setPop({ term: r?.term ?? w, es: r?.es ?? null, def: r?.def });
  }
  const onText = (e: MouseEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    if (t.dataset.w) void lookup(t.dataset.w);
  };
  const words = (text: string, key: string) =>
    text.split(/(\s+)/).map((tok, i) =>
      /\s+/.test(tok) || !/[A-Za-z]/.test(tok) ? (
        <Fragment key={`${key}-${i}`}>{tok}</Fragment>
      ) : (
        <span key={`${key}-${i}`} data-w={tok} className="cursor-pointer rounded hover:bg-accent-soft">
          {tok}
        </span>
      ),
    );

  return (
    <div className="relative">
      <div lang="en" className="flex flex-col gap-4 text-[1.05rem] leading-relaxed" onClick={onText}>
        {paragraphs.map((p, pi) => {
          if (!re) return <p key={pi}>{words(p, `p${pi}`)}</p>;
          const parts = p.split(re);
          return (
            <p key={pi}>
              {parts.map((part, i) => {
                const g = byTerm.get(part.toLowerCase());
                return g ? (
                  <button key={i} type="button" onClick={(e) => (e.stopPropagation(), setPop({ term: g.term, es: g.es, def: g.def, note: g.note }))} className="rounded bg-brand-soft px-0.5 font-bold text-brand-ink underline decoration-dotted underline-offset-4">
                    {part}
                  </button>
                ) : (
                  <Fragment key={i}>{words(part, `p${pi}-${i}`)}</Fragment>
                );
              })}
            </p>
          );
        })}
      </div>
      {pop &&
        // Portal al body: un contenedor con transform (animación de entrada) rompería la posición fija.
        createPortal(
        <div role="dialog" aria-label={`Significado de ${pop.term}`} className="fixed inset-x-3 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md rounded-[var(--r-lg)] border border-line bg-surface p-4 shadow-lg lg:bottom-6">
          <button type="button" onClick={() => setPop(null)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-surface-2" aria-label="Cerrar">
            <X size={16} aria-hidden />
          </button>
          <p className="pr-10 text-lg font-black" lang="en">
            {pop.term}
          </p>
          {pop.loading ? <p className="text-sm text-muted">Buscando…</p> : pop.es ? <p className="font-bold">{pop.es}</p> : <p className="text-sm text-muted">No está en el diccionario de la app.</p>}
          {pop.def && (
            <p className="text-sm text-muted" lang="en">
              {pop.def}
            </p>
          )}
          {pop.note && <p className="mt-1 text-sm">{pop.note}</p>}
        </div>,
          document.body,
        )}
    </div>
  );
}
