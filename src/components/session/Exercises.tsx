"use client";
import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Undo2 } from "lucide-react";
import { gradeSentence, type WordOp } from "@/lib/answer";
import { ErrorIcon, type ErrorKind } from "../ux/ErrorIcon";
import type { Alt } from "@/lib/types";
import { AudioButton } from "../ui";
import { playSfx } from "@/lib/audio/sfx";

type Grade = 1 | 2 | 3 | 4;
export type SentenceResult = { ok: boolean; grade: Grade; given: string; ops: WordOp[]; close: boolean };

const gradeOf = (r: "exact" | "close" | "wrong"): Grade => (r === "exact" ? 3 : r === "close" ? 2 : 1);

/**
 * Banco de palabras: se construye la frase tocando fichas en orden (también con teclado: Tab + Enter/Espacio;
 * Retroceso quita la última). Tocar una ficha colocada la devuelve. No depende de arrastrar.
 */
export function WordBank({ tiles, target, locked, onDone }: { tiles: string[]; target: string; locked: boolean; onDone: (r: SentenceResult) => void }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const free = tiles.map((_, i) => i).filter((i) => !placed.includes(i));
  const text = placed.map((i) => tiles[i]).join(" ");
  useEffect(() => {
    if (locked) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Backspace" && !(e.target instanceof HTMLInputElement)) setPlaced((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [locked]);
  const check = () => {
    const { result, ops } = gradeSentence(text, target);
    onDone({ ok: result !== "wrong", grade: gradeOf(result), given: text, ops, close: result === "close" });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="wb-line" aria-label="Tu frase" aria-live="polite">
        {placed.length === 0 && <span className="text-muted">Toca las palabras en orden…</span>}
        {placed.map((i, k) => (
          <button key={`${i}-${k}`} type="button" className="wb-tile is-placed" disabled={locked} onClick={() => setPlaced((p) => p.filter((x) => x !== i))} aria-label={`Quitar «${tiles[i]}»`}>
            {tiles[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Palabras disponibles">
        {tiles.map((w, i) => (
          <button key={i} type="button" className={`wb-tile ${free.includes(i) ? "" : "is-used"}`} disabled={locked || !free.includes(i)} onClick={() => (setPlaced((p) => [...p, i]), playSfx("ok"))} aria-label={`Añadir «${w}»`}>
            {w}
          </button>
        ))}
      </div>
      {!locked && (
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => setPlaced([])} disabled={!placed.length} aria-label="Borrar todo">
            <Undo2 size={18} aria-hidden />
          </button>
          <button type="button" className="btn btn-primary" disabled={!placed.length} onClick={check}>
            Comprobar
          </button>
        </div>
      )}
    </div>
  );
}

/** Dictado: escribir la frase completa que se escucha (con audio normal y lento). */
export function Dictation({ sentence, locked, onDone, onGiveUp }: { sentence: string; locked: boolean; onDone: (r: SentenceResult) => void; onGiveUp: () => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (locked || !value.trim()) return;
        const { result, ops } = gradeSentence(value, sentence);
        onDone({ ok: result !== "wrong", grade: gradeOf(result), given: value, ops, close: result === "close" });
      }}
    >
      <div className="flex justify-center gap-3 py-2">
        <AudioButton text={sentence} size="lg" autoPlayKey={sentence} />
        <AudioButton text={sentence} size="lg" slow />
      </div>
      <label htmlFor="dictation" className="sr-only">
        Escribe lo que escuchas
      </label>
      <textarea
        id="dictation"
        autoFocus
        lang="en"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        rows={2}
        disabled={locked}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), e.currentTarget.form?.requestSubmit())}
        className="rounded-2xl border-2 border-line bg-surface p-4 text-xl font-bold outline-none focus:border-accent"
        placeholder="Escribe la frase completa…"
      />
      {!locked && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn btn-ghost" onClick={onGiveUp}>
            No la entendí
          </button>
          <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
            Comprobar
          </button>
        </div>
      )}
    </form>
  );
}

/** Diferencias palabra por palabra entre lo esperado y lo escrito. */
export function WordDiff({ ops }: { ops: WordOp[] }) {
  return (
    <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-base" lang="en">
      {ops.map((o, i) =>
        o.op === "ok" ? (
          <span key={i}>{o.want}</span>
        ) : o.op === "missing" ? (
          <span key={i} className="diff-miss" title="Faltó">
            {o.want}
          </span>
        ) : o.op === "extra" ? (
          <span key={i} className="diff-extra" title="Sobró">
            {o.got}
          </span>
        ) : (
          <span key={i} className={o.op === "near" ? "diff-near" : "diff-sub"} title={`Escribiste «${o.got}»`}>
            {o.want}
          </span>
        ),
      )}
    </p>
  );
}

