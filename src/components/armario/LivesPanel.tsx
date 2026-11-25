"use client";
import { useState } from "react";
import Link from "next/link";
import { IcoBoost, IcoCards, IcoCoin, IcoGem, IcoGift, IcoHeart, IcoIce, IcoShield } from "../Icons";
import { opKey, type Wallet } from "../wallet";
import { centerOf, post } from "./api";
import { BOOST, LIVES } from "@/lib/wardrobe";
import { playSfx } from "@/lib/audio/sfx";

/** Vidas, protección (gemas), potenciadores (monedas) y protector de racha. Explica cómo se gana y se gasta cada cosa. */
export function LivesPanel({ wallet: w, freezes: initialFreezes, practice }: { wallet: Wallet; freezes: number; practice: { today: number; earned: number } }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [freezes, setFreezes] = useState(initialFreezes);
  const act = async (body: Record<string, unknown>, ok: string, reason: string, el?: HTMLElement) => {
    setBusy(true);
    const j = await post("/api/shop", { key: opKey(), ...body }, { reason, from: centerOf(el) });
    setBusy(false);
    setMsg(j.ok ? { text: ok, ok: true } : { text: j.error ?? "No se pudo.", ok: false });
    if (j.ok) playSfx("level");
    return !!j.ok;
  };
  const [now] = useState(() => Date.now());
  const boostLeft = w.boostUntil ? Math.max(0, Math.round((new Date(w.boostUntil).getTime() - now) / 60000)) : 0;
  const hearts = Math.max(LIVES.max, w.lives);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {msg && (
        <p role="status" className={`animate-pop rounded-[var(--r-md)] px-4 py-2 font-bold lg:col-span-2 ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
          {msg.text}
        </p>
      )}
      <article className="module flex flex-col gap-3 p-5 lg:col-span-2">
        <h2 className="flex items-center gap-2 font-display text-2xl font-black">
          <IcoHeart size={28} /> Vidas: {w.lives}
        </h2>
        <div className="flex flex-wrap gap-1" aria-hidden>
          {Array.from({ length: hearts }, (_, i) => (
            <IcoHeart key={i} size={34} className={i < w.lives ? "" : "opacity-25 grayscale"} />
          ))}
          {w.shield > 0 && <IcoShield size={34} />}
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li className="rounded-[var(--r-sm)] bg-surface-2 p-3">
            <b>Pierdes una vida</b> con cada error en una lección. Nunca te bloquea: sin vidas puedes seguir estudiando igual.
          </li>
          <li className="rounded-[var(--r-sm)] bg-surface-2 p-3">
            <b>Ganas una vida extra cada día</b> al entrar (puede pasar de {LIVES.max}, hasta {LIVES.bonusCap}).
          </li>
          <li className="rounded-[var(--r-sm)] bg-surface-2 p-3">
            <b>Practicando recuperas vidas:</b> una por cada {LIVES.practiceGoal} aciertos en Repaso, hasta {LIVES.practicePerDay} al día. Hoy: {practice.today}/{LIVES.practiceGoal} · {practice.earned}/{LIVES.practicePerDay} recuperadas.
          </li>
          <li className="rounded-[var(--r-sm)] bg-surface-2 p-3">
            <b>El primer regalo que abres cada día</b> trae una vida extra.
          </li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Link href="/repaso" className="btn btn-primary">
            <IcoCards size={20} /> Repasar para recuperar vidas
          </Link>
          <Link href="/amigos" className="btn btn-ghost">
            <IcoGift size={20} /> Ver mi buzón
          </Link>
        </div>
      </article>

      <article className="module flex flex-col gap-3 p-5">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <IcoShield size={28} /> Protección de vida
        </h2>
        <p className="text-sm text-muted">Se activa con {LIVES.shieldGems} gemas. Tu próximo error en una lección no te quita vida: la protección se consume y te avisamos en ese momento.</p>
        <p className="font-bold">{w.shield ? "Activa: te cubre el próximo error." : "No tienes protección activa."}</p>
        <button type="button" className="btn btn-accent self-start" disabled={busy || w.shield > 0 || w.gems < LIVES.shieldGems} onClick={(e) => act({ action: "shield" }, "Protección activada. Cubre tu próximo error.", "Activaste la protección de vida", e.currentTarget)}>
          Activar por <IcoGem size={18} /> {LIVES.shieldGems}
        </button>
      </article>

      <article className="module flex flex-col gap-3 p-5">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <IcoBoost size={28} /> Potenciadores
        </h2>
        <p className="text-sm text-muted">
          {BOOST.label}: todo el XP que ganes durante {BOOST.minutes} minutos cuenta doble. No cambia tus repasos ni tu calendario de memoria. También puedes regalarlos.
        </p>
        <p className="font-bold">
          Guardados: {w.boosts}
          {boostLeft > 0 && <span className="ml-2 rounded-full bg-good-soft px-2 py-0.5 text-good">Activo · {boostLeft} min</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-accent" disabled={busy || w.coins < BOOST.price} onClick={(e) => act({ action: "boost-buy" }, "Potenciador guardado.", `Compraste: ${BOOST.label}`, e.currentTarget)}>
            Comprar por <IcoCoin size={18} /> {BOOST.price}
          </button>
          <button type="button" className="btn btn-ghost boost-btn" disabled={busy || w.boosts < 1} onClick={(e) => act({ action: "boost-use" }, `¡Doble XP durante ${BOOST.minutes} minutos!`, `Activaste: ${BOOST.label}`, e.currentTarget)}>
            Activar uno
          </button>
        </div>
      </article>

      <article className="module flex flex-col gap-3 p-5 lg:col-span-2">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <IcoIce size={28} /> Protector de racha
        </h2>
        <p className="text-sm text-muted">Si un día no llegas a tu meta, un protector cubre ese día y tu racha sigue. El día se marca como «protegido». Puedes tener 2.</p>
        <p className="font-bold">Tienes {freezes}/2</p>
        <button
          type="button"
          className="btn btn-accent self-start"
          disabled={busy || freezes >= 2 || w.gems < 50}
          onClick={async (e) => {
            if (await act({ action: "freeze" }, "Protector de racha guardado.", "Compraste un protector de racha", e.currentTarget)) setFreezes((f) => Math.min(2, f + 1));
          }}
        >
          Comprar por <IcoGem size={18} /> 50
        </button>
      </article>
    </section>
  );
}
