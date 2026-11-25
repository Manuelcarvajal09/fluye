"use client";
import { createContext, useContext, type ReactNode } from "react";
import { Mascot, type Mood } from "./Mascot";
import type { Look } from "@/lib/look";
import { DEFAULT_LOOK, wearOf } from "@/lib/look";

const LookCtx = createContext<Look>(DEFAULT_LOOK);
const CelebrateCtx = createContext(true);
export const LookProvider = ({ look, celebrations = true, children }: { look: Look; celebrations?: boolean; children: ReactNode }) => (
  <LookCtx.Provider value={look}>
    <CelebrateCtx.Provider value={celebrations}>{children}</CelebrateCtx.Provider>
  </LookCtx.Provider>
);
export const useLook = () => useContext(LookCtx);
/** Celebraciones (confeti, rayos) activadas; la persona las puede apagar en Ajustes. */
export const useCelebrations = () => useContext(CelebrateCtx);

/** Mascota de la persona con su aspecto elegido. */
export function MyMascot({ mood = "happy", size = 120, className = "", animate }: { mood?: Mood; size?: number; className?: string; animate?: "bob" | "hop" | "none" }) {
  const l = useLook();
  return <Mascot species={l.species} wear={wearOf(l)} mood={mood} size={size} className={className} animate={animate} label={`${l.name}, tu mascota`} />;
}

/** Mascota con globo de texto. */
export function Coach({ text, mood = "happy", size = 96, tone = "neutral", className = "", animate }: { text: string; mood?: Mood; size?: number; tone?: "neutral" | "good" | "bad"; className?: string; animate?: "bob" | "hop" | "none" }) {
  const l = useLook();
  const bg = tone === "good" ? "bg-surface text-good" : tone === "bad" ? "bg-surface text-bad" : "bg-surface text-text";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <MyMascot mood={mood} size={size} animate={animate} className="shrink-0" />
      <div className="relative">
        <p className={`relative rounded-2xl border-2 border-line px-4 py-3 text-lg font-extrabold leading-snug shadow-card ${bg}`}>
          <span className="sr-only">{l.name} dice: </span>
          {text}
        </p>
        <span aria-hidden className="absolute -left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-line bg-surface" />
      </div>
    </div>
  );
}
