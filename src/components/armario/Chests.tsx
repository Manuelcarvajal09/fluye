"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Mascot } from "../Mascot";
import { Burst } from "../Burst";
import { IcoGem } from "../Icons";
import { opKey } from "../wallet";
import { centerOf, post } from "./api";
import { playSfx } from "@/lib/audio/sfx";
import { CHESTS, TIERS, chestPool, dupRefund, petOf, pieceOf, type Mood, type Tier } from "@/lib/wardrobe";
import { wearOf, type Look } from "@/lib/look";

export type Outcome = { outcome: "empty" | "new" | "dup"; tier: Tier | null; type?: "piece" | "pet"; id?: string; name?: string; refund: number };
const CHEST_COLORS = [
  ["#ae7957", "#dfad78"],
  ["#5f8f72", "#9fcf9b"],
  ["#7d68a3", "#bea7d8"],
] as const;
export const TIER_COLOR = ["#7c9a8e", "#3f9be8", "#9b6cf0", "#f5b31b"] as const;

/** Cofres: probabilidades visibles antes de comprar, regla de repetidos explicada y modo de prueba sin cobro. */
export function Chests({ look, gems, onGot }: { look: Look; gems: number; onGot: (inventoryKey: string) => void }) {
  const [scene, setScene] = useState<{ chest: number; result: Outcome; test: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [testChest, setTestChest] = useState(0);
  const [testOut, setTestOut] = useState("new-3");

  async function open(i: number, el: HTMLElement) {
    setBusy(true);
    setErr("");
    const c = CHESTS[i];
    const j = await post("/api/shop", { action: "chest", chest: c.id, key: opKey() }, { reason: `Abriste un ${c.name.toLowerCase()}`, from: centerOf(el) });
    setBusy(false);
    if (!j.ok) return setErr(j.error ?? "No se pudo abrir.");
    const r = j as unknown as Outcome;
    setScene({ chest: i, result: r, test: false });
    if (r.outcome === "new" && r.id) onGot(r.type === "pet" ? `pet-${r.id}` : `pz-${r.id}`);
  }
  function test() {
    const [kind, t] = testOut.split("-");
    const tier = t ? (Number(t) as Tier) : null;
    const pool = tier === null ? [] : chestPool(tier);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const name = pick ? (pick.type === "pet" ? petOf(pick.id)!.label : pieceOf(pick.id)!.name) : undefined;
    setScene({ chest: testChest, test: true, result: { outcome: kind as Outcome["outcome"], tier, type: pick?.type, id: pick?.id, name, refund: kind === "dup" ? dupRefund(CHESTS[testChest]) : 0 } });
  }

  return (
    <section className="flex flex-col gap-5">
      <p className="text-muted">
        Cada cofre da un premio al azar: puede salir vacío, una pieza o una mascota de cualquier rareza. <b className="text-text">Si sale algo que ya tienes</b>, se queda una sola copia y te devolvemos <b className="text-text">la mitad de lo que pagaste</b>. Abrir un cofre siempre cuesta menos que comprar la pieza.
      </p>
      {err && (
        <p role="alert" className="rounded-[var(--r-md)] bg-bad-soft px-4 py-2 font-bold text-bad">
          {err}
        </p>
      )}
      <ul className="grid gap-4 md:grid-cols-3">
        {CHESTS.map((c, i) => (
          <li key={c.id} className="module flex flex-col items-center gap-3 p-5">
            <ChestArt i={i} size={120} />
            <h2 className="font-display text-2xl font-black">{c.name}</h2>
            <table className="w-full text-sm">
              <caption className="sr-only">Probabilidades del {c.name}</caption>
              <tbody>
                {["Vacío", ...TIERS].map((label, k) => (
                  <tr key={label} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="py-1 text-left font-bold">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: k ? TIER_COLOR[k - 1] : "var(--line)" }} aria-hidden />
                      {label}
                    </th>
                    <td className="py-1 text-right font-black tabular-nums">{c.odds[k]} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted">Repetido: te devolvemos {dupRefund(c)} gemas.</p>
            <button type="button" className="btn btn-accent w-full" disabled={busy || gems < c.price} onClick={(e) => open(i, e.currentTarget)} aria-label={`Abrir ${c.name} por ${c.price} gemas`}>
              Abrir por <IcoGem size={18} /> {c.price}
            </button>
          </li>
        ))}
      </ul>

      <details className="module p-4">
        <summary className="cursor-pointer font-black">Modo de prueba (no cobra ni entrega nada)</summary>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-bold">
            Cofre
            <select className="h-11 rounded-[var(--r-sm)] border border-line bg-surface px-3" value={testChest} onChange={(e) => setTestChest(Number(e.target.value))}>
              {CHESTS.map((c, i) => (
                <option key={c.id} value={i}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            Resultado
            <select className="h-11 rounded-[var(--r-sm)] border border-line bg-surface px-3" value={testOut} onChange={(e) => setTestOut(e.target.value)}>
              <option value="empty">Vacío</option>
              {TIERS.map((t, k) => (
                <option key={t} value={`new-${k}`}>
                  Nuevo · {t}
                </option>
              ))}
              {TIERS.map((t, k) => (
                <option key={`d${t}`} value={`dup-${k}`}>
                  Repetido · {t}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-ghost" onClick={test}>
            Ver animación
          </button>
        </div>
      </details>

      {scene && <ChestScene look={look} chest={scene.chest} result={scene.result} test={scene.test} onClose={() => setScene(null)} />}
    </section>
  );
}

export function ChestArt({ i, size = 96, open = false, glow }: { i: number; size?: number; open?: boolean; glow?: string }) {
  const [base, lid] = CHEST_COLORS[i] ?? CHEST_COLORS[0];
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 120 96" aria-hidden className="overflow-visible">
      <ellipse cx="60" cy="88" rx="44" ry="5" fill="rgb(25 35 55 / .14)" />
      {glow && <ellipse cx="60" cy="40" rx="36" ry="22" fill={glow} opacity=".55" className="chest-glow" />}
      <rect x="16" y="40" width="88" height="44" rx="10" fill={base} />
      <path d="M30 42v40M90 42v40" stroke="#ffe7a6" strokeWidth="6" />
      <g className={`chest-lid ${open ? "is-open" : ""}`} style={{ transformOrigin: "16px 44px" }}>
        <path d="M14 46q0-30 16-30h60q16 0 16 30v4H14z" fill={lid} />
        <path d="M30 17v33M90 17v33" stroke="#ffe7a6" strokeWidth="6" />
      </g>
      <rect x="50" y="42" width="20" height="18" rx="6" fill="#ffd36b" />
      <circle cx="60" cy="51" r="3" fill="#8a5428" />
    </svg>
  );
}

/**
 * Escena de apertura: la mascota se acerca, el cofre tiembla (más tiempo y más luz cuanto mayor la rareza), se abre,
 * aparece el premio y la mascota reacciona. Vacío y repetido tienen su propia animación y mensaje.
 */
export function ChestScene({ look, chest, result, test, onClose }: { look: Look; chest: number; result: Outcome; test: boolean; onClose: () => void }) {
  const reduced = typeof window !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced");
  const [phase, setPhase] = useState<"walk" | "shake" | "open" | "done">(reduced ? "done" : "walk");
  const close = useRef<HTMLButtonElement>(null);
  const tier = result.tier ?? 0;
  const color = result.outcome === "empty" ? "#b8c2cc" : TIER_COLOR[tier];
  useEffect(() => {
    if (reduced) return;
    const shake = 600 + tier * 350;
    const t1 = setTimeout(() => setPhase("shake"), 700);
    const t2 = setTimeout(() => (setPhase("open"), playSfx(result.outcome === "empty" ? "bad" : "level")), 700 + shake);
    const t3 = setTimeout(() => setPhase("done"), 700 + shake + 900);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [reduced, tier, result.outcome]);
  useEffect(() => {
    if (phase === "done") close.current?.focus();
  }, [phase]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const mood: Mood = phase === "walk" ? "happy" : phase === "shake" ? "wow" : result.outcome === "empty" ? "oops" : result.outcome === "dup" ? "think" : tier >= 3 ? "proud" : "cheer";
  const opened = phase === "open" || phase === "done";
  const title = result.outcome === "empty" ? "Esta vez salió vacío" : result.outcome === "dup" ? "¡Repetido!" : tier >= 3 ? "¡LEGENDARIO!" : `¡${TIERS[tier]}!`;
  const text =
    result.outcome === "empty"
      ? "No pasa nada: el siguiente puede traer algo especial."
      : result.outcome === "dup"
        ? `Ya tenías ${result.name}. Conservas una copia y recuperas ${result.refund} gemas.`
        : `${result.name} ${result.type === "pet" ? "se une a tu equipo" : "ya está en tu armario"}.`;
  const itemSrc = result.type === "pet" ? `/mascots/${result.id}-happy.webp` : `/armario/items/${result.id}.webp`;

  return (
    <div className="scene-backdrop" role="dialog" aria-modal="true" aria-label="Abriendo cofre">
      <div className={`chest-stage tier-glow-${result.outcome === "empty" ? "x" : tier}`} style={{ ["--glow" as string]: color }}>
        <button ref={close} type="button" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-surface/80" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        {test && <p className="absolute left-4 top-4 rounded-full bg-surface px-3 py-1 text-xs font-black text-muted">Vista de prueba</p>}
        <div className="relative flex h-60 items-end justify-center gap-2">
          <span className={`chest-walker ${phase === "walk" ? "is-walking" : ""}`}>
            <Mascot species={look.species} wear={wearOf(look)} mood={mood} size={130} animate="none" fx={phase === "done"} decorative />
          </span>
          <span className={`relative ${phase === "shake" ? `chest-shake chest-shake-${tier}` : ""}`}>
            {opened && result.outcome !== "empty" && <span className="chest-rays" aria-hidden />}
            {opened && result.outcome !== "empty" && <Burst kind={tier >= 2 ? "mix" : "stars"} count={8 + tier * 6} spread={90 + tier * 25} size={14 + tier * 2} />}
            {opened && result.outcome === "empty" && <span className="chest-dust" aria-hidden />}
            <ChestArt i={chest} size={150} open={opened} glow={phase === "shake" || opened ? color : undefined} />
            {opened && result.outcome !== "empty" && result.id && (
              // eslint-disable-next-line @next/next/no-img-element -- premio
              <img src={itemSrc} alt="" className={`chest-prize ${result.outcome === "dup" ? "is-dup" : ""}`} />
            )}
          </span>
        </div>
        <div className="min-h-28 text-center" aria-live="polite">
          {phase === "done" && (
            <div className="fade-up flex flex-col items-center gap-1">
              {result.outcome !== "empty" && <span className="tier-chip" style={{ background: color, color: "#fff" }}>{TIERS[tier]}</span>}
              <p className="font-display text-3xl font-black">{title}</p>
              <p className="max-w-sm font-bold text-muted">{text}</p>
              {result.outcome === "dup" && (
                <p className="flex items-center gap-1 font-black text-good">
                  +{result.refund} <IcoGem size={18} />
                </p>
              )}
            </div>
          )}
        </div>
        <button type="button" className="btn btn-primary w-full" onClick={onClose} disabled={phase !== "done"}>
          {phase === "done" ? "Seguir" : "Abriendo…"}
        </button>
      </div>
    </div>
  );
}
