"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, Flame, Gift, Heart, NotebookPen, Trophy, UserPlus, X } from "lucide-react";
import type { Notice } from "@/lib/notifications";

const ICON = { gift: Gift, friend: UserPlus, league: Trophy, journal: NotebookPen, reading: BookOpen, reaction: Heart, streak: Flame } as const;
const KEY = "fluye-notices-seen";

/**
 * Campana de avisos en la cabecera. El punto rojo cuenta solo lo que aún no has visto (se recuerda en este dispositivo);
 * la lista siempre muestra lo que sigue pendiente. Hoja nativa (popover): se cierra con Esc o tocando fuera.
 */
export function Notices({ items }: { items: Notice[] }) {
  const [seen, setSeen] = useState<string[] | null>(null);
  // Lo ya visto se lee tras pintar (en el servidor no hay localStorage), en el siguiente cuadro.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setSeen(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
      } catch {
        setSeen([]);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const fresh = seen ? items.filter((i) => !seen.includes(i.id)).length : 0;
  function markSeen() {
    const ids = items.map((i) => i.id);
    setSeen(ids);
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {}
  }
  return (
    <>
      <button type="button" popoverTarget="avisos" onClick={markSeen} className="stat relative" aria-label={fresh ? `Avisos: ${fresh} nuevos` : `Avisos (${items.length})`}>
        <Bell size={22} className={fresh ? "notice-ring text-text" : "text-muted"} aria-hidden />
        {fresh > 0 && <span className="notice-dot">{fresh}</span>}
      </button>
      <div id="avisos" popover="auto" className="filter-sheet notice-sheet" aria-label="Avisos">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-black">Avisos</h2>
          <button type="button" popoverTarget="avisos" popoverTargetAction="hide" className="btn btn-ghost h-10 w-10 min-h-10 !p-0" aria-label="Cerrar avisos">
            <X size={20} aria-hidden />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-muted">Todo al día. Aquí verás regalos, la liga, amistades y recordatorios.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((n) => {
              const Icon = ICON[n.kind];
              return (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => document.getElementById("avisos")?.hidePopover?.()} className="explore-row !m-0 !items-start !px-3 !py-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                      <Icon size={20} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block leading-snug">{n.title}</b>
                      <span className="block text-sm text-muted">{n.text}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
