"use client";
import { useState } from "react";
import type { Say } from "@/lib/motivation";
import { tipSay } from "@/lib/motivation";
import { MyMascot, useLook } from "./Coach";
import { Burst } from "./Burst";
import { IcoStar } from "./Icons";

/** Compañero de la tarjeta de meta: saluda según el contexto y, al tocarlo, salta y celebra. */
export function HeroCoach({ say }: { say: Say; seed?: number }) {
  const look = useLook();
  const [n, setN] = useState(0);
  return (
    <button type="button" aria-label={`${look.name}, tu compañero. Tócalo para animarlo`} onClick={() => setN((x) => x + 1)} className="goal-mascot shrink-0 focus-visible:outline-offset-4">
      <span key={n} className={n ? "mascot-hop relative inline-block" : "relative inline-block"}>
        {n > 0 && <Burst kind="hearts" count={10} spread={80} size={18} />}
        <MyMascot mood={n ? "cheer" : say.mood === "think" ? "happy" : say.mood} size={132} animate={n ? "none" : "bob"} />
      </span>
    </button>
  );
}

/** Consejo del compañero: empieza con el saludo del día y da otro consejo al pedirlo. */
export function CoachTip({ seed, say }: { seed: number; say?: Say }) {
  const look = useLook();
  const [n, setN] = useState(0);
  const shown = n === 0 && say ? say : tipSay(seed + n);
  return (
    <section className="tip-card" aria-live="polite">
      <span className="mt-0.5 shrink-0">
        <IcoStar size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-black leading-tight">Consejo de {look.name}</h2>
        <p key={n} className="fade-up mt-1 text-sm leading-relaxed">
          {shown.text}
        </p>
        <button type="button" onClick={() => setN((x) => x + 1)} className="mt-2 text-sm font-extrabold text-accent underline-offset-4 hover:underline">
          Otro consejo
        </button>
      </div>
    </section>
  );
}
