"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { readSavedSession } from "@/lib/sessionSave";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/** Acción principal de Hoy: comenzar, o continuar si hay una sesión interrumpida guardada en este dispositivo. */
export function StartButton({ href }: { href: string }) {
  const saved = useSyncExternalStore(
    subscribe,
    () => {
      const s = readSavedSession();
      return s ? `${s.i}/${s.queue.length}|${s.meta.title ?? ""}` : "";
    },
    () => "",
  );
  if (saved) {
    const [pos, title] = saved.split("|");
    const [i, n] = pos.split("/").map(Number);
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/sesion?reanudar=1" className="btn btn-primary h-15 grow text-lg">
          <RotateCcw size={22} aria-hidden /> Continuar mi sesión
          <span className="rounded-full bg-surface px-2 py-0.5 text-sm text-text">{Math.round((i / n) * 100)} %</span>
        </Link>
        <Link href={href} className="btn btn-ghost h-15">
          Empezar otra
        </Link>
        <span className="sr-only">{title}</span>
      </div>
    );
  }
  return (
    <Link href={href} className="btn btn-primary h-15 w-full text-lg sm:w-auto sm:min-w-72">
      <Play size={22} fill="currentColor" aria-hidden /> Comenzar mi sesión
    </Link>
  );
}
