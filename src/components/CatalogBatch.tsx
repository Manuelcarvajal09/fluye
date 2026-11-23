"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

/** Activación gradual: agrega a tus repasos las siguientes palabras más frecuentes que aún no estudias. */
export function CatalogBatch() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function add(count: number) {
    setBusy(true);
    const r = await fetch("/api/learn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "learn-next", count }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? (j.added ? `Listo: ${j.added} palabras nuevas en tus repasos.` : "Ya estudias todas las palabras completas de esta franja.") : "No se pudo agregar.");
    router.refresh();
  }
  return (
    <div className="hero-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-black">Agrega palabras poco a poco</p>
        <p className="text-sm text-muted">Las más frecuentes primero. Así no se acumulan miles de repasos de golpe.</p>
        {msg && (
          <p role="status" className="mt-1 text-sm font-bold text-brand-ink">
            {msg}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {[5, 10, 20].map((n) => (
          <button key={n} type="button" className="btn btn-ghost h-11 min-h-11" disabled={busy} onClick={() => add(n)}>
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Plus size={16} aria-hidden />} {n}
          </button>
        ))}
      </div>
    </div>
  );
}
