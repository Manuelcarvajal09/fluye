"use client";
import { ART } from "@/generated/ux-art/empty";
import { Mascot } from "../Mascot";
import { useLook } from "../Coach";
import { wearOf } from "@/lib/look";
import type { Mood } from "@/lib/wardrobe";
import { UxThemed } from "./art";

export type EmptyKind = "vacio-repasos" | "vacio-busqueda" | "vacio-colecciones" | "vacio-amigos" | "vacio-buzon" | "error-conexion";

const W = 260; // ancho mostrado; el dibujo mide 320×240
const K = W / 320;
const M = 104; // lado de la mascota en px
/** Ilustración de estado vacío o de error, con la mascota de la persona en el hueco que deja el dibujo. */
export function EmptyArt({ kind, mood = "happy" }: { kind: EmptyKind; mood?: Mood }) {
  const look = useLook();
  return (
    <div className="ux-anim relative mx-auto" style={{ width: W, height: 240 * K }} aria-hidden>
      <UxThemed light={ART[`${kind}-claro`]} dark={ART[`${kind}-oscuro`]} className="absolute inset-0" />
      {/* Hueco de Codex: centro x = 72, línea de apoyo y = 211 (unidades del dibujo). */}
      <span className="absolute" style={{ left: 72 * K - M / 2, top: 211 * K - M }}>
        <Mascot species={look.species} wear={wearOf(look)} mood={mood} size={M} animate="bob" fx={false} decorative />
      </span>
    </div>
  );
}
