"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import type { LearnGoal } from "@/lib/realtalk";

const OPTS: { id: LearnGoal; label: string; hint: string }[] = [
  { id: "understand", label: "Para entenderla", hint: "Solo reconocerla y entenderla de oído." },
  { id: "use", label: "Para usarla", hint: "Producirla y decirla." },
  { id: "both", label: "Ambas", hint: "Entenderla y usarla." },
];

/** Meta por expresión y "Ya la conozco" (una declaración, que no cuenta como dominio). */
export function ItemGoal({ itemId, goal, known, suggestUnderstand }: { itemId: string; goal: LearnGoal; known: boolean; suggestUnderstand: boolean }) {
  const router = useRouter();
  const [g, setG] = useState(goal);
  const [k, setK] = useState(known);
  const post = (body: object) => fetch("/api/learn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId, ...body }) }).then(() => router.refresh());
  return (
    <div className="flex flex-col gap-3 rounded-[var(--r-md)] bg-surface-2 p-4">
      <p className="font-black">¿Para qué la quieres?</p>
      <div className="seg flex-wrap self-start" role="radiogroup" aria-label="Meta de aprendizaje">
        {OPTS.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={g === o.id} title={o.hint} onClick={() => (setG(o.id), void post({ action: "goal", goal: o.id }))}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        {g === "understand" ? "No te pediremos escribirla ni decirla; tu progreso se conserva si cambias de opinión." : OPTS.find((o) => o.id === g)?.hint}
        {suggestUnderstand && g !== "understand" ? " Ojo: es fuerte u ofensiva; úsala solo si sabes con quién." : ""}
      </p>
      <button type="button" aria-pressed={k} className={`btn h-11 min-h-11 self-start ${k ? "btn-accent" : "btn-ghost"}`} onClick={() => (setK(!k), void post({ action: k ? "unknown" : "known" }))}>
        <BadgeCheck size={18} aria-hidden /> {k ? "Marcada como «ya la conozco»" : "Ya la conozco"}
      </button>
    </div>
  );
}
