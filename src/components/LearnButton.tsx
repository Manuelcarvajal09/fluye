"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pause, Play } from "lucide-react";
import { Burst, FloatUp } from "./Burst";
import { playSfx } from "@/lib/audio/sfx";

export function LearnButton({ itemId, learning, suspended }: { itemId: string; learning: boolean; suspended: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  async function act(action: "learn" | "suspend" | "resume") {
    setBusy(true);
    await fetch("/api/learn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId, action }) });
    setBusy(false);
    if (action === "learn") {
      setAdded(true);
      playSfx("ok");
    }
    router.refresh();
  }
  if (!learning)
    return (
      <button type="button" disabled={busy} className="btn btn-primary" onClick={() => act("learn")}>
        <Plus size={20} aria-hidden /> Agregar a mis repasos
      </button>
    );
  if (added && learning && !suspended)
    return (
      <span className="relative inline-flex">
        <Burst kind="mix" count={14} spread={80} />
        <FloatUp className="text-accent">¡Agregada!</FloatUp>
        <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => act("suspend")}>
          <Pause size={18} aria-hidden /> Suspender (no mostrar en repasos)
        </button>
      </span>
    );
  return suspended ? (
    <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => act("resume")}>
      <Play size={18} aria-hidden /> Reanudar repasos
    </button>
  ) : (
    <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => act("suspend")}>
      <Pause size={18} aria-hidden /> Suspender (no mostrar en repasos)
    </button>
  );
}
