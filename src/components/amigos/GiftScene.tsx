"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Mascot } from "../Mascot";
import { Burst } from "../Burst";
import { IcoBoost, IcoGem } from "../Icons";
import { playSfx } from "@/lib/audio/sfx";

export type GiftKind = "letter" | "gems" | "boost";
export type Pet = { species: string; wear: string[]; name: string };

const reducedMotion = () => typeof window !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced");

/** Lo que va dentro del sobre. */
export function GiftContent({ kind, amount, message, big = false }: { kind: GiftKind; amount: number; message?: string; big?: boolean }) {
  if (kind === "letter")
    return (
      <div className={`gift-letter ${big ? "is-big" : ""}`}>
        {big && message ? <p className="whitespace-pre-wrap break-words">{message}</p> : <span aria-hidden className="gift-lines" />}
      </div>
    );
  if (kind === "gems")
    return (
      <div className="flex flex-col items-center">
        <span className="flex -space-x-2">
          <IcoGem size={big ? 44 : 26} />
          <IcoGem size={big ? 54 : 30} />
          <IcoGem size={big ? 44 : 26} />
        </span>
        {big && <b className="mt-1 text-xl">+{amount} gemas</b>}
      </div>
    );
  return (
    <div className="flex flex-col items-center">
      <IcoBoost size={big ? 64 : 34} />
      {big && <b className="mt-1 text-xl">Doble XP · 15 min</b>}
    </div>
  );
}

export function Envelope({ open = false, sealed = false }: { open?: boolean; sealed?: boolean }) {
  return (
    <svg viewBox="0 0 120 84" className="h-full w-full overflow-visible" aria-hidden>
      <rect x="4" y="14" width="112" height="66" rx="9" fill="#ffd9a8" />
      <path d="M4 26l56 34 56-34v50a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" fill="#ffcb8a" />
      <g className={`env-flap ${open ? "is-open" : ""}`} style={{ transformOrigin: "60px 16px" }}>
        <path d="M6 16q0-3 4-3h100q4 0 4 3L60 52z" fill="#f2b06a" />
      </g>
      {sealed && (
        <g className="env-seal">
          <circle cx="60" cy="50" r="11" fill="#ff5a79" />
          <path d="M60 56c-5-3-6.500-6-4.500-8 1.400-1.400 3.500-1 4.500.6 1-1.600 3.100-2 4.500-.6 2 2 .5 5-4.500 8z" fill="#fff" />
        </g>
      )}
    </svg>
  );
}

/**
 * Recorrido animado de un regalo.
 * send: la mascota del remitente mete el regalo en el sobre, lo sella y lo envía.
 * receive: el sobre llega al buzón, la mascota de quien lo recibe lo abre y aparece el regalo con estrellitas.
 */
export function GiftScene({ mode, kind, amount, message, pet, otherName, onDone, onClose, children }: { mode: "send" | "receive"; kind: GiftKind; amount: number; message?: string; pet: Pet; otherName: string; onDone?: () => void; onClose: () => void; children?: React.ReactNode }) {
  const steps = mode === "send" ? (["pack", "seal", "fly", "done"] as const) : (["arrive", "open", "reveal", "done"] as const);
  const [i, setI] = useState(reducedMotion() ? 3 : 0);
  const phase = steps[i];
  const closeRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    if (i >= 3) {
      doneRef.current?.();
      closeRef.current?.focus();
      return;
    }
    const t = setTimeout(() => {
      setI((n) => n + 1);
      if (i === 1) playSfx(mode === "send" ? "ok" : "level");
    }, [900, 750, 850][i]);
    return () => clearTimeout(t);
  }, [i, mode]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const mood = mode === "send" ? (phase === "fly" || phase === "done" ? "cheer" : "happy") : phase === "arrive" ? "wow" : phase === "open" ? "happy" : "cheer";
  const envOpen = mode === "send" ? phase === "pack" : phase === "reveal" || phase === "done";
  const sealed = mode === "send" ? phase !== "pack" : phase === "arrive";
  const title = mode === "send" ? (phase === "done" ? `¡Enviado a ${otherName}!` : phase === "fly" ? "¡Allá va!" : phase === "seal" ? "Sellando…" : "Guardando tu regalo…") : phase === "done" ? `Regalo de ${otherName}` : phase === "arrive" ? "¡Llegó algo a tu buzón!" : "Abriendo…";

  return (
    <div className="scene-backdrop" role="dialog" aria-modal="true" aria-label={mode === "send" ? "Enviando regalo" : "Abriendo regalo"}>
      <div className="gift-stage">
        <button ref={closeRef} type="button" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface/80" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <p className="text-center font-display text-2xl font-black" aria-live="polite">
          {title}
        </p>
        <div className={`gift-floor mode-${mode} phase-${phase}`}>
          <span className="gift-pet">
            <Mascot species={pet.species} wear={pet.wear} mood={mood} size={120} animate="none" decorative />
          </span>
          {mode === "receive" && <span className="gift-box" aria-hidden />}
          <span className="gift-env">
            <Envelope open={envOpen} sealed={sealed} />
            {mode === "send" && phase === "pack" && (
              <span className="gift-item-in">
                <GiftContent kind={kind} amount={amount} />
              </span>
            )}
          </span>
          {mode === "receive" && (phase === "reveal" || phase === "done") && (
            <span className="gift-reveal">
              <Burst kind="stars" count={14} spread={110} size={16} />
              <GiftContent kind={kind} amount={amount} message={message} big={kind !== "letter" || phase === "done"} />
            </span>
          )}
        </div>
        {phase === "done" && <div className="fade-up flex flex-col items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
