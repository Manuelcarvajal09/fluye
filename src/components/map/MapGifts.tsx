"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { ChestArt, ChestScene, type Outcome } from "../armario/Chests";
import { centerOf, post } from "../armario/api";
import { useLook } from "../Coach";
import { IcoGem } from "../Icons";
import { playSfx } from "@/lib/audio/sfx";
import { CHESTS } from "@/lib/wardrobe";

/** Cofre de regalo al final de cada sección del mapa: se abre gratis, una vez, al terminar la sección. */
export function MapChest({ section, chestId, ready, claimed, n }: { section: string; chestId: string; ready: boolean; claimed: boolean; n: number }) {
  const router = useRouter();
  const look = useLook();
  const i = Math.max(0, CHESTS.findIndex((c) => c.id === chestId));
  const [scene, setScene] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(claimed);

  async function claim(el: HTMLElement) {
    setBusy(true);
    setErr("");
    const j = await post("/api/map", { action: "chest", section }, { reason: `Cofre de la sección ${n}`, from: centerOf(el) });
    setBusy(false);
    if (!j.ok) return setErr(j.error ?? "No se pudo abrir.");
    setOpen(true);
    setScene(j as unknown as Outcome);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-3">
        <span className={`map-node map-chest ${open ? "is-done" : ready ? "is-ready" : ""}`} aria-hidden>
          <ChestArt i={i} size={44} open={open} />
        </span>
        <span className="min-w-0">
          <b className="block text-sm">Cofre de la sección</b>
          {open ? (
            <span className="block text-xs text-muted">Abierto</span>
          ) : ready ? (
            <button type="button" className="btn btn-accent mt-1 h-9 min-h-9 px-3 text-xs" disabled={busy} onClick={(e) => void claim(e.currentTarget)}>
              Abrir gratis
            </button>
          ) : (
            <span className="block text-xs text-muted">Termina las paradas de esta sección para abrirlo gratis.</span>
          )}
        </span>
      </div>
      {err && (
        <p role="alert" className="text-xs font-bold text-bad">
          {err}
        </p>
      )}
      {scene && (
        <ChestScene
          look={look}
          chest={i}
          result={scene}
          test={false}
          onClose={() => {
            setScene(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Trofeo de la isla: gemas una sola vez al completar todas sus paradas. */
export function MapTrophy({ level, gems, ready, claimed, name }: { level: string; gems: number; ready: boolean; claimed: boolean; name: string }) {
  const router = useRouter();
  const [got, setGot] = useState(claimed);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function claim(el: HTMLElement) {
    setBusy(true);
    const j = await post("/api/map", { action: "trophy", level }, { reason: `Trofeo · ${name}`, from: centerOf(el) });
    setBusy(false);
    if (!j.ok) return setMsg({ ok: false, text: j.error ?? "No se pudo recoger." });
    setGot(true);
    playSfx("level");
    setMsg({ ok: true, text: `¡+${gems} gemas! Completaste la ${name}.` });
    router.refresh();
  }

  return (
    <div className={`map-trophy ${got ? "is-done" : ready ? "is-ready" : ""}`}>
      <span className="map-trophy-cup" aria-hidden>
        <Trophy size={34} />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block">Trofeo de la isla {level}</b>
        {got ? (
          <span className="block text-sm text-muted">Recogido</span>
        ) : ready ? (
          <button type="button" className="btn btn-primary mt-1 h-10 min-h-10 px-4 text-sm" disabled={busy} onClick={(e) => void claim(e.currentTarget)}>
            Recoger <IcoGem size={14} /> {gems}
          </button>
        ) : (
          <span className="block text-sm text-muted">
            Completa todas las paradas para ganar <IcoGem size={12} /> {gems}.
          </span>
        )}
        {msg && (
          <p role="status" className={`mt-1 text-sm font-bold ${msg.ok ? "text-good" : "text-bad"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
