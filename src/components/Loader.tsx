"use client";
import { Mascot } from "./Mascot";
import { useLook } from "./Coach";
import { wearOf } from "@/lib/look";

const LINES = ["Preparando tu práctica", "Calentando la pronunciación", "Ordenando tus tarjetas", "Buscando tu siguiente reto"];

/** Espera completa: la mascota de la persona salta mientras carga. Con "reducir movimiento" se queda quieta. */
export function MascotLoader({ text, full = false }: { text?: string; full?: boolean }) {
  const look = useLook();
  const line = text ?? LINES[new Date().getSeconds() % LINES.length];
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 ${full ? "min-h-dvh" : "min-h-[50vh]"}`}>
      <span className="loader-pet inline-block">
        <Mascot species={look.species} wear={wearOf(look)} size={120} animate="none" fx={false} decorative />
      </span>
      <span className="loader-shadow" aria-hidden />
      <p className="flex items-center gap-2 font-display text-lg font-black text-muted">
        {line}
        <span className="loader-dots" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </p>
    </div>
  );
}

/** Carga dentro de una sección: bloques que imitan el contenido. */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="skel h-10 w-48" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: rows * 2 }, (_, i) => (
          <div key={i} className="skel h-28" />
        ))}
      </div>
    </div>
  );
}
