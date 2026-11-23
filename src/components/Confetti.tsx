"use client";
import { useState } from "react";

const COLORS = ["#ffd34d", "#ff6b8b", "#4dd0e1", "#9b8cff", "#5eead0", "#ff9f43"];

/** Lluvia de confeti (CSS). Se desactiva con "reducir movimiento". */
export function Confetti({ count = 70 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 220,
      rot: 360 + Math.random() * 720,
      dur: 2.4 + Math.random() * 2.2,
      delay: Math.random() * 0.8,
      color: COLORS[i % COLORS.length],
    })),
  );
  return (
    <div aria-hidden className="motion-reduce:hidden">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: `${p.left}%`, background: p.color, ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg`, ["--dur" as string]: `${p.dur}s`, ["--delay" as string]: `${p.delay}s` }} />
      ))}
    </div>
  );
}