/** Una línea por diferencia entre lo escrito y la frase correcta, con el icono del tipo de error. */
export function OpsHint({ ops }: { ops: WordOp[] }) {
  const norm = (w?: string) => (w ?? "").toLowerCase().replace(/[^a-z']/g, "");
  const missing = new Set(ops.filter((o) => o.op === "missing").map((o) => norm(o.want)));
  const moved = new Set(ops.filter((o) => o.op === "extra" && missing.has(norm(o.got))).map((o) => norm(o.got)));
  const q = (ws: string[]) => ws.map((w) => `«${w}»`).join(", ");
  const miss: string[] = [], extra: string[] = [], order: string[] = [], subs: string[] = [];
  for (const o of ops) {
    if (o.op === "ok") continue;
    if (o.op === "missing") (moved.has(norm(o.want)) ? order : miss).push(o.want ?? "");
    else if (o.op === "extra") { if (!moved.has(norm(o.got))) extra.push(o.got ?? ""); }
    else subs.push(`«${o.got}» debería ser «${o.want}»`);
  }
  // Una línea por tipo: varias palabras del mismo tipo se agrupan para no llenar la pantalla.
  const lines: { kind: ErrorKind; text: string }[] = [];
  if (order.length) lines.push({ kind: "orden", text: order.length === 1 ? `«${order[0]}» va en otro lugar de la frase` : `Cambia de lugar ${q(order)}` });
  if (miss.length) lines.push({ kind: "falta", text: miss.length === 1 ? `Te faltó «${miss[0]}»` : `Te faltaron ${q(miss)}` });
  if (extra.length) lines.push({ kind: "sobra", text: extra.length === 1 ? `Sobró «${extra[0]}»` : `Sobraron ${q(extra)}` });
  for (const t of subs.slice(0, 3)) lines.push({ kind: "significado", text: t });
  if (subs.length > 3) lines.push({ kind: "significado", text: `Y ${subs.length - 3} cambios más (marcados arriba)` });
  if (!lines.length) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1.5 text-sm font-bold" aria-label="Qué cambiar">
      {lines.map((l, i) => (
        <li key={i} className="flex items-center gap-2">
          <ErrorIcon kind={l.kind} size={22} />
          {l.text}
        </li>
      ))}
    </ul>
  );
}

export type Why = { term: string; meaning: string; def?: string; note?: string; errors?: string; confuse?: string[]; picked?: Alt; ex?: { en: string; es: string } };

/**
 * «¿Por qué?»: explica la respuesta solo con datos del contenido (significado, definición, notas de uso,
 * errores típicos, confusiones frecuentes y qué significaba la opción elegida). Incluye un mini refuerzo.
 */
export function WhyPanel({ why, defaultOpen = false }: { why: Why; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [quiz, setQuiz] = useState<null | boolean>(null);
  const opts = useMemo(() => (why.picked ? [why.term, why.picked.term].sort() : []), [why]);
  return (
    <div className="mt-2">
      <button type="button" className="inline-flex items-center gap-1.5 text-sm font-black underline underline-offset-4" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <HelpCircle size={16} aria-hidden /> {open ? "Ocultar explicación" : "¿Por qué?"}
      </button>
      {open && (
        <div className="why-panel fade-up">
          <p>
            <b lang="en">{why.term}</b> = {why.meaning}
            {why.def && (
              <span className="block text-sm text-muted" lang="en">
                {why.def}
              </span>
            )}
          </p>
          {why.picked && why.picked.term !== why.term && (
            <p className="flex items-start gap-2">
              <ErrorIcon kind="significado" size={22} />
              <span>
              Elegiste <b lang="en">{why.picked.term}</b>, que significa «{why.picked.es}»: no es lo que pide la frase.
              </span>
            </p>
          )}
          {why.note && <p>{why.note}</p>}
          {why.errors && <p>Error frecuente: {why.errors}</p>}
          {why.confuse?.length ? <p>No lo confundas con: {why.confuse.join(" · ")}</p> : null}
          {why.ex && (
            <div className="flex items-start gap-2">
              <AudioButton text={why.ex.en} />
              <p>
                <span lang="en" className="font-bold">
                  {why.ex.en}
                </span>
                <span className="block text-sm text-muted">{why.ex.es}</span>
              </p>
            </div>
          )}
          {why.picked && why.picked.term !== why.term && why.ex && (
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="text-sm font-bold">Refuerzo: ¿cuál significa «{why.meaning}»?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {opts.map((o) => (
                  <button key={o} type="button" className="chip-btn" lang="en" disabled={quiz !== null} onClick={() => (setQuiz(o === why.term), playSfx(o === why.term ? "ok" : "bad"))}>
                    {o}
                  </button>
                ))}
              </div>
              {quiz !== null && <p className={`mt-1 text-sm font-black ${quiz ? "text-good" : "text-bad"}`}>{quiz ? "¡Eso es!" : `Es «${why.term}».`}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Emparejar expresiones con su significado (práctica; no cambia el calendario de repasos). */
export function MatchPairs({ pairs, onDone }: { pairs: { id: string; en: string; es: string }[]; onDone: (errors: number) => void }) {
  const [[left, right]] = useState(() => [[...pairs].sort(() => Math.random() - 0.5), [...pairs].sort(() => Math.random() - 0.5)]);
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [bad, setBad] = useState<string | null>(null);
  const [errors, setErrors] = useState(0);
  const pick = (id: string) => {
    if (!sel) return;
    if (id === sel) {
      setDone((d) => [...d, id]);
      setSel(null);
      playSfx("ok");
      if (done.length + 1 === pairs.length) setTimeout(() => onDone(errors), 500);
    } else {
      setBad(id);
      setErrors((e) => e + 1);
      playSfx("bad");
      setTimeout(() => setBad(null), 450);
    }
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2" role="group" aria-label="Expresiones">
        {left.map((p) => (
          <button key={p.id} type="button" lang="en" disabled={done.includes(p.id)} aria-pressed={sel === p.id} className={`match-tile ${sel === p.id ? "is-sel" : ""} ${done.includes(p.id) ? "is-done" : ""}`} onClick={() => setSel(p.id)}>
            {p.en}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2" role="group" aria-label="Significados">
        {right.map((p) => (
          <button key={p.id} type="button" disabled={done.includes(p.id) || !sel} className={`match-tile ${done.includes(p.id) ? "is-done" : ""} ${bad === p.id ? "animate-shake" : ""}`} onClick={() => pick(p.id)}>
            {p.es}
          </button>
        ))}
      </div>
    </div>
  );
}
