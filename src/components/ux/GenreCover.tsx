import { ART } from "@/generated/ux-art/gen";
import { UxArt } from "./art";

const MAP: Record<string, string> = { pop: "pop", rnb: "rnb", "r&b": "rnb", rap: "rap", hiphop: "rap", rock: "rock", indie: "indie", electronica: "electronica", electronic: "electronica", funk: "funk", "latin-pop": "pop", "rap-battle": "rap", "flirty-pop": "pop", "pop-funk": "funk" };
/** Portada pequeña del género musical (160×160 en origen). */
export function GenreCover({ genre, size = 48 }: { genre?: string; size?: number }) {
  const k = MAP[(genre ?? "").toLowerCase()] ?? "otros";
  return (
    <span className="inline-block shrink-0" style={{ width: size, height: size }}>
      <UxArt svg={ART[`gen-${k}`]} className="block h-full w-full" />
    </span>
  );
}
