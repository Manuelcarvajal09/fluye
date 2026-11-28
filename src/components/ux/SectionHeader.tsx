import type { ReactNode } from "react";
import { ART } from "@/generated/ux-art/cab";
import { UxArt } from "./art";

export type HeaderArt = "progreso" | "repaso" | "pronunciacion" | "biblioteca" | "musica" | "ajustes";

/**
 * Cabecera ilustrada de sección. En escritorio el título va sobre la zona libre izquierda del dibujo;
 * en móvil va encima (el dibujo móvil apenas deja margen). La descripción siempre va debajo.
 */
export function SectionHeader({ art, title, children }: { art: HeaderArt; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-extrabold sm:sr-only">{title}</h1>
      <div className={`section-header ux-anim ux-cab-${art}`}>
        <UxArt svg={ART[`cab-${art}-escritorio`]} className="section-header-art max-sm:hidden" />
        <UxArt svg={ART[`cab-${art}-movil`]} className="section-header-art sm:hidden" />
        <p aria-hidden className="section-header-title max-sm:hidden">
          {title}
        </p>
      </div>
      {children}
    </header>
  );
}
