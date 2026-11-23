"use client";
import { useEffect, useState } from "react";
import { markActive } from "./ActivityTracker";

/** Avisa (sin estorbar) cuando una frase suena con la voz de respaldo del dispositivo porque aún no tiene voz HD. */
export function VoiceNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const h = (e: Event) => {
      markActive();
      if (!(e as CustomEvent<{ fallback: boolean }>).detail?.fallback) return;
      setShow(true);
      clearTimeout(t);
      t = setTimeout(() => setShow(false), 2600);
    };
    window.addEventListener("fluye:voice", h);
    return () => window.removeEventListener("fluye:voice", h);
  }, []);
  if (!show) return null;
  return (
    <p role="status" className="animate-pop pointer-events-none fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-text px-4 py-2 text-xs font-bold text-bg lg:bottom-6">
      Voz de respaldo del dispositivo: esta frase aún no tiene voz HD
    </p>
  );
}
