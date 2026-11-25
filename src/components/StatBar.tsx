"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IcoBolt, IcoCoin, IcoFlame, IcoFlameOff, IcoGem, IcoHeart, IcoShield } from "./Icons";
import { Logo } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";
import { onWalletChange, seedWallet, setWallet, useWallet, type Change, type Wallet } from "./wallet";

type Field = "streak" | "coins" | "gems" | "lives";
const ICON: Record<Field, (p: { size?: number; className?: string }) => React.ReactNode> = { streak: IcoFlame, coins: IcoCoin, gems: IcoGem, lives: IcoHeart };
const NAME: Record<Field, [string, string]> = { streak: ["día de racha", "días de racha"], coins: ["moneda", "monedas"], gems: ["gema", "gemas"], lives: ["vida", "vidas"] };

/**
 * Cabecera: marca (en móvil), racha, monedas, gemas, vidas y XP, y cambio de tema.
 * Cada cambio de saldo anima su contador, muestra cuánto cambió y por qué, y las piezas ganadas vuelan hacia él.
 */
export function StatBar({ wallet: initial, xp }: { wallet: Wallet; xp: number }) {
  seedWallet(initial);
  const w = useWallet(initial);
  const sig = JSON.stringify(initial);
  // Datos nuevos del servidor (al navegar o refrescar): se publican y animan la diferencia.
  useEffect(() => {
    setWallet(JSON.parse(sig) as Wallet);
  }, [sig]);
  const [bumps, setBumps] = useState<Partial<Record<Field, { d: number; n: number; reason?: string; shielded?: boolean }>>>({});
  const [said, setSaid] = useState("");
  const refs = useRef<Partial<Record<Field, HTMLAnchorElement | null>>>({});
  useEffect(
    () =>
      onWalletChange((c: Change) => {
        const f = c.field as Field;
        if (!(f in ICON)) return;
        setBumps((b) => ({ ...b, [f]: { d: c.delta, n: (b[f]?.n ?? 0) + 1, reason: c.reason, shielded: c.kind === "shielded" } }));
        const [one, many] = NAME[f];
        setSaid(c.kind === "shielded" ? "La protección evitó que perdieras una vida." : `${c.delta > 0 ? "+" : "−"}${Math.abs(c.delta)} ${Math.abs(c.delta) === 1 ? one : many}${c.reason ? `: ${c.reason}` : ""}`);
        if (c.from && c.delta > 0) fly(f, c.from, refs.current[f], Math.min(8, Math.max(3, Math.abs(c.delta))));
      }),
    [],
  );
  const lives = w.lives;
  const stat = (f: Field, href: string, label: string, value: number | string, cls: string, extra?: React.ReactNode) => {
    const Icon = f === "streak" && w.streak <= 0 ? IcoFlameOff : ICON[f];
    const b = bumps[f];
    return (
      <Link ref={(el) => void (refs.current[f] = el)} href={href} className={`stat ${cls} relative`} aria-label={label} title={b?.reason}>
        <span key={b?.n} className={b ? (b.shielded ? "stat-shield" : b.d > 0 ? "stat-up" : "stat-down") : ""}>
          <Icon size={f === "streak" || f === "lives" ? 24 : 22} className={f === "streak" && w.streak > 0 ? "flame" : ""} />
        </span>
        <span key={`v${b?.n}`} className={b ? "stat-num" : ""}>
          {value}
        </span>
        {extra}
        {b && !b.shielded && (
          <span key={`d${b.n}`} className={`stat-delta ${b.d > 0 ? "is-up" : "is-down"}`} aria-hidden>
            {b.d > 0 ? "+" : "−"}
            {Math.abs(b.d)}
          </span>
        )}
      </Link>
    );
  };
  return (
    <div className="statbar">
      <Link href="/hoy" className="mr-auto flex items-center gap-2 font-display text-xl font-black lg:hidden" aria-label="Fluye, ir a Hoy">
        <Logo size={30} /> <span className="max-[419px]:hidden">Fluye</span>
      </Link>
      <div className="flex items-center gap-0.5" role="group" aria-label="Tus contadores">
        {stat("streak", "/progreso", `${w.streak} ${w.streak === 1 ? "día" : "días"} de racha. Ver calendario`, w.streak, "stat-fire")}
        {stat("coins", "/tienda", `${w.coins} monedas. Abrir el armario`, w.coins, "stat-coin")}
        {stat("gems", "/tienda?tab=vidas", `${w.gems} gemas. Usar gemas`, w.gems, "stat-gem")}
        {stat(
          "lives",
          "/tienda?tab=vidas",
          `${lives} vidas${w.shield ? ", con protección activa" : ""}. Ver cómo recuperar vidas`,
          lives,
          "stat-heart",
          w.shield ? (
            <span className="absolute -right-0.5 -top-0.5" aria-hidden>
              <IcoShield size={15} />
            </span>
          ) : null,
        )}
        <Link href="/progreso#rango" className="stat stat-xp max-sm:hidden" aria-label={`${xp} XP en total. Ver rango`}>
          <IcoBolt size={22} /> {xp.toLocaleString("es-MX")}
        </Link>
      </div>
      <ThemeToggle />
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
}

/** Piezas que vuelan desde donde se ganaron hasta su contador. */
function fly(f: Field, from: { x: number; y: number }, to: HTMLElement | null | undefined, n: number) {
  if (!to || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced") return;
  const r = to.getBoundingClientRect();
  const color = f === "coins" ? "#ffc53d" : f === "gems" ? "#7c6cf0" : f === "lives" ? "#ff5a79" : "#ff8a3d";
  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    el.className = "fly-token";
    el.style.background = color;
    el.style.left = `${from.x}px`;
    el.style.top = `${from.y}px`;
    document.body.appendChild(el);
    const dx = r.left + 14 - from.x;
    const dy = r.top + r.height / 2 - from.y;
    const spread = (Math.random() - 0.5) * 80;
    el.animate(
      [
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
        { transform: `translate(calc(-50% + ${spread}px), calc(-50% - 40px)) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)`, opacity: 0.9 },
      ],
      { duration: 700 + i * 70, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" },
    ).onfinish = () => el.remove();
  }
}
