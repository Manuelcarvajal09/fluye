"use client";
import { useEffect, useMemo, useState } from "react";
import { MOTIFS } from "./motifs";

/**
 * Elementos de cada temática legendaria: guirnalda arriba, partículas de ambiente detrás del contenido y un adorno de esquina.
 * Todo es decorativo (aria-hidden, sin eventos de puntero) y se queda quieto con «reducir movimiento».
 */
type Particles = { motifs: string[]; kind: "fall" | "rise" | "twinkle" | "drift"; count: number; size: [number, number]; color?: string };
type Decor = { garland?: string[]; garlandKind?: "string" | "papel" | "lights"; papelColors?: string[]; particles?: Particles; corner?: string[] };

const DECOR: Record<string, Decor> = {
  navidad: { garland: ["bauble", "bell", "baubleGreen", "star", "bauble", "candy", "baubleGreen", "bell"], garlandKind: "lights", particles: { motifs: ["snow"], kind: "fall", count: 18, size: [10, 22] }, corner: ["pine", "gift", "bell"] },
  reyes: { garland: ["crown", "star", "rosca", "star", "crown", "tamal"], particles: { motifs: ["sparkle", "star"], kind: "twinkle", count: 14, size: [10, 18] }, corner: ["rosca", "tamal", "crown"] },
  halloween: { garland: ["bat", "pumpkin", "bat", "moon", "bat", "pumpkin"], particles: { motifs: ["bat"], kind: "drift", count: 8, size: [16, 26] }, corner: ["pumpkin", "moon", "candle"] },
  "dia-de-muertos": { garlandKind: "papel", papelColors: ["#e23b8f", "#ff9d1c", "#8a4fd0", "#2ba3c9", "#3fb36a"], particles: { motifs: ["marigold"], kind: "fall", count: 12, size: [12, 20] }, corner: ["skull", "candle", "marigold"] },
  mexico: { garlandKind: "papel", papelColors: ["#006847", "#ffffff", "#ce1126"], particles: { motifs: ["sparkle"], kind: "twinkle", count: 10, size: [10, 16] }, corner: ["star", "sparkle"] },
  "san-valentin": { garland: ["heart", "letter", "heart", "heart", "letter", "heart"], particles: { motifs: ["heart"], kind: "rise", count: 12, size: [10, 20] }, corner: ["letter", "heart", "flower"] },
  otono: { garland: ["maple", "leafGold", "pumpkin", "maple", "leafGold"], particles: { motifs: ["maple", "leafGold"], kind: "fall", count: 14, size: [12, 22] }, corner: ["pumpkin", "maple"] },
  invierno: { particles: { motifs: ["snow"], kind: "fall", count: 22, size: [8, 20] }, corner: ["pine", "snow", "cup"] },
  primavera: { garland: ["flower", "butterfly", "flower", "flower", "butterfly"], particles: { motifs: ["petal", "flower"], kind: "fall", count: 14, size: [10, 18] }, corner: ["flower", "butterfly"] },
  verano: { particles: { motifs: ["sparkle"], kind: "twinkle", count: 10, size: [10, 16] }, corner: ["sun", "watermelon"] },
  chill: { particles: { motifs: ["sparkle"], kind: "drift", count: 6, size: [8, 14] }, corner: ["plant", "vinyl"] },
  "coffee-time": { particles: { motifs: ["bean"], kind: "drift", count: 8, size: [10, 16] }, corner: ["cup", "bean"] },
  neon: { particles: { motifs: ["neonRing", "neonBolt"], kind: "twinkle", count: 10, size: [12, 22] }, corner: ["neonBolt", "neonRing"] },
  aurora: { particles: { motifs: ["sparkle"], kind: "twinkle", count: 16, size: [8, 14] }, corner: ["aurora", "pine"] },
  "noche-estrellada": { particles: { motifs: ["sparkle", "star"], kind: "twinkle", count: 18, size: [8, 16] }, corner: ["moon", "star"] },
  bosque: { garland: ["maple", "pine", "maple", "pine", "maple"], particles: { motifs: ["maple"], kind: "fall", count: 10, size: [12, 20] }, corner: ["pine", "moose", "maple"] },
};

/** Motivos representativos de una temática (para su vista previa en la tienda). */
export const themeMotifs = (id: string) => DECOR[id]?.corner ?? DECOR[id]?.particles?.motifs ?? [];

