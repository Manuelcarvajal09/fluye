import type { Accessory, Outfit, Species } from "@/lib/look";
import { mascotInner, type MSpecies } from "@/lib/mascotSvg";

export type Mood = "happy" | "cheer" | "think" | "oops" | "wow" | "sleep";

/**
 * Mascota de Fluye. El dibujo vive en `src/lib/mascotSvg.ts` (vector original, sin contornos, por capas):
 * por eso se puede recolorear, combinar accesorios (cabeza + cara + cuello + atuendo) y animar por partes
 * (orejas, cola, parpadeo, brazos al celebrar) con las clases `mascot-*` de globals.css.
 */
export function Mascot({
  species = "zorro",
  mood = "happy",
  color = "#f0832f",
  accessory = "none",
  face = "none",
  neck = "none",
  outfit = "none",
  size = 120,
  className = "",
  animate = "bob",
  label,
  decorative = false,
}: {
  species?: Species;
  mood?: Mood;
  color?: string;
  accessory?: Accessory;
  face?: Accessory;
  neck?: Accessory;
  outfit?: Outfit;
  size?: number;
  className?: string;
  animate?: "bob" | "hop" | "none";
  label?: string;
  decorative?: boolean;
}) {
  const html = mascotInner({ species: species as MSpecies, mood, color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#f0832f", head: accessory, face, neck, outfit });
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? `Mascota ${species}` })}
      className={`shrink-0 overflow-visible ${animate === "bob" ? "mascot-bob" : animate === "hop" ? "mascot-hop" : ""} ${className}`}
      // El contenido lo genera nuestro propio módulo de dibujo a partir de valores validados (sin texto de usuario).
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
