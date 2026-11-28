import { ART } from "@/generated/ux-art/icons";
import { UxArt } from "./art";

export type ErrorKind = "significado" | "orden" | "falta" | "sobra" | "tiempo" | "falso-amigo" | "registro" | "sonido";
/** Icono del tipo de error (32×32, decorativo: el texto va al lado). */
export function ErrorIcon({ kind, size = 22 }: { kind: ErrorKind; size?: number }) {
  return (
    <span className="inline-block shrink-0" style={{ width: size, height: size }}>
      <UxArt svg={ART[`ico-${kind}`]} className="block h-full w-full" />
    </span>
  );
}
