"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Volume2, Turtle } from "lucide-react";
import { speak, autoplayEnabled } from "@/lib/audio/tts";

export function AudioButton({ text, slow = false, label, size = "md", className = "", autoPlayKey, speaker, partner }: { text: string; slow?: boolean; label?: string; size?: "sm" | "md" | "lg"; className?: string; autoPlayKey?: string; speaker?: string; partner?: boolean }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!autoPlayKey || !autoplayEnabled()) return;
    const t = setTimeout(() => void speak(text, { speaker, partner }), 250);
    return () => clearTimeout(t);
    // Solo al cambiar de tarjeta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayKey]);
  const dims = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const icon = size === "lg" ? 30 : size === "sm" ? 18 : 22;
  return (
    <button
      type="button"
      aria-label={label ?? (slow ? "Escuchar despacio" : "Escuchar")}
      onClick={async () => {
        setPlaying(true);
        await speak(text, { rate: slow ? 0.7 : 1, speaker, partner });
        setPlaying(false);
      }}
      className={`btn ${slow ? "btn-ghost" : "btn-accent"} ${dims} shrink-0 !p-0 !rounded-2xl ${playing ? "animate-pulse" : ""} ${className}`}
    >
      {slow ? <Turtle size={icon} aria-hidden /> : <Volume2 size={icon} aria-hidden />}
    </button>
  );
}

/** Pinta el texto entre [corchetes] resaltado; `hide` lo cambia por un hueco. */
export function Highlight({ text, hide = false, reveal }: { text: string; hide?: boolean; reveal?: string }) {
  const parts = text.split(/(\[[^\]]+\])/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[") ? (
          hide ? (
            <span key={i} className={`inline-block min-w-16 rounded-md border-b-4 px-1 text-center ${reveal ? "border-brand font-extrabold text-brand-ink" : "border-muted/50"}`}>
              {reveal ?? "     "}
            </span>
          ) : (
            <mark key={i} className="mark">
              {p.slice(1, -1)}
            </mark>
          )
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function Bar({ value, max, color = "var(--brand)", label, className = "" }: { value: number; max: number; color?: string; label?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-surface-2 ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)}>
      <div className="bar-fill h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, max, size = 120, stroke = 12, color = "var(--brand)", children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle className="ring-draw" cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s ease", ["--ring-from" as string]: c }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function TypeChip({ type }: { type: string }) {
  const map: Record<string, [string, string]> = {
    phrasal: ["Phrasal verb", "bg-accent-soft text-accent"],
    collocation: ["Collocation", "bg-brand-soft text-brand-ink"],
    idiom: ["Idiom", "bg-fire-soft text-fire"],
    vocab: ["Vocabulario", "bg-surface-2 text-muted"],
    phrase: ["Frase", "bg-surface-2 text-text"],
    contraction: ["Habla real", "bg-accent-soft text-accent"],
  };
  const [label, cls] = map[type] ?? [type, ""];
  return <span className={`chip ${cls}`}>{label}</span>;
}
