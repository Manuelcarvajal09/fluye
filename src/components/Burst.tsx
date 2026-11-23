"use client";
import { useState } from "react";

type Kind = "stars" | "hearts" | "mix" | "fire";
const COLORS = { stars: ["#ffd34d", "#ffb703", "#fff3a3"], hearts: ["#ff6b8b", "#ff8fab", "#ffb3c6"], mix: ["#ffd34d", "#ff6b8b", "#9b8cff", "#5eead0"], fire: ["#ff9f43", "#ffd34d", "#ff6b3d"] };

const Star = ({ c }: { c: string }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
    <path d="M12 1.5l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.3 5.7 20.9l1.5-7.1L1.8 8.9 9 8.1z" fill={c} />
  </svg>
);
const Heart = ({ c }: { c: string }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.2 1.7-2 3.2-3.2 5.3-3.2 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill={c} />
  </svg>
);
const Flame = ({ c }: { c: string }) => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
    <path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 13c0-2 1-3.4 2-4.5.2 2 1.2 3 2.2 3C11 8 12 5 12 2z" fill={c} />
  </svg>
);

/**
 * Estallido de estrellas/corazones desde el centro de su contenedor (que debe ser `relative`).
 * Cambia `key` para repetirlo. Desaparece solo; se oculta con "reducir movimiento".
 */
export function Burst({ kind = "mix", count = 12, spread = 70, size = 16, className = "" }: { kind?: Kind; count?: number; spread?: number; size?: number; className?: string }) {
  const [parts] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const d = spread * (0.65 + Math.random() * 0.5);
      const shape = kind === "mix" ? (i % 3 === 0 ? "heart" : "star") : kind === "hearts" ? "heart" : kind === "fire" ? "fire" : "star";
      return { tx: Math.cos(a) * d, ty: Math.sin(a) * d - 10, r: (Math.random() - 0.5) * 140, s: 0.7 + Math.random() * 0.6, delay: Math.random() * 0.08, c: COLORS[kind][i % COLORS[kind].length], shape };
    }),
  );
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 z-10 grid place-items-center motion-reduce:hidden ${className}`}>
      {parts.map((p, i) => (
        <span
          key={i}
          className="burst-part absolute"
          style={{ width: size * p.s, height: size * p.s, ["--tx" as string]: `${p.tx}px`, ["--ty" as string]: `${p.ty}px`, ["--r" as string]: `${p.r}deg`, animationDelay: `${p.delay}s` }}
        >
          {p.shape === "heart" ? <Heart c={p.c} /> : p.shape === "fire" ? <Flame c={p.c} /> : <Star c={p.c} />}
        </span>
      ))}
    </span>
  );
}

/** Texto que sube y se desvanece ("+10 XP"). */
export function FloatUp({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span aria-hidden className={`float-up pointer-events-none absolute left-1/2 top-0 z-20 whitespace-nowrap font-black ${className}`}>
      {children}
    </span>
  );
}