/** Pseudoaleatorio estable (misma posición en servidor y cliente para cada índice). */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function usePack() {
  const [pack, setPack] = useState<string | null>(null);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setPack(el.dataset.themePack ?? null);
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme-pack"] });
    return () => mo.disconnect();
  }, []);
  return pack;
}

/** Capa de partículas fija detrás del contenido. */
export function ThemeParticles() {
  const pack = usePack();
  const d = pack ? DECOR[pack] : undefined;
  const items = useMemo(() => {
    if (!d?.particles) return [];
    const p = d.particles;
    return Array.from({ length: p.count }, (_, i) => ({
      motif: p.motifs[i % p.motifs.length],
      left: rnd(i, 1) * 100,
      top: rnd(i, 5) * 100,
      size: Math.round(p.size[0] + rnd(i, 2) * (p.size[1] - p.size[0])),
      delay: -rnd(i, 3) * 14,
      dur: 9 + rnd(i, 4) * 9,
    }));
  }, [d]);
  if (!d?.particles) return null;
  const kind = d.particles.kind;
  return (
    <div className={`theme-particles theme-${kind}`} aria-hidden>
      {items.map((it, i) => {
        const Motif = MOTIFS[it.motif];
        return (
          <span key={i} className="theme-particle" style={{ left: `${it.left}%`, top: kind === "fall" || kind === "rise" ? undefined : `${it.top}%`, animationDelay: `${it.delay}s`, animationDuration: `${it.dur}s` }}>
            {Motif ? <Motif size={it.size} /> : null}
          </span>
        );
      })}
    </div>
  );
}

/** Guirnalda colgante arriba de la página (foquitos, papel picado o adornos). */
export function ThemeGarland() {
  const pack = usePack();
  const d = pack ? DECOR[pack] : undefined;
  if (!d || (!d.garland && d.garlandKind !== "papel")) return null;
  if (d.garlandKind === "papel") {
    const colors = d.papelColors ?? ["#e23b8f"];
    const P = MOTIFS.papel;
    return (
      <div className="theme-garland theme-papel" aria-hidden>
        <svg className="theme-garland-cord" viewBox="0 0 100 10" preserveAspectRatio="none">
          <path d="M0 2 Q50 8 100 2" stroke="currentColor" strokeWidth=".6" fill="none" />
        </svg>
        <div className="theme-garland-row">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="theme-swing" style={{ color: colors[i % colors.length], animationDelay: `${-i * 0.3}s`, marginTop: `${Math.sin((i / 11) * Math.PI) * 10}px` }}>
              <P size={30} />
            </span>
          ))}
        </div>
      </div>
    );
  }
  const list = d.garland!;
  return (
    <div className="theme-garland" aria-hidden>
      <svg className="theme-garland-cord" viewBox="0 0 100 10" preserveAspectRatio="none">
        <path d="M0 2 Q50 9 100 2" stroke="currentColor" strokeWidth=".5" fill="none" />
      </svg>
      <div className="theme-garland-row">
        {list.map((m, i) => {
          const Motif = MOTIFS[m];
          const lights = d.garlandKind === "lights";
          return (
            <span key={i} className="theme-swing" style={{ animationDelay: `${-i * 0.4}s`, marginTop: `${Math.sin((i / Math.max(1, list.length - 1)) * Math.PI) * 12}px` }}>
              {lights && i % 2 === 1 ? <span className="theme-light" style={{ color: ["#ffd166", "#ff6b74", "#5fd38d", "#7fb8ff"][i % 4] }}>{MOTIFS.light({ size: 18 })}</span> : null}
              {Motif ? <Motif size={26} /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Adorno de esquina (Hoy): un pequeño grupo de motivos de la temática. */
export function ThemeCorner() {
  const pack = usePack();
  const d = pack ? DECOR[pack] : undefined;
  if (!d?.corner) return null;
  return (
    <div className="theme-corner" aria-hidden>
      {d.corner.map((m, i) => {
        const Motif = MOTIFS[m];
        return (
          <span key={i} className="theme-bob" style={{ animationDelay: `${-i * 0.7}s` }}>
            {Motif ? <Motif size={i === 0 ? 44 : 30} /> : null}
          </span>
        );
      })}
    </div>
  );
}
