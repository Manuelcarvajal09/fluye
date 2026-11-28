"use client";
import { ART } from "@/generated/ux-art/celebra";
import { Mascot } from "../Mascot";
import { UxThemed } from "./art";

const W = 280; // el dibujo mide 600×600
const K = W / 600;
const M = 150;
/** Escena de celebración al terminar: tarima, rayos y serpentinas, con la mascota celebrando en el centro. */
export function Celebration({ species, wear }: { species: string; wear: string[] }) {
  return (
    <div className="ux-anim ux-celebra relative" style={{ width: W, height: W }} aria-hidden>
      <UxThemed light={ART["celebracion-claro"]} dark={ART["celebracion-oscuro"]} className="absolute inset-0" />
      {/* Hueco de Codex: centro x = 300, línea de apoyo y = 443. */}
      <span className="ux-celebra-pet absolute" style={{ left: 300 * K - M / 2, top: 443 * K - M }}>
        <Mascot species={species} wear={wear} mood="cheer" size={M} animate="hop" decorative />
      </span>
    </div>
  );
}
