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
        Cada cofre da un premio al azar: puede salir vacío, una pieza o una mascota de cualquier rareza. <b className="text-text">Si sale algo que ya tienes</b>, se queda una sola copia y te devolvemos <b className="text-text">la mitad de lo que pagaste</b>. El semilla es el más sencillo; el brote y el aurora dan cada vez más probabilidad de premios raros, épicos y legendarios.
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

/**
 * Tres cofres que se distinguen de un vistazo:
 *  - Semilla: madera sencilla con herrajes de hierro y un brote grabado.
 *  - Brote: madera verde con herrajes de latón, esquineras y hojas.
 *  - Aurora: cofre violeta con filigrana dorada, gemas y un cristal en el cierre.
 * `open` levanta la tapa y deja ver el interior; `light` (0–1) es cuánta luz sale por la rendija antes de abrirse.
 */
const CHEST_ART = [
  { body: "#b47a4e", bodyDark: "#8f5c38", lid: "#cf9763", band: "#6f7b86", bandLight: "#a9b4bd", lock: "#8d99a4", inner: "#5b3a22" },
  { body: "#4f8f6a", bodyDark: "#3a7052", lid: "#6fb589", band: "#d9a441", bandLight: "#f6d98a", lock: "#f0c35a", inner: "#234a35" },
  { body: "#6d55b8", bodyDark: "#513d94", lid: "#8d74d8", band: "#f2c14e", bandLight: "#ffe9a8", lock: "#ffd76a", inner: "#2c2060" },
] as const;

export function ChestArt({ i, size = 96, open = false, glow, light = 0 }: { i: number; size?: number; open?: boolean; glow?: string; light?: number }) {
  const k = CHEST_ART[i] ?? CHEST_ART[0];
  const beam = glow ?? "#ffe9a8";
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 120 103" aria-hidden className="overflow-visible">
      <ellipse cx="60" cy="96" rx="44" ry="5" fill="rgb(25 35 55 / .16)" />
      {glow && <ellipse cx="60" cy="48" rx="40" ry="24" fill={glow} opacity=".45" className="chest-glow" />}
      {/* Interior (se ve al abrir) */}
      <path d="M18 52h84v10H18z" fill={k.inner} />
      {open && <path d="M22 54h76l-6 8H28z" fill={beam} opacity=".9" />}
      {/* Luz que escapa por la rendija antes de abrirse */}
      {light > 0 && !open && (
        <g opacity={Math.min(1, light)}>
          <rect x="18" y="49" width="84" height={2 + light * 4} rx="2" fill={beam} />
          <path d={`M24 50 L${14 - light * 10} ${18 - light * 14} L${106 + light * 10} ${18 - light * 14} L96 50z`} fill={beam} opacity={0.22 + light * 0.2} className="chest-leak" />
        </g>
      )}
      {/* Cuerpo */}
      <rect x="16" y="52" width="88" height="40" rx={i === 0 ? 7 : 9} fill={k.body} />
      <rect x="16" y="78" width="88" height="14" rx="7" fill={k.bodyDark} opacity=".55" />
      {i === 0 && <path d="M44 56v34M76 56v34" stroke={k.bodyDark} strokeWidth="1.5" opacity=".6" />}
      <path d="M30 52v40M90 52v40" stroke={k.band} strokeWidth={i === 0 ? 5 : 6} />
      <path d="M28.500 52v40M88.500 52v40" stroke={k.bandLight} strokeWidth="1.500" opacity=".8" />
      {i >= 1 && (
        <g fill={k.band}>
          <path d="M16 84q0 8 8 8h6v-6h-8v-8h-6z" />
          <path d="M104 84q0 8-8 8h-6v-6h8v-8h6z" />
        </g>
      )}
      {i === 2 && (
        <g>
          <path d="M40 72q10-9 20 0t20 0" stroke={k.bandLight} strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="66" r="3" fill="#7fe3c9" />
          <circle cx="96" cy="66" r="3" fill="#ff8fb3" />
        </g>
      )}
      {/* Tapa */}
      <g className={`chest-lid ${open ? "is-open" : ""}`} style={{ transformOrigin: "16px 54px" }}>
        <path d={i === 0 ? "M14 56q0-26 14-26h64q14 0 14 26v2H14z" : "M14 56q0-32 16-32h60q16 0 16 32v2H14z"} fill={k.lid} />
        <path d={i === 0 ? "M20 50q2-15 10-16h60q8 1 10 16z" : "M20 50q2-20 12-21h56q10 1 12 21z"} fill="#fff" opacity=".16" />
        <path d={i === 0 ? "M30 31v27M90 31v27" : "M30 25v33M90 25v33"} stroke={k.band} strokeWidth={i === 0 ? 5 : 6} />
        {i === 0 && <path d="M60 38c-5 0-8 3-8 8 5 0 8-3 8-8zm0 0c5 0 8 3 8 8-5 0-8-3-8-8z" fill={k.bodyDark} opacity=".55" />}
        {i === 1 && (
          <g fill={k.bandLight}>
            <path d="M60 30c-7 0-11 4-11 11 7 0 11-4 11-11zm0 0c7 0 11 4 11 11-7 0-11-4-11-11z" />
            <rect x="59" y="38" width="2" height="12" rx="1" />
          </g>
        )}
        {i === 2 && (
          <g>
            <path d="M38 44q11-12 22 0t22 0" stroke={k.bandLight} strokeWidth="2.200" fill="none" strokeLinecap="round" />
            <path d="M60 22l5 7-5 7-5-7z" fill="#9ff0dd" />
            <path d="M60 22l5 7h-10z" fill="#d7fff5" />
            <circle cx="42" cy="34" r="2.500" fill="#ffd76a" />
            <circle cx="78" cy="34" r="2.500" fill="#ffd76a" />
          </g>
        )}
        <rect x="14" y="54" width="92" height="4" rx="2" fill={k.bodyDark} opacity=".5" />
      </g>
      {/* Cierre */}
      {i === 2 ? (
        <g>
          <rect x="49" y="50" width="22" height="20" rx="7" fill={k.lock} />
          <path d="M60 54l5 6-5 6-5-6z" fill="#7fe3c9" />
          <path d="M60 54l5 6h-10z" fill="#d7fff5" />
        </g>
      ) : (
        <g>
          <rect x="51" y="51" width="18" height="17" rx={i === 0 ? 4 : 6} fill={k.lock} />
          <circle cx="60" cy="58" r="2.600" fill={k.inner} />
          <rect x="59" y="59" width="2" height="5" rx="1" fill={k.inner} />
        </g>
      )}
    </svg>
  );
}

