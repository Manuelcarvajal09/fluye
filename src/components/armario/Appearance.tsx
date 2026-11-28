"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { IcoGem } from "../Icons";
import { opKey } from "../wallet";
import { post } from "./api";
import { applyThemePack } from "../Prefs";
import { Mascot } from "../Mascot";
import { useLook } from "../Coach";
import { wearOf } from "@/lib/look";
import { MOTIFS } from "../theme/motifs";
import { themeMotifs } from "../theme/ThemeDecor";
import { BACKGROUNDS, THEMES, THEME_PRICE, bgId, bgImage, bgKey, bgPrice, ownsBackground, themeKey } from "@/lib/themes";
import { TIERS } from "@/lib/wardrobe";
import { playSfx } from "@/lib/audio/sfx";

/** Temáticas legendarias (cambian toda la app) y fondos para tu mascota: comprar, aplicar y quitar. */
export function Appearance({ owned, addOwned, gems, allThemes, themePack: initialTheme, background: initialBg }: { owned: Set<string>; addOwned: (k: string) => void; gems: number; allThemes: boolean; themePack: string | null; background: string | null }) {
  const router = useRouter();
  const look = useLook();
  const [theme, setTheme] = useState(initialTheme);
  const [bg, setBg] = useState(initialBg);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const hasTheme = (id: string) => allThemes || owned.has(themeKey(id));

  async function buy(kind: "theme" | "bg", id: string, name: string) {
    setBusy(true);
    const j = await post("/api/shop", { action: "buy", kind, id, key: opKey() }, { reason: `Compraste ${name}` });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo comprar.", ok: false });
    addOwned(kind === "theme" ? themeKey(id) : bgKey(id));
    playSfx("level");
    setMsg({ text: `¡${name} es tuya! Ya puedes aplicarla.`, ok: true });
  }
  async function apply(next: { themePack?: string | null; background?: string | null }) {
    setBusy(true);
    const j = await post("/api/shop", { action: "appearance", ...next });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo aplicar.", ok: false });
    if (next.themePack !== undefined) {
      setTheme(next.themePack);
      applyThemePack(next.themePack);
    }
    if (next.background !== undefined) setBg(next.background);
    setMsg({ text: "Listo.", ok: true });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {msg && (
        <p role="status" className={`rounded-[var(--r-md)] px-4 py-2 font-bold ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
          {msg.text}
        </p>
      )}
      <section className="flex flex-col gap-3" aria-labelledby="tematicas">
        <div>
          <h2 id="tematicas" className="text-xl font-black">
            Temáticas legendarias
          </h2>
          <p className="text-sm text-muted">Cambian los colores y el fondo de toda la app, en modo claro y oscuro. {allThemes ? "Tienes todas desbloqueadas." : `${THEME_PRICE} gemas cada una.`}</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {THEMES.map((t) => {
            const mine = hasTheme(t.id);
            const on = theme === t.id;
            return (
              <li key={t.id} className={`module flex flex-col gap-2 p-4 ${on ? "ring-2 ring-brand" : ""}`}>
                <ThemeMini id={t.id} preview={t.preview} swatch={t.swatch} />
                <p className="flex items-center justify-between gap-2 font-black">
                  {t.name} <span className="chip text-xs">{TIERS[t.rarity]}</span>
                </p>
                <p className="text-xs text-muted">{t.desc}</p>
                {on ? (
                  <button type="button" className="btn btn-on h-10 min-h-10 text-sm" disabled={busy} onClick={() => void apply({ themePack: null })}>
                    <Check size={16} aria-hidden /> En uso · quitar
                  </button>
                ) : mine ? (
                  <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" disabled={busy} onClick={() => void apply({ themePack: t.id })}>
                    Aplicar
                  </button>
                ) : (
                  <button type="button" className="btn btn-accent h-10 min-h-10 text-sm" disabled={busy || gems < THEME_PRICE} onClick={() => void buy("theme", t.id, `Temática ${t.name}`)} aria-label={`Comprar temática ${t.name} por ${THEME_PRICE} gemas`}>
                    <IcoGem size={16} /> {THEME_PRICE}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="fondos">
        <div>
          <h2 id="fondos" className="text-xl font-black">
            Fondos para tu mascota
          </h2>
          <p className="text-sm text-muted">Se ven detrás de tu compañero en el armario y en tu perfil.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {BACKGROUNDS.map((b) => {
            const mine = ownsBackground(b.id, owned);
            const on = !!bg && bgId(bg) === b.id;
            const price = bgPrice(b.id);
            return (
              <li key={b.id} className={`module flex flex-col gap-2 p-3 ${on ? "ring-2 ring-brand" : ""}`}>
                <div className="relative grid aspect-[4/3] place-items-end overflow-hidden rounded-[var(--r-md)] bg-cover bg-center" style={{ backgroundImage: `url(${bgImage(b.id)})` }}>
                  <span className="mx-auto mb-1">
                    <Mascot species={look.species} wear={wearOf(look)} size={64} animate="none" fx={false} decorative />
                  </span>
                </div>
                <p className="flex items-center justify-between gap-1 text-sm font-black">
                  {b.name} <span className="chip text-xs">{TIERS[b.tier]}</span>
                </p>
                {on ? (
                  <button type="button" className="btn btn-ghost h-9 min-h-9 text-xs" disabled={busy} onClick={() => void apply({ background: null })}>
                    <Check size={14} aria-hidden /> En uso · quitar
                  </button>
                ) : mine ? (
                  <button type="button" className="btn btn-primary h-9 min-h-9 text-xs" disabled={busy} onClick={() => void apply({ background: b.id })}>
                    Usar
                  </button>
                ) : (
                  <button type="button" className="btn btn-accent h-9 min-h-9 text-xs" disabled={busy || gems < price} onClick={() => void buy("bg", b.id, `Fondo ${b.name}`)} aria-label={`Comprar fondo ${b.name} por ${price} gemas`}>
                    <IcoGem size={14} /> {price}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Vista previa de una temática: dos mini pantallas (claro y oscuro) con su cabecera, tarjeta, botón y adornos. */
function ThemeMini({ id, preview, swatch }: { id: string; preview?: { l: Record<string, string>; d: Record<string, string> }; swatch: string[] }) {
  const motifs = themeMotifs(id).slice(0, 3);
  if (!preview)
    return (
      <div className="flex h-14 overflow-hidden rounded-[var(--r-md)]" aria-hidden>
        {swatch.map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
    );
  return (
    <div className="theme-mini" aria-hidden>
      {(["l", "d"] as const).map((m) => {
        const p = preview[m];
        return (
          <div key={m} className="theme-mini-screen" style={{ background: p.bg, borderColor: p.line }}>
            <div className="theme-mini-hero" style={{ background: `linear-gradient(135deg, ${p.heroFrom}, ${p.heroTo})` }}>
              <span className="theme-mini-line" style={{ background: p.text, width: "55%" }} />
              <span className="theme-mini-line" style={{ background: p.muted, width: "35%", opacity: 0.7 }} />
              <span className="theme-mini-motifs">
                {motifs.map((k, i) => {
                  const M = MOTIFS[k];
                  return M ? <M key={i} size={i === 0 ? 22 : 15} /> : null;
                })}
              </span>
            </div>
            <div className="theme-mini-card" style={{ background: p.surface, borderColor: p.line }}>
              <span className="theme-mini-line" style={{ background: p.text, width: "70%" }} />
              <span className="theme-mini-pill" style={{ background: p.soft }}>
                <span style={{ background: p.accent }} />
              </span>
              <span className="theme-mini-btn" style={{ background: p.brand }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
