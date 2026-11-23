"use client";
import { useState } from "react";
import type { Say } from "@/lib/motivation";
import { tipSay } from "@/lib/motivation";
import { MyMascot, useLook } from "./Coach";
import { Burst } from "./Burst";

/** Mascota grande con globo. Al tocarla salta y cuenta un consejo. */
export function HeroCoach({ say, seed, compact = false }: { say: Say; seed: number; compact?: boolean }) {
  const look = useLook();
  const [tip, setTip] = useState<Say | null>(null);
  const [n, setN] = useState(0);
  const shown = tip ?? say;
  return (
    <div className={compact ? "flex items-center gap-3" : "flex flex-col items-center gap-3 sm:flex-row sm:gap-5"}>
      <button
        type="button"
        aria-label={`Tocar a ${look.name} para un consejo`}
        onClick={() => {
          setTip(tipSay(seed + n));
          setN((x) => x + 1);
        }}
        className="shrink-0 rounded-3xl focus-visible:outline-offset-4"
      >
        <span key={n} className={n ? "mascot-hop relative inline-block" : "relative inline-block"}>
          {n > 0 && <Burst kind="hearts" count={10} spread={80} size={18} />}
          <MyMascot mood={n ? "cheer" : shown.mood} size={compact ? 84 : 150} animate={n ? "none" : "bob"} />
        </span>
      </button>
      <div className="relative w-full">
        <p className={`relative rounded-3xl border-line bg-surface leading-snug ${compact ? "border px-4 py-3 text-base font-bold" : "border-2 px-5 py-4 text-xl font-extrabold shadow-card sm:text-2xl"}`} role="status">
          <span className="sr-only">{look.name} dice: </span>
          {shown.text}
        </p>
        {compact ? (
          <span aria-hidden className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-line bg-surface" />
        ) : (
          <span aria-hidden className="absolute left-1/2 top-0 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-l-2 border-t-2 border-line bg-surface max-sm:block sm:-left-2 sm:top-1/2 sm:-translate-y-1/2 sm:border-b-2 sm:border-l-2 sm:border-t-0" />
        )}
      </div>
    </div>
  );
}