/**
 * Escena de apertura: la mascota se acerca, el cofre tiembla (más tiempo y más luz cuanto mayor la rareza), se abre,
 * aparece el premio y la mascota reacciona. Vacío y repetido tienen su propia animación y mensaje.
 */
export function ChestScene({ look, chest, result, test, onClose }: { look: Look; chest: number; result: Outcome; test: boolean; onClose: () => void }) {
  const reduced = typeof window !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced");
  // Fases: se acerca → tiembla → la luz crece por la rendija (más larga cuanto mayor la rareza) → se abre → sale el premio.
  const [phase, setPhase] = useState<"walk" | "shake" | "charge" | "open" | "reveal" | "done">(reduced ? "done" : "walk");
  const [light, setLight] = useState(0);
  const close = useRef<HTMLButtonElement>(null);
  const empty = result.outcome === "empty";
  const tier = (empty ? 0 : (result.tier ?? 0)) as 0 | 1 | 2 | 3;
  const color = empty ? "#b8c2cc" : TIER_COLOR[tier];
  useEffect(() => {
    if (reduced) {
      playSfx(empty ? "chest-empty" : (`reveal-${tier}` as const));
      return;
    }
    // Tiempos por rareza: normal casi inmediato; raro, épico y legendario alargan un poco la espera (sin exagerar).
    const WALK = 650;
    const shake = 650;
    const charge = empty ? 350 : [450, 850, 1250, 1850][tier];
    const reveal = [260, 380, 520, 720][tier];
    const t0 = WALK;
    const t1 = t0 + shake;
    const t2 = t1 + charge;
    const t3 = t2 + reveal;
    const timers = [
      setTimeout(() => (setPhase("shake"), playSfx("chest-shake")), t0),
      setTimeout(() => (setPhase("charge"), !empty && playSfx(`chest-charge-${tier}` as const)), t1),
      setTimeout(() => (setPhase("open"), playSfx("chest-open")), t2),
      setTimeout(() => (setPhase("reveal"), playSfx(empty ? "chest-empty" : (`reveal-${tier}` as const))), t3),
      setTimeout(() => setPhase("done"), t3 + 900),
    ];
    // La luz de la rendija crece de forma continua durante la carga.
    let raf = 0;
    const start = performance.now() + t1;
    const grow = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - start) / charge));
      setLight(empty ? p * 0.25 : p * (0.55 + tier * 0.15));
      if (now < start + charge) raf = requestAnimationFrame(grow);
    };
    raf = requestAnimationFrame(grow);
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [reduced, tier, empty]);
  useEffect(() => {
    if (phase === "done") close.current?.focus();
  }, [phase]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const mood: Mood = phase === "walk" ? "happy" : phase === "shake" || phase === "charge" ? "wow" : phase === "open" ? "wow" : result.outcome === "empty" ? "oops" : result.outcome === "dup" ? "think" : tier >= 3 ? "proud" : "cheer";
  const opened = phase === "open" || phase === "reveal" || phase === "done";
  const shown = phase === "reveal" || phase === "done";
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
      <div className={`chest-stage tier-glow-${result.outcome === "empty" ? "x" : tier} ${shown && tier === 3 && !empty ? "is-legend" : ""}`} style={{ ["--glow" as string]: color }}>
        <button ref={close} type="button" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-surface/80" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        {test && <p className="absolute left-4 top-4 rounded-full bg-surface px-3 py-1 text-xs font-black text-muted">Vista de prueba</p>}
        <div className="relative flex h-60 items-end justify-center gap-2">
          <span className={`chest-walker ${phase === "walk" ? "is-walking" : ""}`}>
            <Mascot species={look.species} wear={wearOf(look)} mood={mood} size={130} animate="none" fx={phase === "done"} decorative />
          </span>
          <span className={`relative ${phase === "shake" ? "chest-shake" : phase === "charge" ? `chest-shake chest-shake-${tier} chest-charging` : ""}`}>
            {opened && result.outcome !== "empty" && <span className={`chest-rays chest-rays-${tier}`} aria-hidden />}
            {opened && result.outcome !== "empty" && <span className={`chest-beam chest-beam-${tier}`} aria-hidden />}
            {shown && result.outcome !== "empty" && <Burst kind={tier >= 2 ? "mix" : "stars"} count={8 + tier * 6} spread={90 + tier * 25} size={14 + tier * 2} />}
            {opened && result.outcome === "empty" && <span className="chest-dust" aria-hidden />}
            <ChestArt i={chest} size={160} open={opened} light={light} glow={phase === "charge" || opened ? color : undefined} />
            {shown && result.outcome !== "empty" && result.id && (
              // eslint-disable-next-line @next/next/no-img-element -- premio
              <img src={itemSrc} alt="" className={`chest-prize chest-prize-${tier} ${result.outcome === "dup" ? "is-dup" : ""}`} />
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
