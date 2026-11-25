"use client";
import { newAttemptId } from "@/lib/grading";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Headphones, Mic, BookOpen, PenLine } from "lucide-react";
import type { Example, Item, Mode } from "@/lib/types";
import { plain } from "@/lib/types";
import { speak, autoplayEnabled } from "@/lib/audio/tts";
import { AudioButton, Bar, Highlight, TypeChip } from "./ui";
import { SpeakPanel } from "./SpeakPanel";
import { Burst } from "./Burst";
import { addWallet, setWallet } from "./wallet";
import { playSfx } from "@/lib/audio/sfx";

export type Flash = { item: Item; mode: Mode; ex: Example; intervals: [string, string, string, string] };

const MODE_INFO: Record<Mode, { label: string; icon: React.ReactNode; ask: string }> = {
  recog: { label: "Reconocer", icon: <BookOpen size={16} aria-hidden />, ask: "¿Qué significa?" },
  prod: { label: "Producir", icon: <PenLine size={16} aria-hidden />, ask: "¿Cómo se dice en inglés?" },
  listen: { label: "Escuchar", icon: <Headphones size={16} aria-hidden />, ask: "¿Qué escuchaste y qué significa?" },
  speak: { label: "Hablar", icon: <Mic size={16} aria-hidden />, ask: "Dilo en voz alta y compárate" },
};

const BUTTONS = [
  { g: 1, label: "Otra vez", cls: "btn-bad", key: "1" },
  { g: 2, label: "Difícil", cls: "btn-ghost", key: "2" },
  { g: 3, label: "Bien", cls: "btn-primary", key: "3" },
  { g: 4, label: "Fácil", cls: "btn-accent", key: "4" },
] as const;

export function FlashReview({ cards }: { cards: Flash[] }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const [cheer, setCheer] = useState(0);
  const t0 = useRef(0);
  const c = cards[i];

  useEffect(() => {
    t0.current = Date.now();
    if (c && c.mode === "listen" && autoplayEnabled()) void speak(plain(c.ex.en));
  }, [i, c]);

  const rate = useCallback(
    (g: 1 | 2 | 3 | 4) => {
      if (!c) return;
      void fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Repaso de tarjetas: la persona se autoevalúa tras ver la respuesta (Again = olvidé, Hard = recordé con dificultad).
        // ctx "practice": los aciertos de repaso devuelven vidas (una por cada 8, hasta 3 al día).
        body: JSON.stringify({ itemId: c.item.id, mode: c.mode, grade: g, correct: g > 1, isNew: false, ms: Date.now() - t0.current, attemptId: newAttemptId(), firstTry: true, kind: "self", ctx: "practice" }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!j) return;
          addWallet({ gems: j.gems ?? 0 }, { reason: "Gemas por repasar" });
          if (j.life?.change === "gained") setWallet({ lives: j.life.lives }, { reason: "Recuperaste una vida practicando" });
        })
        .catch(() => {});
      setDone((n) => n + 1);
      if (g >= 3) {
        setCheer((x) => x + 1);
        playSfx("ok");
      }
      setShown(false);
      setI((n) => n + 1);
    },
    [c],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!shown && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) rate(Number(e.key) as 1 | 2 | 3 | 4);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [shown, rate]);

  if (!c)
    return (
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
        <p className="text-5xl" aria-hidden>
          🎯
        </p>
        <h2 className="text-2xl font-black">¡Repasaste {done} tarjetas!</h2>
        <p className="text-muted">Quedaron reprogramadas según tu memoria.</p>
        <div className="flex gap-3">
          <button type="button" className="btn btn-primary" onClick={() => router.refresh()}>
            Buscar más
          </button>
          <Link href="/hoy" className="btn btn-ghost">
            Volver a Hoy
          </Link>
        </div>
      </div>
    );

  const info = MODE_INFO[c.mode];
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="relative">
        {cheer > 0 && <Burst key={cheer} kind="stars" count={8} spread={50} size={14} />}
        <Bar value={i} max={cards.length} color="var(--accent)" label="Progreso del repaso" />
      </div>
      <article className="card flex min-h-80 flex-col gap-4 p-5 sm:p-7" aria-live="polite">
        <div className="flex items-center gap-2 text-sm font-bold text-muted">
          <span className="chip">
            {info.icon} {info.label}
          </span>
          <TypeChip type={c.item.type} />
          <span className="ml-auto">{info.ask}</span>
        </div>

        {/* Frente */}
        {c.mode === "recog" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <AudioButton text={c.item.term} />
              <p className="text-3xl font-black">{c.item.term}</p>
            </div>
            <p lang="en" className="text-lg">
              <Highlight text={c.ex.en} />
            </p>
          </div>
        )}
        {c.mode === "prod" && (
          <div className="flex flex-col gap-2">
            <p className="text-3xl font-black text-brand-ink">{c.item.es}</p>
            <p className="text-lg text-muted">{c.ex.es}</p>
          </div>
        )}
        {c.mode === "listen" && (
          <div className="flex justify-center gap-3 py-4">
            <AudioButton text={plain(c.ex.en)} size="lg" />
            <AudioButton text={plain(c.ex.en)} size="lg" slow />
          </div>
        )}
        {c.mode === "speak" && (
          <div className="flex flex-col gap-3">
            <p lang="en" className="text-2xl font-bold">
              <Highlight text={c.ex.en} />
            </p>
            <p className="text-muted">{c.ex.es}</p>
            <SpeakPanel target={c.ex.en} compact onResult={() => setShown(true)} />
          </div>
        )}

        {/* Reverso */}
        {shown && (
          <div className="animate-pop flex flex-col gap-3 border-t border-line pt-4">
            {c.mode !== "recog" && (
              <div className="flex items-center gap-3">
                <AudioButton text={c.item.term} size="sm" />
                <p className="text-2xl font-black">{c.item.term}</p>
                {c.item.ipa && <span className="font-mono text-muted">{c.item.ipa}</span>}
              </div>
            )}
            {c.mode !== "prod" && <p className="text-2xl font-extrabold text-brand-ink">{c.item.es}</p>}
            {c.mode !== "recog" && c.mode !== "speak" && (
              <p lang="en" className="text-lg">
                <Highlight text={c.ex.en} />
                <span className="block text-base text-muted">{c.ex.es}</span>
              </p>
            )}
            {c.item.note && <p className="rounded-2xl bg-fire-soft p-3 text-sm">{c.item.note}</p>}
          </div>
        )}
      </article>

      {!shown ? (
        <button type="button" className="btn btn-primary w-full" onClick={() => setShown(true)}>
          <Eye size={20} aria-hidden /> Mostrar respuesta
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {BUTTONS.map((b) => (
            <button key={b.g} type="button" className={`btn ${b.cls} h-16 flex-col !gap-0 px-1`} onClick={() => rate(b.g)} aria-keyshortcuts={b.key}>
              <span className="text-sm sm:text-base">{b.label}</span>
              <span className="text-xs font-bold opacity-80">{c.intervals[b.g - 1]}</span>
            </button>
          ))}
        </div>
      )}
      <p className="hidden text-center text-xs text-muted sm:block">Atajos: espacio para voltear · 1–4 para calificar</p>
    </div>
  );
}
